import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Zap, AlertCircle, Send, Loader2, Code2, ArrowRightLeft, 
  Plus, MessageSquare, Maximize2, X, Activity, ChevronLeft, Menu, Trash2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── FIREBASE & CONTEXT IMPORTS ──────────────────────────────────────────────
import { firestoreDB as db } from "@/lib/firebase";
import { doc, onSnapshot, collection, addDoc, updateDoc, serverTimestamp, query, orderBy, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from "@/components/Navbar"; 

// ─── MATH RENDERING IMPORTS ──────────────────────────────────────────────────
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// ─── LAZY LOADED MARKDOWN RENDERER ───────────────────────────────────────────
const LazyMarkdown = React.lazy(() => import('@/components/MarkdownRenderer'));

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnalysisResult {
  type: 'analysis' | 'optimization' | 'translation' | 'chat'; 
  timeComplexity?: string; 
  spaceComplexity?: string;
  explanation: string;
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

// ─── Dynamic Graph Parsing Logic (Strict Mathematical Plotter) ──────────────────────
const parseComplexity = (str?: string) => {
  const s = (str || '').toLowerCase();
  
  // 1. Strip visual LaTeX formatting but KEEP the math content inside the braces
  let cleanStr = s.replace(/\\(?:mathrm|text|operatorname|mathit|mathbf|mathcal|mathsf)\{([^}]+)\}/g, '$1');
  
  // 2. Remove other stray LaTeX commands, but preserve essential math operators
  cleanStr = cleanStr.replace(/\\[a-zA-Z]+/g, (match) => {
    if (match === '\\sqrt' || match === '\\log' || match === '\\ln') return match;
    return ''; 
  });

  // 3. Extract the core expression inside O(...)
  const oMatch = cleanStr.match(/o\s*\((.*)\)/);
  const coreExpr = oMatch ? oMatch[1] : cleanStr;

  // 4. Pure Mathematical Mapping (NO scaling modifiers)
  if (coreExpr.includes('!')) {
    // True Factorial calculation
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
       // +1 prevents log2(1) from being 0, improving the visual start of the curve
       return { name: 'Linearithmic', fn: (n: number) => n * Math.log2(n + 1), color: '#fb923c' };
    }
  }
  
  if (hasRoot) {
    return { name: 'Square Root', fn: (n: number) => Math.sqrt(n), color: '#a3e635' };
  }
  
  if (hasLog) {
    return { name: 'Logarithmic', fn: (n: number) => Math.log2(n + 1), color: '#38bdf8' };
  }
  
  if (hasN) {
    return { name: 'Linear', fn: (n: number) => n, color: '#facc15' };
  }

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
        rehypePlugins={[rehypeKatex]} 
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

const safeStringify = (data: any): string => {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    try {
      return Object.entries(data).map(([key, value]) => `/* --- ${key} --- */\n${value}`).join('\n\n');
    } catch (e) {
      return JSON.stringify(data, null, 2);
    }
  }
  return String(data);
};

// --- Framer Motion Variants ---
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

export default function Analyzer() {
  const { user, profile } = useAuth(); 
  const [credits, setCredits] = useState<number | null>(null);

  const currentUser = user;
  const userName = (profile && (profile.display_name || (profile as any).name)) || user?.displayName || (user?.email ? user.email.split('@')[0] : 'Guest');

  const [inputCode, setInputCode] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewAnalysis = () => {
    setMessages([]);
    setInputCode('');
    setChatId(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false); 
  };

  const handleSuggestionClick = (text: string) => {
    setInputCode(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
    }
  };

  // ─── Firebase Listeners ────────────────────────────────
  useEffect(() => {
    let unsubscribeCredits: () => void;
    let unsubscribeHistory: () => void;

    if (user) {
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
    if (!user) return;
    try {
      const dbCollection = collection(db, 'users', user.uid, 'analysis_history');
      if (chatIdRef.current) {
        await updateDoc(doc(dbCollection, chatIdRef.current), { messages: chatMessages, updatedAt: serverTimestamp() });
      } else {
        const firstUserMsg = chatMessages.find(m => m.role === 'user');
        const generatedTitle = firstUserMsg ? firstUserMsg.content.substring(0, 40) + '...' : 'New Chat';
        const docRef = await addDoc(dbCollection, { title: generatedTitle, messages: chatMessages, timestamp: serverTimestamp(), updatedAt: serverTimestamp() });
        setChatId(docRef.id);
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
        content: m.role === 'user' ? m.content : (m.result?.type === 'chat' ? m.result.explanation : JSON.stringify(m.result))
      }));

      const response = await fetch('/.netlify/functions/ask-groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code, action, targetLanguage, history: recentHistory })
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          throw new Error("Credits finished. Credits renews after 3hr.");
        }
        throw new Error(`Something went wrong (Error ${response.status}). Please try again.`);
      }

      const data = await response.json();
      const aiResult = JSON.parse(data.choices[0].message.content) as AnalysisResult & { error?: string };
      
      if (aiResult.error) throw new Error(aiResult.error);

      const finalMessages: ChatMessage[] = [...currentMessages, { role: 'ai', content: '', result: aiResult }];
      setMessages(finalMessages);
      await saveChatToFirebase(finalMessages);

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
      if (currentChatId === id) handleNewAnalysis(); 
    } catch (err) { console.error(err); }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setChatId(item.id);
    if (item.messages && item.messages.length > 0) setMessages(item.messages);
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

  // ─── DYNAMIC GRAPH DATA COMPUTATION ───
  const activeParsedComplexity = activeAnalysis ? parseComplexity(activeAnalysis.timeComplexity) : null;
  
  // Adjusted domains based on pure math growth to prevent axis breaking
  let maxN = 20;
  if (activeParsedComplexity) {
    if (activeParsedComplexity.name === 'Factorial') maxN = 8; // 8! = 40,320
    else if (activeParsedComplexity.name === 'Exponential') maxN = 15; // 2^15 = 32,768
  }

  const dynamicChartData = activeParsedComplexity 
    ? Array.from({ length: maxN }, (_, i) => ({ n: i + 1, value: activeParsedComplexity.fn(i + 1) }))
    : [];

  const formatYAxis = (num: number) => {
    return Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  return (
    <div className="flex h-[100dvh] bg-[#0c0c0e] text-zinc-100 font-sans overflow-hidden selection:bg-blue-500/30">
      <Helmet><title>Vectoris | AlgoLib</title></Helmet>

      {/* ─── CUSTOM TOAST ALERTS ─── */}
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

      {/* ─── FULL-SCREEN MAXIMIZED GRAPH MODAL ─── */}
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
                    <FormattedComplexity 
                      text={activeAnalysis.timeComplexity} 
                      color={activeParsedComplexity.color}
                      className="text-4xl md:text-5xl font-extrabold drop-shadow-md" 
                    />
                  </div>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Space Complexity</span>
                    <FormattedComplexity 
                      text={activeAnalysis.spaceComplexity} 
                      color={parseComplexity(activeAnalysis.spaceComplexity).color}
                      className="text-4xl md:text-5xl font-extrabold drop-shadow-md" 
                    />
                  </div>
                </div>
                
                <div className="h-[300px] md:h-[400px] w-full p-6 rounded-3xl bg-black/20 border border-white/5 shadow-inner relative">
                  <div className="absolute top-8 left-8 text-[11px] font-bold text-zinc-500 uppercase tracking-widest z-10">
                    Behavior: <span style={{ color: activeParsedComplexity.color }}>{activeParsedComplexity.name}</span>
                  </div>

                  {/* FIX: Formatted Y-Axis and explicit margins */}
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dynamicChartData} margin={{ top: 40, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="n" 
                        stroke="#52525b" 
                        tick={{fill: '#71717a', fontSize: 11}} 
                        axisLine={false} 
                        tickLine={false} 
                        minTickGap={15}
                      />
                      <YAxis 
                        stroke="#52525b" 
                        tick={{fill: '#71717a', fontSize: 11}} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={formatYAxis}
                        width={40}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(20,20,22,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        labelFormatter={(label) => `Input Size (N): ${label}`}
                        formatter={(val: number) => [formatYAxis(val), 'Operations']} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={activeParsedComplexity.color} 
                        strokeWidth={3} 
                        dot={false} 
                        style={{ filter: `drop-shadow(0 0 10px ${activeParsedComplexity.color}80)` }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── SIDEBAR ─── */}
      <aside 
        className={`absolute md:relative z-[60] h-full flex flex-col bg-white/5 backdrop-blur-2xl transition-all duration-300 ease-in-out shrink-0 border-r border-white/10
        ${isSidebarOpen ? 'w-[280px] translate-x-0' : 'w-[280px] -translate-x-full md:translate-x-0 md:w-0'} overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.5)] md:shadow-none`}
      >
        <div className="p-4 flex items-center justify-between min-w-[280px] h-[72px]">
          <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]">
            <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center shadow-[0_2px_10px_rgba(79,172,254,0.4)]">
               <Zap size={16} className="text-white fill-white" />
            </div>
            <span className="text-[20px] font-medium text-white tracking-tight leading-none">Vectoris</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 transition-colors shrink-0">
            <ChevronLeft size={20} />
          </button>
        </div>
        
        <div className="px-3 pb-4 pt-2 min-w-[280px] flex flex-col gap-1">
          <button onClick={handleNewAnalysis} className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-medium transition-all text-zinc-200">
            <Plus size={18} className="text-zinc-400" /> New analysis
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 min-w-[280px] custom-scrollbar">
          <div className="text-[12px] font-medium text-zinc-500 px-2 mb-2 mt-2 tracking-wide uppercase">Recent</div>
          {history.length === 0 ? (
            <p className="text-sm text-zinc-600 px-2 italic">No recent history.</p>
          ) : (
            history.map(item => (
              <div 
                key={item.id} 
                onClick={() => loadHistoryItem(item)} 
                className={`group flex items-center justify-between px-3 py-2.5 text-sm rounded-xl cursor-pointer transition-colors
                  ${currentChatId === item.id ? 'bg-white/15 text-white font-medium border border-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={14} className="shrink-0 text-zinc-500 group-hover:text-zinc-400" />
                  <span className="truncate">{item.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDeleteHistory(e, item.id)} 
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 shrink-0 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-auto p-4 border-t border-white/10 min-w-[280px] bg-black/20">
           <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
              {currentUser?.photoURL ? (
                 <img src={currentUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-inner border border-white/20 group-hover:border-white/40 transition-colors" />
              ) : (
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-shadow">
                    {userName?.charAt(0).toUpperCase()}
                 </div>
              )}
              <div className="flex flex-col flex-1 overflow-hidden">
                 <span className="text-sm font-semibold text-zinc-200 truncate">{userName}</span>
                 <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5 mt-0.5">
                    <Zap size={12} className="text-yellow-500 fill-yellow-500" /> {credits !== null ? credits : '-'} Credits left
                 </span>
              </div>
           </div>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a24] via-[#0c0c0e] to-[#0c0c0e]">
        
        <header className="flex items-center justify-between p-4 absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#0c0c0e] via-[#0c0c0e]/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 transition-colors">
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
                <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-semibold text-white tracking-tight text-center mb-12 drop-shadow-lg">
                  Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4facfe] to-[#00f2fe]">{userName}</span>
                </motion.h1>
                <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                  {SUGGESTIONS.map((sug, idx) => (
                    <motion.button 
                      variants={itemVariants} key={idx} onClick={() => handleSuggestionClick(sug.text)}
                      className="group flex flex-col gap-4 p-5 rounded-3xl bg-white/5 backdrop-blur-md hover:bg-white/10 text-zinc-300 transition-all duration-300 border border-white/10 hover:border-white/20 text-left h-[120px] shadow-lg hover:-translate-y-1"
                    >
                      <div className="p-2 bg-white/10 w-fit rounded-xl group-hover:bg-[#4facfe]/20 transition-colors border border-white/5">
                        <span className="text-[#4facfe] group-hover:text-[#00f2fe] drop-shadow-md">{sug.icon}</span> 
                      </div>
                      <span className="text-sm font-medium leading-snug">{sug.text}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {!isHomeState && (
              <div className="flex flex-col gap-8 mt-4 pb-4">
                {messages.map((msg, idx) => {
                  const originalCodeMsg = messages.slice(0, idx).reverse().find(m => m.role === 'user');
                  return (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
                      {msg.role === 'user' ? (
                        <div className="flex justify-end w-full mb-2">
                          <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-3xl max-w-[90%] md:max-w-[80%] text-zinc-100 text-[15px] leading-relaxed font-sans shadow-lg border border-white/10">
                            <pre className="whitespace-pre-wrap font-sans font-medium">{msg.content}</pre>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-4 w-full">
                          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#4facfe] to-[#00f2fe] mt-1 shadow-lg shadow-blue-500/20 border border-white/10">
                             <Zap size={18} className="text-white fill-white" />
                          </div>
                          <div className="flex-1 min-w-0 text-[15px] leading-relaxed text-zinc-200 pt-1">
                            
                            {msg.isError ? (
                               <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-md text-red-200 flex items-center gap-3">
                                 <AlertCircle size={18} className="text-red-400" /> {msg.content}
                               </div>
                            ) : msg.result ? (
                              <div className="space-y-6">
                                
                                <Suspense fallback={<div className="flex items-center gap-2 text-zinc-500 text-sm animate-pulse"><Loader2 size={16} className="animate-spin" /> Rendering response...</div>}>
                                  <LazyMarkdown 
                                    content={safeStringify(msg.result.explanation)} 
                                    copiedId={copiedId} 
                                    onCopy={handleCopy} 
                                    messageIndex={idx} 
                                  />
                                </Suspense>

                                {/* ─── INLINE GRAPH PREVIEW (WITH MATH RENDERING) ─── */}
                                {msg.result.type === 'analysis' && (
                                  <div 
                                    onClick={() => setActiveAnalysis(msg.result as AnalysisResult)}
                                    className="mt-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 cursor-pointer hover:border-[#4facfe]/50 transition-all shadow-lg overflow-hidden group"
                                  >
                                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                                       <div className="flex items-center gap-3">
                                          <Activity size={18} className="text-[#4facfe]" />
                                          <h4 className="text-[14px] font-bold text-white tracking-wide">Execution Matrix</h4>
                                       </div>
                                       <div className="flex items-center gap-2 text-xs font-semibold text-[#4facfe] bg-[#4facfe]/10 px-3 py-1 rounded-full group-hover:bg-[#4facfe]/20 transition-colors border border-[#4facfe]/20">
                                         Tap to expand <Maximize2 size={12} />
                                       </div>
                                    </div>
                                    
                                    <div className="p-5 flex items-center justify-between bg-gradient-to-br from-transparent to-[#ffffff03]">
                                       <div className="flex flex-col gap-2">
                                         <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Time Complexity</div>
                                         <FormattedComplexity 
                                            text={msg.result.timeComplexity}
                                            color={parseComplexity(msg.result.timeComplexity).color}
                                            className="text-2xl font-black drop-shadow-md"
                                         />
                                       </div>
                                       <div className="h-12 w-[1px] bg-white/10 mx-4"></div>
                                       <div className="flex flex-col gap-2 text-right">
                                         <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Space Complexity</div>
                                         <FormattedComplexity 
                                            text={msg.result.spaceComplexity}
                                            color={parseComplexity(msg.result.spaceComplexity).color}
                                            className="text-2xl font-black drop-shadow-md"
                                         />
                                       </div>
                                    </div>
                                  </div>
                                )}

                                {/* ─── ACTION BUTTONS ─── */}
                                {msg.result.type === 'analysis' && (
                                  <div className="flex flex-wrap gap-3 mt-2">
                                    <button onClick={() => handleOptimize(originalCodeMsg?.content || '')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 backdrop-blur-md hover:bg-white/10 border border-white/10 text-sm font-semibold text-zinc-200 transition-all shadow-md">
                                      <Code2 size={16} className="text-emerald-400"/> Optimize Code
                                    </button>
                                    <div className="relative">
                                      <button onClick={() => setShowLangMenuForIdx(showLangMenuForIdx === idx ? null : idx)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 backdrop-blur-md hover:bg-white/10 border border-white/10 text-sm font-semibold text-zinc-200 transition-all shadow-md">
                                        <ArrowRightLeft size={16} className="text-purple-400"/> Translate
                                      </button>
                                      <AnimatePresence>
                                        {showLangMenuForIdx === idx && (
                                          <motion.div 
                                            initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }} transition={{ duration: 0.15 }}
                                            className="absolute bottom-full left-0 mb-3 w-[160px] bg-[#1a1a24]/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden py-2 z-50"
                                          >
                                            {TRANSLATE_LANGS.map(lang => (
                                              <button key={lang} onClick={() => handleTranslate(originalCodeMsg?.content || '', lang)} className="w-full text-left px-5 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors">
                                                {lang}
                                              </button>
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                )}

                                {(msg.result.type === 'optimization' || msg.result.type === 'translation') && (
                                  <div className="mt-4">
                                    <Suspense fallback={<Loader2 className="animate-spin text-zinc-500" />}>
                                      <LazyMarkdown 
                                        content={`\`\`\`plaintext\n${safeStringify(msg.result.code)}\n\`\`\``} 
                                        copiedId={copiedId} 
                                        onCopy={handleCopy} 
                                        messageIndex={idx} 
                                      />
                                    </Suspense>
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
                      <span className="text-zinc-400 font-medium animate-pulse text-[15px]">Vectoris is analyzing...</span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
            
            <div className="h-36 md:h-44 shrink-0" />
            <div ref={messagesEndRef} />
            
          </div>
        </div>

        {/* ─── BOTTOM INPUT AREA ─── */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/90 to-transparent pt-12 pb-6 md:pb-8 pointer-events-none">
          <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pointer-events-auto">
            <div className="relative flex flex-col bg-white/5 backdrop-blur-xl rounded-[32px] p-2 pr-3 border border-white/20 focus-within:bg-white/10 focus-within:border-white/30 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex items-end">
                <button 
                  onClick={handleAttachmentClick}
                  className="p-3.5 mb-[2px] text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0 hidden sm:block"
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
                  className="flex-1 max-h-[200px] bg-transparent text-white resize-none outline-none py-4 px-3 sm:px-2 text-[15px] md:text-base custom-scrollbar placeholder:text-zinc-500 leading-relaxed font-medium"
                  rows={1}
                  disabled={isAnalyzing}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={!inputCode.trim() || isAnalyzing}
                  className={`p-3.5 mb-[2px] rounded-full transition-all shrink-0 ${
                    inputCode.trim() && !isAnalyzing
                      ? 'text-black bg-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                      : 'text-zinc-600 bg-transparent cursor-not-allowed'
                  }`}
                >
                  {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                </button>
              </div>
            </div>
            
            <div className="text-center text-xs font-medium text-zinc-500 mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 drop-shadow-sm">
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