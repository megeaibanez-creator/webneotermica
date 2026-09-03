import { createBrowserClient } from "@supabase/ssr";

/** Cookie propia: Recuérdame (30 días) vs sesión del navegador. */
export const K_ADMIN_REMEMBER = "neotermica_admin_remember";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function cookieOptionsAuth(persist: boolean) {
  return {
    path: "/",
    sameSite: "lax" as const,
    ...(persist ? { maxAge: ADMIN_SESSION_MAX_AGE } : {}),
  };
}

/**
 * Cliente Supabase para componentes de cliente.
 * Devuelve null si el proyecto Supabase aún no está configurado (no rompe el build).
 *
 * persistSession va siempre a true: si no, @supabase/ssr no escribe cookies y
 * Recuérdame no sirve. Lo que cambia es el maxAge (30 días vs cookie de sesión).
 */
export function getSupabaseBrowserClient(opts?: { persistSession?: boolean }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const persist = opts?.persistSession ?? true;
  return createBrowserClient(url, anonKey, {
    cookieOptions: cookieOptionsAuth(persist),
    auth: { persistSession: true, autoRefreshToken: true },
  });
}
