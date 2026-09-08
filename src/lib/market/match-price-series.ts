import type { ConsumptionCsvRow } from "../consumption/parse-consumption-csv";
import {
  formatPriceTimestampLabel,
  type PriceCsvRow,
} from "./parse-price-csv";

export type PriceMatchKind = "exact" | "same_hour" | "nearest" | "fallback";

export type MatchedPricePoint = {
  timestampMs: number;
  buyPriceEurPerMwh: number;
  exportPriceEurPerMwh: number;
  match: PriceMatchKind;
};

export type MatchPriceSeriesInput = {
  consumptionRows: ConsumptionCsvRow[];
  priceRows: PriceCsvRow[];
  /** Used when no series price can be matched. */
  fallbackBuyEurPerMwh: number;
  fallbackExportEurPerMwh: number;
  /** Max distance for nearest-price match (ms). Default 2h. */
  maxNearestMs?: number;
};

export type MatchPriceSeriesResult = {
  points: MatchedPricePoint[];
  matchedFromSeriesCount: number;
  unmatchedCount: number;
  exactCount: number;
  sameHourCount: number;
  nearestCount: number;
  fallbackCount: number;
  warning: string | null;
  pricePeriodStartLabel: string;
  pricePeriodEndLabel: string;
  priceRowCount: number;
};

const DEFAULT_MAX_NEAREST_MS = 2 * 60 * 60 * 1000;

function hourKey(year: number, month: number, day: number, hour: number): string {
  return `${year}-${month}-${day}-${hour}`;
}

function finitePrice(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Links consumption timestamps to a price series.
 * Preference: exact timestamp → same hour → nearest within window → flat fallback.
 */
export function matchPriceSeriesToConsumption(input: MatchPriceSeriesInput): MatchPriceSeriesResult {
  const maxNearestMs = input.maxNearestMs ?? DEFAULT_MAX_NEAREST_MS;
  const prices = [...input.priceRows].sort((a, b) => a.timestampMs - b.timestampMs);
  const fallbackBuy = finitePrice(input.fallbackBuyEurPerMwh, 0);
  const fallbackExport = finitePrice(input.fallbackExportEurPerMwh, 0);

  const exactMap = new Map<number, PriceCsvRow>();
  const hourMap = new Map<string, PriceCsvRow[]>();
  for (const price of prices) {
    exactMap.set(price.timestampMs, price);
    const key = hourKey(price.year, price.month, price.day, price.hour);
    const bucket = hourMap.get(key) ?? [];
    bucket.push(price);
    hourMap.set(key, bucket);
  }

  const points: MatchedPricePoint[] = [];
  let exactCount = 0;
  let sameHourCount = 0;
  let nearestCount = 0;
  let fallbackCount = 0;

  for (const row of input.consumptionRows) {
    const exact = exactMap.get(row.timestampMs);
    if (exact) {
      exactCount += 1;
      points.push({
        timestampMs: row.timestampMs,
        buyPriceEurPerMwh: exact.buyPriceEurPerMwh,
        exportPriceEurPerMwh: exact.exportPriceEurPerMwh,
        match: "exact",
      });
      continue;
    }

    const hourBucket = hourMap.get(hourKey(row.year, row.month, row.day, row.hour));
    if (hourBucket && hourBucket.length > 0) {
      let best = hourBucket[0]!;
      let bestDist = Math.abs(best.timestampMs - row.timestampMs);
      for (const candidate of hourBucket.slice(1)) {
        const dist = Math.abs(candidate.timestampMs - row.timestampMs);
        if (dist < bestDist) {
          best = candidate;
          bestDist = dist;
        }
      }
      sameHourCount += 1;
      points.push({
        timestampMs: row.timestampMs,
        buyPriceEurPerMwh: best.buyPriceEurPerMwh,
        exportPriceEurPerMwh: best.exportPriceEurPerMwh,
        match: "same_hour",
      });
      continue;
    }

    let nearest: PriceCsvRow | null = null;
    let nearestDist = Number.POSITIVE_INFINITY;
    for (const candidate of prices) {
      const dist = Math.abs(candidate.timestampMs - row.timestampMs);
      if (dist < nearestDist) {
        nearest = candidate;
        nearestDist = dist;
      }
    }

    if (nearest && nearestDist <= maxNearestMs) {
      nearestCount += 1;
      points.push({
        timestampMs: row.timestampMs,
        buyPriceEurPerMwh: nearest.buyPriceEurPerMwh,
        exportPriceEurPerMwh: nearest.exportPriceEurPerMwh,
        match: "nearest",
      });
      continue;
    }

    fallbackCount += 1;
    points.push({
      timestampMs: row.timestampMs,
      buyPriceEurPerMwh: fallbackBuy,
      exportPriceEurPerMwh: fallbackExport,
      match: "fallback",
    });
  }

  const matchedFromSeriesCount = exactCount + sameHourCount + nearestCount;
  const unmatchedCount = fallbackCount;
  let warning: string | null = null;
  if (prices.length === 0) {
    warning = "Hinnaseeria on tühi. Kasutati keskmist ostu- ja müügihinda.";
  } else if (unmatchedCount > 0) {
    warning =
      "Hinnaseeria ei kata kogu tarbimisprofiili. Puuduvates kohtades kasutati keskmist hinda.";
  }

  const first = prices[0];
  const last = prices[prices.length - 1];

  return {
    points,
    matchedFromSeriesCount,
    unmatchedCount,
    exactCount,
    sameHourCount,
    nearestCount,
    fallbackCount,
    warning,
    pricePeriodStartLabel: first ? formatPriceTimestampLabel(first) : "—",
    pricePeriodEndLabel: last ? formatPriceTimestampLabel(last) : "—",
    priceRowCount: prices.length,
  };
}

/** Convert matched points into the shape expected by industrial timeseries. */
export function matchedPointsToTimeseriesPriceSeries(
  points: MatchedPricePoint[],
): Array<{ timestampMs: number; buyPriceEurPerMwh: number; exportPriceEurPerMwh: number }> {
  return points.map((point) => ({
    timestampMs: point.timestampMs,
    buyPriceEurPerMwh: point.buyPriceEurPerMwh,
    exportPriceEurPerMwh: point.exportPriceEurPerMwh,
  }));
}
