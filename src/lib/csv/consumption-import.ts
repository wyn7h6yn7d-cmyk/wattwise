import { parseConsumptionCsv as parseConsumptionCsvRows } from "../import/consumption-csv";

export type ConsumptionImportSummary = {
  rowCount: number;
  annualKwh: number;
  averageMonthlyKwh: number;
  monthlyKwh: number[];
  maxKw: number | null;
  avgPeakDurationHours: number | null;
  peaksPerMonth: number | null;
};

export type ConsumptionImportResult =
  | { ok: true; summary: ConsumptionImportSummary }
  | { ok: false; error: string };

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function inferIntervalHours(timestamps: Date[]): number | null {
  const sorted = timestamps
    .map((ts) => ts.getTime())
    .sort((a, b) => a - b);
  if (sorted.length < 2) return null;
  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const diffHours = (sorted[i] - sorted[i - 1]) / (1000 * 60 * 60);
    if (diffHours > 0 && diffHours <= 24) diffs.push(diffHours);
  }
  return median(diffs);
}

function monthIndex(date: Date) {
  return date.getMonth();
}

export function parseConsumptionCsv(csvText: string): ConsumptionImportResult {
  const parsed = parseConsumptionCsvRows(csvText);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const rows = parsed.rows.map((row) => ({
    timestamp: new Date(row.timestamp),
    consumptionKwh: row.consumptionKwh,
  }));
  const intervalHours = inferIntervalHours(rows.map((row) => row.timestamp));
  const monthlyKwh = Array.from({ length: 12 }, () => 0);
  let annualKwh = 0;
  let maxKw: number | null = null;
  let peakStarts = 0;
  const thresholdPeaks: Array<{ month: number; starts: number }> = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const ts = row.timestamp;
    const kwh = row.consumptionKwh;
    const kw = intervalHours != null && intervalHours > 0 ? kwh / intervalHours : null;

    if (kwh >= 0) {
      monthlyKwh[monthIndex(ts)] += kwh;
      annualKwh += kwh;
    }
    if (kw != null && kw >= 0) {
      maxKw = maxKw == null ? kw : Math.max(maxKw, kw);
    }

    if (i > 0 && kw != null && maxKw != null) {
      const prevKwh = rows[i - 1].consumptionKwh;
      const prevKw = intervalHours != null && intervalHours > 0 ? prevKwh / intervalHours : null;
      const threshold = maxKw * 0.9;
      if ((prevKw == null || prevKw < threshold) && kw >= threshold) {
        peakStarts += 1;
        thresholdPeaks.push({ month: monthIndex(ts), starts: 1 });
      }
    }
  }

  let avgPeakDurationHours: number | null = null;
  if (intervalHours != null && maxKw != null && maxKw > 0) {
    const threshold = maxKw * 0.9;
    const runs: number[] = [];
    let currentRun = 0;
    for (const row of rows) {
      const kw = intervalHours > 0 ? row.consumptionKwh / intervalHours : null;
      if (kw != null && kw >= threshold) {
        currentRun += 1;
      } else if (currentRun > 0) {
        runs.push(currentRun * intervalHours);
        currentRun = 0;
      }
    }
    if (currentRun > 0) runs.push(currentRun * intervalHours);
    avgPeakDurationHours = runs.length ? runs.reduce((sum, x) => sum + x, 0) / runs.length : null;
  }

  const monthWithData = monthlyKwh.filter((value) => value > 0).length;
  const averageMonthlyKwh = monthWithData > 0 ? annualKwh / monthWithData : 0;
  const peaksPerMonth =
    thresholdPeaks.length > 0 && monthWithData > 0 ? Math.max(1, Math.round(peakStarts / monthWithData)) : null;

  return {
    ok: true,
    summary: {
      rowCount: rows.length,
      annualKwh,
      averageMonthlyKwh,
      monthlyKwh,
      maxKw,
      avgPeakDurationHours,
      peaksPerMonth,
    },
  };
}
