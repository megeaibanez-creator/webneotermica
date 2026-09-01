"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Resumen = {
  leads: number;
  hilos: number;
  preguntas: number;
  clientes: number;
  proyectos: number;
  presupuestos: number;
  facturas: number;
  modo: "supabase" | "local" | "pendiente";
};

export default function AdminHomePage() {
  const router = useRouter();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabaseBrowserClient();
    if (sb) {
      void sb.auth.getUser().then(({ data }) => {
        if (!data.user) {
          router.replace("/administrator/login");
          return;
        }
        setEmail(data.user.email ?? null);
      });
    } else if (process.env.NODE_ENV === "production") {
      setAviso("Admin pendiente de Auth. Falta el proyecto Supabase.");
    } else {
      setAviso("Modo local (sin Supabase). Los datos están en .data/*.jsonl.");
    }

    void fetch("/api/admin/resumen")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/administrator/login");
          return;
        }
        if (!res.ok) return;
        setResumen((await res.json()) as Resumen);
      })
      .catch(() => undefined);
  }, [router]);

  return (
    <div className="admin-shell">
      <h1 className="mb-2 text-3xl">Panel</h1>
      <p className="mb-8 text-mutedink">
        {email ?? "Vitrina: el visitante no se registra. Aquí solo hay staff."}
      </p>
      {aviso && (
        <p className="mb-6 rounded-xl border border-line bg-ice px-4 py-3 text-sm text-brand-dark">
          {aviso}
        </p>
      )}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/administrator/contactos" className="card card-hover">
          <b className="font-display text-3xl">{resumen?.leads ?? "—"}</b>
          <span className="mt-1 block text-sm text-mutedink">Leads</span>
        </Link>
        <Link href="/administrator/clientes" className="card card-hover">
          <b className="font-display text-3xl">{resumen?.clientes ?? "—"}</b>
          <span className="mt-1 block text-sm text-mutedink">Clientes</span>
        </Link>
        <Link href="/administrator/proyectos" className="card card-hover">
          <b className="font-display text-3xl">{resumen?.proyectos ?? "—"}</b>
          <span className="mt-1 block text-sm text-mutedink">Obras</span>
        </Link>
        <Link href="/administrator/presupuestos" className="card card-hover">
          <b className="font-display text-3xl">{resumen?.presupuestos ?? "—"}</b>
          <span className="mt-1 block text-sm text-mutedink">Presupuestos</span>
        </Link>
        <Link href="/administrator/facturacion" className="card card-hover">
          <b className="font-display text-3xl">{resumen?.facturas ?? "—"}</b>
          <span className="mt-1 block text-sm text-mutedink">Facturas</span>
        </Link>
        <Link href="/administrator/chatbot" className="card card-hover">
          <b className="font-display text-3xl">{resumen?.hilos ?? "—"}</b>
          <span className="mt-1 block text-sm text-mutedink">Hilos de chat</span>
        </Link>
        <div className="card">
          <b className="font-display text-3xl">{resumen?.preguntas ?? "—"}</b>
          <span className="mt-1 block text-sm text-mutedink">Preguntas (visitante)</span>
        </div>
      </div>
      <p className="text-sm text-mutedink">
        No borres chat de visitante. Solo <code>tester_*</code> / <code>stress_*</code> /{" "}
        <code>check_*</code>.
      </p>
    </div>
  );
}
