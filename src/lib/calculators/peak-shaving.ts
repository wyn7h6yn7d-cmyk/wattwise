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
