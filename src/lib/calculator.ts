import { CalculatorInput, ComparisonResult, InterpretationKind, ScenarioResult } from "@/types/calculator";

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

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
  const shadingFactor = clamp(1 - input.shadingPercent / 100, 0.6, 1);
  const efficiencyFactor = clamp(input.systemEfficiencyPercent / 100, 0.7, 1.05);
  const seasonalFactor = clamp(input.seasonalMultiplierPercent / 100, 0.75, 1.35);

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
    input.selfConsumptionWithoutBatteryPercent / 100 * profileFactor,
    0.08,
    0.95,
  );
  const batteryBoost = withBattery
    ? clamp(input.selfConsumptionBoostWithBatteryPercent / 100, 0, 0.35)
    : 0;

  const batteryUsableKwh =
    input.batteryCapacityKwh * (input.batteryUsablePercent / 100) * (input.batteryRoundTripPercent / 100);
  const batteryCoverageFactor = withBattery
    ? clamp((batteryUsableKwh * 320) / Math.max(input.annualConsumptionKwh, 1), 0, 0.25)
    : 0;

  const selfConsumptionRate = clamp(baseSelfConsumptionRate + batteryBoost + batteryCoverageFactor, 0.1, 0.97);
  const selfConsumedKwh = Math.min(annualProductionKwh * selfConsumptionRate, input.annualConsumptionKwh);
  const exportedKwh = Math.max(annualProductionKwh - selfConsumedKwh, 0);
  const avoidedGridPurchaseKwh = selfConsumedKwh;

  const energyPrice = input.priceSource === "manual" ? input.manualSpotPrice : input.nordPoolAveragePrice;
  const effectiveEnergyPrice = energyPrice + input.gridFeePrice + input.marginPrice;
  const annualSavingsEur = avoidedGridPurchaseKwh * effectiveEnergyPrice;
  const annualExportRevenueEur = exportedKwh * input.sellBackPrice;
  const annualNetBenefitEur = Math.max(annualSavingsEur + annualExportRevenueEur - input.annualMaintenanceEur, 0);

  const cashflowByYear: number[] = [];
  let totalNetBenefitPeriodEur = 0;
  let production = annualProductionKwh;
  for (let year = 1; year <= input.periodYears; year += 1) {
    const growth = (1 + input.annualPriceGrowthPercent / 100) ** (year - 1);
    const discount = (1 + input.discountRatePercent / 100) ** (year - 1);
    const yearlyBenefit =
      ((production * selfConsumptionRate * effectiveEnergyPrice * growth) +
        (Math.max(production - production * selfConsumptionRate, 0) * input.sellBackPrice * growth) -
        input.annualMaintenanceEur) /
      discount;
    cashflowByYear.push(yearlyBenefit);
    totalNetBenefitPeriodEur += yearlyBenefit;
    production *= 1 - input.degradationPercent / 100;
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
    (input.priceSource === "manual" ? input.manualSpotPrice : input.nordPoolAveragePrice) +
    input.gridFeePrice +
    input.marginPrice;

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
