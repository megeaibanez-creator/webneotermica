/** Oferta de empleo: opciones del formulario y cribado en el admin. */

export const PUESTOS = [
  "Instalador de aire acondicionado",
  "Ayudante de instalador",
  "Oficial de climatización",
  "Electricista",
  "Otro oficio del taller",
] as const;

export const FORMACIONES = [
  "FP de climatización / frío",
  "FP de electricidad",
  "Carnet de instalador / RITE",
  "Curso de oficios, sin titulación",
  "Otra formación",
] as const;

export const EXPERIENCIAS = [
  "Sin experiencia (se forma en el taller)",
  "Menos de 1 año",
  "1–2 años",
  "3–5 años",
  "6–10 años",
  "Más de 10 años",
] as const;

export const EDADES = [
  "Menos de 25",
  "25–34",
  "35–44",
  "45–54",
  "55 o más",
] as const;

export const DISPONIBILIDADES = [
  "Inmediata",
  "En 15 días",
  "En un mes",
  "Más adelante",
] as const;

export const ESTADOS_CANDIDATO = [
  { value: "new", label: "Nuevo" },
  { value: "reviewed", label: "Revisado" },
  { value: "interview", label: "Entrevista" },
  { value: "hired", label: "Contratado" },
  { value: "discarded", label: "Descartado" },
  { value: "spam", label: "Spam" },
] as const;

export const EMPLEO_FAQS: { q: string; a: string }[] = [
  {
    q: "¿Hay oferta de empleo de instalador de aire acondicionado en Murcia?",
    a: "Sí. Neotérmica busca gente de oficio para instalación y reparación de climatización en Murcia capital, pedanías y unos 50 km. Si quieres trabajar con nosotros, rellena el formulario de esta página.",
  },
  {
    q: "¿Qué formación hace falta para el trabajo de instalación?",
    a: "Encaja quien viene de FP de climatización o electricidad, con carnet de instalador o RITE, o quien ya ha montado equipos en obra. Si no tienes titulación pero sí oficio, cuéntalo: se valora el trabajo real.",
  },
  {
    q: "¿Se necesita experiencia?",
    a: "Se valora. También miramos a quien empiece y quiera formarse en el taller. En el formulario indica los años y qué has instalado (splits, conductos, aerotermia…).",
  },
  {
    q: "¿Dónde se trabaja?",
    a: "A pie de obra en Murcia y un radio de unos 50 km. No hay atención al público en una oficina. Hace falta moverse entre viviendas y locales.",
  },
  {
    q: "¿Cómo me apunto a la oferta de empleo?",
    a: "Con el formulario de esta página: nombre, teléfono, email, municipio, formación, años de experiencia y edad. José Carlos lo revisa y os llamamos si encaja.",
  },
];

export function enLista(valor: string, lista: readonly string[]): boolean {
  return (lista as readonly string[]).includes(valor);
}
