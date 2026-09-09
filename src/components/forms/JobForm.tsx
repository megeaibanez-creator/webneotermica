"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/components/cookies/consent";
import {
  DISPONIBILIDADES,
  EDADES,
  EXPERIENCIAS,
  FORMACIONES,
  PUESTOS,
} from "@/lib/empleo";

type Estado = "idle" | "enviando" | "ok" | "error";

/**
 * Formulario de candidatos (cribado). Mismo anti-spam silencioso que /contacto.
 */
export default function JobForm() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number>(Date.now());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado("enviando");
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      municipio: String(fd.get("municipio") ?? ""),
      puesto: String(fd.get("puesto") ?? ""),
      formacion: String(fd.get("formacion") ?? ""),
      experiencia: String(fd.get("experiencia") ?? ""),
      edad: String(fd.get("edad") ?? ""),
      carnet: String(fd.get("carnet") ?? ""),
      disponibilidad: String(fd.get("disponibilidad") ?? ""),
      message: String(fd.get("message") ?? ""),
      gdpr_consent: fd.get("gdpr_consent") === "on",
      website: String(fd.get("website") ?? ""),
      fax: String(fd.get("fax") ?? ""),
      form_started_at: startedAt.current,
    };

    try {
      const res = await fetch("/api/empleo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(
          data.error ??
            "No hemos podido enviar la solicitud. Llámanos al 678 495 046."
        );
        setEstado("error");
        return;
      }
      trackEvent("generate_lead", { form: "empleo", puesto: payload.puesto });
      setEstado("ok");
    } catch {
      setError("Fallo de conexión. Prueba otra vez o llámanos al 678 495 046.");
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return (
      <div className="rounded-4xl border border-line bg-white p-8 text-center shadow-card">
        <h3 className="mb-2 text-2xl">Solicitud recibida</h3>
        <p className="text-mutedink">
          Gracias. Revisamos tu perfil y te llamamos si encaja con lo que
          necesitamos ahora. Horario de taller: lunes a viernes, 9:00–14:00 y
          15:30–19:00.
        </p>
      </div>
    );
  }

  return (
    <form
      id="formulario"
      onSubmit={onSubmit}
      className="relative rounded-4xl border border-line bg-white p-8 shadow-card"
    >
      <div className="form-hp" aria-hidden="true">
        <label htmlFor="website">Sitio web</label>
        <input id="website" type="text" name="website" tabIndex={-1} autoComplete="off" />
        <label htmlFor="fax">Fax</label>
        <input id="fax" type="text" name="fax" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="field-label">
            Nombre *
          </label>
          <input id="name" name="name" className="field-input" required autoComplete="name" />
        </div>
        <div>
          <label htmlFor="phone" className="field-label">
            Teléfono *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            className="field-input"
            required
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="field-label">
          Email *
        </label>
        <input id="email" name="email" type="email" className="field-input" required autoComplete="email" />
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="municipio" className="field-label">
            Municipio *
          </label>
          <input
            id="municipio"
            name="municipio"
            className="field-input"
            placeholder="Murcia, El Palmar, Molina…"
            required
          />
        </div>
        <div>
          <label htmlFor="edad" className="field-label">
            Edad *
          </label>
          <select id="edad" name="edad" className="field-input" required>
            <option value="">Elige…</option>
            {EDADES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="puesto" className="field-label">
          Puesto que buscas *
        </label>
        <select id="puesto" name="puesto" className="field-input" required>
          <option value="">Elige…</option>
          {PUESTOS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="formacion" className="field-label">
            Formación *
          </label>
          <select id="formacion" name="formacion" className="field-input" required>
            <option value="">Elige…</option>
            {FORMACIONES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="experiencia" className="field-label">
            Años de experiencia *
          </label>
          <select id="experiencia" name="experiencia" className="field-input" required>
            <option value="">Elige…</option>
            {EXPERIENCIAS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="carnet" className="field-label">
            Carnet de conducir B
          </label>
          <select id="carnet" name="carnet" className="field-input">
            <option value="">Prefiero no decirlo</option>
            <option value="Sí">Sí</option>
            <option value="No">No</option>
          </select>
        </div>
        <div>
          <label htmlFor="disponibilidad" className="field-label">
            Disponibilidad
          </label>
          <select id="disponibilidad" name="disponibilidad" className="field-input">
            <option value="">Prefiero no decirlo</option>
            {DISPONIBILIDADES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="message" className="field-label">
          Qué has hecho (marcas, obras, splits, conductos…)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="field-input resize-y"
          placeholder="Ej.: 3 años montando splits y conductos en Murcia…"
        />
      </div>

      <label className="mb-4 flex items-start gap-2 text-[0.8rem] text-mutedink">
        <input
          type="checkbox"
          name="gdpr_consent"
          required
          className="mt-0.5 h-4 w-4 accent-[#CB0A3D]"
        />
        <span>
          He leído y acepto la{" "}
          <Link href="/politica-de-privacidad" className="text-brand underline">
            política de privacidad
          </Link>
          . Tus datos se usan solo para valorar tu candidatura.
        </span>
      </label>

      <button type="submit" className="btn-primary w-full" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Enviando…" : "Enviar solicitud"}
      </button>

      {error && (
        <p className="mt-3 text-center text-[0.8rem] text-accent" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-center text-[0.75rem] text-mutedink">
        No es el formulario de presupuesto. Si buscas instalar o reparar en casa, ve a{" "}
        <Link href="/contacto#formulario" className="text-brand underline">
          contacto
        </Link>
        .
      </p>
    </form>
  );
}
