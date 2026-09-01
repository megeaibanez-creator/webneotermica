import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para componentes de cliente.
 * Devuelve null si el proyecto Supabase aún no está configurado (no rompe el build).
 */
export function getSupabaseBrowserClient(opts?: { persistSession?: boolean }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const persist = opts?.persistSession ?? true;
  return createBrowserClient(url, anonKey, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      ...(persist ? { maxAge: 60 * 60 * 24 * 30 } : {}),
    },
    auth: { persistSession: persist },
  });
}
