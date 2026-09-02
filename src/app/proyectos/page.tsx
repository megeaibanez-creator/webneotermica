import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fotoPortada } from "@/lib/crm";
import { getServicio } from "@/lib/servicios";
import {
  añoDeObra,
  listarProyectosPublicos,
  tituloPublico,
} from "@/lib/proyectos-publicos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Proyectos de climatización en Murcia",
  description:
    "Obras de climatización realizadas por Neotérmica en Murcia y 50 km: aire acondicionado, aerotermia, suelo radiante, calderas y ventilación. Trabajo real, sin humo.",
  alternates: { canonical: "/proyectos" },
  openGraph: {
    title: "Proyectos de climatización en Murcia | Neotérmica",
    description:
      "Instalaciones de climatización hechas por Neotérmica en Murcia y alrededores.",
    url: "/proyectos",
    type: "website",
    locale: "es_ES",
    siteName: "Neotérmica",
  },
};

export default async function ProyectosPage() {
  const proyectos = await listarProyectosPublicos();

  return (
    <>
      <header className="pb-10 pt-[calc(74px+4.5rem)]">
        <div className="container-site">
          <p className="eyebrow">Proyectos</p>
          <h1 className="mb-4 text-[clamp(2rem,4.5vw,3.2rem)]">
            Obra hecha en Murcia, no fotos de catálogo
          </h1>
          <p className="lead">
            Instalaciones reales de aire acondicionado, aerotermia, suelo radiante y
            calderas que hemos montado en viviendas, locales y comunidades de Murcia y
            su radio de 50 km. Sin precios ni datos del cliente: solo el trabajo.
          </p>
        </div>
      </header>

      <section className="pb-20">
        <div className="container-site">
          {proyectos.length === 0 ? (
            <div className="card mx-auto max-w-[640px] text-center">
              <h2 className="mb-2 text-[1.35rem]">Estamos preparando esta sección</h2>
              <p className="mb-6 text-mutedink">
                Pronto verás aquí una selección de nuestras últimas instalaciones.
                Mientras tanto, cuéntanos tu caso y te damos presupuesto sin
                compromiso.
              </p>
              <Link href="/contacto#formulario" className="btn-primary">
                Pedir presupuesto
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {proyectos.map((p) => {
                const portada = fotoPortada(p);
                const servicio = p.service ? getServicio(p.service) : undefined;
                return (
                  <Link
                    key={p.id}
                    href={`/proyectos/${p.slug}`}
                    className="card card-hover group flex flex-col !p-0 no-underline text-inherit"
                  >
                    <div className="relative h-48 overflow-hidden rounded-t-[20px] bg-gradient-to-br from-brand-dark to-ink">
                      {portada && (
                        <Image
                          src={portada}
                          alt={tituloPublico(p)}
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-[0.72rem] uppercase tracking-[0.14em] text-brand">
                        <span>{añoDeObra(p)}</span>
                        {servicio && (
                          <>
                            <span className="text-mutedink">·</span>
                            <span>{servicio.nombre}</span>
                          </>
                        )}
                        {p.municipio && (
                          <>
                            <span className="text-mutedink">·</span>
                            <span>{p.municipio}</span>
                          </>
                        )}
                      </p>
                      <h2 className="mb-2 text-[1.2rem]">{tituloPublico(p)}</h2>
                      {p.public_excerpt && (
                        <p className="mb-4 flex-1 text-[0.92rem] text-mutedink">
                          {p.public_excerpt}
                        </p>
                      )}
                      <span className="mt-auto font-display text-[0.85rem] font-semibold text-accent group-hover:underline">
                        Ver el proyecto →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
