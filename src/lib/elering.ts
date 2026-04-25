export type EleringArea = "ee" | "lv" | "lt" | "fi";

export type MarketPricePoint = {
  ts: number; // unix seconds
  price_eur_per_kwh: number; // base unit
};

export type MarketPriceSeries = {
  area: EleringArea;
  intervalMinutes: 15 | 60;
  points: MarketPricePoint[];
};

export const VAT_RATE = 0.24;

export function eurMWhToEurKWh(priceEurPerMWh: number) {
  return priceEurPerMWh / 1000;
}

export function eurMWhToSntKWh(priceEurPerMWh: number) {
  return priceEurPerMWh / 10;
}

export function eurMWhToSntKWhWithVat(priceEurPerMWh: number) {
  return eurMWhToSntKWh(priceEurPerMWh) * (1 + VAT_RATE);
}

export function formatSntKWh(valueSntPerKwh: number) {
  if (!Number.isFinite(valueSntPerKwh)) return "—";
  const abs = Math.abs(valueSntPerKwh);
  const maxFractionDigits = abs < 1 ? 2 : 1;
  return new Intl.NumberFormat("et-EE", {
    minimumFractionDigits: abs < 1 ? 2 : 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(valueSntPerKwh);
}

export function addVat(priceEurPerKwh: number) {
  return priceEurPerKwh * (1 + VAT_RATE);
}

export function eurPerKwhToSntPerKwh(priceEurPerKwh: number) {
  return priceEurPerKwh * 100;
}

function inferIntervalMinutes(points: Array<{ ts: number }>): 15 | 60 {
  if (points.length < 2) return 60;
  const diffs: number[] = [];
  for (let i = 1; i < Math.min(points.length, 20); i += 1) {
    const d = points[i].ts - points[i - 1].ts;
    if (Number.isFinite(d) && d > 0) diffs.push(d);
  }
  const median = diffs.sort((a, b) => a - b)[Math.floor(diffs.length / 2)] ?? 3600;
  return Math.abs(median - 900) < Math.abs(median - 3600) ? 15 : 60;
}

function normalizeEurPerKwh(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  // Elering NPS API uses EUR/MWh. Convert to EUR/kWh.
  return eurMWhToEurKWh(n);
}

export async function fetchEleringNpsSeries({
  startIso,
  endIso,
  area = "ee",
  revalidateSeconds = 60,
}: {
  startIso: string;
  endIso: string;
  area?: EleringArea;
  revalidateSeconds?: number;
}): Promise<MarketPriceSeries> {
  const url = `https://dashboard.elering.ee/api/nps/price?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`;

  const res = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    throw new Error(`Elering NPS päring ebaõnnestus (${res.status})`);
  }

  const json = (await res.json()) as {
    data?: Record<string, Array<{ timestamp?: number; ts?: number; price?: number }>>;
  };

  const raw = (json?.data?.[area] ?? []) as Array<{ timestamp?: number; ts?: number; price?: number }>;
  const points: MarketPricePoint[] = raw
    .map((p) => {
      const ts = typeof p.timestamp === "number" ? p.timestamp : typeof p.ts === "number" ? p.ts : null;
      const eurPerKwh = normalizeEurPerKwh(p.price);
      if (!ts || eurPerKwh === null) return null;
      return { ts, price_eur_per_kwh: eurPerKwh };
    })
    .filter((p): p is MarketPricePoint => p !== null && p.price_eur_per_kwh >= 0)
    .sort((a, b) => a.ts - b.ts);

  return {
    area,
    intervalMinutes: inferIntervalMinutes(points),
    points,
  };
}

