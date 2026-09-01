import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { localDbActivo } from "@/lib/db/local";
import { esEmailAdmin } from "@/lib/site";

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
 * Gate de las APIs /api/admin/*.
 * Devuelve una Response si hay que cortar; null si puede seguir.
 */
export async function exigirAdmin(): Promise<NextResponse | null> {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !esEmailAdmin(user.email)) {
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
