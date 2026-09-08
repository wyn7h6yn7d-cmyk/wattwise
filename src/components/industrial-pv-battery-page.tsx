"use client";

import { useMemo, useRef, useState } from "react";
import {
  INDUSTRIAL_SAMPLE_PROFILES,
  calculateIndustrial,
  describeIndustrialBatteryMode,
  type IndustrialBatteryPurpose,
  type IndustrialInput,
  type IndustrialResult,
  type IndustrialSampleProfile,
} from "@/lib/calculators/industrial";
import {
  SAMPLE_CONSUMPTION_CSV,
  parseConsumptionCsv,
  type ConsumptionCsvRow,
} from "@/lib/consumption/parse-consumption-csv";
import {
  consumptionProfileToFormFields,
  describeConsumptionInterval,
  summarizeConsumptionProfile,
  type ConsumptionProfileSummary,
} from "@/lib/consumption/consumption-profile";
import {
  buildConsumptionChartSeries,
  inferConsumptionProfileInsight,
} from "@/lib/consumption/consumption-profile-insight";
import { parseLocaleNumber, toNumber } from "@/lib/units";
import { UsedAssumptionsBlock } from "@/components/used-assumptions-block";
import { ConsumptionProfileChart } from "@/components/industrial/consumption-profile-chart";
import { IndustrialScenarioComparisonPanel } from "@/components/industrial/industrial-scenario-comparison";
import { calculateIndustrialScenarios } from "@/lib/calculators/industrial-scenarios";

type InputMode = "manual" | "csv";

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

function toField(value: number, digits?: number): string {
  const n = digits == null ? value : Number(value.toFixed(digits));
  return String(n).replace(".", ",");
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
      <div className="flex h-3 overflow-hidden border border-[var(--panel-border)] bg-[#0c0e14]">
        <div className="bg-emerald-600/75" style={{ width: `${leftPct}%` }} />
        <div className="bg-zinc-600/55" style={{ width: `${rightPct}%` }} />
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
        <div className="h-2.5 border border-[var(--panel-border)] bg-[#0c0e14]">
          <div className="h-full bg-zinc-500/70" style={{ width: `${(beforeKw / max) * 100}%` }} />
        </div>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs text-zinc-400">
          <span>Pärast akut</span>
          <span className="tabular-nums">{fmt(afterKw, 0)} kW</span>
        </div>
        <div className="h-2.5 border border-[var(--panel-border)] bg-[#0c0e14]">
          <div className="h-full bg-emerald-600/75" style={{ width: `${(afterKw / max) * 100}%` }} />
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
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvPreview, setCsvPreview] = useState<ConsumptionCsvRow[]>([]);
  const [csvRows, setCsvRows] = useState<ConsumptionCsvRow[]>([]);
  const [csvSummary, setCsvSummary] = useState<ConsumptionProfileSummary | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const clearCsvImport = () => {
    setCsvError(null);
    setCsvFileName("");
    setCsvPreview([]);
    setCsvRows([]);
    setCsvSummary(null);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

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

  const scenarioComparison = useMemo(() => {
    if (!hasRequiredInputs) return null;
    return calculateIndustrialScenarios(formToInput(form));
  }, [form, hasRequiredInputs]);

  const csvChartSeries = useMemo(() => {
    if (!csvSummary || csvRows.length === 0) return null;
    return buildConsumptionChartSeries(csvRows, csvSummary);
  }, [csvRows, csvSummary]);

  const csvInsight = useMemo(() => {
    if (!csvSummary) return null;
    return inferConsumptionProfileInsight(csvSummary);
  }, [csvSummary]);

  const applyProfile = (profile: IndustrialSampleProfile) => {
    setInputMode("manual");
    clearCsvImport();
    setForm(profileToForm(profile));
    setActiveProfile(profile.id);
    setValidationMessage(null);
    setHasCalculated(true);
  };

  const handleCsvFile = async (file: File | undefined) => {
    if (!file) return;
    setCsvFileName(file.name);
    setCsvError(null);
    setCsvPreview([]);
    setCsvRows([]);
    setCsvSummary(null);
    setActiveProfile(null);
    try {
      const text = await file.text();
      const parsed = parseConsumptionCsv(text);
      if (!parsed.ok) {
        setCsvError(parsed.error);
        return;
      }
      const summary = summarizeConsumptionProfile(parsed.rows);
      const fields = consumptionProfileToFormFields(summary);
      setCsvPreview(parsed.rows.slice(0, 5));
      setCsvRows(parsed.rows);
      setCsvSummary(summary);
      setForm((prev) => ({
        ...prev,
        annualConsumptionMwh: toField(fields.annualConsumptionMwh, 1),
        daytimeSharePercent: toField(fields.daytimeSharePercent, 1),
        peakLoadKw: toField(fields.peakLoadKw, 1),
      }));
      setHasCalculated(false);
      setValidationMessage(null);
    } catch {
      setCsvError("CSV faili lugemine ebaõnnestus. Proovi uuesti.");
    }
  };

  const downloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CONSUMPTION_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "naidis-toostus-tarbimine.csv";
    link.click();
    URL.revokeObjectURL(url);
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
    setInputMode("manual");
    clearCsvImport();
  };

  const assumptionsInfo = useMemo(
    () => ({
      userInputs: [
        form.companyName.trim() ? `Profiil: ${form.companyName.trim()}` : "",
        csvSummary
          ? `Tarbimisprofiil CSV-st (${csvFileName || "import"}): ${csvSummary.rowCount} rida, ${describeConsumptionInterval(csvSummary)}.`
          : "",
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
    [form, result.assumptions, csvSummary, csvFileName],
  );

  return (
    <div className="grid gap-6">
      <div className="border border-zinc-700/70 bg-[var(--panel-bg)] px-4 py-3 text-sm text-zinc-300">
        <p className="font-medium text-zinc-100">Projekt 2 prototüüp v0.4</p>
        <p className="mt-1">
          Tulemused on esmased lihtsustatud hinnangud tarbimisprofiili ja süsteemi suuruse põhjal, mitte
          lõplik investeerimisotsus ega 15-minutiline simulatsioon. CSV import, graafik, raportivaade ja
          stsenaariumite võrdlus aitavad lahendusi kõrvuti hinnata.
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
                    ? "border-emerald-400/50 bg-emerald-500/15 text-zinc-50"
                    : "border-[var(--panel-border)] bg-[var(--panel-bg)] text-zinc-300 hover:border-teal-400/35"
                }`}
              >
                <span className="block text-sm font-semibold text-zinc-100">{profile.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-zinc-400">{profile.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm text-zinc-400">Vali, kuidas tarbimisandmed sisestad.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            [
              { id: "manual" as const, title: "Käsitsi sisestamine", description: "Sisesta aastane tarbimine, päevane osakaal ja tipukoormus ise." },
              { id: "csv" as const, title: "CSV import", description: "Laadi üles tunni- või 15 min tarbimisprofiil ja täida sisendid automaatselt." },
            ] as const
          ).map((mode) => {
            const active = inputMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setInputMode(mode.id)}
                className={`border px-3 py-3 text-left transition-colors ${
                  active
                    ? "border-teal-400/50 bg-teal-500/15 text-zinc-50"
                    : "border-[var(--panel-border)] bg-[var(--panel-bg)] text-zinc-300 hover:border-emerald-400/35"
                }`}
              >
                <span className="block text-sm font-semibold text-zinc-100">{mode.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-zinc-400">{mode.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {inputMode === "csv" ? (
        <article className="card">
          <h2 className="section-title">CSV tarbimisprofiil</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Laadi üles ettevõtte elektritarbimise fail. Parser otsib aja veergu{" "}
            <span className="font-mono text-zinc-100">timestamp</span>, <span className="font-mono text-zinc-100">aeg</span>,{" "}
            <span className="font-mono text-zinc-100">date</span> või <span className="font-mono text-zinc-100">datetime</span> ja
            tarbimise veergu <span className="font-mono text-zinc-100">consumption_kwh</span>,{" "}
            <span className="font-mono text-zinc-100">tarbimine_kwh</span>, <span className="font-mono text-zinc-100">kwh</span> või{" "}
            <span className="font-mono text-zinc-100">consumption</span>. Eraldajaks sobib koma või semikoolon.
          </p>
          <pre className="mt-3 overflow-x-auto border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-300">
            {SAMPLE_CONSUMPTION_CSV}
          </pre>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <label className="btn-ghost w-full cursor-pointer text-center sm:w-auto">
              <span>Vali CSV fail</span>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  void handleCsvFile(file);
                }}
              />
            </label>
            <button type="button" className="btn-ghost w-full sm:w-auto" onClick={downloadSampleCsv}>
              Laadi näidisfail
            </button>
          </div>
          {csvFileName ? (
            <p className="mt-3 text-xs text-zinc-400">
              Valitud fail: <span className="text-zinc-200">{csvFileName}</span>
            </p>
          ) : null}
          {csvError ? (
            <p className="mt-3 border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">{csvError}</p>
          ) : null}

          {csvPreview.length > 0 ? (
            <div className="mt-4 overflow-x-auto border border-zinc-800">
              <p className="border-b border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-100">
                Eelvaade, esimesed {csvPreview.length} rida
              </p>
              <table className="min-w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-950 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">timestamp</th>
                    <th className="px-3 py-2 font-medium">consumption_kwh</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((row, index) => (
                    <tr key={`${row.timestampMs}-${index}`} className="border-t border-zinc-800">
                      <td className="px-3 py-2 font-mono tabular-nums">{row.timestampRaw}</td>
                      <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.consumptionKwh, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {csvSummary ? (
            <div className="mt-4 border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-sm font-medium text-zinc-100">Tarbimisprofiili kokkuvõte</p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
                  <dt className="text-zinc-400">Ridade arv</dt>
                  <dd className="font-mono tabular-nums text-zinc-100">{fmt(csvSummary.rowCount, 0)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
                  <dt className="text-zinc-400">Andmesamm</dt>
                  <dd className="text-zinc-100">{describeConsumptionInterval(csvSummary)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
                  <dt className="text-zinc-400">Perioodi algus</dt>
                  <dd className="font-mono tabular-nums text-zinc-100">{csvSummary.periodStartLabel}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
                  <dt className="text-zinc-400">Perioodi lõpp</dt>
                  <dd className="font-mono tabular-nums text-zinc-100">{csvSummary.periodEndLabel}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
                  <dt className="text-zinc-400">Kogu tarbimine</dt>
                  <dd className="font-mono tabular-nums text-zinc-100">{fmt(csvSummary.totalConsumptionMwh, 2)} MWh</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
                  <dt className="text-zinc-400">Hinnanguline aastane tarbimine</dt>
                  <dd className="font-mono tabular-nums text-zinc-100">
                    {fmt(csvSummary.estimatedAnnualConsumptionMwh, 1)} MWh
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
                  <dt className="text-zinc-400">Keskmine koormus</dt>
                  <dd className="font-mono tabular-nums text-zinc-100">{fmt(csvSummary.averageLoadKw, 1)} kW</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
                  <dt className="text-zinc-400">Tipukoormus</dt>
                  <dd className="font-mono tabular-nums text-zinc-100">{fmt(csvSummary.peakLoadKw, 1)} kW</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
                  <dt className="text-zinc-400">Päevase tarbimise osakaal</dt>
                  <dd className="font-mono tabular-nums text-zinc-100">{fmt(csvSummary.daytimeSharePercent, 1)}%</dd>
                </div>
                <div className="flex justify-between gap-3 py-1.5">
                  <dt className="text-zinc-400">Öise tarbimise osakaal</dt>
                  <dd className="font-mono tabular-nums text-zinc-100">{fmt(csvSummary.nighttimeSharePercent, 1)}%</dd>
                </div>
              </dl>
              {csvSummary.interval === "irregular" ? (
                <p className="mt-4 border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-50">
                  CSV ajasamm on ebaühtlane (mixed). Tipukoormus arvutatakse ridadevaheliste lünkade järgi ning aastane
                  hinnang võib olla ebatäpsem. Eelista ühtlast 1h või 15 min mõõtesammu.
                </p>
              ) : null}
              <p className="mt-4 text-xs leading-relaxed text-zinc-400">
                CSV impordi põhjal arvutatud tulemused on esmased hinnangud. Andmete kvaliteet ja perioodi pikkus
                mõjutavad tulemuse täpsust. Kui üles laaditud fail ei kata tervet aastat, arvutatakse aastane tarbimine
                perioodi põhjal lihtsustatud kujul.
              </p>
            </div>
          ) : null}

          {csvChartSeries ? (
            <div className="mt-4">
              <ConsumptionProfileChart series={csvChartSeries} />
            </div>
          ) : null}

          {csvInsight ? (
            <div className="mt-4 border border-zinc-800 bg-zinc-950 p-4">
              <h3 className="text-sm font-medium text-zinc-100">Tarbimisprofiili järeldus</h3>
              <dl className="mt-3 grid gap-3 text-sm">
                <div>
                  <dt className="text-zinc-400">Profiili tüüp</dt>
                  <dd className="mt-1 font-medium text-zinc-100">{csvInsight.shapeLabel}</dd>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{csvInsight.shapeExplanation}</p>
                </div>
                <div>
                  <dt className="text-zinc-400">PV kattuvus</dt>
                  <dd className="mt-1 font-medium text-zinc-100">{csvInsight.pvFitLabel}</dd>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{csvInsight.pvFitExplanation}</p>
                </div>
                <div>
                  <dt className="text-zinc-400">Aku roll</dt>
                  <dd className="mt-1 font-medium text-zinc-100">{csvInsight.batteryRoleLabel}</dd>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{csvInsight.batteryRoleExplanation}</p>
                </div>
              </dl>
              <p className="mt-3 text-xs text-zinc-500">
                Päevane osakaal {fmt(csvInsight.daytimeSharePercent, 1)}% · tipp/keskmine{" "}
                {fmt(csvInsight.peakToAverageRatio, 2)}.
              </p>
            </div>
          ) : null}
        </article>
      ) : null}

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
              <span className="field-hint">
                {csvSummary
                  ? "Täidetud CSV profiilist. Väärtust saab käsitsi muuta."
                  : "Kogu ostetud ja toodetud elektri tarbimine aastas."}
              </span>
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
              <span className="field-hint">
                {csvSummary
                  ? "Täidetud CSV profiilist (08:00–20:00). Väärtust saab käsitsi muuta."
                  : "Kui suur osa tarbimisest jääb PV tootmise tundidesse."}
              </span>
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
              <span className="field-hint">
                {csvSummary ? "Täidetud CSV profiilist. Väärtust saab käsitsi muuta." : "Praegune kõrgeim võrguvõimsus."}
              </span>
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
            Kohapeal kasutatud PV on kogusumma. Võrku müüdav PV on jääk pärast otsest omatarvet ja aku mõju.
          </p>
          {!hasCalculated ? (
            <div className="mb-4 border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              <p className="font-medium text-zinc-100">Sisesta andmed või vali näidisprofiil ja vajuta „Arvuta tulemus“.</p>
            </div>
          ) : null}

          {hasCalculated && hasRequiredInputs ? (
            <>
              <div className="mb-5 border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 via-zinc-950 to-teal-500/10 p-5">
                <p className="text-xs uppercase tracking-wide text-emerald-200/80">Peamine tulemus</p>
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <strong className="font-mono text-4xl font-semibold tabular-nums text-emerald-50 sm:text-5xl">
                    {fmt(result.annualSavingsEur, 0)}
                  </strong>
                  <span className="pb-1 font-mono text-base text-emerald-300 sm:text-lg">€/a</span>
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
                  <p className="metric-label">Kohapeal kasutatud PV kokku</p>
                  <div className="metric-main">
                    <strong className="metric-value">{fmt(result.selfConsumedPvMwh, 1)}</strong>
                    <span className="metric-unit">MWh</span>
                  </div>
                  <p className="metric-help">Otsene omatarve ja aku abil lisandunud omatarve kokku.</p>
                </div>
                <div className="metric-card metric-card-accent-teal">
                  <p className="metric-label">Võrku müüdav PV pärast akut</p>
                  <div className="metric-main">
                    <strong className="metric-value">{fmt(result.exportedPvMwh, 1)}</strong>
                    <span className="metric-unit">MWh</span>
                  </div>
                  <p className="metric-help">Jääk pärast otsest omatarvet ja aku mõju.</p>
                </div>
                <div className="metric-card metric-card-accent-emerald">
                  <p className="metric-label">Omatarbe osakaal</p>
                  <div className="metric-main">
                    <strong className="metric-value">{fmt(result.selfConsumptionSharePercent, 0)}</strong>
                    <span className="metric-unit">%</span>
                  </div>
                </div>
                <div className="metric-card metric-card-accent-teal">
                  <p className="metric-label">Aku lisanduv mõju omatarbele</p>
                  <div className="metric-main">
                    <strong className="metric-value">{fmt(result.batterySelfConsumptionImpactMwh, 1)}</strong>
                    <span className="metric-unit">MWh</span>
                  </div>
                  <p className="metric-help">Ainult see osa, mille aku lisab otsesele omatarbele.</p>
                </div>
                {form.batteryPurpose === "peak_shaving" ? (
                  <div className="metric-card metric-card-accent-emerald">
                    <p className="metric-label">Tipukoormus enne / pärast</p>
                    <div className="metric-main">
                      <strong className="metric-value">
                        {fmt(result.peakLoadBeforeKw, 0)} → {fmt(result.peakLoadAfterKw, 0)}
                      </strong>
                      <span className="metric-unit">kW</span>
                    </div>
                  </div>
                ) : (
                  <div className="metric-card metric-card-accent-emerald">
                    <p className="metric-label">Tipukoormus</p>
                    <div className="metric-main">
                      <strong className="metric-value">{fmt(result.peakLoadBeforeKw, 0)}</strong>
                      <span className="metric-unit">kW</span>
                    </div>
                    <p className="metric-help">Omatarbe režiimis tipukoormust ei vähendata.</p>
                  </div>
                )}
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
                  <p className="mt-1 text-xs text-zinc-400">
                    Kohapealne kasutus sisaldab nii otsest omatarvet kui ka aku abil lisandunud omatarvet.
                  </p>
                  <div className="mt-3">
                    <SplitBar
                      leftValue={result.selfConsumedPvMwh}
                      rightValue={result.exportedPvMwh}
                      leftLabel="Omatarve kokku"
                      rightLabel="Võrk pärast akut"
                    />
                  </div>
                </div>
                <div className="border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm font-medium text-zinc-100">Tipukoormus</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    {describeIndustrialBatteryMode(
                      form.batteryPurpose,
                      result.peakLoadBeforeKw,
                      result.peakLoadAfterKw,
                    )}
                  </p>
                  {form.batteryPurpose === "peak_shaving" ? (
                    <div className="mt-3">
                      <PeakCompare beforeKw={result.peakLoadBeforeKw} afterKw={result.peakLoadAfterKw} />
                    </div>
                  ) : null}
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

      {hasCalculated && hasRequiredInputs && scenarioComparison ? (
        <IndustrialScenarioComparisonPanel comparison={scenarioComparison} />
      ) : null}

      {csvSummary && csvInsight ? (
        <article
          id="industrial-report"
          className="border border-zinc-700/80 bg-[var(--panel-bg)] p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Veebiraport · v0.4</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">
                Tööstus: PV + aku raportivaade
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Sobib Projekt 2 aruande screenshotiks. PDF eksporti selles versioonis ei ole.
              </p>
            </div>
            <p className="font-mono text-xs text-zinc-500">
              {csvFileName || "CSV import"} · {csvSummary.periodStartLabel} → {csvSummary.periodEndLabel}
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section>
              <h3 className="text-sm font-medium text-zinc-100">1. Sisendandmete kokkuvõte</h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                <li>Profiil: {form.companyName.trim() || "Nimetu profiil"}</li>
                <li>Aastane tarbimine: {form.annualConsumptionMwh || "—"} MWh</li>
                <li>Päevane osakaal: {form.daytimeSharePercent || "—"}%</li>
                <li>Tipukoormus: {form.peakLoadKw || "—"} kW</li>
                <li>PV: {form.pvPowerKw || "—"} kW · {form.pvSpecificYieldKwhPerKw || "—"} kWh/kW</li>
                <li>
                  Aku: {form.batteryCapacityKwh || "—"} kWh / {form.batteryPowerKw || "—"} kW (
                  {form.batteryPurpose === "peak_shaving" ? "peak shaving" : "omatarve"})
                </li>
                <li>Elektrihind: {form.averageElectricityPriceEurPerMwh || "—"} €/MWh</li>
                {form.investmentEur.trim() ? <li>Investeering: {form.investmentEur} €</li> : null}
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-medium text-zinc-100">2. CSV tarbimisprofiil</h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                <li>
                  {fmt(csvSummary.rowCount, 0)} rida · {describeConsumptionInterval(csvSummary)}
                </li>
                <li>
                  Periood: {csvSummary.periodStartLabel} – {csvSummary.periodEndLabel}
                </li>
                <li>Hinnanguline aastane tarbimine: {fmt(csvSummary.estimatedAnnualConsumptionMwh, 1)} MWh</li>
                <li>
                  Keskmine / tipp: {fmt(csvSummary.averageLoadKw, 1)} / {fmt(csvSummary.peakLoadKw, 1)} kW
                </li>
                <li>
                  Päev / öö: {fmt(csvSummary.daytimeSharePercent, 1)}% /{" "}
                  {fmt(csvSummary.nighttimeSharePercent, 1)}%
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-medium text-zinc-100">3. PV ja aku tulemused</h3>
              {hasCalculated && hasRequiredInputs ? (
                <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                  <li>Aastane sääst: {fmt(result.annualSavingsEur, 0)} €/a</li>
                  <li>PV toodang: {fmt(result.pvProductionMwh, 1)} MWh</li>
                  <li>Kohapeal kasutatud PV: {fmt(result.selfConsumedPvMwh, 1)} MWh</li>
                  <li>Võrku müüdav PV: {fmt(result.exportedPvMwh, 1)} MWh</li>
                  <li>Omatarbe osakaal: {fmt(result.selfConsumptionSharePercent, 0)}%</li>
                  <li>
                    Tipukoormus: {fmt(result.peakLoadBeforeKw, 0)}
                    {form.batteryPurpose === "peak_shaving"
                      ? ` → ${fmt(result.peakLoadAfterKw, 0)} kW`
                      : " kW (omatarbes tippu ei lõigata)"}
                  </li>
                  <li>
                    Tasuvus:{" "}
                    {result.paybackYears != null ? `${fmt(result.paybackYears, 1)} a` : "ei arvutatud"}
                  </li>
                </ul>
              ) : (
                <p className="mt-2 text-sm text-zinc-400">
                  Täida PV/aku sisendid ja vajuta „Arvuta tulemus“, et raportisse tulemused lisanduksid.
                </p>
              )}
            </section>

            <section>
              <h3 className="text-sm font-medium text-zinc-100">4. Peamised järeldused</h3>
              <ul className="mt-2 space-y-2 text-sm text-zinc-300">
                <li>
                  <span className="text-zinc-100">{csvInsight.shapeLabel}.</span> {csvInsight.shapeExplanation}
                </li>
                <li>
                  <span className="text-zinc-100">{csvInsight.pvFitLabel}.</span> {csvInsight.pvFitExplanation}
                </li>
                <li>
                  <span className="text-zinc-100">{csvInsight.batteryRoleLabel}.</span>{" "}
                  {csvInsight.batteryRoleExplanation}
                </li>
                {hasCalculated && hasRequiredInputs ? (
                  <li>
                    <span className="text-zinc-100">Arvutuse kokkuvõte:</span> {result.summary}
                  </li>
                ) : null}
              </ul>
            </section>
          </div>

          <section className="mt-5 border-t border-zinc-800 pt-4">
            <h3 className="text-sm font-medium text-zinc-100">5. Stsenaariumite võrdlus</h3>
            {hasCalculated && hasRequiredInputs && scenarioComparison ? (
              <>
                <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                  {scenarioComparison.scenarios.map((row) => (
                    <li key={row.id}>
                      {row.label}: sääst {fmt(row.annualSavingsEur, 0)} €/a · tipp pärast{" "}
                      {fmt(row.peakLoadAfterKw, 0)} kW · tasuvus{" "}
                      {row.paybackYears != null ? `${fmt(row.paybackYears, 1)} a` : "ei arvutata"}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {scenarioComparison.conclusion.summary}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">
                Vajuta „Arvuta tulemus“, et stsenaariumite võrdlus raportisse lisanduks.
              </p>
            )}
          </section>

          <section className="mt-5 border-t border-zinc-800 pt-4">
            <h3 className="text-sm font-medium text-zinc-100">6. Piirangute märkus</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              See on Projekt 2 prototüübi veebiraport, mitte investeerimisotsus. Arvutus on lihtsustatud (ei ole
              15-minutiline PV+aku optimeerija). Lühikese CSV perioodi korral skaleeritakse aastane tarbimine
              lihtsustatult. Päevane aken on fikseeritud 08:00–20:00. Võrku müüdavat energiat rahalises säästus ei
              väärtustata. PDF eksporti v0.4-s ei ole — salvesta vaade screenshotina.
            </p>
          </section>
        </article>
      ) : null}
    </div>
  );
}
