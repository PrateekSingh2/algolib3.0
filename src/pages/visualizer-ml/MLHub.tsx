import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AppFooter from '@/components/AppFooter';
import { BrainCircuit, BookText, ArrowRight, Sparkles, Clock, LineChart } from 'lucide-react';
import { setTrackedActivity } from '@/hooks/useActivityTracker';

const MLHub = () => {
  useEffect(() => {
    setTrackedActivity('ml_hub');
  }, []);

  const mlSections: Array<{
    title: string;
    description: string;
    path: string;
    icon: React.ElementType;
    color: string;
    glow: string;
    features: string[];
    isComingSoon?: boolean;
  }> = [
    {
      title: "ML Algorithm Visualizer",
      description: "Interactive real-time visualizations for Regression, Classification, and Clustering algorithms.",
      path: "/ml/visualizer",
      icon: LineChart,
      color: "emerald",
      glow: "rgba(16, 185, 129, 0.5)",
      features: ["Neural Networks", "Decision Trees", "Linear Regression & Clustering"]
    },
    {
      title: "Machine Learning Notes",
      description: "Comprehensive notes, mathematics, and code implementations for ML concepts.",
      path: "/notes/ml",
      icon: BookText,
      color: "blue",
      glow: "rgba(59, 130, 246, 0.5)",
      features: ["Mathematics of ML", "Python Implementations", "Interview Prep"]
    }
  ];

  return (
    <>
      <Helmet>
        <title>AlgoLib AI/ML Hub | Explore Machine Learning</title>
      </Helmet>
      
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[#f8fafc] dark:bg-[#050505] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/50 dark:from-emerald-500/5 via-white dark:via-[#050505] to-slate-50 dark:to-[#000000]" />
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono tracking-widest uppercase mb-6">
            <BrainCircuit size={14} /> AlgoLib AI & ML
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6 leading-tight">
            Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">Machine Learning</span>
          </h1>
          <p className="text-slate-600 dark:text-zinc-400 text-lg leading-relaxed">
            Dive into the world of AI. Visualize how models learn iteratively, or study the foundational mathematics behind them.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
          {mlSections.map((section, idx) => {
            const Icon = section.icon;
            const Wrapper = section.isComingSoon ? 'div' : Link;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={section.isComingSoon ? "opacity-75 cursor-not-allowed" : ""}
              >
                <Wrapper to={section.path} className={`group relative block h-full ${section.isComingSoon ? 'pointer-events-none' : 'hover:-translate-y-1.5 transition-transform duration-500'}`}>
                  <div 
                    className="absolute inset-0 rounded-3xl blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"
                    style={{ backgroundColor: section.glow }}
                  />
                  <div className="relative h-full flex flex-col bg-white/70 dark:bg-[#09090e]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-8 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                    
                    <div className="absolute -top-4 -right-4 p-6 opacity-[0.02] dark:opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700 pointer-events-none">
                       <Icon size={160} />
                    </div>

                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border
                        ${section.color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' : ''}
                        ${section.color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : ''}
                      `}>
                        <Icon size={28} />
                      </div>
                      {section.isComingSoon && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-zinc-700">
                          <Clock size={12} /> Coming Soon
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 dark:group-hover:from-white dark:group-hover:to-zinc-400 transition-all">
                      {section.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-8 flex-1">
                      {section.description}
                    </p>

                    <div className="space-y-2 mb-8">
                      {section.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300">
                          <div className={`w-1.5 h-1.5 rounded-full 
                            ${section.color === 'blue' ? 'bg-blue-500' : ''}
                            ${section.color === 'emerald' ? 'bg-emerald-500' : ''}
                          `} />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className={`mt-auto flex items-center justify-between text-sm font-bold
                      ${section.isComingSoon ? 'text-slate-400 dark:text-zinc-500' : 
                        section.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 
                        'text-emerald-600 dark:text-emerald-400'
                      }
                    `}>
                      <span>{section.isComingSoon ? 'IN DEVELOPMENT' : 'LAUNCH MODULE'}</span>
                      {!section.isComingSoon && <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />}
                    </div>
                  </div>
                </Wrapper>
              </motion.div>
            );
          })}
        </div>
      </main>

      <AppFooter />
    </>
  );
};

export default MLHub;
