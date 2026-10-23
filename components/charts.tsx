"use client";
// Small hand-built charts. Colours come from theme tokens via CSS classes (see "charts" in globals.css),
// so every palette and mode works without per-theme code. Every value a tooltip shows is also in a
// legend, a label or the table view.
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Cell, PacePoint } from "@/lib/stats.ts";

const dayMonth = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
const longDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

// Axis top that splits into 4 whole-number steps (4, 8, 20, 40, 100, ...).
function niceMax(v: number) {
  const raw = Math.max(1, v / 4), mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 1.5, 2, 2.5, 3, 5, 10].map(m => m * mag).find(st => st >= raw && Number.isInteger(st)) ?? 10 * mag;
  return step * 4;
}

export type TipRow = { value: string; label: string; key?: string };
function Tooltip({ x, y, title, rows, width }: { x: number; y: number; title: string; rows: TipRow[]; width: number }) {
  const left = Math.max(0, Math.min(x + 12, width - 170));
  return (
    <div className="tip" style={{ left, top: Math.max(0, y - 10) }} role="status">
      <div className="tip-t">{title}</div>
      {rows.map(r => (
        <div className="tip-r" key={r.label}>
          {r.key && <i className={"key " + r.key} />}<b>{r.value}</b><span>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { key: string; label: string; kind?: "line" | "box" }[] }) {
  return (
    <div className="legend">
      {items.map(it => <span key={it.label}><i className={(it.kind === "line" ? "lkey " : "bkey ") + it.key} />{it.label}</span>)}
    </div>
  );
}

/* ---------- pace: cumulative solved vs plan ---------- */
export function PaceChart({ points, todayKey }: { points: PacePoint[]; todayKey: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const H = 200, AX = 24, M = { l: 34, r: 14, t: 10 };
  const max = niceMax(Math.max(...points.map(p => Math.max(p.plan, p.actual ?? 0)), 1));
  const iw = Math.max(1, w - M.l - M.r), n = points.length;
  const x = (i: number) => M.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
  const y = (v: number) => M.t + (H - M.t) * (1 - v / max);
  const path = (vals: (number | null)[]) => vals.reduce<string>((d, v, i) => v == null ? d : d + (d ? "L" : "M") + x(i).toFixed(1) + "," + y(v).toFixed(1), "");
  const actual = points.map(p => p.actual), lastA = actual.findLastIndex(v => v != null);
  const area = lastA >= 0 ? path(actual) + `L${x(lastA).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z` : "";
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(max * f));
  const xTicks = Array.from(new Set([0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1]));
  const ti = points.findIndex(p => p.key === todayKey);

  const pick = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    setHover(Math.max(0, Math.min(n - 1, Math.round(((clientX - r.left - M.l) / iw) * (n - 1)))));
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      setHover(h => Math.max(0, Math.min(n - 1, (h ?? ti) + (e.key === "ArrowLeft" ? -1 : 1))));
    }
  };
  const hp = hover != null ? points[hover] : null;

  return (
    <div className="chart">
      <div className="chart-head">
        <Legend items={[{ key: "c-acc", label: "Solved", kind: "line" }, { key: "c-plan", label: "Plan", kind: "line" }]} />
        <button className="linkish" type="button" onClick={() => setTable(t => !t)}>{table ? "Show chart" : "Show table"}</button>
      </div>
      {table ? (
        <table className="dtable">
          <thead><tr><th>Day</th><th>Solved</th><th>Plan</th></tr></thead>
          <tbody>{points.filter((p, i) => i % 7 === 0 || p.key === todayKey || i === n - 1).map(p => (
            <tr key={p.key}><td>{longDay(p.date)}</td><td>{p.actual ?? "–"}</td><td>{p.plan}</td></tr>
          ))}</tbody>
        </table>
      ) : (
        <div className="plot" ref={ref} style={{ height: H + AX }}
             onPointerMove={e => pick(e.clientX)} onPointerLeave={() => setHover(null)}
             tabIndex={0} onKeyDown={onKey} onFocus={() => setHover(ti)} onBlur={() => setHover(null)}
             role="img" aria-label={`Solved over time against the plan. Use left and right arrows to read each day.`}>
          {w > 0 && (
            <svg width={w} height={H + AX} aria-hidden="true">
              {ticks.map(t => (
                <g key={t}>
                  <line className="grid" x1={M.l} x2={w - M.r} y1={y(t)} y2={y(t)} />
                  <text className="axis" x={M.l - 8} y={y(t) + 4} textAnchor="end">{t}</text>
                </g>
              ))}
              {xTicks.map(i => (
                <text key={i} className="axis" x={x(i)} y={H + 17} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>{dayMonth(points[i].date)}</text>
              ))}
              {ti >= 0 && <line className="today-rule" x1={x(ti)} x2={x(ti)} y1={M.t} y2={H} />}
              <path className="plan-line" d={path(points.map(p => p.plan))} />
              {area && <path className="acc-area" d={area} />}
              <path className="acc-line" d={path(actual)} />
              {lastA >= 0 && <circle className="acc-dot" cx={x(lastA)} cy={y(actual[lastA]!)} r={4.5} />}
              {hp && (
                <g>
                  <line className="cross" x1={x(hover!)} x2={x(hover!)} y1={M.t} y2={H} />
                  <circle className="plan-dot" cx={x(hover!)} cy={y(hp.plan)} r={4} />
                  {hp.actual != null && <circle className="acc-dot" cx={x(hover!)} cy={y(hp.actual)} r={4.5} />}
                </g>
              )}
            </svg>
          )}
          {hp && (
            <Tooltip x={x(hover!)} y={y(hp.actual ?? hp.plan)} width={w} title={longDay(hp.date)} rows={[
              ...(hp.actual != null ? [{ value: String(hp.actual), label: "solved", key: "c-acc" }] : []),
              { value: String(hp.plan), label: "plan", key: "c-plan" },
            ]} />
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- activity heatmap ---------- */
const LEVELS = ["None", "Under half", "Half or more", "Minimum met", "1.5× minimum"];
const ROW_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

// Shows the whole run (first week to placement) when it fits; on narrow screens, a window around this week.
export function Heatmap({ start, total, current, build }: { start: Date; total: number; current: number; build: (from: Date, weeks: number) => Cell[][] }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<[number, number] | null>(null);
  const GAP = 3, LBL = 30, MIN = 12, MAX = 24;
  const fit = w ? Math.floor((w - LBL + GAP) / (MIN + GAP)) : 0;
  const weeks = Math.min(total, fit);
  const first = Math.max(0, Math.min(total - weeks, current - Math.floor(weeks * 0.6)));
  const CELL = weeks ? Math.min(MAX, Math.floor((w - LBL + GAP) / weeks - GAP)) : MIN;
  const from = new Date(start); from.setDate(from.getDate() + first * 7);
  const grid = weeks ? build(from, weeks) : [];
  const cur = active && grid[active[0]]?.[active[1]];
  const todayCol = current - first;

  const onKey = (e: KeyboardEvent) => {
    const d: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!d[e.key]) return;
    e.preventDefault();
    setActive(a => {
      const [c, r] = a ?? [todayCol, (new Date().getDay() + 6) % 7];
      return [Math.max(0, Math.min(weeks - 1, c + d[e.key][0])), Math.max(0, Math.min(6, r + d[e.key][1]))];
    });
  };

  return (
    <div className="chart">
      <div className="heat" ref={ref} tabIndex={0} onKeyDown={onKey} onBlur={() => setActive(null)}
           onFocus={() => setActive(a => a ?? [todayCol, (new Date().getDay() + 6) % 7])}
           role="img" aria-label="Problems solved each day against that day’s minimum. Use arrow keys to read each day."
           onPointerLeave={() => setActive(null)}>
        {weeks > 0 && (
          <>
            <div className="heat-months" style={{ paddingLeft: LBL, gridTemplateColumns: `repeat(${weeks}, ${CELL}px)`, columnGap: GAP }}>
              {grid.map((col, c) => {
                // label the first column of each month, unless it would crowd the previous label
                const d = col[col.length - 1].date, prev = c ? grid[c - 1][6].date : null;
                const show = (!prev || prev.getMonth() !== d.getMonth()) && (c === 0 || c >= 3 || grid[0][6].date.getMonth() === d.getMonth());
                return <span key={c}>{show ? d.toLocaleDateString(undefined, { month: "short" }) : ""}</span>;
              })}
            </div>
            <div className="heat-body">
              <div className="heat-rows" style={{ width: LBL, rowGap: GAP }}>{ROW_LABELS.map((l, i) => <span key={i} style={{ height: CELL }}>{l}</span>)}</div>
              <div className="heat-grid" style={{ gridTemplateColumns: `repeat(${weeks}, ${CELL}px)`, gridTemplateRows: `repeat(7, ${CELL}px)`, gap: GAP }}>
                {grid.map((col, c) => col.map((cell, r) => (
                  <i key={cell.key} style={{ gridColumn: c + 1, gridRow: r + 1 }}
                     className={"hc h" + cell.level + (cell.future ? " fut" : "") + (c === todayCol && r === (new Date().getDay() + 6) % 7 ? " now" : "") + (active && active[0] === c && active[1] === r ? " act" : "")}
                     onPointerEnter={() => setActive([c, r])} />
                )))}
              </div>
            </div>
            {cur && (
              <Tooltip x={LBL + active![0] * (CELL + GAP)} y={20 + active![1] * (CELL + GAP)} width={w} title={longDay(cur.date)}
                       rows={[{ value: `${cur.count} of ${cur.goal}`, label: cur.future ? "planned" : "solved", key: "h" + cur.level }]} />
            )}
          </>
        )}
      </div>
      <div className="legend heat-legend">
        {LEVELS.map((l, i) => <span key={l}><i className={"bkey h" + i} />{l}</span>)}
      </div>
    </div>
  );
}

/* ---------- one stacked bar (part of a whole) ---------- */
export function SplitBar({ parts, empty }: { parts: { key: string; label: string; value: number }[]; empty: ReactNode }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const [hover, setHover] = useState<string | null>(null);
  if (!total) return <p className="sub chart-empty">{empty}</p>;
  return (
    <div className="chart">
      <div className="split" role="img" aria-label={parts.map(p => `${p.label} ${p.value}`).join(", ")}>
        {parts.filter(p => p.value).map(p => (
          <i key={p.key} className={p.key + (hover === p.key ? " hov" : "")} style={{ flexGrow: p.value }}
             onPointerEnter={() => setHover(p.key)} onPointerLeave={() => setHover(null)} />
        ))}
      </div>
      <div className="split-legend">
        {parts.map(p => (
          <div key={p.key} className={hover === p.key ? "hov" : ""}>
            <i className={"bkey " + p.key} /><span>{p.label}</span>
            <b>{p.value}</b><span className="pct">{Math.round((100 * p.value) / total)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- horizontal bars with a highlighted portion ---------- */
export function TopicBars({ rows }: { rows: { topic: string; solved: number; help: number }[] }) {
  const max = Math.max(...rows.map(r => r.solved), 1);
  return (
    <div className="chart">
      <Legend items={[{ key: "c-acc", label: "Solved on your own" }, { key: "c-weak", label: "Needed help" }]} />
      <div className="tbars">
        {rows.map(r => (
          <div className="tb" key={r.topic} aria-label={`${r.topic}: ${r.solved} solved, ${r.help} needed help`}>
            <span className="tb-l">{r.topic}</span>
            <span className="tb-track">
              <span className="tb-bar">
                <span className="tb-fill" style={{ width: `${(100 * r.solved) / max}%` }}>
                  {r.solved - r.help > 0 && <i className="c-acc" style={{ flexGrow: r.solved - r.help }} />}
                  {r.help > 0 && <i className="c-weak" style={{ flexGrow: r.help }} />}
                </span>
              </span>
              <span className="tb-v">{r.solved}{r.help ? <small> ({r.help} with help)</small> : null}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- meters: share of a total ---------- */
export function Meters({ rows }: { rows: { label: string; done: number; total: number }[] }) {
  return (
    <div className="meters">
      {rows.map(r => (
        <div className="mrow" key={r.label}>
          <span className="pk">{r.label}</span>
          <div className="bar"><i style={{ width: (r.total ? (100 * r.done) / r.total : 0).toFixed(1) + "%" }} /></div>
          <span className="pn num">{r.done}<small> / {r.total}</small></span>
        </div>
      ))}
    </div>
  );
}
