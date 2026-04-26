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

export type EvChargingFormulaInput = {
  amps: number;
  phase: "1" | "3";
  householdReserveKw: number;
  energyToChargeKwh: number;
  chargerKw: number;
  priceEurKwh: number;
};

export type EvChargeableEnergyInput = {
  mode: "quick" | "advanced";
  batteryKwh: number;
  startSocPct: number;
  targetSocPct: number;
  energyToChargeKwh: number;
  chargerEfficiencyPct: number;
  chargingLossPct: number;
};

export type EvChargeableEnergyResult = {
  chargeableEnergyKwh: number;
  gridEnergyKwh: number;
};

export function calculateEvChargeableEnergy(input: EvChargeableEnergyInput): EvChargeableEnergyResult {
  const batteryKwh = Math.max(input.batteryKwh, 0);
  const startSocPct = Math.min(Math.max(input.startSocPct, 0), 100);
  const targetSocPct = Math.min(Math.max(input.targetSocPct, 0), 100);
  const quickEnergy = Math.max(input.energyToChargeKwh, 0);
  const chargeableEnergyKwh =
    input.mode === "advanced" ? Math.max((batteryKwh * Math.max(targetSocPct - startSocPct, 0)) / 100, 0) : quickEnergy;
  // 0 = pole täidetud → ära jaga 1%-ga (see teeks võrgust küsitava energia ~100× suuremaks).
  const effPct = input.chargerEfficiencyPct;
  const chargerEff =
    effPct <= 0 ? 1 : Math.min(Math.max(effPct, 1), 100) / 100;
  const lossFactor = 1 + Math.min(Math.max(input.chargingLossPct, 0), 40) / 100;
  const gridEnergyKwh = chargeableEnergyKwh > 0 ? (chargeableEnergyKwh / chargerEff) * lossFactor : 0;
  return { chargeableEnergyKwh, gridEnergyKwh };
}

export type EvChargingFormulaResult = {
  singlePhaseKw: number;
  threePhaseKw: number;
  mainFuseKw: number;
  availableForEvKw: number;
  chargingTimeHours: number;
  chargingCost: number;
  recommendedChargerKw: number;
  fits11Kw: boolean;
  fits22Kw: boolean;
  loadManagementRecommended: boolean;
  warning22Kw: string | null;
};

/** Hours + minutes for UI (avoids float edge cases from `time % 1`). */
export function formatChargingDurationHm(timeHours: number): { hours: number; minutes: number } | null {
  if (!Number.isFinite(timeHours) || timeHours <= 0) return null;
  const totalMinutes = Math.round(timeHours * 60);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

export function calculateEvCharging(input: EvChargingFormulaInput): EvChargingFormulaResult {
  const amps = Math.max(input.amps, 0);
  const reserveKw = Math.max(input.householdReserveKw, 0);
  const energyKwh = Math.max(input.energyToChargeKwh, 0);
  const chargerKw = Math.max(input.chargerKw, 0);
  const priceEurKwh = Math.max(input.priceEurKwh, 0);

  // Valemid:
  // singlePhaseKw = 230 * amps / 1000
  // threePhaseKw = Math.sqrt(3) * 400 * amps / 1000
  // availableForEvKw = mainFuseKw * 0.8 - householdReserveKw
  // chargingTimeHours = energyToChargeKwh / chargerKw
  // chargingCost = energyToChargeKwh * priceEurKwh
  const singlePhaseKw = (230 * amps) / 1000;
  const threePhaseKw = (Math.sqrt(3) * 400 * amps) / 1000;
  const mainFuseKw = input.phase === "1" ? singlePhaseKw : threePhaseKw;
  const availableForEvKw = mainFuseKw * 0.8 - reserveKw;

  const safeChargerKw = Math.max(chargerKw, 0.000001);
  const chargingTimeHours = energyKwh / safeChargerKw;
  const chargingCostValue = energyKwh * priceEurKwh;

  const recommendedChargerKw = pickChargerStepKw(Math.max(availableForEvKw, 0));
  const fits11Kw = availableForEvKw >= 11 - 1e-6;
  const fits22Kw = availableForEvKw >= 22 - 1e-6;
  const loadManagementRecommended = chargerKw > Math.max(availableForEvKw, 0) || fits22Kw === false;
  const warning22Kw = fits22Kw
    ? null
    : "22 kW laadija eeldab tavaliselt suuremat peakaitset või koormusjuhtimist.";

  return {
    singlePhaseKw,
    threePhaseKw,
    mainFuseKw,
    availableForEvKw,
    chargingTimeHours,
    chargingCost: chargingCostValue,
    recommendedChargerKw,
    fits11Kw,
    fits22Kw,
    loadManagementRecommended,
    warning22Kw,
  };
}
