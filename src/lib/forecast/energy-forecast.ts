import { addVat, MarketPricePoint } from "@/lib/elering";
import { WeatherForecastPoint } from "@/lib/weather/open-meteo";

export type PanelDirection = "louna" | "ida" | "laas" | "ida-laas" | "muu";

export type ForecastInput = {
  systemKw: number;
  panelDirection: PanelDirection;
  panelTiltDeg: number;
  systemLossesPercent: number;
  hasEv: boolean;
  hasBattery: boolean;
};

export type ForecastRow = {
  ts: number;
  priceSntWithVat: number;
  cloudCoverPct: number;
  radiationWm2: number;
  pvPowerEstimateKw: number;
  pvEnergyEstimateKwh: number;
  score: number;
  recommendation: string;
};

export type ForecastSummary = {
  bestSolarHour: ForecastRow | null;
  lowestPriceHour: ForecastRow | null;
  bestChargingWindow: { startTs: number; endTs: number; avgPriceSntWithVat: number } | null;
  estimatedPvTomorrowKwh: number;
};

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

function normalizePrice(prices: number[]) {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = Math.max(max - min, 1e-9);
  return (v: number) => 1 - (v - min) / span;
}

function normalizeValue(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1e-9);
  return (v: number) => (v - min) / span;
}

function classifyRecommendation(score: number): string {
  if (score >= 78) return "Väga hea aeg tarbimiseks";
  if (score >= 58) return "Hea aeg";
  if (score >= 38) return "Neutraalne";
  return "Väldi suurt tarbimist";
}

function findPriceForHour(ts: number, prices: MarketPricePoint[]): MarketPricePoint | null {
  if (!prices.length) return null;
  const hourTs = Math.floor(ts / 3600) * 3600;
  let exact: MarketPricePoint | null = null;
  for (const p of prices) {
    if (Math.floor(p.ts / 3600) * 3600 === hourTs) {
      exact = p;
      break;
    }
  }
  if (exact) return exact;
  let best: MarketPricePoint | null = null;
  let bestDist = Infinity;
  for (const p of prices) {
    const dist = Math.abs(p.ts - ts);
    if (dist < bestDist) {
      best = p;
      bestDist = dist;
    }
  }
  return best;
}

export function buildEnergyForecast({
  input,
  weatherPoints,
  pricePoints,
  intervalHours = 1,
}: {
  input: ForecastInput;
  weatherPoints: WeatherForecastPoint[];
  pricePoints: MarketPricePoint[];
  intervalHours?: number;
}): { rows: ForecastRow[]; summary: ForecastSummary } {
  if (!weatherPoints.length) {
    return {
      rows: [],
      summary: {
        bestSolarHour: null,
        lowestPriceHour: null,
        bestChargingWindow: null,
        estimatedPvTomorrowKwh: 0,
      },
    };
  }

  const lossFactor = 1 - clamp(input.systemLossesPercent, 0, 80) / 100;
  const orientationFactor = directionFactor(input.panelDirection) * tiltFactor(input.panelTiltDeg);
  const rowsBase = weatherPoints.map((w) => {
    const price = findPriceForHour(w.ts, pricePoints);
    const eurPerKwh = price?.price_eur_per_kwh ?? 0.12;
    const priceSntWithVat = addVat(eurPerKwh) * 100;
    const adjustedRadiation = Math.max(w.radiationWm2 * orientationFactor, 0);
    // V1 prognoos on lihtsustatud ja vajab hiljem kalibreerimist reaalse tootmisandmega.
    const pvPowerEstimateKw = input.systemKw * (adjustedRadiation / 1000) * lossFactor;
    const pvEnergyEstimateKwh = Math.max(pvPowerEstimateKw * intervalHours, 0);
    return {
      ts: w.ts,
      priceSntWithVat,
      cloudCoverPct: w.cloudCoverPct,
      radiationWm2: w.radiationWm2,
      pvPowerEstimateKw,
      pvEnergyEstimateKwh,
      score: 0,
      recommendation: "Neutraalne",
    };
  });

  const priceNorm = normalizePrice(rowsBase.map((r) => r.priceSntWithVat));
  const pvNorm = normalizeValue(rowsBase.map((r) => r.pvEnergyEstimateKwh));
  const cloudNorm = normalizePrice(rowsBase.map((r) => r.cloudCoverPct));

  const rows: ForecastRow[] = rowsBase.map((r) => {
    const score = Math.round((priceNorm(r.priceSntWithVat) * 0.5 + pvNorm(r.pvEnergyEstimateKwh) * 0.35 + cloudNorm(r.cloudCoverPct) * 0.15) * 100);
    let recommendation = classifyRecommendation(score);
    if (r.pvEnergyEstimateKwh > 0.6) {
      recommendation = "Päikeseenergia potentsiaal on parim siin";
    } else if (input.hasEv && score >= 62) {
      recommendation = "Lae EV siin";
    } else if (score >= 70) {
      recommendation = "Kasuta suuremat tarbimist siin";
    } else if (score < 30) {
      recommendation = "Väldi tarbimist siin";
    } else if (input.hasBattery && r.priceSntWithVat < 12 && r.pvEnergyEstimateKwh > 0.4) {
      recommendation = "Hea aeg aku laadimiseks";
    }
    return { ...r, score, recommendation };
  });

  const bestSolarHour = rows.slice().sort((a, b) => b.pvEnergyEstimateKwh - a.pvEnergyEstimateKwh)[0] ?? null;
  const lowestPriceHour = rows.slice().sort((a, b) => a.priceSntWithVat - b.priceSntWithVat)[0] ?? null;

  let bestChargingWindow: ForecastSummary["bestChargingWindow"] = null;
  for (const length of [2, 3, 4]) {
    for (let i = 0; i <= rows.length - length; i += 1) {
      const slice = rows.slice(i, i + length);
      const avgPrice = slice.reduce((s, x) => s + x.priceSntWithVat, 0) / length;
      if (!bestChargingWindow || avgPrice < bestChargingWindow.avgPriceSntWithVat) {
        bestChargingWindow = {
          startTs: slice[0].ts,
          endTs: slice[slice.length - 1].ts + 3600,
          avgPriceSntWithVat: avgPrice,
        };
      }
    }
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tY = tomorrow.getFullYear();
  const tM = tomorrow.getMonth();
  const tD = tomorrow.getDate();
  const estimatedPvTomorrowKwh = rows
    .filter((r) => {
      const d = new Date(r.ts * 1000);
      return d.getFullYear() === tY && d.getMonth() === tM && d.getDate() === tD;
    })
    .reduce((sum, r) => sum + r.pvEnergyEstimateKwh, 0);

  return {
    rows,
    summary: {
      bestSolarHour,
      lowestPriceHour,
      bestChargingWindow,
      estimatedPvTomorrowKwh,
    },
  };
}
