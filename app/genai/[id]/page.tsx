import { notFound } from "next/navigation";
import { MODULES, STAGES } from "@/lib/genai2";
import { EXTRA } from "@/lib/genai2/extras";
import { LABS } from "@/lib/genai2/labs";
import { ModuleView } from "@/components/genai2/ModuleView";
import { ExtraView } from "@/components/genai2/ExtraView";

export const dynamicParams = false;
export function generateStaticParams() { return [...Object.keys(MODULES), ...Object.keys(EXTRA)].map((id) => ({ id })); }

export default async function GenaiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = MODULES[id];
  if (m) {
    const built = STAGES.flatMap((s) => s.modules).filter((e) => e.built), i = built.findIndex((e) => e.id === id);
    const nav = (e?: { id: string; title: string }) => (e ? { id: e.id, title: e.title } : null);
    const lab = m.lab ? LABS[m.lab] : undefined;
    return <ModuleView module={m} prev={nav(built[i - 1])} next={nav(built[i + 1])} lab={lab ? { id: lab.id, title: lab.title, steps: lab.steps.length } : null} />;
  }
  const page = EXTRA[id];
  if (!page) notFound();
  return <ExtraView page={page} />;
}
