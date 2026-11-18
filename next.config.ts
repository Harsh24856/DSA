import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sign-in is a dialog on every page now; keep old /login links working
  async redirects() {
    return [
      { source: "/login", destination: "/", permanent: true },
      { source: "/roadmap", destination: "/other", permanent: false },   // Roadmap was replaced by Other
      // the old Gen AI playbook pages, now replaced by the stage modules
      ...Object.entries({ start: "", m0: "neuron-activations", m1: "rnn-bptt", m2: "self-attention", m3: "api-roles-streaming", m4: "rag-ingest", m5: "tool-calling",
        m6: "sft-chat-templates", m7: "batching-engines", m8: "vision-language", m9: "capstone", m10: "evals-judge", m11: "reasoning-models", m12: "speculative-decoding" })
        .map(([from, to]) => ({ source: `/genai/${from}`, destination: to ? `/genai/${to}` : "/genai", permanent: true })),
    ];
  },
};

export default nextConfig;
