import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Zap, AlertCircle, Send, Loader2, Sparkles, Copy, 
  Check, Edit2, Trash2, Menu, Code2, ArrowRightLeft, 
  Plus, MessageSquare, Maximize2, X, Activity, ChevronLeft, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── FIREBASE IMPORTS ────────────────────────────────────────────────────────
import { auth, firestoreDB as db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, collection, addDoc, updateDoc, serverTimestamp, query, orderBy, deleteDoc } from "firebase/firestore";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from "@/components/Navbar"; 

// ─── LAZY LOADED MARKDOWN & MATH RENDERER ────────────────────────────────────
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

// ─── Graph Data ──────────────────────────────────────────────────────────────
const generateChartData = () => {
  const data = [];
  for (let n = 1; n <= 20; n++) {
    data.push({
      n: n,
      'O(1)': 10, 'O(log N)': Math.log2(n) * 15, 'O(N)': n * 5,
      'O(N log N)': n * Math.log2(n) * 3, 'O(N^2)': Math.pow(n, 2) * 0.5, 'O(2^N)': Math.min(Math.pow(2, n) * 0.1, 300),
    });
  }
  return data;
};

const CHART_DATA = generateChartData();
const COMPLEXITY_COLORS = {
  'O(1)': '#4ade80',       
  'O(log N)': '#38bdf8',   
  'O(N)': '#facc15',       
  'O(N log N)': '#fb923c', 
  'O(N^2)': '#f87171',     
  'O(2^N)': '#c084fc',     
};

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
  const [inputCode, setInputCode] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [credits, setCredits] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Developer');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showLangMenuForIdx, setShowLangMenuForIdx] = useState<number | null>(null);
  
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

  // ─── Firebase Auth & Listeners ─────────────────────────────────────────────
  useEffect(() => {
    let unsubscribeCredits: () => void;
    let unsubscribeHistory: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setCredits(null);
        setHistory([]);
        setUserName('Developer');
        return;
      }
      
      try {
        const token = await user.getIdToken();
        const response = await fetch('/.netlify/functions/get-user-profile', { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
            const { full_name } = await response.json();
            setUserName(full_name || user.displayName || user.email?.split('@')[0] || 'Developer');
        } else {
            setUserName(user.displayName || user.email?.split('@')[0] || 'Developer');
        }
      } catch (err) {
        setUserName(user.displayName || user.email?.split('@')[0] || 'Developer');
      }

      unsubscribeCredits = onSnapshot(doc(db, 'user_credits', user.uid), (docSnap) => {
        if (docSnap.exists()) setCredits(docSnap.data().credits);
        else setCredits(7); 
      });

      const historyQ = query(collection(db, 'users', user.uid, 'analysis_history'), orderBy('updatedAt', 'desc'));
      unsubscribeHistory = onSnapshot(historyQ, (snap) => {
        setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryItem)));
      });
    });

    return () => { 
      unsubscribeAuth(); 
      if (unsubscribeCredits) unsubscribeCredits(); 
      if (unsubscribeHistory) unsubscribeHistory(); 
    }; 
  }, []);

  const saveChatToFirebase = async (chatMessages: ChatMessage[]) => {
    if (!currentUser) return;
    try {
      const dbCollection = collection(db, 'users', currentUser.uid, 'analysis_history');
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
      if (!currentUser) throw new Error("Authentication required.");
      const token = await currentUser.getIdToken();

      const recentHistory = currentMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.role === 'user' ? m.content : (m.result?.type === 'chat' ? m.result.explanation : JSON.stringify(m.result))
      }));

      const response = await fetch('/.netlify/functions/ask-groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code, action, targetLanguage, history: recentHistory })
      });

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

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
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'analysis_history', id));
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

  const isHomeState = messages.length === 0;

  return (
    <div className="flex h-[100dvh] bg-[#131314] text-zinc-100 font-sans overflow-hidden selection:bg-blue-500/30">
      <Helmet><title>Vectoris | AlgoLib AI</title></Helmet>

      {/* ─── FULL-SCREEN MAXIMIZED GRAPH MODAL ─── */}
      <AnimatePresence>
        {activeAnalysis && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setActiveAnalysis(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-5xl bg-[#1a1a1c] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#1e1f20]">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                     <Activity size={20} className="text-blue-400" />
                   </div>
                   <div>
                     <h2 className="text-lg font-bold text-white leading-tight">Complexity Analysis</h2>
                     <p className="text-xs text-zinc-400 font-medium tracking-wide">ALGORITHM GROWTH VISUALIZATION</p>
                   </div>
                </div>
                <button onClick={() => setActiveAnalysis(null)} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                   <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 rounded-3xl bg-[#131314] border border-white/5 shadow-inner">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Time Complexity</span>
                    <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: COMPLEXITY_COLORS[activeAnalysis.timeComplexity as keyof typeof COMPLEXITY_COLORS] || '#38bdf8' }}>
                      {activeAnalysis.timeComplexity}
                    </h3>
                  </div>
                  <div className="p-6 rounded-3xl bg-[#131314] border border-white/5 shadow-inner">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Space Complexity</span>
                    <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: COMPLEXITY_COLORS[activeAnalysis.spaceComplexity as keyof typeof COMPLEXITY_COLORS] || '#4ade80' }}>
                      {activeAnalysis.spaceComplexity}
                    </h3>
                  </div>
                </div>
                
                <div className="h-[300px] md:h-[400px] w-full p-6 rounded-3xl bg-[#131314] border border-white/5 shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="n" stroke="#52525b" tick={{fill: '#71717a', fontSize: 11}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#52525b" tick={{fill: '#71717a', fontSize: 11}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                      {Object.keys(COMPLEXITY_COLORS).map((key) => {
                        const isHighlighted = activeAnalysis.timeComplexity === key;
                        return (
                          <Line 
                            key={key} type="monotone" dataKey={key} 
                            stroke={COMPLEXITY_COLORS[key as keyof typeof COMPLEXITY_COLORS]} 
                            strokeWidth={isHighlighted ? 4 : 1.5} strokeOpacity={isHighlighted ? 1 : 0.2} dot={false} 
                            style={isHighlighted ? { filter: `drop-shadow(0 0 8px ${COMPLEXITY_COLORS[key as keyof typeof COMPLEXITY_COLORS]}60)` } : {}}
                          />
                        );
                      })}
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
        className={`absolute md:relative z-[60] h-full flex flex-col bg-[#1e1e20] transition-all duration-300 ease-in-out shrink-0 border-r border-white/5
        ${isSidebarOpen ? 'w-[280px] translate-x-0' : 'w-[280px] -translate-x-full md:translate-x-0 md:w-0'} overflow-hidden shadow-2xl md:shadow-none`}
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
          <button onClick={handleNewAnalysis} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 rounded-full text-sm font-medium transition-colors text-zinc-200">
            <Edit2 size={18} className="text-zinc-400" /> New chat
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 rounded-full text-sm font-medium transition-colors text-zinc-200">
            <Search size={18} className="text-zinc-400" /> Search chats
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 min-w-[280px] custom-scrollbar">
          <div className="text-[12px] font-medium text-zinc-500 px-2 mb-2 mt-2 tracking-wide">Recent</div>
          {history.length === 0 ? (
            <p className="text-sm text-zinc-600 px-2 italic">No recent history.</p>
          ) : (
            history.map(item => (
              <div 
                key={item.id} 
                onClick={() => loadHistoryItem(item)} 
                className={`group flex items-center justify-between px-3 py-2.5 text-sm rounded-full cursor-pointer transition-colors
                  ${currentChatId === item.id ? 'bg-[#28292b] text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
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

        <div className="mt-auto p-4 border-t border-white/5 min-w-[280px] bg-[#1a1a1c]">
           <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
              {currentUser?.photoURL ? (
                 <img src={currentUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-inner border border-white/10 group-hover:border-white/30 transition-colors" />
              ) : (
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-shadow">
                    {userName.charAt(0).toUpperCase()}
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

      {isSidebarOpen && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-[#131314]">
        
        <header className="flex items-center justify-between p-4 absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#131314] via-[#131314]/80 to-transparent pointer-events-none">
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
                <motion.div variants={itemVariants} className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4facfe]/20 to-[#00f2fe]/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(79,172,254,0.2)]">
                  <Sparkles size={32} className="text-[#4facfe]" />
                </motion.div>
                <motion.h1 variants={itemVariants} className="text-3xl md:text-5xl font-medium text-white tracking-tight text-center mb-10 drop-shadow-sm">
                  Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4facfe] to-[#00f2fe] font-semibold">{userName}</span>
                </motion.h1>
                <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                  {SUGGESTIONS.map((sug, idx) => (
                    <motion.button 
                      variants={itemVariants} key={idx} onClick={() => handleSuggestionClick(sug.text)}
                      className="group flex flex-col gap-4 p-5 rounded-3xl bg-[#1a1a1c] hover:bg-[#222225] text-zinc-300 transition-all duration-300 border border-white/5 hover:border-white/10 text-left h-[110px] shadow-sm hover:shadow-xl hover:-translate-y-1"
                    >
                      <div className="p-2 bg-white/5 w-fit rounded-lg group-hover:bg-[#4facfe]/10 transition-colors">
                        <span className="text-[#4facfe] group-hover:text-[#00f2fe]">{sug.icon}</span> 
                      </div>
                      <span className="text-[13px] font-medium leading-snug">{sug.text}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {!isHomeState && (
              <div className="flex flex-col gap-6 mt-4 pb-4">
                {messages.map((msg, idx) => {
                  const originalCodeMsg = messages.slice(0, idx).reverse().find(m => m.role === 'user');
                  return (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
                      {msg.role === 'user' ? (
                        <div className="flex justify-end w-full mb-2">
                          <div className="bg-[#1e1f20] px-5 py-3.5 rounded-3xl max-w-[90%] md:max-w-[80%] text-zinc-100 text-[15px] leading-relaxed font-sans shadow-sm">
                            <pre className="whitespace-pre-wrap font-sans font-medium">{msg.content}</pre>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3 md:gap-4 w-full">
                          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-transparent mt-1">
                             <Sparkles size={24} className="text-[#4facfe]" />
                          </div>
                          <div className="flex-1 min-w-0 text-[15px] leading-relaxed text-zinc-200">
                            
                            {msg.isError ? (
                               <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200 flex items-center gap-3">
                                 <AlertCircle size={18} className="text-red-400" /> {msg.content}
                               </div>
                            ) : msg.result ? (
                              <div className="ai-response-layout space-y-4 md:space-y-6">
                                
                                {/* ─── LAZY LOADED MARKDOWN HERE ─── */}
                                <Suspense fallback={<div className="flex items-center gap-2 text-zinc-500 text-sm animate-pulse"><Loader2 size={16} className="animate-spin" /> Rendering response...</div>}>
                                  <LazyMarkdown 
                                    content={safeStringify(msg.result.explanation)} 
                                    copiedId={copiedId} 
                                    onCopy={handleCopy} 
                                    messageIndex={idx} 
                                  />
                                </Suspense>

                                {msg.result.type === 'analysis' && (
                                  <div 
                                    onClick={() => setActiveAnalysis(msg.result as AnalysisResult)}
                                    className="mt-4 p-4 md:p-5 rounded-3xl bg-gradient-to-r from-[#1a1a1c] to-[#1e1f20] border border-white/10 cursor-pointer hover:border-[#4facfe]/30 transition-all shadow-md group flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 bg-[#4facfe]/10 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                          <Activity size={24} className="text-[#4facfe]" />
                                       </div>
                                       <div>
                                          <h4 className="text-[15px] font-bold text-white mb-0.5">Execution Matrix</h4>
                                          <div className="flex items-center gap-3 text-[12px] font-medium">
                                            <span className="text-zinc-400 flex items-center gap-1">Time: <span style={{ color: COMPLEXITY_COLORS[msg.result.timeComplexity as keyof typeof COMPLEXITY_COLORS] || '#38bdf8' }}>{msg.result.timeComplexity}</span></span>
                                            <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                            <span className="text-zinc-400 flex items-center gap-1">Space: <span style={{ color: COMPLEXITY_COLORS[msg.result.spaceComplexity as keyof typeof COMPLEXITY_COLORS] || '#4ade80' }}>{msg.result.spaceComplexity}</span></span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#4facfe] bg-[#4facfe]/10 px-3 py-1.5 rounded-full group-hover:bg-[#4facfe]/20 transition-colors">
                                      Tap to expand <Maximize2 size={14} />
                                    </div>
                                    <div className="sm:hidden text-[#4facfe] p-2 bg-[#4facfe]/10 rounded-full">
                                      <Maximize2 size={16} />
                                    </div>
                                  </div>
                                )}

                                {msg.result.type === 'analysis' && (
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    <button onClick={() => handleOptimize(originalCodeMsg?.content || '')} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1e1f20] hover:bg-[#28292b] border border-white/5 text-[13px] font-medium text-zinc-300 transition-colors">
                                      <Code2 size={16} className="text-emerald-400"/> Optimize Code
                                    </button>
                                    <div className="relative">
                                      <button onClick={() => setShowLangMenuForIdx(showLangMenuForIdx === idx ? null : idx)} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1e1f20] hover:bg-[#28292b] border border-white/5 text-[13px] font-medium text-zinc-300 transition-colors">
                                        <ArrowRightLeft size={16} className="text-purple-400"/> Translate
                                      </button>
                                      <AnimatePresence>
                                        {showLangMenuForIdx === idx && (
                                          <motion.div 
                                            initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }} transition={{ duration: 0.15 }}
                                            className="absolute bottom-full left-0 mb-2 w-[150px] bg-[#28292b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden py-2 z-50"
                                          >
                                            {TRANSLATE_LANGS.map(lang => (
                                              <button key={lang} onClick={() => handleTranslate(originalCodeMsg?.content || '', lang)} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors">
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
                                        content={`\`\`\`${msg.result.type === 'optimization' ? 'optimized' : 'translation'}\n${safeStringify(msg.result.code)}\n\`\`\``} 
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
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 w-full">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-transparent mt-1">
                      <Loader2 className="animate-spin text-[#4facfe]" size={24} />
                    </div>
                    <div className="flex items-center h-10">
                      <span className="text-zinc-500 font-medium animate-pulse text-[15px]">Vectoris is analyzing...</span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
            
            <div className="h-32 md:h-40 shrink-0" />
            <div ref={messagesEndRef} />
            
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#131314] via-[#131314] to-transparent pt-12 pb-4 md:pb-6 pointer-events-none">
          <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pointer-events-auto">
            <div className="relative flex flex-col bg-[#1e1f20] rounded-[28px] p-2 pr-3 border border-white/10 focus-within:bg-[#222225] focus-within:border-white/20 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
              <div className="flex items-end">
                <button className="p-3 mb-[2px] text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-full transition-colors shrink-0 hidden sm:block">
                  <Plus size={22} />
                </button>
                <textarea
                  ref={textareaRef}
                  value={inputCode}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Vectoris"
                  className="flex-1 max-h-[200px] bg-transparent text-white resize-none outline-none py-3.5 px-3 sm:px-2 text-[15px] md:text-base custom-scrollbar placeholder:text-zinc-500 leading-relaxed"
                  rows={1}
                  disabled={isAnalyzing}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={!inputCode.trim() || isAnalyzing}
                  className={`p-3 mb-[2px] rounded-full transition-all shrink-0 ${
                    inputCode.trim() && !isAnalyzing
                      ? 'text-[#131314] bg-white hover:scale-105 active:scale-95 shadow-md'
                      : 'text-zinc-600 bg-transparent cursor-not-allowed'
                  }`}
                >
                  {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                </button>
              </div>
            </div>
            
            <div className="text-center text-[11px] text-zinc-500 mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.2); }

        /* ─── KATEX/MARKDOWN TYPOGRAPHY FIXES ─── */
        .chat-prose h1, .chat-prose h2, .chat-prose h3 { color: #fff; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; line-height: 1.3;}
        .chat-prose h1 { font-size: 1.5em; padding-bottom: 0.3em; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .chat-prose h2 { font-size: 1.25em; }
        .chat-prose ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .chat-prose ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        .chat-prose li { margin-bottom: 0.5em; }
        .chat-prose strong { color: #fff; font-weight: 600; }
        .chat-prose p { margin-bottom: 1em; line-height: 1.6; }
        .chat-prose .katex-display { margin: 1em 0; overflow-x: auto; overflow-y: hidden; padding-bottom: 8px; }
      `}</style>
    </div>
  );
}