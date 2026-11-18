// Stage 0 (Python for AI): animated walk-throughs. Client-safe: imports only flow types and s0.calc.ts. Every number shown is computed here.
import type { Flow, GridTable } from "../../other/flows.ts";
import { add, bcast2, broadcastAxes, cell, credits, fmt, groupBy, LOG, mergeRows, nanMean, PRICES, type Req, shapeStr, sorted } from "./s0.calc.ts";

// Arrays and broadcasting: the right-aligned rule, a failure, and the fix with None.
function broadcast(): Flow {
  const A = [[1, 2, 3], [4, 5, 6]], b = [10, 20, 30], c = [100, 200];
  const sa = [2, 3], sb = [3], sc = [2], sc2 = [2, 1];
  const AB = bcast2(A, [b], add)!, AC = bcast2(A, c.map((x) => [x]), add)!;
  if (bcast2(A, [c], add) !== null) throw new Error("(2, 3) + (2,) should not broadcast");
  const align = (pairs: [string, number[]][], tones?: GridTable["tones"]): GridTable => {
    const n = Math.max(...pairs.map(([, s]) => s.length)), ax = broadcastAxes(pairs[0][1], pairs[1][1]);
    return { label: "shapes, right-aligned", head: ["", ...Array.from({ length: n }, (_, i) => `axis ${i - n}`)],
      rows: [...pairs.map(([name, s]) => [name, ...Array.from({ length: n }, (_, i) => s[s.length - n + i] ?? "-")]), ["result", ...ax.map((x) => x.out ?? "clash")]], tones };
  };
  return { kind: "grid", title: "The broadcasting rule", steps: [
    { note: `A is ${shapeStr(sa)} and b is ${shapeStr(sb)}. NumPy lines the shapes up from the right, so b's one axis sits under A's last axis.`,
      tables: [{ label: "A", rows: A }, { label: "b", rows: [b] }, align([["A", sa], ["b", sb]], { "0:2": "hot", "1:2": "hot" })] },
    { note: `On each axis the sizes must match, or one must be 1. b has no axis -2, which counts as 1, so its one row is reused for both rows of A.`, tone: "hot",
      tables: [{ label: "b, as A sees it", rows: [b, b], tones: { "1": "hot" } }, align([["A", sa], ["b", sb]], { "2:1": "ok", "2:2": "ok" })] },
    { note: `A + b adds b to every row: the result is ${shapeStr([AB.length, AB[0].length])}.`, tone: "ok", tables: [{ label: "A + b", rows: AB, tones: { "0": "ok", "1": "ok" } }] },
    { note: `Now c = [${c.join(", ")}], one number per row of A. But c is ${shapeStr(sc)}, so it lines up with A's last axis: ${sa[1]} against ${sc[0]}. Neither is 1, so NumPy raises a ValueError.`, tone: "bad",
      tables: [align([["A", sa], ["c", sc]], { "2:2": "bad" })] },
    { note: `c[:, None] has shape ${shapeStr(sc2)}: a column. Now axis -2 matches (${sa[0]} and ${sc2[0]}) and axis -1 has a 1, so c is reused across each row.`, tone: "ok",
      tables: [align([["A", sa], ["c[:, None]", sc2]], { "2:1": "ok", "2:2": "ok" }), { label: "A + c[:, None]", rows: AC, tones: { "0": "ok", "1": "ok" } }] },
  ] };
}

// Data with pandas: load, spot the gap, filter with a mask, derive a column, then one row per model.
function cleanLog(): Flow {
  const head = ["id", "model", "tok", "ms", "ok"], row = (r: Req) => [r.id, r.model, r.tok, cell(r.ms), r.ok ? "True" : "False"];
  const miss = LOG.findIndex((r) => r.ms === null), kept = LOG.filter((r) => r.ok), dropped = LOG.length - kept.length;
  const rate = (r: Req) => (r.ms === null ? null : r.tok / (r.ms / 1000));
  const g = sorted(groupBy(kept, (r) => r.model));
  if (g.some(([, rs]) => nanMean(rs.map((r) => r.ms)) === null)) throw new Error("every model needs one recorded latency");
  const missKept = kept.findIndex((r) => r.ms === null);
  return { kind: "grid", title: "Cleaning a request log", steps: [
    { note: `A log of ${LOG.length} model calls: tokens produced, latency in ms, and whether the call succeeded. Each column is one typed array.`,
      tables: [{ head, rows: LOG.map(row) }] },
    { note: `df.isna().sum() counts the gaps: ${LOG.filter((r) => r.ms === null).length} latency was never recorded. pandas stores the gap as nan, a float, so ms is a float column.`, tone: "warn",
      tables: [{ head, rows: LOG.map(row), tones: { [`${miss}:3`]: "warn" } }] },
    { note: `df[df["ok"]] keeps the rows where the mask is True. ${dropped} failed calls go; ${kept.length} rows stay, and their old index labels come with them.`, tone: "hot",
      tables: [{ head, rows: kept.map(row), tones: { ":4": "ok" } }] },
    { note: `df["tok_s"] = df["tok"] / (df["ms"] / 1000) divides whole columns at once. Arithmetic with a gap gives a gap, so it spreads to the new column.`,
      tables: [{ head: ["id", "tok", "ms", "tok_s"], rows: kept.map((r) => [r.id, r.tok, cell(r.ms), cell(rate(r), (v) => String(Math.round(v)))]), tones: { ":3": "hot", [`${missKept}:3`]: "warn" } }] },
    { note: `groupby("model").agg(...) gives one row per model, sorted by name. mean skips the gap: ${g.filter(([, rs]) => rs.some((r) => r.ms === null)).map(([m, rs]) => `${m} averages ${rs.filter((r) => r.ms !== null).length} of its ${rs.length} calls`).join(", ")}, while calls counts every row.`, tone: "ok",
      tables: [{ head: ["model", "calls", "mean ms", "tokens"], rows: g.map(([m, rs]) => [m, rs.length, fmt(nanMean(rs.map((r) => r.ms))!), rs.reduce((t, r) => t + r.tok, 0)]), tones: { ":2": "ok" } }] },
  ] };
}

// Data with pandas: merging a price list onto the log. A missing key leaves a gap; a repeated key multiplies rows.
function mergePrices(): Flow {
  const models = LOG.map((r) => r.model), keys = PRICES.map((p) => p.model);
  const dupe = [...PRICES, { model: PRICES[0].model, per1k: PRICES[0].per1k * 0.8 }];
  const total = (prices: typeof PRICES) => LOG.flatMap((r) => prices.filter((p) => p.model === r.model).map((p) => (r.tok / 1000) * p.per1k)).reduce((a, b) => a + b, 0);
  const priceOf = (m: string) => PRICES.find((p) => p.model === m)?.per1k ?? null;
  const absent = [...new Set(models.filter((m) => !keys.includes(m)))];
  const [nl, ni, nd] = [mergeRows(models, keys, "left"), mergeRows(models, keys, "inner"), mergeRows(models, dupe.map((p) => p.model), "left")];
  return { kind: "grid", title: "Merging a price list onto the log", steps: [
    { note: `The log has ${LOG.length} rows. A second table has a price per 1,000 tokens for ${keys.length} models; ${absent.join(", ")} is not in it.`,
      tables: [{ label: "log", head: ["id", "model", "tok"], rows: LOG.map((r) => [r.id, r.model, r.tok]) }, { label: "prices", head: ["model", "per1k"], rows: PRICES.map((p) => [p.model, p.per1k]) }] },
    { note: `log.merge(prices, on="model", how="left") keeps all ${nl} log rows and adds per1k. The ${absent.join(", ")} row finds no match, so it gets a gap, and so does its cost.`, tone: "warn",
      tables: [{ head: ["id", "model", "per1k", "cost"], rows: LOG.map((r) => [r.id, r.model, cell(priceOf(r.model)), cell(credits(r), fmt)]),
        tones: Object.fromEntries(LOG.flatMap((r, i) => (priceOf(r.model) === null ? [[`${i}:2`, "warn" as const], [`${i}:3`, "warn" as const]] : []))) }] },
    { note: `how="inner" keeps only rows with a match on both sides: ${ni} rows. The total is the same, ${fmt(total(PRICES))}, but the unpriced call is gone, so a count of calls would now be wrong.`, tone: "hot",
      tables: [{ head: ["how", "rows", "total cost"], rows: [["left", nl, fmt(total(PRICES))], ["inner", ni, fmt(total(PRICES))]], tones: { "1:1": "hot" } }] },
    { note: `Now someone adds a second price row for ${dupe[0].model}. Each ${dupe[0].model} call meets both rows, so the merge returns ${nd} rows, not ${LOG.length}, and the total grows from ${fmt(total(PRICES))} to ${fmt(total(dupe))}.`, tone: "bad",
      tables: [{ label: "prices, with a repeat", head: ["model", "per1k"], rows: dupe.map((p) => [p.model, fmt(p.per1k)]), tones: { "0:0": "bad", [`${dupe.length - 1}:0`]: "bad" } },
        { head: ["merge", "rows", "total cost"], rows: [["one price each", nl, fmt(total(PRICES))], ["repeated key", nd, fmt(total(dupe))]], tones: { "1": "bad" } }] },
    { note: `Guard every merge: validate="many_to_one" raises a MergeError when a key repeats on the right, and comparing len(merged) with len(log) catches the rest.`, tone: "ok",
      tables: [{ head: ["guard", "on the repeat"], rows: [['validate="many_to_one"', "MergeError"], ["assert len(m) == len(log)", "AssertionError"]], tones: { ":1": "ok" } }] },
  ] };
}

export const FLOWS_0: Record<string, Flow> = {
  "s0-broadcast": broadcast(),
  "s0-log": cleanLog(),
  "s0-merge": mergePrices(),
};
