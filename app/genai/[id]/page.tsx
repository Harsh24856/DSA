import { notFound } from "next/navigation";
import { GENAI } from "@/lib/genai/content";
import { MODULES, STAGES } from "@/lib/genai2";
import { GenaiView } from "@/components/GenaiView";
import { ModuleView } from "@/components/genai2/ModuleView";

export const dynamicParams = false;
export function generateStaticParams() { return [...GENAI.map((s) => s.id), ...Object.keys(MODULES)].map((id) => ({ id })); }

export default async function GenaiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = MODULES[id];
  if (m) {
    const built = STAGES.flatMap((s) => s.modules).filter((e) => e.built), i = built.findIndex((e) => e.id === id);
    const nav = (e?: { id: string; title: string }) => (e ? { id: e.id, title: e.title } : null);
    return <ModuleView module={m} prev={nav(built[i - 1])} next={nav(built[i + 1])} />;
  }
  if (!GENAI.some((s) => s.id === id)) notFound();
  return <GenaiView id={id} />;
}
