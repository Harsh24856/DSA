// Stage 8 (Agents): the small calculations shared by the flows, the walk-throughs, the figures and the module text. Client-safe: no module text here.

export const n0 = (x: number) => Math.round(x).toLocaleString("en-US");
export const pct = (x: number) => `${Math.round(x * 100)}%`;

// A rough rule for English text: about 4 characters per token. Used only to size examples, never as a real count.
export const roughTokens = (s: string) => Math.ceil(s.length / 4);

// The example tool used across the stage.
export const ORDER_TOOL = {
  name: "get_order",
  description: "Look up one order by its id. Use it when the user asks where an order is or what it contains.",
  input_schema: { type: "object", properties: { order_id: { type: "string", description: "Order id, like A-1042" } }, required: ["order_id"] },
};
export const TOOL_TOKENS = roughTokens(JSON.stringify(ORDER_TOOL));

// The agent loop resends the whole history on every call. Call i (from 0) carries the prompt plus i observations.
export const callInput = (prompt: number, obs: number, i: number) => prompt + i * obs;
export const loopInput = (prompt: number, obs: number, calls: number) => Array.from({ length: calls }, (_, i) => callInput(prompt, obs, i)).reduce((a, b) => a + b, 0);

// Steps that each succeed with chance p, all needed: the whole task succeeds with p^n (if failures are independent).
export const chainOk = (p: number, n: number) => p ** n;
// With up to r tries per step, a step fails only if every try fails.
export const stepWithRetries = (p: number, r: number) => 1 - (1 - p) ** r;

// N apps and M tools: custom glue for every pair, or one adapter each on a shared protocol.
export const glue = (apps: number, tools: number) => ({ pairs: apps * tools, protocol: apps + tools });

// Memory retrieval: a toy score that adds recency, importance and relevance, each from 0 to 1, with weights.
export const recency = (ageHours: number, halfLife: number) => 0.5 ** (ageHours / halfLife);
export const memScore = (ageHours: number, importance: number, relevance: number, halfLife: number, w = [1, 1, 1]) =>
  w[0] * recency(ageHours, halfLife) + w[1] * importance + w[2] * relevance;
export type Memory = { id: string; text: string; age: number; imp: number; rel: number };
export const MEMORIES: Memory[] = [
  { id: "M1", text: "Allergic to peanuts", age: 2160, imp: 0.9, rel: 0.8 },
  { id: "M2", text: "Asked for a table at 8", age: 1, imp: 0.3, rel: 0.6 },
  { id: "M3", text: "Likes window seats", age: 720, imp: 0.4, rel: 0.5 },
  { id: "M4", text: "Said hello", age: 0.5, imp: 0.05, rel: 0.1 },
  { id: "M5", text: "Prefers Thai food", age: 48, imp: 0.5, rel: 0.9 },
];
export const MEM_QUERY = "Book dinner for me tonight";
export const rankMemories = (halfLife: number, w = [1, 1, 1]) =>
  MEMORIES.map((m) => ({ ...m, rec: recency(m.age, halfLife), score: memScore(m.age, m.imp, m.rel, halfLife, w) })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

// Computer use: the model sees a smaller screenshot, so its click must be scaled back to the real screen.
export const SCREEN = { w: 2560, h: 1440 }, SHOT = { w: 1280, h: 720 };
export const toScreen = ([x, y]: [number, number], shot = SHOT, screen = SCREEN): [number, number] => [Math.round((x * screen.w) / shot.w), Math.round((y * screen.h) / shot.h)];
// Input tokens over a run when every call carries the last `keep` screenshots plus a fixed prompt.
export const shotInput = (steps: number, perShot: number, keep: number, prompt: number) =>
  Array.from({ length: steps }, (_, i) => prompt + Math.min(i + 1, keep) * perShot).reduce((a, b) => a + b, 0);

// Multi-agent fan-out: plan, then workers in parallel (the slowest sets the time), then merge.
export const fanTime = (plan: number, tasks: number[], merge: number, parallel: boolean) => plan + (parallel ? Math.max(...tasks) : tasks.reduce((a, b) => a + b, 0)) + merge;
