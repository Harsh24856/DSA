import type { Subject } from "./types";

/** Sample schema used by every query on this page. check:other runs each query against it in SQLite. */
export const SETUP = `CREATE TABLE departments (id INT PRIMARY KEY, name TEXT);
CREATE TABLE employees (id INT PRIMARY KEY, name TEXT, dept_id INT, manager_id INT, salary INT, hired TEXT);
CREATE TABLE orders (id INT PRIMARY KEY, customer TEXT, amount INT, day TEXT);
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Support'), (4, 'Legal');
INSERT INTO employees VALUES
  (1, 'Asha', 1, NULL, 90000, '2019-03-01'), (2, 'Ben', 1, 1, 70000, '2020-06-15'),
  (3, 'Chen', 1, 1, 70000, '2021-01-10'), (4, 'Dia', 2, 1, 65000, '2020-02-20'),
  (5, 'Eli', 2, 4, 48000, '2022-08-01'), (6, 'Fay', 3, 1, 45000, '2021-11-30'),
  (7, 'Gus', NULL, 4, 40000, '2023-05-05');
INSERT INTO orders VALUES
  (1, 'ravi', 250, '2026-01-01'), (2, 'ravi', 100, '2026-01-02'), (3, 'meera', 400, '2026-01-02'),
  (4, 'ravi', 80, '2026-01-05'), (5, 'meera', 120, '2026-01-03'), (6, 'sam', 60, '2026-01-03');`;

export const SQL: Subject = {
  id: "sql",
  name: "SQL",
  short: "SQL",
  blurb: "How a query really executes, NULLs, joins, grouping, subqueries and CTEs, window functions, indexes and the patterns that come up again and again. Every query here runs on the sample tables below, and the results shown are checked.",
  chapters: [
    {
      id: "order",
      title: "Clauses and their real execution order",
      summary: "You write `SELECT` first, but the database reads `FROM` first. Knowing the logical order explains most beginner errors: why WHERE cannot use COUNT, and why ORDER BY can use a SELECT alias but WHERE cannot.",
      points: [
        "Logical order: FROM and JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT.",
        "Sample tables used on this page: `departments(id, name)`, `employees(id, name, dept_id, manager_id, salary, hired)`, `orders(id, customer, amount, day)`.",
      ],
      code: { sql: SETUP.split("\n").filter((l) => l.startsWith("CREATE")).join("\n"), file: "sample schema" },
      lab: "sqlorder",
      cards: [
        { id: "where-having", q: "WHERE vs HAVING?", a: "WHERE filters **rows** before grouping, so it cannot use aggregates. HAVING filters **groups** after GROUP BY, so it can. Put every condition that does not need an aggregate in WHERE: fewer rows reach the grouping step.",
          code: { sql: `SELECT dept_id, COUNT(*) AS n, ROUND(AVG(salary)) AS avg_pay
FROM employees
WHERE salary >= 45000          -- rows
GROUP BY dept_id
HAVING COUNT(*) >= 2           -- groups
ORDER BY avg_pay DESC;`, sqlSetup: SETUP, result: { head: ["dept_id", "n", "avg_pay"], rows: [["1", "3", "76667"], ["2", "2", "56500"]] } } },
        { id: "count-star", q: "COUNT(*) vs COUNT(column) vs COUNT(DISTINCT column)?", a: "`COUNT(*)` counts rows. `COUNT(col)` counts rows where col is not NULL. `COUNT(DISTINCT col)` counts different non-NULL values.",
          code: { sql: `SELECT COUNT(*) AS all_rows, COUNT(dept_id) AS with_dept, COUNT(DISTINCT dept_id) AS depts
FROM employees;`, sqlSetup: SETUP, result: { head: ["all_rows", "with_dept", "depts"], rows: [["7", "6", "3"]] } } },
        { id: "alias-where", q: "Why does `WHERE avg_pay > 50000` fail when avg_pay is a SELECT alias?", a: "WHERE runs before SELECT, so the alias does not exist yet. Repeat the expression, move the condition to HAVING (for aggregates), or wrap the query in a subquery or CTE and filter outside. ORDER BY runs after SELECT, so it can use the alias.",
          trap: "MySQL is lenient and allows aliases in HAVING and GROUP BY; PostgreSQL does not in HAVING. Write portable SQL in interviews." },
      ],
    },
    {
      id: "nulls",
      title: "Filtering and NULLs",
      summary: "NULL means \"unknown\", so comparisons with it are neither true nor false but unknown, and WHERE keeps only rows where the condition is true. This three-valued logic causes the most surprising bugs in SQL.",
      diagram: `flowchart LR
  A["salary > 50000"] --> B{"salary is NULL?"}
  B -->|"no"| C["TRUE or FALSE"]
  B -->|"yes"| D["UNKNOWN"]
  C --> W["WHERE keeps only TRUE rows"]
  D --> W`,
      caption: "Three-valued logic: UNKNOWN rows are dropped by WHERE just like FALSE ones.",
      points: [
        "Use `IS NULL` and `IS NOT NULL`, never `= NULL`.",
        "`COALESCE(a, b, c)` returns the first non-NULL argument: the standard way to supply defaults.",
        "Aggregates ignore NULLs (except COUNT(*)); AVG of 10, NULL, 20 is 15, not 10.",
      ],
      cards: [
        { id: "not-in-null", q: "Why can NOT IN return no rows at all?", a: "`x NOT IN (2, 3, NULL)` means `x <> 2 AND x <> 3 AND x <> NULL`. The last comparison is unknown, so the whole condition is never true. If a subquery used with NOT IN can return a NULL, you get zero rows. Use `NOT EXISTS`, or filter NULLs out of the subquery.",
          code: { sql: `SELECT
  (SELECT COUNT(*) FROM employees WHERE dept_id NOT IN (2, 3))       AS plain,
  (SELECT COUNT(*) FROM employees WHERE dept_id NOT IN (2, 3, NULL)) AS with_null,
  (SELECT COUNT(*) FROM employees WHERE dept_id IS NULL)             AS no_dept;`, sqlSetup: SETUP, result: { head: ["plain", "with_null", "no_dept"], rows: [["3", "0", "1"]] } },
          trap: "Gus has no department, so he is excluded even from the plain NOT IN: NULL NOT IN (2, 3) is unknown, not true." },
        { id: "like", q: "How do LIKE wildcards work, and which patterns can use an index?", a: "`%` matches any sequence of characters, `_` exactly one. `LIKE 'Ash%'` can use an index on the column because the prefix is fixed. `LIKE '%sha'` cannot, since it must check every row; full-text indexes or reversed-string columns are the usual fixes." },
        { id: "case", q: "How do you use CASE?", a: "CASE is SQL's if-else and works anywhere an expression is allowed: in SELECT to label rows, in ORDER BY for custom sort orders, inside aggregates for conditional counts.",
          code: { sql: `SELECT name,
       CASE WHEN salary >= 70000 THEN 'senior'
            WHEN salary >= 45000 THEN 'mid'
            ELSE 'junior' END AS band
FROM employees
ORDER BY id;`, sqlSetup: SETUP, result: { head: ["name", "band"], rows: [["Asha", "senior"], ["Ben", "senior"], ["Chen", "senior"], ["Dia", "mid"], ["Eli", "mid"], ["Fay", "mid"], ["Gus", "junior"]] } } },
      ],
    },
    {
      id: "joins",
      title: "Joins",
      summary: "A join combines rows from two tables where a condition matches. The join type decides what happens to rows that find no partner.",
      diagram: `flowchart LR
  subgraph I["INNER JOIN"]
    direction LR
    i1["only matching pairs"]
  end
  subgraph L["LEFT JOIN"]
    direction LR
    l1["every left row,<br/>NULLs where no match"]
  end
  subgraph F["FULL OUTER JOIN"]
    direction LR
    f1["every row from both,<br/>NULLs on the missing side"]
  end
  subgraph C["CROSS JOIN"]
    direction LR
    c1["every left row × every right row"]
  end`,
      caption: "Self join: a table joined to itself under two aliases. Anti join: LEFT JOIN ... WHERE right.id IS NULL, or NOT EXISTS.",
      cards: [
        { id: "left-count", q: "Count employees per department, including departments with none.", a: "Use a LEFT JOIN from departments so empty departments survive, and count a column from the right table, because COUNT(*) would count the NULL row as 1.",
          code: { sql: `SELECT d.name, COUNT(e.id) AS staff
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id
GROUP BY d.id, d.name
ORDER BY d.id;`, sqlSetup: SETUP, result: { head: ["name", "staff"], rows: [["Engineering", "3"], ["Sales", "2"], ["Support", "1"], ["Legal", "0"]] } } },
        { id: "on-vs-where", q: "In a LEFT JOIN, what changes if a filter moves from ON to WHERE?", a: "A filter in **ON** decides which right rows match; left rows without a match still appear with NULLs. The same filter in **WHERE** runs after the join and removes those NULL rows, silently turning the LEFT JOIN into an INNER JOIN.",
          code: { sql: `SELECT d.name, e.name AS senior
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id AND e.salary >= 70000   -- try moving this to WHERE
ORDER BY d.id, e.name;`, sqlSetup: SETUP, result: { head: ["name", "senior"], rows: [["Engineering", "Asha"], ["Engineering", "Ben"], ["Engineering", "Chen"], ["Sales", "NULL"], ["Support", "NULL"], ["Legal", "NULL"]] } } },
        { id: "self-join", q: "List every employee with their manager's name.", a: "A self join: the same table under two aliases. LEFT JOIN keeps the person with no manager.",
          code: { sql: `SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
ORDER BY e.id;`, sqlSetup: SETUP, result: { head: ["employee", "manager"], rows: [["Asha", "NULL"], ["Ben", "Asha"], ["Chen", "Asha"], ["Dia", "Asha"], ["Eli", "Dia"], ["Fay", "Asha"], ["Gus", "Dia"]] } } },
        { id: "anti", q: "Find departments with no employees.", a: "An anti join. NOT EXISTS stops at the first match and handles NULLs correctly, so it is the safest form.",
          code: { sql: `SELECT d.name
FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.id);`, sqlSetup: SETUP, result: { head: ["name"], rows: [["Legal"]] } } },
        { id: "join-dupes", q: "Why did my join return more rows than the table had?", a: "Joins multiply: each left row appears once for every matching right row. Joining orders to a table with two rows per customer doubles the orders, and any SUM after that is wrong. Check the grain of each table, and aggregate before joining when one side has many rows per key." },
      ],
    },
    {
      id: "grouping",
      title: "Aggregation and GROUP BY",
      summary: "GROUP BY collapses rows that share values into one row per group; aggregates (COUNT, SUM, AVG, MIN, MAX) summarise each group. Every selected column must be grouped or aggregated.",
      diagram: `flowchart TB
  R["7 employee rows"] --> G["GROUP BY dept_id"]:::hot
  G --> G1["dept 1: 3 rows, dept 2: 2 rows"]
  G --> G2["dept 3: 1 row, NULL dept: 1 row"]
  G1 --> O["one output row per group: COUNT, SUM, AVG"]:::ok
  G2 --> O`,
      caption: "GROUP BY collapses rows; NULL keys form their own group.",
      cards: [
        { id: "conditional-agg", q: "Count several conditions in one pass over the table.", a: "Put CASE inside SUM (or COUNT). This is conditional aggregation, the standard way to pivot rows into columns.",
          code: { sql: `SELECT customer,
       COUNT(*) AS orders,
       SUM(amount) AS total,
       SUM(CASE WHEN amount >= 100 THEN 1 ELSE 0 END) AS big_orders
FROM orders
GROUP BY customer
ORDER BY total DESC;`, sqlSetup: SETUP, result: { head: ["customer", "orders", "total", "big_orders"], rows: [["meera", "2", "520", "2"], ["ravi", "3", "430", "2"], ["sam", "1", "60", "0"]] } } },
        { id: "group-nonagg", q: "Why is `SELECT dept_id, name, MAX(salary) FROM employees GROUP BY dept_id` wrong?", a: "`name` is neither grouped nor aggregated, so there is no single value for it per group. Standard SQL rejects it; MySQL (without ONLY_FULL_GROUP_BY) and SQLite pick an arbitrary row's name, which is not necessarily the one with the max salary. Use a window function or a join back to the max per group instead." },
        { id: "distinct-groupby", q: "DISTINCT vs GROUP BY?", a: "For removing duplicates they give the same result and often the same plan. Use GROUP BY when you also need aggregates per group, and DISTINCT when you just want unique rows. `COUNT(DISTINCT x)` counts unique values inside an aggregate." },
      ],
    },
    {
      id: "subqueries",
      title: "Subqueries and CTEs",
      summary: "A subquery is a query inside another. A **correlated** subquery refers to the outer row and conceptually runs once per row. A **CTE** (`WITH name AS (...)`) names a subquery so complex queries read top to bottom, and a recursive CTE walks hierarchies.",
      diagram: `flowchart LR
  B["WITH base AS (...)"] --> F["filtered: SELECT from base"]
  F --> R["ranked: RANK() OVER, from filtered"]
  R --> Q["final SELECT from ranked"]`,
      caption: "A CTE chain reads top to bottom like small named steps.",
      cards: [
        { id: "second-highest", q: "Find the second highest salary.", a: "Take the max of everything below the max. It returns NULL when there is no second value, which is usually what the question wants. The window-function version (DENSE_RANK = 2) generalises to the Nth.",
          code: { sql: `SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);`, sqlSetup: SETUP, result: { head: ["second_highest"], rows: [["70000"]] } },
          trap: "`ORDER BY salary DESC LIMIT 1 OFFSET 1` returns 70000 here only by luck: with ties at the top (two people on 90000) it returns the top salary again. Use DISTINCT or DENSE_RANK." },
        { id: "correlated", q: "Find employees who earn more than their department's average.", a: "A correlated subquery computes the average for the outer row's department. Gus has no department, so his comparison is with NULL and he drops out.",
          code: { sql: `SELECT e.name, e.salary
FROM employees e
WHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.dept_id = e.dept_id)
ORDER BY e.salary DESC;`, sqlSetup: SETUP, result: { head: ["name", "salary"], rows: [["Asha", "90000"], ["Dia", "65000"]] } } },
        { id: "recursive", q: "Show the reporting chain: each person and how many levels below the top they are.", a: "A recursive CTE has an anchor (the top of the tree) and a recursive part that joins the next level to the rows found so far, until no new rows appear.",
          code: { sql: `WITH RECURSIVE chain(id, name, depth) AS (
  SELECT id, name, 0 FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, c.depth + 1
  FROM employees e JOIN chain c ON e.manager_id = c.id
)
SELECT name, depth FROM chain ORDER BY depth, name;`, sqlSetup: SETUP, result: { head: ["name", "depth"], rows: [["Asha", "0"], ["Ben", "1"], ["Chen", "1"], ["Dia", "1"], ["Fay", "1"], ["Eli", "2"], ["Gus", "2"]] } } },
        { id: "exists-in", q: "EXISTS vs IN?", a: "`IN (subquery)` compares against the list of values; `EXISTS` asks whether at least one matching row exists and can stop at the first. Modern optimisers often produce the same plan, but EXISTS is safe with NULLs and NOT IN is not, so prefer NOT EXISTS for anti joins." },
      ],
    },
    {
      id: "windows",
      title: "Window functions",
      summary: "A window function computes a value for each row from a set of related rows (its window) without collapsing them like GROUP BY does. `PARTITION BY` splits rows into groups, `ORDER BY` orders them inside each group.",
      diagram: `flowchart TB
  subgraph P1["dept 1, by salary DESC"]
    direction LR
    a["Asha 90000: 1"] --> b["Ben 70000: 2"] --> c["Chen 70000: 2"]
  end
  subgraph P2["dept 2: numbering restarts"]
    direction LR
    d["Dia 65000: 1"]:::hot --> e["Eli 48000: 2"]
  end
  P1 ~~~ P2`,
      caption: "Window functions rank rows inside each partition but keep every row (DENSE_RANK shown).",
      table: { head: ["Function", "Ties at the same value", "Example for salaries 90, 70, 70, 65"], rows: [
        ["ROW_NUMBER()", "different numbers (arbitrary unless you add a tie-break)", "1, 2, 3, 4"],
        ["RANK()", "same rank, then a gap", "1, 2, 2, 4"],
        ["DENSE_RANK()", "same rank, no gap", "1, 2, 2, 3"],
      ] },
      cards: [
        { id: "ranks", q: "Show ROW_NUMBER, RANK and DENSE_RANK side by side.", a: "Ben and Chen tie on 70000. RANK leaves a gap after them; DENSE_RANK does not. ROW_NUMBER needs a tie-break (here the name) to be deterministic.",
          code: { sql: `SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC, name) AS row_num,
       RANK()       OVER (ORDER BY salary DESC)       AS rnk,
       DENSE_RANK() OVER (ORDER BY salary DESC)       AS dense
FROM employees
ORDER BY salary DESC, name;`, sqlSetup: SETUP, result: { head: ["name", "salary", "row_num", "rnk", "dense"], rows: [["Asha", "90000", "1", "1", "1"], ["Ben", "70000", "2", "2", "2"], ["Chen", "70000", "3", "2", "2"], ["Dia", "65000", "4", "4", "3"], ["Eli", "48000", "5", "5", "4"], ["Fay", "45000", "6", "6", "5"], ["Gus", "40000", "7", "7", "6"]] } } },
        { id: "top-per-group", q: "Find the highest-paid employee in each department.", a: "Rank inside each department with PARTITION BY, then keep rank 1 in an outer query (a window result cannot be filtered in the same query's WHERE). DENSE_RANK keeps everyone tied for first.",
          code: { sql: `SELECT dept_id, name, salary FROM (
  SELECT dept_id, name, salary,
         DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS r
  FROM employees
  WHERE dept_id IS NOT NULL
) t
WHERE r = 1
ORDER BY dept_id;`, sqlSetup: SETUP, result: { head: ["dept_id", "name", "salary"], rows: [["1", "Asha", "90000"], ["2", "Dia", "65000"], ["3", "Fay", "45000"]] } } },
        { id: "running", q: "Running total and change from the previous row.", a: "`SUM() OVER (ORDER BY ...)` accumulates; `LAG(col)` reads the previous row's value (NULL for the first). LEAD reads the next one.",
          code: { sql: `SELECT day, amount,
       SUM(amount) OVER (ORDER BY day, id)             AS running_total,
       amount - LAG(amount) OVER (ORDER BY day, id)    AS change
FROM orders
ORDER BY day, id;`, sqlSetup: SETUP, result: { head: ["day", "amount", "running_total", "change"], rows: [["2026-01-01", "250", "250", "NULL"], ["2026-01-02", "100", "350", "-150"], ["2026-01-02", "400", "750", "300"], ["2026-01-03", "120", "870", "-280"], ["2026-01-03", "60", "930", "-60"], ["2026-01-05", "80", "1010", "20"]] } },
          trap: "With ORDER BY and no frame, the default frame is RANGE UNBOUNDED PRECEDING to CURRENT ROW, so rows with equal sort keys get the same running total. Add a unique tie-break (here id) or say ROWS BETWEEN explicitly." },
      ],
    },
    {
      id: "patterns",
      title: "Patterns interviewers reuse",
      summary: "A handful of shapes cover most interview questions: Nth highest, top-N per group, running totals, gaps and islands (consecutive streaks), duplicates, and set comparisons.",
      diagram: `flowchart TB
  subgraph R1[" "]
    direction LR
    Q1(["Nth highest value?"]) --> A1["DENSE_RANK() OVER (ORDER BY x DESC) = N"]:::ok
  end
  subgraph R2[" "]
    direction LR
    Q2(["Top N in each group?"]) --> A2["ROW_NUMBER() OVER (PARTITION BY g ORDER BY x DESC), keep 1 to N"]:::ok
  end
  subgraph R3[" "]
    direction LR
    Q3(["Running total?"]) --> A3["SUM(x) OVER (ORDER BY day)"]:::ok
  end
  subgraph R4[" "]
    direction LR
    Q4(["Consecutive streak?"]) --> A4["day minus ROW_NUMBER() is constant within a streak"]:::ok
  end
  subgraph R5[" "]
    direction LR
    Q5(["Duplicates?"]) --> A5["GROUP BY key HAVING COUNT(*) more than 1"]:::ok
  end
  subgraph R6[" "]
    direction LR
    Q6(["In A but not in B?"]) --> A6["LEFT JOIN, WHERE b.key IS NULL"]:::ok
  end
  R1 -->|"no"| R2
  R2 -->|"no"| R3
  R3 -->|"no"| R4
  R4 -->|"no"| R5
  R5 -->|"no"| R6`,
      caption: "Walk down the questions; the first yes names the pattern to write.",
      cards: [
        { id: "islands", q: "Find streaks of consecutive order days per customer (gaps and islands).", a: "Within a streak, the date minus the row number is constant, so that difference labels each island. Group by it and keep islands of two or more days.",
          code: { sql: `WITH d AS (
  SELECT DISTINCT customer, day FROM orders
), g AS (
  SELECT customer, day,
         julianday(day) - ROW_NUMBER() OVER (PARTITION BY customer ORDER BY day) AS grp
  FROM d
)
SELECT customer, MIN(day) AS start_day, MAX(day) AS end_day, COUNT(*) AS days
FROM g
GROUP BY customer, grp
HAVING COUNT(*) >= 2
ORDER BY customer;`, sqlSetup: SETUP, result: { head: ["customer", "start_day", "end_day", "days"], rows: [["meera", "2026-01-02", "2026-01-03", "2"], ["ravi", "2026-01-01", "2026-01-02", "2"]] } },
          trap: "`julianday` is SQLite. In MySQL use `DATE_SUB(day, INTERVAL rn DAY)`; in PostgreSQL `day - rn * INTERVAL '1 day'`." },
        { id: "dedupe", q: "Delete duplicate emails, keeping the row with the lowest id.", a: "Keep the minimum id per email and delete the rest.",
          code: { sql: `DELETE FROM person
WHERE id NOT IN (SELECT MIN(id) FROM person GROUP BY email);
SELECT id, email FROM person ORDER BY id;`, sqlSetup: "CREATE TABLE person (id INT, email TEXT);\nINSERT INTO person VALUES (1, 'a@x.com'), (2, 'b@x.com'), (3, 'a@x.com'), (4, 'c@x.com'), (5, 'b@x.com');", result: { head: ["id", "email"], rows: [["1", "a@x.com"], ["2", "b@x.com"], ["4", "c@x.com"]] } },
          trap: "MySQL refuses to delete from a table referenced in the same statement's subquery; wrap it as `SELECT * FROM (SELECT MIN(id) ...) t` or use a self join DELETE." },
        { id: "union", q: "UNION vs UNION ALL?", a: "UNION removes duplicate rows, which costs a sort or hash; UNION ALL keeps everything and is faster. Use UNION ALL unless you need deduplication. Both need the same number of columns with compatible types.",
          code: { sql: `SELECT customer FROM orders WHERE amount >= 200
UNION
SELECT customer FROM orders WHERE day = '2026-01-03'
ORDER BY customer;`, sqlSetup: SETUP, result: { head: ["customer"], rows: [["meera"], ["ravi"], ["sam"]] } } },
      ],
    },
    {
      id: "ddl",
      title: "DDL, DML, transactions and performance",
      summary: "SQL has sub-languages: **DDL** defines structure (CREATE, ALTER, DROP), **DML** changes data (INSERT, UPDATE, DELETE), **DCL** controls access (GRANT, REVOKE), **TCL** controls transactions (COMMIT, ROLLBACK, SAVEPOINT).",
      diagram: `flowchart TB
  subgraph R1[" "]
    direction LR
    Q1(["DDL: structure"]):::hot --> A1["CREATE, ALTER, DROP"]:::ok
  end
  subgraph R2[" "]
    direction LR
    Q2(["DML: data"]):::hot --> A2["INSERT, UPDATE, DELETE, SELECT"]:::ok
  end
  subgraph R3[" "]
    direction LR
    Q3(["DCL: access"]):::hot --> A3["GRANT, REVOKE"]:::ok
  end
  subgraph R4[" "]
    direction LR
    Q4(["TCL: transactions"]):::hot --> A4["COMMIT, ROLLBACK, SAVEPOINT"]:::ok
  end
  R1 ~~~ R2
  R2 ~~~ R3
  R3 ~~~ R4`,
      caption: "The four sub-languages.",
      table: { head: ["", "DELETE", "TRUNCATE", "DROP"], rows: [
        ["Removes", "chosen rows (WHERE)", "all rows", "the whole table"],
        ["Can roll back", "yes", "depends on the database", "depends on the database"],
        ["Fires row triggers", "yes", "no", "no"],
        ["Speed", "slow on many rows", "fast", "fast"],
      ] },
      cards: [
        { id: "explain", q: "A query is slow. What do you check first?", a: "Read the plan with `EXPLAIN` (or `EXPLAIN ANALYZE`). Look for full table scans on big tables, joins without an index on the join column, sorts that spill to disk, and row estimates far from reality (stale statistics). Then add or fix indexes, make predicates sargable, and select only the columns you need." },
        { id: "sargable", q: "What makes a predicate sargable?", a: "Sargable means the database can use an index to search for it. `WHERE hired >= '2021-01-01'` is sargable; `WHERE YEAR(hired) = 2021` is not, because the function hides the column. Rewrite as a range, or index the expression." },
        { id: "covering", q: "What is a covering index?", a: "An index that contains every column a query needs, so the database answers from the index alone without visiting the table (an index-only scan). For `SELECT name FROM employees WHERE dept_id = 1`, an index on (dept_id, name) covers it." },
        { id: "view-mview", q: "View vs materialized view?", a: "A view is a saved query that runs every time you use it: always fresh, no storage. A materialized view stores the result and must be refreshed: fast reads, possibly stale. Use materialized views for expensive reports that tolerate some delay." },
      ],
    },
  ],
};
