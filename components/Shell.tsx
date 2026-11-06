"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { CloudCheck, CloudSlash, GearSix, MagnifyingGlass } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { diffDays, parse } from "@/lib/logic";
import { Settings } from "./Settings";
import { SolveProvider } from "./SolvePanel";
import { LookLayer } from "./LookLayer";
import { Logo } from "./Logo";

const Landing = dynamic(() => import("./landing/Landing").then((m) => m.Landing));
const Search = dynamic(() => import("./Search").then((m) => m.Search), { ssr: false });

const NAV = [
  { href: "/", label: "Today" },
  { href: "/analytics", label: "Analytics" },
  { href: "/patterns", label: "Patterns" },
  { href: "/problems", label: "Problems" },
  { href: "/drill", label: "Practice" },
  { href: "/genai", label: "Gen AI" },
  { href: "/other", label: "CS core" },
  { href: "/syntax", label: "Syntax" },
];
// pages that stand on their own, without the app's navigation
const STANDALONE = ["/auth", "/welcome", "/privacy", "/terms"];
const isAppPath = (p: string) => p === "/" || ["/analytics", "/patterns", "/problems", "/drill", "/mock", "/genai", "/other", "/syntax"].some((a) => p === a || p.startsWith(a + "/"));
const EASE = [0.22, 1, 0.36, 1] as const;
const SEARCH_NAV = [...NAV.filter((n) => n.href !== "/drill"), { href: "/drill", label: "Pattern drill" }, { href: "/mock", label: "Mock OA" }, { href: "/other/oa", label: "CS core OA questions" }];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { now, status, synced, connected, toast, ready, email, state, authChecked } = useStore();
  const [settings, setSettings] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const reduce = useReducedMotion();
  const left = Math.max(0, diffDays(parse(state.quota.placement), now));
  const isOn = (href: string) => (href === "/" ? path === "/" : path.startsWith(href) || (href === "/drill" && path.startsWith("/mock")));
  const page = NAV.find((n) => isOn(n.href));

  useEffect(() => { setMenu(false); setSearch(false); }, [path]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch((s) => !s); } };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => { removeEventListener("keydown", onKey); document.documentElement.style.overflow = ""; };
  }, [menu]);

  if (STANDALONE.some((p) => path.startsWith(p)) || !isAppPath(path)) return <MotionConfig reducedMotion="user">{children}</MotionConfig>;   // includes the 404
  if (authChecked && !email) return <MotionConfig reducedMotion="user"><Landing /></MotionConfig>;   // the session ended while the app was open

  return (
    <MotionConfig reducedMotion="user">
    <SolveProvider>
    <LookLayer />
    <a href="#main" className="sr-only z-50 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>

    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4">
      <header className="top-nav pointer-events-auto flex w-full items-center gap-2 p-2 lg:w-auto">
        <Link href="/" aria-label="DSA Daily, today's plan" className="flex shrink-0 items-center rounded-lg px-2 py-1 transition-opacity duration-300 hover:opacity-80"><Logo className="h-6 w-auto" /></Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Sections">
          {NAV.map(({ href, label }) => {
            const on = isOn(href);
            return (
              <Link key={href} href={href} aria-current={on ? "page" : undefined}
                className={`relative flex h-8 items-center rounded-lg px-3 text-sm font-medium transition-colors duration-300 ${on ? "text-ink" : "text-muted hover:text-ink"}`}>
                {on && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-surface-2 ring-1 ring-line" transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE }} />}
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          <span className="num flex h-8 items-center rounded-lg px-2 text-xs font-semibold text-muted" title="Days left until placements" suppressHydrationWarning>{ready ? left : "-"}<span className="ml-1 font-sans font-medium">days</span></span>
          <span className="hidden size-8 place-items-center text-muted sm:grid" role="status" title={email ? `${status}, ${email}` : status}>
            {connected && synced ? <CloudCheck size={18} aria-hidden /> : <CloudSlash size={18} aria-hidden />}
            <span className="sr-only">{status}</span>
          </span>
          <button type="button" onClick={() => setSearch(true)} aria-label="Search questions and pages" title="Search (Ctrl or Cmd + K)" className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted transition duration-300 hover:bg-surface-2 hover:text-ink active:scale-95">
            <MagnifyingGlass size={18} aria-hidden />
          </button>
          <button type="button" onClick={() => setSettings(true)} aria-label="Settings" className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted transition duration-300 hover:bg-surface-2 hover:text-ink active:scale-95">
            <GearSix size={18} aria-hidden />
          </button>
          <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="nav-panel" aria-label={menu ? "Close menu" : "Open menu"}
            className="relative grid size-8 cursor-pointer place-items-center rounded-lg text-ink transition duration-300 hover:bg-surface-2 active:scale-95 lg:hidden">
            {[-1, 1].map((d) => (
              <motion.span key={d} className="absolute h-0.5 w-4 rounded-full bg-current" initial={false}
                animate={menu ? { y: 0, rotate: d * 45 } : { y: d * 4, rotate: 0 }} transition={{ duration: reduce ? 0 : 0.5, ease: EASE }} />
            ))}
          </button>
        </div>
      </header>
    </div>

    <AnimatePresence>
      {menu && (
        <motion.nav id="nav-panel" aria-label="Sections" className="nav-panel fixed inset-0 z-30 flex flex-col gap-2 overflow-y-auto px-6 pb-8 pt-24 lg:hidden"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
          {NAV.map(({ href, label }, i) => {
            const on = isOn(href);
            return (
              <motion.div key={href} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.4), ease: EASE }}>
                <Link href={href} aria-current={on ? "page" : undefined} onClick={() => setMenu(false)}
                  className={`block rounded-xl px-4 py-3 heading-5 transition-colors duration-300 ${on ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}>{label}</Link>
              </motion.div>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>

    <main id="main" className="mx-auto w-full max-w-[1152px] px-4 pb-16 pt-24 sm:px-6">
      <header className="mb-6">
        <p className="caption-1 text-muted" suppressHydrationWarning>{now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <h1 className="heading-4 mt-1">{page?.label ?? "Today"}</h1>
      </header>
      {/* no exit animation: the router has already swapped children, so waiting on an exit only delays the new page */}
      <motion.div key={path.split("/").slice(0, 3).join("/")} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: EASE }}>
        {children}
      </motion.div>
    </main>

    <Settings open={settings} onClose={() => setSettings(false)} />
    {search && <Search nav={SEARCH_NAV} onClose={() => setSearch(false)} />}
    <AnimatePresence>
      {toast && (
        <motion.div role="status" initial={{ opacity: 0, y: 16, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 8, x: "-50%" }}
          className="fixed bottom-6 left-1/2 z-40 max-w-[calc(100vw-32px)] rounded-xl bg-ink px-4 py-2 text-sm font-medium text-bg">
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
    </SolveProvider>
    </MotionConfig>
  );
}
