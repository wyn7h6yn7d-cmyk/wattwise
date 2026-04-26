export type FetchPvgisProductionParams = {
  latitude: number;
  longitude: number;
  systemKw: number;
  slope: number;
  azimuth: number;
  lossesPercent: number;
};

export type PvgisMonthlyProduction = {
  month: number;
  productionKwh: number;
};

export type PvgisProductionResult =
  | {
      ok: true;
      annualProductionKwh: number;
      monthlyProductionKwh: PvgisMonthlyProduction[];
    }
  | {
      ok: false;
      error: string;
    };

type PvgisResponse = {
  outputs?: {
    totals?: {
      fixed?: {
        E_y?: number;
      };
    };
    monthly?: {
      fixed?: Array<{
        month?: number;
        E_m?: number;
      }>;
    };
  };
};

function toPositive(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

function inRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

export async function fetchPvgisProduction(
  params: FetchPvgisProductionParams,
): Promise<PvgisProductionResult> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    const latitude = params.latitude;
    const longitude = params.longitude;
    if (!inRange(latitude, -90, 90) || !inRange(longitude, -180, 180)) {
      return { ok: false, error: "Invalid PVGIS coordinates" };
    }

    const slope = toPositive(params.slope, 35);
    const losses = toPositive(params.lossesPercent, 14);
    const systemKw = toPositive(params.systemKw, 1);
    const azimuth = inRange(params.azimuth, -180, 180) ? params.azimuth : 0;

    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 5000);

    const pvgisUrl = new URL("https://re.jrc.ec.europa.eu/api/v5_3/PVcalc");
    pvgisUrl.searchParams.set("lat", String(latitude));
    pvgisUrl.searchParams.set("lon", String(longitude));
    pvgisUrl.searchParams.set("peakpower", String(systemKw));
    pvgisUrl.searchParams.set("loss", String(losses));
    pvgisUrl.searchParams.set("angle", String(slope));
    pvgisUrl.searchParams.set("aspect", String(azimuth));
    pvgisUrl.searchParams.set("outputformat", "json");

    const response = await fetch(pvgisUrl.toString(), {
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 6 },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { ok: false, error: "PVGIS HTTP error" };
    }

    const data = (await response.json()) as PvgisResponse;
    const annualProductionKwh = data?.outputs?.totals?.fixed?.E_y;
    if (!Number.isFinite(annualProductionKwh) || (annualProductionKwh as number) <= 0) {
      return { ok: false, error: "PVGIS annual production missing" };
    }

    const monthlyRaw = data?.outputs?.monthly?.fixed ?? [];
    const monthlyProductionKwh: PvgisMonthlyProduction[] = monthlyRaw
      .map((item) => ({
        month: Number(item.month),
        productionKwh: Number(item.E_m),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.month) &&
          item.month >= 1 &&
          item.month <= 12 &&
          Number.isFinite(item.productionKwh) &&
          item.productionKwh >= 0,
      )
      .sort((a, b) => a.month - b.month);

    return {
      ok: true,
      annualProductionKwh: Number((annualProductionKwh as number).toFixed(1)),
      monthlyProductionKwh,
    };
  } catch {
    return { ok: false, error: "PVGIS request failed" };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

