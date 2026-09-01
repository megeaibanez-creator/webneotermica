/**
 * Ingesta RAG: 8 landings + posts publicados → chatbot_kb (pgvector).
 *   npx tsx scripts/ingest-chatbot-kb.ts
 * Necesita OPENAI_API_KEY + Supabase. En Windows, TLS del proxy: se relaja solo aquí.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { SERVICIOS } from "../src/lib/servicios";
import { getAllPostsRaw } from "../src/lib/blog";
import { bloqueVivo, EMBEDDING_MODEL } from "../src/lib/chatbot/prompt";

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

type Chunk = { source: string; slug: string; content: string };

async function embed(texto: string, key: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texto.slice(0, 7000) }),
  });
  if (!res.ok) throw new Error(`embeddings ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data?: { embedding: number[] }[] };
  const vec = json.data?.[0]?.embedding;
  if (!vec) throw new Error("embedding vacío");
  return vec;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = process.env.OPENAI_API_KEY;
  if (!url || !service || !key) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY u OPENAI_API_KEY.");
    process.exit(1);
  }

  const chunks: Chunk[] = [
    { source: "ficha", slug: "empresa", content: bloqueVivo() },
    ...SERVICIOS.map((s) => ({
      source: "servicio",
      slug: s.slug,
      content: `${s.h1}\n${s.intro.join("\n")}\n${s.puntos.join(". ")}`,
    })),
    ...getAllPostsRaw()
      .filter((p) => p.status === "published")
      .map((p) => ({
      source: "blog",
      slug: p.slug,
      content: `${p.title}\n${p.description}\n${p.content.slice(0, 4000)}`,
    })),
  ];

  const sb = createClient(url, service, { auth: { persistSession: false } });
  console.log(`Ingesta ${chunks.length} fragmentos…`);

  for (const [i, chunk] of chunks.entries()) {
    const embedding = await embed(chunk.content, key);
    const { error } = await sb.from("chatbot_kb").upsert(
      { source: chunk.source, slug: chunk.slug, content: chunk.content, embedding },
      { onConflict: "source,slug" }
    );
    if (error) throw new Error(error.message);
    process.stdout.write(`\r  ${i + 1}/${chunks.length}`);
  }
  console.log("\nListo.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
