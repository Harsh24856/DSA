"use client";
// Step-through player + renderers for lib/diagram.ts specs. Colors come only from tokens.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowCounterClockwise, CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import type { Diagram, Mark, Tone } from "@/lib/diagram";

const CELL: Record<Tone | "none", string> = {
  none: "bg-surface text-ink ring-line-strong",
  active: "bg-accent text-accent-ink ring-accent",
  window: "bg-accent-soft text-ink ring-accent/50",
  done: "bg-surface-2 text-muted ring-line",
  found: "bg-easy/20 text-easy ring-easy",
  bad: "bg-hard/15 text-hard ring-hard",
  muted: "bg-surface text-muted ring-line opacity-40",
};
const FILL: Record<Tone | "none", { fill: string; text: string; stroke: string; op?: number }> = {
  none: { fill: "var(--surface)", text: "var(--ink)", stroke: "var(--line-strong)" },
  active: { fill: "var(--accent)", text: "var(--accent-ink)", stroke: "var(--accent)" },
  window: { fill: "var(--accent-soft)", text: "var(--ink)", stroke: "var(--accent)" },
  done: { fill: "var(--surface-2)", text: "var(--muted)", stroke: "var(--line-strong)" },
  found: { fill: "color-mix(in oklab, var(--easy) 22%, var(--surface))", text: "var(--easy)", stroke: "var(--easy)" },
  bad: { fill: "color-mix(in oklab, var(--hard) 18%, var(--surface))", text: "var(--hard)", stroke: "var(--hard)" },
  muted: { fill: "var(--surface)", text: "var(--muted)", stroke: "var(--line)", op: 0.35 },
};
const EDGE: Record<Tone | "none", string> = { none: "var(--line-strong)", active: "var(--accent)", window: "var(--accent)", done: "var(--muted)", found: "var(--easy)", bad: "var(--hard)", muted: "var(--line)" };

export function Visualizer({ diagram, input }: { diagram: Diagram; input?: ReactNode }) {
  const n = diagram.frames.length;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { setStep(0); setPlaying(false); }, [diagram]);
  useEffect(() => {
    if (!playing) return;
    if (step >= n - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setStep((s) => Math.min(n - 1, s + 1)), 1400 / speed);
    return () => clearTimeout(t);
  }, [playing, step, n, speed]);

  const frame = diagram.frames[Math.min(step, n - 1)];
  const go = (s: number) => { setPlaying(false); setStep(Math.max(0, Math.min(n - 1, s))); };
  const by = (d: number) => { setPlaying(false); setStep((s) => Math.max(0, Math.min(n - 1, s + d))); };

  return (
    <div ref={box} tabIndex={0} aria-label={`${diagram.title}. Step ${step + 1} of ${n}. Use the arrow keys to step.`}
      onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); by(1); } if (e.key === "ArrowLeft") { e.preventDefault(); by(-1); } if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); } }}
      className="inset bg-surface-2/50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-[14px] font-semibold">{diagram.title}</h4>
        {input}
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-fit">
          {diagram.kind === "cells" && <Cells d={diagram} f={frame as never} />}
          {diagram.kind === "tree" && <Tree d={diagram} f={frame as never} reduce={!!reduce} />}
          {diagram.kind === "graph" && <Graph d={diagram} f={frame as never} />}
          {diagram.kind === "table" && <Table d={diagram} f={frame as never} />}
          {diagram.kind === "stack" && <Stack d={diagram} f={frame as never} reduce={!!reduce} />}
          {diagram.kind === "list" && <List d={diagram} f={frame as never} />}
          {diagram.kind === "intervals" && <Intervals d={diagram} f={frame as never} />}
          {diagram.kind === "tables" && <Tables f={frame as never} />}
        </div>
      </div>
      <div className="mt-2 min-h-[44px] overflow-hidden rounded-control bg-surface px-3 py-2.5 text-[14px] leading-snug" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            <span className="num mr-2 text-[12px] font-semibold text-accent">{step + 1}/{n}</span>{frame.note}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <motion.div className="h-full origin-left rounded-full bg-accent" animate={{ scaleX: (step + 1) / n }} transition={{ duration: reduce ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm btn-icon" onClick={() => go(0)} aria-label="Restart"><ArrowCounterClockwise size={14} aria-hidden /></button>
        <button type="button" className="btn btn-sm btn-icon" onClick={() => by(-1)} disabled={step === 0} aria-label="Previous step"><CaretLeft size={14} aria-hidden /></button>
        <button type="button" className="btn btn-primary btn-sm min-w-24" onClick={() => { if (step >= n - 1) setStep(0); setPlaying((p) => !p); }}>
          {playing ? <><Pause size={14} weight="fill" aria-hidden />Pause</> : <><Play size={14} weight="fill" aria-hidden />{step >= n - 1 ? "Replay" : "Play"}</>}
        </button>
        <button type="button" className="btn btn-sm btn-icon" onClick={() => by(1)} disabled={step >= n - 1} aria-label="Next step"><CaretRight size={14} aria-hidden /></button>
        <input type="range" min={0} max={n - 1} value={step} onChange={(e) => go(+e.target.value)} aria-label="Step" className="mx-1 h-1.5 min-w-24 flex-1 cursor-pointer accent-[var(--accent)]" />
        <select className="field field-sm w-20 px-2" value={speed} onChange={(e) => setSpeed(+e.target.value)} aria-label="Speed">
          <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option>
        </select>
      </div>
    </div>
  );
}

/* ---------- cells ---------- */
const STEP = 46; // cell width 40 + gap 6
function Cells({ d, f }: { d: Extract<Diagram, { kind: "cells" }>; f: Extract<Diagram, { kind: "cells" }>["frames"][number] }) {
  const reduce = useReducedMotion();
  const rows = f.rows ?? d.rows;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 32 };
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, r) => {
        // pointers for this row; several on one cell stack downward
        const ms = (f.marks ?? []).filter((m: Mark) => (m.row ?? 0) === r);
        const slot = (m: Mark) => ms.filter((o) => o.i === m.i).indexOf(m);
        const lanes = ms.length ? Math.max(...ms.map(slot)) + 1 : 0;
        return (
          <div key={r} className="flex items-start gap-2">
            {d.rowLabels && <span className="num w-16 shrink-0 pt-2.5 text-right text-[11px] text-muted">{d.rowLabels[r]}</span>}
            <div>
              <div className="flex gap-1.5">
                {row.map((v, i) => {
                  const t = f.tones?.[`${r}:${i}`] ?? "none";
                  return (
                    <div key={i} className="flex w-10 flex-col items-center gap-1">
                      <motion.div animate={{ y: t === "active" ? -3 : 0, scale: t === "found" ? 1.06 : 1 }} transition={spring}
                        className={`num grid h-10 w-10 place-items-center overflow-hidden rounded-lg text-[14px] font-semibold ring-1 ring-inset transition-colors duration-300 ${CELL[t]} ${t === "active" ? "shadow-card" : ""}`}>
                        <motion.span key={String(v)} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}>{String(v)}</motion.span>
                      </motion.div>
                      {r === 0 && !d.rowLabels && <span className="num text-[10px] text-muted">{i}</span>}
                    </div>
                  );
                })}
              </div>
              {lanes > 0 && (
                <div className="relative mt-1" style={{ height: lanes * 18, width: row.length * STEP - 6 }}>
                  {ms.map((m) => (
                    <motion.div key={m.label} className="absolute left-0 top-0 flex w-10 justify-center" initial={false} animate={{ x: m.i * STEP, y: slot(m) * 18 }} transition={spring}>
                      <span className="num whitespace-nowrap rounded bg-ink px-1 text-[10px] font-semibold text-bg">{m.label}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- tree ---------- */
function Tree({ d, f, reduce }: { d: Extract<Diagram, { kind: "tree" }>; f: Extract<Diagram, { kind: "tree" }>["frames"][number]; reduce: boolean }) {
  const pos = useMemo(() => {
    const kids = new Map<number | null, typeof d.nodes>();
    d.nodes.forEach((nd) => { const l = kids.get(nd.parent) ?? []; l.push(nd); kids.set(nd.parent, l); });
    const out = new Map<number, { x: number; y: number }>(); let cursor = 0;
    const binary = d.nodes.every((nd) => nd.parent == null || nd.side);
    const kidsOf = (id: number) => kids.get(id) ?? [];
    // binary trees: x = in-order rank (left subtree, node, right subtree); others: parents centred over their leaves
    const place = (id: number, depth: number): number => {
      const ch = kidsOf(id);
      if (binary) {
        const L = ch.find((c) => c.side === "L"), R = ch.find((c) => c.side === "R");
        if (L) place(L.id, depth + 1);
        const x = cursor++;
        if (R) place(R.id, depth + 1);
        out.set(id, { x, y: depth }); return x;
      }
      const xs = ch.map((c) => place(c.id, depth + 1));
      const x = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : cursor++;
      out.set(id, { x, y: depth }); return x;
    };
    d.nodes.filter((nd) => nd.parent == null).forEach((r) => place(r.id, 0));
    return out;
  }, [d]);
  const W = Math.max(...[...pos.values()].map((p) => p.x)) + 1, H = Math.max(...[...pos.values()].map((p) => p.y)) + 1;
  const sx = 54, sy = 64, px = 28, py = 30;
  return (
    <svg viewBox={`0 0 ${W * sx + px} ${H * sy + py}`} className="mx-auto block h-auto" style={{ width: Math.min(820, W * sx + px), maxWidth: "100%" }} role="img" aria-label={d.title}>
      {d.nodes.map((nd) => {
        if (nd.parent == null) return null; const a = pos.get(nd.parent)!, b = pos.get(nd.id)!, t = f.tones?.[nd.id];
        return <g key={"e" + nd.id}>
          <line x1={a.x * sx + px / 2 + 14} y1={a.y * sy + py / 2 + 14} x2={b.x * sx + px / 2 + 14} y2={b.y * sy + py / 2 + 14} stroke={t && t !== "muted" ? EDGE[t] : "var(--line-strong)"} strokeWidth={1.5} opacity={t === "muted" ? 0.3 : 1} />
          {nd.edge && <text x={(a.x + b.x) / 2 * sx + px / 2 + 14} y={(a.y + b.y) / 2 * sy + py / 2 + 10} fontSize={9} textAnchor="middle" fill="var(--muted)">{nd.edge}</text>}
        </g>;
      })}
      {d.nodes.map((nd) => {
        const p = pos.get(nd.id)!, t = f.tones?.[nd.id] ?? "none", c = FILL[t], label = f.labels?.[nd.id] ?? nd.label, badge = f.badges?.[nd.id];
        const cx = p.x * sx + px / 2 + 14, cy = p.y * sy + py / 2 + 14, r = label.length > 3 ? 21 : 16;
        return <motion.g key={nd.id} initial={false} animate={{ opacity: c.op ?? 1, scale: t === "active" && !reduce ? 1.08 : 1 }} style={{ originX: `${cx}px`, originY: `${cy}px` }} transition={{ duration: 0.3 }}>
          <circle cx={cx} cy={cy} r={r} fill={c.fill} stroke={c.stroke} strokeWidth={1.5} style={{ transition: "fill .3s, stroke .3s" }} />
          <text x={cx} y={cy + 4} fontSize={label.length > 4 ? 9 : 12} fontWeight={600} textAnchor="middle" fill={c.text} fontFamily="var(--mono)">{label}</text>
          {badge && <text x={cx + r + 2} y={cy - r + 4} fontSize={9.5} fontWeight={600} fill="var(--accent)" fontFamily="var(--mono)">{badge}</text>}
        </motion.g>;
      })}
    </svg>
  );
}

/* ---------- graph ---------- */
function Graph({ d, f }: { d: Extract<Diagram, { kind: "graph" }>; f: Extract<Diagram, { kind: "graph" }>["frames"][number] }) {
  const X = (x: number) => 20 + x * 5.2, Y = (y: number) => 14 + y * 2.2;
  return (
    <svg viewBox="0 0 560 250" className="mx-auto block h-auto w-full max-w-[620px]" role="img" aria-label={d.title}>
      <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--muted)" /></marker></defs>
      {d.edges.map((e) => {
        const a = d.nodes[e.a], b = d.nodes[e.b], t = f.edgeTones?.[`${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`];
        const dx = X(b.x) - X(a.x), dy = Y(b.y) - Y(a.y), L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
        return <g key={`${e.a}-${e.b}`}>
          <line x1={X(a.x) + ux * 20} y1={Y(a.y) + uy * 20} x2={X(b.x) - ux * 22} y2={Y(b.y) - uy * 22} stroke={t ? EDGE[t] : "var(--line-strong)"} strokeWidth={t === "found" ? 3 : 1.6} strokeDasharray={t === "bad" ? "5 4" : undefined} markerEnd={e.directed ? "url(#arr)" : undefined} style={{ transition: "stroke .3s" }} />
          {e.w != null && <text x={(X(a.x) + X(b.x)) / 2 + uy * 10} y={(Y(a.y) + Y(b.y)) / 2 - ux * 10 + 4} fontSize={11} textAnchor="middle" fill="var(--muted)" fontFamily="var(--mono)" fontWeight={600}>{e.w}</text>}
        </g>;
      })}
      {d.nodes.map((nd) => {
        const t = f.tones?.[nd.id] ?? "none", c = FILL[t], badge = f.badges?.[nd.id];
        return <g key={nd.id} opacity={c.op ?? 1} style={{ transition: "opacity .3s" }}>
          <circle cx={X(nd.x)} cy={Y(nd.y)} r={19} fill={c.fill} stroke={c.stroke} strokeWidth={1.8} style={{ transition: "fill .3s, stroke .3s" }} />
          <text x={X(nd.x)} y={Y(nd.y) + 4} fontSize={nd.label.length > 2 ? 10 : 13} fontWeight={600} textAnchor="middle" fill={c.text}>{nd.label}</text>
          {badge && <text x={X(nd.x)} y={Y(nd.y) - 25} fontSize={10.5} fontWeight={600} textAnchor="middle" fill="var(--accent)" fontFamily="var(--mono)">{badge}</text>}
        </g>;
      })}
    </svg>
  );
}

/* ---------- table ---------- */
function Table({ d, f }: { d: Extract<Diagram, { kind: "table" }>; f: Extract<Diagram, { kind: "table" }>["frames"][number] }) {
  const isDep = (r: number, c: number) => f.deps?.some(([a, b]) => a === r && b === c);
  return (
    <table className="num mx-auto border-separate border-spacing-1 text-[13px]">
      <thead><tr><th />{d.colHead.map((h, c) => <th key={c} className="px-1 text-[11px] font-medium text-muted">{h}</th>)}</tr></thead>
      <tbody>
        {f.cells.map((row, r) => (
          <tr key={r}>
            <th className="pr-1 text-right text-[11px] font-medium text-muted">{d.rowHead[r]}</th>
            {row.map((v, c) => {
              const act = f.active?.[0] === r && f.active?.[1] === c, t = f.tones?.[`${r}:${c}`];
              const cls = act ? CELL.active : isDep(r, c) ? CELL.window : t ? CELL[t] : v == null ? "bg-transparent ring-line/60 text-muted" : CELL.none;
              return <td key={c} className={`h-9 min-w-9 rounded-lg px-2 text-center font-semibold ring-1 ring-inset transition-colors duration-300 ${cls}`}>{v == null ? "" : <motion.span key={String(v)} className="inline-block" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 28 }}>{String(v)}</motion.span>}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------- stack ---------- */
function Stack({ d, f, reduce }: { d: Extract<Diagram, { kind: "stack" }>; f: Extract<Diagram, { kind: "stack" }>["frames"][number]; reduce: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-6">
      {d.input && <div className="flex flex-col items-center gap-1"><span className="text-[11px] text-muted">input</span><div className="flex gap-1">{d.input.map((x, i) => <span key={i} className={`num grid h-8 min-w-8 place-items-center rounded-lg px-1.5 text-[13px] font-semibold ring-1 ring-inset ${String(x) === String(f.incoming) ? CELL.active : CELL.none}`}>{x}</span>)}</div></div>}
      <div className="flex flex-col items-center gap-1">
        <div className="flex min-h-[176px] w-36 flex-col-reverse items-stretch gap-1 rounded-b-[12px] border-x-2 border-b-2 border-line-strong p-1.5">
          <AnimatePresence initial={false}>
          {f.items.map((x, i) => (
            <motion.div key={`${i}-${x}`} layout={!reduce} initial={{ opacity: 0, y: -24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -28, scale: 0.9 }} transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className={`num rounded-lg px-2 py-1.5 text-center text-[13px] font-semibold ring-1 ring-inset ${i === f.items.length - 1 ? CELL.window : CELL.none}`}>{x}</motion.div>
          ))}
          </AnimatePresence>
        </div>
        <span className="text-[11px] text-muted">{f.items.length ? "top ↑" : "empty"}</span>
      </div>
      {(f.popped?.length || f.side) && (
        <div className="flex flex-col gap-2 text-[12px]">
          {!!f.popped?.length && <div><span className="text-muted">popped </span>{f.popped.map((p, i) => <span key={i} className={`num ml-1 inline-block rounded-md px-1.5 py-0.5 font-semibold ring-1 ring-inset ${CELL.bad}`}>{p}</span>)}</div>}
          {f.side && <div className="num text-muted">{f.side}</div>}
        </div>
      )}
    </div>
  );
}

/* ---------- linked list ---------- */
function List({ d, f }: { d: Extract<Diagram, { kind: "list" }>; f: Extract<Diagram, { kind: "list" }>["frames"][number] }) {
  const n = d.values.length, sx = 78, W = n * sx + 20, cy = 60, X = (i: number) => 30 + i * sx;
  return (
    <svg viewBox={`0 0 ${W} 132`} className="mx-auto block h-auto" style={{ width: W, maxWidth: "100%" }} role="img" aria-label={d.title}>
      <defs><marker id="la" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--accent)" /></marker></defs>
      {f.next.map((j, i) => {
        if (j < 0) return null; const x1 = X(i) + 22, x2 = X(j) - 22;
        if (j === i + 1) return <line key={i} x1={x1} y1={cy} x2={x2} y2={cy} stroke="var(--accent)" strokeWidth={1.8} markerEnd="url(#la)" />;
        const up = j < i, a = X(i) + (up ? -6 : 6), b = X(j) + (up ? 6 : -6), yy = up ? cy - 44 : cy + 44;
        return <path key={i} d={`M ${a} ${cy + (up ? -18 : 18)} C ${a} ${yy}, ${b} ${yy}, ${b} ${cy + (up ? -20 : 20)}`} fill="none" stroke="var(--accent)" strokeWidth={1.8} markerEnd="url(#la)" />;
      })}
      {(f.values ?? d.values).map((v, i) => {
        const t = f.tones?.[i] ?? "none", c = FILL[t], ptr = f.ptrs.filter((p) => p.i === i).map((p) => p.label).join(", ");
        return <g key={i} opacity={c.op ?? 1}>
          <rect x={X(i) - 20} y={cy - 18} width={40} height={36} rx={9} fill={c.fill} stroke={c.stroke} strokeWidth={1.6} style={{ transition: "fill .3s" }} />
          <text x={X(i)} y={cy + 5} fontSize={14} fontWeight={600} textAnchor="middle" fill={c.text} fontFamily="var(--mono)">{v}</text>
          {ptr && <text x={X(i)} y={cy + 52} fontSize={10.5} fontWeight={700} textAnchor="middle" fill="var(--ink)" fontFamily="var(--mono)">{ptr}</text>}
          {f.next[i] === -1 && <text x={X(i) + 30} y={cy + 4} fontSize={11} fill="var(--muted)" fontFamily="var(--mono)">∅</text>}
        </g>;
      })}
    </svg>
  );
}

/* ---------- intervals ---------- */
function Intervals({ d, f }: { d: Extract<Diagram, { kind: "intervals" }>; f: Extract<Diagram, { kind: "intervals" }>["frames"][number] }) {
  const lo = Math.min(...d.items.map((x) => x[0])), hi = Math.max(...d.items.map((x) => x[1])), W = 560, P = 24, X = (v: number) => P + ((v - lo) / Math.max(1, hi - lo)) * (W - 2 * P);
  const rowsH = d.items.length * 22 + (f.result ? 34 : 0) + 40;
  const ticks = Array.from({ length: 6 }, (_, k) => Math.round(lo + ((hi - lo) * k) / 5));
  return (
    <svg viewBox={`0 0 ${W} ${rowsH}`} className="mx-auto block h-auto w-full max-w-[620px]" role="img" aria-label={d.title}>
      {ticks.map((t) => <g key={t}><line x1={X(t)} x2={X(t)} y1={6} y2={rowsH - 22} stroke="var(--line)" strokeDasharray="2 4" /><text x={X(t)} y={rowsH - 8} fontSize={10} textAnchor="middle" fill="var(--muted)" fontFamily="var(--mono)">{t}</text></g>)}
      {d.items.map(([s, e], i) => { const t = f.tones?.[i] ?? "none", c = FILL[t]; return <g key={i} opacity={c.op ?? 1}><rect x={X(s)} y={10 + i * 22} width={Math.max(4, X(e) - X(s))} height={15} rx={5} fill={c.fill} stroke={c.stroke} strokeWidth={1.4} style={{ transition: "fill .3s" }} /><text x={X(s) + 4} y={21 + i * 22} fontSize={9.5} fill={c.text} fontFamily="var(--mono)" fontWeight={600}>{s},{e}</text></g>; })}
      {f.result && <g>{f.result.map(([s, e], k) => <rect key={k} x={X(s)} y={14 + d.items.length * 22} width={Math.max(4, X(e) - X(s))} height={15} rx={5} fill="color-mix(in oklab, var(--easy) 30%, var(--surface))" stroke="var(--easy)" strokeWidth={1.4} />)}<text x={4} y={25 + d.items.length * 22} fontSize={9} fill="var(--easy)" fontWeight={700}>out</text></g>}
      {f.line != null && <line x1={X(f.line)} x2={X(f.line)} y1={4} y2={rowsH - 22} stroke="var(--accent)" strokeWidth={2} />}
    </svg>
  );
}

/* ---------- SQL tables ---------- */
function Tables({ f }: { f: Extract<Diagram, { kind: "tables" }>["frames"][number] }) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      {f.tables.map((t) => (
        <motion.div key={t.name} layout className="min-w-0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className={`mb-1 text-[12px] font-semibold ${t.tone === "found" ? "text-easy" : "text-muted"}`}>{t.name}</div>
          <table className="num border-separate border-spacing-0 overflow-hidden rounded-control border border-line text-[12.5px]">
            <thead><tr>{t.cols.map((c) => <th key={c} className="border-b border-line bg-surface-2 px-2.5 py-1.5 text-left font-semibold">{c}</th>)}</tr></thead>
            <tbody>
              {t.rows.map((r, i) => {
                const on = t.hl?.includes(i);
                return <tr key={i} className={`transition-colors duration-300 ${on ? (t.tone === "bad" ? "bg-hard/15 text-hard" : t.tone === "found" ? "bg-easy/15" : "bg-accent-soft") : ""}`}>{r.map((v, j) => <td key={j} className="border-t border-line px-2.5 py-1.5 first:border-t-0">{v == null ? <span className="text-muted">null</span> : String(v)}</td>)}</tr>;
              })}
            </tbody>
          </table>
        </motion.div>
      ))}
    </div>
  );
}
