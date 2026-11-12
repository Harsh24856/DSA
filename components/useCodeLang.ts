"use client";
// Which language solutions and pattern templates show in: C++ first, Python on request. Shared by every open view.
import { useEffect, useState } from "react";

export type CodeLang = "cpp" | "python";
export const CODE_LANGS = [["cpp", "C++"], ["python", "Python"]] as const;
const KEY = "dsa-code-lang", EVENT = "dsa-code-lang";

export function useCodeLang(): [CodeLang, (l: CodeLang) => void] {
  const [lang, setLang] = useState<CodeLang>("cpp");
  useEffect(() => {
    const read = () => { try { setLang(localStorage.getItem(KEY) === "python" ? "python" : "cpp"); } catch {} };
    read();
    addEventListener(EVENT, read);
    return () => removeEventListener(EVENT, read);
  }, []);
  const set = (l: CodeLang) => { setLang(l); try { localStorage.setItem(KEY, l); } catch {} dispatchEvent(new Event(EVENT)); };
  return [lang, set];
}
