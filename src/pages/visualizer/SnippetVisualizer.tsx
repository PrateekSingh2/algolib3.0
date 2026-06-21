import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Play, RefreshCw, Maximize2, Settings2, Info, CheckCircle2, ChevronRight, AlertCircle, X } from 'lucide-react';
import Navbar from '@/components/Navbar';

// Type definitions
type SupportedLang = 'python' | 'cpp' | 'c' | 'java' | 'javascript';

interface LangConfig {
  id: SupportedLang;
  name: string;
  monacoLang: string;
  pyTutorId: string;
  defaultCode: string;
}

const LANGUAGES: LangConfig[] = [
  { id: 'python', name: 'Python 3', monacoLang: 'python', pyTutorId: '3', defaultCode: 'def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)\n\nresult = factorial(5)\nprint(f"Factorial is {result}")' },
  { id: 'cpp', name: 'C++', monacoLang: 'cpp', pyTutorId: 'cpp', defaultCode: '#include <iostream>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int arr[] = {5, 2, 8, 1};\n    int n = sizeof(arr)/sizeof(arr[0]);\n    \n    for(int i = 0; i < n-1; i++) {\n        for(int j = 0; j < n-i-1; j++) {\n            if(arr[j] > arr[j+1]) {\n                swap(arr[j], arr[j+1]);\n            }\n        }\n    }\n    return 0;\n}' },
  { id: 'java', name: 'Java', monacoLang: 'java', pyTutorId: 'java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        String str = "Hello AlgoLib";\n        String reversed = "";\n        for (int i = str.length() - 1; i >= 0; i--) {\n            reversed += str.charAt(i);\n        }\n        System.out.println(reversed);\n    }\n}' },
  { id: 'javascript', name: 'JavaScript', monacoLang: 'javascript', pyTutorId: 'js', defaultCode: 'const reverseString = (str) => {\n  let reversed = "";\n  for(let char of str) {\n    reversed = char + reversed;\n  }\n  return reversed;\n};\n\nconsole.log(reverseString("AlgoLib"));' },
  { id: 'c', name: 'C', monacoLang: 'c', pyTutorId: 'c', defaultCode: '#include <stdio.h>\n\nint main() {\n    int a = 10;\n    int b = 20;\n    int sum = a + b;\n    printf("Sum is %d\\n", sum);\n    return 0;\n}' },
];

export default function SnippetVisualizer() {
  const [selectedLang, setSelectedLang] = useState<LangConfig>(LANGUAGES[0]);
  const [code, setCode] = useState<string>(LANGUAGES[0].defaultCode);
  const [visualizeUrl, setVisualizeUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wasFixed, setWasFixed] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(true);
  const [customInput, setCustomInput] = useState<string>('');
  const [showInput, setShowInput] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Handle language change
  const handleLangChange = (langId: string) => {
    const lang = LANGUAGES.find(l => l.id === langId);
    if (lang) {
      setSelectedLang(lang);
      setCode(lang.defaultCode);
      setVisualizeUrl(null);
      setWasFixed(false);
      setCustomInput('');
    }
  };

  // Smart Parser to inject main() if missing
  const processCode = (rawCode: string, lang: SupportedLang): { processed: string, fixed: boolean } => {
    const trimmed = rawCode.trim();
    if (!trimmed) return { processed: rawCode, fixed: false };

    let fixed = false;
    let processed = rawCode;

    if (lang === 'cpp' || lang === 'c') {
      const hasMain = /main\s*\(/.test(trimmed);
      if (!hasMain) {
        fixed = true;
        const lines = trimmed.split('\n');
        const includes: string[] = [];
        const body: string[] = [];
        
        lines.forEach(line => {
          const tLine = line.trim();
          if (tLine.startsWith('#include') || tLine.startsWith('using namespace')) {
            includes.push(line);
          } else {
            body.push(line);
          }
        });

        // Add default includes if none exist
        if (includes.length === 0 && lang === 'cpp') {
          includes.push('#include <iostream>');
          includes.push('#include <algorithm>');
          includes.push('using namespace std;');
        } else if (includes.length === 0 && lang === 'c') {
          includes.push('#include <stdio.h>');
        }

        processed = `${includes.join('\n')}\n\nint main() {\n    ${body.join('\n    ')}\n    return 0;\n}`;
      }
    } else if (lang === 'java') {
      const hasMain = /public\s+static\s+void\s+main\s*\(/.test(trimmed);
      if (!hasMain) {
        fixed = true;
        const lines = trimmed.split('\n');
        const imports: string[] = [];
        const body: string[] = [];
        
        lines.forEach(line => {
          if (line.trim().startsWith('import ')) {
            imports.push(line);
          } else {
            body.push(line);
          }
        });

        processed = `${imports.join('\n')}\n\npublic class Main {\n    public static void main(String[] args) {\n        ${body.join('\n        ')}\n    }\n}`;
      }
    }

    return { processed, fixed };
  };

  const handleVisualize = () => {
    if (!code.trim()) return;
    
    setIsProcessing(true);
    setWasFixed(false);

    setTimeout(() => {
      const { processed, fixed } = processCode(code, selectedLang.id);
      
      if (fixed) {
        setCode(processed);
        setWasFixed(true);
      }

      // Generate Python Tutor iframe URL
      const encodedCode = encodeURIComponent(processed);
      const inputLines = customInput ? customInput.split('\n') : [];
      const inputJson = encodeURIComponent(JSON.stringify(inputLines));
      
      let url = '';
      if (selectedLang.id === 'cpp') {
        url = `https://pythontutor.com/cpp.html#code=${encodedCode}&mode=display&cumulative=false&rawInputLstJSON=${inputJson}`;
      } else if (selectedLang.id === 'c') {
        url = `https://pythontutor.com/c.html#code=${encodedCode}&mode=display&cumulative=false&rawInputLstJSON=${inputJson}`;
      } else {
        url = `https://pythontutor.com/iframe-embed.html#code=${encodedCode}&cumulative=false&heapPrimitives=nevernest&mode=display&origin=opt-frontend.js&py=${selectedLang.pyTutorId}&rawInputLstJSON=${inputJson}&textReferences=false`;
      }
      
      setVisualizeUrl(url);
      setIsIframeLoaded(false);
      setIsProcessing(false);
    }, 600); // Slight delay for UX
  };

  return (
    <div className="min-h-screen bg-[#e8ddd1] dark:bg-[#050505] text-slate-800 dark:text-zinc-300 font-sans selection:bg-sky-500/30 selection:text-sky-800 dark:selection:text-sky-200 relative overflow-hidden">
      <Helmet>
        <title>Code Stepper | AlgoLib</title>
      </Helmet>
      
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[60%] h-[20%] rounded-full bg-violet-500/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center text-center mb-10"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md shadow-sm dark:shadow-lg"
            >
              <Code2 size={14} className="text-sky-500 dark:text-sky-400" />
              Execution Trace Engine
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-slate-500 dark:from-white dark:to-zinc-500 mb-6 tracking-tight">
              Trace Every Step.
            </h1>
            <p className="text-slate-600 dark:text-zinc-400 max-w-2xl text-lg leading-relaxed mb-10">
              Watch your logic unfold line by line. Monitor variables and visualize the call stack with absolute clarity.
            </p>

            {/* Language Selector (Floating Pill) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap sm:flex-nowrap justify-center items-center gap-1 sm:gap-2 bg-white/80 dark:bg-[#111116]/80 backdrop-blur-2xl p-1.5 sm:p-2 rounded-2xl sm:rounded-full border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] w-full sm:w-auto overflow-x-auto"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => handleLangChange(lang.id)}
                  className={`relative px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-colors duration-300 whitespace-nowrap ${
                    selectedLang.id === lang.id
                      ? 'text-black'
                      : 'text-slate-500 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300'
                  }`}
                >
                  {selectedLang.id === lang.id && (
                    <motion.div
                      layoutId="activeLangTab"
                      className="absolute inset-0 bg-blue-400 border border-blue-500 shadow-[0_0_15px_rgba(96,165,250,0.4)] rounded-xl sm:rounded-full -z-10 dark:border-blue-500/50"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{lang.name}</span>
                </button>
              ))}
            </motion.div>
          </motion.div>

        {/* Main Grid Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:h-[750px] relative z-20">
          
          {/* Editor Column */}
          <div className="h-[500px] lg:h-full flex flex-col bg-[#dcd0c0] dark:bg-[#0a0a0f] rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl dark:shadow-2xl relative group">
            
            {/* Dynamic Island Notch - Editor */}
            <div className="absolute top-0 left-0 sm:left-1/2 sm:-translate-x-1/2 bg-slate-100 dark:bg-[#1c1c24] px-4 sm:px-6 py-2 rounded-br-2xl sm:rounded-b-2xl sm:rounded-br-none border-r sm:border-x border-b border-slate-200 dark:border-white/10 z-30 flex items-center gap-2 sm:gap-3 shadow-md dark:shadow-xl backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
              <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-zinc-300 font-mono tracking-widest uppercase">
                workspace.{selectedLang.monacoLang}
              </span>
            </div>
            
            <div className="flex-1 relative h-full pt-16 pb-6 px-2 flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-[#1c1c24]/30 dark:to-transparent pointer-events-none" />
              
              <div className="flex-1 relative">
                <Editor
                  height="100%"
                  language={selectedLang.monacoLang}
                  theme={isDarkMode ? "vs-dark" : "light"}
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    padding: { top: 16, bottom: 40 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                  }}
                />
              </div>

              {/* Custom Input Pane */}
              <AnimatePresence>
                {showInput && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 120, opacity: 1, marginTop: 16 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="w-full bg-[#e8ddd1] dark:bg-[#1c1c24] rounded-xl border border-slate-200 dark:border-white/10 shadow-inner overflow-hidden relative z-20 shrink-0"
                  >
                    <div className="absolute top-0 left-0 right-0 px-4 py-1.5 bg-slate-100 dark:bg-black/20 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                       <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Standard Input (stdin)</span>
                    </div>
                    <textarea 
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      placeholder="Enter inputs separated by newlines..."
                      className="w-full h-full pt-8 pb-3 px-4 bg-transparent text-sm font-mono text-slate-700 dark:text-zinc-300 resize-none outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Top Right Action Button */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-40 flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowInput(!showInput)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-300 border ${
                  showInput 
                    ? 'bg-blue-400 dark:bg-blue-500/20 text-black dark:text-blue-400 border border-blue-500 dark:border-blue-500/50 shadow-sm dark:shadow-[0_0_15px_rgba(96,165,250,0.4)]' 
                    : 'bg-[#dcd0c0] dark:bg-[#1c1c24] text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-white/10 hover:bg-blue-400 hover:text-black hover:border-blue-500 dark:hover:bg-blue-500/30'
                }`}
              >
                STDIN
              </button>

              <button
                onClick={handleVisualize}
                disabled={isProcessing || !code.trim()}
                className="group/btn flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-green-400 hover:bg-green-500 text-black border border-green-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-xl shadow-[0_8px_32px_-8px_rgba(74,222,128,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isProcessing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Play size={14} className="fill-current group-hover/btn:scale-110 transition-transform" />
                )}
                <span className="hidden sm:inline">Visualize</span>
                <span className="sm:hidden">Run</span>
              </button>
            </div>

            {/* Floating Alert (Smart Parser) */}
            <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-3 pointer-events-none">
              <AnimatePresence>
                {wasFixed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    className="bg-emerald-50 dark:bg-emerald-500/10 backdrop-blur-xl border border-emerald-200 dark:border-emerald-500/20 p-3 rounded-2xl flex items-start gap-3 max-w-sm shadow-xl pointer-events-auto"
                  >
                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-emerald-800 dark:text-emerald-200/90 leading-relaxed pr-6">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Smart Parser:</span> Missing main function detected. Boilerplate injected automatically.
                    </div>
                    <button 
                      onClick={() => setWasFixed(false)}
                      className="absolute right-2 top-2 text-emerald-500/60 hover:text-emerald-500"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Visualization Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="h-[600px] lg:h-full flex flex-col bg-[#dcd0c0] dark:bg-zinc-900 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)] relative group"
          >
            {/* Dynamic Island Notch - Visualizer */}
              <div className="absolute top-0 left-0 sm:left-1/2 sm:-translate-x-1/2 bg-[#cfc3b0] dark:bg-[#f8f9fa] px-4 sm:px-6 py-2 rounded-br-2xl sm:rounded-b-2xl sm:rounded-br-none border-r sm:border-x border-b border-slate-200 dark:border-zinc-200/80 z-30 flex items-center gap-2 shadow-sm backdrop-blur-xl">
              <Settings2 size={12} className="text-indigo-600 sm:w-[14px] sm:h-[14px]" />
              <span className="text-[10px] sm:text-xs font-extrabold text-slate-700 dark:text-zinc-700 tracking-widest uppercase">Trace Engine</span>
            </div>
            
            <div className="flex-1 w-full bg-[#dcd0c0] relative h-full overflow-hidden rounded-[32px]">
              {visualizeUrl ? (
                <>
                  {!isIframeLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#f8f9fa] z-50">
                      <div className="relative flex items-center justify-center">
                        <div className="w-16 h-16 border-4 border-zinc-200 rounded-full"></div>
                        <div className="w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin absolute inset-0 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                        <Settings2 size={20} className="text-indigo-500 absolute animate-pulse" />
                      </div>
                      <p className="mt-6 text-xs font-extrabold text-zinc-500 tracking-widest uppercase animate-pulse">Initializing Engine...</p>
                    </div>
                  )}
                  <iframe 
                    src={visualizeUrl}
                    onLoad={() => setIsIframeLoaded(true)}
                    className="w-full border-none"
                    style={
                      (selectedLang.id === 'cpp' || selectedLang.id === 'c')
                        ? { position: 'absolute', top: '-105px', height: 'calc(100% + 160px)' }
                        : { position: 'absolute', inset: 0, height: '100%' }
                    }
                    title="Code Execution Visualizer"
                    allow="clipboard-read; clipboard-write"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-[#e8ddd1]/50 dark:bg-zinc-900/50">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-sky-100 dark:from-indigo-900/40 dark:to-sky-900/40 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white dark:border-white/10"
                  >
                    <Maximize2 size={32} className="text-indigo-500 dark:text-indigo-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 mb-3 tracking-tight">Ready to Visualize</h3>
                  <p className="text-base text-slate-500 dark:text-zinc-400 max-w-sm mb-8 leading-relaxed">
                    Write your code in the editor and click <span className="font-semibold text-indigo-500 dark:text-indigo-400">Visualize Execution</span> to see a step-by-step trace of your logic.
                  </p>
                  
                  <div className="flex flex-col gap-4 w-full max-w-sm">
                    {[
                      { icon: ChevronRight, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'Step forwards & backwards through execution' },
                      { icon: Code2, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'Monitor variables and object references' },
                      { icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'Visualize the call stack dynamically' }
                    ].map((feature, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + (idx * 0.1) }}
                        className="flex items-center gap-4 p-4 bg-[#dcd0c0] dark:bg-[#1c1c24] rounded-2xl border border-slate-100 dark:border-white/5 text-left shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300"
                      >
                        <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center shrink-0`}>
                          <feature.icon size={20} className={feature.color} />
                        </div>
                        <div className="text-[15px] font-semibold text-slate-700 dark:text-zinc-300 leading-tight">{feature.text}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
    </div>
  );
}
