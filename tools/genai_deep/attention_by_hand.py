import numpy as np
np.set_printoptions(precision=2, suppress=True)

# 3 tokens, model width 4, one attention head of size 2
X = np.array([[1., 0., 1., 0.],     # "the"
              [0., 2., 0., 2.],     # "cat"
              [1., 1., 1., 1.]])    # "sat"
Wq = np.array([[1., 0.], [0., 1.], [1., 0.], [0., 1.]])
Wk = np.array([[0., 1.], [1., 0.], [0., 1.], [1., 0.]])
Wv = np.array([[1., 0.], [0., 1.], [0., 0.], [1., 1.]])

Q, K, V = X @ Wq, X @ Wk, X @ Wv                 # each (3, 2): one row per token
S = Q @ K.T / np.sqrt(2)                          # (3, 3) scores: row = query, column = key
S = S + np.triu(np.full((3, 3), -np.inf), k=1)    # causal mask: a token cannot see later tokens
A = np.exp(S - S.max(axis=1, keepdims=True))
A = A / A.sum(axis=1, keepdims=True)              # softmax per row: every row sums to 1
out = A @ V                                       # (3, 2): each row is a weighted mix of V rows

for name, M in [("Q", Q), ("K", K), ("V", V), ("scores", S), ("weights", A), ("output", out)]:
    print(name, "=", np.round(M, 3).tolist())
