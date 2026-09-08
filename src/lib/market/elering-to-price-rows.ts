import type { MarketPricePoint } from "../elering";
import type { PriceCsvRow } from "./parse-price-csv";

/**
 * Maps Elering NPS points to industrial price rows.
 * Buy = spot €/MWh; export uses the provided flat export price (feed-in is not in NPS).
 */
export function eleringPointsToPriceRows(
  points: MarketPricePoint[],
  exportPriceEurPerMwh: number,
): PriceCsvRow[] {
  const exportPrice = Number.isFinite(exportPriceEurPerMwh) ? exportPriceEurPerMwh : 0;
  return points.map((point) => {
    const date = new Date(point.ts * 1000);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const buyPriceEurPerMwh = point.price_eur_per_kwh * 1000;
    return {
      timestampRaw: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      year,
      month,
      day,
      hour,
      minute,
      timestampMs: Date.UTC(year, month - 1, day, hour, minute, 0),
      buyPriceEurPerMwh,
      exportPriceEurPerMwh: exportPrice,
    };
  });
}
