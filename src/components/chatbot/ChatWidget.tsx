"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, Loader2, MessageCircle, RefreshCw, Send, X } from "lucide-react";
import {
  ASSISTANT_AVATAR,
  ASSISTANT_NAME,
  ASSISTANT_PRESENTATION,
  ASSISTANT_UI_TITLE,
  SALUDO,
} from "@/lib/chatbot/prompt";
import { EMPRESA } from "@/lib/site";
import { aHtml } from "@/lib/chatbot/markdown";

/**
 * Widget molde Andrea (Furgocasa):
 *   · Arranca CERRADO.
 *   · Temas + preguntas preconfiguradas.
 *   · «Refrescar» empieza hilo nuevo en pantalla; el histórico queda en BD.
 *   · El hilo se conserva en sessionStorage + BD.
 *   · En móvil el panel es pantalla completa (100dvh + visualViewport).
 *   · En móvil no se enfoca el input al abrir (el teclado rompe el layout).
 *   · En móvil, un enlace interno minimiza el panel.
 * Flotante derecho. A la izquierda: volver arriba (oculto si el chat está abierto).
 */

type Turno = { role: "user" | "assistant"; content: string };

type Opcion = { label: string; prompt: string };
type Tema = { id: string; label: string; emoji: string; question: string; options: Opcion[] };

const K_SESION = "neo_chat_session";
const K_HILO = "neo_chat_thread";
const K_MENSAJES = "neo_chat_mensajes";
const K_TEMA = "neo_chat_tema";

const TEMAS: Tema[] = [
  {
    id: "instalacion",
    label: "Instalación nueva",
    emoji: "❄️",
    question: "¿Qué quieres instalar?",
    options: [
      { label: "Splits de pared", prompt: "Quiero instalar aire acondicionado por splits. ¿Qué tengo que saber?" },
      { label: "Conductos", prompt: "Me interesa climatización por conductos. ¿Cómo lo hacéis?" },
      { label: "Aerotermia", prompt: "Quiero información sobre aerotermia para mi vivienda." },
      { label: "Suelo radiante", prompt: "¿Cómo funciona el suelo radiante y si encaja con aerotermia?" },
      { label: "Caldera o radiadores", prompt: "Necesito una caldera o radiadores. ¿Qué opciones tenéis?" },
    ],
  },
  {
    id: "averia",
    label: "Avería o reparación",
    emoji: "🔧",
    question: "¿Qué te está pasando?",
    options: [
      { label: "No enfría / no calienta", prompt: "Se me ha averiado el aire: no enfría o no calienta. ¿Qué hago?" },
      { label: "Hace ruido o gotea", prompt: "El equipo hace ruido o gotea. ¿Puede ser una avería?" },
      { label: "Urgencia", prompt: "Tengo una avería urgente de climatización en Murcia. ¿Cómo os aviso?" },
      { label: "Mantenimiento", prompt: "Quiero un mantenimiento del aire acondicionado. ¿Cómo se pide?" },
    ],
  },
  {
    id: "zona",
    label: "Zona de trabajo",
    emoji: "📍",
    question: "¿Dónde estás?",
    options: [
      { label: "Murcia ciudad", prompt: "¿Trabajáis en Murcia ciudad?" },
      { label: "Molina de Segura", prompt: "¿Trabajáis en Molina de Segura?" },
      { label: "Pedanías", prompt: "Vivo en una pedanía de Murcia. ¿Llegáis?" },
      { label: "Fuera del radio", prompt: "Estoy a más de 50 km de Murcia. ¿Os desplazáis?" },
    ],
  },
  {
    id: "presupuesto",
    label: "Presupuesto y contacto",
    emoji: "📞",
    question: "¿Cómo quieres que te atendamos?",
    options: [
      { label: "Pedir presupuesto", prompt: "Quiero un presupuesto de climatización. ¿Qué datos necesitáis?" },
      { label: "Particular", prompt: "Soy particular y quiero que me orienteis para pedir presupuesto." },
      { label: "Empresa o local", prompt: "Tengo un local u oficina y necesito presupuesto de climatización." },
      { label: "Llamar o escribir", prompt: "¿Cuál es el teléfono y el correo para contactar con Neotérmica?" },
    ],
  },
  {
    id: "estancias",
    label: "Estancias y sistemas",
    emoji: "🏠",
    question: "¿Qué espacio quieres climatizar?",
    options: [
      { label: "Ver el recorrido 3D", prompt: "Explícame el recorrido de estancias de la web y qué sistema va en cada espacio." },
      { label: "Vivienda", prompt: "¿Qué sistema recomendáis para una vivienda: split, conductos o aerotermia?" },
      { label: "Local o restaurante", prompt: "Necesito climatizar un bar o restaurante. ¿Qué ponéis?" },
      { label: "Nave o gimnasio", prompt: "Tengo un espacio grande (nave o gimnasio). ¿Qué sistema encaja?" },
    ],
  },
];

export default function ChatWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Turno[]>([]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [temaId, setTemaId] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  const sesionRef = useRef<string>("");
  const hiloRef = useRef<string | null>(null);
  const finRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      let sesion = sessionStorage.getItem(K_SESION);
      if (!sesion) {
        sesion = crypto.randomUUID();
        sessionStorage.setItem(K_SESION, sesion);
      }
      sesionRef.current = sesion;
      hiloRef.current = sessionStorage.getItem(K_HILO);
      const guardados = sessionStorage.getItem(K_MENSAJES);
      if (guardados) setMensajes(JSON.parse(guardados) as Turno[]);
      setTemaId(sessionStorage.getItem(K_TEMA));
    } catch {
      sesionRef.current = crypto.randomUUID();
    }
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    try {
      if (mensajes.length === 0) sessionStorage.removeItem(K_MENSAJES);
      else sessionStorage.setItem(K_MENSAJES, JSON.stringify(mensajes.slice(-30)));
      if (temaId) sessionStorage.setItem(K_TEMA, temaId);
      else sessionStorage.removeItem(K_TEMA);
    } catch {
      // sessionStorage lleno o bloqueado
    }
  }, [mensajes, temaId, listo]);

  useEffect(() => {
    if (!abierto) return;
    const caja = scrollRef.current;
    if (!caja) return;
    if (mensajes.length === 0) {
      caja.scrollTop = 0;
      return;
    }
    caja.scrollTop = caja.scrollHeight;
  }, [mensajes, abierto, temaId]);

  useEffect(() => {
    if (!abierto) return;
    if (window.matchMedia("(min-width: 640px)").matches) {
      inputRef.current?.focus();
    }
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const html = document.documentElement;
    const prevOverflow = document.body.style.overflow;
    html.classList.add("neo-chat-abierto");
    document.body.style.overflow = "hidden";
    return () => {
      html.classList.remove("neo-chat-abierto");
      document.body.style.overflow = prevOverflow;
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const panel = panelRef.current;
    const vv = window.visualViewport;
    if (!panel || !vv) return;

    const sync = () => {
      if (window.matchMedia("(min-width: 640px)").matches) {
        panel.style.height = "";
        panel.style.top = "";
        panel.style.left = "";
        panel.style.right = "";
        panel.style.width = "";
        return;
      }
      panel.style.top = `${vv.offsetTop}px`;
      panel.style.left = "0";
      panel.style.right = "0";
      panel.style.width = "100%";
      panel.style.height = `${vv.height}px`;
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      panel.style.height = "";
      panel.style.top = "";
      panel.style.left = "";
      panel.style.right = "";
      panel.style.width = "";
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const alClicar = (e: MouseEvent) => {
      if (window.innerWidth >= 640) return;
      const destino = (e.target as HTMLElement | null)?.closest("a");
      if (!destino) return;
      const href = destino.getAttribute("href") ?? "";
      const interno = href.startsWith("/") || href.startsWith("#");
      if (interno && destino.getAttribute("target") !== "_blank") setAbierto(false);
    };
    document.addEventListener("click", alClicar);
    return () => document.removeEventListener("click", alClicar);
  }, [abierto]);

  const enviar = useCallback(
    async (texto: string) => {
      const pregunta = texto.trim();
      if (!pregunta || cargando) return;

      const previos = mensajes;
      setEntrada("");
      setMensajes([...previos, { role: "user", content: pregunta }, { role: "assistant", content: "" }]);
      setCargando(true);

      const escribir = (trozo: string) =>
        setMensajes((actuales) => {
          const copia = [...actuales];
          const ultimo = copia[copia.length - 1];
          if (ultimo?.role === "assistant") {
            copia[copia.length - 1] = { role: "assistant", content: ultimo.content + trozo };
          }
          return copia;
        });

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: pregunta,
            history: previos.slice(-10),
            sessionId: sesionRef.current,
            threadId: hiloRef.current,
          }),
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const lector = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await lector.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const bloques = buffer.split("\n\n");
          buffer = bloques.pop() ?? "";

          for (const bloque of bloques) {
            let evento = "message";
            let datos = "";
            for (const linea of bloque.split("\n")) {
              if (linea.startsWith("event:")) evento = linea.slice(6).trim();
              else if (linea.startsWith("data:")) datos += linea.slice(5).trim();
            }
            if (!datos) continue;

            try {
              const json = JSON.parse(datos) as { text?: string; threadId?: string };
              if (evento === "delta" && json.text) escribir(json.text);
              if ((evento === "thread" || evento === "done") && json.threadId) {
                hiloRef.current = json.threadId;
                try {
                  sessionStorage.setItem(K_HILO, json.threadId);
                } catch {
                  // sin sessionStorage el hilo se recrea
                }
              }
            } catch {
              // bloque incompleto
            }
          }
        }
      } catch (error) {
        console.error("[chat] widget:", error);
        escribir(
          `Se me ha cortado la conexión. Puedes llamarnos al ${EMPRESA.telefono} ` +
            `o escribirnos desde [/contacto](/contacto) y te respondemos.`
        );
      } finally {
        setCargando(false);
      }
    },
    [cargando, mensajes]
  );

  const refrescar = () => {
    if (cargando) return;
    setMensajes([]);
    setTemaId(null);
    setEntrada("");
    hiloRef.current = null;
    try {
      sessionStorage.removeItem(K_HILO);
      sessionStorage.removeItem(K_MENSAJES);
      sessionStorage.removeItem(K_TEMA);
    } catch {
      // ignore
    }
  };

  const tema = TEMAS.find((t) => t.id === temaId) ?? null;
  const vacio = mensajes.length === 0;

  if (!listo) return null;

  return (
    <>
      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label={`Abrir ${ASSISTANT_PRESENTATION}`}
          aria-expanded={false}
          className="fixed bottom-5 right-5 z-[2000] grid h-14 w-14 place-items-center rounded-full text-white shadow-deep transition-[background,transform] duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: "var(--clima)" }}
        >
          <MessageCircle size={24} aria-hidden />
        </button>
      )}

      {abierto && (
        <section
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={ASSISTANT_UI_TITLE}
          className="fixed inset-0 z-[2100] flex h-[100dvh] w-full flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-24 sm:right-6 sm:h-auto sm:max-h-[min(85dvh,640px)] sm:w-[380px] sm:max-w-[calc(100vw-3rem)] sm:rounded-2xl sm:shadow-2xl"
        >
          <header
            className="flex shrink-0 items-center gap-2 px-3 py-2.5 pt-[max(0.6rem,env(safe-area-inset-top))] text-white"
            style={{ background: "var(--clima)" }}
          >
            <Image
              src={ASSISTANT_AVATAR}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-full object-cover object-[32%_18%] ring-2 ring-white/80"
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[0.95rem] font-semibold leading-tight">{ASSISTANT_NAME}</h2>
              <p className="text-[0.68rem] leading-snug text-white/80">
                tu asistente virtual de climatización
              </p>
            </div>
            <button
              type="button"
              onClick={refrescar}
              disabled={cargando}
              className="flex h-10 items-center gap-1 rounded-full bg-white/10 px-2.5 text-[0.7rem] text-white/90 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-40"
              aria-label="Empezar una conversación nueva"
              title="Empezar de nuevo (no borra el historial)"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Refrescar</span>
            </button>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Cerrar el asistente"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain bg-[#EEF2F7] px-3 py-3 sm:min-h-[320px] sm:max-h-[450px]"
          >
            <div className="rounded-xl rounded-tl-md bg-white px-3 py-2.5 shadow-sm">
              <div
                className="chat-markdown text-[0.8rem] leading-snug text-ink"
                dangerouslySetInnerHTML={{
                  __html: aHtml(SALUDO),
                }}
              />
            </div>

            {vacio && !tema && (
              <div className="space-y-1.5">
                <p className="px-0.5 text-[0.7rem] text-mutedink">
                  Elige un tema:
                </p>
                {TEMAS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTemaId(cat.id)}
                    className="flex w-full items-center gap-2 rounded-lg border border-brand/15 bg-white px-2.5 py-1.5 text-left text-[0.8rem] text-ink shadow-sm transition-colors hover:border-brand hover:bg-brand hover:text-white"
                  >
                    <span className="text-lg leading-none">{cat.emoji}</span>
                    <span className="font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            )}

            {vacio && tema && (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setTemaId(null)}
                  className="flex items-center gap-1 px-0.5 text-[0.7rem] text-brand hover:underline"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Volver a los temas
                </button>
                <p className="px-0.5 text-[0.8rem] text-ink">
                  {tema.emoji} {tema.question}
                </p>
                {tema.options.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => void enviar(opt.prompt)}
                    className="w-full rounded-lg border border-brand/15 bg-white px-2.5 py-1.5 text-left text-[0.8rem] text-ink shadow-sm transition-colors hover:border-brand hover:bg-brand hover:text-white"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {mensajes.map((turno, i) => (
              <div
                key={i}
                className={
                  turno.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <div
                  className={
                    turno.role === "user"
                      ? "max-w-[80%] rounded-2xl rounded-tr-md px-2.5 py-2 text-[0.8rem] text-white shadow-sm"
                      : "max-w-[85%] rounded-2xl rounded-tl-md bg-white px-2.5 py-2 text-[0.8rem] text-ink shadow-sm"
                  }
                  style={turno.role === "user" ? { background: "var(--clima)" } : undefined}
                >
                  {turno.role === "assistant" ? (
                    turno.content ? (
                      <div
                        className="chat-markdown"
                        dangerouslySetInnerHTML={{ __html: aHtml(turno.content) }}
                      />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-mutedink" aria-label="Escribiendo" />
                    )
                  ) : (
                    turno.content
                  )}
                </div>
              </div>
            ))}

            {mensajes.length > 0 && !cargando && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tema ? (
                  <>
                    {tema.options.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => void enviar(opt.prompt)}
                        className="rounded-full border border-brand/30 bg-white px-3 py-1.5 text-xs text-brand shadow-sm transition-colors hover:bg-brand hover:text-white"
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTemaId(null)}
                      className="rounded-full border border-gray-300 bg-[#EEF2F7] px-3 py-1.5 text-xs text-mutedink shadow-sm hover:bg-gray-200"
                    >
                      ↺ Cambiar de tema
                    </button>
                  </>
                ) : (
                  TEMAS.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTemaId(cat.id)}
                      className="rounded-full border border-brand/30 bg-white px-3 py-1.5 text-xs text-brand shadow-sm transition-colors hover:bg-brand hover:text-white"
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))
                )}
              </div>
            )}

            <div ref={finRef} />
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-[#F0F0F0] px-2.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void enviar(entrada);
              }}
              className="flex items-end gap-2"
            >
              <label htmlFor="chat-entrada" className="sr-only">
                Escribe tu mensaje
              </label>
              <textarea
                id="chat-entrada"
                ref={inputRef}
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void enviar(entrada);
                  }
                }}
                rows={1}
                maxLength={2000}
                autoComplete="off"
                enterKeyHint="send"
                placeholder="Escribe tu mensaje..."
                className="min-w-0 flex-1 resize-none rounded-full border border-gray-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-brand sm:text-sm"
              />
              <button
                type="submit"
                disabled={cargando || entrada.trim() === ""}
                aria-label="Enviar mensaje"
                className="rounded-full p-2.5 text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
                style={cargando || entrada.trim() === "" ? undefined : { background: "var(--clima)" }}
              >
                {cargando ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <Send className="h-5 w-5" aria-hidden />
                )}
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
