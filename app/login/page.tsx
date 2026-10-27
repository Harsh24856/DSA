"use client";
import { useEffect, useState } from "react";
import { CodeBlock, GoogleLogo, SpinnerGap } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase/client";

export default function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [next, setNext] = useState("/");

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const n = q.get("next");
    if (n && n.startsWith("/") && !n.startsWith("//")) setNext(n);
    if (q.get("error")) setError("Google sign-in did not finish. Try again.");
    if (q.get("denied")) setError("This Google account is not allowed. Sign in with hsehra001@gmail.com.");
  }, []);

  const signIn = async () => {
    setBusy(true); setError(null);
    const { error: e } = await supabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`, queryParams: { prompt: "select_account" } },
    });
    if (e) { setBusy(false); setError(e.message); }
  };

  return (
    <main className="grid min-h-[100dvh] place-items-center px-4">
      <section className="card w-full max-w-[400px] p-7" aria-labelledby="signin">
        <span className="grid size-11 place-items-center rounded-[12px] bg-accent text-accent-ink"><CodeBlock size={22} weight="bold" aria-hidden /></span>
        <h1 id="signin" className="mt-5 text-[26px] font-semibold leading-tight">Sign in to DSA Daily</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">Your ticks, notes and pattern progress are saved to your account, so every device shows the same thing. This browser stays signed in.</p>
        <button type="button" onClick={signIn} disabled={busy} className="btn mt-6 h-12 w-full text-[15px] disabled:opacity-70">
          {busy ? <SpinnerGap size={18} className="animate-spin" aria-hidden /> : <GoogleLogo size={18} weight="bold" aria-hidden />}
          {busy ? "Opening Google…" : "Continue with Google"}
        </button>
        {error && <p role="alert" className="mt-4 rounded-[10px] bg-hard/10 px-3 py-2.5 text-[14px] text-hard">{error}</p>}
      </section>
    </main>
  );
}
