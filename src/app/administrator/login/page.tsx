"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!supabase) {
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase!.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/administrator");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="mb-2 text-3xl">Entrar</h1>
      <p className="mb-8 text-mutedink">Solo staff. El visitante no se registra.</p>
      <form onSubmit={onSubmit} className="card space-y-4">
        {error && <p className="text-sm text-accent">{error}</p>}
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
