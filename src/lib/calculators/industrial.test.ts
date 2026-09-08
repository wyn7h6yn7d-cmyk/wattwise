import { describe, expect, it } from "vitest";
import {
  INDUSTRIAL_ASSUMPTIONS,
  INDUSTRIAL_SAMPLE_PROFILES,
  calculateIndustrial,
  sanitizeIndustrialInput,
  type IndustrialInput,
} from "./industrial";

function baseInput(overrides: Partial<IndustrialInput> = {}): IndustrialInput {
  return {
    companyName: "Testitehas",
    annualConsumptionMwh: 1000,
    daytimeSharePercent: 70,
    peakLoadKw: 400,
    averageElectricityPriceEurPerMwh: 100,
    pvPowerKw: 200,
    pvSpecificYieldKwhPerKw: 950,
    batteryCapacityKwh: 0,
    batteryPowerKw: 0,
    batteryPurpose: "self_consumption",
    investmentEur: null,
    ...overrides,
  };
}

describe("industrial v0.1", () => {
  it("computes PV production as power times specific yield", () => {
    const result = calculateIndustrial(baseInput({ pvPowerKw: 800, pvSpecificYieldKwhPerKw: 950 }));
    expect(result.pvProductionMwh).toBeCloseTo(760, 6);
  });

  it("raises on-site PV use when daytime share is higher", () => {
    const high = calculateIndustrial(baseInput({ daytimeSharePercent: 80, batteryCapacityKwh: 0 }));
    const low = calculateIndustrial(baseInput({ daytimeSharePercent: 20, batteryCapacityKwh: 0 }));
    expect(high.selfConsumedPvMwh).toBeGreaterThan(low.selfConsumedPvMwh);
    expect(high.selfConsumptionSharePercent).toBeGreaterThan(low.selfConsumptionSharePercent);
  });

  it("does not let battery self-consumption exceed exported PV", () => {
    const result = calculateIndustrial(
      baseInput({
        annualConsumptionMwh: 10000,
        daytimeSharePercent: 100,
        pvPowerKw: 100,
        pvSpecificYieldKwhPerKw: 1000,
        batteryCapacityKwh: 50000,
        batteryPowerKw: 10000,
        batteryPurpose: "self_consumption",
      }),
    );
    expect(result.pvProductionMwh).toBeCloseTo(100, 6);
    expect(result.batterySelfConsumptionImpactMwh).toBeLessThanOrEqual(result.exportedPvMwh + result.batterySelfConsumptionImpactMwh + 1e-9);
    expect(result.selfConsumedPvMwh + result.exportedPvMwh).toBeCloseTo(result.pvProductionMwh, 6);
    expect(result.exportedPvMwh).toBeGreaterThanOrEqual(0);
    expect(result.selfConsumedPvMwh).toBeLessThanOrEqual(result.pvProductionMwh + 1e-9);
  });

  it("caps peak shaving above a realistic floor", () => {
    const result = calculateIndustrial(
      baseInput({
        annualConsumptionMwh: 876,
        peakLoadKw: 1000,
        batteryCapacityKwh: 20000,
        batteryPowerKw: 20000,
        batteryPurpose: "peak_shaving",
      }),
    );
    const avgLoadKw = (876 * 1000) / INDUSTRIAL_ASSUMPTIONS.hoursPerYear;
    const floor = Math.max(avgLoadKw, 1000 * INDUSTRIAL_ASSUMPTIONS.minPeakRemainingShare);
    expect(result.peakLoadAfterKw).toBeCloseTo(floor, 6);
    expect(result.peakLoadAfterKw).toBeGreaterThanOrEqual(floor - 1e-9);
    expect(result.peakLoadAfterKw).toBeLessThan(result.peakLoadBeforeKw);
  });

  it("does not cut peak in self-consumption mode", () => {
    const result = calculateIndustrial(
      baseInput({
        peakLoadKw: 650,
        batteryCapacityKwh: 500,
        batteryPowerKw: 250,
        batteryPurpose: "self_consumption",
      }),
    );
    expect(result.peakLoadAfterKw).toBeCloseTo(result.peakLoadBeforeKw, 6);
  });

  it("sanitizes negative, empty and non-finite inputs", () => {
    const result = calculateIndustrial({
      companyName: "   ",
      annualConsumptionMwh: -12,
      daytimeSharePercent: 250,
      peakLoadKw: Number.NaN,
      averageElectricityPriceEurPerMwh: Number.NEGATIVE_INFINITY,
      pvPowerKw: -5,
      pvSpecificYieldKwhPerKw: Number.NaN,
      batteryCapacityKwh: -1,
      batteryPowerKw: Number.POSITIVE_INFINITY,
      batteryPurpose: "self_consumption",
      investmentEur: -100,
    });
    expect(result.pvProductionMwh).toBe(0);
    expect(result.selfConsumedPvMwh).toBe(0);
    expect(result.annualSavingsEur).toBe(0);
    expect(result.paybackYears).toBeNull();
    expect(result.peakLoadBeforeKw).toBe(0);

    const sanitized = sanitizeIndustrialInput({
      companyName: "   ",
      annualConsumptionMwh: -12,
      daytimeSharePercent: 250,
      peakLoadKw: Number.NaN,
      averageElectricityPriceEurPerMwh: -3,
      pvPowerKw: -5,
      pvSpecificYieldKwhPerKw: Number.NaN,
      batteryCapacityKwh: -1,
      batteryPowerKw: Number.NaN,
      batteryPurpose: "self_consumption",
      investmentEur: 0,
    });
    expect(sanitized.companyName).toBe("Nimetu profiil");
    expect(sanitized.daytimeSharePercent).toBe(100);
    expect(sanitized.investmentEur).toBeNull();
    expect(sanitized.batteryPowerKw).toBe(0);
  });

  it("returns payback only when investment and savings exist", () => {
    const withoutInvestment = calculateIndustrial(baseInput({ investmentEur: null }));
    expect(withoutInvestment.paybackYears).toBeNull();
    expect(withoutInvestment.annualSavingsEur).toBeGreaterThan(0);

    const withInvestment = calculateIndustrial(baseInput({ investmentEur: withoutInvestment.annualSavingsEur * 8 }));
    expect(withInvestment.paybackYears).toBeCloseTo(8, 6);
  });

  it("computes finite results and a summary for all sample profiles", () => {
    for (const profile of INDUSTRIAL_SAMPLE_PROFILES) {
      const result = calculateIndustrial(profile.input);
      expect(Number.isFinite(result.pvProductionMwh)).toBe(true);
      expect(Number.isFinite(result.annualSavingsEur)).toBe(true);
      expect(result.selfConsumedPvMwh + result.exportedPvMwh).toBeCloseTo(result.pvProductionMwh, 6);
      expect(result.summary.length).toBeGreaterThan(40);
      expect(result.summary).toContain("v0.1");
    }
  });

  it("adds demand-charge savings only in peak-shaving mode", () => {
    const shared = {
      batteryCapacityKwh: 600,
      batteryPowerKw: 400,
      peakLoadKw: 1200,
      annualConsumptionMwh: 1800,
    };
    const selfUse = calculateIndustrial(baseInput({ ...shared, batteryPurpose: "self_consumption" }));
    const peakCut = calculateIndustrial(baseInput({ ...shared, batteryPurpose: "peak_shaving" }));
    expect(peakCut.peakLoadAfterKw).toBeLessThan(selfUse.peakLoadAfterKw);
    expect(peakCut.annualSavingsEur).toBeGreaterThan(selfUse.annualSavingsEur);
  });
});
