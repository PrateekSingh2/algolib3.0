import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import {
  Search, Star, CheckCircle2, Circle, Filter,
  ExternalLink, BookOpen, Loader2, RefreshCw, X,
  ChevronDown, ClipboardList, Zap
} from "lucide-react";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import { getDSAProgress, toggleDSAStatus, DSAProblem } from "@/lib/dsaApi";

// ─── Constants ────────────────────────────────────────────────────────────────

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
  Trees: "text-green-400", Graphs: "text-orange-400", "Dynamic Programming": "text-pink-400",
  "Binary Search": "text-yellow-400", Heap: "text-red-400", Backtracking: "text-indigo-400",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04] animate-pulse">
    <div className="w-6 h-3 bg-white/[0.06] rounded" />
    <div className="flex-1 h-3 bg-white/[0.06] rounded max-w-[260px]" />
    <div className="w-20 h-3 bg-white/[0.06] rounded hidden sm:block" />
    <div className="w-16 h-5 bg-white/[0.06] rounded-full hidden md:block" />
    <div className="w-16 h-3 bg-white/[0.06] rounded hidden lg:block" />
    <div className="w-6 h-6 bg-white/[0.06] rounded ml-auto" />
    <div className="w-6 h-6 bg-white/[0.06] rounded" />
  </div>
);

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

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await getDSAProgress();
      setProblems(data);
    } catch (e: unknown) {
      toast.error("Failed to load problems", { description: (e as Error).message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Optimistic toggle
  const handleToggle = async (id: string, field: "is_completed" | "needs_revision", cur: boolean) => {
    const key = `${id}-${field}`;
    if (toggling.has(key)) return;
    // Optimistic update
    setProblems(prev => prev.map(p => p.id === id ? { ...p, [field]: !cur } : p));
    setToggling(prev => new Set(prev).add(key));
    try {
      await toggleDSAStatus(id, field, !cur);
    } catch (e: unknown) {
      // Rollback
      setProblems(prev => prev.map(p => p.id === id ? { ...p, [field]: cur } : p));
      toast.error("Update failed", { description: (e as Error).message });
    } finally {
      setToggling(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  };

  // Filtered list
  const filtered = useMemo(() => problems.filter(p => {
    const s = search.toLowerCase();
    if (s && !p.title.toLowerCase().includes(s) && !p.topic.toLowerCase().includes(s)) return false;
    if (topic !== "All" && p.topic !== topic) return false;
    if (difficulty !== "All" && p.difficulty !== difficulty) return false;
    if (statusFilter === "Completed" && !p.is_completed) return false;
    if (statusFilter === "Pending" && p.is_completed) return false;
    if (statusFilter === "Needs Revision" && !p.needs_revision) return false;
    return true;
  }), [problems, search, topic, difficulty, statusFilter]);

  const total     = problems.length;
  const completed = problems.filter(p => p.is_completed).length;
  const revision  = problems.filter(p => p.needs_revision).length;
  const pct       = total ? Math.round((completed / total) * 100) : 0;

  const clearFilters = () => { setSearch(""); setTopic("All"); setDifficulty("All"); setStatus("All"); };
  const hasFilters = search || topic !== "All" || difficulty !== "All" || statusFilter !== "All";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col selection:bg-white/20">
      <Helmet>
        <title>DSA Practice Sheet — AlgoLib</title>
        <meta name="description" content="Track your Data Structures & Algorithms practice progress with AlgoLib's curated DSA sheet." />
      </Helmet>

      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 md:pt-32 pb-20">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              <ClipboardList size={14} className="text-zinc-400" />
            </div>
            <span className="text-[11px] font-mono text-zinc-500 tracking-widest uppercase">Practice Sheet</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">DSA Practice Sheet</h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            65 curated problems across 9 topics. Track what you've solved, flag what needs another pass.
          </p>
        </motion.div>

        {/* ── Progress Stats ───────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="mb-6 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-4">
            <StatPill label="Total" value={total} color="text-zinc-300" />
            <StatPill label="Solved" value={completed} color="text-emerald-400" />
            <StatPill label="Revision" value={revision} color="text-amber-400" />
            <div className="sm:ml-auto flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-mono">{pct}% complete</span>
              <button onClick={() => fetchData(true)} disabled={refreshing}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-all">
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
          </div>
        </motion.div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-5 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search problems..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 transition-colors" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"><X size={13} /></button>}
          </div>

          {/* Topic dropdown */}
          <div className="relative">
            <button onClick={() => setTopicOpen(p => !p)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-zinc-300 hover:bg-white/[0.07] transition-colors min-w-[140px] justify-between">
              <span className="flex items-center gap-1.5"><Filter size={13} className="text-zinc-500" />{topic}</span>
              <ChevronDown size={12} className={`text-zinc-500 transition-transform ${topicOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {topicOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute top-full left-0 mt-2 w-52 bg-[#111]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl p-1.5 shadow-2xl z-30">
                  {TOPICS.map(t => (
                    <button key={t} onClick={() => { setTopic(t); setTopicOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors ${topic === t ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"}`}>
                      {t}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Difficulty chips */}
          <div className="flex items-center gap-1.5">
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`px-3 py-2 text-[12px] font-medium rounded-lg border transition-all ${difficulty === d
                  ? d === "Easy" ? "bg-emerald-400/15 border-emerald-400/30 text-emerald-400"
                  : d === "Medium" ? "bg-amber-400/15 border-amber-400/30 text-amber-400"
                  : d === "Hard" ? "bg-red-400/15 border-red-400/30 text-red-400"
                  : "bg-white/[0.08] border-white/[0.1] text-white"
                  : "border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.12]"}`}>
                {d}
              </button>
            ))}
          </div>

          {/* Status */}
          <select value={statusFilter} onChange={e => setStatus(e.target.value)}
            className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-zinc-300 focus:outline-none cursor-pointer">
            {STATUS_FILTERS.map(s => <option key={s} value={s} className="bg-[#111]">{s}</option>)}
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 border border-white/[0.06] hover:border-white/[0.12] rounded-xl transition-all">
              Clear
            </button>
          )}
        </motion.div>

        {/* ── Problem Count ─────────────────────────────────────────────── */}
        {!loading && (
          <p className="text-xs text-zinc-600 mb-3 font-mono">
            {filtered.length} of {total} problems
            {hasFilters && " · filtered"}
          </p>
        )}

        {/* ── Problem List ────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">

          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-[2.5rem_1fr_140px_90px_90px_48px_48px] items-center px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
            {["#", "Problem", "Topic", "Difficulty", "Platform", <CheckCircle2 key="c" size={14} />, <Star key="s" size={14} />].map((h, i) => (
              <div key={i} className={`text-[11px] font-semibold text-zinc-600 uppercase tracking-wider ${i >= 5 ? "flex justify-center" : ""}`}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div>{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
                <BookOpen size={20} className="text-zinc-600" />
              </div>
              <p className="text-zinc-300 font-medium">No problems found</p>
              <p className="text-xs text-zinc-600">Try adjusting your filters</p>
              {hasFilters && <button onClick={clearFilters} className="text-xs text-zinc-400 underline underline-offset-2">Clear all filters</button>}
            </div>
          ) : (
            <div>
              {/* Desktop rows */}
              <div className="hidden md:block">
                {filtered.map((p, idx) => (
                  <DesktopRow key={p.id} problem={p} idx={idx} toggling={toggling} onToggle={handleToggle} />
                ))}
              </div>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-white/[0.04]">
                {filtered.map(p => (
                  <MobileCard key={p.id} problem={p} toggling={toggling} onToggle={handleToggle} />
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Legend ──────────────────────────────────────────────────────── */}
        {!loading && (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-zinc-600">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-400" /> Mark as solved</span>
            <span className="flex items-center gap-1.5"><Star size={12} className="text-amber-400" /> Flag for revision</span>
            <span className="flex items-center gap-1.5"><ExternalLink size={12} /> Opens problem in new tab</span>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
};

// ─── Desktop Row ──────────────────────────────────────────────────────────────

interface RowProps {
  problem: DSAProblem;
  idx: number;
  toggling: Set<string>;
  onToggle: (id: string, field: "is_completed" | "needs_revision", cur: boolean) => void;
}

const DesktopRow = ({ problem: p, idx, toggling, onToggle }: RowProps) => {
  const isTogglingDone = toggling.has(`${p.id}-is_completed`);
  const isTogglingRev  = toggling.has(`${p.id}-needs_revision`);

  return (
    <motion.div layout
      className={`group grid grid-cols-[2.5rem_1fr_140px_90px_90px_48px_48px] items-center px-4 py-3.5 border-b border-white/[0.04] last:border-0 transition-all hover:-translate-y-px ${p.is_completed ? "bg-emerald-500/[0.02]" : "hover:bg-white/[0.025]"}`}>

      <span className="text-[12px] text-zinc-600 font-mono">{idx + 1}</span>

      <a href={p.url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 group/link min-w-0">
        <span className={`text-[13px] font-medium truncate transition-colors ${p.is_completed ? "text-zinc-400 line-through decoration-zinc-600" : "text-zinc-200 group-hover/link:text-white"}`}>
          {p.title}
        </span>
        <ExternalLink size={11} className="text-zinc-700 group-hover/link:text-zinc-400 flex-shrink-0 transition-colors" />
      </a>

      <span className={`text-[12px] font-medium truncate pr-2 ${TOPIC_COLORS[p.topic] || "text-zinc-400"}`}>
        {p.topic}
      </span>

      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border w-fit ${DIFF_STYLES[p.difficulty]}`}>
        {p.difficulty}
      </span>

      <span className="text-[11px] text-zinc-600">{p.platform}</span>

      {/* Completed toggle */}
      <div className="flex justify-center">
        <button onClick={() => onToggle(p.id, "is_completed", p.is_completed)} disabled={isTogglingDone}
          className="p-1 rounded-lg hover:bg-white/[0.05] transition-all active:scale-90">
          {isTogglingDone
            ? <Loader2 size={16} className="animate-spin text-zinc-500" />
            : p.is_completed
              ? <CheckCircle2 size={16} className="text-emerald-400" />
              : <Circle size={16} className="text-zinc-600 hover:text-zinc-400" />}
        </button>
      </div>

      {/* Revision toggle */}
      <div className="flex justify-center">
        <button onClick={() => onToggle(p.id, "needs_revision", p.needs_revision)} disabled={isTogglingRev}
          className="p-1 rounded-lg hover:bg-white/[0.05] transition-all active:scale-90">
          {isTogglingRev
            ? <Loader2 size={14} className="animate-spin text-zinc-500" />
            : <Star size={14} className={`transition-colors ${p.needs_revision ? "text-amber-400 fill-amber-400" : "text-zinc-600 hover:text-amber-400"}`} />}
        </button>
      </div>
    </motion.div>
  );
};

// ─── Mobile Card ──────────────────────────────────────────────────────────────

interface CardProps {
  problem: DSAProblem;
  toggling: Set<string>;
  onToggle: (id: string, field: "is_completed" | "needs_revision", cur: boolean) => void;
}

const MobileCard = ({ problem: p, toggling, onToggle }: CardProps) => {
  const isTogglingDone = toggling.has(`${p.id}-is_completed`);
  const isTogglingRev  = toggling.has(`${p.id}-needs_revision`);

  return (
    <div className={`flex items-start gap-3 p-4 transition-colors ${p.is_completed ? "bg-emerald-500/[0.02]" : ""}`}>
      {/* Done toggle */}
      <button onClick={() => onToggle(p.id, "is_completed", p.is_completed)} disabled={isTogglingDone}
        className="mt-0.5 flex-shrink-0 active:scale-90 transition-transform">
        {isTogglingDone
          ? <Loader2 size={18} className="animate-spin text-zinc-500" />
          : p.is_completed
            ? <CheckCircle2 size={18} className="text-emerald-400" />
            : <Circle size={18} className="text-zinc-600" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <a href={p.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 mb-1.5 group/link">
          <span className={`text-[14px] font-medium leading-tight ${p.is_completed ? "line-through text-zinc-500 decoration-zinc-600" : "text-zinc-200"}`}>
            {p.title}
          </span>
          <ExternalLink size={11} className="text-zinc-700 group-hover/link:text-zinc-400 flex-shrink-0 transition-colors" />
        </a>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-medium ${TOPIC_COLORS[p.topic] || "text-zinc-400"}`}>{p.topic}</span>
          <span className="text-zinc-700">·</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${DIFF_STYLES[p.difficulty]}`}>{p.difficulty}</span>
          <span className="text-zinc-700">·</span>
          <span className="text-[11px] text-zinc-600">{p.platform}</span>
        </div>
      </div>

      {/* Revision star */}
      <button onClick={() => onToggle(p.id, "needs_revision", p.needs_revision)} disabled={isTogglingRev}
        className="mt-0.5 flex-shrink-0 active:scale-90 transition-transform">
        {isTogglingRev
          ? <Loader2 size={15} className="animate-spin text-zinc-500" />
          : <Star size={15} className={`${p.needs_revision ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`} />}
      </button>
    </div>
  );
};

// ─── Stat Pill ────────────────────────────────────────────────────────────────

const StatPill = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-baseline gap-2">
    <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
    <span className="text-xs text-zinc-600 font-medium">{label}</span>
  </div>
);

export default DSASheet;
