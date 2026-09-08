import { describe, expect, it } from "vitest";
import type { ConsumptionCsvRow } from "../consumption/parse-consumption-csv";
import { simulateIndustrialTimeseries } from "../calculators/industrial-timeseries";
import { matchPriceSeriesToConsumption } from "./match-price-series";
import { parsePriceCsv, SAMPLE_PRICE_CSV } from "./parse-price-csv";

function consumptionRow(isoLocal: string, consumptionKwh: number): ConsumptionCsvRow {
  const [datePart, timePart = "00:00"] = isoLocal.split(" ");
  const [year, month, day] = datePart!.split("-").map(Number);
  const [hour, minute = 0] = timePart.split(":").map(Number);
  return {
    timestampRaw: isoLocal,
    year: year!,
    month: month!,
    day: day!,
    hour: hour!,
    minute: minute!,
    timestampMs: Date.UTC(year!, month! - 1, day!, hour!, minute!),
    consumptionKwh,
  };
}

describe("price series CSV and matching v0.8", () => {
  it("parses a correct price CSV", () => {
    const parsed = parsePriceCsv(SAMPLE_PRICE_CSV);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.rows).toHaveLength(3);
    expect(parsed.rows[0]!.buyPriceEurPerMwh).toBe(95);
    expect(parsed.rows[0]!.exportPriceEurPerMwh).toBe(45);
    expect(parsed.rows[1]!.buyPriceEurPerMwh).toBe(90);
  });

  it("parses semicolon-delimited price CSV", () => {
    const csv = [
      "timestamp;buy_price_eur_mwh;export_price_eur_mwh",
      "2026-01-01 00:00;95,5;45,0",
      "2026-01-01 01:00;90;40",
    ].join("\n");
    const parsed = parsePriceCsv(csv);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]!.buyPriceEurPerMwh).toBeCloseTo(95.5, 6);
  });

  it("errors when a price column is missing", () => {
    const missingBuy = parsePriceCsv(
      ["timestamp,export_price_eur_mwh", "2026-01-01 00:00,45"].join("\n"),
    );
    expect(missingBuy.ok).toBe(false);
    if (missingBuy.ok) return;
    expect(missingBuy.error).toMatch(/ostuhinna/i);

    const missingExport = parsePriceCsv(
      ["timestamp,buy_price_eur_mwh", "2026-01-01 00:00,95"].join("\n"),
    );
    expect(missingExport.ok).toBe(false);
    if (missingExport.ok) return;
    expect(missingExport.error).toMatch(/müügihinna/i);
  });

  it("matches consumption rows to prices by timestamp", () => {
    const prices = parsePriceCsv(SAMPLE_PRICE_CSV);
    expect(prices.ok).toBe(true);
    if (!prices.ok) return;

    const consumption = [
      consumptionRow("2026-01-01 00:00", 10),
      consumptionRow("2026-01-01 01:00", 12),
    ];
    const matched = matchPriceSeriesToConsumption({
      consumptionRows: consumption,
      priceRows: prices.rows,
      fallbackBuyEurPerMwh: 100,
      fallbackExportEurPerMwh: 40,
    });
    expect(matched.exactCount).toBe(2);
    expect(matched.matchedFromSeriesCount).toBe(2);
    expect(matched.unmatchedCount).toBe(0);
    expect(matched.points[0]!.buyPriceEurPerMwh).toBe(95);
    expect(matched.points[1]!.exportPriceEurPerMwh).toBe(40);
    expect(matched.warning).toBeNull();
  });

  it("warns when some consumption rows have no price", () => {
    const prices = parsePriceCsv(SAMPLE_PRICE_CSV);
    expect(prices.ok).toBe(true);
    if (!prices.ok) return;

    const consumption = [
      consumptionRow("2026-01-01 00:00", 10),
      consumptionRow("2026-06-15 12:00", 20),
    ];
    const matched = matchPriceSeriesToConsumption({
      consumptionRows: consumption,
      priceRows: prices.rows,
      fallbackBuyEurPerMwh: 110,
      fallbackExportEurPerMwh: 45,
      maxNearestMs: 60 * 60 * 1000,
    });
    expect(matched.matchedFromSeriesCount).toBe(1);
    expect(matched.unmatchedCount).toBe(1);
    expect(matched.fallbackCount).toBe(1);
    expect(matched.points[1]!.buyPriceEurPerMwh).toBe(110);
    expect(matched.warning).toMatch(/jäi hinnaseeriast sidumata/i);
  });

  it("keeps flat average price mode working", () => {
    const rows = [consumptionRow("2026-06-01 12:00", 50), consumptionRow("2026-06-01 13:00", 55)];
    const result = simulateIndustrialTimeseries({
      rows,
      pvPowerKw: 100,
      pvSpecificYieldKwhPerKw: 1000,
      batteryCapacityKwh: 0,
      batteryPowerKw: 0,
      batteryPurpose: "self_consumption",
      batteryEfficiencyPercent: 90,
      batteryUsableCapacityPercent: 80,
      intervalMinutes: 60,
      buyPriceEurPerMwh: 100,
      exportPriceEurPerMwh: 45,
      demandChargeEurPerKwMonth: 6.5,
      priceSeries: null,
    });
    expect(result.economics.priceMode).toBe("flat_average");
    expect(result.steps.every((s) => s.buyPriceEurPerMwh === 100)).toBe(true);
  });

  it("changes period monetary result when a price series is applied", () => {
    const rows = [
      consumptionRow("2026-01-01 00:00", 40),
      consumptionRow("2026-01-01 01:00", 40),
      consumptionRow("2026-01-01 12:00", 40),
      consumptionRow("2026-01-01 13:00", 40),
    ];
    const flat = simulateIndustrialTimeseries({
      rows,
      pvPowerKw: 200,
      pvSpecificYieldKwhPerKw: 1000,
      batteryCapacityKwh: 0,
      batteryPowerKw: 0,
      batteryPurpose: "self_consumption",
      batteryEfficiencyPercent: 90,
      batteryUsableCapacityPercent: 80,
      intervalMinutes: 60,
      buyPriceEurPerMwh: 100,
      exportPriceEurPerMwh: 45,
      demandChargeEurPerKwMonth: 6.5,
    });

    const prices = parsePriceCsv(
      [
        "timestamp,buy_price_eur_mwh,export_price_eur_mwh",
        "2026-01-01 00:00,200,10",
        "2026-01-01 01:00,200,10",
        "2026-01-01 12:00,20,80",
        "2026-01-01 13:00,20,80",
      ].join("\n"),
    );
    expect(prices.ok).toBe(true);
    if (!prices.ok) return;

    const matched = matchPriceSeriesToConsumption({
      consumptionRows: rows,
      priceRows: prices.rows,
      fallbackBuyEurPerMwh: 100,
      fallbackExportEurPerMwh: 45,
    });

    const series = simulateIndustrialTimeseries({
      rows,
      pvPowerKw: 200,
      pvSpecificYieldKwhPerKw: 1000,
      batteryCapacityKwh: 0,
      batteryPowerKw: 0,
      batteryPurpose: "self_consumption",
      batteryEfficiencyPercent: 90,
      batteryUsableCapacityPercent: 80,
      intervalMinutes: 60,
      buyPriceEurPerMwh: 100,
      exportPriceEurPerMwh: 45,
      demandChargeEurPerKwMonth: 6.5,
      priceSeries: matched.points,
    });

    expect(series.economics.priceMode).toBe("step_series");
    expect(series.economics.periodImpactEur).not.toBeCloseTo(flat.economics.periodImpactEur, 2);
  });
});
