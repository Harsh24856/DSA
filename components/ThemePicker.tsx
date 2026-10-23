"use client";
import { useEffect, useRef, useState } from "react";
import { ModeButtons, SwatchDots } from "./theme";

// Header shortcut to the same theme settings as the Theme section.
export default function ThemePicker() {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null), box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("click", click); document.removeEventListener("keydown", key); };
  }, [open]);

  return (
    <>
      <button ref={btn} className="theme-btn" type="button" aria-label="Choose theme" aria-expanded={open} aria-controls="picker" onClick={() => setOpen(o => !o)}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" /></svg>
      </button>
      {open && (
        <div className="picker" id="picker" ref={box}>
          <div className="k">Theme</div>
          <SwatchDots />
          <div className="k">Mode</div>
          <ModeButtons />
        </div>
      )}
    </>
  );
}
