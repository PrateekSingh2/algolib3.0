import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Zap, AlertCircle, Send, Loader2, Sparkles, Copy, 
  Check, Edit2, Trash2, Menu, Code2, ArrowRightLeft, Plus, MessageSquare
} from 'lucide-react';

// ─── FIREBASE IMPORTS ────────────────────────────────────────────────────────
import { auth, firestoreDB as db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, collection, addDoc, updateDoc, serverTimestamp, query, orderBy, deleteDoc } from "firebase/firestore";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from "@/components/Navbar"; 

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
  'O(1)': '#81c995', 'O(log N)': '#8ab4f8', 'O(N)': '#fde293',       
  'O(N log N)': '#fcad70', 'O(N^2)': '#f28b82', 'O(2^N)': '#c58af9',     
};

const TRANSLATE_LANGS = ["Python", "Java", "C++", "JavaScript", "Go", "Rust"];

const SUGGESTIONS = [
  { icon: <Zap size={14}/>, text: "Optimize sorting algorithm" },
  { icon: <Code2 size={14}/>, text: "Explain dynamic programming" },
  { icon: <ArrowRightLeft size={14}/>, text: "Translate Python to C++" },
  { icon: <AlertCircle size={14}/>, text: "Find memory leaks" },
];

// ─── Utility: Custom Markdown Parser for Text & Code Blocks ──────────────────
const formatTextWithMarkdown = (text: string) => {
  let html = text
    .replace(/^### (.*$)/gim, '<h3 class="chat-h3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="chat-h2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="chat-h1">$1</h1>')
    .replace(/^\s*[\*\-] (.*$)/gim, '<li class="chat-li">$1</li>')
    .replace(/^\s*\d+\.\s*(.*$)/gim, '<li class="chat-li-ordered">$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="chat-strong">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');

  html = html.split('\n').map(line => {
    const t = line.trim();
    if (t.startsWith('<h') || t.startsWith('<li')) return line;
    return line + '<br/>';
  }).join('\n').replace(/(<br\/>\s*){3,}/g, '<br/><br/>');

  return html;
};

const renderFormattedText = (text: string, onCopy: (text: string) => void) => {
  if (!text) return null;
  
  const blockRegex = new RegExp('\\x60\\x60\\x60([\\s\\S]*?)\\x60\\x60\\x60', 'g');
  const parts = text.split(blockRegex);

  return parts.map((part, index) => {
    if (index % 2 === 1) {
      const lines = part.trim().split('\n');
      const firstLine = lines[0].trim();
      const hasLang = firstLine && !firstLine.includes(' ');
      const language = hasLang ? firstLine : 'code';
      const code = hasLang ? lines.slice(1).join('\n') : part.trim();

      return (
        <div key={index} className="chat-code-block">
          <div className="chat-code-header">
            <span>{language}</span>
            <button onClick={() => onCopy(code)} className="action-btn text-xs">
              <Copy size={12} /> Copy
            </button>
          </div>
          <pre><code>{code}</code></pre>
        </div>
      );
    }
    
    if (part.trim() === '') return null;
    const formattedHTML = formatTextWithMarkdown(part);
    return <span key={index} className="chat-prose block" dangerouslySetInnerHTML={{ __html: formattedHTML }} />;
  });
};

const safeStringify = (data: any): string => {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    try {
      return Object.entries(data)
        .map(([key, value]) => `/* --- ${key} --- */\n${value}`)
        .join('\n\n');
    } catch (e) {
      return JSON.stringify(data, null, 2);
    }
  }
  return String(data);
};

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

  const handleEdit = (text: string) => {
    setInputCode(text);
    if (textareaRef.current) textareaRef.current.focus();
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
      setMessages([...currentMessages, { role: 'ai', content: err.message || "An error occurred.", isError: true }]);
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
    <div className="analyzer-root">
      <Helmet><title>AlgoLib AI Assistant</title></Helmet>
      <div className="navbar-wrapper"><Navbar /></div>
      <div className="navbar-spacer"></div>

      <div className="layout-container">
        {isSidebarOpen && <div className="sidebar-backdrop md:hidden" onClick={() => setIsSidebarOpen(false)} />}
        
        <aside className={`gemini-sidebar glass-panel ${isSidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hamburger-btn" title="Expand menu">
              <Menu size={20} />
            </button>
          </div>

          <div className="sidebar-actions">
            <button onClick={handleNewAnalysis} className="new-chat-btn glow-hover">
              <Plus size={20} className="icon-shrink" />
              {isSidebarOpen && <span>New chat</span>}
            </button>
          </div>

          {isSidebarOpen && (
            <div className="history-container custom-scrollbar">
              <div className="history-title">Recent Chats</div>
              <div className="history-list">
                {history.length === 0 ? (
                  <p className="empty-history">No history saved.</p>
                ) : (
                  history.map(item => (
                    <div key={item.id} className={`history-item group ${currentChatId === item.id ? 'active' : ''}`} onClick={() => loadHistoryItem(item)}>
                      <div className="history-content">
                        <MessageSquare size={16} className={currentChatId === item.id ? "text-blue-400" : "text-zinc-500"} />
                        <span className={`history-text ${currentChatId === item.id ? "text-blue-100" : "text-bdc1c6"}`}>{item.title}</span>
                      </div>
                      <button onClick={(e) => handleDeleteHistory(e, item.id)} className="delete-btn opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>

        <main className="app-viewport">
          <div className="top-utilities">
            <div className="md:hidden">
              {!isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(true)} className="hamburger-btn mobile-hamburger"><Menu size={20} /></button>
              )}
            </div>
            <div className="tokens-indicator ml-auto glass-panel">
              <Zap size={14} className={credits && credits > 0 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'text-red-400'} />
              <span>{credits !== null ? `${credits} credits` : 'Connecting...'}</span>
            </div>
          </div>

          {!isHomeState && (
            <div className="chat-scroll-area custom-scrollbar">
              <div className="chat-content-bounds">
                {messages.map((msg, idx) => {
                  const originalCodeMsg = messages.slice(0, idx).reverse().find(m => m.role === 'user');
                  return (
                    <div key={idx} className={`message-row ${msg.role} group`}>
                      {msg.role === 'ai' && <div className="ai-avatar pulse-glow"><Zap size={18} color="#fff" fill="#fff" /></div>}
                      
                      <div className="message-bubble">
                        {msg.role === 'user' ? (
                          <div className="user-message-wrapper">
                            <div className="user-text-bubble">
                              <pre className="user-code"><code>{msg.content}</code></pre>
                            </div>
                            <div className="message-actions hidden group-hover:flex gap-2 mt-2 justify-end">
                              <button onClick={() => handleEdit(msg.content)} className="action-btn" title="Edit Prompt"><Edit2 size={14} /></button>
                              <button onClick={() => handleCopy(msg.content, `user-${idx}`)} className="action-btn">
                                {copiedId === `user-${idx}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        ) : msg.isError ? (
                          <div className="error-card"><AlertCircle size={18} /><span>{msg.content}</span></div>
                        ) : msg.result ? (
                          <div className="ai-response-layout">
                            
                            {/* Chat/General Intent Rendering */}
                            {msg.result.type === 'chat' && (
                              <div className="chat-response-card">
                                {renderFormattedText(safeStringify(msg.result.explanation), (text) => handleCopy(text, `chat-code-${idx}`))}
                              </div>
                            )}

                            {/* Analysis Layout */}
                            {msg.result.type === 'analysis' && (
                              <>
                                <p className="response-text">Here is the performance breakdown:</p>
                                <div className="analysis-card relative group/card flex gap-6 flex-col md:flex-row glass-panel">
                                  <div className="complexity-box flex-1">
                                    <span className="complexity-label">Time Complexity</span>
                                    <h2 className="complexity-value glow-text" style={{ color: COMPLEXITY_COLORS[msg.result.timeComplexity as keyof typeof COMPLEXITY_COLORS] || '#8ab4f8' }}>
                                      {msg.result.timeComplexity}
                                    </h2>
                                  </div>
                                  <div className="complexity-box flex-1 md:border-l border-zinc-700/50 md:pl-6">
                                    <span className="complexity-label">Space Complexity</span>
                                    <h2 className="complexity-value glow-text" style={{ color: COMPLEXITY_COLORS[msg.result.spaceComplexity as keyof typeof COMPLEXITY_COLORS] || '#81c995' }}>
                                      {msg.result.spaceComplexity}
                                    </h2>
                                  </div>
                                </div>
                                <div className="chat-response-card mt-2">
                                  {renderFormattedText(safeStringify(msg.result.explanation), (text) => handleCopy(text, `chat-code-${idx}`))}
                                </div>
                                <div className="graph-card glass-panel mt-4">
                                  <span className="graph-label">Time Growth Visualization</span>
                                  <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={260}>
                                      <LineChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#3c4043" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="n" stroke="#9aa0a6" tick={{fill: '#9aa0a6', fontSize: 12}} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#9aa0a6" tick={{fill: '#9aa0a6', fontSize: 12}} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e1f20', border: '1px solid #3c4043', borderRadius: '8px', color: '#e3e3e3' }} />
                                        {Object.keys(COMPLEXITY_COLORS).map((key) => {
                                          const isHighlighted = msg.result!.timeComplexity === key;
                                          return <Line key={key} type="monotone" dataKey={key} stroke={COMPLEXITY_COLORS[key as keyof typeof COMPLEXITY_COLORS]} strokeWidth={isHighlighted ? 3 : 1} strokeOpacity={isHighlighted ? 1 : 0.2} dot={false} />;
                                        })}
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                                <div className="suggested-actions mt-4">
                                  <span className="actions-title">Suggested Actions</span>
                                  <div className="actions-grid">
                                    <button onClick={() => handleOptimize(originalCodeMsg?.content || '')} className="suggest-btn optimize">
                                      <Code2 size={16} /> Optimize Code <span className="badge free">Free</span>
                                    </button>
                                    <div className="relative">
                                      <button onClick={() => setShowLangMenuForIdx(showLangMenuForIdx === idx ? null : idx)} className="suggest-btn translate">
                                        <ArrowRightLeft size={16} /> Translate <span className="badge cost">-1 Credit</span>
                                      </button>
                                      {showLangMenuForIdx === idx && (
                                        <div className="translate-menu glass-panel">
                                          {TRANSLATE_LANGS.map(lang => (
                                            <button key={lang} onClick={() => handleTranslate(originalCodeMsg?.content || '', lang)}>{lang}</button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {(msg.result.type === 'optimization' || msg.result.type === 'translation') && (
                              <div className="code-result-wrapper">
                                <div className="code-result-card glass-panel">
                                  <div className="result-header">
                                    <span>{msg.result.type === 'optimization' ? 'Optimized Version' : 'Translated Version'}</span>
                                    <button onClick={() => handleCopy(safeStringify(msg.result!.code), `code-${idx}`)} className="action-btn">
                                      {copiedId === `code-${idx}` ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                  </div>
                                  <pre className="result-code custom-scrollbar"><code>{safeStringify(msg.result.code)}</code></pre>
                                </div>
                                <div className="chat-response-card mt-2 border-l-2 border-blue-500 pl-4">
                                  {renderFormattedText(safeStringify(msg.result.explanation), (text) => handleCopy(text, `chat-code-${idx}`))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                
                {isAnalyzing && (
                  <div className="message-row ai">
                    <div className="ai-avatar pulse-glow"><Sparkles size={16} color="#fff" /></div>
                    <div className="message-bubble loading-bubble"><Loader2 className="spinner" size={18} /><span>Processing context...</span></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          <div className={`input-dock-area ${isHomeState ? 'state-centered' : 'state-docked'}`}>
            <div className="input-bounds w-full max-w-4xl mx-auto">
              
              {isHomeState && (
                <div className="greeting-header flex items-center justify-center gap-4 mb-8">
                  <h1 className="text-3xl md:text-[40px] font-normal text-white tracking-tight">Want to clarify concepts?</h1>
                  <Sparkles className="text-zinc-500 w-8 h-8 md:w-10 md:h-10 opacity-60" strokeWidth={1} />
                </div>
              )}
              
              {/* Google AI Studio Style Animated Input Box */}
              <div className="ai-studio-input-wrapper">
                <div className="ai-studio-input-inner">
                  <textarea
                    ref={textareaRef}
                    className="w-full bg-transparent text-gray-200 resize-none outline-none min-h-[44px] text-[15px] md:text-base custom-scrollbar placeholder:text-zinc-500"
                    placeholder="Ask anything about Computer Science..."
                    value={inputCode}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={isAnalyzing}
                  />
                  
                  {/* Bottom Controls - Icons Removed, Button Right-Aligned */}
                  <div className="flex justify-end items-end mt-1">
                    <button 
                      className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium text-[13px] transition-all ${
                        inputCode.trim() && !isAnalyzing 
                          ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]' 
                          : 'bg-white/5 text-zinc-500 cursor-not-allowed'
                      }`}
                      onClick={handleAnalyze} 
                      disabled={!inputCode.trim() || isAnalyzing}
                    >
                      {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {inputCode.trim() ? "Submit" : "Ready"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggestion Chips */}
              {isHomeState && (
                <div className="flex gap-3 justify-center md:justify-start mt-6 overflow-x-auto hide-scrollbar pb-2">
                  {SUGGESTIONS.map((sug, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleSuggestionClick(sug.text)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 hover:bg-white/5 hover:border-white/20 text-zinc-300 text-sm whitespace-nowrap transition-all shadow-sm"
                    >
                      <span className="text-zinc-400">{sug.icon}</span> {sug.text}
                    </button>
                  ))}
                </div>
              )}

              <div className="text-center text-xs text-zinc-600 mt-6">
                AlgoLib AI may produce inaccurate information. Always verify critical system code.
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        /* Core Layout */
        .analyzer-root { height: 100vh; overflow: hidden; background-color: #0d0d10; color: #e3e3e3; display: flex; flex-direction: column; font-family: ui-sans-serif, system-ui, sans-serif;}
        .navbar-wrapper { position: relative; z-index: 60; flex-shrink: 0; }
        .navbar-spacer { height: 72px; flex-shrink: 0; }
        .layout-container { display: flex; flex: 1; overflow: hidden; position: relative; }

        /* UI Polish: Glassmorphism & Glows */
        .glass-panel { background: rgba(30, 31, 32, 0.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .glow-hover { transition: all 0.3s ease; }
        .glow-hover:hover { box-shadow: 0 0 16px rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .pulse-glow { box-shadow: 0 0 12px rgba(66, 133, 244, 0.4); }
        .glow-text { text-shadow: 0 0 16px currentColor; }

        /* ─── ANIMATED GLOWING INPUT BORDER ─── */
        .ai-studio-input-wrapper {
          position: relative;
          border-radius: 26px;
          padding: 1px; /* The thickness of the glowing border */
          background: #1e1f20; /* Base background when not glowing */
          overflow: hidden; /* Clips the rotating pseudo-element to stay inside the border */
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          z-index: 1;
        }

        /* The spinning conic gradient */
        .ai-studio-input-wrapper::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(59,130,246, 0.8) 60deg,    /* Blue */
            rgba(168,85,247, 0.8) 120deg,   /* Purple */
            rgba(239,68,68, 0.8) 180deg,    /* Red */
            rgba(245,158,11, 0.8) 240deg,   /* Yellow */
            transparent 300deg,
            transparent 360deg
          );
          animation: rotateGlow 12s linear infinite;
          z-index: -1;
          opacity: 0.3; /* Faint glow by default */
          transition: opacity 0.8s ease;
        }

        /* Intensify glow on focus */
        .ai-studio-input-wrapper:focus-within::before {
          opacity: 1;
          animation: rotateGlow 8s linear infinite; /* Spin faster when focused */
        }
        
        .ai-studio-input-wrapper:focus-within {
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 15px rgba(59,130,246,0.15);
        }

        .ai-studio-input-inner {
          background: #1e1f20; /* Masks the center, leaving only the 1px animated padding */
          border-radius: 25px; 
          padding: 12px 16px; /* Tightened vertical padding */
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        @keyframes rotateGlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        /* ────────────────────────────────────────── */

        /* Hide scrollbar for chips */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        /* Sidebar Elements */
        .gemini-sidebar { transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0; height: 100%; border-right: 1px solid rgba(255,255,255,0.05); z-index: 50; }
        .gemini-sidebar.open { width: 280px; }
        .gemini-sidebar.closed { width: 68px; }
        .sidebar-header { padding: 12px; }
        .hamburger-btn { background: transparent; border: none; color: #e3e3e3; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
        .hamburger-btn:hover { background: rgba(255,255,255,0.1); }
        
        .sidebar-actions { padding: 8px 12px; display: flex; justify-content: flex-start; }
        .new-chat-btn { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); color: #e3e3e3; border: 1px solid rgba(255,255,255,0.1); height: 44px; border-radius: 22px; padding: 0 16px; cursor: pointer; white-space: nowrap; overflow: hidden; font-size: 14px; font-weight: 500; }
        .gemini-sidebar.closed .new-chat-btn { width: 44px; padding: 0; justify-content: center; background: transparent; border-color: transparent;}
        .gemini-sidebar.open .new-chat-btn { width: auto; min-width: 150px; }

        .history-container { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
        .history-title { font-size: 12px; color: #9aa0a6; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; padding: 8px 12px; }
        .history-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; color: #e3e3e3; cursor: pointer; font-size: 14px; transition: background 0.2s; white-space: nowrap; overflow: hidden; }
        .history-item:hover { background: rgba(255,255,255,0.05); }
        .history-item.active { background: rgba(66, 133, 244, 0.1); border-left: 2px solid #4285f4; }
        .history-content { display: flex; align-items: center; gap: 12px; overflow: hidden; flex: 1;}
        .history-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13.5px; }
        .delete-btn { background: transparent; border: none; color: #f28b82; cursor: pointer; padding: 4px; }

        /* Main Viewport & Chat */
        .app-viewport { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; background: #0d0d10; }
        .top-utilities { padding: 16px 24px 0; display: flex; justify-content: space-between; align-items: center; z-index: 40; }
        .tokens-indicator { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; padding: 8px 16px; border-radius: 24px; }

        .chat-scroll-area { flex: 1; overflow-y: auto; padding: 12px 0 32px; }
        .chat-content-bounds { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; padding: 0 24px; }

        .message-row { display: flex; gap: 16px; width: 100%; }
        .message-row.user { justify-content: flex-end; }
        .ai-avatar { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #60b3ff, #2b86f1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(43, 134, 241, 0.3); }
        .ai-avatar.pulse { animation: softPulse 2s infinite alternate; }
        @keyframes softPulse { from { opacity: 0.7; transform: scale(0.95); } to { opacity: 1; transform: scale(1.05); } }

        .message-bubble { max-width: calc(100% - 48px); font-size: 15px; line-height: 1.6; color: #e3e3e3;}
        .user .message-bubble { max-width: 80%; }
        .user-text-bubble { background: rgba(255,255,255,0.05); padding: 14px 18px; border-radius: 24px; border-top-right-radius: 4px; border: 1px solid rgba(255,255,255,0.02); }
        .user-code { margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 13.5px; white-space: pre-wrap; word-break: break-all; }

        /* Custom Chat Markdown Styles */
        .chat-prose { display: block; margin-bottom: 12px; line-height: 1.7; font-size: 15px; color: #d1d5db; }
        .chat-code-block { background: #000; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; margin: 16px 0; }
        .chat-code-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px; font-family: monospace; color: #9aa0a6; }
        .chat-code-block pre { margin: 0; padding: 16px; overflow-x: auto; font-family: 'JetBrains Mono', monospace; font-size: 13.5px; color: #8ab4f8; }

        .analysis-card { border-radius: 16px; padding: 20px 24px; }
        .complexity-label { font-size: 13px; font-weight: 500; color: #9aa0a6; text-transform: uppercase; letter-spacing: 0.5px; }
        .complexity-value { font-size: 32px; font-family: 'JetBrains Mono', monospace; font-weight: 600; margin: 4px 0 0 0; }

        .graph-card { border-radius: 16px; padding: 20px 24px; }
        .graph-label { display: block; font-size: 13px; font-weight: 500; color: #9aa0a6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }

        .code-result-card { border-radius: 16px; overflow: hidden; }
        .result-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; font-weight: 600; }
        .result-code { margin: 0; padding: 20px; font-family: 'JetBrains Mono', monospace; font-size: 13.5px; color: #8ab4f8; overflow-x: auto;}

        .action-btn { background: transparent; border: none; color: #9aa0a6; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; }
        .action-btn:hover { background: rgba(255, 255, 255, 0.1); color: #e3e3e3; }
        
        .suggested-actions { margin-top: 8px; }
        .actions-title { font-size: 12px; color: #9aa0a6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: block; font-weight: 600;}
        .actions-grid { display: flex; gap: 12px; flex-wrap: wrap; }
        .suggest-btn { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #e3e3e3; padding: 10px 16px; border-radius: 12px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .suggest-btn:hover { background: rgba(255,255,255,0.1); border-color: #5f6368; }
        .badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase;}
        .badge.free { background: rgba(129, 201, 149, 0.15); color: #81c995; }
        .badge.cost { background: rgba(242, 139, 130, 0.15); color: #f28b82; }

        .translate-menu { position: absolute; top: 100%; left: 0; margin-top: 8px; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.5); width: 100%;}
        .translate-menu button { background: transparent; border: none; color: #e3e3e3; padding: 10px 16px; text-align: left; cursor: pointer; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .translate-menu button:hover { background: rgba(255,255,255,0.1); }

        .loading-bubble { display: flex; align-items: center; gap: 12px; color: #9aa0a6; height: 32px; }
        .spinner { animation: spin 1s linear infinite; color: #8ab4f8; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .error-card { background: rgba(242, 139, 130, 0.1); color: #f28b82; padding: 14px 18px; border-radius: 16px; display: flex; align-items: center; gap: 12px; }

        /* Input Dock */
        .input-dock-area { padding: 0 24px 24px; z-index: 10; width: 100%; }
        .input-dock-area.state-centered { flex: 1; display: flex; align-items: center; justify-content: center; }
        .input-dock-area.state-docked { flex-shrink: 0; background: linear-gradient(180deg, transparent 0%, #0d0d10 25%, #0d0d10 100%); }
        
        .chat-h1 { font-size: 1.5em; font-weight: 600; color: #fff; margin: 20px 0 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; }
        .chat-h2 { font-size: 1.25em; font-weight: 600; color: #fff; margin: 18px 0 8px 0; }
        .chat-h3 { font-size: 1.1em; font-weight: 600; color: #fff; margin: 16px 0 6px 0; }
        
        .chat-li { margin-left: 20px; list-style-type: disc; margin-bottom: 6px; padding-left: 4px; }
        .chat-li-ordered { margin-left: 20px; list-style-type: decimal; margin-bottom: 6px; padding-left: 4px; }
        
        .chat-strong { color: #fff; font-weight: 600; }
        .chat-inline-code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.9em; color: #8ab4f8; }

        /* --- MOBILE RESPONSIVENESS FIXES --- */
        @media (max-width: 768px) {
          .gemini-sidebar { 
            position: absolute; 
            z-index: 100; 
            height: 100%; 
            background: rgba(20, 20, 22, 0.95); 
          }
          .gemini-sidebar.closed { width: 0; transform: translateX(-100%); opacity: 0; border: none; }
          .gemini-sidebar.open { width: 280px; transform: translateX(0); opacity: 1; box-shadow: 4px 0 32px rgba(0,0,0,0.6); }
          .sidebar-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); z-index: 90; }
          .chat-content-bounds { padding: 0 16px; }
          .message-row { gap: 12px; }
          .ai-avatar { width: 28px; height: 28px; }
          .input-dock-area { padding: 0 16px 16px; }
          .top-utilities { padding: 16px 16px 0; }
        }
      `}</style>
    </div>
  );
}