"use client";

import { ChartCard } from "@/components/charts/ChartCard";
import type { IndustrialScenarioComparison } from "@/lib/calculators/industrial-scenarios";
import type { IndustrialTimeseriesResult } from "@/lib/calculators/industrial-timeseries";

const STROKE = {
  zinc: "rgba(212,212,216,0.92)",
  sky: "rgba(147,197,253,0.92)",
  amber: "rgba(252,211,77,0.88)",
  slate: "rgba(148,163,184,0.72)",
  highlight: "rgba(186,230,253,0.92)",
  muted: "rgba(161,161,170,0.9)",
  grid: "rgba(255,255,255,0.08)",
} as const;

function fmt(value: number, digits: number): string {
  return new Intl.NumberFormat("et-EE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

function GridY({
  left,
  right,
  top,
  height,
}: {
  left: number;
  right: number;
  top: number;
  height: number;
}) {
  return (
    <>
      {[0, 0.5, 1].map((g) => {
        const y = top + (1 - g) * height;
        return <line key={g} x1={left} x2={right} y1={y} y2={y} stroke={STROKE.grid} />;
      })}
    </>
  );
}

export function ScenarioComparisonChart({ comparison }: { comparison: IndustrialScenarioComparison }) {
  const savings = comparison.scenarios.map((s) => s.annualSavingsEur);
  const investments = comparison.scenarios.map((s) => s.investmentEur);
  const max = Math.max(...savings, ...investments, 1);
  const w = 720;
  const h = 292;
  const padL = 52;
  const padR = 16;
  const padT = 18;
  const padB = 72;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const groupW = chartW / comparison.scenarios.length;
  const barW = Math.max((groupW - 18) / 2, 10);

  return (
    <ChartCard
      title="Stsenaariumite võrdlus"
      description="Aastane kogumõju, investeering, tasuvus ja tipp pärast lahendust."
      className="!rounded-none border-zinc-800 bg-zinc-950"
      chartClassName="min-h-[240px] md:min-h-[280px]"
    >
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 bg-sky-200/80" />
          Aastane kogumõju
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 bg-zinc-500/70" />
          Investeering
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[240px] w-full md:h-[280px]" role="img" aria-label="Stsenaariumite tulpdiagramm">
        <GridY left={padL} right={w - padR} top={padT} height={chartH} />
        {comparison.scenarios.map((scenario, index) => {
          const gx = padL + index * groupW + 8;
          const savingsH = (scenario.annualSavingsEur / max) * chartH;
          const investH = (scenario.investmentEur / max) * chartH;
          const highlight = scenario.id === comparison.bestSavingsId;
          const payback =
            scenario.paybackYears != null ? `${fmt(scenario.paybackYears, 1)} a` : "—";
          return (
            <g key={scenario.id}>
              <rect
                x={gx}
                y={padT + chartH - savingsH}
                width={barW}
                height={Math.max(savingsH, scenario.annualSavingsEur > 0 ? 2 : 0)}
                fill={highlight ? STROKE.highlight : STROKE.sky}
                opacity={highlight ? 1 : 0.75}
              />
              <rect
                x={gx + barW + 4}
                y={padT + chartH - investH}
                width={barW}
                height={Math.max(investH, scenario.investmentEur > 0 ? 2 : 0)}
                fill={STROKE.slate}
              />
              <text x={gx + barW} y={h - 36} textAnchor="middle" fontSize="11" fill="rgba(212,212,216,0.95)">
                {scenario.shortLabel}
              </text>
              <text x={gx + barW} y={h - 20} textAnchor="middle" fontSize="10" fill={STROKE.muted}>
                tasuvus {payback} · tipp {fmt(scenario.peakLoadAfterKw, 0)} kW
              </text>
            </g>
          );
        })}
        <text x={8} y={padT + 4} fontSize="10" fill={STROKE.muted}>
          {fmt(max, 0)} €
        </text>
      </svg>
    </ChartCard>
  );
}

export function TimeseriesLoadPvBatteryChart({ result }: { result: IndustrialTimeseriesResult }) {
  const steps = result.chartSteps;
  if (steps.length === 0) {
    return <p className="text-sm text-zinc-400">Graafiku jaoks pole andmeid.</p>;
  }

  const load = steps.map((s) => (s.durationHours > 0 ? s.consumptionKwh / s.durationHours : s.consumptionKwh));
  const pv = steps.map((s) => (s.durationHours > 0 ? s.pvProductionKwh / s.durationHours : s.pvProductionKwh));
  const batteryKw = steps.map((s) =>
    s.durationHours > 0 ? (s.batteryDischargeKwh - s.batteryChargeKwh) / s.durationHours : 0,
  );
  const max = Math.max(...load, ...pv, ...batteryKw.map((v) => Math.abs(v)), 1e-6);
  const w = 1000;
  const h = 240;
  const leftPad = 48;
  const rightPad = 12;
  const topPad = 12;
  const bottomPad = 30;
  const chartW = w - leftPad - rightPad;
  const chartH = h - topPad - bottomPad;

  const toCoords = (values: number[]) =>
    values.map((v, i) => {
      const x = leftPad + (i * chartW) / Math.max(values.length - 1, 1);
      const y = topPad + (1 - v / max) * chartH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

  return (
    <ChartCard
      title="Koormus, PV ja aku"
      description={
        result.chartSteps.length < result.rowCount
          ? `Kuvatud ${result.chartSteps.length} punkti ${result.rowCount} reast.`
          : `Kuvatud ${result.rowCount} mõõtepunkti.`
      }
      className="!rounded-none border-zinc-800 bg-zinc-950"
      chartClassName="min-h-[200px] md:min-h-[240px]"
    >
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-zinc-300" />
          Koormus
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-sky-300/90" />
          PV
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-amber-300/90" />
          Aku (tühjendus − laadimine)
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[200px] w-full md:h-[240px]" role="img" aria-label="Koormus PV ja aku">
        <GridY left={leftPad} right={w - rightPad} top={topPad} height={chartH} />
        <path d={toCoords(load)} fill="none" stroke={STROKE.zinc} strokeWidth="2" />
        <path d={toCoords(pv)} fill="none" stroke={STROKE.sky} strokeWidth="2" />
        <path d={toCoords(batteryKw)} fill="none" stroke={STROKE.amber} strokeWidth="2" />
        <text x={8} y={topPad + 4} fontSize="10" fill={STROKE.muted}>
          {fmt(max, 0)} kW
        </text>
        <text x={leftPad} y={h - 8} fontSize="10" fill={STROKE.muted}>
          {steps[0]?.label ?? ""}
        </text>
        <text x={w - rightPad} y={h - 8} textAnchor="end" fontSize="10" fill={STROKE.muted}>
          {steps[steps.length - 1]?.label ?? ""}
        </text>
      </svg>
    </ChartCard>
  );
}

export function BatterySocChart({ result }: { result: IndustrialTimeseriesResult }) {
  const steps = result.chartSteps;
  if (steps.length === 0 || result.usableBatteryCapacityKwh <= 0) {
    return (
      <p className="text-sm text-zinc-400">Aku laetuse graafikut ei kuvata, sest aku mahtu ei ole sisestatud.</p>
    );
  }

  const values = steps.map((s) => s.batterySocKwh);
  const max = Math.max(result.usableBatteryCapacityKwh, ...values, 1e-6);
  const w = 1000;
  const h = 220;
  const leftPad = 48;
  const rightPad = 12;
  const topPad = 12;
  const bottomPad = 30;
  const chartW = w - leftPad - rightPad;
  const chartH = h - topPad - bottomPad;
  const line = values
    .map((v, i) => {
      const x = leftPad + (i * chartW) / Math.max(values.length - 1, 1);
      const y = topPad + (1 - v / max) * chartH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${line} L${leftPad + chartW},${topPad + chartH} L${leftPad},${topPad + chartH} Z`;

  return (
    <ChartCard
      title="Aku laetus (SOC)"
      description={`Kasutatav maht ${fmt(result.usableBatteryCapacityKwh, 0)} kWh · min ${fmt(result.minSocKwh, 0)} · max ${fmt(result.maxSocKwh, 0)} kWh.`}
      className="!rounded-none border-zinc-800 bg-zinc-950"
      chartClassName="min-h-[180px] md:min-h-[220px]"
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[180px] w-full md:h-[220px]" role="img" aria-label="Aku SOC">
        <GridY left={leftPad} right={w - rightPad} top={topPad} height={chartH} />
        <path d={area} fill="rgba(252,211,77,0.12)" />
        <path d={line} fill="none" stroke={STROKE.amber} strokeWidth="2" />
        <text x={8} y={topPad + 4} fontSize="10" fill={STROKE.muted}>
          {fmt(max, 0)}
        </text>
        <text x={8} y={topPad + chartH} fontSize="10" fill={STROKE.muted}>
          0
        </text>
      </svg>
    </ChartCard>
  );
