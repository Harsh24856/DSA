// Stage 9: seeing what a live LLM app does, and shipping changes safely. Every number below is computed here or in the stage files.
import type { GModule } from "../../types.ts";
import { LAT_MS, mean, percentile, PRICE, ROLL, spanCost, TRACE } from "../../stages/s9.calc.ts";
import { CANARY } from "../../stages/s9.flows.ts";
import { BASE_BAD, detectMin } from "../../stages/s9.play.ts";

const p50 = percentile(LAT_MS, 50), p95 = percentile(LAT_MS, 95), avg = Math.round(mean(LAT_MS));
const total = TRACE.reduce((a, s) => a + s.ms, 0), cost = TRACE.reduce((a, s) => a + spanCost(s), 0);
const slow = TRACE.reduce((b, s) => (s.ms > b.ms ? s : b), TRACE[0]);
const daily = (perReq: number, reqs: number) => perReq * reqs;
const [REQS] = [200000];
// numeric: input share of cost
const inCost = TRACE.reduce((a, s) => a + ((s.inTok ?? 0) * PRICE.inPerM) / 1e6, 0);
// numeric: canary detection
const [CS, CX] = [0.01, 0.01], cMin = detectMin(ROLL.perMin, CS, CX);
// output: percentile code
const OUT = [100, 120, 110, 900, 130, 105, 115, 125, 98, 1500], o95 = percentile(OUT, 90);

export const OBSERVABILITY_ROLLOUTS: GModule = {
  id: "observability-rollouts",
  stage: 9,
  title: "Observability and rollouts",
  hook: "Once real users arrive, quality, cost and speed change in ways no test predicted. You need to see every request, and to ship each change so that a bad one hurts few people and is undone fast.",
  blocks: [
    { kind: "figure", id: "s9-trace-spans", caption: `One request, ${total.toLocaleString("en-US")} ms and $${cost.toFixed(4)}. A trace has one span per step, so you can see that ${slow.name} took most of the time, and what it read and wrote.` },
    { kind: "text", md: "**What to record per request.** One trace, with a span for each step: retrieval, every model call, every tool call. On each span keep the inputs and outputs, tokens, cost, latency, model and prompt version, and errors. Add user signals: thumbs, edits, retries, escalations.\n\nTraces let you replay a bad answer, and turn it into an eval item." },
    {
      kind: "predict",
      q: `A day's request latencies: most near ${p50} ms, two at ${Math.max(...LAT_MS).toLocaleString("en-US")} and ${[...LAT_MS].sort((a, b) => b - a)[1].toLocaleString("en-US")} ms, ${LAT_MS.length} in all. Which number best shows what the slowest users feel?`,
      answer: `p95: ${p95.toLocaleString("en-US")} ms`, wrong: [`The mean: ${avg} ms`, `p50: ${p50} ms`, `The minimum: ${Math.min(...LAT_MS)} ms`],
      why: `The mean (${avg} ms) mixes the tail into a number nobody actually saw. p50 (${p50} ms) is a typical request. p95 (${p95.toLocaleString("en-US")} ms) is what 1 user in 20 waits at least.`,
    },
    { kind: "flow", id: "s9-canary" },
    { kind: "play", id: "s9-rollout" },
    {
      kind: "compare",
      head: ["Signal", "Why", "Alert when"],
      rows: [
        ["TTFT and total latency, p50 and p95", "What users feel", "p95 over target"],
        ["Errors, timeouts, refusals", "Broken calls and over-cautious answers", "Rate jumps after a change"],
        ["Tokens and cost per request and per user", "Bills and runaway loops", "Spend over budget"],
        ["Sampled judge scores, thumbs, escalations", "Quality on live traffic", "A drop against last week"],
        ["Retrieval scores, input length, language mix", "Drift in what users ask", "The mix moves"],
      ],
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  C["change: prompt, model or retriever"] --> E["offline evals in CI"]
  E -->|fail| X["blocked"]:::bad
  E -->|pass| S["shadow: real inputs, answers hidden"]
  S --> K["canary: small share of users"]:::hot
  K -->|metrics worse| R["roll back"]:::warn
  K -->|metrics hold| W["widen in steps"]
  W --> A["everyone"]:::ok
  R --> D["add failures to the eval set"]`,
      caption: "Each stage can stop a bad change before most users see it.",
    },
    { kind: "text", md: `**Version everything.** Prompts, models, retrieval settings and tool definitions all change answers. Tag every trace with their versions, so a jump in complaints can be tied to the change that caused it, and rolling back is one config switch.\n\n**Watch cost like a metric.** At $${cost.toFixed(4)} a request, ${REQS.toLocaleString("en-US")} requests a day cost $${daily(cost, REQS).toFixed(0)}.` },
    {
      kind: "code",
      run: true,
      src: `lat = ${JSON.stringify(LAT_MS)}

def percentile(xs, p):                    # nearest rank
    s = sorted(xs)
    k = max(0, -(-p * len(s) // 100) - 1)  # ceil(p * n / 100) - 1
    return s[k]

mean = sum(lat) / len(lat)
print(f"mean {mean:.0f} ms, p50 {percentile(lat, 50)} ms, p95 {percentile(lat, 95)} ms")
assert percentile(lat, 95) > 3 * percentile(lat, 50)
`,
    },
  ],
  keyPoints: [
    "Trace every request with one span per step, keeping inputs, outputs, tokens, cost, latency, versions and errors, so failures can be replayed.",
    "Report p50 and p95, not only means; track cost per request and per user, error and refusal rates, and sampled quality scores.",
    "Version prompts, models and retrieval settings like code, and tag every trace with them.",
    "Ship in stages: offline evals in CI, shadow traffic, a small canary, then widen, with a fast rollback at each step.",
    "Small canaries take longer to judge, so size them from the change you need to detect; add every production failure to the eval set.",
  ],
  questions: [
    { id: "span", level: "easy", kind: "concept",
      q: "In a trace of an LLM request, what is a span?",
      answer: "One timed step, such as a retrieval, a model call or a tool call, with its inputs and outputs",
      wrong: ["The whole conversation history", "The number of tokens in the prompt", "A dashboard chart of latency"],
      why: "A trace is one request; spans are its steps, nested and timed. That is how you find which step was slow, costly or wrong." },
    { id: "shadow", level: "easy", kind: "concept",
      q: "What does a shadow deployment give you?",
      answer: "The new version's latency, cost and outputs on real inputs, with no user seeing them",
      wrong: ["A backup server in case the old one fails", "A way to hide prompts from users", "A faster version of the old model"],
      why: "Real traffic is copied to the new version and its answers are thrown away. You can compare them with the current ones before any user is exposed." },
    { id: "version", level: "medium", kind: "concept",
      q: "Complaints jump on Tuesday. What makes finding the cause fastest?",
      answer: "Traces tagged with prompt, model and retriever versions, so you can split metrics by version",
      wrong: ["A larger context window", "Raising the temperature to see more variety", "Turning off logging to cut latency"],
      why: "If each trace says which versions served it, you can compare before and after the change, and roll back the one that hurt." },
    { id: "drift", level: "medium", kind: "concept",
      q: "Which signal warns early that a retriever has broken?",
      answer: "Falling retrieval scores and more \"I do not know\" answers",
      wrong: ["Lower GPU temperature", "Fewer tokens in the system prompt", "A higher p50 time to first token only"],
      why: "A broken index or embedding mismatch shows up as weaker matches and more refusals before users complain. Watch fewer citations per answer too." },
    { id: "sample", level: "medium", kind: "concept",
      q: "Why score only a sample of live traffic with an LLM judge?",
      answer: "Judging every request costs as much as serving it, and a sample is enough to see trends",
      wrong: ["Judges cannot read production data", "Sampling makes the judge unbiased", "Live answers have no right answer, so judging is pointless"],
      why: "A few percent of traffic, scored daily and checked by a person weekly, catches quality drops at a fraction of the cost." },
    { id: "privacy", level: "hard", kind: "concept",
      q: "Traces contain user text. What should the logging design include?",
      answer: "Redaction of personal data, access controls and a retention limit",
      wrong: ["Nothing: logs are internal", "Storing prompts only, never outputs", "Public dashboards so users can audit them"],
      why: "Prompts and answers often hold personal or confidential data. Redact or hash it, restrict who can read traces, and delete them on a schedule, while keeping enough to debug." },
    { id: "cost-share", level: "medium", kind: "numeric",
      q: `In the traced request, input tokens cost $${PRICE.inPerM} per million and output $${PRICE.outPerM}. What share of its cost is input?`,
      answer: `${Math.round((inCost / cost) * 100)}%`, wrong: [`${Math.round((1 - inCost / cost) * 100)}%`, "50%", `${Math.round((PRICE.inPerM / (PRICE.inPerM + PRICE.outPerM)) * 100)}%`],
      why: `Input: ${TRACE.reduce((a, s) => a + (s.inTok ?? 0), 0).toLocaleString("en-US")} tokens, $${inCost.toFixed(4)}; total $${cost.toFixed(4)}. Long prompts dominate RAG bills even though output tokens cost more each, so trimming context and caching the prefix pay off.` },
    { id: "canary-time", level: "hard", kind: "numeric",
      q: `${ROLL.perMin.toLocaleString("en-US")} requests a minute, ${CS * 100}% canary. Normally ${BASE_BAD * 100}% of answers are flagged; the change adds ${CX * 100} point. To reach 3 standard deviations you need 9 × ${BASE_BAD} / (${CX}² × requests a minute × share) minutes. About how long?`,
      answer: `About ${Math.round(cMin)} minutes`, wrong: [`About ${Math.round(cMin / 10)} minutes`, `About ${Math.round(cMin / 3)} minutes`, `About ${Math.round(cMin * 10)} minutes`],
      why: `9 × ${BASE_BAD} / (${CX}² × ${ROLL.perMin} × ${CS}) = ${cMin.toFixed(0)}. Small changes on small canaries take a long time to see; a bigger share or a sharper metric helps.` },
    { id: "pct-out", level: "medium", kind: "output",
      q: "Nearest-rank p90 of ten latencies. What does this print?",
      code: `lat = ${JSON.stringify(OUT)}\ns = sorted(lat)\nprint(s[int(0.9 * len(s)) - 1])`,
      answer: String(o95), wrong: [String(Math.max(...OUT)), String(Math.round(mean(OUT))), String([...OUT].sort((a, b) => a - b)[4])],
      why: `Sorted, the 9th of 10 values is ${o95}. The mean, ${Math.round(mean(OUT))}, sits between the typical requests and the slow ones and describes neither.` },
    { id: "explain-dash", level: "medium", kind: "explain",
      q: "Which numbers would you put on an LLM app's dashboard?",
      answer: "- Traffic: requests, users, by feature.\n- Speed: TTFT and total latency at p50 and p95.\n- Failures: error, timeout and refusal rates; tool call failures; guardrail triggers.\n- Cost: tokens and dollars per request, per user and per feature; cache hit rate.\n- Quality: thumbs, edits, escalations, and sampled judge scores.\n- Drift: input length, language and topic mix, retrieval scores.\n\nEach split by prompt and model version." },
    { id: "explain-rollout", level: "hard", kind: "explain",
      q: "Walk through shipping a new prompt to a product with a million daily users.",
      answer: "- Version the prompt and run the offline eval set in CI; block on regressions.\n- Shadow it on real traffic: compare cost, latency and judge scores with the current prompt.\n- Canary to a small share, sized so the change you care about shows within hours.\n- Watch errors, latency, cost, judge scores and user signals by version against the control.\n- Widen in steps, with a one-switch rollback at each.\n- Add the failures you find to the eval set." },
    { id: "explain-incident", level: "medium", kind: "explain",
      q: "Users report odd answers, but your offline evals all pass. How do you investigate?",
      answer: "Pull the traces behind the reports and look for a pattern: which versions, servers, features, input types or times. Compare with healthy traffic in the same window.\n\nCheck recent changes in prompts, models, retrieval and infrastructure, not only code. Reproduce on the exact inputs. Then add those cases to the evals, and run quality checks on live traffic continuously, since an offline set can miss failures that hit only some requests." },
    { id: "trap-mean", level: "easy", kind: "trap",
      claim: "If mean latency is fine, users are getting fast answers.",
      truth: false,
      why: `In the sample, the mean is ${avg} ms but p95 is ${p95.toLocaleString("en-US")} ms: 1 in 20 users waits far longer than the mean suggests.` },
    { id: "trap-canary", level: "medium", kind: "trap",
      claim: "A smaller canary takes longer to give a clear verdict on a small quality change.",
      truth: true,
      why: "Fewer requests means smaller counts, which are noisier. The time to reach a clear gap grows as the share shrinks, roughly in inverse proportion." },
  ],
  real: [
    { who: "A model provider's engineering team", when: "September 2025",
      what: "A public postmortem described three infrastructure bugs from August to early September that degraded some responses: a routing error that at its worst hour hit 16% of one model's requests, output corruption from a misconfiguration, and a compiler bug in sampling. Its evaluations did not capture the degradation, partly because the model often recovered from isolated mistakes.",
      takeaway: "The team said it would run quality evaluations continuously on production systems, not only before deployment, and make its tests more sensitive.",
      url: "https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues" },
    { who: "The OpenTelemetry project", when: "2026",
      what: "OpenTelemetry keeps semantic conventions for generative AI, covering spans, metrics and events for GenAI clients and the Model Context Protocol, plus provider-specific conventions.",
      takeaway: "A shared naming scheme lets traces from different tools and providers be read the same way.",
      url: "https://github.com/open-telemetry/semantic-conventions-genai" },
  ],
};
