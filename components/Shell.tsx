"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChartLineUp, CloudCheck, CloudSlash, CodeBlock, GearSix, ListChecks, MapTrifold, SunHorizon, TreeStructure, type Icon } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { diffDays, parse } from "@/lib/logic";
import { Settings } from "./Settings";

const NAV: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Today", icon: SunHorizon },
  { href: "/analytics", label: "Analytics", icon: ChartLineUp },
  { href: "/patterns", label: "Patterns", icon: TreeStructure },
  { href: "/problems", label: "Problems", icon: ListChecks },
  { href: "/roadmap", label: "Roadmap", icon: MapTrifold },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { now, status, synced, connected, toast, ready, email, state } = useStore();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const start = parse(state.quota.start), placement = parse(state.quota.placement);
  const left = Math.max(0, diffDays(placement, now));
  const used = Math.min(1, Math.max(0, diffDays(now, start) / Math.max(1, diffDays(placement, start))));
  const page = NAV.find((n) => n.href === path) ?? NAV.find((n) => n.href !== "/" && path.startsWith(n.href)) ?? NAV[0];
  const isOn = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  if (path.startsWith("/login") || path.startsWith("/auth")) return <>{children}</>;

  return (
    <div className="mx-auto grid min-h-[100dvh] max-w-[1400px] lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-[100dvh] flex-col gap-6 border-r border-line px-4 py-6 lg:flex" aria-label="Main">
        <div className="flex items-center gap-2.5 px-2 font-display text-[17px] font-semibold">
          <span className="grid size-8 place-items-center rounded-[10px] bg-accent text-accent-ink"><CodeBlock size={18} weight="bold" aria-hidden /></span>
          DSA Daily
        </div>
        <nav className="flex flex-col gap-1" aria-label="Sections">
          {NAV.map(({ href, label, icon: I }) => {
            const on = isOn(href);
            return (
              <Link key={href} href={href} aria-current={on ? "page" : undefined}
                className={`relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] font-medium transition-colors ${on ? "text-ink" : "text-muted hover:bg-surface-2 hover:text-ink"}`}>
                {on && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-[10px] bg-surface-2 ring-1 ring-line" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }} />}
                <I size={18} weight={on ? "fill" : "regular"} className="relative" aria-hidden />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="card mt-auto flex items-center gap-3 p-3">
          <svg viewBox="0 0 44 44" className="size-11 -rotate-90" aria-hidden>
            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--surface-2)" strokeWidth="5" />
            <motion.circle cx="22" cy="22" r="18" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" pathLength={1}
              initial={{ pathLength: 0 }} animate={{ pathLength: ready ? used : 0 }} transition={{ duration: reduce ? 0 : 1.2, ease: [0.16, 1, 0.3, 1] }} />
          </svg>
          <div className="leading-tight">
            <div className="num text-[22px] font-semibold">{ready ? left : "-"}</div>
            <div className="text-[12px] text-muted">days to placements</div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted" role="status">
            {connected && synced ? <CloudCheck size={16} className="shrink-0 text-accent" aria-hidden /> : <CloudSlash size={16} className="shrink-0" aria-hidden />}
            <span className="min-w-0"><span className="block truncate">{status}</span>{email && <span className="block truncate text-[11px] opacity-80" title={email}>{email}</span>}</span>
          </span>
          <button type="button" onClick={() => setOpen(true)} aria-label="Settings" className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-[10px] text-muted transition hover:bg-surface-2 hover:text-ink active:scale-95">
            <GearSix size={18} aria-hidden />
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-muted" suppressHydrationWarning>
              {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="text-[28px] font-semibold leading-tight sm:text-[32px]">{page.label}</h1>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <span className="num rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent">{ready ? left : "-"}d left</span>
            <button type="button" onClick={() => setOpen(true)} aria-label="Settings" className="grid size-10 cursor-pointer place-items-center rounded-[10px] border border-line bg-surface text-ink active:scale-95">
              <GearSix size={18} aria-hidden />
            </button>
          </div>
        </header>
        <AnimatePresence mode="wait">
          <motion.div key={path.split("/").slice(0, 3).join("/")} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* bottom tab bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden" aria-label="Sections">
        {NAV.map(({ href, label, icon: I }) => {
          const on = isOn(href);
          return (
            <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${on ? "text-accent" : "text-muted"}`}>
              <I size={22} weight={on ? "fill" : "regular"} aria-hidden />{label}
            </Link>
          );
        })}
      </nav>

      <Settings open={open} onClose={() => setOpen(false)} />
      <AnimatePresence>
        {toast && (
          <motion.div role="status" initial={{ opacity: 0, y: 16, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 8, x: "-50%" }}
            className="fixed bottom-24 left-1/2 z-40 max-w-[calc(100vw-32px)] rounded-xl bg-ink px-4 py-2.5 text-[14px] font-medium text-bg shadow-card lg:bottom-8">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
