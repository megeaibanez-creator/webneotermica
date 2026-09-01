import { AREA_SERVED } from "@/lib/coverage";
import { EMPRESA, SITE_URL } from "@/lib/site";
import type { Servicio } from "@/lib/servicios";

/**
 * JSON-LD. Sin calle, CP ni coordenadas de local: la empresa no publica dirección
 * y no la inventamos. NAP = teléfono + email + Murcia.
 */

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    "@id": `${SITE_URL}/#organizacion`,
    name: EMPRESA.nombre,
    url: SITE_URL,
    telephone: "+34678495046",
    email: EMPRESA.email,
    foundingDate: String(EMPRESA.fundacion),
    founder: { "@type": "Person", name: EMPRESA.fundador },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Murcia",
      addressRegion: "Región de Murcia",
      addressCountry: "ES",
    },
    areaServed: AREA_SERVED.map((name) => ({ "@type": "Place", name })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "14:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "15:30",
        closes: "19:00",
      },
    ],
  };
}

export function serviceJsonLd(servicio: Servicio) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: servicio.nombre,
    serviceType: servicio.nombre,
    description: servicio.metaDescription,
    url: `${SITE_URL}/servicios/${servicio.slug}`,
    provider: { "@id": `${SITE_URL}/#organizacion` },
    areaServed: AREA_SERVED.map((name) => ({ "@type": "Place", name })),
  };
}

export function breadcrumbServicioJsonLd(servicio: Servicio) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Servicios", item: `${SITE_URL}/servicios` },
      {
        "@type": "ListItem",
        position: 3,
        name: servicio.nombre,
        item: `${SITE_URL}/servicios/${servicio.slug}`,
      },
    ],
  };
}
