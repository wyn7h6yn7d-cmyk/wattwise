export type PanelDirection = "louna" | "ida-laas" | "muu";
export type ConsumptionProfile = "kodu-paev" | "tool-ohtul" | "ettevote" | "kohandatud";
export type PriceSource = "manual" | "nordpool";
export type PeriodYears = 10 | 15 | 20 | 25;
export type InterpretationKind = "needs_input" | "fast" | "moderate" | "long";

export interface CalculatorInput {
  pvPowerKw: number;
  annualProductionKwh: number;
  inverterPowerKw: number;
  panelDirection: PanelDirection;
  tiltDeg: number;
  shadingPercent: number;
  systemEfficiencyPercent: number;
  hasBattery: boolean;
  batteryCapacityKwh: number;
  batteryUsablePercent: number;
  batteryPowerKw: number;
  batteryRoundTripPercent: number;
  batteryInvestmentEur: number;
  batteryCostEur: number;
  annualConsumptionKwh: number;
  dailyConsumptionKwh: number;
  consumptionProfile: ConsumptionProfile;
  seasonalMultiplierPercent: number;
  priceSource: PriceSource;
  manualSpotPrice: number;
  nordPoolAveragePrice: number;
  gridFeePrice: number;
  sellBackPrice: number;
  marginPrice: number;
  annualPriceGrowthPercent: number;
  discountRatePercent: number;
  pvCostEur: number;
  extraInstallCostEur: number;
  supportEur: number;
  annualMaintenanceEur: number;
  selfConsumptionWithoutBatteryPercent: number;
  selfConsumptionBoostWithBatteryPercent: number;
  degradationPercent: number;
  periodYears: PeriodYears;
  location: string;
  specificYieldKwhPerKw: number;
  inverterReplacementYear: number;
  inverterReplacementCostEur: number;
  batteryEfficiencyPercent: number;
}

export interface ScenarioResult {
  annualProductionKwh: number;
  selfConsumedKwh: number;
  exportedKwh: number;
  avoidedGridPurchaseKwh: number;
  selfConsumptionRatePercent: number;
  annualSavingsEur: number;
  annualExportRevenueEur: number;
  annualNetBenefitEur: number;
  totalNetBenefitPeriodEur: number;
  cashflowByYear: number[];
  gridDependenceReductionPercent: number;
  co2ReductionKgYear: number;
}

export interface ComparisonResult {
  withoutBattery: ScenarioResult;
  withBattery: ScenarioResult;
  selected: ScenarioResult;
  totalInvestmentEur: number;
  paybackYears: number;
  batteryAddedValuePeriodEur: number;
  interpretationKind: InterpretationKind;
  effectiveEnergyPrice: number;
  npvEur: number;
  totalRevenuePeriodEur: number;
  sensitivity: {
    electricityPriceMinus20: number;
    electricityPricePlus20: number;
    investmentMinus10: number;
    investmentPlus10: number;
    yieldMinus10: number;
    yieldPlus10: number;
  };
  usedPriceUnit: "eur_per_kwh" | "eur_per_mwh_converted";
}
