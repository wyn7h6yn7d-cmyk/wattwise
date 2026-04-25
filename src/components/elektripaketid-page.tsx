"use client";

import { canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";
import { UsedAssumptionsBlock } from "@/components/used-assumptions-block";
import { useMemo, useState } from "react";
import { calculateElectricityPlan } from "@/lib/calculators/electricity-plan";

function toNumber(value: string) {
  if (!value.trim()) return 0;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const fmtEur = (value: number) =>
  new Intl.NumberFormat("et-EE", { maximumFractionDigits: 0 }).format(value) + " €";
const fmtEur2 = (value: number) =>
  new Intl.NumberFormat("et-EE", { maximumFractionDigits: 2 }).format(value) + " €";
const fmtPct = (value: number) =>
  new Intl.NumberFormat("et-EE", { maximumFractionDigits: 1 }).format(value) + " %";

type Mode = "quick" | "advanced";

export function ElektripaketidPageClient() {
  const { projectId, unlock, purchaseBusy, startCheckout, checkPaymentStatus, message, setMessage } =
    useProjectUnlock();

  const [mode, setMode] = useState<Mode>("quick");
  const [monthlyKwh, setMonthlyKwh] = useState("");
  const [monthlyBreakdown, setMonthlyBreakdown] = useState(Array.from({ length: 12 }, () => ""));
  const [daySharePct, setDaySharePct] = useState("55");
  const [nightSharePct, setNightSharePct] = useState("45");

  const [spotEurKwh, setSpotEurKwh] = useState("");
  const [fixedEurKwh, setFixedEurKwh] = useState("");
  const [spotMarginEurKwh, setSpotMarginEurKwh] = useState("");
  const [gridFeeEurKwh, setGridFeeEurKwh] = useState("");
  const [renewableFeeEurKwh, setRenewableFeeEurKwh] = useState("");
  const [exciseEurKwh, setExciseEurKwh] = useState("");

  const [spotMonthlyFeeEur, setSpotMonthlyFeeEur] = useState("");
  const [fixedMonthlyFeeEur, setFixedMonthlyFeeEur] = useState("");
  const [networkMonthlyFeeEur, setNetworkMonthlyFeeEur] = useState("");
  const [pricesIncludeVat, setPricesIncludeVat] = useState(true);

  const hasValue = (v: string) => v.trim().length > 0;

  const result = useMemo(() => calculateElectricityPlan({
    mode,
    monthlyBreakdown,
    monthlyKwh,
    daySharePct,
    nightSharePct,
    spotEurKwh,
    fixedEurKwh,
    spotMarginEurKwh,
    gridFeeEurKwh,
    renewableFeeEurKwh,
    exciseEurKwh,
    spotMonthlyFeeEur,
    fixedMonthlyFeeEur,
    networkMonthlyFeeEur,
    pricesIncludeVat,
  }), [
    mode,
    monthlyBreakdown,
    monthlyKwh,
    spotEurKwh,
    fixedEurKwh,
    gridFeeEurKwh,
    spotMarginEurKwh,
    renewableFeeEurKwh,
    exciseEurKwh,
    spotMonthlyFeeEur,
    fixedMonthlyFeeEur,
    networkMonthlyFeeEur,
    pricesIncludeVat,
    daySharePct,
    nightSharePct,
  ]);

  const assumptionsInfo = useMemo(() => {
    const userInputs: string[] = [];
    if (toNumber(monthlyKwh) > 0) userInputs.push(`Kuutarbimine: ${monthlyKwh} kWh`);
    if (toNumber(spotEurKwh) > 0) userInputs.push(`Spot keskmine: ${spotEurKwh} €/kWh`);
    if (toNumber(fixedEurKwh) > 0) userInputs.push(`Fixed hind: ${fixedEurKwh} €/kWh`);
    if (toNumber(gridFeeEurKwh) > 0) userInputs.push(`Võrgutasu: ${gridFeeEurKwh} €/kWh`);

    const defaultAssumptions: string[] = [];
    if (mode === "quick") defaultAssumptions.push("Täpsed kuutasud ja lisatasud jäeti vaikimisi nulliks.");
    if (mode === "quick") defaultAssumptions.push("Kuude kaupa tarbimisjaotust ei arvestatud.");
    if (mode === "advanced" && !monthlyBreakdown.some((x) => x.trim().length > 0))
      defaultAssumptions.push("Kuupõhist tarbimist ei sisestatud, kasutati keskmist kuutarbimist.");

    return {
      userInputs,
      defaultAssumptions,
      apiValues: [],
      mostInfluentialInputs: [
        "Spot vs fixed energiahinna vahe",
        "Kuutarbimise maht",
        "Võrgutasu ja muud kWh tasud",
        "Paketipõhised kuutasud",
      ],
    };
  }, [monthlyKwh, spotEurKwh, fixedEurKwh, gridFeeEurKwh, mode, monthlyBreakdown]);

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
        <div className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              mode === "quick" ? "bg-emerald-400/20 text-emerald-100" : "text-zinc-300"
            }`}
            onClick={() => setMode("quick")}
          >
            Kiire hinnang
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              mode === "advanced" ? "bg-emerald-400/20 text-emerald-100" : "text-zinc-300"
            }`}
            onClick={() => setMode("advanced")}
          >
            Täpsem arvutus
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="card">
            <h3 className="section-title">Sisendid</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field-label">
                <span className="field-label-text">Kuutarbimine (kWh)</span>
                <input
                  className={`input ${hasValue(monthlyKwh) && toNumber(monthlyKwh) <= 0 ? "input-warning" : ""}`}
                  value={monthlyKwh}
                  inputMode="numeric"
                  onChange={(e) => setMonthlyKwh(e.target.value)}
                  placeholder="nt 400"
                />
                <span className="field-hint">Keskmine tarbimine kuus.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Spot keskmine (€/kWh)</span>
                <input
                  className={`input ${hasValue(spotEurKwh) && toNumber(spotEurKwh) <= 0 ? "input-warning" : ""}`}
                  value={spotEurKwh}
                  inputMode="decimal"
                  onChange={(e) => setSpotEurKwh(e.target.value)}
                  placeholder="nt 0,12"
                />
                <span className="field-hint">Prognoositav keskmine spot hind.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Fikseeritud (€/kWh)</span>
                <input
                  className={`input ${hasValue(fixedEurKwh) && toNumber(fixedEurKwh) <= 0 ? "input-warning" : ""}`}
                  value={fixedEurKwh}
                  inputMode="decimal"
                  onChange={(e) => setFixedEurKwh(e.target.value)}
                  placeholder="nt 0,16"
                />
                <span className="field-hint">Paketis fikseeritud energiahind.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Börsipaketi marginaal (€/kWh)</span>
                <input
                  className="input"
                  value={spotMarginEurKwh}
                  inputMode="decimal"
                  onChange={(e) => setSpotMarginEurKwh(e.target.value)}
                  placeholder="nt 0,01"
                />
                <span className="field-hint">Müüja lisatasu spot paketil.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Võrgutasu (€/kWh)</span>
                <input
                  className="input"
                  value={gridFeeEurKwh}
                  inputMode="decimal"
                  onChange={(e) => setGridFeeEurKwh(e.target.value)}
                  placeholder="nt 0,04"
                />
                <span className="field-hint">Võrguenergia tasu kWh kohta.</span>
              </label>
              {mode === "advanced" ? (
                <>
                  <label className="field-label">
                    <span className="field-label-text">Taastuvenergia tasu (€/kWh)</span>
                    <input
                      className="input"
                      value={renewableFeeEurKwh}
                      inputMode="decimal"
                      onChange={(e) => setRenewableFeeEurKwh(e.target.value)}
                      placeholder="nt 0,001"
                    />
                    <span className="field-hint">Lisatasu iga tarbitud kWh kohta.</span>
                  </label>
                  <label className="field-label">
                    <span className="field-label-text">Elektriaktsiis (€/kWh)</span>
                    <input
                      className="input"
                      value={exciseEurKwh}
                      inputMode="decimal"
                      onChange={(e) => setExciseEurKwh(e.target.value)}
                      placeholder="nt 0,0015"
                    />
                    <span className="field-hint">Aktsiisi osa kWh hinnas.</span>
                  </label>
                  <label className="field-label">
                    <span className="field-label-text">Spot kuutasu (€)</span>
                    <input
                      className="input"
                      value={spotMonthlyFeeEur}
                      inputMode="decimal"
                      onChange={(e) => setSpotMonthlyFeeEur(e.target.value)}
                      placeholder="nt 1,99"
                    />
                    <span className="field-hint">Spot paketiga seotud kuutasu.</span>
                  </label>
                  <label className="field-label">
                    <span className="field-label-text">Fikseeritud kuutasu (€)</span>
                    <input
                      className="input"
                      value={fixedMonthlyFeeEur}
                      inputMode="decimal"
                      onChange={(e) => setFixedMonthlyFeeEur(e.target.value)}
                      placeholder="nt 2,99"
                    />
                    <span className="field-hint">Fikseeritud paketiga seotud kuutasu.</span>
                  </label>
                  <label className="field-label">
                    <span className="field-label-text">Võrgupaketi kuutasu (€)</span>
                    <input
                      className="input"
                      value={networkMonthlyFeeEur}
                      inputMode="decimal"
                      onChange={(e) => setNetworkMonthlyFeeEur(e.target.value)}
                      placeholder="nt 4,5"
                    />
                    <span className="field-hint">Lisandub mõlemale paketile.</span>
                  </label>
                  <label className="field-label">
                    <span className="field-label-text">Päevase tarbimise osakaal (%)</span>
                    <input
                      className="input"
                      value={daySharePct}
                      inputMode="decimal"
                      onChange={(e) => setDaySharePct(e.target.value)}
                      placeholder="nt 55"
                    />
                    <span className="field-hint">Valmistab ette päev/öö hinnamudeli jaoks.</span>
                  </label>
                  <label className="field-label">
                    <span className="field-label-text">Öise tarbimise osakaal (%)</span>
                    <input
                      className="input"
                      value={nightSharePct}
                      inputMode="decimal"
                      onChange={(e) => setNightSharePct(e.target.value)}
                      placeholder="nt 45"
                    />
                    <span className="field-hint">Valmistab ette päev/öö hinnamudeli jaoks.</span>
                  </label>
                </>
              ) : null}
            </div>
            {mode === "advanced" ? (
              <div className="mt-4">
                <p className="field-label-text mb-2">Kuude kaupa tarbimine (kWh)</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {monthlyBreakdown.map((value, index) => (
                    <input
                      key={index}
                      className="input"
                      value={value}
                      inputMode="numeric"
                      onChange={(e) =>
                        setMonthlyBreakdown((prev) => prev.map((item, i) => (i === index ? e.target.value : item)))
                      }
                      placeholder={`Kuu ${index + 1}`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-zinc-400">CSV import lisandub hiljem (struktuur valmis).</p>
              </div>
            ) : null}
            <label className="mt-4 flex items-center gap-3 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={pricesIncludeVat}
                onChange={(e) => setPricesIncludeVat(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
              Hinnad on juba KM-ga (ära lisa KM uuesti)
            </label>
            {result.mwhWarning ? (
              <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                Tuvastasin suure hinnasisendi. Kontrolli kas sisestasid €/MWh (nt 100 €/MWh = 0,10 €/kWh). Teisendan
                selle automaatselt €/kWh kujule.
              </p>
            ) : null}
          </article>

          <article className="card">
            <h3 className="section-title">Tulemused</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="metric-card metric-card-accent-teal">
                <p className="metric-label">Spot kuukulu</p>
                <div className="metric-main">
                  <strong className="metric-value">{Math.round(result.spotMonthlyCost).toLocaleString("et-EE")}</strong>
                  <span className="metric-unit">EUR/kuu</span>
                </div>
                <p className="metric-help">Spot kuukulu kõikide tasudega.</p>
              </div>
              <div className="metric-card metric-card-accent-emerald">
                <p className="metric-label">Fixed kuukulu</p>
                <div className="metric-main">
                  <strong className="metric-value">{Math.round(result.fixedMonthlyCost).toLocaleString("et-EE")}</strong>
                  <span className="metric-unit">EUR/kuu</span>
                </div>
                <p className="metric-help">Fikseeritud kuukulu kõikide tasudega.</p>
              </div>
              <div className="metric-card metric-card-accent-teal">
                <p className="metric-label">Spot aastakulu</p>
                <div className="metric-main">
                  <strong className="metric-value">{Math.round(result.spotAnnualCost).toLocaleString("et-EE")}</strong>
                  <span className="metric-unit">EUR/a</span>
                </div>
                <p className="metric-help">Aastane spot kogukulu.</p>
              </div>
              <div className="metric-card metric-card-accent-emerald">
                <p className="metric-label">Fixed aastakulu</p>
                <div className="metric-main">
                  <strong className="metric-value">{Math.round(result.fixedAnnualCost).toLocaleString("et-EE")}</strong>
                  <span className="metric-unit">EUR/a</span>
                </div>
                <p className="metric-help">Aastane fixed kogukulu.</p>
              </div>
              <div className="metric-card metric-card-primary metric-card-accent-emerald sm:col-span-2">
                <p className="metric-label">Olulisim: vahe € (spot - fixed)</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.annualDiff.toFixed(2).replace(".", ",")}</strong>
                  <span className="metric-unit">EUR/a</span>
                </div>
                <p className="metric-help">Negatiivne tulemus = spot on odavam, positiivne = fikseeritud on odavam.</p>
              </div>
              <div className="metric-card metric-card-accent-teal sm:col-span-2">
                <p className="metric-label">Vahe % ja soodsam valik</p>
                <div className="metric-main">
                  <strong className="metric-value">{fmtPct(result.diffPercent)}</strong>
                  <span className="metric-unit">{result.cheaper}</span>
                </div>
                <p className="metric-help">Suhteline erinevus fixed aastakuluga võrreldes.</p>
              </div>
              <div className="metric-card metric-card-accent-teal sm:col-span-2">
                <p className="metric-label">Hinnamuutus, mis muudaks otsust</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.breakEvenDelta.toFixed(3).replace(".", ",")}</strong>
                  <span className="metric-unit">€/kWh</span>
                </div>
                <p className="metric-help">
                  Murdepunkti spot hind: {result.breakEvenSpotPrice.toFixed(3).replace(".", ",")} €/kWh.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-zinc-200">
              <p className="font-medium text-zinc-50">Soovitus</p>
              <p className="mt-1 text-zinc-300">{result.reco}</p>
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Arvutus: spot = tarbimine × (spot + marginaal + võrgutasu + taastuv + aktsiis) + kuutasud; fixed =
              tarbimine × (fixed + võrgutasu + taastuv + aktsiis) + kuutasud. Kui KM pole hinnas, lisatakse 1,24x.
            </p>
            <UsedAssumptionsBlock {...assumptionsInfo} />
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
              const margin = Math.max(toNumber(spotMarginEurKwh), 0);
              const gridFee = Math.max(toNumber(gridFeeEurKwh), 0);
              const renewable = Math.max(toNumber(renewableFeeEurKwh), 0);
              const excise = Math.max(toNumber(exciseEurKwh), 0);
              const vatMultiplier = pricesIncludeVat ? 1 : 1.24;
              const kwh = Math.max(toNumber(monthlyKwh), 0) * 12;
              const fixed = Math.max(toNumber(fixedEurKwh), 0);
              const fixedCost = kwh * (fixed + gridFee + renewable + excise) * vatMultiplier;
              const low = kwh * (baseSpot * 0.8 + margin + gridFee + renewable + excise) * vatMultiplier;
              const high = kwh * (baseSpot * 1.2 + margin + gridFee + renewable + excise) * vatMultiplier;
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
              <li>CSV import lisatakse järgmises etapis; praegu saab kuude kaupa tarbimise sisestada käsitsi.</li>
            </ul>
          </article>
        </div>
      </PaywallCard>
    </div>
  );
}

