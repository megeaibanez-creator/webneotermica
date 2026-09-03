import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components / Route Handlers.
 * En Next 16, cookies() es asíncrono.
 * Devuelve null si Supabase aún no está configurado (no rompe el build).
 */
export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();
  const persist = cookieStore.get("neotermica_admin_remember")?.value !== "0";
  const cookieOptions = {
    path: "/",
    sameSite: "lax" as const,
    ...(persist ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  };

  return createServerClient(url, anonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, { ...options, ...cookieOptions });
          });
        } catch {
          // Llamado desde un Server Component: se puede ignorar si hay proxy refrescando sesión.
        }
      },
    },
  });
}
