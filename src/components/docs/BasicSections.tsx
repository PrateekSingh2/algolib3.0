import React from "react";
import { Box, Repeat, Target, Database, Binary, Calculator, Cpu as CpuIcon, FileCode, ShieldCheck, Zap } from "lucide-react";
import { HighlightText, ProTip, WarningBlock, ComplexityTable, CodeTabs, DocSection } from "@/components/docs/DocComponents";

export const BASIC_SECTIONS: DocSection[] = [
  {
    id: "memory-execution",
    title: "Memory & Execution",
    icon: <CpuIcon />,
    searchContent: "memory allocation execution stack heap compilation compiler interpreter basics runtime compile linking loader",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="Before writing code, you must understand where it lives. Programs don't run in a vacuum; they interact directly with your system's hardware. Let's look under the hood at how source code transforms into running processes." highlight={highlight} />
        </p>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">The Compilation Pipeline</h3>
          
          <p className="text-slate-400 mb-4">Source code goes through multiple stages before execution:</p>
          <ul className="space-y-4 text-sm text-slate-400 font-mono bg-slate-900 p-6 rounded-lg border border-slate-800 shadow-inner">
            <li><strong className="text-cyan-400 text-base block mb-1">1. Preprocessing:</strong> Handles directives like <code>#include</code> and <code>#define</code>. Macros are expanded, comments removed, and header files are merged into a single translation unit.</li>
            <li><strong className="text-emerald-400 text-base block mb-1">2. Compilation:</strong> The preprocessed code is parsed into an Abstract Syntax Tree (AST), semantically analyzed, and translated into assembly language specific to your CPU architecture (x86, ARM).</li>
            <li><strong className="text-purple-400 text-base block mb-1">3. Assembly:</strong> The assembler converts human-readable assembly into machine code (object files, <code>.o</code> or <code>.obj</code>), producing binary opcodes.</li>
            <li><strong className="text-amber-400 text-base block mb-1">4. Linking:</strong> The linker resolves external references, merges multiple object files, and links library code to produce the final executable binary.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">The Memory Layout</h3>
          
          <p className="text-slate-400 mb-4">When a program runs, the OS allocates a chunk of RAM divided into distinct segments:</p>
          <ul className="space-y-4 text-sm text-slate-400 font-mono bg-slate-900 p-6 rounded-lg border border-slate-800 shadow-inner">
            <li><strong className="text-cyan-400 text-base block mb-1">Text Segment:</strong> Where the compiled binary code (machine instructions) is stored. It is read-only to prevent accidental modification.</li>
            <li><strong className="text-emerald-400 text-base block mb-1">Data Segment (BSS + Initialized):</strong> Stores global and static variables. The BSS segment holds uninitialized globals (zeroed out), while the initialized data segment holds explicitly assigned globals.</li>
            <li><strong className="text-purple-400 text-base block mb-1">The Stack:</strong> Fast, organized memory used for local variables, function parameters, and return addresses. Memory is automatically allocated and deallocated (LIFO). <em>If recursion goes too deep, you hit a "Stack Overflow."</em></li>
            <li><strong className="text-amber-400 text-base block mb-1">The Heap:</strong> A large pool of unorganized memory used for dynamic allocation during runtime (e.g., <code>new</code>, <code>malloc</code>). You must manage this manually in C/C++, or let the Garbage Collector handle it in Java/Python. Unmanaged heap memory leads to fragmentation and memory leaks.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Compiled vs. Interpreted Languages</h3>
          <ComplexityTable
            title="Language Execution Models"
            cols={["Type", "Examples", "Speed", "Portability", "Error Detection"]}
            rows={[
              { t: "Compiled", e: "C, C++, Rust, Go", s: "Very Fast", p: "Platform-specific binary", d: "Compile-time" },
              { t: "Interpreted", e: "Python, Ruby, JS", s: "Slower", p: "Runs anywhere with interpreter", d: "Runtime" },
              { t: "Hybrid (JIT)", e: "Java, C#, Kotlin", s: "Fast (after warmup)", p: "Bytecode → JVM/CLR", d: "Both" },
            ]}
          />
          <ProTip>Java compiles to <strong>bytecode</strong> (.class files), not native machine code. The JVM then uses <strong>Just-In-Time (JIT)</strong> compilation to translate hot bytecode paths into native instructions at runtime, combining portability with near-native speed.</ProTip>
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Process vs. Thread</h3>
          <p className="text-slate-400 mb-4">A <strong>process</strong> is an independent program in execution with its own memory space. A <strong>thread</strong> is a lightweight unit of execution within a process that shares memory with other threads.</p>
          <ComplexityTable
            title="Process vs Thread Comparison"
            cols={["Property", "Process", "Thread"]}
            rows={[
              { p: "Memory", pr: "Separate address space", t: "Shared address space" },
              { p: "Creation Cost", pr: "Heavy (fork/exec)", t: "Lightweight" },
              { p: "Communication", pr: "IPC (pipes, sockets)", t: "Direct shared memory" },
              { p: "Crash Impact", pr: "Isolated", t: "Can crash entire process" },
            ]}
          />
        </div>
      </div>
    )
  },
  {
    id: "variables-types",
    title: "Variables & Data Types",
    icon: <Box />,
    searchContent: "variables data types primitive integer float boolean string casting type conversion widening narrowing overflow underflow",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="Variables are named memory locations. Data types dictate how much memory is reserved and what operations can be performed on that data. Understanding types prevents bugs, memory waste, and security vulnerabilities." highlight={highlight} />
        </p>

        <ComplexityTable
          title="Common Primitives (Typical 64-bit Architecture)"
          cols={["Type", "Size", "Description", "Range"]}
          rows={[
            { t: "boolean", s: "1 byte", d: "True or False state", r: "true / false" },
            { t: "byte", s: "1 byte", d: "Signed 8-bit integer", r: "-128 to 127" },
            { t: "char", s: "1 or 2 bytes", d: "Single character", r: "ASCII or UTF-16" },
            { t: "short", s: "2 bytes", d: "Small integer", r: "-32,768 to 32,767" },
            { t: "int", s: "4 bytes", d: "Standard integer", r: "-2.14B to 2.14B" },
            { t: "long", s: "8 bytes", d: "Large integer", r: "±9.2 × 10¹⁸" },
            { t: "float", s: "4 bytes", d: "Single precision (IEEE 754)", r: "±3.4e±38 (~7 digits)" },
            { t: "double", s: "8 bytes", d: "Double precision (IEEE 754)", r: "±1.7e±308 (~15 digits)" },
          ]}
        />

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Type Casting & Conversion</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
              <h4 className="font-bold text-slate-50 mb-3 text-emerald-400">Widening (Implicit)</h4>
              <p className="text-sm text-slate-400 mb-3">Automatic conversion from smaller to larger type. No data loss.</p>
              <pre className="text-xs bg-slate-950 p-3 rounded font-mono text-slate-400 border border-slate-800">
{`int x = 42;
double y = x; // 42.0 (automatic)`}
              </pre>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
              <h4 className="font-bold text-slate-50 mb-3 text-rose-400">Narrowing (Explicit)</h4>
              <p className="text-sm text-slate-400 mb-3">Manual conversion from larger to smaller type. Risk of data loss!</p>
              <pre className="text-xs bg-slate-950 p-3 rounded font-mono text-slate-400 border border-slate-800">
{`double pi = 3.14159;
int x = (int)pi; // 3 (truncated!)`}
              </pre>
            </div>
          </div>
        </div>

        <WarningBlock>
          <strong>Integer Overflow:</strong> If you add 1 to the maximum value of a signed <code>int</code> (2,147,483,647), it wraps around to -2,147,483,648. This is called <em>overflow</em> and is a common source of critical bugs in financial software and game engines. Always validate ranges for user input.
        </WarningBlock>

        <ProTip>
          <strong>Strongly Typed vs Loosely Typed:</strong> C++ and Java are strongly typed—you must declare a variable's type, and it cannot change. Python is dynamically typed—the interpreter infers the type at runtime. Strong typing prevents many runtime bugs but requires more upfront planning.
        </ProTip>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Constants & Enumerations</h3>
          <p className="text-slate-400 mb-4">Constants are variables whose values cannot be modified after initialization. Use them for mathematical constants, configuration values, and magic numbers.</p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Constants & Enums",
              code: `// Constants
const double PI = 3.14159265358979;
constexpr int MAX_BUFFER = 1024; // Compile-time constant

// Enum (Classic)
enum Color { RED, GREEN, BLUE };

// Enum Class (Scoped - Modern C++11+)
enum class Direction : uint8_t {
    NORTH = 0, SOUTH = 1, EAST = 2, WEST = 3
};
Direction d = Direction::NORTH; // Must use scope`
            },
            {
              language: "Java",
              title: "Constants & Enums",
              code: `// Constants
final double PI = 3.14159265358979;
static final int MAX_BUFFER = 1024;

// Enum with methods (Java's enums are powerful!)
enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    EARTH(5.976e+24, 6.37814e6);

    private final double mass, radius;
    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
    }
    double surfaceGravity() {
        return 6.67300E-11 * mass / (radius * radius);
    }
}`
            },
            {
              language: "Python",
              title: "Constants & Enums",
              code: `from enum import Enum, auto

# Constants (Naming convention: ALL_CAPS)
PI = 3.14159265358979
MAX_BUFFER = 1024 # Python has no 'const' keyword

# Enum Class (Python 3.4+)
class Color(Enum):
    RED = 1
    GREEN = 2
    BLUE = 3

# Enum with auto-values
class Direction(Enum):
    NORTH = auto()
    SOUTH = auto()
    EAST = auto()
    WEST = auto()

# Usage
print(Color.RED.name)  # "RED"
print(Color.RED.value) # 1`
            }
          ]} />
        </div>
      </div>
    )
  },
  {
    id: "operators-expressions",
    title: "Operators & Expressions",
    icon: <Calculator />,
    searchContent: "operators arithmetic relational logical bitwise assignment ternary precedence associativity short circuit evaluation",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="Operators are symbols that instruct the compiler to perform specific mathematical, relational, or logical manipulations. Understanding operator precedence prevents subtle bugs in complex expressions." highlight={highlight} />
        </p>

        <ComplexityTable
          title="Operator Precedence (Highest to Lowest)"
          cols={["Precedence", "Operator", "Description", "Associativity"]}
          rows={[
            { p: "1 (Highest)", o: "() [] -> .", d: "Postfix / Member access", a: "Left to Right" },
            { p: "2", o: "++ -- ! ~ (type)", d: "Unary / Cast", a: "Right to Left" },
            { p: "3", o: "* / %", d: "Multiplicative", a: "Left to Right" },
            { p: "4", o: "+ -", d: "Additive", a: "Left to Right" },
            { p: "5", o: "<< >>", d: "Bitwise Shift", a: "Left to Right" },
            { p: "6", o: "< <= > >=", d: "Relational", a: "Left to Right" },
            { p: "7", o: "== !=", d: "Equality", a: "Left to Right" },
            { p: "8", o: "&&", d: "Logical AND", a: "Left to Right" },
            { p: "9", o: "||", d: "Logical OR", a: "Left to Right" },
            { p: "10", o: "?:", d: "Ternary", a: "Right to Left" },
            { p: "11 (Lowest)", o: "= += -= *= /=", d: "Assignment", a: "Right to Left" },
          ]}
        />

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Short-Circuit Evaluation</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Logical operators && and || use short-circuit evaluation: the second operand is only evaluated if the first doesn't determine the result. This is not just an optimization—it's a programming technique for safe dereferencing." highlight={highlight} />
          </p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Short Circuit Safety",
              code: `// Safe null-pointer check using short-circuit
Node* ptr = nullptr;

// Without short-circuit, ptr->data would crash!
if (ptr != nullptr && ptr->data == 42) {
    // ptr->data is ONLY evaluated if ptr is not null
    cout << "Found!" << endl;
}

// Ternary operator (compact if/else)
int age = 20;
string status = (age >= 18) ? "Adult" : "Minor";

// Comma operator (evaluates left, returns right)
int a = (1, 2, 3); // a = 3`
            },
            {
              language: "Java",
              title: "Short-Circuit & Ternary",
              code: `// Safe null-pointer check using short-circuit
String text = null;

// Without short-circuit, text.length() would throw NullPointerException
if (text != null && text.length() > 0) {
    // text.length() is ONLY evaluated if text is not null
    System.out.println("Valid text!");
}

// Ternary operator (compact if/else)
int age = 20;
String status = (age >= 18) ? "Adult" : "Minor";`
            },
            {
              language: "Python",
              title: "Short-Circuit & Ternary",
              code: `# Safe null check using 'and'
text = None

# Python's 'and' / 'or' short-circuit
if text is not None and len(text) > 0:
    print("Valid text!")

# Ternary expression (Modern Python)
age = 20
status = "Adult" if age >= 18 else "Minor"

# Identity vs Equality
a = [1, 2]
b = [1, 2]
print(a == b) # True (Values)
print(a is b) # False (Memory Location)`
            }
          ]} />
        </div>

        <ProTip>
          <strong>The sizeof Operator:</strong> Returns the size in bytes of a type or variable at compile-time. <code>sizeof(int)</code> is 4 on most systems. For arrays, <code>sizeof(arr)/sizeof(arr[0])</code> gives the element count—but this only works for stack arrays, NOT pointers!
        </ProTip>
      </div>
    )
  },
  {
    id: "control-flow",
    title: "Control Flow & Loops",
    icon: <Repeat />,
    searchContent: "control flow if else switch case loops for while do while iteration break continue goto nested loop patterns",
    render: (highlight) => (
      <div className="space-y-8">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Conditional Branching</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Programs make decisions based on boolean logic using if/else statements. For checking a single variable against many specific constants, a Switch statement is computationally faster due to jump tables compiled by the optimizer." highlight={highlight} />
          </p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Switch Case Fallthrough",
              code: `int day = 3;
switch (day) {
    case 1: cout << "Monday"; break;
    case 2: cout << "Tuesday"; break;
    case 3: 
        cout << "Wednesday"; 
        // Missing 'break' causes fallthrough to Thursday!
    case 4: 
        cout << "Thursday"; break;
    default: cout << "Weekend!";
}`
            },
            {
              language: "Java",
              title: "Enhanced Switch (Java 14+)",
              code: `// Modern switch expression with arrow syntax
String dayType = switch (day) {
    case 1, 2, 3, 4, 5 -> "Weekday";
    case 6, 7 -> "Weekend";
    default -> throw new IllegalArgumentException("Invalid day");
};
// No break needed, no fallthrough possible!`
            },
            {
              language: "Python",
              title: "Match Case (3.10+)",
              code: `day = 3

# Traditional Dictionary Mapping (Pre-3.10)
days = {1: "Mon", 2: "Tue", 3: "Wed"}
print(days.get(day, "Weekend"))

# Structural Pattern Matching (Python 3.10+)
match day:
    case 1 | 2 | 3 | 4 | 5:
        day_type = "Weekday"
    case 6 | 7:
        day_type = "Weekend"
    case _:
        raise ValueError("Invalid day")

# Advanced Pattern Matching
point = (0, 5)
match point:
    case (0, 0): print("Origin")
    case (0, y): print(f"Y-axis at {y}")
    case (x, 0): print(f"X-axis at {x}")
    case _: print("Somewhere else")`
            }
          ]} />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Iteration & Jump Statements</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Executing code repeatedly. Use a for loop when you know the exact number of iterations. Use a while loop when iterating until a condition breaks. Use do-while when you need at least one execution." highlight={highlight} />
          </p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Loop Patterns",
              code: `// For loop with multiple variables
for (int i = 0, j = 10; i < j; i++, j--) {
    cout << i << " " << j << endl;
}

// Range-based for (C++11)
vector<int> nums = {1, 2, 3, 4, 5};
for (const auto& num : nums) {
    cout << num << " ";
}

// Nested loop pattern: Matrix traversal
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        matrix[i][j] = i * cols + j;
    }
}

// Break and Continue
for (int i = 0; i < 100; i++) {
    if (i % 2 == 0) continue; // Skip even
    if (i > 50) break;        // Stop entirely at 50
    cout << i << " ";         // Prints odd numbers 1-49
}

// The goto statement (AVOID USING THIS)
// It creates "Spaghetti Code" that is impossible to read.
    goto error_handler; 
    // ... code ...
error_handler:
    cout << "An error occurred";`
            },
            {
              language: "Java",
              title: "Enhanced For & Labels",
              code: `// Enhanced for-each
int[] arr = {10, 20, 30};
for (int val : arr) {
    System.out.println(val);
}

// Labeled break (escape nested loops safely without goto)
outer:
for (int i = 0; i < 5; i++) {
    for (int j = 0; j < 5; j++) {
        if (i * j > 6) break outer;
        System.out.print(i * j + " ");
    }
}

// do-while (at least once)
Scanner sc = new Scanner(System.in);
int input;
do {
    System.out.print("Enter positive: ");
    input = sc.nextInt();
} while (input <= 0);`
            },
            {
              language: "Python",
              title: "Pythonic Loops",
              code: `# range(start, stop, step)
for i in range(0, 10, 2):
    print(i) # 0, 2, 4, 6, 8

# Iterating with index (enumerate)
names = ["Alice", "Bob"]
for idx, name in enumerate(names):
    print(f"{idx}: {name}")

# Zip (Iterate multiple lists)
ages = [25, 30]
for name, age in zip(names, ages):
    print(f"{name} is {age}")

# List Comprehensions (Powerful!)
squares = [x**2 for x in range(10) if x % 2 == 0]

# While loop (no do-while in Python)
while True:
    val = int(input("Enter positive: "))
    if val > 0: break # Emulate do-while behavior`
            }
          ]} />
          <WarningBlock>
            <strong>Infinite Loops:</strong> Forgetting to update the loop variable or having an unreachable exit condition creates an infinite loop. Your program hangs, consuming 100% CPU. Always verify your loop's termination condition on paper before running.
          </WarningBlock>
        </div>
      </div>
    )
  },
  {
    id: "functions-pointers",
    title: "Functions, Arrays & Pointers",
    icon: <Target />,
    searchContent: "functions arrays pointers references pass by value user defined array pointer arithmetic dynamic allocation new delete malloc free smart pointers function pointers",
    render: (highlight) => (
      <div className="space-y-8">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">User-Defined Functions</h3>
          
          <p className="text-slate-400 mb-4">
            <HighlightText text="Functions encapsulate logic to follow the DRY (Don't Repeat Yourself) principle. When calling a function, parameters are passed on the Call Stack, creating a new stack frame for each invocation." highlight={highlight} />
          </p>
          <ProTip><strong>Pass by Value vs Reference:</strong> By default, most languages pass a <em>copy</em> of your variable into the function. If you want the function to modify the original variable, you must pass its memory address (Pointer) or Reference. In Java, primitives are always passed by value; objects pass the reference by value.</ProTip>

          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Function Overloading & Defaults",
              code: `// Function overloading (same name, different params)
int add(int a, int b) { return a + b; }
double add(double a, double b) { return a + b; }

// Default arguments
void greet(string name, string prefix = "Hello") {
    cout << prefix << ", " << name << "!" << endl;
}
greet("Alice");            // "Hello, Alice!"
greet("Bob", "Goodbye");   // "Goodbye, Bob!"

// Pass by reference (modifies original)
void swap(int& a, int& b) {
    int temp = a; a = b; b = temp;
}

// Inline functions (compiler hint for small functions to replace the call with the body code)
inline int square(int x) { return x * x; }

// Function Pointers (storing functions as variables)
void (*funcPtr)(int&, int&) = &swap;
funcPtr(x, y); // Calls swap(x, y)`
            },
            {
              language: "Java",
              title: "Variable Arguments & Recursion",
              code: `// Varargs (variable number of arguments)
public static int sum(int... numbers) {
    int total = 0;
    for (int n : numbers) total += n;
    return total;
}
sum(1, 2, 3);    // 6
sum(1, 2, 3, 4); // 10

// Method overloading
static String format(int n) { return String.valueOf(n); }
static String format(double n) { return String.format("%.2f", n); }

// Recursive factorial
static long factorial(int n) {
    if (n <= 1) return 1;  // Base case
    return n * factorial(n - 1);  // Recursive case
}`
            },
            {
              language: "Python",
              title: "Arguments & Recur",
              code: `# Variable number of arguments (*args)
def sum_all(*numbers):
    return sum(numbers)

# Keyword arguments (**kwargs)
def print_config(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

# Default arguments
def greet(name, msg="Hello"):
    print(f"{msg}, {name}")

# Recursion
def factorial(n):
    return 1 if n <= 1 else n * factorial(n-1)`
            }
          ]} />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Arrays & Pointers (The C++ Connection)</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="An Array is a contiguous block of memory. In C/C++, the name of the array is actually just a Pointer to the first element's memory address. Understanding this connection is fundamental to mastering C++." highlight={highlight} />
          </p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Pointer Arithmetic & Dynamic Memory",
              code: `int arr[3] = {10, 20, 30};
int* ptr = arr; // Points to arr[0]

cout << *ptr << endl;       // Outputs 10
cout << *(ptr + 1) << endl; // Outputs 20 (moves 4 bytes forward)

// Dynamic memory allocation
int* dynArr = new int[100]; // Heap allocation
dynArr[0] = 42;
delete[] dynArr;            // MUST free to prevent leak

// Smart Pointers (C++11 - automatic cleanup, prevents leaks)
#include <memory>
unique_ptr<int[]> safe(new int[100]); // Auto-deletes when out of scope
shared_ptr<int> shared = make_shared<int>(42);
// Reference count: deleted when last shared_ptr dies

// Pointer to pointer
int x = 5;
int* p = &x;
int** pp = &p;
cout << **pp; // 5`
            },
            {
              language: "Java",
              title: "References & Arrays",
              code: `// Java uses References instead of Pointers
int[] arr = {10, 20, 30};
int[] ref = arr; // ref points to the same array object

System.out.println(ref[0]); // 10

// Dynamic memory allocation is handled by 'new'
int[] dynArr = new int[100]; 
dynArr[0] = 42;
// No explicit 'delete'. Garbage Collector handles cleanup.

// References can be null
String s = null;
// s.length(); // Throws NullPointerException`
            },
            {
              language: "Python",
              title: "References & Lists",
              code: `# Everything in Python is an OBJECT
# Variables are references to objects
a = [1, 2, 3]
b = a # b references the same list
b.append(4)
print(a) # [1, 2, 3, 4]

# Dynamic lists (not arrays)
arr = [0] * 100 # Pre-allocation
arr[0] = 42

# Slicing (Powerful feature)
nums = [10, 20, 30, 40]
print(nums[1:3]) # [20, 30]

# List methods
nums.insert(0, 5)
nums.pop()`
            }
          ]} />
          <WarningBlock>Accessing memory beyond your array bounds (e.g., <code>arr[5]</code> on a size-3 array) leads to a <strong>Segmentation Fault</strong>, or worse—silently corrupting adjacent memory. This is a major source of security vulnerabilities (buffer overflow attacks).</WarningBlock>
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Multi-Dimensional Arrays</h3>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "2D Arrays",
              code: `// Static 2D array
int matrix[3][4]; // 3 rows, 4 columns
matrix[1][2] = 42;

// Dynamic 2D array (Array of Pointers)
int** grid = new int*[rows];
for (int i = 0; i < rows; i++)
    grid[i] = new int[cols];

// Cleanup (reverse order!)
for (int i = 0; i < rows; i++) delete[] grid[i];
delete[] grid;

// Modern C++ approach: vector of vectors
vector<vector<int>> v(3, vector<int>(4, 0)); // 3x4, init 0`
            },
            {
              language: "Java",
              title: "2D & Jagged Arrays",
              code: `// Fixed 2D array
int[][] matrix = new int[3][4];
matrix[1][2] = 42;

// Jagged arrays (each row can have different length)
int[][] jagged = new int[3][];
jagged[0] = new int[2];
jagged[1] = new int[5];
jagged[2] = new int[3];

// Initializing jagged array directly
int[][] triangle = {
    {1},
    {1, 2},
    {1, 2, 3}
};`
            },
            {
              language: "Python",
              title: "Nested Lists",
              code: `# Standard 2D List
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

# List Comprehension for 2D initialization
rows, cols = 3, 4
grid = [[0 for _ in range(cols)] for _ in range(rows)]

# Access
grid[1][2] = 42

# Jagged (variable lengths)
jagged = [
    [1],
    [1, 2],
    [1, 2, 3]
]`
            }
          ]} />
        </div>
      </div>
    )
  },
  {
    id: "strings-manipulation",
    title: "Strings & Manipulation",
    icon: <FileCode />,
    searchContent: "strings string manipulation character arrays c-strings std string comparison concatenation substring tokenization parsing",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="Strings are sequences of characters. In C, they are null-terminated character arrays. In C++ and Java, they are objects with rich methods. String handling is one of the most common operations in programming." highlight={highlight} />
        </p>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">C-Strings vs C++ Strings</h3>
          
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "String Operations",
              code: `#include <string>
#include <algorithm>
using namespace std;

// C-style string (null-terminated)
char cstr[] = "Hello"; // Actually 6 bytes: H-e-l-l-o-\\0
strlen(cstr);          // 5 (doesn't count null terminator)

// C++ string object
string s = "Hello, World!";
s.length();             // 13
s.substr(0, 5);         // "Hello"
s.find("World");        // 7 (index)
s.replace(7, 5, "C++"); // "Hello, C++!"

// String concatenation
string a = "Hello";
string b = " World";
string c = a + b;       // "Hello World"

// String comparison
if (a == "Hello") {}    // Content comparison
if (a < b) {}           // Lexicographic comparison

// Reverse a string
reverse(s.begin(), s.end());

// String to number conversions
int num = stoi("42");
double d = stod("3.14");
string ns = to_string(42); // "42"

// Character-by-character processing
for (char& ch : s) {
    ch = toupper(ch);   // Convert to uppercase
}`
            },
            {
              language: "Java",
              title: "String & StringBuilder",
              code: `// Strings are IMMUTABLE in Java
String s = "Hello";
s.length();                // 5
s.charAt(0);               // 'H'
s.substring(0, 3);         // "Hel"
s.indexOf("llo");          // 2
s.toUpperCase();           // "HELLO"
s.trim();                  // Remove whitespace
s.contains("ell");         // true
s.replace("l", "L");       // "HeLLo"

// String comparison (NEVER use == for content!)
s.equals("Hello");         // true (content)
s.equalsIgnoreCase("hello"); // true

// StringBuilder (MUTABLE, efficient concatenation)
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i).append(", "); // O(1) amortized
}
String result = sb.toString();

// Split & Join
String[] parts = "a,b,c".split(",");
String joined = String.join("-", parts); // "a-b-c"

// String Pool
String a = "Hello";
String b = "Hello";
// a == b is TRUE (same pool reference)
String c = new String("Hello");
// a == c is FALSE (different objects in memory)`
            },
            {
              language: "Python",
              title: "Modern Strings",
              code: `s = "Hello"
s.lower()   # "hello"
s.strip()   # Remove whitespace
s.split(",") # Tokenization

# Slicing
print(s[0:2]) # "He"
print(s[::-1]) # "olleH" (Reverse)

# f-strings (Python 3.6+)
name, age = "Alice", 25
print(f"{name} is {age} years old")

# Multiline strings
sql = """
SELECT * 
FROM users 
WHERE id = 1
"""

# Strings are IMMUTABLE like Java
# Use "".join() for efficiency
parts = ["a", "b", "c"]
result = "-".join(parts)`
            }
          ]} />
        </div>

        <ProTip>
          <strong>String Immutability:</strong> In Java, every <code>String</code> operation creates a NEW string object. Concatenating strings in a loop with <code>+</code> is O(N²) because each iteration copies the entire string. Use <code>StringBuilder</code> for O(N) performance.
        </ProTip>

        <WarningBlock>
          In C, forgetting to allocate space for the null terminator <code>\0</code> causes buffer overruns. <code>char s[5] = "Hello"</code> overflows because "Hello" needs 6 bytes. Always allocate <code>strlen + 1</code>.
        </WarningBlock>
      </div>
    )
  },
  {
    id: "bitwise-operations",
    title: "Bitwise Operations",
    icon: <Binary />,
    searchContent: "bitwise operations AND OR XOR NOT shift left right bit manipulation masks flags twos complement",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="Bitwise operators manipulate individual bits of integers. They are the foundation of low-level programming: cryptography, graphics, network protocols, and competitive programming tricks." highlight={highlight} />
        </p>

        

        <ComplexityTable
          title="Bitwise Operators"
          cols={["Operator", "Symbol", "Example (5=101, 3=011)", "Result"]}
          rows={[
            { o: "AND", s: "&", e: "101 & 011", r: "001 (1)" },
            { o: "OR", s: "|", e: "101 | 011", r: "111 (7)" },
            { o: "XOR", s: "^", e: "101 ^ 011", r: "110 (6)" },
            { o: "NOT", s: "~", e: "~101", r: "...010 (depends on width)" },
            { o: "Left Shift", s: "<<", e: "101 << 1", r: "1010 (10)" },
            { o: "Right Shift", s: ">>", e: "101 >> 1", r: "010 (2)" },
          ]}
        />

        <CodeTabs tabs={[
          {
            language: "C++",
            title: "Bit Manipulation Tricks",
            code: `// Check if a number is even/odd
bool isOdd = (n & 1);        // Last bit = 1 means odd

// Multiply/divide by powers of 2 (Much faster than * and /)
int x = 5 << 3;              // 5 * 8 = 40
int y = 40 >> 2;             // 40 / 4 = 10

// Swap two numbers without temp variable
a ^= b; b ^= a; a ^= b;     // XOR swap trick

// Check if power of 2
bool isPow2 = (n > 0) && ((n & (n - 1)) == 0);

// Turn off rightmost set bit
n = n & (n - 1);             // e.g., 12 (1100) → 8 (1000)

// Count set bits (Brian Kernighan's Algorithm)
int count = 0;
while (n) {
    n &= (n - 1);            // Removes one set bit per iteration
    count++;
}

// Bit masking (extract/set specific bits in an 8-bit register)
int flags = 0b10110100;
bool bit3 = (flags >> 3) & 1;  // Extract bit 3
flags |= (1 << 5);             // Set bit 5 to 1
flags &= ~(1 << 2);            // Clear bit 2 to 0
flags ^= (1 << 4);             // Toggle bit 4`
          },
          {
            language: "Java",
            title: "Bit Manipulation",
            code: `// Basic operations follow C++
int n = 5;
boolean isOdd = (n & 1) == 1;

// Bitwise shifts
int x = 5 << 3;  // 5 * 8 = 40
int y = 40 >> 2; // 40 / 4 = 10

// Unsigned right shift (Java specific)
int z = -1 >>> 1; // Fills with 0 regardless of sign

// Bit masking
int flags = 0b10110100;
boolean bit3 = ((flags >> 3) & 1) == 1;
flags |= (1 << 5);  // Set bit 5
flags &= ~(1 << 2); // Clear bit 2
flags ^= (1 << 4);  // Toggle bit 4`
            },
            {
              language: "Python",
              title: "Bit Manipulation",
              code: `n = 5
is_odd = (n & 1 == 1)

# Shifts
x = 5 << 3  # 5 * 8 = 40
y = 40 >> 2 # 40 / 4 = 10

# Python integers have arbitrary precision
# Bit manipulation works the same
flags = 0b10110100
bit3 = bool((flags >> 3) & 1)
flags |= (1 << 5)   # Set bit 5
flags &= ~(1 << 2)  # Clear bit 2
flags ^= (1 << 4)   # Toggle bit 4

# Binary representation
print(bin(flags)) # '0b11010000'`
            }
          ]} />

        <ProTip>
          <strong>Two's Complement:</strong> Negative numbers are stored by inverting all bits and adding 1. For example, -5 in 8-bit: <code>5 = 00000101 → invert → 11111010 → +1 → 11111011</code>. This allows the same hardware circuit to perform both addition and subtraction seamlessly.
        </ProTip>
      </div>
    )
  },
  {
    id: "structs-files",
    title: "Structures & File Handling",
    icon: <Database />,
    searchContent: "structures struct custom types file handling stream read write i/o unions typedef binary files serialization padding",
    render: (highlight) => (
      <div className="space-y-8">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Structures (Structs)</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Arrays store multiple items of the same type. Structs allow you to group multiple variables of DIFFERENT types under a single name. This is the precursor to Object-Oriented Programming." highlight={highlight} />
          </p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Structs, Unions & Typedef",
              code: `// Basic struct
struct Student {
    string name;
    int age;
    double gpa;
};

Student s = {"Alice", 20, 3.9};
cout << s.name;  // "Alice"

// Struct Padding & Alignment
struct PaddedData {
    char c;      // 1 byte
    int i;       // 4 bytes
}; // Total size = 8 bytes due to alignment

// Struct with methods
struct Point {
    double x, y;
    double distanceTo(Point other) {
        return sqrt(pow(x-other.x,2) + pow(y-other.y,2));
    }
};

// Union (shared memory)
union Data {
    int i;
    float f;
    char c;
};`
            },
            {
              language: "Java",
              title: "Records & Data Classes",
              code: `// Records (Java 14+) - Pure data container
public record Student(String name, int age, double gpa) {}

Student s = new Student("Alice", 20, 3.9);
System.out.println(s.name()); // "Alice"

// Simple Class (Traditional alternative)
class Point {
    double x, y;
    Point(double x, double y) { this.x = x; this.y = y; }
    double distanceTo(Point other) {
        return Math.sqrt(Math.pow(x-other.x, 2) + Math.pow(y-other.y, 2));
    }
}`
            },
            {
              language: "Python",
              title: "Dataclasses & Tuples",
              code: `from dataclasses import dataclass
from typing import NamedTuple

# 1. NamedTuple (Immutable)
class Student(NamedTuple):
    name: str
    age: int
    gpa: float

s = Student("Alice", 20, 3.9)

# 2. Dataclass (Modern Python 3.7+)
@dataclass
class Point:
    x: float
    y: float
    
    def distance_to(self, other):
        import math
        return math.sqrt((self.x-other.x)**2 + (self.y-other.y)**2)

p1 = Point(0, 0)
p2 = Point(3, 4)
print(p1.distance_to(p2)) # 5.0`
            }
          ]} />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">File Handling (I/O)</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Variables in RAM are volatile—they vanish when the program exits. To persist data, we use streams to write data directly to the hard drive. Understanding file modes (read, write, append, binary) is essential." highlight={highlight} />
          </p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "File I/O Complete",
              code: `#include <fstream>
#include <sstream>
using namespace std;

// Writing to file
ofstream outFile("data.txt");
if (outFile.is_open()) {
    outFile << "Line 1" << endl;
    outFile << "Line 2" << endl;
    outFile.close();
}

// Reading from file
ifstream inFile("data.txt");
string line;
while (getline(inFile, line)) {
    cout << line << endl;
}
inFile.close();

// Append mode
ofstream appendFile("data.txt", ios::app);
appendFile << "Appended line" << endl;

// Binary file I/O
struct Record { int id; char name[50]; double salary; };
Record r = {1, "Alice", 75000.0};

ofstream binOut("data.bin", ios::binary);
binOut.write(reinterpret_cast<char*>(&r), sizeof(Record));
binOut.close();

ifstream binIn("data.bin", ios::binary);
Record loaded;
binIn.read(reinterpret_cast<char*>(&loaded), sizeof(Record));
cout << loaded.name; // "Alice"`
            },
            {
              language: "Java",
              title: "File I/O with Try-Resources",
              code: `import java.io.*;
import java.nio.file.*;

// Modern Java: try-with-resources (auto-close)
try (BufferedWriter writer = Files.newBufferedWriter(
        Paths.get("data.txt"))) {
    writer.write("Line 1");
    writer.newLine();
    writer.write("Line 2");
} catch (IOException e) {
    e.printStackTrace();
}

// Reading all lines at once
List<String> lines = Files.readAllLines(
    Paths.get("data.txt"));

// Reading line by line (memory efficient for large files)
try (BufferedReader reader = Files.newBufferedReader(
        Paths.get("data.txt"))) {
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
}

// Serialization (save Java objects directly to file)
// Class must implement Serializable
ObjectOutputStream oos = new ObjectOutputStream(
    new FileOutputStream("obj.dat"));
oos.writeObject(myObject);
oos.close();`
            },
            {
              language: "Python",
              title: "Context Managers",
              code: `# 'with' statement handles file closing automatically
with open("data.txt", "w", encoding="utf-8") as f:
    f.write("Line 1\\n")
    f.write("Line 2\\n")

# Reading line by line
with open("data.txt", "r") as f:
    for line in f:
        print(line.strip())

# Reading all lines
with open("data.txt", "r") as f:
    content = f.read()

# JSON handling (Modern Serialization)
import json
data = {"id": 1, "name": "Alice"}
with open("data.json", "w") as f:
    json.dump(data, f) # Serialize`
            }
          ]} />
        </div>

        <ProTip>
          <strong>RAII (Resource Acquisition Is Initialization):</strong> In C++, wrapping file handles in objects that auto-close in their destructor prevents resource leaks. In Java, <code>try-with-resources</code> achieves the same. Never rely on manual <code>close()</code> calls alone.
        </ProTip>
      </div>
    )
  },
  {
    id: "error-handling",
    title: "Error Handling & Exceptions",
    icon: <ShieldCheck />,
    searchContent: "error handling exceptions try catch throw finally checked unchecked runtime exception custom exception error codes",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="Robust programs anticipate failure. Exception handling separates error-handling code from normal logic, making programs more readable, maintainable, and crash-resistant." highlight={highlight} />
        </p>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">The Exception Hierarchy</h3>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg font-mono text-sm text-slate-400">
            <pre>{`Throwable
├── Error (JVM-level, unrecoverable)
│   ├── StackOverflowError
│   ├── OutOfMemoryError
│   └── VirtualMachineError
└── Exception
    ├── Checked (must catch or declare)
    │   ├── IOException
    │   ├── SQLException
    │   └── FileNotFoundException
    └── RuntimeException (unchecked)
        ├── NullPointerException
        ├── ArrayIndexOutOfBoundsException
        ├── ArithmeticException
        └── ClassCastException`}</pre>
          </div>
        </div>

        <CodeTabs tabs={[
          {
            language: "C++",
            title: "Exception Handling",
            code: `#include <stdexcept>

// Throwing exceptions
double divide(double a, double b) {
    if (b == 0.0)
        throw std::invalid_argument("Division by zero!");
    return a / b;
}

// Catching exceptions
try {
    double result = divide(10, 0);
} catch (const std::invalid_argument& e) {
    cerr << "Error: " << e.what() << endl;
} catch (const std::exception& e) {
    cerr << "General error: " << e.what() << endl;
} catch (...) {
    cerr << "Unknown error occurred" << endl;
}

// Custom exception class
class InsufficientFundsError : public std::runtime_error {
public:
    double amount;
    InsufficientFundsError(double amt)
        : std::runtime_error("Insufficient funds"), amount(amt) {}
};

// noexcept specifier (promise no exceptions will be thrown)
int safeAdd(int a, int b) noexcept { return a + b; }`
          },
          {
            language: "Java",
            title: "Exception Handling",
            code: `// Try-catch-finally
try {
    int result = 10 / 0;
} catch (ArithmeticException e) {
    System.err.println("Math error: " + e.getMessage());
} catch (Exception e) {
    System.err.println("General: " + e.getMessage());
} finally {
    // ALWAYS executes (cleanup code)
    System.out.println("Cleanup complete");
}

// Checked exception (must declare in method signature)
public void readFile(String path) throws IOException {
    FileReader fr = new FileReader(path); // May throw
}

// Custom exception
class WithdrawalException extends Exception {
    private double amount;
    
    public WithdrawalException(double amount) {
        super("Cannot withdraw $" + amount);
        this.amount = amount;
    }
    
    public double getAmount() { return amount; }
}

// Multi-catch (Java 7+)
try {
    riskyOperation();
} catch (IOException | SQLException e) {
    logger.error("I/O or DB error", e);
}`
            },
            {
              language: "Python",
              title: "Try/Except/Finally",
              code: `try:
    result = 10 / 0
except ZeroDivisionError as e:
    print(f"Math error: {e}")
except Exception as e:
    print(f"General error: {e}")
else:
    # Runs ONLY if no exception occurred
    print("Success!")
finally:
    # ALWAYS runs
    print("Cleanup")

# Custom Exception
class WithdrawalError(Exception):
    def __init__(self, amount):
        self.amount = amount
        super().__init__(f"Cannot withdraw {amount}")

# Raising exceptions
if balance < 100:
    raise WithdrawalError(100)`
            }
          ]} />

        <WarningBlock>
          <strong>Never catch and ignore:</strong> Writing <code>catch (Exception e) {"{}"}</code> swallows errors silently, making bugs nearly impossible to diagnose. At minimum, log the exception. This is called "exception eating" and is considered one of the worst anti-patterns.
        </WarningBlock>

        <ProTip>
          The <strong>finally</strong> block in Java executes even if a <code>return</code> statement is in the <code>try</code> block. This makes it ideal for releasing resources like database connections, file handles, and network sockets.
        </ProTip>
      </div>
    )
  },
  {
    id: "preprocessor-macros",
    title: "Preprocessor & Memory Management",
    icon: <Zap />,
    searchContent: "preprocessor macros define include ifdef ifndef pragma memory management malloc calloc realloc free memory leak dangling pointer garbage collection",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="The C/C++ preprocessor runs BEFORE compilation, performing text substitutions. Understanding it is crucial for header guards, conditional compilation, and debugging. Memory management determines program reliability." highlight={highlight} />
        </p>

        <CodeTabs tabs={[
          {
            language: "C++",
            title: "Preprocessor Directives",
            code: `// Include guards
#ifndef MY_HEADER_H
#define MY_HEADER_H
#endif

// Macros
#define PI 3.14159
#define MAX(a, b) ((a) > (b) ? (a) : (b))

// Conditional compilation
#ifdef _WIN32
    #include <windows.h>
#endif

// Predefined macros
cout << __FILE__ << " : " << __LINE__;`
          },
          {
            language: "Java",
            title: "No Preprocessor (Java way)",
            code: `// No Preprocessor in Java. Uses imports & constants.

// Macros -> Use static final variables/methods
public static final double PI = 3.14159;
public static int max(int a, int b) { return Math.max(a, b); }

// Conditional Logic -> Use runtime checks or Build Tools
String os = System.getProperty("os.name").toLowerCase();
if (os.contains("win")) {
    // Windows specific logic
}

// Compiler hints -> Use Annotations
@Override
@Deprecated
@SuppressWarnings("unchecked")
public void myMethod() {}`
            },
            {
              language: "Python",
              title: "Pythonic Alternatives",
              code: `# 1. Constants (Convention)
DEBUG_MODE = True

# 2. Conditional Imports
import os
if os.name == 'nt':
    import msvcrt # Windows only
else:
    import termios # Unix only

# 3. Decorators (Compiler hints/behavior)
def log_call(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@log_call
def data_process():
    pass`
            }
          ]} />

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Manual Memory Management (C/C++)</h3>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Memory Management",
              code: `// C-style allocation
int* arr = (int*)malloc(10 * sizeof(int));
free(arr);

// C++ style
int* cppArr = new int[10];
delete[] cppArr;

// Memory Leak example
void leak() {
    int* p = new int[100];
    return; // p's address lost, memory not freed
}

// Dangling Pointer
int* p = new int(42);
delete p;
p = nullptr; // Reset to avoid dangling`
            },
            {
              language: "Java",
              title: "GC & Resource Management",
              code: `// No manual free() or delete
Object obj = new Object();
obj = null; // Eligible for Garbage Collection

// Encouraging GC (not guaranteed)
System.gc();

// Resource cleanup (files, sockets)
try (FileInputStream fis = new FileInputStream("test.txt")) {
    // Process file...
} // Automatically closed here (RAII equivalent)

// Weak References (optional caching)
WeakReference<byte[]> weak = new WeakReference<>(new byte[1024]);`
            },
            {
              language: "Python",
              title: "GC & Lifecycle",
              code: `import sys
import gc

# 1. Reference Counting
x = [1, 2, 3]
print(sys.getrefcount(x)) # Count of references

# 2. Garbage Collection
gc.collect() # Manually trigger GC

# 3. Object Lifecycle (__del__)
class Resource:
    def __del__(self):
        print("Closing resource...")

# 4. Weak References (prevents cycles)
import weakref
r = Resource()
w = weakref.ref(r)
print(w()) # Access object
del r
print(w()) # None (collected)`
            }
          ]} />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Garbage Collection (Java)</h3>
          <p className="text-slate-400 mb-4">
            Java's JVM automatically reclaims unreachable objects. The Garbage Collector uses algorithms like Mark-and-Sweep, Generational Collection, and G1GC to manage heap memory without manual intervention.
          </p>
          <ComplexityTable
            title="GC Algorithm Comparison"
            cols={["Algorithm", "Strategy", "Pause Time", "Throughput"]}
            rows={[
              { a: "Serial GC", s: "Single-threaded mark-sweep", p: "Long", t: "Low" },
              { a: "Parallel GC", s: "Multi-threaded young gen", p: "Medium", t: "High" },
              { a: "G1 GC", s: "Region-based, concurrent", p: "Predictable", t: "High" },
              { a: "ZGC", s: "Concurrent, low-latency", p: "< 10ms", t: "Very High" },
            ]}
          />
        </div>
      </div>
    )
  }
];