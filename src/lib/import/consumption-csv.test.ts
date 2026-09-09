import { describe, expect, it } from "vitest";
import { parseConsumptionCsv } from "./consumption-csv";

describe("parseConsumptionCsv (normalized rows)", () => {
  it("parses datetime + consumption_kwh with comma decimals", () => {
    const csv = [
      "datetime;consumption_kwh",
      "2026-04-01T00:00:00Z;1,25",
      "2026-04-01T01:00:00Z;2.5",
      "",
    ].join("\n");
    const result = parseConsumptionCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].timestamp).toBe("2026-04-01T00:00:00.000Z");
    expect(result.rows[0].consumptionKwh).toBeCloseTo(1.25, 5);
    expect(result.rows[1].consumptionKwh).toBeCloseTo(2.5, 5);
  });

  it("parses kuupäev + kellaaeg + tarbimine", () => {
    const csv = [
      "kuupäev;kellaaeg;tarbimine",
      "2026-04-01;00:00;0,8",
      "2026-04-01;01:00;0,9",
    ].join("\n");
    const result = parseConsumptionCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].consumptionKwh).toBeCloseTo(0.8, 5);
  });

  it("returns controlled error when time columns are missing", () => {
    const csv = [
      "tarbimine",
      "1,2",
    ].join("\n");
    const result = parseConsumptionCsv(csv);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("kuupäeva/aeg");
  });

  it("returns controlled error when consumption column is missing", () => {
    const csv = [
      "datetime;foo",
      "2026-04-01T00:00:00Z;1",
    ].join("\n");
    const result = parseConsumptionCsv(csv);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("tarbimise veerg");
  });
});
