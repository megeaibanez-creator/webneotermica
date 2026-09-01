import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import {
  type Client,
  type EntidadCrm,
  type Invoice,
  type Project,
  type Quote,
  type SnapshotCrm,
  normalizarProyecto,
  parseImporte,
  parseM2,
  slugUnico,
  siguienteNumero,
  type FotoFase,
  type ProjectPhoto,
} from "@/lib/crm";
import { actualizarLocal, insertarLocal, leerLocal, localDbActivo, type Tabla } from "@/lib/db/local";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENTIDADES: EntidadCrm[] = ["clients", "projects", "quotes", "invoices"];

function esEntidad(v: unknown): v is EntidadCrm {
  return typeof v === "string" && (ENTIDADES as string[]).includes(v);
}

const FASES: FotoFase[] = ["antes", "durante", "despues", "otro"];

function fotosDe(v: unknown): ProjectPhoto[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const src = texto((item as { src?: unknown }).src);
    const fase = (item as { fase?: unknown }).fase;
    if (!src || !src.startsWith("/uploads/proyectos/")) return [];
    if (typeof fase !== "string" || !FASES.includes(fase as FotoFase)) return [];
    return [{ src, fase: fase as FotoFase }];
  });
}

function boolDe(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

function texto(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function snapshotLocal(): SnapshotCrm {
  return {
    clients: leerLocal<Client>("clients"),
    projects: leerLocal<Project>("projects").map(normalizarProyecto),
    quotes: leerLocal<Quote>("quotes"),
    invoices: leerLocal<Invoice>("invoices"),
  };
}

async function snapshotSupabase(): Promise<SnapshotCrm | NextResponse> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("sin supabase");
  const [clients, projects, quotes, invoices] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("quotes").select("*").order("created_at", { ascending: false }),
    supabase.from("invoices").select("*").order("created_at", { ascending: false }),
  ]);
  const error = clients.error ?? projects.error ?? quotes.error ?? invoices.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return {
    clients: (clients.data ?? []) as Client[],
    projects: ((projects.data ?? []) as Project[]).map(normalizarProyecto),
    quotes: (quotes.data ?? []) as Quote[],
    invoices: (invoices.data ?? []) as Invoice[],
  };
}

async function leerSnapshot(): Promise<SnapshotCrm | NextResponse> {
  if (getSupabaseAdmin()) return snapshotSupabase();
  if (!localDbActivo()) {
    return NextResponse.json({ error: "Sin almacén" }, { status: 503 });
  }
  return snapshotLocal();
}

function proyectoDelCliente(
  snap: SnapshotCrm,
  clientId: string,
  projectId: string | null
): string | NextResponse {
  if (!projectId) return "";
  const p = snap.projects.find((x) => x.id === projectId);
  if (!p) return NextResponse.json({ error: "Esa obra no existe." }, { status: 400 });
  if (p.client_id !== clientId) {
    return NextResponse.json(
      { error: "La obra no es de ese cliente." },
      { status: 400 }
    );
  }
  return "";
}

export async function GET() {
  const corte = await exigirAdmin();
  if (corte) return corte;
  const snap = await leerSnapshot();
  if (snap instanceof NextResponse) return snap;
  return NextResponse.json(snap);
}

export async function POST(request: Request) {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const body = (await request.json()) as Record<string, unknown>;
  if (!esEntidad(body.entidad)) {
    return NextResponse.json({ error: "Falta la entidad." }, { status: 400 });
  }

  const snap = await leerSnapshot();
  if (snap instanceof NextResponse) return snap;

  if (body.entidad === "clients" && typeof body.from_lead_id === "string") {
    return convertirLead(body.from_lead_id, snap);
  }

  const supabase = getSupabaseAdmin();
  const usarLocal = !supabase && localDbActivo();
  if (!supabase && !usarLocal) {
    return NextResponse.json({ error: "Sin almacén" }, { status: 503 });
  }

  let fila: Record<string, unknown>;
  try {
    fila = armarAlta(body.entidad, body, snap);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Datos no válidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (supabase) {
    const { data, error } = await supabase
      .from(body.entidad)
      .insert(fila)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, fila: data });
  }

  const creada = insertarLocal(body.entidad as Tabla, fila);
  return NextResponse.json({ ok: true, fila: creada });
}

export async function PATCH(request: Request) {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const body = (await request.json()) as Record<string, unknown>;
  if (!esEntidad(body.entidad) || typeof body.id !== "string") {
    return NextResponse.json({ error: "Falta entidad o id." }, { status: 400 });
  }

  const snap = await leerSnapshot();
  if (snap instanceof NextResponse) return snap;

  let cambios: Record<string, unknown>;
  try {
    cambios = armarCambios(body.entidad, body, snap);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Datos no válidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from(body.entidad).update(cambios).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (!localDbActivo()) {
    return NextResponse.json({ error: "Sin almacén" }, { status: 503 });
  }
  actualizarLocal(body.entidad as Tabla, body.id, cambios);
  return NextResponse.json({ ok: true });
}

async function convertirLead(leadId: string, snap: SnapshotCrm) {
  const ya = snap.clients.find((c) => c.lead_id === leadId);
  if (ya) return NextResponse.json({ ok: true, fila: ya, already: true });

  const supabase = getSupabaseAdmin();
  type Lead = {
    id: string;
    created_at: string;
    name: string;
    email: string;
    phone: string | null;
    contact_type: string | null;
    company: string | null;
    municipio: string | null;
    client_id?: string | null;
  };

  let lead: Lead | null = null;
  if (supabase) {
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("id, name, email, phone, contact_type, company, municipio, client_id")
      .eq("id", leadId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    lead = data as Lead | null;
  } else if (localDbActivo()) {
    lead = leerLocal<Lead>("contact_submissions").find((l) => l.id === leadId) ?? null;
  } else {
    return NextResponse.json({ error: "Sin almacén" }, { status: 503 });
  }

  if (!lead) return NextResponse.json({ error: "Ese contacto no existe." }, { status: 404 });
  if (lead.client_id) {
    const existente = snap.clients.find((c) => c.id === lead.client_id);
    if (existente) return NextResponse.json({ ok: true, fila: existente, already: true });
  }

  const fila = {
    name: lead.name,
    email: lead.email || null,
    phone: lead.phone,
    contact_type: lead.contact_type === "professional" ? "professional" : "particular",
    company: lead.company,
    municipio: lead.municipio,
    notes: null as string | null,
    lead_id: lead.id,
  };

  if (supabase) {
    const { data, error } = await supabase.from("clients").insert(fila).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabase
      .from("contact_submissions")
      .update({ client_id: data.id, status: "replied", is_read: true })
      .eq("id", lead.id);
    return NextResponse.json({ ok: true, fila: data, already: false });
  }

  const creada = insertarLocal("clients", fila);
  actualizarLocal("contact_submissions", lead.id, {
    client_id: creada.id,
    status: "replied",
    is_read: true,
  });
  return NextResponse.json({ ok: true, fila: creada, already: false });
}

function armarAlta(
  entidad: EntidadCrm,
  body: Record<string, unknown>,
  snap: SnapshotCrm
): Record<string, unknown> {
  if (entidad === "clients") {
    const name = texto(body.name);
    if (!name) throw new Error("El cliente necesita un nombre.");
    const contact_type = body.contact_type === "professional" ? "professional" : "particular";
    const company = texto(body.company);
    if (contact_type === "professional" && !company) {
      throw new Error("La empresa necesita razón social.");
    }
    return {
      name,
      email: texto(body.email),
      phone: texto(body.phone),
      contact_type,
      company,
      municipio: texto(body.municipio),
      notes: texto(body.notes),
      lead_id: null,
    };
  }

  const client_id = texto(body.client_id);
  if (!client_id || !snap.clients.some((c) => c.id === client_id)) {
    throw new Error("Hay que elegir un cliente.");
  }
  const project_id = texto(body.project_id);
  const check = proyectoDelCliente(snap, client_id, project_id);
  if (check instanceof NextResponse) throw new Error("La obra no es de ese cliente.");

  if (entidad === "projects") {
    const title = texto(body.title);
    if (!title) throw new Error("La obra necesita un título.");
    const status = ["previsto", "en_obra", "entregado", "cancelado"].includes(String(body.status))
      ? body.status
      : "previsto";
    return {
      client_id,
      title,
      service: texto(body.service),
      municipio: texto(body.municipio),
      status,
      notes: texto(body.notes),
      m2: parseM2(body.m2),
      amount: parseImporte(body.amount),
      photos: fotosDe(body.photos) ?? [],
      publicable: false,
      slug: null,
      public_title: null,
      public_excerpt: null,
      public_body: null,
    };
  }

  if (entidad === "quotes") {
    const title = texto(body.title);
    if (!title) throw new Error("El presupuesto necesita un título.");
    const status = ["borrador", "enviado", "aceptado", "rechazado"].includes(String(body.status))
      ? body.status
      : "borrador";
    return {
      client_id,
      project_id,
      number: siguienteNumero("PRE", snap.quotes),
      title,
      amount: parseImporte(body.amount),
      status,
      notes: texto(body.notes),
    };
  }

  const quote_id = texto(body.quote_id);
  if (quote_id) {
    const q = snap.quotes.find((x) => x.id === quote_id);
    if (!q) throw new Error("Ese presupuesto no existe.");
    if (q.client_id !== client_id) throw new Error("El presupuesto no es de ese cliente.");
  }

  const status = ["borrador", "emitida", "cobrada", "anulada"].includes(String(body.status))
    ? body.status
    : "borrador";
  const amount = parseImporte(body.amount) ?? 0;
  return {
    client_id,
    project_id,
    quote_id,
    number: siguienteNumero("FAC", snap.invoices),
    title: texto(body.title),
    amount,
    status,
    notes: texto(body.notes),
  };
}

function armarCambios(
  entidad: EntidadCrm,
  body: Record<string, unknown>,
  snap: SnapshotCrm
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (entidad === "clients") {
    if ("name" in body) {
      const name = texto(body.name);
      if (!name) throw new Error("El cliente necesita un nombre.");
      out.name = name;
    }
    if ("email" in body) out.email = texto(body.email);
    if ("phone" in body) out.phone = texto(body.phone);
    if ("contact_type" in body) {
      out.contact_type = body.contact_type === "professional" ? "professional" : "particular";
    }
    if ("company" in body) out.company = texto(body.company);
    if ("municipio" in body) out.municipio = texto(body.municipio);
    if ("notes" in body) out.notes = texto(body.notes);
    return out;
  }

  if ("client_id" in body) {
    const client_id = texto(body.client_id);
    if (!client_id || !snap.clients.some((c) => c.id === client_id)) {
      throw new Error("Hay que elegir un cliente.");
    }
    out.client_id = client_id;
  }

  const clientIdParaCheck =
    (typeof out.client_id === "string" ? out.client_id : null) ??
    (entidad === "projects"
      ? snap.projects.find((p) => p.id === body.id)?.client_id
      : entidad === "quotes"
        ? snap.quotes.find((q) => q.id === body.id)?.client_id
        : snap.invoices.find((i) => i.id === body.id)?.client_id) ??
    null;

  if ("project_id" in body) {
    const project_id = texto(body.project_id);
    if (clientIdParaCheck) {
      const check = proyectoDelCliente(snap, clientIdParaCheck, project_id);
      if (check instanceof NextResponse) throw new Error("La obra no es de ese cliente.");
    }
    out.project_id = project_id;
  }

  if (entidad === "projects") {
    if ("title" in body) {
      const title = texto(body.title);
      if (!title) throw new Error("La obra necesita un título.");
      out.title = title;
    }
    if ("service" in body) out.service = texto(body.service);
    if ("municipio" in body) out.municipio = texto(body.municipio);
    if ("notes" in body) out.notes = texto(body.notes);
    if ("status" in body && ["previsto", "en_obra", "entregado", "cancelado"].includes(String(body.status))) {
      out.status = body.status;
    }
    if ("m2" in body) out.m2 = parseM2(body.m2);
    if ("amount" in body) out.amount = parseImporte(body.amount);
    if ("photos" in body) out.photos = fotosDe(body.photos) ?? [];
    if ("public_title" in body) out.public_title = texto(body.public_title);
    if ("public_excerpt" in body) out.public_excerpt = texto(body.public_excerpt);
    if ("public_body" in body) out.public_body = texto(body.public_body);
    if ("publicable" in body || "slug" in body) {
      const actual = snap.projects.find((p) => p.id === body.id);
      const publicable = "publicable" in body ? boolDe(body.publicable) : Boolean(actual?.publicable);
      out.publicable = publicable;
      if (publicable) {
        const base =
          texto(body.slug) ??
          texto(body.public_title) ??
          actual?.public_title ??
          texto(body.title) ??
          actual?.title ??
          "obra";
        out.slug = slugUnico(base, snap.projects, typeof body.id === "string" ? body.id : undefined);
      } else if ("slug" in body) {
        out.slug = texto(body.slug);
      }
    }
    return out;
  }

  if (entidad === "quotes") {
    if ("title" in body) {
      const title = texto(body.title);
      if (!title) throw new Error("El presupuesto necesita un título.");
      out.title = title;
    }
    if ("amount" in body) out.amount = parseImporte(body.amount);
    if ("notes" in body) out.notes = texto(body.notes);
    if ("status" in body && ["borrador", "enviado", "aceptado", "rechazado"].includes(String(body.status))) {
      out.status = body.status;
    }
    return out;
  }

  if ("quote_id" in body) {
    const quote_id = texto(body.quote_id);
    if (quote_id && clientIdParaCheck) {
      const q = snap.quotes.find((x) => x.id === quote_id);
      if (!q || q.client_id !== clientIdParaCheck) {
        throw new Error("El presupuesto no es de ese cliente.");
      }
    }
    out.quote_id = quote_id;
  }
  if ("title" in body) out.title = texto(body.title);
  if ("amount" in body) out.amount = parseImporte(body.amount) ?? 0;
  if ("notes" in body) out.notes = texto(body.notes);
  if ("status" in body && ["borrador", "emitida", "cobrada", "anulada"].includes(String(body.status))) {
    out.status = body.status;
  }
  return out;
}
