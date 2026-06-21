import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { Helmet } from 'react-helmet-async';
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
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  BoxSelect,
  Lock // <-- Added Lock icon
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { setTrackedActivity } from '@/hooks/useActivityTracker';

const LinkedListVisualizer = lazy(() => import('./LinkedListVisualizer'));
const StackVisualizer = lazy(() => import('./StackVisualizer'));
const QueueVisualizer = lazy(() => import('./QueueVisualizer'));
const SortingVisualizer = lazy(() => import('./SortingVisualizer'));
const BSTVisualizer = lazy(() => import('./BSTVisualizer'));
const GraphVisualizer = lazy(() => import('./GraphVisualizer'));
const HeapVisualizer = lazy(() => import('./HeapVisualizer'));

type VisualizerKey = 'll' | 'stack' | 'queue' | 'sorting' | 'bst' | 'graph' | 'heap';

const AlienBackground = ({ mobile }: { mobile: boolean }) => (
  <div className="fixed inset-0 -z-10 bg-white dark:bg-[#020205] overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50 dark:from-[#00f5ff]/10 via-white dark:via-[#050510] to-blue-50 dark:to-[#000000]" />
    
    {/* PREMIUM LIGHT BLUE / WHITE MESH GRADIENT */}
    <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-sky-200/40 rounded-full blur-[100px] dark:hidden mix-blend-multiply pointer-events-none" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-100/50 rounded-full blur-[120px] dark:hidden mix-blend-multiply pointer-events-none" />
    <div className="absolute top-[40%] left-[20%] w-[30vw] h-[30vw] bg-indigo-100/40 rounded-full blur-[80px] dark:hidden mix-blend-multiply pointer-events-none" />
    
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />
  </div>
);

const Visualizer = () => {
  const [activeTab, setActiveTab] = useState<VisualizerKey>('ll');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  
  // HUD & Layout states
  const [showWelcome, setShowWelcome] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [topNavHidden, setTopNavHidden] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth <= 639 : false
  );

  useEffect(() => {
    setTrackedActivity(`visualizer_${activeTab}`);
  }, [activeTab]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const { user, profile, refreshProfile } = useAuth();

  useEffect(() => {
    const syncWelcomeState = async () => {
      if (user) {
        if (!profile?.has_seen_welcome) {
          setShowWelcome(true);
        }
        return;
      }

      const hasSeenWelcome = localStorage.getItem('algoviz_welcome_seen');
      setShowWelcome(!hasSeenWelcome);
    };

    syncWelcomeState();
  }, [user, profile]);

  const handleCloseWelcome = async () => {
    try {
      if (user) {
        const token = await user.getIdToken();
        const response = await fetch('/.netlify/functions/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ has_seen_welcome: true })
        });
        
        if (!response.ok) throw new Error("Failed to update profile");
        
        await refreshProfile();
      } else {
        localStorage.setItem('algoviz_welcome_seen', 'true');
      }
    } catch (error) {
      console.error('Failed to persist welcome state', error);
    } finally {
      setShowWelcome(false);
    }
  };

  const menu = useMemo(
    () => [
      { id: 'll' as VisualizerKey, label: 'LINKED_LIST', icon: GitCommit, component: <LinkedListVisualizer /> },
      { id: 'stack' as VisualizerKey, label: 'STACK_LIFO', icon: Layers, component: <StackVisualizer /> },
      { id: 'queue' as VisualizerKey, label: 'QUEUE_FIFO', icon: ArrowRightLeft, component: <QueueVisualizer /> },
      { id: 'sorting' as VisualizerKey, label: 'SORTING_ALG', icon: BarChart3, component: <SortingVisualizer /> },
      { id: 'bst' as VisualizerKey, label: 'BINARY_TREE', icon: Binary, component: <BSTVisualizer /> },
      { id: 'heap' as VisualizerKey, label: 'BINARY_HEAP', icon: BoxSelect, component: <HeapVisualizer /> },
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
      <Helmet>
        <title>AlgoLib | Interactive 60FPS DSA Visualizer</title>
        <meta name="title" content="AlgoLib | Interactive 60FPS DSA Visualizer" />
        <meta name="description" content="Master Data Structures and Algorithms with AlgoLib's interactive visualizer. Explore Linked Lists, Trees, Graphs, and Sorting Algorithms in real-time." />
        <meta name="keywords" content="DSA Visualizer, Algorithm Simulator, Data Structures, Binary Tree Visualizer, Graph Visualizer, Sorting Algorithms Visualizer, Stack Visualizer, Queue Visualizer, LinkedList Visualizer, Pathfinding, Sorting Algorithms, AlgoLib, Interactive Learning" />
        <link rel="canonical" href="https://algolib.netlify.app/visualizer/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://algolib.netlify.app/visualizer/" />
        <meta property="og:title" content="AlgoLib | Interactive 60FPS DSA Visualizer" />
        <meta property="og:description" content="Master Data Structures and Algorithms with AlgoLib's interactive 60FPS visualizer. Explore concepts visually in real-time." />
        <meta property="og:image" content="https://ik.imagekit.io/g7e4hyclo/graph.png" />
        <meta property="og:image:alt" content="AlgoLib Interactive Algorithm Simulator" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://algolib.netlify.app/visualizer/" />
        <meta name="twitter:title" content="AlgoLib | Interactive 60FPS DSA Visualizer" />
        <meta name="twitter:description" content="Master Data Structures and Algorithms with AlgoLib's interactive visualizer. Understand complex computer science concepts effortlessly." />
        <meta name="twitter:image" content="https://ik.imagekit.io/g7e4hyclo/graph.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "AlgoLib DSA Visualizer",
            "url": "https://algolib.netlify.app/visualizer/",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "description": "An interactive 60FPS visualizer for Data Structures and Algorithms. Features real-time simulations for Linked Lists, Stacks, Queues, Trees, Heaps, and Graphs.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "creator": { "@type": "Organization", "name": "AlgoLib" },
            "featureList": [
              "Real-time 60FPS Visualization",
              "Interactive Speed Controls",
              "Multiple DSA Modules (LinkedList, Sorting Algorithms, Stack, Queue, Heap, Trees, Graphs)",
              "Holographic UI Engine"
            ]
          })}
        </script>
      </Helmet>

      <AlienBackground mobile={mobile} />

      {/* --- WELCOME MODAL --- */}
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
              className="w-full max-w-[600px] bg-white/40 backdrop-blur-2xl dark:bg-[#0b0c10] border border-white/60 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex items-start gap-4 bg-gradient-to-b from-[#b5c8da] dark:from-cyan-900/10 to-transparent">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-[#00f5ff]/10 border border-blue-200 dark:border-[#00f5ff]/20 text-blue-600 dark:text-[#00f5ff] shadow-sm dark:shadow-[0_0_15px_rgba(0,245,255,0.15)] shrink-0">
                  <Cpu size={24} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-wide font-mono">SYSTEM INITIALIZED</h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] text-blue-600 dark:text-[#00f5ff] uppercase tracking-[0.2em] font-mono font-bold">ALGOVIZ ENGINE V2.5.0</p>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <p className="text-slate-800 dark:text-gray-300 text-[13px] md:text-sm">Welcome to the interactive algorithm simulation deck.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 backdrop-blur-xl dark:bg-[#12121a] p-4 rounded-xl border border-white/60 dark:border-white/5 flex gap-3">
                    <Maximize2 size={16} className="text-blue-500 dark:text-[#00f5ff] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-slate-900 dark:text-white text-xs font-bold mb-1">Maximize View</h4>
                      <p className="text-[11px] text-slate-700 dark:text-gray-500 leading-relaxed">Close the side navigation panel to extend the holographic canvas.</p>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-xl dark:bg-[#12121a] p-4 rounded-xl border border-white/60 dark:border-white/5 flex gap-3">
                    <Activity size={16} className="text-purple-500 dark:text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-slate-900 dark:text-white text-xs font-bold mb-1">Real-Time Ops</h4>
                      <p className="text-[11px] text-slate-700 dark:text-gray-500 leading-relaxed">Simulations run at 60fps. Use the speed slider to slow down execution.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/5 p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="p-2.5 bg-yellow-100 dark:bg-yellow-500/10 rounded-lg text-yellow-600 dark:text-yellow-500 shrink-0">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-yellow-600 dark:text-yellow-500 font-bold text-xs mb-1 font-mono uppercase tracking-widest">New User Detected?</h4>
                    <p className="text-slate-700 dark:text-gray-400 text-[11px] leading-relaxed">If you are unsure how to control the visualizers or interpret the data, please refer to the system manual first.</p>
                  </div>
                  <a href="/docs" className="shrink-0 px-4 py-2 hover:bg-yellow-100 dark:hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-xs font-bold rounded-lg border border-yellow-200 dark:border-yellow-500/30 transition-all flex items-center gap-2">
                    DOCS <ArrowRight size={14} />
                  </a>
                </div>
              </div>

              <div className="p-5 md:p-6 border-t border-slate-100 dark:border-white/5 bg-white/60 backdrop-blur-xl dark:bg-[#060609] flex justify-end">
                <button
                  onClick={handleCloseWelcome}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-500 dark:bg-[#00f5ff] hover:bg-green-400 dark:hover:bg-cyan-300 text-black font-bold text-sm rounded-full transition-all shadow-md dark:shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:scale-105 active:scale-95"
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
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`h-screen overflow-hidden text-black dark:text-white ${topNavHidden ? 'pt-2 sm:pt-3' : 'pt-[64px] sm:pt-[80px] lg:pt-[96px]'}`}>
        <div className="h-full flex flex-col lg:flex-row gap-3 p-2 sm:p-3 lg:p-4">
          
          {/* --- DESKTOP SIDE PANEL --- */}
          <AnimatePresence initial={false}>
            {isSidebarOpen && (
              <motion.aside 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 260, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="hidden lg:flex shrink-0 relative rounded-2xl bg-white/40 backdrop-blur-2xl/95 dark:bg-[#06060c]/95 border border-white/60 dark:border-white/5 backdrop-blur-xl shadow-lg dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] z-20 overflow-hidden h-full"
              >
                <div className="w-[260px] h-full flex flex-col absolute top-0 left-0">
                  <div className="p-6 border-b border-slate-100 dark:border-[#00f5ff]/20 shrink-0">
                    <h1 className="text-2xl font-black text-black dark:text-white flex items-center gap-3 tracking-tight">
                      <Database className="text-blue-500 dark:text-[#00f5ff]" size={24} /> AlgoViz
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.15em] mt-2 text-blue-500 dark:text-[#00f5ff] font-bold">Simulator Engine of AlgoLib</p>
                  </div>
                  
                  <nav className="flex-1 py-4 flex flex-col overflow-y-auto custom-scrollbar">
                    {menu.map((item) => (
                      <MenuButton 
                        key={item.id} 
                        item={item} 
                        active={activeTab === item.id} 
                        onSelect={selectTab} 
                        isLocked={!user && item.id !== 'll'} // <-- Determine locked state
                      />
                    ))}
                  </nav>
                  
                  <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-white/60 backdrop-blur-xl dark:bg-black/40 shrink-0">
                    <div className="flex items-center gap-3 text-[10px] tracking-widest text-slate-700 dark:text-gray-500 font-mono">
                      <Activity size={16} className="text-emerald-500 dark:text-[#00ff88]" /> SYSTEM_READY
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          <section className="flex-1 min-w-0 rounded-2xl border border-white/60 dark:border-white/10 bg-white/40 backdrop-blur-2xl/85 dark:bg-[#050510]/85 backdrop-blur-md overflow-hidden flex flex-col">
            <header className="h-14 sm:h-16 border-b border-white/60 dark:border-white/10 bg-white/60 backdrop-blur-xl/50 dark:bg-black/50 px-3 sm:px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden h-11 w-11 shrink-0 rounded-xl border border-blue-500/20 dark:border-[#00f5ff]/40 bg-blue-50 dark:bg-[#00f5ff]/10 grid place-items-center active:scale-95 transition-transform"
                  aria-label="Open modules"
                >
                  <Menu size={20} className="text-blue-500 dark:text-[#00f5ff]" />
                </button>

                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="hidden lg:flex h-11 w-11 shrink-0 rounded-xl border border-white/60 dark:border-white/10 bg-white/60 backdrop-blur-xl dark:bg-white/5 text-slate-700 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all items-center justify-center shadow-sm dark:shadow-none"
                  aria-label="Toggle Sidebar"
                >
                  {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                </button>

                <div className="min-w-0 pl-1">
                  <p className="font-mono text-lg sm:text-xl font-black truncate text-black dark:text-white">Visualizing</p>
                  <p className="text-xs text-slate-600 dark:text-gray-400 tracking-widest truncate">{activeModule?.label}</p>
                </div>
              </div>
              
              <button
                onClick={() => setTopNavHidden((prev) => !prev)}
                className="h-11 min-w-11 shrink-0 px-3 rounded-xl border border-white/60 dark:border-white/10 bg-white/60 backdrop-blur-xl dark:bg-white/5 text-slate-700 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all flex items-center justify-center shadow-sm dark:shadow-none"
                aria-label="Toggle top navbar"
              >
                {topNavHidden ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </header>

            <div className="flex-1 min-h-0 p-2 sm:p-3 lg:p-4 flex flex-col gap-3">
              <div className="rounded-xl border border-white/60 dark:border-white/10 bg-gradient-to-br from-[#dce6ec] to-[#b5c8da] dark:from-[#020205] dark:to-[#0a0a1a] flex-1 overflow-hidden relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
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
                        {/* --- AUTHENTICATION GUARD --- */}
                        {!user && activeTab !== 'll' ? (
                          <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-300">
                            <div className="h-20 w-20 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-blue-200 dark:border-[#00f5ff]/20 flex items-center justify-center mb-6 shadow-sm dark:shadow-[0_0_40px_rgba(0,245,255,0.15)] relative overflow-hidden">
                               <div className="absolute inset-0 bg-blue-100 dark:bg-[#00f5ff]/10 animate-pulse" />
                               <Lock size={32} className="text-blue-500 dark:text-[#00f5ff] relative z-10" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white mb-3">
                              RESTRICTED SECTOR
                            </h3>
                            <p className="text-slate-700 dark:text-gray-400 max-w-md text-sm leading-relaxed mb-8">
                              The <span className="text-blue-500 dark:text-[#00f5ff] font-mono">{activeModule?.label}</span> simulation module requires security clearance. Authenticate your account to unlock all advanced interactive algorithms.
                            </p>
                            {/* Assuming your app routes to /login for authentication */}
                            <a 
                              href="/login" 
                              className="flex items-center gap-2 px-8 py-3.5 bg-blue-500 dark:bg-[#00f5ff] hover:bg-blue-400 dark:hover:bg-cyan-300 text-black font-bold text-sm rounded-xl transition-all shadow-md dark:shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:scale-105 active:scale-95"
                            >
                              <Cpu size={16} /> INITIALIZE LOGIN
                            </a>
                          </div>
                        ) : (
                          activeModule?.component
                        )}
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
              className="fixed z-[260] top-0 left-0 h-full w-[84vw] max-w-[340px] bg-white/40 backdrop-blur-2xl dark:bg-[#06060c] border-r border-white/60 dark:border-white/10 shadow-2xl dark:shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col"
            >
              <div className="p-6 pt-12 border-b border-slate-100 dark:border-[#00f5ff]/20 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-black dark:text-white flex items-center gap-3 tracking-tight">
                    <Database className="text-blue-500 dark:text-[#00f5ff]" size={24} /> AlgoViz
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.15em] mt-2 text-blue-500 dark:text-[#00f5ff] font-bold">Simulator Engine of AlgoLib</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="h-10 w-10 rounded-full border border-white/60 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 dark:text-gray-400 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="py-4 flex flex-col overflow-y-auto custom-scrollbar flex-1">
                {menu.map((item) => (
                  <MenuButton 
                    key={item.id} 
                    item={item} 
                    active={activeTab === item.id} 
                    onSelect={selectTab} 
                    isLocked={!user && item.id !== 'll'} // <-- Determine locked state
                  />
                ))}
              </div>

              <div className="p-6 border-t border-white/60 dark:border-white/5 bg-white/60 backdrop-blur-xl dark:bg-black/40">
                <div className="flex items-center gap-3 text-[10px] tracking-widest text-slate-700 dark:text-gray-500 font-mono font-bold">
                  <Activity size={16} className="text-emerald-500 dark:text-[#00ff88]" /> SYSTEM_READY
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// --- MENU BUTTON WITH LOCK UI ---
const MenuButton = ({
  item,
  active,
  onSelect,
  isLocked,
}: {
  item: { id: VisualizerKey; label: string; icon: React.ComponentType<any> };
  active: boolean;
  onSelect: (tab: VisualizerKey) => void;
  isLocked?: boolean;
}) => {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={`group w-full h-[60px] border-l-[3px] px-6 flex items-center gap-4 text-left transition-colors duration-300 relative ${
        active
          ? 'border-blue-500 dark:border-[#00f5ff] bg-blue-50/80 dark:bg-[#00f5ff]/10'
          : 'border-transparent hover:bg-white/60 backdrop-blur-xl dark:hover:bg-white/5'
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-blue-600 dark:text-[#00f5ff]' : 'text-slate-500 dark:text-gray-500 group-hover:text-black dark:group-hover:text-gray-300'} />
      <span className={`text-[11px] sm:text-xs font-bold font-mono tracking-widest uppercase flex-1 ${
        active ? 'text-blue-600 dark:text-white' : 'text-slate-600 dark:text-gray-500 group-hover:text-black dark:group-hover:text-gray-300'
      }`}>
        {item.label}
      </span>
      {/* Small subtle lock icon if restricted */}
      {isLocked && (
        <Lock size={14} className="text-slate-400 dark:text-gray-600 group-hover:text-slate-700 dark:group-hover:text-gray-400 absolute right-6" />
      )}
    </button>
  );
};

export default Visualizer;