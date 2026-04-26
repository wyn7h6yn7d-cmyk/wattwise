"use client";

import { useEffect, useState } from "react";
import type { PurchaseType, UnlockState } from "@/lib/unlock";
import { FEATURES } from "@/lib/features";
import type { CalculatorReturnSlug } from "@/lib/calculator-slugs";

function safeUuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `p_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }
}

export function useProjectUnlock() {
  const [projectId, setProjectId] = useState("");
  const [unlock, setUnlock] = useState<UnlockState>({
    fullAnalysisUnlocked: false,
    pdfUnlocked: false,
    fullAnalysisSessionId: null,
    pdfSessionId: null,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [purchaseBusy, setPurchaseBusy] = useState<PurchaseType | null>(null);

  const readSearchParams = () =>
    new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

  const replaceSearchParams = (params: URLSearchParams) => {
    if (typeof window === "undefined") return;
    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}${window.location.hash}` : `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  };

  const persistUnlock = (next: UnlockState) => {
    if (!projectId) return;
    try {
      localStorage.setItem(
        `ek_unlock_${projectId}`,
        JSON.stringify({
          fullAnalysisUnlocked: next.fullAnalysisUnlocked,
          pdfUnlocked: next.pdfUnlocked,
          fullAnalysisSessionId: next.fullAnalysisSessionId,
          pdfSessionId: next.pdfSessionId,
        }),
      );
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const params = readSearchParams();
    const fromUrl = params.get("projectId")?.trim();
    const id = fromUrl && fromUrl.length >= 6 ? fromUrl : safeUuid();
    setProjectId(id);
    if (!fromUrl) {
      const next = new URLSearchParams(params.toString());
      next.set("projectId", id);
      replaceSearchParams(next);
    }
  }, []);

  useEffect(() => {
    if (!projectId) return;
    try {
      const raw = localStorage.getItem(`ek_unlock_${projectId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<UnlockState>;
      setUnlock((prev) => ({
        ...prev,
        fullAnalysisUnlocked: Boolean(parsed.fullAnalysisUnlocked),
        pdfUnlocked: Boolean(parsed.pdfUnlocked),
        fullAnalysisSessionId: typeof parsed.fullAnalysisSessionId === "string" ? parsed.fullAnalysisSessionId : null,
        pdfSessionId: typeof parsed.pdfSessionId === "string" ? parsed.pdfSessionId : null,
      }));
    } catch {
      /* ignore */
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const params = readSearchParams();
    const status = params.get("status");
    const sessionId = params.get("session_id")?.trim();
    const purchaseType = (params.get("purchaseType")?.trim() ?? "") as PurchaseType | "";

    if (status === "cancel") {
      setMessage("Makse katkestati. Midagi ei muutunud.");
      return;
    }
    if (status !== "success" || !sessionId) return;

    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/stripe/session-status?session_id=${encodeURIComponent(sessionId)}`);
        const data = (await res.json()) as { paid?: boolean; metadata?: Record<string, string> };
        if (cancelled) return;

        const paid = Boolean(data.paid);
        const meta = data.metadata ?? {};
        const metaOk =
          meta.projectId === projectId &&
          (meta.purchaseType === "full_analysis" || meta.purchaseType === "pdf_report");

        if (!paid || !metaOk) {
          setMessage("Makse kontroll ebaõnnestus. Proovi uuesti kontrollida.");
          return;
        }

        const next: UnlockState = { ...unlock };
        if (meta.purchaseType === "full_analysis" || purchaseType === "full_analysis") {
          next.fullAnalysisUnlocked = true;
          next.fullAnalysisSessionId = sessionId;
        }
        if (meta.purchaseType === "pdf_report" || purchaseType === "pdf_report") {
          next.pdfUnlocked = true;
          next.pdfSessionId = sessionId;
        }

        setUnlock(next);
        persistUnlock(next);
        setMessage("Makse kinnitatud. Ligipääs uuendatud.");

        const nextParams = new URLSearchParams(params.toString());
        nextParams.delete("status");
        nextParams.delete("session_id");
        nextParams.delete("purchaseType");
        replaceSearchParams(nextParams);
      } catch {
        if (cancelled) return;
        setMessage("Makse kontroll ebaõnnestus. Proovi uuesti.");
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [projectId, unlock]);

  const startCheckout = async (
    purchaseType: PurchaseType,
    options?: { returnSlug?: CalculatorReturnSlug },
  ) => {
    if (!projectId) return;
    setPurchaseBusy(purchaseType);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          purchaseType,
          fullAnalysisSessionId: unlock.fullAnalysisSessionId,
          returnSlug: options?.returnSlug,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setMessage(data.error ?? "Checkout'i loomine ebaõnnestus.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setMessage("Checkout'i loomine ebaõnnestus.");
    } finally {
      setPurchaseBusy(null);
    }
  };

  const checkPaymentStatus = async () => {
    if (!FEATURES.paywallEnabled) {
      setMessage("Hetkel ajutiselt tasuta testimiseks: maksekontrolli pole vaja.");
      return;
    }
    const sid = unlock.pdfSessionId ?? unlock.fullAnalysisSessionId;
    if (!sid) {
      setMessage("Puudub session ID, mida kontrollida.");
      return;
    }
    try {
      const res = await fetch(`/api/stripe/session-status?session_id=${encodeURIComponent(sid)}`);
      const data = (await res.json()) as { paid?: boolean; metadata?: Record<string, string> };
      const paid = Boolean(data.paid);
      const meta = data.metadata ?? {};
      if (!paid || meta.projectId !== projectId) {
        setMessage("Makse pole veel kinnitatud (või ID ei klapi).");
        return;
      }
      const next: UnlockState = { ...unlock };
      if (meta.purchaseType === "full_analysis") next.fullAnalysisUnlocked = true;
      if (meta.purchaseType === "pdf_report") next.pdfUnlocked = true;
      setUnlock(next);
      persistUnlock(next);
      setMessage("Makse kinnitatud. Ligipääs uuendatud.");
    } catch {
      setMessage("Makse kontroll ebaõnnestus.");
    }
  };

  return {
    projectId,
    unlock,
    message,
    setMessage,
    purchaseBusy,
    startCheckout,
    checkPaymentStatus,
  };
}

