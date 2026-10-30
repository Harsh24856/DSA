// Runs a Python snippet in the browser with Pyodide (CPython compiled to WebAssembly), loaded from the CDN only
// the first time someone presses Run. Packages the snippet imports (numpy, pydantic) are fetched on demand.
const BASE = "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/";

type Py = {
  loadPackagesFromImports(code: string): Promise<unknown>;
  setStdout(o: { batched(s: string): void }): void;
  setStderr(o: { batched(s: string): void }): void;
  runPythonAsync(code: string, opts?: { globals?: unknown }): Promise<unknown>;
  globals: { get(name: string): () => { destroy(): void } };
};
let loading: Promise<Py> | null = null;

function loadPython(): Promise<Py> {
  loading ??= new Promise<Py>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `${BASE}pyodide.js`;
    s.onload = () => (window as unknown as { loadPyodide(o: { indexURL: string }): Promise<Py> }).loadPyodide({ indexURL: BASE }).then(resolve, reject);
    s.onerror = () => { loading = null; reject(new Error("Could not download Python. Check your connection and try again.")); };
    document.head.append(s);
  });
  return loading;
}

/** Runs `code` in a fresh namespace; every printed line goes to `out`. Throws with Python's traceback on error. */
export async function runPython(code: string, out: (line: string) => void, status: (s: string) => void) {
  status("Loading Python (first run downloads about 10 MB)...");
  const py = await loadPython();
  status("Loading packages...");
  await py.loadPackagesFromImports(code);
  py.setStdout({ batched: out });
  py.setStderr({ batched: out });
  status("Running...");
  const ns = py.globals.get("dict")();
  try { await py.runPythonAsync(code, { globals: ns }); } finally { ns.destroy(); }
}
