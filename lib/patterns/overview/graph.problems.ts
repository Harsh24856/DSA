// Must-do "graph" questions that no pattern lists. Every one needs a solution in lib/solutions (and its C++).
import type { PProblem } from "../problems.ts";

export const MUST: PProblem[] = [
  [997, "Find the Town Judge", "find-the-town-judge", "Easy", false],
  [752, "Open the Lock", "open-the-lock", "Medium", false],
  [934, "Shortest Bridge", "shortest-bridge", "Medium", false],
  [1466, "Reorder Routes to Make All Paths Lead to the City Zero", "reorder-routes-to-make-all-paths-lead-to-the-city-zero", "Medium", false],
  [1319, "Number of Operations to Make Network Connected", "number-of-operations-to-make-network-connected", "Medium", false],
  [2316, "Count Unreachable Pairs of Nodes in an Undirected Graph", "count-unreachable-pairs-of-nodes-in-an-undirected-graph", "Medium", false],
  [433, "Minimum Genetic Mutation", "minimum-genetic-mutation", "Medium", false],
  [815, "Bus Routes", "bus-routes", "Hard", false],
  [827, "Making A Large Island", "making-a-large-island", "Hard", false],
];
/** Closest pattern for each question above that is new to the app: slug -> "topic:n". */
export const MAP: Record<string, string> = {
  "find-the-town-judge": "graph:3",
  "open-the-lock": "graph:2",
  "shortest-bridge": "graph:10",
  "reorder-routes-to-make-all-paths-lead-to-the-city-zero": "graph:1",
};
