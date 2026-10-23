"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { diffDays, PLACEMENT, todayPlan } from "@/lib/schedule.ts";
import AllProblems from "./AllProblems";
import { ProgressProvider, useProgress, useSaveStatus } from "./progress";
import Roadmap from "./Roadmap";
import Settings from "./Settings";
import Stats from "./Stats";
import ThemePicker from "./ThemePicker";
import { ThemeProvider, ThemeSection } from "./theme";
import { ProgressPanel, Revisit, TodayPanel, Upcoming, WeekStrip } from "./Today";

const VIEWS = [["today", "Today"], ["stats", "Stats"], ["problems", "Problems"], ["roadmap", "Roadmap"]] as const;
type View = (typeof VIEWS)[number][0];

function useHashView(): View {
  const [view, setView] = useState<View>("today");
  useEffect(() => {
    const read = () => { const h = location.hash.slice(1); setView(VIEWS.some(([v]) => v === h) ? (h as View) : "today"); };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  return view;
}

function useToast() {
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback((m: string) => { setMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(""), 2600); }, []);
  return { msg, toast };
}

function Header() {
  const now = useOptionalNow();
  return (
    <header className="top">
      <div className="brand">
        <h1>DSA Daily</h1>
        <div className="date">{now ? now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) : " "}</div>
      </div>
      <div className="count"><b>{now ? Math.max(0, diffDays(PLACEMENT, now)) : "–"}</b><span>days to placements</span></div>
      <ThemePicker />
    </header>
  );
}

// The header renders before progress loads, so read the date without requiring the provider.
function useOptionalNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const id = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(id); }, []);
  return now;
}

function Views({ view, toast }: { view: View; toast: (m: string) => void }) {
  const { state, t, now } = useProgress();
  const plan = useMemo(() => todayPlan(state, now), [state, now]);
  const save = useSaveStatus();
  return (
    <>
      {view === "today" && (
        <div className="view">
          <TodayPanel key={t} plan={plan} />
          <Revisit />
          <WeekStrip />
          <ProgressPanel plan={plan} />
          <Upcoming plan={plan} />
          <ThemeSection />
          <Settings toast={toast} />
        </div>
      )}
      {view === "stats" && <div className="view"><Stats /></div>}
      {view === "problems" && <div className="view"><AllProblems /></div>}
      {view === "roadmap" && <div className="view"><Roadmap plan={plan} /></div>}
      <div className="save">{save}</div>
    </>
  );
}

export default function DsaDaily() {
  const view = useHashView();
  const { msg, toast } = useToast();
  return (
    <ThemeProvider>
    <div className="wrap">
      <Header />
      <nav className="tabs" aria-label="Sections">
        {VIEWS.map(([v, label]) => <a key={v} href={"#" + v} aria-current={v === view ? "page" : undefined}>{label}</a>)}
      </nav>
      <ProgressProvider fallback={<p className="loading">Loading your progress…</p>}>
        <Views view={view} toast={toast} />
      </ProgressProvider>
      {msg && <div className="toast" role="status">{msg}</div>}
      <noscript><p style={{ textAlign: "center" }}>This tracker needs JavaScript turned on.</p></noscript>
    </div>
    </ThemeProvider>
  );
}
