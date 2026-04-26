"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CONSENT_UPDATED_EVENT,
  type CookieConsent,
  type CookieConsentChoice,
  readStoredConsent,
  saveConsent,
} from "@/lib/consent";

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const existing = readStoredConsent();
    setConsent(existing);
    setLoaded(true);
  }, []);

  useEffect(() => {
    const onConsentUpdated = (event: Event) => {
      const custom = event as CustomEvent<CookieConsent>;
      if (custom.detail) setConsent(custom.detail);
      else setConsent(readStoredConsent());
    };
    window.addEventListener(CONSENT_UPDATED_EVENT, onConsentUpdated);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, onConsentUpdated);
  }, []);

  const updateConsent = useCallback((choice: CookieConsentChoice) => {
    const saved = saveConsent(choice);
    if (saved) setConsent(saved);
  }, []);

  return useMemo(
    () => ({
      loaded,
      hasDecision: consent !== null,
      consent,
      analyticsEnabled: consent?.analytics === true,
      functionalEnabled: consent?.functional === true,
      updateConsent,
    }),
    [loaded, consent, updateConsent],
  );
}

