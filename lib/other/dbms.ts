import type { Subject } from "./types";

export const DBMS: Subject = {
  id: "dbms",
  name: "DBMS",
  short: "DBMS",
  blurb: "Keys, ER modelling, functional dependencies and normalization, transactions and ACID, concurrency control, recovery and indexing. Expect both definitions and small worked problems.",
  chapters: [
    {
      id: "basics",
      title: "Why a DBMS, and the three-schema architecture",
      summary: "A file system stores bytes; a DBMS stores data with structure, rules and guarantees. It gives you a query language, concurrent access without corruption, crash recovery, security and integrity constraints.",
      points: [
        "Three levels: **external** (views for each user), **conceptual** (all tables and constraints), **internal** (files, indexes, storage).",
        "**Logical data independence**: change the conceptual schema without breaking views. **Physical data independence**: change storage or indexes without changing the schema.",
      ],
      diagram: `flowchart TB
  U1["App A's view"] --> C["Conceptual schema<br/>tables, keys, constraints"]
  U2["App B's view"] --> C
  U3["Analyst's view"] --> C
  C --> I["Internal schema<br/>files, pages, B+ trees"]
  I --> D[("disk")]`,
      caption: "Each level can change without forcing changes above it.",
      cards: [
        { id: "fs-vs-db", q: "Why use a DBMS instead of plain files?", a: "Files give you storage and nothing else. A DBMS adds:\n\n- a declarative query language (SQL) instead of hand-written parsing,\n- concurrency control so simultaneous users do not corrupt data,\n- transactions and recovery after crashes,\n- constraints (keys, foreign keys, checks) that keep data consistent,\n- access control, and indexes for fast lookups.\n\nWith files, every application re-implements these, usually badly, and the same data ends up duplicated and inconsistent." },
        { id: "rdbms-nosql", q: "When would you choose a NoSQL database over a relational one?", a: "When the data or scale does not fit tables and joins well: flexible or nested documents (MongoDB), huge write throughput across many machines (Cassandra), simple key-value access at very low latency (Redis, DynamoDB), or graph traversals (Neo4j). Relational databases remain the default when you need joins, strong consistency and multi-row transactions." },
        { id: "schema-instance", q: "Schema vs instance?", a: "The schema is the design: table names, columns, types and constraints. It changes rarely. An instance is the data stored at one moment, which changes with every insert, update and delete." },
      ],
    },
    {
      id: "keys",
      title: "Keys and constraints",
      summary: "Keys identify rows and connect tables. Getting the vocabulary exactly right is a common interview filter.",
      diagram: `flowchart TB
  S["super keys: any unique column set"] --> C["candidate keys: minimal super keys"]
  C --> P["primary key: the chosen one"]
  C --> A["alternate keys: the rest"]
  P -.->|"referenced by"| F["foreign keys in other tables"]`,
      caption: "Every candidate key is a super key; the primary key is one chosen candidate.",
      table: { head: ["Key", "Meaning", "Example in Student(roll, email, name, dept_id)"], rows: [
        ["Super key", "any set of columns that uniquely identifies a row", "{roll}, {roll, name}, {email}"],
        ["Candidate key", "a minimal super key (remove any column and it stops being unique)", "{roll}, {email}"],
        ["Primary key", "the candidate key chosen as the main identifier; unique and not null", "roll"],
        ["Alternate key", "a candidate key not chosen as primary", "email"],
        ["Composite key", "a key made of more than one column", "(student, course) in Enrollment"],
        ["Foreign key", "column(s) referring to another table's key", "dept_id → Department(id)"],
        ["Surrogate key", "an artificial id with no business meaning", "auto-increment id"],
      ] },
      cards: [
        { id: "pk-unique", q: "Primary key vs unique key?", a: "Both enforce uniqueness. A table has exactly one primary key and it cannot be NULL; it is the row's identity and is usually the clustered index. A table can have many unique constraints, and they allow NULLs (most databases allow several NULLs, since NULL is not equal to NULL).",
          trap: "\"A unique key allows exactly one NULL\" is true in SQL Server but not in PostgreSQL or MySQL, which allow many." },
        { id: "fk-actions", q: "What can happen to child rows when a referenced parent row is deleted?", a: "It depends on the foreign key's action:\n\n- `RESTRICT` / `NO ACTION`: the delete is refused while children exist (default).\n- `CASCADE`: children are deleted too.\n- `SET NULL`: the child's foreign key becomes NULL.\n- `SET DEFAULT`: it becomes the column default." },
        { id: "surrogate", q: "Natural key or surrogate key?", a: "A natural key (email, ISBN) has meaning but can change, can be long, and sometimes turns out not to be unique. A surrogate key (auto-increment or UUID) never changes and joins fast, but you must still put a unique constraint on the natural identifier to avoid duplicates. Most production schemas use a surrogate primary key plus unique natural keys." },
      ],
    },
    {
      id: "er",
      title: "ER modelling",
      summary: "An entity-relationship diagram is the design step before tables: entities (things), attributes (their properties) and relationships with cardinality.",
      diagram: `erDiagram
  STUDENT ||--o{ ENROLLMENT : has
  COURSE ||--o{ ENROLLMENT : has
  DEPARTMENT ||--o{ STUDENT : "belongs to"
  DEPARTMENT ||--o{ COURSE : offers
  STUDENT { int roll PK
    string name
    string email }
  COURSE { string code PK
    string title
    int credits }
  ENROLLMENT { int roll FK
    string code FK
    string grade }`,
      caption: "Many-to-many (students and courses) becomes a separate table with two foreign keys.",
      cards: [
        { id: "er-to-tables", q: "How do you turn relationships into tables?", a: "- **1:1**: put a foreign key (with a unique constraint) on either side, usually the optional one.\n- **1:N**: put the foreign key on the N side (each student row holds dept_id).\n- **M:N**: create a junction table holding both foreign keys, whose primary key is usually the pair. Relationship attributes (grade) live in it." },
        { id: "weak", q: "What is a weak entity?", a: "An entity that cannot be identified by its own attributes alone and depends on an owner entity. Example: a Dependent of an Employee identified by (employee_id, dependent_name). In tables, its primary key includes the owner's key, and deleting the owner usually cascades." },
        { id: "attrs", q: "Simple, composite, multivalued and derived attributes?", a: "Simple: atomic (age). Composite: has parts (address = street, city, pin). Multivalued: several values per entity (phone numbers), which becomes a separate table. Derived: computed from others (age from date of birth), usually not stored." },
      ],
    },
    {
      id: "normal",
      title: "Functional dependencies and normalization",
      summary: "A **functional dependency** X → Y means: rows that agree on X always agree on Y. Normalization uses FDs to split tables so each fact is stored once, removing update, insert and delete anomalies.",
      points: [
        "**1NF**: atomic values, no repeating groups.",
        "**2NF**: 1NF, and no non-key column depends on only part of a composite key.",
        "**3NF**: 2NF, and no non-key column depends on another non-key column (no transitive dependency).",
        "**BCNF**: for every non-trivial FD X → Y, X is a super key.",
      ],
      lab: "normalize",
      cards: [
        { id: "anomalies", q: "What are update, insert and delete anomalies?", a: "In one wide table Enrollment(student, student_name, course, instructor, phone):\n\n- **Update**: change an instructor's phone and you must update every row for that course; miss one and data disagrees.\n- **Insert**: you cannot record a new course until some student enrolls.\n- **Delete**: when the last student drops a course, the course and instructor information disappear." },
        { id: "3nf-bcnf", q: "3NF vs BCNF, with an example where they differ?", a: "3NF allows X → A when A is part of some candidate key (a prime attribute); BCNF does not. Example: TeacherSubject(student, subject, teacher) with FDs (student, subject) → teacher and teacher → subject. Candidate keys are (student, subject) and (student, teacher). teacher → subject violates BCNF (teacher is not a super key) but satisfies 3NF because subject is prime. Decomposing to BCNF can lose the first dependency, which is why 3NF is sometimes preferred.",
          trap: "Saying BCNF decomposition always preserves dependencies. It is always lossless, but not always dependency-preserving; 3NF can always achieve both." },
        { id: "closure", q: "How do you find a candidate key using attribute closure?", a: "Compute X⁺: start with X and repeatedly add the right side of any FD whose left side is already inside. If X⁺ contains every attribute, X is a super key; if no proper subset of X is, X is a candidate key. Start with attributes that never appear on any right-hand side: they must be in every key." },
        { id: "denorm", q: "When would you denormalize on purpose?", a: "When reads vastly outnumber writes and the joins are too slow: reporting tables, counters, read-heavy feeds. You accept duplicated data and keep it in sync with triggers, application code or materialized views. Normalize first, then denormalize the measured hot spots." },
        { id: "lossless", q: "What makes a decomposition lossless?", a: "Splitting R into R1 and R2 is lossless if joining them gives back exactly R, with no extra rows. The test: the common attributes R1 ∩ R2 must be a key of R1 or of R2." },
      ],
    },
    {
      id: "acid",
      title: "Transactions and ACID",
      summary: "A transaction is a group of operations that must succeed or fail as one unit, like moving money between two accounts.",
      table: { head: ["Property", "Means", "How databases provide it"], rows: [
        ["Atomicity", "all or nothing", "undo log: roll back partial work"],
        ["Consistency", "constraints hold before and after", "constraint checks plus correct application logic"],
        ["Isolation", "concurrent transactions do not see each other's half-done work", "locks or MVCC"],
        ["Durability", "once committed, it survives crashes", "write-ahead log flushed to disk at commit"],
      ] },
      diagram: `stateDiagram-v2
  [*] --> Active
  Active --> PartiallyCommitted: last statement done
  PartiallyCommitted --> Committed: log flushed
  Active --> Failed: error
  PartiallyCommitted --> Failed: write fails
  Failed --> Aborted: rolled back
  Committed --> [*]
  Aborted --> [*]`,
      caption: "Transaction states.",
      cards: [
        { id: "isolation-levels", q: "What do the four SQL isolation levels prevent?", a: "Each level allows fewer anomalies:",
          table: { head: ["Level", "Dirty read", "Non-repeatable read", "Phantom"], rows: [["Read uncommitted", "possible", "possible", "possible"], ["Read committed", "prevented", "possible", "possible"], ["Repeatable read", "prevented", "prevented", "possible (prevented in MySQL InnoDB)"], ["Serializable", "prevented", "prevented", "prevented"]] },
          trap: "Default levels differ: PostgreSQL and SQL Server default to Read committed, MySQL InnoDB to Repeatable read." },
        { id: "anomaly-defs", q: "Dirty read, non-repeatable read and phantom read?", a: "- **Dirty read**: you read another transaction's uncommitted change, which may roll back.\n- **Non-repeatable read**: you read the same row twice and get different values because someone committed an update in between.\n- **Phantom**: you run the same range query twice and new rows appear because someone inserted into the range." },
        { id: "wal", q: "What is write-ahead logging?", a: "Before a changed data page is written to disk, the log record describing the change must be on disk. At commit only the log must be flushed (sequential, fast); data pages can be written later. After a crash, recovery **redoes** committed changes from the log and **undoes** uncommitted ones (the ARIES approach)." },
      ],
    },
    {
      id: "concurrency",
      title: "Schedules, serializability and concurrency control",
      summary: "A schedule interleaves operations of several transactions. It is **conflict serializable** if swapping non-conflicting operations can turn it into some serial order. Two operations conflict if they belong to different transactions, touch the same item, and at least one is a write.",
      diagram: `flowchart LR
  T1(["T1"]) -->|"T1 writes A before T2 reads A"| T2(["T2"])
  T2 -->|"T2 writes B before T1 reads B"| T1`,
      caption: "A precedence graph with a cycle: this schedule is not conflict serializable.",
      points: [
        "Test: draw an edge Ti → Tj for each conflicting pair where Ti's operation comes first. No cycle means conflict serializable, and a topological order gives the equivalent serial schedule.",
        "**Two-phase locking (2PL)**: a transaction acquires locks in a growing phase and releases them in a shrinking phase, never acquiring after its first release. It guarantees conflict serializability; **strict 2PL** holds write locks until commit to avoid cascading aborts.",
        "**MVCC**: writers create new versions, readers see a snapshot, so readers and writers do not block each other (PostgreSQL, InnoDB).",
      ],
      cards: [
        { id: "2pl-deadlock", q: "Does two-phase locking prevent deadlock?", a: "No. 2PL guarantees serializability, not freedom from deadlock: T1 locks A then wants B while T2 locks B then wants A. Databases detect deadlocks with a wait-for graph and abort one victim, or prevent them with timestamp schemes like wait-die and wound-wait." },
        { id: "cascading", q: "What are recoverable and cascadeless schedules?", a: "**Recoverable**: if T2 reads data written by T1, T1 commits before T2 commits; otherwise T2 might commit based on data that is later rolled back. **Cascadeless**: transactions only read committed data, so one abort never forces others to abort. Strict 2PL gives both." },
        { id: "optimistic", q: "Pessimistic vs optimistic concurrency control?", a: "Pessimistic: lock before touching data, assuming conflicts are likely. Optimistic: work without locks, then validate at commit (often with a version column: `UPDATE ... WHERE id = ? AND version = ?`) and retry if someone else changed the row. Optimistic wins when conflicts are rare, such as web forms editing different records." },
      ],
    },
    {
      id: "indexing",
      title: "Indexing and B+ trees",
      summary: "An index is a separate structure that finds rows without scanning the table. Most databases use **B+ trees**: balanced, wide trees where every lookup takes a few disk reads even with millions of rows.",
      points: [
        "Internal nodes hold only separator keys; leaves hold every key (with row pointers or the rows themselves) and are linked, so range scans walk the leaves.",
        "**Clustered** index: the table rows are stored in index order (one per table, usually the primary key). **Non-clustered**: a separate structure pointing to rows.",
        "Hash indexes are O(1) for equality but useless for ranges and ORDER BY.",
      ],
      lab: "btree",
      cards: [
        { id: "btree-vs-bplus", q: "B tree vs B+ tree: why do databases prefer B+ trees?", a: "In a B tree, data pointers can live in any node; in a B+ tree they live only in leaves, and the leaves are linked. So internal nodes hold more keys per page (higher fan-out, shorter tree), every lookup takes the same number of reads, and range queries just walk the leaf chain." },
        { id: "when-index", q: "When does an index not help?", a: "- Low-selectivity columns (a boolean): reading most rows through an index is slower than a scan.\n- Functions or casts on the column (`WHERE LOWER(email) = ...`) unless you index the expression.\n- Leading wildcards (`LIKE '%son'`).\n- Small tables.\n\nAnd every index slows down inserts and updates and uses space." },
        { id: "composite-index", q: "How does a composite index on (a, b, c) get used?", a: "Like a phone book sorted by last name, then first name: it helps queries filtering on `a`, on `a and b`, or on `a, b and c` (the leftmost prefix). A filter on `b` alone cannot use it efficiently. Put equality columns first and the range column last." },
        { id: "height", q: "Roughly how tall is a B+ tree over 100 million rows?", a: "With about 500 keys per 8 KB page, height h covers about 500ʰ rows: 500³ = 125 million. So three or four levels, and since the top levels stay cached in memory, a lookup usually costs one or two disk reads." },
      ],
    },
    {
      id: "scale",
      title: "Scaling: replication, sharding and CAP",
      summary: "One database server eventually runs out of capacity. **Replication** copies data to more machines (for reads and availability); **sharding** splits data across machines (for writes and size).",
      diagram: `flowchart LR
  App["application"] -->|"writes"| P[("primary")]
  P -->|"replicates"| R1[("replica 1")]
  P -->|"replicates"| R2[("replica 2")]
  App -->|"reads"| R1
  App -->|"reads"| R2`,
      caption: "Primary-replica replication: scale reads, keep one place for writes.",
      cards: [
        { id: "cap", q: "Explain the CAP theorem.", a: "During a network **partition**, a distributed store must choose between **consistency** (every read sees the latest write, so some requests fail) and **availability** (every request gets an answer, possibly stale). Without a partition you can have both. The PACELC extension adds: else, choose between latency and consistency." },
        { id: "shard-key", q: "How do you choose a shard key?", a: "Pick a key with high cardinality and even traffic, that most queries include, so each query hits one shard: user_id for a social app, tenant_id for SaaS. Avoid monotonic keys like timestamps with range sharding (all new writes hit one shard) and keys that create hot spots (one celebrity user). Cross-shard joins and transactions become expensive, so design around them." },
        { id: "sync-async", q: "Synchronous vs asynchronous replication?", a: "Synchronous: the primary waits for a replica to confirm before committing. No data loss on failover, but higher write latency. Asynchronous: commit immediately and replicate later. Fast, but a crash can lose the last few transactions, and replicas can serve stale reads (replication lag)." },
      ],
    },
  ],
};
