// Tiny markup for subject text: blank lines split paragraphs, "- " lines become bullets, `code` and **bold** inline.
import { Fragment, type ReactNode } from "react";

function inline(s: string): ReactNode[] {
  return s.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? <code key={i}>{part.slice(1, -1)}</code>
      : part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <Fragment key={i}>{part}</Fragment>);
}

export function Rich({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className={`grid gap-2 ${className}`}>
      {blocks.map((b, i) => {
        const lines = b.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.every((l) => l.startsWith("- "))) return <ul key={i}>{lines.map((l, k) => <li key={k}>{inline(l.slice(2))}</li>)}</ul>;
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}

export { inline };
