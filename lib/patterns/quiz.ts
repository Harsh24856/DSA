// Pattern questions for the drill and the solve sheet. Apart from the index because the question map is large and most pages using patterns never quiz.
import { TOPICS } from "./index";
import { PATTERN_PROBLEMS } from "./problems";
import { SOLVE_EXACT, SOLVE_MAP } from "./solveMap";
import type { QuizPattern } from "../practice";

export const QUIZ: QuizPattern[] = TOPICS.flatMap((t) => t.patterns.map((p) => ({ key: `${t.id}:${p.n}`, name: p.name, topic: t.id, signals: p.signals })));
const lists = (() => {
  const m = new Map<string, { title: string; keys: string[] }>();
  for (const [topic, byN] of Object.entries(PATTERN_PROBLEMS)) for (const [n, rows] of Object.entries(byN)) for (const [, title, slug] of rows) {
    const e = m.get(slug) ?? { title, keys: [] };
    e.keys.push(`${topic}:${n}`); m.set(slug, e);
  }
  return m;
})();
/** Names of the other patterns that list this question, which are also right answers. */
export const alsoRight = (slug: string, key: string) => (lists.get(slug)?.keys ?? []).filter((k) => k !== key).flatMap((k) => QUIZ.find((p) => p.key === k)?.name ?? []);
/** Questions the drill can ask: only those a pattern lists itself, not ones matched from LeetCode tags. */
export const drillPool = () => [...SOLVE_EXACT].flatMap((slug) => {
  const e = lists.get(slug), key = SOLVE_MAP[slug];
  return e && key ? [{ slug, title: e.title, key, also: e.keys.filter((k) => k !== key) }] : [];
});
