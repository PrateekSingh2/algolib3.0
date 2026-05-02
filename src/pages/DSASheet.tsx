import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import {
  Search, Star, CheckCircle2, Circle, Filter,
  ExternalLink, BookOpen, Loader2, RefreshCw, X,
  ChevronDown, ClipboardList, ChevronRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import { getDSAProgress, toggleDSAStatus, DSAProblem } from "@/lib/dsaApi";

// ─── Constants & Types ────────────────────────────────────────────────────────

const TOPICS = ["All", "Arrays", "Strings", "Linked List", "Trees", "Graphs", "Dynamic Programming", "Binary Search", "Heap", "Backtracking"];
const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];
const STATUS_FILTERS = ["All", "Completed", "Pending", "Needs Revision"];

const DIFF_STYLES: Record<string, string> = {
  Easy:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Hard:   "text-red-400 bg-red-400/10 border-red-400/20",
};

const TOPIC_COLORS: Record<string, string> = {
  Arrays: "text-blue-400", Strings: "text-purple-400", "Linked List": "text-cyan-400",
  Trees: "text-emerald-400", Graphs: "text-orange-400", "Dynamic Programming": "text-pink-400",
  "Binary Search": "text-yellow-400", Heap: "text-red-400", Backtracking: "text-indigo-400",
};

// ─── Utility: Fuzzy Search Logic ──────────────────────────────────────────────

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

const DSASheet = () => {
  const [problems, setProblems]       = useState<DSAProblem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [search, setSearch]           = useState("");
  const [topic, setTopic]             = useState("All");
  const [difficulty, setDifficulty]   = useState("All");
  const [statusFilter, setStatus]     = useState("All");
  const [topicOpen, setTopicOpen]     = useState(false);
  const [toggling, setToggling]       = useState<Set<string>>(new Set());
  
  // Track expanded topics
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await getDSAProgress();
      setProblems(data);
      // Auto-expand first topic if none are expanded
      if (!silent) {
        setExpandedTopics(new Set([TOPICS[1]])); // TOPICS[1] is 'Arrays'
      }
    } catch (e: unknown) {
      toast.error("Failed to load problems", { description: (e as Error).message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Optimistic toggle logic
  const handleToggle = async (id: string, field: "is_completed" | "needs_revision", cur: boolean) => {
    const key = `${id}-${field}`;
    if (toggling.has(key)) return;
    
    setProblems(prev => prev.map(p => p.id === id ? { ...p, [field]: !cur } : p));
    setToggling(prev => new Set(prev).add(key));
    try {
      await toggleDSAStatus(id, field, !cur);
    } catch (e: unknown) {
      setProblems(prev => prev.map(p => p.id === id ? { ...p, [field]: cur } : p));
      toast.error("Update failed", { description: (e as Error).message });
    } finally {
      setToggling(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  };

  // Advanced Filtering
  const filtered = useMemo(() => problems.filter(p => {
    if (search && !fuzzyMatch(search, p.title) && !fuzzyMatch(search, p.topic)) return false;
    if (topic !== "All" && p.topic !== topic) return false;
    if (difficulty !== "All" && p.difficulty !== difficulty) return false;
    if (statusFilter === "Completed" && !p.is_completed) return false;
    if (statusFilter === "Pending" && p.is_completed) return false;
    if (statusFilter === "Needs Revision" && !p.needs_revision) return false;
    return true;
  }), [problems, search, topic, difficulty, statusFilter]);

  // Auto-expand topics when searching
  useEffect(() => {
    if (search) {
      const matchingTopics = new Set(filtered.map(p => p.topic));
      setExpandedTopics(matchingTopics);
    }
  }, [search, filtered]);

  // Grouping by Topic
  const groupedProblems = useMemo(() => {
    const groups: Record<string, DSAProblem[]> = {};
    TOPICS.filter(t => t !== "All").forEach(t => groups[t] = []);
    filtered.forEach(p => {
      if (!groups[p.topic]) groups[p.topic] = [];
      groups[p.topic].push(p);
    });
    return Object.entries(groups).filter(([_, probs]) => probs.length > 0);
  }, [filtered]);

  const toggleTopic = (t: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const total     = problems.length;
  const completed = problems.filter(p => p.is_completed).length;
  const revision  = problems.filter(p => p.needs_revision).length;
  const pct       = total ? Math.round((completed / total) * 100) : 0;

  const clearFilters = () => { setSearch(""); setTopic("All"); setDifficulty("All"); setStatus("All"); };
  const hasFilters = search || topic !== "All" || difficulty !== "All" || statusFilter !== "All";

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-cyan-500/30">
      <Helmet>
        <title>DSA Practice Sheet — AlgoLib</title>
      </Helmet>

      <Navbar />

      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[150px]" />
      </div>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 md:pt-32 pb-20">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <ClipboardList size={14} />
            </div>
            <span className="text-[11px] font-mono text-cyan-500/80 tracking-widest uppercase">AlgoLib Ecosystem</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2 drop-shadow-sm">DSA Practice Sheet</h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            Master algorithms systematically. Track your completion, flag tough problems, and build your technical foundation.
          </p>
        </motion.div>

        {/* ── Master Progress Stats ───────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="mb-8 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-5">
            <StatPill label="Total Bank" value={total} color="text-zinc-300" />
            <StatPill label="Solved" value={completed} color="text-emerald-400" glow="drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
            <StatPill label="Revision Queue" value={revision} color="text-amber-400" glow="drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
            <div className="sm:ml-auto flex items-center gap-3">
              <div className="text-right">
                <span className="block text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">{pct}%</span>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Completion</span>
              </div>
              <button onClick={() => fetchData(true)} disabled={refreshing}
                className="p-2 rounded-xl text-zinc-500 bg-white/[0.03] border border-white/[0.05] hover:text-cyan-400 hover:border-cyan-500/30 transition-all active:scale-95 shadow-sm">
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden inset-shadow-sm border border-white/[0.02]">
            <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} />
          </div>
        </motion.div>

        {/* ── Filters Bar ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-8 flex flex-col sm:flex-row gap-3">
          {/* Fuzzy Search */}
          <div className="relative flex-1 group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Fuzzy search problems (e.g. 'fio' for First Occurrence)..."
              className="w-full pl-10 pr-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.04] transition-all shadow-inner" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/10"><X size={13} /></button>}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {/* Topic dropdown */}
            <div className="relative flex-shrink-0">
              <button onClick={() => setTopicOpen(p => !p)}
                className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all min-w-[150px] justify-between">
                <span className="flex items-center gap-2"><Filter size={14} className="text-cyan-500/70" />{topic}</span>
                <ChevronDown size={14} className={`text-zinc-500 transition-transform ${topicOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {topicOpen && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    className="absolute top-full right-0 sm:left-0 mt-2 w-56 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl p-2 shadow-2xl z-30">
                    {TOPICS.map(t => (
                      <button key={t} onClick={() => { setTopic(t); setTopicOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors ${topic === t ? "bg-cyan-500/10 text-cyan-400" : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"}`}>
                        {t}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status Dropdown */}
            <select value={statusFilter} onChange={e => setStatus(e.target.value)}
              className="px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2371717A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:10px_10px] bg-[right_12px_center]">
              {STATUS_FILTERS.map(s => <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>)}
            </select>
          </div>
        </motion.div>

        {/* ── Grouped Problem List ────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-4">
          
          {loading ? (
            <div className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-4">
              <div className="h-6 w-32 bg-white/[0.05] rounded mb-4 animate-pulse"></div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-white/[0.02] border border-white/[0.02] rounded-lg mb-2 animate-pulse" />
              ))}
            </div>
          ) : groupedProblems.length === 0 ? (
            <div className="py-24 flex flex-col items-center gap-4 text-center bg-white/[0.01] border border-white/[0.05] rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center shadow-inner">
                <Search size={24} className="text-zinc-600" />
              </div>
              <div>
                <p className="text-zinc-200 font-medium text-lg">No matching records found</p>
                <p className="text-sm text-zinc-500 mt-1">Adjust your fuzzy search or filter parameters.</p>
              </div>
              {hasFilters && <button onClick={clearFilters} className="mt-2 px-4 py-2 bg-white/[0.05] hover:bg-white/10 text-sm text-zinc-300 rounded-lg transition-all">Clear all filters</button>}
            </div>
          ) : (
            groupedProblems.map(([topicName, topicProblems]) => {
              const isExpanded = expandedTopics.has(topicName);
              const topicCompleted = topicProblems.filter(p => p.is_completed).length;
              const topicPct = Math.round((topicCompleted / topicProblems.length) * 100);

              return (
                <div key={topicName} className="rounded-xl border border-white/[0.05] bg-white/[0.01] backdrop-blur-md overflow-hidden transition-all duration-300">
                  {/* Topic Header */}
                  <button 
                    onClick={() => toggleTopic(topicName)}
                    className="w-full flex items-center justify-between p-4 sm:px-6 hover:bg-white/[0.02] transition-colors focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <ChevronRight size={18} className={`text-zinc-500 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`} />
                      <h2 className={`text-lg font-semibold tracking-wide ${TOPIC_COLORS[topicName] || "text-zinc-200"}`}>
                        {topicName}
                      </h2>
                      <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.05] text-xs font-mono text-zinc-400">
                        {topicCompleted} / {topicProblems.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 w-24 sm:w-48">
                      <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden relative">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-zinc-600 to-zinc-400 rounded-full transition-all duration-700"
                          style={{ width: `${topicPct}%`, backgroundColor: topicPct === 100 ? '#34d399' : '' }} 
                        />
                      </div>
                      <span className={`text-xs font-mono w-8 text-right ${topicPct === 100 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {topicPct}%
                      </span>
                    </div>
                  </button>

                  {/* Topic Body (Accordion) */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-white/[0.05] bg-[#050505]/50"
                      >
                        {/* Desktop Table Headers inside Accordion */}
                        <div className="hidden md:grid grid-cols-[2.5rem_1fr_90px_90px_48px_48px] items-center px-6 py-2 border-b border-white/[0.05] bg-black/20">
                          {["#", "Problem", "Difficulty", "Platform", <CheckCircle2 key="c" size={14} className="text-zinc-500" />, <Star key="s" size={14} className="text-zinc-500" />].map((h, i) => (
                            <div key={i} className={`text-[10px] font-semibold text-zinc-500 uppercase tracking-widest ${i >= 4 ? "flex justify-center" : ""}`}>{h}</div>
                          ))}
                        </div>

                        {/* Problem Rows */}
                        <div className="divide-y divide-white/[0.03]">
                          {topicProblems.map((p, idx) => (
                            <div key={p.id}>
                              {/* Desktop Row */}
                              <div className="hidden md:block">
                                <DesktopRow problem={p} idx={idx} toggling={toggling} onToggle={handleToggle} />
                              </div>
                              {/* Mobile Card */}
                              <div className="md:hidden">
                                <MobileCard problem={p} toggling={toggling} onToggle={handleToggle} />
                              </div>
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
        </motion.div>

        {/* ── Legend ──────────────────────────────────────────────────────── */}
        {!loading && problems.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center sm:justify-start items-center gap-6 text-[11px] font-mono text-zinc-500">
            <span className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-400 shadow-sm" /> Mark Completed</span>
            <span className="flex items-center gap-2"><Star size={13} className="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" /> Needs Revision</span>
            <span className="flex items-center gap-2"><ExternalLink size={13} /> Open Environment</span>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

const DesktopRow = ({ problem: p, idx, toggling, onToggle }: { problem: DSAProblem, idx: number, toggling: Set<string>, onToggle: any }) => {
  const isTogglingDone = toggling.has(`${p.id}-is_completed`);
  const isTogglingRev  = toggling.has(`${p.id}-needs_revision`);

  return (
    <div className={`group grid grid-cols-[2.5rem_1fr_90px_90px_48px_48px] items-center px-6 py-3.5 transition-all hover:bg-white/[0.02] ${p.is_completed ? "bg-emerald-500/[0.015]" : ""}`}>
      <span className="text-[12px] text-zinc-600 font-mono">{String(idx + 1).padStart(2, '0')}</span>

      <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group/link min-w-0 pr-4">
        <span className={`text-[13px] font-medium truncate transition-colors ${p.is_completed ? "text-zinc-500 line-through decoration-zinc-700" : "text-zinc-200 group-hover/link:text-cyan-400"}`}>
          {p.title}
        </span>
        <ExternalLink size={11} className="text-zinc-700 group-hover/link:text-cyan-500 opacity-0 group-hover/link:opacity-100 transition-all transform -translate-y-1 group-hover/link:translate-y-0" />
      </a>

      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border w-fit ${DIFF_STYLES[p.difficulty]}`}>
        {p.difficulty}
      </span>

      <span className="text-[11px] text-zinc-500 tracking-wide">{p.platform}</span>

      <div className="flex justify-center">
        <button onClick={() => onToggle(p.id, "is_completed", p.is_completed)} disabled={isTogglingDone}
          className="p-1.5 rounded-lg hover:bg-white/[0.08] transition-all active:scale-75">
          {isTogglingDone ? <Loader2 size={16} className="animate-spin text-zinc-500" /> : p.is_completed ? <CheckCircle2 size={16} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" /> : <Circle size={16} className="text-zinc-700 hover:text-zinc-400" />}
        </button>
      </div>

      <div className="flex justify-center">
        <button onClick={() => onToggle(p.id, "needs_revision", p.needs_revision)} disabled={isTogglingRev}
          className="p-1.5 rounded-lg hover:bg-white/[0.08] transition-all active:scale-75">
          {isTogglingRev ? <Loader2 size={14} className="animate-spin text-zinc-500" /> : <Star size={14} className={`transition-colors ${p.needs_revision ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" : "text-zinc-700 hover:text-amber-400"}`} />}
        </button>
      </div>
    </div>
  );
};

const MobileCard = ({ problem: p, toggling, onToggle }: { problem: DSAProblem, toggling: Set<string>, onToggle: any }) => {
  const isTogglingDone = toggling.has(`${p.id}-is_completed`);
  const isTogglingRev  = toggling.has(`${p.id}-needs_revision`);

  return (
    <div className={`flex items-start gap-3 p-4 transition-colors hover:bg-white/[0.01] ${p.is_completed ? "bg-emerald-500/[0.015]" : ""}`}>
      <button onClick={() => onToggle(p.id, "is_completed", p.is_completed)} disabled={isTogglingDone} className="mt-0.5 flex-shrink-0 active:scale-90 transition-transform">
        {isTogglingDone ? <Loader2 size={18} className="animate-spin text-zinc-500" /> : p.is_completed ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Circle size={18} className="text-zinc-600" />}
      </button>

      <div className="flex-1 min-w-0">
        <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mb-2 group/link">
          <span className={`text-[14px] font-medium leading-tight ${p.is_completed ? "line-through text-zinc-500 decoration-zinc-700" : "text-zinc-200 group-hover/link:text-cyan-400 transition-colors"}`}>
            {p.title}
          </span>
        </a>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${DIFF_STYLES[p.difficulty]}`}>{p.difficulty}</span>
          <span className="text-[11px] text-zinc-600">{p.platform}</span>
        </div>
      </div>

      <button onClick={() => onToggle(p.id, "needs_revision", p.needs_revision)} disabled={isTogglingRev} className="mt-0.5 flex-shrink-0 active:scale-90 transition-transform">
        {isTogglingRev ? <Loader2 size={16} className="animate-spin text-zinc-500" /> : <Star size={16} className={`${p.needs_revision ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`} />}
      </button>
    </div>
  );
};

const StatPill = ({ label, value, color, glow = "" }: { label: string; value: number; color: string; glow?: string }) => (
  <div className="flex flex-col">
    <span className={`text-3xl font-bold tabular-nums tracking-tight ${color} ${glow}`}>{value}</span>
    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-1">{label}</span>
  </div>
);

export default DSASheet;