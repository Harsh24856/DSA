import math, random

# Self-consistency: sample n answers and take the majority. If one sample is right with probability p
# (and wrong answers are spread out), how often is the majority right?
def majority_correct(p, n):
    # probability that more than half of n independent samples are correct (n odd)
    return sum(math.comb(n, k) * p**k * (1 - p)**(n - k) for k in range(n // 2 + 1, n + 1))

for p in (0.4, 0.6, 0.8):
    print(p, [round(majority_correct(p, n), 3) for n in (1, 5, 15, 31)])
# p > 0.5: more samples push accuracy toward 1. p < 0.5: voting makes it WORSE. Sampling only amplifies.

# Simulation with a "plurality" vote over many possible wrong answers (closer to real use)
random.seed(1)
def run(p, n, trials=4000):
    wins = 0
    for _ in range(trials):
        votes = ["right" if random.random() < p else f"wrong{random.randrange(6)}" for _ in range(n)]
        wins += max(set(votes), key=votes.count) == "right"
    return wins / trials
print("plurality, p=0.4, n=15:", run(0.4, 15))   # wrong answers split their votes, so plurality can still win
assert majority_correct(0.8, 15) > majority_correct(0.8, 1) and majority_correct(0.4, 31) < 0.4 and run(0.4, 15) > 0.4
