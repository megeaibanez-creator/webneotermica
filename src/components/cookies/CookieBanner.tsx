"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Cookie,
  Megaphone,
  Settings,
  Shield,
  X,
} from "lucide-react";
import {
  CONSENT_ALL,
  CONSENT_NONE,
  OPEN_PREFS_EVENT,
  readConsent,
  saveConsent,
  type Consent,
} from "./consent";

const TIPOS = [
  {
    id: "necessary" as const,
    name: "Cookies necesarias",
    description:
      "Estas cookies son esenciales para el funcionamiento del sitio web. Sin ellas, el sitio no funcionaría correctamente.",
    icon: Shield,
    required: true,
  },
  {
    id: "analytics" as const,
    name: "Cookies analíticas",
    description:
      "Nos permiten contar las visitas y analizar cómo los usuarios navegan por el sitio para mejorarlo.",
    icon: BarChart3,
    required: false,
  },
  {
    id: "preferences" as const,
    name: "Cookies funcionales",
    description:
      "Permiten recordar tus preferencias (como el hilo abierto del asistente) para una experiencia más personalizada.",
    icon: Settings,
    required: false,
  },
  {
    id: "marketing" as const,
    name: "Cookies de marketing",
    description:
      "Se utilizan para mostrarte anuncios relevantes y medir la efectividad de las campañas publicitarias.",
    icon: Megaphone,
    required: false,
  },
];

/**
 * Molde Furgocasa (`cookie-banner.tsx`): barra inferior con galleta +
 * Configurar / Aceptar todas; modal centrado con 4 categorías e interruptores.
 * Color de marca: crimson Neotérmica en lugar del naranja Furgocasa.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [modal, setModal] = useState(false);
  const [prefs, setPrefs] = useState<Consent>(CONSENT_NONE);

  useEffect(() => {
    const stored = readConsent();
    if (stored) setPrefs(stored);
    else setVisible(true);

    const open = () => {
      setPrefs(readConsent() ?? CONSENT_NONE);
      setModal(true);
    };
    window.addEventListener(OPEN_PREFS_EVENT, open);
    return () => window.removeEventListener(OPEN_PREFS_EVENT, open);
  }, []);

  const decide = useCallback((consent: Consent) => {
    saveConsent(consent);
    setPrefs(consent);
    setVisible(false);
    setModal(false);
  }, []);

  if (!visible && !modal) return null;

  return (
    <>
      {visible && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[130] border-t border-gray-200 bg-white p-4 shadow-lg md:p-6"
          role="region"
          aria-label="Banner de consentimiento de cookies"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <Cookie
                    className="mt-1 h-8 w-8 flex-shrink-0 text-accent"
                    aria-hidden
                  />
                  <div>
                    <h3 className="mb-1 text-lg font-bold text-gray-900">
                      Utilizamos cookies
                    </h3>
                    <p className="text-sm text-gray-600">
                      Usamos cookies propias y de terceros para mejorar tu
                      experiencia, analizar el tráfico y mostrarte contenido
                      personalizado. Puedes aceptar todas o configurar tus
                      preferencias.{" "}
                      <Link
                        href="/politica-de-cookies"
                        className="text-accent hover:underline"
                      >
                        Política de cookies
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={() => setModal(true)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Configurar
                </button>
                <button
                  type="button"
                  onClick={() => decide(CONSENT_ALL)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
                >
                  Aceptar todas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-title"
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <Cookie className="h-8 w-8 text-accent" aria-hidden />
                <h2
                  id="cookie-settings-title"
                  className="text-xl font-bold text-gray-900"
                >
                  Configuración de cookies
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModal(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Cerrar configuración de cookies"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <p className="mb-6 text-gray-600">
                Elige qué tipos de cookies deseas aceptar. Las cookies necesarias
                no se pueden desactivar ya que son imprescindibles para el
                funcionamiento del sitio.
              </p>
              <div className="space-y-4">
                {TIPOS.map((tipo) => {
                  const enabled =
                    tipo.id === "necessary" ? true : prefs[tipo.id];
                  const Icon = tipo.icon;
                  return (
                    <div
                      key={tipo.id}
                      className={`rounded-xl border-2 p-4 transition-colors ${
                        enabled
                          ? "border-accent bg-accent/5"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                            enabled
                              ? "bg-accent text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                          aria-hidden
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <h3
                              className="font-semibold text-gray-900"
                              id={`cookie-${tipo.id}-label`}
                            >
                              {tipo.name}
                            </h3>
                            {tipo.required ? (
                              <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-600">
                                Siempre activas
                              </span>
                            ) : (
                              <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                  type="checkbox"
                                  checked={enabled}
                                  onChange={(e) =>
                                    setPrefs((p) => ({
                                      ...p,
                                      [tipo.id]: e.target.checked,
                                    }))
                                  }
                                  className="peer sr-only"
                                  aria-labelledby={`cookie-${tipo.id}-label`}
                                  aria-describedby={`cookie-${tipo.id}-desc`}
                                />
                                <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/50" />
                              </label>
                            )}
                          </div>
                          <p
                            className="text-sm text-gray-600"
                            id={`cookie-${tipo.id}-desc`}
                          >
                            {tipo.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-6 text-sm text-gray-500">
                Para más información sobre cómo utilizamos las cookies, consulta
                nuestra{" "}
                <Link
                  href="/politica-de-cookies"
                  className="text-accent hover:underline"
                  onClick={() => setModal(false)}
                >
                  Política de Cookies
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 p-6 sm:flex-row">
              <button
                type="button"
                onClick={() => decide(CONSENT_NONE)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-white"
              >
                Rechazar todas
              </button>
              <button
                type="button"
                onClick={() => decide({ ...prefs, necessary: true })}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Guardar preferencias
              </button>
              <button
                type="button"
                onClick={() => decide(CONSENT_ALL)}
                className="flex-1 rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition-colors hover:bg-accent-dark"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
