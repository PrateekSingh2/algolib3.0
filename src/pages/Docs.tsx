import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { 
  BookOpen, Search, Code2, Hash, ChevronRight, Terminal, 
  Cpu, Layers, Network, GitCommit, Copy, Check 
} from "lucide-react";
import Navbar from "@/components/Navbar";

// --- 1. REUSABLE BACKGROUND COMPONENTS (To ensure consistency) ---
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
        // Mouse Interaction
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
        // Connections
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

// --- 2. DOCUMENTATION DATA ---
const DOC_SECTIONS = [
  {
    id: "intro",
    title: "System Overview",
    icon: <Terminal className="w-4 h-4" />,
    content: (
      <>
        <p className="mb-4">
          <strong className="text-[#00f5ff]">AlgoLib</strong> is a high-performance algorithmic visualization engine designed for the next generation of engineers. It provides real-time, interactive simulations of complex data structures and algorithms using a hardware-accelerated rendering pipeline.
        </p>
        <p>
          The system operates on a React-based core with Framer Motion handling physics-based transitions.
        </p>
      </>
    )
  },
  {
    id: "linked-list",
    title: "Linked List Engine",
    icon: <GitCommit className="w-4 h-4" />,
    content: (
      <>
        <p className="mb-4">
          The Linked List module visualizes linear data storage where elements are not stored in contiguous memory locations.
        </p>
        <h3 className="text-lg font-bold text-white mb-2 mt-4 flex items-center gap-2"><ChevronRight className="text-[#00f5ff]" size={16}/> Key Features</h3>
        <ul className="list-disc pl-5 space-y-1 text-gray-400 mb-4">
          <li><span className="text-gray-300">Singly & Doubly</span> list toggling.</li>
          <li>Real-time pointer traversal animation.</li>
          <li>Dynamic memory allocation visualization (Phantom Nodes).</li>
        </ul>
      </>
    ),
    code: `// Node Structure
struct Node {
    int data;
    Node* next;
    Node* prev; // Doubly only
};`
  },
  {
    id: "stack-queue",
    title: "Stack & Queue",
    icon: <Layers className="w-4 h-4" />,
    content: (
      <>
        <p className="mb-4">
          Memory stack visualizations adhering to <span className="text-[#9d00ff]">LIFO</span> (Last In First Out) and Queue visualizations adhering to <span className="text-[#00ff88]">FIFO</span> (First In First Out) principles.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
           <div className="p-4 rounded border border-white/10 bg-white/5">
              <h4 className="text-[#00f5ff] font-mono font-bold text-xs mb-2">STACK OPERATIONS</h4>
              <p className="text-[10px] text-gray-400">Push: O(1) <br/> Pop: O(1) <br/> Peek: O(1)</p>
           </div>
           <div className="p-4 rounded border border-white/10 bg-white/5">
              <h4 className="text-[#00ff88] font-mono font-bold text-xs mb-2">QUEUE OPERATIONS</h4>
              <p className="text-[10px] text-gray-400">Enqueue: O(1) <br/> Dequeue: O(1) <br/> Front: O(1)</p>
           </div>
        </div>
      </>
    )
  },
  {
    id: "sorting",
    title: "Sorting Algorithms",
    icon: <Cpu className="w-4 h-4" />,
    content: (
      <>
        <p className="mb-4">
          A comparative visualizer for standard sorting algorithms. The engine highlights comparison operations (Blue), swaps (Red), and sorted elements (Green) in real-time.
        </p>
        <p className="mb-2 text-gray-300 font-bold">Supported Algorithms:</p>
        <div className="flex flex-wrap gap-2 mb-4">
           {["Bubble Sort", "Selection Sort", "Insertion Sort", "Merge Sort", "Quick Sort"].map(tag => (
             <span key={tag} className="px-2 py-1 rounded bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] text-[10px] font-mono">
               {tag}
             </span>
           ))}
        </div>
      </>
    ),
    code: `// QuickSort Partition Logic
int partition(arr[], low, high) {
    pivot = arr[high];
    i = (low - 1);
    for (j = low; j <= high - 1; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return (i + 1);
}`
  },
  {
    id: "graphs",
    title: "Graph Theory",
    icon: <Network className="w-4 h-4" />,
    content: (
      <>
        <p className="mb-4">
          Interactive graph node editor and pathfinding visualizer. Users can draw nodes, connect edges with weights, and execute traversal algorithms.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-gray-400 mb-4">
          <li><strong className="text-white">BFS:</strong> Breadth-First Search for unweighted shortest paths.</li>
          <li><strong className="text-white">Dijkstra:</strong> Shortest path finding for weighted graphs.</li>
        </ul>
      </>
    )
  }
];

// --- 3. UI HELPER: CODE BLOCK ---
const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mt-4 mb-6 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a1a]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        </div>
        <button 
          onClick={handleCopy}
          className="text-gray-500 hover:text-[#00f5ff] transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="p-4 text-xs md:text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

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

  // Filter sections based on search
  const filteredSections = DOC_SECTIONS.filter(
    s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
         s.id.includes(searchQuery.toLowerCase())
  );

  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-[#00f5ff]/30">
      <CyberSpaceBackground />
      <Navbar />

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[#00f5ff] origin-left z-[100]"
        style={{ scaleX }}
      />

      <div className="pt-28 md:pt-36 pb-20 container mx-auto px-4 max-w-7xl flex flex-col md:flex-row gap-8">
        
        {/* --- LEFT SIDEBAR (STICKY) --- */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-32 space-y-6">
            
            {/* Search Box */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00f5ff] to-[#9d00ff] rounded-lg opacity-20 group-hover:opacity-50 blur transition duration-500" />
              <div className="relative flex items-center bg-[#050510] border border-white/10 rounded-lg px-3 py-2.5">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input 
                  type="text" 
                  placeholder="SEARCH DOCS..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-mono text-white w-full placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-xs font-mono transition-all duration-200 border-l-2 ${
                    activeSection === section.id 
                      ? "bg-[#00f5ff]/10 text-[#00f5ff] border-[#00f5ff]" 
                      : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {section.icon}
                  <span className="uppercase tracking-wider truncate">{section.title}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 rounded-xl bg-[#0a0a1a]/50 border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    DOCS_VERSION: 2.0.4
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00f5ff] to-[#9d00ff] w-3/4" />
                </div>
            </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {filteredSections.length > 0 ? (
              <div className="space-y-12">
                {filteredSections.map((section, index) => (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="scroll-mt-32"
                  >
                    {/* Section Header */}
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
                       <div className="p-3 rounded-lg bg-[#00f5ff]/10 border border-[#00f5ff]/20 text-[#00f5ff]">
                          {React.cloneElement(section.icon as React.ReactElement, { size: 24 })}
                       </div>
                       <h2 className="text-3xl font-black tracking-tight text-white">
                          {section.title}
                       </h2>
                    </div>

                    {/* Content Body */}
                    <div className="text-sm md:text-base text-gray-400 leading-7 font-light">
                       {section.content}
                    </div>

                    {/* Code Snippet (If exists) */}
                    {section.code && <CodeBlock code={section.code} />}
                  </motion.section>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                 <Hash size={48} className="mb-4 opacity-20" />
                 <p className="font-mono text-sm">NO_DATA_FOUND</p>
              </div>
            )}
          </AnimatePresence>

          {/* Footer for Docs */}
          <div className="mt-20 pt-8 border-t border-white/10 flex justify-between items-center text-xs font-mono text-gray-600">
             <span>LAST_UPDATED: {new Date().toLocaleDateString()}</span>
             <a href="https://mail.google.com/mail/u/0/?view=cm&fs=1&to=v.rajawatprateeksingh@gmail.com&su=Inquiry%20from%20Portfolio&body=Hello%20there,%20I%20saw%20your%20site..." target="_blank" className="hover:text-[#00f5ff] transition-colors">REPORT_ISSUE</a>
          </div>
        </main>

      </div>
    </div>
  );
};

export default Docs;