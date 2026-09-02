import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { localDbActivo } from "@/lib/db/local";
import { esEmailAdmin } from "@/lib/site";
import type { Rol } from "@/lib/agenda";

export type Staff = {
  id: string;
  email: string | null;
  nombre: string;
  rol: Rol;
  es_tecnico: boolean;
};

/**
 * Quién está logueado y con qué rol.
 *
 * - Sin Supabase (dev local): se trata como admin, igual que el resto del panel.
 * - Con perfil en `profiles`: manda el rol de ahí (y respeta `activo`).
 * - Sin perfil pero email en ADMIN_EMAILS: admin de arranque (el socio antes
 *   de que exista su fila) para no quedarse fuera.
 * - Autenticado sin perfil y sin ser admin de arranque: sin acceso.
 */
export async function getStaffActual(): Promise<Staff | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    if (localDbActivo()) {
      return { id: "local-admin", email: null, nombre: "Local", rol: "admin", es_tecnico: true };
    }
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = getSupabaseAdmin();
  if (admin) {
    const { data } = await admin
      .from("profiles")
      .select("nombre, rol, es_tecnico, activo")
      .eq("id", user.id)
      .maybeSingle();
    const perfil = data as
      | { nombre: string; rol: Rol; es_tecnico: boolean; activo: boolean }
      | null;
    if (perfil) {
      if (!perfil.activo) return null;
      return {
        id: user.id,
        email: user.email ?? null,
        nombre: perfil.nombre,
        rol: perfil.rol,
        es_tecnico: perfil.rol === "tecnico" || Boolean(perfil.es_tecnico),
      };
    }
  }

  if (esEmailAdmin(user.email)) {
    return {
      id: user.id,
      email: user.email ?? null,
      nombre: user.email?.split("@")[0] ?? "Admin",
      rol: "admin",
      es_tecnico: false,
    };
  }

  return null;
}
