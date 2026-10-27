"use client";
// Theme Studio: pick a look; each card previews the same code in that theme.
import { motion } from "motion/react";
import { Check } from "@phosphor-icons/react";
import { LOOKS, type Look } from "@/lib/looks";
import { PALETTES, useStore, type Mode, type Palette } from "@/lib/store";

const MODES: [Mode, string][] = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]];

function Code() {
  const k = "text-accent", f = "text-easy", n = "text-medium", c = "text-muted italic";
  return (
    <pre className="font-mono text-[12.5px] leading-[1.7] text-ink">
      <span className={k}>def</span> <span className={f}>dfs</span>(node):{"\n"}
      {"    "}<span className={k}>if not</span> node:  <span className={c}># base case</span>{"\n"}
      {"        "}<span className={k}>return</span> <span className={n}>0</span>{"\n"}
      {"    "}<span className={k}>return</span> <span className={n}>1</span> + <span className={f}>dfs</span>(node.next)
    </pre>
  );
}

function Preview({ l }: { l: Look }) {
  if (!l.photo) return <div data-preview={l.id === "classic" ? undefined : l.id} className="relative px-4 py-3.5"><Code /></div>;
  return (
    <div data-preview={l.id} className="relative overflow-hidden px-4 py-3.5">
      <img src={`${l.photo.src}&w=640`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0" style={{ background: l.id === "pinksky" ? "color-mix(in oklab,var(--bg) 55%,transparent)" : "linear-gradient(90deg, color-mix(in oklab,var(--bg) 82%,transparent), color-mix(in oklab,var(--bg) 35%,transparent))" }} />
      <div className="relative"><Code /></div>
    </div>
  );
}

export function ThemeStudio() {
  const s = useStore();
  return (
    <section className="flex flex-col gap-3" aria-labelledby="studio">
      <div>
        <h3 id="studio" className="text-[15px] font-semibold">Theme Studio</h3>
        <p className="text-[13px] text-muted">Pick a look for the whole site. It applies instantly and is saved on this device.</p>
      </div>
      <ul className="flex flex-col gap-3">
        {LOOKS.map((l, i) => {
          const on = s.look === l.id;
          return (
            <motion.li key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.3 }}>
              <motion.button type="button" aria-pressed={on} onClick={() => s.setLook(l.id)} whileTap={{ scale: 0.985 }}
                className={`group w-full cursor-pointer overflow-hidden rounded-[16px] border text-left transition-colors ${on ? "border-accent ring-2 ring-accent-soft" : "border-line hover:border-line-strong"}`}>
                <Preview l={l} />
                <div className="flex items-center gap-3 border-t border-line bg-surface px-4 py-2.5">
                  <span className="text-[15px] font-semibold">{l.name}</span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-muted">{l.blurb}</span>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? "border-accent bg-accent text-accent-ink" : "border-line-strong"}`}>{on && <Check size={13} weight="bold" aria-hidden />}</span>
                </div>
              </motion.button>
              {on && l.id === "classic" && (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(PALETTES) as [Palette, readonly [string, string, string]][]).map(([k, [name, lc, dc]]) => (
                      <button key={k} type="button" aria-pressed={s.palette === k} onClick={() => s.setPalette(k)}
                        className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[10px] border border-line py-2.5 text-[12px] font-medium transition hover:bg-surface-2 aria-pressed:border-accent aria-pressed:ring-2 aria-pressed:ring-accent-soft">
                        <span className="size-5 rounded-full ring-1 ring-line" style={{ background: `linear-gradient(135deg, ${lc} 50%, ${dc} 50%)` }} aria-hidden />{name}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 rounded-[10px] bg-surface-2 p-1" role="group" aria-label="Light or dark">
                    {MODES.map(([k, label]) => (
                      <button key={k} type="button" aria-pressed={s.mode === k} onClick={() => s.setMode(k)}
                        className="h-8 cursor-pointer rounded-[8px] text-[13px] font-medium text-muted transition aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-card">{label}</button>
                    ))}
                  </div>
                </div>
              )}
              {on && l.photo && <p className="mt-1.5 px-1 text-[11px] text-muted">Photo by <a className="underline hover:text-accent" href={l.photo.page} target="_blank" rel="noopener">{l.photo.author}</a> on Unsplash</p>}
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
