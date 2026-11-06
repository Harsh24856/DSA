import type { OaCode, OaSubject } from "../types.ts";
import { concept, output } from "./make.ts";

const java = (body: string): OaCode => ({ lang: "java", src: `public class Main {\n${body}\n}` });
const cpp = (src: string): OaCode => ({ lang: "cpp", src: `#include <iostream>\nusing namespace std;\n${src}` });
const q = "What does this program print?";

export const OA_OOPS: OaSubject = {
  id: "oops", name: "OOP",
  questions: [
    output("j-override", q, java(`  static class A { void show() { System.out.print("A"); } }
  static class B extends A { void show() { System.out.print("B"); } }
  public static void main(String[] args) {
    A a = new B();
    a.show();
  }`), "B", ["A", "AB", "Compile error"], "Java chooses an overridden method by the runtime type of the object."),
    output("j-field", q, java(`  static class A { int x = 1; }
  static class B extends A { int x = 2; }
  public static void main(String[] args) {
    A a = new B();
    System.out.print(a.x);
  }`), "1", ["2", "0", "Compile error"], "Fields are not polymorphic. The static type A decides which `x` is used."),
    output("j-static", q, java(`  static class A { static String s() { return "A"; } }
  static class B extends A { static String s() { return "B"; } }
  public static void main(String[] args) {
    A a = new B();
    System.out.print(a.s());
  }`), "A", ["B", "AB", "Compile error"], "Static methods are hidden, not overridden, so the static type decides."),
    output("j-ctor-order", q, java(`  static class A { A() { System.out.print("A"); } }
  static class B extends A { B() { System.out.print("B"); } }
  static class C extends B { C() { System.out.print("C"); } }
  public static void main(String[] args) { new C(); }`), "ABC", ["CBA", "C", "ACB"], "Each constructor first calls its parent's, so the base class finishes first."),
    output("j-ctor-virtual", q, java(`  static class A { A() { show(); } void show() { System.out.print("A"); } }
  static class B extends A { int x = 5; void show() { System.out.print(x); } }
  public static void main(String[] args) { new B(); }`), "0", ["5", "A", "Compile error"], "The call dispatches to B.show, but B's field is not initialized yet, so x still has its default."),
    output("j-string", q, java(`  public static void main(String[] args) {
    String a = "hi", b = new String("hi");
    System.out.print((a == b) + " " + a.equals(b));
  }`), "false true", ["true true", "false false", "true false"], "`==` compares references, and `new String` makes a new object. `equals` compares contents."),
    output("j-overload", q, java(`  static void f(long x) { System.out.print("long"); }
  static void f(Integer x) { System.out.print("Integer"); }
  public static void main(String[] args) { f(5); }`), "long", ["Integer", "Compile error", "longInteger"], "Overload resolution tries widening before boxing."),
    output("j-static-count", q, java(`  static class C { static int n = 0; C() { n++; } }
  public static void main(String[] args) {
    new C(); new C(); new C();
    System.out.print(C.n);
  }`), "3", ["1", "0", "Compile error"], "One static field is shared by all objects."),
    output("j-finally", q, java(`  static int f() {
    try { return 1; }
    finally { System.out.print("F"); }
  }
  public static void main(String[] args) { System.out.print(f()); }`), "F1", ["1F", "1", "F"], "`finally` runs before the method returns, and the print of the result comes after."),
    output("j-array", q, java(`  static void set(int[] a) { a[0] = 9; a = new int[] {1}; }
  public static void main(String[] args) {
    int[] x = {5};
    set(x);
    System.out.print(x[0]);
  }`), "9", ["5", "1", "Compile error"], "Java passes the reference by value. The change to the element is seen, but reassigning the parameter is not."),
    output("c-nonvirtual", q, cpp(`struct Base { void show() { cout << "Base"; } };
struct Derived : Base { void show() { cout << "Derived"; } };
int main() {
  Derived d;
  Base* p = &d;
  p->show();
}`), "Base", ["Derived", "BaseDerived", "Compile error"], "Without `virtual`, C++ uses the static type of the pointer."),
    output("c-virtual", q, cpp(`struct Base { virtual void show() { cout << "Base"; } virtual ~Base() {} };
struct Derived : Base { void show() override { cout << "Derived"; } };
int main() {
  Derived d;
  Base* p = &d;
  p->show();
}`), "Derived", ["Base", "BaseDerived", "Compile error"], "A virtual call goes through the vtable of the actual object."),
    output("c-order", q, cpp(`struct B { B() { cout << "B"; } ~B() { cout << "b"; } };
struct D : B { D() { cout << "D"; } ~D() { cout << "d"; } };
int main() { D x; }`), "BDdb", ["DBbd", "BDbd", "DBdb"], "Construction goes base first. Destruction runs in reverse."),
    output("c-slice", q, cpp(`struct Base { virtual void show() { cout << "Base"; } virtual ~Base() {} };
struct Derived : Base { void show() override { cout << "Derived"; } };
int main() {
  Derived d;
  Base b = d;
  b.show();
}`), "Base", ["Derived", "BaseDerived", "Compile error"], "Copying into a Base object slices off the Derived part, so `b` really is a Base."),
    output("c-ctor-virtual", q, cpp(`struct Base {
  Base() { show(); }
  virtual void show() { cout << "Base"; }
  virtual ~Base() {}
};
struct Derived : Base { void show() override { cout << "Derived"; } };
int main() { Derived d; }`), "Base", ["Derived", "BaseDerived", "Compile error"], "During Base's constructor the object is still a Base. Java behaves differently here."),
    output("c-copy", q, cpp(`struct A {
  A() {}
  A(const A&) { cout << "C"; }
  A& operator=(const A&) { cout << "="; return *this; }
};
int main() {
  A a;
  A b = a;
  A c;
  c = b;
}`), "C=", ["==", "CC", "=C"], "`A b = a` makes a new object, so it uses the copy constructor. `c = b` assigns to an existing object."),
    output("c-virtual-base", q, cpp(`struct B { B() { cout << "B"; } };
struct L : virtual B { L() { cout << "L"; } };
struct R : virtual B { R() { cout << "R"; } };
struct D : L, R { D() { cout << "D"; } };
int main() { D x; }`), "BLRD", ["BLBRD", "LRBD", "DRLB"], "With virtual inheritance there is one B, built first by the most derived class."),
    output("c-empty", q, cpp(`struct E {};
int main() { cout << sizeof(E); }`), "1", ["0", "4", "8"], "Distinct objects need distinct addresses, so an empty class has size 1."),
    concept("pillars", "Which is NOT one of the four pillars of OOP?", "Compilation", ["Encapsulation", "Inheritance", "Polymorphism"], "The fourth pillar is abstraction."),
    concept("poly", "Which feature gives runtime polymorphism?", "Method overriding", ["Method overloading", "Operator overloading", "Templates"], "The others are resolved at compile time."),
    concept("overload", "Two methods have the same name and parameters but different return types. What happens?", "Compile error", ["The return type picks the method", "The first one is always used", "The last one is always used"], "A call often ignores the return value, so it cannot be used to choose an overload."),
    concept("abstract", "Which is true of an abstract class in Java?", "It can have constructors but cannot be instantiated directly", ["It cannot have any concrete methods", "It cannot have fields", "It must have at least one abstract method"], "Subclass constructors call its constructor. It can have zero abstract methods."),
    concept("interfaces", "How many classes can a Java class extend, and how many interfaces can it implement?", "One class, many interfaces", ["Many classes, one interface", "One class, one interface", "Many classes, many interfaces"], "Single class inheritance avoids the diamond problem for state."),
    concept("pure", "How do you declare a pure virtual function in C++?", "`virtual void f() = 0;`", ["`void f() = 0;`", "`pure void f();`", "`abstract void f();`"], "Only a virtual function can be pure. The class becomes abstract."),
    concept("vptr", "What is the usual C++ arrangement for virtual functions?", "One vtable per class, one vptr per object", ["One vtable per object, one vptr per class", "One vtable for the whole program", "One vptr per function"], "The standard does not require it, but this is how compilers implement it."),
    concept("vdtor", "Why make a base class destructor virtual?", "So deleting through a base pointer runs the derived destructor", ["So the class cannot be copied", "So the constructor runs faster", "So the class becomes abstract"], "Otherwise the behavior is undefined, and derived resources commonly leak."),
    concept("ctor-virtual", "Can a C++ constructor be virtual?", "No, the vptr is not set up until construction runs", ["Yes, in any class", "Yes, but only in abstract classes", "Only when the destructor is virtual"], "To copy polymorphically, use a virtual `clone` method."),
    concept("diamond", "How does C++ avoid two copies of a shared base in diamond inheritance?", "Virtual inheritance", ["Pure virtual functions", "Friend classes", "Private inheritance"], "The intermediate classes inherit with `virtual`, so one base subobject is shared."),
    concept("final", "What does `final` on a Java class do?", "It stops the class being extended", ["It makes every field constant", "It stops objects being created", "It makes every method static"], "On a method it stops overriding. On a variable it stops reassignment."),
    concept("static-this", "Why can a static method not use `this`?", "It belongs to the class, so there is no current object", ["It runs before main", "It is always private", "It cannot have parameters"], "It can only use instance members through an object reference."),
    concept("encapsulation", "Which is the clearest example of encapsulation?", "Private fields changed only through validating methods", ["A class extending another class", "Two methods with the same name", "An interface with one method"], "The object protects its own state."),
    concept("composition", "Which relationship does composition model?", "Has-a", ["Is-a", "Uses-once", "Friend-of"], "A car has an engine. Inheritance models is-a."),
    concept("lsp", "What does the L in SOLID require?", "A subclass must work wherever its parent is expected", ["A class must have one reason to change", "Code must be open for extension", "Modules must depend on abstractions"], "This is the Liskov substitution principle. The others listed are S, O and D."),
    concept("friend", "What does a C++ `friend` declaration give?", "Access to the class's private and protected members", ["Inheritance from the class", "A copy of the class", "Public access for every other class"], "Friendship is granted by the class. It is not inherited or mutual."),
    concept("shallow", "Why can the default C++ copy be wrong for a class owning a raw pointer?", "Both copies point to one buffer, so it is freed twice", ["It copies the buffer twice", "It refuses to compile", "It sets the pointer to null"], "This is why the rule of three exists: write the destructor, copy constructor and copy assignment together."),
    concept("hashcode", "In Java, if you override `equals`, what else must you override?", "`hashCode`", ["`toString`", "`clone`", "`finalize`"], "Equal objects must have equal hash codes, or a HashMap will lose them."),
    concept("immutable", "Why does `s.concat(\"x\")` alone leave a Java String `s` unchanged?", "Strings are immutable, so it returns a new String", ["concat works only on StringBuilder", "Strings are passed by value", "The call is removed by the compiler"], "Assign the result to keep it."),
  ],
};
