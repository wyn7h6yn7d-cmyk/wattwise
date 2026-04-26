export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const toRatio = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return value <= 1 ? value : value / 100;
};

export const normalizeEurPerKwh = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > 3 ? value / 1000 : value;
};

export const detectPriceUnit = (value: number): "eur_per_kwh" | "eur_per_mwh_converted" =>
  Number.isFinite(value) && value > 3 ? "eur_per_mwh_converted" : "eur_per_kwh";

const TRAILING_UNIT = /\s*(?:€\/\s*kwh|eur\/\s*kwh|€\/kwh|kwh|kw|%|€|eur)\s*$/i;

/**
 * Parses calculator text inputs (Estonian comma or dot decimal, optional grouping, stray units).
 * Does not scale values (no /100 for kW or €/kWh).
 */
export function parseLocaleNumber(value: string): number | null {
  if (value == null) return null;
  let s = String(value).trim();
  if (!s) return null;

  s = s.replace(/^\+\s*/, "");
  s = s.replace(/[\u00A0\u202F\u2007]/g, " ");
  s = s.replace(/^(?:€|eur)\s*/i, "").trim();

  for (let i = 0; i < 4; i++) {
    const next = s.replace(TRAILING_UNIT, "").trim();
    if (next === s) break;
    s = next;
  }

  s = s.replace(/(\d)\s+(?=\d)/g, "$1");

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    const commaCount = (s.match(/,/g) || []).length;
    if (commaCount > 1) {
      s = s.replace(/,/g, "");
    } else {
      s = s.replace(",", ".");
    }
  } else if (hasDot) {
    const dotCount = (s.match(/\./g) || []).length;
    if (dotCount > 1) {
      const last = s.lastIndexOf(".");
      s = s.slice(0, last).replace(/\./g, "") + "." + s.slice(last + 1);
    }
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function toNumber(value: string): number {
  return parseLocaleNumber(value) ?? 0;
}
