import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { insertarLocal, localDbActivo } from "@/lib/db/local";
import { buscarContexto, formatearContexto, huecoRag } from "@/lib/chatbot/rag";
import { bloqueVivo, CHAT_MODEL, SYSTEM_PROMPT } from "@/lib/chatbot/prompt";
import { auditarYGuardar } from "@/lib/chatbot/auditor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Turno = { role: "user" | "assistant"; content: string };
type Body = { message?: string; history?: Turno[]; sessionId?: string; threadId?: string };

const MAX_HISTORIAL = 10;

function sse(evento: string, dato: unknown): string {
  return `event: ${evento}\ndata: ${JSON.stringify(dato)}\n\n`;
}

type Guardado = { threadId: string | null; messageId: string | null };

/** Guarda hilo y mensajes. Nunca se borra el chat de un visitante. */
async function guardarTurno(opts: {
  threadId: string | null;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  ragGap?: unknown;
}): Promise<Guardado> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    if (!localDbActivo()) return { threadId: opts.threadId, messageId: null };
    try {
      const threadId =
        opts.threadId ??
        insertarLocal("chat_threads", {
          session_id: opts.sessionId,
          visitor_label: null,
        }).id;
      const fila = insertarLocal("chat_messages", {
        thread_id: threadId,
        role: opts.role,
        content: opts.content,
        rag_gap: opts.ragGap ?? null,
      });
      return { threadId, messageId: fila.id };
    } catch (error) {
      console.error("[chat] no se pudo escribir en .data:", error);
      return { threadId: opts.threadId, messageId: null };
    }
  }

  let threadId = opts.threadId;
  if (!threadId) {
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({ session_id: opts.sessionId, visitor_label: null })
      .select("id")
      .single();
    if (error) {
      console.error("[chat] no se pudo crear el hilo:", error.message);
      return { threadId: null, messageId: null };
    }
    threadId = data.id as string;
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      role: opts.role,
      content: opts.content,
      rag_gap: opts.ragGap ?? null,
    })
    .select("id")
    .single();
  if (error) console.error("[chat] no se pudo guardar el mensaje:", error.message);

  return { threadId, messageId: (data?.id as string | undefined) ?? null };
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new Response("Petición no válida", { status: 400 });
  }

  const message = String(body.message ?? "").trim().slice(0, 2000);
  const sessionId = String(body.sessionId ?? "").slice(0, 80) || crypto.randomUUID();
  const history = (body.history ?? []).slice(-MAX_HISTORIAL);
  if (!message) return new Response("Mensaje vacío", { status: 400 });

  const hits = await buscarContexto(message);
  const contexto = formatearContexto(hits);
  const gap = huecoRag(message, hits);

  let threadId = (
    await guardarTurno({
      threadId: body.threadId ?? null,
      sessionId,
      role: "user",
      content: message,
      ragGap: gap,
    })
  ).threadId;

  const hiloCorto = history
    .map((t) => `${t.role === "user" ? "Visitante" : "Asistente"}: ${t.content}`)
    .join("\n")
    .slice(0, 3500);

  const apiKey = process.env.OPENAI_API_KEY;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (evento: string, dato: unknown) =>
        controller.enqueue(encoder.encode(sse(evento, dato)));

      push("thread", { threadId, sessionId });

      if (!apiKey) {
        const texto =
          `Ahora mismo el asistente no está conectado. Puedes llamarnos o escribirnos por ` +
          `WhatsApp al 678 495 046, o mandarnos el caso desde /contacto y te respondemos ` +
          `en horario de taller (L–V 9:00–14:00 y 15:30–19:00).`;
        push("delta", { text: texto });
        const guardado = await guardarTurno({
          threadId,
          sessionId,
          role: "assistant",
          content: texto,
        });
        threadId = guardado.threadId;
        push("done", { threadId });
        controller.close();
        return;
      }

      const mensajes = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        { role: "system" as const, content: bloqueVivo() },
        ...(contexto ? [{ role: "system" as const, content: contexto }] : []),
        ...history.map((t) => ({ role: t.role, content: t.content })),
        { role: "user" as const, content: message },
      ];

      let completo = "";
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: CHAT_MODEL,
            messages: mensajes,
            stream: true,
            // GPT-5.x: nada de `temperature`.
            max_completion_tokens: 700,
            reasoning_effort: "none",
          }),
        });

        if (!res.ok || !res.body) {
          const detalle = await res.text();
          console.error("[chat] OpenAI:", res.status, detalle);
          throw new Error("respuesta no válida del modelo");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lineas = buffer.split("\n");
          buffer = lineas.pop() ?? "";

          for (const linea of lineas) {
            const trimmed = linea.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload) as {
                choices?: { delta?: { content?: string } }[];
              };
              const texto = json.choices?.[0]?.delta?.content;
              if (texto) {
                completo += texto;
                push("delta", { text: texto });
              }
            } catch {
              // trozo incompleto: se ignora
            }
          }
        }
      } catch (error) {
        console.error("[chat] fallo del stream:", error);
        const aviso =
          "Se me ha cortado la respuesta. Prueba otra vez o llámanos al 678 495 046.";
        completo = completo || aviso;
        push("delta", { text: completo ? "" : aviso });
      }

      const guardado = await guardarTurno({
        threadId,
        sessionId,
        role: "assistant",
        content: completo,
      });
      threadId = guardado.threadId;
      if (guardado.messageId && completo) {
        void auditarYGuardar({
          messageId: guardado.messageId,
          pregunta: message,
          respuesta: completo,
          hilo: hiloCorto,
        });
      }
      push("done", { threadId });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
