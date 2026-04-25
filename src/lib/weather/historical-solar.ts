import { PanelDirection } from "@/lib/forecast/energy-forecast";

type MonthlyBucket = {
  month: number;
  monthLabel: string;
  meanRadiationKwhM2: number;
  productionPotentialKwh: number;
};

export type HistoricalSolarAnalysis = {
  yearsUsed: number;
  averageRadiationKwhM2Year: number;
  estoniaAverageRadiationKwhM2Year: number;
  deltaVsEstoniaPercent: number;
  monthly: MonthlyBucket[];
  bestMonths: MonthlyBucket[];
  worstMonths: MonthlyBucket[];
  suitability: "väga hea" | "hea" | "keskmine" | "tagasihoidlik";
  reportSummary: string;
};

const MONTHS_ET = ["Jaan", "Veebr", "Märts", "Apr", "Mai", "Juuni", "Juuli", "Aug", "Sept", "Okt", "Nov", "Dets"];
const ESTONIA_REFERENCE = { latitude: 58.7, longitude: 25.0 };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function directionFactor(direction: PanelDirection): number {
  if (direction === "louna") return 1;
  if (direction === "ida-laas") return 0.93;
  if (direction === "ida" || direction === "laas") return 0.9;
  return 0.86;
}

function tiltFactor(tiltDeg: number): number {
  const diff = Math.abs(tiltDeg - 35);
  return clamp(1 - diff * 0.004, 0.82, 1.02);
}

async function fetchDailyRadiationKwhM2({
  latitude,
  longitude,
  startDate,
  endDate,
}: {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
}) {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&daily=shortwave_radiation_sum&timezone=auto&models=era5_seamless`;
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 7 } });
  if (!res.ok) throw new Error(`Ajaloolise kiirguse päring ebaõnnestus (${res.status})`);
  const json = (await res.json()) as {
    daily?: {
      time?: string[];
      shortwave_radiation_sum?: number[];
    };
  };
  const time = json.daily?.time ?? [];
  const radMjM2 = json.daily?.shortwave_radiation_sum ?? [];
  return time.map((date, i) => {
    const mj = typeof radMjM2[i] === "number" ? radMjM2[i] : 0;
    const kwhM2 = Math.max(mj / 3.6, 0); // Open-Meteo daily sum comes as MJ/m².
    return { date, kwhM2 };
  });
}

function aggregateMonthly({
  daily,
  yearsUsed,
  systemKw,
  lossesPercent,
  panelDirection,
  panelTiltDeg,
}: {
  daily: Array<{ date: string; kwhM2: number }>;
  yearsUsed: number;
  systemKw: number;
  lossesPercent: number;
  panelDirection: PanelDirection;
  panelTiltDeg: number;
}): MonthlyBucket[] {
  const groups = new Map<number, { radiation: number; count: number }>();
  for (let m = 0; m < 12; m += 1) groups.set(m, { radiation: 0, count: 0 });

  for (const row of daily) {
    const d = new Date(`${row.date}T00:00:00`);
    if (!Number.isFinite(d.getTime())) continue;
    const m = d.getMonth();
    const g = groups.get(m)!;
    g.radiation += row.kwhM2;
    g.count += 1;
  }

  const performanceRatio = (1 - clamp(lossesPercent, 0, 80) / 100) * directionFactor(panelDirection) * tiltFactor(panelTiltDeg);
  return Array.from(groups.entries()).map(([month, g]) => {
    const meanRadiationKwhM2 = g.count > 0 ? g.radiation / Math.max(yearsUsed, 1) : 0;
    const productionPotentialKwh = meanRadiationKwhM2 * systemKw * performanceRatio;
    return {
      month,
      monthLabel: MONTHS_ET[month],
      meanRadiationKwhM2,
      productionPotentialKwh,
    };
  });
}

function calcSuitability(deltaPercent: number): HistoricalSolarAnalysis["suitability"] {
  if (deltaPercent >= 8) return "väga hea";
  if (deltaPercent >= 2) return "hea";
  if (deltaPercent >= -4) return "keskmine";
  return "tagasihoidlik";
}

function reportText({
  locationName,
  suitability,
  bestMonth,
  worstMonth,
  deltaPercent,
}: {
  locationName: string;
  suitability: HistoricalSolarAnalysis["suitability"];
  bestMonth: MonthlyBucket;
  worstMonth: MonthlyBucket;
  deltaPercent: number;
}) {
  const rel = deltaPercent >= 0 ? `${deltaPercent.toFixed(1)}% üle` : `${Math.abs(deltaPercent).toFixed(1)}% alla`;
  return `${locationName} ajalooline päikesepotentsiaal on ${suitability}; kiirgus on ${rel} Eesti keskmisest. Kõrgeim tootmispotentsiaal on kuus ${bestMonth.monthLabel}, madalaim kuus ${worstMonth.monthLabel}.`;
}

export async function buildHistoricalSolarAnalysis({
  latitude,
  longitude,
  locationName,
  years = 10,
  systemKw,
  panelDirection,
  panelTiltDeg,
  lossesPercent,
}: {
  latitude: number;
  longitude: number;
  locationName: string;
  years?: 5 | 10;
  systemKw: number;
  panelDirection: PanelDirection;
  panelTiltDeg: number;
  lossesPercent: number;
}): Promise<HistoricalSolarAnalysis> {
  const now = new Date();
  const endDate = new Date(now.getFullYear() - 1, 11, 31);
  const startDate = new Date(endDate.getFullYear() - years + 1, 0, 1);
  const startStr = `${startDate.getFullYear()}-01-01`;
  const endStr = `${endDate.getFullYear()}-12-31`;

  const [localDaily, estoniaDaily] = await Promise.all([
    fetchDailyRadiationKwhM2({
      latitude,
      longitude,
      startDate: startStr,
      endDate: endStr,
    }),
    fetchDailyRadiationKwhM2({
      latitude: ESTONIA_REFERENCE.latitude,
      longitude: ESTONIA_REFERENCE.longitude,
      startDate: startStr,
      endDate: endStr,
    }),
  ]);

  const monthly = aggregateMonthly({
    daily: localDaily,
    yearsUsed: years,
    systemKw,
    lossesPercent,
    panelDirection,
    panelTiltDeg,
  });

  const localYearly = monthly.reduce((s, m) => s + m.meanRadiationKwhM2, 0);
  const estoniaYearly =
    aggregateMonthly({
      daily: estoniaDaily,
      yearsUsed: years,
      systemKw: 1,
      lossesPercent: 0,
      panelDirection: "louna",
      panelTiltDeg: 35,
    }).reduce((s, m) => s + m.meanRadiationKwhM2, 0) || 1;

  const deltaVsEstoniaPercent = ((localYearly - estoniaYearly) / estoniaYearly) * 100;
  const sortedByPotential = monthly.slice().sort((a, b) => b.productionPotentialKwh - a.productionPotentialKwh);
  const bestMonths = sortedByPotential.slice(0, 3);
  const worstMonths = sortedByPotential.slice(-3).reverse();
  const suitability = calcSuitability(deltaVsEstoniaPercent);

  return {
    yearsUsed: years,
    averageRadiationKwhM2Year: localYearly,
    estoniaAverageRadiationKwhM2Year: estoniaYearly,
    deltaVsEstoniaPercent,
    monthly,
    bestMonths,
    worstMonths,
    suitability,
    reportSummary: reportText({
      locationName,
      suitability,
      bestMonth: bestMonths[0],
      worstMonth: worstMonths[0],
      deltaPercent: deltaVsEstoniaPercent,
    }),
  };
}
