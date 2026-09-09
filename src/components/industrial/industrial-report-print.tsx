"use client";

import type { ReactNode } from "react";
import { fmtEt } from "@/components/industrial/format-et";
import type { IndustrialInterpretation } from "@/components/industrial/industrial-recommendation-card";
import type { IndustrialResult } from "@/lib/calculators/industrial";
import type { IndustrialScenarioComparison } from "@/lib/calculators/industrial-scenarios";
import type { IndustrialTimeseriesResult } from "@/lib/calculators/industrial-timeseries";
import { SITE_BRAND, SITE_CONTACT_EMAIL, SITE_CONTACT_NAME } from "@/lib/site";

export type IndustrialReportRow = {
  label: string;
  value: string;
};

export type IndustrialReportPrintProps = {
  companyName: string;
  generatedAt: Date;
  result: IndustrialResult;
  interpretation: IndustrialInterpretation;
  inputRows: IndustrialReportRow[];
  assumptionRows: IndustrialReportRow[];
  scenarioComparison: IndustrialScenarioComparison | null;
  timeseries: IndustrialTimeseriesResult | null;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="industrial-print-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function KvTable({ rows }: { rows: IndustrialReportRow[] }) {
  return (
    <table>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th>{row.label}</th>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function IndustrialReportPrint({
  companyName,
  generatedAt,
  result,
  interpretation,
  inputRows,
  assumptionRows,
  scenarioComparison,
  timeseries,
}: IndustrialReportPrintProps) {
  const dateLabel = generatedAt.toLocaleDateString("et-EE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const recommended =
    scenarioComparison?.conclusion.bestSavingsLabel ??
    (result.annualSavingsEur > 0 ? "Valitud PV ja aku eeldused" : "Täpsusta sisendeid");

  return (
    <article className="industrial-print-report" aria-label="PDF raport">
      <header className="industrial-print-header">
        <div className="industrial-print-brand">
          <img src="/logo.png" alt="" width={40} height={40} className="industrial-print-logo" />
          <div>
            <p className="industrial-print-site">{SITE_BRAND}</p>
            <h1>Tööstusettevõtte PV ja akusalvestuse analüüsi raport</h1>
          </div>
        </div>
        <dl className="industrial-print-meta">
          <div>
            <dt>Kuupäev</dt>
            <dd>{dateLabel}</dd>
          </div>
          <div>
            <dt>Ettevõte / profiil</dt>
            <dd>{companyName}</dd>
          </div>
        </dl>
        <p className="industrial-print-contact">
          {SITE_CONTACT_NAME}
          <br />
          {SITE_CONTACT_EMAIL}
          <br />
          {SITE_BRAND}
        </p>
      </header>

      <Section title="1. Kokkuvõte">
        <p className="industrial-print-lead">{interpretation.headline}</p>
        <div className="industrial-print-kpis">
          <div>
            <span>Aastane kogumõju</span>
            <strong>{fmtEt(result.annualSavingsEur, 0)} €/a</strong>
          </div>
          <div>
            <span>Omatarbe osakaal</span>
            <strong>{fmtEt(result.selfConsumptionSharePercent, 0)}%</strong>
          </div>
          <div>
            <span>Tipukoormus enne ja pärast</span>
            <strong>
              {fmtEt(result.peakLoadBeforeKw, 0)} → {fmtEt(result.peakLoadAfterKw, 0)} kW
            </strong>
          </div>
          <div>
            <span>Lihtsustatud tasuvusaeg</span>
            <strong>{result.paybackYears != null ? `${fmtEt(result.paybackYears, 1)} a` : "—"}</strong>
          </div>
        </div>
        <p>
          <strong>Soovituslik stsenaarium:</strong> {recommended}
        </p>
      </Section>

      <Section title="2. Sisendandmed">
        <KvTable rows={inputRows} />
      </Section>

      <Section title="3. Majanduslikud eeldused">
        <KvTable rows={assumptionRows} />
      </Section>

      <Section title="4. Põhitulemused">
        <KvTable
          rows={[
            { label: "PV aastatoodang", value: `${fmtEt(result.pvProductionMwh, 1)} MWh` },
            { label: "Kohapeal kasutatud PV", value: `${fmtEt(result.selfConsumedPvMwh, 1)} MWh` },
            { label: "Võrku müüdav PV", value: `${fmtEt(result.exportedPvMwh, 1)} MWh` },
            {
              label: "Aku lisanduv mõju",
              value: `${fmtEt(result.batterySelfConsumptionImpactMwh, 1)} MWh`,
            },
            { label: "Aastane kogumõju", value: `${fmtEt(result.annualSavingsEur, 0)} €/a` },
            {
              label: "Tasuvusaeg",
              value: result.paybackYears != null ? `${fmtEt(result.paybackYears, 1)} a` : "—",
            },
          ]}
        />
      </Section>

      <Section title="5. Stsenaariumite võrdlus">
        {scenarioComparison ? (
          <>
            <table>
              <thead>
                <tr>
                  <th>Stsenaarium</th>
                  <th>Aastane kogumõju</th>
                  <th>Investeering</th>
                  <th>Tasuvus</th>
                  <th>Tipp pärast</th>
                </tr>
              </thead>
              <tbody>
                {scenarioComparison.scenarios.map((row) => (
                  <tr key={row.id}>
                    <td>{row.label}</td>
                    <td>{fmtEt(row.annualSavingsEur, 0)} €</td>
                    <td>{fmtEt(row.investmentEur, 0)} €</td>
                    <td>{row.paybackYears != null ? `${fmtEt(row.paybackYears, 1)} a` : "—"}</td>
                    <td>{fmtEt(row.peakLoadAfterKw, 0)} kW</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>{scenarioComparison.conclusion.summary}</p>
          </>
        ) : (
          <p>Stsenaariumite võrdlus puudub selle arvutuse juures.</p>
        )}
      </Section>

      <Section title="6. Energiavoogude jaotus">
        <KvTable
          rows={[
            { label: "PV toodang", value: `${fmtEt(result.pvProductionMwh, 1)} MWh` },
            { label: "Kohapeal kasutatud PV", value: `${fmtEt(result.selfConsumedPvMwh, 1)} MWh` },
            { label: "Võrku müüdav PV", value: `${fmtEt(result.exportedPvMwh, 1)} MWh` },
            {
              label: "Aku kaudu kasutatud energia",
              value: `${fmtEt(result.batterySelfConsumptionImpactMwh, 1)} MWh`,
            },
          ]}
        />
      </Section>

      {timeseries ? (
        <Section title="7. Ajapõhine simulatsioon">
          <KvTable
            rows={[
              {
                label: "Simuleeritud periood",
                value: `${timeseries.periodStartLabel} – ${timeseries.periodEndLabel}`,
              },
              { label: "PV toodang perioodil", value: `${fmtEt(timeseries.pvProductionKwh / 1000, 2)} MWh` },
              {
                label: "Otsene omatarve",
                value: `${fmtEt(timeseries.directSelfConsumptionKwh / 1000, 2)} MWh`,
              },
              {
                label: "Aku kaudu kasutatud energia",
                value: `${fmtEt(timeseries.batteryDischargedToLoadKwh / 1000, 2)} MWh`,
              },
              { label: "Võrku müüdud energia", value: `${fmtEt(timeseries.gridExportKwh / 1000, 2)} MWh` },
              { label: "Võrgust ostetud energia", value: `${fmtEt(timeseries.gridImportKwh / 1000, 2)} MWh` },
              { label: "Aku tsüklid", value: fmtEt(timeseries.approxBatteryCycles, 1) },
            ]}
          />
        </Section>
      ) : null}

      {timeseries ? (
        <Section title="8. Ajapõhine majandusvaade">
          <KvTable
            rows={[
              {
                label: "Perioodi kogumõju",
                value: `${fmtEt(timeseries.economics.periodImpactEur, 0)} €`,
              },
              {
                label: "Aastaks skaleeritud mõju",
                value: `${fmtEt(timeseries.economics.annualizedImpactEur, 0)} €/a`,
              },
              {
                label: "Võrguenergia vähenemine",
                value: `${fmtEt(timeseries.economics.gridImportReductionMwh, 2)} MWh`,
              },
              {
                label: "Võrku müügi tulu",
                value: `${fmtEt(timeseries.economics.exportRevenueEur, 0)} €`,
              },
              {
                label: "Võimsustasu sääst",
                value: `${fmtEt(timeseries.economics.demandChargeSavingsEur, 0)} €`,
              },
            ]}
          />
        </Section>
      ) : null}

      <Section title="9. Soovituslik tõlgendus">
        <p>{interpretation.headline}</p>
        <p>{interpretation.impact}</p>
        <p>{interpretation.batteryRole}</p>
        <p>{interpretation.nextStep}</p>
      </Section>

      <Section title="10. Mudeli eeldused ja piirangud">
        <ul>
          <li>Tulemused on esialgne hinnang.</li>
          <li>PV tootmisprofiil on lihtsustatud.</li>
          <li>Aku juhtimine on reeglipõhine.</li>
          <li>Lühike CSV skaleeritakse aastaks.</li>
          <li>Hinnaseeria mõjutab rahalist arvestust, mitte aku juhtimist.</li>
          <li>See ei ole lõplik investeerimisotsus.</li>
        </ul>
      </Section>

      <footer className="industrial-print-footer">
        <p>
          {SITE_BRAND} · {SITE_CONTACT_NAME} · {SITE_CONTACT_EMAIL}
        </p>
        <p>Esialgne hinnang, mitte lõplik investeerimisotsus.</p>
      </footer>
    </article>
  );
}
