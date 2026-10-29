// Data model for the "Other" section (CS core subjects). Text fields use a tiny markup rendered by
// components/other/Rich.tsx: blank-line paragraphs, "- " bullets, `code` and **bold**.
// Content is original, written from standard syllabi; the source PDFs only supplied the topic list.

export type Table = { head: string[]; rows: string[][] };

export type OtherLab = "paging" | "scheduling" | "banker" | "tcp" | "subnet" | "btree" | "sqlorder" | "normalize" | "vtable" | "aptitude";

/** Code in one or more languages. java + cpp show a Java / C++ switch. `sqlSetup` + `sql` are run by check:other,
 *  which also compares the last statement's rows with `result` (shown under the code). Java and C++ must compile and run. */
export type Code = { java?: string; cpp?: string; sql?: string; sqlSetup?: string; python?: string; text?: string; file?: string; result?: Table };

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
  cards: Card[];
};

export type Subject = { id: string; name: string; short: string; blurb: string; chapters: Chapter[] };
