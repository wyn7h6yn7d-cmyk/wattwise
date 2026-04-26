"use client";

import { canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { clientDownloadPdf } from "@/lib/pdf/client-download";
import { CalculatorPdfActions } from "@/components/calculator-pdf-actions";
import { PaywallCard } from "@/components/paywall-card";
import { UsedAssumptionsBlock } from "@/components/used-assumptions-block";
import { useMemo, useState } from "react";
import { calculateElectricityPlan, calculateElectricityPlanSensitivity } from "@/lib/calculators/electricity-plan";
import { ELECTRICITY_PLANS_UPDATED_AT, ELECTRICITY_PLAN_TEMPLATES } from "@/data/electricity-plans";
import { toNumber } from "@/lib/units";

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
  const [daySharePct, setDaySharePct] = useState("");
  const [nightSharePct, setNightSharePct] = useState("");

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
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [spotFetchState, setSpotFetchState] = useState<{ loading: boolean; note: string }>({
    loading: false,
    note: "",
  });
  const [hasCalculated, setHasCalculated] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

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
      apiValues: spotFetchState.note ? [spotFetchState.note] : [],
      mostInfluentialInputs: [
        "Spot vs fixed energiahinna vahe",
        "Kuutarbimise maht",
        "Võrgutasu ja muud kWh tasud",
      ],
    };
  }, [monthlyKwh, spotEurKwh, fixedEurKwh, gridFeeEurKwh, mode, monthlyBreakdown, spotFetchState.note]);

  const sanityWarnings = useMemo(() => {
    const warnings: string[] = [];
    const spot = toNumber(spotEurKwh);
    const fixed = toNumber(fixedEurKwh);
    const consumption = toNumber(monthlyKwh);
    if ((spot > 0 && (spot < 0.03 || spot > 0.6)) || (fixed > 0 && (fixed < 0.03 || fixed > 0.6))) {
      warnings.push("Elektrihind tundub ebatavaline. Kontrolli, et ühik on €/kWh, mitte €/MWh.");
    }
    if (consumption > 0 && (consumption < 50 || consumption > 10000)) {
      warnings.push("Kuutarbimine tundub ebarealistlik. Kontrolli sisestatud kWh väärtust.");
    }
    if (consumption <= 0) {
      warnings.push("Aastakulu võrdluseks sisesta vähemalt kuutarbimine üle 0 kWh.");
    }
    return warnings;
  }, [spotEurKwh, fixedEurKwh, monthlyKwh]);
  const hasRequiredInputs = toNumber(monthlyKwh) > 0 && toNumber(spotEurKwh) > 0 && toNumber(fixedEurKwh) > 0;

  const handleCalculate = () => {
    if (!hasRequiredInputs) {
      setValidationMessage("Täida vajalikud väljad enne arvutamist.");
      setHasCalculated(false);
      return;
    }
    setValidationMessage(null);
    setHasCalculated(true);
  };

  const handleReset = () => {
    setMonthlyKwh("");
    setMonthlyBreakdown(Array.from({ length: 12 }, () => ""));
    setDaySharePct("");
    setNightSharePct("");
    setSpotEurKwh("");
    setFixedEurKwh("");
    setSpotMarginEurKwh("");
    setGridFeeEurKwh("");
    setRenewableFeeEurKwh("");
    setExciseEurKwh("");
    setSpotMonthlyFeeEur("");
    setFixedMonthlyFeeEur("");
    setNetworkMonthlyFeeEur("");
    setSelectedTemplateId("");
    setValidationMessage(null);
    setHasCalculated(false);
  };

  const applyTemplate = (id: string) => {
    const tpl = ELECTRICITY_PLAN_TEMPLATES.find((item) => item.id === id);
    if (!tpl) return;
    setFixedEurKwh(String(tpl.fixedEurKwh));
    setSpotMarginEurKwh(String(tpl.spotMarginEurKwh));
    setSpotMonthlyFeeEur(String(tpl.monthlyFeeEur));
    setFixedMonthlyFeeEur(String(tpl.monthlyFeeEur));
    setGridFeeEurKwh(String(tpl.gridFeeEurKwh));
    setPricesIncludeVat(tpl.pricesIncludeVat);
  };

  const downloadPdf = async () => {
    if (!projectId) return;
    const out = await clientDownloadPdf(projectId, unlock, {
      calculatorType: "elektripaketid",
      summary: "Elektripaketi võrdlus koondab spot ja fikseeritud paketi aastakulu hinnangu sisestatud hindade põhjal.",
      analysisBasis: mode === "advanced" ? "advanced" : "defaults",
      inputs: [
        {
          group: "Tarbimine",
          items: [
            { label: "Kuutarbimine", value: `${monthlyKwh || "—"} kWh` },
            { label: "Päeva/öö jaotus", value: `${daySharePct || "—"}% / ${nightSharePct || "—"}%` },
            { label: "Režiim", value: mode === "advanced" ? "Täpsem arvutus" : "Kiire hinnang" },
          ],
        },
        {
          group: "Hinnad ja tasud",
          items: [
            { label: "Spot keskmine", value: `${spotEurKwh || "—"} €/kWh` },
            { label: "Fikseeritud", value: `${fixedEurKwh || "—"} €/kWh` },
            { label: "Spot marginaal", value: `${spotMarginEurKwh || "—"} €/kWh` },
            { label: "Võrgutasu", value: `${gridFeeEurKwh || "—"} €/kWh` },
            { label: "Hinnad sisaldavad KM-i", value: pricesIncludeVat ? "Jah" : "Ei" },
          ],
        },
      ],
      assumptions: [
        { label: "Märkus", value: "Paketihinnad ja võrgutasud võivad muutuda; raport on ligikaudne võrdlus." },
      ],
      disclaimer:
        "Võrdlus põhineb kasutaja sisestatud hindadel. Lõplik pakett tuleb kinnitada müüja juures.",
      metrics: [
        { label: "Aastane kulu vahe (spot − fixed)", value: `${result.annualDiff.toFixed(2).replace(".", ",")} €` },
        { label: "Spot aastakulu", value: `${Math.round(result.spotAnnualCost).toLocaleString("et-EE")} €` },
        { label: "Fixed aastakulu", value: `${Math.round(result.fixedAnnualCost).toLocaleString("et-EE")} €` },
        { label: "Soodsam valik", value: result.cheaper },
        { label: "Suhteline vahe", value: fmtPct(result.diffPercent) },
        {
          label: "Murdepunkti spot hind",
          value: `${result.breakEvenSpotPrice.toFixed(3).replace(".", ",")} €/kWh`,
        },
      ],
    }, "energiakalkulaator-elektripaketid-analuus.pdf");
    if (!out.ok) setMessage(out.error);
  };

  const fetchSpotFromElering = async () => {
    setSpotFetchState({ loading: true, note: "Laen Eleringi börsihinda..." });
    try {
      const now = new Date();
      const start = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      const end = new Date(now.getTime() + 22 * 60 * 60 * 1000).toISOString();
      const res = await fetch(
        `/api/elering/nps?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&area=ee`,
      );
      if (!res.ok) throw new Error("Eleringi päring ebaõnnestus");
      const data = (await res.json()) as { points?: Array<{ ts: number; price_eur_per_kwh: number }> };
      const points = data.points ?? [];
      if (!points.length) throw new Error("Hinnapunkte ei leitud");
      const avg = points.reduce((s, p) => s + p.price_eur_per_kwh, 0) / points.length;
      setSpotEurKwh(avg.toFixed(4));
      setSpotFetchState({
        loading: false,
        note: `Elering spot keskmine uuendatud: ${avg.toFixed(4).replace(".", ",")} €/kWh`,
      });
    } catch {
      setSpotFetchState({
        loading: false,
        note: "Eleringi spot-hinna laadimine ebaõnnestus. Kasuta käsitsi sisestust.",
      });
    }
  };

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
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-zinc-300">
          Elektrimüüjate paketihinnad võivad muutuda. Kontrolli lõplik pakkumine alati müüja juures.
          Börsihinna andmed tulevad Eleringi turuandmetest.
          <div className="mt-2 text-zinc-400">
            Näidispaketid on käsitsi hallatavad (`src/data/electricity-plans.ts`) ja viimati uuendatud:{" "}
            <span className="text-zinc-200">{ELECTRICITY_PLANS_UPDATED_AT}</span>.
          </div>
        </div>
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
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
              <p className="font-medium text-zinc-100">Kust andmed leida?</p>
              <p className="mt-2">
                Kui sul ei ole kõiki andmeid kohe käepärast, alusta hinnanguga. Täpsemad sisendid annavad täpsema
                tulemuse.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-400">
                <li>Kuutarbimine: elektrimüüja või võrguettevõtte iseteenindus, viimase 12 kuu keskmine.</li>
                <li>Spot/fikseeritud hind: pakkumine või kehtiv leping.</li>
                <li>Võrgutasu ja kuutasud: võrguettevõtte hinnakiri või arve.</li>
                <li>Kui täpset väärtust ei tea, sisesta realistlik keskmine ja võrdle variante.</li>
              </ul>
            </div>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="field-label">
                <span className="field-label-text">Näidispakett configist</span>
                <select
                  className="input"
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedTemplateId(value);
                    applyTemplate(value);
                  }}
                >
                  <option value="">Vali näidispakett...</option>
                  {ELECTRICITY_PLAN_TEMPLATES.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.provider} - {tpl.name}
                    </option>
                  ))}
                </select>
                <span className="field-hint">Need hinnad ei uuendu automaatsest müüja API-st.</span>
              </label>
              <div className="field-label">
                <span className="field-label-text">Börsihind Eleringist</span>
                <button type="button" className="btn-ghost" onClick={fetchSpotFromElering}>
                  {spotFetchState.loading ? "Laen..." : "Uuenda spot hind Eleringist"}
                </button>
                <span className="field-hint">{spotFetchState.note || "Toob lähitundide keskmise spot-hinna Eesti turult."}</span>
              </div>
            </div>
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
                <span className="field-hint">Leiad selle elektrimüüja või võrguettevõtte iseteenindusest. Kui tarbimine kõigub, kasuta viimase 12 kuu keskmist.</span>
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
                <span className="field-hint">Kui võrdled börsipaketti, kasuta viimase perioodi keskmist börsihinda või sisesta oma hinnang.</span>
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
                <span className="field-hint">Leiad selle elektrimüüja pakkumisest või kehtivast lepingust. Kontrolli, kas hind sisaldab käibemaksu.</span>
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
                <span className="field-hint">Börsipaketi marginaal on elektrimüüja lisatasu börsihinnale. Leiad selle lepingust või hinnakirjast.</span>
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
                <span className="field-hint">Leiad võrguteenuse arvelt või võrguettevõtte hinnakirjast. See võib erineda päevase ja öise tarbimise puhul.</span>
              </label>
              {mode === "advanced" ? (
                <>
                  <label className="field-label">
                    <span className="field-label-text">Spot kuutasu (€)</span>
                    <input
                      className="input"
                      value={spotMonthlyFeeEur}
                      inputMode="decimal"
                      onChange={(e) => setSpotMonthlyFeeEur(e.target.value)}
                      placeholder="nt 1,99"
                    />
                    <span className="field-hint">Leiad selle elektrimüüja või võrguteenuse pakkuja hinnakirjast. Lisa ainult need kuutasud, mida soovid võrdluses arvestada.</span>
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
                    <span className="field-hint">Leiad selle elektrimüüja või võrguteenuse pakkuja hinnakirjast. Lisa ainult need kuutasud, mida soovid võrdluses arvestada.</span>
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
                    <span className="field-hint">Leiad selle elektrimüüja või võrguteenuse pakkuja hinnakirjast. Lisa ainult need kuutasud, mida soovid võrdluses arvestada.</span>
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
              <span>Hinnad on juba KM-ga</span>
              <div className="yes-no-row">
                <span className="yes-no-text">Ei</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pricesIncludeVat}
                  className={`yes-no-switch ${pricesIncludeVat ? "is-on" : ""}`}
                  onClick={() => setPricesIncludeVat((v) => !v)}
                >
                  <span className="yes-no-knob" />
                </button>
                <span className="yes-no-text">Jah</span>
              </div>
            </label>
            <p className="mt-2 text-xs text-zinc-400">
              Kontrolli, kas sisestatud hinnad sisaldavad käibemaksu. Kui ei ole kindel, vaata arvel olevat lõppsummat.
            </p>
            {result.mwhWarning ? (
              <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                Tuvastasin suure hinnasisendi. Tõenäoliselt sisestasid hinna MWh-põhises ühikus; teisendan selle
                automaatselt kWh-põhisesse vaatesse.
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-glow w-full sm:w-auto" onClick={handleCalculate}>
                Arvuta tulemus
              </button>
              <button type="button" className="btn-ghost w-full sm:w-auto" onClick={handleReset}>
                Lähtesta
              </button>
            </div>
            {validationMessage ? (
              <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                {validationMessage}
              </p>
            ) : null}
          </article>

          <article className="card">
            <h3 className="section-title">Tulemused</h3>
            <p className="mb-4 text-sm text-zinc-300">
              Mida see tähendab? Võrdle aastakulu vahet ja murdepunkti - nii näed, millise hinna juures valik muutub.
            </p>
            {!hasCalculated ? (
              <div className="mb-4 rounded-2xl border border-white/12 bg-white/[0.03] p-4 text-sm text-zinc-300">
                <p className="font-medium text-zinc-100">Sisesta andmed ja vajuta "Arvuta tulemus".</p>
              </div>
            ) : null}
            {hasCalculated && sanityWarnings.length > 0 ? (
              <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                <p className="font-medium">Kontrolli sisendeid enne otsust</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {sanityWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {hasCalculated && hasRequiredInputs ? (
              <>
            <div className="mb-5 rounded-2xl border border-teal-300/30 bg-teal-400/15 p-5 shadow-[0_0_30px_rgba(20,184,166,0.12)]">
              <p className="text-xs uppercase tracking-wide text-teal-100/80">Peamine tulemus</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <strong className="text-4xl font-semibold text-teal-100 sm:text-5xl">
                  {result.annualDiff.toFixed(2).replace(".", ",")}
                </strong>
                <span className="pb-1 text-base text-teal-50/90 sm:text-lg">EUR/a</span>
              </div>
              <p className="mt-2 text-sm text-teal-50/90">
                Negatiivne vahe tähendab, et spot on odavam; positiivne tähendab, et fikseeritud on odavam.
              </p>
            </div>
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
                <p className="metric-help">Negatiivne tulemus tähendab, et spot on odavam; positiivne tähendab, et fikseeritud on odavam.</p>
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
              Tulemus arvestab sisestatud tarbimist, energiahinda, võrgutasu, kuutasusid ja KM käsitlust.
            </p>
            <UsedAssumptionsBlock {...assumptionsInfo} />
            <CalculatorPdfActions
              projectId={projectId}
              unlock={unlock}
              purchaseBusy={purchaseBusy}
              startCheckout={startCheckout}
              checkPaymentStatus={checkPaymentStatus}
              onDownload={downloadPdf}
              returnSlug="elektripaketid"
            />
              </>
            ) : (
              <p className="text-sm text-zinc-400">
                Sisesta vajalikud andmed ja vajuta "Arvuta tulemus", et näha tulemusi.
              </p>
            )}
          </article>
        </div>
      </section>

      <PaywallCard
        locked={!canViewFullAnalysis(unlock)}
        title="Detailne vaade"
        description="avab tunnipõhise simulatsiooni, CSV tarbimise impordi ja detailse võrdluse selle projekti jaoks."
        ctaLabel={purchaseBusy === "full_analysis" ? "Laen..." : "Ava detailne vaade"}
        secondaryLabel="Kontrolli ligipääsu staatust"
        onCta={() => startCheckout("full_analysis", { returnSlug: "elektripaketid" })}
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
              const sensitivity = calculateElectricityPlanSensitivity({
                monthlyKwh: toNumber(monthlyKwh),
                spotEurKwh: toNumber(spotEurKwh),
                fixedEurKwh: toNumber(fixedEurKwh),
                spotMarginEurKwh: toNumber(spotMarginEurKwh),
                gridFeeEurKwh: toNumber(gridFeeEurKwh),
                pricesIncludeVat,
              });
              return (
                <div className="grid gap-3 text-sm">
                  <div className="compare-row">
                    <span className="compare-label">Spot (−20%) vs fikseeritud</span>
                    <strong>{fmtEur(sensitivity.diffLowVsFixed)}</strong>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Spot (baas) vs fikseeritud</span>
                    <strong>{fmtEur(sensitivity.diffBaseVsFixed)}</strong>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Spot (+20%) vs fikseeritud</span>
                    <strong>{fmtEur(sensitivity.diffHighVsFixed)}</strong>
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

