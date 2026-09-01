import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con service role. SOLO en servidor (route handlers, server actions, scripts).
 * Nunca importar esto desde un componente de cliente.
 * Devuelve null si el proyecto Supabase todavía no está configurado.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
