import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Play, Send, Lock, Clock, CheckCircle2, Terminal as TerminalIcon, ArrowLeft, Loader2, X, AlertTriangle, Settings, RotateCcw, Wand2, Cpu, Database, Award, Activity, Code2, AlertCircle, Sparkles, ListOrdered } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { toast } from 'sonner';

// --- PURE CODEFORCES TEMPLATES ---
const userTemplates: Record<string, string> = {
  'c++': `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}`,
  'python': `import sys\n\ndef main():\n    # Write your code here\n    pass\n\nif __name__ == '__main__':\n    main()`,
  'java': `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code here\n        \n    }\n}`
};

const FALLBACK_PROBLEM = {
  id: 'fallback-id', title: 'Two Sum', difficulty: 'Easy', tags: ['Array', 'Hash Table'], points: 100, penalty: 5,
  description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have **exactly one solution**.'
};

const FALLBACK_TEST_CASES = [
  { id: 1, display_input: 'nums = [2,7,11,15]\ntarget = 9', raw_input: '4\n2 7 11 15\n9', expected_output: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].', is_public: true }
];

interface SubmissionResult {
  passed: number;
  total: number;
  allPassed: boolean;
  timeTakenMs: number;
  language: string;
  accuracy: number;
  attemptsCorrect: number;
  attemptsTotal: number;
  pointsEarned: number;
  estimatedMemoryKB: number;
  estimatedComplexity: string;
}

// --- MARKDOWN PARSER ---
const renderMarkdown = (text: string, isSmall = false) => {
  if (!text) return null;
  let cleanText = text.replace(/\\n/g, '\n');
  return cleanText.split('\n').map((line, i) => {
    let isHeader = false;
    let headerClass = "";
    let content = line;

    if (line.startsWith('# ')) { isHeader = true; headerClass = `font-semibold text-slate-900 dark:text-zinc-100 mt-6 mb-3 ${isSmall ? 'text-lg' : 'text-xl'}`; content = line.substring(2); }
    else if (line.startsWith('## ')) { isHeader = true; headerClass = `font-semibold text-slate-800 dark:text-zinc-200 mt-5 mb-2 ${isSmall ? 'text-base' : 'text-lg'}`; content = line.substring(3); }
    else if (line.startsWith('### ')) { isHeader = true; headerClass = `font-semibold text-slate-800 dark:text-zinc-300 mt-4 mb-2 ${isSmall ? 'text-sm' : 'text-base'}`; content = line.substring(4); }
    
    if (content.trim() === '') return <div key={i} className={isSmall ? "h-2" : "h-4"}></div>;

    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
    const formattedContent = parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="text-slate-900 dark:text-zinc-200 font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className={`bg-slate-100 dark:bg-white/5 border border-blue-200 dark:border-white/10 text-slate-800 dark:text-zinc-200 px-1.5 py-0.5 rounded font-mono ${isSmall ? 'text-[11px]' : 'text-[13px]'}`}>{part.slice(1, -1)}</code>;
      }
      return part;
    });

    if (isHeader) return <div key={i} className={headerClass}>{formattedContent}</div>;
    return <p key={i} className={`mb-2 leading-relaxed ${isSmall ? 'text-[13px] md:text-sm text-slate-700 dark:text-zinc-400' : 'text-slate-800 dark:text-zinc-300 text-[15px]'}`}>{formattedContent}</p>;
  });
};

type LogEntry = {
  type: 'system' | 'case_header' | 'success' | 'error' | 'expected' | 'actual_pass' | 'actual_fail';
  content?: string;
  data?: any; 
};

const renderTerminalLog = (log: LogEntry, i: number) => {
  switch (log.type) {
    case 'system':
      return (
        <div key={i} className="text-slate-500 dark:text-zinc-400 font-mono text-[13px] mb-2 flex items-start gap-2">
          <span className="text-sky-600 dark:text-sky-500 font-bold select-none">algolib@runner:~$</span>
          <span>{log.content}</span>
        </div>
      );
    case 'case_header':
      return <div key={i} className="text-slate-700 dark:text-zinc-300 font-semibold mt-4 mb-2 flex items-center gap-2 text-[13px] bg-slate-100 dark:bg-white/5 px-3 py-1 rounded w-fit border border-blue-100 dark:border-transparent">Test Case {log.content}</div>;
    case 'success':
      return <div key={i} className="text-emerald-600 dark:text-emerald-500 font-medium flex items-center gap-2 my-1 text-[13px]"><span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 rounded text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">[OK]</span> {log.content}</div>;
    case 'error':
      return (
        <div key={i} className="text-rose-600 dark:text-rose-500 font-medium flex items-start gap-2 my-2 bg-rose-50 dark:bg-rose-500/5 p-3 rounded-md border border-rose-200 dark:border-rose-500/10">
          <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-500/10 rounded text-[11px] font-bold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shrink-0">[ERR]</span> 
          <pre className="font-mono whitespace-pre-wrap text-[13px]">{log.content}</pre>
        </div>
      );
    case 'expected':
      return (
        <div key={i} className="mt-2 mb-1">
          <div className="text-slate-500 dark:text-zinc-500 font-semibold mb-1 text-[11px] uppercase">Expected Output</div>
          <div className="bg-slate-50 dark:bg-zinc-950 px-3 py-2 rounded border border-blue-100 dark:border-white/5">
            <pre className="font-mono whitespace-pre-wrap text-[13px] text-slate-700 dark:text-zinc-300">{log.content || " "}</pre>
          </div>
        </div>
      );
    case 'actual_pass':
    case 'actual_fail':
      const isPass = log.type === 'actual_pass';
      return (
        <div key={i} className="mb-4">
          <div className="text-slate-500 dark:text-zinc-500 font-semibold mb-1 text-[11px] uppercase">Actual Output</div>
          <div className={`px-3 py-2 rounded border ${isPass ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/10' : 'bg-rose-50 border-rose-200 dark:bg-rose-500/5 dark:border-rose-500/10'}`}>
            <pre className={`font-mono whitespace-pre-wrap text-[13px] ${isPass ? 'text-emerald-700 dark:text-emerald-200' : 'text-rose-700 dark:text-rose-200'}`}>{log.content || " "}</pre>
          </div>
        </div>
      );
    default:
      return <div key={i} className="text-slate-500 dark:text-zinc-400 font-mono text-[13px]">{log.content}</div>;
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.95, filter: "blur(4px)" },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 300, damping: 20 } 
  }
};

const pulseRingVariants: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: [1, 1.8, 2.5], 
    opacity: [0.6, 0.1, 0],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeOut" as const }
  }
};

const bgShiftVariants: Variants = {
  animate: {
    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
    transition: { duration: 15, repeat: Infinity, ease: "linear" as const }
  }
};

const SubmissionDashboard = ({ result, onReset, onShowLogs, onNextProblem, hasNextProblem }: { result: SubmissionResult, onReset: () => void, onShowLogs: () => void, onNextProblem: () => void, hasNextProblem: boolean }) => {
  const isPass = result.allPassed;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col w-full h-full p-3 md:p-5 overflow-y-auto custom-scrollbar font-sans gap-4 bg-sky-50 dark:bg-[#0d0d0d] text-slate-800 dark:text-zinc-100"
    >
      <div className="flex flex-col md:flex-row gap-4">
        <motion.div 
           variants={itemVariants} 
           className={`flex-1 flex flex-col items-center justify-center p-6 rounded-2xl relative overflow-hidden shadow-2xl transition-all border ${isPass ? 'bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-white dark:from-emerald-950/60 dark:via-emerald-900/20 dark:to-[#121212] border-emerald-200 dark:border-emerald-500/20 shadow-emerald-100 dark:shadow-emerald-900/20' : 'bg-gradient-to-br from-rose-50 via-rose-100/50 to-white dark:from-rose-950/60 dark:via-rose-900/20 dark:to-[#121212] border-rose-200 dark:border-rose-500/20 shadow-rose-100 dark:shadow-rose-900/20'}`}
        >
           <motion.div 
             variants={bgShiftVariants}
             animate="animate"
             className={`absolute inset-0 opacity-30 ${isPass ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.15),transparent_60%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.15),transparent_60%)]'} bg-[length:200%_200%]`}
           />

           <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest bg-white dark:bg-white/5 backdrop-blur-md border border-blue-200 dark:border-white/10 uppercase text-slate-500 dark:text-zinc-400">
              Evaluation
           </div>
           
           <div className="relative mb-4 mt-2">
              <motion.div variants={pulseRingVariants} initial="initial" animate="animate" className={`absolute inset-0 rounded-full ${isPass ? 'bg-emerald-500' : 'bg-rose-500'}`}></motion.div>
              
              <motion.div 
                 initial={{ scale: 0, rotate: -90 }}
                 animate={{ scale: 1, rotate: 0 }}
                 transition={{ type: "spring", stiffness: 250, damping: 18, delay: 0.2 }}
                 className={`w-14 h-14 rounded-2xl flex items-center justify-center relative z-10 shadow-lg backdrop-blur-xl border ${isPass ? 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-400/30' : 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-400/30'}`}
               >
                 {isPass ? <CheckCircle2 size={32} strokeWidth={2.5} /> : <X size={32} strokeWidth={2.5} />}
              </motion.div>
           </div>
           
           <h2 className={`text-2xl md:text-3xl font-black tracking-tight mb-1 relative z-10 drop-shadow-md ${isPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
             {isPass ? 'Execution Successful' : 'Test Cases Failed'}
           </h2>
           <p className="text-slate-500 dark:text-zinc-400 text-[13px] font-medium text-center relative z-10 max-w-sm">
             {isPass ? 'Your code efficiently passed all required criteria.' : 'Output did not match expected results for hidden cases.'}
           </p>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full md:w-64 bg-gradient-to-b from-white to-sky-50 dark:from-[#1a1a1a] dark:to-[#121212] border border-blue-100 dark:border-white/5 rounded-2xl p-5 flex flex-col relative overflow-hidden group shadow-md dark:shadow-xl">
           <motion.div 
             animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }} 
             transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
             className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-700 pointer-events-none"
           >
              <Award size={120} />
           </motion.div>

           <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-500 text-[10px] font-black tracking-[0.2em] uppercase mb-3 relative z-10">
              <Award size={12} className={isPass ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-zinc-600'} /> 
              Net Score
           </div>
           
           <div className="flex flex-col mt-auto relative z-10">
              <div className="flex items-baseline gap-1.5">
                 <motion.span 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, type: "spring", damping: 14 }}
                    className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-zinc-500"
                 >
                   {result.pointsEarned}
                 </motion.span>
                 <span className="text-slate-500 dark:text-zinc-500 font-bold text-sm tracking-wide">Pts</span>
              </div>
           </div>

           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}
             className="mt-4 text-[10px] text-slate-500 dark:text-zinc-400 font-medium leading-tight flex gap-1.5 items-start bg-white/80 dark:bg-[#0a0a0a]/80 border border-blue-100 dark:border-white/5 p-2.5 rounded-lg relative z-10 backdrop-blur-md"
           >
             <AlertCircle size={12} className="shrink-0 mt-0.5 text-sky-500 dark:text-sky-400" />
             <span>Score locks after the <strong>first accepted submission</strong>.</span>
           </motion.div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }} className="bg-white dark:bg-[#151515] border border-blue-100 dark:border-white/5 hover:border-sky-300 dark:hover:border-sky-500/30 rounded-xl p-4 md:p-5 flex flex-col transition-all duration-300 shadow-sm relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
           <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-500 text-[10px] font-black tracking-widest uppercase">
                 <Database size={12} className="text-sky-500 dark:text-sky-400" /> Tests
              </div>
              <div className="bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 px-1.5 py-0.5 rounded text-[9px] font-bold">{result.accuracy}%</div>
           </div>
           
           <div className="flex items-baseline gap-1 mb-3 relative z-10">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{result.passed}</span>
              <span className="text-slate-500 dark:text-zinc-600 font-bold text-sm">/{result.total}</span>
           </div>
           
           <div className="mt-auto w-full bg-slate-200 dark:bg-black/60 h-1 rounded-full overflow-hidden relative z-10">
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${result.accuracy}%` }} transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                className={`h-full rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)] ${result.accuracy === 100 ? 'bg-emerald-400' : 'bg-sky-400'}`}
              />
           </div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }} className="bg-white dark:bg-[#151515] border border-blue-100 dark:border-white/5 hover:border-amber-300 dark:hover:border-amber-500/30 rounded-xl p-4 md:p-5 flex flex-col transition-all duration-300 shadow-sm relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
           <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-500 text-[10px] font-black tracking-widest uppercase mb-3 relative z-10">
              <Activity size={12} className="text-amber-500 dark:text-amber-400" /> Runtime
           </div>
           <div className="flex items-baseline gap-1 mt-auto relative z-10">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{result.timeTakenMs}</span>
              <span className="text-slate-500 dark:text-zinc-500 font-bold text-sm">ms</span>
           </div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }} className="bg-white dark:bg-[#151515] border border-blue-100 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-500/30 rounded-xl p-4 md:p-5 flex flex-col transition-all duration-300 shadow-sm relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
           <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-500 text-[10px] font-black tracking-widest uppercase mb-3 relative z-10">
              <Cpu size={12} className="text-purple-500 dark:text-purple-400" /> Memory
           </div>
           <div className="flex items-baseline gap-1 mt-auto relative z-10">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{(result.estimatedMemoryKB / 1024).toFixed(1)}</span>
              <span className="text-slate-500 dark:text-zinc-500 font-bold text-sm">MB</span>
           </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="mt-2 flex flex-col sm:flex-row gap-3">
         {isPass ? (
             <motion.button 
                whileHover={hasNextProblem ? { scale: 1.02, y: -2 } : {}}
                whileTap={hasNextProblem ? { scale: 0.98 } : {}}
                onClick={onNextProblem} 
                disabled={!hasNextProblem}
                className={`relative flex-1 py-3.5 px-6 font-bold text-[13px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 overflow-hidden group ${hasNextProblem ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20 dark:bg-zinc-100 dark:text-black dark:hover:bg-white dark:shadow-white/10' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-transparent dark:bg-zinc-900 dark:text-zinc-600 dark:border-white/5'}`}>
                {hasNextProblem && <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}></div>}
                <span className="relative z-10">{hasNextProblem ? 'Next Challenge' : 'Contest Completed'}</span>
             </motion.button>
         ) : (
             <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onReset} 
                className="relative flex-1 py-3.5 px-6 bg-sky-500 text-white hover:bg-sky-600 dark:bg-zinc-100 dark:text-black dark:hover:bg-white font-bold text-[13px] rounded-xl transition-all shadow-sm overflow-hidden group">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span className="relative z-10">Try Again</span>
             </motion.button>
         )}
         <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onShowLogs} 
            className="flex-1 py-3.5 px-6 bg-white dark:bg-[#151515] text-slate-700 dark:text-zinc-300 font-bold text-[13px] rounded-xl border border-blue-200 dark:border-white/5 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:shadow-xl dark:hover:border-white/10">
            <TerminalIcon size={16} className="text-slate-400 dark:text-zinc-500" /> View Output Logs
         </motion.button>
      </motion.div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  );
};

export default function ContestPanel({ user, onLoginRequest }: { user: any, onLoginRequest: any }) {
  const { contestId } = useParams();
  
  const editorRef = useRef<any>(null); 
  const monacoRef = useRef<any>(null);
  
  const [contest, setContest] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [allTestCases, setAllTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState('c++'); 
  const [code, setCode] = useState(userTemplates['c++']);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [contestStatus, setContestStatus] = useState<'upcoming' | 'active' | 'ended'>('upcoming');
  const [lastRunTime, setLastRunTime] = useState<number>(0);
  
  const [problemStats, setProblemStats] = useState<Record<string, { correct: number, total: number }>>({});
  
  const [showEndedPopup, setShowEndedPopup] = useState(false);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [showEditorSettings, setShowEditorSettings] = useState(false);
  const [editorSettings, setEditorSettings] = useState({
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: window.innerWidth < 768 ? 13 : 14,
    wordWrap: false,
    suggestions: true
  });

  const [submissionPhase, setSubmissionPhase] = useState<'idle' | 'evaluating' | 'complete'>('idle');
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    if (problems.length === 0 || !contestId) return;
    const currentProblem = problems[activeProblemIndex];
    if (!currentProblem) return;
    const cacheKey = `algolib_state_${contestId}_${currentProblem.id}_${language}`;
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSubmissionPhase(parsed.phase || 'idle');
        setSubmissionResult(parsed.result || null);
        setLogs(parsed.logs || []);
      } else {
        setSubmissionPhase('idle');
        setSubmissionResult(null);
        setLogs([]);
      }
    } catch {
      setSubmissionPhase('idle');
      setSubmissionResult(null);
      setLogs([]);
    }
  }, [activeProblemIndex, problems, contestId, language]);

  useEffect(() => {
    if (problems.length === 0 || !contestId) return;
    const currentProblem = problems[activeProblemIndex];
    if (!currentProblem) return;
    const cacheKey = `algolib_state_${contestId}_${currentProblem.id}_${language}`;
    if (submissionPhase !== 'evaluating') {
      localStorage.setItem(cacheKey, JSON.stringify({ phase: submissionPhase, result: submissionResult, logs }));
    }
  }, [submissionPhase, submissionResult, logs, activeProblemIndex, problems, contestId, language]);

  // --- NEW MULTI-TAB & SUBMISSIONS TRACKING ---
  const [activeLeftTab, setActiveLeftTab] = useState<'description' | 'submissions'>('description');
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);

  // FREE TIER ROUND-ROBIN BALANCER: Spreading the load across multiple public spaces
  const HIGH_AVAILABILITY_ENGINES = [
    "https://rajawatprateek-algolib-engine-1.hf.space",
    "https://rajawatprateek-algolib-engine-2.hf.space",
    "https://rajawatprateek-algolib-engine-3.hf.space"
  ];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); 
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && contestStatus === 'active') {
        setShowCheatWarning(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [contestStatus]);

  useEffect(() => {
    const fetchMatrix = async () => {
      if (!contestId) { setLoading(false); return; }
      try {
        const response = await fetch(`/.netlify/functions/get-contest-details?id=${contestId}&t=${Date.now()}`);
        if (response.ok) {
          const { contest, problems, testCases } = await response.json();
          if (contest) setContest(contest);
          if (testCases && testCases.length > 0) setAllTestCases(testCases);
          
          if (problems && problems.length > 0) {
            setProblems(problems);
          } else {
            setProblems([FALLBACK_PROBLEM]);
          }
        } else {
          setProblems([FALLBACK_PROBLEM]);
        }
      } catch (err) {
        setProblems([FALLBACK_PROBLEM]);
      }
      setLoading(false);
    };
    fetchMatrix();
  }, [contestId]);

  useEffect(() => {
    if (problems.length === 0) return;
    const currentProblem = problems[activeProblemIndex];
    if (currentProblem.id === 'fallback-id') { 
      setTestCases(FALLBACK_TEST_CASES); 
      return; 
    }
    
    if (allTestCases.length > 0) {
      const problemTestCases = allTestCases.filter(tc => tc.problem_id === currentProblem.id);
      if (problemTestCases.length > 0) {
        setTestCases(problemTestCases);
        return;
      }
    }
    
    const fetchTestCases = async () => {
      try {
        const response = await fetch(`/.netlify/functions/get-test-cases?problemId=${currentProblem.id}&t=${Date.now()}`);
        if (response.ok) {
          const tcData = await response.json();
          if (tcData && tcData.length > 0) setTestCases(tcData);
          else setTestCases(FALLBACK_TEST_CASES);
        } else {
          setTestCases(FALLBACK_TEST_CASES);
        }
      } catch (err) {
        setTestCases(FALLBACK_TEST_CASES);
      }
    };
    fetchTestCases();
  }, [activeProblemIndex, problems, allTestCases]);

  // Fetch historic submissions when user shifts problem context or log tabs
  // 1. Load submissions from Local Storage on problem change
  useEffect(() => {
    if (!user || !contestId || problems.length === 0) return;
    const currentProblem = problems[activeProblemIndex];
    const cacheKey = `algolib_submissions_cache_${contestId}_${currentProblem.id}`;
    
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
          const parsed = JSON.parse(cached);
          const cleaned = parsed.map((sub: any) => 
              sub.isPending ? { ...sub, isPending: false, verdict: 'Execution Aborted', points: 0 } : sub
          );
          setUserSubmissions(cleaned);
      } else {
          setUserSubmissions([]);
      }
    } catch {}
  }, [activeProblemIndex, problems, contestId, user]);

  // 2. Fetch historic submissions from backend to sync
  useEffect(() => {
    if (!user || !contestId || problems.length === 0) return;
    if (submissionPhase === 'evaluating') return; // Prevent overwriting state while processing new submission
    
    const currentProblem = problems[activeProblemIndex];
    const fetchHistoricSubmissions = async () => {
      try {
        const uid = user.uid || user.id;
        const response = await fetch(`/.netlify/functions/get-user-submissions?userId=${uid}&problemId=${currentProblem.id}&contestId=${contestId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
             setUserSubmissions(prev => {
                const merged = [...prev];
                data.forEach((serverSub: any) => {
                   if (!merged.find(s => s.id === serverSub.id)) {
                      merged.push(serverSub);
                   }
                });
                return merged.sort((a, b) => new Date(b.time || b.created_at).getTime() - new Date(a.time || a.created_at).getTime());
             });
          }
        }
      } catch (e) {
        console.error("Could not fetch historic data", e);
      }
    };
    fetchHistoricSubmissions();
  }, [activeProblemIndex, problems, contestId, user, submissionPhase]);

  // Persist user submissions to local storage whenever they update
  useEffect(() => {
    if (problems.length === 0 || !contestId) return;
    const currentProblem = problems[activeProblemIndex];
    if (userSubmissions.length > 0) {
      const cacheKey = `algolib_submissions_cache_${contestId}_${currentProblem.id}`;
      localStorage.setItem(cacheKey, JSON.stringify(userSubmissions));
    }
  }, [userSubmissions, activeProblemIndex, problems, contestId]);

  useEffect(() => {
    if (problems.length === 0 || !contestId) return;
    const currentProblem = problems[activeProblemIndex];
    const userId = user?.uid || user?.id || 'guest';
    const cacheKey = `algolib_cache_${userId}_${contestId}_${currentProblem?.id}_${language}`;
    const cachedCode = localStorage.getItem(cacheKey);
    if (cachedCode) setCode(cachedCode);
    else setCode(userTemplates[language]);
  }, [activeProblemIndex, language, problems, contestId, user]);

  useEffect(() => {
    if (problems.length === 0 || !contestId) return;
    const currentProblem = problems[activeProblemIndex];
    const userId = user?.uid || user?.id || 'guest';
    const cacheKey = `algolib_cache_${userId}_${contestId}_${currentProblem?.id}_${language}`;
    if (code !== "") localStorage.setItem(cacheKey, code);
  }, [code, language, activeProblemIndex, problems, contestId, user]);



  useEffect(() => {
    if (!contest) return;
    const updateTimer = () => {
      const now = new Date().getTime();
      const start = new Date(contest.start_time).getTime();
      const end = new Date(contest.end_time).getTime();
      if (now < start) {
        setContestStatus('upcoming');
        setTimeRemaining(Math.floor((start - now) / 1000));
      } else if (now >= start && now <= end) {
        setContestStatus('active');
        setTimeRemaining(Math.floor((end - now) / 1000));
      } else {
        setContestStatus(prev => {
          if (prev !== 'ended') setShowEndedPopup(true);
          return 'ended';
        });
        setTimeRemaining(0);
      }
    };
    updateTimer(); 
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [contest]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLanguageChange = (e: any) => {
    setLanguage(e.target.value);
    setLogs([]); 
    setSubmissionPhase('idle');
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const handleFormatCode = () => {
    if (!editorRef.current || !monacoRef.current) return;
    const formatAction = editorRef.current.getAction('editor.action.formatDocument');
    if (formatAction) formatAction.run();

    if (language === 'c++' || language === 'java') {
        const model = editorRef.current.getModel();
        const currentCode = model.getValue();
        let indentLevel = 0;
        
        const lines = currentCode.split('\n');
        const formatted = lines.map(line => {
            let trimmed = line.trim();
            if (trimmed.startsWith('}')) indentLevel = Math.max(0, indentLevel - 1);
            const result = trimmed ? '    '.repeat(indentLevel) + trimmed : '';
            if (trimmed.endsWith('{')) indentLevel++;
            return result;
        }).join('\n');

        if (currentCode !== formatted) {
            editorRef.current.executeEdits('format-code', [{
                range: model.getFullModelRange(),
                text: formatted,
                forceMoveMarkers: true
            }]);
        }
    }
  };

  const handleResetRequest = () => {
    setShowResetModal(true);
  };

  const confirmResetCode = () => {
    setCode(userTemplates[language]);
    const currentProblem = problems[activeProblemIndex];
    const userId = user?.uid || user?.id || 'guest';
    const cacheKey = `algolib_cache_${userId}_${contestId}_${currentProblem?.id}_${language}`;
    localStorage.removeItem(cacheKey);
    setShowResetModal(false);
  };

  // --- COMPACT BATCH CODE EXECUTION VIA ROUND-ROBIN LOAD BALANCER ---
  const executeBatchExecutionEngine = async (lang: string, source: string, targetCases: any[]) => {
    // Round Robin: Pick a random container instance out of the available spaces to distribute 500-user traffic bursts
    const selectedEngineBase = HIGH_AVAILABILITY_ENGINES[Math.floor(Math.random() * HIGH_AVAILABILITY_ENGINES.length)];
    const BATCH_URL = `${selectedEngineBase}/execute/batch`;
    const STATUS_URL = `${selectedEngineBase}/status`;

    const mappedPayloadCases = targetCases.map((tc, idx) => ({
      id: tc.id || `case_${idx}`,
      input: String(tc.raw_input || tc.rawInput || '').replace(/\\n/g, '\n')
    }));

    try {
      const res = await fetch(BATCH_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, code: source, testCases: mappedPayloadCases })
      });

      if (!res.ok) throw new Error(`Engine Cluster Instance Offline [HTTP ${res.status}]`);
      const { jobId } = await res.json();

      // Poll matching execution space cluster for batch job resolution
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const statusRes = await fetch(`${STATUS_URL}/${jobId}`);
        if (!statusRes.ok) continue;
        const statusData = await statusRes.json();

        if (statusData.status === 'success') {
          return statusData.results; 
        }
        if (statusData.status === 'error') {
          throw new Error(statusData.output || 'Batch execution failure runtime constraint encountered');
        }
      }
    } catch (e: any) {
      throw new Error(`Execution pipeline failure: ${e.message}`);
    }
  };

  // --- CENTRALIZED BATCH GRADER ---
  const handleEvaluation = async (isSubmit = false) => {
    const now = Date.now();
    if (now - lastRunTime < 5000) {
      toast.error("Please wait a few seconds before executing again.");
      return;
    }
    
    if (isSubmit && contestStatus === 'ended') {
      setShowEndedPopup(true);
      return;
    }

    setLastRunTime(now);
    if (isSubmit && !user) {
      alert("Authentication required. Please log in to submit.");
      if (onLoginRequest) onLoginRequest();
      return;
    }
    
    setLogs([]); 
    
    const currentProblem = problems[activeProblemIndex];
    const pId = currentProblem.id;
    const tempSubId = `temp_${Date.now()}`;
    let casesToRun = isSubmit ? testCases : testCases.filter(tc => tc.is_public === true || tc.is_public === 'true' || tc.isPublic === true || tc.isPublic === 'true');
    if (casesToRun.length === 0 && testCases.length > 0) casesToRun = [testCases[0]];

    if (isSubmit) {
      setSubmissionPhase('evaluating');
      // INSTANT UI FEEDBACK: Push a pending submission record to the UI immediately
      const pendingSub = {
          id: tempSubId,
          time: new Date().toISOString(),
          problem_id: pId,
          language,
          verdict: 'Evaluating...',
          passed: 0,
          total: casesToRun.length,
          points: 0,
          isPending: true
      };
      setUserSubmissions(prev => [pendingSub, ...prev]);
      setActiveLeftTab('submissions'); // Auto-switch tab to show processing
    } else {
      setSubmissionPhase('idle');
      setLogs([{ type: 'system', content: 'Submitting all public configurations to balanced cluster framework...' }]);
    }
    
    let currentLogs: LogEntry[] = [];
    const addLog = (type: LogEntry['type'], content?: string, data?: any) => {
        currentLogs = [...currentLogs, { type, content, data }];
        setLogs(currentLogs);
    };

    if (!problemStats[pId]) {
      setProblemStats(prev => ({ ...prev, [pId]: { correct: 0, total: 0 } }));
    }

    const startTimeExecute = performance.now();

    try {
      // Single payload transaction execution avoids process spawning overhead bottlenecks completely
      const batchResults = await executeBatchExecutionEngine(language, code, casesToRun);
      
      let passedCount = 0;
      let runtimeCapMaxMs = 0;

      for (let i = 0; i < casesToRun.length; i++) {
        const tc = casesToRun[i];
        const res = batchResults[i];
        const caseNum = i + 1;
        const isPub = tc.is_public === true || tc.is_public === 'true' || tc.isPublic;
        
        const expOut = String(tc.expected_output || tc.expected || '').trim();
        const hasMultiple = tc.has_multiple_answers === true || tc.has_multiple_answers === 'true';

        let isCorrect = false;
        if (res && res.status === 'success') {
          const normalizedActual = (res.output || '').replace(/\s+/g, '');
          runtimeCapMaxMs = Math.max(runtimeCapMaxMs, (res.time || 0) * 1000);

          if (hasMultiple) {
            const expectedLines = expOut.split('\n').map(l => l.trim()).filter(Boolean);
            const actualLines = (res.output || '').split('\n').map(l => l.trim()).filter(Boolean);
            if (expectedLines.length === actualLines.length && actualLines.length > 0) {
                isCorrect = expectedLines.every((expLine, index) => {
                    const actLine = actualLines[index].replace(/\s+/g, ''); 
                    const possibleAnswers = expLine.split('|||').map(ans => ans.replace(/\s+/g, ''));
                    return possibleAnswers.includes(actLine);
                });
            }
          } else {
            const normalizedExpected = expOut.replace(/\s+/g, '');
            isCorrect = normalizedActual === normalizedExpected && normalizedExpected !== '';
          }
        }

        if (isCorrect) passedCount++;

        // Render detailed feedback stream to user terminal pane logs
        if (!isSubmit || !isCorrect) {
          if (!isSubmit) addLog('case_header', `${caseNum}`);
          if (res && res.status === 'error') {
            if (isSubmit) addLog('case_header', `${caseNum} (Hidden runtime context boundary condition failed)`);
            addLog('error', `Execution Error:\n${res.output}`);
          } else if (isCorrect) {
            if (!isSubmit) {
               addLog('success', 'Accepted');
               if (isPub) addLog('actual_pass', res.output);
            }
          } else {
            if (isSubmit) addLog('case_header', `${caseNum} (Hidden case verification step variance)`);
            addLog('error', 'Wrong Answer');
            if (isPub) {
                addLog('expected', expOut);
                addLog('actual_fail', res ? res.output : 'No production value derived');
            } else if (isSubmit) {
                addLog('system', 'Private context metadata masked out from direct output streaming.');
            }
          }
        }
      }

      const endTimeExecute = performance.now();
      const totalBatchDurationMs = Math.round(endTimeExecute - startTimeExecute);
      const allPassed = passedCount === casesToRun.length;

      if (isSubmit) {
        const diffStr = (currentProblem?.difficulty || 'easy').toLowerCase();
        const defaultPts = diffStr === 'hard' ? 300 : diffStr === 'medium' ? 200 : 100;
        const defaultPenalty = diffStr === 'hard' ? 20 : diffStr === 'medium' ? 10 : 5;
        
        const previousWrongAttempts = userSubmissions.filter(s => 
            s.id !== tempSubId && 
            !s.isPending && 
            !(s.passed === true || s.verdict === 'Accepted' || (s.score_awarded && s.score_awarded > 0))
        ).length;
        
        const hasAlreadySolved = userSubmissions.some(s => 
            s.id !== tempSubId && 
            !s.isPending && 
            (s.passed === true || s.verdict === 'Accepted' || (s.score_awarded && s.score_awarded > 0))
        );

        const pointsEarned = hasAlreadySolved ? 0 : Math.max(0, defaultPts - (previousWrongAttempts * defaultPenalty));
        
        // Update local accuracy stat (visual only)
        const currentStats = problemStats[pId] || { correct: 0, total: 0 };
        const newTotal = currentStats.total + 1;
        const newCorrect = allPassed ? currentStats.correct + 1 : currentStats.correct;
        const accuracy = Math.round((newCorrect / newTotal) * 100);
        setProblemStats(prev => ({ ...prev, [pId]: { correct: newCorrect, total: newTotal } }));

        let dbTimeTakenSeconds = 0;
        if (contest?.start_time) {
            const startTimeMs = new Date(contest.start_time).getTime();
            if (Date.now() > startTimeMs) {
                dbTimeTakenSeconds = Math.floor((Date.now() - startTimeMs) / 1000);
            }
        }

        // Database-First state execution tracking push strategy safely prevents page tab manipulation loss
        if (user && user.getIdToken) {
          try {
              const token = await user.getIdToken();
              await fetch('/.netlify/functions/submit-code', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({
                      problem_id: currentProblem.id, contest_id: contestId,
                      language: language, code: code, passed: allPassed,
                      score_awarded: allPassed ? pointsEarned : -defaultPenalty, time_taken_seconds: dbTimeTakenSeconds
                  })
              });
          } catch (e) { console.error("Database connection fault during remote persistent write:", e); }
        }

        // UPDATE THE PENDING SUBMISSION RECORD IN UI
        setUserSubmissions(prev => prev.map(sub => 
            sub.id === tempSubId ? {
                ...sub,
                verdict: allPassed ? 'Accepted' : 'Wrong Answer',
                passed: passedCount,
                points: allPassed ? pointsEarned : -defaultPenalty,
                isPending: false,
                time_taken_seconds: dbTimeTakenSeconds
            } : sub
        ));

        // Generate immediate view presentation context configuration
        setSubmissionResult({
           passed: passedCount, total: casesToRun.length, allPassed,
           timeTakenMs: runtimeCapMaxMs > 0 ? Math.round(runtimeCapMaxMs) : totalBatchDurationMs,
           language, accuracy, attemptsCorrect: newCorrect, attemptsTotal: newTotal,
           pointsEarned: allPassed ? pointsEarned : 0,
           estimatedMemoryKB: 1024 + Math.random() * 2048, estimatedComplexity: 'O(N)' 
        });
        setSubmissionPhase('complete');
      } else {
          if (allPassed) addLog('system', `All ${passedCount}/${casesToRun.length} public criteria verified successfully.`);
      }

    } catch (error: any) {
      addLog('error', `Cluster transaction pipeline timed out or dropped package execution thread: ${error.message}`);
      setSubmissionPhase('idle');
      
      // Update pending submission to show failure if crashed
      if (isSubmit) {
          setUserSubmissions(prev => prev.map(sub => 
              sub.id === tempSubId ? { ...sub, verdict: 'System Error', isPending: false } : sub
          ));
      }
    }
  };

  if (loading) return <div className="h-screen bg-[#121212] flex items-center justify-center"><Loader2 className="animate-spin text-sky-500" size={32} /></div>;

  const activeProblem = problems[activeProblemIndex];
  const activeDifficultyStr = (activeProblem?.difficulty || 'easy').toLowerCase();
  const defaultPoints = activeDifficultyStr === 'hard' ? 300 : activeDifficultyStr === 'medium' ? 200 : 100;
  const defaultPenalty = activeDifficultyStr === 'hard' ? 20 : activeDifficultyStr === 'medium' ? 10 : 5;
  const displayPoints = activeProblem?.points || defaultPoints;
  const displayPenalty = activeProblem?.penalty || defaultPenalty;
  
  const activeStats = problemStats[activeProblem?.id] || { correct: 0, total: 0 };
  const wrongCount = activeStats.total - activeStats.correct;
  const availablePoints = Math.max(0, displayPoints - (wrongCount * displayPenalty));

  let problemDesc = activeProblem?.description || '';
  let inputFmt = activeProblem?.inputFormat || activeProblem?.input_format || '';
  let outputFmt = activeProblem?.outputFormat || activeProblem?.output_format || '';
  let constr = activeProblem?.constraints || '';

  if (typeof problemDesc === 'string' && problemDesc.trim().startsWith('{')) {
      try {
          const parsedObj = JSON.parse(problemDesc);
          problemDesc = parsedObj.description || problemDesc;
          inputFmt = inputFmt || parsedObj.inputFormat || parsedObj.input_format || '';
          outputFmt = outputFmt || parsedObj.outputFormat || parsedObj.output_format || '';
          constr = constr || parsedObj.constraints || '';
      } catch (e) {
          problemDesc = problemDesc.replace(/^\{"description":"/, '').replace(/","inputFormat".*$/, '').replace(/"\}$/, '');
      }
  }

  return (
    <div className="h-screen w-screen bg-sky-50 dark:bg-[#121212] text-slate-800 dark:text-zinc-300 font-sans flex flex-col overflow-hidden relative selection:bg-sky-500/30">
      <AnimatePresence>
        {showResetModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-md p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-950 border border-blue-200 dark:border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                <RotateCcw size={48} className="text-rose-600 dark:text-rose-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2">Reset Editor?</h2>
                <p className="text-slate-600 dark:text-zinc-400 mb-6 text-sm">Are you sure you want to reset your code? All current changes will be permanently lost.</p>
                <div className="flex gap-4">
                   <button onClick={() => setShowResetModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-200 font-bold rounded-xl transition-colors border border-blue-100 dark:border-transparent">Cancel</button>
                   <button onClick={confirmResetCode} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold rounded-xl transition-colors">Yes, Reset</button>
                </div>
             </motion.div>
          </motion.div>
        )}

        {showEndedPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-md p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-950 border border-blue-200 dark:border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                <Clock size={48} className="text-rose-600 dark:text-rose-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Contest Ended</h2>
                <p className="text-slate-600 dark:text-zinc-400 mb-6 text-sm">The contest time has expired. Submissions for points are now disabled, but you can still run your code for practice.</p>
                <button onClick={() => setShowEndedPopup(false)} className="w-full py-3 bg-sky-50 dark:bg-zinc-100 hover:bg-sky-100 dark:hover:bg-white text-sky-700 dark:text-zinc-900 border border-blue-200 dark:border-transparent font-bold rounded-xl transition-colors">Acknowledge</button>
             </motion.div>
          </motion.div>
        )}

        {showCheatWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-md p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-950 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative">
                <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Warning</h2>
                <p className="text-slate-600 dark:text-zinc-400 mb-6 text-sm">Activity tracked: You switched tabs. Please do not navigate away during an active contest.</p>
                <button onClick={() => setShowCheatWarning(false)} className="w-full py-3 bg-amber-500 hover:bg-amber-600 dark:hover:bg-amber-400 text-white dark:text-black font-bold rounded-xl transition-colors">I Understand</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col w-full h-full relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-blue-100 dark:border-white/5 bg-white dark:bg-[#1a1a1a] shrink-0 z-20">
          <div className="flex items-center justify-between w-full p-3 md:px-4 md:h-12 md:w-auto">
            <div className="flex items-center gap-3 md:gap-4">
              <Link to="/contests" className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"><ArrowLeft size={18} /></Link>
              <div className="h-5 w-px bg-blue-100 dark:bg-white/10 hidden md:block mx-1"></div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${contestStatus === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
                <span className="text-[13px] md:text-sm font-semibold text-slate-900 dark:text-zinc-100 tracking-wide truncate max-w-[120px] sm:max-w-none">{contest?.title || 'Contest Arena'}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:hidden">
               <div className="flex items-center gap-1 bg-slate-50 dark:bg-white/5 border border-blue-100 dark:border-white/5 rounded-md px-1.5 py-1 font-mono text-[11px] font-medium text-slate-700 dark:text-zinc-300">
                  <Clock size={12} className={`${contestStatus === 'active' && timeRemaining < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-400 dark:text-zinc-400'}`} />
                  <span>{contestStatus === 'ended' ? "Ended" : formatTime(timeRemaining)}</span>
               </div>
               <button onClick={() => handleEvaluation(false)} disabled={submissionPhase === 'evaluating'} className="p-1.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-200 rounded-md border border-blue-100 dark:border-white/5 disabled:opacity-30 transition-all">
                 <Play size={14} className="text-slate-500 dark:text-zinc-400" />
               </button>
               <button 
                 onClick={() => handleEvaluation(true)} 
                 disabled={submissionPhase === 'evaluating' || contestStatus === 'ended'} 
                 className={`p-1.5 rounded-md transition-all ${contestStatus === 'ended' ? 'bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed' : 'bg-sky-100 text-sky-600 hover:bg-sky-200 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:hover:bg-sky-500/30 dark:border-sky-500/20 disabled:opacity-30'}`}
               >
                 <Send size={14} />
               </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 pb-3 pt-1 md:p-0 overflow-x-auto no-scrollbar md:mx-4 border-t border-blue-100 dark:border-white/5 md:border-none flex-1">
              {problems.map((p, idx) => (
                  <button 
                    key={p.id || idx} 
                    onClick={() => { setActiveProblemIndex(idx); setLogs([]); setSubmissionPhase('idle'); }}
                    className={`whitespace-nowrap px-3 py-1 text-[13px] rounded-md transition-all border ${activeProblemIndex === idx ? 'bg-slate-100 border-blue-200 text-slate-900 font-bold dark:bg-white/10 dark:border-transparent dark:text-zinc-100 dark:font-medium' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-white/5'}`}
                  >
                    {idx + 1}. {p.title || `Problem ${String.fromCharCode(65 + idx)}`}
                  </button>
              ))}
          </div>

          <div className="hidden md:flex items-center gap-3 px-4">
             <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-blue-100 dark:border-white/5 rounded-md px-3 py-1.5 font-mono text-sm font-medium text-slate-700 dark:text-zinc-200">
                <Clock size={14} className={`${contestStatus === 'active' && timeRemaining < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-400 dark:text-zinc-500'}`} />
                <span>{contestStatus === 'ended' ? "00:00:00" : formatTime(timeRemaining)}</span>
             </div>
             <div className="flex gap-2">
                <button onClick={() => handleEvaluation(false)} disabled={submissionPhase === 'evaluating'} className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-200 rounded-md text-[13px] font-medium border border-blue-100 dark:border-white/5 disabled:opacity-30 transition-all group">
                  <Play size={12} className="text-slate-500 dark:text-zinc-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" /> Run
                </button>
                <button 
                  onClick={() => handleEvaluation(true)} 
                  disabled={submissionPhase === 'evaluating' || contestStatus === 'ended'} 
                  title={contestStatus === 'ended' ? "Submissions closed" : ""}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${contestStatus === 'ended' ? 'bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed border border-blue-100 dark:border-transparent' : 'bg-sky-500 text-white dark:text-black hover:bg-sky-600 dark:hover:bg-sky-400 disabled:opacity-30 shadow-sm dark:shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(14,165,233,0.5)]'}`}
                >
                  <Send size={12} /> Submit
                </button>
             </div>
          </div>
        </div>
        
        <div className="bg-amber-50 dark:bg-[#1a1a1a] border-b border-amber-200 dark:border-white/5 px-4 py-1.5 flex items-center justify-center gap-2 shrink-0">
          <Lock size={12} className="text-amber-600 dark:text-amber-500" />
          <span className="text-amber-700 dark:text-zinc-400 text-[11px] font-medium tracking-wide">
            Anti-cheat systems are in place, if suspicious activity is detected, actions will be taken. Your activity is being monitored and logged and further will be analyzed.
          </span>
        </div>

        <div className="flex-1 min-h-0">
          <PanelGroup direction={isMobile ? "vertical" : "horizontal"}>
            <Panel defaultSize={isMobile ? 40 : 45} minSize={20} maxSize={80} className="flex flex-col bg-sky-50 dark:bg-[#121212] border-r border-blue-100 dark:border-white/5 relative z-10">
               
               {/* PURE CODEFORCES STYLE LEFT ARENA NAVIGATION CONTAINER */}
               <div className="flex border-b border-blue-100 dark:border-white/5 px-4 bg-white dark:bg-[#1a1a1a] shrink-0 items-center h-10 gap-4">
                  <button 
                    onClick={() => setActiveLeftTab('description')}
                    className={`text-[12px] h-full px-2 font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-2 ${activeLeftTab === 'description' ? 'text-sky-600 border-sky-500 dark:text-sky-400 dark:border-sky-500' : 'text-slate-500 border-transparent hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
                  >
                     <Code2 size={13} /> Description
                  </button>
                  <button 
                    onClick={() => setActiveLeftTab('submissions')}
                    className={`text-[12px] h-full px-2 font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-2 ${activeLeftTab === 'submissions' ? 'text-sky-600 border-sky-500 dark:text-sky-400 dark:border-sky-500' : 'text-slate-500 border-transparent hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
                  >
                     <ListOrdered size={13} /> Submissions Log
                  </button>
               </div>
               
               <div 
                 className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-6 pb-20 select-none bg-sky-50 dark:bg-[#121212]"
                 onContextMenu={(e) => e.preventDefault()}
               >
                 <AnimatePresence mode="wait">
                  {activeLeftTab === 'description' ? (
                    <motion.div 
                      key="desc-tab" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} transition={{ duration: 0.15 }}
                      className="w-full"
                    >
                       <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mb-4 leading-tight tracking-tight">{activeProblem?.title}</h1>
                       <div className="flex flex-wrap items-center gap-3 mb-8">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${activeDifficultyStr === 'easy' ? 'text-emerald-700 bg-emerald-100 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20' : activeDifficultyStr === 'medium' ? 'text-amber-700 bg-amber-100 border border-amber-200 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20' : 'text-rose-700 bg-rose-100 border border-rose-200 dark:text-rose-400 dark:bg-rose-400/10 dark:border-rose-400/20'}`}>
                            {activeProblem?.difficulty || 'Easy'}
                          </span>
                          
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase text-sky-700 bg-sky-100 border border-sky-200 dark:text-sky-400 dark:bg-sky-400/10 dark:border-sky-400/20 flex items-center gap-1.5">
                            <Award size={12} /> {availablePoints} Pts
                          </span>

                          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase text-rose-700 bg-rose-100 border border-rose-200 dark:text-rose-400 dark:bg-rose-400/10 dark:border-rose-400/20">
                            -{displayPenalty} Pts / Wrong
                          </span>

                          {activeProblem?.tags?.map((t: string) => <span key={t} className="px-3 py-1 bg-white border border-blue-100 text-slate-600 dark:bg-white/5 dark:border-white/10 dark:text-zinc-400 rounded-full text-[11px] font-medium tracking-wide shadow-sm dark:shadow-none">{t}</span>)}
                       </div>
                       
                       <div className="markdown-body text-[15px] md:text-base leading-relaxed text-slate-700 dark:text-zinc-300">{renderMarkdown(problemDesc)}</div>

                       {inputFmt && (
                          <div className="mt-8">
                             <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 mb-3 flex items-center gap-2"><div className="w-1 h-4 bg-sky-500 rounded-full"></div>Input Format</h2>
                             <div className="text-slate-700 dark:text-zinc-300 text-[14px] leading-relaxed bg-white dark:bg-white/[0.02] p-4 rounded-xl border border-blue-100 dark:border-white/5 shadow-sm dark:shadow-none">{renderMarkdown(inputFmt)}</div>
                          </div>
                       )}
                       {outputFmt && (
                          <div className="mt-8">
                             <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 mb-3 flex items-center gap-2"><div className="w-1 h-4 bg-sky-500 rounded-full"></div>Output Format</h2>
                             <div className="text-slate-700 dark:text-zinc-300 text-[14px] leading-relaxed bg-white dark:bg-white/[0.02] p-4 rounded-xl border border-blue-100 dark:border-white/5 shadow-sm dark:shadow-none">{renderMarkdown(outputFmt)}</div>
                          </div>
                       )}
                       {constr && (
                          <div className="mt-8">
                             <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 mb-3 flex items-center gap-2"><div className="w-1 h-4 bg-amber-500 rounded-full"></div>Constraints</h2>
                             <div className="text-slate-700 dark:text-zinc-300 text-[14px] leading-relaxed bg-amber-50 dark:bg-amber-500/5 p-4 rounded-xl border border-amber-200 dark:border-amber-500/10 shadow-sm dark:shadow-none">{renderMarkdown(constr)}</div>
                          </div>
                       )}

                       <div className="mt-12 space-y-6">
                          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 border-b border-blue-200 dark:border-white/10 pb-3">Examples</h2>
                          {testCases.filter(tc => tc.is_public === true || tc.is_public === 'true' || tc.isPublic).map((tc, i) => (
                            <div key={i} className="flex flex-col gap-3">
                               <div className="font-bold text-slate-800 dark:text-zinc-200 text-[15px]">Example {i + 1}:</div>
                               <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 font-mono text-[13px] border border-blue-200 dark:border-white/10 shadow-md dark:shadow-lg leading-relaxed relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 dark:bg-zinc-800"></div>
                                  
                                  {(tc.image_url || tc.imageUrl) && (
                                     <div className="mb-5 flex flex-col">
                                        <img 
                                          src={tc.image_url || tc.imageUrl} 
                                          alt={`Example ${i + 1} Visual Reference`} 
                                          className="max-w-full md:max-w-[80%] rounded-lg border border-white/10 object-contain bg-black/50" 
                                        />
                                     </div>
                                  )}

                                  <div className="mb-5 flex flex-col">
                                     <span className="text-slate-500 dark:text-zinc-500 select-none font-sans text-[11px] font-bold uppercase tracking-wider mb-2">Input</span>
                                     <pre className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap font-mono leading-normal bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-blue-100 dark:border-white/5 shadow-inner dark:shadow-none">{tc.display_input}</pre>
                                  </div>
                                  
                                  <div className="mb-3 flex flex-col">
                                     <span className="text-slate-500 dark:text-zinc-500 select-none font-sans text-[11px] font-bold uppercase tracking-wider mb-2">Output</span>
                                     <pre className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap font-mono leading-normal bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-blue-100 dark:border-white/5 shadow-inner dark:shadow-none">{tc.expected_output}</pre>
                                  </div>
                                  
                                  {tc.explanation && (
                                     <div className="flex flex-col gap-2 mt-5 pt-5 border-t border-blue-100 dark:border-white/5 font-sans">
                                        <span className="text-slate-500 dark:text-zinc-500 select-none text-[11px] font-bold uppercase tracking-wider">Explanation</span>
                                        <div className="text-slate-600 dark:text-zinc-400 text-[14px] leading-relaxed">{renderMarkdown(tc.explanation, true)}</div>
                                     </div>
                                  )}
                               </div>
                            </div>
                          ))}
                       </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="sub-tab" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }} transition={{ duration: 0.15 }}
                      className="w-full space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-blue-100 dark:border-white/10 pb-3">
                         <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Historical Submissions</h2>
                         <span className="text-xs bg-white dark:bg-white/5 px-2.5 py-1 border border-blue-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 rounded-md font-mono shadow-sm dark:shadow-none">{userSubmissions.length} Total</span>
                      </div>

                      {userSubmissions.length === 0 ? (
                         <div className="py-16 text-center text-slate-500 dark:text-zinc-500 font-medium bg-white/50 dark:bg-white/[0.01] border border-dashed border-blue-200 dark:border-white/5 rounded-xl">
                            No processing records discovered for current account context.
                         </div>
                      ) : (
                         <div className="flex flex-col gap-2.5">
                             {userSubmissions.map((sub, idx) => {
                              const isPending = sub.isPending || sub.verdict === 'Evaluating...';
                              const isAccepted = sub.passed === true || sub.verdict === 'Accepted' || (sub.score_awarded && sub.score_awarded > 0);
                              
                              const earlierAccepted = userSubmissions.slice(idx + 1).some(s => s.passed === true || s.verdict === 'Accepted' || (s.score_awarded && s.score_awarded > 0));
                              
                              const displayPoints = earlierAccepted 
                                 ? 'Not applicable' 
                                 : (isPending ? '---' : (sub.score_awarded > 0 || sub.points > 0) ? `+${sub.score_awarded || sub.points}` : (sub.score_awarded < 0 || sub.points < 0 ? `${sub.score_awarded || sub.points}` : `0`));
                              
                              const displayPointsColor = earlierAccepted 
                                 ? 'text-slate-400 dark:text-zinc-500 text-xs' 
                                 : (isPending ? 'text-sky-400/50' : isAccepted ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-500');

                              return (
                                 <div key={sub.id || idx} className={`bg-white dark:bg-[#151515] border ${isPending ? 'border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'border-blue-100 dark:border-white/5 hover:border-blue-300 dark:hover:border-white/10'} rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all shadow-sm dark:shadow-none`}>
                                    <div className="flex items-center gap-3">
                                       {isPending ? (
                                           <Loader2 size={16} className="text-sky-500 animate-spin" />
                                       ) : (
                                           <div className={`w-2.5 h-2.5 rounded-full ${isAccepted ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'}`} />
                                       )}
                                       <div className="flex flex-col">
                                          <span className={`font-bold font-mono text-sm ${isPending ? 'text-sky-600 dark:text-sky-400' : isAccepted ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                             {sub.verdict}
                                          </span>
                                          <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">
                                             {isPending ? 'Processing in execution environment...' : (sub.time_taken_seconds ? `Solved in ${Math.floor(sub.time_taken_seconds / 60)}m` : 'Practiced runtime environment')} • {sub.language_used || sub.language || 'C++'}
                                          </span>
                                       </div>
                                    </div>
                                    <div className="flex gap-4 sm:gap-6 self-stretch sm:self-auto justify-between border-t sm:border-transparent border-blue-50 dark:border-white/5 pt-2 sm:pt-0">
                                       <div className="text-right">
                                          <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-600">Points</span>
                                          <span className={`font-mono font-black text-sm ${displayPointsColor}`}>
                                             {displayPoints}
                                          </span>
                                       </div>
                                       <div className="text-right">
                                          <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-600">Timestamp</span>
                                          <span className="text-slate-500 dark:text-zinc-400 text-xs font-mono">{sub.created_at ? new Date(sub.created_at).toLocaleTimeString() : new Date(sub.time).toLocaleTimeString()}</span>
                                       </div>
                                    </div>
                                 </div>
                              );
                            })}
                         </div>
                      )}
                    </motion.div>
                  )}
                 </AnimatePresence>
               </div>
            </Panel>

            <PanelResizeHandle className="w-full h-2 md:w-2 md:h-full bg-sky-100 dark:bg-[#121212] hover:bg-sky-200 dark:hover:bg-sky-500/20 transition-colors cursor-row-resize md:cursor-col-resize flex items-center justify-center shrink-0 relative z-20">
               <div className="w-8 h-1 md:h-12 md:w-1 bg-blue-200 dark:bg-white/10 rounded-full group-hover:bg-sky-400 dark:group-hover:bg-sky-500/50 transition-colors"></div>
            </PanelResizeHandle>

            <Panel minSize={20} className="flex flex-col bg-sky-50 dark:bg-[#121212] relative z-10">
               <PanelGroup direction="vertical">
                 <Panel defaultSize={65} minSize={20} className="flex flex-col">
                    <div className="h-10 bg-white dark:bg-[#1a1a1a] border-b border-blue-100 dark:border-white/5 flex items-center justify-between px-3 shrink-0 relative z-30">
                       <select value={language} onChange={handleLanguageChange} className="bg-slate-50 dark:bg-white/5 border border-blue-100 dark:border-white/5 text-slate-700 dark:text-zinc-300 text-[12px] font-medium outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors shadow-sm">
                          <option value="c++">C++</option>
                          <option value="python">Python 3</option>
                          <option value="java">Java</option>
                       </select>

                       <div className="flex items-center gap-1.5">
                          <button onClick={handleFormatCode} title="Format Code" className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-all">
                             <Wand2 size={14} />
                          </button>
                          <button onClick={handleResetRequest} title="Reset Editor" className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all">
                             <RotateCcw size={14} />
                          </button>
                          <div className="w-px h-4 bg-blue-100 dark:bg-white/10 mx-1"></div>
                          <button 
                            onClick={() => setShowEditorSettings(!showEditorSettings)} 
                            title="Editor Settings" 
                            className={`p-1.5 rounded-md transition-all ${showEditorSettings ? 'text-sky-600 bg-sky-100 dark:text-sky-400 dark:bg-sky-500/10' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                          >
                             <Settings size={14} />
                          </button>
                       </div>

                       <AnimatePresence>                           {showEditorSettings && (
                            <motion.div 
                               initial={{ opacity: 0, y: -5 }} 
                               animate={{ opacity: 1, y: 0 }} 
                               exit={{ opacity: 0, y: -5 }} 
                               className="absolute top-12 right-3 w-64 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-white/10 rounded-xl shadow-2xl p-5 flex flex-col gap-5 z-50 backdrop-blur-xl"
                            >
                                <div className="flex flex-col gap-2">
                                   <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Font Family</label>
                                   <select
                                     value={editorSettings.fontFamily}
                                     onChange={(e) => setEditorSettings({...editorSettings, fontFamily: e.target.value})}
                                     className="bg-slate-50 dark:bg-white/5 border border-blue-100 dark:border-white/10 rounded-lg p-2 text-[12px] text-slate-800 dark:text-zinc-300 outline-none focus:border-sky-500/50 transition-colors"
                                   >
                                     <option value="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">System Mono</option>
                                     <option value="'Fira Code', monospace">Fira Code</option>
                                     <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                                     <option value="'Source Code Pro', monospace">Source Code Pro</option>
                                   </select>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                   <div className="flex justify-between items-center">
                                      <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Font Size</label>
                                      <span className="text-[11px] font-mono text-sky-600 bg-sky-100 dark:text-sky-400 dark:bg-sky-400/10 px-2 py-0.5 rounded">{editorSettings.fontSize}px</span>
                                   </div>
                                   <input
                                     type="range" min="10" max="24"
                                     value={editorSettings.fontSize}
                                     onChange={(e) => setEditorSettings({...editorSettings, fontSize: parseInt(e.target.value)})}
                                     className="accent-sky-500 mt-1"
                                   />
                                </div>
                                
                                <div className="h-px w-full bg-blue-100 dark:bg-white/5 my-1"></div>

                                <div className="flex items-center justify-between">
                                   <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Word Wrap</label>
                                   <button
                                     onClick={() => setEditorSettings({...editorSettings, wordWrap: !editorSettings.wordWrap})}
                                     className={`w-9 h-5 rounded-full relative transition-colors ${editorSettings.wordWrap ? 'bg-sky-500' : 'bg-slate-300 dark:bg-zinc-700'}`}
                                   >
                                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${editorSettings.wordWrap ? 'left-5' : 'left-1'}`}></div>
                                   </button>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                   <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Auto Suggestions</label>
                                   <button
                                     onClick={() => setEditorSettings({...editorSettings, suggestions: !editorSettings.suggestions})}
                                     className={`w-9 h-5 rounded-full relative transition-colors ${editorSettings.suggestions ? 'bg-sky-500' : 'bg-slate-300 dark:bg-zinc-700'}`}
                                   >
                                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${editorSettings.suggestions ? 'left-5' : 'left-1'}`}></div>
                                   </button>
                                </div>
                            </motion.div>
                          )}
                       </AnimatePresence>
                    </div>

                    <div className="flex-1 bg-white dark:bg-[#121212] relative">
                       <Editor
                         height="100%"
                         theme={document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'}
                         language={language === 'c++' ? 'cpp' : language}
                         value={code}
                         onChange={(v) => setCode(v || '')}
                         onMount={handleEditorDidMount}
                         options={{ 
                            minimap: { enabled: false }, 
                            fontSize: editorSettings.fontSize, 
                            fontFamily: editorSettings.fontFamily, 
                            wordWrap: editorSettings.wordWrap ? 'on' : 'off',
                            quickSuggestions: editorSettings.suggestions,
                            suggestOnTriggerCharacters: editorSettings.suggestions,
                            padding: { top: 20, bottom: 20 }, 
                            smoothScrolling: true, 
                            cursorBlinking: "smooth", 
                            automaticLayout: true, 
                            lineNumbersMinChars: 3, 
                            lineDecorationsWidth: 10,
                            fontLigatures: true
                         }}
                       />
                    </div>
                 </Panel>
                 
                 <PanelResizeHandle className="h-2 bg-sky-100 dark:bg-[#121212] hover:bg-sky-200 dark:hover:bg-sky-500/20 transition-colors cursor-row-resize flex items-center justify-center shrink-0 relative z-20 border-y border-blue-200 dark:border-white/5">
                    <div className="w-12 h-1 bg-blue-200 dark:bg-white/10 rounded-full group-hover:bg-sky-400 dark:group-hover:bg-sky-500/50 transition-colors"></div>
                 </PanelResizeHandle>
                 
                 <Panel className="bg-white dark:bg-[#1a1a1a] flex flex-col" minSize={20}>
                    <div className="h-10 border-b border-blue-100 dark:border-white/5 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-[#1a1a1a]">
                       <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                             <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                          </div>
                          <span className="text-[12px] font-semibold text-slate-500 dark:text-zinc-400 flex gap-2 items-center tracking-wide">Terminal</span>
                       </div>
                       {submissionPhase === 'idle' && logs.length > 0 && (
                          <button onClick={() => setLogs([])} className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">Clear</button>
                       )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                       {submissionPhase === 'evaluating' ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#1a1a1a]">
                             <div className="relative">
                               <div className="w-16 h-16 border-4 border-sky-500/20 rounded-full"></div>
                               <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                             </div>
                             <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-zinc-100">Evaluating Solution...</h3>
                             <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Running complete test suite on balanced core engine matrix</p>
                          </div>
                       ) : submissionPhase === 'complete' && submissionResult ? (
                          <SubmissionDashboard 
                             result={submissionResult} 
                             onReset={() => setSubmissionPhase('idle')}
                             onShowLogs={() => setSubmissionPhase('idle')} 
                             onNextProblem={() => {
                                 setActiveProblemIndex(prev => prev + 1);
                                 setLogs([]);
                                 setSubmissionPhase('idle');
                             }}
                             hasNextProblem={activeProblemIndex < problems.length - 1}
                          />
                       ) : (
                          <div className="p-4 md:p-6 min-h-full">
                             {logs.length > 0 ? (
                                 <div className="flex flex-col">
                                     {logs.map((l, i) => renderTerminalLog(l, i))}
                                 </div>
                             ) : (
                                 <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-slate-400 dark:text-zinc-600 mt-10">
                                     <TerminalIcon size={32} className="opacity-20" />
                                     <div className="text-[13px] font-medium">Run your code to see results here</div>
                                 </div>
                             )}
                          </div>
                       )}
                    </div>
                 </Panel>
               </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Source+Code+Pro:wght@400;500;600&display=swap');
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}