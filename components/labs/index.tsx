"use client";
import type { LabKind } from "@/lib/genai/labs";
import { ActivationLab, AttentionLab, BpeLab, ConvLab, DescentLab, NoiseLab, SamplingLab } from "./models";
import { AgentLab, ChunkLab, CostLab, LoraLab, MemoryLab, VectorLab } from "./systems";
import { KvPagingLab, SelfConsistencyLab, SignificanceLab, SpeculativeLab } from "./speed";

const LAB: Record<LabKind, () => React.JSX.Element> = {
  activation: ActivationLab, descent: DescentLab, conv: ConvLab, noise: NoiseLab, attention: AttentionLab, sampling: SamplingLab, bpe: BpeLab,
  cost: CostLab, chunk: ChunkLab, vector: VectorLab, agent: AgentLab, lora: LoraLab, memory: MemoryLab,
  significance: SignificanceLab, voting: SelfConsistencyLab, paging: KvPagingLab, speculative: SpeculativeLab,
};

export function GenaiLab({ kind }: { kind: LabKind }) {
  const L = LAB[kind];
  return <L />;
}
