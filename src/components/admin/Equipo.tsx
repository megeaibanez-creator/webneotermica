"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import AdminHoja from "@/components/admin/AdminHoja";
import { AdminPildora } from "@/components/admin/AdminTabla";
import { COLORES_TECNICO, type Perfil } from "@/lib/agenda";

type Acceso = "admin" | "admin_tecnico" | "tecnico";

const ACCESOS: { value: Acceso; label: string; nota: string }[] = [
  { value: "admin", label: "Administrador", nota: "Panel completo. No se le asignan actuaciones." },
  {
    value: "admin_tecnico",
    label: "Admin + técnico",
    nota: "Panel completo y además hace obra: sale en la agenda y ve su calendario.",
  },
  { value: "tecnico", label: "Técnico", nota: "Solo su zona: sus actuaciones y su agenda." },
];

function accesoDe(p: Perfil): Acceso {
  if (p.rol === "tecnico") return "tecnico";
  return p.es_tecnico ? "admin_tecnico" : "admin";
}
function rolYTecnico(a: Acceso): { rol: "admin" | "tecnico"; es_tecnico: boolean } {
  if (a === "tecnico") return { rol: "tecnico", es_tecnico: true };
  if (a === "admin_tecnico") return { rol: "admin", es_tecnico: true };
  return { rol: "admin", es_tecnico: false };
}
function etiquetaAcceso(p: Perfil): string {
  return ACCESOS.find((a) => a.value === accesoDe(p))?.label ?? "—";
}

export default function Equipo() {
  const router = useRouter();
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [error, setError] = useState("");
  const [alta, setAlta] = useState(false);
  const [editar, setEditar] = useState<Perfil | null>(null);

  async function cargar() {
    const res = await fetch("/api/admin/equipo");
    if (res.status === 401) {
      router.replace("/administrator/login");
      return;
    }
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error ?? "No se pudo cargar el equipo.");
      return;
    }
    setError("");
    const d = (await res.json()) as { perfiles: Perfil[] };
    setPerfiles(d.perfiles);
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="admin-shell">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-2 text-3xl">Equipo</h1>
          <p className="max-w-xl text-mutedink">
            Quién entra al sistema y con qué acceso. Los técnicos solo ven sus actuaciones
            y su agenda; los administradores, todo.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
          onClick={() => setAlta(true)}
        >
          <UserPlus className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

      {error && <p className="mb-4 text-accent">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {perfiles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setEditar(p)}
            className={`admin-card p-4 text-left transition-colors hover:border-brand ${
              p.activo ? "" : "opacity-60"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-sm font-bold text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.nombre.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{p.nombre}</p>
                <p className="truncate text-xs text-mutedink">{p.telefono ?? "Sin teléfono"}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <AdminPildora tono={p.rol === "admin" ? "info" : "muted"}>
                {etiquetaAcceso(p)}
              </AdminPildora>
              {!p.activo && <AdminPildora tono="bad">Desactivado</AdminPildora>}
            </div>
          </button>
        ))}
        {perfiles.length === 0 && !error && (
          <p className="text-sm text-mutedink">Aún no hay usuarios dados de alta.</p>
        )}
      </div>

      {alta && (
        <FormUsuario
          onCerrar={() => setAlta(false)}
          onGuardado={() => {
            setAlta(false);
            void cargar();
          }}
        />
      )}
      {editar && (
        <FormUsuario
          perfil={editar}
          onCerrar={() => setEditar(null)}
          onGuardado={() => {
            setEditar(null);
            void cargar();
          }}
        />
      )}
    </div>
  );
}

function FormUsuario({
  perfil,
  onCerrar,
  onGuardado,
}: {
  perfil?: Perfil;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const edita = Boolean(perfil);
  const [nombre, setNombre] = useState(perfil?.nombre ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceso, setAcceso] = useState<Acceso>(perfil ? accesoDe(perfil) : "tecnico");
  const [telefono, setTelefono] = useState(perfil?.telefono ?? "");
  const [color, setColor] = useState(perfil?.color ?? COLORES_TECNICO[0]);
  const [activo, setActivo] = useState(perfil?.activo ?? true);
  const [aviso, setAviso] = useState("");
  const [pendiente, setPendiente] = useState(false);

  const notaAcceso = ACCESOS.find((a) => a.value === acceso)?.nota;

  async function guardar() {
    setAviso("");
    if (!nombre.trim()) return setAviso("Ponle un nombre.");
    if (!edita && (!email.trim() || password.length < 8)) {
      return setAviso("Para crear el acceso hacen falta email y contraseña de 8+ caracteres.");
    }
    setPendiente(true);
    const { rol, es_tecnico } = rolYTecnico(acceso);
    const cuerpo = edita
      ? { id: perfil!.id, nombre, rol, es_tecnico, telefono, color, activo }
      : { nombre, email, password, rol, es_tecnico, telefono, color };
    const res = await fetch("/api/admin/equipo", {
      method: edita ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const d = (await res.json().catch(() => ({}))) as { error?: string };
    setPendiente(false);
    if (!res.ok) return setAviso(d.error ?? "No se pudo guardar.");
    onGuardado();
  }

  return (
    <AdminHoja
      titulo={edita ? "Editar usuario" : "Nuevo usuario"}
      subtitulo={edita ? perfil!.nombre : "Se crea su acceso a Neotérmica"}
      onCerrar={onCerrar}
      pie={
        <button
          type="submit"
          form="form-usuario"
          disabled={pendiente}
          className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pendiente ? "Guardando…" : edita ? "Guardar cambios" : "Crear usuario"}
        </button>
      }
    >
      <form
        id="form-usuario"
        className="space-y-3 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          void guardar();
        }}
      >
        {aviso && <p className="text-accent">{aviso}</p>}

        <label className="block">
          <span className="field-label">Nombre</span>
          <input className="field-input" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>

        {!edita && (
          <>
            <label className="block">
              <span className="field-label">Email (será su usuario)</span>
              <input
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                required
              />
            </label>
            <label className="block">
              <span className="field-label">Contraseña inicial</span>
              <input
                type="text"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                required
              />
            </label>
          </>
        )}

        <label className="block">
          <span className="field-label">Acceso</span>
          <select
            className="field-input"
            value={acceso}
            onChange={(e) => setAcceso(e.target.value as Acceso)}
          >
            {ACCESOS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          {notaAcceso && <span className="mt-1 block text-xs text-mutedink">{notaAcceso}</span>}
        </label>

        <label className="block">
          <span className="field-label">Teléfono</span>
          <input className="field-input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </label>

        <div>
          <span className="field-label">Color en el calendario</span>
          <div className="flex flex-wrap gap-2">
            {COLORES_TECNICO.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-ink" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {edita && (
          <label className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
            <span>Usuario activo (si lo desmarcas, no podrá entrar ni recibir actuaciones)</span>
          </label>
        )}

        {edita && (
          <p className="pt-1 text-xs text-mutedink">
            La contraseña no se cambia desde aquí. Para reiniciarla, el usuario usa
            &ldquo;¿olvidaste la contraseña?&rdquo; o se hace desde Supabase.
          </p>
        )}
      </form>
    </AdminHoja>
  );
}
