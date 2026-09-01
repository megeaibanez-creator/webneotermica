"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Receipt,
  ScrollText,
  UserRound,
  Users,
  X,
} from "lucide-react";

const NAV = [
  { href: "/administrator", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/administrator/blog", label: "Blog", icon: FileText },
  { href: "/administrator/clientes", label: "Clientes", icon: UserRound },
  { href: "/administrator/contactos", label: "Contactos", icon: Users },
  { href: "/administrator/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/administrator/presupuestos", label: "Presupuestos", icon: ScrollText },
  { href: "/administrator/facturacion", label: "Facturación", icon: Receipt },
  { href: "/administrator/chatbot", label: "Chat", icon: MessageSquare },
] as const;

export default function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [abierto, setAbierto] = useState(false);

  if (pathname.startsWith("/administrator/login")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-page lg:pl-64">
      {abierto && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setAbierto(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink text-white shadow-deep transition-transform lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <Link href="/administrator" className="min-w-0" onClick={() => setAbierto(false)}>
            <span className="font-display text-lg font-bold">Neotérmica</span>
            <span className="mt-0.5 block text-xs text-white/55">Administración</span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const activo = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAbierto(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activo
                    ? "bg-accent text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-5 w-5 shrink-0" aria-hidden />
            Ver la web
          </Link>
        </div>
      </aside>

      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          className="rounded-lg p-1.5 text-ink hover:bg-soft"
          aria-label="Abrir menú"
          onClick={() => setAbierto(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="font-display font-semibold">Admin</span>
      </div>

      {children}
    </div>
  );
}
