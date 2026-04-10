import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Editor from '@monaco-editor/react';
import { Activity, Zap, Code2, BrainCircuit, AlertCircle } from 'lucide-react';

declare global {
  interface ImportMetaEnv {
    readonly VITE_GROQ_API_KEY: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import Navbar from "@/components/Navbar"; // Assuming you want your navbar here too

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalysisResult {
  complexity: 'O(1)' | 'O(log N)' | 'O(N)' | 'O(N log N)' | 'O(N^2)' | 'O(2^N)';
  explanation: string;
}

// ─── Graph Data Generator ────────────────────────────────────────────────────
// Generates scaled theoretical data points for the Big O notation curves
const generateChartData = () => {
  const data = [];
  for (let n = 1; n <= 20; n++) {
    data.push({
      n: n,
      'O(1)': 10, // Scaled for visibility on chart
      'O(log N)': Math.log2(n) * 15,
      'O(N)': n * 5,
      'O(N log N)': n * Math.log2(n) * 3,
      'O(N^2)': Math.pow(n, 2) * 0.5,
      'O(2^N)': Math.min(Math.pow(2, n) * 0.1, 300), // Capped so it doesn't break the Y-axis scale
    });
  }
  return data;
};

const CHART_DATA = generateChartData();

// Colors for the graph lines
const COMPLEXITY_COLORS = {
  'O(1)': '#10b981',       // Emerald
  'O(log N)': '#34d399',   // Light Emerald
  'O(N)': '#facc15',       // Yellow
  'O(N log N)': '#fb923c', // Orange
  'O(N^2)': '#ef4444',     // Red
  'O(2^N)': '#9f1239',     // Dark Red
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Analyzer() {
  const [code, setCode] = useState<string>('// Paste your C++, Java, Python, or JS code here\n\nfunction calculateSomething(arr) {\n    let sum = 0;\n    for(let i = 0; i < arr.length; i++) {\n        for(let j = 0; j < arr.length; j++) {\n            sum += arr[i] * arr[j];\n        }\n    }\n    return sum;\n}');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError("Please paste some code to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!apiKey) {
        throw new Error("API Key missing. Check your .env file.");
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // UPDATED: Using the latest standard model alias for Groq
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
            {
              role: "user",
              content: code
            }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      // UPDATED: Better error handling to catch the exact 400 reason
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Groq API Error Details:", errorData);
        throw new Error(errorData?.error?.message || `HTTP ${response.status}: Failed to reach Groq.`);
      }

      const data = await response.json();
      const aiResult = JSON.parse(data.choices[0].message.content);
      
      if (aiResult.complexity && aiResult.explanation) {
        setResult(aiResult);
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
      <Helmet>
        <title>Time Complexity Analyzer | AlgoLib</title>
      </Helmet>

      <Navbar />

      <main className="analyzer-main">
        {/* Header Section */}
        <div className="analyzer-header">
          <div className="header-badge">
            <Activity size={14} className="badge-icon" />
            <span>AI-Powered Tool</span>
          </div>
          <h1 className="header-title">Time Complexity Analyzer</h1>
          <p className="header-subtitle">
            Paste your algorithm below. Our engine will analyze the code structure, determine its Big-O time complexity, and map its efficiency curve.
          </p>
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
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <div className="spinner" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={15} fill="currentColor" />
                    <span>Analyze Code</span>
                  </>
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
                  padding: { top: 20, bottom: 20 },
                  scrollBeyondLastLine: false,
                  roundedSelection: false,
                  scrollbar: { vertical: 'hidden', horizontal: 'hidden' }
                }}
              />
            </div>
          </div>

          {/* Right Column: Results & Graph */}
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
                  <p>Click "Analyze Code" to generate the performance profile.</p>
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

                  {/* Graph Visualization */}
                  <div className="graph-container">
                    <span className="graph-title">Efficiency Curve compared to N (Input Size)</span>
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="n" stroke="#475569" tick={{fill: '#64748b', fontSize: 12}} />
                          <YAxis stroke="#475569" tick={{fill: '#64748b', fontSize: 12}} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                            itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                          />
                          
                          {/* Map through all complexities to draw faint lines, and highlight the detected one */}
                          {Object.keys(COMPLEXITY_COLORS).map((key) => {
                            const isHighlighted = result.complexity === key;
                            return (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={COMPLEXITY_COLORS[key as keyof typeof COMPLEXITY_COLORS]}
                                strokeWidth={isHighlighted ? 4 : 1.5}
                                strokeOpacity={isHighlighted ? 1 : 0.15}
                                dot={false}
                                activeDot={isHighlighted ? { r: 6, strokeWidth: 0 } : false}
                                style={{ filter: isHighlighted ? `drop-shadow(0 0 8px ${COMPLEXITY_COLORS[key as keyof typeof COMPLEXITY_COLORS]}80)` : 'none' }}
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

      <style>{`
        .analyzer-root {
          min-height: 100vh;
          background-color: #020617; /* Very dark slate, almost black */
          color: #f1f5f9;
          font-family: 'Inter', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
        }

        .analyzer-main {
          flex: 1;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          padding: 100px 24px 40px; /* Top padding accounts for navbar */
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* ─── Header ─── */
        .analyzer-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
          max-width: 600px;
          margin: 0 auto;
        }

        .header-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 100px;
          color: #60a5fa;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .header-title {
          font-size: 40px;
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1.1;
          background: linear-gradient(to right, #ffffff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-subtitle {
          color: #94a3b8;
          font-size: 16px;
          line-height: 1.6;
        }

        /* ─── Grid Layout ─── */
        .analyzer-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          height: 600px; /* Fixed height for the tools */
        }

        @media (max-width: 1024px) {
          .analyzer-grid {
            grid-template-columns: 1fr;
            height: auto;
            min-height: 800px;
          }
          .code-panel { height: 500px; }
        }

        /* ─── Panels (SaaS Glassmorphism) ─── */
        .panel {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .panel-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: rgba(15, 23, 42, 0.8);
          border-bottom: 1px solid #1e293b;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .panel-title {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
          letter-spacing: 0.2px;
        }

        /* ─── Buttons ─── */
        .analyze-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 0 15px rgba(37, 99, 235, 0.3);
        }

        .analyze-btn:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(37, 99, 235, 0.5);
        }

        .analyze-btn:disabled {
          background: #334155;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* ─── Editor ─── */
        .editor-container {
          flex: 1;
          position: relative;
          background: #0f172a;
        }

        /* ─── Result Content Area ─── */
        .result-content {
          flex: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          background: #0b1120;
          overflow-y: auto;
        }

        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
        }

        .empty-icon {
          opacity: 0.2;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 18px;
          color: #94a3b8;
          margin-bottom: 8px;
        }

        .analyzing-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
        }

        .pulse-ring {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid #3b82f6;
          animation: pulse 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          margin-bottom: 20px;
        }

        @keyframes pulse {
          0% { transform: scale(0.5); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .error-box {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 16px;
          border-radius: 12px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 24px;
          font-size: 14px;
        }

        /* ─── Results Display ─── */
        .results-display {
          display: flex;
          flex-direction: column;
          gap: 24px;
          height: 100%;
        }

        .stat-card {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.4));
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        }

        .stat-label {
          display: block;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .stat-value {
          font-size: 42px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 800;
          margin-bottom: 12px;
          letter-spacing: -2px;
          text-shadow: 0 0 30px currentColor;
        }

        .stat-explanation {
          color: #cbd5e1;
          font-size: 14.5px;
          line-height: 1.6;
        }

        /* ─── Graph ─── */
        .graph-container {
          flex: 1;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          min-height: 250px;
        }

        .graph-title {
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 16px;
        }

        .chart-wrapper {
          flex: 1;
          width: 100%;
        }
      `}</style>
    </div>
  );
}