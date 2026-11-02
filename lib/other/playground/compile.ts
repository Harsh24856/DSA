// Turns what the learner typed into plain JavaScript for the sandbox: strips TypeScript, compiles JSX, turns
// imports into require() calls, and adds a guard to every loop so an endless loop cannot freeze the tab.
// Shared by the playground in the browser and by check:other in Node.
import { parse, type Node } from "acorn";
import { simple } from "acorn-walk";
import { transform, type Transform } from "sucrase";

export type PlayMode = "js" | "ts" | "node" | "react" | "python" | "sql";
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

export function compile(code: string, mode: PlayMode): Compiled {
  const transforms: Transform[] = ["imports"];
  if (mode === "ts" || mode === "react") transforms.push("typescript");
  if (mode === "react") transforms.push("jsx");
  try {
    const src = code.replace(/\bimport\.meta\.url\b/g, '"file:///playground/main.mjs"').replace(/\bimport\.meta\.(dirname)\b/g, '"/playground"').replace(/\bimport\.meta\.(filename)\b/g, '"/playground/main.mjs"');
    return { js: guardLoops(transform(src, { transforms, production: true, disableESTransforms: true }).code) };
  } catch (e) {
    return { error: (e as Error).message.replace(/^Error transforming [^:]*: /, "") };
  }
}
