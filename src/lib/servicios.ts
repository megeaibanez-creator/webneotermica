/**
 * Las 8 landings de servicio (money pages).
 * URL = oficio, nunca servicio + pueblo (prohibido: doorway pages).
 */

export type Servicio = {
  slug: string;
  nombre: string;
  corto: string;
  /** Title SEO SIN "| Neotérmica" (lo añade el template del layout). */
  metaTitle: string;
  metaDescription: string;
  h1: string;
  /** H2 de la lista «qué incluye». */
  incluyeH2: string;
  intro: string[];
  puntos: string[];
  /** Preguntas = H2 en la ficha (molde del blog). Markdown en la respuesta. */
  faqs: { q: string; a: string }[];
};

export const SERVICIOS: Servicio[] = [
  {
    slug: "aire-acondicionado-splits",
    nombre: "Aire acondicionado por splits",
    corto: "Split y multisplit para viviendas y locales",
    metaTitle: "Instalación de aire acondicionado split en Murcia",
    metaDescription:
      "Instalación de aire acondicionado split y multi-split en Murcia y 50 km. Estudio de la vivienda, montaje certificado y presupuesto por el formulario.",
    h1: "Aire acondicionado por splits en Murcia",
    incluyeH2: "Qué incluye instalar un split en Murcia",
    intro: [
      "El split es la solución más habitual para climatizar una vivienda o un local en Murcia: rápida de instalar, eficiente y sin obra grande. Instalamos equipos split y multi-split dimensionados para cada estancia, con la potencia justa para el calor murciano.",
      "Más de 20 años instalando, reparando y renovando equipos nos permiten aconsejarte qué máquina encaja con tu casa o tu negocio, sin vender de más.",
      "Encaja en un piso, un chalet o un local cuando quieres climatizar una o varias habitaciones sin tocar techos. Trabajamos en Murcia capital, pedanías (El Palmar, La Alberca, Beniaján, Torreagüera, Guadalupe, Sangonera) y el anillo (Alcantarilla, Molina de Segura, Las Torres de Cotillas, Santomera, Beniel). Más lejos, hasta unos 50 km: pregunta si encaja.",
    ],
    puntos: [
      "Estudio previo de la estancia y la potencia necesaria",
      "Instalación limpia y certificada (Ministerio de Industria)",
      "Sustitución de equipos antiguos por unidades eficientes",
      "Reparación y revisión de splits de cualquier marca",
    ],
    faqs: [
      {
        q: "¿Split o multi-split: cuál encaja en tu vivienda?",
        a: "Un split independiente resuelve una estancia: salón, dormitorio o despacho. Un multi-split pone varias unidades interiores con una sola condensadora. Interesa cuando quieres climatizar dos o más habitaciones sin llenar la fachada, el balcón o el patio de máquinas.\n\nLa decisión no es de catálogo. Hay que ver qué estancias usas de verdad, si coinciden en horario, por dónde pasarán las tuberías y si la unidad exterior tiene sitio, desagüe y acceso. Lo vemos en visita y te lo dejamos escrito en el [presupuesto](/contacto#formulario).",
      },
      {
        q: "¿Cuánta potencia necesita un split en Murcia?",
        a: "Los metros cuadrados no bastan. En Murcia pesan la orientación, el aislamiento, el sol de la tarde, si la estancia es abierta a la cocina y cuántas personas la usan. Un dormitorio al norte no pide lo mismo que un salón con ventanal a oeste.\n\nDimensionamos el equipo para que alcance confort sin trabajar forzado. No te vendemos de más: un aparato sobredimensionado gasta y para mal; uno corto no llega en julio.",
      },
      {
        q: "¿Cuánto se tarda en instalar un split?",
        a: "Una instalación estándar de un split se resuelve normalmente en una mañana. Si hay que hacer un recorrido largo, desmontar un equipo antiguo o trabajar en un local en uso, puede alargarse. Te lo decimos en el presupuesto, no el día del montaje.",
      },
      {
        q: "¿Hace falta obra para poner un split?",
        a: "Casi nunca. Hay que pasar tuberías, cableado y desagüe, y fijar las dos unidades. No hace falta falso techo ni reformar la vivienda. Si la condensadora va en cubierta o el recorrido es complicado, lo vemos antes para no abrir de más.\n\nSi estás de reforma integral y quieres climatizar toda la casa de forma invisible, compara con el [aire por conductos](/servicios/aire-acondicionado-conductos).",
      },
      {
        q: "¿Instaláis splits fuera de Murcia capital?",
        a: "Sí. Cubrimos pedanías y el área metropolitana, y hasta unos 50 km. Cartagena y la costa son otro mercado: no ahora. Si estás en el límite del radio, [pregunta si encaja](/contacto#formulario).",
      },
      {
        q: "¿Y si el equipo que ya tienes no enfría?",
        a: "Primero se diagnostica. A veces es un filtro, un drenaje o una carga; otras, un equipo al final de su vida. Reparamos y revisamos splits de cualquier marca, los haya instalado quien los haya instalado. Si conviene renovar, te lo decimos con claridad.\n\nPara averías y revisiones periódicas está el servicio de [reparación y mantenimiento](/servicios/reparacion-mantenimiento).",
      },
      {
        q: "¿Cuándo conviene conductos o aerotermia en vez de splits?",
        a: "Los [conductos](/servicios/aire-acondicionado-conductos) encajan cuando hay (o va a haber) falso techo y quieres un solo sistema para varias estancias, con rejillas discretas. La [aerotermia](/servicios/aerotermia) entra cuando buscas calefacción, refrigeración y agua caliente en el mismo planteamiento, sobre todo en reforma o vivienda nueva.\n\nNo son equivalentes. El split gana cuando el problema es una o varias habitaciones y no quieres obra. El oficio se elige en visita, no por un titular.",
      },
    ],
  },
  {
    slug: "aire-acondicionado-conductos",
    nombre: "Aire acondicionado por conductos",
    corto: "Climatización integral por conductos",
    metaTitle: "Aire acondicionado por conductos en Murcia",
    metaDescription:
      "Aire acondicionado por conductos en Murcia: diseño de la red, rejillas y zonificación en vivienda, oficina o comercio. Presupuesto por el formulario.",
    h1: "Aire acondicionado por conductos en Murcia",
    incluyeH2: "Qué incluye una instalación por conductos en Murcia",
    intro: [
      "El aire por conductos climatiza toda la vivienda o el local desde una sola máquina, con rejillas discretas en cada estancia. Es la opción más limpia estéticamente y muy eficaz cuando hay falso techo o se está reformando.",
      "Diseñamos la red de conductos, la zonificación y el equipo para que el reparto de aire sea uniforme y el consumo, contenido.",
      "Encaja en obra nueva, reforma integral u oficinas y comercios con techo técnico. Trabajamos en Murcia capital, pedanías y el anillo metropolitano. Hasta unos 50 km: pregunta si encaja.",
    ],
    puntos: [
      "Diseño de la red de conductos y rejillas",
      "Zonificación por estancias para no climatizar de más",
      "Instalación en obra nueva, reforma o local comercial",
      "Mantenimiento y reparación de instalaciones existentes",
    ],
    faqs: [
      {
        q: "¿Necesito falso techo para instalar conductos?",
        a: "Sí: hace falta un falso techo o un espacio técnico por donde pasar la red. Si estás de reforma es el momento de decidirlo, antes de cerrar tabiques y techos. Si la vivienda ya está terminada, estudiamos si el plenum y los registros lo permiten.\n\nSin ese espacio, un sistema de [splits](/servicios/aire-acondicionado-splits) suele ser más honesto que forzar conductos.",
      },
      {
        q: "¿Se puede zonificar una instalación por conductos?",
        a: "Sí. Con compuertas motorizadas y termostatos por zona climatizas solo las estancias en uso. No todas las viviendas lo necesitan: depende de horarios, orientación y cómo se vive la casa. Lo valoramos en el estudio, no lo metemos por defecto.",
      },
      {
        q: "¿Conductos o multi-split para toda la vivienda?",
        a: "Los conductos integran la climatización en el techo y tratan el conjunto como un sistema. El multi-split deja una unidad visible en cada habitación y concentra las exteriores. La elección depende de la obra disponible, el ruido, el mantenimiento y cómo quieres ver (o no ver) los aparatos.\n\nEn un local o una oficina el conducto suele ganar en discreción. En un piso ya habitado, a veces no hay techo que tocar.",
      },
      {
        q: "¿Hacéis el mantenimiento de una instalación que no montasteis?",
        a: "Sí. Revisamos redes existentes: filtros, retornos, drenajes, máquinas y registros. Una queja de «no llega el aire al fondo» a menudo es un retorno mal resuelto o un filtro olvidado, no una máquina nueva.\n\nAverías y revisiones periódicas: [reparación y mantenimiento](/servicios/reparacion-mantenimiento).",
      },
      {
        q: "¿Trabajáis conductos en pedanías y a 50 km?",
        a: "Sí. Murcia capital, El Palmar, La Alberca, Beniaján y el anillo (Alcantarilla, Molina de Segura, Las Torres, Santomera, Beniel). Más lejos, hasta unos 50 km, [pregunta si encaja](/contacto#formulario). Cartagena y la costa, no ahora.",
      },
      {
        q: "¿La ventilación va en la misma red que el aire?",
        a: "No siempre. Refrigerar y renovar el aire son funciones distintas. En viviendas más cerradas o locales con olores, una instalación de [ventilación](/servicios/ventilacion) tiene papel propio. Mezclarlo todo en el mismo conducto sin estudio suele dar problemas de humedad o de caudal.",
      },
    ],
  },
  {
    slug: "aerotermia",
    nombre: "Aerotermia",
    corto: "Frío, calor y agua caliente con una sola máquina",
    metaTitle: "Instalación de aerotermia en Murcia",
    metaDescription:
      "Aerotermia en Murcia: calefacción, refrigeración y agua caliente con bomba de calor. Estudio de la vivienda y presupuesto por el formulario.",
    h1: "Aerotermia en Murcia",
    incluyeH2: "Qué incluye un estudio de aerotermia en Murcia",
    intro: [
      "La aerotermia aprovecha la energía del aire para dar calefacción, refrigeración y agua caliente sanitaria con un consumo inferior al de muchos sistemas tradicionales. En un clima como el de Murcia rinde especialmente bien.",
      "Estudiamos tu vivienda, el emisor más adecuado (suelo radiante, radiadores de baja temperatura o fancoils) y te damos un presupuesto real, sin promesas de ahorro infladas.",
      "Encaja sobre todo en reforma integral u obra nueva, o cuando vas a sustituir una caldera y quieres resolver varios servicios a la vez. Murcia capital, pedanías y anillo; hasta 50 km si encaja.",
    ],
    puntos: [
      "Estudio energético previo de la vivienda",
      "Combinable con suelo radiante y radiadores de baja temperatura",
      "Agua caliente sanitaria incluida en el mismo sistema",
      "Sustitución de calderas antiguas por aerotermia",
    ],
    faqs: [
      {
        q: "¿La aerotermia funciona bien en el verano de Murcia?",
        a: "Sí. La misma bomba de calor que calienta en invierno puede refrigerar en verano, combinada con suelo refrescante o fancoils. El verano murciano pide un planteamiento serio de frío: no basta con «poner una aerotermia» y esperar.\n\nSi solo necesitas frío en dos habitaciones y no hay reforma, un [split](/servicios/aire-acondicionado-splits) puede ser más razonable.",
      },
      {
        q: "¿Cuánto se ahorra frente a una caldera de gas?",
        a: "Depende de la vivienda, el aislamiento, los emisores y el uso. Una aerotermia bien dimensionada consume menos que una caldera convencional, pero no te vamos a soltar un porcentaje de folleto. En el estudio previo te damos números para tu caso.",
      },
      {
        q: "¿Puedo aprovechar los radiadores que ya tengo?",
        a: "A veces sí, a veces no. Hay que ver el tamaño de los emisores, la temperatura de trabajo y el aislamiento. En unos casos se equilibran los [radiadores](/servicios/radiadores) existentes; en otros conviene pasar a baja temperatura o a [suelo radiante](/servicios/suelo-radiante).",
      },
      {
        q: "¿Sustituís una caldera antigua por aerotermia?",
        a: "Sí, cuando el edificio y el uso lo justifican. No es un recambio de aparato: cambian tuberías, vaso, ACS y a veces los emisores. Si la caldera aún sirve y la vivienda no se va a tocar, puede ser más honesto repararla o cambiarla por otra [caldera](/servicios/calderas).",
      },
      {
        q: "¿Hace falta mucho espacio para la máquina?",
        a: "La unidad exterior necesita ventilación, acceso y un sitio que no moleste al vecino. Dentro, el acumulador de ACS y el hidraúlico piden un cuarto técnico o un rincón previsto. Lo medimos en visita; no se improvisa el día del montaje.",
      },
      {
        q: "¿Trabajáis aerotermia fuera de Murcia capital?",
        a: "Sí, en pedanías y el área metropolitana, y hasta unos 50 km si el trabajo encaja. [Pide presupuesto](/contacto#formulario) y lo vemos. Cartagena y la costa, no ahora.",
      },
    ],
  },
  {
    slug: "suelo-radiante",
    nombre: "Suelo radiante",
    corto: "Confort invisible y reparto uniforme del calor",
    metaTitle: "Instalación de suelo radiante en Murcia",
    metaDescription:
      "Suelo radiante en Murcia, en obra nueva y reforma. Calor uniforme, silencioso y pensado para ir con aerotermia. Presupuesto por el formulario.",
    h1: "Suelo radiante en Murcia",
    incluyeH2: "Qué incluye instalar suelo radiante en Murcia",
    intro: [
      "El suelo radiante reparte el calor de manera uniforme por toda la estancia, sin radiadores a la vista ni corrientes de aire. Trabaja a baja temperatura, por lo que es el compañero habitual de la aerotermia.",
      "Lo instalamos en obra nueva y en reformas, cuidando el aislamiento y el reparto de circuitos para que la casa caliente bien y no gaste de más.",
      "Tiene sentido cuando vas a levantar el suelo o construyes de nuevo. En un piso terminado, el recrecido y los plazos pesan. Murcia, pedanías y anillo; 50 km si encaja.",
    ],
    puntos: [
      "Ideal en combinación con aerotermia",
      "Calor uniforme y silencioso, sin aparatos a la vista",
      "Versión refrescante para el verano",
      "Instalación en obra nueva y reforma",
    ],
    faqs: [
      {
        q: "¿El suelo radiante sirve también para refrescar?",
        a: "Sí. Con una bomba de calor reversible el mismo circuito puede hacer de suelo refrescante en verano. En Murcia a menudo hay que complementar con deshumidificación (fancoils) para que no condense. No es un «aire acondicionado invisible» por sí solo.",
      },
      {
        q: "¿Cuánto recrece el suelo?",
        a: "Entre aislamiento, tubo y mortero, el recrecido habitual ronda los 6–8 cm. Depende del sistema y de lo que haya debajo. Lo confirmamos en el estudio de tu vivienda, no con una cifra de catálogo.",
      },
      {
        q: "¿Tiene que ir con aerotermia?",
        a: "Es la pareja más lógica: el suelo trabaja a baja temperatura y la [aerotermia](/servicios/aerotermia) rinde ahí. Se puede alimentar con otras fuentes, pero el estudio tiene que cuadrar caudales y temperatura. No mezclamos sistemas a ciegas.",
      },
      {
        q: "¿Puedo poner suelo radiante en una reforma de un piso?",
        a: "Sí, si aceptas recrecido, plazos de mortero y, a menudo, cambiar puertas o roza. En una reforma integral encaja. En un «quiero calor y no tocar nada», unos [radiadores](/servicios/radiadores) o un [split](/servicios/aire-acondicionado-splits) son más realistas.",
      },
      {
        q: "¿Cuánto tarda en calentar la casa?",
        a: "Más que un radiador al encender. El suelo inercia: tarda en subir y tarda en bajar. Por eso se programa y no se usa como un interruptor de un minuto. En viviendas bien aisladas esa inercia es una ventaja.",
      },
      {
        q: "¿Lo instaláis fuera de Murcia capital?",
        a: "Sí, en el radio de trabajo habitual. [Cuéntanos la obra](/contacto#formulario) (obra nueva o reforma) y te decimos si encaja.",
      },
    ],
  },
  {
    slug: "calderas",
    nombre: "Calderas",
    corto: "Instalación y sustitución de calderas",
    metaTitle: "Instalación y sustitución de calderas en Murcia",
    metaDescription:
      "Instalación y sustitución de calderas en Murcia. Condensación, puesta en marcha certificada y criterio claro: reparar, cambiar o pasar a aerotermia.",
    h1: "Calderas en Murcia",
    incluyeH2: "Qué incluye instalar o cambiar una caldera en Murcia",
    intro: [
      "Instalamos y sustituimos calderas para calefacción y agua caliente sanitaria, con equipos de condensación que aprovechan mejor cada kilovatio.",
      "Si tu caldera es antigua o da problemas, te decimos con claridad si compensa repararla o cambiarla, y si tu caso encaja mejor con una caldera nueva o con aerotermia.",
      "Trabajamos en Murcia capital, pedanías y el anillo. Hasta unos 50 km: pregunta si encaja. La instalación la hacen instaladores habilitados; el marco es el RITE.",
    ],
    puntos: [
      "Sustitución de calderas antiguas por condensación",
      "Instalación certificada y puesta en marcha",
      "Reparación y revisión periódica",
      "Asesoramiento honesto: reparar, cambiar o pasar a aerotermia",
    ],
    faqs: [
      {
        q: "¿Cuándo compensa cambiar la caldera?",
        a: "Si tiene más de 12–15 años, gasta de más o encadena averías, suele compensar el cambio a condensación. También si ya no hay recambio o el rendimiento se ha caído. Lo valoramos en visita, sin empujar a aerotermia si no toca.",
      },
      {
        q: "¿Caldera nueva o aerotermia?",
        a: "La [aerotermia](/servicios/aerotermia) tiene sentido cuando vas a tocar emisores, ACS y, a menudo, el suelo o los radiadores. Cambiar solo la caldera es más corto y más barato de obra. No hay una respuesta única: depende de la vivienda y de lo que quieras resolver este año.",
      },
      {
        q: "¿Hacéis el mantenimiento de la caldera?",
        a: "Sí: revisión y mantenimiento periódico para que funcione segura y no se dispare el consumo. También reparamos averías de equipos que no instalamos nosotros. El hilo de [reparación y mantenimiento](/servicios/reparacion-mantenimiento) cubre caldera y climatización.",
      },
      {
        q: "¿Hay que cumplir el RITE para cambiar una caldera?",
        a: "La instalación térmica de un edificio está sujeta al RITE. La pone un instalador habilitado, con puesta en marcha y la documentación que corresponda. No es un electrodoméstico de bricolaje. Si quieres el texto vigente, está en el [BOE](https://www.boe.es/).",
      },
      {
        q: "¿Y los radiadores que ya tengo?",
        a: "En muchos cambios de caldera se aprovecha el circuito. Si algunos no calientan, primero se mira equilibrado y aire; luego, si hace falta, se cambian emisores. Ver [radiadores](/servicios/radiadores).",
      },
      {
        q: "¿Trabajáis calderas fuera de Murcia capital?",
        a: "Sí, en el radio de ~50 km. [Pide presupuesto](/contacto#formulario). Costa y Cartagena, no ahora.",
      },
    ],
  },
  {
    slug: "radiadores",
    nombre: "Radiadores",
    corto: "Calefacción por radiadores, nueva o renovada",
    metaTitle: "Instalación de radiadores en Murcia",
    metaDescription:
      "Radiadores en Murcia: circuitos nuevos, cambio de emisores y equilibrado. También baja temperatura para aerotermia. Presupuesto por el formulario.",
    h1: "Radiadores en Murcia",
    incluyeH2: "Qué incluye una instalación de radiadores en Murcia",
    intro: [
      "La calefacción por radiadores sigue siendo una solución fiable y rápida de instalar. Montamos circuitos nuevos, sustituimos emisores antiguos y equilibramos instalaciones que calientan mal.",
      "También adaptamos radiadores a sistemas de baja temperatura para combinarlos con aerotermia.",
      "Encaja cuando no vas a levantar el suelo y quieres calor por estancias. Murcia, pedanías y anillo; 50 km si encaja.",
    ],
    puntos: [
      "Instalación de circuitos completos de calefacción",
      "Sustitución de radiadores antiguos",
      "Válvulas termostáticas y equilibrado de la instalación",
      "Radiadores de baja temperatura compatibles con aerotermia",
    ],
    faqs: [
      {
        q: "¿Por qué algunos radiadores calientan menos que otros?",
        a: "Suele ser equilibrado, aire en el circuito o un detentor mal dejado. Se corrige purgando y ajustando. Si la instalación es antigua o mal dimensionada, a veces hay que cambiar el emisor o revisar el trazado.",
      },
      {
        q: "¿Puedo usar mis radiadores con aerotermia?",
        a: "Depende del tamaño y del aislamiento. La [aerotermia](/servicios/aerotermia) rinde a baja temperatura: un radiador pequeño que nació para 70 °C se puede quedar corto. Lo vemos en el estudio; no prometemos que «valen todos».",
      },
      {
        q: "¿Radiadores o suelo radiante?",
        a: "El [suelo radiante](/servicios/suelo-radiante) pide obra en el pavimento y da inercia. Los radiadores se instalan antes, se ven y responden más rápido al encendido. En una reforma suave suelen ganar los radiadores; en vivienda nueva, el suelo.",
      },
      {
        q: "¿Hace falta cambiar la caldera al poner radiadores nuevos?",
        a: "No siempre. Si la [caldera](/servicios/calderas) está bien y el circuito se dimensiona, se pueden cambiar solo emisores. Si la caldera está al final, se estudian las dos cosas a la vez para no hacer el trabajo dos veces.",
      },
      {
        q: "¿Ponéis válvulas termostáticas?",
        a: "Sí, cuando aportan: habitaciones que se usan distinto, o para no calentar un dormitorio al sol. No las metemos por relleno en un presupuesto.",
      },
      {
        q: "¿Instaláis fuera de Murcia capital?",
        a: "Sí, en el radio habitual. [Cuéntanos el caso](/contacto#formulario).",
      },
    ],
  },
  {
    slug: "ventilacion",
    nombre: "Sistemas de ventilación",
    corto: "Aire limpio en viviendas, baños y locales",
    metaTitle: "Sistemas de ventilación en Murcia",
    metaDescription:
      "Ventilación en Murcia: baños, viviendas, cocinas y locales. Extracción y renovación de aire. Presupuesto por el formulario.",
    h1: "Sistemas de ventilación en Murcia",
    incluyeH2: "Qué incluye un sistema de ventilación en Murcia",
    intro: [
      "Renovar el aire es tan importante como climatizarlo: evita humedades, malos olores y ambientes cargados. Instalamos ventilación y extracción para viviendas, baños, cocinas y locales comerciales.",
      "Dimensionamos cada sistema según el uso real del espacio, desde un extractor bien elegido hasta una red de extracción para hostelería.",
      "Murcia capital, pedanías y anillo. Hasta unos 50 km: pregunta si encaja. El aire acondicionado no sustituye una ventilación que falta.",
    ],
    puntos: [
      "Ventilación de viviendas y baños interiores",
      "Extracción para cocinas y locales de hostelería",
      "Renovación de aire en oficinas y comercios",
      "Mantenimiento de sistemas de extracción",
    ],
    faqs: [
      {
        q: "¿Cómo quito la humedad de un baño sin ventana?",
        a: "Con un extractor bien dimensionado y una salida correcta al exterior. Es una instalación pequeña que evita moho y olores. Un aparato corto o un tubo mal resuelto no arregla el problema: lo tapa.",
      },
      {
        q: "¿Trabajáis ventilación para hostelería y cocinas?",
        a: "Sí: extracción para cocinas comerciales y locales en Murcia y alrededores. Campana, conducto, ventilador y salida se dimensionan juntos. El mantenimiento de filtros y grasas no es un extra: sin él el sistema deja de tirar.",
      },
      {
        q: "¿El aire acondicionado ventila la casa?",
        a: "El split recircula y trata el aire de la estancia. No es una renovación con el exterior. Si hay condensación, olores o aire viciado, hace falta ventilación de verdad, no solo más frío. En instalaciones por [conductos](/servicios/aire-acondicionado-conductos) a veces se mezclan las dos cosas sin criterio: lo revisamos.",
      },
      {
        q: "¿Hacéis el mantenimiento de una extracción existente?",
        a: "Sí. Limpieza, revisión de ventiladores, filtros y trayectos. Una queja de olores o de «ya no tira» suele ser mantenimiento atrasado, no una máquina nueva. Ver también [reparación y mantenimiento](/servicios/reparacion-mantenimiento).",
      },
      {
        q: "¿Hace falta obra?",
        a: "Un extractor de baño, poca. Una red de cocina o una vivienda entera, más: pasos, registros y salida al exterior. Lo vemos antes de abrir.",
      },
      {
        q: "¿Cubrís pedanías y el anillo de Murcia?",
        a: "Sí. [Pide presupuesto](/contacto#formulario). Cartagena y costa, no ahora.",
      },
    ],
  },
  {
    slug: "reparacion-mantenimiento",
    nombre: "Reparación, revisión y renovación",
    corto: "Averías, revisiones periódicas y equipos renovados",
    metaTitle: "Reparación y mantenimiento de climatización en Murcia",
    metaDescription:
      "Reparación y mantenimiento de climatización en Murcia: aire, aerotermia, calderas y ventilación. Diagnóstico claro y presupuesto por el formulario.",
    h1: "Reparación, revisión y renovación en Murcia",
    incluyeH2: "Qué incluye la reparación y el mantenimiento en Murcia",
    intro: [
      "Cuando el aire no enfría, la caldera falla o el consumo se dispara, un técnico te atiende en Murcia y su área metropolitana. Diagnosticamos la avería y te damos una solución clara: reparar, revisar o renovar.",
      "La revisión periódica alarga la vida de los equipos, mantiene el rendimiento y evita averías en pleno julio o en la ola de frío.",
      "Reparamos equipos de cualquier marca, los haya instalado quien los haya instalado. Pedanías y anillo; hasta 50 km si encaja.",
    ],
    puntos: [
      "Diagnóstico y reparación de averías",
      "Revisión y mantenimiento periódico de equipos",
      "Renovación de instalaciones antiguas o ineficientes",
      "Todas las marcas de aire acondicionado y calderas",
    ],
    faqs: [
      {
        q: "¿Reparáis equipos que no instalasteis vosotros?",
        a: "Sí. Reparamos y revisamos equipos de cualquier marca. El diagnóstico va antes que el recambio: a veces es un filtro, un drenaje o una placa; otras, el aparato está para renovar.",
      },
      {
        q: "¿Cada cuánto conviene revisar el aire acondicionado?",
        a: "Una revisión anual, idealmente antes del verano: filtros, drenaje, unidad exterior y funcionamiento general. En un local o una comunidad, se planifica; no se espera a julio. El RITE marca el marco de las instalaciones térmicas; en vivienda, la práctica es no dejar una avería pequeña para «después».",
      },
      {
        q: "¿También mantenéis calderas, aerotermia y extracción?",
        a: "Sí. El mismo taller cubre [calderas](/servicios/calderas), [aerotermia](/servicios/aerotermia), [splits](/servicios/aire-acondicionado-splits), [conductos](/servicios/aire-acondicionado-conductos) y [ventilación](/servicios/ventilacion). No mandamos a «otro gremio» si el oficio es nuestro.",
      },
      {
        q: "¿Cuándo renovar en vez de reparar?",
        a: "Cuando el recambio cuesta cerca de un equipo nuevo, no hay piezas, o el aparato ya no da el frío o el calor de la vivienda. Te lo decimos con números de tu caso, no con un eslogan. La renovación se presupuesta por el [formulario](/contacto#formulario).",
      },
      {
        q: "¿Hacéis revisiones en pedanías y a 50 km?",
        a: "Sí. Murcia capital, El Palmar, La Alberca, Beniaján y el anillo. Más lejos, pregunta si encaja. Cartagena y la costa, no ahora.",
      },
      {
        q: "¿El chat o el teléfono sustituyen el aviso?",
        a: "No. Para dejar el caso escrito (estancia, marca, qué falla) usa el [formulario de presupuesto](/contacto#formulario). Así no se pierde el aviso entre un mensaje y una llamada.",
      },
    ],
  },
];

export function getServicio(slug: string): Servicio | undefined {
  return SERVICIOS.find((s) => s.slug === slug);
}
