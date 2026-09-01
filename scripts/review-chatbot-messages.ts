/**
 * Auditor de respuestas (molde Andrea / Laura / Roy).
 * Califica respuestas únicas: 10 correcta · 5 mejorable · 0 incorrecta.
 * En local escribe .data/chat_reviews.jsonl. Con Supabase, la tabla chat_reviews.
 *
 *   npx tsx scripts/review-chatbot-messages.ts
 *   npx tsx scripts/review-chatbot-messages.ts --limit=20
 * Windows: no uses npm run si pasas flags.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { leerLocal, localDbActivo } from "../src/lib/db/local";
import { auditarYGuardar } from "../src/lib/chatbot/auditor";
import { preguntaAnterior, type MsgChat } from "../src/lib/chatbot/admin-datos";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

function cargarEnv() {
  const p = path.join(root, ".env.local");
  if (!existsSync(p)) return;
  for (const linea of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)=(.*)$/.exec(linea.replace(/\r$/, ""));
    if (!m || process.env[m[1] ?? ""]) continue;
    process.env[m[1] ?? ""] = (m[2] ?? "").replace(/^["']|["']+$/g, "").trim();
  }
}

cargarEnv();
if (process.env.BLOG_REDACTOR_INSECURE_TLS !== "0") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

function arg(nombre: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${nombre}=`))?.split("=")[1];
}

async function mensajes(): Promise<MsgChat[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && service) {
    const sb = createClient(url, service, { auth: { persistSession: false } });
    const { data, error } = await sb
      .from("chat_messages")
      .select("id, thread_id, created_at, role, content");
    if (error) throw new Error(error.message);
    return (data ?? []) as MsgChat[];
  }
  if (!localDbActivo()) {
    console.error("Falta OPENAI_API_KEY o almacén (Supabase / .data).");
    process.exit(1);
  }
  return leerLocal<MsgChat>("chat_messages");
}

async function idsYaNotados(): Promise<Set<string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && service) {
    const sb = createClient(url, service, { auth: { persistSession: false } });
    const { data } = await sb.from("chat_reviews").select("message_id");
    return new Set((data ?? []).map((r) => r.message_id as string));
  }
  return new Set(
    leerLocal<{ message_id: string; created_at: string }>("chat_reviews").map((r) => r.message_id)
  );
}

async function main() {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    console.error("Falta OPENAI_API_KEY en .env.local");
    process.exit(1);
  }

  const limit = Number(arg("limit") ?? "30");
  const todos = await mensajes();
  const vistos = await idsYaNotados();
  const pendientes = todos
    .filter((m) => m.role === "assistant" && !vistos.has(m.id))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit);

  console.log(`${pendientes.length} respuestas sin nota.`);

  for (const msg of pendientes) {
    const nota = await auditarYGuardar({
      messageId: msg.id,
      pregunta: preguntaAnterior(msg, todos),
      respuesta: msg.content,
    });
    if (nota) console.log(`${nota.score} · ${msg.id.slice(0, 8)} · ${nota.notes.slice(0, 80)}`);
    else console.error(`fallo · ${msg.id.slice(0, 8)}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
