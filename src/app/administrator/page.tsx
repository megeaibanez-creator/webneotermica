"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  FolderKanban,
  MessageSquare,
  Receipt,
  ScrollText,
  UserRound,
  Users,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { esEmailAdmin } from "@/lib/site";
import { getServicio } from "@/lib/servicios";
import { AdminPildora, formatFechaAdmin } from "@/components/admin/AdminTabla";

type LeadFila = {
  id: string;
  created_at: string;
  name: string;
  status: string;
  service_interest: string | null;
  municipio: string | null;
};

type ObraFila = {
  id: string;
  created_at: string;
  title: string;
  status: string;
  service: string | null;
  municipio: string | null;
};

type PreguntaFila = {
  created_at: string;
  content: string;
};

type PostFila = {
  slug: string;
  title: string;
  date: string;
  status: string;
  cover: string | null;
  reescrito: boolean | null;
};

type Resumen = {
  modo: "supabase" | "local" | "pendiente";
  leads: { total: number; nuevos: number };
  clientes: { total: number };
  proyectos: { total: number; en_obra: number; previstos: number };
  presupuestos: { total: number; enviados: number; aceptados: number };
  facturas: { total: number; emitidas: number; cobradas: number };
  chat: { hilos: number; preguntas: number };
  blog: {
    total: number;
    visibles: number;
    futuros: number;
    sin_cover: number;
    sin_texto: number;
  };
  recientes: {
    leads: LeadFila[];
    preguntas: PreguntaFila[];
    obras: ObraFila[];
    posts: PostFila[];
  };
};

const ESTADO_LEAD: Record<string, string> = {
  new: "Nuevo",
  read: "Leído",
  replied: "Respondido",
  archived: "Archivado",
  spam: "Spam",
};

const ESTADO_OBRA: Record<string, string> = {
  previsto: "Previsto",
  en_obra: "En obra",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function oficio(slug: string | null | undefined) {
  if (!slug) return null;
  return getServicio(slug)?.nombre ?? slug;
}

function tonoLead(s: string) {
  if (s === "replied") return "ok" as const;
  if (s === "new") return "warn" as const;
  if (s === "spam") return "bad" as const;
  if (s === "archived") return "muted" as const;
  return "info" as const;
}

function tonoObra(s: string) {
  if (s === "entregado") return "ok" as const;
  if (s === "en_obra") return "warn" as const;
  if (s === "cancelado") return "bad" as const;
  return "info" as const;
}

export default function AdminHomePage() {
  const router = useRouter();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabaseBrowserClient();
    if (sb) {
      void sb.auth.getUser().then(({ data }) => {
        if (!data.user || !esEmailAdmin(data.user.email)) {
          router.replace("/administrator/login");
          return;
        }
        setEmail(data.user.email ?? null);
      });
    } else if (process.env.NODE_ENV === "production") {
      setAviso("Admin pendiente de Auth. Falta el proyecto Supabase.");
    } else {
      setAviso("Modo local (sin Supabase). Los datos están en .data/*.jsonl.");
    }

    void fetch("/api/admin/resumen")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/administrator/login");
          return;
        }
        if (!res.ok) return;
        setResumen((await res.json()) as Resumen);
      })
      .catch(() => undefined);
  }, [router]);

  const hoy = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Madrid",
  });

  const atencion = resumen
    ? [
        {
          n: resumen.leads.nuevos,
          label: "Consultas nuevas",
          href: "/administrator/contactos",
        },
        {
          n: resumen.proyectos.en_obra,
          label: "Obras en marcha",
          href: "/administrator/proyectos",
        },
        {
          n: resumen.presupuestos.enviados,
          label: "Ofertas esperando",
          href: "/administrator/presupuestos",
        },
        {
          n: resumen.facturas.emitidas,
          label: "Facturas por cobrar",
          href: "/administrator/facturacion",
        },
      ]
    : [];

  const bloques = resumen
    ? [
        {
          href: "/administrator/contactos",
          icon: Users,
          n: resumen.leads.total,
          label: "Consultas",
          extra:
            resumen.leads.nuevos > 0
              ? `${resumen.leads.nuevos} sin atender`
              : "El formulario de la web",
        },
        {
          href: "/administrator/clientes",
          icon: UserRound,
          n: resumen.clientes.total,
          label: "Clientes",
          extra: "Pasan desde una consulta",
        },
        {
          href: "/administrator/proyectos",
          icon: FolderKanban,
          n: resumen.proyectos.total,
          label: "Obras",
          extra:
            resumen.proyectos.en_obra > 0
              ? `${resumen.proyectos.en_obra} en marcha`
              : resumen.proyectos.previstos > 0
                ? `${resumen.proyectos.previstos} previstas`
                : "Instalaciones y reformas",
        },
        {
          href: "/administrator/presupuestos",
          icon: ScrollText,
          n: resumen.presupuestos.total,
          label: "Presupuestos",
          extra:
            resumen.presupuestos.aceptados > 0
              ? `${resumen.presupuestos.aceptados} aceptados`
              : "La oferta, no la horquilla web",
        },
        {
          href: "/administrator/facturacion",
          icon: Receipt,
          n: resumen.facturas.total,
          label: "Facturas",
          extra:
            resumen.facturas.cobradas > 0
              ? `${resumen.facturas.cobradas} cobradas`
              : "Borrador, emitida, cobrada",
        },
        {
          href: "/administrator/chatbot",
          icon: MessageSquare,
          n: resumen.chat.preguntas,
          label: "Preguntas a Nora",
          extra: `${resumen.chat.hilos} hilos`,
        },
        {
          href: "/administrator/blog",
          icon: FileText,
          n: resumen.blog.visibles,
          label: "Blog en la web",
          extra:
            resumen.blog.futuros > 0
              ? `${resumen.blog.total} en tabla · ${resumen.blog.futuros} programado${resumen.blog.futuros === 1 ? "" : "s"}`
              : `${resumen.blog.total} en la tabla`,
        },
      ]
    : [];

  return (
    <div className="admin-shell">
      <p className="eyebrow">Administración</p>
      <h1 className="mb-1 text-3xl">Panel</h1>
      <p className="mb-8 text-mutedink">
        {hoy}
        {email ? ` · ${email}` : ""}
      </p>

      {aviso && (
        <p className="mb-6 rounded-xl border border-line bg-ice px-4 py-3 text-sm text-brand-dark">
          {aviso}
        </p>
      )}

      {resumen && (
        <>
          <section className="mb-10">
            <h2 className="mb-3 font-display text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-brand">
              Pendiente de alguien
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {atencion.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`rounded-xl border px-5 py-4 shadow-card transition-colors ${
                    a.n > 0
                      ? "border-amber-200 bg-amber-50 hover:border-amber-300"
                      : "border-line bg-white hover:border-brand"
                  }`}
                >
                  <b className="font-display text-3xl">{a.n}</b>
                  <span className="mt-1 block text-sm text-mutedink">{a.label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 font-display text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-brand">
              El taller
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {bloques.map((b) => {
                const Icon = b.icon;
                return (
                  <Link key={b.href} href={b.href} className="card card-hover !p-6">
                    <Icon className="mb-3 h-5 w-5 text-brand" aria-hidden />
                    <b className="font-display text-3xl">{b.n}</b>
                    <span className="mt-1 block font-medium">{b.label}</span>
                    <span className="mt-0.5 block text-sm text-mutedink">{b.extra}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {(resumen.blog.sin_texto > 0 || resumen.blog.sin_cover > 0) && (
            <p className="mb-8 rounded-xl border border-line bg-ice px-4 py-3 text-sm">
              Blog:{" "}
              {resumen.blog.sin_texto > 0 && (
                <>
                  {resumen.blog.sin_texto} sin texto del redactor
                  {resumen.blog.sin_cover > 0 ? " · " : ""}
                </>
              )}
              {resumen.blog.sin_cover > 0 && (
                <>{resumen.blog.sin_cover} sin portada</>
              )}
              .{" "}
              <Link href="/administrator/blog" className="font-medium text-accent hover:underline">
                Ver el listado
              </Link>
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Lista
              titulo="Últimas consultas"
              href="/administrator/contactos"
              vacio="Cuando alguien envíe el formulario de contacto, salen aquí."
              hay={resumen.recientes.leads.length > 0}
            >
              {resumen.recientes.leads.map((l) => (
                <li key={l.id}>
                  <Link
                    href="/administrator/contactos"
                    className="flex items-start justify-between gap-3 rounded-lg px-1 py-2.5 hover:bg-soft"
                  >
                    <span>
                      <span className="block font-medium">{l.name}</span>
                      <span className="text-sm text-mutedink">
                        {[oficio(l.service_interest), l.municipio].filter(Boolean).join(" · ") ||
                          "Sin oficio"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <AdminPildora tono={tonoLead(l.status)}>
                        {ESTADO_LEAD[l.status] ?? l.status}
                      </AdminPildora>
                      <span className="mt-1 block text-xs text-mutedink">
                        {formatFechaAdmin(l.created_at)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </Lista>

            <Lista
              titulo="Nora: últimas preguntas"
              href="/administrator/chatbot"
              vacio="Nadie le ha escrito todavía."
              hay={resumen.recientes.preguntas.length > 0}
            >
              {resumen.recientes.preguntas.map((p) => (
                <li key={p.created_at + p.content.slice(0, 12)}>
                  <Link
                    href="/administrator/chatbot"
                    className="block rounded-lg px-1 py-2.5 hover:bg-soft"
                  >
                    <span className="line-clamp-2 text-sm">{p.content}</span>
                    <span className="mt-1 block text-xs text-mutedink">
                      {formatFechaAdmin(p.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </Lista>

            <Lista
              titulo="Obras recientes"
              href="/administrator/proyectos"
              vacio="Aún no hay obras. Se crean desde un cliente."
              hay={resumen.recientes.obras.length > 0}
            >
              {resumen.recientes.obras.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/administrator/proyectos?id=${o.id}`}
                    className="flex items-start justify-between gap-3 rounded-lg px-1 py-2.5 hover:bg-soft"
                  >
                    <span>
                      <span className="block font-medium">{o.title}</span>
                      <span className="text-sm text-mutedink">
                        {[oficio(o.service), o.municipio].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </span>
                    <AdminPildora tono={tonoObra(o.status)}>
                      {ESTADO_OBRA[o.status] ?? o.status}
                    </AdminPildora>
                  </Link>
                </li>
              ))}
            </Lista>

            <Lista
              titulo="Últimos artículos"
              href="/administrator/blog"
              vacio="No hay artículos en la tabla."
              hay={resumen.recientes.posts.length > 0}
            >
              {resumen.recientes.posts.map((p) => {
                const futuro = p.date > hoyMadrid();
                return (
                  <li key={p.slug}>
                    <Link
                      href={`/blog/${p.slug}`}
                      className="flex items-start justify-between gap-3 rounded-lg px-1 py-2.5 hover:bg-soft"
                    >
                      <span>
                        <span className="block font-medium">{p.title}</span>
                        <span className="text-sm text-mutedink">
                          {formatFechaAdmin(p.date)}
                          {!p.reescrito ? " · sin redactar" : ""}
                          {!p.cover ? " · sin portada" : ""}
                        </span>
                      </span>
                      {futuro && <AdminPildora tono="info">Programado</AdminPildora>}
                    </Link>
                  </li>
                );
              })}
            </Lista>
          </div>

          <p className="mt-10 text-sm text-mutedink">
            No borres chat de visitante. Solo <code>tester_*</code> / <code>stress_*</code> /{" "}
            <code>check_*</code>.
          </p>
        </>
      )}
    </div>
  );
}

function hoyMadrid() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
}

function Lista({
  titulo,
  href,
  vacio,
  hay,
  children,
}: {
  titulo: string;
  href: string;
  vacio: string;
  hay: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-card p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[1.05rem]">{titulo}</h2>
        <Link href={href} className="text-sm font-medium text-accent hover:underline">
          Ver todos
        </Link>
      </div>
      {hay ? <ul className="divide-y divide-line">{children}</ul> : (
        <p className="text-sm text-mutedink">{vacio}</p>
      )}
    </section>
  );
}
