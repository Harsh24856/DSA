import { SUBJECT_IDS, loadSubject } from "@/lib/other";
import { OtherHub, type SubjectSummary } from "@/components/other/OtherHub";

// Server side: read every subject once at build time and send the hub only the titles and counts.
export default async function OtherPage() {
  const subjects: SubjectSummary[] = await Promise.all(SUBJECT_IDS.map(async (id) => {
    const s = await loadSubject(id);
    return { id, name: s.name, short: s.short, blurb: s.blurb, chapters: s.chapters.map((c) => c.id), cards: s.chapters.reduce((n, c) => n + c.cards.length, 0), labs: s.chapters.filter((c) => c.lab).length };
  }));
  return <OtherHub subjects={subjects} />;
}
