"use client";
// The code editor: CodeMirror 6, coloured with the page's tokens so it follows every theme.
import { useEffect, useRef } from "react";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { sql, SQLite } from "@codemirror/lang-sql";
import { bracketMatching, HighlightStyle, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { drawSelection, EditorView, highlightActiveLine, keymap, lineNumbers } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import type { PlayMode } from "@/lib/other/playground/compile";

const LANG = (mode: PlayMode) =>
  mode === "python" ? python() : mode === "sql" ? sql({ dialect: SQLite }) : javascript({ jsx: mode === "react", typescript: mode === "ts" || mode === "react" });

const COLORS = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: "var(--accent)", fontWeight: "600" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "var(--easy)" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "var(--medium)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--muted)", fontStyle: "italic" },
  { tag: [t.typeName, t.className, t.tagName], color: "var(--hard)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--accent)" },
]);

const THEME = EditorView.theme({
  "&": { background: "var(--bg)", color: "var(--ink)", maxHeight: "440px" },
  ".cm-scroller": { fontFamily: "var(--mono)", lineHeight: "1.6", overflow: "auto" },
  ".cm-content": { caretColor: "var(--ink)", padding: "10px 0" },
  ".cm-gutters": { background: "var(--bg)", color: "var(--muted)", border: "none" },
  ".cm-activeLine": { background: "color-mix(in oklab, var(--accent) 7%, transparent)" },
  ".cm-activeLineGutter": { background: "transparent", color: "var(--ink)" },
  ".cm-cursor": { borderLeftColor: "var(--ink)" },
  "&.cm-focused": { outline: "none" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { background: "color-mix(in oklab, var(--accent) 28%, transparent) !important" },
  ".cm-matchingBracket": { background: "color-mix(in oklab, var(--accent) 22%, transparent)", color: "inherit" },
});

export function Editor({ value, mode, onChange }: { value: string; mode: PlayMode; onChange(v: string): void }) {
  const host = useRef<HTMLDivElement>(null), view = useRef<EditorView | null>(null), cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(), history(), drawSelection(), indentOnInput(), bracketMatching(), closeBrackets(), highlightActiveLine(),
          syntaxHighlighting(COLORS), LANG(mode), THEME, EditorView.lineWrapping, EditorState.tabSize.of(2),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.contentAttributes.of({ "aria-label": "Code editor. Press Escape, then Tab, to leave it." }),
          EditorView.updateListener.of((u) => { if (u.docChanged) cb.current(u.state.doc.toString()); }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // the editor owns its text after mount; Reset and language changes remount it with a new key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={host} className="pg-editor min-w-0" />;
}
