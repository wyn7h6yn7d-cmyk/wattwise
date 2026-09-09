import { parseLocaleNumber } from "../units";

export type NormalizedConsumptionRow = {
  timestamp: string;
  consumptionKwh: number;
};

export type ParseConsumptionCsvResult =
  | { ok: true; rows: NormalizedConsumptionRow[] }
  | { ok: false; error: string };

type RawEntry = {
  timestamp: Date;
  kwh: number | null;
  kw: number | null;
};

const DATETIME_KEYS = ["datetime", "aeg", "timestamp"];
const DATE_KEYS = ["date", "kuupaev", "kuupäev"];
const TIME_KEYS = ["time", "kellaaeg"];
const KWH_KEYS = ["consumption_kwh", "tarbimine_kwh", "kwh", "tarbimine", "consumption"];
const KW_KEYS = ["kw", "power_kw", "power"];

const normalizeHeader = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\u00C0-\u024f]+/g, "_")
    .replace(/^_+|_+$/g, "");

const pickDelimiter = (line: string) => {
  const delimiters = [",", ";", "\t"];
  let best = ",";
  let bestScore = -1;
  for (const delimiter of delimiters) {
    const score = line.split(delimiter).length;
    if (score > bestScore) {
      best = delimiter;
      bestScore = score;
    }
  }
  return best;
};

const findIndex = (headers: string[], keys: string[]) => headers.findIndex((h) => keys.includes(h));

function parseTimestamp(value: string): Date | null {
  const raw = value.trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function inferIntervalHours(entries: RawEntry[]): number | null {
  const sortedTs = [...entries]
    .map((entry) => entry.timestamp.getTime())
    .sort((a, b) => a - b);
  if (sortedTs.length < 2) return null;
  const diffs: number[] = [];
  for (let i = 1; i < sortedTs.length; i += 1) {
    const hours = (sortedTs[i] - sortedTs[i - 1]) / (1000 * 60 * 60);
    if (hours > 0 && hours <= 24) diffs.push(hours);
  }
  if (!diffs.length) return null;
  diffs.sort((a, b) => a - b);
  const mid = Math.floor(diffs.length / 2);
  return diffs.length % 2 === 0 ? (diffs[mid - 1] + diffs[mid]) / 2 : diffs[mid];
}

export function parseConsumptionCsv(fileContent: string): ParseConsumptionCsvResult {
  try {
    const normalized = fileContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = normalized.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    if (lines.length < 2) return { ok: false, error: "CSV failis puuduvad andmeread." };

    const delimiter = pickDelimiter(lines[0]);
    const headers = lines[0].split(delimiter).map((header) => normalizeHeader(header));

    const datetimeIdx = findIndex(headers, DATETIME_KEYS);
    const dateIdx = findIndex(headers, DATE_KEYS);
    const timeIdx = findIndex(headers, TIME_KEYS);
    const kwhIdx = findIndex(headers, KWH_KEYS);
    const kwIdx = findIndex(headers, KW_KEYS);

    if (datetimeIdx < 0 && dateIdx < 0) {
      return { ok: false, error: "CSV failis puudub kuupäeva/aeg veerg (datetime/date/aeg/kuupäev)." };
    }
    if (kwhIdx < 0 && kwIdx < 0) {
      return { ok: false, error: "CSV failis puudub tarbimise veerg (consumption_kwh/kWh/tarbimine)." };
    }

    const entries: RawEntry[] = [];
    for (let i = 1; i < lines.length; i += 1) {
      const parts = lines[i].split(delimiter).map((part) => part.trim());
      if (!parts.some((part) => part.length > 0)) continue;

      let ts: Date | null = null;
      if (datetimeIdx >= 0) {
        ts = parseTimestamp(parts[datetimeIdx] ?? "");
      } else {
        const d = (parts[dateIdx] ?? "").trim();
        const t = timeIdx >= 0 ? (parts[timeIdx] ?? "").trim() : "";
        ts = parseTimestamp(t ? `${d} ${t}` : d);
      }
      if (!ts) continue;

      const kwh = kwhIdx >= 0 ? parseLocaleNumber(parts[kwhIdx] ?? "") : null;
      const kw = kwIdx >= 0 ? parseLocaleNumber(parts[kwIdx] ?? "") : null;
      if ((kwh ?? kw) == null) continue;

      entries.push({
        timestamp: ts,
        kwh: kwh != null && kwh >= 0 ? kwh : null,
        kw: kw != null && kw >= 0 ? kw : null,
      });
    }

    if (!entries.length) return { ok: false, error: "CSV failist ei leitud sobivaid ridu." };

    const intervalHours = inferIntervalHours(entries);
    const rows: NormalizedConsumptionRow[] = entries
      .map((entry) => {
        const consumptionKwh = entry.kwh ?? (entry.kw != null && intervalHours != null ? entry.kw * intervalHours : null);
        if (consumptionKwh == null || !Number.isFinite(consumptionKwh)) return null;
        return {
          timestamp: entry.timestamp.toISOString(),
          consumptionKwh: consumptionKwh,
        };
      })
      .filter((row): row is NormalizedConsumptionRow => Boolean(row));

    if (!rows.length) {
      return { ok: false, error: "CSV tarbimisridu ei saanud normaliseerida kWh kujule." };
    }

    return { ok: true, rows };
  } catch {
    return { ok: false, error: "CSV töötlemine ebaõnnestus." };
  }
}
