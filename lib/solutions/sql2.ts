// Hand-written MySQL solutions for the slugs listed under "sql2" in batches.json, each walking through LeetCode's own example.
import type { Diagram, SqlTable, TablesFrame } from "../diagram";
import type { Solution } from "./types";

type Rows = (string | number | null)[][];
const t = (name: string, cols: string[], rows: Rows, hl?: number[], tone?: SqlTable["tone"]): SqlTable => ({ name, cols, rows, hl, tone });
const viz = (title: string, frames: TablesFrame[]): Diagram => ({ kind: "tables", title, frames });
const sql = (approach: string, idea: string[], code: string, v: () => Diagram, time = "O(n)", space = "O(n)"): Solution => ({ approach, idea, code, lang: "sql", time, space, viz: v });

export const SQL2: Record<string, Solution> = {
  "find-overbooked-employees": sql("Sum meeting hours per employee per Monday-start week, keep weeks over 20 hours, then keep employees with at least 2 such weeks.",
    ["Every date maps to the Monday of its week: meeting_date - WEEKDAY(meeting_date) days (WEEKDAY is 0 on Monday).", "Group by employee and that Monday, keep groups whose hours are above 20.", "Count those heavy weeks per employee and keep counts of 2 or more."],
    `WITH weekly AS (
  SELECT employee_id,
         DATE_SUB(meeting_date, INTERVAL WEEKDAY(meeting_date) DAY) AS week_start
  FROM meetings
  GROUP BY employee_id, week_start
  HAVING SUM(duration_hours) > 20
)
SELECT e.employee_id, e.employee_name, e.department,
       COUNT(*) AS meeting_heavy_weeks
FROM weekly w
JOIN employees e ON e.employee_id = w.employee_id
GROUP BY e.employee_id, e.employee_name, e.department
HAVING COUNT(*) >= 2
ORDER BY meeting_heavy_weeks DESC, e.employee_name;`,
    () => { const M = (hl?: number[], tone?: SqlTable["tone"]) => t("meetings", ["employee_id", "meeting_date", "hours"], [[1, "2023-06-05", 8], [1, "2023-06-06", 6], [1, "2023-06-07", 7], [1, "2023-06-12", 12], [1, "2023-06-13", 9], [2, "2023-06-05", 15], [2, "2023-06-06", 8], [2, "2023-06-12", 10], [3, "2023-06-05", 4], [3, "2023-06-06", 3], [4, "2023-06-05", 25], [4, "2023-06-19", 22], [5, "2023-06-05", 2]], hl, tone);
      return viz("Heavy weeks per employee", [
        { note: "Each meeting belongs to the week starting on its Monday (06-05, 06-12, 06-19)", tables: [M()] },
        { note: "Alice: 21 hours in week 06-05 and 21 in week 06-12. David: 25 and 22", tables: [M([0, 1, 2, 3, 4, 10, 11], "found")] },
        { note: "Bob has only one heavy week (23, then 10); Carol and Emma have none", tables: [M([5, 6, 7], "bad")] },
        { note: "Employees with at least 2 heavy weeks, most weeks first, then by name", tables: [t("Result", ["employee_id", "employee_name", "department", "meeting_heavy_weeks"], [[1, "Alice Johnson", "Engineering", 2], [4, "David Wilson", "Engineering", 2]], [0, 1], "found")] },
      ]); }),

  "find-total-time-spent-by-each-employee": sql("GROUP BY day and employee, summing out_time - in_time.",
    ["Each row is one visit lasting out_time - in_time minutes.", "Add the visits of the same employee on the same day."],
    `SELECT event_day AS day, emp_id,
       SUM(out_time - in_time) AS total_time
FROM Employees
GROUP BY event_day, emp_id;`,
    () => { const E = (hl?: number[]) => t("Employees", ["emp_id", "event_day", "in_time", "out_time"], [[1, "2020-11-28", 4, 32], [1, "2020-11-28", 55, 200], [1, "2020-12-03", 1, 42], [2, "2020-11-28", 3, 33], [2, "2020-12-09", 47, 74]], hl, "found");
      return viz("Minutes per employee per day", [
        { note: "Employee 1 visits twice on 2020-11-28: (32 - 4) + (200 - 55) = 173", tables: [E([0, 1])] },
        { note: "Every other (day, employee) group has a single visit", tables: [t("Result", ["day", "emp_id", "total_time"], [["2020-11-28", 1, 173], ["2020-11-28", 2, 30], ["2020-12-03", 1, 41], ["2020-12-09", 2, 27]], [0], "found")] },
      ]); }),

  "confirmation-rate": sql("LEFT JOIN Confirmations to every signup and average a 1/0 flag for 'confirmed'.",
    ["Every user must appear, even with no requests: LEFT JOIN from Signups.", "AVG(action = 'confirmed') is confirmed / total, since the comparison is 1 or 0.", "Users with no requests average to NULL, so IFNULL turns that into 0."],
    `SELECT s.user_id,
       ROUND(IFNULL(AVG(c.action = 'confirmed'), 0), 2) AS confirmation_rate
FROM Signups s
LEFT JOIN Confirmations c ON c.user_id = s.user_id
GROUP BY s.user_id;`,
    () => { const C = (hl?: number[], tone?: SqlTable["tone"]) => t("Confirmations", ["user_id", "action"], [[3, "timeout"], [3, "timeout"], [7, "confirmed"], [7, "confirmed"], [7, "confirmed"], [2, "confirmed"], [2, "timeout"]], hl, tone);
      return viz("Share of confirmed requests", [
        { note: "Signups: users 3, 7, 2, 6. User 6 has no confirmation rows", tables: [t("Signups", ["user_id"], [[3], [7], [2], [6]], [3], "bad"), C()] },
        { note: "User 7: 3 of 3 confirmed. User 2: 1 of 2. User 3: 0 of 2", tables: [C([2, 3, 4, 5], "found")] },
        { note: "User 6 averages to NULL, IFNULL makes it 0", tables: [t("Result", ["user_id", "confirmation_rate"], [[6, "0.00"], [3, "0.00"], [7, "1.00"], [2, "0.50"]], [0], "found")] },
      ]); }),

  "product-sales-analysis-iii": sql("Find each product's first year with MIN(year), then keep every sale in that (product, year).",
    ["A subquery gives (product_id, MIN(year)) per product.", "IN with the pair keeps all sales of that product in that year; a product can have several."],
    `SELECT product_id, year AS first_year, quantity, price
FROM Sales
WHERE (product_id, year) IN (
  SELECT product_id, MIN(year)
  FROM Sales
  GROUP BY product_id
);`,
    () => { const S = (hl?: number[]) => t("Sales", ["sale_id", "product_id", "year", "quantity", "price"], [[1, 100, 2008, 10, 5000], [2, 100, 2009, 12, 5000], [7, 200, 2011, 15, 9000]], hl, "found");
      return viz("Sales in each product's first year", [
        { note: "Product 100 first sold in 2008, product 200 in 2011", tables: [S(), t("First year", ["product_id", "MIN(year)"], [[100, 2008], [200, 2011]])] },
        { note: "Keep the sales that match a (product, first year) pair", tables: [S([0, 2]), t("Result", ["product_id", "first_year", "quantity", "price"], [[100, 2008, 10, 5000], [200, 2011, 15, 9000]], [0, 1], "found")] },
      ]); }),

  "classes-with-at-least-5-students": sql("GROUP BY class, HAVING COUNT(*) >= 5.",
    ["(student, class) is unique, so the row count of a class is its number of students.", "HAVING filters the groups after counting."],
    `SELECT class
FROM Courses
GROUP BY class
HAVING COUNT(*) >= 5;`,
    () => { const C = (hl?: number[]) => t("Courses", ["student", "class"], [["A", "Math"], ["B", "English"], ["C", "Math"], ["D", "Biology"], ["E", "Math"], ["F", "Computer"], ["G", "Math"], ["H", "Math"], ["I", "Math"]], hl, "found");
      return viz("Classes with 5 or more students", [
        { note: "Math has 6 students; English, Biology and Computer have 1 each", tables: [C([0, 2, 4, 6, 7, 8])] },
        { note: "Only Math passes HAVING COUNT(*) >= 5", tables: [t("Result", ["class"], [["Math"]], [0], "found")] },
      ]); }),

  "customer-placing-the-largest-number-of-orders": sql("GROUP BY customer, ORDER BY COUNT(*) DESC, LIMIT 1.",
    ["Count orders per customer.", "Exactly one customer has the most, so sort by the count and take the first row."],
    `SELECT customer_number
FROM Orders
GROUP BY customer_number
ORDER BY COUNT(*) DESC
LIMIT 1;`,
    () => viz("Most orders wins", [
      { note: "Customer 3 has two orders, customers 1 and 2 have one", tables: [t("Orders", ["order_number", "customer_number"], [[1, 1], [2, 2], [3, 3], [4, 3]], [2, 3], "found")] },
      { note: "Sorted by count, the top row is customer 3", tables: [t("Counts", ["customer_number", "COUNT(*)"], [[3, 2], [1, 1], [2, 1]], [0], "found"), t("Result", ["customer_number"], [[3]], [0], "found")] },
    ]), "O(n log n)"),

  "rank-scores": sql("DENSE_RANK() over score descending: ties share a rank and no numbers are skipped.",
    ["RANK leaves gaps after ties; DENSE_RANK does not, which is what the problem asks.", "rank is a reserved word in MySQL 8, so quote the alias with backticks."],
    `SELECT score,
       DENSE_RANK() OVER (ORDER BY score DESC) AS \`rank\`
FROM Scores
ORDER BY score DESC;`,
    () => viz("Dense ranking", [
      { note: "Sort scores from high to low", tables: [t("Scores", ["id", "score"], [[1, "3.50"], [2, "3.65"], [3, "4.00"], [4, "3.85"], [5, "4.00"], [6, "3.65"]])] },
      { note: "Both 4.00 rows get 1, 3.85 gets 2 (no gap), both 3.65 rows get 3", tables: [t("Result", ["score", "rank"], [["4.00", 1], ["4.00", 1], ["3.85", 2], ["3.65", 3], ["3.65", 3], ["3.50", 4]], [0, 1, 3, 4], "found")] },
    ]), "O(n log n)"),

  "biggest-single-number": sql("Keep numbers that appear once with GROUP BY + HAVING, then take MAX in an outer query.",
    ["The inner query returns the single numbers.", "MAX over an empty set is NULL, so the 'no single number' case returns null for free."],
    `SELECT MAX(num) AS num
FROM (
  SELECT num
  FROM MyNumbers
  GROUP BY num
  HAVING COUNT(*) = 1
) singles;`,
    () => { const N = (hl?: number[], tone?: SqlTable["tone"]) => t("MyNumbers", ["num"], [[8], [8], [3], [3], [1], [4], [5], [6]], hl, tone);
      return viz("Largest number seen once", [
        { note: "8 and 3 appear twice, so they are not single", tables: [N([0, 1, 2, 3], "bad")] },
        { note: "Single numbers are 1, 4, 5, 6; the largest is 6", tables: [N([4, 5, 6, 7], "found"), t("Result", ["num"], [[6]], [0], "found")] },
      ]); }),
  "queries-quality-and-percentage": sql("GROUP BY query_name: AVG(rating / position) for quality and AVG(rating < 3) * 100 for the poor share.",
    ["Quality is the plain average of rating / position over the group.", "rating < 3 is 1 or 0, so its average times 100 is the poor query percentage."],
    `SELECT query_name,
       ROUND(AVG(rating / position), 2) AS quality,
       ROUND(AVG(rating < 3) * 100, 2) AS poor_query_percentage
FROM Queries
GROUP BY query_name;`,
    () => { const Q = (hl?: number[], tone?: SqlTable["tone"]) => t("Queries", ["query_name", "result", "position", "rating"], [["Dog", "Golden Retriever", 1, 5], ["Dog", "German Shepherd", 2, 5], ["Dog", "Mule", 200, 1], ["Cat", "Shirazi", 5, 2], ["Cat", "Siamese", 3, 3], ["Cat", "Sphynx", 7, 4]], hl, tone);
      return viz("Quality and poor share per query", [
        { note: "Dog quality: (5/1 + 5/2 + 1/200) / 3 = 2.50", tables: [Q([0, 1, 2], "found")] },
        { note: "Rows with rating below 3 are poor: one of three for each name", tables: [Q([2, 3], "bad")] },
        { note: "Cat quality: (2/5 + 3/3 + 4/7) / 3 = 0.66", tables: [t("Result", ["query_name", "quality", "poor_query_percentage"], [["Dog", "2.50", "33.33"], ["Cat", "0.66", "33.33"]], [0, 1], "found")] },
      ]); }),

  "find-students-who-improved": sql("Use FIRST_VALUE over exam_date both ways per (student, subject), keep pairs with 2+ dates where the latest beats the first.",
    ["Within each (student, subject) window ordered by date, FIRST_VALUE gives the first score; ordering by date descending gives the latest.", "COUNT(*) over the same window counts exams; keep windows with at least 2.", "DISTINCT collapses the repeated window values to one row per pair."],
    `SELECT DISTINCT student_id, subject, first_score, latest_score
FROM (
  SELECT student_id, subject,
         FIRST_VALUE(score) OVER (PARTITION BY student_id, subject ORDER BY exam_date) AS first_score,
         FIRST_VALUE(score) OVER (PARTITION BY student_id, subject ORDER BY exam_date DESC) AS latest_score,
         COUNT(*) OVER (PARTITION BY student_id, subject) AS exams
  FROM Scores
) s
WHERE exams >= 2 AND latest_score > first_score
ORDER BY student_id, subject;`,
    () => { const S = (hl?: number[], tone?: SqlTable["tone"]) => t("Scores", ["student_id", "subject", "score", "exam_date"], [[101, "Math", 70, "2023-01-15"], [101, "Math", 85, "2023-02-15"], [101, "Physics", 65, "2023-01-15"], [101, "Physics", 60, "2023-02-15"], [102, "Math", 80, "2023-01-15"], [102, "Math", 85, "2023-02-15"], [103, "Math", 90, "2023-01-15"], [104, "Physics", 75, "2023-01-15"], [104, "Physics", 85, "2023-02-15"]], hl, tone);
      return viz("First score vs latest score", [
        { note: "One window per (student, subject), ordered by exam_date", tables: [S()] },
        { note: "101 Physics drops 65 to 60; 103 Math has only one exam", tables: [S([2, 3, 6], "bad")] },
        { note: "Improved: 101 Math 70 to 85, 102 Math 80 to 85, 104 Physics 75 to 85", tables: [S([0, 1, 4, 5, 7, 8], "found"), t("Result", ["student_id", "subject", "first_score", "latest_score"], [[101, "Math", 70, 85], [102, "Math", 80, 85], [104, "Physics", 75, 85]], [0, 1, 2], "found")] },
      ]); }, "O(n log n)"),

  "employees-whose-manager-left-the-company": sql("Salary under 30000 and a manager_id that is no longer an employee_id (NOT IN the table).",
    ["A manager left if their id no longer appears as any employee_id.", "manager_id IS NULL means no manager at all, and NOT IN on NULL is not true, so those rows drop out on their own."],
    `SELECT employee_id
FROM Employees
WHERE salary < 30000
  AND manager_id NOT IN (SELECT employee_id FROM Employees)
ORDER BY employee_id;`,
    () => { const E = (hl?: number[], tone?: SqlTable["tone"]) => t("Employees", ["employee_id", "name", "manager_id", "salary"], [[3, "Mila", 9, 60301], [12, "Antonella", null, 31000], [13, "Emery", null, 67084], [1, "Kalel", 11, 21241], [9, "Mikaela", null, 50937], [11, "Joziah", 6, 28485]], hl, tone);
      return viz("Low salary, missing manager", [
        { note: "Salaries below 30000: Kalel (1) and Joziah (11)", tables: [E([3, 5])] },
        { note: "Kalel's manager 11 still exists; Joziah's manager 6 has no row", tables: [E([3], "bad"), t("Result", ["employee_id"], [[11]], [0], "found")] },
      ]); }, "O(n log n)"),

  "sales-analysis-iii": sql("GROUP BY product and require both MIN(sale_date) and MAX(sale_date) to fall inside Q1 2019.",
    ["If the earliest and the latest sale are both in the range, every sale is.", "Join Product for the name."],
    `SELECT p.product_id, p.product_name
FROM Product p
JOIN Sales s ON s.product_id = p.product_id
GROUP BY p.product_id, p.product_name
HAVING MIN(s.sale_date) >= '2019-01-01'
   AND MAX(s.sale_date) <= '2019-03-31';`,
    () => { const S = (hl?: number[], tone?: SqlTable["tone"]) => t("Sales", ["seller_id", "product_id", "buyer_id", "sale_date"], [[1, 1, 1, "2019-01-21"], [1, 2, 2, "2019-02-17"], [2, 2, 3, "2019-06-02"], [3, 3, 4, "2019-05-13"]], hl, tone);
      return viz("Every sale inside Q1 2019", [
        { note: "Product 1 sold only on 2019-01-21", tables: [S([0], "found")] },
        { note: "Product 2 also sold in June, product 3 only in May", tables: [S([2, 3], "bad")] },
        { note: "Only product 1 has min and max dates inside the range", tables: [t("Result", ["product_id", "product_name"], [[1, "S8"]], [0], "found")] },
      ]); }),

  "calculate-special-bonus": sql("CASE: full salary when the id is odd and the name does not start with 'M', else 0.",
    ["employee_id % 2 = 1 tests odd ids.", "name NOT LIKE 'M%' tests the first letter."],
    `SELECT employee_id,
       CASE WHEN employee_id % 2 = 1 AND name NOT LIKE 'M%' THEN salary ELSE 0 END AS bonus
FROM Employees
ORDER BY employee_id;`,
    () => { const E = (hl?: number[], tone?: SqlTable["tone"]) => t("Employees", ["employee_id", "name", "salary"], [[2, "Meir", 3000], [3, "Michael", 3800], [7, "Addilyn", 7400], [8, "Juan", 6100], [9, "Kannon", 7700]], hl, tone);
      return viz("Odd id and no leading M", [
        { note: "Ids 2 and 8 are even; Michael starts with M", tables: [E([0, 1, 3], "bad")] },
        { note: "Addilyn and Kannon get their full salary", tables: [E([2, 4], "found"), t("Result", ["employee_id", "bonus"], [[2, 0], [3, 0], [7, 7400], [8, 0], [9, 7700]], [2, 4], "found")] },
      ]); }, "O(n log n)"),

  "find-products-with-valid-serial-numbers": sql("REGEXP_LIKE with 'SN[0-9]{4}-[0-9]{4}' and word edges, matched case-sensitively with the 'c' flag.",
    ["The pattern is SN, 4 digits, a hyphen, 4 digits.", "(^|[^0-9A-Za-z]) before and ([^0-9]|$) after stop a fifth digit like SN1234-56789 from matching.", "MySQL compares case-insensitively by default, so pass 'c' to make SN case-sensitive."],
    `SELECT product_id, product_name, description
FROM products
WHERE REGEXP_LIKE(description, '(^|[^0-9A-Za-z])SN[0-9]{4}-[0-9]{4}([^0-9]|$)', 'c')
ORDER BY product_id;`,
    () => { const P = (hl?: number[], tone?: SqlTable["tone"]) => t("products", ["product_id", "description"], [[1, "This is a sample product with SN1234-5678"], [2, "A product with serial SN9876-1234 in the description"], [3, "Product SN1234-56789 is available now"], [4, "No serial number here"], [5, "Check out SN4321-8765 in this description"]], hl, tone);
      return viz("Find SNdddd-dddd inside the text", [
        { note: "Product 3 has five digits after the hyphen; product 4 has no serial", tables: [P([2, 3], "bad")] },
        { note: "Products 1, 2 and 5 contain a valid serial", tables: [P([0, 1, 4], "found")] },
      ]); }),

  "triangle-judgement": sql("CASE: three sides form a triangle when each pair sums to more than the third.",
    ["Check x + y > z, x + z > y and y + z > x together."],
    `SELECT x, y, z,
       CASE WHEN x + y > z AND x + z > y AND y + z > x THEN 'Yes' ELSE 'No' END AS triangle
FROM Triangle;`,
    () => viz("Triangle inequality", [
      { note: "13 + 15 = 28 is not more than 30", tables: [t("Triangle", ["x", "y", "z"], [[13, 15, 30], [10, 20, 15]], [0], "bad")] },
      { note: "10, 20, 15: every pair beats the third side", tables: [t("Result", ["x", "y", "z", "triangle"], [[13, 15, 30, "No"], [10, 20, 15, "Yes"]], [1], "found")] },
    ]), "O(n)", "O(1)"),

  "the-latest-login-in-2020": sql("Filter to 2020 logins, then MAX(time_stamp) per user.",
    ["Use a range on time_stamp (>= 2020-01-01 and < 2021-01-01) so an index can be used.", "Users with no 2020 login have no rows left, so they vanish."],
    `SELECT user_id, MAX(time_stamp) AS last_stamp
FROM Logins
WHERE time_stamp >= '2020-01-01' AND time_stamp < '2021-01-01'
GROUP BY user_id;`,
    () => { const L = (hl?: number[], tone?: SqlTable["tone"]) => t("Logins", ["user_id", "time_stamp"], [[6, "2020-06-30 15:06:07"], [6, "2021-04-21 14:06:06"], [6, "2019-03-07 00:18:15"], [8, "2020-02-01 05:10:53"], [8, "2020-12-30 00:46:50"], [2, "2020-01-16 02:49:50"], [2, "2019-08-25 07:59:08"], [14, "2019-07-14 09:00:00"], [14, "2021-01-06 11:59:59"]], hl, tone);
      return viz("Latest login inside 2020", [
        { note: "Keep only the 2020 rows; user 14 has none", tables: [L([0, 3, 4, 5], "found")] },
        { note: "User 8 has two; MAX keeps December", tables: [t("Result", ["user_id", "last_stamp"], [[6, "2020-06-30 15:06:07"], [8, "2020-12-30 00:46:50"], [2, "2020-01-16 02:49:50"]], [1], "found")] },
      ]); }),

  "customers-who-bought-all-products": sql("GROUP BY customer and compare COUNT(DISTINCT product_key) with the number of products.",
    ["A customer bought everything when their distinct product count equals the size of Product.", "DISTINCT matters because Customer can repeat a purchase."],
    `SELECT customer_id
FROM Customer
GROUP BY customer_id
HAVING COUNT(DISTINCT product_key) = (SELECT COUNT(*) FROM Product);`,
    () => { const C = (hl?: number[], tone?: SqlTable["tone"]) => t("Customer", ["customer_id", "product_key"], [[1, 5], [2, 6], [3, 5], [3, 6], [1, 6]], hl, tone);
      return viz("Distinct products = all products", [
        { note: "There are 2 products: 5 and 6", tables: [C(), t("Product", ["product_key"], [[5], [6]])] },
        { note: "Customers 1 and 3 bought both; customer 2 only bought 6", tables: [C([0, 2, 3, 4], "found"), t("Result", ["customer_id"], [[1], [3]], [0, 1], "found")] },
      ]); }),

  "percentage-of-users-attended-a-contest": sql("Count registrations per contest and divide by the total number of users.",
    ["(contest_id, user_id) is unique, so COUNT(*) per contest is its number of users.", "Divide by (SELECT COUNT(*) FROM Users), times 100, round to 2.", "Sort by percentage descending, then contest_id."],
    `SELECT contest_id,
       ROUND(COUNT(*) * 100 / (SELECT COUNT(*) FROM Users), 2) AS percentage
FROM Register
GROUP BY contest_id
ORDER BY percentage DESC, contest_id;`,
    () => viz("Share of users per contest", [
      { note: "3 users in total; contest 215 has 2 registrations, 207 has 1", tables: [t("Users", ["user_id", "user_name"], [[6, "Alice"], [2, "Bob"], [7, "Alex"]]), t("Register (215, 207)", ["contest_id", "user_id"], [[215, 6], [215, 7], [207, 2]], [0, 1, 2])] },
      { note: "208, 209, 210 have all 3 users (100%), 215 has 2/3, 207 has 1/3", tables: [t("Result", ["contest_id", "percentage"], [[208, "100.00"], [209, "100.00"], [210, "100.00"], [215, "66.67"], [207, "33.33"]], [0, 1, 2], "found")] },
    ]), "O(n log n)"),

  "rearrange-products-table": sql("Unpivot with one SELECT per store column joined by UNION ALL, skipping NULL prices.",
    ["Each store column becomes its own SELECT with the store name as a literal.", "WHERE storeN IS NOT NULL drops stores that do not sell the product."],
    `SELECT product_id, 'store1' AS store, store1 AS price FROM Products WHERE store1 IS NOT NULL
UNION ALL
SELECT product_id, 'store2', store2 FROM Products WHERE store2 IS NOT NULL
UNION ALL
SELECT product_id, 'store3', store3 FROM Products WHERE store3 IS NOT NULL;`,
    () => viz("Columns into rows", [
      { note: "Product 1 has no price in store2", tables: [t("Products", ["product_id", "store1", "store2", "store3"], [[0, 95, 100, 105], [1, 70, null, 80]], [1], "bad")] },
      { note: "One row per non-null price", tables: [t("Result", ["product_id", "store", "price"], [[0, "store1", 95], [0, "store2", 100], [0, "store3", 105], [1, "store1", 70], [1, "store3", 80]], [3, 4], "found")] },
    ])),

  "user-activity-for-the-past-30-days-i": sql("Keep dates from 2019-06-28 to 2019-07-27, then COUNT(DISTINCT user_id) per day.",
    ["30 days ending 2019-07-27 inclusive start on 2019-06-28.", "A user with several actions on a day still counts once: COUNT(DISTINCT user_id)."],
    `SELECT activity_date AS day, COUNT(DISTINCT user_id) AS active_users
FROM Activity
WHERE activity_date BETWEEN '2019-06-28' AND '2019-07-27'
GROUP BY activity_date;`,
    () => { const A = (hl?: number[], tone?: SqlTable["tone"]) => t("Activity", ["user_id", "session_id", "activity_date", "activity_type"], [[1, 1, "2019-07-20", "open_session"], [1, 1, "2019-07-20", "scroll_down"], [1, 1, "2019-07-20", "end_session"], [2, 4, "2019-07-20", "open_session"], [2, 4, "2019-07-21", "send_message"], [2, 4, "2019-07-21", "end_session"], [3, 2, "2019-07-21", "open_session"], [3, 2, "2019-07-21", "send_message"], [3, 2, "2019-07-21", "end_session"], [4, 3, "2019-06-25", "open_session"], [4, 3, "2019-06-25", "end_session"]], hl, tone);
      return viz("Distinct users per day in the window", [
        { note: "User 4's activity on 2019-06-25 is before the window", tables: [A([9, 10], "bad")] },
        { note: "07-20: users 1 and 2. 07-21: users 2 and 3", tables: [A([0, 3, 4, 6], "found"), t("Result", ["day", "active_users"], [["2019-07-20", 2], ["2019-07-21", 2]], [0, 1], "found")] },
      ]); }),

  "nth-highest-salary": sql("A function that returns the row at OFFSET N - 1 of the distinct salaries sorted high to low.",
    ["DISTINCT so equal salaries count once; ORDER BY salary DESC puts the highest first.", "LIMIT cannot take an expression, so subtract 1 from N first and use LIMIT 1 OFFSET N.", "A scalar subquery with no row returns NULL, which covers 'fewer than n salaries'."],
    `CREATE FUNCTION getNthHighestSalary(N INT) RETURNS INT
BEGIN
  SET N = N - 1;
  RETURN (
    SELECT DISTINCT salary
    FROM Employee
    ORDER BY salary DESC
    LIMIT 1 OFFSET N
  );
END`,
    () => viz("Skip N - 1 distinct salaries", [
      { note: "n = 2: distinct salaries sorted high to low are 300, 200, 100", tables: [t("Employee", ["id", "salary"], [[3, 300], [2, 200], [1, 100]], [1], "found")] },
      { note: "OFFSET 1 skips 300 and returns 200", tables: [t("Result", ["getNthHighestSalary(2)"], [[200]], [0], "found")] },
      { note: "With only one salary (100), OFFSET 1 finds no row, so the result is null", tables: [t("Employee", ["id", "salary"], [[1, 100]]), t("Result", ["getNthHighestSalary(2)"], [[null]], [0], "bad")] },
    ]), "O(n log n)"),

  "actors-and-directors-who-cooperated-at-least-three-times": sql("GROUP BY (actor_id, director_id), HAVING COUNT(*) >= 3.",
    ["Each row is one collaboration (timestamp is unique).", "Count rows per pair and keep pairs with 3 or more."],
    `SELECT actor_id, director_id
FROM ActorDirector
GROUP BY actor_id, director_id
HAVING COUNT(*) >= 3;`,
    () => { const A = (hl?: number[], tone?: SqlTable["tone"]) => t("ActorDirector", ["actor_id", "director_id", "timestamp"], [[1, 1, 0], [1, 1, 1], [1, 1, 2], [1, 2, 3], [1, 2, 4], [2, 1, 5], [2, 1, 6]], hl, tone);
      return viz("Pairs that worked together 3+ times", [
        { note: "(1, 1) has 3 rows; (1, 2) and (2, 1) have 2 each", tables: [A([0, 1, 2], "found")] },
        { note: "Only (1, 1) passes", tables: [t("Result", ["actor_id", "director_id"], [[1, 1]], [0], "found")] },
      ]); }),

  "immediate-food-delivery-ii": sql("Keep each customer's first order with (customer_id, MIN(order_date)), then average the immediate flag.",
    ["A subquery finds each customer's earliest order_date; IN with the pair keeps only first orders.", "order_date = customer_pref_delivery_date is 1 or 0, so AVG times 100 is the percentage."],
    `SELECT ROUND(AVG(order_date = customer_pref_delivery_date) * 100, 2) AS immediate_percentage
FROM Delivery
WHERE (customer_id, order_date) IN (
  SELECT customer_id, MIN(order_date)
  FROM Delivery
  GROUP BY customer_id
);`,
    () => { const D = (hl?: number[], tone?: SqlTable["tone"]) => t("Delivery", ["delivery_id", "customer_id", "order_date", "pref_date"], [[1, 1, "2019-08-01", "2019-08-02"], [2, 2, "2019-08-02", "2019-08-02"], [3, 1, "2019-08-11", "2019-08-12"], [4, 3, "2019-08-24", "2019-08-24"], [5, 3, "2019-08-21", "2019-08-22"], [6, 2, "2019-08-11", "2019-08-13"], [7, 4, "2019-08-09", "2019-08-09"]], hl, tone);
      return viz("Immediate share among first orders", [
        { note: "First orders: deliveries 1, 2, 5, 7 (one per customer)", tables: [D([0, 1, 4, 6])] },
        { note: "Deliveries 2 and 7 are immediate (same date); 1 and 5 are scheduled", tables: [D([1, 6], "found")] },
        { note: "2 of 4 first orders are immediate", tables: [t("Result", ["immediate_percentage"], [["50.00"]], [0], "found")] },
      ]); }),

  "find-consistently-improving-employees": sql("Number each employee's reviews newest first with ROW_NUMBER, keep the top 3, and require rating 1 > rating 2 > rating 3.",
    ["ROW_NUMBER() over review_date DESC gives rn 1 for the newest review.", "Pivot rn 1, 2, 3 into columns with MAX(CASE ...) and require exactly 3 rows.", "Strictly increasing over time means newest > middle > oldest; the score is newest - oldest."],
    `WITH ranked AS (
  SELECT employee_id, rating,
         ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY review_date DESC) AS rn
  FROM performance_reviews
), last3 AS (
  SELECT employee_id,
         MAX(CASE WHEN rn = 1 THEN rating END) AS r1,
         MAX(CASE WHEN rn = 2 THEN rating END) AS r2,
         MAX(CASE WHEN rn = 3 THEN rating END) AS r3
  FROM ranked
  WHERE rn <= 3
  GROUP BY employee_id
  HAVING COUNT(*) = 3
)
SELECT e.employee_id, e.name, l.r1 - l.r3 AS improvement_score
FROM last3 l
JOIN employees e ON e.employee_id = l.employee_id
WHERE l.r1 > l.r2 AND l.r2 > l.r3
ORDER BY improvement_score DESC, e.name;`,
    () => { const R = (hl?: number[], tone?: SqlTable["tone"]) => t("Last 3 reviews (newest first)", ["employee_id", "name", "r1", "r2", "r3"], [[1, "Alice Johnson", 5, 4, 3], [2, "Bob Smith", 5, 4, 2], [3, "Carol Davis", 4, 3, 2], [4, "David Wilson", 4, 4, 4]], hl, tone);
      return viz("Last three reviews strictly rising", [
        { note: "Emma has only 2 reviews, so she has no row with rn = 3", tables: [t("performance_reviews (Emma)", ["employee_id", "review_date", "rating"], [[5, "2023-02-15", 3], [5, "2023-05-15", 2]], [0, 1], "bad")] },
        { note: "Pivot each employee's 3 newest ratings. Bob's older 3 is dropped", tables: [R()] },
        { note: "David's ratings 4, 4, 4 are not strictly increasing", tables: [R([3], "bad")] },
        { note: "Score = newest - oldest: Bob 3, Alice 2, Carol 2 (ties by name)", tables: [t("Result", ["employee_id", "name", "improvement_score"], [[2, "Bob Smith", 3], [1, "Alice Johnson", 2], [3, "Carol Davis", 2]], [0, 1, 2], "found")] },
      ]); }, "O(n log n)"),

  "last-person-to-fit-in-the-bus": sql("Running SUM(weight) OVER (ORDER BY turn), keep rows with total <= 1000, take the highest turn.",
    ["The window sum at each turn is the weight on the bus after that person boards.", "The last person who fits is the latest turn whose running total is still at most 1000."],
    `SELECT person_name
FROM (
  SELECT person_name, turn,
         SUM(weight) OVER (ORDER BY turn) AS total
  FROM Queue
) q
WHERE total <= 1000
ORDER BY turn DESC
LIMIT 1;`,
    () => { const Q = (hl?: number[], tone?: SqlTable["tone"]) => t("Queue by turn", ["turn", "person_name", "weight", "total"], [[1, "Alice", 250, 250], [2, "Alex", 350, 600], [3, "John Cena", 400, 1000], [4, "Marie", 200, 1200], [5, "Bob", 175, 1375], [6, "Winston", 500, 1875]], hl, tone);
      return viz("Running weight on the bus", [
        { note: "Sort by turn and add up the weights", tables: [Q()] },
        { note: "Totals after turn 3 go above 1000", tables: [Q([3, 4, 5], "bad")] },
        { note: "Turn 3 is the last total within the limit", tables: [Q([2], "found"), t("Result", ["person_name"], [["John Cena"]], [0], "found")] },
      ]); }, "O(n log n)"),

  "odd-and-even-transactions": sql("GROUP BY date with two conditional sums: amounts where amount % 2 = 1, and amounts where it is 0.",
    ["SUM(CASE WHEN amount % 2 = 1 THEN amount ELSE 0 END) adds only odd amounts and gives 0 when there are none.", "The same with % 2 = 0 for even amounts."],
    `SELECT transaction_date,
       SUM(CASE WHEN amount % 2 = 1 THEN amount ELSE 0 END) AS odd_sum,
       SUM(CASE WHEN amount % 2 = 0 THEN amount ELSE 0 END) AS even_sum
FROM transactions
GROUP BY transaction_date
ORDER BY transaction_date;`,
    () => { const T = (hl?: number[], tone?: SqlTable["tone"]) => t("transactions", ["transaction_id", "amount", "transaction_date"], [[1, 150, "2024-07-01"], [2, 200, "2024-07-01"], [3, 75, "2024-07-01"], [4, 300, "2024-07-02"], [5, 50, "2024-07-02"], [6, 120, "2024-07-03"]], hl, tone);
      return viz("Odd and even amounts per day", [
        { note: "75 is the only odd amount", tables: [T([2], "found")] },
        { note: "Days with no odd amount get 0 from the ELSE branch", tables: [t("Result", ["transaction_date", "odd_sum", "even_sum"], [["2024-07-01", 75, 350], ["2024-07-02", 0, 350], ["2024-07-03", 0, 120]], [1, 2], "found")] },
      ]); }, "O(n log n)"),

  "find-users-with-valid-e-mails": sql("Case-sensitive REGEXP_LIKE: a letter, then letters, digits, _ . -, then exactly @leetcode.com.",
    ["^[A-Za-z] forces the first character to be a letter.", "[A-Za-z0-9_.-]* allows the rest of the prefix; @leetcode[.]com$ fixes the domain.", "The 'c' flag makes the match case-sensitive, so @LEETCODE.COM fails."],
    `SELECT user_id, name, mail
FROM Users
WHERE REGEXP_LIKE(mail, '^[A-Za-z][A-Za-z0-9_.-]*@leetcode[.]com$', 'c');`,
    () => { const U = (hl?: number[], tone?: SqlTable["tone"]) => t("Users", ["user_id", "name", "mail"], [[1, "Winston", "winston@leetcode.com"], [2, "Jonathan", "jonathanisgreat"], [3, "Annabelle", "bella-@leetcode.com"], [4, "Sally", "sally.come@leetcode.com"], [5, "Marwan", "quarz#2020@leetcode.com"], [6, "David", "david69@gmail.com"], [7, "Shapiro", ".shapo@leetcode.com"]], hl, tone);
      return viz("Match the whole address", [
        { note: "No domain (2), a # sign (5), wrong domain (6), starts with a period (7)", tables: [U([1, 4, 5, 6], "bad")] },
        { note: "Users 1, 3 and 4 match", tables: [U([0, 2, 3], "found")] },
      ]); }),

  "find-covid-recovery-patients": sql("Take each patient's first positive date, then the earliest negative after it; DATEDIFF is the recovery time.",
    ["A CTE gives MIN(test_date) of the Positive tests per patient.", "Join Negative tests with a later date and take MIN of those dates.", "Patients with no later negative drop out of the inner join."],
    `WITH first_pos AS (
  SELECT patient_id, MIN(test_date) AS pos_date
  FROM covid_tests
  WHERE result = 'Positive'
  GROUP BY patient_id
)
SELECT p.patient_id, p.patient_name, p.age,
       DATEDIFF(MIN(c.test_date), f.pos_date) AS recovery_time
FROM first_pos f
JOIN covid_tests c
  ON c.patient_id = f.patient_id AND c.result = 'Negative' AND c.test_date > f.pos_date
JOIN patients p ON p.patient_id = f.patient_id
GROUP BY p.patient_id, p.patient_name, p.age, f.pos_date
ORDER BY recovery_time, p.patient_name;`,
    () => { const C = (hl?: number[], tone?: SqlTable["tone"]) => t("covid_tests", ["patient_id", "test_date", "result"], [[1, "2023-01-15", "Positive"], [1, "2023-01-25", "Negative"], [2, "2023-02-01", "Positive"], [2, "2023-02-05", "Inconclusive"], [2, "2023-02-12", "Negative"], [3, "2023-01-20", "Negative"], [3, "2023-02-10", "Positive"], [3, "2023-02-20", "Negative"], [4, "2023-01-10", "Positive"], [4, "2023-01-18", "Positive"], [5, "2023-02-15", "Negative"], [5, "2023-02-20", "Negative"]], hl, tone);
      return viz("First positive, then the next negative", [
        { note: "First positive per patient: 1 on 01-15, 2 on 02-01, 3 on 02-10, 4 on 01-10", tables: [C([0, 2, 6, 8], "found")] },
        { note: "First negative after it: 01-25, 02-12, 02-20. Carol's 01-20 negative is too early", tables: [C([1, 4, 7], "found")] },
        { note: "David never tests negative, Emma never tests positive", tables: [C([8, 9, 10, 11], "bad")] },
        { note: "Days between, sorted by recovery time then name", tables: [t("Result", ["patient_id", "patient_name", "age", "recovery_time"], [[1, "Alice Smith", 28, 10], [3, "Carol Davis", 42, 10], [2, "Bob Johnson", 35, 11]], [0, 1, 2], "found")] },
      ]); }, "O(n log n)"),

  "top-travellers": sql("LEFT JOIN Rides to Users, SUM distance with IFNULL 0, sort by distance desc then name.",
    ["Users with no rides must show 0: LEFT JOIN and IFNULL(SUM(...), 0).", "Group by u.id, not by name, because two users can share a name."],
    `SELECT u.name, IFNULL(SUM(r.distance), 0) AS travelled_distance
FROM Users u
LEFT JOIN Rides r ON r.user_id = u.id
GROUP BY u.id, u.name
ORDER BY travelled_distance DESC, u.name;`,
    () => { const R = (hl?: number[], tone?: SqlTable["tone"]) => t("Rides", ["id", "user_id", "distance"], [[1, 1, 120], [2, 2, 317], [3, 3, 222], [4, 7, 100], [5, 13, 312], [6, 19, 50], [7, 7, 120], [8, 19, 400], [9, 7, 230]], hl, tone);
      return viz("Total distance per user", [
        { note: "Lee (7): 100 + 120 + 230 = 450. Elvis (19): 50 + 400 = 450", tables: [R([3, 5, 6, 7, 8], "found")] },
        { note: "Donald (4) has no rides, so IFNULL gives 0. Ties sort by name", tables: [t("Result", ["name", "travelled_distance"], [["Elvis", 450], ["Lee", 450], ["Bob", 317], ["Jonathan", 312], ["Alex", 222], ["Alice", 120], ["Donald", 0]], [0, 1, 6], "found")] },
      ]); }, "O(n log n)"),

  "primary-department-for-each-employee": sql("Rows flagged 'Y', plus the single row of any employee who belongs to only one department.",
    ["An employee with several departments marks one as 'Y'.", "An employee with one department has 'N', so also keep employees whose row count is 1."],
    `SELECT employee_id, department_id
FROM Employee
WHERE primary_flag = 'Y'
   OR employee_id IN (
     SELECT employee_id
     FROM Employee
     GROUP BY employee_id
     HAVING COUNT(*) = 1
   );`,
    () => { const E = (hl?: number[], tone?: SqlTable["tone"]) => t("Employee", ["employee_id", "department_id", "primary_flag"], [[1, 1, "N"], [2, 1, "Y"], [2, 2, "N"], [3, 3, "N"], [4, 2, "N"], [4, 3, "Y"], [4, 4, "N"]], hl, tone);
      return viz("Flagged row or only row", [
        { note: "Employees 2 and 4 flag their primary with 'Y'", tables: [E([1, 5], "found")] },
        { note: "Employees 1 and 3 have one department each, flagged 'N'", tables: [E([0, 3], "found")] },
        { note: "Result", tables: [t("Result", ["employee_id", "department_id"], [[1, 1], [2, 1], [3, 3], [4, 3]], [0, 1, 2, 3], "found")] },
      ]); }),

  "investments-in-2016": sql("Two window counts: rows sharing tiv_2015 must be more than 1, rows sharing (lat, lon) must be exactly 1.",
    ["COUNT(*) OVER (PARTITION BY tiv_2015) counts policyholders with the same 2015 value.", "COUNT(*) OVER (PARTITION BY lat, lon) counts policyholders in the same city.", "Sum tiv_2016 over rows that pass both, rounded to 2 decimals."],
    `SELECT ROUND(SUM(tiv_2016), 2) AS tiv_2016
FROM (
  SELECT tiv_2016,
         COUNT(*) OVER (PARTITION BY tiv_2015) AS same_tiv,
         COUNT(*) OVER (PARTITION BY lat, lon) AS same_city
  FROM Insurance
) i
WHERE same_tiv > 1 AND same_city = 1;`,
    () => { const I = (hl?: number[], tone?: SqlTable["tone"]) => t("Insurance", ["pid", "tiv_2015", "tiv_2016", "lat", "lon"], [[1, 10, 5, 10, 10], [2, 20, 20, 20, 20], [3, 10, 30, 20, 20], [4, 10, 40, 40, 40]], hl, tone);
      return viz("Shared tiv_2015, unique city", [
        { note: "tiv_2015 = 10 is shared by pids 1, 3, 4; pid 2's 20 is unique", tables: [I([0, 2, 3])] },
        { note: "pids 2 and 3 share the city (20, 20)", tables: [I([1, 2], "bad")] },
        { note: "pids 1 and 4 pass both: 5 + 40 = 45", tables: [I([0, 3], "found"), t("Result", ["tiv_2016"], [["45.00"]], [0], "found")] },
      ]); }, "O(n log n)"),

  "employees-with-missing-information": sql("MySQL has no FULL JOIN, so UNION two anti-joins: ids without a salary and ids without a name.",
    ["Ids in Employees but not in Salaries are missing a salary.", "Ids in Salaries but not in Employees are missing a name.", "UNION the two lists and sort."],
    `SELECT employee_id FROM Employees
WHERE employee_id NOT IN (SELECT employee_id FROM Salaries)
UNION
SELECT employee_id FROM Salaries
WHERE employee_id NOT IN (SELECT employee_id FROM Employees)
ORDER BY employee_id;`,
    () => viz("Ids present in only one table", [
      { note: "Employee 2 has a name but no salary; employee 1 has a salary but no name", tables: [t("Employees", ["employee_id", "name"], [[2, "Crew"], [4, "Haven"], [5, "Kristian"]], [0], "bad"), t("Salaries", ["employee_id", "salary"], [[5, 76071], [1, 22517], [4, 63539]], [1], "bad")] },
      { note: "UNION the two anti-joins and sort", tables: [t("Result", ["employee_id"], [[1], [2]], [0, 1], "found")] },
    ]), "O(n log n)"),

  "count-salary-categories": sql("One SELECT per category joined with UNION ALL, each a COUNT(*) with its own WHERE.",
    ["Every category must appear even with 0 accounts. GROUP BY would drop empty groups.", "COUNT(*) with a WHERE always returns a row, 0 when nothing matches."],
    `SELECT 'Low Salary' AS category, COUNT(*) AS accounts_count
FROM Accounts WHERE income < 20000
UNION ALL
SELECT 'Average Salary', COUNT(*)
FROM Accounts WHERE income BETWEEN 20000 AND 50000
UNION ALL
SELECT 'High Salary', COUNT(*)
FROM Accounts WHERE income > 50000;`,
    () => { const A = (hl?: number[], tone?: SqlTable["tone"]) => t("Accounts", ["account_id", "income"], [[3, 108939], [2, 12747], [8, 87709], [6, 91796]], hl, tone);
      return viz("Three fixed buckets", [
        { note: "Account 2 is below 20000; accounts 3, 8, 6 are above 50000", tables: [A([1], "found")] },
        { note: "No account is in [20000, 50000], but its row still shows 0", tables: [t("Result", ["category", "accounts_count"], [["Low Salary", 1], ["Average Salary", 0], ["High Salary", 3]], [1], "found")] },
      ]); }),

  "tree-node": sql("CASE: no parent is Root, an id that appears as someone's p_id is Inner, everything else is Leaf.",
    ["p_id IS NULL marks the root; check it first so a root with children is not called Inner.", "id IN (SELECT p_id FROM Tree) means the node has a child."],
    `SELECT id,
       CASE
         WHEN p_id IS NULL THEN 'Root'
         WHEN id IN (SELECT p_id FROM Tree) THEN 'Inner'
         ELSE 'Leaf'
       END AS type
FROM Tree;`,
    () => { const T = (hl?: number[], tone?: SqlTable["tone"]) => t("Tree", ["id", "p_id"], [[1, null], [2, 1], [3, 1], [4, 2], [5, 2]], hl, tone);
      return viz("Root, inner or leaf", [
        { note: "Node 1 has no parent: Root", tables: [T([0], "found")] },
        { note: "Node 2 appears as a parent (of 4 and 5): Inner", tables: [T([3, 4])] },
        { note: "3, 4, 5 never appear as a parent: Leaf", tables: [t("Result", ["id", "type"], [[1, "Root"], [2, "Inner"], [3, "Leaf"], [4, "Leaf"], [5, "Leaf"]], [0, 1, 2, 3, 4], "found")] },
      ]); }),

  "bank-account-summary-ii": sql("JOIN users to transactions, SUM amount per account, HAVING the sum above 10000.",
    ["The balance is the sum of all amounts on the account.", "HAVING filters on the aggregated balance."],
    `SELECT u.name, SUM(t.amount) AS balance
FROM Users u
JOIN Transactions t ON t.account = u.account
GROUP BY u.account, u.name
HAVING SUM(t.amount) > 10000;`,
    () => { const T = (hl?: number[], tone?: SqlTable["tone"]) => t("Transactions", ["trans_id", "account", "amount"], [[1, 900001, 7000], [2, 900001, 7000], [3, 900001, -3000], [4, 900002, 1000], [5, 900003, 6000], [6, 900003, 6000], [7, 900003, -4000]], hl, tone);
      return viz("Balances above 10000", [
        { note: "Alice (900001): 7000 + 7000 - 3000 = 11000", tables: [T([0, 1, 2], "found")] },
        { note: "Bob has 1000, Charlie 8000; only Alice passes", tables: [t("Result", ["name", "balance"], [["Alice", 11000]], [0], "found")] },
      ]); }),

  "dna-pattern-recognition": sql("Each flag is a boolean expression, which MySQL returns as 1 or 0: LIKE for start, motif and GGG, REGEXP for the stop codons.",
    ["LIKE 'ATG%' tests the start, LIKE '%ATAT%' the motif, LIKE '%GGG%' three G's in a row.", "REGEXP 'T(AA|AG|GA)$' tests the three stop codons at the end."],
    `SELECT sample_id, dna_sequence, species,
       dna_sequence LIKE 'ATG%' AS has_start,
       dna_sequence REGEXP 'T(AA|AG|GA)$' AS has_stop,
       dna_sequence LIKE '%ATAT%' AS has_atat,
       dna_sequence LIKE '%GGG%' AS has_ggg
FROM Samples
ORDER BY sample_id;`,
    () => viz("Four pattern flags", [
      { note: "Sample 4 starts with ATG, ends with TAA, contains GGGG", tables: [t("Samples", ["sample_id", "dna_sequence", "species"], [[1, "ATGCTAGCTAGCTAA", "Human"], [2, "GGGTCAATCATC", "Human"], [3, "ATATATCGTAGCTA", "Human"], [4, "ATGGGGTCATCATAA", "Mouse"], [5, "TCAGTCAGTCAG", "Mouse"], [6, "ATATCGCGCTAG", "Zebrafish"], [7, "CGTATGCGTCGTA", "Zebrafish"]], [3], "found")] },
      { note: "Each comparison is 1 when it matches, 0 otherwise", tables: [t("Result", ["sample_id", "has_start", "has_stop", "has_atat", "has_ggg"], [[1, 1, 1, 0, 0], [2, 0, 0, 0, 1], [3, 0, 0, 1, 0], [4, 1, 1, 0, 1], [5, 0, 0, 0, 0], [6, 0, 1, 1, 0], [7, 0, 0, 0, 0]], [3], "found")] },
    ])),

  "capital-gainloss": sql("SUM with a sign: sells add the price, buys subtract it.",
    ["Every buy has a later sell, so the total gain is the sum of sell prices minus the sum of buy prices.", "SUM(CASE WHEN operation = 'Sell' THEN price ELSE -price END) per stock."],
    `SELECT stock_name,
       SUM(CASE WHEN operation = 'Sell' THEN price ELSE -price END) AS capital_gain_loss
FROM Stocks
GROUP BY stock_name;`,
    () => { const S = (hl?: number[], tone?: SqlTable["tone"]) => t("Stocks", ["stock_name", "operation", "operation_day", "price"], [["Leetcode", "Buy", 1, 1000], ["Corona Masks", "Buy", 2, 10], ["Leetcode", "Sell", 5, 9000], ["Handbags", "Buy", 17, 30000], ["Corona Masks", "Sell", 3, 1010], ["Corona Masks", "Buy", 4, 1000], ["Corona Masks", "Sell", 5, 500], ["Corona Masks", "Buy", 6, 1000], ["Handbags", "Sell", 29, 7000], ["Corona Masks", "Sell", 10, 10000]], hl, tone);
      return viz("Sells minus buys", [
        { note: "Sells count as +price", tables: [S([2, 4, 6, 8, 9], "found")] },
        { note: "Buys count as -price", tables: [S([0, 1, 3, 5, 7], "bad")] },
        { note: "Corona Masks: 1010 + 500 + 10000 - 10 - 1000 - 1000 = 9500", tables: [t("Result", ["stock_name", "capital_gain_loss"], [["Corona Masks", 9500], ["Leetcode", 8000], ["Handbags", -23000]], [0, 1, 2], "found")] },
      ]); }),

  "find-drivers-with-improved-fuel-efficiency": sql("Per driver, AVG(distance / fuel) for months 1-6 and for months 7-12 with AVG(CASE ...); keep drivers with both and a higher second half.",
    ["AVG(CASE WHEN MONTH(trip_date) <= 6 THEN distance_km / fuel_consumed END) ignores second-half trips (they are NULL), and the same for the second half.", "A driver with no trips in a half gets NULL there, and the NOT NULL filters drop them.", "Round only at the end: the improvement uses the unrounded averages."],
    `WITH halves AS (
  SELECT driver_id,
         AVG(CASE WHEN MONTH(trip_date) <= 6 THEN distance_km / fuel_consumed END) AS first_avg,
         AVG(CASE WHEN MONTH(trip_date) > 6 THEN distance_km / fuel_consumed END) AS second_avg
  FROM trips
  GROUP BY driver_id
)
SELECT d.driver_id, d.driver_name,
       ROUND(h.first_avg, 2) AS first_half_avg,
       ROUND(h.second_avg, 2) AS second_half_avg,
       ROUND(h.second_avg - h.first_avg, 2) AS efficiency_improvement
FROM halves h
JOIN drivers d ON d.driver_id = h.driver_id
WHERE h.first_avg IS NOT NULL AND h.second_avg IS NOT NULL
  AND h.second_avg > h.first_avg
ORDER BY efficiency_improvement DESC, d.driver_name;`,
    () => { const T = (hl?: number[], tone?: SqlTable["tone"]) => t("trips", ["driver_id", "trip_date", "km / fuel"], [[1, "2023-02-15", 11.81], [1, "2023-03-20", 12.12], [1, "2023-08-10", 13.64], [1, "2023-09-25", 14.4], [2, "2023-01-10", 11.11], [2, "2023-04-15", 11.36], [2, "2023-10-05", 13.33], [3, "2023-03-12", 9.41], [3, "2023-05-18", 9.78], [4, "2023-07-22", 12.5], [4, "2023-11-30", 12.73], [5, "2023-02-28", 9.57]], hl, tone);
      return viz("First half vs second half efficiency", [
        { note: "Efficiency per trip is distance / fuel", tables: [T()] },
        { note: "Drivers 3, 4 and 5 drive in only one half", tables: [T([7, 8, 9, 10, 11], "bad")] },
        { note: "Alice: 11.97 to 14.02. Bob: 11.24 to 13.33", tables: [T([0, 1, 2, 3, 4, 5, 6], "found")] },
        { note: "Bob's improvement 2.0960 rounds to 2.10, so he comes first", tables: [t("Result", ["driver_id", "driver_name", "first_half_avg", "second_half_avg", "efficiency_improvement"], [[2, "Bob Smith", "11.24", "13.33", "2.10"], [1, "Alice Johnson", "11.97", "14.02", "2.05"]], [0, 1], "found")] },
      ]); }, "O(n log n)"),

  "find-valid-emails": sql("REGEXP with the whole shape anchored: word characters, one @, letters, then .com.",
    ["^[A-Za-z0-9_]+ is the part before @ (it cannot contain another @).", "@[A-Za-z]+ is a letters-only domain and [.]com$ the fixed ending."],
    `SELECT user_id, email
FROM Users
WHERE email REGEXP '^[A-Za-z0-9_]+@[A-Za-z]+[.]com$'
ORDER BY user_id;`,
    () => { const U = (hl?: number[], tone?: SqlTable["tone"]) => t("Users", ["user_id", "email"], [[1, "alice@example.com"], [2, "bob_at_example.com"], [3, "charlie@example.net"], [4, "david@domain.com"], [5, "eve@invalid"]], hl, tone);
      return viz("Check the full address shape", [
        { note: "No @ (2), ends in .net (3), no .com (5)", tables: [U([1, 2, 4], "bad")] },
        { note: "Users 1 and 4 match", tables: [U([0, 3], "found")] },
      ]); }),

  "project-employees-i": sql("JOIN Project to Employee and AVG(experience_years) per project.",
    ["Each project row brings in its employee's experience.", "Average per project, rounded to 2 decimals."],
    `SELECT p.project_id, ROUND(AVG(e.experience_years), 2) AS average_years
FROM Project p
JOIN Employee e ON e.employee_id = p.employee_id
GROUP BY p.project_id;`,
    () => viz("Average experience per project", [
      { note: "Project 1 has employees 1, 2, 3 (3, 2, 1 years)", tables: [t("Project", ["project_id", "employee_id"], [[1, 1], [1, 2], [1, 3], [2, 1], [2, 4]], [0, 1, 2]), t("Employee", ["employee_id", "name", "experience_years"], [[1, "Khaled", 3], [2, "Ali", 2], [3, "John", 1], [4, "Doe", 2]])] },
      { note: "Project 1: (3 + 2 + 1) / 3 = 2.00. Project 2: (3 + 2) / 2 = 2.50", tables: [t("Result", ["project_id", "average_years"], [[1, "2.00"], [2, "2.50"]], [0, 1], "found")] },
    ])),

  "department-highest-salary": sql("Keep employees whose (departmentId, salary) matches the department's MAX(salary), then join the department name.",
    ["A subquery gives MAX(salary) per departmentId.", "IN with the pair keeps every employee tied at the top."],
    `SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM Employee e
JOIN Department d ON d.id = e.departmentId
WHERE (e.departmentId, e.salary) IN (
  SELECT departmentId, MAX(salary)
  FROM Employee
  GROUP BY departmentId
);`,
    () => { const E = (hl?: number[], tone?: SqlTable["tone"]) => t("Employee", ["id", "name", "salary", "departmentId"], [[1, "Joe", 70000, 1], [2, "Jim", 90000, 1], [3, "Henry", 80000, 2], [4, "Sam", 60000, 2], [5, "Max", 90000, 1]], hl, tone);
      return viz("Top salary per department, ties included", [
        { note: "Max per department: IT (1) is 90000, Sales (2) is 80000", tables: [E(), t("Department", ["id", "name"], [[1, "IT"], [2, "Sales"]])] },
        { note: "Jim and Max tie at 90000 in IT; Henry tops Sales", tables: [E([1, 2, 4], "found"), t("Result", ["Department", "Employee", "Salary"], [["IT", "Jim", 90000], ["Sales", "Henry", 80000], ["IT", "Max", 90000]], [0, 1, 2], "found")] },
      ]); }),

  "game-play-analysis-iv": sql("Find each player's first login, LEFT JOIN a login on the next day, and divide matches by players.",
    ["A subquery gives MIN(event_date) per player.", "LEFT JOIN Activity on the same player and first date + 1 day; COUNT(a.player_id) counts only players who came back.", "Divide by COUNT(*) (all players) and round to 2."],
    `SELECT ROUND(COUNT(a.player_id) / COUNT(*), 2) AS fraction
FROM (
  SELECT player_id, MIN(event_date) AS first_day
  FROM Activity
  GROUP BY player_id
) f
LEFT JOIN Activity a
  ON a.player_id = f.player_id
 AND a.event_date = DATE_ADD(f.first_day, INTERVAL 1 DAY);`,
    () => { const A = (hl?: number[], tone?: SqlTable["tone"]) => t("Activity", ["player_id", "device_id", "event_date", "games_played"], [[1, 2, "2016-03-01", 5], [1, 2, "2016-03-02", 6], [2, 3, "2017-06-25", 1], [3, 1, "2016-03-02", 0], [3, 4, "2018-07-03", 5]], hl, tone);
      return viz("Back on the day after the first login", [
        { note: "First logins: player 1 on 2016-03-01, 2 on 2017-06-25, 3 on 2016-03-02", tables: [A([0, 2, 3])] },
        { note: "Only player 1 logs in on the next day (2016-03-02)", tables: [A([1], "found")] },
        { note: "1 of 3 players", tables: [t("Result", ["fraction"], [["0.33"]], [0], "found")] },
      ]); }),

  "game-play-analysis-i": sql("GROUP BY player_id, MIN(event_date).",
    ["The first login is the earliest event_date of each player."],
    `SELECT player_id, MIN(event_date) AS first_login
FROM Activity
GROUP BY player_id;`,
    () => { const A = (hl?: number[], tone?: SqlTable["tone"]) => t("Activity", ["player_id", "device_id", "event_date", "games_played"], [[1, 2, "2016-03-01", 5], [1, 2, "2016-05-02", 6], [2, 3, "2017-06-25", 1], [3, 1, "2016-03-02", 0], [3, 4, "2018-07-03", 5]], hl, tone);
      return viz("Earliest date per player", [
        { note: "The earliest row of each player", tables: [A([0, 2, 3], "found")] },
        { note: "Result", tables: [t("Result", ["player_id", "first_login"], [[1, "2016-03-01"], [2, "2017-06-25"], [3, "2016-03-02"]], [0, 1, 2], "found")] },
      ]); }),

  "consecutive-numbers": sql("Self-join Logs three times on id, id + 1, id + 2 and keep rows where all three nums match.",
    ["l1, l2, l3 are three rows in a row by id.", "If their nums are equal, that number appears 3 times consecutively.", "DISTINCT because a run of 4 or more would report the number more than once."],
    `SELECT DISTINCT l1.num AS ConsecutiveNums
FROM Logs l1
JOIN Logs l2 ON l2.id = l1.id + 1
JOIN Logs l3 ON l3.id = l1.id + 2
WHERE l1.num = l2.num AND l2.num = l3.num;`,
    () => { const L = (hl?: number[], tone?: SqlTable["tone"]) => t("Logs", ["id", "num"], [[1, 1], [2, 1], [3, 1], [4, 2], [5, 1], [6, 2], [7, 2]], hl, tone);
      return viz("Three equal values in a row", [
        { note: "Ids 1, 2, 3 all hold 1", tables: [L([0, 1, 2], "found")] },
        { note: "Ids 6, 7 hold 2, but there is no third", tables: [L([5, 6], "bad")] },
        { note: "Result", tables: [t("Result", ["ConsecutiveNums"], [[1]], [0], "found")] },
      ]); }),

  "second-highest-salary": sql("MAX of the salaries below the overall MAX; an empty set gives NULL on its own.",
    ["The inner MAX is the highest salary.", "The largest salary strictly below it is the second highest distinct salary.", "If no salary is smaller, MAX of nothing is NULL, as required."],
    `SELECT MAX(salary) AS SecondHighestSalary
FROM Employee
WHERE salary < (SELECT MAX(salary) FROM Employee);`,
    () => viz("Largest below the largest", [
      { note: "The highest salary is 300; salaries below it are 100 and 200", tables: [t("Employee", ["id", "salary"], [[1, 100], [2, 200], [3, 300]], [0, 1])] },
      { note: "MAX of those is 200", tables: [t("Result", ["SecondHighestSalary"], [[200]], [0], "found")] },
      { note: "With only 100, nothing is below the max, so MAX returns null", tables: [t("Employee", ["id", "salary"], [[1, 100]]), t("Result", ["SecondHighestSalary"], [[null]], [0], "bad")] },
    ])),

  "find-followers-count": sql("GROUP BY user_id, COUNT(follower_id), sorted by user_id.",
    ["(user_id, follower_id) is unique, so each row is one follower."],
    `SELECT user_id, COUNT(follower_id) AS followers_count
FROM Followers
GROUP BY user_id
ORDER BY user_id;`,
    () => viz("Followers per user", [
      { note: "User 2 is followed by 0 and 1", tables: [t("Followers", ["user_id", "follower_id"], [[0, 1], [1, 0], [2, 0], [2, 1]], [2, 3], "found")] },
      { note: "Result", tables: [t("Result", ["user_id", "followers_count"], [[0, 1], [1, 1], [2, 2]], [2], "found")] },
    ]), "O(n log n)"),

  "monthly-transactions-i": sql("GROUP BY DATE_FORMAT(trans_date, '%Y-%m') and country, with conditional sums for the approved columns.",
    ["DATE_FORMAT turns a date into its month like 2018-12.", "COUNT(*) and SUM(amount) cover all transactions.", "SUM(state = 'approved') counts approved ones; SUM(CASE ... THEN amount ELSE 0 END) adds their amounts."],
    `SELECT DATE_FORMAT(trans_date, '%Y-%m') AS month, country,
       COUNT(*) AS trans_count,
       SUM(state = 'approved') AS approved_count,
       SUM(amount) AS trans_total_amount,
       SUM(CASE WHEN state = 'approved' THEN amount ELSE 0 END) AS approved_total_amount
FROM Transactions
GROUP BY month, country;`,
    () => { const T = (hl?: number[], tone?: SqlTable["tone"]) => t("Transactions", ["id", "country", "state", "amount", "trans_date"], [[121, "US", "approved", 1000, "2018-12-18"], [122, "US", "declined", 2000, "2018-12-19"], [123, "US", "approved", 2000, "2019-01-01"], [124, "DE", "approved", 2000, "2019-01-07"]], hl, tone);
      return viz("Totals per month and country", [
        { note: "2018-12, US has two transactions; only 121 is approved", tables: [T([0], "found")] },
        { note: "Declined 122 counts in the totals but not in the approved columns", tables: [T([1], "bad")] },
        { note: "Result", tables: [t("Result", ["month", "country", "trans_count", "approved_count", "trans_total_amount", "approved_total_amount"], [["2018-12", "US", 2, 1, 3000, 1000], ["2019-01", "US", 1, 1, 2000, 2000], ["2019-01", "DE", 1, 1, 2000, 2000]], [0], "found")] },
      ]); }),

  "number-of-unique-subjects-taught-by-each-teacher": sql("GROUP BY teacher_id, COUNT(DISTINCT subject_id).",
    ["A teacher can teach the same subject in several departments; DISTINCT counts it once."],
    `SELECT teacher_id, COUNT(DISTINCT subject_id) AS cnt
FROM Teacher
GROUP BY teacher_id;`,
    () => viz("Distinct subjects per teacher", [
      { note: "Teacher 1 teaches subject 2 in two departments", tables: [t("Teacher", ["teacher_id", "subject_id", "dept_id"], [[1, 2, 3], [1, 2, 4], [1, 3, 3], [2, 1, 1], [2, 2, 1], [2, 3, 1], [2, 4, 1]], [0, 1], "bad")] },
      { note: "Teacher 1: subjects {2, 3}. Teacher 2: {1, 2, 3, 4}", tables: [t("Result", ["teacher_id", "cnt"], [[1, 2], [2, 4]], [0, 1], "found")] },
    ])),

  "movie-rating": sql("Two ORDER BY ... LIMIT 1 queries glued with UNION ALL: top rater by count then name, top February movie by average then title.",
    ["Count ratings per user, sort by count desc then name, take 1.", "Average February 2020 ratings per movie, sort by average desc then title, take 1.", "UNION ALL, not UNION: if the name and the title were equal, UNION would merge them into one row."],
    `(SELECT u.name AS results
 FROM MovieRating r
 JOIN Users u ON u.user_id = r.user_id
 GROUP BY u.user_id, u.name
 ORDER BY COUNT(*) DESC, u.name
 LIMIT 1)
UNION ALL
(SELECT m.title
 FROM MovieRating r
 JOIN Movies m ON m.movie_id = r.movie_id
 WHERE r.created_at >= '2020-02-01' AND r.created_at < '2020-03-01'
 GROUP BY m.movie_id, m.title
 ORDER BY AVG(r.rating) DESC, m.title
 LIMIT 1);`,
    () => { const R = (hl?: number[], tone?: SqlTable["tone"]) => t("MovieRating", ["movie_id", "user_id", "rating", "created_at"], [[1, 1, 3, "2020-01-12"], [1, 2, 4, "2020-02-11"], [1, 3, 2, "2020-02-12"], [1, 4, 1, "2020-01-01"], [2, 1, 5, "2020-02-17"], [2, 2, 2, "2020-02-01"], [2, 3, 2, "2020-03-01"], [3, 1, 3, "2020-02-22"], [3, 2, 4, "2020-02-25"]], hl, tone);
      return viz("Top rater and top February movie", [
        { note: "Daniel (1) and Monica (2) rated 3 movies each; Daniel wins on name", tables: [R([0, 4, 7], "found")] },
        { note: "February ratings: Avengers 3.0, Frozen 2 3.5, Joker 3.5", tables: [R([1, 2, 4, 5, 7, 8])] },
        { note: "Frozen 2 and Joker tie at 3.5; Frozen 2 wins on title", tables: [t("Result", ["results"], [["Daniel"], ["Frozen 2"]], [0, 1], "found")] },
      ]); }, "O(n log n)"),

  "managers-with-at-least-5-direct-reports": sql("Join each employee to their manager, GROUP BY manager, HAVING COUNT(*) >= 5.",
    ["e.managerId = m.id lines up each report with their manager.", "Group by the manager's id (names may repeat) and keep groups of 5 or more."],
    `SELECT m.name
FROM Employee e
JOIN Employee m ON m.id = e.managerId
GROUP BY m.id, m.name
HAVING COUNT(*) >= 5;`,
    () => viz("Managers with 5+ reports", [
      { note: "Dan, James, Amy, Anne and Ron all report to 101", tables: [t("Employee", ["id", "name", "department", "managerId"], [[101, "John", "A", null], [102, "Dan", "A", 101], [103, "James", "A", 101], [104, "Amy", "A", 101], [105, "Anne", "A", 101], [106, "Ron", "B", 101]], [1, 2, 3, 4, 5], "found")] },
      { note: "John has 5 direct reports", tables: [t("Result", ["name"], [["John"]], [0], "found")] },
    ])),

  "sales-person": sql("Find the sales_ids with an order to RED, then return everyone NOT IN that list.",
    ["Join Orders to Company and keep orders where the company name is RED.", "Salespeople whose id is not in that set never sold to RED."],
    `SELECT name
FROM SalesPerson
WHERE sales_id NOT IN (
  SELECT o.sales_id
  FROM Orders o
  JOIN Company c ON c.com_id = o.com_id
  WHERE c.name = 'RED'
);`,
    () => { const O = (hl?: number[], tone?: SqlTable["tone"]) => t("Orders", ["order_id", "com_id", "sales_id", "amount"], [[1, 3, 4, 10000], [2, 4, 5, 5000], [3, 1, 1, 50000], [4, 1, 4, 25000]], hl, tone);
      return viz("Salespeople with no RED orders", [
        { note: "RED is com_id 1. Orders 3 and 4 go to RED, by salespeople 1 (John) and 4 (Pam)", tables: [t("Company", ["com_id", "name"], [[1, "RED"], [2, "ORANGE"], [3, "YELLOW"], [4, "GREEN"]], [0], "bad"), O([2, 3], "bad")] },
        { note: "Everyone else: Amy, Mark, Alex", tables: [t("Result", ["name"], [["Amy"], ["Mark"], ["Alex"]], [0, 1, 2], "found")] },
      ]); }),

  "fix-names-in-a-table": sql("CONCAT(UPPER(LEFT(name, 1)), LOWER(SUBSTRING(name, 2))).",
    ["LEFT(name, 1) is the first letter; make it uppercase.", "SUBSTRING(name, 2) is the rest; make it lowercase."],
    `SELECT user_id,
       CONCAT(UPPER(LEFT(name, 1)), LOWER(SUBSTRING(name, 2))) AS name
FROM Users
ORDER BY user_id;`,
    () => viz("Capitalise the first letter only", [
      { note: "aLice: 'a' to 'A', 'Lice' to 'lice'", tables: [t("Users", ["user_id", "name"], [[1, "aLice"], [2, "bOB"]])] },
      { note: "Result", tables: [t("Result", ["user_id", "name"], [[1, "Alice"], [2, "Bob"]], [0, 1], "found")] },
    ]), "O(n log n)"),

  "find-product-recommendation-pairs": sql("Self-join purchases on user_id with product1 < product2, count users per pair, keep pairs with 3+, then add both categories.",
    ["Joining a user's purchases with themselves lists every pair of products they bought; a.product_id < b.product_id keeps each pair once.", "(user_id, product_id) is unique, so COUNT(*) per pair is the number of distinct customers.", "Join ProductInfo twice for the two categories."],
    `SELECT a.product_id AS product1_id, b.product_id AS product2_id,
       p1.category AS product1_category, p2.category AS product2_category,
       COUNT(*) AS customer_count
FROM ProductPurchases a
JOIN ProductPurchases b
  ON b.user_id = a.user_id AND a.product_id < b.product_id
JOIN ProductInfo p1 ON p1.product_id = a.product_id
JOIN ProductInfo p2 ON p2.product_id = b.product_id
GROUP BY a.product_id, b.product_id, p1.category, p2.category
HAVING COUNT(*) >= 3
ORDER BY customer_count DESC, product1_id, product2_id;`,
    () => { const P = (hl?: number[], tone?: SqlTable["tone"]) => t("ProductPurchases", ["user_id", "product_id"], [[1, 101], [1, 102], [1, 103], [2, 101], [2, 102], [2, 104], [3, 101], [3, 103], [3, 105], [4, 101], [4, 102], [4, 103], [4, 104], [5, 102], [5, 104]], hl, tone);
      return viz("Products bought together by 3+ customers", [
        { note: "Pair (101, 102): users 1, 2 and 4 bought both", tables: [P([0, 1, 3, 4, 9, 10], "found")] },
        { note: "Pair (101, 103): users 1, 3, 4. Pair (102, 104): users 2, 4, 5", tables: [P([0, 2, 6, 7, 9, 11])] },
        { note: "Every other pair has fewer than 3 customers", tables: [t("Result", ["product1_id", "product2_id", "product1_category", "product2_category", "customer_count"], [[101, 102, "Electronics", "Books", 3], [101, 103, "Electronics", "Clothing", 3], [102, 104, "Books", "Kitchen", 3]], [0, 1, 2], "found")] },
      ]); }, "O(n · k)"),

  "the-number-of-employees-which-report-to-each-employee": sql("Self-join reports to their manager, then COUNT and ROUND(AVG(age)) per manager.",
    ["e.reports_to = m.employee_id pairs every report with their manager; employees nobody reports to drop out.", "Count the reports and average their ages, rounded to the nearest integer."],
    `SELECT m.employee_id, m.name,
       COUNT(*) AS reports_count,
       ROUND(AVG(e.age)) AS average_age
FROM Employees e
JOIN Employees m ON m.employee_id = e.reports_to
GROUP BY m.employee_id, m.name
ORDER BY m.employee_id;`,
    () => { const E = (hl?: number[], tone?: SqlTable["tone"]) => t("Employees", ["employee_id", "name", "reports_to", "age"], [[9, "Hercy", null, 43], [6, "Alice", 9, 41], [4, "Bob", 9, 36], [2, "Winston", null, 37]], hl, tone);
      return viz("Reports per manager", [
        { note: "Alice and Bob report to Hercy (9); nobody reports to Winston", tables: [E([1, 2], "found")] },
        { note: "2 reports, average age (41 + 36) / 2 = 38.5, rounded to 39", tables: [t("Result", ["employee_id", "name", "reports_count", "average_age"], [[9, "Hercy", 2, 39]], [0], "found")] },
      ]); }, "O(n log n)"),

  "most-common-course-pairs": sql("Keep users with 5+ courses and average rating 4+, pair each course with the next one using LEAD, and count the pairs.",
    ["A CTE picks top performers: GROUP BY user_id HAVING COUNT(*) >= 5 AND AVG(course_rating) >= 4.", "LEAD(course_name) over completion_date per user gives the course taken right after each one.", "Drop the last course of each user (its LEAD is NULL), then count each (first, second) pair."],
    `WITH top_users AS (
  SELECT user_id
  FROM course_completions
  GROUP BY user_id
  HAVING COUNT(*) >= 5 AND AVG(course_rating) >= 4
), seq AS (
  SELECT c.course_name AS first_course,
         LEAD(c.course_name) OVER (PARTITION BY c.user_id ORDER BY c.completion_date) AS second_course
  FROM course_completions c
  JOIN top_users u ON u.user_id = c.user_id
)
SELECT first_course, second_course, COUNT(*) AS transition_count
FROM seq
WHERE second_course IS NOT NULL
GROUP BY first_course, second_course
ORDER BY transition_count DESC, first_course, second_course;`,
    () => { const U = (hl?: number[], tone?: SqlTable["tone"]) => t("Per user", ["user_id", "courses", "avg_rating"], [[1, 6, 4.5], [2, 5, 4.4], [3, 5, 2.8], [4, 3, 5.0]], hl, tone);
      return viz("Next-course pairs among top students", [
        { note: "User 3's average is too low; user 4 has only 3 courses", tables: [U([2, 3], "bad")] },
        { note: "Users 1 and 2 qualify", tables: [U([0, 1], "found")] },
        { note: "LEAD pairs each course with the next one by date", tables: [t("Pairs", ["user_id", "first_course", "second_course"], [[1, "Python Basics", "SQL Fundamentals"], [1, "SQL Fundamentals", "JavaScript"], [1, "JavaScript", "React Basics"], [1, "React Basics", "Node.js"], [1, "Node.js", "Docker"], [2, "Python Basics", "React Basics"], [2, "React Basics", "Node.js"], [2, "Node.js", "Docker"], [2, "Docker", "AWS Fundamentals"]], [3, 4, 6, 7], "found")] },
        { note: "React Basics to Node.js and Node.js to Docker happen twice", tables: [t("Result", ["first_course", "second_course", "transition_count"], [["Node.js", "Docker", 2], ["React Basics", "Node.js", 2], ["Docker", "AWS Fundamentals", 1], ["JavaScript", "React Basics", 1], ["Python Basics", "React Basics", 1], ["Python Basics", "SQL Fundamentals", 1], ["SQL Fundamentals", "JavaScript", 1]], [0, 1], "found")] },
      ]); }, "O(n log n)"),

  "analyze-organization-hierarchy": sql("A recursive CTE lists every (boss, employee under them, including self) pair; group by boss for team size and budget, by employee for level.",
    ["Start with each employee as their own boss, then repeatedly add employees whose manager is already under that boss.", "For a boss: team_size = pairs - 1 (minus themselves) and budget = SUM of salaries in the pairs.", "For an employee: level = number of pairs where they are under someone (their ancestors plus themselves)."],
    `WITH RECURSIVE tree AS (
  SELECT employee_id AS boss, employee_id AS emp, salary
  FROM Employees
  UNION ALL
  SELECT t.boss, e.employee_id, e.salary
  FROM tree t
  JOIN Employees e ON e.manager_id = t.emp
), levels AS (
  SELECT emp, COUNT(*) AS level
  FROM tree
  GROUP BY emp
)
SELECT e.employee_id, e.employee_name, l.level,
       COUNT(*) - 1 AS team_size,
       SUM(t.salary) AS budget
FROM Employees e
JOIN tree t ON t.boss = e.employee_id
JOIN levels l ON l.emp = e.employee_id
GROUP BY e.employee_id, e.employee_name, l.level
ORDER BY l.level, budget DESC, e.employee_name;`,
    () => { const E = (hl?: number[], tone?: SqlTable["tone"]) => t("Employees", ["employee_id", "employee_name", "manager_id", "salary"], [[1, "Alice", null, 12000], [2, "Bob", 1, 10000], [3, "Charlie", 1, 10000], [4, "David", 2, 7500], [5, "Eva", 2, 7500], [6, "Frank", 3, 9000], [7, "Grace", 3, 8500], [8, "Hank", 4, 6000], [9, "Ivy", 6, 7000], [10, "Judy", 6, 7000]], hl, tone);
      return viz("Everyone under each manager", [
        { note: "Pairs under Frank (6): Frank, Ivy, Judy. Budget 9000 + 7000 + 7000 = 23000", tables: [E([5, 8, 9], "found")] },
        { note: "Under Bob (2): Bob, David, Eva, Hank. Team size 3, budget 31000", tables: [E([1, 3, 4, 7], "found")] },
        { note: "Hank sits under David, Bob, Alice and himself: 4 pairs, so level 4", tables: [E([0, 1, 3, 7])] },
        { note: "Sorted by level, then budget descending, then name", tables: [t("Result", ["employee_id", "employee_name", "level", "team_size", "budget"], [[1, "Alice", 1, 9, 84500], [3, "Charlie", 2, 4, 41500], [2, "Bob", 2, 3, 31000], [6, "Frank", 3, 2, 23000], [4, "David", 3, 1, 13500], [7, "Grace", 3, 0, 8500], [5, "Eva", 3, 0, 7500], [9, "Ivy", 4, 0, 7000], [10, "Judy", 4, 0, 7000], [8, "Hank", 4, 0, 6000]], [0, 1, 2], "found")] },
      ]); }, "O(n · depth)"),

  "trips-and-users": sql("Join Users twice to drop trips with a banned client or driver, then average the 'not completed' flag per day.",
    ["Inner joins with banned = 'No' on both the client and the driver keep only unbanned trips.", "status <> 'completed' is 1 for a cancelled trip; its average is the cancellation rate.", "Filter the three days and group by request_at."],
    `SELECT t.request_at AS Day,
       ROUND(AVG(t.status <> 'completed'), 2) AS \`Cancellation Rate\`
FROM Trips t
JOIN Users c ON c.users_id = t.client_id AND c.banned = 'No'
JOIN Users d ON d.users_id = t.driver_id AND d.banned = 'No'
WHERE t.request_at BETWEEN '2013-10-01' AND '2013-10-03'
GROUP BY t.request_at;`,
    () => { const T = (hl?: number[], tone?: SqlTable["tone"]) => t("Trips", ["id", "client_id", "driver_id", "status", "request_at"], [[1, 1, 10, "completed", "2013-10-01"], [2, 2, 11, "cancelled_by_driver", "2013-10-01"], [3, 3, 12, "completed", "2013-10-01"], [4, 4, 13, "cancelled_by_client", "2013-10-01"], [5, 1, 10, "completed", "2013-10-02"], [6, 2, 11, "completed", "2013-10-02"], [7, 3, 12, "completed", "2013-10-02"], [8, 2, 12, "completed", "2013-10-03"], [9, 3, 10, "completed", "2013-10-03"], [10, 4, 13, "cancelled_by_driver", "2013-10-03"]], hl, tone);
      return viz("Cancellation rate among unbanned users", [
        { note: "Client 2 is banned, so trips 2, 6 and 8 are ignored", tables: [T([1, 5, 7], "bad")] },
        { note: "Cancelled unbanned trips: 4 (on 10-01) and 10 (on 10-03)", tables: [T([3, 9], "found")] },
        { note: "10-01: 1 of 3. 10-02: 0 of 2. 10-03: 1 of 2", tables: [t("Result", ["Day", "Cancellation Rate"], [["2013-10-01", "0.33"], ["2013-10-02", "0.00"], ["2013-10-03", "0.50"]], [0, 1, 2], "found")] },
      ]); }),

  "find-zombie-sessions": sql("GROUP BY session and test all four rules in HAVING with conditional sums and TIMESTAMPDIFF.",
    ["Duration is TIMESTAMPDIFF(MINUTE, first event, last event).", "SUM(event_type = 'scroll') and SUM(event_type = 'click') count each type; purchases must be 0.", "Clicks / scrolls must be below 0.20."],
    `SELECT session_id, user_id,
       TIMESTAMPDIFF(MINUTE, MIN(event_timestamp), MAX(event_timestamp)) AS session_duration_minutes,
       SUM(event_type = 'scroll') AS scroll_count
FROM app_events
GROUP BY session_id, user_id
HAVING session_duration_minutes > 30
   AND scroll_count >= 5
   AND SUM(event_type = 'click') / SUM(event_type = 'scroll') < 0.2
   AND SUM(event_type = 'purchase') = 0
ORDER BY scroll_count DESC, session_id;`,
    () => { const G = (hl?: number[], tone?: SqlTable["tone"]) => t("Per session", ["session_id", "minutes", "scrolls", "clicks", "purchases"], [["S001", 35, 6, 0, 0], ["S002", 20, 2, 2, 1], ["S003", 60, 5, 1, 0], ["S004", 12, 2, 1, 0]], hl, tone);
      return viz("Long sessions, lots of scrolling, no clicks or buys", [
        { note: "Summarise each session", tables: [G()] },
        { note: "S002 is short and has a purchase; S004 is short with 2 scrolls; S003's ratio 1/5 = 0.20 is not below 0.20", tables: [G([1, 2, 3], "bad")] },
        { note: "S001: 35 minutes, 6 scrolls, 0 clicks, no purchase", tables: [G([0], "found"), t("Result", ["session_id", "user_id", "session_duration_minutes", "scroll_count"], [["S001", 201, 35, 6]], [0], "found")] },
      ]); }, "O(n log n)"),

  "find-category-recommendation-pairs": sql("Reduce purchases to distinct (user, category), self-join on user with category1 < category2, and count users per pair.",
    ["Join ProductInfo and take DISTINCT (user_id, category): buying two books still means one Books customer.", "Self-join that set on user_id with a.category < b.category to list each category pair once per user.", "COUNT(*) per pair is then the number of distinct customers; keep 3 or more."],
    `WITH uc AS (
  SELECT DISTINCT p.user_id, i.category
  FROM ProductPurchases p
  JOIN ProductInfo i ON i.product_id = p.product_id
)
SELECT a.category AS category1, b.category AS category2,
       COUNT(*) AS customer_count
FROM uc a
JOIN uc b ON b.user_id = a.user_id AND a.category < b.category
GROUP BY a.category, b.category
HAVING COUNT(*) >= 3
ORDER BY customer_count DESC, category1, category2;`,
    () => { const U = (hl?: number[], tone?: SqlTable["tone"]) => t("Distinct (user, category)", ["user_id", "categories"], [[1, "Books, Clothing, Electronics, Sports"], [2, "Books, Clothing, Electronics"], [3, "Books, Electronics, Kitchen, Sports"], [4, "Clothing, Electronics, Kitchen, Sports"], [5, "Books, Clothing"]], hl, tone);
      return viz("Categories bought by the same customers", [
        { note: "Map each product to its category and drop repeats per user", tables: [U()] },
        { note: "Books and Clothing together: users 1, 2, 5", tables: [U([0, 1, 4], "found")] },
        { note: "Clothing and Sports: only users 1 and 4, so it is dropped", tables: [U([0, 3], "bad")] },
        { note: "Pairs with 3 customers, sorted by name", tables: [t("Result", ["category1", "category2", "customer_count"], [["Books", "Clothing", 3], ["Books", "Electronics", 3], ["Clothing", "Electronics", 3], ["Electronics", "Sports", 3]], [0, 1, 2, 3], "found")] },
      ]); }, "O(n · k)"),

  "find-users-with-persistent-behavior-patterns": sql("Keep one-action days, find runs of the same action on consecutive dates (date minus ROW_NUMBER is constant in a run), then pick each user's best run of 5+.",
    ["Drop (user, date) pairs with more than one action.", "Within (user, action) ordered by date, action_date - ROW_NUMBER days stays the same along a run of consecutive days: that is the run key.", "Keep runs of 5+ days and rank them per user by length desc, action asc, start date desc; take rank 1."],
    `WITH single AS (
  SELECT user_id, action_date, MIN(action) AS action
  FROM activity
  GROUP BY user_id, action_date
  HAVING COUNT(*) = 1
), keyed AS (
  SELECT user_id, action, action_date,
         DATE_SUB(action_date, INTERVAL ROW_NUMBER() OVER (PARTITION BY user_id, action ORDER BY action_date) DAY) AS grp
  FROM single
), runs AS (
  SELECT user_id, action, COUNT(*) AS streak_length,
         MIN(action_date) AS start_date, MAX(action_date) AS end_date
  FROM keyed
  GROUP BY user_id, action, grp
  HAVING COUNT(*) >= 5
), best AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY streak_length DESC, action, start_date DESC) AS rn
  FROM runs
)
SELECT user_id, action, streak_length, start_date, end_date
FROM best
WHERE rn = 1
ORDER BY streak_length DESC, user_id;`,
    () => { const R = (hl?: number[], tone?: SqlTable["tone"]) => t("Runs", ["user_id", "action", "days", "start", "end"], [[1, "login", 5, "2024-01-01", "2024-01-05"], [1, "logout", 1, "2024-01-06", "2024-01-06"], [2, "click", 4, "2024-01-01", "2024-01-04"], [3, "view", 7, "2024-01-01", "2024-01-07"]], hl, tone);
      return viz("Longest same-action streak", [
        { note: "Group consecutive days with the same action into runs", tables: [R()] },
        { note: "Runs shorter than 5 days drop: user 1 logout, user 2 click (4 days)", tables: [R([1, 2], "bad")] },
        { note: "Best run per user, longest first", tables: [t("Result", ["user_id", "action", "streak_length", "start_date", "end_date"], [[3, "view", 7, "2024-01-01", "2024-01-07"], [1, "login", 5, "2024-01-01", "2024-01-05"]], [0, 1], "found")] },
      ]); }, "O(n log n)"),

  "human-traffic-of-stadium": sql("Keep rows with 100+ people; id - ROW_NUMBER() is constant along consecutive ids, so group on it and keep groups of 3+.",
    ["Filter people >= 100.", "Among those rows, id minus their ROW_NUMBER by id stays equal while ids are consecutive.", "Count each group with a window and keep rows whose group has at least 3 rows."],
    `WITH busy AS (
  SELECT id, visit_date, people,
         id - ROW_NUMBER() OVER (ORDER BY id) AS grp
  FROM Stadium
  WHERE people >= 100
)
SELECT id, visit_date, people
FROM (SELECT *, COUNT(*) OVER (PARTITION BY grp) AS len FROM busy) b
WHERE len >= 3
ORDER BY visit_date;`,
    () => { const S = (hl?: number[], tone?: SqlTable["tone"]) => t("Stadium", ["id", "visit_date", "people"], [[1, "2017-01-01", 10], [2, "2017-01-02", 109], [3, "2017-01-03", 150], [4, "2017-01-04", 99], [5, "2017-01-05", 145], [6, "2017-01-06", 1455], [7, "2017-01-07", 199], [8, "2017-01-09", 188]], hl, tone);
      return viz("Runs of 3+ busy ids", [
        { note: "Ids 1 and 4 have fewer than 100 people", tables: [S([0, 3], "bad")] },
        { note: "Busy run 2-3 is only 2 long; run 5-8 is 4 long", tables: [S([4, 5, 6, 7], "found")] },
        { note: "Result", tables: [t("Result", ["id", "visit_date", "people"], [[5, "2017-01-05", 145], [6, "2017-01-06", 1455], [7, "2017-01-07", 199], [8, "2017-01-09", 188]], [0, 1, 2, 3], "found")] },
      ]); }, "O(n log n)"),

  "department-top-three-salaries": sql("DENSE_RANK salaries per department, keep ranks 1 to 3.",
    ["DENSE_RANK over salary DESC per departmentId gives equal salaries the same rank with no gaps, matching 'top three unique salaries'.", "Join Department for the name."],
    `SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM (
  SELECT name, salary, departmentId,
         DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC) AS rnk
  FROM Employee
) e
JOIN Department d ON d.id = e.departmentId
WHERE e.rnk <= 3;`,
    () => { const E = (hl?: number[], tone?: SqlTable["tone"]) => t("Employee (IT)", ["name", "salary", "dense_rank"], [["Max", 90000, 1], ["Joe", 85000, 2], ["Randy", 85000, 2], ["Will", 70000, 3], ["Janet", 69000, 4]], hl, tone);
      return viz("Top three distinct salaries", [
        { note: "Joe and Randy tie at rank 2; Will is rank 3", tables: [E([0, 1, 2, 3], "found")] },
        { note: "Janet is rank 4 and drops", tables: [E([4], "bad")] },
        { note: "Sales has only Henry and Sam", tables: [t("Result", ["Department", "Employee", "Salary"], [["IT", "Max", 90000], ["IT", "Joe", 85000], ["IT", "Randy", 85000], ["IT", "Will", 70000], ["Sales", "Henry", 80000], ["Sales", "Sam", 60000]], [0, 1, 2, 3, 4, 5], "found")] },
      ]); }, "O(n log n)"),

  "first-letter-capitalization-ii": sql("Recursive CTE walks the text one character at a time: uppercase after a space or hyphen, lowercase otherwise, and copy words that start with a non-letter unchanged.",
    ["Each step reads the character at position i and remembers the previous character.", "At the start of a word (previous is a space) decide whether the word starts with a letter; if not, copy that whole word as is.", "Otherwise a letter after a space or a hyphen becomes uppercase and every other letter lowercase. The row where i passes the end holds the answer."],
    `WITH RECURSIVE walk AS (
  SELECT content_id, content_text, 1 AS i,
         CAST('' AS CHAR(1000)) AS converted, CAST(' ' AS CHAR(1)) AS prev, 0 AS keep_word
  FROM user_content
  UNION ALL
  SELECT content_id, content_text, i + 1,
         CONCAT(converted, CASE
           WHEN SUBSTRING(content_text, i, 1) = ' ' THEN ' '
           WHEN (prev = ' ' AND SUBSTRING(content_text, i, 1) NOT REGEXP '[A-Za-z]')
             OR (prev <> ' ' AND keep_word = 1) THEN SUBSTRING(content_text, i, 1)
           WHEN prev IN (' ', '-') THEN UPPER(SUBSTRING(content_text, i, 1))
           ELSE LOWER(SUBSTRING(content_text, i, 1))
         END),
         SUBSTRING(content_text, i, 1),
         CASE
           WHEN prev = ' ' THEN SUBSTRING(content_text, i, 1) NOT REGEXP '[A-Za-z]'
           ELSE keep_word
         END
  FROM walk
  WHERE i <= CHAR_LENGTH(content_text)
)
SELECT content_id, content_text AS original_text, converted AS converted_text
FROM walk
WHERE i = CHAR_LENGTH(content_text) + 1;`,
    () => viz("Character by character", [
      { note: "'QUICK-brown': Q follows a space (upper), UICK lower, b follows '-' (upper), rown lower", tables: [t("user_content", ["content_id", "content_text"], [[1, "hello world of SQL"], [2, "the QUICK-brown fox"], [3, "modern-day DATA science"], [4, "web-based FRONT-end development"]], [1])] },
      { note: "Result", tables: [t("Result", ["content_id", "converted_text"], [[1, "Hello World Of Sql"], [2, "The Quick-Brown Fox"], [3, "Modern-Day Data Science"], [4, "Web-Based Front-End Development"]], [0, 1, 2, 3], "found")] },
    ]), "O(total characters)"),

  "find-students-with-study-spiral-pattern": sql("Split each student's sessions where the gap exceeds 2 days; a segment is a spiral if it has k >= 3 subjects, at least 2k sessions, and every session matches the one k places earlier.",
    ["LAG on session_date flags a break when the gap is over 2 days; a running SUM of breaks numbers the segments.", "Per segment: k = COUNT(DISTINCT subject), n = sessions, total hours.", "Self-join session rn with rn + k; any mismatch means the order does not repeat. Keep k >= 3 and n >= 2k."],
    `WITH flagged AS (
  SELECT student_id, subject, session_date, hours_studied,
         CASE WHEN DATEDIFF(session_date, LAG(session_date) OVER (PARTITION BY student_id ORDER BY session_date)) > 2
              THEN 1 ELSE 0 END AS brk
  FROM study_sessions
), seg AS (
  SELECT student_id, subject, hours_studied,
         SUM(brk) OVER (PARTITION BY student_id ORDER BY session_date) AS seg_id,
         ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY session_date) AS rn
  FROM flagged
), stats AS (
  SELECT student_id, seg_id, COUNT(DISTINCT subject) AS k, COUNT(*) AS n,
         SUM(hours_studied) AS hours
  FROM seg
  GROUP BY student_id, seg_id
)
SELECT s.student_id, s.student_name, s.major,
       st.k AS cycle_length, st.hours AS total_study_hours
FROM stats st
JOIN students s ON s.student_id = st.student_id
WHERE st.k >= 3 AND st.n >= 2 * st.k
  AND NOT EXISTS (
    SELECT 1
    FROM seg a
    JOIN seg b ON b.student_id = a.student_id AND b.seg_id = a.seg_id AND b.rn = a.rn + st.k
    WHERE a.student_id = st.student_id AND a.seg_id = st.seg_id AND a.subject <> b.subject
  )
ORDER BY cycle_length DESC, total_study_hours DESC;`,
    () => { const G = (hl?: number[], tone?: SqlTable["tone"]) => t("Segments", ["student_id", "sequence", "k", "sessions"], [[1, "Math, Physics, Chemistry, Math, Physics, Chemistry", 3, 6], [2, "Algebra, Calculus, Statistics, Geometry x2", 4, 8], [3, "Biology, Chemistry, Biology, Chemistry", 2, 4], [4, "Organic | Physical (4-day gap)", 1, 1]], hl, tone);
      return viz("Repeating subject cycles", [
        { note: "Each session equals the one k places earlier for students 1 and 2", tables: [G([0, 1], "found")] },
        { note: "Student 3 has only 2 subjects; student 4's gap splits the sessions", tables: [G([2, 3], "bad")] },
        { note: "Longest cycle first, then most hours", tables: [t("Result", ["student_id", "student_name", "major", "cycle_length", "total_study_hours"], [[2, "Bob Johnson", "Mathematics", 4, "26.0"], [1, "Alice Chen", "Computer Science", 3, "15.0"]], [0, 1], "found")] },
      ]); }, "O(n log n)"),

  "find-invalid-ip-addresses": sql("An IP is valid only if it matches four 0-255 octets without leading zeros; count rows that do NOT match, per ip.",
    ["One octet: 25[0-5] | 2[0-4][0-9] | 1[0-9]{2} | [1-9]?[0-9]. The last branch allows 0 but not 01.", "Three octets with a dot, then a fourth, anchored with ^ and $, so 3 or 5 octets fail.", "GROUP BY ip and sort by count, then ip, both descending."],
    `SELECT ip, COUNT(*) AS invalid_count
FROM logs
WHERE ip NOT REGEXP '^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])[.]){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$'
GROUP BY ip
ORDER BY invalid_count DESC, ip DESC;`,
    () => { const L = (hl?: number[], tone?: SqlTable["tone"]) => t("logs", ["log_id", "ip", "status_code"], [[1, "192.168.1.1", 200], [2, "256.1.2.3", 404], [3, "192.168.001.1", 200], [4, "192.168.1.1", 200], [5, "192.168.1", 500], [6, "256.1.2.3", 404], [7, "192.168.001.1", 200]], hl, tone);
      return viz("Count invalid addresses", [
        { note: "256 is over 255, 001 has a leading zero, 192.168.1 has 3 octets", tables: [L([1, 2, 4, 5, 6], "bad")] },
        { note: "Result", tables: [t("Result", ["ip", "invalid_count"], [["256.1.2.3", 2], ["192.168.001.1", 2], ["192.168.1", 1]], [0, 1, 2], "found")] },
      ]); }),
};
