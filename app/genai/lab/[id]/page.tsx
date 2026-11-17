import { notFound } from "next/navigation";
import { LABS } from "@/lib/genai2/labs";
import { LabView } from "@/components/genai2/lab/LabView";

export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(LABS).map((id) => ({ id })); }

export default async function LabPage({ params }: { params: Promise<{ id: string }> }) {
  const lab = LABS[(await params).id];
  if (!lab) notFound();
  return <LabView lab={lab} />;
}
