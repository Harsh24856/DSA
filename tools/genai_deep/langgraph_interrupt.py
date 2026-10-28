from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command, interrupt

class State(TypedDict, total=False):
    action: str
    approved: bool
    result: str

def propose(s: State):
    return {"action": "refund order 1042 for $40"}

def approve(s: State):
    answer = interrupt({"question": f"Run '{s['action']}'?"})   # pause here; state is saved
    return {"approved": answer == "yes"}

def act(s: State):
    return {"result": "refunded" if s["approved"] else "skipped"}

g = StateGraph(State)
g.add_node("propose", propose)
g.add_node("approve", approve)
g.add_node("act", act)
g.add_edge(START, "propose")
g.add_edge("propose", "approve")
g.add_edge("approve", "act")
g.add_edge("act", END)
app = g.compile(checkpointer=InMemorySaver())     # interrupts and memory need a checkpointer

cfg = {"configurable": {"thread_id": "ticket-7"}}
paused = app.invoke({}, cfg)
print(paused["__interrupt__"][0].value)           # {'question': "Run 'refund order 1042 for $40'?"}
print(app.invoke(Command(resume="yes"), cfg)["result"])   # refunded: approve() resumes with "yes"

for snap in app.get_state_history(cfg):           # every super-step was checkpointed (time travel)
    print(snap.next, snap.values.get("result"))
