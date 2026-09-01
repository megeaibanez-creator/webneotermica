import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { formatFecha, getPost, getPublishedPosts } from "@/lib/blog";
import { getServicio } from "@/lib/servicios";
import { EMPRESA, SITE_URL } from "@/lib/site";
import BannerEstancias from "@/components/estancias/BannerEstancias";
import CarruselPosts from "@/components/blog/CarruselPosts";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPublishedPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Artículo no encontrado" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      locale: "es_ES",
      siteName: "Neotérmica",
      ...(post.cover ? { images: [{ url: post.cover }] } : {}),
    },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const html = await marked.parse(post.content);
  const servicio = post.servicio ? getServicio(post.servicio) : undefined;
  const resto = (await getPublishedPosts()).filter((p) => p.slug !== post.slug);
  const delOficio = post.servicio
    ? resto.filter((p) => p.servicio === post.servicio)
    : [];
  const otros = [...delOficio, ...resto.filter((p) => !delOficio.includes(p))].slice(0, 3);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: "es-ES",
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    author: { "@type": "Organization", name: EMPRESA.nombre },
    publisher: { "@id": `${SITE_URL}/#organizacion` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="pt-[calc(74px+4.5rem)]">
        <div className={`container-site ${otros.length > 0 ? "pb-4" : "pb-16"}`}>
          <nav aria-label="Migas" className="mb-4 text-[0.8rem] text-mutedink">
            <Link href="/" className="hover:text-brand">
              Inicio
            </Link>{" "}
            ·{" "}
            <Link href="/blog" className="hover:text-brand">
              Blog
            </Link>
          </nav>
          <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-[0.75rem] uppercase tracking-[0.14em] text-brand">
            <time dateTime={post.date}>{formatFecha(post.date)}</time>
            {servicio && (
              <>
                <span className="text-mutedink">·</span>
                <Link href={`/servicios/${servicio.slug}`} className="hover:text-accent">
                  {servicio.nombre}
                </Link>
              </>
            )}
          </p>
          <h1 className="mb-5 text-[clamp(1.9rem,4vw,2.8rem)]">{post.title}</h1>
          <p className="mb-8 text-[1.08rem] leading-relaxed text-mutedink">{post.description}</p>
          {post.cover && (
            <figure className="relative mb-10 aspect-[16/9] overflow-hidden rounded-[20px]">
              <Image
                src={post.cover}
                alt=""
                fill
                sizes="(min-width:1100px) 1100px, 90vw"
                className="object-cover"
                priority
              />
            </figure>
          )}

          <div className="post-body" dangerouslySetInnerHTML={{ __html: html }} />

          <div className="mt-12">
            <BannerEstancias compact />
          </div>

          <aside className="mt-12 rounded-4xl border border-line bg-white p-7 shadow-card">
            <h2 className="mb-2 text-[1.25rem]">
              ¿Necesitas que lo veamos en tu casa o en tu local?
            </h2>
            <p className="mb-5 text-mutedink">
              Somos Neotérmica, climatización en Murcia desde 2012. Te damos
              presupuesto sin compromiso.
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

        {otros.length > 0 && (
          <section className="mt-16 border-t border-line bg-soft pb-16 pt-14">
            <div className="container-site">
              <p className="eyebrow">Del taller</p>
              <h2 className="h-sec mb-8">Sigue leyendo</h2>
              <CarruselPosts posts={otros} />
            </div>
          </section>
        )}
      </article>
    </>
  );
}
