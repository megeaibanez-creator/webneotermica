"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { SERVICIOS } from "@/lib/servicios";
import { trackEvent } from "@/components/cookies/consent";

type Estado = "idle" | "enviando" | "ok" | "error";

const ORIGENES = [
  "Google",
  "Recomendación de un conocido",
  "Redes sociales",
  "Ya soy cliente",
  "Otro",
];

const PRESUPUESTOS = [
  "Menos de 2.000 €",
  "2.000 – 5.000 €",
  "5.000 – 10.000 €",
  "10.000 – 20.000 €",
  "Más de 20.000 €",
  "Todavía no lo sé",
];

/**
 * Formulario de contacto (molde Eskala/Tricholand).
 * Anti-spam silencioso: honeypot `website` + tiempo mínimo de relleno.
 * El visitante nunca ve un captcha.
 */
export default function ContactForm({ compact = false }: { compact?: boolean }) {
  const [estado, setEstado] = useState<Estado>("idle");
  const [tipo, setTipo] = useState<"particular" | "professional">("particular");
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number>(Date.now());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado("enviando");
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      contact_type: tipo,
      company: String(fd.get("company") ?? ""),
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      municipio: String(fd.get("municipio") ?? ""),
      service_interest: String(fd.get("service_interest") ?? ""),
      budget_range: String(fd.get("budget_range") ?? ""),
      referral_source: String(fd.get("referral_source") ?? ""),
      message: String(fd.get("message") ?? ""),
      gdpr_consent: fd.get("gdpr_consent") === "on",
      website: String(fd.get("website") ?? ""),
      form_started_at: startedAt.current,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(
          data.error ??
            "No hemos podido enviar el mensaje. Llámanos al 678 495 046 y lo resolvemos."
        );
        setEstado("error");
        return;
      }
      trackEvent("generate_lead", { form: "contacto", service: payload.service_interest });
      setEstado("ok");
    } catch {
      setError("Fallo de conexión. Prueba otra vez o llámanos al 678 495 046.");
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return (
      <div className="rounded-4xl border border-line bg-white p-8 text-center shadow-card">
        <h3 className="mb-2 text-2xl">Mensaje recibido</h3>
        <p className="text-mutedink">
          Gracias por escribirnos. Te contestamos en horario de taller: lunes a
          viernes, 9:00–14:00 y 15:30–19:00.
        </p>
      </div>
    );
  }

  return (
    <form
      id="formulario"
      onSubmit={onSubmit}
      className={`relative rounded-4xl border border-line bg-white shadow-card ${
        compact ? "p-6" : "p-8"
      }`}
      noValidate={false}
    >
      <div className="form-hp" aria-hidden="true">
        <label htmlFor="website">Sitio web</label>
        <input
          id="website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <fieldset className="mb-4">
        <legend className="field-label">¿Escribes como…?</legend>
        <div className="flex gap-2">
          {(
            [
              ["particular", "Particular"],
              ["professional", "Empresa"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTipo(value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                tipo === value
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-page text-mutedink hover:border-brand"
              }`}
              aria-pressed={tipo === value}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {tipo === "professional" && (
        <div className="mb-4">
          <label htmlFor="company" className="field-label">
            Empresa
          </label>
          <input id="company" name="company" className="field-input" required />
        </div>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="field-label">
            Nombre *
          </label>
          <input id="name" name="name" className="field-input" required />
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
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="field-label">
          Email *
        </label>
        <input id="email" name="email" type="email" className="field-input" required />
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="service_interest" className="field-label">
            Servicio
          </label>
          <select id="service_interest" name="service_interest" className="field-input">
            <option value="">Elige…</option>
            {SERVICIOS.map((s) => (
              <option key={s.slug} value={s.nombre}>
                {s.nombre}
              </option>
            ))}
            <option value="Otro">Otro / no lo sé</option>
          </select>
        </div>
        <div>
          <label htmlFor="municipio" className="field-label">
            Municipio
          </label>
          <input
            id="municipio"
            name="municipio"
            className="field-input"
            placeholder="Murcia, El Palmar, Molina…"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="budget_range" className="field-label">
          Presupuesto aproximado
        </label>
        <select id="budget_range" name="budget_range" className="field-input">
          <option value="">Elige un rango…</option>
          {PRESUPUESTOS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="referral_source" className="field-label">
          ¿Cómo nos has conocido?
        </label>
        <select id="referral_source" name="referral_source" className="field-input">
          <option value="">Prefiero no decirlo</option>
          {ORIGENES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="message" className="field-label">
          Cuéntanos qué necesitas
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="field-input resize-y"
          placeholder="Avería, instalación nueva, revisión…"
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
          . Tus datos se usan solo para responderte.
        </span>
      </label>

      <button type="submit" className="btn-primary w-full" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Enviando…" : "Enviar mensaje"}
      </button>

      {error && (
        <p className="mt-3 text-center text-[0.8rem] text-accent" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-center text-[0.75rem] text-mutedink">
        Respondemos en horario de taller: L–V 9:00–14:00 y 15:30–19:00.
      </p>
    </form>
  );
}
