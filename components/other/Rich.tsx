// Tiny markup for subject text: blank lines split paragraphs, "- " lines become bullets, `code` and **bold** inline.
// With `link` (Gen AI modules only), [[id]] and [[id|label]] become links; elsewhere they stay plain text.
import { Fragment, type ReactNode } from "react";

export type LinkFn = (id: string, label: string | undefined, key: number) => ReactNode;

function inline(s: string, link?: LinkFn): ReactNode[] {
  return s.split(/(`[^`]+`|\*\*[^*]+\*\*|\[\[[a-z][a-z0-9-]*(?:\|[^\]]+)?\]\])/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? <code key={i}>{part.slice(1, -1)}</code>
      : part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong>
      : link && part.startsWith("[[") ? (([id, label]) => link(id, label, i))(part.slice(2, -2).split("|"))
      : <Fragment key={i}>{part}</Fragment>);
}

export function Rich({ text, className = "", link }: { text: string; className?: string; link?: LinkFn }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className={`grid gap-2 ${className}`}>
      {blocks.map((b, i) => {
        const lines = b.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.every((l) => l.startsWith("- "))) return <ul key={i}>{lines.map((l, k) => <li key={k}>{inline(l.slice(2), link)}</li>)}</ul>;
        return <p key={i}>{inline(lines.join(" "), link)}</p>;
      })}
    </div>
  );
}

export { inline };
