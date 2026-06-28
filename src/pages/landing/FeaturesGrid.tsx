import React, { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Network, TerminalSquare, BrainCircuit, Bot,
  Trophy, BookText, ArrowRight, Zap, ListTodo,
  MessageCircle
} from "lucide-react";

const SpotlightCard = ({ children, className = "", glow = "emerald", solid = false }: {
  children: React.ReactNode; className?: string; glow?: string; solid?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = React.useState(0);
  const colors: Record<string, string> = {
    emerald: "16,185,129", violet: "139,92,246", blue: "59,130,246", amber: "245,158,11"
  };
  const rgb = colors[glow] || colors.emerald;

  return (
    <div
      ref={ref}
      onMouseMove={e => {
        const r = ref.current!.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-[36px] ${solid ? 'text-white' : 'bg-white dark:bg-white/[0.02] text-slate-800 dark:text-white'} border-2 border-dashed transition-all duration-500 hover:shadow-[0_16px_48px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] group ${className}`}
      style={{
        borderColor: solid ? `rgb(${rgb})` : `rgba(${rgb}, 0.25)`,
        backgroundColor: solid ? `rgb(${rgb})` : undefined
      }}
    >
      {solid && <Bot className="absolute -bottom-10 -right-10 w-64 h-64 text-white opacity-10 rotate-12 pointer-events-none" />}
      {!solid && <div className="absolute inset-0 opacity-5 dark:opacity-[0.03] pointer-events-none" style={{ backgroundColor: `rgb(${rgb})` }} />}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out opacity-0 dark:opacity-0"
        style={{
          opacity,
          background: solid
            ? `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.25), transparent 40%)`
            : `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(${rgb},0.15), transparent 40%)`
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

const features = [
  {
    icon: Network, title: "Visualizer", label: "EXECUTION ENGINE",
    desc: "Watch data structures animate node-by-node with our powerful step execution engine.",
    path: "/visualizer", glow: "emerald", accent: "#10b981", tag: "Live Steps",
    solid: false,
    preview: (
      <div className="flex flex-wrap gap-2 w-full">
        {/* Linked List */}
        <div className="w-full flex items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
          <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
            <div className="px-2 py-1 bg-white dark:bg-slate-900 rounded shadow-sm border border-emerald-200 dark:border-emerald-700/50">Head</div>
            <span>→</span>
            <div className="px-2 py-1 bg-white dark:bg-slate-900 rounded shadow-sm border border-emerald-200 dark:border-emerald-700/50">Node A</div>
            <span>→</span>
            <div className="px-2 py-1 bg-white dark:bg-slate-900 rounded shadow-sm border border-emerald-200 dark:border-emerald-700/50">Null</div>
          </div>
        </div>
        {/* Graph and Tree */}
        <div className="flex w-full gap-2">
          <div className="flex-1 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center relative h-16 shadow-sm">
            {/* Mini Tree */}
            <div className="w-3 h-3 rounded-full bg-emerald-500 absolute top-2 shadow-sm z-10"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-400 absolute bottom-2 left-3 shadow-sm z-10"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-400 absolute bottom-2 right-3 shadow-sm z-10"></div>
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line x1="50%" y1="25%" x2="30%" y2="75%" stroke="#10b981" strokeWidth="1.5" opacity="0.5" />
              <line x1="50%" y1="25%" x2="70%" y2="75%" stroke="#10b981" strokeWidth="1.5" opacity="0.5" />
            </svg>
          </div>
          <div className="flex-1 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex flex-col justify-end relative h-16 gap-1 shadow-sm px-4">
            {/* Mini Stack */}
            <div className="w-full h-2.5 bg-emerald-300 dark:bg-emerald-700 rounded-sm"></div>
            <div className="w-full h-2.5 bg-emerald-400 dark:bg-emerald-600 rounded-sm"></div>
            <div className="w-full h-2.5 bg-emerald-500 dark:bg-emerald-500 rounded-sm"></div>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: TerminalSquare, title: "Compiler", label: "MULTI-LANGUAGE",
    desc: "Execute C, C++, Java, Python and JS in milliseconds with real-time output.",
    path: "/compiler", glow: "violet", accent: "#8b5cf6", tag: "5 Languages",
    solid: false,
    preview: (
      <div className="w-full flex flex-col rounded-xl overflow-hidden border-2 border-slate-200 dark:border-white/10 bg-[#0d1117] shadow-xl text-left">
        <div className="flex bg-[#161b22] px-2 py-1.5 gap-1.5 text-[9px] font-bold text-slate-400 border-b border-white/5">
          <div className="px-2 py-1 bg-[#0d1117] text-slate-200 rounded-md border border-white/5 border-b-transparent relative top-[1px]">main.cpp</div>
          <div className="px-2 py-1 hover:text-slate-300 rounded-md cursor-pointer">Solution.java</div>
        </div>
        <div className="flex">
          <div className="font-mono text-[10px] p-2 leading-relaxed text-left text-slate-300 w-full overflow-hidden whitespace-pre">
            <span className="text-[#ff7b72]">#include</span> <span className="text-[#a5d6ff]">&lt;iostream&gt;{'\n'}</span>
            <span className="text-[#ff7b72]">using namespace</span> std; {'\n'}
            <span className="text-[#ff7b72]">int</span> <span className="text-[#d2a8ff]">main</span>(){"{\n"}
            <span className="text-[#79c0ff]">    cout</span> &lt;&lt; <span className="text-[#a5d6ff]">"Welcome to AlgoLib!"</span>;{"\n"}
            <span className="text-[#79c0ff]">    return</span> 0;{"\n}"}
          </div>
        </div>
        <div className="bg-[#161b22] border-t border-white/5 px-2 py-1.5">
          <div className="text-[8px] text-slate-500 font-bold uppercase mb-0.5 flex justify-between"><span>Output</span><span className="text-emerald-400">Run Succesful (12ms)</span></div>
          <div className="font-mono text-[9px] text-slate-300">Welcome to AlgoLib!</div>
        </div>
      </div>
    )
  },
  {
    icon: MessageCircle, title: "Community", label: "Forum",
    desc: "Discuss algorithms, share knowledge, and connect with other programmers.",
    path: "/community", glow: "blue", accent: "#3b82f6", tag: "Discuss",
    solid: false,
    requiresAuth: true,
    preview: (
      <div className="flex flex-col gap-2 w-full text-left relative">
        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative z-10">
          <div className="flex gap-2">
            <div className="flex flex-col items-center gap-0.5 mt-0.5">
              <div className="w-4 h-4 rounded flex items-center justify-center bg-blue-50 text-blue-600 text-[8px] font-black">▲</div>
              <span className="text-[9px] font-bold text-slate-500">142</span>
            </div>
            <div className="flex-1">
              <h4 className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight mb-1">Optimal approach for DP on Trees?</h4>
              <p className="text-[9px] text-slate-500 line-clamp-1 mb-1.5">I'm struggling with the space complexity of tree DP...</p>
              <div className="flex gap-1">
                <span className="text-[7px] font-bold px-1.5 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">DP</span>
                <span className="text-[7px] font-bold px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">Trees</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm opacity-60 scale-[0.95] -translate-y-1 relative z-0">
          <div className="flex gap-2">
            <div className="flex flex-col items-center gap-0.5 mt-0.5">
              <div className="w-4 h-4 rounded flex items-center justify-center bg-slate-50 text-slate-400 text-[8px] font-black">▲</div>
              <span className="text-[9px] font-bold text-slate-500">89</span>
            </div>
            <div className="flex-1">
              <h4 className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight mb-1">Graph Traversal: BFS vs DFS</h4>
              <p className="text-[9px] text-slate-500 line-clamp-1">When should I prioritize breadth-first over depth-first?</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Bot, title: "Vectoris", label: "AI ASSISTANT",
    desc: "Your personal algorithmic AI assistant to help you debug and optimize code instantly.",
    path: "/vectoris", glow: "violet", accent: "#8b5cf6", tag: "AI Powered",
    solid: false,
    requiresAuth: true,
    preview: (
      <div className="w-full flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f1117] shadow-lg text-left">
        <div className="flex items-center gap-2 p-2 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#161b22]">
          <div className="w-5 h-5 rounded flex items-center justify-center bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400"><Bot size={12} /></div>
          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Vectoris AI</span>
          <span className="text-[7px] font-black px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full ml-auto uppercase tracking-wider">Online</span>
        </div>
        <div className="p-2.5 flex flex-col gap-2 font-nunito text-[10px]">
          <div className="flex gap-1.5 items-end justify-end">
            <div className="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 rounded-xl rounded-br-sm px-2.5 py-1.5 max-w-[85%] shadow-sm leading-snug">
              How do I detect a cycle in a Directed Graph?
            </div>
          </div>
          <div className="flex gap-1.5 items-start">
            <div className="w-4 h-4 rounded-full bg-violet-500 flex-shrink-0 flex items-center justify-center mt-1"><Bot size={8} className="text-white" /></div>
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 rounded-xl rounded-bl-sm px-2.5 py-1.5 max-w-[85%] shadow-sm leading-relaxed">
              Use <strong className="text-violet-600 dark:text-violet-400">Kahn's Algorithm (BFS)</strong> or <strong className="text-violet-600 dark:text-violet-400">DFS</strong> with a recursion stack.
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: BookText, title: "Notes", label: "LEARN",
    desc: "Comprehensive Programming, OOPs & DSA notes.",
    path: "/notes", glow: "amber", accent: "#f59e0b", tag: "Theory",
    solid: false,
    requiresAuth: true,
    preview: (
      <div className="w-full flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg h-32 text-left">
        <div className="w-1/3 bg-slate-50 dark:bg-black/20 border-r border-slate-200 dark:border-white/5 p-2 flex flex-col gap-1">
          <div className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 pl-1">Chapters</div>
          <div className="px-1.5 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md text-[9px] font-bold border-l-2 border-amber-500">1. Graphs</div>
          <div className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[9px] font-medium">2. Trees</div>
          <div className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[9px] font-medium">3. DP</div>
        </div>
        <div className="w-2/3 p-3 flex flex-col gap-1.5 overflow-hidden relative">
          <h1 className="text-[14px] font-black text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-1">Graph Theory</h1>
          <p className="text-[9px] text-slate-600 dark:text-slate-400 leading-relaxed">
            A graph is a non-linear data structure consisting of nodes and edges.
          </p>
          <div className="bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded p-1.5 text-[8px] font-mono text-slate-700 dark:text-slate-300 mt-1">
            <span className="text-pink-500 dark:text-pink-400">G</span> = (V, E)
          </div>
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white dark:from-slate-900 to-transparent"></div>
        </div>
      </div>
    )
  },
  {
    icon: ListTodo, title: "DSA Sheets", label: "PRACTICE",
    desc: "Proper roadmap for DSA practice with questions.",
    path: "/sheets", glow: "emerald", accent: "#10b981", tag: "Roadmap",
    solid: false,
    requiresAuth: true,
    preview: (
      <div className="w-full flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg text-left">
        <div className="bg-[linear-gradient(135deg,#10b981_0%,#059669_100%)] text-white p-2.5 flex justify-between items-center">
          <div>
            <h4 className="text-[11px] font-black">AlgoLib DSA Sheet</h4>
            <div className="text-[8px] font-medium opacity-80 mt-0.5">Progress: 45/190</div>
          </div>
          <div className="w-8 h-8 rounded-full border-[3px] border-emerald-400/50 flex items-center justify-center text-[9px] font-bold">24%</div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-2 border-b border-slate-100 dark:border-white/5 bg-emerald-50/50 dark:bg-emerald-500/5">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white"><span className="text-[8px]">✓</span></div>
              <span className="text-[10px] font-bold text-slate-800 dark:text-white">Two Sum</span>
            </div>
            <span className="text-[7px] font-bold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded">Easy</span>
          </div>
          <div className="flex items-center justify-between p-2 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
              <span className="text-[10px] font-bold text-slate-800 dark:text-white">Merge Intervals</span>
            </div>
            <span className="text-[7px] font-bold px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded">Med</span>
          </div>
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
              <span className="text-[10px] font-bold text-slate-800 dark:text-white">LRU Cache</span>
            </div>
            <span className="text-[7px] font-bold px-1.5 py-0.5 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded">Hard</span>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Trophy, title: "Contests", label: "ARENA",
    desc: "Live coding contests with real-time leaderboards.",
    path: "/contests", glow: "amber", accent: "#f59e0b", tag: "Ranked",
    solid: false,
    requiresAuth: true,
    preview: (
      <div className="w-full flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg text-left">
        <div className="bg-[linear-gradient(135deg,#f59e0b_0%,#d97706_100%)] p-2.5 text-white text-center relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20"><Trophy size={40} /></div>
          <h4 className="text-[11px] font-black uppercase tracking-widest relative z-10">Weekly Arena 142</h4>
          <div className="text-[9px] font-bold opacity-90 relative z-10 mt-0.5 flex justify-center items-center gap-1"><Zap size={10} /> Ends in: 01:24:09</div>
        </div>
        <div className="p-1.5">
          <div className="flex items-center p-1.5 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 mb-1">
            <div className="w-6 text-[10px] font-black text-amber-600 dark:text-amber-400 text-center">#1</div>
            <div className="flex-1 flex items-center gap-1.5 pl-1">
              <div className="w-3.5 h-3.5 rounded bg-rose-500 shadow-sm"></div>
              <span className="text-[10px] font-bold text-slate-800 dark:text-white">tourist</span>
            </div>
            <div className="w-10 text-right text-[10px] font-bold text-amber-600 dark:text-amber-400">1200</div>
          </div>
          <div className="flex items-center p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <div className="w-6 text-[10px] font-bold text-slate-400 text-center">#2</div>
            <div className="flex-1 flex items-center gap-1.5 pl-1">
              <div className="w-3.5 h-3.5 rounded bg-blue-500 shadow-sm"></div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">benq</span>
            </div>
            <div className="w-10 text-right text-[10px] font-bold text-slate-600 dark:text-slate-300">1150</div>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: BrainCircuit, title: "Quiz Panel", label: "TEST",
    desc: "Create or join quizzes to test your algorithmic knowledge.",
    path: "/quizzes", glow: "violet", accent: "#8b5cf6", tag: "Interactive",
    solid: false,
    requiresAuth: true,
    preview: (
      <div className="w-full flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg text-left p-3.5">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[8px] font-black px-1.5 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded uppercase tracking-wider">Question 4 of 10</span>
          <div className="flex items-center gap-0.5 text-[10px] font-bold text-rose-500"><Zap size={10} /> 14s</div>
        </div>
        <h4 className="text-[12px] font-black text-slate-800 dark:text-white mb-3 leading-snug">
          What is the worst-case time complexity of QuickSort?
        </h4>
        <div className="flex flex-col gap-1.5">
          <div className="p-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-colors cursor-pointer">
            A) O(n log n)
          </div>
          <div className="p-2 rounded-lg border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex justify-between items-center shadow-sm cursor-pointer">
            <span>B) O(n²)</span>
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center"><span className="text-[8px]">✓</span></div>
          </div>
        </div>
      </div>
    )
  }
];

interface FeaturesGridProps {
  onRequireAuth?: () => void;
}

const FeaturesGrid: React.FC<FeaturesGridProps> = ({ onRequireAuth }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [activeIdx, setActiveIdx] = useState(0); // Default to Vectoris
  const activeFeature = features[activeIdx];

  const renderShowcase = (feature: typeof features[0]) => (
    <SpotlightCard glow={feature.glow} solid={feature.solid} className="w-full h-full min-h-[480px] flex flex-col shadow-2xl backdrop-blur-xl">
      {/* Mac-like Top Bar */}
      <div className="px-5 py-3.5 border-b flex items-center gap-2.5 bg-white/40 dark:bg-black/20 backdrop-blur-md" style={{ borderColor: feature.solid ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
        <div className="flex gap-1.5 hover:gap-2 transition-all duration-300 group">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[inset_0px_1px_2px_rgba(255,255,255,0.2)] flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 text-[6px] font-black text-black/50 transition-opacity">x</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[inset_0px_1px_2px_rgba(255,255,255,0.2)] flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 text-[6px] font-black text-black/50 transition-opacity">-</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[inset_0px_1px_2px_rgba(255,255,255,0.2)] flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 text-[6px] font-black text-black/50 transition-opacity">+</div>
          </div>
        </div>
        <div className="ml-2 text-[10px] font-mono font-bold tracking-[0.2em] uppercase opacity-40 flex-1 text-center pr-12" style={{ color: feature.solid ? 'white' : 'inherit' }}>
          algo_engine • {feature.label.toLowerCase()}
        </div>
      </div>

      <div className="p-8 sm:p-12 flex flex-col flex-1 relative overflow-hidden items-center justify-center">
        {/* Pulsing Glowing backdrop circle */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] sm:w-96 sm:h-96 bg-current blur-3xl rounded-full mix-blend-screen pointer-events-none"
          style={{ color: feature.accent }}
        />

        <div className="relative z-10 w-full flex flex-col items-center text-center">
          <motion.h3
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
            className={`text-2xl sm:text-4xl font-black font-nunito mb-3 tracking-tight ${feature.solid
              ? 'text-white'
              : 'bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400'
              }`}
          >
            {feature.title}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
            className={`text-sm sm:text-[15px] max-w-md mx-auto mb-8 font-semibold leading-relaxed ${feature.solid ? 'text-white/80' : 'text-slate-500 dark:text-white/50'}`}
          >
            {feature.desc}
          </motion.p>

          {/* Visualizer Frame */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
            className="mb-10 p-6 rounded-2xl bg-white/60 dark:bg-black/40 border backdrop-blur-xl shadow-2xl transform scale-110 sm:scale-125 w-full max-w-sm mx-auto flex items-center justify-center transition-all group-hover:border-white/30"
            style={{ borderColor: feature.solid ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }}
          >
            {feature.preview}
          </motion.div>

          {feature.requiresAuth && onRequireAuth ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.5, type: "spring", stiffness: 200, damping: 15 }}
              onClick={(e) => { e.preventDefault(); onRequireAuth(); }}
              className="relative inline-flex items-end gap-3 group outline-none"
            >
              <div className="relative">
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse border-2 border-transparent" style={{ borderColor: feature.solid ? '#8b5cf6' : 'transparent' }} />
                <Bot className={`w-9 h-9 transform group-hover:scale-110 transition-transform origin-bottom ${feature.solid ? 'text-white' : 'text-slate-800 dark:text-white'}`} />
              </div>
              <div className={`border-2 px-5 py-3 rounded-2xl rounded-bl-none shadow-xl group-hover:shadow-2xl transition-all relative ${feature.solid ? 'bg-white text-slate-900 border-white/20' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700'}`}>
                <div className={`absolute -left-2 bottom-0 w-4 h-4 border-l-2 border-b-2 transform rotate-45 translate-x-1 -translate-y-[1px] ${feature.solid ? 'bg-white border-white/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}></div>
                <span className="text-sm font-black font-nunito relative z-10 flex flex-col items-start text-left">
                  <span className={`text-[9px] uppercase tracking-[0.2em] mb-0.5 opacity-70 ${feature.solid ? 'text-violet-500' : 'text-indigo-500'}`}>Security Check</span>
                  <span className="flex items-center gap-2">
                    Oh ho! Authentication required <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </span>
                </span>
              </div>
            </motion.button>
          ) : (
            <motion.a
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.5, type: "spring", stiffness: 200, damping: 15 }}
              href={feature.path}
              onClick={(e) => {
                if (feature.requiresAuth && onRequireAuth) {
                  e.preventDefault();
                  onRequireAuth();
                }
              }}
              className={`inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-[13px] font-black transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:shadow-md font-nunito uppercase tracking-widest ${feature.solid
                ? 'bg-white text-slate-900 hover:bg-white/90 ring-4 ring-white/10 hover:ring-white/30'
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 ring-4 ring-slate-900/10 dark:ring-white/10 hover:ring-slate-900/20 dark:hover:ring-white/30'
                }`}
            >
              Open {feature.title} <ArrowRight className="w-4 h-4" />
            </motion.a>
          )}
        </div>
      </div>
    </SpotlightCard>
  );

  return (
    <section ref={ref} className="py-14 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
      {/* Decorative floating shapes */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-10 left-10 w-24 h-24 bg-amber-400/10 dark:bg-amber-400/5 rounded-[40%_60%_70%_30%] blur-xl pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity }}
        className="absolute bottom-20 right-10 w-32 h-32 bg-indigo-400/10 dark:bg-indigo-400/5 rounded-[60%_40%_30%_70%] blur-xl pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-16 sm:mb-24 flex flex-col items-center text-center relative z-10"
      >
        <svg className="absolute -bottom-6 right-[15%] w-12 h-12 text-rose-300 dark:text-rose-500/30 opacity-60 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 90 Q 30 20 80 10 M 60 10 L 80 10 L 80 30" />
        </svg>
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-50 dark:bg-white/[0.04] border-2 border-amber-200 dark:border-white/[0.08] text-[13px] font-bold text-amber-600 dark:text-white/60 tracking-widest mb-6 font-nunito shadow-sm">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="font-comic tracking-wide">Platform Features</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-800 dark:text-white tracking-tight mb-5 font-comic">
          Unleash your potential.<br />
          <span className="text-indigo-500 dark:text-indigo-400 relative inline-block mt-2">
            Master every algorithm.
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-300 dark:text-indigo-500 opacity-60" viewBox="0 0 200 20" preserveAspectRatio="none">
              <path d="M0,10 Q50,20 100,5 T150,15 T200,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="text-slate-500 dark:text-white/50 text-lg max-w-xl font-medium mt-4">
          A complete algorithmic engineering platform. Explore our powerful toolkit designed for your success.
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start max-w-6xl mx-auto">
        {/* Left Side: Feature Navigation List */}
        <div className="w-full lg:w-5/12 flex flex-col gap-3 relative z-20">
          {features.map((f, i) => {
            const isActive = activeIdx === i;
            return (
              <div key={f.title} className="flex flex-col">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
                  onClick={() => setActiveIdx(i)}
                  className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 border-2 outline-none focus:ring-4 focus:ring-indigo-500/20 relative overflow-hidden group z-10 ${isActive ? 'bg-white/60 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 shadow-lg lg:scale-[1.02]' : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02] opacity-60 hover:opacity-100'}`}
                >
                  {/* Active Indicator Line */}
                  {isActive && (
                    <motion.div
                      layoutId="activeFeatureLine"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full hidden lg:block"
                      style={{ backgroundColor: f.accent }}
                    />
                  )}

                  {/* Active Background Gradient */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-white/10 dark:via-white/[0.02] dark:to-transparent pointer-events-none" />
                  )}

                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 border-2 relative z-10 shadow-sm group-hover:shadow-md ${isActive ? 'shadow-md' : ''}`} style={{ backgroundColor: isActive ? `${f.accent}25` : `${f.accent}10`, borderColor: isActive ? `${f.accent}50` : 'transparent', color: isActive ? f.accent : 'currentColor' }}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <div className="relative z-10">
                    <h3 className={`text-[16px] sm:text-[18px] font-black font-nunito mb-1 transition-colors duration-300 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-white/60 group-hover:text-slate-800 dark:group-hover:text-white/80'}`}>{f.title}</h3>
                    <p className={`text-[13px] font-medium leading-relaxed transition-colors duration-300 ${isActive ? 'text-slate-600 dark:text-white/70' : 'text-slate-400 dark:text-white/40'} line-clamp-2`}>{f.desc}</p>
                  </div>
                </motion.button>

                {/* Mobile Accordion Content */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="block lg:hidden w-full overflow-hidden"
                    >
                      {renderShowcase(f)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* Right Side: Interactive Preview Showcase (Desktop Only) */}
        <div className="hidden lg:block w-full lg:w-7/12 sticky top-24 lg:top-32 lg:h-[650px] mt-2 lg:mt-0 z-30">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, scale: 0.98, y: 15, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.98, y: -15, filter: "blur(4px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full"
            >
              {renderShowcase(activeFeature)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
