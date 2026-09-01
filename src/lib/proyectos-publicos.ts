import {
  type Project,
  normalizarProyecto,
  proyectosPublicables,
} from "@/lib/crm";
import { leerLocal, localDbActivo } from "@/lib/db/local";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Obras marcadas publicable. Sin Auth: esto alimenta /proyectos. */
export async function listarProyectosPublicos(): Promise<Project[]> {
  if (getSupabaseAdmin()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("publicable", true)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return proyectosPublicables(data as Project[]);
  }
  if (localDbActivo()) {
    return proyectosPublicables(leerLocal<Project>("projects"));
  }
  return [];
}

export async function proyectoPublicoPorSlug(slug: string): Promise<Project | null> {
  const lista = await listarProyectosPublicos();
  return lista.find((p) => p.slug === slug) ?? null;
}

export function añoDeObra(p: Project): number {
  const d = new Date(p.created_at);
  return Number.isFinite(d.getTime()) ? d.getFullYear() : new Date().getFullYear();
}

export function tituloPublico(p: Project): string {
  return p.public_title?.trim() || p.title;
}

export { normalizarProyecto };
