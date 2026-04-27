import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Zap, AlertCircle, Send, Paperclip, Loader2, Sparkles, Copy, 
  Check, Edit2, Trash2, Menu, Code2, ArrowRightLeft, Plus, MessageSquare 
} from 'lucide-react';

// ─── FIREBASE IMPORTS ────────────────────────────────────────────────────────
import { auth, firestoreDB as db } from "@/lib/firebase";
import { supabase } from "../../netlify/functions/utils/supabase.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, collection, addDoc, updateDoc, serverTimestamp, query, orderBy, deleteDoc } from "firebase/firestore";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from "@/components/Navbar"; 

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnalysisResult {
  type: 'analysis' | 'optimization' | 'translation';
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

// UPGRADED: HistoryItem now stores the entire message thread
interface HistoryItem {
  id: string;
  title: string;
  messages?: ChatMessage[]; // The new threaded model
  
  // Legacy fields (kept for backward compatibility so old chats don't break)
  type?: string;
  codeSnippet?: string; 
  fullInputCode?: string; 
  timeComplexity?: string;
  spaceComplexity?: string;
  explanation?: string;
  resultCode?: string; 
  timestamp: any;
  updatedAt?: any;
}

// ─── Graph Data ──────────────────────────────────────────────────────────────
const generateChartData = () => {
  const data = [];
  for (let n = 1; n <= 20; n++) {
    data.push({
      n: n,
      'O(1)': 10,
      'O(log N)': Math.log2(n) * 15,
      'O(N)': n * 5,
      'O(N log N)': n * Math.log2(n) * 3,
      'O(N^2)': Math.pow(n, 2) * 0.5,
      'O(2^N)': Math.min(Math.pow(2, n) * 0.1, 300),
    });
  }
  return data;
};

const CHART_DATA = generateChartData();
const COMPLEXITY_COLORS = {
  'O(1)': '#81c995',       
  'O(log N)': '#8ab4f8',   
  'O(N)': '#fde293',       
  'O(N log N)': '#fcad70', 
  'O(N^2)': '#f28b82',     
  'O(2^N)': '#c58af9',     
};

const TRANSLATE_LANGS = ["Python", "Java", "C++", "JavaScript", "Go", "Rust"];

export default function Analyzer() {
  const [inputCode, setInputCode] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [credits, setCredits] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [userName, setUserName] = useState<string>('Developer');

  // Gemini Style Sidebar & Thread State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showLangMenuForIdx, setShowLangMenuForIdx] = useState<number | null>(null);
  
  // NEW: Keep track of the active thread
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const chatIdRef = useRef<string | null>(null); 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to sync ref and state instantly
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
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleNewAnalysis = () => {
    setMessages([]);
    setInputCode('');
    setChatId(null); // CRITICAL: Reset the thread ID so the next message starts a new chat
    if (window.innerWidth < 768) setIsSidebarOpen(false); 
  };

  // ─── Firebase Auth & Listeners ─────────────────────────────────────────────
  // ─── Firebase Auth & Listeners ─────────────────────────────────────────────
  useEffect(() => {
    let unsubscribeCredits: () => void;
    let unsubscribeHistory: () => void;

    // Make this callback async so we can fetch from Supabase
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setCredits(null);
        setHistory([]);
        setUserName('Developer'); // Reset name on logout
        if (unsubscribeCredits) unsubscribeCredits();
        if (unsubscribeHistory) unsubscribeHistory();
        return;
      }
      
      // --- NEW: FETCH COMPLETE NAME FROM SUPABASE ---
      try {
        // Note: Adjust 'users' and 'full_name' to match your actual Supabase table and column names.
        // You can also change .eq('email', user.email) to .eq('id', user.uid) if you link by UID.
        const { data, error } = await supabase
          .from('users') 
          .select('full_name') 
          .eq('email', user.email)
          .single();

        let completeName = data?.full_name;

        // Fallback: If no name in Supabase, use Firebase displayName, or default to the email prefix
        if (!completeName || completeName.trim() === '') {
          completeName = user.displayName || user.email?.split('@')[0] || 'Developer';
        }
        
        setUserName(completeName);
      } catch (err) {
        console.error("Error fetching name from Supabase:", err);
        // Safety Fallback on error
        setUserName(user.displayName || user.email?.split('@')[0] || 'Developer');
      }
      // ----------------------------------------------

      unsubscribeCredits = onSnapshot(doc(db, 'user_credits', user.uid), (docSnap) => {
        if (docSnap.exists()) setCredits(docSnap.data().credits);
        else setCredits(7); 
      });

      // Sort by the most recently updated threads
      const historyQ = query(collection(db, 'users', user.uid, 'analysis_history'), orderBy('updatedAt', 'desc'));
      unsubscribeHistory = onSnapshot(historyQ, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryItem));
        setHistory(items);
      }, (error) => {
        console.error("History Listener Error:", error);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeCredits) unsubscribeCredits();
      if (unsubscribeHistory) unsubscribeHistory();
    }; 
  }, []);

  // ─── Thread Saving Logic ───────────────────────────────────────────────────
  const saveChatToFirebase = async (chatMessages: ChatMessage[]) => {
    if (!currentUser) return;
    
    try {
      const dbCollection = collection(db, 'users', currentUser.uid, 'analysis_history');
      
      if (chatIdRef.current) {
        // UPDATE EXISTING THREAD
        await updateDoc(doc(dbCollection, chatIdRef.current), {
          messages: chatMessages,
          updatedAt: serverTimestamp()
        });
      } else {
        // CREATE NEW THREAD
        const firstUserMsg = chatMessages.find(m => m.role === 'user');
        const generatedTitle = firstUserMsg 
          ? firstUserMsg.content.substring(0, 45) + (firstUserMsg.content.length > 45 ? '...' : '') 
          : 'New Analysis';

        const docRef = await addDoc(dbCollection, {
          title: generatedTitle,
          messages: chatMessages,
          timestamp: serverTimestamp(),
          updatedAt: serverTimestamp() // We use updatedAt for sorting so bumped threads rise to the top
        });
        setChatId(docRef.id);
      }
    } catch (err) {
      console.error("Failed to save thread:", err);
    }
  };

  // ─── Core API Request ──────────────────────────────────────────────────────
  const executeRequest = async (action: 'analyze' | 'optimize' | 'translate', code: string, currentMessages: ChatMessage[], targetLanguage?: string) => {
    setIsAnalyzing(true);
    try {
      if (!currentUser) throw new Error("Authentication required.");
      const token = await currentUser.getIdToken();

      const response = await fetch('/.netlify/functions/ask-groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code, action, targetLanguage })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || `HTTP Error ${response.status}`);
      }

      const data = await response.json();
      const aiResult = JSON.parse(data.choices[0].message.content) as AnalysisResult & { error?: string };
      
      if (aiResult.error) throw new Error(aiResult.error);

      // Append AI response to the thread and save
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

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleAnalyze = () => {
    const trimmed = inputCode.trim();
    if (!trimmed) return;
    
    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const pendingMessages = [...messages, userMsg];
    
    setMessages(pendingMessages);
    setInputCode('');
    executeRequest('analyze', trimmed, pendingMessages);
  };

  const handleOptimize = (codeToOptimize: string) => {
    const userMsg: ChatMessage = { role: 'user', content: "Please optimize this code to run faster and use less memory." };
    const pendingMessages = [...messages, userMsg];
    
    setMessages(pendingMessages);
    executeRequest('optimize', codeToOptimize, pendingMessages);
  };

  const handleTranslate = (codeToTranslate: string, targetLang: string) => {
    const userMsg: ChatMessage = { role: 'user', content: `Please translate this code to ${targetLang}.` };
    const pendingMessages = [...messages, userMsg];
    
    setMessages(pendingMessages);
    executeRequest('translate', codeToTranslate, pendingMessages, targetLang);
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'analysis_history', id));
      if (currentChatId === id) handleNewAnalysis(); // Clear UI if deleting active chat
    } catch (err) {
      console.error("Failed to delete history item", err);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setChatId(item.id);
    
    // Check if it's a new "Threaded" item, or a "Legacy" item from earlier
    if (item.messages && item.messages.length > 0) {
      setMessages(item.messages);
    } else {
      // Graceful fallback for your older database entries
      setMessages([
        { role: 'user', content: item.fullInputCode || item.codeSnippet || "" },
        { role: 'ai', content: '', result: {
            type: (item.type as any) || 'analysis',
            timeComplexity: item.timeComplexity,
            spaceComplexity: item.spaceComplexity,
            explanation: item.explanation || "",
            code: item.resultCode
        }}
      ]);
    }
    
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const isHomeState = messages.length === 0;

  return (
    <div className="analyzer-root">
      <Helmet><title>AlgoLib AI Assistant</title></Helmet>
      <div className="navbar-wrapper"><Navbar /></div>
      <div className="navbar-spacer"></div>

      <div className="layout-container">
        
        {isSidebarOpen && <div className="sidebar-backdrop md:hidden" onClick={() => setIsSidebarOpen(false)} />}
        
        <aside className={`gemini-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hamburger-btn" title="Expand menu">
              <Menu size={20} />
            </button>
          </div>

          <div className="sidebar-actions">
            <button onClick={handleNewAnalysis} className="new-chat-btn">
              <Plus size={20} className="icon-shrink" />
              {isSidebarOpen && <span>New analysis</span>}
            </button>
          </div>

          {isSidebarOpen && (
            <div className="history-container">
              <div className="history-title">Recent</div>
              <div className="history-list">
                {history.length === 0 ? (
                  <p className="empty-history">No history saved.</p>
                ) : (
                  history.map(item => (
                    <div key={item.id} className={`history-item group ${currentChatId === item.id ? 'active' : ''}`} onClick={() => loadHistoryItem(item)}>
                      <div className="history-content">
                        <MessageSquare size={16} className={currentChatId === item.id ? "text-blue-400" : "text-zinc-500"} />
                        <span className={`history-text ${currentChatId === item.id ? "text-blue-100" : "text-bdc1c6"}`}>
                          {item.title || item.codeSnippet}
                        </span>
                      </div>
                      <button onClick={(e) => handleDeleteHistory(e, item.id)} className="delete-btn opacity-0 group-hover:opacity-100" title="Delete">
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
                <button onClick={() => setIsSidebarOpen(true)} className="hamburger-btn mobile-hamburger">
                  <Menu size={20} />
                </button>
              )}
            </div>
            
            <div className="tokens-indicator ml-auto">
              <Zap size={14} className={credits && credits > 0 ? 'text-yellow-400' : 'text-red-400'} />
              <span>{credits !== null ? `${credits} requests left` : 'Connecting...'}</span>
            </div>
          </div>

          {!isHomeState && (
            <div className="chat-scroll-area">
              <div className="chat-content-bounds">
                {messages.map((msg, idx) => {
                  const originalCodeMsg = messages.slice(0, idx).reverse().find(m => m.role === 'user');
                  
                  return (
                    <div key={idx} className={`message-row ${msg.role} group`}>
                      {msg.role === 'ai' && <div className="ai-avatar"><Sparkles size={16} color="#fff" /></div>}
                      
                      <div className="message-bubble">
                        {msg.role === 'user' ? (
                          <div className="user-message-wrapper">
                            <div className="user-text-bubble">
                              <pre className="user-code"><code>{msg.content}</code></pre>
                            </div>
                            <div className="message-actions hidden group-hover:flex gap-2 mt-2 justify-end">
                              <button onClick={() => handleEdit(msg.content)} className="action-btn" title="Edit Prompt"><Edit2 size={14} /></button>
                              <button onClick={() => handleCopy(msg.content, `user-${idx}`)} className="action-btn" title="Copy Prompt">
                                {copiedId === `user-${idx}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        ) : msg.isError ? (
                          <div className="error-card"><AlertCircle size={18} /><span>{msg.content}</span></div>
                        ) : msg.result ? (
                          <div className="ai-response-layout">
                            {msg.result.type === 'analysis' && (
                              <>
                                <p className="response-text">Here is the performance breakdown for your algorithm:</p>
                                <div className="analysis-card relative group/card flex gap-6 flex-col md:flex-row">
                                  <div className="complexity-box flex-1">
                                    <span className="complexity-label">Time Complexity</span>
                                    <h2 className="complexity-value" style={{ color: COMPLEXITY_COLORS[msg.result.timeComplexity as keyof typeof COMPLEXITY_COLORS] || '#8ab4f8' }}>
                                      {msg.result.timeComplexity}
                                    </h2>
                                  </div>
                                  <div className="complexity-box flex-1 md:border-l border-zinc-800 md:pl-6">
                                    <span className="complexity-label">Space Complexity</span>
                                    <h2 className="complexity-value" style={{ color: COMPLEXITY_COLORS[msg.result.spaceComplexity as keyof typeof COMPLEXITY_COLORS] || '#81c995' }}>
                                      {msg.result.spaceComplexity}
                                    </h2>
                                  </div>
                                  <div className="absolute top-4 right-4 hidden group-hover/card:flex">
                                     <button onClick={() => handleCopy(`Time: ${msg.result!.timeComplexity}\nSpace: ${msg.result!.spaceComplexity}\n\nExplanation:\n${msg.result!.explanation}`, `ai-${idx}`)} className="action-btn">
                                       {copiedId === `ai-${idx}` ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                     </button>
                                  </div>
                                </div>
                                <p className="complexity-desc">{msg.result.explanation}</p>

                                <div className="graph-card">
                                  <span className="graph-label">Time Growth Visualization</span>
                                  <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={260}>
                                      <LineChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#3c4043" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="n" stroke="#9aa0a6" tick={{fill: '#9aa0a6', fontSize: 12}} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#9aa0a6" tick={{fill: '#9aa0a6', fontSize: 12}} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#303134', border: 'none', borderRadius: '8px', color: '#e3e3e3' }} />
                                        {Object.keys(COMPLEXITY_COLORS).map((key) => {
                                          const isHighlighted = msg.result!.timeComplexity === key;
                                          return <Line key={key} type="monotone" dataKey={key} stroke={COMPLEXITY_COLORS[key as keyof typeof COMPLEXITY_COLORS]} strokeWidth={isHighlighted ? 3 : 1} strokeOpacity={isHighlighted ? 1 : 0.2} dot={false} />;
                                        })}
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>

                                <div className="suggested-actions">
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
                                        <div className="translate-menu">
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
                                <div className="code-result-card">
                                  <div className="result-header">
                                    <span>{msg.result.type === 'optimization' ? 'Optimized Version' : 'Translated Version'}</span>
                                    <button onClick={() => handleCopy(msg.result!.code || '', `code-${idx}`)} className="action-btn">
                                      {copiedId === `code-${idx}` ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                  </div>
                                  <pre className="result-code"><code>{msg.result.code}</code></pre>
                                </div>
                                <div className="result-explanation-box">
                                  <p className="complexity-desc m-0 text-sm leading-relaxed">{msg.result.explanation}</p>
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
                    <div className="ai-avatar pulse"><Sparkles size={16} color="#fff" /></div>
                    <div className="message-bubble loading-bubble"><Loader2 className="spinner" size={18} /><span>Processing...</span></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          <div className={`input-dock-area ${isHomeState ? 'state-centered' : 'state-docked'}`}>
            <div className="input-bounds">
              {isHomeState && (
                <div className="greeting-header">
                  {/* CHANGED THIS LINE TO USE THE SUPABASE NAME */}
                  <h1><span className="gradient-text">Hello, {userName}</span></h1>
                  <div style={{ marginTop: '4px' }}>
                    <img src="https://readme-typing-svg.herokuapp.com?font=Inter&weight=500&size=40&pause=2000&color=444746&width=800&height=60&lines=Which+code+would+you+like+to+analyze%3F;AlgoLib+AI+is+here+to+help%2C+%F0%9F%A4%94;Paste+your+code+snippet+below...;Quick+Analysis+with+low+latency;AlgoLib+AI+supports+any+language%21" alt="Typing Animation" style={{ pointerEvents: 'none', userSelect: 'none' }} />
                  </div>
                </div>
              )}
              
              <div className="search-box-wrapper">
                <button className="icon-btn" disabled><Paperclip size={20} /></button>
                <textarea
                  ref={textareaRef}
                  className="gemini-input"
                  placeholder="Paste to analyze ..."
                  value={inputCode}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={isAnalyzing}
                />
                <button className={`send-btn ${inputCode.trim() ? 'active' : ''}`} onClick={handleAnalyze} disabled={!inputCode.trim() || isAnalyzing}>
                  <Send size={18} className="send-icon" />
                </button>
              </div>
              <div className="disclaimer-text">AlgoLib AI can make mistakes. Consider verifying complexities for critical systems.</div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .analyzer-root { height: 100vh; overflow: hidden; background-color: #131314; color: #e3e3e3; display: flex; flex-direction: column; font-family: ui-sans-serif, system-ui, sans-serif;}
        .navbar-wrapper { position: relative; z-index: 60; flex-shrink: 0; }
        .navbar-spacer { height: 72px; flex-shrink: 0; }
        .layout-container { display: flex; flex: 1; overflow: hidden; position: relative; }

        .gemini-sidebar { background-color: #1e1f20; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0; height: 100%; border-right: 1px solid #282a2c; z-index: 50; }
        .gemini-sidebar.open { width: 280px; }
        .gemini-sidebar.closed { width: 68px; }

        .sidebar-header { padding: 12px; }
        .hamburger-btn { background: transparent; border: none; color: #e3e3e3; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
        .hamburger-btn:hover { background: rgba(255,255,255,0.1); }
        .mobile-hamburger { position: relative; left: -10px; }

        .sidebar-actions { padding: 8px 12px; display: flex; justify-content: flex-start; }
        .new-chat-btn { display: flex; align-items: center; gap: 12px; background: #282a2c; color: #e3e3e3; border: none; height: 44px; border-radius: 22px; padding: 0 16px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap; overflow: hidden; font-size: 14px; font-weight: 500; }
        .gemini-sidebar.closed .new-chat-btn { width: 44px; padding: 0; justify-content: center; background: transparent; }
        .gemini-sidebar.closed .new-chat-btn:hover { background: rgba(255,255,255,0.1); }
        .gemini-sidebar.open .new-chat-btn { width: auto; min-width: 150px; background: #282a2c; }
        .gemini-sidebar.open .new-chat-btn:hover { background: #3c4043; }

        .history-container { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 4px; opacity: 1; transition: opacity 0.2s;}
        .history-container::-webkit-scrollbar { width: 6px; }
        .history-container::-webkit-scrollbar-thumb { background: #3c4043; border-radius: 4px; }
        .history-title { font-size: 13px; color: #e3e3e3; font-weight: 500; padding: 8px 12px; margin-bottom: 4px; }
        
        .history-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; color: #e3e3e3; cursor: pointer; font-size: 14px; transition: background 0.2s; white-space: nowrap; overflow: hidden; }
        .history-item:hover { background: #282a2c; }
        .history-item.active { background: #2563eb15; border-left: 2px solid #3b82f6; } /* NEW: Highlight active thread */
        .history-content { display: flex; align-items: center; gap: 12px; overflow: hidden; flex: 1;}
        .history-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13.5px; }
        
        .delete-btn { background: transparent; border: none; color: #f28b82; cursor: pointer; padding: 4px; transition: opacity 0.2s; }
        .empty-history { text-align: center; color: #5f6368; font-size: 13px; margin-top: 20px; }

        @media (max-width: 768px) {
          .gemini-sidebar { position: absolute; z-index: 100; height: 100%; border-right: none;}
          .gemini-sidebar.closed { width: 0; transform: translateX(-100%); }
          .gemini-sidebar.open { width: 280px; transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.5); }
          .sidebar-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.6); z-index: 90; }
        }

        .app-viewport { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .top-utilities { padding: 16px 24px 0; display: flex; justify-content: space-between; align-items: center; z-index: 40; }
        .tokens-indicator { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #bdc1c6; background: #1e1f20; padding: 8px 14px; border-radius: 24px; border: 1px solid #3c4043; }

        .chat-scroll-area { flex: 1; overflow-y: auto; padding: 12px 0 32px; }
        .chat-scroll-area::-webkit-scrollbar { width: 8px; }
        .chat-scroll-area::-webkit-scrollbar-thumb { background: #3c4043; border-radius: 4px; }
        .chat-content-bounds { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; padding: 0 24px; }

        .message-row { display: flex; gap: 16px; width: 100%; }
        .message-row.user { justify-content: flex-end; }
        .ai-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #4285f4, #d96570, #9b72cb); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ai-avatar.pulse { animation: softPulse 2s infinite alternate; }
        @keyframes softPulse { from { opacity: 0.7; transform: scale(0.95); } to { opacity: 1; transform: scale(1.05); } }

        .message-bubble { max-width: calc(100% - 48px); font-size: 15px; line-height: 1.6; }
        .user .message-bubble { max-width: 80%; }
        .user-text-bubble { background: #1e1f20; padding: 14px 18px; border-radius: 24px; border-top-right-radius: 4px; }
        .user-code { margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 13.5px; color: #e3e3e3; white-space: pre-wrap; word-break: break-all; }

        .ai-response-layout { display: flex; flex-direction: column; gap: 16px; margin-top: 4px; }
        .response-text { margin: 0; color: #e3e3e3; }
        
        .analysis-card { background: #1e1f20; border-radius: 16px; padding: 20px 24px; }
        .complexity-label { font-size: 13px; font-weight: 500; color: #9aa0a6; text-transform: uppercase; letter-spacing: 0.5px; }
        .complexity-value { font-size: 32px; font-family: 'JetBrains Mono', monospace; font-weight: 600; margin: 4px 0 0 0; }
        .complexity-desc { color: #bdc1c6; font-size: 14.5px; margin: 16px 0 0 0; line-height: 1.5; }
        
        .graph-card { background: #1e1f20; border-radius: 16px; padding: 20px 24px; }
        .graph-label { display: block; font-size: 13px; font-weight: 500; color: #9aa0a6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }

        .code-result-wrapper { display: flex; flex-direction: column; gap: 12px; }
        .code-result-card { background: #1e1f20; border-radius: 16px; overflow: hidden; border: 1px solid #282a2c; }
        .result-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #282a2c; border-bottom: 1px solid #3c4043; font-size: 13px; font-weight: 600; color: #e3e3e3;}
        .result-code { margin: 0; padding: 20px; font-family: 'JetBrains Mono', monospace; font-size: 13.5px; color: #8ab4f8; overflow-x: auto;}
        .result-explanation-box { background: #1a1b1e; border-left: 3px solid #4285f4; padding: 16px 20px; border-radius: 8px; }

        .suggested-actions { margin-top: 8px; }
        .actions-title { font-size: 12px; color: #9aa0a6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: block; font-weight: 600;}
        .actions-grid { display: flex; gap: 12px; flex-wrap: wrap; }
        .suggest-btn { display: flex; align-items: center; gap: 8px; background: #1e1f20; border: 1px solid #3c4043; color: #e3e3e3; padding: 10px 16px; border-radius: 12px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .suggest-btn:hover { background: #282a2c; border-color: #5f6368; }
        .badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase;}
        .badge.free { background: rgba(129, 201, 149, 0.15); color: #81c995; }
        .badge.cost { background: rgba(242, 139, 130, 0.15); color: #f28b82; }

        .translate-menu { position: absolute; top: 100%; left: 0; margin-top: 8px; background: #282a2c; border: 1px solid #3c4043; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.5); width: 100%;}
        .translate-menu button { background: transparent; border: none; color: #e3e3e3; padding: 10px 16px; text-align: left; cursor: pointer; font-size: 14px;}
        .translate-menu button:hover { background: #3c4043; }

        .loading-bubble { display: flex; align-items: center; gap: 12px; color: #9aa0a6; height: 32px; }
        .spinner { animation: spin 1s linear infinite; color: #8ab4f8; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .error-card { background: rgba(242, 139, 130, 0.1); color: #f28b82; padding: 14px 18px; border-radius: 16px; display: flex; align-items: center; gap: 12px; }
        .action-btn { background: transparent; border: none; color: #9aa0a6; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; transition: all 0.2s ease; }
        .action-btn:hover { background: rgba(255, 255, 255, 0.1); color: #e3e3e3; }

        .input-dock-area { padding: 0 24px 24px; background: linear-gradient(180deg, transparent 0%, #131314 25%, #131314 100%); z-index: 10; }
        .input-dock-area.state-centered { flex: 1; display: flex; align-items: center; justify-content: center; background: transparent; }
        .input-dock-area.state-docked { flex-shrink: 0; }
        .input-bounds { width: 100%; max-width: 820px; margin: 0 auto; }
        .greeting-header { margin-bottom: 40px; padding-left: 8px; }
        .greeting-header h1 { margin: 0 0 8px 0; font-size: 44px; font-weight: 500; letter-spacing: -0.5px; }
        .gradient-text { background: linear-gradient(74deg, #2570e9 0%, #64976e 46%, #dd9b50 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .search-box-wrapper { display: flex; align-items: flex-end; gap: 12px; background: #1e1f20; border-radius: 28px; padding: 12px 16px; transition: background 0.2s ease; border: 1px solid transparent;}
        .search-box-wrapper:focus-within { background: #282a2c; border-color: #3c4043; }
        .gemini-input { flex: 1; background: transparent; border: none; color: #e3e3e3; font-family: inherit; font-size: 16px; line-height: 1.5; resize: none; max-height: 200px; padding: 10px 0; outline: none; }
        .gemini-input::placeholder { color: #8e918f; }
        .icon-btn { color: #8e918f; background: none; border: none; padding: 8px; cursor: not-allowed; display: flex; align-items: center; justify-content: center; }
        .send-btn { background: transparent; color: #8e918f; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; margin-bottom: 2px; }
        .send-btn.active { color: #8ab4f8; background: rgba(138, 180, 248, 0.08); }
        .send-btn.active:hover { background: rgba(138, 180, 248, 0.15); }
        .disclaimer-text { text-align: center; font-size: 12px; color: #8e918f; margin-top: 16px; }
      `}</style>
    </div>
  );
}