export type PanelDirection = "louna" | "ida-laas" | "muu";
export type ConsumptionProfile = "kodu-paev" | "tool-ohtul" | "ettevote" | "kohandatud";
export type PriceSource = "manual" | "nordpool";
export type PeriodYears = 10 | 15 | 20 | 25;

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
  interpretation: string;
  effectiveEnergyPrice: number;
}
