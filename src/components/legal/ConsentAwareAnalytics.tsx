"use client";

import { Analytics } from "@vercel/analytics/next";
import { useCookieConsent } from "@/lib/useCookieConsent";

export function ConsentAwareAnalytics() {
  const { loaded, analyticsEnabled } = useCookieConsent();

  if (!loaded || !analyticsEnabled) return null;
  // Analytics scriptid tohib laadida ainult analytics nõusoleku korral.
  return <Analytics />;
}

