import numpy as np

def rope(x, pos, base=10000.0):
    d = len(x)
    theta = pos / base ** (np.arange(d // 2) * 2 / d)    # one angle per pair of dimensions
    x1, x2 = x[0::2], x[1::2]
    out = np.empty(d)
    out[0::2] = x1 * np.cos(theta) - x2 * np.sin(theta)  # rotate each pair (x1, x2) by its angle
    out[1::2] = x1 * np.sin(theta) + x2 * np.cos(theta)
    return out

rng = np.random.default_rng(0)
q, k = rng.normal(size=8), rng.normal(size=8)
for m, n in [(3, 1), (10, 8), (500, 498)]:              # always 2 positions apart
    print(m, n, round(float(rope(q, m) @ rope(k, n)), 6))   # same score every time: only m - n matters
