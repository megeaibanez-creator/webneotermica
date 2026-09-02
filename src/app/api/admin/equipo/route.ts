import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { actualizarLocal, insertarLocal, leerLocal, localDbActivo } from "@/lib/db/local";
import { COLORES_TECNICO, type Perfil, type Rol } from "@/lib/agenda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function texto(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}
function esRol(v: unknown): v is Rol {
  return v === "admin" || v === "tecnico";
}

function colorLibre(existentes: Perfil[]): string {
  const usados = new Set(existentes.map((p) => p.color));
  return COLORES_TECNICO.find((c) => !usados.has(c)) ?? COLORES_TECNICO[0];
}

export async function GET() {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, created_at, nombre, rol, es_tecnico, color, telefono, activo")
      .order("rol", { ascending: true })
      .order("nombre", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ perfiles: (data ?? []) as Perfil[] });
  }
  if (!localDbActivo()) return NextResponse.json({ perfiles: [] });
  return NextResponse.json({ perfiles: leerLocal<Perfil & { created_at: string }>("profiles") });
}

/** Alta de un usuario del staff: crea el login en Supabase Auth + su perfil. */
export async function POST(request: Request) {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const body = (await request.json()) as Record<string, unknown>;
  const nombre = texto(body.nombre);
  const email = texto(body.email)?.toLowerCase() ?? null;
  const password = texto(body.password);
  const rol: Rol = esRol(body.rol) ? body.rol : "tecnico";
  // Un técnico siempre hace de técnico; un admin, solo si se marca.
  const es_tecnico = rol === "tecnico" ? true : body.es_tecnico === true || body.es_tecnico === "true";
  const telefono = texto(body.telefono);
  if (!nombre) return NextResponse.json({ error: "Falta el nombre." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (supabase) {
    if (!email || !password) {
      return NextResponse.json(
        { error: "Para crear el acceso hacen falta email y contraseña." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener 8+ caracteres." }, { status: 400 });
    }

    const { data: existentes } = await supabase.from("profiles").select("color");
    const color = texto(body.color) ?? colorLibre((existentes ?? []) as Perfil[]);

    const { data: creado, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: nombre },
    });
    if (error || !creado?.user) {
      const msg = error?.message?.includes("already")
        ? "Ya existe un usuario con ese email."
        : error?.message ?? "No se pudo crear el usuario.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { error: e2 } = await supabase.from("profiles").insert({
      id: creado.user.id,
      nombre,
      rol,
      es_tecnico,
      color,
      telefono,
      activo: true,
    });
    if (e2) {
      await supabase.auth.admin.deleteUser(creado.user.id);
      return NextResponse.json({ error: e2.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: creado.user.id });
  }

  if (!localDbActivo()) return NextResponse.json({ error: "Sin almacén" }, { status: 503 });
  const color = texto(body.color) ?? colorLibre(leerLocal<Perfil & { created_at: string }>("profiles"));
  const creada = insertarLocal("profiles", { nombre, rol, es_tecnico, color, telefono, activo: true });
  return NextResponse.json({ ok: true, id: creada.id });
}

export async function PATCH(request: Request) {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const body = (await request.json()) as Record<string, unknown>;
  const id = texto(body.id);
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const cambios: Record<string, unknown> = {};
  if ("nombre" in body) {
    const n = texto(body.nombre);
    if (!n) return NextResponse.json({ error: "El nombre no puede quedar vacío." }, { status: 400 });
    cambios.nombre = n;
  }
  if ("rol" in body && esRol(body.rol)) cambios.rol = body.rol;
  if ("es_tecnico" in body) cambios.es_tecnico = body.es_tecnico === true || body.es_tecnico === "true";
  if ("color" in body && texto(body.color)) cambios.color = texto(body.color);
  if ("telefono" in body) cambios.telefono = texto(body.telefono);
  if ("activo" in body) cambios.activo = body.activo === true || body.activo === "true";
  // Coherencia: un técnico siempre hace de técnico.
  if (cambios.rol === "tecnico") cambios.es_tecnico = true;
  if (Object.keys(cambios).length === 0) return NextResponse.json({ ok: true });

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("profiles").update(cambios).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (!localDbActivo()) return NextResponse.json({ error: "Sin almacén" }, { status: 503 });
  actualizarLocal("profiles", id, cambios);
  return NextResponse.json({ ok: true });
}
