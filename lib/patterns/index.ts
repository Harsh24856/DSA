// Pattern study section: theory + visualiser + practice problems per pattern.
// Separate from the daily plan: its problems and ticks never touch lib/problems.ts or dsa-daily-v1.
import { ARRAY, STRING } from "./arrays";
import { HEAP, INTERVALS, LINKEDLIST, STACK } from "./linear";
import { GRAPH, TREE, TRIE } from "./nonlinear";
import { BITS, DP, GREEDY, RECURSION } from "./techniques";
import { LOGIC } from "./logic";
import { PATTERN_PROBLEMS, type PProblem } from "./problems";
import type { Pattern, Topic } from "./types";
import { DEEP } from "./deep";
import { OVERVIEWS } from "./overview";
import { NEEDS, PATTERN_ORDER, studyPath, TOPIC_ORDER } from "./order";
import { PATTERN_CPP } from "./cpp";

export const TOPICS: Topic[] = [ARRAY, STRING, LINKEDLIST, STACK, HEAP, INTERVALS, TREE, TRIE, GRAPH, RECURSION, DP, GREEDY, BITS, LOGIC];
// new patterns, deeper theory and the C++ templates join each topic here
for (const t of TOPICS) {
  t.overview ??= OVERVIEWS[t.id]; t.cpp ??= PATTERN_CPP[`${t.id}:0`];   // the structure itself: theory and its C++ implementation
  const deep = DEEP[t.id];
  if (deep) t.patterns.push(...deep.MORE.filter((p) => !t.patterns.some((q) => q.n === p.n)));
  for (const p of t.patterns) { p.theory ??= deep?.THEORY[p.n]; p.cpp ??= PATTERN_CPP[`${t.id}:${p.n}`]; }
}
// study order: topics from the basics up, each topic's patterns easiest first (lib/patterns/order.ts). A pattern or topic
// missing from the order would silently sink to the end, so the build fails instead.
const rank = (list: (string | number)[], x: string | number) => { const i = list.indexOf(x); if (i < 0) throw new Error(`lib/patterns/order.ts does not place ${x}`); return i; };
TOPICS.sort((a, b) => rank(TOPIC_ORDER, a.id) - rank(TOPIC_ORDER, b.id));
for (const t of TOPICS) {
  const order = PATTERN_ORDER[t.id] ?? [];
  if (order.length !== t.patterns.length || new Set(order).size !== order.length) throw new Error(`lib/patterns/order.ts: ${t.id} lists ${order.length} patterns, the topic has ${t.patterns.length}`);
  t.patterns.sort((a, b) => rank(order, a.n) - rank(order, b.n));
}
if (TOPIC_ORDER.length !== TOPICS.length) throw new Error("lib/patterns/order.ts lists a topic that does not exist");
/** Every pattern in the order to learn it, across topics: "topic:n" keys (lib/patterns/order.ts). */
export const STUDY_PATH = studyPath(new Set(TOPICS.flatMap((t) => t.patterns.map((p) => `${t.id}:${p.n}`))));
/** The topic and pattern behind a "topic:n" key. */
export const patternByKey = (key: string) => { const [id, n] = key.split(":"); const t = topicById(id); const p = t?.patterns.find((q) => q.n === +n); return t && p ? { t, p } : undefined; };
export { NEEDS };
export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
export const problemsOf = (topic: string, n: number): PProblem[] => PATTERN_PROBLEMS[topic]?.[n] ?? [];
/** Every question of a topic: each pattern's list plus the must-do list (list 0). */
export const topicProblems = (t: Topic) => [...new Map([...t.patterns.flatMap((p) => problemsOf(t.id, p.n)), ...problemsOf(t.id, 0)].map((x) => [x[0], x])).values()];
export const ALL_LC = [...new Set(TOPICS.flatMap((t) => topicProblems(t).map((x) => x[0])))];
export const lcUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;
export type { Pattern, Topic, PProblem };
