import type { NextConfig } from "next";

/**
 * Next 16.3.3 — configuración mínima del andamiaje.
 * `output: 'standalone'` SOLO fuera de Vercel (en Vercel rompe el build con Next 16.3).
 */
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "neotermica.com" },
      { protocol: "https", hostname: "www.neotermica.com" },
      { protocol: "https", hostname: "roxsbwhqhqvajvfszeue.supabase.co" },
    ],
  },
};

export default nextConfig;
