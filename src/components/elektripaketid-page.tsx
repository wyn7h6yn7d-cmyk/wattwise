"use client";

import { canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";
import { useMemo, useState } from "react";

function toNumber(value: string) {
  if (!value.trim()) return 0;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const fmtEur = (value: number) =>
  new Intl.NumberFormat("et-EE", { maximumFractionDigits: 0 }).format(value) + " €";
const fmtEur2 = (value: number) =>
  new Intl.NumberFormat("et-EE", { maximumFractionDigits: 2 }).format(value) + " €";

export function ElektripaketidPageClient() {
  const { projectId, unlock, purchaseBusy, startCheckout, checkPaymentStatus, message, setMessage } =
    useProjectUnlock();

  const [monthlyKwh, setMonthlyKwh] = useState("400");
  const [spotEurKwh, setSpotEurKwh] = useState("0,12");
  const [fixedEurKwh, setFixedEurKwh] = useState("0,16");
  const [addOnEurKwh, setAddOnEurKwh] = useState("0,05");
  const [vat, setVat] = useState(true);

  const result = useMemo(() => {
    const kwhMonth = Math.max(toNumber(monthlyKwh), 0);
    const kwhYear = kwhMonth * 12;
    const addOn = Math.max(toNumber(addOnEurKwh), 0);
    const spot = Math.max(toNumber(spotEurKwh), 0);
    const fixed = Math.max(toNumber(fixedEurKwh), 0);
    const vatRate = vat ? 0.22 : 0;

    const spotCost = kwhYear * (spot + addOn) * (1 + vatRate);
    const fixedCost = kwhYear * (fixed + addOn) * (1 + vatRate);
    const diff = spotCost - fixedCost;
    const cheaper = spotCost < fixedCost ? "Spot" : "Fikseeritud";

    const reco =
      Math.abs(diff) < 30
        ? "Hinnang on väga lähedane — vali pigem stabiilsuse ja riskitaluvuse järgi."
        : cheaper === "Spot"
          ? "Selle sisendi põhjal on soodsam spot-hinnaga pakett."
          : "Selle sisendi põhjal on soodsam fikseeritud pakett (stabiilsem valik).";

    return { kwhYear, spotCost, fixedCost, diff, cheaper, reco, vatRate };
  }, [addOnEurKwh, fixedEurKwh, monthlyKwh, spotEurKwh, vat]);

  return (
    <div className="grid gap-6">
      {message ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">
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
        <h2 className="text-2xl font-semibold text-zinc-50">Elektripaketi võrdlus</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Kiire võrdlus spot vs fikseeritud paketile. Sisesta ligikaudne kuutarbimine ja hinnad, et näha aastakulu vahet.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="card">
            <h3 className="section-title">Sisendid</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Kuutarbimine (kWh)</span>
                <input className="input" value={monthlyKwh} inputMode="numeric" onChange={(e) => setMonthlyKwh(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Spot keskmine (€/kWh)</span>
                <input className="input" value={spotEurKwh} inputMode="decimal" onChange={(e) => setSpotEurKwh(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Fikseeritud (€/kWh)</span>
                <input className="input" value={fixedEurKwh} inputMode="decimal" onChange={(e) => setFixedEurKwh(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Võrgukulu + marginaal (€/kWh)</span>
                <input className="input" value={addOnEurKwh} inputMode="decimal" onChange={(e) => setAddOnEurKwh(e.target.value)} />
              </label>
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={vat}
                onChange={(e) => setVat(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
              Lisa käibemaks (22%)
            </label>
          </article>

          <article className="card">
            <h3 className="section-title">Tulemused</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="result-card">
                <p>Aastakulu spotiga</p>
                <strong>{fmtEur(result.spotCost)}</strong>
              </div>
              <div className="result-card">
                <p>Aastakulu fikseeritud paketiga</p>
                <strong>{fmtEur(result.fixedCost)}</strong>
              </div>
              <div className="result-card sm:col-span-2">
                <p>Vahe (spot − fikseeritud)</p>
                <strong>{fmtEur2(result.diff)}</strong>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-zinc-200">
              <p className="font-medium text-zinc-50">Soovitus</p>
              <p className="mt-1 text-zinc-300">{result.reco}</p>
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Arvutus: \(kWh/a \times (energiahind + lisakulud) \times (1 + KM)\). Aastane tarbimine:{" "}
              <span className="font-medium text-zinc-200">{Math.round(result.kwhYear)} kWh</span>.
            </p>
          </article>
        </div>
      </section>

      <PaywallCard
        locked={!canViewFullAnalysis(unlock)}
        title="Täisanalüüs"
        description="avab tunnipõhise simulatsiooni, CSV tarbimise impordi ja detailse võrdluse selle projekti jaoks."
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
        <h3 className="text-xl font-semibold text-zinc-50">Täisanalüüs: detailsem vaade</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Siin näed V1-s lihtsat tundlikkuse hinnangut. Hiljem lisandub tunnipõhine simulatsioon ja CSV import.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="card">
            <h4 className="section-title">Tundlikkus (spot ±20%)</h4>
            {(() => {
              const baseSpot = Math.max(toNumber(spotEurKwh), 0);
              const addOn = Math.max(toNumber(addOnEurKwh), 0);
              const vatRate = vat ? 0.22 : 0;
              const kwh = Math.max(toNumber(monthlyKwh), 0) * 12;
              const fixed = Math.max(toNumber(fixedEurKwh), 0);
              const fixedCost = kwh * (fixed + addOn) * (1 + vatRate);
              const low = kwh * (baseSpot * 0.8 + addOn) * (1 + vatRate);
              const high = kwh * (baseSpot * 1.2 + addOn) * (1 + vatRate);
              return (
                <div className="grid gap-3 text-sm">
                  <div className="compare-row">
                    <span className="compare-label">Spot (−20%) vs fikseeritud</span>
                    <strong>{fmtEur(low - fixedCost)}</strong>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Spot (baas) vs fikseeritud</span>
                    <strong>{fmtEur(result.spotCost - fixedCost)}</strong>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Spot (+20%) vs fikseeritud</span>
                    <strong>{fmtEur(high - fixedCost)}</strong>
                  </div>
                </div>
              );
            })()}
            <p className="mt-3 text-xs text-zinc-400">
              Negatiivne vahe tähendab, et spot on odavam; positiivne tähendab, et fikseeritud on odavam.
            </p>
          </article>

          <article className="card">
            <h4 className="section-title">Lisamärkused</h4>
            <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-300">
              <li>Spot hind võib kuude lõikes palju kõikuda — kui eelistad stabiilsust, võib fikseeritud olla mõistlik.</li>
              <li>Kui sul on tarbimist võimalik ajastada (EV, boiler, akuga PV), kipub spot olema soodsam.</li>
              <li>Järgmine samm: lisa tunnipõhine tarbimine (CSV), et saada realistlikum tulemus.</li>
            </ul>
          </article>
        </div>
      </PaywallCard>
    </div>
  );
}

