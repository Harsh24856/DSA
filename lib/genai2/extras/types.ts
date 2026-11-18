import type { Block, GQuestion } from "../types.ts";

export type ExtraLink = { title: string; url: string; note: string };
export type ExtraSection = { tag: string; title: string; blocks: Block[]; questions?: GQuestion[]; links?: ExtraLink[] };
/** A Gen AI reference page outside the stages (interview prep, system design, capstone, glossary, resources). */
export type ExtraPage = { id: string; title: string; eyebrow: string; lede: string; sections: ExtraSection[] };
