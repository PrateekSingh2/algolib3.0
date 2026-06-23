import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Clock, HardDrive, Copy, Check, 
  TerminalSquare, Hash, BookOpen, Cpu, Sparkles,
  Zap, Send, Loader2, X, MessageSquare, HelpCircle, ChevronDown, Maximize2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

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
import { useAuth } from "@/contexts/AuthContext";
import { firestoreDB as db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";

// ─── Math & String Sanitizer ────────────────────────────────────────────────
const sanitizeLatex = (text: string) => {
  if (!text) return "";
  let clean = text
    .replace(/\x0C/g, '\\f')
    .replace(/\x08/g, '\\b')
    .replace(/\x09/g, '\\t')
    .replace(/\x0D/g, '\\r')
    .replace(/\x0B/g, '\\v');

  clean = clean
    .replace(/\bint\b/g, '\\int')
    .replace(/\bleft\b/g, '\\left')
    .replace(/\bight\b/g, '\\right')
    .replace(/\bcdot\b/g, '\\cdot')
    .replace(/an\^\{-1\}/g, '\\tan^{-1}')
    .replace(/cot\^\{-1\}/g, '\\cot^{-1}');

  clean = clean.replace(/`([^`]*?(?:\\[a-zA-Z]+|\^\{|_\{)[^`]*?)`/g, (match, p1) => {
    return `$ ${p1.trim()} $`;
  });

  let inCodeBlock = false;
  const lines = clean.split('\n');
  const processedLines = lines.map(line => {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return line;
    }

    let processedLine = line;
    if (!inCodeBlock) {
      // Prevent markdown from treating indented text as code blocks, but keep small indents
      processedLine = processedLine.replace(/^[ \t]+/, (match) => {
        return match.includes('\t') || match.length >= 4 ? '  ' : match;
      });
    }

    if (processedLine.includes('$') || processedLine.includes('\\[') || processedLine.includes('\\(')) return processedLine;
    const trimmed = processedLine.trim();
    if (trimmed.startsWith('\\int') || trimmed.startsWith('-\\int') || trimmed.startsWith('\\frac') || trimmed.startsWith('-\\frac') || trimmed.startsWith('\\cot') || trimmed.startsWith('-\\cot') || trimmed.startsWith('\\tan')) {
      return `$$${trimmed}$$`;
    }
    return processedLine;
  });

  return processedLines.join('\n');
};

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
  const { user, profile, refreshProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"java" | "cpp" | "python">("java");
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── AlgoAsk AI State ──
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [askChatId, setAskChatId] = useState<string | null>(null);
  const [askMessages, setAskMessages] = useState<{ role: "user" | "ai"; content: string; isError?: boolean; result?: any }[]>([]);
  const [askInput, setAskInput] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const askBottomRef = useRef<HTMLDivElement>(null);
  const askInputRef = useRef<HTMLTextAreaElement>(null);

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

  // ── AlgoAsk: build invisible system context + send ──
  const buildAlgoContext = (algo: Algorithm, intent: string) => {
    return `[SYSTEM CONTEXT — NOT SHOWN TO USER]
You are Vectoris, AlgoLib's AI. The user is currently viewing the "${algo.title}" algorithm page.
Algorithm details:
- Category: ${algo.category}
- Time Complexity: ${algo.timeComplexity || "N/A"}
- Space Complexity: ${algo.spaceComplexity || "N/A"}
- Tags: ${(algo.tags || []).join(", ") || "None"}
- Description: ${algo.description}

The user clicked the "${intent}" quick-action button, meaning their intent is: ${intent}.
Respond ONLY about this specific algorithm. Be concise, friendly, and highly educational.
[END SYSTEM CONTEXT]

User intent: ${intent}`;
  };

  const sendAskMessage = async () => {
    if (!algorithm) return;
    const visibleText = askInput.trim();
    if (!visibleText || askLoading) return;

    // Always inject the hidden system context on the very first message
    const apiText = askMessages.length === 0 ? buildAlgoContext(algorithm, visibleText) : visibleText;

    const userMsg = { role: "user" as const, content: visibleText };
    const updatedMessages = [...askMessages, userMsg];
    setAskMessages(updatedMessages);
    setAskInput("");
    setAskLoading(true);

    try {
      if (!user) throw new Error("Sign in to use AI features.");
      const token = await user.getIdToken();
      const history = updatedMessages.slice(-4).map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/.netlify/functions/ask-groq", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: apiText, action: "analyze", history }),
      });

      if (!res.ok) {
        if (res.status === 403 || res.status === 429) throw new Error("Credits finished. Renews after 3 hrs.");
        if (res.status === 401) throw new Error("Sign in to use AI features.");
        throw new Error("Something went wrong. Try again.");
      }

      const data = await res.json();
      const raw = JSON.parse(data.choices[0].message.content);
      const aiContent = raw.explanation || raw.code || JSON.stringify(raw);
      
      const finalMessages = [...updatedMessages, { role: "ai" as const, content: aiContent, result: raw }];
      setAskMessages(finalMessages);

      if (profile?.vectoris_save_history !== false) {
        try {
           const dbCollection = collection(db, 'users', user.uid, 'analysis_history');
           if (askChatId) {
              await updateDoc(doc(dbCollection, askChatId), { messages: finalMessages, updatedAt: serverTimestamp() });
           } else {
              const title = visibleText.substring(0, 40) + '...';
              const docRef = await addDoc(dbCollection, { title, messages: finalMessages, timestamp: serverTimestamp(), updatedAt: serverTimestamp() });
              setAskChatId(docRef.id);
           }
        } catch (err) { console.error("Firebase sync error:", err); }
      }

      // Track usage securely via backend
      try {
        const usageRes = await fetch('/.netlify/functions/vectoris-usage', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!usageRes.ok) {
           const errText = await usageRes.text();
           console.error("Vectoris usage update failed:", errText);
        }
        await refreshProfile();
      } catch (err) { console.error("Usage track error:", err); }
      
    } catch (err: any) {
      setAskMessages(prev => [...prev, { role: "ai", content: err.message || "An error occurred.", isError: true }]);
    } finally {
      setAskLoading(false);
    }
  };

  useEffect(() => { askBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [askMessages, askLoading]);
  useEffect(() => { if (isAskOpen) setTimeout(() => askInputRef.current?.focus(), 200); }, [isAskOpen]);

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

      <main className="relative flex-1 pt-28 sm:pt-36 lg:pt-40 pb-20 px-3 sm:px-6 lg:px-8 z-10">
        <div className="max-w-[1300px] mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between mb-6 sm:mb-8 gap-3"
          >
            <button 
              onClick={handleBack} 
              className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-blue-500 dark:bg-white/[0.03] border border-blue-600 dark:border-white/[0.1] border-t-blue-400 dark:border-t-white/[0.25] text-white dark:text-zinc-300 hover:text-white dark:hover:text-white hover:bg-blue-400 dark:hover:bg-white/[0.08] transition-all duration-300 text-xs sm:text-sm font-bold shadow-md dark:shadow-lg backdrop-blur-xl cursor-pointer shrink-0"
            >
               <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
               <span className="hidden xs:inline sm:inline">Back to Directory</span>
               <span className="xs:hidden sm:hidden">Back</span>
            </button>

            {/* ── AlgoAsk AI Button ── */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsAskOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white text-xs sm:text-sm font-bold shadow-[0_4px_20px_rgba(79,172,254,0.4)] transition-all border border-white/20 shrink-0"
            >
              <Zap size={13} className="fill-white" />
              <span className="hidden xs:inline sm:inline">Ask Vectoris</span>
              <span className="xs:hidden sm:hidden">Ask AI</span>
            </motion.button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-10 items-start">

            {/* ── INFO PANEL — first in DOM = first on mobile, sticky on desktop right ── */}
            <div className="space-y-4 sm:space-y-5 lg:sticky lg:top-36 order-first lg:order-last">

               {/* 1. Header Card */}
               <GlassCard delay={0.1} className="p-5 sm:p-8">
                  <div className="inline-flex items-center gap-2 mb-3 sm:mb-5">
                     <span className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-400/30 flex items-center gap-1.5">
                        <Sparkles size={11} className="text-sky-500 dark:text-sky-400" />
                        {algorithm.category}
                     </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-black dark:from-white via-slate-800 dark:via-zinc-100 to-slate-500 dark:to-zinc-400 mb-3 leading-tight">
                      {algorithm.title}
                  </h1>
                  <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed font-medium">
                      {algorithm.description}
                  </p>
               </GlassCard>

               {/* 2. Complexity Cards */}
               <div className="grid grid-cols-2 gap-3">
                 <GlassCard delay={0.2} className="!p-0 group hover:-translate-y-1 transition-all duration-500">
                   <div className="p-4 sm:p-5 h-full flex flex-col justify-between bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-colors">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 mb-3">
                         <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center">
                           <Clock size={13} className="text-sky-500 dark:text-sky-400" />
                         </div>
                         <span className="text-[10px] font-bold uppercase tracking-widest">Time</span>
                      </div>
                      <div className="text-base sm:text-lg font-mono font-extrabold text-slate-800 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors truncate">
                         {algorithm.timeComplexity}
                      </div>
                   </div>
                 </GlassCard>
                 <GlassCard delay={0.3} className="!p-0 group hover:-translate-y-1 transition-all duration-500">
                   <div className="p-4 sm:p-5 h-full flex flex-col justify-between bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-colors">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 mb-3">
                         <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center">
                           <HardDrive size={13} className="text-purple-500 dark:text-purple-400" />
                         </div>
                         <span className="text-[10px] font-bold uppercase tracking-widest">Space</span>
                      </div>
                      <div className="text-base sm:text-lg font-mono font-extrabold text-slate-800 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors truncate">
                         {algorithm.spaceComplexity}
                      </div>
                   </div>
                 </GlassCard>
               </div>

               {/* 3. Tags Card */}
               {algorithm.tags && algorithm.tags.length > 0 && (
                 <GlassCard delay={0.4} className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu size={13} className="text-slate-400 dark:text-zinc-500" />
                      <h3 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Topics &amp; Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                       {algorithm.tags.map((tag) => (
                          <Link key={tag} to={`/`}
                             className="px-2.5 sm:px-3 py-1.5 bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-white/[0.1] hover:border-sky-300 dark:hover:border-sky-400/50 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-all rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-sky-600 dark:hover:text-sky-300 flex items-center gap-1 shadow-sm group/tag"
                          >
                             <Hash size={11} className="opacity-50 group-hover/tag:text-sky-500 group-hover/tag:opacity-100 transition-colors" />
                             {tag}
                          </Link>
                       ))}
                    </div>
                 </GlassCard>
               )}
            </div>

            {/* ── LEFT COLUMN: DOCS + CODE TERMINAL ── */}
            <div className="flex flex-col gap-5 sm:gap-7 w-full order-last lg:order-first">

              {/* DETAILS MARKDOWN SECTION */}
              {/* @ts-ignore */}
              {algorithm.details && (
                <GlassCard delay={0.1} className="p-4 sm:p-8">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-200/60 dark:border-white/[0.08]">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center shadow-inner">
                      <BookOpen className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-xl font-bold text-black dark:text-white tracking-tight">Deep Dive &amp; Explanation</h2>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 font-mono uppercase tracking-widest">Documentation</p>
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
                 <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-slate-100/60 dark:bg-black/60 border-b border-slate-200 dark:border-white/[0.1] backdrop-blur-xl relative z-20">
                     <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <div className="flex gap-1.5 shrink-0">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500" />
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500" />
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500" />
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-zinc-400 bg-white/50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 min-w-0">
                           <TerminalSquare className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                           <span className="text-xs font-mono font-bold tracking-wide truncate">{algorithm.title.replace(/\s+/g, '_')}.{activeTab === 'python' ? 'py' : activeTab}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 shrink-0">
                        <div className="flex bg-slate-200/50 dark:bg-black/40 p-0.5 sm:p-1 rounded-xl border border-slate-300 dark:border-white/[0.1] shadow-inner backdrop-blur-md">
                           {(['java', 'cpp', 'python'] as const).map((lang) => (
                              <button key={lang} onClick={() => setActiveTab(lang)}
                                 className={`px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                                     activeTab === lang 
                                        ? "bg-green-500 text-white shadow-sm border border-green-600" 
                                        : "text-slate-600 dark:text-zinc-400 border border-transparent hover:bg-white/60 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                                 }`}
                              >
                                 {lang}
                              </button>
                           ))}
                        </div>
                        <button onClick={handleCopy}
                            className={`p-2 sm:p-2.5 rounded-xl transition-all border ${
                              copied 
                                ? 'bg-orange-500 dark:bg-emerald-500/20 text-white dark:text-emerald-400 border-orange-600 dark:border-emerald-400/50' 
                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10'
                            }`}
                            title="Copy Code"
                        >
                           {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                     </div>
                 </div>
                 <div className="relative bg-[#050505]/80 w-full p-4 sm:p-6 md:p-8 overflow-auto custom-scrollbar max-h-[50vh] sm:max-h-[65vh] shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)]">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                    <AnimatePresence mode="wait">
                       <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="relative z-10">
                          <pre className={`language-${activeTab}`}>
                             <code className={`language-${activeTab}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                          </pre>
                       </motion.div>
                    </AnimatePresence>
                 </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </main>

      {/* ── AlgoAsk Slide-up Panel ── */}
      <AnimatePresence>
        {isAskOpen && algorithm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAskOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[401] flex flex-col rounded-t-[2rem] overflow-hidden
                bg-white/95 dark:bg-[#0e0e12]/95 backdrop-blur-2xl
                border-t border-slate-200 dark:border-white/[0.1]
                shadow-[0_-20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_-20px_60px_rgba(0,0,0,0.8)]"
              style={{ height: "min(580px, 90dvh)" }}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center shadow-md">
                    <Zap size={16} className="text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Ask about <span className="text-[#4facfe]">{algorithm.title}</span></p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">Vectoris AI · Context-aware</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                       navigate(askChatId ? `/vectoris/${askChatId}` : "/vectoris");
                    }}
                    className="p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-white transition-colors"
                    title="Open in full screen"
                  >
                    <Maximize2 size={16} />
                  </button>
                  <button
                    onClick={() => setIsAskOpen(false)}
                    className="p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Quick Intent Buttons */}
              {askMessages.length === 0 && (
                <div className="px-5 pt-4 pb-2 shrink-0">
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Quick questions about this algorithm</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "📖 Summary",      intent: "Give me a crisp summary of this algorithm, its key idea, and when to use it." },
                      { label: "🤔 Have a doubt?", intent: "I have a doubt about this algorithm. Explain it from scratch in simple terms." },
                      { label: "⚡ Simplify",      intent: "Explain this algorithm in the simplest way possible, as if I'm a beginner." },
                      { label: "🧠 Complexity why?",intent: "Explain WHY the time and space complexity of this algorithm is what it is, step by step." },
                      { label: "💼 Interview Tips",intent: "What are the important interview tips and edge cases I should know about this algorithm?" },
                      { label: "🔄 Compare",       intent: "Compare this algorithm to similar ones. When should I use this one vs alternatives?" },
                    ].map(({ label, intent }) => (
                      <button
                        key={label}
                        onClick={() => {
                          setAskInput(intent);
                          setTimeout(() => askInputRef.current?.focus(), 50);
                        }}
                        className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-slate-600 dark:text-zinc-400 hover:bg-[#4facfe]/10 dark:hover:bg-[#4facfe]/10 hover:border-[#4facfe]/40 hover:text-[#4facfe] dark:hover:text-[#4facfe] transition-all active:scale-95"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 min-h-0" style={{ scrollbarWidth: "none" }}>
                {askMessages.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare size={32} className="mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
                      <p className="text-sm text-slate-400 dark:text-zinc-500">Pick a quick question above or type your own below</p>
                    </div>
                  </div>
                )}

                {askMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "items-start gap-2"}`}>
                    {msg.role === "ai" && (
                      <div className="w-7 h-7 rounded-lg shrink-0 bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center mt-1 shadow-sm">
                        <Zap size={12} className="text-white fill-white" />
                      </div>
                    )}
                    <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-[#4facfe] to-[#00f2fe] text-white rounded-tr-sm shadow-md font-medium"
                        : msg.isError
                          ? "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
                          : "bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] text-slate-700 dark:text-zinc-300 rounded-tl-sm"
                    }`}>
                      {msg.role === "user" ? (
                        <p>{msg.content}</p>
                      ) : (
                        <div className="w-full max-w-full overflow-x-auto custom-scrollbar break-words">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[[rehypeKatex, { strict: false }]]}
                            components={{
                              p: ({ ...props }) => <p className="mb-2 last:mb-0 leading-relaxed whitespace-pre-wrap break-words" {...props} />,
                              strong: ({ ...props }) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
                              pre: ({ children, ...props }) => <pre className="overflow-x-auto max-w-full custom-scrollbar my-2" {...props}>{children}</pre>,
                              ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                              li: ({ ...props }) => <li className="text-[13px] break-words" {...props} />,
                              code: ({ children, ...props }) => <code className="bg-slate-200 dark:bg-white/10 px-1 py-0.5 rounded text-blue-600 dark:text-[#4facfe] font-mono text-[12px] whitespace-pre-wrap break-words" {...props}>{children}</code>,
                            }}
                          >{sanitizeLatex(msg.content)}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {askLoading && (
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg shrink-0 bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center mt-1">
                      <Loader2 size={12} className="text-white animate-spin" />
                    </div>
                    <div className="bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4facfe] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4facfe] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4facfe] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={askBottomRef} />
              </div>

              {/* Input */}
              <div className="px-5 pb-6 pt-2 shrink-0 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-end gap-2 bg-slate-50 dark:bg-white/[0.04] rounded-2xl border border-slate-200 dark:border-white/[0.08] px-4 py-2.5 focus-within:border-[#4facfe]/50 transition-colors">
                  <textarea
                    ref={askInputRef}
                    value={askInput}
                    onChange={(e) => {
                      setAskInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAskMessage(); }
                    }}
                    placeholder={`Ask anything about ${algorithm.title}...`}
                    rows={1}
                    disabled={askLoading}
                    className="flex-1 bg-transparent text-[13px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none resize-none leading-relaxed py-1 max-h-[100px]"
                    style={{ scrollbarWidth: "none" }}
                  />
                  <button
                    onClick={() => sendAskMessage()}
                    disabled={!askInput.trim() || askLoading}
                    className={`p-2 rounded-xl transition-all shrink-0 ${
                      askInput.trim() && !askLoading
                        ? "bg-gradient-to-br from-[#4facfe] to-[#00f2fe] text-white shadow-md hover:scale-105 active:scale-95"
                        : "bg-slate-200 dark:bg-white/[0.05] text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {askLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} className="ml-px" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SnippetView;