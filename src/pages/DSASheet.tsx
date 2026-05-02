import { useState, useEffect, useMemo, useCallback, useDeferredValue, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import {
  Search, Star, CheckCircle2, Circle, Filter,
  ExternalLink, Loader2, RefreshCw, X,
  ChevronDown, ClipboardList, ChevronRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import { getDSAProgress, toggleDSAStatus, DSAProblem } from "@/lib/dsaApi";

// ─── Constants & Configurations ──────────────────────────────────────────────

const TOPICS = ["All", "Arrays", "Strings", "Linked List", "Trees", "Graphs", "Dynamic Programming", "Binary Search", "Heap", "Backtracking"];
const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];
const STATUSES = ["All", "Pending", "Completed", "Revision"];

const DIFF_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  Easy:   { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  Medium: { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  Hard:   { text: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20" },
};

// ─── Utility: Fuzzy Search Engine ─────────────────────────────────────────────

const fuzzyMatch = (pattern: string, str: string) => {
  if (!pattern) return true;
  const p = pattern.toLowerCase().replace(/\s+/g, "");
  const s = str.toLowerCase();
  let pIdx = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === p[pIdx]) pIdx++;
    if (pIdx === p.length) return true;
  }
  return false;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DSASheet() {
  const [problems, setProblems] = useState<DSAProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [isMac, setIsMac] = useState(false);

  // Filter States & Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [topic, setTopic] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [status, setStatus] = useState("All");
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);

  // ─── Global Keyboard Shortcuts ───
  useEffect(() => {
    // Detect OS for accurate shortcut display
    setIsMac(typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl + / OR Cmd + /
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Data Fetching ───
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await getDSAProgress();
      setProblems(data);
      if (!silent && data.length > 0) {
        setExpandedTopics(new Set([TOPICS[1]])); // Auto-expand first real topic
      }
    } catch (error) {
      toast.error("Failed to sync progress. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Optimistic Updates ───
  const handleToggle = async (id: string, field: "is_completed" | "needs_revision", currentValue: boolean) => {
    const key = `${id}-${field}`;
    if (toggling.has(key)) return;

    setProblems(prev => prev.map(p => p.id === id ? { ...p, [field]: !currentValue } : p));
    setToggling(prev => new Set(prev).add(key));

    try {
      await toggleDSAStatus(id, field, !currentValue);
    } catch {
      setProblems(prev => prev.map(p => p.id === id ? { ...p, [field]: currentValue } : p));
      toast.error("Update failed. Reverting changes.");
    } finally {
      setToggling(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // ─── Filter Engine ───
  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      if (status === "Completed" && !p.is_completed) return false;
      if (status === "Pending" && p.is_completed) return false;
      if (status === "Revision" && !p.needs_revision) return false;
      if (difficulty !== "All" && p.difficulty !== difficulty) return false;
      if (topic !== "All" && p.topic !== topic) return false;
      if (deferredSearch && !fuzzyMatch(deferredSearch, p.title) && !fuzzyMatch(deferredSearch, p.topic)) return false;
      return true;
    });
  }, [problems, status, difficulty, topic, deferredSearch]);

  useEffect(() => {
    if (deferredSearch) {
      const matchingTopics = new Set(filteredProblems.map(p => p.topic));
      setExpandedTopics(matchingTopics);
    }
  }, [deferredSearch, filteredProblems]);

  // ─── Grouping Engine ───
  const groupedProblems = useMemo(() => {
    const groups: Record<string, DSAProblem[]> = {};
    TOPICS.filter(t => t !== "All").forEach(t => groups[t] = []);
    filteredProblems.forEach(p => {
      if (!groups[p.topic]) groups[p.topic] = [];
      groups[p.topic].push(p);
    });
    return Object.entries(groups).filter(([_, probs]) => probs.length > 0);
  }, [filteredProblems]);

  // ─── Utility Methods ───
  const total = problems.length;
  const completed = problems.filter(p => p.is_completed).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  
  const clearFilters = () => { setSearch(""); setTopic("All"); setDifficulty("All"); setStatus("All"); };
  const hasActiveFilters = search || topic !== "All" || difficulty !== "All" || status !== "All";

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans selection:bg-cyan-500/30">
      <Helmet><title>DSA Master Sheet — AlgoLib</title></Helmet>

      {/* ─── BULLETPROOF LOCAL STYLE BLOCK ─── */}
      <style dangerouslySetInnerHTML={{
        __html: `
          #dsa-filter-track::-webkit-scrollbar {
            display: none !important;
            height: 0px !important;
            width: 0px !important;
            background: transparent !important;
            -webkit-appearance: none !important;
          }
          #dsa-filter-track {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
        `
      }} />

      <Navbar />

      {/* Deep Glassmorphism Ambient Mesh Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Top Left Cyan Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-900/20 blur-[150px]" />
        {/* Bottom Right Purple Glow */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-900/10 blur-[150px]" />
      </div>

      <main className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-32 pb-24">
        
        {/* ─── Header ─── */}
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)] mb-4">
            <ClipboardList size={14} className="text-cyan-400" />
            <span className="text-[11px] font-mono text-cyan-400/80 uppercase tracking-widest">Master Curriculum</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3 drop-shadow-md">DSA Practice Sheet</h1>
          <p className="text-zinc-400 max-w-2xl text-sm sm:text-base leading-relaxed">
            A highly structured, non-linear progression path to master Data Structures & Algorithms. Track your execution, queue revisions, and build algorithmic intuition.
          </p>
        </header>

        {/* ─── Global Progress Card (GLASSMORPHISM FIX) ─── */}
        <section className="mb-8 relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-8 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
          {/* Subtle inner top highlight */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-wrap items-center gap-8 md:gap-12">
              <StatBlock label="Total Problems" value={total} />
              <div className="hidden sm:block w-px h-12 bg-white/[0.08]" />
              <StatBlock label="Completed" value={completed} color="text-emerald-400" glow="drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
              <div className="hidden sm:block w-px h-12 bg-white/[0.08]" />
              <StatBlock label="Revision Queue" value={problems.filter(p => p.needs_revision).length} color="text-amber-400" glow="drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
            </div>

            {/* FIXED ALIGNMENT: Matrix & Refresh Button */}
            <div className="flex flex-col w-full md:w-[35%] xl:w-[30%]">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Completion Matrix</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 leading-none">{pct}%</span>
                  <button onClick={() => fetchData(true)} disabled={refreshing} className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] transition-all active:scale-95 focus:outline-none shadow-sm backdrop-blur-md">
                    <RefreshCw size={14} className={`text-zinc-400 ${refreshing ? "animate-spin text-cyan-400" : "hover:text-white"}`} />
                  </button>
                </div>
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/[0.05] shadow-inner relative">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full relative z-10 shadow-[0_0_12px_rgba(52,211,153,0.6)]" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Advanced Filter Engine (GLASSMORPHISM & UI FIX) ─── */}
        <section className="sticky top-24 z-20 mb-8 p-3 rounded-2xl bg-[#080808]/70 border border-white/[0.08] backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col xl:flex-row gap-3">
          
          {/* Command Search */}
          <div className="relative flex-1 group min-w-[200px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-400 transition-colors z-10" />
            <input 
              ref={searchInputRef}
              value={search} onChange={e => setSearch(e.target.value)} 
              placeholder="Fuzzy search (e.g., 'twosum', 'dp')..."
              className="w-full pl-11 pr-14 py-3.5 bg-black/40 border border-white/[0.06] rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/40 transition-all shadow-inner focus:bg-white/[0.02]" 
            />
            {/* Keyboard Shortcut Indicator - Disappears when typing */}
            {!search && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none opacity-60 group-focus-within:opacity-0 transition-opacity duration-200">
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 rounded bg-white/[0.08] border border-white/[0.1] text-[10px] font-medium text-zinc-400 font-sans tracking-widest shadow-sm">
                  {isMac ? '⌘ /' : 'Ctrl /'}
                </kbd>
              </div>
            )}
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors z-10">
                <X size={14} />
              </button>
            )}
          </div>

          <div 
            id="dsa-filter-track"
            className="flex items-center gap-3 overflow-x-auto overflow-y-hidden w-full xl:w-auto scroll-smooth"
          >
            {/* Custom Topic Dropdown */}
            <div className="relative shrink-0 min-w-[160px] h-full">
              <button 
                onClick={() => setTopicDropdownOpen(!topicDropdownOpen)}
                className="w-full h-full flex items-center justify-between px-4 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-colors backdrop-blur-md"
              >
                <span className="flex items-center gap-2"><Filter size={14} className="text-zinc-400" /> {topic === "All" ? "All Topics" : topic}</span>
                <ChevronDown size={14} className={`text-zinc-500 transition-transform ${topicDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {topicDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }}
                    className="absolute top-[calc(100%+8px)] right-0 mt-0 w-full sm:w-64 bg-[#0d0d0d]/95 backdrop-blur-3xl border border-white/[0.1] rounded-xl p-1.5 shadow-2xl z-50">
                    {TOPICS.map(t => (
                      <button key={t} onClick={() => { setTopic(t); setTopicDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all ${topic === t ? "bg-cyan-500/15 text-cyan-400 shadow-sm" : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"}`}>
                        {t}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Unified Segmented Controls Track */}
            <div className="flex items-center gap-2 shrink-0 bg-black/50 border border-white/[0.06] shadow-inner rounded-xl p-1.5 h-full">
              <SegmentedControl options={STATUSES} selected={status} onChange={setStatus} />
              <div className="w-px h-6 bg-white/[0.08] shrink-0 mx-1" />
              <SegmentedControl options={DIFFICULTIES} selected={difficulty} onChange={setDifficulty} />
            </div>
          </div>
        </section>

        {/* ─── Active Filters Info ─── */}
        {hasActiveFilters && (
          <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
            <span className="text-xs text-zinc-500 font-mono">Showing {filteredProblems.length} results</span>
            <button onClick={clearFilters} className="text-xs text-zinc-400 hover:text-white underline underline-offset-4 decoration-zinc-700 hover:decoration-white transition-all">Clear criteria</button>
          </div>
        )}

        {/* ─── Data Render ─── */}
        <section className="space-y-5">
          {loading ? (
            <SkeletonLoader />
          ) : groupedProblems.length === 0 ? (
            <EmptyState clearFilters={clearFilters} hasFilters={hasActiveFilters} />
          ) : (
            groupedProblems.map(([topicName, topicProblems]) => {
              const isExpanded = expandedTopics.has(topicName);
              const completedInTopic = topicProblems.filter(p => p.is_completed).length;
              const topicPct = Math.round((completedInTopic / topicProblems.length) * 100);

              return (
                <div key={topicName} className="rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-md overflow-hidden transition-all hover:border-white/[0.1] hover:bg-white/[0.02]">
                  
                  {/* Accordion Header */}
                  <button 
                    onClick={() => {
                      const next = new Set(expandedTopics);
                      next.has(topicName) ? next.delete(topicName) : next.add(topicName);
                      setExpandedTopics(next);
                    }}
                    className="w-full group flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-6 focus:outline-none"
                  >
                    <div className="flex items-center gap-4 mb-3 sm:mb-0">
                      <div className={`p-1.5 rounded-lg transition-all ${isExpanded ? "bg-white/[0.1] text-white shadow-sm" : "bg-white/[0.03] text-zinc-400 group-hover:bg-white/[0.08]"}`}>
                        <ChevronRight size={16} className={`transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                      <h2 className="text-[17px] font-semibold text-white tracking-wide">{topicName}</h2>
                    </div>

                    {/* Topic Metrics Pill */}
                    <div className="flex items-center gap-4 pl-12 sm:pl-0">
                      <div className="flex items-center gap-3 px-3.5 py-2 rounded-full bg-black/40 border border-white/[0.06] shadow-inner">
                        <span className="text-[11px] font-mono text-zinc-400">{completedInTopic}/{topicProblems.length}</span>
                        <div className="w-16 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${topicPct === 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-cyan-500'}`} style={{ width: `${topicPct}%` }} />
                        </div>
                        <span className={`text-[11px] font-mono font-bold ${topicPct === 100 ? 'text-emerald-400' : 'text-zinc-300'}`}>{topicPct}%</span>
                      </div>
                    </div>
                  </button>

                  {/* Accordion Body */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-white/[0.06] bg-black/20"
                      >
                        <div className="hidden md:grid grid-cols-[3rem_1fr_100px_100px_60px_60px] items-center px-6 py-3 bg-white/[0.01] border-b border-white/[0.03]">
                          {["ID", "Problem Title", "Difficulty", "Platform", "Done", "Revise"].map((h, i) => (
                            <span key={i} className={`text-[10px] font-semibold text-zinc-500 uppercase tracking-widest ${i >= 4 ? "text-center" : ""}`}>{h}</span>
                          ))}
                        </div>

                        <div className="divide-y divide-white/[0.03]">
                          {topicProblems.map((p, idx) => (
                            <div key={p.id}>
                              <div className="hidden md:block"><DesktopDataRow problem={p} idx={idx} toggling={toggling} onToggle={handleToggle} /></div>
                              <div className="md:hidden"><MobileDataCard problem={p} toggling={toggling} onToggle={handleToggle} /></div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </section>
      </main>
      <AppFooter />
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

// 1. Unified Segmented Control
const SegmentedControl = ({ options, selected, onChange }: { options: string[], selected: string, onChange: (v: string) => void }) => (
  <div className="flex items-center shrink-0">
    {options.map(opt => (
      <button key={opt} onClick={() => onChange(opt)}
        className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all whitespace-nowrap ${selected === opt ? "bg-white/10 text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-white/[0.05]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-transparent"}`}>
        {opt}
      </button>
    ))}
  </div>
);

// 2. Desktop Row Item
const DesktopDataRow = ({ problem: p, idx, toggling, onToggle }: any) => {
  const diffStyle = DIFF_STYLES[p.difficulty] || DIFF_STYLES["Easy"];
  return (
    <div className={`group grid grid-cols-[3rem_1fr_100px_100px_60px_60px] items-center px-6 py-4 transition-colors hover:bg-white/[0.02] ${p.is_completed ? "opacity-60 bg-emerald-900/[0.02]" : ""}`}>
      <span className="text-[12px] text-zinc-600 font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
      
      <a href={p.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 pr-4 group/link">
        <span className={`text-[14.5px] font-medium truncate transition-colors ${p.is_completed ? "line-through decoration-zinc-600 text-zinc-500" : "text-zinc-200 group-hover/link:text-cyan-400"}`}>
          {p.title}
        </span>
        <ExternalLink size={12} className="text-zinc-600 opacity-0 group-hover/link:opacity-100 transition-all -translate-y-1 group-hover/link:translate-y-0" />
      </a>

      <div className="flex items-center">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm ${diffStyle.bg} ${diffStyle.border} ${diffStyle.text}`}>
          {p.difficulty}
        </span>
      </div>

      <span className="text-[13px] text-zinc-500 capitalize">{p.platform}</span>

      <div className="flex justify-center">
        <ActionButton type="is_completed" problem={p} toggling={toggling} onToggle={onToggle} />
      </div>
      <div className="flex justify-center">
        <ActionButton type="needs_revision" problem={p} toggling={toggling} onToggle={onToggle} />
      </div>
    </div>
  );
};

// 3. Mobile Card Item
const MobileDataCard = ({ problem: p, toggling, onToggle }: any) => {
  const diffStyle = DIFF_STYLES[p.difficulty] || DIFF_STYLES["Easy"];
  return (
    <div className="p-5 flex gap-3 hover:bg-white/[0.02] transition-colors">
      <div className="mt-1"><ActionButton type="is_completed" problem={p} toggling={toggling} onToggle={onToggle} /></div>
      <div className="flex-1 min-w-0">
        <a href={p.url} target="_blank" rel="noreferrer" className={`block text-[15px] font-medium mb-2 leading-snug truncate ${p.is_completed ? "line-through text-zinc-500 decoration-zinc-700" : "text-zinc-200"}`}>
          {p.title}
        </a>
        <div className="flex items-center gap-2.5 text-[10px]">
          <span className={`px-2 py-0.5 rounded border uppercase font-bold ${diffStyle.text} ${diffStyle.border} ${diffStyle.bg}`}>{p.difficulty}</span>
          <span className="text-zinc-500 uppercase tracking-wider font-medium">{p.platform}</span>
        </div>
      </div>
      <div className="mt-1"><ActionButton type="needs_revision" problem={p} toggling={toggling} onToggle={onToggle} /></div>
    </div>
  );
};

// 4. Action Button Logic
const ActionButton = ({ type, problem, toggling, onToggle }: any) => {
  const isToggling = toggling.has(`${problem.id}-${type}`);
  const isDone = type === "is_completed";
  const active = problem[type];

  return (
    <button 
      onClick={() => onToggle(problem.id, type, active)} disabled={isToggling}
      className="p-1.5 rounded-lg text-zinc-600 hover:bg-white/[0.08] active:scale-90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
    >
      {isToggling ? <Loader2 size={18} className="animate-spin text-zinc-500" /> : 
        isDone ? (active ? <CheckCircle2 size={20} className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]" /> : <Circle size={20} className="hover:text-zinc-400" />) :
                 (active ? <Star size={18} className="text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]" /> : <Star size={18} className="hover:text-amber-400/50" />)
      }
    </button>
  );
};

// 5. Shared UI Fragments
const StatBlock = ({ label, value, color = "text-white", glow = "" }: { label: string, value: number, color?: string, glow?: string }) => (
  <div>
    <div className={`text-3xl font-bold tracking-tight mb-1 ${color} ${glow}`}>{value}</div>
    <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{label}</div>
  </div>
);

const EmptyState = ({ clearFilters, hasFilters }: any) => (
  <div className="flex flex-col items-center justify-center py-24 text-center border border-white/[0.06] rounded-2xl bg-white/[0.01] backdrop-blur-md shadow-inner">
    <div className="w-14 h-14 bg-white/[0.03] rounded-2xl flex items-center justify-center mb-5 border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
      <Search size={24} className="text-zinc-500" />
    </div>
    <h3 className="text-zinc-200 font-semibold text-lg">No matching problems</h3>
    <p className="text-zinc-500 text-sm mt-1 mb-5">Try adjusting your filters or search terms.</p>
    {hasFilters && (
      <button onClick={clearFilters} className="px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-sm font-medium rounded-xl transition-all border border-white/[0.08] shadow-sm">
        Clear all filters
      </button>
    )}
  </div>
);

const SkeletonLoader = () => (
  <div className="space-y-5">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-20 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md animate-pulse shadow-sm" />
    ))}
  </div>
);