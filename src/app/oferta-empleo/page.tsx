import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import JobForm from "@/components/forms/JobForm";
import { EMPLEO_FAQS } from "@/lib/empleo";
import { IMG } from "@/lib/images";
import { breadcrumbEmpleoJsonLd, jobPostingJsonLd } from "@/lib/structuredData";

const TITLE = "Oferta de empleo: instalador de aire acondicionado en Murcia";
const DESCRIPTION =
  "Trabajo de instalación de aire acondicionado en Murcia. Oferta de empleo en Neotérmica: oficio, formación y experiencia. Apúntate si quieres trabajar con nosotros.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/oferta-empleo" },
  openGraph: {
    title: `${TITLE} | Neotérmica`,
    description: DESCRIPTION,
    url: "/oferta-empleo",
    type: "website",
    locale: "es_ES",
    siteName: "Neotérmica",
    images: [
      {
        url: IMG.heroEmpleo,
        width: 1536,
        height: 1024,
        alt: "Dos instaladores de climatización al final de una obra de aire acondicionado",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Neotérmica`,
    description: DESCRIPTION,
    images: [IMG.heroEmpleo],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: EMPLEO_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const PUNTOS = [
  "Instalación de aire acondicionado (splits y conductos) en viviendas y locales.",
  "Reparación, revisión y renovación de climatización.",
  "Trabajo a pie de obra en Murcia y unos 50 km.",
  "Equipo de oficio, no una centralita: se sale a instalar.",
];

export default function OfertaEmpleoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbEmpleoJsonLd()) }}
      />

      <header className="pb-12 pt-[calc(74px+4.5rem)]">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2">
          <div>
            <nav aria-label="Migas" className="mb-4 text-[0.8rem] text-mutedink">
              <Link href="/" className="hover:text-brand">
                Inicio
              </Link>{" "}
              · <span>Oferta de empleo</span>
            </nav>
            <p className="eyebrow">Trabajo en climatización</p>
            <h1 className="mb-4 text-[clamp(2rem,4.5vw,3.2rem)]">
              Oferta de empleo: instalador de aire acondicionado en Murcia
            </h1>
            <p className="lead mb-4">
              ¿Quieres trabajar con nosotros? Neotérmica busca gente de oficio para
              instalación y reparación de aire acondicionado y climatización en Murcia
              capital, pedanías y un radio de unos 50 km.
            </p>
            <p className="lead mb-7">
              No es una bolsa genérica: es una plaza de taller. Cuéntanos formación,
              años de experiencia y edad. José Carlos revisa las solicitudes y llama
              si encaja.
            </p>
            <Link href="#formulario" className="btn-primary">
              Quiero trabajar con vosotros
            </Link>
          </div>
          <div className="relative min-h-[300px] overflow-hidden rounded-[28px] shadow-deep lg:min-h-[400px]">
            <Image
              src={IMG.heroEmpleo}
              alt="Dos instaladores de climatización, uniformados, al final de una instalación de aire acondicionado"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </header>

      <section className="bg-soft py-16">
        <div className="container-site grid gap-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow">El puesto</p>
            <h2 className="h-sec">Qué implica el trabajo de instalación</h2>
            <ul className="space-y-3">
              {PUNTOS.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-1 grid h-5 w-5 flex-none place-items-center rounded-full bg-accent text-white">
                    <Check size={13} aria-hidden />
                  </span>
                  <span className="text-mutedink">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Murcia</p>
            <h2 className="h-sec">Zona de la oferta de empleo</h2>
            <p className="text-mutedink">
              El trabajo es en Murcia y alrededores: El Palmar, La Alberca, Molina de
              Segura, Alcantarilla… Si vives más lejos, dilo en el formulario. No
              prometemos Cartagena ni la costa.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-site">
          <div className="post-body max-w-none">
            {EMPLEO_FAQS.map((f) => (
              <article key={f.q}>
                <h2>{f.q}</h2>
                <p>{f.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white py-16">
        <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Candidatura</p>
            <h2 className="h-sec">Cuéntanos tu oficio</h2>
            <p className="lead">
              Formación, experiencia y edad nos sirven para cribar. Si buscas
              presupuesto para tu casa, este no es el sitio: usa{" "}
              <Link href="/contacto#formulario" className="text-brand underline">
                el formulario de contacto
              </Link>
              .
            </p>
          </div>
          <JobForm />
        </div>
      </section>
    </>
  );
}
