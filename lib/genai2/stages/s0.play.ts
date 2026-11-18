// Stage 0 (Python for AI): slider walk-throughs, placed in modules by a `play` block. Spread by stages/play.ts into PLAY_FLOWS.
import type { Flow, FlowTone } from "../../other/flows.ts";
import type { PlayFlow } from "../../other/flows-play-types.ts";
import { broadcastAxes, broadcastShape, bytesStr, cell, fmt, groupBy, LOG, n0, nanMean, pairBytes, reduceShape, shapeStr, sorted } from "./s0.calc.ts";

// Arrays and broadcasting: reduce one axis of a (B, T, D) array, then subtract the result back from x.
// The subtraction is really carried out, element by element, and compared with the intended answer.
type Nd = { shape: number[]; at: (idx: number[]) => number };
function reduceBack(v: Record<string, number>): Flow {
  const shape = [v.B, v.T, v.D], axis = v.axis, keep = v.keep === 1;
  const x: Nd = { shape, at: ([i, j, k]) => (i * 7 + j * 3 + k * 5) % 10 };
  const mean = (i: number, j: number, k: number) => {   // mean over `axis`, at the position (i, j, k) with that axis ignored
    let t = 0;
    for (let a = 0; a < shape[axis]; a++) { const p = [i, j, k]; p[axis] = a; t += x.at(p); }
    return t / shape[axis];
  };
  const rs = reduceShape(shape, axis, keep);
  // m: the reduced array; its index is mapped back to x's axes (dropping or zeroing `axis`)
  const m: Nd = { shape: rs, at: (idx) => { const p = keep ? [...idx] : [...idx.slice(0, axis), 0, ...idx.slice(axis)]; p[axis] = 0; return mean(p[0], p[1], p[2]); } };
  const out = broadcastShape(shape, rs), ax = broadcastAxes(shape, rs);
  const call = `x.mean(axis=${axis}${keep ? ", keepdims=True" : ""})`;
  const head = ["", ...ax.map((_, i) => `axis ${i - ax.length}`)];
  const alignRows = [["x", ...shape], [keep ? "m (kept)" : "m", ...ax.map((a) => a.b ?? "-")], ["result", ...ax.map((a) => a.out ?? "clash")]];
  const steps: Flow["steps"] = [
    { note: `x has shape ${shapeStr(shape)}: batch, tokens, features. ${call} averages along axis ${axis}, so that axis ${keep ? "shrinks to 1" : "disappears"}: m = ${shapeStr(rs)}.`,
      tables: [{ head: ["array", "shape"], rows: [["x", shapeStr(shape)], [call.replace("x.mean", "m = x.mean"), shapeStr(rs)]], tones: { "1:1": "hot" } }] },
    { note: `x - m lines the shapes up from the right. ${keep ? "With keepdims every axis stays in its place, so each one meets the axis it came from." : axis === 0 ? "The missing axis is the first one, so the rest still sit under the axes they came from." : `Without keepdims, m's axes slide right: the axis that was ${["batch", "tokens", "features"][axis - 1]} now sits under ${["batch", "tokens", "features"][axis]}.`}`,
      tone: out ? "hot" : "bad", tables: [{ label: "x - m, right-aligned", head, rows: alignRows, tones: out ? { "2": "ok" } : Object.fromEntries(ax.flatMap((a, i) => (a.out === null ? [[`2:${i + 1}`, "bad" as const]] : []))) }] },
  ];
  if (!out) {
    steps.push({ note: `Axis ${ax.findIndex((a) => a.out === null) - ax.length}: ${ax.find((a) => a.out === null)!.a} against ${ax.find((a) => a.out === null)!.b}, and neither is 1. NumPy raises a ValueError. keepdims=True fixes it.`, tone: "bad",
      tables: [{ head: ["call", "result"], rows: [[`x - ${call}`, "ValueError"], [`x - x.mean(axis=${axis}, keepdims=True)`, shapeStr(shape)]], tones: { "0:1": "bad", "1:1": "ok" } }] });
    return { kind: "grid", title: `Reduce axis ${axis}, subtract back`, steps };
  }
  // carry the subtraction out with broadcasting, and compare it with the intended x - mean
  if (out.some((s, i) => s !== shape[i])) {
    steps.push({ note: `It broadcasts with no error, but to ${shapeStr(out)}, not x's ${shapeStr(shape)}: a size 1 axis of x was stretched by m. Every later line now works on the wrong array. keepdims=True fixes it.`, tone: "bad",
      tables: [{ head: ["array", "shape"], rows: [["x", shapeStr(shape)], ["x - m", shapeStr(out)]], tones: { "1:1": "bad" } }] });
    return { kind: "grid", title: `Reduce axis ${axis}, subtract back`, steps };
  }
  const pick = (a: Nd, idx: number[]) => a.at(a.shape.map((s, i) => (s === 1 ? 0 : idx[3 - a.shape.length + i])));
  let wrong = 0, total = 0, first: number[] | null = null;
  for (let i = 0; i < shape[0]; i++) for (let j = 0; j < shape[1]; j++) for (let k = 0; k < shape[2]; k++) {
    total++;
    if (Math.abs(pick(x, [i, j, k]) - pick(m, [i, j, k]) - (x.at([i, j, k]) - mean(i, j, k))) > 1e-9) { wrong++; first ??= [i, j, k]; }
  }
  steps.push({
    note: wrong === 0 ? `It broadcasts to ${shapeStr(out)} and every one of the ${total} entries is x minus its own mean.`
      : `It broadcasts to ${shapeStr(out)} with no error, yet ${wrong} of ${total} entries subtract the wrong mean, the first at index ${shapeStr(first!)}. A silent bug: keepdims=True fixes it.`,
    tone: wrong === 0 ? "ok" : "bad",
    tables: [{ head: ["check", "value"], rows: [["result shape", shapeStr(out)], ["entries", total], ["wrong entries", wrong], ["share wrong", `${fmt((100 * wrong) / total)}%`]],
      tones: { "2:1": wrong === 0 ? "ok" : "bad" } }],
  });
  return { kind: "grid", title: `Reduce axis ${axis}, subtract back`, steps };
}

// Data with pandas: a latency filter before a groupby. A gap never passes a comparison, and a group with no rows left disappears.
function latencyFilter(v: Record<string, number>): Flow {
  const { cut, failed } = v, withFailed = failed === 1;
  const pool = withFailed ? LOG : LOG.filter((r) => r.ok);
  const kept = pool.filter((r) => r.ms !== null && r.ms <= cut), gaps = pool.filter((r) => r.ms === null).length;
  const mask = withFailed ? `df["ms"] <= ${cut}` : `(df["ms"] <= ${cut}) & df["ok"]`;
  const all = sorted(groupBy(pool, (r) => r.model)), g = new Map(sorted(groupBy(kept, (r) => r.model)));
  const gone = all.filter(([m]) => !g.has(m)).map(([m]) => m);
  return { kind: "grid", title: `Calls at or under ${cut} ms`, steps: [
    { note: `The mask ${mask} keeps ${kept.length} of ${LOG.length} rows.${gaps ? ` The row with no latency is dropped too: comparing a gap with <= gives False.` : ""}`, tone: "hot",
      tables: [{ head: ["id", "model", "ms", "kept"], rows: LOG.map((r) => [r.id, r.model, cell(r.ms), kept.includes(r) ? "True" : "False"]),
        tones: Object.fromEntries(LOG.flatMap((r, i): [string, FlowTone][] => (kept.includes(r) ? [[`${i}:3`, "ok"]] : r.ms === null && pool.includes(r) ? [[`${i}:2`, "warn"]] : []))) }] },
    { note: gone.length ? `groupby("model") only sees the rows that survived. ${gone.join(" and ")} ${gone.length > 1 ? "have" : "has"} none left, so ${gone.length > 1 ? "they are" : "it is"} missing from the result, not shown as 0.`
      : `groupby("model") only sees the rows that survived. Every model still has at least one, so each keeps its row.`, tone: gone.length ? "warn" : "ok",
      tables: [{ head: ["model", "calls", "mean ms"], rows: [...g.entries()].map(([m, rs]) => [m, rs.length, fmt(nanMean(rs.map((r) => r.ms))!)]) },
        ...(gone.length ? [{ label: "not in the result", rows: gone.map((m) => [m]), tones: { ":0": "warn" as const } }] : [])] },
  ] };
}

// Vectorising loops: peak memory of three ways to get every pairwise distance between n and m float32 vectors of width d.
/** A bar label: one decimal, so it fits beside the bar on a phone. */
const short = (b: number) => (b >= 1e9 ? `${Number((b / 1e9).toFixed(1))} GB` : `${Number((b / 1e6).toFixed(1))} MB`);
function pairMemory(v: Record<string, number>): Flow {
  const { n, m, d, c } = v, { cube, trick, out } = pairBytes(n, m, d), rows = Math.min(c, n);
  const chunked = rows * m * d * 4 + out, full = cube + out, chunks = Math.ceil(n / rows);
  const bars = (hot: number) => [
    { label: "full broadcast", value: full, tone: hot === 0 ? "bad" as const : undefined },
    { label: "chunked", value: chunked, tone: hot === 1 ? "warn" as const : undefined },
    { label: "matmul trick", value: trick, tone: hot === 2 ? "ok" as const : undefined },
  ];
  return { kind: "bars", title: `${n0(n)} × ${n0(m)} distances, width ${d}`, format: short, steps: [
    { note: `A[:, None] - B[None] builds ${n0(n)} × ${n0(m)} × ${d} = ${n0(n * m * d)} float32 numbers before it sums them: ${bytesStr(full)} with the result, ${fmt(full / out)} times the ${bytesStr(out)} answer.`, tone: "bad", bars: bars(0) },
    { note: chunks === 1
        ? `A chunk of ${n0(c)} rows already covers all ${n0(n)} rows of A, so chunking saves nothing: the peak is still ${bytesStr(chunked)}. Pick a smaller chunk.`
        : `Loop over A in chunks of ${n0(rows)} rows and broadcast each chunk: ${chunks} Python steps instead of ${n0(n * m * d)}, and the peak drops to ${bytesStr(chunked)}. Bigger chunks mean fewer steps but more memory.`, tone: "warn", bars: bars(1) },
    { note: `|a|² + |b|² - 2 A @ B.T needs only the ${bytesStr(out)} result and two norm vectors: ${bytesStr(trick)}, whatever d is. The matrix multiply does the heavy work.`, tone: "ok", bars: bars(2) },
  ] };
}

export const PLAY_0: Record<string, PlayFlow> = {
  "s0-memory": { title: "Memory of a pairwise distance", make: pairMemory, knobs: [
    { key: "n", label: "rows in A", min: 1000, max: 20000, step: 1000, value: 10000 },
    { key: "m", label: "rows in B", min: 1000, max: 20000, step: 1000, value: 10000 },
    { key: "d", label: "width d", min: 64, max: 1024, step: 64, value: 256 },
    { key: "c", label: "chunk size (rows)", min: 256, max: 4096, step: 256, value: 1024 },
  ] },
  "s0-filter": { title: "Filter, then group", make: latencyFilter, knobs: [
    { key: "cut", label: "latency cut-off", min: 100, max: 2000, step: 50, value: 500, unit: "ms" },
    { key: "failed", label: "keep failed calls (0 = no, 1 = yes)", min: 0, max: 1, value: 0 },
  ] },
  "s0-reduce": { title: "Reduce an axis, then broadcast back", make: reduceBack, knobs: [
    { key: "B", label: "batch B", min: 1, max: 4, value: 2 },
    { key: "T", label: "tokens T", min: 1, max: 4, value: 3 },
    { key: "D", label: "features D", min: 1, max: 4, value: 4 },
    { key: "axis", label: "axis to average", min: 0, max: 2, value: 2 },
    { key: "keep", label: "keepdims (0 = no, 1 = yes)", min: 0, max: 1, value: 0 },
  ] },
};
