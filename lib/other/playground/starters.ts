// What each subject's playground opens with. Anything here runs as it is, and check:other proves it.
import type { PlayMode } from "./compile.ts";

export type Starter = { mode: PlayMode; label: string; code: string; setup?: string };

const REACT_STARTER = `import { useState } from "react";

// Change anything: the preview updates as you type.
export function App() {
  const [count, setCount] = useState(0);
  const [todos, setTodos] = useState(["Revise hooks"]);
  const [text, setText] = useState("");

  const add = () => {
    if (!text.trim()) return;
    setTodos([...todos, text.trim()]);
    setText("");
  };

  return (
    <div className="card">
      <h2>Clicked {count} times</h2>
      <button onClick={() => setCount(count + 1)}>Add one</button>

      <h3>Todos</h3>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="New todo" />
      <button onClick={add}>Add</button>
      <ul>{todos.map((t) => <li key={t}>{t}</li>)}</ul>
    </div>
  );
}`;

const NODE_STARTER = `import express from "express";

const app = express();
app.use(express.json());

const notes = [{ id: 1, text: "revise joins" }];

app.get("/", (req, res) => res.json({ hello: "world" }));
app.get("/notes", (req, res) => res.json(notes));
app.post("/notes", (req, res) => {
  if (!req.body?.text) return res.status(400).json({ error: "text is required" });
  const note = { id: notes.length + 1, text: req.body.text };
  notes.push(note);
  res.status(201).json(note);
});

app.listen(3000, () => console.log("listening on port 3000"));
// Use the request box below: try GET /notes, or POST /notes with a JSON body.`;

const JS_STARTER = `// Change anything: the output updates as you type.
const words = ["graph", "heap", "stack", "trie", "heap", "graph", "heap"];

const counts = new Map();
for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);

const top = [...counts].sort((a, b) => b[1] - a[1]);
console.log(counts);
console.log("most common:", top[0]);`;

const TS_STARTER = `type Item = { name: string; price: number };

function total(items: Item[]): number {
  return items.reduce((sum, i) => sum + i.price, 0);
}

const cart: Item[] = [{ name: "book", price: 250 }, { name: "pen", price: 20 }];
console.log(total(cart));`;

const PY_STARTER = `from collections import Counter

words = ["graph", "heap", "stack", "trie", "heap", "graph", "heap"]
counts = Counter(words)

print(counts.most_common(2))
print(sorted(set(words)))`;

const SQL_SETUP = `CREATE TABLE employees (id INT, name TEXT, dept TEXT, salary INT);
INSERT INTO employees VALUES
  (1, 'Asha', 'Engineering', 90000), (2, 'Ben', 'Engineering', 70000), (3, 'Chen', 'Sales', 50000),
  (4, 'Dia', 'Sales', 65000), (5, 'Eli', 'Support', 48000);`;

const SQL_STARTER = `-- Change the query: results update as you type.
SELECT dept, COUNT(*) AS people, AVG(salary) AS avg_pay
FROM employees
GROUP BY dept
ORDER BY avg_pay DESC;`;

export const STARTERS: Record<string, Starter[]> = {
  react: [{ mode: "react", label: "React", code: REACT_STARTER }],
  node: [{ mode: "node", label: "Node + Express", code: NODE_STARTER }],
  syntax: [{ mode: "python", label: "Python", code: PY_STARTER }, { mode: "js", label: "JavaScript", code: JS_STARTER }, { mode: "ts", label: "TypeScript", code: TS_STARTER }],
  sql: [{ mode: "sql", label: "SQL", code: SQL_STARTER, setup: SQL_SETUP }],
};
