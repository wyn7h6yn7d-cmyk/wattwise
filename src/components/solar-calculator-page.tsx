"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { calculateComparison } from "@/lib/calculator";
import { copy, getStoredLocale, persistLocale, type Locale } from "@/lib/i18n";
import { CalculatorInput } from "@/types/calculator";

/** Igakuuva alguses: nullid / tühjad — ei salvestata brauserisse, iga refresh sama puhas lähtepunkt. */
const defaults: CalculatorInput = {
  pvPowerKw: 0,
  annualProductionKwh: 0,
  inverterPowerKw: 0,
  panelDirection: "louna",
  tiltDeg: 35,
  shadingPercent: 0,
  systemEfficiencyPercent: 92,
  hasBattery: false,
  batteryCapacityKwh: 0,
  batteryUsablePercent: 90,
  batteryPowerKw: 0,
  batteryRoundTripPercent: 92,
  batteryInvestmentEur: 0,
  batteryCostEur: 0,
  annualConsumptionKwh: 0,
  dailyConsumptionKwh: 0,
  consumptionProfile: "tool-ohtul",
  seasonalMultiplierPercent: 100,
  priceSource: "manual",
  manualSpotPrice: 0,
  nordPoolAveragePrice: 0,
  gridFeePrice: 0,
  sellBackPrice: 0,
  marginPrice: 0,
  annualPriceGrowthPercent: 3,
  discountRatePercent: 4,
  pvCostEur: 0,
  extraInstallCostEur: 0,
  supportEur: 0,
  annualMaintenanceEur: 0,
  selfConsumptionWithoutBatteryPercent: 40,
  selfConsumptionBoostWithBatteryPercent: 15,
  degradationPercent: 0.6,
  periodYears: 20,
};

type NordPoolState = { loading: boolean; message: string; source: "live" | "fallback" | "none" };

function formatNum(value: number, maxDigits: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "et-EE", {
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: maxDigits,
  }).format(value);
}

function FlagEE({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="18"
      viewBox="0 0 36 24"
      aria-hidden
    >
      <rect width="36" height="8" fill="#0072CE" rx="2" />
      <rect y="8" width="36" height="8" fill="#000" />
      <rect y="16" width="36" height="8" fill="#fff" rx="2" />
    </svg>
  );
}

function FlagGB({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="18"
      viewBox="0 0 60 40"
      aria-hidden
    >
      <rect width="60" height="40" rx="2" fill="#012169" />
      <path stroke="#fff" strokeWidth="10" d="M0,0 L60,40 M60,0 L0,40" />
      <path stroke="#C8102E" strokeWidth="6" d="M0,0 L60,40 M60,0 L0,40" />
      <path stroke="#fff" strokeWidth="14" d="M30,0 V40 M0,20 H60" />
      <path stroke="#C8102E" strokeWidth="8" d="M30,0 V40 M0,20 H60" />
    </svg>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-zinc-100">{label}</span>
      {children}
      {hint ? <span className="text-xs text-zinc-400">{hint}</span> : null}
    </label>
  );
}

export function SolarCalculatorPage() {
  const calculatorRef = useRef<HTMLElement | null>(null);
  // Vormi ei salvestata brauserisse — iga külastus/uuendus on puhas sessioon (teised ei näe sinu numbreid kunagi serveri poolelt).
  const [lang, setLang] = useState<Locale>("et");
  const [input, setInput] = useState<CalculatorInput>(defaults);
  const [errors, setErrors] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [highlightCalculator, setHighlightCalculator] = useState(false);
  const [nordPoolState, setNordPoolState] = useState<NordPoolState>({
    loading: false,
    message: "",
    source: "none",
  });
  const [result, setResult] = useState(() => calculateComparison(defaults));

  const t = copy[lang];

  useEffect(() => {
    try {
      // Eemalda vana vormi võti (varem salvestatud lokaalselt) — et ei tekiks muljet „jagatud andmetest“.
      localStorage.removeItem("energiatasuvus-v1");
    } catch {
      /* ignore */
    }
    queueMicrotask(() => setLang(getStoredLocale()));
  }, []);

  useEffect(() => {
    persistLocale(lang);
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "en" ? "en" : "et";
      document.title = t.htmlTitle;
    }
  }, [lang, t.htmlTitle]);

  const draftResult = useMemo(() => calculateComparison(input), [input]);

  const validationErrors = useMemo(() => {
    const list: string[] = [];
    if (input.annualProductionKwh <= 0) list.push(t.errProduction);
    if (input.annualConsumptionKwh <= 0) list.push(t.errConsumption);
    if (input.manualSpotPrice < 0) list.push(t.errPrice);
    if (input.hasBattery && input.batteryCapacityKwh <= 0) list.push(t.errBattery);
    return list;
  }, [input, t]);

  const fetchNordPool = async () => {
    setNordPoolState({ loading: true, message: copy[lang].nordLoading, source: "none" });
    try {
      const response = await fetch(`/api/nordpool?lang=${lang}`);
      const data = (await response.json()) as {
        source: "live" | "fallback";
        averagePrice: number;
        message: string;
      };
      setInput((prev) => ({ ...prev, nordPoolAveragePrice: data.averagePrice }));
      setNordPoolState({ loading: false, message: data.message, source: data.source });
    } catch {
      setNordPoolState({
        loading: false,
        message: copy[lang].nordFetchFailed,
        source: "fallback",
      });
    }
  };

  // Kui valitud on Nord Pool, lae börsihind automaatselt (leiab + uuendab välja); nupp "Uuenda" teeb sama uuesti.
  useEffect(() => {
    if (input.priceSource !== "nordpool") return;
    let cancelled = false;
    const run = async () => {
      setNordPoolState({ loading: true, message: copy[lang].nordLoading, source: "none" });
      try {
        const response = await fetch(`/api/nordpool?lang=${lang}`);
        const data = (await response.json()) as {
          source: "live" | "fallback";
          averagePrice: number;
          message: string;
        };
        if (cancelled) return;
        setInput((prev) => ({ ...prev, nordPoolAveragePrice: data.averagePrice }));
        setNordPoolState({ loading: false, message: data.message, source: data.source });
      } catch {
        if (cancelled) return;
        setNordPoolState({
          loading: false,
          message: copy[lang].nordFetchFailed,
          source: "fallback",
        });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [input.priceSource, lang]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;
    setIsCalculating(true);
    window.setTimeout(() => {
      setResult(draftResult);
      setIsCalculating(false);
    }, 700);
  };

  const scrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlightCalculator(true);
    window.setTimeout(() => setHighlightCalculator(false), 900);
  };

  const chartTrackPx = 176; // ~h-44 — fikseeritud kõrgus, et tulba pikslikõrgus oleks alati arvutatav
  const bestYear = result.selected.cashflowByYear.reduce(
    (max, value) => Math.max(max, Math.abs(value)),
    1,
  );

  const fmtEur = (value: number) => `${formatNum(value, 0, lang)} €`;
  const fmtKwh = (value: number) => `${formatNum(value, 0, lang)} kWh`;

  return (
    <div className="relative overflow-hidden pb-28 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(0,229,255,0.18),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(72,112,255,0.2),transparent_34%),radial-gradient(circle_at_50%_90%,rgba(0,255,153,0.14),transparent_38%)]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="sr-only">Keel / Language</span>
          <button
            type="button"
            onClick={() => setLang("et")}
            className={`flex items-center justify-center rounded-lg border p-1.5 transition-colors ${
              lang === "et"
                ? "border-cyan-400/60 bg-cyan-400/15 shadow-[0_0_16px_rgba(34,211,238,0.2)]"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
            aria-label="Eesti keel"
            aria-pressed={lang === "et"}
          >
            <FlagEE />
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`flex items-center justify-center rounded-lg border p-1.5 transition-colors ${
              lang === "en"
                ? "border-cyan-400/60 bg-cyan-400/15 shadow-[0_0_16px_rgba(34,211,238,0.2)]"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
            aria-label="English"
            aria-pressed={lang === "en"}
          >
            <FlagGB />
          </button>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <section className="glass-panel mt-4 rounded-3xl p-7 sm:p-10">
          <p className="mb-4 inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs tracking-wide text-cyan-200">
            WattWise
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">WattWise</h1>
          <p className="mt-4 max-w-2xl text-zinc-300">{t.heroIntro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn-glow" onClick={scrollToCalculator}>
              {t.startCalc}
            </button>
          </div>
        </section>

        <section
          id="kalkulaator"
          ref={calculatorRef}
          className={`glass-panel rounded-3xl p-6 transition-all duration-300 sm:p-8 ${
            highlightCalculator ? "ring-2 ring-cyan-300/70 shadow-[0_0_40px_rgba(34,211,238,0.25)]" : ""
          }`}
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold">{t.calcTitle}</h2>
            <p className="text-sm text-zinc-400">{t.calcSubtitle}</p>
          </div>

          <form className="grid gap-6" onSubmit={onSubmit}>
            <div className="card-grid">
              <article className="card">
                <h3 className="section-title">{t.sectionSystem}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t.labelPvKw}>
                    <input className="input" type="number" value={input.pvPowerKw} onChange={(e) => setInput({ ...input, pvPowerKw: Number(e.target.value) })} />
                  </Field>
                  <Field label={t.labelAnnualProd} hint={t.hintAnnualProd}>
                    <input className="input" type="number" value={input.annualProductionKwh} onChange={(e) => setInput({ ...input, annualProductionKwh: Number(e.target.value) })} />
                  </Field>
                  <Field label={t.labelConsumption}>
                    <input className="input" type="number" value={input.annualConsumptionKwh} onChange={(e) => setInput({ ...input, annualConsumptionKwh: Number(e.target.value), dailyConsumptionKwh: Number(e.target.value) / 365 })} />
                  </Field>
                  <Field label={t.labelBattery}>
                    <select className="input" value={input.hasBattery ? "jah" : "ei"} onChange={(e) => setInput({ ...input, hasBattery: e.target.value === "jah" })}>
                      <option value="jah">{t.yes}</option>
                      <option value="ei">{t.no}</option>
                    </select>
                  </Field>
                  <Field label={t.labelBatteryKwh} hint={t.hintBatteryKwh}>
                    <input className="input" type="number" value={input.batteryCapacityKwh} onChange={(e) => setInput({ ...input, batteryCapacityKwh: Number(e.target.value) })} />
                  </Field>
                </div>
              </article>

              <article className="card">
                <h3 className="section-title">{t.sectionPrice}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t.labelPriceSource}>
                    <select className="input" value={input.priceSource} onChange={(e) => setInput({ ...input, priceSource: e.target.value as CalculatorInput["priceSource"] })}>
                      <option value="manual">{t.priceManual}</option>
                      <option value="nordpool">{t.priceNordpool}</option>
                    </select>
                  </Field>
                  {input.priceSource === "manual" ? (
                    <Field label={t.labelSpot}>
                      <input className="input" type="number" step="0.001" value={input.manualSpotPrice} onChange={(e) => setInput({ ...input, manualSpotPrice: Number(e.target.value) })} />
                    </Field>
                  ) : (
                    <Field label={t.labelNordAvg}>
                      <div className="flex gap-2">
                        <input className="input flex-1" type="number" step="0.001" value={input.nordPoolAveragePrice} onChange={(e) => setInput({ ...input, nordPoolAveragePrice: Number(e.target.value) })} />
                        <button type="button" className="btn-ghost min-w-32 shrink-0" onClick={fetchNordPool}>
                          {nordPoolState.loading ? t.btnLoading : t.btnRefresh}
                        </button>
                      </div>
                    </Field>
                  )}
                  <Field label={t.labelGridFee}>
                    <input className="input" type="number" step="0.001" value={input.gridFeePrice} onChange={(e) => setInput({ ...input, gridFeePrice: Number(e.target.value) })} />
                  </Field>
                  <Field label={t.labelSellBack}>
                    <input className="input" type="number" step="0.001" value={input.sellBackPrice} onChange={(e) => setInput({ ...input, sellBackPrice: Number(e.target.value) })} />
                  </Field>
                  <Field label={t.labelMargin}>
                    <input className="input" type="number" step="0.001" value={input.marginPrice} onChange={(e) => setInput({ ...input, marginPrice: Number(e.target.value) })} />
                  </Field>
                </div>
                {nordPoolState.message ? (
                  <p className="mt-3 text-xs text-cyan-200">{nordPoolState.message}</p>
                ) : null}
              </article>

              <article className="card">
                <h3 className="section-title">{t.sectionInvest}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t.labelPvCost}>
                    <input className="input" type="number" value={input.pvCostEur} onChange={(e) => setInput({ ...input, pvCostEur: Number(e.target.value) })} />
                  </Field>
                  <Field label={t.labelBatteryCost}>
                    <input className="input" type="number" value={input.batteryCostEur} onChange={(e) => setInput({ ...input, batteryCostEur: Number(e.target.value) })} />
                  </Field>
                  <Field label={t.labelExtraInstall}>
                    <input className="input" type="number" value={input.extraInstallCostEur} onChange={(e) => setInput({ ...input, extraInstallCostEur: Number(e.target.value) })} />
                  </Field>
                  <Field label={t.labelSupport}>
                    <input className="input" type="number" value={input.supportEur} onChange={(e) => setInput({ ...input, supportEur: Number(e.target.value) })} />
                  </Field>
                  <Field label={t.labelMaintenance}>
                    <input className="input" type="number" value={input.annualMaintenanceEur} onChange={(e) => setInput({ ...input, annualMaintenanceEur: Number(e.target.value) })} />
                  </Field>
                  <Field label={t.labelPeriodYears}>
                    <select className="input" value={input.periodYears} onChange={(e) => setInput({ ...input, periodYears: Number(e.target.value) as CalculatorInput["periodYears"] })}>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                      <option value={25}>25</option>
                    </select>
                  </Field>
                </div>
                <p className="mt-3 text-xs text-zinc-400">{t.investFootnote}</p>
              </article>
            </div>

            {errors.length > 0 ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {errors.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            ) : null}
            <button type="submit" className="btn-glow w-fit">
              {isCalculating ? t.submitUpdating : t.submitIdle}
            </button>
            {isCalculating ? (
              <div
                className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/10"
                role="status"
                aria-live="polite"
              >
                <div className="loading-bar h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400" />
              </div>
            ) : null}
          </form>
        </section>

        <section className="glass-panel rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">{t.resultsTitle}</h2>
          <p className="mt-2 text-zinc-300">
            {t.effectivePrice} <strong>{formatNum(result.effectiveEnergyPrice, 3, lang)} €/kWh</strong>
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="result-card">
              <p>{t.kpiAnnualSaving}</p>
              <strong>{fmtEur(result.selected.annualSavingsEur)}</strong>
            </div>
            <div className="result-card">
              <p>{t.kpiPayback}</p>
              <strong>
                {Number.isFinite(result.paybackYears)
                  ? `${formatNum(result.paybackYears, 1, lang)} ${t.yearsSuffix}`
                  : t.paybackNa}
              </strong>
            </div>
            <div className="result-card">
              <p>{t.kpiSelfConsumption}</p>
              <strong>{formatNum(result.selected.selfConsumptionRatePercent, 1, lang)}%</strong>
            </div>
            <div className="result-card">
              <p>{t.kpiExport}</p>
              <strong>{fmtKwh(result.selected.exportedKwh)}</strong>
            </div>
            <div className="result-card">
              <p>{t.kpiTotalPeriod}</p>
              <strong>{fmtEur(result.selected.totalNetBenefitPeriodEur)}</strong>
            </div>
            <div className="result-card">
              <p>{t.kpiBatteryValue}</p>
              <strong>{fmtEur(result.batteryAddedValuePeriodEur)}</strong>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="card">
              <h3 className="section-title">{t.compareTitle}</h3>
              <div className="grid gap-3 text-sm">
                <div className="compare-row">
                  <span className="compare-label">{t.compareNoBattery}</span>
                  <strong>{fmtEur(result.withoutBattery.annualNetBenefitEur)}</strong>
                </div>
                <div className="compare-row">
                  <span className="compare-label">{t.compareWithBattery}</span>
                  <strong>{fmtEur(result.withBattery.annualNetBenefitEur)}</strong>
                </div>
                <div className="compare-row">
                  <span className="compare-label">{t.compareGridReduction}</span>
                  <strong>{formatNum(result.withBattery.gridDependenceReductionPercent, 1, lang)}%</strong>
                </div>
              </div>
            </article>

            <article className="card">
              <h3 className="section-title">{t.verdictTitle}</h3>
              <p className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 p-4 text-zinc-100">
                {t.interpret[result.interpretationKind]}{" "}
                {t.verdictCo2Suffix}{" "}
                <strong>{formatNum(result.selected.co2ReductionKgYear, 0, lang)} kg</strong>.
              </p>
            </article>
          </div>

          <article className="card mt-6 overflow-hidden">
            <h3 className="section-title">{t.chartTitle}</h3>
            {result.selected.cashflowByYear.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-400">{t.chartEmpty}</p>
            ) : (
              <>
                <p className="mt-2 px-0 text-xs text-zinc-500 md:hidden">{t.chartScrollHint}</p>
                <div className="relative mt-3 w-full">
                  <div className="-mx-1 overflow-x-auto overflow-y-visible px-1 pb-2 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:px-0 md:overflow-visible">
                    <div className="flex min-h-[13.5rem] min-w-max items-end gap-1.5 pb-1 sm:gap-2 md:min-h-0 md:min-w-0 md:w-full md:justify-between md:gap-2">
                      {result.selected.cashflowByYear.map((value, index) => {
                        const abs = Math.abs(value);
                        const barPx = Math.max(Math.round((abs / bestYear) * chartTrackPx), 6);
                        return (
                        <div
                          key={`${value}-${index}`}
                          className="group relative flex w-7 shrink-0 flex-col items-stretch gap-1 md:min-w-0 md:flex-1"
                        >
                          <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-cyan-300/30 bg-zinc-950/95 px-2 py-1 text-[11px] font-medium text-cyan-200 opacity-0 shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-opacity duration-150 group-hover:opacity-100 sm:block">
                            {formatNum(value, 0, lang)} €
                          </div>
                          <div
                            className="box-border flex w-full flex-col justify-end rounded-md bg-white/[0.06] px-0.5 pt-1"
                            style={{ height: chartTrackPx }}
                          >
                            <div
                              className="w-full shrink-0 rounded bg-gradient-to-t from-cyan-500/80 to-blue-400/90"
                              style={{ height: barPx }}
                              aria-label={`${t.yearAria} ${index + 1}`}
                              title={`${formatNum(value, 0, lang)} €`}
                            />
                          </div>
                          <span className="text-center text-[10px] leading-none text-zinc-400 sm:text-[11px]">
                            {index + 1}
                          </span>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </article>

          <article className="card mt-6">
            <h3 className="section-title">{t.energyFlowsTitle}</h3>
            <div className="mt-3 grid gap-2 text-sm">
              <div>
                <p className="mb-1 text-zinc-300">{t.energySelf}</p>
                <div className="h-3 rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{ width: `${Math.min(result.selected.selfConsumptionRatePercent, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="mb-1 text-zinc-300">{t.energyExport}</p>
                <div className="h-3 rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-violet-400"
                    style={{
                      width: `${Math.min(
                        (result.selected.exportedKwh / Math.max(result.selected.annualProductionKwh, 1)) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </article>

          <article className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
            <h3 className="mb-2 font-medium text-zinc-100">{t.assumptionsTitle}</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t.assumption1}</li>
              <li>{t.assumption2}</li>
              <li>{t.assumption3}</li>
              <li>{t.assumption4}</li>
            </ul>
          </article>
        </section>

        <section className="glass-panel rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">{t.contactTitle}</h2>
          <p className="mt-2 text-zinc-300">
            {t.contactBody}{" "}
            <a className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4" href="mailto:kennethalto95@gmail.com">
              kennethalto95@gmail.com
            </a>
          </p>
        </section>

        <section className="glass-panel rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">{t.faqTitle}</h2>
          <div className="mt-4 grid gap-3">
            {t.faq.map(({ q, a }) => (
              <details key={q} className="faq-details rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <summary className="faq-summary font-medium text-zinc-100">{q}</summary>
                <p className="mt-2 pl-8 text-sm leading-relaxed text-zinc-300 md:text-base">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
