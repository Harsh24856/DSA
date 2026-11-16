import Link from "next/link";
import { BookOpen, ChatsCircle, Compass, ListBullets, TreeStructure } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { GENAI } from "@/lib/genai/content";
import { RoadmapHub } from "@/components/genai2/RoadmapHub";
import { LABS } from "@/lib/genai2/labs";

const REFS: [string, Icon, string][] = [["start", Compass, "Roadmap, setup, and what matters vs hype"], ["interview", ChatsCircle, "40 questions with short answers"], ["design", TreeStructure, "Eight-step framework for design rounds"], ["glossary", ListBullets, "Terms you will hear every day"], ["resources", BookOpen, "Where to go deeper, by module"]];

export default function GenAI() {
  return (
    <div className="flex flex-col gap-6">
      <RoadmapHub genaiModules={GENAI.filter((s) => s.module).map((s) => s.id)} labs={Object.values(LABS).map((l) => ({ id: l.id, title: l.title, blurb: l.blurb, steps: l.steps.length }))} />
      <section aria-labelledby="gx-ref" className="flex flex-col gap-3">
        <h2 id="gx-ref" className="t-h3">Start, prepare and look things up</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {REFS.map(([id, I, blurb]) => {
            const s = GENAI.find((x) => x.id === id)!;
            return (
              <Link key={id} href={`/genai/${id}`} className="card flex items-start gap-3 p-4 transition hover:border-line-strong hover:bg-surface-2 active:scale-[0.99]">
                <span className="badge-icon"><I size={16} aria-hidden /></span>
                <span className="min-w-0"><span className="block text-sm font-semibold">{s.nav}</span><span className="block text-xs text-muted">{blurb}</span></span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
