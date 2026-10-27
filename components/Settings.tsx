"use client";
import { useEffect, useRef, useState } from "react";
import { DownloadSimple, SignOut, UploadSimple, X } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { ThemeStudio } from "./ThemeStudio";
import { phases, todayPlan, ymd, type Count, type State } from "@/lib/logic";
import { P } from "@/lib/problems";

const QUOTAS: [string, Count, Count][] = [["LeetCode", "L", "wL"], ["SQL", "S", "wS"], ["Codeforces", "C", "wC"]];

export function Settings({ open, onClose }: { open: boolean; onClose(): void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const s = useStore();
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);

  const plan = todayPlan(s.state, s.now);
  const phase = phases(s.state.quota)[(plan.main.length ? P[plan.main[0]][4] : 4) - 1];

  const exportFile = () => {
    const blob = new Blob([JSON.stringify({ app: "dsa-daily", v: 1, saved: new Date().toISOString(), state: s.state }, null, 1)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "dsa-daily-backup-" + ymd(new Date()) + ".json";
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importFile = async (f?: File) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text()), st = (data.state || data) as State;
      if (!st || typeof st.done !== "object") throw new Error("shape");
      s.importState(st); s.say("Backup restored: " + Object.keys(st.done).length + " solved problems");
    } catch { s.say("That file isn't a DSA Daily backup. Pick the .json file you downloaded."); }
  };

  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }} aria-labelledby="setH"
      className="m-0 ml-auto h-[100dvh] max-h-none w-full max-w-[440px] overflow-y-auto border-l border-line bg-surface p-0 text-ink open:animate-[sheet_.35s_var(--ease)]">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
        <h2 id="setH" className="t-h2">Settings</h2>
        <button type="button" onClick={onClose} aria-label="Close settings" className="btn btn-ghost btn-icon -mr-2"><X size={18} aria-hidden /></button>
      </div>
      <div className="flex flex-col gap-8 px-5 py-6">
        <section className="flex flex-col gap-3">
          <h3 className="t-h3">Account</h3>
          <div className="tile flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium">{s.email ?? "Not signed in"}</p>
              <p className="text-[12px] text-muted">Signed in with Google. This browser stays signed in.</p>
            </div>
            <button type="button" className="btn btn-sm shrink-0" onClick={() => void s.signOut()}><SignOut size={14} aria-hidden />Sign out</button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="t-h3">Problems per day</h3>
          <div className="grid grid-cols-[minmax(0,1fr)_80px_80px] items-center gap-x-3 gap-y-2.5">
            <span />
            <span className="t-eyebrow text-center text-[12px]">Mon to Fri</span>
            <span className="t-eyebrow text-center text-[12px]">Sat, Sun</span>
            {QUOTAS.map(([label, wd, we]) => (
              <div key={wd} className="contents">
                <span className="text-[14px] text-muted">{label}</span>
                {[wd, we].map((k) => (
                  <input key={k} className="field num w-full text-center" type="number" min={0} max={10} value={s.state.quota[k]}
                    aria-label={`${label} per ${k === wd ? "weekday" : "weekend day"}`} onChange={(e) => s.setQuota(k, parseInt(e.target.value, 10) || 0)} />
                ))}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DateField label="Plan starts" value={s.state.quota.start} max={s.state.quota.placement} onChange={(v) => s.setDate("start", v)} />
            <DateField label="Placements" value={s.state.quota.placement} min={s.state.quota.start} onChange={(v) => s.setDate("placement", v)} />
          </div>
          <p className="text-[13px] text-muted">You are in Phase {phase.n}, {phase.name} ({phase.short}).</p>
        </section>

        <ThemeStudio />

        <section className="flex flex-col gap-3">
          <h3 className="t-h3">Backup</h3>
          <p className="text-[13px] text-muted">Progress syncs to your account and is also saved on this device. A backup file is a second copy.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn" type="button" onClick={exportFile}><DownloadSimple size={16} aria-hidden />Download backup</button>
            <label className="btn" htmlFor="importFile"><UploadSimple size={16} aria-hidden />Restore backup</label>
            <input id="importFile" type="file" accept="application/json,.json" hidden onChange={(e) => { void importFile(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="t-h3">How to practise</h3>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[14px] text-muted marker:text-accent">
            <li>Write down the constraints before you think of an approach.</li>
            <li>Think for 25 minutes before any hint: brute force, why it is slow, what to optimise.</li>
            <li>After solving, write the one-line key insight. That line is what you revise.</li>
            <li>Pick Hint or Editorial honestly. Those problems come back after 3, 7 and 21 days.</li>
          </ol>
        </section>
      </div>
    </dialog>
  );
}

/** Keeps what is typed (a half-typed year is briefly invalid) and saves only valid dates; on blur it shows the saved one again. */
function DateField({ label, value, min, max, onChange }: { label: string; value: string; min?: string; max?: string; onChange(v: string): void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">{label}
      <input className="field num w-full" type="date" required value={draft} min={min} max={max}
        onChange={(e) => { setDraft(e.target.value); onChange(e.target.value); }} onBlur={() => setDraft(value)} />
    </label>
  );
}
