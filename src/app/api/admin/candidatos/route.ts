import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { actualizarLocal, leerLocal, localDbActivo } from "@/lib/db/local";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  if (!localDbActivo()) return NextResponse.json([], { status: 200 });
  return NextResponse.json(leerLocal("job_applications"));
}

export async function PATCH(request: Request) {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const body = (await request.json()) as {
    id?: string;
    is_read?: boolean;
    status?: string;
  };
  if (!body.id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const cambios: Record<string, unknown> = {};
  if (typeof body.is_read === "boolean") cambios.is_read = body.is_read;
  if (body.status) cambios.status = body.status;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("job_applications").update(cambios).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (!localDbActivo()) return NextResponse.json({ error: "Sin almacén" }, { status: 503 });
  actualizarLocal("job_applications", body.id, cambios);
  return NextResponse.json({ ok: true });
}
