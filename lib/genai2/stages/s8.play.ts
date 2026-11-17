// Stage 8 (Agents) slider walk-throughs, placed in modules by a `play` block. Every number is computed here or in s8.calc.ts.
import type { Flow } from "../../other/flows.ts";
import type { PlayFlow } from "../../other/flows-play-types.ts";

export const kfmt = (x: number) => (x >= 1e6 ? `${(x / 1e6).toFixed(1)}M` : x >= 1e4 ? `${Math.round(x / 1e3)}k` : x >= 1e3 ? `${(x / 1e3).toFixed(1)}k` : String(Math.round(x)));
const n0 = (x: number) => Math.round(x).toLocaleString("en-US");

// tool-calling: tool schemas ride along on every call
export const PICKED = 5;
function toolBudget(v: Record<string, number>): Flow {
  const { tools, per, calls } = v, all = tools * per, few = Math.min(tools, PICKED) * per;
  const bars = (a: number, b: number) => [{ label: "all tools", value: a, tone: "warn" as const }, { label: `${Math.min(tools, PICKED)} picked`, value: b, tone: "ok" as const }];
  return { kind: "bars", title: `${tools} tools, ${per} tokens each, ${calls} calls`, format: kfmt, steps: [
    { note: `Every call that offers the tools carries their names, descriptions and schemas: ${tools} × ${per} = ${n0(all)} input tokens before the user's question.`, tone: "warn", bars: bars(all, all) },
    { note: `A task that takes ${calls} model call${calls > 1 ? "s" : ""} sends them ${calls} time${calls > 1 ? "s" : ""}: ${n0(all * calls)} tokens of schemas alone.`, tone: "hot", bars: bars(all * calls, all * calls) },
    { note: tools > PICKED ? `Offer only the ${PICKED} tools that fit this request (chosen by a router or a search over tool descriptions): ${n0(few * calls)} tokens, ${(all / few).toFixed(1)} times fewer. Fewer, clearer tools are also picked correctly more often.` : `With ${tools} tool${tools > 1 ? "s" : ""} there is nothing to trim. Past a few dozen tools, picking a subset per request saves tokens and wrong picks.`, tone: "ok", bars: bars(all * calls, few * calls) },
  ] };
}

export const PLAY_8: Record<string, PlayFlow> = {
  "s8-tool-budget": {
    title: "What do tool schemas cost?",
    knobs: [
      { key: "tools", label: "Tools offered", min: 1, max: 80, step: 1, value: 40 },
      { key: "per", label: "Tokens per tool definition", min: 50, max: 600, step: 10, value: 150 },
      { key: "calls", label: "Model calls per task", min: 1, max: 20, step: 1, value: 6 },
    ],
    make: toolBudget,
  },
};
