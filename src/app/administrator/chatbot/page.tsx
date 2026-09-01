"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { renderChatMarkdown } from "@/lib/chatbot/markdown";
import AdminTabla, {
  AdminPildora,
  formatFechaAdmin,
  type ColumnaTabla,
} from "@/components/admin/AdminTabla";

type CalidadOSin = "correcta" | "mejorable" | "incorrecta" | "sin_tipo";

type CalidadStats = Record<CalidadOSin, number>;

type Respuesta = {
  id: string;
  thread_id: string;
  created_at: string;
  content: string;
  user_question: string;
  score: number | null;
  quality: CalidadOSin;
  notes: string | null;
};

type Conversacion = {
  id: string;
  created_at: string;
  last_message_at: string;
  session_id: string;
  first_user_message: string;
  preguntas: number;
  assistant_count: number;
  classified_responses: number;
  unclassified_responses: number;
  quality_score: number | null;
};

type MensajeHilo = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  score: number | null;
  notes: string | null;
};

const LABELS: Record<CalidadOSin, string> = {
  correcta: "Correcta",
  mejorable: "Mejorable",
  incorrecta: "Incorrecta",
  sin_tipo: "Sin clasificar",
};

const VACIO: CalidadStats = { correcta: 0, mejorable: 0, incorrecta: 0, sin_tipo: 0 };

function tonoCalidad(q: CalidadOSin): "ok" | "warn" | "bad" | "muted" {
  if (q === "correcta") return "ok";
  if (q === "mejorable") return "warn";
  if (q === "incorrecta") return "bad";
  return "muted";
}

function calidadDeScore(score: number | null): CalidadOSin {
  if (score === 10) return "correcta";
  if (score === 5) return "mejorable";
  if (score === 0) return "incorrecta";
  return "sin_tipo";
}

function recortar(s: string, n = 90): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return "—";
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

function QualityDonut({ stats }: { stats: CalidadStats }) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1;
  const entries: CalidadOSin[] = ["correcta", "mejorable", "incorrecta", "sin_tipo"];
  const colors: Record<CalidadOSin, string> = {
    correcta: "#16a34a",
    mejorable: "#d97706",
    incorrecta: "#dc2626",
    sin_tipo: "#9ca3af",
  };
  let offset = 0;
  const segments = entries.map((q) => {
    const pct = (stats[q] / total) * 100;
    const seg = `${colors[q]} ${offset}% ${offset + pct}%`;
    offset += pct;
    return seg;
  });

  return (
    <div className="admin-card flex flex-wrap items-center gap-8 p-5">
      <div
        className="h-24 w-24 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${segments.join(", ")})` }}
        aria-hidden
      />
      <div className="text-sm">
        <p className="mb-2 font-medium">Calidad (la pone el revisor)</p>
        {entries.map((q) => (
          <div key={q} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[q] }} />
            <span>
              {LABELS[q]}: {stats[q]}
            </span>
          </div>
        ))}
        <p className="mt-2 text-xs text-mutedink">
          Total respuestas: {Object.values(stats).reduce((a, b) => a + b, 0)}
        </p>
      </div>
    </div>
  );
}

export default function AdminChatbotPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"respuestas" | "conversaciones">("respuestas");
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [stats, setStats] = useState<CalidadStats>(VACIO);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState("");
  const [revisando, setRevisando] = useState(false);
  const [seleccion, setSeleccion] = useState<Respuesta | null>(null);
  const [hiloId, setHiloId] = useState<string | null>(null);
  const [hilo, setHilo] = useState<MensajeHilo[]>([]);

  const cargar = useCallback(async () => {
    const params = new URLSearchParams();
    if (tab === "conversaciones") params.set("vista", "conversaciones");
    else {
      if (filtro) params.set("quality", filtro);
      if (busqueda.trim()) params.set("q", busqueda.trim());
    }
    const res = await fetch(`/api/admin/chat?${params}`);
    if (res.status === 401) {
      router.replace("/administrator/login");
      return;
    }
    if (!res.ok) {
      setError("No se pudo cargar el chat.");
      return;
    }
    const data = await res.json();
    if (tab === "conversaciones") {
      setConversaciones(data.conversations ?? []);
      if (data.stats?.byQuality) setStats(data.stats.byQuality);
    } else {
      setRespuestas(data.messages ?? []);
      if (data.qualityStats) setStats(data.qualityStats);
    }
    setError("");
  }, [tab, filtro, busqueda, router]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function abrirHilo(id: string) {
    setHiloId(id);
    setSeleccion(null);
    const res = await fetch(`/api/admin/chat?threadId=${id}`);
    if (!res.ok) return;
    const data = (await res.json()) as { messages: MensajeHilo[] };
    setHilo(data.messages ?? []);
  }

  async function revisarPendientes() {
    setRevisando(true);
    setError("");
    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 30 }),
    });
    setRevisando(false);
    if (!res.ok) {
      setError("El revisor no pudo calificar.");
      return;
    }
    const data = (await res.json()) as { revisadas?: number };
    if (!data.revisadas) setError("No había respuestas pendientes.");
    await cargar();
  }

  const columnasRespuestas: ColumnaTabla<Respuesta>[] = [
    {
      id: "created_at",
      titulo: "Fecha",
      ordenable: true,
      valor: (r) => new Date(r.created_at),
      celda: (r) => formatFechaHora(r.created_at),
    },
    {
      id: "pregunta",
      titulo: "Pregunta",
      ordenable: true,
      valor: (r) => r.user_question,
      celda: (r) => recortar(r.user_question, 80),
    },
    {
      id: "respuesta",
      titulo: "Respuesta",
      valor: (r) => r.content,
      celda: (r) => recortar(r.content, 90),
    },
    {
      id: "calidad",
      titulo: "Revisor",
      ordenable: true,
      valor: (r) => r.score ?? -1,
      celda: (r) => (
        <AdminPildora tono={tonoCalidad(r.quality)}>{LABELS[r.quality]}</AdminPildora>
      ),
    },
  ];

  const columnasHilos: ColumnaTabla<Conversacion>[] = [
    {
      id: "last_message_at",
      titulo: "Fecha",
      ordenable: true,
      valor: (c) => new Date(c.last_message_at),
      celda: (c) => formatFechaAdmin(c.last_message_at),
    },
    {
      id: "first",
      titulo: "Primera pregunta",
      ordenable: true,
      valor: (c) => c.first_user_message,
      celda: (c) => recortar(c.first_user_message, 90),
    },
    {
      id: "resp",
      titulo: "Resp.",
      alinear: "center",
      ordenable: true,
      valor: (c) => c.assistant_count,
      celda: (c) => c.assistant_count,
    },
    {
      id: "nota",
      titulo: "Nota media",
      alinear: "center",
      ordenable: true,
      valor: (c) => c.quality_score ?? -1,
      celda: (c) =>
        c.quality_score === null ? (
          <AdminPildora tono="muted">
            Sin valorar{c.unclassified_responses ? ` (${c.unclassified_responses})` : ""}
          </AdminPildora>
        ) : (
          <AdminPildora tono={c.quality_score >= 8 ? "ok" : c.quality_score >= 4 ? "warn" : "bad"}>
            {c.quality_score.toFixed(1)}/10
          </AdminPildora>
        ),
    },
  ];

  const pendientes = stats.sin_tipo;

  return (
    <div className="admin-shell">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-2 text-3xl">Chat</h1>
          <p className="text-mutedink">
            El revisor califica cada respuesta (10 / 5 / 0). Tú las lees. La nota del hilo es la
            media. Nunca se borra un visitante.
          </p>
        </div>
        {pendientes > 0 && (
          <button
            type="button"
            onClick={() => void revisarPendientes()}
            disabled={revisando}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {revisando ? "Revisando…" : `Revisar ${pendientes} pendientes`}
          </button>
        )}
      </div>
      {error && <p className="mb-4 text-accent">{error}</p>}

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("respuestas")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === "respuestas" ? "bg-brand text-white" : "border border-line bg-white"
          }`}
        >
          Respuestas
        </button>
        <button
          type="button"
          onClick={() => setTab("conversaciones")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === "conversaciones" ? "bg-brand text-white" : "border border-line bg-white"
          }`}
        >
          Conversaciones
        </button>
      </div>

      <div className="mb-6">
        <QualityDonut stats={stats} />
      </div>

      {tab === "respuestas" ? (
        <AdminTabla
          columnas={columnasRespuestas}
          filas={respuestas}
          clave={(r) => r.id}
          vacio={busqueda || filtro ? "Nada coincide con el filtro." : "Aún no hay respuestas."}
          busqueda={busqueda}
          onBusqueda={setBusqueda}
          placeholder="Buscar en pregunta o respuesta…"
          filtro={filtro}
          onFiltro={setFiltro}
          opcionesFiltro={[
            { value: "", label: "Todas las calidades" },
            { value: "correcta", label: "Correcta" },
            { value: "mejorable", label: "Mejorable" },
            { value: "incorrecta", label: "Incorrecta" },
            { value: "sin_tipo", label: "Sin clasificar" },
          ]}
          filaActiva={seleccion?.id ?? null}
          onFila={(r) => {
            setHiloId(null);
            setSeleccion(r);
          }}
          pie={`Mostrando ${respuestas.length} respuestas`}
        />
      ) : (
        <AdminTabla
          columnas={columnasHilos}
          filas={conversaciones}
          clave={(c) => c.id}
          vacio="Aún no hay conversaciones."
          filaActiva={hiloId}
          onFila={(c) => void abrirHilo(c.id)}
          pie={`Mostrando ${conversaciones.length} conversaciones`}
        />
      )}

      {seleccion && (
        <Hoja titulo="Respuesta" onCerrar={() => setSeleccion(null)}>
          <p className="text-xs text-mutedink">{formatFechaHora(seleccion.created_at)}</p>
          <button
            type="button"
            className="mt-1 text-xs text-accent underline"
            onClick={() => void abrirHilo(seleccion.thread_id)}
          >
            Ver conversación
          </button>
          <p className="mt-4 text-xs font-medium text-mutedink">Pregunta</p>
          <p className="mt-1 whitespace-pre-wrap rounded-lg bg-ice px-3 py-2 text-sm">
            {seleccion.user_question || "—"}
          </p>
          <p className="mt-4 text-xs font-medium text-mutedink">Asistente</p>
          <div
            className="chat-markdown mt-1 rounded-lg border border-line px-3 py-2 text-sm"
            dangerouslySetInnerHTML={{ __html: renderChatMarkdown(seleccion.content) }}
          />
          <div className="mt-4">
            <AdminPildora tono={tonoCalidad(seleccion.quality)}>
              {LABELS[seleccion.quality]}
              {seleccion.score !== null ? ` · ${seleccion.score}` : ""}
            </AdminPildora>
          </div>
          {seleccion.notes && (
            <>
              <p className="mt-4 text-xs font-medium text-mutedink">Nota del revisor</p>
              <p className="mt-1 text-sm">{seleccion.notes}</p>
            </>
          )}
        </Hoja>
      )}

      {hiloId && (
        <Hoja titulo="Conversación" onCerrar={() => setHiloId(null)}>
          <p className="mb-4 text-xs text-mutedink">
            Cada respuesta la califica el revisor. No se puntúa el hilo entero.
          </p>
          <div className="space-y-3">
            {hilo.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl px-3 py-2 text-sm ${
                  m.role === "user" ? "ml-6 bg-brand/10" : "mr-4 bg-ice"
                }`}
              >
                <b className="text-xs uppercase tracking-wide text-mutedink">
                  {m.role === "user" ? "Visitante" : "Asistente"}
                </b>
                {m.role === "assistant" ? (
                  <div
                    className="chat-markdown mt-1"
                    dangerouslySetInnerHTML={{ __html: renderChatMarkdown(m.content) }}
                  />
                ) : (
                  <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
                )}
                {m.role === "assistant" && (
                  <div className="mt-2">
                    <AdminPildora tono={tonoCalidad(calidadDeScore(m.score))}>
                      {LABELS[calidadDeScore(m.score)]}
                    </AdminPildora>
                    {m.notes && <p className="mt-1 text-xs text-mutedink">{m.notes}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Hoja>
      )}
    </div>
  );
}

function Hoja({
  titulo,
  onCerrar,
  children,
}: {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onCerrar}>
      <div
        className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button type="button" onClick={onCerrar} className="rounded-lg p-1.5 hover:bg-soft" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
