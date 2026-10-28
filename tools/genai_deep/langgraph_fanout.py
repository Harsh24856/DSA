import operator
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send

class State(TypedDict):
    question: str
    subqs: list[str]
    notes: Annotated[list[str], operator.add]    # reducer: updates are appended, not overwritten
    answer: str

class Task(TypedDict):
    q: str

def plan(s: State):
    return {"subqs": [f"{s['question']}: {a}" for a in ("how it works", "trade-offs", "when to use")]}

def fan_out(s: State):
    return [Send("research", {"q": q}) for q in s["subqs"]]   # one parallel branch per sub-question

def research(t: Task):                            # in a real agent: an LLM call with a search tool
    return {"notes": [f"note on {t['q']}"]}

def write(s: State):
    return {"answer": f"{len(s['notes'])} notes merged into one answer"}

g = StateGraph(State)
g.add_node("plan", plan)
g.add_node("research", research)
g.add_node("write", write)
g.add_edge(START, "plan")
g.add_conditional_edges("plan", fan_out, ["research"])
g.add_edge("research", "write")                    # write runs once, after all branches finish
g.add_edge("write", END)
app = g.compile()

print(app.invoke({"question": "HNSW"})["answer"])  # 3 notes merged into one answer
