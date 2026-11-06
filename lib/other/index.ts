// The subjects of the "Other" section. Each subject lives in its own file and is imported only by
// the page that shows it (server side), so no page ships every subject's text.
import type { Subject } from "./types";

export const SUBJECT_IDS = ["os", "dbms", "cn", "sql", "oops", "aptitude", "syntax", "react", "node", "design"] as const;
export type SubjectId = (typeof SUBJECT_IDS)[number];

export const loadSubject = async (id: SubjectId): Promise<Subject> => {
  switch (id) {
    case "os": return (await import("./os")).OS;
    case "dbms": return (await import("./dbms")).DBMS;
    case "cn": return (await import("./cn")).CN;
    case "sql": return (await import("./sql")).SQL;
    case "oops": return (await import("./oops")).OOPS;
    case "aptitude": return (await import("./aptitude")).APTITUDE;
    case "syntax": return (await import("./syntax")).SYNTAX;
    case "react": return (await import("./react")).REACT;
    case "node": return (await import("./node")).NODE;
    case "design": return (await import("./design")).DESIGN;
  }
};

/** Tick key for "chapter done", stored in the synced patterns store. */
export const chapterKey = (subject: string, chapter: string) => `other:${subject}:${chapter}`;
/** Tick key for "I can answer this interview question". */
export const cardKey = (subject: string, chapter: string, card: string) => `otherq:${subject}:${chapter}:${card}`;
/** The subject's chapters split into its parts (one untitled part when it has none). */
export const partsOf = <C extends { id: string }>(chapters: C[], parts?: [string, string][]) =>
  (parts?.length ? parts : [["", chapters[0]?.id ?? ""] as [string, string]]).map(([title, from], k, all) => {
    const start = chapters.findIndex((c) => c.id === from), next = all[k + 1] ? chapters.findIndex((c) => c.id === all[k + 1][1]) : chapters.length;
    return { title, chapters: chapters.slice(start, next) };
  });
