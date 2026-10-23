"use client";
import { createContext, useContext, useEffect, useState } from "react";

// Palettes map to data-palette on <html> (midnight = no attribute); modes map to data-theme (auto = no attribute).
// Preview colours mirror the tokens in app/globals.css: [bg, surface, line, accent, ink].
type Swatch = [bg: string, surface: string, line: string, accent: string, ink: string];
export const PALETTES: Record<string, { name: string; light: Swatch; dark: Swatch }> = {
  midnight: { name: "Midnight", light: ["#F4F6FB", "#FFFFFF", "#DCE2EE", "#1D4ED8", "#0B1630"], dark: ["#04060B", "#0B1530", "#1B2950", "#5B9BFF", "#F5F7FF"] },
  galaxy: { name: "Galaxy", light: ["#F4F3FA", "#FFFFFF", "#E3E0EF", "#4A4E8F", "#1E1830"], dark: ["#14111D", "#1D1929", "#2D2840", "#A3A7F2", "#ECE9F6"] },
  ocean: { name: "Ocean", light: ["#F1F7F7", "#FFFFFF", "#D7E6E7", "#0F766E", "#10272B"], dark: ["#071415", "#0E2224", "#1C3739", "#4FD1C5", "#E6F4F3"] },
  forest: { name: "Forest", light: ["#F6F5EF", "#FFFFFF", "#E2E2D6", "#3F6B3A", "#1F2A1D"], dark: ["#0F140E", "#182016", "#2A3527", "#8CC77F", "#EDF1E8"] },
  sunset: { name: "Sunset", light: ["#FBF5F1", "#FFFFFF", "#EFE2DA", "#C2410C", "#2B1A14"], dark: ["#140C09", "#22150F", "#3A2820", "#FB923C", "#F8EDE7"] },
  rose: { name: "Rose", light: ["#FBF4F6", "#FFFFFF", "#EEDDE4", "#BE185D", "#2A1520"], dark: ["#130A0F", "#21121A", "#3A2330", "#F472B6", "#F7EAF0"] },
  mono: { name: "Mono", light: ["#F5F5F5", "#FFFFFF", "#E2E2E2", "#111111", "#111111"], dark: ["#000000", "#111111", "#262626", "#F2F2F2", "#F2F2F2"] },
};
export const MODES = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]] as const;
export type Mode = (typeof MODES)[number][0];

type Ctx = { palette: string; mode: Mode; dark: boolean; setPalette: (p: string) => void; setMode: (m: Mode) => void };
const ThemeContext = createContext<Ctx | null>(null);

export function useTheme() {
  const c = useContext(ThemeContext);
  if (!c) throw new Error("useTheme needs <ThemeProvider>");
  return c;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPalette] = useState("midnight");
  const [mode, setMode] = useState<Mode>("auto");
  const [systemDark, setSystemDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem("dsa-daily-palette"), m = localStorage.getItem("dsa-daily-theme");
      if (p && PALETTES[p]) setPalette(p);
      if (m === "light" || m === "dark") setMode(m);
    } catch {}
    const mq = matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", on);
    setLoaded(true);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const r = document.documentElement;
    if (palette === "midnight") r.removeAttribute("data-palette"); else r.dataset.palette = palette;
    if (mode === "auto") r.removeAttribute("data-theme"); else r.dataset.theme = mode;
    try { localStorage.setItem("dsa-daily-palette", palette); localStorage.setItem("dsa-daily-theme", mode); } catch {}
  }, [palette, mode, loaded]);

  const dark = mode === "dark" || (mode === "auto" && systemDark);
  return <ThemeContext.Provider value={{ palette, mode, dark, setPalette, setMode }}>{children}</ThemeContext.Provider>;
}

export function ModeButtons() {
  const { mode, setMode } = useTheme();
  return (
    <div className="modes" role="group" aria-label="Light or dark mode">
      {MODES.map(([k, label]) => <button key={k} className="chip" type="button" aria-pressed={k === mode} onClick={() => setMode(k)}>{label}</button>)}
    </div>
  );
}

// Compact dots for the header popover.
export function SwatchDots() {
  const { palette, dark, setPalette } = useTheme();
  return (
    <div className="swatches">
      {Object.entries(PALETTES).map(([k, p]) => (
        <button key={k} className="sw" type="button" aria-pressed={k === palette} onClick={() => setPalette(k)}>
          <i style={{ background: (dark ? p.dark : p.light)[3] }} /><span>{p.name}</span>
        </button>
      ))}
    </div>
  );
}

// The Theme section: a small preview of each palette in the current light/dark mode.
export function ThemeSection() {
  const { palette, mode, dark, setPalette } = useTheme();
  const modeLabel = mode === "auto" ? `Auto (${dark ? "dark" : "light"} now)` : mode === "dark" ? "Dark" : "Light";
  return (
    <section className="panel" aria-labelledby="themeH">
      <div className="ph"><h2 id="themeH">Theme</h2><span className="sub">{PALETTES[palette].name}, {modeLabel}</span></div>
      <div className="theme-cards">
        {Object.entries(PALETTES).map(([k, p]) => {
          const [bg, surface, line, accent, ink] = dark ? p.dark : p.light;
          return (
            <button key={k} className="tcard" type="button" aria-pressed={k === palette} onClick={() => setPalette(k)}>
              <span className="tprev" aria-hidden="true" style={{ background: bg, borderColor: line }}>
                <span className="tsurf" style={{ background: surface, borderColor: line }}>
                  <span className="tline" style={{ background: ink }} />
                  <span className="tline short" style={{ background: ink }} />
                  <span className="tbar" style={{ background: accent }} />
                </span>
              </span>
              <span className="tname">{p.name}</span>
            </button>
          );
        })}
      </div>
      <div className="theme-mode"><span className="k">Mode</span><ModeButtons /></div>
    </section>
  );
}
