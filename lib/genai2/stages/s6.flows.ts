// Stage 6 (Using LLMs) animated walk-throughs. Every number is computed here.
import type { Flow } from "../../other/flows.ts";

// api-roles-streaming: two turns of a chat, told as messages between your app and the API (example token counts)
function roles(): Flow {
  const SYS = 40, U1 = 12, A1 = 60, U2 = 10, A2 = 300;
  const t1 = SYS + U1, t2 = SYS + U1 + A1 + U2;
  return { kind: "lanes", title: "Two turns of a chat (example token counts)", lanes: ["Your app", "Model API"], steps: [
    { from: 0, to: 1, label: `system + user: ${t1} tok`, note: `Turn 1. The system message (${SYS} tokens) sets the rules and the format. The user message (${U1}) asks the question.` },
    { from: 1, to: 0, label: "assistant, end_turn", note: `The reply comes back with stop reason end_turn: it finished by itself. Usage says ${t1} input and ${A1} output tokens.`, tone: "ok" },
    { from: 0, to: 0, label: "save to history", note: "The API kept nothing. Your app appends the assistant message to its own list of messages." },
    { from: 0, to: 1, label: `all 4 messages: ${t2} tok`, note: `Turn 2 resends system, user, assistant and the new question: ${t2} input tokens for a ${U2} token question.`, tone: "hot" },
    { from: 1, to: 0, label: "assistant, max_tokens", note: `This answer hit the cap of ${A2} output tokens and stops mid-sentence. The text looks normal, so check the stop reason every time.`, tone: "warn" },
    { from: 0, to: 0, label: "raise cap or continue", note: "Raise max_tokens, or ask the model to continue. Log the usage of every call so cost never surprises you.", tone: "ok" },
  ] };
}

// prompting-patterns: routing, a three step chain and an evaluator loop, with the calls counted
function chain(): Flow {
  const STEPS = ["extract the facts", "analyse them", "write the answer"], FAILS = 1;
  const simple = 2, hard = 1 + STEPS.length + (FAILS + 1) + FAILS;
  return { title: "Routing, chaining and an evaluator", steps: [
    { node: "router: a cheap call labels it", note: `One small, fast call decides: simple FAQ or needs analysis. A simple request takes ${simple} calls in all, router plus one answer.`, tone: "hot" },
    ...STEPS.map((s, i) => ({ node: `step ${i + 1}: ${s}`, note: i === 0 ? "Each step is its own call with its own short prompt, so you can test and fix it alone." : i === 1 ? "The output of one step is the input of the next. A wrong fact here shows up in the step's own test, not as a vague bad answer." : "The writer sees only the analysis, not the raw documents, so its prompt stays short." })),
    { node: "evaluator: meets the rubric?", note: `A second call grades the draft against a written checklist. Here it fails ${FAILS === 1 ? "once" : `${FAILS} times`} and sends back a critique.`, tone: "warn" as const },
    { node: "revise, check again, answer", note: `After the revision the check passes. The hard path cost ${hard} calls against ${simple} for a simple one, so add each pattern only when an eval shows it helps.`, tone: "ok" as const },
  ] };
}

// structured-output: validate, send back the exact errors, try again
function retry(): Flow {
  const reply: Record<string, unknown> = { vendor: "Acme", total: "12,40", currency: "inr" };
  const rules: [string, (x: Record<string, unknown>) => boolean, string][] = [
    ["vendor", (x) => typeof x.vendor === "string", "vendor must be text"],
    ["total", (x) => typeof x.total === "number" && x.total > 0, "total must be a number above 0"],
    ["currency", (x) => typeof x.currency === "string" && /^[A-Z]{3}$/.test(x.currency), "currency must be 3 capital letters"],
  ];
  const errs = rules.filter(([, ok]) => !ok(reply)).map(([, , msg]) => msg);
  const fixed = { ...reply, total: Number(String(reply.total).replace(",", ".")), currency: String(reply.currency).toUpperCase() };
  const left = rules.filter(([, ok]) => !ok(fixed)).length;
  return { kind: "lanes", title: "Validate and retry", lanes: ["App", "Model", "Validator"], steps: [
    { from: 0, to: 1, label: "prompt + JSON schema", note: "Ask for an invoice as JSON and send the schema: vendor text, total a number above 0, currency 3 capital letters." },
    { from: 1, to: 0, label: "Sure! {...}", note: `The reply wraps the JSON in chatter and writes total as "${reply.total}" and currency as "${reply.currency}".`, tone: "warn" },
    { from: 0, to: 2, label: "cut out {...}, validate", note: "Take the text from the first { to the last }, parse it, then check types, ranges and allowed values." },
    { from: 2, to: 0, label: `${errs.length} errors`, note: `The validator names each problem: ${errs.join("; ")}.`, tone: "bad" },
    { from: 0, to: 1, label: "reply + exact errors", note: "Append the bad reply and the exact messages. The model now knows precisely what to fix, which a bare \"try again\" does not tell it.", tone: "hot" },
    { from: 1, to: 0, label: "corrected JSON", note: `Try 2: total ${fixed.total}, currency ${fixed.currency}.` },
    { from: 2, to: 0, label: left ? `${left} errors` : "valid on try 2", note: "It passes. Cap the tries, and if they run out, fail loudly and log the case for your eval set.", tone: left ? "bad" : "ok" },
  ] };
}

export const FLOWS_6: Record<string, Flow> = {
  "s6-retry": retry(),
  "s6-roles": roles(),
  "s6-chain": chain(),
};
