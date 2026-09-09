"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import { parseConsumptionCsv, type NormalizedConsumptionRow } from "@/lib/import/consumption-csv";

type Summary = {
  rowCount: number;
  periodStart: string;
  periodEnd: string;
  totalConsumptionKwh: number;
  averageDailyConsumptionKwh: number;
  maxRowConsumptionKwh: number;
};

type Props = {
  className?: string;
  onImported?: (rows: NormalizedConsumptionRow[]) => void;
};

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("et-EE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatNumber(value: number, maxDigits = 2): string {
  return new Intl.NumberFormat("et-EE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits,
  }).format(value);
}

function buildSummary(rows: NormalizedConsumptionRow[]): Summary | null {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const periodStartDate = new Date(sorted[0].timestamp);
  const periodEndDate = new Date(sorted[sorted.length - 1].timestamp);

  const totalConsumptionKwh = rows.reduce((sum, row) => sum + Math.max(row.consumptionKwh, 0), 0);
  const maxRowConsumptionKwh = rows.reduce((max, row) => Math.max(max, Math.max(row.consumptionKwh, 0)), 0);

  const uniqueDays = new Set(
    rows.map((row) => {
      const ts = new Date(row.timestamp);
      const y = ts.getUTCFullYear();
      const m = String(ts.getUTCMonth() + 1).padStart(2, "0");
      const d = String(ts.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }),
  );

  const averageDailyConsumptionKwh = uniqueDays.size > 0 ? totalConsumptionKwh / uniqueDays.size : totalConsumptionKwh;

  return {
    rowCount: rows.length,
    periodStart: formatDateTime(periodStartDate),
    periodEnd: formatDateTime(periodEndDate),
    totalConsumptionKwh,
    averageDailyConsumptionKwh,
    maxRowConsumptionKwh,
  };
}

export function ConsumptionCsvUpload({ className = "", onImported }: Props) {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<NormalizedConsumptionRow[]>([]);

  const summary = useMemo(() => buildSummary(rows), [rows]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setRows([]);

    try {
      const fileContent = await file.text();
      const parsed = parseConsumptionCsv(fileContent);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      setRows(parsed.rows);
      onImported?.(parsed.rows);
    } catch {
      setError("CSV faili lugemine ebaõnnestus. Proovi uuesti.");
    }
  };

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-3 ${className}`}>
      <label className="field-label">
        <span className="field-label-text">CSV tarbimisandmete import</span>
        <input type="file" accept=".csv,text/csv" className="input" onChange={(e) => void handleFileChange(e)} />
        <span className="field-hint">
          Faili ei laadita serverisse. Import ja töötlemine toimub brauseris.
        </span>
      </label>

      {fileName ? (
        <p className="mt-2 text-xs text-zinc-300">
          Valitud fail: <span className="font-medium text-zinc-100">{fileName}</span>
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">{error}</p>
      ) : null}

      {summary ? (
        <div className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-3 text-sm text-zinc-100">
          <p className="font-medium text-emerald-100">Impordi kokkuvõte</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <p>Ridade arv: {summary.rowCount}</p>
            <p>Perioodi algus: {summary.periodStart}</p>
            <p>Perioodi lõpp: {summary.periodEnd}</p>
            <p>Kogutarbimine: {formatNumber(summary.totalConsumptionKwh, 1)} kWh</p>
            <p>Keskmine päevatarbimine: {formatNumber(summary.averageDailyConsumptionKwh, 1)} kWh</p>
            <p>Maksimaalne rea tarbimine: {formatNumber(summary.maxRowConsumptionKwh, 3)} kWh</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
