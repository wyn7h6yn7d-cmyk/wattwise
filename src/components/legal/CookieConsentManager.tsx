"use client";

import { useEffect, useState } from "react";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { CookieSettingsModal } from "@/components/legal/CookieSettingsModal";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";
import { useCookieConsent } from "@/lib/useCookieConsent";

export function CookieConsentManager() {
  const { loaded, hasDecision, consent, updateConsent } = useCookieConsent();
  const [modalOpen, setModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [functional, setFunctional] = useState(false);

  useEffect(() => {
    if (!consent) return;
    setAnalytics(consent.analytics);
    setFunctional(consent.functional);
  }, [consent]);

  useEffect(() => {
    const open = () => setModalOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  const acceptAll = () => {
    updateConsent({ analytics: true, functional: true });
    setAnalytics(true);
    setFunctional(true);
    setModalOpen(false);
  };

  const rejectOptional = () => {
    updateConsent({ analytics: false, functional: false });
    setAnalytics(false);
    setFunctional(false);
    setModalOpen(false);
  };

  const save = () => {
    updateConsent({ analytics, functional });
    setModalOpen(false);
  };

  if (!loaded) return null;
  return (
    <>
      {!hasDecision ? (
        <CookieConsentBanner
          onAcceptAll={acceptAll}
          onRejectOptional={rejectOptional}
          onManage={() => setModalOpen(true)}
        />
      ) : null}
      <CookieSettingsModal
        open={modalOpen}
        analytics={analytics}
        functional={functional}
        onClose={() => setModalOpen(false)}
        onSave={save}
        onAcceptAll={acceptAll}
        onRejectOptional={rejectOptional}
        onToggleAnalytics={setAnalytics}
        onToggleFunctional={setFunctional}
      />
    </>
  );
}

