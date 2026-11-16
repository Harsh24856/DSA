import { notFound } from "next/navigation";
import { GENAI } from "@/lib/genai/content";
import { MODULES } from "@/lib/genai2";
import { GenaiView } from "@/components/GenaiView";
import { ModuleView } from "@/components/genai2/ModuleView";

export const dynamicParams = false;
export function generateStaticParams() { return [...GENAI.map((s) => s.id), ...Object.keys(MODULES)].map((id) => ({ id })); }

export default async function GenaiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (MODULES[id]) return <ModuleView id={id} />;
  if (!GENAI.some((s) => s.id === id)) notFound();
  return <GenaiView id={id} />;
}
