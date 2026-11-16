// "Build a GPT from scratch": one function per step. Each step's tests are shared by NumPy and PyTorch;
// the references of earlier steps run before the learner's code, so a step may call them.
import type { Lab, LabStep } from "./types.ts";

const SOFTMAX_REF = `
def _ref_softmax(x):
    x = np.asarray(x, dtype=np.float64)
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)
`;

const softmax: LabStep = {
  id: "softmax",
  title: "Softmax",
  goal: "Turn a row of scores into weights that are positive and add up to 1, along the last axis. Large scores must not overflow, so shift each row by its maximum before taking exp; the answer does not change.",
  signature: "softmax(x)",
  starter: {
    numpy: `def softmax(x):
    """Softmax along the last axis of a NumPy array of any rank."""
    raise NotImplementedError
`,
    torch: `def softmax(x):
    """Softmax along the last axis of a torch tensor of any rank. Use torch ops only."""
    raise NotImplementedError
`,
  },
  reference: {
    numpy: `def softmax(x):
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)
`,
    torch: `def softmax(x):
    e = torch.exp(x - x.amax(dim=-1, keepdim=True))
    return e / e.sum(dim=-1, keepdim=True)
`,
  },
  tests: `${SOFTMAX_REF}
_rng = np.random.default_rng(1)

@test
def test_matches_reference():
    x = T(_rng.normal(size=(3, 5)))
    close(softmax(x), _ref_softmax(to_np(x)), 1e-6)

@test
def test_rows_sum_to_one():
    s = to_np(softmax(T(_rng.normal(size=(3, 5)))))
    assert np.allclose(s.sum(axis=-1), 1, atol=1e-6), f"rows sum to {s.sum(axis=-1)}, expected 1 each"

@test
def test_large_scores_stay_finite():
    s = to_np(softmax(T([[1000.0, 1001.0]])))
    assert not np.isnan(s).any(), "got NaN: exp(1000) overflows, subtract the row max first"
    close(s, [[0.2689, 0.7311]], 5e-5)

@test
def test_works_on_3d_input():
    x = T(_rng.normal(size=(2, 3, 4)))
    close(softmax(x), _ref_softmax(to_np(x)), 1e-6)
`,
  hints: [
    "Keep the reduced axis with keepdims=True (keepdim=True in torch) so the result broadcasts back over the row.",
    "Subtracting the same number from every score in a row leaves the softmax unchanged, and after subtracting the max the largest exp is exp(0) = 1.",
  ],
};

const attention: LabStep = {
  id: "attention",
  title: "Scaled dot-product attention",
  goal: "Score every query against every key, divide by the square root of the key size, turn the scores into weights with your softmax, and mix the values with those weights. Where the mask is False the weight must be exactly 0. Return both the output and the weights.",
  signature: "attention(q, k, v, mask=None) -> (out, weights)",
  starter: {
    numpy: `def attention(q, k, v, mask=None):
    """q, k, v have shape (..., t, d). mask is None or a bool array that broadcasts to (..., t, t).
    Returns (out, weights) with shapes (..., t, d) and (..., t, t)."""
    raise NotImplementedError
`,
    torch: `def attention(q, k, v, mask=None):
    """q, k, v are tensors of shape (..., t, d). mask is None or a bool tensor that broadcasts to (..., t, t).
    Returns (out, weights) with shapes (..., t, d) and (..., t, t). Use torch ops only."""
    raise NotImplementedError
`,
  },
  reference: {
    numpy: `def attention(q, k, v, mask=None):
    scores = q @ np.swapaxes(k, -1, -2) / np.sqrt(q.shape[-1])
    if mask is not None:
        scores = np.where(mask, scores, -np.inf)
    w = softmax(scores)
    return w @ v, w
`,
    torch: `def attention(q, k, v, mask=None):
    scores = q @ k.transpose(-2, -1) / q.shape[-1] ** 0.5
    if mask is not None:
        scores = scores.masked_fill(~mask, float("-inf"))
    w = softmax(scores)
    return w @ v, w
`,
  },
  tests: `${SOFTMAX_REF}
def _ref_attention(q, k, v, mask=None):
    s = q @ np.swapaxes(k, -1, -2) / np.sqrt(q.shape[-1])
    if mask is not None:
        s = np.where(mask, s, -np.inf)
    w = _ref_softmax(s)
    return w @ v, w

_rng = np.random.default_rng(2)
_q, _k, _v = (T(_rng.normal(size=(2, 4, 8))) for _ in range(3))
_qkv = [to_np(x).astype(np.float64) for x in (_q, _k, _v)]
_keep = np.tril(np.ones((4, 4), dtype=bool))

@test
def test_shapes():
    out, w = attention(_q, _k, _v)
    check_shape(out, (2, 4, 8), "out")
    check_shape(w, (2, 4, 4), "weights")

@test
def test_weights_rows_sum_to_one():
    w = to_np(attention(_q, _k, _v)[1])
    assert np.allclose(w.sum(axis=-1), 1, atol=1e-5), f"weight rows sum to {w.sum(axis=-1)}, expected 1 each"

@test
def test_matches_reference():
    out, w = attention(_q, _k, _v)
    ref_out, ref_w = _ref_attention(*_qkv)
    close(w, ref_w, 1e-5, "weights")
    close(out, ref_out, 1e-5, "out")

@test
def test_mask_gives_zero_weight():
    out, w = attention(_q, _k, _v, T(_keep) > 0)
    ref_out, ref_w = _ref_attention(*_qkv, _keep)
    check_shape(w, (2, 4, 4), "weights")
    hidden = to_np(w)[:, ~_keep]
    assert (hidden == 0).all(), f"masked weights should be exactly 0, largest is {np.abs(hidden).max():.2e}: set masked scores to -inf before softmax"
    close(w, ref_w, 1e-5, "weights")
    close(out, ref_out, 1e-5, "out")
`,
  hints: [
    "Swap the last two axes of k (np.swapaxes(k, -1, -2), or k.transpose(-2, -1)) so q @ k^T gives a (t, t) score grid.",
    "Divide by the square root of q.shape[-1], the size of one query vector.",
    "Put -inf where the mask is False before the softmax: exp(-inf) is exactly 0.",
  ],
};

const causalMask: LabStep = {
  id: "causal-mask",
  title: "Causal mask",
  goal: "A GPT reads left to right, so position i may only look at positions 0 to i. Build a boolean (t, t) mask that is True on and below the diagonal and False above it.",
  signature: "causal_mask(t)",
  starter: {
    numpy: `def causal_mask(t):
    """Bool array of shape (t, t): True where the column is at or before the row."""
    raise NotImplementedError
`,
    torch: `def causal_mask(t):
    """Bool tensor of shape (t, t): True where the column is at or before the row. Use torch ops only."""
    raise NotImplementedError
`,
  },
  reference: {
    numpy: `def causal_mask(t):
    return np.tril(np.ones((t, t), dtype=bool))
`,
    torch: `def causal_mask(t):
    return torch.tril(torch.ones(t, t, dtype=torch.bool))
`,
  },
  tests: `
def _exact(t):
    m = to_np(causal_mask(t))
    want = np.tril(np.ones((t, t), dtype=bool))
    check_shape(m, (t, t), "mask")
    assert np.array_equal(m, want), f"expected\\n{want.astype(int)}\\ngot\\n{m.astype(int)}"

@test
def test_one_position():
    _exact(1)

@test
def test_four_positions():
    _exact(4)

@test
def test_dtype_is_bool():
    m = to_np(causal_mask(4))
    assert m.dtype == np.bool_, f"expected dtype bool, got {m.dtype}"

@test
def test_count_for_seven():
    m = to_np(causal_mask(7))
    check_shape(m, (7, 7), "mask")
    assert int(m.sum()) == 28, f"expected 28 True values (7 * 8 / 2), got {int(m.sum())}"
`,
  hints: [
    "np.tril keeps the lower triangle, diagonal included; torch.tril does the same for tensors.",
    "Start from a (t, t) array of ones with dtype bool, so the result is already boolean.",
  ],
};

// Hidden NumPy (float64) references and random parameter builders shared by the tests of steps 4 to 10.
// Tests build parameters in NumPy, move them to the learner's framework with _fw, and compute the
// reference from _back(_fw(p)) so float32 rounding of the inputs never counts against the learner.
const HIDDEN = `
${SOFTMAX_REF}
def _ref_attention(q, k, v, mask=None):
    s = q @ np.swapaxes(k, -1, -2) / np.sqrt(q.shape[-1])
    if mask is not None:
        s = np.where(mask, s, -np.inf)
    w = _ref_softmax(s)
    return w @ v, w

def _ref_mha(x, p, h, mask=None):
    B, t, d = x.shape
    sp = lambda y: y.reshape(B, t, h, d // h).transpose(0, 2, 1, 3)
    o, _ = _ref_attention(sp(x @ p["wq"]), sp(x @ p["wk"]), sp(x @ p["wv"]), mask)
    return o.transpose(0, 2, 1, 3).reshape(B, t, d) @ p["wo"]

def _ref_ln(x, g, b, eps=1e-5):
    mu = x.mean(axis=-1, keepdims=True)
    var = x.var(axis=-1, keepdims=True)
    return (x - mu) / np.sqrt(var + eps) * g + b

def _ref_ffn(x, p):
    h = x @ p["w1"] + p["b1"]
    h = 0.5 * h * (1 + np.tanh(np.sqrt(2 / np.pi) * (h + 0.044715 * h ** 3)))
    return h @ p["w2"] + p["b2"]

def _ref_block(x, p, h):
    m = np.tril(np.ones((x.shape[1], x.shape[1]), dtype=bool))
    x = x + _ref_mha(_ref_ln(x, p["ln1_g"], p["ln1_b"]), p["attn"], h, m)
    return x + _ref_ffn(_ref_ln(x, p["ln2_g"], p["ln2_b"]), p["ffn"])

def _ref_forward(idx, p, h):
    idx = np.asarray(idx)
    x = p["wte"][idx] + p["wpe"][: idx.shape[1]]
    for bp in p["blocks"]:
        x = _ref_block(x, bp, h)
    return _ref_ln(x, p["lnf_g"], p["lnf_b"]) @ p["wte"].T

def _ref_generate(idx, p, h, n):
    idx = np.asarray(idx)
    for _ in range(n):
        nxt = _ref_forward(idx[:, -p["ctx"]:], p, h)[:, -1].argmax(-1)
        idx = np.concatenate([idx, nxt[:, None]], axis=1)
    return idx

def _rand_attn(rng, d, s=0.3):
    return {k: rng.normal(size=(d, d)) * s for k in ("wq", "wk", "wv", "wo")}

def _rand_ffn(rng, d, s=0.3):
    return {"w1": rng.normal(size=(d, 4 * d)) * s, "b1": rng.normal(size=4 * d) * s,
            "w2": rng.normal(size=(4 * d, d)) * s, "b2": rng.normal(size=d) * s}

def _rand_block(rng, d, s=0.3):
    return {"ln1_g": 1 + 0.1 * rng.normal(size=d), "ln1_b": 0.1 * rng.normal(size=d), "attn": _rand_attn(rng, d, s),
            "ln2_g": 1 + 0.1 * rng.normal(size=d), "ln2_b": 0.1 * rng.normal(size=d), "ffn": _rand_ffn(rng, d, s)}

def _rand_gpt(rng, vocab, d, n_layers, ctx, s=0.3):
    return {"wte": rng.normal(size=(vocab, d)) * s, "wpe": rng.normal(size=(ctx, d)) * s,
            "blocks": [_rand_block(rng, d, s) for _ in range(n_layers)],
            "lnf_g": np.ones(d), "lnf_b": np.zeros(d), "ctx": ctx}

def _fw(p):
    if isinstance(p, dict):
        return {k: _fw(v) for k, v in p.items()}
    if isinstance(p, list):
        return [_fw(v) for v in p]
    return T(p) if isinstance(p, np.ndarray) else p

def _back(p):
    if isinstance(p, dict):
        return {k: _back(v) for k, v in p.items()}
    if isinstance(p, list):
        return [_back(v) for v in p]
    return p if isinstance(p, (int, float)) else to_np(p).astype(np.float64)
`;

const mha: LabStep = {
  id: "multi-head-attention",
  title: "Multi-head attention",
  goal: "Project x into queries, keys and values, cut the last axis into n_heads equal heads, run your attention on every head at once, glue the heads back together and project with wo. If d does not split evenly into n_heads, raise ValueError.",
  signature: "multi_head_attention(x, p, n_heads, mask=None)",
  starter: {
    numpy: `def multi_head_attention(x, p, n_heads, mask=None):
    """x has shape (B, t, d). p holds wq, wk, wv, wo, each (d, d). mask is None or a bool (t, t) array.
    Returns an array of shape (B, t, d)."""
    raise NotImplementedError
`,
    torch: `def multi_head_attention(x, p, n_heads, mask=None):
    """x is a tensor of shape (B, t, d). p holds wq, wk, wv, wo, each (d, d). mask is None or a bool (t, t) tensor.
    Returns a tensor of shape (B, t, d). Use torch ops only."""
    raise NotImplementedError
`,
  },
  reference: {
    numpy: `def multi_head_attention(x, p, n_heads, mask=None):
    B, t, d = x.shape
    if d % n_heads:
        raise ValueError(f"d = {d} does not split into {n_heads} heads")
    def split(y):
        return y.reshape(B, t, n_heads, d // n_heads).transpose(0, 2, 1, 3)
    out, _ = attention(split(x @ p["wq"]), split(x @ p["wk"]), split(x @ p["wv"]), mask)
    return out.transpose(0, 2, 1, 3).reshape(B, t, d) @ p["wo"]
`,
    torch: `def multi_head_attention(x, p, n_heads, mask=None):
    B, t, d = x.shape
    if d % n_heads:
        raise ValueError(f"d = {d} does not split into {n_heads} heads")
    def split(y):
        return y.reshape(B, t, n_heads, d // n_heads).transpose(1, 2)
    out, _ = attention(split(x @ p["wq"]), split(x @ p["wk"]), split(x @ p["wv"]), mask)
    return out.transpose(1, 2).reshape(B, t, d) @ p["wo"]
`,
  },
  tests: `${HIDDEN}
_rng = np.random.default_rng(4)
_x0 = _rng.normal(size=(2, 5, 16))
_p0 = _rand_attn(_rng, 16)
_x, _p = T(_x0), _fw(_p0)
_xr, _pr = _back(_x), _back(_p)
_keep = np.tril(np.ones((5, 5), dtype=bool))

@test
def test_shape_with_four_heads():
    check_shape(multi_head_attention(_x, _p, 4), (2, 5, 16))

@test
def test_matches_reference():
    close(multi_head_attention(_x, _p, 4), _ref_mha(_xr, _pr, 4))

@test
def test_matches_reference_with_mask():
    close(multi_head_attention(_x, _p, 4, T(_keep) > 0), _ref_mha(_xr, _pr, 4, _keep))

@test
def test_one_head_is_plain_attention():
    out, _ = _ref_attention(_xr @ _pr["wq"], _xr @ _pr["wk"], _xr @ _pr["wv"])
    close(multi_head_attention(_x, _p, 1), out @ _pr["wo"], what="one head")

@test
def test_uneven_heads_raise_value_error():
    try:
        multi_head_attention(_x, _p, 3)
    except ValueError:
        return
    raise AssertionError("16 does not split into 3 heads: expected a ValueError")
`,
  hints: [
    "Each head works on its own slice of d // n_heads features. Reshape the last axis into (heads, head size), then move the head axis next to the batch axis so attention treats heads like extra batch entries.",
    "Your attention from step 2 already handles any number of leading axes, and a (t, t) mask broadcasts over batch and heads.",
    "To merge, undo the axis move, flatten the heads back into d, then multiply by wo.",
  ],
};

const layerNorm: LabStep = {
  id: "layer-norm",
  title: "Layer norm",
  goal: "For every token vector, subtract its mean and divide by its standard deviation (with eps inside the square root), then scale by g and shift by b. Statistics are taken over the last axis only.",
  signature: "layer_norm(x, g, b, eps=1e-5)",
  starter: {
    numpy: `def layer_norm(x, g, b, eps=1e-5):
    """Normalise each vector along the last axis, then scale by g and shift by b (both shape (d,))."""
    raise NotImplementedError
`,
    torch: `def layer_norm(x, g, b, eps=1e-5):
    """Normalise each vector along the last axis, then scale by g and shift by b (both shape (d,)).
    Use torch ops only."""
    raise NotImplementedError
`,
  },
  reference: {
    numpy: `def layer_norm(x, g, b, eps=1e-5):
    mu = x.mean(axis=-1, keepdims=True)
    var = x.var(axis=-1, keepdims=True)
    return (x - mu) / np.sqrt(var + eps) * g + b
`,
    torch: `def layer_norm(x, g, b, eps=1e-5):
    mu = x.mean(dim=-1, keepdim=True)
    var = ((x - mu) ** 2).mean(dim=-1, keepdim=True)
    return (x - mu) / torch.sqrt(var + eps) * g + b
`,
  },
  tests: `${HIDDEN}
_rng = np.random.default_rng(5)
_x = T(_rng.normal(2.0, 3.0, size=(2, 4, 8)))
_g, _b = T(1 + 0.5 * _rng.normal(size=8)), T(_rng.normal(size=8))

@test
def test_matches_reference():
    close(layer_norm(_x, _g, _b), _ref_ln(*(to_np(a).astype(np.float64) for a in (_x, _g, _b))))

@test
def test_unit_gain_gives_mean_zero_variance_one():
    y = to_np(layer_norm(_x, T(np.ones(8)), T(np.zeros(8)))).astype(np.float64)
    check_shape(y, (2, 4, 8))
    assert np.allclose(y.mean(axis=-1), 0, atol=1e-4), f"row means are {y.mean(axis=-1).round(4)}, expected 0"
    assert np.allclose(y.var(axis=-1), 1, atol=1e-3), f"row variances are {y.var(axis=-1).round(4)}, expected 1"
`,
  hints: [
    "Take the mean and variance over the last axis only, and keep that axis so they broadcast back.",
    "Use the plain variance that divides by d, not the sample variance that divides by d - 1.",
    "eps goes inside the square root, next to the variance.",
  ],
};

const feedForward: LabStep = {
  id: "feed-forward",
  title: "Feed-forward layer",
  goal: "Widen each token vector to 4d with w1 and b1, apply GELU (the tanh approximation), then bring it back to d with w2 and b2. Every position is handled on its own.",
  signature: "feed_forward(x, p)",
  starter: {
    numpy: `def feed_forward(x, p):
    """x has shape (..., d). p holds w1 (d, 4d), b1 (4d,), w2 (4d, d), b2 (d,).
    GELU(h) = 0.5 * h * (1 + tanh(sqrt(2 / pi) * (h + 0.044715 * h**3)))."""
    raise NotImplementedError
`,
    torch: `def feed_forward(x, p):
    """x is a tensor of shape (..., d). p holds w1 (d, 4d), b1 (4d,), w2 (4d, d), b2 (d,).
    GELU(h) = 0.5 * h * (1 + tanh(sqrt(2 / pi) * (h + 0.044715 * h**3))). Use torch ops only."""
    raise NotImplementedError
`,
  },
  reference: {
    numpy: `def feed_forward(x, p):
    h = x @ p["w1"] + p["b1"]
    h = 0.5 * h * (1 + np.tanh(np.sqrt(2 / np.pi) * (h + 0.044715 * h ** 3)))
    return h @ p["w2"] + p["b2"]
`,
    torch: `import math

def feed_forward(x, p):
    h = x @ p["w1"] + p["b1"]
    h = 0.5 * h * (1 + torch.tanh(math.sqrt(2 / math.pi) * (h + 0.044715 * h ** 3)))
    return h @ p["w2"] + p["b2"]
`,
  },
  tests: `${HIDDEN}
_rng = np.random.default_rng(6)
_x = T(_rng.normal(size=(2, 3, 8)))
_p = _fw(_rand_ffn(_rng, 8))

@test
def test_matches_reference():
    close(feed_forward(_x, _p), _ref_ffn(_back(_x), _back(_p)))

@test
def test_gelu_of_zero_is_zero():
    q = dict(_p, b1=T(np.zeros(32)))
    close(feed_forward(T(np.zeros((1, 2, 8))), q), np.broadcast_to(to_np(_p["b2"]).astype(np.float64), (1, 2, 8)), 1e-6,
          "with x = 0 and b1 = 0 the hidden layer is GELU(0), so the output should be b2")
`,
  hints: [
    "Two matrix products with an activation between them; the biases broadcast over every position.",
    "GELU is smooth where ReLU has a corner: close to h for large h, close to 0 for very negative h, and exactly 0 at 0.",
  ],
};

const block: LabStep = {
  id: "block",
  title: "Transformer block",
  goal: "Put the pieces together in pre-norm order: normalise, run causal multi-head attention and add the result to x; then normalise again, run the feed-forward layer and add that too.",
  signature: "block(x, p, n_heads)",
  starter: {
    numpy: `def block(x, p, n_heads):
    """x has shape (B, t, d). p holds ln1_g, ln1_b, attn (wq, wk, wv, wo), ln2_g, ln2_b, ffn (w1, b1, w2, b2).
    Position i may only attend to positions 0 to i. Returns shape (B, t, d)."""
    raise NotImplementedError
`,
    torch: `def block(x, p, n_heads):
    """x is a tensor of shape (B, t, d). p holds ln1_g, ln1_b, attn (wq, wk, wv, wo), ln2_g, ln2_b, ffn (w1, b1, w2, b2).
    Position i may only attend to positions 0 to i. Returns shape (B, t, d). Use torch ops only."""
    raise NotImplementedError
`,
  },
  reference: {
    numpy: `def block(x, p, n_heads):
    mask = causal_mask(x.shape[1])
    x = x + multi_head_attention(layer_norm(x, p["ln1_g"], p["ln1_b"]), p["attn"], n_heads, mask)
    return x + feed_forward(layer_norm(x, p["ln2_g"], p["ln2_b"]), p["ffn"])
`,
    torch: `def block(x, p, n_heads):
    mask = causal_mask(x.shape[1])
    x = x + multi_head_attention(layer_norm(x, p["ln1_g"], p["ln1_b"]), p["attn"], n_heads, mask)
    return x + feed_forward(layer_norm(x, p["ln2_g"], p["ln2_b"]), p["ffn"])
`,
  },
  tests: `${HIDDEN}
_rng = np.random.default_rng(7)
_x0 = _rng.normal(size=(2, 6, 16))
_x, _p = T(_x0), _fw(_rand_block(_rng, 16))

@test
def test_matches_reference():
    close(block(_x, _p, 4), _ref_block(_back(_x), _back(_p), 4))

@test
def test_future_tokens_stay_hidden():
    x2 = _x0.copy()
    x2[:, 3] += np.random.default_rng(70).normal(size=16)   # not a constant: layer norm would erase a uniform shift
    a, b = to_np(block(_x, _p, 4)), to_np(block(T(x2), _p, 4))
    check_shape(a, (2, 6, 16))
    assert np.allclose(a[:, :3], b[:, :3], atol=1e-5), "changing token 3 changed positions 0 to 2: attention must use the causal mask"
    assert not np.allclose(a[:, 3], b[:, 3], atol=1e-5), "changing token 3 did not change position 3"
`,
  hints: [
    "Each sub-layer reads a normalised copy of x, and its output is added back onto x itself (the residual path).",
    "Build the mask with your causal_mask from the length of the sequence, so it fits any t.",
    "The working versions of your earlier steps are already defined and call each other by name, so keep every function's name and arguments as the earlier steps gave them.",
  ],
};

const gptForward: LabStep = {
  id: "gpt-forward",
  title: "GPT forward pass",
  goal: "Turn token ids into vectors with wte, add the position vectors from wpe, run every block in order, normalise once more, and score every vocabulary entry by multiplying with wte transposed (the same table, reused as the output layer).",
  signature: "gpt_forward(idx, p, n_heads)",
  starter: {
    numpy: `def gpt_forward(idx, p, n_heads):
    """idx is an int array (B, t). p holds wte (vocab, d), wpe (ctx, d), blocks (a list of block params),
    lnf_g and lnf_b. Returns logits of shape (B, t, vocab)."""
    raise NotImplementedError
`,
    torch: `def gpt_forward(idx, p, n_heads):
    """idx is a long tensor (B, t). p holds wte (vocab, d), wpe (ctx, d), blocks (a list of block params),
    lnf_g and lnf_b. Returns logits of shape (B, t, vocab). Use torch ops only."""
    raise NotImplementedError
`,
  },
  reference: {
    numpy: `def gpt_forward(idx, p, n_heads):
    x = p["wte"][idx] + p["wpe"][: idx.shape[1]]
    for bp in p["blocks"]:
        x = block(x, bp, n_heads)
    return layer_norm(x, p["lnf_g"], p["lnf_b"]) @ p["wte"].T
`,
    torch: `def gpt_forward(idx, p, n_heads):
    x = p["wte"][idx] + p["wpe"][: idx.shape[1]]
    for bp in p["blocks"]:
        x = block(x, bp, n_heads)
    return layer_norm(x, p["lnf_g"], p["lnf_b"]) @ p["wte"].T
`,
  },
  tests: `${HIDDEN}
_rng = np.random.default_rng(8)
_p0 = _rand_gpt(_rng, 11, 16, 2, 8)
_p = _fw(_p0)
_pr = _back(_p)
_idx = _rng.integers(0, 11, size=(2, 7))

@test
def test_logits_shape():
    check_shape(gpt_forward(I(_idx), _p, 4), (2, 7, 11), "logits")

@test
def test_matches_reference():
    close(gpt_forward(I(_idx), _p, 4), _ref_forward(_idx, _pr, 4), what="logits")

@test
def test_future_tokens_stay_hidden():
    idx2 = _idx.copy()
    idx2[:, 3] = (idx2[:, 3] + 1) % 11
    a, b = to_np(gpt_forward(I(_idx), _p, 4)), to_np(gpt_forward(I(idx2), _p, 4))
    assert np.allclose(a[:, :3], b[:, :3], atol=1e-5), "changing token 3 changed the logits at positions 0 to 2"
    assert not np.allclose(a[:, 3], b[:, 3], atol=1e-5), "changing token 3 did not change the logits at position 3"
`,
  hints: [
    "Indexing the embedding table with the id array picks one row per token; position t uses row t of wpe.",
    "Tied weights: the output layer is the token table itself, so a token scores high when the final vector points the same way as its embedding.",
  ],
};

const generate: LabStep = {
  id: "generate",
  title: "Greedy generation",
  goal: "Grow the sequence one token at a time: run the model on the last ctx tokens, take the most likely next token at the final position, append it, and repeat n_new times.",
  signature: "generate(idx, p, n_heads, n_new)",
  starter: {
    numpy: `def generate(idx, p, n_heads, n_new):
    """idx is an int array (B, t), which may be longer than p["ctx"]. Returns (B, t + n_new)."""
    raise NotImplementedError
`,
    torch: `def generate(idx, p, n_heads, n_new):
    """idx is a long tensor (B, t), which may be longer than p["ctx"]. Returns (B, t + n_new). Use torch ops only."""
    raise NotImplementedError
`,
  },
  reference: {
    numpy: `def generate(idx, p, n_heads, n_new):
    for _ in range(n_new):
        logits = gpt_forward(idx[:, -p["ctx"]:], p, n_heads)
        nxt = logits[:, -1].argmax(-1)
        idx = np.concatenate([idx, nxt[:, None]], axis=1)
    return idx
`,
    torch: `def generate(idx, p, n_heads, n_new):
    for _ in range(n_new):
        logits = gpt_forward(idx[:, -p["ctx"]:], p, n_heads)
        nxt = logits[:, -1].argmax(-1)
        idx = torch.cat([idx, nxt[:, None]], dim=1)
    return idx
`,
  },
  tests: `${HIDDEN}
_rng = np.random.default_rng(9)
_p = _fw(_rand_gpt(_rng, 11, 16, 2, 8))
_pr = _back(_p)
_idx = _rng.integers(0, 11, size=(2, 3))

@test
def test_output_length():
    check_shape(generate(I(_idx), _p, 4, 5), (2, 8), "tokens")

@test
def test_matches_reference():
    got = to_np(generate(I(_idx), _p, 4, 5))
    want = _ref_generate(_idx, _pr, 4, 5)
    check_shape(got, want.shape, "tokens")
    assert np.array_equal(got, want), f"expected tokens {want.tolist()}, got {got.tolist()}"

@test
def test_long_input_is_cropped_to_ctx():
    idx = _rng.integers(0, 11, size=(1, 10))
    got = to_np(generate(I(idx), _p, 4, 3))
    want = _ref_generate(idx, _pr, 4, 3)
    check_shape(got, (1, 13), "tokens")
    assert np.array_equal(got, want), f"expected tokens {want.tolist()}, got {got.tolist()}: feed the model only the last ctx = 8 tokens"
`,
  hints: [
    "The model only knows ctx positions, so slice the sequence to its last ctx tokens before each forward pass.",
    "Only the logits at the final position matter for the next token; greedy means take the largest one.",
    "Append the new token as a column so the batch shape stays (B, t + 1).",
  ],
};

const trainStep: LabStep = {
  id: "train-step",
  title: "Training step",
  goal: "Teach the model to predict the next character. Run gpt_forward on the inputs, score it with cross-entropy against the targets, let autograd find the gradients, and take one AdamW step. Return the loss from before the update.",
  signature: "train_step(model_params, batch, lr) -> float",
  starter: {
    torch: `def train_step(model_params, batch, lr):
    """model_params is the GPT parameter dict from step 8 (every tensor has requires_grad=True), plus
    "n_heads" and "ctx". batch is (x, y), two long tensors of shape (B, t), where y is x shifted left by one.
    Keep the AdamW optimizer in model_params["opt"] so its state carries over between calls.
    Returns the loss as a Python float."""
    raise NotImplementedError
`,
  },
  reference: {
    torch: `def _leaves(p):
    if isinstance(p, dict):
        for v in p.values():
            yield from _leaves(v)
    elif isinstance(p, list):
        for v in p:
            yield from _leaves(v)
    elif torch.is_tensor(p) and p.requires_grad:
        yield p

def train_step(model_params, batch, lr):
    if "opt" not in model_params:
        model_params["opt"] = torch.optim.AdamW(list(_leaves(model_params)), lr=lr)
    opt = model_params["opt"]
    x, y = batch
    logits = gpt_forward(x, model_params, model_params["n_heads"])
    loss = torch.nn.functional.cross_entropy(logits.reshape(-1, logits.shape[-1]), y.reshape(-1))
    opt.zero_grad()
    loss.backward()
    opt.step()
    return loss.item()
`,
  },
  tests: `import time
_T0 = time.perf_counter()   # the whole step, model building and optimizer included, must fit in 15 s on one CPU
torch.set_num_threads(1)
${HIDDEN}
_TEXT = ("a small model learns to spell by guessing the next letter. "
         "it sees a window of text, scores every letter, and nudges its weights "
         "toward the one that came next. after many tries the guesses get better.")
assert len(_TEXT) == 200
_chars = sorted(set(_TEXT))
_data = torch.tensor([_chars.index(c) for c in _TEXT])

def _model(seed):
    p = _fw(_rand_gpt(np.random.default_rng(seed), len(_chars), 32, 2, 32, s=0.1))
    for t in _leaves_of(p):
        t.requires_grad_(True)
    p["n_heads"] = 2
    return p

def _leaves_of(p):
    if isinstance(p, dict):
        return [t for v in p.values() for t in _leaves_of(v)]
    if isinstance(p, list):
        return [t for v in p for t in _leaves_of(v)]
    return [p] if torch.is_tensor(p) else []

def _batch(g, n=16, t=32):
    s = torch.randint(0, len(_data) - t - 1, (n,), generator=g)
    return torch.stack([_data[i:i + t] for i in s]), torch.stack([_data[i + 1:i + t + 1] for i in s])

@test
def test_first_loss_is_cross_entropy_and_weights_move():
    p = _model(10)
    x, y = _batch(torch.Generator().manual_seed(1))
    logits = _ref_forward(to_np(x), _back(p), 2)
    logits = logits - logits.max(axis=-1, keepdims=True)
    logp = logits - np.log(np.exp(logits).sum(axis=-1, keepdims=True))
    want = float(-np.take_along_axis(logp, to_np(y)[..., None], -1).mean())
    before = to_np(p["wte"]).copy()
    got = train_step(p, (x, y), 1e-2)
    assert isinstance(got, float), f"expected a Python float, got {type(got).__name__}: use loss.item()"
    assert abs(got - want) < 1e-4, f"loss: expected {want:.4f} (mean cross-entropy before the update), got {got:.4f}"
    assert not np.allclose(to_np(p["wte"]), before), "wte did not change: call backward() and step the optimizer"

@test
def test_loss_falls_in_60_steps_within_15_s():
    p, g = _model(11), torch.Generator().manual_seed(2)
    losses = [train_step(p, _batch(g), 1e-2) for _ in range(60)]
    assert losses[-1] < 0.6 * losses[0], f"loss went from {losses[0]:.3f} to {losses[-1]:.3f}, expected below {0.6 * losses[0]:.3f}"
    took = time.perf_counter() - _T0
    assert took < 15, f"training took {took:.1f} s on one CPU, limit 15 s"
`,
  hints: [
    "Cross-entropy wants one row of logits per prediction, so flatten batch and time together for both logits and targets.",
    "Create the optimizer once, the first time, over every tensor that needs a gradient; a fresh AdamW each call forgets its running averages.",
    "Clear old gradients before backward, or they add up across steps.",
  ],
};

export const TRANSFORMER: Lab = {
  id: "transformer",
  title: "Build a GPT from scratch",
  blurb: "Write a small GPT one function at a time. Hidden tests grade each step, and every step builds on the ones before it.",
  module: "self-attention",
  steps: [softmax, attention, causalMask, mha, layerNorm, feedForward, block, gptForward, generate, trainStep],
};
