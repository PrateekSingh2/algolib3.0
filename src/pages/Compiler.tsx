import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Editor from '@monaco-editor/react';
import { Play, X, Trash2, Moon, Sun, Maximize2, Minimize, Copy, Save, Zap, AlignLeft, Square } from 'lucide-react';
import { Icon } from '@iconify/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Navbar from "@/components/Navbar";
import { toast } from 'sonner';

// ─── Language Config ─────────────────────────────────────────────────────────

interface LangConfig {
  id: string;
  label: string;
  monacoLang: string;
  filename: string;
  icon: string;
  color: string;
  template: string;
}

const LANGUAGES: LangConfig[] = [
  {
    id: 'cpp',
    label: 'C++',
    monacoLang: 'cpp',
    filename: 'main.cpp',
    icon: 'logos:c-plusplus',
    color: '#00599C',
    template: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write C++ code here
    cout << "Welcome to AlgoLib Compiler" << endl;

    return 0;
}`,
  },
  {
    id: 'c',
    label: 'C',
    monacoLang: 'c',
    filename: 'main.c',
    icon: 'logos:c',
    color: '#A8B9CC',
    template: `#include <stdio.h>

int main() {
    // Write C code here
    printf("Welcome to AlgoLib Compiler\\n");

    return 0;
}`,
  },
  {
    id: 'python',
    label: 'Python',
    monacoLang: 'python',
    filename: 'main.py',
    icon: 'logos:python',
    color: '#3776AB',
    template: `# Write Python code here
print("Welcome to AlgoLib Compiler")`,
  },
  {
    id: 'java',
    label: 'Java',
    monacoLang: 'java',
    filename: 'Main.java',
    icon: 'logos:java',
    color: '#ED8B00',
    template: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Write Java code here
        System.out.println("Welcome to AlgoLib Compiler");
    }
}`,
  },
  {
    id: 'javascript',
    label: 'JS',
    monacoLang: 'javascript',
    filename: 'main.js',
    icon: 'logos:javascript',
    color: '#F7DF1E',
    template: `// Write JavaScript code here
console.log("Welcome to AlgoLib Compiler");`,
  }
];

// Map API language IDs
const API_LANG_MAP: Record<string, string> = {
  cpp: 'c++',
  c: 'c',
  python: 'python',
  java: 'java',
  javascript: 'javascript'
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Compiler() {
  const [activeLang, setActiveLang] = useState<LangConfig>(LANGUAGES[0]);
  const [openTabs, setOpenTabs] = useState<LangConfig[]>([LANGUAGES[0]]);
  const [editorFontSize, setEditorFontSize] = useState<number>(14);
  const [terminalFontSize, setTerminalFontSize] = useState<number>(13);
  const [codes, setCodes] = useState<Record<string, string>>(
    Object.fromEntries(LANGUAGES.map(l => [l.id, l.template]))
  );
  
  const [output, setOutput] = useState('');
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [executionMetrics, setExecutionMetrics] = useState<{ time?: string | number; memory?: string | number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [input, setInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const editorRef = useRef<any>(null);
  const errorDecorationsRef = useRef<any>([]);
  const compilerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<any>(null);

  // Execution controls for forceful stop
  const abortRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle responsive layout detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize(); // Check initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const highlightErrorIfAny = (outText: string) => {
    if (!editorRef.current) return;
    
    let errorLine: number | null = null;
    const cppJavaMatch = outText.match(/:(\d+)(?::\d+)?:\s*(?:error|fatal error)/i);
    const pyMatch = outText.match(/line\s+(\d+)/i);
    const genericMatch = outText.match(/(?:error|exception).*line\s+(\d+)/i);

    if (cppJavaMatch) errorLine = parseInt(cppJavaMatch[1], 10);
    else if (pyMatch) errorLine = parseInt(pyMatch[1], 10);
    else if (genericMatch) errorLine = parseInt(genericMatch[1], 10);

    const newDecorations: any[] = [];
    if (errorLine && !isNaN(errorLine)) {
      newDecorations.push({
        range: { startLineNumber: errorLine, startColumn: 1, endLineNumber: errorLine, endColumn: 1 },
        options: {
          isWholeLine: true,
          className: 'error-line-highlight',
          hoverMessage: { value: '**Syntax / Execution Error** detected near this line.' }
        }
      });
    }

    if (typeof editorRef.current.createDecorationsCollection === 'function') {
      if (!editorRef.current._errCollection) {
        editorRef.current._errCollection = editorRef.current.createDecorationsCollection();
      }
      editorRef.current._errCollection.set(newDecorations);
    } else {
      errorDecorationsRef.current = editorRef.current.deltaDecorations(errorDecorationsRef.current, newDecorations);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    hideTimeoutRef.current = setTimeout(() => setNavVisible(false), 3000);
    return () => clearTimeout(hideTimeoutRef.current);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => toast.error("Fullscreen not supported"));
    } else {
      await document.exitFullscreen().catch(() => { });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const handleFormatCode = () => {
    if (!editorRef.current) return;

    const lang = activeLang.id;

    // Monaco natively supports JS formatting
    if (lang === 'javascript') {
      editorRef.current.trigger('keyboard', 'editor.action.formatDocument', null);
      toast.success("Code formatted successfully");
      return;
    }

    // Python is whitespace sensitive, auto-formatting by brace counting breaks it
    if (lang === 'python') {
      toast.error("Auto-format unavailable for Python (whitespace-sensitive)");
      return;
    }

    // Smart Custom Formatter for C, C++, Java
    try {
      const model = editorRef.current.getModel();
      const currentCode = model.getValue();
      
      let indentLevel = 0;
      let formattedLines = [];
      const lines = currentCode.split('\n');

      for (let line of lines) {
        let trimmed = line.trim();
        
        if (!trimmed) {
          formattedLines.push('');
          continue;
        }

        // Decrease indent if line starts with closing brace
        if (trimmed.startsWith('}')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        // Apply current indent
        const indentStr = '    '.repeat(indentLevel);
        formattedLines.push(indentStr + trimmed);

        // Adjust indent for next lines based on braces in this line
        const openBraces = (trimmed.match(/\{/g) || []).length;
        const closeBraces = (trimmed.match(/\}/g) || []).length;
        
        if (!trimmed.startsWith('}')) {
          indentLevel += (openBraces - closeBraces);
        } else {
          // If it started with '}', we already decremented. So net change is open - (close - 1)
          indentLevel += openBraces - (closeBraces - 1);
        }
        
        indentLevel = Math.max(0, indentLevel);
      }
      
      const formattedCode = formattedLines.join('\n');
      
      // Use executeEdits to apply format without breaking Undo history
      editorRef.current.executeEdits('formatter', [{
        range: model.getFullModelRange(),
        text: formattedCode,
        forceMoveMarkers: true
      }]);
      
      toast.success("Code formatted successfully");
    } catch (e) {
      toast.error("Failed to format code");
    }
  };

  const handleSaveFile = () => {
    const currentCode = codes[activeLang.id];
    
    const extension = activeLang.filename.split('.').pop() || 'txt';
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const fileName = `code_${dateStr}_${timeStr}.${extension}`;
    
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Saved as ${fileName}`);
  };

  const code = codes[activeLang.id];
  const setCode = (val: string) => setCodes(prev => ({ ...prev, [activeLang.id]: val }));

  const handleLangSwitch = (lang: LangConfig) => {
    if (!openTabs.find(t => t.id === lang.id)) {
      setOpenTabs(prev => [...prev, lang]);
    }
    setActiveLang(lang);
    setOutput('');
    setExecutionStatus('idle');
    setExecutionMetrics(null);
    highlightErrorIfAny('');
  };

  const handleCloseTab = (e: React.MouseEvent, langId: string) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.id !== langId);
    if (newTabs.length === 0) {
      setOpenTabs([LANGUAGES[0]]);
      setActiveLang(LANGUAGES[0]);
    } else {
      setOpenTabs(newTabs);
      if (activeLang.id === langId) {
        setActiveLang(newTabs[newTabs.length - 1]);
      }
    }
  };

  const handleStopCode = () => {
    if (isRunning) {
      abortRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsRunning(false);
      setExecutionStatus('error');
      setOutput('[Execution forcefully stopped by user]');
      toast.info("Execution stopped");
    }
  };

  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setExecutionStatus('running');
    setOutput('Submitting to execution queue...');
    setExecutionMetrics(null);
    highlightErrorIfAny('');

    abortRef.current = false;
    abortControllerRef.current = new AbortController();

    const ENGINE_API_URL = 'https://rajawatprateek-algolib-engine.hf.space/execute';
    const STATUS_API_URL = 'https://rajawatprateek-algolib-engine.hf.space/status';

    try {
      const res = await fetch(ENGINE_API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: API_LANG_MAP[activeLang.id] || activeLang.id,
          code,
          input,
        }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to reach server.`);
      
      const { jobId } = await res.json();
      
      let isFinished = false;
      while (!isFinished) {
        if (abortRef.current) throw new Error("Execution forcefully stopped by user.");

        await new Promise(resolve => setTimeout(resolve, 1000)); 
        
        if (abortRef.current) throw new Error("Execution forcefully stopped by user.");

        const statusRes = await fetch(`${STATUS_API_URL}/${jobId}`, {
          signal: abortControllerRef.current.signal
        });
        
        if (!statusRes.ok) throw new Error("Failed to fetch job status.");
        
        const statusData = await statusRes.json();

        if (statusData.status === 'queued') {
            setOutput(`[Queue] Waiting for server resources... Position: ${statusData.position}`);
        } else if (statusData.status === 'running') {
            setOutput(`[Executing] Code is now running...`);
        } else if (statusData.status === 'success' || statusData.status === 'error') {
            isFinished = true;
            let cleanOutput = (statusData.output || '').trim();

            if (activeLang.id === 'java') {
              cleanOutput = cleanOutput.replace(/Main_[a-fA-F0-9]+/g, 'Main');
            }
            
            if (statusData.status === 'error' || statusData.statusCode === 500) {
              throw new Error(cleanOutput || "Execution Error");
            }
            
            setOutput(cleanOutput || '(no output)');
            setExecutionStatus('success');
            setExecutionMetrics({
              time: statusData.time ?? statusData.executionTime,
              memory: statusData.memory ?? statusData.memoryUsage
            });
            highlightErrorIfAny(cleanOutput);
        }
      }
      
    } catch (e: any) {
      if (e.name === 'AbortError' || abortRef.current) {
        setOutput('[Execution forcefully stopped by user]');
        setExecutionStatus('error');
        highlightErrorIfAny('');
      } else {
        const errMsg = e.message;
        setOutput(errMsg.toLowerCase().startsWith('error') ? errMsg : `Error: ${errMsg}`);
        setExecutionStatus('error');
        highlightErrorIfAny(errMsg);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const bg = darkMode ? '#0a0a0a' : '#f8fafc';
  const editorTheme = darkMode ? 'vs-dark' : 'vs';

  return (
    <div className={`compiler-root ${isFullscreen ? 'is-fullscreen' : ''}`} data-theme={darkMode ? 'dark' : 'light'} ref={compilerRef}>
      <Helmet>
        {/* ─── Primary Meta Tags ─── */}
        <title>AlgoLib Compiler | Lightning-Fast Online IDE & Code Runner</title>
        <meta name="title" content="AlgoLib Compiler | Lightning-Fast Online IDE & Code Runner" />
        <meta 
          name="description" 
          content="Write, compile, and execute code instantly with AlgoLib's high-performance online compiler. Features an interactive terminal, auto-formatting, and support for C, C++, Java, Python, and JavaScript." 
        />
        <meta 
          name="keywords" 
          content="online compiler, free online IDE, code runner, run C++ online, Python interpreter, Java compiler, JavaScript console, algorithm visualization, code library, AlgoLib, Algolib Compiler" 
        />
        <meta name="author" content="AlgoLib Team" />
        
        {/* ─── Technical & Crawling Directives ─── */}
        <link rel="canonical" href="https://algolib.netlify.app/compiler/" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#0a0a0a" />

        {/* ─── Open Graph / Facebook / LinkedIn ─── */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://algolib.netlify.app/compiler/" />
        <meta property="og:site_name" content="AlgoLib" />
        <meta property="og:title" content="AlgoLib Compiler | Lightning-Fast Online IDE" />
        <meta 
          property="og:description" 
          content="Write, compile, and execute C, C++, Java, Python, and JS instantly. Build and test your algorithms with a professional-grade online IDE." 
        />
        <meta property="og:image" content="https://ik.imagekit.io/g7e4hyclo/Screenshot%202026-04-03%20000611.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="AlgoLib Online Compiler Interface" />

        {/* ─── Twitter Card ─── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://algolib.netlify.app/compiler/" />
        <meta name="twitter:title" content="AlgoLib Compiler | Lightning-Fast Online IDE" />
        <meta 
          name="twitter:description" 
          content="Write, compile, and execute C, C++, Java, Python, and JS instantly. Build and test your algorithms with a professional-grade online IDE." 
        />
        <meta name="twitter:image" content="https://ik.imagekit.io/g7e4hyclo/Screenshot%202026-04-03%20000611.png" />

        {/* ─── Application & Apple Meta Tags ─── */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AlgoLib" />

        {/* ─── Structured Data (JSON-LD) for Google Rich Snippets ─── */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "AlgoLib Compiler",
            "url": "https://algolib.netlify.app/compiler/",
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "Any",
            "description": "A high-performance online code compiler and execution environment supporting C, C++, Java, Python, and JavaScript. Integrated with algorithm visualization tools.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "Interactive Terminal",
              "Multi-language Support (C++, Java, Python, JS)",
              "Syntax Highlighting",
              "Code Formatting",
              "Dark/Light Mode"
            ],
            "creator": {
              "@type": "Organization",
              "name": "AlgoLib"
            }
          })}
        </script>
      </Helmet>

      <div 
        className={`compiler-navbar-wrapper ${navVisible ? 'visible' : 'hidden'}`}
        onMouseEnter={() => { setNavVisible(true); clearTimeout(hideTimeoutRef.current); }}
        onMouseMove={() => clearTimeout(hideTimeoutRef.current)}
        onMouseLeave={() => {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = setTimeout(() => setNavVisible(false), 2000);
        }}
      >
        <Navbar />
      </div>

      <div className={`compiler-shell ${navVisible ? 'nav-visible' : 'nav-hidden'}`}>
        {/* ── Left/Bottom Sidebar ── */}
        <aside className="compiler-sidebar">
          {!navVisible && !isMobile && (
            <button
              className="sidebar-brand-btn"
              onClick={() => { setNavVisible(true); clearTimeout(hideTimeoutRef.current); }}
              onMouseEnter={() => { setNavVisible(true); clearTimeout(hideTimeoutRef.current); }}
              title="Show Navigation"
            >
              <Zap size={20} className="brand-zap" fill="currentColor" />
            </button>
          )}
          <div className="sidebar-lang-container">
            {LANGUAGES.map(lang => (
              <button
                key={lang.id}
                className={`sidebar-lang-btn ${activeLang.id === lang.id ? 'active' : ''}`}
                onClick={() => handleLangSwitch(lang)}
                title={lang.label}
              >
                <div className="sidebar-active-indicator" style={{ backgroundColor: activeLang.id === lang.id ? lang.color : 'transparent' }} />
                <span className="sidebar-lang-icon">
                  <Icon icon={lang.icon} width="22" height="22" />
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Main Area ── */}
        <main className="compiler-main">
          {/* Top Bar */}
          <div className="compiler-topbar">
            {/* Logo Brand */}
            <div className="topbar-brand">
              <Zap className="brand-zap" fill="currentColor" size={18} />
              <span className="topbar-brand-text">
                <span className="topbar-brand-algo">Algo</span>
                <span className="topbar-brand-lib">Lib</span>
              </span>
            </div>

            {/* File Tabs */}
            <div className="topbar-tabs">
              {openTabs.map(tab => (
                <div 
                  key={tab.id}
                  className={`file-tab ${activeLang.id === tab.id ? 'active' : ''}`}
                  onClick={() => handleLangSwitch(tab)}
                >
                  <Icon icon={tab.icon} width="15" height="15" className="tab-icon" />
                  <span className="file-tab-name">{tab.filename}</span>
                  <button className="file-tab-close" onClick={(e) => handleCloseTab(e, tab.id)} title="Close tab">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="topbar-actions">
              <div className="action-group hidden md:flex">
                <button className="topbar-icon-btn" onClick={() => setEditorFontSize(prev => Math.max(10, prev - 2))} title="Decrease Font">
                  <span className="font-icon">A-</span>
                </button>
                <button className="topbar-icon-btn" onClick={() => setEditorFontSize(prev => Math.min(30, prev + 2))} title="Increase Font">
                  <span className="font-icon">A+</span>
                </button>
              </div>

              <div className="action-group">
                <button className="topbar-icon-btn hidden md:flex" onClick={handleCopy} title="Copy Code">
                  <Copy size={16} strokeWidth={2} />
                </button>
                <button className="topbar-icon-btn" onClick={toggleFullscreen} title="Fullscreen">
                  {isFullscreen ? <Minimize size={16} strokeWidth={2} /> : <Maximize2 size={16} strokeWidth={2} />}
                </button>
                <button className="topbar-icon-btn" onClick={() => setDarkMode(d => !d)} title="Toggle theme">
                  {darkMode ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
                </button>
              </div>

              <div className="action-divider" />

              <button className="action-btn secondary-btn" onClick={handleFormatCode} title="Format Code">
                <AlignLeft size={15} strokeWidth={2.5} />
                <span className="hidden md:inline">Format</span>
              </button>

              <button className="action-btn secondary-btn" onClick={handleSaveFile} title="Save Code">
                <Save size={15} strokeWidth={2.5} />
                <span className="hidden md:inline">Save</span>
              </button>

              {isRunning && (
                <button className="action-btn stop-btn" onClick={handleStopCode} title="Stop Execution">
                  <Square size={13} fill="currentColor" />
                  <span>Stop</span>
                </button>
              )}

              <button
                className="action-btn run-btn"
                onClick={handleRunCode}
                disabled={isRunning}
                style={{ display: isRunning ? 'none' : 'flex' }}
              >
                <Play size={15} fill="currentColor" />
                <span>Run</span>
              </button>
            </div>
          </div>

          {/* Editor + Output */}
          <PanelGroup direction={isMobile ? "vertical" : "horizontal"} className="compiler-panels">
            {/* Editor */}
            <Panel defaultSize={60} minSize={30} className="editor-panel">
              <div className="editor-wrapper">
                <Editor
                  height="100%"
                  theme={editorTheme}
                  language={activeLang.monacoLang}
                  value={code}
                  onChange={v => setCode(v || '')}
                  onMount={e => (editorRef.current = e)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: editorFontSize,
                    fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
                    fontLigatures: true,
                    padding: { top: 20, bottom: 20 },
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    smoothScrolling: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    renderLineHighlight: 'all',
                    wordWrap: 'on',
                    scrollbar: {
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8,
                    }
                  }}
                />
              </div>
            </Panel>

            <PanelResizeHandle className="resize-handle">
              <div className="resize-handle-bar" />
            </PanelResizeHandle>

            {/* Terminal Panel */}
            <Panel minSize={20} className="terminal-panel">
              <div className="terminal-topbar">
                <div className="terminal-topbar-left">
                  <div className="window-controls">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <span className="terminal-title">Terminal</span>
                </div>
                
                <div className="terminal-topbar-right">
                  <button className="terminal-icon-btn" onClick={() => setTerminalFontSize(prev => Math.max(10, prev - 2))} title="Decrease Font">
                    T-
                  </button>
                  <button className="terminal-icon-btn" onClick={() => setTerminalFontSize(prev => Math.min(30, prev + 2))} title="Increase Font">
                    T+
                  </button>
                  <button className="terminal-clear-btn" onClick={() => { setOutput(''); setInput(''); setExecutionStatus('idle'); setExecutionMetrics(null); }} title="Clear console">
                    <Trash2 size={13} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="terminal-body" style={{ fontSize: `${terminalFontSize}px` }}>
                <div className="terminal-output-container">
                  <div className="terminal-output">
                    {executionStatus === 'idle' && <span className="term-hint">~ Waiting for execution...</span>}
                    {executionStatus === 'running' && <span className="term-hint">Executing <span className="blink">...</span></span>}
                    {executionStatus === 'error' && <span className="term-error">{output}</span>}
                    {executionStatus === 'success' && (
                      <>
                        <span className="term-out">{output}</span>
                        <div className="term-success-divider">
                          <span className="term-success">Process finished with exit code 0.</span>
                          {executionMetrics && (executionMetrics.time !== undefined || executionMetrics.memory !== undefined) && (
                            <span className="term-metrics">
                              <span className="metric-separator"></span>
                              {executionMetrics.time !== undefined && (
                                <span>{'\n'}⏱ Time: {executionMetrics.time}{typeof executionMetrics.time === 'number' ? 's' : ''}</span>
                              )}
                              {(executionMetrics.time !== undefined && executionMetrics.memory !== undefined) && (
                                <span className="metric-separator">•</span>
                              )}
                              {executionMetrics.memory !== undefined && (
                                <span>📦 Memory: {(Number(executionMetrics.memory) / 1024).toFixed(2)}{typeof executionMetrics.memory === 'number' ? ' MB' : ''}</span>
                              )}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="terminal-stdin-container">
                  <div className="stdin-header">Standard Input (stdin)</div>
                  <div className="terminal-input-row">
                    <span className="terminal-prompt" style={{ fontSize: `${terminalFontSize}px` }}>$</span>
                    <textarea
                      className="terminal-input"
                      style={{ fontSize: `${terminalFontSize}px` }}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Enter input here before running..."
                      spellCheck={false}
                      rows={1}
                      onInput={e => {
                        const t = e.currentTarget;
                        t.style.height = 'auto';
                        t.style.height = t.scrollHeight + 'px';
                      }}
                    />
                  </div>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </main>
      </div>

      <style>{`
        /* ─── Root & Typography ─── */
        .compiler-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          transition: background-color 0.3s ease;
        }
        .compiler-root[data-theme='dark'] {
          background: #0f172a; /* Sophisticated SaaS dark mode background */
          color: #f1f5f9;
        }

        .error-line-highlight {
          background: rgba(239, 68, 68, 0.15) !important;
          border-left: 3px solid #ef4444;
        }

        /* ─── Shell ─── */
        .compiler-shell {
          display: flex;
          flex: 1;
          overflow: hidden;
          transition: margin-top 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .compiler-shell.nav-visible { margin-top: 72px; }
        .compiler-shell.nav-hidden { margin-top: 12px; }

        .compiler-navbar-wrapper {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 72px;
          z-index: 100;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
        }
        .compiler-navbar-wrapper.hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateY(-100%);
        }

        /* ─── Sidebar ─── */
        .compiler-sidebar {
          width: 64px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 0;
          gap: 20px;
          z-index: 10;
          flex-shrink: 0;
        }

        .sidebar-brand-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0,0,0,0.1);
          background: #ffffff; 
          border-radius: 10px;
          cursor: pointer;
          color: #0f172a;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .compiler-root[data-theme='dark'] .sidebar-brand-btn { 
          background: #1e293b; 
          color: #ffffff; 
          border-color: rgba(255,255,255,0.08);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .sidebar-brand-btn:hover { transform: translateY(-2px); }

        .brand-zap { transition: color 0.2s; }
        .sidebar-brand-btn:hover .brand-zap { color: #3b82f6; }

        .sidebar-lang-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          align-items: center;
        }

        .sidebar-lang-btn {
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #64748b;
        }
        .compiler-root[data-theme='dark'] .sidebar-lang-btn { color: #94a3b8; }
        
        .sidebar-lang-btn:hover { background: rgba(0,0,0,0.04); color: #0f172a; }
        .compiler-root[data-theme='dark'] .sidebar-lang-btn:hover { background: rgba(255,255,255,0.05); color: #f8fafc; }
        
        .sidebar-lang-btn.active {
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          color: #0f172a;
        }
        .compiler-root[data-theme='dark'] .sidebar-lang-btn.active {
          background: #1e293b;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          color: #ffffff;
        }

        .sidebar-active-indicator {
          position: absolute;
          left: -10px;
          top: 50%;
          transform: translateY(-50%) scaleY(0);
          width: 3px;
          height: 20px;
          border-radius: 0 4px 4px 0;
          transition: transform 0.2s ease;
        }
        .sidebar-lang-btn.active .sidebar-active-indicator { transform: translateY(-50%) scaleY(1); }

        /* ─── Main Content Window ─── */
        .compiler-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin: 12px 12px 12px 0;
          border-radius: 12px;
          background: #ffffff;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
          border: 1px solid #e2e8f0; /* Crisp SaaS border */
          position: relative;
        }
        .compiler-root[data-theme='dark'] .compiler-main {
          background: #0f172a;
          box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.5);
          border: 1px solid #1e293b;
        }

        /* ─── SaaS Enhanced Top Bar ─── */
        .compiler-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px; /* Optimized height for elegant spacing */
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 16px 0 0;
          z-index: 20;
        }
        .compiler-root[data-theme='dark'] .compiler-topbar {
          background: #0f172a;
          border-bottom: 1px solid #1e293b;
        }

        .topbar-brand {
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 10px;
          color: #0f172a;
          height: 100%;
          position: relative;
        }
        .topbar-brand::after {
          content: ''; position: absolute; right: 0; top: 30%; height: 40%; width: 1px;
          background: #e2e8f0; /* Crisp separator line */
        }
        .compiler-root[data-theme='dark'] .topbar-brand { color: #ffffff; }
        .compiler-root[data-theme='dark'] .topbar-brand::after { background: #1e293b; }
        
        .topbar-brand-text { font-size: 15px; letter-spacing: -0.2px; }
        .topbar-brand-algo { font-weight: 800; }
        .topbar-brand-lib { font-weight: 500; opacity: 0.8; }

        /* ─── SaaS Style Tabs ─── */
        .topbar-tabs {
          display: flex;
          align-items: stretch; /* Stretch to fill height so border aligns to bottom edge */
          height: 100%;
          flex: 1;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .file-tab {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 24px;
          background: transparent;
          font-size: 13.5px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
          position: relative;
          border-bottom: 2px solid transparent; /* Prepare for active indicator */
        }
        .compiler-root[data-theme='dark'] .file-tab { color: #94a3b8; }
        
        .file-tab::after {
          content: ''; position: absolute; right: 0; top: 35%; height: 30%; width: 1px;
          background: #e2e8f0;
        }
        .compiler-root[data-theme='dark'] .file-tab::after { background: #1e293b; }

        .file-tab:hover { 
          background: #f8fafc; 
          color: #334155; 
        }
        .compiler-root[data-theme='dark'] .file-tab:hover { 
          background: #1e293b; 
          color: #e2e8f0; 
        }
        
        .file-tab.active {
          color: #0f172a;
          background: transparent;
          font-weight: 600; /* Bolder active tab text */
          border-bottom: 2px solid #3b82f6; /* Bottom blue indicator exactly like screenshot */
        }
        .compiler-root[data-theme='dark'] .file-tab.active { 
          color: #ffffff; 
          border-bottom: 2px solid #3b82f6;
        }

        .tab-icon { opacity: 0.9; }
        .file-tab-name { font-family: 'JetBrains Mono', monospace; font-size: 13px; }
        
        .file-tab-close {
          display: flex; align-items: center; justify-content: center;
          border: none; background: transparent; color: inherit;
          cursor: pointer; padding: 2px; border-radius: 4px;
          opacity: 0; transform: scale(0.8); transition: all 0.2s;
        }
        .file-tab:hover .file-tab-close { opacity: 0.6; transform: scale(1); }
        .file-tab-close:hover { opacity: 1 !important; background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        /* ─── Topbar Actions (Refined Layout) ─── */
        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-left: 16px;
        }

        .action-group { display: flex; align-items: center; gap: 4px; }
        .action-divider { width: 1px; height: 24px; background: #e2e8f0; margin: 0 4px; }
        .compiler-root[data-theme='dark'] .action-divider { background: #1e293b; }

        .topbar-icon-btn {
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: none; color: #475569;
          cursor: pointer; padding: 8px; border-radius: 6px;
          transition: all 0.2s ease;
        }
        .topbar-icon-btn:hover { background: #f1f5f9; color: #0f172a; }
        .compiler-root[data-theme='dark'] .topbar-icon-btn { color: #94a3b8; }
        .compiler-root[data-theme='dark'] .topbar-icon-btn:hover { background: #1e293b; color: #ffffff; }
        .font-icon { font-size: 13px; font-weight: 600; font-family: 'JetBrains Mono', monospace; }

        /* ── SaaS Refined Secondary Button (Format, Save) ── */
        .action-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 16px; border-radius: 6px;
          font-size: 13.5px; font-weight: 600; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .secondary-btn {
          background: #ffffff; 
          color: #334155;
          border: 1px solid #cbd5e1; /* Clear crisp border */
          box-shadow: 0 1px 2px rgba(0,0,0,0.03); /* Extremely subtle elevation */
        }
        .secondary-btn:hover { 
          background: #f8fafc; 
          color: #0f172a; 
          border-color: #94a3b8; 
        }
        .compiler-root[data-theme='dark'] .secondary-btn {
          background: #1e293b; 
          color: #cbd5e1;
          border: 1px solid #334155;
          box-shadow: none;
        }
        .compiler-root[data-theme='dark'] .secondary-btn:hover {
          background: #334155; 
          color: #ffffff;
          border-color: #475569;
        }

        /* ── Prominent Vibrant Primary Button (Run) ── */
        .run-btn {
          background: #2563eb; /* True SaaS blue */
          color: white;
          border: 1px solid transparent;
          box-shadow: 0 1px 2px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .run-btn:hover:not(:disabled) {
          background: #1d4ed8;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          transform: translateY(-1px);
        }

        .stop-btn {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .compiler-root[data-theme='dark'] .stop-btn { background: rgba(239, 68, 68, 0.15); }
        .stop-btn:hover { background: rgba(239, 68, 68, 0.2); color: #dc2626; border-color: rgba(239, 68, 68, 0.3); }
        .compiler-root[data-theme='dark'] .stop-btn:hover { color: #f87171; background: rgba(239, 68, 68, 0.25); }

        /* ─── Panels ─── */
        .compiler-panels { flex: 1; display: flex; }
        .editor-panel { display: flex; flex-direction: column; background: transparent; }
        .editor-wrapper { flex: 1; position: relative; }

        .resize-handle {
          width: 8px; background: transparent; cursor: col-resize;
          display: flex; align-items: center; justify-content: center; z-index: 10;
        }
        .resize-handle-bar {
          width: 1px; height: 100%; background: #e2e8f0;
          transition: all 0.2s;
        }
        .compiler-root[data-theme='dark'] .resize-handle-bar { background: #1e293b; }
        .resize-handle:hover .resize-handle-bar, .resize-handle:active .resize-handle-bar {
          background: #3b82f6; width: 3px; box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
        }

        /* ─── Terminal Panel ─── */
        .terminal-panel {
          display: flex; flex-direction: column;
          background: #f8fafc; border-left: 1px solid transparent;
        }
        .compiler-root[data-theme='dark'] .terminal-panel { background: #0b1120; }

        .terminal-topbar {
          display: flex; align-items: center; justify-content: space-between;
          height: 44px; padding: 0 16px; border-bottom: 1px solid #e2e8f0;
          background: rgba(0,0,0,0.01);
        }
        .compiler-root[data-theme='dark'] .terminal-topbar { border-bottom-color: #1e293b; background: transparent; }

        .terminal-topbar-left { display: flex; align-items: center; gap: 12px; }
        .window-controls { display: flex; gap: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.red { background: #ff5f56; }
        .dot.yellow { background: #ffbd2e; }
        .dot.green { background: #27c93f; }
        
        .terminal-title { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .compiler-root[data-theme='dark'] .terminal-title { color: #64748b; }

        .terminal-topbar-right { display: flex; gap: 6px; }
        .terminal-icon-btn {
          background: transparent; border: none; color: #64748b;
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;
          cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: 0.2s;
        }
        .terminal-icon-btn:hover { background: rgba(0,0,0,0.05); color: #0f172a; }
        .compiler-root[data-theme='dark'] .terminal-icon-btn:hover { background: #1e293b; color: #fff; }

        .terminal-clear-btn {
          display: flex; align-items: center; gap: 6px;
          background: transparent; border: none; color: #64748b;
          cursor: pointer; font-size: 12px; font-weight: 500;
          padding: 4px 10px; border-radius: 6px; transition: 0.2s;
        }
        .terminal-clear-btn:hover { background: rgba(0,0,0,0.05); color: #0f172a; }
        .compiler-root[data-theme='dark'] .terminal-clear-btn:hover { background: #1e293b; color: #fff; }

        /* Terminal Body */
        .terminal-body {
          flex: 1; display: flex; flex-direction: column;
          font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', monospace; line-height: 1.6;
          overflow: hidden;
        }
        
        .terminal-output-container { flex: 1; padding: 16px; overflow-y: auto; }
        .terminal-output { white-space: pre-wrap; word-break: break-word; }
        
        .term-hint { color: #0983e8; font-style: italic; }
        .compiler-root[data-theme='dark'] .term-hint { color: #38bdf8; }
        
        .term-out { color: #0f172a; }
        .compiler-root[data-theme='dark'] .term-out { color: #e2e8f0; }
        
        .term-error { color: #ef4444; }
        
        .term-success-divider { margin-top: 16px; padding-top: 8px; border-top: 1px dashed #e2e8f0; }
        .compiler-root[data-theme='dark'] .term-success-divider { border-top-color: #334155; }
        .term-success { color: #059669; font-size: 0.9em; opacity: 0.9; }
        .compiler-root[data-theme='dark'] .term-success { color: #10b981; }
        .term-metrics { color: #64748b; font-size: 0.85em; margin-left: 8px; font-family: 'JetBrains Mono', monospace; }
        .compiler-root[data-theme='dark'] .term-metrics { color: #94a3b8; }
        .metric-separator { opacity: 0.5; margin: 0 6px; }

        .blink { animation: blink 1s step-end infinite; }
        @keyframes blink { 0%,100% {opacity:1} 50% {opacity:0} }

        /* Stdin Area */
        .terminal-stdin-container {
          flex-shrink: 0; border-top: 1px solid #e2e8f0;
          padding: 12px 16px; background: #ffffff;
        }
        .compiler-root[data-theme='dark'] .terminal-stdin-container {
          border-top-color: #1e293b; background: #0f172a;
        }

        .stdin-header {
          font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;
          margin-bottom: 8px;
        }

        .terminal-input-row { display: flex; align-items: flex-start; gap: 10px; }
        .terminal-prompt { color: #10b981; font-weight: 700; user-select: none; margin-top: 1px; }
        .compiler-root[data-theme='dark'] .terminal-prompt { color: #34d399; }
        
        .terminal-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: #0f172a; font-family: inherit; line-height: 1.6;
          resize: none; overflow: hidden; min-height: 24px;
        }
        .compiler-root[data-theme='dark'] .terminal-input { color: #93c5fd; }
        .terminal-input::placeholder { color: #94a3b8; }
        .compiler-root[data-theme='dark'] .terminal-input::placeholder { color: #475569; }

        /* ─── Scrollbars ─── */
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }
        ::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        .compiler-root[data-theme='dark'] ::-webkit-scrollbar-thumb { background-color: #334155; }
        .compiler-root[data-theme='dark'] ::-webkit-scrollbar-thumb:hover { background-color: #475569; }

        /* ─── Mobile Responsiveness ─── */
        @media (max-width: 768px) {
          .compiler-shell { flex-direction: column; margin-top: 0 !important; }
          .compiler-navbar-wrapper { display: none; }
          
          .compiler-sidebar {
            width: 100%; height: 60px; flex-direction: row; padding: 8px 16px;
            overflow-x: auto; order: 3; background: #ffffff;
            border-top: 1px solid #e2e8f0; gap: 8px;
          }
          .compiler-root[data-theme='dark'] .compiler-sidebar { background: #0f172a; border-top-color: #1e293b; }
          
          .sidebar-lang-container { flex-direction: row; }
          .sidebar-active-indicator {
            left: 50%; top: auto; bottom: -4px; width: 20px; height: 3px;
            transform: translateX(-50%) scaleX(0); border-radius: 4px 4px 0 0;
          }
          .sidebar-lang-btn.active .sidebar-active-indicator { transform: translateX(-50%) scaleX(1); }
          
          .compiler-main { margin: 0; border-radius: 0; border: none; order: 2; }
          .topbar-brand { display: none; }
          .action-group.hidden { display: none; }
          
          .resize-handle { width: 100%; height: 12px; cursor: row-resize; flex-direction: column; }
          .resize-handle-bar { width: 100%; height: 1px; }
          .resize-handle:hover .resize-handle-bar { height: 3px; width: 100%; }
        }
      `}</style>
    </div>
  );
}