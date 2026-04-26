"use client";

import { FEATURES } from "@/lib/features";
import type { CalculatorReturnSlug } from "@/lib/calculator-slugs";
import {
  canDownloadPdf,
  canViewFullAnalysis,
  type PurchaseType,
  type UnlockState,
} from "@/lib/unlock";

type Props = {
  projectId: string;
  unlock: UnlockState;
  purchaseBusy: PurchaseType | null;
  startCheckout: (purchaseType: PurchaseType, options?: { returnSlug?: CalculatorReturnSlug }) => Promise<void>;
  checkPaymentStatus: () => void;
  onDownload: () => void | Promise<void>;
  returnSlug: CalculatorReturnSlug;
  /** Vaikimisi mt-6; nt päikese lehel saab anda mt-0 ja mähkida välimise mt-4 sisse */
  className?: string;
};

export function CalculatorPdfActions({
  projectId,
  unlock,
  purchaseBusy,
  startCheckout,
  checkPaymentStatus,
  onDownload,
  returnSlug,
  className = "mt-6",
}: Props) {
  if (!FEATURES.paywallEnabled) {
    return (
      <div className={`${className} rounded-2xl border border-white/10 bg-white/[0.02] p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-300">Laadi alla kokkuvõtte PDF.</p>
          <button type="button" className="btn-glow" onClick={() => void onDownload()}>
            Laadi PDF alla
          </button>
        </div>
      </div>
    );
  }

  if (!canViewFullAnalysis(unlock)) {
    return null;
  }

  if (!canDownloadPdf(unlock)) {
    return (
      <div className={`${className} rounded-2xl border border-amber-300/25 bg-amber-400/10 p-4`}>
        <p className="text-sm text-zinc-200">
          Täisanalüüs on selle projekti jaoks avatud. PDF-i allalaadimiseks on vaja PDF raporti kinnitust.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-glow"
            onClick={() => startCheckout("pdf_report", { returnSlug })}
            disabled={purchaseBusy === "pdf_report"}
          >
            {purchaseBusy === "pdf_report" ? "Laen..." : "Osta PDF raport"}
          </button>
          <button type="button" className="btn-ghost" onClick={checkPaymentStatus}>
            Kontrolli ligipääsu staatust
          </button>
        </div>
        {projectId ? (
          <p className="mt-2 text-xs text-zinc-400">
            Projekt: <span className="font-medium text-zinc-200">{projectId}</span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`${className} rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4`}>
      <p className="text-sm text-zinc-100">PDF kokkuvõte on selle projekti jaoks allalaaditav.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-glow" onClick={() => void onDownload()}>
          Laadi PDF alla
        </button>
      </div>
      {projectId ? (
        <p className="mt-2 text-xs text-zinc-300">
          Projekt: <span className="font-medium text-zinc-100">{projectId}</span>
        </p>
      ) : null}
    </div>
  );
}
