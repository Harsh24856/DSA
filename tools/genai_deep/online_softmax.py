import numpy as np

rng = np.random.default_rng(0)
T, d, block = 8, 4, 3
q = rng.normal(size=d)
K, V = rng.normal(size=(T, d)), rng.normal(size=(T, d))

# reference: build all T scores, softmax, weighted sum of V
s = K @ q / np.sqrt(d)
w = np.exp(s - s.max())
ref = (w / w.sum()) @ V

# streaming (the FlashAttention idea): one block of K/V at a time, never all T scores at once
m, l, acc = -np.inf, 0.0, np.zeros(d)    # running max, running denominator, running numerator
for i in range(0, T, block):
    sb = K[i:i + block] @ q / np.sqrt(d)
    m_new = max(m, sb.max())
    fix = np.exp(m - m_new)              # rescale everything summed under the old max
    p = np.exp(sb - m_new)
    l = l * fix + p.sum()
    acc = acc * fix + p @ V[i:i + block]
    m = m_new

print(np.allclose(acc / l, ref))         # True: identical result, memory O(block) instead of O(T)
