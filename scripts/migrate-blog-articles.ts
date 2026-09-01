/**
 * Sube content/blog/*.md a public.blog_articles (upsert por slug).
 *   npx tsx scripts/migrate-blog-articles.ts
 * Hace falta 0006_blog_articles.sql aplicado.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getAllPostsRaw } from "../src/lib/blog";

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

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const posts = getAllPostsRaw();
  const sb = createClient(url, service, { auth: { persistSession: false } });
  const filas = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    description: p.description,
    status: p.status,
    servicio: p.servicio ?? null,
    cover: p.cover ?? null,
    reescrito: Boolean(p.reescrito),
    content: p.content,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await sb.from("blog_articles").upsert(filas, { onConflict: "slug" });
  if (error) throw new Error(error.message);
  console.log(`OK blog_articles: ${filas.length} posts.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
