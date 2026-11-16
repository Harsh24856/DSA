import type { RoadEntry, Stage } from "./types.ts";

// [id, title, old page]; needs default to the previous module in the stage
type Row = [string, string, string?];
type Def = { title: string; blurb: string; builds: number[]; old?: string; rows: Row[] };

const DEFS: Def[] = [
  { title: "Python for AI", blurb: "Just the Python and array habits that LLM work leans on every day.", builds: [], rows: [
    ["arrays-broadcasting", "Arrays and broadcasting"], ["data-pandas", "Data with pandas"], ["vectorising-loops", "Vectorising loops"]] },
  { title: "ML basics for LLMs", blurb: "How a model learns from examples, how we know it works, and how text becomes numbers.", builds: [0], rows: [
    ["learning-as-fitting", "Learning as fitting"], ["loss-gradient-descent", "Loss and gradient descent"],
    ["overfitting-evaluation", "Overfitting and evaluation"], ["text-as-numbers", "Text as numbers (one-hot, TF-IDF, word2vec)"]] },
  { title: "Neural networks", blurb: "Build a neuron, stack them, and learn how backprop and good training habits make deep nets work.", builds: [1], old: "m0", rows: [
    ["neuron-activations", "Neuron and activations"], ["mlp-forward", "MLP and the forward pass"], ["backprop-graph", "Backprop on a graph"],
    ["optimisers", "Optimisers (SGD, Adam, AdamW, schedules)"], ["deep-nets-train", "Making deep nets train (init, normalisation, residuals, dropout)"]] },
  { title: "Sequences", blurb: "Why order matters, how recurrent nets read it, and how attention fixed their limits.", builds: [2], old: "m1", rows: [
    ["why-order-matters", "Why order matters"], ["rnn-bptt", "RNN and BPTT"], ["lstm-gru", "LSTM and GRU"],
    ["seq2seq-bottleneck", "Seq2seq and the bottleneck"], ["attention-fix", "Attention as the fix"]] },
  { title: "The transformer", blurb: "Every part of the transformer, from tokens to the next word it picks.", builds: [3], old: "m2", rows: [
    ["tokenisation-bpe", "Tokenisation and BPE"], ["embeddings-positions", "Embeddings and positions (sinusoidal, RoPE)"], ["self-attention", "Self-attention"],
    ["multi-head-masks", "Multi-head and masks"], ["transformer-block", "The block (norm, FFN, residual)"],
    ["encoder-decoder", "Encoder, decoder, encoder-decoder"], ["decoding", "Decoding (greedy, temperature, top-k, top-p, beam)"]] },
  { title: "Training LLMs", blurb: "How a base model is pretrained, then shaped into a helpful assistant.", builds: [4], old: "m6", rows: [
    ["pretraining-scaling", "Pretraining and scaling laws"], ["data-pipelines", "Data pipelines"], ["sft-chat-templates", "SFT and chat templates"],
    ["preference-tuning", "Preference tuning (RLHF, DPO)"], ["rl-verifiable", "RL with verifiable rewards (GRPO)"],
    ["lora-qlora", "LoRA and QLoRA"], ["distillation-small", "Distillation and small models"]] },
  { title: "Using LLMs", blurb: "Call models well: prompts, structured output, context and running them locally.", builds: [4], old: "m3", rows: [
    ["api-roles-streaming", "API calls, roles and streaming"], ["prompting-patterns", "Prompting patterns"], ["structured-output", "Structured output"],
    ["context-caching", "Context engineering and caching"], ["local-models", "Local models"]] },
  { title: "RAG", blurb: "Give a model your own documents: ingest, search, rerank, and measure the result.", builds: [6], old: "m4", rows: [
    ["rag-ingest", "Ingest (parse, chunk, embed)"], ["vector-search", "Vector search (cosine, ANN, HNSW)"], ["hybrid-rerank", "Hybrid search and reranking"],
    ["advanced-rag", "Advanced RAG (query rewrite, GraphRAG, agentic RAG)"], ["rag-evals", "RAG evals"]] },
  { title: "Agents", blurb: "Let a model use tools, plan, remember and work with other agents.", builds: [7], old: "m5", rows: [
    ["tool-calling", "Tool calling"], ["agent-loop-react", "The agent loop and ReAct"], ["state-graphs", "State graphs (LangGraph)"], ["mcp-a2a", "MCP and A2A"],
    ["agent-memory", "Memory"], ["computer-use", "Computer and browser use"], ["multi-agent", "Multi-agent patterns"]] },
  { title: "Production", blurb: "Make it fast, cheap, measured and safe once real users arrive.", builds: [8], rows: [
    ["time-memory", "Where time and memory go", "m12"], ["kv-cache-paged", "KV cache and paged attention", "m7"], ["batching-engines", "Batching and serving engines", "m7"],
    ["quantisation", "Quantisation", "m12"], ["speculative-decoding", "Speculative decoding", "m12"], ["evals-judge", "Evals and LLM as judge", "m10"],
    ["observability-rollouts", "Observability and rollouts", "m7"], ["security-guardrails", "Security (prompt injection, guardrails)", "m7"]] },
  { title: "Frontier (2026)", blurb: "The newest ideas: reasoning, sparse and hybrid models, multimodal systems and coding agents.", builds: [5, 9], rows: [
    ["reasoning-models", "Reasoning models and test-time compute", "m11"], ["mixture-of-experts", "Mixture of experts", "m1"],
    ["state-space-hybrids", "State space models and hybrids", "m1"], ["long-context", "Long context", "m1"], ["vision-language", "Vision language models", "m8"],
    ["voice-realtime", "Voice and realtime", "m8"], ["diffusion-flow", "Diffusion and flow matching", "m8"], ["video-world", "Video and world models", "m8"],
    ["coding-agents", "AI coding agents", "m11"]] },
];

// Every module must come after the modules it needs; unknown ids fail too.
export function withNeeds(stages: Stage[]): Stage[] {
  const at = new Map<string, number>();
  let i = 0;
  for (const s of stages) for (const m of s.modules) at.set(m.id, i++);
  i = 0;
  for (const s of stages) for (const m of s.modules) {
    for (const n of m.needs) {
      const j = at.get(n);
      if (j === undefined) throw new Error(`${m.id} needs ${n}, which does not exist`);
      if (j >= i) throw new Error(`${m.id} needs ${n}, which comes later`);
    }
    i++;
  }
  return stages;
}

export const ROAD: Stage[] = withNeeds(DEFS.map((d, n, all) => ({
  n, title: d.title, blurb: d.blurb, builds: d.builds,
  modules: d.rows.map(([id, title, old], k): RoadEntry => ({
    id, title, old: old ?? d.old, built: false,
    needs: k > 0 ? [d.rows[k - 1][0]] : d.builds.map(b => all[b].rows[all[b].rows.length - 1][0]),
  })),
})));
