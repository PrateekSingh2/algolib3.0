import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { Search, ChevronRight, X, Menu, RefreshCw, Cpu as CpuIcon, Blocks, ListTree, ArrowUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import { CyberSpaceBackground, SectionBadge, DocSection } from "@/components/docs/DocComponents";
import { BASIC_SECTIONS } from "@/components/docs/BasicSections";
import { OOPS_SECTIONS } from "@/components/docs/OopsSections";
import { DSA_SECTIONS } from "@/components/docs/DsaSections";

type TabType = 'basics' | 'oops' | 'dsa';

const Notes = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dsa');
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
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-cyan-500/30">
      <CyberSpaceBackground />
      <Navbar />
      
      {/* Top scroll progress bar */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 z-50 origin-left" />

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-slate-50 shadow-lg shadow-cyan-500/20 border border-slate-50/20">
          {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

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
              className="w-12 h-12 bg-slate-800/90 backdrop-blur-sm border border-slate-700 hover:border-cyan-500/50 rounded-full flex items-center justify-center text-slate-300 hover:text-cyan-400 transition-all shadow-lg shadow-black/20"
              aria-label="Scroll to top"
            >
              <ArrowUp size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-24 container mx-auto px-4 max-w-7xl">
        {/* Top Tabs - Adjusted for side-by-side mobile fit */}
        <div className="flex w-full gap-1 sm:gap-2 md:gap-4 mb-8 bg-slate-900/80 backdrop-blur-xl p-1 md:p-2 rounded-2xl border border-slate-800 shadow-lg relative lg:sticky lg:top-20 z-40">
          <button onClick={() => setActiveTab('basics')} className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 px-1 md:py-3 md:px-4 rounded-xl text-[10px] sm:text-[11px] md:text-sm font-bold text-center leading-tight transition-all duration-300 ${activeTab === 'basics' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800/50'}`}>
            <CpuIcon size={18} className="shrink-0" />
            <span>Basic Programming</span>
          </button>
          <button onClick={() => setActiveTab('oops')} className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 px-1 md:py-3 md:px-4 rounded-xl text-[10px] sm:text-[11px] md:text-sm font-bold text-center leading-tight transition-all duration-300 ${activeTab === 'oops' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800/50'}`}>
            <Blocks size={18} className="shrink-0" />
            <span>OOP Concepts</span>
          </button>
          <button onClick={() => setActiveTab('dsa')} className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 px-1 md:py-3 md:px-4 rounded-xl text-[10px] sm:text-[11px] md:text-sm font-bold text-center leading-tight transition-all duration-300 ${activeTab === 'dsa' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800/50'}`}>
            <ListTree size={18} className="shrink-0" />
            <span>Data Structures</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 relative">
          {/* Sidebar */}
          <aside className={`fixed lg:sticky top-0 lg:top-[160px] left-0 h-screen lg:h-[calc(100vh-180px)] w-72 lg:w-72 shrink-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="backdrop-blur-xl bg-slate-900/95 lg:bg-slate-900/80 border-r lg:border border-slate-800 lg:rounded-2xl p-6 lg:p-4 h-full flex flex-col shadow-2xl relative overflow-hidden pt-24 lg:pt-4">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30" />
              
              {/* Search Box */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                <input type="text" placeholder="Search curriculum..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-100 focus:border-cyan-500 outline-none transition-colors placeholder:text-slate-500 shadow-inner" />
                {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-200"><X size={14} /></button>}
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {filteredSections.map((sec) => (
                  <button key={sec.id} onClick={() => scrollToSection(sec.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden ${activeSection === sec.id ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-slate-50 hover:bg-slate-800/50 border border-transparent"}`}>
                    {activeSection === sec.id && <motion.div layoutId="activeGlow" className="absolute inset-0 bg-cyan-500/5" />}
                    <span className={`relative z-10 ${activeSection === sec.id ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                      {React.cloneElement(sec.icon as React.ReactElement, { size: 18 })}
                    </span>
                    <span className="relative z-10 text-left">{sec.title}</span>
                    {activeSection === sec.id && <ChevronRight className="ml-auto w-4 h-4 relative z-10" />}
                  </button>
                ))}
              </nav>

              <div className="pt-4 mt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>AlgoLib Curriculum Module</span>
                </div>
              </div>
            </div>
          </aside>

          {isMobileSidebarOpen && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />}

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 pb-32 lg:pb-20 pt-4 lg:pt-0">
            <AnimatePresence mode="wait">
              <div className="space-y-24">
                {filteredSections.length > 0 ? filteredSections.map((section, idx) => (
                  <motion.section key={section.id} id={section.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4, delay: idx * 0.05 }} className="scroll-mt-48">
                    <div className="flex items-end gap-4 mb-8 border-b border-slate-800 pb-4">
                      
                      {/* Section Icon Gradient */}
                      <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl border border-slate-700 text-slate-100 shadow-lg shadow-cyan-500/5">
                        {React.cloneElement(section.icon as React.ReactElement, { size: 36 })}
                      </div>
                      
                      <div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-50 tracking-tight">{section.title}</h2>
                        <div className="flex gap-2 mt-3"><SectionBadge>Curriculum Standard</SectionBadge></div>
                      </div>
                    </div>
                    <div className="prose prose-invert prose-sm md:prose-base max-w-none text-slate-300 leading-relaxed">
                      {section.render(searchQuery)}
                    </div>
                  </motion.section>
                )) : (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center py-32 opacity-80 border border-dashed border-slate-700 rounded-2xl bg-slate-800/20">
                    <Search size={48} className="mb-4 text-slate-500" />
                    <p className="text-slate-400 font-mono text-center px-4">No topics found for "{searchQuery}" in this tab.</p>
                    <button onClick={() => setSearchQuery("")} className="mt-4 text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg transition-colors hover:bg-slate-700/50">
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