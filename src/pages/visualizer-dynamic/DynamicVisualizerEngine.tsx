"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { 
  Sparkles, RotateCcw, AlertTriangle, Code2, Brain, Loader2, 
  Terminal, Activity, Info, X, Copy, Check, ChevronRight, Zap, BookOpen 
} from 'lucide-react';

// Import the modular sandbox we created above
import LiveSandbox from './LiveSandbox';

// ─── TYPES & CONSTANTS ───────────────────────────────────────────────────────
interface VisualizerPayload { title: string; conceptSummary: string; componentCode: string; }
type EngineState = 'idle' | 'loading' | 'success' | 'error';

// Adjusted for Next.js API Routes instead of Netlify functions
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
      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, background: '#21262d', border: '1px solid #30363d', color: copied ? '#10b981' : '#8b949e', cursor: 'pointer', transition: 'all 0.2s' }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const ShimmerNode = ({ width = '100%', height = '16px', radius = '6px' }: { width?: string; height?: string; radius?: string }) => (
  <div style={{ width, height, borderRadius: radius, background: '#161b22', overflow: 'hidden', position: 'relative' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)', animation: 'shimmerMotion 1.6s infinite' }} />
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

      // 1. Initialize Stream Readers
      const reader = networkResponse.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let rawContent = '';
      let streamBuffer = ''; // Added to store cut-off text

      // 2. Consume the stream chunk by chunk safely
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        
        // The last line might be incomplete, pop it off and save it for the next loop
        streamBuffer = lines.pop() || '';

        // Parse fully assembled OpenRouter SSE lines
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Check for direct JSON API error (non-streamed error response)
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

              // Extract text from standard or alternative formats
              const delta = parsedData.choices?.[0]?.delta?.content 
                         || parsedData.choices?.[0]?.message?.content 
                         || parsedData.choices?.[0]?.text
                         || "";
              
              if (delta) {
                rawContent += delta;
              }
            } catch (e) {
              if (e instanceof Error && e.message.includes('Upstream API Error')) {
                 throw e; // Bubble up API errors immediately
              }
              // console.warn("SSE Parse Error on line:", trimmedLine);
            }
          }
        }
      }

      // Process any trailing data in the buffer
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
      
      console.log("Raw Compiled AI Output Length:", rawContent.length);

      // 3. Post-Process the fully accumulated string
      let parsedPayload: VisualizerPayload;
      
      try {
        // Remove complete <think> blocks
        let cleanedText = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '');
        // Remove unclosed <think> blocks (in case stream ended abruptly)
        cleanedText = cleanedText.replace(/<think>[\s\S]*$/i, '');
        cleanedText = cleanedText.trim();
        
        let title = "Dynamic Execution Trace";
        let summary = "Code compiled successfully.";
        let code = "";

        // First, if the LLM stubbornly returned JSON anyway
        if (cleanedText.startsWith('{') && cleanedText.endsWith('}')) {
           try {
             const jsonCandidate = JSON.parse(cleanedText);
             if (jsonCandidate.componentCode) {
                title = jsonCandidate.title || title;
                summary = jsonCandidate.conceptSummary || summary;
                code = jsonCandidate.componentCode;
             }
           } catch (e) {
             // Fall through to regex
           }
        }

        // Only run regex extraction if we didn't already get the code from JSON
        if (!code) {
          // Extract Title
          const titleMatch = cleanedText.match(/(?:Title|TITLE|title)[\s\*:|-]+(.*)/);
          if (titleMatch) title = titleMatch[1].trim().replace(/["']/g, '');

          // Extract Summary
          const summaryMatch = cleanedText.match(/(?:Summary|SUMMARY|Concept Summary|conceptSummary)[\s\*:|-]+(.*)/);
          if (summaryMatch) summary = summaryMatch[1].trim().replace(/["']/g, '');

          // Extract Code using markdown backticks
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

        // MAGIC FIX: Auto-append render call if missing! 
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
        throw err; // Propagate the error so the UI handles it
      }

      // 4. Final Verification and Execution
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

  const elementContainerStyle = { borderRadius: '16px', border: '1px solid #21262d', background: '#0d1117', overflow: 'hidden' as const };
  const functionalHeaderDeckStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #21262d', background: '#161b22' };
  const auxiliaryButtonStyle = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: '#21262d', border: '1px solid #30363d', color: '#8b949e', cursor: 'pointer' as const, fontSize: '13px', fontWeight: 500 };

  return (
    <HelmetProvider>
      <Helmet>
        <title>AlgoLib Engine | Real-Time Code Synthesis</title>
      </Helmet>

      {/* Global Styles for Keyframes & Scrollbars */}
      <style>{`
        @keyframes shimmerMotion { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes spinFrames { to { transform: rotate(360deg); } }
        @keyframes pulseFrames { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #484f58; }
        body { background-color: #0a0a0f; margin: 0; }
      `}</style>

      {/* Background Decorators */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: '#0a0a0f' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle 800px at 50% -100px, rgba(99,102,241,0.15), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <main style={{ minHeight: '100vh', padding: '40px 20px 100px', fontFamily: '"Inter", sans-serif' }}>
        <div style={{ maxWidth: '920px', margin: '0 auto' }}>
          
          {/* Header */}
          <header style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
              <Zap size={12} /> CLAUDE 3.5 SONNET COMPILER CORE
            </div>
            <h1 style={{ fontSize: '38px', fontWeight: 800, color: '#e6edf3', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Real-Time{' '}
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Algorithmic Trace
              </span>{' '}
              Engine
            </h1>
            <p style={{ color: '#8b949e', fontSize: '15px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              Provide structural pseudocode parameters or functional scope definitions.
            </p>
          </header>

          {/* Input UI */}
          <div style={{ ...elementContainerStyle, boxShadow: submissionValid ? '0 0 32px rgba(99,102,241,0.08)' : 'none', transition: 'all 0.3s' }}>
            <div style={functionalHeaderDeckStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e6edf3', fontSize: '13px', fontWeight: 600 }}>
                <Terminal size={14} style={{ color: '#6366f1' }} /> Prompt Parameter Workspace
              </div>
              <span style={{ fontSize: '11px', color: '#4b5563', fontFamily: 'monospace' }}>{inputCriteria.length} / 2000</span>
            </div>

            <textarea
              ref={textInputAreaRef}
              value={inputCriteria}
              onChange={e => e.target.value.length <= 2000 && setInputCriteria(e.target.value)}
              disabled={processing}
              rows={6}
              placeholder={`Specify target execution logic rules. E.g.:\n- Trace standard Quick Sort step-by-step with pivot tracking\n- Build an interactive simulation for Binary Search Tree traversal loops...`}
              style={{ width: '100%', background: '#0d1117', color: '#e6edf3', border: 'none', outline: 'none', resize: 'none', padding: '18px', fontSize: '14px', lineHeight: '1.7', fontFamily: 'monospace', boxSizing: 'border-box', minHeight: '150px' }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderTop: '1px solid #21262d', background: '#0d1117', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ color: '#4b5563', fontSize: '12px' }}>
                Press <kbd style={{ padding: '2px 6px', background: '#21262d', border: '1px solid #30363d', borderRadius: '4px', color: '#8b949e', fontSize: '11px' }}>Ctrl + Enter</kbd> to compile
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {(displayResults || processFailed) && <button onClick={masterReset} style={auxiliaryButtonStyle}><RotateCcw size={13} /> Reset</button>}
                <button
                  onClick={executeCompilation}
                  disabled={!submissionValid}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: submissionValid ? 'pointer' : 'not-allowed', background: submissionValid ? '#6366f1' : '#1a1f35', color: submissionValid ? '#ffffff' : '#4b5563', boxShadow: submissionValid ? '0 4px 16px rgba(99,102,241,0.25)' : 'none', transition: 'all 0.2s' }}
                >
                  {processing ? <><Loader2 size={14} style={{ animation: 'spinFrames 1s linear infinite' }} /> Building Runtime{streamDots}</> : <><Sparkles size={14} /> Synthesize Trace</>}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Selections */}
          {executionState === 'idle' && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                <BookOpen size={12} /> Standard Algorithmic Blueprints
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {EXAMPLES.map(blueprintItem => (
                  <button key={blueprintItem} onClick={() => { setInputCriteria(blueprintItem); textInputAreaRef.current?.focus(); }}
                    style={{ padding: '6px 14px', borderRadius: '999px', background: '#0d1117', border: '1px solid #21262d', color: '#8b949e', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}
                  >
                    <ChevronRight size={12} style={{ color: '#6366f1' }} /> {blueprintItem}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading Skeletal View */}
          {processing && (
            <div style={{ ...elementContainerStyle, marginTop: '32px' }}>
              <div style={{ ...functionalHeaderDeckStyle, background: 'rgba(99,102,241,0.03)', borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontSize: '13px', fontWeight: 600 }}>
                  <Brain size={14} style={{ animation: 'pulseFrames 1.5s infinite ease-in-out', color: '#6366f1' }} />
                  Compiling runtime visual context layers
                </div>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <ShimmerNode width="35%" height="22px" />
                <ShimmerNode width="90%" height="14px" />
                <ShimmerNode width="75%" height="14px" />
                <div style={{ marginTop: '12px' }}><ShimmerNode height="280px" radius="12px" /></div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {processFailed && (
            <div style={{ marginTop: '32px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)' }}>
                <AlertTriangle size={16} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#f87171', display: 'block', fontSize: '14px', marginBottom: '4px' }}>Pipeline Parsing Instability</strong>
                <p style={{ color: '#8b949e', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>{runtimeError}</p>
              </div>
              <button onClick={masterReset} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }}><X size={16} /></button>
            </div>
          )}

          {/* Live Result View */}
          {displayResults && responsePayload && (
            <div ref={viewportScrollAnchorRef} style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={elementContainerStyle}>
                <div style={functionalHeaderDeckStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Brain size={14} style={{ color: '#6366f1' }} />
                    <span style={{ color: '#e6edf3', fontWeight: 600, fontSize: '14px' }}>{responsePayload.title}</span>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' }}>
                    <Activity size={10} /> PARSED READY
                  </span>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#0d1117' }}>
                  <Info size={14} style={{ color: '#6366f1', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ color: '#8b949e', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{responsePayload.conceptSummary}</p>
                </div>
              </div>

              <div style={{ ...elementContainerStyle, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#0d1117', borderBottom: '1px solid #21262d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['#ef4444', '#f59e0b', '#10b981'].map(colorDot => <span key={colorDot} style={{ width: '10px', height: '10px', borderRadius: '50%', background: colorDot, opacity: 0.8 }} />)}
                    </div>
                    <span style={{ fontSize: '12px', color: '#4b5563', fontFamily: 'monospace' }}>sandbox://algolib.compiler.runtime</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setInspectCodeMode(prev => !prev)} style={auxiliaryButtonStyle}>
                      <Code2 size={12} /> {inspectCodeMode ? 'Hide Trace Code' : 'Inspect Architecture'}
                    </button>
                    <CopyButton content={responsePayload.componentCode} />
                  </div>
                </div>

                {/* THE RENDERED SANDBOX IS INJECTED HERE */}
                <LiveSandbox code={responsePayload.componentCode} />

                {inspectCodeMode && (
                  <div style={{ borderTop: '1px solid #21262d', background: '#0a0a0f' }}>
                    <div style={{ padding: '10px 18px', background: '#161b22', borderBottom: '1px solid #21262d', color: '#8b949e', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em' }}>
                      GENERATED WORKSPACE REACT LOGIC COMPONENT
                    </div>
                    <pre style={{ margin: 0, padding: '18px', fontSize: '12px', fontFamily: 'monospace', color: '#8b949e', overflow: 'auto', maxHeight: '350px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {responsePayload.componentCode}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </HelmetProvider>
  );
}