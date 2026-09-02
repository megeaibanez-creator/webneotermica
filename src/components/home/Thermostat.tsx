"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyClima,
  persistClima,
  colorAt,
  modoClima,
  restoreClima,
  tempDeT,
} from "@/lib/clima";

/**
 * Misma rueda de color que la 06/08, girada para que el rojo quede arriba
 * (la home arranca en crimson). El puntito da la vuelta entera.
 * El 16 ° queda en el centro del azul; el anillo usa colorAt en cada ángulo.
 */

const ORIGEN = 172;
/** Grados de azul puro a cada lado del 16 °. */
const AZUL_SEMI = 16;
const G_MEDIO = 96;
const G_CALOR = 188;
const G_ROJO_FIN = 270;

function wrap(a: number) {
  let x = a % 360;
  if (x > 180) x -= 360;
  if (x < -180) x += 360;
  return x;
}

function cssDeAngulo(a: number) {
  const w = wrap(a);
  return w < 0 ? w + 360 : w;
}

/** Mismos tramos que el anillo original; el rojo (t=1) cae arriba. */
function tDeAngulo(a: number) {
  const g = (cssDeAngulo(a) - ORIGEN + 360) % 360;
  if (g <= AZUL_SEMI || g >= 360 - AZUL_SEMI) return 0;
  if (g <= G_MEDIO) return ((g - AZUL_SEMI) / (G_MEDIO - AZUL_SEMI)) * 0.5;
  if (g <= G_CALOR) return 0.5 + ((g - G_MEDIO) / (G_CALOR - G_MEDIO)) * 0.5;
  if (g <= G_ROJO_FIN) return 1;
  return 1 - (g - G_ROJO_FIN) / (360 - AZUL_SEMI - G_ROJO_FIN);
}

function anguloDeT(t: number) {
  const x = Math.min(1, Math.max(0, t));
  if (x >= 0.999) return 0;
  if (x <= 0) return wrap(ORIGEN);
  if (x <= 0.5) return wrap(AZUL_SEMI + (x / 0.5) * (G_MEDIO - AZUL_SEMI) + ORIGEN);
  return wrap(G_MEDIO + ((x - 0.5) / 0.5) * (G_CALOR - G_MEDIO) + ORIGEN);
}

function anilloFondo(): string {
  const cortes = new Set<number>();
  for (let g = 0; g <= 360; g += 4) cortes.add(g);
  for (const g of [AZUL_SEMI, G_MEDIO, G_CALOR, G_ROJO_FIN, 360 - AZUL_SEMI]) {
    cortes.add(g);
  }
  const stops = [...cortes]
    .sort((a, b) => a - b)
    .map((g) => `${colorAt(tDeAngulo(ORIGEN + g))} ${g}deg`);
  return `conic-gradient(from ${ORIGEN}deg, ${stops.join(", ")})`;
}

const ANILLO = anilloFondo();

export default function Thermostat() {
  const [angle, setAngle] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const tRef = useRef(1);

  useEffect(() => {
    const saved = restoreClima();
    if (saved == null) {
      applyClima(1);
      return;
    }
    setAngle(anguloDeT(saved));
  }, []);

  const pintar = useCallback((next: number) => {
    const a = wrap(next);
    const nextT = tDeAngulo(a);
    tRef.current = nextT;
    setAngle(a);
    applyClima(nextT);
  }, []);

  const t = tDeAngulo(angle);
  const temp = tempDeT(t);
  const zona = modoClima(t);
  const modo = zona === "frío" ? "Modo frío" : zona === "calor" ? "Modo calor" : "Confort";
  const color = colorAt(t);
  const rad = ((angle - 90) * Math.PI) / 180;

  const fromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = trackRef.current;
      if (!el) return;
      const b = el.getBoundingClientRect();
      const a =
        (Math.atan2(clientY - (b.top + b.height / 2), clientX - (b.left + b.width / 2)) *
          180) /
          Math.PI +
        90;
      pintar(a > 180 ? a - 360 : a);
    },
    [pintar]
  );

  return (
    <div
      className="absolute left-1/2 top-1/2 z-[2] grid aspect-square w-[min(268px,70vw)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-[radial-gradient(circle_at_50%_36%,#fff,#e7edf3)] shadow-deep lg:bottom-4 lg:left-auto lg:right-4 lg:top-auto lg:w-[min(300px,28vw)] lg:translate-x-0 lg:translate-y-0"
      title="Gira: cambia el color de los botones"
    >
      <div
        className="absolute inset-[8%] rounded-full"
        style={{
          background: ANILLO,
          WebkitMask: "radial-gradient(circle, transparent 62%, #000 63%)",
          mask: "radial-gradient(circle, transparent 62%, #000 63%)",
        }}
        aria-hidden
      />
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Temperatura: gira para teñir los botones de la web"
        aria-valuemin={16}
        aria-valuemax={30}
        aria-valuenow={temp}
        className="absolute inset-[8%] cursor-grab touch-none rounded-full active:cursor-grabbing"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          fromPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (dragging.current) fromPointer(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          dragging.current = false;
          persistClima(tRef.current);
        }}
        onPointerCancel={() => {
          dragging.current = false;
          persistClima(tRef.current);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            pintar(angle + 9);
            persistClima(tRef.current);
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            pintar(angle - 9);
            persistClima(tRef.current);
          }
        }}
      >
        <span
          className="absolute h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-white shadow-card"
          style={{
            left: `${50 + Math.cos(rad) * 50}%`,
            top: `${50 + Math.sin(rad) * 50}%`,
          }}
          aria-hidden
        />
      </div>
      <div className="absolute inset-[22%] grid place-items-center rounded-full bg-white text-center">
        <div>
          <div className="font-display text-[0.5rem] uppercase tracking-[0.16em] text-mutedink">
            Clima
          </div>
          <div className="font-display text-[2rem] font-bold lg:text-[2.35rem]" style={{ color }}>
            {temp}
            <sup>°</sup>
          </div>
          <div
            className="font-display text-[0.62rem] uppercase tracking-[0.08em]"
            style={{ color }}
          >
            {modo}
          </div>
        </div>
      </div>
    </div>
  );
}
