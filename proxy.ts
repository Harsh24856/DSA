// Refreshes the Supabase session cookie on every page request, and sends signed-out visitors from an app page to the
// public landing page (/welcome), remembering where they were going.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./lib/supabase/config";

const APP = /^\/(?:(?:analytics|patterns|problems|drill|mock|genai|other)(?:\/.*)?)?$/;   // everything else (/welcome, /privacy, /terms, /auth, a 404) is public

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list, headers) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });
  // keep this call directly after createServerClient: it validates and refreshes the session
  const { data } = await supabase.auth.getClaims();
  const { pathname, search } = request.nextUrl;
  if (!data?.claims && !process.env.NEXT_PUBLIC_E2E && APP.test(pathname)) {
    const to = request.nextUrl.clone();
    to.pathname = "/welcome";
    to.search = "";
    if (pathname !== "/") to.searchParams.set("next", pathname + search);
    const err = request.nextUrl.searchParams.get("auth_error");
    if (err) to.searchParams.set("auth_error", err);
    const redirect = NextResponse.redirect(to);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}

export const config = {
  // pages only: skip Next internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.svg|manifest.webmanifest|opengraph-image|playground/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js)$).*)"],
};
