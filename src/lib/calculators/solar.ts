import { npv, irr, buildCumulative, paybackYears } from "./finance";
import type { CalculatorInput, ComparisonResult, InterpretationKind, ScenarioResult } from "../../types/calculator";
import { clamp, detectPriceUnit, normalizeEurPerKwh, toRatio } from "../units";

export type SolarAssumptions = {
  years: number;
  discountRate: number; // 0.06
  priceGrowthRate: number; // 0.03
  degradationRate: number; // 0.006
  inverterReplacementYear: number; // 12
  inverterReplacementCostEur: number;
  annualMaintenanceEur: number;
};

export type SolarScenarioInput = {
  annualProductionKwh: number;
  annualConsumptionKwh: number;
  selfConsumptionRate: number; // 0..1
  buyPriceEurPerKwh: number; // incl margin + network if desired
  sellPriceEurPerKwh: number;
  investmentEur: number;
};

export type SolarScenarioResult = {
  yearCashflows: number[]; // year1..yearN (undiscounted, real € of year)
  cashflows: number[]; // year0..yearN (year0 negative investment)
  cumulative: number[]; // year0..yearN cumulative
  npvEur: number;
  irr: number | null;
  paybackYears: number | null;
  year1: {
    selfUsedKwh: number;
    exportedKwh: number;
    savingsEur: number;
    exportRevenueEur: number;
    netBenefitEur: number;
  };
};

export function computeSolarScenario(input: SolarScenarioInput, a: SolarAssumptions): SolarScenarioResult {
  const years = Math.max(1, Math.round(a.years));
  const prod0 = Math.max(0, input.annualProductionKwh);
  const cons = Math.max(0, input.annualConsumptionKwh);
  const sc = Math.min(Math.max(input.selfConsumptionRate, 0), 1);

  const selfUsed0 = Math.min(prod0 * sc, cons);
  const exported0 = Math.max(prod0 - selfUsed0, 0);
  const savings0 = selfUsed0 * Math.max(input.buyPriceEurPerKwh, 0);
  const exportRev0 = exported0 * Math.max(input.sellPriceEurPerKwh, 0);
  const net0 = Math.max(savings0 + exportRev0 - Math.max(a.annualMaintenanceEur, 0), 0);

  const yearCashflows: number[] = [];
  const cashflows: number[] = [-Math.max(input.investmentEur, 0)];
  let prod = prod0;

  for (let y = 1; y <= years; y += 1) {
    const growth = (1 + Math.max(a.priceGrowthRate, 0)) ** (y - 1);
    const selfUsed = Math.min(prod * sc, cons);
    const exported = Math.max(prod - selfUsed, 0);
    const savings = selfUsed * input.buyPriceEurPerKwh * growth;
    const exportRev = exported * input.sellPriceEurPerKwh * growth;
    let net = Math.max(savings + exportRev - a.annualMaintenanceEur, 0);

    if (a.inverterReplacementCostEur > 0 && y === a.inverterReplacementYear) {
      net -= a.inverterReplacementCostEur;
    }

    yearCashflows.push(net);
    cashflows.push(net);
    prod *= 1 - Math.max(a.degradationRate, 0);
  }

  const cumulative = buildCumulative(cashflows);
  const npvEur = npv(Math.max(a.discountRate, 0), cashflows);
  const irrValue = irr(cashflows);
  const payback = paybackYears(cumulative);

  return {
    yearCashflows,
    cashflows,
    cumulative,
    npvEur,
    irr: irrValue,
    paybackYears: payback,
    year1: {
      selfUsedKwh: selfUsed0,
      exportedKwh: exported0,
      savingsEur: savings0,
      exportRevenueEur: exportRev0,
      netBenefitEur: net0,
    },
  };
}

const directionFactorMap: Record<CalculatorInput["panelDirection"], number> = {
  louna: 1,
  "ida-laas": 0.93,
  muu: 0.85,
};

const profileFactorMap: Record<CalculatorInput["consumptionProfile"], number> = {
  "kodu-paev": 1.08,
  "tool-ohtul": 0.9,
  ettevote: 1.14,
  kohandatud: 1,
};

function computeScenario(input: CalculatorInput, withBattery: boolean): ScenarioResult {
  const directionFactor = directionFactorMap[input.panelDirection];
  const profileFactor = profileFactorMap[input.consumptionProfile];
  const shadingFactor = clamp(1 - toRatio(input.shadingPercent), 0, 1);
  const tiltPenalty = Math.min(Math.abs(input.tiltDeg - 35) * 0.0025, 0.18);
  const tiltFactor = clamp(1 - tiltPenalty, 0.82, 1.02);
  const directionAndTiltFactor = clamp(directionFactor * tiltFactor, 0.7, 1.02);

  const hasManualProduction = input.annualProductionKwh > 0;
  const specificYield = hasManualProduction
    ? input.annualProductionKwh / Math.max(input.pvPowerKw, 1)
    : clamp(input.specificYieldKwhPerKw || 975, 900, 1050);

  const annualProductionKwh =
    Math.max(input.pvPowerKw, 0) * specificYield * directionAndTiltFactor * shadingFactor;

  if (annualProductionKwh <= 0 || input.annualConsumptionKwh <= 0) {
    return {
      annualProductionKwh: Math.max(annualProductionKwh, 0),
      selfConsumedKwh: 0,
      exportedKwh: 0,
      avoidedGridPurchaseKwh: 0,
      selfConsumptionRatePercent: 0,
      annualSavingsEur: 0,
      annualExportRevenueEur: 0,
      annualNetBenefitEur: 0,
      totalNetBenefitPeriodEur: 0,
      cashflowByYear: Array.from({ length: input.periodYears }, () => 0),
      gridDependenceReductionPercent: 0,
      co2ReductionKgYear: 0,
    };
  }

  const baseSelfConsumptionRate = clamp(
    toRatio(input.selfConsumptionWithoutBatteryPercent) * profileFactor,
    0.05,
    0.98,
  );
  const batteryEfficiency = clamp(
    toRatio(input.batteryEfficiencyPercent || input.batteryRoundTripPercent),
    0.65,
    1,
  );
  const batteryUsableKwh = input.batteryCapacityKwh * toRatio(input.batteryUsablePercent) * batteryEfficiency;
  const batteryBoost = withBattery
    ? clamp(
        toRatio(input.selfConsumptionBoostWithBatteryPercent) +
          clamp((batteryUsableKwh * 280) / Math.max(input.annualConsumptionKwh, 1), 0, 0.22),
        0,
        0.35,
      )
    : 0;
  const selfConsumptionRate = clamp(baseSelfConsumptionRate + batteryBoost, 0.05, 0.98);
  const selfConsumedKwh = Math.min(annualProductionKwh * selfConsumptionRate, input.annualConsumptionKwh);
  const exportedKwh = Math.max(annualProductionKwh - selfConsumedKwh, 0);
  const avoidedGridPurchaseKwh = selfConsumedKwh;

  const energyPrice = normalizeEurPerKwh(
    input.priceSource === "manual" ? input.manualSpotPrice : input.nordPoolAveragePrice,
  );
  const effectiveEnergyPrice =
    energyPrice + normalizeEurPerKwh(input.gridFeePrice) + normalizeEurPerKwh(input.marginPrice);
  const sellBackPrice = normalizeEurPerKwh(input.sellBackPrice);
  const annualSavingsEur = avoidedGridPurchaseKwh * effectiveEnergyPrice;
  const annualExportRevenueEur = exportedKwh * sellBackPrice;
  const annualNetBenefitEur = annualSavingsEur + annualExportRevenueEur - input.annualMaintenanceEur;

  const cashflowByYear: number[] = [];
  let totalNetBenefitPeriodEur = 0;
  let production = annualProductionKwh;
  for (let year = 1; year <= input.periodYears; year += 1) {
    const growth = (1 + toRatio(input.annualPriceGrowthPercent)) ** (year - 1);
    const discount = (1 + toRatio(input.discountRatePercent)) ** year;
    const yearlyBenefit =
      ((production * selfConsumptionRate * effectiveEnergyPrice * growth) +
        (Math.max(production - production * selfConsumptionRate, 0) * sellBackPrice * growth) -
        input.annualMaintenanceEur -
        (year === input.inverterReplacementYear ? input.inverterReplacementCostEur : 0)) /
      discount;
    cashflowByYear.push(yearlyBenefit);
    totalNetBenefitPeriodEur += yearlyBenefit;
    production *= 1 - toRatio(input.degradationPercent);
  }

  const selfConsumptionRatePercent = selfConsumptionRate * 100;
  const gridDependenceReductionPercent = clamp(
    (avoidedGridPurchaseKwh / Math.max(input.annualConsumptionKwh, 1)) * 100,
    0,
    100,
  );
  const co2ReductionKgYear = avoidedGridPurchaseKwh * 0.23;

  return {
    annualProductionKwh,
    selfConsumedKwh,
    exportedKwh,
    avoidedGridPurchaseKwh,
    selfConsumptionRatePercent,
    annualSavingsEur,
    annualExportRevenueEur,
    annualNetBenefitEur,
    totalNetBenefitPeriodEur,
    cashflowByYear,
    gridDependenceReductionPercent,
    co2ReductionKgYear,
  };
}

function interpretationKindFromPayback(paybackYears: number): InterpretationKind {
  if (!Number.isFinite(paybackYears)) return "needs_input";
  if (paybackYears <= 7) return "fast";
  if (paybackYears <= 12) return "moderate";
  return "long";
}

export function calculateSolarComparison(input: CalculatorInput): ComparisonResult {
  const withoutBattery = computeScenario(input, false);
  const withBattery = computeScenario(input, true);
  const selected = input.hasBattery ? withBattery : withoutBattery;

  const totalInvestmentEur =
    input.pvCostEur +
    input.extraInstallCostEur +
    (input.hasBattery ? Math.max(input.batteryCostEur, input.batteryInvestmentEur) : 0) -
    input.supportEur;

  const paybackYears =
    selected.annualNetBenefitEur > 0 ? totalInvestmentEur / selected.annualNetBenefitEur : Number.POSITIVE_INFINITY;

  const batteryAddedValuePeriodEur = withBattery.totalNetBenefitPeriodEur - withoutBattery.totalNetBenefitPeriodEur;
  const effectiveEnergyPrice =
    normalizeEurPerKwh(input.priceSource === "manual" ? input.manualSpotPrice : input.nordPoolAveragePrice) +
    normalizeEurPerKwh(input.gridFeePrice) +
    normalizeEurPerKwh(input.marginPrice);

  const npvEur = selected.cashflowByYear.reduce((sum, yearBenefit) => sum + yearBenefit, 0) - totalInvestmentEur;

  let totalRevenuePeriodEur = 0;
  let production = selected.annualProductionKwh;
  const selfRatio = clamp(selected.selfConsumptionRatePercent / 100, 0, 1);
  for (let year = 1; year <= input.periodYears; year += 1) {
    const growth = (1 + toRatio(input.annualPriceGrowthPercent)) ** (year - 1);
    const benefitUndiscounted =
      production * selfRatio * effectiveEnergyPrice * growth +
      Math.max(production - production * selfRatio, 0) * normalizeEurPerKwh(input.sellBackPrice) * growth -
      input.annualMaintenanceEur -
      (year === input.inverterReplacementYear ? input.inverterReplacementCostEur : 0);
    totalRevenuePeriodEur += benefitUndiscounted;
    production *= 1 - toRatio(input.degradationPercent);
  }

  const baseAnnualBenefit = selected.annualNetBenefitEur;
  const sensitivity = {
    electricityPriceMinus20: baseAnnualBenefit * 0.8,
    electricityPricePlus20: baseAnnualBenefit * 1.2,
    investmentMinus10: totalInvestmentEur * 0.9,
    investmentPlus10: totalInvestmentEur * 1.1,
    yieldMinus10: baseAnnualBenefit * 0.9,
    yieldPlus10: baseAnnualBenefit * 1.1,
  };

  return {
    withoutBattery,
    withBattery,
    selected,
    totalInvestmentEur,
    paybackYears,
    batteryAddedValuePeriodEur,
    interpretationKind: interpretationKindFromPayback(paybackYears),
    effectiveEnergyPrice,
    npvEur,
    totalRevenuePeriodEur,
    sensitivity,
    usedPriceUnit: detectPriceUnit(input.priceSource === "manual" ? input.manualSpotPrice : input.nordPoolAveragePrice),
  };
}

