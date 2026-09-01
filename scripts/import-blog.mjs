/**
 * Importa los 21 posts de la WordPress a content/blog/.
 *
 *   node scripts/import-blog.mjs
 *
 * Fuente:  blog-actual/_indice.json  +  blog-actual/{slug}.md
 * Destino: content/blog/{slug}.md con frontmatter (slug, title, date,
 *          description, status, servicio?, revisar?)
 *
 * Reglas que respeta:
 *   · El slug es EL MISMO de la WP. No se rompe ningún enlace.
 *   · `date` es la fecha de ALTA (`published` del índice), no el `modified`
 *     de junio 2025, que fue un retoque en bloque.
 *   · Sin portadas: la WP no tenía.
 *
 * AVISO CONOCIDO: el scraping original perdió las listas <ul> y los <h2>.
 * Por eso quedan párrafos que anuncian una lista que no existe ("...garantiza:").
 * El script los detecta, marca el post con `revisar: true` y los lista al final
 * para poder repasarlos uno a uno más adelante.
 *
 * Es idempotente: sobrescribe el destino en cada pasada.
 */

import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const ORIGEN = path.join(RAIZ, "blog-actual");
const DESTINO = path.join(RAIZ, "content", "blog");

/** Post -> landing con la que emparenta (para "artículos relacionados"). */
const SERVICIO_POR_SLUG = {
  "guia-completa-para-la-instalacion-de-aires-acondicionados": "aire-acondicionado-splits",
  "los-mejores-sistemas-de-ventilacion-para-cocinas-comerciales": "ventilacion",
  "como-mejorar-la-eficiencia-energetica-de-tu-hogar": "aerotermia",
  "sistemas-de-ventilacion-eficientes-para-banos-en-murcia": "ventilacion",
  "diferencias-entre-aire-acondicionado-split-y-portatil-cual-elegir-para-tu-hogar-o-negocio-en-murcia":
    "aire-acondicionado-splits",
  "los-mejores-servicios-de-climatizacion-para-comercios-en-murcia":
    "aire-acondicionado-conductos",
  "como-optimizar-el-consumo-electrico-con-la-programacion-de-tu-aire-acondicionado":
    "reparacion-mantenimiento",
  "beneficios-de-la-climatizacion-inteligente-para-empresas": "aire-acondicionado-conductos",
  "aire-acondicionado-o-climatizacion-que-es-mejor-para-tu-casa": "aire-acondicionado-splits",
  "ventajas-de-los-sistemas-de-climatizacion-multi-split": "aire-acondicionado-splits",
  "tendencias-en-climatizacion-para-2025-lo-ultimo-en-tecnologia": "aerotermia",
  "como-enfria-el-aire-acondicionado": "aire-acondicionado-splits",
  "climatizacion-inteligente-tecnologia-para-hogares-modernos": "aire-acondicionado-conductos",
  "consejos-para-el-mantenimiento-de-tu-aire-acondicionado": "reparacion-mantenimiento",
  "guia-para-el-mantenimiento-de-sistemas-de-extraccion": "ventilacion",
  "por-que-contratar-profesionales-para-instalar-tu-aire-acondicionado-en-murcia":
    "aire-acondicionado-splits",
  "aire-acondicionado-y-salud-consejos-para-un-ambiente-sano": "ventilacion",
  "proceso-de-instalacion-de-aires-acondicionados-en-murcia-paso-a-paso":
    "aire-acondicionado-splits",
  "como-preparar-tu-aire-acondicionado-para-el-verano-guia-especializada-neotermica-murcia":
    "reparacion-mantenimiento",
  "instalacion-de-calderas-en-murcia-proceso-y-recomendaciones": "calderas",
  // El de placas solares se publica, pero NO abre línea de negocio:
  // deliberadamente sin `servicio`, para que no cuelgue de ninguna landing.
};

/** Quita el H1 y el bloque de metadatos que puso el scraper. */
function extraerCuerpo(raw) {
  const lineas = raw.split(/\r?\n/);
  let i = 0;
  while (i < lineas.length && lineas[i].trim() === "") i++;
  if (lineas[i]?.startsWith("# ")) i++;
  while (i < lineas.length) {
    const linea = lineas[i].trim();
    if (linea === "" || /^-\s*(URL|Publicado|Modificado|Meta)\s*:/.test(linea)) {
      i++;
      continue;
    }
    break;
  }
  return lineas.slice(i).join("\n").trim();
}

/** Descripción limpia a partir del primer párrafo (la Meta de la WP venía cortada). */
function hacerDescripcion(texto) {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= 160) return limpio;
  const corte = limpio.slice(0, 160);
  const fin = Math.max(
    corte.lastIndexOf(". "),
    corte.lastIndexOf("? "),
    corte.lastIndexOf("! ")
  );
  if (fin > 80) return corte.slice(0, fin + 1).trim();
  const espacio = corte.lastIndexOf(" ");
  return `${corte.slice(0, espacio > 0 ? espacio : 160).replace(/[,;:]+$/, "")}…`;
}

/** Párrafos que presentan una lista que el scraping se comió. */
function parrafosHuerfanos(cuerpo) {
  return cuerpo
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.endsWith(":") && p.length > 25);
}

/** YAML en comillas dobles: el escapado JSON es válido aquí. */
const y = (valor) => JSON.stringify(String(valor));

function main() {
  if (!fs.existsSync(ORIGEN)) {
    console.error(`No encuentro ${ORIGEN}. ¿Está la carpeta blog-actual/ en la raíz?`);
    process.exit(1);
  }

  const indice = JSON.parse(fs.readFileSync(path.join(ORIGEN, "_indice.json"), "utf8"));
  fs.mkdirSync(DESTINO, { recursive: true });

  const aRevisar = [];
  let escritos = 0;

  for (const entrada of indice) {
    const origen = path.join(ORIGEN, `${entrada.slug}.md`);
    if (!fs.existsSync(origen)) {
      console.warn(`  ! falta el cuerpo de ${entrada.slug}, se salta`);
      continue;
    }

    const cuerpo = extraerCuerpo(fs.readFileSync(origen, "utf8"));
    if (!cuerpo) {
      console.warn(`  ! ${entrada.slug} se ha quedado sin cuerpo, se salta`);
      continue;
    }

    const primerParrafo = cuerpo.split(/\n{2,}/)[0] ?? "";
    const huerfanos = parrafosHuerfanos(cuerpo);
    const servicio = SERVICIO_POR_SLUG[entrada.slug];

    const frontmatter = [
      "---",
      `slug: ${y(entrada.slug)}`,
      `title: ${y(entrada.title)}`,
      `date: ${y(entrada.published.slice(0, 10))}`, // fecha de ALTA
      `description: ${y(hacerDescripcion(primerParrafo))}`,
      "status: published",
      ...(servicio ? [`servicio: ${y(servicio)}`] : []),
      ...(huerfanos.length
        ? [
            "revisar: true",
            `# ${huerfanos.length} párrafo(s) anuncian una lista que el scraping perdió`,
          ]
        : []),
      "---",
      "",
      "",
    ].join("\n");

    fs.writeFileSync(path.join(DESTINO, `${entrada.slug}.md`), frontmatter + cuerpo + "\n", "utf8");
    escritos++;
    if (huerfanos.length) aRevisar.push({ slug: entrada.slug, n: huerfanos.length });
  }

  console.log(`\n${escritos} posts escritos en content/blog/`);

  if (aRevisar.length) {
    const total = aRevisar.reduce((suma, p) => suma + p.n, 0);
    console.log(
      `\nPendiente de arreglar: ${aRevisar.length} posts con ${total} párrafos huérfanos ` +
        `(anuncian una lista que la WordPress tenía y el scraping perdió).`
    );
    for (const p of aRevisar.sort((a, b) => b.n - a.n)) {
      console.log(`  ${String(p.n).padStart(2)} · ${p.slug}`);
    }
    console.log(
      `\nEstán marcados con "revisar: true" en el frontmatter, así que se localizan con un grep.`
    );
  }
}

main();
