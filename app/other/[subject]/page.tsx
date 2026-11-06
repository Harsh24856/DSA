import { notFound } from "next/navigation";
import { SUBJECT_IDS, loadSubject, subjectMeta, type SubjectId } from "@/lib/other";
import { SubjectHub } from "@/components/other/OtherView";

export const dynamicParams = false;
export function generateStaticParams() { return SUBJECT_IDS.map((subject) => ({ subject })); }

// The subject page lists its chapters; each chapter has its own page at /other/<subject>/<chapter>.
export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  if (!(SUBJECT_IDS as readonly string[]).includes(subject)) notFound();
  return <SubjectHub subject={subjectMeta(await loadSubject(subject as SubjectId))} />;
}
