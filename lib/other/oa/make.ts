// Short builders for OA questions. Options are the answer plus `wrong`; the page shuffles them, so no "all of the above".
import type { OaCode, OaQuestion } from "../types.ts";

export const concept = (id: string, q: string, answer: string, wrong: string[], why: string): OaQuestion => ({ id, kind: "concept", q, answer, wrong, why });
export const numeric = (id: string, q: string, value: number | string, wrong: (number | string)[], why: string, unit = ""): OaQuestion => ({ id, kind: "numeric", q, answer: `${value}${unit}`, wrong: wrong.map((w) => `${w}${unit}`), why });
export const output = (id: string, q: string, code: OaCode, answer: string, wrong: string[], why: string): OaQuestion => ({ id, kind: "output", q, code, answer, wrong, why });
export const r2 = (x: number) => Math.round(x * 100) / 100;
