// Stage 0: NumPy arrays, shapes, axes and broadcasting, the habits every later stage's code leans on. Every number below is computed here.
import type { GModule } from "../../types.ts";
import { broadcastShape, fmt, matmulShape, n0, pyList, reduceShape, shapeStr } from "../../stages/s0.calc.ts";

const must = <T,>(x: T | null): T => { if (x === null) throw new Error("these shapes were meant to broadcast"); return x; };

// predict: a four-axis broadcast
const [PA, PB] = [[8, 1, 6, 1], [7, 1, 5]], PR = must(broadcastShape(PA, PB));
// compare and code: common moves on x of shape (B, T, D)
const [B, T, D, H] = [2, 5, 8, 16], X = [B, T, D];
const OPS: [string, number[], string][] = [
  ["x[:, -1]", [B, D], "the last token of every sequence"],
  ["x.reshape(B * T, D)", [B * T, D], "every token as one long list of rows"],
  ["x.transpose(0, 2, 1)", [B, D, T], "swap the last two axes"],
  [`x @ W, W is ${shapeStr([D, H])}`, must(matmulShape(X, [D, H])), "a new width for every token"],
  ["x[None]", [1, ...X], "add a size 1 axis in front"],
  ["x.sum(axis=1)", reduceShape(X, 1), "one total per sequence"],
];
// text: memory of an embedding table
const [VOCAB, WIDTH] = [50_000, 768], mbOf = (bytes: number) => fmt((VOCAB * WIDTH * bytes) / 1e6);
// numeric: a vector store
const [NV, DV] = [1_000_000, 384], gbOf = (bytes: number) => `${fmt((NV * DV * bytes) / 1e9)} GB`;
// output questions
const AR = [[0, 1, 2], [3, 4, 5]], AR0 = AR[0].map((_, j) => AR[0][j] + AR[1][j]);
const INTS = [1, 2, 3], NEWV = 2.7, AFTER = [Math.trunc(NEWV), ...INTS.slice(1)];
// concept: (3,) plus (3, 1)
const SILENT = must(broadcastShape([3], [3, 1]));
// trap: (3, 4) and (4,)
const TRAP = must(broadcastShape([3, 4], [4]));

export const ARRAYS_BROADCASTING: GModule = {
  id: "arrays-broadcasting",
  stage: 0,
  title: "Arrays and broadcasting",
  hook: "Model code is mostly arrays of numbers moving between shapes. Read shapes fluently and most bugs show themselves before you run anything.",
  blocks: [
    { kind: "figure", id: "s0-stretch", caption: "A column plus a row. Each is reused along its size 1 axis (dashed), so the sum is a full grid that neither input had." },
    { kind: "text", md: `**An array is one block of numbers with a shape.** Every element has the same type (the dtype), and the shape says how to read the block. A batch of text inside a model is usually (batch, tokens, features): here x is ${shapeStr(X)}, ${B} sequences of ${T} tokens, ${D} numbers per token.\n\nOne line of NumPy acts on the whole block at once.` },
    { kind: "flow", id: "s0-broadcast" },
    {
      kind: "predict",
      q: `What shape does an array of shape ${shapeStr(PA)} plus one of shape ${shapeStr(PB)} give?`,
      answer: shapeStr(PR),
      wrong: [shapeStr([8, 7, 6, 1]), shapeStr([8, 1, 6, 5]), "A ValueError: the shapes have different lengths"],
      why: `Line them up from the right: 1 and 5 give 5, 6 and 1 give 6, 1 and 7 give 7, and the missing axis in front counts as 1, so 8 stays. On every axis the bigger size wins when the other is 1.`,
    },
    { kind: "figure", id: "s0-axes", caption: "The axis you name is the one that disappears. axis=0 runs down the rows and leaves one answer per column." },
    { kind: "play", id: "s0-reduce" },
    { kind: "compare", head: ["Line, x is " + shapeStr(X), "Shape", "What it means"], rows: OPS.map(([code, s, m]) => [code, shapeStr(s), m]) },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

x = np.arange(12, dtype=np.float32).reshape(3, 4)

v = x[:, :2]                  # a slice is a view: same memory, new shape
v[0, 0] = 99
print("x[0, 0] after editing the slice:", x[0, 0])

r = x.reshape(4, 3)           # reshaping data already in row order: a view too
print("reshape shares memory:", np.shares_memory(x, r))

t = x.T.reshape(12)           # transposed data is not in row order, so this copies
print("transpose, then reshape, shares memory:", np.shares_memory(x, t))

c = x[:, :2].copy()           # ask for a copy when you need one
print("copy shares memory:", np.shares_memory(x, c))

row = np.arange(4, dtype=np.float32)
big = np.broadcast_to(row, (1000, 4))   # 1000 rows to read, 16 bytes stored
print("strides:", big.strides, "bytes stored:", row.nbytes)

assert x[0, 0] == 99 and np.shares_memory(x, r) and not np.shares_memory(x, t)
assert big.strides[0] == 0    # step 0 bytes to reach the next row: the same row again
`,
    },
    { kind: "text", md: `**Memory is elements times bytes per element.** float64 takes 8 bytes, float32 4, float16 2. A table of ${n0(VOCAB)} token vectors, ${WIDTH} wide, is ${mbOf(8)} MB in float64, NumPy's default, but ${mbOf(4)} MB in float32 and ${mbOf(2)} MB in float16.\n\nPass dtype=np.float32 when you build arrays for model work, and check x.dtype when memory looks too high.` },
  ],
  keyPoints: [
    "An array has one dtype and a shape; model data is usually (batch, tokens, features).",
    "Broadcasting lines shapes up from the right. Each pair of sizes must be equal or contain a 1, and a 1 is reused without copying.",
    "A reduction removes the axis you name; keepdims=True leaves it as size 1 so the result broadcasts back against the input.",
    "A @ B needs A's last axis to equal B's second to last; leading batch axes broadcast.",
    "Slices and most reshapes are views of the same memory; call .copy() when you need independent data.",
    "Memory is elements times bytes: float32 halves float64, NumPy's default.",
  ],
  questions: [
    { id: "shape-meaning", level: "easy", kind: "concept",
      q: "A language model's input has shape (32, 128, 768). What does that usually mean?",
      answer: "32 sequences, 128 tokens each, 768 numbers per token",
      wrong: ["32 tokens, 128 sequences, 768 layers", "768 sequences of 128 tokens, 32 numbers each", "A 32 by 128 image with 768 colour channels"],
      why: "Model code keeps the batch first, then the position in the sequence, then the features of each token. Reading every shape this way tells you what each axis of a bug is about." },
    { id: "compatible", level: "easy", kind: "concept",
      q: "When broadcasting, when are two sizes on the same axis compatible?",
      answer: "When they are equal, or one of them is 1",
      wrong: ["Only when they are equal", "When one divides the other", "Always: the smaller one is repeated as needed"],
      why: "Only a size 1 axis can be reused. A size 2 against a size 4 is not repeated twice; NumPy raises a ValueError instead of guessing." },
    { id: "default-dtype", level: "easy", kind: "concept",
      q: "What dtype does np.zeros((3, 4)) have?",
      answer: "float64", wrong: ["float32", "int64", "float16"],
      why: "NumPy's default float is 64 bit. Model weights and activations are normally float32 or smaller, so pass dtype when you create arrays, or the memory doubles without warning." },
    { id: "matmul-match", level: "medium", kind: "concept",
      q: `x has shape ${shapeStr(X)} and W has shape ${shapeStr([D, H])}. Which axes must agree for x @ W, and what comes out?`,
      answer: `x's last axis and W's first, giving ${shapeStr(must(matmulShape(X, [D, H])))}`,
      wrong: [`x's first axis and W's first, giving ${shapeStr([T, D, H])}`, `None: @ broadcasts like +, giving ${shapeStr([B, T, D])}`, `x's last axis and W's last, giving ${shapeStr([B, T, D])}`],
      why: `@ multiplies along x's last axis (${D}) and W's second to last (${D}). The ${B} and ${T} in front are treated as a stack of separate matrices, so every token gets a new ${H}-wide vector.` },
    { id: "silent-outer", level: "medium", kind: "concept",
      q: "a has shape (3,) and b has shape (3, 1). You meant to add them element by element. What does a + b give?",
      answer: `An array of shape ${shapeStr(SILENT)}, with no error`,
      wrong: ["An array of shape (3,)", "An array of shape (3, 1)", "A ValueError, because the shapes differ"],
      why: `(3,) lines up with the last axis of (3, 1). Both have a 1 against a 3 somewhere, so both stretch and you get every pair: ${shapeStr(SILENT)}. Nothing fails, so the bug shows up later as a wrong shape.` },
    { id: "square-keepdims", level: "hard", kind: "concept",
      q: "x has shape (4, 4). You compute m = x.mean(axis=1), then x - m. What happens?",
      answer: "It runs, but each row has the wrong means subtracted",
      wrong: ["A ValueError, because m has fewer axes", "It runs and is correct: each row loses its own mean", "It runs and gives an array of shape (4,)"],
      why: "m has shape (4,), one mean per row. Right-aligned, it lines up with the columns, so column j loses row j's mean. A square array hides the bug; keepdims=True gives (4, 1) and the right answer." },
    { id: "view-edit", level: "hard", kind: "concept",
      q: "y = x[:, :2], then y[0, 0] = 99. What happens to x?",
      answer: "x[0, 0] becomes 99 too, because the slice is a view",
      wrong: ["Nothing: slicing makes a copy", "A ValueError, because views are read only", "x gets a new third column"],
      why: "Basic slicing returns a view over the same memory with a new shape. That is fast, but an edit through the view changes the original. Call .copy() when you need separate data." },
    { id: "axis0-sum", level: "medium", kind: "output",
      q: "What does this print?",
      code: "import numpy as np\nx = np.arange(6).reshape(2, 3)\nprint(x.sum(axis=0).tolist())",
      answer: pyList(AR0), wrong: [pyList(AR.map((r) => r.reduce((a, b) => a + b, 0))), pyList([AR.flat().reduce((a, b) => a + b, 0)]), pyList(AR[1])],
      why: `x is ${AR.map((r) => pyList(r)).join(" over ")}. axis=0 collapses the rows, so each column is summed: ${AR0.join(", ")}. Summing each row instead (axis=1) would give ${AR.map((r) => r.reduce((a, b) => a + b, 0)).join(", ")}.` },
    { id: "int-assign", level: "hard", kind: "output",
      q: "What does this print?",
      code: `import numpy as np\nx = np.array([${INTS.join(", ")}])\nx[0] = ${NEWV}\nprint(x.tolist())`,
      answer: pyList(AFTER), wrong: [pyList([NEWV, ...INTS.slice(1)], true), pyList([Math.round(NEWV), ...INTS.slice(1)]), "A TypeError"],
      why: `The array was made from whole numbers, so its dtype is an integer type. Assigning ${NEWV} converts it to that dtype, which drops the fraction: ${Math.trunc(NEWV)}. The dtype never changes on assignment.` },
    { id: "store-memory", level: "medium", kind: "numeric",
      q: `A vector store holds ${n0(NV)} embeddings, ${DV} numbers each, in float32. How much memory do the numbers take?`,
      answer: gbOf(4), wrong: [gbOf(8), gbOf(1), `${fmt((NV * DV * 4) / 1e6)} GB`],
      why: `${n0(NV)} × ${DV} × 4 bytes = ${n0(NV * DV * 4)} bytes, about ${gbOf(4)}. In float64 it would be ${gbOf(8)}.` },
    { id: "list-vs-array", level: "easy", kind: "explain",
      q: "How is a NumPy array different from a Python list of numbers?",
      answer: "- A list holds pointers to separate Python objects, which can be of any type. An array holds raw numbers of one dtype in one block of memory.\n- An array has a shape, so the same block can be read as a matrix or a batch of matrices.\n- Arithmetic on an array runs on the whole block in compiled code. On a list, + joins the lists and maths needs a Python loop." },
    { id: "new-axis", level: "medium", kind: "explain",
      q: "What does a[:, None] do, and when do you need it?",
      answer: "None (also written np.newaxis) inserts a size 1 axis: a of shape (n,) becomes (n, 1), a column.\n\nYou need it to choose which axes broadcast against which. a[:, None] - b[None, :] pairs every entry of a with every entry of b, giving (n, m). Without it the two 1D arrays would only line up entry by entry, and fail unless n equals m." },
    { id: "reshape-transpose", level: "medium", kind: "explain",
      q: "What is the difference between reshape and transpose?",
      answer: "reshape keeps the elements in the same order and only regroups them: (2, 3) to (3, 2) reads the six numbers row by row into new rows.\n\ntranspose swaps axes, so element [i, j] moves to [j, i]: the numbers are reordered.\n\nUsing reshape where you meant transpose gives the right shape but scrambled data, a bug that raises no error." },
    { id: "debug-shapes", level: "hard", kind: "explain",
      q: "Model code fails, or gives odd numbers, because of a shape problem. How do you find it?",
      answer: "- Write the expected shape of every tensor as a comment, using named sizes such as (B, T, D).\n- Print or assert x.shape after each step, with sizes that are all different (for example B = 2, T = 3, D = 5), so a swapped axis cannot hide.\n- Check reductions for keepdims, and look for a (n,) array meeting an (n, 1) array.\n- Test on a tiny input whose answer you can work out by hand." },
    { id: "trap-no-copy", level: "medium", kind: "trap",
      claim: "Broadcasting does not copy the smaller array in memory.",
      truth: true,
      why: "NumPy uses a stride of 0 bytes along the stretched axis, so it reads the same numbers again. The code above shows a 1000-row view backed by 16 bytes." },
    { id: "trap-ndim", level: "medium", kind: "trap",
      claim: "Arrays of shape (3, 4) and (4,) cannot be added because they have a different number of axes.",
      truth: false,
      why: `Missing axes on the left count as 1. (4,) is treated as (1, 4), which broadcasts with (3, 4) to ${shapeStr(TRAP)}: the row is added to every row.` },
    { id: "trap-reshape-copy", level: "hard", kind: "trap",
      claim: "x.reshape(...) always makes a copy of the data.",
      truth: false,
      why: "When the data is already in row order, reshape returns a view over the same memory. It copies only when it must, for example after a transpose. Use .copy() when you need a guarantee." },
  ],
  real: [
    { who: "Nathaniel J. Smith", when: "2014",
      what: "PEP 465 proposed a new Python operator, @, for matrix multiplication, because Python had only * and numerical code needs both element-wise and matrix products. It landed in Python 3.5.",
      takeaway: "x @ W reads like the maths, which is why model code uses it everywhere.",
      url: "https://peps.python.org/pep-0465/" },
  ],
};
