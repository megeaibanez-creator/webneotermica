"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, MapPin, Phone, PlayCircle, RotateCcw } from "lucide-react";
import { AdminPildora } from "@/components/admin/AdminTabla";
import {
  type ActuacionCompleta,
  type ActuacionEstado,
  claveDia,
  etiquetaTipo,
  fmtDiaLargo,
  rangoActuacion,
  tonoEstadoActuacion,
} from "@/lib/agenda";

/** Vista del técnico: sus actuaciones asignadas, agrupadas por día. */
export default function MiAgenda({ compacto = false }: { compacto?: boolean }) {
  const [actuaciones, setActuaciones] = useState<ActuacionCompleta[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [verPasadas, setVerPasadas] = useState(false);

  async function cargar() {
    const res = await fetch("/api/tecnico/agenda");
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error ?? "No se pudo cargar tu agenda.");
      setCargando(false);
      return;
    }
    const d = (await res.json()) as { actuaciones: ActuacionCompleta[] };
    setActuaciones(d.actuaciones);
    setError("");
    setCargando(false);
  }

  useEffect(() => {
    void cargar();
  }, []);

  const hoy = claveDia(new Date());

  const { proximas, pasadas } = useMemo(() => {
    const prox: ActuacionCompleta[] = [];
    const pas: ActuacionCompleta[] = [];
    for (const a of actuaciones) {
      const fin = claveDia(a.ends_at);
      if (a.estado === "hecha" || a.estado === "cancelada" || fin < hoy) pas.push(a);
      else prox.push(a);
    }
    return { proximas: prox, pasadas: pas };
  }, [actuaciones, hoy]);

  const grupos = useMemo(() => agruparPorDia(verPasadas ? pasadas : proximas), [
    verPasadas,
    pasadas,
    proximas,
  ]);

  async function cambiarEstado(id: string, estado: ActuacionEstado) {
    setActuaciones((prev) => prev.map((a) => (a.id === id ? { ...a, estado } : a)));
    await fetch("/api/tecnico/agenda", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    });
    void cargar();
  }

  async function guardarNota(id: string, notas: string) {
    await fetch("/api/tecnico/agenda", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notas }),
    });
    void cargar();
  }

  return (
    <div className={compacto ? "" : "mx-auto max-w-2xl px-4 py-6"}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mi agenda</h1>
        <div className="flex rounded-full border border-line bg-white p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setVerPasadas(false)}
            className={`rounded-full px-3 py-1 font-medium ${!verPasadas ? "bg-brand text-white" : "text-mutedink"}`}
          >
            Próximas
          </button>
          <button
            type="button"
            onClick={() => setVerPasadas(true)}
            className={`rounded-full px-3 py-1 font-medium ${verPasadas ? "bg-brand text-white" : "text-mutedink"}`}
          >
            Hechas / pasadas
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-accent">{error}</p>}
      {cargando && <p className="text-mutedink">Cargando…</p>}

      {!cargando && grupos.length === 0 && (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-mutedink">
          {verPasadas ? "No hay actuaciones pasadas." : "No tienes actuaciones pendientes. 🎉"}
        </div>
      )}

      <div className="space-y-6">
        {grupos.map(([clave, lista]) => (
          <section key={clave}>
            <h2 className="mb-2 font-display text-sm font-semibold capitalize text-brand">
              {clave === hoy ? "Hoy · " : ""}
              {fmtDiaLargo(`${clave}T12:00:00`)}
            </h2>
            <div className="space-y-3">
              {lista.map((a) => (
                <Tarjeta
                  key={a.id}
                  actuacion={a}
                  onEstado={(e) => void cambiarEstado(a.id, e)}
                  onNota={(n) => void guardarNota(a.id, n)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function agruparPorDia(lista: ActuacionCompleta[]): [string, ActuacionCompleta[]][] {
  const m = new Map<string, ActuacionCompleta[]>();
  for (const a of [...lista].sort((x, y) => x.starts_at.localeCompare(y.starts_at))) {
    const clave = claveDia(a.starts_at);
    const arr = m.get(clave) ?? [];
    arr.push(a);
    m.set(clave, arr);
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function Tarjeta({
  actuacion,
  onEstado,
  onNota,
}: {
  actuacion: ActuacionCompleta;
  onEstado: (e: ActuacionEstado) => void;
  onNota: (n: string) => void;
}) {
  const a = actuacion;
  const [nota, setNota] = useState(a.notas ?? "");
  const [editandoNota, setEditandoNota] = useState(false);
  const lugar = a.lugar || a.cliente?.municipio || a.proyecto?.municipio || null;
  const mapsUrl = lugar
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`
    : null;

  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-ink">{rangoActuacion(a)}</p>
          <h3 className="text-lg font-semibold leading-tight">{a.titulo}</h3>
          <p className="text-sm text-mutedink">
            {etiquetaTipo(a.tipo)}
            {a.proyecto ? ` · ${a.proyecto.title}` : ""}
          </p>
        </div>
        <AdminPildora tono={tonoEstadoActuacion(a.estado)}>
          {a.estado === "en_curso" ? "En curso" : a.estado === "hecha" ? "Hecha" : a.estado === "cancelada" ? "Cancelada" : "Pendiente"}
        </AdminPildora>
      </div>

      {a.cliente && (
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-medium">{a.cliente.name}</span>
          {a.cliente.phone && (
            <a href={`tel:${a.cliente.phone}`} className="inline-flex items-center gap-1 text-accent">
              <Phone className="h-4 w-4" /> {a.cliente.phone}
            </a>
          )}
        </div>
      )}

      {lugar && (
        <a
          href={mapsUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 inline-flex items-center gap-1 text-sm text-accent"
        >
          <MapPin className="h-4 w-4" /> {lugar}
        </a>
      )}

      {(a.notas || editandoNota) && (
        <div className="mb-3">
          {editandoNota ? (
            <div className="space-y-2">
              <textarea
                className="field-input"
                rows={3}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-brand px-3 py-1 text-sm font-medium text-white"
                  onClick={() => {
                    onNota(nota);
                    setEditandoNota(false);
                  }}
                >
                  Guardar nota
                </button>
                <button
                  type="button"
                  className="rounded-full border border-line px-3 py-1 text-sm"
                  onClick={() => {
                    setNota(a.notas ?? "");
                    setEditandoNota(false);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-soft px-3 py-2 text-sm text-ink">{a.notas}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {a.estado === "pendiente" && (
          <button
            type="button"
            onClick={() => onEstado("en_curso")}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-sm font-medium text-white"
          >
            <PlayCircle className="h-4 w-4" /> Empezar
          </button>
        )}
        {(a.estado === "pendiente" || a.estado === "en_curso") && (
          <button
            type="button"
            onClick={() => onEstado("hecha")}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            <CheckCircle2 className="h-4 w-4" /> Marcar hecha
          </button>
        )}
        {a.estado === "hecha" && (
          <button
            type="button"
            onClick={() => onEstado("en_curso")}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm"
          >
            <RotateCcw className="h-4 w-4" /> Reabrir
          </button>
        )}
        {!editandoNota && (
          <button
            type="button"
            onClick={() => setEditandoNota(true)}
            className="rounded-full border border-line px-3 py-1.5 text-sm text-mutedink hover:text-ink"
          >
            {a.notas ? "Editar nota" : "Añadir nota"}
          </button>
        )}
      </div>
    </article>
  );
}
