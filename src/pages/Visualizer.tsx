import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  Binary,
  Database,
  GitCommit,
  Layers,
  Menu,
  Network,
  X,
  ChevronDown,
  ChevronUp,
  Cpu,
  Maximize2,
  BookOpen,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import GlobalRibbon from '@/components/GlobalRibbon';

const LinkedListVisualizer = lazy(() => import('./LinkedListVisualizer'));
const StackVisualizer = lazy(() => import('./StackVisualizer'));
const QueueVisualizer = lazy(() => import('./QueueVisualizer'));
const SortingVisualizer = lazy(() => import('./SortingVisualizer'));
const BSTVisualizer = lazy(() => import('./BSTVisualizer'));
const GraphVisualizer = lazy(() => import('./GraphVisualizer'));

type VisualizerKey = 'll' | 'stack' | 'queue' | 'sorting' | 'bst' | 'graph';

const AlienBackground = ({ mobile }: { mobile: boolean }) => (
  <div className="fixed inset-0 -z-10 bg-[#020205] overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00f5ff]/10 via-[#050510] to-[#000000]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#9d00ff]/10 via-transparent to-transparent opacity-50" />
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.04]" />
    {!mobile && (
      <motion.div
        animate={{ y: ['-100%', '200%'] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
        className="absolute top-0 left-0 w-full h-[18vh] bg-gradient-to-b from-transparent via-[#00f5ff]/5 to-transparent pointer-events-none"
      />
    )}
  </div>
);

const Visualizer = () => {
  const [activeTab, setActiveTab] = useState<VisualizerKey>('ll');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  
  // HUD states
  const [showWelcome, setShowWelcome] = useState(false);
  const [topNavHidden, setTopNavHidden] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth <= 639 : false
  );

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  // Session Storage Check for Welcome Modal
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('algoviz_welcome_seen');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    sessionStorage.setItem('algoviz_welcome_seen', 'true');
    setShowWelcome(false);
  };

  const menu = useMemo(
    () => [
      { id: 'll' as VisualizerKey, label: 'LINKED_LIST', icon: GitCommit, component: <LinkedListVisualizer /> },
      { id: 'stack' as VisualizerKey, label: 'STACK_LIFO', icon: Layers, component: <StackVisualizer /> },
      { id: 'queue' as VisualizerKey, label: 'QUEUE_FIFO', icon: ArrowRightLeft, component: <QueueVisualizer /> },
      { id: 'sorting' as VisualizerKey, label: 'SORTING_ALG', icon: BarChart3, component: <SortingVisualizer /> },
      { id: 'bst' as VisualizerKey, label: 'BINARY_TREE', icon: Binary, component: <BSTVisualizer /> },
      { id: 'graph' as VisualizerKey, label: 'GRAPH_NET', icon: Network, component: <GraphVisualizer /> },
    ],
    [],
  );

  const activeModule = menu.find((item) => item.id === activeTab);

  const selectTab = (tab: VisualizerKey) => {
    setActiveTab(tab);
    setDrawerOpen(false);
  };

  return (
    <>
      <AlienBackground mobile={mobile} />

      {/* --- WELCOME MODAL (Screenshot Match) --- */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-[600px] bg-[#0b0c10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-white/5 flex items-start gap-4 bg-gradient-to-b from-cyan-900/10 to-transparent">
                <div className="p-3 rounded-xl bg-[#00f5ff]/10 border border-[#00f5ff]/20 text-[#00f5ff] shadow-[0_0_15px_rgba(0,245,255,0.15)] shrink-0">
                  <Cpu size={24} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-wide font-mono">SYSTEM INITIALIZED</h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] text-[#00f5ff] uppercase tracking-[0.2em] font-mono font-bold">ALGOVIZ ENGINE V2.5.0</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 space-y-6">
                <p className="text-gray-300 text-[13px] md:text-sm">Welcome to the interactive algorithm simulation deck.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#12121a] p-4 rounded-xl border border-white/5 flex gap-3">
                    <Maximize2 size={16} className="text-[#00f5ff] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white text-xs font-bold mb-1">Maximize View</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed">Close the side navigation panel to extend the holographic canvas.</p>
                    </div>
                  </div>
                  <div className="bg-[#12121a] p-4 rounded-xl border border-white/5 flex gap-3">
                    <Activity size={16} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white text-xs font-bold mb-1">Real-Time Ops</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed">Simulations run at 60fps. Use the speed slider to slow down execution.</p>
                    </div>
                  </div>
                </div>

                {/* Warning/Docs Box */}
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="p-2.5 bg-yellow-500/10 rounded-lg text-yellow-500 shrink-0">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-yellow-500 font-bold text-xs mb-1 font-mono uppercase tracking-widest">New User Detected?</h4>
                    <p className="text-gray-400 text-[11px] leading-relaxed">If you are unsure how to control the visualizers or interpret the data, please refer to the system manual first.</p>
                  </div>
                  <a href="/docs" className="shrink-0 px-4 py-2 hover:bg-yellow-500/10 text-yellow-500 text-xs font-bold rounded-lg border border-yellow-500/30 transition-all flex items-center gap-2">
                    DOCS <ArrowRight size={14} />
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 md:p-6 border-t border-white/5 bg-[#060609] flex justify-end">
                <button
                  onClick={handleCloseWelcome}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#00f5ff] hover:bg-cyan-300 text-black font-bold text-sm rounded-full transition-all shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:scale-105 active:scale-95"
                >
                  Ok, Continue <CheckCircle2 size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!topNavHidden && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-[200]"
          >
            <Navbar />
            <div className="hidden sm:block">
              <GlobalRibbon />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`h-screen overflow-hidden text-white ${topNavHidden ? 'pt-2 sm:pt-3' : 'pt-[64px] sm:pt-[80px] lg:pt-[96px]'}`}>
        <div className="h-full flex flex-col lg:flex-row gap-3 p-2 sm:p-3 lg:p-4">
          
          {/* --- DESKTOP SIDE PANEL --- */}
          <aside className="hidden lg:flex w-[260px] shrink-0 flex-col rounded-2xl bg-[#06060c]/95 border border-white/5 backdrop-blur-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] z-20">
            <div className="p-6 border-b border-[#00f5ff]/20">
              <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                <Database className="text-[#00f5ff]" size={24} /> AlgoViz
              </h1>
              <p className="text-[10px] uppercase tracking-[0.15em] mt-2 text-[#00f5ff] font-bold">Simulator Engine of AlgoLib</p>
            </div>
            
            <nav className="flex-1 py-4 flex flex-col overflow-y-auto custom-scrollbar">
              {menu.map((item) => (
                <MenuButton key={item.id} item={item} active={activeTab === item.id} onSelect={selectTab} />
              ))}
            </nav>
            
            <div className="p-6 border-t border-white/5 bg-black/40">
              <div className="flex items-center gap-3 text-[10px] tracking-widest text-gray-500 font-mono">
                <Activity size={16} className="text-[#00ff88]" /> SYSTEM_READY
              </div>
            </div>
          </aside>

          <section className="flex-1 min-w-0 rounded-2xl border border-white/10 bg-[#050510]/85 backdrop-blur-md overflow-hidden flex flex-col">
            <header className="h-14 sm:h-16 border-b border-white/10 bg-black/50 px-3 sm:px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden h-11 w-11 rounded-xl border border-[#00f5ff]/40 bg-[#00f5ff]/10 grid place-items-center active:scale-95 transition-transform"
                  aria-label="Open modules"
                >
                  <Menu size={20} className="text-[#00f5ff]" />
                </button>
                <div className="min-w-0">
                  <p className="font-mono text-lg sm:text-xl font-black truncate">Visualizing</p>
                  <p className="text-xs text-gray-400 tracking-widest truncate">{activeModule?.label}</p>
                </div>
              </div>
              
              {/* --- ARROW DOWN / UP Navbar Toggle --- */}
              <button
                onClick={() => setTopNavHidden((prev) => !prev)}
                className="h-11 min-w-11 px-3 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white active:scale-95 transition-all flex items-center justify-center"
                aria-label="Toggle top navbar"
              >
                {topNavHidden ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </header>

            <div className="flex-1 min-h-0 p-2 sm:p-3 lg:p-4 flex flex-col gap-3">
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#020205] to-[#0a0a1a] flex-1 overflow-hidden relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
                <div className="relative z-10 h-full w-full overflow-x-auto touch-pan-x">
                  <Suspense fallback={<div className="h-full grid place-items-center text-sm text-cyan-300">Booting visualizer...</div>}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="h-full w-full"
                      >
                        {activeModule?.component}
                      </motion.div>
                    </AnimatePresence>
                  </Suspense>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* --- MOBILE SIDE PANEL DRAWER --- */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.button
              aria-label="Close drawer"
              className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="fixed z-[260] top-0 left-0 h-full w-[84vw] max-w-[340px] bg-[#06060c] border-r border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col"
            >
              <div className="p-6 pt-12 border-b border-[#00f5ff]/20 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                    <Database className="text-[#00f5ff]" size={24} /> AlgoViz
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.15em] mt-2 text-[#00f5ff] font-bold">Simulator Engine of AlgoLib</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="h-10 w-10 rounded-full border border-white/10 hover:bg-white/5 flex items-center justify-center text-gray-400 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="py-4 flex flex-col overflow-y-auto custom-scrollbar flex-1">
                {menu.map((item) => (
                  <MenuButton key={item.id} item={item} active={activeTab === item.id} onSelect={selectTab} />
                ))}
              </div>

              <div className="p-6 border-t border-white/5 bg-black/40">
                <div className="flex items-center gap-3 text-[10px] tracking-widest text-gray-500 font-mono font-bold">
                  <Activity size={16} className="text-[#00ff88]" /> SYSTEM_READY
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// --- MENU BUTTON ---
const MenuButton = ({
  item,
  active,
  onSelect,
}: {
  item: { id: VisualizerKey; label: string; icon: React.ComponentType<any> };
  active: boolean;
  onSelect: (tab: VisualizerKey) => void;
}) => {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={`group w-full h-[60px] border-l-[3px] px-6 flex items-center gap-4 text-left transition-colors duration-300 ${
        active
          ? 'border-[#00f5ff] bg-[#00f5ff]/10'
          : 'border-transparent hover:bg-white/5'
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-[#00f5ff]' : 'text-gray-500 group-hover:text-gray-300'} />
      <span className={`text-[11px] sm:text-xs font-bold font-mono tracking-widest uppercase ${
        active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
      }`}>
        {item.label}
      </span>
    </button>
  );
};

export default Visualizer;