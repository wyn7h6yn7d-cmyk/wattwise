import { NextResponse } from "next/server";
import { fetchPvgisProduction } from "@/lib/pvgis";

const PVGIS_ERROR_MESSAGE =
  "PVGIS andmeid ei saanud hetkel laadida. Kasutame üldist Eesti tootluse eeldust.";

function toAzimuth(direction: string): number {
  if (direction === "ida-laas") return -90;
  if (direction === "muu") return 0;
  return 0;
}

function parseNumber(value: string | null | undefined, fallback: number): number {
  if (value == null || value.trim() === "") return fallback;
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

type RouteParams = {
  lat: number;
  lon: number;
  systemKw: number;
  slope: number;
  azimuth: number;
  losses: number;
};

function validateLatLon(lat: number, lon: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

async function parseParams(request: Request): Promise<RouteParams> {
  const url = new URL(request.url);
  const body = request.method === "POST" ? (((await request.json().catch(() => ({}))) as Record<string, unknown>) ?? {}) : {};

  const getBody = (key: string): string | undefined => {
    const value = body[key];
    return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
  };

  const lat = parseNumber(url.searchParams.get("lat") ?? getBody("lat"), NaN);
  const lon = parseNumber(url.searchParams.get("lon") ?? getBody("lon"), NaN);
  const systemKw = parseNumber(
    url.searchParams.get("systemKw") ?? url.searchParams.get("peakpower") ?? getBody("systemKw"),
    1,
  );
  const slope = parseNumber(
    url.searchParams.get("slope") ?? url.searchParams.get("angle") ?? getBody("slope"),
    35,
  );
  const losses = parseNumber(
    url.searchParams.get("losses") ?? url.searchParams.get("loss") ?? getBody("losses"),
    14,
  );
  const azimuthRaw = url.searchParams.get("azimuth") ?? getBody("azimuth");
  const aspect = url.searchParams.get("aspect") ?? getBody("aspect");
  const azimuth = azimuthRaw != null ? parseNumber(azimuthRaw, 0) : toAzimuth(aspect ?? "louna");

  return { lat, lon, systemKw, slope, azimuth, losses };
}

async function handlePvgisRequest(request: Request) {
  const params = await parseParams(request);
  if (!validateLatLon(params.lat, params.lon)) {
    return NextResponse.json({
      error: "Missing or invalid lat/lon. Expect lat in [-90..90] and lon in [-180..180].",
    }, { status: 400 });
  }

  try {
    const production = await fetchPvgisProduction({
      latitude: params.lat,
      longitude: params.lon,
      systemKw: params.systemKw,
      slope: params.slope,
      azimuth: params.azimuth,
      lossesPercent: params.losses,
    });
    if (!production.ok) {
      return NextResponse.json({
        error: "PVGIS_UPSTREAM_ERROR",
        message: PVGIS_ERROR_MESSAGE,
        details: production.error,
      }, { status: 502 });
    }

    return NextResponse.json({
      source: "live",
      specificYieldKwhPerKw: Number((production.annualProductionKwh / Math.max(params.systemKw, 1)).toFixed(1)),
      annualProductionKwh: production.annualProductionKwh,
      monthlyProductionKwh: production.monthlyProductionKwh,
      message: "PVGIS tootlusandmed uuendatud.",
    });
  } catch (error) {
    return NextResponse.json({
      error: "PVGIS_ROUTE_ERROR",
      message: PVGIS_ERROR_MESSAGE,
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handlePvgisRequest(request);
}

export async function POST(request: Request) {
  return handlePvgisRequest(request);
}

