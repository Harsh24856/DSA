// Stage 8 (Agents) animated walk-throughs. Every number is computed here or in s8.calc.ts.
import type { Flow } from "../../other/flows.ts";
import { MEM_QUERY, MEMORIES, type Memory, n0, rankMemories, SCREEN, SHOT, toScreen } from "./s8.calc.ts";

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

// mcp-a2a: one agent hands a task to another over A2A, including a pause for the user's input
export const HOTEL = { nights: 2, budget: 150, offers: [["Hotel Rio", 180], ["Casa Azul", 140], ["Hostel Sol", 60]] as [string, number][] };
function a2a(): Flow {
  const { nights, budget, offers } = HOTEL;
  const fit = offers.filter(([, p]) => p <= budget).sort((a, b) => b[1] - a[1])[0];
  return { kind: "lanes", title: "A2A: one agent asks another", lanes: ["User", "Client agent", "Hotel agent"], steps: [
    { from: 0, to: 1, label: "find a hotel", note: `"Find me a hotel in Lisbon for ${nights} nights." The client agent has no hotel tools, but it knows a hotel agent's address.` },
    { from: 1, to: 2, label: "GET agent card", note: "It reads the Agent Card at /.well-known/agent-card.json on the hotel agent's domain: a JSON file listing its skills, endpoint and how to authenticate." },
    { from: 1, to: 2, label: "SendMessage", note: "It sends a message with a text part. A2A builds on HTTP, JSON-RPC 2.0 and server-sent events." },
    { from: 2, to: 1, label: "task: working", note: "The hotel agent creates a task with an id and a state. Long work can stream status updates instead of blocking.", tone: "hot" },
    { from: 2, to: 1, label: "input required", note: "It needs a budget. The task pauses in the input required state: not finished, waiting for more input.", tone: "warn" },
    { from: 1, to: 0, label: "budget?", note: "The client agent asks the user. Neither agent sees the other's prompts, tools or memory: only messages and task updates cross." },
    { from: 0, to: 1, label: `${budget} a night`, note: `The user answers: at most ${budget} a night.` },
    { from: 1, to: 2, label: "SendMessage (task id)", note: "The reply goes to the same task, so the hotel agent continues where it stopped." },
    { from: 2, to: 1, label: "completed + artifact", note: `${offers.length} offers checked; ${fit[0]} at ${fit[1]} is the dearest one within budget: ${fit[1]} × ${nights} = ${fit[1] * nights}. The result arrives as an artifact, and completed is a final state.`, tone: "ok" },
  ] };
}

// agent-memory: ranking stored memories for one request by recency, importance and relevance
export const MEM_HALF_LIFE = 24, MEM_K = 2;
function memRank(): Flow {
  const r2 = (x: number) => x.toFixed(2), ranked = rankMemories(MEM_HALF_LIFE), top = ranked.slice(0, MEM_K).map((m) => m.id);
  const byRec = [...ranked].sort((a, b) => b.rec - a.rec || a.id.localeCompare(b.id)).slice(0, MEM_K).map((m) => m.id);
  const rows = MEMORIES.map((m) => ranked.find((x) => x.id === m.id)!);
  const tone = (ids: string[], t: "ok" | "warn") => Object.fromEntries(rows.flatMap((m, i) => (ids.includes(m.id) ? [[String(i), t]] : [])));
  const age = (h: number) => (h >= 48 ? `${Math.round(h / 24)} d` : h >= 1 ? `${h} h` : `${Math.round(h * 60)} min`);
  const text = (m: Memory) => m.text;
  return { kind: "grid", title: `"${MEM_QUERY}": which ${MEM_K} memories?`, steps: [
    { note: `The store holds ${MEMORIES.length} memories about this user. Only ${MEM_K} fit the budget for this call. Each has an age, an importance (scored when it was saved) and a relevance to the request (from embeddings).`, tables: [{ head: ["id", "memory", "age"], rows: rows.map((m) => [m.id, text(m), age(m.age)]) }] },
    { note: `Recency alone: halve the weight every ${MEM_HALF_LIFE} hours. The top ${MEM_K} would be ${byRec.join(" and ")}, including small talk, and the allergy from ${Math.round(MEMORIES[0].age / 24)} days ago scores ${r2(rows[0].rec)}.`, tone: "warn", tables: [{ head: ["id", "age", "recency"], rows: rows.map((m) => [m.id, age(m.age), r2(m.rec)]), tones: tone(byRec, "warn") }] },
    { note: `Add importance and relevance: score = recency + importance + relevance. The top ${MEM_K} are ${top.join(" and ")}: ${top.map((id) => MEMORIES.find((m) => m.id === id)!.text.toLowerCase()).join(", and ")}. An important old fact survives.`, tone: "ok", tables: [{ head: ["id", "rec", "imp", "rel", "score"], rows: rows.map((m) => [m.id, r2(m.rec), r2(m.imp), r2(m.rel), r2(m.score)]), tones: tone(top, "ok") }] },
  ] };
}

// computer-use: see, act, check, on a screen the model only knows from screenshots
export const CU_CLICK: [number, number] = [1004, 92];
function cuLoop(): Flow {
  const real = toScreen(CU_CLICK);
  return { kind: "lanes", title: "Computer use: see, act, check", lanes: ["Your code", "Model", "Browser"], steps: [
    { from: 0, to: 2, label: "take screenshot", note: `The screen is ${SCREEN.w} × ${SCREEN.h}. Your code shrinks the screenshot to ${SHOT.w} × ${SHOT.h}, to save tokens and stay inside the model's image limits.` },
    { from: 0, to: 1, label: "goal + screenshot", note: "\"Search flights to Lisbon.\" The model gets the goal, the screenshot and one tool for mouse and keyboard actions." },
    { from: 1, to: 0, label: `click(${CU_CLICK.join(", ")})`, note: "It finds the search box in the picture and asks for a click at a pixel position in the screenshot it saw.", tone: "hot" },
    { from: 0, to: 0, label: `scale: (${real.join(", ")})`, note: `Your code maps the point back to the real screen: × ${SCREEN.w / SHOT.w} on each axis. Forget this and every click lands in the wrong place.`, tone: "warn" },
    { from: 0, to: 2, label: "click, then screenshot", note: "It performs the click and takes a fresh screenshot. The model must see the result before its next move." },
    { from: 0, to: 1, label: "new screenshot", note: "The box now has focus. Old screenshots can be dropped from the history: each one costs many tokens." },
    { from: 1, to: 0, label: "type(\"Lisbon\")", note: "The loop repeats: look, act, look again." },
    { from: 1, to: 0, label: "click(\"Pay\")", note: "Paying cannot be undone. Your code stops and asks the user to confirm instead of clicking.", tone: "bad" },
  ] };
}

export const FLOWS_8: Record<string, Flow> = {
  "s8-cu-loop": cuLoop(),
  "s8-mem-rank": memRank(),
  "s8-a2a": a2a(),
  "s8-reducer": reducerFlow(),
  "s8-tool-retry": toolRetry(),
  "s8-react": react(),
};
