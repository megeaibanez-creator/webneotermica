"use client";

import { usePathname } from "next/navigation";

/** El chrome público no se pinta en /administrator. `also` oculta en más rutas (p. ej. footer en /estancias). */
export default function HideOnAdmin({
  children,
  also,
}: {
  children: React.ReactNode;
  also?: string[];
}) {
  const path = usePathname() ?? "";
  if (path.startsWith("/administrator")) return null;
  if (also?.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return <>{children}</>;
}
