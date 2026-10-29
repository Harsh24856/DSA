import math
from collections import Counter

docs = {
    "d1": "refund policy: refunds are issued within 14 days of a return",
    "d2": "error E1042 means the payment gateway timed out",
    "d3": "to get your money back, start a return from the orders page",
    "d4": "shipping to canada takes 5 to 8 working days",
    "d5": "gift cards cannot be exchanged for cash",
}
tok = lambda s: s.lower().replace(":", " ").replace(",", " ").split()

# ---- sparse: BM25 (good at exact terms like E1042) ----
N, avgdl = len(docs), sum(len(tok(t)) for t in docs.values()) / len(docs)
df = Counter(w for t in docs.values() for w in set(tok(t)))
def bm25(query, k1=1.5, b=0.75):
    scores = {}
    for d, text in docs.items():
        tf, dl = Counter(tok(text)), len(tok(text))
        scores[d] = sum(math.log(1 + (N - df[w] + 0.5) / (df[w] + 0.5)) * tf[w] * (k1 + 1) / (tf[w] + k1 * (1 - b + b * dl / avgdl))
                        for w in tok(query) if w in tf)
    return [d for d in sorted(scores, key=scores.get, reverse=True) if scores[d] > 0]

# ---- "dense": a toy meaning space (real systems use an embedding model) ----
# Like real embeddings, it maps synonyms together and is weak on rare codes such as E1042.
SYN = {"money": "refund", "back": "refund", "return": "refund", "cash": "refund", "timed": "error", "gateway": "error"}
def embed(text):
    return Counter(SYN.get(w, w) for w in tok(text) if not any(c.isdigit() for c in w))
def cosine(a, b):
    dot = sum(a[k] * b[k] for k in a)
    return dot / (math.sqrt(sum(v * v for v in a.values())) * math.sqrt(sum(v * v for v in b.values())) or 1)
def dense(query):
    q = embed(query)
    sims = {d: cosine(q, embed(t)) for d, t in docs.items()}
    return [d for d in sorted(sims, key=sims.get, reverse=True) if sims[d] > 0]

# ---- Reciprocal Rank Fusion: no score calibration needed, only ranks ----
def rrf(*rankings, k=60):
    score = Counter()
    for ranking in rankings:
        for rank, d in enumerate(ranking, start=1):
            score[d] += 1 / (k + rank)
    return [d for d, _ in score.most_common()]

# ---- evaluate retrieval separately from generation: recall@k and MRR on labelled queries ----
labelled = {"how do I get my money back": {"d1", "d3"}, "what is E1042": {"d2"}, "delivery time to canada": {"d4"}}
def evaluate(search, k=2):
    recall = mrr = 0
    for q, relevant in labelled.items():
        top = search(q)
        recall += len(set(top[:k]) & relevant) / len(relevant)
        mrr += next((1 / (i + 1) for i, d in enumerate(top) if d in relevant), 0)
    return round(recall / len(labelled), 2), round(mrr / len(labelled), 2)

for name, search in [("bm25", bm25), ("dense", dense), ("hybrid", lambda q: rrf(bm25(q), dense(q)))]:
    print(f"{name:6} recall@2, MRR =", evaluate(search))
assert evaluate(lambda q: rrf(bm25(q), dense(q)))[0] > max(evaluate(bm25)[0], evaluate(dense)[0])   # each method misses what the other finds
