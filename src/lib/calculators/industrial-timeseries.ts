import type { ConsumptionCsvRow } from "../consumption/parse-consumption-csv";
import { INDUSTRIAL_ASSUMPTIONS, type IndustrialBatteryPurpose } from "./industrial";

/**
 * Tööstusmooduli v0.6 lihtsustatud ajapõhine PV + aku simulatsioon CSV ridade põhjal.
 * Ei ole täisoptimeerija ega börsihinna-põhine dispetšer.
 */

export const HOURS_PER_YEAR = 8760;
export const TIMESERIES_CHART_MAX_POINTS = 96;

export type IndustrialTimeseriesInput = {
  rows: ConsumptionCsvRow[];
  pvPowerKw: number;
  pvSpecificYieldKwhPerKw: number;
  batteryCapacityKwh: number;
  batteryPowerKw: number;
  batteryPurpose: IndustrialBatteryPurpose;
  batteryEfficiencyPercent: number;
  batteryUsableCapacityPercent: number;
  /** Tipukoormus peak shaving sihttaseme jaoks (kW); kui puudub, võetakse CSV tipust. */
  peakLoadKw?: number;
  intervalMinutes?: number | null;
};

export type IndustrialTimeseriesStep = {
  timestampMs: number;
  label: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  durationHours: number;
  consumptionKwh: number;
  pvProductionKwh: number;
  directSelfConsumptionKwh: number;
  pvSurplusKwh: number;
  gridImportKwh: number;
  batteryChargeKwh: number;
  batteryDischargeKwh: number;
  batterySocKwh: number;
  gridExportKwh: number;
  /** Võrgust võetav võimsus pärast PV/akut (kW). */
  netGridImportKw: number;
};

export type IndustrialTimeseriesResult = {
  steps: IndustrialTimeseriesStep[];
  chartSteps: IndustrialTimeseriesStep[];
  periodStartLabel: string;
  periodEndLabel: string;
  coveredHours: number;
  rowCount: number;
  annualPvTargetKwh: number;
  periodPvTargetKwh: number;
  pvProductionKwh: number;
  consumptionKwh: number;
  directSelfConsumptionKwh: number;
  /** Aku tühjenemisega kohapeal kasutatud energia (AC). */
  batteryDischargedToLoadKwh: number;
  gridExportKwh: number;
  gridImportKwh: number;
  selfConsumptionSharePercent: number;
  approxBatteryCycles: number;
  minSocKwh: number;
  maxSocKwh: number;
  usableBatteryCapacityKwh: number;
  peakLoadBeforeKw: number;
  peakLoadAfterKw: number;
  peakShavingTargetKw: number;
  assumptions: string[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function finiteNonNegative(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatTimeseriesLabel(
  row: Pick<ConsumptionCsvRow, "year" | "month" | "day" | "hour" | "minute">,
): string {
  return `${row.year}-${pad2(row.month)}-${pad2(row.day)} ${pad2(row.hour)}:${pad2(row.minute)}`;
}

/**
 * Simplified daylight PV shape (relative). Night = 0; midday peak.
 * hourFraction is hour + minute/60 in local/naive clock.
 */
export function pvDayShapeFactor(hourFraction: number): number {
  const h = ((hourFraction % 24) + 24) % 24;
  if (h < 6 || h >= 21) return 0;
  if (h < 8) return (h - 6) / 2; // 0 → 1
  if (h < 11) return 1 + ((h - 8) / 3) * 0.6; // 1 → 1.6
  if (h < 14) return 1.6 + ((h - 11) / 3) * 0.4; // 1.6 → 2.0 peak
  if (h < 17) return 2.0 - ((h - 14) / 3) * 0.7; // 2.0 → 1.3
  if (h < 19) return 1.3 - ((h - 17) / 2) * 0.8; // 1.3 → 0.5
  return 0.5 * (1 - (h - 19) / 2); // 0.5 → 0 by 21
}

/** Estonia-ish seasonal multiplier (unitless). */
export function pvSeasonFactor(month: number): number {
  const m = clamp(Math.round(month), 1, 12);
  const factors = [0, 0.35, 0.5, 0.75, 1.0, 1.2, 1.35, 1.35, 1.2, 1.0, 0.75, 0.5, 0.35];
  return factors[m]!;
}

function rowDurationHours(
  sorted: ConsumptionCsvRow[],
  index: number,
  fallbackHours: number,
): number {
  if (index < sorted.length - 1) {
    const hours = (sorted[index + 1]!.timestampMs - sorted[index]!.timestampMs) / 3600000;
    if (hours > 0) return hours;
  }
  if (index > 0) {
    const hours = (sorted[index]!.timestampMs - sorted[index - 1]!.timestampMs) / 3600000;
    if (hours > 0) return hours;
  }
  return fallbackHours;
}

function resolveFallbackHours(intervalMinutes: number | null | undefined): number {
  if (intervalMinutes != null && intervalMinutes > 0) return intervalMinutes / 60;
  return 1;
}

export function downsampleTimeseriesSteps<T>(steps: T[], maxPoints: number): T[] {
  if (steps.length <= maxPoints || maxPoints <= 0) return steps;
  const out: T[] = [];
  const last = steps.length - 1;
  for (let i = 0; i < maxPoints; i += 1) {
    const index = i === maxPoints - 1 ? last : Math.round((i * last) / (maxPoints - 1));
    out.push(steps[index]!);
  }
  return out;
}

function allocatePvProductionKwh(
  sorted: ConsumptionCsvRow[],
  durations: number[],
  periodPvTargetKwh: number,
): number[] {
  const weights = sorted.map((row, i) => {
    const hourFraction = row.hour + row.minute / 60;
    const shape = pvDayShapeFactor(hourFraction) * pvSeasonFactor(row.month);
    return shape * durations[i]!;
  });
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  if (weightSum <= 0 || periodPvTargetKwh <= 0) {
    return sorted.map(() => 0);
  }
  return weights.map((w) => (periodPvTargetKwh * w) / weightSum);
}

/**
 * Runs a greedy battery dispatch over CSV rows.
 */
export function simulateIndustrialTimeseries(raw: IndustrialTimeseriesInput): IndustrialTimeseriesResult {
  if (!raw.rows || raw.rows.length === 0) {
    throw new Error("Ajapõhine simulatsioon vajab vähemalt ühte CSV rida.");
  }

  const pvPowerKw = finiteNonNegative(raw.pvPowerKw);
  const pvSpecificYieldKwhPerKw = finiteNonNegative(raw.pvSpecificYieldKwhPerKw);
  const batteryCapacityKwh = finiteNonNegative(raw.batteryCapacityKwh);
  const batteryPowerKw = finiteNonNegative(raw.batteryPowerKw);
  const purpose: IndustrialBatteryPurpose =
    raw.batteryPurpose === "peak_shaving" ? "peak_shaving" : "self_consumption";
  const efficiencyPercent = clamp(finiteNonNegative(raw.batteryEfficiencyPercent), 0, 100);
  const usableCapacityPercent = clamp(finiteNonNegative(raw.batteryUsableCapacityPercent), 0, 100);
  const oneWayEta = Math.sqrt(efficiencyPercent / 100);
  const usableBatteryCapacityKwh = batteryCapacityKwh * (usableCapacityPercent / 100);

  const sorted = [...raw.rows].sort((a, b) => a.timestampMs - b.timestampMs);
  const fallbackHours = resolveFallbackHours(raw.intervalMinutes);
  const durations = sorted.map((_, i) => rowDurationHours(sorted, i, fallbackHours));
  const coveredHours = durations.reduce((sum, h) => sum + h, 0);

  const annualPvTargetKwh = pvPowerKw * pvSpecificYieldKwhPerKw;
  const periodPvTargetKwh = coveredHours > 0 ? annualPvTargetKwh * (coveredHours / HOURS_PER_YEAR) : 0;
  const pvByStep = allocatePvProductionKwh(sorted, durations, periodPvTargetKwh);

  let peakLoadBeforeKw = 0;
  let totalConsumptionKwh = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    const dt = durations[i]!;
    const cons = finiteNonNegative(sorted[i]!.consumptionKwh);
    totalConsumptionKwh += cons;
    if (dt > 0) peakLoadBeforeKw = Math.max(peakLoadBeforeKw, cons / dt);
  }

  const inputPeak = finiteNonNegative(raw.peakLoadKw);
  const referencePeakKw = Math.max(peakLoadBeforeKw, inputPeak);
  const averageLoadKw = coveredHours > 0 ? totalConsumptionKwh / coveredHours : 0;
  const peakShavingTargetKw = Math.max(
    averageLoadKw,
    referencePeakKw * INDUSTRIAL_ASSUMPTIONS.minPeakRemainingShare,
  );

  let soc = usableBatteryCapacityKwh * 0.5;
  if (usableBatteryCapacityKwh <= 0) soc = 0;

  const steps: IndustrialTimeseriesStep[] = [];
  let peakLoadAfterKw = 0;
  let minSocKwh = usableBatteryCapacityKwh > 0 ? soc : 0;
  let maxSocKwh = soc;
  let totalChargeIntoSoc = 0;
  let totalDischargeFromSoc = 0;

  for (let i = 0; i < sorted.length; i += 1) {
    const row = sorted[i]!;
    const dt = Math.max(durations[i]!, 1e-9);
    const consumptionKwh = finiteNonNegative(row.consumptionKwh);
    const pvProductionKwh = Math.max(pvByStep[i]!, 0);

    const directSelfConsumptionKwh = Math.min(consumptionKwh, pvProductionKwh);
    let surplus = Math.max(pvProductionKwh - directSelfConsumptionKwh, 0);
    let deficit = Math.max(consumptionKwh - directSelfConsumptionKwh, 0);

    let batteryChargeKwh = 0;
    let batteryDischargeKwh = 0;

    const powerLimitKwh = batteryPowerKw * dt;
    const headroomKwh = Math.max(usableBatteryCapacityKwh - soc, 0);
    const chargeRoomOnAc = oneWayEta > 0 ? headroomKwh / oneWayEta : 0;
    const maxChargeAc = Math.min(surplus, powerLimitKwh, chargeRoomOnAc);

    if (usableBatteryCapacityKwh > 0 && maxChargeAc > 0) {
      batteryChargeKwh = maxChargeAc;
      const intoSoc = batteryChargeKwh * oneWayEta;
      soc += intoSoc;
      totalChargeIntoSoc += intoSoc;
      surplus -= batteryChargeKwh;
    }

    const gridExportKwh = Math.max(surplus, 0);

    if (usableBatteryCapacityKwh > 0 && batteryPowerKw > 0 && oneWayEta > 0) {
      let desiredDischargeAc = 0;
      if (purpose === "self_consumption") {
        desiredDischargeAc = deficit;
      } else {
        const loadAfterPvKw = deficit / dt;
        if (loadAfterPvKw > peakShavingTargetKw) {
          desiredDischargeAc = (loadAfterPvKw - peakShavingTargetKw) * dt;
        }
      }

      const maxFromSocAc = soc * oneWayEta;
      const dischargeAc = Math.min(desiredDischargeAc, powerLimitKwh, maxFromSocAc);
      if (dischargeAc > 0) {
        batteryDischargeKwh = dischargeAc;
        const fromSoc = dischargeAc / oneWayEta;
        soc = Math.max(soc - fromSoc, 0);
        totalDischargeFromSoc += fromSoc;
        deficit = Math.max(deficit - dischargeAc, 0);
      }
    }

    soc = clamp(soc, 0, usableBatteryCapacityKwh);
    minSocKwh = Math.min(minSocKwh, soc);
    maxSocKwh = Math.max(maxSocKwh, soc);

    const gridImportKwh = Math.max(deficit, 0);
    const netGridImportKw = gridImportKwh / dt;
    peakLoadAfterKw = Math.max(peakLoadAfterKw, netGridImportKw);

    steps.push({
      timestampMs: row.timestampMs,
      label: formatTimeseriesLabel(row),
      year: row.year,
      month: row.month,
      day: row.day,
      hour: row.hour,
      minute: row.minute,
      durationHours: dt,
      consumptionKwh,
      pvProductionKwh,
      directSelfConsumptionKwh,
      pvSurplusKwh: Math.max(pvProductionKwh - directSelfConsumptionKwh, 0),
      gridImportKwh,
      batteryChargeKwh,
      batteryDischargeKwh,
      batterySocKwh: soc,
      gridExportKwh,
      netGridImportKw,
    });
  }

  const pvProductionKwh = steps.reduce((s, step) => s + step.pvProductionKwh, 0);
  const directSelfConsumptionKwh = steps.reduce((s, step) => s + step.directSelfConsumptionKwh, 0);
  const batteryDischargedToLoadKwh = steps.reduce((s, step) => s + step.batteryDischargeKwh, 0);
  const gridExportKwh = steps.reduce((s, step) => s + step.gridExportKwh, 0);
  const gridImportKwh = steps.reduce((s, step) => s + step.gridImportKwh, 0);
  const selfConsumedFromPvKwh = Math.max(pvProductionKwh - gridExportKwh, 0);
  const selfConsumptionSharePercent =
    pvProductionKwh > 0 ? (selfConsumedFromPvKwh / pvProductionKwh) * 100 : 0;
  const approxBatteryCycles =
    usableBatteryCapacityKwh > 0 ? totalDischargeFromSoc / usableBatteryCapacityKwh : 0;

  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;

  return {
    steps,
    chartSteps: downsampleTimeseriesSteps(steps, TIMESERIES_CHART_MAX_POINTS),
    periodStartLabel: formatTimeseriesLabel(first),
    periodEndLabel: formatTimeseriesLabel(last),
    coveredHours,
    rowCount: sorted.length,
    annualPvTargetKwh,
    periodPvTargetKwh,
    pvProductionKwh,
    consumptionKwh: totalConsumptionKwh,
    directSelfConsumptionKwh,
    batteryDischargedToLoadKwh,
    gridExportKwh,
    gridImportKwh,
    selfConsumptionSharePercent,
    approxBatteryCycles,
    minSocKwh: usableBatteryCapacityKwh > 0 ? minSocKwh : 0,
    maxSocKwh: usableBatteryCapacityKwh > 0 ? maxSocKwh : 0,
    usableBatteryCapacityKwh,
    peakLoadBeforeKw,
    peakLoadAfterKw,
    peakShavingTargetKw,
    assumptions: [
      "PV jaotatakse lihtsustatud päevakõvera ja kuuteguri järgi; perioodi summa = aastatoodang × (perioodi tunnid / 8760).",
      `Aku kasutatav maht: ${usableBatteryCapacityKwh.toFixed(1)} kWh (DoD ${usableCapacityPercent}%).`,
      `Aku ühe suuna kasutegur ≈ √(round-trip ${efficiencyPercent}%).`,
      purpose === "peak_shaving"
        ? `Peak shaving sihttase ≈ ${peakShavingTargetKw.toFixed(0)} kW (max keskmine koormus ja ${INDUSTRIAL_ASSUMPTIONS.minPeakRemainingShare * 100}% tipust).`
        : "Omatarbe režiimis aku laeb PV ülejäägist ja tühjeneb puudujäägi katteks.",
      "See on v0.6 lihtsustatud simulatsioon, mitte täisoptimeerija.",
    ],
  };
}

/** AC-side energy balance residual per step (should be ~0). */
export function timeseriesStepBalanceResidual(step: IndustrialTimeseriesStep): number {
  const left = step.pvProductionKwh + step.batteryDischargeKwh + step.gridImportKwh;
  const right = step.consumptionKwh + step.batteryChargeKwh + step.gridExportKwh;
  return left - right;
}
