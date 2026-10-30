# Before trusting an LLM judge, measure how often it agrees with humans, and whether answer order sways it.
human = [1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0]   # 1 = good answer (human label)
judge = [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1]   # the judge's verdicts on the same items

def agreement(a, b):
    return sum(x == y for x, y in zip(a, b)) / len(a)

def cohens_kappa(a, b):
    # agreement corrected for the agreement you would get by chance
    po = agreement(a, b)
    pa, pb = sum(a) / len(a), sum(b) / len(b)
    pe = pa * pb + (1 - pa) * (1 - pb)
    return (po - pe) / (1 - pe)

print(f"raw agreement {agreement(human, judge):.2f}, Cohen's kappa {cohens_kappa(human, judge):.2f}")

# Position bias: ask the judge "is A better than B?" both ways round. A fair judge flips its answer.
first_order  = ["A", "A", "B", "A", "A", "B", "A", "A"]   # winner when the answers are shown (x, y)
swapped      = ["A", "B", "A", "A", "B", "A", "A", "A"]   # winner when shown (y, x); "A" now means y
consistent = sum((f == "A") != (s == "A") for f, s in zip(first_order, swapped)) / len(swapped)
print(f"order-consistent verdicts: {consistent:.0%}")   # count only these; inconsistent ones are ties
assert 0.6 < cohens_kappa(human, judge) < 0.9 and consistent < 1
