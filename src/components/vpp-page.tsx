"use client";

import { useMemo, useState } from "react";
import { canDownloadPdf, canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";

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
  const [annualRevenueEur, setAnnualRevenueEur] = useState("");
  const [lifetimeYears, setLifetimeYears] = useState("10");
  const [efficiencyPct, setEfficiencyPct] = useState("92");

  const result = useMemo(() => {
    const inv = num(investmentEur);
    const rev = num(annualRevenueEur);
    const eff = Math.min(Math.max(num(efficiencyPct), 50), 99) / 100;
    const netRev = Math.max(rev * eff, 0);
    const payback = netRev > 0 ? inv / netRev : Infinity;
    const total = netRev * Math.max(num(lifetimeYears), 1) - inv;
    return { netRev, payback, total };
  }, [annualRevenueEur, efficiencyPct, investmentEur, lifetimeYears]);

  const downloadPdf = async () => {
    if (!projectId || !unlock.fullAnalysisSessionId || !unlock.pdfSessionId) return;
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
            ],
            assumptions: [{ label: "Märkus", value: "V1 mudel kasutab sisestatud tulueeldust (turuandmeid ei päringu)." }],
            metrics: [
              { label: "Netotulu aastas", value: fmtEur(result.netRev) },
              { label: "Lihtne tasuvusaeg", value: Number.isFinite(result.payback) ? `${result.payback.toFixed(1)} a` : "—" },
              { label: "Kogukasum eluajal", value: fmtEur(result.total) },
              { label: "Efektiivsus", value: `${efficiencyPct}%` },
              { label: "Eluiga", value: `${lifetimeYears} a` },
              { label: "Investeering", value: investmentEur ? `${investmentEur} €` : "—" },
            ],
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
              Kontrolli makse staatust
            </button>
          </div>
        </div>
      ) : null}

      <section className="glass-panel rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-zinc-50">VPP tasuvusmudel</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Hinnang aku osalemisele VPP / paindlikkuse teenustes. Sisesta lihtsad eeldused ja saa esimene
          tasuvusvaade.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-100">Aku maht (kWh)</span>
            <input
              className="input"
              value={capacityKwh}
              inputMode="decimal"
              onChange={(e) => setCapacityKwh(e.target.value)}
              placeholder="nt 100"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-100">Aku võimsus (kW)</span>
            <input
              className="input"
              value={powerKw}
              inputMode="decimal"
              onChange={(e) => setPowerKw(e.target.value)}
              placeholder="nt 50"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-100">Investeering (€)</span>
            <input
              className="input"
              value={investmentEur}
              inputMode="numeric"
              onChange={(e) => setInvestmentEur(e.target.value)}
              placeholder="nt 60000"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-100">Aastane tulupotentsiaal (€)</span>
            <input
              className="input"
              value={annualRevenueEur}
              inputMode="numeric"
              onChange={(e) => setAnnualRevenueEur(e.target.value)}
              placeholder="nt 12000"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-100">Aku eluiga (a)</span>
            <select className="input" value={lifetimeYears} onChange={(e) => setLifetimeYears(e.target.value)}>
              <option value="5">5</option>
              <option value="7">7</option>
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="15">15</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-100">Round-trip efficiency (%)</span>
            <input
              className="input"
              value={efficiencyPct}
              inputMode="decimal"
              onChange={(e) => setEfficiencyPct(e.target.value)}
              placeholder="nt 92"
            />
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-zinc-200">
          <strong className="block text-zinc-50">Täisanalüüs</strong>
          <p className="mt-1 text-zinc-300">
            Detailne VPP simulatsioon (turuplokid, stsenaariumid, risk, cashflow tabel, eksport) avaneb
            täisanalüüsis.
          </p>
        </div>
      </section>

      <PaywallCard
        locked={!canViewFullAnalysis(unlock)}
        title="Täisanalüüs"
        description="avab VPP detailse simulatsiooni (stsenaariumid, risk, cashflow tabel, eksport) selle projekti jaoks."
        ctaLabel={purchaseBusy === "full_analysis" ? "Suunamine..." : "Ava Täisanalüüs 9,99 €"}
        secondaryLabel="Kontrolli makse staatust"
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
          <div className="result-card">
            <p>Netotulu aastas (efektiivsusega)</p>
            <strong>{fmtEur(result.netRev)}</strong>
          </div>
          <div className="result-card">
            <p>Lihtne tasuvusaeg</p>
            <strong>
              {Number.isFinite(result.payback) ? `${result.payback.toFixed(1)} aastat` : "Pole võimalik arvutada"}
            </strong>
          </div>
          <div className="result-card sm:col-span-2">
            <p>Kogukasum eluaja jooksul</p>
            <strong>{fmtEur(result.total)}</strong>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
          <p className="font-medium text-zinc-100">Märkused</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>See on V1 lihtsustatud mudel, mis kasutab sisestatud tulueeldust.</li>
            <li>Efektiivsus vähendab eelduslikku tulu proportsionaalselt.</li>
            <li>Täisanalüüs lisab turuandmed, stsenaariumid ja detailse rahavoo.</li>
          </ul>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm text-zinc-200">
            PDF raport (2,99 €) on saadaval pärast Täisanalüüsi avamist ning avab konkreetse projekti raporti allalaadimise.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!unlock.pdfUnlocked ? (
              <button
                type="button"
                className="btn-glow"
                onClick={() => startCheckout("pdf_report")}
                disabled={purchaseBusy === "pdf_report"}
              >
                {purchaseBusy === "pdf_report" ? "Suunamine..." : "Lisa PDF raport 2,99 €"}
              </button>
            ) : (
              <button type="button" className="btn-glow" onClick={downloadPdf} disabled={!canDownloadPdf(unlock)}>
                Laadi PDF alla
              </button>
            )}
          </div>
        </div>
      </PaywallCard>
    </div>
  );
}

