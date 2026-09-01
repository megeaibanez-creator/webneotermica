/** Color vivo del termostato de la home. Por defecto: crimson de marca. */

export const CLIMA_KEY = "neo_clima_t2";

export const FRIO = [0, 102, 255] as const;
export const CONFORT = [154, 127, 174] as const;
export const CALOR = [203, 10, 61] as const;

export const TEMP_MIN = 16;
export const TEMP_MAX = 30;
/** 24–27 °C = Confort. 23° y menos = frío. 28° y más = calor. */
export const CONFORT_TEMP_MIN = 24;
export const CONFORT_TEMP_MAX = 27;

const SPAN = TEMP_MAX - TEMP_MIN;
/** t donde la cifra redondeada entra en confort / sale a calor. */
export const CONFORT_DESDE = (CONFORT_TEMP_MIN - 0.5 - TEMP_MIN) / SPAN;
export const CONFORT_HASTA = (CONFORT_TEMP_MAX + 0.5 - TEMP_MIN) / SPAN;

export function tempDeT(t: number): number {
  return Math.round(TEMP_MIN + Math.min(1, Math.max(0, t)) * SPAN);
}

function mix(a: readonly number[], b: readonly number[], t: number) {
  return [0, 1, 2].map((i) =>
    Math.round((a[i] ?? 0) + ((b[i] ?? 0) - (a[i] ?? 0)) * t)
  );
}

function rgbOf(t: number) {
  const x = Math.min(1, Math.max(0, t));
  if (x <= CONFORT_DESDE) return mix(FRIO, CONFORT, x / CONFORT_DESDE);
  if (x >= CONFORT_HASTA) {
    return mix(CONFORT, CALOR, (x - CONFORT_HASTA) / (1 - CONFORT_HASTA));
  }
  return [...CONFORT];
}

export function colorAt(t: number): string {
  const c = rgbOf(t);
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function modoClima(t: number): "frío" | "confort" | "calor" {
  const temp = tempDeT(t);
  if (temp < CONFORT_TEMP_MIN) return "frío";
  if (temp > CONFORT_TEMP_MAX) return "calor";
  return "confort";
}

function toward(c: number[], factor: number, target: number) {
  return c.map((n) => Math.round(n + (target - n) * factor));
}

/** Escribe --clima en :root. t = 0 frío … 1 calor. */
export function applyClima(t: number) {
  if (typeof document === "undefined") return;
  const clamped = Math.min(1, Math.max(0, t));
  const base = rgbOf(clamped);
  const lite = toward(base, 0.32, 255);
  const dark = toward(base, 0.22, 0);
  const root = document.documentElement;
  root.style.setProperty("--clima", `rgb(${base[0]},${base[1]},${base[2]})`);
  root.style.setProperty("--clima-lite", `rgb(${lite[0]},${lite[1]},${lite[2]})`);
  root.style.setProperty("--clima-dark", `rgb(${dark[0]},${dark[1]},${dark[2]})`);
  try {
    sessionStorage.setItem(CLIMA_KEY, String(clamped));
  } catch {
    // ignore
  }
}

/** Recupera el tono si el visitante ya giró la rueda. */
export function restoreClima(): number | null {
  try {
    const raw = sessionStorage.getItem(CLIMA_KEY);
    if (raw == null) return null;
    const t = Number(raw);
    if (!Number.isFinite(t)) return null;
    applyClima(t);
    return t;
  } catch {
    return null;
  }
}
