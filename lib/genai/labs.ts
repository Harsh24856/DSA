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

// Where each animated walk-through (lib/other/flows-genai.ts) sits: section id -> [slide id, flow id] pairs.
export const FLOW_SLOTS: Record<string, [string, string][]> = {
  m0: [["s-5", "g-backprop"]],
  m1: [["s-3", "g-rnn"]],
  m2: [["s-1", "g-text"], ["s-4", "g-kv"], ["s-7", "g-attn"], ["s-8", "g-mask"]],
  m3: [["s-1", "g-stateless"], ["s-7", "g-cache"]],
  m4: [["s-1", "g-rag"], ["s-3", "g-rrf"], ["s-6", "g-recall"], ["s-7", "g-hnsw"]],
  m5: [["s-3", "g-toolloop"], ["s-5", "g-mcp"], ["s-8", "g-interrupt"]],
  m6: [["s-5", "g-grpo"], ["s-6", "g-lora"]],
  m7: [["s-6", "g-batching"], ["s-8", "g-injection"]],
  m8: [["s-2", "g-voice"], ["s-4", "g-diffusion"], ["s-5", "g-vision"]],
  m10: [["s-1", "g-evalloop"], ["s-2", "g-kappa"]],
  m11: [["s-3", "g-grammar"]],
  m12: [["s-3", "g-quant"]],
};
