import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronRight, Hash, Menu, X, CheckCircle2,
  AlertTriangle, Info, ExternalLink, ArrowUpRight, Copy, Check
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import GlobalRibbon from '@/components/GlobalRibbon';
import { docData, getSectionsByCategory, searchDocs } from '@/data/docsData';
import {
  CommandDialog, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";

// ─── BACKGROUND ───────────────────────────────────────────────────────────────
const AmbientBg = () => (
  <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-[#09090b] pointer-events-none overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000004_1px,transparent_1px),linear-gradient(to_bottom,#00000004_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px]" />
    <div className="absolute -top-32 right-0 w-[60vw] h-[50vh] rounded-full bg-indigo-600/[0.04] dark:bg-indigo-600/[0.07] blur-[120px]" />
    <div className="absolute bottom-0 -left-32 w-[50vw] h-[40vh] rounded-full bg-emerald-600/[0.04] dark:bg-emerald-600/[0.07] blur-[100px]" />
  </div>
);

// ─── CALLOUT BLOCKS ───────────────────────────────────────────────────────────
const NoteBlock = ({ text }: { text: string }) => (
  <div className="flex gap-3 p-4 mt-5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 rounded-xl">
    <Info className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
    <p className="text-sm text-indigo-800 dark:text-indigo-200/80 leading-relaxed">{text}</p>
  </div>
);

const WarnBlock = ({ text }: { text: string }) => (
  <div className="flex gap-3 p-4 mt-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-xl">
    <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
    <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">{text}</p>
  </div>
);

// ─── BREADCRUMB ───────────────────────────────────────────────────────────────
const Breadcrumb = ({ category, title }: { category: string; title: string }) => (
  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-500 font-medium mb-6">
    <span className="text-indigo-600 dark:text-indigo-400">{category}</span>
    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-700" />
    <span className="text-slate-700 dark:text-zinc-300">{title}</span>
  </div>
);

// ─── SEARCH TRIGGER BUTTON ────────────────────────────────────────────────────
const SearchTrigger = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group w-full flex items-center justify-between gap-3 px-3 py-2.5 mb-8 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm dark:shadow-none"
  >
    <div className="flex items-center gap-2">
      <Search className="w-4 h-4" />
      <span>Quick search...</span>
    </div>
    <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-1.5 font-mono text-[10px] text-slate-500 dark:text-zinc-600 gap-1">
      <span className="text-xs">⌘</span>K
    </kbd>
  </button>
);

// ─── LEFT SIDEBAR NAV ─────────────────────────────────────────────────────────
const SidebarNav = ({
  categories, activeId, onSelect
}: {
  categories: Record<string, any[]>;
  activeId: string;
  onSelect: (id: string) => void;
}) => (
  <nav className="space-y-7">
    {Object.entries(categories).map(([category, sections]) => (
      <div key={category}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 mb-2 px-3">
          {category}
        </p>
        <ul className="space-y-0.5">
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = activeId === section.id;
            return (
              <li key={section.id}>
                <button
                  onClick={() => onSelect(section.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-500/20'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-zinc-600'}`} />
                  <span className="truncate">{section.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </nav>
);

// ─── RIGHT TOC ────────────────────────────────────────────────────────────────
const TableOfContents = ({
  section, activeHeading
}: {
  section: any;
  activeHeading: string;
}) => (
  <div className="pl-6 border-l border-slate-200 dark:border-zinc-800/60 py-1">
    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-300 mb-3">On this page</p>
    <ul className="space-y-2">
      {section.content.map((_: any, i: number) => {
        const block = section.content[i];
        const hId = `${section.id}-h-${i}`;
        const isActive = activeHeading === hId;
        return (
          <li key={i}>
            <a
              href={`#${hId}`}
              className={`text-sm block leading-snug transition-colors ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-500 dark:text-zinc-600 hover:text-slate-800 dark:hover:text-zinc-300'
              }`}
            >
              {block.heading}
            </a>
          </li>
        );
      })}
    </ul>
  </div>
);

// ─── MAIN DOCS PAGE ───────────────────────────────────────────────────────────
export default function Docs() {
  const [activeSection, setActiveSection] = useState(docData[0].id);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => getSectionsByCategory(), []);
  const current = useMemo(() => docData.find(s => s.id === activeSection) || docData[0], [activeSection]);
  const searchResults = useMemo(() => searchDocs(searchQuery), [searchQuery]);

  // Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // IntersectionObserver for TOC
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveHeading(e.target.id); });
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );
    document.querySelectorAll('h2[id]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [current]);

  const navigate = useCallback((id: string, headingId?: string) => {
    setSearchOpen(false);
    setMobileOpen(false);
    setActiveSection(id);
    setTimeout(() => {
      if (headingId) {
        const el = document.getElementById(headingId);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 120);
  }, []);

  return (
    <div className="min-h-screen text-slate-800 dark:text-zinc-100 antialiased">
      <AmbientBg />
      <Navbar />
      <GlobalRibbon />

      {/* COMMAND PALETTE */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput
          placeholder="Search documentation..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {searchQuery.trim() ? (
            <CommandGroup heading="Results">
              {searchResults.map((r, i) => (
                <CommandItem
                  key={i}
                  onSelect={() => navigate(r.section.id, r.headingId === r.section.id ? undefined : r.headingId)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <r.section.icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-sm">{r.heading}</span>
                      {r.heading !== r.section.title && (
                        <span className="text-xs text-slate-500 dark:text-zinc-500">{r.section.title}</span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            Object.entries(categories).map(([cat, sections]) => (
              <CommandGroup key={cat} heading={cat}>
                {sections.map(section => (
                  <React.Fragment key={section.id}>
                    <CommandItem onSelect={() => navigate(section.id)}>
                      <section.icon className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                      {section.title}
                    </CommandItem>
                    {section.content.map((block: any, i: number) => (
                      <CommandItem
                        key={i}
                        onSelect={() => navigate(section.id, `${section.id}-h-${i}`)}
                        className="pl-8 text-slate-600 dark:text-zinc-400"
                      >
                        <Hash className="w-3 h-3 mr-2 text-slate-400 dark:text-zinc-600" />
                        <span className="text-sm">{block.heading}</span>
                      </CommandItem>
                    ))}
                  </React.Fragment>
                ))}
              </CommandGroup>
            ))
          )}
        </CommandList>
      </CommandDialog>

      {/* MOBILE FAB */}
      <div className="lg:hidden fixed bottom-6 right-5 z-50">
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-72 h-full bg-slate-50 dark:bg-[#111113] border-r border-slate-200 dark:border-zinc-800 p-5 overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <SearchTrigger onClick={() => { setMobileOpen(false); setSearchOpen(true); }} />
              <SidebarNav categories={categories} activeId={activeSection} onSelect={id => navigate(id)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAGE LAYOUT */}
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24 flex gap-0">

        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-60 xl:w-64 shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-4 border-r border-slate-200 dark:border-zinc-800/40 mr-8">
          <SearchTrigger onClick={() => setSearchOpen(true)} />
          <SidebarNav categories={categories} activeId={activeSection} onSelect={id => navigate(id)} />
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0 flex gap-10 xl:gap-14">
          <div className="flex-1 min-w-0 py-2">
            <AnimatePresence mode="wait">
              <motion.article
                key={activeSection}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="max-w-2xl xl:max-w-3xl"
              >
                <Breadcrumb category={current.category} title={current.title} />

                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight mb-4">
                  {current.title}
                </h1>
                <p className="text-lg text-slate-600 dark:text-zinc-400 leading-relaxed mb-12 border-b border-slate-200 dark:border-zinc-800/50 pb-8">
                  {current.description}
                </p>

                <div className="space-y-14">
                  {current.content.map((block: any, i: number) => {
                    const hId = `${current.id}-h-${i}`;
                    return (
                      <section key={i} id={hId} className="scroll-mt-28">
                        <h2 className="group flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-800 dark:text-zinc-100 mb-4">
                          <a href={`#${hId}`} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500">
                            <Hash className="w-5 h-5" />
                          </a>
                          {block.heading}
                        </h2>

                        <div className="space-y-3">
                          {block.text.map((para: string, j: number) => (
                            <p key={j} className="text-slate-600 dark:text-zinc-300 leading-7 text-[15px]">{para}</p>
                          ))}
                        </div>

                        {block.note && <NoteBlock text={block.note} />}
                        {block.warning && <WarnBlock text={block.warning} />}
                      </section>
                    );
                  })}
                </div>

                {/* PAGE FOOTER NAV */}
                <div className="mt-16 pt-8 border-t border-slate-200 dark:border-zinc-800/50 flex justify-between text-sm">
                  {(() => {
                    const idx = docData.findIndex(s => s.id === activeSection);
                    const prev = docData[idx - 1];
                    const next = docData[idx + 1];
                    return (
                      <>
                        {prev ? (
                          <button
                            onClick={() => navigate(prev.id)}
                            className="flex flex-col items-start gap-1 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                          >
                            <span className="text-xs text-slate-400 dark:text-zinc-600 group-hover:text-slate-500 dark:group-hover:text-zinc-400">← Previous</span>
                            <span className="font-medium text-slate-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{prev.title}</span>
                          </button>
                        ) : <div />}
                        {next ? (
                          <button
                            onClick={() => navigate(next.id)}
                            className="flex flex-col items-end gap-1 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                          >
                            <span className="text-xs text-slate-400 dark:text-zinc-600 group-hover:text-slate-500 dark:group-hover:text-zinc-400">Next →</span>
                            <span className="font-medium text-slate-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{next.title}</span>
                          </button>
                        ) : <div />}
                      </>
                    );
                  })()}
                </div>
              </motion.article>
            </AnimatePresence>
          </div>

          {/* RIGHT TOC */}
          <aside className="hidden xl:block w-52 shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto py-2">
            <TableOfContents section={current} activeHeading={activeHeading} />
          </aside>
        </main>
      </div>
    </div>
  );
}