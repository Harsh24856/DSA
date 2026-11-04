"use client";
// Mock OA: 3 unsolved problems against a 90-minute clock, with no solutions until it ends. The running test lives in localStorage, so a reload keeps it.
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Timer } from "@phosphor-icons/react";
import { PracticeTabs } from "@/components/PracticeTabs";
import { SolveButton, solveTarget } from "@/components/SolvePanel";
import { Card, Skeleton } from "@/components/ui";
import { fmtDay, mockPick, parse, title, todayPlan, url } from "@/lib/logic";
import { usePatterns } from "@/lib/patternStore";
import { clock, MOCK_MINUTES, mockLeft } from "@/lib/practice";
import { P } from "@/lib/problems";
import { useStore } from "@/lib/store";

const LS = "dsa-mock-v1";
type Mock = { ids: number[]; start: number; solved: number[]; ended?: number };
const save = (m: Mock | null) => { try { if (m) localStorage.setItem(LS, JSON.stringify(m)); else localStorage.removeItem(LS); } catch {} };

export default function MockOA() {
  const { ready, state, now, toggle } = useStore();
  const { done, toggle: record } = usePatterns();
  const [mock, setMock] = useState<Mock | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [time, setTime] = useState(0);
  const [sure, setSure] = useState(false);

  const update = (m: Mock | null) => { save(m); setMock(m); };
  const finish = (m: Mock, at: number) => {
    m.solved.forEach((i) => { if (!state.done[i]) toggle(i, true); });
    record(`mock:${m.start}`, true, { s: m.solved.length, n: m.ids.length });
    update({ ...m, ended: at });
    setSure(false);
  };

  useEffect(() => {
    try { const m = JSON.parse(localStorage.getItem(LS) || "null") as Mock | null; if (m?.ids?.length) setMock(m); } catch {}
    setTime(Date.now()); setLoaded(true);
  }, []);
  useEffect(() => {
    if (!mock || mock.ended) return;
    const tick = () => { const t = Date.now(); setTime(t); if (!mockLeft(mock.start, t)) finish(mock, mock.start + MOCK_MINUTES * 60000); };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mock]);

  if (!ready || !loaded) return <><PracticeTabs /><Skeleton className="h-72" /></>;

  if (!mock) {
    const ids = mockPick(state, todayPlan(state, now).main);
    const past = Object.entries(done).filter(([k]) => k.startsWith("mock:")).sort((a, b) => +b[0].slice(5) - +a[0].slice(5)).slice(0, 5);
    return (
      <><PracticeTabs />
        <div className="flex flex-col gap-6">
          <Card title="Sit a mock OA" sub={`3 problems, ${MOCK_MINUTES} minutes, no solutions until the end.`}>
            <p className="text-sm leading-relaxed">Problems come from the next part of your plan, from different topics, with their topics hidden. Solve them on LeetCode and mark each one here. Problems you finish count as solved in your plan.</p>
            {ids.length ? <button type="button" className="btn btn-primary mt-4" onClick={() => update({ ids, start: Date.now(), solved: [] })}><Timer size={16} aria-hidden />Start the clock</button>
              : <p className="empty">Every LeetCode problem in your plan is solved.</p>}
          </Card>
          {past.length > 0 && (
            <Card title="Past tests">
              <ul className="flex flex-col gap-2">
                {past.map(([k, v]) => <li key={k} className="flex justify-between gap-4 text-sm"><span>{fmtDay(parse(v.d), true)}</span><span className="num text-muted"><span className="font-semibold text-ink">{v.s ?? 0}</span> of {v.n ?? 3} solved</span></li>)}
              </ul>
            </Card>
          )}
        </div>
      </>
    );
  }

  if (mock.ended) {
    const used = Math.min(mock.ended - mock.start, MOCK_MINUTES * 60000);
    return (
      <><PracticeTabs />
        <Card title="Test finished" sub={`${mock.solved.length} of ${mock.ids.length} solved in ${clock(used)}`}>
          <ul>
            {mock.ids.map((i) => { const ok = mock.solved.includes(i); return (
              <li key={i} className="flex flex-wrap items-center gap-2 border-t border-line py-4 first:border-t-0">
                <a href={url(i)} target="_blank" rel="noopener" className="min-w-0 flex-1 basis-48 font-medium hover:text-accent">{title(i)}</a>
                <span className={`pill ${ok ? "lv-Easy" : "pill-muted"}`}>{ok ? "Solved" : "Not solved"}</span>
                <span className="text-xs text-muted">{P[i][5]}</span>
                <SolveButton t={solveTarget(i)} />
              </li>
            ); })}
          </ul>
          {mock.solved.length < mock.ids.length && <p className="callout mt-3 text-sm">The ones you did not finish stay in your plan. Try them once more before you read the solution.</p>}
          <button type="button" className="btn btn-primary mt-4" onClick={() => update(null)}>Set up another test</button>
        </Card>
      </>
    );
  }

  const left = mockLeft(mock.start, time);
  return (
    <><PracticeTabs />
      <Card title="Mock OA running" sub="Solutions stay hidden until you end the test."
        aside={<p className="num text-3xl font-semibold" role="timer" aria-label={`${Math.ceil(left / 60000)} minutes left`}>{clock(left)}</p>}>
        <ul>
          {mock.ids.map((i, k) => { const on = mock.solved.includes(i); return (
            <li key={i} className="flex flex-wrap items-center gap-3 border-t border-line py-4 first:border-t-0">
              <span className="num text-sm text-muted">{k + 1}</span>
              <div className="min-w-0 flex-1 basis-48">
                <p className="font-medium">{title(i)}</p>
                <span className={`pill lv-${P[i][3]} mt-1`}>{P[i][3]}</span>
              </div>
              <a href={url(i)} target="_blank" rel="noopener" className="btn btn-sm">Open on LeetCode<ArrowUpRight size={14} aria-hidden /></a>
              <button type="button" className={`btn btn-sm ${on ? "btn-primary" : ""}`} aria-pressed={on} aria-label={`${on ? "Solved" : "Mark solved"}: ${title(i)}`}
                onClick={() => update({ ...mock, solved: on ? mock.solved.filter((x) => x !== i) : [...mock.solved, i] })}><Check size={14} weight="bold" aria-hidden />{on ? "Solved" : "Mark solved"}</button>
            </li>
          ); })}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {sure ? <>
            <p className="text-sm">End the test now?</p>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => finish(mock, Date.now())}>End test</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSure(false)}>Keep going</button>
          </> : <button type="button" className="btn btn-sm" onClick={() => setSure(true)}>End test</button>}
        </div>
      </Card>
    </>
  );
}
