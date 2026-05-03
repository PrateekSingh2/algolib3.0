import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, Database, Zap, BookOpen, Search, FolderTree, TerminalSquare, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// ─── Data Structure ──────────────────────────────────────────────────────────

const SHEET_CATEGORIES = [
  {
    category: "DSA Sheets",
    description: "Comprehensive roadmaps to build your core data structures and algorithms foundation.",
    items: [
      {
        title: "Starter Sheet",
        description: "Level up your fundamentals with our curated beginner roadmap. Track your progress seamlessly.",
        accentColor: "bg-rose-500",
        iconColor: "text-rose-400",
        glowColor: "shadow-[0_0_20px_rgba(244,63,94,0.6)]",
        bgGradient: "from-rose-500/20 via-rose-500/5 to-transparent",
        route: "/dsa-sheet",
        icon: Database,
      }
    ]
  },
  {
    category: "Competitive Programming",
    description: "Advanced algorithms, math, and problem-solving techniques to dominate contests.",
    items: [
      {
        title: "CP Sheet",
        description: "Master competitive programming. Learn advanced segment trees, graph theory, and combinatorics.",
        accentColor: "bg-emerald-500",
        iconColor: "text-emerald-400",
        glowColor: "shadow-[0_0_20px_rgba(16,185,129,0.6)]",
        bgGradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
        route: "/cp-sheet",
        icon: TerminalSquare,
      }
    ]
  },
  {
    category: "Topic Deep Dives",
    description: "Focused practice sheets targeting specific algorithmic concepts and patterns.",
    items: [
      {
        title: "Arrays",
        description: "Fundamental data structure for storing collections. Master two-pointers, sliding window, and prefixes.",
        accentColor: "bg-pink-500",
        iconColor: "text-pink-400",
        glowColor: "shadow-[0_0_20px_rgba(236,72,153,0.6)]",
        bgGradient: "from-pink-500/20 via-pink-500/5 to-transparent",
        route: "/dsa-sheet?topic=Arrays", 
        icon: Layers,
      },
      {
        title: "Introduction to DSA",
        description: "Primer on Data Structures and Algorithms. Learn space-time complexity and basic operations.",
        accentColor: "bg-purple-500",
        iconColor: "text-purple-400",
        glowColor: "shadow-[0_0_20px_rgba(168,85,247,0.6)]",
        bgGradient: "from-purple-500/20 via-purple-500/5 to-transparent",
        route: "/dsa-sheet",
        icon: BookOpen,
      },
      {
        title: "Binary Search",
        description: "Efficient searching algorithm. Master searching on arrays, answer ranges, and 2D matrices.",
        accentColor: "bg-cyan-500",
        iconColor: "text-cyan-400",
        glowColor: "shadow-[0_0_20px_rgba(6,182,212,0.6)]",
        bgGradient: "from-cyan-500/20 via-cyan-500/5 to-transparent",
        route: "/dsa-sheet?topic=Binary+Search",
        icon: Search,
      },
      {
        title: "Binary Search Tree",
        description: "Hierarchical data structure. Learn tree traversals, balancing, and lowest common ancestors.",
        accentColor: "bg-amber-500",
        iconColor: "text-amber-400",
        glowColor: "shadow-[0_0_20px_rgba(245,158,11,0.6)]",
        bgGradient: "from-amber-500/20 via-amber-500/5 to-transparent",
        route: "/dsa-sheet?topic=Trees",
        icon: FolderTree,
      }
    ]
  }
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Sheets() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-cyan-500/30 flex flex-col overflow-hidden">
      <Helmet><title>Practice Sheets — AlgoLib</title></Helmet>

      <Navbar />

      {/* ─── Ultra-Premium Ambient Mesh Background ─── */}
      {/* These glowing orbs provide the colorful backdrop needed for the glassmorphism to look incredible */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-emerald-600/5 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      <main className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-28 md:pt-36 pb-24">
        
        {/* ─── Header ─── */}
        <header className="mb-20 text-center md:text-left flex flex-col md:items-start items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center md:items-start"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] backdrop-blur-xl mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_4px_20px_rgba(0,0,0,0.3)]">
              <Layers size={14} className="text-cyan-400" />
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">Curriculum Hub</span>
            </div>
            <h1 className="text-4xl sm:text-[52px] font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight mb-5 drop-shadow-2xl">
              Practice Sheets
            </h1>
            <p className="text-zinc-400 max-w-2xl text-base sm:text-lg leading-relaxed font-medium">
              Curated problem sets designed to build your algorithmic intuition. Choose a path, track your progress, and master technical interviews.
            </p>
          </motion.div>
        </header>

        {/* ─── Sheet Categories Render ─── */}
        <div className="space-y-20">
          {SHEET_CATEGORIES.map((section, sectionIdx) => (
            <motion.section 
              key={section.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: sectionIdx * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-8 flex items-end gap-4 border-b border-white/[0.06] pb-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                    {section.category}
                  </h2>
                  <p className="text-[15px] text-zinc-400 font-medium">
                    {section.description}
                  </p>
                </div>
              </div>

              {/* Grid Layout for Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {section.items.map((item, idx) => (
                  <SheetCard key={idx} item={item} index={idx} />
                ))}
              </div>
            </motion.section>
          ))}
        </div>

      </main>

      <Footer />
    </div>
  );
}

// ─── Ultimate Glassmorphism Card ─────────────────────────────────────────────

const SheetCard = ({ item, index }: { item: any, index: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="relative group flex flex-col rounded-[24px] overflow-hidden transition-all duration-500 h-full min-h-[220px]"
    >
      {/* 1. Base Glass Layer */}
      <div className="absolute inset-0 bg-[#0c0c0e]/60 backdrop-blur-3xl border border-white/[0.08] rounded-[24px] group-hover:bg-[#121214]/80 group-hover:border-white/[0.18] transition-all duration-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_8px_40px_rgba(0,0,0,0.4)]" />
      
      {/* 2. Hover Color Bleed Gradient */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${item.bgGradient}`} />

      {/* 3. Content Wrapper */}
      <div className="relative z-10 flex flex-col h-full p-6">
        
        {/* Top Section */}
        <div className="flex gap-4 mb-8 flex-1">
          {/* Glowing Accent Line */}
          <div className={`w-1.5 rounded-full shrink-0 ${item.accentColor} ${item.glowColor} opacity-70 group-hover:opacity-100 group-hover:scale-y-110 transition-all duration-500 origin-top shadow-lg`} />
          
          <div className="pt-0.5">
            <div className="flex items-center gap-3 mb-3">
              {/* Icon Container with Glass Effect */}
              <div className={`p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] group-hover:bg-white/[0.08] group-hover:border-white/[0.15] transition-all duration-300 shadow-inner ${item.iconColor}`}>
                <item.icon size={18} strokeWidth={2.5} />
              </div>
              <h3 className="text-white font-bold text-[18px] tracking-tight leading-tight group-hover:text-white transition-colors">
                {item.title}
              </h3>
            </div>
            <p className="text-zinc-400 text-[13.5px] leading-relaxed line-clamp-3 group-hover:text-zinc-300 transition-colors font-medium">
              {item.description}
            </p>
          </div>
        </div>

        {/* Bottom Section: Glassmorphic Button */}
        <div className="mt-auto">
          <Link 
            to={item.route} 
            className="relative flex items-center justify-center gap-2 w-full py-3 rounded-[14px] font-semibold text-[13.5px] text-zinc-300 transition-all duration-300 group-hover:text-white overflow-hidden"
          >
            {/* Button Glass Base */}
            <div className="absolute inset-0 bg-white/[0.03] border border-white/[0.06] rounded-[14px] group-hover:bg-white/[0.1] group-hover:border-white/[0.2] transition-all duration-300 backdrop-blur-md shadow-inner" />
            
            <span className="relative z-10 tracking-wide">Start Learning</span>
            
            {/* Animated Arrow */}
            <ChevronRight 
              size={16} 
              className={`relative z-10 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 ${item.iconColor}`} 
              strokeWidth={2.5}
            />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};