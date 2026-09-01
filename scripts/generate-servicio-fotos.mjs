/**
 * One-off: portadas de oficio con gpt-image-2 (molde Furgocasa).
 * Clave: OPENAI_API_KEY de .env.local. No imprime la clave.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const COMUN =
  "Photorealistic documentary photo, natural Mediterranean daylight, Spanish home or workshop in Murcia region. No text, no logos, no watermarks, no brand names, no UI. Shot as a real installation, not a glossy catalogue.";

const TRABAJOS = [
  {
    file: "servicio-conductos-v3.jpg",
    prompt: `${COMUN} Single photograph, one scene only, no split-screen, no collage, no before-after, no diptych. Camera angled slightly upward so the SUBJECT sits in the CENTER of the frame: slim white linear slot diffusers built into a plaster bulkhead in a Spanish living room. Sofa visible in the lower third. No exposed ducts, no silver flex tubing, no plenum, no crawl space, no octopus. NOT a wall split, NOT an outdoor unit.`,
  },
  {
    file: "servicio-aerotermia.jpg",
    prompt: `${COMUN} Subject: air-to-water heat pump (aerotermia) outdoor unit sitting on a patio next to a Spanish house, larger than a split condenser, insulated pipes entering the wall. This is NOT a small wall-mounted AC, NOT boilers.`,
  },
  {
    file: "servicio-suelo-radiante.jpg",
    prompt: `${COMUN} Subject: underfloor heating being installed: red PEX pipe loops laid on insulation boards over a concrete slab, plus a hydraulic manifold with flow meters. This is floor heating pipes, NOT air conditioning, NOT a remote control, NOT wall radiators.`,
  },
  {
    file: "servicio-radiadores.jpg",
    prompt: `${COMUN} Subject: white hydronic panel radiators mounted on an interior wall of a Spanish home, pipes at the floor, warm living room. This is radiators, NOT an outdoor AC unit, NOT underfloor pipes.`,
  },
  {
    file: "servicio-ventilacion-v2.jpg",
    prompt: `${COMUN} Single photograph, one scene only, no split-screen. Eye-level, SUBJECT in the CENTER of the frame: a stainless-steel kitchen extraction hood (campana) over a cooking island or range in a Spanish home or small restaurant kitchen. Photogenic finished room, warm light. This is extraction / ventilation. NOT a circular ceiling valve, NOT looking up at a hole in the ceiling, NOT a doorway shot, NOT linear AC slots, NOT exposed ducts, NOT an octopus of pipes.`,
  },
];

const outDir = path.join(root, "public", "images");

async function generar(trabajo) {
  const dest = path.join(outDir, trabajo.file);
  console.log("Generando", trabajo.file, "…");
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt: trabajo.prompt,
      size: "1536x1024",
      quality: "high",
      output_format: "jpeg",
      n: 1,
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`${trabajo.file}: ${res.status} ${raw.slice(0, 400)}`);
  }
  const data = JSON.parse(raw);
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error(`${trabajo.file}: sin b64_json`);
  fs.writeFileSync(dest, Buffer.from(b64, "base64"));
  console.log("OK", trabajo.file, fs.statSync(dest).size, "bytes");
}

const filtros = process.argv.slice(2);
const lista = filtros.length
  ? TRABAJOS.filter((t) => filtros.some((f) => t.file.includes(f)))
  : TRABAJOS;
if (!lista.length) {
  console.error("Nada que generar. Filtro:", filtro);
  process.exit(1);
}
for (const t of lista) {
  await generar(t);
}
