// Hand-written MySQL solutions for the first two weeks of the daily plan, each with a small sample walk-through.
import type { Diagram, SqlTable, TablesFrame } from "../diagram";
import type { Solution } from "./types";

type Rows = (string | number | null)[][];
const t = (name: string, cols: string[], rows: Rows, hl?: number[], tone?: SqlTable["tone"]): SqlTable => ({ name, cols, rows, hl, tone });
const viz = (title: string, frames: TablesFrame[]): Diagram => ({ kind: "tables", title, frames });
const sql = (approach: string, idea: string[], code: string, v: () => Diagram, time = "O(n)", space = "O(n)"): Solution => ({ approach, idea, code, lang: "sql", time, space, viz: v });

export const SQL_SOLUTIONS: Record<string, Solution> = {
  "combine-two-tables": sql("LEFT JOIN Address on personId so people without an address still appear (with nulls).",
    ["Every person must be in the result, even without an address: that is a LEFT JOIN from Person.", "Unmatched rows get null for city and state."],
    `SELECT p.firstName, p.lastName, a.city, a.state
FROM Person p
LEFT JOIN Address a ON a.personId = p.personId;`,
    () => { const P = t("Person", ["personId", "lastName", "firstName"], [[1, "Wang", "Allen"], [2, "Alice", "Bob"]]), A = t("Address", ["addressId", "personId", "city", "state"], [[1, 2, "New York City", "New York"], [2, 3, "Leetcode", "California"]]);
      return viz("LEFT JOIN keeps every person", [{ note: "Two tables, joined on personId", tables: [P, A] }, { note: "Person 2 matches address 1; person 1 has no address", tables: [{ ...P, hl: [1] }, { ...A, hl: [0] }] }, { note: "LEFT JOIN result: unmatched person keeps nulls", tables: [t("Result", ["firstName", "lastName", "city", "state"], [["Allen", "Wang", null, null], ["Bob", "Alice", "New York City", "New York"]], [0, 1], "found")] }]); }),

  "rising-temperature": sql("Self-join Weather on yesterday's date and keep rows warmer than yesterday.",
    ["Pair each day w with the row for the day before: DATEDIFF(w.recordDate, y.recordDate) = 1.", "Keep the pair when today's temperature is higher."],
    `SELECT w.id
FROM Weather w
JOIN Weather y ON DATEDIFF(w.recordDate, y.recordDate) = 1
WHERE w.temperature > y.temperature;`,
    () => { const rows: Rows = [[1, "2015-01-01", 10], [2, "2015-01-02", 25], [3, "2015-01-03", 20], [4, "2015-01-04", 30]], W = (hl?: number[], tone?: SqlTable["tone"]) => t("Weather", ["id", "recordDate", "temperature"], rows, hl, tone);
      return viz("Compare each day with the day before", [{ note: "Each row is joined with the previous date's row", tables: [W()] }, { note: "Jan 2 (25) > Jan 1 (10) and Jan 4 (30) > Jan 3 (20)", tables: [W([1, 3], "found")] }, { note: "Jan 3 (20) < Jan 2 (25) is dropped", tables: [W([2], "bad"), t("Result", ["id"], [[2], [4]], [0, 1], "found")] }]); }),

  "customer-who-visited-but-did-not-make-any-transactions": sql("LEFT JOIN visits to transactions, keep visits with no match, group by customer.",
    ["A visit without a transaction has no matching row in Transactions, so after a LEFT JOIN its transaction_id is null.", "Count those visits per customer."],
    `SELECT v.customer_id, COUNT(*) AS count_no_trans
FROM Visits v
LEFT JOIN Transactions t ON t.visit_id = v.visit_id
WHERE t.transaction_id IS NULL
GROUP BY v.customer_id;`,
    () => { const V = (hl?: number[], tone?: SqlTable["tone"]) => t("Visits", ["visit_id", "customer_id"], [[1, 23], [2, 9], [4, 30], [5, 54], [6, 96], [7, 54], [8, 54]], hl, tone), T2 = t("Transactions", ["transaction_id", "visit_id", "amount"], [[2, 5, 310], [3, 5, 300], [9, 5, 200], [12, 1, 910], [13, 2, 970]]);
      return viz("Visits with no transaction", [{ note: "Join visits to transactions by visit_id", tables: [V(), T2] }, { note: "Visits 4, 6, 7, 8 have no transaction (null after LEFT JOIN)", tables: [V([2, 4, 5, 6], "bad"), T2] }, { note: "Group the unmatched visits by customer", tables: [t("Result", ["customer_id", "count_no_trans"], [[30, 1], [96, 1], [54, 2]], [0, 1, 2], "found")] }]); }),

  "recyclable-and-low-fat-products": sql("A plain WHERE with two conditions.",
    ["Both flags must be 'Y', so AND the two conditions."],
    `SELECT product_id
FROM Products
WHERE low_fats = 'Y' AND recyclable = 'Y';`,
    () => { const P = (hl?: number[]) => t("Products", ["product_id", "low_fats", "recyclable"], [[0, "Y", "N"], [1, "Y", "Y"], [2, "N", "Y"], [3, "Y", "Y"], [4, "N", "N"]], hl, "found");
      return viz("Filter on two flags", [{ note: "Check both columns on every row", tables: [P()] }, { note: "Rows 1 and 3 have Y in both", tables: [P([1, 3]), t("Result", ["product_id"], [[1], [3]], [0, 1], "found")] }]); }, "O(n)", "O(1)"),

  "big-countries": sql("WHERE with OR: area at least 3,000,000 or population at least 25,000,000.",
    ["A country is big if either threshold is met, so OR them."],
    `SELECT name, population, area
FROM World
WHERE area >= 3000000 OR population >= 25000000;`,
    () => { const W = (hl?: number[]) => t("World", ["name", "area", "population"], [["Afghanistan", 652230, 25500100], ["Albania", 28748, 2831741], ["Algeria", 2381741, 37100000], ["Andorra", 468, 78115]], hl, "found");
      return viz("Big by area or by population", [{ note: "Either condition makes a country big", tables: [W()] }, { note: "Afghanistan and Algeria pass on population", tables: [W([0, 2])] }]); }, "O(n)", "O(1)"),

  "employees-earning-more-than-their-managers": sql("Self-join Employee to its manager row and compare salaries.",
    ["Join e.managerId = m.id to put each employee next to their manager.", "Keep rows where the employee earns more."],
    `SELECT e.name AS Employee
FROM Employee e
JOIN Employee m ON e.managerId = m.id
WHERE e.salary > m.salary;`,
    () => { const E = (hl?: number[], tone?: SqlTable["tone"]) => t("Employee", ["id", "name", "salary", "managerId"], [[1, "Joe", 70000, 3], [2, "Henry", 80000, 4], [3, "Sam", 60000, null], [4, "Max", 90000, null]], hl, tone);
      return viz("Employee vs their manager", [{ note: "Joe's manager is Sam (3), Henry's is Max (4)", tables: [E()] }, { note: "Joe 70000 > Sam 60000; Henry 80000 < Max 90000", tables: [E([0], "found"), t("Result", ["Employee"], [["Joe"]], [0], "found")] }]); }),

  "students-and-examinations": sql("CROSS JOIN students with subjects for every pair, then LEFT JOIN exam counts.",
    ["Every student must appear with every subject, even with 0 exams: CROSS JOIN builds all pairs.", "LEFT JOIN Examinations and COUNT the matches (COUNT of a column ignores nulls)."],
    `SELECT s.student_id, s.student_name, sub.subject_name,
       COUNT(e.subject_name) AS attended_exams
FROM Students s
CROSS JOIN Subjects sub
LEFT JOIN Examinations e
  ON e.student_id = s.student_id AND e.subject_name = sub.subject_name
GROUP BY s.student_id, s.student_name, sub.subject_name
ORDER BY s.student_id, sub.subject_name;`,
    () => viz("All student-subject pairs, then counts", [
      { note: "2 students × 2 subjects = 4 pairs from the CROSS JOIN", tables: [t("Students", ["student_id", "student_name"], [[1, "Alice"], [2, "Bob"]]), t("Subjects", ["subject_name"], [["Math"], ["Physics"]]), t("Examinations", ["student_id", "subject_name"], [[1, "Math"], [1, "Math"], [1, "Physics"]])] },
      { note: "Bob has no exams, but his rows stay with count 0", tables: [t("Result", ["student_id", "student_name", "subject_name", "attended_exams"], [[1, "Alice", "Math", 2], [1, "Alice", "Physics", 1], [2, "Bob", "Math", 0], [2, "Bob", "Physics", 0]], [2, 3], "found")] },
    ]), "O(s · k + e)"),

  "customers-who-never-order": sql("Anti-join: LEFT JOIN Orders and keep customers whose order side is null.",
    ["A customer with no order has no matching row in Orders.", "NOT EXISTS works too; LEFT JOIN + IS NULL is the classic form."],
    `SELECT c.name AS Customers
FROM Customers c
LEFT JOIN Orders o ON o.customerId = c.id
WHERE o.id IS NULL;`,
    () => { const C = (hl?: number[], tone?: SqlTable["tone"]) => t("Customers", ["id", "name"], [[1, "Joe"], [2, "Henry"], [3, "Sam"], [4, "Max"]], hl, tone), O = t("Orders", ["id", "customerId"], [[1, 3], [2, 1]]);
      return viz("Customers with no orders", [{ note: "Orders reference customers 3 and 1", tables: [C(), O] }, { note: "Henry and Max have no matching order", tables: [C([1, 3], "found"), O] }]); }),

  "find-customer-referee": sql("Rows where referee_id is not 2, remembering that NULL is neither equal nor unequal.",
    ["referee_id <> 2 is NULL (not true) when referee_id is NULL, so those rows would be lost.", "Add OR referee_id IS NULL."],
    `SELECT name
FROM Customer
WHERE referee_id <> 2 OR referee_id IS NULL;`,
    () => { const C = (hl?: number[]) => t("Customer", ["id", "name", "referee_id"], [[1, "Will", null], [2, "Jane", null], [3, "Alex", 2], [4, "Bill", null], [5, "Zack", 1], [6, "Mark", 2]], hl, "found");
      return viz("Watch out for NULL", [{ note: "referee_id <> 2 alone would drop the NULL rows", tables: [C([4])] }, { note: "With OR IS NULL: Will, Jane, Bill, Zack", tables: [C([0, 1, 3, 4])] }]); }, "O(n)", "O(1)"),

  "average-time-of-process-per-machine": sql("Self-join each process's start row with its end row, average end - start per machine.",
    ["Each process has one 'start' and one 'end' row: join them on machine_id and process_id.", "AVG(end - start) per machine, rounded to 3 decimals."],
    `SELECT s.machine_id,
       ROUND(AVG(e.timestamp - s.timestamp), 3) AS processing_time
FROM Activity s
JOIN Activity e
  ON e.machine_id = s.machine_id AND e.process_id = s.process_id
 AND s.activity_type = 'start' AND e.activity_type = 'end'
GROUP BY s.machine_id;`,
    () => { const A = (hl?: number[]) => t("Activity", ["machine_id", "process_id", "type", "timestamp"], [[0, 0, "start", 0.712], [0, 0, "end", 1.52], [0, 1, "start", 3.14], [0, 1, "end", 4.12], [1, 0, "start", 0.55], [1, 0, "end", 1.55]], hl);
      return viz("Pair start and end rows", [{ note: "Machine 0, process 0: 1.520 - 0.712 = 0.808", tables: [A([0, 1])] }, { note: "Machine 0, process 1: 4.120 - 3.140 = 0.980 → average 0.894", tables: [A([2, 3])] }, { note: "Machine 1: 1.000", tables: [t("Result", ["machine_id", "processing_time"], [[0, 0.894], [1, 1.0]], [0, 1], "found")] }]); }),

  "duplicate-emails": sql("GROUP BY email and keep groups with more than one row.",
    ["HAVING filters groups after aggregation; WHERE cannot see COUNT."],
    `SELECT email AS Email
FROM Person
GROUP BY email
HAVING COUNT(*) > 1;`,
    () => { const P = (hl?: number[]) => t("Person", ["id", "email"], [[1, "a@b.com"], [2, "c@d.com"], [3, "a@b.com"]], hl);
      return viz("Groups with count > 1", [{ note: "Group rows by email", tables: [P()] }, { note: "a@b.com appears twice", tables: [P([0, 2]), t("Result", ["Email"], [["a@b.com"]], [0], "found")] }]); }),

  "article-views-i": sql("Rows where an author viewed their own article, distinct, sorted.",
    ["author_id = viewer_id means a self-view.", "An author can view several times, so DISTINCT."],
    `SELECT DISTINCT author_id AS id
FROM Views
WHERE author_id = viewer_id
ORDER BY id;`,
    () => { const V = (hl?: number[]) => t("Views", ["article_id", "author_id", "viewer_id"], [[1, 3, 5], [1, 3, 6], [2, 7, 7], [2, 7, 6], [4, 7, 1], [3, 4, 4], [3, 4, 4]], hl, "found");
      return viz("Self-views", [{ note: "author 7 and author 4 viewed their own articles", tables: [V([2, 5, 6])] }, { note: "DISTINCT and sort", tables: [t("Result", ["id"], [[4], [7]], [0, 1], "found")] }]); }),

  "delete-duplicate-emails": sql("Self-join DELETE: remove every row that has the same email as a row with a smaller id.",
    ["Keep the smallest id per email. A row is a duplicate if another row shares its email with a smaller id.", "MySQL allows DELETE with a self-join."],
    `DELETE p1
FROM Person p1
JOIN Person p2 ON p1.email = p2.email AND p1.id > p2.id;`,
    () => { const P = (hl?: number[], tone?: SqlTable["tone"]) => t("Person", ["id", "email"], [[1, "john@example.com"], [2, "bob@example.com"], [3, "john@example.com"]], hl, tone);
      return viz("Keep the smallest id per email", [{ note: "Row 3 shares an email with row 1, which has a smaller id", tables: [P([2], "bad")] }, { note: "After DELETE", tables: [t("Person", ["id", "email"], [[1, "john@example.com"], [2, "bob@example.com"]], [0, 1], "found")] }]); }),

  "replace-employee-id-with-the-unique-identifier": sql("LEFT JOIN the unique id table so employees without one show null.",
    ["Every employee is listed, matched or not: LEFT JOIN from Employees."],
    `SELECT u.unique_id, e.name
FROM Employees e
LEFT JOIN EmployeeUNI u ON u.id = e.id;`,
    () => viz("Map ids, keep everyone", [
      { note: "Join on id", tables: [t("Employees", ["id", "name"], [[1, "Alice"], [7, "Bob"], [11, "Meir"], [90, "Winston"], [3, "Jonathan"]]), t("EmployeeUNI", ["id", "unique_id"], [[3, 1], [11, 2], [90, 3]])] },
      { note: "Alice and Bob have no unique id → null", tables: [t("Result", ["unique_id", "name"], [[null, "Alice"], [null, "Bob"], [2, "Meir"], [3, "Winston"], [1, "Jonathan"]], [0, 1], "found")] },
    ])),

  "average-selling-price": sql("Join each sale to the price valid on its date, then units-weighted average per product.",
    ["The price for a sale is the Prices row whose date range contains the purchase date.", "Average price = SUM(price × units) / SUM(units). Products with no sales must show 0, so LEFT JOIN from Prices and IFNULL."],
    `SELECT p.product_id,
       IFNULL(ROUND(SUM(p.price * u.units) / SUM(u.units), 2), 0) AS average_price
FROM Prices p
LEFT JOIN UnitsSold u
  ON u.product_id = p.product_id
 AND u.purchase_date BETWEEN p.start_date AND p.end_date
GROUP BY p.product_id;`,
    () => viz("Weighted average by date range", [
      { note: "Each sale picks the price active on its date", tables: [t("Prices", ["product_id", "start", "end", "price"], [[1, "02-17", "02-28", 5], [1, "03-01", "03-22", 20], [2, "02-01", "02-20", 15], [2, "02-21", "03-31", 30]]), t("UnitsSold", ["product_id", "date", "units"], [[1, "02-25", 100], [1, "03-01", 15], [2, "02-10", 200], [2, "03-22", 30]])] },
      { note: "Product 1: (5·100 + 20·15) / 115 = 6.96. Product 2: (15·200 + 30·30) / 230 = 16.96", tables: [t("Result", ["product_id", "average_price"], [[1, 6.96], [2, 16.96]], [0, 1], "found")] },
    ])),

  "swap-sex-of-employees": sql("A single UPDATE with CASE (or IF) flips 'm' and 'f'.",
    ["One statement, no temporary table: CASE picks the opposite value per row."],
    `UPDATE Salary
SET sex = CASE sex WHEN 'm' THEN 'f' ELSE 'm' END;`,
    () => viz("Flip every value in one pass", [
      { note: "Before", tables: [t("Salary", ["id", "name", "sex"], [[1, "A", "m"], [2, "B", "f"], [3, "C", "m"], [4, "D", "f"]])] },
      { note: "After UPDATE", tables: [t("Salary", ["id", "name", "sex"], [[1, "A", "f"], [2, "B", "m"], [3, "C", "f"], [4, "D", "m"]], [0, 1, 2, 3], "found")] },
    ]), "O(n)", "O(1)"),

  "group-sold-products-by-the-date": sql("GROUP BY date: count distinct products and GROUP_CONCAT them sorted.",
    ["The same product can be sold twice on a day, so count and list DISTINCT products.", "GROUP_CONCAT(DISTINCT product ORDER BY product) builds the comma list."],
    `SELECT sell_date,
       COUNT(DISTINCT product) AS num_sold,
       GROUP_CONCAT(DISTINCT product ORDER BY product SEPARATOR ',') AS products
FROM Activities
GROUP BY sell_date
ORDER BY sell_date;`,
    () => viz("One row per day", [
      { note: "Group by sell_date", tables: [t("Activities", ["sell_date", "product"], [["2020-05-30", "Headphone"], ["2020-06-01", "Pencil"], ["2020-06-02", "Mask"], ["2020-05-30", "Basketball"], ["2020-06-01", "Bible"], ["2020-06-02", "Mask"], ["2020-05-30", "T-Shirt"]])] },
      { note: "Mask twice on 06-02 counts once", tables: [t("Result", ["sell_date", "num_sold", "products"], [["2020-05-30", 3, "Basketball,Headphone,T-Shirt"], ["2020-06-01", 2, "Bible,Pencil"], ["2020-06-02", 1, "Mask"]], [2], "found")] },
    ])),

  "employee-bonus": sql("LEFT JOIN Bonus, keep bonus < 1000 or no bonus at all (NULL).",
    ["Employees without a bonus row must be included, so LEFT JOIN.", "bonus < 1000 is not true for NULL, so add OR IS NULL."],
    `SELECT e.name, b.bonus
FROM Employee e
LEFT JOIN Bonus b ON b.empId = e.empId
WHERE b.bonus < 1000 OR b.bonus IS NULL;`,
    () => viz("Small or missing bonus", [
      { note: "Join employees to bonuses", tables: [t("Employee", ["empId", "name"], [[3, "Brad"], [1, "John"], [2, "Dan"], [4, "Thomas"]]), t("Bonus", ["empId", "bonus"], [[2, 500], [4, 2000]])] },
      { note: "Thomas (2000) is dropped; Brad and John have NULL", tables: [t("Result", ["name", "bonus"], [["Brad", null], ["John", null], ["Dan", 500]], [0, 1, 2], "found")] },
    ])),

  "not-boring-movies": sql("Odd id, description not 'boring', sorted by rating descending.",
    ["id % 2 = 1 keeps odd ids.", "ORDER BY rating DESC."],
    `SELECT *
FROM Cinema
WHERE id % 2 = 1 AND description <> 'boring'
ORDER BY rating DESC;`,
    () => { const C = (hl?: number[]) => t("Cinema", ["id", "movie", "description", "rating"], [[1, "War", "great 3D", 8.9], [2, "Science", "fiction", 8.5], [3, "irish", "boring", 6.2], [4, "Ice song", "Fantacy", 8.6], [5, "House card", "Interesting", 9.1]], hl, "found");
      return viz("Filter, then sort", [{ note: "Odd ids 1, 3, 5; movie 3 is boring", tables: [C([0, 4])] }, { note: "Sorted by rating", tables: [t("Result", ["id", "movie", "description", "rating"], [[5, "House card", "Interesting", 9.1], [1, "War", "great 3D", 8.9]], [0, 1], "found")] }]); }, "O(n log n)"),

  "product-sales-analysis-i": sql("Inner join Sales to Product on product_id.",
    ["Each sale's product name comes from Product. Every sale has a product, so a plain JOIN works."],
    `SELECT p.product_name, s.year, s.price
FROM Sales s
JOIN Product p ON p.product_id = s.product_id;`,
    () => viz("Look up product names", [
      { note: "Join on product_id", tables: [t("Sales", ["sale_id", "product_id", "year", "price"], [[1, 100, 2008, 5000], [2, 100, 2009, 5000], [7, 200, 2011, 9000]]), t("Product", ["product_id", "product_name"], [[100, "Nokia"], [200, "Apple"], [300, "Samsung"]])] },
      { note: "Result", tables: [t("Result", ["product_name", "year", "price"], [["Nokia", 2008, 5000], ["Nokia", 2009, 5000], ["Apple", 2011, 9000]], [0, 1, 2], "found")] },
    ])),
};
