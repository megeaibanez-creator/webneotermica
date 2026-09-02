"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function TecnicoChrome({
  nombre,
  children,
}: {
  nombre: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function salir() {
    const sb = getSupabaseBrowserClient();
    await sb?.auth.signOut();
    router.replace("/administrator/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-page">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Neotérmica"
              width={120}
              height={36}
              className="h-8 w-auto"
              priority
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-mutedink sm:inline">{nombre}</span>
            <button
              type="button"
              onClick={() => void salir()}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-mutedink hover:border-brand hover:text-brand"
            >
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
