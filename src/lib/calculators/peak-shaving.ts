export function requiredCutKw(currentPeakKw: number, targetLimitKw: number) {
  return Math.max(Math.max(currentPeakKw, 0) - Math.max(targetLimitKw, 0), 0);
}

export function possibleCutKw(requiredCut: number, batteryKw: number, batteryKwh: number, peakHourDuration: number) {
  const hours = Math.max(peakHourDuration, 0.000001);
  return Math.max(
    Math.min(Math.max(requiredCut, 0), Math.max(batteryKw, 0), Math.max(batteryKwh, 0) / hours),
    0,
  );
}

export function annualPeakShavingSavingsEur(possibleCut: number, demandFeeEurPerKwMonth: number) {
  return Math.max(possibleCut, 0) * Math.max(demandFeeEurPerKwMonth, 0) * 12;
}

export type PeakShavingInput = {
  currentPeakKw: number;
  targetPeakKw: number;
  batteryKwh: number;
  usableSocPercent: number;
  efficiencyPercent: number;
  batteryPowerKw: number;
  peakDurationHours: number;
  demandChargeEurKwMonth: number;
  annualMaintenanceCost: number;
  investment: number;
};

export type PeakShavingLimitingFactor =
  | "aku võimsus"
  | "aku maht"
  | "tipu kestus"
  | "eesmärk saavutatud";

export type PeakShavingResult = {
  requiredReductionKw: number;
  usableBatteryEnergyKwh: number;
  energyLimitedReductionKw: number;
  possibleReductionKw: number;
  annualSavings: number;
  netSavings: number;
  paybackYears: number | null;
  targetAchievable: boolean;
  limitingFactor: PeakShavingLimitingFactor;
};

export type PeakShavingProjectionInput = {
  possibleReductionKw: number;
  requiredReductionKw: number;
  peakDurationHours: number;
  usableSocPercent: number;
  efficiencyPercent: number;
  demandChargeEurKwMonth: number;
  annualMaintenanceCost: number;
  demandFeeGrowthPercent: number;
  batteryDegradationPercent: number;
  periodYears: number;
  investment: number;
};

export type PeakShavingProjectionResult = {
  discountedNetEur: number;
  recommendedBatteryKw: number;
  recommendedBatteryKwh: number;
};

export function calculatePeakShavingProjection(input: PeakShavingProjectionInput): PeakShavingProjectionResult {
  const possibleReductionKw = Math.max(input.possibleReductionKw, 0);
  const requiredReductionKw = Math.max(input.requiredReductionKw, 0);
  const peakDurationHours = Math.max(input.peakDurationHours, 0);
  const usableSocRatio = Math.min(Math.max(input.usableSocPercent, 0), 100) / 100;
  const efficiencyRatio = Math.min(Math.max(input.efficiencyPercent, 0), 100) / 100;
  const demandFee = Math.max(input.demandChargeEurKwMonth, 0);
  const maintenance = Math.max(input.annualMaintenanceCost, 0);
  const feeGrowth = Math.min(Math.max(input.demandFeeGrowthPercent, 0), 100) / 100;
  const degradation = Math.min(Math.max(input.batteryDegradationPercent, 0), 30) / 100;
  const years = Math.max(Math.round(input.periodYears), 1);
  const investment = Math.max(input.investment, 0);

  let discountedNetEur = -investment;
  for (let year = 1; year <= years; year += 1) {
    const yearlyCut = possibleReductionKw * (1 - degradation) ** (year - 1);
    const yearlyFee = demandFee * (1 + feeGrowth) ** (year - 1);
    const yearlySavings = yearlyCut * yearlyFee * 12;
    discountedNetEur += yearlySavings - maintenance;
  }

  const recommendedBatteryKw = requiredReductionKw > 0 ? requiredReductionKw : 0;
  const recommendedBatteryKwh =
    requiredReductionKw > 0 ? (requiredReductionKw * peakDurationHours) / Math.max(usableSocRatio * efficiencyRatio, 0.1) : 0;

  return { discountedNetEur, recommendedBatteryKw, recommendedBatteryKwh };
}

export function calculatePeakShaving(input: PeakShavingInput): PeakShavingResult {
  // requiredReductionKw = currentPeakKw - targetPeakKw
  const requiredReductionKw = requiredCutKw(input.currentPeakKw, input.targetPeakKw);
  const usableSocRatio = Math.min(Math.max(input.usableSocPercent, 0), 100) / 100;
  const efficiencyRatio = Math.min(Math.max(input.efficiencyPercent, 0), 100) / 100;
  // usableBatteryEnergyKwh = batteryKwh * usableSocPercent / 100 * efficiencyPercent / 100
  const usableBatteryEnergyKwh = Math.max(input.batteryKwh, 0) * usableSocRatio * efficiencyRatio;
  const safePeakDurationHours = Math.max(input.peakDurationHours, 0.000001);
  // energyLimitedReductionKw = usableBatteryEnergyKwh / peakDurationHours
  const energyLimitedReductionKw = usableBatteryEnergyKwh / safePeakDurationHours;
  // possibleReductionKw = min(requiredReductionKw, batteryPowerKw, energyLimitedReductionKw)
  const possibleReductionKw = Math.max(
    Math.min(requiredReductionKw, Math.max(input.batteryPowerKw, 0), Math.max(energyLimitedReductionKw, 0)),
    0,
  );
  // annualSavings = possibleReductionKw * demandChargeEurKwMonth * 12
  const annualSavings = annualPeakShavingSavingsEur(possibleReductionKw, input.demandChargeEurKwMonth);
  // netSavings = annualSavings - annualMaintenanceCost
  const netSavings = annualSavings - Math.max(input.annualMaintenanceCost, 0);
  // paybackYears = investment / netSavings
  const paybackYears = netSavings > 0 ? Math.max(input.investment, 0) / netSavings : null;

  const targetAchievable = requiredReductionKw <= 0 || possibleReductionKw >= requiredReductionKw - 1e-9;
  let limitingFactor: PeakShavingLimitingFactor = "eesmärk saavutatud";
  if (!targetAchievable) {
    const batteryPowerKw = Math.max(input.batteryPowerKw, 0);
    if (batteryPowerKw <= energyLimitedReductionKw + 1e-9) {
      limitingFactor = "aku võimsus";
    } else {
      limitingFactor = input.peakDurationHours > 1.5 ? "tipu kestus" : "aku maht";
    }
  }

  return {
    requiredReductionKw,
    usableBatteryEnergyKwh,
    energyLimitedReductionKw,
    possibleReductionKw,
    annualSavings,
    netSavings,
    paybackYears,
    targetAchievable,
    limitingFactor,
  };
}
