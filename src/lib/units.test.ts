import { describe, expect, it } from "vitest";
import { parseLocaleNumber, toNumber } from "./units";

describe("parseLocaleNumber", () => {
  it("parses Estonian decimal comma and dot", () => {
    expect(parseLocaleNumber("0,16")).toBeCloseTo(0.16, 8);
    expect(parseLocaleNumber("6,5")).toBeCloseTo(6.5, 8);
    expect(parseLocaleNumber("0.16")).toBeCloseTo(0.16, 8);
    expect(parseLocaleNumber("11")).toBe(11);
    expect(parseLocaleNumber("30")).toBe(30);
    expect(parseLocaleNumber("")).toBeNull();
    expect(parseLocaleNumber("   ")).toBeNull();
  });

  it("strips common units and spaces", () => {
    expect(parseLocaleNumber("11 kW")).toBe(11);
    expect(parseLocaleNumber("30 kWh")).toBe(30);
    expect(parseLocaleNumber("0,16 €/kWh")).toBeCloseTo(0.16, 8);
    expect(parseLocaleNumber("1 234,56")).toBeCloseTo(1234.56, 8);
  });

  it("toNumber returns 0 for empty", () => {
    expect(toNumber("")).toBe(0);
    expect(toNumber("0,16")).toBeCloseTo(0.16, 8);
  });
});
