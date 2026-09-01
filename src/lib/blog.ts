import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Blog = tabla `blog_articles` (molde Furgocasa: una fuente).
 * El redactor y las portadas leen y escriben ahí. No hay carpeta de .md.
 *
 *   slug        · el de la WordPress o el del lote nuevo (no romper enlaces)
 *   title
 *   date        · fecha de alta (los WP: original, no el lastmod de jun 2025)
 *   description
 *   status      · published | scheduled
 *   servicio    · (opcional) slug de la landing
 *   cover       · URL pública del bucket `blog/covers`
 *
 * Listado público = status published y date <= hoy.
 */

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  status: "published" | "scheduled";
  servicio?: string;
  cover?: string;
  /** true cuando el agente redactor ya reescribió el cuerpo. */
  reescrito?: boolean;
};

export type Post = PostMeta & { content: string };

type FilaBlog = {
  slug: string;
  title: string;
  date: string;
  description: string | null;
  status: string;
  servicio: string | null;
  cover: string | null;
  reescrito: boolean | null;
  content: string;
};

const COLUMNAS =
  "slug,title,date,description,status,servicio,cover,reescrito,content";

function filaAPost(f: FilaBlog): Post {
  return {
    slug: f.slug,
    title: f.title,
    date: String(f.date).slice(0, 10),
    description: f.description ?? "",
    status: f.status === "scheduled" ? "scheduled" : "published",
    ...(f.servicio ? { servicio: f.servicio } : {}),
    ...(f.cover ? { cover: f.cover } : {}),
    ...(f.reescrito ? { reescrito: true } : {}),
    content: f.content ?? "",
  };
}

function publicadosDe(posts: Post[]): Post[] {
  const hoy = new Date().toISOString().slice(0, 10);
  return posts.filter((p) => p.status === "published" && p.date <= hoy);
}

export function requireBlogAdmin(): SupabaseClient {
  const sb = getSupabaseAdmin();
  if (!sb) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  return sb;
}

/** Admin y listados. Vacío si no hay Supabase. */
export async function getAllPosts(): Promise<Post[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb
    .from("blog_articles")
    .select(COLUMNAS)
    .order("date", { ascending: false });
  if (error) {
    console.error("[blog] blog_articles:", error.message);
    return [];
  }
  return ((data ?? []) as FilaBlog[]).map(filaAPost);
}

/** Lo que ve el visitante: publicados con fecha de hoy o anterior. */
export async function getPublishedPosts(): Promise<Post[]> {
  return publicadosDe(await getAllPosts());
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const sb = getSupabaseAdmin();
  if (!sb) return undefined;
  const { data, error } = await sb.from("blog_articles").select(COLUMNAS).eq("slug", slug).maybeSingle();
  if (error) {
    console.error("[blog] getPost:", error.message);
    return undefined;
  }
  if (!data) return undefined;
  const post = filaAPost(data as FilaBlog);
  const hoy = new Date().toISOString().slice(0, 10);
  if (post.status === "published" && post.date <= hoy) return post;
  return undefined;
}

/** Posts relacionados con una landing de servicio. */
export async function getPostsByServicio(servicio: string, limite = 3): Promise<Post[]> {
  return (await getPublishedPosts()).filter((p) => p.servicio === servicio).slice(0, limite);
}

export function formatFecha(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Slugs en la tabla (redactor / portadas). */
export async function listBlogSlugs(): Promise<string[]> {
  const sb = requireBlogAdmin();
  const { data, error } = await sb.from("blog_articles").select("slug").order("slug");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => String((r as { slug: string }).slug));
}

/** Fila completa, también programada. Para el redactor. */
export async function getArticleForRedactor(filtro: string): Promise<Post> {
  const sb = requireBlogAdmin();
  const { data, error } = await sb.from("blog_articles").select(COLUMNAS).eq("slug", filtro).maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return filaAPost(data as FilaBlog);

  const slugs = await listBlogSlugs();
  const hit = slugs.find((s) => s.includes(filtro));
  if (!hit) throw new Error(`No hay artículo «${filtro}» en blog_articles`);
  const otra = await sb.from("blog_articles").select(COLUMNAS).eq("slug", hit).maybeSingle();
  if (otra.error) throw new Error(otra.error.message);
  if (!otra.data) throw new Error(`No hay artículo «${filtro}» en blog_articles`);
  return filaAPost(otra.data as FilaBlog);
}

export async function saveArticleBody(slug: string, content: string, description: string): Promise<void> {
  const sb = requireBlogAdmin();
  const { error } = await sb
    .from("blog_articles")
    .update({
      content,
      description,
      reescrito: true,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);
  if (error) throw new Error(error.message);
}
