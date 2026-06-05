import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ChevronDown, Zap } from "lucide-react";
import AStarGraph from "./AStarGraph";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const AnimatedMesh = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
    }));
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 120) {
            ctx.strokeStyle = `rgba(0,230,118,${(1 - d/120) * 0.05})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 1.2, 0, Math.PI*2);
        ctx.fillStyle = "rgba(0,230,118,0.15)"; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

const WORDS = ["Visualize Logic.", "Execute Code.", "Master Algorithms.", "Dominate Contests."];

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  const [typed, setTyped] = useState("");
  const [wi, setWi] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let deleting = false;
    const word = WORDS[wi];
    const type = () => {
      setTyped(prev => {
        if (!deleting) {
          if (prev === word) { timeout = setTimeout(() => { deleting = true; type(); }, 2200); return prev; }
          timeout = setTimeout(type, 65);
          return word.slice(0, prev.length + 1);
        } else {
          if (prev === "") { deleting = false; setWi(w => (w + 1) % WORDS.length); return prev; }
          timeout = setTimeout(type, 32);
          return word.slice(0, prev.length - 1);
        }
      });
    };
    timeout = setTimeout(type, 400);
    return () => clearTimeout(timeout);
  }, [wi]);

  const stats = [["1.2K+","Users"],["5","Languages"],["7","Visualizers"],["Live","Contests"]];

  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row items-center overflow-hidden bg-[#050507]">
      <AnimatedMesh />

      {/* Ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_30%_-10%,rgba(0,230,118,0.11),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_90%_90%,rgba(167,139,250,0.08),transparent)] pointer-events-none" />

      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage: "radial-gradient(ellipse 90% 90% at 40% 50%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 90% at 40% 50%, black, transparent)",
        }}
      />

      {/* ── LEFT CONTENT ─────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:w-[55%] px-6 sm:px-10 lg:pl-20 xl:pl-28 lg:pr-6 pt-28 lg:pt-0">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/50 border border-white/[0.1] text-[12px] font-mono text-white/65 mb-8 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        >
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00e676]" />
          </span>
          AlgoLib v3.2 — Now Live
          <span className="ml-1 px-2 py-0.5 rounded bg-[#00e676]/10 text-[#00e676] text-[10px] font-bold tracking-wider border border-[#00e676]/20">NEW</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl lg:text-[68px] xl:text-[76px] font-black tracking-tight leading-[1.04] mb-5"
          style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.03em" }}
        >
          <span className="text-white">Where </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e676] via-[#69f0ae] to-[#00bcd4]">Algorithms</span>
          <br />
          <span className="text-white">Come </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#a78bfa] via-[#8b5cf6] to-[#6366f1]">Alive</span>
        </motion.h1>

        {/* Typewriter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-xl sm:text-2xl font-mono text-[#00e676]/90 mb-5 h-9 flex items-center gap-1 justify-center lg:justify-start"
        >
          <span>{typed}</span>
          <span className="inline-block w-[2px] h-6 bg-[#00e676] animate-pulse rounded-full" />
        </motion.div>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="text-base sm:text-lg text-white/40 max-w-xl mb-10 leading-relaxed"
        >
          The premier platform for programmers. Watch data structures execute in real-time,
          compile across 5 languages, and compete in live contests.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto"
        >
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 50px rgba(0,230,118,0.5)" }}
            whileTap={{ scale: 0.97 }}
            onClick={onGetStarted}
            className="group relative w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base overflow-hidden flex justify-center items-center gap-2 text-black"
            style={{ background: "linear-gradient(135deg,#00e676 0%,#00bcd4 100%)", boxShadow: "0 0 36px rgba(0,230,118,0.38),inset 0 1px 1px rgba(255,255,255,0.3)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Zap className="w-4 h-4 relative z-10 flex-shrink-0" fill="currentColor" />
            <span className="relative z-10">Get Started Free</span>
            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
          </motion.button>

          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            href="#playground"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.12] text-white font-semibold text-base backdrop-blur-md flex items-center justify-center gap-2 hover:bg-white/[0.08] hover:border-white/[0.2] transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 text-[#a78bfa]" />
            See It Live
          </motion.a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -5, 0] }}
          transition={{ opacity: { delay: 0.7, duration: 0.6 }, y: { delay: 0.7, repeat: Infinity, duration: 5, ease: "easeInOut" } }}
          className="mt-12 hidden sm:inline-flex items-center gap-1 px-6 py-3 rounded-full bg-black/50 border border-white/[0.07] backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          {stats.map(([n, l], idx) => (
            <React.Fragment key={l}>
              <div className="flex items-center gap-1.5 px-3">
                <span className="font-bold text-white text-sm">{n}</span>
                <span className="text-white/35 text-sm">{l}</span>
              </div>
              {idx < stats.length - 1 && <div className="w-px h-3.5 bg-white/[0.1] flex-shrink-0" />}
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* ── RIGHT: A* GRAPH ANIMATION ────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full lg:w-[45%] flex items-center justify-center px-6 pb-16 lg:pb-0 pt-10 lg:pt-0"
      >
        {/* Glass card container */}
        <div className="relative w-full max-w-[480px] rounded-[28px] overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 32px 80px -12px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.08)",
          }}
        >
          {/* Window chrome */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-[#ff5f56] transition-colors" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-[#ffbd2e] transition-colors" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-[#27c93f] transition-colors" />
              </div>
              <div className="ml-3 flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[11px] font-mono text-white/50">A* Pathfinding</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
              <span className="text-[9px] font-mono text-[#00e676] uppercase tracking-widest">LIVE</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 px-5 py-2.5 border-b border-white/[0.05] bg-black/20">
            {[["#f59e0b","ACTIVE"],["#a855f7","VISITED"],["#06b6d4","PATH"]].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
                <span className="text-[10px] font-mono text-white/50">{l}</span>
              </div>
            ))}
          </div>

          {/* Canvas */}
          <div className="relative bg-[#0c0c10] overflow-hidden" style={{ height: 300 }}>
            {/* Dot grid overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <AStarGraph />
          </div>

          {/* Status bar */}
          <div className="h-9 border-t border-white/[0.05] bg-[#0c0c10] flex items-center justify-between px-5">
            <span className="text-[9px] font-mono text-white/50">Heuristic: Manhattan Distance</span>
            <span className="text-[9px] font-mono text-white/50">Nodes: 7 · Edges: 10</span>
          </div>
        </div>

        {/* Floating ambient glow behind card */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(0,230,118,0.06), transparent)", filter: "blur(30px)" }}
        />
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/25 z-10"
      >
        <ChevronDown className="w-5 h-5" />
      </motion.div>
    </section>
  );
};

// expose for status bar
const NODES = Array.from({ length: 11 });
const EDGES = Array.from({ length: 14 });

export default HeroSection;
