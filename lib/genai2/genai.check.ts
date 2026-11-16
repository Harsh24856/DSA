// Run: npm run check:genai. Asserts the Gen AI roadmap and every module's rules.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FLOWS } from "../other/flows.ts";
import { knobDefaults, PLAY_FLOWS, PlayError } from "../other/flows-play.ts";
import { entry, FIGURE_IDS, mcqOptions, MODULES, seededRng, moduleKey, nextUp, STAGES, withNeeds } from "./index.ts";
import type { Block, Stage } from "./types.ts";

const mulberry32 = (a: number) => () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// stages and ids
assert.equal(STAGES.length, 11);
STAGES.forEach((s, i) => assert.equal(s.n, i));
const OLD = ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "start", "interview", "design", "glossary", "resources"];
const ids = STAGES.flatMap(s => s.modules.map(m => m.id));
assert.equal(new Set(ids).size, ids.length, "module ids are unique");
for (const id of ids) assert.ok(!OLD.includes(id), `${id} clashes with an old page id`);

// next up
assert.equal(nextUp({}), STAGES[0].modules[0].id);
assert.equal(nextUp(Object.fromEntries(ids.map(id => [moduleKey(id), true]))), undefined);

// needs must point backwards
const mk = (id: string, needs: string[]) => ({ id, title: id, needs, built: false });
const bad: Stage[] = [
  { n: 0, title: "x", blurb: "x", builds: [], modules: [mk("b", ["a"])] },
  { n: 1, title: "y", blurb: "y", builds: [0], modules: [mk("a", [])] },
];
assert.throws(() => withNeeds(bad), /b needs a, which comes later/);

// answer shuffling
const q = { answer: "right", wrong: ["w1", "w2", "w3"] };
for (let i = 1; i <= 20; i++) {
  const o = mcqOptions(q, mulberry32(i));
  assert.equal(o.length, 4);
  assert.equal(o.filter(x => x === q.answer).length, 1);
}

const order = (s: string) => mcqOptions(q, seededRng(s)).join();
assert.equal(order("m:q1"), order("m:q1"), "same seed, same order");
assert.ok(Array.from({ length: 20 }, (_, i) => order("m:q" + i)).some(o => o !== order("m:q0")), "seeds differ");

// module rules
const VISUAL = new Set(["flow", "play", "lab", "figure", "mermaid"]);
assert.ok(MODULES["self-attention"], "the gold-standard module self-attention is registered");
const tmp = mkdtempSync(join(tmpdir(), "genai-check-"));
const python = (code: string) => { const f = join(tmp, "q.py"); writeFileSync(f, code); return execFileSync("python3", ["-I", f], { encoding: "utf8" }).trim(); };
let rnd = 11;
const rand = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
try {
for (const [id, m] of Object.entries(MODULES)) {
  assert.equal(entry(id)?.built, true, `${id} is built`);
  assert.equal(m.id, id, `${id}: id matches its key`);
  assert.equal(m.stage, STAGES.find(s => s.modules.some(e => e.id === id))?.n, `${id}: stage matches the roadmap`);
  for (const q of m.questions) if (q.kind === "output") {
    assert.ok(q.code, `${id}/${q.id}: output question needs code`);
    assert.equal(python(q.code), q.answer, `${id}/${q.id}: code prints the answer`);
  }
  for (const b of m.blocks) {
    if (b.kind === "code" && b.run) python(b.src);
    if (b.kind === "flow") assert.ok(FLOWS[b.id], `${id}: unknown flow ${b.id}`);
    if (b.kind === "play") {
      const pf = PLAY_FLOWS[b.id];
      assert.ok(pf, `${id}: unknown walk-through ${b.id}`);
      assert.ok(pf.make(knobDefaults(pf)).steps.length >= 2, `${b.id} works at its defaults`);
      let good = 0;
      for (let i = 0; i < 150; i++) {
        const v = Object.fromEntries(pf.knobs.map(k => { const st = k.step ?? 1, n = Math.floor((k.max - k.min) / st); return [k.key, +(k.min + Math.floor(rand() * (n + 1)) * st).toFixed(6)]; }));
        let f;
        try { f = pf.make(v); } catch (e) { if (!(e instanceof PlayError)) throw e; continue; }
        // JSON turns NaN and Infinity into null, so look for null (and a stray undefined in the text)
        assert.ok(f.steps.length >= 2 && !/NaN|(?<!is )undefined|Infinity|[:,[]null/.test(JSON.stringify(f)), `${b.id} at ${JSON.stringify(v)} has a bad value`);
        good++;
      }
      assert.ok(good >= 50, `${b.id}: only ${good} of 150 random settings work`);
    }
  }
  const visual = m.blocks.filter(b => VISUAL.has(b.kind)).length;
  const text = m.blocks.filter(b => b.kind === "text").length;
  assert.ok(visual >= 3, `${id}: at least 3 visual blocks`);
  assert.ok(visual > text, `${id}: visual blocks outnumber text blocks`);
  for (const b of m.blocks) if (b.kind === "text") assert.ok(b.md.split(/\s+/).length <= 80, `${id}: text block over 80 words`);
  assert.ok(m.questions.length >= 12 && m.questions.length <= 20, `${id}: 12 to 20 questions`);
  const kinds = new Set(m.questions.map(x => x.kind));
  for (const k of ["concept", "explain", "trap"]) assert.ok(kinds.has(k as never), `${id}: has a ${k} question`);
  assert.ok(kinds.has("numeric") || kinds.has("output"), `${id}: has a numeric or output question`);
  const qids = m.questions.map(x => x.id);
  assert.equal(new Set(qids).size, qids.length, `${id}: question ids unique`);
  const mcqs = [...m.questions, ...m.blocks.flatMap(b => (b.kind === "predict" ? [b] : []))];
  for (const x of mcqs) if ("wrong" in x) {
    const opts = [x.answer, ...x.wrong];
    assert.equal(new Set(opts).size, 4, `${id}: 4 distinct options`);
    for (const o of opts) assert.ok(!/of the above/i.test(o), `${id}: no "of the above"`);
  }
}
} finally { rmSync(tmp, { recursive: true, force: true }); }
// every block kind is plain data, and every figure id is registered
const fixture: Block[] = [
  { kind: "flow", id: "a" }, { kind: "play", id: "b" }, { kind: "lab", id: "attention" as never }, { kind: "figure", id: "f", caption: "c" },
  { kind: "mermaid", src: "flowchart TB\nA-->B", caption: "c" }, { kind: "text", md: "t" }, { kind: "compare", head: ["a"], rows: [["b"]] },
  { kind: "code", src: "x", run: true }, { kind: "predict", q: "q", answer: "a", wrong: ["b", "c"], why: "w" },
];
assert.deepEqual(JSON.parse(JSON.stringify(fixture)), fixture);
// FIGURES (a .tsx file Node cannot import) must have exactly the ids in FIGURE_IDS
const figSrc = readFileSync(join(import.meta.dirname, "../../components/genai2/figures/index.tsx"), "utf8");
const figKeys = [...(figSrc.match(/FIGURES\b[^\n]*>\s*=\s*\{([^}]*)\}/)?.[1] ?? "").matchAll(/(\w+)\s*:/g)].map(x => x[1]);
assert.deepEqual(figKeys.sort(), [...FIGURE_IDS].sort(), "FIGURES keys equal FIGURE_IDS");
for (const m of Object.values(MODULES)) for (const b of m.blocks) if (b.kind === "figure") assert.ok((FIGURE_IDS as readonly string[]).includes(b.id), `figure ${b.id} is registered`);

console.log(`genai ok: ${STAGES.length} stages, ${ids.length} modules, ${Object.keys(MODULES).length} built`);
