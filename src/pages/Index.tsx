import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Eye, ChevronDown, Hash, Github, Twitter, Disc, Activity, Command, Terminal, Plus, Minus } from "lucide-react";
import { fetchAlgorithms, fetchVisitCount, getCategories, type Algorithm } from "@/lib/algorithms";
import Navbar from "@/components/Navbar";

// --- THEME COMPONENTS ---
const AlienBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-[#020205] perspective-1000">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#050b14] via-[#020205] to-[#000000]" />
    {/* Subtle Space Dust */}
    <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay" />
    
    {/* Ambient Glows */}
    <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#00f5ff]/5 rounded-full blur-[150px]" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[#9d00ff]/5 rounded-full blur-[150px]" />
    
    {/* Moving Grid Floor */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
  </div>
);

const GlitchText = ({ text }: { text: string }) => (
  <div className="relative inline-block group whitespace-nowrap">
    <span className="relative z-10">{text}</span>
    <span className="absolute top-0 left-0 -ml-[1px] text-[#00f5ff] opacity-0 group-hover:opacity-100 animate-pulse select-none z-0 mix-blend-screen">{text}</span>
    <span className="absolute top-0 left-0 ml-[1px] text-[#9d00ff] opacity-0 group-hover:opacity-100 animate-pulse select-none z-0 mix-blend-screen" style={{ animationDelay: '0.1s' }}>{text}</span>
  </div>
);

// --- HOLOGRAPHIC CARD ---
const HologramCard = ({ algo, index }: { algo: Algorithm; index: number }) => {
  const floatDuration = 5 + Math.random() * 3; 
  const floatDelay = Math.random() * 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative group perspective-1000"
    >
      <motion.div
        animate={{ 
          y: [0, -8, 0],
          rotateX: [0, 1, 0],
          rotateY: [0, -1, 0]
        }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: "easeInOut", delay: floatDelay }}
        className="h-full transform-style-3d"
      >
        <Link to={`/view/${algo.id}`} className="block h-full">
          <div className="h-full relative bg-[#0a0a1a]/40 border border-white/5 backdrop-blur-[4px] hover:backdrop-blur-md overflow-hidden transition-all duration-500 rounded-xl group-hover:border-[#00f5ff]/40 group-hover:shadow-[0_0_30px_-5px_rgba(0,245,255,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-[#00f5ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00f5ff] shadow-[0_0_10px_#00f5ff] -translate-y-full group-hover:animate-scan-line-fast z-20 opacity-50" />

            <div className="p-5 flex flex-col h-full relative z-10">
              <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#00f5ff]/5 border border-[#00f5ff]/10">
                    <Hash className="h-3 w-3 text-[#00f5ff]" />
                    <span className="text-[9px] font-mono text-[#00f5ff]/80 tracking-wider">{algo.id.slice(0,4).toUpperCase()}</span>
                 </div>
                 <ArrowRight className="h-4 w-4 text-[#00f5ff] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
              </div>

              <h3 className="text-lg font-bold text-gray-100 group-hover:text-[#00f5ff] transition-colors font-mono tracking-tight mb-2">
                {algo.title}
              </h3>
              
              <p className="text-[11px] text-gray-500 mb-4 line-clamp-2 leading-relaxed font-sans group-hover:text-gray-400 transition-colors">
                {algo.description}
              </p>

              <div className="mt-auto flex flex-wrap gap-1.5">
                 <span className="px-1.5 py-0.5 text-[9px] font-mono border border-[#00f5ff]/20 text-[#00f5ff] bg-[#00f5ff]/5">
                    {algo.category}
                 </span>
                 {algo.tags?.slice(0, 1).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 text-[9px] font-mono border border-white/5 text-gray-600">
                        #{tag}
                    </span>
                 ))}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
};

const Index = () => {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visitCount, setVisitCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // EXPANSION STATES
  const [isGridExpanded, setIsGridExpanded] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  const INITIAL_GRID_COUNT = 9;
  const INITIAL_CATEGORY_COUNT = 8;

  useEffect(() => {
    // SECURITY: Use sessionStorage to prevent visit count inflation on refresh
    const sessionKey = "algolib_session_active";
    const isNewSession = !sessionStorage.getItem(sessionKey);
    
    if (isNewSession) {
      sessionStorage.setItem(sessionKey, "true");
    }

    Promise.all([fetchAlgorithms(), fetchVisitCount()]).then(([algos, count]) => {
      setAlgorithms(algos);
      setVisitCount(count); 
      setLoading(false);
    });
  }, []);

  // Reset expansions on filter change
  useEffect(() => { setIsGridExpanded(false); }, [selectedCategory, search]);

  const categories = useMemo(() => getCategories(algorithms), [algorithms]);
  
  // VISIBLE CATEGORIES LOGIC
  const visibleCategories = showAllCategories ? categories : categories.slice(0, INITIAL_CATEGORY_COUNT);

  const filtered = useMemo(() => {
    let result = algorithms;
    if (selectedCategory) {
      result = result.filter((a) => a.category && a.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q) || a.tags?.some((t) => t.toLowerCase().includes(q)));
    }
    return result;
  }, [algorithms, search, selectedCategory]);

  const displayedAlgorithms = isGridExpanded ? filtered : filtered.slice(0, INITIAL_GRID_COUNT);
  const hasHiddenItems = filtered.length > INITIAL_GRID_COUNT;
  const suggestions = filtered.slice(0, 5);

  return (
    <div className="min-h-screen overflow-x-hidden text-white font-sans relative selection:bg-[#00f5ff]/20 flex flex-col">
      <AlienBackground />
      
      {/* --- FIX: NAVBAR WRAPPER (z-200) --- 
          This forces the Navbar to sit ABOVE the hero section's transparent padding. 
      */}
      <div className="relative z-[200]">
        <Navbar />
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-36 pb-12 px-4 z-50">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00f5ff]/20 bg-[#00f5ff]/5 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f5ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f5ff]"></span>
              </span>
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#00f5ff]">
                Link Connected
              </span>
            </div>

            {/* Main Title - FIXED GRADIENT */}
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-4 leading-none drop-shadow-2xl">
              <span className="block">
                {/* ALGO: Metallic/White Gradient */}
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500">
                    ALGO
                </span>
                {/* LIB: Neon Cyan */}
                <span className="text-[#EE82EE]">LIB</span>
              </span>
            </h1>
            
            {/* DESCRIPTION LINE */}
            <p className="text-sm sm:text-base text-gray-400 font-mono tracking-wide max-w-xl mx-auto mb-10 border-l-2 border-[#00f5ff]/50 pl-4 text-left sm:text-center sm:border-l-0 sm:border-t-0">
              A high-performance knowledge engine for traversing <span className="text-[#00f5ff]">complex algorithmic pathways</span> and visualizing data structures.
            </p>
            
            {/* Search Input (Highest Z-Index) */}
            <div className="relative max-w-md mx-auto mt-8 group z-[100]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00f5ff] to-[#9d00ff] rounded-lg blur opacity-20 group-focus-within:opacity-50 transition duration-500" />
              <div className="relative flex items-center bg-[#050510] rounded-lg border border-white/10 group-focus-within:border-[#00f5ff]/50 px-4 py-3 shadow-2xl">
                 <Command className="h-4 w-4 text-gray-500 group-focus-within:text-[#00f5ff] mr-3" />
                 <input
                  type="text"
                  placeholder="INITIATE SEARCH SEQUENCE..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-white placeholder:text-gray-600 focus:outline-none font-mono text-xs tracking-wider"
                />
              </div>
              
              {/* Suggestions Box (Visible over everything) */}
              <AnimatePresence>
                {search.length > 1 && suggestions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a1a]/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden shadow-2xl z-[101]">
                    {suggestions.map((algo) => (
                      <Link key={algo.id} to={`/view/${algo.id}`} className="block px-4 py-3 hover:bg-[#00f5ff]/10 border-b border-white/5 last:border-0 text-xs font-mono text-gray-400 hover:text-[#00f5ff] transition-colors">
                        <span className="mr-2 text-[#00f5ff]">{'>'}</span> {algo.title}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FILTERS (Medium Z-Index) --- */}
      <section className="px-4 pb-8 relative z-20">
         <div className="container mx-auto max-w-5xl">
            <div className="flex flex-wrap justify-center gap-2">
                {/* 'All' Button */}
                <button onClick={() => setSelectedCategory(null)} className={`px-4 py-1.5 rounded text-[10px] font-mono tracking-wider transition-all border ${!selectedCategory ? "bg-[#00f5ff]/10 border-[#00f5ff] text-[#00f5ff] shadow-[0_0_15px_rgba(0,245,255,0.3)]" : "bg-transparent border-white/5 text-gray-600 hover:border-white/20"}`}>
                [ ALL_SYSTEMS ]
                </button>
                
                {/* Visible Categories */}
                {visibleCategories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)} className={`px-4 py-1.5 rounded text-[10px] font-mono tracking-wider transition-all border ${selectedCategory === cat ? "bg-[#9d00ff]/10 border-[#9d00ff] text-[#9d00ff] shadow-[0_0_15px_rgba(157,0,255,0.3)]" : "bg-transparent border-white/5 text-gray-600 hover:border-white/20"}`}>
                        {cat.toUpperCase()}
                    </button>
                ))}

                {/* Expand/Collapse Toggle */}
                {categories.length > INITIAL_CATEGORY_COUNT && (
                    <button 
                        onClick={() => setShowAllCategories(!showAllCategories)} 
                        className="px-4 py-1.5 rounded text-[10px] font-mono tracking-wider transition-all border border-dashed border-[#00f5ff]/30 text-[#00f5ff]/70 hover:bg-[#00f5ff]/5 hover:text-[#00f5ff] flex items-center gap-1"
                    >
                        {showAllCategories ? (
                            <><Minus className="h-3 w-3" /> MINIMIZE</>
                        ) : (
                            <><Plus className="h-3 w-3" /> EXPAND PROTOCOL</>
                        )}
                    </button>
                )}
            </div>
         </div>
      </section>

      {/* --- GRID (Low Z-Index) --- */}
      <section className="px-4 pb-32 relative z-10 flex-grow">
        <div className="container mx-auto max-w-6xl">
          {loading ? (
             <div className="flex flex-col items-center justify-center pt-20">
                <div className="w-8 h-8 border-2 border-[#00f5ff] border-t-transparent rounded-full animate-spin mb-4" />
                <div className="text-[#00f5ff] font-mono text-xs tracking-widest animate-pulse">LOADING DATA SHARDS...</div>
             </div>
          ) : (
            <>
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {displayedAlgorithms.map((algo, index) => (
                     <HologramCard key={algo.id} algo={algo} index={index} />
                  ))}
                </AnimatePresence>
              </motion.div>

              {filtered.length === 0 && (
                <div className="text-center py-20 text-gray-600 font-mono text-xs border border-dashed border-white/10 rounded-xl">
                  VOID DETECTED: NO DATA
                </div>
              )}

              {hasHiddenItems && !isGridExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mt-20">
                  <button onClick={() => setIsGridExpanded(true)} className="group relative px-8 py-3 bg-[#00f5ff]/5 border border-[#00f5ff]/30 hover:border-[#00f5ff] transition-all duration-300 rounded-sm overflow-hidden">
                    <div className="absolute inset-0 bg-[#00f5ff]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative flex items-center gap-3 text-xs font-mono font-bold text-[#00f5ff] tracking-widest">
                       LOAD FULL DATABASE <ChevronDown className="h-3 w-3 animate-bounce" />
                    </span>
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>

      {/* --- CLEAN FOOTER --- */}
      <footer className="relative border-t border-white/10 bg-[#050510] pt-16 pb-8 overflow-hidden z-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10 max-w-4xl">
           
           {/* Centered Brand Section */}
           <div className="flex flex-col items-center text-center mb-8">
              <h2 className="text-3xl font-black text-white tracking-tighter mb-4">
                 ALGO<span className="text-[#00f5ff]">LIB</span>
              </h2>
              <p className="text-gray-500 text-xs font-mono leading-relaxed max-w-md mx-auto mb-2">
                 With algorithmic visualization interface designed for the next generation of engineers.<br/>Build for developers by developers.
              </p>
           </div>

           {/* Bottom Status Bar */}
           <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-[10px] text-gray-600 font-mono">
                 &copy; {new Date().getFullYear()} ALGOLIB | All rights reserved.
              </div>
              
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff88]/5 border border-[#00ff88]/10">
                    <Activity className="h-3 w-3 text-[#00ff88]" />
                    <span className="text-[10px] text-[#00ff88] font-mono tracking-wider">SYSTEM ONLINE</span>
                 </div>
                 <div className="flex items-center gap-2 text-gray-500">
                    <Eye className="h-3 w-3" />
                    <span className="text-[10px] font-mono">{visitCount.toLocaleString()} VISITS</span>
                 </div>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;