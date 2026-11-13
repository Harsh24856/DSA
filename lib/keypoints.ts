// "Points, then paragraph": the key point of a paragraph is its opening sentence, so the summary can never drift from
// the text it summarises. A sentence ends at . ! or ? followed by a space and a capital, a digit or a code mark, but not
// after an abbreviation such as "e.g." or "vs.", and never inside a number like 1.5 or O(n log n).
const ABBR = /(?:\b(?:e\.g|i\.e|vs|etc|approx|cf|Mr|Dr|St|No)|\b[A-Za-z])\.$/;

export function firstSentence(p: string): string {
  const re = /[.!?](?=\s+(?:[A-Z0-9`"'(\[]|$))|[.!?]$/g;
  for (let m = re.exec(p); m; m = re.exec(p)) {
    const head = p.slice(0, m.index + 1);
    if (!ABBR.test(head)) return head.trim();
  }
  return p.trim();
}

/**
 * The key point of a paragraph: its first sentence. A heading-like opener ("Variants.") takes the next sentence too,
 * and a very long one (a vocabulary list) is cut at a word boundary, outside any `code` span.
 */
export function keyPoint(p: string, max = 180): string {
  let s = firstSentence(p);
  if (s.length < 32 && s.length < p.trim().length) s = `${s} ${firstSentence(p.trim().slice(s.length).trim())}`;
  if (s.length <= max) return s;
  let cut = s.lastIndexOf(" ", max);
  while (cut > 0 && (s.slice(0, cut).split("`").length % 2 === 0 || s.slice(0, cut).split("**").length % 2 === 0)) cut = s.lastIndexOf(" ", cut - 1);
  return `${s.slice(0, cut > 0 ? cut : max).replace(/[,;:]$/, "")} ...`;
}

/** The key points of a block of paragraphs: one per paragraph. */
export const keyPoints = (paras: string[]) => paras.map((p) => keyPoint(p));
