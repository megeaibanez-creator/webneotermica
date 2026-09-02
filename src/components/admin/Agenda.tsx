"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import AdminHoja from "@/components/admin/AdminHoja";
import { AdminPildora } from "@/components/admin/AdminTabla";
import {
  type ActuacionCompleta,
  type Perfil,
  ESTADOS_ACTUACION,
  TIPOS_ACTUACION,
  claveDia,
  diasQueOcupa,
  etiquetaEstadoActuacion,
  etiquetaTipo,
  fmtHora,
  isoALocal,
  rangoActuacion,
  tonoEstadoActuacion,
} from "@/lib/agenda";

type ProyectoSel = {
  id: string;
  title: string;
  service: string | null;
  municipio: string | null;
  client_id: string;
  cliente_nombre: string;
};

type Datos = {
  actuaciones: ActuacionCompleta[];
  perfiles: Perfil[];
  proyectos: ProyectoSel[];
};

const VACIO: Datos = { actuaciones: [], perfiles: [], proyectos: [] };
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function claveLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function celdasDelMes(anchor: Date): Date[] {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const primero = new Date(y, m, 1);
  const wd = (primero.getDay() + 6) % 7; // lunes = 0
  const inicio = new Date(y, m, 1 - wd);
  const celdas: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    celdas.push(d);
  }
  return celdas;
}

export default function Agenda() {
  const router = useRouter();
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [error, setError] = useState("");
  const [ancla, setAncla] = useState(() => new Date());
  const [filtro, setFiltro] = useState<string>("");
  const [editar, setEditar] = useState<ActuacionCompleta | null>(null);
  const [nueva, setNueva] = useState<{ fecha?: string; obra?: string } | null>(null);
  const [obraTratada, setObraTratada] = useState(false);

  async function cargar() {
    const res = await fetch("/api/admin/agenda");
    if (res.status === 401) {
      router.replace("/administrator/login");
      return;
    }
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error ?? "No se pudo cargar la agenda.");
      return;
    }
    setError("");
    setDatos((await res.json()) as Datos);
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si venimos de una obra (/administrator/agenda?obra=ID), abre el editor con
  // esa obra ya elegida en cuanto lleguen los datos.
  useEffect(() => {
    if (obraTratada || datos.proyectos.length === 0) return;
    const obra = new URLSearchParams(window.location.search).get("obra");
    if (obra && datos.proyectos.some((p) => p.id === obra)) {
      setNueva({ obra });
    }
    setObraTratada(true);
  }, [datos.proyectos, obraTratada]);

  const perfilPorId = useMemo(() => {
    const m = new Map<string, Perfil>();
    for (const p of datos.perfiles) m.set(p.id, p);
    return m;
  }, [datos.perfiles]);

  const filtradas = useMemo(() => {
    if (!filtro) return datos.actuaciones;
    return datos.actuaciones.filter((a) => a.responsables.includes(filtro));
  }, [datos.actuaciones, filtro]);

  const porDia = useMemo(() => {
    const m = new Map<string, ActuacionCompleta[]>();
    for (const a of filtradas) {
      for (const clave of diasQueOcupa(a)) {
        const arr = m.get(clave) ?? [];
        arr.push(a);
        m.set(clave, arr);
      }
    }
    for (const arr of m.values()) {
      arr.sort((x, y) => x.starts_at.localeCompare(y.starts_at));
    }
    return m;
  }, [filtradas]);

  const celdas = useMemo(() => celdasDelMes(ancla), [ancla]);
  const hoyClave = claveLocal(new Date());
  const mesActual = ancla.getMonth();

  function colorDe(a: ActuacionCompleta): string {
    const id = a.responsables[0];
    return (id && perfilPorId.get(id)?.color) || "#94a3b8";
  }

  return (
    <div className="admin-shell">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-2 text-3xl">Agenda</h1>
          <p className="max-w-xl text-mutedink">
            El calendario de trabajo. Cada actuación es una fase de una obra: visita,
            preinstalación, instalación… con fecha, lugar y responsable.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
          onClick={() => setNueva({})}
        >
          <CalendarPlus className="h-4 w-4" /> Nueva actuación
        </button>
      </div>

      {error && <p className="mb-4 text-accent">{error}</p>}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Mes anterior"
            className="rounded-lg border border-line bg-white p-2 hover:border-brand hover:text-brand"
            onClick={() => setAncla(new Date(ancla.getFullYear(), ancla.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="min-w-[11rem] text-center font-display text-lg font-semibold capitalize">
            {MESES[mesActual]} {ancla.getFullYear()}
          </h2>
          <button
            type="button"
            aria-label="Mes siguiente"
            className="rounded-lg border border-line bg-white p-2 hover:border-brand hover:text-brand"
            onClick={() => setAncla(new Date(ancla.getFullYear(), ancla.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="ml-1 rounded-lg border border-line bg-white px-3 py-2 text-sm hover:border-brand hover:text-brand"
            onClick={() => setAncla(new Date())}
          >
            Hoy
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltro("")}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              filtro === "" ? "bg-brand text-white" : "border border-line bg-white text-mutedink"
            }`}
          >
            Todos
          </button>
          {datos.perfiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setFiltro(p.id === filtro ? "" : p.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                filtro === p.id ? "text-white" : "border border-line bg-white text-ink"
              }`}
              style={filtro === p.id ? { backgroundColor: p.color } : undefined}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line bg-soft">
          {DIAS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-mutedink">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {celdas.map((celda, i) => {
            const clave = claveLocal(celda);
            const delMes = celda.getMonth() === mesActual;
            const esHoy = clave === hoyClave;
            const lista = porDia.get(clave) ?? [];
            return (
              <button
                type="button"
                key={clave + i}
                onClick={() => setNueva({ fecha: clave })}
                className={`min-h-[104px] border-b border-r border-line p-1.5 text-left align-top transition-colors hover:bg-ice/50 ${
                  delMes ? "bg-white" : "bg-page/60"
                } ${i % 7 === 6 ? "border-r-0" : ""}`}
              >
                <span
                  className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    esHoy ? "bg-brand text-white" : delMes ? "text-ink" : "text-mutedink/50"
                  }`}
                >
                  {celda.getDate()}
                </span>
                <span className="block space-y-1">
                  {lista.slice(0, 3).map((a) => (
                    <span
                      key={a.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditar(a);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          setEditar(a);
                        }
                      }}
                      className={`block truncate rounded px-1.5 py-0.5 text-[0.7rem] font-medium text-white ${
                        a.estado === "cancelada" ? "line-through opacity-60" : ""
                      }`}
                      style={{ backgroundColor: colorDe(a) }}
                      title={`${a.titulo} · ${rangoActuacion(a)}`}
                    >
                      {!a.dia_completo && (
                        <span className="opacity-90">{fmtHora(a.starts_at)} </span>
                      )}
                      {a.titulo}
                    </span>
                  ))}
                  {lista.length > 3 && (
                    <span className="block px-1.5 text-[0.7rem] font-medium text-mutedink">
                      +{lista.length - 3} más
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-sm text-mutedink">
        Toca un día para crear una actuación, o una barra para abrirla. El color es el del
        responsable.
      </p>

      {(editar || nueva) && (
        <EditorActuacion
          actuacion={editar}
          fechaInicial={nueva?.fecha}
          proyectoInicial={nueva?.obra}
          proyectos={datos.proyectos}
          perfiles={datos.perfiles}
          onCerrar={() => {
            setEditar(null);
            setNueva(null);
          }}
          onGuardado={() => {
            setEditar(null);
            setNueva(null);
            void cargar();
          }}
        />
      )}
    </div>
  );
}

// --------------------------------------------------------------------------

function EditorActuacion({
  actuacion,
  fechaInicial,
  proyectoInicial,
  proyectos,
  perfiles,
  onCerrar,
  onGuardado,
}: {
  actuacion: ActuacionCompleta | null;
  fechaInicial?: string;
  proyectoInicial?: string;
  proyectos: ProyectoSel[];
  perfiles: Perfil[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const edita = Boolean(actuacion);
  const base = fechaInicial ?? claveDia(new Date());

  const [projectId, setProjectId] = useState(actuacion?.project_id ?? proyectoInicial ?? "");
  const [titulo, setTitulo] = useState(actuacion?.titulo ?? "");
  const [tipo, setTipo] = useState(actuacion?.tipo ?? "instalacion");
  const [estado, setEstado] = useState(actuacion?.estado ?? "pendiente");
  const [diaCompleto, setDiaCompleto] = useState(actuacion?.dia_completo ?? false);
  const [inicio, setInicio] = useState(
    actuacion ? isoALocal(actuacion.starts_at) : `${base}T09:00`
  );
  const [fin, setFin] = useState(
    actuacion ? isoALocal(actuacion.ends_at) : `${base}T11:00`
  );
  const [lugar, setLugar] = useState(actuacion?.lugar ?? "");
  const [notas, setNotas] = useState(actuacion?.notas ?? "");
  const [responsables, setResponsables] = useState<string[]>(actuacion?.responsables ?? []);
  const [aviso, setAviso] = useState("");
  const [pendiente, setPendiente] = useState(false);

  const proyectoSel = proyectos.find((p) => p.id === projectId);

  function toggleResp(id: string) {
    setResponsables((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function fechaAIso(valor: string, finDeDia: boolean): string {
    if (diaCompleto) {
      const dia = valor.slice(0, 10);
      return new Date(`${dia}T${finDeDia ? "20:00" : "08:00"}`).toISOString();
    }
    return new Date(valor).toISOString();
  }

  async function guardar() {
    setAviso("");
    if (!projectId) return setAviso("Elige la obra.");
    if (!titulo.trim()) return setAviso("Ponle un título.");
    setPendiente(true);
    const cuerpo = {
      id: actuacion?.id,
      project_id: projectId,
      titulo,
      tipo,
      estado,
      dia_completo: diaCompleto,
      starts_at: fechaAIso(inicio, false),
      ends_at: fechaAIso(fin, true),
      lugar,
      notas,
      responsables,
    };
    const res = await fetch("/api/admin/agenda", {
      method: edita ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const d = (await res.json().catch(() => ({}))) as { error?: string };
    setPendiente(false);
    if (!res.ok) return setAviso(d.error ?? "No se pudo guardar.");
    onGuardado();
  }

  async function borrar() {
    if (!actuacion) return;
    if (!confirm("¿Eliminar esta actuación de la agenda?")) return;
    setPendiente(true);
    const res = await fetch(`/api/admin/agenda?id=${actuacion.id}`, { method: "DELETE" });
    setPendiente(false);
    if (res.ok) onGuardado();
  }

  const tipoInput = diaCompleto ? "date" : "datetime-local";
  const valInicio = diaCompleto ? inicio.slice(0, 10) : inicio;
  const valFin = diaCompleto ? fin.slice(0, 10) : fin;

  return (
    <AdminHoja
      titulo={edita ? "Editar actuación" : "Nueva actuación"}
      subtitulo={edita ? rangoActuacion(actuacion!) : undefined}
      onCerrar={onCerrar}
      pie={
        <div className="flex items-center justify-between gap-2">
          <button
            type="submit"
            form="form-actuacion"
            disabled={pendiente}
            className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pendiente ? "Guardando…" : edita ? "Guardar cambios" : "Crear actuación"}
          </button>
          {edita && (
            <button
              type="button"
              onClick={() => void borrar()}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
          )}
        </div>
      }
    >
      <form
        id="form-actuacion"
        className="space-y-3 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          void guardar();
        }}
      >
        {aviso && <p className="text-accent">{aviso}</p>}

        <label className="block">
          <span className="field-label">Obra</span>
          <select
            className="field-input"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
          >
            <option value="">Elegir obra…</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} · {p.cliente_nombre}
              </option>
            ))}
          </select>
        </label>
        {proyectoSel && (
          <p className="-mt-1 text-xs text-mutedink">
            Cliente: {proyectoSel.cliente_nombre}
            {proyectoSel.municipio ? ` · ${proyectoSel.municipio}` : ""}
            {"  "}
            <Link
              href={`/administrator/proyectos?id=${proyectoSel.id}`}
              className="text-accent underline"
            >
              ver obra
            </Link>
          </p>
        )}

        <label className="block">
          <span className="field-label">Título</span>
          <input
            className="field-input"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Instalación de split, medición…"
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="field-label">Tipo</span>
            <select
              className="field-input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as typeof tipo)}
            >
              {TIPOS_ACTUACION.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">Estado</span>
            <select
              className="field-input"
              value={estado}
              onChange={(e) => setEstado(e.target.value as typeof estado)}
            >
              {ESTADOS_ACTUACION.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand"
            checked={diaCompleto}
            onChange={(e) => setDiaCompleto(e.target.checked)}
          />
          <span>Días completos (obra de varios días, sin hora fija)</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="field-label">{diaCompleto ? "Desde el día" : "Inicio"}</span>
            <input
              type={tipoInput}
              className="field-input"
              value={valInicio}
              onChange={(e) => setInicio(diaCompleto ? `${e.target.value}T08:00` : e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="field-label">{diaCompleto ? "Hasta el día" : "Fin"}</span>
            <input
              type={tipoInput}
              className="field-input"
              value={valFin}
              onChange={(e) => setFin(diaCompleto ? `${e.target.value}T20:00` : e.target.value)}
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="field-label">Lugar (si es distinto del municipio de la obra)</span>
          <input
            className="field-input"
            value={lugar}
            onChange={(e) => setLugar(e.target.value)}
            placeholder="Dirección / referencia"
          />
        </label>

        <div>
          <span className="field-label">Responsables</span>
          {perfiles.length === 0 ? (
            <p className="text-xs text-mutedink">
              No hay técnicos dados de alta.{" "}
              <Link href="/administrator/equipo" className="text-accent underline">
                Crear en Equipo
              </Link>
              .
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {perfiles.map((p) => {
                const on = responsables.includes(p.id);
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => toggleResp(p.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
                      on ? "text-white" : "border-line bg-white text-ink"
                    }`}
                    style={on ? { backgroundColor: p.color, borderColor: p.color } : undefined}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: on ? "#fff" : p.color }}
                    />
                    {p.nombre}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <label className="block">
          <span className="field-label">Notas para el técnico</span>
          <textarea
            className="field-input"
            rows={3}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Material, acceso, contacto en obra…"
          />
        </label>

        {edita && actuacion && (
          <p className="pt-1 text-xs text-mutedink">
            <AdminPildora tono={tonoEstadoActuacion(actuacion.estado)}>
              {etiquetaEstadoActuacion(actuacion.estado)}
            </AdminPildora>{" "}
            · {etiquetaTipo(actuacion.tipo)}
          </p>
        )}
      </form>
    </AdminHoja>
  );
}
