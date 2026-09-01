/**
 * Portadas del blog Neotérmica (molde Furgocasa, sin flota).
 *
 * 1) Lee `blog_articles`
 * 2) gpt-5.6-terra elige registro + idea visual (evita repetir las 5 anteriores)
 * 3) El mismo modelo escribe el prompt y lo pule
 * 4) gpt-image-2 genera la foto
 * 5) Sube al bucket `blog/covers` y escribe `cover` en la fila
 *
 * Corre DESPUÉS del agente redactor (el prompt lee el artículo).
 * Sin `reescrito` se salta el post (salvo --force).
 *
 *   npm run generate:blog-covers
 *   npm run generate:blog-covers -- --force
 *   npm run generate:blog-covers -- calderas
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const cut = line.indexOf("=");
  if (cut < 1 || line.startsWith("#")) continue;
  const k = line.slice(0, cut).trim();
  const v = line.slice(cut + 1).trim();
  if (k && v && !process.env[k]) process.env[k] = v;
}

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("Falta OPENAI_API_KEY en .env.local");
  process.exit(1);
}

const TEXT_MODEL = process.env.BLOG_COVER_TEXT_MODEL?.trim() || "gpt-5.6-terra";
const TEXT_FALLBACK = "gpt-4o";
const IMAGE_MODEL = process.env.BLOG_COVER_IMAGE_MODEL?.trim() || "gpt-image-2";
const FEED_PATH = path.join(root, ".data", "blog-cover-feed.json");
const ESCENAS = ["habitacion", "tecnico", "equipo", "detalle"];

const CLASIFICADOR = `Eres el director de arte del blog de Neotérmica, climatización en Murcia.
El listing de portadas se lee como un feed: cada foto debe evocar una IDEA distinta, no el mismo split de pared con otro título.

Recibes un DOSSIER del artículo y, si existe, las 5 portadas recientes (idea + registro). Elige el registro que FALTA y que aún así encaja con el texto.

Salida: JSON válido EXACTAMENTE así:
{
  "scene_type": "habitacion" | "tecnico" | "equipo" | "detalle",
  "visual_idea": "<escena concreta, fotografiable, 12-28 palabras, distinta de las 5 últimas>",
  "rationale": "<qué tropo evitas y qué aporta esta portada>"
}

Registros:
- habitacion: estancia acabada de vivienda o local en Murcia (salón, dormitorio, oficina, cocina, baño) con el sistema YA instalado y visible de forma honesta.
- tecnico: oficio real: manos, manómetros, anclaje, carga de gas, limpieza de filtros, no posado de catálogo.
- equipo: máquina protagonista: unidad exterior, bomba de calor, caldera, colector, campana, placas en tejado si el artículo es solar.
- detalle: still life a escala de mesa/manos: termostato, mando, rejilla, tubería PEX, llave de radiador. Nunca filtros apelmazados de polvo.

PROHIBIDO SIEMPRE:
- Texto, logos, marcas (Daikin, Mitsubishi…), UI, collage, díptico, before/after, render 3D.
- Pulpo de conductos flexibles, falso techo abierto, agujero en el techo mirando hacia arriba.
- Sonrisa de stock mirando a cámara, hero de casco cromado.
- Inventar un oficio que el artículo no trata (si habla de calderas, no pongas un split).
- Filtros sucios como protagonista, pelusa apelmazada, aspiradora + filtros, «suciedad de catálogo».

Si las 5 últimas están llenas de splits murales, NO elijas otro split. Devuelve SOLO el JSON.`;

const REDACTOR = `Eres director de arte y especialista en prompts para fotos fotorrealistas.
Recibes un DOSSIER y un SCENE_TYPE ya decidido. Tu ÚNICA salida es UN párrafo en español que el modelo de imagen usará tal cual.

ANTES de escribir (no lo imprimas):
1. Si el dossier trae "Idea visual obligatoria", ESA es la escena.
2. Salta los tropos de las 5 portadas recientes.
3. Una sola escena, fotografiable, honesta con el artículo y con Murcia (luz mediterránea, vivienda o local español).
4. 2-4 materiales reales (yeso, cobre, aluminio, tela, madera, condensación, polvo de obra fina).

REGLAS:
- Empieza por: Fotografía hiperrealista y cinematográfica de
- Un párrafo, sin comillas, sin markdown, sin listas.
- Prohibido: texto, logos, marcas, collage, díptico, render, ilustración, pulpo de conductos, agujero de techo.
- Cierra con: composición editorial premium, profundidad de campo natural, texturas realistas, encuadre horizontal amplio, sin texto ni logos, realismo fotográfico absoluto, portada web de alta conversión.`;

const PULIDOR = `Eres un editor fotográfico obsesionado con el hiperrealismo.
Reescribes el prompt para que parezca FOTO REAL, respetando SCENE_TYPE e idea visual.
Rebaja catálogo, HDR, glow, sonrisas, simetría. Luz existente, materiales concretos.
Un párrafo en español, sin explicaciones, empezando por "Fotografía hiperrealista y cinematográfica de".`;

const COLA_FOTO =
  "Tomada como fotografía real con cámara full frame y óptica de reportaje, luz mediterránea creíble, color natural, contraste moderado, grano mínimo, detalle auténtico en yeso, metal, tela o vegetación; luminosa y útil como portada editorial horizontal de blog, sin HDR agresivo, sin plástico, sin render 3D, sin tipografía ni logotipos.";

function cargarEnvFeed() {
  if (!fs.existsSync(FEED_PATH)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(FEED_PATH, "utf8"));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function guardarFeed(feed) {
  fs.mkdirSync(path.dirname(FEED_PATH), { recursive: true });
  fs.writeFileSync(FEED_PATH, JSON.stringify(feed.slice(-40), null, 2));
}

function limpia(s) {
  return String(s || "")
    .replace(/^["']+|["']+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function recorta(s, n) {
  return s.length <= n ? s : s.slice(0, n);
}

async function openaiFetch(url, body, intento = 0) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (intento === 0) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      console.warn("TLS: reintento con NODE_TLS_REJECT_UNAUTHORIZED=0");
      return openaiFetch(url, body, 1);
    }
    throw err;
  }
  const raw = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${raw.slice(0, 500)}`);
  return JSON.parse(raw);
}

async function chat(messages, { json = false, max = 1200, model = TEXT_MODEL } = {}) {
  const esGpt5 = /gpt-5/i.test(model);
  const body = {
    model,
    messages,
    ...(esGpt5
      ? { max_completion_tokens: max, reasoning_effort: "low" }
      : { max_tokens: max, temperature: json ? 0.2 : 0.35 }),
    ...(json ? { response_format: { type: "json_object" } } : {}),
  };
  try {
    const data = await openaiFetch("https://api.openai.com/v1/chat/completions", body);
    const text = data.choices?.[0]?.message?.content || "";
    if (!text.trim()) throw new Error("respuesta vacía");
    return text;
  } catch (err) {
    if (json && /response_format|json_object/i.test(String(err.message))) {
      return chat(messages, { json: false, max, model });
    }
    if (model !== TEXT_FALLBACK) {
      console.warn(`Texto ${model} falló, pruebo ${TEXT_FALLBACK}:`, err.message);
      return chat(messages, { json, max, model: TEXT_FALLBACK });
    }
    throw err;
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const a = text.indexOf("{");
    const b = text.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(text.slice(a, b + 1));
    throw new Error("JSON inválido del clasificador");
  }
}

function dossier(post, recientes, idea) {
  const cuerpo = recorta(post.content.replace(/\s+/g, " ").trim(), 3500);
  const feed = recientes
    .slice(-5)
    .map((r, i) => `${i + 1}. [${r.scene_type}] ${r.visual_idea}`)
    .join("\n");
  return `
=== DOSSIER ===
Título: ${post.title}
Resumen: ${post.description}
Oficio / categoría: ${post.servicio || "sin oficio (puede ser solar u otro)"}
Cuerpo:
${cuerpo}

--- Marca ---
Neotérmica, climatización en Murcia desde 2012. Viviendas y locales. Sin calle inventada.
Objetivo: portada horizontal del artículo (listado + cabecera + Open Graph).

--- Portadas recientes (NO te parezcas) ---
${feed || "Todavía no hay portadas. Empieza con una idea clara y concreta."}

${idea ? `--- Idea visual obligatoria ---\n${idea}\n` : ""}
--- Prohibido ---
texto, logos, marcas, collage, pulpo de conductos, agujero de techo, sonrisa de catálogo, oficio que el artículo no trata.
`.trim();
}

async function subirPortada(slug, buf) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  if (process.env.BLOG_REDACTOR_INSECURE_TLS !== "0") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
  const sb = createClient(url, service, { auth: { persistSession: false } });
  const dest = `covers/${slug}.jpg`;
  const { error } = await sb.storage.from("blog").upload(dest, buf, {
    contentType: "image/jpeg",
    upsert: true,
    cacheControl: "2592000",
  });
  if (error) {
    console.error("  Storage:", error.message);
    return null;
  }
  const publicUrl = `${sb.storage.from("blog").getPublicUrl(dest).data.publicUrl}?v=${Date.now()}`;
  await sb
    .from("blog_articles")
    .update({ cover: publicUrl, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  return publicUrl;
}


async function clasificar(dos) {
  const raw = await chat(
    [
      { role: "system", content: CLASIFICADOR },
      { role: "user", content: dos },
    ],
    { json: true, max: 600 },
  );
  const parsed = parseJson(raw);
  const scene = ESCENAS.includes(parsed.scene_type) ? parsed.scene_type : "detalle";
  return {
    scene_type: scene,
    visual_idea: limpia(parsed.visual_idea),
    rationale: limpia(parsed.rationale),
  };
}

async function promptVisual(dos, scene) {
  const primero = limpia(
    await chat(
      [
        { role: "system", content: REDACTOR },
        { role: "user", content: `SCENE_TYPE: ${scene}\n\n${dos}` },
      ],
      { max: 1400 },
    ),
  );
  if (primero.length < 80) throw new Error("Prompt corto en la primera pasada");
  const pulido = limpia(
    await chat(
      [
        { role: "system", content: PULIDOR },
        {
          role: "user",
          content: `SCENE_TYPE: ${scene}\n\nDOSSIER:\n${dos}\n\nPRIMER PROMPT:\n${primero}`,
        },
      ],
      { max: 1400 },
    ),
  );
  const final = recorta(limpia(`${pulido || primero} ${COLA_FOTO}`), 3900);
  return { first: primero, refined: pulido, final };
}

async function generarFoto(prompt) {
  const data = await openaiFetch("https://api.openai.com/v1/images/generations", {
    model: IMAGE_MODEL,
    prompt,
    size: "1536x1024",
    quality: "high",
    output_format: "jpeg",
    n: 1,
  });
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("sin b64_json");
  return Buffer.from(b64, "base64");
}

async function leerPosts() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const sb = createClient(url, service, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from("blog_articles")
    .select("slug,title,date,description,servicio,cover,reescrito,content")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    slug: String(row.slug),
    title: String(row.title || row.slug),
    description: String(row.description || ""),
    servicio: row.servicio ? String(row.servicio) : "",
    cover: row.cover ? String(row.cover) : "",
    reescrito: Boolean(row.reescrito),
    content: String(row.content || ""),
    date: String(row.date || ""),
  }));
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const ideaIdx = args.indexOf("--idea");
const ideaForzada = ideaIdx >= 0 ? String(args[ideaIdx + 1] || "").trim() : "";
const sceneIdx = args.indexOf("--scene");
const sceneForzada = sceneIdx >= 0 ? String(args[sceneIdx + 1] || "").trim() : "";
const filtro = args.filter(
  (a, i) =>
    a !== "--force" &&
    a !== "--idea" &&
    a !== "--scene" &&
    i !== ideaIdx + 1 &&
    i !== sceneIdx + 1,
);

const posts = (await leerPosts()).filter((p) =>
  filtro.length ? filtro.some((f) => p.slug.includes(f)) : true,
);
if (!posts.length) {
  console.error("Ningún artículo coincide.");
  process.exit(1);
}

const feed = cargarEnvFeed();

for (const post of posts) {
  if (!post.reescrito && !force) {
    console.log("— sin texto del agente (redact:blog primero):", post.slug);
    continue;
  }
  if (!force && post.cover) {
    console.log("— ya tiene portada:", post.slug);
    continue;
  }

  console.log("\n===", post.slug);
  const recientes = feed.filter((f) => f.slug !== post.slug).slice(-5);
  const dos0 = dossier(post, recientes);
  const escena = ideaForzada
    ? {
        scene_type: ESCENAS.includes(sceneForzada) ? sceneForzada : "tecnico",
        visual_idea: ideaForzada,
        rationale: "idea forzada",
      }
    : await clasificar(dos0);
  console.log(`  registro: ${escena.scene_type} · ${escena.visual_idea}`);
  if (escena.rationale) console.log(`  por qué: ${escena.rationale}`);

  const dos = dossier(post, recientes, escena.visual_idea);
  const prompts = await promptVisual(dos, escena.scene_type);
  const buf = await generarFoto(prompts.final);
  const remota = await subirPortada(post.slug, buf);
  if (!remota) throw new Error(`No se pudo subir ${post.slug} a Storage`);
  const cover = remota;
  feed.push({
    slug: post.slug,
    scene_type: escena.scene_type,
    visual_idea: escena.visual_idea,
    at: new Date().toISOString(),
  });
  guardarFeed(feed);
  console.log("  OK", cover, buf.length, "bytes");
}

console.log("\nHecho. Portadas en Storage. Nada en Git.");
