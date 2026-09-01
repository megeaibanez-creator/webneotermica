import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { EMPRESA } from "@/lib/site";

export const metadata: Metadata = {
  title: "Aviso legal",
  description:
    "Aviso legal de Neotérmica Climatización: titularidad del sitio, condiciones de uso y propiedad intelectual.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/aviso-legal" },
};

export default function AvisoLegalPage() {
  return (
    <LegalPage titulo="Aviso legal">
      <p>
        En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la
        Información y de Comercio Electrónico (LSSI-CE), se ponen a disposición del
        usuario los datos identificativos del titular de este sitio web.
      </p>

      <h2>Titular</h2>
      <ul>
        <li>
          <b>Denominación:</b> {EMPRESA.nombre}
        </li>
        <li>
          <b>Actividad:</b> instalación, reparación y renovación de sistemas de
          climatización.
        </li>
        <li>
          <b>Teléfono:</b> {EMPRESA.telefono}
        </li>
        <li>
          <b>Email:</b> {EMPRESA.email}
        </li>
        <li>
          <b>Ámbito de trabajo:</b> Murcia y alrededores (aproximadamente 50 km).
        </li>
      </ul>
      <p>
        <b>Pendiente de completar por el titular:</b> NIF/CIF, domicilio social y datos
        registrales. Estos datos son obligatorios en el aviso legal y deben añadirse
        antes de publicar la web. No se incluyen aquí porque no se inventan.
      </p>

      <h2>Condiciones de uso</h2>
      <p>
        El acceso a este sitio implica la aceptación de estas condiciones. El usuario se
        compromete a hacer un uso adecuado de los contenidos y a no emplearlos para
        actividades ilícitas o que puedan dañar los derechos de terceros o el propio
        funcionamiento del sitio.
      </p>

      <h2>Propiedad intelectual e industrial</h2>
      <p>
        Los textos, el diseño, el código, los logotipos y las imágenes de este sitio
        pertenecen a su titular o a terceros que han autorizado su uso. Queda prohibida
        su reproducción, distribución o transformación sin autorización expresa.
      </p>

      <h2>Responsabilidad</h2>
      <p>
        La información publicada tiene carácter orientativo. Los presupuestos, plazos y
        recomendaciones técnicas concretas se determinan siempre tras una valoración del
        caso. El titular no responde de los daños derivados de un uso indebido del sitio
        ni de las interrupciones ajenas a su control.
      </p>

      <h2>Enlaces</h2>
      <p>
        Este sitio puede enlazar a páginas de terceros. El titular no controla sus
        contenidos ni responde de ellos.
      </p>

      <h2>Legislación aplicable</h2>
      <p>
        Estas condiciones se rigen por la legislación española. Para cualquier
        controversia serán competentes los juzgados y tribunales que correspondan según
        la normativa aplicable.
      </p>
    </LegalPage>
  );
}
