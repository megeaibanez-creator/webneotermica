import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RefreshCw, Snowflake } from "lucide-react";
import Thermostat from "@/components/home/Thermostat";
import Calculadora from "@/components/home/Calculadora";
import BannerEstancias from "@/components/estancias/BannerEstancias";
import CarruselPosts from "@/components/blog/CarruselPosts";
import { SERVICIOS } from "@/lib/servicios";
import { getPublishedPosts } from "@/lib/blog";
import { EMPRESA, RESENAS_GOOGLE } from "@/lib/site";
import { IMG, MARCAS, fotoServicio } from "@/lib/images";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Neotérmica: tu empresa de climatización en Murcia" },
  description:
    "Empresa de climatización en Murcia y 50 km: instalación, reparación y renovación de aire acondicionado, aerotermia, suelo radiante, calderas, radiadores y ventilación. Desde 2012.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Neotérmica: tu empresa de climatización en Murcia",
    description:
      "Instalación, reparación y renovación de climatización en Murcia. Certificación del Ministerio de Industria. Desde 2012.",
    url: "/",
    type: "website",
    locale: "es_ES",
    siteName: "Neotérmica",
  },
};

const PROYECTOS = [IMG.slider1, IMG.slider2, IMG.slider3, IMG.heroServicios, IMG.trayectoria];

export default async function HomePage() {
  const destacados = (await getPublishedPosts()).slice(0, 3);

  return (
    <>
      {/* 1 · HERO */}
      <header className="overflow-x-clip pb-8 pt-[calc(74px+5.2rem)] lg:pb-16">
        <div className="container-site grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-soft py-1.5 pl-1.5 pr-3.5 text-[0.78rem] text-brand-dark">
              <b className="rounded-full bg-accent px-2.5 py-0.5 font-display text-[0.7rem] text-white">
                +20
              </b>
              años · Murcia y 50 km
            </span>
            <h1 className="mb-5 text-[clamp(2.2rem,5vw,3.7rem)] text-ink">
              Tu empresa de{" "}
              <span style={{ color: "var(--clima)" }}>
                climatización
                <br />
                en Murcia
              </span>
            </h1>
            <p className="mb-4 max-w-[40rem] text-[1.15rem] font-medium text-ink">
              Confía la temperatura de tu hogar o empresa a nuestros profesionales.
            </p>
            <p className="mb-8 max-w-[40rem] text-[1.1rem] text-mutedink">
              Instalación, reparación y renovación en Murcia capital, pedanías y un
              radio de unos 50 km. Más de 20 años de oficio y certificación del
              Ministerio de Industria.
            </p>
            <div className="mb-7 flex flex-wrap gap-3">
              <Link href="#servicios" className="btn-primary">
                Ver servicios
              </Link>
            </div>
            <dl className="flex flex-wrap gap-8">
              {[
                ["2012", "Nace Neotérmica"],
                ["20+", "Años de oficio"],
                ["50 km", "Radio desde Murcia"],
              ].map(([dato, texto]) => (
                <div key={texto}>
                  <dt className="font-display text-[1.35rem] font-bold">{dato}</dt>
                  <dd className="text-[0.78rem] text-mutedink">{texto}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative min-h-[560px] overflow-hidden rounded-[28px] shadow-deep lg:-mr-[8vw] lg:min-h-[620px] lg:rounded-r-none xl:min-h-[680px]">
            <Image
              src={IMG.heroInicio}
              alt="Técnico de Neotérmica trabajando en una instalación de climatización"
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
              priority
            />
            <div className="absolute left-4 top-4 z-[2] rounded-2xl bg-white p-3.5 text-[0.78rem] shadow-card lg:bottom-4 lg:top-auto">
              <b className="block font-display">Certificación</b>
              Ministerio de Industria
            </div>
            <Thermostat />
          </div>
        </div>
      </header>

      {/* 2 · TRABAJOS */}
      <section className="pb-16 pt-8 lg:py-16">
        <div className="container-site">
          <p className="eyebrow">Aire acondicionado en Murcia</p>
          <h2 className="h-sec">Nuestros trabajos</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <article className="card card-hover">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-soft text-brand">
                <Snowflake size={22} aria-hidden />
              </span>
              <h3 className="mb-2 text-[1.4rem]">Instalación</h3>
              <p className="mb-4 text-mutedink">
                Más de 20 años instalando aire acondicionado, calderas, radiadores,
                aerotermia y suelo radiante en viviendas y espacios de trabajo.
              </p>
              <Link
                href="/servicios"
                className="font-display text-[0.82rem] font-semibold text-accent"
              >
                Más información →
              </Link>
            </article>
            <article className="card card-hover">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-soft text-brand">
                <RefreshCw size={22} aria-hidden />
              </span>
              <h3 className="mb-2 text-[1.4rem]">Reparación y renovación</h3>
              <p className="mb-4 text-mutedink">
                Revisión y renovación periódica de los equipos. Si hay una avería, un
                técnico te atiende en Murcia y su área metropolitana.
              </p>
              <Link
                href="/servicios/reparacion-mantenimiento"
                className="font-display text-[0.82rem] font-semibold text-accent"
              >
                Más información →
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* 3 · VALORES */}
      <section className="bg-gradient-to-br from-[#1b2a38] to-[#0f1a24] py-20 text-white">
        <div className="container-site">
          <p className="eyebrow !text-brand-light">Por qué Neotérmica</p>
          <h2 className="h-sec">
            Nuestra profesionalidad,
            <br />
            <span className="text-brand-light">reflejo de nuestra experiencia</span>
          </h2>
          <p className="mb-6 max-w-[40rem] text-[#b8c6d3]">
            El trabajo de Neotérmica es fruto de una trayectoria larga en climatización.
            Garantizamos durabilidad en cada instalación y un trato cercano de principio
            a fin. Formalidad, puntualidad y profesionalidad: lo que nos diferencia y lo
            que pedimos a cada obra.
          </p>
          <ul className="flex flex-wrap gap-2">
            {["Formalidad", "Puntualidad", "Profesionalidad", "Murcia + 50 km"].map(
              (p) => (
                <li
                  key={p}
                  className="rounded-full border border-white/20 px-4 py-1.5 text-[0.82rem]"
                >
                  {p}
                </li>
              )
            )}
          </ul>
        </div>
      </section>

      {/* 4 · HOGAR O EMPRESA + calculadora (horquilla; % a contrastar con José Carlos) */}
      <section id="presupuesto" className="bg-soft py-20 lg:py-24">
        <div className="container-site grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow">Hogar o empresa</p>
            <h2 className="h-sec">¿Qué espacio quieres climatizar?</h2>
            <p className="lead">
              Elige el espacio, lo que tienes ahora y si buscas solo frío o también
              calor y agua caliente. Te damos una horquilla, no un presupuesto: el
              número fino lo vemos en la visita.
            </p>
          </div>
          <Calculadora />
        </div>
      </section>

      <section className="border-t border-line bg-page py-20 lg:py-24">
        <div className="container-site">
          <BannerEstancias />
        </div>
      </section>

      {/* 5 · SERVICIOS */}
      <section id="servicios" className="scroll-mt-28 py-20">
        <div className="container-site">
          <div className="mx-auto mb-10 max-w-[640px] text-center">
            <p className="eyebrow justify-center">Climatización en Murcia</p>
            <h2 className="h-sec">Conoce nuestros servicios</h2>
            <p className="lead mx-auto">
              Ocho oficios, uno por cada cosa que sabemos hacer. En Murcia capital, sus
              pedanías y el área metropolitana.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICIOS.map((s) => {
              const foto = fotoServicio(s.slug);
              return (
                <Link
                  key={s.slug}
                  href={`/servicios/${s.slug}`}
                  className="group relative flex min-h-[240px] items-end overflow-hidden rounded-[20px] p-5 text-white shadow-card"
                >
                  {foto ? (
                    <Image
                      src={foto}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="absolute inset-0 bg-gradient-to-br from-brand-dark to-ink" />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink/90" />
                  <h3 className="relative z-[1] text-[1.15rem]">{s.nombre}</h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6 · MARCAS — 4 visibles, el resto entra en el carrusel continuo */}
      <section className="border-y border-line bg-white py-16" aria-label="Marcas">
        <div className="container-site">
          <h2 className="mb-10 text-center text-[clamp(1.35rem,2.4vw,1.7rem)] text-brand-dark">
            Marcas de aire con las que trabajamos
          </h2>
          <div className="marcas-viewport">
            <ul className="marcas-track">
              {[...MARCAS, ...MARCAS].map((marca, i) => (
                <li
                  key={`${marca.nombre}-${i}`}
                  className="marcas-item"
                  aria-hidden={i >= MARCAS.length}
                >
                  <Image
                    src={marca.src}
                    alt={i < MARCAS.length ? marca.nombre : ""}
                    width={280}
                    height={120}
                    className="h-[72px] w-auto object-contain sm:h-[88px] lg:h-[100px]"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 7 · PROYECTOS */}
      <section className="py-20">
        <div className="container-site">
          <p className="eyebrow">Obra hecha</p>
          <h2 className="h-sec">Últimos proyectos de climatización</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
            {PROYECTOS.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className={`relative min-h-[200px] overflow-hidden rounded-[20px] shadow-card ${
                  i === 0 ? "lg:col-span-2 lg:row-span-2" : ""
                }`}
              >
                <Image
                  src={src}
                  alt="Instalación de climatización realizada por Neotérmica"
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 · OPINIONES */}
      <section className="bg-soft py-20">
        <div className="container-site">
          <div className="mx-auto mb-10 max-w-[640px] text-center">
            <p className="eyebrow justify-center">Opiniones de clientes</p>
            <h2 className="h-sec">Lo que dicen de nosotros</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {RESENAS_GOOGLE.map((r) => (
              <article key={`${r.autor}-${r.fecha}`} className="card flex flex-col">
                <div className="mb-3 tracking-[2px] text-[#f5a623]" aria-label="5 de 5">
                  ★★★★★
                </div>
                <p className="flex-1">«{r.texto}»</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand to-accent font-display font-bold text-white">
                    {r.autor.charAt(0)}
                  </span>
                  <span>
                    <b className="font-display">{r.autor}</b>
                    <span className="block text-[0.8rem] text-mutedink">
                      Google · {r.fecha}
                    </span>
                  </span>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-8 text-center">
            <a
              href={EMPRESA.googlePerfil}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand hover:text-accent"
            >
              Ver más reseñas en Google
            </a>
          </p>
        </div>
      </section>

      {/* 9 · TRAYECTORIA */}
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[360px]">
          <Image
            src={IMG.trayectoria}
            alt="Trayectoria de Neotérmica en Murcia"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center bg-white px-[5vw] py-16 lg:px-14">
          <p className="eyebrow">Nuestra trayectoria</p>
          <h2 className="h-sec">Desde 2012 en Murcia</h2>
          <p className="lead mb-4">
            Neotérmica nace en 2012 de la trayectoria de su fundador y dueño,{" "}
            <b>{EMPRESA.fundador}</b>, con toda una vida instalando, reparando y
            renovando climatización en viviendas y espacios de trabajo.
          </p>
          <p className="lead mb-7">
            Un servicio cercano, atento y ajustado a lo que cada cliente necesita, con
            la certificación del Ministerio de Industria por delante.
          </p>
          <Link href="#servicios" className="btn-dark self-start">
            Ver servicios
          </Link>
        </div>
      </section>

      {destacados.length > 0 && (
        <section className="bg-soft py-20">
          <div className="container-site">
            <div className="mx-auto mb-10 max-w-[640px] text-center">
              <p className="eyebrow justify-center">Del taller</p>
              <h2 className="h-sec">Últimos artículos</h2>
            </div>
            <CarruselPosts posts={destacados} />
            <p className="mt-8 text-center">
              <Link href="/blog" className="font-semibold text-brand hover:text-accent">
                Ver el blog
              </Link>
            </p>
          </div>
        </section>
      )}
    </>
  );
}
