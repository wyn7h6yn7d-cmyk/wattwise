"use client";

import { ChartCard } from "@/components/charts/ChartCard";
import type { IndustrialScenarioComparison } from "@/lib/calculators/industrial-scenarios";

function fmt(value: number, digits: number): string {
  return new Intl.NumberFormat("et-EE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

function ScenarioSavingsChart({ comparison }: { comparison: IndustrialScenarioComparison }) {
  const values = comparison.scenarios.map((s) => s.annualSavingsEur);
  const max = Math.max(...values, 1);
  const w = 640;
  const h = 220;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 52;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const gap = 16;
  const barW = (chartW - gap * (values.length - 1)) / values.length;

  return (
    <ChartCard
      title="Aastane kogumõju stsenaariumite lõikes"
      description="Omatarve + võrku müük + vajadusel võimsustasu sääst."
      className="!rounded-none border-zinc-800 bg-zinc-950"
      chartClassName="min-h-[180px] md:min-h-[220px]"
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[180px] w-full md:h-[220px]" role="img" aria-label="Kogumõju võrdlus">
        {[0, 0.5, 1].map((g) => {
          const y = padT + (1 - g) * chartH;
          return (
            <line
              key={g}
              x1={padL}
              x2={w - padR}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
            />
          );
        })}
        {comparison.scenarios.map((scenario, index) => {
          const value = scenario.annualSavingsEur;
          const barH = (value / max) * chartH;
          const x = padL + index * (barW + gap);
          const y = padT + chartH - barH;
          const highlight = scenario.id === comparison.bestSavingsId;
          return (
            <g key={scenario.id}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(barH, value > 0 ? 2 : 0)}
                fill={highlight ? "rgba(186,230,253,0.85)" : "rgba(161,161,170,0.55)"}
              />
              <text
                x={x + barW / 2}
                y={h - 28}
                textAnchor="middle"
                fontSize="11"
                fill="rgba(212,212,216,0.95)"
              >
                {scenario.shortLabel}
              </text>
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="11"
                fill="rgba(244,244,245,0.95)"
              >
                {fmt(value, 0)}
              </text>
            </g>
          );
        })}
        <text x={8} y={padT + 4} fontSize="10" fill="rgba(161,161,170,0.9)">
          {fmt(max, 0)}
        </text>
        <text x={8} y={padT + chartH} fontSize="10" fill="rgba(161,161,170,0.9)">
          0
        </text>
      </svg>
    </ChartCard>
  );
}

export function IndustrialScenarioComparisonPanel({
  comparison,
}: {
  comparison: IndustrialScenarioComparison;
}) {
  return (
    <article className="card">
      <h2 className="section-title">Stsenaariumite võrdlus</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Võrdleb baasstsenaariumi, ainult PV-d ning PV+aku omatarbe ja peak shaving režiime eraldi investeeringute ja
        majanduslike eeldustega.
      </p>

      <div className="mt-4 overflow-x-auto border border-zinc-800">
        <table className="min-w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-950 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Stsenaarium</th>
              <th className="px-3 py-2 font-medium">Investeering €</th>
              <th className="px-3 py-2 font-medium">PV omatarve MWh</th>
              <th className="px-3 py-2 font-medium">Võrku müüdav PV MWh</th>
              <th className="px-3 py-2 font-medium">Elektrikulu sääst €</th>
              <th className="px-3 py-2 font-medium">Võrku müügi tulu €</th>
              <th className="px-3 py-2 font-medium">Võimsustasu sääst €</th>
              <th className="px-3 py-2 font-medium">Aastane kogumõju €</th>
              <th className="px-3 py-2 font-medium">Tasuvus a</th>
              <th className="px-3 py-2 font-medium">Tipukoormus pärast kW</th>
            </tr>
          </thead>
          <tbody>
            {comparison.scenarios.map((row) => (
              <tr key={row.id} className="border-t border-zinc-800">
                <td className="px-3 py-2 font-medium text-zinc-100">{row.label}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.investmentEur, 0)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.selfConsumedPvMwh, 1)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.exportedPvMwh, 1)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.selfConsumptionSavingsEur, 0)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.exportRevenueEur, 0)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.demandChargeSavingsEur, 0)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.annualSavingsEur, 0)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">
                  {row.paybackYears != null ? fmt(row.paybackYears, 1) : "Ei arvutata"}
                </td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.peakLoadAfterKw, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <ScenarioSavingsChart comparison={comparison} />
      </div>

      <div className="mt-4 border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
        <p className="font-medium text-zinc-100">Automaatne lühijäreldus</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Suurim aastane kogumõju:{" "}
            <span className="text-zinc-100">{comparison.conclusion.bestSavingsLabel}</span>
          </li>
          <li>
            Lühim lihtsustatud tasuvus:{" "}
            <span className="text-zinc-100">
              {comparison.conclusion.bestPaybackLabel ?? "ei arvutata"}
            </span>
          </li>
          <li>
            Tipukoormuse vähendamine:{" "}
            <span className="text-zinc-100">{comparison.conclusion.bestPeakLabel}</span>
          </li>
        </ul>
        <p className="mt-3 leading-relaxed text-zinc-400">{comparison.conclusion.summary}</p>
      </div>
    </article>
  );
}
