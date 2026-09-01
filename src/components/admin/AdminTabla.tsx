"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

export type ColumnaTabla<T> = {
  id: string;
  titulo: string;
  ordenable?: boolean;
  alinear?: "left" | "center" | "right";
  celda: (fila: T) => ReactNode;
  valor?: (fila: T) => string | number | Date | null | undefined;
};

type Props<T> = {
  columnas: ColumnaTabla<T>[];
  filas: T[];
  clave: (fila: T) => string;
  vacio: string;
  busqueda?: string;
  onBusqueda?: (v: string) => void;
  placeholder?: string;
  filtro?: string;
  onFiltro?: (v: string) => void;
  opcionesFiltro?: { value: string; label: string }[];
  filaActiva?: string | null;
  onFila?: (fila: T) => void;
  pie?: ReactNode;
};

export function formatFechaAdmin(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Madrid",
  });
}

export function AdminPildora({
  tono,
  children,
}: {
  tono: "ok" | "warn" | "bad" | "info" | "muted";
  children: ReactNode;
}) {
  const cls = {
    ok: "bg-emerald-50 text-emerald-800",
    warn: "bg-amber-50 text-amber-800",
    bad: "bg-red-50 text-red-800",
    info: "bg-ice text-brand-dark",
    muted: "bg-soft text-mutedink",
  }[tono];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

export default function AdminTabla<T>({
  columnas,
  filas,
  clave,
  vacio,
  busqueda,
  onBusqueda,
  placeholder = "Buscar…",
  filtro,
  onFiltro,
  opcionesFiltro,
  filaActiva,
  onFila,
  pie,
}: Props<T>) {
  const [orden, setOrden] = useState<{ id: string; dir: "asc" | "desc" } | null>(null);

  const ordenadas = useMemo(() => {
    if (!orden) return filas;
    const col = columnas.find((c) => c.id === orden.id);
    if (!col?.valor) return filas;
    const copia = [...filas];
    copia.sort((a, b) => {
      const av = col.valor!(a);
      const bv = col.valor!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av instanceof Date || bv instanceof Date) {
        const at = av instanceof Date ? av.getTime() : new Date(String(av)).getTime();
        const bt = bv instanceof Date ? bv.getTime() : new Date(String(bv)).getTime();
        return orden.dir === "asc" ? at - bt : bt - at;
      }
      if (typeof av === "number" && typeof bv === "number") {
        return orden.dir === "asc" ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv), "es", { numeric: true });
      return orden.dir === "asc" ? cmp : -cmp;
    });
    return copia;
  }, [filas, orden, columnas]);

  function toggle(id: string) {
    setOrden((prev) => {
      if (prev?.id === id) return { id, dir: prev.dir === "desc" ? "asc" : "desc" };
      return { id, dir: "desc" };
    });
  }

  const hayBarra = onBusqueda || (onFiltro && opcionesFiltro);

  return (
    <div className="space-y-4">
      {hayBarra && (
        <div className="admin-card p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            {onBusqueda && (
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedink" />
                <input
                  type="search"
                  value={busqueda ?? ""}
                  onChange={(e) => onBusqueda(e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-line bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/20"
                />
              </div>
            )}
            {onFiltro && opcionesFiltro && (
              <select
                value={filtro ?? ""}
                onChange={(e) => onFiltro(e.target.value)}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/20"
              >
                {opcionesFiltro.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-soft">
              <tr>
                {columnas.map((col) => {
                  const align =
                    col.alinear === "center"
                      ? "text-center"
                      : col.alinear === "right"
                        ? "text-right"
                        : "text-left";
                  const activo = orden?.id === col.id;
                  return (
                    <th
                      key={col.id}
                      className={`admin-th ${align} ${col.ordenable ? "cursor-pointer select-none hover:bg-ice" : ""}`}
                      onClick={col.ordenable ? () => toggle(col.id) : undefined}
                    >
                      <span
                        className={`inline-flex items-center gap-1 ${
                          col.alinear === "center"
                            ? "justify-center"
                            : col.alinear === "right"
                              ? "justify-end"
                              : ""
                        }`}
                      >
                        {col.titulo}
                        {col.ordenable &&
                          (activo ? (
                            orden?.dir === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5 text-brand" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-brand" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-mutedink/40" />
                          ))}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ordenadas.length === 0 ? (
                <tr>
                  <td colSpan={columnas.length} className="px-4 py-12 text-center text-sm text-mutedink">
                    {vacio}
                  </td>
                </tr>
              ) : (
                ordenadas.map((fila) => {
                  const id = clave(fila);
                  const activa = filaActiva === id;
                  return (
                    <tr
                      key={id}
                      className={`${onFila ? "cursor-pointer" : ""} ${activa ? "bg-ice" : "hover:bg-soft"}`}
                      onClick={onFila ? () => onFila(fila) : undefined}
                    >
                      {columnas.map((col) => {
                        const align =
                          col.alinear === "center"
                            ? "text-center"
                            : col.alinear === "right"
                              ? "text-right"
                              : "text-left";
                        return (
                          <td key={col.id} className={`admin-td ${align}`}>
                            {col.celda(fila)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-4 py-3 text-sm text-mutedink">
          {pie ?? `Mostrando ${ordenadas.length} ${ordenadas.length === 1 ? "fila" : "filas"}`}
        </div>
      </div>
    </div>
  );
}
