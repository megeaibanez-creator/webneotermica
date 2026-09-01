"use client";

import MurciaMap from "@/components/MurciaMap";

/** Leaflet se monta dentro de MurciaMap (useEffect). Sin next/dynamic: en Next 16 peta. */
export default function MapaCobertura() {
  return <MurciaMap />;
}
