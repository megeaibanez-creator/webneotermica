/**
 * Agente redactor del blog Neotérmica (CLI).
 *
 *   npm run redact:blog -- comercios-en-murcia
 *   npm run redact:blog -- --all
 *   npm run redact:blog -- --force calderas
 *   npm run redact:blog -- --dry-run comercios
 *   npm run redact:blog -- --seo-only --all
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function parseArgs(argv: string[]) {
  let all = false;
  let dryRun = false;
  let seoOnly = false;
  let force = false;
  const filtros: string[] = [];
  for (const a of argv.slice(2)) {
    if (a === "--all") all = true;
    else if (a === "--dry-run") dryRun = true;
    else if (a === "--seo-only") seoOnly = true;
    else if (a === "--force" || a === "--reescribir") force = true;
    else if (!a.startsWith("--")) filtros.push(a);
  }
  return { all, dryRun, seoOnly, force, filtros };
}

function usage(): never {
  console.error(`
Uso:
  npm run redact:blog -- <trozo-de-slug>
  npm run redact:blog -- --all
  npm run redact:blog -- --force calderas
  npm run redact:blog -- --dry-run comercios

Opciones: --all  --force  --dry-run  --seo-only
`);
  process.exit(1);
}

async function main() {
  const { redactBlogArticle, listBlogSlugs } = await import("../src/lib/blog/blog-redactor");
  const { all, dryRun, seoOnly, force, filtros } = parseArgs(process.argv);
  if (!all && !filtros.length) usage();
  if (!process.env.OPENAI_API_KEY?.trim()) {
    console.error("Falta OPENAI_API_KEY en .env.local");
    process.exit(1);
  }

  const todos = await listBlogSlugs();
  const slugs = all ? todos : todos.filter((s) => filtros.some((f) => s.includes(f)));
  if (!slugs.length) {
    console.error("Ningún artículo coincide.");
    process.exit(1);
  }

  console.log("Agente redactor Neotérmica");
  console.log(`Modelo: ${process.env.BLOG_REDACTOR_MODEL || "gpt-5.6-terra"}`);
  console.log(`Artículos: ${slugs.length}${dryRun ? " · dry-run" : ""}${force ? " · force" : ""}`);

  let ok = 0;
  let skip = 0;
  for (const slug of slugs) {
    console.log(`\n=== ${slug}`);
    const r = await redactBlogArticle(slug, { dryRun, seoOnly, force });
    if (r.skipped) {
      console.log(`   — ${r.skipped}`);
      skip++;
      continue;
    }
    console.log(`   ${r.wordCount} palabras · ${r.description}`);
    if (r.warnings.length) r.warnings.forEach((w) => console.log(`   ! ${w}`));
    ok++;
  }
  console.log(`\nHecho. Reescritos: ${ok}. Saltados: ${skip}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
