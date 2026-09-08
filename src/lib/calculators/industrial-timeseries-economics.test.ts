import { describe, expect, it } from "vitest";
import type { ConsumptionCsvRow } from "@/lib/consumption/parse-consumption-csv";
import { HOURS_PER_YEAR, simulateIndustrialTimeseries } from "./industrial-timeseries";

function row(isoLocal: string, consumptionKwh: number): ConsumptionCsvRow {
  const [datePart, timePart = "00:00"] = isoLocal.split(" ");
  const [year, month, day] = datePart!.split("-").map(Number);
  const [hour, minute = 0] = timePart.split(":").map(Number);
  const timestampMs = Date.UTC(year!, month! - 1, day!, hour!, minute!);
  return {
    timestampRaw: isoLocal,
    year: year!,
    month: month!,
    day: day!,
    hour: hour!,
    minute: minute!,
    timestampMs,
    consumptionKwh,
  };
}

function twoDayProfile(): ConsumptionCsvRow[] {
  const rows: ConsumptionCsvRow[] = [];
  for (const day of [1, 2]) {
    for (let hour = 0; hour < 24; hour += 1) {
      const load = hour >= 8 && hour <= 18 ? 40 : 25;
      rows.push(row(`2026-06-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:00`, load));
    }
  }
  return rows;
}

const baseConfig = {
  pvPowerKw: 400,
  pvSpecificYieldKwhPerKw: 1000,
  batteryCapacityKwh: 200,
  batteryPowerKw: 80,
  batteryPurpose: "self_consumption" as const,
  batteryEfficiencyPercent: 90,
  batteryUsableCapacityPercent: 80,
  intervalMinutes: 60,
  buyPriceEurPerMwh: 100,
  exportPriceEurPerMwh: 45,
  demandChargeEurPerKwMonth: 6.5,
};

describe("industrial timeseries economics v0.7", () => {
  it("reduces grid import when PV is present", () => {
    const rows = twoDayProfile();
    const withPv = simulateIndustrialTimeseries({ ...baseConfig, rows });
    const withoutPv = simulateIndustrialTimeseries({
      ...baseConfig,
      pvPowerKw: 0,
      pvSpecificYieldKwhPerKw: 0,
      batteryCapacityKwh: 0,
      batteryPowerKw: 0,
      rows,
    });
    expect(withPv.economics.gridImportAfterKwh).toBeLessThan(withPv.economics.gridImportBeforeKwh);
    expect(withPv.economics.gridImportAfterKwh).toBeLessThan(withoutPv.economics.gridImportAfterKwh);
    expect(withPv.economics.avoidedGridImportKwh).toBeGreaterThan(0);
  });

  it("values on-site PV at the buy price", () => {
    const result = simulateIndustrialTimeseries({
      ...baseConfig,
      buyPriceEurPerMwh: 120,
      rows: twoDayProfile(),
    });
    const onSitePvKwh = Math.max(result.pvProductionKwh - result.gridExportKwh, 0);
    expect(result.economics.selfConsumptionValueEur).toBeCloseTo((onSitePvKwh / 1000) * 120, 6);
  });

  it("values exported PV at the export price", () => {
    const result = simulateIndustrialTimeseries({
      ...baseConfig,
      exportPriceEurPerMwh: 50,
      batteryCapacityKwh: 0,
      batteryPowerKw: 0,
      rows: twoDayProfile(),
    });
    expect(result.gridExportKwh).toBeGreaterThan(0);
    expect(result.economics.exportRevenueEur).toBeCloseTo((result.gridExportKwh / 1000) * 50, 6);
  });

  it("adds demand-charge savings in peak-shaving mode", () => {
    const rows: ConsumptionCsvRow[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      const load = hour === 18 || hour === 19 ? 200 : 50;
      rows.push(row(`2026-06-01 ${String(hour).padStart(2, "0")}:00`, load));
    }
    const self = simulateIndustrialTimeseries({
      ...baseConfig,
      batteryPurpose: "self_consumption",
      batteryCapacityKwh: 400,
      batteryPowerKw: 120,
      rows,
    });
    const peak = simulateIndustrialTimeseries({
      ...baseConfig,
      batteryPurpose: "peak_shaving",
      batteryCapacityKwh: 400,
      batteryPowerKw: 120,
      peakLoadKw: 200,
      demandChargeEurPerKwMonth: 6.5,
      rows,
    });
    expect(self.economics.demandChargeSavingsEur).toBe(0);
    expect(peak.economics.demandChargeSavingsEur).toBeGreaterThan(0);
    const peakCut = peak.peakLoadBeforeKw - peak.peakLoadAfterKw;
    const months = (peak.coveredHours / HOURS_PER_YEAR) * 12;
    expect(peak.economics.demandChargeSavingsEur).toBeCloseTo(peakCut * 6.5 * months, 6);
  });

  it("annualizes period impact by covered hours", () => {
    const result = simulateIndustrialTimeseries({
      ...baseConfig,
      rows: twoDayProfile(),
    });
    expect(result.coveredHours).toBeCloseTo(48, 6);
    expect(result.economics.isFullYearEstimate).toBe(false);
    expect(result.economics.scaleFactorToYear).toBeCloseTo(HOURS_PER_YEAR / 48, 6);
    expect(result.economics.annualizedImpactEur).toBeCloseTo(
      result.economics.periodImpactEur * (HOURS_PER_YEAR / 48),
      6,
    );
  });

  it("keeps approximate battery cycles non-negative", () => {
    const result = simulateIndustrialTimeseries({
      ...baseConfig,
      rows: twoDayProfile(),
    });
    expect(result.approxBatteryCycles).toBeGreaterThanOrEqual(0);
    expect(result.economics.approxBatteryCycles).toBeGreaterThanOrEqual(0);
  });

  it("keeps monetary impact finite and zero when prices are zero", () => {
    const result = simulateIndustrialTimeseries({
      ...baseConfig,
      buyPriceEurPerMwh: 0,
      exportPriceEurPerMwh: 0,
      demandChargeEurPerKwMonth: 0,
      rows: twoDayProfile(),
    });
    expect(Number.isFinite(result.economics.periodImpactEur)).toBe(true);
    expect(Number.isFinite(result.economics.annualizedImpactEur)).toBe(true);
    expect(result.economics.selfConsumptionValueEur).toBe(0);
    expect(result.economics.exportRevenueEur).toBe(0);
    expect(result.economics.demandChargeSavingsEur).toBe(0);
    expect(result.economics.periodImpactEur).toBe(0);
    expect(result.steps.every((s) => s.buyPriceEurPerMwh === 0 && s.exportPriceEurPerMwh === 0)).toBe(
      true,
    );
  });

  it("attaches flat prices to every step for spot readiness", () => {
    const result = simulateIndustrialTimeseries({
      ...baseConfig,
      buyPriceEurPerMwh: 110,
      exportPriceEurPerMwh: 40,
      rows: twoDayProfile(),
    });
    expect(result.economics.priceMode).toBe("flat_average");
    expect(result.steps.every((s) => s.buyPriceEurPerMwh === 110)).toBe(true);
    expect(result.steps.every((s) => s.exportPriceEurPerMwh === 40)).toBe(true);
  });
});
