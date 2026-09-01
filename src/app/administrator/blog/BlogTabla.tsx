"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getServicio } from "@/lib/servicios";

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
          <AdminPildora tono="muted">WordPress</AdminPildora>
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
        {posts.length} artículos en <code>content/blog/</code>. {publicados} se ven en la
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
        pie={`Mostrando ${visibles.length} de ${posts.length}`}
      />
    </div>
  );
}
