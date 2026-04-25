import { describe, expect, it } from "vitest";
import {
  eurMWhToSntKWh,
  eurMWhToSntKWhWithVat,
  formatSntKWh,
} from "../elering";
import { calculateComparison } from "../calculator";
import type { CalculatorInput } from "../../types/calculator";
import { mainFusePower3fKw } from "./ev";
import { annualPeakShavingSavingsEur, possibleCutKw, requiredCutKw } from "./peak-shaving";

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
    ...overrides,
  };
}

describe("unit conversions", () => {
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
});
