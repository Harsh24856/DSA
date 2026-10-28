import numpy as np
from sklearn.cluster import KMeans

rng = np.random.default_rng(0)
d, N = 64, 20_000
centers = rng.normal(size=(200, d)) * 3                          # real embeddings are clustered by topic
X = (centers[rng.integers(0, 200, N)] + rng.normal(size=(N, d))).astype("float32")
Q = X[rng.choice(N, 100)] + 0.3 * rng.normal(size=(100, d)).astype("float32")

def exact(q, k=10):
    return np.argsort(((X - q) ** 2).sum(1))[:k]

# IVF: cluster the vectors into cells; a query scans only its nprobe nearest cells
nlist, nprobe = 100, 8
ivf = KMeans(nlist, n_init=1, random_state=0).fit(X)
cells = [np.where(ivf.labels_ == c)[0] for c in range(nlist)]

# PQ: cut each vector into m pieces and store each piece as the id of its nearest of 256 centroids
m, sub = 8, d // 8
books = [KMeans(256, n_init=1, random_state=0).fit(X[:, j * sub:(j + 1) * sub]) for j in range(m)]
codes = np.stack([b.labels_ for b in books], axis=1).astype(np.uint8)    # 8 bytes per vector instead of 256

def search(q, k=10, rerank=0):
    near = np.argsort(((ivf.cluster_centers_ - q) ** 2).sum(1))[:nprobe]
    ids = np.concatenate([cells[c] for c in near])
    # asymmetric distance: one small table per piece, then m lookups per stored vector
    table = np.stack([((books[j].cluster_centers_ - q[j * sub:(j + 1) * sub]) ** 2).sum(1) for j in range(m)])
    approx = table[np.arange(m), codes[ids]].sum(1)
    order = ids[np.argsort(approx)]
    if rerank:                                    # optional: re-score the best candidates with full vectors
        cand = order[:rerank]
        order = cand[np.argsort(((X[cand] - q) ** 2).sum(1))]
    return order[:k]

for rr in (0, 100):
    recall = np.mean([len(set(search(q, rerank=rr)) & set(exact(q))) / 10 for q in Q])
    print(f"rerank {rr:>3}: recall@10 = {recall:.2f}")
print(f"scans {nprobe / nlist:.0%} of cells; codes use {codes.nbytes / X.nbytes:.1%} of the float memory")
