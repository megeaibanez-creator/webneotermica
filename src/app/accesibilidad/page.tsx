import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { EMPRESA } from "@/lib/site";

export const metadata: Metadata = {
  title: "Accesibilidad",
  description:
    "Compromiso de accesibilidad de la web de Neotérmica Climatización y cómo avisarnos si algo no se puede usar bien.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/accesibilidad" },
};

export default function AccesibilidadPage() {
  return (
    <LegalPage titulo="Accesibilidad">
      <p>
        Queremos que esta web se pueda usar con cualquier dispositivo y con productos de
        apoyo. Tomamos como referencia las pautas WCAG 2.1 en nivel AA.
      </p>

      <h2>Qué hemos tenido en cuenta</h2>
      <ul>
        <li>Estructura de encabezados ordenada y navegación por teclado.</li>
        <li>Contraste suficiente entre texto y fondo.</li>
        <li>Textos alternativos en las imágenes que aportan información.</li>
        <li>Formularios con etiquetas asociadas y mensajes de error claros.</li>
        <li>Respeto por la preferencia de movimiento reducido del sistema.</li>
        <li>El mapa de cobertura tiene una descripción equivalente en texto.</li>
      </ul>

      <h2>Limitaciones conocidas</h2>
      <p>
        El mapa interactivo y algunos elementos decorativos pueden no ser plenamente
        operables con productos de apoyo. La información que contienen está siempre
        disponible en texto en la página de contacto.
      </p>

      <h2>Avísanos</h2>
      <p>
        Si encuentras una barrera, escríbenos a{" "}
        <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a> o llámanos al{" "}
        {EMPRESA.telefono}. Lo corregimos y te contamos cómo.
      </p>
    </LegalPage>
  );
}
