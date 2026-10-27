import type { Diagram } from "../diagram";

/** A hand-written solution for one problem, with a visualiser that runs it on a small example. */
export type Solution = {
  approach: string;           // one line: the key move
  idea: string[];             // why it works, in plain steps
  code: string;               // Python (or SQL for database problems)
  lang: "python" | "sql";
  time: string; space: string;
  viz: () => Diagram;
};
