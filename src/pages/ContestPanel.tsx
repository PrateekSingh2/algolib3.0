import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Play, Send, ChevronDown, Lock, Clock, CheckCircle2, Terminal, ArrowLeft, Loader2, X, Trash2, Code2, AlertTriangle, Target } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { createClient } from '@supabase/supabase-js';
import Navbar from "@/components/Navbar";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

// --- PURE CODEFORCES TEMPLATES ---
const userTemplates: Record<string, string> = {
  'c++': `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}`,
  'python': `import sys\n\ndef main():\n    # Write your code here\n    pass\n\nif __name__ == '__main__':\n    main()`,
  'java': `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code here\n        \n    }\n}`
};

const FALLBACK_PROBLEM = {
  id: 'fallback-id', title: 'Two Sum', difficulty: 'Easy', tags: ['Array', 'Hash Table'], points: 100, penalty: 5,
  description: '# Two Sum\nGiven an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have **exactly one solution**.'
};

const FALLBACK_TEST_CASES = [
  { id: 1, display_input: 'nums = [2,7,11,15]\ntarget = 9', raw_input: '4\n2 7 11 15\n9', expected_output: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].', is_public: true }
];

// --- MARKDOWN PARSER (MIDNIGHT THEME) ---
const renderMarkdown = (text: string, isSmall = false) => {
  if (!text) return null;
  const cleanText = text.replace(/\\n/g, '\n');
  return cleanText.split('\n').map((line, i) => {
    let isHeader = false;
    let headerClass = "";
    let content = line;

    if (line.startsWith('# ')) { isHeader = true; headerClass = `font-bold text-emerald-400 mt-6 mb-3 tracking-tight ${isSmall ? 'text-lg' : 'text-2xl'}`; content = line.substring(2); }
    else if (line.startsWith('## ')) { isHeader = true; headerClass = `font-bold text-cyan-400 mt-5 mb-2 ${isSmall ? 'text-base' : 'text-xl'}`; content = line.substring(3); }
    else if (line.startsWith('### ')) { isHeader = true; headerClass = `font-bold text-sky-400 mt-4 mb-2 ${isSmall ? 'text-sm' : 'text-lg'}`; content = line.substring(4); }
    
    if (content.trim() === '') return <div key={i} className={isSmall ? "h-2" : "h-4"}></div>;

    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
    const formattedContent = parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="text-amber-400 font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className={`bg-zinc-800 border border-zinc-700 text-cyan-300 px-1.5 py-0.5 rounded font-mono ${isSmall ? 'text-[11px]' : 'text-[13px]'}`}>{part.slice(1, -1)}</code>;
      }
      return part;
    });

    if (isHeader) return <div key={i} className={headerClass}>{formattedContent}</div>;
    return <p key={i} className={`mb-2 leading-relaxed ${isSmall ? 'text-[13px] md:text-sm text-zinc-400' : 'text-zinc-300 text-[15px]'}`}>{formattedContent}</p>;
  });
};

// --- NEW: STRUCTURED TERMINAL LOG SYSTEM ---
type LogEntry = {
  type: 'system' | 'case_header' | 'success' | 'error' | 'expected' | 'actual_pass' | 'actual_fail' | 'summary_pass' | 'summary_fail' | 'points' | 'penalty' | 'time';
  content: string;
};

const renderTerminalLog = (log: LogEntry, i: number) => {
  switch (log.type) {
    case 'system':
      return <div key={i} className="text-purple-400 font-bold text-[13px] mb-5 bg-purple-500/10 py-2.5 px-4 rounded-lg border border-purple-500/20 inline-block shadow-sm">{log.content}</div>;
    
    case 'case_header':
      return <div key={i} className="text-sky-400 font-bold mt-6 mb-2 border-l-[3px] border-sky-500 pl-3 bg-gradient-to-r from-sky-500/10 to-transparent py-1.5 flex items-center gap-2 text-[14px] uppercase tracking-wider">▶ {log.content}</div>;
    
    case 'success':
      return <div key={i} className="text-emerald-400 font-bold flex items-center gap-2 my-2 text-[13px]"><CheckCircle2 size={16}/> {log.content}</div>;
    
    case 'error':
      return (
        <div key={i} className="text-rose-400 font-bold flex items-start gap-2 my-2 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
          <X size={16} className="mt-0.5 shrink-0"/> 
          <pre className="font-mono whitespace-pre-wrap text-[13px]">{log.content}</pre>
        </div>
      );
    
    case 'expected':
      return (
        <div key={i} className="text-zinc-300 bg-sky-500/5 px-4 py-3 rounded-xl border border-sky-500/10 border-l-2 border-l-sky-500/50 mt-3 shadow-sm">
          <div className="text-sky-500/90 font-bold mb-2 text-[10px] uppercase tracking-widest flex items-center gap-1.5"><Target size={12}/> EXPECTED OUTPUT</div>
          <pre className="font-mono whitespace-pre-wrap text-[13px] leading-relaxed text-sky-100">{log.content || " "}</pre>
        </div>
      );
    
    case 'actual_pass':
      return (
        <div key={i} className="text-zinc-300 bg-emerald-500/5 px-4 py-3 rounded-xl border border-emerald-500/10 border-l-2 border-l-emerald-500/50 mt-3 mb-4 shadow-sm">
          <div className="text-emerald-500/90 font-bold mb-2 text-[10px] uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 size={12}/> ACTUAL OUTPUT</div>
          <pre className="font-mono whitespace-pre-wrap text-[13px] leading-relaxed text-emerald-100">{log.content || " "}</pre>
        </div>
      );
    
    case 'actual_fail':
      return (
        <div key={i} className="text-zinc-300 bg-rose-500/5 px-4 py-3 rounded-xl border border-rose-500/10 border-l-2 border-l-rose-500/50 mt-3 mb-4 shadow-sm">
          <div className="text-rose-500/90 font-bold mb-2 text-[10px] uppercase tracking-widest flex items-center gap-1.5"><X size={12}/> ACTUAL OUTPUT</div>
          <pre className="font-mono whitespace-pre-wrap text-[13px] leading-relaxed text-rose-100">{log.content || " "}</pre>
        </div>
      );
    
    case 'summary_pass':
      return <div key={i} className="text-emerald-400 font-extrabold text-[15px] mt-8 bg-emerald-500/10 p-5 rounded-xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] inline-block w-full sm:w-auto tracking-wide">🏆 {log.content}</div>;
    
    case 'summary_fail':
      return <div key={i} className="text-rose-400 font-extrabold text-[15px] mt-8 bg-rose-500/10 p-5 rounded-xl border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)] inline-block w-full sm:w-auto tracking-wide">💀 {log.content}</div>;
    
    case 'points':
      return <div key={i} className="text-yellow-400 font-bold mt-4 text-[14px]">⭐ {log.content}</div>;
    
    case 'penalty':
      return <div key={i} className="text-amber-400 font-medium italic mt-2 text-[13px]">⚠️ {log.content}</div>;
    
    case 'time':
      return <div key={i} className="text-cyan-400 font-medium mt-2 text-[13px]">⏱️ {log.content}</div>;
    
    default:
      return <div key={i} className="text-zinc-400 font-mono text-[13px]">{log.content}</div>;
  }
};

export default function ContestPanel({ user, onLoginRequest }: { user: any, onLoginRequest: any }) {
  const { contestId } = useParams();
  
  const [contest, setContest] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState('c++'); 
  const [code, setCode] = useState(userTemplates['c++']);
  
  // CHANGED: Output is now an array of logs instead of a giant string
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [contestStatus, setContestStatus] = useState<'upcoming' | 'active' | 'ended'>('upcoming');
  const [lastRunTime, setLastRunTime] = useState<number>(0);
  
  const [wrongAttempts, setWrongAttempts] = useState<Record<string, number>>({});
  
  const [showEndedPopup, setShowEndedPopup] = useState(false);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [leftTab, setLeftTab] = useState<'statement' | 'testcases'>('statement');

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
            } catch (e) {
              console.error(e);
            }
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

  const executeCodeCustom = async (lang: string, source: string, stdin: string) => {
    const ENGINE_API_URL = "https://rajawatprateek-algolib-engine.hf.space/execute";
    const STATUS_API_URL = "https://rajawatprateek-algolib-engine.hf.space/status";
    
    try {
        // 1. Submit Code
        const res = await fetch(ENGINE_API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: lang, code: source, input: stdin })
        });
        
        if (!res.ok) throw new Error(`Engine Offline or Overloaded: HTTP ${res.status}`);
        const { jobId } = await res.json();

        // 2. Poll for Status
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 800)); // slightly faster polling for contest
            
            const statusRes = await fetch(`${STATUS_API_URL}/${jobId}`);
            if (!statusRes.ok) continue; // If a single ping fails, just try again in 800ms
            
            const statusData = await statusRes.json();

            // We silently wait if 'queued' or 'running', we only return when finished
            if (statusData.status === 'success' || statusData.status === 'error') {
                let cleanOutput = (statusData.output || '').trim();
                if (lang === 'java') {
                    cleanOutput = cleanOutput.replace(/Main_[a-fA-F0-9]+/g, 'Main');
                }
                return { output: cleanOutput, statusCode: statusData.statusCode };
            }
        }
    } catch (e: any) { 
        throw new Error(`Connection to execution matrix failed: ${e.message}`); 
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
    
    // Initialize Local State Array for live updates
    let currentLogs: LogEntry[] = [];
    const addLog = (type: LogEntry['type'], content: string) => {
        currentLogs = [...currentLogs, { type, content }];
        setLogs(currentLogs);
    };

    addLog('system', isSubmit ? '🚀 Initiating Submission Suite...' : '⚙️ Compiling and running test cases...');
    
    let casesToRun = isSubmit ? testCases : testCases.filter(tc => tc.is_public === true || tc.is_public === 'true' || tc.isPublic === true || tc.isPublic === 'true');
    if (casesToRun.length === 0 && testCases.length > 0) casesToRun = [testCases[0]];
    
    let allPassed = true;
    let passedCount = 0;
    
    for (let i = 0; i < casesToRun.length; i++) {
      const tc = casesToRun[i];
      addLog('case_header', `Case ${i + 1}`);
      
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
          addLog('error', `Runtime Error / Exception:\n\n${output}`);
          allPassed = false;
        } else if (isCorrect) {
          addLog('success', 'Passed');
          if (isPub) {
             addLog('actual_pass', output);
          }
          passedCount++;
        } else {
          addLog('error', 'Failed');
          if (isPub) {
             addLog('expected', expOut);
             addLog('actual_fail', output);
          }
          allPassed = false;
        }
      } catch (err: any) { 
        addLog('error', `System Infrastructure Error:\n${err.message}`);
        allPassed = false; 
      }
      
      if (!allPassed) break;
      await new Promise(r => setTimeout(r, 800)); // Smooth delay for visual effect
    }
    
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
        addLog('summary_fail', `Final Score: Rejected (${passedCount}/${casesToRun.length})`);
        addLog('penalty', `Penalty applied: -${defaultPenalty} points for future correct submission.`);
      } else {
        addLog('summary_pass', `Final Score: Accepted (${passedCount}/${casesToRun.length})`);
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
              
              addLog('points', `Points Awarded: ${pointsEarned} (Base: ${defaultPts}, Penalties: -${currentWrongCount * defaultPenalty})`);
              addLog('time', `Time Taken: ${formatTime(timeTakenSeconds)}`);
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

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-300 font-sans flex flex-col overflow-hidden relative">
      <AnimatePresence>
        {/* CONTEST ENDED POPUP */}
        {showEndedPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                <Clock size={48} className="text-rose-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Contest Ended</h2>
                <p className="text-zinc-400 mb-6 text-sm">The contest time has expired. Submissions for points are now disabled, but you can still run your code for practice.</p>
                <button onClick={() => setShowEndedPopup(false)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors">Acknowledge</button>
             </motion.div>
          </motion.div>
        )}

        {/* CHEAT WARNING POPUP */}
        {showCheatWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative">
                <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Warning</h2>
                <p className="text-zinc-400 mb-6 text-sm">you are trying to switch tab, and cheat; kindly do not perform this action again.</p>
                <button onClick={() => setShowCheatWarning(false)} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors">I Understand</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col w-full h-full relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 bg-zinc-900 shrink-0 shadow-lg z-20 transition-all">
          <div className="flex items-center justify-between w-full p-3 md:px-4 md:h-14 md:w-auto">
            <div className="flex items-center gap-3 md:gap-4">
              <Link to="/contests" className="p-2 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-colors text-zinc-400 hover:text-white"><ArrowLeft size={18} /></Link>
              <div className="h-6 w-px bg-zinc-700 hidden md:block mx-1"></div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${contestStatus === 'active' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-[0_0_10px_currentColor]`}></div>
                <span className="text-[13px] md:text-sm font-bold text-white tracking-wide uppercase truncate max-w-[120px] sm:max-w-none">{contest?.title || 'Contest Arena'}</span>
              </div>
            </div>

            <div className="flex md:hidden items-center gap-2">
               <div className="flex items-center gap-1.5 bg-zinc-800/80 border border-zinc-700 rounded-md px-2 py-1 font-mono text-[11px] font-bold text-white">
                  <Clock size={12} className={`${contestStatus === 'active' && timeRemaining < 300 ? 'text-rose-500 animate-pulse' : 'text-zinc-400'}`} />
                  <span>{contestStatus === 'ended' ? "Ended" : formatTime(timeRemaining)}</span>
               </div>
               <button onClick={() => handleEvaluation(false)} disabled={isRunning} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md border border-zinc-700 disabled:opacity-30 transition-all">
                  <Play size={14} className="text-emerald-400" />
               </button>
               <button 
                 onClick={() => handleEvaluation(true)} 
                 disabled={isRunning || contestStatus === 'ended'} 
                 className={`p-1.5 rounded-md shadow-lg transition-all ${contestStatus === 'ended' ? 'bg-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30'}`}
               >
                  <Send size={14} />
               </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 pb-3 pt-1 md:p-0 overflow-x-auto no-scrollbar md:mx-4 border-t border-zinc-800 md:border-none flex-1">
              {problems.map((p, idx) => (
                  <button 
                    key={p.id || idx} 
                    onClick={() => { setActiveProblemIndex(idx); setLogs([]); }}
                    className={`whitespace-nowrap px-3 md:px-4 py-1.5 text-xs font-bold rounded-full transition-all border ${activeProblemIndex === idx ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                  >
                    Problem {String.fromCharCode(65 + idx)}
                  </button>
              ))}
          </div>

          <div className="hidden md:flex items-center gap-3 px-4">
             <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 font-mono text-sm font-bold text-white">
                <Clock size={16} className={`${contestStatus === 'active' && timeRemaining < 300 ? 'text-rose-500 animate-pulse' : 'text-zinc-500'}`} />
                <span>{contestStatus === 'ended' ? "00:00:00" : formatTime(timeRemaining)}</span>
             </div>
             <div className="flex gap-2">
                <button onClick={() => handleEvaluation(false)} disabled={isRunning} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-bold border border-zinc-700 opacity-90 hover:opacity-100 disabled:opacity-30 transition-all">
                  <Play size={14} className="text-emerald-400" /> Run
                </button>
                <button 
                  onClick={() => handleEvaluation(true)} 
                  disabled={isRunning || contestStatus === 'ended'} 
                  title={contestStatus === 'ended' ? "Submissions closed" : ""}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all ${contestStatus === 'ended' ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30'}`}
                >
                  <Send size={14} /> Submit
                </button>
             </div>
          </div>
        </div>
        
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 flex items-center justify-center gap-2 shrink-0">
          <Lock size={14} className="text-rose-400" />
          <span className="text-rose-400 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-center">
            Your activity is being recorded. dont try to cheat, otherwise you will be disqualified from contest
          </span>
        </div>

        <div className="flex-1 min-h-0">
          <PanelGroup direction={isMobile ? "vertical" : "horizontal"}>
            <Panel defaultSize={isMobile ? 35 : 40} minSize={15} maxSize={85} className="flex flex-col bg-zinc-950/80 border-r border-zinc-800">
               <div className="flex border-b border-zinc-800 px-2 bg-zinc-900 shrink-0">
                  {[ { id: 'statement', label: 'Problem' }, { id: 'testcases', label: 'Test Cases' } ].map(tab => (
                    <button key={tab.id} onClick={() => setLeftTab(tab.id as any)} className={`px-4 md:px-6 py-3 text-[11px] md:text-xs font-bold tracking-widest uppercase transition-all border-b-2 ${leftTab === tab.id ? 'text-emerald-400 border-emerald-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>{tab.label}</button>
                  ))}
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                  {leftTab === 'statement' ? (
                    <div className="w-full">
                       <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3 leading-tight">{activeProblem?.title}</h1>
                       <div className="flex flex-wrap items-center gap-2 mb-6">
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold uppercase border border-emerald-500/20">{activeProblem?.difficulty}</span>
                          
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border shadow-[0_0_10px_rgba(245,158,11,0.1)] ${currentWrongCount > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                            {availablePoints} PTS AVAILABLE (-{displayPenalty} PER WRONG)
                          </span>

                          {activeProblem?.tags?.map((t: string) => <span key={t} className="px-3 py-1 bg-sky-500/10 text-sky-400 rounded-full text-[10px] font-bold uppercase border border-sky-500/20">{t}</span>)}
                       </div>
                       <div className="markdown-body text-sm md:text-base">{renderMarkdown(activeProblem?.description)}</div>
                    </div>
                  ) : (
                    <div className="space-y-4 md:space-y-6 pb-10">
                       {testCases.map((tc, i) => (
                         <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
                            <div className="px-4 py-2 bg-zinc-800/50 text-[10px] font-bold text-zinc-400 tracking-widest uppercase border-b border-zinc-800">Case {i + 1} {tc.is_public ? '' : '(Hidden)'}</div>
                            {tc.is_public ? (
                              <div className="p-4 space-y-4">
                                 <div>
                                   <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Input</div>
                                   <pre className="bg-zinc-950 p-3 rounded-lg text-[11px] md:text-xs font-mono text-emerald-300 border border-zinc-800 overflow-x-auto custom-scrollbar">{tc.display_input}</pre>
                                 </div>
                                 <div>
                                   <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Output</div>
                                   <pre className="bg-zinc-950 p-3 rounded-lg text-[11px] md:text-xs font-mono text-emerald-400 border border-zinc-800 overflow-x-auto custom-scrollbar">{tc.expected_output}</pre>
                                 </div>
                                 
                                 {tc.explanation && (
                                   <div>
                                     <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Explanation</div>
                                     <div className="bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800 overflow-x-auto custom-scrollbar">
                                       {renderMarkdown(tc.explanation, true)}
                                     </div>
                                   </div>
                                 )}
                              </div>
                            ) : <div className="p-8 text-center text-zinc-600 font-bold italic">CLASSIFIED DATA</div>}
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </Panel>

            <PanelResizeHandle className="w-full h-3 md:w-1.5 md:h-full bg-zinc-900 border-y md:border-y-0 md:border-r border-zinc-800 hover:bg-emerald-500/30 transition-colors cursor-row-resize md:cursor-col-resize flex items-center justify-center shrink-0 relative z-10">
               <div className="w-12 h-1 md:h-10 md:w-0.5 bg-zinc-600 rounded-full"></div>
            </PanelResizeHandle>

            <Panel minSize={15} className="flex flex-col bg-zinc-950">
               <PanelGroup direction="vertical">
                 <Panel defaultSize={65} minSize={20} className="flex flex-col">
                    <div className="h-10 md:h-12 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-3 md:px-4 shrink-0">
                       <select value={language} onChange={handleLanguageChange} className="bg-transparent text-emerald-400 text-[11px] md:text-xs font-bold outline-none cursor-pointer hover:bg-zinc-800 px-2 py-1 rounded transition-colors uppercase tracking-widest">
                          <option value="c++">C++ 17</option>
                          <option value="python">Python 3</option>
                          <option value="java">Java 21</option>
                       </select>
                       <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase flex gap-2 items-center">
                         <Code2 size={12}/> Editor
                       </div>
                    </div>
                    <div className="flex-1 bg-zinc-950 relative">
                       <Editor
                         height="100%"
                         theme="vs-dark"
                         language={language === 'c++' ? 'cpp' : language}
                         value={code}
                         onChange={(v) => setCode(v || '')}
                         options={{ minimap: { enabled: false }, fontSize: isMobile ? 13 : 15, fontFamily: "'Fira Code', monospace", padding: { top: 20, bottom: 20 }, smoothScrolling: true, cursorBlinking: "expand", automaticLayout: true }}
                       />
                    </div>
                 </Panel>
                 
                 <PanelResizeHandle className="h-1.5 bg-black hover:bg-emerald-500/30 transition-colors cursor-row-resize flex items-center justify-center shrink-0 relative z-10">
                    <div className="w-10 h-0.5 bg-zinc-700 rounded-full"></div>
                 </PanelResizeHandle>
                 
                 <Panel className="bg-[#050505] flex flex-col" minSize={10}>
                    <div className="h-9 md:h-10 bg-[#09090b] border-b border-white/5 flex items-center justify-between px-3 md:px-4 shrink-0 shadow-sm z-10">
                       <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase flex gap-2 items-center"><Terminal size={12}/> Console Output</span>
                       {logs.length > 0 && <button onClick={() => setLogs([])} className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-wider">Clear</button>}
                    </div>
                    
                    {/* CHANGED: Now rendering structured objects instead of split strings */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-[#020202] shadow-inner relative">
                       {logs.length > 0 ? (
                           <div className="flex flex-col">
                               {logs.map((l, i) => renderTerminalLog(l, i))}
                           </div>
                       ) : (
                           <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-zinc-600 opacity-60">
                               <Terminal size={32} />
                               <div className="italic uppercase tracking-widest text-[10px]">$ Waiting for execution...</div>
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
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}