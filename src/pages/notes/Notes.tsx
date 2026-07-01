import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { Search, ChevronRight, X, Menu, RefreshCw, Cpu as CpuIcon, Blocks, ListTree, ArrowUp, ArrowLeft, BookOpenCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { CyberSpaceBackground, SectionBadge, DocSection } from "@/components/docs/DocComponents";
import { BASIC_SECTIONS } from "@/components/docs/BasicSections";
import { OOPS_SECTIONS } from "@/components/docs/OopsSections";
import { DSA_SECTIONS } from "@/components/docs/DsaSections";

type TabType = 'basics' | 'oops' | 'dsa';

const Notes = () => {
  const { tab } = useParams<{ tab: string }>();
  const validTab = (tab === 'basics' || tab === 'oops' || tab === 'dsa') ? tab : 'dsa';
  const [activeTab, setActiveTab] = useState<TabType>(validTab);

  // Sync URL param changes (e.g. direct navigation)
  useEffect(() => {
    setActiveTab(validTab);
  }, [validTab]);
  const [activeSection, setActiveSection] = useState(BASIC_SECTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const currentSections = activeTab === 'basics' ? BASIC_SECTIONS : activeTab === 'oops' ? OOPS_SECTIONS : DSA_SECTIONS;

  useEffect(() => {
    setActiveSection(currentSections[0].id);
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      const scrollPosition = window.scrollY + 200;
      for (const section of currentSections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentSections]);

  const filteredSections = currentSections.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.searchContent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setIsMobileSidebarOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-cyan-500/30">
      <CyberSpaceBackground />
      <Navbar />

      {/* Custom Styles for scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.08); border-radius: 3px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.15); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.15); }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* Top scroll progress bar */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 z-50 origin-left" />

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="fixed bottom-24 lg:bottom-6 right-6 lg:right-6 z-50"
          >
            <button
              onClick={scrollToTop}
              className="w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all shadow-lg shadow-black/5 dark:shadow-black/20"
              aria-label="Scroll to top"
            >
              <ArrowUp size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-24 container mx-auto px-4 max-w-7xl">
        {/* Breadcrumb header – tab switching is done via NotesHub */}
        <div className="flex items-center justify-between mb-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg top-[80px] lg:top-[88px] z-40 transition-all">
          <div className="flex items-center gap-3">
            <Link to="/notes" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              <ArrowLeft size={14} /> Notes Hub
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className={`flex items-center gap-1.5 text-xs font-bold
              ${activeTab === 'basics' ? 'text-cyan-600 dark:text-cyan-400' : ''}
              ${activeTab === 'oops' ? 'text-purple-600 dark:text-purple-400' : ''}
              ${activeTab === 'dsa' ? 'text-emerald-600 dark:text-emerald-400' : ''}
            `}>
              {activeTab === 'basics' && <><CpuIcon size={14} className="hidden sm:block" /> Basic Programming</>}
              {activeTab === 'oops' && <><Blocks size={14} className="hidden sm:block" /> OOP Concepts</>}
              {activeTab === 'dsa' && <><ListTree size={14} className="hidden sm:block" /> DSA Content</>}
            </span>
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="lg:hidden w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-zinc-300 transition-all shrink-0 ml-2"
            title="Open Curriculum Index"
          >
            {isMobileSidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 relative">
          {/* Sidebar */}
          <aside className={`fixed lg:sticky top-0 lg:top-[160px] left-0 h-screen lg:h-[calc(100vh-180px)] self-start w-[280px] lg:w-72 shrink-0 z-[101] lg:z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="bg-white dark:bg-[#07070f] lg:bg-white/80 dark:lg:bg-slate-900/80 lg:backdrop-blur-xl border-r lg:border border-slate-200 dark:border-slate-800 lg:rounded-2xl p-6 lg:p-4 h-full flex flex-col shadow-xl dark:shadow-2xl relative overflow-hidden pt-8 lg:pt-4">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30 lg:block hidden" />

              {/* Mobile Close Header */}
              <div className="flex lg:hidden items-center justify-between mb-6">
                <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <BookOpenCheck size={18} className="text-cyan-500" /> Curriculum Menu
                </span>
                <button onClick={() => setIsMobileSidebarOpen(false)} className="text-slate-400 dark:text-zinc-500 p-1">
                  <X size={18} />
                </button>
              </div>

              {/* Search Box */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 w-4 h-4" />
                <input type="text" placeholder="Search curriculum..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 hover:bg-slate-200/50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-cyan-500 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner" />
                {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={14} /></button>}
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar max-h-[calc(100vh-300px)]">
                {filteredSections.map((sec) => (
                  <button key={sec.id} onClick={() => scrollToSection(sec.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden \${activeSection === sec.id ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100/70 dark:hover:bg-slate-800/40"}`}>
                    {activeSection === sec.id && <motion.div layoutId="activeGlow" className="absolute inset-0 bg-cyan-500/5" />}
                    <span className={`relative z-10 \${activeSection === sec.id ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 dark:group-hover:text-slate-300"}`}>
                      {React.cloneElement(sec.icon as React.ReactElement, { size: 18 })}
                    </span>
                    <span className="relative z-10 text-left flex-1 truncate">{sec.title}</span>
                    <ChevronRight size={14} className={`ml-auto relative z-10 transition-all duration-250 group-hover:translate-x-0.5 \${activeSection === sec.id ? "opacity-100 text-cyan-600 dark:text-cyan-400" : "opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500"}`} />
                  </button>
                ))}
              </nav>

              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <Link
                  to="/notes"
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 border border-transparent hover:border-cyan-200 dark:hover:border-cyan-500/20 transition-all"
                >
                  <ArrowLeft size={14} /> Back to Notes Hub
                </Link>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono px-1">
                  <BookOpenCheck size={11} />
                  <span>AlgoLib Curriculum Module</span>
                </div>
              </div>
            </div>
          </aside>

          {isMobileSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />}

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 pb-32 lg:pb-20 pt-4 lg:pt-0">
            <AnimatePresence mode="wait">
              <div className="space-y-24">
                {filteredSections.length > 0 ? filteredSections.map((section, idx) => (
                  <motion.section key={section.id} id={section.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4, delay: idx * 0.05 }} className="scroll-mt-48">
                    <div className="flex items-end gap-4 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">

                      {/* Section Icon Gradient */}
                      <div className="p-3 bg-gradient-to-br from-cyan-50 dark:from-cyan-500/20 to-purple-50 dark:to-purple-500/20 rounded-xl border border-cyan-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-lg shadow-cyan-500/5">
                        {React.cloneElement(section.icon as React.ReactElement, { size: 36 })}
                      </div>

                      <div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">{section.title}</h2>
                        <div className="flex gap-2 mt-3"><SectionBadge>Curriculum Standard</SectionBadge></div>
                      </div>
                    </div>
                    <div className="prose dark:prose-invert prose-sm md:prose-base max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                      {section.render(searchQuery)}
                    </div>
                  </motion.section>
                )) : (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center py-32 opacity-80 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-100 dark:bg-slate-800/20">
                    <Search size={48} className="mb-4 text-slate-400 dark:text-slate-500" />
                    <p className="text-slate-500 dark:text-slate-400 font-mono text-center px-4">No topics found for "{searchQuery}" in this tab.</p>
                    <button onClick={() => setSearchQuery("")} className="mt-4 text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 flex items-center gap-2 bg-slate-200 dark:bg-slate-800/50 px-4 py-2 rounded-lg transition-colors hover:bg-slate-300 dark:hover:bg-slate-700/50">
                      <RefreshCw size={14} /> Reset Search
                    </button>
                  </div>
                )}
              </div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Notes;