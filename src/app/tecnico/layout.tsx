import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { redirect } from "next/navigation";
import { getStaffActual } from "@/lib/staff";
import TecnicoChrome from "@/components/tecnico/TecnicoChrome";

export const metadata: Metadata = {
  title: "Mi agenda · Neotérmica",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  applicationName: "Neotérmica",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Neotérmica",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#cb0a3d",
};

export const dynamic = "force-dynamic";

export default async function TecnicoLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaffActual();
  if (!staff) redirect("/administrator/login");
  return (
    <>
      <Script id="sw-register" strategy="afterInteractive">
        {`if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}`}
      </Script>
      <TecnicoChrome nombre={staff.nombre}>{children}</TecnicoChrome>
    </>
  );
}
