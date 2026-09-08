import type { ConsumptionCsvRow } from "./parse-consumption-csv";
import type { ConsumptionProfileSummary } from "./consumption-profile";
import type { IndustrialBatteryPurpose } from "@/lib/calculators/industrial";

/**
 * v0.3: chart series + textual profile conclusions for industrial CSV import.
 */

export const CONSUMPTION_CHART_MAX_POINTS = 96;

export type ConsumptionChartPoint = {
  label: string;
  timestampMs: number;
  consumptionKwh: number;
  loadKw: number;
};

export type ConsumptionChartSeries = {
  points: ConsumptionChartPoint[];
  aggregated: boolean;
  sourceRowCount: number;
  displayedPointCount: number;
};

export type ConsumptionProfileShape = "daytime" | "flat" | "peaky";

export type ConsumptionProfileInsight = {
  shape: ConsumptionProfileShape;
  shapeLabel: string;
  shapeExplanation: string;
  pvFitLabel: string;
  pvFitExplanation: string;
  recommendedBatteryPurpose: IndustrialBatteryPurpose;
  batteryRoleLabel: string;
  batteryRoleExplanation: string;
  peakToAverageRatio: number;
  daytimeSharePercent: number;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatRowLabel(row: Pick<ConsumptionCsvRow, "month" | "day" | "hour" | "minute">): string {
  return `${pad2(row.month)}-${pad2(row.day)} ${pad2(row.hour)}:${pad2(row.minute)}`;
}

function rowLoadKw(row: ConsumptionCsvRow, intervalHours: number): number {
  return intervalHours > 0 ? row.consumptionKwh / intervalHours : row.consumptionKwh;
}

function resolveIntervalHours(summary: ConsumptionProfileSummary): number {
  if (summary.interval === "hour") return 1;
  if (summary.interval === "15min") return 0.25;
  if (summary.intervalMinutes != null && summary.intervalMinutes > 0) {
    return summary.intervalMinutes / 60;
  }
  return 1;
}

/**
 * Builds a lightweight time series for SVG charts.
 * Large CSVs are averaged into at most `maxPoints` buckets so the UI stays responsive.
 */
export function buildConsumptionChartSeries(
  rows: ConsumptionCsvRow[],
  summary: ConsumptionProfileSummary,
  maxPoints: number = CONSUMPTION_CHART_MAX_POINTS,
): ConsumptionChartSeries {
  const sorted = [...rows].sort((a, b) => a.timestampMs - b.timestampMs);
  const intervalHours = resolveIntervalHours(summary);
  const sourceRowCount = sorted.length;

  if (sourceRowCount === 0) {
    return { points: [], aggregated: false, sourceRowCount: 0, displayedPointCount: 0 };
  }

  if (sourceRowCount <= maxPoints) {
    const points = sorted.map((row) => ({
      label: formatRowLabel(row),
      timestampMs: row.timestampMs,
      consumptionKwh: row.consumptionKwh,
      loadKw: rowLoadKw(row, intervalHours),
    }));
    return {
      points,
      aggregated: false,
      sourceRowCount,
      displayedPointCount: points.length,
    };
  }

  const bucketSize = Math.ceil(sourceRowCount / maxPoints);
  const points: ConsumptionChartPoint[] = [];

  for (let start = 0; start < sourceRowCount; start += bucketSize) {
    const chunk = sorted.slice(start, start + bucketSize);
    const consumptionKwh = chunk.reduce((sum, row) => sum + row.consumptionKwh, 0) / chunk.length;
    const loadKw = chunk.reduce((sum, row) => sum + rowLoadKw(row, intervalHours), 0) / chunk.length;
    const mid = chunk[Math.floor(chunk.length / 2)] ?? chunk[0];
    points.push({
      label: formatRowLabel(mid),
      timestampMs: mid.timestampMs,
      consumptionKwh,
      loadKw,
    });
  }

  return {
    points,
    aggregated: true,
    sourceRowCount,
    displayedPointCount: points.length,
  };
}

/**
 * Classifies the profile as daytime-heavy, flat, or peaky and drafts PV/battery guidance.
 */
export function inferConsumptionProfileInsight(
  summary: ConsumptionProfileSummary,
): ConsumptionProfileInsight {
  const average = Math.max(summary.averageLoadKw, 1e-6);
  const peakToAverageRatio = summary.peakLoadKw / average;
  const daytimeSharePercent = summary.daytimeSharePercent;

  let shape: ConsumptionProfileShape;
  if (peakToAverageRatio >= 1.85) {
    shape = "peaky";
  } else if (daytimeSharePercent >= 62) {
    shape = "daytime";
  } else {
    shape = "flat";
  }

  if (shape === "daytime") {
    return {
      shape,
      shapeLabel: "Pigem päevane tarbimine",
      shapeExplanation:
        "Suurem osa tarbimisest jääb päevatundidesse (08:00–20:00), mis on tüüpiline päevasele tootmisele või kontorilaadsele koormusele.",
      pvFitLabel: "PV kattuvus on üldjuhul hea",
      pvFitExplanation:
        "Päevane tarbimine kattub PV tootmisega hästi, seega saab suure osa päikeseenergiast kasutada kohapeal juba ilma akuta.",
      recommendedBatteryPurpose: "self_consumption",
      batteryRoleLabel: "Aku roll: pigem omatarbe suurendamine",
      batteryRoleExplanation:
        "Aku aitab päevast PV ülejääki õhtusse nihutada. Tipukoormuse lõikamine ei ole peamine vajadus, kui tipp/keskmine suhe on mõõdukas.",
      peakToAverageRatio,
      daytimeSharePercent,
    };
  }

  if (shape === "peaky") {
    return {
      shape,
      shapeLabel: "Tipukoormustega profiil",
      shapeExplanation:
        "Tipukoormus on keskmisest selgelt kõrgem. See viitab lühikestele kõrgetele võimsusnõudlustele, mitte ainult ühtlasele baaskoormusele.",
      pvFitLabel:
        daytimeSharePercent >= 55
          ? "PV kattuvus on osaline"
          : "PV kattuvus on piiratud",
      pvFitExplanation:
        daytimeSharePercent >= 55
          ? "Osa tippudest võib langeda päeva peale, kuid tippude katteks üksi PV tavaliselt ei piisa — vaja on võimsuse juhtimist."
          : "Kui tipud jäävad õhtusse või öösse, kattub PV tootmine tippudega halvasti. Kohapealne kasutus vajab akut või tipu nihutamist.",
      recommendedBatteryPurpose: "peak_shaving",
      batteryRoleLabel: "Aku roll: pigem tipukoormuse vähendamine",
      batteryRoleExplanation:
        "Aku peamine väärtus on tipu lõikamine ja võimsustasu riski vähendamine. Omatarvet saab samuti toetada, kuid tipuprofiil juhib valikut.",
      peakToAverageRatio,
      daytimeSharePercent,
    };
  }

  return {
    shape,
    shapeLabel: "Pigem ühtlane tarbimine",
    shapeExplanation:
      "Tarbimine jaotub ööpäeva peale suhteliselt ühtlaselt ning tipp ei ole keskmisest drastiliselt kõrgem.",
    pvFitLabel: "PV kattuvus on mõõdukas",
    pvFitExplanation:
      "Osa PV toodangust kattub päevase koormusega, aga õhtune ja öine tarbimine jääb endiselt võrgust või akusse nihutatud energiast sõltuma.",
    recommendedBatteryPurpose: "self_consumption",
    batteryRoleLabel: "Aku roll: pigem omatarbe suurendamine",
    batteryRoleExplanation:
      "Ühtlase baaskoormuse juures aitab aku peamiselt päevast PV ülejääki hilisemasse tarbimisse kanda. Tipu lõikamine on teisejärguline, kui tipp/keskmine suhe on madal.",
    peakToAverageRatio,
    daytimeSharePercent,
  };
}
