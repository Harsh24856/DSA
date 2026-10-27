// Diagram specs: a renderer kind plus precomputed frames. Simulators in lib/sim.ts build these by
// running the real algorithm on a tiny input, so every frame is a true intermediate state.

export type Tone = "active" | "window" | "done" | "found" | "bad" | "muted";
export type Mark = { i: number; label: string; row?: number };

export type CellsFrame = { note: string; rows?: (string | number)[][]; tones?: Record<string, Tone>; marks?: Mark[] }; // tone key "row:i"
export type TreeFrame = { note: string; tones?: Record<number, Tone>; labels?: Record<number, string>; badges?: Record<number, string> };
export type GraphFrame = { note: string; tones?: Record<number, Tone>; edgeTones?: Record<string, Tone>; badges?: Record<number, string> }; // edge key "a-b"
export type TableFrame = { note: string; cells: (string | number | null)[][]; active?: [number, number]; deps?: [number, number][]; tones?: Record<string, Tone> };
export type StackFrame = { note: string; items: (string | number)[]; incoming?: string | number; popped?: (string | number)[]; side?: string };
export type ListFrame = { note: string; next: number[]; ptrs: Mark[]; tones?: Record<number, Tone>; values?: (string | number)[] }; // next[i] = target node, -1 = null
export type SqlTable = { name: string; cols: string[]; rows: (string | number | null)[][]; hl?: number[]; tone?: Tone };
export type TablesFrame = { note: string; tables: SqlTable[] };
export type IntervalsFrame = { note: string; tones?: Record<number, Tone>; result?: [number, number][]; line?: number };

export type Diagram =
  | { kind: "cells"; title: string; rowLabels?: string[]; rows: (string | number)[][]; frames: CellsFrame[] }
  | { kind: "tree"; title: string; nodes: { id: number; label: string; parent: number | null; side?: "L" | "R"; edge?: string }[]; frames: TreeFrame[] }
  | { kind: "graph"; title: string; nodes: { id: number; label: string; x: number; y: number }[]; edges: { a: number; b: number; w?: number; directed?: boolean }[]; frames: GraphFrame[] }
  | { kind: "table"; title: string; rowHead: string[]; colHead: string[]; frames: TableFrame[] }
  | { kind: "stack"; title: string; input?: (string | number)[]; frames: StackFrame[] }
  | { kind: "list"; title: string; values: (string | number)[]; frames: ListFrame[] }
  | { kind: "intervals"; title: string; items: [number, number][]; frames: IntervalsFrame[] }
  | { kind: "tables"; title: string; frames: TablesFrame[] };
