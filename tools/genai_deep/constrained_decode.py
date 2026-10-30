import math, random

# Constrained decoding: at every step, mask out tokens that would break the format, then sample.
# Toy target format: an integer between 1 and 3 digits followed by "<end>", like {"age": 42} values.
vocab = ["0", "1", "2", "4", "7", "a", "x", " ", "-", "<end>"]

def allowed(prefix):
    digits = [t for t in prefix if t.isdigit()]
    if not prefix:
        return {t for t in vocab if t.isdigit() and t != "0"}       # no leading zero
    if len(digits) < 3:
        return {t for t in vocab if t.isdigit()} | {"<end>"}
    return {"<end>"}

def fake_logits(prefix):
    random.seed(len(prefix) * 7 + 3)           # an untrained "model": random preferences
    return {t: random.gauss(0, 2) for t in vocab}

def decode(constrained):
    out = []
    while len(out) < 6:
        logits = fake_logits(out)
        if constrained:
            ok = allowed(out)
            logits = {t: (v if t in ok else -math.inf) for t, v in logits.items()}   # the mask
        tok = max(logits, key=logits.get)      # greedy for a deterministic demo
        if tok == "<end>": break
        out.append(tok)
    return "".join(out)

free, masked = decode(False), decode(True)
print("unconstrained:", repr(free))
print("constrained:  ", repr(masked))
assert masked.isdigit() and 1 <= len(masked) <= 3 and not masked.startswith("0")
