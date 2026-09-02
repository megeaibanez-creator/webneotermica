"use client";

/**
 * Estado de consentimiento (molde Furgocasa).
 * 4 categorías. Consent Mode v2: el default `denied` se emite en el layout,
 * antes de cargar ningún tag. Aquí solo se hace el `update`.
 */

export type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

export const CONSENT_KEY = "neotermica_consent_v1";
export const CONSENT_EVENT = "neotermica:consent";
export const OPEN_PREFS_EVENT = "neotermica:open-cookie-prefs";

export const CONSENT_ALL: Consent = {
  necessary: true,
  analytics: true,
  marketing: true,
  preferences: true,
};

export const CONSENT_NONE: Consent = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Consent>;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      preferences: Boolean(parsed.preferences),
    };
  } catch {
    return null;
  }
}

type GtagArgs = [string, string, Record<string, string>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function sendPageView() {
  if (typeof window.gtag !== "function") return false;
  window.gtag("event", "page_view", {
    page_location: window.location.href,
    page_title: document.title,
  });
  return true;
}

export function pushConsentUpdate(consent: Consent, opts?: { pageView?: boolean }) {
  if (typeof window === "undefined") return;
  const args: GtagArgs = [
    "consent",
    "update",
    {
      ad_storage: consent.marketing ? "granted" : "denied",
      ad_user_data: consent.marketing ? "granted" : "denied",
      ad_personalization: consent.marketing ? "granted" : "denied",
      analytics_storage: consent.analytics ? "granted" : "denied",
      functionality_storage: consent.preferences ? "granted" : "denied",
    },
  ];
  window.dataLayer = window.dataLayer || [];

  const apply = () => {
    if (typeof window.gtag === "function") {
      window.gtag(...args);
      if (opts?.pageView && consent.analytics) sendPageView();
      return true;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
    return false;
  };

  if (apply()) return;
  window.setTimeout(apply, 100);
  window.setTimeout(apply, 500);
  window.setTimeout(apply, 1500);
}

export function saveConsent(consent: Consent) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  // El page_view del primer paint salió con analytics denied; sin este,
  // Tiempo real no te cuenta aunque hayas aceptado.
  pushConsentUpdate(consent, { pageView: consent.analytics });
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: consent }));
}

/** ¿Se puede medir? (consentimiento analítico + no estamos en local ni en el panel) */
export function analyticsAllowed(consent: Consent | null, pathname: string): boolean {
  if (!consent?.analytics) return false;
  if (pathname.startsWith("/administrator")) return false;
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) return false;
  return true;
}

/** Evento GA4 solo si hay consentimiento analítico. */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const consent = readConsent();
  if (!consent?.analytics) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
  if (typeof window.gtag === "function") window.gtag("event", name, params);
}
