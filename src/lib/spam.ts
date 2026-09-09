/**
 * Anti-spam silencioso (molde Eskala 31 ago + GVC/ACTTAX 2–3 sep).
 * Sin captcha: el visitante no ve nada. El bot recibe { ok: true }.
 * El honeypot solo caza bots tontos; los listos se pillan por el contenido.
 */

export type SpamInput = {
  name: string;
  email: string;
  message: string;
  website: string;
  fax?: string;
  form_started_at: number;
};

/** Tiempo mínimo razonable para rellenar el formulario (ms). */
const MIN_MS = 2500;
/** Un envío con el formulario abierto más de un día suele ser replay de bot. */
const MAX_MS = 24 * 60 * 60 * 1000;

/** Token tipo bot: una sola palabra, mayúsculas en medio (iNgXrKYUMiecBwtr). */
function pareceTokenMezclado(value: string): boolean {
  const t = value.trim();
  if (t.length < 12 || /\s/.test(t) || !/^[A-Za-z0-9]+$/.test(t)) return false;
  const innerCaps = t.slice(1).replace(/[^A-Z]/g, "").length;
  const lowers = (t.match(/[a-z]/g) || []).length;
  const uppers = (t.match(/[A-Z]/g) || []).length;
  return innerCaps >= 3 && lowers >= 3 && uppers >= 3;
}

/** Palabras largas casi sin vocales. */
function pareceTokenSinVocales(texto: string): boolean {
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

/** Pitch copywriter/Calendly, guest-post / backlinks y venta fría B2B (Savin Kumar / FactuON). */
function parecePitchMarketing(message: string): boolean {
  const m = message.toLowerCase();
  if (m.includes("calendly.com")) return true;
  if (/freelance writer|writing projects|thought leadership|press releases/.test(m)) {
    return true;
  }
  if (
    /guest posts?|link building|backlinks?|dofollow|do-follow|write for (us|your website)|sponsored post/.test(
      m
    )
  ) {
    return true;
  }
  if (/prueba gratuita|tarjeta bancaria|demo r[aá]pida|agend(ar|a) (una )?demo/.test(m)) {
    return true;
  }
  if (/desde\s+\d+([.,]\d+)?\s*€\s*\/\s*(mes|factura|año|empleado|usuario)/.test(m)) {
    return true;
  }
  const links = m.match(/https?:\/\/[^\s]+/g) ?? [];
  if (links.length >= 2) return true;
  if (links.some((l) => /pricing|demo|youtube\.com|youtu\.be|bit\.ly/.test(l))) return true;
  return false;
}

export function detectarSpam(input: SpamInput): { spam: boolean; motivo?: string } {
  if (input.website.trim() !== "" || String(input.fax ?? "").trim() !== "") {
    return { spam: true, motivo: "honeypot" };
  }

  const transcurrido = Date.now() - Number(input.form_started_at || 0);
  if (!Number.isFinite(transcurrido) || transcurrido < MIN_MS) {
    return { spam: true, motivo: "demasiado_rapido" };
  }
  if (transcurrido > MAX_MS) return { spam: true, motivo: "formulario_caducado" };

  if (pareceTokenMezclado(input.name) || pareceTokenMezclado(input.message)) {
    return { spam: true, motivo: "token_aleatorio" };
  }
  if (pareceTokenSinVocales(`${input.name} ${input.message}`)) {
    return { spam: true, motivo: "token_aleatorio" };
  }

  if (gmailConPuntos(input.email)) return { spam: true, motivo: "gmail_puntos" };

  if (parecePitchMarketing(input.message)) {
    return { spam: true, motivo: "pitch_marketing" };
  }

  const enlaces = (input.message.match(/https?:\/\//g) ?? []).length;
  if (enlaces >= 2) return { spam: true, motivo: "exceso_enlaces" };

  return { spam: false };
}
