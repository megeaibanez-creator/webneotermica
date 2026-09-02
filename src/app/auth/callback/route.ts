import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getStaffActual } from "@/lib/staff";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  const supabase = await getSupabaseServerClient();
  if (!supabase || !code) {
    return NextResponse.redirect(`${origin}/administrator/login?error=oauth`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/administrator/login?error=oauth`);
  }

  const staff = await getStaffActual();
  if (!staff) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/administrator/login?error=noadmin`);
  }

  const destino = staff.rol === "tecnico" ? "/tecnico" : "/administrator";
  return NextResponse.redirect(`${origin}${destino}`);
}
