import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, loginWithGoogle } from "../lib/firebase"; 
import { createClient } from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';
import { 
  Lock, KeyRound, ShieldAlert, ChevronRight, CheckCircle2, 
  LayoutGrid, AlertOctagon, Trophy, Loader2, SearchX, 
  Calendar, Info, Check, X, Plus, Trash2, Edit3, CloudLightning, 
  HelpCircle, Link as LinkIcon, Copy, Fingerprint, Activity, Globe,
  Hash, BarChart, AlertTriangle, Users, Target, Medal, Clock, Eye
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Types ---
interface QuizOption { id: string; text: string; }
interface QuizQuestion { dbId?: string; text: string; isMultipleChoice: boolean; options: QuizOption[]; correctOptions: string[]; }
interface QuizData { dbId?: string; title: string; startTime: string; endTime: string; maxWarnings: number; questions: QuizQuestion[]; }

interface Submission {
  id: string;
  display_name: string;
  email: string;
  score: number;
  total_questions: number;
  time_taken_seconds: number;
  warnings_hit: number;
  created_at: string;
}

const toLocalDatetime = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Helper to format time in results modal
const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
};

// Helper to generate 4 unique default options
const generateDefaultOptions = (): QuizOption[] => {
    const baseId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    return [
        { id: `o1_${baseId}`, text: "" },
        { id: `o2_${baseId}`, text: "" },
        { id: `o3_${baseId}`, text: "" },
        { id: `o4_${baseId}`, text: "" }
    ];
};

// Reusable Markdown Styling for Live Previews
const markdownComponents = {
    pre: ({node, ...props}: any) => <pre className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl overflow-x-auto my-3 text-[13px] leading-snug font-mono text-zinc-300 shadow-inner" {...props} />,
    code: ({node, inline, ...props}: any) => inline 
        ? <code className="bg-white/10 text-sky-300 px-1.5 py-0.5 rounded-md font-mono text-[0.9em]" {...props} /> 
        : <code {...props} />,
    p: ({node, ...props}: any) => <p className="mb-2 last:mb-0" {...props} />,
    strong: ({node, ...props}: any) => <strong className="font-extrabold text-white" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-6 my-2 space-y-1" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />
};

export default function QuizForge() {
  const navigate = useNavigate();
  
  // --- Auth & Access States ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  // Captcha States
  const [captchaA, setCaptchaA] = useState(Math.floor(Math.random() * 10) + 1);
  const [captchaB, setCaptchaB] = useState(Math.floor(Math.random() * 10) + 1);
  const [userCaptcha, setUserCaptcha] = useState('');
  const [captchaErrorMsg, setCaptchaErrorMsg] = useState('');

  // --- Forge States ---
  const [quizView, setQuizView] = useState<"manager" | "editor">("manager");
  const [existingQuizzes, setExistingQuizzes] = useState<any[]>([]);
  const [isDeployingQuiz, setIsDeployingQuiz] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // --- Success Modal States ---
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // --- Results Modal States ---
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [activeResults, setActiveResults] = useState<Submission[]>([]);
  const [activeQuizTitle, setActiveQuizTitle] = useState("");
  const [activeMaxWarnings, setActiveMaxWarnings] = useState(3);
  const [isFetchingResults, setIsFetchingResults] = useState(false);

  const defaultStart = new Date();
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000); 

  const [quizForm, setQuizForm] = useState<QuizData>({
      title: "", 
      startTime: toLocalDatetime(defaultStart.toISOString()), 
      endTime: toLocalDatetime(defaultEnd.toISOString()), 
      maxWarnings: 3, 
      questions: [{ text: "", isMultipleChoice: false, options: generateDefaultOptions(), correctOptions: [] }]
  });

  // --- 1. AUTHENTICATION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser && isUnlocked) loadMyQuizzes(currentUser.uid);
    });
    return () => unsubscribe();
  }, [isUnlocked]);

  // --- 2. DATA FETCHING (ISOLATED) ---
  const loadMyQuizzes = async (uid: string) => {
      setQuizView("manager");
      const { data } = await supabase.from('quizzes').select('*').eq('creator_uid', uid).order('created_at', { ascending: false });
      if (data) setExistingQuizzes(data);
  };

  const handleUnlock = async () => {
      setCaptchaErrorMsg('');
      
      if (parseInt(userCaptcha) !== captchaA + captchaB) {
          setCaptchaErrorMsg("Incorrect Captcha. Are you a bot?");
          setCaptchaA(Math.floor(Math.random() * 10) + 1);
          setCaptchaB(Math.floor(Math.random() * 10) + 1);
          setUserCaptcha('');
          setPasscodeInput('');
          return;
      }

      setIsVerifying(true);

      try {
          const { data, error } = await supabase
              .from('system_secrets') 
              .select('client_secret')
              .eq('id', 'FORGE_PASSCODE') 
              .maybeSingle();

          if (error) console.error("Database error:", error);

          const dbPasscode = data?.client_secret || import.meta.env.VITE_FORGE_PASSCODE;

          if (passcodeInput === dbPasscode) {
              setIsUnlocked(true);
              if (user) loadMyQuizzes(user.uid);
          } else {
              setPasscodeError(true);
              setTimeout(() => setPasscodeError(false), 500); 
              setPasscodeInput('');
              setUserCaptcha('');
              setCaptchaA(Math.floor(Math.random() * 10) + 1);
              setCaptchaB(Math.floor(Math.random() * 10) + 1);
          }
      } catch (err) {
          console.error("Auth check failed", err);
          alert("Matrix connection failed. Cannot verify passcode.");
      } finally {
          setIsVerifying(false);
      }
  };

  // --- 3. QUIZ FORGE LOGIC ---
  const handleEditQuiz = async (quiz: any) => {
      setStatusMsg("Loading Quiz Matrix...");
      const { data: qData } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id);
      
      const loadedQuestions = (qData || []).map(q => ({
          dbId: q.id, text: q.text, isMultipleChoice: q.is_multiple_choice,
          options: q.options, correctOptions: q.correct_options
      }));

      setQuizForm({
          dbId: quiz.id, title: quiz.title, startTime: toLocalDatetime(quiz.start_time),
          endTime: toLocalDatetime(quiz.end_time), maxWarnings: quiz.max_warnings,
          questions: loadedQuestions.length > 0 ? loadedQuestions : [{ text: "", isMultipleChoice: false, options: generateDefaultOptions(), correctOptions: [] }]
      });
      setQuizView("editor");
      setStatusMsg("");
  };

  const handleDeleteQuiz = async (id: string) => {
      if(!window.confirm("CRITICAL WARNING: Purge this quiz from the matrix? All submissions will be permanently lost.")) return;
      await supabase.from('quizzes').delete().eq('id', id);
      if (user) loadMyQuizzes(user.uid);
      setStatusMsg("Module Purged"); setTimeout(()=>setStatusMsg(""), 2000);
  };

  const handleViewResults = async (quiz: any) => {
      setIsFetchingResults(true);
      setActiveQuizTitle(quiz.title);
      setActiveMaxWarnings(quiz.max_warnings);
      setShowResultsModal(true);

      try {
          const { data, error } = await supabase
              .from('quiz_submissions')
              .select('*')
              .eq('quiz_id', quiz.id);

          if (data) {
              const sorted = data.sort((a, b) => {
                  if (b.score !== a.score) return b.score - a.score;
                  return a.time_taken_seconds - b.time_taken_seconds;
              });
              setActiveResults(sorted);
          }
      } catch (err) {
          console.error("Failed to load results", err);
      } finally {
          setIsFetchingResults(false);
      }
  };

  const handleDeployQuiz = async () => {
      if(!quizForm.title || !quizForm.startTime || !quizForm.endTime) return alert("Title and Schedule times are strictly required.");
      if(!user) return alert("Authentication error.");
  
      for (let i = 0; i < quizForm.questions.length; i++) {
          if (quizForm.questions[i].correctOptions.length === 0) {
              return alert(`Question ${i + 1} has no correct option selected! Please mark at least one correct answer.`);
          }
      }
  
      setIsDeployingQuiz(true);
      setStatusMsg("Encrypting and Deploying...");
  
      try {
          const startISO = new Date(quizForm.startTime).toISOString();
          const endISO = new Date(quizForm.endTime).toISOString();
          let currentQuizId = quizForm.dbId;
          let assignedCode = "";
  
          if (currentQuizId) {
              await supabase.from('quizzes').update({ 
                  title: quizForm.title, start_time: startISO, end_time: endISO, max_warnings: quizForm.maxWarnings 
              }).eq('id', currentQuizId);
              
              const { data: existingData } = await supabase.from('quizzes').select('join_code').eq('id', currentQuizId).single();
              assignedCode = existingData?.join_code || "XXXXXX";
          } else {
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
              for (let i = 0; i < 6; i++) assignedCode += chars.charAt(Math.floor(Math.random() * chars.length));
  
              const { data } = await supabase.from('quizzes').insert([{ 
                  title: quizForm.title, start_time: startISO, end_time: endISO, max_warnings: quizForm.maxWarnings,
                  creator_uid: user.uid, join_code: assignedCode
              }]).select();
              currentQuizId = data![0].id;
              setQuizForm(prev => ({...prev, dbId: currentQuizId}));
          }
  
          await supabase.from('quiz_questions').delete().eq('quiz_id', currentQuizId);
          const questionsToInsert = quizForm.questions.map(q => ({
              quiz_id: currentQuizId, text: q.text, is_multiple_choice: q.isMultipleChoice,
              options: q.options, correct_options: q.correctOptions
          }));
  
          if (questionsToInsert.length > 0) {
              await supabase.from('quiz_questions').insert(questionsToInsert);
          }
  
          setGeneratedLink(`https://algolib.netlify.app/quiz/${currentQuizId}`);
          setGeneratedCode(assignedCode);
          setShowSuccessModal(true);
          
          if (user) loadMyQuizzes(user.uid);
      } catch (err) {
          alert("Deployment failed. Check matrix connection.");
      } finally {
          setIsDeployingQuiz(false);
          setStatusMsg("");
      }
  };

  const copyLinkToClipboard = () => {
      navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  // Form Builders
  const updateQuizQ = (qIndex: number, field: string, value: any) => {
      const nq = [...quizForm.questions];
      nq[qIndex] = { ...nq[qIndex], [field]: value };
      if (field === 'isMultipleChoice' && value === false && nq[qIndex].correctOptions.length > 1) {
          nq[qIndex].correctOptions = [nq[qIndex].correctOptions[0]];
      }
      setQuizForm({...quizForm, questions: nq});
  };

  const toggleCorrectOption = (qIndex: number, optId: string) => {
      const q = quizForm.questions[qIndex];
      let newCorrect = [...q.correctOptions];
      if (q.isMultipleChoice) {
          if (newCorrect.includes(optId)) newCorrect = newCorrect.filter(id => id !== optId);
          else newCorrect.push(optId);
      } else newCorrect = [optId];
      updateQuizQ(qIndex, 'correctOptions', newCorrect);
  };

  const addOption = (qIndex: number) => {
      const q = quizForm.questions[qIndex];
      updateQuizQ(qIndex, 'options', [...q.options, { id: `o_${Date.now()}_${Math.random().toString(36).substring(2,7)}`, text: "" }]);
  };

  const removeOption = (qIndex: number, oIndex: number, optId: string) => {
      const q = quizForm.questions[qIndex];
      if (q.options.length <= 2) return; 
      
      const newOpts = q.options.filter((_, i) => i !== oIndex);
      const newCorr = q.correctOptions.filter(id => id !== optId);
      updateQuizQ(qIndex, 'options', newOpts);
      updateQuizQ(qIndex, 'correctOptions', newCorr);
  };

  const addNewQuestion = () => {
      setQuizForm({
          ...quizForm, 
          questions: [
              ...quizForm.questions, 
              { text: "", isMultipleChoice: false, options: generateDefaultOptions(), correctOptions: [] }
          ]
      });
  };

  const inputClass = "w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 text-sm text-zinc-100 transition-all placeholder:text-zinc-600 shadow-inner";
  const labelClass = "text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block";

  // --- STATS CALCULATION FOR MODAL ---
  const averageScore = activeResults.length > 0 
    ? (activeResults.reduce((acc, sub) => acc + sub.score, 0) / activeResults.length).toFixed(1)
    : 0;
  const totalQuestions = activeResults.length > 0 ? activeResults[0].total_questions : 0;


  // --- UI CONDITIONAL RENDERS ---

  if (isAuthLoading) {
    return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-zinc-400 gap-4"><Loader2 className="animate-spin text-indigo-500" size={40} /> <p className="text-sm font-medium tracking-wide uppercase text-zinc-500">Verifying Identity Protocol</p></div>;
  }

  // --- PREMIUM SAAS LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white relative overflow-hidden">
         <Navbar />
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
         <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-indigo-600/15 blur-[150px] rounded-full pointer-events-none"></div>

         <div className="relative z-10 flex flex-col items-center w-full max-w-5xl px-6 pt-20">
            <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
               <Fingerprint size={40} className="text-indigo-400" />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">Secure Assessment Forge</h1>
            <p className="text-zinc-400 text-lg mb-12 text-center max-w-2xl leading-relaxed">Enterprise-grade infrastructure for deploying proctored exams, technical assessments, and data-driven quizzes to the global matrix.</p>
            <button onClick={loginWithGoogle} className="group relative px-8 py-4 bg-white text-zinc-950 font-bold rounded-2xl transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] hover:scale-[1.02] flex items-center gap-3 text-lg"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" /> Authenticate to Access Forge</button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full">
                <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl shadow-lg backdrop-blur-sm"><ShieldAlert size={24} className="text-indigo-400 mb-4" /><h3 className="font-bold text-white mb-2">Strict Proctoring</h3><p className="text-sm text-zinc-500 leading-relaxed">Automated telemetry tracking for tab-switching, focus loss, and environment tampering.</p></div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl shadow-lg backdrop-blur-sm"><Activity size={24} className="text-emerald-400 mb-4" /><h3 className="font-bold text-white mb-2">Live Telemetry</h3><p className="text-sm text-zinc-500 leading-relaxed">Gather precise analytics on attempt durations, score distributions, and violation hits.</p></div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl shadow-lg backdrop-blur-sm"><Globe size={24} className="text-sky-400 mb-4" /><h3 className="font-bold text-white mb-2">Instant Deployment</h3><p className="text-sm text-zinc-500 leading-relaxed">Publish secure assessments to the web instantly with encrypted, time-locked access links.</p></div>
            </div>
         </div>
      </div>
    );
  }

  // --- PASSCODE LOCK SCREEN ---
  if (!isUnlocked) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white px-6 relative overflow-hidden">
          <Navbar />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-rose-500/10 blur-[150px] rounded-full pointer-events-none"></div>

          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
            className="max-w-sm w-full bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/[0.08] p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.4)] text-center relative z-10"
          >
             <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(225,29,72,0.15)]"><Lock size={36} className="text-rose-500" /></div>
             <h1 className="text-2xl font-bold mb-2 tracking-tight">Authorized Personnel Only</h1>
             <p className="text-zinc-500 text-sm mb-6 leading-relaxed">Solve the captcha and enter the passcode to access your secure Quiz Dashboard.</p>
             
             {captchaErrorMsg && <p className="text-xs text-rose-400 font-bold mb-4 bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">{captchaErrorMsg}</p>}

             <div className="flex items-center gap-3 mb-4">
                 <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-lg font-mono font-bold text-zinc-300 w-1/2 flex justify-center items-center select-none shadow-inner">
                     {captchaA} + {captchaB}
                 </div>
                 <input 
                    type="number" 
                    value={userCaptcha}
                    onChange={(e) => setUserCaptcha(e.target.value)}
                    placeholder="="
                    className="w-1/2 bg-black/50 border border-white/[0.1] rounded-2xl px-4 py-3 outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 text-center text-xl font-bold text-white transition-all shadow-inner"
                 />
             </div>

             <motion.div animate={passcodeError ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
                 <input 
                    type="password" 
                    value={passcodeInput} 
                    onChange={(e) => setPasscodeInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    placeholder="••••••••" 
                    className="w-full bg-black/50 border border-white/[0.1] rounded-2xl px-4 py-3 outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 text-center text-2xl tracking-[0.2em] text-white placeholder:text-zinc-700 placeholder:tracking-normal placeholder:text-base transition-all mb-6 shadow-inner"
                 />
             </motion.div>

             <button 
                onClick={handleUnlock} 
                disabled={isVerifying || !userCaptcha || !passcodeInput}
                className="w-full py-4 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-2xl transition-colors shadow-[0_0_25px_rgba(225,29,72,0.4)] flex items-center justify-center gap-2 text-lg tracking-wide disabled:opacity-50"
             >
                {isVerifying ? <Loader2 className="animate-spin" size={20} /> : <KeyRound size={20} />} 
                {isVerifying ? "Verifying..." : "Validate"}
             </button>
          </motion.div>
        </div>
      );
  }

  // --- AUTHORIZED FORGE UI ---
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 font-sans relative overflow-x-hidden">
      <Navbar />
      <div className="fixed top-0 left-0 w-full h-[500px] bg-indigo-500/5 blur-[150px] pointer-events-none rounded-full translate-x-1/4 -translate-y-1/4"></div>

      {/* --- SUCCESS MODAL --- */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="max-w-lg w-full bg-[#111] border border-white/[0.08] p-10 rounded-[2.5rem] shadow-2xl text-center">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">Deployment Successful!</h2>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Your assessment module is now live. Share the team code or secure link below.</p>
                
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 mb-6 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 blur-[30px] rounded-full pointer-events-none"></div>
                    <p className="text-indigo-300/80 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">6-Digit Team Code</p>
                    <p className="text-5xl font-mono font-bold text-white tracking-[0.25em]">{generatedCode}</p>
                </div>
                
                <div className="bg-black/60 border border-white/[0.05] rounded-2xl p-4 flex items-center justify-between gap-4 mb-8 shadow-inner">
                    <div className="flex items-center gap-3 overflow-hidden text-zinc-300">
                        <LinkIcon size={18} className="text-zinc-500 shrink-0" />
                        <span className="text-sm font-mono truncate select-all">{generatedLink}</span>
                    </div>
                    <button 
                        onClick={copyLinkToClipboard}
                        className="p-2.5 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-colors shrink-0 text-white"
                        title="Copy to Clipboard"
                    >
                        {isCopied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                </div>

                <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                   Acknowledge & Continue
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- RESULTS MODAL --- */}
      <AnimatePresence>
        {showResultsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-6">
             <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} className="max-w-5xl w-full max-h-[90vh] bg-[#0a0a0a] border border-white/[0.08] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative">
                
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-white/[0.05] flex justify-between items-center bg-black/40 sticky top-0 z-10">
                   <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                         <Activity className="text-indigo-500" size={28} /> {activeQuizTitle}
                      </h2>
                   </div>
                   <button onClick={() => setShowResultsModal(false)} className="p-3 bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded-xl transition-colors">
                      <X size={24} />
                   </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                   {isFetchingResults ? (
                       <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
                           <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} /> 
                           <p className="text-sm font-medium tracking-wide uppercase">Compiling Telemetry...</p>
                       </div>
                   ) : (
                       <>
                           {/* Top Level Stats */}
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
                               <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl flex flex-col shadow-inner">
                                   <div className="flex items-center gap-3 text-zinc-500 mb-2"><Users size={18} /><span className="text-[11px] font-bold uppercase tracking-wider">Total Attempts</span></div>
                                   <span className="text-4xl font-mono font-bold text-white tracking-tight">{activeResults.length}</span>
                               </div>
                               <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl flex flex-col shadow-inner">
                                   <div className="flex items-center gap-3 text-indigo-400 mb-2"><Target size={18} /><span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400/80">Avg Score</span></div>
                                   <span className="text-4xl font-mono font-bold text-white tracking-tight">{averageScore} <span className="text-lg text-zinc-600 font-normal">/ {totalQuestions}</span></span>
                               </div>
                               <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl flex flex-col shadow-inner">
                                   <div className="flex items-center gap-3 text-amber-500 mb-2"><Trophy size={18} /><span className="text-[11px] font-bold uppercase tracking-wider text-amber-500/80">Highest Score</span></div>
                                   <span className="text-4xl font-mono font-bold text-white tracking-tight">{activeResults.length > 0 ? activeResults[0].score : 0} <span className="text-lg text-zinc-600 font-normal">/ {totalQuestions}</span></span>
                               </div>
                           </div>

                           {/* Leaderboard Table */}
                           <div className="border border-white/[0.05] rounded-3xl overflow-hidden bg-black/40">
                               <div className="overflow-x-auto">
                                   <table className="w-full text-left border-collapse">
                                       <thead>
                                           <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                               <th className="py-4 px-6 font-bold text-zinc-500 text-[11px] uppercase tracking-widest w-20 text-center">Rank</th>
                                               <th className="py-4 px-6 font-bold text-zinc-500 text-[11px] uppercase tracking-widest">Candidate</th>
                                               <th className="py-4 px-6 font-bold text-zinc-500 text-[11px] uppercase tracking-widest">Score</th>
                                               <th className="py-4 px-6 font-bold text-zinc-500 text-[11px] uppercase tracking-widest hidden sm:table-cell">Duration</th>
                                               <th className="py-4 px-6 font-bold text-zinc-500 text-[11px] uppercase tracking-widest text-center">Violations</th>
                                           </tr>
                                       </thead>
                                       <tbody>
                                           {activeResults.length === 0 ? (
                                               <tr>
                                                   <td colSpan={5} className="py-16 text-center">
                                                       <SearchX size={40} className="text-zinc-600 mx-auto mb-3" />
                                                       <p className="text-zinc-500 font-medium">No submissions recorded yet.</p>
                                                   </td>
                                               </tr>
                                           ) : (
                                               activeResults.map((sub, index) => {
                                                   const isTop3 = index < 3;
                                                   let rankColor = "text-zinc-500 font-mono";
                                                   if (index === 0) rankColor = "text-amber-400 font-bold text-lg drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]";
                                                   if (index === 1) rankColor = "text-zinc-300 font-bold text-lg drop-shadow-[0_0_10px_rgba(212,212,216,0.5)]";
                                                   if (index === 2) rankColor = "text-amber-700 font-bold text-lg drop-shadow-[0_0_10px_rgba(180,83,9,0.5)]";

                                                   return (
                                                       <motion.tr 
                                                           initial={{ opacity: 0, y: 10 }}
                                                           animate={{ opacity: 1, y: 0 }}
                                                           transition={{ delay: index * 0.05 }}
                                                           key={sub.id} 
                                                           className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group"
                                                       >
                                                           <td className="py-4 px-6 text-center">
                                                               {isTop3 ? <div className="flex justify-center"><Medal className={rankColor} size={20} /></div> : <span className={rankColor}>#{index + 1}</span>}
                                                           </td>
                                                           <td className="py-4 px-6">
                                                               <p className="font-bold text-white text-sm">{sub.display_name}</p>
                                                               <p className="text-xs text-zinc-500 truncate max-w-[150px] md:max-w-none">{sub.email}</p>
                                                           </td>
                                                           <td className="py-4 px-6">
                                                               <div className="flex items-end gap-1">
                                                                   <span className="text-lg font-bold text-white">{sub.score}</span>
                                                                   <span className="text-xs text-zinc-500 mb-1">/ {sub.total_questions}</span>
                                                               </div>
                                                           </td>
                                                           <td className="py-4 px-6 hidden sm:table-cell">
                                                               <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm">
                                                                   <Clock size={14} /> {formatTime(sub.time_taken_seconds)}
                                                               </div>
                                                           </td>
                                                           <td className="py-4 px-6 text-center">
                                                               <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                                                                   sub.warnings_hit === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                   sub.warnings_hit >= activeMaxWarnings ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                                   'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                               }`}>
                                                                   <AlertTriangle size={12} /> {sub.warnings_hit}
                                                               </span>
                                                           </td>
                                                       </motion.tr>
                                                   );
                                               })
                                           )}
                                       </tbody>
                                   </table>
                               </div>
                           </div>
                       </>
                   )}
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-32 pb-20 px-4 md:px-6 container mx-auto max-w-6xl relative z-10">
        
        {/* HEADER & TABS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <ShieldAlert size={28} className="text-indigo-500" /> Quiz Dashboard
                </h1>
                <p className="text-zinc-500 text-sm mt-1">Design, schedule, and deploy secure assessments.</p>
            </div>
            
            <div className="flex bg-[#0a0a0a]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/[0.08] shadow-lg w-fit">
                <button onClick={() => setQuizView("manager")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${quizView === 'manager' ? 'bg-indigo-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>My Quizzes</button>
                <button onClick={() => { setQuizForm({title: "", startTime: toLocalDatetime(defaultStart.toISOString()), endTime: toLocalDatetime(defaultEnd.toISOString()), maxWarnings: 3, questions: [{ text: "", isMultipleChoice: false, options: generateDefaultOptions(), correctOptions: [] }]}); setQuizView("editor"); }} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${quizView === 'editor' ? 'bg-indigo-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>Create New</button>
            </div>
        </div>

        {quizView === "manager" ? (
            // --- MANAGER VIEW ---
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/[0.06] p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3"><LayoutGrid size={20} className="text-indigo-400"/> Your Deployed Quizes</h3>
                
                {existingQuizzes.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl">
                        <HelpCircle size={48} className="text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400 font-medium text-lg mb-1">No quizzes found.</p>
                        <p className="text-zinc-500 text-sm">Create your first assessment module to see it here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {existingQuizzes.map(q => (
                            <div key={q.id} className="p-6 bg-black/40 border border-white/[0.06] rounded-[1.5rem] hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-lg font-bold text-white tracking-tight">{q.title}</h4>
                                    
                                    {/* ALWAYS VISIBLE ACTION BUTTONS */}
                                    <div className="flex gap-2">
                                        <button onClick={() => handleViewResults(q)} className="p-2 bg-white/5 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-colors" title="View Results"><BarChart size={16}/></button>
                                        <button onClick={() => handleEditQuiz(q)} className="p-2 bg-white/5 text-sky-400 hover:bg-sky-500/20 rounded-xl transition-colors" title="Edit Quiz"><Edit3 size={16}/></button>
                                        <button onClick={() => handleDeleteQuiz(q.id)} className="p-2 bg-white/5 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors" title="Delete Quiz"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono"><Hash size={14}/> {q.join_code || q.id.substring(0, 8)}</div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-400"><Calendar size={14}/> {new Date(q.start_time).toLocaleString()}</div>
                                    <div className="flex items-center gap-2 text-xs text-amber-500/80"><AlertTriangle size={14}/> Max Warnings: {q.max_warnings}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        ) : (
            // --- EDITOR VIEW ---
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                
                {/* Quiz Meta */}
                <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/[0.06] p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3"><Calendar size={20} className="text-indigo-400"/> Core Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2"><label className={labelClass}>Assessment Title</label><input value={quizForm.title} onChange={(e) => setQuizForm({...quizForm, title: e.target.value})} className={inputClass} placeholder="e.g. Midterm Advanced Algorithms" /></div>
                      <div><label className={labelClass}>Start Time (Strict Opening)</label><input type="datetime-local" value={quizForm.startTime} onChange={(e) => setQuizForm({...quizForm, startTime: e.target.value})} className={`${inputClass} [color-scheme:dark]`} /></div>
                      <div><label className={labelClass}>End Time (Auto Submit)</label><input type="datetime-local" value={quizForm.endTime} onChange={(e) => setQuizForm({...quizForm, endTime: e.target.value})} className={`${inputClass} [color-scheme:dark]`} /></div>
                      <div className="md:col-span-2"><label className={labelClass}>Proctoring Threshold (Max Warnings)</label><input type="number" value={quizForm.maxWarnings} onChange={(e) => setQuizForm({...quizForm, maxWarnings: Number(e.target.value)})} className={inputClass} /></div>
                  </div>
                </div>

                {/* Questions Array */}
                <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/[0.06] p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
                    <div className="flex justify-between items-center mb-8 border-b border-white/[0.05] pb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3"><HelpCircle size={20} className="text-sky-400"/> Data Modules</h3>
                        <button onClick={addNewQuestion} className="px-4 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-inner"><Plus size={16}/> Add Question</button>
                    </div>

                    <div className="space-y-8">
                        {quizForm.questions.map((q, qIndex) => (
                            <div key={qIndex} className="p-8 bg-black/40 border border-white/[0.08] rounded-[2rem] relative shadow-inner">
                                <div className="absolute top-6 right-6 flex gap-3 items-center">
                                    <span className="text-xs font-bold text-zinc-500 bg-white/5 px-3 py-1 rounded-lg">Q{qIndex + 1}</span>
                                    <button onClick={() => setQuizForm({...quizForm, questions: quizForm.questions.filter((_, i) => i !== qIndex)})} className="text-zinc-600 hover:text-rose-400 transition-colors bg-white/5 p-1.5 rounded-lg" title="Delete Question"><Trash2 size={16}/></button>
                                </div>
                                
                                <div className="mb-6 pr-20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <label className={`${labelClass} !mb-0`}>Question Syntax</label>
                                        <span className="text-[9px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded font-mono">Markdown Supported</span>
                                    </div>
                                    <textarea value={q.text} onChange={(e) => updateQuizQ(qIndex, 'text', e.target.value)} rows={3} className={`${inputClass} mb-4 text-[13px] font-mono leading-relaxed resize-y`} placeholder="Enter the problem statement... (e.g., Use **bold**, or code blocks ```cpp ... ```)" />
                                    
                                    {/* Question Live Preview */}
                                    {q.text && (
                                        <div className="mb-6 p-5 bg-black/60 border border-white/5 rounded-2xl shadow-inner">
                                            <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                                                <Eye size={12} /> Live Question Preview
                                            </div>
                                            <div className="text-[14px] md:text-[15px] font-medium leading-relaxed text-zinc-300">
                                                <ReactMarkdown components={markdownComponents}>
                                                    {q.text.replace(/\\n/g, '\n')}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    <label className="flex items-center gap-3 text-sm font-medium text-zinc-400 cursor-pointer w-fit hover:text-zinc-200 transition-colors">
                                        <input type="checkbox" checked={q.isMultipleChoice} onChange={(e) => updateQuizQ(qIndex, 'isMultipleChoice', e.target.checked)} className="w-4 h-4 rounded bg-zinc-900 border-white/20 text-indigo-500 focus:ring-indigo-500/50" /> Allow Multiple Correct Answers
                                    </label>
                                </div>

                                <div className="space-y-4 bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <label className={`${labelClass} !mb-0`}>Options</label> 
                                            <span className="text-[9px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded font-mono">Markdown Supported</span>
                                        </div>
                                        <button onClick={() => addOption(qIndex)} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"><Plus size={14}/> Add Option</button>
                                    </div>
                                    
                                    {q.options.map((opt, oIndex) => {
                                        const isCorrect = q.correctOptions.includes(opt.id);
                                        const letter = String.fromCharCode(65 + oIndex); // A, B, C, D...
                                        return (
                                            <div key={opt.id} className="flex flex-col gap-2 group mb-4 last:mb-0">
                                                <div className="flex items-start gap-4">
                                                    <button 
                                                        onClick={() => toggleCorrectOption(qIndex, opt.id)} 
                                                        className={`mt-1.5 w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all shrink-0 ${isCorrect ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-black' : 'bg-zinc-900/50 border-white/10 text-transparent hover:border-white/30'}`}
                                                        title="Mark as correct answer"
                                                    >
                                                        <Check size={16} strokeWidth={3} />
                                                    </button>
                                                    
                                                    <div className="relative flex-1 flex items-start">
                                                        <div className="absolute left-4 top-3 text-zinc-500 font-bold text-sm pointer-events-none">{letter}.</div>
                                                        {/* Replaced input with textarea for code blocks support */}
                                                        <textarea 
                                                            rows={1}
                                                            value={opt.text} 
                                                            onChange={(e) => { 
                                                                const newOpts = [...q.options]; 
                                                                newOpts[oIndex].text = e.target.value; 
                                                                updateQuizQ(qIndex, 'options', newOpts); 
                                                            }} 
                                                            className={`${inputClass} py-3 pl-10 resize-y font-mono text-[13px] leading-relaxed min-h-[46px]`} 
                                                            placeholder={`Enter option details...`} 
                                                        />
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={() => removeOption(qIndex, oIndex, opt.id)} 
                                                        disabled={q.options.length <= 2}
                                                        className="mt-1.5 text-zinc-600 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-zinc-600 transition-all p-2 bg-white/5 rounded-xl shrink-0"
                                                        title={q.options.length <= 2 ? "Minimum 2 options required" : "Remove Option"}
                                                    >
                                                        <X size={16}/>
                                                    </button>
                                                </div>

                                                {/* Option Live Preview */}
                                                {opt.text && (
                                                    <div className="ml-[3.25rem] mr-[2.75rem] p-3 bg-black/40 border border-white/5 rounded-xl text-[13px] text-zinc-300">
                                                        <ReactMarkdown components={markdownComponents}>
                                                            {opt.text.replace(/\\n/g, '\n')}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={handleDeployQuiz} disabled={isDeployingQuiz} className="w-full py-5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-lg rounded-[1.5rem] transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] flex justify-center gap-3 disabled:opacity-50">
                    {isDeployingQuiz ? <Loader2 className="animate-spin" size={24}/> : <CloudLightning size={24} />} 
                    {isDeployingQuiz ? "Encrypting Matrix..." : "Deploy Assessment to Mainframe"}
                </button>
            </motion.div>
        )}
      </main>
    </div>
  );
}