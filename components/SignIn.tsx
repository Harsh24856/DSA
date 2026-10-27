"use client";
// Sign-in dialog shown over the (blurred, inert) app when nobody is signed in.
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CodeBlock, GoogleLogo, SpinnerGap } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase/client";

export function SignIn() {
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    btn.current?.focus();
    const q = new URLSearchParams(location.search);
    if (q.get("auth_error")) {
      setError("Google sign-in did not finish. Try again.");
      q.delete("auth_error");
      history.replaceState(null, "", location.pathname + (q.size ? `?${q}` : "") + location.hash);
    }
  }, []);

  const signIn = async () => {
    setBusy(true); setError(null);
    const next = location.pathname + location.hash;
    const { error: e } = await supabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`, queryParams: { prompt: "select_account" } },
    });
    if (e) { setBusy(false); setError(e.message); }
  };

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-bg/40 px-4"
      initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <motion.section role="dialog" aria-modal="true" aria-labelledby="signin" aria-describedby="signin-desc"
        className="card w-full max-w-[400px] p-7 shadow-[0_24px_80px_-24px_color-mix(in_oklab,var(--ink)_40%,transparent)]"
        initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45, delay: reduce ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}>
        <span className="grid size-11 place-items-center rounded-tile bg-accent text-accent-ink"><CodeBlock size={22} weight="bold" aria-hidden /></span>
        <h2 id="signin" className="t-title mt-5">Sign in to DSA Daily</h2>
        <p id="signin-desc" className="mt-2 text-[15px] leading-relaxed text-muted">Your ticks, notes and pattern progress are saved to your account, so every device shows the same thing. This browser stays signed in.</p>
        <button ref={btn} type="button" onClick={signIn} disabled={busy} className="btn btn-lg mt-6 w-full">
          {busy ? <SpinnerGap size={18} className="animate-spin" aria-hidden /> : <GoogleLogo size={18} weight="bold" aria-hidden />}
          {busy ? "Opening Google…" : "Continue with Google"}
        </button>
        {error && <p role="alert" className="mt-4 rounded-control bg-hard/10 px-3 py-2.5 text-[14px] text-hard">{error}</p>}
      </motion.section>
    </motion.div>
  );
}
