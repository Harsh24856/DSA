// Data model for the "Other" section (CS core subjects). Text fields use a tiny markup rendered by
// components/other/Rich.tsx: blank-line paragraphs, "- " bullets, `code` and **bold**.
// Content is original, written from standard syllabi; the source PDFs only supplied the topic list.

export type Table = { head: string[]; rows: string[][] };

export type OtherLab = "paging" | "scheduling" | "banker" | "tcp" | "subnet" | "btree" | "sqlorder" | "normalize" | "vtable" | "aptitude" | "eventloop" | "hashring" | "ratelimit";

/** Code in one or more languages; two or more of cpp, java, python, js, ts show a language switch. check:other runs
 *  every one: SQL in SQLite (rows compared with `result`), Java and C++ compiled and run, Python and JavaScript run,
 *  TypeScript run with Node's type stripping, TSX type-checked, and Express apps started and stopped. */
export type Code = { cpp?: string; java?: string; python?: string; js?: string; ts?: string; tsx?: string; sql?: string; sqlSetup?: string; text?: string; file?: string; result?: Table };

export type Card = {
  id: string;
  q: string;           // the interview question
  a: string;           // the answer you would say out loud
  diagram?: string;    // mermaid source
  table?: Table;
  code?: Code;
  trap?: string;       // the mistake interviewers wait for
};

export type Chapter = {
  id: string;
  title: string;
  summary: string;
  points?: string[];
  diagram?: string;
  caption?: string;
  table?: Table;
  code?: Code;
  lab?: OtherLab;
  anim?: string;       // id of an animated walk-through in lib/other/flows.ts
  cards: Card[];
};

export type Subject = { id: string; name: string; short: string; blurb: string; chapters: Chapter[] };
