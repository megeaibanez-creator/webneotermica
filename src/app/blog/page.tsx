import type { Metadata } from "next";
import { getPublishedPosts, formatFecha, type Post } from "@/lib/blog";
import { fotoServicio } from "@/lib/images";
import { getServicio } from "@/lib/servicios";
import BlogIndice, { type PostListado } from "./BlogIndice";

const ETIQUETA: Record<string, string> = {
  "aire-acondicionado-splits": "Splits",
  "aire-acondicionado-conductos": "Conductos",
  aerotermia: "Aerotermia",
  "suelo-radiante": "Suelo radiante",
  calderas: "Calderas",
  radiadores: "Radiadores",
  ventilacion: "Ventilación",
  "reparacion-mantenimiento": "Mantenimiento",
};

function minutosLectura(texto: string) {
  const palabras = texto.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(palabras / 200));
}

function aListado(posts: Post[]): PostListado[] {
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    fecha: formatFecha(p.date),
    description: p.description,
    servicio: p.servicio,
    categoria: p.servicio
      ? (ETIQUETA[p.servicio] ?? getServicio(p.servicio)?.nombre ?? "Otros")
      : "Otros",
    foto: p.cover || (p.servicio ? fotoServicio(p.servicio) : null),
    minutos: minutosLectura(p.content),
  }));
}

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Consejos de climatización de Neotérmica: aire acondicionado, aerotermia, calderas, ventilación y eficiencia energética, explicados por técnicos de Murcia.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog | Neotérmica",
    description:
      "Artículos de climatización escritos desde el taller: instalación, mantenimiento, consumo y eficiencia.",
    url: "/blog",
    type: "website",
    locale: "es_ES",
    siteName: "Neotérmica",
  },
};

export default async function BlogPage() {
  const posts = aListado(await getPublishedPosts());

  return (
    <>
      <header className="pb-10 pt-[calc(74px+4.5rem)]">
        <div className="container-site">
          <p className="eyebrow">Blog</p>
          <h1 className="mb-4 text-[clamp(2rem,4.5vw,3.2rem)]">
            Climatización explicada sin humo
          </h1>
          <p className="lead">
            Lo que preguntáis por teléfono, escrito. Instalación, mantenimiento,
            consumo y eficiencia, con el criterio de quien lleva más de 20 años
            montando equipos en Murcia.
          </p>
        </div>
      </header>

      <section className="pb-20">
        <div className="container-site">
          {posts.length === 0 ? (
            <p className="text-mutedink">Todavía no hay artículos publicados.</p>
          ) : (
            <BlogIndice posts={posts} />
          )}
        </div>
      </section>
    </>
  );
}
