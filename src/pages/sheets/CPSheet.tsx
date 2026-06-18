import { useState, useEffect, useMemo, useCallback, useDeferredValue, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Search, Star, CheckCircle2, Circle, Filter, ExternalLink, Loader2, RefreshCw, X, ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCPProgress, toggleCPStatus, CPProblem } from "@/lib/cpApi";

const CP_TOPICS = ["All","Number Theory","Graph Theory","Dynamic Programming","Data Structures","String Algorithms","Geometry","Combinatorics","Game Theory","Greedy","Bit Manipulation"];
const DIFFICULTIES = ["All","Easy","Medium","Hard"];
const STATUSES = ["All","Pending","Completed","Revision"];

const DIFF_STYLES: Record<string,{text:string;bg:string;border:string}> = {
  Easy:   { text:"text-emerald-400", bg:"bg-emerald-400/10", border:"border-emerald-400/20" },
  Medium: { text:"text-amber-400",   bg:"bg-amber-400/10",   border:"border-amber-400/20"   },
  Hard:   { text:"text-rose-400",    bg:"bg-rose-400/10",    border:"border-rose-400/20"    },
};

const fuzzyMatch = (pattern: string, str: string) => {
  if (!pattern) return true;
  const p = pattern.toLowerCase().replace(/\s+/g,"");
  const s = str.toLowerCase();
  let pi = 0;
  for (let i = 0; i < s.length; i++) { if (s[i]===p[pi]) pi++; if (pi===p.length) return true; }
  return false;
};

export default function CPSheet() {
  const [problems, setProblems] = useState<CPProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [isMac, setIsMac] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [topic, setTopic] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [status, setStatus] = useState("All");
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey||e.metaKey)&&e.key==="/") { e.preventDefault(); searchInputRef.current?.focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchData = useCallback(async (silent=false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await getCPProgress();
      setProblems(data);
      if (!silent && data.length>0) setExpandedTopics(new Set([CP_TOPICS[1]]));
    } catch { toast.error("Failed to sync progress. Please try again."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(()=>{ fetchData(); },[fetchData]);

  const handleToggle = async (id: string, field: "is_completed"|"needs_revision", cur: boolean) => {
    const key = `${id}-${field}`;
    if (toggling.has(key)) return;
    setProblems(prev=>prev.map(p=>p.id===id?{...p,[field]:!cur}:p));
    setToggling(prev=>new Set(prev).add(key));
    try { await toggleCPStatus(id,field,!cur); }
    catch { setProblems(prev=>prev.map(p=>p.id===id?{...p,[field]:cur}:p)); toast.error("Update failed."); }
    finally { setToggling(prev=>{ const n=new Set(prev); n.delete(key); return n; }); }
  };

  const filteredProblems = useMemo(()=>problems.filter(p=>{
    if (status==="Completed"&&!p.is_completed) return false;
    if (status==="Pending"&&p.is_completed) return false;
    if (status==="Revision"&&!p.needs_revision) return false;
    if (difficulty!=="All"&&p.difficulty!==difficulty) return false;
    if (topic!=="All"&&p.topic!==topic) return false;
    if (deferredSearch&&!fuzzyMatch(deferredSearch,p.title)&&!fuzzyMatch(deferredSearch,p.topic)) return false;
    return true;
  }),[problems,status,difficulty,topic,deferredSearch]);

  useEffect(()=>{ if(deferredSearch) setExpandedTopics(new Set(filteredProblems.map(p=>p.topic))); },[deferredSearch,filteredProblems]);

  const groupedProblems = useMemo(()=>{
    const groups: Record<string,CPProblem[]> = {};
    CP_TOPICS.filter(t=>t!=="All").forEach(t=>groups[t]=[]);
    filteredProblems.forEach(p=>{ if(!groups[p.topic]) groups[p.topic]=[]; groups[p.topic].push(p); });
    return Object.entries(groups).filter(([,ps])=>ps.length>0);
  },[filteredProblems]);

  const total=problems.length, completed=problems.filter(p=>p.is_completed).length, pct=total?Math.round((completed/total)*100):0;
  const clearFilters=()=>{ setSearch(""); setTopic("All"); setDifficulty("All"); setStatus("All"); };
  const hasActiveFilters=!!(search||topic!=="All"||difficulty!=="All"||status!=="All");

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans selection:bg-emerald-500/30">
      <Helmet><title>CP Master Sheet — AlgoLib</title></Helmet>
      <style dangerouslySetInnerHTML={{__html:`.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:4px}`}} />
      <Navbar />

      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-900/15 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-teal-900/10 blur-[150px]" />
      </div>

      <main className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-28 md:pt-32 pb-24">

        {/* Back button */}
        <Link to="/sheets" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 text-sm mb-8 transition-colors group">
          <ChevronRight size={15} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
          Back to Sheets
        </Link>

        {/* Header */}
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md mb-4">
            <Terminal size={14} className="text-emerald-400" />
            <span className="text-[11px] font-mono text-emerald-400/80 uppercase tracking-widest">CP Roadmap</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">CP Practice Sheet</h1>
          <p className="text-zinc-400 max-w-2xl text-sm sm:text-base leading-relaxed">
            Master competitive programming with advanced algorithms, graph theory, combinatorics, and contest-level problem solving.
          </p>
        </header>

        {/* Progress card */}
        <section className="mb-8 relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-8 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-wrap items-center gap-8 md:gap-12">
              <StatBlock label="Total Problems" value={total} />
              <div className="hidden sm:block w-px h-12 bg-white/[0.08]" />
              <StatBlock label="Completed" value={completed} color="text-emerald-400" glow="drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
              <div className="hidden sm:block w-px h-12 bg-white/[0.08]" />
              <StatBlock label="Revision Queue" value={problems.filter(p=>p.needs_revision).length} color="text-amber-400" glow="drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
            </div>
            <div className="flex flex-col w-full md:w-[35%] xl:w-[30%]">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Completion Matrix</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 leading-none">{pct}%</span>
                  <button onClick={()=>fetchData(true)} disabled={refreshing} className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.1] transition-all active:scale-95">
                    <RefreshCw size={14} className={`text-zinc-400 ${refreshing?"animate-spin text-emerald-400":""}`} />
                  </button>
                </div>
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/[0.05] shadow-inner">
                <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:1,ease:"circOut"}}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="relative z-40 mb-8 p-3 rounded-2xl bg-[#080808]/85 border border-white/[0.08] backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1 group w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors z-10" />
            <input ref={searchInputRef} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Fuzzy search problems..."
              className="w-full pl-11 pr-14 py-3.5 bg-black/40 border border-white/[0.06] rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40 transition-all shadow-inner" />
            {!search && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 group-focus-within:opacity-0 transition-opacity">
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 rounded bg-white/[0.08] border border-white/[0.1] text-[10px] font-medium text-zinc-400 tracking-widest">{isMac?"⌘ /":"Ctrl /"}</kbd>
              </div>
            )}
            {search && (
              <button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors z-10">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full xl:w-auto z-50">
            {/* Topic dropdown */}
            <div className="relative w-full lg:w-auto min-w-[180px] shrink-0 z-50">
              <button onClick={()=>setTopicDropdownOpen(!topicDropdownOpen)}
                className="w-full h-full flex items-center justify-between px-4 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-colors">
                <span className="flex items-center gap-2"><Filter size={14} className="text-zinc-400" />{topic==="All"?"All Topics":topic}</span>
                <ChevronDown size={14} className={`text-zinc-500 transition-transform ${topicDropdownOpen?"rotate-180":""}`} />
              </button>
              <AnimatePresence>
                {topicDropdownOpen && (
                  <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:5}} transition={{duration:0.15}}
                    className="absolute top-[calc(100%+8px)] left-0 w-full sm:w-64 max-h-[50vh] overflow-y-auto bg-[#0d0d0d]/95 backdrop-blur-3xl border border-white/[0.1] rounded-xl p-1.5 shadow-2xl z-[100] custom-scrollbar">
                    {CP_TOPICS.map(t=>(
                      <button key={t} onClick={()=>{setTopic(t);setTopicDropdownOpen(false);}}
                        className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all ${topic===t?"bg-emerald-500/15 text-emerald-400":"text-zinc-400 hover:bg-white/[0.06] hover:text-white"}`}>
                        {t}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <div className="flex bg-black/50 border border-white/[0.06] shadow-inner rounded-xl p-1.5 w-full sm:w-auto">
                <SegCtrl options={STATUSES} selected={status} onChange={setStatus} />
              </div>
              <div className="flex bg-black/50 border border-white/[0.06] shadow-inner rounded-xl p-1.5 w-full sm:w-auto">
                <SegCtrl options={DIFFICULTIES} selected={difficulty} onChange={setDifficulty} />
              </div>
            </div>
          </div>
        </section>

        {hasActiveFilters && (
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs text-zinc-500 font-mono">Showing {filteredProblems.length} results</span>
            <button onClick={clearFilters} className="text-xs text-zinc-400 hover:text-white underline underline-offset-4">Clear criteria</button>
          </div>
        )}

        {/* Problem list */}
        <section className="space-y-5">
          {loading ? <SkeletonLoader /> : groupedProblems.length===0 ? <EmptyState clearFilters={clearFilters} hasFilters={hasActiveFilters} /> : (
            groupedProblems.map(([topicName,topicProblems])=>{
              const isExpanded=expandedTopics.has(topicName);
              const done=topicProblems.filter(p=>p.is_completed).length;
              const tpct=Math.round((done/topicProblems.length)*100);
              return (
                <div key={topicName} className="rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-md overflow-hidden transition-all hover:border-white/[0.1] hover:bg-white/[0.02]">
                  <button onClick={()=>{const n=new Set(expandedTopics);n.has(topicName)?n.delete(topicName):n.add(topicName);setExpandedTopics(n);}}
                    className="w-full group flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-6 focus:outline-none">
                    <div className="flex items-center gap-4 mb-3 sm:mb-0">
                      <div className={`p-1.5 rounded-lg transition-all ${isExpanded?"bg-white/[0.1] text-white":"bg-white/[0.03] text-zinc-400 group-hover:bg-white/[0.08]"}`}>
                        <ChevronRight size={16} className={`transition-transform duration-300 ${isExpanded?"rotate-90":""}`} />
                      </div>
                      <h2 className="text-[17px] font-semibold text-white tracking-wide">{topicName}</h2>
                    </div>
                    <div className="flex items-center gap-4 pl-12 sm:pl-0">
                      <div className="flex items-center gap-3 px-3.5 py-2 rounded-full bg-black/40 border border-white/[0.06] shadow-inner">
                        <span className="text-[11px] font-mono text-zinc-400">{done}/{topicProblems.length}</span>
                        <div className="w-16 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${tpct===100?"bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]":"bg-emerald-500"}`} style={{width:`${tpct}%`}} />
                        </div>
                        <span className={`text-[11px] font-mono font-bold ${tpct===100?"text-emerald-400":"text-zinc-300"}`}>{tpct}%</span>
                      </div>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.2}}
                        className="overflow-hidden border-t border-white/[0.06] bg-black/20">
                        <div className="hidden md:grid grid-cols-[3rem_1fr_100px_100px_60px_60px] items-center px-6 py-3 bg-white/[0.01] border-b border-white/[0.03]">
                          {["ID","Problem Title","Difficulty","Platform","Done","Revise"].map((h,i)=>(
                            <span key={i} className={`text-[10px] font-semibold text-zinc-500 uppercase tracking-widest ${i>=4?"text-center":""}`}>{h}</span>
                          ))}
                        </div>
                        <div className="divide-y divide-white/[0.03]">
                          {topicProblems.map((p,idx)=>(
                            <div key={p.id}>
                              <div className="hidden md:block"><DesktopRow problem={p} idx={idx} toggling={toggling} onToggle={handleToggle} /></div>
                              <div className="md:hidden"><MobileCard problem={p} toggling={toggling} onToggle={handleToggle} /></div>
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
      <Footer />
    </div>
  );
}

const SegCtrl = ({options,selected,onChange}:{options:string[];selected:string;onChange:(v:string)=>void}) => (
  <div className="flex items-center gap-1 w-full sm:w-auto">
    {options.map(opt=>(
      <button key={opt} onClick={()=>onChange(opt)}
        className={`flex-1 sm:flex-none px-2 py-1.5 text-[12px] sm:text-[13px] font-medium rounded-lg transition-all text-center ${selected===opt?"bg-white/10 text-white shadow border border-white/[0.05]":"text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-transparent"}`}>
        {opt}
      </button>
    ))}
  </div>
);

const DesktopRow = ({problem:p,idx,toggling,onToggle}:any) => {
  const ds=DIFF_STYLES[p.difficulty]||DIFF_STYLES["Easy"];
  return (
    <div className={`group grid grid-cols-[3rem_1fr_100px_100px_60px_60px] items-center px-6 py-4 transition-colors hover:bg-white/[0.02] ${p.is_completed?"opacity-60":""}`}>
      <span className="text-[12px] text-zinc-600 font-mono">{(idx+1).toString().padStart(2,"0")}</span>
      <a href={p.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 pr-4 group/link">
        <span className={`text-[14.5px] font-medium truncate transition-colors ${p.is_completed?"line-through decoration-zinc-600 text-zinc-500":"text-zinc-200 group-hover/link:text-emerald-400"}`}>{p.title}</span>
        <ExternalLink size={12} className="text-zinc-600 opacity-0 group-hover/link:opacity-100 transition-all -translate-y-1 group-hover/link:translate-y-0" />
      </a>
      <div className="flex items-center">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${ds.bg} ${ds.border} ${ds.text}`}>{p.difficulty}</span>
      </div>
      <span className="text-[13px] text-zinc-500 capitalize">{p.platform}</span>
      <div className="flex justify-center"><ActionBtn type="is_completed" problem={p} toggling={toggling} onToggle={onToggle} /></div>
      <div className="flex justify-center"><ActionBtn type="needs_revision" problem={p} toggling={toggling} onToggle={onToggle} /></div>
    </div>
  );
};

const MobileCard = ({problem:p,toggling,onToggle}:any) => {
  const ds=DIFF_STYLES[p.difficulty]||DIFF_STYLES["Easy"];
  return (
    <div className="p-5 flex gap-3 hover:bg-white/[0.02] transition-colors">
      <div className="mt-1"><ActionBtn type="is_completed" problem={p} toggling={toggling} onToggle={onToggle} /></div>
      <div className="flex-1 min-w-0">
        <a href={p.url} target="_blank" rel="noreferrer" className={`block text-[15px] font-medium mb-2 leading-snug truncate ${p.is_completed?"line-through text-zinc-500":"text-zinc-200"}`}>{p.title}</a>
        <div className="flex items-center gap-2.5 text-[10px]">
          <span className={`px-2 py-0.5 rounded border uppercase font-bold ${ds.text} ${ds.border} ${ds.bg}`}>{p.difficulty}</span>
          <span className="text-zinc-500 uppercase tracking-wider font-medium">{p.platform}</span>
        </div>
      </div>
      <div className="mt-1"><ActionBtn type="needs_revision" problem={p} toggling={toggling} onToggle={onToggle} /></div>
    </div>
  );
};

const ActionBtn = ({type,problem,toggling,onToggle}:any) => {
  const isToggling=toggling.has(`${problem.id}-${type}`);
  const isDone=type==="is_completed";
  const active=problem[type];
  return (
    <button onClick={()=>onToggle(problem.id,type,active)} disabled={isToggling}
      className="p-1.5 rounded-lg text-zinc-600 hover:bg-white/[0.08] active:scale-90 transition-all focus:outline-none">
      {isToggling?<Loader2 size={18} className="animate-spin text-zinc-500" />:
        isDone?(active?<CheckCircle2 size={20} className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]" />:<Circle size={20} className="hover:text-zinc-400" />):
               (active?<Star size={18} className="text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]" />:<Star size={18} className="hover:text-amber-400/50" />)}
    </button>
  );
};

const StatBlock = ({label,value,color="text-white",glow=""}:{label:string;value:number;color?:string;glow?:string}) => (
  <div>
    <div className={`text-3xl font-bold tracking-tight mb-1 ${color} ${glow}`}>{value}</div>
    <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{label}</div>
  </div>
);

const EmptyState = ({clearFilters,hasFilters}:any) => (
  <div className="flex flex-col items-center justify-center py-24 text-center border border-white/[0.06] rounded-2xl bg-white/[0.01]">
    <div className="w-14 h-14 bg-white/[0.03] rounded-2xl flex items-center justify-center mb-5 border border-white/[0.08]">
      <Search size={24} className="text-zinc-500" />
    </div>
    <h3 className="text-zinc-200 font-semibold text-lg">No matching problems</h3>
    <p className="text-zinc-500 text-sm mt-1 mb-5">Try adjusting your filters or search terms.</p>
    {hasFilters && <button onClick={clearFilters} className="px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-sm font-medium rounded-xl transition-all border border-white/[0.08]">Clear all filters</button>}
  </div>
);

const SkeletonLoader = () => (
  <div className="space-y-5">
    {[1,2,3].map(i=><div key={i} className="h-20 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />)}
  </div>
);
