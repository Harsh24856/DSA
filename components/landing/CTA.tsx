"use client";
// The landing page's one action. Signed-in visitors get a link into the app instead.
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CircleNotch, GoogleLogo } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { signInWithGoogle } from "@/lib/signIn";

export function CTA({ size = "lg" }: { size?: "lg" | "sm" }) {
  const { email } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (new URLSearchParams(location.search).get("auth_error")) setError("Google sign in did not finish. Try again."); }, []);
  const cls = `btn btn-primary ${size === "lg" ? "btn-lg" : "btn-sm"}`;

  if (email) return <Link href="/" className={cls}>Open today&apos;s plan<ArrowRight size={size === "lg" ? 18 : 14} aria-hidden /></Link>;
  const go = async () => {
    setBusy(true); setError(null);
    const q = new URLSearchParams(location.search).get("next");
    const e = await signInWithGoogle(q && q.startsWith("/") && !q.startsWith("//") ? q : "/");
    if (e) { setBusy(false); setError(`Sign in failed: ${e}. Try again.`); }
  };
  return (
    <span className="inline-grid justify-items-center gap-2">
      <button type="button" onClick={go} disabled={busy} className={cls}>
        {busy ? <CircleNotch size={18} className="animate-spin" aria-hidden /> : <GoogleLogo size={size === "lg" ? 18 : 14} weight="bold" aria-hidden />}
        {busy ? "Opening Google" : size === "sm" ? <><span className="sm:hidden">Sign in</span><span className="hidden sm:inline">Continue with Google</span></> : "Continue with Google"}
      </button>
      {error && <span role="alert" className="caption-2 text-hard">{error}</span>}
    </span>
  );
}
