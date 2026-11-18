// Pure helpers that turn existing content into revision items. No imports, so check:other can test them under Node.
export type RevItem = { q: string; a: string; trap?: string };

/** The first paragraph of an answer, cut at a sentence end if it is long: what you would say in the first ten seconds. */
export function short(text: string, max = 320) {
  const p = text.trim().split(/\n\s*\n/)[0].trim();
  if (p.length <= max) return p;
  const cut = p.slice(0, max), end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"));
  return end > 80 ? cut.slice(0, end + 1) : `${cut.trimEnd()}...`;
}

