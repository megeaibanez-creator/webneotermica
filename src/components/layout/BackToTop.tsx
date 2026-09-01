"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Flotante izquierdo: volver arriba.
 * Sustituye al WhatsApp verde. El canal de conversación es el chat de la derecha.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      className="back-to-top fixed bottom-5 left-5 z-[100] grid h-14 w-14 place-items-center rounded-full text-white shadow-deep transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: "var(--clima)" }}
    >
      <ArrowUp size={24} aria-hidden />
    </button>
  );
}
