import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Bookmark, Share2, BookOpen, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { fetchAlgorithms, Algorithm } from '@/lib/algorithms';

// --- Local Topic Definitions ---
export interface TopicMeta {
  slug: string;
  title: string;
  subtitle: string;
  accentColor: string;
  matchCategories: string[];
}

export const TOPIC_NAV = [
  { slug: 'maths', label: 'Maths' },
  { slug: 'arrays', label: 'Arrays' },
  { slug: 'binary-search', label: 'Binary Search' },
  { slug: 'strings', label: 'Strings' },
  { slug: 'linked-list', label: 'Linked List' },
  { slug: 'stacks-queues', label: 'Stacks & Queues' },
  { slug: 'trees', label: 'Trees' },
  { slug: 'graphs', label: 'Graphs' },
  { slug: 'dynamic-programming', label: 'Dynamic Programming' },
  { slug: 'greedy', label: 'Greedy' },
];

export const TOPICS_DATA: Record<string, TopicMeta> = {
  maths: {
    slug: 'maths', title: 'Maths', subtitle: 'Fundamental principles, number theory, and mathematical operations for algorithmic problem solving.', accentColor: '#f97316', matchCategories: ['Math', 'Bit Manipulation'],
  },
  arrays: {
    slug: 'arrays', title: 'Arrays', subtitle: 'The backbone of DSA. Master two-pointers, sliding window, prefix sums, and more.', accentColor: '#ec4899', matchCategories: ['Array', 'Sorting', 'Searching', 'Two Pointers', 'Sliding Window'],
  },
  'binary-search': {
    slug: 'binary-search', title: 'Binary Search', subtitle: 'Efficiently search sorted spaces. Master searching on arrays, answer spaces, and 2D matrices.', accentColor: '#06b6d4', matchCategories: ['Searching', 'Binary Search'],
  },
  strings: {
    slug: 'strings', title: 'Strings', subtitle: 'Character manipulation, pattern matching, and string-specific algorithmic patterns.', accentColor: '#a78bfa', matchCategories: ['Strings', 'String'],
  },
  'linked-list': {
    slug: 'linked-list', title: 'Linked List', subtitle: 'Pointer manipulation, cycle detection, reversal, and merge techniques.', accentColor: '#34d399', matchCategories: ['Linked Lists', 'Linked List'],
  },
  'stacks-queues': {
    slug: 'stacks-queues', title: 'Stacks & Queues', subtitle: 'LIFO/FIFO structures powering monotonic stacks, BFS, and expression evaluation.', accentColor: '#fbbf24', matchCategories: ['Stack', 'Queue', 'Stacks', 'Queues'],
  },
  trees: {
    slug: 'trees', title: 'Trees', subtitle: 'Traversals, balancing, LCA, and hierarchical data structure mastery.', accentColor: '#f59e0b', matchCategories: ['Trees', 'Tree'],
  },
  graphs: {
    slug: 'graphs', title: 'Graphs', subtitle: 'BFS, DFS, shortest paths, topological sort, and union-find.', accentColor: '#10b981', matchCategories: ['Graphs', 'Graph'],
  },
  'dynamic-programming': {
    slug: 'dynamic-programming', title: 'Dynamic Programming', subtitle: 'Memoization, tabulation, and the art of breaking problems into optimal substructures.', accentColor: '#60a5fa', matchCategories: ['Dynamic Programming', 'DP'],
  },
  greedy: {
    slug: 'greedy', title: 'Greedy', subtitle: 'Making locally optimal choices that lead to globally optimal solutions.', accentColor: '#fb7185', matchCategories: ['Greedy'],
  },
};

const DIFF_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  Easy:   { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  Medium: { text: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20'   },
  Hard:   { text: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-400/20'    },
};

export default function TopicDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [loading, setLoading] = useState(true);

  const topic = TOPICS_DATA[slug ?? ''];

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAlgorithms().then((data) => {
      if (!mounted) return;
      if (topic) {
        // Filter based on matchCategories or tag matching
        const filtered = data.filter(algo => 
          topic.matchCategories.some(cat => 
            algo.category?.toLowerCase().includes(cat.toLowerCase()) || 
            (algo.tags && algo.tags.some(tag => tag.toLowerCase().includes(cat.toLowerCase())))
          )
        );
        setAlgorithms(filtered);
      }
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [slug, topic]);

  if (!topic) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-[#050505] flex items-center justify-center text-slate-500 dark:text-zinc-400">
        Topic not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-[#050505] text-slate-800 dark:text-zinc-300 font-sans flex flex-col">
      <Helmet>
        <title>{topic.title} — AlgoLib</title>
        <meta name="description" content={topic.subtitle} />
      </Helmet>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[45vw] h-[45vw] rounded-full blur-[140px] mix-blend-screen opacity-40"
          style={{ background: topic.accentColor + '22' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/10 blur-[130px] mix-blend-screen" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 pt-28 md:pt-36 pb-24">

        {/* ─── Back Button ─── */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link to="/sheets" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={16} />
            Back to Practice Sheets
          </Link>
        </motion.div>

        {/* ─── Page Header ─── */}
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 flex items-start gap-5"
        >
          {/* Vertical accent line */}
          <div
            className="shrink-0 w-1 self-stretch rounded-full mt-1"
            style={{ background: `linear-gradient(to bottom, ${topic.accentColor}, transparent)` }}
          />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-2"
              style={{ color: topic.accentColor }}>
              Topic Deep Dive
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              {topic.title}
            </h1>
            <p className="text-slate-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed max-w-2xl">
              {topic.subtitle}
            </p>
          </div>
        </motion.header>

        {/* ─── Topic Navigation Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <div
            ref={navRef}
            className="flex gap-2 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
          >
            <style>{`.topic-nav::-webkit-scrollbar { display: none; }`}</style>
            {TOPIC_NAV.map(nav => {
              const isActive = nav.slug === slug;
              return (
                <button
                  key={nav.slug}
                  onClick={() => navigate(`/topic/${nav.slug}`)}
                  className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 border whitespace-nowrap ${
                    isActive
                      ? 'text-slate-900 dark:text-white border-blue-200 dark:border-white/20 bg-white/60 dark:bg-white/10 shadow-sm dark:shadow-[0_0_12px_rgba(255,255,255,0.06)]'
                      : 'text-slate-500 dark:text-zinc-400 border-blue-200 dark:border-white/[0.06] bg-white/30 dark:bg-white/[0.02] hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.08] hover:border-blue-300 dark:hover:border-white/[0.1]'
                  }`}
                  style={isActive ? { borderColor: topic.accentColor + '60', boxShadow: `0 0 14px ${topic.accentColor}22` } : {}}
                >
                  {nav.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ─── Problem List ─── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-blue-200 dark:border-white/[0.07] bg-white/50 dark:bg-white/[0.015] backdrop-blur-sm overflow-hidden shadow-sm dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
        >
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[2.5rem_1fr_auto] items-center px-6 py-3 bg-white/40 dark:bg-white/[0.015] border-b border-blue-100 dark:border-white/[0.05]">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-600 uppercase tracking-widest">Sl no.</span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-600 uppercase tracking-widest">Topic</span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-600 uppercase tracking-widest pr-2 text-right">Action</span>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="py-24 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : algorithms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-blue-200 dark:border-white/[0.07] flex items-center justify-center mb-5">
                <BookOpen size={24} className="text-slate-400 dark:text-zinc-600" />
              </div>
              <h3 className="text-slate-800 dark:text-zinc-200 font-semibold text-lg mb-2">Coming Soon</h3>
              <p className="text-slate-600 dark:text-zinc-500 text-sm">Problems for <span className="text-slate-900 dark:text-white font-medium">{topic.title}</span> are being authored. Check back soon.</p>
            </div>
          ) : (
            <div className="divide-y divide-blue-100 dark:divide-white/[0.05]">
              {algorithms.map((problem, index) => {
                 return (
                  <Link
                    key={problem.id}
                    to={`/view/${problem.id}`}
                    className="group flex flex-col sm:grid sm:grid-cols-[2.5rem_1fr_auto] items-start sm:items-center px-4 sm:px-6 py-4 hover:bg-white dark:hover:bg-white/[0.025] transition-colors"
                  >
                    <span className="hidden sm:block shrink-0 w-8 text-[12px] text-slate-500 dark:text-zinc-600 font-mono">
                      {String(index + 1).padStart(2, '0')}
                    </span>
          
                    <div className="flex-1 min-w-0 pr-4 w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[15px] font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors leading-snug truncate">
                          {problem.title}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mt-1">
                        {problem.description}
                      </p>
                    </div>
          
                    <div className="shrink-0 flex items-center gap-2 mt-3 sm:mt-0 ml-auto">
                      <button
                        onClick={e => { 
                          e.preventDefault(); 
                          navigator.clipboard.writeText(window.location.origin + '/view/' + problem.id); 
                          toast.success('Link copied to clipboard!');
                        }}
                        className="p-2 rounded-lg text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
                        title="Share"
                      >
                        <Share2 size={15} />
                      </button>
                      <button
                        onClick={e => {
                          e.preventDefault();
                          const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                          toast.info(`Drag this link to your bookmarks bar, or open it and press ${isMac ? 'Cmd+D' : 'Ctrl+D'}!`);
                        }}
                        className="p-2 rounded-lg text-slate-500 dark:text-zinc-500 hover:text-amber-500 hover:bg-amber-100 dark:hover:text-amber-400 dark:hover:bg-amber-400/10 transition-all"
                        title="Bookmark"
                      >
                        <Bookmark size={15} />
                      </button>
                    </div>
                  </Link>
                 );
              })}
            </div>
          )}
        </motion.section>

      </main>

      <Footer />
    </div>
  );
}
