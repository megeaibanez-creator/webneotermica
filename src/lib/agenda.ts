/**
 * Agenda de trabajo: staff (profiles) + actuaciones.
 *
 * Un proyecto se parte en actuaciones (fases). Cada actuación tiene fecha,
 * lugar y responsables. De ahí sale el calendario. Módulo sin `node:*`:
 * lo importan cliente y servidor.
 */

export type Rol = "admin" | "tecnico";

export type Perfil = {
  id: string;
  created_at?: string;
  nombre: string;
  rol: Rol;
  es_tecnico?: boolean;
  color: string;
  telefono: string | null;
  activo: boolean;
  email?: string | null;
};

/** ¿Este perfil trabaja en campo? (técnico puro o admin que además es técnico). */
export function haceDeTecnico(p: { rol: Rol; es_tecnico?: boolean }): boolean {
  return p.rol === "tecnico" || Boolean(p.es_tecnico);
}

export type ActuacionTipo =
  | "visita"
  | "preinstalacion"
  | "instalacion"
  | "mantenimiento"
  | "reparacion"
  | "otro";

export type ActuacionEstado = "pendiente" | "en_curso" | "hecha" | "cancelada";

export type Actuacion = {
  id: string;
  created_at: string;
  project_id: string;
  titulo: string;
  tipo: ActuacionTipo;
  starts_at: string;
  ends_at: string;
  dia_completo: boolean;
  lugar: string | null;
  estado: ActuacionEstado;
  notas: string | null;
};

/** Actuación con lo mínimo del cliente/obra y los responsables ya resueltos. */
export type ActuacionCompleta = Actuacion & {
  responsables: string[];
  proyecto: { id: string; title: string; service: string | null; municipio: string | null } | null;
  cliente: { id: string; name: string; phone: string | null; municipio: string | null } | null;
};

export const TIPOS_ACTUACION: { value: ActuacionTipo; label: string }[] = [
  { value: "visita", label: "Visita / medición" },
  { value: "preinstalacion", label: "Preinstalación" },
  { value: "instalacion", label: "Instalación" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "reparacion", label: "Reparación" },
  { value: "otro", label: "Otro" },
];

export const ESTADOS_ACTUACION: { value: ActuacionEstado; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_curso", label: "En curso" },
  { value: "hecha", label: "Hecha" },
  { value: "cancelada", label: "Cancelada" },
];

/** Paleta para técnicos nuevos (se rota por orden de alta). */
export const COLORES_TECNICO = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#ca8a04",
  "#dc2626",
] as const;

export function etiquetaTipo(v: string): string {
  return TIPOS_ACTUACION.find((t) => t.value === v)?.label ?? v;
}

export function etiquetaEstadoActuacion(v: string): string {
  return ESTADOS_ACTUACION.find((e) => e.value === v)?.label ?? v;
}

export function tonoEstadoActuacion(
  v: string
): "ok" | "warn" | "bad" | "info" | "muted" {
  if (v === "hecha") return "ok";
  if (v === "en_curso") return "info";
  if (v === "cancelada") return "bad";
  return "warn";
}

const TZ = "Europe/Madrid";

/** Clave de día YYYY-MM-DD en hora de Madrid (para agrupar en el calendario). */
export function claveDia(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function fmtHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function fmtDiaLargo(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });
}

/** Texto de cuándo pasa la actuación: "10:00–12:00" o "Lun 4 – Mié 6 · todo el día". */
export function rangoActuacion(a: Pick<Actuacion, "starts_at" | "ends_at" | "dia_completo">): string {
  const ini = new Date(a.starts_at);
  const fin = new Date(a.ends_at);
  const mismoDia = claveDia(ini) === claveDia(fin);
  if (a.dia_completo) {
    if (mismoDia) return "Todo el día";
    const f = (d: Date) =>
      d.toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: TZ });
    return `${f(ini)} – ${f(fin)}`;
  }
  if (mismoDia) return `${fmtHora(a.starts_at)}–${fmtHora(a.ends_at)}`;
  const f = (d: Date) =>
    d.toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: TZ });
  return `${f(ini)} ${fmtHora(a.starts_at)} – ${f(fin)} ${fmtHora(a.ends_at)}`;
}

/** Convierte un <input type="datetime-local"> (hora local del navegador) a ISO. */
export function localAIso(valor: string): string {
  return new Date(valor).toISOString();
}

/** ISO → valor para <input type="datetime-local"> en hora de Madrid. */
export function isoALocal(iso: string): string {
  const d = new Date(iso);
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  // sv-SE da "2026-09-04 10:30" -> el input quiere "2026-09-04T10:30"
  return partes.replace(" ", "T");
}

/** Todas las claves de día que toca una actuación (para pintarla en varios días). */
export function diasQueOcupa(a: Pick<Actuacion, "starts_at" | "ends_at">): string[] {
  const dias: string[] = [];
  const cursor = new Date(claveDia(a.starts_at) + "T12:00:00");
  const finClave = claveDia(a.ends_at);
  // Tope de seguridad: 60 días.
  for (let i = 0; i < 60; i++) {
    const clave = claveDia(cursor);
    dias.push(clave);
    if (clave >= finClave) break;
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}
