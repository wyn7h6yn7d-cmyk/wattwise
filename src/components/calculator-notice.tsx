"use client";

import { FEATURES } from "@/lib/features";

export function CalculatorNotice({
  message,
  onDismiss,
  onCheckPayment,
  className = "",
}: {
  message: string | null;
  onDismiss: () => void;
  onCheckPayment: () => void;
  className?: string;
}) {
  if (!message) return null;

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>{message}</p>
        <button type="button" className="btn-ghost" onClick={onDismiss}>
          Peida
        </button>
      </div>
      {FEATURES.paywallEnabled ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={onCheckPayment}>
            Kontrolli ligipääsu staatust
          </button>
        </div>
      ) : null}
    </div>
  );
}
