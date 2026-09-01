import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Blog en ficheros: content/blog/{slug}.md con frontmatter.
 *
 *   slug        · el MISMO de la WordPress (no romper enlaces)
 *   title
 *   date        · fecha de ALTA original, no el lastmod en bloque de jun 2025
 *   description
 *   status      · published | scheduled
 *   servicio    · (opcional) slug de la landing con la que enlaza
 *   cover       · portada IA (`/images/blog/{slug}.jpg`). La genera
 *                 scripts/generate-blog-covers.mjs (lee el post → prompt → gpt-image-2)
 *
 * Listado público = status published y date <= hoy.
 *
 * Con Supabase (`.env.local`): home, /blog, fichas y landings leen
 * `blog_articles`. Los `.md` quedan para el redactor y el script de copia.
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

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function leerFichero(fileName: string): Post | null {
  const full = path.join(BLOG_DIR, fileName);
  const raw = fs.readFileSync(full, "utf8");
  const { data, content } = matter(raw);
  const slug = String(data.slug ?? fileName.replace(/\.md$/, ""));
  if (!data.title || !data.date) return null;
  return {
    slug,
    title: String(data.title),
    date: new Date(data.date).toISOString().slice(0, 10),
    description: String(data.description ?? ""),
    status: data.status === "scheduled" ? "scheduled" : "published",
    ...(data.servicio ? { servicio: String(data.servicio) } : {}),
    ...(data.cover ? { cover: String(data.cover) } : {}),
    ...(data.reescrito ? { reescrito: true } : {}),
    content,
  };
}

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

/** Todos los ficheros. Origen del redactor y de `migrate-blog-articles`. */
export function getAllPostsRaw(): Post[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(leerFichero)
    .filter((p): p is Post => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Admin y listados: Supabase si hay keys; si no, los `.md`. */
export async function getAllPosts(): Promise<Post[]> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("blog_articles")
      .select("slug,title,date,description,status,servicio,cover,reescrito,content")
      .order("date", { ascending: false });
    if (error) {
      console.error("[blog] blog_articles:", error.message);
      return getAllPostsRaw();
    }
    return ((data ?? []) as FilaBlog[]).map(filaAPost);
  }
  return getAllPostsRaw();
}

/** Lo que ve el visitante: publicados con fecha de hoy o anterior. */
export async function getPublishedPosts(): Promise<Post[]> {
  return publicadosDe(await getAllPosts());
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("blog_articles")
      .select("slug,title,date,description,status,servicio,cover,reescrito,content")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      console.error("[blog] getPost:", error.message);
    } else if (data) {
      const post = filaAPost(data as FilaBlog);
      const hoy = new Date().toISOString().slice(0, 10);
      if (post.status === "published" && post.date <= hoy) return post;
      return undefined;
    }
  }
  return publicadosDe(getAllPostsRaw()).find((p) => p.slug === slug);
}

/** Posts relacionados con una landing de servicio. */
export async function getPostsByServicio(servicio: string, limite = 3): Promise<Post[]> {
  return (await getPublishedPosts())
    .filter((p) => p.servicio === servicio)
    .slice(0, limite);
}

export function formatFecha(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
