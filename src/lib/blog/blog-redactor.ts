/**
 * AGENTE REDACTOR del blog Neotérmica.
 *
 * Molde ACTTAX / Eskala, adaptado a ficheros Markdown (no Supabase):
 *  1. Carga content/blog/{slug}.md
 *  2. Pasada 1: Responses API + web_search (background)
 *  3. Pasada 2: Chat Completions (refinado, sin web)
 *  4. Metadatos SEO (excerpt = description)
 *  5. Guarda el .md. Conserva slug, fecha, status, servicio y cover.
 *
 * Modelo: BLOG_REDACTOR_MODEL o gpt-5.6-terra.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  BLOG_REDACTOR_SYSTEM_PROMPT,
  BLOG_REFINE_PROMPT,
  BLOG_SEO_METADATA_PROMPT,
  NEOTERMICA_INTERNAL_LINKS,
  NEOTERMICA_OFFICIAL_LINKS,
} from "./blog-redactor-prompt";

export type RedactOptions = {
  dryRun?: boolean;
  seoOnly?: boolean;
  force?: boolean;
  log?: (msg: string) => void;
};

export type RedactResult = {
  slug: string;
  title: string;
  wordCount: number;
  description: string;
  excerpt: string;
  saved: boolean;
  skipped?: string;
  warnings: string[];
};

type PostFile = {
  full: string;
  data: Record<string, unknown>;
  slug: string;
  title: string;
  date: string;
  description: string;
  servicio: string;
  cover: string;
  reescrito: boolean;
  content: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const TEXT_FALLBACK = "gpt-4o";

function getModel(): string {
  return process.env.BLOG_REDACTOR_MODEL?.trim() || "gpt-5.6-terra";
}

function getKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("Falta OPENAI_API_KEY en .env.local");
  return key;
}

function usesReasoning(model: string): boolean {
  return /^gpt-5|^o\d/i.test(model);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(err: unknown): boolean {
  return /520|502|503|504|429|408|timeout|ETIMEDOUT|ECONNRESET|fetch failed|socket hang up/i.test(
    String(err instanceof Error ? err.message : err),
  );
}

export function extractSlug(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(trimmed)) {
    const parts = new URL(trimmed).pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }
  return trimmed.replace(/\.md$/, "").split(/[\\/]/).pop() || trimmed;
}

export function listBlogSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
}

function loadPost(slug: string): PostFile {
  const full = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(full)) {
    const hit = fs
      .readdirSync(BLOG_DIR)
      .find((f) => f.endsWith(".md") && f.includes(slug));
    if (!hit) throw new Error(`No hay artículo con slug «${slug}» en content/blog/`);
    return loadPost(hit.replace(/\.md$/, ""));
  }
  const parsed = matter(fs.readFileSync(full, "utf8"));
  return {
    full,
    data: { ...parsed.data },
    slug: String(parsed.data.slug ?? slug),
    title: String(parsed.data.title || slug),
    date: String(parsed.data.date || ""),
    description: String(parsed.data.description || ""),
    servicio: parsed.data.servicio ? String(parsed.data.servicio) : "",
    cover: parsed.data.cover ? String(parsed.data.cover) : "",
    reescrito: Boolean(parsed.data.reescrito),
    content: parsed.content,
  };
}

function linksBrief(): string {
  return [
    "### Enlaces internos (usa varios; no inventes rutas)",
    ...NEOTERMICA_INTERNAL_LINKS.map((l) => `- ${l.href} — ${l.ancla}`),
    "",
    "### Fuentes oficiales (home si dudas)",
    ...NEOTERMICA_OFFICIAL_LINKS.map((l) => `- ${l.href} — ${l.label}`),
  ].join("\n");
}

function editorialContext(post: PostFile, phase: "redaccion" | "verificacion"): string {
  const year = new Date().getFullYear();
  const search =
    phase === "redaccion"
      ? `Usa web_search para contrastar el marco vigente (${year}) si afirmas RITE, eficiencia, ayudas o datos de clima en Murcia. Prioriza idae.es, boe.es, miteco.gob.es, carm.es. Si no hay dato firme, no lo inventes.`
      : `Contrasta cifras, años y normativa del borrador (${year}). Corrige lo desactualizado. No inventes.`;
  return `## ${phase === "redaccion" ? "CONTEXTO EDITORIAL" : "VERIFICACIÓN"}

Título (NO lo repitas como heading): ${post.title}
Oficio / landing: ${post.servicio || "ninguno (puede ser solar u otro)"}
Fecha original: ${post.date}

${search}

${linksBrief()}

### Texto actual (WordPress migrada; listas rotas)
${post.content}`;
}

function cleanMarkdown(raw: string, title: string): string {
  let text = raw.trim();
  const fence = /```(?:markdown|md)?\s*([\s\S]*?)```/i.exec(text);
  if (fence?.[1]?.trim()) text = fence[1].trim();
  text = text.replace(/^```(?:markdown|md)?\n?|\n?```$/g, "").trim();

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const titleNorm = normalize(title);
  const heading = /^(#{1,2})\s+(.+)\n+/.exec(text);
  if (heading) {
    const h = normalize(heading[2] ?? "");
    if (heading[1] === "#" || h === titleNorm || (h.length > 15 && titleNorm.includes(h))) {
      text = text.slice(heading[0].length).trimStart();
    }
  }
  return text.trim();
}

function wordCount(md: string): number {
  return md
    .replace(/[#*_`\[\]()]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

async function openaiFetch(url: string, init: RequestInit, intento = 0): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    if (intento === 0) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      return openaiFetch(url, init, 1);
    }
    throw err;
  }
}

async function chat(
  messages: { role: "system" | "user"; content: string }[],
  opts: { max?: number; json?: boolean; model?: string } = {},
): Promise<string> {
  const model = opts.model ?? getModel();
  const body: Record<string, unknown> = {
    model,
    messages,
    ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    ...(usesReasoning(model)
      ? { max_completion_tokens: opts.max ?? 8000, reasoning_effort: "medium" }
      : { max_tokens: opts.max ?? 8000, temperature: 0.5 }),
  };
  const res = await openaiFetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) {
    if (model !== TEXT_FALLBACK && /model|404|not found|invalid/i.test(raw)) {
      return chat(messages, { ...opts, model: TEXT_FALLBACK });
    }
    throw new Error(`Chat ${res.status}: ${raw.slice(0, 400)}`);
  }
  const data = JSON.parse(raw) as { choices?: { message?: { content?: string } }[] };
  const text = (data.choices?.[0]?.message?.content || "").trim();
  if (!text) {
    // gpt-5* a veces gasta el cupo en razonar y deja el chat vacío (sobre todo SEO con max bajo).
    if (model !== TEXT_FALLBACK) return chat(messages, { ...opts, model: TEXT_FALLBACK });
    throw new Error("El modelo no devolvió texto (chat).");
  }
  return text;
}

async function responsesWithSearch(
  instructions: string,
  input: string,
  log: (msg: string) => void,
): Promise<string> {
  const model = getModel();
  const timeoutMs = Number(process.env.BLOG_REDACTOR_TIMEOUT_MS) || 600_000;
  const body: Record<string, unknown> = {
    model,
    instructions,
    input,
    tools: [
      {
        type: "web_search",
        search_context_size: process.env.BLOG_REDACTOR_SEARCH_CONTEXT || "medium",
        user_location: { type: "approximate", country: "ES", timezone: "Europe/Madrid" },
      },
    ],
    tool_choice: "required",
    max_output_tokens: 16000,
    background: true,
    store: true,
  };
  if (usesReasoning(model)) body.reasoning = { effort: "medium" };

  log(`   Responses + web_search (${model}, background)…`);
  const created = await openaiFetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const createdRaw = await created.text();
  if (!created.ok) throw new Error(`Responses ${created.status}: ${createdRaw.slice(0, 400)}`);
  type ResponsesPayload = {
    id: string;
    status: string;
    output_text?: string;
    output?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
    }>;
    error?: { message?: string };
    incomplete_details?: { reason?: string };
  };
  let response = JSON.parse(createdRaw) as ResponsesPayload;

  const started = Date.now();
  while (response.status === "queued" || response.status === "in_progress") {
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Responses: timeout tras ${Math.round(timeoutMs / 60000)} min`);
    }
    await sleep(10_000);
    const polled = await openaiFetch(`https://api.openai.com/v1/responses/${response.id}`, {
      headers: { Authorization: `Bearer ${getKey()}` },
    });
    const polledRaw = await polled.text();
    if (!polled.ok) throw new Error(`Polling ${polled.status}: ${polledRaw.slice(0, 300)}`);
    response = JSON.parse(polledRaw);
  }

  if (response.status === "failed" || response.error) {
    throw new Error(response.error?.message || "Responses falló");
  }
  if (response.status === "cancelled") throw new Error("Responses cancelado");
  const fromOutput = (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((c) => c.type === "output_text" && c.text)
    .map((c) => c.text)
    .join("\n")
    .trim();
  const text = (response.output_text || fromOutput).trim();
  if (!text) {
    throw new Error(
      `Responses vacío (status=${response.status}, ${response.incomplete_details?.reason || "sin texto"})`,
    );
  }
  return text;
}

async function withRetry<T>(fn: () => Promise<T>, log: (msg: string) => void, veces = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < veces; i++) {
    if (i > 0) {
      const wait = [30_000, 90_000, 180_000][i - 1] ?? 90_000;
      log(`   Reintento ${i + 1}/${veces} en ${Math.round(wait / 1000)}s…`);
      await sleep(wait);
    }
    try {
      return await fn();
    } catch (err) {
      last = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!isRetryable(err) || i === veces - 1) throw err;
      log(`   Error transitorio: ${msg}`);
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

async function seoFields(
  title: string,
  markdown: string,
): Promise<{ excerpt: string; meta_description: string }> {
  const cut = (s: string, max: number) => {
    const t = s.trim().replace(/^["']+|["']+$/g, "");
    if (t.length <= max) return t;
    const slice = t.slice(0, max);
    const sp = slice.lastIndexOf(" ");
    return (sp > 40 ? slice.slice(0, sp) : slice).trim();
  };
  const fallback = cut(markdown.replace(/[#*_`]/g, " ").replace(/\s+/g, " "), 160);
  let raw = "";
  try {
    raw = await chat(
      [
        { role: "system", content: BLOG_SEO_METADATA_PROMPT },
        {
          role: "user",
          content: `Título: ${title}\n\n${markdown.slice(0, 4000)}`,
        },
      ],
      { max: 1500, json: true },
    );
  } catch {
    return { excerpt: fallback, meta_description: fallback };
  }
  let parsed: { excerpt?: string; meta_description?: string } = {};
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    /* fallback */
  }
  return {
    excerpt: cut(parsed.excerpt || fallback, 220),
    meta_description: cut(parsed.meta_description || fallback, 160),
  };
}

function escribir(post: PostFile, cuerpo: string, description: string) {
  const data: Record<string, unknown> = {
    slug: post.slug,
    title: post.title,
    date: post.data.date ?? post.date,
    description,
    status: post.data.status ?? "published",
  };
  if (post.servicio) data.servicio = post.servicio;
  if (post.cover) data.cover = post.cover;
  data.reescrito = true;
  fs.writeFileSync(post.full, matter.stringify(cuerpo.trim() + "\n", data));
}

export async function redactBlogArticle(
  urlOrSlug: string,
  options: RedactOptions = {},
): Promise<RedactResult> {
  const log = options.log ?? ((msg) => console.log(msg));
  const warnings: string[] = [];
  const slug = extractSlug(urlOrSlug);
  log(`Cargando ${slug}`);
  const post = loadPost(slug);
  log(`   ${post.title}${post.servicio ? ` · ${post.servicio}` : ""}`);

  if (post.reescrito && !options.force && !options.seoOnly) {
    return {
      slug: post.slug,
      title: post.title,
      wordCount: wordCount(post.content),
      description: post.description,
      excerpt: post.description,
      saved: false,
      skipped: "ya reescrito (usa --force)",
      warnings,
    };
  }

  let markdown = post.content;
  if (!options.seoOnly) {
    log("Primera pasada (web_search)…");
    const draftRaw = await withRetry(
      () =>
        responsesWithSearch(
          BLOG_REDACTOR_SYSTEM_PROMPT,
          `${editorialContext(post, "redaccion")}\n\nRedacta ahora el artículo completo en Markdown.`,
          log,
        ),
      log,
    );
    const draft = cleanMarkdown(draftRaw, post.title);
    log(`   Borrador: ${wordCount(draft)} palabras`);

    log("Segunda pasada (refinado)…");
    let refined = "";
    try {
      refined = await chat(
        [
          { role: "system", content: BLOG_REDACTOR_SYSTEM_PROMPT },
          {
            role: "user",
            content: `${BLOG_REFINE_PROMPT}\n\nTítulo (NO lo repitas): ${post.title}\nOficio: ${post.servicio || "—"}\n\n${linksBrief()}\n\n## BORRADOR\n${draft}`,
          },
        ],
        { max: 8000 },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push(`Segunda pasada falló (${msg}): se conserva el borrador.`);
      log(`   Segunda pasada omitida: ${msg}`);
    }
    markdown = cleanMarkdown(refined || draft, post.title);
    if (!markdown) markdown = draft;
  }

  log("Metadatos SEO…");
  const seo = await seoFields(post.title, markdown);
  const words = wordCount(markdown);

  if (options.dryRun) {
    log("dry-run: no se guarda.");
    return {
      slug: post.slug,
      title: post.title,
      wordCount: words,
      description: seo.meta_description,
      excerpt: seo.excerpt,
      saved: false,
      warnings,
    };
  }

  escribir(post, markdown, seo.meta_description);
  log(`Guardado · ${words} palabras`);
  return {
    slug: post.slug,
    title: post.title,
    wordCount: words,
    description: seo.meta_description,
    excerpt: seo.excerpt,
    saved: true,
    warnings,
  };
}

export async function redactAllPending(options: RedactOptions = {}): Promise<RedactResult[]> {
  const log = options.log ?? ((msg) => console.log(msg));
  const out: RedactResult[] = [];
  for (const slug of listBlogSlugs()) {
    log(`\n=== ${slug}`);
    out.push(await redactBlogArticle(slug, options));
  }
  return out;
}
