"use client";

import { useMemo, useState } from "react";
import {
  INDUSTRIAL_SAMPLE_PROFILES,
  calculateIndustrial,
  type IndustrialBatteryPurpose,
  type IndustrialInput,
  type IndustrialResult,
  type IndustrialSampleProfile,
} from "@/lib/calculators/industrial";
import { parseLocaleNumber, toNumber } from "@/lib/units";
import { UsedAssumptionsBlock } from "@/components/used-assumptions-block";

type FormState = {
  companyName: string;
  annualConsumptionMwh: string;
  daytimeSharePercent: string;
  peakLoadKw: string;
  averageElectricityPriceEurPerMwh: string;
  pvPowerKw: string;
  pvSpecificYieldKwhPerKw: string;
  batteryCapacityKwh: string;
  batteryPowerKw: string;
  batteryPurpose: IndustrialBatteryPurpose;
  investmentEur: string;
};

const EMPTY_FORM: FormState = {
  companyName: "",
  annualConsumptionMwh: "",
  daytimeSharePercent: "",
  peakLoadKw: "",
  averageElectricityPriceEurPerMwh: "",
  pvPowerKw: "",
  pvSpecificYieldKwhPerKw: "",
  batteryCapacityKwh: "",
  batteryPowerKw: "",
  batteryPurpose: "self_consumption",
  investmentEur: "",
};

function toField(value: number): string {
  return String(value).replace(".", ",");
}

function profileToForm(profile: IndustrialSampleProfile): FormState {
  const { input } = profile;
  return {
    companyName: input.companyName,
    annualConsumptionMwh: toField(input.annualConsumptionMwh),
    daytimeSharePercent: toField(input.daytimeSharePercent),
    peakLoadKw: toField(input.peakLoadKw),
    averageElectricityPriceEurPerMwh: toField(input.averageElectricityPriceEurPerMwh),
    pvPowerKw: toField(input.pvPowerKw),
    pvSpecificYieldKwhPerKw: toField(input.pvSpecificYieldKwhPerKw),
    batteryCapacityKwh: toField(input.batteryCapacityKwh),
    batteryPowerKw: toField(input.batteryPowerKw),
    batteryPurpose: input.batteryPurpose,
    investmentEur: input.investmentEur == null ? "" : toField(input.investmentEur),
  };
}

function formToInput(form: FormState): IndustrialInput {
  const investment = parseLocaleNumber(form.investmentEur);
  return {
    companyName: form.companyName,
    annualConsumptionMwh: toNumber(form.annualConsumptionMwh),
    daytimeSharePercent: toNumber(form.daytimeSharePercent),
    peakLoadKw: toNumber(form.peakLoadKw),
    averageElectricityPriceEurPerMwh: toNumber(form.averageElectricityPriceEurPerMwh),
    pvPowerKw: toNumber(form.pvPowerKw),
    pvSpecificYieldKwhPerKw: toNumber(form.pvSpecificYieldKwhPerKw),
    batteryCapacityKwh: toNumber(form.batteryCapacityKwh),
    batteryPowerKw: toNumber(form.batteryPowerKw),
    batteryPurpose: form.batteryPurpose,
    investmentEur: investment != null && investment > 0 ? investment : null,
  };
}

function fmt(value: number, digits: number): string {
  return new Intl.NumberFormat("et-EE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

function SplitBar({
  leftValue,
  rightValue,
  leftLabel,
  rightLabel,
}: {
  leftValue: number;
  rightValue: number;
  leftLabel: string;
  rightLabel: string;
}) {
  const total = Math.max(leftValue + rightValue, 0);
  const leftPct = total > 0 ? (leftValue / total) * 100 : 0;
  const rightPct = total > 0 ? (rightValue / total) * 100 : 0;

  return (
    <div>
      <div className="flex h-3 overflow-hidden border border-[var(--panel-border)] bg-[#07140f]">
        <div className="bg-emerald-700/80" style={{ width: `${leftPct}%` }} />
        <div className="bg-emerald-300/35" style={{ width: `${rightPct}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-zinc-400">
        <span>
          {leftLabel}: {fmt(leftValue, 1)} MWh
        </span>
        <span>
          {rightLabel}: {fmt(rightValue, 1)} MWh
        </span>
      </div>
    </div>
  );
}

function PeakCompare({ beforeKw, afterKw }: { beforeKw: number; afterKw: number }) {
  const max = Math.max(beforeKw, afterKw, 1);
  return (
    <div className="grid gap-3">
      <div>
        <div className="mb-1 flex justify-between text-xs text-zinc-400">
          <span>Enne akut</span>
          <span className="tabular-nums">{fmt(beforeKw, 0)} kW</span>
        </div>
        <div className="h-2.5 border border-[var(--panel-border)] bg-[#07140f]">
          <div className="h-full bg-zinc-500/80" style={{ width: `${(beforeKw / max) * 100}%` }} />
        </div>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs text-zinc-400">
          <span>Pärast akut</span>
          <span className="tabular-nums">{fmt(afterKw, 0)} kW</span>
        </div>
        <div className="h-2.5 border border-[var(--panel-border)] bg-[#07140f]">
          <div className="h-full bg-emerald-700/80" style={{ width: `${(afterKw / max) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export function IndustrialPvBatteryPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [activeProfile, setActiveProfile] = useState<IndustrialSampleProfile["id"] | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setActiveProfile(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const hasRequiredInputs =
    parseLocaleNumber(form.annualConsumptionMwh) != null &&
    parseLocaleNumber(form.annualConsumptionMwh)! > 0 &&
    parseLocaleNumber(form.daytimeSharePercent) != null &&
    parseLocaleNumber(form.peakLoadKw) != null &&
    parseLocaleNumber(form.peakLoadKw)! > 0 &&
    parseLocaleNumber(form.averageElectricityPriceEurPerMwh) != null &&
    parseLocaleNumber(form.averageElectricityPriceEurPerMwh)! > 0 &&
    parseLocaleNumber(form.pvPowerKw) != null &&
    parseLocaleNumber(form.pvPowerKw)! > 0 &&
    parseLocaleNumber(form.pvSpecificYieldKwhPerKw) != null &&
    parseLocaleNumber(form.pvSpecificYieldKwhPerKw)! > 0;

  const result: IndustrialResult = useMemo(() => calculateIndustrial(formToInput(form)), [form]);

  const applyProfile = (profile: IndustrialSampleProfile) => {
    setForm(profileToForm(profile));
    setActiveProfile(profile.id);
    setValidationMessage(null);
    setHasCalculated(true);
  };

  const handleCalculate = () => {
    if (!hasRequiredInputs) {
      setHasCalculated(false);
      setValidationMessage("Sisesta tarbimine, päevane osakaal, tipukoormus, elektrihind, PV võimsus ja tootlikkus.");
      return;
    }
    setValidationMessage(null);
    setHasCalculated(true);
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setActiveProfile(null);
    setHasCalculated(false);
    setValidationMessage(null);
  };

  const assumptionsInfo = useMemo(
    () => ({
      userInputs: [
        form.companyName.trim() ? `Profiil: ${form.companyName.trim()}` : "",
        toNumber(form.annualConsumptionMwh) > 0 ? `Tarbimine: ${form.annualConsumptionMwh} MWh/a` : "",
        parseLocaleNumber(form.daytimeSharePercent) != null ? `Päevane osakaal: ${form.daytimeSharePercent}%` : "",
        toNumber(form.peakLoadKw) > 0 ? `Tipukoormus: ${form.peakLoadKw} kW` : "",
        toNumber(form.pvPowerKw) > 0 ? `PV: ${form.pvPowerKw} kW` : "",
        toNumber(form.batteryCapacityKwh) > 0 ? `Aku: ${form.batteryCapacityKwh} kWh / ${form.batteryPowerKw} kW` : "",
      ].filter(Boolean),
      defaultAssumptions: result.assumptions,
      apiValues: [] as string[],
      mostInfluentialInputs: [
        "Päevase tarbimise osakaal määrab, kui palju PV-d saab ilma akuta kohapeal kasutada.",
        "Aku režiim otsustab, kas sääst tuleb omatarbest või tipu lõikamisest.",
        "Elektri hind (€/MWh) skaleerib aastase rahalise säästu.",
      ],
    }),
    [form, result.assumptions],
  );

  return (
    <div className="grid gap-6">
      <div className="border border-[var(--panel-border)] bg-[#07140f] px-4 py-3 text-sm text-zinc-300">
        <p className="font-medium text-zinc-100">Projekt 2 prototüüp v0.1</p>
        <p className="mt-1">
          Tulemused on esmased lihtsustatud hinnangud tarbimisprofiili ja süsteemi suuruse põhjal, mitte
          lõplik investeerimisotsus ega 15-minutiline simulatsioon.
        </p>
      </div>

      <div>
        <p className="text-sm text-zinc-400">Vali näidisprofiil või sisesta enda andmed.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {INDUSTRIAL_SAMPLE_PROFILES.map((profile) => {
            const active = activeProfile === profile.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => applyProfile(profile)}
                className={`border px-3 py-3 text-left transition-colors ${
                  active
                    ? "border-emerald-500/50 bg-emerald-950/40 text-zinc-50"
                    : "border-[var(--panel-border)] bg-[#07140f] text-zinc-300 hover:border-emerald-800/80"
                }`}
              >
                <span className="block text-sm font-semibold text-zinc-100">{profile.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-zinc-400">{profile.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="card">
          <h2 className="section-title">Sisendid</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="field-label sm:col-span-2">
              <span className="field-label-text">Ettevõtte või näidisprofiili nimi</span>
              <input
                className="input"
                value={form.companyName}
                onChange={(e) => setField("companyName", e.target.value)}
                placeholder="nt Päevane tootmine"
              />
            </label>
            <label className="field-label">
              <span className="field-label-text">Aastane elektritarbimine (MWh)</span>
              <input
                className="input"
                value={form.annualConsumptionMwh}
                inputMode="decimal"
                onChange={(e) => setField("annualConsumptionMwh", e.target.value)}
                placeholder="nt 2500"
              />
              <span className="field-hint">Kogu ostetud ja toodetud elektri tarbimine aastas.</span>
            </label>
            <label className="field-label">
              <span className="field-label-text">Päevase tarbimise osakaal (%)</span>
              <input
                className="input"
                value={form.daytimeSharePercent}
                inputMode="decimal"
                onChange={(e) => setField("daytimeSharePercent", e.target.value)}
                placeholder="nt 75"
              />
              <span className="field-hint">Kui suur osa tarbimisest jääb PV tootmise tundidesse.</span>
            </label>
            <label className="field-label">
              <span className="field-label-text">Tipukoormus (kW)</span>
              <input
                className="input"
                value={form.peakLoadKw}
                inputMode="decimal"
                onChange={(e) => setField("peakLoadKw", e.target.value)}
                placeholder="nt 650"
              />
              <span className="field-hint">Praegune kõrgeim võrguvõimsus.</span>
            </label>
            <label className="field-label">
              <span className="field-label-text">Keskmine elektrihind (€/MWh)</span>
              <input
                className="input"
                value={form.averageElectricityPriceEurPerMwh}
                inputMode="decimal"
                onChange={(e) => setField("averageElectricityPriceEurPerMwh", e.target.value)}
                placeholder="nt 110"
              />
              <span className="field-hint">Ostuhind, millega välditud tarbimist hinnatakse.</span>
            </label>
            <label className="field-label">
              <span className="field-label-text">PV süsteemi võimsus (kW)</span>
              <input
                className="input"
                value={form.pvPowerKw}
                inputMode="decimal"
                onChange={(e) => setField("pvPowerKw", e.target.value)}
                placeholder="nt 800"
              />
            </label>
            <label className="field-label">
              <span className="field-label-text">PV aastane tootlikkus (kWh/kW)</span>
              <input
                className="input"
                value={form.pvSpecificYieldKwhPerKw}
                inputMode="decimal"
                onChange={(e) => setField("pvSpecificYieldKwhPerKw", e.target.value)}
                placeholder="nt 950"
              />
              <span className="field-hint">Eesti tüüpiline vahemik on umbes 850–1050 kWh/kW.</span>
            </label>
            <label className="field-label">
              <span className="field-label-text">Aku mahtuvus (kWh)</span>
              <input
                className="input"
                value={form.batteryCapacityKwh}
                inputMode="decimal"
                onChange={(e) => setField("batteryCapacityKwh", e.target.value)}
                placeholder="nt 500"
              />
            </label>
            <label className="field-label">
              <span className="field-label-text">Aku võimsus (kW)</span>
              <input
                className="input"
                value={form.batteryPowerKw}
                inputMode="decimal"
                onChange={(e) => setField("batteryPowerKw", e.target.value)}
                placeholder="nt 250"
              />
            </label>
            <div className="sm:col-span-2">
              <p className="field-label-text">Aku kasutamise eesmärk</p>
              <div className="mt-2 inline-flex border border-zinc-800 bg-zinc-950 p-1">
                <button
                  type="button"
                  className={`px-3 py-1.5 text-sm transition ${
                    form.batteryPurpose === "self_consumption" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"
                  }`}
                  onClick={() => setField("batteryPurpose", "self_consumption")}
                >
                  Omatarbe suurendamine
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 text-sm transition ${
                    form.batteryPurpose === "peak_shaving" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"
                  }`}
                  onClick={() => setField("batteryPurpose", "peak_shaving")}
                >
                  Peak shaving
                </button>
              </div>
            </div>
            <label className="field-label sm:col-span-2">
              <span className="field-label-text">Investeering (€), valikuline</span>
              <input
                className="input"
                value={form.investmentEur}
                inputMode="decimal"
                onChange={(e) => setField("investmentEur", e.target.value)}
                placeholder="nt 760000"
              />
              <span className="field-hint">Kui tühjaks jätta, tasuvusaega ei arvutata.</span>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-glow w-full sm:w-auto" onClick={handleCalculate}>
              Arvuta tulemus
            </button>
            <button type="button" className="btn-ghost w-full sm:w-auto" onClick={handleReset}>
              Lähtesta
            </button>
          </div>
          {validationMessage ? (
            <p className="mt-3 border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              {validationMessage}
            </p>
          ) : null}
        </article>

        <article className="card">
          <h2 className="section-title">Tulemused</h2>
          <p className="mb-4 text-sm text-zinc-300">
            Vaata esmalt, kui palju PV-d jääb kohapeale, kas aku liigutab ülejääki, ja milline on ligikaudne
            aastane sääst.
          </p>
          {!hasCalculated ? (
            <div className="mb-4 border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              <p className="font-medium text-zinc-100">Sisesta andmed või vali näidisprofiil ja vajuta „Arvuta tulemus“.</p>
            </div>
          ) : null}

          {hasCalculated && hasRequiredInputs ? (
            <>
              <div className="mb-5 border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Peamine tulemus</p>
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <strong className="font-mono text-4xl font-semibold tabular-nums text-zinc-50 sm:text-5xl">
                    {fmt(result.annualSavingsEur, 0)}
                  </strong>
                  <span className="pb-1 font-mono text-base text-emerald-400 sm:text-lg">€/a</span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">Ligikaudne aastane sääst v0.1 eelduste põhjal.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="metric-card metric-card-accent-emerald">
                  <p className="metric-label">Aastane PV toodang</p>
                  <div className="metric-main">
                    <strong className="metric-value">{fmt(result.pvProductionMwh, 1)}</strong>
                    <span className="metric-unit">MWh</span>
                  </div>
                </div>
                <div className="metric-card metric-card-accent-teal">
                  <p className="metric-label">Kohapeal kasutatud PV</p>
                  <div className="metric-main">
                    <strong className="metric-value">{fmt(result.selfConsumedPvMwh, 1)}</strong>
                    <span className="metric-unit">MWh</span>
                  </div>
                </div>
                <div className="metric-card metric-card-accent-teal">
                  <p className="metric-label">Võrku müüdav PV</p>
                  <div className="metric-main">
                    <strong className="metric-value">{fmt(result.exportedPvMwh, 1)}</strong>
                    <span className="metric-unit">MWh</span>
                  </div>
                </div>
                <div className="metric-card metric-card-accent-emerald">
                  <p className="metric-label">Omatarbe osakaal</p>
                  <div className="metric-main">
                    <strong className="metric-value">{fmt(result.selfConsumptionSharePercent, 0)}</strong>
                    <span className="metric-unit">%</span>
                  </div>
                </div>
                <div className="metric-card metric-card-accent-teal">
                  <p className="metric-label">Aku mõju omatarbele</p>
                  <div className="metric-main">
                    <strong className="metric-value">{fmt(result.batterySelfConsumptionImpactMwh, 1)}</strong>
                    <span className="metric-unit">MWh</span>
                  </div>
                </div>
                <div className="metric-card metric-card-accent-emerald">
                  <p className="metric-label">Tipukoormus enne / pärast</p>
                  <div className="metric-main">
                    <strong className="metric-value">
                      {fmt(result.peakLoadBeforeKw, 0)} → {fmt(result.peakLoadAfterKw, 0)}
                    </strong>
                    <span className="metric-unit">kW</span>
                  </div>
                </div>
                <div className="metric-card metric-card-primary metric-card-accent-emerald sm:col-span-2">
                  <p className="metric-label">Lihtsustatud tasuvus</p>
                  <div className="metric-main">
                    <strong className="metric-value">
                      {result.paybackYears != null ? fmt(result.paybackYears, 1) : "—"}
                    </strong>
                    {result.paybackYears != null ? <span className="metric-unit">a</span> : null}
                  </div>
                  <p className="metric-help">Investeering jagatud aastase säästuga. Ilma investeeringuta ei arvutata.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm font-medium text-zinc-100">PV energia jaotus</p>
                  <p className="mt-1 text-xs text-zinc-400">Kohapeal kasutatud vs võrku jääv toodang.</p>
                  <div className="mt-3">
                    <SplitBar
                      leftValue={result.selfConsumedPvMwh}
                      rightValue={result.exportedPvMwh}
                      leftLabel="Omatarve"
                      rightLabel="Võrk"
                    />
                  </div>
                </div>
                <div className="border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm font-medium text-zinc-100">Tipukoormus</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Peak shaving režiimis võib aku tippu vähendada; omatarbe režiimis tipp ei muutu.
                  </p>
                  <div className="mt-3">
                    <PeakCompare beforeKw={result.peakLoadBeforeKw} afterKw={result.peakLoadAfterKw} />
                  </div>
                </div>
              </div>

              <div className="mt-4 border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-200">
                <p className="font-medium text-zinc-50">Mida tulemused tähendavad</p>
                <p className="mt-2 leading-relaxed text-zinc-300">{result.summary}</p>
              </div>

              <UsedAssumptionsBlock {...assumptionsInfo} />
            </>
          ) : hasCalculated ? (
            <p className="text-sm text-zinc-400">Sisesta vajalikud andmed, et näha tulemusi.</p>
          ) : null}
        </article>
      </div>
    </div>
  );
}
