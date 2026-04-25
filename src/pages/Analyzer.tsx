import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Zap, AlertCircle, Send, Paperclip, Loader2, Sparkles } from 'lucide-react';

// ─── FIREBASE IMPORTS ────────────────────────────────────────────────────────
import { auth, firestoreDB as db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Navbar from "@/components/Navbar"; 

// ─── Environment & Types ─────────────────────────────────────────────────────
declare global {
  interface ImportMetaEnv {
    // Add other types if necessary
  }
  interface ImportMeta { readonly env: ImportMetaEnv; }
}

interface AnalysisResult {
  complexity: string; // Changed from the strict union of strings
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
  'O(1)': '#81c995',       // Soft Green
  'O(log N)': '#8ab4f8',   // Soft Blue
  'O(N)': '#fde293',       // Soft Yellow
  'O(N log N)': '#fcad70', // Soft Orange
  'O(N^2)': '#f28b82',     // Soft Red
  'O(2^N)': '#c58af9',     // Soft Purple
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Analyzer() {
  const [inputCode, setInputCode] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [credits, setCredits] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  // ─── Firebase Auth & Credit Listener ───────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setCredits(null);
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      const userRef = doc(db, 'user_credits', user.uid);
      
      try {
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          await setDoc(userRef, { credits: 7, last_reset_date: today });
          setCredits(7);
        } else {
          const data = docSnap.data();
          if (data.last_reset_date !== today) {
            await updateDoc(userRef, { credits: 7, last_reset_date: today });
            setCredits(7);
          } else {
            setCredits(data.credits);
          }
        }
      } catch (err) {
        console.error("Error fetching credits:", err);
      }
    });
    return () => unsubscribe(); 
  }, []);

  // ─── Analyze Action ────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    const trimmedCode = inputCode.trim();
    if (!trimmedCode) return;

    setIsAnalyzing(true);
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: trimmedCode }]);
    setInputCode('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      if (!currentUser) throw new Error("You must be logged in to use the analyzer.");

      const today = new Date().toISOString().split('T')[0];
      const userRef = doc(db, 'user_credits', currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) throw new Error("Could not verify credits. Please refresh.");

      let currentCredits = docSnap.data().credits;

      if (docSnap.data().last_reset_date !== today) {
        await updateDoc(userRef, { credits: 7, last_reset_date: today });
        currentCredits = 7;
      }

      if (currentCredits <= 0) {
        throw new Error("You have exhausted your 7 daily credits. Come back tomorrow!");
      }

      const response = await fetch('/.netlify/functions/ask-groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
      
      // 🔥 DEBUG: This will print the AI's exact response in your browser console
      console.log("Raw AI Response:", data.choices[0].message.content); 
      
      let rawContent = data.choices[0].message.content;
      
      // ✅ FIX: Strip markdown backticks before parsing JSON
      rawContent = rawContent.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

      const aiResult = JSON.parse(rawContent) as { complexity?: string; explanation?: string };
      
      // ✅ FIX: Simple check. As long as the AI gives us a string for both, we accept it.
      if (aiResult.complexity && typeof aiResult.complexity === 'string' && aiResult.explanation && typeof aiResult.explanation === 'string') {
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
        
        const newBalance = currentCredits - 1;
        await updateDoc(userRef, { credits: newBalance });
        setCredits(newBalance);
      } else {
        throw new Error("Received invalid format from AI. Check browser console for details.");
      }

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: err.message || "An unexpected error occurred.", isError: true }
      ]);
    } finally {
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
  
  // Extract user's first name dynamically, defaulting to known profile name
  const firstName = currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'Prateek';

  return (
    <div className="analyzer-root">
      <Helmet><title>AlgoLib AI Assistant</title></Helmet>
      
      <div className="navbar-wrapper">
        <Navbar />
      </div>
      
      {/* Spacer added here to prevent content from hiding behind the fixed navbar */}
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
                <div key={idx} className={`message-row ${msg.role}`}>
                  {msg.role === 'ai' && (
                    <div className="ai-avatar">
                      <Sparkles size={16} color="#fff" />
                    </div>
                  )}
                  
                  <div className="message-bubble">
                    {msg.role === 'user' ? (
                      <div className="user-text-bubble">
                        <pre className="user-code"><code>{msg.content}</code></pre>
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
                        
                        <div className="analysis-card">
                          <div className="complexity-header">
                            <span className="complexity-label">Time Complexity</span>
                            <h2 className="complexity-value" style={{ color: COMPLEXITY_COLORS[msg.result.complexity] || '#8ab4f8' }}>
                              {msg.result.complexity}
                            </h2>
                          </div>
                          <p className="complexity-desc">{msg.result.explanation}</p>
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
                
                {/* --- Typing SVG replacing the static <h2> --- */}
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
                placeholder="Paste your code or pseudo-code here..."
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
          background-color: #131314; /* Standard Gemini Dark background */
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
        
        /* Forces space below a fixed/absolute navbar */
        .navbar-spacer {
          height: 72px; /* Adjust this value if your navbar is taller/shorter */
          flex-shrink: 0;
        }

        .app-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* Top Right Token Indicator */
        .tokens-indicator { 
          position: absolute; 
          top: 90px; /* Pushed down slightly to account for the navbar */
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
        
        /* AI Avatar (Gradient Sparkle) */
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

        /* User Message Style */
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

        /* AI Message Layout */
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

        /* Gemini Greeting */
        .greeting-header { margin-bottom: 40px; padding-left: 8px; }
        .greeting-header h1 { margin: 0 0 8px 0; font-size: 44px; font-weight: 500; letter-spacing: -0.5px; }
        .gradient-text { 
          background: linear-gradient(74deg, #2570e9 0%, #64976e 46%, #dd9b50 100%);
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent; 
        }
        .greeting-header h2 { margin: 0; font-size: 44px; font-weight: 500; color: #444746; letter-spacing: -0.5px; }

        /* Search/Input Box */
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