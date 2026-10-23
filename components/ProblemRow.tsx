"use client";
import { P } from "@/lib/problems.ts";
import { displayTitle, problemUrl, TRACK, ymd, type How } from "@/lib/schedule.ts";
import { useProgress } from "./progress";

const HOW: [How, string][] = [["s", "Solo"], ["h", "Hint"], ["e", "Editorial"]];

type Props = {
  i: number;
  grouped?: boolean; // inside a DSA/SQL group, so the track name is redundant
  side?: string;
  sideClass?: string;
  revisit?: boolean; // the checkbox marks one revisit done instead of solving
};

export default function ProblemRow({ i, grouped, side, sideClass, revisit }: Props) {
  const { state, update, revealed, reveal } = useProgress();
  const p = P[i], d = state.done[i], title = displayTitle(i);
  const done = !!d && !revisit;

  const toggle = (on: boolean) => update(s => {
    const next = { ...s.done };
    if (on) next[i] = { d: ymd(new Date()), h: "s", r: 0, t: Date.now() };
    else delete next[i];
    return { ...s, done: next };
  });
  const bumpRevisit = () => update(s => ({ ...s, done: { ...s.done, [i]: { ...s.done[i], r: (s.done[i].r || 0) + 1 } } }));
  const setDone = (patch: Partial<NonNullable<typeof d>>) => update(s => ({ ...s, done: { ...s.done, [i]: { ...s.done[i], ...patch } } }));

  return (
    <div className={"row" + (done ? " is-done" : "")}>
      <input
        className="tick" type="checkbox" id={"p" + i} checked={done}
        aria-label={revisit ? "Mark revisit done: " + title : (done ? "Untick " : "Tick ") + title}
        onChange={e => (revisit ? bumpRevisit() : toggle(e.target.checked))}
      />
      <div className="main">
        <a className="title" href={problemUrl(i)} target="_blank" rel="noopener">{title}<span className="arrow" aria-hidden="true">↗</span></a>
        <div className="meta">
          {!grouped && <span className="track">{TRACK[p[0]]}</span>}
          <span className={"pill lv-" + (p[0] === "C" ? "CF" : p[3])}>{p[3]}</span>
          {revealed.has(i)
            ? <span>{p[5]}</span>
            : <button className="spoil" type="button" onClick={() => reveal(i)}>Show topic</button>}
        </div>
        {revisit && d?.n && <div className="insight">Your insight: {d.n}</div>}
        {done && (
          <div className="after">
            <div className="how" role="group" aria-label="How did you solve it?">
              {HOW.map(([k, label]) => (
                <button key={k} className="chip" type="button" aria-pressed={(d.h || "s") === k} onClick={() => setDone({ h: k, r: 0 })}>{label}</button>
              ))}
            </div>
            <input
              className="note" id={"n" + i} placeholder="Key insight in one line" aria-label={"Key insight for " + title}
              defaultValue={d.n || ""} maxLength={200}
              onBlur={e => { if (e.target.value !== (d.n || "")) setDone({ n: e.target.value }); }}
              onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
            />
          </div>
        )}
      </div>
      <div className={"side" + (sideClass ? " " + sideClass : "")}>{side}</div>
    </div>
  );
}
