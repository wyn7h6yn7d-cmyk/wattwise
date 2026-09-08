import { parseLocaleNumber } from "../units";

/**
 * Tööstusmooduli v0.2 CSV parser.
 *
 * Negatiivne tarbimine: kogu fail lükatakse tagasi selge veateatega.
 * v0.2 ei nulli negatiivseid ridu, et andmekvaliteedi viga ei peituks.
 */

export type ConsumptionCsvRow = {
  /** Algne ajatempli tekst failist. */
  timestampRaw: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** Naive UTC millisekundid (CSV kellaaeg ilma ajavööndi teisenduseta). */
  timestampMs: number;
  consumptionKwh: number;
};

export type ParseConsumptionCsvResult =
  | { ok: true; rows: ConsumptionCsvRow[] }
  | { ok: false; error: string };

const TIMESTAMP_HEADERS = new Set(["timestamp", "aeg", "date", "datetime"]);
const CONSUMPTION_HEADERS = new Set(["consumption_kwh", "tarbimine_kwh", "kwh", "consumption"]);

const ISO_NAIVE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/;

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");
}

function pickDelimiter(headerLine: string): string {
  const counts = [
    { delimiter: ";", score: splitCsvLine(headerLine, ";").length },
    { delimiter: ",", score: splitCsvLine(headerLine, ",").length },
    { delimiter: "\t", score: splitCsvLine(headerLine, "\t").length },
  ];
  counts.sort((a, b) => b.score - a.score);
  return counts[0].score > 1 ? counts[0].delimiter : ",";
}

export function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

function parseNaiveTimestamp(raw: string): Omit<ConsumptionCsvRow, "consumptionKwh" | "timestampRaw"> | null {
  const value = raw.trim().replace(/^\uFEFF/, "");
  if (!value) return null;
  const match = value.match(ISO_NAIVE);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4] != null ? Number(match[4]) : 0;
  const minute = match[5] != null ? Number(match[5]) : 0;
  const second = match[6] != null ? Number(match[6]) : 0;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) {
    return null;
  }
  return {
    year,
    month,
    day,
    hour,
    minute,
    timestampMs: Date.UTC(year, month - 1, day, hour, minute, second),
  };
}

export function parseConsumptionCsv(fileContent: string): ParseConsumptionCsvResult {
  const normalized = fileContent.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const nonEmpty = lines
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter((item) => item.line.length > 0);

  if (nonEmpty.length < 2) {
    return { ok: false, error: "CSV fail on tühi või liiga lühike." };
  }

  const delimiter = pickDelimiter(nonEmpty[0].line);
  const headers = splitCsvLine(nonEmpty[0].line, delimiter).map(normalizeHeader);
  const timestampIdx = headers.findIndex((header) => TIMESTAMP_HEADERS.has(header));
  const consumptionIdx = headers.findIndex((header) => CONSUMPTION_HEADERS.has(header));

  if (timestampIdx < 0 && consumptionIdx < 0) {
    return {
      ok: false,
      error: "CSV failist ei leitud aja ega tarbimise veergu. Kasuta veerge timestamp ja consumption_kwh.",
    };
  }
  if (timestampIdx < 0) {
    return {
      ok: false,
      error: "CSV failist ei leitud aja veergu. Lisa veerg timestamp (või aeg / date).",
    };
  }
  if (consumptionIdx < 0) {
    return {
      ok: false,
      error: "CSV failist ei leitud tarbimise veergu. Lisa veerg consumption_kwh (või tarbimine_kwh).",
    };
  }

  const rows: ConsumptionCsvRow[] = [];
  for (let i = 1; i < nonEmpty.length; i += 1) {
    const { line, lineNumber } = nonEmpty[i];
    const parts = splitCsvLine(line, delimiter);
    const timestampRaw = parts[timestampIdx] ?? "";
    const parsedTs = parseNaiveTimestamp(timestampRaw);
    if (!parsedTs) {
      return {
        ok: false,
        error: `CSV failis on vigased tarbimisväärtused. Real ${lineNumber} ei õnnestunud ajatempli lugeda.`,
      };
    }

    const consumptionRaw = parts[consumptionIdx] ?? "";
    const consumptionKwh = parseLocaleNumber(consumptionRaw);
    if (consumptionKwh == null || consumptionKwh < 0) {
      return {
        ok: false,
        error: `CSV failis on vigased tarbimisväärtused. Real ${lineNumber} on tarbimine puuduv või negatiivne.`,
      };
    }

    rows.push({
      timestampRaw,
      ...parsedTs,
      consumptionKwh,
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: "CSV failist ei leitud sobivaid andmeridu." };
  }

  rows.sort((a, b) => a.timestampMs - b.timestampMs || a.hour - b.hour || a.minute - b.minute);
  return { ok: true, rows };
}

export const SAMPLE_CONSUMPTION_CSV = [
  "timestamp,consumption_kwh",
  "2026-01-01 00:00,120",
  "2026-01-01 01:00,115",
  "2026-01-01 02:00,110",
].join("\n");
