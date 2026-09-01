import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AreaServicio from "@/components/AreaServicio";
import { SERVICIOS } from "@/lib/servicios";
import { IMG, fotoServicio } from "@/lib/images";

export const metadata: Metadata = {
  title: "Climatización: servicios en Murcia",
  description:
    "Todos los servicios de climatización de Neotérmica en Murcia: splits, conductos, aerotermia, suelo radiante, calderas, radiadores, ventilación y reparación.",
  alternates: { canonical: "/servicios" },
  openGraph: {
    title: "Climatización: servicios en Murcia",
    description:
      "Instalación, reparación y renovación de climatización en Murcia y 50 km a la redonda.",
    url: "/servicios",
    type: "website",
    locale: "es_ES",
    siteName: "Neotérmica",
  },
};

export default function ServiciosPage() {
  return (
    <>
      <header className="relative isolate overflow-hidden pb-14 pt-[calc(74px+4.5rem)]">
        <Image
          src={IMG.heroServicios}
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover opacity-15"
          aria-hidden
        />
        <div className="container-site">
          <p className="eyebrow">Servicios</p>
          <h1 className="mb-4 text-[clamp(2rem,4.5vw,3.2rem)]">
            Climatización en Murcia, oficio por oficio
          </h1>
          <p className="lead">
            Instalamos, reparamos y renovamos. Elige el trabajo que necesitas y te
            contamos qué incluye, para quién encaja y cómo lo hacemos. Si no lo tienes
            claro,{" "}
            <Link href="/contacto#formulario" className="font-semibold text-accent">
              pide presupuesto
            </Link>{" "}
            y lo vemos.
          </p>
        </div>
      </header>

      <section className="pb-16">
        <div className="container-site grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICIOS.map((s) => (
            <article key={s.slug} className="card card-hover flex flex-col !p-0">
              <div className="relative h-40 overflow-hidden rounded-t-[20px] bg-gradient-to-br from-brand-dark to-ink">
                {fotoServicio(s.slug) && (
                  <Image
                    src={fotoServicio(s.slug)!}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h2 className="mb-2 text-[1.25rem]">{s.nombre}</h2>
                <p className="mb-4 flex-1 text-[0.92rem] text-mutedink">{s.corto}</p>
                <Link
                  href={`/servicios/${s.slug}`}
                  className="font-display text-[0.85rem] font-semibold text-accent"
                >
                  Ver el servicio →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-20">
        <div className="container-site">
          <AreaServicio />
        </div>
      </section>
    </>
  );
}
