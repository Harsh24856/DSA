// Run: npm run check:solutions. Feeds every Python solution to solutions_test.py and checks every visualiser runs.
import { spawnSync } from "node:child_process";
import { SOLUTIONS } from "./index.ts";
import { P } from "../problems.ts";
import { FACTS } from "../landingFacts.ts";
import { PATTERN_PROBLEMS } from "../patterns/problems.ts";

let bad = 0;
for (const [slug, s] of Object.entries(SOLUTIONS)) {
  const d = s.viz();
  const broken = d.frames.find((f) => !f.note || /NaN|undefined|Infinity/.test(f.note));
  if (!d.frames.length || broken) { bad++; console.error("visualiser problem:", slug, broken?.note); }
  // the graph renderer lays nodes out on a 0 to 100 grid; anything else draws off the picture
  if (d.kind === "graph" && d.nodes.some((n) => n.x < 0 || n.x > 100 || n.y < 0 || n.y > 100)) { bad++; console.error("graph node off the picture:", slug); }
  // a visualiser walks the algorithm one decision at a time: Python at least 6 steps, SQL one per clause
  if (d.frames.length < (s.lang === "python" ? 6 : 3)) { bad++; console.error(`too few steps (${d.frames.length}):`, slug); }
}
const py = Object.fromEntries(Object.entries(SOLUTIONS).filter(([, s]) => s.lang === "python").map(([k, s]) => [k, s.code]));
const r = spawnSync("python3", ["-I", new URL("./solutions_test.py", import.meta.url).pathname], { input: JSON.stringify(py), encoding: "utf8" });
process.stdout.write(r.stdout); process.stderr.write(r.stderr);
// every LeetCode question in the plan and the pattern lists must have its own solution, so a skipped batch cannot go unnoticed
const missing = [...new Set([...P.filter((q) => q[0] === "L").map((q) => q[2]), ...Object.values(PATTERN_PROBLEMS).flatMap((t) => Object.values(t).flat().map((q) => q[2]))])].filter((s) => !SOLUTIONS[s]);
if (P.length !== FACTS.problems || P.filter((q) => q[0] === "L").length !== FACTS.leetcode || new Set([...P.filter((q) => q[0] === "L").map((q) => q[2]), ...Object.values(PATTERN_PROBLEMS).flatMap((t) => Object.values(t).flat().map((q) => q[2]))]).size !== FACTS.visualised) { bad++; console.error("lib/landingFacts.ts is out of date"); }
missing.push(...new Set(P.filter((q) => q[0] === "C" && !SOLUTIONS[`cf:${q[5]}`]).map((q) => `cf:${q[5]}`)));
if (missing.length) { bad += missing.length; console.error("no solution for:", missing.join(", ")); }
console.log(`${Object.keys(SOLUTIONS).length} solutions, ${bad} visualiser problems`);
process.exit(bad || r.status ? 1 : 0);
