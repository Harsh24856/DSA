// Stage 0 (Python for AI): animated walk-throughs. Client-safe: imports only flow types and s0.calc.ts. Every number shown is computed here.
import type { Flow, GridTable } from "../../other/flows.ts";
import { add, bcast2, broadcastAxes, shapeStr } from "./s0.calc.ts";

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

export const FLOWS_0: Record<string, Flow> = {
  "s0-broadcast": broadcast(),
};
