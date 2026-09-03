import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import {
  type FotoFase,
  type Project,
  type ProjectPhoto,
  esSrcFotoObra,
  rutaStorageFotoObra,
  normalizarProyecto,
} from "@/lib/crm";
import { actualizarLocal, leerLocal, localDbActivo } from "@/lib/db/local";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FASES: FotoFase[] = ["antes", "durante", "despues", "otro"];
const TIPOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const BUCKET = "blog";
const MAX_BYTES = 5 * 1024 * 1024;

function dirObra(id: string): string {
  return path.join(process.cwd(), "public", "uploads", "proyectos", id);
}

async function leerObra(id: string): Promise<Project | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
    return data ? normalizarProyecto(data as Project) : null;
  }
  if (!localDbActivo()) return null;
  const fila = leerLocal<Project>("projects").find((p) => p.id === id);
  return fila ? normalizarProyecto(fila) : null;
}

async function guardarFotos(id: string, photos: ProjectPhoto[]): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("projects").update({ photos }).eq("id", id);
    return error?.message ?? null;
  }
  if (!localDbActivo()) return "Sin almacén";
  actualizarLocal("projects", id, { photos });
  return null;
}

async function subirArchivo(
  id: string,
  nombre: string,
  buf: Buffer,
  contentType: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const dest = `proyectos/${id}/${nombre}`;
    const { error } = await supabase.storage.from(BUCKET).upload(dest, buf, {
      contentType,
      upsert: false,
      cacheControl: "2592000",
    });
    if (error) throw new Error(error.message);
    const url = supabase.storage.from(BUCKET).getPublicUrl(dest).data.publicUrl;
    return `${url}?v=${Date.now()}`;
  }
  const destDir = dirObra(id);
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, nombre), buf);
  return `/uploads/proyectos/${id}/${nombre}`;
}

async function borrarArchivo(src: string): Promise<void> {
  const ruta = rutaStorageFotoObra(src);
  const supabase = getSupabaseAdmin();
  if (ruta && supabase) {
    await supabase.storage.from(BUCKET).remove([ruta]);
    return;
  }
  if (!src.startsWith("/uploads/proyectos/")) return;
  const rel = src.replace(/^\//, "");
  const corte = rel.indexOf("?");
  const abs = path.join(process.cwd(), "public", corte === -1 ? rel : rel.slice(0, corte));
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
}

export async function POST(request: Request) {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const form = await request.formData();
  const id = String(form.get("project_id") ?? "");
  const faseRaw = String(form.get("fase") ?? "otro");
  const file = form.get("file");
  if (!id || !(file instanceof File)) {
    return NextResponse.json({ error: "Faltan la obra o el archivo." }, { status: 400 });
  }
  const fase = FASES.includes(faseRaw as FotoFase) ? (faseRaw as FotoFase) : "otro";
  const ext = TIPOS[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Solo jpg, png o webp." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La foto no puede pasar de 5 MB." }, { status: 400 });
  }

  const obra = await leerObra(id);
  if (!obra) return NextResponse.json({ error: "Esa obra no existe." }, { status: 404 });

  const buf = Buffer.from(await file.arrayBuffer());
  const nombre = `${randomUUID()}.${ext}`;
  let src: string;
  try {
    src = await subirArchivo(id, nombre, buf, file.type);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo subir.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const foto: ProjectPhoto = { src, fase };
  const photos = [...obra.photos, foto];
  const err = await guardarFotos(id, photos);
  if (err) return NextResponse.json({ error: err }, { status: 500 });
  return NextResponse.json({ ok: true, foto, photos });
}

export async function DELETE(request: Request) {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const src = url.searchParams.get("src") ?? "";
  if (!id || !src || !esSrcFotoObra(src)) {
    return NextResponse.json({ error: "Foto no válida." }, { status: 400 });
  }

  const obra = await leerObra(id);
  if (!obra) return NextResponse.json({ error: "Esa obra no existe." }, { status: 404 });
  if (!obra.photos.some((f) => f.src === src)) {
    return NextResponse.json({ error: "Esa foto no es de esta obra." }, { status: 400 });
  }

  await borrarArchivo(src);

  const photos = obra.photos.filter((f) => f.src !== src);
  const err = await guardarFotos(id, photos);
  if (err) return NextResponse.json({ error: err }, { status: 500 });
  return NextResponse.json({ ok: true, photos });
}
