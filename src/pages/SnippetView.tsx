import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Clock, HardDrive, Copy, Check, 
  TerminalSquare, Hash, BookOpen, Cpu, Sparkles
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// --- PRISM CORE & LANGUAGES ---
import Prism from "prismjs";
// Dependency order matters: C must load before CPP
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-python"; 

import { fetchAlgorithms, type Algorithm } from "@/lib/algorithms";
import Navbar from "@/components/Navbar";
import GlobalRibbon from "@/components/GlobalRibbon";

// --- PREMIUM AMBIENT BACKGROUND ---
const AmbientBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-white dark:bg-[#020202] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)]" />
    
    {/* PREMIUM LIGHT BLUE / WHITE MESH GRADIENT */}
    <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-sky-200/40 rounded-full blur-[100px] dark:hidden mix-blend-multiply pointer-events-none" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-100/50 rounded-full blur-[120px] dark:hidden mix-blend-multiply pointer-events-none" />
    
    <div className="absolute top-[0%] right-[10%] w-[50vw] h-[50vh] bg-sky-500 rounded-full blur-[200px] mix-blend-screen opacity-0 dark:opacity-[0.1]" />
    <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vh] bg-indigo-600 rounded-full blur-[200px] mix-blend-screen opacity-0 dark:opacity-[0.1]" />
  </div>
);

// Reusable Glass Card Wrapper
const GlassCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, type: "spring", stiffness: 90 }}
    className={`relative rounded-[2rem] bg-white/60 dark:bg-white/[0.02] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] border-t-white dark:border-t-white/[0.2] border-l-white dark:border-l-white/[0.15] shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden group ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 dark:via-white/[0.03] to-white/80 dark:to-white/[0.08] pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-700 z-0" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const SnippetView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<"java" | "cpp" | "python">("java");
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  useEffect(() => {
    let mounted = true;
    fetchAlgorithms().then((algos) => {
      if (mounted) {
        setAlgorithm(algos.find((a) => String(a.id) === id) || null);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [id]);

  const getCurrentCode = () => {
    if (activeTab === "java") return algorithm?.codeJava;
    if (activeTab === "cpp") return algorithm?.codeCpp;
    if (activeTab === "python") return algorithm?.codePython;
    return "";
  };

  const currentCode = getCurrentCode();

  const handleCopy = async () => {
    if (currentCode) {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const highlightedCode = useMemo(() => {
    if (!currentCode) return "";
    
    let langConfig;
    if (activeTab === "java") langConfig = Prism.languages.java;
    else if (activeTab === "cpp") langConfig = Prism.languages.cpp;
    else if (activeTab === "python") langConfig = Prism.languages.python;

    if (!langConfig) return currentCode; 
    return Prism.highlight(currentCode, langConfig, activeTab);
  }, [currentCode, activeTab]);

  const ideStyles = `
    code[class*="language-"], pre[class*="language-"] {
      color: #e2e8f0;
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
      font-size: 14px;
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

    .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #64748b; font-style: italic; }
    .token.punctuation { color: #94a3b8; }
    .token.namespace { opacity: .7; }
    .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol, .token.deleted { color: #f472b6; }
    .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #34d399; }
    .token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string { color: #38bdf8; }
    .token.atrule, .token.attr-value, .token.keyword { color: #c084fc; font-weight: 500; }
    .token.function { color: #60a5fa; font-weight: 600; }
    .token.class-name { color: #fbbf24; font-weight: 600; }
    .token.regex, .token.important, .token.variable { color: #f59e0b; }

    .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 5px; border: 2px solid transparent; background-clip: padding-box; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.2); }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

    /* Glassy Markdown Styles */
    .markdown-body h3 { color: inherit; font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; letter-spacing: 0.025em; }
    .dark .markdown-body h3 { color: #f8fafc; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
    .markdown-body h3:first-child { margin-top: 0; }
    .markdown-body p { margin-bottom: 1.25rem; line-height: 1.7; color: inherit; }
    .dark .markdown-body p { color: #d4d4d8; }
    .markdown-body ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; color: inherit; }
    .dark .markdown-body ul { color: #d4d4d8; }
    .markdown-body li { margin-bottom: 0.5rem; line-height: 1.6; }
    .markdown-body li::marker { color: #38bdf8; }
    .markdown-body strong { color: inherit; font-weight: 600; }
    .dark .markdown-body strong { color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
    .markdown-body code { background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.1); color: #0284c7; padding: 0.2rem 0.5rem; border-radius: 0.5rem; font-family: monospace; font-size: 0.875em; }
    .dark .markdown-body code { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); color: #38bdf8; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5); }
  `;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020202]">
        <AmbientBackground />
        <div className="flex items-center gap-3 text-zinc-300 font-mono font-bold tracking-widest uppercase">
           <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
           Initializing Module...
        </div>
      </div>
    );
  }

  if (!algorithm) return null;

  return (
    <div className="min-h-screen text-black dark:text-zinc-100 font-sans relative selection:bg-sky-500/30 flex flex-col">
      <style>{ideStyles}</style>
      <AmbientBackground />
      
      <div className="fixed top-0 left-0 w-full z-[100] bg-white/60 dark:bg-black/20 backdrop-blur-2xl border-b border-slate-200 dark:border-white/[0.05] shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <GlobalRibbon />
        <Navbar />
      </div>

      <main className="relative flex-1 pt-40 pb-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-[1300px] mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <button 
              onClick={handleBack} 
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500 dark:bg-white/[0.03] border border-blue-600 dark:border-white/[0.1] border-t-blue-400 dark:border-t-white/[0.25] text-white dark:text-zinc-300 hover:text-white dark:hover:text-white hover:bg-blue-400 dark:hover:bg-white/[0.08] transition-all duration-300 text-sm font-bold shadow-md dark:shadow-lg backdrop-blur-xl hover:shadow-lg dark:hover:shadow-[0_8px_24px_rgba(255,255,255,0.05)] cursor-pointer"
            >
               <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
               <span>Back to Directory</span>
            </button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-10 items-start">
            
            {/* --- LEFT COLUMN: DETAILS & CODE TERMINAL --- */}
            <div className="flex flex-col gap-8 lg:gap-10 w-full">
              
              {/* DETAILS MARKDOWN SECTION */}
              {/* @ts-ignore */}
              {algorithm.details && (
                <GlassCard delay={0.1} className="p-6 sm:p-10">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/[0.08] shadow-[0_1px_0_rgba(0,0,0,0.3)]">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center shadow-inner">
                      <BookOpen className="w-5 h-5 text-sky-500 dark:text-sky-400 drop-shadow-md" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-black dark:text-white tracking-tight drop-shadow-sm">Deep Dive & Explanation</h2>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 font-mono uppercase tracking-widest">Documentation</p>
                    </div>
                  </div>
                  
                  <div className="markdown-body">
                     {/* @ts-ignore */}
                    <ReactMarkdown>{algorithm.details}</ReactMarkdown>
                  </div>
                </GlassCard>
              )}

              {/* CODE TERMINAL */}
              <GlassCard delay={0.2} className="flex flex-col overflow-hidden !p-0">
                 {/* Mac-like Header */}
                 <div className="flex items-center justify-between px-6 py-4 bg-slate-100/60 dark:bg-black/60 border-b border-slate-200 dark:border-white/[0.1] shadow-sm dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-xl relative z-20">
                     <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" />
                          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" />
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 bg-white/50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-inner">
                           <TerminalSquare className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                           <span className="text-xs font-mono font-bold tracking-wide">{algorithm.title.replace(/\s+/g, '_')}.{activeTab === 'python' ? 'py' : activeTab}</span>
                        </div>
                     </div>

                     <div className="flex items-center gap-4">
                        {/* Glassy Language Tabs */}
                        <div className="flex bg-slate-200/50 dark:bg-black/40 p-1 rounded-xl border border-slate-300 dark:border-white/[0.1] shadow-inner dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] backdrop-blur-md">
                           {(['java', 'cpp', 'python'] as const).map((lang) => (
                              <button
                                 key={lang}
                                 onClick={() => setActiveTab(lang)}
                                 className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${
                                     activeTab === lang 
                                        ? "bg-green-500 text-white shadow-sm border border-green-600" 
                                        : "text-slate-700 hover:text-black border border-transparent hover:bg-white/50"
                                 }`}
                              >
                                 {lang}
                              </button>
                           ))}
                        </div>
                        
                        {/* Copy Button */}
                        <button 
                            onClick={handleCopy} 
                            className={`p-2.5 rounded-xl transition-all duration-300 shadow-sm dark:shadow-lg border ${
                              copied 
                                ? 'bg-orange-500 dark:bg-emerald-500/20 text-white dark:text-emerald-400 border-orange-600 dark:border-emerald-400/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20'
                            }`}
                            title="Copy Code"
                        >
                           {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                     </div>
                 </div>

                 {/* Code Area */}
                 <div className="relative bg-[#050505]/80 w-full p-6 md:p-8 overflow-auto custom-scrollbar max-h-[60vh] shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)]">
                    {/* Subtle inner grid for terminal feel */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                    
                    <AnimatePresence mode="wait">
                       <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="relative z-10"
                       >
                          <pre className={`language-${activeTab}`}>
                             <code 
                                className={`language-${activeTab}`}
                                dangerouslySetInnerHTML={{ __html: highlightedCode }}
                             />
                          </pre>
                       </motion.div>
                    </AnimatePresence>
                 </div>
              </GlassCard>

            </div>

            {/* --- RIGHT: INFORMATION PANEL --- */}
            <div className="space-y-6 lg:sticky lg:top-36">
               
               {/* 1. Header Card */}
               <GlassCard delay={0.1} className="p-8 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 mb-6">
                     <span className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-sky-500/10 text-sky-300 border border-sky-400/30 border-t-sky-300/50 shadow-[inset_0_1px_4px_rgba(255,255,255,0.3)] flex items-center gap-1.5">
                        <Sparkles size={12} className="text-sky-400" />
                        {algorithm.category}
                     </span>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-black dark:from-white via-slate-800 dark:via-zinc-100 to-slate-500 dark:to-zinc-400 mb-4 leading-tight drop-shadow-md">
                      {algorithm.title}
                  </h1>
                  
                  <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed drop-shadow-sm font-medium">
                      {algorithm.description}
                  </p>
               </GlassCard>

                {/* 2. Complexity Card */}
                <div className="grid grid-cols-2 gap-4">
                  <GlassCard delay={0.2} className="!p-0 group hover:-translate-y-1 transition-all duration-500">
                    <div className="p-6 h-full flex flex-col justify-between bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-colors">
                       <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center">
                            <Clock size={16} className="text-sky-500 dark:text-sky-400" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest">Time</span>
                       </div>
                       <div className="text-xl font-mono font-extrabold text-slate-800 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors drop-shadow-md truncate">
                          {algorithm.timeComplexity}
                       </div>
                    </div>
                  </GlassCard>

                  <GlassCard delay={0.3} className="!p-0 group hover:-translate-y-1 transition-all duration-500">
                    <div className="p-6 h-full flex flex-col justify-between bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-colors">
                       <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center">
                            <HardDrive size={16} className="text-purple-500 dark:text-purple-400" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest">Space</span>
                       </div>
                       <div className="text-xl font-mono font-extrabold text-slate-800 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors drop-shadow-md truncate">
                          {algorithm.spaceComplexity}
                       </div>
                    </div>
                  </GlassCard>
                </div>

                 {/* 3. Topic Tags Card */}
                 {algorithm.tags && algorithm.tags.length > 0 && (
                   <GlassCard delay={0.4} className="p-6 sm:p-8">
                      <div className="flex items-center gap-2 mb-5">
                        <Cpu size={16} className="text-slate-400 dark:text-zinc-500" />
                        <h3 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest drop-shadow-sm">
                          Topics & Tags
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-2.5">
                         {algorithm.tags.map((tag) => (
                            <Link 
                               key={tag} 
                               to={`/`}
                               className="px-3.5 py-2 bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-white/[0.1] border-t-white dark:border-t-white/[0.2] hover:border-sky-300 dark:hover:border-sky-400/50 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-all rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-sky-600 dark:hover:text-sky-300 flex items-center gap-1.5 shadow-sm dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] group/tag"
                            >
                               <Hash size={14} className="opacity-50 group-hover/tag:text-sky-500 dark:group-hover/tag:text-sky-400 group-hover/tag:opacity-100 transition-colors" />
                               {tag}
                            </Link>
                         ))}
                      </div>
                   </GlassCard>
                 )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SnippetView;