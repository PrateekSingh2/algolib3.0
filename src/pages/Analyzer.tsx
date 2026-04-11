import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Editor from '@monaco-editor/react';
import { Activity, Zap, Code2, BrainCircuit, AlertCircle, Sparkles, BatteryCharging } from 'lucide-react';

// ─── FIREBASE IMPORTS ────────────────────────────────────────────────────────
import { auth, firestoreDB as db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Navbar from "@/components/Navbar"; 
import AppFooter from '@/components/AppFooter';
import App from '@/App';

// ─── Environment & Types ─────────────────────────────────────────────────────
declare global {
  interface ImportMetaEnv {
    readonly VITE_GROQ_API_KEY: string;
  }
  interface ImportMeta { readonly env: ImportMetaEnv; }
}

interface AnalysisResult {
  complexity: 'O(1)' | 'O(log N)' | 'O(N)' | 'O(N log N)' | 'O(N^2)' | 'O(2^N)';
  explanation: string;
}

// ─── Graph Data Generator ────────────────────────────────────────────────────
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
  'O(1)': '#10b981', 'O(log N)': '#34d399', 'O(N)': '#facc15',
  'O(N log N)': '#fb923c', 'O(N^2)': '#ef4444', 'O(2^N)': '#9f1239',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Analyzer() {
  const [code, setCode] = useState<string>('// Paste your code here\n\nfunction calculateSomething(arr) {\n    let sum = 0;\n    for(let i = 0; i < arr.length; i++) {\n        for(let j = 0; j < arr.length; j++) {\n            sum += arr[i] * arr[j];\n        }\n    }\n    return sum;\n}');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [credits, setCredits] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

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
    if (!code.trim()) {
      setError("Please paste some code to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

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

      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error("API Key missing. Check your .env file.");

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", 
          messages: [
            {
              role: "system",
              content: `You are an expert algorithm analyzer. Read the code and determine its Big-O time complexity. 
              Respond ONLY with a valid JSON object. No markdown, no other text.
              Format: {"complexity": "...", "explanation": "..."}
              The 'complexity' value MUST be exactly one of these strings: "O(1)", "O(log N)", "O(N)", "O(N log N)", "O(N^2)", "O(2^N)".
              The 'explanation' should be 2 concise sentences explaining why.`
            },
            { role: "user", content: code }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `HTTP ${response.status}: Failed to reach Groq.`);
      }

      const data = await response.json();
      const aiResult = JSON.parse(data.choices[0].message.content);
      
      if (aiResult.complexity && aiResult.explanation) {
        setResult(aiResult);
        const newBalance = currentCredits - 1;
        await updateDoc(userRef, { credits: newBalance });
        setCredits(newBalance);
      } else {
        throw new Error("Received invalid format from AI.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="analyzer-root">
      <Helmet><title>Time Complexity Analyzer | AlgoLib</title></Helmet>
      
      <Navbar />

      <main className="analyzer-main">
        {/* ─── Professional Dashboard Banner ─── */}
        <div className="dashboard-banner">
          <div className="banner-info">
            <div className="banner-icon-wrapper">
              <Sparkles className="banner-icon" size={28} />
            </div>
            <div className="banner-text">
              <h1 className="banner-title">Algorithm Analyzer</h1>
              <p className="banner-subtitle">Evaluate your code's time complexity and efficiency instantly.</p>
            </div>
          </div>
          
          <div className="banner-stats">
            <div className="stat-widget primary-widget">
              <div className="widget-icon-box"><Zap size={18} /></div>
              <div className="widget-data">
                <span className="widget-value">{credits !== null ? credits : '-'}</span>
                <span className="widget-label">Credits Left</span>
              </div>
            </div>
            
            <div className="stat-widget secondary-widget">
              <div className="widget-icon-box"><BatteryCharging size={18} /></div>
              <div className="widget-data">
                <span className="widget-value">{credits !== null ? 7 - credits : '-'}</span>
                <span className="widget-label">Used Today</span>
              </div>
            </div>
          </div>
        </div>

        <div className="analyzer-grid">
          
          {/* Left Column: Code Input */}
          <div className="panel code-panel">
            <div className="panel-topbar">
              <div className="topbar-left">
                <Code2 size={16} className="text-slate-400" />
                <span className="panel-title">Source Code</span>
              </div>
              <button 
                className={`analyze-btn ${isAnalyzing ? 'analyzing' : ''}`}
                onClick={handleAnalyze}
                disabled={isAnalyzing || credits === 0 || !currentUser}
              >
                {isAnalyzing ? (
                  <><div className="spinner" /><span>Analyzing...</span></>
                ) : (
                  <><Zap size={15} fill="currentColor" /><span>Analyze Code</span></>
                )}
              </button>
            </div>
            
            <div className="editor-container">
              <Editor
                height="100%" 
                theme="vs-dark" 
                defaultLanguage="javascript"
                value={code} 
                onChange={(val) => setCode(val || '')}
                options={{ 
                  minimap: { enabled: false }, 
                  fontSize: 14, 
                  fontFamily: "'Fira Code', 'JetBrains Mono', monospace", 
                  padding: { top: 20, bottom: 20 } 
                }}
              />
            </div>
          </div>

          {/* Right Column: Results & Enhanced Graph */}
          <div className="panel result-panel">
            <div className="panel-topbar">
              <div className="topbar-left">
                <BrainCircuit size={16} className="text-slate-400" />
                <span className="panel-title">Analysis Engine</span>
              </div>
            </div>

            <div className="result-content">
              {error && (
                <div className="error-box">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {!result && !error && !isAnalyzing && (
                <div className="empty-state">
                  <Activity size={48} className="empty-icon" />
                  <h3>Awaiting Input</h3>
                  <p>Paste your algorithm and click "Analyze Code" to generate a performance profile.</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="analyzing-state">
                  <div className="pulse-ring"></div>
                  <p>Parsing abstract syntax tree...</p>
                </div>
              )}

              {result && !isAnalyzing && (
                <div className="results-display">
                  
                  {/* Glassmorphic Stat Card */}
                  <div className="stat-card">
                    <span className="stat-label">Detected Time Complexity</span>
                    <h2 className="stat-value" style={{ color: COMPLEXITY_COLORS[result.complexity] || '#3b82f6' }}>
                      {result.complexity}
                    </h2>
                    <p className="stat-explanation">{result.explanation}</p>
                  </div>

                  {/* Enhanced Graph Visualization */}
                  <div className="graph-container">
                    <span className="graph-title">Time/Cost(Y-axis) vs Input Size(X-axis)</span>
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          
                          {/* ─── SVG Filter for Neon Glow ─── */}
                          <defs>
                            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>

                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                          <XAxis dataKey="n" stroke="#475569" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} />
                          <YAxis stroke="#475569" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} />
                          
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                              backdropFilter: 'blur(8px)', 
                              border: '1px solid #334155', 
                              borderRadius: '12px', 
                              color: '#f1f5f9', 
                              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' 
                            }}
                            itemStyle={{ fontSize: '14px', fontWeight: 600 }}
                            labelStyle={{ color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' }}
                          />
                          
                          {Object.keys(COMPLEXITY_COLORS).map((key) => {
                            const isHighlighted = result.complexity === key;
                            return (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={COMPLEXITY_COLORS[key as keyof typeof COMPLEXITY_COLORS]}
                                strokeWidth={isHighlighted ? 5 : 2}
                                strokeOpacity={isHighlighted ? 1 : 0.1}
                                dot={isHighlighted ? { r: 4, fill: '#0f172a', strokeWidth: 2 } : false}
                                activeDot={isHighlighted ? { r: 8, strokeWidth: 0, fill: '#fff' } : false}
                                filter={isHighlighted ? 'url(#neonGlow)' : 'none'}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <AppFooter />

      <style>{`
        /* ─── Global & Layout ─── */
        .analyzer-root { min-height: 100vh; background-color: #020617; color: #f1f5f9; font-family: 'Inter', system-ui, sans-serif; display: flex; flex-direction: column; }
        .analyzer-main { flex: 1; max-width: 1400px; margin: 0 auto; width: 100%; padding: 120px 24px 40px; display: flex; flex-direction: column; gap: 32px; }
        
        /* ─── Professional Dashboard Banner ─── */
        .dashboard-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.8) 100%);
          border: 1px solid #1e293b;
          border-radius: 20px;
          padding: 28px 36px;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
        }

        .banner-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .banner-icon-wrapper {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .banner-title {
          font-size: 24px;
          font-weight: 700;
          color: #f8fafc;
          margin: 0 0 6px 0;
          letter-spacing: -0.5px;
        }

        .banner-subtitle {
          font-size: 15px;
          color: #94a3b8;
          margin: 0;
        }

        .banner-stats {
          display: flex;
          gap: 16px;
        }

        .stat-widget {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #0b1120;
          border: 1px solid #1e293b;
          padding: 12px 24px 12px 16px;
          border-radius: 14px;
        }

        .primary-widget {
          border-color: rgba(59, 130, 246, 0.3);
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.5) 0%, rgba(37, 99, 235, 0.05) 100%);
        }

        .widget-icon-box {
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .primary-widget .widget-icon-box {
          color: #3b82f6;
        }

        .widget-data {
          display: flex;
          flex-direction: column;
        }

        .widget-value {
          font-size: 18px;
          font-weight: 700;
          color: #f8fafc;
          line-height: 1.1;
        }

        .primary-widget .widget-value {
          color: #60a5fa;
        }

        .widget-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-top: 2px;
        }

        @media (max-width: 900px) {
          .dashboard-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
            padding: 24px;
          }
          .banner-stats {
            width: 100%;
            flex-wrap: wrap;
          }
          .stat-widget { flex: 1; min-width: 140px; }
        }

        /* ─── Grid & Panels ─── */
        .analyzer-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; height: 650px; }
        @media (max-width: 1024px) { .analyzer-grid { grid-template-columns: 1fr; height: auto; min-height: 800px; } .code-panel { height: 500px; } }
        
        .panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .panel-topbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid #1e293b; }
        .topbar-left { display: flex; align-items: center; gap: 10px; }
        .panel-title { font-size: 14px; font-weight: 600; color: #e2e8f0; letter-spacing: 0.2px; }
        
        .analyze-btn { display: flex; align-items: center; gap: 8px; background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 0 15px rgba(37, 99, 235, 0.3); }
        .analyze-btn:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 0 20px rgba(37, 99, 235, 0.5); }
        .analyze-btn:disabled { background: #334155; color: #94a3b8; cursor: not-allowed; box-shadow: none; }
        
        .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        /* ─── Editor & Results ─── */
        .editor-container { flex: 1; position: relative; background: #0f172a; }
        .result-content { flex: 1; padding: 24px; display: flex; flex-direction: column; background: #0b1120; overflow-y: auto; }
        
        .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #64748b; }
        .empty-icon { opacity: 0.2; margin-bottom: 16px; }
        .empty-state h3 { font-size: 18px; color: #94a3b8; margin-bottom: 8px; }
        
        .analyzing-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #3b82f6; }
        .pulse-ring { width: 60px; height: 60px; border-radius: 50%; border: 2px solid #3b82f6; animation: pulse 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; margin-bottom: 20px; }
        @keyframes pulse { 0% { transform: scale(0.5); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        
        .error-box { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; padding: 16px; border-radius: 12px; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; font-size: 14px; }
        .results-display { display: flex; flex-direction: column; gap: 24px; height: 100%; }
        
        /* ─── Stats & Graph ─── */
        .stat-card { background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.4)); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 24px; position: relative; overflow: hidden; }
        .stat-label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px; font-weight: 600; }
        .stat-value { font-size: 42px; font-family: 'JetBrains Mono', monospace; font-weight: 800; margin-bottom: 12px; letter-spacing: -2px; text-shadow: 0 0 30px currentColor; }
        .stat-explanation { color: #cbd5e1; font-size: 14.5px; line-height: 1.6; }
        
        .graph-container { flex: 1; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; min-height: 250px; }
        .graph-title { font-size: 13px; font-weight: 600; color: #94a3b8; margin-bottom: 16px; }
        .chart-wrapper { flex: 1; width: 100%; }
      `}</style>
    </div>
  );
}