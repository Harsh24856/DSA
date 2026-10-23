"use client";
import { useState } from "react";
import { useCloud } from "./progress";

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60_000);
  return m < 1 ? "just now" : m === 1 ? "1 minute ago" : m < 60 ? `${m} minutes ago` : "over an hour ago";
};

export default function Account() {
  const cloud = useCloud();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (!cloud.enabled) return null;

  if (!cloud.email) {
    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true); setErr("");
      const error = await cloud.signIn(email.trim());
      setBusy(false);
      if (error) setErr(`Couldn’t send the link: ${error}. Check the address and try again.`);
      else setSent(email.trim());
    };
    return (
      <section className="panel" aria-labelledby="acctH">
        <div className="ph"><h2 id="acctH">Your account</h2><span className="sub">Keep every solve on record, on any device</span></div>
        {sent ? (
          <div className="acct-sent">
            <p>We sent a sign-in link to <b>{sent}</b>. Open it on this device to finish signing in. Your progress here is added to your account.</p>
            <button className="linkish" type="button" onClick={() => setSent("")}>Use a different email</button>
          </div>
        ) : (
          <form className="acct-form" onSubmit={submit}>
            <label htmlFor="acctEmail">Email</label>
            <div className="acct-row">
              <input id="acctEmail" type="email" required autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} aria-describedby={err ? "acctErr" : undefined} />
              <button className="btn primary" type="submit" disabled={busy || !email.trim()}>{busy ? "Sending…" : "Email me a sign-in link"}</button>
            </div>
            {err && <p className="acct-err" id="acctErr" role="alert">{err}</p>}
            <p className="hint">No password. Signing in keeps the progress already saved in this browser.</p>
          </form>
        )}
      </section>
    );
  }

  const line = {
    syncing: "Syncing…",
    synced: cloud.lastSync ? `Synced ${ago(cloud.lastSync)}` : "Synced",
    offline: "Offline. Changes are saved here and sync when you’re back online.",
    error: "Couldn’t reach your account. Changes are saved here and will retry.",
    off: "", "signed-out": "",
  }[cloud.status];

  return (
    <section className="panel" aria-labelledby="acctH">
      <div className="ph"><h2 id="acctH">Your account</h2><span className="sub">{cloud.email}</span></div>
      <div className="acct-status">
        <span className={"dot s-" + cloud.status} aria-hidden="true" />
        <span role="status">{line}</span>
      </div>
      {cloud.status === "error" && cloud.error && <p className="hint">Details: {cloud.error}</p>}
      <div className="more">
        <button className="btn" type="button" onClick={cloud.syncNow} disabled={cloud.status === "syncing"}>Sync now</button>
        <button className="btn" type="button" onClick={cloud.signOut}>Sign out</button>
      </div>
    </section>
  );
}
