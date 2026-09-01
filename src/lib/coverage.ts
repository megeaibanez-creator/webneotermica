/**
 * Cobertura geográfica (molde Alemán y Pajarón):
 * una plaza (Murcia), pueblos en el copy, NUNCA en la URL.
 */

export const PEDANIAS = [
  "El Palmar",
  "La Alberca",
  "Beniaján",
  "Torreagüera",
  "Guadalupe",
  "Sangonera",
] as const;

export const ANILLO = [
  "Alcantarilla",
  "Molina de Segura",
  "Las Torres de Cotillas",
  "Santomera",
  "Beniel",
] as const;

export const RADIO_50 = ["Alhama de Murcia", "Archena", "Fortuna", "Cieza"] as const;

/** Municipios para el schema areaServed. */
export const AREA_SERVED = [
  "Murcia",
  ...ANILLO,
  "Región de Murcia",
] as const;

/** Centro aproximado de Murcia para el mapa de cobertura (círculo de 50 km). */
export const MURCIA_CENTER: [number, number] = [38.0, -1.13];
export const RADIO_KM = 50;

/** Texto corto de cobertura reutilizable (componente AreaServicio). */
export const COVERAGE_TEXT = `Trabajamos en Murcia ciudad y sus pedanías (${PEDANIAS.join(
  ", "
)}), en el área metropolitana (${ANILLO.join(
  ", "
)}) y en un radio de unos ${RADIO_KM} km: ${RADIO_50.join(
  ", "
)}… Si estás más lejos, pregunta si encaja.`;
