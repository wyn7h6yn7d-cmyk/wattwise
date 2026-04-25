export const CHARGER_STEPS_KW = [2.3, 3.7, 7.4, 11, 22] as const;

export function chargingCost(chargeableKwh: number, priceEurPerKwh: number) {
  return Math.max(chargeableKwh, 0) * Math.max(priceEurPerKwh, 0);
}

export function chargingTimeHours(chargeableKwh: number, chargerKw: number) {
  const power = Math.max(chargerKw, 0.000001);
  return Math.max(chargeableKwh, 0) / power;
}

export function mainFusePower1fKw(fuseA: number) {
  return (230 * Math.max(fuseA, 0)) / 1000;
}

export function mainFusePower3fKw(fuseA: number) {
  return (Math.sqrt(3) * 400 * Math.max(fuseA, 0)) / 1000;
}

export function usableChargingPowerKw(peakFuseKw: number, reserveKw: number) {
  return peakFuseKw * 0.8 - Math.max(reserveKw, 0);
}

export function pickChargerStepKw(maxKw: number) {
  const safe = Math.max(maxKw, 0);
  let chosen = 0;
  for (const step of CHARGER_STEPS_KW) {
    if (step <= safe + 1e-6) chosen = step;
  }
  return chosen;
}
