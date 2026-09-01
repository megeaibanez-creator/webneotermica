import type { MetadataRoute } from "next";
import { SERVICIOS } from "@/lib/servicios";
import { getPublishedPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

/**
 * Solo lo indexable: home, hub, 8 landings, blog y sus posts publicados, contacto.
 * Fuera: /administrator, /api y las páginas legales (noindex).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hoy = new Date();

  const estaticas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: hoy, changeFrequency: "monthly", priority: 1 },
    {
      url: `${SITE_URL}/estancias`,
      lastModified: hoy,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/servicios`,
      lastModified: hoy,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contacto`,
      lastModified: hoy,
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: hoy,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const landings: MetadataRoute.Sitemap = SERVICIOS.map((s) => ({
    url: `${SITE_URL}/servicios/${s.slug}`,
    lastModified: hoy,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  const posts: MetadataRoute.Sitemap = (await getPublishedPosts()).map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(`${p.date}T12:00:00`),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...estaticas, ...landings, ...posts];
}
