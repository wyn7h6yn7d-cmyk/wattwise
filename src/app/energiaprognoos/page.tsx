import Link from "next/link";
import { EnergyForecastDashboard } from "@/components/energy-forecast/energy-forecast-dashboard";
import { buildEnergyForecast, PanelDirection } from "@/lib/forecast/energy-forecast";
import { fetchEleringNpsSeries, MarketPricePoint } from "@/lib/elering";
import { fetchOpenMeteoForecast, resolveGeoPoint, WeatherForecastPoint } from "@/lib/weather/open-meteo";
import { buildHistoricalSolarAnalysis } from "@/lib/weather/historical-solar";
import { HistoricalSolarAnalysisPanel } from "@/components/energy-forecast/historical-solar-analysis";

export const metadata = {
  title: "Energiaprognoos | Energiakalkulaator",
};
export const dynamic = "force-dynamic";

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toNumber(value: string | undefined, fallback: number) {
  if (!value?.trim()) return fallback;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  return value === "1" || value === "true" || value === "on" || value === "jah";
}

function directionFromValue(value: string | undefined): PanelDirection {
  if (value === "louna" || value === "ida" || value === "laas" || value === "ida-laas") return value;
  return "louna";
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtHour(ts: number) {
  const d = new Date(ts * 1000);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function toHourly(points: MarketPricePoint[], sourceInterval: 15 | 60): MarketPricePoint[] {
  const sorted = points.slice().sort((a, b) => a.ts - b.ts);
  if (sourceInterval === 60) return sorted;
  const groups = new Map<number, MarketPricePoint[]>();
  for (const p of sorted) {
    const d = new Date(p.ts * 1000);
    d.setMinutes(0, 0, 0);
    const key = Math.floor(d.getTime() / 1000);
    const g = groups.get(key) ?? [];
    g.push(p);
    groups.set(key, g);
  }
  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([ts, g]) => ({ ts, price_eur_per_kwh: g.reduce((s, p) => s + p.price_eur_per_kwh, 0) / g.length }));
}

function demoRows(hours: number): { weather: WeatherForecastPoint[]; prices: MarketPricePoint[] } {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const baseTs = Math.floor(now.getTime() / 1000);
  const weather: WeatherForecastPoint[] = [];
  const prices: MarketPricePoint[] = [];
  for (let i = 0; i < hours; i += 1) {
    const ts = baseTs + i * 3600;
    const localHour = new Date(ts * 1000).getHours();
    const daylight = Math.max(0, Math.sin(((localHour - 6) / 12) * Math.PI));
    const radiation = daylight * 760;
    const cloud = Math.max(5, 75 - radiation / 12);
    const priceEur = 0.09 + Math.max(0, Math.sin(((localHour + 4) / 24) * 2 * Math.PI)) * 0.08;
    weather.push({
      ts,
      temperatureC: 4 + daylight * 10,
      cloudCoverPct: cloud,
      windSpeedMs: 3.2,
      precipitationMm: 0,
      radiationWm2: radiation,
    });
    prices.push({ ts, price_eur_per_kwh: priceEur });
  }
  return { weather, prices };
}

export default async function EnergiaprognoosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const location = toSingle(params.location) ?? "";
  const latitudeRaw = toSingle(params.latitude);
  const longitudeRaw = toSingle(params.longitude);
  const hours = toSingle(params.hours) === "24" ? 24 : 48;
  const historyYears = toSingle(params.historyYears) === "5" ? 5 : 10;
  const input = {
    systemKw: toNumber(toSingle(params.systemKw), 10),
    panelDirection: directionFromValue(toSingle(params.panelDirection)),
    panelTiltDeg: toNumber(toSingle(params.panelTiltDeg), 35),
    systemLossesPercent: toNumber(toSingle(params.systemLossesPercent), 14),
    hasEv: toBool(toSingle(params.hasEv), false),
    hasBattery: toBool(toSingle(params.hasBattery), false),
  };

  const geo = await resolveGeoPoint({ location, latitude: latitudeRaw, longitude: longitudeRaw });
  let weatherPoints: WeatherForecastPoint[] = [];
  let pricePoints: MarketPricePoint[] = [];
  let errorText: string | null = null;
  let usingDemo = false;

  try {
    const now = new Date();
    const startIso = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const endIso = new Date(now.getTime() + (hours + 6) * 60 * 60 * 1000).toISOString();
    const [weather, pricesRaw] = await Promise.all([
      fetchOpenMeteoForecast({
        latitude: geo.latitude,
        longitude: geo.longitude,
        hourlyHours: hours,
      }),
      fetchEleringNpsSeries({
        startIso,
        endIso,
        area: "ee",
        revalidateSeconds: 300,
      }),
    ]);
    weatherPoints = weather;
    pricePoints = toHourly(pricesRaw.points, pricesRaw.intervalMinutes);
    if (!weatherPoints.length || !pricePoints.length) {
      throw new Error("Prognoosiandmeid ei õnnestunud laadida.");
    }
  } catch (error) {
    errorText = error instanceof Error ? error.message : "Andmete laadimine ebaõnnestus.";
    usingDemo = true;
    const demo = demoRows(hours);
    weatherPoints = demo.weather;
    pricePoints = demo.prices;
  }

  const { rows, summary } = buildEnergyForecast({
    input,
    weatherPoints,
    pricePoints,
    intervalHours: 1,
  });

  let historicalError: string | null = null;
  let historicalFallback = false;
  const historicalAnalysis = await (async () => {
    try {
      return await buildHistoricalSolarAnalysis({
        latitude: geo.latitude,
        longitude: geo.longitude,
        locationName: geo.name,
        years: historyYears,
        systemKw: input.systemKw,
        panelDirection: input.panelDirection,
        panelTiltDeg: input.panelTiltDeg,
        lossesPercent: input.systemLossesPercent,
      });
    } catch (error) {
      historicalError = error instanceof Error ? error.message : "Ajaloolist analüüsi ei saanud laadida.";
      historicalFallback = true;
      return await buildHistoricalSolarAnalysis({
        latitude: 59.437,
        longitude: 24.7536,
        locationName: "Tallinn (varuandmed)",
        years: historyYears,
        systemKw: input.systemKw,
        panelDirection: input.panelDirection,
        panelTiltDeg: input.panelTiltDeg,
        lossesPercent: input.systemLossesPercent,
      });
    }
  })();

  return (
    <div className="relative page-bg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora" />
        <div className="grid-glow" />
      </div>

      <main className="relative mx-auto w-full max-w-7xl px-3 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <header className="glass-panel rounded-2xl p-4 sm:rounded-3xl sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs tracking-wide text-emerald-200">
                Open-Meteo + Elering
              </p>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">Energiaprognoos</h1>
              <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
                Ühenda ilm, päikesekiirgus ja börsihind, et näha millal on parim aeg tarbimiseks, EV laadimiseks ja päikeseenergia kasutuseks.
              </p>
            </div>
            <Link href="/kalkulaatorid" className="btn-ghost inline-flex w-full justify-center sm:w-auto">
              Tagasi kalkulaatoritesse
            </Link>
          </div>
        </header>

        <section className="glass-panel mt-6 rounded-3xl p-5 sm:p-8">
          <h2 className="section-title">Sisendid</h2>
          <form className="mt-4 grid gap-4 lg:grid-cols-3">
            <label className="field-label">
              <span className="field-label-text">Asukoht</span>
              <input name="location" defaultValue={location} className="input" placeholder="Tallinn, Tartu..." />
              <span className="field-hint">Või kasuta koordinaate allpool.</span>
            </label>
            <label className="field-label">
              <span className="field-label-text">Latitude</span>
              <input name="latitude" defaultValue={latitudeRaw ?? ""} className="input" placeholder="59.437" />
              <span className="field-hint">Valikuline.</span>
            </label>
            <label className="field-label">
              <span className="field-label-text">Longitude</span>
              <input name="longitude" defaultValue={longitudeRaw ?? ""} className="input" placeholder="24.7536" />
              <span className="field-hint">Valikuline.</span>
            </label>
            <label className="field-label">
              <span className="field-label-text">Päikesejaama võimsus (kW)</span>
              <input name="systemKw" defaultValue={String(input.systemKw)} className="input" />
            </label>
            <label className="field-label">
              <span className="field-label-text">Paneelide suund</span>
              <select name="panelDirection" defaultValue={input.panelDirection} className="input">
                <option value="louna">Lõuna</option>
                <option value="ida-laas">Ida-lääs</option>
                <option value="ida">Ida</option>
                <option value="laas">Lääs</option>
                <option value="muu">Muu</option>
              </select>
            </label>
            <label className="field-label">
              <span className="field-label-text">Paneelide kalle (°)</span>
              <input name="panelTiltDeg" defaultValue={String(input.panelTiltDeg)} className="input" />
            </label>
            <label className="field-label">
              <span className="field-label-text">Süsteemikaod (%)</span>
              <input name="systemLossesPercent" defaultValue={String(input.systemLossesPercent)} className="input" />
            </label>
            <label className="field-label">
              <span className="field-label-text">Prognoosi ulatus</span>
              <select name="hours" defaultValue={String(hours)} className="input">
                <option value="24">24h</option>
                <option value="48">48h</option>
              </select>
            </label>
            <label className="field-label">
              <span className="field-label-text">Ajalooline analüüs</span>
              <select name="historyYears" defaultValue={String(historyYears)} className="input">
                <option value="5">Viimased 5 aastat</option>
                <option value="10">Viimased 10 aastat</option>
              </select>
              <span className="field-hint">Serveri cache kasutatakse raskete päringute vähendamiseks.</span>
            </label>
            <div className="grid gap-2 sm:grid-cols-2 lg:col-span-1">
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-zinc-200">
                <input type="checkbox" name="hasEv" defaultChecked={input.hasEv} className="h-4 w-4" />
                Kas kasutajal on EV
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-zinc-200">
                <input type="checkbox" name="hasBattery" defaultChecked={input.hasBattery} className="h-4 w-4" />
                Kas kasutajal on aku
              </label>
            </div>

            <div className="lg:col-span-3 flex flex-wrap items-center gap-3">
              <button type="submit" className="btn-glow">Uuenda prognoos</button>
              <p className="text-xs text-zinc-400">
                Kasutatud asukoht: <span className="text-zinc-200">{geo.name}</span>
                {geo.usedDefaultLocation ? " (vaikimisi Tallinn)" : ""}
              </p>
            </div>
          </form>
        </section>

        {errorText ? (
          <section className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            API viga: {errorText}. Leht kasutab hetkel demo-vaadet käsitsi eeldustega.
          </section>
        ) : null}
        {usingDemo ? (
          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-zinc-300">
            Demo-vaade aktiveeritud: prognoos näitab simulatsiooniandmeid kuni API taastumiseni.
          </section>
        ) : null}
        {historicalError ? (
          <section className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-xs text-amber-100">
            Ajaloolise analüüsi API viga: {historicalError}. Kuvan ajutiselt varuandmed.
          </section>
        ) : null}

        {rows.length > 0 ? (
          <EnergyForecastDashboard rows={rows} summary={summary} hasEv={input.hasEv} hasBattery={input.hasBattery} />
        ) : (
          <section className="glass-panel mt-8 rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-zinc-50">Andmeid ei leitud</h2>
            <p className="mt-2 text-sm text-zinc-300">Kontrolli sisendeid või proovi mõne minuti pärast uuesti.</p>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-zinc-300">
          V1 loogika: PV hinnang põhineb kiirgusel, süsteemi võimsusel, kadudel ja lihtsatel suuna/kalde koefitsientidel.
          Soovitused põhinevad hinnal, pilvisusel ja PV tootlusel (lihtsustatud energyScore mudel).
        </section>
        <HistoricalSolarAnalysisPanel analysis={historicalAnalysis} loadingFallback={historicalFallback} />
      </main>
    </div>
  );
}
