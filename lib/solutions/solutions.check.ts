// Run: npm run check:solutions. Feeds every Python solution to solutions_test.py and checks every visualiser runs.
import { spawnSync } from "node:child_process";
import { SOLUTIONS } from "./index.ts";

let bad = 0;
for (const [slug, s] of Object.entries(SOLUTIONS)) {
  const d = s.viz();
  const broken = d.frames.find((f) => !f.note || /NaN|undefined|Infinity/.test(f.note));
  if (!d.frames.length || broken) { bad++; console.error("visualiser problem:", slug, broken?.note); }
}
const py = Object.fromEntries(Object.entries(SOLUTIONS).filter(([, s]) => s.lang === "python").map(([k, s]) => [k, s.code]));
const r = spawnSync("python3", ["-I", new URL("./solutions_test.py", import.meta.url).pathname], { input: JSON.stringify(py), encoding: "utf8" });
process.stdout.write(r.stdout); process.stderr.write(r.stderr);
console.log(`${Object.keys(SOLUTIONS).length} solutions, ${bad} visualiser problems`);
process.exit(bad || r.status ? 1 : 0);
