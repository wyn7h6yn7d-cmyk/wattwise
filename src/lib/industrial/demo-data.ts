/**
 * Tööstusmooduli v1.0 demo CSV-d esitluseks ja käsitsi testimiseks.
 * 7 päeva × 24 h tarbimine + sama perioodi hinnaseeria.
 */

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function timestampLabel(day: number, hour: number): string {
  return `2026-03-${pad2(day)} ${pad2(hour)}:00`;
}

/** Simple industrial load shape (kWh per hour). */
function demoConsumptionKwh(dayIndex: number, hour: number): number {
  const weekdayBoost = dayIndex % 7 < 5 ? 1 : 0.72;
  let base = 38;
  if (hour >= 6 && hour < 8) base = 52;
  else if (hour >= 8 && hour < 12) base = 78;
  else if (hour >= 12 && hour < 14) base = 92;
  else if (hour >= 14 && hour < 17) base = 85;
  else if (hour >= 17 && hour < 20) base = 68;
  else if (hour >= 20 && hour < 22) base = 50;
  const wobble = ((dayIndex * 3 + hour * 7) % 9) - 4;
  return Math.max(25, Math.round((base + wobble) * weekdayBoost));
}

/** Buy/export prices (€/MWh) with daytime peak. */
function demoBuyPrice(hour: number): number {
  if (hour >= 8 && hour < 11) return 118;
  if (hour >= 11 && hour < 14) return 132;
  if (hour >= 14 && hour < 18) return 125;
  if (hour >= 18 && hour < 21) return 140;
  if (hour >= 21 || hour < 6) return 72;
  return 95;
}

function demoExportPrice(hour: number): number {
  if (hour >= 11 && hour < 15) return 52;
  if (hour >= 8 && hour < 18) return 45;
  return 32;
}

export const DEMO_CONSUMPTION_FILENAME = "demo-tarbimine.csv";
export const DEMO_PRICES_FILENAME = "demo-hinnad.csv";

/** Recommended PV / battery / price fields for the one-click demo path. */
export const DEMO_RECOMMENDED_INPUTS = {
  companyName: "Demo tööstusprofiil",
  pvPowerKw: "800",
  pvSpecificYieldKwhPerKw: "950",
  batteryCapacityKwh: "500",
  batteryPowerKw: "250",
  batteryPurpose: "self_consumption" as const,
  averageElectricityPriceEurPerMwh: "110",
};

export function buildDemoConsumptionCsv(): string {
  const lines = ["timestamp,consumption_kwh"];
  for (let day = 1; day <= 7; day += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      lines.push(`${timestampLabel(day, hour)},${demoConsumptionKwh(day - 1, hour)}`);
    }
  }
  return lines.join("\n");
}

export function buildDemoPricesCsv(): string {
  const lines = ["timestamp,buy_price_eur_mwh,export_price_eur_mwh"];
  for (let day = 1; day <= 7; day += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      lines.push(
        `${timestampLabel(day, hour)},${demoBuyPrice(hour)},${demoExportPrice(hour)}`,
      );
    }
  }
  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
