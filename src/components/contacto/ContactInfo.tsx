import { Clock, Mail, MapPin } from "lucide-react";
import { EMPRESA } from "@/lib/site";
import { ANILLO, PEDANIAS } from "@/lib/coverage";

/**
 * En /contacto no se publica teléfono ni WhatsApp: el canal es el formulario.
 * No hay calle ni CP publicados: no se inventan.
 */
export default function ContactInfo() {
  const items = [
    {
      icon: Mail,
      titulo: EMPRESA.email,
      texto: "Escríbenos cuando quieras",
      href: `mailto:${EMPRESA.email}`,
    },
    {
      icon: Clock,
      titulo: "Horario",
      texto: EMPRESA.horario,
    },
    {
      icon: MapPin,
      titulo: "Murcia ciudad",
      texto: `Capital y pedanías (${PEDANIAS.join(", ")}), área metropolitana (${ANILLO.join(
        ", "
      )}) y un radio de unos 50 km. Más lejos, pregunta si encaja.`,
    },
  ];

  return (
    <ul className="space-y-4">
      {items.map(({ icon: Icon, titulo, texto, href }) => (
        <li key={titulo} className="flex items-start gap-4">
          <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[14px] bg-soft text-brand">
            <Icon size={20} aria-hidden />
          </span>
          <div>
            {href ? (
              <a href={href} className="font-display font-bold hover:text-accent">
                {titulo}
              </a>
            ) : (
              <b className="font-display">{titulo}</b>
            )}
            <span className="block text-[0.9rem] text-mutedink">{texto}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
