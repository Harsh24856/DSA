"use client";
// Live code: type on the left, see the result as you type. JavaScript, TypeScript, React and Node run in a sandboxed
// iframe (public/playground/runtime.js); Python and SQL run in WebAssembly (wasm.ts). Nothing runs on a server.
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, Play, X } from "@phosphor-icons/react";
import { compile, type PlayMode } from "@/lib/other/playground/compile";
import { Editor } from "./Editor";
import { wasmHost, type WasmMsg } from "./wasm";

type Line = { kind: string; text: string };
type Table = { head: string[]; rows: string[][] };
type Reply = { status?: number; statusText?: string; headers?: Record<string, string>; body?: string; error?: string };

const DELAY: Record<PlayMode, number> = { js: 350, ts: 350, node: 450, react: 300, python: 700, sql: 350 };
const LABEL: Record<PlayMode, string> = { js: "JavaScript", ts: "TypeScript", node: "Node + Express", react: "React", python: "Python", sql: "SQL" };
const NOTE: Partial<Record<PlayMode, string>> = {
  node: "Runs in your browser on a small emulation of Node and Express: core modules and routing work, but there is no real network and no npm install.",
  react: "Runs React 19 in your browser. The preview shows the App export, or else the last exported component.",
  python: "Real CPython compiled to WebAssembly. The first run downloads about 10 MB.",
  sql: "Real SQLite compiled to WebAssembly. Each run starts from the same tables.",
};
const TOKENS = ["bg", "surface", "surface-2", "ink", "muted", "line", "line-strong", "accent", "accent-ink", "hard"];

// The sandbox has an opaque origin, so browsers may refuse it scripts from this site (and always from localhost):
// the page fetches them once and writes them into the frame.
const scripts = new Map<string, Promise<string>>();
const script = (name: string) => {
  let p = scripts.get(name);
  if (!p) {
    p = fetch(`/playground/${name}.js`).then((r) => { if (!r.ok) throw new Error(`Could not load the runner (${r.status}).`); return r.text(); }).then((t) => t.replace(/<\/script/gi, "<\\/script"));
    p.catch(() => scripts.delete(name));
    scripts.set(name, p);
  }
  return p;
};

function srcDoc(mode: PlayMode, runId: number, js: string, source: string, runtime: string, react: string) {
  const css = getComputedStyle(document.documentElement);
  const vars = TOKENS.map((t) => `--${t}:${css.getPropertyValue(`--${t}`).trim()}`).join(";");
  const payload = JSON.stringify({ runId, mode, js, source }).replace(/</g, "\\u003c");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{${vars}}*{box-sizing:border-box}html{color-scheme:light dark}
body{margin:0;padding:14px;background:var(--surface);color:var(--ink);font:15px/1.5 ui-sans-serif,system-ui,sans-serif}
h1,h2,h3,h4,p,ul,ol{margin:0 0 8px}.card{display:block;padding:14px;border:1px solid var(--line);border-radius:12px;margin-bottom:10px}
button{font:inherit;font-weight:600;padding:6px 12px;margin:2px 6px 2px 0;border-radius:8px;border:1px solid var(--line-strong);background:var(--surface-2);color:var(--ink);cursor:pointer}
button:disabled{opacity:.6;cursor:default}input,textarea,select{font:inherit;padding:6px 10px;margin:2px 6px 2px 0;border-radius:8px;border:1px solid var(--line-strong);background:var(--bg);color:var(--ink);max-width:100%}
a{color:var(--accent)}.pg-error{color:var(--hard);font-weight:600}
</style></head><body><div id="root"></div>${mode === "react" ? `<script>${react}<\/script>` : ""}<script>${runtime}<\/script><script>__pg.boot(${payload})<\/script></body></html>`;
}

const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i); return (h >>> 0).toString(36); };

export default function Playground({ mode, code, setup, title, onClose }: { mode: PlayMode; code: string; setup?: string; title?: string; onClose?: () => void }) {
  const key = `dsa-playground:${mode}:${hash(code)}`;
  const [initial] = useState(() => { try { return localStorage.getItem(key) ?? code; } catch { return code; } });
  const [source, setSource] = useState(initial);
  const [edition, setEdition] = useState(0);             // bumps on Reset, so the editor remounts with the sample

  const [lines, setLines] = useState<Line[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [syntax, setSyntax] = useState<string | null>(null);
  const [status, setStatus] = useState("Starting...");
  const [frame, setFrame] = useState<{ id: number; doc: string } | null>(null);
  const [height, setHeight] = useState(0);
  const [component, setComponent] = useState<string | null>(null);
  const [noComponent, setNoComponent] = useState(false);

  // Node servers
  const [port, setPort] = useState<number | null>(null);
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/");
  const [headers, setHeaders] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState<Reply | null>(null);
  const request = useRef({ method, path, headers, body });
  request.current = { method, path, headers, body };

  const iframe = useRef<HTMLIFrameElement>(null), runRef = useRef(0), reqId = useRef(0);
  const host = useRef<ReturnType<typeof wasmHost> | null>(null);
  const wasm = mode === "python" || mode === "sql";
  const [armed, setArmed] = useState(mode !== "python");  // Python downloads 10 MB, so it waits for the first Run press

  const send = useCallback(() => {
    const win = iframe.current?.contentWindow;
    if (!win || !port) return;
    const { method: m, path: p, headers: h, body: b } = request.current;
    const hd: Record<string, string> = {};
    for (const l of h.split("\n")) { const i = l.indexOf(":"); if (i > 0) hd[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
    const hasBody = !["GET", "HEAD"].includes(m) && b.trim();
    if (hasBody && !Object.keys(hd).some((k) => k.toLowerCase() === "content-type")) hd["content-type"] = "application/json";
    win.postMessage({ pg: true, type: "request", id: ++reqId.current, port, method: m, url: p.startsWith("/") ? p : `/${p}`, headers: hd, body: hasBody ? b : undefined }, "*");
  }, [port]);

  // messages from the JavaScript sandbox
  useEffect(() => {
    if (wasm) return;
    const on = (e: MessageEvent) => {
      const d = e.data;
      if (!d?.pg || e.source !== iframe.current?.contentWindow || d.runId !== runRef.current) return;
      switch (d.type) {
        case "log": setLines((l) => (d.kind === "raw" || d.kind === "rawerr") && l.length && !l[l.length - 1].text.endsWith("\n") && l[l.length - 1].kind === d.kind ? [...l.slice(0, -1), { kind: d.kind, text: l[l.length - 1].text + d.text }] : [...l, { kind: d.kind, text: d.text }]); break;
        case "ready": setStatus("Up to date"); break;
        case "height": setHeight(Math.min(d.height, 600)); break;
        case "component": setComponent(d.name); setNoComponent(false); break;
        case "no-component": setNoComponent(true); setComponent(null); break;
        case "server": setPort(d.port); break;
        case "server-closed": setPort((p) => (p === d.port ? null : p)); break;
        case "response": if (d.id === reqId.current) setReply(d); break;
      }
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [wasm]);

  // a (re)started server answers the current request again, so the response stays live while you edit the routes
  useEffect(() => { if (port) { const t = setTimeout(send, 60); return () => clearTimeout(t); } }, [port, frame, send]);

  // Python and SQL
  const onWasm = useCallback((m: WasmMsg) => {
    if (m.type === "failed") { setStatus("Could not load"); setLines([{ kind: "error", text: `${m.text}\nCheck your connection and try again.` }]); return; }
    if (m.type === "loaded") return;
    if (m.id !== runRef.current) return;
    if (m.type === "started") setStatus("Running...");
    if (m.type === "done") setStatus("Up to date");
    if (m.type === "log") setLines((l) => [...l, { kind: m.kind, text: m.text }]);
    if (m.type === "tables") setTables(m.results);
  }, []);
  useEffect(() => {
    if (!wasm) return;
    const h = wasmHost(mode as "python" | "sql", onWasm, (s) => { setStatus("Stopped"); setLines((l) => [...l, { kind: "error", text: `Stopped: this ran for over ${s} s, so it was shut down.` }]); });
    host.current = h;
    return () => { h.dispose(); host.current = null; };
  }, [wasm, mode, onWasm]);

  const run = useCallback((text: string) => {
    if (wasm) {
      setSyntax(null); setLines([]); setTables([]);
      setStatus(mode === "python" ? "Loading Python..." : "Loading SQLite...");
      runRef.current = host.current?.run(text, setup) ?? 0;
      return;
    }
    const out = compile(text, mode);
    if (out.error !== undefined) { setSyntax(out.error); setStatus("Syntax error"); return; }   // keep the last good result on screen
    setSyntax(null); setLines([]); setPort(null); setComponent(null); setNoComponent(false); setStatus("Running...");
    const id = ++runRef.current;
    Promise.all([script("runtime"), mode === "react" ? script("react") : Promise.resolve("")]).then(
      ([runtime, react]) => { if (id === runRef.current) setFrame({ id, doc: srcDoc(mode, id, out.js, text, runtime, react) }); },
      (e: Error) => { setStatus("Could not load"); setLines([{ kind: "error", text: e.message }]); },
    );
  }, [mode, setup, wasm]);

  // live: re-run shortly after the last keystroke
  useEffect(() => {
    if (!armed) { setStatus("Press Run to load Python"); return; }
    const t = setTimeout(() => run(source), lines.length || frame ? DELAY[mode] : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, armed, run]);

  const edit = (v: string) => {
    setSource(v);
    try { if (v === code) localStorage.removeItem(key); else localStorage.setItem(key, v); } catch {}
  };
  const reset = () => { edit(code); setEdition((n) => n + 1); };

  return (
    <section className="pg" aria-label={`${LABEL[mode]} playground`}>
      <header className="pg-head">
        <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{title ?? `${LABEL[mode]} playground`}</div></div>
        <span className="pill pill-muted num text-xs" role="status">{status}</span>
        {mode === "python" && <button type="button" className="btn btn-sm btn-primary" onClick={() => { if (armed) run(source); else setArmed(true); }}><Play size={14} weight="fill" aria-hidden />Run</button>}
        <button type="button" className="btn btn-sm btn-icon" aria-label="Reset to the original code" title="Reset" onClick={reset}><ArrowCounterClockwise size={15} aria-hidden /></button>
        {onClose && <button type="button" className="btn btn-sm btn-icon" aria-label="Close the playground" title="Close" onClick={onClose}><X size={15} aria-hidden /></button>}
      </header>

      {setup && <details className="pg-setup"><summary>Tables used by this query</summary><pre><code>{setup}</code></pre></details>}

      <div className="pg-grid">
        <Editor key={edition} value={edition ? code : initial} mode={mode} onChange={edit} />
        <div className="pg-out">
          {syntax && <p className="pg-syntax" role="alert"><b>Syntax error.</b> {syntax} The last working result is still shown.</p>}

          {mode === "react" && (
            <div className="pg-pane">
              <div className="pg-pane-title">Preview{component ? `: <${component} />` : ""}</div>
              {noComponent && <p className="px-3 py-2 text-sm text-muted">No component to show yet. Add <code>export function App() {"{ ... }"}</code> and it appears here.</p>}
              {frame && <iframe ref={iframe} key={frame.id} title="Preview of your component" sandbox="allow-scripts allow-forms" srcDoc={frame.doc} className="pg-frame" style={{ height: noComponent ? 0 : Math.max(height, 90) }} />}
            </div>
          )}
          {!wasm && mode !== "react" && frame && <iframe ref={iframe} key={frame.id} title="Sandbox running your code" sandbox="allow-scripts" srcDoc={frame.doc} className="hidden" tabIndex={-1} />}

          {port && (
            <form className="pg-pane" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <div className="pg-pane-title">Server on port {port}: send a request</div>
              <div className="flex flex-wrap gap-2 p-3">
                <select aria-label="HTTP method" className="field w-auto" value={method} onChange={(e) => setMethod(e.target.value)}>{["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => <option key={m}>{m}</option>)}</select>
                <input aria-label="Path" className="field order-3 min-w-0 flex-1 basis-full font-mono sm:order-none sm:basis-0" value={path} onChange={(e) => setPath(e.target.value)} />
                <button className="btn btn-primary"><Play size={14} weight="fill" aria-hidden />Send</button>
                <textarea aria-label="Request headers, one per line" className="field w-full font-mono text-sm" rows={1} placeholder="Headers, e.g. authorization: Bearer secret-demo-token" value={headers} onChange={(e) => setHeaders(e.target.value)} />
                {method !== "GET" && <textarea aria-label="JSON request body" className="field w-full font-mono text-sm" rows={3} placeholder='Body, e.g. {"text": "hello"}' value={body} onChange={(e) => setBody(e.target.value)} />}
              </div>
              {reply && (
                <div className="border-t border-line p-3 text-sm" role="status">
                  {reply.error ? <p className="text-hard">{reply.error}</p> : <>
                    <div className="num mb-1 font-semibold">{reply.status} {reply.statusText}{reply.headers?.["content-type"] ? <span className="font-normal text-muted"> · {reply.headers["content-type"]}</span> : null}{reply.headers?.location ? <span className="font-normal text-muted"> · location: {reply.headers.location}</span> : null}</div>
                    {reply.body ? <pre className="pg-log whitespace-pre-wrap">{prettyBody(reply.body)}</pre> : <span className="text-muted">(empty body)</span>}
                  </>}
                </div>
              )}
            </form>
          )}

          {tables.map((t, i) => (
            <div key={i} className="pg-pane overflow-x-auto"><div className="pg-pane-title">Result: {t.rows.length} row{t.rows.length === 1 ? "" : "s"}</div>
              <table className="pg-table"><thead><tr>{t.head.map((h, k) => <th key={k}>{h}</th>)}</tr></thead><tbody>{t.rows.map((r, a) => <tr key={a}>{r.map((c, b) => <td key={b} className="num">{c}</td>)}</tr>)}</tbody></table>
            </div>
          ))}

          <div className="pg-pane">
            <div className="pg-pane-title">{wasm && mode === "sql" ? "Messages" : "Console"}</div>
            <div className="pg-log" role="log" aria-live="polite">
              {lines.length ? lines.map((l, i) => <div key={i} className={l.kind === "error" || l.kind === "rawerr" ? "text-hard" : l.kind === "warn" ? "text-medium" : ""}>{l.kind === "error" || l.kind === "rawerr" ? `Error: ${l.text.replace(/^Error: /, "")}` : l.text}</div>)
                : <span className="text-muted">{mode === "sql" ? (tables.length ? "No messages." : "Nothing yet.") : mode === "react" ? "console.log output appears here." : "Nothing printed yet."}</span>}
            </div>
          </div>
          {NOTE[mode] && <p className="px-1 text-xs text-muted">{NOTE[mode]}</p>}
        </div>
      </div>
    </section>
  );
}

function prettyBody(b: string) { try { return JSON.stringify(JSON.parse(b), null, 2); } catch { return b; } }
