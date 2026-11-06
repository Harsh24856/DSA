import { candidateKeys, closure, type FD } from "../sim.ts";
import type { OaSubject } from "../types.ts";
import { concept, numeric } from "./make.ts";

const FD1: FD[] = [[["A"], ["B"]], [["B"], ["C"]], [["C", "D"], ["E"]]];
const FD_TEXT = "A → B, B → C, CD → E";
const FD2: FD[] = [[["A"], ["B"]], [["B"], ["A"]]];

export const OA_DBMS: OaSubject = {
  id: "dbms", name: "DBMS",
  questions: [
    numeric("key", `R(A, B, C, D, E) with ${FD_TEXT}. What is the candidate key?`, candidateKeys(["A", "B", "C", "D", "E"], FD1)[0].join(""), ["A", "CD", "ABD"], "D never appears on the right, so it is in every key. The closure of AD reaches all attributes, and neither A nor D does alone."),
    numeric("closure", `R(A, B, C, D, E) with ${FD_TEXT}. What is the closure of A?`, closure(["A"], FD1).join(", "), ["A, B", "A, B, C, D", "A, B, C, D, E"], "A gives B, and B gives C. CD → E does not fire because D is missing."),
    numeric("two-keys", "R(A, B, C) with A → B and B → A. How many candidate keys does it have?", candidateKeys(["A", "B", "C"], FD2).length, [1, 3, 4], "C is in every key. AC and BC both reach everything, and each is minimal."),
    numeric("superkeys", "R(A, B, C, D) has A as its only candidate key. How many superkeys does it have?", 2 ** 3, [4, 7, 16], "A superkey is A plus any subset of the other 3 attributes, so 2^3."),
    numeric("cross", "Table X has 3 rows and table Y has 4 rows. How many rows does `X CROSS JOIN Y` return?", 3 * 4, [7, 4, 3], "A cross join pairs every row of X with every row of Y."),
    numeric("btree-height", "A B+ tree has fanout 100 and holds 1,000,000 keys. About how many levels does a search visit?", Math.ceil(Math.log(1e6) / Math.log(100)), [2, 6, 20], "Levels are about log base 100 of 1,000,000. Wide nodes keep the tree shallow, so few disk reads are needed."),
    numeric("mn-tables", "An ER diagram has two entities joined by an M:N relationship. What is the minimum number of tables?", 2 + 1, [1, 2, 4], "M:N needs its own table holding both foreign keys. A 1:N relationship would need only 2 tables."),
    concept("nf-2", "R(A, B, C) has key A with A → B and B → C. What is its highest normal form?", "2NF", ["1NF", "3NF", "BCNF"], "The key is one attribute, so no partial dependency exists. A → B → C is a transitive dependency, which breaks 3NF."),
    concept("nf-bcnf", "Which condition defines BCNF?", "For every non-trivial X → Y, X is a superkey", ["Every attribute is atomic", "There are no partial dependencies", "There are no multivalued attributes"], "BCNF is stricter than 3NF, which also allows Y to be a prime attribute."),
    concept("nf-1", "What does 1NF require?", "Every attribute holds atomic values", ["Every table has a foreign key", "No transitive dependencies exist", "Every determinant is a key"], "No lists or repeating groups inside one cell."),
    concept("nf-2-rule", "What does 2NF remove?", "Partial dependency of a non-prime attribute on a key", ["Transitive dependency", "Repeating groups", "All NULL values"], "It only matters when a key has more than one attribute."),
    concept("preserve", "Which is guaranteed for a 3NF decomposition but not always for BCNF?", "Dependency preservation", ["Lossless join", "No NULL values", "Fewer tables"], "A lossless decomposition is always possible for both. BCNF can lose a dependency."),
    concept("lossless", "When is a decomposition of R into R1 and R2 lossless?", "When the common attributes are a key of R1 or R2", ["When R1 and R2 have the same number of columns", "When R1 and R2 share no attributes", "When every column is indexed"], "Then each row joins back to exactly one partner, so no extra rows appear."),
    concept("acid-d", "Which ACID property keeps committed data after a crash?", "Durability", ["Atomicity", "Consistency", "Isolation"], "It is usually provided by a write-ahead log."),
    concept("acid-a", "A transfer debits one account, then the server fails before the credit. Which property undoes the debit?", "Atomicity", ["Durability", "Isolation", "Consistency"], "All of a transaction happens, or none of it does."),
    concept("dirty-read", "Which isolation level allows dirty reads?", "Read uncommitted", ["Read committed", "Repeatable read", "Serializable"], "Every level above it reads only committed data."),
    concept("phantom", "In the SQL standard, which isolation level is required to prevent phantom reads?", "Serializable", ["Read uncommitted", "Read committed", "Repeatable read"], "The standard lets repeatable read show phantoms. Some engines prevent them there too, but that is beyond the standard."),
    concept("nonrepeat", "T1 reads a row twice and sees different values because T2 committed an update between the reads. What is this called?", "Non-repeatable read", ["Dirty read", "Phantom read", "Lost update"], "A phantom is a new row matching a query. A dirty read sees uncommitted data."),
    concept("cycle", "Schedule: R1(A), W2(A), R2(B), W1(B). Is it conflict serializable?", "No, the precedence graph has a cycle", ["Yes, it is equivalent to T1 then T2", "Yes, it is equivalent to T2 then T1", "It cannot be determined from reads and writes"], "A gives T1 before T2, and B gives T2 before T1. That is a cycle."),
    concept("twopl", "What does strict two-phase locking NOT prevent?", "Deadlock", ["Dirty reads", "Non-serializable schedules", "Cascading aborts"], "Transactions can still wait on each other's locks in a cycle."),
    concept("locks", "T1 holds a shared lock on a row. Which request is granted at once?", "A shared lock from T2", ["An exclusive lock from T2", "An update through T2", "A delete through T2"], "Readers do not conflict. Any write needs an exclusive lock, which conflicts with a shared lock."),
    concept("waitdie", "In the wait-die scheme, what happens when a younger transaction wants a lock held by an older one?", "The younger transaction aborts", ["The younger transaction waits", "The older transaction aborts", "Both transactions abort"], "Older ones wait and younger ones die. Wound-wait is the reverse."),
    concept("wal", "What is the rule of write-ahead logging?", "The log record reaches disk before the data page does", ["The data page reaches disk before the log record", "The log is written only at commit", "The log is deleted at each checkpoint"], "Recovery can then always redo or undo using the log."),
    concept("recovery", "During crash recovery, what happens to a transaction with no commit record in the log?", "It is undone", ["It is redone", "It is committed", "It is left as it was"], "Committed transactions are redone. Unfinished ones are rolled back."),
    concept("checkpoint", "What does a checkpoint reduce?", "The amount of log to scan during recovery", ["The number of locks", "The size of each transaction", "The number of indexes"], "Older log records are known to be on disk, so recovery starts from there."),
    concept("pk-null", "How does a primary key differ from a candidate key?", "It is the one candidate key chosen to identify rows", ["It can hold NULL values", "It can have duplicates", "A table can have several of them"], "A table can have many candidate keys but only one primary key."),
    concept("clustered", "How many clustered indexes can a table have?", "One", ["None", "One per column", "As many as needed"], "A clustered index sets the physical order of rows, and rows have only one order."),
    concept("hash-range", "Which query does a hash index NOT help?", "`WHERE age BETWEEN 20 AND 30`", ["`WHERE id = 5`", "`WHERE email = 'a@b.com'`", "`WHERE code = 'X1'`"], "Hashing destroys order, so range scans need a B+ tree."),
    concept("bplus", "Why do B+ trees suit range queries better than B trees?", "Leaves hold all keys and link to the next leaf", ["They have no internal nodes", "They store keys in random order", "They use hashing in the leaves"], "Find the first key, then walk along the leaves."),
    concept("weak", "What is a weak entity?", "One that has no key of its own and depends on an owner", ["One with no attributes", "One with no relationships", "One stored outside the database"], "An example is a dependent of an employee. Its key includes the owner's key."),
    concept("select-project", "In relational algebra, what does selection (σ) do?", "Filters rows", ["Picks columns", "Joins two tables", "Renames a table"], "Projection (π) picks columns. In SQL, σ is WHERE and π is the SELECT list."),
    concept("drop", "Which command removes a table's structure as well as its rows?", "DROP", ["DELETE", "TRUNCATE", "UPDATE"], "DELETE and TRUNCATE keep the table. TRUNCATE removes all rows quickly."),
    concept("dcl", "Which command belongs to DCL?", "GRANT", ["COMMIT", "ALTER", "SELECT"], "COMMIT is TCL, ALTER is DDL, and SELECT is usually classed as DQL or DML."),
    concept("view", "What is a non-materialized view?", "A stored query that runs when used", ["A copy of a table on disk", "A type of index", "A backup of a table"], "It stores no rows. A materialized view does store them."),
  ],
};
