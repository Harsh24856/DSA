import type { Subject } from "./types";

export const OOPS: Subject = {
  id: "oops",
  name: "OOP in Java and C++",
  short: "OOPs",
  blurb: "Classes and objects, the four pillars, constructors and copying, inheritance and the diamond problem, polymorphism and the vtable, abstraction, relationships, SOLID and common patterns. Every example is a complete program in both Java and C++; switch languages at the top.",
  chapters: [
    {
      id: "basics",
      title: "Classes, objects and the four pillars",
      summary: "A **class** is a blueprint: fields (state) and methods (behaviour). An **object** is one instance of it with its own state. OOP rests on four ideas: **encapsulation** (hide state behind methods), **abstraction** (expose what, hide how), **inheritance** (reuse and extend a type) and **polymorphism** (one interface, many behaviours).",
      diagram: `classDiagram
  class Account {
    -double balance
    +deposit(amount)
    +withdraw(amount)
    +getBalance() double
  }
  class SavingsAccount {
    -double rate
    +addInterest()
  }
  Account <|-- SavingsAccount
  note for Account "encapsulation: balance is private, changed only through methods"`,
      caption: "One class, one subclass: the four pillars in a single picture.",
      code: {
        file: "Basics: a class and two objects",
        java: `public class Basics {
    static class Dog {
        String name;                       // state
        Dog(String name) { this.name = name; }
        String speak() { return name + " says woof"; }   // behaviour
    }

    public static void main(String[] args) {
        Dog a = new Dog("Rex"), b = new Dog("Bruno");    // two objects, one class
        System.out.println(a.speak());
        System.out.println(b.speak());
    }
}`,
        cpp: `#include <iostream>
#include <string>

class Dog {
public:
    std::string name;                                  // state
    explicit Dog(std::string n) : name(std::move(n)) {}
    std::string speak() const { return name + " says woof"; }   // behaviour
};

int main() {
    Dog a("Rex"), b("Bruno");                          // two objects on the stack
    std::cout << a.speak() << "\\n" << b.speak() << "\\n";
}`,
      },
      cards: [
        { id: "pillars", q: "Explain the four pillars with one example each.", a: "- **Encapsulation**: `balance` is private; only `deposit` and `withdraw` change it, so it can never go negative by accident.\n- **Abstraction**: a `List` interface lets you add and get items without knowing whether it is an array or a linked list underneath.\n- **Inheritance**: `SavingsAccount extends Account` reuses deposit and withdraw and adds interest.\n- **Polymorphism**: `shape.area()` runs the circle or square formula depending on the actual object.",
          trap: "Mixing up encapsulation and abstraction. Encapsulation is about **hiding data** and protecting invariants; abstraction is about **hiding complexity** behind a simple interface." },
        { id: "class-object", q: "Does a class take memory? Does an object?", a: "A class is a type: its code and (in Java) its metadata are loaded once, but it holds no instance data. Each object takes memory for its own fields. In Java objects always live on the heap and variables hold references; in C++ objects can live on the stack, on the heap (`new`) or inside other objects." },
        { id: "oop-vs-proc", q: "Why OOP instead of procedural code?", a: "OOP groups data with the functions that keep it valid, which makes large programs easier to change: you can swap an implementation behind an interface without touching callers, and extend behaviour through subclasses. Procedural code is often simpler for small scripts and data pipelines; OOP pays off as the system and team grow." },
      ],
    },
    {
      id: "encapsulation",
      title: "Encapsulation and access modifiers",
      summary: "Encapsulation keeps an object's state private and exposes methods that enforce its rules (invariants). Access modifiers decide who can see a member.",
      table: { head: ["Modifier", "Java: visible to", "C++: visible to"], rows: [
        ["private", "the class only", "the class (and its friends)"],
        ["(default / package-private)", "classes in the same package", "no such level"],
        ["protected", "subclasses and the same package", "the class and its subclasses"],
        ["public", "everyone", "everyone"],
      ] },
      code: {
        file: "Account: state changes only through methods that check the rules",
        java: `public class Encapsulation {
    static class Account {
        private double balance;                       // hidden state

        void deposit(double amount) {
            if (amount <= 0) throw new IllegalArgumentException("amount must be positive");
            balance += amount;
        }
        boolean withdraw(double amount) {
            if (amount > balance) return false;       // invariant: balance never negative
            balance -= amount;
            return true;
        }
        double getBalance() { return balance; }
    }

    public static void main(String[] args) {
        Account acc = new Account();
        acc.deposit(100);
        System.out.println(acc.withdraw(250) + " " + acc.getBalance());   // false 100.0
    }
}`,
        cpp: `#include <iostream>
#include <stdexcept>

class Account {
    double balance = 0;                               // private by default in a class
public:
    void deposit(double amount) {
        if (amount <= 0) throw std::invalid_argument("amount must be positive");
        balance += amount;
    }
    bool withdraw(double amount) {
        if (amount > balance) return false;           // invariant: balance never negative
        balance -= amount;
        return true;
    }
    double getBalance() const { return balance; }
};

int main() {
    Account acc;
    acc.deposit(100);
    std::cout << std::boolalpha << acc.withdraw(250) << " " << acc.getBalance() << "\\n";   // false 100
}`,
      },
      cards: [
        { id: "getters", q: "Is a class with private fields and public getters and setters for all of them encapsulated?", a: "Only in name. If every field has a plain setter, any caller can still put the object into an invalid state. Real encapsulation exposes operations that keep the rules (`withdraw` refuses overdrafts), and leaves out setters that are not needed. Immutable objects (no setters at all) are the strongest form." },
        { id: "struct-class", q: "C++: struct vs class?", a: "They are the same except for defaults: members and base classes are public by default in a `struct` and private by default in a `class`. By convention, `struct` is used for plain data and `class` for types with invariants." },
        { id: "friend", q: "What is a friend in C++, and does Java have it?", a: "A `friend` function or class may access another class's private members, for example an `operator<<` that prints private fields. It is a deliberate, local break of encapsulation. Java has no friend; the closest is package-private access between classes in the same package." },
      ],
    },
    {
      id: "ctors",
      title: "Constructors, destructors and copying",
      summary: "A constructor puts a new object into a valid state; a destructor (C++) releases what it holds. Copying an object that owns resources raises the classic **shallow vs deep copy** question.",
      diagram: `sequenceDiagram
  participant N as new Puppy()
  participant A as Animal()
  participant D as Dog()
  participant P as Puppy()
  N->>A: base constructor runs first
  A->>D: then Dog's
  D->>P: then Puppy's body
  Note over N,P: destructors (C++) run in reverse, Puppy then Dog then Animal`,
      caption: "Construction runs base first; destruction runs derived first.",
      points: [
        "Java: constructors, `this(...)` to chain, `super(...)` to call the parent. No destructors; the garbage collector frees memory, and `try-with-resources` closes files and connections.",
        "C++: constructors, destructor `~T()`, copy constructor, copy assignment, and (since C++11) move constructor and move assignment. The **rule of three / five**: if you write one of them, you probably need all of them.",
        "**RAII** (C++): tie a resource to an object's lifetime, so the destructor releases it even when an exception is thrown.",
      ],
      code: {
        file: "Shallow vs deep copy",
        java: `import java.util.ArrayList;
import java.util.List;

public class Copying {
    static class Team {
        List<String> members = new ArrayList<>();
        Team() {}
        Team(Team other) { this.members = new ArrayList<>(other.members); }   // deep copy constructor
    }

    public static void main(String[] args) {
        Team a = new Team();
        a.members.add("Asha");

        Team shallow = a;                 // copies the reference: same object
        Team deep = new Team(a);          // new object with its own list

        a.members.add("Ben");
        System.out.println(shallow.members + " " + deep.members);   // [Asha, Ben] [Asha]
    }
}`,
        cpp: `#include <cstring>
#include <iostream>

class Name {
    char* data;
public:
    explicit Name(const char* s) : data(new char[std::strlen(s) + 1]) { std::strcpy(data, s); }
    Name(const Name& o) : data(new char[std::strlen(o.data) + 1]) { std::strcpy(data, o.data); }   // deep copy
    Name& operator=(const Name& o) {
        if (this != &o) { Name tmp(o); std::swap(data, tmp.data); }   // copy-and-swap
        return *this;
    }
    ~Name() { delete[] data; }       // without a deep copy, two objects would free the same buffer
    void set(char c) { data[0] = c; }
    const char* get() const { return data; }
};

int main() {
    Name a("asha");
    Name b = a;                      // copy constructor: b gets its own buffer
    a.set('A');
    std::cout << a.get() << " " << b.get() << "\\n";   // Asha asha
}`,
      },
      cards: [
        { id: "shallow-deep", q: "Shallow copy vs deep copy?", a: "A shallow copy duplicates the fields as they are, so pointer or reference fields still point to the same underlying data: changing one copy's list changes the other's. A deep copy also duplicates what those fields point to. In C++ the compiler-generated copy constructor is shallow, which causes double frees for classes that own raw memory." },
        { id: "ctor-virtual", q: "Can a constructor be virtual? Should a destructor be?", a: "A constructor cannot be virtual: when it runs, the object's dynamic type is still being built. A base class destructor **should** be virtual whenever objects are deleted through a base pointer; otherwise `delete basePtr` runs only the base destructor and the derived part leaks (undefined behaviour)." },
        { id: "private-ctor", q: "What is a private constructor for?", a: "To control creation: a singleton exposes one shared instance, a static factory method chooses which subclass to return or caches instances, and utility classes (like `Math` in Java) prevent instantiation entirely." },
        { id: "init-order", q: "In what order do constructors and destructors run in an inheritance chain?", a: "Construction goes base to derived: the base part must exist before the derived part builds on it. Destruction goes in reverse, derived to base. Inside a class, members are initialised in the order they are declared, not the order in the initialiser list." },
      ],
    },
    {
      id: "inheritance",
      title: "Inheritance and the diamond problem",
      summary: "Inheritance models an **is-a** relationship and lets a subclass reuse and extend its parent. Java allows one parent class (plus many interfaces); C++ allows multiple inheritance, which brings the diamond problem.",
      diagram: `classDiagram
  class Device { +power() }
  class Scanner { +scan() }
  class Printer { +print() }
  class Copier
  Device <|-- Scanner
  Device <|-- Printer
  Scanner <|-- Copier
  Printer <|-- Copier`,
      caption: "The diamond: does a Copier contain one Device or two?",
      code: {
        file: "Diamond: Java uses interfaces, C++ uses virtual inheritance",
        java: `public class Diamond {
    interface Scanner { default String name() { return "scanner"; } }
    interface Printer { default String name() { return "printer"; } }

    // Both interfaces supply name(), so Java forces Copier to resolve the clash itself.
    static class Copier implements Scanner, Printer {
        public String name() { return Scanner.super.name() + "+" + Printer.super.name(); }
    }

    public static void main(String[] args) {
        System.out.println(new Copier().name());       // scanner+printer
    }
}`,
        cpp: `#include <iostream>

struct Device { int watts = 30; };
struct Scanner : virtual Device {};          // virtual: share one Device
struct Printer : virtual Device {};
struct Copier : Scanner, Printer {};

int main() {
    Copier c;
    c.watts = 45;                            // unambiguous: exactly one Device inside
    std::cout << c.Scanner::watts << " " << c.Printer::watts << "\\n";   // 45 45
}`,
      },
      cards: [
        { id: "types", q: "What kinds of inheritance are there?", a: "Single (A → B), multilevel (A → B → C), hierarchical (one parent, many children), multiple (one child, many parents) and hybrid (a mix, which can form a diamond). Java supports all of them for interfaces but only single inheritance for classes; C++ supports all of them for classes." },
        { id: "diamond", q: "What is the diamond problem and how do Java and C++ solve it?", a: "When a class inherits the same ancestor through two paths, it is unclear whether it holds one or two copies of the ancestor and which version of an inherited method to use. Java avoids it for state by forbidding multiple class inheritance; for default methods it forces the class to override and pick explicitly. C++ lets you declare `virtual` inheritance so only one shared base subobject exists; you still resolve method clashes by overriding or qualifying the name." },
        { id: "composition", q: "Why is \"favour composition over inheritance\" common advice?", a: "Inheritance couples a subclass tightly to its parent's internals: a change in the parent can break every child, and you cannot change the parent at run time. Composition (holding another object and delegating to it) keeps the parts independent and swappable. Use inheritance for true is-a relationships where substitutability holds." },
      ],
    },
    {
      id: "polymorphism",
      title: "Polymorphism, overriding and the vtable",
      summary: "**Compile-time** polymorphism is overloading: same name, different parameters, chosen by the compiler. **Run-time** polymorphism is overriding: a subclass replaces a parent method, and the call is resolved from the object's actual type.",
      table: { head: ["", "Overloading", "Overriding"], rows: [
        ["Where", "same class (or scope)", "subclass redefines a parent method"],
        ["Signature", "must differ in parameters", "must match"],
        ["Resolved", "at compile time", "at run time (dynamic dispatch)"],
        ["Return type alone differs", "not allowed", "covariant return types allowed"],
      ] },
      code: {
        file: "One call, three behaviours",
        java: `public class Shapes {
    static abstract class Shape { abstract double area(); }
    static class Circle extends Shape { double r = 1; double area() { return Math.PI * r * r; } }
    static class Square extends Shape { double s = 2; double area() { return s * s; } }

    static double total(Shape[] shapes) {
        double sum = 0;
        for (Shape s : shapes) sum += s.area();         // which area()? decided per object at run time
        return sum;
    }

    public static void main(String[] args) {
        System.out.printf("%.2f%n", total(new Shape[] { new Circle(), new Square() }));   // 7.14
    }
}`,
        cpp: `#include <cstdio>
#include <memory>
#include <vector>

struct Shape {
    virtual double area() const = 0;
    virtual ~Shape() = default;             // virtual destructor: safe delete through Shape*
};
struct Circle : Shape { double r = 1; double area() const override { return 3.14159265358979 * r * r; } };
struct Square : Shape { double s = 2; double area() const override { return s * s; } };

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>());
    shapes.push_back(std::make_unique<Square>());
    double sum = 0;
    for (const auto& s : shapes) sum += s->area();     // dispatched through each object's vtable
    std::printf("%.2f\\n", sum);                         // 7.14
}`,
      },
      lab: "vtable",
      cards: [
        { id: "vtable", q: "How does a virtual call work under the hood in C++?", a: "Each class with virtual functions has a **vtable**: an array of pointers to its implementations. Each object of such a class carries a hidden pointer (**vptr**) to its class's vtable, set by the constructor. A call `p->area()` loads the vptr, indexes the slot for area, and jumps there. The cost is one pointer per object, one table per class, and an indirect call that the compiler usually cannot inline." },
        { id: "java-virtual", q: "Which Java methods are not dynamically dispatched?", a: "Every instance method is virtual by default, except `static` methods (they belong to the class and are hidden, not overridden), `private` methods (not inherited) and `final` methods (cannot be overridden, so the JVM may bind them directly). Fields are never polymorphic: they are resolved by the reference's static type." },
        { id: "overload-resolution", q: "What does `void f(Object o)` vs `void f(String s)` with `f(null)` call in Java?", a: "The `String` overload: overload resolution picks the most specific applicable method at compile time, and String is more specific than Object. If there were also `f(Integer)`, the call would be ambiguous and fail to compile." },
        { id: "slicing", q: "What is object slicing in C++?", a: "Copying a derived object into a base-class **value** keeps only the base part: `Shape s = circle;` loses the circle's data and its overrides. Virtual dispatch then runs Shape's versions. Use references or pointers (`Shape&`, `unique_ptr<Shape>`) to keep polymorphism." },
      ],
    },
    {
      id: "abstraction",
      title: "Abstract classes and interfaces",
      summary: "Both describe what a type can do without fixing how. An **abstract class** can hold state and partial implementation; an **interface** is a pure contract a class promises to fulfil.",
      table: { head: ["", "Abstract class", "Interface (Java)"], rows: [
        ["State (fields)", "yes", "only constants"],
        ["Constructors", "yes", "no"],
        ["Method bodies", "yes", "default and static methods (Java 8+), private (Java 9+)"],
        ["How many can a class use", "one (extends)", "many (implements)"],
        ["Use when", "related classes share code and state", "unrelated classes share a capability"],
      ] },
      code: {
        file: "A contract and a partial implementation",
        java: `public class Abstraction {
    interface Payable { double amountDue(); }                      // contract

    static abstract class Employee implements Payable {             // partial implementation
        protected final String name;
        Employee(String name) { this.name = name; }
        public String toString() { return name + ": " + amountDue(); }
    }
    static class Salaried extends Employee {
        Salaried(String n) { super(n); }
        public double amountDue() { return 5000; }
    }
    static class Hourly extends Employee {
        Hourly(String n) { super(n); }
        public double amountDue() { return 40 * 25; }
    }

    public static void main(String[] args) {
        Payable[] bills = { new Salaried("Asha"), new Hourly("Ben") };
        for (Payable p : bills) System.out.println(p);
    }
}`,
        cpp: `#include <iostream>
#include <memory>
#include <string>
#include <vector>

struct Payable {                                     // C++ "interface": only pure virtual functions
    virtual double amountDue() const = 0;
    virtual ~Payable() = default;
};

class Employee : public Payable {                    // abstract: amountDue still pure
protected:
    std::string name;
public:
    explicit Employee(std::string n) : name(std::move(n)) {}
    void print() const { std::cout << name << ": " << amountDue() << "\\n"; }
};
struct Salaried : Employee { using Employee::Employee; double amountDue() const override { return 5000; } };
struct Hourly : Employee { using Employee::Employee; double amountDue() const override { return 40 * 25; } };

int main() {
    std::vector<std::unique_ptr<Employee>> staff;
    staff.push_back(std::make_unique<Salaried>("Asha"));
    staff.push_back(std::make_unique<Hourly>("Ben"));
    for (const auto& e : staff) e->print();
}`,
      },
      cards: [
        { id: "abs-vs-iface", q: "When do you choose an abstract class over an interface?", a: "Choose an abstract class when the subclasses are closely related and share state or code (all Employees have a name and the same toString). Choose an interface for a capability that unrelated classes can have (Payable, Comparable, Runnable), or when a class needs several such capabilities, since Java allows only one superclass." },
        { id: "cpp-interface", q: "C++ has no interface keyword. How do you write one?", a: "A class with only pure virtual functions (`= 0`) and a virtual destructor. It cannot be instantiated, and classes inherit from as many of them as they need. A class with at least one pure virtual function is abstract." },
        { id: "abstract-ctor", q: "Can an abstract class have a constructor if you cannot instantiate it?", a: "Yes. It runs when a concrete subclass is constructed, initialising the abstract class's own fields (the subclass calls it via `super(...)` or the C++ initialiser list)." },
      ],
    },
    {
      id: "static",
      title: "Static members, final and const, binding",
      summary: "**Static** members belong to the class, not to any object: one shared copy. **Final** (Java) and **const** (C++) prevent change. **Static binding** decides the call at compile time; **dynamic binding** at run time.",
      code: {
        file: "A static counter shared by every object",
        java: `public class Statics {
    static class User {
        static int created = 0;          // one copy for the whole class
        final String name;               // set once, never reassigned
        User(String name) { this.name = name; created++; }
    }

    public static void main(String[] args) {
        new User("Asha"); new User("Ben");
        System.out.println(User.created);   // 2
    }
}`,
        cpp: `#include <iostream>
#include <string>

class User {
public:
    static inline int created = 0;       // one copy for the whole class (C++17 inline)
    const std::string name;              // set in the constructor, never changed
    explicit User(std::string n) : name(std::move(n)) { created++; }
};

int main() {
    User a("Asha"), b("Ben");
    std::cout << User::created << "\\n";   // 2
}`,
      },
      cards: [
        { id: "static-this", q: "Why can a static method not use `this` or instance fields?", a: "A static method runs without any object, so there is no `this` and no instance to read fields from. It can use static fields and its parameters. To touch instance state, pass an object in." },
        { id: "final-meanings", q: "What does final mean on a variable, a method and a class in Java?", a: "On a variable: it can be assigned once (for references, the reference is fixed, but the object can still change). On a method: subclasses cannot override it. On a class: it cannot be extended (String is final). C++ uses `const` for values, and `final` for virtual functions and classes." },
        { id: "string-immutable", q: "Why is Java's String immutable?", a: "So strings can be shared safely: the string pool reuses literals, strings work as HashMap keys whose hash never changes, they are thread-safe without locks, and security checks (file paths, class names) cannot be bypassed by changing the string afterwards. Use StringBuilder for repeated modification." },
      ],
    },
    {
      id: "relationships",
      title: "Association, aggregation and composition",
      summary: "Objects relate to each other in three strengths. **Association**: they use each other. **Aggregation**: has-a, but the part can live on its own. **Composition**: has-a, and the part's life is owned by the whole.",
      diagram: `classDiagram
  Teacher --> Student : teaches (association)
  Department o-- Teacher : has (aggregation)
  House *-- Room : made of (composition)`,
      caption: "Hollow diamond: aggregation. Filled diamond: composition.",
      table: { head: ["", "Association", "Aggregation", "Composition"], rows: [
        ["Relation", "uses", "has-a (weak)", "has-a (strong)"],
        ["Lifetime", "independent", "independent", "part dies with the whole"],
        ["Example", "teacher and student", "department and teachers", "house and rooms"],
        ["In code", "a reference passed to a method", "a reference to an object created elsewhere", "a member created and owned by the object"],
      ] },
      cards: [
        { id: "agg-comp", q: "Aggregation vs composition, with a code-level difference?", a: "If a Department is closed, its teachers still exist: aggregation, so the department holds references to teachers created elsewhere. If a House is demolished, its rooms go with it: composition, so the house creates the rooms itself and nobody else holds them. In C++ composition is often a member by value or a `unique_ptr`; aggregation a raw pointer or reference to an object owned elsewhere." },
        { id: "is-has", q: "is-a vs has-a?", a: "is-a is inheritance: a Car is a Vehicle. has-a is composition or aggregation: a Car has an Engine. Ask whether the child can be used everywhere the parent is expected (Liskov); if not, it is has-a." },
      ],
    },
    {
      id: "solid",
      title: "SOLID and common design patterns",
      summary: "SOLID is five rules for classes that stay easy to change. Design patterns are named, reusable solutions to recurring design problems.",
      table: { head: ["Principle", "Means", "Violation looks like"], rows: [
        ["Single responsibility", "one reason to change", "a User class that also writes to the database and sends emails"],
        ["Open/closed", "extend by adding code, not editing it", "a switch on type that grows with every new shape"],
        ["Liskov substitution", "subtypes work wherever the parent works", "Square extends Rectangle and breaks setWidth"],
        ["Interface segregation", "small, focused interfaces", "a Printer interface forcing fax() on every printer"],
        ["Dependency inversion", "depend on abstractions, not concrete classes", "OrderService creating a MySqlRepository with new"],
      ] },
      code: {
        file: "Singleton: one shared instance, created lazily and safely",
        java: `public class Singleton {
    static final class Config {
        private Config() {}                                // nobody else can call new
        private static class Holder { static final Config INSTANCE = new Config(); }
        static Config get() { return Holder.INSTANCE; }    // created on first use, thread-safe
    }

    public static void main(String[] args) {
        System.out.println(Config.get() == Config.get());  // true
    }
}`,
        cpp: `#include <iostream>

class Config {
    Config() = default;                                // private constructor
public:
    Config(const Config&) = delete;                    // no copies
    Config& operator=(const Config&) = delete;
    static Config& get() {
        static Config instance;                        // created on first use, thread-safe since C++11
        return instance;
    }
};

int main() {
    std::cout << std::boolalpha << (&Config::get() == &Config::get()) << "\\n";   // true
}`,
      },
      cards: [
        { id: "patterns", q: "Name four patterns and when you would use each.", a: "- **Singleton**: exactly one instance (configuration, a connection pool). Use sparingly; it is global state.\n- **Factory**: create objects without the caller naming the concrete class (`Shape.of(\"circle\")`).\n- **Observer**: notify many listeners when something changes (UI events, pub-sub).\n- **Strategy**: swap an algorithm at run time behind an interface (payment methods, sorting rules)." },
        { id: "liskov", q: "Why does Square extending Rectangle break Liskov substitution?", a: "Code written for Rectangle expects that setting the width leaves the height unchanged. A Square must keep both equal, so `setWidth(5)` also changes the height, and code like \"set width 5, height 4, expect area 20\" fails. A subtype that weakens the parent's guarantees is not substitutable; model them as separate shapes instead." },
        { id: "dip", q: "What does dependency inversion look like in practice?", a: "High-level code depends on an interface (`PaymentGateway`), and the concrete class (`StripeGateway`) is passed in through the constructor (dependency injection). Tests can then pass a fake gateway, and switching providers does not touch the business logic." },
      ],
    },
    {
      id: "exceptions",
      title: "Exceptions and memory management",
      summary: "Exceptions separate error handling from normal flow. Java has checked exceptions (must be declared or caught) and a garbage collector; C++ has only unchecked exceptions and deterministic destructors, which is what makes RAII work.",
      diagram: `flowchart TB
  T["Throwable"] --> E["Exception: recoverable"]
  T --> ER["Error: do not catch (OutOfMemoryError)"]
  E --> C["checked: IOException, SQLException"]
  E --> R["RuntimeException: unchecked"]
  R --> R1["NullPointerException"]
  R --> R2["IllegalArgumentException"]`,
      caption: "The Java exception hierarchy. C++ can throw any type; std::exception is the usual base.",
      code: {
        file: "Cleanup that runs even when an exception is thrown",
        java: `public class Cleanup {
    static class Resource implements AutoCloseable {
        Resource() { System.out.println("open"); }
        public void close() { System.out.println("close"); }    // runs even if the body throws
    }

    public static void main(String[] args) {
        try (Resource r = new Resource()) {
            throw new IllegalStateException("boom");
        } catch (IllegalStateException e) {
            System.out.println("caught " + e.getMessage());
        } finally {
            System.out.println("finally");
        }
    }
}`,
        cpp: `#include <iostream>
#include <stdexcept>

struct Resource {
    Resource()  { std::cout << "open\\n"; }
    ~Resource() { std::cout << "close\\n"; }   // RAII: runs during stack unwinding
};

int main() {
    try {
        Resource r;
        throw std::runtime_error("boom");
    } catch (const std::runtime_error& e) {
        std::cout << "caught " << e.what() << "\\n";
    }
}`,
      },
      cards: [
        { id: "checked", q: "Checked vs unchecked exceptions in Java?", a: "Checked exceptions (IOException, SQLException) extend Exception but not RuntimeException; the compiler forces callers to catch or declare them, so they suit recoverable conditions the caller should handle. Unchecked exceptions (NullPointerException, IllegalArgumentException) extend RuntimeException and usually signal programming errors. Errors (OutOfMemoryError) are not meant to be caught." },
        { id: "finally-return", q: "Does finally run if the try block returns?", a: "Yes. finally runs after the return value is computed but before the method actually returns. It is skipped only if the JVM exits (System.exit) or the thread dies. Never return from finally: it silently discards any exception thrown in try." },
        { id: "gc-raii", q: "Java garbage collection vs C++ RAII?", a: "Java frees memory automatically when objects become unreachable, at a time you do not control, so non-memory resources (files, sockets) need `try-with-resources`. C++ frees objects deterministically at the end of their scope: destructors release memory, locks and files immediately, and smart pointers (`unique_ptr`, `shared_ptr`) give automatic heap management without a garbage collector." },
        { id: "smart-ptr", q: "unique_ptr vs shared_ptr vs weak_ptr?", a: "`unique_ptr`: sole owner, cannot be copied, only moved; zero overhead. `shared_ptr`: shared ownership with a reference count; the object is deleted when the last owner goes. `weak_ptr`: observes a shared object without owning it, used to break reference cycles (parent and child pointing at each other)." },
      ],
    },
  ],
};
