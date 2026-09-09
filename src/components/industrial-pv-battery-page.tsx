"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  INDUSTRIAL_ECONOMICS_DEFAULTS,
  INDUSTRIAL_SAMPLE_PROFILES,
  calculateIndustrial,
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
import { ConsumptionProfileChart } from "@/components/industrial/consumption-profile-chart";
import { buildIndustrialInterpretation } from "@/components/industrial/industrial-recommendation-card";
import { IndustrialReportPrint } from "@/components/industrial/industrial-report-print";
import {
  IndustrialChartsEmptyState,
  IndustrialResultCharts,
} from "@/components/industrial/industrial-result-charts";
import { IndustrialResultsDashboard } from "@/components/industrial/industrial-results-dashboard";
import { calculateIndustrialScenarios } from "@/lib/calculators/industrial-scenarios";
import { simulateIndustrialTimeseries } from "@/lib/calculators/industrial-timeseries";
import {
  SAMPLE_PRICE_CSV,
  parsePriceCsv,
  type PriceCsvRow,
} from "@/lib/market/parse-price-csv";
import { matchPriceSeriesToConsumption } from "@/lib/market/match-price-series";
import { eleringPointsToPriceRows } from "@/lib/market/elering-to-price-rows";
import type { MarketPriceSeries } from "@/lib/elering";
import {
  DEMO_CONSUMPTION_FILENAME,
  DEMO_PRICES_FILENAME,
  DEMO_RECOMMENDED_INPUTS,
  buildDemoConsumptionCsv,
  buildDemoPricesCsv,
  downloadTextFile,
} from "@/lib/industrial/demo-data";
import { SITE_BRAND } from "@/lib/site";

type InputMode = "manual" | "csv";
type PriceMode = "flat" | "csv" | "elering";

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
  pvInvestmentEurPerKw: string;
  batteryInvestmentEurPerKwh: string;
  exportPriceEurPerMwh: string;
  demandChargeEurPerKwMonth: string;
  batteryEfficiencyPercent: string;
  batteryUsableCapacityPercent: string;
};

function toDefaultField(value: number, digits = 0): string {
  const n = Number(value.toFixed(digits));
  return String(n).replace(".", ",");
}

const EMPTY_FORM: FormState = {
  companyName: "",
  annualConsumptionMwh: "",
  daytimeSharePercent: "",
  peakLoadKw: "",
  averageElectricityPriceEurPerMwh: "110",
  pvPowerKw: "",
  pvSpecificYieldKwhPerKw: "",
  batteryCapacityKwh: "",
  batteryPowerKw: "",
  batteryPurpose: "self_consumption",
  pvInvestmentEurPerKw: toDefaultField(INDUSTRIAL_ECONOMICS_DEFAULTS.pvInvestmentEurPerKw),
  batteryInvestmentEurPerKwh: toDefaultField(INDUSTRIAL_ECONOMICS_DEFAULTS.batteryInvestmentEurPerKwh),
  exportPriceEurPerMwh: toDefaultField(INDUSTRIAL_ECONOMICS_DEFAULTS.exportPriceEurPerMwh),
  demandChargeEurPerKwMonth: toDefaultField(INDUSTRIAL_ECONOMICS_DEFAULTS.demandChargeEurPerKwMonth, 1),
  batteryEfficiencyPercent: toDefaultField(INDUSTRIAL_ECONOMICS_DEFAULTS.batteryEfficiencyPercent),
  batteryUsableCapacityPercent: toDefaultField(INDUSTRIAL_ECONOMICS_DEFAULTS.batteryUsableCapacityPercent),
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
    pvInvestmentEurPerKw: toField(input.pvInvestmentEurPerKw),
    batteryInvestmentEurPerKwh: toField(input.batteryInvestmentEurPerKwh),
    exportPriceEurPerMwh: toField(input.exportPriceEurPerMwh),
    demandChargeEurPerKwMonth: toField(input.demandChargeEurPerKwMonth, 1),
    batteryEfficiencyPercent: toField(input.batteryEfficiencyPercent),
    batteryUsableCapacityPercent: toField(input.batteryUsableCapacityPercent),
  };
}

function formToInput(form: FormState): IndustrialInput {
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
    investmentEur: null,
    pvInvestmentEurPerKw:
      parseLocaleNumber(form.pvInvestmentEurPerKw) ?? INDUSTRIAL_ECONOMICS_DEFAULTS.pvInvestmentEurPerKw,
    batteryInvestmentEurPerKwh:
      parseLocaleNumber(form.batteryInvestmentEurPerKwh) ??
      INDUSTRIAL_ECONOMICS_DEFAULTS.batteryInvestmentEurPerKwh,
    exportPriceEurPerMwh:
      parseLocaleNumber(form.exportPriceEurPerMwh) ?? INDUSTRIAL_ECONOMICS_DEFAULTS.exportPriceEurPerMwh,
    demandChargeEurPerKwMonth:
      parseLocaleNumber(form.demandChargeEurPerKwMonth) ??
      INDUSTRIAL_ECONOMICS_DEFAULTS.demandChargeEurPerKwMonth,
    batteryEfficiencyPercent:
      parseLocaleNumber(form.batteryEfficiencyPercent) ??
      INDUSTRIAL_ECONOMICS_DEFAULTS.batteryEfficiencyPercent,
    batteryUsableCapacityPercent:
      parseLocaleNumber(form.batteryUsableCapacityPercent) ??
      INDUSTRIAL_ECONOMICS_DEFAULTS.batteryUsableCapacityPercent,
  };
}

function fmt(value: number, digits: number): string {
  return new Intl.NumberFormat("et-EE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

export function IndustrialPvBatteryPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [activeProfile, setActiveProfile] = useState<IndustrialSampleProfile["id"] | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [reportGeneratedAt, setReportGeneratedAt] = useState<Date>(() => new Date());
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvPreview, setCsvPreview] = useState<ConsumptionCsvRow[]>([]);
  const [csvRows, setCsvRows] = useState<ConsumptionCsvRow[]>([]);
  const [csvSummary, setCsvSummary] = useState<ConsumptionProfileSummary | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const priceCsvInputRef = useRef<HTMLInputElement | null>(null);

  const [priceMode, setPriceMode] = useState<PriceMode>("flat");
  const [priceCsvError, setPriceCsvError] = useState<string | null>(null);
  const [priceCsvFileName, setPriceCsvFileName] = useState("");
  const [priceCsvPreview, setPriceCsvPreview] = useState<PriceCsvRow[]>([]);
  const [priceCsvRows, setPriceCsvRows] = useState<PriceCsvRow[]>([]);
  const [eleringRows, setEleringRows] = useState<PriceCsvRow[] | null>(null);
  const [eleringNote, setEleringNote] = useState<string | null>(null);
  const [eleringLoading, setEleringLoading] = useState(false);
  const resultsAnchorRef = useRef<HTMLDivElement | null>(null);

  const clearPriceCsvImport = () => {
    setPriceCsvError(null);
    setPriceCsvFileName("");
    setPriceCsvPreview([]);
    setPriceCsvRows([]);
    if (priceCsvInputRef.current) priceCsvInputRef.current.value = "";
  };

  const clearCsvImport = () => {
    setCsvError(null);
    setCsvFileName("");
    setCsvPreview([]);
    setCsvRows([]);
    setCsvSummary(null);
    if (csvInputRef.current) csvInputRef.current.value = "";
    clearPriceCsvImport();
    setEleringRows(null);
    setEleringNote(null);
    setPriceMode("flat");
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

  const interpretation = useMemo(
    () =>
      buildIndustrialInterpretation({
        result,
        comparison: scenarioComparison,
        batteryPurpose: form.batteryPurpose,
        hasBattery:
          (parseLocaleNumber(form.batteryCapacityKwh) ?? 0) > 0 ||
          (parseLocaleNumber(form.batteryPowerKw) ?? 0) > 0,
      }),
    [result, scenarioComparison, form.batteryPurpose, form.batteryCapacityKwh, form.batteryPowerKw],
  );

  const priceSeriesSourceRows = useMemo(() => {
    if (priceMode === "csv") return priceCsvRows;
    if (priceMode === "elering") return eleringRows ?? [];
    return [];
  }, [priceMode, priceCsvRows, eleringRows]);

  const priceMatch = useMemo(() => {
    if (priceMode === "flat" || csvRows.length === 0 || priceSeriesSourceRows.length === 0) return null;
    const input = formToInput(form);
    return matchPriceSeriesToConsumption({
      consumptionRows: csvRows,
      priceRows: priceSeriesSourceRows,
      fallbackBuyEurPerMwh: input.averageElectricityPriceEurPerMwh,
      fallbackExportEurPerMwh: input.exportPriceEurPerMwh,
    });
  }, [priceMode, csvRows, priceSeriesSourceRows, form]);

  const timeseriesResult = useMemo(() => {
    if (!hasRequiredInputs || csvRows.length === 0 || !csvSummary) return null;
    const input = formToInput(form);
    return simulateIndustrialTimeseries({
      rows: csvRows,
      pvPowerKw: input.pvPowerKw,
      pvSpecificYieldKwhPerKw: input.pvSpecificYieldKwhPerKw,
      batteryCapacityKwh: input.batteryCapacityKwh,
      batteryPowerKw: input.batteryPowerKw,
      batteryPurpose: input.batteryPurpose,
      batteryEfficiencyPercent: input.batteryEfficiencyPercent,
      batteryUsableCapacityPercent: input.batteryUsableCapacityPercent,
      peakLoadKw: input.peakLoadKw,
      intervalMinutes: csvSummary.intervalMinutes,
      buyPriceEurPerMwh: input.averageElectricityPriceEurPerMwh,
      exportPriceEurPerMwh: input.exportPriceEurPerMwh,
      demandChargeEurPerKwMonth: input.demandChargeEurPerKwMonth,
      priceSeries: priceMatch?.points ?? null,
    });
  }, [form, hasRequiredInputs, csvRows, csvSummary, priceMatch]);

  const priceModeLabel =
    priceMode === "csv"
      ? "Hinnaseeria CSV"
      : priceMode === "elering"
        ? eleringRows && eleringRows.length > 0
          ? "Eleringi börsihind (EE)"
          : eleringLoading
            ? "Elering EE (laadin…)"
            : "Elering EE — kasutusel keskmine hind"
        : "Keskmine hind";

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
      setForm((prev) => {
        const next = {
          ...prev,
          annualConsumptionMwh: toField(fields.annualConsumptionMwh, 1),
          daytimeSharePercent: toField(fields.daytimeSharePercent, 1),
          peakLoadKw: toField(fields.peakLoadKw, 1),
        };
        // Demo risk: if PV fields are empty after demo CSV, prefill calm defaults for the defense path.
        const isDemoFile = file.name.toLowerCase().includes("demo-tarbimine");
        const pvEmpty = !parseLocaleNumber(prev.pvPowerKw);
        if (isDemoFile && pvEmpty) {
          next.companyName = prev.companyName.trim() || DEMO_RECOMMENDED_INPUTS.companyName;
          next.pvPowerKw = DEMO_RECOMMENDED_INPUTS.pvPowerKw;
          next.pvSpecificYieldKwhPerKw = DEMO_RECOMMENDED_INPUTS.pvSpecificYieldKwhPerKw;
          next.batteryCapacityKwh = DEMO_RECOMMENDED_INPUTS.batteryCapacityKwh;
          next.batteryPowerKw = DEMO_RECOMMENDED_INPUTS.batteryPowerKw;
          next.batteryPurpose = DEMO_RECOMMENDED_INPUTS.batteryPurpose;
          if (!parseLocaleNumber(prev.averageElectricityPriceEurPerMwh)) {
            next.averageElectricityPriceEurPerMwh = DEMO_RECOMMENDED_INPUTS.averageElectricityPriceEurPerMwh;
          }
        }
        return next;
      });
      setHasCalculated(false);
      setValidationMessage(null);
    } catch {
      setCsvError("Tarbimise CSV faili ei õnnestunud lugeda. Proovi uuesti või laadi demo-tarbimine.csv.");
    }
  };

  const downloadSampleCsv = () => {
    downloadTextFile(DEMO_CONSUMPTION_FILENAME, buildDemoConsumptionCsv());
  };

  const handlePriceCsvFile = async (file: File | undefined) => {
    if (!file) return;
    setPriceCsvFileName(file.name);
    setPriceCsvError(null);
    setPriceCsvPreview([]);
    setPriceCsvRows([]);
    try {
      const text = await file.text();
      const parsed = parsePriceCsv(text);
      if (!parsed.ok) {
        setPriceCsvError(parsed.error);
        return;
      }
      setPriceCsvPreview(parsed.rows.slice(0, 5));
      setPriceCsvRows(parsed.rows);
      setPriceMode("csv");
    } catch {
      setPriceCsvError("Hinnaseeria faili ei õnnestunud lugeda. Proovi uuesti või laadi demo-hinnad.csv.");
    }
  };

  const downloadSamplePriceCsv = () => {
    downloadTextFile(DEMO_PRICES_FILENAME, buildDemoPricesCsv());
  };

  const scrollToResults = () => {
    window.setTimeout(() => {
      resultsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const applyDemoData = () => {
    const consumptionParsed = parseConsumptionCsv(buildDemoConsumptionCsv());
    const pricesParsed = parsePriceCsv(buildDemoPricesCsv());
    if (!consumptionParsed.ok) {
      setCsvError(consumptionParsed.error);
      setValidationMessage("Demo tarbimisandmeid ei õnnestunud laadida.");
      return;
    }
    if (!pricesParsed.ok) {
      setPriceCsvError(pricesParsed.error);
      setValidationMessage("Demo hinnaseeriat ei õnnestunud laadida.");
      return;
    }
    const summary = summarizeConsumptionProfile(consumptionParsed.rows);
    const fields = consumptionProfileToFormFields(summary);
    setInputMode("csv");
    setCsvError(null);
    setCsvFileName(DEMO_CONSUMPTION_FILENAME);
    setCsvPreview(consumptionParsed.rows.slice(0, 5));
    setCsvRows(consumptionParsed.rows);
    setCsvSummary(summary);
    setPriceMode("csv");
    setPriceCsvError(null);
    setPriceCsvFileName(DEMO_PRICES_FILENAME);
    setPriceCsvPreview(pricesParsed.rows.slice(0, 5));
    setPriceCsvRows(pricesParsed.rows);
    setActiveProfile(null);
    setForm({
      ...EMPTY_FORM,
      ...DEMO_RECOMMENDED_INPUTS,
      annualConsumptionMwh: toField(fields.annualConsumptionMwh, 1),
      daytimeSharePercent: toField(fields.daytimeSharePercent, 1),
      peakLoadKw: toField(fields.peakLoadKw, 1),
    });
    setValidationMessage(null);
    setHasCalculated(true);
    setReportGeneratedAt(new Date());
    scrollToResults();
  };

  const handlePrintReport = () => {
    if (!hasCalculated || !hasRequiredInputs) return;
    const previousTitle = document.title;
    document.title = `${SITE_BRAND} tööstusraport`;
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    window.print();
  };

  useEffect(() => {
    if (priceMode !== "elering" || !csvSummary) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      setEleringLoading(true);
      setEleringNote(null);
      try {
        const start = new Date(csvSummary.periodStartMs).toISOString();
        const end = new Date(csvSummary.periodEndMs + 60 * 60 * 1000).toISOString();
        const res = await fetch(
          `/api/elering/nps?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&area=ee`,
        );
        const data = (await res.json()) as MarketPriceSeries & { error?: string };
        if (!res.ok || data.error) {
          throw new Error(data.error || `Eleringi päring ebaõnnestus (${res.status})`);
        }
        if (cancelled) return;
        const exportPrice =
          parseLocaleNumber(form.exportPriceEurPerMwh) ?? INDUSTRIAL_ECONOMICS_DEFAULTS.exportPriceEurPerMwh;
        const rows = eleringPointsToPriceRows(data.points ?? [], exportPrice);
        setEleringRows(rows);
        setEleringNote(
          rows.length > 0
            ? `Eleringi EE NPS on laetud (${data.intervalMinutes} min). Müügihinnaks kasutatakse vormi võrku müügi hinda.`
            : "Eleringist ei tulnud hinna punkte valitud perioodi jaoks. Kasutusel on keskmine ostu- ja müügihind vormilt.",
        );
      } catch (error) {
        if (cancelled) return;
        setEleringRows(null);
        setEleringNote(
          "Eleringi hinnainfo laadimine ebaõnnestus. Kasutusel on keskmine hind vormilt — või vali hinnaseeria CSV.",
        );
        void error;
      } finally {
        if (!cancelled) setEleringLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [priceMode, csvSummary, form.exportPriceEurPerMwh]);

  const handleCalculate = () => {
    if (!hasRequiredInputs) {
      setHasCalculated(false);
      setValidationMessage("Sisesta tarbimine, päevane osakaal, tipukoormus, elektrihind, PV võimsus ja tootlikkus.");
      return;
    }
    setValidationMessage(null);
    setHasCalculated(true);
    setReportGeneratedAt(new Date());
    scrollToResults();
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
        "Elektri ostuhind, võrku müügihind ja võimsustasu määravad aastase kogumõju osad.",
        "PV ja aku ühikinvesteeringud määravad stsenaariumite investeeringu ja tasuvuse.",
        "Päevase tarbimise osakaal määrab, kui palju PV-d saab ilma akuta kohapeal kasutada.",
      ],
    }),
    [form, result.assumptions, csvSummary, csvFileName],
  );

  const reportInputRows = useMemo(
    () => [
      { label: "Ettevõtte / profiili nimi", value: form.companyName.trim() || "Nimetu profiil" },
      { label: "Aastane elektritarbimine", value: `${form.annualConsumptionMwh || "—"} MWh/a` },
      { label: "Päevase tarbimise osakaal", value: `${form.daytimeSharePercent || "—"}%` },
      { label: "Tipukoormus", value: `${form.peakLoadKw || "—"} kW` },
      { label: "PV võimsus", value: `${form.pvPowerKw || "—"} kW` },
      { label: "PV tootlikkus", value: `${form.pvSpecificYieldKwhPerKw || "—"} kWh/kW` },
      { label: "Aku maht", value: `${form.batteryCapacityKwh || "—"} kWh` },
      { label: "Aku võimsus", value: `${form.batteryPowerKw || "—"} kW` },
      {
        label: "Aku kasutamise eesmärk",
        value: form.batteryPurpose === "peak_shaving" ? "Peak shaving" : "Omatarve",
      },
    ],
    [form],
  );

  const reportAssumptionRows = useMemo(
    () => [
      { label: "PV investeering", value: `${form.pvInvestmentEurPerKw || "—"} €/kW` },
      { label: "Aku investeering", value: `${form.batteryInvestmentEurPerKwh || "—"} €/kWh` },
      { label: "Elektri ostuhind", value: `${form.averageElectricityPriceEurPerMwh || "—"} €/MWh` },
      { label: "Võrku müügi hind", value: `${form.exportPriceEurPerMwh || "—"} €/MWh` },
      { label: "Võimsustasu", value: `${form.demandChargeEurPerKwMonth || "—"} €/kW/kuu` },
      { label: "Aku kasutegur", value: `${form.batteryEfficiencyPercent || "—"}%` },
      { label: "Aku kasutatav maht", value: `${form.batteryUsableCapacityPercent || "—"}%` },
    ],
    [form],
  );

  return (
    <>
    <div className="industrial-screen grid max-w-full gap-8 overflow-x-hidden">
      <div className="border border-zinc-700/60 bg-zinc-950/70 px-4 py-3 text-[0.95rem] leading-relaxed text-zinc-300 sm:px-5">
        <p className="font-medium text-zinc-100">Tööstuslik PV + aku · esialgne hinnang</p>
        <p className="mt-1 text-sm text-zinc-400 sm:text-[0.95rem]">
          Sisesta tarbimine, PV ja aku eeldused ning võrdle stsenaariume. Tulemused on hinnangulised —
          mitte lõplik investeerimisotsus. Sisendite ja hindade kvaliteet mõjutab tulemust.
        </p>
      </div>

      <article className="border border-zinc-800/90 bg-zinc-950/50 px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium text-zinc-200">Kuidas alustada</h2>
            <p className="mt-1.5 text-[0.8rem] leading-relaxed text-zinc-500 sm:text-xs">
              1) Andmed (käsitsi või CSV) → 2) Eeldused → 3) Hinnarežiim (CSV korral) → 4) Arvuta → 5)
              Tulemused, stsenaariumid ja raport.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" className="btn-glow w-full sm:w-auto" onClick={applyDemoData}>
              Proovi demoandmetega
            </button>
            <button type="button" className="btn-ghost w-full sm:w-auto" onClick={downloadSampleCsv}>
              Laadi demo-tarbimine.csv
            </button>
            <button type="button" className="btn-ghost w-full sm:w-auto" onClick={downloadSamplePriceCsv}>
              Laadi demo-hinnad.csv
            </button>
            {hasCalculated && hasRequiredInputs ? (
              <button type="button" className="btn-ghost w-full sm:w-auto" onClick={handleReset}>
                Tee uus analüüs
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-2.5 text-[0.75rem] leading-relaxed text-zinc-600">
          Ühe klikiga demo täidab tarbimise, hinnad ning soovituslikud PV/aku väljad ja arvutab tulemuse.
          CSV-faile saab ka eraldi alla laadida.
        </p>
      </article>

      <div>
        <p className="text-sm text-zinc-400">Vali näidisprofiil või sisesta enda andmed.</p>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
          {INDUSTRIAL_SAMPLE_PROFILES.map((profile) => {
            const active = activeProfile === profile.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => applyProfile(profile)}
                className={`border px-3 py-2 text-left transition-colors ${
                  active
                    ? "border-zinc-400/70 bg-zinc-800/70 text-zinc-50"
                    : "border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <span className="block text-sm font-medium text-zinc-100">{profile.title}</span>
                <span className="mt-0.5 line-clamp-2 block text-[0.7rem] leading-snug text-zinc-500">
                  {profile.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm text-zinc-400">Vali, kuidas tarbimisandmed sisestad.</p>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {(
            [
              { id: "manual" as const, title: "Käsitsi sisestamine", description: "Sisesta aastane tarbimine, päevane osakaal ja tipukoormus ise." },
              { id: "csv" as const, title: "CSV import", description: "Kasulik, kui sul on tunni- või 15 min andmed — sisendid täidetakse automaatselt ja saad graafiku." },
            ] as const
          ).map((mode) => {
            const active = inputMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setInputMode(mode.id);
                  if (mode.id === "manual") {
                    clearCsvImport();
                    setHasCalculated(false);
                  }
                }}
                className={`border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "border-zinc-400/70 bg-zinc-800/70 text-zinc-50"
                    : "border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <span className="block text-sm font-medium text-zinc-100">{mode.title}</span>
                <span className="mt-0.5 block text-[0.75rem] leading-snug text-zinc-500">{mode.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {inputMode === "csv" ? (
        <article className="card">
          <h2 className="section-title">CSV tarbimisprofiil</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Laadi üles ettevõtte elektritarbimise fail. Failis peab olema aja veerg (
            <span className="font-mono text-zinc-100">timestamp</span>, <span className="font-mono text-zinc-100">aeg</span>,{" "}
            <span className="font-mono text-zinc-100">date</span> või <span className="font-mono text-zinc-100">datetime</span>) ja
            tarbimise veerg (<span className="font-mono text-zinc-100">consumption_kwh</span>,{" "}
            <span className="font-mono text-zinc-100">tarbimine_kwh</span>, <span className="font-mono text-zinc-100">kwh</span> või{" "}
            <span className="font-mono text-zinc-100">consumption</span>). Eraldajaks sobib koma või semikoolon.
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
              Laadi demo-tarbimine.csv
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

      {inputMode === "csv" && csvRows.length > 0 ? (
        <article className="card">
          <h2 className="section-title">Hinnarežiim ajapõhiseks majanduseks</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Vali, milliste hindadega arvutatakse ajapõhise simulatsiooni rahaline mõju. Hinnad ei muuda aku
            käitumist — need mõjutavad ainult eurodes väljendatud tulemust.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(
              [
                {
                  id: "flat" as const,
                  title: "Keskmine hind",
                  description: "Kasutab allpool sisestatud ostu- ja müügihinda.",
                },
                {
                  id: "csv" as const,
                  title: "Hinnaseeria CSV",
                  description: "Oma tunnihinnad: seo tarbimisread ostu- ja müügihindadega.",
                },
                {
                  id: "elering" as const,
                  title: "Elering EE",
                  description: "Laadi Eesti NPS börsihind CSV perioodi jaoks. Müük = vormi müügihind.",
                },
              ] as const
            ).map((mode) => {
              const active = priceMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setPriceMode(mode.id)}
                  className={`border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-zinc-400/70 bg-zinc-800/70 text-zinc-50"
                      : "border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  <span className="block text-sm font-medium text-zinc-100">{mode.title}</span>
                  <span className="mt-0.5 block text-[0.75rem] leading-snug text-zinc-500">{mode.description}</span>
                </button>
              );
            })}
          </div>

          {priceMode === "flat" ? (
            <p className="mt-4 text-sm text-zinc-400">
              Keskmise hinna režiimis kasutatakse sisestatud ostu- ja müügihindu.
            </p>
          ) : null}

          {priceMode === "csv" && priceCsvRows.length === 0 && !priceCsvError ? (
            <p className="mt-4 text-sm text-zinc-400">
              Laadi hinnaseeria CSV või kasuta demo-hinnad.csv, et siduda hinnad tarbimisprofiiliga.
            </p>
          ) : null}

          {priceMode === "csv" ? (
            <div className="mt-4 border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-sm text-zinc-300">
                Veerud: <span className="font-mono text-zinc-100">timestamp</span>,{" "}
                <span className="font-mono text-zinc-100">buy_price_eur_mwh</span>,{" "}
                <span className="font-mono text-zinc-100">export_price_eur_mwh</span>. Sobib koma või
                semikoolon.
              </p>
              <pre className="mt-3 overflow-x-auto border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-300">
                {SAMPLE_PRICE_CSV}
              </pre>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <label className="btn-ghost w-full cursor-pointer text-center sm:w-auto">
                  <span>Vali hinnaseeria CSV</span>
                  <input
                    ref={priceCsvInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      void handlePriceCsvFile(file);
                    }}
                  />
                </label>
                <button type="button" className="btn-ghost w-full sm:w-auto" onClick={downloadSamplePriceCsv}>
                  Laadi demo-hinnad.csv
                </button>
              </div>
              {priceCsvFileName ? (
                <p className="mt-3 text-xs text-zinc-400">
                  Valitud fail: <span className="text-zinc-200">{priceCsvFileName}</span>
                </p>
              ) : null}
              {priceCsvError ? (
                <p className="mt-3 border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
                  {priceCsvError}
                </p>
              ) : null}
              {priceCsvPreview.length > 0 ? (
                <div className="mt-4 overflow-x-auto border border-zinc-800">
                  <p className="border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100">
                    Eelvaade, esimesed {priceCsvPreview.length} rida
                  </p>
                  <table className="min-w-full text-left text-sm text-zinc-300">
                    <thead className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">timestamp</th>
                        <th className="px-3 py-2 font-medium">buy €/MWh</th>
                        <th className="px-3 py-2 font-medium">export €/MWh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceCsvPreview.map((row, index) => (
                        <tr key={`${row.timestampMs}-${index}`} className="border-t border-zinc-800">
                          <td className="px-3 py-2 font-mono tabular-nums">{row.timestampRaw}</td>
                          <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.buyPriceEurPerMwh, 1)}</td>
                          <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.exportPriceEurPerMwh, 1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}

          {priceMode === "elering" ? (
            <div className="mt-4 border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              {eleringLoading ? <p>Laen Eleringi EE börsihinda…</p> : null}
              {eleringNote ? (
                <p className={eleringRows && eleringRows.length > 0 ? "text-zinc-300" : "text-amber-100"}>
                  {eleringNote}
                </p>
              ) : null}
              {eleringRows && eleringRows.length > 0 ? (
                <p className="mt-2 text-xs text-zinc-400">
                  Laetud {fmt(eleringRows.length, 0)} hinna punkti ·{" "}
                  {eleringRows[0]!.timestampRaw} → {eleringRows[eleringRows.length - 1]!.timestampRaw}
                </p>
              ) : null}
            </div>
          ) : null}

          {priceMatch ? (
            <div className="mt-4 border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              <p>
                Hinnaga seotud tarbimisridu:{" "}
                <span className="font-mono text-zinc-100">
                  {priceMatch.matchedFromSeriesCount} / {csvRows.length}
                </span>
                {priceMatch.unmatchedCount > 0 ? (
                  <>
                    {" "}
                    · sidumata{" "}
                    <span className="font-mono text-amber-100">{priceMatch.unmatchedCount}</span>
                  </>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Sidumine ajatempli järgi: täpne {priceMatch.exactCount}, sama tund{" "}
                {priceMatch.sameHourCount}, lähim {priceMatch.nearestCount}, keskmine varu{" "}
                {priceMatch.fallbackCount}.
              </p>
              {priceMatch.warning ? (
                <p className="mt-3 border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-50">
                  {priceMatch.warning}
                </p>
              ) : null}
            </div>
          ) : null}
        </article>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <article className="card">
          <h2 className="section-title">Sisendid</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
          </div>
          <div className="mt-6 border-t border-zinc-800 pt-4">
            <h3 className="text-sm font-medium text-zinc-100">Majanduslikud eeldused</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              Stsenaariumite investeeringud ja aastane kogumõju arvutatakse nende ühikhindade põhjal.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="field-label">
                <span className="field-label-text">PV investeering (€/kW)</span>
                <input
                  className="input"
                  value={form.pvInvestmentEurPerKw}
                  inputMode="decimal"
                  onChange={(e) => setField("pvInvestmentEurPerKw", e.target.value)}
                  placeholder="nt 700"
                />
              </label>
              <label className="field-label">
                <span className="field-label-text">Aku investeering (€/kWh)</span>
                <input
                  className="input"
                  value={form.batteryInvestmentEurPerKwh}
                  inputMode="decimal"
                  onChange={(e) => setField("batteryInvestmentEurPerKwh", e.target.value)}
                  placeholder="nt 350"
                />
              </label>
              <label className="field-label">
                <span className="field-label-text">Elektri ostuhind (€/MWh)</span>
                <input
                  className="input"
                  value={form.averageElectricityPriceEurPerMwh}
                  inputMode="decimal"
                  onChange={(e) => setField("averageElectricityPriceEurPerMwh", e.target.value)}
                  placeholder="nt 110"
                />
                <span className="field-hint">Kohapeal kasutatud PV väärtus.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Võrku müüdava elektri hind (€/MWh)</span>
                <input
                  className="input"
                  value={form.exportPriceEurPerMwh}
                  inputMode="decimal"
                  onChange={(e) => setField("exportPriceEurPerMwh", e.target.value)}
                  placeholder="nt 45"
                />
              </label>
              <label className="field-label">
                <span className="field-label-text">Võimsustasu (€/kW/kuu)</span>
                <input
                  className="input"
                  value={form.demandChargeEurPerKwMonth}
                  inputMode="decimal"
                  onChange={(e) => setField("demandChargeEurPerKwMonth", e.target.value)}
                  placeholder="nt 6,5"
                />
                <span className="field-hint">Kasutatakse peak shaving režiimis.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Aku kasutegur (%)</span>
                <input
                  className="input"
                  value={form.batteryEfficiencyPercent}
                  inputMode="decimal"
                  onChange={(e) => setField("batteryEfficiencyPercent", e.target.value)}
                  placeholder="nt 90"
                />
              </label>
              <label className="field-label sm:col-span-2">
                <span className="field-label-text">Aku kasutatav maht (%)</span>
                <input
                  className="input"
                  value={form.batteryUsableCapacityPercent}
                  inputMode="decimal"
                  onChange={(e) => setField("batteryUsableCapacityPercent", e.target.value)}
                  placeholder="nt 80"
                />
                <span className="field-hint">
                  Kasutatav osa tsükli kohta = kasutegur × kasutatav maht (nt 90% × 80% = 72%).
                </span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-glow w-full sm:w-auto" onClick={handleCalculate}>
              Arvuta tulemus
            </button>
            <button type="button" className="btn-ghost w-full sm:w-auto" onClick={handleReset}>
              Tee uus analüüs
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
          {!hasCalculated ? (
            <div className="mb-2 border border-zinc-800/90 bg-zinc-950/80 px-4 py-5 sm:px-5 sm:py-6">
              <p className="text-base font-medium text-zinc-100">Tulemused ilmuvad pärast arvutust</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Täida sisendid, vali näidisprofiil või vajuta „Proovi demoandmetega“.
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-zinc-400">
                <li>aastane kogumõju, omatarve, tipukoormus ja tasuvusaeg</li>
                <li>energiavoogude ja stsenaariumite graafikud</li>
                <li>ajapõhine simulatsioon (CSV korral)</li>
              </ul>
            </div>
          ) : null}

          {hasCalculated && hasRequiredInputs ? (
            <p className="text-sm leading-relaxed text-zinc-500">
              Põhinäitajad on allpool. Üksikasjad, graafikud ja stsenaariumid järgnevad pärast kokkuvõtet.
            </p>
          ) : hasCalculated ? (
            <p className="text-sm text-zinc-400">Sisesta vajalikud andmed, et näha tulemusi.</p>
          ) : null}
        </article>
      </div>

      <div ref={resultsAnchorRef} />
      {!hasCalculated ? <IndustrialChartsEmptyState /> : null}
      {hasCalculated && hasRequiredInputs ? (
        <section className="industrial-kpi-board" aria-label="Põhitulemused">
          <header className="industrial-kpi-board-head">
            <div>
              <h2>Põhitulemused</h2>
              <p>Esmane aastane hinnang sisestatud tarbimise, PV ja aku eelduste põhjal.</p>
            </div>
            <button type="button" className="btn-glow industrial-report-cta" onClick={handlePrintReport}>
              Laadi PDF raport
            </button>
          </header>
          <article className="industrial-kpi-hero">
            <div>
              <p className="industrial-kpi-label">Aastane kogumõju</p>
              <p className="industrial-kpi-value industrial-kpi-value-hero">
                <strong>{fmt(result.annualSavingsEur, 0)}</strong>
                <span>€/a</span>
              </p>
            </div>
            <p className="industrial-kpi-hint">
              Aastane kogumõju sisaldab omatarbe säästu, võrku müügi tulu ja vajadusel võimsustasu säästu.
            </p>
          </article>
          <div className="industrial-kpi-dash">
            <article className="industrial-kpi-card">
              <p className="industrial-kpi-label">Omatarbe osakaal</p>
              <p className="industrial-kpi-value">
                <strong>{fmt(result.selfConsumptionSharePercent, 0)}</strong>
                <span>%</span>
              </p>
              <p className="industrial-kpi-hint">
                Omatarbe osakaal näitab, kui suur osa PV toodangust kasutatakse kohapeal.
              </p>
            </article>
            <article className="industrial-kpi-card">
              <p className="industrial-kpi-label">Tipukoormus enne → pärast</p>
              <p className="industrial-kpi-value">
                <strong>
                  {fmt(result.peakLoadBeforeKw, 0)} → {fmt(result.peakLoadAfterKw, 0)}
                </strong>
                <span>kW</span>
              </p>
              <p className="industrial-kpi-hint">
                Tipukoormus näitab aku mõju peak shaving režiimis.
              </p>
            </article>
            <article className="industrial-kpi-card">
              <p className="industrial-kpi-label">Tasuvusaeg</p>
              <p className="industrial-kpi-value">
                <strong>{result.paybackYears != null ? fmt(result.paybackYears, 1) : "—"}</strong>
                {result.paybackYears != null ? <span>a</span> : null}
              </p>
              <p className="industrial-kpi-hint">
                Tasuvus on lihtsustatud hinnang sisestatud eelduste põhjal.
              </p>
            </article>
          </div>
        </section>
      ) : null}
      {hasCalculated && hasRequiredInputs ? <IndustrialResultCharts result={result} /> : null}
      {hasCalculated && hasRequiredInputs ? (
        <IndustrialResultsDashboard
          result={result}
          interpretation={interpretation}
          scenarioComparison={scenarioComparison}
          timeseriesResult={timeseriesResult}
          annualConsumptionMwh={toNumber(form.annualConsumptionMwh)}
          priceModeLabel={priceModeLabel}
          priceMatch={priceMatch}
          csvChartSeries={csvChartSeries}
          assumptions={assumptionsInfo}
          onPrintReport={handlePrintReport}
        />
      ) : null}

      <article className="border border-zinc-800 bg-zinc-950/60 px-4 py-4">
        <h2 className="text-sm font-medium text-zinc-100">Eeldused ja piirangud</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-zinc-400">
          <li>Tulemused on hinnangulised; see ei ole lõplik investeerimisotsus.</li>
          <li>Sisendandmete kvaliteet (tarbimine, hinnad, investeeringud) mõjutab tulemust.</li>
          <li>Börsihinnad ja investeeringuhinnad võivad aja jooksul muutuda.</li>
          <li>PV tootmisprofiil on lihtsustatud; aku töötab reeglite, mitte börsioptimeerija järgi.</li>
          <li>Lühike CSV skaleeritakse aastaseks hinnanguks; hinnaseeria mõjutab euroarvestust, mitte aku käitumist.</li>
        </ul>
      </article>
    </div>
    {hasCalculated && hasRequiredInputs ? (
      <IndustrialReportPrint
        companyName={form.companyName.trim() || "Nimetu profiil"}
        generatedAt={reportGeneratedAt}
        result={result}
        interpretation={interpretation}
        inputRows={reportInputRows}
        assumptionRows={reportAssumptionRows}
        scenarioComparison={scenarioComparison}
        timeseries={timeseriesResult}
      />
    ) : null}
    </>
  );
}

