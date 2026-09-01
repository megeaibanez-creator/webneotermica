import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { leerLocal, localDbActivo } from "@/lib/db/local";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const [leads, hilos, msgs] = await Promise.all([
      supabase.from("contact_submissions").select("id", { count: "exact", head: true }),
      supabase.from("chat_threads").select("id", { count: "exact", head: true }),
      supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("role", "user"),
    ]);
    const [clients, projects, quotes, invoices] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("quotes").select("id", { count: "exact", head: true }),
      supabase.from("invoices").select("id", { count: "exact", head: true }),
    ]);
    return NextResponse.json({
      leads: leads.count ?? 0,
      hilos: hilos.count ?? 0,
      preguntas: msgs.count ?? 0,
      clientes: clients.count ?? 0,
      proyectos: projects.count ?? 0,
      presupuestos: quotes.count ?? 0,
      facturas: invoices.count ?? 0,
      modo: "supabase",
    });
  }

  if (!localDbActivo()) {
    return NextResponse.json({
      leads: 0,
      hilos: 0,
      preguntas: 0,
      clientes: 0,
      proyectos: 0,
      presupuestos: 0,
      facturas: 0,
      modo: "pendiente",
    });
  }

  const leads = leerLocal<{ created_at: string }>("contact_submissions");
  const hilos = leerLocal<{ created_at: string }>("chat_threads");
  const preguntas = leerLocal<{ created_at: string; role?: string }>("chat_messages").filter(
    (m) => m.role === "user"
  );
  return NextResponse.json({
    leads: leads.length,
    hilos: hilos.length,
    preguntas: preguntas.length,
    clientes: leerLocal("clients").length,
    proyectos: leerLocal("projects").length,
    presupuestos: leerLocal("quotes").length,
    facturas: leerLocal("invoices").length,
    modo: "local",
  });
}
