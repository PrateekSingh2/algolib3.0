import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Clock, HardDrive, Copy, Check, 
  TerminalSquare, Hash, BookOpen
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

// --- AMBIENT BACKGROUND ---
const AmbientBackground = () => (
  <div className="fixed inset-0 z-0 bg-[#09090B] pointer-events-none overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
    <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[150px]" />
    <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[120px]" />
  </div>
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
    .token.atrule, .token.attr-value, .token.keyword { color: #c084fc; }
    .token.function { color: #60a5fa; font-weight: 500; }
    .token.class-name { color: #fbbf24; font-weight: 500; }
    .token.regex, .token.important, .token.variable { color: #f59e0b; }

    .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

    .markdown-body h3 { color: #f8fafc; font-size: 1.125rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; letter-spacing: 0.025em; }
    .markdown-body h3:first-child { margin-top: 0; }
    .markdown-body p { margin-bottom: 1.25rem; line-height: 1.7; color: #a1a1aa; }
    .markdown-body ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; color: #a1a1aa; }
    .markdown-body li { margin-bottom: 0.5rem; line-height: 1.6; }
    .markdown-body li::marker { color: #52525b; }
    .markdown-body strong { color: #e4e4e7; font-weight: 600; }
    .markdown-body code { background-color: #27272a; color: #38bdf8; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875em; }
  `;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B]">
        <AmbientBackground />
        <div className="flex items-center gap-3 text-zinc-400 font-mono">
           <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
           Loading Data...
        </div>
      </div>
    );
  }

  if (!algorithm) return null;

  return (
    <div className="min-h-screen text-zinc-100 font-sans relative selection:bg-blue-500/30">
      <style>{ideStyles}</style>
      <AmbientBackground />
      <Navbar />
      <GlobalRibbon />

      <main className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1300px] mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <button 
              onClick={handleBack} 
              className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 outline-none"
            >
               <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
            
            {/* --- LEFT COLUMN: DETAILS & CODE TERMINAL --- */}
            <div className="flex flex-col gap-8 w-full">
              
              {/* DETAILS MARKDOWN SECTION */}
              {/* @ts-ignore */}
              {algorithm.details && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                  className="w-full bg-[#121214] border border-zinc-800 rounded-2xl shadow-xl p-6 sm:p-8"
                >
                  <div className="flex items-center gap-2 mb-6 border-b border-zinc-800/50 pb-4">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-zinc-100">Deep Dive & Explanation</h2>
                  </div>
                  
                  <div className="markdown-body">
                     {/* @ts-ignore */}
                    <ReactMarkdown>{algorithm.details}</ReactMarkdown>
                  </div>
                </motion.div>
              )}

              {/* CODE TERMINAL */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
                className="w-full flex flex-col bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
              >
                 <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-[#0A0A0A]">
                     <div className="flex items-center gap-2 text-zinc-400">
                        <TerminalSquare className="w-4 h-4" />
                        <span className="text-xs font-mono lowercase">{algorithm.title.replace(/\s+/g, '_')}.{activeTab === 'python' ? 'py' : activeTab}</span>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                           {(['java', 'cpp', 'python'] as const).map((lang) => (
                              <button
                                 key={lang}
                                 onClick={() => setActiveTab(lang)}
                                 className={`px-4 py-1.5 text-xs font-semibold uppercase rounded-md transition-colors ${
                                    activeTab === lang 
                                        ? "bg-zinc-800 text-white shadow-sm" 
                                        : "text-zinc-500 hover:text-zinc-300"
                                 }`}
                              >
                                 {lang}
                              </button>
                           ))}
                        </div>
                        
                        <button 
                            onClick={handleCopy} 
                            className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-500/10 text-green-500 border border-green-500/50' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                            title="Copy Code"
                        >
                           {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                     </div>
                 </div>

                 <div className="relative bg-[#0A0A0A] w-full p-6 overflow-auto custom-scrollbar max-h-[70vh]">
                    <AnimatePresence mode="wait">
                       <motion.div
                          key={activeTab}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
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
              </motion.div>

            </div>

            {/* --- RIGHT: INFORMATION PANEL --- */}
            <div className="space-y-6 lg:sticky lg:top-32">
               
               {/* 1. Header Card */}
               <motion.div 
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} 
                 className="bg-[#121214] p-6 border border-zinc-800 rounded-2xl shadow-xl"
               >
                  <div className="flex items-center gap-2 mb-3">
                     <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {algorithm.category}
                     </span>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-white mb-4 leading-tight">
                      {algorithm.title}
                  </h1>
                  
                  <p className="text-zinc-400 text-sm leading-relaxed">
                      {algorithm.description}
                  </p>
               </motion.div>


               {/* 3. Complexity Card */}
               <motion.div 
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} 
                 className="grid grid-cols-2 gap-4"
                 >
                  <div className="bg-[#121214] border border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between group hover:border-zinc-600 transition-colors">
                     <div className="flex items-center gap-2 text-zinc-500 mb-3">
                        <Clock size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Time</span>
                     </div>
                     <div className="text-lg font-mono font-bold text-white group-hover:text-blue-400 transition-colors">
                        {algorithm.timeComplexity}
                     </div>
                  </div>

                  <div className="bg-[#121214] border border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between group hover:border-zinc-600 transition-colors">
                     <div className="flex items-center gap-2 text-zinc-500 mb-3">
                        <HardDrive size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Space</span>
                     </div>
                     <div className="text-lg font-mono font-bold text-white group-hover:text-purple-400 transition-colors">
                        {algorithm.spaceComplexity}
                     </div>
                  </div>
                </motion.div>

                 {/* 2. Topic Tags Card (NEW ENHANCED VISIBILITY) */}
                 {algorithm.tags && algorithm.tags.length > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                     className="bg-[#121214] p-5 border border-zinc-800 rounded-2xl shadow-xl"
                   >
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                        Topics & Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                         {algorithm.tags.map((tag) => (
                            <Link 
                               key={tag} 
                               to={`/?search=${tag}`}
                               className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/20 transition-all rounded-lg text-xs font-medium text-blue-400 flex items-center gap-1.5"
                            >
                               <Hash size={12} className="opacity-70" />
                               {tag}
                            </Link>
                         ))}
                      </div>
                   </motion.div>
                 )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SnippetView;