import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import OpenCookiePrefs from "@/components/cookies/OpenCookiePrefs";

export const metadata: Metadata = {
  title: "Política de cookies",
  description:
    "Qué cookies usa la web de Neotérmica Climatización, para qué sirven y cómo cambiar tu elección en cualquier momento.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/politica-de-cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPage titulo="Política de cookies">
      <p>
        Una cookie es un pequeño archivo que se guarda en tu dispositivo al visitar una
        web. Aquí usamos las mínimas y solo activamos las opcionales si tú lo aceptas.
      </p>

      <h2>Categorías</h2>
      <ul>
        <li>
          <b>Necesarias.</b> Hacen que la web funcione: seguridad, envío del formulario
          y memoria de tu propia elección sobre cookies. No se pueden desactivar.
        </li>
        <li>
          <b>Preferencias.</b> Recuerdan opciones tuyas, como el hilo abierto del
          asistente de la web.
        </li>
        <li>
          <b>Analíticas.</b> Medición agregada de las visitas (Google Analytics 4 o
          Google Tag Manager) para saber qué páginas resultan útiles. Solo se cargan con
          tu consentimiento.
        </li>
        <li>
          <b>Marketing.</b> Publicidad y medición de campañas. Hoy no hay campañas
          activas; la categoría queda preparada.
        </li>
      </ul>

      <h2>Consentimiento</h2>
      <p>
        Aplicamos el Consent Mode v2 de Google: hasta que decides, todo está denegado y
        no se carga ninguna etiqueta de medición. Tu elección se guarda en tu navegador
        y puedes cambiarla cuando quieras.
      </p>

      <p>
        <OpenCookiePrefs className="btn-primary">
          Configurar cookies
        </OpenCookiePrefs>
      </p>

      <h2>Cómo borrarlas desde el navegador</h2>
      <p>
        Todos los navegadores permiten ver y eliminar cookies desde sus ajustes de
        privacidad. Si las borras, volveremos a preguntarte en tu próxima visita.
      </p>
    </LegalPage>
  );
}
