import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { localDbActivo } from "@/lib/db/local";
import { getStaffActual, type Staff } from "@/lib/staff";

export function supabasePublicoConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Dev: sin proyecto Supabase se lee/escribe .data/*.jsonl. Producción: no. */
export function adminLocalPermitido(): boolean {
  return localDbActivo();
}

/**
 * Gate de las APIs /api/admin/*. Solo rol admin.
 * Devuelve una Response si hay que cortar; null si puede seguir.
 */
export async function exigirAdmin(): Promise<NextResponse | null> {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const staff = await getStaffActual();
    if (!staff || staff.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return null;
  }
  if (adminLocalPermitido()) return null;
  return NextResponse.json(
    { error: "Admin pendiente: falta Auth / Supabase." },
    { status: 503 }
  );
}

/**
 * Gate de las APIs de staff (admin o técnico). Devuelve el Staff si puede
 * seguir, o una Response si hay que cortar.
 */
export async function exigirStaff(): Promise<Staff | NextResponse> {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const staff = await getStaffActual();
    if (!staff) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return staff;
  }
  if (adminLocalPermitido()) {
    return { id: "local-admin", email: null, nombre: "Local", rol: "admin", es_tecnico: true };
  }
  return NextResponse.json(
    { error: "Admin pendiente: falta Auth / Supabase." },
    { status: 503 }
  );
}
