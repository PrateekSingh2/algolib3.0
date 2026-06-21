import {
  Terminal, Swords, BookOpen, BrainCircuit,
  Binary, BarChart2, Network, FileCode2,
  Layers, GitMerge, ListTree, Bot, Globe, LayoutDashboard,
  ShieldAlert, Activity, FileSpreadsheet, UserCircle, Edit3, LifeBuoy, Users
} from "lucide-react";

export type DocCategory = "Getting Started" | "Visualizers" | "Compiler" | "Arena" | "Education" | "AI & Tools" | "Platform Ecosystem";

export interface DocContent {
  heading: string;
  text: string[];
  note?: string;
  warning?: string;
  badge?: string;
  tags?: string[];
}

export interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  category: DocCategory;
  content: DocContent[];
}

export const docData: DocSection[] = [
  // ─── GETTING STARTED ──────────────────────────────────────────────────────
  {
    id: "platform-overview",
    title: "Platform Overview",
    icon: BookOpen,
    description: "AlgoLib is an enterprise-grade interactive learning platform for mastering Data Structures & Algorithms through live visualization, competitive programming, and proctored assessments.",
    category: "Getting Started",
    content: [
      {
        heading: "What is AlgoLib?",
        text: [
          "AlgoLib is a full-stack web platform designed to bridge the gap between theoretical algorithm knowledge and practical, visual understanding. Every data structure and algorithm is presented as a live, interactive animation rather than a static diagram.",
          "The platform combines seven distinct DSA visualizers, a multi-language remote code execution engine, a competitive contest arena with live leaderboards, a proctored quiz system (QuizForge), and a curated algorithmic code library (SnippetViews).",
          "All features are accessible from any modern browser — no installations, no setup required."
        ],
        note: "AlgoLib is optimized for Chromium-based browsers (Chrome, Edge, Brave) for the best animation performance."
      },
      {
        heading: "Core Modules",
        text: [
          "DSA Visualizers — Interactive, animated visualizations for BST, AVL Trees, Graphs, Heaps, Linked Lists, Stacks, Queues, and Sorting Algorithms.",
          "Code Compiler — A sandboxed, multi-language execution engine supporting C++, C, Python, Java, and JavaScript (Node.js).",
          "Contest Arena — A competitive programming environment with time-limited problem sets, hidden test case evaluation, and live leaderboards.",
          "QuizForge — A proctored multiple-choice assessment platform with violation tracking and detailed analytics.",
          "SnippetViews — A curated library of high-quality reference implementations for common algorithms."
        ]
      },
      {
        heading: "Navigation",
        text: [
          "Use the top navigation bar to access all major platform features. The /visualizer route acts as a hub for all DSA tools.",
          "Press Ctrl+K or Cmd+K at any time on this page to open the global documentation search palette and jump to any topic instantly.",
          "Each visualizer is a fully self-contained interactive page — controls are always in the left panel, the visualization canvas in the right."
        ]
      }
    ]
  },

  // ─── BST VISUALIZER ───────────────────────────────────────────────────────
  {
    id: "bst-visualizer",
    title: "BST / AVL Tree Visualizer",
    icon: Binary,
    description: "An interactive Binary Search Tree and self-balancing AVL Tree visualizer with step-by-step execution traces and rotation animations.",
    category: "Visualizers",
    content: [
      {
        heading: "Overview",
        text: [
          "The BST Visualizer lets you insert, delete, and search for values in a Binary Search Tree while observing the resulting structural changes in real time. Toggle AVL mode to see the tree automatically rebalance itself after every mutation.",
          "A live code execution trace panel (HUD) displays the exact pseudocode line being executed alongside a plain-language explanation for each step."
        ]
      },
      {
        heading: "Supported Operations",
        text: [
          "INSERT — Adds a new node following BST ordering rules (left < root < right). In AVL mode, the tree performs height checks and rotations after insertion.",
          "DELETE — Removes a node using the standard three-case deletion algorithm: leaf node, one child, or two children (using in-order successor).",
          "SEARCH — Traverses the tree from the root, visually highlighting the comparison path until the target is found or confirmed absent.",
          "IN-ORDER TRAVERSAL — Visits all nodes in sorted ascending order (Left → Root → Right), outputting the sorted sequence to the log panel.",
          "PRE-ORDER / POST-ORDER — Additional traversal modes available for exploring tree recursion patterns.",
          "RANDOM — Generates a randomized set of values to instantly populate the tree for quick experimentation."
        ],
        note: "All operations are animated frame-by-frame. Use MANUAL step mode to advance through the execution one frame at a time."
      },
      {
        heading: "AVL Auto-Balancing",
        text: [
          "When AVL mode is active, the tree maintains a balance factor (height of left subtree minus height of right subtree) of {-1, 0, +1} at every node.",
          "If a violation is detected after an insertion or deletion, one of four rotation types is triggered automatically:",
          "Left-Left (LL) Case → Single Right Rotation. Right-Right (RR) Case → Single Left Rotation. Left-Right (LR) Case → Left Rotation followed by Right Rotation. Right-Left (RL) Case → Right Rotation followed by Left Rotation.",
          "Each rotation is animated and the balance factors are recalculated live."
        ]
      },
      {
        heading: "Step Engine Controls",
        text: [
          "AUTO mode plays the animation at ~1.3 second intervals. MANUAL mode pauses after each frame — use PREV and NEXT to walk through the execution at your own pace.",
          "The HUD (Heads-Up Display) at the bottom of the canvas shows the Execution Trace (active pseudocode line + explanation) and the Variable State (current pointer values like root, curr, parent).",
          "Toggle HUD visibility with the 'SHOW HUD / HIDE HUD' button above the canvas."
        ]
      }
    ]
  },

  // ─── SORTING VISUALIZER ───────────────────────────────────────────────────
  {
    id: "sorting-visualizer",
    title: "Sorting Visualizer",
    icon: BarChart2,
    description: "Real-time animated visualization of six fundamental sorting algorithms with configurable speed and array size.",
    category: "Visualizers",
    content: [
      {
        heading: "Supported Algorithms",
        text: [
          "Bubble Sort — Repeatedly compares adjacent elements and swaps them if they are in the wrong order. O(n²) time complexity.",
          "Selection Sort — Finds the minimum element from the unsorted portion and places it at the beginning. O(n²) time complexity.",
          "Insertion Sort — Builds the sorted array one element at a time by inserting each new element into its correct position. O(n²) worst case, O(n) best case.",
          "Merge Sort — A divide-and-conquer algorithm that recursively splits the array and merges sorted halves. O(n log n) guaranteed.",
          "Quick Sort — Uses a pivot to partition the array into smaller sub-arrays, then recursively sorts each. O(n log n) average, O(n²) worst case.",
          "Heap Sort — Builds a max-heap from the array and repeatedly extracts the maximum. O(n log n) guaranteed."
        ]
      },
      {
        heading: "Controls & Configuration",
        text: [
          "Array Size — Slider controls the number of elements (bars) from ~10 to ~200. Larger arrays make divide-and-conquer advantages more visible.",
          "Animation Speed — Adjust from slow (detailed observation) to fast (high-level pattern recognition).",
          "Generate New Array — Creates a fresh randomized array without starting the animation.",
          "Color Coding — Yellow bars indicate the active comparison; Red indicates a swap; Green indicates a sorted/final position."
        ],
        note: "Merge Sort and Quick Sort visualizations include sub-array boundary markers to help you track the divide-and-conquer recursion."
      }
    ]
  },

  // ─── GRAPH VISUALIZER ─────────────────────────────────────────────────────
  {
    id: "graph-visualizer",
    title: "Graph Algorithm Visualizer",
    icon: Network,
    description: "An interactive node-edge canvas for visualizing BFS, DFS, Dijkstra's, and A* pathfinding algorithms on custom or preloaded graphs.",
    category: "Visualizers",
    content: [
      {
        heading: "Overview",
        text: [
          "The Graph Visualizer provides a drag-and-drop canvas where you can build arbitrary weighted undirected graphs, then run one of four pathfinding algorithms and watch the traversal unfold frame-by-frame.",
          "The visualizer ships with a default 7-node weighted graph (A–G) to let you immediately run algorithms without setup."
        ]
      },
      {
        heading: "Interaction Toolkit",
        text: [
          "MOVE Mode — Click and drag any node to reposition it on the canvas. Edges automatically re-route.",
          "NODE Mode — Click any empty area on the canvas to spawn a new node. Node labels are assigned alphabetically (A, B, C, ...).",
          "LINK Mode — Click and drag from one node to another to create a weighted edge. Edge weights are randomly assigned (1–9) and can be changed."
        ]
      },
      {
        heading: "Supported Algorithms",
        text: [
          "BFS (Breadth-First Search) — Explores all neighbors of the current node before moving deeper. Uses a FIFO queue internally. Guarantees the shortest path in terms of number of edges.",
          "DFS (Depth-First Search) — Dives as deep as possible along each branch before backtracking. Uses a LIFO stack internally. Does not guarantee shortest path.",
          "Dijkstra's Algorithm — A greedy algorithm using a min-distance priority queue. Guarantees the shortest weighted path from source to target in graphs with non-negative edge weights.",
          "A* (A-Star) — Extends Dijkstra's with a Euclidean distance heuristic (h-score) to guide the search toward the target more efficiently. Finds the optimal path faster than Dijkstra's in most cases."
        ],
        note: "Select a Start Sector and Target Sector from the dropdowns in the Route Planner before running any algorithm. The found path is highlighted in gold upon completion."
      },
      {
        heading: "Engine Controls",
        text: [
          "AUTO mode — Automatically advances one frame every 1.2 seconds.",
          "MANUAL mode — Pauses between frames; use PREV/NEXT to step through execution.",
          "PAUSE/RESUME — Temporarily halts AUTO playback without resetting state.",
          "ABORT OPERATION — Immediately halts the animation and resets the visual state (nodes, edges, and path remain intact).",
          "FORMAT GRAPH — Clears all nodes and edges, resetting the canvas to a blank state."
        ]
      }
    ]
  },

  // ─── HEAP VISUALIZER ──────────────────────────────────────────────────────
  {
    id: "heap-visualizer",
    title: "Heap Visualizer",
    icon: ListTree,
    description: "Visualize Max-Heap and Min-Heap insertions and root extractions with dual array-and-tree rendering.",
    category: "Visualizers",
    content: [
      {
        heading: "Overview",
        text: [
          "The Heap Visualizer renders the heap simultaneously as both a tree (the intuitive structural view) and a flat array (the actual memory representation), helping you understand the 1-to-1 mapping between array indices and tree positions.",
          "Toggle between Max-Heap (root is always the largest value) and Min-Heap (root is always the smallest value) at any time."
        ]
      },
      {
        heading: "Operations",
        text: [
          "INSERT — Appends the new value to the end of the heap array (bottom of the tree), then performs Up-Heap (Bubble Up): repeatedly compares the inserted node with its parent and swaps if the heap property is violated, moving up until the root is reached or the property is restored.",
          "EXTRACT ROOT — Removes and returns the root (max or min value). The last element in the array replaces the root, then Down-Heap (Heapify Down) is performed: the root is compared with its children, and swapped with the more extreme child, recursively restoring the heap property."
        ],
        note: "The 'Memory Buffer' zone in the HUD displays the extracted value during EXTRACT ROOT, visually reinforcing that the value has been removed from the heap structure."
      },
      {
        heading: "Index Arithmetic",
        text: [
          "For any node at index i in the zero-indexed array: Parent is at ⌊(i-1)/2⌋. Left child is at 2i+1. Right child is at 2i+2.",
          "These relationships are shown live in the Variable State panel during execution — watch the index pointer navigate using these exact formulas."
        ]
      }
    ]
  },

  // ─── LINKED LIST VISUALIZER ───────────────────────────────────────────────
  {
    id: "linked-list-visualizer",
    title: "Linked List Visualizer",
    icon: GitMerge,
    description: "Interactive visualization for Singly, Doubly, Circular, and Doubly-Circular Linked Lists with pointer-level animation.",
    category: "Visualizers",
    content: [
      {
        heading: "List Types",
        text: [
          "Singly Linked List — Each node holds a value and a single 'next' pointer. Traversal is unidirectional (head → tail).",
          "Doubly Linked List — Each node holds 'next' and 'prev' pointers, enabling bidirectional traversal.",
          "Circular Linked List — The tail node's 'next' pointer wraps back to the head, forming a closed loop. Visualized with an animated arc.",
          "Doubly-Circular Linked List — Combines doubly-linking and circularity. The tail's 'next' points to head, and head's 'prev' points to tail. Insert/Delete at the end is O(1) due to the direct tail reference."
        ]
      },
      {
        heading: "Operations",
        text: [
          "Insert at Beginning (Head) — Creates a new node in the Spawn Zone, points its 'next' to the current head, then updates the HEAD pointer. O(1) time.",
          "Insert at End — For standard lists, traverses to the tail. For Doubly-Circular, uses the O(1) direct tail access via head.prev.",
          "Insert at Index — Deploys a scanner (ptr) pointer from the HEAD and traverses to position (index-1), then rewires next pointers to splice the new node in. O(N) time.",
          "Delete at Beginning — Advances the HEAD pointer to head.next and frees the old head node. O(1) time.",
          "Delete at End — For Doubly-Circular, uses O(1) direct tail access. For Singly, traverses to the second-to-last node. O(N) for singly, O(1) for doubly-circular.",
          "Delete at Index — Scanner traverses to position (index-1), then bypasses the target node by linking ptr.next = target.next. O(N) time."
        ]
      },
      {
        heading: "Pointer Animation",
        text: [
          "The cyan 'Scanner' indicator moves across the node row as the traversal pointer (ptr) walks the list, making pointer movement tangible.",
          "New nodes appear in the 'Spawn Zone' (Heap memory buffer) before being linked into the list, illustrating dynamic memory allocation.",
          "Nodes being deleted flash red and shrink out with an exit animation before being removed from the canvas."
        ]
      }
    ]
  },

  // ─── STACK VISUALIZER ─────────────────────────────────────────────────────
  {
    id: "stack-visualizer",
    title: "Stack Visualizer",
    icon: Layers,
    description: "LIFO data structure visualization with animated PUSH and POP operations and a live TOP pointer indicator.",
    category: "Visualizers",
    content: [
      {
        heading: "Overview",
        text: [
          "The Stack Visualizer renders the stack as a vertical container (pipe) with a strict maximum capacity of 6 elements. The TOP pointer, shown as an amber label, dynamically tracks the index of the most recently pushed element.",
          "Each element is color-coded to make individual blocks easy to track across PUSH and POP sequences."
        ]
      },
      {
        heading: "Operations",
        text: [
          "PUSH — Checks for overflow (stack.length >= MAX). Creates a new node in the Spawn Zone, increments the TOP pointer, then drops the node onto the stack with a spring animation. O(1) time.",
          "POP — Checks for underflow (stack is empty). Targets the TOP element, decrements the TOP pointer, ejects the block with a rotation animation, and returns its value. O(1) time.",
          "FORMAT MEMORY — Clears all elements from the stack instantly."
        ],
        note: "A red dashed line at the top of the container marks the MAX_CAPACITY (6). Attempting to PUSH when the stack is full is disabled."
      }
    ]
  },

  // ─── QUEUE VISUALIZER ─────────────────────────────────────────────────────
  {
    id: "queue-visualizer",
    title: "Queue Visualizer",
    icon: GitMerge,
    description: "FIFO data structure visualization with animated ENQUEUE and DEQUEUE operations and live FRONT/REAR pointer tracking.",
    category: "Visualizers",
    content: [
      {
        heading: "Overview",
        text: [
          "The Queue Visualizer renders a horizontal 'pipe' with a REAR (entry) endpoint on the right and a FRONT (exit) endpoint on the left. New elements enter from the REAR and are processed from the FRONT, visually enforcing the FIFO (First In, First Out) principle.",
          "Maximum capacity is 7 elements. FRONT and REAR pointer labels dynamically track their positions on the respective blocks."
        ]
      },
      {
        heading: "Operations",
        text: [
          "ENQUEUE — Checks for overflow. Creates a new node in the Spawn Zone, places it at queue[REAR], then increments the REAR pointer. The new block slides in from the right. O(1) time.",
          "DEQUEUE — Checks for underflow. Targets queue[FRONT], increments the FRONT pointer, and processes the block (shown with a success overlay). O(1) time.",
          "FORMAT QUEUE — Clears all elements and resets the output log."
        ]
      }
    ]
  },

  // ─── CODE COMPILER ────────────────────────────────────────────────────────
  {
    id: "code-compiler",
    title: "Code Compiler Engine",
    icon: Terminal,
    description: "A multi-language remote code execution environment with real-time output streaming, custom test cases, and execution telemetry.",
    category: "Compiler",
    content: [
      {
        heading: "Supported Languages",
        text: [
          "The execution engine supports five languages, each with pre-loaded starter templates:",
          "C++ (GCC) — Template includes standard headers (bits/stdc++.h) and a main() function with fast I/O (ios::sync_with_stdio(false), cin.tie(0)).",
          "C (GCC) — Template includes stdio.h with a standard main() and printf/scanf pattern.",
          "Python 3 — Clean script template with sys import for efficient stdin reading.",
          "Java (OpenJDK) — Template includes Main class with public static void main(String[] args) and BufferedReader for fast input.",
          "JavaScript (Node.js) — Template uses readline for line-by-line stdin consumption, compatible with competitive programming input formats."
        ],
        note: "Each language dropdown switch automatically loads the corresponding starter template, preserving your typed code in a per-language buffer."
      },
      {
        heading: "Editor Features",
        text: [
          "Monaco-based code editor with full syntax highlighting, bracket matching, and indentation support for all 5 languages.",
          "Language-aware autocompletion and inline error hints powered by Monaco's language server integration.",
          "Adjustable font size and editor theme (dark by default, matching the platform's aesthetic).",
          "Keyboard shortcut Ctrl+Enter / Cmd+Enter to trigger execution without reaching for the Run button."
        ]
      },
      {
        heading: "Execution & Output",
        text: [
          "Code is submitted to a sandboxed remote execution backend. Each run is containerized with strict CPU time and memory limits to prevent infinite loops or resource exhaustion.",
          "Standard Input (stdin) — Enter your custom test case input in the STDIN panel. The program will read from it exactly as if you typed it in a terminal.",
          "Standard Output (stdout) — The program's printed output appears in the OUTPUT panel in real time.",
          "Compilation Errors — If the code fails to compile, the full compiler error message (with line numbers and error codes) is displayed in the output panel with red highlighting.",
          "Runtime Errors — Segmentation faults, unhandled exceptions, or out-of-bounds errors are caught and reported with the specific error type and exit code."
        ]
      },
      {
        heading: "Execution Telemetry",
        text: [
          "After every successful run, the status bar displays: Execution Time (in milliseconds), Memory Usage (in KB), and the program's Exit Code.",
          "This telemetry helps you optimize your solution — compare execution times across language choices or algorithmic approaches on the same input."
        ]
      }
    ]
  },

  // ─── CONTEST ARENA ────────────────────────────────────────────────────────
  {
    id: "contest-arena",
    title: "Contest Arena",
    icon: Swords,
    description: "A competitive programming environment with time-limited problem sets, multi-case evaluation, and a live ranked leaderboard.",
    category: "Arena",
    content: [
      {
        heading: "Joining a Contest",
        text: [
          "Active and upcoming contests are listed on the /contests page. Click a contest card to view its details: start time, duration, number of problems, and difficulty distribution.",
          "Once inside an active contest, the full-screen Contest Panel opens with a problem list on the left, an integrated code editor in the center, and the leaderboard on the right.",
          "A countdown timer in the header shows the remaining contest time. Submissions after the deadline are not accepted."
        ]
      },
      {
        heading: "Problem Structure",
        text: [
          "Each problem includes: a Statement (task description), Constraints (input/output bounds), and Sample Test Cases (public input/output pairs for manual verification).",
          "Problems are tiered by difficulty: Easy, Medium, and Hard. Point values are assigned accordingly.",
          "All problems are solved using the integrated Compiler — no context switching required. Select your language from the dropdown and start coding."
        ]
      },
      {
        heading: "Submission & Evaluation",
        text: [
          "Click 'SUBMIT' to run your code against a full suite of hidden test cases on the backend. The result for each test case is one of: Accepted (AC), Wrong Answer (WA), Time Limit Exceeded (TLE), Memory Limit Exceeded (MLE), or Runtime Error (RE).",
          "A problem is considered 'Solved' only if all hidden test cases return AC. Partial credit is not awarded.",
          "You may submit as many times as you wish. Only your best submission counts toward the leaderboard score."
        ],
        note: "Time penalty is applied for incorrect submissions. Each WA submission on a problem that you later solve adds a fixed time penalty to your total score time."
      },
      {
        heading: "Leaderboard",
        text: [
          "The live leaderboard ranks participants by: total problems solved (descending), then by total time + penalties (ascending).",
          "Your rank and score update automatically after each Accepted submission — no page refresh needed.",
          "Contest results are finalized and archived after the contest ends, accessible from your profile page."
        ]
      }
    ]
  },

  // ─── QUIZFORGE ────────────────────────────────────────────────────────────
  {
    id: "quiz-forge",
    title: "QuizForge Assessments",
    icon: BrainCircuit,
    description: "A proctored multiple-choice assessment platform with violation detection, timed sessions, and detailed post-exam analytics.",
    category: "Education",
    content: [
      {
        heading: "Joining a Quiz",
        text: [
          "Quizzes are accessed via a 6-digit numeric join code shared by your instructor, or via a direct link.",
          "Before the quiz begins, you'll see a pre-flight checklist: confirm your identity, review the rules, and acknowledge that the session will be monitored for violations.",
          "Once you click 'Start Quiz', the timer begins and the proctoring engine activates. You cannot pause the timer."
        ]
      },
      {
        heading: "Question Types",
        text: [
          "Multiple Choice (Single Answer) — Select exactly one correct option from 4 choices.",
          "Multiple Choice (Multiple Answer) — Select all correct options. Partial credit may be configured by the quiz creator.",
          "Numerical Input — Type an exact numeric answer. Used for complexity analysis questions (e.g., 'What is the time complexity of Heap Sort? Enter the constant factor.')."
        ]
      },
      {
        heading: "Proctoring & Violation Detection",
        text: [
          "The proctoring engine tracks behavioral signals during the session:",
          "Tab Switch / Window Blur — Each time you navigate away from the quiz tab, a violation is logged. After a configurable threshold, the quiz may auto-submit.",
          "Copy-Paste Prevention — Keyboard shortcuts for copying (Ctrl+C, Ctrl+V) are intercepted and blocked within the quiz interface.",
          "Right-Click Disable — Context menus are suppressed to prevent image/text copying.",
          "All violations are timestamped and attached to your submission record, visible to the quiz creator in the analytics dashboard."
        ],
        warning: "Accumulating violations may result in automatic quiz submission before the timer expires."
      },
      {
        heading: "Results & Analytics",
        text: [
          "Immediately after submission, you receive a results card showing: Total Score, Percentage, Time Taken, and a per-question breakdown (your answer vs. correct answer).",
          "The analytics panel (visible to quiz creators) shows per-participant scores, time distributions, and a violation log for each session.",
          "Your completed quiz attempts are archived in your profile under 'Quiz History' for future reference."
        ]
      }
    ]
  },

  // ─── SNIPPET VIEWS ────────────────────────────────────────────────────────
  {
    id: "snippet-views",
    title: "SnippetViews Library",
    icon: FileCode2,
    description: "A curated, searchable library of high-quality algorithmic reference implementations with Markdown explanations.",
    category: "Education",
    content: [
      {
        heading: "Overview",
        text: [
          "SnippetViews is a read-only code library containing reference implementations for common algorithms and data structures. Each snippet is paired with a detailed Markdown explanation covering: the algorithm's purpose, time/space complexity, and step-by-step logic.",
          "Snippets are available in multiple languages — primarily Java, C++, and Python — making it easy to compare idiomatic implementations across languages."
        ]
      },
      {
        heading: "Browsing & Searching",
        text: [
          "Snippets are browsable via category (Sorting, Trees, Graphs, Dynamic Programming, etc.) and filterable by language.",
          "The search bar performs a full-text search across snippet titles, tags, and description content.",
          "Click any snippet card to open the full-screen SnippetView, which includes: the syntax-highlighted code, the Markdown explanation rendered beside it, and a Copy button for one-click clipboard access."
        ]
      },
      {
        heading: "Content Quality",
        text: [
          "All snippets are verified for correctness against standard test cases before being published.",
          "Implementations prioritize clarity and correctness over micro-optimization, making them ideal as learning references rather than contest-submission templates.",
          "Community-submitted snippets go through a moderation review before appearing in the public library."
        ],
        note: "SnippetViews are read-only. To experiment with a snippet, copy it to the Code Compiler and run it with your own test inputs."
      }
    ]
  },

  // ─── VECTORIS AI ──────────────────────────────────────────────────────────
  {
    id: "vectoris-ai",
    title: "Vectoris AI",
    icon: Bot,
    description: "An advanced, context-aware AI assistant designed specifically for analyzing, optimizing, and explaining Data Structures & Algorithms.",
    category: "AI & Tools",
    content: [
      {
        heading: "Intelligent AI Companion",
        text: [
          "Vectoris is a state-of-the-art AI assistant seamlessly integrated into the AlgoLib ecosystem. Leveraging advanced large language models (LLMs) tuned for competitive programming and theoretical computer science, it provides high-fidelity, conversational debugging and learning support.",
          "Vectoris maintains persistent conversational memory. It understands the nuances of algorithmic paradigms such as Dynamic Programming, Graph Traversal, and Divide-and-Conquer, allowing you to ask follow-up questions without losing context.",
          "Mathematical precision is built-in: Vectoris utilizes full Markdown and KaTeX support to flawlessly render complex equations, recurrence relations, and Big-O notation directly in the chat interface."
        ]
      },
      {
        heading: "Execution Matrix (Dynamic Complexity Analysis)",
        text: [
          "Unlike standard chatbots that only provide textual answers, Vectoris actively parses and evaluates your submitted code snippets using an internal AST (Abstract Syntax Tree) analyzer to deduce Big-O characteristics.",
          "The Execution Matrix is an interactive, graphical interface that dynamically plots the exact Time and Space Complexity of your code.",
          "It maps the algorithm against common growth bounds—such as O(1) Constant, O(log N) Logarithmic, O(N) Linear, O(N²) Quadratic, O(2^N) Exponential, and O(N!) Factorial.",
          "A live Recharts-powered graph visualizes the projected operation count across increasing input sizes (N), offering an immediate visual understanding of how well the algorithm scales in real-world scenarios."
        ],
        badge: "Core Feature"
      },
      {
        heading: "Automated Code Optimization & Translation",
        text: [
          "Vectoris acts as an automated refactoring engine. For every analyzed snippet, context-aware action buttons allow you to instantly transform your code.",
          "Optimize Code: Vectoris will rewrite your snippet to aggressively improve its time and space complexity. The refactored code is presented alongside a detailed, line-by-line explanation of the specific optimizations applied (e.g., trading nested loops for HashMaps, memoizing recursive calls).",
          "One-Click Translation: Seamlessly port your logic across languages. Vectoris can convert your code between C++, Python, Java, JavaScript, and C, carefully preserving the algorithmic integrity, variable naming conventions, and language-specific idiomatic patterns."
        ]
      }
    ]
  },

  // ─── SNIPPET VISUALIZER ───────────────────────────────────────────────────
  {
    id: "snippet-visualizer",
    title: "Snippet Visualizer",
    icon: Activity,
    description: "A robust engine for safely executing and stepping through complex custom C/C++ algorithms with visual memory traces.",
    category: "AI & Tools",
    content: [
      {
        heading: "Dynamic Island Execution Engine",
        text: [
          "The Snippet Visualizer redefines the debugging experience by moving away from static log files to a real-time, animated HUD (Heads-Up Display) styled as a 'Dynamic Island'.",
          "As your custom C/C++ code is compiled and executed, the Dynamic Island tracks the precise state of the execution pipeline—displaying compilation phases, standard output streams, process exits, and error boundaries instantaneously.",
          "To guarantee platform stability, all user-submitted code is isolated and executed within a heavily sandboxed, cross-origin iframe environment. This architectural choice actively prevents runaway infinite loops, aggressive memory leaks, or malicious payloads from freezing the parent React application."
        ]
      },
      {
        heading: "Advanced Input Injection System",
        text: [
          "Traditional web-based compilers often struggle with synchronous I/O operations (like C's scanf() or C++'s cin). The Snippet Visualizer solves this through a custom Input Injection mechanism.",
          "You can supply multi-line standard input (stdin) via a dedicated UI panel. When the execution begins, the engine hooks into the isolated C/C++ runtime context and safely injects the input buffer.",
          "This guarantees flawless, non-blocking execution of scanning functions, allowing you to seamlessly test complex graph adjacency lists, matrix inputs, or multi-case competitive programming queries."
        ]
      }
    ]
  },

  // ─── CONTENT DISCOVERY SITE ───────────────────────────────────────────────
  {
    id: "content-discovery",
    title: "Content & Research Ecosystem",
    icon: Globe,
    description: "The official AlgoLib portal for reading cutting-edge algorithmic research, tech news, and system design articles.",
    category: "Platform Ecosystem",
    content: [
      {
        heading: "Next.js Architecture & Overview",
        text: [
          "The Content Site operates as an independent, high-performance web application built on the Next.js App Router. It serves as the dedicated knowledge and media hub for the AlgoLib ecosystem.",
          "It aggregates premium content ranging from in-depth system design breakdowns, to competitive programming tutorials, to published academic research papers in the field of theoretical computer science."
        ]
      },
      {
        heading: "Dynamic Feed & Smart Filtering",
        text: [
          "The core interface features a highly optimized Infinite Scroll Feed that loads articles dynamically as you navigate, minimizing initial load times and bandwidth consumption.",
          "Content is rigorously categorized. Users can instantly filter the feed using precise tags such as 'Artificial Intelligence', 'Data Structures', 'System Architecture', and 'Competitive Programming', ensuring that you only see the content relevant to your learning path."
        ]
      },
      {
        heading: "Integrated Academic PDF Reader",
        text: [
          "Algorithmic research relies heavily on complex mathematical notation, proofs, and vector graphs that standard HTML often fails to render accurately.",
          "To solve this, the Content Site includes a native, mobile-optimized PDF reading engine. This allows you to directly consume complex academic papers and technical whitepapers within the browser.",
          "The viewer is fully responsive, ensuring that multi-column layouts and intricate diagrams remain perfectly legible whether you are on a 4K desktop monitor or a mobile device."
        ]
      }
    ]
  },

  // ─── INFRASTRUCTURE STATUS ────────────────────────────────────────────────
  {
    id: "infrastructure-status",
    title: "Platform Infrastructure & Status",
    icon: ShieldAlert,
    description: "Real-time monitoring and incident tracking for the AlgoLib platform ecosystem.",
    category: "Platform Ecosystem",
    content: [
      {
        heading: "Real-Time Uptime Monitoring",
        text: [
          "AlgoLib is powered by a complex network of microservices, including the multi-language compilation engine, real-time Supabase databases, and authentication handlers. The Infrastructure Status dashboard provides 24/7 transparency into the health of these systems.",
          "The dashboard monitors critical API endpoints and backend services, updating in real-time to alert you of any latency spikes, partial outages, or scheduled maintenance windows."
        ]
      },
      {
        heading: "Historical Metrics & Seamless Integration",
        text: [
          "In addition to live status, the dashboard provides a comprehensive 90-day historical log of uptime metrics, offering absolute transparency regarding platform reliability (e.g., maintaining 99.9% uptime).",
          "If an incident occurs, detailed post-mortem reports are published, outlining the root cause and the engineering steps taken to resolve the degradation.",
          "The entire status interface is embedded natively into the main UI using an optimized iframe approach. This unified design ensures you can verify system health instantly without ever leaving the AlgoLib environment."
        ],
        note: "In the event of a compilation engine timeout, check the Status Dashboard first to rule out any ongoing backend infrastructure maintenance."
      }
    ]
  },

  // ─── DSA SHEETS ───────────────────────────────────────────────────────────
  {
    id: "dsa-sheets",
    title: "DSA Problem Sheets",
    icon: FileSpreadsheet,
    description: "Curated, structured pathways and problem lists designed to guide you from algorithmic fundamentals to advanced mastery.",
    category: "Education",
    content: [
      {
        heading: "Overview & Curation Strategy",
        text: [
          "AlgoLib's DSA Sheets are meticulously curated, structured pathways designed to guide users from algorithmic fundamentals to advanced competitive programming mastery. Unlike scattered problem sets, these sheets aggregate high-yield questions—such as the classic SDE Sheet, Blind 75, and Grind 169—into a unified tracking interface.",
          "The sheets eliminate decision fatigue by presenting a linear progression curve, ensuring that learners build prerequisite knowledge before tackling complex topics like Dynamic Programming on Trees or Advanced Graph Algorithms.",
          "Each problem is mapped directly to our integrated Compiler Engine, allowing you to seamlessly transition from reading the problem statement to writing code without context switching."
        ]
      },
      {
        heading: "Progress Tracking & Analytics",
        text: [
          "The core power of the DSA Sheets lies in their persistent progress tracking architecture. As you solve problems, your success is logged in the Supabase backend, instantly updating your visual progress bars and completion percentages.",
          "The interface provides granular filtering capabilities: you can isolate unsolved problems, filter by specific data structures (e.g., Heaps, Tries), or target problems by difficulty tier.",
          "Historical telemetry tracks not just completion, but the number of attempts and time taken, allowing the platform to highlight areas where you might need revision."
        ],
        badge: "Tracker Engine"
      },
      {
        heading: "Revision Reminders & Spaced Repetition",
        text: [
          "To combat the forgetting curve, the DSA Sheets incorporate intelligent revision markers. Users can bookmark specific, high-complexity problems for later review.",
          "The system categorizes these bookmarked problems in a dedicated 'Revision List', encouraging a spaced repetition learning model that is crucial for retaining esoteric algorithmic techniques prior to technical interviews."
        ]
      }
    ]
  },

  // ─── DIGITAL NOTES & WORKSPACE ────────────────────────────────────────────
  {
    id: "digital-notes",
    title: "Digital Notes Workspace",
    icon: Edit3,
    description: "A secure, cloud-synced Markdown engineering notebook for documenting proofs, code snippets, and algorithmic patterns.",
    category: "Education",
    content: [
      {
        heading: "Rich-Text Engineering Notebook",
        text: [
          "The integrated Notes module acts as your personal engineering notebook. Recognizing that mastering algorithms requires more than just writing code—it requires synthesizing patterns and writing down proofs—AlgoLib offers a full-featured markdown editor baked directly into the platform.",
          "You can draft technical explanations, outline dynamic programming state transitions, or save snippets of brilliant solutions.",
          "The editor fully supports robust syntax highlighting, making it trivial to embed complex code blocks directly into your notes alongside your theoretical explanations."
        ]
      },
      {
        heading: "Cross-Platform Synchronization",
        text: [
          "Your notes are automatically synced to the cloud via secure, encrypted backend handlers.",
          "This ensures that an insight jotted down on your mobile device during a commute is instantly available when you sit down at your desktop to code.",
          "The robust cloud synchronization means you never have to worry about local data loss, and your algorithmic knowledge base grows securely alongside your programming skills."
        ]
      },
      {
        heading: "Contextual Tagging & Searchability",
        text: [
          "To manage a growing repository of notes, the system implements a powerful tagging and categorization mechanism.",
          "You can tag notes with specific algorithmic paradigms (e.g., 'Sliding Window', 'Topological Sort') or attach them directly to specific problems from the DSA Sheets.",
          "A blazing-fast, client-side search indexing system allows you to retrieve any note instantly by querying keywords, ensuring that your hard-earned insights are always just a keystroke away when confronting a similar problem."
        ]
      }
    ]
  },

  // ─── USER PROFILE & ANALYTICS ─────────────────────────────────────────────
  {
    id: "user-profile",
    title: "User Profile & Analytics",
    icon: UserCircle,
    description: "Your centralized algorithmic identity, featuring detailed performance heatmaps, submission archives, and global reputation tracking.",
    category: "Platform Ecosystem",
    content: [
      {
        heading: "Centralized Identity & Reputation",
        text: [
          "The User Profile is the centralized hub of your AlgoLib identity. It aggregates your activity across all platform modules—from Visualizers and Compiler submissions to QuizForge assessments and Contest Arena rankings.",
          "Your profile displays a comprehensive reputation dashboard, showcasing your global rank, total problems solved, and current coding streak.",
          "This gamified approach transforms the arduous process of learning data structures into a rewarding, habit-forming journey."
        ]
      },
      {
        heading: "Detailed Telemetry & Performance Heatmaps",
        text: [
          "Beyond basic vanity metrics, the profile provides deep, actionable analytics. A GitHub-style contribution heatmap visualizes your daily coding consistency over the past year.",
          "Detailed charts break down your problem-solving accuracy, visualizing your ratio of Accepted (AC) to Wrong Answer (WA) submissions.",
          "Furthermore, it analyzes your language preferences (e.g., 70% C++, 30% Python) and highlights your strongest and weakest algorithmic topics based on your historical performance, allowing you to strategically target your weaknesses."
        ],
        badge: "Deep Analytics"
      },
      {
        heading: "Archived Submissions & Quiz History",
        text: [
          "The profile serves as a permanent archive of your intellectual growth. Every code submission is saved, allowing you to revisit an old O(N²) solution and refactor it into an O(N log N) masterpiece as your skills improve.",
          "Similarly, all QuizForge attempts are preserved with detailed post-mortem reports. You can review exactly which questions you missed on past assessments, ensuring that foundational gaps in your theoretical knowledge are permanently closed."
        ]
      }
    ]
  },

  // ─── COMMUNITY & COLLABORATION ────────────────────────────────────────────
  {
    id: "community-collaboration",
    title: "Community & Collaboration",
    icon: Users,
    description: "Engage with a global network of engineers through real-time leaderboards, snippet sharing, and peer-to-peer discussion forums.",
    category: "Platform Ecosystem",
    content: [
      {
        heading: "Global Leaderboards & Competitive Spirit",
        text: [
          "AlgoLib is built on the philosophy that learning in isolation is inefficient. The Community module integrates global, real-time leaderboards that rank users based on their contest performance, total solved problems, and active streaks.",
          "This competitive ecosystem motivates users to push their boundaries, optimizing their code to shave off milliseconds of execution time just to climb a few ranks higher.",
          "Weekly and monthly leaderboards reset periodically, giving new users a fair chance to claim the top spots."
        ]
      },
      {
        heading: "Knowledge Sharing & Snippet Contributions",
        text: [
          "The community thrives on shared knowledge. Users have the ability to publish their most elegant or highly-optimized solutions to the public SnippetViews library.",
          "Once moderated, these community-contributed snippets become part of the platform's collective intelligence, annotated with the author's handle.",
          "This encourages a culture of writing clean, well-documented code that others can learn from, transforming users from mere consumers of knowledge into active educators."
        ]
      },
      {
        heading: "Discussion Forums & Peer Support",
        text: [
          "Integrated discussion threads are attached to every problem in the Arena and DSA Sheets. If you are stuck on a particularly devious edge case, you can access the community forums to request hints, discuss time complexity tradeoffs, or debate the merits of a recursive versus iterative approach.",
          "Strict moderation ensures the forums remain focused on educational hints rather than outright solution sharing, preserving the integrity of the learning process."
        ]
      }
    ]
  },

  // ─── TECHNICAL SUPPORT & HELPDESK ─────────────────────────────────────────
  {
    id: "technical-support",
    title: "Technical Support & Helpdesk",
    icon: LifeBuoy,
    description: "Comprehensive documentation, bug reporting tools, and direct engineering channels to ensure a frictionless platform experience.",
    category: "Platform Ecosystem",
    content: [
      {
        heading: "Comprehensive Documentation & Tutorials",
        text: [
          "The first line of defense for any technical or algorithmic issue is the expansive, searchable documentation hub (which you are currently reading).",
          "Engineered for speed, the Cmd+K quick search palette instantly indexes hundreds of topics, tutorials, and visualizer guides.",
          "Whether you forgot how to trigger an AVL rotation or need the boilerplate code for reading large arrays in Java, the documentation provides instant, reliable answers without requiring you to leave the IDE."
        ]
      },
      {
        heading: "Ticketing System & Bug Reporting",
        text: [
          "If you encounter a platform bug, a compiler anomaly, or a discrepancy in a test case, the integrated Support Helpdesk allows you to file a detailed technical ticket.",
          "The ticketing interface automatically captures your current environment context—including browser version, active route, and recent error logs—streamlining the debugging process for the engineering team.",
          "This frictionless reporting loop ensures that the platform remains highly stable and responsive to user feedback."
        ]
      },
      {
        heading: "Direct Developer Channels & Roadmap",
        text: [
          "For critical issues or enterprise-tier accounts, AlgoLib provides direct channels to the core engineering team. Support requests are routed through dedicated backend queues, ensuring rapid response times.",
          "Additionally, the platform maintains a public changelog and roadmap, keeping the user base fully informed about upcoming features, newly added visualizers, and recent bug fixes.",
          "This fosters a transparent and trust-based relationship between the developers and the community."
        ]
      }
    ]
  }
];

export const getSectionsByCategory = (): Record<string, DocSection[]> => {
  const grouped: Record<string, DocSection[]> = {};
  docData.forEach(section => {
    if (!grouped[section.category]) {
      grouped[section.category] = [];
    }
    grouped[section.category].push(section);
  });
  return grouped;
};

export const searchDocs = (query: string): Array<{ section: DocSection; heading: string; headingId: string }> => {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: Array<{ section: DocSection; heading: string; headingId: string }> = [];

  docData.forEach(section => {
    if (section.title.toLowerCase().includes(q) || section.description.toLowerCase().includes(q)) {
      results.push({ section, heading: section.title, headingId: section.id });
    }
    section.content.forEach((block, i) => {
      const headingId = `${section.id}-heading-${i}`;
      if (
        block.heading.toLowerCase().includes(q) ||
        block.text.some(t => t.toLowerCase().includes(q))
      ) {
        results.push({ section, heading: block.heading, headingId });
      }
    });
  });

  return results.slice(0, 12);
};
