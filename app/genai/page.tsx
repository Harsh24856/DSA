import Link from "next/link";
import { BookOpen, ChatsCircle, ListBullets, RocketLaunch, TreeStructure } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { RoadmapHub } from "@/components/genai2/RoadmapHub";
import { LABS } from "@/lib/genai2/labs";

const REFS: [string, Icon, string, string][] = [["interview", ChatsCircle, "Interview prep", "Top questions with short answers"], ["design", TreeStructure, "System design", "Eight-step framework for design rounds"], ["capstone", RocketLaunch, "Capstone", "One portfolio project that uses it all"], ["glossary", ListBullets, "Glossary", "Terms you will hear every day"], ["resources", BookOpen, "Resources", "Where to go deeper, by stage"]];

export default function GenAI() {
  return (
    <div className="flex flex-col gap-6">
      <RoadmapHub labs={Object.values(LABS).map((l) => ({ id: l.id, title: l.title, blurb: l.blurb, steps: l.steps.length }))}>
        <nav aria-labelledby="gx-ref" className="flex flex-col gap-3">
          <h2 id="gx-ref" className="t-h3">Prepare and look things up</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {REFS.map(([id, I, nav, blurb]) => (
              <Link key={id} href={`/genai/${id}`} className="card flex items-start gap-3 p-4 transition hover:border-line-strong hover:bg-surface-2 active:scale-[0.99]">
                <span className="badge-icon"><I size={16} aria-hidden /></span>
                <span className="min-w-0"><span className="block text-sm font-semibold">{nav}</span><span className="hidden text-xs text-muted sm:block">{blurb}</span></span>
              </Link>
            ))}
          </div>
        </nav>
      </RoadmapHub>
    </div>
  );
}
