"use client";

import { Cookie } from "lucide-react";
import { OPEN_PREFS_EVENT } from "./consent";

/** Pie: mismo gesto que Furgocasa (`CookieSettingsButton`). */
export default function OpenCookiePrefs({
  className = "",
  children = "Configurar cookies",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 text-left ${className}`}
      onClick={() => window.dispatchEvent(new Event(OPEN_PREFS_EVENT))}
      aria-label="Abrir configuración de cookies"
    >
      <Cookie className="h-4 w-4" aria-hidden />
      {children}
    </button>
  );
}
