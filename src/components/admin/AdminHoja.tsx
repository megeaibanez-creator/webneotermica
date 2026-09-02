"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Hoja lateral del admin (emergente). Cierra con Escape, clic fuera o la X.
 * Bloquea el scroll del fondo mientras está abierta.
 */
export default function AdminHoja({
  titulo,
  subtitulo,
  cabecera,
  onCerrar,
  ancho = "max-w-xl",
  pie,
  children,
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  /* Extras a la derecha de la cabecera (flechas, enlaces…). */
  cabecera?: ReactNode;
  onCerrar: () => void;
  ancho?: string;
  /* Barra fija abajo (botones principales). */
  pie?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCerrar]);

  return (
    <div
      className="admin-hoja-fondo fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 sm:items-stretch sm:justify-end"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`admin-hoja flex max-h-[92dvh] w-full ${ancho} flex-col rounded-t-2xl bg-white shadow-2xl sm:h-full sm:max-h-none sm:rounded-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tirador: solo en móvil, afordancia de bottom-sheet. */}
        <div className="flex justify-center pt-2 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-line" />
        </div>
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-semibold">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-xs text-mutedink">{subtitulo}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {cabecera}
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg p-1.5 text-mutedink hover:bg-soft hover:text-ink"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 [padding-bottom:calc(1.25rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
        {pie && (
          <div className="border-t border-line bg-page px-5 py-3 [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))]">
            {pie}
          </div>
        )}
      </div>
    </div>
  );
}
