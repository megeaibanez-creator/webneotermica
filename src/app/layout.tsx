import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Script from "next/script";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/layout/BackToTop";
import HideOnAdmin from "@/components/layout/HideOnAdmin";
import ChatWidget from "@/components/chatbot/ChatWidget";
import CookieBanner from "@/components/cookies/CookieBanner";
import Analytics from "@/components/cookies/Analytics";
import { localBusinessJsonLd } from "@/lib/structuredData";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | Neotérmica",
    default: "Neotérmica — Climatización en Murcia",
  },
  description:
    "Empresa de climatización en Murcia: instalación, reparación y renovación de aire acondicionado, aerotermia, suelo radiante, calderas, radiadores y ventilación.",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={spaceGrotesk.variable}>
      <body>
        {/* Consent Mode v2: default denied antes de cargar cualquier tag */}
        <Script id="consent-default" strategy="beforeInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{
  ad_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied',
  analytics_storage:'denied',
  functionality_storage:'denied',
  wait_for_update: 500
});`}
        </Script>

        <HideOnAdmin>
          <Header />
        </HideOnAdmin>
        <main>{children}</main>
        <HideOnAdmin also={["/estancias"]}>
          <Footer />
        </HideOnAdmin>
        <HideOnAdmin>
          <BackToTop />
          <ChatWidget />
          <CookieBanner />
          <Analytics />
        </HideOnAdmin>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd()),
          }}
        />
      </body>
    </html>
  );
}
