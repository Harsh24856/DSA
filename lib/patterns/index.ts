// Pattern study section: theory + visualiser + practice problems per pattern.
// Separate from the daily plan: its problems and ticks never touch lib/problems.ts or dsa-daily-v1.
import { ARRAY, STRING } from "./arrays";
import { HEAP, INTERVALS, LINKEDLIST, STACK } from "./linear";
import { GRAPH, TREE, TRIE } from "./nonlinear";
import { BITS, DP, GREEDY, RECURSION } from "./techniques";
import { LOGIC } from "./logic";
import { PATTERN_PROBLEMS, type PProblem } from "./problems";
import type { Pattern, Topic } from "./types";

export const TOPICS: Topic[] = [ARRAY, STRING, LINKEDLIST, STACK, HEAP, INTERVALS, TREE, TRIE, GRAPH, RECURSION, DP, GREEDY, BITS, LOGIC];
export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
export const problemsOf = (topic: string, n: number): PProblem[] => PATTERN_PROBLEMS[topic]?.[n] ?? [];
export const topicProblems = (t: Topic) => [...new Map(t.patterns.flatMap((p) => problemsOf(t.id, p.n)).map((x) => [x[0], x])).values()];
export const ALL_LC = [...new Set(TOPICS.flatMap((t) => topicProblems(t).map((x) => x[0])))];
export const lcUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;
export type { Pattern, Topic, PProblem };
