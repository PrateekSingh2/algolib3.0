import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Play, Send, ChevronDown, Lock, Clock, CheckCircle2, Terminal, ArrowLeft, Loader2, X, Trash2, Code2, AlertTriangle, Target, Settings, RotateCcw, Wand2 } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

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

// --- MARKDOWN PARSER ---
const renderMarkdown = (text: string, isSmall = false) => {
  if (!text) return null;
  
  let cleanText = text.replace(/\\n/g, '\n');

  return cleanText.split('\n').map((line, i) => {
    let isHeader = false;
    let headerClass = "";
    let content = line;

    if (line.startsWith('# ')) { isHeader = true; headerClass = `font-semibold text-zinc-100 mt-6 mb-3 ${isSmall ? 'text-lg' : 'text-xl'}`; content = line.substring(2); }
    else if (line.startsWith('## ')) { isHeader = true; headerClass = `font-semibold text-zinc-200 mt-5 mb-2 ${isSmall ? 'text-base' : 'text-lg'}`; content = line.substring(3); }
    else if (line.startsWith('### ')) { isHeader = true; headerClass = `font-semibold text-zinc-300 mt-4 mb-2 ${isSmall ? 'text-sm' : 'text-base'}`; content = line.substring(4); }
    
    if (content.trim() === '') return <div key={i} className={isSmall ? "h-2" : "h-4"}></div>;

    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
    const formattedContent = parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="text-zinc-200 font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className={`bg-white/5 border border-white/10 text-zinc-200 px-1.5 py-0.5 rounded font-mono ${isSmall ? 'text-[11px]' : 'text-[13px]'}`}>{part.slice(1, -1)}</code>;
      }
      return part;
    });

    if (isHeader) return <div key={i} className={headerClass}>{formattedContent}</div>;
    return <p key={i} className={`mb-2 leading-relaxed ${isSmall ? 'text-[13px] md:text-sm text-zinc-400' : 'text-zinc-300 text-[15px]'}`}>{formattedContent}</p>;
  });
};

// --- STRUCTURED TERMINAL LOG SYSTEM ---
type LogEntry = {
  type: 'system' | 'case_header' | 'success' | 'error' | 'expected' | 'actual_pass' | 'actual_fail' | 'summary_pass' | 'summary_fail' | 'points' | 'penalty' | 'time';
  content: string;
};

const renderTerminalLog = (log: LogEntry, i: number) => {
  switch (log.type) {
    case 'system':
      return <div key={i} className="text-zinc-400 font-semibold text-[13px] mb-4 pb-2 border-b border-white/5">{log.content}</div>;
    case 'case_header':
      return <div key={i} className="text-zinc-300 font-semibold mt-4 mb-2 flex items-center gap-2 text-[14px]">Test {log.content}</div>;
    case 'success':
      return <div key={i} className="text-emerald-500 font-medium flex items-center gap-2 my-1 text-[13px]"><CheckCircle2 size={16}/> {log.content}</div>;
    case 'error':
      return (
        <div key={i} className="text-rose-500 font-medium flex items-start gap-2 my-2 bg-rose-500/5 p-3 rounded-md border border-rose-500/10">
          <X size={16} className="mt-0.5 shrink-0"/> 
          <pre className="font-mono whitespace-pre-wrap text-[13px]">{log.content}</pre>
        </div>
      );
    case 'expected':
      return (
        <div key={i} className="mt-2 mb-1">
          <div className="text-zinc-500 font-semibold mb-1 text-[11px] uppercase">Expected Output</div>
          <div className="bg-zinc-900 px-3 py-2 rounded-md border border-white/5">
            <pre className="font-mono whitespace-pre-wrap text-[13px] text-zinc-300">{log.content || " "}</pre>
          </div>
        </div>
      );
    case 'actual_pass':
    case 'actual_fail':
      const isPass = log.type === 'actual_pass';
      return (
        <div key={i} className="mb-4">
          <div className="text-zinc-500 font-semibold mb-1 text-[11px] uppercase">Actual Output</div>
          <div className={`px-3 py-2 rounded-md border ${isPass ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
            <pre className={`font-mono whitespace-pre-wrap text-[13px] ${isPass ? 'text-emerald-200' : 'text-rose-200'}`}>{log.content || " "}</pre>
          </div>
        </div>
      );
    case 'summary_pass':
      return <div key={i} className="text-emerald-500 font-bold text-[16px] mt-6 mb-2">Accepted</div>;
    case 'summary_fail':
      return <div key={i} className="text-rose-500 font-bold text-[16px] mt-6 mb-2">Wrong Answer</div>;
    case 'points':
    case 'penalty':
    case 'time':
      return <div key={i} className="text-zinc-400 text-[13px] mb-1">{log.content}</div>;
    default:
      return <div key={i} className="text-zinc-400 font-mono text-[13px]">{log.content}</div>;
  }
};

export default function ContestPanel({ user, onLoginRequest }: { user: any, onLoginRequest: any }) {
  const { contestId } = useParams();
  
  const editorRef = useRef<any>(null); 
  const monacoRef = useRef<any>(null);
  
  const [contest, setContest] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState('c++'); 
  const [code, setCode] = useState(userTemplates['c++']);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runningCase, setRunningCase] = useState<number | null>(null); 
  const [isMobile, setIsMobile] = useState(false);
  
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [contestStatus, setContestStatus] = useState<'upcoming' | 'active' | 'ended'>('upcoming');
  const [lastRunTime, setLastRunTime] = useState<number>(0);
  
  const [wrongAttempts, setWrongAttempts] = useState<Record<string, number>>({});
  
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
        if (user && contestId) {
            try {
              await supabase.rpc('log_contest_warning', {
                p_firebase_uid: user.uid || user.id,
                p_contest_id: contestId,
                p_email: user.email || '',
                p_display_name: user.displayName || 'Unknown'
              });
            } catch (e) {}
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [contestStatus, user, contestId]);

  useEffect(() => {
    const fetchMatrix = async () => {
      if (!contestId) { setLoading(false); return; }
      const { data: cData } = await supabase.from('contests').select('*').eq('id', contestId).single();
      if (cData) setContest(cData);
      const { data: pData } = await supabase.from('problems').select('*').eq('contest_id', contestId).order('id', { ascending: true });
      if (pData && pData.length > 0) setProblems(pData);
      else setProblems([FALLBACK_PROBLEM]);
      setLoading(false);
    };
    fetchMatrix();
  }, [contestId]);

  useEffect(() => {
    const fetchTestCases = async () => {
      if (problems.length === 0) return;
      const currentProblem = problems[activeProblemIndex];
      if (currentProblem.id === 'fallback-id') { setTestCases(FALLBACK_TEST_CASES); return; }
      const { data: tcData } = await supabase.from('test_cases').select('*').eq('problem_id', currentProblem.id);
      if (tcData && tcData.length > 0) setTestCases(tcData);
      else setTestCases(FALLBACK_TEST_CASES);
    };
    fetchTestCases();
  }, [activeProblemIndex, problems]);

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
  };

  // --- EDITOR CONTROL FUNCTIONS ---
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const handleFormatCode = () => {
    if (!editorRef.current || !monacoRef.current) return;
    
    // Attempt default format (Works well for languages with built in LSPs)
    const formatAction = editorRef.current.getAction('editor.action.formatDocument');
    if (formatAction) {
        formatAction.run();
    }

    // CUSTOM C++/JAVA FORMATTER FALLBACK
    // Since Monaco doesn't format C++ out of the box, we manually fix the indentation here!
    if (language === 'c++' || language === 'java') {
        const model = editorRef.current.getModel();
        const currentCode = model.getValue();
        let indentLevel = 0;
        
        const lines = currentCode.split('\n');
        const formatted = lines.map(line => {
            let trimmed = line.trim();
            
            // If line starts with a closing brace, outdent before processing
            if (trimmed.startsWith('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            const result = trimmed ? '    '.repeat(indentLevel) + trimmed : '';
            
            // If line ends with an opening brace, indent next line
            if (trimmed.endsWith('{')) {
                indentLevel++;
            }
            
            return result;
        }).join('\n');

        // Apply edits cleanly without breaking the undo history
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

  const executeCodeCustom = async (lang: string, source: string, stdin: string) => {
    const ENGINE_API_URL = "https://rajawatprateek-algolib-engine.hf.space/execute";
    const STATUS_API_URL = "https://rajawatprateek-algolib-engine.hf.space/status";
    
    try {
        const res = await fetch(ENGINE_API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: lang, code: source, input: stdin })
        });
        
        if (!res.ok) throw new Error(`Engine Offline or Overloaded: HTTP ${res.status}`);
        const { jobId } = await res.json();

        while (true) {
            await new Promise(resolve => setTimeout(resolve, 800)); 
            const statusRes = await fetch(`${STATUS_API_URL}/${jobId}`);
            if (!statusRes.ok) continue; 
            const statusData = await statusRes.json();

            if (statusData.status === 'success' || statusData.status === 'error') {
                let cleanOutput = (statusData.output || '').trim();
                if (lang === 'java') {
                    cleanOutput = cleanOutput.replace(/Main_[a-fA-F0-9]+/g, 'Main');
                }
                return { output: cleanOutput, statusCode: statusData.statusCode };
            }
        }
    } catch (e: any) { 
        throw new Error(`Connection failed: ${e.message}`); 
    }
  };

  const handleEvaluation = async (isSubmit = false) => {
    const now = Date.now();
    if (now - lastRunTime < 3000) return;
    
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
    
    setIsRunning(true);
    setLogs([]); 
    
    let currentLogs: LogEntry[] = [];
    const addLog = (type: LogEntry['type'], content: string) => {
        currentLogs = [...currentLogs, { type, content }];
        setLogs(currentLogs);
    };

    addLog('system', isSubmit ? 'Submitting code...' : 'Compiling and running...');
    
    let casesToRun = isSubmit ? testCases : testCases.filter(tc => tc.is_public === true || tc.is_public === 'true' || tc.isPublic === true || tc.isPublic === 'true');
    if (casesToRun.length === 0 && testCases.length > 0) casesToRun = [testCases[0]];
    
    let allPassed = true;
    let passedCount = 0;
    
    for (let i = 0; i < casesToRun.length; i++) {
      const tc = casesToRun[i];
      addLog('case_header', `Case ${i + 1}`);
      setRunningCase(i + 1); 
      
      const rawIn = String(tc.raw_input || tc.rawInput || '').replace(/\\n/g, '\n');
      const expOut = String(tc.expected_output || tc.expected || '').trim();
      const isPub = tc.is_public === true || tc.is_public === 'true';
      const hasMultiple = tc.has_multiple_answers === true || tc.has_multiple_answers === 'true';
      
      try {
        const { output, statusCode } = await executeCodeCustom(language, code, rawIn);
        const normalizedActual = output.replace(/\s+/g, '');
        
        let isCorrect = false;
        
        if (hasMultiple) {
          const expectedLines = expOut.split('\n').map(l => l.trim()).filter(Boolean);
          const actualLines = output.split('\n').map(l => l.trim()).filter(Boolean);

          if (expectedLines.length === actualLines.length && actualLines.length > 0) {
            isCorrect = expectedLines.every((expLine, index) => {
              const actLine = actualLines[index].replace(/\s+/g, ''); 
              const possibleAnswers = expLine.split('|||').map(ans => ans.replace(/\s+/g, ''));
              return possibleAnswers.includes(actLine);
            });
          } else {
            isCorrect = false; 
          }
        } else {
          const normalizedExpected = expOut.replace(/\s+/g, '');
          isCorrect = normalizedActual === normalizedExpected && normalizedExpected !== '';
        }

        if (statusCode !== 200 && statusCode !== undefined) {
          addLog('error', `Runtime Error:\n${output}`);
          allPassed = false;
        } else if (isCorrect) {
          addLog('success', 'Accepted');
          if (isPub) {
             addLog('actual_pass', output);
          }
          passedCount++;
        } else {
          addLog('error', 'Wrong Answer');
          if (isPub) {
             addLog('expected', expOut);
             addLog('actual_fail', output);
          }
          allPassed = false;
        }
      } catch (err: any) { 
        addLog('error', `Internal Error:\n${err.message}`);
        allPassed = false; 
      }
      
      if (!allPassed) {
        setRunningCase(null);
        break;
      }
      await new Promise(r => setTimeout(r, 500)); 
    }
    
    setRunningCase(null);

    if (isSubmit) {
      const currentProblem = problems[activeProblemIndex];
      const diffStr = (currentProblem?.difficulty || 'easy').toLowerCase();
      const defaultPts = diffStr === 'hard' ? 300 : diffStr === 'medium' ? 200 : 100;
      const defaultPenalty = diffStr === 'hard' ? 20 : diffStr === 'medium' ? 10 : 5;
      
      const currentWrongCount = wrongAttempts[currentProblem.id] || 0;

      if (!allPassed) {
        setWrongAttempts(prev => ({
          ...prev,
          [currentProblem.id]: currentWrongCount + 1
        }));
        addLog('summary_fail', `Failed (${passedCount}/${casesToRun.length} test cases)`);
      } else {
        addLog('summary_pass', `Accepted (${passedCount}/${casesToRun.length} test cases)`);
        if (user) {
          try {
              const pointsEarned = Math.max(0, defaultPts - (currentWrongCount * defaultPenalty));
              
              let timeTakenSeconds = 0;
              if (contest?.start_time) {
                  const startTimeMs = new Date(contest.start_time).getTime();
                  const nowMs = Date.now();
                  if (nowMs > startTimeMs) {
                      timeTakenSeconds = Math.floor((nowMs - startTimeMs) / 1000);
                  }
              }

              await supabase.from('leaderboard').insert([{ 
                  user_uid: user.uid || user.id, 
                  display_name: user.displayName || user.name || 'User', 
                  problem_id: currentProblem.id, 
                  score: pointsEarned, 
                  time_taken_seconds: timeTakenSeconds, 
                  language_used: language
              }]);
              
              addLog('points', `Points Earned: ${pointsEarned}`);
              addLog('time', `Runtime: ${formatTime(timeTakenSeconds)}`);
          } catch (e) {}
        }
      }
    }
    setIsRunning(false);
  };

  if (loading) return <div className="h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;

  const activeProblem = problems[activeProblemIndex];
  const activeDifficultyStr = (activeProblem?.difficulty || 'easy').toLowerCase();
  const defaultPoints = activeDifficultyStr === 'hard' ? 300 : activeDifficultyStr === 'medium' ? 200 : 100;
  const defaultPenalty = activeDifficultyStr === 'hard' ? 20 : activeDifficultyStr === 'medium' ? 10 : 5;
  const displayPoints = activeProblem?.points || defaultPoints;
  const displayPenalty = activeProblem?.penalty || defaultPenalty;
  
  const currentWrongCount = wrongAttempts[activeProblem?.id] || 0;
  const availablePoints = Math.max(0, displayPoints - (currentWrongCount * displayPenalty));

  // --- JSON STRING LEAK PARSER ---
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
    <div className="h-screen w-screen bg-[#0a0a0a] text-zinc-300 font-sans flex flex-col overflow-hidden relative">
      <AnimatePresence>
        {/* RESET MODAL */}
        {showResetModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#121212] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                <RotateCcw size={48} className="text-rose-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-zinc-100 mb-2">Reset Editor?</h2>
                <p className="text-zinc-400 mb-6 text-sm">Are you sure you want to reset your code? All current changes will be permanently lost.</p>
                <div className="flex gap-4">
                   <button onClick={() => setShowResetModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-200 font-bold rounded-xl transition-colors">Cancel</button>
                   <button onClick={confirmResetCode} className="flex-1 py-3 bg-rose-600/90 hover:bg-rose-500 text-white font-bold rounded-xl transition-colors">Yes, Reset</button>
                </div>
             </motion.div>
          </motion.div>
        )}

        {/* CONTEST ENDED POPUP */}
        {showEndedPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                <Clock size={48} className="text-rose-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Contest Ended</h2>
                <p className="text-zinc-400 mb-6 text-sm">The contest time has expired. Submissions for points are now disabled, but you can still run your code for practice.</p>
                <button onClick={() => setShowEndedPopup(false)} className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-900 font-bold rounded-xl transition-colors">Acknowledge</button>
             </motion.div>
          </motion.div>
        )}

        {/* CHEAT WARNING POPUP */}
        {showCheatWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative">
                <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Warning</h2>
                <p className="text-zinc-400 mb-6 text-sm">Activity tracked: You switched tabs. Please do not navigate away during an active contest.</p>
                <button onClick={() => setShowCheatWarning(false)} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors">I Understand</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col w-full h-full relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 bg-[#121212] shrink-0 z-20">
          <div className="flex items-center justify-between w-full p-3 md:px-4 md:h-12 md:w-auto">
            <div className="flex items-center gap-3 md:gap-4">
              <Link to="/contests" className="text-zinc-400 hover:text-white transition-colors"><ArrowLeft size={18} /></Link>
              <div className="h-5 w-px bg-white/10 hidden md:block mx-1"></div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${contestStatus === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <span className="text-[13px] md:text-sm font-semibold text-zinc-100 tracking-wide truncate max-w-[120px] sm:max-w-none">{contest?.title || 'Contest Arena'}</span>
              </div>
            </div>

            {/* MOBILE ONLY: Top right action buttons */}
            <div className="flex items-center gap-1.5 md:hidden">
               <div className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-md px-1.5 py-1 font-mono text-[11px] font-medium text-zinc-300">
                  <Clock size={12} className={`${contestStatus === 'active' && timeRemaining < 300 ? 'text-rose-500 animate-pulse' : 'text-zinc-400'}`} />
                  <span>{contestStatus === 'ended' ? "Ended" : formatTime(timeRemaining)}</span>
               </div>
               <button onClick={() => handleEvaluation(false)} disabled={isRunning} className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-200 rounded-md border border-white/5 disabled:opacity-30 transition-all">
                 <Play size={14} className="text-zinc-400" />
               </button>
               <button 
                 onClick={() => handleEvaluation(true)} 
                 disabled={isRunning || contestStatus === 'ended'} 
                 className={`p-1.5 rounded-md transition-all ${contestStatus === 'ended' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-30'}`}
               >
                 <Send size={14} />
               </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 pb-3 pt-1 md:p-0 overflow-x-auto no-scrollbar md:mx-4 border-t border-white/5 md:border-none flex-1">
              {problems.map((p, idx) => (
                  <button 
                    key={p.id || idx} 
                    onClick={() => { setActiveProblemIndex(idx); setLogs([]); }}
                    className={`whitespace-nowrap px-3 py-1 text-[13px] rounded-md transition-all ${activeProblemIndex === idx ? 'bg-white/10 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
                  >
                    {idx + 1}. {p.title || `Problem ${String.fromCharCode(65 + idx)}`}
                  </button>
              ))}
          </div>

          <div className="hidden md:flex items-center gap-3 px-4">
             <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-md px-3 py-1.5 font-mono text-sm font-medium text-zinc-200">
                <Clock size={14} className={`${contestStatus === 'active' && timeRemaining < 300 ? 'text-rose-500 animate-pulse' : 'text-zinc-500'}`} />
                <span>{contestStatus === 'ended' ? "00:00:00" : formatTime(timeRemaining)}</span>
             </div>
             <div className="flex gap-2">
                <button onClick={() => handleEvaluation(false)} disabled={isRunning} className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-200 rounded-md text-[13px] font-medium border border-white/5 disabled:opacity-30 transition-all">
                  <Play size={12} className="text-zinc-400" /> Run
                </button>
                <button 
                  onClick={() => handleEvaluation(true)} 
                  disabled={isRunning || contestStatus === 'ended'} 
                  title={contestStatus === 'ended' ? "Submissions closed" : ""}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${contestStatus === 'ended' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-30'}`}
                >
                  <Send size={12} /> Submit
                </button>
             </div>
          </div>
        </div>
        
        <div className="bg-[#1a1a1a] border-b border-white/5 px-4 py-1.5 flex items-center justify-center gap-2 shrink-0">
          <Lock size={12} className="text-amber-500" />
          <span className="text-zinc-400 text-[11px] font-medium tracking-wide">
            Contest environment active. Do not navigate away from this page.
          </span>
        </div>

        <div className="flex-1 min-h-0">
          <PanelGroup direction={isMobile ? "vertical" : "horizontal"}>
            <Panel defaultSize={isMobile ? 40 : 45} minSize={20} maxSize={80} className="flex flex-col bg-[#121212] border-r border-white/5">
               <div className="flex border-b border-white/5 px-4 bg-[#121212] shrink-0 items-center h-10">
                  <div className="text-[12px] font-semibold text-zinc-200 tracking-wide">Description</div>
               </div>
               
               <div 
                 className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 pb-20 select-none"
                 onContextMenu={(e) => e.preventDefault()}
               >
                  <div className="w-full max-w-3xl mx-auto">
                     <h1 className="text-2xl font-bold text-zinc-100 mb-3 leading-tight">{activeProblem?.title}</h1>
                     <div className="flex flex-wrap items-center gap-2 mb-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${activeDifficultyStr === 'easy' ? 'text-emerald-400 bg-emerald-400/10' : activeDifficultyStr === 'medium' ? 'text-amber-400 bg-amber-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                          {activeProblem?.difficulty || 'Easy'}
                        </span>
                        
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-sky-400 bg-sky-400/10">
                          {availablePoints} Pts
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-rose-400 bg-rose-400/10">
                          -{displayPenalty} Pts / Wrong
                        </span>

                        {activeProblem?.tags?.map((t: string) => <span key={t} className="px-2 py-0.5 bg-white/5 text-zinc-400 rounded-full text-[11px] font-medium">{t}</span>)}
                     </div>
                     
                     <div className="markdown-body text-sm md:text-[15px]">{renderMarkdown(problemDesc)}</div>

                     {inputFmt && (
                        <div className="mt-6">
                           <h2 className="text-lg font-semibold text-zinc-200 mb-2">Input Format</h2>
                           <div className="text-zinc-300 text-[14px] leading-relaxed">{renderMarkdown(inputFmt)}</div>
                        </div>
                     )}
                     {outputFmt && (
                        <div className="mt-6">
                           <h2 className="text-lg font-semibold text-zinc-200 mb-2">Output Format</h2>
                           <div className="text-zinc-300 text-[14px] leading-relaxed">{renderMarkdown(outputFmt)}</div>
                        </div>
                     )}
                     {constr && (
                        <div className="mt-6">
                           <h2 className="text-lg font-semibold text-zinc-200 mb-2">Constraints</h2>
                           <div className="text-zinc-300 text-[14px] leading-relaxed">{renderMarkdown(constr)}</div>
                        </div>
                     )}

                     <div className="mt-10 space-y-6">
                        <h2 className="text-lg font-semibold text-zinc-200 border-b border-white/5 pb-2">Examples</h2>
                        {testCases.filter(tc => tc.is_public === true || tc.is_public === 'true' || tc.isPublic).map((tc, i) => (
                          <div key={i} className="flex flex-col gap-3">
                             <div className="font-semibold text-zinc-300 text-[14px]">Example {i + 1}:</div>
                             <div className="bg-[#1a1a1a] rounded-lg p-4 font-mono text-[13px] border border-white/5 leading-relaxed">
                                
                                <div className="mb-4 flex flex-col">
                                   <span className="text-zinc-500 select-none font-sans text-[11px] font-bold uppercase tracking-wider mb-1">Input</span>
                                   <pre className="text-zinc-300 whitespace-pre-wrap font-mono leading-normal">{tc.display_input}</pre>
                                </div>
                                
                                <div className="mb-2 flex flex-col">
                                   <span className="text-zinc-500 select-none font-sans text-[11px] font-bold uppercase tracking-wider mb-1">Output</span>
                                   <pre className="text-zinc-300 whitespace-pre-wrap font-mono leading-normal">{tc.expected_output}</pre>
                                </div>
                                
                                {tc.explanation && (
                                   <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-white/5 font-sans">
                                      <span className="text-zinc-500 select-none text-[11px] font-bold uppercase tracking-wider">Explanation</span>
                                      <div className="text-zinc-400 text-[13px]">{renderMarkdown(tc.explanation, true)}</div>
                                   </div>
                                )}
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </Panel>

            <PanelResizeHandle className="w-full h-2 md:w-1.5 md:h-full bg-transparent hover:bg-emerald-500/20 transition-colors cursor-row-resize md:cursor-col-resize flex items-center justify-center shrink-0 relative z-10">
               <div className="w-8 h-1 md:h-8 md:w-1 bg-white/10 rounded-full"></div>
            </PanelResizeHandle>

            <Panel minSize={20} className="flex flex-col bg-[#121212]">
               <PanelGroup direction="vertical">
                 <Panel defaultSize={70} minSize={20} className="flex flex-col">
                    <div className="h-10 bg-[#121212] border-b border-white/5 flex items-center justify-between px-2 shrink-0 relative z-30">
                       <select value={language} onChange={handleLanguageChange} className="bg-white/5 text-zinc-300 text-[12px] font-medium outline-none cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors">
                          <option value="c++">C++</option>
                          <option value="python">Python 3</option>
                          <option value="java">Java</option>
                       </select>

                       {/* Editor Controls */}
                       <div className="flex items-center gap-1">
                          <button onClick={handleFormatCode} title="Format Code" className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded transition-all">
                             <Wand2 size={14} />
                          </button>
                          <button onClick={handleResetRequest} title="Reset Editor" className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all">
                             <RotateCcw size={14} />
                          </button>
                          <button 
                            onClick={() => setShowEditorSettings(!showEditorSettings)} 
                            title="Editor Settings" 
                            className={`p-1.5 rounded transition-all ${showEditorSettings ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
                          >
                             <Settings size={14} />
                          </button>
                       </div>

                       {/* Editor Settings Dropdown */}
                       <AnimatePresence>
                          {showEditorSettings && (
                            <motion.div 
                               initial={{ opacity: 0, y: -5 }} 
                               animate={{ opacity: 1, y: 0 }} 
                               exit={{ opacity: 0, y: -5 }} 
                               className="absolute top-10 right-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl p-4 flex flex-col gap-4"
                            >
                                <div className="flex flex-col gap-1.5">
                                   <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Font Family</label>
                                   <select
                                     value={editorSettings.fontFamily}
                                     onChange={(e) => setEditorSettings({...editorSettings, fontFamily: e.target.value})}
                                     className="bg-white/5 border border-white/10 rounded p-1.5 text-[12px] text-zinc-300 outline-none"
                                   >
                                     <option value="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">System Mono</option>
                                     <option value="'Fira Code', monospace">Fira Code</option>
                                     <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                                     <option value="'Source Code Pro', monospace">Source Code Pro</option>
                                   </select>
                                </div>
                                
                                <div className="flex flex-col gap-1.5">
                                   <div className="flex justify-between items-center">
                                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Font Size</label>
                                      <span className="text-[11px] font-mono text-zinc-300">{editorSettings.fontSize}px</span>
                                   </div>
                                   <input
                                     type="range" min="10" max="24"
                                     value={editorSettings.fontSize}
                                     onChange={(e) => setEditorSettings({...editorSettings, fontSize: parseInt(e.target.value)})}
                                     className="accent-emerald-500"
                                   />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                   <label className="text-[12px] font-medium text-zinc-300">Word Wrap</label>
                                   <button
                                     onClick={() => setEditorSettings({...editorSettings, wordWrap: !editorSettings.wordWrap})}
                                     className={`w-8 h-4 rounded-full relative transition-colors ${editorSettings.wordWrap ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                   >
                                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${editorSettings.wordWrap ? 'left-4.5 right-0.5' : 'left-0.5'}`} style={{ left: editorSettings.wordWrap ? '18px' : '2px' }}></div>
                                   </button>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                   <label className="text-[12px] font-medium text-zinc-300">Auto Suggestions</label>
                                   <button
                                     onClick={() => setEditorSettings({...editorSettings, suggestions: !editorSettings.suggestions})}
                                     className={`w-8 h-4 rounded-full relative transition-colors ${editorSettings.suggestions ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                   >
                                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${editorSettings.suggestions ? 'left-4.5 right-0.5' : 'left-0.5'}`} style={{ left: editorSettings.suggestions ? '18px' : '2px' }}></div>
                                   </button>
                                </div>
                            </motion.div>
                          )}
                       </AnimatePresence>
                    </div>

                    <div className="flex-1 bg-[#0a0a0a] relative">
                       <Editor
                         height="100%"
                         theme="vs-dark"
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
                            padding: { top: 16, bottom: 16 }, 
                            smoothScrolling: true, 
                            cursorBlinking: "smooth", 
                            automaticLayout: true, 
                            lineNumbersMinChars: 3, 
                            lineDecorationsWidth: 10 
                         }}
                       />
                    </div>
                 </Panel>
                 
                 <PanelResizeHandle className="h-1.5 bg-[#0a0a0a] hover:bg-emerald-500/20 transition-colors cursor-row-resize flex items-center justify-center shrink-0 relative z-10 border-y border-white/5">
                    <div className="w-8 h-0.5 bg-white/10 rounded-full"></div>
                 </PanelResizeHandle>
                 
                 <Panel className="bg-[#121212] flex flex-col" minSize={10}>
                    <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 shrink-0 bg-[#121212]">
                       <span className="text-[12px] font-semibold text-zinc-300 flex gap-2 items-center"><Terminal size={14} className="text-zinc-500"/> Test Result</span>
                       {logs.length > 0 && <button onClick={() => setLogs([])} className="text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors">Clear</button>}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
                       {logs.length > 0 ? (
                           <div className="flex flex-col">
                               {logs.map((l, i) => renderTerminalLog(l, i))}
                               
                               {/* LOADER FOR CURRENT TEST CASE */}
                               {isRunning && runningCase !== null && (
                                  <div className="flex items-center gap-3 text-zinc-400 font-mono text-[13px] mt-2 mb-4 p-3 bg-white/5 rounded-md border border-white/5">
                                      <Loader2 size={16} className="animate-spin text-emerald-500" />
                                      Executing Case {runningCase}...
                                  </div>
                               )}
                           </div>
                       ) : (
                           <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-zinc-600">
                               <div className="text-[13px] font-medium">Run your code to see results here</div>
                           </div>
                       )}
                    </div>
                 </Panel>
               </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>
      
      {/* EXPLICIT CSS INJECTION TO LOAD THE DEVELOPER FONTS */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=JetBrains+Mono:wght@400;500&family=Source+Code+Pro:wght@400;500&display=swap');
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}