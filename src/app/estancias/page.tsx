import type { Metadata } from "next";
import Recorrido3D from "@/components/estancias/Recorrido3D";

export const metadata: Metadata = {
  title: "Estancias",
  description:
    "Recorre distintas estancias y ve cómo climatiza Neotérmica cada espacio: vivienda, oficina, local, clínica, gimnasio o nave industrial en Murcia.",
  alternates: { canonical: "/estancias" },
  openGraph: {
    title: "Estancias | Neotérmica",
    description:
      "Recorrido 3D por inmuebles y su climatización. Salón, dormitorio, oficina, bar, clínica, gimnasio y nave industrial.",
    url: "/estancias",
    type: "website",
    locale: "es_ES",
    siteName: "Neotérmica",
  },
};

export default function EstanciasPage() {
  return <Recorrido3D />;
}
