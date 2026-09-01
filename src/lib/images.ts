/**
 * Fotos del sitio. Solo se asignan a un oficio si la foto ES ese oficio.
 * Las he visto. No hay rotación «para que no se repitan».
 *
 *   hero_servicios.jpg      · unidad exterior de aire en fachada
 *   hero_inicio_1.jpg       · otra unidad exterior en fachada
 *   slider_1.jpg            · dos termos / calentadores de ACS
 *   slider_2.jpg            · salón con split mural y un radiador (no es un oficio)
 *   slider_3.jpg            · mando de aire y split mural
 *   nuestra_trayectoria.jpg · técnico con manómetros (revisión de aire)
 *
 * servicio-conductos.jpg    · pulpo viejo (no usar)
 * servicio-conductos-v3.jpg · rejilla lineal en salón acabado (IA)
 * servicio-aerotermia.jpg   · bomba de calor en patio (IA, 31 ago)
 * servicio-suelo-radiante.jpg · tubos PEX + colector (IA, 31 ago)
 * servicio-radiadores.jpg   · radiadores de panel en vivienda (IA, 31 ago)
 * servicio-ventilacion.jpg  · agujero en techo (no usar)
 * servicio-ventilacion-v2.jpg · campana de cocina (IA)
 */

const REMOTE = false;
const WP = "https://neotermica.com/wp-content/uploads/2023/05";

function img(nombre: string): string {
  return REMOTE ? `${WP}/${nombre}` : `/images/${nombre}`;
}

export const IMG = {
  heroInicio: img("hero_inicio_1.jpg"),
  heroServicios: img("hero_servicios.jpg"),
  trayectoria: img("nuestra_trayectoria.jpg"),
  slider1: img("slider_1.jpg"),
  slider2: img("slider_2.jpg"),
  slider3: img("slider_3.jpg"),
  conductos: img("servicio-conductos-v3.jpg"),
  aerotermia: img("servicio-aerotermia.jpg"),
  sueloRadiante: img("servicio-suelo-radiante.jpg"),
  radiadores: img("servicio-radiadores.jpg"),
  ventilacion: img("servicio-ventilacion-v2.jpg"),
} as const;

export const MARCAS = [
  { src: "/images/Marca-1.svg", nombre: "Daikin" },
  { src: "/images/Marca-2.svg", nombre: "Fujitsu" },
  { src: "/images/Marca-3.svg", nombre: "Mitsubishi Electric" },
  { src: "/images/Marca-4.svg", nombre: "Toshiba" },
  { src: "/images/Marca-5.svg", nombre: "Gree" },
  { src: "/images/Marca-6.svg", nombre: "Panasonic" },
] as const;

/** Solo oficios con foto que coincide. El resto: null. */
export const IMG_SERVICIO: Record<string, string | null> = {
  "aire-acondicionado-splits": IMG.slider3,
  "aire-acondicionado-conductos": IMG.conductos,
  aerotermia: IMG.aerotermia,
  "suelo-radiante": IMG.sueloRadiante,
  calderas: IMG.slider1,
  radiadores: IMG.radiadores,
  ventilacion: IMG.ventilacion,
  "reparacion-mantenimiento": IMG.trayectoria,
};

export function fotoServicio(slug: string): string | null {
  return IMG_SERVICIO[slug] ?? null;
}
