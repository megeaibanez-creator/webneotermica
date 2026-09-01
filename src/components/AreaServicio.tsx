import Link from "next/link";
import { MapPin } from "lucide-react";
import { ANILLO, PEDANIAS, RADIO_50, RADIO_KM } from "@/lib/coverage";

/**
 * Bloque de cobertura reutilizable (landings, contacto, hub).
 * Los pueblos van en el copy; nunca en la URL.
 */
export default function AreaServicio() {
  return (
    <div className="rounded-4xl border border-line bg-white p-7 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-[1.3rem]">
        <MapPin size={20} className="text-accent" aria-hidden />
        Dónde trabajamos
      </h2>
      <p className="mb-3 text-mutedink">
        <b className="text-ink">Murcia capital y sus pedanías</b>: {PEDANIAS.join(", ")}
        , entre otras.
      </p>
      <p className="mb-3 text-mutedink">
        <b className="text-ink">Área metropolitana</b>: {ANILLO.join(", ")}.
      </p>
      <p className="mb-4 text-mutedink">
        <b className="text-ink">Hasta unos {RADIO_KM} km</b>: {RADIO_50.join(", ")}…
        Si estás más lejos, pregúntanos y te decimos con sinceridad si encaja.
      </p>
      <Link href="/contacto#donde-trabajamos" className="btn-ghost">
        Ver el mapa de cobertura
      </Link>
    </div>
  );
}
