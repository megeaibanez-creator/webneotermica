import { calidadDeScore, type CalidadOSin } from "@/lib/chatbot/auditor";

export type MsgChat = {
  id: string;
  thread_id: string;
  created_at: string;
  role: "user" | "assistant";
  content: string;
};

export type HiloChat = {
  id: string;
  created_at: string;
  session_id: string;
};

export type EstadisticasCalidad = Record<CalidadOSin, number>;

export const ESTADISTICAS_VACIAS: EstadisticasCalidad = {
  correcta: 0,
  mejorable: 0,
  incorrecta: 0,
  sin_tipo: 0,
};

export function preguntaAnterior(asistente: MsgChat, todos: MsgChat[]): string {
  const hilo = todos
    .filter((m) => m.thread_id === asistente.thread_id)
    .sort((a, b) =>
      a.created_at === b.created_at
        ? a.id.localeCompare(b.id)
        : a.created_at.localeCompare(b.created_at)
    );
  const idx = hilo.findIndex((m) => m.id === asistente.id);
  for (let i = idx - 1; i >= 0; i--) {
    if (hilo[i]?.role === "user") return hilo[i].content;
  }
  return "";
}

export function estadisticasDe(
  asistentes: MsgChat[],
  scorePorMsg: Map<string, number>
): EstadisticasCalidad {
  const stats = { ...ESTADISTICAS_VACIAS };
  for (const m of asistentes) {
    stats[calidadDeScore(scorePorMsg.get(m.id) ?? null)] += 1;
  }
  return stats;
}

export function listarRespuestas(
  messages: MsgChat[],
  scorePorMsg: Map<string, number>,
  notesPorMsg: Map<string, string | null>,
  opts: { quality?: string; q?: string }
) {
  const asistentes = messages
    .filter((m) => m.role === "assistant")
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const stats = estadisticasDe(asistentes, scorePorMsg);
  const q = opts.q?.trim().toLowerCase() ?? "";

  const rows = asistentes
    .map((m) => {
      const score = scorePorMsg.get(m.id) ?? null;
      const quality = calidadDeScore(score);
      return {
        id: m.id,
        thread_id: m.thread_id,
        created_at: m.created_at,
        content: m.content,
        user_question: preguntaAnterior(m, messages),
        score,
        quality,
        notes: notesPorMsg.get(m.id) ?? null,
      };
    })
    .filter((r) => {
      if (opts.quality && r.quality !== opts.quality) return false;
      if (!q) return true;
      return (
        r.user_question.toLowerCase().includes(q) || r.content.toLowerCase().includes(q)
      );
    });

  return { messages: rows, qualityStats: stats };
}

export function listarConversaciones(
  threads: HiloChat[],
  messages: MsgChat[],
  scorePorMsg: Map<string, number>
) {
  const stats = estadisticasDe(
    messages.filter((m) => m.role === "assistant"),
    scorePorMsg
  );

  const conversations = threads
    .map((t) => {
      const msgs = messages
        .filter((m) => m.thread_id === t.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      const users = msgs.filter((m) => m.role === "user");
      const asistentes = msgs.filter((m) => m.role === "assistant");
      const scores = asistentes
        .map((m) => scorePorMsg.get(m.id))
        .filter((n): n is number => typeof n === "number");
      const last = msgs[msgs.length - 1];
      return {
        id: t.id,
        created_at: t.created_at,
        last_message_at: last?.created_at ?? t.created_at,
        session_id: t.session_id,
        first_user_message: users[0]?.content ?? "",
        preguntas: users.length,
        assistant_count: asistentes.length,
        classified_responses: scores.length,
        unclassified_responses: asistentes.length - scores.length,
        quality_score:
          scores.length === 0
            ? null
            : scores.reduce((a, b) => a + b, 0) / scores.length,
      };
    })
    .sort((a, b) => (a.last_message_at < b.last_message_at ? 1 : -1));

  return {
    conversations,
    stats: {
      totalConversations: conversations.length,
      totalResponses: stats.correcta + stats.mejorable + stats.incorrecta + stats.sin_tipo,
      byQuality: stats,
    },
  };
}
