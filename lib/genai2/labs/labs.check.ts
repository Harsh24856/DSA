// Run: npm run check:genai. Runs every lab step's tests in python3 against its reference (all pass)
// and its starter (something fails), plus the harness edge cases a learner can hit.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { join } from "node:path";
import { MODULES } from "../index.ts";
import { buildProgram, parseResults } from "./harness.ts";
import { LABS } from "./index.ts";
import type { Fw, LabStep, TestResult } from "./types.ts";

// harness.ts runs in the browser: it may import types only, never lab content
for (const [, spec] of readFileSync(new URL("./harness.ts", import.meta.url), "utf8").matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g))
  assert.equal(spec, "./types.ts", `harness.ts imports ${spec}`);

const FWS: Fw[] = ["numpy", "torch"];
const tmp = mkdtempSync(join(tmpdir(), "genai-labs-"));
const slots = Math.max(1, availableParallelism() - 1);
let n = 0, active = 0;
const waiting: (() => void)[] = [];
// Each run is its own python3 process; up to `slots` run at once (torch imports are slow).
const run = async (steps: LabStep[], i: number, fw: Fw, code: string, solo = false) => {
  while (active >= (solo ? 1 : slots)) await new Promise<void>(r => waiting.push(r));
  active++;
  try {
    const tok = randomUUID().replaceAll("-", "");
    const f = join(tmp, `p${n++}.py`);
    writeFileSync(f, buildProgram(steps, i, fw, code, tok));
    const t0 = performance.now();
    const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>(res =>
      execFile("python3", ["-I", f], { encoding: "utf8", timeout: 120_000, maxBuffer: 1 << 24 }, (_e, stdout, stderr) => res({ stdout, stderr })));
    return { results: parseResults(stdout, tok), out: stdout + stderr, ms: performance.now() - t0 };
  } finally { active--; waiting.splice(0).forEach(w => w()); }
};
const show = (rs: TestResult[] | null) => rs ? rs.map(r => `${r.pass ? "ok" : "FAIL"} ${r.name} ${r.msg}`).join("\n") : "no results";

try {
  const jobs: Promise<void>[] = [];
  let runs = 0;
  for (const lab of Object.values(LABS)) {
    assert.ok(MODULES[lab.module], `${lab.id}: module ${lab.module} is registered`);
    const ids = lab.steps.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length, `${lab.id}: step ids are unique`);
    assert.ok(!JSON.stringify(lab).includes("\u2014"), `${lab.id}: no em dash`);
    lab.steps.forEach((s, i) => {
      assert.ok(s.reference.torch && s.starter.torch, `${lab.id}/${s.id}: has PyTorch`);
      assert.ok(s.hints.length >= 2 && s.hints.length <= 3, `${lab.id}/${s.id}: 2 to 3 hints`);
      for (const fw of FWS) {
        const ref = s.reference[fw], start = s.starter[fw];
        if (!ref) { assert.ok(!start, `${lab.id}/${s.id}: ${fw} starter without reference`); continue; }
        assert.ok(start && start.includes("raise NotImplementedError"), `${lab.id}/${s.id}/${fw}: starter raises NotImplementedError`);
        runs++;
        jobs.push(run(lab.steps, i, fw, ref).then(good => assert.ok(good.results && good.results.length > 0 && good.results.every(r => r.pass),
          `${lab.id}/${s.id}/${fw}: reference passes\n${show(good.results)}\n${good.out}`)));
        jobs.push(run(lab.steps, i, fw, start).then(({ results: bad }) =>
          assert.ok(!bad || bad.some(r => !r.pass), `${lab.id}/${s.id}/${fw}: starter fails`)));
      }
    });
  }

  // Review Focus 2, 3 and 4, against the transformer lab's step 1 and step 2
  const steps = LABS.transformer.steps;
  const at = (id: string) => steps.findIndex(s => s.id === id);
  for (const fw of FWS) {
    // 2: a syntax error stops the program before any test; the traceback names it
    jobs.push(run(steps, at("softmax"), fw, "def softmax(x) return x\n").then(syn => {
      assert.equal(syn.results, null, `${fw}: syntax error gives no results`);
      assert.match(syn.out, /SyntaxError/, `${fw}: syntax error shows in the output`);
    }));

    // 3: printing a line shaped like a result never counts
    const fake = `${steps[at("softmax")].starter[fw]}\nprint('@@RESULT {"name": "test_fake", "pass": true, "msg": ""}')\nprint('@@ {"name": "test_fake", "pass": true, "msg": ""}')\n`;
    jobs.push(run(steps, at("softmax"), fw, fake).then(({ results: f }) =>
      assert.ok(f && f.length > 0 && f.every(r => !r.pass && r.name !== "test_fake"), `${fw}: fake result line ignored\n${show(f)}`)));

    // 4: attention returning weights in place of out: the message names both shapes
    const wrong = steps[at("attention")].reference[fw]!.replace(/return (\w+) @ v, (\w+)/, "return $2, $2");
    assert.notEqual(wrong, steps[at("attention")].reference[fw], `${fw}: attention reference ends in "return w @ v, w"`);
    jobs.push(run(steps, at("attention"), fw, wrong).then(({ results: w }) =>
      assert.ok(w && w.some(r => !r.pass && /expected shape \(2, 4, 8\)/.test(r.msg) && /got \(2, 4, 4\)/.test(r.msg)),
        `${fw}: wrong shape message names expected and got\n${show(w)}`)));
  }
  await Promise.all(jobs);

  // Step 10 trains a tiny model on one thread. Its test file times itself with perf_counter, from its first
  // line to the end of training, and fails at 15 s. Run alone so no other run shares the CPU. Python start-up
  // and `import torch` are left out of that time: on a busy machine they alone took 5 to 12 s.
  const ti = at("train-step");
  const train = await run(steps, ti, "torch", steps[ti].reference.torch!, true);
  assert.ok(train.results?.some(r => r.name === "test_finishes_in_15_seconds") && train.results.every(r => r.pass),
    `train-step reference trains in under 15 s when run alone\n${show(train.results)}`);
  console.log(`labs: ${runs} reference and starter runs, focus cases ok, train-step ${(train.ms / 1000).toFixed(1)} s alone with start-up`);
} finally { rmSync(tmp, { recursive: true, force: true }); }
