import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next 16: proxy.ts sustituye a middleware.ts.
 * De momento no hay lógica: pasa la request tal cual.
 * // Fase 2: proteger /administrator con sesión Supabase.
 */
export default function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
