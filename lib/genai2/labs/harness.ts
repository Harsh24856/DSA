// Builds the Python program that grades one lab step, and reads its results. Runs in the browser:
// import types only, never lab content.
import type { Fw, LabStep, TestResult } from "./types.ts";

export const MAX_CODE = 50_000;
export const RUN_SECONDS = 20;

const imports = (fw: Fw) => `import json, numpy as np
${fw === "torch" ? "import torch\ntorch.manual_seed(0)\n" : ""}
_TESTS = []`;

// Emitted before the learner's code and again after it, so a learner global named T, close or test
// cannot break the tests.
const helpers = (fw: Fw) => `def T(x):
    ${fw === "torch" ? "return torch.tensor(x, dtype=torch.float32)" : "return np.asarray(x, dtype=np.float64)"}

def I(x):
    ${fw === "torch" ? "return torch.tensor(x, dtype=torch.long)" : "return np.asarray(x, dtype=np.int64)"}

def to_np(x):
    return x.detach().cpu().numpy() if hasattr(x, "detach") else np.asarray(x)

def check_shape(x, want, what="output"):
    got = tuple(to_np(x).shape)
    assert got == tuple(want), f"{what}: expected shape {tuple(want)}, got {got}"

def close(got, want, tol=1e-5, what="output"):
    want = np.asarray(want)
    check_shape(got, want.shape, what)
    diff = float(np.max(np.abs(to_np(got).astype(np.float64) - want))) if want.size else 0.0
    assert diff <= tol, f"{what}: off by {diff:.2e} (allowed {tol:.0e})"

def test(fn):
    _TESTS.append(fn)
    return fn
`;

// A leading newline keeps a result on its own line even after a learner print(..., end="").
// The closing done line tells a full run from one cut short by sys.exit or a crash part-way.
const runner = (token: string) => `
import json as _json
for _fn in _TESTS:
    try:
        _fn()
        _r = {"name": _fn.__name__, "pass": True, "msg": ""}
    except AssertionError as _e:
        _r = {"name": _fn.__name__, "pass": False, "msg": str(_e) or "Assertion failed"}
    except Exception as _e:
        _r = {"name": _fn.__name__, "pass": False, "msg": type(_e).__name__ + (": " + str(_e) if str(_e) else "")}
    print("\\n@@${token} " + _json.dumps(_r), flush=True)
print("\\n@@${token} " + _json.dumps({"done": True}), flush=True)
`;

export function buildProgram(steps: LabStep[], index: number, fw: Fw, userCode: string, token: string): string {
  if (!/^[A-Za-z0-9]+$/.test(token)) throw new Error("token must be letters and digits");
  const earlier = steps.slice(0, index).map((s, i) => {
    const ref = s.reference[fw];
    if (!ref) throw new Error(`step ${i + 1} (${s.id}) has no ${fw} version`);
    return `# step ${i + 1}: ${s.title}\n${ref}`;
  });
  return [imports(fw), helpers(fw), ...earlier, "# your code", userCode, "# tests", helpers(fw), steps[index].tests, runner(token)].join("\n\n");
}

// null unless the run reached its done line with at least one result: a syntax error, a crash or an
// early exit all mean the step failed.
export function parseResults(stdout: string, token: string): TestResult[] | null {
  const mark = `@@${token} `;
  const out: TestResult[] = [];
  let done = false;
  for (const line of stdout.split("\n")) {
    if (!line.startsWith(mark)) continue;
    try {
      const r = JSON.parse(line.slice(mark.length));
      if (r.done === true) { done = true; continue; }
      out.push({ name: String(r.name), pass: r.pass === true, msg: String(r.msg ?? "") });
    } catch { /* a cut-off line is not a result */ }
  }
  return done && out.length ? out : null;
}
