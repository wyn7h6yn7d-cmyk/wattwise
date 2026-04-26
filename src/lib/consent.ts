export const CONSENT_VERSION = "1.0";
export const CONSENT_STORAGE_KEY = "ek_cookie_consent_v1";
export const OPEN_COOKIE_SETTINGS_EVENT = "ek:open-cookie-settings";
export const CONSENT_UPDATED_EVENT = "ek:consent-updated";

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  functional: boolean;
  updatedAt: string;
  version: string;
};

export type CookieConsentChoice = {
  analytics: boolean;
  functional: boolean;
};

export function createConsent(choice: CookieConsentChoice): CookieConsent {
  return {
    necessary: true,
    analytics: choice.analytics,
    functional: choice.functional,
    updatedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
}

export function readStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (typeof parsed !== "object" || parsed === null) return null;
    if (parsed.necessary !== true) return null;
    if (typeof parsed.analytics !== "boolean") return null;
    if (typeof parsed.functional !== "boolean") return null;
    return {
      necessary: true,
      analytics: parsed.analytics,
      functional: parsed.functional,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      version: typeof parsed.version === "string" ? parsed.version : CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

export function saveConsent(choice: CookieConsentChoice): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const consent = createConsent(choice);
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent(CONSENT_UPDATED_EVENT, { detail: consent }));
    return consent;
  } catch {
    return null;
  }
}

export function hasStoredConsentDecision(): boolean {
  return readStoredConsent() !== null;
}

