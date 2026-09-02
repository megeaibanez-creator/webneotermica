import { NextResponse } from "next/server";
import { exigirStaff } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { actualizarLocal, leerLocal, localDbActivo } from "@/lib/db/local";
import {
  type Actuacion,
  type ActuacionCompleta,
  ESTADOS_ACTUACION,
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

/**
 * Agenda del técnico: solo las actuaciones donde figura como responsable.
 * El filtrado se hace por código con el id del usuario logueado; RLS es la
 * segunda barrera si alguien tira contra la API REST con su token.
 */
export async function GET() {
  const staff = await exigirStaff();
  if (staff instanceof NextResponse) return staff;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: asign, error: e0 } = await supabase
      .from("actuacion_responsables")
      .select("actuacion_id")
      .eq("profile_id", staff.id);
    if (e0) return NextResponse.json({ error: e0.message }, { status: 500 });
    const ids = (asign ?? []).map((r) => (r as { actuacion_id: string }).actuacion_id);
    if (ids.length === 0) return NextResponse.json({ actuaciones: [] });

    const { data: act, error } = await supabase
      .from("actuaciones")
      .select("*")
      .in("id", ids)
      .order("starts_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const actuaciones = (act ?? []) as Actuacion[];
    const projIds = [...new Set(actuaciones.map((a) => a.project_id))];
    const { data: proj } = await supabase
      .from("projects")
      .select("id, title, service, municipio, client_id")
      .in("id", projIds);
    const proyectos = (proj ?? []) as ProjectMin[];
    const cliIds = [...new Set(proyectos.map((p) => p.client_id))];
    const { data: cli } = await supabase
      .from("clients")
      .select("id, name, phone, municipio")
      .in("id", cliIds);
    const clientes = (cli ?? []) as ClientMin[];

    return NextResponse.json({ actuaciones: ensamblar(actuaciones, proyectos, clientes) });
  }

  if (!localDbActivo()) return NextResponse.json({ actuaciones: [] });
  // Dev local: sin Auth real, el "técnico" es el admin local → ve todas.
  const actuaciones = leerLocal<Actuacion>("actuaciones");
  const proyectos = leerLocal<ProjectMin & { created_at: string }>("projects");
  const clientes = leerLocal<ClientMin & { created_at: string }>("clients");
  return NextResponse.json({ actuaciones: ensamblar(actuaciones, proyectos, clientes) });
}

function ensamblar(
  actuaciones: Actuacion[],
  proyectos: ProjectMin[],
  clientes: ClientMin[]
): ActuacionCompleta[] {
  return actuaciones
    .filter((a) => a.project_id !== "__borrado__")
    .map((a) => {
      const proyecto = proyectos.find((p) => p.id === a.project_id) ?? null;
      const cliente = proyecto ? clientes.find((c) => c.id === proyecto.client_id) ?? null : null;
      return {
        ...a,
        responsables: [],
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
}

/** El técnico solo puede tocar estado y nota de SUS actuaciones. */
export async function PATCH(request: Request) {
  const staff = await exigirStaff();
  if (staff instanceof NextResponse) return staff;

  const body = (await request.json()) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const estado =
    typeof body.estado === "string" && ESTADOS_ACTUACION.some((e) => e.value === body.estado)
      ? body.estado
      : null;
  const nota = typeof body.notas === "string" ? body.notas.trim() || null : undefined;

  const cambios: Record<string, unknown> = {};
  if (estado) cambios.estado = estado;
  if (nota !== undefined) cambios.notas = nota;
  if (Object.keys(cambios).length === 0) return NextResponse.json({ ok: true });

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error: e0 } = await supabase
      .from("actuacion_responsables")
      .select("actuacion_id")
      .eq("profile_id", staff.id)
      .eq("actuacion_id", id)
      .maybeSingle();
    if (e0) return NextResponse.json({ error: e0.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Esa actuación no es tuya." }, { status: 403 });

    const { error } = await supabase.from("actuaciones").update(cambios).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (!localDbActivo()) return NextResponse.json({ error: "Sin almacén" }, { status: 503 });
  actualizarLocal("actuaciones", id, cambios);
  return NextResponse.json({ ok: true });
}
