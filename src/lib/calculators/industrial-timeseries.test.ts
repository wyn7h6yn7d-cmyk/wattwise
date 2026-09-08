import { describe, expect, it } from "vitest";
import type { ConsumptionCsvRow } from "@/lib/consumption/parse-consumption-csv";
import {
  pvDayShapeFactor,
  pvSeasonFactor,
  simulateIndustrialTimeseries,
  timeseriesStepBalanceResidual,
} from "./industrial-timeseries";

function row(
  isoLocal: string,
  consumptionKwh: number,
): ConsumptionCsvRow {
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

/** Two summer days hourly: low night, moderate daytime consumption. */
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

describe("industrial timeseries v0.6", () => {
  it("keeps PV at zero overnight", () => {
    expect(pvDayShapeFactor(0)).toBe(0);
    expect(pvDayShapeFactor(3)).toBe(0);
    expect(pvDayShapeFactor(23)).toBe(0);

    const result = simulateIndustrialTimeseries({
      ...baseConfig,
      rows: twoDayProfile(),
    });
    for (const step of result.steps) {
      if (step.hour < 6 || step.hour >= 21) {
        expect(step.pvProductionKwh).toBe(0);
      }
    }
  });

  it("produces PV during daytime hours", () => {
    expect(pvDayShapeFactor(12)).toBeGreaterThan(pvDayShapeFactor(8));
    expect(pvSeasonFactor(6)).toBeGreaterThan(pvSeasonFactor(12));

    const result = simulateIndustrialTimeseries({
      ...baseConfig,
      rows: twoDayProfile(),
    });
    const midday = result.steps.filter((s) => s.hour >= 11 && s.hour <= 14);
    expect(midday.every((s) => s.pvProductionKwh > 0)).toBe(true);
    expect(result.pvProductionKwh).toBeCloseTo(result.periodPvTargetKwh, 6);
    expect(result.periodPvTargetKwh).toBeCloseTo(400 * 1000 * (48 / 8760), 6);
  });

  it("keeps battery SOC within [0, usable capacity]", () => {
    const result = simulateIndustrialTimeseries({
      ...baseConfig,
      rows: twoDayProfile(),
    });
    const usable = 200 * 0.8;
    expect(result.usableBatteryCapacityKwh).toBeCloseTo(usable, 6);
    for (const step of result.steps) {
      expect(step.batterySocKwh).toBeGreaterThanOrEqual(-1e-9);
      expect(step.batterySocKwh).toBeLessThanOrEqual(usable + 1e-9);
    }
    expect(result.minSocKwh).toBeGreaterThanOrEqual(-1e-9);
    expect(result.maxSocKwh).toBeLessThanOrEqual(usable + 1e-9);
  });

  it("respects battery power limits for charge and discharge", () => {
    const result = simulateIndustrialTimeseries({
      ...baseConfig,
      batteryPowerKw: 20,
      rows: twoDayProfile(),
    });
    for (const step of result.steps) {
      expect(step.batteryChargeKwh).toBeLessThanOrEqual(20 * step.durationHours + 1e-9);
      expect(step.batteryDischargeKwh).toBeLessThanOrEqual(20 * step.durationHours + 1e-9);
    }
  });

  it("increases on-site PV use with a self-consumption battery", () => {
    const rows = twoDayProfile();
    const withoutBattery = simulateIndustrialTimeseries({
      ...baseConfig,
      batteryCapacityKwh: 0,
      batteryPowerKw: 0,
      rows,
    });
    const withBattery = simulateIndustrialTimeseries({
      ...baseConfig,
      batteryPurpose: "self_consumption",
      rows,
    });
    expect(withBattery.gridExportKwh).toBeLessThan(withoutBattery.gridExportKwh);
    expect(withBattery.selfConsumptionSharePercent).toBeGreaterThan(
      withoutBattery.selfConsumptionSharePercent,
    );
    expect(withBattery.batteryDischargedToLoadKwh).toBeGreaterThan(0);
  });

  it("reduces peak grid import in peak-shaving mode", () => {
    const rows: ConsumptionCsvRow[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      // Sharp evening peak when PV is low
      const load = hour === 18 || hour === 19 ? 200 : 50;
      rows.push(row(`2026-06-01 ${String(hour).padStart(2, "0")}:00`, load));
    }
    const withoutBattery = simulateIndustrialTimeseries({
      ...baseConfig,
      batteryCapacityKwh: 0,
      batteryPowerKw: 0,
      rows,
    });
    const peak = simulateIndustrialTimeseries({
      ...baseConfig,
      batteryPurpose: "peak_shaving",
      batteryCapacityKwh: 400,
      batteryPowerKw: 120,
      peakLoadKw: 200,
      rows,
    });
    expect(peak.peakLoadBeforeKw).toBeCloseTo(200, 6);
    expect(peak.peakLoadAfterKw).toBeLessThan(withoutBattery.peakLoadAfterKw);
    expect(peak.peakLoadAfterKw).toBeLessThan(peak.peakLoadBeforeKw);
    expect(peak.steps.some((s) => s.batteryDischargeKwh > 0 && (s.hour === 18 || s.hour === 19))).toBe(
      true,
    );
  });

  it("keeps a logical AC energy balance each step", () => {
    const result = simulateIndustrialTimeseries({
      ...baseConfig,
      rows: twoDayProfile(),
    });
    for (const step of result.steps) {
      expect(Math.abs(timeseriesStepBalanceResidual(step))).toBeLessThan(1e-6);
    }
  });
});
