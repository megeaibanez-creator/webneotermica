"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Briefcase,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import AdminTabla, {
  AdminBotonLote,
  AdminChip,
  AdminPildora,
  formatFechaAdmin,
  type ColumnaTabla,
} from "@/components/admin/AdminTabla";
import AdminHoja from "@/components/admin/AdminHoja";
import { ESTADOS_CANDIDATO } from "@/lib/empleo";

type Candidato = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  municipio: string | null;
  puesto: string | null;
  formacion: string | null;
  experiencia: string | null;
  edad: string | null;
  carnet: string | null;
  disponibilidad: string | null;
  message: string | null;
  status: string;
  is_read: boolean;
};

function etiquetaEstado(s: string) {
  return ESTADOS_CANDIDATO.find((e) => e.value === s)?.label ?? s;
}

function tono(s: string) {
  if (s === "hired") return "ok" as const;
  if (s === "new") return "warn" as const;
  if (s === "spam" || s === "discarded") return "bad" as const;
  if (s === "interview") return "info" as const;
  return "muted" as const;
}

function telefonoWhatsApp(phone: string): string | null {
  const digitos = phone.replace(/\D/g, "");
  if (digitos.length === 9) return `34${digitos}`;
  if (digitos.length >= 11) return digitos;
  return null;
}

export default function AdminCandidatosPage() {
  const router = useRouter();
  const [filas, setFilas] = useState<Candidato[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");

  async function cargar() {
    const res = await fetch("/api/admin/candidatos");
    if (res.status === 401) {
      router.replace("/administrator/login");
      return;
    }
    if (!res.ok) {
      setError("No se pudieron cargar las candidaturas.");
      return;
    }
    const data = (await res.json()) as Candidato[];
    setFilas(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patch(id: string, cambios: Partial<Candidato>) {
    await fetch("/api/admin/candidatos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...cambios }),
    });
    setFilas((prev) => prev.map((l) => (l.id === id ? { ...l, ...cambios } : l)));
  }

  async function cambiarEstadoLote(status: string) {
    const ids = [...seleccion];
    await Promise.all(
      ids.map((id) =>
        fetch("/api/admin/candidatos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status, is_read: true }),
        })
      )
    );
    setFilas((prev) => prev.map((l) => (ids.includes(l.id) ? { ...l, status, is_read: true } : l)));
    setSeleccion([]);
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter((l) => {
      if (filtro) {
        if (l.status !== filtro) return false;
      } else if (l.status === "spam") {
        return false;
      }
      if (!q) return true;
      return [l.name, l.email, l.phone, l.municipio, l.puesto, l.formacion, l.message]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [filas, filtro, busqueda]);

  const porEstado = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of filas) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [filas]);

  const selected = useMemo(
    () => (selectedId ? (filas.find((l) => l.id === selectedId) ?? null) : null),
    [filas, selectedId]
  );

  const posicion = selected ? visibles.findIndex((l) => l.id === selected.id) : -1;

  function abrir(lead: Candidato) {
    setSelectedId(lead.id);
    if (!lead.is_read) void patch(lead.id, { is_read: true, status: lead.status === "new" ? "reviewed" : lead.status });
  }

  const columnas: ColumnaTabla<Candidato>[] = [
    {
      id: "created_at",
      titulo: "Fecha",
      ordenable: true,
      valor: (l) => new Date(l.created_at),
      celda: (l) => formatFechaAdmin(l.created_at),
    },
    {
      id: "name",
      titulo: "Nombre",
      ordenable: true,
      valor: (l) => l.name,
    },
    {
      id: "phone",
      titulo: "Teléfono",
      valor: (l) => l.phone ?? "",
    },
    {
      id: "puesto",
      titulo: "Puesto",
      valor: (l) => l.puesto ?? "",
    },
    {
      id: "experiencia",
      titulo: "Experiencia",
      valor: (l) => l.experiencia ?? "",
    },
    {
      id: "edad",
      titulo: "Edad",
      valor: (l) => l.edad ?? "",
    },
    {
      id: "status",
      titulo: "Estado",
      valor: (l) => l.status,
      celda: (l) => <AdminPildora tono={tono(l.status)}>{etiquetaEstado(l.status)}</AdminPildora>,
    },
  ];

  const whats = selected?.phone ? telefonoWhatsApp(selected.phone) : null;

  return (
    <div className="admin-shell">
      <h1 className="mb-2 text-3xl">Candidatos</h1>
      <p className="mb-5 text-mutedink">
        Solicitudes de /oferta-empleo. No se mezclan con Contactos. El spam no sale
        en Todos. No se borra ninguno desde aquí.
      </p>
      {error && <p className="mb-4 text-accent">{error}</p>}

      <div className="mb-5 flex flex-wrap gap-2">
        <AdminChip activo={filtro === ""} onClick={() => setFiltro("")}>
          Todos · {filas.filter((l) => l.status !== "spam").length}
        </AdminChip>
        {ESTADOS_CANDIDATO.map((e) => (
          <AdminChip key={e.value} activo={filtro === e.value} onClick={() => setFiltro(e.value)}>
            {e.label} · {porEstado[e.value] ?? 0}
          </AdminChip>
        ))}
      </div>

      <AdminTabla
        columnas={columnas}
        filas={visibles}
        clave={(l) => l.id}
        vacio={busqueda || filtro ? "Nada coincide con el filtro." : "Aún no hay candidaturas."}
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        placeholder="Buscar nombre, teléfono, oficio…"
        filaActiva={selectedId}
        onFila={abrir}
        seleccion={seleccion}
        onSeleccion={setSeleccion}
        unidad={["candidatura", "candidaturas"]}
        acciones={
          <>
            <AdminBotonLote onClick={() => void cambiarEstadoLote("reviewed")}>
              <CheckCheck className="h-3.5 w-3.5" /> Revisadas
            </AdminBotonLote>
            <AdminBotonLote onClick={() => void cambiarEstadoLote("discarded")}>
              <Archive className="h-3.5 w-3.5" /> Descartar
            </AdminBotonLote>
            <AdminBotonLote onClick={() => void cambiarEstadoLote("spam")}>
              <ShieldAlert className="h-3.5 w-3.5" /> Spam
            </AdminBotonLote>
          </>
        }
      />

      {selected && (
        <AdminHoja
          titulo={selected.name}
          subtitulo={
            <>
              {formatFechaAdmin(selected.created_at)}
              {selected.puesto ? ` · ${selected.puesto}` : ""}
              {posicion >= 0 ? ` · ${posicion + 1} de ${visibles.length}` : ""}
            </>
          }
          cabecera={
            <>
              <button
                type="button"
                className="rounded-lg p-1.5 text-mutedink hover:bg-soft hover:text-ink disabled:opacity-30"
                aria-label="Anterior"
                disabled={posicion <= 0}
                onClick={() => {
                  const l = visibles[posicion - 1];
                  if (l) abrir(l);
                }}
              >
                <ChevronUp className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-lg p-1.5 text-mutedink hover:bg-soft hover:text-ink disabled:opacity-30"
                aria-label="Siguiente"
                disabled={posicion < 0 || posicion >= visibles.length - 1}
                onClick={() => {
                  const l = visibles[posicion + 1];
                  if (l) abrir(l);
                }}
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </>
          }
          onCerrar={() => setSelectedId(null)}
          pie={
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`mailto:${selected.email}`}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
              >
                Responder por email
              </a>
            </div>
          }
        >
          <div className="mb-4 flex flex-wrap gap-1.5">
            {ESTADOS_CANDIDATO.map((e) => (
              <button
                key={e.value}
                type="button"
                onClick={() => void patch(selected.id, { status: e.value, is_read: true })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selected.status === e.value
                    ? "bg-brand text-white"
                    : "border border-line bg-white text-mutedink hover:border-brand hover:text-brand"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 rounded-xl border border-line bg-page p-4 text-sm">
            <Dato icono={UserRound} valor={selected.name} />
            <Dato
              icono={Mail}
              valor={
                <a href={`mailto:${selected.email}`} className="text-accent hover:underline">
                  {selected.email}
                </a>
              }
            />
            {selected.phone && (
              <Dato
                icono={Phone}
                valor={
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <a href={`tel:${selected.phone}`} className="text-accent hover:underline">
                      {selected.phone}
                    </a>
                    {whats && (
                      <a
                        href={`https://wa.me/${whats}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    )}
                  </span>
                }
              />
            )}
            {selected.municipio && <Dato icono={MapPin} valor={selected.municipio} />}
            {selected.puesto && <Dato icono={Briefcase} valor={selected.puesto} />}
            {selected.formacion && <Dato icono={GraduationCap} valor={selected.formacion} />}
            {selected.experiencia && <Dato icono={Briefcase} valor={selected.experiencia} />}
            {selected.edad && <Dato icono={IdCard} valor={`Edad: ${selected.edad}`} />}
            {selected.carnet && <Dato icono={IdCard} valor={`Carnet B: ${selected.carnet}`} />}
            {selected.disponibilidad && <Dato icono={IdCard} valor={selected.disponibilidad} />}
          </div>

          <p className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-mutedink">
            Qué ha hecho
          </p>
          <p className="whitespace-pre-wrap rounded-xl border border-line px-4 py-3 text-sm leading-relaxed">
            {selected.message || "—"}
          </p>
        </AdminHoja>
      )}
    </div>
  );
}

function Dato({
  icono: Icono,
  valor,
}: {
  icono: typeof Mail;
  valor: React.ReactNode;
}) {
  return (
    <p className="flex items-start gap-2.5">
      <Icono className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
      <span className="min-w-0">{valor}</span>
    </p>
  );
}
