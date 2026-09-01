import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { leerLocal, localDbActivo } from "@/lib/db/local";
import { auditarYGuardar } from "@/lib/chatbot/auditor";
import {
  listarConversaciones,
  listarRespuestas,
  preguntaAnterior,
  type HiloChat,
  type MsgChat,
} from "@/lib/chatbot/admin-datos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Review = { id: string; message_id: string; score: number; notes?: string | null };

async function cargarTodo(): Promise<{
  threads: HiloChat[];
  messages: MsgChat[];
  scorePorMsg: Map<string, number>;
  notesPorMsg: Map<string, string | null>;
} | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const [{ data: threads, error: e1 }, { data: messages, error: e2 }, { data: reviews }] =
      await Promise.all([
        supabase.from("chat_threads").select("id, created_at, session_id"),
        supabase.from("chat_messages").select("id, thread_id, created_at, role, content"),
        supabase.from("chat_reviews").select("message_id, score, notes"),
      ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    return {
      threads: (threads ?? []) as HiloChat[],
      messages: (messages ?? []) as MsgChat[],
      scorePorMsg: new Map((reviews ?? []).map((r) => [r.message_id as string, r.score as number])),
      notesPorMsg: new Map(
        (reviews ?? []).map((r) => [r.message_id as string, (r.notes as string | null) ?? null])
      ),
    };
  }
  if (!localDbActivo()) return null;
  const reviews = leerLocal<Review>("chat_reviews");
  return {
    threads: leerLocal<HiloChat>("chat_threads"),
    messages: leerLocal<MsgChat>("chat_messages"),
    scorePorMsg: new Map(reviews.map((r) => [r.message_id, r.score])),
    notesPorMsg: new Map(reviews.map((r) => [r.message_id, r.notes ?? null])),
  };
}

export async function GET(request: Request) {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const url = new URL(request.url);
  const threadId = url.searchParams.get("threadId");
  const vista = url.searchParams.get("vista") ?? (threadId ? "hilo" : "respuestas");

  try {
    const todo = await cargarTodo();
    if (!todo) return NextResponse.json({ threads: [], messages: [], conversations: [] });

    if (threadId) {
      const messages = todo.messages
        .filter((m) => m.thread_id === threadId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((m) => ({
          ...m,
          score: todo.scorePorMsg.get(m.id) ?? null,
          notes: todo.notesPorMsg.get(m.id) ?? null,
          user_question: m.role === "assistant" ? preguntaAnterior(m, todo.messages) : "",
        }));
      return NextResponse.json({ messages });
    }

    if (vista === "conversaciones") {
      return NextResponse.json(
        listarConversaciones(todo.threads, todo.messages, todo.scorePorMsg)
      );
    }

    return NextResponse.json(
      listarRespuestas(todo.messages, todo.scorePorMsg, todo.notesPorMsg, {
        quality: url.searchParams.get("quality") ?? undefined,
        q: url.searchParams.get("q") ?? undefined,
      })
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al cargar el chat";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** El revisor califica las respuestas pendientes. Narciso no pulsa 10/5/0. */
export async function POST(request: Request) {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const limit = Math.min(Math.max(Number(body.limit) || 30, 1), 80);

  const todo = await cargarTodo();
  if (!todo) return NextResponse.json({ error: "Sin almacén" }, { status: 503 });

  const pendientes = todo.messages
    .filter((m) => m.role === "assistant" && !todo.scorePorMsg.has(m.id))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit);

  let hechas = 0;
  for (const msg of pendientes) {
    const nota = await auditarYGuardar({
      messageId: msg.id,
      pregunta: preguntaAnterior(msg, todo.messages),
      respuesta: msg.content,
    });
    if (nota) hechas += 1;
  }

  return NextResponse.json({ ok: true, pendientes: pendientes.length, revisadas: hechas });
}
