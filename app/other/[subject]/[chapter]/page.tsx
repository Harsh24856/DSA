import { notFound } from "next/navigation";
import { SUBJECT_IDS, loadSubject, subjectMeta, type SubjectId } from "@/lib/other";
import { ChapterPage } from "@/components/other/OtherView";

export const dynamicParams = false;
export async function generateStaticParams() {
  return (await Promise.all(SUBJECT_IDS.map(async (subject) => (await loadSubject(subject)).chapters.map((c) => ({ subject, chapter: c.id }))))).flat();
}

// One chapter per page; only this subject's data is read, and only this chapter's text is sent to the client.
export default async function Page({ params }: { params: Promise<{ subject: string; chapter: string }> }) {
  const { subject, chapter } = await params;
  if (!(SUBJECT_IDS as readonly string[]).includes(subject)) notFound();
  const s = await loadSubject(subject as SubjectId), ch = s.chapters.find((c) => c.id === chapter);
  if (!ch) notFound();
  return <ChapterPage subject={subjectMeta(s)} chapter={ch} />;
}
