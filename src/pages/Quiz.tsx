import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, loginWithGoogle } from "../lib/firebase"; 
import { createClient } from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';
import { 
  AlertTriangle, Clock, ShieldAlert, ChevronRight, 
  ChevronLeft, Send, CheckCircle2, LayoutGrid, AlertOctagon, Maximize, Trophy, Target, Loader2, Lock, SearchX, Calendar, Info, Check
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface QuizOption { id: string; text: string; }
interface QuizQuestion { id: string; text: string; isMultipleChoice: boolean; options: QuizOption[]; correctOptions: string[]; }
interface QuizData { id: string; title: string; startTime: string; endTime: string; maxWarnings: number; questions: QuizQuestion[]; }

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
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  
  const [warnings, setWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningReason, setWarningReason] = useState("");
  const [finalScore, setFinalScore] = useState(0);
  
  const strikeCooldown = useRef(false);
  const isIntentionalExit = useRef(false); 
  const warningsRef = useRef(0); 

  // --- 1. AUTHENTICATION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setEligibility('unauthenticated');
    });
    return () => unsubscribe();
  }, []);

  // --- 2. FETCH QUIZ & ELIGIBILITY ---
  useEffect(() => {
    const initializeArena = async () => {
        if (!user) return;
        if (!quizId) { setEligibility('not_found'); return; }

        try {
            const { data: existingSubmission } = await supabase
                .from('quiz_submissions')
                .select('id, score')
                .eq('user_uid', user.uid)
                .eq('quiz_id', quizId)
                .maybeSingle();

            if (existingSubmission) {
                setFinalScore(existingSubmission.score);
                setEligibility('denied');
                setIsSubmitted(true);
                return;
            }

            const { data: qData, error: qError } = await supabase.from('quizzes').select('*').eq('id', quizId).maybeSingle();
            if (qError || !qData) { setEligibility('not_found'); return; }

            const { data: questionsData } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId);
            
            const formattedQuestions = (questionsData || []).map(q => ({
                id: q.id, text: q.text, isMultipleChoice: q.is_multiple_choice,
                options: q.options, correctOptions: q.correct_options
            }));

            const mockStart = new Date(Date.now() - 5 * 60000).toISOString(); 
            const mockEnd = new Date(Date.now() + (qData.duration_seconds || 900) * 1000).toISOString(); 

            setQuizData({
                id: qData.id, title: qData.title, startTime: qData.start_time || mockStart,
                endTime: qData.end_time || mockEnd, maxWarnings: qData.max_warnings || 3, questions: formattedQuestions
            });

            setEligibility('allowed');
        } catch (error) {
            console.error(error);
            setEligibility('not_found');
        }
    };

    if (user) { setEligibility('loading'); initializeArena(); }
  }, [user, quizId]); 

  // --- 3. SCHEDULE & TIMER LOGIC ---
  useEffect(() => {
    if (!quizData || isSubmitted) return;

    const updateTimer = () => {
        const now = Date.now();
        const start = new Date(quizData.startTime).getTime();
        const end = new Date(quizData.endTime).getTime();

        if (now < start) {
            setQuizStatus('upcoming');
            setTimeRemaining(Math.floor((start - now) / 1000));
        } else if (now >= start && now <= end) {
            setQuizStatus('active');
            setTimeRemaining(Math.floor((end - now) / 1000));
        } else {
            setQuizStatus('ended');
            setTimeRemaining(0);
            if (hasStarted && !isSubmitted && !isIntentionalExit.current) {
                isIntentionalExit.current = true;
                forceSubmit("The assessment duration has concluded. Auto-submitting your responses.");
            }
        }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [quizData, hasStarted, isSubmitted]);

  // --- 4. PROCTORING & ANTI-CHEAT ---
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
        if (!document.fullscreenElement && !isSubmitted && !isIntentionalExit.current) {
            issueStrike("Exited required fullscreen mode"); 
        }
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

  // --- HANDLERS ---
  const requestSecureEnvironment = async () => {
    if (!user) return alert("Please sign in to take this assessment.");
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setHasStarted(true);
    } catch (err) {
      alert("Browser blocked fullscreen. Please allow fullscreen access to begin.");
    }
  };

  const acknowledgeWarning = () => { setShowWarningModal(false); };

  const handleSelectOption = (questionId: string, optionId: string, isMulti: boolean) => {
    setAnswers(prev => {
        const currentSelections = prev[questionId] || [];
        if (isMulti) {
            if (currentSelections.includes(optionId)) return { ...prev, [questionId]: currentSelections.filter(id => id !== optionId) };
            else return { ...prev, [questionId]: [...currentSelections, optionId] };
        } else {
            return { ...prev, [questionId]: [optionId] };
        }
    });
  };

  const handleNext = () => { if (quizData && currentIndex < quizData.questions.length - 1) setCurrentIndex(currentIndex + 1); };
  const handlePrev = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  const requestSubmit = () => { setShowSubmitConfirm(true); }; 

  const forceSubmit = (reason: string) => { 
    setShowSubmitConfirm(false); 
    alert(reason); 
    finalizeSubmission(); 
  };

  const finalizeSubmission = async () => {
    if (!quizData || !user) return;
    
    isIntentionalExit.current = true; 
    setIsSubmittingToDB(true);
    
    let calculatedScore = 0;
    quizData.questions.forEach(q => {
       const userAns = answers[q.id] || [];
       const correctAns = q.correctOptions || [];
       if (userAns.length === correctAns.length && userAns.every(val => correctAns.includes(val))) calculatedScore += 1;
    });
    
    setFinalScore(calculatedScore);
    const durationTotal = Math.floor((new Date(quizData.endTime).getTime() - new Date(quizData.startTime).getTime()) / 1000);
    const timeTaken = durationTotal - timeRemaining;

    try {
        await supabase.from('quiz_submissions').insert([{
            user_uid: user.uid, display_name: user.displayName || 'Unknown User', email: user.email || 'No Email',
            quiz_id: quizData.id, score: calculatedScore, total_questions: quizData.questions.length,
            warnings_hit: warningsRef.current, 
            time_taken_seconds: timeTaken > 0 ? timeTaken : 0, answers_payload: answers
        }]);
    } catch (error) { console.error("Failed to save submission:", error); }

    setIsSubmittingToDB(false);
    setIsSubmitted(true);
    setShowSubmitConfirm(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };

  // --- FORMATTERS ---
  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatScheduleTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOptionLetter = (index: number) => String.fromCharCode(65 + index); 

  // --- ANIMATION VARIANTS ---
  const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, scale: 0.95, y: 20 }, show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  // --- UI CONDITIONAL RENDERS ---

  if (eligibility === 'loading') {
    return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-zinc-400 gap-4"><Loader2 className="animate-spin text-indigo-500" size={40} /> <p className="text-sm font-medium tracking-wide uppercase text-zinc-500">Initializing Arena</p></div>;
  }

  if (eligibility === 'not_found' || eligibility === 'unauthenticated' || eligibility === 'denied') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white px-6">
         <Navbar />
         <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-zinc-900/40 backdrop-blur-3xl border border-white/[0.08] p-10 rounded-3xl shadow-2xl text-center relative z-10">
            {eligibility === 'not_found' && <SearchX size={56} className="text-zinc-600 mx-auto mb-6" />}
            {eligibility === 'unauthenticated' && <Lock size={56} className="text-indigo-400 mx-auto mb-6" />}
            {eligibility === 'denied' && <CheckCircle2 size={56} className="text-rose-500 mx-auto mb-6" />}
            
            <h1 className="text-2xl font-bold mb-3 tracking-tight">
              {eligibility === 'not_found' ? 'Assessment Not Found' : eligibility === 'unauthenticated' ? 'Sign In Required' : 'Already Attempted'}
            </h1>
            <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
              {eligibility === 'not_found' ? 'The requested module could not be located. Verify the transmission link.' : eligibility === 'unauthenticated' ? 'You must authenticate your identity to access the secure testing arena.' : 'You have already completed this assessment. Multiple attempts are locked by the proctor.'}
            </p>
            
            {eligibility === 'denied' && (
              <div className="bg-black/30 border border-white/[0.05] p-5 rounded-2xl flex flex-col items-center text-center max-w-xs mx-auto mb-8 shadow-inner">
                 <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2">Previous Score</p>
                 <p className="text-4xl font-mono text-white tracking-tighter">{finalScore}</p>
              </div>
            )}

            {eligibility === 'unauthenticated' ? (
               <button onClick={loginWithGoogle} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] text-lg">Authenticate Identity</button>
            ) : (
               <button onClick={() => navigate('/quiz-panel')} className="w-full py-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all text-lg">Return to Dashboard</button>
            )}
         </motion.div>
      </div>
    );
  }

  if (!quizData) return null;

  const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k].length > 0).length;
  const progressPercent = (answeredCount / quizData.questions.length) * 100;

  // --- PRE-QUIZ INSTRUCTIONS ---
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <Navbar />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/[0.06] p-10 md:p-12 rounded-[2rem] shadow-2xl relative z-10 mt-16">
           <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-center tracking-tight text-white">{quizData.title}</h1>
           <p className="text-zinc-400 text-sm md:text-base text-center mb-10 leading-relaxed">Review the assessment parameters. Ensure a stable connection before proceeding.</p>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
               <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 flex items-center gap-4 shadow-inner">
                 <div className="p-3 bg-zinc-800/50 rounded-xl text-zinc-300"><Calendar size={20} /></div>
                 <div><p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">Schedule window</p><p className="text-sm font-medium">{formatScheduleTime(quizData.startTime)} - {formatScheduleTime(quizData.endTime)}</p></div>
               </div>
               <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 flex items-center gap-4 shadow-inner">
                 <div className="p-3 bg-zinc-800/50 rounded-xl text-zinc-300"><LayoutGrid size={20} /></div>
                 <div><p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">Assessment Size</p><p className="text-sm font-medium">{quizData.questions.length} Items</p></div>
               </div>
           </div>

           <div className="flex items-start gap-4 text-sm bg-amber-500/5 p-6 rounded-2xl border border-amber-500/10 mb-10 shadow-inner">
              <Info className="shrink-0 mt-0.5 text-amber-500" size={24} />
              <div className="space-y-2 text-zinc-300">
                  <p className="font-bold text-amber-500 tracking-wide text-base">Proctoring Protocols Active</p>
                  <p className="leading-relaxed text-zinc-400">This is a highly secure environment. Losing focus on this window, accessing external applications, or exiting fullscreen will register as a violation.</p>
                  <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 font-bold rounded mt-2">Allowed Warnings: {quizData.maxWarnings}</div>
              </div>
           </div>

           {quizStatus === 'upcoming' ? (
               <button disabled className="w-full py-5 bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold rounded-2xl flex justify-center items-center gap-2 cursor-not-allowed">
                 Assessment Opens in {formatCountdown(timeRemaining)}
               </button>
           ) : quizStatus === 'ended' ? (
               <button disabled className="w-full py-5 bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold rounded-2xl flex justify-center items-center gap-2 cursor-not-allowed">
                 Assessment Concluded
               </button>
           ) : (
               <button onClick={requestSecureEnvironment} className="w-full py-5 bg-white text-zinc-950 font-bold rounded-2xl hover:bg-zinc-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] flex justify-center items-center gap-2 text-lg">
                 <Maximize size={20} /> Start Assessment
               </button>
           )}
        </motion.div>
      </div>
    );
  }

  // --- POST-QUIZ RESULTS ---
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-6 relative">
        <Navbar />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[500px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none"></div>

        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-2xl w-full bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/[0.06] p-10 md:p-14 rounded-[2rem] shadow-2xl text-center z-10">
           <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]"><CheckCircle2 size={48} className="text-emerald-500" /></div>
           <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Assessment Submitted</h1>
           <p className="text-zinc-400 text-sm md:text-base mb-10 max-w-md mx-auto leading-relaxed">Your responses have been successfully logged. You may now close this window or return to your dashboard.</p>
           
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left mb-10">
             <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl flex flex-col items-center text-center shadow-inner"><Trophy size={24} className="text-amber-400 mb-3"/><p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Final Score</p><p className="text-3xl font-mono text-white tracking-tighter">{finalScore} <span className="text-sm text-zinc-600 font-normal tracking-normal">/ {quizData.questions.length}</span></p></div>
             <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl flex flex-col items-center text-center shadow-inner"><Target size={24} className="text-indigo-400 mb-3"/><p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Attempted</p><p className="text-3xl font-mono text-white tracking-tighter">{answeredCount} <span className="text-sm text-zinc-600 font-normal tracking-normal">/ {quizData.questions.length}</span></p></div>
             <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl flex flex-col items-center text-center shadow-inner"><AlertTriangle size={24} className="text-rose-400 mb-3"/><p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Warnings</p><p className="text-3xl font-mono text-rose-400 tracking-tighter">{warningsRef.current} <span className="text-sm text-rose-500/40 font-normal tracking-normal">/ {quizData.maxWarnings}</span></p></div>
           </div>

           <button onClick={() => navigate('/quiz-panel')} className="w-full py-4 bg-zinc-100 text-zinc-900 font-bold rounded-2xl hover:bg-white transition-all shadow-md text-lg">Return to Dashboard</button>
        </motion.div>
      </div>
    );
  }

  const currentQ = quizData.questions[currentIndex];

  // --- ACTIVE ARENA ---
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans flex flex-col overflow-x-hidden relative">
      <div className="fixed top-0 left-0 w-full h-[500px] bg-indigo-500/10 blur-[150px] pointer-events-none rounded-full translate-x-1/4 -translate-y-1/4"></div>
      <div className="fixed bottom-0 right-0 w-full h-[400px] bg-sky-500/5 blur-[150px] pointer-events-none rounded-full -translate-x-1/4 translate-y-1/4"></div>

      <AnimatePresence>
        
        {/* Anti-Cheat Warning Modal */}
        {showWarningModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-lg p-6">
             <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="max-w-md w-full bg-zinc-950 border border-rose-500/30 p-8 rounded-[2rem] shadow-[0_0_100px_rgba(244,63,94,0.15)] text-center">
                <AlertOctagon size={56} className="text-rose-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Proctoring Alert</h2>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Violation logged: {warningReason}. Continued violations will result in automatic submission.</p>
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 py-3.5 rounded-xl mb-8 font-mono text-sm font-bold tracking-widest uppercase">Warning: {warningsRef.current} of {quizData.maxWarnings}</div>
                <button onClick={acknowledgeWarning} className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl transition-all hover:bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.3)]">Acknowledge</button>
             </motion.div>
          </motion.div>
        )}

        {/* Custom Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
             <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="max-w-sm w-full bg-[#111] border border-white/[0.08] p-8 rounded-[2rem] shadow-2xl text-center">
                <Send size={48} className="text-indigo-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">Confirm Submission</h2>
                <p className="text-zinc-400 text-sm mb-8 leading-relaxed">Are you sure you want to submit your assessment? You will not be able to modify your answers after this.</p>
                <div className="flex flex-col gap-3">
                   <button 
                      onClick={() => { setIsSubmittingToDB(true); finalizeSubmission(); }}
                      disabled={isSubmittingToDB}
                      className="w-full py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                     {isSubmittingToDB ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                     {isSubmittingToDB ? "Submitting..." : "Yes, Submit"}
                   </button>
                   <button 
                      onClick={() => setShowSubmitConfirm(false)}
                      disabled={isSubmittingToDB}
                      className="w-full py-4 bg-white/[0.05] text-white font-semibold rounded-xl hover:bg-white/[0.1] transition-all disabled:opacity-50"
                   >
                     Cancel
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="fixed top-0 left-0 w-full z-40 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/[0.05]">
         <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <span className="font-bold text-[15px] text-zinc-100 tracking-tight">{quizData.title}</span>
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-zinc-500 pr-4 border-r border-white/10 uppercase tracking-widest">
                    <Calendar size={14} /> {formatScheduleTime(quizData.startTime)} - {formatScheduleTime(quizData.endTime)}
                </div>
                <div className={`flex items-center gap-2 text-sm font-bold transition-colors ${timeRemaining < 60 ? 'text-rose-400' : 'text-zinc-200'}`}>
                    <Clock size={16} className={timeRemaining < 60 ? 'animate-pulse' : ''} />
                    <span className="font-mono tracking-wider text-[15px]">{formatCountdown(timeRemaining)}</span>
                </div>
            </div>
         </div>
         <div className="w-full h-[3px] bg-zinc-900">
            <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 shadow-[0_0_15px_rgba(99,102,241,0.8)]" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
         </div>
      </header>

      <main className="flex-1 flex justify-center px-4 md:px-6 pt-24 pb-40 relative z-10 w-full max-w-5xl mx-auto">
         <div className="w-full mt-6 md:mt-12 flex flex-col items-center">
            
            <div className="mb-6 flex flex-col items-center justify-center text-center w-full">
               <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                   <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-500 bg-white/[0.03] border border-white/[0.05] px-4 py-1.5 rounded-full shadow-inner">
                     Question {currentIndex + 1} of {quizData.questions.length}
                   </span>
                   <span className={`text-[11px] font-bold uppercase tracking-[0.1em] px-4 py-1.5 rounded-full shadow-inner border ${currentQ.isMultipleChoice ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-sky-400 bg-sky-500/10 border-sky-500/20'}`}>
                     {currentQ.isMultipleChoice ? "Multi-Select" : "Single Choice"}
                   </span>
               </div>
               
               <AnimatePresence mode="wait">
                 {/* SMALLER FONT, LEFT ALIGNED, WITH MARKDOWN PARSER */}
                 <motion.div 
                    key={`q-${currentIndex}`} 
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}
                    className="text-lg md:text-xl lg:text-2xl font-semibold text-white mb-8 max-w-4xl w-full text-left leading-relaxed"
                 >
                    <ReactMarkdown
                       components={{
                          pre: ({node, ...props}) => <pre className="bg-[#0a0a0a] border border-white/10 p-5 rounded-xl overflow-x-auto my-4 text-[14px] leading-snug font-mono text-zinc-300 shadow-inner" {...props} />,
                          code: ({node, inline, ...props}: any) => inline 
                              ? <code className="bg-white/10 text-sky-300 px-1.5 py-0.5 rounded-md font-mono text-[0.9em]" {...props} /> 
                              : <code {...props} />,
                          p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-extrabold text-white" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-6 my-4 space-y-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-4 space-y-2" {...props} />
                       }}
                    >
                       {/* Unescapes literal \n saved by the database into actual newlines for the parser */}
                       {currentQ.text.replace(/\\n/g, '\n')}
                    </ReactMarkdown>
                 </motion.div>
               </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={`grid-${currentIndex}`}
                variants={containerVariants} 
                initial="hidden" 
                animate="show" 
                className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-4xl mx-auto" 
              >
                {currentQ.options.map((opt, optIndex) => {
                  const currentAnsArray = answers[currentQ.id] || [];
                  const isSelected = currentAnsArray.includes(opt.id);
                  const letter = getOptionLetter(optIndex);

                  return (
                    <motion.button
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, translateY: -2 }}
                      whileTap={{ scale: 0.98 }}
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQ.id, opt.id, currentQ.isMultipleChoice)}
                      className={`relative w-full text-left p-4 md:p-5 rounded-[1.25rem] border-[1.5px] transition-all overflow-hidden group flex items-start gap-4 ${
                        isSelected 
                          ? 'bg-indigo-500/[0.08] border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.15)]' 
                          : 'bg-white/[0.02] border-white/[0.08] hover:border-white/30 hover:bg-white/[0.04] shadow-sm'
                      }`}
                    >
                      <div className={`mt-0.5 w-8 h-8 flex items-center justify-center shrink-0 rounded-xl font-bold text-base transition-colors ${
                          isSelected ? 'bg-indigo-500 text-white' : 'bg-white/10 text-zinc-400 group-hover:bg-white/20 group-hover:text-white'
                      }`}>
                          {letter}
                      </div>

                      <div className={`text-[14px] md:text-[15px] font-medium leading-relaxed transition-colors flex-1 overflow-hidden ${
                          isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'
                      }`}>
                          <ReactMarkdown
                             components={{
                                pre: ({node, ...props}) => <pre className="bg-black/50 border border-white/5 p-3 rounded-lg overflow-x-auto my-2 text-[12px] font-mono text-zinc-300" {...props} />,
                                code: ({node, inline, ...props}: any) => inline 
                                    ? <code className="bg-white/10 text-sky-300 px-1 py-0.5 rounded font-mono text-[0.9em]" {...props} /> 
                                    : <code {...props} />,
                                p: ({node, ...props}) => <p className="mb-0 inline-block w-full" {...props} />
                             }}
                          >
                             {opt.text.replace(/\\n/g, '\n')}
                          </ReactMarkdown>
                      </div>
                      
                      <div className={`mt-1.5 w-5 h-5 flex items-center justify-center shrink-0 transition-all ${currentQ.isMultipleChoice ? 'rounded-md border-2' : 'rounded-full border-2'} ${
                          isSelected ? 'border-indigo-500 bg-indigo-500 opacity-100 scale-100' : 'border-zinc-700 bg-transparent opacity-0 scale-50 group-hover:opacity-50'
                      }`}>
                          {currentQ.isMultipleChoice && <Check size={12} className="text-white stroke-[3]" />}
                          {!currentQ.isMultipleChoice && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
         </div>
      </main>

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[800px] px-4 z-50">
         <div className="bg-[#121212]/90 backdrop-blur-3xl border border-white/[0.1] rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-3 flex items-center justify-between">
            <button onClick={handlePrev} disabled={currentIndex === 0} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold tracking-wide transition-all text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-0">
                <ChevronLeft size={20} /> <span className="hidden sm:inline">Prev</span>
            </button>
            
            <div className="flex gap-2.5 px-4 overflow-x-auto no-scrollbar items-center">
               {quizData.questions.map((q, i) => {
                 const isAns = answers[q.id] && answers[q.id].length > 0;
                 return <button key={q.id} onClick={() => setCurrentIndex(i)} className={`w-3 h-3 rounded-full transition-all shrink-0 ${i === currentIndex ? 'bg-white scale-[1.3] shadow-[0_0_10px_rgba(255,255,255,0.8)]' : isAns ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-zinc-700 hover:bg-zinc-500'}`} />
               })}
            </div>
            
            {currentIndex === quizData.questions.length - 1 ? (
               <button onClick={requestSubmit} disabled={isSubmittingToDB} className="flex items-center gap-2 px-8 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold tracking-wide rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50">
                 <span className="hidden sm:inline">Submit</span> <Send size={18} />
               </button>
            ) : (
               <button onClick={handleNext} className="flex items-center gap-2 px-8 py-3.5 bg-white text-zinc-950 font-bold tracking-wide rounded-xl hover:bg-zinc-200 transition-all shadow-md">
                 <span className="hidden sm:inline">Next</span> <ChevronRight size={20} />
               </button>
            )}
         </div>
      </footer>
    </div>
  );
}