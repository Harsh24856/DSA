// Stage 8: agents as state graphs (LangGraph): typed state, reducers, conditional edges, checkpoints and interrupts. Every number below is computed here or in the stage files.
import type { GModule } from "../../types.ts";
import { applyStep, START_STATE, SUPER_STEPS } from "../../stages/s8.flows.ts";

// predict: two parallel writes to an append key
const afterTwo = applyStep({ status: "new", notes: ["a"] }, [{ notes: ["b"] }, { notes: ["c"] }]);
// numeric: final note count in the reducer flow
let st = START_STATE;
for (const ups of SUPER_STEPS) st = applyStep(st, ups.map(([, u]) => u));
const finalNotes = (st.notes as string[]).length, superSteps = SUPER_STEPS.length, nodesRun = SUPER_STEPS.flat().length;
// numeric: re-run work after a crash
const [RN, RK] = [12, 9];
// output: replace against add
const [C0, C1] = [1, 5];

export const STATE_GRAPHS: GModule = {
  id: "state-graphs",
  stage: 8,
  title: "State graphs (LangGraph)",
  hook: "A loop in a script is fine until a run takes an hour, needs a person's approval halfway, or crashes at step nine. Writing the agent as a graph of steps over a saved state fixes all three.",
  blocks: [
    { kind: "figure", id: "s8-state-graph", caption: "Nodes are plain functions. Dashed edges are decided at run time by a function that reads the state. A diamond marks a checkpoint: the whole state is saved after that node runs." },
    { kind: "text", md: "**Three parts.** The **state** is one typed object every node can read, such as the messages, a plan and a status. A **node** is a function that takes the state and returns only the keys it changes. An **edge** says what runs next; a conditional edge calls your function on the state to choose. The agent loop is just a conditional edge from the model node back to the tools node." },
    { kind: "flow", id: "s8-reducer" },
    {
      kind: "predict",
      q: "The key notes has an append reducer and holds [\"a\"]. Two nodes run in the same step and return {\"notes\": [\"b\"]} and {\"notes\": [\"c\"]}. How many notes are there after the step?",
      answer: String(afterTwo.notes.length), wrong: ["1", "2", "0"],
      why: `The reducer merges each update into the old value, so both appends survive: ${afterTwo.notes.length} notes. With no reducer, LangGraph cannot tell how to combine two updates to one key in the same step and raises INVALID_CONCURRENT_GRAPH_UPDATE, which is why lists written by parallel branches need an append reducer.`,
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  S["START"] --> A["agent: call the model"]:::hot
  A --> R{"route on state"}
  R -->|tool call| T["tools: run them"]
  T --> A
  R -->|refund| H["approve: interrupt"]:::warn
  H --> T
  R -->|answer| E["END"]:::ok`,
      caption: "The same graph as text. A routing function reads the last message and returns the name of the next node.",
    },
    { kind: "flow", id: "g-interrupt" },
    { kind: "text", md: "**How a pause really works.** interrupt() saves the state and ends the run. Hours later you call the graph again with the same thread id and a resume value. The node that paused starts again from its first line, and interrupt() now returns the person's answer. So any side effect written before the interrupt runs twice: make it idempotent or move it after." },
    { kind: "play", id: "s8-resume" },
    {
      kind: "compare",
      head: ["", "Checkpointer", "Store"],
      rows: [
        ["Holds", "Snapshots of one thread's graph state", "Your own key-value records"],
        ["Scope", "One thread id", "Shared across threads"],
        ["Used for", "Resuming, pauses, crash recovery, replay", "Facts and preferences that outlive a chat"],
        ["Written by", "The graph, automatically", "Your nodes, on purpose"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `class Interrupt(Exception):
    pass

def run(nodes, order, state, saved, thread, resume=None):
    """Run nodes in order; save the state after each one; pause on Interrupt."""
    start = saved.get(thread, {}).get("next", 0)
    if thread in saved:
        state = dict(saved[thread]["state"])
    for i in range(start, len(order)):
        try:
            state.update(nodes[order[i]](state, resume))
        except Interrupt as ask:
            saved[thread] = {"state": state, "next": i}     # this node runs again on resume
            return "paused: " + str(ask)
        saved[thread] = {"state": dict(state), "next": i + 1}
    return state

log = []
def plan(s, _):    return {"amount": 120}
def approve(s, answer):
    log.append("approve started")                        # runs on both visits
    if answer is None:
        raise Interrupt(f"refund {s['amount']}?")
    return {"approved": answer == "yes"}
def refund(s, _):  return {"done": s["approved"]}

nodes = {"plan": plan, "approve": approve, "refund": refund}
order, saved = ["plan", "approve", "refund"], {}
print(run(nodes, order, {}, saved, "t1"))
print(run(nodes, order, {}, saved, "t1", resume="yes"))
print(log)
assert saved["t1"]["state"]["done"] is True and log.count("approve started") == 2
`,
    },
  ],
  keyPoints: [
    "A state graph has a typed state, nodes that return partial updates, and edges; conditional edges choose the next node from the state.",
    "Each state key has a reducer: by default an update replaces the value; an append reducer such as add_messages merges lists.",
    "A checkpointer saves the state per thread id, so a run can pause, survive a crash and resume where it stopped.",
    "interrupt() pauses for a person; resuming with the same thread id re-runs the paused node from its start.",
    "The checkpointer is short-term memory for one thread; a store holds long-term data shared across threads.",
  ],
  questions: [
    { id: "node-returns", level: "easy", kind: "concept",
      q: "What does a node in a state graph return?",
      answer: "Only the state keys it changes, which the graph merges into the state",
      wrong: ["A complete copy of the whole state, every time", "The name of the next node, and nothing else", "A string that is appended to the prompt"],
      why: "Nodes return partial updates. The graph applies each key's reducer to merge them, which is what lets parallel nodes write without overwriting each other's work." },
    { id: "default-reducer", level: "easy", kind: "concept",
      q: "A state key has no reducer. A node returns a new value for it. What happens?",
      answer: "The new value replaces the old one",
      wrong: ["The new value is appended to the old one", "The update is ignored", "The graph raises an error"],
      why: "Replace is the default. Use an append reducer for lists that several steps add to, such as messages." },
    { id: "cond-edge", level: "easy", kind: "concept",
      q: "What decides where a conditional edge goes?",
      answer: "A function you write that reads the state and returns the next node",
      wrong: ["The order in which the nodes were added", "A random choice among the connected nodes", "Whichever node finished fastest"],
      why: "The routing function might check whether the last message holds a tool call. That function is where the agent loop's \"tool call or answer?\" decision lives." },
    { id: "add-messages", level: "medium", kind: "concept",
      q: "Why use add_messages rather than a plain list append for the messages key?",
      answer: "It appends new messages and also updates an existing message that has the same id",
      wrong: ["It sorts messages by their timestamp", "It deletes old messages to save tokens", "It turns every message into an embedding"],
      why: "Updating by id matters when a person edits a message during a pause: the edit replaces the old message instead of adding a copy." },
    { id: "thread-id", level: "medium", kind: "concept",
      q: "What does the thread id do when you call a graph with a checkpointer?",
      answer: "It picks which saved state to load and continue",
      wrong: ["It sets how many threads run the nodes", "It names the model to call", "It limits how many steps may run"],
      why: "Calling with the same thread id continues that conversation or run from its last checkpoint. A new thread id starts from an empty state." },
    { id: "resume-rerun", level: "hard", kind: "concept",
      q: "A node sends an email, then calls interrupt() to ask for approval. The person approves and the graph resumes. What happens to the email?",
      answer: "It is sent again, because the node re-runs from its first line",
      wrong: ["Nothing: the node continues from the interrupt line", "It is cancelled, because the graph rolls back", "It is sent only if the person says no"],
      why: "Resuming restarts the paused node from the beginning; interrupt() then returns the resume value. Move side effects after the interrupt, into a later node, or make them idempotent." },
    { id: "parallel-step", level: "hard", kind: "concept",
      q: "Two nodes both follow the same node, with no edge between them. How do they run?",
      answer: "In the same super-step, in parallel, with their updates merged by the reducers",
      wrong: ["One after the other, in alphabetical order", "Only the first one runs", "They take turns, one token at a time"],
      why: "A super-step is one round of execution. Nodes that are ready together run together, and their updates are applied through each key's reducer at the end of the step." },
    { id: "count-steps", level: "medium", kind: "numeric",
      q: `In the reducer walk-through, ${nodesRun} nodes run. In how many super-steps?`,
      answer: String(superSteps), wrong: [String(nodesRun), String(superSteps - 1), String(nodesRun + 1)],
      why: `Two of the nodes run side by side in one super-step, so ${nodesRun} nodes take ${superSteps}. A checkpoint is saved at the end of each one.` },
    { id: "notes-count", level: "easy", kind: "numeric",
      q: "In the same walk-through, how many items are in notes at the end?",
      answer: String(finalNotes), wrong: [String(finalNotes - 1), String(finalNotes + 1), "1"],
      why: `Every node appends one note and the append reducer keeps them all: ${finalNotes}. Had notes used replace, only the last one would remain.` },
    { id: "crash-rerun", level: "medium", kind: "numeric",
      q: `A ${RN} step run with a checkpoint after every step crashes during step ${RK}. How many steps run in all to finish, counting those before the crash?`,
      answer: String(RN + 1), wrong: [String(RN), String(RN + RK), String(2 * RN)],
      why: `Steps 1 to ${RK - 1} ran once and were saved. Step ${RK} ran, crashed, and runs again; then steps ${RK + 1} to ${RN}. That is ${RN} + 1 = ${RN + 1}. Without checkpoints a restart repeats ${RK} steps: ${RN + RK} in all.` },
    { id: "reducer-out", level: "medium", kind: "output",
      q: "What does this print?",
      code: `import operator\nreducers = {"count": lambda old, new: new, "total": operator.add}\nstate = {"count": ${C0}, "total": ${C0}}\nupdate = {"count": ${C1}, "total": ${C1}}\nstate = {k: reducers[k](state[k], v) for k, v in update.items()}\nprint(state["count"], state["total"])`,
      answer: `${C1} ${C0 + C1}`, wrong: [`${C0 + C1} ${C0 + C1}`, `${C1} ${C1}`, `${C0} ${C0 + C1}`],
      why: `count replaces, so it becomes ${C1}. total adds, so it becomes ${C0} + ${C1} = ${C0 + C1}. The same update means different things under different reducers.` },
    { id: "why-graph", level: "medium", kind: "explain",
      q: "Why build an agent as a state graph instead of a while loop?",
      answer: "- Durable: the state is saved after each step, so a crash or deploy does not lose an hour of work.\n- Pausable: a run can stop for human approval and resume days later, with no process waiting.\n- Clear control: fixed steps and model-chosen steps live in one graph you can draw and test.\n- Parallel: independent branches run in one step and merge through reducers.\n- Debuggable: every checkpoint can be inspected or replayed.\n\nFor a short script with no pauses, a plain loop is simpler." },
    { id: "hitl", level: "hard", kind: "explain",
      q: "Design a human approval step before a refund over a set amount.",
      answer: "1. The agent node proposes the refund in the state: amount, order, reason.\n2. A conditional edge sends amounts over the limit to an approve node; smaller ones go straight to the refund node.\n3. The approve node calls interrupt() with the details. A checkpointer backed by a database saves the state under the thread id, and the run ends.\n4. A person sees the request and answers. Your API resumes the graph with the same thread id and the answer.\n5. The approve node re-runs, gets the answer, and routes to refund or to a rejection message.\n6. The refund tool uses an idempotency key, so a retry cannot pay twice." },
    { id: "short-long", level: "medium", kind: "explain",
      q: "What is the difference between a checkpointer and a store?",
      answer: "A checkpointer saves snapshots of the graph's state for one thread. It gives short-term memory: the current conversation or run, which can be paused, resumed or replayed.\n\nA store holds records your own nodes write on purpose, shared across threads, such as a user's preferences. It gives long-term memory that outlives any one conversation.\n\nMost apps use both." },
    { id: "trap-continue", level: "medium", kind: "trap",
      claim: "When a graph resumes after interrupt(), the paused node continues from the line after the interrupt.",
      truth: false,
      why: "The node starts again from its first line, and this time interrupt() returns the resume value. Code before the interrupt runs twice." },
    { id: "trap-checkpoint", level: "easy", kind: "trap",
      claim: "To pause for a human and resume later, the graph needs a checkpointer.",
      truth: true,
      why: "The pause ends the run. The only thing that carries the state to the resume call is the saved checkpoint, found by the thread id." },
    { id: "trap-replace", level: "hard", kind: "trap",
      claim: "If two parallel nodes append to a list key with no reducer, the list ends up holding both additions.",
      truth: false,
      why: "With no reducer, two updates to the same key in one step leave LangGraph unsure how to combine them, so it raises an INVALID_CONCURRENT_GRAPH_UPDATE error. Lists that several nodes add to need an append reducer, such as operator.add or add_messages." },
  ],
  real: [
    { who: "The LangGraph documentation", when: "Read in November 2026",
      what: "The interrupts guide says interrupt() pauses a graph while a checkpointer saves its state, and that you resume by calling the graph again with the same thread id and Command(resume=...). On resume, the paused node restarts from the beginning, not from the interrupt line.",
      takeaway: "The guide warns that side effects before an interrupt run again, so they should be idempotent or moved after it.",
      url: "https://docs.langchain.com/oss/python/langgraph/interrupts" },
  ],
};
