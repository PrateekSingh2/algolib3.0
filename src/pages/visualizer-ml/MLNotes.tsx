import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';

// Import Prism components
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

// Icons
import {
  ArrowLeft,
  BookOpen,
  Code,
  Copy,
  Check,
  Search,
  Menu,
  X,
  ChevronRight,
  BrainCircuit,
  BookOpenCheck,
  Terminal,
  FileCode,
  Info,
  Layers,
  Cpu
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import AppFooter from '@/components/AppFooter';
import { setTrackedActivity } from '@/hooks/useActivityTracker';

// Raw note imports

import note00Raw from '../notes/ml notes/00_Getting_Started.tsx?raw';
import note01Raw from '../notes/ml notes/01_NumPy.tsx?raw';
import note02Raw from '../notes/ml notes/02_Pandas.tsx?raw';
import note03Raw from '../notes/ml notes/03_Matplotlib.tsx?raw';
import note04Raw from '../notes/ml notes/04_Introduction_to_ML.tsx?raw';
import note05Raw from '../notes/ml notes/05_Data_Preprocessing.tsx?raw';
import note06Raw from '../notes/ml notes/06_Supervised_Learning_Algorithms.tsx?raw';
import note07Raw from '../notes/ml notes/07_Model_Evaluation_Metrics.tsx?raw';
import note08Raw from '../notes/ml notes/08_Unsupervised_Learning.tsx?raw';
import note09Raw from '../notes/ml notes/09_Neural_Networks_Deep_Learning.tsx?raw';
import note10Raw from '../notes/ml notes/10_CNN_Computer_Vision.tsx?raw';
import note11Raw from '../notes/ml notes/11_RNN_NLP_Transformers.tsx?raw';
import note12Raw from '../notes/ml notes/12_Reinforcement_Learning.tsx?raw';
import note13Raw from '../notes/ml notes/13_Generative_Models_LLMs.tsx?raw';
import note14Raw from '../notes/ml notes/14_MLOps_Deployment.tsx?raw';
import note15Raw from '../notes/ml notes/15_Statistics_Math_Foundations.tsx?raw';
import note16Raw from '../notes/ml notes/16_Quick_Reference_Index.tsx?raw';

// Note definitions
const NOTES_LIST = [
  { id: '00', title: 'Getting Started with ML', content: note00Raw, color: 'emerald' },
  { id: '01', title: 'NumPy for ML', content: note01Raw, color: 'emerald' },
  { id: '02', title: 'Pandas for ML', content: note02Raw, color: 'emerald' },
  { id: '03', title: 'Matplotlib for ML', content: note03Raw, color: 'emerald' },
  { id: '04', title: 'Introduction to ML', content: note04Raw, color: 'emerald' },
  { id: '05', title: 'Data Preprocessing', content: note05Raw, color: 'teal' },
  { id: '06', title: 'Supervised Learning', content: note06Raw, color: 'blue' },
  { id: '07', title: 'Model Evaluation', content: note07Raw, color: 'indigo' },
  { id: '08', title: 'Unsupervised Learning', content: note08Raw, color: 'emerald' },
  { id: '09', title: 'Deep Learning Basics', content: note09Raw, color: 'teal' },
  { id: '010', title: 'CNN & Computer Vision', content: note10Raw, color: 'blue' },
  { id: '11', title: 'RNN & NLP Transformers', content: note11Raw, color: 'indigo' },
  { id: '12', title: 'Reinforcement Learning', content: note12Raw, color: 'emerald' },
  { id: '13', title: 'Generative Models & LLMs', content: note13Raw, color: 'teal' },
  { id: '14', title: 'MLOps & Deployment', content: note14Raw, color: 'blue' },
  { id: '15', title: 'Statistics & Math', content: note15Raw, color: 'indigo' },
  { id: '16', title: 'Quick Reference Index', content: note16Raw, color: 'emerald' }
];

interface NoteBlock {
  type: 'header' | 'subheader' | 'comment' | 'code';
  content: string;
}

// Clean comment block formatting (removes leading stars, spacing)
function cleanComment(comment: string): string {
  return comment
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim();
}

// Parse raw note text into structured blocks sequentially
function parseNoteBlocks(raw: string): NoteBlock[] {
  const normalized = raw.replace(/\r\n/g, '\n');
  const blocks: { start: number; end: number; block: NoteBlock }[] = [];

  // 1. Match main headers
  const mainHeaderRegex = /\/\/\s*═{10,}\n\/\/\s*([^\n]+)\n\/\/\s*═{10,}/g;
  let match;
  while ((match = mainHeaderRegex.exec(normalized)) !== null) {
    blocks.push({
      start: match.index,
      end: mainHeaderRegex.lastIndex,
      block: { type: 'header', content: match[1].trim() }
    });
  }

  // 2. Match subheaders
  const subHeaderRegex = /\/\/\s*─{10,}\n\/\/\s*([^\n]+)\n\/\/\s*─{10,}/g;
  while ((match = subHeaderRegex.exec(normalized)) !== null) {
    blocks.push({
      start: match.index,
      end: subHeaderRegex.lastIndex,
      block: { type: 'subheader', content: match[1].trim() }
    });
  }

  // 3. Match block comments
  const commentRegex = /\/\*\*([\s\S]*?)\*\//g;
  while ((match = commentRegex.exec(normalized)) !== null) {
    blocks.push({
      start: match.index,
      end: commentRegex.lastIndex,
      block: { type: 'comment', content: match[1].trim() }
    });
  }

  // 4. Match code strings
  const codeRegex = /const\s+\w+\s*=\s*`([\s\S]*?)`;/g;
  while ((match = codeRegex.exec(normalized)) !== null) {
    blocks.push({
      start: match.index,
      end: codeRegex.lastIndex,
      block: { type: 'code', content: match[1].trim() }
    });
  }

  // Sort sequentially based on start index
  blocks.sort((a, b) => a.start - b.start);

  return blocks.map(b => b.block);
}

// Prism stylesheet classes matching AlgoLib's design (Light theme adaptive)
const ideStyles = `
  :root {
    --code-bg: #f8fafc;
    --code-color: #334155;
    --code-comment: #64748b;
    --code-punctuation: #94a3b8;
    --code-property: #c2410c;
    --code-selector: #0d9488;
    --code-operator: #0284c7;
    --code-keyword: #7c3aed;
    --code-function: #2563eb;
    --code-class: #b45309;
    --code-scrollbar-thumb: rgba(0, 0, 0, 0.12);
  }
  .dark {
    --code-bg: #050508;
    --code-color: #e2e8f0;
    --code-comment: #64748b;
    --code-punctuation: #94a3b8;
    --code-property: #f472b6;
    --code-selector: #10b981;
    --code-operator: #38bdf8;
    --code-keyword: #a855f7;
    --code-function: #3b82f6;
    --code-class: #fbbf24;
    --code-scrollbar-thumb: rgba(255, 255, 255, 0.12);
  }

  code[class*="language-"], pre[class*="language-"] {
    color: var(--code-color);
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
    font-size: 13px;
    line-height: 1.7;
    direction: ltr;
    text-align: left;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    tab-size: 4;
    hyphens: none;
    background: transparent !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  @media (min-width: 640px) {
    code[class*="language-"], pre[class*="language-"] { font-size: 14px; }
  }

  .token.comment, .token.prolog, .token.doctype, .token.cdata { color: var(--code-comment); font-style: italic; }
  .token.punctuation { color: var(--code-punctuation); }
  .token.namespace { opacity: .7; }
  .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol, .token.deleted { color: var(--code-property); }
  .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: var(--code-selector); }
  .token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string { color: var(--code-operator); }
  .token.atrule, .token.attr-value, .token.keyword { color: var(--code-keyword); font-weight: 500; }
  .token.function { color: var(--code-function); font-weight: 600; }
  .token.class-name { color: var(--code-class); font-weight: 600; }
  .token.regex, .token.important, .token.variable { color: var(--code-class); }

  .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--code-scrollbar-thumb); border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.35); }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

  /* Markdown custom styles for Glass pane */
  .ml-prose h3 { font-size: 1rem; font-weight: 700; margin-top: 1.1rem; margin-bottom: 0.45rem; color: #10b981; }
  @media (min-width: 640px) { .ml-prose h3 { font-size: 1.15rem; margin-top: 1.25rem; } }
  .dark .ml-prose h3 { color: #34d399; }
  .ml-prose p { margin-bottom: 0.85rem; line-height: 1.65; font-size: 0.875rem; }
  @media (min-width: 640px) { .ml-prose p { font-size: 0.9rem; margin-bottom: 1rem; } }
  .ml-prose ul { list-style-type: disc; padding-left: 1.1rem; margin-bottom: 0.85rem; }
  @media (min-width: 640px) { .ml-prose ul { padding-left: 1.25rem; margin-bottom: 1rem; } }
  .ml-prose li { margin-bottom: 0.35rem; line-height: 1.55; font-size: 0.875rem; }
  .ml-prose li::marker { color: #10b981; }
  .ml-prose strong { font-weight: 600; color: #0f172a; }
  .dark .ml-prose strong { color: #ffffff; }
  .ml-prose code { background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.1); color: #0f766e; padding: 0.1rem 0.28rem; border-radius: 0.35rem; font-family: monospace; font-size: 0.82em; word-break: break-word; }
  .dark .ml-prose code { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #34d399; }
  .ml-prose blockquote { border-left: 3px solid #10b981; padding: 0.5rem 0.85rem; margin: 0.75rem 0; background: rgba(16,185,129,0.05); border-radius: 0 0.5rem 0.5rem 0; }
  .dark .ml-prose blockquote { background: rgba(16,185,129,0.07); }
  .ml-prose blockquote p { margin-bottom: 0; font-size: 0.85rem; }

  /* Table — scrollable on mobile */
  .ml-prose .table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 1rem 0 1.25rem 0; border-radius: 0.5rem; border: 1px solid rgba(0,0,0,0.08); }
  .dark .ml-prose .table-wrap { border: 1px solid rgba(255,255,255,0.07); }
  .ml-prose table { width: 100%; min-width: 420px; border-collapse: collapse; font-size: 0.78rem; border-radius: 0.5rem; overflow: hidden; margin: 0; border: none; }
  @media (min-width: 640px) { .ml-prose table { font-size: 0.85rem; } }
  .ml-prose thead tr { background: rgba(16, 185, 129, 0.15); border-bottom: 2px solid rgba(16, 185, 129, 0.4); }
  .dark .ml-prose thead tr { background: rgba(16, 185, 129, 0.1); border-bottom: 2px solid rgba(16, 185, 129, 0.3); }
  .ml-prose th { padding: 0.45rem 0.65rem; text-align: left; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: #065f46; white-space: nowrap; }
  @media (min-width: 640px) { .ml-prose th { padding: 0.6rem 0.85rem; font-size: 0.78rem; } }
  .dark .ml-prose th { color: #6ee7b7; }
  .ml-prose td { padding: 0.45rem 0.65rem; border-bottom: 1px solid rgba(0,0,0,0.07); color: #334155; vertical-align: top; }
  @media (min-width: 640px) { .ml-prose td { padding: 0.55rem 0.85rem; } }
  .dark .ml-prose td { border-bottom: 1px solid rgba(255,255,255,0.06); color: #cbd5e1; }
  .ml-prose tbody tr:nth-child(even) { background: rgba(0,0,0,0.02); }
  .dark .ml-prose tbody tr:nth-child(even) { background: rgba(255,255,255,0.03); }
  .ml-prose tbody tr:hover { background: rgba(16, 185, 129, 0.05); }
  .dark .ml-prose tbody tr:hover { background: rgba(16, 185, 129, 0.07); }
  .ml-prose tbody tr:last-child td { border-bottom: none; }
`;


const MLNotes = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  // Find index based on route parameter
  const activeNoteIdx = useMemo(() => {
    const idx = NOTES_LIST.findIndex(n => n.id === topicId);
    return idx !== -1 ? idx : 0;
  }, [topicId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedEntire, setCopiedEntire] = useState(false);
  const [copiedBlockIdx, setCopiedBlockIdx] = useState<number | null>(null);

  const activeNote = NOTES_LIST[activeNoteIdx];

  useEffect(() => {
    setTrackedActivity(`ml_notes_${activeNote.id}`);
  }, [activeNote]);

  // Sync scroll to top when active note changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeNoteIdx]);

  // Parse blocks from note content
  const noteBlocks = useMemo(() => {
    return parseNoteBlocks(activeNote.content);
  }, [activeNote]);

  // Clean comment body and check if diagram
  const processedBlocks = useMemo(() => {
    return noteBlocks.map((block) => {
      if (block.type === 'comment') {
        const cleaned = cleanComment(block.content);
        const isDiagram = cleaned.includes('┌') || cleaned.includes('─') || cleaned.includes('│') || cleaned.includes('╔');
        return { ...block, cleaned, isDiagram };
      }
      return block;
    });
  }, [noteBlocks]);

  // Highlight all code blocks after active note changes
  useEffect(() => {
    Prism.highlightAll();
  }, [activeNoteIdx, searchQuery]);

  // Copy entire note TSX code
  const handleCopyEntire = async () => {
    await navigator.clipboard.writeText(activeNote.content);
    setCopiedEntire(true);
    setTimeout(() => setCopiedEntire(false), 2000);
  };

  // Copy individual code blocks
  const handleCopyBlock = async (text: string, blockIdx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedBlockIdx(blockIdx);
    setTimeout(() => setCopiedBlockIdx(null), 2000);
  };

  // Filter sections by search query
  const filteredBlocks = useMemo(() => {
    if (!searchQuery) return processedBlocks;
    const q = searchQuery.toLowerCase();
    return processedBlocks.filter(block => {
      if (block.type === 'comment') {
        return (block as any).cleaned.toLowerCase().includes(q);
      }
      return block.content.toLowerCase().includes(q);
    });
  }, [processedBlocks, searchQuery]);

  const handleSelectNote = (idx: number) => {
    navigate(`/notes/ml/${NOTES_LIST[idx].id}`);
    setSidebarOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>AlgoLib AI/ML Notes | {activeNote.title}</title>
      </Helmet>

      <style>{ideStyles}</style>

      {/* Retro Sci-Fi Space Background - Enhanced Light/Dark modes */}
      <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-350">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/40 dark:from-emerald-900/10 via-slate-50 dark:via-slate-900 to-slate-100/30 dark:to-slate-950" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />
      </div>

      <Navbar />

      <main className="min-h-screen pt-[88px] pb-16 px-4 md:px-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 relative">

        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 z-[101] w-[280px] bg-white dark:bg-[#07070f] border-r border-slate-200 dark:border-white/5 p-6 flex flex-col lg:hidden"
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    <BrainCircuit size={18} className="text-emerald-500" /> AI/ML Curriculum
                  </span>
                  <button onClick={() => setSidebarOpen(false)} className="text-slate-400 dark:text-zinc-500 p-1">
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                  <SidebarContent
                    activeNoteIdx={activeNoteIdx}
                    onSelect={handleSelectNote}
                  />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 h-[calc(100vh-130px)] sticky top-[88px] self-start bg-white/60 dark:bg-zinc-950/20 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-5 flex flex-col shadow-xl overflow-hidden">
          <div className="pb-4 border-b border-slate-200 dark:border-white/5 mb-4">
            <Link to="/notes" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all mb-4">
              <ArrowLeft size={12} /> Back to Notes Hub
            </Link>
            <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 tracking-tight">
              <BrainCircuit className="text-emerald-500" size={20} /> ML Curriculum
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-widest font-bold mt-1">Study Guide Series</p>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[calc(100vh-280px)]">
            <SidebarContent
              activeNoteIdx={activeNoteIdx}
              onSelect={handleSelectNote}
            />
          </div>
        </aside>

        {/* Right Main Area */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">

          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/60 dark:bg-zinc-950/20 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Mobile Hamburger Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-700 dark:text-zinc-300 transition-all shrink-0"
                title="Open Curriculum Index"
              >
                <Menu size={20} />
              </button>

              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <BookOpenCheck size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {activeNote.title}
                </h1>
                <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
                  Module {activeNote.id}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              {/* Search Bar */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search in module..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 hover:bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Copy entire code button */}
              <button
                onClick={handleCopyEntire}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all flex items-center justify-center shrink-0"
                title="Copy entire code file"
              >
                {copiedEntire ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Core Notebook Content Viewer */}
          <div className="flex-1 space-y-6">
            {filteredBlocks.length > 0 ? (
              filteredBlocks.map((block, idx) => {
                if (block.type === 'header') {
                  return (
                    <div key={idx} className="relative py-4 border-b border-emerald-500/20 mt-10 first:mt-2">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-1.5 h-6 rounded-full bg-emerald-500" />
                        {block.content}
                      </h2>
                    </div>
                  );
                }

                if (block.type === 'subheader') {
                  return (
                    <div key={idx} className="mt-8 mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-emerald-400/90 flex items-center gap-2">
                        <ChevronRight size={16} className="text-emerald-500 shrink-0" />
                        {block.content}
                      </h3>
                    </div>
                  );
                }

                if (block.type === 'comment') {
                  const data = block as any;
                  if (data.isDiagram) {
                    return (
                      <pre key={idx} className="font-mono bg-slate-900/90 dark:bg-zinc-950/80 p-3 sm:p-5 border border-slate-200 dark:border-zinc-800/80 text-emerald-500 dark:text-[#00ff88] rounded-2xl overflow-x-auto shadow-inner text-[10px] sm:text-xs my-4 max-w-full custom-scrollbar leading-snug">
                        {data.cleaned}
                      </pre>
                    );
                  }

                  return (
                    <div key={idx} className="bg-white/80 dark:bg-zinc-900/30 backdrop-blur-lg border border-slate-200/60 dark:border-white/5 rounded-2xl p-3.5 sm:p-5 shadow-sm ml-prose text-slate-700 dark:text-zinc-300 leading-relaxed max-w-full overflow-hidden">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({node, ...props}) => (
                            <div className="table-wrap">
                              <table {...props} />
                            </div>
                          )
                        }}
                      >{data.cleaned}</ReactMarkdown>
                    </div>
                  );
                }

                if (block.type === 'code') {
                  return (
                    <div key={idx} className="relative group rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-md my-4 sm:my-6 bg-slate-50 dark:bg-slate-950/40">
                      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-100/85 dark:bg-[#090912]/80 border-b border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <Terminal size={13} className="text-emerald-500 shrink-0" />
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 truncate">Python Implementation</span>
                        </div>
                        <button
                          onClick={() => handleCopyBlock(block.content, idx)}
                          className="text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 p-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg transition-colors shrink-0 ml-2"
                          title="Copy Code"
                        >
                          {copiedBlockIdx === idx ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <div className="p-3 sm:p-5 overflow-x-auto max-h-[420px] sm:max-h-[500px] custom-scrollbar bg-[var(--code-bg)]">
                        <pre className="language-python" style={{fontSize: 'clamp(11px, 2.5vw, 13px)'}}>
                          <code className="language-python">{block.content}</code>
                        </pre>
                      </div>
                    </div>
                  );
                }

                return null;
              })
            ) : (
              <div className="py-24 text-center border border-dashed border-slate-200 dark:border-white/5 rounded-3xl bg-white/20 dark:bg-zinc-950/10">
                <Search size={36} className="mx-auto text-slate-400 dark:text-zinc-600 mb-3" />
                <p className="text-slate-500 dark:text-zinc-400 font-mono text-sm">
                  No matching blocks found for "{searchQuery}"
                </p>
              </div>
            )}
          </div>

          {/* Mobile Prev / Next navigation */}
          <div className="flex items-center justify-between gap-3 mt-4 lg:hidden">
            <button
              onClick={() => activeNoteIdx > 0 && handleSelectNote(activeNoteIdx - 1)}
              disabled={activeNoteIdx === 0}
              className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/60 dark:bg-zinc-950/20 text-slate-700 dark:text-zinc-300 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              <ChevronRight size={14} className="rotate-180 shrink-0 text-emerald-500" />
              <span className="truncate">{activeNoteIdx > 0 ? NOTES_LIST[activeNoteIdx - 1].title : 'Start'}</span>
            </button>
            <button
              onClick={() => activeNoteIdx < NOTES_LIST.length - 1 && handleSelectNote(activeNoteIdx + 1)}
              disabled={activeNoteIdx === NOTES_LIST.length - 1}
              className="flex-1 flex items-center justify-end gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/60 dark:bg-zinc-950/20 text-slate-700 dark:text-zinc-300 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              <span className="truncate">{activeNoteIdx < NOTES_LIST.length - 1 ? NOTES_LIST[activeNoteIdx + 1].title : 'End'}</span>
              <ChevronRight size={14} className="shrink-0 text-emerald-500" />
            </button>
          </div>
        </div>
      </main>

      <AppFooter />
    </>
  );
};

// Sidebar note list content
const SidebarContent = ({
  activeNoteIdx,
  onSelect
}: {
  activeNoteIdx: number;
  onSelect: (idx: number) => void;
}) => {
  return (
    <nav className="space-y-2 mt-4">
      {NOTES_LIST.map((note, idx) => {
        const isActive = activeNoteIdx === idx;
        return (
          <button
            key={note.id}
            onClick={() => onSelect(idx)}
            className={`w-full group flex items-start gap-3.5 px-4 py-3 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden ${isActive
              ? 'bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5 border-transparent'
              }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeNotesGlow"
                className="absolute inset-0 bg-emerald-500/5 pointer-events-none"
              />
            )}

            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 border transition-all duration-300 ${isActive
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
              : 'bg-slate-100/70 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-zinc-500 group-hover:bg-slate-200 dark:group-hover:bg-white/10 group-hover:text-slate-700 dark:group-hover:text-zinc-300'
              }`}>
              {note.id}
            </div>

            <div className="min-w-0 flex-1">
              <span className={`block text-xs font-bold truncate transition-colors duration-200 ${isActive ? 'text-emerald-600 dark:text-emerald-405' : 'text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white'
                }`}>
                {note.title}
              </span>
              <span className="block text-[9px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono mt-0.5">
                Module {note.id}
              </span>
            </div>

            <div className={`self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-400 dark:text-zinc-500 ${isActive ? 'text-emerald-500 dark:text-emerald-400 opacity-100' : ''
              }`}>
              <ChevronRight size={14} className="transform group-hover:translate-x-0.5 transition-transform duration-200" />
            </div>
          </button>
        );
      })}
    </nav>
  );
};

export default MLNotes;
