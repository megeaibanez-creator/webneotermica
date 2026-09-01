"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { SERVICIOS } from "@/lib/servicios";
import BannerEstancias from "@/components/estancias/BannerEstancias";

export type PostListado = {
  slug: string;
  title: string;
  date: string;
  fecha: string;
  description: string;
  servicio?: string;
  categoria: string;
  foto: string | null;
  minutos: number;
};

const ORDEN_OFICIO = SERVICIOS.map((s) => s.slug);

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export default function BlogIndice({ posts }: { posts: PostListado[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const chips = useMemo(() => {
    const hay = new Set(posts.map((p) => p.servicio ?? "otros"));
    return [
      ...ORDEN_OFICIO.filter((slug) => hay.has(slug)).map((slug) => {
        const p = posts.find((x) => x.servicio === slug);
        return { id: slug, label: p?.categoria ?? slug };
      }),
      ...(hay.has("otros") ? [{ id: "otros", label: "Otros" }] : []),
    ];
  }, [posts]);

  const filtrados = useMemo(() => {
    const needle = normalizar(q.trim());
    return posts.filter((p) => {
      const clave = p.servicio ?? "otros";
      if (cat && clave !== cat) return false;
      if (!needle) return true;
      return (
        normalizar(p.title).includes(needle) ||
        normalizar(p.description).includes(needle) ||
        normalizar(p.categoria).includes(needle)
      );
    });
  }, [posts, q, cat]);

  const filtrando = Boolean(q.trim() || cat);
  const destacados = filtrando ? [] : filtrados.slice(0, 3);
  const resto = filtrando ? filtrados : filtrados.slice(3);
  const [principal, ...secundarios] = destacados;
  const corte = filtrando ? resto.length : Math.ceil(resto.length / 2);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block min-w-0 flex-1 lg:max-w-md">
          <span className="sr-only">Buscar en el blog</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mutedink"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar un artículo…"
            className="field-input pl-11"
          />
        </label>
        <p className="text-[0.85rem] text-mutedink">
          {filtrados.length === posts.length
            ? `${posts.length} artículos`
            : `${filtrados.length} de ${posts.length}`}
        </p>
      </div>

      <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label="Categorías">
        <button
          type="button"
          role="tab"
          aria-selected={!cat}
          className={chipClass(!cat)}
          onClick={() => setCat("")}
        >
          Todos
        </button>
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={cat === c.id}
            className={chipClass(cat === c.id)}
            onClick={() => setCat((v) => (v === c.id ? "" : c.id))}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <p className="text-mutedink">
          No hay artículos con eso. Prueba otra palabra o quita el filtro.
        </p>
      ) : (
        <>
          {principal && (
            <div className="mb-12">
              <p className="eyebrow">Destacados</p>
              <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
                <ArticuloDestacado post={principal} grande />
                {secundarios.length > 0 && (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                    {secundarios.map((p) => (
                      <ArticuloDestacado key={p.slug} post={p} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {resto.length > 0 && (
            <ListaArticulos
              posts={resto.slice(0, corte)}
              titulo={!filtrando ? "Más artículos" : undefined}
            />
          )}

          {!filtrando && (
            <div className="my-12">
              <BannerEstancias />
            </div>
          )}

          {resto.length > corte && (
            <ListaArticulos posts={resto.slice(corte)} />
          )}
        </>
      )}
    </>
  );
}

function ListaArticulos({
  posts,
  titulo,
}: {
  posts: PostListado[];
  titulo?: string;
}) {
  if (posts.length === 0) return null;
  return (
    <div>
      {titulo && <p className="eyebrow">{titulo}</p>}
      <ul className="divide-y divide-line rounded-[20px] border border-line bg-white shadow-card">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="flex gap-4 p-5 transition-colors hover:bg-soft sm:gap-6 sm:p-6"
            >
              {post.foto && (
                <span className="relative hidden h-[88px] w-[128px] shrink-0 overflow-hidden rounded-xl sm:block">
                  <Image
                    src={post.foto}
                    alt=""
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-[0.72rem] uppercase tracking-[0.12em] text-brand">
                  <time dateTime={post.date}>{post.fecha}</time>
                  <span className="text-mutedink">·</span>
                  <span>{post.categoria}</span>
                  <span className="text-mutedink">· {post.minutos} min</span>
                </span>
                <span className="mb-1.5 block text-[1.15rem] font-bold leading-snug hover:text-accent">
                  {post.title}
                </span>
                <span className="line-clamp-2 text-[0.92rem] text-mutedink">
                  {post.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function chipClass(activo: boolean) {
  return `rounded-full border px-3.5 py-1.5 font-display text-[0.78rem] font-semibold transition-colors ${
    activo
      ? "border-brand bg-brand text-white"
      : "border-line bg-white text-ink hover:border-brand hover:text-brand"
  }`;
}

function ArticuloDestacado({
  post,
  grande = false,
}: {
  post: PostListado;
  grande?: boolean;
}) {
  return (
    <article
      className={`card card-hover flex h-full flex-col !p-0 ${
        grande ? "" : "lg:flex-row"
      }`}
    >
      {post.foto && (
        <Link
          href={`/blog/${post.slug}`}
          className={`relative block overflow-hidden ${
            grande
              ? "aspect-[16/10] rounded-t-[20px]"
              : "aspect-[16/10] rounded-t-[20px] lg:aspect-auto lg:w-[42%] lg:rounded-l-[20px] lg:rounded-tr-none"
          }`}
        >
          <Image
            src={post.foto}
            alt=""
            fill
            sizes={grande ? "(min-width:1024px) 50vw, 90vw" : "(min-width:1024px) 20vw, 45vw"}
            className="object-cover"
          />
        </Link>
      )}
      <div className={`flex flex-1 flex-col ${grande ? "p-7" : "p-5"}`}>
        <p className="mb-2 font-display text-[0.72rem] uppercase tracking-[0.12em] text-brand">
          <time dateTime={post.date}>{post.fecha}</time>
          <span className="text-mutedink"> · {post.categoria}</span>
          <span className="text-mutedink"> · {post.minutos} min</span>
        </p>
        <h2 className={grande ? "mb-3 text-[1.55rem]" : "mb-2 text-[1.1rem]"}>
          <Link href={`/blog/${post.slug}`} className="hover:text-accent">
            {post.title}
          </Link>
        </h2>
        {grande && (
          <p className="mb-4 flex-1 text-[0.95rem] text-mutedink">{post.description}</p>
        )}
        <Link
          href={`/blog/${post.slug}`}
          className="mt-auto font-display text-[0.82rem] font-semibold text-accent"
        >
          Leer el artículo →
        </Link>
      </div>
    </article>
  );
}
