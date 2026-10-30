import type { Subject } from "./types";

export const SYNTAX: Subject = {
  id: "syntax",
  name: "Programming languages",
  short: "Syntax",
  blurb: "C++, Java, Python, JavaScript and TypeScript side by side, from variables to concurrency, plus the standard-library toolkit you need for coding rounds. Every example is a complete program; switch languages at the top.",
  chapters: [
    {
      id: "basics",
      title: "Variables, types and constants",
      summary: "C++ and Java are **statically typed** and compiled: every variable has a fixed type checked before the program runs. Python and JavaScript are **dynamically typed**: values carry types, variables do not. TypeScript adds static types on top of JavaScript and erases them when it runs.",
      table: { head: ["", "C++", "Java", "Python", "JavaScript / TypeScript"], rows: [
        ["Integer size", "int usually 32-bit, long long 64-bit", "int 32-bit, long 64-bit", "unbounded", "number is a 64-bit float; BigInt for big integers"],
        ["Overflow", "signed overflow is undefined behaviour", "wraps around silently", "never", "loses precision above 2^53"],
        ["Constant", "const", "final", "convention (UPPER_CASE)", "const (binding only)"],
        ["Type inference", "auto", "var", "always", "TS infers from the value"],
      ] },
      code: {
        cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    int count = 3;                 // usually 32 bits
    long long big = 9000000000LL;  // 64 bits
    double price = 9.99;
    bool ok = true;
    char grade = 'A';
    string name = "Asha";
    auto total = count * price;    // auto: the compiler infers double
    const int LIMIT = 100;         // cannot be reassigned
    cout << name << " " << count << " " << big << " " << total << " " << ok << " " << grade << " " << LIMIT << "\\n";
}`,
        java: `public class Main {
    public static void main(String[] args) {
        int count = 3;
        long big = 9_000_000_000L;
        double price = 9.99;
        boolean ok = true;
        char grade = 'A';
        String name = "Asha";
        var total = count * price;          // var: inferred as double (Java 10+)
        final int LIMIT = 100;              // cannot be reassigned
        System.out.println(name + " " + count + " " + big + " " + total + " " + ok + " " + grade + " " + LIMIT);
    }
}`,
        python: `count = 3              # int: arbitrary precision, never overflows
big = 9_000_000_000
price = 9.99           # float
ok = True              # bool
name = "Asha"          # str
total = count * price
LIMIT = 100            # a constant only by convention
print(name, count, big, total, ok, LIMIT)
print(type(count).__name__, type(price).__name__)`,
        js: `const name = "Asha";        // const: the binding cannot be reassigned
let count = 3;              // let: block-scoped and changeable (avoid var)
const big = 9_000_000_000n; // BigInt for integers beyond 2^53
const price = 9.99;         // every number is a 64-bit float
const ok = true;
const total = count * price;
console.log(name, count, big, total, ok, typeof price, typeof big);`,
        ts: `const name: string = "Asha";
let count: number = 3;
const price = 9.99;                       // inferred as number
const ok: boolean = true;
const tags: string[] = ["new", "vip"];
const point: [number, number] = [2, 3];   // tuple
let id: string | number = "u-1";          // union type
id = 42;
const total = count * price;
console.log(name, count, total, ok, tags, point, id);`,
      },
      cards: [
        { id: "eq", q: "JavaScript: == vs ===?", a: "`===` compares value and type with no conversion. `==` converts types first, which gives surprises: `0 == \"\"` is true, `null == undefined` is true, `\"1\" == 1` is true. Use `===` always; the one common exception is `x == null`, which checks for both null and undefined.", trap: "`NaN === NaN` is false. Use `Number.isNaN(x)`." },
        { id: "var-let", q: "var vs let vs const in JavaScript?", a: "`var` is function-scoped and hoisted (usable before its line, as undefined), which causes bugs in loops and closures. `let` and `const` are block-scoped and in the temporal dead zone until declared. `const` stops reassignment of the variable, not mutation of the object it points to." },
        { id: "static-dynamic", q: "Static vs dynamic typing: what do you gain and lose?", a: "Static typing catches type errors before running, helps editors autocomplete and refactor, and lets compilers optimise. Dynamic typing is quicker to write and more flexible, but errors appear only when that line runs. TypeScript and Python type hints give static checking to dynamic languages without changing how they run." },
      ],
    },
    {
      id: "control",
      title: "Control flow",
      summary: "If, loops and switch look alike in all five languages. The differences are in the details: Python uses indentation instead of braces, Java and Python have expression-style switch/match, and JavaScript has two different for-loops for values and keys.",
      code: {
        cpp: `#include <iostream>
using namespace std;

int main() {
    int sum = 0;
    for (int i = 1; i <= 10; i++) {
        if (i % 2 != 0) continue;   // skip odd numbers
        sum += i;
    }
    int n = 3, steps = 0;
    while (n > 0) { n--; steps++; }
    int day = 6;
    switch (day) {
        case 6: case 7: cout << "weekend\\n"; break;   // without break, execution falls through
        default: cout << "weekday\\n";
    }
    cout << sum << " " << steps << "\\n";   // 30 3
}`,
        java: `public class Main {
    public static void main(String[] args) {
        int sum = 0;
        for (int i = 1; i <= 10; i++) {
            if (i % 2 != 0) continue;
            sum += i;
        }
        int n = 3, steps = 0;
        while (n > 0) { n--; steps++; }
        int day = 6;
        String kind = switch (day) {            // switch expression (Java 14+), no fall-through
            case 6, 7 -> "weekend";
            default -> "weekday";
        };
        System.out.println(kind + " " + sum + " " + steps);   // weekend 30 3
    }
}`,
        python: `total = 0
for i in range(1, 11):          # 1 to 10; range excludes the end
    if i % 2:
        continue
    total += i
n, steps = 3, 0
while n > 0:
    n -= 1
    steps += 1
day = 6
match day:                      # structural pattern matching (Python 3.10+)
    case 6 | 7:
        kind = "weekend"
    case _:
        kind = "weekday"
print(kind, total, steps)       # weekend 30 3
for i, ch in enumerate("ab"):   # index and value together
    print(i, ch)`,
        js: `let sum = 0;
for (let i = 1; i <= 10; i++) {
  if (i % 2 !== 0) continue;
  sum += i;
}
let n = 3, steps = 0;
while (n > 0) { n--; steps++; }
const day = 6;
let kind;
switch (day) {
  case 6: case 7: kind = "weekend"; break;
  default: kind = "weekday";
}
for (const ch of "ab") console.log(ch);             // for...of: values
for (const key in { x: 1, y: 2 }) console.log(key); // for...in: keys (avoid on arrays)
console.log(kind, sum, steps);                      // weekend 30 3`,
        ts: `let sum = 0;
for (let i = 1; i <= 10; i++) {
  if (i % 2 !== 0) continue;
  sum += i;
}
type Day = "mon" | "sat" | "sun";
function kind(d: Day): string {
  switch (d) {
    case "sat":
    case "sun":
      return "weekend";
    default:
      return "weekday";
  }
}
console.log(kind("sat"), sum);   // weekend 30`,
      },
      cards: [
        { id: "for-in-of", q: "JavaScript: for...in vs for...of?", a: "`for...of` iterates values of any iterable (arrays, strings, Maps, Sets). `for...in` iterates enumerable property keys of an object, including inherited ones, and gives array indices as strings. Use for...of for arrays and Object.entries for objects." },
        { id: "fallthrough", q: "What is switch fall-through?", a: "In C, C++, Java's classic switch and JavaScript, execution continues into the next case unless you `break`. It is occasionally useful for grouping cases, but forgetting a break is a classic bug. Java's arrow-style switch and Python's match never fall through." },
      ],
    },
    {
      id: "functions",
      title: "Functions, lambdas and closures",
      summary: "Every language here treats functions as values you can pass around. The differences are in defaults, variadic arguments, how arguments are passed, and how closures capture variables.",
      code: {
        cpp: `#include <functional>
#include <iostream>
using namespace std;

int add(int a, int b = 10) { return a + b; }            // default argument
void bump(int& x) { x++; }                               // by reference: changes the caller's variable
int applyTo(const function<int(int)>& f, int v) { return f(v); }

int main() {
    int k = 5;
    bump(k);
    auto square = [](int x) { return x * x; };           // lambda
    int factor = 3;
    auto times = [factor](int x) { return x * factor; }; // captures factor by value
    cout << add(1) << " " << add(1, 2) << " " << k << " " << applyTo(square, 4) << " " << times(5) << "\\n";   // 11 3 6 16 15
}`,
        java: `import java.util.function.Function;
import java.util.function.IntBinaryOperator;

public class Main {
    static int add(int a, int b) { return a + b; }
    static int add(int a) { return add(a, 10); }            // overloading instead of default arguments
    static void bump(int[] box) { box[0]++; }                // Java passes references by value

    public static void main(String[] args) {
        int[] k = {5};
        bump(k);
        Function<Integer, Integer> square = x -> x * x;       // lambda
        IntBinaryOperator mul = (a, b) -> a * b;
        System.out.println(add(1) + " " + add(1, 2) + " " + k[0] + " " + square.apply(4) + " " + mul.applyAsInt(3, 5));
    }
}`,
        python: `def add(a, b=10):
    return a + b

def stats(*nums, round_to=2):          # *nums collects extra arguments; round_to is keyword-only
    return round(sum(nums) / len(nums), round_to)

def bump(items):                       # the list object itself is shared with the caller
    items.append(1)

square = lambda x: x * x
data = []
bump(data)
print(add(1), add(1, 2), stats(1, 2, 4), data, square(4))
print(sorted(["bb", "a", "ccc"], key=len))   # functions as arguments`,
        js: `function add(a, b = 10) { return a + b; }
const square = (x) => x * x;                                  // arrow function
const sum = (...nums) => nums.reduce((t, n) => t + n, 0);     // rest parameters
function counter() {                                          // closure: the inner function keeps count alive
  let count = 0;
  return () => ++count;
}
const next = counter();
next(); next();
console.log(add(1), add(1, 2), square(4), sum(1, 2, 3), next());   // 11 3 16 6 3`,
        ts: `function add(a: number, b: number = 10): number { return a + b; }
const square = (x: number): number => x * x;
function greet(name: string, title?: string): string {     // optional parameter
  return title ? \`\${title} \${name}\` : name;
}
function apply<T>(f: (v: T) => T, v: T): T { return f(v); }  // a function type as a parameter
console.log(add(1), square(4), greet("Asha"), greet("Rao", "Dr"), apply(square, 5));`,
      },
      cards: [
        { id: "closure", q: "What is a closure? Give a real use.", a: "A function bundled with the variables it captured from where it was created, which stay alive as long as the function does. Uses: counters and memoisation caches with private state, event handlers that remember an id, and partially applied functions (`const add5 = (x) => x + 5`).",
          code: { js: `function memoize(fn) {
  const cache = new Map();                       // private state kept alive by the closure
  return (n) => {
    if (!cache.has(n)) cache.set(n, fn(n));
    return cache.get(n);
  };
}
let calls = 0;
const slowSquare = (n) => { calls++; return n * n; };
const fast = memoize(slowSquare);
console.log(fast(9), fast(9), calls);            // 81 81 1` } },
        { id: "pass", q: "Pass by value vs by reference: what do Java and Python actually do?", a: "Both pass object references **by value**: the function gets a copy of the reference. Mutating the object (list.add) is visible to the caller; reassigning the parameter (`list = new ArrayList<>()`) is not. C++ lets you choose: by value, by reference (`T&`) or by pointer.",
          trap: "\"Java is pass by reference\" is wrong; a swap(a, b) function cannot swap the caller's variables." },
        { id: "this-arrow", q: "Why do arrow functions behave differently with `this`?", a: "Arrow functions have no `this` of their own; they use the `this` of the surrounding code. That makes them right for callbacks inside methods, and wrong as object methods that need `this` to be the object." },
      ],
    },
    {
      id: "strings",
      title: "Strings",
      summary: "Strings are immutable in Java, Python and JavaScript: every change makes a new string, so build long strings with StringBuilder, a list joined at the end, or join(). C++'s std::string is mutable.",
      code: {
        cpp: `#include <algorithm>
#include <cctype>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string s = "hello world";
    string up = s;
    for (char& c : up) c = static_cast<char>(toupper(static_cast<unsigned char>(c)));
    string rev(s.rbegin(), s.rend());
    vector<string> words;
    stringstream ss(s);
    for (string w; ss >> w;) words.push_back(w);           // split on whitespace
    size_t pos = s.find("world");                            // string::npos if missing
    s += "!";                                                // std::string is mutable
    cout << up << " | " << rev << " | " << words.size() << " | " << pos << " | " << s.substr(0, 5) << " | " << s << "\\n";
}`,
        java: `public class Main {
    public static void main(String[] args) {
        String s = "hello world";
        String up = s.toUpperCase();
        String rev = new StringBuilder(s).reverse().toString();
        String[] words = s.split(" ");
        int pos = s.indexOf("world");                       // -1 if missing
        StringBuilder sb = new StringBuilder();             // build strings in a loop with StringBuilder
        for (String w : words) sb.append(w.charAt(0));
        System.out.println(up + " | " + rev + " | " + words.length + " | " + pos + " | " + s.substring(0, 5) + " | " + sb);
        System.out.println("a".equals(new String("a")) + " " + String.format("%.2f", 3.14159));
    }
}`,
        python: `s = "hello world"
print(s.upper(), "|", s[::-1], "|", s.split(), "|", s.find("world"), "|", s[:5])
print("-".join(["a", "b", "c"]), f"{3.14159:.2f}", s.count("o"), "World" in s.title())
chars = list(s)            # strings are immutable: edit a list, then join
chars[0] = "H"
print("".join(chars), ord("a"), chr(98))`,
        js: `const s = "hello world";
console.log(s.toUpperCase(), "|", [...s].reverse().join(""), "|", s.split(" "), "|", s.indexOf("world"), "|", s.slice(0, 5));
console.log(["a", "b", "c"].join("-"), (3.14159).toFixed(2), s.includes("world"), \`\${s.length} chars\`);
console.log(s.replaceAll("o", "0"), s.at(-1), "a".charCodeAt(0), String.fromCharCode(98));`,
        ts: `const s: string = "hello world";
const words: string[] = s.split(" ");
const capitalized = words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
const counts: Record<string, number> = {};
for (const ch of s.replaceAll(" ", "")) counts[ch] = (counts[ch] ?? 0) + 1;
console.log(capitalized, counts["o"], s.padStart(13, "*"));`,
      },
      cards: [
        { id: "string-concat", q: "Why is `s += x` in a loop slow in Java or Python?", a: "Each `+=` creates a new string and copies everything so far, so n appends cost O(n²). Collect pieces in a StringBuilder (Java) or a list joined once (`\"\".join(parts)`) for O(n). JavaScript engines optimise `+=` with ropes, but join is still the clear choice." },
        { id: "java-equals", q: "Java: why does `==` sometimes work for strings and sometimes not?", a: "`==` compares references. String literals are interned (pooled), so two equal literals share one object and `==` is true; a string built at run time (`new String`, concatenation, input) is a different object. Always compare content with `.equals()`." },
      ],
    },
    {
      id: "collections",
      title: "Collections: lists, maps and sets",
      summary: "Every language has a growable array, a hash map and a set. Know which one is ordered, what lookups cost, and how to count things in one line: this is half of every coding round.",
      table: { head: ["", "C++", "Java", "Python", "JavaScript"], rows: [
        ["Dynamic array", "vector", "ArrayList", "list", "Array"],
        ["Hash map (O(1) avg)", "unordered_map", "HashMap", "dict", "Map (or object)"],
        ["Sorted map (O(log n))", "map", "TreeMap", "sortedcontainers (3rd party)", "none built in"],
        ["Set", "unordered_set / set", "HashSet / TreeSet", "set", "Set"],
      ] },
      code: {
        cpp: `#include <iostream>
#include <map>
#include <set>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    vector<int> v = {5, 3, 8};
    v.push_back(1);
    v.pop_back();
    unordered_map<string, int> freq;                   // hash map: O(1) on average
    for (string w : {"a", "b", "a"}) freq[w]++;        // operator[] inserts 0 if the key is missing
    map<string, int> sorted(freq.begin(), freq.end()); // ordered by key (red-black tree, O(log n))
    set<int> seen = {3, 1, 3};                         // unique and sorted
    cout << v.size() << " " << v[0] << " " << freq["a"] << " " << sorted.begin()->first << " " << seen.size() << " " << seen.count(2) << "\\n";
}`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> v = new ArrayList<>(List.of(5, 3, 8));
        v.add(1);
        v.remove(v.size() - 1);                          // remove by index
        Map<String, Integer> freq = new HashMap<>();
        for (String w : new String[] {"a", "b", "a"}) freq.merge(w, 1, Integer::sum);
        Map<String, Integer> sorted = new TreeMap<>(freq);
        Set<Integer> seen = new TreeSet<>(List.of(3, 1, 3));
        System.out.println(v.size() + " " + v.get(0) + " " + freq.get("a") + " " + sorted.keySet() + " " + seen + " " + seen.contains(2));
    }
}`,
        python: `from collections import Counter, defaultdict

v = [5, 3, 8]
v.append(1)
v.pop()
freq = Counter(["a", "b", "a"])          # counting in one line
groups = defaultdict(list)               # missing keys start as []
for word in ["apple", "avocado", "banana"]:
    groups[word[0]].append(word)
seen = {3, 1, 3}                         # set: unique, unordered
pairs = {"x": 1, "y": 2}                 # dicts keep insertion order
print(len(v), v[0], freq["a"], dict(groups), seen, 2 in seen, list(pairs.items()))`,
        js: `const v = [5, 3, 8];
v.push(1);
v.pop();
const freq = new Map();                          // Map: any key type, keeps insertion order
for (const w of ["a", "b", "a"]) freq.set(w, (freq.get(w) ?? 0) + 1);
const seen = new Set([3, 1, 3]);
const obj = { x: 1, y: 2 };                      // plain object: string keys only
console.log(v.length, v[0], freq.get("a"), [...freq.keys()], seen.size, seen.has(2), Object.entries(obj));`,
        ts: `const v: number[] = [5, 3, 8];
const freq = new Map<string, number>();
for (const w of ["a", "b", "a"]) freq.set(w, (freq.get(w) ?? 0) + 1);
const byLetter: Record<string, string[]> = {};
for (const word of ["apple", "avocado", "banana"]) (byLetter[word[0]] ??= []).push(word);
const seen: Set<number> = new Set([3, 1, 3]);
console.log(v.length, freq.get("a"), byLetter, seen.size);`,
      },
      cards: [
        { id: "hashmap-internals", q: "How does a hash map work, and when does it degrade to O(n)?", a: "The key's hash picks a bucket in an array; collisions share a bucket (a chain or probing). Lookups are O(1) on average. With a bad hash or adversarial keys, many keys land in one bucket and lookups degrade (Java 8+ turns long chains into balanced trees, O(log n)). The table resizes (rehashes) when it gets too full." },
        { id: "map-vs-object", q: "JavaScript: Map vs plain object?", a: "Use Map for dictionaries: keys of any type, a reliable size, insertion order, no inherited keys like `constructor`, and faster frequent add/delete. Use objects for fixed-shape records and JSON." },
        { id: "unordered-map-hack", q: "C++: map vs unordered_map in contests?", a: "`unordered_map` is faster on average but can be attacked with crafted inputs (hacks on Codeforces) that cause many collisions; use a custom hash with a random seed, or `map` (O(log n), never degrades) when you need ordered keys or safety." },
      ],
    },
    {
      id: "classes",
      title: "Classes, interfaces and inheritance",
      summary: "The same idea in five dialects: a base type with an abstract method, two subclasses, and a loop that calls each one through the base type. See the OOP subject for the theory; this chapter is the syntax.",
      code: {
        cpp: `#include <iostream>
#include <memory>
#include <string>
#include <vector>
using namespace std;

class Animal {
public:
    explicit Animal(string n) : name(std::move(n)) {}
    virtual ~Animal() = default;
    virtual string sound() const = 0;                     // pure virtual: subclasses must define it
    string intro() const { return name + " says " + sound(); }
protected:
    string name;
};
class Dog : public Animal {
public:
    using Animal::Animal;                                 // reuse the base constructor
    string sound() const override { return "woof"; }
};
class Cat : public Animal {
public:
    using Animal::Animal;
    string sound() const override { return "meow"; }
};

int main() {
    vector<unique_ptr<Animal>> pets;
    pets.push_back(make_unique<Dog>("Rex"));
    pets.push_back(make_unique<Cat>("Tom"));
    for (const auto& p : pets) cout << p->intro() << "\\n";
}`,
        java: `import java.util.List;

public class Main {
    interface Speaker { String sound(); }
    static abstract class Animal implements Speaker {
        protected final String name;
        Animal(String name) { this.name = name; }
        String intro() { return name + " says " + sound(); }
    }
    static class Dog extends Animal { Dog(String n) { super(n); } public String sound() { return "woof"; } }
    static class Cat extends Animal { Cat(String n) { super(n); } public String sound() { return "meow"; } }
    record Point(int x, int y) {}                             // immutable data class (Java 16+)

    public static void main(String[] args) {
        for (Animal a : List.of(new Dog("Rex"), new Cat("Tom"))) System.out.println(a.intro());
        System.out.println(new Point(1, 2));
    }
}`,
        python: `from abc import ABC, abstractmethod
from dataclasses import dataclass

class Animal(ABC):
    def __init__(self, name):
        self.name = name

    @abstractmethod
    def sound(self): ...

    def intro(self):
        return f"{self.name} says {self.sound()}"

class Dog(Animal):
    def sound(self):
        return "woof"

class Cat(Animal):
    def sound(self):
        return "meow"

@dataclass(frozen=True)          # generates __init__, __repr__ and __eq__; frozen makes it immutable
class Point:
    x: int
    y: int

for pet in [Dog("Rex"), Cat("Tom")]:
    print(pet.intro())
print(Point(1, 2), Point(1, 2) == Point(1, 2))`,
        js: `class Animal {
  #secret = "hidden";                         // private field (# prefix)
  constructor(name) { this.name = name; }
  intro() { return \`\${this.name} says \${this.sound()}\`; }
  hasSecret() { return this.#secret.length > 0; }
  static create(kind, name) { return kind === "dog" ? new Dog(name) : new Cat(name); }
}
class Dog extends Animal { sound() { return "woof"; } }
class Cat extends Animal { sound() { return "meow"; } }

for (const pet of [Animal.create("dog", "Rex"), Animal.create("cat", "Tom")]) console.log(pet.intro(), pet.hasSecret());`,
        ts: `interface Speaker { sound(): string }

abstract class Animal implements Speaker {
  protected readonly name: string;
  constructor(name: string) { this.name = name; }
  abstract sound(): string;
  intro(): string { return \`\${this.name} says \${this.sound()}\`; }
}
class Dog extends Animal { sound() { return "woof"; } }
class Cat extends Animal { sound() { return "meow"; } }

const pets: Animal[] = [new Dog("Rex"), new Cat("Tom")];
for (const p of pets) console.log(p.intro());`,
      },
      cards: [
        { id: "prototype", q: "How does JavaScript inheritance work under `class`?", a: "Through prototypes. Every object has a hidden link to another object (its prototype); a missing property is looked up along that chain. `class` and `extends` are syntax over this: methods live on `Class.prototype`, and `extends` links the prototypes.",
          diagram: `flowchart LR
  rex["rex (name: Rex)"] -->|"__proto__"| DP["Dog.prototype<br/>sound()"]
  DP -->|"__proto__"| AP["Animal.prototype<br/>intro(), hasSecret()"]
  AP -->|"__proto__"| OP["Object.prototype<br/>toString()"]` },
        { id: "py-dunder", q: "Python: what are dunder methods?", a: "Special methods with double underscores that hook into syntax: `__init__` (construction), `__repr__` / `__str__` (printing), `__eq__` / `__lt__` (comparisons, sorting), `__len__`, `__getitem__` (indexing), `__iter__` (for loops), `__enter__` / `__exit__` (with blocks). Defining `__lt__` makes your objects sortable." },
        { id: "ts-interface-type", q: "TypeScript: interface vs type alias?", a: "Both describe object shapes. Interfaces can be extended and re-opened (declaration merging), which suits public APIs. Type aliases can also name unions, tuples and mapped or conditional types. Pick one style for object shapes and use `type` for everything else." },
      ],
    },
    {
      id: "errors",
      title: "Errors and exceptions",
      summary: "All five throw and catch exceptions. Java alone forces you to declare or handle checked exceptions; TypeScript code often returns errors as values instead, and async code needs its own handling.",
      code: {
        cpp: `#include <iostream>
#include <stdexcept>
#include <string>
using namespace std;

class InsufficientFunds : public runtime_error {
public:
    explicit InsufficientFunds(const string& m) : runtime_error(m) {}
};

double withdraw(double balance, double amount) {
    if (amount > balance) throw InsufficientFunds("balance too low");
    return balance - amount;
}

int main() {
    try {
        cout << withdraw(50, 80) << "\\n";
    } catch (const InsufficientFunds& e) {      // catch by const reference
        cout << "caught: " << e.what() << "\\n";
    }
    try {
        int n = stoi("abc");
        cout << n << "\\n";
    } catch (const invalid_argument&) {
        cout << "not a number\\n";
    }
}`,
        java: `public class Main {
    static class InsufficientFunds extends Exception {           // checked: callers must handle or declare it
        InsufficientFunds(String m) { super(m); }
    }
    static double withdraw(double balance, double amount) throws InsufficientFunds {
        if (amount > balance) throw new InsufficientFunds("balance too low");
        return balance - amount;
    }
    public static void main(String[] args) {
        try {
            withdraw(50, 80);
        } catch (InsufficientFunds e) {
            System.out.println("caught: " + e.getMessage());
        } finally {
            System.out.println("finally always runs");
        }
        try { Integer.parseInt("abc"); } catch (NumberFormatException e) { System.out.println("not a number"); }
    }
}`,
        python: `class InsufficientFunds(Exception):
    pass

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientFunds("balance too low")
    return balance - amount

try:
    withdraw(50, 80)
except InsufficientFunds as e:
    print("caught:", e)
else:
    print("no error")            # runs only if nothing was raised
finally:
    print("finally always runs")

try:
    int("abc")
except ValueError:
    print("not a number")`,
        js: `class InsufficientFunds extends Error {
  constructor(message) { super(message); this.name = "InsufficientFunds"; }
}
function withdraw(balance, amount) {
  if (amount > balance) throw new InsufficientFunds("balance too low");
  return balance - amount;
}
try {
  withdraw(50, 80);
} catch (e) {
  if (e instanceof InsufficientFunds) console.log("caught:", e.message);
  else throw e;                                   // rethrow what you cannot handle
} finally {
  console.log("finally always runs");
}
const fail = async () => { throw new Error("async boom"); };
fail().catch((e) => console.log("caught:", e.message));   // async errors need .catch or try/await`,
        ts: `class InsufficientFunds extends Error {
  constructor(message: string) { super(message); this.name = "InsufficientFunds"; }
}
type Result<T> = { ok: true; value: T } | { ok: false; error: string };   // errors as values

function withdraw(balance: number, amount: number): Result<number> {
  return amount > balance ? { ok: false, error: "balance too low" } : { ok: true, value: balance - amount };
}
const r = withdraw(50, 80);
if (r.ok) console.log(r.value); else console.log("failed:", r.error);   // narrowing on r.ok
try { throw new InsufficientFunds("x"); } catch (e: unknown) {          // catch variables are unknown
  if (e instanceof Error) console.log(e.name, e.message);
}`,
      },
      cards: [
        { id: "unhandled", q: "What happens to an unhandled promise rejection in Node?", a: "Since Node 15 the process crashes with an error by default. Always `await` inside try/catch or attach `.catch`, and add a process-level `unhandledRejection` handler only for logging, not as a substitute." },
        { id: "raii-vs-finally", q: "C++ has no finally. How is cleanup guaranteed?", a: "RAII: put the resource in an object whose destructor releases it. Destructors run during stack unwinding when an exception propagates, so locks (`lock_guard`), files (`ifstream`) and memory (`unique_ptr`) are released automatically." },
      ],
    },
    {
      id: "generics",
      title: "Generics and templates",
      summary: "Write code once for many types. C++ templates generate a copy per type at compile time; Java generics are checked at compile time and erased at run time; TypeScript generics exist only for the type checker; Python has type hints; JavaScript simply accepts anything.",
      code: {
        cpp: `#include <iostream>
#include <string>
#include <vector>
using namespace std;

template <typename T>
T largest(const vector<T>& items) {          // works for any T that supports <
    T best = items[0];
    for (const T& x : items) if (best < x) best = x;
    return best;
}

template <typename K, typename V>
struct Pair { K key; V value; };

int main() {
    cout << largest(vector<int>{3, 9, 2}) << " " << largest(vector<string>{"pear", "apple"}) << "\\n";
    Pair<string, int> p{"age", 21};
    cout << p.key << "=" << p.value << "\\n";
}`,
        java: `import java.util.List;

public class Main {
    static <T extends Comparable<T>> T largest(List<T> items) {   // bounded type parameter
        T best = items.get(0);
        for (T x : items) if (x.compareTo(best) > 0) best = x;
        return best;
    }
    record Pair<K, V>(K key, V value) {}

    public static void main(String[] args) {
        System.out.println(largest(List.of(3, 9, 2)) + " " + largest(List.of("pear", "apple")));
        Pair<String, Integer> p = new Pair<>("age", 21);
        System.out.println(p.key() + "=" + p.value());
    }
}`,
        python: `from typing import Generic, TypeVar

T = TypeVar("T")

def largest(items: list[T]) -> T:          # hints are checked by tools like mypy, not at run time
    return max(items)

class Box(Generic[T]):
    def __init__(self, value: T):
        self.value = value

print(largest([3, 9, 2]), largest(["pear", "apple"]), Box(5).value)`,
        js: `// JavaScript has no generics: functions accept any value, so pass behaviour in when types differ.
function largest(items, compare = (a, b) => (a > b ? 1 : a < b ? -1 : 0)) {
  return items.reduce((best, x) => (compare(x, best) > 0 ? x : best));
}
console.log(largest([3, 9, 2]), largest(["pear", "apple"]), largest([{ n: 2 }, { n: 5 }], (a, b) => a.n - b.n));`,
        ts: `function largest<T>(items: T[], compare: (a: T, b: T) => number): T {
  return items.reduce((best, x) => (compare(x, best) > 0 ? x : best));
}
interface HasId { id: number }
function byId<T extends HasId>(items: T[], id: number): T | undefined {   // constraint
  return items.find((x) => x.id === id);
}
type Pair<K, V> = { key: K; value: V };
const p: Pair<string, number> = { key: "age", value: 21 };
console.log(largest([3, 9, 2], (a, b) => a - b), byId([{ id: 1, name: "Asha" }], 1)?.name, p);`,
      },
      cards: [
        { id: "erasure", q: "What is type erasure in Java, and one consequence?", a: "Generic type arguments are checked by the compiler and then removed; at run time a `List<String>` and a `List<Integer>` are both just `List`. So you cannot write `new T()`, `T[]` arrays, or `instanceof List<String>`, and primitives need boxing (`List<Integer>`, not `List<int>`)." },
        { id: "ts-utility", q: "TypeScript utility types you should know?", a: "`Partial<T>` (all optional), `Required<T>`, `Readonly<T>`, `Pick<T, K>` and `Omit<T, K>` (choose or drop fields), `Record<K, V>` (dictionary), `ReturnType<F>`, `Awaited<P>`, and `NonNullable<T>`. They are built from mapped and conditional types, which you can write yourself.",
          code: { ts: `interface User { id: number; name: string; email: string }
type UserPatch = Partial<Omit<User, "id">>;            // edit anything except id, all optional
type Preview = Pick<User, "id" | "name">;
type ById = Record<number, Preview>;
function update(u: User, patch: UserPatch): User { return { ...u, ...patch }; }
const u: User = { id: 1, name: "Asha", email: "a@x.com" };
const index: ById = { 1: { id: 1, name: u.name } };
console.log(update(u, { name: "Asha R" }).name, index[1].name);` } },
      ],
    },
    {
      id: "functional",
      title: "Map, filter, reduce, streams and comprehensions",
      summary: "Transform collections declaratively: keep the even numbers, square them, add them up. C++ uses algorithm functions, Java uses streams, Python uses comprehensions and generator expressions, JavaScript and TypeScript chain array methods.",
      code: {
        cpp: `#include <algorithm>
#include <iostream>
#include <iterator>
#include <numeric>
#include <vector>
using namespace std;

int main() {
    vector<int> nums = {1, 2, 3, 4, 5, 6};
    vector<int> evens;
    copy_if(nums.begin(), nums.end(), back_inserter(evens), [](int x) { return x % 2 == 0; });
    vector<int> squares(evens.size());
    transform(evens.begin(), evens.end(), squares.begin(), [](int x) { return x * x; });
    int total = accumulate(squares.begin(), squares.end(), 0);
    bool anyBig = any_of(nums.begin(), nums.end(), [](int x) { return x > 5; });
    cout << total << " " << anyBig << "\\n";   // 56 1
}`,
        java: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);
        int total = nums.stream().filter(x -> x % 2 == 0).mapToInt(x -> x * x).sum();
        Map<Boolean, List<Integer>> parts = nums.stream().collect(Collectors.partitioningBy(x -> x > 3));
        List<String> sorted = Stream.of("kiwi", "apple", "fig").sorted(Comparator.comparing(String::length)).toList();
        System.out.println(total + " " + parts.get(true) + " " + sorted);   // 56 [4, 5, 6] [fig, kiwi, apple]
    }
}`,
        python: `from functools import reduce

nums = [1, 2, 3, 4, 5, 6]
total = sum(x * x for x in nums if x % 2 == 0)           # generator expression: no list built
squares = {x: x * x for x in range(4)}                   # dict comprehension
product = reduce(lambda a, b: a * b, nums)
words = sorted(["kiwi", "apple", "fig"], key=len)
print(total, squares, product, words, any(x > 5 for x in nums))`,
        js: `const nums = [1, 2, 3, 4, 5, 6];
const total = nums.filter((x) => x % 2 === 0).map((x) => x * x).reduce((a, b) => a + b, 0);
const words = ["kiwi", "apple", "fig"].toSorted((a, b) => a.length - b.length);   // non-mutating sort
const grouped = Object.groupBy(nums, (x) => (x % 2 ? "odd" : "even"));
console.log(total, words, grouped, nums.some((x) => x > 5), nums.every((x) => x > 0));`,
        ts: `type Order = { customer: string; amount: number };
const orders: Order[] = [{ customer: "ravi", amount: 250 }, { customer: "meera", amount: 400 }, { customer: "ravi", amount: 100 }];
const totals = orders.reduce<Record<string, number>>((acc, o) => {
  acc[o.customer] = (acc[o.customer] ?? 0) + o.amount;
  return acc;
}, {});
const top = Object.entries(totals).sort(([, a], [, b]) => b - a)[0];
console.log(totals, top);   // { ravi: 350, meera: 400 } [ 'meera', 400 ]`,
      },
      cards: [
        { id: "lazy", q: "Which of these are lazy?", a: "Java streams and Python generators are lazy: nothing runs until a terminal operation (sum, collect, a for loop), and they process one element at a time. JavaScript array methods are eager: each step builds a full new array (iterator helpers like `.values().filter()` are the lazy alternative). Laziness saves memory on big or infinite sequences." },
        { id: "py-gen", q: "Python: what does `yield` do?", a: "It turns a function into a generator: each `yield` hands one value out and pauses the function where it is, resuming on the next request. Generators produce sequences lazily, so you can stream a huge file line by line or model an infinite sequence.",
          code: { python: `def fib():
    a, b = 0, 1
    while True:              # infinite, but only computed on demand
        yield a
        a, b = b, a + b

gen = fib()
print([next(gen) for _ in range(10)])   # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]` } },
      ],
    },
    {
      id: "dsa-toolkit",
      title: "The coding-round toolkit: sort, heap, deque, binary search",
      summary: "The standard-library pieces you reach for in almost every DSA problem, in each language. Knowing these by heart saves minutes in every round.",
      table: { head: ["Need", "C++", "Java", "Python", "JavaScript"], rows: [
        ["Min-heap", "priority_queue<int, vector<int>, greater<int>>", "PriorityQueue<>()", "heapq", "write one (no built-in)"],
        ["Max-heap", "priority_queue<int>", "PriorityQueue<>(reverseOrder())", "heapq with negated values", "write one"],
        ["Deque / stack / queue", "deque, stack, queue", "ArrayDeque", "collections.deque", "Array (shift is O(n))"],
        ["Binary search", "lower_bound / upper_bound", "Arrays.binarySearch, Collections.binarySearch", "bisect", "write one"],
        ["Sort with key", "sort(begin, end, cmp)", "Arrays.sort / list.sort(cmp)", "sorted(key=...)", "arr.sort((a, b) => ...)"],
      ] },
      code: {
        cpp: `#include <algorithm>
#include <deque>
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    vector<pair<int, int>> iv = {{3, 9}, {1, 4}, {1, 2}};
    sort(iv.begin(), iv.end());                                    // pairs sort by first, then second
    sort(iv.begin(), iv.end(), [](const auto& a, const auto& b) { return a.second > b.second; });   // custom order

    priority_queue<int> maxHeap;                                   // max-heap by default
    priority_queue<int, vector<int>, greater<int>> minHeap;        // min-heap
    for (int x : {5, 1, 8}) { maxHeap.push(x); minHeap.push(x); }

    deque<int> dq = {2, 3};
    dq.push_front(1); dq.push_back(4);

    vector<int> sorted = {1, 3, 5, 7};
    auto it = lower_bound(sorted.begin(), sorted.end(), 5);       // first element >= 5
    cout << iv[0].second << " " << maxHeap.top() << " " << minHeap.top() << " " << dq.front() << dq.back()
         << " " << (it - sorted.begin()) << "\\n";                  // 9 8 1 14 2
}`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[][] iv = {{3, 9}, {1, 4}, {1, 2}};
        Arrays.sort(iv, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();                    // min-heap by default
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        for (int x : new int[] {5, 1, 8}) { minHeap.add(x); maxHeap.add(x); }
        Deque<Integer> dq = new ArrayDeque<>(List.of(2, 3));                       // stack or queue
        dq.addFirst(1); dq.addLast(4);
        int[] sorted = {1, 3, 5, 7};
        int idx = Arrays.binarySearch(sorted, 5);
        System.out.println(iv[0][1] + " " + maxHeap.peek() + " " + minHeap.peek() + " " + dq.peekFirst() + dq.peekLast() + " " + idx);   // 2 8 1 14 2
    }
}`,
        python: `import heapq
from bisect import bisect_left
from collections import deque

iv = [(3, 9), (1, 4), (1, 2)]
iv.sort()                                   # tuples compare element by element
by_end = sorted(iv, key=lambda p: -p[1])    # custom order

heap = [5, 1, 8]
heapq.heapify(heap)                         # min-heap in place
smallest = heapq.heappop(heap)
max_heap = [-x for x in [5, 1, 8]]          # negate for a max-heap
heapq.heapify(max_heap)

dq = deque([2, 3])
dq.appendleft(1)
dq.append(4)

print(iv[0], by_end[0], smallest, -max_heap[0], dq[0], dq[-1], bisect_left([1, 3, 5, 7], 5))`,
        js: `// No built-in heap: sort with a comparator, and write a small heap when you need one.
const iv = [[3, 9], [1, 4], [1, 2]];
iv.sort((a, b) => a[0] - b[0] || a[1] - b[1]);      // numbers need a comparator: default sort compares strings

class MinHeap {
  #a = [];
  get size() { return this.#a.length; }
  push(x) {
    const a = this.#a;
    a.push(x);
    for (let i = a.length - 1; i > 0;) {             // sift up
      const p = (i - 1) >> 1;
      if (a[p] <= a[i]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.#a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      for (let i = 0; ;) {                           // sift down
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l] < a[m]) m = l;
        if (r < a.length && a[r] < a[m]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}
const h = new MinHeap();
for (const x of [5, 1, 8, 3]) h.push(x);
console.log(iv[0], h.pop(), h.pop(), h.size, [10, 9, 1].sort(), [10, 9, 1].sort((a, b) => a - b));`,
        ts: `function lowerBound(a: number[], target: number): number {
  let lo = 0, hi = a.length;              // the answer is always in [lo, hi]
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] < target) lo = mid + 1; else hi = mid;
  }
  return lo;
}
const counts = new Map<number, number>();
for (const x of [3, 1, 3, 2, 3]) counts.set(x, (counts.get(x) ?? 0) + 1);
const mostCommon = [...counts].sort((a, b) => b[1] - a[1])[0];
console.log(lowerBound([1, 3, 5, 7], 5), mostCommon);   // 2 [ 3, 3 ]`,
      },
      cards: [
        { id: "js-sort", q: "Why does `[10, 9, 1].sort()` return [1, 10, 9] in JavaScript?", a: "Without a comparator, sort converts elements to strings and compares them lexicographically: \"1\" < \"10\" < \"9\". Always pass `(a, b) => a - b` for numbers." },
        { id: "comparator-overflow", q: "Why is `(a, b) -> a - b` dangerous as a Java comparator?", a: "Subtraction can overflow for large ints (for example a = 2,000,000,000 and b = -2,000,000,000), flipping the sign and corrupting the sort. Use `Integer.compare(a, b)` or `Comparator.comparingInt`." },
        { id: "fast-io", q: "How do you speed up input and output in a contest?", a: "C++: `ios::sync_with_stdio(false); cin.tie(nullptr);` and \"\\n\" instead of endl. Java: BufferedReader with StringTokenizer, and a PrintWriter or StringBuilder for output. Python: `sys.stdin.readline` (or read everything at once) and print once with join." },
      ],
    },
    {
      id: "async",
      title: "Concurrency and async",
      summary: "Two different tools: **threads** run code in parallel on several cores; **async** lets one thread juggle many waiting tasks (network, disk). C++ and Java lean on threads, JavaScript is single-threaded with an event loop, and Python has both (the GIL limits CPU-bound threads).",
      code: {
        cpp: `#include <atomic>
#include <future>
#include <iostream>
#include <thread>
#include <vector>
using namespace std;

int main() {
    atomic<int> hits{0};                              // safe to increment from many threads
    vector<thread> workers;
    for (int t = 0; t < 4; t++) workers.emplace_back([&hits] { for (int i = 0; i < 1000; i++) hits++; });
    for (auto& w : workers) w.join();
    future<int> f = async(launch::async, [] { return 6 * 7; });   // run a task, collect the result later
    cout << hits << " " << f.get() << "\\n";        // 4000 42
}`,
        java: `import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    public static void main(String[] args) throws Exception {
        AtomicInteger hits = new AtomicInteger();
        try (ExecutorService pool = Executors.newFixedThreadPool(4)) {        // close() waits for the tasks
            for (int t = 0; t < 4; t++) pool.submit(() -> { for (int i = 0; i < 1000; i++) hits.incrementAndGet(); });
        }
        CompletableFuture<Integer> f = CompletableFuture.supplyAsync(() -> 6 * 7);
        System.out.println(hits.get() + " " + f.get());   // 4000 42
    }
}`,
        python: `import asyncio
from concurrent.futures import ThreadPoolExecutor

async def fetch(name, delay):
    await asyncio.sleep(delay)           # waits without blocking other tasks
    return f"{name} done"

async def main():
    results = await asyncio.gather(fetch("a", 0.2), fetch("b", 0.1))   # run concurrently
    print(results)

asyncio.run(main())

with ThreadPoolExecutor(max_workers=4) as pool:   # threads suit I/O-bound work; the GIL limits CPU-bound threads
    print(list(pool.map(lambda x: x * x, range(5))))`,
        js: `const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function fetchUser(id) {
  await sleep(50);
  if (id < 0) throw new Error("bad id");
  return { id, name: \`user\${id}\` };
}
const all = await Promise.all([fetchUser(1), fetchUser(2)]);              // run together, fail fast
const settled = await Promise.allSettled([fetchUser(3), fetchUser(-1)]); // keep every outcome
console.log(all.map((u) => u.name), settled.map((s) => s.status));`,
        ts: `async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), ms); });
  try { return await Promise.race([p, timeout]); } finally { clearTimeout(timer); }
}
async function main() {
  const fast = new Promise<string>((resolve) => setTimeout(() => resolve("fast"), 10));
  const slow = new Promise<string>((resolve) => setTimeout(() => resolve("slow"), 200));
  console.log(await withTimeout(fast, 100));
  try { await withTimeout(slow, 50); } catch (e) { console.log((e as Error).message); }   // timeout
}
main();`,
      },
      lab: "eventloop",
      cards: [
        { id: "concurrency-parallelism", q: "Concurrency vs parallelism?", a: "Concurrency is dealing with many tasks at once by interleaving them (one cook switching between dishes); parallelism is doing several at the same instant on different cores (several cooks). Async I/O gives concurrency on one thread; threads or processes on multiple cores give parallelism." },
        { id: "gil", q: "What is Python's GIL, and how do you get real parallelism?", a: "The Global Interpreter Lock lets only one thread execute Python bytecode at a time in CPython, so threads do not speed up CPU-bound code (they still help with I/O waits). For CPU-bound work use multiprocessing (separate processes) or libraries that release the GIL (NumPy). Newer CPython builds offer an experimental free-threaded mode without the GIL." },
        { id: "promise-all", q: "Promise.all vs allSettled vs race vs any?", a: "`all`: resolves with every result, rejects on the first failure. `allSettled`: waits for every promise and reports each outcome. `race`: settles with whichever finishes first, success or failure. `any`: resolves with the first success and rejects only if all fail." },
      ],
    },
    {
      id: "memory",
      title: "Memory, references and mutability",
      summary: "Most bugs that make no sense come from two names pointing at the same object. C++ gives you values, references and pointers explicitly; Java, Python and JavaScript hand you references to objects and garbage-collect them.",
      diagram: `flowchart LR
  subgraph S["stack"]
    direction TB
    a["a"]
    b["b"]
    c["c"]
  end
  subgraph H["heap"]
    direction TB
    L1["list [1, 2, 3]"]
    L2["list [1, 2, 3, 4] (copy)"]
  end
  a --> L1
  b --> L1
  c --> L2`,
      caption: "b = a copies the reference, not the list. A copy is a new object on the heap.",
      code: {
        cpp: `#include <iostream>
#include <memory>
#include <vector>
using namespace std;

void byValue(vector<int> v) { v.push_back(99); }          // works on a copy
void byRef(vector<int>& v) { v.push_back(99); }           // works on the caller's vector

int main() {
    vector<int> a = {1};
    byValue(a);
    byRef(a);
    int x = 10;
    int* p = &x;                                          // pointer: holds an address
    *p = 20;                                              // write through it
    auto owner = make_unique<int>(5);                     // freed automatically at the end of the scope
    shared_ptr<int> s1 = make_shared<int>(7), s2 = s1;    // reference counted
    cout << a.size() << " " << x << " " << *owner << " " << s1.use_count() << " " << *s2 << "\\n";   // 2 20 5 2 7
}`,
        java: `import java.util.ArrayList;
import java.util.List;

public class Main {
    static void reassign(List<Integer> list) { list = new ArrayList<>(); list.add(-1); }   // only the local copy changes
    static void mutate(List<Integer> list) { list.add(99); }                               // same object: visible outside

    public static void main(String[] args) {
        List<Integer> a = new ArrayList<>(List.of(1));
        reassign(a);
        mutate(a);
        String s1 = "hi", s2 = "hi", s3 = new String("hi");
        System.out.println(a + " " + (s1 == s2) + " " + (s1 == s3) + " " + s1.equals(s3));   // [1, 99] true false true
    }
}`,
        python: `a = [1, 2]
b = a                 # both names point to the same list
b.append(3)
c = a.copy()          # shallow copy: a new outer list
c.append(4)
grid = [[0] * 2] * 2  # trap: the SAME inner list repeated twice
grid[0][0] = 1
safe = [[0] * 2 for _ in range(2)]
safe[0][0] = 1

def add_item(x, items=None):   # never use a mutable default like items=[]
    items = [] if items is None else items
    items.append(x)
    return items

print(a, c, grid, safe, add_item(1), add_item(2), a is b)`,
        js: `const a = [1, 2];
const b = a;                                   // same array
b.push(3);
const c = [...a];                              // shallow copy
const deep = structuredClone({ tags: ["x"] }); // deep copy
const user = Object.freeze({ name: "Asha" });  // shallow freeze
const mark = (obj) => { obj.seen = true; };    // objects are passed by sharing
const o = {};
mark(o);
console.log(a, c === a, deep.tags, Object.isFrozen(user), o.seen, 0.1 + 0.2 === 0.3);   // floats are inexact`,
        ts: `interface User { readonly id: number; name: string }
const u: User = { id: 1, name: "Asha" };
u.name = "Asha R";                                       // allowed
// u.id = 2;                                             // compile error: id is readonly
const settings = { theme: "dark", size: 14 } as const;   // literal types, every field readonly
type Theme = typeof settings.theme;                      // "dark"
const t: Theme = "dark";
const copy: User = { ...u, name: "copy" };               // spread: a shallow copy
console.log(u, t, copy);`,
      },
      cards: [
        { id: "shallow-deep-js", q: "Shallow vs deep copy in JavaScript, and which tool does which?", a: "Spread (`{...obj}`, `[...arr]`), `Object.assign` and `Array.slice` copy only the top level; nested objects are still shared. `structuredClone` makes a deep copy (it cannot copy functions or class instances' methods). `JSON.parse(JSON.stringify(x))` also deep-copies but drops undefined, Dates and Maps." },
        { id: "gc", q: "How does garbage collection decide what to free?", a: "Objects that cannot be reached from the roots (stack variables, globals) are garbage. Modern collectors are generational: most objects die young, so the young generation is collected often and cheaply, and survivors are promoted. Python also uses reference counting, which frees most objects immediately, plus a cycle collector." },
        { id: "smart-ptrs", q: "C++: when do you use unique_ptr, shared_ptr and a raw pointer?", a: "`unique_ptr` for single ownership (the default; zero cost). `shared_ptr` when ownership is genuinely shared and lifetime is unclear (it costs a reference count). Raw pointers or references only to observe an object someone else owns, never to own memory." },
      ],
    },
  ],
};
