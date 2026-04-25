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
  const [marginEurKwh, setMarginEurKwh] = useState("0,01");
  const [gridFeeEurKwh, setGridFeeEurKwh] = useState("0,04");
  const [vat, setVat] = useState(true);

  const result = useMemo(() => {
    const kwhMonth = Math.max(toNumber(monthlyKwh), 0);
    const kwhYear = kwhMonth * 12;
    const spot = Math.max(toNumber(spotEurKwh), 0);
    const fixed = Math.max(toNumber(fixedEurKwh), 0);
    const margin = Math.max(toNumber(marginEurKwh), 0);
    const gridFee = Math.max(toNumber(gridFeeEurKwh), 0);
    const vatMultiplier = vat ? 1.24 : 1;

    // spot_kulu = tarbimine_kWh * (spot + marginaal + võrgutasu)
    // fixed_kulu = tarbimine_kWh * (fixed + võrgutasu)
    // Kui KM sees: kulu = kulu * 1.24
    const spotAnnualCost = kwhYear * (spot + margin + gridFee) * vatMultiplier;
    const fixedAnnualCost = kwhYear * (fixed + gridFee) * vatMultiplier;
    const spotMonthlyCost = spotAnnualCost / 12;
    const fixedMonthlyCost = fixedAnnualCost / 12;
    const annualDiff = spotAnnualCost - fixedAnnualCost;
    const monthlyDiff = annualDiff / 12;
    const cheaper = spotAnnualCost < fixedAnnualCost ? "Spot" : "Fikseeritud";

    const reco =
      Math.abs(annualDiff) < 30
        ? "Hinnang on väga lähedane — vali pigem stabiilsuse ja riskitaluvuse järgi."
        : cheaper === "Spot"
          ? "Selle sisendi põhjal on soodsam spot-hinnaga pakett."
          : "Selle sisendi põhjal on soodsam fikseeritud pakett (stabiilsem valik).";

    return {
      kwhYear,
      spotAnnualCost,
      fixedAnnualCost,
      spotMonthlyCost,
      fixedMonthlyCost,
      annualDiff,
      monthlyDiff,
      cheaper,
      reco,
      vatMultiplier,
    };
  }, [fixedEurKwh, gridFeeEurKwh, marginEurKwh, monthlyKwh, spotEurKwh, vat]);

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
              Kontrolli ligipääsu staatust
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
              <label className="field-label">
                <span className="field-label-text">Kuutarbimine (kWh)</span>
                <input
                  className={`input ${toNumber(monthlyKwh) <= 0 ? "input-warning" : ""}`}
                  value={monthlyKwh}
                  inputMode="numeric"
                  onChange={(e) => setMonthlyKwh(e.target.value)}
                />
                <span className="field-hint">Keskmine tarbimine kuus.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Spot keskmine (€/kWh)</span>
                <input
                  className={`input ${toNumber(spotEurKwh) <= 0 ? "input-warning" : ""}`}
                  value={spotEurKwh}
                  inputMode="decimal"
                  onChange={(e) => setSpotEurKwh(e.target.value)}
                />
                <span className="field-hint">Prognoositav keskmine spot hind.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Fikseeritud (€/kWh)</span>
                <input
                  className={`input ${toNumber(fixedEurKwh) <= 0 ? "input-warning" : ""}`}
                  value={fixedEurKwh}
                  inputMode="decimal"
                  onChange={(e) => setFixedEurKwh(e.target.value)}
                />
                <span className="field-hint">Paketis fikseeritud energiahind.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Spot marginaal (€/kWh)</span>
                <input className="input" value={marginEurKwh} inputMode="decimal" onChange={(e) => setMarginEurKwh(e.target.value)} />
                <span className="field-hint">Müüja lisatasu spot paketil.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Võrgutasu (€/kWh)</span>
                <input className="input" value={gridFeeEurKwh} inputMode="decimal" onChange={(e) => setGridFeeEurKwh(e.target.value)} />
                <span className="field-hint">Võrguenergia tasu kWh kohta.</span>
              </label>
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={vat}
                onChange={(e) => setVat(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
              Hinnad sisaldavad käibemaksu (24%)
            </label>
          </article>

          <article className="card">
            <h3 className="section-title">Tulemused</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="metric-card metric-card-accent-teal">
                <p className="metric-label">Aastakulu spotiga</p>
                <div className="metric-main">
                  <strong className="metric-value">{Math.round(result.spotAnnualCost).toLocaleString("et-EE")}</strong>
                  <span className="metric-unit">EUR/a</span>
                </div>
                <p className="metric-help">Prognoositud aastane kogukulu spot paketiga.</p>
              </div>
              <div className="metric-card metric-card-accent-emerald">
                <p className="metric-label">Aastakulu fikseeritud paketiga</p>
                <div className="metric-main">
                  <strong className="metric-value">{Math.round(result.fixedAnnualCost).toLocaleString("et-EE")}</strong>
                  <span className="metric-unit">EUR/a</span>
                </div>
                <p className="metric-help">Prognoositud aastane kogukulu fikseeritud paketiga.</p>
              </div>
              <div className="metric-card metric-card-accent-teal">
                <p className="metric-label">Kuu kulu spotiga</p>
                <div className="metric-main">
                  <strong className="metric-value">{Math.round(result.spotMonthlyCost).toLocaleString("et-EE")}</strong>
                  <span className="metric-unit">EUR/kuu</span>
                </div>
                <p className="metric-help">Keskmine kuine kulu spoti eeldusel.</p>
              </div>
              <div className="metric-card metric-card-accent-emerald">
                <p className="metric-label">Kuu kulu fikseeritud paketiga</p>
                <div className="metric-main">
                  <strong className="metric-value">{Math.round(result.fixedMonthlyCost).toLocaleString("et-EE")}</strong>
                  <span className="metric-unit">EUR/kuu</span>
                </div>
                <p className="metric-help">Keskmine kuine kulu fikseeritud hinnaga.</p>
              </div>
              <div className="metric-card metric-card-primary metric-card-accent-emerald sm:col-span-2">
                <p className="metric-label">Olulisim: vahe aastas (spot − fikseeritud)</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.annualDiff.toFixed(2).replace(".", ",")}</strong>
                  <span className="metric-unit">EUR/a</span>
                </div>
                <p className="metric-help">Negatiivne tulemus = spot on odavam, positiivne = fikseeritud on odavam.</p>
              </div>
              <div className="metric-card metric-card-accent-teal sm:col-span-2">
                <p className="metric-label">Vahe kuus (spot − fikseeritud)</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.monthlyDiff.toFixed(2).replace(".", ",")}</strong>
                  <span className="metric-unit">EUR/kuu</span>
                </div>
                <p className="metric-help">Kuu taseme võrdlus sama tarbimise korral.</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-zinc-200">
              <p className="font-medium text-zinc-50">Soovitus</p>
              <p className="mt-1 text-zinc-300">{result.reco}</p>
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Arvutus: spot = kWh/a × (spot + marginaal + võrgutasu), fikseeritud = kWh/a × (fixed + võrgutasu),
              KM sees korrutame tulemuse 1,24-ga. Aastane tarbimine:{" "}
              <span className="font-medium text-zinc-200">{Math.round(result.kwhYear)} kWh</span>.
            </p>
          </article>
        </div>
      </section>

      <PaywallCard
        locked={!canViewFullAnalysis(unlock)}
        title="Detailne vaade"
        description="avab tunnipõhise simulatsiooni, CSV tarbimise impordi ja detailse võrdluse selle projekti jaoks."
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
        <h3 className="text-xl font-semibold text-zinc-50">Detailne vaade</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Siin näed V1-s lihtsat tundlikkuse hinnangut. Hiljem lisandub tunnipõhine simulatsioon ja CSV import.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="card">
            <h4 className="section-title">Tundlikkus (spot ±20%)</h4>
            {(() => {
              const baseSpot = Math.max(toNumber(spotEurKwh), 0);
              const margin = Math.max(toNumber(marginEurKwh), 0);
              const gridFee = Math.max(toNumber(gridFeeEurKwh), 0);
              const vatMultiplier = vat ? 1.24 : 1;
              const kwh = Math.max(toNumber(monthlyKwh), 0) * 12;
              const fixed = Math.max(toNumber(fixedEurKwh), 0);
              const fixedCost = kwh * (fixed + gridFee) * vatMultiplier;
              const low = kwh * (baseSpot * 0.8 + margin + gridFee) * vatMultiplier;
              const high = kwh * (baseSpot * 1.2 + margin + gridFee) * vatMultiplier;
              return (
                <div className="grid gap-3 text-sm">
                  <div className="compare-row">
                    <span className="compare-label">Spot (−20%) vs fikseeritud</span>
                    <strong>{fmtEur(low - fixedCost)}</strong>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Spot (baas) vs fikseeritud</span>
                    <strong>{fmtEur(result.spotAnnualCost - fixedCost)}</strong>
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

