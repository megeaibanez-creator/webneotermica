import type { Metadata, Viewport } from "next";
import Script from "next/script";
import AdminChrome from "@/components/admin/AdminChrome";

export const metadata: Metadata = {
  title: "Administración",
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script id="sw-register" strategy="afterInteractive">
        {`if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}`}
      </Script>
      <AdminChrome>{children}</AdminChrome>
    </>
  );
}
