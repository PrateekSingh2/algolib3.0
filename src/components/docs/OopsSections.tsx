import React from "react";
import { Blocks, ShieldCheck, TreePine, Shapes, Globe, Zap, Settings, Repeat, Target, Database, Key } from "lucide-react";
import { HighlightText, ProTip, WarningBlock, ComplexityTable, CodeTabs, DocSection } from "@/components/docs/DocComponents";

export const OOPS_SECTIONS: DocSection[] = [
  {
    id: "oop-intro",
    title: "The Object-Oriented Paradigm",
    icon: <Blocks />,
    searchContent: "oop introduction object oriented classes objects blueprint paradigm procedural vs oop advantages disadvantages",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="Procedural programming (like basic C) writes sequences of instructions. Object-Oriented Programming (OOP) models software around real-world entities. It bundles data (attributes) and behavior (methods) into independent units called objects." highlight={highlight} />
        </p>
        
        

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h4 className="text-cyan-400 font-bold text-xl mb-3">Classes vs. Objects</h4>
            <p className="text-sm text-slate-400 mb-2"><strong>Class:</strong> The blueprint. It defines what properties and methods an entity will have, but it doesn't occupy memory itself until instantiated.</p>
            <p className="text-sm text-slate-400"><strong>Object:</strong> The instance. When you instantiate a class, memory is allocated, and the blueprint becomes a tangible, usable entity in heap memory.</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h4 className="text-purple-400 font-bold text-xl mb-3">The Four Pillars</h4>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-400" /> <strong>Encapsulation</strong> — Data hiding</li>
              <li className="flex items-center gap-2"><TreePine size={14} className="text-purple-400" /> <strong>Inheritance</strong> — Code reuse</li>
              <li className="flex items-center gap-2"><Shapes size={14} className="text-cyan-400" /> <strong>Polymorphism</strong> — Many forms</li>
              <li className="flex items-center gap-2"><Globe size={14} className="text-amber-400" /> <strong>Abstraction</strong> — Hide complexity</li>
            </ul>
          </div>
        </div>

        <ComplexityTable
          title="Procedural vs Object-Oriented"
          cols={["Aspect", "Procedural", "Object-Oriented"]}
          rows={[
            { a: "Focus", p: "Functions/procedures", o: "Objects & data" },
            { a: "Data Access", p: "Global/shared", o: "Encapsulated (private)" },
            { a: "Code Reuse", p: "Function libraries", o: "Inheritance & composition" },
            { a: "Scalability", p: "Hard for large systems", o: "Excellent modularity" },
            { a: "Real-World Modeling", p: "Weak", o: "Natural mapping" },
            { a: "Examples", p: "C, Pascal, Fortran", o: "Java, C++, Python, C#" },
          ]}
        />

        <CodeTabs tabs={[
          {
            language: "Java",
            title: "Class Anatomy",
            code: `public class Car {
    // Fields (state/attributes)
    private String brand;
    private int speed;
    private boolean engineOn;

    // Constructor (initializes object)
    public Car(String brand) {
        this.brand = brand;
        this.speed = 0;
        this.engineOn = false;
    }

    // Methods (behavior)
    public void startEngine() {
        engineOn = true;
        System.out.println(brand + " engine started!");
    }

    public void accelerate(int amount) {
        if (engineOn) speed += amount;
    }

    // toString (object's string representation)
    @Override
    public String toString() {
        return brand + " [Speed: " + speed + " km/h]";
    }
}

// Usage:
Car tesla = new Car("Tesla Model S");
tesla.startEngine();
tesla.accelerate(60);
System.out.println(tesla); // "Tesla Model S [Speed: 60 km/h]"`
          },
          {
            language: "C++",
            title: "Class Anatomy",
            code: `#include <iostream>
#include <string>
using namespace std;

class Car {
private:
    string brand;
    int speed;
    bool engineOn;

public:
    // Constructor with initializer list (Highly recommended in C++)
    Car(string b) : brand(b), speed(0), engineOn(false) {}
    
    // Copy constructor
    Car(const Car& other) 
        : brand(other.brand), speed(other.speed), 
          engineOn(other.engineOn) {}
    
    // Destructor
    ~Car() { 
        cout << brand << " destroyed" << endl; 
    }

    void startEngine() { 
        engineOn = true;
        cout << brand << " engine started!" << endl;
    }
    
    void accelerate(int amt) { 
        if (engineOn) speed += amt; 
    }
    
    // Operator overloading for easy printing
    friend ostream& operator<<(ostream& os, const Car& c) {
        os << c.brand << " [Speed: " << c.speed << "]";
        return os;
    }
};`
          }
        ]} />
      </div>
    )
  },
  {
    id: "constructors-destructors",
    title: "Constructors & Destructors",
    icon: <Settings />,
    searchContent: "constructors destructors default parameterized copy constructor move constructor initializer list destructor RAII resource management this keyword",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="Constructors are special methods invoked automatically when an object is created. They initialize the object's state. Destructors clean up resources when objects are destroyed. Together, they form the backbone of resource management." highlight={highlight} />
        </p>

        

        <ComplexityTable
          title="Constructor Types"
          cols={["Type", "Description", "When Called"]}
          rows={[
            { t: "Default", d: "No parameters, compiler-generated if none defined", w: "Car c;" },
            { t: "Parameterized", d: "Accepts arguments to initialize state", w: "Car c(\"Tesla\");" },
            { t: "Copy", d: "Creates deep copy from another object", w: "Car c2(c1);" },
            { t: "Move (C++11)", d: "Transfers ownership of resources", w: "Car c2(std::move(c1));" },
            { t: "Conversion", d: "Single-param constructor enables implicit casting", w: "Car c = \"BMW\";" },
          ]}
        />

        <CodeTabs tabs={[
          {
            language: "C++",
            title: "The Rule of Five (C++11)",
            code: `#include <iostream>
#include <algorithm>
using namespace std;

class DynamicArray {
    int* data;
    int size;
public:
    // 1. Constructor
    DynamicArray(int s) : size(s) {
        data = new int[size];
        cout << "Constructed: " << size << " elements\n";
    }

    // 2. Destructor
    ~DynamicArray() {
        delete[] data;
        cout << "Destroyed\n";
    }

    // 3. Copy Constructor (deep copy)
    DynamicArray(const DynamicArray& other) : size(other.size) {
        data = new int[size];
        std::copy(other.data, other.data + size, data);
    }

    // 4. Copy Assignment Operator
    DynamicArray& operator=(const DynamicArray& other) {
        if (this != &other) { // Protect against self-assignment
            delete[] data;
            size = other.size;
            data = new int[size];
            std::copy(other.data, other.data + size, data);
        }
        return *this;
    }

    // 5. Move Constructor (steals resources, leaves 'other' empty)
    DynamicArray(DynamicArray&& other) noexcept 
        : data(other.data), size(other.size) {
        other.data = nullptr; // Prevent double delete
        other.size = 0;
    }
};

// RAII: Resource Acquisition Is Initialization.
// Objects acquire resources in constructors, release them in destructors.
// This guarantees cleanup even if exceptions occur.`
          },
          {
            language: "Java",
            title: "Constructor Chaining",
            code: `public class Student {
    private String name;
    private int age;
    private String major;

    // Primary constructor
    public Student(String name, int age, String major) {
        this.name = name;
        this.age = age;
        this.major = major;
    }

    // Constructor chaining with this()
    public Student(String name, int age) {
        this(name, age, "Undeclared"); // Calls primary
    }

    public Student(String name) {
        this(name, 18); // Calls 2-param constructor
    }

    // Default constructor
    public Student() {
        this("Unknown"); // Chains to 1-param
    }

    // Static factory method (alternative to constructors)
    public static Student createFreshman(String name) {
        return new Student(name, 18, "Undeclared");
    }

    // Java has NO destructors. The Garbage Collector handles memory.
    // For manual resources (files, sockets), implement AutoCloseable 
    // and use try-with-resources.
}`
          }
        ]} />

        <ProTip>
          <strong>The "this" Keyword:</strong> Refers to the current object instance. In constructors, <code>this.name = name</code> distinguishes the field from the parameter. In C++, <code>this</code> is a pointer (<code>this-&gt;name</code>); in Java, it's a reference (<code>this.name</code>).
        </ProTip>

        <WarningBlock>
          If you define ANY constructor in C++, the compiler stops generating the default constructor. If you still need <code>MyClass obj;</code> to work, you must explicitly define <code>MyClass() = default;</code>.
        </WarningBlock>
      </div>
    )
  },
  {
    id: "encapsulation",
    title: "Pillar 1: Encapsulation",
    icon: <ShieldCheck />,
    searchContent: "encapsulation data hiding private public protected getters setters access modifiers access specifiers information hiding",
    render: (highlight) => (
      <div className="space-y-8">
        <div>
          <h3 className="text-emerald-400 text-2xl font-bold mb-4">Encapsulation & Data Hiding</h3>
          
          <p className="text-slate-400 mb-4">
            <HighlightText text="Encapsulation is the act of bundling data and methods into a single unit (the class). Data Hiding takes this further by restricting direct access to internal states to prevent accidental corruption from external code." highlight={highlight} />
          </p>

          <ComplexityTable
            title="Access Modifiers"
            cols={["Modifier", "Same Class", "Same Package", "Subclass", "World"]}
            rows={[
              { m: "private", c: "✅", p: "❌", s: "❌", w: "❌" },
              { m: "default (package)", c: "✅", p: "✅", s: "❌", w: "❌" },
              { m: "protected", c: "✅", p: "✅", s: "✅", w: "❌" },
              { m: "public", c: "✅", p: "✅", s: "✅", w: "✅" },
            ]}
          />

          <ProTip>Make class fields <code>private</code>, and provide <code>public</code> getter and setter methods. This allows you to validate data before it gets assigned, log access, or compute derived values on the fly.</ProTip>

          <CodeTabs tabs={[
            {
              language: "Java",
              title: "Encapsulation Example",
              code: `import java.util.*;
import java.time.LocalDateTime;

public class BankAccount {
    // Private data (Hidden from outside world)
    private double balance;
    private String accountNumber;
    private List<String> transactionLog;

    public BankAccount(String accNum, double initial) {
        this.accountNumber = accNum;
        this.balance = initial;
        this.transactionLog = new ArrayList<>();
        log("Account created with $" + initial);
    }

    // Getter (read-only access)
    public double getBalance() { return this.balance; }
    
    // No setter for accountNumber (immutable after creation)
    public String getAccountNumber() { return this.accountNumber; }

    // Setter with validation & logging
    public boolean deposit(double amount) {
        if (amount <= 0) {
            log("REJECTED deposit: $" + amount);
            return false;
        }
        this.balance += amount;
        log("Deposited: $" + amount);
        return true;
    }

    public boolean withdraw(double amount) {
        if (amount <= 0 || amount > balance) {
            log("REJECTED withdrawal: $" + amount);
            return false;
        }
        this.balance -= amount;
        log("Withdrew: $" + amount);
        return true;
    }

    private void log(String msg) {
        transactionLog.add(LocalDateTime.now() + ": " + msg);
    }

    // Defensive copy (prevent external modification of the list)
    public List<String> getTransactionLog() {
        return Collections.unmodifiableList(transactionLog);
    }
}`
            },
            {
              language: "C++",
              title: "Friend Functions & Classes",
              code: `class Matrix {
    int data[3][3];
    int rows, cols;

public:
    Matrix() : rows(3), cols(3) {
        // Initialize to 0
        for(int i=0; i<3; i++)
            for(int j=0; j<3; j++)
                data[i][j] = 0;
    }

    // Friend function: defined outside, but can access private members
    friend Matrix multiply(const Matrix& a, const Matrix& b);
    
    // Friend class: entire specific class gets access
    friend class MatrixSerializer;
    
    // Operator overloading with friend
    friend ostream& operator<<(ostream& os, const Matrix& m) {
        for (int i = 0; i < m.rows; i++) {
            for (int j = 0; j < m.cols; j++)
                os << m.data[i][j] << " ";
            os << endl;
        }
        return os;
    }
};

// Note: the 'friend' keyword breaks encapsulation intentionally.
// Use sparingly and only for tightly coupled utilities.`
            }
          ]} />
        </div>
      </div>
    )
  },
  {
    id: "inheritance",
    title: "Pillar 2: Inheritance",
    icon: <TreePine />,
    searchContent: "inheritance extends base super sub derived is-a relationship protected single multiple multilevel hierarchical hybrid diamond problem",
    render: (highlight) => (
      <div className="space-y-8">
        <div>
          <h3 className="text-purple-400 text-2xl font-bold mb-4">Inheritance (IS-A Relationship)</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Inheritance solves code redundancy. A 'Child' (Derived) class can inherit fields and methods from a 'Parent' (Base) class. If a Dog IS-A Animal, it should inherit the general Animal attributes without rewriting them." highlight={highlight} />
          </p>
          
          

          <ComplexityTable
            title="Types of Inheritance"
            cols={["Type", "Structure", "C++ Support", "Java Support"]}
            rows={[
              { t: "Single", s: "A → B", c: "✅", j: "✅" },
              { t: "Multilevel", s: "A → B → C", c: "✅", j: "✅" },
              { t: "Hierarchical", s: "A → B, A → C", c: "✅", j: "✅" },
              { t: "Multiple", s: "A,B → C", c: "✅", j: "❌ (uses Interfaces)" },
              { t: "Hybrid", s: "Combination", c: "✅ (virtual)", j: "❌ (uses Interfaces)" },
            ]}
          />

          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Inheritance & Virtual Base",
              code: `class Enemy {
protected:
    int health = 100;
    string name;
public:
    Enemy(string n) : name(n) {}
    virtual void takeDamage(int dmg) { 
        health -= dmg;
        cout << name << " took " << dmg << " damage!" << endl;
    }
    virtual ~Enemy() {} // Virtual destructor (IMPORTANT!)
};

class Boss : public Enemy {
    int armor;
public:
    Boss(string n, int a) : Enemy(n), armor(a) {}
    
    void takeDamage(int dmg) override {
        int actual = max(0, dmg - armor);
        Enemy::takeDamage(actual); // Call parent method
        cout << "(Armor absorbed " << (dmg-actual) << ")" << endl;
    }
};

// ============ THE DIAMOND PROBLEM ============
class A { public: int x; };
// Use 'virtual' inheritance to prevent multiple copies of base class A
class B : virtual public A {}; 
class C : virtual public A {}; 
class D : public B, public C {
    // Only ONE copy of A::x exists because of virtual inheritance!
};`
            },
            {
              language: "Java",
              title: "Inheritance & super",
              code: `class Animal {
    protected String name;
    protected int age;

    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void speak() {
        System.out.println(name + " makes a sound");
    }
}

class Dog extends Animal {
    private String breed;

    public Dog(String name, int age, String breed) {
        super(name, age); // MUST call parent constructor first
        this.breed = breed;
    }

    @Override
    public void speak() {
        System.out.println(name + " barks! Woof!");
    }

    public void fetch() {
        System.out.println(name + " fetches the ball!");
    }
}

// Usage with polymorphism
Animal myPet = new Dog("Rex", 3, "German Shepherd");
myPet.speak();    // "Rex barks! Woof!" (dynamic dispatch)
// myPet.fetch(); // COMPILE ERROR: Animal reference doesn't have fetch()
((Dog)myPet).fetch(); // Downcast to access Dog-specific methods`
            }
          ]} />

          <WarningBlock>While C++ supports <em>Multiple Inheritance</em> (a child having two direct parents), Java prohibits it to avoid the "Diamond Problem" (ambiguity if both parents have the same method). Java uses <strong>Interfaces</strong> instead, which allow a class to implement multiple contracts without state conflicts.</WarningBlock>
        </div>
      </div>
    )
  },
  {
    id: "polymorphism",
    title: "Pillar 3: Polymorphism",
    icon: <Shapes />,
    searchContent: "polymorphism overloading overriding compile time run time late binding virtual methods vtable dynamic dispatch operator overloading",
    render: (highlight) => (
      <div className="space-y-8">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Polymorphism (Many Forms)</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="The ability for a single interface or method name to represent different underlying behaviors. This is the most powerful pillar of OOP—it enables writing flexible, extensible code that works with future types." highlight={highlight} />
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
              <h4 className="font-bold text-slate-50 mb-3 text-amber-400">Compile-Time (Static)</h4>
              <p className="text-sm text-slate-400 mb-3">Resolved at compile time. Includes <strong>Method Overloading</strong> and <strong>Operator Overloading</strong>.</p>
              <pre className="text-xs bg-slate-950 p-3 rounded font-mono text-slate-400 border border-slate-800">
{`void print(int i)    { ... }
void print(String s) { ... }
void print(int i, int j) { ... }`}
              </pre>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
              <h4 className="font-bold text-slate-50 mb-3 text-purple-400">Run-Time (Dynamic)</h4>
              <p className="text-sm text-slate-400 mb-3">Resolved at runtime via <strong>Virtual Tables (vtable)</strong>. Includes <strong>Method Overriding</strong>.</p>
              <pre className="text-xs bg-slate-950 p-3 rounded font-mono text-slate-400 border border-slate-800">
{`@Override
public void makeSound() {
    System.out.println("Bark!");
}`}
              </pre>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">The Virtual Table (vtable) Mechanism</h3>
          
          <p className="text-slate-400 mb-4">
            <HighlightText text="When a class has virtual methods, the compiler creates a hidden vtable (array of function pointers). Each object stores a vptr pointing to its class's vtable. At runtime, calling a virtual method follows the vptr to find the correct function—this is called dynamic dispatch." highlight={highlight} />
          </p>

          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Virtual Functions & vtable",
              code: `class Shape {
public:
    virtual double area() = 0;     // Pure virtual (abstract)
    virtual double perimeter() = 0;
    virtual void draw() {
        cout << "Drawing shape" << endl;
    }
    virtual ~Shape() {}            // Virtual destructor!
};

class Circle : public Shape {
    double radius;
public:
    Circle(double r) : radius(r) {}
    double area() override { return 3.14159 * radius * radius; }
    double perimeter() override { return 2 * 3.14159 * radius; }
    void draw() override { cout << "Drawing circle" << endl; }
};

class Rectangle : public Shape {
    double w, h;
public:
    Rectangle(double w, double h) : w(w), h(h) {}
    double area() override { return w * h; }
    double perimeter() override { return 2 * (w + h); }
    // Inherits draw() from Shape!
};

// Polymorphism in action
void printInfo(Shape* s) {
    cout << "Area: " << s->area() << endl;       // Dynamic dispatch
    cout << "Perimeter: " << s->perimeter() << endl;
    s->draw();
}

// Works with ANY shape, even ones not yet written!
Circle c(5);
Rectangle r(4, 6);
printInfo(&c); // Circle's specific methods called
printInfo(&r); // Rectangle's specific methods called`
            },
            {
              language: "Java",
              title: "Polymorphism & instanceof",
              code: `// All method calls in Java are virtual by default
abstract class Payment {
    protected double amount;
    
    public Payment(double amount) {
        this.amount = amount;
    }
    
    abstract void process();
    
    // Template method pattern (final prevents overriding)
    public final void execute() {
        validate();
        process(); // Dynamic dispatch here!
        log();
    }
    
    private void validate() {
        if (amount <= 0) throw new IllegalArgumentException();
    }
    private void log() {
        System.out.println("Processed: $" + amount);
    }
}

class CreditCardPayment extends Payment {
    public CreditCardPayment(double amt) { super(amt); }
    void process() { System.out.println("Charging card $" + amount); }
}

class CryptoPayment extends Payment {
    public CryptoPayment(double amt) { super(amt); }
    void process() { System.out.println("Sending " + amount + " BTC"); }
    void verifyBlockchain() { /* specific to crypto */ }
}

// Polymorphic collection
List<Payment> payments = List.of(
    new CreditCardPayment(100),
    new CryptoPayment(0.005)
);
for (Payment p : payments) {
    p.execute(); // Each calls its own process()
}

// Pattern matching for instanceof (Java 16+)
Payment myPay = new CryptoPayment(1.5);
if (myPay instanceof CryptoPayment cp) {
    // cp is automatically cast to CryptoPayment here
    cp.verifyBlockchain(); 
}`
            }
          ]} />

          <ProTip>
            <strong>Operator Overloading (C++ only):</strong> C++ allows redefining operators for custom types. You can make <code>Matrix a + b</code> work intuitively. Java deliberately omits this feature (except for String <code>+</code>) to prevent abuse and maintain code clarity.
          </ProTip>
        </div>
      </div>
    )
  },
  {
    id: "abstraction",
    title: "Pillar 4: Abstraction",
    icon: <Globe />,
    searchContent: "abstraction abstract classes interfaces implementation hiding complex systems contract pure virtual default methods functional interface",
    render: (highlight) => (
      <div className="space-y-8">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Abstraction</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Hiding complex implementation details and showing only the essential features to the user. Like driving a car: you know how the steering wheel works, but you don't need to know fuel injection mechanics to drive." highlight={highlight} />
          </p>

          <ComplexityTable
            title="Abstract Class vs Interface"
            cols={["Feature", "Abstract Class", "Interface"]}
            rows={[
              { f: "Methods", a: "Abstract + Concrete", i: "Abstract (+ default in Java 8+)" },
              { f: "Fields", a: "Instance variables", i: "Only static final constants" },
              { f: "Constructors", a: "Yes", i: "No" },
              { f: "Multiple Inheritance", a: "No (single extends)", i: "Yes (implements multiple)" },
              { f: "Access Modifiers", a: "Any", i: "Public only (implicitly)" },
              { f: "Use When", a: "Shared state + behavior", i: "Pure contract / capability" },
            ]}
          />

          <CodeTabs tabs={[
            {
              language: "Java",
              title: "Interfaces & Default Methods",
              code: `// Interface: Pure abstraction. A strict contract.
interface Drivable {
    void accelerate();
    void brake();
    
    // Default method (Java 8+) - optional override
    default void honk() {
        System.out.println("Beep beep!");
    }
    
    // Static method in interface
    static boolean isValidSpeed(int speed) {
        return speed >= 0 && speed <= 300;
    }
}

interface Electric {
    void charge();
    int getBatteryLevel();
}

// Abstract Class: Partial abstraction with shared state
abstract class Vehicle {
    protected String brand;
    protected int year;
    
    public Vehicle(String brand, int year) {
        this.brand = brand;
        this.year = year;
    }
    
    public void startEngine() { 
        System.out.println("Vroom"); 
    }
    
    abstract void refuel(); // Must be implemented by child
}

// Multiple interface implementation
class Tesla extends Vehicle implements Drivable, Electric {
    private int battery = 100;
    
    public Tesla(int year) { super("Tesla", year); }
    
    void refuel() { System.out.println("Charging..."); }
    public void accelerate() { System.out.println("Instant torque!"); }
    public void brake() { System.out.println("Regen braking"); }
    public void charge() { battery = 100; }
    public int getBatteryLevel() { return battery; }
}

// Functional Interface (exactly one abstract method)
@FunctionalInterface
interface MathOp {
    double apply(double a, double b);
}

// Lambda expression mapping to the Functional Interface
MathOp add = (a, b) -> a + b;
MathOp mul = (a, b) -> a * b;
System.out.println(add.apply(3, 4)); // Outputs: 7.0`
            },
            {
              language: "C++",
              title: "Pure Virtual & Abstract",
              code: `// Abstract class (has at least one pure virtual function)
class Drawable {
public:
    virtual void draw() = 0;          // "= 0" means Pure virtual
    virtual void resize(double f) = 0;
    
    // Non-virtual: shared behavior
    void highlight() {
        cout << "Highlighted!" << endl;
    }
    
    virtual ~Drawable() = default;
};

// Interface-like class (all pure virtual, no state)
class Serializable {
public:
    virtual string serialize() = 0;
    virtual void deserialize(string data) = 0;
    virtual ~Serializable() = default;
};

// Implementing multiple "interfaces" via multiple inheritance
class Widget : public Drawable, public Serializable {
    int x, y, w, h;
public:
    Widget(int x, int y, int w, int h) 
        : x(x), y(y), w(w), h(h) {}

    void draw() override {
        cout << "Drawing widget at (" << x << "," << y << ")" << endl;
    }
    void resize(double f) override {
        w *= f; h *= f;
    }
    string serialize() override {
        return to_string(x) + "," + to_string(y);
    }
    void deserialize(string data) override {
        // Implementation for parsing string into state
    }
};`
            }
          ]} />
        </div>
      </div>
    )
  },
  {
    id: "static-members",
    title: "Static Members & Singleton",
    icon: <Key />,
    searchContent: "static members methods class variables static keyword singleton pattern instance shared state class level",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="Static members belong to the CLASS itself, not to any specific object instance. They are shared across all instances and exist even before any object is created. This enables class-level operations, counters, and design patterns like Singleton." highlight={highlight} />
        </p>

        

        <CodeTabs tabs={[
          {
            language: "Java",
            title: "Static Members & Singleton",
            code: `class Player {
    // Static field: shared by ALL Player instances
    private static int totalPlayers = 0;
    private static final int MAX_PLAYERS = 100;
    
    // Instance fields: unique per object
    private String name;
    private int id;

    public Player(String name) {
        if (totalPlayers >= MAX_PLAYERS)
            throw new RuntimeException("Server full!");
        this.name = name;
        this.id = ++totalPlayers;
    }

    // Static method: called on the CLASS, not on objects
    public static int getTotalPlayers() {
        return totalPlayers;
    }
    
    // Static block: runs once when class is first loaded into JVM
    static {
        System.out.println("Player class initialized");
    }
}

// Usage:
Player p1 = new Player("Alice");
Player p2 = new Player("Bob");
Player.getTotalPlayers(); // 2 (class-level call)

// ============ SINGLETON PATTERN ============
class DatabaseConnection {
    // The ONE instance (lazy, thread-safe via volatile)
    private static volatile DatabaseConnection instance;
    
    private DatabaseConnection() {} // Private constructor!
    
    public static DatabaseConnection getInstance() {
        if (instance == null) {
            // Double-checked locking
            synchronized (DatabaseConnection.class) {
                if (instance == null) {
                    instance = new DatabaseConnection();
                }
            }
        }
        return instance;
    }
    
    public void query(String sql) {
        System.out.println("Executing: " + sql);
    }
}

// Always returns the SAME instance in memory
DatabaseConnection db = DatabaseConnection.getInstance();`
          },
          {
            language: "C++",
            title: "Static in C++",
            code: `#include <iostream>
#include <string>
using namespace std;

class Logger {
    // Static member declaration (shared across all instances)
    static int logCount;
    
    // Private constructor (Singleton requirement)
    Logger() {}

public:
    // Static method returning the single instance
    static Logger& getInstance() {
        // C++11 guarantees this static initialization is thread-safe!
        static Logger instance; 
        return instance;
    }
    
    void log(const string& msg) {
        logCount++;
        cout << "[" << logCount << "] " << msg << endl;
    }
    
    static int getLogCount() { return logCount; }
    
    // Delete copy constructor and assignment operator (prevent cloning)
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;
};

// Must define the static member outside the class
int Logger::logCount = 0;

// Usage
// Logger logObj; // ERROR: constructor is private
Logger::getInstance().log("Server started");
Logger::getInstance().log("Connection accepted");
cout << Logger::getLogCount(); // Outputs 2`
          }
        ]} />

        <ProTip>
          <strong>Static methods cannot access instance members</strong> because they have no <code>this</code> pointer/reference. They can only work with static fields and other static methods. Think of them as "class-level utilities."
        </ProTip>
      </div>
    )
  },
  {
    id: "design-patterns",
    title: "Design Patterns",
    icon: <Repeat />,
    searchContent: "design patterns factory observer strategy template method builder adapter decorator proxy pattern creational structural behavioral",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="Design patterns are proven, reusable solutions to commonly occurring problems in software design. They are not code—they are blueprints for solving architectural challenges. Mastering them separates junior from senior engineers." highlight={highlight} />
        </p>

        <ComplexityTable
          title="Essential Design Patterns"
          cols={["Pattern", "Category", "Problem Solved", "Key Concept"]}
          rows={[
            { p: "Singleton", c: "Creational", s: "Only one instance needed", k: "Private constructor" },
            { p: "Factory Method", c: "Creational", s: "Object creation without specifying class", k: "Virtual constructor" },
            { p: "Builder", c: "Creational", s: "Complex object construction", k: "Step-by-step building" },
            { p: "Observer", c: "Behavioral", s: "One-to-many notifications", k: "Publish-subscribe" },
            { p: "Strategy", c: "Behavioral", s: "Swap algorithms at runtime", k: "Composition over inheritance" },
            { p: "Adapter", c: "Structural", s: "Incompatible interfaces", k: "Wrapper class" },
            { p: "Decorator", c: "Structural", s: "Add behavior dynamically", k: "Wrapping chain" },
          ]}
        />

        

        <CodeTabs tabs={[
          {
            language: "Java",
            title: "Factory, Observer & Strategy Patterns",
            code: `// ========== FACTORY METHOD ==========
interface Shape { void draw(); }
class Circle implements Shape { public void draw() { System.out.println("○"); }}
class Square implements Shape { public void draw() { System.out.println("□"); }}

class ShapeFactory {
    public static Shape create(String type) {
        return switch(type.toLowerCase()) {
            case "circle" -> new Circle();
            case "square" -> new Square();
            default -> throw new IllegalArgumentException("Unknown: " + type);
        };
    }
}
Shape s = ShapeFactory.create("circle"); // No 'new Circle()' needed!

// ========== OBSERVER PATTERN ==========
interface Observer { void update(String event, Object data); }

class EventBus {
    private Map<String, List<Observer>> listeners = new HashMap<>();
    
    public void subscribe(String event, Observer obs) {
        listeners.computeIfAbsent(event, k -> new ArrayList<>()).add(obs);
    }
    
    public void publish(String event, Object data) {
        listeners.getOrDefault(event, List.of())
            .forEach(obs -> obs.update(event, data));
    }
}

// Usage:
EventBus bus = new EventBus();
bus.subscribe("login", (event, data) -> 
    System.out.println("User logged in: " + data));
bus.publish("login", "alice@mail.com");

// ========== STRATEGY PATTERN ==========
interface SortStrategy { void sort(int[] arr); }

class QuickSortStrategy implements SortStrategy {
    public void sort(int[] arr) { /* quick sort */ }
}
class MergeSortStrategy implements SortStrategy {
    public void sort(int[] arr) { /* merge sort */ }
}

class Sorter {
    private SortStrategy strategy;
    public Sorter(SortStrategy s) { this.strategy = s; }
    public void setStrategy(SortStrategy s) { this.strategy = s; }
    public void performSort(int[] arr) { strategy.sort(arr); }
}

// Swap algorithms at runtime without changing the Sorter!
Sorter sorter = new Sorter(new QuickSortStrategy());
sorter.setStrategy(new MergeSortStrategy()); // Strategy changed dynamically!`
          }
        ]} />

        <ProTip>
          <strong>SOLID Principles guide pattern usage:</strong> <strong>S</strong>ingle Responsibility, <strong>O</strong>pen/Closed, <strong>L</strong>iskov Substitution, <strong>I</strong>nterface Segregation, <strong>D</strong>ependency Inversion. These five principles ensure your OOP code is maintainable, testable, and extensible.
        </ProTip>
      </div>
    )
  },
  {
    id: "generics-templates",
    title: "Generics & Templates",
    icon: <Database />,
    searchContent: "generics templates type parameters parameterized types type safety bounded wildcards template specialization generic methods collections",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="Generics (Java) and Templates (C++) allow writing type-safe, reusable code that works with ANY data type. Instead of writing separate Stack classes for int, String, and Double, you write ONE generic Stack<T> that adapts to the type provided." highlight={highlight} />
        </p>

        

        <CodeTabs tabs={[
          {
            language: "Java",
            title: "Generics Complete",
            code: `// Generic class with dual type parameters
class Pair<K, V> {
    private K key;
    private V value;
    
    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }
    
    public K getKey() { return key; }
    public V getValue() { return value; }
}

Pair<String, Integer> age = new Pair<>("Alice", 25);
Pair<Integer, Boolean> flag = new Pair<>(1, true);

// Generic method (type inferred at call time)
public static <T extends Comparable<T>> T findMax(T[] arr) {
    T max = arr[0];
    for (T item : arr) {
        if (item.compareTo(max) > 0) max = item;
    }
    return max;
}

// Bounded type parameters
class NumberBox<T extends Number> {
    private T value;
    public double doubleValue() { return value.doubleValue(); }
}

// Wildcards
void printList(List<?> list) { }           // Any type
void addNumbers(List<? extends Number> l) { } // Number or subtype
void addIntegers(List<? super Integer> l) { } // Integer or supertype

// Type erasure: generics are compile-time only!
// At runtime, List<String> becomes just List.
// This is why you can't do: new T[] or obj instanceof T`
          },
          {
            language: "C++",
            title: "Templates Complete",
            code: `#include <iostream>
#include <string>
#include <stdexcept>
using namespace std;

// Function template
template <typename T>
T findMax(T a, T b) {
    return (a > b) ? a : b;
}

// findMax(10, 20);       // int version generated
// findMax(3.14, 2.71);   // double version generated

// Class template with default parameter
template <typename T, int SIZE = 10>
class Stack {
    T arr[SIZE];
    int top;
public:
    Stack() : top(-1) {}
    
    void push(T val) {
        if (top >= SIZE - 1) throw overflow_error("Full");
        arr[++top] = val;
    }
    
    T pop() {
        if (top < 0) throw underflow_error("Empty");
        return arr[top--];
    }
};

// Stack<int, 100> intStack;
// Stack<string> strStack; // Uses default SIZE=10

// Template specialization (custom behavior for specific types)
template <>
class Stack<bool, 8> {
    // Highly efficient bit-packed implementation for 8 bools!
    uint8_t bits;
    int top;
public:
    Stack() : bits(0), top(-1) {}
    void push(bool val) {
        if (top >= 7) throw overflow_error("Full");
        bits |= (val << ++top); // Flip the specific bit
    }
};

// Variadic templates (C++11) - accepts arbitrary number of arguments
template <typename... Args>
void print(Args... args) {
    // Fold expression (C++17 feature)
    ((cout << args << " "), ...); 
    cout << endl;
}
// print(1, "hello", 3.14); // Outputs: 1 hello 3.14`
          }
        ]} />

        <WarningBlock>
          <strong>Java Type Erasure:</strong> Generic type information is erased at compile time. This means you cannot use <code>instanceof</code> with generics, create generic arrays (<code>new T[10]</code>), or have overloaded methods that differ only in generic type (<code>void f(List&lt;String&gt;)</code> vs <code>void f(List&lt;Integer&gt;)</code>).
        </WarningBlock>
      </div>
    )
  },
  {
    id: "solid-principles",
    title: "SOLID Principles",
    icon: <Target />,
    searchContent: "SOLID single responsibility open closed liskov substitution interface segregation dependency inversion clean code architecture",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="SOLID is an acronym for five design principles that make software designs more understandable, flexible, and maintainable. They are the foundation of professional software engineering and the interview favorite for senior roles." highlight={highlight} />
        </p>

        

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h4 className="text-cyan-400 font-bold text-xl mb-2">S — Single Responsibility Principle</h4>
            <p className="text-sm text-slate-400 mb-3">"A class should have only ONE reason to change." Each class handles exactly one concern.</p>
            <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-rose-500/10 p-3 rounded border border-rose-500/20">
                <strong className="text-rose-400 block mb-1">❌ Violation</strong>
                <pre className="text-slate-400">{`class User {
  void saveToDatabase() {...}
  void sendEmail() {...}
  void generateReport() {...}
}`}</pre>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded border border-emerald-500/20">
                <strong className="text-emerald-400 block mb-1">✅ Correct</strong>
                <pre className="text-slate-400">{`class User { ... }
class UserRepository { save() }
class EmailService { send() }
class ReportGenerator { gen() }`}</pre>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h4 className="text-purple-400 font-bold text-xl mb-2">O — Open/Closed Principle</h4>
            <p className="text-sm text-slate-400">"Software entities should be <strong>open for extension</strong> but <strong>closed for modification</strong>." Add new features by adding new code (subclasses, implementations), not by changing existing tested code. Strategy and Decorator patterns embody this.</p>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h4 className="text-emerald-400 font-bold text-xl mb-2">L — Liskov Substitution Principle</h4>
            <p className="text-sm text-slate-400">"Subtypes must be substitutable for their base types without altering program correctness." If <code>Square extends Rectangle</code>, then everywhere a <code>Rectangle</code> is expected, a <code>Square</code> must work correctly. The classic Square/Rectangle problem violates this.</p>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h4 className="text-amber-400 font-bold text-xl mb-2">I — Interface Segregation Principle</h4>
            <p className="text-sm text-slate-400">"Clients should not be forced to depend on interfaces they don't use." Instead of one fat <code>Worker</code> interface with <code>work()</code>, <code>eat()</code>, <code>sleep()</code>, split into <code>Workable</code>, <code>Feedable</code>, <code>Sleepable</code>. A robot <code>implements Workable</code> only.</p>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h4 className="text-orange-400 font-bold text-xl mb-2">D — Dependency Inversion Principle</h4>
            <p className="text-sm text-slate-400">"High-level modules should not depend on low-level modules. Both should depend on abstractions." Don't instantiate dependencies directly. Instead, inject interfaces. This enables testing with mocks and swapping implementations.</p>
          </div>
        </div>

        <ProTip>
          When interviewing for software engineering roles, being able to identify SOLID violations in code and propose refactoring solutions demonstrates senior-level thinking. Practice by reviewing open-source projects and identifying violations.
        </ProTip>
      </div>
    )
  }
];