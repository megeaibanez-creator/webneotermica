import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const K_REMEMBER = "neotermica_admin_remember";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Next 16: proxy.ts sustituye a middleware.ts.
 * Refresca la sesión de Auth y escribe las cookies nuevas en la respuesta.
 * Sin esto el JWT caduca (~1 h) y Recuérdame no sirve: el panel vuelve al login.
 */
export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return response;

  const persist = request.cookies.get(K_REMEMBER)?.value !== "0";
  const cookieOptions = {
    path: "/",
    sameSite: "lax" as const,
    ...(persist ? { maxAge: SESSION_MAX_AGE } : {}),
  };

  const supabase = createServerClient(url, key, {
    cookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, { ...options, ...cookieOptions });
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/administrator",
    "/administrator/:path*",
    "/tecnico",
    "/tecnico/:path*",
    "/api/admin/:path*",
    "/api/staff/:path*",
    "/auth/:path*",
  ],
};
