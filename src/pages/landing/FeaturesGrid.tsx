import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
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
    large: true,
    preview: (
      <div className="mt-4 flex items-center gap-3 font-mono text-[11px] font-bold">
        {["0x1A", "0x2B", "0x3C"].map((n, i) => (
          <React.Fragment key={n}>
            <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-black/60 border-2 border-emerald-100 dark:border-white/10 text-emerald-600 dark:text-[#00e676]">{n}</div>
            {i < 2 && <span className="text-slate-300 dark:text-white/30">→</span>}
          </React.Fragment>
        ))}
      </div>
    )
  },
  {
    icon: TerminalSquare, title: "Compiler", label: "MULTI-LANGUAGE",
    desc: "Execute C, C++, Java, Python and JS in milliseconds with real-time output.",
    path: "/compiler", glow: "violet", accent: "#8b5cf6", tag: "5 Languages",
    large: true,
    preview: (
      <div className="mt-4 font-mono text-[11px] font-bold text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-black/60 rounded-xl p-3 border-2 border-slate-100 dark:border-white/5">
        <span className="text-violet-500 dark:text-[#a78bfa]">int</span> <span className="text-slate-700 dark:text-white">main</span>{"() {"}<br />
        {"  "}<span className="text-emerald-500 dark:text-[#00e676]">cout</span> {"<< "}<span className="text-amber-500 dark:text-amber-400">"Welcome to AlgoLib"</span>;<br />
        {"}"}
      </div>
    )
  },
  {
    icon: MessageCircle, title: "Community", label: "Forum",
    desc: "Discuss algorithms, share knowledge, and connect with other programmers.",
    path: "/community", glow: "blue", accent: "#3b82f6", tag: "Discuss",
    large: true,
    preview: (
      <div className="mt-4 flex flex-col gap-2 font-nunito text-[11px] font-bold">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-[8px] text-white">U1</div>
          <div className="bg-slate-50 dark:bg-black/60 border-2 border-slate-100 dark:border-white/5 rounded-lg rounded-tl-none px-3 py-2 text-slate-600 dark:text-white/70">
            How does Dijkstra handle negative weights?
          </div>
        </div>
        <div className="flex items-start gap-2 flex-row-reverse">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center text-[8px] text-white">U2</div>
          <div className="bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-100 dark:border-blue-500/20 rounded-lg rounded-tr-none px-3 py-2 text-blue-700 dark:text-blue-200">
            It doesn't! Use Bellman-Ford instead.
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Bot, title: "Vectoris", label: "AI ASSISTANT",
    desc: "Your personal algorithmic AI assistant to help you debug and optimize code instantly.",
    path: "/vectoris", glow: "violet", accent: "#8b5cf6", tag: "AI Powered",
    large: true,
    solid: true,
    preview: (
      <div className="mt-4 flex flex-col gap-2 font-mono text-[11px] font-bold">
        <div className="bg-white/10 rounded-lg px-3 py-2 text-white/80 w-fit max-w-full leading-tight">Can you optimize this?</div>
        <div className="bg-white/20 border-2 border-white/30 rounded-lg px-3 py-2 text-white w-fit max-w-full leading-tight">Using binary search reduces O(n) to O(log n).</div>
      </div>
    )
  },
  {
    icon: BookText, title: "Notes", label: "LEARN",
    desc: "Comprehensive Programming, OOPs & DSA notes.",
    path: "/notes", glow: "amber", accent: "#f59e0b", tag: "Theory", large: false
  },
  {
    icon: ListTodo, title: "DSA Sheets", label: "PRACTICE",
    desc: "Proper roadmap for DSA practice with questions.",
    path: "/sheets", glow: "emerald", accent: "#10b981", tag: "Roadmap", large: false
  },
  {
    icon: Trophy, title: "Contests", label: "ARENA",
    desc: "Live coding contests with real-time leaderboards.",
    path: "/contests", glow: "amber", accent: "#f59e0b", tag: "Ranked", large: false
  },
  {
    icon: BrainCircuit, title: "Quiz Panel", label: "TEST",
    desc: "Create or join quizzes to test your algorithmic knowledge.",
    path: "/quizzes", glow: "violet", accent: "#8b5cf6", tag: "Interactive", large: false
  },
];

interface FeaturesGridProps {
  onRequireAuth?: () => void;
}

const FeaturesGrid: React.FC<FeaturesGridProps> = ({ onRequireAuth }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const large = features.filter(f => f.large);
  const small = features.filter(f => !f.large);

  return (
    <section ref={ref} className="py-14 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
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
        className="mb-16 flex flex-col items-center text-center relative z-10"
      >
        {/* Scribble Arrow Decor */}
        <svg className="absolute -bottom-6 right-[15%] w-12 h-12 text-rose-300 dark:text-rose-500/30 opacity-60 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 90 Q 30 20 80 10 M 60 10 L 80 10 L 80 30" />
        </svg>
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-50 dark:bg-white/[0.04] border-2 border-amber-200 dark:border-white/[0.08] text-[13px] font-bold text-amber-600 dark:text-white/60 tracking-widest mb-6 font-nunito shadow-sm">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="font-comic tracking-wide">Platform Features</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-800 dark:text-white tracking-tight mb-5 font-comic">
          Everything you need.<br />
          <span className="text-indigo-500 dark:text-indigo-400 relative inline-block mt-2">
            Nothing you don't.
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-300 dark:text-indigo-500 opacity-60" viewBox="0 0 200 20" preserveAspectRatio="none">
              <path d="M0,10 Q50,20 100,5 T150,15 T200,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="text-slate-500 dark:text-white/50 text-lg max-w-xl font-medium mt-4">
          A complete algorithmic engineering platform. From visualization to execution to competition.
        </p>
      </motion.div>

      {/* Large cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-3 sm:mb-6">
        {large.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <SpotlightCard glow={f.glow} solid={(f as any).solid} className="h-full">
              <div className="p-4 sm:p-8 flex flex-col h-full min-h-[160px] sm:min-h-[240px]">
                <div className="flex items-start justify-between mb-3 sm:mb-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-[12px] sm:rounded-2xl flex items-center justify-center relative border-2 flex-shrink-0" style={{ backgroundColor: (f as any).solid ? 'rgba(255,255,255,0.1)' : `${f.accent}15`, borderColor: (f as any).solid ? 'rgba(255,255,255,0.2)' : `${f.accent}30` }}>
                      <f.icon className="w-5 h-5 sm:w-7 sm:h-7 relative z-10" style={{ color: (f as any).solid ? 'white' : f.accent }} />
                    </div>
                    <div>
                      <p className="text-[9px] sm:text-[11px] tracking-widest mb-0.5 sm:mb-1 font-black font-nunito uppercase" style={{ color: (f as any).solid ? 'rgba(255,255,255,0.8)' : f.accent }}>{f.label}</p>
                      <h3 className={`text-[16px] sm:text-2xl font-black tracking-tight leading-tight font-nunito ${(f as any).solid ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{f.title}</h3>
                    </div>
                  </div>
                </div>
                <p className={`text-[11px] sm:text-[15px] leading-relaxed mb-4 sm:mb-6 font-semibold line-clamp-3 sm:line-clamp-none ${(f as any).solid ? 'text-white/80' : 'text-slate-500 dark:text-white/60'}`}>{f.desc}</p>
                <div className="hidden sm:block">
                  {f.preview}
                </div>
                <div className="mt-auto pt-6">
                  <a
                    href={f.path}
                    onClick={(e) => {
                      if (f.path === "/vectoris" && onRequireAuth) {
                        e.preventDefault();
                        onRequireAuth();
                      }
                    }}
                    className={`group inline-flex items-center gap-2 text-sm font-black transition-colors font-nunito ${(f as any).solid ? 'text-white hover:text-white/80' : ''}`}
                    style={{ color: !(f as any).solid ? f.accent : undefined }}
                  >
                    Open Tool <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>

      {/* Small cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {small.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            <SpotlightCard glow={f.glow} solid={(f as any).solid} className="h-full">
              <div className="p-4 sm:p-6 flex flex-col h-full min-h-[120px] sm:min-h-[200px]">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-xl flex items-center justify-center mb-3 sm:mb-5 relative flex-shrink-0 border-2" style={{ backgroundColor: (f as any).solid ? 'rgba(255,255,255,0.1)' : `${f.accent}14`, borderColor: (f as any).solid ? 'rgba(255,255,255,0.2)' : `${f.accent}28` }}>
                  <f.icon className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" style={{ color: (f as any).solid ? 'white' : f.accent }} />
                </div>
                <p className="text-[9px] sm:text-[11px] tracking-widest mb-1 sm:mb-1.5 font-black uppercase font-nunito" style={{ color: (f as any).solid ? 'rgba(255,255,255,0.8)' : f.accent }}>{f.label}</p>
                <h3 className={`text-[14px] sm:text-[18px] font-black mb-1 sm:mb-2 tracking-tight leading-snug font-nunito line-clamp-1 sm:line-clamp-none ${(f as any).solid ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{f.title}</h3>
                <p className={`text-[10px] sm:text-[14px] leading-relaxed flex-1 font-semibold line-clamp-2 sm:line-clamp-none ${(f as any).solid ? 'text-white/80' : 'text-slate-500 dark:text-white/45'}`}>{f.desc}</p>
                <a
                  href={f.path}
                  onClick={(e) => {
                    if (onRequireAuth) {
                      e.preventDefault();
                      onRequireAuth();
                    }
                  }}
                  className={`mt-5 group inline-flex items-center gap-1.5 text-[12px] font-black transition-all duration-200 font-nunito ${(f as any).solid ? 'text-white hover:text-white/80' : ''}`}
                  style={{ color: !(f as any).solid ? f.accent : undefined }}
                >
                  Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesGrid;
