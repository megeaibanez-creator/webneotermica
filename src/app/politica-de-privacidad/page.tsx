import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { EMPRESA } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo trata Neotérmica Climatización los datos personales que se envían por el formulario de contacto o por el asistente de la web.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/politica-de-privacidad" },
};

export default function PrivacidadPage() {
  return (
    <LegalPage titulo="Política de privacidad">
      <p>
        Esta política explica qué datos personales tratamos, para qué y durante cuánto
        tiempo, conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018
        (LOPDGDD).
      </p>

      <h2>Responsable</h2>
      <p>
        {EMPRESA.nombre} · {EMPRESA.telefono} · {EMPRESA.email}. Los datos
        identificativos completos (NIF y domicilio) están pendientes de incorporar en el{" "}
        <Link href="/aviso-legal">aviso legal</Link>.
      </p>

      <h2>Qué datos tratamos</h2>
      <ul>
        <li>
          <b>Formulario de contacto:</b> nombre, teléfono, email y, si los facilitas,
          empresa, municipio, servicio de interés, cómo nos has conocido y el mensaje.
        </li>
        <li>
          <b>Asistente de la web:</b> las preguntas y respuestas de la conversación, con
          un identificador de sesión. No pedimos datos identificativos en el chat.
        </li>
        <li>
          <b>Analítica:</b> datos de uso agregados, solo si aceptas las cookies
          analíticas.
        </li>
      </ul>

      <h2>Para qué</h2>
      <ul>
        <li>Responder a tu consulta y preparar un presupuesto.</li>
        <li>Gestionar la relación como cliente si el trabajo se contrata.</li>
        <li>Mejorar la web y el asistente a partir de conversaciones anónimas.</li>
      </ul>

      <h2>Base legal</h2>
      <p>
        El consentimiento que prestas al enviar el formulario, y el interés legítimo en
        atender consultas y en mantener la seguridad del sitio. Para la analítica, tu
        consentimiento en el aviso de cookies.
      </p>

      <h2>Conservación</h2>
      <p>
        Conservamos los datos del formulario mientras dure la consulta y, después, el
        tiempo necesario para atender responsabilidades legales. Puedes pedir su
        supresión en cualquier momento.
      </p>

      <h2>Destinatarios</h2>
      <p>
        No vendemos ni cedemos datos. Usamos proveedores tecnológicos que actúan como
        encargados del tratamiento: alojamiento y base de datos, correo electrónico y,
        para el asistente, un proveedor de modelos de lenguaje. Todos ellos tratan los
        datos siguiendo nuestras instrucciones.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Puedes ejercer los derechos de acceso, rectificación, supresión, oposición,
        limitación y portabilidad escribiendo a{" "}
        <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a>. También puedes
        reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).
      </p>

      <h2>Cookies</h2>
      <p>
        El detalle está en la <Link href="/politica-de-cookies">política de cookies</Link>.
      </p>
    </LegalPage>
  );
}
