// Where each interactive lab (components/GenaiLabs.tsx) sits: section id → [slide id, lab] pairs.
// The lab is appended to the end of that slide, after the notes it illustrates.
export type LabKind = "activation" | "descent" | "conv" | "noise" | "attention" | "sampling" | "bpe" | "cost" | "chunk" | "vector" | "agent" | "lora" | "memory"
  | "significance" | "voting" | "paging" | "speculative";

export const LABS: Record<string, [string, LabKind][]> = {
  m0: [["s-1", "activation"], ["s-2", "descent"]],
  m1: [["s-2", "conv"], ["s-7", "noise"]],
  m2: [["s-2", "attention"], ["s-4", "sampling"], ["s-6", "bpe"]],
  m3: [["s-6", "cost"]],
  m4: [["s-2", "chunk"], ["s-3", "vector"]],
  m5: [["s-2", "agent"]],
  m6: [["s-2", "lora"]],
  m7: [["s-1", "memory"]],
  m10: [["s-3", "significance"]],
  m11: [["s-2", "voting"]],
  m12: [["s-2", "paging"], ["s-4", "speculative"]],
};
