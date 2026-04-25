import { describe, expect, it } from "vitest";
import {
  eurMWhToSntKWh,
  eurMWhToSntKWhWithVat,
  eurMWhToEurKWh,
  formatSntKWh,
} from "../elering";
import { calculateComparison } from "../calculator";
import type { CalculatorInput } from "../../types/calculator";
import { mainFusePower3fKw } from "./ev";
import { annualPeakShavingSavingsEur, possibleCutKw, requiredCutKw } from "./peak-shaving";
import { toRatio } from "../units";
import { calculateVppModel } from "./vpp";
import { calculateElectricityPlan } from "./electricity-plan";

function baseSolarInput(overrides: Partial<CalculatorInput> = {}): CalculatorInput {
  return {
    pvPowerKw: 12,
    annualProductionKwh: 10800,
    inverterPowerKw: 10,
    panelDirection: "louna",
    tiltDeg: 35,
    shadingPercent: 0,
    systemEfficiencyPercent: 92,
    hasBattery: false,
    batteryCapacityKwh: 0,
    batteryUsablePercent: 90,
    batteryPowerKw: 0,
    batteryRoundTripPercent: 92,
    batteryInvestmentEur: 0,
    batteryCostEur: 0,
    annualConsumptionKwh: 9000,
    dailyConsumptionKwh: 24.7,
    consumptionProfile: "tool-ohtul",
    seasonalMultiplierPercent: 100,
    priceSource: "manual",
    manualSpotPrice: 0.12,
    nordPoolAveragePrice: 0.1,
    gridFeePrice: 0.05,
    sellBackPrice: 0.06,
    marginPrice: 0.01,
    annualPriceGrowthPercent: 3,
    discountRatePercent: 4,
    pvCostEur: 12000,
    extraInstallCostEur: 1500,
    supportEur: 0,
    annualMaintenanceEur: 200,
    selfConsumptionWithoutBatteryPercent: 40,
    selfConsumptionBoostWithBatteryPercent: 15,
    degradationPercent: 0.6,
    periodYears: 20,
    location: "",
    specificYieldKwhPerKw: 975,
    inverterReplacementYear: 12,
    inverterReplacementCostEur: 1200,
    batteryEfficiencyPercent: 92,
    ...overrides,
  };
}

describe("unit conversions", () => {
  it("100 €/MWh equals 0.10 €/kWh", () => {
    expect(eurMWhToEurKWh(100)).toBeCloseTo(0.1, 6);
  });

  it("100 €/MWh equals 10 snt/kWh", () => {
    expect(eurMWhToSntKWh(100)).toBeCloseTo(10, 6);
  });

  it("100 €/MWh with VAT equals 12.4 snt/kWh", () => {
    expect(eurMWhToSntKWhWithVat(100)).toBeCloseTo(12.4, 6);
  });

  it("small market price does not round misleadingly to 0", () => {
    expect(formatSntKWh(0.04)).toBe("0,04");
  });
});

describe("solar calculator sanity", () => {
  it("solar annual net benefit formula gives expected value", () => {
    const result = calculateComparison(baseSolarInput());
    expect(result.selected.annualNetBenefitEur).toBeCloseTo(914.56, 2);
  });

  it("self-consumption percent converts both 76 and 0.76 correctly", () => {
    expect(toRatio(76)).toBeCloseTo(0.76, 6);
    expect(toRatio(0.76)).toBeCloseTo(0.76, 6);
  });

  it("12 kW solar setup does not produce million-euro annual savings", () => {
    const result = calculateComparison(baseSolarInput());
    expect(result.selected.annualSavingsEur).toBeLessThan(1_000_000);
  });

  it("net benefit <= 0 does not produce finite payback", () => {
    const result = calculateComparison(
      baseSolarInput({
        pvCostEur: 100000,
        annualMaintenanceEur: 5000,
        manualSpotPrice: 0.03,
        gridFeePrice: 0,
        marginPrice: 0,
        sellBackPrice: 0.01,
      }),
    );
    expect(result.selected.annualNetBenefitEur).toBeLessThanOrEqual(0);
    expect(Number.isFinite(result.paybackYears)).toBe(false);
  });
});

describe("EV and peak shaving formulas", () => {
  it("EV 3-phase 16A is about 11 kW", () => {
    expect(mainFusePower3fKw(16)).toBeCloseTo(11.085, 3);
  });

  it("peak shaving annual savings are computed correctly", () => {
    const needCut = requiredCutKw(120, 90); // 30
    const possible = possibleCutKw(needCut, 20, 40, 2); // min(30,20,20)=20
    const annual = annualPeakShavingSavingsEur(possible, 6.5); // 20*6.5*12=1560
    expect(needCut).toBe(30);
    expect(possible).toBe(20);
    expect(annual).toBeCloseTo(1560, 6);
  });

  it("peak shaving identifies limiting factor through min-cut logic", () => {
    const needCut = requiredCutKw(120, 90); // 30
    const powerLimited = possibleCutKw(needCut, 20, 200, 1); // power limited
    const energyLimited = possibleCutKw(needCut, 100, 10, 1); // energy limited
    expect(powerLimited).toBe(20);
    expect(energyLimited).toBe(10);
  });
});

describe("VPP and electricity plan formulas", () => {
  it("VPP scenario multipliers produce conservative/base/optimistic", () => {
    const model = calculateVppModel({
      capacityKwh: "100",
      powerKw: "50",
      investmentEur: "60000",
      annualRevenueEur: "12000",
      lifetimeYears: "10",
      efficiencyPct: "92",
      cyclesPerYear: "220",
      degradationPct: "2",
      annualOandMEur: "250",
      minimumResidualPct: "10",
      revenueType: "annual",
      arbitrageSpreadEurMwh: "85",
      revenuePerKwYear: "180",
      financingCostPct: "6",
      calculationPeriodYears: "10",
      riskCoefficientPct: "100",
      availabilityPct: "95",
    });
    const conservative = model.perScenario[0].netRevYear1;
    const base = model.perScenario[1].netRevYear1;
    const optimistic = model.perScenario[2].netRevYear1;
    expect(conservative).toBeLessThan(base);
    expect(optimistic).toBeGreaterThan(base);
  });

  it("electricity plan does not add VAT twice", () => {
    const common = {
      mode: "quick" as const,
      monthlyBreakdown: Array.from({ length: 12 }, () => ""),
      monthlyKwh: "400",
      daySharePct: "55",
      nightSharePct: "45",
      spotEurKwh: "0.10",
      fixedEurKwh: "0.12",
      spotMarginEurKwh: "0.01",
      gridFeeEurKwh: "0.04",
      renewableFeeEurKwh: "0.001",
      exciseEurKwh: "0.0015",
      spotMonthlyFeeEur: "2",
      fixedMonthlyFeeEur: "3",
      networkMonthlyFeeEur: "4",
    };
    const withoutVatInPrices = calculateElectricityPlan({ ...common, pricesIncludeVat: false });
    const withVatAlreadyInPrices = calculateElectricityPlan({ ...common, pricesIncludeVat: true });
    expect(withoutVatInPrices.spotAnnualCost / withVatAlreadyInPrices.spotAnnualCost).toBeCloseTo(1.24, 2);
  });
});
