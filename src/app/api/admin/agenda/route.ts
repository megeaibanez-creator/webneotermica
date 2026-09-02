import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  actualizarLocal,
  insertarLocal,
  leerLocal,
  localDbActivo,
} from "@/lib/db/local";
import {
  type Actuacion,
  type ActuacionCompleta,
  type ActuacionEstado,
  type ActuacionTipo,
  type Perfil,
  ESTADOS_ACTUACION,
  TIPOS_ACTUACION,
  haceDeTecnico,
} from "@/lib/agenda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientMin = { id: string; name: string; phone: string | null; municipio: string | null };
type ProjectMin = {
  id: string;
  title: string;
  service: string | null;
  municipio: string | null;
  client_id: string;
};

function texto(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function esTipo(v: unknown): v is ActuacionTipo {
  return typeof v === "string" && TIPOS_ACTUACION.some((t) => t.value === v);
}
function esEstado(v: unknown): v is ActuacionEstado {
  return typeof v === "string" && ESTADOS_ACTUACION.some((e) => e.value === v);
}

function fechaValida(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

function responsablesDe(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x): x is string => typeof x === "string" && x.length > 0))];
}

/** Campos de una actuación a partir del body. Lanza si algo obligatorio falla. */
function armarActuacion(
  body: Record<string, unknown>,
  proyectos: ProjectMin[]
): Omit<Actuacion, "id" | "created_at"> {
  const titulo = texto(body.titulo);
  if (!titulo) throw new Error("La actuación necesita un título.");
  const project_id = texto(body.project_id);
  if (!project_id || !proyectos.some((p) => p.id === project_id)) {
    throw new Error("Hay que elegir una obra.");
  }
  const starts_at = fechaValida(body.starts_at);
  if (!starts_at) throw new Error("Falta la fecha de inicio.");
  const ends_at = fechaValida(body.ends_at) ?? starts_at;
  if (new Date(ends_at) < new Date(starts_at)) {
    throw new Error("El fin no puede ser antes del inicio.");
  }
  return {
    project_id,
    titulo,
    tipo: esTipo(body.tipo) ? body.tipo : "instalacion",
    starts_at,
    ends_at,
    dia_completo: body.dia_completo === true || body.dia_completo === "true",
    lugar: texto(body.lugar),
    estado: esEstado(body.estado) ? body.estado : "pendiente",
    notas: texto(body.notas),
  };
}

// --------------------------------------------------------------------------

export async function GET() {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const [act, resp, proj, cli, perf] = await Promise.all([
      supabase.from("actuaciones").select("*").order("starts_at", { ascending: true }),
      supabase.from("actuacion_responsables").select("actuacion_id, profile_id"),
      supabase.from("projects").select("id, title, service, municipio, client_id"),
      supabase.from("clients").select("id, name, phone, municipio"),
      supabase
        .from("profiles")
        .select("id, nombre, rol, es_tecnico, color, telefono, activo")
        .order("nombre"),
    ]);
    const err = act.error ?? resp.error ?? proj.error ?? cli.error ?? perf.error;
    if (err) return NextResponse.json({ error: err.message }, { status: 500 });

    return NextResponse.json(
      ensamblar(
        (act.data ?? []) as Actuacion[],
        (resp.data ?? []) as { actuacion_id: string; profile_id: string }[],
        (proj.data ?? []) as ProjectMin[],
        (cli.data ?? []) as ClientMin[],
        (perf.data ?? []) as Perfil[]
      )
    );
  }

  if (!localDbActivo()) {
    return NextResponse.json({ error: "Sin almacén" }, { status: 503 });
  }
  return NextResponse.json(
    ensamblar(
      leerLocal<Actuacion>("actuaciones"),
      leerLocal<{ actuacion_id: string; profile_id: string; created_at: string }>(
        "actuacion_responsables"
      ),
      leerLocal<ProjectMin & { created_at: string }>("projects"),
      leerLocal<ClientMin & { created_at: string }>("clients"),
      leerLocal<Perfil & { created_at: string }>("profiles")
    )
  );
}

function ensamblar(
  actuaciones: Actuacion[],
  responsables: { actuacion_id: string; profile_id: string }[],
  proyectos: ProjectMin[],
  clientes: ClientMin[],
  perfiles: Perfil[]
) {
  const completas: ActuacionCompleta[] = actuaciones.map((a) => {
    const proyecto = proyectos.find((p) => p.id === a.project_id) ?? null;
    const cliente = proyecto
      ? clientes.find((c) => c.id === proyecto.client_id) ?? null
      : null;
    return {
      ...a,
      responsables: responsables.filter((r) => r.actuacion_id === a.id).map((r) => r.profile_id),
      proyecto: proyecto
        ? {
            id: proyecto.id,
            title: proyecto.title,
            service: proyecto.service,
            municipio: proyecto.municipio,
          }
        : null,
      cliente: cliente
        ? { id: cliente.id, name: cliente.name, phone: cliente.phone, municipio: cliente.municipio }
        : null,
    };
  });

  const proyectosSel = proyectos.map((p) => ({
    id: p.id,
    title: p.title,
    service: p.service,
    municipio: p.municipio,
    client_id: p.client_id,
    cliente_nombre: clientes.find((c) => c.id === p.client_id)?.name ?? "—",
  }));

  return {
    actuaciones: completas,
    perfiles: perfiles.filter((p) => p.activo && haceDeTecnico(p)),
    proyectos: proyectosSel,
  };
}

// --------------------------------------------------------------------------

export async function POST(request: Request) {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const body = (await request.json()) as Record<string, unknown>;
  const supabase = getSupabaseAdmin();
  const usarLocal = !supabase && localDbActivo();
  if (!supabase && !usarLocal) {
    return NextResponse.json({ error: "Sin almacén" }, { status: 503 });
  }

  const proyectos = supabase
    ? (((await supabase.from("projects").select("id, title, service, municipio, client_id")).data ??
        []) as ProjectMin[])
    : leerLocal<ProjectMin & { created_at: string }>("projects");

  let fila: Omit<Actuacion, "id" | "created_at">;
  try {
    fila = armarActuacion(body, proyectos);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  const responsables = responsablesDe(body.responsables);

  if (supabase) {
    const { data, error } = await supabase.from("actuaciones").insert(fila).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const id = (data as { id: string }).id;
    if (responsables.length > 0) {
      const { error: e2 } = await supabase
        .from("actuacion_responsables")
        .insert(responsables.map((profile_id) => ({ actuacion_id: id, profile_id })));
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id });
  }

  const creada = insertarLocal("actuaciones", fila as Record<string, unknown>);
  for (const profile_id of responsables) {
    insertarLocal("actuacion_responsables", { actuacion_id: creada.id, profile_id });
  }
  return NextResponse.json({ ok: true, id: creada.id });
}

// --------------------------------------------------------------------------

export async function PATCH(request: Request) {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const body = (await request.json()) as Record<string, unknown>;
  const id = texto(body.id);
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const usarLocal = !supabase && localDbActivo();
  if (!supabase && !usarLocal) {
    return NextResponse.json({ error: "Sin almacén" }, { status: 503 });
  }

  const cambios: Record<string, unknown> = {};
  if ("titulo" in body) {
    const t = texto(body.titulo);
    if (!t) return NextResponse.json({ error: "El título no puede quedar vacío." }, { status: 400 });
    cambios.titulo = t;
  }
  if ("tipo" in body && esTipo(body.tipo)) cambios.tipo = body.tipo;
  if ("estado" in body && esEstado(body.estado)) cambios.estado = body.estado;
  if ("lugar" in body) cambios.lugar = texto(body.lugar);
  if ("notas" in body) cambios.notas = texto(body.notas);
  if ("dia_completo" in body) cambios.dia_completo = body.dia_completo === true || body.dia_completo === "true";
  if ("starts_at" in body) {
    const s = fechaValida(body.starts_at);
    if (!s) return NextResponse.json({ error: "Fecha de inicio no válida." }, { status: 400 });
    cambios.starts_at = s;
  }
  if ("ends_at" in body) {
    const e = fechaValida(body.ends_at);
    if (!e) return NextResponse.json({ error: "Fecha de fin no válida." }, { status: 400 });
    cambios.ends_at = e;
  }
  if ("project_id" in body) {
    const pid = texto(body.project_id);
    if (pid) cambios.project_id = pid;
  }

  if (supabase) {
    if (Object.keys(cambios).length > 0) {
      const { error } = await supabase.from("actuaciones").update(cambios).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if ("responsables" in body) {
      const responsables = responsablesDe(body.responsables);
      await supabase.from("actuacion_responsables").delete().eq("actuacion_id", id);
      if (responsables.length > 0) {
        const { error } = await supabase
          .from("actuacion_responsables")
          .insert(responsables.map((profile_id) => ({ actuacion_id: id, profile_id })));
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (Object.keys(cambios).length > 0) actualizarLocal("actuaciones", id, cambios);
  if ("responsables" in body) {
    const responsables = responsablesDe(body.responsables);
    const todos = leerLocal<{
      actuacion_id: string;
      profile_id: string;
      id: string;
      created_at: string;
    }>("actuacion_responsables");
    for (const r of todos.filter((x) => x.actuacion_id === id)) {
      actualizarLocal("actuacion_responsables", r.id, { actuacion_id: "__borrado__" });
    }
    for (const profile_id of responsables) {
      insertarLocal("actuacion_responsables", { actuacion_id: id, profile_id });
    }
  }
  return NextResponse.json({ ok: true });
}

// --------------------------------------------------------------------------

export async function DELETE(request: Request) {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("actuaciones").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (!localDbActivo()) return NextResponse.json({ error: "Sin almacén" }, { status: 503 });
  actualizarLocal("actuaciones", id, { estado: "cancelada", project_id: "__borrado__" });
  return NextResponse.json({ ok: true });
}
