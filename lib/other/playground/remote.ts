// C++, Java and Rust need a compiler, which a browser does not have, so they run on Compiler Explorer (godbolt.org):
// its public API compiles the code and runs it on its own servers. Only the code is sent.
export type RemoteMode = "cpp" | "java" | "rust";
export const REMOTE: Record<RemoteMode, { id: string; lang: string; args: string; name: string }> = {
  cpp: { id: "g153", lang: "c++", args: "-std=c++20 -O1 -fdiagnostics-color=never", name: "GCC 15.3, C++20" },
  java: { id: "java2501", lang: "java", args: "", name: "JDK 25" },
  rust: { id: "r1950", lang: "rust", args: "-C opt-level=1 --edition 2021", name: "rustc 1.95, edition 2021" },
};
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[A-Za-z]`, "g");

/** Compiler Explorer picks the Java file name itself, so a public top-level class would not compile there. */
export const forRemote = (mode: RemoteMode, src: string) => (mode === "java" ? src.replace(/^(\s*)public\s+((?:final\s+|abstract\s+)*(?:class|interface|enum|record)\s)/gm, "$1$2") : src);

export type RemoteResult = { stdout: string; stderr: string; build: string; timedOut: boolean; code: number };
type Out = { text: string }[] | undefined;
const text = (xs: Out) => (xs ?? []).map((x) => x.text).join("\n").replace(ANSI, "").replace(/\s+$/, "");

export async function runRemote(mode: RemoteMode, source: string, signal?: AbortSignal): Promise<RemoteResult> {
  const c = REMOTE[mode];
  const r = await fetch(`https://godbolt.org/api/compiler/${c.id}/compile`, {
    method: "POST", signal, headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ source: forRemote(mode, source), lang: c.lang, allowStoreCodeDebug: false, options: {
      userArguments: c.args, compilerOptions: { executorRequest: true, skipAsm: true }, filters: { execute: true }, tools: [], libraries: [], executeParameters: { args: [], stdin: "" },
    } }),
  });
  if (!r.ok) throw new Error(`Compiler Explorer answered ${r.status}. Try again in a moment.`);
  const d = await r.json() as { code: number; didExecute?: boolean; timedOut?: boolean; stdout?: Out; stderr?: Out; buildResult?: { stderr?: Out } };
  const ran = d.didExecute !== false;
  return { code: d.code, timedOut: !!d.timedOut, stdout: ran ? text(d.stdout) : "", stderr: ran ? text(d.stderr) : "", build: ran ? "" : text(d.buildResult?.stderr) || text(d.stderr) };
}
