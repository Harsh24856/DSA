import { SUBJECT_IDS, cardKey, loadSubject } from "@/lib/other";
import { OtherHub, type SubjectSummary } from "@/components/other/OtherHub";
import { OA } from "@/lib/other/oa/index.ts";

// Server side: read every subject once at build time and send the hub only the titles and counts.
export default async function OtherPage() {
  const subjects: SubjectSummary[] = await Promise.all(SUBJECT_IDS.map(async (id) => {
    const s = await loadSubject(id);
    return { id, name: s.name, short: s.short, blurb: s.blurb, chapters: s.chapters.map((c) => c.id), cards: s.chapters.flatMap((c) => c.cards.map((x) => cardKey(id, c.id, x.id))), labs: s.chapters.filter((c) => c.lab).length };
  }));
  return <OtherHub subjects={subjects} oaCount={OA.reduce((n, s) => n + s.questions.length, 0)} />;
}
