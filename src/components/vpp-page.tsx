"use client";

import { useMemo, useState } from "react";
import { canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";
import { FEATURES } from "@/lib/features";
import { MiniCashflowChart } from "@/components/charts/mini-cashflow-chart";

function num(v: string): number {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const fmtEur = (value: number) =>
  new Intl.NumberFormat("et-EE", { maximumFractionDigits: 0 }).format(value) + " €";

export function VppPageClient() {
  const { projectId, unlock, purchaseBusy, startCheckout, checkPaymentStatus, message, setMessage } =
    useProjectUnlock();
  const [capacityKwh, setCapacityKwh] = useState("");
  const [powerKw, setPowerKw] = useState("");
  const [investmentEur, setInvestmentEur] = useState("");
  const [annualRevenueEur, setAnnualRevenueEur] = useState(""); // baas-stsenaarium
  const [lifetimeYears, setLifetimeYears] = useState("10");
  const [efficiencyPct, setEfficiencyPct] = useState("92");
  const [annualOandMEur, setAnnualOandMEur] = useState("250");

  const model = useMemo(() => {
    const inv = Math.max(num(investmentEur), 0);
    const baseRev = Math.max(num(annualRevenueEur), 0);
    const eff = Math.min(Math.max(num(efficiencyPct), 50), 99) / 100;
    const years = Math.max(Math.round(num(lifetimeYears)), 1);
    const opex = Math.max(num(annualOandMEur), 0);

    const scenarios = [
      { key: "konservatiivne", label: "Konservatiivne (70%)", rev: baseRev * 0.7 },
      { key: "baas", label: "Baas", rev: baseRev },
      { key: "optimistlik", label: "Optimistlik (130%)", rev: baseRev * 1.3 },
    ] as const;

    const perScenario = scenarios.map((s) => {
      // netotulu = tulupotentsiaal * efficiency - hooldus
      const netRevenueYear = s.rev * eff - opex;
      // tasuvusaeg = investeering / netotulu
      const payback = netRevenueYear > 0 ? inv / netRevenueYear : null;
      // kogukasum = netotulu * eluiga - investeering
      const totalProfit = netRevenueYear * years - inv;
      const cashflows = Array.from({ length: years }, () => netRevenueYear);
      return {
        ...s,
        cashflows,
        netRevYear1: netRevenueYear,
        totalProfit,
        paybackYears: payback,
      };
    });

    return { inv, eff, years, opex, perScenario };
  }, [annualOandMEur, annualRevenueEur, efficiencyPct, investmentEur, lifetimeYears]);

  const downloadPdf = async () => {
    if (!projectId) return;
    try {
      const res = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          fullAnalysisSessionId: unlock.fullAnalysisSessionId,
          pdfSessionId: unlock.pdfSessionId,
          payload: {
            calculatorType: "vpp",
            inputs: [
              {
                group: "Aku ja investeering",
                items: [
                  { label: "Aku maht", value: capacityKwh ? `${capacityKwh} kWh` : "—" },
                  { label: "Aku võimsus", value: powerKw ? `${powerKw} kW` : "—" },
                  { label: "Investeering", value: investmentEur ? `${investmentEur} €` : "—" },
                ],
              },
              {
                group: "Tulud ja eluiga",
                items: [
                  { label: "Aastane tulupotentsiaal", value: annualRevenueEur ? `${annualRevenueEur} €` : "—" },
                  { label: "Eluiga", value: `${lifetimeYears} a` },
                  { label: "Efektiivsus", value: `${efficiencyPct}%` },
                ],
              },
              {
                group: "Kulud ja eeldused",
                items: [
                  { label: "Hooldus (€/a)", value: annualOandMEur ? `${annualOandMEur} €` : "—" },
                  { label: "Round-trip efficiency", value: `${efficiencyPct}%` },
                  { label: "Eluiga", value: `${lifetimeYears} a` },
                ],
              },
            ],
            assumptions: [{ label: "Märkus", value: "Mudel tugineb sisestatud tulueeldustele. Turupõhine tegelik tulu võib erineda." }],
            metrics: [
              { label: "Baas: netotulu (aasta 1)", value: fmtEur(model.perScenario[1]?.netRevYear1 ?? 0) },
              { label: "Baas: tasuvusaeg", value: model.perScenario[1]?.paybackYears ? `${model.perScenario[1].paybackYears.toFixed(1)} a` : "—" },
              { label: "Baas: kogukasum", value: fmtEur(model.perScenario[1]?.totalProfit ?? 0) },
              { label: "Efektiivsus", value: `${efficiencyPct}%` },
              { label: "Eluiga", value: `${lifetimeYears} a` },
              { label: "Investeering", value: investmentEur ? `${investmentEur} €` : "—" },
            ],
            charts: {
              cashflowByYear: (model.perScenario[1]?.cashflows ?? []).slice(1).map((v, idx) => ({
                year: idx + 1,
                cashflow: v,
              })),
            },
          },
        }),
      });
      if (!res.ok) {
        setMessage("PDF genereerimine ebaõnnestus.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "energiakalkulaator-vpp-analuus.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("PDF allalaadimine ebaõnnestus.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {message ? (
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{message}</p>
            <button type="button" className="btn-ghost" onClick={() => setMessage(null)}>
              Peida
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={checkPaymentStatus}>
              Kontrolli ligipääsu staatust
            </button>
          </div>
        </div>
      ) : null}

      <section className="glass-panel rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-zinc-50">VPP tasuvusmudel</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Lihtne hinnang aku osalemisele paindlikkuse teenustes. Sisesta eeldused ja vaata, mis suurusjärgus
          võiks tulemus olla.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            <span className="field-label-text">Aku maht (kWh)</span>
            <input
              className="input"
              value={capacityKwh}
              inputMode="decimal"
              onChange={(e) => setCapacityKwh(e.target.value)}
              placeholder="nt 100"
            />
            <span className="field-hint">Aku nimimaht.</span>
          </label>
          <label className="field-label">
            <span className="field-label-text">Aku võimsus (kW)</span>
            <input
              className="input"
              value={powerKw}
              inputMode="decimal"
              onChange={(e) => setPowerKw(e.target.value)}
              placeholder="nt 50"
            />
            <span className="field-hint">Max laadimis/tühjendusvõimsus.</span>
          </label>
          <label className="field-label">
            <span className="field-label-text">Investeering (€)</span>
            <input
              className={`input ${num(investmentEur) <= 0 ? "input-warning" : ""}`}
              value={investmentEur}
              inputMode="numeric"
              onChange={(e) => setInvestmentEur(e.target.value)}
              placeholder="nt 60000"
            />
            <span className="field-hint">Koguinvesteering eurodes.</span>
          </label>
          <label className="field-label">
            <span className="field-label-text">Aastane tulupotentsiaal (€)</span>
            <input
              className={`input ${num(annualRevenueEur) <= 0 ? "input-warning" : ""}`}
              value={annualRevenueEur}
              inputMode="numeric"
              onChange={(e) => setAnnualRevenueEur(e.target.value)}
              placeholder="nt 12000"
            />
            <span className="field-hint">Aastane brutotulu eeldus.</span>
          </label>
          <label className="field-label">
            <span className="field-label-text">Aku eluiga (a)</span>
            <select className="input" value={lifetimeYears} onChange={(e) => setLifetimeYears(e.target.value)}>
              <option value="5">5</option>
              <option value="7">7</option>
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="15">15</option>
            </select>
            <span className="field-hint">Arvutusperiood aastates.</span>
          </label>
          <label className="field-label">
            <span className="field-label-text">Round-trip efficiency (%)</span>
            <input
              className={`input ${num(efficiencyPct) < 70 ? "input-warning" : ""}`}
              value={efficiencyPct}
              inputMode="decimal"
              onChange={(e) => setEfficiencyPct(e.target.value)}
              placeholder="nt 92"
            />
            <span className="field-hint">Aku tsükli kasutegur.</span>
          </label>
          <label className="field-label">
            <span className="field-label-text">Hooldus (€/a)</span>
            <input
              className="input"
              value={annualOandMEur}
              inputMode="numeric"
              onChange={(e) => setAnnualOandMEur(e.target.value)}
              placeholder="nt 250"
            />
            <span className="field-hint">Aastane hoolduskulu.</span>
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-zinc-200">
          <strong className="block text-zinc-50">Märkus</strong>
          <p className="mt-1 text-zinc-300">
            {FEATURES.paywallEnabled
              ? "Detailsem VPP simulatsioon (stsenaariumid, risk ja rahavoog) on arenduses."
              : "Beetaversioon: mudel on lihtsustatud ja tugineb sinu sisestatud tulueeldustele."}
          </p>
        </div>
      </section>

      <PaywallCard
        locked={!canViewFullAnalysis(unlock)}
        title={FEATURES.paywallEnabled ? "Detailne vaade" : "Detailne analüüs"}
        description="avab VPP detailse simulatsiooni (stsenaariumid, risk, cashflow tabel, eksport) selle projekti jaoks."
        ctaLabel={purchaseBusy === "full_analysis" ? "Laen..." : "Ava detailne vaade"}
        secondaryLabel="Kontrolli ligipääsu staatust"
        onCta={() => startCheckout("full_analysis")}
        onSecondary={checkPaymentStatus}
        footer={
          <>
            Projekt: <span className="font-medium text-zinc-200">{projectId}</span>
          </>
        }
      >
        <h2 className="text-2xl font-semibold text-zinc-50">Tulemused</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="metric-card metric-card-primary metric-card-accent-emerald">
            <p className="metric-label">Olulisim: baas netotulu (aasta 1)</p>
            <div className="metric-main">
              <strong className="metric-value">
                {Math.round(model.perScenario[1]?.netRevYear1 ?? 0).toLocaleString("et-EE")}
              </strong>
              <span className="metric-unit">EUR/a</span>
            </div>
            <p className="metric-help">Aastane netotulu pärast efektiivsuse ja hoolduse arvestamist.</p>
          </div>
          <div className="metric-card metric-card-accent-teal">
            <p className="metric-label">Baas: tasuvusaeg</p>
            <div className="metric-main">
              <strong className="metric-value">
                {model.perScenario[1]?.paybackYears ? model.perScenario[1].paybackYears.toFixed(1) : "—"}
              </strong>
              <span className="metric-unit">aastat</span>
            </div>
            <p className="metric-help">Mitu aastat kulub investeeringu tagasi teenimiseks.</p>
          </div>
          <div className="metric-card metric-card-accent-emerald">
            <p className="metric-label">Baas: kogukasum (eluiga)</p>
            <div className="metric-main">
              <strong className="metric-value">
                {Math.round(model.perScenario[1]?.totalProfit ?? 0).toLocaleString("et-EE")}
              </strong>
              <span className="metric-unit">EUR</span>
            </div>
            <p className="metric-help">Kogukasum kogu valitud eluaja jooksul.</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
          <p className="font-medium text-zinc-100">Märkused</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Mudel tugineb sisestatud tulueeldustele; tegelik tulu sõltub turuolukorrast ja lepingust.</li>
            <li>Efektiivsus, hooldus ja degradatsioon mõjutavad tulemusi oluliselt.</li>
            <li>Vaata kolme stsenaariumi ja vali konservatiivne eeldus, kui tulemus läheb otsuse aluseks.</li>
          </ul>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="card">
            <h3 className="section-title">Stsenaariumid</h3>
            <div className="grid gap-3 text-sm">
              {model.perScenario.map((s) => (
                <div key={s.key} className="compare-row">
                  <span className="compare-label">{s.label}</span>
                  <strong>
                    {s.paybackYears ? `${s.paybackYears.toFixed(1)} a` : "—"} · Kogukasum {fmtEur(s.totalProfit)}
                  </strong>
                </div>
              ))}
            </div>
          </article>
          <article className="card">
            <h3 className="section-title">Rahavoog (baas)</h3>
            <MiniCashflowChart cashflows={(model.perScenario[1]?.cashflows ?? []).slice(1)} />
          </article>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="card">
            <h3 className="section-title">Tundlikkus (tulu ±20%)</h3>
            {(() => {
              const low = model.perScenario[0]?.paybackYears ?? null;
              const base = model.perScenario[1]?.paybackYears ?? null;
              const high = model.perScenario[2]?.paybackYears ?? null;
              return (
                <div className="grid gap-3 text-sm">
                  <div className="compare-row">
                    <span className="compare-label">Konservatiivne (70%)</span>
                    <strong>{low ? `${low.toFixed(1)} a` : "—"}</strong>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Baas</span>
                    <strong>{base ? `${base.toFixed(1)} a` : "—"}</strong>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Optimistlik (130%)</span>
                    <strong>{high ? `${high.toFixed(1)} a` : "—"}</strong>
                  </div>
                </div>
              );
            })()}
            <p className="mt-3 text-xs text-zinc-400">
              VPP puhul mõjutab tulemust enim tulueeldus (€/a) ja aku kasutuskoormus.
            </p>
          </article>

          <article className="card">
            <h3 className="section-title">Soovitused</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-300">
              <li>Testi vähemalt 3 stsenaariumi: madal / baas / kõrge tulu.</li>
              <li>Kui eesmärk on stabiilsus, kasuta konservatiivset tulueeldust ja jäta varu hoolduseks.</li>
              <li>Kui tasuvus on pikk, vaata üle investeering või realistlik tulu.</li>
            </ul>
          </article>
        </div>

        {FEATURES.paywallEnabled ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-sm text-zinc-200">PDF raport on tasuta beetaversioonis allalaaditav.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-glow" onClick={downloadPdf}>
                Laadi PDF alla
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-300">Laadi alla kokkuvõtte PDF.</p>
              <button type="button" className="btn-glow" onClick={downloadPdf}>
                Laadi PDF alla
              </button>
            </div>
          </div>
        )}
      </PaywallCard>
    </div>
  );
}

