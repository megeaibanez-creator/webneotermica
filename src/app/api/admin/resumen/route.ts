import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { leerLocal, localDbActivo } from "@/lib/db/local";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadFila = {
  id: string;
  created_at: string;
  name: string;
  status: string;
  service_interest: string | null;
  municipio: string | null;
  is_read?: boolean;
};

type ObraFila = {
  id: string;
  created_at: string;
  title: string;
  status: string;
  service: string | null;
  municipio: string | null;
};

type PreguntaFila = {
  created_at: string;
  content: string;
  thread_id?: string;
};

type PostFila = {
  slug: string;
  title: string;
  date: string;
  status: string;
  cover: string | null;
  reescrito: boolean | null;
};

function hoyMadrid() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
}

function vacio() {
  return {
    leads: { total: 0, nuevos: 0 },
    clientes: { total: 0 },
    proyectos: { total: 0, en_obra: 0, previstos: 0 },
    presupuestos: { total: 0, enviados: 0, aceptados: 0 },
    facturas: { total: 0, emitidas: 0, cobradas: 0 },
    chat: { hilos: 0, preguntas: 0 },
    blog: { total: 0, visibles: 0, futuros: 0, sin_cover: 0, sin_texto: 0 },
    recientes: {
      leads: [] as LeadFila[],
      preguntas: [] as PreguntaFila[],
      obras: [] as ObraFila[],
      posts: [] as PostFila[],
    },
  };
}

export async function GET() {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const supabase = getSupabaseAdmin();
  const hoy = hoyMadrid();

  if (supabase) {
    const [
      leads,
      leadsNuevos,
      clients,
      projects,
      projectsObra,
      projectsPrevistos,
      quotes,
      quotesEnviados,
      quotesAceptados,
      invoices,
      invoicesEmitidas,
      invoicesCobradas,
      hilos,
      msgs,
      posts,
      leadsRec,
      obrasRec,
      pregRec,
      postsRec,
    ] = await Promise.all([
      supabase.from("contact_submissions").select("id", { count: "exact", head: true }),
      supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "en_obra"),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "previsto"),
      supabase.from("quotes").select("id", { count: "exact", head: true }),
      supabase.from("quotes").select("id", { count: "exact", head: true }).eq("status", "enviado"),
      supabase.from("quotes").select("id", { count: "exact", head: true }).eq("status", "aceptado"),
      supabase.from("invoices").select("id", { count: "exact", head: true }),
      supabase.from("invoices").select("id", { count: "exact", head: true }).eq("status", "emitida"),
      supabase.from("invoices").select("id", { count: "exact", head: true }).eq("status", "cobrada"),
      supabase.from("chat_threads").select("id", { count: "exact", head: true }),
      supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("role", "user"),
      supabase.from("blog_articles").select("date,status,cover,reescrito"),
      supabase
        .from("contact_submissions")
        .select("id,created_at,name,status,service_interest,municipio,is_read")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("projects")
        .select("id,created_at,title,status,service,municipio")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("chat_messages")
        .select("created_at,content,thread_id")
        .eq("role", "user")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("blog_articles")
        .select("slug,title,date,status,cover,reescrito")
        .order("date", { ascending: false })
        .limit(5),
    ]);

    const filasBlog = (posts.data ?? []) as {
      date: string;
      status: string;
      cover: string | null;
      reescrito: boolean | null;
    }[];
    const publicados = filasBlog.filter((p) => p.status === "published");

    return NextResponse.json({
      modo: "supabase",
      leads: { total: leads.count ?? 0, nuevos: leadsNuevos.count ?? 0 },
      clientes: { total: clients.count ?? 0 },
      proyectos: {
        total: projects.count ?? 0,
        en_obra: projectsObra.count ?? 0,
        previstos: projectsPrevistos.count ?? 0,
      },
      presupuestos: {
        total: quotes.count ?? 0,
        enviados: quotesEnviados.count ?? 0,
        aceptados: quotesAceptados.count ?? 0,
      },
      facturas: {
        total: invoices.count ?? 0,
        emitidas: invoicesEmitidas.count ?? 0,
        cobradas: invoicesCobradas.count ?? 0,
      },
      chat: { hilos: hilos.count ?? 0, preguntas: msgs.count ?? 0 },
      blog: {
        total: filasBlog.length,
        visibles: publicados.filter((p) => String(p.date).slice(0, 10) <= hoy).length,
        futuros: publicados.filter((p) => String(p.date).slice(0, 10) > hoy).length,
        sin_cover: publicados.filter((p) => !p.cover).length,
        sin_texto: publicados.filter((p) => !p.reescrito).length,
      },
      recientes: {
        leads: (leadsRec.data ?? []) as LeadFila[],
        preguntas: ((pregRec.data ?? []) as PreguntaFila[]).map((p) => ({
          created_at: p.created_at,
          content: String(p.content ?? "").slice(0, 160),
          thread_id: p.thread_id,
        })),
        obras: (obrasRec.data ?? []) as ObraFila[],
        posts: (postsRec.data ?? []) as PostFila[],
      },
    });
  }

  if (!localDbActivo()) {
    return NextResponse.json({ ...vacio(), modo: "pendiente" });
  }

  const leads = leerLocal<LeadFila>("contact_submissions");
  const obras = leerLocal<ObraFila>("projects");
  const quotes = leerLocal<{ status: string }>("quotes");
  const invoices = leerLocal<{ status: string }>("invoices");
  const hilos = leerLocal("chat_threads");
  const msgs = leerLocal<PreguntaFila & { role?: string }>("chat_messages");
  const posts = leerLocal<PostFila>("blog_articles");
  const publicados = posts.filter((p) => p.status === "published");
  const preguntas = msgs.filter((m) => m.role === "user");

  return NextResponse.json({
    modo: "local",
    leads: { total: leads.length, nuevos: leads.filter((l) => l.status === "new").length },
    clientes: { total: leerLocal("clients").length },
    proyectos: {
      total: obras.length,
      en_obra: obras.filter((o) => o.status === "en_obra").length,
      previstos: obras.filter((o) => o.status === "previsto").length,
    },
    presupuestos: {
      total: quotes.length,
      enviados: quotes.filter((q) => q.status === "enviado").length,
      aceptados: quotes.filter((q) => q.status === "aceptado").length,
    },
    facturas: {
      total: invoices.length,
      emitidas: invoices.filter((i) => i.status === "emitida").length,
      cobradas: invoices.filter((i) => i.status === "cobrada").length,
    },
    chat: { hilos: hilos.length, preguntas: preguntas.length },
    blog: {
      total: posts.length,
      visibles: publicados.filter((p) => String(p.date).slice(0, 10) <= hoy).length,
      futuros: publicados.filter((p) => String(p.date).slice(0, 10) > hoy).length,
      sin_cover: publicados.filter((p) => !p.cover).length,
      sin_texto: publicados.filter((p) => !p.reescrito).length,
    },
    recientes: {
      leads: [...leads].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6),
      preguntas: [...preguntas]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 6)
        .map((p) => ({ created_at: p.created_at, content: String(p.content ?? "").slice(0, 160) })),
      obras: [...obras].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
      posts: [...posts].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5),
    },
  });
}
