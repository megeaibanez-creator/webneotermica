import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para componentes de cliente.
 * Devuelve null si el proyecto Supabase aún no está configurado (no rompe el build).
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
