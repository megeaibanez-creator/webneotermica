import fs from "node:fs";
import path from "node:path";

/**
 * Almacén local de DESARROLLO.
 *
 * Mientras no exista el proyecto Supabase, leads, chat y el taller (clientes,
 * obras, presupuestos, facturas) se guardan en `.data/<tabla>.jsonl` con las
 * mismas columnas que `supabase/migrations/0001_init.sql` + `0003_crm.sql`.
 * El día que se enchufe Supabase solo cambian las variables de entorno.
 *
 * No es una base de datos y no pretende serlo. No hay SQLite ni Prisma a
 * propósito: el brief los prohíbe y sería código para tirar.
 *
 * En PRODUCCIÓN esto nunca se activa. Sin Supabase, la API devuelve 503 y no
 * finge que el mensaje se ha guardado.
 */

const DIR = path.join(process.cwd(), ".data");

export type Tabla =
  | "contact_submissions"
  | "chat_threads"
  | "chat_messages"
  | "chat_reviews"
  | "clients"
  | "projects"
  | "quotes"
  | "invoices";

/** Solo en desarrollo y solo si Supabase no está configurado. */
export function localDbActivo(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !url || !key;
}

function ficheroDe(tabla: Tabla): string {
  return path.join(DIR, `${tabla}.jsonl`);
}

function asegurarDir(): void {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

/** Inserta una fila y devuelve la fila completa, con id y created_at. */
export function insertarLocal<T extends Record<string, unknown>>(
  tabla: Tabla,
  fila: T
): T & { id: string; created_at: string } {
  asegurarDir();
  const completa = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...fila,
  };
  fs.appendFileSync(ficheroDe(tabla), `${JSON.stringify(completa)}\n`, "utf8");
  return completa;
}

/** Lee la tabla entera, de más reciente a más antigua. */
export function leerLocal<T extends { created_at: string }>(tabla: Tabla): T[] {
  const fichero = ficheroDe(tabla);
  if (!fs.existsSync(fichero)) return [];
  return fs
    .readFileSync(fichero, "utf8")
    .split("\n")
    .filter((linea) => linea.trim() !== "")
    .flatMap((linea) => {
      try {
        return [JSON.parse(linea) as T];
      } catch {
        return []; // línea corrupta: se ignora en vez de tumbar el panel
      }
    })
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

/** Actualiza una fila por id. Reescribe el fichero entero: es dev, da igual. */
export function actualizarLocal(
  tabla: Tabla,
  id: string,
  cambios: Record<string, unknown>
): boolean {
  const fichero = ficheroDe(tabla);
  if (!fs.existsSync(fichero)) return false;

  let encontrada = false;
  const lineas = fs
    .readFileSync(fichero, "utf8")
    .split("\n")
    .filter((linea) => linea.trim() !== "")
    .map((linea) => {
      try {
        const fila = JSON.parse(linea) as Record<string, unknown>;
        if (fila.id !== id) return linea;
        encontrada = true;
        return JSON.stringify({ ...fila, ...cambios });
      } catch {
        return linea;
      }
    });

  if (encontrada) fs.writeFileSync(fichero, `${lineas.join("\n")}\n`, "utf8");
  return encontrada;
}

/** Mensajes de un hilo, en orden cronológico. */
export function mensajesDelHiloLocal<T extends { thread_id: string; created_at: string }>(
  threadId: string
): T[] {
  return leerLocal<T & { created_at: string }>("chat_messages")
    .filter((m) => m.thread_id === threadId)
    .reverse();
}
