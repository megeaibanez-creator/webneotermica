"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const K_EMAIL = "neotermica_admin_email";
const K_REMEMBER = "neotermica_admin_remember";

function mensajeError(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes("invalid login") || t.includes("invalid_credentials")) {
    return "Email o contraseña incorrectos.";
  }
  if (t.includes("not enabled") || t.includes("unsupported provider")) {
    return "Google aún no está activado en Supabase (Authentication → Providers → Google).";
  }
  if (t.includes("not confirmed")) {
    return "Confirma el correo antes de entrar.";
  }
  return raw || "No se ha podido entrar.";
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [recuerdame, setRecuerdame] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"mail" | "google" | null>(null);
  const [listo, setListo] = useState(false);

  const supabaseOk = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(K_EMAIL);
      if (guardado) setEmail(guardado);
      const rec = localStorage.getItem(K_REMEMBER);
      if (rec === "0") setRecuerdame(false);
    } catch {
      // sin storage
    }
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("error");
      if (q === "oauth") setError("No se ha podido entrar con Google.");
      if (q === "noadmin") setError("Esa cuenta de Google no es administradora.");
    }
    setListo(true);
  }, []);

  if (!supabaseOk) {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <h1 className="mb-3 text-3xl">Admin — pendiente de Auth</h1>
        <p className="mb-6 text-mutedink">
          No hay proyecto Supabase. En desarrollo puedes entrar al panel; en
          producción esto no se abre hasta que existan las env.
        </p>
        {process.env.NODE_ENV !== "production" ? (
          <Link href="/administrator" className="btn-primary">
            Entrar en modo local
          </Link>
        ) : (
          <Link href="/" className="btn-ghost">
            Volver a la web
          </Link>
        )}
      </div>
    );
  }

  if (!listo) return null;

  function guardarPreferencias(mail: string, remember: boolean) {
    try {
      localStorage.setItem(K_REMEMBER, remember ? "1" : "0");
      if (remember) localStorage.setItem(K_EMAIL, mail);
      else localStorage.removeItem(K_EMAIL);
    } catch {
      // ignore
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading("mail");
    const sb = getSupabaseBrowserClient({ persistSession: recuerdame });
    if (!sb) {
      setLoading(null);
      setError("Falta Supabase.");
      return;
    }
    const { data, error: err } = await sb.auth.signInWithPassword({ email, password });
    if (err || !data.user) {
      setLoading(null);
      setError(mensajeError(err?.message ?? ""));
      return;
    }
    const me = (await fetch("/api/staff/me")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)) as { rol?: string } | null;
    if (!me?.rol) {
      await sb.auth.signOut();
      setLoading(null);
      setError("Esta cuenta no tiene acceso al panel.");
      return;
    }
    guardarPreferencias(email, recuerdame);
    router.push(me.rol === "tecnico" ? "/tecnico" : "/administrator");
    router.refresh();
  }

  async function conGoogle() {
    setError("");
    setLoading("google");
    const sb = getSupabaseBrowserClient({ persistSession: recuerdame });
    if (!sb) {
      setLoading(null);
      setError("Falta Supabase.");
      return;
    }
    guardarPreferencias(email, recuerdame);
    const { error: err } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (err) {
      setLoading(null);
      setError(mensajeError(err.message));
    }
  }

  return (
    <div
      className="flex min-h-dvh items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(160deg, #1b2531 0%, #3a0a16 55%, var(--clima) 100%)" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image
            src="/images/logo.png"
            alt="Neotérmica"
            width={160}
            height={48}
            className="mx-auto h-12 w-auto"
            priority
          />
          <p className="mt-3 text-sm text-white/70">Panel de administración</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div
              className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full"
              style={{ background: "color-mix(in srgb, var(--clima) 12%, white)" }}
            >
              <Lock className="h-7 w-7" style={{ color: "var(--clima)" }} aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-ink">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-mutedink">Solo staff. El visitante no se registra.</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-mutedink" aria-hidden />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  disabled={loading !== null}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input pl-10"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-mutedink" aria-hidden />
                <input
                  id="password"
                  type={verClave ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={loading !== null}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field-input pl-10 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setVerClave((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mutedink hover:text-ink"
                  aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {verClave ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={recuerdame}
                onChange={(e) => setRecuerdame(e.target.checked)}
                className="h-4 w-4 rounded border-line accent-[var(--clima)]"
              />
              Recuérdame
            </label>

            <button type="submit" disabled={loading !== null} className="btn-primary w-full">
              {loading === "mail" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-mutedink">
            <span className="h-px flex-1 bg-line" />
            o
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={() => void conGoogle()}
            disabled={loading !== null}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-page disabled:opacity-50"
          >
            {loading === "google" ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Entrar con Google
          </button>

          <p className="mt-6 text-center">
            <Link href="/" className="text-sm text-mutedink hover:text-brand">
              ← Volver a la web
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
