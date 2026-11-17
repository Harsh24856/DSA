// Stage 8 (Agents) animated walk-throughs. Every number is computed here or in s8.calc.ts.
import type { Flow } from "../../other/flows.ts";
import { n0 } from "./s8.calc.ts";

// tool-calling: the model sends bad arguments, your code rejects them with a useful error, the model fixes them
const iso = (d: Date) => d.toISOString().slice(0, 10);
export const TODAY = new Date("2026-11-17T12:00:00Z");
export const FRIDAY = iso(new Date(TODAY.getTime() + (((5 - TODAY.getUTCDay() + 7) % 7) || 7) * 86400000));
function toolRetry(): Flow {
  return { kind: "lanes", title: "A bad tool call, caught and fixed", lanes: ["Your code", "Model", "Calendar"], steps: [
    { from: 0, to: 1, label: "question + schema", note: `"Move my 3pm meeting to Friday." Your code sends it with one tool, move_event, whose date field must be YYYY-MM-DD. Today is ${iso(TODAY)}.` },
    { from: 1, to: 0, label: "move_event(\"Friday\")", note: "The model fills the date in words. A schema guides the model, but nothing forces it to obey unless you check.", tone: "warn" },
    { from: 0, to: 0, label: "check: bad date", note: "Your code validates the arguments before anything runs. The calendar is never touched.", tone: "bad" },
    { from: 0, to: 1, label: "error as text", note: `It returns the error as the tool result, in words the model can act on: "date must be YYYY-MM-DD; today is ${iso(TODAY)}".`, tone: "hot" },
    { from: 1, to: 0, label: `move_event("${FRIDAY}")`, note: `The model reads the error and works out the date: the Friday after ${iso(TODAY)} is ${FRIDAY}.` },
    { from: 0, to: 2, label: "run move_event", note: "The arguments pass. Your code also checks that this user owns the event, then calls the real API.", tone: "warn" },
    { from: 2, to: 0, label: "moved", note: "Return only what the model needs: the new time and the event title, not the whole calendar record." },
    { from: 0, to: 1, label: "tool result", note: "Append it to the history and call the model again." },
    { from: 1, to: 0, label: "answer", note: "The model confirms in plain words. One bad call cost one extra round trip, not a broken calendar.", tone: "ok" },
  ] };
}

// agent-loop-react: one ReAct trace, with the context the model reads on each call
export const REACT = { prompt: 1200, obs: 300, eta: "2026-11-19", deadline: "2026-11-20" };
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
function react(): Flow {
  const { prompt, obs, eta, deadline } = REACT, early = days(eta, deadline);
  return { title: "ReAct: think, act, observe, repeat", steps: [
    { node: "Q: will A-1042 arrive by Fri?", note: `The user asks whether order A-1042 arrives by ${deadline}. Call 1 reads the prompt and tool definitions: ${n0(prompt)} tokens.` },
    { node: "Thought: I need the order", note: "The model writes a short plan in words. The reasoning picks the next action; nobody has to code that rule.", tone: "hot" },
    { node: "Act: get_order(A-1042)", note: "It asks for a tool. Your code runs it." },
    { node: `Observe: eta ${eta}`, note: `The result is appended to the history. Call 2 now reads ${n0(prompt + obs)} tokens, because everything is resent.`, tone: "warn" },
    { node: `Thought: ${eta.slice(5)} is before ${deadline.slice(5)}`, note: `The model compares the dates using the observation, not its memory: ${early} day${early === 1 ? "" : "s"} early. No more tools are needed.` },
    { node: "Answer: yes, a day early", note: "It stops asking for tools, so the loop ends. Without a stop like this, a step limit must end it.", tone: "ok" },
  ] };
}

// state-graphs: how reducers merge node updates into the shared state, one super-step at a time
type Val = string | string[];
type Reducer = (old: Val, upd: Val) => Val;
export const REDUCERS: Record<string, [string, Reducer]> = {
  status: ["replace", (_o, u) => u],
  notes: ["append", (o, u) => [...(o as string[]), ...(u as string[])]],
};
export function applyStep(state: Record<string, Val>, updates: Record<string, Val>[]): Record<string, Val> {
  const next = { ...state };
  for (const u of updates) for (const [k, v] of Object.entries(u)) next[k] = REDUCERS[k][1](next[k], v);
  return next;
}
export const SUPER_STEPS: [string, Record<string, Val>][][] = [
  [["plan", { status: "planning", notes: ["plan: 2 searches"] }]],
  [["web", { notes: ["web: 3 hits"] }], ["docs", { notes: ["docs: 1 hit"] }]],
  [["write", { status: "done", notes: ["draft written"] }]],
];
export const START_STATE: Record<string, Val> = { status: "new", notes: [] };
function reducerFlow(): Flow {
  const show = (v: Val) => (Array.isArray(v) ? (v.length ? `${v.length} item${v.length > 1 ? "s" : ""}` : "empty") : v);
  let s = START_STATE;
  const table = (st: Record<string, Val>, hot: string[]) => ({ label: "state", head: ["key", "reducer", "value"], rows: Object.keys(REDUCERS).map((k) => [k, REDUCERS[k][0], show(st[k])]), tones: Object.fromEntries(hot.map((k) => [String(Object.keys(REDUCERS).indexOf(k)), "hot" as const])) });
  const steps = SUPER_STEPS.map((ups, i) => {
    s = applyStep(s, ups.map(([, u]) => u));
    const keys = [...new Set(ups.flatMap(([, u]) => Object.keys(u)))], nodes = ups.map(([n]) => n);
    return { note: i === 1
      ? `Super-step ${i + 1}: ${nodes.join(" and ")} run in parallel and both write notes. The append reducer keeps both, so notes now holds ${(s.notes as string[]).length} items. status is untouched.`
      : i === 0 ? `Super-step 1: the ${nodes[0]} node returns only the keys it changes. status is replaced; the new note is appended.` : `Super-step ${i + 1}: ${nodes[0]} replaces status with "${s.status}" and appends one more note: ${(s.notes as string[]).length} in all. A checkpoint is saved after every super-step.`,
      tone: i === 1 ? "hot" as const : i === 2 ? "ok" as const : undefined,
      tables: [{ label: `updates from ${nodes.join(" + ")}`, head: ["node", "writes"], rows: ups.map(([n, u]) => [n, Object.keys(u).join(", ")]) }, table(s, keys)] };
  });
  return { kind: "grid", title: "Reducers: how updates merge into state", steps: [
    { note: "The graph's state is one typed object. Each key has a reducer: replace (the default) or append.", tables: [table(START_STATE, [])] },
    ...steps,
  ] };
}

export const FLOWS_8: Record<string, Flow> = {
  "s8-reducer": reducerFlow(),
  "s8-tool-retry": toolRetry(),
  "s8-react": react(),
};
