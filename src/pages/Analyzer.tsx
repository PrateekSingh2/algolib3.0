import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Zap, AlertCircle, Send, Paperclip, Loader2, Sparkles, Copy, Check, Edit2 } from 'lucide-react';

// ─── FIREBASE IMPORTS ────────────────────────────────────────────────────────
import { auth, firestoreDB as db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Navbar from "@/components/Navbar"; 

// ─── Environment & Types ─────────────────────────────────────────────────────
declare global {
  interface ImportMetaEnv {}
  interface ImportMeta { readonly env: ImportMetaEnv; }
}

interface AnalysisResult {
  complexity: string; 
  explanation: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  result?: AnalysisResult;
  isError?: boolean;
}

// ─── Graph Data Generator (Gemini Pastel Theme) ──────────────────────────────
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function Analyzer() {
  const [inputCode, setInputCode] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [credits, setCredits] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnalyzing]);

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
      textareaRef.current.style.height = 'auto';
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
      }, 0);
    }
  };

  // ─── Firebase Auth & Real-Time Credit Listener ─────────────────────────────
  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setCredits(null);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        return;
      }
      
      const userRef = doc(db, 'user_credits', user.uid);
      
      // Real-time listener: UI updates instantly when backend changes the db
      unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setCredits(docSnap.data().credits);
        } else {
          setCredits(7); // Visual default for brand new users
        }
      }, (error) => {
        console.error("Error listening to credits:", error);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    }; 
  }, []);

  // ─── Analyze Action ────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    const trimmedCode = inputCode.trim();
    if (!trimmedCode) return;

    setIsAnalyzing(true);
    setMessages(prev => [...prev, { role: 'user', content: trimmedCode }]);
    setInputCode('');
    
    try {
      if (!currentUser) throw new Error("You must be logged in to use the analyzer.");

      const token = await currentUser.getIdToken();

      const response = await fetch('/.netlify/functions/ask-groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: trimmedCode })
      });

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}: Failed to reach server.`;
        try {
          const errorData = await response.json();
          errorMsg = errorData?.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      let rawContent = data.choices[0].message.content;
      
      const aiResult = JSON.parse(rawContent) as { complexity?: string; explanation?: string; error?: string };
      
      if (aiResult.error) {
        throw new Error(aiResult.error); 
      }

      if (aiResult.complexity && aiResult.explanation) {
        setMessages(prev => [
          ...prev,
          {
            role: 'ai',
            content: '',
            result: {
              complexity: aiResult.complexity,
              explanation: aiResult.explanation
            }
          }
        ]);
        
        setIsAnalyzing(false); 
        
      } else {
        throw new Error("Query is not valid. Please ensure your code snippet is correct and try again.");
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: errorMessage, isError: true }
      ]);
      
      setIsAnalyzing(false); 
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const isHomeState = messages.length === 0;
  
  // Extract user's first name dynamically
  const firstName = currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'Prateek';

  return (
    <div className="analyzer-root">
      <Helmet><title>AlgoLib AI Assistant</title></Helmet>
      
      <div className="navbar-wrapper">
        <Navbar />
      </div>
      
      <div className="navbar-spacer"></div>

      <div className="tokens-indicator">
        <Zap size={14} className={credits && credits > 0 ? 'text-yellow-400' : 'text-red-400'} />
        <span>{credits !== null ? `${credits} requests left` : 'Connecting...'}</span>
      </div>

      <main className="app-viewport">
        
        {/* Chat Feed */}
        {!isHomeState && (
          <div className="chat-scroll-area">
            <div className="chat-content-bounds">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message-row ${msg.role} group`}>
                  {msg.role === 'ai' && (
                    <div className="ai-avatar">
                      <Sparkles size={16} color="#fff" />
                    </div>
                  )}
                  
                  <div className="message-bubble">
                    {msg.role === 'user' ? (
                      <div className="user-message-wrapper">
                        <div className="user-text-bubble">
                          <pre className="user-code"><code>{msg.content}</code></pre>
                        </div>
                        <div className="message-actions hidden group-hover:flex gap-2 mt-2 justify-end">
                          <button onClick={() => handleEdit(msg.content)} className="action-btn" title="Edit Prompt">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleCopy(msg.content, `user-${idx}`)} className="action-btn" title="Copy Prompt">
                            {copiedId === `user-${idx}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    ) : msg.isError ? (
                      <div className="error-card">
                        <AlertCircle size={18} />
                        <span>{msg.content}</span>
                      </div>
                    ) : msg.result ? (
                      <div className="ai-response-layout">
                        <p className="response-text">
                          Here is the performance breakdown for your algorithm:
                        </p>
                        
                        <div className="analysis-card relative group/card">
                          <div className="complexity-header">
                            <span className="complexity-label">Time Complexity</span>
                            <h2 className="complexity-value" style={{ color: COMPLEXITY_COLORS[msg.result.complexity as keyof typeof COMPLEXITY_COLORS] || '#8ab4f8' }}>
                              {msg.result.complexity}
                            </h2>
                          </div>
                          <p className="complexity-desc">{msg.result.explanation}</p>
                          
                          <div className="absolute top-4 right-4 hidden group-hover/card:flex">
                             <button onClick={() => handleCopy(`Time Complexity: ${msg.result!.complexity}\n\nExplanation:\n${msg.result!.explanation}`, `ai-${idx}`)} className="action-btn" title="Copy Analysis">
                               {copiedId === `ai-${idx}` ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                             </button>
                          </div>
                        </div>

                        <div className="graph-card">
                          <span className="graph-label">Growth Rate Visualization</span>
                          <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={260}>
                              <LineChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#3c4043" vertical={false} opacity={0.3} />
                                <XAxis dataKey="n" stroke="#9aa0a6" tick={{fill: '#9aa0a6', fontSize: 12}} axisLine={false} tickLine={false} />
                                <YAxis stroke="#9aa0a6" tick={{fill: '#9aa0a6', fontSize: 12}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#303134', border: 'none', borderRadius: '8px', color: '#e3e3e3', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                                  itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                                />
                                {Object.keys(COMPLEXITY_COLORS).map((key) => {
                                  const isHighlighted = msg.result!.complexity === key;
                                  return (
                                    <Line
                                      key={key} type="monotone" dataKey={key}
                                      stroke={COMPLEXITY_COLORS[key as keyof typeof COMPLEXITY_COLORS]}
                                      strokeWidth={isHighlighted ? 3 : 1}
                                      strokeOpacity={isHighlighted ? 1 : 0.2}
                                      dot={false}
                                    />
                                  );
                                })}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              
              {isAnalyzing && (
                <div className="message-row ai">
                  <div className="ai-avatar pulse">
                    <Sparkles size={16} color="#fff" />
                  </div>
                  <div className="message-bubble loading-bubble">
                    <Loader2 className="spinner" size={18} />
                    <span>Analyzing your code...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className={`input-dock-area ${isHomeState ? 'state-centered' : 'state-docked'}`}>
          <div className="input-bounds">
            {isHomeState && (
              <div className="greeting-header">
                <h1><span className="gradient-text">Hello, {firstName}</span></h1>
                <div style={{ marginTop: '4px' }}>
                  <img 
                    src="https://readme-typing-svg.herokuapp.com?font=Inter&weight=500&size=40&pause=2000&color=444746&width=800&height=60&lines=Which+code+would+you+like+to+analyze%3F;AlgoLib+AI+is+here+to+help%2C+%F0%9F%A4%94;Paste+your+code+snippet+below...;Quick+Analysis+with+low+latency;AlgoLib+AI+supports+any+language%21" 
                    alt="Typing Animation" 
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  />
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
              <button 
                className={`send-btn ${inputCode.trim() ? 'active' : ''}`}
                onClick={handleAnalyze}
                disabled={!inputCode.trim() || isAnalyzing}
              >
                <Send size={18} className="send-icon" />
              </button>
            </div>
            
            <div className="disclaimer-text">
              AlgoLib AI can make mistakes. Consider verifying time complexities for critical systems.
            </div>
          </div>
        </div>

      </main>

      <style>{`
        /* ─── Base Theme (Gemini Dark) ─── */
        .analyzer-root { 
          height: 100vh; 
          overflow: hidden; 
          background-color: #131314; 
          color: #e3e3e3; 
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          display: flex; 
          flex-direction: column; 
          -webkit-font-smoothing: antialiased;
        }

        .navbar-wrapper {
          position: relative;
          z-index: 50;
          flex-shrink: 0;
        }
        
        .navbar-spacer {
          height: 72px; 
          flex-shrink: 0;
        }

        .app-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .tokens-indicator { 
          position: absolute; 
          top: 90px; 
          right: 24px; 
          display: flex; 
          align-items: center; 
          gap: 6px; 
          font-size: 13px; 
          font-weight: 500;
          color: #bdc1c6; 
          background: #1e1f20; 
          padding: 8px 14px; 
          border-radius: 24px; 
          z-index: 40;
        }

        /* ─── Chat Feed Area ─── */
        .chat-scroll-area { 
          flex: 1; 
          overflow-y: auto; 
          scroll-behavior: smooth; 
          padding: 32px 0;
        }
        
        .chat-scroll-area::-webkit-scrollbar { width: 8px; }
        .chat-scroll-area::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll-area::-webkit-scrollbar-thumb { background: #3c4043; border-radius: 4px; }
        
        .chat-content-bounds {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding: 0 24px;
        }

        .message-row { display: flex; gap: 16px; width: 100%; }
        .message-row.user { justify-content: flex-end; }
        
        .ai-avatar { 
          width: 32px; height: 32px; 
          border-radius: 50%; 
          background: linear-gradient(135deg, #4285f4, #d96570, #9b72cb);
          display: flex; align-items: center; justify-content: center; 
          flex-shrink: 0; 
        }
        .ai-avatar.pulse { animation: softPulse 2s infinite alternate; }
        @keyframes softPulse { 
          from { opacity: 0.7; transform: scale(0.95); } 
          to { opacity: 1; transform: scale(1.05); } 
        }

        .message-bubble { 
          max-width: calc(100% - 48px); 
          font-size: 15px; 
          line-height: 1.6;
        }
        .user .message-bubble { max-width: 80%; }

        .user-text-bubble {
          background: #1e1f20;
          padding: 14px 18px;
          border-radius: 24px;
          border-top-right-radius: 4px;
        }
        .user-code { 
          margin: 0; 
          font-family: 'JetBrains Mono', 'Fira Code', monospace; 
          font-size: 13.5px; 
          color: #e3e3e3; 
          white-space: pre-wrap; 
          word-break: break-all; 
        }

        .ai-response-layout { display: flex; flex-direction: column; gap: 16px; margin-top: 4px; }
        .response-text { margin: 0; color: #e3e3e3; }
        
        .analysis-card { 
          background: #1e1f20; 
          border-radius: 16px; 
          padding: 20px 24px; 
        }
        .complexity-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px; }
        .complexity-label { font-size: 13px; font-weight: 500; color: #9aa0a6; text-transform: uppercase; letter-spacing: 0.5px; }
        .complexity-value { font-size: 32px; font-family: 'JetBrains Mono', monospace; font-weight: 600; margin: 0; }
        .complexity-desc { color: #bdc1c6; font-size: 14.5px; margin: 0; line-height: 1.5; }
        
        .graph-card { background: #1e1f20; border-radius: 16px; padding: 20px 24px; }
        .graph-label { display: block; font-size: 13px; font-weight: 500; color: #9aa0a6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }

        .loading-bubble { display: flex; align-items: center; gap: 12px; color: #9aa0a6; height: 32px; }
        .spinner { animation: spin 1s linear infinite; color: #8ab4f8; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .error-card { 
          background: rgba(242, 139, 130, 0.1); 
          color: #f28b82; 
          padding: 14px 18px; 
          border-radius: 16px; 
          display: flex; align-items: center; gap: 12px; 
        }

        .action-btn {
          background: transparent;
          border: none;
          color: #9aa0a6;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e3e3e3;
        }

        /* ─── Input Area ─── */
        .input-dock-area {
          padding: 0 24px 24px;
          background: linear-gradient(180deg, transparent 0%, #131314 25%, #131314 100%);
          z-index: 10;
        }

        .input-dock-area.state-centered {
          flex: 1; display: flex; align-items: center; justify-content: center; background: transparent;
        }
        .input-dock-area.state-docked { flex-shrink: 0; }

        .input-bounds { width: 100%; max-width: 820px; margin: 0 auto; }

        .greeting-header { margin-bottom: 40px; padding-left: 8px; }
        .greeting-header h1 { margin: 0 0 8px 0; font-size: 44px; font-weight: 500; letter-spacing: -0.5px; }
        .gradient-text { 
          background: linear-gradient(74deg, #2570e9 0%, #64976e 46%, #dd9b50 100%);
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent; 
        }
        .greeting-header h2 { margin: 0; font-size: 44px; font-weight: 500; color: #444746; letter-spacing: -0.5px; }

        .search-box-wrapper { 
          display: flex; align-items: flex-end; gap: 12px; 
          background: #1e1f20; 
          border-radius: 28px; 
          padding: 12px 16px; 
          transition: background 0.2s ease;
        }
        .search-box-wrapper:focus-within { background: #282a2c; }

        .gemini-input { 
          flex: 1; background: transparent; border: none; color: #e3e3e3; 
          font-family: inherit; font-size: 16px; line-height: 1.5; 
          resize: none; max-height: 200px; padding: 10px 0; outline: none; 
        }
        .gemini-input::placeholder { color: #8e918f; }
        
        .icon-btn { color: #8e918f; background: none; border: none; padding: 8px; cursor: not-allowed; display: flex; align-items: center; justify-content: center; }
        
        .send-btn { 
          background: transparent; color: #8e918f; border: none; border-radius: 50%; 
          width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; 
          cursor: pointer; transition: all 0.2s; 
          margin-bottom: 2px;
        }
        .send-btn.active { color: #8ab4f8; background: rgba(138, 180, 248, 0.08); }
        .send-btn.active:hover { background: rgba(138, 180, 248, 0.15); }
        
        .disclaimer-text { 
          text-align: center; font-size: 12px; color: #8e918f; margin-top: 16px; 
        }
      `}</style>
    </div>
  );
}