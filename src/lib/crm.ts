/**
 * Taller de Neotérmica: cliente → obra → oferta → factura.
 *
 * Contactos (leads de la web) son otra cosa. Se pasan a cliente a mano.
 * El presupuesto del formulario es un rango; el de aquí es la oferta del taller.
 */

export type ContactType = "particular" | "professional";

export type Client = {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  contact_type: ContactType;
  company: string | null;
  municipio: string | null;
  notes: string | null;
  lead_id: string | null;
};

export type ProjectStatus = "previsto" | "en_obra" | "entregado" | "cancelado";

export type FotoFase = "antes" | "durante" | "despues" | "otro";

export type ProjectPhoto = {
  src: string;
  fase: FotoFase;
};

const MARCA_STORAGE = "/storage/v1/object/public/blog/proyectos/";

function sinQuery(src: string): string {
  const i = src.indexOf("?");
  return i === -1 ? src : src.slice(0, i);
}

/** Foto de obra: disco local o URL pública del bucket `blog/proyectos/{id}/`. */
export function esSrcFotoObra(src: string, projectId?: string): boolean {
  const limpio = sinQuery(src);
  if (limpio.startsWith("/uploads/proyectos/")) {
    return !projectId || limpio.startsWith(`/uploads/proyectos/${projectId}/`);
  }
  if (!limpio.startsWith("https://") || !limpio.includes(MARCA_STORAGE)) return false;
  return !projectId || limpio.includes(`${MARCA_STORAGE}${projectId}/`);
}

/** Ruta dentro del bucket `blog`, o null si no es Storage. */
export function rutaStorageFotoObra(src: string): string | null {
  const limpio = sinQuery(src);
  const marca = "/storage/v1/object/public/blog/";
  const i = limpio.indexOf(marca);
  if (i === -1) return null;
  const ruta = limpio.slice(i + marca.length);
  try {
    return decodeURIComponent(ruta);
  } catch {
    return ruta;
  }
}

export type Project = {
  id: string;
  created_at: string;
  client_id: string;
  title: string;
  service: string | null;
  municipio: string | null;
  status: ProjectStatus;
  notes: string | null;
  m2: number | null;
  amount: number | null;
  photos: ProjectPhoto[];
  publicable: boolean;
  slug: string | null;
  public_title: string | null;
  public_excerpt: string | null;
  public_body: string | null;
};

export const FASES_FOTO: { value: FotoFase; label: string }[] = [
  { value: "antes", label: "Antes" },
  { value: "durante", label: "Durante" },
  { value: "despues", label: "Después" },
  { value: "otro", label: "Otro" },
];

export type QuoteStatus = "borrador" | "enviado" | "aceptado" | "rechazado";

export type Quote = {
  id: string;
  created_at: string;
  client_id: string;
  project_id: string | null;
  number: string;
  title: string;
  amount: number | null;
  status: QuoteStatus;
  notes: string | null;
};

export type InvoiceStatus = "borrador" | "emitida" | "cobrada" | "anulada";

export type Invoice = {
  id: string;
  created_at: string;
  client_id: string;
  project_id: string | null;
  quote_id: string | null;
  number: string;
  title: string | null;
  amount: number;
  status: InvoiceStatus;
  notes: string | null;
};

export type EntidadCrm = "clients" | "projects" | "quotes" | "invoices";

export type SnapshotCrm = {
  clients: Client[];
  projects: Project[];
  quotes: Quote[];
  invoices: Invoice[];
};

export const ESTADOS_PROYECTO: { value: ProjectStatus; label: string }[] = [
  { value: "previsto", label: "Previsto" },
  { value: "en_obra", label: "En obra" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

export const ESTADOS_PRESUPUESTO: { value: QuoteStatus; label: string }[] = [
  { value: "borrador", label: "Borrador" },
  { value: "enviado", label: "Enviado" },
  { value: "aceptado", label: "Aceptado" },
  { value: "rechazado", label: "Rechazado" },
];

export const ESTADOS_FACTURA: { value: InvoiceStatus; label: string }[] = [
  { value: "borrador", label: "Borrador" },
  { value: "emitida", label: "Emitida" },
  { value: "cobrada", label: "Cobrada" },
  { value: "anulada", label: "Anulada" },
];

export const COPY_CRM: Record<
  EntidadCrm,
  { titulo: string; texto: string; alta: string }
> = {
  clients: {
    titulo: "Clientes",
    texto: "Quien contrata. Un lead de Contactos se pasa aquí; no se mezclan.",
    alta: "Nuevo cliente",
  },
  projects: {
    titulo: "Proyectos",
    texto: "Obras e instalaciones. Van ligados a un cliente. Subes fotos del trabajo; la IA redacta la ficha (sin precio ni nombre) y sale en /proyectos.",
    alta: "Nuevo proyecto",
  },
  quotes: {
    titulo: "Presupuestos",
    texto: "Oferta del taller, no el rango del formulario web. Cliente obligatorio; la obra, si ya existe.",
    alta: "Nuevo presupuesto",
  },
  invoices: {
    titulo: "Facturación",
    texto: "Facturas ligadas al cliente y, si encaja, a la obra o al presupuesto aceptado. Serie FAC-año-001.",
    alta: "Nueva factura",
  },
};

export function etiquetaEstado(
  entidad: EntidadCrm,
  valor: string
): string {
  const lista =
    entidad === "projects"
      ? ESTADOS_PROYECTO
      : entidad === "quotes"
        ? ESTADOS_PRESUPUESTO
        : entidad === "invoices"
          ? ESTADOS_FACTURA
          : [];
  return lista.find((e) => e.value === valor)?.label ?? valor;
}

export function formatImporte(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

/** Acepta 1.234,56 / 1234,56 / 1234.56. Vacío = null. */
export function parseImporte(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.round(raw * 100) / 100;
  }
  const s = String(raw).trim().replace(/\s/g, "").replace("€", "");
  if (!s) return null;
  const usaComaDecimal = s.includes(",") && s.lastIndexOf(",") > s.lastIndexOf(".");
  const normalizado = usaComaDecimal
    ? s.replace(/\./g, "").replace(",", ".")
    : s.replace(",", ".");
  const n = Number(normalizado);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

export function siguienteNumero(
  prefijo: "PRE" | "FAC",
  filas: { number?: string | null }[]
): string {
  const year = new Date().getFullYear();
  const re = new RegExp(`^${prefijo}-${year}-(\\d+)$`);
  let max = 0;
  for (const fila of filas) {
    const m = fila.number?.match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefijo}-${year}-${String(max + 1).padStart(3, "0")}`;
}

export function slugDeTitulo(titulo: string): string {
  const base = titulo
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "obra";
}

export function parseM2(raw: unknown): number | null {
  const n = parseImporte(raw);
  if (n === null || n <= 0) return null;
  return Math.round(n * 10) / 10;
}

export function normalizarProyecto(p: Project): Project {
  return {
    ...p,
    m2: typeof p.m2 === "number" && Number.isFinite(p.m2) ? p.m2 : null,
    amount: typeof p.amount === "number" && Number.isFinite(p.amount) ? p.amount : null,
    photos: Array.isArray(p.photos) ? p.photos : [],
    publicable: Boolean(p.publicable),
    slug: p.slug ?? null,
    public_title: p.public_title ?? null,
    public_excerpt: p.public_excerpt ?? null,
    public_body: p.public_body ?? null,
  };
}

export function fotoPortada(p: Project): string | null {
  const fotos = p.photos ?? [];
  return (
    fotos.find((f) => f.fase === "despues")?.src ??
    fotos.find((f) => f.fase === "durante")?.src ??
    fotos[0]?.src ??
    null
  );
}

export function proyectosPublicables(list: Project[]): Project[] {
  return list
    .map(normalizarProyecto)
    .filter((p) => p.publicable && Boolean(p.slug));
}

export function slugUnico(
  titulo: string,
  existentes: { id: string; slug?: string | null }[],
  exceptId?: string
): string {
  const root = slugDeTitulo(titulo);
  let slug = root;
  let n = 2;
  while (existentes.some((p) => p.id !== exceptId && p.slug === slug)) {
    slug = `${root}-${n}`;
    n += 1;
  }
  return slug;
}

export function nombreCliente(c: Client): string {
  if (c.contact_type === "professional" && c.company) {
    return `${c.company} · ${c.name}`;
  }
  return c.name;
}
