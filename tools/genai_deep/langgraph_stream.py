from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict, total=False):
    question: str
    draft: str
    answer: str

def draft(s: State):
    return {"draft": f"first draft about {s['question']}"}

def review(s: State):
    return {"answer": s["draft"].replace("first draft", "reviewed answer")}

g = StateGraph(State)
g.add_node("draft", draft)
g.add_node("review", review)
g.add_edge(START, "draft")
g.add_edge("draft", "review")
g.add_edge("review", END)
app = g.compile()

for update in app.stream({"question": "RoPE"}, stream_mode="updates"):   # what each node changed
    print("updates:", update)
for state in app.stream({"question": "RoPE"}, stream_mode="values"):     # full state after each step
    print("values: ", state)
