"use client";

import { useMemo, useState } from "react";
import { ChartCard } from "@/components/charts/ChartCard";
import type { ConsumptionChartSeries } from "@/lib/consumption/consumption-profile-insight";

function fmt1(value: number): string {
  return new Intl.NumberFormat("et-EE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);
}

/**
 * Calm SVG line chart for consumption over time. No extra chart library.
 * Stroke stays zinc/sky — intentionally not another green accent.
 */
export function ConsumptionProfileChart({ series }: { series: ConsumptionChartSeries }) {
  const { points, aggregated, sourceRowCount, displayedPointCount } = series;
  const [hover, setHover] = useState<number | null>(null);

  const geometry = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map((p) => p.loadKw);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, 1e-6);
    const w = 1000;
    const h = 220;
    const leftPad = 48;
    const rightPad = 12;
    const topPad = 12;
    const bottomPad = 30;
    const chartW = w - leftPad - rightPad;
    const chartH = h - topPad - bottomPad;

    const coords = values.map((v, i) => {
      const x = leftPad + (i * chartW) / Math.max(values.length - 1, 1);
      const y = topPad + (1 - (v - min) / span) * chartH;
      return { x, y };
    });

    const line = coords
      .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(" ");

    return { w, h, leftPad, rightPad, topPad, bottomPad, chartW, chartH, min, max, span, coords, line };
  }, [points]);

  if (points.length === 0 || !geometry) {
    return <p className="text-sm text-zinc-400">Graafiku jaoks pole veel andmeid.</p>;
  }

  const { w, h, leftPad, rightPad, topPad, bottomPad, chartW, chartH, min, max, span, coords, line } =
    geometry;
  const hoverPoint = hover != null ? points[hover] : null;
  const hoverCoord = hover != null ? coords[hover] : null;

  return (
    <ChartCard
      title="Tarbimine ajas"
      description={
        aggregated
          ? `CSV-s ${sourceRowCount} rida — kuvatud ${displayedPointCount} agregeeritud punkti (keskmine koormus).`
          : `Kuvatud ${displayedPointCount} mõõtepunkti koormusena (kW).`
      }
      className="!rounded-none border-zinc-800 bg-zinc-950"
      chartClassName="min-h-[180px] md:min-h-[220px]"
    >
      <div className="mb-2 text-xs text-zinc-500">
        min {fmt1(min)} · max {fmt1(max)} kW
      </div>
      <div className="relative">
        {hoverPoint && hoverCoord ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200"
            style={{
              left: `${Math.min(88, Math.max(12, (hoverCoord.x / w) * 100))}%`,
              top: 0,
            }}
          >
            <div className="text-zinc-400">{hoverPoint.label}</div>
            <div className="font-mono tabular-nums text-zinc-100">{fmt1(hoverPoint.loadKw)} kW</div>
            <div className="font-mono tabular-nums text-zinc-400">{fmt1(hoverPoint.consumptionKwh)} kWh</div>
          </div>
        ) : null}
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="h-[180px] w-full md:h-[220px]"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const px = ((event.clientX - rect.left) / rect.width) * w;
            const i = Math.round(((px - leftPad) / chartW) * (points.length - 1));
            setHover(Math.min(Math.max(i, 0), points.length - 1));
          }}
        >
          {[0, 0.5, 1].map((g) => {
            const gy = topPad + g * chartH;
            return (
              <line
                key={g}
                x1={leftPad}
                x2={w - rightPad}
                y1={gy}
                y2={gy}
                stroke="rgba(255,255,255,0.07)"
              />
            );
          })}
          <line
            x1={leftPad}
            x2={leftPad}
            y1={topPad}
            y2={h - bottomPad}
            stroke="rgba(255,255,255,0.14)"
          />
          <line
            x1={leftPad}
            x2={w - rightPad}
            y1={h - bottomPad}
            y2={h - bottomPad}
            stroke="rgba(255,255,255,0.14)"
          />
          <path d={line} fill="none" stroke="rgba(186, 230, 253, 0.85)" strokeWidth="1.8" />
          {[max, min + span * 0.5, min].map((v, idx) => {
            const y = topPad + (idx * chartH) / 2;
            return (
              <text key={`y-${idx}`} x={6} y={y + 3} fontSize="10" fill="rgba(161,161,170,0.9)">
                {fmt1(v)}
              </text>
            );
          })}
          {[0, Math.floor((points.length - 1) / 2), points.length - 1].map((i, idx) => {
            const point = points[i];
            if (!point) return null;
            const x = leftPad + (i * chartW) / Math.max(points.length - 1, 1);
            return (
              <text
                key={`x-${idx}`}
                x={x}
                y={h - 8}
                fontSize="10"
                textAnchor={idx === 0 ? "start" : idx === 2 ? "end" : "middle"}
                fill="rgba(161,161,170,0.9)"
              >
                {point.label}
              </text>
            );
          })}
          {hoverCoord ? (
            <line
              x1={hoverCoord.x}
              x2={hoverCoord.x}
              y1={topPad}
              y2={h - bottomPad}
              stroke="rgba(255,255,255,0.28)"
              strokeDasharray="3 4"
            />
          ) : null}
        </svg>
      </div>
    </ChartCard>
  );
}
