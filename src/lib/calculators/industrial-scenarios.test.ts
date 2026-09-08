import { describe, expect, it } from "vitest";
import { calculateIndustrial, type IndustrialInput } from "./industrial";
import { calculateIndustrialScenarios } from "./industrial-scenarios";

function baseInput(overrides: Partial<IndustrialInput> = {}): IndustrialInput {
  return {
    companyName: "Stsenaariumitehas",
    annualConsumptionMwh: 2000,
    daytimeSharePercent: 70,
    peakLoadKw: 800,
    averageElectricityPriceEurPerMwh: 100,
    pvPowerKw: 500,
    pvSpecificYieldKwhPerKw: 1000,
    batteryCapacityKwh: 400,
    batteryPowerKw: 200,
    batteryPurpose: "self_consumption",
    investmentEur: 500000,
    ...overrides,
  };
}

describe("industrial scenarios v0.4", () => {
  it("gives zero savings for the base scenario", () => {
    const comparison = calculateIndustrialScenarios(baseInput());
    const base = comparison.scenarios.find((s) => s.id === "base");
    expect(base).toBeDefined();
    expect(base!.annualSavingsEur).toBe(0);
    expect(base!.pvProductionMwh).toBe(0);
    expect(base!.selfConsumedPvMwh).toBe(0);
    expect(base!.peakLoadAfterKw).toBeCloseTo(800, 6);
    expect(base!.paybackYears).toBeNull();
  });

  it("gives PV-based savings for PV-only", () => {
    const comparison = calculateIndustrialScenarios(baseInput());
    const pvOnly = comparison.scenarios.find((s) => s.id === "pv_only")!;
    const direct = calculateIndustrial(
      baseInput({ batteryCapacityKwh: 0, batteryPowerKw: 0, batteryPurpose: "self_consumption" }),
    );
    expect(pvOnly.pvProductionMwh).toBeCloseTo(500, 6);
    expect(pvOnly.annualSavingsEur).toBeCloseTo(direct.annualSavingsEur, 6);
    expect(pvOnly.annualSavingsEur).toBeGreaterThan(0);
    expect(pvOnly.selfConsumedPvMwh).toBeCloseTo(direct.selfConsumedPvMwh, 6);
  });

  it("increases on-site use with PV + self-consumption battery", () => {
    const comparison = calculateIndustrialScenarios(baseInput());
    const pvOnly = comparison.scenarios.find((s) => s.id === "pv_only")!;
    const withBattery = comparison.scenarios.find((s) => s.id === "pv_battery_self")!;
    expect(withBattery.selfConsumedPvMwh).toBeGreaterThan(pvOnly.selfConsumedPvMwh);
    expect(withBattery.exportedPvMwh).toBeLessThan(pvOnly.exportedPvMwh);
  });

  it("reduces peak load with PV + peak-shaving battery", () => {
    const comparison = calculateIndustrialScenarios(baseInput());
    const peak = comparison.scenarios.find((s) => s.id === "pv_battery_peak")!;
    const self = comparison.scenarios.find((s) => s.id === "pv_battery_self")!;
    expect(peak.peakLoadAfterKw).toBeLessThan(comparison.peakLoadBeforeKw);
    expect(peak.peakLoadAfterKw).toBeLessThan(self.peakLoadAfterKw);
  });

  it("identifies the highest-savings scenario", () => {
    const comparison = calculateIndustrialScenarios(baseInput());
    const max = Math.max(...comparison.scenarios.map((s) => s.annualSavingsEur));
    const winner = comparison.scenarios.find((s) => s.id === comparison.bestSavingsId)!;
    expect(winner.annualSavingsEur).toBeCloseTo(max, 6);
    expect(comparison.conclusion.bestSavingsLabel).toBe(winner.label);
  });

  it("does not compute payback when investment is missing", () => {
    const comparison = calculateIndustrialScenarios(baseInput({ investmentEur: null }));
    for (const row of comparison.scenarios) {
      expect(row.paybackYears).toBeNull();
    }
  });
});
