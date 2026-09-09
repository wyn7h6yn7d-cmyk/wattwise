import { parseLocaleNumber } from "../units";

/**
 * Tööstusmooduli v0.8 hinnaseeria CSV parser.
 * Formaat: timestamp,buy_price_eur_mwh,export_price_eur_mwh
 */

export type PriceCsvRow = {
  timestampRaw: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** Naive UTC millisekundid (CSV kellaaeg ilma ajavööndi teisenduseta). */
  timestampMs: number;
  buyPriceEurPerMwh: number;
  exportPriceEurPerMwh: number;
};

export type ParsePriceCsvResult =
  | { ok: true; rows: PriceCsvRow[] }
  | { ok: false; error: string };

const TIMESTAMP_HEADERS = new Set(["timestamp", "aeg", "date", "datetime"]);
const BUY_HEADERS = new Set([
  "buy_price_eur_mwh",
  "buy_eur_mwh",
  "ostuhind",
  "ostuhind_eur_mwh",
  "price_eur_mwh",
  "price",
]);
const EXPORT_HEADERS = new Set([
  "export_price_eur_mwh",
  "export_eur_mwh",
  "myyghind",
  "müügihind",
  "myyghind_eur_mwh",
  "sell_price_eur_mwh",
]);

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
    { delimiter: ";", score: splitPriceCsvLine(headerLine, ";").length },
    { delimiter: ",", score: splitPriceCsvLine(headerLine, ",").length },
    { delimiter: "\t", score: splitPriceCsvLine(headerLine, "\t").length },
  ];
  counts.sort((a, b) => b.score - a.score);
  return counts[0]!.score > 1 ? counts[0]!.delimiter : ",";
}

export function splitPriceCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
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

function parseNaiveTimestamp(raw: string): Omit<PriceCsvRow, "buyPriceEurPerMwh" | "exportPriceEurPerMwh" | "timestampRaw"> | null {
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

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatPriceTimestampLabel(
  row: Pick<PriceCsvRow, "year" | "month" | "day" | "hour" | "minute">,
): string {
  return `${row.year}-${pad2(row.month)}-${pad2(row.day)} ${pad2(row.hour)}:${pad2(row.minute)}`;
}

export function parsePriceCsv(fileContent: string): ParsePriceCsvResult {
  const normalized = fileContent.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const nonEmpty = lines
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter((item) => item.line.length > 0);

  if (nonEmpty.length < 2) {
    return {
      ok: false,
      error: "Hinnaseeria CSV on tühi või liiga lühike. Lisa päiserida ja vähemalt üks hinna rida.",
    };
  }

  const delimiter = pickDelimiter(nonEmpty[0]!.line);
  const headers = splitPriceCsvLine(nonEmpty[0]!.line, delimiter).map(normalizeHeader);
  const timestampIdx = headers.findIndex((header) => TIMESTAMP_HEADERS.has(header));
  const buyIdx = headers.findIndex((header) => BUY_HEADERS.has(header));
  const exportIdx = headers.findIndex((header) => EXPORT_HEADERS.has(header));

  if (timestampIdx < 0) {
    return { ok: false, error: "Hinnaseeria CSV-st ei leitud aja veergu. Lisa veerg timestamp." };
  }
  if (buyIdx < 0) {
    return {
      ok: false,
      error: "Hinnaseeria CSV-st ei leitud ostuhinna veergu. Lisa veerg buy_price_eur_mwh.",
    };
  }
  if (exportIdx < 0) {
    return {
      ok: false,
      error: "Hinnaseeria CSV-st ei leitud müügihinna veergu. Lisa veerg export_price_eur_mwh.",
    };
  }

  const rows: PriceCsvRow[] = [];
  for (let i = 1; i < nonEmpty.length; i += 1) {
    const { line, lineNumber } = nonEmpty[i]!;
    const parts = splitPriceCsvLine(line, delimiter);
    const timestampRaw = parts[timestampIdx] ?? "";
    const parsedTs = parseNaiveTimestamp(timestampRaw);
    if (!parsedTs) {
      return {
        ok: false,
        error: `Hinnaseeria CSV-s on vigane ajatempel real ${lineNumber}.`,
      };
    }

    const buyRaw = parts[buyIdx] ?? "";
    const exportRaw = parts[exportIdx] ?? "";
    const buyPriceEurPerMwh = parseLocaleNumber(buyRaw);
    const exportPriceEurPerMwh = parseLocaleNumber(exportRaw);
    if (buyPriceEurPerMwh == null || !Number.isFinite(buyPriceEurPerMwh)) {
      return {
        ok: false,
        error: `Hinnaseeria CSV-s on vigane ostuhind real ${lineNumber}.`,
      };
    }
    if (exportPriceEurPerMwh == null || !Number.isFinite(exportPriceEurPerMwh)) {
      return {
        ok: false,
        error: `Hinnaseeria CSV-s on vigane müügihind real ${lineNumber}.`,
      };
    }

    rows.push({
      timestampRaw,
      ...parsedTs,
      buyPriceEurPerMwh,
      exportPriceEurPerMwh,
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: "Hinnaseeria CSV-st ei leitud sobivaid ridu." };
  }

  rows.sort((a, b) => a.timestampMs - b.timestampMs);
  return { ok: true, rows };
}

export const SAMPLE_PRICE_CSV = [
  "timestamp,buy_price_eur_mwh,export_price_eur_mwh",
  "2026-01-01 00:00,95,45",
  "2026-01-01 01:00,90,40",
  "2026-01-01 02:00,88,38",
].join("\n");
