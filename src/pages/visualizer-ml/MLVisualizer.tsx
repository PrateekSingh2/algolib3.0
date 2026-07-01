import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import {
  Activity,
  ArrowRightLeft,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  LineChart,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  GitGraph,
  Spline,
  ListTree,
  Users,
  Info,
  Lock,
  Cpu,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import { setTrackedActivity } from '@/hooks/useActivityTracker';

const LinearRegressionVisualizer = lazy(() => import('./LinearRegressionVisualizer'));
const KMeansVisualizer = lazy(() => import('./KMeansVisualizer'));
const KNNVisualizer = lazy(() => import('./KNNVisualizer'));
const LogisticRegressionVisualizer = lazy(() => import('./LogisticRegressionVisualizer'));
const NeuralNetworkVisualizer = lazy(() => import('./NeuralNetworkVisualizer'));
const DecisionTreeVisualizer = lazy(() => import('./DecisionTreeVisualizer'));

type VisualizerKey = 'neural-network' | 'linear-regression' | 'kmeans' | 'knn' | 'logistic-regression' | 'decision-tree';

const AlienBackground = () => (
  <div className="fixed inset-0 -z-10 bg-white dark:bg-[#020205] overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 dark:from-[#00ff88]/10 via-white dark:via-[#050510] to-teal-50 dark:to-[#000000]" />
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />
  </div>
);

// ─── Multiplayer Notice Toast ─────────────────────────────────────────────────
const MultiplayerNotice = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: -16, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -16, scale: 0.95 }}
    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    className="absolute top-16 right-4 z-50 w-[320px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-5"
  >
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Info size={18} className="text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Multiplayer Unavailable</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          ML Visualizers perform intensive real-time DOM manipulation and canvas updates that are not compatible with the current multiplayer sync engine. Use individually for the best experience.
        </p>
      </div>
      <button
        onClick={onClose}
        className="h-7 w-7 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  </motion.div>
);

const MLVisualizer = () => {
  const { mlType } = useParams<{ mlType: string }>();
  const navigate = useNavigate();
  const activeTab = (mlType as VisualizerKey) || 'neural-network';

  const { user } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showMultiplayerNotice, setShowMultiplayerNotice] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [topNavHidden, setTopNavHidden] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 639 : false
  );

  useEffect(() => {
    setTrackedActivity(`ml_visualizer_${activeTab}`);
  }, [activeTab]);

  const menu = useMemo(
    () => [
      { id: 'neural-network' as VisualizerKey, label: 'Neural Network', icon: BrainCircuit, component: <NeuralNetworkVisualizer /> },
      { id: 'linear-regression' as VisualizerKey, label: 'Linear Regression', icon: LineChart, component: <LinearRegressionVisualizer /> },
      { id: 'logistic-regression' as VisualizerKey, label: 'Logistic Regression', icon: Spline, component: <LogisticRegressionVisualizer /> },
      { id: 'decision-tree' as VisualizerKey, label: 'Decision Tree', icon: ListTree, component: <DecisionTreeVisualizer /> },
      { id: 'kmeans' as VisualizerKey, label: 'K-Means Clustering', icon: Network, component: <KMeansVisualizer /> },
      { id: 'knn' as VisualizerKey, label: 'K-Nearest Neighbors', icon: GitGraph, component: <KNNVisualizer /> },
    ],
    [],
  );

  const activeModule = menu.find((item) => item.id === activeTab);

  const selectTab = (tab: VisualizerKey) => {
    navigate(`/ml/visualizer/${tab}`);
    setDrawerOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>AlgoLib | ML Visualizer</title>
      </Helmet>

      <AlienBackground />

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

      <div className={`h-screen overflow-hidden text-black dark:text-white ${topNavHidden ? 'pt-2 sm:pt-3' : 'pt-[60px] sm:pt-[68px] lg:pt-[72px]'}`}>
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
                  <div className="p-6 border-b border-slate-100 dark:border-emerald-500/20 shrink-0">
                    <Link to="/ml" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-white/15 border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all mb-4 w-fit shadow-sm">
                      <ArrowRightLeft size={12} className="rotate-180" /> Back
                    </Link>
                    <h1 className="text-2xl font-black text-black dark:text-white flex items-center gap-3 tracking-tight">
                      <BrainCircuit className="text-emerald-500 dark:text-[#00ff88]" size={24} /> MLViz
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.15em] mt-2 text-emerald-600 dark:text-[#00ff88] font-bold">Machine Learning Engine</p>
                  </div>

                  <nav className="flex-1 py-4 flex flex-col overflow-y-auto custom-scrollbar">
                    {menu.map((item) => (
                      <MenuButton
                        key={item.id}
                        item={item}
                        active={activeTab === item.id}
                        onSelect={selectTab}
                        isLocked={!user && item.id !== 'neural-network'}
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

          <section className="flex-1 min-w-0 rounded-2xl border border-white/60 dark:border-white/10 bg-white/40 backdrop-blur-2xl/85 dark:bg-[#050510]/85 backdrop-blur-md overflow-hidden flex flex-col relative">
            <header className="h-14 sm:h-16 border-b border-white/60 dark:border-white/10 bg-white/60 backdrop-blur-xl/50 dark:bg-black/50 px-3 sm:px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden h-11 w-11 shrink-0 rounded-xl border border-emerald-500/20 dark:border-[#00ff88]/40 bg-emerald-50 dark:bg-[#00ff88]/10 grid place-items-center active:scale-95 transition-transform"
                  aria-label="Open modules"
                >
                  <Menu size={20} className="text-emerald-500 dark:text-[#00ff88]" />
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

              <div className="flex items-center gap-2">
                {/* Multiplayer Button — shows info notice instead of real multiplayer */}
                <button
                  onClick={() => setShowMultiplayerNotice(prev => !prev)}
                  className="h-11 px-3 shrink-0 rounded-xl border border-white/60 dark:border-white/10 bg-white/60 backdrop-blur-xl dark:bg-white/5 text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
                  aria-label="Multiplayer info"
                >
                  <Users size={16} />
                  <span className="hidden sm:inline">Multiplayer</span>
                </button>

                <button
                  onClick={() => setTopNavHidden((prev) => !prev)}
                  className="h-11 min-w-11 shrink-0 px-3 rounded-xl border border-white/60 dark:border-white/10 bg-white/60 backdrop-blur-xl dark:bg-white/5 text-slate-700 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all flex items-center justify-center shadow-sm dark:shadow-none"
                  aria-label="Toggle top navbar"
                >
                  {topNavHidden ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
              </div>
            </header>

            {/* Multiplayer Notice */}
            <AnimatePresence>
              {showMultiplayerNotice && (
                <MultiplayerNotice onClose={() => setShowMultiplayerNotice(false)} />
              )}
            </AnimatePresence>

            <div className="flex-1 min-h-0 p-2 sm:p-3 lg:p-4 overflow-hidden">
              <div className="rounded-xl border border-white/60 dark:border-white/10 bg-gradient-to-br from-[#e0f2ec] to-[#c5e1d4] dark:from-[#020503] dark:to-[#0a1a12] h-full overflow-hidden relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
                <div className="relative z-10 h-full w-full overflow-auto">
                  <Suspense fallback={<div className="h-full grid place-items-center text-sm text-emerald-500">Booting visualizer...</div>}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="h-full w-full"
                      >
                        {!user && activeTab !== 'neural-network' ? (
                          <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-300">
                            <div className="h-20 w-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-[#00ff88]/20 flex items-center justify-center mb-6 shadow-sm dark:shadow-[0_0_40px_rgba(0,255,136,0.15)] relative overflow-hidden">
                              <div className="absolute inset-0 bg-emerald-100 dark:bg-[#00ff88]/10 animate-pulse" />
                              <Lock size={32} className="text-emerald-500 dark:text-[#00ff88] relative z-10" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white mb-3">
                              RESTRICTED SECTOR
                            </h3>
                            <p className="text-slate-700 dark:text-gray-400 max-w-md text-sm leading-relaxed mb-8">
                              The <span className="text-emerald-500 dark:text-[#00ff88] font-mono">{activeModule?.label}</span> simulation module requires security clearance. Authenticate your account to unlock all advanced interactive algorithms.
                            </p>
                            <button
                              onClick={() => setIsAuthModalOpen(true)}
                              className="flex items-center gap-2 px-8 py-3.5 bg-emerald-500 dark:bg-[#00ff88] hover:bg-emerald-400 dark:hover:bg-emerald-300 text-black font-bold text-sm rounded-xl transition-all shadow-md dark:shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:scale-105 active:scale-95"
                            >
                              <Cpu size={16} /> INITIALIZE LOGIN
                            </button>
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
              <div className="p-6 pt-12 border-b border-slate-100 dark:border-[#00ff88]/20 flex items-center justify-between">
                <div>
                  <Link to="/ml" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all mb-4 w-fit shadow-sm">
                    <ArrowRightLeft size={12} className="rotate-180" /> Back to Hub
                  </Link>
                  <h2 className="text-2xl font-black text-black dark:text-white flex items-center gap-3 tracking-tight">
                    <BrainCircuit className="text-emerald-500 dark:text-[#00ff88]" size={24} /> MLViz
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.15em] mt-2 text-emerald-500 dark:text-[#00ff88] font-bold">Machine Learning Engine</p>
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
                    isLocked={!user && item.id !== 'neural-network'}
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
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

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
      className={`group w-full h-[60px] border-l-[3px] px-6 flex items-center gap-4 text-left transition-colors duration-300 relative ${active
        ? 'border-emerald-500 dark:border-[#00ff88] bg-emerald-50/80 dark:bg-[#00ff88]/10'
        : 'border-transparent hover:bg-white/60 backdrop-blur-xl dark:hover:bg-white/5'
        }`}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-emerald-600 dark:text-[#00ff88]' : 'text-slate-500 dark:text-gray-500 group-hover:text-black dark:group-hover:text-gray-300'} />
      <span className={`text-[11px] sm:text-xs font-bold font-mono tracking-widest uppercase flex-1 ${active ? 'text-emerald-600 dark:text-white' : 'text-slate-600 dark:text-gray-500 group-hover:text-black dark:group-hover:text-gray-300'
        }`}>
        {item.label}
      </span>
      {isLocked && (
        <Lock size={14} className="text-slate-400 dark:text-gray-600 group-hover:text-slate-700 dark:group-hover:text-gray-400 absolute right-6" />
      )}
    </button>
  );
};

export default MLVisualizer;
