"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { calculateSolarComparison } from "@/lib/calculators/solar";
import { CalculatorInput } from "@/types/calculator";
import { canViewFullAnalysis } from "@/lib/unlock";
import { clientDownloadPdf } from "@/lib/pdf/client-download";
import { CalculatorPdfActions } from "@/components/calculator-pdf-actions";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";
import { FEATURES } from "@/lib/features";
import { UsedAssumptionsBlock } from "@/components/used-assumptions-block";
import { AdvancedInputAccordion } from "@/components/advanced-input-accordion";
import { ChartCard } from "@/components/charts/ChartCard";
import { toNumber } from "@/lib/units";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
  selfConsumptionWithoutBatteryPercent: 0,
  selfConsumptionBoostWithBatteryPercent: 15,
  degradationPercent: 0.6,
  periodYears: 20,
  location: "",
  specificYieldKwhPerKw: 975,
  inverterReplacementYear: 12,
  inverterReplacementCostEur: 1200,
  batteryEfficiencyPercent: 92,
};

type NordPoolState = { loading: boolean; message: string; source: "live" | "fallback" | "none" };
type PvgisResult = {
  source: "live" | "fallback" | "none";
  annualProductionKwh: number | null;
  monthlyProductionKwh: Array<{ month: number; productionKwh: number }>;
  specificYieldKwhPerKw: number | null;
};
const PVGIS_FALLBACK_UI_MESSAGE =
  "PVGIS andmeid ei saanud hetkel laadida. Arvutus kasutab üldist tootluse eeldust.";

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
    <label className="field-label" data-form-group="true">
      <span className="field-label-text block">{label}</span>
      {children}
      {hint ? (
        <span className="field-hint block">{hint}</span>
      ) : (
        // Hoia valjade korgus uhtlane ilma teksti kokkujooksmiseta HTML valjavottes.
        <span className="field-hint block" aria-hidden="true">
          &nbsp;
        </span>
      )}
    </label>
  );
}

function numValue(value: number): string | number {
  return value === 0 ? "" : value;
}

function parseCoordinate(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function directionToAzimuth(direction: CalculatorInput["panelDirection"]): number {
  if (direction === "ida-laas") return -90;
  return 0;
}

const MONTH_NAMES_ET = [
  "",
  "Jaanuar",
  "Veebruar",
  "Märts",
  "Aprill",
  "Mai",
  "Juuni",
  "Juuli",
  "August",
  "September",
  "Oktoober",
  "November",
  "Detsember",
];

type PresetLocation = "tallinn" | "tartu" | "parnu" | "narva" | "rakvere" | "viljandi" | "voru" | "kuressaare" | "manual";

const LOCATION_PRESETS: Record<Exclude<PresetLocation, "manual">, { latitude: string; longitude: string }> = {
  tallinn: { latitude: "59.437", longitude: "24.7536" },
  tartu: { latitude: "58.3776", longitude: "26.7290" },
  parnu: { latitude: "58.3859", longitude: "24.4971" },
  narva: { latitude: "59.3772", longitude: "28.1903" },
  rakvere: { latitude: "59.3464", longitude: "26.3557" },
  viljandi: { latitude: "58.3639", longitude: "25.59" },
  voru: { latitude: "57.8480", longitude: "26.9993" },
  kuressaare: { latitude: "58.2481", longitude: "22.5039" },
};

export function SolarCalculatorPage() {
  const [mode, setMode] = useState<"quick" | "advanced">("quick");
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
  const [hasCalculated, setHasCalculated] = useState(false);
  const [highlightCalculator, setHighlightCalculator] = useState(false);
  const [nordPoolState, setNordPoolState] = useState<NordPoolState>({
    loading: false,
    message: "",
    source: "none",
  });
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [presetLocation, setPresetLocation] = useState<PresetLocation>("manual");
  const [pvgisSlopeDeg, setPvgisSlopeDeg] = useState("");
  const [pvgisAzimuthDeg, setPvgisAzimuthDeg] = useState("");
  const [pvgisLossesPercent, setPvgisLossesPercent] = useState("");
  const [pvgisStatusMessage, setPvgisStatusMessage] = useState("");
  const [pvgisResult, setPvgisResult] = useState<PvgisResult>({
    source: "none",
    annualProductionKwh: null,
    monthlyProductionKwh: [],
    specificYieldKwhPerKw: null,
  });
  const [result, setResult] = useState(() => calculateSolarComparison(defaults));

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

  const draftResult = useMemo(() => calculateSolarComparison(input), [input]);

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
    if (input.pvPowerKw <= 0) list.push("Süsteemi võimsus peab olema suurem kui 0.");
    if (input.annualConsumptionKwh <= 0) list.push("Aastane tarbimine peab olema suurem kui 0.");
    if ((input.priceSource === "manual" ? input.manualSpotPrice : input.nordPoolAveragePrice) < 0)
      list.push("Elektri hind ei tohi olla negatiivne.");
    if (input.hasBattery && input.batteryCapacityKwh <= 0)
      list.push("Akuga stsenaariumis lisa aku mahtuvus.");
    if (mode === "advanced" && input.batteryEfficiencyPercent > 0 && input.batteryEfficiencyPercent > 100)
      list.push("Aku efektiivsus peab olema vahemikus 0...100%.");
    return list;
  }, [input, mode]);
  const hasRequiredInputs =
    input.pvPowerKw > 0 &&
    input.annualConsumptionKwh > 0 &&
    (input.priceSource === "manual" ? input.manualSpotPrice > 0 : input.nordPoolAveragePrice > 0);

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

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrors(validationErrors);
    if (validationErrors.length > 0) {
      setHasCalculated(false);
      return;
    }
    let nextInput = input;
    const parsedLat = parseCoordinate(latitude);
    const parsedLon = parseCoordinate(longitude);
    const losses = toNumber(pvgisLossesPercent);
    const slope = toNumber(pvgisSlopeDeg);
    const azimuth = toNumber(pvgisAzimuthDeg);
    const hasCoordinates = latitude.trim().length > 0 && longitude.trim().length > 0;
    setPvgisStatusMessage("");
    if (hasCoordinates) {
      if (parsedLat === null || parsedLon === null) {
        nextInput = { ...input, annualProductionKwh: 0 };
        setInput(nextInput);
        setPvgisResult({
          source: "fallback",
          annualProductionKwh: null,
          monthlyProductionKwh: [],
          specificYieldKwhPerKw: null,
        });
        setPvgisStatusMessage(PVGIS_FALLBACK_UI_MESSAGE);
      } else {
      try {
        const response = await fetch(
          `/api/pvgis?lat=${encodeURIComponent(String(parsedLat))}&lon=${encodeURIComponent(String(parsedLon))}&systemKw=${encodeURIComponent(String(input.pvPowerKw > 0 ? input.pvPowerKw : 1))}&slope=${encodeURIComponent(String(slope > 0 ? slope : 35))}&azimuth=${encodeURIComponent(String(Number.isFinite(azimuth) ? azimuth : directionToAzimuth(input.panelDirection)))}&losses=${encodeURIComponent(String(losses > 0 ? losses : 14))}`,
        );
        if (!response.ok) {
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.error("PVGIS API error", response.status);
          }
          throw new Error("PVGIS API päring ebaõnnestus");
        }
        const data = (await response.json()) as {
          source: "live" | "fallback";
          specificYieldKwhPerKw?: number;
          annualProductionKwh?: number;
          monthlyProductionKwh?: Array<{ month: number; productionKwh: number }>;
          message: string;
        };
        if (data.source === "live" && Number.isFinite(data.annualProductionKwh) && (data.annualProductionKwh as number) > 0) {
          nextInput = {
            ...input,
            annualProductionKwh: data.annualProductionKwh as number,
          };
          setInput(nextInput);
          setPvgisResult({
            source: "live",
            annualProductionKwh: Number.isFinite(data.annualProductionKwh) ? (data.annualProductionKwh as number) : null,
            monthlyProductionKwh: Array.isArray(data.monthlyProductionKwh) ? data.monthlyProductionKwh : [],
            specificYieldKwhPerKw: Number.isFinite(data.specificYieldKwhPerKw) ? (data.specificYieldKwhPerKw as number) : null,
          });
          setPvgisStatusMessage(data.message);
        } else {
          nextInput = { ...input, annualProductionKwh: 0 };
          setInput(nextInput);
          setPvgisResult({
            source: "fallback",
            annualProductionKwh: null,
            monthlyProductionKwh: [],
            specificYieldKwhPerKw: null,
          });
          setPvgisStatusMessage(PVGIS_FALLBACK_UI_MESSAGE);
        }
      } catch {
        nextInput = { ...input, annualProductionKwh: 0 };
        setInput(nextInput);
        setPvgisResult({
          source: "fallback",
          annualProductionKwh: null,
          monthlyProductionKwh: [],
          specificYieldKwhPerKw: null,
        });
        setPvgisStatusMessage(PVGIS_FALLBACK_UI_MESSAGE);
      }
      }
    } else {
      nextInput = { ...input, annualProductionKwh: 0 };
      setInput(nextInput);
      setPvgisResult({
        source: "fallback",
        annualProductionKwh: null,
        monthlyProductionKwh: [],
        specificYieldKwhPerKw: null,
      });
    }
    setIsCalculating(true);
    window.setTimeout(() => {
      setResult(calculateSolarComparison(nextInput));
      setHasCalculated(true);
      setIsCalculating(false);
    }, 700);
  };

  const handleReset = () => {
    setInput(defaults);
    setPriceText({
      manualSpotPrice: "",
      nordPoolAveragePrice: "",
      gridFeePrice: "",
      sellBackPrice: "",
      marginPrice: "",
    });
    setErrors([]);
    setIsCalculating(false);
    setHasCalculated(false);
    setNordPoolState({
      loading: false,
      message: "",
      source: "none",
    });
    setLatitude("");
    setLongitude("");
    setPresetLocation("manual");
    setPvgisSlopeDeg("");
    setPvgisAzimuthDeg("");
    setPvgisLossesPercent("");
    setPvgisStatusMessage("");
    setPvgisResult({
      source: "none",
      annualProductionKwh: null,
      monthlyProductionKwh: [],
      specificYieldKwhPerKw: null,
    });
    setResult(calculateSolarComparison(defaults));
  };

  const scrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlightCalculator(true);
    window.setTimeout(() => setHighlightCalculator(false), 900);
  };

  const downloadPdf = async () => {
    if (!projectId) return;
    const out = await clientDownloadPdf(projectId, unlock, {
      calculatorType: "paikesejaam",
      summary:
        "Kokkuvõte on koostatud sisestatud andmete ning valitud eelduste põhjal päikesejaama tasuvuse hindamiseks.",
      analysisBasis: mode === "advanced" ? "advanced" : "defaults",
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
      formulas: [
        {
          label: "Arvutuse metoodika",
          value:
            "Analüüs põhineb kasutaja sisestatud andmetel, valitud eeldustel ja süsteemis kasutataval arvutusmudelil. Tulemused on hinnangulised ning sõltuvad sisendandmete täpsusest.",
        },
      ],
      risksAndLimits: [
        {
          label: "Elektrihind",
          value: "Tulemus sõltub oluliselt elektrihinna arengust ja omatarbe osakaalust.",
        },
        {
          label: "Tootlikkus",
          value: "Ilmastik, varjutus ja tehniline seisukord võivad tegelikku tootmist muuta.",
        },
        {
          label: "Piirang",
          value: "Raport on informatiivne hinnang ega asenda detailprojekti.",
        },
      ],
      disclaimer:
        "Analüüs põhineb kasutaja sisestatud andmetel ja eeldustel. Tegu on informatiivse tööriistaga, mitte siduva finants- ega investeerimisnõuga.",
      metrics: [
        { label: "Hinnanguline aastane sääst", value: `${formatNum(result.selected.annualSavingsEur, 0)} €` },
        {
          label: "Lihtne tasuvusaeg",
          value: result.paybackYears !== null ? `${result.paybackYears.toFixed(1)} a` : "—",
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
    }, "energiakalkulaator-paikesejaama-analuus.pdf");
    if (!out.ok) setMessage(out.error);
  };

  const fmtEur = (value: number) => `${formatNum(value, 0)} €`;
  const fmtKwh = (value: number) => `${formatNum(value, 0)} kWh`;
  const isEmptyInputs =
    input.annualConsumptionKwh <= 0 || (input.annualProductionKwh <= 0 && input.pvPowerKw <= 0);
  const assumptionsInfo = useMemo(() => {
    const userInputs: string[] = [];
    if (input.pvPowerKw > 0) userInputs.push(`Süsteemi võimsus: ${formatNum(input.pvPowerKw, 1)} kW`);
    if (input.annualConsumptionKwh > 0) userInputs.push(`Aastane tarbimine: ${formatNum(input.annualConsumptionKwh, 0)} kWh`);
    if (input.pvCostEur > 0) userInputs.push(`Investeering: ${formatNum(input.pvCostEur, 0)} €`);
    if (input.selfConsumptionWithoutBatteryPercent > 0) userInputs.push(`Omatarve: ${formatNum(input.selfConsumptionWithoutBatteryPercent, 0)}%`);
    if (mode === "advanced" && input.location.trim()) userInputs.push(`Asukoht: ${input.location}`);

    const defaultsUsed: string[] = [];
    if (mode === "quick") defaultsUsed.push("Tootluse eeldus: Eesti vaikimisi tootlikkus (900-1050 kWh/kW/a).");
    if (!input.location.trim()) defaultsUsed.push("Asukoha täpsustus puudub, kasutati üldist Eesti eeldust.");
    if (mode === "advanced" && input.degradationPercent === defaults.degradationPercent) defaultsUsed.push("Paneelide degradatsioon: 0,6% aastas.");
    if (mode === "advanced" && input.discountRatePercent === defaults.discountRatePercent) defaultsUsed.push("Diskontomäär: 4%.");

    const apiValues =
      input.priceSource === "nordpool"
        ? [`Nord Pool keskmine hind: ${formatNum(input.nordPoolAveragePrice, 3)} €/kWh`]
        : [];

    return {
      userInputs,
      defaultAssumptions: defaultsUsed,
      apiValues,
      mostInfluentialInputs: [
        "Elektri ostuhind ja selle kasv",
        "Süsteemi võimsus ja tootlikkus",
        "Omatarbe osakaal",
      ],
    };
  }, [input, mode]);

  const sanityWarnings = useMemo(() => {
    const warnings: string[] = [];
    const effectivePrice = draftResult.effectiveEnergyPrice;
    if (effectivePrice > 0 && (effectivePrice < 0.03 || effectivePrice > 0.6)) {
      warnings.push(
        `Elektri hind (${formatNum(effectivePrice, 3)} €/kWh) tundub ebatavaline. Kontrolli, et ühik oleks €/kWh, mitte €/MWh.`,
      );
    }
    if (input.pvPowerKw > 0 && (input.pvPowerKw < 1 || input.pvPowerKw > 500)) {
      warnings.push("Süsteemi võimsus tundub ebarealistlik. Kontrolli, et sisestasid kW, mitte W või MW.");
    }
    if (result.selected.annualNetBenefitEur <= 0) {
      warnings.push("Netokasu on null või negatiivne - selle sisendi korral ei ole investeering praegu tasuv.");
    }
    return warnings;
  }, [draftResult.effectiveEnergyPrice, input.pvPowerKw, result.selected.annualNetBenefitEur]);
  const bestMonth = useMemo(() => {
    if (!pvgisResult.monthlyProductionKwh.length) return null;
    return pvgisResult.monthlyProductionKwh.reduce((best, current) =>
      current.productionKwh > best.productionKwh ? current : best,
    );
  }, [pvgisResult.monthlyProductionKwh]);
  const worstMonth = useMemo(() => {
    if (!pvgisResult.monthlyProductionKwh.length) return null;
    return pvgisResult.monthlyProductionKwh.reduce((worst, current) =>
      current.productionKwh < worst.productionKwh ? current : worst,
    );
  }, [pvgisResult.monthlyProductionKwh]);
  const pvgisMonthlyChartData = useMemo(() => {
    const byMonth = new Map<number, number>();
    for (const item of pvgisResult.monthlyProductionKwh) {
      byMonth.set(item.month, item.productionKwh);
    }
    return Array.from({ length: 12 }, (_, idx) => {
      const month = idx + 1;
      return {
        month,
        label: (MONTH_NAMES_ET[month] ?? `Kuu ${month}`).slice(0, 3),
        fullLabel: MONTH_NAMES_ET[month] ?? `Kuu ${month}`,
        productionKwh: byMonth.get(month) ?? 0,
      };
    });
  }, [pvgisResult.monthlyProductionKwh]);

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
            <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
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
                    label="Aastane elektritarbimine (kWh)"
                  >
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
                  <Field label="Elektri ostuhind (€/kWh)">
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
                  <Field label="Omatarbe protsent (%)">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={numValue(input.selfConsumptionWithoutBatteryPercent)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        setInput({
                          ...input,
                          selfConsumptionWithoutBatteryPercent: toNumber(e.target.value),
                        })
                      }
                      placeholder="nt 55"
                    />
                  </Field>
                  <Field label="Investeering (€)">
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
                </div>
              </article>

              {mode === "advanced" ? (
              <article className="card">
                <div className="mb-3 flex justify-end">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() =>
                      setInput((prev) => ({
                        ...prev,
                        specificYieldKwhPerKw: 975,
                        degradationPercent: 0.6,
                        annualPriceGrowthPercent: 3,
                        discountRatePercent: 4,
                        inverterReplacementYear: 12,
                        inverterReplacementCostEur: 1200,
                        batteryEfficiencyPercent: 92,
                      }))
                    }
                  >
                    Taasta vaikimisi
                  </button>
                </div>
                <AdvancedInputAccordion title="2) Hinnad ja kulud" defaultOpen>
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
                </AdvancedInputAccordion>
              </article>
              ) : null}

              {mode === "advanced" ? (
              <article className="card">
                <AdvancedInputAccordion title="1) Põhiandmed" defaultOpen>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Asukoht / maakond">
                    <input
                      className="input"
                      type="text"
                      value={input.location}
                      onChange={(e) => setInput({ ...input, location: e.target.value })}
                      placeholder="nt Harjumaa"
                    />
                  </Field>
                  <Field label="Asukoha valik">
                    <select
                      className="input"
                      value={presetLocation}
                      onChange={(e) => {
                        const next = e.target.value as PresetLocation;
                        setPresetLocation(next);
                        if (next === "manual") return;
                        const preset = LOCATION_PRESETS[next];
                        if (!preset) return;
                        setLatitude(preset.latitude);
                        setLongitude(preset.longitude);
                      }}
                    >
                      <option value="tallinn">Tallinn</option>
                      <option value="tartu">Tartu</option>
                      <option value="parnu">Pärnu</option>
                      <option value="narva">Narva</option>
                      <option value="rakvere">Rakvere</option>
                      <option value="viljandi">Viljandi</option>
                      <option value="voru">Võru</option>
                      <option value="kuressaare">Kuressaare</option>
                      <option value="manual">Sisestan ise</option>
                    </select>
                  </Field>
                  {presetLocation === "manual" ? (
                    <>
                      <Field label="Laiuskraad">
                        <input
                          className="input"
                          type="text"
                          inputMode="decimal"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          placeholder="nt 59.437"
                        />
                      </Field>
                      <Field label="Pikkuskraad">
                        <input
                          className="input"
                          type="text"
                          inputMode="decimal"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          placeholder="nt 24.7536"
                        />
                      </Field>
                    </>
                  ) : null}
                  <Field label="Spetsiifiline tootlus (kWh/kW/a)" hint="Vaikimisi Eesti vahemik 900-1050.">
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      value={numValue(input.specificYieldKwhPerKw)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, specificYieldKwhPerKw: toNumber(e.target.value) })}
                      placeholder="nt 975"
                    />
                  </Field>
                </div>
                </AdvancedInputAccordion>
                <div className="mt-3" />
                <AdvancedInputAccordion title="3) Tehnilised eeldused" defaultOpen>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Paneelide suund">
                    <select className="input" value={input.panelDirection} onChange={(e) => setInput({ ...input, panelDirection: e.target.value as CalculatorInput["panelDirection"] })}>
                      <option value="louna">Louna</option>
                      <option value="ida-laas">Ida-laas</option>
                      <option value="muu">Muu</option>
                    </select>
                  </Field>
                  <Field label="Paneelide kalle kraadides">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={pvgisSlopeDeg}
                      onChange={(e) => setPvgisSlopeDeg(e.target.value)}
                      placeholder="nt 35"
                    />
                  </Field>
                  <Field label="Paneelide suund">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={pvgisAzimuthDeg}
                      onChange={(e) => setPvgisAzimuthDeg(e.target.value)}
                      placeholder="nt 0 lõuna"
                    />
                  </Field>
                  <Field label="Paneelide kalle (olemasolev mudeli sisend)">
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      value={numValue(input.tiltDeg)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, tiltDeg: toNumber(e.target.value) })}
                      placeholder="nt 35"
                    />
                  </Field>
                  <Field label="Süsteemikaod %">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={pvgisLossesPercent}
                      onChange={(e) => setPvgisLossesPercent(e.target.value)}
                      placeholder="nt 14"
                    />
                  </Field>
                  <Field label="Varjutus (%)">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={input.shadingPercent === 0 ? "0" : numValue(input.shadingPercent)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, shadingPercent: toNumber(e.target.value) })}
                      placeholder="nt 8"
                    />
                  </Field>
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
                  <Field label="Paneelide degradatsioon (%/a)">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={numValue(input.degradationPercent)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, degradationPercent: toNumber(e.target.value) })}
                      placeholder="nt 0,6"
                    />
                  </Field>
                  <Field label="Elektrihinna kasv (%/a)">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={numValue(input.annualPriceGrowthPercent)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, annualPriceGrowthPercent: toNumber(e.target.value) })}
                      placeholder="nt 3"
                    />
                  </Field>
                  <Field label="Diskontomäär (%)">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={numValue(input.discountRatePercent)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, discountRatePercent: toNumber(e.target.value) })}
                      placeholder="nt 4"
                    />
                  </Field>
                </div>
                </AdvancedInputAccordion>
                <div className="mt-3" />
                <AdvancedInputAccordion title="4) Täpsemad seaded" defaultOpen>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Inverteri vahetuse aasta">
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      value={numValue(input.inverterReplacementYear)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, inverterReplacementYear: toNumber(e.target.value) })}
                      placeholder="nt 12"
                    />
                  </Field>
                  <Field label="Inverteri vahetuse kulu (€)">
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      value={numValue(input.inverterReplacementCostEur)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, inverterReplacementCostEur: toNumber(e.target.value) })}
                      placeholder="nt 1200"
                    />
                  </Field>
                  <Field label="Aku olemasolu">
                    <div className="yes-no-row">
                      <span className="yes-no-text">Ei</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={input.hasBattery}
                        className={`yes-no-switch ${input.hasBattery ? "is-on" : ""}`}
                        onClick={() => setInput({ ...input, hasBattery: !input.hasBattery })}
                      >
                        <span className="yes-no-knob" />
                      </button>
                      <span className="yes-no-text">Jah</span>
                    </div>
                  </Field>
                  <Field label="Aku maht (kWh)">
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
                  <Field label="Aku investeering (€)">
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
                  <Field label="Aku efektiivsus (%)">
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={numValue(input.batteryEfficiencyPercent)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setInput({ ...input, batteryEfficiencyPercent: toNumber(e.target.value) })}
                      placeholder="nt 92"
                    />
                  </Field>
                </div>
                <p className="mt-3 text-xs text-zinc-400">
                  Kui jätad asukoha täitmata, kasutatakse üldist Eesti tootluse eeldust.
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  Vaikimisi kasutatakse Eesti tootlikkuse vahemikku (900-1050 kWh/kW/a), kui täpsem asukohapõhine tootlus puudub.
                </p>
                {pvgisStatusMessage ? (
                  <p className="mt-2 text-xs text-cyan-200">{pvgisStatusMessage}</p>
                ) : null}
                </AdvancedInputAccordion>
              </article>
              ) : null}
            </div>

            {errors.length > 0 ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {errors.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-glow w-fit">
                {isCalculating ? "Arvutan..." : "Arvuta tulemus"}
              </button>
              <button type="button" className="btn-ghost w-fit" onClick={handleReset}>
                Lähtesta
              </button>
            </div>
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
          <p className="mt-2 text-sm text-zinc-300">
            Mida see tähendab? Allolevad näitajad annavad kiire pildi, kui suur võiks olla aastane rahaline võit ja
            kui kiiresti investeering võiks tagasi tulla.
          </p>
          {!hasCalculated ? (
            <div className="mt-4 rounded-2xl border border-white/12 bg-white/[0.03] p-4 text-sm text-zinc-300">
              <p className="font-medium text-zinc-100">Sisesta andmed ja vajuta "Arvuta tulemus".</p>
            </div>
          ) : null}
          {hasCalculated ? (
          <p className="mt-2 text-zinc-300">
            Efektiivne elektri hind arvutuses:{" "}
            <strong>{formatNum(result.effectiveEnergyPrice, 3)} €/kWh</strong>
          </p>
          ) : null}
          {hasCalculated ? (
            <p className="mt-1 text-sm text-zinc-300">
              Tootlusallikas: <strong>{pvgisResult.source === "live" ? "PVGIS" : "üldine Eesti eeldus"}</strong>
            </p>
          ) : null}
          {hasCalculated && sanityWarnings.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">
              <p className="font-medium">Kontrolli sisendeid enne otsust</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {sanityWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {hasCalculated && result.usedPriceUnit === "eur_per_mwh_converted" ? (
            <p className="mt-2 text-sm text-amber-200">
              Tuvastati sisend €/MWh kujul ja teisendati automaatselt €/kWh väärtuseks.
            </p>
          ) : null}
          {hasCalculated && hasRequiredInputs ? (
            <>
          <div className="mt-5 rounded-2xl border border-emerald-300/30 bg-emerald-400/15 p-5 shadow-[0_0_30px_rgba(16,185,129,0.14)]">
            <p className="text-xs uppercase tracking-wide text-emerald-100/80">Peamine tulemus</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <strong className="text-4xl font-semibold text-emerald-100 sm:text-5xl">
                {Math.round(result.selected.annualNetBenefitEur).toLocaleString("et-EE")}
              </strong>
              <span className="pb-1 text-base text-emerald-50/90 sm:text-lg">EUR/a</span>
            </div>
            <p className="mt-2 text-sm text-emerald-50/90">
              Selle sisendi põhjal on hinnanguline aastane netokasu sellises suurusjärgus.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="metric-card metric-card-primary metric-card-accent-emerald">
              <p className="metric-label">Olulisim: aastane netokasu</p>
              <div className="metric-main">
                <strong className="metric-value">
                  {Math.round(result.selected.annualNetBenefitEur).toLocaleString("et-EE")}
                </strong>
                <span className="metric-unit">EUR/a</span>
              </div>
              <p className="metric-help">Aastane sääst + müügitulu - hoolduskulu.</p>
            </div>
            <div className="metric-card metric-card-accent-teal">
              <p className="metric-label">Aastane tootmine</p>
              <div className="metric-main">
                <strong className="metric-value">{formatNum(result.selected.annualProductionKwh, 0)}</strong>
                <span className="metric-unit">kWh</span>
              </div>
              <p className="metric-help">Valemi põhjal arvutatud aastane tootlikkus.</p>
            </div>
            <div className="metric-card metric-card-accent-teal">
              <p className="metric-label">Aastane sääst</p>
              <div className="metric-main">
                <strong className="metric-value">{formatNum(result.selected.annualSavingsEur, 0)}</strong>
                <span className="metric-unit">EUR/a</span>
              </div>
              <p className="metric-help">Omatarbe osa rahaline mõju aastas.</p>
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
              <p className="metric-label">Omatarve</p>
              <div className="metric-main">
                <strong className="metric-value">{formatNum(result.selected.selfConsumptionRatePercent, 1)}</strong>
                <span className="metric-unit">%</span>
              </div>
              <p className="metric-help">Toodangust kohapeal ära kasutatud osa.</p>
            </div>
            <div className="metric-card metric-card-accent-teal">
              <p className="metric-label">Lihtne tasuvusaeg</p>
              <div className="metric-main">
                <strong className="metric-value">
                  {result.paybackYears !== null
                    ? result.paybackYears.toFixed(1)
                    : "Antud sisenditega tasuvusaega ei saa arvutada."}
                </strong>
                {result.paybackYears !== null ? <span className="metric-unit">a</span> : null}
              </div>
              <p className="metric-help">Kui netokasu ≤ 0, tasuvusaega numbrina ei kuvata.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="metric-card metric-card-accent-emerald">
              <p className="metric-label">NPV</p>
              <div className="metric-main">
                <strong className="metric-value">{formatNum(result.npvEur, 0)}</strong>
                <span className="metric-unit">EUR</span>
              </div>
              <p className="metric-help">Diskonteeritud rahavoogude summa miinus alginvesteering.</p>
            </div>
            <div className="metric-card metric-card-accent-teal">
              <p className="metric-label">Kogutulu perioodi jooksul</p>
              <div className="metric-main">
                <strong className="metric-value">{formatNum(result.totalRevenuePeriodEur, 0)}</strong>
                <span className="metric-unit">EUR</span>
              </div>
              <p className="metric-help">Kumulatiivne netotulu ilma diskonteerimiseta.</p>
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
                    Hetkel ajutiselt tasuta testimiseks: detailne rahavoog, tundlikkus, lisagraafikud ja
                    võrdlused.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-glow"
                      onClick={() => startCheckout("full_analysis", { returnSlug: "paikesejaam" })}
                      disabled={purchaseBusy === "full_analysis"}
                    >
                      {purchaseBusy === "full_analysis" ? "Laen..." : "Ava detailne vaade"}
                    </button>
                    <button type="button" className="btn-ghost" onClick={checkPaymentStatus}>
                      Kontrolli ligipääsu staatust
                    </button>
                  </div>
                </div>
              ) : (
                <CalculatorPdfActions
                  className="mt-4"
                  projectId={projectId}
                  unlock={unlock}
                  purchaseBusy={purchaseBusy}
                  startCheckout={startCheckout}
                  checkPaymentStatus={checkPaymentStatus}
                  onDownload={downloadPdf}
                  returnSlug="paikesejaam"
                />
              )}
            </article>

            <article className="card">
              <h4 className="section-title">Tundlikkus</h4>
              <div className="grid gap-2 text-sm text-zinc-300">
                <div className="compare-row">
                  <span className="compare-label">Elektrihind -20% / +20%</span>
                  <strong>
                    {formatNum(result.sensitivity.electricityPriceMinus20, 0)} /{" "}
                    {formatNum(result.sensitivity.electricityPricePlus20, 0)} EUR/a
                  </strong>
                </div>
                <div className="compare-row">
                  <span className="compare-label">Investeering -10% / +10%</span>
                  <strong>
                    {formatNum(result.sensitivity.investmentMinus10, 0)} /{" "}
                    {formatNum(result.sensitivity.investmentPlus10, 0)} EUR
                  </strong>
                </div>
                <div className="compare-row">
                  <span className="compare-label">Tootlus -10% / +10%</span>
                  <strong>
                    {formatNum(result.sensitivity.yieldMinus10, 0)} /{" "}
                    {formatNum(result.sensitivity.yieldPlus10, 0)} EUR/a
                  </strong>
                </div>
              </div>
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
          <UsedAssumptionsBlock {...assumptionsInfo} />

          <article className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h4 className="section-title">PVGIS tootluse kokkuvõte</h4>
            {pvgisResult.source === "live" ? (
              <div className="mt-3 grid gap-3 text-sm text-zinc-300">
                <div className="compare-row">
                  <span className="compare-label">Aastane hinnanguline tootlus</span>
                  <strong>{formatNum(pvgisResult.annualProductionKwh ?? 0, 0)} kWh</strong>
                </div>
                <div className="compare-row">
                  <span className="compare-label">Tootlus kWh/kW kohta</span>
                  <strong>{formatNum(pvgisResult.specificYieldKwhPerKw ?? 0, 1)} kWh/kW</strong>
                </div>
                {bestMonth ? (
                  <div className="compare-row">
                    <span className="compare-label">Parim tootmiskuu</span>
                    <strong>
                      {MONTH_NAMES_ET[bestMonth.month] ?? `Kuu ${bestMonth.month}`}:{" "}
                      {formatNum(bestMonth.productionKwh, 0)} kWh
                    </strong>
                  </div>
                ) : null}
                {worstMonth ? (
                  <div className="compare-row">
                    <span className="compare-label">Madalaim tootmiskuu</span>
                    <strong>
                      {MONTH_NAMES_ET[worstMonth.month] ?? `Kuu ${worstMonth.month}`}:{" "}
                      {formatNum(worstMonth.productionKwh, 0)} kWh
                    </strong>
                  </div>
                ) : null}
                {pvgisResult.monthlyProductionKwh.length > 0 ? (
                  <ChartCard
                    title="Kuupõhine tootlus"
                    description="PVGIS hinnanguline tootlus kuude lõikes (kWh kuus)."
                    className="mt-2"
                    chartClassName="min-h-[280px] md:min-h-[360px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pvgisMonthlyChartData} margin={{ top: 8, right: 8, left: 8, bottom: 6 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.10)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "rgba(228,233,236,0.85)", fontSize: 12 }}
                          axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                          tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                        />
                        <YAxis
                          tick={{ fill: "rgba(228,233,236,0.85)", fontSize: 12 }}
                          axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                          tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                          width={56}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(34,197,94,0.10)" }}
                          contentStyle={{
                            background: "rgba(9, 14, 12, 0.96)",
                            border: "1px solid rgba(52, 211, 153, 0.35)",
                            borderRadius: "12px",
                            color: "#ecfdf5",
                          }}
                          labelStyle={{ color: "#d1fae5", fontWeight: 600 }}
                          formatter={(value) => [`${formatNum(Number(value ?? 0), 0)} kWh`, "Tootlus"]}
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.fullLabel ? String(payload[0].payload.fullLabel) : ""
                          }
                        />
                        <Bar
                          dataKey="productionKwh"
                          name="Tootlus"
                          radius={[8, 8, 0, 0]}
                          fill="#22c55e"
                          stroke="#4ade80"
                          strokeWidth={1}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                ) : null}
                <p className="mt-1 text-xs text-emerald-200">Tootlus põhineb PVGIS andmetel.</p>
                <p className="text-xs text-zinc-400">
                  Metoodika: kasutame asukoha- ja suunapõhist tootluse hinnangut PVGIS andmeallikast ning kuvame
                  selle tulemuste kokkuvõttena.
                </p>
              </div>
            ) : (
              <div className="mt-3 text-sm text-zinc-300">
                <p>Kasutatud üldist Eesti tootluse eeldust.</p>
                <p className="mt-2 text-xs text-zinc-400">
                  Metoodika: kui asukohaandmed puuduvad või PVGIS andmeid ei õnnestu laadida, kasutame stabiilset
                  üldist Eesti tootluse hinnangut.
                </p>
              </div>
            )}
          </article>

          <PaywallCard
            locked={!canViewFullAnalysis(unlock)}
            title="Detailne vaade"
            description="avab detailse rahavoo, lisagraafikud ja võrdlused selle projekti jaoks."
            ctaLabel={purchaseBusy === "full_analysis" ? "Laen..." : "Ava detailne vaade"}
            secondaryLabel="Kontrolli ligipääsu staatust"
            onCta={() => startCheckout("full_analysis", { returnSlug: "paikesejaam" })}
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

              <ChartCard
                title="Rahavoo prognoos aastate lõikes"
                description="Aastapõhine rahavoo kokkuvõte valitud perioodil."
                chartClassName="min-h-[220px]"
              >
                {result.selected.cashflowByYear.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-400">
                    Rahavoogu ei saanud arvutada. Kontrolli sisestatud andmeid.
                  </p>
                ) : (
                  (() => {
                    const cashflows = result.selected.cashflowByYear;
                    const marks = [0, Math.floor((cashflows.length - 1) / 2), cashflows.length - 1].filter(
                      (idx, pos, arr) => arr.indexOf(idx) === pos,
                    );
                    return (
                      <div className="mt-2 grid gap-2 text-sm">
                        {marks.map((idx) => (
                          <div key={idx} className="compare-row">
                            <span className="compare-label">A{idx + 1}</span>
                            <strong>{formatNum(cashflows[idx] ?? 0, 0)} €</strong>
                          </div>
                        ))}
                        <p className="mt-2 text-xs text-zinc-400">
                          Kuvame võtmeaastad (algus, keskkoht, lõpp), et vaade oleks loetav ka väiksemal ekraanil.
                        </p>
                      </div>
                    );
                  })()
                )}
              </ChartCard>
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
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">
              Sisesta vajalikud andmed ja vajuta "Arvuta tulemus", et näha tulemusi.
            </p>
          )}

        </section>
      </div>
    </div>
  );
}
