// Hand-written MySQL solutions for the first four weeks of the daily plan, each with a small sample walk-through.
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

  "reformat-department-table": sql("Pivot with conditional aggregation: one SUM(CASE WHEN month = ...) column per month, grouped by id.",
    ["GROUP BY id makes one output row per department.", "For each month, CASE keeps the revenue only on that month's row (null elsewhere); SUM over the group picks it up, and stays null when the month is missing."],
    `SELECT id,
  SUM(CASE WHEN month = 'Jan' THEN revenue END) AS Jan_Revenue,
  SUM(CASE WHEN month = 'Feb' THEN revenue END) AS Feb_Revenue,
  SUM(CASE WHEN month = 'Mar' THEN revenue END) AS Mar_Revenue,
  SUM(CASE WHEN month = 'Apr' THEN revenue END) AS Apr_Revenue,
  SUM(CASE WHEN month = 'May' THEN revenue END) AS May_Revenue,
  SUM(CASE WHEN month = 'Jun' THEN revenue END) AS Jun_Revenue,
  SUM(CASE WHEN month = 'Jul' THEN revenue END) AS Jul_Revenue,
  SUM(CASE WHEN month = 'Aug' THEN revenue END) AS Aug_Revenue,
  SUM(CASE WHEN month = 'Sep' THEN revenue END) AS Sep_Revenue,
  SUM(CASE WHEN month = 'Oct' THEN revenue END) AS Oct_Revenue,
  SUM(CASE WHEN month = 'Nov' THEN revenue END) AS Nov_Revenue,
  SUM(CASE WHEN month = 'Dec' THEN revenue END) AS Dec_Revenue
FROM Department
GROUP BY id;`,
    () => { const D = (hl?: number[]) => t("Department", ["id", "revenue", "month"], [[1, 8000, "Jan"], [2, 9000, "Jan"], [3, 10000, "Feb"], [1, 7000, "Feb"], [1, 6000, "Mar"]], hl, "found");
      return viz("Rows become month columns", [{ note: "One row per (department, month)", tables: [D()] }, { note: "Department 1's three rows fill Jan, Feb and Mar", tables: [D([0, 3, 4])] }, { note: "Months with no row stay null (Apr to Dec are all null here)", tables: [t("Result", ["id", "Jan_Revenue", "Feb_Revenue", "Mar_Revenue", "Apr..Dec"], [[1, 8000, 7000, 6000, null], [2, 9000, null, null, null], [3, null, 10000, null, null]], [0, 1, 2], "found")] }]); }),

  "seasonal-sales-analysis": sql("Map each sale's month to a season, total quantity and revenue per (season, category), then keep the top row per season with ROW_NUMBER.",
    ["CASE on MONTH(sale_date) gives the season.", "GROUP BY season and category for total_quantity and total_revenue = SUM(quantity × price).", "ROW_NUMBER per season ordered by quantity desc, revenue desc, category asc picks the winner including both tie-breaks."],
    `WITH s AS (
  SELECT CASE WHEN MONTH(sale_date) IN (12, 1, 2) THEN 'Winter'
              WHEN MONTH(sale_date) IN (3, 4, 5) THEN 'Spring'
              WHEN MONTH(sale_date) IN (6, 7, 8) THEN 'Summer'
              ELSE 'Fall' END AS season,
         p.category,
         SUM(sa.quantity) AS total_quantity,
         SUM(sa.quantity * sa.price) AS total_revenue
  FROM sales sa
  JOIN products p ON p.product_id = sa.product_id
  GROUP BY season, p.category
), r AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY season
           ORDER BY total_quantity DESC, total_revenue DESC, category) AS rn
  FROM s
)
SELECT season, category, total_quantity, ROUND(total_revenue, 2) AS total_revenue
FROM r
WHERE rn = 1
ORDER BY season;`,
    () => viz("Best category per season", [
      { note: "Sales with their product's category", tables: [t("sales", ["product_id", "sale_date", "quantity", "price"], [[1, "2024-01-10", 4, 10], [2, "2024-02-05", 4, 50], [3, "2024-04-12", 3, 18], [1, "2024-07-01", 2, 10], [2, "2024-08-20", 5, 20]]), t("products", ["product_id", "category"], [[1, "Apparel"], [2, "Tech"], [3, "Kitchen"]])] },
      { note: "Per season and category. Winter is tied on quantity (4 vs 4), so revenue decides: Tech", tables: [t("s", ["season", "category", "total_quantity", "total_revenue"], [["Winter", "Apparel", 4, 40], ["Winter", "Tech", 4, 200], ["Spring", "Kitchen", 3, 54], ["Summer", "Apparel", 2, 20], ["Summer", "Tech", 5, 100]], [1, 2, 4], "found")] },
      { note: "rn = 1 rows, ordered by season", tables: [t("Result", ["season", "category", "total_quantity", "total_revenue"], [["Spring", "Kitchen", 3, "54.00"], ["Summer", "Tech", 5, "100.00"], ["Winter", "Tech", 4, "200.00"]], [0, 1, 2], "found")] },
    ]), "O(n log n)"),

  "daily-leads-and-partners": sql("GROUP BY date_id and make_name, counting distinct lead_id and distinct partner_id.",
    ["Each (date, make) pair is one output row.", "COUNT(DISTINCT ...) ignores repeated ids inside the group."],
    `SELECT date_id, make_name,
       COUNT(DISTINCT lead_id) AS unique_leads,
       COUNT(DISTINCT partner_id) AS unique_partners
FROM DailySales
GROUP BY date_id, make_name;`,
    () => { const S = (hl?: number[]) => t("DailySales", ["date_id", "make_name", "lead_id", "partner_id"], [["2020-12-8", "toyota", 0, 1], ["2020-12-8", "toyota", 1, 0], ["2020-12-8", "toyota", 1, 2], ["2020-12-7", "toyota", 0, 2], ["2020-12-7", "honda", 1, 2]], hl, "found");
      return viz("Distinct counts per day and make", [{ note: "Group rows by (date_id, make_name)", tables: [S()] }, { note: "2020-12-8 toyota: leads {0, 1} = 2, partners {1, 0, 2} = 3", tables: [S([0, 1, 2])] }, { note: "Result", tables: [t("Result", ["date_id", "make_name", "unique_leads", "unique_partners"], [["2020-12-8", "toyota", 2, 3], ["2020-12-7", "toyota", 1, 1], ["2020-12-7", "honda", 1, 1]], [0, 1, 2], "found")] }]); }),

  "find-users-with-high-token-usage": sql("GROUP BY user; HAVING at least 3 prompts and MAX(tokens) above AVG(tokens).",
    ["'At least one prompt above their own average' is the same as the user's max being above their average.", "Both conditions are aggregates, so they go in HAVING.", "Round the average only in the output."],
    `SELECT user_id,
       COUNT(*) AS prompt_count,
       ROUND(AVG(tokens), 2) AS avg_tokens
FROM prompts
GROUP BY user_id
HAVING COUNT(*) >= 3 AND MAX(tokens) > AVG(tokens)
ORDER BY avg_tokens DESC, user_id;`,
    () => { const P = (hl?: number[], tone?: SqlTable["tone"]) => t("prompts", ["user_id", "prompt", "tokens"], [[1, "Write a poem", 100], [1, "Fix my code", 150], [1, "Plan a trip", 150], [2, "Hi", 80], [2, "Hello", 80], [2, "Thanks", 80], [3, "Story", 300], [3, "Essay", 200]], hl, tone);
      return viz("Prompt count and spikes above the average", [{ note: "Group prompts by user", tables: [P()] }, { note: "User 1: 3 prompts, average 133.33, max 150 > average ✓", tables: [P([0, 1, 2], "found")] }, { note: "User 2: max 80 equals the average ✗. User 3: only 2 prompts ✗", tables: [P([3, 4, 5, 6, 7], "bad")] }, { note: "Result", tables: [t("Result", ["user_id", "prompt_count", "avg_tokens"], [[1, 3, 133.33]], [0], "found")] }]); }),

  "find-books-with-no-available-copies": sql("Count each book's open borrowings (return_date IS NULL) and keep books where that count equals total_copies.",
    ["Copies available = total_copies - currently borrowed.", "Join only the open borrowing records and count them per book.", "Zero available means the count equals total_copies."],
    `SELECT b.book_id, b.title, b.author, b.genre, b.publication_year,
       COUNT(*) AS current_borrowers
FROM library_books b
JOIN borrowing_records r
  ON r.book_id = b.book_id AND r.return_date IS NULL
GROUP BY b.book_id, b.title, b.author, b.genre, b.publication_year, b.total_copies
HAVING COUNT(*) = b.total_copies
ORDER BY current_borrowers DESC, b.title;`,
    () => { const B = t("library_books", ["book_id", "title", "total_copies"], [[1, "The Great Gatsby", 3], [2, "To Kill a Mockingbird", 3], [3, "1984", 1]]), R = (hl?: number[], tone?: SqlTable["tone"]) => t("borrowing_records", ["record_id", "book_id", "borrower_name", "return_date"], [[1, 1, "Alice", null], [2, 1, "Bob", null], [3, 1, "Carol", null], [4, 2, "Dan", null], [5, 2, "Eve", "2024-01-10"], [6, 3, "Fay", null]], hl, tone);
      return viz("Open borrowings vs copies owned", [{ note: "Books and who has them", tables: [B, R()] }, { note: "Record 5 was returned, so it does not count", tables: [B, R([4], "bad")] }, { note: "Open counts: book 1 has 3 of 3 out, book 2 has 1 of 3, book 3 has 1 of 1", tables: [{ ...B, hl: [0, 2], tone: "found" }, R([0, 1, 2, 5], "found")] }, { note: "Result", tables: [t("Result", ["book_id", "title", "current_borrowers"], [[1, "The Great Gatsby", 3], [3, "1984", 1]], [0, 1], "found")] }]); }, "O(n log n)"),

  "invalid-tweets": sql("WHERE CHAR_LENGTH(content) > 15.",
    ["CHAR_LENGTH counts characters; LENGTH counts bytes, which differs for non-ASCII text."],
    `SELECT tweet_id
FROM Tweets
WHERE CHAR_LENGTH(content) > 15;`,
    () => { const T2 = (hl?: number[]) => t("Tweets", ["tweet_id", "content", "length"], [[1, "Let us Code", 11], [2, "More than fifteen chars are here!", 33]], hl, "bad");
      return viz("Content longer than 15 characters", [{ note: "Measure each tweet", tables: [T2()] }, { note: "Only tweet 2 is over 15", tables: [T2([1]), t("Result", ["tweet_id"], [[2]], [0], "found")] }]); }, "O(n)", "O(1)"),

  "analyze-subscription-conversion": sql("Per user, average the trial rows and the paid rows separately with AVG(CASE ...); users missing either average did not convert.",
    ["AVG ignores nulls, so AVG(CASE WHEN type = 'free_trial' THEN duration END) averages only trial days.", "A user who converted has both a trial average and a paid average; HAVING drops anyone where either is null."],
    `SELECT user_id,
  ROUND(AVG(CASE WHEN activity_type = 'free_trial' THEN activity_duration END), 2) AS trial_avg_duration,
  ROUND(AVG(CASE WHEN activity_type = 'paid' THEN activity_duration END), 2) AS paid_avg_duration
FROM UserActivity
GROUP BY user_id
HAVING trial_avg_duration IS NOT NULL AND paid_avg_duration IS NOT NULL
ORDER BY user_id;`,
    () => { const U = (hl?: number[], tone?: SqlTable["tone"]) => t("UserActivity", ["user_id", "activity_date", "activity_type", "duration"], [[1, "2023-01-01", "free_trial", 30], [1, "2023-01-02", "free_trial", 60], [1, "2023-01-08", "paid", 75], [1, "2023-01-09", "paid", 80], [2, "2023-01-01", "free_trial", 40], [2, "2023-01-08", "cancelled", 0]], hl, tone);
      return viz("Trial and paid averages per user", [{ note: "Each user's daily activity", tables: [U()] }, { note: "User 1: trial (30 + 60) / 2 = 45.00, paid (75 + 80) / 2 = 77.50", tables: [U([0, 1, 2, 3], "found")] }, { note: "User 2 never paid: paid average is null, so HAVING drops them", tables: [U([4, 5], "bad")] }, { note: "Result", tables: [t("Result", ["user_id", "trial_avg_duration", "paid_avg_duration"], [[1, "45.00", "77.50"]], [0], "found")] }]); }),

  "find-golden-hour-customers": sql("GROUP BY customer and test all four rules in HAVING: order count, share of peak-hour orders, average rating, share of rated orders.",
    ["A comparison in MySQL is 1 or 0, so SUM(condition) counts matching rows.", "Peak hours: TIME between 11:00 and 14:00 or between 18:00 and 21:00.", "AVG(order_rating) and COUNT(order_rating) skip nulls, which is exactly 'rated orders'."],
    `SELECT customer_id,
       COUNT(*) AS total_orders,
       ROUND(100 * SUM(TIME(order_timestamp) BETWEEN '11:00:00' AND '14:00:00'
                    OR TIME(order_timestamp) BETWEEN '18:00:00' AND '21:00:00') / COUNT(*)) AS peak_hour_percentage,
       ROUND(AVG(order_rating), 2) AS average_rating
FROM restaurant_orders
GROUP BY customer_id
HAVING COUNT(*) >= 3
   AND SUM(TIME(order_timestamp) BETWEEN '11:00:00' AND '14:00:00'
        OR TIME(order_timestamp) BETWEEN '18:00:00' AND '21:00:00') >= 0.6 * COUNT(*)
   AND AVG(order_rating) >= 4
   AND COUNT(order_rating) >= 0.5 * COUNT(*)
ORDER BY average_rating DESC, customer_id DESC;`,
    () => { const O = (hl?: number[], tone?: SqlTable["tone"]) => t("restaurant_orders", ["order_id", "customer_id", "time", "rating"], [[1, 101, "12:30", 5], [2, 101, "19:15", 4], [3, 101, "13:45", 5], [4, 101, "20:30", null], [5, 102, "11:30", 4], [6, 102, "12:00", 3], [7, 102, "15:30", null], [8, 103, "19:00", 5], [9, 103, "20:45", 4], [10, 103, "18:30", 5]], hl, tone);
      return viz("Four rules per customer", [{ note: "Orders grouped by customer", tables: [O()] }, { note: "101: 4 orders, all in peak hours, 3 of 4 rated, average (5 + 4 + 5) / 3 = 4.67 ✓", tables: [O([0, 1, 2, 3], "found")] }, { note: "102: 2 of 3 in peak (67%), but average rating (4 + 3) / 2 = 3.5 < 4 ✗", tables: [O([4, 5, 6], "bad")] }, { note: "103 passes too. Order by rating desc, then customer_id desc", tables: [t("Result", ["customer_id", "total_orders", "peak_hour_percentage", "average_rating"], [[103, 3, 100, 4.67], [101, 4, 100, 4.67]], [0, 1], "found")] }]); }, "O(n log n)"),

  "market-analysis-i": sql("LEFT JOIN Orders with the 2019 filter inside ON, so users with no 2019 orders still appear with 0.",
    ["Every user must be listed, so start from Users with a LEFT JOIN.", "Putting YEAR(order_date) = 2019 in WHERE would drop users without 2019 orders; in ON it only filters which orders match.", "COUNT(o.order_id) counts matches and gives 0 for none."],
    `SELECT u.user_id AS buyer_id, u.join_date,
       COUNT(o.order_id) AS orders_in_2019
FROM Users u
LEFT JOIN Orders o
  ON o.buyer_id = u.user_id AND YEAR(o.order_date) = 2019
GROUP BY u.user_id, u.join_date;`,
    () => { const U = t("Users", ["user_id", "join_date"], [[1, "2018-01-01"], [2, "2018-02-09"], [3, "2018-01-19"]]), O = (hl?: number[], tone?: SqlTable["tone"]) => t("Orders", ["order_id", "order_date", "buyer_id"], [[1, "2019-08-01", 1], [2, "2018-08-02", 1], [3, "2019-08-03", 2], [4, "2019-08-04", 2]], hl, tone);
      return viz("Orders in 2019 per user", [{ note: "Users and their orders", tables: [U, O()] }, { note: "Order 2 is from 2018, so the ON condition skips it", tables: [U, O([1], "bad")] }, { note: "User 3 has no 2019 orders but stays with 0", tables: [t("Result", ["buyer_id", "join_date", "orders_in_2019"], [[1, "2018-01-01", 1], [2, "2018-02-09", 2], [3, "2018-01-19", 0]], [0, 1, 2], "found")] }]); }),

  "find-books-with-polarized-opinions": sql("Aggregate sessions per book; HAVING checks at least 5 sessions, a rating ≥ 4, a rating ≤ 2, and at least 60% extreme ratings.",
    ["MAX(rating) ≥ 4 and MIN(rating) ≤ 2 means both very high and very low ratings exist.", "SUM(rating <= 2 OR rating >= 4) counts extreme ratings; divide by COUNT(*) for the score.", "Spread = MAX - MIN."],
    `SELECT b.book_id, b.title, b.author, b.genre, b.pages,
       MAX(r.session_rating) - MIN(r.session_rating) AS rating_spread,
       ROUND(SUM(r.session_rating <= 2 OR r.session_rating >= 4) / COUNT(*), 2) AS polarization_score
FROM books b
JOIN reading_sessions r ON r.book_id = b.book_id
GROUP BY b.book_id, b.title, b.author, b.genre, b.pages
HAVING COUNT(*) >= 5
   AND MAX(r.session_rating) >= 4
   AND MIN(r.session_rating) <= 2
   AND SUM(r.session_rating <= 2 OR r.session_rating >= 4) / COUNT(*) >= 0.6
ORDER BY polarization_score DESC, b.title DESC;`,
    () => { const R = (hl?: number[], tone?: SqlTable["tone"]) => t("reading_sessions", ["book_id", "reader_name", "session_rating"], [[1, "Alice", 5], [1, "Bob", 1], [1, "Carol", 4], [1, "Dan", 2], [1, "Eve", 5], [2, "Alice", 5], [2, "Bob", 3], [2, "Carol", 3], [2, "Dan", 3], [2, "Eve", 1]], hl, tone);
      return viz("Extreme ratings per book", [{ note: "Sessions for two books, 5 each", tables: [t("books", ["book_id", "title"], [[1, "Gatsby"], [2, "Dune"]]), R()] }, { note: "Gatsby: ratings 5, 1, 4, 2, 5 are all extreme → score 5 / 5 = 1.00, spread 5 - 1 = 4", tables: [R([0, 1, 2, 3, 4], "found")] }, { note: "Dune: has a 5 and a 1, but only 2 of 5 ratings are extreme (0.40 < 0.6)", tables: [R([5, 6, 7, 8, 9], "bad")] }, { note: "Result", tables: [t("Result", ["book_id", "title", "rating_spread", "polarization_score"], [[1, "Gatsby", 4, "1.00"]], [0], "found")] }]); }, "O(n log n)"),

  "friend-requests-ii-who-has-the-most-friends": sql("Stack both columns with UNION ALL so every accepted request counts once for each side, then take the id with the highest count.",
    ["A friendship (a, b) adds a friend to a and to b.", "UNION ALL (not UNION) keeps duplicates, so each row is counted for both people.", "GROUP BY id, ORDER BY count desc, LIMIT 1 (the problem guarantees one winner)."],
    `SELECT id, COUNT(*) AS num
FROM (
  SELECT requester_id AS id FROM RequestAccepted
  UNION ALL
  SELECT accepter_id FROM RequestAccepted
) ids
GROUP BY id
ORDER BY num DESC
LIMIT 1;`,
    () => { const R = t("RequestAccepted", ["requester_id", "accepter_id"], [[1, 2], [1, 3], [2, 3], [3, 4]]);
      return viz("Count each person on both sides", [{ note: "Accepted requests", tables: [R] }, { note: "UNION ALL of both columns, then count per id", tables: [t("ids grouped", ["id", "num"], [[1, 2], [2, 2], [3, 3], [4, 1]], [2], "found")] }, { note: "Highest count wins", tables: [t("Result", ["id", "num"], [[3, 3]], [0], "found")] }]); }, "O(n log n)"),

  "list-the-products-ordered-in-a-period": sql("Join, keep February 2020 orders, sum units per product, HAVING total ≥ 100.",
    ["Filter the date range in WHERE before grouping.", "The 100-unit rule is about the group total, so it goes in HAVING."],
    `SELECT p.product_name, SUM(o.unit) AS unit
FROM Products p
JOIN Orders o ON o.product_id = p.product_id
WHERE o.order_date BETWEEN '2020-02-01' AND '2020-02-29'
GROUP BY p.product_id, p.product_name
HAVING SUM(o.unit) >= 100;`,
    () => { const O = (hl?: number[], tone?: SqlTable["tone"]) => t("Orders", ["product_id", "order_date", "unit"], [[1, "2020-02-05", 60], [1, "2020-02-10", 70], [2, "2020-01-18", 30], [2, "2020-02-11", 80]], hl, tone), P = t("Products", ["product_id", "product_name"], [[1, "Leetcode Solutions"], [2, "Jewels of Stringology"]]);
      return viz("February units per product", [{ note: "Products and orders", tables: [P, O()] }, { note: "The January order is outside the period", tables: [P, O([2], "bad")] }, { note: "Product 1: 60 + 70 = 130 ≥ 100. Product 2: 80 < 100", tables: [t("Result", ["product_name", "unit"], [["Leetcode Solutions", 130]], [0], "found")] }]); }),

  "find-emotionally-consistent-users": sql("Count reactions per (user, reaction), take each user's most common reaction with ROW_NUMBER, and keep users with ≥ 5 reactions where it is ≥ 60%.",
    ["Group by user and reaction to get each type's count; a window SUM over the user gives their total.", "ROW_NUMBER by count desc picks the dominant reaction.", "Ratio = dominant count / total. Two types can't both reach 60%, so ties never matter."],
    `WITH c AS (
  SELECT user_id, reaction, COUNT(*) AS k,
         SUM(COUNT(*)) OVER (PARTITION BY user_id) AS total,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY COUNT(*) DESC) AS rn
  FROM reactions
  GROUP BY user_id, reaction
)
SELECT user_id, reaction AS dominant_reaction,
       ROUND(k / total, 2) AS reaction_ratio
FROM c
WHERE rn = 1 AND total >= 5 AND k / total >= 0.6
ORDER BY reaction_ratio DESC, user_id;`,
    () => viz("Dominant reaction share", [
      { note: "Counts per user and reaction", tables: [t("c", ["user_id", "reaction", "k", "total"], [[1, "like", 4, 5], [1, "love", 1, 5], [2, "like", 2, 5], [2, "wow", 2, 5], [2, "sad", 1, 5], [3, "love", 3, 3]])] },
      { note: "User 1: like 4 / 5 = 0.80 ✓. User 2: best 2 / 5 = 0.40 ✗. User 3: only 3 reactions ✗", tables: [t("c", ["user_id", "reaction", "k", "total"], [[1, "like", 4, 5], [2, "like", 2, 5], [3, "love", 3, 3]], [0], "found")] },
      { note: "Result", tables: [t("Result", ["user_id", "dominant_reaction", "reaction_ratio"], [[1, "like", "0.80"]], [0], "found")] },
    ]), "O(n log n)"),

  "find-loyal-customers": sql("GROUP BY customer; HAVING ≥ 3 purchases, ≥ 30 days between first and last transaction, and refunds below 20% of all transactions.",
    ["SUM(transaction_type = 'purchase') counts purchases (a true comparison is 1).", "Active days = DATEDIFF(MAX(date), MIN(date)).", "Refund rate = refunds / COUNT(*)."],
    `SELECT customer_id
FROM customer_transactions
GROUP BY customer_id
HAVING SUM(transaction_type = 'purchase') >= 3
   AND DATEDIFF(MAX(transaction_date), MIN(transaction_date)) >= 30
   AND SUM(transaction_type = 'refund') / COUNT(*) < 0.2
ORDER BY customer_id;`,
    () => { const C = (hl?: number[], tone?: SqlTable["tone"]) => t("customer_transactions", ["customer_id", "transaction_date", "transaction_type"], [[101, "2024-01-01", "purchase"], [101, "2024-01-15", "purchase"], [101, "2024-02-10", "purchase"], [102, "2024-01-01", "purchase"], [102, "2024-01-05", "purchase"], [102, "2024-01-10", "purchase"], [103, "2024-01-01", "purchase"], [103, "2024-01-20", "purchase"], [103, "2024-02-15", "purchase"], [103, "2024-02-20", "refund"]], hl, tone);
      return viz("Three rules per customer", [{ note: "Transactions grouped by customer", tables: [C()] }, { note: "101: 3 purchases over 40 days, no refunds ✓", tables: [C([0, 1, 2], "found")] }, { note: "102: active only 9 days ✗. 103: refund rate 1 / 4 = 25% ✗", tables: [C([3, 4, 5, 6, 7, 8, 9], "bad")] }, { note: "Result", tables: [t("Result", ["customer_id"], [[101]], [0], "found")] }]); }),

  "find-stores-with-inventory-imbalance": sql("Rank products per store by price both ways with ROW_NUMBER, join the top (most expensive) and bottom (cheapest) rows, and keep stores where the expensive one has less stock.",
    ["ROW_NUMBER over price desc marks the most expensive product (hi = 1); over price asc marks the cheapest (lo = 1).", "A window COUNT(*) gives the number of products per store for the ≥ 3 rule.", "Ratio = cheapest quantity / most expensive quantity, rounded."],
    `WITH r AS (
  SELECT store_id, product_name, quantity,
         COUNT(*) OVER (PARTITION BY store_id) AS n,
         ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY price DESC) AS hi,
         ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY price) AS lo
  FROM inventory
)
SELECT s.store_id, s.store_name, s.location,
       e.product_name AS most_exp_product,
       c.product_name AS cheapest_product,
       ROUND(c.quantity / e.quantity, 2) AS imbalance_ratio
FROM stores s
JOIN r e ON e.store_id = s.store_id AND e.hi = 1
JOIN r c ON c.store_id = s.store_id AND c.lo = 1
WHERE e.n >= 3 AND e.quantity < c.quantity
ORDER BY imbalance_ratio DESC, s.store_name;`,
    () => { const I = (hl?: number[], tone?: SqlTable["tone"]) => t("inventory", ["store_id", "product_name", "quantity", "price"], [[1, "Laptop", 5, 999], [1, "Mouse", 20, 19], [1, "Cable", 50, 9], [2, "Phone", 30, 699], [2, "Charger", 12, 25], [2, "Case", 10, 15]], hl, tone);
      return viz("Most expensive vs cheapest stock", [{ note: "Each store has 3 products", tables: [t("stores", ["store_id", "store_name", "location"], [[1, "Downtown", "New York"], [2, "Mall", "Chicago"]]), I()] }, { note: "Store 1: Laptop (5 left) vs Cable (50 left): 5 < 50 → ratio 50 / 5 = 10.00", tables: [I([0, 2], "found")] }, { note: "Store 2: Phone (30) vs Case (10): the expensive one has more stock ✗", tables: [I([3, 5], "bad")] }, { note: "Result", tables: [t("Result", ["store_id", "store_name", "most_exp_product", "cheapest_product", "imbalance_ratio"], [[1, "Downtown", "Laptop", "Cable", "10.00"]], [0], "found")] }]); }, "O(n log n)"),

  "product-price-at-a-given-date": sql("For each product, take the latest change on or before 2019-08-16; products with no such change still cost 10.",
    ["List every product once (DISTINCT product_id).", "A correlated subquery finds the newest new_price with change_date ≤ 2019-08-16.", "COALESCE turns 'no change yet' (null) into the starting price 10."],
    `SELECT p.product_id,
       COALESCE((SELECT q.new_price
                 FROM Products q
                 WHERE q.product_id = p.product_id
                   AND q.change_date <= '2019-08-16'
                 ORDER BY q.change_date DESC
                 LIMIT 1), 10) AS price
FROM (SELECT DISTINCT product_id FROM Products) p;`,
    () => { const P = (hl?: number[], tone?: SqlTable["tone"]) => t("Products", ["product_id", "new_price", "change_date"], [[1, 20, "2019-08-14"], [2, 50, "2019-08-14"], [1, 30, "2019-08-15"], [1, 35, "2019-08-16"], [2, 65, "2019-08-17"], [3, 20, "2019-08-18"]], hl, tone);
      return viz("Latest price as of 2019-08-16", [{ note: "All price changes", tables: [P()] }, { note: "Changes after 2019-08-16 are ignored", tables: [P([4, 5], "bad")] }, { note: "Latest valid change: product 1 → 35 (Aug 16), product 2 → 50 (Aug 14)", tables: [P([3, 1], "found")] }, { note: "Product 3 has none yet, so it keeps the default 10", tables: [t("Result", ["product_id", "price"], [[1, 35], [2, 50], [3, 10]], [0, 1, 2], "found")] }]); }, "O(n log n)"),

  "patients-with-a-condition": sql("A condition code starts either the whole string or right after a space: LIKE 'DIAB1%' OR LIKE '% DIAB1%'.",
    ["conditions is a space-separated list of codes.", "'DIAB1%' matches a first code; '% DIAB1%' matches a later code.", "Plain '%DIAB1%' would wrongly match codes like 'ACNEDIAB100'."],
    `SELECT patient_id, patient_name, conditions
FROM Patients
WHERE conditions LIKE 'DIAB1%' OR conditions LIKE '% DIAB1%';`,
    () => { const P = (hl?: number[], tone?: SqlTable["tone"]) => t("Patients", ["patient_id", "patient_name", "conditions"], [[1, "Daniel", "YFEV COUGH"], [2, "Alice", ""], [3, "Bob", "DIAB100 MYOP"], [4, "George", "ACNE DIAB100"], [5, "Alain", "DIAB201"]], hl, tone);
      return viz("Codes starting with DIAB1", [{ note: "Each patient's code list", tables: [P()] }, { note: "Bob: first code DIAB100. George: second code DIAB100 (after a space)", tables: [P([2, 3], "found")] }, { note: "Alain's DIAB201 starts with DIAB2, not DIAB1", tables: [P([4], "bad")] }]); }, "O(n)", "O(1)"),

  "exchange-seats": sql("Compute each student's new id: odd ids move up by one, even ids move down by one, except a last odd id which stays.",
    ["Swapping neighbours means seat 1 ↔ 2, 3 ↔ 4, …", "So an odd id becomes id + 1 and an even id becomes id - 1.", "If the count is odd, the last (odd) id has no partner: keep it. Then sort by the new id."],
    `SELECT CASE
         WHEN id % 2 = 1 AND id = (SELECT MAX(id) FROM Seat) THEN id
         WHEN id % 2 = 1 THEN id + 1
         ELSE id - 1
       END AS id,
       student
FROM Seat
ORDER BY id;`,
    () => { const S = t("Seat", ["id", "student"], [[1, "Abbot"], [2, "Doris"], [3, "Emerson"], [4, "Green"], [5, "Jeames"]]);
      return viz("Swap each pair of seats", [{ note: "Five students", tables: [S] }, { note: "New ids: 1 → 2, 2 → 1, 3 → 4, 4 → 3; 5 is the last odd id and stays", tables: [t("new ids", ["old id", "new id", "student"], [[1, 2, "Abbot"], [2, 1, "Doris"], [3, 4, "Emerson"], [4, 3, "Green"], [5, 5, "Jeames"]], [4], "window")] }, { note: "Sorted by the new id", tables: [t("Result", ["id", "student"], [[1, "Doris"], [2, "Abbot"], [3, "Green"], [4, "Emerson"], [5, "Jeames"]], [0, 1, 2, 3, 4], "found")] }]); }, "O(n log n)"),

  "find-churn-risk-customers": sql("Window functions per user give the latest event, the max amount, the downgrade count and the days between first and last event; keep rows that pass all four rules.",
    ["ROW_NUMBER by event_date desc marks each user's latest event: its plan and amount are 'current'.", "MAX(monthly_amount), SUM(event_type = 'downgrade') and DATEDIFF(MAX(date), MIN(date)) over the user give the history checks.", "Keep the latest row when it is not a cancel, there was a downgrade, current < 50% of max, and days ≥ 60."],
    `WITH e AS (
  SELECT user_id, event_type, plan_name, monthly_amount,
         ROW_NUMBER() OVER w_desc AS rn,
         MAX(monthly_amount) OVER w AS max_amt,
         SUM(event_type = 'downgrade') OVER w AS downs,
         DATEDIFF(MAX(event_date) OVER w, MIN(event_date) OVER w) AS days
  FROM subscription_events
  WINDOW w AS (PARTITION BY user_id),
         w_desc AS (PARTITION BY user_id ORDER BY event_date DESC, event_id DESC)
)
SELECT user_id, plan_name AS current_plan,
       monthly_amount AS current_monthly_amount,
       max_amt AS max_historical_amount,
       days AS days_as_subscriber
FROM e
WHERE rn = 1 AND event_type <> 'cancel' AND downs > 0
  AND monthly_amount < 0.5 * max_amt AND days >= 60
ORDER BY days_as_subscriber DESC, user_id;`,
    () => { const E = (hl?: number[], tone?: SqlTable["tone"]) => t("subscription_events", ["user_id", "event_date", "event_type", "plan_name", "amount"], [[501, "2024-01-01", "start", "premium", 29.99], [501, "2024-02-15", "downgrade", "standard", 19.99], [501, "2024-03-20", "downgrade", "basic", 9.99], [504, "2024-01-15", "start", "premium", 29.99], [504, "2024-03-01", "downgrade", "standard", 19.99], [504, "2024-03-30", "cancel", null, 0], [506, "2024-01-20", "start", "premium", 29.99], [506, "2024-03-10", "downgrade", "basic", 9.99]], hl, tone);
      return viz("Four warning signs per user", [{ note: "Each user's subscription history", tables: [E()] }, { note: "501: latest is basic 9.99 < 50% of 29.99, 2 downgrades, Jan 1 to Mar 20 = 79 days ✓", tables: [E([0, 1, 2], "found")] }, { note: "504's latest event is a cancel ✗. 506 subscribed only 50 days ✗", tables: [E([5, 6, 7], "bad")] }, { note: "Result", tables: [t("Result", ["user_id", "current_plan", "current_monthly_amount", "max_historical_amount", "days_as_subscriber"], [[501, "basic", 9.99, 29.99, 79]], [0], "found")] }]); }, "O(n log n)"),

  "restaurant-growth": sql("Total each day first, then a 7-row window (ROWS 6 PRECEDING) gives the rolling sum and average; skip the first 6 days.",
    ["Several customers can visit on one day, so GROUP BY visited_on first.", "There is at least one customer every day, so 7 rows = 7 days.", "Number the days and keep rows from the 7th onwards (earlier windows are incomplete)."],
    `WITH d AS (
  SELECT visited_on, SUM(amount) AS total
  FROM Customer
  GROUP BY visited_on
)
SELECT visited_on, amount, average_amount
FROM (
  SELECT visited_on,
         SUM(total) OVER (ORDER BY visited_on ROWS 6 PRECEDING) AS amount,
         ROUND(AVG(total) OVER (ORDER BY visited_on ROWS 6 PRECEDING), 2) AS average_amount,
         ROW_NUMBER() OVER (ORDER BY visited_on) AS rn
  FROM d
) x
WHERE rn >= 7
ORDER BY visited_on;`,
    () => { const D = (hl?: number[], tone?: SqlTable["tone"]) => t("d (daily totals)", ["visited_on", "total"], [["2019-01-01", 100], ["2019-01-02", 110], ["2019-01-03", 120], ["2019-01-04", 130], ["2019-01-05", 110], ["2019-01-06", 140], ["2019-01-07", 150], ["2019-01-08", 80], ["2019-01-09", 110], ["2019-01-10", 280]], hl, tone);
      return viz("7-day rolling sum and average", [{ note: "Daily totals (Jan 10 had two customers: 130 + 150)", tables: [D()] }, { note: "Window for Jan 7: Jan 1..7 sum to 860, average 122.86", tables: [D([0, 1, 2, 3, 4, 5, 6], "window")] }, { note: "Window for Jan 10: Jan 4..10 sum to 1000, average 142.86", tables: [D([3, 4, 5, 6, 7, 8, 9], "window")] }, { note: "Rows from day 7 onwards", tables: [t("Result", ["visited_on", "amount", "average_amount"], [["2019-01-07", 860, 122.86], ["2019-01-08", 840, 120], ["2019-01-09", 840, 120], ["2019-01-10", 1000, 142.86]], [0, 1, 2, 3], "found")] }]); }, "O(n log n)"),
};
