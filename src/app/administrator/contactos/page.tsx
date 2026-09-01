"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminTabla, {
  AdminPildora,
  formatFechaAdmin,
  type ColumnaTabla,
} from "@/components/admin/AdminTabla";
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
  { value: "", label: "Todos los estados" },
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

export default function AdminContactosPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
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
    setSelected((s) => (s?.id === id ? { ...s, ...cambios } : s));
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
      celda: (l) =>
        l.service_interest ? (getServicio(l.service_interest)?.nombre ?? l.service_interest) : "—",
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

  return (
    <div className="admin-shell">
      <h1 className="mb-2 text-3xl">Contactos</h1>
      <p className="mb-6 text-mutedink">
        Leads de /contacto. Si contratan, pásalos a Clientes. No se borra ninguno desde aquí.
      </p>
      {error && <p className="mb-4 text-accent">{error}</p>}

      <AdminTabla
        columnas={columnas}
        filas={visibles}
        clave={(l) => l.id}
        vacio={busqueda || filtro ? "Nada coincide con el filtro." : "Aún no hay consultas."}
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        placeholder="Buscar nombre, email, teléfono…"
        filtro={filtro}
        onFiltro={setFiltro}
        opcionesFiltro={ESTADOS}
        filaActiva={selected?.id ?? null}
        onFila={(lead) => {
          setSelected(lead);
          if (!lead.is_read) void patch(lead.id, { is_read: true, status: "read" });
        }}
        pie={`Mostrando ${visibles.length} de ${leads.length}`}
      />

      {selected && (
        <div className="admin-card mt-6 space-y-3 p-6 text-sm">
          <p>
            <b>{selected.name}</b>
            {selected.contact_type === "professional" && selected.company
              ? ` · ${selected.company}`
              : " · Particular"}
          </p>
          <p>
            <a href={`mailto:${selected.email}`} className="text-accent underline">
              {selected.email}
            </a>
            {selected.phone ? ` · ${selected.phone}` : ""}
          </p>
          <p className="text-mutedink">
            {selected.municipio ?? "—"} ·{" "}
            {selected.service_interest
              ? (getServicio(selected.service_interest)?.nombre ?? selected.service_interest)
              : "—"}{" "}
            · {selected.budget_range ?? "—"} · {selected.source ?? "—"}
          </p>
          <p className="whitespace-pre-wrap pt-2">{selected.message}</p>
          <label className="mt-2 block text-xs text-mutedink">
            Estado
            <select
              className="field-input mt-1"
              value={selected.status}
              onChange={(e) => void patch(selected.id, { status: e.target.value })}
            >
              {ESTADOS.filter((e) => e.value).map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>
          {avisoPaso && <p className="pt-2 text-accent">{avisoPaso}</p>}
          {selected.client_id ? (
            <Link
              href={`/administrator/clientes?id=${selected.client_id}`}
              className="mt-2 inline-block text-sm text-accent underline"
            >
              Ya es cliente · ver ficha
            </Link>
          ) : (
            <button
              type="button"
              className="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={pasando}
              onClick={() => void pasarACliente(selected)}
            >
              {pasando ? "Pasando…" : "Pasar a cliente"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
