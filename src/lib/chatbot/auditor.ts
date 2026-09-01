import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { actualizarLocal, insertarLocal, leerLocal, localDbActivo } from "@/lib/db/local";
import { bloqueVivo, CHAT_MODEL, SYSTEM_PROMPT } from "@/lib/chatbot/prompt";

export type Calidad = "correcta" | "mejorable" | "incorrecta";
export type CalidadOSin = Calidad | "sin_tipo";

export const SCORE_DE: Record<Calidad, 10 | 5 | 0> = {
  correcta: 10,
  mejorable: 5,
  incorrecta: 0,
};

export function calidadDeScore(score: number | null | undefined): CalidadOSin {
  if (score === 10) return "correcta";
  if (score === 5) return "mejorable";
  if (score === 0) return "incorrecta";
  return "sin_tipo";
}

const AUDITOR_SISTEMA = `Eres el auditor de calidad de Neo, el chatbot de Neotérmica (molde Andrea / Laura / Roy).
Evalúas UNA respuesta del asistente frente a la ficha y las reglas. No eres el visitante.
El asistente se llama Neo. Si preguntan quién es, debe decir «Neo, tu asistente virtual de climatización». No es Andrea.

Devuelve SOLO JSON:
{"quality":"correcta"|"mejorable"|"incorrecta","notes":"por qué, en una o dos frases"}

10/correcta: no inventa calle, NIF, marcas, precios ni obras; respeta radio Murcia + 50 km; no cotiza placas como catálogo; si piden cifra o visita, CTA markdown [Pedir presupuesto](/contacto#formulario); usa la ficha.
5/mejorable: flojea (vago, /contacto suelto sin markdown, se olvida el CTA con interés real, tono largo) pero no alucina. Insistir el formulario en cada turno = mejorable.
0/incorrecta: inventa dato, promete Cartagena/costa, da precio cerrado en euros, o contradice la ficha. Ofrecer llamar o WhatsApp = incorrecta (el CTA es el formulario). Pedir fotos de la estancia o del aparato = incorrecta: ni el chat ni el formulario las aceptan.

Reglas del asistente:
${SYSTEM_PROMPT}`;

export type ResultadoAuditor = {
  quality: Calidad;
  score: 0 | 5 | 10;
  notes: string;
};

export async function auditarRespuesta(input: {
  pregunta: string;
  respuesta: string;
  hilo?: string;
}): Promise<ResultadoAuditor> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return { quality: "mejorable", score: 5, notes: "Sin OPENAI_API_KEY: no se pudo auditar." };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      max_completion_tokens: 400,
      reasoning_effort: "none",
      messages: [
        { role: "system", content: AUDITOR_SISTEMA },
        {
          role: "user",
          content:
            `${bloqueVivo()}\n\n` +
            (input.hilo ? `CONTEXTO PREVIO:\n${input.hilo}\n\n` : "") +
            `ÚLTIMA PREGUNTA:\n${input.pregunta || "(sin texto)"}\n\n` +
            `RESPUESTA A NOTAR:\n${input.respuesta || "(vacía)"}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    console.error("[auditor] OpenAI:", res.status, detalle);
    return { quality: "mejorable", score: 5, notes: "El auditor no pudo hablar con el modelo." };
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  try {
    const o = JSON.parse(raw) as { quality?: string; notes?: string; score?: number };
    const quality: Calidad =
      o.quality === "correcta" || o.quality === "mejorable" || o.quality === "incorrecta"
        ? o.quality
        : o.score === 10
          ? "correcta"
          : o.score === 0
            ? "incorrecta"
            : "mejorable";
    return {
      quality,
      score: SCORE_DE[quality],
      notes: String(o.notes ?? "Sin notas.").slice(0, 800),
    };
  } catch {
    return { quality: "mejorable", score: 5, notes: "Respuesta del auditor no parseable." };
  }
}

type Review = {
  id: string;
  created_at: string;
  message_id: string;
  score: number;
  notes?: string | null;
};

export async function guardarNota(
  messageId: string,
  score: 0 | 5 | 10,
  notes: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("chat_reviews").upsert(
      { message_id: messageId, score, notes },
      { onConflict: "message_id" }
    );
    if (error) console.error("[auditor] no se guardó la nota:", error.message);
    return;
  }

  if (!localDbActivo()) return;
  const ya = leerLocal<Review>("chat_reviews").find((r) => r.message_id === messageId);
  if (ya) actualizarLocal("chat_reviews", ya.id, { score, notes });
  else insertarLocal("chat_reviews", { message_id: messageId, score, notes });
}

export async function auditarYGuardar(opts: {
  messageId: string;
  pregunta: string;
  respuesta: string;
  hilo?: string;
}): Promise<ResultadoAuditor | null> {
  if (!opts.respuesta.trim()) return null;
  try {
    const nota = await auditarRespuesta(opts);
    await guardarNota(opts.messageId, nota.score, nota.notes);
    return nota;
  } catch (error) {
    console.error("[auditor] fallo:", error);
    return null;
  }
}
