import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { 
  BookOpen, Search, Code2, Hash, ChevronRight, Terminal, 
  Cpu, Layers, Network, GitCommit, Copy, Check,
  Play, Sliders, AlertTriangle, Database, Zap, Globe, Server, ArrowRight
} from "lucide-react";
import Navbar from "@/components/Navbar";

// --- 1. REUSABLE BACKGROUND COMPONENTS ---
const CyberSpaceBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const PARTICLE_COUNT = width < 768 ? 40 : 80;
    const CONNECT_DISTANCE = 140;
    const MOUSE_DISTANCE = 250;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      type: "square" | "plus" | "cross";

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2 + 1;
        const r = Math.random();
        if (r > 0.9) this.type = "plus";
        else if (r > 0.8) this.type = "cross";
        else this.type = "square";
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = "rgba(0, 245, 255, 0.15)";
        ctx.strokeStyle = "rgba(0, 245, 255, 0.15)";
        ctx.lineWidth = 1;

        if (this.type === "square") {
          ctx.fillRect(this.x, this.y, this.size, this.size);
        } else if (this.type === "plus") {
          ctx.beginPath();
          ctx.moveTo(this.x - 3, this.y);
          ctx.lineTo(this.x + 3, this.y);
          ctx.moveTo(this.x, this.y - 3);
          ctx.lineTo(this.x, this.y + 3);
          ctx.stroke();
        } else if (this.type === "cross") {
          ctx.beginPath();
          ctx.moveTo(this.x - 2, this.y - 2);
          ctx.lineTo(this.x + 2, this.y + 2);
          ctx.moveTo(this.x + 2, this.y - 2);
          ctx.lineTo(this.x - 2, this.y + 2);
          ctx.stroke();
        }
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p, index) => {
        p.update();
        p.draw();
        const dxMouse = mouseX - p.x;
        const dyMouse = mouseY - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < MOUSE_DISTANCE) {
           ctx.beginPath();
           ctx.strokeStyle = `rgba(59, 130, 246, ${1 - distMouse / MOUSE_DISTANCE})`;
           ctx.lineWidth = 1;
           ctx.moveTo(p.x, p.y);
           ctx.lineTo(mouseX, mouseY);
           ctx.stroke();
        }
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DISTANCE) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 100, 255, ${0.1 * (1 - dist / CONNECT_DISTANCE)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    };
    animate();
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-[#020205]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#0a0a2e_0%,_#020205_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:50px_50px] opacity-20 transform perspective-500 rotate-x-12 scale-110 pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};

// --- 2. CODE BLOCK COMPONENT ---
const CodeBlock = ({ code, language = "cpp" }: { code: string, language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mt-6 mb-8 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a1a] shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase">{language}</span>
        </div>
        <button 
          onClick={handleCopy}
          className="text-gray-500 hover:text-[#00f5ff] transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="p-4 text-xs md:text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// --- 3. DOCUMENTATION DATA ---
const DOC_SECTIONS = [
  {
    id: "intro",
    title: "System Overview",
    icon: <Terminal className="w-5 h-5" />,
    searchContent: "AlgoLib high-performance algorithmic visualization engine real-time simulation hardware-accelerated rendering pipeline physics based transitions React core Framer Motion",
    content: (
      <>
        <p className="mb-6 text-lg">
          <strong className="text-[#00f5ff]">AlgoLib</strong> is a comprehensive algorithmic visualization suite designed to bridge the gap between abstract theory and visual understanding.
        </p>
        <p className="mb-4">
          Built for students and engineers, the platform simulates the execution flow of Data Structures and Algorithms (DSA) in real-time. By mapping memory operations to visual transitions, AlgoLib allows users to "see" the code execute line-by-line.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
           <div className="p-4 rounded border border-white/10 bg-white/5 hover:border-[#00f5ff]/30 transition-colors">
              <Zap className="text-[#00f5ff] mb-2" size={20}/>
              <h3 className="font-bold text-sm mb-1">Real-Time</h3>
              <p className="text-xs text-gray-400">Hardware-accelerated animations running at 60fps.</p>
           </div>
           <div className="p-4 rounded border border-white/10 bg-white/5 hover:border-[#00f5ff]/30 transition-colors">
              <Code2 className="text-[#9d00ff] mb-2" size={20}/>
              <h3 className="font-bold text-sm mb-1">Interactive</h3>
              <p className="text-xs text-gray-400">Modify inputs and control execution flow dynamically.</p>
           </div>
           <div className="p-4 rounded border border-white/10 bg-white/5 hover:border-[#00f5ff]/30 transition-colors">
              <BookOpen className="text-[#00ff88] mb-2" size={20}/>
              <h3 className="font-bold text-sm mb-1">Educational</h3>
              <p className="text-xs text-gray-400">Step-by-step explanations and complexity analysis.</p>
           </div>
        </div>
      </>
    )
  },
  {
    id: "guide",
    title: "How to Use",
    icon: <Sliders className="w-5 h-5" />,
    searchContent: "HUD interface controls play pause speed custom input slider execution flow reset button",
    content: (
      <>
        <p className="mb-6">
          Every visualizer on AlgoLib shares a common "Head-Up Display" (HUD) interface. Master these controls to get the most out of your learning session.
        </p>
        <div className="space-y-4 mb-8">
          <div className="flex gap-4 items-start p-3 bg-[#0a0a1a] border border-white/5 rounded-lg">
             <div className="p-2 bg-[#00f5ff]/10 rounded text-[#00f5ff]"><Play size={16} /></div>
             <div>
                <h4 className="text-white text-sm font-bold">Play / Pause</h4>
                <p className="text-xs text-gray-400">Toggles the automatic execution of the algorithm. When paused, the state freezes, allowing you to inspect specific variables.</p>
             </div>
          </div>
          <div className="flex gap-4 items-start p-3 bg-[#0a0a1a] border border-white/5 rounded-lg">
             <div className="p-2 bg-[#9d00ff]/10 rounded text-[#9d00ff]"><Sliders size={16} /></div>
             <div>
                <h4 className="text-white text-sm font-bold">Execution Speed</h4>
                <p className="text-xs text-gray-400">Adjust the slider to slow down complex operations (for learning) or speed up (to see the final result). Ranges from 0.5x to 4x.</p>
             </div>
          </div>
          <div className="flex gap-4 items-start p-3 bg-[#0a0a1a] border border-white/5 rounded-lg">
             <div className="p-2 bg-[#00ff88]/10 rounded text-[#00ff88]"><Terminal size={16} /></div>
             <div>
                <h4 className="text-white text-sm font-bold">Custom Input</h4>
                <p className="text-xs text-gray-400">Most visualizers allow you to inject your own data arrays or tree structures via the bottom input panel. Data should be comma-separated.</p>
             </div>
          </div>
        </div>
      </>
    )
  },
  {
    id: "sorting",
    title: "Sorting Algorithms",
    icon: <Cpu className="w-5 h-5" />,
    searchContent: "bubble merge quick insertion sort time complexity space stability O(N^2) O(N log N) partition swap pivot real world applications selection sort",
    content: (
      <>
        <p className="mb-4">
          A comparative visualizer for the 5 standard sorting algorithms supported by our engine. The system highlights comparison operations in <span className="text-blue-400">Blue</span>, swaps in <span className="text-red-400">Red</span>, and final sorted elements in <span className="text-green-400">Green</span>.
        </p>

        {/* Extended Complexity Table */}
        <h3 className="text-white font-bold mb-3 mt-6">Algorithm Complexity Cheat Sheet</h3>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left text-xs text-gray-400 border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[#00f5ff]">
                <th className="py-3 pr-4">Algorithm</th>
                <th className="py-3 pr-4">Best Case</th>
                <th className="py-3 pr-4">Avg Case</th>
                <th className="py-3 pr-4">Worst Case</th>
                <th className="py-3 pr-4">Space</th>
                <th className="py-3">Stability</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 font-bold text-white">Bubble Sort</td>
                <td className="py-3 text-green-400">O(N)</td>
                <td className="py-3 text-yellow-400">O(N²)</td>
                <td className="py-3 text-red-400">O(N²)</td>
                <td className="py-3">O(1)</td>
                <td className="py-3 text-green-400">Stable</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 font-bold text-white">Selection Sort</td>
                <td className="py-3 text-red-400">O(N²)</td>
                <td className="py-3 text-red-400">O(N²)</td>
                <td className="py-3 text-red-400">O(N²)</td>
                <td className="py-3">O(1)</td>
                <td className="py-3 text-red-400">Unstable</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 font-bold text-white">Insertion Sort</td>
                <td className="py-3 text-green-400">O(N)</td>
                <td className="py-3 text-yellow-400">O(N²)</td>
                <td className="py-3 text-red-400">O(N²)</td>
                <td className="py-3">O(1)</td>
                <td className="py-3 text-green-400">Stable</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 font-bold text-white">Merge Sort</td>
                <td className="py-3 text-green-400">O(N log N)</td>
                <td className="py-3 text-green-400">O(N log N)</td>
                <td className="py-3 text-green-400">O(N log N)</td>
                <td className="py-3">O(N)</td>
                <td className="py-3 text-green-400">Stable</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 font-bold text-white">Quick Sort</td>
                <td className="py-3 text-green-400">O(N log N)</td>
                <td className="py-3 text-green-400">O(N log N)</td>
                <td className="py-3 text-red-400">O(N²)</td>
                <td className="py-3">O(log N)</td>
                <td className="py-3 text-red-400">Unstable</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Detailed Mechanics */}
        <h3 className="text-white font-bold mb-4 mt-8 flex items-center gap-2">
            <Globe size={16} className="text-[#00f5ff]" /> 
            Algorithm Deep Dive
        </h3>
        <div className="space-y-4">
             <div className="bg-[#0a0a1a] p-4 rounded border border-white/5">
                <strong className="text-[#00f5ff] text-sm block mb-1">Bubble Sort</strong>
                <p className="text-xs text-gray-400 leading-relaxed">
                   The simplest sorting algorithm that works by repeatedly swapping the adjacent elements if they are in the wrong order. 
                   <br/><em>Visualizer Note:</em> Watch the largest element "bubble" up to the rightmost position in each iteration (Green Highlight).
                </p>
             </div>
             <div className="bg-[#0a0a1a] p-4 rounded border border-white/5">
                <strong className="text-[#9d00ff] text-sm block mb-1">Selection Sort</strong>
                <p className="text-xs text-gray-400 leading-relaxed">
                   Divides the list into two parts: sorted (left) and unsorted (right). It repeatedly selects the smallest element from the unsorted sublist and moves it to the sorted boundary.
                   <br/><em>Visualizer Note:</em> Watch the "Current Minimum" highlight (often Purple) scanning the array before swapping.
                </p>
             </div>
             <div className="bg-[#0a0a1a] p-4 rounded border border-white/5">
                <strong className="text-[#00ff88] text-sm block mb-1">Insertion Sort</strong>
                <p className="text-xs text-gray-400 leading-relaxed">
                   Builds the sorted array one item at a time. It is much less efficient on large lists than more advanced algorithms such as quicksort, heapsort, or merge sort.
                   <br/><em>Visualizer Note:</em> Efficient for small data sets or nearly sorted arrays.
                </p>
             </div>
             <div className="bg-[#0a0a1a] p-4 rounded border border-white/5">
                <strong className="text-yellow-400 text-sm block mb-1">Merge Sort</strong>
                <p className="text-xs text-gray-400 leading-relaxed">
                   A Divide and Conquer algorithm. It divides the input array into two halves, calls itself for the two halves, and then merges the two sorted halves.
                   <br/><em>Visualizer Note:</em> You will see the array split into single elements before merging back together in sorted order.
                </p>
             </div>
             <div className="bg-[#0a0a1a] p-4 rounded border border-white/5">
                <strong className="text-red-400 text-sm block mb-1">Quick Sort</strong>
                <p className="text-xs text-gray-400 leading-relaxed">
                   Picks an element as a <strong>Pivot</strong> and partitions the given array around the picked pivot.
                   <br/><em>Visualizer Note:</em> Elements smaller than the pivot move to the left, larger to the right. The pivot is then placed in its correct position (Green).
                </p>
             </div>
        </div>
      </>
    ),
    code: `// QuickSort Partition Scheme (Lomuto)
int partition(int arr[], int low, int high) {
    int pivot = arr[high]; // Pivot at end
    int i = (low - 1);     // Index of smaller element

    for (int j = low; j <= high - 1; j++) {
        // If current element is smaller than or equal to pivot
        if (arr[j] <= pivot) {
            i++; 
            swap(&arr[i], &arr[j]);
        }
    }
    swap(&arr[i + 1], &arr[high]);
    return (i + 1);
}`
  },
  {
    id: "linked-list",
    title: "Linked Lists",
    icon: <GitCommit className="w-5 h-5" />,
    searchContent: "singly doubly linked list pointers nodes head tail insertion deletion reversal memory allocation phantom nodes browser history music playlist",
    content: (
      <>
        <p className="mb-4">
           The Linked List module visualizes linear data storage where elements are linked via pointers rather than stored contiguously in memory. Unlike arrays, linked lists do not have a fixed size.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0a0a1a] p-4 rounded border border-white/5">
               <strong className="block text-white mb-2 text-sm">Operations Analysis</strong>
               <ul className="list-disc pl-4 space-y-2 text-gray-400 text-xs">
                  <li><span className="text-[#00f5ff]">Insertion (Head/Tail):</span> <strong>O(1)</strong> - Just update pointers.</li>
                  <li><span className="text-[#9d00ff]">Deletion:</span> <strong>O(1)</strong> - If the node pointer is known.</li>
                  <li><span className="text-[#00ff88]">Access/Search:</span> <strong>O(N)</strong> - Must traverse from Head.</li>
               </ul>
            </div>
            <div className="bg-[#0a0a1a] p-4 rounded border border-white/5">
                <strong className="block text-white mb-2 text-sm">Real World Uses</strong>
                <ul className="list-disc pl-4 space-y-2 text-gray-400 text-xs">
                    <li>Dynamic memory allocation (OS heaps).</li>
                    <li>Implementing Stacks and Queues.</li>
                    <li>"Next/Previous" functionality in music players.</li>
                    <li>Browser History (Back/Forward).</li>
                </ul>
            </div>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Key Visualizations</h3>
        <p className="text-sm text-gray-400 mb-4">
            The engine simulates pointer reassignment in slow motion so you can see the "link breaking" and "re-linking" phases.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-400 mb-6">
          <li>
            <strong className="text-white">Reversal:</strong> An iterative animation showing the 3-pointer approach (Prev, Current, Next) to reverse the list.
          </li>
          <li>
            <strong className="text-white">Cycle Detection:</strong> Visualizing Floyd's Cycle-Finding Algorithm (Tortoise and Hare).
          </li>
        </ul>
      </>
    ),
    code: `// Reversing a Linked List Iteratively
void reverse(struct Node** head_ref) {
    struct Node* prev = NULL;
    struct Node* current = *head_ref;
    struct Node* next = NULL;
    
    while (current != NULL) {
        next = current->next;  // Store next node
        current->next = prev;  // Reverse current node's pointer
        prev = current;        // Move pointers one position ahead
        current = next;
    }
    *head_ref = prev;
}`
  },
  {
    id: "trees",
    title: "Binary Trees & BST",
    icon: <Network className="w-5 h-5" />,
    searchContent: "binary search tree BST root leaf node left right subtree inorder preorder postorder traversal O(log N) lookup height balanced AVL",
    content: (
      <>
        <p className="mb-4">
          Hierarchical data visualization. This module focuses on <strong>Binary Search Trees (BST)</strong>, demonstrating how data is organized to allow for O(log N) lookup times.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
           <div className="flex-1 p-4 rounded-lg bg-gradient-to-br from-[#00f5ff]/5 to-[#00f5ff]/10 border border-[#00f5ff]/20">
              <h4 className="text-[#00f5ff] font-bold text-xs mb-3 uppercase tracking-wider">Traversals</h4>
              <ul className="text-xs text-gray-300 space-y-2 font-mono">
                 <li className="flex justify-between"><span>INORDER</span> <span className="text-gray-500">Left → Root → Right</span></li>
                 <li className="flex justify-between"><span>PREORDER</span> <span className="text-gray-500">Root → Left → Right</span></li>
                 <li className="flex justify-between"><span>POSTORDER</span> <span className="text-gray-500">Left → Right → Root</span></li>
              </ul>
           </div>
           <div className="flex-1 p-4 rounded-lg bg-gradient-to-br from-[#9d00ff]/5 to-[#9d00ff]/10 border border-[#9d00ff]/20">
              <h4 className="text-[#9d00ff] font-bold text-xs mb-3 uppercase tracking-wider">BST Rules</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                 For any node <code>N</code>, all nodes in the left subtree are <strong className="text-white">less</strong> than <code>N</code>, and all nodes in the right subtree are <strong className="text-white">greater</strong>.
              </p>
           </div>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          <strong className="text-white">Complexity Note:</strong> In the worst case (skewed tree), BST operations can degrade to O(N). Self-balancing trees (AVL, Red-Black) solve this.
        </p>
      </>
    ),
    code: `// BST Insertion Logic (Recursive)
Node* insert(Node* node, int key) {
    // 1. If the tree is empty, return a new node
    if (node == NULL) return newNode(key);

    // 2. Otherwise, recur down the tree
    if (key < node->key)
        node->left = insert(node->left, key);
    else if (key > node->key)
        node->right = insert(node->right, key);

    // 3. Return the (unchanged) node pointer
    return node;
}`
  },
  {
    id: "pathfinding",
    title: "Pathfinding & Grids",
    icon: <Database className="w-5 h-5" />,
    searchContent: "dijkstra bfs breadth first search weighted unweighted shortest path grid walls obstacles flood fill",
    content: (
      <>
        <p className="mb-4">
          The pathfinding visualizer places you in a 2D grid environment. You can paint "Walls" (obstacles) and place "Start" and "End" nodes to visualize how algorithms traverse space.
        </p>
        <p className="text-sm text-gray-400 mb-6">
            The visualization uses color coding to show the <strong>Open Set</strong> (Nodes being considered) vs the <strong>Closed Set</strong> (Nodes already visited).
        </p>
        <ul className="space-y-4 mt-4">
           <li className="bg-[#0a0a1a] p-4 rounded border border-white/5 hover:border-[#00f5ff]/30 transition-colors">
              <div className="flex justify-between items-center mb-2">
                 <strong className="text-[#00f5ff]">Dijkstra's Algorithm</strong>
                 <span className="text-[10px] px-2 py-0.5 bg-[#00f5ff]/10 text-[#00f5ff] rounded font-mono">WEIGHTED</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                 The "father" of pathfinding. It guarantees the shortest path by exploring nodes in expanding concentric circles based on cost. It is indispensable for routing in maps where different roads have different "weights" (traffic, length).
              </p>
           </li>
           <li className="bg-[#0a0a1a] p-4 rounded border border-white/5 hover:border-[#00ff88]/30 transition-colors">
              <div className="flex justify-between items-center mb-2">
                 <strong className="text-[#00ff88]">BFS (Breadth-First Search)</strong>
                 <span className="text-[10px] px-2 py-0.5 bg-[#00ff88]/10 text-[#00ff88] rounded font-mono">UNWEIGHTED</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                 A traversal algorithm that explores all neighbors at the present depth prior to moving on to the nodes at the next depth level. 
                 <br/><span className="text-gray-500 mt-1 block">- Guarantees the shortest path in an unweighted grid.</span>
                 <span className="text-gray-500 block">- Works like a "Flood Fill" or a ripple in water.</span>
              </p>
           </li>
        </ul>
      </>
    )
  },

  {
    id: "stack-queue",
    title: "Stacks & Queues",
    icon: <Hash className="w-5 h-5" />,
    searchContent: "stack queue lifo fifo last in first out first in first out push pop enqueue dequeue front rear cpu scheduling undo redo",
    content: (
      <>
        <p className="mb-4">
          Abstract Data Types (ADT) that define how data is added or removed. These are fundamental building blocks for more complex data structures.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
           <div className="p-4 rounded border border-white/10 bg-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Server size={40} />
              </div>
              <h4 className="text-[#00f5ff] font-mono font-bold text-xs mb-2">STACK (LIFO)</h4>
              <p className="text-[10px] text-gray-400 mb-3">Think of a stack of plates. You can only add or remove from the top.</p>
              <div className="bg-black/20 p-2 rounded text-[10px] text-gray-300 font-mono">
                 Push: O(1) | Pop: O(1)
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Used in: Browser Back Button, Undo/Redo features.</p>
           </div>
           <div className="p-4 rounded border border-white/10 bg-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Database size={40} />
              </div>
              <h4 className="text-[#00ff88] font-mono font-bold text-xs mb-2">QUEUE (FIFO)</h4>
              <p className="text-[10px] text-gray-400 mb-3">Think of a line at a store. The first person in line is the first served.</p>
              <div className="bg-black/20 p-2 rounded text-[10px] text-gray-300 font-mono">
                 Enqueue: O(1) | Dequeue: O(1)
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Used in: Printer Spools, CPU Task Scheduling.</p>
           </div>
        </div>
      </>
    )
  }
];

// --- 4. MAIN PAGE COMPONENT ---
const Docs = () => {
  const [activeSection, setActiveSection] = useState("intro");
  const [searchQuery, setSearchQuery] = useState("");
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // --- SCROLL SPY LOGIC ---
  useEffect(() => {
    const handleScroll = () => {
      // Offset for the fixed header
      const scrollPosition = window.scrollY + 150; 

      // Find the section that is currently crossing the threshold
      for (const section of DOC_SECTIONS) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break; // Stop checking once we find the active one
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- SEARCH LOGIC ---
  const filteredSections = DOC_SECTIONS.filter(s => {
    const query = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(query) || 
      s.id.toLowerCase().includes(query) ||
      s.searchContent.toLowerCase().includes(query) 
    );
  });

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      // -100px offset for the sticky header
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-[#00f5ff]/30">
      <CyberSpaceBackground />
      <Navbar />

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00f5ff] via-[#9d00ff] to-[#00f5ff] origin-left z-[100]"
        style={{ scaleX }}
      />

      <div className="pt-28 md:pt-36 pb-20 container mx-auto px-4 max-w-7xl flex flex-col lg:flex-row gap-10">
        
        {/* --- LEFT SIDEBAR (STICKY & SCROLLABLE) --- */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="sticky top-28 space-y-6">
            
            {/* Search Box */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00f5ff] to-[#9d00ff] rounded-lg opacity-20 group-hover:opacity-50 blur transition duration-500" />
              <div className="relative flex items-center bg-[#050510] border border-white/10 rounded-lg px-3 py-3">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input 
                  type="text" 
                  placeholder="SEARCH DOCS..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-mono text-white w-full placeholder:text-gray-600 focus:placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-xs font-mono transition-all duration-200 border-l-2 group relative overflow-hidden ${
                    activeSection === section.id 
                      ? "bg-[#00f5ff]/10 text-[#00f5ff] border-[#00f5ff]" 
                      : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5 hover:border-white/20"
                  }`}
                >
                  {activeSection === section.id && (
                     <motion.div layoutId="activeGlow" className="absolute inset-0 bg-[#00f5ff]/5" initial={false} transition={{duration:0.3}} />
                  )}
                  <span className={`transition-colors relative z-10 ${activeSection === section.id ? "text-[#00f5ff]" : "text-gray-600 group-hover:text-gray-400"}`}>
                    {section.icon}
                  </span>
                  <span className="uppercase tracking-wider truncate text-left relative z-10">{section.title}</span>
                </button>
              ))}
            </nav>

            {/* Version Badge */}
            <div className="p-4 rounded-xl bg-[#0a0a1a]/50 border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    STATUS: ONLINE
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                    <span>VERSION</span>
                    <span className="text-[#00f5ff]">2.6.0</span>
                </div>
            </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {filteredSections.length > 0 ? (
              <div className="space-y-16">
                {filteredSections.map((section, index) => (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="scroll-mt-32 relative"
                  >
                    {/* Section Header */}
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10 relative">
                       <div className="absolute bottom-0 left-0 w-20 h-[1px] bg-[#00f5ff] shadow-[0_0_10px_#00f5ff]" />
                       <div className="p-3 rounded-xl bg-gradient-to-br from-[#00f5ff]/10 to-[#9d00ff]/10 border border-[#00f5ff]/20 text-[#00f5ff] shadow-[0_0_15px_rgba(0,245,255,0.1)]">
                          {React.cloneElement(section.icon as React.ReactElement, { size: 24 })}
                       </div>
                       <div>
                         <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
                            {section.title}
                         </h2>
                         <div className="flex gap-2 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-500 font-mono">DOCS</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#00f5ff]/5 border border-[#00f5ff]/10 text-[#00f5ff] font-mono">LIVE_DEMO</span>
                         </div>
                       </div>
                    </div>

                    {/* Content Body */}
                    <div className="text-sm md:text-base text-gray-400 leading-7 font-light tracking-wide">
                       {section.content}
                    </div>

                    {/* Code Snippet (If exists) */}
                    {section.code && <CodeBlock code={section.code} />}
                  </motion.section>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-gray-600 border border-white/5 rounded-2xl bg-white/5 border-dashed">
                 <Hash size={48} className="mb-4 opacity-20" />
                 <p className="font-mono text-sm">NO_SEARCH_RESULTS</p>
                 <p className="text-xs mt-2">Try searching for 'Sorting' or 'Graph'</p>
              </div>
            )}
          </AnimatePresence>

          {/* Footer for Docs */}
          <div className="mt-24 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-gray-600">
             <span>© 2026 ALGOLIB DOCUMENTATION</span>
             <div className="flex gap-6">
                <a href="https://mail.google.com/mail/u/0/?view=cm&fs=1&to=v.rajawatprateeksingh@gmail.com&su=Reporting%20a%20Bug%20in%20AlgoLib&body=Hello%20there,%20I%20saw%20your%20site..." target="_blank" className="hover:text-[#00f5ff] transition-colors">REPORT_BUG</a>
                <a href="https://mail.google.com/mail/u/0/?view=cm&fs=1&to=v.rajawatprateeksingh@gmail.com&su=Correction%20in%20AlgoLib%20Docs&body=Hello%20there,%20I%20saw%20your%20site..." target="_blank" className="hover:text-[#00f5ff] transition-colors">REPORT_CORRECTION</a>
             </div>
          </div>
        </main>

      </div>
    </div>
  );
};

export default Docs;