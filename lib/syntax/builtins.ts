// "Built-in data structures": every standard container of C++ and Python, its operations and costs, which key and value
// types it accepts, its traps, and a real-world program. C++ and Python only. Written in builtins-a.ts and builtins-b.ts.
import type { SynGroup, SynLang } from "./topics.ts";
import { CODE as CA, OUT as OA, TOPICS as TA } from "./builtins-a.ts";
import { CODE as CB, OUT as OB, TOPICS as TB } from "./builtins-b.ts";

export const BUILTIN_GROUP: SynGroup = { title: "Built-in data structures", langs: ["cpp", "python"], topics: [...TA, ...TB] };
export const BUILTIN_CODE: Record<string, Partial<Record<SynLang, string>>> = { ...CA, ...CB };
const outs = { ...OA, ...OB };
export const BUILTIN_OUT: Record<string, string> = Object.fromEntries(Object.entries(outs).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
export const BUILTIN_OUT_BY_LANG: Record<string, Partial<Record<SynLang, string>>> = Object.fromEntries(Object.entries(outs).flatMap(([k, v]) => (typeof v === "string" ? [] : [[k, v]])));
