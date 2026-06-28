import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, ArrowRightLeft, Play, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Link } from 'react-router-dom';

// Custom Engine Components
import { useTraceEngine } from './hooks/useTraceEngine';
import VisualizerEditor from './components/VisualizerEditor';
import TraceSidebar from './components/TraceSidebar';
import TraceControls from './components/TraceControls';
import CollaborationControls from './components/CollaborationControls';
import { useCollaborationRoom } from './hooks/useCollaborationRoom';

type SupportedLang = 'python' | 'cpp' | 'c' | 'java' | 'javascript';

interface LangConfig {
  id: SupportedLang;
  name: string;
  monacoLang: string;
  defaultCode: string;
}

const LANGUAGES: LangConfig[] = [
  { id: 'python', name: 'Python 3', monacoLang: 'python', defaultCode: 'def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)\n\nresult = factorial(5)\nprint(f"Factorial is {result}")' },
  { id: 'cpp', name: 'C++', monacoLang: 'cpp', defaultCode: '#include <stdio.h>\n\nvoid swap(int* a, int* b) {\n    int temp = *a;\n    *a = *b;\n    *b = temp;\n}\n\nint main() {\n    int arr[] = {5, 2, 8, 1};\n    int n = sizeof(arr)/sizeof(arr[0]);\n    \n    for(int i = 0; i < n-1; i++) {\n        for(int j = 0; j < n-i-1; j++) {\n            if(arr[j] > arr[j+1]) {\n                swap(&arr[j], &arr[j+1]);\n            }\n        }\n    }\n    \n    printf("Sorted!\\n");\n    return 0;\n}' },
  { id: 'java', name: 'Java', monacoLang: 'java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        String str = "Hello AlgoLib";\n        String reversed = "";\n        for (int i = str.length() - 1; i >= 0; i--) {\n            reversed += str.charAt(i);\n        }\n        System.out.println(reversed);\n    }\n}' },
  { id: 'javascript', name: 'JavaScript', monacoLang: 'javascript', defaultCode: 'const reverseString = (str) => {\n  let reversed = "";\n  for(let char of str) {\n    reversed = char + reversed;\n  }\n  return reversed;\n};\n\nconsole.log(reverseString("AlgoLib"));' },
  { id: 'c', name: 'C', monacoLang: 'c', defaultCode: '#include <stdio.h>\n\nint main() {\n    int a = 10;\n    int b = 20;\n    int sum = a + b;\n    printf("Sum is %d\\n", sum);\n    return 0;\n}' },
];

export default function SnippetVisualizer() {
  const [selectedLang, setSelectedLang] = useState<LangConfig>(LANGUAGES[0]);
  const [code, setCode] = useState<string>(LANGUAGES[0].defaultCode);
  const [customInput, setCustomInput] = useState<string>('');
  const [showInput, setShowInput] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const {
    isProcessing,
    traceData,
    currentStep,
    totalSteps,
    currentTrace,
    stdout,
    exception,
    fetchTrace,
    stepForward,
    stepBackward,
    reset,
    jumpToStep,
    clearTrace,
    setTraceData,
  } = useTraceEngine();

  const {
    roomId, role, roomState, viewerCount, participants, kickParticipant,
    createRoom, joinRoom, leaveRoom, broadcastState
  } = useCollaborationRoom();

  // --- COLLABORATION SYNC LOGIC ---
  
  // 1. Host -> Firebase (Broadcast local changes)
  useEffect(() => {
    if (role === 'host') broadcastState({ code });
  }, [code, role, broadcastState]);

  useEffect(() => {
    if (role === 'host') broadcastState({ customInput });
  }, [customInput, role, broadcastState]);

  useEffect(() => {
    if (role === 'host') broadcastState({ languageId: selectedLang.id });
  }, [selectedLang.id, role, broadcastState]);

  useEffect(() => {
    if (role === 'host') broadcastState({ traceData });
  }, [traceData, role, broadcastState]);

  useEffect(() => {
    if (role === 'host') broadcastState({ currentStep });
  }, [currentStep, role, broadcastState]);

  // 2. Firebase -> Viewer (Receive remote changes)
  useEffect(() => {
    if (role === 'viewer' && roomState) {
      if (roomState.code !== undefined) setCode(roomState.code);
      if (roomState.customInput !== undefined) setCustomInput(roomState.customInput);
      
      if (roomState.languageId !== undefined && roomState.languageId !== selectedLang.id) {
        const lang = LANGUAGES.find(l => l.id === roomState.languageId);
        if (lang) setSelectedLang(lang);
      }
      
      if (roomState.traceData !== undefined) setTraceData(roomState.traceData);
      if (roomState.currentStep !== undefined) jumpToStep(roomState.currentStep);
    }
  }, [role, roomState, selectedLang.id, setTraceData, jumpToStep]);

  // --------------------------------

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleLangChange = (langId: string) => {
    if (role === 'viewer') return; // Viewers cannot change language
    const lang = LANGUAGES.find(l => l.id === langId);
    if (lang) {
      setSelectedLang(lang);
      setCode(lang.defaultCode);
      setCustomInput('');
      clearTrace();
    }
  };

  const handleVisualize = () => {
    fetchTrace(code, selectedLang.id, customInput);
  };

  return (
    <div className="h-screen w-full bg-[#e8ddd1] dark:bg-[#050505] text-slate-800 dark:text-zinc-300 font-sans selection:bg-sky-500/30 selection:text-sky-800 dark:selection:text-sky-200 relative overflow-hidden flex flex-col">
      <Helmet>
        <title>Native Trace Engine | AlgoLib</title>
      </Helmet>

      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[60%] h-[20%] rounded-full bg-violet-500/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <Navbar />

        <main className="flex-1 w-full flex flex-col pt-20 pb-4 px-4 overflow-hidden relative z-20">
          
          {/* Compact Toolbar */}
          <div className="relative z-[100] flex flex-wrap items-center justify-between w-full mb-4 shrink-0 bg-white/50 dark:bg-[#111116]/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-2 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              <Link to="/visualizer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200/50 dark:bg-zinc-800/50 hover:bg-slate-200 dark:hover:bg-zinc-800 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400 transition-all shrink-0">
                <ArrowRightLeft size={14} className="rotate-180" /> Back
              </Link>
              <div className="hidden sm:block h-4 w-px bg-slate-300 dark:bg-zinc-700 shrink-0" />
              <div className="flex items-center gap-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLangChange(lang.id)}
                    className={`relative px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-colors duration-300 whitespace-nowrap ${
                      selectedLang.id === lang.id
                        ? 'text-black'
                        : 'text-slate-500 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300'
                    }`}
                  >
                    {selectedLang.id === lang.id && (
                      <motion.div
                        layoutId="activeLangTab"
                        className="absolute inset-0 bg-blue-400 border border-blue-500 shadow-[0_0_10px_rgba(96,165,250,0.3)] rounded-lg -z-10 dark:border-blue-500/50"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="hidden lg:flex items-center gap-3 pr-2 shrink-0">
               <CollaborationControls 
                 roomId={roomId}
                 role={role}
                 roomState={roomState}
                 onCreateRoom={async () => {
                   await createRoom({
                     code,
                     languageId: selectedLang.id,
                     customInput,
                     traceData,
                     currentStep
                   });
                 }}
                 onJoinRoom={joinRoom}
                 onLeaveRoom={leaveRoom}
                 viewerCount={viewerCount}
                 participants={participants}
                 onKickParticipant={kickParticipant}
               />
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest">
                <Code2 size={12} className="text-emerald-500 dark:text-emerald-400" />
                Native Trace Engine (v2)
              </div>
            </div>
          </div>

          {/* Split Screen Grid Layout */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 relative z-20">
            
            {/* Editor Column */}
            <div className="h-full flex flex-col bg-[#dcd0c0] dark:bg-[#0a0a0f] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl relative group min-h-0">
              
              {/* Dynamic Island Notch - Editor */}
              <div className="absolute top-0 left-0 sm:left-1/2 sm:-translate-x-1/2 bg-slate-100 dark:bg-[#1c1c24] px-4 sm:px-6 py-2 rounded-br-2xl sm:rounded-b-2xl sm:rounded-br-none border-r sm:border-x border-b border-slate-200 dark:border-white/10 z-30 flex items-center gap-2 sm:gap-3 shadow-md dark:shadow-xl backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
                <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-zinc-300 font-mono tracking-widest uppercase">
                  workspace.{selectedLang.monacoLang}
                </span>
              </div>
              
              <div className="flex-1 relative h-full pt-12 pb-2 px-2 flex flex-col min-h-0">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-[#1c1c24]/30 dark:to-transparent pointer-events-none" />
                
                <div className="flex-1 relative min-h-0 h-full">
                  <VisualizerEditor
                    code={code}
                    language={selectedLang.monacoLang}
                    theme={isDarkMode ? "vs-dark" : "light"}
                    onChange={(val) => {
                      if (role !== 'viewer') setCode(val);
                    }}
                    currentLine={currentTrace?.line}
                    exceptionLine={exception ? currentTrace?.line : null}
                    readOnly={role === 'viewer'}
                  />
                </div>

                {/* Custom Input Pane */}
                <AnimatePresence>
                  {showInput && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 120, opacity: 1, marginTop: 8 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      className="w-full bg-[#e8ddd1] dark:bg-[#1c1c24] rounded-xl border border-slate-200 dark:border-white/10 shadow-inner overflow-hidden relative z-20 shrink-0"
                    >
                      <div className="absolute top-0 left-0 right-0 px-4 py-1.5 bg-slate-100 dark:bg-black/20 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                         <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Custom Input (STDIN) Upfront</span>
                      </div>
                      <textarea 
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        placeholder="Enter all required runtime inputs separated by newlines BEFORE executing..."
                        className="w-full h-full pt-8 pb-3 px-4 bg-transparent text-sm font-mono text-slate-700 dark:text-zinc-300 resize-none outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-600 disabled:opacity-50"
                        disabled={totalSteps > 0 || role === 'viewer'}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Top Right Action Button */}
              <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
                {totalSteps > 0 && (
                  <button
                    onClick={clearTrace}
                    disabled={role === 'viewer'}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-400/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear Engine
                  </button>
                )}

                <button
                  onClick={() => setShowInput(!showInput)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${
                    showInput 
                      ? 'bg-blue-400 dark:bg-blue-500/20 text-black dark:text-blue-400 border border-blue-500 dark:border-blue-500/50 shadow-sm' 
                      : 'bg-[#dcd0c0] dark:bg-[#1c1c24] text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-white/10 hover:bg-blue-400 hover:text-black hover:border-blue-500'
                  }`}
                >
                  Custom Input
                </button>

                <button
                  onClick={handleVisualize}
                  disabled={isProcessing || !code.trim() || totalSteps > 0 || role === 'viewer'}
                  className="group/btn flex items-center gap-1.5 px-4 py-2 bg-green-400 hover:bg-green-500 text-black border border-green-500 text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-[0_4px_20px_-4px_rgba(74,222,128,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isProcessing ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} className="fill-current group-hover/btn:scale-110 transition-transform" />
                  )}
                  <span>Trace</span>
                </button>
              </div>
            </div>

            {/* Trace Visualization Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="h-full flex flex-col gap-4 min-h-0"
            >
              {totalSteps > 0 ? (
                <>
                  <TraceControls 
                    currentStep={currentStep} 
                    totalSteps={totalSteps} 
                    onStepForward={() => { if (role !== 'viewer') stepForward(); }} 
                    onStepBackward={() => { if (role !== 'viewer') stepBackward(); }} 
                    onReset={() => { if (role !== 'viewer') reset(); }} 
                    onJumpToStep={(step) => { if (role !== 'viewer') jumpToStep(step); }}
                    disabled={role === 'viewer'}
                  />
                  <div className="flex-1 relative min-h-0">
                     <TraceSidebar currentTrace={currentTrace} stdout={stdout} exception={exception} />
                  </div>
                </>
              ) : (
                <div className="flex-1 bg-[#dcd0c0] dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center p-8 shadow-xl">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-sky-100 dark:from-emerald-900/40 dark:to-sky-900/40 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white dark:border-white/10">
                    <Code2 size={28} className="text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-2 tracking-tight">Native Trace Engine</h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                    Write your code and click <span className="font-semibold text-emerald-500 dark:text-emerald-400">Trace</span> to generate a step-by-step execution path natively within the Monaco Editor.
                  </p>
                </div>
              )}
            </motion.div>

          </div>
        </main>
      </div>
    </div>
  );
}
