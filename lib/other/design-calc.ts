// Small calculations shared by System Design chapters and their interactive walk-throughs (flows-play-design.ts).
// Kept apart from the chapter files so the walk-throughs, which load in the browser, do not pull in chapter text.

/** Geohash cell size at the equator, in km, for a code of `len` characters. */
export const geohashCell = (len: number) => {
  const bits = 5 * len, lonBits = Math.ceil(bits / 2), latBits = Math.floor(bits / 2);
  return { w: (360 / 2 ** lonBits) * 111.32, h: (180 / 2 ** latBits) * 110.57 };   // km per degree at the equator
};
/** The longest geohash whose cell is at least as big as the radius, so the cell and its 8 neighbours cover the circle. */
export const geohashFor = (radiusKm: number) => { for (let len = 9; len >= 1; len--) { const c = geohashCell(len); if (Math.min(c.w, c.h) >= radiusKm) return len; } return 1; };

/** Latency budget of a recommendation request, stage by stage. */
export const RANK_BUDGET: [stage: string, ms: number][] = [["Fetch user features", 10], ["Candidate generation (several sources)", 30], ["Ranking model", 60], ["Re-ranking and filters", 15], ["Network and serialization", 25]];

const dcg = (rels: number[]) => rels.reduce((s, r, i) => s + (2 ** r - 1) / Math.log2(i + 2), 0);
/** NDCG@k of graded relevances in ranked order. */
export const ndcg = (rels: number[], k = rels.length) => {
  const top = rels.slice(0, k), ideal = [...rels].sort((a, b) => b - a).slice(0, k);
  return dcg(ideal) === 0 ? 0 : dcg(top) / dcg(ideal);
};

/* ---------- step-by-step chapters (design-steps-*.ts) ---------- */
/** A whole number with thousands separators. */
export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
/** Average per second for a daily total. */
export const perSec = (perDay: number) => perDay / 86_400;
/** The seven steps of every "Design X" chapter, the order a design round follows. */
export const DESIGN_FRAME = ["Requirements", "Estimates", "API", "Data model", "High-level design", "Deep dives", "Trade-offs and wrap-up"] as const;
/** The seven steps of a building-block chapter. */
export const BLOCK_FRAME = ["The problem", "The core idea", "How it works", "The options", "Numbers to know", "What breaks", "Say it in the interview"] as const;
/** The seven steps of an ML design chapter. */
export const ML_FRAME = ["Frame the problem", "Data and labels", "Features", "Model", "Evaluation", "Serving", "Monitoring and iteration"] as const;
/** Pairs a frame's titles with one text each; throws if the counts differ. */
export const framed = (titles: readonly string[], texts: string[]) => {
  if (titles.length !== texts.length) throw new Error(`steps: ${texts.length} texts for ${titles.length} titles`);
  return titles.map((title, i) => ({ title, text: texts[i] }));
};
