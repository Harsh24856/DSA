// Active-practice helpers: pattern questions, next-step guesses, line-order puzzles and mock tests. Pure; pass `rng` to make them repeatable.
// No imports: the Visualizer, and so the landing page, loads this file.
type Rng = () => number;
export const shuffle = <T,>(xs: readonly T[], rng: Rng = Math.random) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const norm = (s: string) => s.trim().toLowerCase();

/** Pattern as the quiz sees it. */
export type QuizPattern = { key: string; name: string; topic: string; signals: string[] };
export type DrillQ = { slug?: string; prompt: string; kind: "title" | "signal"; answer: QuizPattern; options: string[] };

/**
 * The right name plus up to `n - 1` wrong ones. Same-topic names come first because they are the hard choice.
 * `avoid` holds names that would also be right, such as another pattern listing the same problem.
 */
export function patternOptions(answer: QuizPattern, all: QuizPattern[], avoid: Iterable<string> = [], n = 4, rng: Rng = Math.random) {
  const skip = new Set([norm(answer.name), ...[...avoid].map(norm)]), names: string[] = [];
  const take = (p: QuizPattern) => { if (!skip.has(norm(p.name))) { skip.add(norm(p.name)); names.push(p.name); } };
  shuffle(all.filter((p) => p.topic === answer.topic), rng).slice(0, 1).forEach(take);
  shuffle(all, rng).forEach((p) => { if (names.length < n - 1) take(p); });
  return shuffle([answer.name, ...names.slice(0, n - 1)], rng);
}

/** One mixed drill round: missed problems first, at most two questions per topic, and every fourth question asks from a signal instead of a title. */
export function drillRound(pool: { slug: string; title: string; key: string; also: string[] }[], all: QuizPattern[], missed: Set<string>, n = 10, rng: Rng = Math.random): DrillQ[] {
  const byKey = new Map(all.map((p) => [p.key, p]));
  const out: DrillQ[] = [], perTopic = new Map<string, number>();
  const room = (p: QuizPattern) => (perTopic.get(p.topic) || 0) < 2;
  const add = (q: Omit<DrillQ, "options">, avoid: string[]) => { out.push({ ...q, options: patternOptions(q.answer, all, avoid, 4, rng) }); perTopic.set(q.answer.topic, (perTopic.get(q.answer.topic) || 0) + 1); };
  const signals = shuffle(all.filter((p) => p.signals.length), rng);
  const rows = [...shuffle(pool.filter((x) => missed.has(x.slug)), rng), ...shuffle(pool.filter((x) => !missed.has(x.slug)), rng)];
  const nextSignal = () => {
    const i = signals.findIndex(room);
    if (i < 0) return false;
    const [p] = signals.splice(i, 1);
    add({ kind: "signal", prompt: p.signals[Math.floor(rng() * p.signals.length)], answer: p }, []);
    return true;
  };
  for (const row of rows) {
    if (out.length >= n) break;
    if (out.length % 4 === 3 && nextSignal() && out.length >= n) break;
    const p = byKey.get(row.key);
    if (!p || !room(p)) continue;
    const avoid = row.also.flatMap((k) => byKey.get(k)?.name ?? []);
    add({ kind: "title", slug: row.slug, prompt: row.title, answer: p }, avoid);
  }
  return shuffle(out, rng);
}

/**
 * Three choices for the next step: the real next note and two others from the same run, unseen ones first,
 * so they cannot be ruled out just because they already played. Null when the run has too few different notes.
 */
export function nextStepOptions(notes: string[], step: number, rng: Rng = Math.random) {
  const answer = notes[step + 1];
  if (answer === undefined) return null;
  const pick = (from: string[]) => shuffle([...new Set(from)].filter((x) => x !== answer && x !== notes[step]), rng);
  const others = [...new Set([...pick(notes.slice(step + 2)), ...pick(notes.slice(0, step))])].slice(0, 2);
  return others.length < 2 ? null : { answer, options: shuffle([answer, ...others], rng) };
}

/** The code's real lines in order, without blanks and full-line comments. */
export const puzzleLines = (code: string) => code.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim() && !/^\s*(#|--)/.test(l));
export const PUZZLE_MAX = 24;
/** Worth doing only at a size that fits a phone. */
export const hasPuzzle = (code: string) => { const n = puzzleLines(code).length; return n >= 4 && n <= PUZZLE_MAX; };
/** Lines compare by text, so two identical lines can go either way round. */
export const puzzleSolved = (code: string, placed: string[]) => { const want = puzzleLines(code); return want.length === placed.length && want.every((l, k) => l === placed[k]); };
/** How many lines from the top are right. */
export const puzzleRight = (code: string, placed: string[]) => { const want = puzzleLines(code); let k = 0; while (k < placed.length && placed[k] === want[k]) k++; return k; };
/** Shuffled tiles, never already in order. */
export const puzzleTiles = (code: string, rng: Rng = Math.random) => {
  const lines = puzzleLines(code);
  for (let k = 0; k < 8; k++) { const t = shuffle(lines, rng); if (!puzzleSolved(code, t)) return t; }
  return [...lines].reverse();
};

/** An OA round: misses first, shuffled, with subjects kept even so a mixed test covers them all. */
export function oaRound<T extends { key: string; subject: string }>(pool: T[], missed: Set<string>, n: number, rng: Rng = Math.random) {
  const cap = Math.ceil(n / new Set(pool.map((q) => q.subject)).size), used = new Map<string, number>(), out: T[] = [];
  for (const q of [...shuffle(pool.filter((x) => missed.has(x.key)), rng), ...shuffle(pool.filter((x) => !missed.has(x.key)), rng)]) {
    if (out.length >= n || (used.get(q.subject) || 0) >= cap) continue;
    out.push(q); used.set(q.subject, (used.get(q.subject) || 0) + 1);
  }
  return shuffle(out, rng);
}

export const MOCK_MINUTES = 90;
export const mockLeft = (start: number, now: number, minutes = MOCK_MINUTES) => Math.max(0, start + minutes * 60000 - now);
export const clock = (ms: number) => { const t = Math.ceil(ms / 1000), m = Math.floor(t / 60); return `${m}:${String(t % 60).padStart(2, "0")}`; };
