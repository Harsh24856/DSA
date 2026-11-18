// Stage 0: turning Python loops into array operations, and knowing when not to. Every number below is computed here.
import type { GModule } from "../../types.ts";
import { fmt, M23, MASK, maskedMean, MX, n0, pairBytes, plainMean, pyList } from "../../stages/s0.calc.ts";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const cumsum = (xs: number[]) => xs.map((_, i) => sum(xs.slice(0, i + 1)));
const where = (xs: number[], t: number) => xs.map((x) => (x > t ? x : 0));

// compare: loop patterns against one small example
const CX = [3, -1, 4, -1, 5], IDS = [0, 2, 2, 1, 2];
const bincount = (ids: number[]) => Array.from({ length: Math.max(...ids) + 1 }, (_, k) => ids.filter((i) => i === k).length);
const argmax = (r: number[]) => r.indexOf(Math.max(...r));
// predict: a padded row
const ROW = MX[0], REAL = MASK[0].reduce((a, b) => a + b, 0);
// output questions
const WX = [-2, 3, -1, 4], CS = [1, 2, 3, 4];
const QX = [[1, 3, 0], [5, 0, 0]], QM = [[1, 1, 0], [1, 0, 0]], QOUT = maskedMean(QX, QM);
// numeric: memory of the broadcast difference
const [NN, ND] = [10_000, 64], gbStr = (b: number) => `${fmt(b / 1e9)} GB`, P = pairBytes(NN, NN, ND);
// code: timing sizes
const [TN, TD] = [5_000, 64];

export const VECTORISING_LOOPS: GModule = {
  id: "vectorising-loops",
  stage: 0,
  title: "Vectorising loops",
  hook: "The same maths can take seconds in a Python loop or milliseconds as one array call. Learn to see the array version of a loop, and when to keep the loop. Builds on [[arrays-broadcasting]].",
  blocks: [
    { kind: "figure", id: "s0-loopvec", caption: "A Python loop pays the interpreter for every element. NumPy pays it once, then a compiled loop runs over numbers packed side by side." },
    { kind: "text", md: "**Rewriting a loop, in four moves.**\n\n1. Name what each loop index walks over: i over rows of A, j over rows of B, k over features.\n2. Give each index its own axis, using None where an array lacks one.\n3. Turn the innermost sum into .sum(axis=...) or a matrix multiply.\n4. Compare with the loop on a small random input, using np.allclose." },
    { kind: "flow", id: "s0-pairwise" },
    { kind: "play", id: "s0-memory" },
    {
      kind: "predict",
      q: `A row holds ${ROW.join(", ")}, but only the first ${REAL} are real tokens; the rest is padding. What does row.mean() give?`,
      answer: fmt(plainMean([ROW])[0]),
      wrong: [fmt(maskedMean([ROW], [MASK[0]])[0]), fmt(ROW[ROW.length - 1]), fmt(sum(ROW.slice(0, REAL)) / ROW.length)],
      why: `mean has no idea which entries are padding: (${ROW.join(" + ")}) / ${ROW.length} = ${fmt(plainMean([ROW])[0])}. The real mean is ${fmt(maskedMean([ROW], [MASK[0]])[0])}. The fix is a mask, shown next.`,
    },
    { kind: "flow", id: "s0-mask" },
    { kind: "compare", head: ["Loop that does", "Array version", `On x = ${pyList(CX)}`], rows: [
      ["total += v", "x.sum()", String(sum(CX))],
      ["append(v if v > 0 else 0)", "np.where(x > 0, x, 0)", pyList(where(CX, 0))],
      ["keep v if v > 0", "x[x > 0]", pyList(CX.filter((x) => x > 0))],
      ["running total", "np.cumsum(x)", pyList(cumsum(CX))],
      [`count each id in ${pyList(IDS)}`, "np.bincount(ids)", pyList(bincount(IDS))],
      [`best column per row of [${M23.map((r) => pyList(r)).join(", ")}]`, "m.argmax(axis=1)", pyList(M23.map(argmax))],
    ] },
    {
      kind: "code",
      run: true,
      src: `import time
import numpy as np

rng = np.random.default_rng(0)
E = rng.standard_normal((${TN}, ${TD}))   # ${n0(TN)} stored vectors
q = rng.standard_normal(${TD})           # one query vector

def scores_loop(rows, ql):
    out = []
    for row in rows:                # one Python step per vector...
        s = 0.0
        for a, b in zip(row, ql):   # ...and per number in it
            s += a * b
        out.append(s)
    return out

rows, ql = E.tolist(), q.tolist()
t0 = time.perf_counter()
slow = scores_loop(rows, ql)
t1 = time.perf_counter()
fast = E @ q                         # every dot product in one call
t2 = time.perf_counter()

print(f"loop:       {(t1 - t0) * 1000:8.1f} ms")
print(f"vectorised: {(t2 - t1) * 1000:8.1f} ms")
print(f"about {(t1 - t0) / max(t2 - t1, 1e-9):,.0f} times faster here (an example: your timings will differ)")
assert np.allclose(slow, fast)       # same answers, to rounding
`,
    },
    { kind: "text", md: "**Keep the loop when each step needs the last.** If step t uses the result of step t - 1 through a rule like x = f(x), the steps cannot run side by side. A few running patterns have their own array functions, such as cumsum and cumprod; the rest stay loops, or go to a tool that compiles them.\n\nA loop over a few hundred items that runs once is rarely worth rewriting." },
  ],
  keyPoints: [
    "A Python loop pays interpreter work on every element; one NumPy call pays it once and loops in compiled code.",
    "To vectorise, give each loop index its own axis, broadcast, then reduce with .sum(axis=...) or @.",
    "Broadcasting can build a huge temporary array; chunk the work, or use an identity such as |a|² + |b|² - 2 a·b.",
    "Masks replace if-statements and ragged lengths: np.where, x[mask], and (x * mask).sum(1) / mask.sum(1).",
    "Check every rewrite against the loop on a small input with np.allclose.",
  ],
  questions: [
    { id: "why-slow", level: "easy", kind: "concept",
      q: "Why is a Python for loop over a million floats slow?",
      answer: "Every element is a Python object that the interpreter fetches, type-checks and rebuilds, one at a time",
      wrong: ["Python runs loops on one CPU core only, while NumPy uses all of them", "Floats are stored as text and parsed on each use", "The loop body is compiled again on every pass"],
      why: "The arithmetic itself is cheap. The cost is the interpreter's work around each element. NumPy does that work once per call, then runs a compiled loop over raw numbers. Using one core or many is a separate matter." },
    { id: "where", level: "easy", kind: "concept",
      q: "Which NumPy call replaces [v if v > 0 else 0 for v in x]?",
      answer: "np.where(x > 0, x, 0)", wrong: ["x[x > 0]", "np.select(x > 0)", "x.clip(0, 1)"],
      why: "np.where picks from its second argument where the condition is True and from its third elsewhere, keeping the shape. x[x > 0] drops the other entries instead, so the result is shorter." },
    { id: "sequential", level: "medium", kind: "concept",
      q: "Which loop cannot be replaced by one NumPy call over the whole array?",
      answer: "x[t] = np.sin(x[t - 1]) + 1, for t = 1 to n",
      wrong: ["y[i] = x[i] ** 2 for every i", "s[i] = the sum of row i of a matrix", "d[i, j] = the squared distance between a[i] and b[j]"],
      why: "Each step needs the previous step's result through a non-linear rule, so the steps cannot run side by side. The others treat every entry on its own and map to x ** 2, m.sum(axis=1) and broadcasting." },
    { id: "np-vectorize", level: "hard", kind: "concept",
      q: "What does wrapping a Python function with np.vectorize do for speed?",
      answer: "Almost nothing: it still calls the Python function once per element",
      wrong: ["It compiles the function to machine code", "It runs the function on all elements at once in C", "It moves the work to the GPU"],
      why: "np.vectorize is for convenience: it adds broadcasting and an array result to any function. Underneath it is still a loop that calls your function once per element. Real speed comes from rewriting with array operations." },
    { id: "cube-shape", level: "medium", kind: "concept",
      q: "A is (n, d) and B is (m, d). What shape is A[:, None, :] - B[None, :, :]?",
      answer: "(n, m, d)", wrong: ["(n, m)", "(n, d)", "A ValueError unless n equals m"],
      why: "A[:, None, :] is (n, 1, d) and B[None, :, :] is (1, m, d). Each 1 stretches against the other's size, giving every pair (i, j) and every feature k. Summing over the last axis then gives (n, m)." },
    { id: "bool-index", level: "medium", kind: "concept",
      q: "x has shape (4, 5). What does x[x > 0] return?",
      answer: "A 1D array of the positive entries, as many as there are",
      wrong: ["An array of shape (4, 5) with the other entries set to 0", "An array of shape (4, 5) of True and False", "The positive entries, still arranged as rows"],
      why: "A boolean mask picks entries, and the number picked depends on the data, so the result cannot keep the (4, 5) layout. It is a new 1D array, not a view. To keep the shape, use np.where." },
    { id: "builtin-sum", level: "hard", kind: "concept",
      q: "x is a NumPy array of a million floats. Is Python's built-in sum(x) vectorised?",
      answer: "No: it walks the array one element at a time in Python; x.sum() is the vectorised call",
      wrong: ["Yes: sum detects NumPy arrays and calls x.sum()", "Yes, but only for float64 arrays", "No, and it raises a TypeError on arrays"],
      why: "Built-in sum knows nothing about arrays. It iterates, turning each number into a NumPy scalar object and adding them in Python. Use x.sum() or np.sum(x)." },
    { id: "out-where", level: "easy", kind: "output",
      q: "What does this print?",
      code: `import numpy as np\nx = np.array([${WX.join(", ")}])\nprint(np.where(x > 0, x, 0).tolist())`,
      answer: pyList(where(WX, 0)), wrong: [pyList(WX.filter((x) => x > 0)), pyList(WX.map((x) => (x > 0 ? 1 : 0))), pyList(WX.map(Math.abs))],
      why: "Where the condition is True, the entry comes from x; elsewhere it is 0. The length stays the same." },
    { id: "out-cumsum", level: "medium", kind: "output",
      q: "What does this print?",
      code: `import numpy as np\nprint(np.cumsum([${CS.join(", ")}]).tolist())`,
      answer: pyList(cumsum(CS)), wrong: [pyList([sum(CS)]), pyList(CS.map((x, i) => x + (CS[i - 1] ?? 0))), pyList(cumsum(CS).slice(0, -1))],
      why: `Entry i is the sum of everything up to i: ${cumsum(CS).join(", ")}. It replaces a running-total loop.` },
    { id: "out-masked", level: "hard", kind: "output",
      q: "Padding is marked by 0 in the mask. What does this print?",
      code: `import numpy as np\nx = np.array([${QX.map((r) => `[${r.map((v) => `${v}.`).join(", ")}]`).join(", ")}])\nmask = np.array([${QM.map((r) => `[${r.join(", ")}]`).join(", ")}])\nprint(((x * mask).sum(1) / mask.sum(1)).tolist())`,
      answer: pyList(QOUT, true), wrong: [pyList(plainMean(QX).map((v) => +v.toFixed(4)), true), pyList(QX.map((r, i) => sum(r.map((v, j) => v * QM[i][j]))), true), pyList(QM.map((r) => sum(r)), true)],
      why: `x * mask zeroes the padding, so the sums are ${QX.map((r, i) => sum(r.map((v, j) => v * QM[i][j]))).join(" and ")}. mask.sum(1) counts real tokens: ${QM.map(sum).join(" and ")}. Dividing gives each row's mean over real tokens only.` },
    { id: "cube-memory", level: "medium", kind: "numeric",
      q: `A and B each hold ${n0(NN)} vectors of width ${ND}, in float32. How much memory does A[:, None] - B[None] need for its result?`,
      answer: gbStr(P.cube), wrong: [gbStr(2 * P.cube), gbStr(P.out), gbStr(P.cube / 10)],
      why: `It holds ${n0(NN)} × ${n0(NN)} × ${ND} = ${n0(NN * NN * ND)} numbers at 4 bytes each: ${gbStr(P.cube)}. The distances it leads to are only ${gbStr(P.out)}.` },
    { id: "what-vectorise", level: "easy", kind: "explain",
      q: "What does it mean to vectorise code?",
      answer: "To replace a Python loop over elements with operations on whole arrays, such as x * 2, x.sum(axis=1), np.where or A @ B.\n\nThe loop still happens, but inside NumPy's compiled code over raw numbers, so the interpreter's per-element work disappears. The code also gets shorter and closer to the maths." },
    { id: "slow-numpy", level: "medium", kind: "explain",
      q: "Code uses NumPy everywhere but is still slow. What patterns would you look for?",
      answer: "- NumPy called inside a Python loop on one element at a time, such as np.sqrt(x[i]). Each call has a fixed cost, so this is slower than plain Python.\n- Growing an array with np.append in a loop. Every append copies the whole array, so the total work grows with n squared. Collect in a list, or allocate once with np.empty.\n- Converting back and forth with .tolist() or np.array(...) inside the loop." },
    { id: "check-rewrite", level: "medium", kind: "explain",
      q: "How do you make sure a vectorised rewrite is correct?",
      answer: "- Keep the slow loop as the reference.\n- Run both on small random inputs whose sizes all differ, such as n = 3, m = 4, d = 5, so a swapped axis gives a wrong shape instead of hiding.\n- Compare with np.allclose, not ==, because the order of additions changes the last digits.\n- Add edge cases: one row, empty arrays, and values that hit each branch of an if." },
    { id: "out-of-memory", level: "hard", kind: "explain",
      q: "Your vectorised version runs out of memory on the full data. What do you do?",
      answer: "Find the temporary that grew: usually a broadcast that builds n × m × d numbers.\n\n- Rewrite it with an identity that skips the temporary, such as a matrix multiply.\n- Or process in chunks: loop over blocks of a few thousand rows and vectorise inside each block. A few hundred Python steps cost nothing next to millions.\n- Use float32 instead of float64 to halve the size." },
    { id: "trap-mask-write", level: "medium", kind: "trap",
      claim: "x[x < 0] = 0 changes x itself.",
      truth: true,
      why: "Reading x[x < 0] gives a new array, but assigning to it writes into x at the masked positions. It is the fast way to clip negative values in place." },
    { id: "trap-listcomp", level: "easy", kind: "trap",
      claim: "A list comprehension runs about as fast as NumPy for arithmetic on a million numbers.",
      truth: false,
      why: "A comprehension is a little faster than a plain for loop, but it still runs the interpreter for every element. The NumPy call does the per-element work in compiled code; the timing example above shows the gap on your machine." },
    { id: "trap-inplace", level: "medium", kind: "trap",
      claim: "x += 1 on a NumPy array builds a new array and points x at it.",
      truth: false,
      why: "+= on an array writes the results into x's own memory, so any view of x sees the change. x = x + 1 is the version that builds a new array." },
  ],
  real: [
    { who: "Charles R. Harris and co-authors", when: "2020",
      what: "The paper \"Array Programming with NumPy\" describes array programming as a compact way to work with vectors, matrices and higher-dimensional arrays, and calls NumPy the primary array programming library for Python.",
      takeaway: "Thinking in whole arrays, not elements, is the habit the whole Python data and AI stack is built on.",
      url: "https://arxiv.org/abs/2006.10256" },
  ],
};
