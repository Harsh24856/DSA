// Stage 8: the agent loop and ReAct. Every number below is computed here or in the stage files.
import type { GModule } from "../../types.ts";
import { callInput, chainOk, loopInput, n0, stepWithRetries } from "../../stages/s8.calc.ts";

const f1 = (x: number) => `${(x * 100).toFixed(1)}%`, r0 = (x: number) => `${Math.round(x * 100)}%`;

// predict and trap: per-step reliability over a task
const [P, N] = [0.95, 10], task = chainOk(P, N);
// numeric: 99% over 50 steps
const [P2, N2] = [0.99, 50], task2 = chainOk(P2, N2);
// numeric: input tokens over a run
const [PR, OB, CALLS] = [2000, 500, 8], run = loopInput(PR, OB, CALLS), lastCall = callInput(PR, OB, CALLS - 1);
// numeric: one retry per step
const retried = chainOk(stepWithRetries(P, 2), N);
// output: the step limit fires
const LIMIT = 6;

export const AGENT_LOOP_REACT: GModule = {
  id: "agent-loop-react",
  stage: 8,
  title: "The agent loop and ReAct",
  hook: "An agent is a model in a loop: it picks a tool, reads the result, and decides what to do next, until it decides it is done. The loop is a few lines of code. Making it stop, stay cheap and stay correct is the real work.",
  blocks: [
    { kind: "figure", id: "s8-react-trace", caption: "Each round writes a thought, takes an action and reads an observation. Every later call rereads all earlier rounds, so the input grows each time." },
    { kind: "text", md: "**Workflow or agent?** In a workflow, your code fixes the steps: classify, then retrieve, then answer. In an agent, the model chooses the next step each time.\n\nAgents suit tasks whose path you cannot write down in advance, such as research or debugging. They cost more tokens, take longer and are harder to test. Start with one call, then a workflow, and reach for an agent last." },
    { kind: "flow", id: "s8-react" },
    { kind: "lab", id: "agent" },
    {
      kind: "mermaid",
      src: `flowchart TB
  G["user goal"] --> M["model call: history + tools"]
  M --> Q{"tool call or answer?"}:::hot
  Q -->|answer| A["return the answer"]:::ok
  Q -->|tool call| T["your code runs the tool"]
  T --> O["append the result"]
  O --> B{"steps and budget left?"}
  B -->|yes| M
  B -->|no| S["stop and report progress"]:::warn`,
      caption: "The loop has two exits: the model answers, or your code's limit fires. Never ship it without the second one.",
    },
    {
      kind: "predict",
      q: `Each step of an agent task works ${r0(P)} of the time, failures are independent, and the task needs all ${N} steps. How often does the whole task work?`,
      answer: `About ${r0(task)}`, wrong: [`About ${r0(P)}`, `About ${r0(P - 0.05)}`, `About ${r0(1 - (1 - P) * N)}`],
      why: `Every step must work: ${P} to the power ${N} = ${task.toFixed(3)}, about ${r0(task)}. Small error rates compound over long runs, which is why agents need checks, retries and short paths.`,
    },
    { kind: "play", id: "s8-reliability" },
    { kind: "play", id: "s8-loop-cost" },
    {
      kind: "compare",
      head: ["", "Workflow", "Agent"],
      rows: [
        ["Who picks the next step", "Your code", "The model"],
        ["Cost and latency", "Known in advance", "Varies per task"],
        ["Testing", "Like normal code", "Needs evals over many runs"],
        ["Fits", "Steps you can list", "Paths you cannot list"],
        ["Fails by", "A step's output is wrong", "Loops, wanders, or stops early"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `def fake_model(history):
    # a stand-in for the model: asks for the order, then answers
    if not any(m["role"] == "tool" for m in history):
        return {"tool": "get_order", "input": {"order_id": "A-1042"}}
    return {"answer": "It arrives on 2026-11-19, a day before Friday."}

def stuck_model(history):
    return {"tool": "get_order", "input": {"order_id": "A-1042"}}   # never stops asking

def run_tool(call):
    return {"status": "shipped", "eta": "2026-11-19"}

def agent(model, question, max_steps=${LIMIT}):
    history = [{"role": "user", "content": question}]
    for step in range(1, max_steps + 1):
        reply = model(history)
        if "answer" in reply:
            return reply["answer"], step
        history.append({"role": "assistant", "content": reply})
        history.append({"role": "tool", "content": run_tool(reply)})
    return "Stopped: step limit reached. Progress so far is in the log.", max_steps

print(agent(fake_model, "Will A-1042 arrive by Friday?"))
print(agent(stuck_model, "Will A-1042 arrive by Friday?"))
assert agent(fake_model, "q")[1] == 2
assert agent(stuck_model, "q")[0].startswith("Stopped")
`,
    },
    { kind: "text", md: "**Planning.** For long tasks, ask the model for a short plan first, then run the loop one step at a time and let it revise the plan when an observation surprises it (plan and execute). The plan is shown and testable; a cheap model can run the steps while a stronger one plans. Keep plans short: a long plan goes stale after the first surprise." },
    { kind: "text", md: "**Guard rails for every loop.** Cap the steps and the spend. Stop when the model repeats the same call with the same arguments. Log every thought, call and result, so a bad run can be replayed. Trim old tool results once they are used, because each one is reread on every later call." },
  ],
  keyPoints: [
    "An agent is a loop: call the model, run the tools it asks for, append the results, call again, until it answers.",
    "ReAct interleaves short reasoning with actions, so each observation shapes the next step.",
    "Every call rereads the whole history, so input tokens grow with each step and total cost grows quadratically.",
    "Per-step errors compound: 95% per step over 10 steps is about 60% for the task.",
    "Always add a step limit, a budget, repeat detection and logs; prefer a workflow when the steps are known.",
  ],
  questions: [
    { id: "plan-execute", level: "medium", kind: "concept",
      q: "What does a plan-and-execute agent add to a plain ReAct loop?",
      answer: "It writes a short plan first, runs the steps one by one and revises the plan when a result surprises it",
      wrong: ["It runs every tool call in parallel", "It removes the need for observations", "It stores the plan as the final answer"],
      why: "Planning up front gives a visible, testable list of steps and lets a cheaper model execute them. Revising on surprises keeps the plan from going stale, which a fixed long plan always does." },
    { id: "what-agent", level: "easy", kind: "concept",
      q: "What separates an agent from a workflow?",
      answer: "In an agent the model decides the next step; in a workflow your code does",
      wrong: ["An agent uses a bigger model", "A workflow cannot call tools", "An agent never needs a system prompt"],
      why: "Both can use tools and any model. The difference is control: a workflow follows a path you wrote, and an agent picks its path at run time." },
    { id: "react-means", level: "easy", kind: "concept",
      q: "What does ReAct interleave?",
      answer: "Reasoning steps and actions, with each action's observation feeding the next thought",
      wrong: ["Reading and acting on two separate models", "Retrieval and actions, with no reasoning", "Reinforcement learning and action logging"],
      why: "The name joins reasoning and acting. Thoughts plan the next action, and observations from the tools correct the plan, which is why it beats acting or reasoning alone." },
    { id: "loop-exit", level: "easy", kind: "concept",
      q: "How does a normal agent loop end?",
      answer: "The model replies with an answer instead of a tool call",
      wrong: ["The tool returns an empty result", "The context window fills up", "After exactly one tool call"],
      why: "Each reply is either a tool request or a final answer. A step limit is the second, safety exit for when the model never stops asking." },
    { id: "when-agent", level: "medium", kind: "concept",
      q: "Which task most needs an agent rather than a workflow?",
      answer: "Fixing a failing test in an unfamiliar codebase",
      wrong: ["Translating each support ticket to English", "Tagging every invoice with one of five categories", "Summarising each meeting transcript"],
      why: "You cannot list the steps of debugging in advance: what to read next depends on what you just found. The other tasks have a fixed path, so a single call or a workflow is cheaper and easier to test." },
    { id: "repeat", level: "medium", kind: "concept",
      q: "An agent calls the same search with the same query four times in a row. What should the loop do?",
      answer: "Detect the repeat and stop or change course, for example by telling the model the result has not changed",
      wrong: ["Raise the step limit so it has room to finish", "Run the search faster", "Nothing: repetition shows it is being careful"],
      why: "Identical calls bring identical results, so the model is stuck. Repeat detection is a cheap guard that saves the rest of the budget." },
    { id: "trim", level: "hard", kind: "concept",
      q: "Late in a long run, each call is slow and costly. What change helps most without hurting the task?",
      answer: "Replace old, already used tool results with short summaries",
      wrong: ["Remove the system prompt after the first call", "Send only the latest message each time", "Raise the temperature to finish sooner"],
      why: "Old observations are reread on every call. Summarising them keeps what was learned at a fraction of the tokens. Dropping the history entirely loses the task's state." },
    { id: "eval-agent", level: "hard", kind: "concept",
      q: "How should you test an agent before shipping?",
      answer: "Run it many times on a set of tasks and score the outcomes and the trajectories",
      wrong: ["Run each task once; if it works, it always works", "Check that its first tool call has valid JSON", "Read a single transcript closely"],
      why: "Runs vary: the same task can succeed once and fail the next time. Success rates over many runs, plus checks on the steps taken (tool choice, cost, safety), show what one run cannot." },
    { id: "compound", level: "medium", kind: "numeric",
      q: `Each step works ${r0(P2)} of the time, independently. What is the chance a ${N2} step task works?`,
      answer: r0(task2), wrong: [r0(P2), r0(1 - (1 - P2) * N2 / 2), r0(P2 ** (N2 / 5))],
      why: `${P2} to the power ${N2} = ${task2.toFixed(3)}, about ${r0(task2)}. Even very reliable steps lose a lot over long chains.` },
    { id: "run-tokens", level: "hard", kind: "numeric",
      q: `An agent makes ${CALLS} model calls. Call 1 reads ${n0(PR)} tokens, and each tool result adds ${n0(OB)} tokens that stay in the history. How many input tokens does the run read in all?`,
      answer: n0(run), wrong: [n0(CALLS * PR), n0(lastCall), n0(PR + CALLS * OB)],
      why: `Call i reads ${n0(PR)} + (i - 1) × ${n0(OB)}. Summed over ${CALLS} calls: ${CALLS} × ${n0(PR)} + ${n0(OB)} × (0 + 1 + ... + ${CALLS - 1}) = ${n0(CALLS * PR)} + ${n0(OB * (CALLS * (CALLS - 1)) / 2)} = ${n0(run)}. The last call alone reads ${n0(lastCall)}.` },
    { id: "retry-gain", level: "medium", kind: "numeric",
      q: `Steps work ${r0(P)} of the time and failures can be detected. Each step may be tried twice. What is the chance a ${N} step task works?`,
      answer: f1(retried), wrong: [f1(task), f1(P), f1(chainOk(P, N / 2))],
      why: `A step now fails only if both tries fail: ${((1 - P) ** 2).toFixed(4)}. So a step works ${f1(stepWithRetries(P, 2))} of the time, and ${N} steps ${f1(retried)}, up from ${f1(task)}.` },
    { id: "limit-out", level: "easy", kind: "output",
      q: "The model never stops asking for tools. What does this print?",
      code: `def agent(max_steps=${LIMIT}):\n    for step in range(1, max_steps + 1):\n        reply = {"tool": "search"}\n        if "answer" in reply:\n            return step\n    return f"stopped after {max_steps}"\nprint(agent())`,
      answer: `stopped after ${LIMIT}`, wrong: [`stopped after ${LIMIT - 1}`, `stopped after ${LIMIT + 1}`, String(LIMIT)],
      why: `The reply never contains an answer, so the loop runs all ${LIMIT} steps and the limit ends it. Without that limit, it would run until the money or the context ran out.` },
    { id: "write-loop", level: "medium", kind: "explain",
      q: "Write the agent loop in words, with its guards.",
      answer: "1. Start the history with the system prompt and the user's goal.\n2. Call the model with the history and the tool definitions.\n3. If it answers, return the answer.\n4. Otherwise run each requested tool (validated, with permission checks) and append the results.\n5. Before looping, check the step count, the token or money budget, and whether the call repeats the last one.\n6. If a guard fires, stop and report what was done so far." },
    { id: "why-react", level: "medium", kind: "explain",
      q: "Why does writing a thought before each action help an agent?",
      answer: "The thought turns the goal and the latest observation into a concrete next step, so the action is chosen for a stated reason.\n\nIt also keeps a plan in the history that later calls can read and revise when an observation surprises it.\n\nAnd it makes runs easier to debug: you can see why each tool was called. The cost is extra output tokens on every step." },
    { id: "agent-cost", level: "hard", kind: "explain",
      q: "An agent works in testing but costs too much in production. Where do you look?",
      answer: "- Steps per task: are there loops or repeated calls? Add repeat detection and better stop rules.\n- Input per call: big tool results and long histories are reread on every call; trim and summarise them.\n- Tool definitions: offer only the tools that fit the request.\n- Model choice: route easy steps to a smaller model.\n- Caching: keep the stable prefix (system prompt, tools) the same so it can be cached.\n- Whether it needs to be an agent at all: a fixed workflow may do." },
    { id: "trap-limit", level: "easy", kind: "trap",
      claim: "A well-prompted agent does not need a step limit, because it will stop when it is done.",
      truth: false,
      why: "Models do get stuck: they repeat calls, chase dead ends or keep checking. A step and budget limit is the only exit you control." },
    { id: "trap-compound", level: "medium", kind: "trap",
      claim: `If every step of a ${N} step task works ${r0(P)} of the time, independently, the task works less than two thirds of the time.`,
      truth: true,
      why: `${P} to the power ${N} = ${task.toFixed(3)}, which is below 0.667. Reliability multiplies along a chain.` },
    { id: "trap-agent-better", level: "medium", kind: "trap",
      claim: "An agent is always better than a fixed workflow, because it can adapt.",
      truth: false,
      why: "When the steps are known, a workflow is cheaper, faster, more predictable and easier to test. Adaptability only pays for tasks whose path cannot be planned." },
  ],
  real: [
    { who: "Shunyu Yao and co-authors", when: "2022",
      what: "The ReAct paper had language models write reasoning traces and task actions in turn, so reasoning planned the actions and actions gathered information for the reasoning.",
      takeaway: "The paper reports beating imitation and reinforcement learning methods by about 34 points of success rate on ALFWorld and 10 on WebShop, prompted with only one or two examples.",
      url: "https://arxiv.org/abs/2210.03629" },
    { who: "An engineering guide from a model provider", when: "December 2024",
      what: "\"Building effective agents\" separates workflows, where code paths are fixed in advance, from agents, where the model directs its own process and tool use. It names five workflow patterns: prompt chaining, routing, parallelization, orchestrator-workers and evaluator-optimizer.",
      takeaway: "Its advice is to start simple and add agent autonomy only when simpler setups fall short.",
      url: "https://www.anthropic.com/engineering/building-effective-agents" },
  ],
};
