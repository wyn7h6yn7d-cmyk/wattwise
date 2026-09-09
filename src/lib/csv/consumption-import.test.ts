import { describe, expect, it } from "vitest";
import { parseConsumptionCsv } from "./consumption-import";

describe("parseConsumptionCsv", () => {
  it("parses kWh CSV and builds monthly summary", () => {
    const csv = [
      "timestamp;kwh",
      "2026-01-01T00:00:00Z;1,5",
      "2026-01-01T01:00:00Z;2,0",
      "2026-02-01T00:00:00Z;3,0",
    ].join("\n");
    const result = parseConsumptionCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.rowCount).toBe(3);
    expect(result.summary.annualKwh).toBeCloseTo(6.5, 4);
    expect(result.summary.monthlyKwh[0]).toBeCloseTo(3.5, 4);
    expect(result.summary.monthlyKwh[1]).toBeCloseTo(3.0, 4);
  });

  it("parses kW CSV and infers peak values", () => {
    const csv = [
      "date,time,kw",
      "2026-01-01,00:00,4",
      "2026-01-01,01:00,8",
      "2026-01-01,02:00,9",
      "2026-01-01,03:00,3",
    ].join("\n");
    const result = parseConsumptionCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.maxKw).toBeCloseTo(9, 4);
    expect(result.summary.avgPeakDurationHours).not.toBeNull();
  });

  it("returns controlled error for missing consumption columns", () => {
    const csv = [
      "timestamp;foo",
      "2026-01-01T00:00:00Z;1",
    ].join("\n");
    const result = parseConsumptionCsv(csv);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("tarbimise veerg");
  });
});
