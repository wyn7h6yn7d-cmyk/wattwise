import { describe, expect, it } from "vitest";
import { INDUSTRIAL_ECONOMICS_DEFAULTS, calculateIndustrial } from "../calculators/industrial";
import { calculateIndustrialScenarios } from "../calculators/industrial-scenarios";
import { simulateIndustrialTimeseries } from "../calculators/industrial-timeseries";
import { parseConsumptionCsv } from "../consumption/parse-consumption-csv";
import {
  consumptionProfileToFormFields,
  summarizeConsumptionProfile,
} from "../consumption/consumption-profile";
import { inferConsumptionProfileInsight } from "../consumption/consumption-profile-insight";
import { parsePriceCsv } from "../market/parse-price-csv";
import { matchPriceSeriesToConsumption } from "../market/match-price-series";
import { buildDemoConsumptionCsv, buildDemoPricesCsv } from "./demo-data";

describe("industrial v1.0 demo journey QA", () => {
  it("runs the full demo CSV → price series → calculate path without warnings", () => {
    const consumptionParsed = parseConsumptionCsv(buildDemoConsumptionCsv());
    expect(consumptionParsed.ok).toBe(true);
    if (!consumptionParsed.ok) return;

    const summary = summarizeConsumptionProfile(consumptionParsed.rows);
    const insight = inferConsumptionProfileInsight(summary);
    const fields = consumptionProfileToFormFields(summary);
    expect(summary.rowCount).toBe(168);
    expect(insight.shapeLabel.length).toBeGreaterThan(0);
    expect(fields.annualConsumptionMwh).toBeGreaterThan(0);

    const pricesParsed = parsePriceCsv(buildDemoPricesCsv());
    expect(pricesParsed.ok).toBe(true);
    if (!pricesParsed.ok) return;

    const matched = matchPriceSeriesToConsumption({
      consumptionRows: consumptionParsed.rows,
      priceRows: pricesParsed.rows,
      fallbackBuyEurPerMwh: 110,
      fallbackExportEurPerMwh: 45,
    });
    expect(matched.unmatchedCount).toBe(0);
    expect(matched.warning).toBeNull();

    const input = {
      companyName: "Demo tehas",
      annualConsumptionMwh: fields.annualConsumptionMwh,
      daytimeSharePercent: fields.daytimeSharePercent,
      peakLoadKw: fields.peakLoadKw,
      averageElectricityPriceEurPerMwh: 110,
      pvPowerKw: 800,
      pvSpecificYieldKwhPerKw: 950,
      batteryCapacityKwh: 500,
      batteryPowerKw: 250,
      batteryPurpose: "self_consumption" as const,
      investmentEur: null,
      ...INDUSTRIAL_ECONOMICS_DEFAULTS,
    };

    const result = calculateIndustrial(input);
    const scenarios = calculateIndustrialScenarios(input);
    const timeseries = simulateIndustrialTimeseries({
      rows: consumptionParsed.rows,
      pvPowerKw: input.pvPowerKw,
      pvSpecificYieldKwhPerKw: input.pvSpecificYieldKwhPerKw,
      batteryCapacityKwh: input.batteryCapacityKwh,
      batteryPowerKw: input.batteryPowerKw,
      batteryPurpose: input.batteryPurpose,
      batteryEfficiencyPercent: input.batteryEfficiencyPercent,
      batteryUsableCapacityPercent: input.batteryUsableCapacityPercent,
      peakLoadKw: input.peakLoadKw,
      intervalMinutes: summary.intervalMinutes,
      buyPriceEurPerMwh: input.averageElectricityPriceEurPerMwh,
      exportPriceEurPerMwh: input.exportPriceEurPerMwh,
      demandChargeEurPerKwMonth: input.demandChargeEurPerKwMonth,
      priceSeries: matched.points,
    });

    expect(result.annualSavingsEur).toBeGreaterThan(0);
    expect(scenarios.scenarios).toHaveLength(4);
    expect(timeseries.economics.priceMode).toBe("step_series");
    expect(timeseries.economics.periodImpactEur).toBeGreaterThan(0);
    expect(Number.isFinite(timeseries.economics.annualizedImpactEur)).toBe(true);
  });

  it("keeps manual/no-CSV industrial calc working without timeseries", () => {
    const result = calculateIndustrial({
      companyName: "Käsitsi",
      annualConsumptionMwh: 2500,
      daytimeSharePercent: 70,
      peakLoadKw: 650,
      averageElectricityPriceEurPerMwh: 110,
      pvPowerKw: 800,
      pvSpecificYieldKwhPerKw: 950,
      batteryCapacityKwh: 500,
      batteryPowerKw: 250,
      batteryPurpose: "self_consumption",
      investmentEur: null,
      ...INDUSTRIAL_ECONOMICS_DEFAULTS,
    });
    expect(result.pvProductionMwh).toBeCloseTo(760, 6);
    expect(result.annualSavingsEur).toBeGreaterThan(0);
  });

  it("returns clear errors for broken consumption and price CSVs", () => {
    const noTs = parseConsumptionCsv("consumption_kwh\n12\n");
    expect(noTs.ok).toBe(false);
    if (!noTs.ok) expect(noTs.error).toMatch(/aja veergu/i);

    const noCons = parseConsumptionCsv("timestamp\n2026-01-01 00:00\n");
    expect(noCons.ok).toBe(false);
    if (!noCons.ok) expect(noCons.error).toMatch(/tarbimise veergu/i);

    const badPrice = parsePriceCsv("timestamp,export_price_eur_mwh\n2026-01-01 00:00,40\n");
    expect(badPrice.ok).toBe(false);
    if (!badPrice.ok) expect(badPrice.error).toMatch(/ostuhinna veergu/i);

    const garbage = parseConsumptionCsv("foo,bar\n1,2\n");
    expect(garbage.ok).toBe(false);
  });

  it("warns when price series does not cover the full consumption period", () => {
    const consumptionParsed = parseConsumptionCsv(buildDemoConsumptionCsv());
    expect(consumptionParsed.ok).toBe(true);
    if (!consumptionParsed.ok) return;

    const shortPrices = parsePriceCsv(
      [
        "timestamp,buy_price_eur_mwh,export_price_eur_mwh",
        "2026-03-01 00:00,100,40",
        "2026-03-01 01:00,105,40",
        "2026-03-01 02:00,110,40",
      ].join("\n"),
    );
    expect(shortPrices.ok).toBe(true);
    if (!shortPrices.ok) return;

    const matched = matchPriceSeriesToConsumption({
      consumptionRows: consumptionParsed.rows,
      priceRows: shortPrices.rows,
      fallbackBuyEurPerMwh: 110,
      fallbackExportEurPerMwh: 45,
    });
    expect(matched.unmatchedCount).toBeGreaterThan(0);
    expect(matched.warning).toBeTruthy();
  });
});
