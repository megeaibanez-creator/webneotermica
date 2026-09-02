"use client";

import { usePathname } from "next/navigation";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

/**
 * GTM *o* GoogleAnalytics, nunca los dos.
 * El tag se monta siempre (molde Furgocasa / ACTTAX). El Consent Mode
 * (denied → update) decide si hay cookies; no se esconde el script.
 */
export default function Analytics() {
  const pathname = usePathname();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  if (process.env.NODE_ENV !== "production") return null;
  if (pathname.startsWith("/administrator")) return null;
  if (gtmId) return <GoogleTagManager gtmId={gtmId} />;
  if (gaId) return <GoogleAnalytics gaId={gaId} />;
  return null;
}
