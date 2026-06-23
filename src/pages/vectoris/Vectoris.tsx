import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Zap, AlertCircle, Send, Loader2, Code2, ArrowRightLeft, 
  Plus, MessageSquare, Maximize2, X, Activity, ChevronLeft, Menu, Trash2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── FIREBASE & CONTEXT IMPORTS ──────────────────────────────────────────────
import { firestoreDB as db } from "@/lib/firebase";
import { doc, onSnapshot, collection, addDoc, updateDoc, serverTimestamp, query, orderBy, deleteDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useNavigate } from 'react-router-dom';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from "@/components/Navbar"; 
import TerminalCode from "./TerminalCode";

// ─── MATH RENDERING IMPORTS ──────────────────────────────────────────────────
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnalysisResult {
  type: 'analysis' | 'optimization' | 'translation' | 'chat'; 
  timeComplexity?: string; 
  spaceComplexity?: string;
  explanation?: string;
  code?: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  result?: AnalysisResult;
  isError?: boolean;
}

interface HistoryItem {
  id: string;
  title: string;
  messages?: ChatMessage[];
  timestamp: any;
  updatedAt?: any;
}

// ─── Math & String Sanitizer ────────────────────────────────────────────────
const sanitizeLatex = (text: string) => {
  if (!text) return "";
  
  // 1. Recover JSON-mangled escape sequences to stop KaTeX ParseErrors (Red Text)
  let clean = text
    .replace(/\x0C/g, '\\f') // Form feed -> \f (\frac)
    .replace(/\x08/g, '\\b') // Backspace -> \b (\boxed)
    .replace(/\x09/g, '\\t') // Tab -> \t (\tan)
    .replace(/\x0D/g, '\\r') // Carriage return -> \r (\right)
    .replace(/\x0B/g, '\\v'); // Vertical tab -> \v (\vec)

  // 2. Fix commonly hallucinated missing backslashes
  clean = clean
    .replace(/\bint\b/g, '\\int')
    .replace(/\bleft\b/g, '\\left')
    .replace(/\bight\b/g, '\\right')
    .replace(/\bcdot\b/g, '\\cdot')
    .replace(/an\^\{-1\}/g, '\\tan^{-1}')
    .replace(/cot\^\{-1\}/g, '\\cot^{-1}');

  // 3. Convert backtick-wrapped math into proper inline Katex ($...$)
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

// ─── Dynamic Graph Parsing Logic (Strict Mathematical Plotter) ──────────────────────
const parseComplexity = (str?: string) => {
  const s = (str || '').toLowerCase();
  
  let cleanStr = s.replace(/\\(?:mathrm|text|operatorname|mathit|mathbf|mathcal|mathsf)\{([^}]+)\}/g, '$1');
  cleanStr = cleanStr.replace(/\\[a-zA-Z]+/g, (match) => {
    if (match === '\\sqrt' || match === '\\log' || match === '\\ln') return match;
    return ''; 
  });

  const oMatch = cleanStr.match(/o\s*\((.*)\)/);
  const coreExpr = oMatch ? oMatch[1] : cleanStr;

  if (coreExpr.includes('!')) {
    return { name: 'Factorial', fn: (n: number) => { let r=1; for(let i=1;i<=n;i++)r*=i; return r; }, color: '#f43f5e' }; 
  }
  if (coreExpr.includes('2^') || coreExpr.includes('e^') || coreExpr.includes('3^') || coreExpr.includes('c^')) {
    return { name: 'Exponential', fn: (n: number) => Math.pow(2, n), color: '#c084fc' };
  }
  if (coreExpr.includes('^3') || (coreExpr.match(/n/g) || []).length >= 3) {
    return { name: 'Cubic', fn: (n: number) => Math.pow(n, 3), color: '#e11d48' };
  }
  if (coreExpr.includes('^2') || ((coreExpr.match(/n/g) || []).length === 2 && coreExpr.includes('*'))) {
    return { name: 'Quadratic', fn: (n: number) => Math.pow(n, 2), color: '#f87171' };
  }
  
  const hasN = coreExpr.includes('n') || coreExpr.includes('m') || coreExpr.includes('v') || coreExpr.includes('e');
  const hasLog = coreExpr.includes('log') || coreExpr.includes('ln');
  const hasRoot = coreExpr.includes('sqrt') || coreExpr.includes('1/2');

  if (hasN && hasLog) {
    const nIdx = Math.max(coreExpr.indexOf('n'), coreExpr.indexOf('m'));
    const logIdx = coreExpr.indexOf('log') !== -1 ? coreExpr.indexOf('log') : coreExpr.indexOf('ln');
    if (nIdx < logIdx || coreExpr.includes('*')) {
       return { name: 'Linearithmic', fn: (n: number) => n * Math.log2(n + 1), color: '#fb923c' };
    }
  }
  if (hasRoot) return { name: 'Square Root', fn: (n: number) => Math.sqrt(n), color: '#a3e635' };
  if (hasLog) return { name: 'Logarithmic', fn: (n: number) => Math.log2(n + 1), color: '#38bdf8' };
  if (hasN) return { name: 'Linear', fn: (n: number) => n, color: '#facc15' };

  return { name: 'Constant', fn: (n: number) => 1, color: '#4ade80' };
};

// ─── Inline Math Component ───────────────────────────────────────────────────
const FormattedComplexity = ({ text, color, className }: { text?: string, color?: string, className?: string }) => {
  if (!text) return null;
  const content = text.includes('$') ? text : `$${text}$`;
  
  return (
    <div style={{ color }} className={`inline-block ${className || ''}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[[rehypeKatex, { strict: false }]]} 
        components={{ p: React.Fragment }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// ─── Constants & Utils ───────────────────────────────────────────────────────
const TRANSLATE_LANGS = ["Python", "Java", "C++", "JavaScript", "Go", "Rust"];
const SUGGESTIONS = [
  { icon: <Zap size={18}/>, text: "Optimize sorting algorithm" },
  { icon: <Code2 size={18}/>, text: "Explain dynamic programming" },
  { icon: <ArrowRightLeft size={18}/>, text: "Translate Python to C++" },
  { icon: <AlertCircle size={18}/>, text: "Find memory leaks" },
];

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

const safeStringify = (data: any): string => {
  if (!data) return '';
  if (typeof data === 'string') return data;
  try { return JSON.stringify(data, null, 2); } catch (e) { return String(data); }
};

export default function Analyzer() {
  const { user, profile, refreshProfile } = useAuth(); 
  const [credits, setCredits] = useState<number | null>(null);
  
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const currentUser = user;
  const userName = (profile && (profile.display_name || (profile as any).name)) || user?.displayName || (user?.email ? user.email.split('@')[0] : 'Guest');

  const [inputCode, setInputCode] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showLangMenuForIdx, setShowLangMenuForIdx] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const chatIdRef = useRef<string | null>(null); 
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const setChatId = (id: string | null) => {
    setCurrentChatId(id);
    chatIdRef.current = id;
  };

  useEffect(() => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (routeId && routeId !== chatIdRef.current) {
      const fetchChat = async () => {
        if (!user) return;
        try {
          const docRef = doc(db, 'users', user.uid, 'analysis_history', routeId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setChatId(routeId);
            setMessages(data.messages || []);
          } else {
            navigate('/vectoris', { replace: true });
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchChat();
    } else if (!routeId && chatIdRef.current) {
      setChatId(null);
      setMessages([]);
    }
  }, [routeId, user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnalyzing]);

  useEffect(() => {
    if (inputCode === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [inputCode]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputCode(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const handleNewAnalysis = () => {
    navigate('/vectoris');
    if (window.innerWidth < 768) setIsSidebarOpen(false); 
  };

  const handleSuggestionClick = (text: string) => {
    setInputCode(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
    }
  };

  // ─── Firebase Listeners & Credit Check ────────────────────────────────
  useEffect(() => {
    let unsubscribeCredits: () => void;
    let unsubscribeHistory: () => void;

    const refreshCreditsIfNeeded = async (uid: string) => {
      const docRef = doc(db, 'user_credits', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const lastUpdated = data.lastUpdated?.toMillis() || 0;
        const now = Date.now();
        if (now - lastUpdated > 10800000 && data.credits < 7) {
          await updateDoc(docRef, { credits: 7, lastUpdated: serverTimestamp() });
        }
      }
    };

    if (user) {
      refreshCreditsIfNeeded(user.uid).catch(console.error);

      unsubscribeCredits = onSnapshot(doc(db, 'user_credits', user.uid), (docSnap) => {
        if (docSnap.exists()) setCredits(docSnap.data().credits);
        else setCredits(7); 
      });

      const historyQ = query(collection(db, 'users', user.uid, 'analysis_history'), orderBy('updatedAt', 'desc'));
      unsubscribeHistory = onSnapshot(historyQ, (snap) => {
        setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryItem)));
      });
    } else {
      setCredits(null);
      setHistory([]);
    }

    return () => { 
      if (unsubscribeCredits) unsubscribeCredits(); 
      if (unsubscribeHistory) unsubscribeHistory(); 
    }; 
  }, [user]);

  const saveChatToFirebase = async (chatMessages: ChatMessage[]) => {
    if (!user || profile?.vectoris_save_history === false) return;
    try {
      const dbCollection = collection(db, 'users', user.uid, 'analysis_history');
      if (chatIdRef.current) {
        await updateDoc(doc(dbCollection, chatIdRef.current), { messages: chatMessages, updatedAt: serverTimestamp() });
      } else {
        const firstUserMsg = chatMessages.find(m => m.role === 'user');
        const generatedTitle = firstUserMsg ? firstUserMsg.content.substring(0, 40) + '...' : 'New Chat';
        const docRef = await addDoc(dbCollection, { title: generatedTitle, messages: chatMessages, timestamp: serverTimestamp(), updatedAt: serverTimestamp() });
        setChatId(docRef.id);
        navigate(`/vectoris/${docRef.id}`, { replace: true });
      }
    } catch (err) { console.error("Failed to save thread:", err); }
  };

  const executeRequest = async (action: 'analyze' | 'optimize' | 'translate', code: string, currentMessages: ChatMessage[], targetLanguage?: string) => {
    setIsAnalyzing(true);
    try {
      if (!user) throw new Error("Authentication required.");
      const token = await user.getIdToken();

      const recentHistory = currentMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.role === 'user' ? m.content : (m.result?.explanation || '')
      }));

      const response = await fetch('/.netlify/functions/ask-groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code, action, targetLanguage, history: recentHistory })
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 429) throw new Error("Credits finished. Credits renews after 3hr.");
        throw new Error(`Something went wrong (Error ${response.status}). Please try again.`);
      }

      const data = await response.json();
      const aiResult = JSON.parse(data.choices[0].message.content) as AnalysisResult & { error?: string };
      
      if (aiResult.error) throw new Error(aiResult.error);

      const finalMessages: ChatMessage[] = [...currentMessages, { role: 'ai', content: '', result: aiResult }];
      setMessages(finalMessages);
      await saveChatToFirebase(finalMessages);

      // Track usage securely via backend
      try {
        const usageRes = await fetch('/.netlify/functions/vectoris-usage', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!usageRes.ok) console.error("Vectoris usage update failed:", await usageRes.text());
        if (refreshProfile) await refreshProfile();
      } catch (err) { console.error("Usage track error:", err); }

    } catch (err: any) {
      setMessages([...currentMessages, { role: 'ai', content: err.message || "An error occurred processing your request.", isError: true }]);
    } finally {
      setIsAnalyzing(false);
      setShowLangMenuForIdx(null);
    }
  };

  const handleAnalyze = () => {
    const trimmed = inputCode.trim();
    if (!trimmed) return;
    const pendingMessages = [...messages, { role: 'user', content: trimmed } as ChatMessage];
    setMessages(pendingMessages);
    setInputCode('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    executeRequest('analyze', trimmed, pendingMessages);
  };

  const handleOptimize = (codeToOptimize: string) => {
    const pendingMessages = [...messages, { role: 'user', content: "Please optimize this code to run faster and use less memory." } as ChatMessage];
    setMessages(pendingMessages);
    executeRequest('optimize', codeToOptimize, pendingMessages);
  };

  const handleTranslate = (codeToTranslate: string, targetLang: string) => {
    const pendingMessages = [...messages, { role: 'user', content: `Please translate this code to ${targetLang}.` } as ChatMessage];
    setMessages(pendingMessages);
    executeRequest('translate', codeToTranslate, pendingMessages, targetLang);
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'analysis_history', id));
      if (routeId === id) handleNewAnalysis(); 
    } catch (err) { console.error(err); }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    navigate(`/vectoris/${item.id}`);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnalyze(); }
  };

  const handleAttachmentClick = () => {
    setToastMessage("File attachments are not available in this version.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isHomeState = messages.length === 0;

  const activeParsedComplexity = activeAnalysis ? parseComplexity(activeAnalysis.timeComplexity) : null;
  let maxN = 20;
  if (activeParsedComplexity) {
    if (activeParsedComplexity.name === 'Factorial') maxN = 8;
    else if (activeParsedComplexity.name === 'Exponential') maxN = 15;
  }

  const dynamicChartData = activeParsedComplexity 
    ? Array.from({ length: maxN }, (_, i) => ({ n: i + 1, value: activeParsedComplexity.fn(i + 1) }))
    : [];

  const formatYAxis = (num: number) => Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);

  return (
    <div className="flex h-[100dvh] bg-slate-50 dark:bg-[#0c0c0e] text-slate-800 dark:text-zinc-100 font-sans overflow-hidden selection:bg-blue-500/30">
      <Helmet><title>Vectoris | AlgoLib's AI</title></Helmet>

      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <Info size={18} className="text-[#4facfe]" />
            <span className="text-sm font-medium text-white tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeAnalysis && activeParsedComplexity && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveAnalysis(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-5xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                     <Activity size={20} className="text-blue-400" />
                   </div>
                   <div>
                     <h2 className="text-lg font-bold text-white leading-tight">Complexity Analysis</h2>
                     <p className="text-xs text-zinc-400 font-medium tracking-wide">DYNAMIC GROWTH VISUALIZATION</p>
                   </div>
                </div>
                <button onClick={() => setActiveAnalysis(null)} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                   <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Time Complexity</span>
                    <FormattedComplexity text={activeAnalysis.timeComplexity} color={activeParsedComplexity.color} className="text-4xl md:text-5xl font-extrabold drop-shadow-md" />
                  </div>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Space Complexity</span>
                    <FormattedComplexity text={activeAnalysis.spaceComplexity} color={parseComplexity(activeAnalysis.spaceComplexity).color} className="text-4xl md:text-5xl font-extrabold drop-shadow-md" />
                  </div>
                </div>
                
                <div className="h-[300px] md:h-[400px] w-full p-6 rounded-3xl bg-black/20 border border-white/5 shadow-inner relative">
                  <div className="absolute top-8 left-8 text-[11px] font-bold text-zinc-500 uppercase tracking-widest z-10">
                    Behavior: <span style={{ color: activeParsedComplexity.color }}>{activeParsedComplexity.name}</span>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dynamicChartData} margin={{ top: 40, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="n" stroke="#52525b" tick={{fill: '#71717a', fontSize: 11}} axisLine={false} tickLine={false} minTickGap={15} />
                      <YAxis stroke="#52525b" tick={{fill: '#71717a', fontSize: 11}} axisLine={false} tickLine={false} tickFormatter={formatYAxis} width={40} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(20,20,22,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} labelFormatter={(label) => `Input Size (N): ${label}`} formatter={(val: number) => [formatYAxis(val), 'Operations']} />
                      <Line type="monotone" dataKey="value" stroke={activeParsedComplexity.color} strokeWidth={3} dot={false} style={{ filter: `drop-shadow(0 0 10px ${activeParsedComplexity.color}80)` }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <aside 
        className={`absolute md:relative z-[60] h-full flex flex-col bg-white/80 dark:bg-white/5 backdrop-blur-2xl transition-all duration-300 ease-in-out shrink-0 border-r border-slate-200 dark:border-white/10
        ${isSidebarOpen ? 'w-[280px] translate-x-0' : 'w-[280px] -translate-x-full md:translate-x-0 md:w-0'} overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)] md:shadow-none`}
      >
        <div className="p-4 flex items-center justify-between min-w-[280px] h-[72px]">
          <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]">
            <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center shadow-[0_2px_10px_rgba(79,172,254,0.4)]">
               <Zap size={16} className="text-white fill-white" />
            </div>
            <span className="text-[20px] font-medium text-slate-900 dark:text-white tracking-tight leading-none">Vectoris</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 dark:text-zinc-400 transition-colors shrink-0">
            <ChevronLeft size={20} />
          </button>
        </div>
        
        <div className="px-3 pb-4 pt-2 min-w-[280px] flex flex-col gap-1">
          <button onClick={handleNewAnalysis} className="w-full flex items-center gap-3 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/5 rounded-xl text-sm font-medium transition-all text-slate-700 dark:text-zinc-200">
            <Plus size={18} className="text-zinc-400" /> New analysis
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 min-w-[280px] custom-scrollbar">
          <div className="text-[12px] font-medium text-slate-500 dark:text-zinc-500 px-2 mb-2 mt-2 tracking-wide uppercase">Recent</div>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-zinc-600 px-2 italic">No recent history.</p>
          ) : (
            history.map(item => (
              <div 
                key={item.id} 
                onClick={() => loadHistoryItem(item)} 
                className={`group flex items-center justify-between px-3 py-2.5 text-sm rounded-xl cursor-pointer transition-colors
                  ${currentChatId === item.id ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-white/15 dark:text-white font-medium dark:border-white/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 border border-transparent'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={14} className="shrink-0 text-slate-400 group-hover:text-slate-500 dark:text-zinc-500 dark:group-hover:text-zinc-400" />
                  <span className="truncate">{item.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDeleteHistory(e, item.id)} 
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 p-1 shrink-0 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-auto p-4 border-t border-slate-200 dark:border-white/10 min-w-[280px] bg-slate-50/50 dark:bg-black/20">
           <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer group">
              {currentUser?.photoURL ? (
                 <img src={currentUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-inner border border-white/20 group-hover:border-white/40 transition-colors" />
              ) : (
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-shadow">
                    {userName?.charAt(0).toUpperCase()}
                 </div>
              )}
              <div className="flex flex-col flex-1 overflow-hidden">
                 <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">{userName}</span>
                 <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5 mt-0.5">
                    <Zap size={12} className="text-yellow-500 fill-yellow-500" /> {credits !== null ? credits : '-'} Credits left
                 </span>
              </div>
           </div>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-50 dark:from-[#1a1a24] dark:via-[#0c0c0e] dark:to-[#0c0c0e]">
        
        <header className="flex items-center justify-between p-4 absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-slate-50 via-slate-50/80 to-transparent dark:from-[#0c0c0e] dark:via-[#0c0c0e]/80 pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 dark:text-zinc-400 transition-colors">
                <Menu size={20} />
              </button>
            )}
          </div>
          <div className="hidden md:flex pointer-events-auto">
             <Navbar />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar pt-20 pb-0">
          <div className="max-w-4xl mx-auto px-4 md:px-8 h-full flex flex-col">
            
            {isHomeState && (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col items-center justify-center flex-1 py-10">
                <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-semibold text-slate-900 dark:text-white tracking-tight text-center mb-12 drop-shadow-lg">
                  Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4facfe] to-[#00f2fe]">{userName}</span>
                </motion.h1>
                <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                  {SUGGESTIONS.map((sug, idx) => (
                    <motion.button 
                      variants={itemVariants} key={idx} onClick={() => handleSuggestionClick(sug.text)}
                      className="group flex flex-col gap-4 p-5 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-md hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 transition-all duration-300 border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/20 text-left h-[120px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-lg hover:-translate-y-1"
                    >
                      <div className="p-2 bg-blue-50 dark:bg-white/10 w-fit rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-[#4facfe]/20 transition-colors border border-slate-200 dark:border-white/5">
                        <span className="text-[#4facfe] group-hover:text-[#00f2fe] drop-shadow-md">{sug.icon}</span> 
                      </div>
                      <span className="text-sm font-medium leading-snug">{sug.text}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {!isHomeState && (
              <div className="flex flex-col gap-8 mt-4 pb-4 w-full max-w-full">
                {messages.map((msg, idx) => {
                  const originalCodeMsg = messages.slice(0, idx).reverse().find(m => m.role === 'user');
                  
                  // Run Sanitization Layer BEFORE ReactMarkdown encounters it
                  let displayContent = msg.result?.explanation || "";
                  if (msg.result?.code) {
                    if (displayContent === "") {
                      displayContent = /```|\*\*|###|\$\w+/.test(msg.result.code) 
                        ? msg.result.code 
                        : `\`\`\`code\n${msg.result.code}\n\`\`\``;
                    } else if (!displayContent.includes(msg.result.code)) {
                      displayContent += `\n\n\`\`\`code\n${msg.result.code}\n\`\`\``;
                    }
                  }
                  
                  // Inject the strict sanitization to rescue mangled LaTeX here
                  displayContent = sanitizeLatex(displayContent);

                  return (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
                      {msg.role === 'user' ? (
                        <div className="flex justify-end w-full mb-2">
                          <div className="bg-white dark:bg-white/10 backdrop-blur-md px-5 py-4 rounded-3xl max-w-[90%] md:max-w-[80%] text-slate-800 dark:text-zinc-100 text-[15px] leading-relaxed font-sans shadow-sm dark:shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden break-words">
                            <pre className="whitespace-pre-wrap font-sans font-medium break-words">{msg.content}</pre>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-4 w-full max-w-full overflow-hidden">
                          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-[#00f2fe] mt-1 shadow-md dark:shadow-blue-500/20 border border-slate-200 dark:border-white/10">
                             <Zap size={18} className="text-white fill-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0 text-[15px] leading-relaxed text-slate-800 dark:text-zinc-200 pt-1 overflow-hidden">
                            
                            {msg.isError ? (
                               <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-md text-red-200 flex items-center gap-3">
                                 <AlertCircle size={18} className="text-red-400" /> {msg.content}
                               </div>
                            ) : msg.result ? (
                              <div className="space-y-6 w-full max-w-full">
                                
                                {displayContent && (
                                  <div className="w-full max-w-full break-words">
                                    <ReactMarkdown 
                                      remarkPlugins={[remarkMath, remarkGfm]} 
                                      // Tell KaTeX NOT to crash on mild errors anymore, just in case
                                      rehypePlugins={[[rehypeKatex, { strict: false }]]}
                                      components={{
                                        p: ({node, ...props}) => <p className="mb-4 leading-relaxed whitespace-pre-wrap break-words text-slate-700 dark:text-zinc-200" {...props} />,
                                        strong: ({node, ...props}) => <strong className="font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 px-1 rounded-sm" {...props} />,
                                        em: ({node, ...props}) => <em className="italic text-slate-600 dark:text-zinc-300" {...props} />,
                                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-700 dark:text-zinc-200 marker:text-slate-400 dark:marker:text-zinc-500" {...props} />,
                                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-slate-700 dark:text-zinc-200 marker:text-slate-400 dark:marker:text-zinc-500" {...props} />,
                                        li: ({node, ...props}) => <li className="break-words pl-1" {...props} />,
                                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 mt-6 break-words" {...props} />,
                                        h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 mt-5 break-words" {...props} />,
                                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 mt-4 break-words" {...props} />,
                                        a: ({node, ...props}) => <a className="text-blue-600 dark:text-[#4facfe] hover:text-blue-500 dark:hover:text-[#00f2fe] underline underline-offset-2 break-words" {...props} />,
                                        code(props) {
                                          const {children, className, node, ...rest} = props;
                                          const match = /language-(\w+)/.exec(className || '');
                                          const contentString = String(children).replace(/\n$/, '');
                                          const isBlock = match || contentString.includes('\n');
                                          
                                          if (isBlock) {
                                            return <TerminalCode code={contentString} language={match ? match[1].toUpperCase() : 'CODE'} />;
                                          }
                                          return <code className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-blue-600 dark:text-[#4facfe] font-mono text-[13px] break-words" {...rest}>{children}</code>;
                                        }
                                      }}
                                    >
                                      {displayContent}
                                    </ReactMarkdown>
                                  </div>
                                )}

                                {/* ─── INLINE GRAPH PREVIEW ─── */}
                                {msg.result.type === 'analysis' && (
                                  <div 
                                    onClick={() => setActiveAnalysis(msg.result as AnalysisResult)}
                                    className="mt-6 rounded-2xl bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 cursor-pointer hover:border-blue-400 dark:hover:border-[#4facfe]/50 transition-all shadow-sm dark:shadow-lg overflow-hidden group"
                                  >
                                    <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                                       <div className="flex items-center gap-3">
                                          <Activity size={18} className="text-[#4facfe]" />
                                          <h4 className="text-[14px] font-bold text-slate-900 dark:text-white tracking-wide">Execution Matrix</h4>
                                       </div>
                                       <div className="flex items-center gap-2 text-xs font-semibold text-[#4facfe] bg-[#4facfe]/10 px-3 py-1 rounded-full group-hover:bg-[#4facfe]/20 transition-colors border border-[#4facfe]/20">
                                         Tap to expand <Maximize2 size={12} />
                                       </div>
                                    </div>
                                    
                                    <div className="p-5 flex items-center justify-between bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-transparent dark:to-[#ffffff03]">
                                       <div className="flex flex-col gap-2">
                                         <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Time Complexity</div>
                                         <FormattedComplexity text={msg.result.timeComplexity} color={parseComplexity(msg.result.timeComplexity).color} className="text-2xl font-black drop-shadow-md" />
                                       </div>
                                       <div className="h-12 w-[1px] bg-slate-200 dark:bg-white/10 mx-4"></div>
                                       <div className="flex flex-col gap-2 text-right">
                                         <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Space Complexity</div>
                                         <FormattedComplexity text={msg.result.spaceComplexity} color={parseComplexity(msg.result.spaceComplexity).color} className="text-2xl font-black drop-shadow-md" />
                                       </div>
                                    </div>
                                  </div>
                                )}

                                {/* ─── ACTION BUTTONS ─── */}
                                {msg.result.type === 'analysis' && (
                                  <div className="flex flex-wrap gap-3 mt-2">
                                    <button onClick={() => handleOptimize(originalCodeMsg?.content || '')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-white/5 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-700 dark:text-zinc-200 transition-all shadow-sm dark:shadow-md">
                                      <Code2 size={16} className="text-emerald-400"/> Optimize Code
                                    </button>
                                    <div className="relative">
                                      <button onClick={() => setShowLangMenuForIdx(showLangMenuForIdx === idx ? null : idx)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-white/5 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-700 dark:text-zinc-200 transition-all shadow-sm dark:shadow-md">
                                        <ArrowRightLeft size={16} className="text-purple-400"/> Translate
                                      </button>
                                      <AnimatePresence>
                                        {showLangMenuForIdx === idx && (
                                          <motion.div 
                                            initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }} transition={{ duration: 0.15 }}
                                            className="absolute bottom-full left-0 mb-3 w-[160px] bg-white/95 dark:bg-[#1a1a24]/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/20 shadow-xl overflow-hidden py-2 z-50"
                                          >
                                            {TRANSLATE_LANGS.map(lang => (
                                              <button key={lang} onClick={() => handleTranslate(originalCodeMsg?.content || '', lang)} className="w-full text-left px-5 py-2 text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors">
                                                {lang}
                                              </button>
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                
                {isAnalyzing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 w-full mt-4">
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border border-[#4facfe]/30 bg-[#4facfe]/10 shadow-[0_0_15px_rgba(79,172,254,0.2)]">
                      <Loader2 className="animate-spin text-[#4facfe]" size={20} />
                    </div>
                    <div className="flex items-center h-9">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium animate-pulse text-[15px]">Vectoris is analyzing...</span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
            
            <div className="h-36 md:h-44 shrink-0" />
            <div ref={messagesEndRef} />
            
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-50 via-slate-50/90 dark:from-[#0c0c0e] dark:via-[#0c0c0e]/90 to-transparent pt-12 pb-6 md:pb-8 pointer-events-none">
          <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pointer-events-auto">
            <div className="relative flex flex-col bg-white dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-2 pr-3 border border-slate-300 dark:border-white/20 focus-within:bg-white focus-within:border-blue-400 dark:focus-within:bg-white/10 dark:focus-within:border-white/30 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex items-end">
                <button 
                  onClick={handleAttachmentClick}
                  className="p-3.5 mb-[2px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 rounded-full transition-colors shrink-0 hidden sm:block"
                  title="Add attachment"
                >
                  <Plus size={22} />
                </button>
                <textarea
                  ref={textareaRef}
                  value={inputCode}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Vectoris..."
                  className="flex-1 max-h-[200px] bg-transparent text-slate-900 dark:text-white resize-none outline-none py-4 px-3 sm:px-2 text-[15px] md:text-base custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-zinc-500 leading-relaxed font-medium"
                  rows={1}
                  disabled={isAnalyzing}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={!inputCode.trim() || isAnalyzing}
                  className={`p-3.5 mb-[2px] rounded-full transition-all shrink-0 ${
                    inputCode.trim() && !isAnalyzing
                      ? 'text-white bg-blue-600 dark:text-black dark:bg-white hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.3)] dark:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                      : 'text-slate-400 bg-slate-100 dark:text-zinc-600 dark:bg-transparent cursor-not-allowed'
                  }`}
                >
                  {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                </button>
              </div>
            </div>
            
            <div className="text-center text-xs font-medium text-slate-500 dark:text-zinc-500 mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 drop-shadow-sm">
               <span>Vectoris is an AI built for AlgoLib and can make mistakes.</span>
            </div>
          </div>
        </div>
      </main>
      
      <style>{`
        /* ─── SCROLLBARS ─── */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}