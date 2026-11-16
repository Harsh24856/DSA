export type Fw = "numpy" | "torch";

// A missing `numpy` key means the step is PyTorch only.
export type LabStep = {
  id: string;
  title: string;
  goal: string;
  signature: string;
  starter: Partial<Record<Fw, string>>;
  reference: Partial<Record<Fw, string>>;
  tests: string;   // Python, shared by both frameworks: build inputs with T(x), read outputs with to_np(x)
  hints: string[];
};

export type Lab = { id: string; title: string; blurb: string; module: string; steps: LabStep[] };

export type TestResult = { name: string; pass: boolean; msg: string };
