"use client";

import { canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";
import { UsedAssumptionsBlock } from "@/components/used-assumptions-block";
import { AdvancedInputAccordion } from "@/components/advanced-input-accordion";
import { useMemo, useState } from "react";
import {
  calculatePeakShaving,
  calculatePeakShavingProjection,
} from "@/lib/calculators/peak-shaving";

function toNumber(value: string) {
  if (!value.trim()) return 0;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const fmtEur = (value: number) =>
  new Intl.NumberFormat("et-EE", { maximumFractionDigits: 0 }).format(value) + " €";

export function PeakShavingPageClient() {
  const { projectId, unlock, purchaseBusy, startCheckout, checkPaymentStatus, message, setMessage } =
    useProjectUnlock();

  const [mode, setMode] = useState<"quick" | "advanced">("quick");
  const [currentPeakKw, setCurrentPeakKw] = useState("");
  const [targetLimitKw, setTargetLimitKw] = useState("");
  const [batteryKwh, setBatteryKwh] = useState("");
  const [batteryKw, setBatteryKw] = useState("");
  const [peakHours, setPeakHours] = useState("");
  const [demandFeeEurPerKwMonth, setDemandFeeEurPerKwMonth] = useState("");
  const [peaksPerMonth, setPeaksPerMonth] = useState("4");
  const [avgPeakDurationHours, setAvgPeakDurationHours] = useState("1");
  const [minSocPct, setMinSocPct] = useState("15");
  const [maxUsableSocPct, setMaxUsableSocPct] = useState("90");
  const [batteryEfficiencyPct, setBatteryEfficiencyPct] = useState("92");
  const [batteryDegradationPct, setBatteryDegradationPct] = useState("2");
  const [investmentEur, setInvestmentEur] = useState("");
  const [annualMaintenanceEur, setAnnualMaintenanceEur] = useState("");
  const [demandFeeGrowthPct, setDemandFeeGrowthPct] = useState("3");
  const [periodYears, setPeriodYears] = useState("10");
  const hasValue = (v: string) => v.trim().length > 0;

  const result = useMemo(() => {
    const peak = Math.max(toNumber(currentPeakKw), 0);
    const limit = Math.max(toNumber(targetLimitKw), 0);
    const battKwh = Math.max(toNumber(batteryKwh), 0);
    const battKw = Math.max(toNumber(batteryKw), 0);
    const hours =
      mode === "advanced"
        ? Math.max(toNumber(avgPeakDurationHours), 0.25)
        : Math.max(toNumber(peakHours), 0.25);
    const fee = Math.max(toNumber(demandFeeEurPerKwMonth), 0);
    const peaks = Math.max(Math.round(toNumber(peaksPerMonth)), 0);
    const minSoc = Math.min(Math.max(toNumber(minSocPct), 0), 100);
    const maxSoc = Math.min(Math.max(toNumber(maxUsableSocPct), 0), 100);
    const usableSocRange = Math.max((maxSoc - minSoc) / 100, 0);
    const efficiency = Math.min(Math.max(toNumber(batteryEfficiencyPct), 1), 100) / 100;
    const degradation = Math.min(Math.max(toNumber(batteryDegradationPct), 0), 30) / 100;
    const inv = Math.max(toNumber(investmentEur), 0);
    const maintenance = Math.max(toNumber(annualMaintenanceEur), 0);
    const feeGrowth = Math.min(Math.max(toNumber(demandFeeGrowthPct), 0), 100) / 100;
    const years = Math.max(Math.round(toNumber(periodYears)), 1);

    const peakShaving = calculatePeakShaving({
      currentPeakKw: peak,
      targetPeakKw: limit,
      batteryKwh: battKwh,
      usableSocPercent: usableSocRange * 100,
      efficiencyPercent: efficiency * 100,
      batteryPowerKw: battKw,
      peakDurationHours: hours,
      demandChargeEurKwMonth: fee,
      annualMaintenanceCost: maintenance,
      investment: inv,
    });

    const needCut = peakShaving.requiredReductionKw;
    const usableBatteryEnergyKwh = peakShaving.usableBatteryEnergyKwh;
    const energyLimitedCut = peakShaving.energyLimitedReductionKw;
    const achievableCut = peakShaving.possibleReductionKw;
    const annualSavings = peakShaving.annualSavings;
    const netSavings = peakShaving.netSavings;
    const paybackYears = peakShaving.paybackYears;
    const targetRealistic = peakShaving.targetAchievable;
    const limitingFactor = peakShaving.limitingFactor;
    const powerLimits = !targetRealistic && limitingFactor === "aku võimsus";
    const energyLimits = !targetRealistic && (limitingFactor === "aku maht" || limitingFactor === "tipu kestus");

    const projection = calculatePeakShavingProjection({
      possibleReductionKw: achievableCut,
      requiredReductionKw: needCut,
      peakDurationHours: hours,
      usableSocPercent: usableSocRange * 100,
      efficiencyPercent: efficiency * 100,
      demandChargeEurKwMonth: fee,
      annualMaintenanceCost: maintenance,
      demandFeeGrowthPercent: feeGrowth * 100,
      batteryDegradationPercent: degradation * 100,
      periodYears: years,
      investment: inv,
    });
    const note =
      needCut <= 0
        ? "Sinu sisendi põhjal pole vaja tippu lõigata (piir on juba piisav)."
        : achievableCut <= 0
          ? "Aku parameetritega ei saa tippu sisuliselt lõigata."
          : achievableCut < needCut
            ? "Aku piirab lõikamist (võimsus või energia ei pruugi täielikult piisata)."
            : "Aku parameetritega on tippude lõikamine selle piirini realistlik.";

    return {
      needCut,
      usableBatteryEnergyKwh,
      energyLimitedCut,
      achievableCut,
      limitingFactor,
      annualSavings,
      netSavings,
      paybackYears,
      discountedNet: projection.discountedNetEur,
      recommendedBatteryKw: projection.recommendedBatteryKw,
      recommendedBatteryKwh: projection.recommendedBatteryKwh,
      powerLimits,
      energyLimits,
      targetRealistic,
      note,
      hours,
      fee,
      peaks,
    };
  }, [
    mode,
    batteryKw,
    batteryKwh,
    currentPeakKw,
    demandFeeEurPerKwMonth,
    peakHours,
    targetLimitKw,
    peaksPerMonth,
    avgPeakDurationHours,
    minSocPct,
    maxUsableSocPct,
    batteryEfficiencyPct,
    batteryDegradationPct,
    investmentEur,
    annualMaintenanceEur,
    demandFeeGrowthPct,
    periodYears,
  ]);

  const assumptionsInfo = useMemo(() => {
    const userInputs: string[] = [];
    if (toNumber(currentPeakKw) > 0) userInputs.push(`Praegune peak: ${currentPeakKw} kW`);
    if (toNumber(targetLimitKw) > 0) userInputs.push(`Soovitud piir: ${targetLimitKw} kW`);
    if (toNumber(batteryKwh) > 0) userInputs.push(`Aku maht: ${batteryKwh} kWh`);
    if (toNumber(batteryKw) > 0) userInputs.push(`Aku võimsus: ${batteryKw} kW`);
    if (toNumber(demandFeeEurPerKwMonth) > 0) userInputs.push(`Võimsustasu: ${demandFeeEurPerKwMonth} €/kW/kuu`);

    const defaultAssumptions: string[] = [];
    if (mode === "quick") defaultAssumptions.push("SOC vahemik ja aku efektiivsus eeldati tüüpiliste väärtustega.");
    if (mode === "advanced" && toNumber(minSocPct) === 15) defaultAssumptions.push("Min SOC: 15%.");
    if (mode === "advanced" && toNumber(maxUsableSocPct) === 90) defaultAssumptions.push("Max kasutatav SOC: 90%.");
    if (mode === "advanced" && toNumber(batteryEfficiencyPct) === 92) defaultAssumptions.push("Aku efektiivsus: 92%.");

    return {
      userInputs,
      defaultAssumptions,
      apiValues: [],
      mostInfluentialInputs: [
        "Praeguse tipu ja sihtpiiri vahe",
        "Aku võimsus (kW)",
        "Aku kasutatav energia (kWh)",
        "Võimsustasu €/kW/kuu",
      ],
    };
  }, [
    currentPeakKw,
    targetLimitKw,
    batteryKwh,
    batteryKw,
    demandFeeEurPerKwMonth,
    mode,
    minSocPct,
    maxUsableSocPct,
    batteryEfficiencyPct,
  ]);

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
        <h2 className="text-2xl font-semibold text-zinc-50">Peak shaving / ettevõtte võimsus</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Lihtne hinnang, kui palju tippu saab akuga lõigata ja mis võiks olla sääst võimsustasudes.
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
              {mode === "advanced" ? (
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setPeaksPerMonth("4");
                      setAvgPeakDurationHours("1");
                      setMinSocPct("15");
                      setMaxUsableSocPct("90");
                      setBatteryEfficiencyPct("92");
                      setBatteryDegradationPct("2");
                      setDemandFeeGrowthPct("3");
                      setPeriodYears("10");
                    }}
                  >
                    Taasta vaikimisi
                  </button>
                </div>
              ) : null}
              <label className="field-label">
                <span className="field-label-text">Olemasolev tipukoormus (kW)</span>
                <input
                  className={`input ${hasValue(currentPeakKw) && toNumber(currentPeakKw) <= 0 ? "input-warning" : ""}`}
                  value={currentPeakKw}
                  inputMode="decimal"
                  onChange={(e) => setCurrentPeakKw(e.target.value)}
                  placeholder="nt 120"
                />
                <span className="field-hint">Praegune kõrgeim võimsus.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Soovitud piir (kW)</span>
                <input
                  className={`input ${
                    hasValue(targetLimitKw) && hasValue(currentPeakKw) && toNumber(targetLimitKw) >= toNumber(currentPeakKw)
                      ? "input-warning"
                      : ""
                  }`}
                  value={targetLimitKw}
                  inputMode="decimal"
                  onChange={(e) => setTargetLimitKw(e.target.value)}
                  placeholder="nt 90"
                />
                <span className="field-hint">Sihttase, millest üle ei soovita minna.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Aku suurus (kWh)</span>
                <input
                  className={`input ${hasValue(batteryKwh) && toNumber(batteryKwh) <= 0 ? "input-error" : ""}`}
                  value={batteryKwh}
                  inputMode="decimal"
                  onChange={(e) => setBatteryKwh(e.target.value)}
                  placeholder="nt 150"
                />
                <span className="field-hint">Aku energiamaht.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Aku võimsus (kW)</span>
                <input
                  className={`input ${hasValue(batteryKw) && toNumber(batteryKw) <= 0 ? "input-error" : ""}`}
                  value={batteryKw}
                  inputMode="decimal"
                  onChange={(e) => setBatteryKw(e.target.value)}
                  placeholder="nt 60"
                />
                <span className="field-hint">Aku maksimaalne hetkeline võimsus.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Tiputunni kestus (h)</span>
                <input
                  className={`input ${hasValue(peakHours) && toNumber(peakHours) <= 0 ? "input-warning" : ""}`}
                  value={peakHours}
                  inputMode="decimal"
                  onChange={(e) => setPeakHours(e.target.value)}
                  placeholder="nt 1"
                  disabled={mode === "advanced"}
                />
                <span className="field-hint">Kui kaua tippkoormus tavaliselt kestab.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Võimsustasu (€/kW/kuu)</span>
                <input
                  className={`input ${
                    hasValue(demandFeeEurPerKwMonth) && toNumber(demandFeeEurPerKwMonth) <= 0 ? "input-warning" : ""
                  }`}
                  value={demandFeeEurPerKwMonth}
                  inputMode="decimal"
                  onChange={(e) => setDemandFeeEurPerKwMonth(e.target.value)}
                  placeholder="nt 6,5"
                />
                <span className="field-hint">Võrgu võimsuskomponendi tasu.</span>
              </label>
              {mode === "advanced" ? (
                <div className="sm:col-span-2 grid gap-3">
                  <AdvancedInputAccordion title="1) Põhiandmed" defaultOpen>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="field-label">
                        <span className="field-label-text">Tippude arv kuus</span>
                        <input className="input" value={peaksPerMonth} inputMode="numeric" onChange={(e) => setPeaksPerMonth(e.target.value)} placeholder="nt 4" />
                        <span className="field-hint">Info detailsema profiili hindamiseks.</span>
                      </label>
                      <label className="field-label">
                        <span className="field-label-text">Keskmine tipu kestus (h)</span>
                        <input className="input" value={avgPeakDurationHours} inputMode="decimal" onChange={(e) => setAvgPeakDurationHours(e.target.value)} placeholder="nt 1,2" />
                        <span className="field-hint">Kasutatakse energia-põhise lõike arvutuses.</span>
                      </label>
                    </div>
                  </AdvancedInputAccordion>
                  <AdvancedInputAccordion title="2) Hinnad ja kulud">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="field-label">
                        <span className="field-label-text">Investeering (€)</span>
                        <input className="input" value={investmentEur} inputMode="numeric" onChange={(e) => setInvestmentEur(e.target.value)} placeholder="nt 80000" />
                        <span className="field-hint">Aku ja paigalduse kogukulu.</span>
                      </label>
                      <label className="field-label">
                        <span className="field-label-text">Hoolduskulu (€/a)</span>
                        <input className="input" value={annualMaintenanceEur} inputMode="numeric" onChange={(e) => setAnnualMaintenanceEur(e.target.value)} placeholder="nt 1200" />
                        <span className="field-hint">Aastased püsikulud.</span>
                      </label>
                      <label className="field-label">
                        <span className="field-label-text">Võimsustasu kasv (%/a)</span>
                        <input className="input" value={demandFeeGrowthPct} inputMode="decimal" onChange={(e) => setDemandFeeGrowthPct(e.target.value)} placeholder="nt 3" />
                        <span className="field-hint">Tuleviku säästu prognoosiks.</span>
                      </label>
                    </div>
                  </AdvancedInputAccordion>
                  <AdvancedInputAccordion title="3) Tehnilised eeldused">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="field-label">
                        <span className="field-label-text">Aku minimaalne SOC (%)</span>
                        <input className="input" value={minSocPct} inputMode="decimal" onChange={(e) => setMinSocPct(e.target.value)} placeholder="nt 15" />
                        <span className="field-hint">Aku alumine piir.</span>
                      </label>
                      <label className="field-label">
                        <span className="field-label-text">Aku maksimaalne kasutatav SOC (%)</span>
                        <input className="input" value={maxUsableSocPct} inputMode="decimal" onChange={(e) => setMaxUsableSocPct(e.target.value)} placeholder="nt 90" />
                        <span className="field-hint">Aku ülemine kasutuspiir.</span>
                      </label>
                      <label className="field-label">
                        <span className="field-label-text">Aku efektiivsus (%)</span>
                        <input className="input" value={batteryEfficiencyPct} inputMode="decimal" onChange={(e) => setBatteryEfficiencyPct(e.target.value)} placeholder="nt 92" />
                        <span className="field-hint">Roundtrip kasutegur.</span>
                      </label>
                      <label className="field-label">
                        <span className="field-label-text">Aku degradatsioon (%/a)</span>
                        <input className="input" value={batteryDegradationPct} inputMode="decimal" onChange={(e) => setBatteryDegradationPct(e.target.value)} placeholder="nt 2" />
                        <span className="field-hint">Aastane jõudluse vähenemine.</span>
                      </label>
                    </div>
                  </AdvancedInputAccordion>
                  <AdvancedInputAccordion title="4) Täpsemad seaded">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="field-label">
                        <span className="field-label-text">Arvutusperiood (a)</span>
                        <input className="input" value={periodYears} inputMode="numeric" onChange={(e) => setPeriodYears(e.target.value)} placeholder="nt 10" />
                        <span className="field-hint">Tasuvuse ja kogutulemuse periood.</span>
                      </label>
                    </div>
                  </AdvancedInputAccordion>
                </div>
              ) : null}
            </div>
          </article>

          <article className="card">
            <h3 className="section-title">Tulemused</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="metric-card metric-card-accent-teal">
                <p className="metric-label">Vajalik lõige</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.needCut.toFixed(1).replace(".", ",")}</strong>
                  <span className="metric-unit">kW</span>
                </div>
                <p className="metric-help">Kui palju tuleks tippu vähendada sihtpiiri saavutamiseks.</p>
              </div>
              <div className="metric-card metric-card-accent-emerald">
                <p className="metric-label">Saavutatav lõige</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.achievableCut.toFixed(1).replace(".", ",")}</strong>
                  <span className="metric-unit">kW</span>
                </div>
                <p className="metric-help">Aku reaalselt võimaldatav tipukoormuse vähendus.</p>
              </div>
              <div className="metric-card metric-card-primary metric-card-accent-emerald sm:col-span-2">
                <p className="metric-label">Olulisim: hinnanguline sääst aastas</p>
                <div className="metric-main">
                  <strong className="metric-value">{Math.round(result.annualSavings).toLocaleString("et-EE")}</strong>
                  <span className="metric-unit">EUR/a</span>
                </div>
                <p className="metric-help">Aastane võimsustasu kokkuhoid saavutatud lõike põhjal.</p>
              </div>
              <div className="metric-card metric-card-accent-teal">
                <p className="metric-label">Tasuvusaeg</p>
                <div className="metric-main">
                  <strong className="metric-value">
                    {result.paybackYears !== null ? result.paybackYears.toFixed(1).replace(".", ",") : "—"}
                  </strong>
                  {result.paybackYears !== null ? <span className="metric-unit">a</span> : null}
                </div>
                <p className="metric-help">Investeering / netosääst (kuvatakse kui netosääst &gt; 0).</p>
              </div>
              <div className="metric-card metric-card-accent-emerald">
                <p className="metric-label">Piirav tegur</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.limitingFactor}</strong>
                </div>
                <p className="metric-help">Mis piirab sihtlõike saavutamist enim.</p>
              </div>
              <div className="metric-card metric-card-accent-teal">
                <p className="metric-label">Kas eesmärk on saavutatav</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.targetRealistic ? "Jah" : "Ei"}</strong>
                </div>
                <p className="metric-help">Võrdlus: vajalik lõige vs võimalik lõige.</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-zinc-200">
              <p className="font-medium text-zinc-50">Soovitus</p>
              <p className="mt-1 text-zinc-300">{result.note}</p>
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="compare-row">
                <span className="compare-label">Kas piirab aku võimsus?</span>
                <strong>{result.needCut <= 0 ? "—" : result.powerLimits ? "Jah, piirab" : "Ei"}</strong>
              </div>
              <div className="compare-row">
                <span className="compare-label">Kas piirab aku maht (kestus {result.hours}h)?</span>
                <strong>{result.needCut <= 0 ? "—" : result.energyLimits ? "Jah, piirab" : "Ei"}</strong>
              </div>
              <div className="compare-row">
                <span className="compare-label">Kas soovitud piir on realistlik?</span>
                <strong>{result.targetRealistic ? "Jah" : "Ei"}</strong>
              </div>
              <div className="compare-row">
                <span className="compare-label">Soovituslik aku võimsus</span>
                <strong>{result.recommendedBatteryKw.toFixed(1).replace(".", ",")} kW</strong>
              </div>
              <div className="compare-row">
                <span className="compare-label">Soovituslik aku maht</span>
                <strong>{result.recommendedBatteryKwh.toFixed(1).replace(".", ",")} kWh</strong>
              </div>
            </div>
            <UsedAssumptionsBlock {...assumptionsInfo} />
          </article>
        </div>
      </section>

      <PaywallCard
        locked={!canViewFullAnalysis(unlock)}
        title="Detailne vaade"
        description="avab 15-min tarbimisprofiili simulatsiooni, tippude analüüsi ja rahavoo tabelina selle projekti jaoks."
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
        <h3 className="text-xl font-semibold text-zinc-50">Detailne simulatsioon</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Detailne vaade lisab 15-min tarbimisprofiili põhise simulatsiooni, stsenaariumid ja selgema rahavoo.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ["CSV import", "15-min tarbimisprofiil, normaliseerimine ja kontroll."],
            ["Stsenaariumid", "Võrdle eri piire, aku suurusi ja tiputunde."],
            ["Raport", "PDF kokkuvõte (eraldi ost) ning projekti dokumentatsioon."],
            ["Soovitused", "Praktiline “mis on mõistlik aku kW/kWh” soovitus."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-sm font-semibold text-zinc-50">{t}</div>
              <div className="mt-2 text-sm text-zinc-400">{d}</div>
            </div>
          ))}
        </div>
      </PaywallCard>
    </div>
  );
}

