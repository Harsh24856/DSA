import type { OaCode, OaSubject } from "../types.ts";
import { concept, output } from "./make.ts";

const EMP = `CREATE TABLE emp (id INT, name TEXT, dept TEXT, pay INT);
INSERT INTO emp VALUES
  (1,'Asha','Eng',90),
  (2,'Ben','Eng',70),
  (3,'Chen','Ops',50),
  (4,'Dia','Ops',NULL),
  (5,'Eli',NULL,40);`;
const DEPT = `${EMP}
CREATE TABLE dept (name TEXT, city TEXT);
INSERT INTO dept VALUES ('Eng','Pune'), ('Sales','Goa');`;
const SCORES = `CREATE TABLE scores (name TEXT, s INT);
INSERT INTO scores VALUES ('A',90), ('B',90), ('C',80), ('D',70);`;
const emp = (src: string): OaCode => ({ lang: "sql", setup: EMP, src });
const q = "What does this query return? Rows are separated by a semicolon.";

export const OA_SQL: OaSubject = {
  id: "sql", name: "SQL",
  questions: [
    output("counts", q, emp("SELECT COUNT(*), COUNT(pay), COUNT(dept) FROM emp;"), "5, 4, 4", ["5, 5, 5", "4, 4, 4", "5, 4, 5"], "`COUNT(*)` counts rows. `COUNT(col)` skips NULL."),
    output("avg", q, emp("SELECT AVG(pay) FROM emp;"), "62.5", ["50", "62", "70"], "AVG skips NULL, so it divides 250 by 4, not by 5."),
    output("distinct", q, emp("SELECT COUNT(DISTINCT dept) FROM emp;"), "2", ["3", "4", "5"], "NULL is not counted, so only Eng and Ops remain."),
    output("and", q, emp("SELECT name FROM emp WHERE pay > 40 AND dept = 'Ops';"), "Chen", ["Chen; Dia", "Dia", "Chen; Eli"], "Dia's pay is NULL, so `pay > 40` is unknown and her row is dropped."),
    output("not-equal", q, emp("SELECT COUNT(*) FROM emp WHERE pay <> 50;"), "3", ["4", "2", "5"], "Comparing NULL gives unknown, so Dia is excluded along with Chen."),
    output("not-in-null", q, emp("SELECT name FROM emp WHERE dept NOT IN ('Eng', NULL);"), "no rows", ["Chen; Dia", "Chen; Dia; Eli", "Eli"], "`x <> NULL` is unknown for every row, so `NOT IN` with a NULL in the list never returns true."),
    output("eq-null", q, emp("SELECT name FROM emp WHERE dept = NULL;"), "no rows", ["Eli", "Asha; Ben; Chen; Dia", "Asha; Ben; Chen; Dia; Eli"], "Use `IS NULL`. `= NULL` is never true."),
    output("is-null", q, emp("SELECT name FROM emp WHERE dept IS NULL;"), "Eli", ["no rows", "Dia", "Dia; Eli"], "`IS NULL` is the correct test. Dia has a department, only her pay is NULL."),
    output("second", q, emp("SELECT MAX(pay) FROM emp WHERE pay < (SELECT MAX(pay) FROM emp);"), "70", ["90", "50", "40"], "The inner query finds 90, then the outer one finds the largest pay below it."),
    output("offset", q, emp("SELECT name FROM emp WHERE pay IS NOT NULL ORDER BY pay DESC LIMIT 1 OFFSET 1;"), "Ben", ["Asha", "Chen", "Eli"], "OFFSET 1 skips the top row, and LIMIT 1 keeps the next one."),
    output("having", q, emp("SELECT dept FROM emp GROUP BY dept HAVING COUNT(*) > 1 ORDER BY dept;"), "Eng; Ops", ["Eng", "Ops", "NULL; Eng; Ops"], "NULLs form one group, but that group has only one row."),
    output("coalesce", q, emp("SELECT SUM(COALESCE(pay, 10)) FROM emp;"), "260", ["250", "NULL", "300"], "Dia's NULL becomes 10, so the sum is 250 + 10."),
    output("case", q, emp("SELECT SUM(CASE WHEN pay >= 70 THEN 1 ELSE 0 END) FROM emp;"), "2", ["3", "4", "5"], "Dia's condition is unknown, so she takes the ELSE branch."),
    output("like", q, emp("SELECT name FROM emp WHERE name LIKE '_e%';"), "Ben", ["Ben; Chen", "Eli", "Chen"], "`_` is exactly one character. Chen has h as its second letter."),
    output("union", q, emp("SELECT COUNT(*) FROM (SELECT dept FROM emp UNION SELECT dept FROM emp);"), "3", ["2", "5", "10"], "UNION removes duplicates and treats NULLs as equal, leaving Eng, Ops and NULL."),
    output("union-all", q, emp("SELECT COUNT(*) FROM (SELECT dept FROM emp UNION ALL SELECT dept FROM emp);"), "10", ["3", "5", "2"], "UNION ALL keeps every row, from both sides."),
    output("left-count", q, { lang: "sql", setup: DEPT, src: "SELECT d.name, COUNT(e.id) FROM dept d LEFT JOIN emp e ON e.dept = d.name GROUP BY d.name ORDER BY d.name;" }, "Eng, 2; Sales, 0", ["Eng, 2; Sales, 1", "Eng, 2", "Eng, 3; Sales, 0"], "Sales has one row with a NULL `e.id`. `COUNT(e.id)` gives 0, but `COUNT(*)` would give 1."),
    output("left-rows", q, { lang: "sql", setup: DEPT, src: "SELECT COUNT(*) FROM emp e LEFT JOIN dept d ON e.dept = d.name;" }, "5", ["2", "3", "10"], "A left join keeps every row of the left table. Each employee matches at most one department here."),
    output("inner-rows", q, { lang: "sql", setup: DEPT, src: "SELECT COUNT(*) FROM emp e JOIN dept d ON e.dept = d.name;" }, "2", ["5", "3", "10"], "Only Asha and Ben match a department."),
    output("rank", q, { lang: "sql", setup: SCORES, src: "SELECT name FROM (SELECT name, RANK() OVER (ORDER BY s DESC) r FROM scores) WHERE r = 3;" }, "C", ["D", "A; B", "no rows"], "A and B tie at rank 1. RANK leaves a gap, so C is rank 3."),
    output("dense", q, { lang: "sql", setup: SCORES, src: "SELECT name FROM (SELECT name, DENSE_RANK() OVER (ORDER BY s DESC) r FROM scores) WHERE r = 3;" }, "D", ["C", "A; B", "no rows"], "DENSE_RANK leaves no gap, so C is rank 2 and D is rank 3."),
    concept("order", "In logical execution order, which clause runs first?", "FROM", ["SELECT", "WHERE", "ORDER BY"], "The order is FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT."),
    concept("alias", "Where can a column alias from the SELECT list always be used?", "ORDER BY", ["WHERE", "GROUP BY", "HAVING"], "ORDER BY runs after SELECT. The standard does not allow the alias in the others, though some engines permit it."),
    concept("where-having", "How does HAVING differ from WHERE?", "HAVING filters groups after aggregation", ["HAVING runs before GROUP BY", "WHERE can use aggregates", "HAVING works only with joins"], "WHERE filters rows before grouping, so it cannot use `COUNT` or `SUM`."),
    concept("truncate", "How does TRUNCATE usually differ from DELETE?", "It removes all rows quickly and takes no WHERE clause", ["It removes the table itself", "It removes only some rows", "It fires a row trigger for each row"], "TRUNCATE is usually classed as DDL and is logged minimally. DROP removes the table."),
    concept("unique", "How does a UNIQUE constraint differ from a PRIMARY KEY?", "UNIQUE columns can usually hold NULL", ["UNIQUE allows duplicate values", "A table can have only one UNIQUE constraint", "A PRIMARY KEY can hold NULL"], "A table has one primary key, with no NULLs, but can have many UNIQUE constraints."),
    concept("correlated", "What makes a subquery correlated?", "It refers to a column of the outer query", ["It uses GROUP BY", "It returns one row", "It appears in the FROM clause"], "Logically, it runs again for each outer row."),
    concept("except", "Which operator returns rows in the first query that are not in the second?", "EXCEPT", ["UNION", "INTERSECT", "CROSS JOIN"], "Oracle has traditionally called it MINUS."),
    concept("index-cost", "What is the main cost of adding an index?", "Slower writes and extra storage", ["Slower reads", "Loss of the primary key", "More rows in the table"], "Every insert, update or delete on the column must also update the index."),
    concept("partition", "How does `SUM(x) OVER (PARTITION BY y)` differ from `GROUP BY y`?", "It keeps every row instead of collapsing each group", ["It runs before WHERE", "It ignores the value of y", "It works only on sorted tables"], "Window functions add a value to each row. Grouping returns one row per group."),
    concept("lag", "Which window function reads the value from the previous row?", "LAG", ["LEAD", "NTILE", "RANK"], "LEAD reads the next row. Both are common for day-over-day differences."),
    concept("cascade", "What does `ON DELETE CASCADE` on a foreign key do?", "Deleting a parent row also deletes its child rows", ["Deleting a child row also deletes its parent", "It blocks every delete", "It sets child rows to NULL"], "`ON DELETE SET NULL` is the option that sets them to NULL."),
    concept("rollback", "Which command undoes changes since the last commit?", "ROLLBACK", ["COMMIT", "REVOKE", "TRUNCATE"], "With a savepoint, `ROLLBACK TO` can undo just part of a transaction."),
  ],
};
