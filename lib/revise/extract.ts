// Pure helpers that turn existing content into revision items. No imports, so check:other can test them under Node.
export type RevItem = { q: string; a: string; trap?: string };

/** The first paragraph of an answer, cut at a sentence end if it is long: what you would say in the first ten seconds. */
export function short(text: string, max = 320) {
  const p = text.trim().split(/\n\s*\n/)[0].trim();
  if (p.length <= max) return p;
  const cut = p.slice(0, max), end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"));
  return end > 80 ? cut.slice(0, end + 1) : `${cut.trimEnd()}...`;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };
/** HTML to the tiny markup Rich renders: code spans and bold survive, every other tag goes. */
export const htmlText = (html: string) =>
  html.replace(/<code>([\s\S]*?)<\/code>/g, "`$1`").replace(/<(b|strong)>([\s\S]*?)<\/\1>/g, "**$2**").replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e: string) => ENTITIES[e]).replace(/\s+/g, " ").trim();

/** Every question and answer in a Gen AI section (its <details> blocks), answer cut to its first paragraph. */
export function htmlQuestions(html: string): RevItem[] {
  return [...html.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<div class="gx-ans">([\s\S]*?)<\/div>\s*<\/details>/g)].map(([, q, a]) => {
    const first = /<p>([\s\S]*?)<\/p>/.exec(a)?.[1] ?? a;
    return { q: htmlText(q), a: short(htmlText(first)) };
  });
}
