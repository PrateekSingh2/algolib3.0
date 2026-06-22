import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import Fuse from "fuse.js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlobalRibbon from "@/components/GlobalRibbon";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search, SlidersHorizontal, ChevronRight, Zap,
  Layers, FolderDot, Code2, Activity, Database,
  Plus, Minus, Command, CornerDownLeft,
  TrendingUp, Sparkles,
  Terminal
} from "lucide-react";
import { fetchAlgorithms, type Algorithm } from "@/lib/algorithms";

// --- HYPER-GLASS BENTO ALGO CARD ---
const AlgoDataCard = ({ algo, onClick, index }: { algo: Algorithm, onClick: () => void, index: number }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: (index % 12) * 0.04, ease: "easeOut" }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      className="group relative flex flex-col p-5 rounded-[1.5rem] border border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.02] backdrop-blur-3xl hover:bg-white/90 dark:hover:bg-white/[0.04] transition-all duration-300 cursor-pointer overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_30px_rgba(0,0,0,0.2)]"
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[1.5rem] opacity-0 transition duration-300 group-hover:opacity-100 hidden sm:block"
        style={{
          background: useMotionTemplate`
            radial-gradient(300px circle at ${mouseX}px ${mouseY}px, rgba(59, 131, 246, 0.12), transparent 80%)
          `,
        }}
      />

      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center shadow-inner group-hover:border-blue-500/40 group-hover:bg-blue-500/10 transition-all duration-300">
            <Layers size={16} className="text-slate-500 dark:text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 dark:text-zinc-400 uppercase bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 rounded-md shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] group-hover:text-slate-800 dark:group-hover:text-zinc-200 group-hover:border-slate-300 dark:group-hover:border-white/[0.15] transition-colors">
            {algo.category}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.05] opacity-0 group-hover:opacity-100 transition-all duration-300 sm:-translate-x-2 sm:group-hover:translate-x-0">
          <ChevronRight size={16} className="text-white" />
        </div>
      </div>

      <div className="relative z-10 flex-1">
        <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-white mb-2 transition-colors tracking-tight drop-shadow-sm dark:drop-shadow-md">
          {algo.title}
        </h3>
        <p className="text-[13px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-light group-hover:text-slate-700 dark:group-hover:text-zinc-300 transition-colors">
          {algo.description}
        </p>
      </div>

      {algo.tags && algo.tags.length > 0 && (
        <div className="relative z-10 flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-200 dark:border-white/[0.04]">
          {algo.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="text-[10px] px-2.5 py-1 rounded-md text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] font-medium tracking-wide">
              {tag}
            </span>
          ))}
          {algo.tags.length > 3 && (
            <span className="text-[10px] px-2 py-1 rounded-md text-slate-500 dark:text-zinc-500 font-medium border border-transparent">
              +{algo.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

// --- MAIN DASHBOARD VIEW ---
const Index = () => {
  const navigate = useNavigate();
  const searchModalInputRef = useRef<HTMLInputElement>(null);

  const { user, profile } = useAuth();
  const userName = profile?.display_name || user?.displayName || "User";

  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(12);

  const [showAllFilters, setShowAllFilters] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Ribbon Session State
  const [showRibbon, setShowRibbon] = useState(false);

  useEffect(() => {
    const loadAlgos = async () => {
      const data = await fetchAlgorithms();
      setAlgorithms(data);
    };
    loadAlgos();

    // Check session storage on mount
    const isRibbonDismissed = sessionStorage.getItem("ribbon_dismissed");
    if (isRibbonDismissed !== "true") {
      setShowRibbon(true);
    }
  }, []);

  const handleDismissRibbon = () => {
    sessionStorage.setItem("ribbon_dismissed", "true");
    setShowRibbon(false);
  };

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setVisibleCount(8);
  }, [debouncedSearch, activeFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      if (e.key === 'Escape' && isSearchModalOpen) {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchModalOpen]);

  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => searchModalInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isSearchModalOpen]);

  const ALL_CATEGORIES = [
    "All", "Searching", "Sorting", "Graphs", "DP", "Trees", "Math",
    "Arrays", "Linked Lists", "Stacks", "Queues", "Greedy", "Strings"
  ];
  const INITIAL_PILLS_COUNT = 7;
  const visible_pills = showAllFilters ? ALL_CATEGORIES : ALL_CATEGORIES.slice(0, INITIAL_PILLS_COUNT);

  const filteredAlgorithms = useMemo(() => {
    let results = algorithms;

    if (activeFilter !== "All") {
      const normalizedFilter = activeFilter.toLowerCase().replace(/\s+/g, "");
      results = results.filter((algo) => {
        const category = algo.category?.toLowerCase().replace(/\s+/g, "") || "";
        const tags = (algo.tags || []).map((t) => t.toLowerCase().replace(/\s+/g, ""));

        if (category.includes(normalizedFilter) || tags.some((tag) => tag.includes(normalizedFilter))) return true;
        if (normalizedFilter === "graphs" && category.includes("graph")) return true;
        if (normalizedFilter === "trees" && category.includes("tree")) return true;
        if (normalizedFilter === "linkedlists" && category.includes("linked")) return true;
        return false;
      });
    }

    if (debouncedSearch.trim()) {
      const fuse = new Fuse(results, { keys: ["title", "category", "tags"], threshold: 0.3 });
      results = fuse.search(debouncedSearch).map((r) => r.item);
    }

    return results;
  }, [algorithms, debouncedSearch, activeFilter]);

  // Algorithm of the Moment — deterministically rotates by calendar day
  const featuredAlgo = useMemo(() =>
    algorithms.length > 0 ? algorithms[Math.floor(Date.now() / 86400000) % algorithms.length] : null,
    [algorithms]
  );

  return (
    <div className="min-h-screen bg-[#FAFCFF] dark:bg-none dark:bg-[#09090B] text-slate-800 dark:text-zinc-200 font-sans selection:bg-blue-500/30 selection:text-white overflow-x-hidden">

      {/* --- COMMAND PALETTE MODAL --- */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSearchModalOpen(false)}
              className="absolute inset-0 bg-[#09090B]/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-2xl bg-white/95 dark:bg-[#121214]/95 backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl dark:shadow-[0_20px_80px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col"
            >
              <div className="flex items-center px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-white/[0.05]">
                <Search size={20} className="text-blue-500 mr-3 shrink-0" />
                <input
                  ref={searchModalInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search algorithms..."
                  className="w-full bg-transparent text-lg sm:text-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none font-medium tracking-wide"
                />
                <button
                  onClick={() => setIsSearchModalOpen(false)}
                  className="ml-3 text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] px-2 py-1 rounded hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors shrink-0"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-[60vh] sm:max-h-[50vh] overflow-y-auto hide-scrollbar p-3">
                {searchQuery.trim() === "" ? (
                  <div className="p-8 text-center text-zinc-500 font-medium text-sm flex flex-col items-center gap-3">
                    <Command size={24} className="text-zinc-600" />
                    Start typing to search the matrix.
                  </div>
                ) : filteredAlgorithms.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {filteredAlgorithms.slice(0, 6).map(algo => (
                      <div
                        key={algo.id}
                        onClick={() => { navigate(`/view/${algo.id}`); setIsSearchModalOpen(false); }}
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/20 border border-transparent cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 shrink-0 rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:border-blue-300 dark:group-hover:border-blue-500/40 transition-colors">
                            <Code2 size={16} className="text-slate-400 dark:text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base text-slate-800 dark:text-zinc-200 font-semibold group-hover:text-blue-600 dark:group-hover:text-white line-clamp-1">{algo.title}</h4>
                            <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">{algo.category}</span>
                          </div>
                        </div>
                        <CornerDownLeft size={16} className="text-zinc-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 shrink-0 hidden sm:block" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-zinc-500 text-sm">No results found for "{searchQuery}".</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* PREMIUM LIGHT MODE MESH GRADIENT */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-500/15 rounded-full blur-[120px] dark:hidden mix-blend-multiply" />
        <div className="absolute top-[10%] right-[-5%] w-[40vw] h-[40vw] bg-orange-400/15 rounded-full blur-[120px] dark:hidden mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[10%] w-[45vw] h-[45vw] bg-emerald-400/15 rounded-full blur-[120px] dark:hidden mix-blend-multiply" />
        <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] bg-sky-400/20 rounded-full blur-[100px] dark:hidden mix-blend-multiply" />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.06),transparent_50%)] mix-blend-screen" />
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.025] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* STRUCTURAL FIX: Unified Sticky Header Container */}
        <header className="sticky top-0 left-0 w-full z-50 flex flex-col pointer-events-none">
          {/* Render ribbon if not dismissed in session */}
          <AnimatePresence>
            {showRibbon && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pointer-events-auto w-full overflow-hidden"
              >
                <GlobalRibbon />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pointer-events-auto w-full mt-2 mb-2 px-2 sm:px-4 flex justify-center">
            <div className="w-full max-w-[1400px]">
              <Navbar />
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10 lg:px-10">

          {/* ── HERO BENTO ROW ── */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 mb-6 sm:mb-8 mt-2">

            {/* Welcome Card – 8 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="lg:col-span-8 rounded-[1.75rem] border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.02] backdrop-blur-3xl p-7 sm:p-10 flex flex-col justify-between relative overflow-hidden group shadow-[0_8px_40px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_30px_rgba(0,0,0,0.2)] min-h-[280px]"
            >
              {/* Ambient glow */}
              <div className="absolute right-[-8%] top-[-15%] w-[420px] h-[420px] bg-blue-100 dark:bg-blue-600/10 rounded-full blur-[90px] pointer-events-none group-hover:bg-blue-200/80 dark:group-hover:bg-blue-600/18 transition-colors duration-700 hidden sm:block" />
              <div className="absolute left-[-5%] bottom-[-10%] w-[200px] h-[200px] bg-indigo-100/60 dark:bg-indigo-500/5 rounded-full blur-[70px] pointer-events-none hidden sm:block" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <Activity size={13} className="text-blue-500 dark:text-blue-400" />
                  <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-300 uppercase tracking-widest">Active Workspace</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-3 leading-[1.1]">
                  Welcome back,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 dark:from-white dark:via-zinc-200 dark:to-white/60">
                    {userName}
                  </span>.
                </h1>

                <p className="text-slate-500 dark:text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed font-light">
                  The AlgoLib ecosystem is fully synchronized.{" "}
                  <span className="text-slate-800 dark:text-zinc-200 font-semibold">{algorithms.length}</span> optimized algorithm implementations are ready to explore.
                </p>
              </div>

              <div className="relative z-10 mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:bg-blue-600 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg"
                >
                  <Search size={16} /> Search Algorithms
                </button>
                <Link
                  to="/compiler"
                  className="px-5 py-3 bg-white dark:bg-white/[0.05] text-slate-700 dark:text-zinc-300 text-sm font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-blue-400 dark:hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm"
                >
                  <Terminal size={16} /> Open Compiler
                </Link>
              </div>
            </motion.div>

            {/* Stats Card – 4 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-4 rounded-[1.75rem] border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.02] backdrop-blur-3xl p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group shadow-[0_8px_40px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_30px_rgba(0,0,0,0.2)] min-h-[280px]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/60 dark:from-cyan-500/[0.04] to-transparent pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600 dark:text-zinc-300 flex items-center gap-2">
                  <Database size={15} className="text-cyan-500 dark:text-cyan-400" /> Total Algorithms
                </span>
                <span className="text-[10px] font-mono font-bold tracking-wider text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-400/10 px-2.5 py-1 rounded-md border border-green-200 dark:border-green-500/20 animate-pulse">
                  ● LIVE
                </span>
              </div>

              <div className="relative z-10 flex flex-col gap-1">
                <span className="text-7xl sm:text-8xl font-black text-slate-800 dark:text-white tracking-tighter tabular-nums">
                  {algorithms.length > 0 ? algorithms.length : "0"}
                </span>
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400 font-semibold">All categories covered</span>
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.05]">
                {[
                  { label: "Categories", value: new Set(algorithms.map(a => a.category)).size || "—" },
                  { label: "With Tags", value: algorithms.filter(a => a.tags?.length).length || "—" },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2.5 border border-slate-100 dark:border-white/[0.05]">
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wider mb-0.5">{stat.label}</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-zinc-200 tabular-nums">{stat.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* ── ALGORITHM INTELLIGENCE PANEL ── */}
          {algorithms.length > 0 && featuredAlgo && (() => {
            // Derive live data from the algorithms array
            const complexityGroups = [
              { label: "O(1) / O(log n)", color: "emerald", darkColor: "emerald", matches: (t: string) => /O\(1\)|O\(log/.test(t) },
              { label: "O(n)", color: "blue", darkColor: "blue", matches: (t: string) => /^O\(n\)$/.test(t.trim()) },
              { label: "O(n log n)", color: "violet", darkColor: "violet", matches: (t: string) => /O\(n log/.test(t) },
              { label: "O(n²) or worse", color: "amber", darkColor: "amber", matches: (t: string) => /O\(n.{0,3}[²2]\)|O\(N!\)|O\(2\^n\)/.test(t) },
            ];
            const groupCounts = complexityGroups.map(g => ({
              ...g,
              count: algorithms.filter(a => g.matches(a.timeComplexity || "")).length,
            }));
            const maxCount = Math.max(...groupCounts.map(g => g.count), 1);
            const langCoverage = [
              { lang: "Python", key: "codePython", dot: "bg-blue-500" },
              { lang: "Java", key: "codeJava", dot: "bg-orange-500" },
              { lang: "C++", key: "codeCpp", dot: "bg-violet-500" },
            ];
            const featured = featuredAlgo;

            return (
              <motion.section
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.2 }}
                className="mb-6 sm:mb-8 grid grid-cols-1 lg:grid-cols-12 gap-4"
              >
                {/* ── Left: Complexity Distribution ── */}
                <div className="lg:col-span-5 rounded-[1.5rem] border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.02] backdrop-blur-3xl p-6 flex flex-col gap-5 shadow-[0_6px_30px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04),0_6px_24px_rgba(0,0,0,0.18)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-50 dark:from-blue-600/[0.06] to-transparent pointer-events-none rounded-[1.5rem]" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Live Analysis</p>
                      <h2 className="text-sm font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-2">
                        <TrendingUp size={15} className="text-blue-500" /> Complexity Distribution
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold">{algorithms.length} algos</span>
                  </div>
                  <div className="relative z-10 flex flex-col gap-3">
                    {groupCounts.map(g => {
                      const pct = Math.round((g.count / maxCount) * 100);
                      const barColor: Record<string, string> = {
                        emerald: "bg-emerald-400 dark:bg-emerald-500",
                        blue: "bg-blue-400 dark:bg-blue-500",
                        violet: "bg-violet-400 dark:bg-violet-500",
                        amber: "bg-amber-400 dark:bg-amber-500",
                      };
                      const textColor: Record<string, string> = {
                        emerald: "text-emerald-600 dark:text-emerald-400",
                        blue: "text-blue-600 dark:text-blue-400",
                        violet: "text-violet-600 dark:text-violet-400",
                        amber: "text-amber-600 dark:text-amber-400",
                      };
                      return (
                        <div key={g.label} className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400 w-28 shrink-0 font-mono">{g.label}</span>
                          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
                              className={`h-full rounded-full ${barColor[g.color]}`}
                            />
                          </div>
                          <span className={`text-[11px] font-bold w-6 text-right tabular-nums ${textColor[g.color]}`}>{g.count}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Language coverage pills */}
                  <div className="relative z-10 flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.05]">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Languages</span>
                    <div className="flex gap-2 flex-wrap">
                      {langCoverage.map(l => {
                        const covered = algorithms.filter(a => (a as any)[l.key]).length;
                        const pct = algorithms.length > 0 ? Math.round((covered / algorithms.length) * 100) : 0;
                        return (
                          <span key={l.lang} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] px-2.5 py-1 rounded-lg">
                            <span className={`w-1.5 h-1.5 rounded-full ${l.dot}`} />
                            {l.lang} <span className="opacity-60 font-normal">{pct}%</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Right: Algorithm of the Moment ── */}
                <motion.div
                  whileHover={{ scale: 1.012 }}
                  onClick={() => navigate(`/view/${featured.id}`)}
                  className="lg:col-span-7 rounded-[1.5rem] border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.02] backdrop-blur-3xl p-6 sm:p-8 flex flex-col justify-between cursor-pointer shadow-[0_6px_30px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04),0_6px_24px_rgba(0,0,0,0.18)] relative overflow-hidden group"
                >
                  {/* Background code watermark */}
                  <div className="absolute inset-0 flex items-center justify-end pr-6 pointer-events-none opacity-[0.035] dark:opacity-[0.07] select-none overflow-hidden">
                    <pre className="text-[9px] leading-4 font-mono text-slate-900 dark:text-white text-right max-h-full overflow-hidden">
                      {(featured.codePython || featured.codeJava || "").slice(0, 320)}
                    </pre>
                  </div>
                  <div className="absolute top-0 left-0 w-60 h-60 bg-gradient-to-br from-indigo-50/80 dark:from-indigo-600/[0.06] to-transparent pointer-events-none rounded-[1.5rem]" />

                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <Sparkles size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Algorithm of the Moment</p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-600">Rotates daily · click to explore</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 dark:text-zinc-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mt-1 shrink-0" />
                  </div>

                  <div className="relative z-10 mt-5">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] px-2.5 py-1 rounded-md uppercase mb-3 inline-block">
                      {featured.category}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                      {featured.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-2 max-w-lg font-light">
                      {featured.description}
                    </p>
                  </div>

                  <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3">
                    {[
                      { icon: Zap, label: "Time", val: featured.timeComplexity, c: "blue" },
                      { icon: Database, label: "Space", val: featured.spaceComplexity, c: "emerald" },
                    ].map(item => {
                      const chipColor: Record<string, string> = {
                        blue: "bg-blue-50 dark:bg-blue-500/[0.08] border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300",
                        emerald: "bg-emerald-50 dark:bg-emerald-500/[0.08] border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
                      };
                      return item.val ? (
                        <span key={item.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${chipColor[item.c]}`}>
                          <item.icon size={11} /> {item.label}: {item.val}
                        </span>
                      ) : null;
                    })}
                    {(featured.tags || []).slice(0, 2).map(tag => (
                      <span key={tag} className="text-[11px] px-2.5 py-1 rounded-lg text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </motion.section>
            );
          })()}

          {/* STICKY GLASS SEARCH COMMAND TRIGGER & VERTICAL FILTERS */}
          <section className="mb-6 sm:mb-8 flex flex-col md:flex-row gap-4 sm:gap-5 items-start md:items-center justify-between sticky top-[90px] sm:top-[100px] z-30 bg-white/40 dark:bg-[#09090B]/80 backdrop-blur-3xl py-3 sm:py-4 border-b border-slate-200/60 dark:border-white/[0.05] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] -mx-4 px-4 sm:mx-0 sm:px-0">

            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="relative w-full md:w-[400px] flex items-center text-left bg-white/60 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] rounded-xl pl-4 pr-3 py-3 hover:border-blue-500/50 hover:bg-white/80 dark:hover:bg-white/[0.06] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] group"
            >
              <Search size={18} className="text-slate-400 dark:text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0" />
              <span className="text-sm text-slate-500 dark:text-zinc-400 ml-3 font-medium flex-1 truncate group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-colors">
                {searchQuery || "Command palette..."}
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-1 border border-slate-200/80 dark:border-white/[0.08] rounded-md px-2 py-1 text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-white/60 dark:bg-black/40 group-hover:border-blue-500/40 transition-colors shrink-0">
                <Command size={10} /> K
              </kbd>
            </button>

            {/* RESPONSIVE FILTER PILLS */}
            <motion.div layout className="flex-1 w-full flex items-start gap-2 sm:gap-3 border-l-0 md:border-l border-slate-200 dark:border-white/[0.05] md:pl-5">
              <div className="mt-2 text-slate-400 dark:text-zinc-500 shrink-0 hidden sm:block">
                <SlidersHorizontal size={16} />
              </div>

              <motion.div
                layout
                className={`flex gap-2 w-full pb-1 sm:pb-0 ${showAllFilters ? 'flex-wrap' : 'overflow-x-auto hide-scrollbar snap-x snap-mandatory'}`}
              >
                <AnimatePresence mode="popLayout">
                  {visible_pills.map((pill) => (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={pill}
                      onClick={() => setActiveFilter(pill)}
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 shrink-0 snap-center shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${activeFilter === pill
                          ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md dark:shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-transparent"
                          : "text-slate-600 dark:text-zinc-300 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.08]"
                        }`}
                    >
                      {pill === "All" ? "View All" : pill}
                    </motion.button>
                  ))}
                </AnimatePresence>

                {ALL_CATEGORIES.length > INITIAL_PILLS_COUNT && (
                  <motion.button
                    layout
                    onClick={() => setShowAllFilters(!showAllFilters)}
                    className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border border-dashed border-slate-300 dark:border-white/[0.15] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-white/[0.4] flex items-center gap-1.5 bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.08] shrink-0 snap-center"
                  >
                    {showAllFilters ? (
                      <>Collapse <Minus size={12} strokeWidth={2.5} /></>
                    ) : (
                      <>+{ALL_CATEGORIES.length - INITIAL_PILLS_COUNT} More <Plus size={12} strokeWidth={2.5} /></>
                    )}
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          </section>

          <section className="min-h-[400px]">
            <motion.div layout="position" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              <AnimatePresence mode="popLayout">
                {filteredAlgorithms.length > 0 ? (
                  filteredAlgorithms.slice(0, visibleCount).map((algo, index) => (
                    <AlgoDataCard
                      key={algo.id}
                      algo={algo}
                      index={index}
                      onClick={() => navigate(`/view/${algo.id}`)}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="col-span-full py-20 sm:py-32 flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-white/[0.08] rounded-[1.5rem] sm:rounded-[2rem] bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl px-4 text-center shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                  >
                    <FolderDot size={48} className="text-slate-400 dark:text-zinc-600 mb-4 sm:mb-6 drop-shadow-sm dark:drop-shadow-md" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-200 mb-2">No Matrices Aligned</h3>
                    <p className="text-slate-500 dark:text-zinc-400 text-sm">Adjust your parameters or clear the command palette.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {filteredAlgorithms.length > visibleCount && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-12 sm:mt-16 flex justify-center w-full relative z-20"
                >
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="group relative px-6 sm:px-8 py-3.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl text-slate-800 dark:text-zinc-200 text-sm font-semibold tracking-wide transition-all duration-300 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-black hover:border-transparent shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_30px_rgba(0,0,0,0.2)] overflow-hidden w-full sm:w-auto"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Expand List <Zap className="w-4 h-4 text-blue-500 group-hover:text-white dark:group-hover:text-black transition-colors" />
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Index;