/** Datos reales de la empresa. No inventar dirección, NIF ni coordenadas de local. */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.neotermica.com";

export const EMPRESA = {
  nombre: "Neotérmica Climatización",
  marca: "Neotérmica",
  fundador: "José Carlos Moya",
  fundacion: 2012,
  telefono: "678 495 046",
  telefonoPlano: "678495046",
  telefonoHref: "tel:678495046",
  whatsapp: "https://wa.me/34678495046",
  email: "info@neotermica.es",
  horario: "Lunes a viernes, 9:00–14:00 y 15:30–19:00",
  ciudad: "Murcia",
  // NAP = teléfono + email + "Murcia". La web actual no publica calle: no la inventamos.
  googlePerfil: "https://www.google.com/search?q=Neotermica&kgmid=/g/11wp53z0y2",
} as const;

/** Quién puede entrar en /administrator. Cualquier otro Auth (p. ej. Google ajeno) se echa. */
export const ADMIN_EMAILS = ["megeaibanez@gmail.com"] as const;

export function esEmailAdmin(email: string | null | undefined): boolean {
  const n = email?.trim().toLowerCase();
  return Boolean(n && (ADMIN_EMAILS as readonly string[]).includes(n));
}

/** Reseñas públicas de Google del perfil de Neotérmica. No usar Trustindex (mezcla una inmobiliaria). */
export const RESENAS_GOOGLE = [
  {
    autor: "Isabel",
    fecha: "26/08/2026",
    texto:
      "Muy contentos con el trabajo que nos ha hecho José Carlos. Teníamos un problema con el aire acondicionado y nos lo solucionó rápidamente y con mucha profesionalidad. Sin duda lo volveremos a llamar cuando lo necesitemos.",
  },
  {
    autor: "Belén Morales",
    fecha: "30/07/2026",
    texto:
      "Estoy muy contenta con el servicio recibido, desde solicitar presupuesto hasta la instalación del equipo. Llegaron puntuales, trabajaron de forma limpia y ordenada y dejaron todo perfectamente instalado. ¡Sin duda los recomendaré a familiares y amigos!",
  },
  {
    autor: "Josefa",
    fecha: "27/07/2026",
    texto:
      "Atención rápida y eficiente en la instalación de A/Ac por conductos. Trato amable y seriedad. José Carlos solucionó de forma eficaz incidencia que surgió durante la instalación. Los recomendaría, a él y a los chicos que lo acompañaban. Gran profesionalidad.",
  },
] as const;
