// Run: npm run check:genai. Asserts the Gen AI roadmap and every module's rules.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, posix } from "node:path";
import { FLOWS } from "../other/flows.ts";
import { knobDefaults, PLAY_FLOWS, PlayError } from "../other/flows-play.ts";
import { BUILT, entry, FIGURE_IDS, mcqOptions, MODULES, seededRng, moduleKey, nextUp, STAGES, withNeeds } from "./index.ts";
import { LABS } from "./labs/index.ts";
import type { Block, Stage } from "./types.ts";

const mulberry32 = (a: number) => () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// the client-safe core must not reach module text
assert.deepEqual([...BUILT].sort(), Object.keys(MODULES).sort(), "BUILT lists exactly the registered modules");
{
  const clientFiles = readdirSync(new URL("./stages/", import.meta.url)).filter(f => /\.(built|play|flows)\.ts$/.test(f)).map(f => "stages/" + f);
  const seen = new Set<string>(), todo = ["core.ts", ...clientFiles];
  while (todo.length) {
    const f = todo.pop()!;
    if (seen.has(f)) continue;
    seen.add(f);
    if (f.startsWith("../")) continue;   // files outside lib/genai2 (practice.ts, other/) are not scanned
    const src = readFileSync(new URL(f, import.meta.url), "utf8");
    assert.ok(!/\bMODULES\b/.test(src), `${f} mentions MODULES`);
    for (const [, spec] of src.matchAll(/(?:from|import)\s*\(?\s*["'](\.[^"']+)["']/g)) {
      assert.ok(!/(^|\/)index(\.ts)?$|modules\/|(^|\/)modules\.ts$|\/s\d+\.ts$/.test(spec), `${f} imports ${spec}`);
      todo.push(posix.normalize(posix.join(posix.dirname(f), spec)));
    }
  }
  assert.ok(seen.has("roadmap.ts") && seen.has("rng.ts") && seen.has("stages/s4.built.ts"), "scan followed core's imports");
}

// components/genai2/** (figures/sN.tsx, figures/sN/* and lab/* included) never import module or lab content: alias or relative, no bare index, ./modules/, stages/sN.ts or stages/modules.ts
const serverOnly = (from: string, spec: string) => {
  const p = spec.startsWith("@/") ? spec.slice(2) : spec.startsWith(".") ? posix.normalize(posix.join(posix.dirname(from), spec)) : spec;
  return /^lib\/genai2(\/index)?(\.tsx?)?\/?$|^lib\/genai2\/modules\/|^lib\/genai2\/stages\/(s\d+|modules)(\.ts)?$|^lib\/genai2\/labs(\/index|\/transformer)?(\.ts)?\/?$/.test(p);
};
for (const [spec, bad] of [["@/lib/genai2", true], ["@/lib/genai2/index", true], ["@/lib/genai2/modules/s4/self-attention", true], ["@/lib/genai2/stages/s4", true], ["@/lib/genai2/stages/modules.ts", true],
  ["../../../lib/genai2", true], ["../../../lib/genai2/stages/s4.ts", true], ["@/lib/genai2/core", false], ["@/lib/genai2/stages/s4.built", false], ["../../../lib/genai2/stages/s4.play.ts", false], ["@/lib/genai2/rng", false],
  ["@/lib/genai2/labs", true], ["@/lib/genai2/labs/index.ts", true], ["@/lib/genai2/labs/transformer", true], ["../../../lib/genai2/labs/transformer.ts", true], ["@/lib/genai2/labs/harness", false], ["@/lib/genai2/labs/types", false]] as const)
  assert.equal(serverOnly("components/genai2/figures/s4.tsx", spec), bad, `import guard on ${spec}`);
assert.ok(serverOnly("components/genai2/figures/s4/Qkv.tsx", "../../../../lib/genai2/modules/s4/self-attention.ts"), "import guard follows relative paths from figures/sN/");
{
  const root = join(import.meta.dirname, "../.."), files = readdirSync(join(root, "components/genai2"), { recursive: true, encoding: "utf8" }).filter(f => /\.tsx?$/.test(f));
  assert.ok(files.includes("figures/s4.tsx") && files.some(f => f.startsWith("figures/s4/")) && files.includes("lab/LabView.tsx"), "guard scans the stage figures and the lab view");
  for (const f of files) {
    const rel = "components/genai2/" + f.split("\\").join("/");
    for (const [, spec] of readFileSync(join(root, rel), "utf8").matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) assert.ok(!serverOnly(rel, spec), `${rel} imports ${spec}, which holds module text`);
  }
}

// stages and ids
assert.equal(STAGES.length, 11);
STAGES.forEach((s, i) => assert.equal(s.n, i));
const OLD = ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "start", "interview", "design", "glossary", "resources"];
const ids = STAGES.flatMap(s => s.modules.map(m => m.id));
assert.equal(new Set(ids).size, ids.length, "module ids are unique");
for (const id of ids) assert.ok(!OLD.includes(id), `${id} clashes with an old page id`);

// next up
const firstBuilt = ids.find(id => BUILT.includes(id)), firstUnbuilt = ids.find(id => !BUILT.includes(id));
assert.equal(nextUp({}), firstBuilt, "a fresh user starts at the first built module");
if (firstUnbuilt) assert.equal(nextUp(Object.fromEntries(BUILT.map(id => [moduleKey(id), true]))), firstUnbuilt, "all built done: the first unbuilt module");
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
  assert.ok(VISUAL.has(m.blocks[0].kind), `${id}: the first block is visual`);
  for (const k of ["flow", "figure", "predict"]) assert.ok(m.blocks.some(b => b.kind === k), `${id}: has a ${k} block`);
  assert.ok(m.keyPoints.length >= 3 && m.keyPoints.length <= 6, `${id}: 3 to 6 key points`);
  for (const l of ["easy", "medium", "hard"]) assert.ok(m.questions.some(x => x.level === l), `${id}: has a ${l} question`);
  assert.equal(m.title, entry(id)?.title, `${id}: title matches the roadmap`);
  for (const r of m.real ?? []) assert.ok(r.url.startsWith("https://"), `${id}: real story url is https`);
  assert.ok(!JSON.stringify(m).includes("\u2014"), `${id}: no em dash`);
  const truths = new Set(m.questions.flatMap(x => (x.kind === "trap" ? [x.truth] : [])));
  assert.equal(truths.size, 2, `${id}: traps mix true and false claims`);
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

// [[module-id]] and [[module-id|label]] links: only in the fields that render them, to a known module, and a link forward says "later" or "next" nearby.
// Same pattern as components/other/Rich.tsx.
const LINK = /\[\[([a-z][a-z0-9-]*)(?:\|[^\]]+)?\]\]/g;
const linkErrors = (id: string, texts: string[]) => texts.flatMap(t => [...t.matchAll(LINK)].flatMap(l => {
  const j = ids.indexOf(l[1]);
  if (j < 0) return [`${id}: link to unknown module ${l[1]}`];
  const near = t.slice(Math.max(0, l.index - 80), l.index + l[0].length + 80);
  return j > ids.indexOf(id) && !/\b(later|next)\b/i.test(near) ? [`${id}: forward link to ${l[1]} needs "later" or "next" nearby`] : [];
}));
assert.deepEqual(linkErrors("self-attention", ["See [[nope]].", "Builds on [[tokenisation-bpe]] and [[decoding|this]] (next).", "Uses [[decoding]]."]),
  ["self-attention: link to unknown module nope", "self-attention: forward link to decoding needs \"later\" or \"next\" nearby"], "link check catches unknown and unmarked forward links");
for (const [id, m] of Object.entries(MODULES)) {
  const shown = [m.hook, ...m.keyPoints, ...m.blocks.flatMap(b => (b.kind === "text" ? [b.md] : b.kind === "predict" ? [b.why] : [])),
    ...m.questions.flatMap(x => (x.kind === "trap" ? [x.claim, x.why] : x.kind === "explain" ? [x.q, x.answer] : [x.q, x.why]))];
  assert.deepEqual(linkErrors(id, shown), [], `${id}: module links`);
  const total = (JSON.stringify(m).match(LINK) ?? []).filter(l => ids.includes(l.slice(2).split(/[|\]]/)[0])).length;
  assert.equal(total, shown.join("\n").match(LINK)?.length ?? 0, `${id}: a module link sits in a field that does not render links (caption, table, option, code)`);
}
// every block kind is plain data, and every figure id is registered
const fixture: Block[] = [
  { kind: "flow", id: "a" }, { kind: "play", id: "b" }, { kind: "lab", id: "attention" as never }, { kind: "figure", id: "f", caption: "c" },
  { kind: "mermaid", src: "flowchart TB\nA-->B", caption: "c" }, { kind: "text", md: "t" }, { kind: "compare", head: ["a"], rows: [["b"]] },
  { kind: "code", src: "x", run: true }, { kind: "predict", q: "q", answer: "a", wrong: ["b", "c", "d"], why: "w" },
];
assert.deepEqual(JSON.parse(JSON.stringify(fixture)), fixture);
// Each stage file keeps to its own stage: ids start with s<N>-, modules sit in stage N, and FIGURES_N (a .tsx file Node cannot import) is typed by FIGURE_IDS_N.
const figDir = join(import.meta.dirname, "../../components/genai2/figures");
const stageMods = await Promise.all(Array.from({ length: 11 }, (_, n) => Promise.all([import(`./stages/s${n}.ts`), import(`./stages/s${n}.built.ts`), import(`./stages/s${n}.play.ts`), import(`./stages/s${n}.flows.ts`)])));
stageMods.forEach(([m, b, p, f], n) => {
  const fids: readonly string[] = b[`FIGURE_IDS_${n}`];
  for (const id of [...fids, ...Object.keys(p[`PLAY_${n}`]), ...Object.keys(f[`FLOWS_${n}`])]) assert.ok(id.startsWith(`s${n}-`), `${id} must start with s${n}-`);
  for (const [id, mod] of Object.entries<{ stage: number }>(m[`MODULES_${n}`])) assert.equal(mod.stage, n, `${id} is in MODULES_${n} but belongs to stage ${mod.stage}`);
  assert.deepEqual([...b[`BUILT_${n}`]].sort(), Object.keys(m[`MODULES_${n}`]).sort(), `BUILT_${n} lists exactly MODULES_${n}`);
  // FIGURES_N's keys are enforced by tsc: figures/sN.tsx satisfies Record<(typeof FIGURE_IDS_N)[number], ...>
  assert.ok(readFileSync(join(figDir, `s${n}.tsx`), "utf8").includes(`satisfies Record<(typeof FIGURE_IDS_${n})[number]`), `figures/s${n}.tsx is typed by FIGURE_IDS_${n}`);
});
const allFig = stageMods.flatMap(([, b], n) => [...b[`FIGURE_IDS_${n}`]]);
assert.deepEqual([...allFig].sort(), [...FIGURE_IDS].sort(), "FIGURE_IDS is the union of the stage lists");
for (const m of Object.values(MODULES)) for (const b of m.blocks) if (b.kind === "figure") assert.ok((FIGURE_IDS as readonly string[]).includes(b.id), `figure ${b.id} is registered`);

for (const m of Object.values(MODULES)) if (m.lab) assert.ok(LABS[m.lab], `${m.id} links lab ${m.lab}, which does not exist`);
assert.equal(MODULES["self-attention"]?.lab, "transformer", "self-attention links the transformer lab");

console.log(`genai ok: ${STAGES.length} stages, ${ids.length} modules, ${Object.keys(MODULES).length} built`);
