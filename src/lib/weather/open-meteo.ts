export type GeoPoint = {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
  usedDefaultLocation: boolean;
};

export type WeatherForecastPoint = {
  ts: number;
  temperatureC: number;
  cloudCoverPct: number;
  windSpeedMs: number;
  precipitationMm: number;
  radiationWm2: number;
};

const TALLINN: GeoPoint = {
  latitude: 59.437,
  longitude: 24.7536,
  name: "Tallinn",
  country: "EE",
  usedDefaultLocation: true,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toNum(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function resolveLatLon({
  latitude,
  longitude,
}: {
  latitude?: string;
  longitude?: string;
}): GeoPoint | null {
  if (!latitude || !longitude) return null;
  const lat = Number(latitude.replace(",", "."));
  const lon = Number(longitude.replace(",", "."));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return {
    latitude: lat,
    longitude: lon,
    name: `(${lat.toFixed(3)}, ${lon.toFixed(3)})`,
    usedDefaultLocation: false,
  };
}

export async function geocodeWithOpenMeteo(locationQuery: string): Promise<GeoPoint | null> {
  const q = locationQuery.trim();
  if (!q) return null;
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    q,
  )}&count=1&language=et&format=json`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    results?: Array<{
      latitude?: number;
      longitude?: number;
      name?: string;
      country_code?: string;
    }>;
  };
  const first = json.results?.[0];
  if (!first) return null;
  const lat = toNum(first.latitude, Number.NaN);
  const lon = toNum(first.longitude, Number.NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    latitude: lat,
    longitude: lon,
    name: first.name || q,
    country: first.country_code,
    usedDefaultLocation: false,
  };
}

export async function resolveGeoPoint({
  location,
  latitude,
  longitude,
}: {
  location?: string;
  latitude?: string;
  longitude?: string;
}): Promise<GeoPoint> {
  const direct = resolveLatLon({ latitude, longitude });
  if (direct) return direct;
  if (location?.trim()) {
    const geocoded = await geocodeWithOpenMeteo(location);
    if (geocoded) return geocoded;
  }
  return TALLINN;
}

export async function fetchOpenMeteoForecast({
  latitude,
  longitude,
  hourlyHours = 48,
}: {
  latitude: number;
  longitude: number;
  hourlyHours?: 24 | 48;
}): Promise<WeatherForecastPoint[]> {
  const hourlyFields = [
    "temperature_2m",
    "cloud_cover",
    "wind_speed_10m",
    "precipitation",
    "shortwave_radiation",
  ].join(",");
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&hourly=${hourlyFields}&forecast_days=3&timezone=auto`;
  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Open-Meteo päring ebaõnnestus (${res.status})`);
  const json = (await res.json()) as {
    hourly?: {
      time?: string[];
      temperature_2m?: number[];
      cloud_cover?: number[];
      wind_speed_10m?: number[];
      precipitation?: number[];
      shortwave_radiation?: number[];
    };
  };
  const h = json.hourly;
  if (!h?.time?.length) return [];

  const nowTs = Math.floor(Date.now() / 1000);
  const out: WeatherForecastPoint[] = [];

  for (let i = 0; i < h.time.length; i += 1) {
    const ts = Math.floor(new Date(h.time[i]).getTime() / 1000);
    if (!Number.isFinite(ts) || ts < nowTs - 3600) continue;
    out.push({
      ts,
      temperatureC: toNum(h.temperature_2m?.[i]),
      cloudCoverPct: clamp(toNum(h.cloud_cover?.[i]), 0, 100),
      windSpeedMs: Math.max(toNum(h.wind_speed_10m?.[i]), 0),
      precipitationMm: Math.max(toNum(h.precipitation?.[i]), 0),
      radiationWm2: Math.max(toNum(h.shortwave_radiation?.[i]), 0),
    });
  }

  return out.slice(0, hourlyHours);
}
