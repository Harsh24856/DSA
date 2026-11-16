// Run: npm run check:genai. Runs every lab step's tests in python3 against its reference (all pass)
// and its starter (something fails), plus the harness edge cases a learner can hit.
import assert from "node:assert/strict";
import { execFile, type ExecFileException } from "node:child_process";
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
    const { stdout, stderr, error } = await new Promise<{ stdout: string; stderr: string; error: ExecFileException | null }>(res =>
      execFile("python3", ["-I", f], { encoding: "utf8", timeout: 120_000, maxBuffer: 1 << 24 }, (error, stdout, stderr) => res({ stdout, stderr, error })));
    // a non-zero exit is expected (syntax errors); a missing python3, numpy or torch is not
    assert.ok(error?.code !== "ENOENT" && !/No module named '(numpy|torch)'/.test(stderr), "check:genai needs python3 with numpy and torch");
    assert.ok(!error?.killed, `${steps[i].id}/${fw}: python3 ran past 120 s`);
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
          assert.ok(!bad || bad.every(r => !r.pass), `${lab.id}/${s.id}/${fw}: starter fails every test\n${show(bad)}`)));
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

    // a run cut short part-way (here by sys.exit on 3-D input) is not a pass, even if the tests so far passed
    const quits = `import sys\n${steps[at("softmax")].reference[fw]}\n_soft = softmax\ndef softmax(x):\n    if x.ndim == 3:\n        sys.exit(0)\n    return _soft(x)\n`;
    jobs.push(run(steps, at("softmax"), fw, quits).then(q => assert.equal(q.results, null, `${fw}: an early exit gives no results\n${show(q.results)}`)));

    // a learner global that shadows a test helper does not break a correct answer
    jobs.push(run(steps, at("softmax"), fw, `T = 4\nclose = None\n${steps[at("softmax")].reference[fw]}`).then(({ results: r }) =>
      assert.ok(r && r.every(x => x.pass), `${fw}: T = 4 in learner code still passes\n${show(r)}`)));
  }

  // Wrong answers a learner is likely to write: each must fail the named test. `code` is either the whole
  // learner code or a [from, to] edit of the step's reference.
  const MUTANTS: { step: string; fw: Fw; why: string; code: string | [string, string]; fails: string }[] = [
    { step: "softmax", fw: "numpy", why: "no max shift", fails: "test_large_scores_stay_finite",
      code: "def softmax(x):\n    e = np.exp(x)\n    return e / e.sum(axis=-1, keepdims=True)\n" },
    { step: "softmax", fw: "torch", why: "axis 0", fails: "test_rows_sum_to_one",
      code: "def softmax(x):\n    e = torch.exp(x - x.amax(dim=0, keepdim=True))\n    return e / e.sum(dim=0, keepdim=True)\n" },
    { step: "attention", fw: "numpy", why: "no sqrt(d_k)", fails: "test_matches_reference", code: [" / np.sqrt(q.shape[-1])", ""] },
    { step: "attention", fw: "numpy", why: "mask after softmax", fails: "test_mask_gives_zero_weight",
      code: "def attention(q, k, v, mask=None):\n    w = softmax(q @ np.swapaxes(k, -1, -2) / np.sqrt(q.shape[-1]))\n    if mask is not None:\n        w = np.where(mask, w, 0.0)\n    return w @ v, w\n" },
    { step: "attention", fw: "torch", why: "inverted mask", fails: "test_mask_gives_zero_weight", code: ["masked_fill(~mask,", "masked_fill(mask,"] },
    { step: "attention", fw: "torch", why: "returns weights as out", fails: "test_shapes", code: ["return w @ v, w", "return w, w"] },
    { step: "multi-head-attention", fw: "numpy", why: "no output projection", fails: "test_matches_reference", code: [' @ p["wo"]', ""] },
    { step: "multi-head-attention", fw: "torch", why: "heads merged without moving the axis back", fails: "test_matches_reference",
      code: ["out.transpose(1, 2).reshape(B, t, d)", "out.reshape(B, t, d)"] },
    { step: "layer-norm", fw: "torch", why: "sample variance", fails: "test_matches_reference",
      code: ["((x - mu) ** 2).mean(dim=-1, keepdim=True)", "x.var(dim=-1, keepdim=True)"] },
    { step: "feed-forward", fw: "numpy", why: "ReLU in place of GELU", fails: "test_matches_reference",
      code: ["h = 0.5 * h * (1 + np.tanh(np.sqrt(2 / np.pi) * (h + 0.044715 * h ** 3)))", "h = np.maximum(h, 0)"] },
    { step: "block", fw: "numpy", why: "no causal mask", fails: "test_future_tokens_stay_hidden", code: ["n_heads, mask)", "n_heads)"] },
    { step: "block", fw: "torch", why: "post-norm", fails: "test_matches_reference",
      code: ['return x + feed_forward(layer_norm(x, p["ln2_g"], p["ln2_b"]), p["ffn"])', 'return layer_norm(x + feed_forward(x, p["ffn"]), p["ln2_g"], p["ln2_b"])'] },
    { step: "gpt-forward", fw: "numpy", why: "no position embeddings", fails: "test_matches_reference", code: [' + p["wpe"][: idx.shape[1]]', ""] },
    { step: "generate", fw: "torch", why: "context not cropped", fails: "test_long_input_is_cropped_to_ctx", code: ['idx[:, -p["ctx"]:]', "idx"] },
    { step: "layer-norm", fw: "numpy", why: "eps outside the sqrt", fails: "test_small_variance_keeps_eps_inside_sqrt",
      code: ["np.sqrt(var + eps)", "(np.sqrt(var) + eps)"] },
    { step: "gpt-forward", fw: "numpy", why: "final layer norm ignores gain and shift", fails: "test_matches_reference",
      code: ['layer_norm(x, p["lnf_g"], p["lnf_b"])', "layer_norm(x, 1.0, 0.0)"] },
    { step: "train-step", fw: "torch", why: "fresh AdamW every call", fails: "test_two_steps_match_adamw",
      code: ['if "opt" not in model_params:', "if True:"] },
    { step: "train-step", fw: "torch", why: "returns a tensor", fails: "test_first_loss_is_cross_entropy_and_weights_move", code: ["return loss.item()", "return loss"] },
  ];
  for (const m of MUTANTS) {
    const i = at(m.step), ref = steps[i].reference[m.fw]!;
    const code = typeof m.code === "string" ? m.code : ref.replace(m.code[0], m.code[1]);
    assert.notEqual(code, ref, `mutant ${m.step}/${m.fw} (${m.why}) changes the reference`);
    jobs.push(run(steps, i, m.fw, code).then(({ results: r }) =>
      assert.ok(r?.some(x => x.name === m.fails && !x.pass), `mutant ${m.step}/${m.fw} (${m.why}) fails ${m.fails}\n${show(r)}`)));
  }
  await Promise.all(jobs);

  // Step 10 trains a tiny model on one thread. Its test file times itself with perf_counter, from its first
  // line to the end of training, and fails at 15 s. Run alone so no other run shares the CPU. Python start-up
  // and `import torch` are left out of that time: on a busy machine they alone took 5 to 12 s.
  const ti = at("train-step");
  const train = await run(steps, ti, "torch", steps[ti].reference.torch!, true);
  assert.ok(train.results?.some(r => r.name === "test_loss_falls_in_60_steps_within_15_s") && train.results.every(r => r.pass),
    `train-step reference trains in under 15 s when run alone\n${show(train.results)}`);
  console.log(`labs: ${runs} step versions (${runs * 2} reference and starter runs), ${MUTANTS.length} wrong answers caught, focus cases ok, train-step ${(train.ms / 1000).toFixed(1)} s alone with start-up`);
} finally { rmSync(tmp, { recursive: true, force: true }); }
