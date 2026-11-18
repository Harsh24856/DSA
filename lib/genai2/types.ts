/** The interactive labs in components/labs, placed in a module by a `lab` block. */
export type LabKind = "activation" | "descent" | "noise" | "attention" | "sampling" | "bpe" | "cost" | "chunk" | "vector" | "agent" | "lora" | "memory"
  | "significance" | "voting" | "paging" | "speculative";

export type Level = "easy" | "medium" | "hard";

export type GQuestion = { id: string; level: Level } & (
  | { kind: "concept" | "numeric" | "output"; q: string; code?: string; answer: string; wrong: string[]; why: string }
  | { kind: "explain"; q: string; answer: string }
  | { kind: "trap"; claim: string; truth: boolean; why: string }
);

export type Block =
  | { kind: "flow"; id: string }
  | { kind: "play"; id: string }
  | { kind: "lab"; id: LabKind }
  | { kind: "figure"; id: string; caption: string }
  | { kind: "mermaid"; src: string; caption: string }
  | { kind: "text"; md: string }
  | { kind: "compare"; head: string[]; rows: string[][] }
  // run: a Run button (Pyodide, numpy only) and check:genai runs it. torch: PyTorch code, shown with no Run button; check:genai runs it with the local python3 and torch.
  | { kind: "code"; src: string; run?: boolean; torch?: boolean }
  | { kind: "predict"; q: string; answer: string; wrong: string[]; why: string };

export type GModule = {
  id: string; stage: number; title: string; hook: string;
  blocks: Block[]; keyPoints: string[]; questions: GQuestion[];
  lab?: string;
  real?: { who: string; when: string; what: string; takeaway: string; url: string }[];
};

export type RoadEntry = { id: string; title: string; old?: string; needs: string[]; built: boolean };
export type Stage = { n: number; title: string; blurb: string; builds: number[]; modules: RoadEntry[] };
