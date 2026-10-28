"use client";
// Labs for "how to build and ship": token cost, chunking, vector search, the agent loop, LoRA size, GPU memory.
import { useMemo, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Seg } from "../ui";
import { Lab, Slider, spring, tint } from "./kit";

const money = (v: number) => (v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const big = (n: number) => n.toLocaleString();

/** Bar made of segments; widths spring as the numbers change. Each segment has a visible label, so color is never the only cue. */
function Stack({ parts, max, marker }: { parts: { label: string; value: number; color: string; text: string }[]; max: number; marker?: { at: number; label: string } }) {
  return (
    <div className="grid gap-2">
      <div className="relative flex h-5 overflow-hidden rounded-full bg-surface-2">
        {parts.map((p) => <motion.div key={p.label} className="h-full" style={{ background: p.color }} initial={false} animate={{ width: `${(p.value / max) * 100}%` }} transition={spring} />)}
        {marker && <motion.div className="absolute inset-y-0 w-0.5 bg-ink" initial={false} animate={{ left: `${(marker.at / max) * 100}%` }} transition={spring} aria-hidden />}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
        {parts.map((p) => <span key={p.label} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden />{p.label}: <b className="num">{p.text}</b></span>)}
        {marker && <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-ink" aria-hidden />{marker.label}</span>}
      </div>
    </div>
  );
}

/* ---------- cost per request ---------- */
const REQS = [100, 300, 1000, 3000, 10000, 30000, 100000, 300000, 1000000];

export function CostLab() {
  const [inTok, setIn] = useState(4000), [outTok, setOut] = useState(500), [cached, setCached] = useState(60), [ri, setRi] = useState(4);
  const [pin, setPin] = useState(3), [pout, setPout] = useState(15);
  const c = cached / 100, perDay = REQS[ri];
  const parts = [inTok * (1 - c) * pin, inTok * c * pin * 0.1, outTok * pout].map((v) => v / 1e6);
  const req = parts.reduce((a, b) => a + b, 0);
  return (
    <Lab title="What does one request cost?" hint="Prices are per million tokens and differ by provider and model; the defaults are only an example. Cached input is billed at about a tenth of the normal input price.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="input tokens per request" value={inTok} min={100} max={50000} step={100} onChange={setIn} show={big(inTok)} />
        <Slider label="output tokens per request" value={outTok} min={50} max={4000} step={50} onChange={setOut} show={big(outTok)} />
        <Slider label="share of input served from cache" value={cached} min={0} max={90} step={5} onChange={setCached} show={`${cached}%`} />
        <Slider label="requests per day" value={ri} min={0} max={REQS.length - 1} onChange={setRi} show={big(perDay)} />
        <label className="grid gap-1 text-[13px]"><span className="text-muted">input price, $ per 1M tokens</span><input className="field field-sm num" type="number" min={0} step={0.1} value={pin} onChange={(e) => setPin(Math.max(0, +e.target.value))} /></label>
        <label className="grid gap-1 text-[13px]"><span className="text-muted">output price, $ per 1M tokens</span><input className="field field-sm num" type="number" min={0} step={0.1} value={pout} onChange={(e) => setPout(Math.max(0, +e.target.value))} /></label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["per request", req], ["per day", req * perDay], ["per 30 days", req * perDay * 30]].map(([l, v]) => (
          <div key={l as string} className="tile"><div className="text-[12px] text-muted">{l}</div><div className="num text-[16px] font-semibold">{money(v as number)}</div></div>
        ))}
      </div>
      <Stack max={req || 1} parts={[
        { label: "fresh input", value: parts[0], color: "var(--accent)", text: money(parts[0]) },
        { label: "cached input", value: parts[1], color: tint(45), text: money(parts[1]) },
        { label: "output", value: parts[2], color: "var(--medium)", text: money(parts[2]) },
      ]} />
    </Lab>
  );
}

/* ---------- chunking ---------- */
const DOC = "To reset your password, open Settings and choose Security. Select Reset password and enter the code we send to your email. Codes expire after ten minutes, so request a new one if it stops working. If you no longer have access to that email, contact support with your account ID and a photo of your ID card. Support replies within two working days. For your safety we never ask for your password by email or chat. After a reset, every device is signed out and you need to sign in again. Two-factor login stays on, and your saved payment methods are not changed. You can review recent sign-ins under Security at any time.";
const WORDS = DOC.split(" ");

export function ChunkLab() {
  const [size, setSize] = useState(30), [overlap, setOverlap] = useState(5);
  const ov = Math.min(overlap, size - 1), stride = size - ov;
  const chunks: [number, number][] = [];
  for (let s = 0; s < WORDS.length; s += stride) { chunks.push([s, Math.min(WORDS.length, s + size)]); if (s + size >= WORDS.length) break; }
  return (
    <Lab title="Chunk size and overlap" hint="Retrieval returns whole chunks. Too small and a chunk loses its context; too big and it drags in unrelated text. Overlap (highlighted) repeats the end of one chunk at the start of the next so a sentence cut in half is still found.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="chunk size (words)" value={size} min={8} max={60} onChange={setSize} />
        <Slider label="overlap (words)" value={ov} min={0} max={20} onChange={setOverlap} />
      </div>
      <p className="num text-[13px]" role="status">{chunks.length} chunks from {WORDS.length} words · {chunks.reduce((s, [a, b]) => s + b - a, 0) - WORDS.length} words stored twice</p>
      <ol className="grid max-h-[300px] gap-2 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {chunks.map(([a, b], i) => (
            <motion.li key={`${a}-${b}`} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="rounded-tile border border-line bg-surface px-3 py-2 text-[13px] leading-relaxed">
              <span className="num mr-2 text-[11px] font-semibold text-accent">#{i + 1}</span>
              {i > 0 && ov > 0 && <mark className="rounded bg-accent-soft px-0.5 text-ink">{WORDS.slice(a, a + ov).join(" ")}</mark>} {WORDS.slice(i > 0 ? a + ov : a, b).join(" ")}
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </Lab>
  );
}

/* ---------- vector search ---------- */
const DOCS: [string, number, number][] = [
  ["Refund policy", 0.82, 0.45], ["Return a damaged item", 0.62, 0.66], ["How long refunds take", 0.95, 0.25],
  ["Shipping times", -0.8, 0.5], ["Track my order", -0.62, 0.72], ["International delivery", -0.95, 0.28],
  ["Reset password", 0.08, -0.92], ["Change email", -0.3, -0.85], ["Two-factor login", 0.35, -0.82],
  ["Update card", 0.88, -0.3], ["Download invoice", 0.7, -0.55],
];
const QUERIES: [string, number, number][] = [["Can I get my money back?", 0.85, 0.42], ["Where is my parcel?", -0.7, 0.6], ["I forgot my login", 0.15, -0.9], ["Wrong charge on my bill", 0.82, -0.4]];
const cos = (ax: number, ay: number, bx: number, by: number) => (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by) || 1);

export function VectorLab() {
  const [qv, setQv] = useState<[string, number, number]>(QUERIES[0]);
  const [k, setK] = useState(3);
  const ranked = useMemo(() => DOCS.map((d, i) => ({ i, s: cos(qv[1], qv[2], d[1], d[2]) })).sort((a, b) => b.s - a.s), [qv]);
  const hits = new Set(ranked.slice(0, k).map((r) => r.i));
  const S = 130, P = (v: number) => v * S;
  const place = (e: MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget, pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    if (Math.hypot(p.x, p.y) > 8) setQv(["your point", p.x / S, -p.y / S]);
  };
  return (
    <Lab title="Search by meaning: cosine similarity" hint="Each document is an embedding; here they are squashed to 2D. The query is embedded the same way and the closest directions win. Pick a question or click anywhere on the map.">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Query">
        {QUERIES.map((qq) => <button key={qq[0]} type="button" className="chip" aria-pressed={qv[0] === qq[0]} onClick={() => setQv(qq)}>{qq[0]}</button>)}
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <svg viewBox="-160 -160 320 320" className="w-full cursor-crosshair rounded-tile bg-surface" onClick={place} role="img" aria-label={`Embedding map. Query: ${qv[0]}. Top ${k}: ${ranked.slice(0, k).map((r) => DOCS[r.i][0]).join(", ")}.`}>
          <circle r={S} fill="none" stroke="var(--line)" />
          <line x1={-150} x2={150} y1={0} y2={0} stroke="var(--line)" /><line y1={-150} y2={150} x1={0} x2={0} stroke="var(--line)" />
          {DOCS.map((d, i) => hits.has(i) && <motion.line key={`l${i}`} x1={0} y1={0} x2={P(d[1])} y2={-P(d[2])} stroke="var(--accent)" strokeOpacity={0.35} strokeWidth={1.5} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />)}
          <motion.line x1={0} y1={0} stroke="var(--hard)" strokeWidth={2} initial={false} animate={{ x2: P(qv[1]), y2: -P(qv[2]) }} transition={spring} />
          {DOCS.map((d, i) => (
            <g key={i}>
              <circle cx={P(d[1])} cy={-P(d[2])} r={hits.has(i) ? 6 : 4} fill={hits.has(i) ? "var(--accent)" : "var(--muted)"} />
              <text x={P(d[1])} y={-P(d[2]) - 9} textAnchor="middle" fontSize={9} fill="var(--ink)">{d[0]}</text>
            </g>
          ))}
          <motion.circle r={7} fill="var(--hard)" stroke="var(--surface)" strokeWidth={2} initial={false} animate={{ cx: P(qv[1]), cy: -P(qv[2]) }} transition={spring} />
        </svg>
        <div className="grid content-start gap-2">
          <Slider label="top-k" value={k} min={1} max={6} onChange={setK} />
          <ol className="grid gap-1 text-[13px]">
            {ranked.map((r, n) => (
              <motion.li key={r.i} layout transition={spring} className={`flex justify-between gap-2 rounded-control px-2 py-1 ${n < k ? "bg-accent-soft font-medium" : "text-muted"}`}>
                <span>{n + 1}. {DOCS[r.i][0]}</span><span className="num">{r.s.toFixed(2)}</span>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </Lab>
  );
}

/* ---------- the agent loop ---------- */
const TURNS: { who: "User" | "Model" | "Your code"; body: string; note: string }[] = [
  { who: "User", body: "Is it worth taking an umbrella in Paris today?", note: "You send the message plus the list of tools the model may use (name, description, JSON schema of the inputs)." },
  { who: "Model", body: 'tool_use: get_weather({"city": "Paris"})\nstop_reason: "tool_use"', note: "The model does not run anything. It answers with a request to call a tool and stops." },
  { who: "Your code", body: 'tool_result: {"temp_c": 14, "rain_chance": 0.7}', note: "Your loop sees stop_reason = tool_use, runs the real function, and appends the result as a new message." },
  { who: "Model", body: 'tool_use: get_hourly({"city": "Paris", "hours": 6})\nstop_reason: "tool_use"', note: "With the new information it may ask for another tool. The loop repeats; cap the number of rounds." },
  { who: "Your code", body: 'tool_result: {"rain_from": "15:00", "until": "19:00"}', note: "Again: run it, append it, call the model with the whole conversation." },
  { who: "Model", body: 'Yes. 70% chance of rain from 15:00 to 19:00, 14°C. Take the umbrella.\nstop_reason: "end_turn"', note: "stop_reason = end_turn means a final answer, so the loop ends and you show it to the user." },
];

export function AgentLab() {
  const [n, setN] = useState(1);
  return (
    <Lab title="Step through one agent loop" hint="An agent is just this loop: call the model, run whatever tools it asks for, append the results, call again, until it stops asking.">
      <ol className="grid gap-2">
        <AnimatePresence initial={false}>
          {TURNS.slice(0, n).map((t, i) => (
            <motion.li key={i} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: i === n - 1 ? 1 : 0.6, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`grid gap-1 rounded-tile border px-3 py-2 ${i === n - 1 ? "border-accent bg-surface" : "border-line bg-surface"}`}>
              <span className={`pill w-fit ${t.who === "Model" ? "pill-accent" : "pill-muted"}`}>{t.who}</span>
              <pre className="num whitespace-pre-wrap text-[12.5px]">{t.body}</pre>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
      <p className="callout text-[13px]" role="status">{TURNS[n - 1].note}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={() => setN((v) => Math.max(1, v - 1))} disabled={n === 1}>Back</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setN((v) => Math.min(TURNS.length, v + 1))} disabled={n === TURNS.length}>Next step</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setN(1)}>Restart</button>
      </div>
    </Lab>
  );
}

/* ---------- LoRA ---------- */
const RANKS = [1, 2, 4, 8, 16, 32, 64, 128];

export function LoraLab() {
  const [d, setD] = useState(4096), [ri, setRi] = useState(4);
  const r = RANKS[ri], full = d * d, lora = 2 * d * r, model = lora * 32 * 4;
  const box = 150, thin = Math.max(3, (r / d) * box);
  return (
    <Lab title="Why LoRA is so small" hint="Instead of updating the d × d weight W, LoRA freezes it and trains B (d × r) and A (r × d). Their product B·A has the same shape as W but only 2·d·r numbers.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="layer width d" value={d} min={512} max={8192} step={512} onChange={setD} show={big(d)} />
        <Slider label="rank r" value={ri} min={0} max={RANKS.length - 1} onChange={setRi} show={String(r)} />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[12px]" aria-hidden>
        <div className="grid justify-items-center gap-1"><div className="rounded-[6px] border border-line-strong" style={{ width: box, height: box, background: tint(18, "var(--muted)") }} /><span>W, frozen</span></div>
        <span className="text-[20px] text-muted">+</span>
        <div className="grid justify-items-center gap-1"><motion.div className="rounded-[3px] bg-accent" style={{ height: box }} initial={false} animate={{ width: thin }} transition={spring} /><span>B</span></div>
        <span className="text-[16px] text-muted">×</span>
        <div className="grid justify-items-center gap-1"><motion.div className="rounded-[3px] bg-accent" style={{ width: box }} initial={false} animate={{ height: thin }} transition={spring} /><span>A</span></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="tile"><div className="text-[12px] text-muted">full update</div><div className="num text-[15px] font-semibold">{big(full)}</div></div>
        <div className="tile"><div className="text-[12px] text-muted">LoRA, one layer</div><div className="num text-[15px] font-semibold">{big(lora)} ({((lora / full) * 100).toFixed(2)}%)</div></div>
        <div className="tile"><div className="text-[12px] text-muted">32 layers × q,k,v,o</div><div className="num text-[15px] font-semibold">{(model / 1e6).toFixed(1)}M · {((model * 2) / 1e6).toFixed(0)} MB</div></div>
      </div>
    </Lab>
  );
}

/* ---------- GPU memory ---------- */
const MODELS: [string, number, number, number, number][] = [["8B", 8, 32, 8, 128], ["14B", 14, 40, 8, 128], ["32B", 32, 64, 8, 128], ["70B", 70, 80, 8, 128]];
const CTX = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];
type Prec = "2" | "1" | "0.5";

export function MemoryLab() {
  const [mi, setMi] = useState("0"), [prec, setPrec] = useState<Prec>("2"), [ci, setCi] = useState(3), [users, setUsers] = useState(8), [gpu, setGpu] = useState<"24" | "48" | "80">("80");
  const [, params, layers, kvh, hd] = MODELS[+mi];
  const weights = params * +prec, kv = (2 * layers * kvh * hd * CTX[ci] * users * 2) / 1e9, total = weights + kv, cap = +gpu;
  const fits = total <= cap * 0.9;   // leave ~10% for activations and the runtime
  return (
    <Lab title="Will it fit on the GPU?" hint="Memory = weights + KV cache. Weights depend on size and precision. The KV cache grows with context length × concurrent users and is often the real limit.">
      <div className="flex flex-wrap gap-2">
        <Seg<string> label="Model size" value={mi} onChange={setMi} options={MODELS.map((m, i) => [String(i), m[0]] as const)} />
        <Seg<Prec> label="Weight precision" value={prec} onChange={setPrec} options={[["2", "bf16"], ["1", "int8"], ["0.5", "int4"]]} />
        <Seg<"24" | "48" | "80"> label="GPU memory" value={gpu} onChange={setGpu} options={[["24", "24 GB"], ["48", "48 GB"], ["80", "80 GB"]]} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="context length" value={ci} min={0} max={CTX.length - 1} onChange={setCi} show={`${CTX[ci] / 1024}k tokens`} />
        <Slider label="concurrent users" value={users} min={1} max={64} onChange={setUsers} />
      </div>
      <Stack max={Math.max(total, cap) * 1.05} marker={{ at: cap, label: `${cap} GB GPU` }} parts={[
        { label: "weights", value: weights, color: "var(--accent)", text: `${weights.toFixed(1)} GB` },
        { label: "KV cache", value: kv, color: "var(--medium)", text: `${kv.toFixed(1)} GB` },
      ]} />
      <p className={`rounded-tile px-3 py-2 text-[13px] ${fits ? "bg-accent-soft" : "bg-hard/10 text-hard"}`} role="status">
        {fits ? `Fits: ${total.toFixed(1)} GB of ${cap} GB, about ${(cap - total).toFixed(1)} GB to spare.`
          : `Needs ${total.toFixed(1)} GB. Try int4 weights, a shorter context, fewer users per GPU, or split the model across GPUs (tensor parallelism).`}
      </p>
    </Lab>
  );
}
