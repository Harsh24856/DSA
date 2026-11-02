// Python (Pyodide) and SQL (sql.js) run in a Web Worker inside a sandboxed iframe. The iframe keeps them away from
// the app's cookies and storage, and removing it is the only way to stop an endless loop in WebAssembly.
const PY = "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/";
const SQLJS = "https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/";

const PY_WORKER = `
importScripts(${JSON.stringify(PY + "pyodide.js")});
const ready = loadPyodide({ indexURL: ${JSON.stringify(PY)} });
ready.then(() => postMessage({ type: "loaded" }), (e) => postMessage({ type: "failed", text: String(e) }));
onmessage = async (e) => {
  const py = await ready, { id, code } = e.data;
  const send = (kind) => (text) => postMessage({ type: "log", id, kind, text });
  py.setStdout({ batched: send("log") });
  py.setStderr({ batched: send("error") });
  const ns = py.globals.get("dict")();
  try {
    await py.loadPackagesFromImports(code);
    postMessage({ type: "started", id });
    await py.runPythonAsync(code, { globals: ns, filename: "main.py" });
  } catch (err) {
    const lines = String(err.message).split("\\n");
    const at = lines.findIndex((l) => l.includes('File "main.py"'));
    postMessage({ type: "log", id, kind: "error", text: (at >= 0 ? ["Traceback (most recent call last):", ...lines.slice(at)] : lines).join("\\n").trim() });
  } finally { ns.destroy(); postMessage({ type: "done", id }); }
};`;

const SQL_WORKER = `
importScripts(${JSON.stringify(SQLJS + "sql-wasm.js")});
const ready = initSqlJs({ locateFile: (f) => ${JSON.stringify(SQLJS)} + f });
ready.then(() => postMessage({ type: "loaded" }), (e) => postMessage({ type: "failed", text: String(e) }));
onmessage = async (e) => {
  const SQL = await ready, { id, code, setup } = e.data, db = new SQL.Database();
  postMessage({ type: "started", id });
  try {
    if (setup) db.run(setup);
    postMessage({ type: "tables", id, results: db.exec(code).map((r) => ({ head: r.columns, rows: r.values.map((v) => v.map((c) => (c === null ? "NULL" : String(c)))) })) });
  } catch (err) { postMessage({ type: "log", id, kind: "error", text: String(err.message) }); }
  finally { db.close(); postMessage({ type: "done", id }); }
};`;

export type WasmMsg =
  | { type: "loaded" } | { type: "failed"; text: string } | { type: "started" | "done"; id: number }
  | { type: "log"; id: number; kind: string; text: string } | { type: "tables"; id: number; results: { head: string[]; rows: string[][] }[] };

const LIMIT = { python: 6000, sql: 3000 };

/** One hidden sandbox per playground. `run` starts a program; if it outlives its limit the sandbox is thrown away. */
export function wasmHost(kind: "python" | "sql", on: (m: WasmMsg) => void, onStopped: (seconds: number) => void) {
  let frame: HTMLIFrameElement | null = null, timer = 0, runId = 0, queued: Record<string, unknown> | null = null, loaded = false;

  const listener = (e: MessageEvent) => {
    if (!frame || e.source !== frame.contentWindow || !e.data?.pg) return;
    const m = e.data.msg as WasmMsg;
    if (m.type === "loaded") { loaded = true; if (queued) { frame.contentWindow!.postMessage(queued, "*"); queued = null; } }
    if (m.type === "started" && m.id === runId) { clearTimeout(timer); timer = window.setTimeout(stop, LIMIT[kind]); }
    if (m.type === "done" && m.id === runId) clearTimeout(timer);
    on(m);
  };
  const stop = () => { dispose(); onStopped(LIMIT[kind] / 1000); };
  const start = () => {
    frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts");
    frame.title = `${kind} sandbox`; frame.hidden = true; frame.tabIndex = -1;
    const src = kind === "python" ? PY_WORKER : SQL_WORKER;
    frame.srcdoc = `<!doctype html><script>
      const w = new Worker(URL.createObjectURL(new Blob([${JSON.stringify(src).replace(/</g, "\\u003c")}], { type: "text/javascript" })));
      w.onmessage = (e) => parent.postMessage({ pg: true, msg: e.data }, "*");
      w.onerror = (e) => parent.postMessage({ pg: true, msg: { type: "failed", text: e.message || "Could not start the runner." } }, "*");
      addEventListener("message", (e) => w.postMessage(e.data));
    <\/script>`;
    document.body.append(frame);
    window.addEventListener("message", listener);
  };
  const dispose = () => { clearTimeout(timer); window.removeEventListener("message", listener); frame?.remove(); frame = null; loaded = false; queued = null; };

  return {
    run(code: string, setup?: string) {
      if (!frame) start();
      const msg = { id: ++runId, code, setup };
      if (loaded) frame!.contentWindow!.postMessage(msg, "*"); else queued = msg;
      return runId;
    },
    dispose,
  };
}
