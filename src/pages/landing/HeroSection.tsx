import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ChevronDown, Wand2, Zap } from "lucide-react";
import AStarGraph from "./AStarGraph";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const WORDS = ["Visualize Logic.", "Execute Code.", "Master Algorithms.", "Dominate Contests."];

// SVG Scribble Elements
const ScribbleUnderline = () => (
  <svg className="absolute -bottom-2 left-0 w-full h-4 text-purple-400 dark:text-purple-500 opacity-80" viewBox="0 0 200 20" preserveAspectRatio="none">
    <path d="M0,10 Q50,20 100,5 T150,15 T200,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const ScribbleStar = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M25 5 L28 20 L45 22 L32 30 L35 45 L25 35 L15 45 L18 30 L5 22 L22 20 Z" />
  </svg>
);

const ScribbleArrow = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 90 Q 30 20 80 10 M 60 10 L 80 10 L 80 30" />
  </svg>
);

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

  const stats = [["1.5K+","Users"],["4.8","Rating"],["5","Languages"],["7","Visualizers"]];

  return (
    <section className="relative min-h-screen lg:min-h-[85vh] flex flex-col lg:flex-row items-center overflow-hidden bg-transparent">
      {/* Decorative Scribbles */}
      <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="absolute top-32 left-10 text-yellow-400 dark:text-yellow-500 opacity-60">
        <ScribbleStar className="w-10 h-10 rotate-12" />
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }} className="absolute bottom-40 left-1/2 text-emerald-400 dark:text-emerald-500 opacity-60">
        <ScribbleStar className="w-8 h-8 -rotate-12" />
      </motion.div>
      
      {/* ── LEFT CONTENT ─────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:w-[65%] px-4 sm:px-10 lg:pl-20 xl:pl-28 lg:pr-4 pt-14 lg:pt-0">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/60 dark:bg-black/30 border-2 border-orange-200 dark:border-orange-500/30 text-[13px] font-bold text-orange-600 dark:text-orange-400 mb-8 backdrop-blur-md shadow-sm"
        >
          <Wand2 className="w-4 h-4 text-orange-500" />
          <span className="font-comic tracking-wide">AlgoLib v3.2 is live!</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl lg:text-[68px] xl:text-[76px] font-black tracking-tight leading-[1.1] mb-5 text-slate-800 dark:text-white relative font-comic"
        >
          Everything you need,<br/>
          <span className="relative inline-block mt-2">
            in one <span className="text-indigo-500 dark:text-indigo-400">workspace</span>
            <ScribbleUnderline />
          </span>
        </motion.h1>

        {/* Typewriter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-xl sm:text-2xl font-comic text-emerald-600 dark:text-emerald-400 font-bold mb-5 h-9 flex items-center gap-1 justify-center lg:justify-start"
        >
          <span>{typed}</span>
          <span className="inline-block w-[3px] h-6 bg-emerald-500 animate-pulse rounded-full" />
        </motion.div>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-xl mb-10 leading-relaxed font-medium"
        >
          The premier platform for programmers. Watch data structures execute in real-time,
          compile across 5 languages, and compete in live contests.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="flex flex-row items-center justify-center lg:justify-start gap-2 sm:gap-4 w-full lg:w-auto relative"
        >
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="hidden lg:block absolute -left-16 -bottom-10 text-emerald-400">
            <ScribbleArrow className="w-16 h-16" />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGetStarted}
            className="group relative flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-lg overflow-hidden flex justify-center items-center gap-2 text-white bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-[0_8px_20px_rgba(99,102,241,0.3)] transition-colors"
          >
            <span className="relative z-10 font-nunito whitespace-nowrap">Try Free</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
          </motion.button>

          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="#playground"
            className="flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 rounded-full bg-white dark:bg-white/10 border-2 border-slate-200 dark:border-white/20 text-slate-700 dark:text-white font-bold text-sm sm:text-lg flex items-center justify-center gap-1.5 sm:gap-2 hover:border-indigo-400 dark:hover:bg-white/20 transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400" />
            <span className="font-nunito whitespace-nowrap">See Live</span>
          </motion.a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-8 sm:mt-12 flex flex-row items-center justify-center lg:justify-start gap-4 sm:gap-8 px-5 sm:px-8 py-3 sm:py-5 rounded-3xl bg-white/70 dark:bg-black/40 border-2 border-white dark:border-white/10 backdrop-blur-md shadow-lg dark:shadow-none w-full sm:w-max"
        >
          {stats.map(([n, l], idx) => (
            <React.Fragment key={l}>
              <div className="flex flex-col items-center px-1 sm:px-2">
                <span className="font-black text-slate-800 dark:text-white text-xl sm:text-2xl font-nunito">{n}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[9px] sm:text-xs font-bold uppercase tracking-wider">{l}</span>
              </div>
              {idx < stats.length - 1 && <div className="block w-[1px] sm:w-[2px] h-6 sm:h-8 bg-slate-200 dark:bg-white/10 rounded-full flex-shrink-0" />}
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
        {/* Soft Glass card container */}
        <div className="relative w-full max-w-[480px] rounded-[2rem] overflow-hidden bg-white/80 dark:bg-[#151b2b]/90 backdrop-blur-2xl border-4 border-white dark:border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)]"
        >
          {/* Window chrome */}
          <div className="flex items-center justify-between px-5 py-4 border-b-2 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="ml-2 flex items-center gap-2 px-3 py-1 rounded-lg bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-nunito">A* Pathfinding</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">LIVE</span>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative bg-slate-50 dark:bg-[#0c0c10] overflow-hidden" style={{ height: 300 }}>
            <AStarGraph />
          </div>

          {/* Status bar */}
          <div className="h-12 border-t-2 border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-[#151b2b]/95 flex items-center justify-between px-5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-nunito">Heuristic: Manhattan Distance</span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-nunito">Nodes: 7 · Edges: 10</span>
          </div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400 dark:text-white/25 z-10"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
