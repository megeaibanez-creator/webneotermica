"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getServicio } from "@/lib/servicios";
import AdminHoja from "@/components/admin/AdminHoja";

type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  status: "published" | "scheduled";
  servicio?: string;
  cover?: string;
  reescrito?: boolean;
};
import AdminTabla, { AdminPildora, type ColumnaTabla } from "@/components/admin/AdminTabla";

type Props = { posts: Post[]; publicados: number };

export default function BlogTabla({ posts, publicados }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("");
  const [slugAbierto, setSlugAbierto] = useState<string | null>(null);

  const abierto = useMemo(
    () => (slugAbierto ? (posts.find((p) => p.slug === slugAbierto) ?? null) : null),
    [posts, slugAbierto]
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return posts.filter((p) => {
      if (filtro && p.status !== filtro) return false;
      if (!q) return true;
      return [p.title, p.slug, p.description, p.servicio].join(" ").toLowerCase().includes(q);
    });
  }, [posts, busqueda, filtro]);

  const columnas: ColumnaTabla<Post>[] = [
    {
      id: "title",
      titulo: "Artículo",
      ordenable: true,
      valor: (p) => p.title,
      celda: (p) => (
        <div>
          <p className="font-medium">{p.title}</p>
          <p className="text-xs text-mutedink">/{p.slug}</p>
        </div>
      ),
    },
    {
      id: "date",
      titulo: "Fecha",
      ordenable: true,
      valor: (p) => p.date,
      celda: (p) =>
        new Date(`${p.date}T12:00:00`).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      id: "servicio",
      titulo: "Servicio",
      ordenable: true,
      valor: (p) => p.servicio ?? "",
      celda: (p) => (p.servicio ? (getServicio(p.servicio)?.nombre ?? p.servicio) : "—"),
    },
    {
      id: "texto",
      titulo: "Texto",
      valor: (p) => (p.reescrito ? "1" : "0"),
      celda: (p) =>
        p.reescrito ? (
          <AdminPildora tono="ok">Agente</AdminPildora>
        ) : (
          <AdminPildora tono="muted">Pendiente</AdminPildora>
        ),
    },
    {
      id: "cover",
      titulo: "Portada",
      valor: (p) => (p.cover ? "1" : "0"),
      celda: (p) =>
        p.cover ? (
          <AdminPildora tono="ok">IA</AdminPildora>
        ) : (
          <AdminPildora tono="muted">Sin foto</AdminPildora>
        ),
    },
    {
      id: "status",
      titulo: "Estado",
      ordenable: true,
      valor: (p) => p.status,
      celda: (p) =>
        p.status === "published" ? (
          <AdminPildora tono="ok">Publicado</AdminPildora>
        ) : (
          <AdminPildora tono="muted">Programado</AdminPildora>
        ),
    },
    {
      id: "ver",
      titulo: "",
      alinear: "right",
      celda: (p) =>
        p.status === "published" ? (
          <Link
            href={`/blog/${p.slug}`}
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Ver <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="text-mutedink">—</span>
        ),
    },
  ];

  return (
    <div className="admin-shell">
      <h1 className="mb-2 text-3xl">Blog</h1>
      <p className="mb-6 max-w-xl text-mutedink">
        {posts.length} artículos en <code>blog_articles</code>. {publicados} se ven en la
        web. El texto lo reescribe el agente: <code>npm run redact:blog -- --all</code>.
        Las portadas, después del texto: <code>npm run generate:blog-covers</code>.
      </p>
      <AdminTabla
        columnas={columnas}
        filas={visibles}
        clave={(p) => p.slug}
        vacio={busqueda || filtro ? "Nada coincide con el filtro." : "No hay artículos."}
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        placeholder="Buscar título o slug…"
        filtro={filtro}
        onFiltro={setFiltro}
        opcionesFiltro={[
          { value: "", label: "Todos los estados" },
          { value: "published", label: "Publicado" },
          { value: "scheduled", label: "Programado" },
        ]}
        filaActiva={slugAbierto}
        onFila={(p) => setSlugAbierto(p.slug)}
        unidad={["artículo", "artículos"]}
      />

      {abierto && (
        <AdminHoja
          titulo={abierto.title}
          subtitulo={`/${abierto.slug}`}
          onCerrar={() => setSlugAbierto(null)}
          pie={
            abierto.status === "published" ? (
              <Link
                href={`/blog/${abierto.slug}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
              >
                Ver en la web <ExternalLink className="h-4 w-4" />
              </Link>
            ) : undefined
          }
        >
          {abierto.cover ? (
            <Image
              src={abierto.cover}
              alt={abierto.title}
              width={640}
              height={360}
              className="mb-4 aspect-[16/9] w-full rounded-xl border border-line object-cover"
            />
          ) : (
            <div className="mb-4 flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-line bg-soft text-sm text-mutedink">
              Sin portada · npm run generate:blog-covers
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-1.5">
            {abierto.status === "published" ? (
              <AdminPildora tono="ok">Publicado</AdminPildora>
            ) : (
              <AdminPildora tono="muted">Programado</AdminPildora>
            )}
            {abierto.reescrito ? (
              <AdminPildora tono="ok">Texto del agente</AdminPildora>
            ) : (
              <AdminPildora tono="warn">Texto pendiente</AdminPildora>
            )}
            {abierto.servicio && (
              <AdminPildora tono="info">
                {getServicio(abierto.servicio)?.nombre ?? abierto.servicio}
              </AdminPildora>
            )}
          </div>

          <p className="mb-4 text-sm text-mutedink">
            {abierto.status === "published" ? "Publicado el" : "Sale el"}{" "}
            {new Date(`${abierto.date}T12:00:00`).toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-mutedink">
            Descripción (meta)
          </p>
          <p className="rounded-xl border border-line px-4 py-3 text-sm leading-relaxed">
            {abierto.description || "—"}
          </p>
        </AdminHoja>
      )}
    </div>
  );
}
