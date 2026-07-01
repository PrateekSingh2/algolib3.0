import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AppFooter from '@/components/AppFooter';
import { Cpu, Blocks, ListTree, BrainCircuit, ArrowRight, BookOpenCheck } from 'lucide-react';
import { setTrackedActivity } from '@/hooks/useActivityTracker';

const NotesHub = () => {
  useEffect(() => {
    setTrackedActivity('notes_hub');
  }, []);

  const notesSections = [
    {
      title: "Basic Programming",
      description: "Foundational concepts, programming syntax, variable declarations, control flows, and basic execution flow.",
      path: "/notes/basics",
      icon: Cpu,
      color: "cyan",
      glow: "rgba(34, 211, 238, 0.4)",
      features: ["Variables & Data Types", "Operators & Expressions", "Control Structures", "Functions & Scope", "File Handling", "Error & Exception Handling"]
    },
    {
      title: "Object Oriented Concepts",
      description: "Master OOP principles: Classes, Objects, Inheritance, Polymorphism, Encapsulation, and Abstraction.",
      path: "/notes/oops",
      icon: Blocks,
      color: "purple",
      glow: "rgba(168, 85, 247, 0.4)",
      features: ["Constructors & Destructors", "Encapsulation & Abstraction", "Inheritance & Polymorphism", "Design Patterns & Principles", "Generic & Templates", "SOLID Principles"]
    },
    {
      title: "Data Structures & Algos",
      description: "Deep dive into Arrays, Linked Lists, Stacks, Queues, Tree structures, Graph algorithms, and Sorting workflows.",
      path: "/notes/dsa",
      icon: ListTree,
      color: "emerald",
      glow: "rgba(16, 185, 129, 0.4)",
      features: ["Complexity Analysis", "Arrays, Linked Lists & Stacks", "Queues, Trees, Graphs & Heaps", "Searching, Sorting, & Hashing", "Greedy, Backtracking, DP & Trie", "DSU & Graphs Algorithms"]
    },
    {
      title: "Machine Learning Notes",
      description: "Comprehensive blueprints, algorithms, mathematical equations, and execution-ready Python implementations.",
      path: "/notes/ml",
      icon: BrainCircuit,
      color: "blue",
      glow: "rgba(59, 130, 246, 0.4)",
      features: ["NumPy, Pandas & Matplotlib", "Data Preprocessing, Supervised & Unsupervised Learning", "CNN, RNN, NLP, Transformers", "Reinforcement Learning, GANs, LLMs", "MLOps, Deployment, Statistic"]
    }
  ];

  return (
    <>
      <Helmet>
        <title>AlgoLib Notes Hub | Study Guides</title>
      </Helmet>

      {/* Cyber Space Ambient Background */}
      <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-[#030308] overflow-hidden transition-colors duration-350">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-100/30 dark:from-cyan-500/5 via-white dark:via-[#030308] to-slate-50 dark:to-black" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />
      </div>

      <Navbar />

      <main className="min-h-screen pt-[120px] pb-20 px-4 sm:px-6 flex flex-col items-center justify-center max-w-7xl mx-auto w-full">
        {/* Hub Title Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6 leading-tight">
            AlgoLib <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600 dark:from-cyan-400 dark:to-purple-400">Study Guides</span>
          </h1>
          <p className="text-slate-600 dark:text-zinc-400 text-base md:text-lg leading-relaxed">
            Consolidate your knowledge. Browse hand-crafted lecture notes and technical worksheets on core programming concepts, paradigms, algorithms, and AI/ML.
          </p>
        </motion.div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-7xl">
          {notesSections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Link to={section.path} className="group relative block h-full [perspective:1000px] hover:-translate-y-1.5 md:hover:translate-y-0 transition-transform duration-500">
                  {/* Subtle Glow Behind on Hover */}
                  <div
                    className="absolute inset-0 rounded-3xl blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"
                    style={{ backgroundColor: section.glow }}
                  />

                  {/* 3D Flip Container */}
                  <div className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] md:group-hover:[transform:rotateY(180deg)]">

                    {/* Front Face */}
                    <div className="relative h-full flex flex-col bg-gradient-to-br from-white/90 to-white/40 dark:from-[#151520]/80 dark:to-[#09090e]/60 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-3xl p-5 md:p-8 hover:border-white dark:hover:border-white/20 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.08)] overflow-hidden [backface-visibility:hidden]">
                      
                      {/* Hover Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 dark:via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay" />
                      {/* Faded Large Watermark Icon */}
                      <div className="absolute -top-4 -right-4 p-6 opacity-[0.02] dark:opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700 pointer-events-none">
                        <Icon size={160} />
                      </div>

                      <div className="flex justify-between items-start mb-6">
                        {/* Styled Category Icon Container */}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border transition-transform duration-350 group-hover:scale-105
                          ${section.color === 'cyan' ? 'bg-cyan-50 border-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-400' : ''}
                          ${section.color === 'purple' ? 'bg-purple-50 border-purple-100 text-purple-600 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400' : ''}
                          ${section.color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : ''}
                          ${section.color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' : ''}
                        `}>
                          <Icon size={26} />
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-950 group-hover:to-slate-600 dark:group-hover:from-white dark:group-hover:to-zinc-400 transition-all duration-300">
                        {section.title}
                      </h3>
                      <p className="hidden md:block text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-8 flex-1">
                        {section.description}
                      </p>

                      {/* Footer Trigger */}
                      <div className={`mt-auto pt-8 flex items-center justify-between text-xs font-black uppercase tracking-wider
                        ${section.color === 'cyan' ? 'text-cyan-600 dark:text-cyan-400' : ''}
                        ${section.color === 'purple' ? 'text-purple-600 dark:text-purple-400' : ''}
                        ${section.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : ''}
                        ${section.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : ''}
                      `}>
                        <span>Explore Notes</span>
                        <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform duration-300" />
                      </div>
                    </div>

                    {/* Back Face (Desktop Only) */}
                    <div className="hidden md:flex absolute inset-0 h-full w-full flex-col bg-gradient-to-bl from-white/90 to-white/40 dark:from-[#151520]/90 dark:to-[#09090e]/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.08)] overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      
                      {/* Hover Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 dark:via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay" />
                      <div className="absolute -bottom-4 -left-4 p-6 opacity-[0.02] dark:opacity-[0.03] transition-all duration-700 pointer-events-none">
                        <Icon size={160} />
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                        Curriculum Features
                      </h3>

                      {/* Features list */}
                      <div className="space-y-4 mb-8 flex-1">
                        {section.features.map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                            <div className={`w-2 h-2 rounded-full shrink-0
                              ${section.color === 'cyan' ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : ''}
                              ${section.color === 'purple' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : ''}
                              ${section.color === 'emerald' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''}
                              ${section.color === 'blue' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : ''}
                            `} />
                            {feature}
                          </div>
                        ))}
                      </div>

                      {/* Footer Trigger */}
                      <div className={`mt-auto flex items-center justify-between text-xs font-black uppercase tracking-wider
                        ${section.color === 'cyan' ? 'text-cyan-600 dark:text-cyan-400' : ''}
                        ${section.color === 'purple' ? 'text-purple-600 dark:text-purple-400' : ''}
                        ${section.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : ''}
                        ${section.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : ''}
                      `}>
                        <span>Enter Module</span>
                        <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>

      <AppFooter />
    </>
  );
};

export default NotesHub;
