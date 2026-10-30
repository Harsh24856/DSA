import numpy as np

rng = np.random.default_rng(0)
W = rng.normal(0, 0.02, size=(256, 256)).astype(np.float32)
W[3, 7] = 1.5                                          # one outlier weight, common in real LLMs

def quant_int8(w, axis=None):
    # symmetric int8: scale so the largest |value| maps to 127, round, then dequantize to compare
    scale = np.abs(w).max(axis=axis, keepdims=axis is not None) / 127
    q = np.clip(np.round(w / scale), -127, 127).astype(np.int8)
    return q.astype(np.float32) * scale

per_tensor = quant_int8(W)                             # one scale for the whole matrix
per_row = quant_int8(W, axis=1)                        # one scale per output row
err = lambda a: float(np.abs(a - W).mean())
print(f"mean error, per-tensor scale: {err(per_tensor):.6f}")
print(f"mean error, per-row scale:    {err(per_row):.6f}")
print(f"int8 storage: {W.size} bytes vs {W.nbytes} as float32")
# The outlier stretches the single scale, so most small weights round to 0. Per-row scales contain the damage.
assert err(per_row) < err(per_tensor)
