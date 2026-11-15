// System Design chapters, part 4: machine learning system design (recommendations, search, ads, the ML platform and LLM
// applications). The topic list came from a public resource list; the text is original. Every number is computed here
// from the stated assumptions, never typed by hand.
import type { Chapter } from "./types.ts";

const DAY = 86_400;
const n0 = (x: number) => Math.round(x).toLocaleString("en-US");
const n1 = (x: number) => (Math.round(x * 10) / 10).toLocaleString("en-US");
const n2 = (x: number) => (Math.round(x * 100) / 100).toFixed(2);
const n3 = (x: number) => (Math.round(x * 1000) / 1000).toFixed(3);

/* ---------- framework: a feed that is ranked by a model ---------- */
const FR = { dau: 100e6, opens: 10, peak: 3, scored: 500 };
const frQps = (FR.dau * FR.opens) / DAY;
const frScores = frQps * FR.peak * FR.scored;

/* ---------- recommendations: the funnel ---------- */
const REC = { corpus: 10e6, candidates: 1000, ranked: 100, shown: 20, dim: 128, dau: 200e6, opens: 8 };
const recEmbGB = (REC.corpus * REC.dim * 4) / 1e9;                      // float32 item embeddings
const recQps = (REC.dau * REC.opens) / DAY;
const recRankPerSec = recQps * REC.candidates;
export const RANK_BUDGET: [stage: string, ms: number][] = [["Fetch user features", 10], ["Candidate generation (several sources)", 30], ["Ranking model", 60], ["Re-ranking and filters", 15], ["Network and serialization", 25]];
const recBudget = RANK_BUDGET.reduce((s, [, ms]) => s + ms, 0);

/* ---------- search: NDCG of one ranked result page ---------- */
const dcg = (rels: number[]) => rels.reduce((s, r, i) => s + (2 ** r - 1) / Math.log2(i + 2), 0);
export const ndcg = (rels: number[], k = rels.length) => {
  const top = rels.slice(0, k), ideal = [...rels].sort((a, b) => b - a).slice(0, k);
  return dcg(ideal) === 0 ? 0 : dcg(top) / dcg(ideal);
};
const RANKED = [3, 2, 3, 0, 1, 2];                                       // graded relevance of results 1..6, 3 = perfect
const IDEAL = [...RANKED].sort((a, b) => b - a);
const ndcgShown = ndcg(RANKED);
if (Math.abs(ndcg(IDEAL) - 1) > 1e-12 || !(ndcgShown > 0 && ndcgShown < 1)) throw new Error("design-ml: NDCG check failed");

/* ---------- ads: ranking by expected value, generalized second price ---------- */
export const ADS = [
  { ad: "Shoes", bid: 2.0, pctr: 0.03 },
  { ad: "Laptop", bid: 5.0, pctr: 0.01 },
  { ad: "Course", bid: 1.0, pctr: 0.04 },
];
const ecpm = (a: { bid: number; pctr: number }) => a.bid * a.pctr * 1000;          // expected revenue per 1,000 views
const adRank = [...ADS].sort((a, b) => ecpm(b) - ecpm(a));
/** GSP: the winner pays just enough per click to keep its rank: the runner-up's expected value divided by its own pCTR. */
const gspPrice = (i: number) => (i + 1 < adRank.length ? (adRank[i + 1].bid * adRank[i + 1].pctr) / adRank[i].pctr : 0);
if (adRank[0].ad !== "Shoes" || !(gspPrice(0) < adRank[0].bid)) throw new Error("design-ml: ad auction check failed");
const CAL = { predicted: 0.02, actualClicks: 150, views: 10_000 };
const calActual = CAL.actualClicks / CAL.views;

/* ---------- platform: population stability index of one feature ---------- */
export const psi = (expected: number[], actual: number[]) => expected.reduce((s, e, i) => s + (actual[i] - e) * Math.log(actual[i] / e), 0);
const PSI_TRAIN = [0.25, 0.25, 0.25, 0.25], PSI_LIVE = [0.1, 0.2, 0.3, 0.4];
const psiValue = psi(PSI_TRAIN, PSI_LIVE);
if (Math.abs(psi(PSI_TRAIN, PSI_TRAIN)) > 1e-12 || !(psiValue > 0)) throw new Error("design-ml: PSI check failed");
const FS = { entities: 200e6, features: 50, bytes: 8, replicas: 3 };
const fsGB = (FS.entities * FS.features * FS.bytes * FS.replicas) / 1e9;

/* ---------- LLM application: tokens and cost under stated prices ---------- */
const LLM = { perDay: 1e6, system: 400, chunks: 5, chunkTokens: 300, question: 100, output: 300, priceIn: 1, priceOut: 4, cacheHit: 0.3 };
const llmIn = LLM.system + LLM.chunks * LLM.chunkTokens + LLM.question;
const llmDayIn = LLM.perDay * llmIn, llmDayOut = LLM.perDay * LLM.output;
const llmCost = (llmDayIn * LLM.priceIn + llmDayOut * LLM.priceOut) / 1e6;
const llmCached = llmCost * (1 - LLM.cacheHit);
const llmQps = LLM.perDay / DAY;

export const MORE_ML: Chapter[] = [
  {
    id: "mlframe",
    title: "ML system design: how to run the round",
    summary: "An ML design round is a system design round where one box is a model. Interviewers want the whole loop: the business goal turned into something a model can predict, where labels come from, the features, a baseline, how it is served, how you would know it works, and what happens when the world changes.",
    points: [
      "**Frame the problem:** turn the business goal (more watch time, fewer fraud losses) into a prediction (will this user watch this video for 30 seconds?). Say what the model outputs and what the product does with it.",
      "**Pick the ML task:** classification, regression, ranking, or retrieval. Most feeds, search and ads are ranking problems built from per-item scores.",
      "**Metrics, offline and online:** offline metrics on held-out data (precision and recall, AUC, log loss, NDCG) decide which model to try; online metrics in an A/B test (click rate, watch time, revenue, complaints) decide whether to ship.",
      "**Data and labels:** say where labels come from. Explicit labels (ratings, human review) are clean but scarce; implicit labels (clicks, watch time) are plentiful but biased by what you already showed.",
      "**Features:** user, item, context (time, device) and cross features (has this user watched this creator before?). Mention freshness: some features are computed daily, some must be seconds old.",
      "**Model:** start with a simple baseline (popularity, logistic regression) so you have something to beat, then the real model. Justify complexity with the metric it buys.",
      `**Serving and scale:** ${n0(FR.dau)} daily users opening the app ${FR.opens} times a day is about ${n0(frQps)} requests per second; at a ${FR.peak}x peak with ${FR.scored} items scored per request that is ${n0(frScores)} model scores per second, which decides your latency budget and hardware.`,
      "**Monitoring:** inputs drift, behaviour changes, and the model goes stale. Log predictions, watch feature distributions and online metrics, and retrain on a schedule.",
    ],
    diagram: `flowchart TB
  G["Business goal"] --> P["Prediction task + metrics"]:::hot
  P --> D["Data and labels"]
  D --> F["Features"]
  F --> M["Baseline, then model"]
  M --> S["Serving: batch or online"]
  S --> E["A/B test"]
  E --> MO["Monitor, retrain"]
  MO -.->|"new data"| D`,
    caption: "The loop closes: what the model shows today becomes tomorrow's training data.",
    table: {
      head: ["Stage", "Question to answer out loud", "Typical answer"],
      rows: [
        ["Framing", "What exactly does the model predict?", "Probability a user engages with an item"],
        ["Metrics", "How do we judge it offline and online?", "AUC or NDCG offline; engagement in an A/B test"],
        ["Labels", "Where do labels come from, and how biased are they?", "Logged clicks and watch time, corrected for position"],
        ["Features", "Which signals, and how fresh?", "User history, item stats, context, crosses"],
        ["Model", "What is the baseline?", "Popularity or logistic regression first"],
        ["Serving", "Batch or online, and what latency?", "Online scoring under about 200 ms"],
        ["Monitoring", "How do we notice it got worse?", "Drift on inputs, online metrics, scheduled retrains"],
      ],
    },
    work: [
      "Most of the effort on the job goes into data: logging the right events, joining them correctly, and checking labels, not into model architecture.",
      "Teams keep a simple model in production as a fallback, so a failed deploy of the complex one degrades quality instead of breaking the feature.",
      "Every launch goes through an A/B test with guardrail metrics (latency, crashes, complaints) next to the main metric.",
    ],
    cards: [
      { id: "ml-vs-rules", q: "When would you not use ML at all?", a: "When a simple rule does the job, when there is no data or no clear label, when mistakes are very costly and must be explainable, or when the pattern never changes. Start with a heuristic baseline; bring in a model only when it measurably beats it.", trap: "Jumping straight to a deep model without a baseline gives you nothing to compare against." },
      { id: "offline-online", q: "Offline AUC went up but the A/B test shows no gain. Why might that be?", a: "- **Metric mismatch:** AUC measures ordering of all pairs, while users only see the top few results.\n- **Leakage:** a feature that is available in training data but not at serving time inflated the offline score.\n- **Training-serving skew:** features are computed differently online.\n- **Feedback effects:** the old model chose what was logged, so the new model was judged on data biased toward the old one's picks." },
      { id: "implicit-labels", q: "Clicks as labels: what goes wrong?", a: "Clicks reflect what you showed and where. Items in the top slot get clicked more regardless of quality (position bias), items never shown get no clicks at all (selection bias), and clickbait gets clicks without satisfaction. Use dwell time or completion as a stronger signal, and correct for position.", trap: "Treating an unclicked item as a true negative, when the user may never have seen it." },
      { id: "baseline", q: "Why start with a baseline?", a: "It gives a number to beat, a fallback for production, and a quick check that the data pipeline works end to end. If a deep model barely beats popularity, the extra cost and latency may not be worth it." },
      { id: "split", q: "How should you split training and test data for a recommender?", a: "By time, not at random: train on the past and test on a later period. A random split lets the model see the future (a user's later behaviour) and overstates how well it will do." },
      { id: "cold-start", q: "What is the cold start problem?", a: "A new user or item has no history, so collaborative signals are empty. Use content features (text, category, creator), popularity within a segment, onboarding questions, and a little exploration so new items get a chance to collect data." },
    ],
  },
  {
    id: "mlrecs",
    title: "Design a recommendation system",
    summary: "Recommend videos or products for a home feed. The corpus is far too large to score every item for every request, so the design is a funnel: cheap retrieval narrows millions of items to about a thousand, a heavier model ranks those, and a final pass adds business rules and variety.",
    points: [
      `**Funnel:** ${n0(REC.corpus)} items, then about ${n0(REC.candidates)} candidates from retrieval, then ${n0(REC.ranked)} scored carefully, then ${REC.shown} shown on screen.`,
      "**Candidate generation:** several sources in parallel: a two-tower model (user and item embeddings, nearest neighbours), items similar to recent watches, trending items, and subscriptions. Mixing sources keeps the feed from collapsing into one taste.",
      `**Embeddings:** with ${REC.dim}-dimension float vectors, the item table is about ${n1(recEmbGB)} GB, small enough to keep an approximate nearest neighbour index (HNSW or IVF) in memory on each retrieval server.`,
      "**Ranking:** a deep model scores each candidate using user, item, context and cross features. It is often multi-task: predicting click, watch time, like and share together, combined into one score with weights the product team chooses.",
      `**Throughput:** ${n0(REC.dau)} daily users opening the feed ${REC.opens} times a day is about ${n0(recQps)} requests per second, so the ranker scores about ${n0(recRankPerSec)} items per second on average.`,
      "**Re-ranking:** remove items already seen or blocked, enforce diversity (not ten videos from one creator), boost freshness, apply policy filters.",
      "**Cold start and exploration:** give new items a small share of impressions to learn their quality; use content features until behaviour data arrives.",
      "**Feedback loop:** the model trains on what it chose to show. Without exploration it keeps recommending what it already believes, and popular items get more popular.",
    ],
    diagram: `flowchart TB
  U["User opens feed"] --> CG["Candidate generation"]:::hot
  CG --> A["Two-tower ANN"]
  CG --> B["Similar, trending, follows"]
  A --> R["Ranking model: ~1,000 items"]
  B --> R
  R --> RR["Re-rank: dedupe, diversity, policy"]
  RR --> FEED["Top 20 on screen"]:::ok
  FEED -.->|"clicks, watch time"| LOG[("Event logs: training data")]`,
    caption: "Each stage is cheaper per item than the next, so the expensive model only sees a small slice.",
    table: { head: ["Stage", "Latency budget"], rows: [...RANK_BUDGET.map(([s, ms]) => [s, `${ms} ms`]), ["Total", `${recBudget} ms`]] },
    work: [
      "Item embeddings are recomputed in batch (often daily) and the ANN index is rebuilt and swapped in; user embeddings may be computed per request from recent activity.",
      "Ranking models are retrained frequently, some daily, because tastes and the catalogue shift quickly.",
      "Every change ships behind an A/B test that watches long-term signals (retention, satisfaction surveys), not only clicks.",
    ],
    cards: [
      { id: "two-tower", q: "How does a two-tower model retrieve candidates fast?", a: "One tower turns the user (history, context) into a vector; the other turns each item into a vector, trained so that a high dot product means a likely engagement. Item vectors are precomputed and put into an approximate nearest neighbour index, so retrieval is one user-tower pass plus a fast index lookup instead of scoring millions of items.", trap: "The towers cannot use user-item cross features, because the item side is computed without knowing the user. That is the ranker's job." },
      { id: "why-stages", q: "Why not run the best model on every item?", a: `Scoring ${n0(REC.corpus)} items per request with a heavy model would take seconds and enormous compute. Retrieval is cheap per item but rough; ranking is accurate but expensive. The funnel spends compute only where it changes the result.` },
      { id: "multi-task", q: "Why predict several outcomes instead of only clicks?", a: "Clicks alone reward clickbait. Predicting click, watch time, like, share and hide lets the final score reward what users value, and the weights become a product decision that can change without retraining every head." },
      { id: "negatives", q: "Where do negative examples come from?", a: "Shown but not engaged items are weak negatives (the user may have skipped them for many reasons). Random items from the corpus are easy negatives for retrieval. Hard negatives, items similar to positives that the user ignored, teach finer distinctions. Sample negatives so classes are balanced, and correct the predicted probabilities afterwards." },
      { id: "diversity", q: "How do you stop the feed showing ten near-identical items?", a: "Apply diversity in re-ranking: cap items per creator or topic, or pick greedily, penalising each candidate by its similarity to items already chosen (maximal marginal relevance). Diversity often lowers the click rate a little and raises long-term retention." },
      { id: "freshness", q: "A video was uploaded five minutes ago. How can it be recommended?", a: "It has no engagement yet, so retrieval must include a fresh-content source, and its embedding comes from content (title, thumbnail, creator) until behaviour data arrives. Give it a small exploration budget of impressions; the stream of early reactions updates its features within minutes." },
      { id: "position-bias", q: "How do you correct for position bias in training data?", a: "Log the position each item was shown at. Add position as a feature during training and set it to a fixed value at serving, or weight examples by the inverse of how likely that position is to be seen. Small randomised experiments measure how much each position is worth." },
    ],
  },
  {
    id: "mlsearch",
    title: "Design search ranking",
    summary: "A user types a query and expects the best results first. Search splits into understanding the query, retrieving everything that might match, and ranking the top few hundred with a learned model. Unlike a feed, the query states the intent, so relevance to it comes first.",
    points: [
      "**Query understanding:** normalise, fix spelling, expand synonyms, detect intent and category (\"iphone case\" is a product search, \"how to\" wants articles).",
      "**Retrieval:** combine an inverted index with BM25 (exact words matter for names and codes) and embedding search (meaning matters for paraphrases). Merge the two lists; this is hybrid search.",
      "**Learning to rank:** a model reorders the top few hundred. Pointwise models score each result alone, pairwise models learn which of two results is better, listwise models optimise the whole ordering directly.",
      "**Features:** text match (BM25 score, title match), item quality (ratings, popularity), personalisation (past purchases), and context (location, device).",
      "**Labels:** human relevance grades for a sample of queries, plus clicks and purchases at scale, corrected for position bias.",
      `**Metric, NDCG:** rewards putting the most relevant results at the top. For a page with grades ${RANKED.join(", ")} (3 is perfect), NDCG is ${n3(ndcgShown)}; sorting it perfectly as ${IDEAL.join(", ")} gives 1.000.`,
      "**Online metrics:** click-through rate on the top results, time to first click, queries reformulated or abandoned, and purchases or answers found.",
      "**Freshness and speed:** new documents must be indexed within seconds to minutes, and the whole query must finish in a few hundred milliseconds.",
    ],
    diagram: `flowchart TB
  Q["Query"] --> QU["Query understanding"]
  QU --> L["Lexical: BM25"]
  QU --> V["Vector: embeddings"]
  L --> M["Merge ~500 results"]
  V --> M
  M --> LTR["Learning-to-rank model"]:::hot
  LTR --> TOP["Top 10 shown"]:::ok`,
    caption: "Lexical search catches exact names; vector search catches meaning. The ranker decides between them.",
    table: { head: ["Position", "Grade", "Gain 2^g - 1", "Discount log2(pos + 1)", "Contribution"], rows: RANKED.map((g, i) => [String(i + 1), String(g), String(2 ** g - 1), n2(Math.log2(i + 2)), n2((2 ** g - 1) / Math.log2(i + 2))]) },
    work: [
      "Search teams keep a fixed set of queries with human grades and run every ranking change against it before any A/B test.",
      "Query logs drive most improvements: queries with no results, queries that users rewrite, and queries where nobody clicks.",
      "Indexing runs as a pipeline: documents change, a stream updates the index, and large rebuilds happen offline and swap in.",
    ],
    cards: [
      { id: "hybrid", q: "Why combine BM25 and embeddings instead of using only one?", a: "BM25 is precise for exact words: product codes, names, rare terms an embedding may blur. Embeddings understand meaning: \"cheap flights\" matches \"low-cost airfare\". Each misses what the other catches, so retrieve with both and let the ranker combine them.", trap: "Embeddings alone often fail on exact identifiers like model numbers." },
      { id: "ndcg", q: "Explain NDCG in one minute.", a: `Each result earns a gain from its relevance grade, discounted by its position, so a great result at position 1 counts far more than at position 6. Add them up (DCG), then divide by the DCG of the perfect ordering, so the score sits between 0 and 1. The example page above scores ${n3(ndcgShown)}.` },
      { id: "pairwise", q: "Pointwise, pairwise or listwise?", a: "- **Pointwise:** predict each result's relevance alone; simple, but ignores that only order matters.\n- **Pairwise:** learn which of two results should rank higher (for example LambdaMART); a common default.\n- **Listwise:** optimise a list metric such as NDCG directly; best in theory, harder to train." },
      { id: "click-labels", q: "Can you train directly on clicks?", a: "Carefully. The top result gets clicks partly because it is on top. Use clicks with position-bias correction, prefer stronger signals (a purchase, a long dwell), and interleave two rankers in one result list to compare them with less bias than a plain A/B test." },
      { id: "no-results", q: "A query returns nothing. What do you do?", a: "Relax it step by step: spelling correction, synonyms, dropping the least important word, falling back to vector search. Log every zero-result query; they are the clearest list of what to fix next." },
      { id: "latency", q: "How do you keep search fast with a heavy ranking model?", a: "Rank in stages: a cheap model over a few thousand retrieved results, the heavy model over the top hundred. Cache results for popular queries, precompute document features at index time, and shard the index so each shard searches in parallel." },
    ],
  },
  {
    id: "mlads",
    title: "Design ad click prediction",
    summary: "Ads are ranked by how much money they are expected to make, which needs a good probability that a user clicks. The click-through rate (CTR) model must be accurate and calibrated, because its output is multiplied by money in the auction.",
    points: [
      "**Expected value:** rank ads by bid times predicted CTR, usually shown per 1,000 views (eCPM). A high bid with a tiny CTR can lose to a modest bid that users actually click.",
      `**Example:** ${ADS.map((a) => `${a.ad} bids ${n2(a.bid)} with pCTR ${a.pctr}`).join("; ")}. eCPM order: ${adRank.map((a) => `${a.ad} ${n0(ecpm(a))}`).join(", ")}.`,
      `**Second price:** in a generalised second-price auction the winner pays just enough to keep its rank: ${adRank[0].ad} pays ${n2(gspPrice(0))} per click, not its full bid of ${n2(adRank[0].bid)}.`,
      `**Calibration:** if the model says ${CAL.predicted} on average but real clicks are ${CAL.actualClicks} in ${n0(CAL.views)} views (${n3(calActual)}), every price is off. Check predicted against actual per bucket and fix with a calibration layer.`,
      "**Model:** classic systems used logistic regression on hashed sparse features and their crosses; modern ones use deep models that learn crosses (wide and deep, DCN). Both see billions of examples.",
      "**Features:** user, ad, advertiser, placement, time, and real-time counters (this ad's clicks in the last hour).",
      "**Delayed labels:** a click arrives seconds after the view, a purchase days later. Wait a window before labelling a view as not clicked, or correct for late conversions.",
      "**Metrics:** log loss and calibration offline (AUC alone ignores calibration); revenue, CTR and advertiser return online, with guardrails on user experience.",
    ],
    diagram: `flowchart TB
  REQ["Page view: ad slot"] --> CAND["Eligible ads: targeting, budget"]
  CAND --> CTR["CTR model: pCTR"]:::hot
  CTR --> AUC["Auction: bid x pCTR"]
  AUC --> SHOW["Winner shown"]:::ok
  SHOW -.->|"view, click logs"| STREAM["Stream: counters, labels"]
  STREAM -.-> CTR`,
    caption: "Clicks flow back within minutes, updating real-time features and the next training run.",
    table: { head: ["Ad", "Bid per click", "pCTR", "eCPM", "Rank", "Pays per click"], rows: adRank.map((a, i) => [a.ad, n2(a.bid), String(a.pctr), n0(ecpm(a)), String(i + 1), i === 0 ? n2(gspPrice(0)) : "-"]) },
    work: [
      "CTR models are retrained or updated very often, some continuously from the click stream, because new ads and campaigns appear every hour.",
      "Calibration is monitored per advertiser and per placement; a miscalibrated segment means some advertisers overpay.",
      "Budget pacing spreads each advertiser's daily budget over the day instead of spending it all in the morning.",
    ],
    cards: [
      { id: "why-calibrated", q: "Why does calibration matter more for ads than for a feed?", a: "A feed only needs the order right. In ads the predicted probability is multiplied by a bid and sets a price, so a model that predicts 2% when the truth is 1% makes some ads win wrongly and charges the wrong amount. Calibration means a predicted 2% really clicks about 2% of the time.", trap: "Quoting AUC as the main metric; AUC is unchanged by miscalibration." },
      { id: "gsp", q: "Why second price instead of charging the bid?", a: "With first price, advertisers shade their bids and keep changing them to pay less, which makes bidding unstable. Paying just enough to beat the next ad lets advertisers bid closer to their true value." },
      { id: "hashing", q: "What is the hashing trick?", a: "Billions of possible feature values (user IDs crossed with ad IDs) cannot have one weight each in a fixed table. Hash each feature value into a fixed number of buckets and learn one weight per bucket. Collisions add a little noise but memory stays bounded and new values need no dictionary." },
      { id: "delayed", q: "A view has no click yet. Is it a negative example?", a: "Not immediately. Most clicks arrive within seconds, conversions over days. Wait a fixed window before labelling, or train with a model of the delay, otherwise the newest data looks worse than it is and the model learns to underpredict." },
      { id: "new-ad", q: "A brand new ad has no history. How do you predict its CTR?", a: "Back off to features that do have history: the advertiser, the category, the creative's text and image, the placement. Give new ads some exploration traffic so their own counters fill in quickly." },
      { id: "logloss", q: "Why log loss?", a: "It punishes confident wrong predictions heavily and rewards probabilities that match reality, which is what the auction needs. Track it next to calibration plots and normalised entropy so you can compare across days with different base click rates." },
    ],
  },
  {
    id: "mlplatform",
    title: "Design the ML platform: features, training and serving",
    summary: "Behind every model in production sits shared plumbing: pipelines that turn raw events into features, a feature store that serves the same features online and offline, scheduled training, a model registry, serving, and monitoring. Interviewers ask about it directly or as the follow-up to any ML design.",
    points: [
      "**Data pipeline:** events land in a stream (Kafka) and a data lake; batch jobs compute daily features, stream jobs compute real-time ones (clicks in the last 5 minutes).",
      `**Feature store:** an offline store (columnar files) for training and an online key-value store for serving. ${n0(FS.entities)} entities with ${FS.features} features of ${FS.bytes} bytes, kept ${FS.replicas} times, is about ${n0(fsGB)} GB online, so the online store is sharded and served from memory.`,
      "**Point-in-time correctness:** training rows must use feature values as they were at the moment of the event, never later values, or the model learns from the future.",
      "**Training-serving skew:** if training and serving compute a feature with different code, the model sees different inputs live. Define each feature once in the feature store and use it in both places.",
      "**Training:** scheduled pipelines pull data, train, evaluate against the current model on a fixed test set, and register the result with its data version, code version and metrics.",
      "**Serving:** batch scoring writes predictions to a table when inputs change slowly (daily recommendations by email); online scoring answers each request in milliseconds. GPUs batch many requests together; distillation and quantisation make models smaller and faster.",
      "**Rollout:** shadow mode (new model scores live traffic but its answers are not used), then a canary, then an A/B test, with instant rollback.",
      `**Monitoring drift:** compare live feature distributions with training ones. Population stability index for buckets ${PSI_TRAIN.join(", ")} in training against ${PSI_LIVE.join(", ")} live is ${n3(psiValue)}; a common rule of thumb treats under 0.1 as stable and over 0.25 as a real shift.`,
    ],
    diagram: `flowchart TB
  EV["Events"] --> ST["Stream jobs"]
  EV --> BA["Batch jobs"]
  ST --> FS["Feature store"]:::hot
  BA --> FS
  FS --> TR["Training pipeline"]
  FS --> SV["Online serving"]
  TR --> REG["Model registry"]
  REG --> SV
  SV --> MON["Monitoring: drift, metrics"]
  MON -.->|"trigger retrain"| TR`,
    caption: "One feature definition feeds both training and serving; that is what removes skew.",
    table: {
      head: ["Rollout step", "What it proves", "Risk to users"],
      rows: [
        ["Offline evaluation", "Better on the fixed test set", "None"],
        ["Shadow mode", "Runs on live traffic within latency, same inputs", "None: answers are discarded"],
        ["Canary", "No errors or latency spikes on real users", "Small share of traffic"],
        ["A/B test", "Moves the business metric", "Half of the test population"],
        ["Full rollout", "Holds at full scale", "Everyone, with rollback ready"],
      ],
    },
    work: [
      "Most production incidents in ML systems are data problems: a broken upstream table, a feature that silently became null, a unit change, not a bad model.",
      "Pipelines validate data before training (row counts, null rates, value ranges) and refuse to train on data that fails.",
      "Each model version is stored with the exact data snapshot and code commit used, so any result can be reproduced or rolled back.",
    ],
    cards: [
      { id: "skew", q: "What is training-serving skew and how do you prevent it?", a: "The model sees one thing in training and another in production: a feature computed differently, a missing default, a time zone bug. Prevent it with one feature definition shared by both paths (a feature store), by logging the features actually used at serving time and training on those logs, and by comparing distributions between the two.", trap: "Rewriting feature code for the online path \"for speed\" is the classic way skew starts." },
      { id: "point-in-time", q: "What does point-in-time correct mean?", a: "When building a training example for an event at 10:00, join only feature values known before 10:00. Joining today's value of \"total purchases\" leaks the future into the past, inflates offline metrics, and the model disappoints in production." },
      { id: "batch-online", q: "Batch or online inference?", a: "- **Batch:** precompute predictions on a schedule; cheap and simple, but stale and wasted on users who never come back.\n- **Online:** compute per request with fresh context; needed when the input is the request itself (search query, current session), but every millisecond and server counts.\n\nMany systems mix them: batch candidates, online ranking." },
      { id: "drift", q: "Data drift or concept drift?", a: "Data drift: the inputs change (new users from a new country, a new device). Concept drift: the relationship changes (what counts as fraud shifts as fraudsters adapt). Data drift shows up in feature monitoring; concept drift shows up as falling accuracy once labels arrive, which can be days later." },
      { id: "shadow", q: "Why run a new model in shadow mode first?", a: "It processes real traffic, so you see real latency, real inputs and real errors, but users still get the old model's answers. You can compare predictions between the two before any user is affected." },
      { id: "retrain", q: "How often should a model retrain?", a: "As often as its performance decays, measured, not guessed. Train on older data, test on each later week, and see how fast accuracy drops. Fast-moving domains (ads, news) retrain daily or continuously; stable ones monthly. Retrain on triggers too: drift alarms or a metric drop." },
    ],
  },
  {
    id: "mlllm",
    title: "Design an LLM application (a RAG assistant)",
    summary: "Build an assistant that answers questions from a company's own documents. The model is rented, so the design is everything around it: retrieval that finds the right passages, prompts, evaluation, guardrails, caching and cost. The Gen AI section goes deeper on each piece; this chapter is the interview shape.",
    points: [
      "**Requirements:** who asks what, how fresh the documents are, how wrong an answer may be, whether answers must cite sources, and latency and cost limits.",
      "**Ingestion:** split documents into chunks of a few hundred tokens with some overlap, embed each chunk, and store vectors with metadata (source, date, permissions) in a vector index.",
      "**Retrieval:** embed the question, find the nearest chunks, usually with hybrid search, then rerank the best few with a cross-encoder. Filter by the user's permissions before anything reaches the model.",
      `**Prompt and tokens:** a ${LLM.system}-token instruction, ${LLM.chunks} chunks of ${LLM.chunkTokens} tokens and a ${LLM.question}-token question is ${n0(llmIn)} input tokens per answer, plus about ${LLM.output} output tokens.`,
      `**Cost:** at ${n0(LLM.perDay)} questions a day (about ${n1(llmQps)} per second) and assumed prices of ${LLM.priceIn} per million input tokens and ${LLM.priceOut} per million output tokens, that is about ${n0(llmCost)} a day. A ${n0(LLM.cacheHit * 100)}% cache hit rate cuts it to about ${n0(llmCached)}.`,
      "**Evaluation:** a fixed set of questions with known good answers, scored for faithfulness to the retrieved text and for answering the question, by people and by an LLM judge checked against people.",
      "**Guardrails:** check inputs for prompt injection and off-topic requests, check outputs for unsupported claims and leaked private data, and refuse when retrieval finds nothing relevant.",
      "**Operations:** cache repeated questions, route easy questions to a smaller model, stream tokens to cut perceived latency, log prompts and answers for review, and keep a fallback when the provider is down.",
    ],
    diagram: `flowchart TB
  DOCS["Documents"] --> CH["Chunk + embed"]
  CH --> VI[("Vector index + metadata")]
  Q["User question"] --> GI["Input guardrails"]
  GI --> RET["Retrieve + rerank"]:::hot
  VI --> RET
  RET --> LLM["LLM: answer with citations"]
  LLM --> GO["Output guardrails"]
  GO --> A["Answer"]:::ok`,
    caption: "Most quality problems are retrieval problems: the model cannot cite a passage it was never given.",
    table: {
      head: ["Problem", "Likely cause", "Fix"],
      rows: [
        ["Confident wrong answer", "Right passage not retrieved", "Better chunking, hybrid search, reranking"],
        ["Answer ignores the passage", "Prompt or model choice", "Clearer instructions, require citations"],
        ["Leaks another team's document", "No permission filter", "Filter by user permissions at retrieval"],
        ["Slow first token", "Long prompt, big model", "Fewer chunks, smaller model, streaming"],
        ["Cost too high", "Every question hits the big model", "Cache, route easy questions to a small model"],
      ],
    },
    work: [
      "Teams build the evaluation set before tuning anything, then change one thing at a time (chunk size, retriever, prompt, model) and rerun it.",
      "Prompts are versioned and reviewed like code, because a one-word change can shift answers across thousands of questions.",
      "Production traces (question, retrieved chunks, prompt, answer, user feedback) are the main source of new test cases.",
    ],
    cards: [
      { id: "rag-vs-finetune", q: "RAG or fine-tuning for answering from company documents?", a: "RAG first. The documents change, answers need citations, and permissions differ per user, all of which retrieval handles and fine-tuning does not. Fine-tune when you need a style, format or narrow skill the base model lacks, often together with RAG.", trap: "Fine-tuning does not reliably teach a model new facts, and it cannot respect per-user permissions." },
      { id: "chunking", q: "How do you choose chunk size?", a: "Small chunks retrieve precisely but lose context; large chunks keep context but dilute the match and cost more tokens. Split on structure (headings, paragraphs) with a little overlap, measure retrieval recall on your evaluation set at a few sizes, and pick the best." },
      { id: "eval", q: "How do you evaluate an LLM app?", a: "Build a fixed set of real questions with reference answers and source passages. Measure retrieval (did the right passage come back?) separately from generation (was the answer faithful and helpful?). Use an LLM judge for scale, but check it against human grades first. Rerun the whole set on every change." },
      { id: "injection", q: "What is prompt injection and how do you defend against it?", a: "Text in a document or user message that tries to override your instructions (\"ignore previous instructions and...\"). Treat retrieved text as data, never as instructions; keep tools and permissions minimal; filter suspicious inputs; and validate outputs before taking any action with them." },
      { id: "semantic-cache", q: "What is a semantic cache?", a: "A cache keyed by the meaning of the question rather than its exact text: embed the new question, and if a cached one is close enough, return its answer. It saves cost on repeated questions, but the similarity threshold must be strict, and answers that depend on the user or on fresh data should not be cached." },
      { id: "latency-llm", q: "How do you make answers feel fast?", a: "Stream tokens so the first words appear quickly, retrieve and rerank in parallel where possible, send fewer and better chunks, use a smaller model for simple questions, and cache. Time to first token matters more to users than total time." },
    ],
  },
];
