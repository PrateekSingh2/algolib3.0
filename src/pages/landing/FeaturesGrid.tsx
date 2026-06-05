import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Network, TerminalSquare, BrainCircuit, Bot,
  Trophy, BookText, ArrowRight, Zap, ListTodo
} from "lucide-react";

const SpotlightCard = ({ children, className = "", glow = "emerald" }: {
  children: React.ReactNode; className?: string; glow?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = React.useState(0);
  const colors: Record<string, string> = {
    emerald: "0,230,118", violet: "167,139,250", blue: "96,165,250", amber: "251,191,36"
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
      className={`relative overflow-hidden rounded-[20px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.09] transition-all duration-500 hover:border-white/[0.18] hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)] group ${className}`}
      style={{ boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.07), inset 0 -1px 1px rgba(0,0,0,0.3)" }}
    >
      {/* Noise texture overlay for premium feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(${rgb},0.15), transparent 40%)`
        }}
      />

      {/* Top glare effect */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

const features = [
  {
    icon: Network, title: "Visualizer", label: "EXECUTION ENGINE",
    desc: "Watch data structures animate node-by-node with our powerful step execution engine.",
    path: "/visualizer", glow: "emerald", accent: "#00e676", tag: "Live Steps",
    large: true,
    preview: (
      <div className="mt-4 flex items-center gap-3 font-mono text-[10px]">
        {["0x1A", "0x2B", "0x3C"].map((n, i) => (
          <React.Fragment key={n}>
            <div className="px-2.5 py-1.5 rounded bg-black/60 border border-white/10 text-[#00e676]">{n}</div>
            {i < 2 && <span className="text-white/30">→</span>}
          </React.Fragment>
        ))}
      </div>
    )
  },
  {
    icon: TerminalSquare, title: "Compiler", label: "MULTI-LANGUAGE",
    desc: "Execute C, C++, Java, Python and JS in milliseconds with real-time output.",
    path: "/compiler", glow: "violet", accent: "#a78bfa", tag: "5 Languages",
    large: true,
    preview: (
      <div className="mt-4 font-mono text-[10px] text-white/50 bg-black/60 rounded p-2.5 border border-white/5">
        <span className="text-[#a78bfa]">int</span> <span className="text-white">main</span>{"() {"}<br />
        {"  "}<span className="text-[#00e676]">cout</span> {"<< "}<span className="text-amber-400">"Welcome to AlgoLib Compiler"</span>;<br />
        {"}"}
      </div>
    )
  },
  {
    icon: Bot, title: "Vectoris", label: "AI ASSISTANT",
    desc: "Your personal algorithmic AI assistant to help you debug and optimize code instantly.",
    path: "/vectoris", glow: "blue", accent: "#60a5fa", tag: "AI Powered",
    large: true,
    preview: (
      <div className="mt-4 flex flex-col gap-2 font-mono text-[10px]">
        <div className="bg-white/5 rounded px-2.5 py-1.5 text-white/40 w-max">Can you optimize this?</div>
        <div className="bg-[#60a5fa]/10 border border-[#60a5fa]/20 rounded px-2.5 py-1.5 text-[#60a5fa] w-max">Using binary search reduces O(n) to O(log n).</div>
      </div>
    )
  },
  {
    icon: BookText, title: "Notes", label: "LEARN",
    desc: "Comprehensive Programming, OOPs & DSA notes.",
    path: "/notes", glow: "amber", accent: "#fbbf24", tag: "Theory", large: false
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
    <section ref={ref} className="py-14 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-white/50 uppercase tracking-widest mb-4">
          <Zap className="w-3 h-3 text-[#00e676]" />
          Platform Features
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
          Everything you need.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e676] to-[#00bcd4]">Nothing you don't.</span>
        </h2>
        <p className="text-white/40 text-lg max-w-xl">
          A complete algorithmic engineering platform. From visualization to execution to competition.
        </p>
      </motion.div>

      {/* Large cards row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {large.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <SpotlightCard glow={f.glow} className="h-full">
              <div className="p-6 sm:p-8 flex flex-col h-full min-h-[220px]">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative" style={{ background: `${f.accent}15`, border: `1px solid ${f.accent}30` }}>
                      <div className="absolute inset-0 rounded-[14px] opacity-50" style={{ background: `radial-gradient(circle at top left, ${f.accent}40, transparent 70%)` }} />
                      <f.icon className="w-6 h-6 relative z-10" style={{ color: f.accent, filter: `drop-shadow(0 2px 4px ${f.accent}40)` }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono tracking-widest mb-1 font-bold" style={{ color: f.accent }}>{f.label}</p>
                      <h3 className="text-xl font-bold text-white tracking-tight">{f.title}</h3>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.1] text-white/50 backdrop-blur-md shadow-sm">{f.tag}</span>
                </div>
                <p className="text-white/60 text-[14px] leading-relaxed mb-5 font-medium">{f.desc}</p>
                {f.preview}
                <div className="mt-auto pt-5">
                  <a
                    href={f.path}
                    onClick={(e) => {
                      if (f.path == "/vectoris" && onRequireAuth) {
                        e.preventDefault();
                        onRequireAuth();
                      }
                    }}
                    className="group inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                    style={{ color: f.accent }}
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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {small.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            <SpotlightCard glow={f.glow} className="h-full">
              <div className="p-5 sm:p-6 flex flex-col h-full min-h-[190px]">
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center mb-4 relative flex-shrink-0" style={{ background: `${f.accent}14`, border: `1px solid ${f.accent}28` }}>
                  <div className="absolute inset-0 rounded-[12px] opacity-30" style={{ background: `radial-gradient(circle at top left, ${f.accent}50, transparent 70%)` }} />
                  <f.icon className="w-4.5 h-4.5 relative z-10" style={{ color: f.accent, filter: `drop-shadow(0 1px 4px ${f.accent}50)` }} />
                </div>
                <p className="text-[10px] font-mono tracking-[0.15em] mb-1 font-bold uppercase" style={{ color: f.accent }}>{f.label}</p>
                <h3 className="text-[15px] font-bold text-white mb-2 tracking-tight leading-snug">{f.title}</h3>
                <p className="text-white/45 text-[12.5px] leading-relaxed flex-1">{f.desc}</p>
                <a
                  href={f.path}
                  onClick={(e) => {
                    if (onRequireAuth) {
                      e.preventDefault();
                      onRequireAuth();
                    }
                  }}
                  className="mt-4 group inline-flex items-center gap-1 text-[11px] font-bold transition-all duration-200"
                  style={{ color: f.accent }}
                >
                  Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
