import { notFound } from "next/navigation";
import { SUBJECT_IDS, loadSubject, type SubjectId } from "@/lib/other";
import { OtherView } from "@/components/other/OtherView";

export const dynamicParams = false;
export function generateStaticParams() { return SUBJECT_IDS.map((subject) => ({ subject })); }

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  if (!(SUBJECT_IDS as readonly string[]).includes(subject)) notFound();
  return <OtherView subject={await loadSubject(subject as SubjectId)} />;
}
