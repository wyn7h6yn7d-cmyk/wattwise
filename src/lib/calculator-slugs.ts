export const CALCULATOR_RETURN_SLUGS = [
  "paikesejaam",
  "vpp",
  "elektripaketid",
  "ev-laadimine",
  "peak-shaving",
] as const;

export type CalculatorReturnSlug = (typeof CALCULATOR_RETURN_SLUGS)[number];

export function sanitizeCalculatorReturnSlug(raw: string | undefined): CalculatorReturnSlug {
  const s = raw?.trim();
  if (s && (CALCULATOR_RETURN_SLUGS as readonly string[]).includes(s)) {
    return s as CalculatorReturnSlug;
  }
  return "paikesejaam";
}
