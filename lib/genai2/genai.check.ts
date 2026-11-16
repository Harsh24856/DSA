// Run: npm run check:genai. Asserts the Gen AI roadmap and every module's rules.
import assert from "node:assert/strict";
import { entry, FIGURE_IDS, mcqOptions, MODULES, moduleKey, nextUp, STAGES, withNeeds } from "./index.ts";
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

// module rules
const VISUAL = new Set(["flow", "play", "lab", "figure", "mermaid"]);
for (const [id, m] of Object.entries(MODULES)) {
  assert.equal(entry(id)?.built, true, `${id} is built`);
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
// every block kind is plain data, and every figure id is registered
const fixture: Block[] = [
  { kind: "flow", id: "a" }, { kind: "play", id: "b" }, { kind: "lab", id: "attention" as never }, { kind: "figure", id: "f", caption: "c" },
  { kind: "mermaid", src: "flowchart TB\nA-->B", caption: "c" }, { kind: "text", md: "t" }, { kind: "compare", head: ["a"], rows: [["b"]] },
  { kind: "code", src: "x", run: true }, { kind: "predict", q: "q", answer: "a", wrong: ["b", "c"], why: "w" },
];
assert.deepEqual(JSON.parse(JSON.stringify(fixture)), fixture);
for (const m of Object.values(MODULES)) for (const b of m.blocks) if (b.kind === "figure") assert.ok(FIGURE_IDS.includes(b.id), `figure ${b.id} is registered`);

console.log(`genai ok: ${STAGES.length} stages, ${ids.length} modules, ${Object.keys(MODULES).length} built`);
