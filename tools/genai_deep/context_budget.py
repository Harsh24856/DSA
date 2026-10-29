# Fit a request into a fixed context window: stable parts first, newest history kept, oldest dropped.
def tokens(text):                 # rough rule of thumb: ~4 characters per token in English
    return max(1, len(text) // 4)

def build_context(window, reserve_output, system, tools, docs, history, question):
    budget = window - reserve_output
    fixed = [("system", system), ("tools", tools), ("question", question)]
    used = sum(tokens(t) for _, t in fixed)
    kept_docs, kept_history = [], []
    for d in docs:                                   # docs arrive best-first from the retriever
        if used + tokens(d) > budget * 0.6: break    # cap retrieved text at 60% of the budget
        kept_docs.append(d); used += tokens(d)
    for turn in reversed(history):                   # newest turns are most relevant
        if used + tokens(turn) > budget: break
        kept_history.insert(0, turn); used += tokens(turn)
    return {"used": used, "budget": budget, "docs": len(kept_docs), "history": len(kept_history)}

plan = build_context(
    window=8_000, reserve_output=1_000,
    system="You are a support assistant. " * 20, tools="search(query) -> results. " * 30,
    docs=["policy text " * 300] * 6, history=[f"turn {i}: " + "words " * 200 for i in range(20)],
    question="Can I get a refund after 40 days?",
)
print(plan)        # every part fits under the budget; old turns and low-ranked docs were dropped
assert plan["used"] <= plan["budget"] and plan["docs"] < 6 and plan["history"] < 20
