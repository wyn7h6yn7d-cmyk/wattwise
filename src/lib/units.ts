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

export function toNumber(value: string) {
  if (!value.trim()) return 0;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
