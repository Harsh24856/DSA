"use client";
import { useEffect, useRef, useState } from "react";

// Palettes map to data-palette on <html> (midnight = no attribute); modes map to data-theme (auto = no attribute).
const PALETTES: Record<string, [name: string, light: string, dark: string]> = {
  midnight: ["Midnight", "#1D4ED8", "#5B9BFF"], galaxy: ["Galaxy", "#4A4E8F", "#A3A7F2"], ocean: ["Ocean", "#0F766E", "#4FD1C5"],
  forest: ["Forest", "#3F6B3A", "#8CC77F"], sunset: ["Sunset", "#C2410C", "#FB923C"], rose: ["Rose", "#BE185D", "#F472B6"], mono: ["Mono", "#111111", "#F2F2F2"],
};
const MODES = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]] as const;
type Mode = (typeof MODES)[number][0];

export default function ThemePicker() {
  const [palette, setPalette] = useState("midnight");
  const [mode, setMode] = useState<Mode>("auto");
  const [systemDark, setSystemDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const btn = useRef<HTMLButtonElement>(null), box = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("click", click); document.removeEventListener("keydown", key); };
  }, [open]);

  const dark = mode === "dark" || (mode === "auto" && systemDark);
  return (
    <>
      <button ref={btn} className="theme-btn" type="button" aria-label="Choose theme" aria-expanded={open} aria-controls="picker" onClick={() => setOpen(o => !o)}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" /></svg>
      </button>
      {open && (
        <div className="picker" id="picker" ref={box}>
          <div className="k">Theme</div>
          <div className="swatches">
            {Object.entries(PALETTES).map(([k, [name, lc, dc]]) => (
              <button key={k} className="sw" type="button" aria-pressed={k === palette} onClick={() => setPalette(k)}>
                <i style={{ background: dark ? dc : lc }} /><span>{name}</span>
              </button>
            ))}
          </div>
          <div className="k">Mode</div>
          <div className="modes">
            {MODES.map(([k, label]) => <button key={k} className="chip" type="button" aria-pressed={k === mode} onClick={() => setMode(k)}>{label}</button>)}
          </div>
        </div>
      )}
    </>
  );
}
