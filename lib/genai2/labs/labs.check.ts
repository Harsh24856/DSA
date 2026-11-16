// Run: npm run check:genai. Runs every lab step's tests in python3 against its reference (all pass)
// and its starter (something fails), plus the harness edge cases a learner can hit.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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
let n = 0;
const run = (steps: LabStep[], i: number, fw: Fw, code: string) => {
  const tok = randomUUID().replaceAll("-", "");
  const f = join(tmp, `p${n++}.py`);
  writeFileSync(f, buildProgram(steps, i, fw, code, tok));
  const r = spawnSync("python3", ["-I", f], { encoding: "utf8", timeout: 60_000 });
  return { results: parseResults(r.stdout, tok), out: r.stdout + r.stderr };
};
const show = (rs: TestResult[] | null) => rs ? rs.map(r => `${r.pass ? "ok" : "FAIL"} ${r.name} ${r.msg}`).join("\n") : "no results";

try {
  let runs = 0;
  for (const lab of Object.values(LABS)) {
    assert.ok(MODULES[lab.module], `${lab.id}: module ${lab.module} is registered`);
    const ids = lab.steps.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length, `${lab.id}: step ids are unique`);
    assert.ok(!JSON.stringify(lab).includes("\u2014"), `${lab.id}: no em dash`);
    lab.steps.forEach((s, i) => {
      assert.ok(s.reference.torch && s.starter.torch, `${lab.id}/${s.id}: has PyTorch`);
      for (const fw of FWS) {
        const ref = s.reference[fw], start = s.starter[fw];
        if (!ref) { assert.ok(!start, `${lab.id}/${s.id}: ${fw} starter without reference`); continue; }
        assert.ok(start && start.includes("raise NotImplementedError"), `${lab.id}/${s.id}/${fw}: starter raises NotImplementedError`);
        const good = run(lab.steps, i, fw, ref);
        assert.ok(good.results && good.results.length > 0 && good.results.every(r => r.pass),
          `${lab.id}/${s.id}/${fw}: reference passes\n${show(good.results)}\n${good.out}`);
        const bad = run(lab.steps, i, fw, start).results;
        assert.ok(!bad || bad.some(r => !r.pass), `${lab.id}/${s.id}/${fw}: starter fails`);
        runs++;
      }
    });
  }

  // Review Focus 2, 3 and 4, against the transformer lab's step 1 and step 2
  const steps = LABS.transformer.steps;
  const at = (id: string) => steps.findIndex(s => s.id === id);
  for (const fw of FWS) {
    // 2: a syntax error stops the program before any test; the traceback names it
    const syn = run(steps, at("softmax"), fw, "def softmax(x) return x\n");
    assert.equal(syn.results, null, `${fw}: syntax error gives no results`);
    assert.match(syn.out, /SyntaxError/, `${fw}: syntax error shows in the output`);

    // 3: printing a line shaped like a result never counts
    const fake = `${steps[at("softmax")].starter[fw]}\nprint('@@RESULT {"name": "test_fake", "pass": true, "msg": ""}')\nprint('@@ {"name": "test_fake", "pass": true, "msg": ""}')\n`;
    const f = run(steps, at("softmax"), fw, fake).results;
    assert.ok(f && f.length > 0 && f.every(r => !r.pass && r.name !== "test_fake"), `${fw}: fake result line ignored\n${show(f)}`);

    // 4: attention returning weights in place of out: the message names both shapes
    const wrong = steps[at("attention")].reference[fw]!.replace(/return (\w+) @ v, (\w+)/, "return $2, $2");
    assert.notEqual(wrong, steps[at("attention")].reference[fw], `${fw}: attention reference ends in "return w @ v, w"`);
    const w = run(steps, at("attention"), fw, wrong).results;
    assert.ok(w && w.some(r => !r.pass && /expected shape \(2, 4, 8\)/.test(r.msg) && /got \(2, 4, 4\)/.test(r.msg)),
      `${fw}: wrong shape message names expected and got\n${show(w)}`);
  }
  console.log(`labs: ${runs} reference and starter runs, focus cases ok`);
} finally { rmSync(tmp, { recursive: true, force: true }); }
