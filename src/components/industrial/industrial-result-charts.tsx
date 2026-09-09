"use client";

import { fmtEt } from "@/components/industrial/format-et";
import type { IndustrialResult } from "@/lib/calculators/industrial";

function barWidth(value: number, max: number): string {
  if (!(max > 0) || !(value > 0)) return "0%";
  return `${Math.max((value / max) * 100, 1.5)}%`;
}

function EnergyFlowCard({ result }: { result: IndustrialResult }) {
  const rows = [
    { label: "PV toodang", value: Math.max(result.pvProductionMwh, 0), tone: "sky" as const },
    { label: "Kohapeal kasutatud PV", value: Math.max(result.selfConsumedPvMwh, 0), tone: "zinc" as const },
    { label: "Võrku müüdav PV", value: Math.max(result.exportedPvMwh, 0), tone: "slate" as const },
    { label: "Aku kaudu kasutatud energia", value: Math.max(result.batterySelfConsumptionImpactMwh, 0), tone: "muted" as const },
  ];
  const max = Math.max(...rows.map((row) => row.value), 0);

  return (
    <article className="industrial-chart-card">
      <header className="industrial-chart-card-head">
        <h3>Energiavoogude jaotus</h3>
        <p>Aastane jaotus megavatt-tundides. Ribade pikkus on suhteline suurima väärtuse suhtes.</p>
      </header>
      <ul className="industrial-hbar-list">
        {rows.map((row) => (
          <li key={row.label} className="industrial-hbar-row">
            <div className="industrial-hbar-meta">
              <span>{row.label}</span>
              <strong>
                {fmtEt(row.value, 1)} <span>MWh</span>
              </strong>
            </div>
            <div className="industrial-hbar-track" aria-hidden="true">
              <span
                className={`industrial-hbar-fill industrial-hbar-fill-${row.tone}`}
                style={{ width: barWidth(row.value, max) }}
              />
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

function PeakImpactCard({ result }: { result: IndustrialResult }) {
  const before = Math.max(result.peakLoadBeforeKw, 0);
  const after = Math.max(result.peakLoadAfterKw, 0);
  const max = Math.max(before, after, 1);
  const reduced = result.peakReductionKw > 0.05 && after < before - 0.05;

  return (
    <article className="industrial-chart-card">
      <header className="industrial-chart-card-head">
        <h3>Tipukoormuse mõju</h3>
        <p>Võrgust võetav tipp enne lahendust ja pärast valitud PV + aku eeldusi.</p>
      </header>
      <div className="industrial-vbar-pair" role="img" aria-label="Tipukoormus enne ja pärast">
        {[
          { label: "Enne lahendust", value: before, tone: "before" as const },
          { label: "Pärast lahendust", value: after, tone: reduced ? "after-reduced" : "after" },
        ].map((bar) => (
          <div key={bar.label} className="industrial-vbar">
            <p className="industrial-vbar-value">
              <strong>{fmtEt(bar.value, 0)}</strong>
              <span>kW</span>
            </p>
            <div className="industrial-vbar-col">
              <span
                className={`industrial-vbar-fill industrial-vbar-fill-${bar.tone}`}
                style={{ height: `${(bar.value / max) * 100}%` }}
              />
            </div>
            <p className="industrial-vbar-label">{bar.label}</p>
          </div>
        ))}
      </div>
      {reduced ? (
        <p className="industrial-chart-card-note">
          Peak shaving vähendab tippu {fmtEt(result.peakReductionKw, 0)} kW võrra.
        </p>
      ) : (
        <p className="industrial-chart-card-note">Valitud režiimis tipukoormust ei vähendata.</p>
      )}
    </article>
  );
}

function MoneyBreakdownCard({ result }: { result: IndustrialResult }) {
  const rows = [
    { label: "Omatarbe sääst", value: Math.max(result.selfConsumptionSavingsEur, 0), tone: "zinc" as const },
    { label: "Võrku müügi tulu", value: Math.max(result.exportRevenueEur, 0), tone: "sky" as const },
    { label: "Võimsustasu sääst", value: Math.max(result.demandChargeSavingsEur, 0), tone: "slate" as const },
  ];
  const max = Math.max(...rows.map((row) => row.value), 0);
  const partsSum = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <article className="industrial-chart-card industrial-chart-card-wide">
      <header className="industrial-chart-card-head">
        <h3>Rahalise mõju jaotus</h3>
        <p>Kust aastane kogumõju tuleb: omatarve, võrku müük ja võimsustasu.</p>
      </header>
      <div className="industrial-money-grid">
        {rows.map((row) => (
          <div key={row.label} className="industrial-money-item">
            <p className="industrial-chart-kicker">{row.label}</p>
            <p className="industrial-money-value">
              <strong>{fmtEt(row.value, 0)}</strong>
              <span>€/a</span>
            </p>
            <div className="industrial-hbar-track" aria-hidden="true">
              <span
                className={`industrial-hbar-fill industrial-hbar-fill-${row.tone}`}
                style={{ width: barWidth(row.value, max) }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="industrial-money-total">
        Aastane kogumõju <strong>{fmtEt(result.annualSavingsEur, 0)} €/a</strong>
        {Math.abs(partsSum - Math.max(result.annualSavingsEur, 0)) > 0.5 ? (
          <span> · osade summa {fmtEt(partsSum, 0)} €</span>
        ) : null}
      </p>
    </article>
  );
}

export function IndustrialChartsEmptyState() {
  return (
    <section className="industrial-charts-empty" aria-label="Graafikud">
      <p>Graafikud ilmuvad pärast arvutust.</p>
    </section>
  );
}

export function IndustrialResultCharts({ result }: { result: IndustrialResult }) {
  return (
    <section className="industrial-charts-board" aria-label="Tulemuste graafikud">
      <EnergyFlowCard result={result} />
      <PeakImpactCard result={result} />
      <MoneyBreakdownCard result={result} />
    </section>
  );
}
