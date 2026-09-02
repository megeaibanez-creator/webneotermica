"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Banknote,
  Building2,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldAlert,
  UserRound,
  Wrench,
} from "lucide-react";
import AdminTabla, {
  AdminBotonLote,
  AdminChip,
  AdminPildora,
  formatFechaAdmin,
  type ColumnaTabla,
} from "@/components/admin/AdminTabla";
import AdminHoja from "@/components/admin/AdminHoja";
import { getServicio } from "@/lib/servicios";

type Lead = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  contact_type: string | null;
  company: string | null;
  municipio: string | null;
  service_interest: string | null;
  budget_range: string | null;
  source: string | null;
  message: string | null;
  status: string;
  is_read: boolean;
  client_id?: string | null;
};

const ESTADOS: { value: string; label: string }[] = [
  { value: "new", label: "Nuevo" },
  { value: "read", label: "Leído" },
  { value: "replied", label: "Respondido" },
  { value: "archived", label: "Archivado" },
  { value: "spam", label: "Spam" },
];

function etiquetaEstado(s: string) {
  return ESTADOS.find((e) => e.value === s)?.label ?? s;
}

function tonoLead(s: string) {
  if (s === "replied") return "ok" as const;
  if (s === "new") return "warn" as const;
  if (s === "spam") return "bad" as const;
  if (s === "archived") return "muted" as const;
  return "info" as const;
}

function telefonoWhatsApp(phone: string): string | null {
  const digitos = phone.replace(/\D/g, "");
  if (digitos.length === 9) return `34${digitos}`;
  if (digitos.length >= 11) return digitos;
  return null;
}

function nombreServicio(slug: string | null): string {
  if (!slug) return "—";
  return getServicio(slug)?.nombre ?? slug;
}

export default function AdminContactosPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pasando, setPasando] = useState(false);
  const [avisoPaso, setAvisoPaso] = useState("");

  async function cargar() {
    const res = await fetch("/api/admin/contacts");
    if (res.status === 401) {
      router.replace("/administrator/login");
      return;
    }
    if (!res.ok) {
      setError("No se pudieron cargar las consultas.");
      return;
    }
    const data = (await res.json()) as Lead[];
    setLeads(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patch(id: string, cambios: Partial<Lead>) {
    await fetch("/api/admin/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...cambios }),
    });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...cambios } : l)));
  }

  async function cambiarEstadoLote(status: string) {
    const ids = [...seleccion];
    const cambios: Partial<Lead> = { status, is_read: true };
    await Promise.all(
      ids.map((id) =>
        fetch("/api/admin/contacts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...cambios }),
        })
      )
    );
    setLeads((prev) => prev.map((l) => (ids.includes(l.id) ? { ...l, ...cambios } : l)));
    setSeleccion([]);
  }

  async function pasarACliente(lead: Lead) {
    setAvisoPaso("");
    setPasando(true);
    const res = await fetch("/api/admin/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entidad: "clients", from_lead_id: lead.id }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      fila?: { id: string };
    };
    setPasando(false);
    if (!res.ok || !data.fila) {
      setAvisoPaso(data.error ?? "No se pudo pasar a cliente.");
      return;
    }
    router.push(`/administrator/clientes?id=${data.fila.id}`);
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return leads.filter((l) => {
      if (filtro && l.status !== filtro) return false;
      if (!q) return true;
      return [l.name, l.email, l.phone, l.company, l.municipio, l.service_interest, l.message]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [leads, filtro, busqueda]);

  const porEstado = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of leads) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [leads]);

  const selected = useMemo(
    () => (selectedId ? (leads.find((l) => l.id === selectedId) ?? null) : null),
    [leads, selectedId]
  );

  const posicion = selected ? visibles.findIndex((l) => l.id === selected.id) : -1;

  function abrir(lead: Lead) {
    setAvisoPaso("");
    setSelectedId(lead.id);
    if (!lead.is_read) void patch(lead.id, { is_read: true, status: "read" });
  }

  const columnas: ColumnaTabla<Lead>[] = [
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
      celda: (l) => (
        <span className={l.is_read ? "font-medium" : "font-semibold"}>
          {l.name}
          {l.contact_type === "professional" && l.company ? (
            <span className="block text-xs font-normal text-mutedink">{l.company}</span>
          ) : null}
        </span>
      ),
    },
    {
      id: "phone",
      titulo: "Teléfono",
      valor: (l) => l.phone,
      celda: (l) => l.phone ?? "—",
    },
    {
      id: "email",
      titulo: "Email",
      ordenable: true,
      valor: (l) => l.email,
      celda: (l) => l.email,
    },
    {
      id: "municipio",
      titulo: "Municipio",
      ordenable: true,
      valor: (l) => l.municipio,
      celda: (l) => l.municipio ?? "—",
    },
    {
      id: "service",
      titulo: "Servicio",
      valor: (l) => l.service_interest,
      celda: (l) => nombreServicio(l.service_interest),
    },
    {
      id: "budget",
      titulo: "Presupuesto",
      valor: (l) => l.budget_range,
      celda: (l) => l.budget_range ?? "—",
    },
    {
      id: "status",
      titulo: "Estado",
      ordenable: true,
      valor: (l) => l.status,
      celda: (l) => <AdminPildora tono={tonoLead(l.status)}>{etiquetaEstado(l.status)}</AdminPildora>,
    },
  ];

  const whats = selected?.phone ? telefonoWhatsApp(selected.phone) : null;

  return (
    <div className="admin-shell">
      <h1 className="mb-2 text-3xl">Contactos</h1>
      <p className="mb-5 text-mutedink">
        Leads de /contacto. Si contratan, pásalos a Clientes. No se borra ninguno desde aquí.
      </p>
      {error && <p className="mb-4 text-accent">{error}</p>}

      <div className="mb-5 flex flex-wrap gap-2">
        <AdminChip activo={filtro === ""} onClick={() => setFiltro("")}>
          Todos · {leads.length}
        </AdminChip>
        {ESTADOS.map((e) => (
          <AdminChip key={e.value} activo={filtro === e.value} onClick={() => setFiltro(e.value)}>
            {e.label} · {porEstado[e.value] ?? 0}
          </AdminChip>
        ))}
      </div>

      <AdminTabla
        columnas={columnas}
        filas={visibles}
        clave={(l) => l.id}
        vacio={busqueda || filtro ? "Nada coincide con el filtro." : "Aún no hay consultas."}
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        placeholder="Buscar nombre, email, teléfono…"
        filaActiva={selectedId}
        onFila={abrir}
        seleccion={seleccion}
        onSeleccion={setSeleccion}
        unidad={["consulta", "consultas"]}
        acciones={
          <>
            <AdminBotonLote onClick={() => void cambiarEstadoLote("read")}>
              <CheckCheck className="h-3.5 w-3.5" /> Marcar leídas
            </AdminBotonLote>
            <AdminBotonLote onClick={() => void cambiarEstadoLote("replied")}>
              Respondidas
            </AdminBotonLote>
            <AdminBotonLote onClick={() => void cambiarEstadoLote("archived")}>
              <Archive className="h-3.5 w-3.5" /> Archivar
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
              {selected.source ? ` · vía ${selected.source}` : ""}
              {posicion >= 0 ? ` · ${posicion + 1} de ${visibles.length}` : ""}
            </>
          }
          cabecera={
            <>
              <button
                type="button"
                className="rounded-lg p-1.5 text-mutedink hover:bg-soft hover:text-ink disabled:opacity-30"
                aria-label="Consulta anterior"
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
                aria-label="Consulta siguiente"
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
              {avisoPaso && <p className="w-full text-sm text-accent">{avisoPaso}</p>}
              {selected.client_id ? (
                <Link
                  href={`/administrator/clientes?id=${selected.client_id}`}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
                >
                  Ya es cliente · ver ficha
                </Link>
              ) : (
                <button
                  type="button"
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  disabled={pasando}
                  onClick={() => void pasarACliente(selected)}
                >
                  {pasando ? "Pasando…" : "Pasar a cliente"}
                </button>
              )}
              <a
                href={`mailto:${selected.email}`}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium hover:border-brand"
              >
                Responder por email
              </a>
            </div>
          }
        >
          <div className="mb-4 flex flex-wrap gap-1.5">
            {ESTADOS.map((e) => (
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
            <Dato
              icono={selected.contact_type === "professional" ? Building2 : UserRound}
              valor={
                selected.contact_type === "professional"
                  ? `Empresa${selected.company ? ` · ${selected.company}` : ""}`
                  : "Particular"
              }
            />
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
            {selected.service_interest && (
              <Dato icono={Wrench} valor={nombreServicio(selected.service_interest)} />
            )}
            {selected.budget_range && <Dato icono={Banknote} valor={selected.budget_range} />}
          </div>

          <p className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-mutedink">
            Mensaje
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
