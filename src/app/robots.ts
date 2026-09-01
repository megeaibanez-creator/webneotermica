import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Molde Furgocasa: Allow general + 11 agentes de IA explícitos.
 * OAI-SearchBot es el que habilita las citas en ChatGPT Search: no bloquearlo.
 */
const IA_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Google-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "meta-externalagent",
];

const DISALLOW = ["/administrator", "/api", "/auth", "/preview", "/draft"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...IA_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
