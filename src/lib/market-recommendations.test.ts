import { describe, expect, it } from "vitest";
import { pickBestWindows } from "./market-recommendations";
import type { MarketPricePoint } from "./elering";

function point(ts: number, price: number): MarketPricePoint {
  return { ts, price_eur_per_kwh: price };
}

function buildQuarterHourPoints(count: number, startTs = 0): MarketPricePoint[] {
  return Array.from({ length: count }, (_, i) => point(startTs + i * 15 * 60, 0.1 + i * 0.001));
}

describe("pickBestWindows with 15-minute data", () => {
  it("1h window uses exactly 4 intervals", () => {
    const points = buildQuarterHourPoints(20);
    const res = pickBestWindows({ points, intervalMinutes: 15, windowHours: 1, topN: 1 });
    const pick = res.cheapest[0];
    expect(pick).toBeDefined();
    expect((pick.endTs - pick.startTs) / (15 * 60)).toBe(4);
  });

  it("2h window uses exactly 8 intervals", () => {
    const points = buildQuarterHourPoints(24);
    const res = pickBestWindows({ points, intervalMinutes: 15, windowHours: 2, topN: 1 });
    const pick = res.cheapest[0];
    expect(pick).toBeDefined();
    expect((pick.endTs - pick.startTs) / (15 * 60)).toBe(8);
  });

  it("3h window uses exactly 12 intervals", () => {
    const points = buildQuarterHourPoints(28);
    const res = pickBestWindows({ points, intervalMinutes: 15, windowHours: 3, topN: 1 });
    const pick = res.cheapest[0];
    expect(pick).toBeDefined();
    expect((pick.endTs - pick.startTs) / (15 * 60)).toBe(12);
  });

  it("4h window uses exactly 16 intervals", () => {
    const points = buildQuarterHourPoints(32);
    const res = pickBestWindows({ points, intervalMinutes: 15, windowHours: 4, topN: 1 });
    const pick = res.cheapest[0];
    expect(pick).toBeDefined();
    expect((pick.endTs - pick.startTs) / (15 * 60)).toBe(16);
  });

  it("priciest windows also use exact 1h/2h/3h/4h durations", () => {
    const points = buildQuarterHourPoints(40);
    const assertIntervals = (hours: 1 | 2 | 3 | 4, expectedIntervals: number) => {
      const res = pickBestWindows({ points, intervalMinutes: 15, windowHours: hours, topN: 1 });
      const pick = res.priciest[0];
      expect(pick).toBeDefined();
      expect((pick.endTs - pick.startTs) / (15 * 60)).toBe(expectedIntervals);
    };

    assertIntervals(1, 4);
    assertIntervals(2, 8);
    assertIntervals(3, 12);
    assertIntervals(4, 16);
  });

  it("skips non-contiguous slices to avoid stretched windows", () => {
    const points = [
      point(0, 0.10),
      point(15 * 60, 0.11),
      point(30 * 60, 0.12),
      // 45-min slot missing
      point(6 * 60 * 60, 0.05),
      point(6 * 60 * 60 + 15 * 60, 0.06),
      point(6 * 60 * 60 + 30 * 60, 0.07),
      point(6 * 60 * 60 + 45 * 60, 0.08),
    ];
    const res = pickBestWindows({ points, intervalMinutes: 15, windowHours: 1, topN: 1 });
    const pick = res.cheapest[0];
    expect(pick).toBeDefined();
    expect(pick.startTs).toBe(6 * 60 * 60);
    expect(pick.endTs - pick.startTs).toBe(60 * 60);
  });
});

