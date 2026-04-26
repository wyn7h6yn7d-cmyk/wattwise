export type PdfCalculatorType =
  | "paikesejaam"
  | "vpp"
  | "elektripaketid"
  | "ev-laadimine"
  | "peak-shaving";

export type PdfReportPayload = {
  calculatorType: PdfCalculatorType;
  projectName?: string;
  summary?: string;
  // “inputs” ja “summary” on struktureeritud key-value blokid (mitte raw JSON dump).
  inputs: Array<{ group: string; items: Array<{ label: string; value: string }> }>;
  assumptions?: Array<{ label: string; value: string }>;
  risksAndLimits?: Array<{ label: string; value: string }>;
  analysisBasis?: "defaults" | "advanced";
  disclaimer?: string;
  // Põhinäitajad (kõige olulisemad numbrid lehel 1 ja 3)
  metrics: Array<{ label: string; value: string; sub?: string }>;
  // Optional charts (V1: lihtsad, print-sõbralikud)
  charts?: {
    cashflowByYear?: Array<number>; // EUR/year
    comparisonBars?: Array<{ label: string; a: number; b: number; aLabel: string; bLabel: string }>;
  };
  // vaba tekstiplokk soovitusteks
  recommendation?: {
    title: string;
    bullets: string[];
  };
};

