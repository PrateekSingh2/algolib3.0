import React from "react";
import {
  Terminal, GitCommit, Layers, AlignLeft, ListTree, Zap, Share2, Target,
  Database, Key, Server, MonitorPlay, Map, Binary, Repeat
} from "lucide-react";
import { HighlightText, ProTip, WarningBlock, ComplexityTable, CodeTabs, DocSection } from "@/components/docs/DocComponents";

export const DSA_SECTIONS: DocSection[] = [
  {
    id: "foundations",
    title: "Foundations & Array Math",
    icon: <Terminal />,
    searchContent: "introduction asymptotic notation big o algorithms characteristics array representation index address translation row column major space complexity amortized analysis",
    render: (highlight) => (
      <div className="space-y-12">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Algorithms & Asymptotic Notations</h3>
          
          <p className="text-slate-400 mb-4">
            <HighlightText text="To engineer scalable AI or server backends, we measure algorithmic efficiency independently of hardware. We evaluate how execution time scales as input size (N) grows toward infinity." highlight={highlight} />
          </p>
          <ul className="space-y-2 text-sm text-slate-400 font-mono bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-inner">
            <li><strong className="text-emerald-400">Big O (O):</strong> Upper bound. Worst-case scenario. Guarantee that runtime won't exceed this.</li>
            <li><strong className="text-amber-400">Omega (Ω):</strong> Lower bound. Best-case scenario.</li>
            <li><strong className="text-purple-400">Theta (Θ):</strong> Tight bound. Average case where upper and lower limits converge.</li>
          </ul>

          <ComplexityTable
            title="Common Time Complexities"
            cols={["Notation", "Name", "Example", "N=1M Operations"]}
            rows={[
              { n: "O(1)", na: "Constant", e: "Array access, Hash lookup", o: "1" },
              { n: "O(log N)", na: "Logarithmic", e: "Binary Search", o: "20" },
              { n: "O(N)", na: "Linear", e: "Linear Search, Single loop", o: "1,000,000" },
              { n: "O(N log N)", na: "Linearithmic", e: "Merge Sort, Heap Sort", o: "20,000,000" },
              { n: "O(N²)", na: "Quadratic", e: "Bubble Sort, Nested loops", o: "10¹²" },
              { n: "O(2^N)", na: "Exponential", e: "Recursive Fibonacci, Subsets", o: "10³⁰⁰⁰⁰⁰" },
              { n: "O(N!)", na: "Factorial", e: "Permutations, TSP brute force", o: "∞ (heat death)" },
            ]}
          />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Space Complexity</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Space complexity measures the total memory an algorithm uses relative to input size. It includes auxiliary space (extra memory beyond input) and input space. In-place algorithms use O(1) auxiliary space." highlight={highlight} />
          </p>
          <ProTip>
            <strong>Amortized Analysis:</strong> Some operations are expensive occasionally but cheap on average. Dynamic arrays (like <code>std::vector</code>) double in size when full—the resize is O(N), but averaged over N insertions, each insertion is O(1) amortized.
          </ProTip>
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Arrays & Address Translation</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Arrays store data contiguously. Physical RAM is a strictly one-dimensional ribbon. The compiler must mathematically translate a 2D matrix index (like A[i][j]) into a 1D memory address." highlight={highlight} />
          </p>
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-slate-900 p-5 rounded-xl border border-emerald-500/30 shadow-lg">
              <h4 className="font-bold text-slate-50 mb-3 text-emerald-400">Row-Major Order (C/C++, Java)</h4>
              <p className="text-xs text-emerald-400 bg-slate-950 p-2 rounded font-mono mb-3">Addr(A[i][j]) = Base + w * [ (i - L1)*N + (j - L2) ]</p>
              <ul className="text-xs text-slate-400 list-disc pl-4 space-y-1">
                <li><code>w</code>: Size of one element (e.g., 4 bytes for int)</li>
                <li><code>N</code>: Total number of columns</li>
                <li><code>L1, L2</code>: Lower bounds (usually index 0)</li>
              </ul>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-purple-500/30 shadow-lg">
              <h4 className="font-bold text-slate-50 mb-3 text-purple-400">Column-Major Order (Fortran)</h4>
              <p className="text-xs text-purple-400 bg-slate-950 p-2 rounded font-mono mb-3">Addr(A[i][j]) = Base + w * [ (j - L2)*M + (i - L1) ]</p>
              <ul className="text-xs text-slate-400 list-disc pl-4 space-y-1">
                <li><code>M</code>: Total number of rows</li>
                <li>Iterates column by column in memory.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "linked-lists",
    title: "Linked Lists (Complete Suite)",
    icon: <GitCommit />,
    searchContent: "linked list singly circular doubly polynomial insertion deletion traversal head tail",
    render: (highlight) => (
      <div className="space-y-12">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">The Linked List Family</h3>
          
          <p className="text-slate-400 mb-4">
            <HighlightText text="Unlike arrays, Linked Lists allocate memory dynamically at runtime. Nodes are scattered across the heap and connected via explicit pointers. This prevents fragmentation and resizing overhead, but sacrifices O(1) random access." highlight={highlight} />
          </p>
          <ComplexityTable
            title="Linked List Operational Complexities"
            cols={["Variant", "Insert Head", "Insert Tail", "Delete Head", "Delete Tail", "Search"]}
            rows={[
              { v: "Singly LL", ih: "O(1)", it: "O(N)", dh: "O(1)", dt: "O(N)", s: "O(N)" },
              { v: "Doubly LL", ih: "O(1)", it: "O(N)*", dh: "O(1)", dt: "O(N)*", s: "O(N)" },
              { v: "Circular Singly", ih: "O(N)*", it: "O(N)*", dh: "O(N)*", dt: "O(N)", s: "O(N)" },
              { v: "Circular Doubly", ih: "O(1)", it: "O(1)", dh: "O(1)", dt: "O(1)", s: "O(N)" },
            ]}
          />
          <p className="text-[10px] text-slate-500 italic mt-[-20px] mb-8">
            * Performance improves to O(1) if an explicit Tail pointer is tracked.
          </p>
        </div>

        <div>
          <h4 className="text-cyan-400 font-bold text-xl mb-2">1. Singly Linked List</h4>
          <p className="text-sm text-slate-400 mb-4">A standard, forward-only chain. Best for basic Stacks and Queues.</p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Singly LL (Procedural)",
              code: `struct Node {
    int data; 
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

// Insert at the beginning
void insertAtHead(Node*& head, int val) {
    Node* temp = new Node(val);
    temp->next = head;
    head = temp;
}

// Insert at the end
void insertAtTail(Node*& head, int val) {
    Node* temp = new Node(val);
    if (head == nullptr) {
        head = temp;
        return;
    }
    Node* curr = head;
    while (curr->next != nullptr) {
        curr = curr->next;
    }
    curr->next = temp;
}

// Delete a node at a specific position
void deleteAtPosition(Node*& head, int pos) {
    if (head == nullptr) return;
    if (pos == 1) { 
        Node* temp = head; 
        head = head->next; 
        delete temp; 
        return; 
    }
    Node* curr = head;
    for (int i = 1; i < pos - 1 && curr != nullptr; i++) {
        curr = curr->next;
    }
    if (curr == nullptr || curr->next == nullptr) return;
    
    Node* toDelete = curr->next;
    curr->next = curr->next->next;
    delete toDelete;
}

// Reverse a linked list (classic interview question)
void reverseList(Node*& head) {
    Node *prev = nullptr, *curr = head, *next = nullptr;
    while (curr != nullptr) {
        next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    head = prev;
}

// Find middle element
Node* findMiddle(Node* head) {
    Node *slow = head, *fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow; // Slow is at middle
}`
            },
            {
              language: "Java",
              title: "Singly LL (Procedural)",
              code: `class Node {
    int data; 
    Node next;
    Node(int d) { data = d; next = null; }
}

public class LinkedListUtils {
    public static Node insertAtHead(Node head, int val) {
        Node temp = new Node(val);
        temp.next = head;
        return temp;
    }

    public static Node insertAtTail(Node head, int val) {
        Node temp = new Node(val);
        if (head == null) return temp;
        Node curr = head;
        while (curr.next != null) {
            curr = curr.next;
        }
        curr.next = temp;
        return head;
    }

    // Merge two sorted lists
    public static Node mergeSorted(Node l1, Node l2) {
        Node dummy = new Node(0);
        Node curr = dummy;
        while (l1 != null && l2 != null) {
            if (l1.data <= l2.data) {
                curr.next = l1; 
                l1 = l1.next;
            } else {
                curr.next = l2; 
                l2 = l2.next;
            }
            curr = curr.next;
        }
        curr.next = (l1 != null) ? l1 : l2;
        return dummy.next;
    }
}`
            },
            {
              language: "Python",
              title: "Singly LL",
              code: `class Node:
    def __init__(self, val):
        self.data = val
        self.next = None

def insert_at_head(head, val):
    new_node = Node(val)
    new_node.next = head
    return new_node

def insert_at_tail(head, val):
    new_node = Node(val)
    if not head: return new_node
    curr = head
    while curr.next:
        curr = curr.next
    curr.next = new_node
    return head

def reverse_list(head):
    prev, curr = None, head
    while curr:
        next_node = curr.next
        curr.next = prev
        prev = curr
        curr = next_node
    return prev`
            }
          ]} />
        </div>

        <div>
          <h4 className="text-emerald-400 font-bold text-xl mb-2">2. Doubly Linked List</h4>
          <p className="text-sm text-slate-400 mb-4">Stores both <code>next</code> and <code>prev</code> pointers. Essential for browser histories, LRU caches, or music playlists.</p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Doubly LL",
              code: `struct DNode {
    int data; 
    DNode *next, *prev;
    DNode(int val) : data(val), next(nullptr), prev(nullptr) {}
};

void insertAtHead(DNode*& head, int val) {
    DNode* temp = new DNode(val);
    if (head != nullptr) {
        head->prev = temp;
    }
    temp->next = head;
    head = temp;
}

void insertAtTail(DNode*& head, int val) {
    DNode* temp = new DNode(val);
    if (head == nullptr) { 
        head = temp; 
        return; 
    }
    DNode* curr = head;
    while (curr->next != nullptr) {
        curr = curr->next;
    }
    curr->next = temp;
    temp->prev = curr;
}`
            },
            {
              language: "Java",
              title: "Doubly LL",
              code: `class DNode {
    int data;
    DNode next, prev;
    DNode(int d) { data = d; next = prev = null; }
}

public class DoublyLinkedList {
    public static DNode insertAtHead(DNode head, int val) {
        DNode temp = new DNode(val);
        if (head != null) {
            head.prev = temp;
        }
        temp.next = head;
        return temp;
    }

    public static void insertAtTail(DNode head, int val) {
        if (head == null) return;
        DNode temp = new DNode(val);
        DNode curr = head;
        while (curr.next != null) {
            curr = curr.next;
        }
        curr.next = temp;
        temp.prev = curr;
    }
}`
            },
            {
              language: "Python",
              title: "Doubly LL",
              code: `class DNode:
    def __init__(self, val):
        self.data = val
        self.next = None
        self.prev = None

def insert_at_head(head, val):
    new_node = DNode(val)
    if head:
        head.prev = new_node
    new_node.next = head
    return new_node

def insert_at_tail(head, val):
    if not head: return DNode(val)
    new_node = DNode(val)
    curr = head
    while curr.next:
        curr = curr.next
    curr.next = new_node
    new_node.prev = curr
    return head`
            }
          ]} />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4 border-t border-slate-800 pt-8 mt-8">Polynomial Manipulation</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Algebraic expressions like 5x³ + 2x¹ are mapped to a Linked List where nodes store (Coefficient, Exponent). To add them, we merge two sorted lists based on exponent powers." highlight={highlight} />
          </p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Polynomial Addition",
              code: `struct PolyNode {
    int coeff, exp; 
    PolyNode* next;
    PolyNode(int c, int e) : coeff(c), exp(e), next(nullptr) {}
};

PolyNode* addPolynomials(PolyNode* p1, PolyNode* p2) {
    PolyNode dummy(0, 0); 
    PolyNode* curr = &dummy;
    
    while (p1 != nullptr && p2 != nullptr) {
        if (p1->exp > p2->exp) {
            curr->next = new PolyNode(p1->coeff, p1->exp);
            p1 = p1->next;
        } else if (p1->exp < p2->exp) {
            curr->next = new PolyNode(p2->coeff, p2->exp);
            p2 = p2->next;
        } else {
            curr->next = new PolyNode(p1->coeff + p2->coeff, p1->exp);
            p1 = p1->next; 
            p2 = p2->next;
        }
        curr = curr->next;
    }
    while(p1 != nullptr) { 
        curr->next = new PolyNode(p1->coeff, p1->exp); 
        p1 = p1->next; 
        curr = curr->next; 
    }
    while(p2 != nullptr) { 
        curr->next = new PolyNode(p2->coeff, p2->exp); 
        p2 = p2->next; 
        curr = curr->next; 
    }
    return dummy.next;
}`
            },
            {
              language: "Java",
              title: "Polynomial Addition",
              code: `class PolyNode {
    int coeff, exp;
    PolyNode next;
    PolyNode(int c, int e) { coeff = c; exp = e; next = null; }
}

public class PolynomialUtils {
    public static PolyNode addPolynomials(PolyNode p1, PolyNode p2) {
        PolyNode dummy = new PolyNode(0, 0);
        PolyNode curr = dummy;
        
        while (p1 != null && p2 != null) {
            if (p1.exp > p2.exp) {
                curr.next = new PolyNode(p1.coeff, p1.exp);
                p1 = p1.next;
            } else if (p1.exp < p2.exp) {
                curr.next = new PolyNode(p2.coeff, p2.exp);
                p2 = p2.next;
            } else {
                curr.next = new PolyNode(p1.coeff + p2.coeff, p1.exp);
                p1 = p1.next;
                p2 = p2.next;
            }
            curr = curr.next;
        }
        while (p1 != null) {
            curr.next = new PolyNode(p1.coeff, p1.exp);
            p1 = p1.next;
            curr = curr.next;
        }
        while (p2 != null) {
            curr.next = new PolyNode(p2.coeff, p2.exp);
            p2 = p2.next;
            curr = curr.next;
        }
        return dummy.next;
    }
}`
            },
            {
              language: "Python",
              title: "Poly Addition",
              code: `class PolyNode:
    def __init__(self, c, e):
        self.coeff = c
        self.exp = e
        self.next = None

def add_polynomials(p1, p2):
    dummy = PolyNode(0, 0)
    curr = dummy
    while p1 and p2:
        if p1.exp > p2.exp:
            curr.next = PolyNode(p1.coeff, p1.exp)
            p1 = p1.next
        elif p1.exp < p2.exp:
            curr.next = PolyNode(p2.coeff, p2.exp)
            p2 = p2.next
        else:
            curr.next = PolyNode(p1.coeff + p2.coeff, p1.exp)
            p1, p2 = p1.next, p2.next
        curr = curr.next
    while p1:
        curr.next = PolyNode(p1.coeff, p1.exp)
        p1, curr = p1.next, curr.next
    while p2:
        curr.next = PolyNode(p2.coeff, p2.exp)
        p2, curr = p2.next, curr.next
    return dummy.next`
            }
          ]} />
        </div>
      </div>
    )
  },
  {
    id: "stacks-expressions",
    title: "Stacks & Expressions",
    icon: <Layers />,
    searchContent: "stacks LIFO operations infix postfix prefix conversion evaluation recursion call stack",
    render: (highlight) => (
      <div className="space-y-12">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Stacks (LIFO) Architectures</h3>
          
          <p className="text-slate-400 mb-4">
            <HighlightText text="Last-In-First-Out processing. Stacks are the backbone of program memory (the Call Stack), Depth-First Search, undo/redo systems, and syntax parsing in compilers." highlight={highlight} />
          </p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Stack (Struct Array Based)",
              code: `#define MAX 1000

struct Stack {
    int top; 
    int arr[MAX];
};

void initStack(Stack& s) {
    s.top = -1;
}

bool isEmpty(Stack& s) { 
    return s.top == -1; 
}

bool isFull(Stack& s) { 
    return s.top >= MAX - 1; 
}

bool push(Stack& s, int x) { 
    if(isFull(s)) return false;
    s.arr[++s.top] = x; 
    return true; 
}

int pop(Stack& s) { 
    if (isEmpty(s)) return -1;
    return s.arr[s.top--]; 
}

int peek(Stack& s) { 
    return isEmpty(s) ? -1 : s.arr[s.top]; 
}

int size(Stack& s) { 
    return s.top + 1; 
}`
            },
            {
              language: "Java",
              title: "Stack Applications",
              code: `// Balanced Parentheses Checker
public static boolean isBalanced(String expr) {
    Stack<Character> st = new Stack<>();
    for (char c : expr.toCharArray()) {
        if (c == '(' || c == '{' || c == '[') {
            st.push(c);
        } else if (c == ')' || c == '}' || c == ']') {
            if (st.isEmpty()) return false;
            char open = st.pop();
            if ((c == ')' && open != '(') ||
                (c == '}' && open != '{') ||
                (c == ']' && open != '['))
                return false;
        }
    }
    return st.isEmpty();
}

// Next Greater Element (Monotonic Stack)
public static int[] nextGreater(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Stack<Integer> st = new Stack<>();
    
    for (int i = n - 1; i >= 0; i--) {
        while (!st.isEmpty() && st.peek() <= arr[i])
            st.pop();
        result[i] = st.isEmpty() ? -1 : st.peek();
        st.push(arr[i]);
    }
    return result;
}`
            },
            {
              language: "Python",
              title: "Stack DS",
              code: `class Stack:
    def __init__(self, limit=1000):
        self.stack = []
        self.limit = limit
    
    def push(self, data):
        if len(self.stack) >= self.limit: return False
        self.stack.append(data)
        return True
    
    def pop(self):
        return self.stack.pop() if self.stack else -1
    
    def peek(self):
        return self.stack[-1] if self.stack else -1
    
    def is_empty(self):
        return len(self.stack) == 0`
            }
          ]} />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Infix to Postfix & Evaluation</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Machines evaluate expressions linearly. They convert human-readable Infix (A + B * C) into Postfix (A B C * +) using Dijkstra's Shunting Yard algorithm, eliminating parenthesis parsing." highlight={highlight} />
          </p>
          <CodeTabs tabs={[
            {
              language: "Java",
              title: "Shunting Yard Algorithm",
              code: `public static String infixToPostfix(String exp) {
    StringBuilder res = new StringBuilder();
    Stack<Character> st = new Stack<>();
    
    for (char c : exp.toCharArray()) {
        if (Character.isLetterOrDigit(c)) res.append(c);
        else if (c == '(') st.push(c);
        else if (c == ')') {
            while (!st.isEmpty() && st.peek() != '(') 
                res.append(st.pop());
            st.pop();
        } else {
            while (!st.isEmpty() && precedence(c) <= precedence(st.peek()))
                res.append(st.pop());
            st.push(c);
        }
    }
    while (!st.isEmpty()) res.append(st.pop());
    return res.toString();
}`
            },
            {
              language: "C++",
              title: "Infix to Postfix",
              code: `int precedence(char c) {
    if (c == '^') return 3;
    if (c == '*' || c == '/') return 2;
    if (c == '+' || c == '-') return 1;
    return -1;
}

string infixToPostfix(string s) {
    stack<char> st;
    string res;
    for (char c : s) {
        if (isalnum(c)) res += c;
        else if (c == '(') st.push('(');
        else if (c == ')') {
            while (st.top() != '(') {
                res += st.top(); st.pop();
            }
            st.pop();
        } else {
            while (!st.empty() && precedence(c) <= precedence(st.top())) {
                res += st.top(); st.pop();
            }
            st.push(c);
        }
    }
    while (!st.empty()) {
        res += st.top(); st.pop();
    }
    return res;
}`
            },
            {
              language: "Python",
              title: "Infix to Postfix",
              code: `def precedence(c):
    if c == '^': return 3
    if c in '*/': return 2
    if c in '+-': return 1
    return -1

def infix_to_postfix(exp):
    stack = []
    res = []
    for c in exp:
        if c.isalnum(): res.append(c)
        elif c == '(': stack.append(c)
        elif c == ')':
            while stack and stack[-1] != '(':
                res.append(stack.pop())
            stack.pop()
        else:
            while stack and precedence(c) <= precedence(stack[-1]):
                res.append(stack.pop())
            stack.append(c)
    while stack: res.append(stack.pop())
    return "".join(res)`
            }
          ]} />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Recursion Architecture</h3>
          <ProTip>
            <HighlightText text="Recursion leverages the OS Call Stack. Each recursive call pushes a new state frame (local variables, return address). Without a reachable Base Case, the stack outgrows its memory limit, triggering a Stack Overflow. Every recursive solution can be converted to iterative using an explicit stack." highlight={highlight} />
          </ProTip>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Tower of Hanoi",
              code: `void towerOfHanoi(int n, char from, char to, char aux) {
    if (n == 0) return; // Base case
    
    towerOfHanoi(n - 1, from, aux, to);
    cout << "Move disk " << n << ": " << from << " → " << to << endl;
    towerOfHanoi(n - 1, aux, to, from);
}
// towerOfHanoi(3, 'A', 'C', 'B');
// Total moves = 2^n - 1 = 7`
            },
            {
              language: "Java",
              title: "Tower of Hanoi",
              code: `public class RecursionUtils {
    public static void towerOfHanoi(int n, char from, char to, char aux) {
        if (n == 0) return;
        
        towerOfHanoi(n - 1, from, aux, to);
        System.out.println("Move disk " + n + ": " + from + " → " + to);
        towerOfHanoi(n - 1, aux, to, from);
    }
}`
            },
            {
              language: "Python",
              title: "Tower of Hanoi",
              code: `def tower_of_hanoi(n, src, dest, aux):
    if n == 0: return
    tower_of_hanoi(n - 1, src, aux, dest)
    print(f"Move disk {n}: {src} -> {dest}")
    tower_of_hanoi(n - 1, aux, dest, src)`
            }
          ]} />
        </div>
      </div>
    )
  },
  {
    id: "queues-priority",
    title: "Queues & Variations",
    icon: <AlignLeft />,
    searchContent: "queues FIFO dequeue priority queues circular applications job scheduling BFS",
    render: (highlight) => (
      <div className="space-y-12">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Queues (FIFO)</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="First-In-First-Out processing. Data enters at the Rear and exits at the Front. Crucial for asynchronous data transfer, BFS Graph traversal, printer spooling, and CPU job scheduling." highlight={highlight} />
          </p>
        </div>

        <div>
          <h4 className="text-emerald-400 font-bold text-xl mb-4">Circular Queue (Array)</h4>
          
          <p className="text-sm text-slate-400 mb-4">A standard linear array queue suffers from 'false full' conditions. Circular Queues solve this using modulo arithmetic: <code>(rear + 1) % size</code>.</p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Circular Queue",
              code: `struct CircularQueue {
    int front, rear, size; 
    int* arr;
};

void initQueue(CircularQueue& q, int s) {
    q.size = s;
    q.front = -1;
    q.rear = -1;
    q.arr = new int[s];
}

bool isEmpty(CircularQueue& q) { 
    return q.front == -1; 
}

bool isFull(CircularQueue& q) { 
    return (q.rear + 1) % q.size == q.front; 
}

void enqueue(CircularQueue& q, int val) {
    if (isFull(q)) return;
    if (isEmpty(q)) q.front = 0;
    q.rear = (q.rear + 1) % q.size;
    q.arr[q.rear] = val;
}

int dequeue(CircularQueue& q) {
    if (isEmpty(q)) return -1;
    int data = q.arr[q.front];
    if (q.front == q.rear) {
        q.front = -1;
        q.rear = -1;
    } else {
        q.front = (q.front + 1) % q.size;
    }
    return data;
}`
            },
            {
              language: "Java",
              title: "Circular Queue",
              code: `public class CircularQueue {
    int front, rear, size;
    int[] arr;

    public CircularQueue(int s) {
        size = s;
        front = rear = -1;
        arr = new int[s];
    }

    public boolean isFull() {
        return (rear + 1) % size == front;
    }

    public boolean isEmpty() {
        return front == -1;
    }

    public void enqueue(int val) {
        if (isFull()) return;
        if (isEmpty()) front = 0;
        rear = (rear + 1) % size;
        arr[rear] = val;
    }

    public int dequeue() {
        if (isEmpty()) return -1;
        int data = arr[front];
        if (front == rear) {
            front = rear = -1;
        } else {
            front = (front + 1) % size;
        }
        return data;
    }
}`
            },
            {
              language: "Python",
              title: "Circular Queue",
              code: `class CircularQueue:
    def __init__(self, size):
        self.size = size
        self.queue = [None] * size
        self.front = self.rear = -1
    
    def enqueue(self, data):
        if (self.rear + 1) % self.size == self.front: return False
        if self.front == -1: self.front = 0
        self.rear = (self.rear + 1) % self.size
        self.queue[self.rear] = data
        return True
    
    def dequeue(self):
        if self.front == -1: return -1
        data = self.queue[self.front]
        if self.front == self.rear: self.front = self.rear = -1
        else: self.front = (self.front + 1) % self.size
        return data`
            }
          ]} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h4 className="text-purple-400 font-bold text-lg mb-2">Deque (Double-Ended Queue)</h4>
            <p className="text-sm text-slate-400">
              <HighlightText text="Allows insertion and deletion at BOTH the Front and Rear. Used in sliding window problems, palindrome checking, and implementing both stacks and queues." highlight={highlight} />
            </p>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h4 className="text-amber-400 font-bold text-lg mb-2">Priority Queue</h4>
            <p className="text-sm text-slate-400">
              <HighlightText text="Dequeues elements based on assigned priority, not arrival time. Implemented using Binary Heaps for O(log N) insert/extract. Used in Dijkstra's, Huffman coding, and task schedulers." highlight={highlight} />
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "trees-advanced",
    title: "Trees, BST & AVL",
    icon: <ListTree />,
    searchContent: "trees binary search tree BST traversal inorder preorder postorder AVL rotations threaded balanced",
    render: (highlight) => (
      <div className="space-y-12">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Tree Traversals & BST</h3>
          
          <p className="text-slate-400 mb-4">
            <HighlightText text="A hierarchical data structure. Binary Search Trees (BST) organize data such that left children are strictly smaller, and right children are larger, halving search space per step for O(log N) average lookups." highlight={highlight} />
          </p>
          <ComplexityTable
            title="Tree Traversal Orders"
            cols={["Traversal", "Order", "Use Case"]}
            rows={[
              { t: "Inorder (LNR)", o: "Left → Node → Right", u: "Sorted output from BST" },
              { t: "Preorder (NLR)", o: "Node → Left → Right", u: "Copy/serialize tree" },
              { t: "Postorder (LRN)", o: "Left → Right → Node", u: "Delete tree, evaluate expressions" },
              { t: "Level Order", o: "BFS (queue-based)", u: "Print tree level by level" },
            ]}
          />
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "BST & Traversals (Procedural)",
              code: `struct TreeNode {
    int data; 
    TreeNode *left, *right;
    TreeNode(int val) : data(val), left(nullptr), right(nullptr) {}
};

TreeNode* insert(TreeNode* node, int val) {
    if (node == nullptr) return new TreeNode(val);
    if (val < node->data) {
        node->left = insert(node->left, val);
    } else if (val > node->data) {
        node->right = insert(node->right, val);
    }
    return node;
}

// Traversals
void inorder(TreeNode* n) {
    if (n != nullptr) { 
        inorder(n->left); 
        cout << n->data << " "; 
        inorder(n->right); 
    }
}

void preorder(TreeNode* n) {
    if (n != nullptr) { 
        cout << n->data << " "; 
        preorder(n->left); 
        preorder(n->right); 
    }
}

void postorder(TreeNode* n) {
    if (n != nullptr) { 
        postorder(n->left); 
        postorder(n->right); 
        cout << n->data << " "; 
    }
}

void levelOrder(TreeNode* root) {
    if (root == nullptr) return;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* curr = q.front(); 
        q.pop();
        cout << curr->data << " ";
        if (curr->left) q.push(curr->left);
        if (curr->right) q.push(curr->right);
    }
}

// Find min (leftmost node)
TreeNode* findMin(TreeNode* n) {
    while (n && n->left) n = n->left;
    return n;
}

// Delete node (3 cases)
TreeNode* deleteNode(TreeNode* root, int key) {
    if (root == nullptr) return nullptr;
    
    if (key < root->data) 
        root->left = deleteNode(root->left, key);
    else if (key > root->data) 
        root->right = deleteNode(root->right, key);
    else {
        // Case 1 & 2: 0 or 1 child
        if (root->left == nullptr) { 
            TreeNode* t = root->right; 
            delete root; 
            return t; 
        }
        if (root->right == nullptr) { 
            TreeNode* t = root->left; 
            delete root; 
            return t; 
        }
        // Case 3: 2 children → replace with inorder successor
        TreeNode* succ = findMin(root->right);
        root->data = succ->data;
        root->right = deleteNode(root->right, succ->data);
    }
    return root;
}`
            },
            {
              language: "Java",
              title: "BST & Traversals",
              code: `class TreeNode {
    int data;
    TreeNode left, right;
    TreeNode(int val) { data = val; left = right = null; }
}

public class BSTUtils {
    public static TreeNode insert(TreeNode root, int val) {
        if (root == null) return new TreeNode(val);
        if (val < root.data) root.left = insert(root.left, val);
        else if (val > root.data) root.right = insert(root.right, val);
        return root;
    }

    public static void inorder(TreeNode root) {
        if (root != null) {
            inorder(root.left);
            System.out.print(root.data + " ");
            inorder(root.right);
        }
    }

    public static void levelOrder(TreeNode root) {
        if (root == null) return;
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        while (!q.isEmpty()) {
            TreeNode curr = q.poll();
            System.out.print(curr.data + " ");
            if (curr.left != null) q.add(curr.left);
            if (curr.right != null) q.add(curr.right);
        }
    }

    public static TreeNode deleteNode(TreeNode root, int key) {
        if (root == null) return null;
        if (key < root.data) root.left = deleteNode(root.left, key);
        else if (key > root.data) root.right = deleteNode(root.right, key);
        else {
            if (root.left == null) return root.right;
            if (root.right == null) return root.left;
            TreeNode minNode = findMin(root.right);
            root.data = minNode.data;
            root.right = deleteNode(root.right, minNode.data);
        }
        return root;
    }

    private static TreeNode findMin(TreeNode n) {
        while (n.left != null) n = n.left;
        return n;
    }
}`
            },
            {
              language: "Python",
              title: "BST & Traversals",
              code: `class TreeNode:
    def __init__(self, val):
        self.data = val
        self.left = self.right = None

def insert(node, val):
    if not node: return TreeNode(val)
    if val < node.data:
        node.left = insert(node.left, val)
    elif val > node.data:
        node.right = insert(node.right, val)
    return node

def inorder(node):
    if node:
        inorder(node.left)
        print(node.data, end=" ")
        inorder(node.right)

def level_order(root):
    if not root: return
    queue = [root]
    while queue:
        curr = queue.pop(0)
        print(curr.data, end=" ")
        if curr.left: queue.append(curr.left)
        if curr.right: queue.append(curr.right)`
            }
          ]} />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">AVL Trees (Self-Balancing)</h3>
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
              <h4 className="font-bold text-slate-50 mb-2 text-purple-400">Height Balanced (AVL) Tree</h4>
              <p className="text-sm text-slate-400 mb-4">If data is inserted sequentially (1, 2, 3...), a BST degrades into a linear O(N) list. AVL Trees monitor the <strong>Balance Factor</strong> <code>(Height(Left) - Height(Right))</code>. If it exceeds 1 or drops below -1, it executes rotations to restore O(log N) equilibrium.</p>
              <ComplexityTable
                title="AVL Rotation Cases"
                cols={["Imbalance", "Rotation", "Trigger"]}
                rows={[
                  { i: "Left-Left (LL)", r: "Single Right Rotation", t: "BF > 1, inserted in left subtree's left" },
                  { i: "Right-Right (RR)", r: "Single Left Rotation", t: "BF < -1, inserted in right subtree's right" },
                  { i: "Left-Right (LR)", r: "Left then Right", t: "BF > 1, inserted in left subtree's right" },
                  { i: "Right-Left (RL)", r: "Right then Left", t: "BF < -1, inserted in right subtree's left" },
                ]}
              />
            </div>

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
              <h4 className="font-bold text-slate-50 mb-2 text-emerald-400">Threaded Binary Tree</h4>
              <p className="text-sm text-slate-400">In standard trees, leaf nodes have NULL pointers representing wasted space. Threaded trees replace these with "threads" pointing to the Inorder Predecessor or Successor, completely eliminating the need for stack-based recursive traversal.</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "heaps-sort",
    title: "Heaps & Heap Sort",
    icon: <Zap />,
    searchContent: "heaps binary heap max min operations heapify heap sort priority queue",
    render: (highlight) => (
      <div className="space-y-6">
        <h3 className="text-cyan-400 text-2xl font-bold mb-4">Binary Heaps</h3>
        
        <p className="text-slate-400 mb-4">
          <HighlightText text="A complete binary tree mapped efficiently to an array (no pointers needed). Parent at index i has children at 2i+1 and 2i+2. A Max-Heap guarantees the parent is strictly greater than its children. Crucial for Priority Queues and Heap Sort (O(N log N) guaranteed)." highlight={highlight} />
        </p>
        <CodeTabs tabs={[
          {
            language: "C++",
            title: "Heapify & Heap Sort",
            code: `void heapify(int arr[], int n, int i) {
    int largest = i;
    int l = 2 * i + 1, r = 2 * i + 2;
    if (l < n && arr[l] > arr[largest]) largest = l;
    if (r < n && arr[r] > arr[largest]) largest = r;
    if (largest != i) {
        swap(arr[i], arr[largest]);
        heapify(arr, n, largest);
    }
}

void heapSort(int arr[], int n) {
    // Build max heap
    for (int i = n / 2 - 1; i >= 0; i--) 
        heapify(arr, n, i);
    // Extract elements one by one
    for (int i = n - 1; i > 0; i--) {
        swap(arr[0], arr[i]);
        heapify(arr, i, 0);
    }
}`
          },
          {
            language: "Java",
            title: "Min-Heap with PriorityQueue",
            code: `// Java's PriorityQueue is a Min-Heap by default
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.add(5); minHeap.add(2); minHeap.add(8);
minHeap.peek();  // 2 (minimum)
minHeap.poll();  // Removes and returns 2

// Max-Heap using Comparator
PriorityQueue<Integer> maxHeap = 
    new PriorityQueue<>(Collections.reverseOrder());

// Custom objects with priority
PriorityQueue<int[]> pq = new PriorityQueue<>(
    (a, b) -> a[1] - b[1] // Sort by second element
);
pq.add(new int[]{1, 5});
pq.add(new int[]{2, 1});
pq.peek(); // {2, 1} (smallest priority)`
          },
          {
            language: "Python",
            title: "Heapify & Sort",
            code: `def heapify(arr, n, i):
    largest = i
    l, r = 2*i + 1, 2*i + 2
    if l < n and arr[l] > arr[largest]: largest = l
    if r < n and arr[r] > arr[largest]: largest = r
    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)

def heap_sort(arr):
    n = len(arr)
    # Build max heap
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    # Extract elements
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]
        heapify(arr, i, 0)`
          }
        ]} />
      </div>
    )
  },
  {
    id: "graphs-spanning",
    title: "Graphs & Spanning Trees",
    icon: <Share2 />,
    searchContent: "graphs adjacency matrix list BFS DFS spanning trees prims kruskal topological sort",
    render: (highlight) => (
      <div className="space-y-12">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Graph Foundations</h3>
          
          <p className="text-slate-400 mb-4">
            <HighlightText text="Graphs map complex relationships. Adjacency Matrix is a V×V grid (O(V²) space, O(1) edge check). Adjacency List uses arrays of vectors (O(V+E) space, efficient for sparse graphs like social networks)." highlight={highlight} />
          </p>
          <ComplexityTable
            title="Graph Representation Comparison"
            cols={["Operation", "Adjacency Matrix", "Adjacency List"]}
            rows={[
              { o: "Space", m: "O(V²)", l: "O(V + E)" },
              { o: "Add Edge", m: "O(1)", l: "O(1)" },
              { o: "Check Edge", m: "O(1)", l: "O(degree)" },
              { o: "Find Neighbors", m: "O(V)", l: "O(degree)" },
              { o: "Best For", m: "Dense graphs", l: "Sparse graphs" },
            ]}
          />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">BFS & DFS Traversals</h3>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "BFS & DFS (Procedural)",
              code: `// Adjacency list representation: vector<vector<int>> adj;

// BFS: Uses Queue → Level-by-level exploration
void BFS(int start, int V, vector<vector<int>>& adj) {
    vector<bool> visited(V, false); 
    queue<int> q;
    
    visited[start] = true; 
    q.push(start);
    
    while (!q.empty()) {
        int curr = q.front(); 
        q.pop();
        cout << curr << " ";
        
        for (int nb : adj[curr]) {
            if (!visited[nb]) { 
                visited[nb] = true; 
                q.push(nb); 
            }
        }
    }
}

// DFS: Uses Stack (or recursion) → Deep exploration
void DFSUtil(int v, vector<vector<int>>& adj, vector<bool>& visited) {
    visited[v] = true; 
    cout << v << " ";
    
    for (int nb : adj[v]) {
        if (!visited[nb]) {
            DFSUtil(nb, adj, visited);
        }
    }
}

void DFS(int start, int V, vector<vector<int>>& adj) {
    vector<bool> visited(V, false);
    DFSUtil(start, adj, visited);
}

// Topological Sort (DAG only)
void topologicalSort(int V, vector<vector<int>>& adj) {
    vector<int> inDegree(V, 0);
    for (int u = 0; u < V; u++) {
        for (int v : adj[u]) {
            inDegree[v]++;
        }
    }
    
    queue<int> q;
    for (int i = 0; i < V; i++) {
        if (inDegree[i] == 0) q.push(i);
    }
    
    while (!q.empty()) {
        int u = q.front(); 
        q.pop();
        cout << u << " ";
        for (int v : adj[u]) {
            if (--inDegree[v] == 0) q.push(v);
        }
    }
}`
            },
            {
              language: "Java",
              title: "BFS & DFS",
              code: `public class GraphUtils {
    public static void BFS(int start, List<List<Integer>> adj) {
        boolean[] visited = new boolean[adj.size()];
        Queue<Integer> q = new LinkedList<>();
        visited[start] = true;
        q.add(start);
        while (!q.isEmpty()) {
            int curr = q.poll();
            System.out.print(curr + " ");
            for (int nb : adj.get(curr)) {
                if (!visited[nb]) {
                    visited[nb] = true;
                    q.add(nb);
                }
            }
        }
    }

    public static void DFS(int start, List<List<Integer>> adj) {
        boolean[] visited = new boolean[adj.size()];
        DFSUtil(start, adj, visited);
    }

    private static void DFSUtil(int v, List<List<Integer>> adj, boolean[] visited) {
        visited[v] = true;
        System.out.print(v + " ");
        for (int nb : adj.get(v)) {
            if (!visited[nb]) DFSUtil(nb, adj, visited);
        }
    }
}`
            },
            {
              language: "Python",
              title: "BFS, DFS & Topo",
              code: `from collections import deque

def bfs(start, adj):
    visited = [False] * len(adj)
    queue = deque([start])
    visited[start] = True
    while queue:
        u = queue.popleft()
        print(u, end=" ")
        for v in adj[u]:
            if not visited[v]:
                visited[v] = True
                queue.append(v)

def dfs(u, adj, visited=None):
    if visited is None: visited = [False] * len(adj)
    visited[u] = True
    print(u, end=" ")
    for v in adj[u]:
        if not visited[v]: dfs(v, adj, visited)

def topo_sort(V, adj):
    in_degree = [0] * V
    for u in range(V):
        for v in adj[u]: in_degree[v] += 1
    queue = deque([i for i in range(V) if in_degree[i] == 0])
    res = []
    while queue:
        u = queue.popleft()
        res.append(u)
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0: queue.append(v)
    return res`
            }
          ]} />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Minimum Spanning Trees</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="A subgraph connecting all V vertices with V-1 edges and minimum total weight. Used in network routing, circuit design, and clustering." highlight={highlight} />
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h4 className="text-emerald-400 font-bold mb-2">Prim's Algorithm</h4>
              <p className="text-sm text-slate-400">Greedy, node-based. Starts at root, grows MST by adding cheapest adjacent edge. Uses priority queue. O(E log V).</p>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h4 className="text-purple-400 font-bold mb-2">Kruskal's Algorithm</h4>
              <p className="text-sm text-slate-400">Greedy, edge-based. Sort all edges, add cheapest if no cycle (Union-Find). O(E log E).</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "searching-sorting",
    title: "Searching & Sorting Engines",
    icon: <Target />,
    searchContent: "searching sorting linear binary bubble selection insertion quick merge radix counting sort divide conquer",
    render: (highlight) => (
      <div className="space-y-6">
        <ComplexityTable
          title="Sorting Algorithm Master Sheet"
          cols={["Algorithm", "Best", "Average", "Worst", "Space", "Stable"]}
          rows={[
            { n: "Bubble Sort", b: "O(N)", a: "O(N²)", w: "O(N²)", s: "O(1)", st: "✅" },
            { n: "Selection Sort", b: "O(N²)", a: "O(N²)", w: "O(N²)", s: "O(1)", st: "❌" },
            { n: "Insertion Sort", b: "O(N)", a: "O(N²)", w: "O(N²)", s: "O(1)", st: "✅" },
            { n: "Merge Sort", b: "O(N log N)", a: "O(N log N)", w: "O(N log N)", s: "O(N)", st: "✅" },
            { n: "Quick Sort", b: "O(N log N)", a: "O(N log N)", w: "O(N²)", s: "O(log N)", st: "❌" },
            { n: "Heap Sort", b: "O(N log N)", a: "O(N log N)", w: "O(N log N)", s: "O(1)", st: "❌" },
            { n: "Counting Sort", b: "O(N+K)", a: "O(N+K)", w: "O(N+K)", s: "O(K)", st: "✅" },
            { n: "Radix Sort", b: "O(NK)", a: "O(NK)", w: "O(NK)", s: "O(N+K)", st: "✅" },
          ]}
        />

        <CodeTabs tabs={[
          {
            language: "C++",
            title: "Quick Sort",
            code: `int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j <= high - 1; j++) {
        if (arr[j] < pivot) {
            i++; 
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return (i + 1);
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`
          },
          {
            language: "Java",
            title: "Merge Sort",
            code: `public static void mergeSort(int[] arr, int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}

public static void merge(int[] arr, int l, int m, int r) {
    int n1 = m - l + 1, n2 = r - m;
    int[] L = new int[n1], R = new int[n2];
    System.arraycopy(arr, l, L, 0, n1);
    System.arraycopy(arr, m+1, R, 0, n2);
    
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2)
        arr[k++] = (L[i] <= R[j]) ? L[i++] : R[j++];
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
}`
          },
          {
            language: "Python",
            title: "Quick & Merge Sort",
            code: `def quick_sort(arr):
    if len(arr) <= 1: return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

def merge_sort(arr):
    if len(arr) > 1:
        mid = len(arr) // 2
        L, R = arr[:mid], arr[mid:]
        merge_sort(L); merge_sort(R)
        i = j = k = 0
        while i < len(L) and j < len(R):
            if L[i] < R[j]: arr[k] = L[i]; i += 1
            else: arr[k] = R[j]; j += 1
            k += 1
        while i < len(L): arr[k] = L[i]; i += 1; k += 1
        while j < len(R): arr[k] = R[j]; j += 1; k += 1`
          }
        ]} />

        <ProTip>
          <strong>When to use which sort?</strong> Small N (&lt;50): Insertion Sort. General purpose: Quick Sort (fastest in practice). Stability needed: Merge Sort. Memory constrained: Heap Sort. Integer keys with known range: Counting/Radix Sort.
        </ProTip>
      </div>
    )
  },
  {
    id: "advanced-hashing",
    title: "Hashing & Hash Tables",
    icon: <Database />,
    searchContent: "hash tables collision resolution chaining open addressing load factor rehashing consistent hashing",
    render: (highlight) => (
      <div className="space-y-12">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4 flex items-center gap-2"><Key className="text-amber-400" /> Hash Tables & Collisions</h3>
          
          <p className="text-slate-400 mb-4">
            <HighlightText text="Hashing condenses massive data universes into a small, finite array index, targeting O(1) retrieval speed. When two keys hash to the same index, a Collision occurs." highlight={highlight} />
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
              <h4 className="font-bold text-slate-50 mb-2 text-cyan-400">Hash Functions</h4>
              <ul className="text-sm text-slate-400 list-disc pl-4 space-y-1">
                <li><strong>Division:</strong> <code>index = key % size</code></li>
                <li><strong>Mid Square:</strong> Square key, isolate middle digits</li>
                <li><strong>Folding:</strong> Segment key into pieces and sum</li>
                <li><strong>Multiplication:</strong> <code>floor(size * frac(key * A))</code></li>
              </ul>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
              <h4 className="font-bold text-slate-50 mb-2 text-emerald-400">Collision Resolution</h4>
              <ul className="text-sm text-slate-400 list-disc pl-4 space-y-1">
                <li><strong>Chaining:</strong> Each slot → Linked List of entries</li>
                <li><strong>Linear Probing:</strong> Check next slot (+1)</li>
                <li><strong>Quadratic Probing:</strong> Check +1, +4, +9...</li>
                <li><strong>Double Hashing:</strong> Use second hash function</li>
              </ul>
            </div>
          </div>
          <ProTip><strong>Load Factor (α):</strong> <code>α = N / Size</code>. If α exceeds 0.75, performance degrades dramatically. Rehash by doubling the table size and re-inserting all elements.</ProTip>

          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Hash Table using Array of Lists (Chaining)",
              code: `// Procedural representation using a vector of lists
int hashFunction(int key, int bucketCount) { 
    return (key % bucketCount); 
}

void insertKey(vector<list<int>>& table, int key) {
    int index = hashFunction(key, table.size());
    table[index].push_back(key);
}

bool searchKey(vector<list<int>>& table, int key) {
    int index = hashFunction(key, table.size());
    for (int x : table[index]) {
        if (x == key) return true;
    }
    return false;
}

void removeKey(vector<list<int>>& table, int key) {
    int index = hashFunction(key, table.size());
    table[index].remove(key);
}

// Usage:
// int BUCKETS = 10;
// vector<list<int>> hashTable(BUCKETS);
// insertKey(hashTable, 15);`
            },
            {
              language: "Java",
              title: "Hash Table (Chaining)",
              code: `public class HashTable {
    private List<Integer>[] table;
    private int bucketCount;

    public HashTable(int buckets) {
        this.bucketCount = buckets;
        table = new LinkedList[buckets];
        for (int i = 0; i < buckets; i++) table[i] = new LinkedList<>();
    }

    private int hashFunction(int key) {
        return key % bucketCount;
    }

    public void insert(int key) {
        table[hashFunction(key)].add(key);
    }

    public boolean search(int key) {
        return table[hashFunction(key)].contains(key);
    }

    public void remove(int key) {
        table[hashFunction(key)].remove((Integer)key);
    }
}`
            },
            {
              language: "Python",
              title: "Hash Table",
              code: `class HashTable:
    def __init__(self, size):
        self.size = size
        self.table = [[] for _ in range(size)]
    
    def _hash(self, key):
        return key % self.size
    
    def insert(self, key):
        self.table[self._hash(key)].append(key)
    
    def search(self, key):
        return key in self.table[self._hash(key)]
    
    def remove(self, key):
        bucket = self.table[self._hash(key)]
        if key in bucket: bucket.remove(key)`
            }
          ]} />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Advanced Tree Structures</h3>
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
              <h4 className="text-xl font-bold text-emerald-400 mb-2">Splay Trees</h4>
              <p className="text-sm text-slate-400">Self-adjusting BST. Recently accessed elements are rotated to the root, exploiting locality of reference for cache-friendly O(log N) amortized access.</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
              <h4 className="text-xl font-bold text-purple-400 mb-2">B-Trees (Disk-Optimized)</h4>
              <p className="text-sm text-slate-400">Extremely "fat" trees where each node fills an entire disk block (hundreds of keys). This collapses tree height to 2-3 levels, minimizing expensive disk I/O operations. Used by all major databases (MySQL, PostgreSQL).</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
              <h4 className="text-xl font-bold text-amber-400 mb-2">van Emde Boas Trees</h4>
              <p className="text-sm text-slate-400">O(log log U) operations on integer keys by recursively dividing the universe. Used in router IP table lookups and specialized integer sorting.</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "dynamic-programming",
    title: "Dynamic Programming",
    icon: <Map />,
    searchContent: "dynamic programming memoization tabulation optimal substructure overlapping subproblems fibonacci knapsack LCS longest common subsequence",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="Dynamic Programming (DP) solves complex problems by breaking them into overlapping subproblems, solving each once, and storing results. It transforms exponential brute force into polynomial time. Mastering DP is the single most important skill for competitive programming and technical interviews." highlight={highlight} />
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
            <h4 className="font-bold text-slate-50 mb-3 text-cyan-400">Top-Down (Memoization)</h4>
            <p className="text-sm text-slate-400">Start from the original problem, recurse down, and cache results. Natural recursive thinking. Uses a hash map or array to store computed values.</p>
          </div>
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
            <h4 className="font-bold text-slate-50 mb-3 text-emerald-400">Bottom-Up (Tabulation)</h4>
            <p className="text-sm text-slate-400">Start from the smallest subproblems, build up iteratively. More space-efficient, avoids recursion overhead. Uses a DP table (array).</p>
          </div>
        </div>

        <CodeTabs tabs={[
          {
            language: "C++",
            title: "Classic DP Problems",
            code: `// 1. Fibonacci (Memoization vs Tabulation)
// Naive: O(2^N) → DP: O(N)
int fib_memo(int n, vector<int>& dp) {
    if (n <= 1) return n;
    if (dp[n] != -1) return dp[n];
    return dp[n] = fib_memo(n-1, dp) + fib_memo(n-2, dp);
}

int fib_tab(int n) {
    if (n <= 1) return n;
    int prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1; prev1 = curr;
    }
    return prev1; // O(1) space!
}

// 2. 0/1 Knapsack
int knapsack(int W, int wt[], int val[], int n) {
    vector<vector<int>> dp(n+1, vector<int>(W+1, 0));
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            dp[i][w] = dp[i-1][w]; // Don't take item i
            if (wt[i-1] <= w) {
                dp[i][w] = max(dp[i][w], 
                    dp[i-1][w - wt[i-1]] + val[i-1]); // Take it
            }
        }
    }
    return dp[n][W];
}

// 3. Longest Common Subsequence (LCS)
int LCS(string& a, string& b) {
    int m = a.size(), n = b.size();
    vector<vector<int>> dp(m+1, vector<int>(n+1, 0));
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = (a[i-1] == b[j-1]) 
                ? dp[i-1][j-1] + 1 
                : max(dp[i-1][j], dp[i][j-1]);
    return dp[m][n];
}`
          },
          {
            language: "Java",
            title: "More DP Patterns",
            code: `// 4. Longest Increasing Subsequence (LIS) - O(N log N)
public static int LIS(int[] arr) {
    List<Integer> tails = new ArrayList<>();
    for (int x : arr) {
        int pos = Collections.binarySearch(tails, x);
        if (pos < 0) pos = -(pos + 1);
        if (pos == tails.size()) tails.add(x);
        else tails.set(pos, x);
    }
    return tails.size();
}

// 5. Coin Change (minimum coins)
public static int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
    dp[0] = 0;
    for (int coin : coins)
        for (int i = coin; i <= amount; i++)
            dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}

// 6. Edit Distance (Levenshtein)
public static int editDistance(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m+1][n+1];
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = (a.charAt(i-1) == b.charAt(j-1))
                ? dp[i-1][j-1]
                : 1 + Math.min(dp[i-1][j-1],
                      Math.min(dp[i-1][j], dp[i][j-1]));
    return dp[m][n];
}`
          },
          {
            language: "Python",
            title: "DP Patterns",
            code: `# 1. 0/1 Knapsack
def knapsack(W, wt, val, n):
    dp = [[0]*(W+1) for _ in range(n+1)]
    for i in range(1, n+1):
        for w in range(W+1):
            if wt[i-1] <= w:
                dp[i][w] = max(val[i-1] + dp[i-1][w-wt[i-1]], dp[i-1][w])
            else: dp[i][w] = dp[i-1][w]
    return dp[n][W]

# 2. LCS
def lcs(a, b):
    m, n = len(a), len(b)
    dp = [[0]*(n+1) for _ in range(m+1)]
    for i in range(1, m+1):
        for j in range(1, n+1):
            if a[i-1] == b[j-1]: dp[i][j] = dp[i-1][j-1]+1
            else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]`
          }
        ]} />

        <ProTip>
          <strong>DP Problem Recognition:</strong> If a problem asks for "minimum/maximum", "count the number of ways", or "is it possible", AND has <strong>optimal substructure</strong> (solution uses solutions of subproblems) and <strong>overlapping subproblems</strong> (same subproblem solved multiple times), it's likely DP.
        </ProTip>
      </div>
    )
  },
  {
    id: "greedy-backtracking",
    title: "Greedy & Backtracking",
    icon: <Repeat />,
    searchContent: "greedy algorithms activity selection huffman coding backtracking n-queens sudoku subset sum constraint satisfaction",
    render: (highlight) => (
      <div className="space-y-8">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Greedy Algorithms</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Greedy algorithms make the locally optimal choice at each step, hoping to find the global optimum. They don't always yield the best solution, but when they work (proven by the Greedy Choice Property), they're extremely efficient." highlight={highlight} />
          </p>

          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Activity Selection & Huffman",
              code: `// Activity Selection (maximize non-overlapping activities)
struct Activity { int start, end; };

int activitySelection(vector<Activity>& acts) {
    sort(acts.begin(), acts.end(), 
        [](auto& a, auto& b) { return a.end < b.end; });
    
    int count = 1, lastEnd = acts[0].end;
    for (int i = 1; i < acts.size(); i++) {
        if (acts[i].start >= lastEnd) {
            count++;
            lastEnd = acts[i].end;
        }
    }
    return count;
}

// Fractional Knapsack (can take fractions!)
double fractionalKnapsack(int W, vector<pair<int,int>>& items) {
    // Sort by value/weight ratio (descending)
    sort(items.begin(), items.end(), [](auto& a, auto& b) {
        return (double)a.first/a.second > (double)b.first/b.second;
    });
    
    double totalValue = 0;
    for (auto& [val, wt] : items) {
        if (W >= wt) {
            totalValue += val;
            W -= wt;
        } else {
            totalValue += val * ((double)W / wt);
            break;
        }
    }
    return totalValue;
}`
            },
            {
              language: "Java",
              title: "Greedy Algorithms",
              code: `public class GreedyUtils {
    public static int activitySelection(int[] start, int[] end) {
        int n = start.length;
        int[][] activities = new int[n][2];
        for (int i = 0; i < n; i++) activities[i] = new int[]{start[i], end[i]};
        
        Arrays.sort(activities, (a, b) -> a[1] - b[1]);
        
        int count = 1, lastEnd = activities[0][1];
        for (int i = 1; i < n; i++) {
            if (activities[i][0] >= lastEnd) {
                count++;
                lastEnd = activities[i][1];
            }
        }
        return count;
    }

    public static double fractionalKnapsack(int W, int[] val, int[] wt) {
        int n = val.length;
        Double[][] ratio = new Double[n][2];
        for (int i = 0; i < n; i++) ratio[i] = new Double[]{(double)val[i]/wt[i], (double)i};
        
        Arrays.sort(ratio, (a, b) -> Double.compare(b[0], a[0]));
        
        double totalValue = 0;
        for (int i = 0; i < n; i++) {
            int idx = ratio[i][1].intValue();
            if (W >= wt[idx]) {
                totalValue += val[idx];
                W -= wt[idx];
            } else {
                totalValue += val[idx] * ((double)W / wt[idx]);
                break;
            }
        }
        return totalValue;
    }
}`
            },
            {
              language: "Python",
              title: "Greedy Algos",
              code: `def activity_selection(start, end):
    acts = sorted(zip(start, end), key=lambda x: x[1])
    count, last_end = 1, acts[0][1]
    for i in range(1, len(acts)):
        if acts[i][0] >= last_end:
            count += 1; last_end = acts[i][1]
    return count

def fractional_knapsack(W, val, wt):
    items = sorted(zip(val, wt), key=lambda x: x[0]/x[1], reverse=True)
    total_val = 0.0
    for v, w in items:
        if W >= w: total_val += v; W -= w
        else: total_val += v * (W / w); break
    return total_val`
            }
          ]} />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Backtracking</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Backtracking builds candidates incrementally and abandons ('backtracks') a candidate as soon as it determines the candidate cannot lead to a valid solution. It's a systematic way to explore all possibilities with pruning." highlight={highlight} />
          </p>

          <CodeTabs tabs={[
            {
              language: "C++",
              title: "N-Queens & Subsets",
              code: `bool isSafe(vector<vector<int>>& board, int row, int col, int n) {
    for (int i = 0; i < col; i++) if (board[row][i]) return false;
    for (int i = row, j = col; i >= 0 && j >= 0; i--, j--) if (board[i][j]) return false;
    for (int i = row, j = col; i < n && j >= 0; i++, j--) if (board[i][j]) return false;
    return true;
}

bool solveNQueens(vector<vector<int>>& board, int col, int n) {
    if (col >= n) return true;
    for (int i = 0; i < n; i++) {
        if (isSafe(board, i, col, n)) {
            board[i][col] = 1;
            if (solveNQueens(board, col + 1, n)) return true;
            board[i][col] = 0; // Backtrack
        }
    }
    return false;
}

void findSubsets(vector<int>& nums, int idx, vector<int>& curr, vector<vector<int>>& res) {
    res.push_back(curr);
    for (int i = idx; i < (int)nums.size(); i++) {
        curr.push_back(nums[i]);
        findSubsets(nums, i + 1, curr, res);
        curr.pop_back(); // Backtrack
    }
}`
            },
            {
              language: "Java",
              title: "N-Queens & Subsets",
              code: `// N-Queens Problem
public class BacktrackingUtils {
    static boolean isSafe(int[][] board, int row, int col, int n) {
        for (int i = 0; i < col; i++)
            if (board[row][i] == 1) return false;
        for (int i = row, j = col; i >= 0 && j >= 0; i--, j--)
            if (board[i][j] == 1) return false;
        for (int i = row, j = col; i < n && j >= 0; i++, j--)
            if (board[i][j] == 1) return false;
        return true;
    }
    
    public static boolean solveNQueens(int[][] board, int col, int n) {
        if (col >= n) return true; // All queens placed!
        
        for (int i = 0; i < n; i++) {
            if (isSafe(board, i, col, n)) {
                board[i][col] = 1;           // Place queen
                if (solveNQueens(board, col + 1, n)) return true;
                board[i][col] = 0;           // BACKTRACK!
            }
        }
        return false;
    }

    // Generate All Subsets (Power Set)
    public static void subsets(int[] nums, int idx, List<Integer> curr,
                      List<List<Integer>> result) {
        result.add(new ArrayList<>(curr));
        for (int i = idx; i < nums.length; i++) {
            curr.add(nums[i]);           // Choose
            subsets(nums, i + 1, curr, result); // Explore
            curr.remove(curr.size()-1);  // Un-choose (backtrack)
        }
    }
}`
            },
            {
              language: "Python",
              title: "N-Queens & Subsets",
              code: `def is_safe(board, row, col, n):
    for i in range(col):
        if board[row][i] == 1: return False
    for i, j in zip(range(row, -1, -1), range(col, -1, -1)):
        if board[i][j] == 1: return False
    for i, j in zip(range(row, n), range(col, -1, -1)):
        if board[i][j] == 1: return False
    return True

def solve_n_queens(board, col, n):
    if col >= n: return True
    for i in range(n):
        if is_safe(board, i, col, n):
            board[i][col] = 1
            if solve_n_queens(board, col + 1, n): return True
            board[i][col] = 0
    return False

def get_subsets(nums):
    res = []
    def backtrack(start, curr):
        res.append(list(curr))
        for i in range(start, len(nums)):
            curr.append(nums[i])
            backtrack(i + 1, curr)
            curr.pop()
    backtrack(0, [])
    return res`
            }
          ]} />
        </div>

        <ComplexityTable
          title="Greedy vs DP vs Backtracking"
          cols={["Approach", "Strategy", "Guarantee", "Use When"]}
          rows={[
            { a: "Greedy", s: "Pick best local choice", g: "Not always optimal", u: "Greedy choice property proven" },
            { a: "Dynamic Programming", s: "Store & reuse subproblems", g: "Optimal (if applicable)", u: "Overlapping subproblems" },
            { a: "Backtracking", s: "Explore all + prune", g: "Finds all solutions", u: "Constraint satisfaction" },
          ]}
        />
      </div>
    )
  },
  {
    id: "trie-disjoint-set",
    title: "Tries & Union-Find",
    icon: <Binary />,
    searchContent: "trie prefix tree autocomplete dictionary disjoint set union find path compression rank connected components",
    render: (highlight) => (
      <div className="space-y-8">
        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Trie (Prefix Tree)</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="A tree-like structure where each node represents a character. Paths from root to marked nodes form stored words. Enables O(L) search/insert (L = word length) regardless of dictionary size. Powers autocomplete, spell-checkers, and IP routing." highlight={highlight} />
          </p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "Trie (Procedural)",
              code: `struct TrieNode {
    TrieNode* children[26];
    bool isEnd;
    TrieNode() : isEnd(false) {
        memset(children, 0, sizeof(children));
    }
};

void insertTrie(TrieNode* root, string word) {
    TrieNode* curr = root;
    for (char c : word) {
        int idx = c - 'a';
        if (!curr->children[idx]) {
            curr->children[idx] = new TrieNode();
        }
        curr = curr->children[idx];
    }
    curr->isEnd = true;
}

bool searchTrie(TrieNode* root, string word) {
    TrieNode* curr = root;
    for (char c : word) {
        int idx = c - 'a';
        if (!curr->children[idx]) return false;
        curr = curr->children[idx];
    }
    return curr->isEnd;
}

bool startsWith(TrieNode* root, string prefix) {
    TrieNode* curr = root;
    for (char c : prefix) {
        int idx = c - 'a';
        if (!curr->children[idx]) return false;
        curr = curr->children[idx];
    }
    return true; // Prefix exists
}`
            },
            {
              language: "Java",
              title: "Trie (Prefix Tree)",
              code: `class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEnd = false;
}

public class Trie {
    private TrieNode root = new TrieNode();

    public void insert(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) curr.children[idx] = new TrieNode();
            curr = curr.children[idx];
        }
        curr.isEnd = true;
    }

    public boolean search(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) return false;
            curr = curr.children[idx];
        }
        return curr.isEnd;
    }
}`
            },
            {
              language: "Python",
              title: "Trie (Prefix Tree)",
              code: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True

    def search(self, word):
        node = self.root
        for char in word:
            if char not in node.children: return False
            node = node.children[char]
        return node.is_end`
            }
          ]} />
        </div>

        <div>
          <h3 className="text-cyan-400 text-2xl font-bold mb-4">Disjoint Set Union (Union-Find)</h3>
          <p className="text-slate-400 mb-4">
            <HighlightText text="Tracks elements partitioned into disjoint sets. With Path Compression and Union by Rank, both find() and union() run in nearly O(1) amortized time (inverse Ackermann). Critical for Kruskal's MST, cycle detection, and connected components." highlight={highlight} />
          </p>
          <CodeTabs tabs={[
            {
              language: "C++",
              title: "DSU with Path Compression (Procedural)",
              code: `struct DSU {
    vector<int> parent;
    vector<int> rank;
};

void initDSU(DSU& dsu, int n) {
    dsu.parent.resize(n);
    dsu.rank.assign(n, 0);
    iota(dsu.parent.begin(), dsu.parent.end(), 0); // parent[i] = i
}

int findSet(DSU& dsu, int x) {
    if (dsu.parent[x] != x) {
        // Path compression
        dsu.parent[x] = findSet(dsu, dsu.parent[x]); 
    }
    return dsu.parent[x];
}

void uniteSets(DSU& dsu, int x, int y) {
    int px = findSet(dsu, x);
    int py = findSet(dsu, y);
    if (px == py) return;
    
    // Union by rank
    if (dsu.rank[px] < dsu.rank[py]) {
        swap(px, py);
    }
    dsu.parent[py] = px;
    if (dsu.rank[px] == dsu.rank[py]) {
        dsu.rank[px]++;
    }
}

bool areConnected(DSU& dsu, int x, int y) {
    return findSet(dsu, x) == findSet(dsu, y);
}

// Cycle detection in undirected graph usage
bool hasCycle(int V, vector<pair<int,int>>& edges) {
    DSU dsu;
    initDSU(dsu, V);
    for (auto& [u, v] : edges) {
        if (areConnected(dsu, u, v)) return true; // Cycle!
        uniteSets(dsu, u, v);
    }
    return false;
}`
            },
            {
              language: "Java",
              title: "DSU (Union-Find)",
              code: `public class DSU {
    int[] parent, rank;

    public DSU(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    public int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    public void union(int x, int y) {
        int rootX = find(x), rootY = find(y);
        if (rootX != rootY) {
            if (rank[rootX] < rank[rootY]) parent[rootX] = rootY;
            else if (rank[rootX] > rank[rootY]) parent[rootY] = rootX;
            else {
                parent[rootY] = rootX;
                rank[rootX]++;
            }
        }
    }
}`
            },
            {
              language: "Python",
              title: "DSU (Union-Find)",
              code: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        rootX, rootY = self.find(x), self.find(y)
        if rootX != rootY:
            if self.rank[rootX] < self.rank[rootY]:
                self.parent[rootX] = rootY
            elif self.rank[rootX] > self.rank[rootY]:
                self.parent[rootY] = rootX
            else:
                self.parent[rootY] = rootX
                self.rank[rootX] += 1`
            }
          ]} />
        </div>
      </div>
    )
  },
  {
    id: "shortest-paths",
    title: "Shortest Path Algorithms",
    icon: <Server />,
    searchContent: "shortest path dijkstra bellman ford floyd warshall negative weights single source all pairs weighted graph",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-slate-400">
          <HighlightText text="Finding the shortest path between vertices is one of the most fundamental problems in computer science. Different algorithms handle different graph types: non-negative weights, negative weights, or all-pairs queries." highlight={highlight} />
        </p>

        <ComplexityTable
          title="Shortest Path Algorithms Comparison"
          cols={["Algorithm", "Type", "Negative Weights", "Time", "Space"]}
          rows={[
            { a: "Dijkstra's", t: "Single-source", n: "❌ No", ti: "O(E log V)", s: "O(V)" },
            { a: "Bellman-Ford", t: "Single-source", n: "✅ Yes (detects cycles)", ti: "O(V·E)", s: "O(V)" },
            { a: "Floyd-Warshall", t: "All-pairs", n: "✅ Yes", ti: "O(V³)", s: "O(V²)" },
            { a: "A* Search", t: "Single-pair", n: "❌ No", ti: "O(E) best case", s: "O(V)" },
          ]}
        />

        <CodeTabs tabs={[
          {
            language: "C++",
            title: "Dijkstra's Algorithm",
            code: `vector<int> dijkstra(int src, int V, vector<vector<pair<int,int>>>& adj) {
    vector<int> dist(V, INT_MAX);
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;
    dist[src] = 0;
    pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}`
          },
          {
            language: "Java",
            title: "Dijkstra's Algorithm",
            code: `public class Dijkstra {
    public int[] dijkstra(int src, int V, List<List<int[]>> adj) {
        int[] dist = new int[V];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[src] = 0;
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        pq.add(new int[]{0, src});
        while (!pq.isEmpty()) {
            int[] top = pq.poll();
            int d = top[0], u = top[1];
            if (d > dist[u]) continue;
            for (int[] edge : adj.get(u)) {
                int v = edge[0], w = edge[1];
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    pq.add(new int[]{dist[v], v});
                }
            }
        }
        return dist;
    }
}`
          },
          {
            language: "Python",
            title: "Dijkstra's Algo",
            code: `import heapq

def dijkstra(src, V, adj):
    dist = [float('inf')] * V
    dist[src] = 0
    pq = [(0, src)] # (distance, node)
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        for v, w in adj[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))
    return dist`
          },
          {
            language: "Java",
            title: "Bellman-Ford & Floyd-Warshall",
            code: `public class ShortestPathUtils {
    public static int[] bellmanFord(int V, int[][] edges, int src) {
        int[] dist = new int[V];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[src] = 0;
        for (int i = 0; i < V - 1; i++) {
            for (int[] e : edges) {
                int u = e[0], v = e[1], w = e[2];
                if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v])
                    dist[v] = dist[u] + w;
            }
        }
        return dist;
    }

    public static void floydWarshall(int[][] dist, int V) {
        for (int k = 0; k < V; k++)
            for (int i = 0; i < V; i++)
                for (int j = 0; j < V; j++)
                    if (dist[i][k] != Integer.MAX_VALUE && dist[k][j] != Integer.MAX_VALUE)
                        dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
    }
}`
          },
          {
            language: "C++",
            title: "Bellman-Ford & Floyd-Warshall",
            code: `struct Edge { int u, v, w; };

vector<int> bellmanFord(int V, vector<Edge>& edges, int src) {
    vector<int> dist(V, INT_MAX);
    dist[src] = 0;
    for (int i = 0; i < V - 1; i++) {
        for (const auto& e : edges) {
            if (dist[e.u] != INT_MAX && dist[e.u] + e.w < dist[e.v])
                dist[e.v] = dist[e.u] + e.w;
        }
    }
    return dist;
}

void floydWarshall(vector<vector<int>>& dist, int V) {
    for (int k = 0; k < V; k++)
        for (int i = 0; i < V; i++)
            for (int j = 0; j < V; j++)
                if (dist[i][k] != INT_MAX && dist[k][j] != INT_MAX)
                    dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]);
}`
          },
          {
            language: "Python",
            title: "Bellman & Floyd",
            code: `def bellman_ford(V, edges, src):
    dist = [float('inf')] * V
    dist[src] = 0
    for _ in range(V-1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]: dist[v] = dist[u] + w
    return dist

def floyd_warshall(dist, V):
    for k in range(V):
        for i in range(V):
            for j in range(V):
                dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])`
          }
        ]} />

        <ProTip>
          <strong>Dijkstra's cannot handle negative weights</strong> because it assumes once a node is finalized, no shorter path exists. A negative edge could invalidate this. Use Bellman-Ford for graphs with negative edges, but beware: negative <em>cycles</em> make shortest paths undefined (infinitely negative).
        </ProTip>
      </div>
    )
  }
];

