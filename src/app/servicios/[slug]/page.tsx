import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { marked } from "marked";
import AreaServicio from "@/components/AreaServicio";
import ContactForm from "@/components/forms/ContactForm";
import { SERVICIOS, getServicio } from "@/lib/servicios";
import { getPostsByServicio } from "@/lib/blog";
import { breadcrumbServicioJsonLd, serviceJsonLd } from "@/lib/structuredData";
import { fotoServicio } from "@/lib/images";
import CarruselPosts from "@/components/blog/CarruselPosts";

function textoPlano(md: string) {
  return md.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
}

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICIOS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const servicio = getServicio(slug);
  if (!servicio) return { title: "Servicio no encontrado" };
  const foto = fotoServicio(servicio.slug);
  return {
    title: servicio.metaTitle,
    description: servicio.metaDescription,
    alternates: { canonical: `/servicios/${servicio.slug}` },
    openGraph: {
      title: servicio.metaTitle,
      description: servicio.metaDescription,
      url: `/servicios/${servicio.slug}`,
      type: "website",
      locale: "es_ES",
      siteName: "Neotérmica",
      ...(foto ? { images: [{ url: foto, alt: servicio.nombre }] } : {}),
    },
  };
}

export default async function ServicioPage({ params }: Params) {
  const { slug } = await params;
  const servicio = getServicio(slug);
  if (!servicio) notFound();

  const posts = await getPostsByServicio(servicio.slug);
  const otros = SERVICIOS.filter((s) => s.slug !== servicio.slug).slice(0, 4);
  const faqsHtml = await Promise.all(
    servicio.faqs.map(async (f) => ({ q: f.q, html: await marked.parse(f.a) })),
  );

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: servicio.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: textoPlano(f.a) },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd(servicio)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbServicioJsonLd(servicio)),
        }}
      />

      <header className="pb-12 pt-[calc(74px+4.5rem)]">
        <div
          className={`container-site grid items-center gap-10 ${
            fotoServicio(servicio.slug) ? "lg:grid-cols-2" : ""
          }`}
        >
          <div>
            <nav aria-label="Migas" className="mb-4 text-[0.8rem] text-mutedink">
              <Link href="/" className="hover:text-brand">
                Inicio
              </Link>{" "}
              ·{" "}
              <Link href="/servicios" className="hover:text-brand">
                Servicios
              </Link>{" "}
              · <span>{servicio.nombre}</span>
            </nav>
            <h1 className="mb-5 text-[clamp(2rem,4.5vw,3.2rem)]">{servicio.h1}</h1>
            {servicio.intro.map((p) => (
              <p key={p.slice(0, 30)} className="mb-4 text-mutedink">
                {p}
              </p>
            ))}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="#formulario" className="btn-primary">
                Pedir presupuesto
              </Link>
            </div>
          </div>
          {fotoServicio(servicio.slug) && (
            <div className="relative min-h-[300px] overflow-hidden rounded-[28px] shadow-deep lg:min-h-[400px]">
              <Image
                src={fotoServicio(servicio.slug)!}
                alt={servicio.nombre}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>
      </header>

      <section className="bg-soft py-16">
        <div className="container-site grid gap-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Qué incluye</p>
            <h2 className="h-sec">{servicio.incluyeH2}</h2>
            <ul className="space-y-3">
              {servicio.puntos.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-1 grid h-5 w-5 flex-none place-items-center rounded-full bg-accent text-white">
                    <Check size={13} aria-hidden />
                  </span>
                  <span className="text-mutedink">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <AreaServicio />
        </div>
      </section>

      <section className="py-16">
        <div className="container-site">
          <div className="post-body max-w-none">
            {faqsHtml.map((f) => (
              <article key={f.q}>
                <h2>{f.q}</h2>
                <div dangerouslySetInnerHTML={{ __html: f.html }} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white py-16">
        <div className="container-site">
          <div id="formulario" className="mx-auto max-w-[560px]">
            <p className="eyebrow">Presupuesto</p>
            <h2 className="h-sec">Cuéntanos tu caso</h2>
            <ContactForm compact />
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="bg-soft py-20">
          <div className="container-site">
            <div className="mx-auto mb-10 max-w-[640px] text-center">
              <p className="eyebrow justify-center">Del taller</p>
              <h2 className="h-sec">Últimos artículos</h2>
            </div>
            <CarruselPosts posts={posts} />
            <p className="mt-8 text-center">
              <Link href="/blog" className="font-semibold text-brand hover:text-accent">
                Ver el blog
              </Link>
            </p>
          </div>
        </section>
      )}

      <section className="border-t border-line bg-white py-14">
        <div className="container-site">
          <h2 className="mb-6 text-[1.3rem]">Otros servicios</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {otros.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/servicios/${s.slug}`}
                  className="block rounded-2xl border border-line bg-page p-4 text-[0.95rem] font-medium transition-colors hover:border-brand hover:text-brand"
                >
                  {s.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
