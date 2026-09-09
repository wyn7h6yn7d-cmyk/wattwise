"use client";

import { fmtEt } from "@/components/industrial/format-et";
import type { IndustrialScenarioComparison } from "@/lib/calculators/industrial-scenarios";

function barWidth(value: number, max: number): string {
  if (!(max > 0) || !(value > 0)) return "0%";
  return `${Math.max((value / max) * 100, 1.2)}%`;
}

export function IndustrialScenarioImpactChart({
  comparison,
}: {
  comparison: IndustrialScenarioComparison;
}) {
  const max = Math.max(...comparison.scenarios.map((row) => Math.max(row.annualSavingsEur, 0)), 0);

  return (
    <article className="industrial-chart-card">
      <header className="industrial-chart-card-head">
        <h3>Stsenaariumite visuaalne võrdlus</h3>
        <p>Aastane kogumõju nelja loogika peal: baas, ainult PV, PV + aku omatarve ja PV + aku peak shaving.</p>
      </header>
      <ul className="industrial-hbar-list industrial-scenario-bars">
        {comparison.scenarios.map((row) => {
          const featured = row.id === comparison.bestSavingsId && row.annualSavingsEur > 0;
          return (
            <li
              key={row.id}
              className={`industrial-hbar-row${featured ? " industrial-scenario-bar-featured" : ""}`}
            >
              <div className="industrial-hbar-meta">
                <span>{row.label}</span>
                <strong>
                  {fmtEt(row.annualSavingsEur, 0)} <span>€/a</span>
                </strong>
              </div>
              <div className="industrial-hbar-track" aria-hidden="true">
                <span
                  className={`industrial-hbar-fill${featured ? " industrial-hbar-fill-sky" : " industrial-hbar-fill-zinc"}`}
                  style={{ width: barWidth(Math.max(row.annualSavingsEur, 0), max) }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
