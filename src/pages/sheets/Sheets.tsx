import React, { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Layers, Database, Zap, BookOpen, Search, FolderTree,
  TerminalSquare, ChevronRight, ChevronLeft, Hash, Code,
  Shuffle, Activity, Network, ArrowRight
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { TOPIC_NAV, TOPICS_DATA } from './TopicDetail';
import { motion } from 'framer-motion';

// ─── Icon & Color Mappings ────────────────────────────────────────────────────

const getTopicIcon = (slug: string) => {
  switch (slug) {
    case 'arrays': return Layers;
    case 'maths': return Hash;
    case 'binary-search': return Search;
    case 'strings': return Code;
    case 'linked-list': return Shuffle;
    case 'stacks-queues': return Database;
    case 'trees': return FolderTree;
    case 'graphs': return Network;
    case 'dynamic-programming': return Activity;
    case 'greedy': return Zap;
    default: return BookOpen;
  }
};

const getTopicColorClasses = (slug: string) => {
  switch (slug) {
    case 'arrays':            return { accent: '#f472b6', accentBg: 'rgba(244,114,182,0.12)', accentBorder: 'rgba(244,114,182,0.25)', textColor: 'text-pink-400',    glow: 'rgba(244,114,182,0.4)' };
    case 'maths':             return { accent: '#fb923c', accentBg: 'rgba(251,146,60,0.12)',  accentBorder: 'rgba(251,146,60,0.25)',  textColor: 'text-orange-400',  glow: 'rgba(251,146,60,0.4)'  };
    case 'binary-search':     return { accent: '#22d3ee', accentBg: 'rgba(34,211,238,0.12)',  accentBorder: 'rgba(34,211,238,0.25)',  textColor: 'text-cyan-400',    glow: 'rgba(34,211,238,0.4)'  };
    case 'strings':           return { accent: '#818cf8', accentBg: 'rgba(129,140,248,0.12)', accentBorder: 'rgba(129,140,248,0.25)', textColor: 'text-indigo-400',  glow: 'rgba(129,140,248,0.4)' };
    case 'linked-list':       return { accent: '#34d399', accentBg: 'rgba(52,211,153,0.12)',  accentBorder: 'rgba(52,211,153,0.25)',  textColor: 'text-emerald-400', glow: 'rgba(52,211,153,0.4)'  };
    case 'stacks-queues':     return { accent: '#fbbf24', accentBg: 'rgba(251,191,36,0.12)',  accentBorder: 'rgba(251,191,36,0.25)',  textColor: 'text-amber-400',   glow: 'rgba(251,191,36,0.4)'  };
    case 'trees':             return { accent: '#a3e635', accentBg: 'rgba(163,230,53,0.12)',  accentBorder: 'rgba(163,230,53,0.25)',  textColor: 'text-lime-400',    glow: 'rgba(163,230,53,0.4)'  };
    case 'graphs':            return { accent: '#2dd4bf', accentBg: 'rgba(45,212,191,0.12)',  accentBorder: 'rgba(45,212,191,0.25)',  textColor: 'text-teal-400',    glow: 'rgba(45,212,191,0.4)'  };
    case 'dynamic-programming': return { accent: '#60a5fa', accentBg: 'rgba(96,165,250,0.12)', accentBorder: 'rgba(96,165,250,0.25)', textColor: 'text-blue-400',   glow: 'rgba(96,165,250,0.4)'  };
    case 'greedy':            return { accent: '#f87171', accentBg: 'rgba(248,113,113,0.12)', accentBorder: 'rgba(248,113,113,0.25)', textColor: 'text-rose-400',    glow: 'rgba(248,113,113,0.4)' };
    default:                  return { accent: '#c084fc', accentBg: 'rgba(192,132,252,0.12)', accentBorder: 'rgba(192,132,252,0.25)', textColor: 'text-purple-400',  glow: 'rgba(192,132,252,0.4)' };
  }
};

const TOPIC_ITEMS = TOPIC_NAV.map(nav => {
  const topic = TOPICS_DATA[nav.slug];
  const colors = getTopicColorClasses(nav.slug);
  return {
    title: topic.title,
    description: topic.subtitle,
    route: `/topic/${nav.slug}`,
    icon: getTopicIcon(nav.slug),
    ...colors
  };
});

// ─── Feature Sheet Data ───────────────────────────────────────────────────────

const FEATURED_SHEETS = [
  {
    title: 'Starter DSA Sheet',
    tag: 'Foundation',
    description: 'A curated 150-problem beginner roadmap covering arrays, strings, recursion, and essential patterns. Built to take you from zero to interview-ready.',
    route: '/dsa-sheet',
    icon: Database,
    accent: '#f87171',
    accentBg: 'rgba(248,113,113,0.10)',
    accentBorder: 'rgba(248,113,113,0.2)',
    textColor: 'text-rose-400',
    glow: 'rgba(248,113,113,0.35)',
    stats: [{ label: 'Problems', value: '150+' }, { label: 'Topics', value: '12' }, { label: 'Difficulty', value: 'Easy–Med' }],
  },
  {
    title: 'CP Sheet',
    tag: 'Advanced',
    description: 'Master competitive programming with segment trees, advanced graph algorithms, combinatorics, and contest-level problem solving techniques.',
    route: '/cp-sheet',
    icon: TerminalSquare,
    accent: '#34d399',
    accentBg: 'rgba(52,211,153,0.10)',
    accentBorder: 'rgba(52,211,153,0.2)',
    textColor: 'text-emerald-400',
    glow: 'rgba(52,211,153,0.35)',
    stats: [{ label: 'Problems', value: '200+' }, { label: 'Topics', value: '18' }, { label: 'Difficulty', value: 'Med–Hard' }],
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Sheets() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 340 : -340, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-zinc-300 font-sans selection:bg-cyan-500/30 flex flex-col bg-sky-50 dark:bg-[#0d0f12]">
      <Helmet><title>Practice Sheets — AlgoLib</title></Helmet>
      <Navbar />

      {/* ─── Background ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base dark tone */}
        <div className="absolute inset-0 bg-sky-50 dark:bg-[#0d0f12]" />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: 'radial-gradient(circle, #4b5563 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Vignette — darkens edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#e0f2fe_100%)] dark:bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#080b0f_100%)]" />

        {/* Glowing orbs — toned down for the darker palette */}
        <div
          className="absolute rounded-full animate-pulse"
          style={{
            top: '-8%', left: '-6%',
            width: '45vw', height: '45vw',
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animationDuration: '12s',
          }}
        />
        <div
          className="absolute rounded-full animate-pulse"
          style={{
            top: '5%', right: '-12%',
            width: '55vw', height: '55vw',
            background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animationDuration: '16s',
            animationDelay: '3s',
          }}
        />
        <div
          className="absolute rounded-full animate-pulse"
          style={{
            bottom: '-10%', left: '15%',
            width: '50vw', height: '50vw',
            background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animationDuration: '14s',
            animationDelay: '6s',
          }}
        />
        <div
          className="absolute rounded-full animate-pulse"
          style={{
            top: '45%', left: '35%',
            width: '25vw', height: '25vw',
            background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animationDuration: '9s',
            animationDelay: '1.5s',
          }}
        />

        {/* Horizontal decorative line at top */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>

      {/* ─── Main Content ─── */}
      <main className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-28 md:pt-36 pb-28">

        {/* ── Hero Header ── */}
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center md:text-left"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-6" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <Layers size={13} className="text-indigo-400" />
            <span className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-[0.15em]">Curriculum Hub</span>
          </div>

          <h1 className="text-[42px] sm:text-[60px] font-black tracking-tight leading-[1.05] mb-5">
            <span className="text-black dark:text-white">Practice</span>{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Sheets</span>
          </h1>
          <p className="text-slate-600 dark:text-zinc-500 max-w-xl text-[15px] sm:text-base leading-relaxed">
            Curated problem sets to build algorithmic intuition. Pick a path, track your progress, and get interview-ready.
          </p>
        </motion.header>

        {/* ── Featured Sheets ── */}
        <section className="mb-20">
          <SectionLabel index={0} label="Core Sheets" desc="Structured roadmaps for every stage of your journey." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            {FEATURED_SHEETS.map((sheet, i) => (
              <FeaturedCard key={sheet.route} sheet={sheet} index={i} />
            ))}
          </div>
        </section>

        {/* ── Topic Deep Dives ── */}
        <section>
          <SectionLabel index={1} label="Topic Deep Dives" desc="Focused practice targeting specific algorithmic concepts and patterns." />

          <div className="relative mt-6 group/scroll">
            {/* Scroll Fade Overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-r from-[#0d0f12] to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-l from-[#0d0f12] to-transparent" />

            {/* Scroll Track */}
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-3 pt-1 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`.scroll-hide::-webkit-scrollbar { display: none; }`}</style>
              {TOPIC_ITEMS.map((item, idx) => (
                <div key={idx} className="shrink-0 w-[240px] sm:w-[270px]" style={{ height: 230 }}>
                  <TopicCard item={item} index={idx} />
                </div>
              ))}
            </div>

            {/* Nav Buttons */}
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center text-slate-500 dark:text-zinc-300 opacity-0 group-hover/scroll:opacity-100 transition-all duration-300 hover:text-black dark:hover:text-white border bg-white dark:bg-[#0f1318] border-blue-200 dark:border-white/10"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center text-slate-500 dark:text-zinc-300 opacity-0 group-hover/scroll:opacity-100 transition-all duration-300 hover:text-black dark:hover:text-white border bg-white dark:bg-[#0f1318] border-blue-200 dark:border-white/10"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

const SectionLabel = ({ label, desc, index }: { label: string; desc: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.55, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col gap-1 border-b pb-4"
    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
  >
    <h2 className="text-[20px] sm:text-2xl font-bold text-black dark:text-white tracking-tight">{label}</h2>
    <p className="text-[13.5px] text-slate-600 dark:text-zinc-500">{desc}</p>
  </motion.div>
);

// ─── Featured Sheet Card ──────────────────────────────────────────────────────

const FeaturedCard = ({ sheet, index }: { sheet: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    className="relative group rounded-2xl overflow-hidden flex flex-col border border-blue-200 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]"
  >
    {/* Hover accent gradient */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ background: `radial-gradient(ellipse at top left, ${sheet.accentBg} 0%, transparent 70%)` }}
    />

    {/* Top accent bar */}
    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(to right, ${sheet.accent}55, transparent)` }} />

    <div className="relative z-10 p-6 flex flex-col h-full">
      {/* Header row */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: sheet.accentBg, border: `1px solid ${sheet.accentBorder}` }}
          >
            <sheet.icon size={19} style={{ color: sheet.accent }} />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: sheet.accent }}>{sheet.tag}</span>
            <h3 className="text-black dark:text-white font-bold text-[17px] leading-snug">{sheet.title}</h3>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-600 dark:text-zinc-500 text-[13.5px] leading-relaxed mb-6 flex-1 group-hover:text-slate-800 dark:group-hover:text-zinc-400 transition-colors duration-300">
        {sheet.description}
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-6">
        {sheet.stats.map((s: any) => (
          <div key={s.label} className="flex flex-col">
            <span className="text-[11px] text-slate-500 dark:text-zinc-600 font-medium uppercase tracking-wider">{s.label}</span>
            <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">{s.value}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        to={sheet.route}
        className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300"
        style={{
          background: sheet.accentBg,
          border: `1px solid ${sheet.accentBorder}`,
          color: sheet.accent,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = sheet.accentBorder;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = sheet.accentBg;
        }}
      >
        Start Learning
        <ArrowRight size={14} strokeWidth={2.5} />
      </Link>
    </div>
  </motion.div>
);

// ─── Topic Card (Horizontal Scroll) ──────────────────────────────────────────

const TopicCard = ({ item, index }: { item: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.94 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
    className="relative group flex flex-col h-full rounded-[18px] overflow-hidden transition-all duration-300 border border-blue-200 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]"
  >
    {/* Hover glow bg */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
      style={{ background: `radial-gradient(ellipse at top left, ${item.accentBg} 0%, transparent 75%)` }}
    />

    {/* Top accent line */}
    <div
      className="absolute top-0 left-0 right-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: `linear-gradient(to right, ${item.accent}80, transparent)` }}
    />

    <div className="relative z-10 flex flex-col h-full p-5">
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
        style={{ background: item.accentBg, border: `1px solid ${item.accentBorder}` }}
      >
        <item.icon size={16} style={{ color: item.accent }} strokeWidth={2.2} />
      </div>

      {/* Title + desc */}
      <h3 className="text-black dark:text-white font-semibold text-[15px] leading-snug mb-2 transition-colors">
        {item.title}
      </h3>
      <p className="text-slate-600 dark:text-zinc-500 text-[12.5px] leading-relaxed line-clamp-3 group-hover:text-slate-800 dark:group-hover:text-zinc-400 transition-colors duration-300 flex-1">
        {item.description}
      </p>

      {/* CTA */}
      <div className="mt-auto pt-4">
        <Link
          to={item.route}
          className="flex items-center gap-1.5 text-[12px] font-semibold transition-all duration-300"
          style={{ color: `${item.accent}99` }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = item.accent; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = `${item.accent}99`; }}
        >
          Explore
          <ChevronRight size={13} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  </motion.div>
);