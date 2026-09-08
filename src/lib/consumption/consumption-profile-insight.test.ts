import { describe, expect, it } from "vitest";
import { parseConsumptionCsv } from "./parse-consumption-csv";
import { summarizeConsumptionProfile } from "./consumption-profile";
import {
  buildConsumptionChartSeries,
  inferConsumptionProfileInsight,
} from "./consumption-profile-insight";

function makeHourlyCsv(hours: Array<{ hour: number; kwh: number }>): string {
  const lines = ["timestamp,consumption_kwh"];
  for (const row of hours) {
    const h = String(row.hour).padStart(2, "0");
    lines.push(`2026-01-01 ${h}:00,${row.kwh}`);
  }
  return lines.join("\n");
}

describe("consumption profile insight v0.3", () => {
  it("classifies a daytime profile and recommends self-consumption", () => {
    const csv = makeHourlyCsv(
      Array.from({ length: 24 }, (_, hour) => {
        if (hour >= 8 && hour < 16) return { hour, kwh: 180 };
        if (hour >= 16 && hour < 20) return { hour, kwh: 120 };
        return { hour, kwh: 45 };
      }),
    );
    const parsed = parseConsumptionCsv(csv);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const summary = summarizeConsumptionProfile(parsed.rows);
    const insight = inferConsumptionProfileInsight(summary);
    expect(summary.daytimeSharePercent).toBeGreaterThanOrEqual(62);
    expect(insight.shape).toBe("daytime");
    expect(insight.recommendedBatteryPurpose).toBe("self_consumption");
    expect(insight.pvFitLabel.toLowerCase()).toContain("hea");
  });

  it("classifies a flat profile", () => {
    const csv = makeHourlyCsv(Array.from({ length: 24 }, (_, hour) => ({ hour, kwh: 100 })));
    const parsed = parseConsumptionCsv(csv);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const summary = summarizeConsumptionProfile(parsed.rows);
    const insight = inferConsumptionProfileInsight(summary);
    expect(insight.shape).toBe("flat");
    expect(insight.shapeLabel.toLowerCase()).toContain("ühtlane");
    expect(insight.recommendedBatteryPurpose).toBe("self_consumption");
  });

  it("classifies a peaky profile and recommends peak shaving", () => {
    const csv = makeHourlyCsv(
      Array.from({ length: 24 }, (_, hour) => ({
        hour,
        kwh: hour === 10 ? 400 : 80,
      })),
    );
    const parsed = parseConsumptionCsv(csv);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const summary = summarizeConsumptionProfile(parsed.rows);
    const insight = inferConsumptionProfileInsight(summary);
    expect(summary.peakLoadKw / Math.max(summary.averageLoadKw, 1e-6)).toBeGreaterThanOrEqual(1.85);
    expect(insight.shape).toBe("peaky");
    expect(insight.recommendedBatteryPurpose).toBe("peak_shaving");
    expect(insight.batteryRoleLabel.toLowerCase()).toContain("tipukoormuse");
  });

  it("aggregates large series for the chart", () => {
    const lines = ["timestamp,consumption_kwh"];
    for (let i = 0; i < 240; i += 1) {
      const day = Math.floor(i / 24) + 1;
      const hour = i % 24;
      lines.push(
        `2026-01-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:00,${100 + (i % 7)}`,
      );
    }
    const parsed = parseConsumptionCsv(lines.join("\n"));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const summary = summarizeConsumptionProfile(parsed.rows);
    const series = buildConsumptionChartSeries(parsed.rows, summary, 96);
    expect(series.sourceRowCount).toBe(240);
    expect(series.aggregated).toBe(true);
    expect(series.displayedPointCount).toBeLessThanOrEqual(96);
    expect(series.points.length).toBeGreaterThan(0);
  });
});
