"use client";
// Theme Studio: pick a look; each card previews the same code in that theme.
import { motion } from "motion/react";
import { Check } from "@phosphor-icons/react";
import { GROUPS, LOOKS, type Look } from "@/lib/looks";
import { PALETTES, useStore, type Mode, type Palette } from "@/lib/store";
import { Seg } from "./ui";

const MODES: [Mode, string][] = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]];

function Code() {
  const k = "text-accent", f = "text-easy", n = "text-medium", c = "text-muted italic";
  return (
    <pre className="font-mono text-xs leading-[1.7] text-ink">
      <span className={k}>def</span> <span className={f}>dfs</span>(node):{"\n"}
      {"    "}<span className={k}>if not</span> node:  <span className={c}># base case</span>{"\n"}
      {"        "}<span className={k}>return</span> <span className={n}>0</span>{"\n"}
      {"    "}<span className={k}>return</span> <span className={n}>1</span> + <span className={f}>dfs</span>(node.next)
    </pre>
  );
}

function Preview({ l }: { l: Look }) {
  if (!l.photo) return <div data-preview={l.id === "classic" ? undefined : l.id} className="relative px-4 py-4"><Code /></div>;
  return (
    <div data-preview={l.id} className="relative overflow-hidden px-4 py-4">
      <img src={l.photo.small} alt="" loading="lazy" style={{ objectPosition: l.photo.pos ?? "50% 50%" }} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0" style={{ background: l.light
        ? "linear-gradient(90deg, color-mix(in oklab,var(--bg) 85%,transparent), color-mix(in oklab,var(--bg) 30%,transparent))"
        : "linear-gradient(90deg, color-mix(in oklab,var(--bg) 82%,transparent), color-mix(in oklab,var(--bg) 30%,transparent))" }} />
      <div className="relative"><Code /></div>
    </div>
  );
}

/** Clear themes: a small question row, because reading it is what the theme is for. */
function Sample({ id }: { id: string }) {
  return (
    <div data-preview={id} className="p-2">
      <div className="rounded-lg border border-line bg-surface p-3">
        <p className="truncate text-sm font-semibold text-ink">Two Sum</p>
        <p className="truncate text-xs text-muted">Hash map, one pass</p>
        <p className="mt-2 flex items-center gap-2 text-xs font-semibold"><span className="text-easy">Easy</span><span className="text-medium">Med</span><span className="text-hard">Hard</span><span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-accent-ink">Go</span></p>
      </div>
    </div>
  );
}

export function ThemeStudio() {
  const s = useStore();
  return (
    <section className="flex flex-col gap-3" aria-labelledby="studio">
      <div>
        <h3 id="studio" className="t-h3">Theme Studio</h3>
        <p className="text-sm text-muted">Pick a look for the whole site. It applies instantly and is saved on this device.</p>
      </div>
      {GROUPS.map((g) => (
      <div key={g} className="flex flex-col gap-2">
      <h4 className="t-eyebrow mt-1">{g}</h4>
      {g === "Clear" && <p className="text-xs text-muted">Solid colours with strong contrast. The easiest to read.</p>}
      <ul className={g === "Clear" ? "grid grid-cols-2 gap-2" : "flex flex-col gap-3"}>
        {LOOKS.filter((l) => l.group === g).map((l, i) => {
          const on = s.look === l.id;
          return (
            <motion.li key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.3 }}>
              <motion.button type="button" aria-pressed={on} onClick={() => s.setLook(l.id)} whileTap={{ scale: 0.985 }}
                className={`group w-full cursor-pointer overflow-hidden rounded-tile border text-left transition-colors ${on ? "border-accent ring-2 ring-accent-soft" : "border-line hover:border-line-strong"}`}>
                {g === "Clear" ? <Sample id={l.id} /> : <Preview l={l} />}
                <div className={`flex items-center gap-3 border-t border-line bg-surface ${g === "Clear" ? "px-3 py-2" : "px-4 py-3"}`}>
                  <span className={`min-w-0 text-sm font-semibold ${g === "Clear" ? "flex-1 truncate" : ""}`} title={l.name}>{l.name}</span>
                  {g !== "Clear" && <span className="min-w-0 flex-1 truncate text-xs text-muted">{l.blurb}</span>}
                  <span className="tick pointer-events-none" data-on={on || undefined}>{on && <Check size={14} weight="bold" aria-hidden />}</span>
                </div>
              </motion.button>
              {on && l.id === "classic" && (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(PALETTES) as [Palette, readonly [string, string, string]][]).map(([k, [name, lc, dc]]) => (
                      <button key={k} type="button" aria-pressed={s.palette === k} onClick={() => s.setPalette(k)}
                        className="flex cursor-pointer flex-col items-center gap-2 rounded-control border border-line py-3 text-xs font-medium transition hover:bg-surface-2 active:scale-[0.97] aria-pressed:border-accent aria-pressed:ring-2 aria-pressed:ring-accent-soft">
                        <span className="size-5 rounded-full ring-1 ring-line" style={{ background: `linear-gradient(135deg, ${lc} 50%, ${dc} 50%)` }} aria-hidden />{name}
                      </button>
                    ))}
                  </div>
                  <Seg<Mode> label="Light or dark" className="flex" value={s.mode} onChange={s.setMode} options={MODES} />
                </div>
              )}
              {on && l.photo?.credit && <p className="mt-2 px-1 text-xs text-muted">Photo by <a className="underline hover:text-accent" href={l.photo.credit.page} target="_blank" rel="noopener">{l.photo.credit.author}</a> on Unsplash</p>}
            </motion.li>
          );
        })}
      </ul>
      </div>
      ))}
    </section>
  );
}
