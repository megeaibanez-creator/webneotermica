/**
 * DEMO de una pasada: 3 obras ficticias publicables para ver /proyectos.
 * Texto inventado (aquí, no LLM). Fotos con gpt-image-2 (OPENAI_API_KEY de .env.local).
 * Van a Supabase (projects) + Storage bucket `blog`, prefijo `proyectos/{slug}/`
 * (público, igual que las portadas del blog → se ven en producción).
 *
 *   node scripts/seed-proyectos-demo.mjs          → crea cliente demo + 3 obras + fotos
 *   node scripts/seed-proyectos-demo.mjs --clean   → borra las obras demo, el cliente y sus fotos
 *
 * Todo lleva marca DEMO en notes para poder barrerlo. No imprime claves.
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
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const DEMO_TAG = "DEMO — borrar";
const CLIENTE_DEMO = "Demo Neotérmica (borrar)";

const COMUN =
  "Photorealistic documentary photo, natural Mediterranean daylight, real home or workshop in the Murcia region of Spain. No text, no logos, no watermarks, no brand names, no people faces in focus, no UI overlays. Looks like a real installation job, not a glossy catalogue render.";

const OBRAS = [
  {
    slug: "aire-conductos-chalet-molina",
    title: "Aire por conductos en chalet de Molina de Segura",
    public_title: "Aire acondicionado por conductos en un chalet",
    service: "aire-acondicionado-conductos",
    municipio: "Molina de Segura",
    m2: 165,
    amount: 7400,
    public_excerpt:
      "Climatización invisible para toda la planta: una sola máquina oculta en el falso techo y rejillas lineales que apenas se ven.",
    public_body: `El cliente estaba de reforma y quería climatizar todo el chalet sin llenar las paredes de splits. Optamos por **aire por conductos**: una unidad interior escondida en el falso techo del pasillo y rejillas lineales repartidas por salón, cocina y dormitorios.

Estudiamos el reparto de aire estancia por estancia para que ninguna habitación quede corta en agosto ni sople de más en invierno. El recorrido de conductos va aislado, con registros para poder mantenerlo sin romper nada.

El resultado es una casa a temperatura uniforme, silenciosa y sin aparatos a la vista. Solo se ven unas finas ranuras blancas integradas en el techo.`,
    fotos: [
      {
        fase: "despues",
        prompt: `${COMUN} Single photograph, one scene only, no split-screen. Finished modern Spanish living room in a chalet, slim white linear slot air diffusers integrated into a clean plaster ceiling bulkhead, sofa and warm daylight below. No wall split units, no exposed ducts.`,
      },
      {
        fase: "durante",
        prompt: `${COMUN} Installer on a ladder fitting insulated flexible air ducts above an open plasterboard suspended ceiling in a house under renovation, ductwork and metal frame visible. Work-in-progress, dust sheets.`,
      },
      {
        fase: "antes",
        prompt: `${COMUN} Empty ceiling cavity of a house under renovation before the air conditioning ducts are installed: bare plasterboard frame and concrete slab, no equipment yet.`,
      },
    ],
  },
  {
    slug: "aerotermia-suelo-radiante-la-alberca",
    title: "Aerotermia con suelo radiante en La Alberca",
    public_title: "Aerotermia y suelo radiante en una vivienda",
    service: "aerotermia",
    municipio: "La Alberca (Murcia)",
    m2: 120,
    amount: 12800,
    public_excerpt:
      "Una bomba de calor para calefacción, refrigeración por suelo y agua caliente. Adiós a la caldera de gas.",
    public_body: `Vivienda unifamiliar que venía de caldera de gas y radiadores. El objetivo: bajar el gasto y ganar confort. Instalamos **aerotermia** con **suelo radiante-refrescante**, así una sola máquina cubre calefacción en invierno, un apoyo de refrigeración en verano y toda el agua caliente sanitaria.

Colocamos la bomba de calor en el patio, el circuito de suelo radiante sobre placa aislante y el colector con caudalímetros por zonas. Cada estancia se regula por separado.

Frente a la caldera anterior, el consumo baja de forma notable y el calor es más homogéneo: sin golpes de aire, sin radiadores ardiendo, temperatura estable en toda la casa.`,
    fotos: [
      {
        fase: "despues",
        prompt: `${COMUN} Air-to-water heat pump (aerotermia) outdoor unit sitting on a tiled patio next to a Spanish house, clearly larger than a small AC condenser, insulated pipes entering the wall, plants around. Golden hour light.`,
      },
      {
        fase: "durante",
        prompt: `${COMUN} Underfloor heating installation: red PEX pipe loops laid in tidy rows over insulation boards on a concrete slab inside a house under construction, ready for screed.`,
      },
      {
        fase: "otro",
        prompt: `${COMUN} Indoor hydronic underfloor-heating manifold cabinet mounted on a utility-room wall: chrome manifold with flow meters and neat coloured pipes, clean finished installation.`,
      },
    ],
  },
  {
    slug: "multisplit-oficina-murcia-centro",
    title: "Multisplit para oficina en el centro de Murcia",
    public_title: "Multisplit en una oficina del centro",
    service: "aire-acondicionado-splits",
    municipio: "Murcia",
    m2: 70,
    amount: 4200,
    public_excerpt:
      "Dos unidades interiores y una sola condensadora para climatizar una oficina sin obra y con la fachada despejada.",
    public_body: `Una oficina de dos salas en pleno centro necesitaba frío en verano y un apoyo de calor en invierno, sin tocar techos ni cerrar el negocio varios días. La solución fue un **multisplit**: dos unidades interiores murales alimentadas por una única condensadora.

Dimensionamos cada equipo según el uso real de cada sala —puestos, orientación y horas de sol— para que trabajen sin forzarse. La unidad exterior quedó ordenada en la fachada trasera, con las líneas ocultas en canaleta.

Instalación limpia y certificada, hecha en una jornada y con el despacho operativo al día siguiente.`,
    fotos: [
      {
        fase: "despues",
        prompt: `${COMUN} Bright modern small office in Spain with two white wall-mounted split air-conditioning indoor units high on the wall, desks and chairs below, large window with daylight. Tidy finished look.`,
      },
      {
        fase: "durante",
        prompt: `${COMUN} Technician mounting the wall bracket for a white split indoor unit on an office wall, hands and tools visible, vacuum pump and gauges on the floor. Work in progress.`,
      },
      {
        fase: "otro",
        prompt: `${COMUN} Exterior back facade of a building with two neat multisplit outdoor condenser units side by side on wall brackets, copper refrigerant lines hidden in white trunking. Clean professional install.`,
      },
    ],
  },
];

async function clean() {
  const slugs = OBRAS.map((o) => o.slug);
  for (const slug of slugs) {
    const { data: files } = await sb.storage.from("blog").list(`proyectos/${slug}`);
    if (files?.length) {
      await sb.storage.from("blog").remove(files.map((f) => `proyectos/${slug}/${f.name}`));
    }
  }
  await sb.from("projects").delete().in("slug", slugs);
  await sb.from("clients").delete().eq("name", CLIENTE_DEMO);
  console.log(`Limpiado: ${slugs.length} obra(s) demo + cliente + fotos de Storage.`);
}

async function generarFoto(prompt) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt,
      size: "1536x1024",
      quality: "high",
      output_format: "jpeg",
      n: 1,
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${raw.slice(0, 300)}`);
  const b64 = JSON.parse(raw).data?.[0]?.b64_json;
  if (!b64) throw new Error("sin b64_json");
  return Buffer.from(b64, "base64");
}

// Sube la foto al bucket público `blog` (mismo que las portadas) bajo proyectos/{slug}/.
async function subirFoto(slug, i, buf) {
  const dest = `proyectos/${slug}/foto-${i}.jpg`;
  const { error } = await sb.storage.from("blog").upload(dest, buf, {
    contentType: "image/jpeg",
    upsert: true,
    cacheControl: "2592000",
  });
  if (error) throw new Error(`Storage: ${error.message}`);
  return `${sb.storage.from("blog").getPublicUrl(dest).data.publicUrl}?v=${Date.now()}`;
}

async function seed() {
  if (!OPENAI_KEY) {
    console.error("Falta OPENAI_API_KEY en .env.local");
    process.exit(1);
  }

  // Cliente demo (reutiliza si ya existe)
  let clienteId;
  const { data: existente } = await sb
    .from("clients")
    .select("id")
    .eq("name", CLIENTE_DEMO)
    .maybeSingle();
  if (existente) {
    clienteId = existente.id;
  } else {
    const { data, error } = await sb
      .from("clients")
      .insert({ name: CLIENTE_DEMO, contact_type: "particular", notes: DEMO_TAG })
      .select("id")
      .single();
    if (error) throw error;
    clienteId = data.id;
  }
  console.log("Cliente demo:", clienteId);

  for (const obra of OBRAS) {
    // Evita duplicar por slug
    await sb.from("projects").delete().eq("slug", obra.slug);

    const { data: fila, error } = await sb
      .from("projects")
      .insert({
        client_id: clienteId,
        title: obra.title,
        service: obra.service,
        municipio: obra.municipio,
        status: "entregado",
        notes: DEMO_TAG,
        m2: obra.m2,
        amount: obra.amount,
        publicable: true,
        slug: obra.slug,
        public_title: obra.public_title,
        public_excerpt: obra.public_excerpt,
        public_body: obra.public_body,
        photos: [],
      })
      .select("id")
      .single();
    if (error) throw error;
    const id = fila.id;

    const photos = [];
    let i = 0;
    for (const foto of obra.fotos) {
      i += 1;
      process.stdout.write(`  ${obra.slug} · foto-${i} (${foto.fase})… `);
      try {
        const buf = await generarFoto(foto.prompt);
        const src = await subirFoto(obra.slug, i, buf);
        photos.push({ src, fase: foto.fase });
        console.log("OK");
      } catch (e) {
        console.log("ERROR", String(e.message || e));
      }
    }
    await sb.from("projects").update({ photos }).eq("id", id);
    console.log(`OBRA LISTA ${obra.slug} → ${photos.length} foto(s)`);
  }
  console.log("DONE");
}

if (process.argv.includes("--clean")) {
  await clean();
} else {
  await seed();
}
