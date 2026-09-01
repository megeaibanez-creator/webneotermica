import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { esEmailAdmin } from "@/lib/site";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!esEmailAdmin(user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/administrator/login?error=noadmin`);
  }

  return NextResponse.redirect(`${origin}/administrator`);
}
