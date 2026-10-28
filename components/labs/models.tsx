"use client";
// Labs for "how models work": one neuron, gradient descent, convolution, diffusion noise, attention, sampling, BPE.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Seg } from "../ui";
import { Lab, Slider, spring, tint, useTicker } from "./kit";

const map = (v: number, [a, b]: number[], [c, d]: number[]) => c + ((v - a) / (b - a)) * (d - c);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const softmax = (xs: number[]) => { const m = Math.max(...xs), e = xs.map((x) => Math.exp(x - m)), s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); };

/* ---------- one neuron ---------- */
const ACTS = {
  relu: ["ReLU", (x: number) => Math.max(0, x)],
  gelu: ["GELU", (x: number) => 0.5 * x * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x ** 3)))],
  silu: ["SiLU", (x: number) => x / (1 + Math.exp(-x))],
  sigmoid: ["Sigmoid", (x: number) => 1 / (1 + Math.exp(-x))],
  tanh: ["Tanh", Math.tanh],
} as const;
type Act = keyof typeof ACTS;

export function ActivationLab() {
  const [act, setAct] = useState<Act>("relu");
  const [w, setW] = useState(1), [b, setB] = useState(0), [x0, setX0] = useState(1);
  const [name, f] = ACTS[act];
  const W = 320, H = 180, X = [-4, 4], Y = [-3, 4];
  const px = (x: number) => map(x, X, [0, W]), py = (y: number) => map(clamp(y, Y[0], Y[1]), Y, [H, 0]);
  const line = (g: (x: number) => number) => Array.from({ length: 161 }, (_, i) => { const x = X[0] + i * 0.05; return `${px(x).toFixed(1)},${py(g(x)).toFixed(1)}`; }).join(" ");
  const z = w * x0 + b, y = f(z);
  return (
    <Lab title="One neuron, five activations" hint="The dashed line is the weighted sum z = w·x + b. The solid line is what the neuron outputs after the activation. Watch how ReLU cuts negatives to zero and sigmoid squashes everything into 0 to 1.">
      <Seg<Act> label="Activation" value={act} onChange={setAct} className="flex flex-wrap" options={(Object.keys(ACTS) as Act[]).map((k) => [k, ACTS[k][0]] as const)} />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[520px] rounded-tile bg-surface" role="img" aria-label={`${name}(${w}·x + ${b}) plotted from x = -4 to 4`}>
        <line x1={0} x2={W} y1={py(0)} y2={py(0)} stroke="var(--line-strong)" />
        <line x1={px(0)} x2={px(0)} y1={0} y2={H} stroke="var(--line-strong)" />
        <polyline points={line((x) => w * x + b)} fill="none" stroke="var(--muted)" strokeDasharray="4 4" strokeWidth={1.5} />
        <polyline points={line((x) => f(w * x + b))} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <motion.circle r={5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} initial={false} animate={{ cx: px(x0), cy: py(y) }} transition={spring} />
      </svg>
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="weight w" value={w} min={-3} max={3} step={0.1} onChange={setW} />
        <Slider label="bias b" value={b} min={-3} max={3} step={0.1} onChange={setB} />
        <Slider label="input x" value={x0} min={-4} max={4} step={0.1} onChange={setX0} />
      </div>
      <p className="num rounded-tile bg-surface-2 px-3 py-2 text-[13px]">z = {w}·{x0} + {b} = {z.toFixed(2)}, then {name}(z) = {y.toFixed(3)}</p>
    </Lab>
  );
}

/* ---------- gradient descent ---------- */
const loss = (x: number) => 0.1 * x ** 4 - 0.9 * x ** 2 + 0.35 * x;
const grad = (x: number) => 0.4 * x ** 3 - 1.8 * x + 0.35;
type Run = { x: number; v: number; n: number; path: number[]; state: "run" | "done" | "diverged" };
const fresh = (x: number): Run => ({ x, v: 0, n: 0, path: [x], state: "run" });

export function DescentLab() {
  const [lr, setLr] = useState(0.05), [mom, setMom] = useState<"0" | "0.9">("0"), [start, setStart] = useState(3);
  const [run, setRun] = useState(() => fresh(3));
  const [playing, setPlaying] = useState(false);
  const step = () => setRun((r) => {
    if (r.state !== "run") return r;
    const v = +mom * r.v - lr * grad(r.x), x = r.x + v;
    if (!Number.isFinite(x) || Math.abs(x) > 6) return { ...r, x: clamp(x, -6, 6), n: r.n + 1, state: "diverged" };
    const done = Math.abs(grad(x)) < 0.003 && Math.abs(v) < 0.003;
    return { x, v, n: r.n + 1, path: [...r.path.slice(-40), x], state: done || r.n > 400 ? "done" : "run" };
  });
  useTicker(playing, 90, step);
  useEffect(() => { if (run.state !== "run") setPlaying(false); }, [run.state]);
  const reset = (x = start) => { setPlaying(false); setRun(fresh(x)); };

  const W = 320, H = 190, X = [-3.6, 3.6], Y = [-3.2, 5.6];
  const px = (x: number) => map(clamp(x, X[0], X[1]), X, [0, W]), py = (y: number) => map(clamp(y, Y[0], Y[1]), Y, [H - 6, 6]);
  const curve = Array.from({ length: 145 }, (_, i) => { const x = X[0] + i * 0.05; return `${px(x).toFixed(1)},${py(loss(x)).toFixed(1)}`; }).join(" ");
  const msg = run.state === "diverged" ? "Diverged: every step overshoots the valley and the loss explodes. Lower the learning rate."
    : run.state === "done" ? (run.x < 0 ? "Reached the deepest valley (global minimum)." : "Stuck in the shallow valley (local minimum). Try momentum 0.9 or a bigger learning rate.")
    : "Each step moves θ against the slope: θ ← θ − lr · gradient.";
  return (
    <Lab title="Gradient descent on a bumpy loss" hint="The ball is the model's weight θ. Press Play and watch it roll downhill. Then try a tiny learning rate, a huge one, and momentum.">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[520px] rounded-tile bg-surface" role="img" aria-label={`Loss curve with two valleys. Current θ ${run.x.toFixed(2)}, loss ${loss(run.x).toFixed(2)}.`}>
        <polyline points={curve} fill="none" stroke="var(--line-strong)" strokeWidth={2.5} />
        {run.path.map((x, i) => <circle key={i} cx={px(x)} cy={py(loss(x))} r={2.5} fill="var(--muted)" opacity={0.25 + (0.6 * i) / run.path.length} />)}
        <motion.circle r={7} fill={run.state === "diverged" ? "var(--hard)" : "var(--accent)"} stroke="var(--surface)" strokeWidth={2}
          initial={false} animate={{ cx: px(run.x), cy: py(loss(run.x)) - 7 }} transition={{ type: "spring", stiffness: 420, damping: 28 }} />
      </svg>
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="learning rate" value={lr} min={0.01} max={1.2} step={0.01} onChange={(v) => { setLr(v); reset(); }} />
        <Slider label="start θ" value={start} min={-3.2} max={3.2} step={0.1} onChange={(v) => { setStart(v); reset(v); }} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Seg<"0" | "0.9"> label="Momentum" value={mom} onChange={(v) => { setMom(v); reset(); }} options={[["0", "No momentum"], ["0.9", "Momentum 0.9"]]} />
        <button type="button" className="btn btn-sm btn-primary" onClick={() => (run.state === "run" ? setPlaying((p) => !p) : (reset(), setPlaying(true)))}>{playing ? "Pause" : "Play"}</button>
        <button type="button" className="btn btn-sm" onClick={step} disabled={run.state !== "run"}>Step</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => reset()}>Reset</button>
      </div>
      <p className="text-[13px]" role="status"><span className="num font-semibold">step {run.n} · θ = {run.x.toFixed(3)} · loss = {loss(run.x).toFixed(3)}</span><br /><span className="text-muted">{msg}</span></p>
    </Lab>
  );
}

/* ---------- convolution ---------- */
const IMG = [
  [0, 0, 0, 0, 0, 0, 0], [0, 1, 1, 1, 1, 1, 0], [0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0],
];
const KERNELS = {
  vertical: ["Vertical edge", [[1, 0, -1], [1, 0, -1], [1, 0, -1]]],
  horizontal: ["Horizontal edge", [[1, 1, 1], [0, 0, 0], [-1, -1, -1]]],
  blur: ["Blur", [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((r) => r.map((v) => v / 9))],
  sharpen: ["Sharpen", [[0, -1, 0], [-1, 5, -1], [0, -1, 0]]],
} as const;
type Kern = keyof typeof KERNELS;
const r1 = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

function Grid({ rows, cell, label }: { rows: { v: number | null; bg: string; fg?: string; hl?: boolean }[][]; cell: number; label: string }) {
  return (
    <div className="grid w-fit gap-px rounded-[6px] bg-line p-px" style={{ gridTemplateColumns: `repeat(${rows[0].length}, ${cell}px)` }} role="img" aria-label={label}>
      {rows.flat().map((c, i) => (
        <div key={i} className="num grid place-items-center text-[10px] font-semibold transition-colors" style={{ height: cell, background: c.bg, color: c.fg ?? "var(--ink)", outline: c.hl ? "2px solid var(--accent)" : undefined, outlineOffset: -2 }}>{c.v === null ? "" : r1(c.v)}</div>
      ))}
    </div>
  );
}

export function ConvLab() {
  const [k, setK] = useState<Kern>("vertical");
  const [pos, setPos] = useState(0), [playing, setPlaying] = useState(false);
  const K = KERNELS[k][1];
  const out = useMemo(() => Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => {
    let s = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += IMG[r + i][c + j] * K[i][j]; return s;
  })), [K]);
  const max = Math.max(...out.flat().map(Math.abs)) || 1;
  useTicker(playing, 450, () => setPos((p) => { if (p >= 24) { setPlaying(false); return 24; } return p + 1; }));
  const R = Math.floor(pos / 5), C = pos % 5;
  return (
    <Lab title="A 3×3 kernel sliding over an image" hint="A convolution multiplies the kernel with each 3×3 window and adds the 9 products into one output pixel. Edge kernels light up where brightness changes.">
      <Seg<Kern> label="Kernel" value={k} onChange={(v) => { setK(v); setPos(0); }} className="flex flex-wrap" options={(Object.keys(KERNELS) as Kern[]).map((x) => [x, KERNELS[x][0]] as const)} />
      <div className="flex flex-wrap items-start gap-4">
        <div className="grid gap-1"><span className="t-eyebrow text-[12px]">Input 7×7</span>
          <Grid cell={26} label="Input image of the digit 7" rows={IMG.map((row, r) => row.map((v, c) => ({ v, bg: tint(v ? 70 : 0, "var(--ink)"), fg: v ? "var(--surface)" : "var(--muted)", hl: r >= R && r < R + 3 && c >= C && c < C + 3 })))} /></div>
        <div className="grid gap-1"><span className="t-eyebrow text-[12px]">Kernel</span>
          <Grid cell={26} label={`${KERNELS[k][0]} kernel`} rows={K.map((row) => row.map((v) => ({ v, bg: v > 0 ? tint(30) : v < 0 ? tint(30, "var(--hard)") : "var(--surface)" })))} /></div>
        <div className="grid gap-1"><span className="t-eyebrow text-[12px]">Output 5×5</span>
          <Grid cell={26} label="Feature map so far" rows={out.map((row, r) => row.map((v, c) => {
            const i = r * 5 + c, shown = i <= pos, p = (Math.abs(v) / max) * 40;   // tints stay light enough for ink text in every theme
            return { v: shown ? v : null, bg: shown ? tint(p, v < 0 ? "var(--hard)" : "var(--accent)") : "var(--surface)", hl: i === pos };
          }))} /></div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm btn-primary" onClick={() => { if (pos >= 24) setPos(0); setPlaying((p) => !p); }}>{playing ? "Pause" : "Slide"}</button>
        <button type="button" className="btn btn-sm" onClick={() => setPos((p) => Math.min(24, p + 1))}>Step</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setPlaying(false); setPos(0); }}>Reset</button>
        <span className="num text-[13px]" role="status">window ({R}, {C}): sum of window × kernel = <b>{r1(out[R][C])}</b></span>
      </div>
    </Lab>
  );
}

/* ---------- diffusion forward noise ---------- */
const STEPS = 1000;
const ALPHA_BAR = (() => { const a: number[] = []; let p = 1; for (let t = 0; t < STEPS; t++) { p *= 1 - (1e-4 + ((0.02 - 1e-4) * t) / (STEPS - 1)); a.push(p); } return a; })();
const FACE = Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => {
  const d = Math.hypot(x - 7.5, y - 7.5), eye = (y === 5 || y === 6) && (x === 5 || x === 6 || x === 9 || x === 10);
  const mouth = (y === 10 && x >= 5 && x <= 10) || (y === 9 && (x === 4 || x === 11));
  return d < 7.2 && !eye && !mouth ? 1 : -1;
}));
const NOISE = (() => { let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); return FACE.map((row) => row.map(() => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r()))); })();

export function NoiseLab() {
  const [t, setT] = useState(250);
  const ab = ALPHA_BAR[t], sig = Math.sqrt(ab), nz = Math.sqrt(1 - ab);
  const px = (v: number) => ({ v: null, bg: tint(clamp((v + 1.6) / 3.2, 0, 1) * 100, "var(--ink)") });
  return (
    <Lab title="Forward diffusion: adding noise" hint="x_t = √ᾱ_t · x₀ + √(1 − ᾱ_t) · ε. Training picks a random t, makes x_t in one jump like this, and teaches the network to predict ε. Generation runs it backwards, one small step at a time.">
      <div className="flex flex-wrap gap-4">
        {[["Clean image x₀", FACE.map((r) => r.map((v) => px(v)))], [`Noisy x_t at t = ${t}`, FACE.map((r, y) => r.map((v, x) => px(sig * v + nz * NOISE[y][x])))], ["Noise ε", NOISE.map((r) => r.map((v) => px(v)))]].map(([label, rows]) => (
          <div key={label as string} className="grid gap-1"><span className="t-eyebrow text-[12px]">{label as string}</span><Grid cell={9} label={label as string} rows={rows as { v: null; bg: string }[][]} /></div>
        ))}
      </div>
      <Slider label="timestep t" value={t} min={0} max={STEPS - 1} onChange={setT} />
      <div className="grid grid-cols-2 gap-2 text-[13px]">
        <div className="tile"><div className="text-muted">signal kept √ᾱ</div><div className="num text-[16px] font-semibold">{sig.toFixed(3)}</div></div>
        <div className="tile"><div className="text-muted">noise weight √(1−ᾱ)</div><div className="num text-[16px] font-semibold">{nz.toFixed(3)}</div></div>
      </div>
    </Lab>
  );
}

/* ---------- self-attention ---------- */
const TOKENS = ["The", "cat", "sat", "on", "the", "mat"];
const EMB = [[1, 0, 0, 0.2], [0, 1, 0.3, 0], [0.1, 0.8, 1, 0], [0.2, 0, 0.6, 0.9], [1, 0, 0, 0.3], [0, 0.7, 0.2, 0.9]];
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

export function AttentionLab() {
  const [q, setQ] = useState(2), [causal, setCausal] = useState(true), [scaled, setScaled] = useState(true);
  // pretend d = 64: raw dot products are about √64 = 8 times bigger than the scaled ones
  const W = useMemo(() => TOKENS.map((_, i) => softmax(TOKENS.map((_, j) => (causal && j > i ? -Infinity : dot(EMB[i], EMB[j]) * (scaled ? 1.6 : 12.8))))), [causal, scaled]);
  const row = W[q], top = row.map((w, j) => [w, j]).sort((a, b) => b[0] - a[0]).slice(0, 3);
  return (
    <Lab title="Who does each word attend to?" hint="Pick a query word. Its row of the attention matrix says how much of every other word's value vector it mixes in. Turn off the √d scaling to see softmax collapse onto one word.">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Query word">
        {TOKENS.map((t, i) => <button key={i} type="button" className="chip" aria-pressed={q === i} onClick={() => setQ(i)}>{t}</button>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Seg<"on" | "off"> label="Causal mask" value={causal ? "on" : "off"} onChange={(v) => setCausal(v === "on")} options={[["on", "Causal (GPT)"], ["off", "Bidirectional (BERT)"]]} />
        <Seg<"on" | "off"> label="Scaling" value={scaled ? "on" : "off"} onChange={(v) => setScaled(v === "on")} options={[["on", "÷ √d"], ["off", "No scaling"]]} />
      </div>
      <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="overflow-x-auto">
          <table className="gx-heat" aria-label="Attention weights: rows are queries, columns are keys">
            <thead><tr><th /><>{TOKENS.map((t, j) => <th key={j} scope="col">{t}</th>)}</></tr></thead>
            <tbody>{W.map((r, i) => (
              <tr key={i} data-on={i === q || undefined}><th scope="row">{TOKENS[i]}</th>{r.map((w, j) => <td key={j} className="num" style={{ background: tint(w * 40) }}>{Math.round(w * 100)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
        <div className="grid content-start gap-1.5">
          {row.map((w, j) => (
            <div key={j} className="grid grid-cols-[44px_minmax(0,1fr)_40px] items-center gap-2 text-[13px]">
              <span className="font-medium">{TOKENS[j]}</span>
              <div className="h-3 overflow-hidden rounded-full bg-surface-2"><motion.div className="h-full origin-left rounded-full bg-accent" initial={false} animate={{ scaleX: w }} transition={spring} /></div>
              <span className="num text-right">{Math.round(w * 100)}%</span>
            </div>
          ))}
          <p className="mt-1 text-[13px] text-muted">output(“{TOKENS[q]}”) ≈ {top.filter(([w]) => w > 0.005).map(([w, j]) => `${w.toFixed(2)}·v(${TOKENS[j]})`).join(" + ")}</p>
        </div>
      </div>
    </Lab>
  );
}

/* ---------- temperature, top-k, top-p ---------- */
const NEXT: [string, number][] = [["mat", 3.2], ["floor", 2.6], ["sofa", 2.2], ["roof", 1.4], ["chair", 1.3], ["moon", 0.2], ["piano", -0.5], ["banana", -1.2]];

export function SamplingLab() {
  const [temp, setTemp] = useState(1), [k, setK] = useState(8), [p, setP] = useState(1);
  const [counts, setCounts] = useState<number[] | null>(null);
  const probs = softmax(NEXT.map(([, l]) => l / temp));
  let cum = 0;
  const keep = probs.map((pr, i) => { const ok = i < k && cum < p; cum += pr; return ok; });
  const z = probs.reduce((s, pr, i) => s + (keep[i] ? pr : 0), 0), final = probs.map((pr, i) => (keep[i] ? pr / z : 0));
  useEffect(() => setCounts(null), [temp, k, p]);
  const draw = () => { const c = NEXT.map(() => 0); for (let n = 0; n < 100; n++) { let r = Math.random(), i = 0; while (r > final[i] && i < final.length - 1) { r -= final[i]; i++; } c[i]++; } setCounts(c); };
  return (
    <Lab title="Temperature, top-k and top-p" hint="The model gives a score (logit) to every next token after “The cat sat on the”. Temperature reshapes the probabilities, then top-k and top-p cut the tail before sampling.">
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="temperature" value={temp} min={0.1} max={2} step={0.05} onChange={setTemp} show={temp.toFixed(2)} />
        <Slider label="top-k" value={k} min={1} max={8} onChange={setK} />
        <Slider label="top-p" value={p} min={0.1} max={1} step={0.05} onChange={setP} show={p.toFixed(2)} />
      </div>
      <div className="grid gap-1.5">
        {NEXT.map(([t], i) => (
          <div key={t} className={`grid grid-cols-[56px_minmax(0,1fr)_88px] items-center gap-2 text-[13px] transition-opacity ${keep[i] ? "" : "opacity-45"}`}>
            <span className="font-medium">{t}</span>
            <div className="relative h-4 overflow-hidden rounded-full bg-surface-2">
              <motion.div className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-line-strong" initial={false} animate={{ scaleX: probs[i] }} transition={spring} />
              <motion.div className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-accent" initial={false} animate={{ scaleX: final[i] }} transition={spring} />
            </div>
            <span className="num text-right">{keep[i] ? `${(final[i] * 100).toFixed(1)}%` : "cut"}{counts && <span className="text-muted"> · {counts[i]}</span>}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm btn-primary" onClick={draw}>Sample 100 times</button>
        <span className="text-[13px] text-muted">Grey bar: probability after temperature. Blue: after cutting and renormalising. Counts show how often each word was picked.</span>
      </div>
    </Lab>
  );
}

/* ---------- BPE ---------- */
type Word = { w: string; n: number; toks: { s: string; at: number }[] };
function bpe(text: string, maxMerges = 12) {
  const freq = new Map<string, number>();
  for (const w of text.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 12)) freq.set(w, (freq.get(w) ?? 0) + 1);
  let words: Word[] = [...freq].map(([w, n]) => ({ w, n, toks: [...w + "_"].map((s, at) => ({ s, at })) }));
  const frames = [{ words, merge: "" }];
  for (let m = 0; m < maxMerges; m++) {
    const pairs = new Map<string, number>();
    for (const { n, toks } of words) for (let i = 0; i + 1 < toks.length; i++) { const key = toks[i].s + "\u0000" + toks[i + 1].s; pairs.set(key, (pairs.get(key) ?? 0) + n); }
    let best = "", bestN = 1;
    for (const [key, n] of pairs) if (n > bestN) { best = key; bestN = n; }
    if (!best) break;
    const [a, b] = best.split("\u0000");
    words = words.map((wd) => {
      const toks: Word["toks"] = [];
      for (let i = 0; i < wd.toks.length; i++) {
        if (i + 1 < wd.toks.length && wd.toks[i].s === a && wd.toks[i + 1].s === b) { toks.push({ s: a + b, at: wd.toks[i].at }); i++; } else toks.push(wd.toks[i]);
      }
      return { ...wd, toks };
    });
    frames.push({ words, merge: `${a} + ${b} → ${a + b}  (seen ${bestN}×)` });
  }
  return frames;
}

export function BpeLab() {
  const [text, setText] = useState("low lower lowest slow slower newest widest");
  const frames = useMemo(() => bpe(text), [text]);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [text]);
  const f = frames[Math.min(i, frames.length - 1)];
  const total = f.words.reduce((s, w) => s + w.n * w.toks.length, 0);
  return (
    <Lab title="Byte-pair encoding, merge by merge" hint="BPE starts from single characters (_ marks a word end) and keeps merging the most frequent neighbouring pair. Frequent words end up as one token; rare words stay split into pieces.">
      <label className="grid gap-1 text-[13px]"><span className="text-muted">Training text</span>
        <input className="field" value={text} maxLength={80} onChange={(e) => setText(e.target.value)} /></label>
      <div className="flex flex-wrap gap-3">
        {f.words.map((wd) => (
          <div key={wd.w} className="flex items-center gap-1 rounded-tile border border-line bg-surface px-2 py-1.5">
            <AnimatePresence initial={false} mode="popLayout">
              {wd.toks.map((t) => (
                <motion.span key={t.at} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={spring}
                  className={`num rounded-[6px] px-1.5 py-0.5 text-[13px] font-semibold ${t.s.length > 1 ? "bg-accent text-accent-ink" : "bg-surface-2"}`}>{t.s}</motion.span>
              ))}
            </AnimatePresence>
            {wd.n > 1 && <span className="ml-1 text-[11px] text-muted">×{wd.n}</span>}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}>Back</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setI((v) => Math.min(frames.length - 1, v + 1))} disabled={i >= frames.length - 1}>Next merge</button>
        <span className="num text-[13px]" role="status">merge {i} of {frames.length - 1} · {total} tokens{f.merge && <span className="text-muted"> · {f.merge}</span>}</span>
      </div>
    </Lab>
  );
}
