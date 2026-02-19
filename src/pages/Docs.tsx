import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { 
  BookOpen, Search, Code2, Hash, ChevronRight, Terminal, 
  Cpu, Layers, Network, GitCommit, Copy, Check,
  Play, Sliders, AlertTriangle, Database, Zap, Globe, Server, ArrowRight,
  Info, AlertCircle, X, MousePointer, Settings, RefreshCw, Share2, Map
} from "lucide-react";
import Navbar from "@/components/Navbar";

// --- 1. UTILITY COMPONENTS ---

// Highlights text that matches the search query
const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-yellow-500/30 text-yellow-200 font-bold px-0.5 rounded">{part}</span>
        ) : (
          part
        )
      )}
    </span>
  );
};

const SectionBadge = ({ children, color = "blue" }: { children: React.ReactNode, color?: "blue"|"purple"|"green"|"red" }) => {
  const colors = {
    blue: "bg-[#00f5ff]/10 text-[#00f5ff] border-[#00f5ff]/20",
    purple: "bg-[#9d00ff]/10 text-[#9d00ff] border-[#9d00ff]/20",
    green: "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wide ${colors[color]}`}>
      {children}
    </span>
  );
};

const ProTip = ({ children }: { children: React.ReactNode }) => (
  <div className="my-6 p-4 rounded-lg bg-blue-500/5 border-l-2 border-[#00f5ff] flex gap-3 text-sm text-gray-300 shadow-lg shadow-blue-900/10">
    <Info className="shrink-0 text-[#00f5ff]" size={18} />
    <div className="flex-1"><strong className="text-[#00f5ff] block text-xs mb-1 uppercase tracking-wider">Pro Tip</strong>{children}</div>
  </div>
);

const WarningBlock = ({ children }: { children: React.ReactNode }) => (
  <div className="my-6 p-4 rounded-lg bg-red-500/5 border-l-2 border-red-500 flex gap-3 text-sm text-gray-300">
    <AlertCircle className="shrink-0 text-red-500" size={18} />
    <div><strong className="text-red-500 block text-xs mb-1 uppercase tracking-wider">Warning</strong>{children}</div>
  </div>
);

// --- 2. COMPLEXITY TABLE COMPONENT ---
interface ComplexityRow {
  name: string;
  best?: string;
  avg?: string;
  worst?: string;
  space?: string;
  note?: string;
}

const ComplexityTable = ({ title, rows, cols = ["Algorithm", "Access", "Search", "Insertion", "Deletion", "Space"] }: { title?: string, rows: any[], cols?: string[] }) => (
  <div className="my-8 border border-white/10 rounded-xl overflow-hidden bg-[#0a0a1a] shadow-xl">
    {title && <div className="bg-white/5 px-4 py-3 border-b border-white/10 font-bold text-sm text-gray-200 flex items-center gap-2"><Hash size={14} className="text-[#00f5ff]"/>{title}</div>}
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-gray-400 border-collapse font-mono">
        <thead>
          <tr className="border-b border-white/10 text-[#00f5ff] bg-black/20">
            {cols.map((col, i) => (
              <th key={i} className="py-3 px-4 uppercase tracking-wider font-semibold">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, idx: number) => (
            <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
              {Object.values(row).map((val: any, i) => (
                <td key={i} className={`py-3 px-4 ${i === 0 ? "text-white font-bold group-hover:text-[#00f5ff] transition-colors" : ""}`}>
                  <span className={
                    val === "O(1)" || val === "O(log N)" || val === "O(V+E)" ? "text-[#00ff88]" :
                    val === "O(N)" || val === "O(E log V)" ? "text-yellow-400" :
                    val?.includes("N^2") || val?.includes("!") ? "text-red-400" : ""
                  }>
                    {val}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- 3. BACKGROUND ---
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
    const particles: any[] = [];
    const PARTICLE_COUNT = width < 768 ? 30 : 60;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(0, 245, 255, 0.1)";
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(animate);
    };
    animate();
    const handleResize = () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <div className="fixed inset-0 -z-10 bg-[#020205]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#0a0a2e_0%,_#020205_100%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block opacity-30" />
    </div>
  );
};

// --- 4. CODE BLOCK ---
const CodeBlock = ({ code, language = "cpp" }: { code: string, language?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group my-8 rounded-xl overflow-hidden border border-white/10 bg-[#0a0a1a] shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{language}</span>
        </div>
        <button onClick={handleCopy} className="text-gray-500 hover:text-[#00f5ff] transition-colors">
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
        <pre className="text-xs md:text-sm font-mono text-gray-300 leading-relaxed"><code>{code}</code></pre>
      </div>
    </div>
  );
};

// --- 5. DOCUMENTATION SECTIONS (With Text Search Support) ---

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  searchContent: string; // Plain text for search indexing
  render: (highlight: string) => React.ReactNode; // Render function to support highlighting
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: "guide",
    title: "How to Use Visualizer",
    icon: <MousePointer />,
    searchContent: "how to use guide interface controls play pause speed slider input data step by step tutorial",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-gray-300">
          <HighlightText text="Mastering the AlgoLib interface is key to understanding the algorithms. Here is a breakdown of the control panel found at the bottom of every visualizer." highlight={highlight} />
        </p>

        {/* Mock Interface Visual */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0f0f25] relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f5ff] via-[#9d00ff] to-[#00f5ff] opacity-50" />
           <div className="flex flex-col md:flex-row items-center gap-6">
              
              {/* Step 1: Controls */}
              <div className="flex-1 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00f5ff]/20 flex items-center justify-center text-[#00f5ff] border border-[#00f5ff]/50 shadow-[0_0_15px_rgba(0,245,255,0.3)]">
                       1
                    </div>
                    <h4 className="font-bold text-white">Playback Controls</h4>
                 </div>
                 <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex gap-2 justify-center">
                    <Play size={20} className="text-white fill-white" />
                    <div className="w-24 h-5 bg-white/10 rounded-full relative overflow-hidden">
                       <div className="absolute left-0 top-0 h-full w-1/2 bg-[#00f5ff]" />
                    </div>
                 </div>
                 <p className="text-xs text-gray-400">
                    <HighlightText text="Use the Play/Pause button to freeze the algorithm at any state. The seek bar allows you to scrub through the history of the execution." highlight={highlight} />
                 </p>
              </div>

              <div className="hidden md:block w-px h-24 bg-white/10" />

              {/* Step 2: Speed */}
              <div className="flex-1 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#9d00ff]/20 flex items-center justify-center text-[#9d00ff] border border-[#9d00ff]/50">
                       2
                    </div>
                    <h4 className="font-bold text-white">Speed Control</h4>
                 </div>
                 <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex gap-2 items-center justify-center">
                    <Settings size={16} className="text-gray-400" />
                    <div className="w-full h-1 bg-gray-600 rounded-full">
                       <div className="w-3/4 h-full bg-[#9d00ff] relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
                       </div>
                    </div>
                    <span className="text-[10px] font-mono">2x</span>
                 </div>
                 <p className="text-xs text-gray-400">
                    <HighlightText text="Adjust the execution speed. Slow it down to see every pointer change, or speed it up to see the final result instantly." highlight={highlight} />
                 </p>
              </div>

              <div className="hidden md:block w-px h-24 bg-white/10" />

              {/* Step 3: Input */}
              <div className="flex-1 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00ff88]/20 flex items-center justify-center text-[#00ff88] border border-[#00ff88]/50">
                       3
                    </div>
                    <h4 className="font-bold text-white">Custom Input</h4>
                 </div>
                 <div className="bg-black/30 p-3 rounded-lg border border-white/5 font-mono text-xs text-center text-gray-400">
                    [ 12, 5, 8, 99... ]
                 </div>
                 <p className="text-xs text-gray-400">
                    <HighlightText text="Click on the 'Input' tab to provide your own array or tree data. The visualizer will reconstruct the scene based on your numbers." highlight={highlight} />
                 </p>
              </div>
           </div>
        </div>
      </div>
    )
  },
  {
    id: "intro",
    title: "Introduction",
    icon: <Terminal />,
    searchContent: "intro help guide tutorial big o notation time complexity explanation",
    render: (highlight) => (
      <div className="space-y-6">
        <p className="text-lg text-gray-300">
          <strong className="text-[#00f5ff]">AlgoLib</strong> 
          <HighlightText text=" is a high-performance interactive visualization engine. Unlike standard debuggers, AlgoLib renders data structures in 2D space, allowing you to build an intuitive mental model of complex logic." highlight={highlight} />
        </p>

        <h3 className="text-white font-bold text-lg mt-8 flex items-center gap-2">
          <Code2 className="text-[#00ff88]" size={20}/> Standard Notation
        </h3>
        <p className="text-sm text-gray-400">
          <HighlightText text="We use standard Big O notation for all complexity analysis found in these docs." highlight={highlight} />
        </p>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono text-gray-500 mt-2">
           <li className="bg-black/40 p-2 rounded border border-white/5 text-[#00ff88]">O(1) - Constant</li>
           <li className="bg-black/40 p-2 rounded border border-white/5 text-[#00f5ff]">O(log N) - Logarithmic</li>
           <li className="bg-black/40 p-2 rounded border border-white/5 text-yellow-400">O(N) - Linear</li>
           <li className="bg-black/40 p-2 rounded border border-white/5 text-red-400">O(N²) - Quadratic</li>
        </ul>
      </div>
    )
  },
  {
    id: "linked-list",
    title: "Linked Lists",
    icon: <GitCommit />,
    searchContent: "singly doubly circular pointers nodes head tail memory allocation",
    render: (highlight) => (
      <div className="space-y-6">
        <p>
          <HighlightText text="A linear data structure where elements are not stored at contiguous memory locations. The elements are linked using pointers." highlight={highlight} />
        </p>
        
        <div className="flex gap-4 p-4 bg-black/30 rounded-lg border border-dashed border-white/10 items-center justify-center font-mono text-xs overflow-x-auto">
           <div className="flex items-center">
             <div className="border border-white/30 px-3 py-2 rounded bg-white/5 text-gray-300">[Data | Next]</div>
             <ArrowRight size={14} className="text-[#00f5ff] mx-1" />
             <div className="border border-white/30 px-3 py-2 rounded bg-white/5 text-gray-300">[Data | Next]</div>
             <ArrowRight size={14} className="text-[#00f5ff] mx-1" />
             <div className="text-gray-600">NULL</div>
           </div>
        </div>

        <ComplexityTable 
          title="Time Complexity Comparison"
          cols={["Type", "Access", "Insert (Head)", "Insert (Tail)", "Delete (Head)", "Delete (Tail)"]}
          rows={[
            { type: "Singly LL", acc: "O(N)", ih: "O(1)", it: "O(N)", dh: "O(1)", dt: "O(N)" },
            { type: "Doubly LL", acc: "O(N)", ih: "O(1)", it: "O(1)", dh: "O(1)", dt: "O(1)" },
            { type: "Circular Doubly LL", acc: "O(N)", ih: "O(1)", it: "O(1)", dh: "O(1)", dt: "O(1)" },
          ]}
        />
        <p className="text-[10px] text-gray-500 italic mt-[-20px]">
           *Circular Doubly LL allows O(1) tail operations because Head{'->'}Prev points to Tail.
        </p>

        <h4 className="text-white font-bold mt-6">Deep Dive: Doubly Linked List</h4>
        <p className="text-sm text-gray-400">
           <HighlightText text="Contains a pointer to both the next and previous node. This allows traversal in both directions but requires O(N) extra space for the backward pointers." highlight={highlight} />
        </p>

        <ProTip>
           Use a <strong>Doubly Linked List</strong> when you need to implement a Browser History (Back/Forward) or a Music Playlist.
        </ProTip>

        <CodeBlock code={`struct Node {
    int data;
    struct Node* next;
    struct Node* prev; // Extra pointer
};`} />
      </div>
    )
  },
  {
    id: "stack-queue",
    title: "Stacks & Queues",
    icon: <Layers />,
    searchContent: "fifo lifo push pop enqueue dequeue priority queue stack",
    render: (highlight) => (
      <div className="space-y-6">
         <p>
            <HighlightText text="Fundamental Abstract Data Types (ADTs) for managing data flow." highlight={highlight} />
         </p>
         
         <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
               <h4 className="text-[#00f5ff] font-mono font-bold flex items-center gap-2"><Server size={16}/> STACK (LIFO)</h4>
               <ul className="list-disc pl-5 text-xs text-gray-400 space-y-2">
                 <li>Last In, First Out.</li>
                 <li>Operations: Push (Add), Pop (Remove), Peek (Top).</li>
                 <li><HighlightText text="Used in: Recursion, Undo/Redo, Syntax Parsing." highlight={highlight} /></li>
               </ul>
            </div>
            <div className="space-y-3">
               <h4 className="text-[#00ff88] font-mono font-bold flex items-center gap-2"><Database size={16}/> QUEUE (FIFO)</h4>
               <ul className="list-disc pl-5 text-xs text-gray-400 space-y-2">
                 <li>First In, First Out.</li>
                 <li>Operations: Enqueue (Add), Dequeue (Remove).</li>
                 <li><HighlightText text="Used in: Job Scheduling, Printer Spooling, BFS." highlight={highlight} /></li>
               </ul>
            </div>
         </div>

         <ComplexityTable 
            title="Implementation Complexity"
            cols={["Implementation", "Push/Enqueue", "Pop/Dequeue", "Peek/Front", "Space"]}
            rows={[
               { name: "Stack (Array)", p: "O(1)", po: "O(1)", pe: "O(1)", s: "O(N)" },
               { name: "Stack (LL)", p: "O(1)", po: "O(1)", pe: "O(1)", s: "O(N)" },
               { name: "Queue (Array)", p: "O(1)", po: "O(1)", pe: "O(1)", s: "O(N)" },
               { name: "Priority Queue", p: "O(log N)", po: "O(log N)", pe: "O(1)", s: "O(N)" },
            ]}
         />
      </div>
    )
  },
  {
    id: "sorting",
    title: "Sorting Algorithms",
    icon: <Cpu />,
    searchContent: "bubble quick merge insertion selection heap sort stable unstable comparison",
    render: (highlight) => (
      <div className="space-y-6">
        <p>
          <HighlightText text="Arranging data in a specific order (ascending/descending). Efficient sorting is critical for optimizing search algorithms (like Binary Search)." highlight={highlight} />
        </p>

        <ComplexityTable 
           title="Sorting Algorithm Master Sheet"
           cols={["Algorithm", "Best Case", "Average", "Worst Case", "Space", "Stability"]}
           rows={[
              { name: "Bubble Sort", b: "O(N)", a: "O(N²)", w: "O(N²)", s: "O(1)", st: "Stable" },
              { name: "Insertion Sort", b: "O(N)", a: "O(N²)", w: "O(N²)", s: "O(1)", st: "Stable" },
              { name: "Selection Sort", b: "O(N²)", a: "O(N²)", w: "O(N²)", s: "O(1)", st: "Unstable" },
              { name: "Merge Sort", b: "O(N log N)", a: "O(N log N)", w: "O(N log N)", s: "O(N)", st: "Stable" },
              { name: "Quick Sort", b: "O(N log N)", a: "O(N log N)", w: "O(N²)", s: "O(log N)", st: "Unstable" },
           ]}
        />

        <div className="space-y-4">
           <h4 className="text-white font-bold">When to use what?</h4>
           <ul className="space-y-2 text-sm text-gray-400">
              <li><SectionBadge color="green">Insertion Sort</SectionBadge> <HighlightText text="When N is small (N < 50) or array is nearly sorted." highlight={highlight} /></li>
              <li><SectionBadge color="blue">Merge Sort</SectionBadge> <HighlightText text="When stable sort is needed or sorting Linked Lists." highlight={highlight} /></li>
              <li><SectionBadge color="red">Quick Sort</SectionBadge> <HighlightText text="General purpose, fastest in practice for Arrays (cache friendly)." highlight={highlight} /></li>
           </ul>
        </div>
      </div>
    )
  },
  {
    id: "trees",
    title: "Trees & BST",
    icon: <Network />,
    searchContent: "binary search tree avl red black heap traversal bfs dfs",
    render: (highlight) => (
      <div className="space-y-6">
        <p>
          <HighlightText text="Hierarchical data structures. A Binary Search Tree (BST) maintains the property that for any node, left children are smaller and right children are larger." highlight={highlight} />
        </p>

        <ComplexityTable 
           title="Tree Operations (BST vs Balanced)"
           cols={["Structure", "Search (Avg)", "Insert (Avg)", "Delete (Avg)", "Worst Case (Skewed)"]}
           rows={[
              { name: "Standard BST", s: "O(log N)", i: "O(log N)", d: "O(log N)", w: "O(N) ⚠️" },
              { name: "AVL Tree", s: "O(log N)", i: "O(log N)", d: "O(log N)", w: "O(log N)" },
              { name: "Red-Black Tree", s: "O(log N)", i: "O(log N)", d: "O(log N)", w: "O(log N)" },
           ]}
        />
      </div>
    )
  },
  {
    id: "pathfinding",
    title: "Pathfinding & Graphs",
    icon: <Share2 />, // or Map
    searchContent: "bfs dijkstra graph shortest path weighted unweighted nodes edges",
    render: (highlight) => (
      <div className="space-y-6">
        <p>
          <HighlightText text="Graph algorithms are essential for networking, GPS navigation, and solving puzzles. Our visualizer lets you build nodes, connect edges, and run algorithms to find the shortest path." highlight={highlight} />
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-4">
           {/* BFS Card */}
           <div className="bg-[#0a0a1a] p-5 rounded-xl border border-white/10 hover:border-[#00ff88]/50 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 bg-[#00ff88]/10 text-[#00ff88] rounded-lg group-hover:bg-[#00ff88]/20 transition-colors">
                    <Network size={20} />
                 </div>
                 <h4 className="font-bold text-white">BFS (Breadth First Search)</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                 <HighlightText text="Explores the graph layer by layer. It is guaranteed to find the shortest path in an unweighted graph." highlight={highlight} />
              </p>
              <SectionBadge color="green">Unweighted</SectionBadge>
           </div>

           {/* Dijkstra Card */}
           <div className="bg-[#0a0a1a] p-5 rounded-xl border border-white/10 hover:border-[#00f5ff]/50 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 bg-[#00f5ff]/10 text-[#00f5ff] rounded-lg group-hover:bg-[#00f5ff]/20 transition-colors">
                    <Map size={20} />
                 </div>
                 <h4 className="font-bold text-white">Dijkstra's Algorithm</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                 <HighlightText text="The gold standard for weighted graphs. It prioritizes exploring paths with the lowest accumulated cost." highlight={highlight} />
              </p>
              <SectionBadge color="blue">Weighted</SectionBadge>
           </div>
        </div>

        <ComplexityTable 
           title="Graph Algorithm Complexity"
           cols={["Algorithm", "Time Complexity", "Space Complexity", "Best For"]}
           rows={[
              { name: "BFS", t: "O(V + E)", s: "O(V)", use: "Shortest Path (Unweighted)" },
              { name: "DFS", t: "O(V + E)", s: "O(V)", use: "Path Existence, Cycles" },
              { name: "Dijkstra", t: "O(E log V)", s: "O(V)", use: "Shortest Path (Weighted)" },
           ]}
        />

        <ProTip>
           <HighlightText text="Dijkstra's algorithm fails with negative edge weights. For graphs with negative weights, Bellman-Ford is required." highlight={highlight} />
        </ProTip>

        <CodeBlock code={`// Standard BFS Implementation
void BFS(int startNode) {
    bool visited[V];
    list<int> queue;
    
    visited[startNode] = true;
    queue.push_back(startNode);

    while(!queue.empty()) {
        int s = queue.front();
        queue.pop_front();
        
        for(auto i = adj[s].begin(); i != adj[s].end(); ++i) {
            if(!visited[*i]) {
                visited[*i] = true;
                queue.push_back(*i);
            }
        }
    }
}`} />
      </div>
    )
  }
];

// --- 6. MAIN PAGE COMPONENT ---
const Docs = () => {
  const [activeSection, setActiveSection] = useState("guide");
  const [searchQuery, setSearchQuery] = useState("");
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Dynamic Scroll Spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for header
      for (const section of DOC_SECTIONS) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter Content based on Search
  const filteredSections = DOC_SECTIONS.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.searchContent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen text-gray-200 font-sans selection:bg-[#00f5ff]/30">
      <CyberSpaceBackground />
      <Navbar />
      
      {/* Top Reading Progress */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00f5ff] to-[#9d00ff] z-50 origin-left" />

      <div className="pt-28 container mx-auto px-4 max-w-7xl flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR (Sticky + Dynamic) */}
        <aside className="w-full lg:w-64 shrink-0 lg:h-[calc(100vh-120px)] lg:sticky lg:top-28">
           <div className="backdrop-blur-xl bg-[#0a0a1a]/80 border border-white/10 rounded-2xl p-4 h-full flex flex-col shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent opacity-20" />
              
              <div className="relative mb-6">
                 <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                 <input 
                    type="text" 
                    placeholder="Search docs..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-xs text-white focus:border-[#00f5ff] outline-none transition-colors placeholder:text-gray-600"
                 />
                 {searchQuery && (
                   <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-gray-500 hover:text-white">
                     <X size={14} />
                   </button>
                 )}
              </div>

              <nav className="flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                 {filteredSections.map((sec) => (
                    <button
                       key={sec.id}
                       onClick={() => scrollToSection(sec.id)}
                       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group relative overflow-hidden ${
                          activeSection === sec.id 
                          ? "bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/20" 
                          : "text-gray-500 hover:text-gray-200 hover:bg-white/5 border border-transparent"
                       }`}
                    >
                       {activeSection === sec.id && (
                          <motion.div layoutId="activeGlow" className="absolute inset-0 bg-[#00f5ff]/5" />
                       )}
                       <span className={`relative z-10 ${activeSection === sec.id ? "text-[#00f5ff]" : "text-gray-600 group-hover:text-gray-400"}`}>
                          {React.cloneElement(sec.icon as React.ReactElement, { size: 16 })}
                       </span>
                       <span className="relative z-10">{sec.title}</span>
                       {activeSection === sec.id && <ChevronRight className="ml-auto w-3 h-3 relative z-10" />}
                    </button>
                 ))}
              </nav>

              <div className="pt-4 mt-4 border-t border-white/10">
                 <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                    <span>v2.5.0</span>
                    <span className="flex items-center gap-1 text-green-400"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/> Online</span>
                 </div>
              </div>
           </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 pb-20">
           <AnimatePresence mode="wait">
              <div className="space-y-20">
                 {filteredSections.length > 0 ? filteredSections.map((section, idx) => (
                    <motion.section 
                       key={section.id} 
                       id={section.id}
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true, margin: "-100px" }}
                       transition={{ duration: 0.4, delay: idx * 0.05 }}
                       className="scroll-mt-32"
                    >
                       <div className="flex items-end gap-4 mb-8 border-b border-white/10 pb-4">
                          <div className="p-3 bg-gradient-to-br from-[#00f5ff]/20 to-[#9d00ff]/20 rounded-xl border border-white/10 text-white shadow-lg shadow-purple-900/20">
                             {React.cloneElement(section.icon as React.ReactElement, { size: 32 })}
                          </div>
                          <div>
                             <h2 className="text-3xl font-black text-white uppercase tracking-tight">{section.title}</h2>
                             <div className="flex gap-2 mt-2">
                                <SectionBadge>Docs</SectionBadge>
                                {section.id === "guide" && <SectionBadge color="green">New</SectionBadge>}
                             </div>
                          </div>
                       </div>
                       
                       <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                          {/* We pass searchQuery to the render function to highlight matching text */}
                          {section.render(searchQuery)}
                       </div>
                    </motion.section>
                 )) : (
                    <div className="flex flex-col items-center justify-center py-32 opacity-50 border border-dashed border-white/10 rounded-2xl bg-white/5">
                       <Search size={48} className="mb-4 text-gray-600" />
                       <p className="text-gray-500 font-mono">No results found for "{searchQuery}"</p>
                       <button onClick={() => setSearchQuery("")} className="mt-4 text-xs text-[#00f5ff] hover:underline flex items-center gap-1">
                          <RefreshCw size={12}/> Reset Search
                       </button>
                    </div>
                 )}
              </div>
           </AnimatePresence>
        </main>

      </div>
    </div>
  );
};

export default Docs;