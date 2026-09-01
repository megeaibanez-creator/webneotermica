/**
 * Sube hilos / mensajes / notas del revisor desde `.data/*.jsonl` a Supabase.
 *   npx tsx scripts/migrate-local-chat.ts
 * No toca el blog (`blog_articles`). El RAG es `npm run ingest:chatbot-kb`.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function cargarEnv() {
  const p = path.join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const linea of readFileSync(p, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)=(.*)$/.exec(linea.replace(/\r$/, ""));
    if (!m || process.env[m[1] ?? ""]) continue;
    process.env[m[1] ?? ""] = (m[2] ?? "").replace(/^["']|["']$/g, "").trim();
  }
}

cargarEnv();
if (process.env.BLOG_REDACTOR_INSECURE_TLS !== "0") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

function leerJsonl(nombre: string): Record<string, unknown>[] {
  const fichero = path.join(process.cwd(), ".data", `${nombre}.jsonl`);
  if (!existsSync(fichero)) return [];
  return readFileSync(fichero, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .flatMap((l) => {
      try {
        return [JSON.parse(l) as Record<string, unknown>];
      } catch {
        return [];
      }
    });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const sb = createClient(url, service, { auth: { persistSession: false } });
  const hilos = leerJsonl("chat_threads");
  const mensajes = leerJsonl("chat_messages");
  const notas = leerJsonl("chat_reviews");

  if (hilos.length) {
    const { error } = await sb.from("chat_threads").upsert(hilos, { onConflict: "id" });
    if (error) throw new Error(`chat_threads: ${error.message}`);
  }
  if (mensajes.length) {
    const { error } = await sb.from("chat_messages").upsert(mensajes, { onConflict: "id" });
    if (error) throw new Error(`chat_messages: ${error.message}`);
  }
  if (notas.length) {
    const { error } = await sb.from("chat_reviews").upsert(notas, { onConflict: "id" });
    if (error) throw new Error(`chat_reviews: ${error.message}`);
  }

  console.log(
    `OK chat: ${hilos.length} hilos, ${mensajes.length} mensajes, ${notas.length} notas.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
