// Stage 8: multi-agent patterns: when splitting work across agents helps, and what it costs. Every number below is computed here or in the stage files.
import type { GModule } from "../../types.ts";
import { chainOk, fanTime, n0 } from "../../stages/s8.calc.ts";
import { ORCH } from "../../stages/s8.flows.ts";
import { FAN } from "../../stages/s8.play.ts";

// predict: three equal subtasks
const [PW, PM] = [3, 10], pTasks = Array.from({ length: PW }, () => PM);
const pSeq = fanTime(FAN.plan, pTasks, FAN.merge, false), pPar = fanTime(FAN.plan, pTasks, FAN.merge, true);
// numeric: unequal subtasks
const UNEQ = [5, 20, 8], uPar = fanTime(FAN.plan, UNEQ, FAN.merge, true);
// numeric: summary compression
const ratio = Math.round(ORCH.read / ORCH.back);
// numeric: handoff chain
const [HP, HN] = [0.9, 4], chain = chainOk(HP, HN);
// output: critical path of a small plan
const DEPS: Record<string, [number, string[]]> = { plan: [2, []], prices: [8, ["plan"]], reviews: [12, ["plan"]], compare: [4, ["prices", "reviews"]], write: [3, ["compare"]] };
const finish: Record<string, number> = {};
for (const k of Object.keys(DEPS)) finish[k] = DEPS[k][0] + Math.max(0, ...DEPS[k][1].map((d) => finish[d]));
const critical = finish.write, total = Object.values(DEPS).reduce((s, [m]) => s + m, 0);

export const MULTI_AGENT: GModule = {
  id: "multi-agent",
  stage: 8,
  title: "Multi-agent patterns",
  hook: "One agent with one context can only hold so much and do one thing at a time. Splitting a task across several agents buys parallel work and clean contexts. It also multiplies tokens and adds new ways to fail, so it pays only for the right tasks.",
  blocks: [
    { kind: "figure", id: "s8-fan-out", caption: "The same work, in turn and at once. Parallel workers cut the time to the slowest one; they do not cut the reading each must do." },
    { kind: "flow", id: "s8-orch" },
    {
      kind: "predict",
      q: `A lead plans for ${FAN.plan} min, ${PW} workers each take ${PM} min on independent parts, and the lead merges for ${FAN.merge} min. How long does it take end to end?`,
      answer: `${pPar} min`, wrong: [`${pSeq} min`, `${PM} min`, `${pPar + PM} min`],
      why: `The workers run at once, so the middle takes ${PM} min, not ${PW} × ${PM}: ${FAN.plan} + ${PM} + ${FAN.merge} = ${pPar}. One agent doing the parts in turn would take ${pSeq}.`,
    },
    { kind: "text", md: "**When it helps.** The task splits into parts that do not depend on each other, such as researching many sources, and each part needs a lot of reading. Each worker gets a fresh context for its part and returns a short summary.\n\n**When it hurts.** The parts share state and must agree at every step, as in most coding. Agents then pass context back and forth, and every handoff can lose detail." },
    { kind: "play", id: "s8-fanout" },
    {
      kind: "compare",
      head: ["Pattern", "How it works", "Good for"],
      rows: [
        ["Orchestrator and workers", "A lead splits the task, workers run in parallel, the lead merges", "Broad research, many independent parts"],
        ["Router", "One call classifies the request and hands it to a specialist", "Support desks with distinct kinds of request"],
        ["Pipeline (handoff)", "Each agent does one stage and passes the result on", "Fixed stages: extract, check, write"],
        ["Evaluator and optimizer", "One agent writes, another critiques, repeat", "Work with clear quality criteria"],
      ],
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  U["user request"] --> L["lead: plan and write briefs"]:::hot
  L --> A["worker A: own context, own tools"]
  L --> B["worker B: own context, own tools"]
  A --> M["lead: merge summaries, check, cite"]
  B --> M
  M --> C{"enough to answer?"}
  C -->|no| L
  C -->|yes| R["answer"]:::ok`,
      caption: "The lead may run more rounds if the first summaries leave gaps. Each round costs every worker's tokens again.",
    },
    { kind: "text", md: `**Write briefs like tickets.** A worker knows only its brief. Say the goal, the output format, which tools and sources to use, what is out of scope, and when to stop. Ask for a compact summary with sources: in the walk-through, ${n0(ORCH.read)} tokens of reading came back as ${ORCH.back}, about ${ratio} times smaller.` },
    {
      kind: "code",
      run: true,
      src: `# minutes per step and the steps it waits for; workers run as soon as their inputs are ready
deps = {${Object.entries(DEPS).map(([k, [m, d]]) => `\n    "${k}": (${m}, [${d.map((x) => `"${x}"`).join(", ")}]),`).join("")}
}
finish = {}
for step, (mins, needs) in deps.items():      # listed in an order where needs come first
    finish[step] = mins + max([finish[n] for n in needs], default=0)

print("critical path:", finish["write"], "min")
print("one agent in turn:", sum(m for m, _ in deps.values()), "min")
assert finish["write"] == ${critical}
`,
    },
  ],
  keyPoints: [
    "Multi-agent systems split a task across agents with their own contexts; the common shape is a lead with parallel workers.",
    "Parallel workers cut wall-clock time to the slowest part, but total tokens go up, not down.",
    "They suit broad tasks with independent parts and heavy reading; they suit tightly coupled tasks such as most coding poorly.",
    "Each worker knows only its brief, so state the goal, output format, tools, scope and stopping rule.",
    "Workers return short summaries with sources, and each handoff is a chance to lose detail, so check the merged result.",
  ],
  questions: [
    { id: "why-split", level: "easy", kind: "concept",
      q: "What is the main gain from giving subtasks to separate worker agents?",
      answer: "Parts run in parallel, each in its own clean context",
      wrong: ["Each worker uses fewer tokens than one agent would", "Workers never make mistakes", "The lead no longer needs a model"],
      why: "Parallelism saves time, and separate contexts keep each part focused. Tokens go up, because every worker reads its own material and the lead reads their summaries." },
    { id: "bad-fit", level: "medium", kind: "concept",
      q: "Which task is the worst fit for several agents working in parallel?",
      answer: "Changing one function and all its callers across a codebase",
      wrong: ["Collecting prices from ten shops", "Summarising twenty unrelated papers", "Checking five suppliers' websites for a certificate"],
      why: "Every edit depends on the others, so agents must share and agree on the same context at every step. The other tasks split into independent parts." },
    { id: "tokens", level: "medium", kind: "concept",
      q: "Moving from one agent to a lead with four workers, what usually happens to total token use?",
      answer: "It rises, because each worker reads its own material and the lead adds briefs and merging",
      wrong: ["It falls to a quarter", "It stays the same", "It falls, because summaries are short"],
      why: "Summaries keep the lead's context small, but the reading still happens, four times over. Multi-agent buys speed and breadth with tokens." },
    { id: "brief", level: "easy", kind: "concept",
      q: "Two workers came back with the same results. What most likely went wrong?",
      answer: "The lead's briefs did not separate their scopes",
      wrong: ["The workers used the same model", "The context windows were too large", "The temperature was too low"],
      why: "Workers see only their briefs. Without clear boundaries (\"you cover prices; reviews are someone else's\"), they overlap and waste the budget." },
    { id: "router", level: "medium", kind: "concept",
      q: "Requests are refunds, technical faults or sales questions, each needing different tools. Which pattern fits?",
      answer: "A router that classifies each request and hands it to a specialist",
      wrong: ["An evaluator and optimizer loop", "Ten workers in parallel on every request", "A single prompt with every tool"],
      why: "The kinds are distinct and known, so one cheap classification picks the right specialist with a short prompt and only its tools." },
    { id: "evaluator", level: "medium", kind: "concept",
      q: "When does an evaluator and optimizer pair help most?",
      answer: "When there are clear criteria to judge the draft and feedback can improve it",
      wrong: ["When the task has no way to tell good from bad", "When speed matters more than quality", "When the writer and the evaluator must share one context"],
      why: "The loop only improves work if the critic can say what is wrong in a way the writer can act on, as with tests for code or a style guide for text." },
    { id: "telephone", level: "hard", kind: "concept",
      q: "A pipeline passes work through four agents. The final answer misses a constraint the user stated. What is the likely cause?",
      answer: "A handoff summary dropped it, and later agents never saw the original request",
      wrong: ["The last agent's temperature was too high", "Four agents is too few", "The model has no memory between tokens"],
      why: "Each handoff compresses. Pass the user's original request and hard constraints to every stage, and check the output against them at the end." },
    { id: "par-time", level: "easy", kind: "numeric",
      q: `Workers take ${UNEQ.join(", ")} minutes on independent parts. Planning takes ${FAN.plan} min and merging ${FAN.merge}. How long end to end?`,
      answer: `${uPar} min`, wrong: [`${fanTime(FAN.plan, UNEQ, FAN.merge, false)} min`, `${Math.round(UNEQ.reduce((a, b) => a + b, 0) / UNEQ.length) + FAN.plan + FAN.merge} min`, `${Math.max(...UNEQ)} min`],
      why: `Parallel work ends when the slowest worker ends: ${FAN.plan} + ${Math.max(...UNEQ)} + ${FAN.merge} = ${uPar}. Balance the parts, or the fast workers wait.` },
    { id: "compress", level: "medium", kind: "numeric",
      q: `A worker reads ${n0(ORCH.read)} tokens and returns a ${ORCH.back} token summary. About how many times smaller is what reaches the lead?`,
      answer: `${ratio} times`, wrong: [`${Math.round(ratio / 10)} times`, `${ratio * 10} times`, "The same size"],
      why: `${n0(ORCH.read)} / ${ORCH.back} ≈ ${ratio}. That compression is why a lead can combine many workers without overflowing its own context.` },
    { id: "handoff-num", level: "hard", kind: "numeric",
      q: `Each handoff in a ${HN} agent pipeline keeps every needed detail ${Math.round(HP * 100)}% of the time, independently. How often does a detail survive all ${HN} handoffs?`,
      answer: `${Math.round(chain * 100)}%`, wrong: [`${Math.round(HP * 100)}%`, `${Math.round((1 - (1 - HP) * HN) * 100)}%`, `${Math.round(HP ** 2 * 100)}%`],
      why: `${HP} to the power ${HN} = ${chain.toFixed(3)}, about ${Math.round(chain * 100)}%. Losses multiply along a chain, so pass critical facts directly instead of through every summary.` },
    { id: "crit-out", level: "medium", kind: "output",
      q: "Steps wait only for the steps they need. What does this print?",
      code: `deps = {${Object.entries(DEPS).map(([k, [m, d]]) => `"${k}": (${m}, [${d.map((x) => `"${x}"`).join(", ")}])`).join(", ")}}\nfinish = {}\nfor s, (m, needs) in deps.items():\n    finish[s] = m + max([finish[n] for n in needs], default=0)\nprint(finish["write"])`,
      answer: String(critical), wrong: [String(total), String(DEPS.plan[0] + DEPS.prices[0] + DEPS.compare[0] + DEPS.write[0]), String(critical - DEPS.write[0])],
      why: `prices and reviews run side by side after plan, so the path is plan ${DEPS.plan[0]} + reviews ${DEPS.reviews[0]} + compare ${DEPS.compare[0]} + write ${DEPS.write[0]} = ${critical}. Doing every step in turn would take ${total}.` },
    { id: "design-research", level: "hard", kind: "explain",
      q: "Design a multi-agent system that writes a research report from many web sources.",
      answer: "- Lead: reads the question, plans sub-questions that do not overlap, and writes a brief for each (goal, sources, output format, stop rule, token budget).\n- Workers: run in parallel with search and fetch tools, each in its own context, and return a short summary with source links.\n- Lead: merges, spots gaps or contradictions, and may send a second round.\n- Checker: a final pass that every claim has a source and the original constraints are met.\n- Limits: caps on workers, rounds and total tokens; logs of every brief and summary for debugging." },
    { id: "when-not", level: "medium", kind: "explain",
      q: "How do you decide between one agent and several?",
      answer: "Start with one agent; it is cheaper and easier to debug.\n\nSplit when the task has independent parts that each need a lot of reading or tool use, when one context cannot hold it all, or when wall-clock time matters enough to pay for more tokens.\n\nKeep one agent when the parts depend on each other step by step, when the total work is small, or when the extra coordination would cost more than it saves." },
    { id: "debug", level: "hard", kind: "explain",
      q: "A multi-agent system sometimes gives worse answers than a single agent. How do you find out why?",
      answer: "- Log every brief, worker transcript, summary and merge, with ids linking them.\n- Compare failing runs with good ones: was a brief vague, did workers overlap, did a summary drop a fact, did the lead merge badly?\n- Score each stage on its own: brief quality, worker answers against their brief, summary faithfulness, final answer.\n- Fix the weakest stage first, often the briefs or the summary format, and rerun the same task set to confirm." },
    { id: "trap-cheaper", level: "easy", kind: "trap",
      claim: "Splitting a task across several agents usually lowers total token use.",
      truth: false,
      why: "Each worker reads its own material, and the lead adds briefs and merging on top. Multi-agent systems trade more tokens for less time and more breadth." },
    { id: "trap-slowest", level: "medium", kind: "trap",
      claim: "With workers in parallel, the slowest worker sets how long the parallel part takes.",
      truth: true,
      why: `The lead must wait for every summary before merging. With parts of ${UNEQ.join(", ")} minutes, the parallel part takes ${Math.max(...UNEQ)}.` },
    { id: "trap-coding", level: "hard", kind: "trap",
      claim: "Tasks with many dependencies between parts, such as most coding, gain the most from many agents working at once.",
      truth: false,
      why: "Dependent parts force agents to share context and coordinate in real time, which they do poorly. Parallel agents gain most when the parts are independent." },
  ],
  real: [
    { who: "An engineering team at a model provider", when: "June 2025",
      what: "A write-up of a multi-agent research system: a lead agent plans and spawns subagents that search in parallel. On the team's internal research eval, the multi-agent setup beat a single agent by 90.2%. Agents used about 4 times the tokens of chat, and multi-agent systems about 15 times.",
      takeaway: "The post says such systems do poorly where all agents must share the same context or depend closely on each other, and names coding as an example.",
      url: "https://www.anthropic.com/engineering/multi-agent-research-system" },
  ],
};
