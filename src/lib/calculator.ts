import { CalculatorInput, ComparisonResult, InterpretationKind, ScenarioResult } from "@/types/calculator";

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

/**
 * Accept both percentage input styles:
 * - 76  -> 0.76
 * - 0.76 -> 0.76
 */
const toRatio = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return value <= 1 ? value : value / 100;
};

/**
 * Guard against accidental EUR/MWh values in EUR/kWh fields.
 * Example: 120 (EUR/MWh) -> 0.12 (EUR/kWh)
 */
const normalizeEurPerKwh = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > 3 ? value / 1000 : value;
};

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
  const shadingFactor = clamp(1 - toRatio(input.shadingPercent), 0.6, 1);
  const efficiencyFactor = clamp(toRatio(input.systemEfficiencyPercent), 0.7, 1.05);
  const seasonalFactor = clamp(toRatio(input.seasonalMultiplierPercent), 0.75, 1.35);

  const baseProduction = Math.max(input.annualProductionKwh, input.pvPowerKw * 900);
  const annualProductionKwh = baseProduction * directionFactor * shadingFactor * efficiencyFactor * seasonalFactor;

  // Kui puudub tootmine või tarbimine, ära “sunni” protsente miinimumile — näita 0 ja tühja seisu.
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
    0.08,
    0.95,
  );
  const batteryBoost = withBattery
    ? clamp(toRatio(input.selfConsumptionBoostWithBatteryPercent), 0, 0.35)
    : 0;

  const batteryUsableKwh =
    input.batteryCapacityKwh * toRatio(input.batteryUsablePercent) * toRatio(input.batteryRoundTripPercent);
  const batteryCoverageFactor = withBattery
    ? clamp((batteryUsableKwh * 320) / Math.max(input.annualConsumptionKwh, 1), 0, 0.25)
    : 0;

  const selfConsumptionRate = clamp(baseSelfConsumptionRate + batteryBoost + batteryCoverageFactor, 0.1, 0.97);
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
    const discount = (1 + toRatio(input.discountRatePercent)) ** (year - 1);
    const yearlyBenefit =
      ((production * selfConsumptionRate * effectiveEnergyPrice * growth) +
        (Math.max(production - production * selfConsumptionRate, 0) * sellBackPrice * growth) -
        input.annualMaintenanceEur) /
      discount;
    cashflowByYear.push(yearlyBenefit);
    totalNetBenefitPeriodEur += yearlyBenefit;
    production *= 1 - toRatio(input.degradationPercent);
  }

  const selfConsumptionRatePercent = selfConsumptionRate * 100;
  const gridDependenceReductionPercent = clamp((avoidedGridPurchaseKwh / Math.max(input.annualConsumptionKwh, 1)) * 100, 0, 100);
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

export function calculateComparison(input: CalculatorInput): ComparisonResult {
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

  return {
    withoutBattery,
    withBattery,
    selected,
    totalInvestmentEur,
    paybackYears,
    batteryAddedValuePeriodEur,
    interpretationKind: interpretationKindFromPayback(paybackYears),
    effectiveEnergyPrice,
  };
}
