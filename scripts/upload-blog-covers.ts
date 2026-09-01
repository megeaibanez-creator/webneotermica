/**
 * Sube public/images/blog/*.jpg al bucket público `blog` y apunta
 * blog_articles.cover a la URL de Storage.
 *   npx tsx scripts/upload-blog-covers.ts
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "blog";
const PREFIJO = "covers";

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

  const sb = createClient(url, service, { auth: { persistSession: false } });
  const { data: buckets } = await sb.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await sb.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/jpg"],
    });
    if (error) throw new Error(`createBucket: ${error.message}`);
    console.log("Bucket blog creado (público).");
  }

  const dir = path.join(process.cwd(), "public", "images", "blog");
  const jpgs = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".jpg"));

  for (const [i, file] of jpgs.entries()) {
    const slug = file.replace(/\.jpg$/i, "");
    const buf = readFileSync(path.join(dir, file));
    const dest = `${PREFIJO}/${file}`;
    const { error } = await sb.storage.from(BUCKET).upload(dest, buf, {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "2592000",
    });
    if (error) throw new Error(`${file}: ${error.message}`);

    const publicUrl = sb.storage.from(BUCKET).getPublicUrl(dest).data.publicUrl;
    const { error: upErr } = await sb
      .from("blog_articles")
      .update({ cover: publicUrl, updated_at: new Date().toISOString() })
      .eq("slug", slug);
    if (upErr) throw new Error(`cover ${slug}: ${upErr.message}`);
    process.stdout.write(`\r  ${i + 1}/${jpgs.length} ${slug}`);
  }
  console.log(`\nOK ${jpgs.length} portadas en Storage + blog_articles.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
