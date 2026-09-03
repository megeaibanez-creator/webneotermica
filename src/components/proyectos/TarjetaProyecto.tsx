import Image from "next/image";
import Link from "next/link";
import { fotoPortada, type Project } from "@/lib/crm";
import { añoDeObra, tituloPublico } from "@/lib/proyectos-publicos";
import { getServicio } from "@/lib/servicios";

type Props = {
  proyecto: Project;
  /** En el listado es h2; en la home, h3 bajo el título de sección. */
  tituloComo?: "h2" | "h3";
};

export default function TarjetaProyecto({ proyecto, tituloComo = "h2" }: Props) {
  const portada = fotoPortada(proyecto);
  const servicio = proyecto.service ? getServicio(proyecto.service) : undefined;
  const titulo = tituloPublico(proyecto);
  const Titulo = tituloComo;

  return (
    <Link
      href={`/proyectos/${proyecto.slug}`}
      className="card card-hover group flex flex-col !p-0 no-underline text-inherit"
    >
      <div className="relative h-48 overflow-hidden rounded-t-[20px] bg-gradient-to-br from-brand-dark to-ink">
        {portada && (
          <Image
            src={portada}
            alt={titulo}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-[0.72rem] uppercase tracking-[0.14em] text-brand">
          <span>{añoDeObra(proyecto)}</span>
          {servicio && (
            <>
              <span className="text-mutedink">·</span>
              <span>{servicio.nombre}</span>
            </>
          )}
          {proyecto.municipio && (
            <>
              <span className="text-mutedink">·</span>
              <span>{proyecto.municipio}</span>
            </>
          )}
        </p>
        <Titulo className="mb-2 text-[1.2rem]">{titulo}</Titulo>
        {proyecto.public_excerpt && (
          <p className="mb-4 flex-1 text-[0.92rem] text-mutedink">
            {proyecto.public_excerpt}
          </p>
        )}
        <span className="mt-auto font-display text-[0.85rem] font-semibold text-accent group-hover:underline">
          Ver el proyecto →
        </span>
      </div>
    </Link>
  );
}
