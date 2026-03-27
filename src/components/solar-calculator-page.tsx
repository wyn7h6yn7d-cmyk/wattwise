"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { calculateComparison } from "@/lib/calculator";
import { CalculatorInput } from "@/types/calculator";

const STORAGE_KEY = "energiatasuvus-v1";

const defaults: CalculatorInput = {
  pvPowerKw: 15,
  annualProductionKwh: 13500,
  inverterPowerKw: 12,
  panelDirection: "louna",
  tiltDeg: 35,
  shadingPercent: 8,
  systemEfficiencyPercent: 92,
  hasBattery: true,
  batteryCapacityKwh: 12,
  batteryUsablePercent: 90,
  batteryPowerKw: 6,
  batteryRoundTripPercent: 92,
  batteryInvestmentEur: 7200,
  batteryCostEur: 7200,
  annualConsumptionKwh: 12000,
  dailyConsumptionKwh: 32.9,
  consumptionProfile: "tool-ohtul",
  seasonalMultiplierPercent: 100,
  priceSource: "manual",
  manualSpotPrice: 0.11,
  nordPoolAveragePrice: 0.098,
  gridFeePrice: 0.048,
  sellBackPrice: 0.065,
  marginPrice: 0.012,
  annualPriceGrowthPercent: 3,
  discountRatePercent: 4,
  pvCostEur: 14500,
  extraInstallCostEur: 1700,
  supportEur: 1200,
  annualMaintenanceEur: 220,
  selfConsumptionWithoutBatteryPercent: 42,
  selfConsumptionBoostWithBatteryPercent: 18,
  degradationPercent: 0.6,
  periodYears: 20,
};

type NordPoolState = { loading: boolean; message: string; source: "live" | "fallback" | "none" };

const formatNum = (value: number, maxDigits = 0): string =>
  new Intl.NumberFormat("et-EE", {
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: maxDigits,
  }).format(value);

const formatEur = (value: number): string => `${formatNum(value, 0)} €`;
const formatKwh = (value: number): string => `${formatNum(value, 0)} kWh`;

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
  const [input, setInput] = useState<CalculatorInput>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as Partial<CalculatorInput>;
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [highlightCalculator, setHighlightCalculator] = useState(false);
  const [nordPoolState, setNordPoolState] = useState<NordPoolState>({
    loading: false,
    message: "",
    source: "none",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  }, [input]);

  const draftResult = useMemo(() => calculateComparison(input), [input]);
  const [result, setResult] = useState(() => calculateComparison(input));

  const validationErrors = useMemo(() => {
    const list: string[] = [];
    if (input.annualProductionKwh <= 0) list.push("Aastane tootmine peab olema suurem kui 0.");
    if (input.annualConsumptionKwh <= 0) list.push("Aastane tarbimine peab olema suurem kui 0.");
    if (input.manualSpotPrice < 0) list.push("Elektri hind ei tohi olla negatiivne.");
    if (input.hasBattery && input.batteryCapacityKwh <= 0) list.push("Akuga stsenaariumis lisa aku mahtuvus.");
    return list;
  }, [input]);

  const fetchNordPool = async () => {
    setNordPoolState({ loading: true, message: "Laen Nord Pool hinda...", source: "none" });
    try {
      const response = await fetch("/api/nordpool");
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
        message: "Börsihinna laadimine ebaõnnestus. Kasuta käsitsi sisestust.",
        source: "fallback",
      });
    }
  };

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

  const bestYear = result.selected.cashflowByYear.reduce(
    (max, value) => Math.max(max, Math.abs(value)),
    1,
  );

  return (
    <div className="relative overflow-hidden pb-28 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(0,229,255,0.18),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(72,112,255,0.2),transparent_34%),radial-gradient(circle_at_50%_90%,rgba(0,255,153,0.14),transparent_38%)]" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <section className="glass-panel mt-4 rounded-3xl p-7 sm:p-10">
          <p className="mb-4 inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs tracking-wide text-cyan-200">
            WattWise
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">WattWise</h1>
          <p className="mt-4 max-w-2xl text-zinc-300">
            Sisesta oma süsteemi andmed, võrdle akuga ja akuta stsenaariume ning saa selge majanduslik
            ülevaade koos praktilise soovitusega.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn-glow" onClick={scrollToCalculator}>
              Alusta arvutust
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
            <h2 className="text-2xl font-semibold">Kalkulaator</h2>
            <p className="text-sm text-zinc-400">Lihtsustatud vaade: ainult kõige olulisemad sisendid.</p>
          </div>

          <form className="grid gap-6" onSubmit={onSubmit}>
            <div className="card-grid">
              <article className="card">
                <h3 className="section-title">1) Süsteem ja tarbimine</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Päikesepargi võimsus (kW)">
                    <input className="input" type="number" value={input.pvPowerKw} onChange={(e) => setInput({ ...input, pvPowerKw: Number(e.target.value) })} />
                  </Field>
                  <Field label="Aastane tootmine (kWh)" hint="Kui täpset toodangut ei tea, kasuta hinnangut 850-1000 kWh per kW aastas.">
                    <input className="input" type="number" value={input.annualProductionKwh} onChange={(e) => setInput({ ...input, annualProductionKwh: Number(e.target.value) })} />
                  </Field>
                  <Field label="Aastane elektritarbimine (kWh)">
                    <input className="input" type="number" value={input.annualConsumptionKwh} onChange={(e) => setInput({ ...input, annualConsumptionKwh: Number(e.target.value), dailyConsumptionKwh: Number(e.target.value) / 365 })} />
                  </Field>
                  <Field label="Päevane tarbimine (kWh)">
                    <input className="input" type="number" value={formatNum(input.dailyConsumptionKwh, 1)} readOnly />
                  </Field>
                  <Field label="Aku olemasolu">
                    <select className="input" value={input.hasBattery ? "jah" : "ei"} onChange={(e) => setInput({ ...input, hasBattery: e.target.value === "jah" })}>
                      <option value="jah">Jah</option>
                      <option value="ei">Ei</option>
                    </select>
                  </Field>
                  <Field label="Aku mahtuvus (kWh)" hint="Täida ainult siis, kui aku on olemas.">
                    <input className="input" type="number" value={input.batteryCapacityKwh} onChange={(e) => setInput({ ...input, batteryCapacityKwh: Number(e.target.value) })} />
                  </Field>
                </div>
              </article>

              <article className="card">
                <h3 className="section-title">2) Elektrihind</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Elektrihinna allikas">
                    <select className="input" value={input.priceSource} onChange={(e) => setInput({ ...input, priceSource: e.target.value as CalculatorInput["priceSource"] })}>
                      <option value="manual">Käsitsi sisestus</option>
                      <option value="nordpool">Nord Pool keskmine</option>
                    </select>
                  </Field>
                  {input.priceSource === "manual" ? (
                    <Field label="Elektri börsihind (€/kWh)">
                      <input className="input" type="number" step="0.001" value={input.manualSpotPrice} onChange={(e) => setInput({ ...input, manualSpotPrice: Number(e.target.value) })} />
                    </Field>
                  ) : (
                    <Field label="Nord Pool keskmine (€/kWh)">
                      <div className="flex gap-2">
                        <input className="input flex-1" type="number" step="0.001" value={input.nordPoolAveragePrice} onChange={(e) => setInput({ ...input, nordPoolAveragePrice: Number(e.target.value) })} />
                        <button type="button" className="btn-ghost min-w-32" onClick={fetchNordPool}>
                          {nordPoolState.loading ? "Laen..." : "Uuenda"}
                        </button>
                      </div>
                    </Field>
                  )}
                  <Field label="Võrgutasu ja muud tasud (€/kWh)">
                    <input className="input" type="number" step="0.001" value={input.gridFeePrice} onChange={(e) => setInput({ ...input, gridFeePrice: Number(e.target.value) })} />
                  </Field>
                  <Field label="Müügi hind võrku (€/kWh)">
                    <input className="input" type="number" step="0.001" value={input.sellBackPrice} onChange={(e) => setInput({ ...input, sellBackPrice: Number(e.target.value) })} />
                  </Field>
                  <Field label="Margin / teenustasu (€/kWh)">
                    <input className="input" type="number" step="0.001" value={input.marginPrice} onChange={(e) => setInput({ ...input, marginPrice: Number(e.target.value) })} />
                  </Field>
                </div>
                {nordPoolState.message ? (
                  <p className="mt-3 text-xs text-cyan-200">{nordPoolState.message}</p>
                ) : null}
              </article>

              <article className="card">
                <h3 className="section-title">3) Investeering</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="PV süsteemi maksumus (€)">
                    <input className="input" type="number" value={input.pvCostEur} onChange={(e) => setInput({ ...input, pvCostEur: Number(e.target.value) })} />
                  </Field>
                  <Field label="Aku maksumus (€)">
                    <input className="input" type="number" value={input.batteryCostEur} onChange={(e) => setInput({ ...input, batteryCostEur: Number(e.target.value) })} />
                  </Field>
                  <Field label="Muud paigalduskulud (€)">
                    <input className="input" type="number" value={input.extraInstallCostEur} onChange={(e) => setInput({ ...input, extraInstallCostEur: Number(e.target.value) })} />
                  </Field>
                  <Field label="Toetus (€)">
                    <input className="input" type="number" value={input.supportEur} onChange={(e) => setInput({ ...input, supportEur: Number(e.target.value) })} />
                  </Field>
                  <Field label="Hoolduskulu aastas (€)">
                    <input className="input" type="number" value={input.annualMaintenanceEur} onChange={(e) => setInput({ ...input, annualMaintenanceEur: Number(e.target.value) })} />
                  </Field>
                  <Field label="Arvutusperiood (aastat)">
                    <select className="input" value={input.periodYears} onChange={(e) => setInput({ ...input, periodYears: Number(e.target.value) as CalculatorInput["periodYears"] })}>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                      <option value={25}>25</option>
                    </select>
                  </Field>
                </div>
                <p className="mt-3 text-xs text-zinc-400">
                  Täpsemad tehnilised eeldused (suund, varjutus, kasutegur, degradatsioon, hinnakasv) on
                  hetkel seadistatud konservatiivsete vaikimisi väärtustega.
                </p>
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
              {isCalculating ? "Arvutan..." : "Uuenda tulemused"}
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
          <h2 className="text-2xl font-semibold">Tulemused</h2>
          <p className="mt-2 text-zinc-300">
            Efektiivne elektri hind arvutuses: <strong>{formatNum(result.effectiveEnergyPrice, 3)} €/kWh</strong>
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="result-card">
              <p>Hinnanguline aastane sääst</p>
              <strong>{formatEur(result.selected.annualSavingsEur)}</strong>
            </div>
            <div className="result-card">
              <p>Lihtne tasuvusaeg</p>
              <strong>{Number.isFinite(result.paybackYears) ? `${formatNum(result.paybackYears, 1)} aastat` : "Ei arvutatav"}</strong>
            </div>
            <div className="result-card">
              <p>Omakasutus</p>
              <strong>{formatNum(result.selected.selfConsumptionRatePercent, 1)}%</strong>
            </div>
            <div className="result-card">
              <p>Võrku müük</p>
              <strong>{formatKwh(result.selected.exportedKwh)}</strong>
            </div>
            <div className="result-card">
              <p>Kogutulu perioodis</p>
              <strong>{formatEur(result.selected.totalNetBenefitPeriodEur)}</strong>
            </div>
            <div className="result-card">
              <p>Aku lisaväärtus</p>
              <strong>{formatEur(result.batteryAddedValuePeriodEur)}</strong>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="card">
              <h3 className="section-title">Ilma akuta vs akuga</h3>
              <div className="grid gap-3 text-sm">
                <div className="compare-row">
                  <span>Ilma akuta aastane netokasu</span>
                  <strong>{formatEur(result.withoutBattery.annualNetBenefitEur)}</strong>
                </div>
                <div className="compare-row">
                  <span>Akuga aastane netokasu</span>
                  <strong>{formatEur(result.withBattery.annualNetBenefitEur)}</strong>
                </div>
                <div className="compare-row">
                  <span>Võrgu sõltuvuse vähenemine (akuga)</span>
                  <strong>{formatNum(result.withBattery.gridDependenceReductionPercent, 1)}%</strong>
                </div>
              </div>
            </article>

            <article className="card">
              <h3 className="section-title">Kas see investeering tundub mõistlik?</h3>
              <p className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 p-4 text-zinc-100">
                {result.interpretation}. Sinu valitud stsenaariumis on hinnanguline aastane CO2 vähenemine{" "}
                <strong>{formatNum(result.selected.co2ReductionKgYear, 0)} kg</strong>.
              </p>
            </article>
          </div>

          <article className="card mt-6">
            <h3 className="section-title">Rahavoo prognoos aastate lõikes</h3>
            {result.selected.cashflowByYear.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-400">Rahavoogu ei saanud arvutada. Kontrolli sisestatud andmeid.</p>
            ) : (
              <div className="mt-4 flex h-52 items-end gap-2">
                {result.selected.cashflowByYear.map((value, index) => (
                  <div key={`${value}-${index}`} className="group relative flex flex-1 flex-col items-center gap-1">
                    <div className="pointer-events-none absolute -top-8 rounded-md border border-cyan-300/30 bg-zinc-950/90 px-2 py-1 text-[11px] font-medium text-cyan-200 opacity-0 shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-opacity duration-150 group-hover:opacity-100">
                      {formatNum(value, 0)} €
                    </div>
                    <div className="flex h-44 w-full items-end rounded-md bg-white/[0.03] p-1">
                      <div
                        className="w-full rounded bg-gradient-to-t from-cyan-500/80 to-blue-400/90"
                        style={{ height: `${Math.max((Math.abs(value) / bestYear) * 100, 6)}%` }}
                        aria-label={`Aasta ${index + 1} rahavoog`}
                        title={`${formatNum(value, 0)} €`}
                      />
                    </div>
                    <span className="text-[11px] text-zinc-400">{index + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="card mt-6">
            <h3 className="section-title">Energiavood</h3>
            <div className="mt-3 grid gap-2 text-sm">
              <div>
                <p className="mb-1 text-zinc-300">Omakasutatud energia</p>
                <div className="h-3 rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{ width: `${Math.min(result.selected.selfConsumptionRatePercent, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="mb-1 text-zinc-300">Võrku müüdud energia</p>
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
            <h3 className="mb-2 font-medium text-zinc-100">Arvutuse alused</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Tootmist korrigeeritakse suuna, varjutuse, kasuteguri ja hooajalisuse teguriga.</li>
              <li>Akuga stsenaariumis kasvab omakasutus vastavalt aku kasutatavale mahule ja eelduslikule profiilile.</li>
              <li>Rahavoog arvestab elektrihinna kasvu, süsteemi degradatsiooni ja diskontomäära.</li>
              <li>Nord Pool reaalhindade tõrke korral kasutatakse varuandmeid ning saad alati käsitsi hinda muuta.</li>
            </ul>
          </article>
        </section>

        <section className="glass-panel rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">Küsimused?</h2>
          <p className="mt-2 text-zinc-300">
            Küsimuste korral pöördu:{" "}
            <a className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4" href="mailto:kennethalto95@gmail.com">
              kennethalto95@gmail.com
            </a>
          </p>
        </section>

        <section className="glass-panel rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">KKK</h2>
          <div className="mt-4 grid gap-3">
            {[
              ["Kuidas tasuvusaega arvutatakse?", "Tasuvusaeg leitakse investeeringu ja aastase netokasu suhtena, arvestades hoolduskulu."],
              ["Kas aku tasub ennast ära?", "Aku lisab väärtust peamiselt siis, kui õhtune tarbimine on suur ja võrku müügi hind on madalam kui ostuhind."],
              ["Mis vahe on omatarbel ja võrku müügil?", "Omakasutus vähendab ostetavat elektrit, võrku müük annab lisatulu ülejääva toodangu arvelt."],
              ["Kas börsihinnaga arvestamine on täpne?", "See on hinnanguline. Kalkulaator kasutab keskmisi hindu ja fallback-andmeid, mitte tunnipõhist simulatsiooni."],
              ["Kas see kalkulaator sobib ettevõttele või eramule?", "Jah. Tarbimisprofiili valik võimaldab modelleerida nii eramuid kui ka päevase koormusega ettevõtteid."],
            ].map(([q, a]) => (
              <details key={q} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <summary className="cursor-pointer font-medium">{q}</summary>
                <p className="mt-2 text-zinc-300">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

    </div>
  );
}
