import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader2, X, Trash2, Moon, Sun, Maximize2, Minimize, Copy } from 'lucide-react';
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
  const [codes, setCodes] = useState<Record<string, string>>(
    Object.fromEntries(LANGUAGES.map(l => [l.id, l.template]))
  );
  const [output, setOutput] = useState('');
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
          glyphMarginClassName: 'error-glyph-margin',
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

  const code = codes[activeLang.id];
  const setCode = (val: string) => setCodes(prev => ({ ...prev, [activeLang.id]: val }));

  const handleLangSwitch = (lang: LangConfig) => {
    if (!openTabs.find(t => t.id === lang.id)) {
      setOpenTabs(prev => [...prev, lang]);
    }
    setActiveLang(lang);
    setOutput('');
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

  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput('Running...');
    highlightErrorIfAny('');

    const ENGINE_API_URL = 'https://rajawatprateek-algolib-engine.hf.space/execute';

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
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      let cleanOutput = (data.output || '').trim();
      if (activeLang.id === 'java') {
        cleanOutput = cleanOutput.replace(/Main_[a-fA-F0-9]+/g, 'Main');
      }
      setOutput(cleanOutput || '(no output)');
      highlightErrorIfAny(cleanOutput);
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
      highlightErrorIfAny(e.message || '');
    } finally {
      setIsRunning(false);
    }
  };

  const bg = darkMode ? '#f5f5f7' : '#000000';
  const editorTheme = darkMode ? 'vs' : 'vs-dark';

  return (
    <div className={`compiler-root ${isFullscreen ? 'is-fullscreen' : ''}`} data-theme={darkMode ? 'light' : 'dark'} ref={compilerRef}>
      <div 
        className={`compiler-navbar-wrapper ${navVisible ? 'visible' : 'hidden'}`}
        onMouseEnter={() => {
          setNavVisible(true);
          clearTimeout(hideTimeoutRef.current);
        }}
        onMouseMove={() => {
          clearTimeout(hideTimeoutRef.current);
        }}
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
              onClick={() => {
                setNavVisible(true);
                clearTimeout(hideTimeoutRef.current);
              }}
              onMouseEnter={() => {
                setNavVisible(true);
                clearTimeout(hideTimeoutRef.current);
              }}
              title="Show Navigation"
            >
              <Icon icon="mdi:flash" width="22" height="22" />
            </button>
          )}
          {LANGUAGES.map(lang => (
            <button
              key={lang.id}
              className={`sidebar-lang-btn ${activeLang.id === lang.id ? 'active' : ''}`}
              onClick={() => handleLangSwitch(lang)}
              title={lang.label}
              style={activeLang.id === lang.id ? { [isMobile ? 'borderBottomColor' : 'borderLeftColor']: lang.color } : {}}
            >
              <span className="sidebar-lang-icon">
                <Icon icon={lang.icon} width="24" height="24" />
              </span>
              <span className="sidebar-lang-label">{lang.label}</span>
            </button>
          ))}
        </aside>

        {/* ── Main Area ── */}
        <main className="compiler-main">
          {/* Top Bar */}
          <div className="compiler-topbar">
            {/* Logo Brand */}
            <div className="topbar-brand">
              <Icon icon="mdi:flash" width="22" height="22" />
              <span className="topbar-brand-text">
                <span className="topbar-brand-algo">ALGO</span>
                <span className="topbar-brand-lib">LIB</span>
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
                  <span className="file-tab-name">{tab.filename}</span>
                  <button className="file-tab-close" onClick={(e) => handleCloseTab(e, tab.id)} title="Close tab">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="topbar-actions">
              <button
                className="topbar-icon-btn action-hide-mobile"
                onClick={() => setEditorFontSize(prev => Math.max(10, prev - 2))}
                title="Decrease Font Size"
              >
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>A-</span>
              </button>
              <button
                className="topbar-icon-btn action-hide-mobile"
                onClick={() => setEditorFontSize(prev => Math.min(30, prev + 2))}
                title="Increase Font Size"
              >
                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>A+</span>
              </button>
              <button
                className="topbar-icon-btn"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                className="topbar-icon-btn"
                onClick={() => setDarkMode(d => !d)}
                title="Toggle theme"
              >
                {darkMode ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <button className="topbar-icon-btn action-hide-mobile" title="Copy Code" onClick={handleCopy}>
                <Copy size={16} />
              </button>
              <button
                className="run-btn"
                onClick={handleRunCode}
                disabled={isRunning}
              >
                {isRunning
                  ? <Loader2 size={15} className="spin" />
                  : <Play size={15} fill="white" />
                }
                Run
              </button>
            </div>
          </div>

          {/* Editor + Output */}
          <PanelGroup direction={isMobile ? "vertical" : "horizontal"} className="compiler-panels">
            {/* Editor */}
            <Panel defaultSize={55} minSize={30} className="editor-panel">
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
                  fontFamily: "'Fira Code', 'Consolas', monospace",
                  fontLigatures: true,
                  padding: { top: 16, bottom: 16 },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  glyphMargin: true,
                  renderLineHighlight: 'line',
                  wordWrap: 'off',
                  tabSize: 4,
                  smoothScrolling: true,
                }}
              />
            </Panel>

            <PanelResizeHandle className="resize-handle-vertical">
              <div className="resize-handle-bar" />
            </PanelResizeHandle>

            {/* Terminal Panel */}
            <Panel minSize={20} className="terminal-panel">
              {/* Terminal Header */}
              <div className="terminal-topbar">
                <div className="terminal-topbar-left">
                  <span className="terminal-dot red" />
                  <span className="terminal-dot yellow" />
                  <span className="terminal-dot green" />
                  <span className="terminal-title">Terminal</span>
                </div>
                <button
                  className="terminal-clear-btn"
                  onClick={() => { setOutput(''); setInput(''); }}
                  title="Clear terminal"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              </div>

              {/* Terminal Body */}
              <div className="terminal-body">
                {/* Separated Output area */}
                <div className="terminal-output-container">
                  <div className="terminal-output">
                    {output
                      ? <span className={output.toLowerCase().startsWith('error') ? 'term-error' : 'term-out'}>{output}</span>
                      : <span className="term-hint">// Run your code — output appears here</span>
                    }
                    {isRunning && <span className="term-hint blink"> ▌</span>}
                  </div>
                </div>

                {/* Separated Stdin area */}
                <div className="terminal-stdin-container">
                  <div className="stdin-header">Standard Input</div>
                  <div className="terminal-input-row">
                    <span className="terminal-prompt">{'▸'}</span>
                    <textarea
                      className="terminal-input"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="stdin  (type program input, press Run)"
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
        /* ─── Root & Typography ────────────────────────────────── */
        .compiler-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: #f5f5f7; /* Apple light background */
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .compiler-root[data-theme='dark'] {
          background: #000000; /* Apple pure black background */
          color: #f5f5f7;
        }

        /* ─── Editor Error Highlighting ─────────────────────────── */
        .error-line-highlight {
          background: rgba(255, 59, 48, 0.15) !important;
          box-shadow: inset 0 0 10px rgba(255, 59, 48, 0.4);
        }
        .error-glyph-margin {
          background: #ff3b30;
          border-radius: 50%;
          width: 8px !important;
          height: 8px !important;
          margin-left: 10px;
          margin-top: 6px;
          box-shadow: 0 0 10px rgba(255, 59, 48, 0.8), 0 0 20px rgba(255, 59, 48, 0.4);
        }

        /* ─── Shell (below Navbar) ──────────────────────────────── */
        .compiler-shell {
          display: flex;
          flex: 1;
          overflow: hidden;
          transition: margin-top 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .compiler-shell.nav-visible { margin-top: 80px; }
        .compiler-shell.nav-hidden { margin-top: 16px; }

        .compiler-navbar-wrapper {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 80px;
          z-index: 100;
          transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .compiler-navbar-wrapper.hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateY(-40px);
        }

        .sidebar-brand-btn {
          width: 44px;
          height: 44px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: none;
          background: #1d1d1f; 
          border-radius: 12px;
          cursor: pointer;
          color: #ffffff;
          transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
          margin-bottom: 8px;
          animation: popIn 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          flex-shrink: 0;
        }
        .compiler-root[data-theme='dark'] .sidebar-brand-btn { background: #ffffff; color: #000000; }
        .sidebar-brand-btn:hover { transform: scale(1.05); }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        /* ─── Sidebar ───────────────────────────────────────────── */
        .compiler-sidebar {
          width: 60px;
          background: transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 0;
          gap: 12px;
          overflow-y: auto;
          overflow-x: hidden;
          z-index: 10;
          flex-shrink: 0;
        }

        .sidebar-lang-btn {
          width: 44px;
          height: 44px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border: none;
          background: transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
          color: #86868b;
        }
        .compiler-root[data-theme='dark'] .sidebar-lang-btn {
          color: #98989d;
        }
        .sidebar-lang-btn:hover {
          background: #e5e5ea;
          color: #1d1d1f;
          transform: scale(1.05);
        }
        .compiler-root[data-theme='dark'] .sidebar-lang-btn:hover {
          background: #1c1c1e;
          color: #ffffff;
        }
        
        .sidebar-lang-btn.active {
          background: #ffffff;
          color: #0066cc;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .compiler-root[data-theme='dark'] .sidebar-lang-btn.active {
          background: #2c2c2e;
          color: #0a84ff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .sidebar-lang-icon { font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center; }
        .sidebar-lang-label { display: none; } /* Hide labels for cleaner Mac-like dock look */

        /* ─── Main Content Wrapper (The 'Window') ───────────────── */
        .compiler-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin: 16px 16px 16px 0;
          border-radius: 14px;
          background: #ffffff;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0,0,0,0.03);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        .compiler-root[data-theme='dark'] .compiler-main {
          background: #1c1c1e;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0,0,0,0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* ─── Fullscreen Overrides ──────────────────────────────── */
        .compiler-root.is-fullscreen .compiler-sidebar {
          display: none;
        }
        .compiler-root.is-fullscreen .compiler-main {
          margin: 0 !important;
          border-radius: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }
        .compiler-root.is-fullscreen .compiler-shell {
          margin-top: 0 !important;
        }

        /* ─── Top Bar ───────────────────────────────────────────── */
        .compiler-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 48px;
          border-bottom: 1px solid #e5e5ea;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 0 12px 0 0;
          flex-shrink: 0;
        }
        .compiler-root[data-theme='dark'] .compiler-topbar {
          background: rgba(28, 28, 30, 0.8);
          border-bottom-color: #38383a;
        }

        /* BRAND LABEL */
        .topbar-brand {
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 6px;
          color: #1d1d1f;
          border-right: 1px solid #e5e5ea;
          height: 100%;
        }
        .compiler-root[data-theme='dark'] .topbar-brand {
          color: #ffffff;
          border-right-color: #38383a;
        }
        .topbar-brand-text {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          letter-spacing: -0.5px;
          font-size: 15px;
        }
        .topbar-brand-algo { font-weight: 800; }
        .topbar-brand-lib { font-weight: 600; color: #86868b; }
        
        /* TABS */
        .topbar-tabs {
          display: flex;
          align-items: stretch;
          height: 100%;
          gap: 0;
          flex: 1;
          overflow-x: auto;
        }
        .topbar-tabs::-webkit-scrollbar { display: none; }
        .file-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px;
          border-right: 1px solid #e5e5ea;
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          color: #86868b;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s;
        }
        .compiler-root[data-theme='dark'] .file-tab {
          border-right-color: #38383a;
          color: #98989d;
        }
        .file-tab:hover { background: rgba(0,0,0,0.02); }
        .compiler-root[data-theme='dark'] .file-tab:hover { background: rgba(255,255,255,0.02); }
        .file-tab.active {
          background: transparent;
          color: #1d1d1f;
          font-weight: 600;
        }
        .compiler-root[data-theme='dark'] .file-tab.active {
          color: #ffffff;
        }
        .file-tab-name { font-family: 'SF Mono', 'Consolas', monospace; font-size: 13px; }
        
        .file-tab-close {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #86868b;
          cursor: pointer;
          border-radius: 4px;
          padding: 2px;
          opacity: 0;
          transition: all 0.2s;
        }
        .file-tab:hover .file-tab-close { opacity: 1; }
        .file-tab-close:hover { background: #ff3b30; color: #ffffff; }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-left: 8px;
        }
        .topbar-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #86868b;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }
        .topbar-icon-btn:hover { background: #f2f2f7; color: #1d1d1f; }
        .compiler-root[data-theme='dark'] .topbar-icon-btn { color: #98989d; }
        .compiler-root[data-theme='dark'] .topbar-icon-btn:hover { background: #38383a; color: #ffffff; }

        .run-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          margin-right: 8px;
          background: #007aff; /* Apple Blue */
          color: #ffffff;
          border: none;
          border-radius: 14px; /* Apple pill style */
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
        }
        .run-btn:hover:not(:disabled) { 
          background: #0066cc; 
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
        }
        .run-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ─── Panels ────────────────────────────────────────────── */
        .compiler-panels {
          flex: 1;
          overflow: hidden;
          display: flex;
        }
        .editor-panel {
          overflow: hidden;
          background: transparent;
        }

        .resize-handle-vertical {
          width: 5px;
          background: transparent; 
          cursor: col-resize;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
        }
        .resize-handle-vertical::after {
          content: "";
          position: absolute;
          left: 2px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: #e5e5ea;
          transition: background 0.2s;
        }
        .compiler-root[data-theme='dark'] .resize-handle-vertical::after { background: #38383a; }
        .resize-handle-vertical:hover::after { background: #007aff; width: 2px; left: 1.5px; }

        /* ─── Terminal Panel ─────────────────────────────────────── */
        .terminal-panel {
          display: flex;
          flex-direction: column;
          background: #fcfcfc;
          overflow: hidden;
        }
        .compiler-root[data-theme='dark'] .terminal-panel { background: #1c1c1e; }

        .terminal-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 40px;
          background: transparent;
          padding: 0 16px;
          flex-shrink: 0;
        }
        .terminal-topbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .terminal-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .compiler-root[data-theme='dark'] .terminal-dot { border-color: rgba(0,0,0,0.3); }
        .terminal-dot.red    { background: #ff5f56; }
        .terminal-dot.yellow { background: #ffbd2e; }
        .terminal-dot.green  { background: #27c93f; }
        
        .terminal-title {
          font-size: 13px;
          font-weight: 600;
          color: #86868b;
          letter-spacing: 0.02em;
          margin-left: 8px;
        }
        ::placeholder { color: #86868b; font-weight: 400; }
        .compiler-root[data-theme='dark'] .terminal-title { color: #98989d; }

        .terminal-clear-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: #86868b;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .terminal-clear-btn:hover { background: #e5e5ea; color: #1d1d1f; }
        .compiler-root[data-theme='dark'] .terminal-clear-btn { color: #98989d; }
        .compiler-root[data-theme='dark'] .terminal-clear-btn:hover { background: #38383a; color: #ffffff; }

        /* Terminal Body Splitting */
        .terminal-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
          font-size: 13px; 
          line-height: 1.6;
          overflow: hidden;
        }
        
        .terminal-output-container {
          flex: 1;
          padding: 8px 16px 16px 16px;
          overflow-y: auto;
        }
        
        .terminal-stdin-container {
          flex-shrink: 0;
          border-top: 1px solid #e5e5ea;
          padding: 12px 16px 16px 16px;
          background: #f7f7f9;
        }
        .compiler-root[data-theme='dark'] .terminal-stdin-container {
          border-top-color: #38383a;
          background: #19191b;
        }

        .stdin-header {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #86868b;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .terminal-output {
          white-space: pre-wrap;
          word-break: break-word;
          min-height: 20px;
        }
        
        /* Terminal text colors */
        .term-out   { color: #1d1d1f; }
        .compiler-root[data-theme='dark'] .term-out { color: #ffffff; }
        
        .term-error { color: #ff3b30; font-weight: 500; }
        .compiler-root[data-theme='dark'] .term-error { color: #ff453a; }
        
        .term-hint  { color: #86868b; font-style: italic; }
        .compiler-root[data-theme='dark'] .term-hint { color: #98989d; }
        
        .blink { animation: blink-cursor 1s step-end infinite; }
        @keyframes blink-cursor { 0%,100% { opacity:1; } 50% { opacity:0; } }

        .terminal-input-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        
        .terminal-prompt {
          color: #34c759; /* Apple green */
          font-size: 14px;
          font-weight: 700;
          line-height: 1.6;
          user-select: none;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .compiler-root[data-theme='dark'] .terminal-prompt { color: #30d158; }
        
        .terminal-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #1d1d1f;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          font-size: 13px; 
          line-height: 1.6;
          resize: none;
          overflow: hidden;
          min-height: 22px;
        }
        .compiler-root[data-theme='dark'] .terminal-input { color: #ffffff; }
        .terminal-input::placeholder { color: #c7c7cc; font-style: italic; }
        .compiler-root[data-theme='dark'] .terminal-input::placeholder { color: #48484a; }

        /* ─── Spin animation ────────────────────────────────────── */
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ─── Scrollbars ────────────────────────────────────────── */
        ::-webkit-scrollbar { width: 8px; height: 8px; } /* Thicker for projectors */
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .compiler-root[data-theme='dark'] ::-webkit-scrollbar-thumb { background: #4b5563; }
        .compiler-root[data-theme='dark'] ::-webkit-scrollbar-thumb:hover { background: #6b7280; }

        /* ─── Mobile Responsiveness ──────────────────────────────── */
        @media (max-width: 768px) {
          .compiler-shell {
            flex-direction: column;
            margin-top: 0 !important; /* Override navbar logic for mobile */
          }
          .compiler-navbar-wrapper {
            display: none; /* Hide top navbar to save space on mobile editor view */
          }
          
          /* Turn sidebar into bottom tab bar */
          .compiler-sidebar {
            width: 100%;
            height: 60px;
            flex-direction: row;
            justify-content: space-around;
            padding: 8px 12px;
            overflow-x: auto;
            overflow-y: hidden;
            order: 3; /* Move to bottom */
            border-top: 1px solid #e5e5ea;
            background: #ffffff;
            z-index: 20;
          }
          .compiler-root[data-theme='dark'] .compiler-sidebar {
            background: #1c1c1e;
            border-top-color: #38383a;
          }
          .sidebar-brand-btn { display: none; }
          .sidebar-lang-btn {
            border-left: none !important; /* Remove vertical active bar */
            border-bottom: 2px solid transparent; /* Prepare bottom active bar */
            height: 100%;
            border-radius: 8px;
          }
          
          /* Main content takes upper portion */
          .compiler-main {
            margin: 0;
            border-radius: 0;
            border: none;
            order: 2; /* Middle */
          }
          
          /* Optimize topbar for small screens */
          .topbar-brand { display: none; } /* Hide AlgoLib logo on mobile to save space */
          .compiler-topbar { padding-left: 8px; }
          .topbar-actions { padding-right: 8px; gap: 4px; overflow-x: auto; }
          .action-hide-mobile { display: none; } /* Hide less important tools */
          .run-btn { padding: 6px 12px; margin-right: 0; }
          
          /* Rotate resize handle for vertical stack */
          .resize-handle-vertical {
            width: 100%;
            height: 14px;
            cursor: row-resize;
            flex-direction: column;
          }
          .resize-handle-vertical::after {
            left: 0;
            right: 0;
            top: 6px;
            width: 100%;
            height: 2px;
          }
          .resize-handle-vertical:hover::after {
            height: 4px;
            top: 5px;
            width: 100%;
            left: 0;
          }
        }
      `}</style>
    </div>
  );
}