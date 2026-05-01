import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, loginWithGoogle } from "../lib/firebase"; 
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  AlertTriangle, Clock, ShieldAlert, ChevronRight, 
  ChevronLeft, Send, CheckCircle2, AlertOctagon, Maximize, Trophy, Target, 
  Loader2, Lock, SearchX, Calendar, Check, Hash, CircleDot, CheckSquare, ToggleLeft
} from 'lucide-react';
import Navbar from '@/components/Navbar';

type QuestionType = 'single' | 'multiple' | 'true_false' | 'numerical';

interface QuizOption { id: string; text: string; }
interface QuizQuestion { id: string; text: string; questionType: QuestionType; options: QuizOption[]; correctOptions: string[]; }
interface QuizData { id: string; title: string; startTime: string; endTime: string; durationSeconds: number; maxWarnings: number; questions: QuizQuestion[]; personalEndTime?: string; }
interface LeaderboardEntry { display_name: string; score: number; time_taken_seconds: number; }

// UTILITY: Unbiased array randomizer (Fisher-Yates Shuffle)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function QuizArena() {
  const { id: quizId } = useParams(); 
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  
  const [eligibility, setEligibility] = useState<'loading' | 'allowed' | 'denied' | 'unauthenticated' | 'not_found'>('loading');
  const [quizStatus, setQuizStatus] = useState<'upcoming' | 'active' | 'ended'>('upcoming');
  const [timeRemaining, setTimeRemaining] = useState(0);

  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmittingToDB, setIsSubmittingToDB] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); 
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  
  const [warnings, setWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningReason, setWarningReason] = useState("");
  const [finalScore, setFinalScore] = useState(0);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  const strikeCooldown = useRef(false);
  const isIntentionalExit = useRef(false); 
  const warningsRef = useRef(0); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setEligibility('unauthenticated');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const initializeArena = async () => {
        if (!user) return;
        if (!quizId) { setEligibility('not_found'); return; }

        try {
            const token = await user.getIdToken();
            
            // Check for existing submission
            const subRes = await fetch(`/.netlify/functions/get-quiz-submissions?quiz_id=${quizId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (subRes.ok) {
                const subs = await subRes.json();
                const mySub = subs.find((s: any) => s.user_uid === user.uid);
                if (mySub) {
                    setFinalScore(mySub.score);
                    warningsRef.current = mySub.warnings_hit || 0;
                    setEligibility('denied');
                    return;
                }
            }

            const quizRes = await fetch(`/.netlify/functions/get-quiz-details?id=${quizId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!quizRes.ok) throw new Error("Not Found");
            
            const { quiz, questions } = await quizRes.json();

            // Format and RANDOMIZE options
            const formattedQuestions: QuizQuestion[] = (questions || []).map((q: any) => {
                let inferredType: QuestionType = q.is_multiple_choice ? 'multiple' : 'single';
                if (!q.options || q.options.length === 0) inferredType = 'numerical';
                else if (q.options.length === 2 && q.options[0].text === 'True') inferredType = 'true_false';

                const randomizedOptions: QuizOption[] = q.options ? shuffleArray<QuizOption>(q.options) : [];

                return {
                    id: q.id, 
                    text: q.text, 
                    questionType: inferredType,
                    options: randomizedOptions, 
                    correctOptions: q.correct_options || []
                };
            });

            // RANDOMIZE questions overall
            const randomizedQuestions = shuffleArray<QuizQuestion>(formattedQuestions);

            setQuizData({
                id: quiz.id, 
                title: quiz.title, 
                startTime: quiz.start_time, 
                endTime: quiz.end_time, 
                durationSeconds: quiz.duration_seconds || 3600, 
                maxWarnings: quiz.max_warnings || 3, 
                questions: randomizedQuestions
            });

            setEligibility('allowed');
        } catch (error) { setEligibility('not_found'); }
    };

    if (user) { setEligibility('loading'); initializeArena(); }
  }, [user, quizId]); 

  // Polling for Leaderboard Data
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchLeaderboard = async () => {
      if (!quizId) return;
      try {
        const token = await user?.getIdToken();
        const res = await fetch(`/.netlify/functions/get-quiz-submissions?quiz_id=${quizId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const sorted = data.sort((a: any, b: any) => b.score !== a.score ? b.score - a.score : a.time_taken_seconds - b.time_taken_seconds);
          setLeaderboard(sorted.slice(0, 10)); 
        }
      } catch (err) {}
    };

    if (eligibility === 'denied' || isSubmitted) {
      fetchLeaderboard();
      interval = setInterval(fetchLeaderboard, 120000); 
    }
    return () => { if (interval) clearInterval(interval); };
  }, [quizId, eligibility, isSubmitted, user]);

  // Global Timer Logic
  useEffect(() => {
    if (!quizData || isSubmitted) return;

    const updateTimer = () => {
        const now = Date.now();
        const start = new Date(quizData.startTime).getTime();
        const absoluteWindowEnd = new Date(quizData.endTime).getTime();

        if (!hasStarted) {
            if (now < start) {
                setQuizStatus('upcoming');
                setTimeRemaining(Math.floor((start - now) / 1000));
            } else if (now >= start && now <= absoluteWindowEnd) {
                setQuizStatus('active');
                const maxDisplayTime = Math.min(quizData.durationSeconds, Math.floor((absoluteWindowEnd - now) / 1000));
                setTimeRemaining(maxDisplayTime > 0 ? maxDisplayTime : 0);
            } else {
                setQuizStatus('ended');
                setTimeRemaining(0);
            }
        } else {
            const personalEnd = new Date(quizData.personalEndTime!).getTime();
            if (now <= personalEnd) {
                setQuizStatus('active');
                setTimeRemaining(Math.floor((personalEnd - now) / 1000));
            } else {
                setQuizStatus('ended');
                setTimeRemaining(0);
                if (!isSubmitted && !isIntentionalExit.current) {
                    isIntentionalExit.current = true;
                    forceSubmit("Your dedicated assessment duration has concluded. Auto-submitting responses.");
                }
            }
        }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [quizData, hasStarted, isSubmitted]);

  // Proctoring Engine
  useEffect(() => {
    if (!hasStarted || isSubmitted || !quizData || showSubmitConfirm) return; 

    const issueStrike = (reason: string) => {
      if (isIntentionalExit.current || strikeCooldown.current) return; 
      
      strikeCooldown.current = true;
      setTimeout(() => { strikeCooldown.current = false; }, 2000); 

      warningsRef.current += 1;
      setWarnings(warningsRef.current); 

      if (warningsRef.current >= quizData.maxWarnings) {
        isIntentionalExit.current = true; 
        forceSubmit(`Proctoring Alert: ${reason}. Maximum warnings exceeded.`);
      } else {
        setWarningReason(reason);
        setShowWarningModal(true);
      }
    };

    const handleVisibilityChange = () => { if (document.hidden) issueStrike("Tab switched or browser minimized"); };
    const handleBlur = () => { issueStrike("Focus lost to an overlay or external application"); };
    const handleFullscreenChange = () => { 
        if (!document.fullscreenElement && !isSubmitted && !isIntentionalExit.current) { issueStrike("Exited required fullscreen mode"); }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [hasStarted, isSubmitted, quizData, showSubmitConfirm]);

  const requestSecureEnvironment = async () => {
    if (!user) return alert("Please sign in to take this assessment.");
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      
      const absoluteWindowEnd = new Date(quizData!.endTime).getTime();
      const dedicatedDurationEnd = Date.now() + (quizData!.durationSeconds * 1000);
      const strictPersonalEndMs = Math.min(dedicatedDurationEnd, absoluteWindowEnd);
      
      setQuizData(prev => ({ ...prev!, personalEndTime: new Date(strictPersonalEndMs).toISOString() }));
      setHasStarted(true);
    } catch (err) { alert("Browser blocked fullscreen. Please allow fullscreen access to begin."); }
  };

  const handleSelectOption = (questionId: string, value: string, isMulti: boolean, isNumerical: boolean = false) => {
    setAnswers(prev => {
        if (isNumerical) return { ...prev, [questionId]: [value] };
        const currentSelections = prev[questionId] || [];
        if (isMulti) {
            if (currentSelections.includes(value)) return { ...prev, [questionId]: currentSelections.filter(id => id !== value) };
            else return { ...prev, [questionId]: [...currentSelections, value] };
        } else { return { ...prev, [questionId]: [value] }; }
    });
  };

  const handleNext = () => { if (quizData && currentIndex < quizData.questions.length - 1) { setDirection(1); setCurrentIndex(currentIndex + 1); } };
  const handlePrev = () => { if (currentIndex > 0) { setDirection(-1); setCurrentIndex(currentIndex - 1); } };
  const requestSubmit = () => { setShowSubmitConfirm(true); }; 
  const forceSubmit = (reason: string) => { setShowSubmitConfirm(false); alert(reason); finalizeSubmission(); };

  const finalizeSubmission = async () => {
    if (!quizData || !user) return;
    isIntentionalExit.current = true; setIsSubmittingToDB(true);
    
    let calculatedScore = 0;
    quizData.questions.forEach(q => {
       const userAns = answers[q.id] || []; const correctAns = q.correctOptions || [];
       if (q.questionType === 'numerical') {
           if (userAns[0] && correctAns[0] && userAns[0].trim() === correctAns[0].trim()) calculatedScore += 1;
       } else {
           if (userAns.length > 0 && userAns.length === correctAns.length && userAns.every(val => correctAns.includes(val))) calculatedScore += 1;
       }
    });
    
    setFinalScore(calculatedScore);
    
    const assignedTotalTime = Math.floor((new Date(quizData.personalEndTime!).getTime() - (new Date(quizData.personalEndTime!).getTime() - quizData.durationSeconds * 1000)) / 1000);
    const timeTaken = assignedTotalTime - timeRemaining;

    try {
        const token = await user.getIdToken();
        await fetch('/.netlify/functions/submit-quiz', {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quiz_id: quizData.id, score: calculatedScore, total_questions: quizData.questions.length,
                warnings_hit: warningsRef.current, time_taken_seconds: timeTaken > 0 ? timeTaken : 0, answers_payload: answers
            })
        });
    } catch (error) { console.error("Failed to save submission"); }

    setIsSubmittingToDB(false); setIsSubmitted(true); setShowSubmitConfirm(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Fixed Date and Time Formatting
  const formatScheduleDateTime = (dateStr: string) => { 
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); 
  };
  
  const getOptionLetter = (index: number) => String.fromCharCode(65 + index); 

  const slideVariants: Variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.4, type: "spring", bounce: 0.3 } } as any,
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0, transition: { duration: 0.3 } })
  };

  const renderLeaderboardCard = () => (
    <motion.div initial={{ scale: 0.95, opacity: 0, x: 20 }} animate={{ scale: 1, opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="max-w-md w-full bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/[0.08] p-6 md:p-8 rounded-[2.5rem] shadow-2xl flex flex-col h-[400px] md:h-[500px]">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><Trophy size={20} className="text-amber-400" /> Live Leaderboard</h2>
            <div className="flex items-center gap-1.5 text-[9px] md:text-[11px] font-bold tracking-widest uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Auto-Sync
            </div>
        </div>
        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
             <div key={idx} className="flex items-center justify-between p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                   <span className={`w-6 text-center font-mono text-sm font-bold ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-600' : 'text-zinc-600'}`}>#{idx + 1}</span>
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/5"><span className="text-xs font-bold text-zinc-300">{(entry.display_name || 'U').charAt(0).toUpperCase()}</span></div>
                   <span className="text-sm font-medium text-zinc-200 truncate max-w-[100px] md:max-w-[120px]">{entry.display_name || 'Anonymous'}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5"><span className="font-mono text-sm font-bold text-white">{entry.score} <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">pts</span></span></div>
             </div>
          )) : (
             <div className="flex flex-col items-center justify-center h-full py-10 text-zinc-500 gap-3"><Loader2 className="animate-spin text-zinc-700" size={24} /><p className="text-sm">Fetching ranks...</p></div>
          )}
        </div>
    </motion.div>
  );

  if (eligibility === 'loading') return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-zinc-400 gap-4"><Loader2 className="animate-spin text-indigo-500" size={40} /> <p className="text-sm font-bold tracking-widest uppercase text-zinc-500">Initializing Arena</p></div>;

  if (eligibility === 'not_found' || eligibility === 'unauthenticated' || eligibility === 'denied') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white px-4 md:px-6 relative overflow-hidden">
         <Navbar />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full md:w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none"></div>

         <div className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full max-w-5xl relative z-10 mt-24 lg:mt-0">
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/[0.08] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-center flex flex-col justify-center h-[400px] md:h-[500px]">
                {eligibility === 'not_found' && <SearchX size={48} className="text-zinc-600 mx-auto mb-6" />}
                {eligibility === 'unauthenticated' && <Lock size={48} className="text-indigo-400 mx-auto mb-6" />}
                {eligibility === 'denied' && <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={32} className="text-emerald-500" /></div>}
                
                <h1 className="text-xl md:text-2xl font-bold mb-3 tracking-tight">{eligibility === 'not_found' ? 'Assessment Not Found' : eligibility === 'unauthenticated' ? 'Authentication Required' : 'Assessment Completed'}</h1>
                <p className="text-zinc-400 mb-8 text-xs md:text-sm leading-relaxed">{eligibility === 'not_found' ? 'The requested module could not be located. Verify the transmission link.' : eligibility === 'unauthenticated' ? 'You must authenticate your identity to access the secure testing arena.' : 'You have already completed this assessment. Multiple attempts are locked by the proctor.'}</p>
                
                {eligibility === 'denied' && (
                  <div className="bg-black/50 border border-white/[0.05] p-5 rounded-[2rem] flex flex-col items-center text-center mx-auto mb-8 shadow-inner w-full">
                     <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Logged Score</p>
                     <p className="text-4xl md:text-5xl font-mono text-white font-bold">{finalScore}</p>
                  </div>
                )}
                {eligibility === 'unauthenticated' ? (
                   <button onClick={loginWithGoogle} className="w-full py-4 bg-white text-black font-bold rounded-xl md:rounded-2xl hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] md:text-lg mt-auto">Authenticate</button>
                ) : (
                   <button onClick={() => navigate('/quiz-panel')} className="w-full py-4 bg-zinc-800 text-white font-bold rounded-xl md:rounded-2xl hover:bg-zinc-700 transition-all md:text-lg mt-auto">Return to Dashboard</button>
                )}
             </motion.div>
             {eligibility === 'denied' && renderLeaderboardCard()}
         </div>
      </div>
    );
  }

  if (!quizData) return null;

  const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k].length > 0 && answers[k][0] !== "").length;
  const progressPercent = (answeredCount / quizData.questions.length) * 100;

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-4 md:px-6 relative overflow-hidden">
        <Navbar />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] md:h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/[0.08] p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative z-10 mt-20">
           <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">{quizData.title}</h1>
           <p className="text-zinc-400 text-xs md:text-sm text-center mb-8 md:mb-10 leading-relaxed max-w-md mx-auto">Review the assessment parameters. Ensure a stable connection before proceeding into the secure environment.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
               <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-2xl p-5 md:p-6 flex items-start gap-4 shadow-lg hover:border-white/[0.15] transition-colors">
                 <div className="p-3 bg-zinc-800/80 rounded-xl text-zinc-300 shadow-inner"><Calendar size={20} /></div>
                 <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Window Schedule</p>
                    <p className="text-xs md:text-sm font-bold text-white mb-0.5">{formatScheduleDateTime(quizData.startTime)}</p>
                    <p className="text-xs md:text-sm font-bold text-zinc-400">to {formatScheduleDateTime(quizData.endTime)}</p>
                 </div>
               </div>
               
               <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-2xl p-5 md:p-6 flex items-center gap-4 shadow-lg hover:border-white/[0.15] transition-colors">
                 <div className="p-3 bg-zinc-800/80 rounded-xl text-zinc-300 shadow-inner"><Clock size={20} /></div>
                 <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Dedicated Time</p>
                    <p className="text-sm md:text-base font-bold text-white">{quizData.durationSeconds / 60} Minutes Exact</p>
                 </div>
               </div>
           </div>
           
           <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 text-sm bg-gradient-to-r from-rose-500/10 to-transparent p-5 md:p-6 rounded-2xl border border-rose-500/20 mb-8 md:mb-10 mt-4 shadow-inner">
              <ShieldAlert className="shrink-0 mt-0.5 text-rose-500" size={24} />
              <div className="space-y-2 text-zinc-300">
                  <p className="font-bold text-rose-500 tracking-wide text-sm md:text-base">Strict Proctoring Active</p>
                  <p className="leading-relaxed text-zinc-400 text-xs md:text-sm">This is a highly secure environment. Losing focus on this window, accessing external applications, or exiting fullscreen will register as a critical violation.</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-400 text-xs font-bold rounded-lg mt-2 border border-rose-500/20"><AlertTriangle size={14}/> Violations Allowed: {quizData.maxWarnings}</div>
              </div>
           </div>

           {quizStatus === 'upcoming' ? (
               <button disabled className="w-full py-4 bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold rounded-xl flex justify-center items-center gap-2 cursor-not-allowed md:text-lg text-sm">Opens in {formatCountdown(timeRemaining)}</button>
           ) : quizStatus === 'ended' ? (
               <button disabled className="w-full py-4 bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold rounded-xl flex justify-center items-center gap-2 cursor-not-allowed md:text-lg text-sm">Assessment Window Closed</button>
           ) : (
               <button onClick={requestSecureEnvironment} className="w-full py-4 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] flex justify-center items-center gap-2 md:text-lg text-sm hover:scale-[1.02] active:scale-[0.98]">
                  <Maximize size={18} /> Start Dedicated Session
               </button>
           )}
        </motion.div>
      </div>
    );
  }

  // SUCCESSFULLY SUBMITTED
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-4 md:px-6 relative overflow-hidden">
        <Navbar />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] md:h-[500px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full max-w-5xl relative z-10 mt-24 lg:mt-0">
           <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-xl w-full bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/[0.08] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-center flex flex-col h-[400px] md:h-[500px]">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]"><CheckCircle2 size={32} className="text-emerald-500" /></div>
              <h1 className="text-2xl md:text-3xl font-extrabold mb-2 md:mb-3 tracking-tight">Quiz Completed</h1>
              <p className="text-zinc-400 text-xs md:text-sm mb-8 md:mb-10 max-w-sm mx-auto leading-relaxed">Your behaviour, activity and responses have been logged. You may now securely exit this session.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mb-auto">
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 md:p-5 rounded-2xl flex flex-col items-center text-center shadow-inner"><Trophy size={18} className="text-amber-400 mb-2"/><p className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Final Score</p><p className="text-xl md:text-2xl font-mono text-white tracking-tighter font-bold">{finalScore} <span className="text-[10px] md:text-xs text-zinc-600 font-normal tracking-normal">/ {quizData.questions.length}</span></p></div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 md:p-5 rounded-2xl flex flex-col items-center text-center shadow-inner"><Target size={18} className="text-indigo-400 mb-2"/><p className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Attempted</p><p className="text-xl md:text-2xl font-mono text-white tracking-tighter font-bold">{answeredCount} <span className="text-[10px] md:text-xs text-zinc-600 font-normal tracking-normal">/ {quizData.questions.length}</span></p></div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 md:p-5 rounded-2xl flex flex-col items-center text-center shadow-inner"><AlertTriangle size={18} className="text-rose-400 mb-2"/><p className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Violations</p><p className="text-xl md:text-2xl font-mono text-rose-400 tracking-tighter font-bold">{warningsRef.current} <span className="text-[10px] md:text-xs text-rose-500/40 font-normal tracking-normal">/ {quizData.maxWarnings}</span></p></div>
              </div>
              <button onClick={() => navigate('/quiz-panel')} className="w-full py-4 bg-white text-zinc-950 font-bold rounded-xl md:rounded-2xl hover:bg-zinc-200 transition-all shadow-md text-sm md:text-lg hover:scale-[1.02] mt-6 md:mt-8">Return to Dashboard</button>
           </motion.div>
           {renderLeaderboardCard()}
        </div>
      </div>
    );
  }

  const currentQ = quizData.questions[currentIndex];
  const acknowledgeWarning = () => setShowWarningModal(false);

  // ACTIVE QUIZ INTERFACE
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans flex flex-col overflow-x-hidden relative">
      <div className="fixed top-0 left-0 w-full h-[300px] md:h-[500px] bg-indigo-500/10 blur-[150px] pointer-events-none rounded-full translate-x-1/4 -translate-y-1/4"></div>

      <AnimatePresence>
        {showWarningModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-6">
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="max-w-md w-full bg-[#0a0a0a] border border-rose-500/30 p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_0_100px_rgba(244,63,94,0.15)] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse"></div>
                <AlertOctagon size={48} className="text-rose-500 mx-auto mb-4 md:mb-6 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">Protocol Breach</h2>
                <p className="text-zinc-400 text-xs md:text-sm mb-6 leading-relaxed">System logged a violation: <span className="text-white font-semibold">{warningReason}</span>. Further breaches will initiate forced termination.</p>
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 py-3 md:py-4 rounded-xl mb-6 md:mb-8 font-mono text-xs md:text-sm font-bold tracking-widest uppercase">Strike: {warningsRef.current} of {quizData.maxWarnings}</div>
                <button onClick={acknowledgeWarning} className="w-full py-3 md:py-4 bg-rose-600 text-white font-bold rounded-xl md:rounded-2xl transition-all hover:bg-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.4)] text-sm md:text-lg active:scale-[0.98]">Acknowledge & Return</button>
             </motion.div>
          </motion.div>
        )}

        {showSubmitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-6">
             <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="max-w-sm w-full bg-[#111] border border-white/[0.08] p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl text-center">
                <Send size={40} className="text-indigo-400 mx-auto mb-4 md:mb-6" />
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Finalize Sequence</h2>
                <p className="text-zinc-400 text-xs md:text-sm mb-6 md:mb-8 leading-relaxed">Are you certain you wish to submit? Telemetry will be locked and answers cannot be altered.</p>
                <div className="flex flex-col gap-3">
                   <button 
                      onClick={() => { setIsSubmittingToDB(true); finalizeSubmission(); }}
                      disabled={isSubmittingToDB}
                      className="w-full py-3.5 md:py-4 bg-indigo-500 text-white font-bold text-sm md:text-lg rounded-xl md:rounded-2xl hover:bg-indigo-400 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                     {isSubmittingToDB ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                     {isSubmittingToDB ? "Encrypting..." : "Confirm Finalize"}
                   </button>
                   <button onClick={() => setShowSubmitConfirm(false)} disabled={isSubmittingToDB} className="w-full py-3.5 md:py-4 bg-white/[0.05] text-white font-bold rounded-xl md:rounded-2xl hover:bg-white/[0.1] transition-all disabled:opacity-50 text-sm md:text-lg">Abort</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="fixed top-0 left-0 w-full z-40 bg-[#050505]/90 backdrop-blur-3xl border-b border-white/[0.05]">
         <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <span className="font-bold text-sm md:text-[15px] text-zinc-100 tracking-tight truncate max-w-[150px] md:max-w-xs">{quizData.title}</span>
            <div className="flex items-center gap-3 md:gap-4">
                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold border transition-colors ${warnings > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-white/5 text-zinc-400 border-white/10'}`}>
                    <AlertTriangle size={14} /> <span className="hidden md:inline">Strikes:</span> {warnings} / {quizData.maxWarnings}
                </div>
                
                <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-zinc-500 pr-4 border-r border-white/10 uppercase tracking-widest"><Calendar size={14} /> End: {formatScheduleDateTime(quizData.personalEndTime!).split(',')[1]}</div>
                <div className={`flex items-center gap-2 text-sm md:text-base font-bold transition-colors ${timeRemaining < 60 ? 'text-rose-400' : 'text-zinc-200'}`}>
                    <Clock size={16} className={timeRemaining < 60 ? 'animate-pulse' : ''} />
                    <span className="font-mono tracking-wider">{formatCountdown(timeRemaining)}</span>
                </div>
            </div>
         </div>
         <div className="w-full h-1 bg-zinc-900"><motion.div className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 shadow-[0_0_15px_rgba(99,102,241,0.8)]" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.4, ease: "easeOut" }} /></div>
      </header>

      <main className="flex-1 flex justify-center px-4 md:px-6 pt-24 pb-36 relative z-10 w-full max-w-5xl mx-auto">
         <div className="w-full mt-4 md:mt-10 flex flex-col items-center">
            
            <div className="mb-6 flex flex-col items-center justify-center text-center w-full">
               <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-6 md:mb-8">
                   <span className="text-[10px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-500 bg-white/[0.03] border border-white/[0.05] px-3 md:px-4 py-1.5 rounded-full shadow-inner">
                       Item {currentIndex + 1} of {quizData.questions.length}
                   </span>
                   
                   <span className={`flex items-center gap-1.5 text-[9px] md:text-[11px] font-bold uppercase tracking-[0.1em] px-3 md:px-4 py-1.5 rounded-full shadow-inner border ${
                       currentQ.questionType === 'multiple' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 
                       currentQ.questionType === 'numerical' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                       currentQ.questionType === 'true_false' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                       'text-sky-400 bg-sky-500/10 border-sky-500/20'
                   }`}>
                     {currentQ.questionType === 'numerical' && <Hash size={12}/>}
                     {currentQ.questionType === 'multiple' && <CheckSquare size={12}/>}
                     {currentQ.questionType === 'single' && <CircleDot size={12}/>}
                     {currentQ.questionType === 'true_false' && <ToggleLeft size={12}/>}
                     
                     {currentQ.questionType === 'multiple' ? "Multi-Select" : 
                      currentQ.questionType === 'numerical' ? "Exact Value" : 
                      currentQ.questionType === 'true_false' ? "True / False" : "Single Choice"}
                   </span>
               </div>
               
               <AnimatePresence mode="wait">
                 <motion.div key={`qtext-${currentIndex}`} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="text-base md:text-xl lg:text-2xl font-semibold text-white mb-6 md:mb-8 max-w-4xl w-full text-left leading-relaxed">
                    <ReactMarkdown
                       remarkPlugins={[remarkGfm]}
                       components={{
                          code: ({ node, inline, className, children, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline ? (
                              <div className="my-4 md:my-6 rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                                {match && (
                                  <div className="bg-white/5 px-4 py-1.5 text-[10px] font-mono text-zinc-500 border-b border-white/5 uppercase tracking-widest">
                                    {match[1]}
                                  </div>
                                )}
                                <pre className="p-4 md:p-5 overflow-x-auto">
                                  <code className={`text-xs md:text-[14px] leading-snug font-mono text-zinc-300 ${className || ''}`} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              </div>
                            ) : (
                              <code className="bg-white/10 text-sky-300 px-1.5 py-0.5 rounded-md font-mono text-[0.9em]" {...props}>
                                {children}
                              </code>
                            );
                          },
                          p: ({node, ...props}: any) => <p className="mb-3 md:mb-4 last:mb-0" {...props} />, 
                          strong: ({node, ...props}: any) => <strong className="font-extrabold text-white" {...props} />,
                          ul: ({node, ...props}: any) => <ul className="list-disc pl-5 md:pl-6 my-3 md:my-4 space-y-2 text-zinc-300" {...props} />, 
                          ol: ({node, ...props}: any) => <ol className="list-decimal pl-5 md:pl-6 my-3 md:my-4 space-y-2 text-zinc-300" {...props} />,
                          table: ({node, ...props}: any) => <div className="overflow-x-auto my-4 border border-white/10 rounded-xl"><table className="w-full text-left border-collapse" {...props} /></div>,
                          th: ({node, ...props}: any) => <th className="p-3 bg-white/5 border-b border-white/10 font-bold text-white" {...props} />,
                          td: ({node, ...props}: any) => <td className="p-3 border-b border-white/5 text-zinc-300" {...props} />
                       }}
                    >
                       {currentQ.text.replace(/\\n/g, '\n')}
                    </ReactMarkdown>
                 </motion.div>
               </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={`qopts-${currentIndex}`} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-4xl mx-auto" >
                {currentQ.questionType === 'numerical' ? (
                   <div className="flex flex-col items-center justify-center py-4 md:py-8">
                      <input type="number" value={(answers[currentQ.id] && answers[currentQ.id][0]) || ''} onChange={(e) => handleSelectOption(currentQ.id, e.target.value, false, true)} placeholder="Enter exact value..." className="w-full max-w-lg bg-[#050505] border border-white/[0.1] rounded-[1.5rem] md:rounded-[2rem] px-6 py-5 md:px-8 md:py-6 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-center text-3xl md:text-4xl font-mono text-white transition-all placeholder:text-zinc-800 placeholder:text-lg md:placeholder:text-xl placeholder:font-sans shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]" />
                      <p className="mt-4 text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><CheckCircle2 size={14}/> Auto-saving response</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {currentQ.options.map((opt, optIndex) => {
                        const currentAnsArray = answers[currentQ.id] || []; const isSelected = currentAnsArray.includes(opt.id); const letter = getOptionLetter(optIndex);
                        return (
                          <motion.button whileHover={{ scale: 1.01, translateY: -2 }} whileTap={{ scale: 0.98 }} key={opt.id} onClick={() => handleSelectOption(currentQ.id, opt.id, currentQ.questionType === 'multiple')} className={`relative w-full text-left p-4 md:p-6 rounded-[1.25rem] md:rounded-[1.5rem] border-2 transition-all overflow-hidden group flex items-start gap-3 md:gap-4 ${isSelected ? 'bg-indigo-500/[0.08] border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : 'bg-white/[0.02] border-white/[0.05] hover:border-white/20 hover:bg-white/[0.04]'}`}>
                            <div className={`mt-0.5 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center shrink-0 rounded-[0.6rem] md:rounded-xl font-bold text-sm md:text-base transition-colors ${isSelected ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/10 text-zinc-500 group-hover:bg-white/20 group-hover:text-white'}`}>{letter}</div>
                            <div className={`text-[14px] md:text-[16px] font-medium leading-relaxed transition-colors flex-1 overflow-hidden ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
                                <ReactMarkdown 
                                   remarkPlugins={[remarkGfm]}
                                   components={{ 
                                     code: ({ node, inline, className, children, ...props }: any) => {
                                       return !inline ? (
                                          <pre className="bg-black/50 border border-white/5 p-3 md:p-4 rounded-xl overflow-x-auto my-2 md:my-3 shadow-inner">
                                            <code className="text-[11px] md:text-[13px] font-mono text-zinc-300" {...props}>
                                              {children}
                                            </code>
                                          </pre>
                                       ) : (
                                          <code className="bg-white/10 text-sky-300 px-1 py-0.5 rounded font-mono text-[0.8em]" {...props}>
                                            {children}
                                          </code>
                                       );
                                     }, 
                                     p: ({node, ...props}: any) => <p className="mb-0 inline-block w-full" {...props} /> 
                                   }}
                                >
                                   {opt.text.replace(/\\n/g, '\n')}
                                </ReactMarkdown>
                            </div>
                            <div className={`mt-1 md:mt-1.5 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center shrink-0 transition-all ${currentQ.questionType === 'multiple' ? 'rounded-sm md:rounded-md border-2' : 'rounded-full border-2'} ${isSelected ? 'border-indigo-500 bg-indigo-500 opacity-100 scale-100 shadow-md' : 'border-zinc-700 bg-transparent opacity-0 scale-50 group-hover:opacity-50'}`}>
                                {currentQ.questionType === 'multiple' && <Check size={12} className="text-white stroke-[3]" />}
                                {currentQ.questionType !== 'multiple' && <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"></div>}
                            </div>
                          </motion.button>
                        );
                      })}
                   </div>
                )}
              </motion.div>
            </AnimatePresence>
         </div>
      </main>

      <footer className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] md:w-full max-w-[800px] z-50">
         <div className="bg-[#121212]/90 backdrop-blur-3xl border border-white/[0.1] rounded-[1.5rem] md:rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-2 md:p-3 flex items-center justify-between">
            <button onClick={handlePrev} disabled={currentIndex === 0} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 rounded-xl font-bold tracking-wide transition-all text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-0 text-sm md:text-base"><ChevronLeft size={18} /> <span className="hidden sm:inline">Prev</span></button>
            <div className="flex gap-2 px-2 overflow-x-auto no-scrollbar items-center justify-center flex-1 mask-edges">
               {quizData.questions.map((q, i) => {
                 const isAns = answers[q.id] && answers[q.id].length > 0 && answers[q.id][0] !== "";
                 return <button key={q.id} onClick={() => { setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); }} className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all shrink-0 ${i === currentIndex ? 'bg-white scale-[1.3] shadow-[0_0_10px_rgba(255,255,255,0.8)]' : isAns ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] hover:bg-indigo-400' : 'bg-zinc-800 hover:bg-zinc-600'}`} />
               })}
            </div>
            {currentIndex === quizData.questions.length - 1 ? (
               <button onClick={requestSubmit} disabled={isSubmittingToDB} className="flex items-center gap-1.5 md:gap-2 px-4 md:px-8 py-2.5 md:py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm md:text-[15px] tracking-wide rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"><span className="hidden sm:inline">Finalize</span> <Send size={16} /></button>
            ) : (
               <button onClick={handleNext} className="flex items-center gap-1.5 md:gap-2 px-4 md:px-8 py-2.5 md:py-3.5 bg-white text-zinc-950 font-bold text-sm md:text-[15px] tracking-wide rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98]"><span className="hidden sm:inline">Next</span> <ChevronRight size={18} /></button>
            )}
         </div>
      </footer>
    </div>
  );
}