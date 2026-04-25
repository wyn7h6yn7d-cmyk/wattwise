"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { calculateComparison } from "@/lib/calculator";
import { CalculatorInput } from "@/types/calculator";
import { canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";
import { FEATURES } from "@/lib/features";

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

function formatNum(value: number, maxDigits: number): string {
  return new Intl.NumberFormat("et-EE", {
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: maxDigits,
  }).format(value);
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
    <label className="field-label">
      <span className="field-label-text">{label}</span>
      {children}
      {hint ? (
        <span className="field-hint">{hint}</span>
      ) : (
        // Hoia väljade kõrgus ühtlane (mobiil/desktop joondus)
        <span className="field-hint opacity-0">.</span>
      )}
    </label>
  );
}

function numValue(value: number): string | number {
  return value === 0 ? "" : value;
}

function toNumber(value: string): number {
  if (value.trim() === "") return 0;
  const normalized = value.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function SolarCalculatorPage() {
  const calculatorRef = useRef<HTMLElement | null>(null);
  // Vormi ei salvestata brauserisse — iga külastus/uuendus on puhas sessioon (teised ei näe sinu numbreid kunagi serveri poolelt).
  const [input, setInput] = useState<CalculatorInput>(defaults);
  // Mõnede väljade puhul (nt 0,05) vajame tekstipõhist sisestust, sest vahepealne "0," ei ole number.
  const [priceText, setPriceText] = useState(() => ({
    manualSpotPrice: "",
    nordPoolAveragePrice: "",
    gridFeePrice: "",
    sellBackPrice: "",
    marginPrice: "",
  }));
  const [errors, setErrors] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [highlightCalculator, setHighlightCalculator] = useState(false);
  const [nordPoolState, setNordPoolState] = useState<NordPoolState>({
    loading: false,
    message: "",
    source: "none",
  });
  const [result, setResult] = useState(() => calculateComparison(defaults));

  const { projectId, unlock, message, setMessage, purchaseBusy, startCheckout, checkPaymentStatus } =
    useProjectUnlock();

  useEffect(() => {
    try {
      // Eemalda vana vormi võti (varem salvestatud lokaalselt) — et ei tekiks muljet „jagatud andmetest“.
      localStorage.removeItem("energiatasuvus-v1");
    } catch {
      /* ignore */
    }
  }, []);

  const draftResult = useMemo(() => calculateComparison(input), [input]);

  const setPriceField = (key: keyof typeof priceText, raw: string) => {
    setPriceText((prev) => ({ ...prev, [key]: raw }));
    // Uuenda numbriväärtust ainult siis, kui tekst on "valmis" number (lubab koma või punkti).
    const trimmed = raw.trim();
    const isCompleteNumber = /^-?\d+(?:[.,]\d+)?$/.test(trimmed);
    if (!isCompleteNumber) return;
    const n = toNumber(trimmed);
    setInput((prev) => ({ ...prev, [key]: n } as CalculatorInput));
  };

  useEffect(() => {
    // Hoia tekstiväljad sünkroonis, kui väärtus muutub programmiliselt (nt Nord Pool "Uuenda").
    setPriceText({
      manualSpotPrice: input.manualSpotPrice === 0 ? "" : String(input.manualSpotPrice).replace(".", ","),
      nordPoolAveragePrice: input.nordPoolAveragePrice === 0 ? "" : String(input.nordPoolAveragePrice).replace(".", ","),
      gridFeePrice: input.gridFeePrice === 0 ? "" : String(input.gridFeePrice).replace(".", ","),
      sellBackPrice: input.sellBackPrice === 0 ? "" : String(input.sellBackPrice).replace(".", ","),
      marginPrice: input.marginPrice === 0 ? "" : String(input.marginPrice).replace(".", ","),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.manualSpotPrice, input.nordPoolAveragePrice, input.gridFeePrice, input.sellBackPrice, input.marginPrice]);

  const validationErrors = useMemo(() => {
    const list: string[] = [];
    if (input.annualProductionKwh <= 0) list.push("Aastane tootmine peab olema suurem kui 0.");
    if (input.annualConsumptionKwh <= 0) list.push("Aastane tarbimine peab olema suurem kui 0.");
    if (input.manualSpotPrice < 0) list.push("Elektri hind ei tohi olla negatiivne.");
    if (input.hasBattery && input.batteryCapacityKwh <= 0)
      list.push("Akuga stsenaariumis lisa aku mahtuvus.");
    return list;
  }, [input]);

  const fetchNordPool = async () => {
    setNordPoolState({ loading: true, message: "Laen Nord Pool hinda...", source: "none" });
    try {
      const response = await fetch(`/api/nordpool?lang=et`);
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

  // Kui valitud on Nord Pool, lae börsihind automaatselt (leiab + uuendab välja); nupp "Uuenda" teeb sama uuesti.
  useEffect(() => {
    if (input.priceSource !== "nordpool") return;
    let cancelled = false;
    const run = async () => {
      setNordPoolState({ loading: true, message: "Laen Nord Pool hinda...", source: "none" });
      try {
        const response = await fetch(`/api/nordpool?lang=et`);
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
          message: "Börsihinna laadimine ebaõnnestus. Kasuta käsitsi sisestust.",
          source: "fallback",
        });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [input.priceSource]);

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
            calculatorType: "paikesejaam",
            inputs: [
              {
                group: "Süsteem",
                items: [
                  { label: "Päikesepargi võimsus", value: `${input.pvPowerKw || "—"} kW` },
                  { label: "Aastane tootmine", value: `${input.annualProductionKwh || "—"} kWh` },
                  { label: "Aku", value: input.hasBattery ? "Jah" : "Ei" },
                  { label: "Aku maht", value: input.hasBattery ? `${input.batteryCapacityKwh || "—"} kWh` : "—" },
                ],
              },
              {
                group: "Tarbimine ja hind",
                items: [
                  { label: "Aastane tarbimine", value: `${input.annualConsumptionKwh || "—"} kWh` },
                  { label: "Efektiivne elektrihind", value: `${formatNum(result.effectiveEnergyPrice, 3)} €/kWh` },
                  { label: "Võrku müügi hind", value: `${input.sellBackPrice || "—"} €/kWh` },
                ],
              },
              {
                group: "Investeering",
                items: [
                  { label: "PV maksumus", value: `${formatNum(input.pvCostEur, 0)} €` },
                  { label: "Aku maksumus", value: `${formatNum(input.batteryCostEur, 0)} €` },
                  { label: "Toetus", value: `${formatNum(input.supportEur, 0)} €` },
                  { label: "Periood", value: `${input.periodYears} a` },
                ],
              },
            ],
            assumptions: [
              { label: "Hinnakasv", value: `${formatNum(input.annualPriceGrowthPercent, 1)}% / a` },
              { label: "Diskontomäär", value: `${formatNum(input.discountRatePercent, 1)}%` },
              { label: "Degradatsioon", value: `${formatNum(input.degradationPercent, 1)}% / a` },
            ],
            metrics: [
              { label: "Hinnanguline aastane sääst", value: `${formatNum(result.selected.annualSavingsEur, 0)} €` },
              {
                label: "Lihtne tasuvusaeg",
                value: Number.isFinite(result.paybackYears) ? `${result.paybackYears.toFixed(1)} a` : "—",
              },
              { label: "Omakasutus", value: `${formatNum(result.selected.selfConsumptionRatePercent, 1)}%` },
              { label: "Võrku müük", value: `${formatNum(result.selected.exportedKwh, 0)} kWh` },
              { label: "Kogutulu perioodis", value: `${formatNum(result.selected.totalNetBenefitPeriodEur, 0)} €` },
              { label: "Aku lisaväärtus", value: `${formatNum(result.batteryAddedValuePeriodEur, 0)} €` },
              { label: "CO2 vähenemine", value: `${formatNum(result.selected.co2ReductionKgYear, 0)} kg/a` },
              { label: "Tasuvuse hinnang", value: String(result.interpretationKind) },
            ],
            charts: {
              cashflowByYear: result.selected.cashflowByYear,
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
      a.download = "energiakalkulaator-paikesejaama-analuus.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("PDF allalaadimine ebaõnnestus.");
    }
  };

  const chartTrackPx = 176; // ~h-44 — fikseeritud kõrgus, et tulba pikslikõrgus oleks alati arvutatav
  const bestYear = result.selected.cashflowByYear.reduce(
    (max, value) => Math.max(max, Math.abs(value)),
    1,
  );

  const fmtEur = (value: number) => `${formatNum(value, 0)} €`;
  const fmtKwh = (value: number) => `${formatNum(value, 0)} kWh`;
  const isEmptyInputs =
    input.annualConsumptionKwh <= 0 || (input.annualProductionKwh <= 0 && input.pvPowerKw <= 0);

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-50">Päikesejaama tasuvus</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Sisesta põhiandmed ja saa selge ülevaade säästust, omakasutusest ja rahavoost.
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={scrollToCalculator}>
          Kerige sisendite juurde
        </button>
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">
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

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section
          id="kalkulaator"
          ref={calculatorRef}
          className={`rounded-3xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 sm:p-8 ${
            highlightCalculator ? "ring-2 ring-cyan-300/70 shadow-[0_0_40px_rgba(34,211,238,0.25)]" : ""
          }`}
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h3 className="text-xl font-semibold text-zinc-50">Sisendid</h3>
            <p className="text-sm text-zinc-400">Lihtsustatud vaade: ainult kõige olulisemad sisendid.</p>
          </div>

          <form className="grid gap-6" onSubmit={onSubmit}>
            <div className="card-grid">
              <article className="card">
                <h4 className="section-title">1) Süsteem ja tarbimine</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Päikesepargi võimsus (kW)">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={numValue(input.pvPowerKw)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, pvPowerKw: toNumber(e.target.value) })}
                      placeholder="nt 12"
                    />
                  </Field>
                  <Field
                    label="Aastane tootmine (kWh)"
                    hint="Kui täpset toodangut ei tea, kasuta hinnangut 850–1000 kWh per kW aastas."
                  >
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      value={numValue(input.annualProductionKwh)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, annualProductionKwh: toNumber(e.target.value) })}
                      placeholder="nt 11000"
                    />
                  </Field>
                  <Field label="Aastane elektritarbimine (kWh)">
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      value={numValue(input.annualConsumptionKwh)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => {
                        const v = toNumber(e.target.value);
                        setInput({ ...input, annualConsumptionKwh: v, dailyConsumptionKwh: v / 365 });
                      }}
                      placeholder="nt 9000"
                    />
                  </Field>
                  <Field label="Aku olemasolu">
                    <select className="input" value={input.hasBattery ? "jah" : "ei"} onChange={(e) => setInput({ ...input, hasBattery: e.target.value === "jah" })}>
                      <option value="jah">Jah</option>
                      <option value="ei">Ei</option>
                    </select>
                  </Field>
                  <Field label="Aku mahtuvus (kWh)" hint="Täida ainult siis, kui aku on olemas.">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={numValue(input.batteryCapacityKwh)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, batteryCapacityKwh: toNumber(e.target.value) })}
                      placeholder="nt 10"
                    />
                  </Field>
                </div>
              </article>

              <article className="card">
                <h4 className="section-title">2) Elektrihind</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Elektrihinna allikas">
                    <select className="input" value={input.priceSource} onChange={(e) => setInput({ ...input, priceSource: e.target.value as CalculatorInput["priceSource"] })}>
                      <option value="manual">Käsitsi sisestus</option>
                      <option value="nordpool">Nord Pool keskmine</option>
                    </select>
                  </Field>
                  {input.priceSource === "manual" ? (
                    <Field label="Elektri börsihind (€/kWh)">
                      <input
                        className="input"
                        type="text"
                        inputMode="decimal"
                        value={priceText.manualSpotPrice}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setPriceField("manualSpotPrice", e.target.value)}
                        onBlur={() =>
                          setInput((prev) => ({ ...prev, manualSpotPrice: toNumber(priceText.manualSpotPrice) }))
                        }
                        placeholder="nt 0,12"
                      />
                    </Field>
                  ) : (
                    <Field label="Nord Pool keskmine (€/kWh)">
                      <div className="flex gap-2">
                        <input
                          className="input flex-1"
                          type="text"
                          inputMode="decimal"
                          value={priceText.nordPoolAveragePrice}
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) => setPriceField("nordPoolAveragePrice", e.target.value)}
                          onBlur={() =>
                            setInput((prev) => ({
                              ...prev,
                              nordPoolAveragePrice: toNumber(priceText.nordPoolAveragePrice),
                            }))
                          }
                          placeholder="nt 0,10"
                        />
                        <button
                          type="button"
                          className="btn-ghost w-full shrink-0 sm:w-auto sm:min-w-32"
                          onClick={fetchNordPool}
                        >
                          {nordPoolState.loading ? "Laen..." : "Uuenda"}
                        </button>
                      </div>
                    </Field>
                  )}
                  <Field label="Võrgutasu ja muud tasud (€/kWh)">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={priceText.gridFeePrice}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setPriceField("gridFeePrice", e.target.value)}
                      onBlur={() => setInput((prev) => ({ ...prev, gridFeePrice: toNumber(priceText.gridFeePrice) }))}
                      placeholder="nt 0,05"
                    />
                  </Field>
                  <Field label="Müügi hind võrku (€/kWh)">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={priceText.sellBackPrice}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setPriceField("sellBackPrice", e.target.value)}
                      onBlur={() =>
                        setInput((prev) => ({ ...prev, sellBackPrice: toNumber(priceText.sellBackPrice) }))
                      }
                      placeholder="nt 0,06"
                    />
                  </Field>
                  <Field label="Margin / teenustasu (€/kWh)">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={priceText.marginPrice}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setPriceField("marginPrice", e.target.value)}
                      onBlur={() => setInput((prev) => ({ ...prev, marginPrice: toNumber(priceText.marginPrice) }))}
                      placeholder="nt 0,01"
                    />
                  </Field>
                </div>
                {nordPoolState.message ? (
                  <p className="mt-3 text-xs text-cyan-200">{nordPoolState.message}</p>
                ) : null}
                <p className="mt-2 text-xs text-zinc-400">
                  Efektiivne ostuhind = börsihind + võrgutasu + margin. Praegu:{" "}
                  <span className="font-medium text-zinc-200">{formatNum(draftResult.effectiveEnergyPrice, 3)} €/kWh</span>
                </p>
              </article>

              <article className="card">
                <h4 className="section-title">3) Investeering</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="PV süsteemi maksumus (€)">
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      value={numValue(input.pvCostEur)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, pvCostEur: toNumber(e.target.value) })}
                      placeholder="nt 12000"
                    />
                  </Field>
                  <Field label="Aku maksumus (€)">
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      value={numValue(input.batteryCostEur)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, batteryCostEur: toNumber(e.target.value) })}
                      placeholder="nt 6000"
                    />
                  </Field>
                  <Field label="Muud paigalduskulud (€)">
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      value={numValue(input.extraInstallCostEur)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, extraInstallCostEur: toNumber(e.target.value) })}
                      placeholder="nt 1500"
                    />
                  </Field>
                  <Field label="Toetus (€)">
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      value={numValue(input.supportEur)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, supportEur: toNumber(e.target.value) })}
                      placeholder="nt 1000"
                    />
                  </Field>
                  <Field label="Hoolduskulu aastas (€)">
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      value={numValue(input.annualMaintenanceEur)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, annualMaintenanceEur: toNumber(e.target.value) })}
                      placeholder="nt 200"
                    />
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
                  Täpsemad tehnilised eeldused (suund, varjutus, kasutegur, degradatsioon, hinnakasv)
                  on seadistatud konservatiivsete vaikimisi väärtustega.
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

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 lg:mt-0">
          <h3 className="text-2xl font-semibold text-zinc-50">Tulemused</h3>
          <p className="mt-2 text-zinc-300">
            Efektiivne elektri hind arvutuses:{" "}
            <strong>{formatNum(result.effectiveEnergyPrice, 3)} €/kWh</strong>
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="metric-card metric-card-primary metric-card-accent-emerald">
              <p className="metric-label">Olulisim: hinnanguline aastane sääst</p>
              <div className="metric-main">
                <strong className="metric-value">
                  {Math.round(result.selected.annualSavingsEur).toLocaleString("et-EE")}
                </strong>
                <span className="metric-unit">EUR/a</span>
              </div>
              <p className="metric-help">Aastane netosääst omatarbe, müügi ja tasude arvestusega.</p>
            </div>
            <div className="metric-card metric-card-accent-teal">
              <p className="metric-label">Lihtne tasuvusaeg</p>
              <div className="metric-main">
                <strong className="metric-value">
                  {Number.isFinite(result.paybackYears) ? result.paybackYears.toFixed(1) : "—"}
                </strong>
                <span className="metric-unit">aastat</span>
              </div>
              <p className="metric-help">Investeeringu hinnanguline tasuvus lihtsustatud mudelis.</p>
            </div>
            <div className="metric-card metric-card-accent-teal">
              <p className="metric-label">Omakasutus</p>
              <div className="metric-main">
                <strong className="metric-value">{formatNum(result.selected.selfConsumptionRatePercent, 1)}</strong>
                <span className="metric-unit">%</span>
              </div>
              <p className="metric-help">Toodangust kohapeal ära kasutatud osa.</p>
            </div>
            <div className="metric-card metric-card-accent-emerald">
              <p className="metric-label">Võrku müük</p>
              <div className="metric-main">
                <strong className="metric-value">{Math.round(result.selected.exportedKwh).toLocaleString("et-EE")}</strong>
                <span className="metric-unit">kWh</span>
              </div>
              <p className="metric-help">Aastane energia, mis läheb võrku tagasi.</p>
            </div>
            <div className="metric-card metric-card-accent-emerald">
              <p className="metric-label">Kogutulu perioodis</p>
              <div className="metric-main">
                <strong className="metric-value">
                  {Math.round(result.selected.totalNetBenefitPeriodEur).toLocaleString("et-EE")}
                </strong>
                <span className="metric-unit">EUR</span>
              </div>
              <p className="metric-help">Kumulatiivne netotulemus kogu valitud perioodil.</p>
            </div>
            <div className="metric-card metric-card-accent-teal">
              <p className="metric-label">Aku lisaväärtus</p>
              <div className="metric-main">
                <strong className="metric-value">
                  {Math.round(result.batteryAddedValuePeriodEur).toLocaleString("et-EE")}
                </strong>
                <span className="metric-unit">EUR</span>
              </div>
              <p className="metric-help">Aku mõju kogu perioodi netotulemusele.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="card">
              <h4 className="section-title">Kas see investeering tundub mõistlik?</h4>
              <p className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 p-4 text-zinc-100">
                Tasuvuse hinnang: <strong>{result.interpretationKind}</strong>. Sinu valitud stsenaariumis on
                hinnanguline aastane CO2 vähenemine{" "}
                <strong>{formatNum(result.selected.co2ReductionKgYear, 0)} kg</strong>.
              </p>
              {FEATURES.paywallEnabled && !canViewFullAnalysis(unlock) ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-sm text-zinc-300">
                    Hetkel tasuta beetaversioon: detailne rahavoog, tundlikkus, lisagraafikud ja võrdlused.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-glow"
                      onClick={() => startCheckout("full_analysis")}
                      disabled={purchaseBusy === "full_analysis"}
                    >
                      {purchaseBusy === "full_analysis" ? "Laen..." : "Ava detailne vaade"}
                    </button>
                    <button type="button" className="btn-ghost" onClick={checkPaymentStatus}>
                      Kontrolli ligipääsu staatust
                    </button>
                  </div>
                </div>
              ) : FEATURES.paywallEnabled && canViewFullAnalysis(unlock) ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4">
                  <p className="text-sm text-zinc-100">
                    Detailne vaade on selle projekti jaoks avatud.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="btn-glow" onClick={downloadPdf}>
                      Laadi PDF alla
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-zinc-300">
                    Projekt: <span className="font-medium text-zinc-100">{projectId}</span>
                  </p>
                </div>
              ) : !FEATURES.paywallEnabled ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-zinc-300">Laadi alla kokkuvõtte PDF.</p>
                    <button type="button" className="btn-glow" onClick={downloadPdf}>
                      Laadi PDF alla
                    </button>
                  </div>
                </div>
              ) : null}
            </article>

            <article className="card">
              <h4 className="section-title">Energiavood</h4>
              <div className="mt-3 grid gap-2 text-sm">
                <div>
                  <p className="mb-1 text-zinc-300">Omakasutatud energia</p>
                  <div className="h-3 rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{
                        width: `${isEmptyInputs ? 0 : Math.min(result.selected.selfConsumptionRatePercent, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-zinc-300">Võrku müüdud energia</p>
                  <div className="h-3 rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-teal-400"
                      style={{
                        width: `${
                          isEmptyInputs
                            ? 0
                            : Math.min(
                                (result.selected.exportedKwh / Math.max(result.selected.annualProductionKwh, 1)) * 100,
                                100,
                              )
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </article>
          </div>

          <PaywallCard
            locked={!canViewFullAnalysis(unlock)}
            title="Detailne vaade"
            description="avab detailse rahavoo, lisagraafikud ja võrdlused selle projekti jaoks."
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
            <div className="grid gap-4 lg:grid-cols-2">
              <article className="card">
                <h4 className="section-title">Ilma akuta vs akuga</h4>
                <div className="grid gap-3 text-sm">
                  <div className="compare-row">
                    <span className="compare-label">Ilma akuta aastane netokasu</span>
                    <strong>{fmtEur(result.withoutBattery.annualNetBenefitEur)}</strong>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Akuga aastane netokasu</span>
                    <strong>{fmtEur(result.withBattery.annualNetBenefitEur)}</strong>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Võrgu sõltuvuse vähenemine (akuga)</span>
                    <strong>{formatNum(result.withBattery.gridDependenceReductionPercent, 1)}%</strong>
                  </div>
                </div>
              </article>

              <article className="card">
                <h4 className="section-title">Rahavoo prognoos aastate lõikes</h4>
                {result.selected.cashflowByYear.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-400">
                    Rahavoogu ei saanud arvutada. Kontrolli sisestatud andmeid.
                  </p>
                ) : (
                  <>
                    <p className="mt-2 px-0 text-xs text-zinc-500 md:hidden">
                      Mobiilis: libista horisontaalselt, et näha kõiki aastaid.
                    </p>
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
                                <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-emerald-300/30 bg-zinc-950/95 px-2 py-1 text-[11px] font-medium text-emerald-200 opacity-0 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-opacity duration-150 group-hover:opacity-100 sm:block">
                                  {formatNum(value, 0)} €
                                </div>
                                <div
                                  className="box-border flex w-full flex-col justify-end rounded-md bg-white/[0.06] px-0.5 pt-1"
                                  style={{ height: chartTrackPx }}
                                >
                                  <div
                                    className="w-full shrink-0 rounded bg-gradient-to-t from-emerald-500/80 to-teal-400/90"
                                    style={{ height: barPx }}
                                    aria-label={`Aasta ${index + 1}`}
                                    title={`${formatNum(value, 0)} €`}
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
            </div>

            <article className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
              <h4 className="mb-2 font-medium text-zinc-100">Arvutuse alused</h4>
              <ul className="list-disc space-y-1 pl-5">
                <li>Tootmist korrigeeritakse suuna, varjutuse, kasuteguri ja hooajalisuse teguriga.</li>
                <li>Akuga stsenaariumis kasvab omakasutus aku kasutatava mahuga.</li>
                <li>Rahavoog arvestab elektrihinna kasvu, süsteemi degradatsiooni ja diskontomäära.</li>
                <li>Nord Pool tõrke korral kasutatakse varuandmeid ning saad alati käsitsi hinda muuta.</li>
              </ul>
            </article>
          </PaywallCard>

        </section>
      </div>
    </div>
  );
}
