import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import AppFooter from '@/components/AppFooter';
import { Database, Code2, Zap, ArrowRight, Network, Sparkles, Binary, Clock, BrainCircuit } from 'lucide-react';
import { setTrackedActivity } from '@/hooks/useActivityTracker';

const VisualizerHub = () => {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

  useEffect(() => {
    setTrackedActivity('visualizer_hub');
  }, []);

  const visualizers = [
    {
      title: "Data Structure Simulator",
      description: "Interactive 60FPS visualizations for Linked Lists, Trees, Graphs, Sorting, and more.",
      path: "/visualizer/dsa/ll",
      icon: Network,
      color: "blue",
      glow: "rgba(59, 130, 246, 0.5)",
      features: ["7+ Data Structures", "Real-time Execution", "Speed Control"]
    },
    {
      title: "Machine Learning Visualizer",
      description: "Interactive real-time visualizations for Regression, Classification, and Clustering algorithms.",
      path: "/ml/visualizer",
      icon: BrainCircuit,
      color: "orange",
      glow: "rgba(249, 115, 22, 0.5)",
      features: ["Neural Networks", "Decision Trees", "Linear Regression"]
    },
    {
      title: "Step-by-Step Code Execution",
      description: "Watch code execute line-by-line with real-time memory state and variable tracking.",
      path: "/visualizer/code",
      icon: Code2,
      color: "emerald",
      glow: "rgba(16, 185, 129, 0.5)",
      features: ["Variable Tracking", "Call Stack Viewer", "Memory Profiling"]
    },
    {
      title: "AI-Powered Simulation",
      description: "Write raw code and let Vectoris automatically generate interactive visual nodes.",
      path: "/visualizer/ai",
      icon: Zap,
      color: "violet",
      glow: "rgba(139, 92, 246, 0.5)",
      features: ["Auto-Node Generation", "Natural Language", "Smart Graphing"],
      isComingSoon: true
    }
  ];

  return (
    <>
      <Helmet>
        <title>AlgoLib Visualizer Hub | Choose Your Tool</title>
      </Helmet>
      
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[#f8fafc] dark:bg-[#050505] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 dark:from-[#00f5ff]/5 via-white dark:via-[#050505] to-slate-50 dark:to-[#000000]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />
      </div>

      <Navbar />

      <main className="min-h-screen pt-[100px] pb-20 px-4 sm:px-6 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 max-w-2xl mx-auto mt-10 md:mt-0"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono tracking-widest uppercase mb-6">
            <Sparkles size={14} /> AlgoLib Engine
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6 leading-tight">
            Select Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Simulation</span>
          </h1>
          <p className="text-slate-600 dark:text-zinc-400 text-lg leading-relaxed">
            Choose the right tool for the job. Whether you want to explore raw data structures, trace execution line-by-line, or let AI generate the simulation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
          {visualizers.map((viz, idx) => {
            const Icon = viz.icon;
            const Wrapper = viz.isComingSoon ? 'div' : Link;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={viz.isComingSoon ? "opacity-75 cursor-not-allowed" : ""}
              >
                <Wrapper 
                  to={viz.path} 
                  onClick={(e: any) => {
                    if (viz.path === '/visualizer/code' && !user) {
                      e.preventDefault();
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className={`group relative block h-full ${viz.isComingSoon ? 'pointer-events-none' : ''}`}
                >
                  <div 
                    className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ backgroundColor: viz.glow }}
                  />
                  <div className="relative h-full flex flex-col bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-8 hover:border-slate-300 dark:hover:border-white/10 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                    
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                       <Icon size={120} />
                    </div>

                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border
                        ${viz.color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' : ''}
                        ${viz.color === 'orange' ? 'bg-orange-50 border-orange-100 text-orange-600 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400' : ''}
                        ${viz.color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : ''}
                        ${viz.color === 'violet' ? 'bg-violet-50 border-violet-100 text-violet-600 dark:bg-violet-500/10 dark:border-violet-500/20 dark:text-violet-400' : ''}
                      `}>
                        <Icon size={28} />
                      </div>
                      {viz.isComingSoon && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-zinc-700">
                          <Clock size={12} /> Coming Soon
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 dark:group-hover:from-white dark:group-hover:to-zinc-400 transition-all">
                      {viz.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-8 flex-1">
                      {viz.description}
                    </p>

                    <div className="space-y-2 mb-8">
                      {viz.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300">
                          <div className={`w-1.5 h-1.5 rounded-full 
                            ${viz.color === 'blue' ? 'bg-blue-500' : ''}
                            ${viz.color === 'orange' ? 'bg-orange-500' : ''}
                            ${viz.color === 'emerald' ? 'bg-emerald-500' : ''}
                            ${viz.color === 'violet' ? 'bg-violet-500' : ''}
                          `} />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className={`mt-auto flex items-center justify-between text-sm font-bold
                      ${viz.isComingSoon ? 'text-slate-400 dark:text-zinc-500' : 
                        viz.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 
                        viz.color === 'orange' ? 'text-orange-600 dark:text-orange-400' : 
                        viz.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 
                        'text-violet-600 dark:text-violet-400'
                      }
                    `}>
                      <span>{viz.isComingSoon ? 'IN DEVELOPMENT' : 'LAUNCH MODULE'}</span>
                      {!viz.isComingSoon && <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />}
                    </div>
                  </div>
                </Wrapper>
              </motion.div>
            );
          })}
        </div>
      </main>

      <AppFooter />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default VisualizerHub;
