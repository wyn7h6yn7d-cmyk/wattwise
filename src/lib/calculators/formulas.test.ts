import { describe, expect, it } from "vitest";
import {
  eurMWhToSntKWh,
  eurMWhToSntKWhWithVat,
  eurMWhToEurKWh,
  formatSntKWh,
} from "../elering";
import { calculateComparison } from "../calculator";
import type { CalculatorInput } from "../../types/calculator";
import {
  calculateEvChargeableEnergy,
  calculateEvCharging,
  formatChargingDurationHm,
  mainFusePower3fKw,
} from "./ev";
import {
  annualPeakShavingSavingsEur,
  calculatePeakShaving,
  calculatePeakShavingProjection,
  possibleCutKw,
  requiredCutKw,
} from "./peak-shaving";
import { parseLocaleNumber, toRatio } from "../units";
import { calculateVppCore, calculateVppModel } from "./vpp";
import { calculateElectricityPlan, calculateElectricityPlanSensitivity } from "./electricity-plan";
import { calculateSolarCoreFormulas } from "./solar";

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
  it("core solar formulas follow the requested equations", () => {
    const core = calculateSolarCoreFormulas({
      systemKw: 12,
      yieldKwhPerKw: 975,
      orientationFactor: 0.95,
      shadingPercent: 8,
      selfConsumptionPercent: 55,
      annualConsumptionKwh: 9000,
      purchasePriceEurKwh: 0.18,
      exportPriceEurKwh: 0.07,
      annualMaintenanceCost: 200,
      investment: 13500,
    });

    expect(core.annualProductionKwh).toBeCloseTo(10225.8, 1);
    expect(core.selfConsumedKwh).toBeCloseTo(5624.19, 2);
    expect(core.exportedKwh).toBeCloseTo(4601.61, 2);
    expect(core.annualSavings).toBeCloseTo(1012.3542, 2);
    expect(core.exportRevenue).toBeCloseTo(322.1127, 2);
    expect(core.netBenefit).toBeCloseTo(1134.4669, 2);
    expect(core.paybackYears).toBeCloseTo(11.90, 2);
  });

  it("solar annual net benefit formula gives expected value", () => {
    const result = calculateComparison(baseSolarInput());
    expect(result.selected.annualNetBenefitEur).toBeCloseTo(966.4, 2);
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
    expect(result.paybackYears).toBeNull();
  });
});

describe("EV and peak shaving formulas", () => {
  it("EV 3-phase 16A is about 11 kW", () => {
    expect(mainFusePower3fKw(16)).toBeCloseTo(11.085, 3);
  });

  it("EV charging formulas return expected recommendation fields", () => {
    const result = calculateEvCharging({
      amps: 25,
      phase: "3",
      householdReserveKw: 2,
      energyToChargeKwh: 30,
      chargerKw: 11,
      priceEurKwh: 0.16,
    });

    expect(result.singlePhaseKw).toBeCloseTo(5.75, 3);
    expect(result.threePhaseKw).toBeCloseTo(17.3205, 3);
    expect(result.availableForEvKw).toBeCloseTo(11.8564, 3);
    expect(result.chargingTimeHours).toBeCloseTo(30 / 11, 6);
    expect(result.chargingCost).toBeCloseTo(4.8, 6);
    expect(result.recommendedChargerKw).toBe(11);
    expect(result.fits11Kw).toBe(true);
    expect(result.fits22Kw).toBe(false);
    expect(result.loadManagementRecommended).toBe(true);
    expect(result.warning22Kw).toBe(
      "22 kW laadija eeldab tavaliselt suuremat peakaitset või koormusjuhtimist.",
    );
  });

  it("EV scenario from locale-formatted strings matches kWh / kW and kWh * €/kWh", () => {
    const energy = parseLocaleNumber("30")!;
    const kw = parseLocaleNumber("11")!;
    const price = parseLocaleNumber("0,16")!;
    expect(energy / kw).toBeCloseTo(30 / 11, 6);
    expect(energy * price).toBeCloseTo(4.8, 6);
  });

  it("formatChargingDurationHm formats 30 kWh / 11 kW as 2h 44m", () => {
    const hours = 30 / 11;
    expect(hours).toBeCloseTo(2.7272727, 4);
    expect(formatChargingDurationHm(hours)).toEqual({ hours: 2, minutes: 44 });
  });

  it("parseLocaleNumber examples for EV inputs", () => {
    expect(parseLocaleNumber("0,16")).toBeCloseTo(0.16, 8);
    expect(parseLocaleNumber("11")).toBe(11);
  });

  it("EV chargeable energy formulas are computed in calculator lib", () => {
    const result = calculateEvChargeableEnergy({
      mode: "advanced",
      batteryKwh: 60,
      startSocPct: 20,
      targetSocPct: 80,
      energyToChargeKwh: 0,
      chargerEfficiencyPct: 92,
      chargingLossPct: 8,
    });
    expect(result.chargeableEnergyKwh).toBeCloseTo(36, 6);
    expect(result.gridEnergyKwh).toBeCloseTo((36 / 0.92) * 1.08, 6);
  });

  it("EV quick mode: empty efficiency must not blow up grid kWh (regression)", () => {
    const result = calculateEvChargeableEnergy({
      mode: "quick",
      batteryKwh: 0,
      startSocPct: 0,
      targetSocPct: 0,
      energyToChargeKwh: 30,
      chargerEfficiencyPct: 0,
      chargingLossPct: 0,
    });
    expect(result.gridEnergyKwh).toBeCloseTo(30, 6);
  });

  it("EV manual scenario: 30 kWh, 11 kW, 0.16 €/kWh, 32 A 3f, 2 kW reserve", () => {
    const chargeable = calculateEvChargeableEnergy({
      mode: "quick",
      batteryKwh: 0,
      startSocPct: 0,
      targetSocPct: 0,
      energyToChargeKwh: 30,
      chargerEfficiencyPct: 0,
      chargingLossPct: 0,
    });
    const ev = calculateEvCharging({
      amps: 32,
      phase: "3",
      householdReserveKw: 2,
      energyToChargeKwh: chargeable.gridEnergyKwh,
      chargerKw: 11,
      priceEurKwh: 0.16,
    });
    expect(ev.chargingTimeHours).toBeCloseTo(30 / 11, 5);
    expect(ev.chargingCost).toBeCloseTo(4.8, 5);
    expect(ev.fits11Kw).toBe(true);
    expect(ev.fits22Kw).toBe(false);
  });

  it("peak shaving annual savings are computed correctly", () => {
    const needCut = requiredCutKw(120, 90); // 30
    const possible = possibleCutKw(needCut, 20, 40, 2); // min(30,20,20)=20
    const annual = annualPeakShavingSavingsEur(possible, 6.5); // 20*6.5*12=1560
    expect(needCut).toBe(30);
    expect(possible).toBe(20);
    expect(annual).toBeCloseTo(1560, 6);
  });

  it("peak shaving core formulas return required fields", () => {
    const result = calculatePeakShaving({
      currentPeakKw: 120,
      targetPeakKw: 90,
      batteryKwh: 80,
      usableSocPercent: 75,
      efficiencyPercent: 92,
      batteryPowerKw: 25,
      peakDurationHours: 2,
      demandChargeEurKwMonth: 6.5,
      annualMaintenanceCost: 500,
      investment: 30000,
    });

    expect(result.requiredReductionKw).toBe(30);
    expect(result.usableBatteryEnergyKwh).toBeCloseTo(55.2, 6);
    expect(result.energyLimitedReductionKw).toBeCloseTo(27.6, 6);
    expect(result.possibleReductionKw).toBe(25);
    expect(result.annualSavings).toBeCloseTo(1950, 6);
    expect(result.netSavings).toBeCloseTo(1450, 6);
    expect(result.paybackYears).toBeCloseTo(20.6896, 3);
    expect(result.targetAchievable).toBe(false);
    expect(result.limitingFactor).toBe("aku võimsus");
  });

  it("peak shaving distinguishes limiting factor: battery power vs battery energy", () => {
    const powerLimited = calculatePeakShaving({
      currentPeakKw: 120,
      targetPeakKw: 90,
      batteryKwh: 500,
      usableSocPercent: 90,
      efficiencyPercent: 95,
      batteryPowerKw: 15,
      peakDurationHours: 1,
      demandChargeEurKwMonth: 6.5,
      annualMaintenanceCost: 500,
      investment: 30000,
    });
    const energyLimited = calculatePeakShaving({
      currentPeakKw: 120,
      targetPeakKw: 90,
      batteryKwh: 10,
      usableSocPercent: 60,
      efficiencyPercent: 90,
      batteryPowerKw: 100,
      peakDurationHours: 1,
      demandChargeEurKwMonth: 6.5,
      annualMaintenanceCost: 500,
      investment: 30000,
    });

    expect(powerLimited.limitingFactor).toBe("aku võimsus");
    expect(energyLimited.limitingFactor).toBe("aku maht");
  });

  it("peak shaving payback is null when net savings <= 0", () => {
    const result = calculatePeakShaving({
      currentPeakKw: 120,
      targetPeakKw: 90,
      batteryKwh: 40,
      usableSocPercent: 60,
      efficiencyPercent: 90,
      batteryPowerKw: 10,
      peakDurationHours: 2,
      demandChargeEurKwMonth: 2,
      annualMaintenanceCost: 1000,
      investment: 20000,
    });

    expect(result.netSavings).toBeLessThanOrEqual(0);
    expect(result.paybackYears).toBeNull();
  });

  it("peak shaving projection formulas are computed in calculator lib", () => {
    const result = calculatePeakShavingProjection({
      possibleReductionKw: 25,
      requiredReductionKw: 30,
      peakDurationHours: 2,
      usableSocPercent: 75,
      efficiencyPercent: 92,
      demandChargeEurKwMonth: 6.5,
      annualMaintenanceCost: 500,
      demandFeeGrowthPercent: 3,
      batteryDegradationPercent: 2,
      periodYears: 10,
      investment: 30000,
    });
    expect(result.recommendedBatteryKw).toBe(30);
    expect(result.recommendedBatteryKwh).toBeCloseTo((30 * 2) / (0.75 * 0.92), 6);
    expect(Number.isFinite(result.discountedNetEur)).toBe(true);
  });

  it("peak shaving identifies limiting factor through min-cut logic", () => {
    const needCut = requiredCutKw(120, 90); // 30
    const powerLimited = possibleCutKw(needCut, 20, 200, 1); // power limited
    const energyLimited = possibleCutKw(needCut, 100, 10, 1); // energy limited
    expect(powerLimited).toBe(20);
    expect(energyLimited).toBe(10);
  });

  it("peak shaving UI scenario: 120/90/150/60/2h/6.5 with full SOC+efficiency defaults", () => {
    const result = calculatePeakShaving({
      currentPeakKw: 120,
      targetPeakKw: 90,
      batteryKwh: 150,
      usableSocPercent: 100,
      efficiencyPercent: 100,
      batteryPowerKw: 60,
      peakDurationHours: 2,
      demandChargeEurKwMonth: 6.5,
      annualMaintenanceCost: 0,
      investment: null,
    });
    expect(result.requiredReductionKw).toBe(30);
    expect(result.usableBatteryEnergyKwh).toBeCloseTo(150, 6);
    expect(result.energyLimitedReductionKw).toBeCloseTo(75, 6);
    expect(result.possibleReductionKw).toBeCloseTo(30, 6);
    expect(result.annualSavings).toBeCloseTo(2340, 6);
    expect(result.targetAchievable).toBe(true);
    expect(result.limitingFactor).toBe("eesmärk saavutatud");
    expect(result.paybackYears).toBeNull();
  });

  it("parseLocaleNumber parses peak fee 6,5", () => {
    expect(parseLocaleNumber("6,5")).toBeCloseTo(6.5, 8);
    const fee = parseLocaleNumber("6,5")!;
    expect(30 * fee * 12).toBeCloseTo(2340, 6);
  });

  it("peak shaving: target >= current → no cut, zero savings", () => {
    const result = calculatePeakShaving({
      currentPeakKw: 100,
      targetPeakKw: 100,
      batteryKwh: 150,
      usableSocPercent: 100,
      efficiencyPercent: 100,
      batteryPowerKw: 60,
      peakDurationHours: 2,
      demandChargeEurKwMonth: 6.5,
      annualMaintenanceCost: 0,
      investment: null,
    });
    expect(result.requiredReductionKw).toBe(0);
    expect(result.possibleReductionKw).toBe(0);
    expect(result.annualSavings).toBe(0);
    expect(result.targetAchievable).toBe(true);
  });

  it("peak shaving: low battery power limits cut", () => {
    const result = calculatePeakShaving({
      currentPeakKw: 120,
      targetPeakKw: 90,
      batteryKwh: 500,
      usableSocPercent: 100,
      efficiencyPercent: 100,
      batteryPowerKw: 10,
      peakDurationHours: 2,
      demandChargeEurKwMonth: 6.5,
      annualMaintenanceCost: 0,
      investment: null,
    });
    expect(result.possibleReductionKw).toBeCloseTo(10, 6);
    expect(result.limitingFactor).toBe("aku võimsus");
    expect(result.targetAchievable).toBe(false);
  });

  it("peak shaving: small battery energy limits cut (10 kWh / 2 h)", () => {
    const result = calculatePeakShaving({
      currentPeakKw: 120,
      targetPeakKw: 90,
      batteryKwh: 10,
      usableSocPercent: 100,
      efficiencyPercent: 100,
      batteryPowerKw: 100,
      peakDurationHours: 2,
      demandChargeEurKwMonth: 6.5,
      annualMaintenanceCost: 0,
      investment: null,
    });
    expect(result.energyLimitedReductionKw).toBeCloseTo(5, 6);
    expect(result.possibleReductionKw).toBeCloseTo(5, 6);
    expect(result.limitingFactor).toBe("aku maht");
    expect(result.targetAchievable).toBe(false);
  });

  it("peak shaving: payback null when investment not provided despite positive net", () => {
    const result = calculatePeakShaving({
      currentPeakKw: 120,
      targetPeakKw: 90,
      batteryKwh: 150,
      usableSocPercent: 100,
      efficiencyPercent: 100,
      batteryPowerKw: 60,
      peakDurationHours: 2,
      demandChargeEurKwMonth: 6.5,
      annualMaintenanceCost: 0,
      investment: null,
    });
    expect(result.netSavings).toBeGreaterThan(0);
    expect(result.paybackYears).toBeNull();
  });
});

describe("VPP and electricity plan formulas", () => {
  it("VPP core formulas follow requested equations", () => {
    const result = calculateVppCore({
      batteryKwh: 100,
      batteryKw: 50,
      investment: 60000,
      annualRevenuePotential: 12000,
      roundtripEfficiencyPercent: 92,
      availabilityPercent: 95,
      riskDiscountPercent: 10,
      annualMaintenanceCost: 250,
      lifetimeYears: 10,
    });

    expect(result.grossRevenue).toBeCloseTo(12000, 6);
    expect(result.netRevenue).toBeCloseTo(9189.2, 6);
    expect(result.paybackYears).toBeCloseTo(6.5295, 3);
    expect(result.totalProfit).toBeCloseTo(31892, 3);
    expect(result.conservativeNetRevenue).toBeCloseTo(6432.44, 6);
    expect(result.baseNetRevenue).toBeCloseTo(9189.2, 6);
    expect(result.optimisticNetRevenue).toBeCloseTo(11945.96, 6);
  });

  it("VPP netRevenue <= 0 does not return numeric payback", () => {
    const result = calculateVppCore({
      batteryKwh: 100,
      batteryKw: 50,
      investment: 60000,
      annualRevenuePotential: 1000,
      roundtripEfficiencyPercent: 80,
      availabilityPercent: 70,
      riskDiscountPercent: 60,
      annualMaintenanceCost: 2000,
      lifetimeYears: 10,
    });

    expect(result.netRevenue).toBeLessThanOrEqual(0);
    expect(result.paybackYears).toBeNull();
  });

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

  it("electricity plan includes margin, network, renewable and excise in formulas", () => {
    const result = calculateElectricityPlan({
      mode: "quick",
      monthlyBreakdown: Array.from({ length: 12 }, () => ""),
      monthlyKwh: "100",
      daySharePct: "50",
      nightSharePct: "50",
      spotEurKwh: "0.10",
      fixedEurKwh: "0.12",
      spotMarginEurKwh: "0.01",
      gridFeeEurKwh: "0.04",
      renewableFeeEurKwh: "0.001",
      exciseEurKwh: "0.0015",
      spotMonthlyFeeEur: "2",
      fixedMonthlyFeeEur: "3",
      networkMonthlyFeeEur: "4",
      pricesIncludeVat: true,
    });

    const expectedSpot = 1200 * (0.10 + 0.01 + 0.04 + 0.001 + 0.0015) + (2 + 4) * 12;
    const expectedFixed = 1200 * (0.12 + 0.04 + 0.001 + 0.0015) + (3 + 4) * 12;
    expect(result.spotAnnualCost).toBeCloseTo(expectedSpot, 6);
    expect(result.fixedAnnualCost).toBeCloseTo(expectedFixed, 6);
  });

  it("electricity sensitivity formulas are computed in calculator lib", () => {
    const result = calculateElectricityPlanSensitivity({
      monthlyKwh: 100,
      spotEurKwh: 0.10,
      fixedEurKwh: 0.12,
      spotMarginEurKwh: 0.01,
      gridFeeEurKwh: 0.04,
      pricesIncludeVat: true,
    });
    expect(result.diffLowVsFixed).toBeCloseTo(-36, 6);
    expect(result.diffBaseVsFixed).toBeCloseTo(-12, 6);
    expect(result.diffHighVsFixed).toBeCloseTo(12, 6);
  });
});
