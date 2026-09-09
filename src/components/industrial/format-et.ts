export function fmtEt(value: number, digits: number): string {
  return new Intl.NumberFormat("et-EE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

export type IndustrialChartTone = "dark" | "light";

export function chartPalette(tone: IndustrialChartTone) {
  if (tone === "light") {
    return {
      zinc: "#3f3f46",
      sky: "#0369a1",
      amber: "#a16207",
      slate: "#64748b",
      highlight: "#0f766e",
      muted: "#52525b",
      ink: "#18181b",
      grid: "#d4d4d8",
      track: "#f4f4f5",
    };
  }
  return {
    zinc: "rgba(212,212,216,0.92)",
    sky: "rgba(147,197,253,0.92)",
    amber: "rgba(252,211,77,0.88)",
    slate: "rgba(148,163,184,0.72)",
    highlight: "rgba(186,230,253,0.92)",
    muted: "rgba(161,161,170,0.9)",
    ink: "rgba(244,244,245,0.95)",
    grid: "rgba(255,255,255,0.08)",
    track: "rgba(255,255,255,0.04)",
  };
}
