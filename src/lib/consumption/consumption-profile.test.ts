import { describe, expect, it } from "vitest";
import { parseConsumptionCsv } from "./parse-consumption-csv";
import { summarizeConsumptionProfile } from "./consumption-profile";

const HOURLY_CSV = [
  "timestamp,consumption_kwh",
  "2026-01-01 00:00,100",
  "2026-01-01 01:00,100",
  "2026-01-01 08:00,200",
  "2026-01-01 09:00,200",
  "2026-01-01 11:00,300",
  "2026-01-01 20:00,100",
].join("\n");

describe("consumption CSV v0.2", () => {
  it("parses a correct comma CSV", () => {
    const parsed = parseConsumptionCsv(HOURLY_CSV);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.rows).toHaveLength(6);
    expect(parsed.rows[0].consumptionKwh).toBe(100);
    expect(parsed.rows[4].hour).toBe(11);
  });

  it("parses a correct semicolon CSV with comma decimals", () => {
    const csv = [
      "aeg;tarbimine_kwh",
      "2026-01-01 00:00;100,5",
      "2026-01-01 01:00;99,5",
    ].join("\n");
    const parsed = parseConsumptionCsv(csv);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].consumptionKwh).toBeCloseTo(100.5, 6);
    expect(parsed.rows[1].consumptionKwh).toBeCloseTo(99.5, 6);
  });

  it("returns an error for unknown column names", () => {
    const csv = ["foo,bar", "2026-01-01 00:00,120"].join("\n");
    const parsed = parseConsumptionCsv(csv);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toContain("CSV failist ei leitud aja või tarbimise veergu.");
  });

  it("returns an error for an empty or too short file", () => {
    expect(parseConsumptionCsv("").ok).toBe(false);
    const short = parseConsumptionCsv("timestamp,consumption_kwh\n");
    expect(short.ok).toBe(false);
    if (short.ok) return;
    expect(short.error).toContain("CSV fail on tühi või liiga lühike.");
  });

  it("returns an error for negative consumption", () => {
    const csv = ["timestamp,consumption_kwh", "2026-01-01 00:00,-12"].join("\n");
    const parsed = parseConsumptionCsv(csv);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toContain("CSV failis on vigased tarbimisväärtused.");
  });

  it("counts rows and total consumption correctly", () => {
    const parsed = parseConsumptionCsv(HOURLY_CSV);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const summary = summarizeConsumptionProfile(parsed.rows);
    expect(summary.rowCount).toBe(6);
    expect(summary.totalConsumptionMwh).toBeCloseTo(1, 6);
    expect(summary.periodStartLabel).toBe("2026-01-01 00:00");
    expect(summary.periodEndLabel).toBe("2026-01-01 20:00");
  });

  it("computes peak load from hourly energy", () => {
    const parsed = parseConsumptionCsv(HOURLY_CSV);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const summary = summarizeConsumptionProfile(parsed.rows);
    expect(summary.peakLoadKw).toBeCloseTo(300, 6);
    expect(summary.averageLoadKw).toBeGreaterThan(0);
  });

  it("computes daytime consumption share for 08:00–20:00", () => {
    const parsed = parseConsumptionCsv(HOURLY_CSV);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const summary = summarizeConsumptionProfile(parsed.rows);
    expect(summary.daytimeSharePercent).toBeCloseTo(70, 6);
    expect(summary.nighttimeSharePercent).toBeCloseTo(30, 6);
  });

  it("detects hourly interval", () => {
    const parsed = parseConsumptionCsv(HOURLY_CSV);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const summary = summarizeConsumptionProfile(parsed.rows);
    expect(summary.interval).toBe("hour");
    expect(summary.intervalMinutes).toBe(60);
  });

  it("detects 15-minute interval and peak as kW", () => {
    const csv = [
      "timestamp,consumption_kwh",
      "2026-01-01 00:00,10",
      "2026-01-01 00:15,10",
      "2026-01-01 00:30,20",
      "2026-01-01 00:45,10",
    ].join("\n");
    const parsed = parseConsumptionCsv(csv);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const summary = summarizeConsumptionProfile(parsed.rows);
    expect(summary.interval).toBe("15min");
    expect(summary.intervalMinutes).toBe(15);
    expect(summary.rowCount).toBe(4);
    expect(summary.totalConsumptionMwh).toBeCloseTo(0.05, 6);
    expect(summary.peakLoadKw).toBeCloseTo(80, 6);
  });
});
