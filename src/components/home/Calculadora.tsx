"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * Calculadora de la home.
 *
 * Cuenta con tabla + fórmula. La IA no inventa el euro.
 * Los % son horquilla PROVISIONAL (oficio típico Murcia).
 * PENDIENTE: contrastar con José Carlos y sustituir RANGOS.
 * Preguntarle: ver RAID 31 ago y el bloque PENDIENTE-JOSE-CARLOS abajo.
 */

const VIVIENDAS = [
  "Piso 60 m²",
  "Piso 90 m²",
  "Casa 120 m²",
  "Chalet 180 m²",
  "Local 80 m²",
  "Local 150 m²",
] as const;

const SISTEMAS = [
  { id: "gas", label: "Caldera de gas" },
  { id: "splits", label: "Splits viejos" },
  { id: "electrico", label: "Radiadores eléctricos" },
  { id: "ns", label: "No lo sé" },
] as const;

const OBJETIVOS = [
  { id: "frio", label: "Solo frío" },
  { id: "integral", label: "Frío, calor y ACS" },
] as const;

type Sistema = (typeof SISTEMAS)[number]["id"];
type Objetivo = (typeof OBJETIVOS)[number]["id"];

/**
 * PENDIENTE-JOSE-CARLOS — sustituir estos pares [min, max] por los suyos.
 * Preguntar, por tipo de vivienda / local y sistema actual:
 *   1) % de ahorro real que ve al pasar a aerotermia (frío+calor+ACS)
 *   2) % al renovar splits viejos (solo frío, inverter)
 *   3) si quiere que el gasto/mes se entienda como media anual o como mes de verano
 */
const RANGOS: Record<Objetivo, Record<Sistema, [number, number]>> = {
  integral: {
    gas: [0.25, 0.4],
    splits: [0.2, 0.35],
    electrico: [0.5, 0.65],
    ns: [0.25, 0.4],
  },
  frio: {
    gas: [0.1, 0.2],
    splits: [0.15, 0.25],
    electrico: [0.2, 0.35],
    ns: [0.15, 0.25],
  },
};

function redondea(n: number) {
  return Math.max(5, Math.round(n / 5) * 5);
}

export default function Calculadora() {
  const [gasto, setGasto] = useState(120);
  const [tipo, setTipo] = useState(1);
  const [sistema, setSistema] = useState<Sistema>("gas");
  const [objetivo, setObjetivo] = useState<Objetivo>("integral");

  const vivienda = VIVIENDAS[tipo] ?? VIVIENDAS[1];
  const sistemaLabel = SISTEMAS.find((s) => s.id === sistema)?.label ?? "tu sistema";

  const cuenta = useMemo(() => {
    const [lo, hi] = RANGOS[objetivo][sistema];
    let min = redondea(gasto * lo);
    let max = redondea(gasto * hi);
    if (max <= min) max = min + 5;
    return {
      min,
      max,
      añoMin: min * 12,
      añoMax: max * 12,
      destino: objetivo === "integral" ? "aerotermia" : "un split inverter",
      oficio: objetivo === "integral" ? "/servicios/aerotermia" : "/servicios/aire-acondicionado-splits",
    };
  }, [gasto, objetivo, sistema]);

  return (
    <div className="rounded-4xl border border-line bg-white p-6 shadow-card sm:p-8">
      <label htmlFor="gasto" className="mb-2 block text-[0.82rem] text-mutedink">
        Gasto actual en climatización / mes:{" "}
        <span className="font-display font-bold text-ink">{gasto} €</span>
      </label>
      <input
        id="gasto"
        type="range"
        min={40}
        max={400}
        step={10}
        value={gasto}
        onChange={(e) => setGasto(Number(e.target.value))}
        className="mb-5 h-1.5 w-full appearance-none rounded-full bg-line accent-[#CB0A3D]"
      />

      <label htmlFor="tipo" className="mb-2 block text-[0.82rem] text-mutedink">
        Espacio: <span className="font-display font-bold text-ink">{vivienda}</span>
      </label>
      <input
        id="tipo"
        type="range"
        min={0}
        max={VIVIENDAS.length - 1}
        step={1}
        value={tipo}
        onChange={(e) => setTipo(Number(e.target.value))}
        className="mb-5 h-1.5 w-full appearance-none rounded-full bg-line accent-[#CB0A3D]"
      />

      <p className="mb-2 text-[0.82rem] text-mutedink">Sistema actual</p>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Sistema actual">
        {SISTEMAS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={chipClass(sistema === s.id)}
            aria-pressed={sistema === s.id}
            onClick={() => setSistema(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[0.82rem] text-mutedink">Qué quieres</p>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Objetivo">
        {OBJETIVOS.map((o) => (
          <button
            key={o.id}
            type="button"
            className={chipClass(objetivo === o.id)}
            aria-pressed={objetivo === o.id}
            onClick={() => setObjetivo(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-brand/10 to-accent/10 px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 font-display text-[0.68rem] uppercase tracking-[0.14em] text-brand">
              Horquilla orientativa
            </p>
            <p className="font-display text-[1.45rem] font-bold leading-none text-brand">
              {cuenta.min}–{cuenta.max} €/mes
            </p>
          </div>
          <p className="text-[0.82rem] font-semibold text-ink">
            {cuenta.añoMin}–{cuenta.añoMax} € al año
          </p>
        </div>
        <p className="mt-3 text-[0.8rem] leading-relaxed text-mutedink">
          De {sistemaLabel.toLowerCase()} a {cuenta.destino} en un {vivienda.toLowerCase()}.
          Orientación; el número fino sale en la visita.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link href="/contacto#formulario" className="btn-primary w-full sm:flex-1">
          Pedir visita
        </Link>
        <Link href={cuenta.oficio} className="btn-ghost w-full sm:flex-1">
          Ver {objetivo === "integral" ? "aerotermia" : "splits"}
        </Link>
      </div>
    </div>
  );
}

function chipClass(activo: boolean) {
  return `rounded-full border px-3 py-1.5 font-display text-[0.75rem] font-semibold transition-colors ${
    activo
      ? "border-brand bg-brand text-white"
      : "border-line bg-white text-ink hover:border-brand hover:text-brand"
  }`;
}
