"use client";
import { useEffect, useState } from "react";
import { normalize, ymd, type Quota } from "@/lib/schedule.ts";
import { useProgress } from "./progress";

function QuotaInput({ k, label }: { k: keyof Quota; label: string }) {
  const { state, update } = useProgress();
  const saved = state.quota[k];
  const [text, setText] = useState(String(saved));
  useEffect(() => setText(String(saved)), [saved]);
  return (
    <input
      id={"q" + k} type="number" min={0} max={10} aria-label={label} value={text}
      onChange={e => {
        setText(e.target.value);
        if (e.target.value === "") return; // let the field be cleared while typing
        const v = Math.max(0, Math.min(10, parseInt(e.target.value, 10) || 0));
        update(s => ({ ...s, quota: { ...s.quota, [k]: v } }));
      }}
      onBlur={() => setText(String(saved))}
    />
  );
}

export default function Settings({ toast }: { toast: (msg: string) => void }) {
  const { state, replace } = useProgress();

  const download = () => {
    const blob = new Blob([JSON.stringify({ app: "dsa-daily", v: 1, saved: new Date().toISOString(), state }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "dsa-daily-backup-" + ymd(new Date()) + ".json";
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const restore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    try {
      const data = JSON.parse(await f.text()), s = data.state || data;
      if (!s || typeof s.done !== "object") throw new Error("shape");
      const next = normalize(s);
      replace(next);
      toast("Backup restored: " + Object.keys(next.done).length + " solved problems");
    } catch {
      toast("That file isn’t a DSA Daily backup. Pick the .json file you downloaded.");
    }
  };

  return (
    <details className="panel">
      <summary><h2>Settings and rules</h2><span className="sub">Daily minimum and how to practise</span></summary>
      <div className="settings">
        <div>
          <div className="k">Daily minimum</div>
          <div className="quota">
            <span /><span className="qh">DSA</span><span className="qh">SQL</span>
            <span>Weekdays</span>
            <QuotaInput k="L" label="DSA problems per weekday" />
            <QuotaInput k="S" label="SQL problems per weekday" />
            <span>Weekends</span>
            <QuotaInput k="wL" label="DSA problems per weekend day" />
            <QuotaInput k="wS" label="SQL problems per weekend day" />
          </div>
          <div className="cf-set"><label htmlFor="qC">Codeforces per weekend</label><QuotaInput k="C" label="Codeforces problems per weekend" /></div>
          <p className="hint">Anything you don’t finish comes back the next day. Solving extra pulls later problems forward, but tomorrow’s minimum stays the same.</p>
        </div>
        <ol className="rules">
          <li>Write down the constraints before you think of an approach.</li>
          <li>Think for 25 minutes before any hint: brute force, why it is slow, what to optimise.</li>
          <li>After solving, write the one-line key insight. That line is what you revise.</li>
          <li>Pick “Hint” or “Editorial” honestly. Those problems come back after 3, 7 and 21 days.</li>
        </ol>
        <div className="backup">
          <div className="k">Backup</div>
          <p>Your progress is saved in this browser. Download a backup now and then, and restore it on a new laptop or phone.</p>
          <div className="more">
            <button className="btn" type="button" onClick={download}>Download backup</button>
            <label className="btn" htmlFor="importFile">Restore backup</label>
            <input id="importFile" type="file" accept="application/json,.json" hidden onChange={restore} />
          </div>
        </div>
      </div>
    </details>
  );
}
