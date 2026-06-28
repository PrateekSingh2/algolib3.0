"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AppFooter from '@/components/AppFooter';
import { 
  Sparkles, RotateCcw, AlertTriangle, Code2, Brain, Loader2, 
  Terminal, Activity, Info, X, Copy, Check, ChevronRight, Zap, BookOpen,
  ArrowRightLeft
} from 'lucide-react';

// Import the modular sandbox we created above
import LiveSandbox from './LiveSandbox';

// ─── TYPES & CONSTANTS ───────────────────────────────────────────────────────
interface VisualizerPayload { title: string; conceptSummary: string; componentCode: string; }
type EngineState = 'idle' | 'loading' | 'success' | 'error';

const FUNCTION_URL = '/.netlify/functions/realTimeVisualizer'; 
const EXAMPLES = [
  'Binary Search Trace', 'Quick Sort Pivot Visualizer',
  'Dijkstra Pathfinding', 'KMP String Matching State Matrix',
  'Red-Black Tree Insertion Balancing', 'Dynamic Programming Coin Change Grid'
];

// ─── UTILITY COMPONENTS ──────────────────────────────────────────────────────
const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* silent catch */ }
  };
  return (
    <button 
      onClick={handleCopy} 
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        copied 
          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
          : 'bg-white dark:bg-[#21262d] border-slate-200 dark:border-[#30363d] text-slate-600 dark:text-[#8b949e] hover:bg-slate-50 dark:hover:bg-[#30363d]'
      }`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const ShimmerNode = ({ width = '100%', height = '16px', radius = '6px' }: { width?: string; height?: string; radius?: string }) => (
  <div style={{ width, height, borderRadius: radius }} className="bg-slate-200 dark:bg-[#161b22] overflow-hidden relative">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent animate-[shimmerMotion_1.6s_infinite]" />
  </div>
);

// ─── MAIN ENGINE COMPONENT ───────────────────────────────────────────────────
export default function VisualizerEngine() {
  const [inputCriteria, setInputCriteria] = useState('');
  const [executionState, setExecutionState] = useState<EngineState>('idle');
  const [responsePayload, setResponsePayload] = useState<VisualizerPayload | null>(null);
  const [runtimeError, setRuntimeError] = useState('');
  const [inspectCodeMode, setInspectCodeMode] = useState(false);
  const [streamDots, setStreamDots] = useState('');

  const textInputAreaRef = useRef<HTMLTextAreaElement>(null);
  const viewportScrollAnchorRef = useRef<HTMLDivElement>(null);

  const processing = executionState === 'loading';
  const displayResults = executionState === 'success' && !!responsePayload;
  const processFailed = executionState === 'error';
  const submissionValid = inputCriteria.trim().length >= 5 && !processing;

  // Animated dots for loading state
  useEffect(() => {
    if (!processing) return;
    const interval = setInterval(() => setStreamDots(prev => prev.length >= 3 ? '' : prev + '.'), 350);
    return () => clearInterval(interval);
  }, [processing]);

  // Keyboard shortcut submission
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') executeCompilation();
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [submissionValid, inputCriteria]);

  const masterReset = () => {
    setInputCriteria('');
    setExecutionState('idle');
    setResponsePayload(null);
    setRuntimeError('');
    setInspectCodeMode(false);
    textInputAreaRef.current?.focus();
  };

  const executeCompilation = useCallback(async () => {
    if (!submissionValid) return;
    setExecutionState('loading');
    setResponsePayload(null);
    setRuntimeError('');
    setInspectCodeMode(false);

    try {
      const networkResponse = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemInput: inputCriteria.trim() })
      });

      if (!networkResponse.ok) {
        const errorData = await networkResponse.text();
        throw new Error(`HTTP Fault ${networkResponse.status}: ${errorData}`);
      }

      if (!networkResponse.body) throw new Error('Streaming is not supported in this environment.');

      const reader = networkResponse.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let rawContent = '';
      let streamBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        
        streamBuffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
             try {
                const parsed = JSON.parse(trimmedLine);
                if (parsed.error) throw new Error(`Upstream API Error: ${parsed.error.message || JSON.stringify(parsed.error)}`);
             } catch (e) {
                if (e instanceof Error && e.message.includes('Upstream API Error')) throw e;
             }
          }

          if (trimmedLine.startsWith('data: ') && !trimmedLine.includes('[DONE]')) {
            try {
              const parsedData = JSON.parse(trimmedLine.slice(6));
              
              if (parsedData.error) {
                 throw new Error(`Upstream API Error: ${parsedData.error.message || JSON.stringify(parsedData.error)}`);
              }

              const delta = parsedData.choices?.[0]?.delta?.content 
                         || parsedData.choices?.[0]?.message?.content 
                         || parsedData.choices?.[0]?.text
                         || "";
              
              if (delta) {
                rawContent += delta;
              }
            } catch (e) {
              if (e instanceof Error && e.message.includes('Upstream API Error')) {
                 throw e; 
              }
            }
          }
        }
      }

      if (streamBuffer.trim().startsWith('data: ') && !streamBuffer.includes('[DONE]')) {
         try {
            const parsedData = JSON.parse(streamBuffer.trim().slice(6));
            if (parsedData.error) throw new Error(`Upstream API Error: ${parsedData.error.message || JSON.stringify(parsedData.error)}`);
            const delta = parsedData.choices?.[0]?.delta?.content || parsedData.choices?.[0]?.message?.content;
            if (delta) rawContent += delta;
         } catch (e) {
            if (e instanceof Error && e.message.includes('Upstream API Error')) throw e;
         }
      }
      
      let parsedPayload: VisualizerPayload;
      
      try {
        let cleanedText = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '');
        cleanedText = cleanedText.replace(/<think>[\s\S]*$/i, '');
        cleanedText = cleanedText.trim();
        
        let title = "Dynamic Execution Trace";
        let summary = "Code compiled successfully.";
        let code = "";

        if (cleanedText.startsWith('{') && cleanedText.endsWith('}')) {
           try {
             const jsonCandidate = JSON.parse(cleanedText);
             if (jsonCandidate.componentCode) {
                title = jsonCandidate.title || title;
                summary = jsonCandidate.conceptSummary || summary;
                code = jsonCandidate.componentCode;
             }
           } catch (e) {
           }
        }

        if (!code) {
          const titleMatch = cleanedText.match(/(?:Title|TITLE|title)[\s\*:|-]+(.*)/);
          if (titleMatch) title = titleMatch[1].trim().replace(/["']/g, '');

          const summaryMatch = cleanedText.match(/(?:Summary|SUMMARY|Concept Summary|conceptSummary)[\s\*:|-]+(.*)/);
          if (summaryMatch) summary = summaryMatch[1].trim().replace(/["']/g, '');

          const codeBlockMatch = cleanedText.match(/```(?:tsx|jsx|javascript|js|ts|react)?\s*([\s\S]*?)```/i);
          
          if (codeBlockMatch && codeBlockMatch[1].trim().length > 20) {
            code = codeBlockMatch[1].trim();
          } else {
            console.warn("Standard markdown parsing failed. Attempting to salvage raw code...");
            const afterSummaryIdx = summaryMatch ? (summaryMatch.index! + summaryMatch[0].length) : 0;
            code = cleanedText.slice(afterSummaryIdx).trim();
            code = code.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
          }
        }

        const hasRenderCall = (str: string) => /render\s*\(\s*</i.test(str);
        
        if (code && !hasRenderCall(code)) {
          const compNameMatch = code.match(/(?:function\s+|const\s+)([A-Z]\w*)/);
          const compName = compNameMatch ? compNameMatch[1] : 'Visualizer';
          code += `\nrender(<${compName} />);`;
        }

        if (!code || code.length < 50) {
          console.error("RAW AI OUTPUT (Failed):", rawContent);
          if (rawContent.length > 3000) {
             throw new Error('The AI reached its maximum output limit and truncated the code. Please ask for a simpler visualization.');
          }
          throw new Error('The AI produced unrecognizable syntax and no valid React component was found. Check the browser console for the raw output.');
        }

        parsedPayload = { title, conceptSummary: summary, componentCode: code };

      } catch (err) {
        throw err;
      }

      const finalRenderCheck = /render\s*\(\s*</i;
      if (!parsedPayload.componentCode || !finalRenderCheck.test(parsedPayload.componentCode)) {
        throw new Error('Engine rules verification mismatch: Missing valid render call in stream result.');
      }

      setResponsePayload({
        title: parsedPayload.title || 'Dynamic Execution Trace',
        conceptSummary: parsedPayload.conceptSummary || 'Code compiled successfully.',
        componentCode: parsedPayload.componentCode
      });
      
      setExecutionState('success');
      setTimeout(() => viewportScrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);

    } catch (err: unknown) {
      setRuntimeError(err instanceof Error ? err.message : 'An unidentified stream exception occurred.');
      setExecutionState('error');
    }
  }, [submissionValid, inputCriteria]);

  return (
    <HelmetProvider>
      <Helmet>
        <title>AlgoLib Engine | Real-Time Code Synthesis</title>
      </Helmet>

      <style>{`
        @keyframes shimmerMotion { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes spinFrames { to { transform: rotate(360deg); } }
        @keyframes pulseFrames { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      {/* Background Decorators */}
      <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-[#0a0a0f]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(99,102,241,0.1),transparent)] dark:bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(99,102,241,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <Navbar />

      <main className="min-h-screen pt-24 pb-32 px-4 sm:px-6 font-sans">
        <div className="max-w-[920px] mx-auto">
          
          {/* Header */}
          <header className="text-center mb-10">
            <Link to="/visualizer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-200/50 dark:bg-zinc-800/50 hover:bg-slate-200 dark:hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all mb-6">
              <ArrowRightLeft size={12} className="rotate-180" /> Back to Hub
            </Link>
            <br />
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[11px] font-bold tracking-widest uppercase mb-4">
              <Zap size={12} /> CLAUDE 3.5 SONNET COMPILER CORE
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-[#e6edf3] tracking-tight mb-4">
              Real-Time{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-500">
                Algorithmic Trace
              </span>{' '}
              Engine
            </h1>
            <p className="text-slate-600 dark:text-[#8b949e] text-[15px] max-w-2xl mx-auto leading-relaxed">
              Provide structural pseudocode parameters or functional scope definitions to instantly synthesize an interactive visualizer.
            </p>
          </header>

          {/* Input UI */}
          <div className={`rounded-2xl border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#0d1117] overflow-hidden transition-all duration-300 ${submissionValid ? 'shadow-[0_0_32px_rgba(99,102,241,0.08)]' : 'shadow-sm'}`}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-[#21262d] bg-slate-50 dark:bg-[#161b22]">
              <div className="flex items-center gap-2 text-slate-900 dark:text-[#e6edf3] text-[13px] font-semibold">
                <Terminal size={14} className="text-indigo-500" /> Prompt Parameter Workspace
              </div>
              <span className="text-[11px] text-slate-500 dark:text-[#4b5563] font-mono">{inputCriteria.length} / 2000</span>
            </div>

            <textarea
              ref={textInputAreaRef}
              value={inputCriteria}
              onChange={e => e.target.value.length <= 2000 && setInputCriteria(e.target.value)}
              disabled={processing}
              rows={6}
              placeholder={`Specify target execution logic rules. E.g.:\n- Trace standard Quick Sort step-by-step with pivot tracking\n- Build an interactive simulation for Binary Search Tree traversal loops...`}
              className="w-full bg-transparent text-slate-800 dark:text-[#e6edf3] border-none outline-none resize-none p-5 text-sm leading-relaxed font-mono min-h-[150px] placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-0"
            />

            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-[#21262d] bg-slate-50 dark:bg-[#0d1117] flex-wrap gap-3">
              <span className="text-slate-500 dark:text-[#4b5563] text-xs flex items-center gap-2">
                Press <kbd className="px-2 py-0.5 bg-white dark:bg-[#21262d] border border-slate-200 dark:border-[#30363d] rounded font-mono text-[10px] shadow-sm">Ctrl + Enter</kbd> to compile
              </span>
              <div className="flex items-center gap-2.5">
                {(displayResults || processFailed) && (
                  <button onClick={masterReset} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#30363d] bg-white dark:bg-[#21262d] text-slate-600 dark:text-[#8b949e] text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-[#30363d] transition-colors">
                    <RotateCcw size={14} /> Reset
                  </button>
                )}
                <button
                  onClick={executeCompilation}
                  disabled={!submissionValid}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                    submissionValid 
                      ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_4px_16px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)]' 
                      : 'bg-slate-100 dark:bg-[#1a1f35] text-slate-400 dark:text-[#4b5563] cursor-not-allowed'
                  }`}
                >
                  {processing ? <><Loader2 size={16} className="animate-spin" /> Building Runtime{streamDots}</> : <><Sparkles size={16} /> Synthesize Trace</>}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Selections */}
          {executionState === 'idle' && (
            <div className="mt-8">
              <div className="flex items-center gap-2 text-slate-500 dark:text-[#4b5563] text-[11px] font-bold uppercase tracking-wider mb-4">
                <BookOpen size={14} /> Standard Algorithmic Blueprints
              </div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map(blueprintItem => (
                  <button key={blueprintItem} onClick={() => { setInputCriteria(blueprintItem); textInputAreaRef.current?.focus(); }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#21262d] text-slate-600 dark:text-[#8b949e] text-xs font-medium hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                  >
                    <ChevronRight size={12} className="text-indigo-500" /> {blueprintItem}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading Skeletal View */}
          {processing && (
            <div className="mt-8 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-white dark:bg-[#0d1117] overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3 bg-indigo-50/50 dark:bg-indigo-500/5 border-b border-indigo-100 dark:border-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[13px] font-semibold">
                <Brain size={16} className="animate-pulse" /> Compiling runtime visual context layers
              </div>
              <div className="p-6 flex flex-col gap-4">
                <ShimmerNode width="35%" height="22px" />
                <ShimmerNode width="90%" height="14px" />
                <ShimmerNode width="75%" height="14px" />
                <div className="mt-3"><ShimmerNode height="280px" radius="12px" /></div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {processFailed && (
            <div className="mt-8 border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 rounded-2xl p-5 flex gap-4 items-start">
              <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-500 shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1">
                <strong className="block text-red-700 dark:text-red-400 text-sm mb-1.5 font-bold">Pipeline Parsing Instability</strong>
                <p className="text-red-600/80 dark:text-[#8b949e] text-[13px] m-0 leading-relaxed">{runtimeError}</p>
              </div>
              <button onClick={masterReset} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors shrink-0 p-1"><X size={16} /></button>
            </div>
          )}

          {/* Live Result View */}
          {displayResults && responsePayload && (
            <div ref={viewportScrollAnchorRef} className="mt-8 flex flex-col gap-6">
              
              <div className="rounded-2xl border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#0d1117] overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-[#21262d] bg-slate-50 dark:bg-[#161b22]">
                  <div className="flex items-center gap-2">
                    <Brain size={16} className="text-indigo-500" />
                    <span className="text-slate-900 dark:text-[#e6edf3] font-bold text-sm">{responsePayload.title}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold tracking-widest uppercase">
                    <Activity size={12} /> PARSED READY
                  </span>
                </div>
                <div className="p-5 flex gap-3 items-start bg-white dark:bg-[#0d1117]">
                  <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-slate-600 dark:text-[#8b949e] text-[13px] leading-relaxed m-0">{responsePayload.conceptSummary}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#0d1117] overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-[#21262d] bg-slate-50 dark:bg-[#0d1117] gap-4 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-90" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-90" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-90" />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-[#4b5563] font-mono bg-slate-200/50 dark:bg-[#21262d] px-2 py-0.5 rounded">sandbox://algolib.compiler.runtime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setInspectCodeMode(prev => !prev)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#30363d] bg-white dark:bg-[#21262d] text-slate-600 dark:text-[#8b949e] text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#30363d] transition-colors">
                      <Code2 size={14} /> {inspectCodeMode ? 'Hide Trace Code' : 'Inspect Architecture'}
                    </button>
                    <CopyButton content={responsePayload.componentCode} />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0d1117]">
                  <LiveSandbox code={responsePayload.componentCode} />
                </div>

                {inspectCodeMode && (
                  <div className="border-t border-slate-200 dark:border-[#21262d] bg-slate-50 dark:bg-[#0a0a0f]">
                    <div className="px-5 py-3 border-b border-slate-200 dark:border-[#21262d] bg-slate-100 dark:bg-[#161b22] text-slate-500 dark:text-[#8b949e] text-[11px] font-bold tracking-widest uppercase">
                      GENERATED WORKSPACE REACT LOGIC COMPONENT
                    </div>
                    <pre className="m-0 p-5 text-[12px] font-mono text-slate-700 dark:text-[#8b949e] overflow-auto max-h-[350px] leading-relaxed whitespace-pre-wrap custom-scrollbar">
                      {responsePayload.componentCode}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <AppFooter />
    </HelmetProvider>
  );
}