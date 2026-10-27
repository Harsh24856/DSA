// Google sends the user back here with ?code=…; exchange it for a session cookie, then continue.
import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const raw = searchParams.get("next") ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  if (code) {
    const supabase = await serverSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const host = request.headers.get("x-forwarded-host");
      const base = process.env.NODE_ENV !== "development" && host ? `https://${host}` : origin;
      return NextResponse.redirect(base + next);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=1`);
}
