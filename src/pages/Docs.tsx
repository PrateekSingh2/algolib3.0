import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { 
  BookOpen, Search, Code2, Hash, ChevronRight, Terminal, 
  Cpu, Layers, Network, GitCommit, Copy, Check,
  Play, Sliders, AlertTriangle, Database, Zap, Globe, Server, ArrowRight,
  Info, AlertCircle, X, MousePointer, Settings, RefreshCw, Share2, Map,
  Menu, AlignLeft, Box, Binary, Calculator, Key, ListTree, Target, MonitorPlay
} from "lucide-react";
import Navbar from "@/components/Navbar";
import GlobalRibbon from "@/components/GlobalRibbon";

// --- 1. UTILITY COMPONENTS ---

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

const SectionBadge = ({ children, color = "blue" }: { children: React.ReactNode, color?: "blue"|"purple"|"green"|"red"|"orange" }) => {
  const colors = {
    blue: "bg-[#00f5ff]/10 text-[#00f5ff] border-[#00f5ff]/20",
    purple: "bg-[#9d00ff]/10 text-[#9d00ff] border-[#9d00ff]/20",
    green: "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
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
    <div className="flex-1"><strong className="text-[#00f5ff] block text-xs mb-1 uppercase tracking-wider">Professor's Insight</strong>{children}</div>
  </div>
);

const WarningBlock = ({ children }: { children: React.ReactNode }) => (
  <div className="my-6 p-4 rounded-lg bg-red-500/5 border-l-2 border-red-500 flex gap-3 text-sm text-gray-300">
    <AlertCircle className="shrink-0 text-red-500" size={18} />
    <div><strong className="text-red-500 block text-xs mb-1 uppercase tracking-wider">Common Pitfall</strong>{children}</div>
  </div>
);

const ComplexityTable = ({ title, rows, cols }: { title?: string, rows: any[], cols: string[] }) => (
  <div className="my-8 border border-white/10 rounded-xl overflow-hidden bg-[#0a0a1a] shadow-xl">
    {title && <div className="bg-white/5 px-4 py-3 border-b border-white/10 font-bold text-sm text-gray-200 flex items-center gap-2"><Hash size={14} className="text-[#00f5ff]"/>{title}</div>}
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-gray-400 border-collapse font-mono whitespace-nowrap">
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

// Tabbed Code Block for C++ and Java
const CodeTabs = ({ tabs }: { tabs: { language: string, code: string, title?: string }[] }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tabs[activeIdx].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageColorClass = (lang: string, isActive: boolean) => {
    if (!isActive) return "text-gray-500 hover:text-gray-300";
    const lowerLang = lang.toLowerCase();
    if (lowerLang.includes('java')) return 'border-orange-400 text-orange-400 bg-white/5 border-b-2';
    if (lowerLang.includes('cpp') || lowerLang.includes('c++')) return 'border-blue-400 text-blue-400 bg-white/5 border-b-2';
    return 'border-[#00f5ff] text-[#00f5ff] bg-white/5 border-b-2';
  };

  return (
    <div className="relative group my-8 rounded-xl overflow-hidden border border-white/10 bg-[#0a0a1a] shadow-xl">
      <div className="flex items-center justify-between px-4 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5 py-3 hidden sm:flex">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <div className="flex pt-1">
            {tabs.map((tab, idx) => (
                <button
                    key={idx}
                    onClick={() => setActiveIdx(idx)}
                    className={`px-4 py-2 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-colors ${getLanguageColorClass(tab.language, activeIdx === idx)}`}
                >
                    {tab.language}
                </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 py-2">
          {tabs[activeIdx].title && <span className="text-[10px] md:text-xs font-mono text-gray-400 hidden lg:block">{tabs[activeIdx].title}</span>}
          <button onClick={handleCopy} className="text-gray-500 hover:text-[#00f5ff] transition-colors p-1">
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 max-h-[600px]">
        <pre className="text-xs md:text-sm font-mono text-gray-300 leading-relaxed"><code>{tabs[activeIdx].code}</code></pre>
      </div>
    </div>
  );
};

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

// --- 2. DOCUMENTATION SECTIONS (TOPIC-BASED) ---

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  searchContent: string;
  render: (highlight: string) => React.ReactNode;
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: "visualizer-guide",
    title: "How to Use the Visualizer",
    icon: <MonitorPlay />,
    searchContent: "how to use visualizer guide interface controls play pause speed slider input data step by step tutorial",
    render: (highlight) => (
      <div className="space-y-8">
        <p className="text-lg text-gray-300">
          <HighlightText text="AlgoLib isn't just a static reference; it's a dynamic laboratory. To fully grasp memory manipulation, you must observe it in motion. Here is how to navigate the visualization interface." highlight={highlight} />
        </p>

        {/* Visualizer Interface Mockup */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0f0f25] relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f5ff] via-[#9d00ff] to-[#00f5ff] opacity-50" />
           <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              
              {/* Step 1: Controls */}
              <div className="flex-1 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00f5ff]/20 flex items-center justify-center text-[#00f5ff] border border-[#00f5ff]/50 shadow-[0_0_15px_rgba(0,245,255,0.3)] shrink-0">1</div>
                    <h4 className="font-bold text-white text-sm">Execution Scrubber</h4>
                 </div>
                 <div className="bg-black/40 p-3 rounded-lg border border-white/5 flex gap-3 items-center">
                    <button className="hover:bg-white/10 p-1 rounded"><Play size={16} className="text-white fill-white" /></button>
                    <div className="flex-1 h-3 bg-white/10 rounded-full relative cursor-pointer">
                       <div className="absolute left-0 top-0 h-full w-1/3 bg-[#00f5ff] rounded-full shadow-[0_0_10px_#00f5ff]" />
                    </div>
                 </div>
                 <p className="text-xs text-gray-400">
                    <HighlightText text="Treat the timeline like a video player. Step forward to observe a pointer update, or pause to analyze the stack frame." highlight={highlight} />
                 </p>
              </div>

              <div className="hidden md:block w-px h-24 bg-white/10" />

              {/* Step 2: Speed */}
              <div className="flex-1 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#9d00ff]/20 flex items-center justify-center text-[#9d00ff] border border-[#9d00ff]/50 shrink-0">2</div>
                    <h4 className="font-bold text-white text-sm">Time Dilation</h4>
                 </div>
                 <div className="bg-black/40 p-3 rounded-lg border border-white/5 flex gap-3 items-center justify-center">
                    <Settings size={14} className="text-gray-400" />
                    <input type="range" className="w-full accent-[#9d00ff] h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                    <span className="text-[10px] font-mono text-[#9d00ff]">1.5x</span>
                 </div>
                 <p className="text-xs text-gray-400">
                    <HighlightText text="Dynamically adjust framerates. Slow down the engine during complex tree rotations, or speed up array sorting to see macroscopic patterns." highlight={highlight} />
                 </p>
              </div>

              <div className="hidden md:block w-px h-24 bg-white/10" />

              {/* Step 3: Input */}
              <div className="flex-1 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00ff88]/20 flex items-center justify-center text-[#00ff88] border border-[#00ff88]/50 shrink-0">3</div>
                    <h4 className="font-bold text-white text-sm">Data Injection</h4>
                 </div>
                 <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-xs text-gray-300 flex items-center justify-between cursor-text">
                    [ 12, 5, 8, 99 ]
                    <div className="w-1.5 h-3.5 bg-white/50 animate-pulse" />
                 </div>
                 <p className="text-xs text-gray-400">
                    <HighlightText text="Test algorithms against worst-case scenarios. Input reverse-sorted arrays to watch Quick Sort devolve into O(N²)." highlight={highlight} />
                 </p>
              </div>
           </div>
        </div>
      </div>
    )
  },
  {
    id: "foundations",
    title: "Foundations & Array Math",
    icon: <Terminal />,
    searchContent: "introduction asymptotic notation big o algorithms characteristics array representation index address translation row column major",
    render: (highlight) => (
      <div className="space-y-12">
        <div>
           <h3 className="text-[#00f5ff] text-2xl font-bold mb-4">Algorithms & Asymptotic Notations</h3>
           <p className="text-gray-300 mb-4">
             <HighlightText text="To engineer scalable AI or server backends, we measure algorithmic efficiency independently of hardware. We evaluate how execution time scales as input size (N) grows." highlight={highlight} />
           </p>
           <ul className="space-y-2 text-sm text-gray-400 font-mono bg-black/30 p-4 rounded-lg border border-white/5 shadow-inner">
              <li><strong className="text-green-400">Big O (O):</strong> Upper bound. Worst-case scenario. Guarantee that runtime won't exceed this.</li>
              <li><strong className="text-yellow-400">Omega (Ω):</strong> Lower bound. Best-case scenario.</li>
              <li><strong className="text-purple-400">Theta (Θ):</strong> Tight bound. Average case where upper and lower limits converge.</li>
           </ul>
        </div>

        <div>
           <h3 className="text-[#00f5ff] text-2xl font-bold mb-4">Arrays & Address Translation</h3>
           <p className="text-gray-300 mb-4">
             <HighlightText text="Arrays store data contiguously. However, physical RAM is a strictly one-dimensional ribbon. The compiler must mathematically translate a 2D matrix index (like A[i][j]) into a 1D memory address." highlight={highlight} />
           </p>
           
           

           <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white/5 p-5 rounded-xl border border-[#00ff88]/30 shadow-[0_0_15px_rgba(0,255,136,0.05)]">
                 <h4 className="font-bold text-white mb-3 text-[#00ff88]">Row-Major Order (C/C++, Java)</h4>
                 <p className="text-xs text-[#00ff88] bg-black/50 p-2 rounded font-mono mb-3">Addr(A[i][j]) = Base + w * [ (i - L1)*N + (j - L2) ]</p>
                 <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
                    <li><code>w</code>: Size of one element (e.g., 4 bytes for int)</li>
                    <li><code>N</code>: Total number of columns</li>
                    <li><code>L1, L2</code>: Lower bounds (usually index 0)</li>
                 </ul>
              </div>
              <div className="bg-white/5 p-5 rounded-xl border border-[#9d00ff]/30 shadow-[0_0_15px_rgba(157,0,255,0.05)]">
                 <h4 className="font-bold text-white mb-3 text-[#9d00ff]">Column-Major Order (Fortran)</h4>
                 <p className="text-xs text-[#9d00ff] bg-black/50 p-2 rounded font-mono mb-3">Addr(A[i][j]) = Base + w * [ (j - L2)*M + (i - L1) ]</p>
                 <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
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
    searchContent: "linked list introduction implementation operations singly circular doubly doubly circular polynomial manipulation insertion deletion traversal head tail",
    render: (highlight) => (
      <div className="space-y-12">
        <div>
           <h3 className="text-[#00f5ff] text-2xl font-bold mb-4">The Linked List Family</h3>
           <p className="text-gray-300 mb-4">
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
           <p className="text-[10px] text-gray-500 italic mt-[-20px] mb-8">
              * Performance improves to $O(1)$ if an explicit <code>Tail</code> pointer is tracked. Circular Doubly achieves $O(1)$ inherently because <code>head-&gt;prev</code> is the tail.
           </p>
        </div>

        {/* 1. Singly Linked List */}
        <div>
           <h4 className="text-[#00f5ff] font-bold text-xl mb-2 flex items-center gap-2">1. Singly Linked List</h4>
           <p className="text-sm text-gray-400 mb-4">A standard, forward-only chain. Best for basic Stacks and Queues.</p>
           <CodeTabs tabs={[
              {
                 language: "C++",
                 title: "Singly LL Complete",
                 code: `struct Node {
    int data; Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

class SinglyLinkedList {
    Node* head;
public:
    SinglyLinkedList() : head(nullptr) {}

    void insertAtHead(int val) {
        Node* temp = new Node(val);
        temp->next = head;
        head = temp;
    }

    void insertAtTail(int val) {
        Node* temp = new Node(val);
        if (!head) { head = temp; return; }
        Node* curr = head;
        while (curr->next) curr = curr->next;
        curr->next = temp;
    }

    void deleteAtPosition(int pos) {
        if (!head) return;
        if (pos == 1) { 
            Node* temp = head; head = head->next; delete temp; 
            return; 
        }
        Node* curr = head;
        for (int i = 1; i < pos - 1 && curr; i++) curr = curr->next;
        if (!curr || !curr->next) return;
        Node* toDelete = curr->next;
        curr->next = curr->next->next;
        delete toDelete;
    }
    
    void traverse() {
        for(Node* curr = head; curr != nullptr; curr = curr->next)
            cout << curr->data << " -> ";
        cout << "NULL\\n";
    }
};`
              },
              {
                 language: "Java",
                 title: "Singly LL Complete",
                 code: `class Node {
    int data; Node next;
    Node(int d) { data = d; next = null; }
}

public class SinglyLinkedList {
    Node head;

    public void insertAtHead(int val) {
        Node temp = new Node(val);
        temp.next = head; head = temp;
    }

    public void insertAtTail(int val) {
        Node temp = new Node(val);
        if (head == null) { head = temp; return; }
        Node curr = head;
        while (curr.next != null) curr = curr.next;
        curr.next = temp;
    }

    public void deleteAtPosition(int pos) {
        if (head == null) return;
        if (pos == 1) { head = head.next; return; }
        Node curr = head;
        for (int i = 1; i < pos - 1 && curr != null; i++) curr = curr.next;
        if (curr == null || curr.next == null) return;
        curr.next = curr.next.next;
    }
    
    public void traverse() {
        for(Node curr = head; curr != null; curr = curr.next)
            System.out.print(curr.data + " -> ");
        System.out.println("NULL");
    }
}`
              }
           ]} />
        </div>

        {/* 2. Doubly Linked List */}
        <div>
           <h4 className="text-[#00ff88] font-bold text-xl mb-2 flex items-center gap-2">2. Doubly Linked List</h4>
           <p className="text-sm text-gray-400 mb-4">Stores both <code>next</code> and <code>prev</code> pointers. Essential for browser histories or music playlists where backward traversal is needed.</p>
           
           

           <CodeTabs tabs={[
              {
                 language: "C++",
                 title: "Doubly LL Complete",
                 code: `struct DNode {
    int data; DNode *next, *prev;
    DNode(int val) : data(val), next(nullptr), prev(nullptr) {}
};

class DoublyLinkedList {
    DNode* head;
public:
    DoublyLinkedList() : head(nullptr) {}

    void insertAtHead(int val) {
        DNode* temp = new DNode(val);
        if (head) head->prev = temp;
        temp->next = head;
        head = temp;
    }

    void insertAtTail(int val) {
        DNode* temp = new DNode(val);
        if (!head) { head = temp; return; }
        DNode* curr = head;
        while (curr->next) curr = curr->next;
        curr->next = temp;
        temp->prev = curr;
    }

    void deleteNode(int pos) {
        if (!head) return;
        DNode* curr = head;
        if (pos == 1) {
            head = head->next;
            if (head) head->prev = nullptr;
            delete curr; return;
        }
        for (int i = 1; i < pos && curr; i++) curr = curr->next;
        if (!curr) return;
        if (curr->next) curr->next->prev = curr->prev;
        if (curr->prev) curr->prev->next = curr->next;
        delete curr;
    }
};`
              },
              {
                 language: "Java",
                 title: "Doubly LL Complete",
                 code: `class DNode {
    int data; DNode next, prev;
    DNode(int d) { data = d; next = prev = null; }
}

public class DoublyLinkedList {
    DNode head;

    public void insertAtHead(int val) {
        DNode temp = new DNode(val);
        if (head != null) head.prev = temp;
        temp.next = head;
        head = temp;
    }

    public void insertAtTail(int val) {
        DNode temp = new DNode(val);
        if (head == null) { head = temp; return; }
        DNode curr = head;
        while (curr.next != null) curr = curr.next;
        curr.next = temp;
        temp.prev = curr;
    }

    public void deleteNode(int pos) {
        if (head == null) return;
        DNode curr = head;
        if (pos == 1) {
            head = head.next;
            if (head != null) head.prev = null;
            return;
        }
        for (int i = 1; i < pos && curr != null; i++) curr = curr.next;
        if (curr == null) return;
        if (curr.next != null) curr.next.prev = curr.prev;
        if (curr.prev != null) curr.prev.next = curr.next;
    }
}`
              }
           ]} />
        </div>

        {/* 3 & 4. Circular Variants */}
        <div>
           <h4 className="text-[#9d00ff] font-bold text-xl mb-2 flex items-center gap-2">3 & 4. Circular Variants (Singly & Doubly)</h4>
           <p className="text-sm text-gray-400 mb-4">In a Circular list, the Tail's <code>next</code> pointer wraps back to the Head. Circular Doubly is the most powerful variant because <code>head-&gt;prev</code> gives instantaneous access to the Tail.</p>
           
           <CodeTabs tabs={[
              {
                 language: "C++",
                 title: "Circular Doubly LL",
                 code: `class CircularDoublyLL {
    DNode* head;
public:
    CircularDoublyLL() : head(nullptr) {}

    void insertAtTail(int val) {
        DNode* temp = new DNode(val);
        if (!head) {
            head = temp;
            head->next = head->prev = head; // Points to itself
            return;
        }
        DNode* tail = head->prev; // O(1) Tail Access!

        tail->next = temp;
        temp->prev = tail;
        temp->next = head;
        head->prev = temp;
    }

    void deleteTail() {
        if (!head) return;
        if (head->next == head) { delete head; head = nullptr; return; }
        
        DNode* tail = head->prev;
        DNode* newTail = tail->prev;
        
        newTail->next = head;
        head->prev = newTail;
        delete tail;
    }
};`
              },
              {
                 language: "Java",
                 title: "Circular Singly LL",
                 code: `public class CircularSinglyLL {
    Node head;

    public void insertAtHead(int val) {
        Node temp = new Node(val);
        if (head == null) {
            head = temp;
            temp.next = head;
            return;
        }
        Node curr = head;
        while (curr.next != head) curr = curr.next; // Find Tail
        
        temp.next = head;
        curr.next = temp;
        head = temp;
    }
    
    // Deletion omitted for brevity, follows similar wrap-around logic.
}`
              }
           ]} />
        </div>

        {/* Polynomial Manipulation */}
        <div>
           <h3 className="text-[#00f5ff] text-2xl font-bold mb-4 border-t border-white/10 pt-8 mt-8">Polynomial Manipulation</h3>
           <p className="text-gray-300 mb-4">
             <HighlightText text="Algebraic expressions like 5x³ + 2x¹ are mapped to a Linked List where nodes store (Coefficient, Exponent). To add them, we merge two sorted lists based on exponent powers." highlight={highlight} />
           </p>
           <CodeTabs tabs={[
              {
                 language: "C++",
                 title: "Polynomial Addition",
                 code: `struct PolyNode {
    int coeff, exp; PolyNode* next;
    PolyNode(int c, int e) : coeff(c), exp(e), next(nullptr) {}
};

PolyNode* addPolynomials(PolyNode* p1, PolyNode* p2) {
    PolyNode dummy(0, 0); PolyNode* curr = &dummy;
    
    while (p1 && p2) {
        if (p1->exp > p2->exp) {
            curr->next = new PolyNode(p1->coeff, p1->exp);
            p1 = p1->next;
        } else if (p1->exp < p2->exp) {
            curr->next = new PolyNode(p2->coeff, p2->exp);
            p2 = p2->next;
        } else {
            // Exponents match, add coefficients
            curr->next = new PolyNode(p1->coeff + p2->coeff, p1->exp);
            p1 = p1->next; p2 = p2->next;
        }
        curr = curr->next;
    }
    // Append remaining
    while(p1) { curr->next = new PolyNode(p1->coeff, p1->exp); p1 = p1->next; curr = curr->next; }
    while(p2) { curr->next = new PolyNode(p2->coeff, p2->exp); p2 = p2->next; curr = curr->next; }
    
    return dummy.next;
}`
              }
           ]}/>
        </div>
      </div>
    )
  },
  {
    id: "stacks-expressions",
    title: "Stacks & Expressions",
    icon: <Layers />,
    searchContent: "stacks concept implementation operations array linked list infix to postfix conversion evaluation recursion base case",
    render: (highlight) => (
      <div className="space-y-12">
        <div>
           <h3 className="text-[#00f5ff] text-2xl font-bold mb-4">Stacks (LIFO) Architectures</h3>
           <p className="text-gray-300 mb-4">
             <HighlightText text="Last-In-First-Out processing. Stacks are the backbone of program memory (the Call Stack), Depth-First Search, and syntax parsing." highlight={highlight} />
           </p>
           
           <CodeTabs tabs={[
              {
                 language: "C++",
                 title: "Stack (Array Based)",
                 code: `#define MAX 1000
class Stack {
    int top; int arr[MAX];
public:
    Stack() { top = -1; }
    
    bool push(int x) { 
        if(top >= MAX-1) return false; // Overflow
        arr[++top] = x; return true; 
    }
    
    int pop() { 
        if (top < 0) return -1; // Underflow
        return arr[top--]; 
    }
    
    int peek() { return (top >= 0) ? arr[top] : -1; }
};`
              },
              {
                 language: "Java",
                 title: "Stack (Linked List Based)",
                 code: `class Node {
    int data; Node next;
    Node(int d) { data = d; next = null; }
}

public class StackLL {
    private Node head; // Head acts as the 'Top'
    
    public void push(int data) {
        Node temp = new Node(data);
        temp.next = head; 
        head = temp;
    }
    
    public int pop() {
        if (head == null) return -1; // Underflow
        int val = head.data; 
        head = head.next; // Java Garbage Collector cleans the old node
        return val;
    }
    
    public int peek() {
        return (head != null) ? head.data : -1;
    }
}`
              }
           ]} />
        </div>

        <div>
           <h3 className="text-[#00f5ff] text-2xl font-bold mb-4">Infix to Postfix & Evaluation</h3>
           <p className="text-gray-300 mb-4">
             <HighlightText text="Machines evaluate expressions linearly. They convert human-readable Infix (A + B * C) into Postfix (A B C * +) using a stack, eliminating the need to parse parenthesis multiple times." highlight={highlight} />
           </p>
           <CodeTabs tabs={[
              {
                 language: "Java",
                 title: "Shunting Yard & Evaluator",
                 code: `import java.util.Stack;

public class ExpressionParser {
    static int precedence(char ch) {
        if (ch == '+' || ch == '-') return 1;
        if (ch == '*' || ch == '/') return 2;
        if (ch == '^') return 3;
        return -1;
    }

    public static String infixToPostfix(String exp) {
        StringBuilder res = new StringBuilder();
        Stack<Character> st = new Stack<>();
        
        for (char c : exp.toCharArray()) {
            if (Character.isLetterOrDigit(c)) res.append(c);
            else if (c == '(') st.push(c);
            else if (c == ')') {
                while (!st.isEmpty() && st.peek() != '(') res.append(st.pop());
                st.pop(); // Pop '('
            } else {
                while (!st.isEmpty() && precedence(c) <= precedence(st.peek()))
                    res.append(st.pop());
                st.push(c);
            }
        }
        while (!st.isEmpty()) res.append(st.pop());
        return res.toString();
    }
    
    public static int evaluatePostfix(String exp) {
        Stack<Integer> st = new Stack<>();
        for (char c : exp.toCharArray()) {
            if (Character.isDigit(c)) st.push(c - '0');
            else {
                int v1 = st.pop(), v2 = st.pop(); // Order matters!
                switch(c) {
                    case '+': st.push(v2 + v1); break;
                    case '-': st.push(v2 - v1); break;
                    case '*': st.push(v2 * v1); break;
                    case '/': st.push(v2 / v1); break;
                }
            }
        }
        return st.pop();
    }
}`
              }
           ]} />
        </div>
        
        <div>
           <h3 className="text-[#00f5ff] text-2xl font-bold mb-4">Recursion Architecture</h3>
           <ProTip>
             <HighlightText text="Recursion leverages the OS Call Stack. Each recursive call pushes a new state frame (local variables, return address). Without a reachable Base Case, the stack outgrows its memory limit, triggering a Stack Overflow." highlight={highlight} />
           </ProTip>
        </div>
      </div>
    )
  },
  {
    id: "queues-priority",
    title: "Queues & Variations",
    icon: <AlignLeft />,
    searchContent: "queues concept implementation operations dequeue priority queues circular applications fifo",
    render: (highlight) => (
      <div className="space-y-12">
        <div>
           <h3 className="text-[#00f5ff] text-2xl font-bold mb-4">Queues (FIFO)</h3>
           <p className="text-gray-300 mb-4">
             <HighlightText text="First-In-First-Out processing. Data enters at the Rear and exits at the Front. Crucial for asynchronous data transfer, BFS Graph traversal, and job scheduling." highlight={highlight} />
           </p>
        </div>

        <div>
           <h4 className="text-[#00ff88] font-bold text-xl mb-4">Circular Queue (Array Implementation)</h4>
           <p className="text-sm text-gray-400 mb-4">A standard linear array queue suffers from 'false full' conditions when the front pointer moves forward. Circular Queues solve this using modulo arithmetic: <code>(rear + 1) % size</code>.</p>
           
           <CodeTabs tabs={[
              {
                 language: "C++",
                 title: "Circular Queue Array",
                 code: `class CircularQueue {
    int front, rear, size; int* arr;
public:
    CircularQueue(int s) : size(s), front(-1), rear(-1) { 
        arr = new int[s]; 
    }
    
    void enqueue(int val) {
        // Check for full condition
        if ((front == 0 && rear == size - 1) || (rear == (front - 1) % (size - 1))) {
            return; // Overflow
        }
        if (front == -1) front = rear = 0; // First element
        else if (rear == size - 1 && front != 0) rear = 0; // Wrap around
        else rear++;
        
        arr[rear] = val;
    }

    int dequeue() {
        if (front == -1) return -1; // Underflow
        int data = arr[front];
        
        if (front == rear) front = rear = -1; // Last element popped
        else if (front == size - 1) front = 0; // Wrap around
        else front++;
        
        return data;
    }
};`
              },
              {
                 language: "Java",
                 title: "Circular Queue Array",
                 code: `public class CircularQueue {
    int size, front, rear;
    int[] arr;

    public CircularQueue(int size) {
        this.size = size;
        this.front = this.rear = -1;
        arr = new int[size];
    }

    public void enqueue(int val) {
        if ((front == 0 && rear == size - 1) || (rear == (front - 1) % (size - 1))) return;
        if (front == -1) front = rear = 0;
        else if (rear == size - 1 && front != 0) rear = 0;
        else rear++;
        arr[rear] = val;
    }

    public int dequeue() {
        if (front == -1) return -1;
        int data = arr[front];
        if (front == rear) front = rear = -1;
        else if (front == size - 1) front = 0;
        else front++;
        return data;
    }
}`
              }
           ]} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
           <div className="bg-white/5 p-6 rounded-xl border border-white/10 shadow-lg">
              <h4 className="text-[#9d00ff] font-bold text-lg mb-2">Deque (Doubly Ended Queue)</h4>
              <p className="text-sm text-gray-400">
                <HighlightText text="Allows insertion and deletion at BOTH the Front and Rear. Usually implemented optimally using a Doubly Linked List." highlight={highlight} />
              </p>
           </div>
           <div className="bg-white/5 p-6 rounded-xl border border-white/10 shadow-lg">
              <h4 className="text-yellow-400 font-bold text-lg mb-2">Priority Queue</h4>
              <p className="text-sm text-gray-400">
                <HighlightText text="Dequeues elements based on assigned priority, not arrival time. Standard implementations utilize Binary Heaps to achieve O(log N) operations." highlight={highlight} />
              </p>
           </div>
        </div>
      </div>
    )
  },
  {
    id: "trees-advanced",
    title: "Trees, AVL & Threaded",
    icon: <ListTree />,
    searchContent: "trees types terminology binary representations traversal conversion general binary search threaded height balanced avl rotations",
    render: (highlight) => (
      <div className="space-y-12">
         <div>
            <h3 className="text-[#00f5ff] text-2xl font-bold mb-4">Tree Traversals & Structure</h3>
            <p className="text-gray-300 mb-4">
               <HighlightText text="A hierarchical data structure. Binary Search Trees (BST) organize data such that left children are strictly smaller, and right children are larger, halving search space per step." highlight={highlight} />
            </p>
            
            
            <CodeTabs tabs={[
              {
                 language: "C++",
                 title: "BST Core",
                 code: `struct TreeNode {
    int data; TreeNode *left, *right;
    TreeNode(int val) : data(val), left(nullptr), right(nullptr) {}
};

class BST {
    TreeNode* insertRec(TreeNode* root, int val) {
        if (!root) return new TreeNode(val);
        if (val < root->data) root->left = insertRec(root->left, val);
        else if (val > root->data) root->right = insertRec(root->right, val);
        return root;
    }
public:
    TreeNode* root = nullptr;
    void insert(int val) { root = insertRec(root, val); }
    
    void inorder(TreeNode* node) {
        if (node) {
            inorder(node->left);
            cout << node->data << " ";
            inorder(node->right);
        }
    }
};`
              },
              {
                 language: "Java",
                 title: "General to Binary Logic",
                 code: `/*
 * Conversion of General Tree to Binary Tree:
 * A node with N children in a general tree is mapped so that:
 * 1. The first child becomes the LEFT child in the Binary Tree.
 * 2. Its immediate next sibling becomes its RIGHT child.
 */
class GenNode {
    int data;
    GenNode firstChild, nextSibling;
}
// This maps directly to:
class BinNode {
    int data;
    BinNode left, right;
}`
              }
           ]} />
         </div>

         <div>
            <h3 className="text-[#00f5ff] text-2xl font-bold mb-4">Advanced Tree Variations</h3>
            <div className="space-y-6">
               <div className="bg-white/5 p-6 rounded-xl border border-white/10 shadow-lg">
                  <h4 className="font-bold text-white mb-2 text-[#00ff88]">Threaded Binary Tree</h4>
                  <p className="text-sm text-gray-400 mb-4">In standard trees, leaf nodes have NULL pointers representing wasted space. Threaded trees replace these with "threads" pointing to the Inorder Predecessor or Successor, completely eliminating the need for stack-based recursive traversal.</p>
               </div>
               
               <div className="bg-white/5 p-6 rounded-xl border border-white/10 shadow-lg">
                  <h4 className="font-bold text-white mb-2 text-[#9d00ff]">Height Balanced (AVL) Tree</h4>
                  <p className="text-sm text-gray-400 mb-4">If data is inserted sequentially (1, 2, 3...), a BST degrades into a linear $O(N)$ list. AVL Trees monitor the Balance Factor <code>(Height(Left) - Height(Right))</code>. If it exceeds 1 or drops below -1, it executes geometric rotations (LL, RR, LR, RL) to restore $O(log N)$ equilibrium.</p>
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
    searchContent: "heaps binary heap operations heap sort priority min max",
    render: (highlight) => (
      <div className="space-y-6">
        <h3 className="text-[#00f5ff] text-2xl font-bold mb-4">Binary Heaps</h3>
        <p className="text-gray-300 mb-4">
          <HighlightText text="A complete binary tree mapped efficiently to an array (no pointers needed). A Max-Heap guarantees the parent is strictly greater than its children. Crucial for Priority Queues and Heap Sort." highlight={highlight} />
        </p>
        
        <CodeTabs tabs={[
              {
                 language: "C++",
                 title: "Heapify & Heap Sort",
                 code: `void heapify(int arr[], int n, int i) {
    int largest = i; // Initialize largest as root
    int l = 2 * i + 1; // Left child index
    int r = 2 * i + 2; // Right child index

    if (l < n && arr[l] > arr[largest]) largest = l;
    if (r < n && arr[r] > arr[largest]) largest = r;

    // If largest is not root
    if (largest != i) {
        swap(arr[i], arr[largest]);
        heapify(arr, n, largest); // Recursively heapify affected sub-tree
    }
}

void heapSort(int arr[], int n) {
    // Build heap (rearrange array)
    for (int i = n / 2 - 1; i >= 0; i--) 
        heapify(arr, n, i);

    // Extract elements from heap one by one
    for (int i = n - 1; i > 0; i--) {
        swap(arr[0], arr[i]); // Move root to end
        heapify(arr, i, 0); // Call max heapify on the reduced heap
    }
}`
              },
              {
                 language: "Java",
                 title: "Heapify & Heap Sort",
                 code: `public class HeapSort {
    public void sort(int arr[]) {
        int n = arr.length;
        for (int i = n / 2 - 1; i >= 0; i--)
            heapify(arr, n, i);

        for (int i = n - 1; i > 0; i--) {
            int temp = arr[0]; arr[0] = arr[i]; arr[i] = temp;
            heapify(arr, i, 0);
        }
    }

    void heapify(int arr[], int n, int i) {
        int largest = i; 
        int l = 2 * i + 1; 
        int r = 2 * i + 2; 

        if (l < n && arr[l] > arr[largest]) largest = l;
        if (r < n && arr[r] > arr[largest]) largest = r;

        if (largest != i) {
            int swap = arr[i]; arr[i] = arr[largest]; arr[largest] = swap;
            heapify(arr, n, largest);
        }
    }
}`
              }
        ]} />
      </div>
    )
  },
  {
    id: "graphs-spanning",
    title: "Graphs & Spanning Trees",
    icon: <Share2 />,
    searchContent: "graphs background terminology representation sequential linked path matrix traversals bfs dfs spanning trees prims kruskal applications",
    render: (highlight) => (
      <div className="space-y-12">
        <div>
           <h3 className="text-[#00f5ff] text-2xl font-bold mb-4">Graph Foundations</h3>
           <p className="text-gray-300 mb-4">
             <HighlightText text="Graphs map complex relationships. Sequential representation relies on an Adjacency Matrix (V x V grid, ideal for dense networks). Linked representation uses an Adjacency List (Array of vectors, ideal for sparse networks like social media)." highlight={highlight} />
           </p>
        </div>

        <div>
           <h3 className="text-[#00f5ff] text-2xl font-bold mb-4">Traversals (BFS & DFS)</h3>
           <CodeTabs tabs={[
              {
                 language: "C++",
                 title: "BFS & DFS (Adjacency List)",
                 code: `#include <vector>
#include <queue>
#include <iostream>
using namespace std;

class Graph {
    int V; vector<vector<int>> adj; 
public:
    Graph(int V) : V(V) { adj.resize(V); }
    void addEdge(int u, int v) { adj[u].push_back(v); adj[v].push_back(u); }

    void BFS(int start) {
        vector<bool> visited(V, false); queue<int> q;
        visited[start] = true; q.push(start);
        
        while (!q.empty()) {
            int curr = q.front(); q.pop();
            cout << curr << " ";
            for (int neighbor : adj[curr]) {
                if (!visited[neighbor]) { visited[neighbor] = true; q.push(neighbor); }
            }
        }
    }

    void DFSUtil(int v, vector<bool>& visited) {
        visited[v] = true; cout << v << " ";
        for (int neighbor : adj[v])
            if (!visited[neighbor]) DFSUtil(neighbor, visited);
    }
    
    void DFS(int start) {
        vector<bool> visited(V, false);
        DFSUtil(start, visited);
    }
};`
              },
              {
                 language: "Java",
                 title: "BFS & DFS (Adjacency List)",
                 code: `import java.util.*;

public class Graph {
    private int V;
    private LinkedList<Integer> adj[];

    public Graph(int v) {
        V = v;
        adj = new LinkedList[v];
        for (int i = 0; i < v; ++i) adj[i] = new LinkedList();
    }

    public void addEdge(int v, int w) {
        adj[v].add(w); adj[w].add(v); 
    }

    public void BFS(int s) {
        boolean visited[] = new boolean[V];
        LinkedList<Integer> queue = new LinkedList<Integer>();
        visited[s] = true; queue.add(s);

        while (queue.size() != 0) {
            s = queue.poll();
            System.out.print(s + " ");
            for (int n : adj[s]) {
                if (!visited[n]) { visited[n] = true; queue.add(n); }
            }
        }
    }
    // DFS structure matches C++
}`
              }
           ]} />
        </div>

        <div>
           <h3 className="text-[#00f5ff] text-2xl font-bold mb-4">Minimum Spanning Trees (MST)</h3>
           <p className="text-gray-300 mb-4">
             <HighlightText text="A subgraph connecting all V vertices with exactly V-1 edges and the absolute minimum total weight. Used heavily in network routing and circuit design." highlight={highlight} />
           </p>
           <ul className="list-disc pl-5 text-gray-400 text-sm space-y-3 bg-black/30 p-4 rounded-lg border border-white/5">
              <li><strong>Prim's Algorithm:</strong> Greedy node-based approach. Starts at a root, explores the cheapest connected edge, adding nodes to the MST set until complete.</li>
              <li><strong>Kruskal's Algorithm:</strong> Greedy edge-based approach. Sorts all edges globally, then iteratively adds the cheapest edge provided it does not form a cycle (checked via a Disjoint Set Data Structure).</li>
           </ul>
        </div>
      </div>
    )
  },
  {
    id: "searching-sorting",
    title: "Searching & Sorting Engines",
    icon: <Target />,
    searchContent: "searching sorting linear binary bubble selection insertion quick merge divide conquer",
    render: (highlight) => (
      <div className="space-y-6">
           <ComplexityTable 
              title="Sorting Algorithm Master Sheet"
              cols={["Algorithm", "Time (Avg)", "Time (Worst)", "Space", "Stability"]}
              rows={[
                 { n: "Linear Search", ta: "O(N)", tw: "O(N)", s: "O(1)", st: "-" },
                 { n: "Binary Search", ta: "O(log N)", tw: "O(log N)", s: "O(1)", st: "-" },
                 { n: "Bubble Sort", ta: "O(N²)", tw: "O(N²)", s: "O(1)", st: "Stable" },
                 { n: "Selection Sort", ta: "O(N²)", tw: "O(N²)", s: "O(1)", st: "Unstable" },
                 { n: "Insertion Sort", ta: "O(N²)", tw: "O(N²)", s: "O(1)", st: "Stable" },
                 { n: "Merge Sort", ta: "O(N log N)", tw: "O(N log N)", s: "O(N)", st: "Stable" },
                 { n: "Quick Sort", ta: "O(N log N)", tw: "O(N²)", s: "O(log N)", st: "Unstable" },
              ]}
           />
           
           <CodeTabs tabs={[
              {
                 language: "C++",
                 title: "Quick Sort (Partitioning)",
                 code: `int partition(int arr[], int low, int high) {
    int pivot = arr[high]; // Pivot at end
    int i = (low - 1); // Index of smaller element

    for (int j = low; j <= high - 1; j++) {
        if (arr[j] < pivot) {
            i++; swap(arr[i], arr[j]);
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
                 title: "Merge Sort (Merging Logic)",
                 code: `void merge(int arr[], int l, int m, int r) {
    int n1 = m - l + 1, n2 = r - m;
    int L[] = new int[n1], R[] = new int[n2];
    
    for (int i = 0; i < n1; ++i) L[i] = arr[l + i];
    for (int j = 0; j < n2; ++j) R[j] = arr[m + 1 + j];
    
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) { arr[k] = L[i]; i++; }
        else { arr[k] = R[j]; j++; }
        k++;
    }
    while (i < n1) { arr[k] = L[i]; i++; k++; }
    while (j < n2) { arr[k] = R[j]; j++; k++; }
}`
              }
           ]} />
      </div>
    )
  },
  {
    id: "advanced-hashing",
    title: "Hashing & Cache-Aware Trees",
    icon: <Database />,
    searchContent: "hash tables collision resolution chaining open addressing b-trees splay trees load factor rehashing van emde boas",
    render: (highlight) => (
      <div className="space-y-12">
        {/* Hashing */}
        <div>
           <h3 className="text-[#00f5ff] text-2xl font-bold mb-4 flex items-center gap-2"><Key className="text-yellow-400"/> Hash Tables & Collisions</h3>
           <p className="text-gray-300 mb-4">
             <HighlightText text="Hashing condenses massive data universes into a small, finite array index, targeting O(1) retrieval speed. When algorithms produce the same index for different keys, a Collision occurs." highlight={highlight} />
           </p>

           <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-lg">
                 <h4 className="font-bold text-white mb-2 text-[#00f5ff]">Hash Functions</h4>
                 <ul className="text-sm text-gray-400 list-disc pl-4 space-y-1">
                    <li><strong>Division:</strong> <code>index = key % size</code>.</li>
                    <li><strong>Mid Square:</strong> Square key, isolate the middle digits.</li>
                    <li><strong>Folding:</strong> Segment the key into equal pieces and sum them.</li>
                 </ul>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-lg">
                 <h4 className="font-bold text-white mb-2 text-[#00ff88]">Collision Resolution</h4>
                 <ul className="text-sm text-gray-400 list-disc pl-4 space-y-1">
                    <li><strong>Chaining:</strong> Indexes hold a pointer to a Linked List of overflow entries.</li>
                    <li><strong>Open Addressing:</strong> Sequentially probe array slots (Linear: +1, Quadratic: +i²) until an empty bucket is found.</li>
                 </ul>
              </div>
           </div>
           
           <ProTip><strong>Load Factor (α) & Rehashing:</strong> <code>α = N / Size</code>. If α exceeds 0.75, performance degrades. We dynamically allocate a larger array and mathematically rehash all old elements to the new space.</ProTip>

           <CodeTabs tabs={[
              {
                 language: "C++",
                 title: "Hash Table (Separate Chaining)",
                 code: `#include <list>
#include <vector>
using namespace std;

class HashTable {
    int BUCKET; vector<list<int>> table;
public:
    HashTable(int V) : BUCKET(V) { table.resize(V); }

    int hashFunction(int x) { return (x % BUCKET); }

    void insertItem(int key) {
        int index = hashFunction(key);
        table[index].push_back(key); // Add to end of list
    }

    void deleteItem(int key) {
        int index = hashFunction(key);
        list<int>::iterator i;
        for (i = table[index].begin(); i != table[index].end(); i++) {
            if (*i == key) break;
        }
        if (i != table[index].end()) table[index].erase(i);
    }
};`
              },
              {
                 language: "Java",
                 title: "Hash Table (Separate Chaining)",
                 code: `import java.util.LinkedList;

class HashTable {
    private LinkedList<Integer>[] table;
    private int size;

    @SuppressWarnings("unchecked")
    public HashTable(int size) {
        this.size = size;
        table = new LinkedList[size];
        for (int i = 0; i < size; i++) table[i] = new LinkedList<>();
    }

    private int hash(int key) { return key % size; }

    public void insert(int key) {
        int index = hash(key);
        if(!table[index].contains(key)) table[index].add(key);
    }

    public boolean search(int key) {
        return table[hash(key)].contains(key);
    }
}`
              }
           ]} />
        </div>

        {/* Dynamic & Cache Aware Trees */}
        <div>
           <h3 className="text-[#00f5ff] text-2xl font-bold mb-4 flex items-center gap-2"><Server className="text-purple-400"/> Dynamic & Cache-Aware Structures</h3>
           
           <div className="space-y-6">
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 shadow-lg">
                 <h4 className="text-xl font-bold text-[#00ff88] mb-2">Splay Trees</h4>
                 <p className="text-sm text-gray-400">
                    <HighlightText text="A self-adjusting BST. Whenever an element is accessed, inserted, or deleted, it is 'Splayed' (rotated) directly to the root. This capitalizes on the principle of Locality of Reference, making it exceptionally fast for data cache scenarios." highlight={highlight} />
                 </p>
              </div>

              <div className="bg-white/5 p-6 rounded-xl border border-white/10 shadow-lg">
                 <h4 className="text-xl font-bold text-[#9d00ff] mb-2">B-Trees (Cache-Aware)</h4>
                 <p className="text-sm text-gray-400 mb-4">
                    <HighlightText text="Fetching a node from a disk drive takes thousands of times longer than fetching from RAM. Binary trees are tall and force many disk reads. B-Trees are extremely 'fat' trees. One node matches the size of a disk block and holds hundreds of keys, collapsing the tree height to 2 or 3 levels and minimizing I/O bottlenecks." highlight={highlight} />
                 </p>
                 
              </div>
              
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 shadow-lg">
                 <h4 className="text-xl font-bold text-yellow-400 mb-2">van Emde Boas (vEB) Trees</h4>
                 <p className="text-sm text-gray-400">
                    <HighlightText text="A phenomenally fast structure for integer processing. By recursively dividing the integer universe U into smaller clusters, operations execute in O(log log U) time. Highly applicable to router IP table lookups." highlight={highlight} />
                 </p>
              </div>
           </div>
        </div>
      </div>
    )
  }
];

// --- 3. MAIN PAGE COMPONENT ---
const Docs = () => {
  const [activeSection, setActiveSection] = useState("visualizer-guide");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
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

  const filteredSections = DOC_SECTIONS.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.searchContent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setIsMobileSidebarOpen(false); 
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
      <GlobalRibbon />
      
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00f5ff] to-[#9d00ff] z-50 origin-left" />

      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
         <button 
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="w-14 h-14 bg-gradient-to-br from-[#00f5ff] to-[#9d00ff] rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,245,255,0.4)] border border-white/20"
         >
            {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      <div className="pt-28 container mx-auto px-4 max-w-7xl flex flex-col lg:flex-row gap-8 relative">
        
        {/* SIDEBAR */}
        <aside className={`
           fixed lg:sticky top-0 lg:top-28 left-0 h-screen lg:h-[calc(100vh-120px)] w-72 lg:w-72 shrink-0 z-40
           transform transition-transform duration-300 ease-in-out lg:translate-x-0
           ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
           <div className="backdrop-blur-xl bg-[#0a0a1a]/95 lg:bg-[#0a0a1a]/80 border-r lg:border border-white/10 lg:rounded-2xl p-6 lg:p-4 h-full flex flex-col shadow-2xl relative overflow-hidden pt-24 lg:pt-4">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent opacity-20" />
              
              <div className="relative mb-6">
                 <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                 <input 
                    type="text" 
                    placeholder="Search curriculum..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-white focus:border-[#00f5ff] outline-none transition-colors placeholder:text-gray-600 shadow-inner"
                 />
                 {searchQuery && (
                   <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-gray-500 hover:text-white">
                     <X size={14} />
                   </button>
                 )}
              </div>

              <nav className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                 {filteredSections.map((sec) => (
                    <button
                       key={sec.id}
                       onClick={() => scrollToSection(sec.id)}
                       className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                          activeSection === sec.id 
                          ? "bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/20" 
                          : "text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent"
                       }`}
                    >
                       {activeSection === sec.id && (
                          <motion.div layoutId="activeGlow" className="absolute inset-0 bg-[#00f5ff]/5" />
                       )}
                       <span className={`relative z-10 ${activeSection === sec.id ? "text-[#00f5ff]" : "text-gray-500 group-hover:text-gray-300"}`}>
                          {React.cloneElement(sec.icon as React.ReactElement, { size: 18 })}
                       </span>
                       <span className="relative z-10 text-left">{sec.title}</span>
                       {activeSection === sec.id && <ChevronRight className="ml-auto w-4 h-4 relative z-10" />}
                    </button>
                 ))}
              </nav>

              <div className="pt-4 mt-4 border-t border-white/10">
                 <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                    <span>AlgoLib v5.0 Master Syllabus</span>
                 </div>
              </div>
           </div>
        </aside>

        {isMobileSidebarOpen && (
           <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
           />
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 pb-32 lg:pb-20 pt-4 lg:pt-0">
           <AnimatePresence mode="wait">
              <div className="space-y-24">
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
                             {React.cloneElement(section.icon as React.ReactElement, { size: 36 })}
                          </div>
                          <div>
                             <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{section.title}</h2>
                             <div className="flex gap-2 mt-3">
                                <SectionBadge>Curriculum Standard</SectionBadge>
                             </div>
                          </div>
                       </div>
                       
                       <div className="prose prose-invert prose-sm md:prose-base max-w-none text-gray-300 leading-relaxed">
                          {section.render(searchQuery)}
                       </div>
                    </motion.section>
                 )) : (
                    <div className="flex flex-col items-center justify-center py-32 opacity-50 border border-dashed border-white/10 rounded-2xl bg-white/5">
                       <Search size={48} className="mb-4 text-gray-600" />
                       <p className="text-gray-400 font-mono text-center px-4">No topics found for "{searchQuery}"</p>
                       <button onClick={() => setSearchQuery("")} className="mt-4 text-sm text-[#00f5ff] hover:underline flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg transition-colors hover:bg-white/10">
                          <RefreshCw size={14}/> Reset Curriculum Search
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