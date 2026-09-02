"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  COPY_CRM,
  ESTADOS_FACTURA,
  ESTADOS_PRESUPUESTO,
  ESTADOS_PROYECTO,
  type Client,
  type EntidadCrm,
  type Invoice,
  type Project,
  type Quote,
  type SnapshotCrm,
  etiquetaEstado,
  formatImporte,
  nombreCliente,
} from "@/lib/crm";
import { SERVICIOS, getServicio } from "@/lib/servicios";
import AdminTabla, {
  AdminBotonLote,
  AdminChip,
  AdminPildora,
  formatFechaAdmin,
  type ColumnaTabla,
} from "@/components/admin/AdminTabla";
import AdminHoja from "@/components/admin/AdminHoja";

type Props = {
  entidad: EntidadCrm;
  inicialId?: string;
  inicialCliente?: string;
};

const VACIO: SnapshotCrm = { clients: [], projects: [], quotes: [], invoices: [] };

const UNIDADES: Record<EntidadCrm, [string, string]> = {
  clients: ["cliente", "clientes"],
  projects: ["obra", "obras"],
  quotes: ["presupuesto", "presupuestos"],
  invoices: ["factura", "facturas"],
};

function tituloFicha(entidad: EntidadCrm, fila: { id: string }): string {
  if (entidad === "clients") return nombreCliente(fila as Client);
  if (entidad === "projects") return (fila as Project).title;
  if (entidad === "quotes") {
    const q = fila as Quote;
    return `${q.number} · ${q.title}`;
  }
  const i = fila as Invoice;
  return i.title ? `${i.number} · ${i.title}` : i.number;
}

export default function CrmLista({ entidad, inicialId, inicialCliente }: Props) {
  const router = useRouter();
  const copy = COPY_CRM[entidad];
  const [snap, setSnap] = useState<SnapshotCrm>(VACIO);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(inicialId ?? null);
  const [nuevo, setNuevo] = useState(!inicialId && Boolean(inicialCliente));
  const [seleccion, setSeleccion] = useState<string[]>([]);

  async function cargar() {
    const res = await fetch("/api/admin/crm");
    if (res.status === 401) {
      router.replace("/administrator/login");
      return;
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "No se pudo cargar el taller.");
      return;
    }
    setSnap((await res.json()) as SnapshotCrm);
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filas = useMemo(() => {
    if (entidad === "clients") return snap.clients;
    if (entidad === "projects") {
      const list = snap.projects;
      return inicialCliente ? list.filter((p) => p.client_id === inicialCliente) : list;
    }
    if (entidad === "quotes") {
      const list = snap.quotes;
      return inicialCliente ? list.filter((q) => q.client_id === inicialCliente) : list;
    }
    const list = snap.invoices;
    return inicialCliente ? list.filter((i) => i.client_id === inicialCliente) : list;
  }, [entidad, snap, inicialCliente]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter((fila) => {
      if (filtro && "status" in fila && (fila as { status: string }).status !== filtro) {
        return false;
      }
      if (!q) return true;
      return textoBuscable(entidad, fila, snap).includes(q);
    });
  }, [filas, filtro, busqueda, entidad, snap]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return (filas as { id: string }[]).find((f) => f.id === selectedId) ?? null;
  }, [filas, selectedId]);

  const estados =
    entidad === "projects"
      ? ESTADOS_PROYECTO
      : entidad === "quotes"
        ? ESTADOS_PRESUPUESTO
        : entidad === "invoices"
          ? ESTADOS_FACTURA
          : [];

  const porEstado = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of filas) {
      if ("status" in f) {
        const s = (f as { status: string }).status;
        c[s] = (c[s] ?? 0) + 1;
      }
    }
    return c;
  }, [filas]);

  async function cambiarEstadoLote(status: string) {
    const ids = [...seleccion];
    await Promise.all(
      ids.map((id) =>
        fetch("/api/admin/crm", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entidad, id, status }),
        })
      )
    );
    setSeleccion([]);
    await cargar();
  }

  const columnas = useMemo(
    () => columnasDe(entidad, snap),
    [entidad, snap]
  );

  const unidad = UNIDADES[entidad];

  return (
    <div className="admin-shell">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-2 text-3xl">{copy.titulo}</h1>
          <p className="max-w-xl text-mutedink">{copy.texto}</p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
          onClick={() => {
            setNuevo(true);
            setSelectedId(null);
          }}
        >
          {copy.alta}
        </button>
      </div>

      {error && <p className="mb-4 text-accent">{error}</p>}

      {estados.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <AdminChip activo={filtro === ""} onClick={() => setFiltro("")}>
            Todos · {filas.length}
          </AdminChip>
          {estados.map((e) => (
            <AdminChip
              key={e.value}
              activo={filtro === e.value}
              onClick={() => setFiltro(e.value)}
            >
              {e.label} · {porEstado[e.value] ?? 0}
            </AdminChip>
          ))}
        </div>
      )}

      <AdminTabla
        columnas={columnas}
        filas={visibles}
        clave={(f) => f.id}
        vacio={busqueda || filtro ? "Nada coincide con el filtro." : "Aún no hay nada aquí."}
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        placeholder={placeholderDe(entidad)}
        filaActiva={nuevo ? null : selectedId}
        onFila={(fila) => {
          setSelectedId(fila.id);
          setNuevo(false);
        }}
        unidad={unidad}
        seleccion={estados.length > 0 ? seleccion : undefined}
        onSeleccion={estados.length > 0 ? setSeleccion : undefined}
        acciones={
          estados.length > 0 ? (
            <>
              <span className="text-xs text-mutedink">Pasar a:</span>
              {estados.map((e) => (
                <AdminBotonLote key={e.value} onClick={() => void cambiarEstadoLote(e.value)}>
                  {e.label}
                </AdminBotonLote>
              ))}
            </>
          ) : undefined
        }
      />

      {nuevo && (
        <AdminHoja titulo={copy.alta} onCerrar={() => setNuevo(false)}>
          <Formulario
            entidad={entidad}
            snap={snap}
            inicialCliente={inicialCliente}
            onCancelar={() => setNuevo(false)}
            onGuardado={(id) => {
              setNuevo(false);
              setSelectedId(id);
              void cargar();
            }}
          />
        </AdminHoja>
      )}

      {!nuevo && selected && (
        <AdminHoja
          titulo={tituloFicha(entidad, selected)}
          subtitulo={formatFechaAdmin((selected as { created_at?: string }).created_at)}
          onCerrar={() => setSelectedId(null)}
        >
          <Ficha
            entidad={entidad}
            fila={selected}
            snap={snap}
            onCambio={() => void cargar()}
          />
        </AdminHoja>
      )}
    </div>
  );
}

function placeholderDe(entidad: EntidadCrm): string {
  if (entidad === "clients") return "Buscar por nombre, teléfono, email…";
  if (entidad === "projects") return "Buscar obra o cliente…";
  if (entidad === "quotes") return "Buscar número, título o cliente…";
  return "Buscar número, concepto o cliente…";
}

function textoBuscable(entidad: EntidadCrm, fila: { id: string }, snap: SnapshotCrm): string {
  const clienteDe = (id: string) => {
    const c = snap.clients.find((x) => x.id === id);
    return c ? nombreCliente(c) : "";
  };
  if (entidad === "clients") {
    const c = fila as Client;
    return [c.name, c.company, c.email, c.phone, c.municipio].join(" ").toLowerCase();
  }
  if (entidad === "projects") {
    const p = fila as Project;
    return [p.title, p.municipio, p.service, clienteDe(p.client_id)].join(" ").toLowerCase();
  }
  if (entidad === "quotes") {
    const q = fila as Quote;
    return [q.number, q.title, clienteDe(q.client_id)].join(" ").toLowerCase();
  }
  const i = fila as Invoice;
  return [i.number, i.title, clienteDe(i.client_id)].join(" ").toLowerCase();
}

function pildoraEstado(entidad: EntidadCrm, status: string) {
  const tono =
    status === "entregado" || status === "aceptado" || status === "cobrada"
      ? "ok"
      : status === "en_obra" || status === "enviado" || status === "emitida"
        ? "info"
        : status === "cancelado" || status === "rechazado" || status === "anulada"
          ? "bad"
          : status === "previsto" || status === "borrador"
            ? "muted"
            : "warn";
  return <AdminPildora tono={tono}>{etiquetaEstado(entidad, status)}</AdminPildora>;
}

function columnasDe(entidad: EntidadCrm, snap: SnapshotCrm): ColumnaTabla<{ id: string }>[] {
  const cliente = (id: string) => {
    const c = snap.clients.find((x) => x.id === id);
    return c ? nombreCliente(c) : "—";
  };
  const obra = (id: string | null) => {
    if (!id) return "—";
    return snap.projects.find((p) => p.id === id)?.title ?? "—";
  };

  if (entidad === "clients") {
    return [
      {
        id: "name",
        titulo: "Cliente",
        ordenable: true,
        valor: (f) => nombreCliente(f as Client),
        celda: (f) => <span className="font-medium">{nombreCliente(f as Client)}</span>,
      },
      {
        id: "tipo",
        titulo: "Tipo",
        ordenable: true,
        valor: (f) => (f as Client).contact_type,
        celda: (f) =>
          (f as Client).contact_type === "professional" ? "Empresa" : "Particular",
      },
      {
        id: "phone",
        titulo: "Teléfono",
        valor: (f) => (f as Client).phone,
        celda: (f) => (f as Client).phone ?? "—",
      },
      {
        id: "email",
        titulo: "Email",
        ordenable: true,
        valor: (f) => (f as Client).email,
        celda: (f) => (f as Client).email ?? "—",
      },
      {
        id: "municipio",
        titulo: "Municipio",
        ordenable: true,
        valor: (f) => (f as Client).municipio,
        celda: (f) => (f as Client).municipio ?? "—",
      },
      {
        id: "obras",
        titulo: "Obras",
        alinear: "center",
        ordenable: true,
        valor: (f) => snap.projects.filter((p) => p.client_id === f.id).length,
        celda: (f) => snap.projects.filter((p) => p.client_id === f.id).length,
      },
      {
        id: "created_at",
        titulo: "Alta",
        ordenable: true,
        valor: (f) => new Date((f as Client).created_at),
        celda: (f) => formatFechaAdmin((f as Client).created_at),
      },
    ];
  }

  if (entidad === "projects") {
    return [
      {
        id: "title",
        titulo: "Obra",
        ordenable: true,
        valor: (f) => (f as Project).title,
        celda: (f) => <span className="font-medium">{(f as Project).title}</span>,
      },
      {
        id: "cliente",
        titulo: "Cliente",
        ordenable: true,
        valor: (f) => cliente((f as Project).client_id),
        celda: (f) => cliente((f as Project).client_id),
      },
      {
        id: "service",
        titulo: "Servicio",
        valor: (f) => (f as Project).service,
        celda: (f) => {
          const s = (f as Project).service;
          return s ? (getServicio(s)?.nombre ?? s) : "—";
        },
      },
      {
        id: "municipio",
        titulo: "Municipio",
        ordenable: true,
        valor: (f) => (f as Project).municipio,
        celda: (f) => (f as Project).municipio ?? "—",
      },
      {
        id: "status",
        titulo: "Estado",
        ordenable: true,
        valor: (f) => (f as Project).status,
        celda: (f) => pildoraEstado("projects", (f as Project).status),
      },
      {
        id: "created_at",
        titulo: "Alta",
        ordenable: true,
        valor: (f) => new Date((f as Project).created_at),
        celda: (f) => formatFechaAdmin((f as Project).created_at),
      },
    ];
  }

  if (entidad === "quotes") {
    return [
      {
        id: "number",
        titulo: "Nº",
        ordenable: true,
        valor: (f) => (f as Quote).number,
        celda: (f) => <span className="font-medium">{(f as Quote).number}</span>,
      },
      {
        id: "title",
        titulo: "Título",
        ordenable: true,
        valor: (f) => (f as Quote).title,
        celda: (f) => (f as Quote).title,
      },
      {
        id: "cliente",
        titulo: "Cliente",
        ordenable: true,
        valor: (f) => cliente((f as Quote).client_id),
        celda: (f) => cliente((f as Quote).client_id),
      },
      {
        id: "obra",
        titulo: "Obra",
        valor: (f) => obra((f as Quote).project_id),
        celda: (f) => obra((f as Quote).project_id),
      },
      {
        id: "amount",
        titulo: "Importe",
        alinear: "right",
        ordenable: true,
        valor: (f) => (f as Quote).amount ?? 0,
        celda: (f) => formatImporte((f as Quote).amount),
      },
      {
        id: "status",
        titulo: "Estado",
        ordenable: true,
        valor: (f) => (f as Quote).status,
        celda: (f) => pildoraEstado("quotes", (f as Quote).status),
      },
      {
        id: "created_at",
        titulo: "Alta",
        ordenable: true,
        valor: (f) => new Date((f as Quote).created_at),
        celda: (f) => formatFechaAdmin((f as Quote).created_at),
      },
    ];
  }

  return [
    {
      id: "number",
      titulo: "Nº",
      ordenable: true,
      valor: (f) => (f as Invoice).number,
      celda: (f) => <span className="font-medium">{(f as Invoice).number}</span>,
    },
    {
      id: "title",
      titulo: "Concepto",
      ordenable: true,
      valor: (f) => (f as Invoice).title,
      celda: (f) => (f as Invoice).title ?? "—",
    },
    {
      id: "cliente",
      titulo: "Cliente",
      ordenable: true,
      valor: (f) => cliente((f as Invoice).client_id),
      celda: (f) => cliente((f as Invoice).client_id),
    },
    {
      id: "obra",
      titulo: "Obra",
      valor: (f) => obra((f as Invoice).project_id),
      celda: (f) => obra((f as Invoice).project_id),
    },
    {
      id: "amount",
      titulo: "Importe",
      alinear: "right",
      ordenable: true,
      valor: (f) => (f as Invoice).amount,
      celda: (f) => formatImporte((f as Invoice).amount),
    },
    {
      id: "status",
      titulo: "Estado",
      ordenable: true,
      valor: (f) => (f as Invoice).status,
      celda: (f) => pildoraEstado("invoices", (f as Invoice).status),
    },
    {
      id: "created_at",
      titulo: "Alta",
      ordenable: true,
      valor: (f) => new Date((f as Invoice).created_at),
      celda: (f) => formatFechaAdmin((f as Invoice).created_at),
    },
  ];
}

function Ficha({
  entidad,
  fila,
  snap,
  onCambio,
}: {
  entidad: EntidadCrm;
  fila: { id: string };
  snap: SnapshotCrm;
  onCambio: () => void;
}) {
  const [aviso, setAviso] = useState("");
  const [guardado, setGuardado] = useState(false);

  async function patch(cambios: Record<string, unknown>) {
    setAviso("");
    setGuardado(false);
    const res = await fetch("/api/admin/crm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entidad, id: fila.id, ...cambios }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setAviso(data.error ?? "No se pudo guardar.");
      return;
    }
    setGuardado(true);
    onCambio();
  }

  const mensajes = (
    <>
      {aviso && <p className="text-accent">{aviso}</p>}
      {guardado && !aviso && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          Cambios guardados.
        </p>
      )}
    </>
  );

  const clienteDe = (clientId: string) => snap.clients.find((c) => c.id === clientId);

  if (entidad === "clients") {
    const c = fila as Client;
    const obras = snap.projects.filter((p) => p.client_id === c.id);
    const ofertas = snap.quotes.filter((q) => q.client_id === c.id);
    const facturas = snap.invoices.filter((i) => i.client_id === c.id);
    return (
      <div className="space-y-4 text-sm">
        {mensajes}
        <CamposCliente
          inicial={c}
          onSubmit={(datos) => void patch(datos)}
          etiqueta="Guardar ficha"
        />
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href={`/administrator/proyectos?cliente=${c.id}`}
            className="rounded-full border border-line px-3 py-1 text-xs"
          >
            Nuevo proyecto
          </Link>
          <Link
            href={`/administrator/presupuestos?cliente=${c.id}`}
            className="rounded-full border border-line px-3 py-1 text-xs"
          >
            Nuevo presupuesto
          </Link>
          <Link
            href={`/administrator/facturacion?cliente=${c.id}`}
            className="rounded-full border border-line px-3 py-1 text-xs"
          >
            Nueva factura
          </Link>
        </div>
        <Relacion titulo="Obras" vacio="Aún no hay obras.">
          {obras.map((p) => (
            <Link key={p.id} href={`/administrator/proyectos?id=${p.id}`} className="block text-accent underline">
              {p.title} · {etiquetaEstado("projects", p.status)}
            </Link>
          ))}
        </Relacion>
        <Relacion titulo="Presupuestos" vacio="Aún no hay ofertas.">
          {ofertas.map((q) => (
            <Link key={q.id} href={`/administrator/presupuestos?id=${q.id}`} className="block text-accent underline">
              {q.number} · {q.title} · {formatImporte(q.amount)}
            </Link>
          ))}
        </Relacion>
        <Relacion titulo="Facturas" vacio="Aún no hay facturas.">
          {facturas.map((i) => (
            <Link key={i.id} href={`/administrator/facturacion?id=${i.id}`} className="block text-accent underline">
              {i.number} · {formatImporte(i.amount)} · {etiquetaEstado("invoices", i.status)}
            </Link>
          ))}
        </Relacion>
      </div>
    );
  }

  if (entidad === "projects") {
    const p = fila as Project;
    const c = clienteDe(p.client_id);
    const ofertas = snap.quotes.filter((q) => q.project_id === p.id);
    const facturas = snap.invoices.filter((i) => i.project_id === p.id);
    return (
      <div className="space-y-4 text-sm">
        {mensajes}
        {c && (
          <p>
            Cliente:{" "}
            <Link href={`/administrator/clientes?id=${c.id}`} className="text-accent underline">
              {nombreCliente(c)}
            </Link>
          </p>
        )}
        <CamposProyecto
          snap={snap}
          inicial={p}
          onSubmit={(datos) => void patch(datos)}
          etiqueta="Guardar obra"
        />
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/administrator/presupuestos?cliente=${p.client_id}`}
            className="rounded-full border border-line px-3 py-1 text-xs"
          >
            Presupuesto de esta obra
          </Link>
          <Link
            href={`/administrator/facturacion?cliente=${p.client_id}`}
            className="rounded-full border border-line px-3 py-1 text-xs"
          >
            Factura de esta obra
          </Link>
        </div>
        <Relacion titulo="Presupuestos" vacio="Ninguna oferta ligada a esta obra.">
          {ofertas.map((q) => (
            <Link key={q.id} href={`/administrator/presupuestos?id=${q.id}`} className="block text-accent underline">
              {q.number} · {formatImporte(q.amount)}
            </Link>
          ))}
        </Relacion>
        <Relacion titulo="Facturas" vacio="Ninguna factura ligada a esta obra.">
          {facturas.map((i) => (
            <Link key={i.id} href={`/administrator/facturacion?id=${i.id}`} className="block text-accent underline">
              {i.number} · {formatImporte(i.amount)}
            </Link>
          ))}
        </Relacion>
      </div>
    );
  }

  if (entidad === "quotes") {
    const q = fila as Quote;
    const c = clienteDe(q.client_id);
    const obra = q.project_id ? snap.projects.find((p) => p.id === q.project_id) : null;
    const facturas = snap.invoices.filter((i) => i.quote_id === q.id);
    return (
      <div className="space-y-4 text-sm">
        {mensajes}
        {c && (
          <p>
            Cliente:{" "}
            <Link href={`/administrator/clientes?id=${c.id}`} className="text-accent underline">
              {nombreCliente(c)}
            </Link>
            {obra ? (
              <>
                {" "}
                · Obra:{" "}
                <Link href={`/administrator/proyectos?id=${obra.id}`} className="text-accent underline">
                  {obra.title}
                </Link>
              </>
            ) : null}
          </p>
        )}
        <CamposPresupuesto
          snap={snap}
          inicial={q}
          onSubmit={(datos) => void patch(datos)}
          etiqueta="Guardar presupuesto"
        />
        {q.status === "aceptado" && (
          <Link
            href={`/administrator/facturacion?cliente=${q.client_id}`}
            className="inline-block rounded-full bg-brand px-3 py-1 text-xs text-white"
          >
            Pasar a factura
          </Link>
        )}
        <Relacion titulo="Facturas de esta oferta" vacio="Aún no se ha facturado.">
          {facturas.map((i) => (
            <Link key={i.id} href={`/administrator/facturacion?id=${i.id}`} className="block text-accent underline">
              {i.number} · {formatImporte(i.amount)}
            </Link>
          ))}
        </Relacion>
      </div>
    );
  }

  const i = fila as Invoice;
  const c = clienteDe(i.client_id);
  const obra = i.project_id ? snap.projects.find((p) => p.id === i.project_id) : null;
  const oferta = i.quote_id ? snap.quotes.find((q) => q.id === i.quote_id) : null;
  return (
    <div className="space-y-4 text-sm">
      {mensajes}
      {c && (
        <p>
          Cliente:{" "}
          <Link href={`/administrator/clientes?id=${c.id}`} className="text-accent underline">
            {nombreCliente(c)}
          </Link>
          {obra ? (
            <>
              {" "}
              · Obra:{" "}
              <Link href={`/administrator/proyectos?id=${obra.id}`} className="text-accent underline">
                {obra.title}
              </Link>
            </>
          ) : null}
          {oferta ? (
            <>
              {" "}
              · Oferta:{" "}
              <Link href={`/administrator/presupuestos?id=${oferta.id}`} className="text-accent underline">
                {oferta.number}
              </Link>
            </>
          ) : null}
        </p>
      )}
      <CamposFactura
        snap={snap}
        inicial={i}
        onSubmit={(datos) => void patch(datos)}
        etiqueta="Guardar factura"
      />
    </div>
  );
}

function Formulario({
  entidad,
  snap,
  inicialCliente,
  onCancelar,
  onGuardado,
}: {
  entidad: EntidadCrm;
  snap: SnapshotCrm;
  inicialCliente?: string;
  onCancelar: () => void;
  onGuardado: (id: string) => void;
}) {
  const [aviso, setAviso] = useState("");
  const [pendiente, setPendiente] = useState(false);

  async function crear(datos: Record<string, unknown>) {
    setAviso("");
    setPendiente(true);
    const res = await fetch("/api/admin/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entidad, ...datos }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; fila?: { id: string } };
    setPendiente(false);
    if (!res.ok || !data.fila) {
      setAviso(data.error ?? "No se pudo crear.");
      return;
    }
    onGuardado(data.fila.id);
  }

  return (
    <div className="space-y-4 text-sm">
      {aviso && <p className="text-accent">{aviso}</p>}
      {entidad === "clients" && (
        <CamposCliente
          onSubmit={(datos) => void crear(datos)}
          etiqueta={pendiente ? "Creando…" : "Crear cliente"}
          onCancelar={onCancelar}
        />
      )}
      {entidad === "projects" && (
        <CamposProyecto
          snap={snap}
          inicialCliente={inicialCliente}
          onSubmit={(datos) => void crear(datos)}
          etiqueta={pendiente ? "Creando…" : "Crear proyecto"}
          onCancelar={onCancelar}
        />
      )}
      {entidad === "quotes" && (
        <CamposPresupuesto
          snap={snap}
          inicialCliente={inicialCliente}
          onSubmit={(datos) => void crear(datos)}
          etiqueta={pendiente ? "Creando…" : "Crear presupuesto"}
          onCancelar={onCancelar}
        />
      )}
      {entidad === "invoices" && (
        <CamposFactura
          snap={snap}
          inicialCliente={inicialCliente}
          onSubmit={(datos) => void crear(datos)}
          etiqueta={pendiente ? "Creando…" : "Crear factura"}
          onCancelar={onCancelar}
        />
      )}
    </div>
  );
}

function Relacion({
  titulo,
  vacio,
  children,
}: {
  titulo: string;
  vacio: string;
  children: ReactNode;
}) {
  const hay = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-mutedink">{titulo}</p>
      {hay ? children : <p className="text-mutedink">{vacio}</p>}
    </div>
  );
}

function SelectCliente({
  snap,
  value,
  onChange,
}: {
  snap: SnapshotCrm;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="block">
      <span className="field-label">Cliente</span>
      <select className="field-input" value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="">Elegir…</option>
        {snap.clients.map((c) => (
          <option key={c.id} value={c.id}>
            {nombreCliente(c)}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectObra({
  snap,
  clientId,
  value,
  onChange,
}: {
  snap: SnapshotCrm;
  clientId: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const obras = snap.projects.filter((p) => !clientId || p.client_id === clientId);
  return (
    <label className="block">
      <span className="field-label">Obra (opcional)</span>
      <select className="field-input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Sin ligar a una obra</option>
        {obras.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
    </label>
  );
}

function Acciones({
  etiqueta,
  onCancelar,
}: {
  etiqueta: string;
  onCancelar?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <button type="submit" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white">
        {etiqueta}
      </button>
      {onCancelar && (
        <button type="button" className="rounded-full border border-line px-4 py-2 text-sm" onClick={onCancelar}>
          Cancelar
        </button>
      )}
    </div>
  );
}

function CamposCliente({
  inicial,
  onSubmit,
  etiqueta,
  onCancelar,
}: {
  inicial?: Client;
  onSubmit: (datos: Record<string, unknown>) => void;
  etiqueta: string;
  onCancelar?: () => void;
}) {
  const [name, setName] = useState(inicial?.name ?? "");
  const [contactType, setContactType] = useState(inicial?.contact_type ?? "particular");
  const [company, setCompany] = useState(inicial?.company ?? "");
  const [email, setEmail] = useState(inicial?.email ?? "");
  const [phone, setPhone] = useState(inicial?.phone ?? "");
  const [municipio, setMunicipio] = useState(inicial?.municipio ?? "");
  const [notes, setNotes] = useState(inicial?.notes ?? "");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name,
          contact_type: contactType,
          company,
          email,
          phone,
          municipio,
          notes,
        });
      }}
    >
      <label className="block">
        <span className="field-label">Nombre</span>
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="block">
        <span className="field-label">Tipo</span>
        <select
          className="field-input"
          value={contactType}
          onChange={(e) => setContactType(e.target.value as "particular" | "professional")}
        >
          <option value="particular">Particular</option>
          <option value="professional">Empresa</option>
        </select>
      </label>
      {contactType === "professional" && (
        <label className="block">
          <span className="field-label">Razón social</span>
          <input className="field-input" value={company} onChange={(e) => setCompany(e.target.value)} required />
        </label>
      )}
      <label className="block">
        <span className="field-label">Teléfono</span>
        <input className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label className="block">
        <span className="field-label">Email</span>
        <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block">
        <span className="field-label">Municipio</span>
        <input className="field-input" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
      </label>
      <label className="block">
        <span className="field-label">Notas</span>
        <textarea className="field-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <Acciones etiqueta={etiqueta} onCancelar={onCancelar} />
    </form>
  );
}

function CamposProyecto({
  snap,
  inicial,
  inicialCliente,
  onSubmit,
  etiqueta,
  onCancelar,
}: {
  snap: SnapshotCrm;
  inicial?: Project;
  inicialCliente?: string;
  onSubmit: (datos: Record<string, unknown>) => void;
  etiqueta: string;
  onCancelar?: () => void;
}) {
  const [clientId, setClientId] = useState(inicial?.client_id ?? inicialCliente ?? "");
  const [title, setTitle] = useState(inicial?.title ?? "");
  const [service, setService] = useState(inicial?.service ?? "");
  const [municipio, setMunicipio] = useState(inicial?.municipio ?? "");
  const [status, setStatus] = useState(inicial?.status ?? "previsto");
  const [notes, setNotes] = useState(inicial?.notes ?? "");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ client_id: clientId, title, service, municipio, status, notes });
      }}
    >
      <SelectCliente snap={snap} value={clientId} onChange={setClientId} />
      <label className="block">
        <span className="field-label">Título de la obra</span>
        <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="block">
        <span className="field-label">Servicio</span>
        <select className="field-input" value={service} onChange={(e) => setService(e.target.value)}>
          <option value="">Sin asignar</option>
          {SERVICIOS.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="field-label">Municipio</span>
        <input className="field-input" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
      </label>
      <label className="block">
        <span className="field-label">Estado</span>
        <select
          className="field-input"
          value={status}
          onChange={(e) => setStatus(e.target.value as Project["status"])}
        >
          {ESTADOS_PROYECTO.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="field-label">Notas</span>
        <textarea className="field-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <Acciones etiqueta={etiqueta} onCancelar={onCancelar} />
    </form>
  );
}

function CamposPresupuesto({
  snap,
  inicial,
  inicialCliente,
  onSubmit,
  etiqueta,
  onCancelar,
}: {
  snap: SnapshotCrm;
  inicial?: Quote;
  inicialCliente?: string;
  onSubmit: (datos: Record<string, unknown>) => void;
  etiqueta: string;
  onCancelar?: () => void;
}) {
  const [clientId, setClientId] = useState(inicial?.client_id ?? inicialCliente ?? "");
  const [projectId, setProjectId] = useState(inicial?.project_id ?? "");
  const [title, setTitle] = useState(inicial?.title ?? "");
  const [amount, setAmount] = useState(inicial?.amount != null ? String(inicial.amount).replace(".", ",") : "");
  const [status, setStatus] = useState(inicial?.status ?? "borrador");
  const [notes, setNotes] = useState(inicial?.notes ?? "");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          client_id: clientId,
          project_id: projectId,
          title,
          amount,
          status,
          notes,
        });
      }}
    >
      <SelectCliente
        snap={snap}
        value={clientId}
        onChange={(id) => {
          setClientId(id);
          setProjectId("");
        }}
      />
      <SelectObra snap={snap} clientId={clientId} value={projectId} onChange={setProjectId} />
      <label className="block">
        <span className="field-label">Título</span>
        <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="block">
        <span className="field-label">Importe (€)</span>
        <input
          className="field-input"
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="field-label">Estado</span>
        <select
          className="field-input"
          value={status}
          onChange={(e) => setStatus(e.target.value as Quote["status"])}
        >
          {ESTADOS_PRESUPUESTO.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="field-label">Notas</span>
        <textarea className="field-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <Acciones etiqueta={etiqueta} onCancelar={onCancelar} />
    </form>
  );
}

function CamposFactura({
  snap,
  inicial,
  inicialCliente,
  onSubmit,
  etiqueta,
  onCancelar,
}: {
  snap: SnapshotCrm;
  inicial?: Invoice;
  inicialCliente?: string;
  onSubmit: (datos: Record<string, unknown>) => void;
  etiqueta: string;
  onCancelar?: () => void;
}) {
  const [clientId, setClientId] = useState(inicial?.client_id ?? inicialCliente ?? "");
  const [projectId, setProjectId] = useState(inicial?.project_id ?? "");
  const [quoteId, setQuoteId] = useState(inicial?.quote_id ?? "");
  const [title, setTitle] = useState(inicial?.title ?? "");
  const [amount, setAmount] = useState(
    inicial?.amount != null ? String(inicial.amount).replace(".", ",") : ""
  );
  const [status, setStatus] = useState(inicial?.status ?? "borrador");
  const [notes, setNotes] = useState(inicial?.notes ?? "");

  const ofertas = snap.quotes.filter((q) => !clientId || q.client_id === clientId);

  function elegirOferta(id: string) {
    setQuoteId(id);
    const q = snap.quotes.find((x) => x.id === id);
    if (!q) return;
    if (!title) setTitle(q.title);
    if (!amount && q.amount != null) setAmount(String(q.amount).replace(".", ","));
    if (q.project_id) setProjectId(q.project_id);
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          client_id: clientId,
          project_id: projectId,
          quote_id: quoteId,
          title,
          amount,
          status,
          notes,
        });
      }}
    >
      <SelectCliente
        snap={snap}
        value={clientId}
        onChange={(id) => {
          setClientId(id);
          setProjectId("");
          setQuoteId("");
        }}
      />
      <SelectObra snap={snap} clientId={clientId} value={projectId} onChange={setProjectId} />
      <label className="block">
        <span className="field-label">Presupuesto de origen (opcional)</span>
        <select className="field-input" value={quoteId} onChange={(e) => elegirOferta(e.target.value)}>
          <option value="">Sin ligar a una oferta</option>
          {ofertas.map((q) => (
            <option key={q.id} value={q.id}>
              {q.number} · {q.title} · {formatImporte(q.amount)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="field-label">Concepto</span>
        <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="block">
        <span className="field-label">Importe (€)</span>
        <input
          className="field-input"
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="field-label">Estado</span>
        <select
          className="field-input"
          value={status}
          onChange={(e) => setStatus(e.target.value as Invoice["status"])}
        >
          {ESTADOS_FACTURA.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="field-label">Notas</span>
        <textarea className="field-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <Acciones etiqueta={etiqueta} onCancelar={onCancelar} />
    </form>
  );
}
