import { describe, expect, it } from "vitest";
import {
  INDUSTRIAL_ECONOMICS_DEFAULTS,
  calculateIndustrial,
  type IndustrialInput,
} from "./industrial";
import { calculateIndustrialScenarios, recommendIndustrialScenario } from "./industrial-scenarios";

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
    investmentEur: null,
    ...INDUSTRIAL_ECONOMICS_DEFAULTS,
    ...overrides,
  };
}

describe("industrial scenarios v0.5", () => {
  it("gives zero impact and zero investment for the base scenario", () => {
    const comparison = calculateIndustrialScenarios(baseInput());
    const base = comparison.scenarios.find((s) => s.id === "base");
    expect(base).toBeDefined();
    expect(base!.annualSavingsEur).toBe(0);
    expect(base!.investmentEur).toBe(0);
    expect(base!.pvProductionMwh).toBe(0);
    expect(base!.selfConsumedPvMwh).toBe(0);
    expect(base!.peakLoadAfterKw).toBeCloseTo(800, 6);
    expect(base!.paybackYears).toBeNull();
  });

  it("computes PV-only investment from PV kW × €/kW", () => {
    const comparison = calculateIndustrialScenarios(
      baseInput({ pvPowerKw: 500, pvInvestmentEurPerKw: 700 }),
    );
    const pvOnly = comparison.scenarios.find((s) => s.id === "pv_only")!;
    expect(pvOnly.investmentEur).toBeCloseTo(500 * 700, 6);
  });

  it("computes PV + battery investment from PV kW and battery kWh", () => {
    const comparison = calculateIndustrialScenarios(
      baseInput({
        pvPowerKw: 500,
        batteryCapacityKwh: 400,
        pvInvestmentEurPerKw: 700,
        batteryInvestmentEurPerKwh: 350,
      }),
    );
    const withBattery = comparison.scenarios.find((s) => s.id === "pv_battery_self")!;
    expect(withBattery.investmentEur).toBeCloseTo(500 * 700 + 400 * 350, 6);
    const peak = comparison.scenarios.find((s) => s.id === "pv_battery_peak")!;
    expect(peak.investmentEur).toBeCloseTo(500 * 700 + 400 * 350, 6);
  });

  it("values exported PV as export revenue", () => {
    const comparison = calculateIndustrialScenarios(
      baseInput({ exportPriceEurPerMwh: 45, batteryCapacityKwh: 0, batteryPowerKw: 0 }),
    );
    const pvOnly = comparison.scenarios.find((s) => s.id === "pv_only")!;
    expect(pvOnly.exportedPvMwh).toBeGreaterThan(0);
    expect(pvOnly.exportRevenueEur).toBeCloseTo(pvOnly.exportedPvMwh * 45, 6);
    expect(pvOnly.annualSavingsEur).toBeCloseTo(
      pvOnly.selfConsumptionSavingsEur + pvOnly.exportRevenueEur + pvOnly.demandChargeSavingsEur,
      6,
    );
  });

  it("adds demand-charge savings in peak-shaving mode", () => {
    const comparison = calculateIndustrialScenarios(
      baseInput({
        batteryPurpose: "peak_shaving",
        demandChargeEurPerKwMonth: 6.5,
      }),
    );
    const peak = comparison.scenarios.find((s) => s.id === "pv_battery_peak")!;
    const self = comparison.scenarios.find((s) => s.id === "pv_battery_self")!;
    expect(peak.peakLoadAfterKw).toBeLessThan(comparison.peakLoadBeforeKw);
    expect(peak.demandChargeSavingsEur).toBeGreaterThan(0);
    expect(self.demandChargeSavingsEur).toBe(0);
    expect(peak.demandChargeSavingsEur).toBeCloseTo(
      (comparison.peakLoadBeforeKw - peak.peakLoadAfterKw) * 6.5 * 12,
      6,
    );
  });

  it("uses each scenario's own investment for payback", () => {
    const comparison = calculateIndustrialScenarios(baseInput());
    const pvOnly = comparison.scenarios.find((s) => s.id === "pv_only")!;
    const withBattery = comparison.scenarios.find((s) => s.id === "pv_battery_self")!;
    expect(pvOnly.paybackYears).not.toBeNull();
    expect(withBattery.paybackYears).not.toBeNull();
    expect(pvOnly.paybackYears!).toBeCloseTo(pvOnly.investmentEur / pvOnly.annualSavingsEur, 6);
    expect(withBattery.paybackYears!).toBeCloseTo(
      withBattery.investmentEur / withBattery.annualSavingsEur,
      6,
    );
    expect(withBattery.investmentEur).toBeGreaterThan(pvOnly.investmentEur);
  });

  it("identifies the highest total annual impact scenario", () => {
    const comparison = calculateIndustrialScenarios(baseInput());
    const max = Math.max(...comparison.scenarios.map((s) => s.annualSavingsEur));
    const winner = comparison.scenarios.find((s) => s.id === comparison.bestSavingsId)!;
    expect(winner.annualSavingsEur).toBeCloseTo(max, 6);
    expect(comparison.conclusion.bestSavingsLabel).toBe(winner.label);
  });

  it("does not compute payback when annual impact is zero", () => {
    const comparison = calculateIndustrialScenarios(
      baseInput({
        pvPowerKw: 0,
        pvSpecificYieldKwhPerKw: 0,
        batteryCapacityKwh: 0,
        batteryPowerKw: 0,
      }),
    );
    for (const row of comparison.scenarios) {
      expect(row.annualSavingsEur).toBe(0);
      expect(row.paybackYears).toBeNull();
    }
  });

  it("still increases on-site use with PV + self-consumption battery", () => {
    const comparison = calculateIndustrialScenarios(baseInput());
    const pvOnly = comparison.scenarios.find((s) => s.id === "pv_only")!;
    const withBattery = comparison.scenarios.find((s) => s.id === "pv_battery_self")!;
    expect(withBattery.selfConsumedPvMwh).toBeGreaterThan(pvOnly.selfConsumedPvMwh);
    expect(withBattery.exportedPvMwh).toBeLessThan(pvOnly.exportedPvMwh);
  });

  it("matches calculateIndustrial energy flows for PV-only", () => {
    const comparison = calculateIndustrialScenarios(baseInput());
    const pvOnly = comparison.scenarios.find((s) => s.id === "pv_only")!;
    const direct = calculateIndustrial(
      baseInput({ batteryCapacityKwh: 0, batteryPowerKw: 0, batteryPurpose: "self_consumption" }),
    );
    expect(pvOnly.pvProductionMwh).toBeCloseTo(direct.pvProductionMwh, 6);
    expect(pvOnly.selfConsumedPvMwh).toBeCloseTo(direct.selfConsumedPvMwh, 6);
    expect(pvOnly.annualSavingsEur).toBeCloseTo(direct.annualSavingsEur, 6);
  });
});

describe("industrial scenario recommendation", () => {
  it("names the best savings scenario in the headline", () => {
    const comparison = calculateIndustrialScenarios(baseInput());
    const rec = recommendIndustrialScenario(comparison);
    expect(rec.headline).toContain(rec.scenarioLabel);
    expect(rec.body.length).toBeGreaterThan(20);
    expect(rec.scenarioId).toBe(comparison.bestSavingsId);
  });
});
