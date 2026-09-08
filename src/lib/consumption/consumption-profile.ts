import type { ConsumptionCsvRow } from "./parse-consumption-csv";

/**
 * v0.2 tarbimisprofiili kokkuvõte CSV ridadest.
 * Päevane aeg: 08:00 kuni 20:00 (20:00 ja hilisem on öine).
 * Aastane tarbimine: kui periood ei kata ~aastat, skaleeritakse 8760 tunni peale.
 */

export const DAYTIME_HOUR_START = 8;
export const DAYTIME_HOUR_END = 20;
export const HOURS_PER_YEAR = 8760;

export type ConsumptionInterval = "hour" | "15min" | "irregular" | "unknown";

export type ConsumptionProfileSummary = {
  rowCount: number;
  periodStartMs: number;
  periodEndMs: number;
  periodStartLabel: string;
  periodEndLabel: string;
  totalConsumptionMwh: number;
  estimatedAnnualConsumptionMwh: number;
  averageLoadKw: number;
  peakLoadKw: number;
  daytimeSharePercent: number;
  nighttimeSharePercent: number;
  averageDailyConsumptionKwh: number;
  interval: ConsumptionInterval;
  intervalMinutes: number | null;
  coveredHours: number;
  isFullYearEstimate: boolean;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatNaiveLabel(row: Pick<ConsumptionCsvRow, "year" | "month" | "day" | "hour" | "minute">): string {
  return `${row.year}-${pad2(row.month)}-${pad2(row.day)} ${pad2(row.hour)}:${pad2(row.minute)}`;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function isNear15Minutes(minutes: number): boolean {
  return minutes >= 12 && minutes <= 18;
}

function isNear60Minutes(minutes: number): boolean {
  return minutes >= 50 && minutes <= 70;
}

/**
 * Classifies sampling only when every adjacent gap matches the same band.
 * Mixed gaps (e.g. mostly 1h with multi-hour holes) are irregular — never reported as clean 1h/15min.
 */
function classifyInterval(diffsMin: number[]): {
  interval: ConsumptionInterval;
  intervalMinutes: number | null;
} {
  if (diffsMin.length === 0) return { interval: "unknown", intervalMinutes: null };

  if (diffsMin.every(isNear15Minutes)) {
    return { interval: "15min", intervalMinutes: 15 };
  }
  if (diffsMin.every(isNear60Minutes)) {
    return { interval: "hour", intervalMinutes: 60 };
  }

  const medianMinutes = median(diffsMin);
  return {
    interval: "irregular",
    intervalMinutes: medianMinutes != null ? Math.round(medianMinutes) : null,
  };
}

/** Duration for a row: fixed step when regular; otherwise gap to the next (or previous) timestamp. */
function rowDurationHours(
  sorted: ConsumptionCsvRow[],
  index: number,
  fallbackHours: number,
): number {
  if (index < sorted.length - 1) {
    const hours = (sorted[index + 1].timestampMs - sorted[index].timestampMs) / 3600000;
    if (hours > 0) return hours;
  }
  if (index > 0) {
    const hours = (sorted[index].timestampMs - sorted[index - 1].timestampMs) / 3600000;
    if (hours > 0) return hours;
  }
  return fallbackHours;
}

function isDaytimeHour(hour: number): boolean {
  return hour >= DAYTIME_HOUR_START && hour < DAYTIME_HOUR_END;
}

export function summarizeConsumptionProfile(rows: ConsumptionCsvRow[]): ConsumptionProfileSummary {
  if (rows.length === 0) {
    throw new Error("Tarbimisprofiili ei saa arvutada tühjast reast.");
  }

  const sorted = [...rows].sort((a, b) => a.timestampMs - b.timestampMs);
  const diffsMin: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const minutes = (sorted[i].timestampMs - sorted[i - 1].timestampMs) / 60000;
    if (minutes > 0 && minutes <= 24 * 60) diffsMin.push(minutes);
  }

  const { interval, intervalMinutes } = classifyInterval(diffsMin);
  const regularStepHours =
    interval === "hour" || interval === "15min" ? (intervalMinutes as number) / 60 : null;
  const fallbackHours = (intervalMinutes ?? 60) / 60;

  let totalKwh = 0;
  let daytimeKwh = 0;
  let peakLoadKw = 0;
  const dayKeys = new Set<string>();

  sorted.forEach((row, index) => {
    totalKwh += row.consumptionKwh;
    if (isDaytimeHour(row.hour)) daytimeKwh += row.consumptionKwh;
    const hours = regularStepHours ?? rowDurationHours(sorted, index, fallbackHours);
    const loadKw = hours > 0 ? row.consumptionKwh / hours : row.consumptionKwh;
    if (loadKw > peakLoadKw) peakLoadKw = loadKw;
    dayKeys.add(`${row.year}-${pad2(row.month)}-${pad2(row.day)}`);
  });

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const spanHours = Math.max((last.timestampMs - first.timestampMs) / 3600000, 0);
  const trailingHours = regularStepHours ?? rowDurationHours(sorted, sorted.length - 1, fallbackHours);
  const coveredHours = Math.max(spanHours + trailingHours, trailingHours);
  const isFullYearEstimate = coveredHours >= HOURS_PER_YEAR * 0.9;
  const estimatedAnnualKwh = totalKwh * (HOURS_PER_YEAR / coveredHours);
  const daytimeSharePercent = totalKwh > 0 ? (daytimeKwh / totalKwh) * 100 : 0;

  return {
    rowCount: sorted.length,
    periodStartMs: first.timestampMs,
    periodEndMs: last.timestampMs,
    periodStartLabel: formatNaiveLabel(first),
    periodEndLabel: formatNaiveLabel(last),
    totalConsumptionMwh: totalKwh / 1000,
    estimatedAnnualConsumptionMwh: estimatedAnnualKwh / 1000,
    averageLoadKw: coveredHours > 0 ? totalKwh / coveredHours : 0,
    peakLoadKw,
    daytimeSharePercent,
    nighttimeSharePercent: 100 - daytimeSharePercent,
    averageDailyConsumptionKwh: dayKeys.size > 0 ? totalKwh / dayKeys.size : totalKwh,
    interval,
    intervalMinutes,
    coveredHours,
    isFullYearEstimate,
  };
}

export function consumptionProfileToFormFields(summary: ConsumptionProfileSummary): {
  annualConsumptionMwh: number;
  daytimeSharePercent: number;
  peakLoadKw: number;
} {
  return {
    annualConsumptionMwh: summary.estimatedAnnualConsumptionMwh,
    daytimeSharePercent: summary.daytimeSharePercent,
    peakLoadKw: summary.peakLoadKw,
  };
}

export function describeConsumptionInterval(summary: ConsumptionProfileSummary): string {
  if (summary.interval === "hour") return "1 tund";
  if (summary.interval === "15min") return "15 minutit";
  if (summary.interval === "irregular") {
    return "ebaühtlane ajasamm (mixed) — tipukoormus on hinnanguline";
  }
  if (summary.intervalMinutes != null) return `${summary.intervalMinutes} minutit`;
  return "tuvastamata";
}
