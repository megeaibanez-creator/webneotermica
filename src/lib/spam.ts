/**
 * Anti-spam silencioso (heurística Eskala, 31 ago).
 * Sin captcha: el visitante nunca ve nada. El bot recibe { ok: true } y no se guarda.
 */

export type SpamInput = {
  name: string;
  email: string;
  message: string;
  website: string;
  form_started_at: number;
};

/** Tiempo mínimo razonable para rellenar el formulario (ms). */
const MIN_MS = 2500;
/** Un envío con el formulario abierto más de un día suele ser replay de bot. */
const MAX_MS = 24 * 60 * 60 * 1000;

/** Token aleatorio: cadenas largas sin vocales o con mezcla rara de mayúsculas. */
function pareceToken(texto: string): boolean {
  const palabras = texto.split(/\s+/).filter((w) => w.length >= 10);
  return palabras.some((w) => {
    const limpio = w.replace(/[^a-zA-Z]/g, "");
    if (limpio.length < 10) return false;
    const vocales = (limpio.match(/[aeiouAEIOU]/g) ?? []).length;
    return vocales / limpio.length < 0.2;
  });
}

/** Gmail con 4 o más puntos en la parte local: patrón de alias generado. */
function gmailConPuntos(email: string): boolean {
  const [local = "", dominio = ""] = email.toLowerCase().split("@");
  if (!dominio.startsWith("gmail.") && dominio !== "googlemail.com") return false;
  return (local.match(/\./g) ?? []).length >= 4;
}

export function detectarSpam(input: SpamInput): { spam: boolean; motivo?: string } {
  if (input.website.trim() !== "") return { spam: true, motivo: "honeypot" };

  const transcurrido = Date.now() - Number(input.form_started_at || 0);
  if (!Number.isFinite(transcurrido) || transcurrido < MIN_MS)
    return { spam: true, motivo: "demasiado_rapido" };
  if (transcurrido > MAX_MS) return { spam: true, motivo: "formulario_caducado" };

  if (pareceToken(`${input.name} ${input.message}`))
    return { spam: true, motivo: "token_aleatorio" };

  if (gmailConPuntos(input.email)) return { spam: true, motivo: "gmail_puntos" };

  const enlaces = (input.message.match(/https?:\/\//g) ?? []).length;
  if (enlaces >= 3) return { spam: true, motivo: "exceso_enlaces" };

  return { spam: false };
}
