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

export const TRANSFORMER: Lab = {
  id: "transformer",
  title: "Build a GPT from scratch",
  blurb: "Write a small GPT one function at a time. Hidden tests grade each step, and every step builds on the ones before it.",
  module: "self-attention",
  steps: [softmax, attention, causalMask],
};
