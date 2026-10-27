"use client";
import { useEffect, useRef, useState } from "react";
import { DownloadSimple, SignOut, UploadSimple, X } from "@phosphor-icons/react";
import { PALETTES, useStore, type Mode, type Palette } from "@/lib/store";
import { phases, todayPlan, ymd, type Count, type State } from "@/lib/logic";
import { P } from "@/lib/problems";

const MODES: [Mode, string][] = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]];
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
      <style>{`@keyframes sheet{from{transform:translateX(24px);opacity:0}}`}</style>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
        <h2 id="setH" className="text-[18px] font-semibold">Settings</h2>
        <button type="button" onClick={onClose} aria-label="Close settings" className="grid size-9 cursor-pointer place-items-center rounded-[10px] text-muted hover:bg-surface-2 hover:text-ink"><X size={18} aria-hidden /></button>
      </div>
      <div className="flex flex-col gap-8 px-5 py-6">
        <section className="flex flex-col gap-3">
          <h3 className="text-[15px] font-semibold">Account</h3>
          <div className="flex items-center justify-between gap-3 rounded-[12px] bg-surface-2 p-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium">{s.email ?? "Not signed in"}</p>
              <p className="text-[12px] text-muted">Signed in with Google. This browser stays signed in.</p>
            </div>
            <button type="button" className="btn h-9 shrink-0 px-3 text-[13px]" onClick={() => void s.signOut()}><SignOut size={15} aria-hidden />Sign out</button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-[15px] font-semibold">Problems per day</h3>
          <div className="grid grid-cols-[minmax(0,1fr)_80px_80px] items-center gap-x-3 gap-y-2.5">
            <span />
            <span className="text-center text-[12px] font-medium text-muted">Mon to Fri</span>
            <span className="text-center text-[12px] font-medium text-muted">Sat, Sun</span>
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

        <section className="flex flex-col gap-3">
          <h3 className="text-[15px] font-semibold">Theme</h3>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(PALETTES) as [Palette, readonly [string, string, string]][]).map(([k, [name, lc, dc]]) => (
              <button key={k} type="button" aria-pressed={s.palette === k} onClick={() => s.setPalette(k)}
                className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[10px] border border-line py-2.5 text-[12px] font-medium transition hover:bg-surface-2 aria-pressed:border-accent aria-pressed:ring-2 aria-pressed:ring-accent-soft">
                <span className="size-5 rounded-full ring-1 ring-line" style={{ background: `linear-gradient(135deg, ${lc} 50%, ${dc} 50%)` }} aria-hidden />{name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 rounded-[10px] bg-surface-2 p-1" role="group" aria-label="Light or dark">
            {MODES.map(([k, label]) => (
              <button key={k} type="button" aria-pressed={s.mode === k} onClick={() => s.setMode(k)}
                className="h-8 cursor-pointer rounded-[8px] text-[13px] font-medium text-muted transition aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-card">{label}</button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-[15px] font-semibold">Backup</h3>
          <p className="text-[13px] text-muted">Progress syncs to your account and is also saved on this device. A backup file is a second copy.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn" type="button" onClick={exportFile}><DownloadSimple size={16} aria-hidden />Download backup</button>
            <label className="btn" htmlFor="importFile"><UploadSimple size={16} aria-hidden />Restore backup</label>
            <input id="importFile" type="file" accept="application/json,.json" hidden onChange={(e) => { void importFile(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-[15px] font-semibold">How to practise</h3>
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
