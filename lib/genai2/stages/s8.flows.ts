// Stage 8 (Agents) animated walk-throughs. Every number is computed here or in s8.calc.ts.
import type { Flow } from "../../other/flows.ts";

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

export const FLOWS_8: Record<string, Flow> = {
  "s8-tool-retry": toolRetry(),
};
