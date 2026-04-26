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
  /** null kui kasutaja pole investeeringut sisestanud — tasuvust ei arvuta */
  investment: number | null;
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
  investment: number | null;
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
  const investment = input.investment != null ? Math.max(input.investment, 0) : 0;

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
  const batteryPowerKw = Math.max(input.batteryPowerKw, 0);
  const energyLim = Math.max(energyLimitedReductionKw, 0);
  // possibleReductionKw = min(requiredReductionKw, batteryPowerKw, energyLimitedReductionKw)
  const possibleReductionKw = Math.max(Math.min(requiredReductionKw, batteryPowerKw, energyLim), 0);
  // annualSavings = possibleReductionKw * demandChargeEurKwMonth * 12
  const annualSavings = annualPeakShavingSavingsEur(possibleReductionKw, input.demandChargeEurKwMonth);
  // netSavings = annualSavings - annualMaintenanceCost
  const netSavings = annualSavings - Math.max(input.annualMaintenanceCost, 0);
  const inv = input.investment != null ? Math.max(input.investment, 0) : null;
  const paybackYears =
    netSavings > 0 && inv != null && inv > 0 ? inv / netSavings : null;

  const eps = 1e-9;
  let targetAchievable: boolean;
  let limitingFactor: PeakShavingLimitingFactor;
  if (requiredReductionKw <= eps) {
    targetAchievable = true;
    limitingFactor = "eesmärk saavutatud";
  } else if (possibleReductionKw + eps >= requiredReductionKw) {
    targetAchievable = true;
    limitingFactor = "eesmärk saavutatud";
  } else {
    targetAchievable = false;
    const r = requiredReductionKw;
    const p = batteryPowerKw;
    const e = energyLim;
    if (p < r - eps && p <= e + eps) {
      limitingFactor = "aku võimsus";
    } else if (e < r - eps && e < p - eps) {
      limitingFactor = "aku maht";
    } else if (p <= e + eps) {
      limitingFactor = "aku võimsus";
    } else {
      limitingFactor = "aku maht";
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
