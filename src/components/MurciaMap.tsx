"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { MURCIA_CENTER, RADIO_KM } from "@/lib/coverage";

/**
 * Mapa de COBERTURA (no pin de oficina: la empresa no publica calle).
 * Esri World Imagery. Leaflet solo se crea en el cliente; el efecto
 * aguanta el doble montaje de React (si no, «already initialized»).
 */
export default function MurciaMap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelado = false;
    let mapa: { remove: () => void } | null = null;

    void import("leaflet").then((mod) => {
      if (cancelado || !el.isConnected) return;
      const L = mod.default;

      const marcado = el as HTMLDivElement & { _leaflet_id?: number };
      if (marcado._leaflet_id) {
        marcado._leaflet_id = undefined;
        el.replaceChildren();
      }

      const map = L.map(el, {
        center: MURCIA_CENTER,
        zoom: 10,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      if (cancelado) {
        map.remove();
        return;
      }
      mapa = map;

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Teselas &copy; Esri, Maxar, Earthstar Geographics",
          maxZoom: 19,
        }
      ).addTo(map);

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "",
          maxZoom: 19,
          pane: "overlayPane",
        }
      ).addTo(map);

      const zona = L.circle(MURCIA_CENTER, {
        radius: RADIO_KM * 1000,
        color: "#CB0A3D",
        weight: 3,
        fillColor: "#CB0A3D",
        fillOpacity: 0.18,
      })
        .addTo(map)
        .bindPopup(
          `<b>Zona de servicio</b><br>Murcia y unos ${RADIO_KM} km a la redonda.`
        );

      map.fitBounds(zona.getBounds(), { padding: [20, 20], maxZoom: 10 });
    });

    return () => {
      cancelado = true;
      mapa?.remove();
      mapa = null;
    };
  }, []);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Mapa de la zona de servicio de Neotérmica: Murcia y unos ${RADIO_KM} kilómetros a la redonda`}
      className="relative z-0 isolate h-[420px] w-full overflow-hidden rounded-4xl border border-line shadow-card"
    />
  );
}
