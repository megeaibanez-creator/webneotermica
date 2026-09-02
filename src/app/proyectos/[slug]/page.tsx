import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { FASES_FOTO, fotoPortada } from "@/lib/crm";
import { getServicio } from "@/lib/servicios";
import { EMPRESA, SITE_URL } from "@/lib/site";
import {
  añoDeObra,
  listarProyectosPublicos,
  proyectoPublicoPorSlug,
  tituloPublico,
} from "@/lib/proyectos-publicos";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

const FASE_LABEL: Record<string, string> = Object.fromEntries(
  FASES_FOTO.map((f) => [f.value, f.label])
);

export async function generateStaticParams() {
  return (await listarProyectosPublicos()).map((p) => ({ slug: p.slug as string }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const proyecto = await proyectoPublicoPorSlug(slug);
  if (!proyecto) return { title: "Proyecto no encontrado" };
  const titulo = tituloPublico(proyecto);
  const portada = fotoPortada(proyecto);
  return {
    title: titulo,
    description:
      proyecto.public_excerpt ??
      `Instalación de climatización realizada por Neotérmica en Murcia: ${titulo}.`,
    alternates: { canonical: `/proyectos/${proyecto.slug}` },
    openGraph: {
      title: `${titulo} | Neotérmica`,
      description: proyecto.public_excerpt ?? undefined,
      url: `/proyectos/${proyecto.slug}`,
      type: "article",
      locale: "es_ES",
      siteName: "Neotérmica",
      ...(portada ? { images: [{ url: portada }] } : {}),
    },
  };
}

export default async function ProyectoPage({ params }: Params) {
  const { slug } = await params;
  const proyecto = await proyectoPublicoPorSlug(slug);
  if (!proyecto) notFound();

  const titulo = tituloPublico(proyecto);
  const servicio = proyecto.service ? getServicio(proyecto.service) : undefined;
  const portada = fotoPortada(proyecto);
  const galeria = proyecto.photos.filter((f) => f.src !== portada);
  const cuerpo = proyecto.public_body
    ? await marked.parse(proyecto.public_body)
    : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: titulo,
    description: proyecto.public_excerpt ?? undefined,
    inLanguage: "es-ES",
    mainEntityOfPage: `${SITE_URL}/proyectos/${proyecto.slug}`,
    author: { "@type": "Organization", name: EMPRESA.nombre },
    publisher: { "@id": `${SITE_URL}/#organizacion` },
    ...(portada ? { image: portada } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="pt-[calc(74px+4.5rem)]">
        <div className="container-site pb-16">
          <nav aria-label="Migas" className="mb-4 text-[0.8rem] text-mutedink">
            <Link href="/" className="hover:text-brand">
              Inicio
            </Link>{" "}
            ·{" "}
            <Link href="/proyectos" className="hover:text-brand">
              Proyectos
            </Link>
          </nav>

          <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-[0.75rem] uppercase tracking-[0.14em] text-brand">
            <span>{añoDeObra(proyecto)}</span>
            {servicio && (
              <>
                <span className="text-mutedink">·</span>
                <Link href={`/servicios/${servicio.slug}`} className="hover:text-accent">
                  {servicio.nombre}
                </Link>
              </>
            )}
            {proyecto.municipio && (
              <>
                <span className="text-mutedink">·</span>
                <span>{proyecto.municipio}</span>
              </>
            )}
          </p>

          <h1 className="mb-5 text-[clamp(1.9rem,4vw,2.8rem)]">{titulo}</h1>
          {proyecto.public_excerpt && (
            <p className="mb-8 text-[1.08rem] leading-relaxed text-mutedink">
              {proyecto.public_excerpt}
            </p>
          )}

          {portada && (
            <figure className="relative mb-10 aspect-[16/9] overflow-hidden rounded-[20px]">
              <Image
                src={portada}
                alt={titulo}
                fill
                sizes="(min-width:1100px) 1100px, 90vw"
                className="object-cover"
                priority
              />
            </figure>
          )}

          {cuerpo && (
            <div
              className="post-body"
              dangerouslySetInnerHTML={{ __html: cuerpo }}
            />
          )}

          {galeria.length > 0 && (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {galeria.map((foto, i) => (
                <figure
                  key={`${foto.src}-${i}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-[16px]"
                >
                  <Image
                    src={foto.src}
                    alt={`${titulo} — ${FASE_LABEL[foto.fase] ?? "Foto"}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                  {FASE_LABEL[foto.fase] && (
                    <figcaption className="absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 font-display text-[0.7rem] uppercase tracking-[0.12em] text-white">
                      {FASE_LABEL[foto.fase]}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}

          <aside className="mt-12 rounded-4xl border border-line bg-white p-7 shadow-card">
            <h2 className="mb-2 text-[1.25rem]">
              ¿Quieres algo parecido en tu casa o tu local?
            </h2>
            <p className="mb-5 text-mutedink">
              Somos Neotérmica, climatización en Murcia desde 2012. Lo vemos en visita
              y te damos presupuesto sin compromiso.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contacto#formulario" className="btn-primary">
                Pedir presupuesto
              </Link>
              {servicio && (
                <Link href={`/servicios/${servicio.slug}`} className="btn-ghost">
                  {servicio.nombre}
                </Link>
              )}
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
