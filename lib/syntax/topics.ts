// The Syntax page: one idea per topic, written as the same small program in six languages, with a note on what is
// different in each. The programs live in code.ts; check:other runs all of them and requires identical output.
export type SynLang = "cpp" | "java" | "python" | "js" | "ts" | "rust";
export const SYN_LANGS: [SynLang, string][] = [["cpp", "C++"], ["java", "Java"], ["python", "Python"], ["js", "JavaScript"], ["ts", "TypeScript"], ["rust", "Rust"]];

export type SynTopic = { id: string; title: string; idea: string; notes: Partial<Record<SynLang, string>> };

export const SYN_GROUPS: { title: string; topics: SynTopic[] }[] = [
  { title: "Basics", topics: [
    { id: "hello", title: "Printing and variables", idea: "Every program needs output and named values. Compare how each language declares a variable and builds a line of text.", notes: {
      cpp: "`cout << a << b` chains values; `endl` ends the line. Code starts in `main`.",
      java: "Everything lives in a class; `main` is the entry point. `printf` formats with `%s` and `%d`.",
      python: "No types, no semicolons, no `main`: code runs top to bottom. f-strings put values inside `{}`.",
      js: "`const` cannot be reassigned, `let` can; never use `var`. Template strings use backticks and `${}`.",
      ts: "JavaScript plus types after a colon. Types are checked before running and erased at run time.",
      rust: "`let` is immutable unless you write `let mut`. `println!` is a macro (the `!`) with `{}` placeholders.",
    } },
    { id: "numbers", title: "Numbers and division", idea: "Integer division, rounding of negative numbers and overflow differ between languages, and they cause real bugs in coding rounds.", notes: {
      cpp: "`int` is 32 bits and overflow is undefined behaviour. Use `long long` for anything near 2^31.",
      java: "`int` is 32 bits and wraps silently on overflow; `long` is 64. `Math.floorDiv` rounds down if you need it.",
      python: "`/` always gives a float and `//` rounds down, so `-7 // 2` is -4, unlike C++ and Java. Integers never overflow.",
      js: "Every number is a 64-bit float: integers are exact only up to 2^53. Use `Math.trunc` for integer division.",
      ts: "Same numbers as JavaScript; `bigint` is the type for arbitrary-size integers.",
      rust: "Sizes are explicit: `i32`, `i64`, `u64`, `usize`. Mixing types needs `as`. Overflow panics in debug builds.",
    } },
    { id: "strings", title: "Strings", idea: "Length, case, slicing, searching, reversing, splitting and joining: the operations string problems are built from.", notes: {
      cpp: "`std::string` is mutable. `substr(start, length)`; `find` returns `string::npos` when missing.",
      java: "Strings are immutable; every change makes a new one. `substring(start, end)`; compare with `equals`, not `==`.",
      python: "Strings are immutable. Slices `s[a:b]` and `s[::-1]` do most of the work; `find` returns -1 when missing.",
      js: "Immutable. `slice(start, end)` takes negative indexes; `[...s]` splits into characters.",
      ts: "Same strings as JavaScript.",
      rust: "`&str` is a borrowed slice, `String` an owned buffer. Strings are UTF-8, so `s[0]` is not allowed: use `chars()`.",
    } },
    { id: "conditions", title: "Conditions and switch", idea: "if/else chains, a multi-way switch and the ternary operator. Watch for fall-through in C-style switches.", notes: {
      cpp: "A `case` without `break` falls into the next one. `switch` only works on integers and enums.",
      java: "The arrow form `case 1 -> ...` (Java 14+) never falls through and can return a value.",
      python: "`elif` instead of `else if`. `match` arrived in 3.10; the ternary reads `a if cond else b`.",
      js: "Use `===` and `!==`: `==` converts types first, so `0 == \"\"` is true.",
      ts: "Annotate `day: number`: a literal type `3` would make `case 1` a type error.",
      rust: "`match` must cover every value, so the compiler catches a missed case. `if` is an expression that returns a value.",
    } },
    { id: "loops", title: "Loops", idea: "Counted loops, while loops, for-each, continue and break.", notes: {
      cpp: "Range-based `for (int x : v)` copies each element; use `const auto&` for big ones.",
      java: "The enhanced `for (int x : arr)` works on arrays and any `Iterable`.",
      python: "`range(a, b)` stops before b. There is no `i++`: write `i += 1`.",
      js: "`for...of` gives values, `for...in` gives keys (indexes as strings). Prefer `for...of` for arrays.",
      ts: "Same loops as JavaScript.",
      rust: "`1..5` excludes 5 and `1..=5` includes it. `while let Some(x) = ...` loops until a value runs out.",
    } },
    { id: "functions", title: "Functions and recursion", idea: "Parameters, return values, default arguments and recursion.", notes: {
      cpp: "Default arguments go at the end. Pass big objects by `const&` to avoid copying.",
      java: "No default arguments, so overload the method. Every function is a method of some class.",
      python: "Default values are evaluated once: never use a mutable default such as `def f(x=[])`.",
      js: "Arrow functions `(a) => a + 1` are short and do not have their own `this`.",
      ts: "Parameter and return types are written after colons; return types can often be inferred.",
      rust: "The last expression without a semicolon is the return value. No default arguments: take an `Option`.",
    } },
  ] },
  { title: "Collections", topics: [
    { id: "arrays", title: "Arrays and lists", idea: "The growable array is the most used data structure in coding rounds: push, index, slice, sum, search.", notes: {
      cpp: "`vector<int>`: `push_back`, `back()`, `size()`. Out-of-range `v[i]` is undefined; `v.at(i)` checks.",
      java: "`ArrayList<Integer>` for growable lists, `int[]` for fixed arrays. `List.of` is read-only.",
      python: "One `list` type does everything. Negative indexes count from the end; `a[1:3]` copies a slice.",
      js: "Arrays grow by themselves. `at(-1)` reads from the end; `slice` copies, `splice` changes in place.",
      ts: "`number[]` or `Array<number>`; `[string, number]` is a fixed-length tuple.",
      rust: "`Vec<T>` grows; `[T; n]` is fixed. `&a[1..3]` borrows a slice without copying.",
    } },
    { id: "maps", title: "Hash maps", idea: "Counting and lookups by key: the tool behind most O(n) solutions.", notes: {
      cpp: "`map` keeps keys sorted (O(log n)); `unordered_map` is the O(1) hash map. `m[k]` inserts a default if missing.",
      java: "`HashMap` for speed, `TreeMap` for sorted keys. `merge` and `getOrDefault` avoid null checks.",
      python: "`dict` keeps insertion order. `get(k, 0)`, `collections.Counter` and `defaultdict` save lines.",
      js: "Use `Map`, not a plain object, for arbitrary keys: objects turn every key into a string.",
      ts: "`Map<string, number>` types both keys and values.",
      rust: "`HashMap` with `entry(k).or_insert(0)` for counting. `BTreeMap` keeps keys sorted.",
    } },
    { id: "sets", title: "Sets", idea: "Remove duplicates, test membership in O(1) and intersect two collections.", notes: {
      cpp: "`set` is sorted, `unordered_set` is hashed. `count(x) > 0` tests membership (or `contains` in C++20).",
      java: "`HashSet` or `TreeSet`; `retainAll` intersects in place and `addAll` unions.",
      python: "Set literals `{1, 2}`; `&` intersects, `|` unions, `-` subtracts.",
      js: "`Set` keeps insertion order and has no built-in intersection in older engines: filter instead.",
      ts: "`Set<number>`; spread with `[...set]` to get an array.",
      rust: "`BTreeSet` is sorted, `HashSet` is hashed; both have `intersection` and `union`.",
    } },
    { id: "sorting", title: "Sorting with a comparator", idea: "Sort numbers descending, then sort records by one key and break ties with another.", notes: {
      cpp: "`sort` with a lambda that returns true when `a` should come first. `stable_sort` keeps equal items in order.",
      java: "`Comparator.comparingInt(...).reversed().thenComparing(...)` chains keys.",
      python: "A key function is simpler than a comparator: sort by a tuple, negating numbers for descending.",
      js: "Default `sort()` compares as text, so `[10, 9].sort()` gives `[10, 9]`. Always pass `(a, b) => a - b`.",
      ts: "Same as JavaScript; tuples keep the element types.",
      rust: "`sort_by` takes an `Ordering`; `.then(...)` breaks ties. `sort_unstable` is faster.",
    } },
    { id: "stacks", title: "Stacks, queues and deques", idea: "LIFO, FIFO and both ends: the containers behind DFS, BFS and sliding windows.", notes: {
      cpp: "`stack`, `queue` and `deque`. `pop()` returns nothing: read `top()` or `front()` first.",
      java: "`ArrayDeque` serves as stack, queue and deque. Avoid the old `Stack` and `LinkedList` for speed.",
      python: "A list is a stack. Use `collections.deque` for queues: `list.pop(0)` is O(n).",
      js: "Arrays work as stacks. `shift()` is O(n), so long queues keep a head index.",
      ts: "Same as JavaScript; `pop()` returns `T | undefined`.",
      rust: "`Vec` is the stack and `VecDeque` the queue and deque.",
    } },
    { id: "heaps", title: "Heaps and priority queues", idea: "Get the largest or smallest item fast: top-k, Dijkstra, merging sorted lists.", notes: {
      cpp: "`priority_queue` is a max-heap; `greater<int>` makes a min-heap.",
      java: "`PriorityQueue` is a min-heap; `Comparator.reverseOrder()` makes a max-heap.",
      python: "`heapq` is a min-heap over a plain list. Push negated values for a max-heap.",
      js: "No built-in heap, so write a small one like this, or sort when n is small.",
      ts: "No built-in heap either; a generic class with a comparison function is reusable.",
      rust: "`BinaryHeap` is a max-heap; wrap items in `Reverse` for a min-heap.",
    } },
    { id: "grids", title: "2D grids", idea: "Build a matrix and visit a cell's four neighbours with direction arrays, the core of grid BFS and DFS.", notes: {
      cpp: "`vector<vector<int>> g(rows, vector<int>(cols))` builds an initialized grid.",
      java: "`new int[rows][cols]` is filled with zeros.",
      python: "`[[0] * cols] * rows` repeats one row object; build rows with a comprehension.",
      js: "`Array(rows).fill([])` shares one inner array the same way; use `Array.from`.",
      ts: "Type the grid `number[][]` and the directions as `[number, number][]`.",
      rust: "Indexes are `usize`, which cannot be negative: compute neighbours in `i32`, check, then cast.",
    } },
  ] },
  { title: "Objects and types", topics: [
    { id: "classes", title: "Classes and structs", idea: "Fields, a constructor, methods, a shared counter and a readable text form.", notes: {
      cpp: "`const` after a method promises not to change the object. Static members are defined once outside the class.",
      java: "Override `toString` so printing shows the fields. `static` fields belong to the class.",
      python: "`self` is explicit. `__str__` is what `print` shows.",
      js: "Classes are syntax over prototypes; `static` fields belong to the class.",
      ts: "Declare fields with their types before the constructor.",
      rust: "No classes: a `struct` holds data and `impl` adds methods. `&mut self` methods can change it.",
    } },
    { id: "interfaces", title: "Interfaces, traits and polymorphism", idea: "Several types share one contract, and one loop calls the right version for each.", notes: {
      cpp: "Pure virtual functions (`= 0`) make an interface. Keep the destructor virtual when deleting through a base pointer.",
      java: "An `interface` lists the methods; records give compact immutable classes.",
      python: "Duck typing: anything with `area()` works. `ABC` makes a forgotten method an error.",
      js: "No interfaces at all: if an object has the method, it works.",
      ts: "`interface` checks the shape at compile time, then disappears at run time.",
      rust: "A `trait` is the contract; `Box<dyn Shape>` holds any type that implements it.",
    } },
    { id: "generics", title: "Generics and templates", idea: "Write one function or container that works for many types.", notes: {
      cpp: "Templates are compiled separately for each type used, so they are fast but errors can be long.",
      java: "Generics work on objects only: `List<Integer>`, never `List<int>`. Type information is erased at run time.",
      python: "`TypeVar` and `Generic` help editors and type checkers; at run time anything goes.",
      js: "Dynamic types make every function generic; `#field` is truly private.",
      ts: "`<T>` after the name declares a type parameter; it is usually inferred from the arguments.",
      rust: "Trait bounds such as `T: PartialOrd` say what a generic type must support.",
    } },
  ] },
  { title: "Safety and errors", topics: [
    { id: "errors", title: "Errors and exceptions", idea: "Parse input that may be invalid, and fail cleanly on a division by zero.", notes: {
      cpp: "`stoi(\"4x2\")` returns 4 without complaint, so check how much was parsed.",
      java: "Checked exceptions must be declared or caught; `finally` always runs.",
      python: "`try` / `except` / `finally`; raise built-in exceptions such as `ValueError`.",
      js: "`Number(\"4x2\")` is `NaN` and `10 / 0` is `Infinity`: neither throws, so check yourself.",
      ts: "A caught value has type `unknown`, because anything can be thrown.",
      rust: "No exceptions: functions return `Result<T, E>`, and `?` passes an error up.",
    } },
    { id: "optional", title: "Missing values: null, None and Option", idea: "Look something up that may not exist, and give a default without crashing.", notes: {
      cpp: "`std::optional<T>` (C++17) says a value may be missing; `value_or` supplies a default.",
      java: "`Optional` for return values; `map.get` still returns `null` when a key is missing.",
      python: "`None` plus `dict.get`. Test with `is None`; `or` also replaces empty strings and 0.",
      js: "Both `null` and `undefined` exist. `??` replaces only those two; `||` also replaces 0 and \"\".",
      ts: "With `strictNullChecks`, `string | undefined` must be handled before use.",
      rust: "There is no null. `Option<T>` is `Some(v)` or `None`, and the compiler makes you handle both.",
    } },
    { id: "references", title: "Copies, references and borrowing", idea: "Does changing b change a? The answer differs by language and decides many bugs.", notes: {
      cpp: "`=` copies a vector. `&` makes a reference, another name for the same object.",
      java: "Arrays and objects are references: `=` shares, `clone()` copies.",
      python: "Every name refers to an object; `=` never copies. `copy()` is shallow, `copy.deepcopy` deep.",
      js: "Objects and arrays are shared by `=`. Spread copies one level; `structuredClone` copies deeply.",
      ts: "Same sharing rules as JavaScript; `const` only stops reassignment.",
      rust: "`=` moves ownership, `clone()` copies, `&` borrows to read and `&mut` borrows to change, one at a time.",
    } },
  ] },
  { title: "Functional style", topics: [
    { id: "closures", title: "Lambdas, closures, map and filter", idea: "A function that remembers state, and transforming lists without writing loops.", notes: {
      cpp: "`[n]` captures a copy, `[&n]` a reference; `mutable` lets the copy change.",
      java: "Captured locals must be effectively final. Streams chain `map`, `filter` and `collect`.",
      python: "`nonlocal` changes a captured variable. Comprehensions are usually clearer than `map` and `filter`.",
      js: "Closures capture variables, not values. `map`, `filter` and `reduce` are on every array.",
      ts: "Function types read `() => number`.",
      rust: "`Fn`, `FnMut` and `FnOnce` say how a closure uses what it captured; `move` takes ownership.",
    } },
  ] },
  { title: "Coding-round essentials", topics: [
    { id: "building", title: "Building strings and characters", idea: "Join many pieces efficiently, and convert between characters and numbers.", notes: {
      cpp: "`+=` on a `std::string` is cheap. `'7' - '0'` turns a digit into its value.",
      java: "Use `StringBuilder` in loops: `s += x` copies the string every time, which makes the loop O(n^2).",
      python: "Collect pieces in a list and `''.join` them. `ord` and `chr` convert characters.",
      js: "`join` on an array, or `+=` (engines optimize it). `charCodeAt` and `fromCharCode` convert.",
      ts: "Same as JavaScript.",
      rust: "`push` adds a char, `push_str` a string. `b'a'` is a byte, `'a'` a Unicode char.",
    } },
    { id: "bigint", title: "Big numbers and modulo 1e9+7", idea: "Many answers must be given modulo 1,000,000,007. Know your integer limits and fast power.", notes: {
      cpp: "Multiply two values below 1e9+7 in `long long`, then take `%`; `int` would overflow.",
      java: "`long` and the `L` suffix. `BigInteger` exists when 64 bits are not enough.",
      python: "Integers are unlimited and `pow(b, e, m)` is built in.",
      js: "Numbers lose precision past 2^53, so use `BigInt` (`123n`) for products like these.",
      ts: "The `bigint` type; it does not mix with `number` without converting.",
      rust: "Pick `u64` or `i64`; `u128` exists for products that overflow 64 bits.",
    } },
  ] },
];

export const SYN_TOPICS = SYN_GROUPS.flatMap((g) => g.topics);
/** Tick key for "learned this topic in this language", kept in the synced patterns store. */
export const synKey = (topic: string, lang: SynLang) => `syntax:${topic}:${lang}`;
