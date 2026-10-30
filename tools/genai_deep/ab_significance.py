import math, random

# New prompt scored 0.82 on 200 eval items; old prompt scored 0.78. Is the gain real or noise?
n, old_acc, new_acc = 200, 0.78, 0.82      # 156 -> 164 correct

def ci_diff(p1, p2, n, z=1.96):
    se = math.sqrt(p1 * (1 - p1) / n + p2 * (1 - p2) / n)      # standard error of the difference
    d = p2 - p1
    return d - z * se, d + z * se

lo, hi = ci_diff(old_acc, new_acc, n)
print(f"difference {new_acc - old_acc:+.2f}, 95% CI [{lo:+.3f}, {hi:+.3f}]")   # crosses 0: not proven

# Paired bootstrap on per-item results is better when both prompts ran on the same items.
random.seed(0)
old = [1] * 156 + [0] * 44                 # 78% correct
new = old[:]                               # same items: the new prompt fixes 10 and breaks 2
for i in range(156, 166): new[i] = 1
for i in range(0, 2): new[i] = 0
diffs = []
for _ in range(5000):
    idx = [random.randrange(n) for _ in range(n)]
    diffs.append(sum(new[i] - old[i] for i in idx) / n)
diffs.sort()
blo, bhi = diffs[int(0.025 * 5000)], diffs[int(0.975 * 5000)]
print(f"paired bootstrap 95% CI [{blo:+.3f}, {bhi:+.3f}]")   # pairing removes item difficulty noise
assert lo < 0 < hi and blo > 0
