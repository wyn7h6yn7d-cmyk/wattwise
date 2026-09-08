import { describe, expect, it } from "vitest";
import { parseConsumptionCsv } from "../consumption/parse-consumption-csv";
import { parsePriceCsv } from "../market/parse-price-csv";
import { matchPriceSeriesToConsumption } from "../market/match-price-series";
import { buildDemoConsumptionCsv, buildDemoPricesCsv } from "./demo-data";

describe("industrial demo data v1.0", () => {
  it("builds matching 7-day consumption and price demos", () => {
    const consumption = parseConsumptionCsv(buildDemoConsumptionCsv());
    const prices = parsePriceCsv(buildDemoPricesCsv());
    expect(consumption.ok).toBe(true);
    expect(prices.ok).toBe(true);
    if (!consumption.ok || !prices.ok) return;

    expect(consumption.rows).toHaveLength(7 * 24);
    expect(prices.rows).toHaveLength(7 * 24);
    expect(consumption.rows[0]!.timestampMs).toBe(prices.rows[0]!.timestampMs);
    expect(consumption.rows.at(-1)!.timestampMs).toBe(prices.rows.at(-1)!.timestampMs);

    const matched = matchPriceSeriesToConsumption({
      consumptionRows: consumption.rows,
      priceRows: prices.rows,
      fallbackBuyEurPerMwh: 100,
      fallbackExportEurPerMwh: 45,
    });
    expect(matched.exactCount).toBe(7 * 24);
    expect(matched.unmatchedCount).toBe(0);
    expect(matched.warning).toBeNull();
  });
});
