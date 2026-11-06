// Turns what the learner typed into plain JavaScript for the sandbox: strips TypeScript, compiles JSX, turns
// imports into require() calls, and adds a guard to every loop so an endless loop cannot freeze the tab.
// Shared by the playground in the browser and by check:other in Node.
import { parse, type Node } from "acorn";
import { simple } from "acorn-walk";
import { transform, type Transform } from "sucrase";

export type PlayMode = "js" | "ts" | "node" | "react" | "python" | "sql" | "cpp" | "java" | "rust";
export type Compiled = { js: string; error?: undefined } | { error: string; js?: undefined };

type Loop = Node & { body: Node };

function guardLoops(js: string): string {
  const ast = parse(js, { ecmaVersion: "latest", sourceType: "script", allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true });
  const edits: [number, string][] = [];
  const visit = (n: Node) => {
    const b = (n as Loop).body;
    if (b.type === "BlockStatement") edits.push([b.start + 1, "__g();"]);
    else { edits.push([b.start, "{__g();"]); edits.push([b.end, "}"]); }
  };
  simple(ast, { ForStatement: visit, ForInStatement: visit, ForOfStatement: visit, WhileStatement: visit, DoWhileStatement: visit });
  let out = js;
  for (const [at, text] of edits.sort((a, b) => b[0] - a[0])) out = out.slice(0, at) + text + out.slice(at);
  return out;
}

/** A project of several files is one text, each file starting with a line `// @file path/name.js`; the first file is the entry. */
export const FILE_MARK = /^\/\/ @file (\S+)[ \t]*$/m;
export function joinFiles(files: { name: string; js: string }[]): string {
  return files.map((f) => `// @file ${f.name}\n${f.js.trim()}\n`).join("\n");
}
export function splitFiles(code: string): { name: string; js: string }[] {
  const parts = code.split(new RegExp(FILE_MARK.source, "m"));
  const out: { name: string; js: string }[] = [];
  for (let i = 1; i < parts.length; i += 2) out.push({ name: parts[i].replace(/^\.\//, ""), js: parts[i + 1] ?? "" });
  return out;
}

// Relative imports ("./routes/notes.js", "../middleware/auth.js") resolve to the other files; anything else goes to the
// runtime's require. ponytail: imported files run synchronously, so top-level await works only in the entry file.
const LOADER = `const __mods = {}, __cache = {};
const __resolve = (from, name) => { const p = from.split("/").slice(0, -1); for (const s of name.split("/")) { if (s === "..") p.pop(); else if (s !== ".") p.push(s); } return p.join("/"); };
const __load = (from) => (name) => {
  if (!String(name).startsWith(".")) return require(name);
  const p = __resolve(from, String(name));
  if (!(p in __mods)) throw new Error(\`Cannot find module '\${name}' imported from \${from}\`);
  if (!__cache[p]) { const m = { exports: {} }; __cache[p] = m; __mods[p](__load(p), m, m.exports); }
  return __cache[p].exports;
};`;

export function compile(code: string, mode: PlayMode): Compiled {
  const transforms: Transform[] = ["imports"];
  if (mode === "ts" || mode === "react") transforms.push("typescript");
  if (mode === "react") transforms.push("jsx");
  const one = (src: string, file = "main.mjs") => guardLoops(transform(src.replace(/\bimport\.meta\.url\b/g, `"file:///playground/${file}"`).replace(/\bimport\.meta\.(dirname)\b/g, '"/playground"').replace(/\bimport\.meta\.(filename)\b/g, `"/playground/${file}"`), { transforms, production: true, disableESTransforms: true }).code);
  let at = "";
  try {
    const files = FILE_MARK.test(code) ? splitFiles(code) : [];
    if (!files.length) return { js: one(code) };
    const [entry, ...rest] = files;
    const mods = rest.map((f) => { at = `${f.name}: `; return `__mods[${JSON.stringify(f.name)}] = (require, module, exports) => {\n${one(f.js, f.name)}\n};`; });
    at = `${entry.name}: `;
    return { js: `${LOADER}\n${mods.join("\n")}\n{ const require = __load(${JSON.stringify(entry.name)});\n${one(entry.js, entry.name)}\n}` };
  } catch (e) {
    return { error: at + (e as Error).message.replace(/^Error transforming [^:]*: /, "") };
  }
}
