import { notFound } from "next/navigation";
import { GENAI } from "@/lib/genai/content";
import { GenaiView } from "@/components/GenaiView";

export const dynamicParams = false;
export function generateStaticParams() { return GENAI.map((s) => ({ id: s.id })); }

export default async function GenaiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!GENAI.some((s) => s.id === id)) notFound();
  return <GenaiView id={id} />;
}
