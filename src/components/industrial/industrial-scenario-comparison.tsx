"use client";

import { fmtEt } from "@/components/industrial/format-et";
import { IndustrialScenarioImpactChart } from "@/components/industrial/industrial-scenario-impact-chart";
import type { IndustrialScenarioComparison } from "@/lib/calculators/industrial-scenarios";

export function IndustrialScenarioComparisonPanel({
  comparison,
}: {
  comparison: IndustrialScenarioComparison;
}) {
  return (
    <div className="grid gap-4">
      <div className="industrial-scenario-tiles" aria-label="Stsenaariumite kokkuvõte">
        {comparison.scenarios.map((row) => {
          const featured = row.id === comparison.bestSavingsId && row.annualSavingsEur > 0;
          return (
            <article
              key={row.id}
              className={`industrial-scenario-tile${featured ? " industrial-scenario-tile-featured" : ""}`}
            >
              <p className="industrial-scenario-tile-label">{row.label}</p>
              <p className="industrial-scenario-tile-value">
                <strong>{fmtEt(row.annualSavingsEur, 0)}</strong>
                <span>€/a</span>
              </p>
              <dl className="industrial-scenario-tile-meta">
                <div>
                  <dt>Investeering</dt>
                  <dd>{fmtEt(row.investmentEur, 0)} €</dd>
                </div>
                <div>
                  <dt>Tasuvus</dt>
                  <dd>{row.paybackYears != null ? `${fmtEt(row.paybackYears, 1)} a` : "—"}</dd>
                </div>
                <div>
                  <dt>Tipp pärast</dt>
                  <dd>{fmtEt(row.peakLoadAfterKw, 0)} kW</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      <IndustrialScenarioImpactChart comparison={comparison} />

      <div className="industrial-table-scroll">
        <table className="min-w-[640px] w-full text-left text-sm text-zinc-300">
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
                <td className="px-3 py-2 font-mono tabular-nums">{fmtEt(row.investmentEur, 0)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmtEt(row.selfConsumedPvMwh, 1)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmtEt(row.exportedPvMwh, 1)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmtEt(row.selfConsumptionSavingsEur, 0)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmtEt(row.exportRevenueEur, 0)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmtEt(row.demandChargeSavingsEur, 0)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmtEt(row.annualSavingsEur, 0)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">
                  {row.paybackYears != null ? fmtEt(row.paybackYears, 1) : "Ei arvutata"}
                </td>
                <td className="px-3 py-2 font-mono tabular-nums">{fmtEt(row.peakLoadAfterKw, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
        <p className="font-medium text-zinc-100">Automaatne lühijäreldus</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Suurim aastane kogumõju:{" "}
            <span className="text-zinc-100">{comparison.conclusion.bestSavingsLabel}</span>
          </li>
          <li>
            Lühim lihtsustatud tasuvus:{" "}
            <span className="text-zinc-100">{comparison.conclusion.bestPaybackLabel ?? "ei arvutata"}</span>
          </li>
          <li>
            Tipukoormuse vähendamine:{" "}
            <span className="text-zinc-100">{comparison.conclusion.bestPeakLabel}</span>
          </li>
        </ul>
        <p className="mt-3 leading-relaxed text-zinc-400">{comparison.conclusion.summary}</p>
      </div>
    </div>
  );
}
