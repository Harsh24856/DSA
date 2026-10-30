// Fixed example data for the SQL-order and normalization labs, shared with other.check.ts so the lab and
// the check use exactly the same rows.

export const EMP_COLS = ["id", "name", "dept_id", "salary"];
export const EMPLOYEES: [number, string, number, number][] = [
  [1, "Asha", 1, 52000], [2, "Ben", 2, 38000], [3, "Chen", 1, 61000], [4, "Dia", 3, 45000],
  [5, "Eli", 2, 47000], [6, "Fay", 1, 39000], [7, "Gus", 2, 58000], [8, "Hana", 3, 41000],
];
export const DEPARTMENTS: [number, string][] = [[1, "Engineering"], [2, "Sales"], [3, "Support"], [4, "Legal"]];

export const ORDER_SQL = `SELECT d.name AS dept, COUNT(*) AS n, AVG(e.salary) AS avg_pay
FROM employees e
JOIN departments d ON e.dept_id = d.id
WHERE e.salary > 40000
GROUP BY d.name
HAVING COUNT(*) >= 2
ORDER BY avg_pay DESC
LIMIT 2;`;

export const ORDER_SETUP = `CREATE TABLE employees (id INT, name TEXT, dept_id INT, salary INT);
CREATE TABLE departments (id INT, name TEXT);
INSERT INTO employees VALUES ${EMPLOYEES.map((e) => `(${e[0]}, '${e[1]}', ${e[2]}, ${e[3]})`).join(", ")};
INSERT INTO departments VALUES ${DEPARTMENTS.map((d) => `(${d[0]}, '${d[1]}')`).join(", ")};`;

export type Grid = { head: string[]; rows: (string | number)[][]; note: string; clause: string };

/** The query above, evaluated clause by clause in the order a database logically applies them. */
export function orderSteps(): Grid[] {
  const joined = EMPLOYEES.flatMap((e) => DEPARTMENTS.filter((d) => d[0] === e[2]).map((d) => [e[0], e[1], e[3], d[1]] as [number, string, number, string]));
  const head = ["e.id", "e.name", "e.salary", "d.name"];
  const filtered = joined.filter((r) => r[2] > 40000);
  const groups = new Map<string, number[]>();
  for (const r of filtered) groups.set(r[3], [...(groups.get(r[3]) ?? []), r[2]]);
  const grouped = [...groups].map(([k, v]) => [k, v.join(", ")]);
  const having = [...groups].filter(([, v]) => v.length >= 2);
  const selected = having.map(([k, v]) => [k, v.length, v.reduce((a, b) => a + b, 0) / v.length]);
  const ordered = [...selected].sort((a, b) => (b[2] as number) - (a[2] as number));
  return [
    { clause: "FROM / JOIN", head, rows: joined, note: `Join every employee to their department: ${joined.length} rows. Legal has no employees, so the inner join drops it.` },
    { clause: "WHERE", head, rows: filtered, note: `Keep rows with salary > 40000: ${filtered.length} left. WHERE runs before grouping, so it cannot use COUNT or AVG.` },
    { clause: "GROUP BY", head: ["d.name", "salaries in the group"], rows: grouped, note: `Collapse rows into ${grouped.length} groups, one per department.` },
    { clause: "HAVING", head: ["d.name", "salaries in the group"], rows: having.map(([k, v]) => [k, v.join(", ")]), note: "Filter groups with an aggregate: keep groups with at least 2 rows." },
    { clause: "SELECT", head: ["dept", "n", "avg_pay"], rows: selected, note: "Compute the output columns and their aliases. The alias avg_pay exists only from here on." },
    { clause: "ORDER BY", head: ["dept", "n", "avg_pay"], rows: ordered, note: "Sort by avg_pay, highest first. ORDER BY may use SELECT aliases because it runs after SELECT." },
    { clause: "LIMIT", head: ["dept", "n", "avg_pay"], rows: ordered.slice(0, 2), note: "Return only the first 2 rows." },
  ];
}

/* ---------- normalization walk-through ---------- */
export const NF_ATTRS = ["StudentId", "StudentName", "CourseId", "CourseName", "Instructor", "InstructorPhone", "Grade"];
export const NF_FDS: [string[], string[]][] = [
  [["StudentId"], ["StudentName"]],
  [["CourseId"], ["CourseName", "Instructor"]],
  [["Instructor"], ["InstructorPhone"]],
  [["StudentId", "CourseId"], ["Grade"]],
];
export type NfTable = { name: string; key: string[]; cols: string[]; rows: string[][] };
export type NfStage = { name: string; why: string; tables: NfTable[] };

const ROWS = [
  ["S1", "Asha", "C1", "DBMS", "Rao", "98100", "A"],
  ["S1", "Asha", "C2", "OS", "Iyer", "98200", "B"],
  ["S2", "Ben", "C1", "DBMS", "Rao", "98100", "B"],
];
const proj = (cols: string[]) => {
  const idx = cols.map((c) => NF_ATTRS.indexOf(c));
  const seen = new Set<string>();
  return ROWS.map((r) => idx.map((i) => r[i])).filter((r) => { const k = r.join("|"); if (seen.has(k)) return false; seen.add(k); return true; });
};
const t = (name: string, key: string[], cols: string[]): NfTable => ({ name, key, cols, rows: proj(cols) });

export const NF_STAGES: NfStage[] = [
  { name: "Unnormalized", why: "Courses are packed into one cell: you cannot query or index a single course, and updates mean string editing.",
    tables: [{ name: "Enrollment", key: ["StudentId"], cols: ["StudentId", "StudentName", "Courses"], rows: [["S1", "Asha", "C1 DBMS (Rao, 98100) A; C2 OS (Iyer, 98200) B"], ["S2", "Ben", "C1 DBMS (Rao, 98100) B"]] }] },
  { name: "1NF", why: "Atomic values, one row per student-course. Key is (StudentId, CourseId). But StudentName depends on StudentId alone: a partial dependency, so Asha's name is stored twice.",
    tables: [t("Enrollment", ["StudentId", "CourseId"], NF_ATTRS)] },
  { name: "2NF", why: "Every non-key column now depends on the whole key. Still, InstructorPhone depends on Instructor, which depends on CourseId: a transitive dependency.",
    tables: [t("Student", ["StudentId"], ["StudentId", "StudentName"]), t("Course", ["CourseId"], ["CourseId", "CourseName", "Instructor", "InstructorPhone"]), t("Enrollment", ["StudentId", "CourseId"], ["StudentId", "CourseId", "Grade"])] },
  { name: "3NF", why: "Every non-key column depends on the key, the whole key, and nothing but the key. Each fact lives in exactly one place.",
    tables: [t("Student", ["StudentId"], ["StudentId", "StudentName"]), t("Course", ["CourseId"], ["CourseId", "CourseName", "Instructor"]), t("Instructor", ["Instructor"], ["Instructor", "InstructorPhone"]), t("Enrollment", ["StudentId", "CourseId"], ["StudentId", "CourseId", "Grade"])] },
];

/* ---------- JavaScript event loop ---------- */
export type LoopFrame = { line: number | null; stack: string[]; micro: string[]; macro: string[]; out: string[]; note: string };
export type LoopScenario = { name: string; code: string; frames: LoopFrame[] };

export const LOOP_SCENARIOS: LoopScenario[] = [
  {
    name: "Timers vs promises",
    code: `console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
queueMicrotask(() => console.log("D"));
console.log("E");`,
    frames: [
      { line: 0, stack: ["main script", "console.log(\"A\")"], micro: [], macro: [], out: ["A"], note: "Synchronous code runs first, top to bottom, on the call stack." },
      { line: 1, stack: ["main script", "setTimeout"], micro: [], macro: ["log B (timer, 0 ms)"], out: ["A"], note: "setTimeout hands the callback to the timer system. Even with 0 ms it waits in the macrotask (task) queue." },
      { line: 2, stack: ["main script", "Promise.then"], micro: ["log C"], macro: ["log B (timer, 0 ms)"], out: ["A"], note: "A resolved promise's .then callback goes to the microtask queue." },
      { line: 3, stack: ["main script", "queueMicrotask"], micro: ["log C", "log D"], macro: ["log B (timer, 0 ms)"], out: ["A"], note: "queueMicrotask adds directly to the microtask queue, behind C." },
      { line: 4, stack: ["main script", "console.log(\"E\")"], micro: ["log C", "log D"], macro: ["log B (timer, 0 ms)"], out: ["A", "E"], note: "Still synchronous: E prints before any callback." },
      { line: null, stack: ["log C"], micro: ["log D"], macro: ["log B (timer, 0 ms)"], out: ["A", "E", "C"], note: "The stack is empty, so the loop drains the WHOLE microtask queue first." },
      { line: null, stack: ["log D"], micro: [], macro: ["log B (timer, 0 ms)"], out: ["A", "E", "C", "D"], note: "Microtasks keep running until the queue is empty." },
      { line: null, stack: ["log B"], micro: [], macro: [], out: ["A", "E", "C", "D", "B"], note: "Only now does the loop take one macrotask: the timer callback. Order: A E C D B." },
    ],
  },
  {
    name: "async / await",
    code: `async function f() {
  console.log("1");
  await null;
  console.log("3");
}
console.log("0");
f();
setTimeout(() => console.log("5"));
Promise.resolve().then(() => console.log("4"));
console.log("2");`,
    frames: [
      { line: 5, stack: ["main script"], micro: [], macro: [], out: ["0"], note: "Function declarations do nothing yet; the first log prints 0." },
      { line: 1, stack: ["main script", "f()"], micro: [], macro: [], out: ["0", "1"], note: "Calling an async function runs its body synchronously up to the first await." },
      { line: 2, stack: ["main script", "f()"], micro: ["rest of f (log 3)"], macro: [], out: ["0", "1"], note: "await pauses f and queues the rest of f as a microtask; control returns to the caller." },
      { line: 7, stack: ["main script", "setTimeout"], micro: ["rest of f (log 3)"], macro: ["log 5"], out: ["0", "1"], note: "The timer callback waits in the macrotask queue." },
      { line: 8, stack: ["main script", "Promise.then"], micro: ["rest of f (log 3)", "log 4"], macro: ["log 5"], out: ["0", "1"], note: "The .then callback queues behind the rest of f." },
      { line: 9, stack: ["main script"], micro: ["rest of f (log 3)", "log 4"], macro: ["log 5"], out: ["0", "1", "2"], note: "Last synchronous line." },
      { line: 3, stack: ["rest of f"], micro: ["log 4"], macro: ["log 5"], out: ["0", "1", "2", "3"], note: "Microtasks first: f resumes after its await." },
      { line: null, stack: ["log 4"], micro: [], macro: ["log 5"], out: ["0", "1", "2", "3", "4"], note: "Then the .then callback." },
      { line: null, stack: ["log 5"], micro: [], macro: [], out: ["0", "1", "2", "3", "4", "5"], note: "Finally the timer. Order: 0 1 2 3 4 5." },
    ],
  },
];
