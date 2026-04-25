import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, loginWithGoogle } from "../lib/firebase"; 

import ReactMarkdown from 'react-markdown';
import { 
  ShieldAlert, CheckCircle2, LayoutGrid, Trophy, Loader2, SearchX, 
  Calendar, Check, X, Plus, Trash2, Edit3, CloudLightning, 
  HelpCircle, Link as LinkIcon, Copy, Fingerprint, Activity,
  Hash, BarChart, AlertTriangle, Users, Target, Medal, Clock, 
  CircleDot, CheckSquare, ToggleLeft, Hash as NumIcon, Shield, Terminal, Lock
} from 'lucide-react';
import Navbar from '@/components/Navbar';



// --- Types ---
interface QuizOption { id: string; text: string; }
type QuestionType = 'single' | 'multiple' | 'true_false' | 'numerical';

interface QuizQuestion { 
  dbId?: string; 
  text: string; 
  questionType: QuestionType; 
  options: QuizOption[]; 
  correctOptions: string[]; 
}

interface QuizData { 
  dbId?: string; 
  title: string; 
  startTime: string; 
  endTime: string; 
  maxWarnings: number; 
  questions: QuizQuestion[]; 
}

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

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
};

const generateDefaultOptions = (): QuizOption[] => {
    const baseId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    return [
        { id: `o1_${baseId}`, text: "" },
        { id: `o2_${baseId}`, text: "" },
        { id: `o3_${baseId}`, text: "" },
        { id: `o4_${baseId}`, text: "" }
    ];
};

const createNewQuestion = (): QuizQuestion => ({
    text: "",
    questionType: 'single',
    options: generateDefaultOptions(),
    correctOptions: []
});

export default function QuizForge() {
  const navigate = useNavigate();
  
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [quizView, setQuizView] = useState<"manager" | "editor">("manager");
  const [existingQuizzes, setExistingQuizzes] = useState<any[]>([]);
  const [isDeployingQuiz, setIsDeployingQuiz] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const [showResultsModal, setShowResultsModal] = useState(false);
  const [activeResults, setActiveResults] = useState<Submission[]>([]);
  const [activeQuizTitle, setActiveQuizTitle] = useState("");
  const [activeMaxWarnings, setActiveMaxWarnings] = useState(3);
  const [isFetchingResults, setIsFetchingResults] = useState(false);

  const defaultStart = new Date();
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000); 

  const [quizForm, setQuizForm] = useState<QuizData>({
      dbId: undefined, 
      title: "", 
      startTime: toLocalDatetime(defaultStart.toISOString()), 
      endTime: toLocalDatetime(defaultEnd.toISOString()), 
      maxWarnings: 3, 
      questions: [createNewQuestion()]
  });

  // Listen for Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      // Load user-specific quizzes when authenticated
      if (currentUser) {
        loadMyQuizzes(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch only quizzes matching the user's UID
  const loadMyQuizzes = async (uid: string) => {
      setQuizView("manager");
      const response = await fetch(`/.netlify/functions/get-quizzes?creator_uid=${uid}`);
      if (response.ok) {
          const data = await response.json();
          setExistingQuizzes(data);
      } else {
          console.error("Error loading quizzes");
      }
  };

  const handleEditQuiz = async (quiz: any) => {
      setStatusMsg("Loading Quiz...");
      const response = await fetch(`/.netlify/functions/get-quiz-details?id=${quiz.id}`);
      if (!response.ok) return alert("Failed to load questions. Check your RLS policies.");
      const { questions: qData } = await response.json();

      const loadedQuestions = (qData || []).map((q: any) => {
          let inferredType: QuestionType = q.is_multiple_choice ? 'multiple' : 'single';
          if (!q.options || q.options.length === 0) inferredType = 'numerical';
          else if (q.options.length === 2 && q.options[0].text === 'True' && q.options[1].text === 'False') inferredType = 'true_false';

          return {
              dbId: q.id, text: q.text, questionType: inferredType,
              options: q.options || [], correctOptions: q.correct_options || []
          };
      });

      setQuizForm({
          dbId: quiz.id, title: quiz.title, startTime: toLocalDatetime(quiz.start_time),
          endTime: toLocalDatetime(quiz.end_time), maxWarnings: quiz.max_warnings,
          questions: loadedQuestions.length > 0 ? loadedQuestions : [createNewQuestion()]
      });
      setQuizView("editor");
      setStatusMsg("");
  };

  const handleDeleteQuiz = async (id: string) => {
      if(!window.confirm("CRITICAL WARNING: Purge this assessment? All records will be permanently deleted.")) return;
      try {
          const token = await user?.getIdToken();
          const response = await fetch(`/.netlify/functions/manage-quiz?id=${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error("Delete failed");
          
          if (user) loadMyQuizzes(user.uid);
      } catch (err: any) { alert(`Purge failed: ${err.message}`); }
  };

  const handleViewResults = async (quiz: any) => {
      setIsFetchingResults(true);
      setActiveQuizTitle(quiz.title);
      setActiveMaxWarnings(quiz.max_warnings);
      setShowResultsModal(true);

      try {
          const response = await fetch(`/.netlify/functions/get-quiz-submissions?quiz_id=${quiz.id}`);
          if (!response.ok) throw new Error("Fetch failed");
          const data = await response.json();
          if (data) setActiveResults(data);
      } catch (err: any) {
          alert(`Leaderboard Fetch Failed: ${err.message}`);
          setShowResultsModal(false);
      } finally { setIsFetchingResults(false); }
  };

  const handleDeployQuiz = async () => {
      if (!user) return alert("You must be logged in to deploy a quiz.");
      if(!quizForm.title || !quizForm.startTime || !quizForm.endTime) return alert("Title and Schedule times are strictly required.");
  
      for (let i = 0; i < quizForm.questions.length; i++) {
          const q = quizForm.questions[i];
          if (q.correctOptions.length === 0 || (q.questionType === 'numerical' && !q.correctOptions[0])) {
              return alert(`Question ${i + 1} has no correct answer selected/entered!`);
          }
      }
      setIsDeployingQuiz(true);
  
      try {
          const startISO = new Date(quizForm.startTime).toISOString();
          const endISO = new Date(quizForm.endTime).toISOString();
          let currentQuizId = quizForm.dbId;
          let assignedCode = "";
  
          const token = await user.getIdToken();
          const response = await fetch('/.netlify/functions/manage-quiz', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  id: currentQuizId,
                  title: quizForm.title,
                  start_time: startISO,
                  end_time: endISO,
                  max_warnings: quizForm.maxWarnings,
                  // ✅ FIX: Map camelCase state to snake_case for the database
                  questions: quizForm.questions.map(q => ({
                      id: q.dbId,
                      text: q.text,
                      is_multiple_choice: q.questionType === 'multiple',
                      options: q.options,
                      correct_options: q.correctOptions
                  }))
              })
          });
          
          if (!response.ok) throw new Error("Deployment failed");
          const resData = await response.json();
          currentQuizId = resData.id;

          // Need to fetch join_code
          const qRes = await fetch(`/.netlify/functions/get-quiz-details?id=${currentQuizId}`);
          if (qRes.ok) {
              const { quiz: qInfo } = await qRes.json();
              assignedCode = qInfo.join_code;
          }
  
          setGeneratedLink(`${window.location.origin}/quiz/${currentQuizId}`);
          setGeneratedCode(assignedCode);
          setShowSuccessModal(true);
          
          if (user) loadMyQuizzes(user.uid);
      } catch (err: any) { alert(`Deployment failed: ${err.message}`); } 
      finally { setIsDeployingQuiz(false); }
  };

  const copyLinkToClipboard = () => {
      navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  const updateQuizQ = (qIndex: number, field: keyof QuizQuestion, value: any) => {
      const nq = [...quizForm.questions]; nq[qIndex] = { ...nq[qIndex], [field]: value };
      setQuizForm({...quizForm, questions: nq});
  };

  const changeQuestionType = (qIndex: number, newType: QuestionType) => {
      const q = quizForm.questions[qIndex];
      if (q.questionType === newType) return;
      let newOptions = [...q.options];
      if (newType === 'true_false') newOptions = [{ id: `tf_true_${Date.now()}`, text: 'True' }, { id: `tf_false_${Date.now()}`, text: 'False' }];
      else if (newType === 'numerical') newOptions = [];
      else if ((newType === 'single' || newType === 'multiple') && (q.questionType === 'true_false' || q.questionType === 'numerical')) newOptions = generateDefaultOptions();
      const nq = [...quizForm.questions]; nq[qIndex] = { ...nq[qIndex], questionType: newType, options: newOptions, correctOptions: [] };
      setQuizForm({...quizForm, questions: nq});
  };

  const toggleCorrectOption = (qIndex: number, optId: string) => {
      const q = quizForm.questions[qIndex]; let newCorrect = [...q.correctOptions];
      if (q.questionType === 'multiple') {
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
      const q = quizForm.questions[qIndex]; if (q.options.length <= 2) return; 
      updateQuizQ(qIndex, 'options', q.options.filter((_, i) => i !== oIndex));
      updateQuizQ(qIndex, 'correctOptions', q.correctOptions.filter(id => id !== optId));
  };

  const addNewQuestion = () => setQuizForm({ ...quizForm, questions: [...quizForm.questions, createNewQuestion()] });

  const inputClass = "w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 text-sm text-zinc-100 transition-all placeholder:text-zinc-600 shadow-inner";
  const labelClass = "text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block";
  const averageScore = activeResults.length > 0 ? (activeResults.reduce((acc, sub) => acc + sub.score, 0) / activeResults.length).toFixed(1) : 0;
  const totalQuestions = activeResults.length > 0 ? activeResults[0].total_questions : 0;

  // ==========================================
  // VIEW: LOADING
  // ==========================================
  if (isAuthLoading) {
    return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-zinc-400 gap-4"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;
  }

  // ==========================================
  // VIEW: AUTHENTICATION REQUIRED
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white relative overflow-hidden font-sans">
         <Navbar />
         {/* Immersive Grid & Orb Background */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none"></div>

         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="relative z-10 flex flex-col items-center w-full max-w-lg px-6">
            <div className="w-20 h-20 bg-white/[0.03] border border-white/[0.08] rounded-[1.5rem] flex items-center justify-center mb-8 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                <Terminal size={40} className="text-indigo-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">Proctor Dashboard</h1>
            <p className="text-zinc-400 text-base mb-12 text-center leading-relaxed font-medium">Authenticate to access your personal assessment forge and manage your deployments.</p>
            
            <button onClick={loginWithGoogle} className="w-full py-4 bg-white text-zinc-950 font-bold rounded-2xl hover:bg-zinc-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] flex justify-center items-center gap-3 text-lg group">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" /> 
                Authenticate via Google
            </button>
            <p className="mt-8 text-xs text-zinc-600 font-mono flex items-center gap-2 uppercase tracking-widest"><Lock size={12}/> Secure Protocol Active</p>
         </motion.div>
      </div>
    );
  }

  // ==========================================
  // VIEW: FORGE DASHBOARD (Main App)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 font-sans relative overflow-x-hidden">
      <Navbar />

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="max-w-lg w-full bg-[#111] border border-white/[0.08] p-10 rounded-[2.5rem] shadow-2xl text-center">
                <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-6" />
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Deployment Successful!</h2>
                <p className="text-zinc-400 text-sm mb-6">Your assessment is now live.</p>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 mb-6">
                    <p className="text-indigo-300/80 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">6-Digit Access Code</p>
                    <p className="text-5xl font-mono font-bold text-white tracking-[0.25em]">{generatedCode}</p>
                </div>
                <div className="bg-black/60 border border-white/[0.05] rounded-2xl p-4 flex items-center justify-between gap-4 mb-8 shadow-inner">
                    <div className="flex items-center gap-3 overflow-hidden text-zinc-300">
                        <LinkIcon size={18} className="text-zinc-500 shrink-0" />
                        <span className="text-sm font-mono truncate select-all">{generatedLink}</span>
                    </div>
                    <button onClick={copyLinkToClipboard} className="p-2.5 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-colors shrink-0 text-white">
                        {isCopied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                </div>
                <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl transition-all">Acknowledge</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResultsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-6">
             <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} className="max-w-5xl w-full max-h-[90vh] bg-[#0a0a0a] border border-white/[0.08] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative">
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
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                   {isFetchingResults ? (
                       <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
                           <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} /> 
                           <p className="text-sm font-medium tracking-wide uppercase">Compiling Telemetry...</p>
                       </div>
                   ) : (
                       <>
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
                                                       <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} key={sub.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                                           <td className="py-4 px-6 text-center">{isTop3 ? <div className="flex justify-center"><Medal className={rankColor} size={20} /></div> : <span className={rankColor}>#{index + 1}</span>}</td>
                                                           <td className="py-4 px-6"><p className="font-bold text-white text-sm">{sub.display_name}</p><p className="text-xs text-zinc-500 truncate max-w-[150px] md:max-w-none">{sub.email}</p></td>
                                                           <td className="py-4 px-6"><div className="flex items-end gap-1"><span className="text-lg font-bold text-white">{sub.score}</span><span className="text-xs text-zinc-500 mb-1">/ {sub.total_questions}</span></div></td>
                                                           <td className="py-4 px-6 hidden sm:table-cell"><div className="flex items-center gap-2 text-zinc-400 font-mono text-sm"><Clock size={14} /> {formatTime(sub.time_taken_seconds)}</div></td>
                                                           <td className="py-4 px-6 text-center"><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${sub.warnings_hit === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : sub.warnings_hit >= activeMaxWarnings ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}><AlertTriangle size={12} /> {sub.warnings_hit}</span></td>
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

      <main className="pt-32 pb-20 px-4 md:px-6 container mx-auto max-w-4xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  <ShieldAlert size={28} className="text-indigo-500" /> 
                  My Dashboard
                </h1>
                <p className="text-zinc-500 text-sm mt-1">Design, schedule, and configure your personal evaluations.</p>
            </div>
            <div className="flex bg-[#0a0a0a]/80 p-1.5 rounded-2xl border border-white/[0.08] shadow-lg w-fit">
                <button onClick={() => setQuizView("manager")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${quizView === 'manager' ? 'bg-indigo-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>My Assessments</button>
                <button onClick={() => { setQuizForm({dbId: undefined, title: "", startTime: toLocalDatetime(defaultStart.toISOString()), endTime: toLocalDatetime(defaultEnd.toISOString()), maxWarnings: 3, questions: [createNewQuestion()]}); setQuizView("editor"); }} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${quizView === 'editor' ? 'bg-indigo-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>Create New</button>
            </div>
        </div>

        {quizView === "manager" ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a0a0a]/60 border border-white/[0.06] p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3"><LayoutGrid size={20} className="text-indigo-400"/> My Quizes</h3>
                {existingQuizzes.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl">
                        <HelpCircle size={48} className="text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400 font-medium text-lg mb-1">No assessments found.</p>
                        <p className="text-zinc-500 text-sm">Create your first quiz to see it here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {existingQuizzes.map(q => (
                            <div key={q.id} className="p-6 bg-black/40 border border-white/[0.06] rounded-[1.5rem] hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-lg font-bold text-white tracking-tight">{q.title}</h4>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleViewResults(q)} className="p-2 bg-white/5 text-emerald-400 hover:bg-emerald-500/20 rounded-xl" title="Results"><BarChart size={16}/></button>
                                        <button onClick={() => handleEditQuiz(q)} className="p-2 bg-white/5 text-sky-400 hover:bg-sky-500/20 rounded-xl" title="Edit"><Edit3 size={16}/></button>
                                        <button onClick={() => handleDeleteQuiz(q.id)} className="p-2 bg-white/5 text-rose-400 hover:bg-rose-500/20 rounded-xl" title="Delete"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono"><Hash size={14}/> Code: {q.join_code || q.id.substring(0, 8)}</div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-400"><Calendar size={14}/> {new Date(q.start_time).toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* Core Config */}
                <div className="bg-[#0a0a0a]/80 border border-white/[0.06] p-6 md:p-8 rounded-[2rem]">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Calendar size={18} className="text-indigo-400"/> Quiz Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2"><label className={labelClass}>Assessment Title</label><input value={quizForm.title} onChange={(e) => setQuizForm({...quizForm, title: e.target.value})} className={inputClass} placeholder="e.g. Technical Interview Round 1" /></div>
                      <div><label className={labelClass}>Start Time</label><input type="datetime-local" value={quizForm.startTime} onChange={(e) => setQuizForm({...quizForm, startTime: e.target.value})} className={`${inputClass} [color-scheme:dark]`} /></div>
                      <div><label className={labelClass}>End Time</label><input type="datetime-local" value={quizForm.endTime} onChange={(e) => setQuizForm({...quizForm, endTime: e.target.value})} className={`${inputClass} [color-scheme:dark]`} /></div>
                  </div>
                </div>

                {/* Ultra-Proctored Security Config */}
                <div className="bg-gradient-to-br from-[#110505] to-[#0a0a0a] border border-rose-500/20 p-6 md:p-8 rounded-[2rem] shadow-[inset_0_0_40px_rgba(244,63,94,0.03)]">
                  <h3 className="text-lg font-bold text-rose-400 mb-6 flex items-center gap-2"><Shield size={18} /> Security & Anti-Cheat Protocols</h3>
                  <div className="mb-6">
                      <label className={labelClass}>Proctoring Strictness Level</label>
                      <div className="flex flex-col md:flex-row gap-3 mt-3">
                          <button onClick={() => setQuizForm({...quizForm, maxWarnings: 5})} className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${quizForm.maxWarnings >= 5 ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                              <h4 className={`font-bold mb-1 ${quizForm.maxWarnings >= 5 ? 'text-emerald-400' : 'text-zinc-300'}`}>Lenient</h4><p className="text-[11px] text-zinc-500">Allows up to 5 tab switches. Good for open-book.</p>
                          </button>
                          <button onClick={() => setQuizForm({...quizForm, maxWarnings: 3})} className={`flex-1 p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${quizForm.maxWarnings === 3 ? 'bg-amber-500/10 border-amber-500/50' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                              <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md">Recommended</span>
                              <h4 className={`font-bold mb-1 pr-16 ${quizForm.maxWarnings === 3 ? 'text-amber-400' : 'text-zinc-300'}`}>Standard</h4>
                              <p className="text-[11px] text-zinc-500">Flags after 3 violations. Standard testing mode.</p>
                          </button>
                          <button onClick={() => setQuizForm({...quizForm, maxWarnings: 1})} className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${quizForm.maxWarnings <= 1 ? 'bg-rose-500/10 border-rose-500/50' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                              <h4 className={`font-bold mb-1 flex items-center gap-2 ${quizForm.maxWarnings <= 1 ? 'text-rose-400' : 'text-zinc-300'}`}>Ultra Strict <Activity size={14}/></h4><p className="text-[11px] text-zinc-500">1-strike policy. Enforces full-screen tracking.</p>
                          </button>
                      </div>
                  </div>
                  <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex gap-4 items-start">
                      <Fingerprint className="text-rose-500 shrink-0 mt-1" size={20} />
                      <div>
                          <p className="text-sm text-zinc-300 font-medium mb-1">Active Modules based on your selection:</p>
                          <ul className="text-xs text-zinc-500 space-y-1 list-disc pl-4 marker:text-rose-500">
                              <li>Disables Copy, Paste, and Right-Click.</li>
                              <li>Tracks window blur (clicking outside the browser).</li>
                              <li>Auto-submits exam when the <b>{quizForm.maxWarnings}</b> violation limit is hit.</li>
                          </ul>
                      </div>
                  </div>
                </div>

                {/* Questions Builder */}
                <div className="bg-[#0a0a0a]/80 border border-white/[0.06] p-6 md:p-8 rounded-[2rem]">
                    <div className="flex justify-between items-center mb-6 border-b border-white/[0.05] pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><HelpCircle size={18} className="text-sky-400"/> Assessment Questions</h3>
                        <button onClick={addNewQuestion} className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16}/> Add Question</button>
                    </div>

                    <div className="space-y-6">
                        {quizForm.questions.map((q, qIndex) => (
                            <div key={qIndex} className="p-6 bg-black/40 border border-white/[0.08] rounded-3xl relative">
                                <div className="absolute top-5 right-5 flex gap-2 items-center">
                                    <span className="text-xs font-bold text-zinc-500 bg-white/5 px-2.5 py-1 rounded-md">Q{qIndex + 1}</span>
                                    <button onClick={() => setQuizForm({...quizForm, questions: quizForm.questions.filter((_, i) => i !== qIndex)})} className="text-zinc-600 hover:text-rose-400 p-1.5 rounded-md transition-colors" title="Delete Question"><Trash2 size={16}/></button>
                                </div>
                                <div className="mb-5 pr-20">
                                    <label className={labelClass}>Question Text (Markdown Supported)</label>
                                    <textarea value={q.text} onChange={(e) => updateQuizQ(qIndex, 'text', e.target.value)} rows={3} className={`${inputClass} mb-2 text-[14px] font-mono leading-relaxed resize-y`} placeholder="Type question here... (Wrap code in ``` Code ``` for perfect indentation)" />
                                </div>
                                {/* Question Type Selector */}
                                <div className="mb-5 bg-white/[0.02] p-1.5 rounded-xl w-full md:w-fit flex flex-wrap gap-1 border border-white/5">
                                    <button onClick={() => changeQuestionType(qIndex, 'single')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${q.questionType === 'single' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}><CircleDot size={14}/> Single Choice</button>
                                    <button onClick={() => changeQuestionType(qIndex, 'multiple')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${q.questionType === 'multiple' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}><CheckSquare size={14}/> Multiple Choice</button>
                                    <button onClick={() => changeQuestionType(qIndex, 'true_false')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${q.questionType === 'true_false' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}><ToggleLeft size={14}/> True / False</button>
                                    <button onClick={() => changeQuestionType(qIndex, 'numerical')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${q.questionType === 'numerical' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}><NumIcon size={14}/> Numerical</button>
                                </div>
                                {/* Dynamic Options Area */}
                                <div className="bg-white/[0.01] border border-white/[0.03] p-5 rounded-2xl">
                                    {(q.questionType === 'single' || q.questionType === 'multiple') && (
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <label className={`${labelClass} !mb-0`}>Answer Options</label> 
                                                <button onClick={() => addOption(qIndex)} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus size={14}/> Add Option</button>
                                            </div>
                                            <div className="space-y-3">
                                                {q.options.map((opt, oIndex) => {
                                                    const isCorrect = q.correctOptions.includes(opt.id);
                                                    const letter = String.fromCharCode(65 + oIndex); 
                                                    return (
                                                        <div key={opt.id} className="flex items-center gap-3">
                                                            <button onClick={() => toggleCorrectOption(qIndex, opt.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 ${isCorrect ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-black/50 border-white/10 text-transparent hover:border-white/30'}`} title="Mark as correct"><Check size={16} strokeWidth={3} /></button>
                                                            <div className="relative flex-1">
                                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-sm select-none">{letter}.</div>
                                                                <textarea rows={1} value={opt.text} onChange={(e) => { const newOpts = [...q.options]; newOpts[oIndex].text = e.target.value; updateQuizQ(qIndex, 'options', newOpts); }} className={`${inputClass} !py-2.5 pl-10 text-[13px] font-mono min-h-[44px] resize-y`} placeholder="Enter option... (Use ``` code ``` for code)" />
                                                            </div>
                                                            <button onClick={() => removeOption(qIndex, oIndex, opt.id)} disabled={q.options.length <= 2} className="text-zinc-600 hover:text-rose-400 disabled:opacity-30 p-2 bg-white/5 rounded-lg shrink-0"><X size={16}/></button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {q.questionType === 'true_false' && (
                                        <div>
                                            <label className={labelClass}>Select Correct Answer</label>
                                            <div className="flex gap-4 mt-2">
                                                {q.options.map(opt => (
                                                    <button key={opt.id} onClick={() => toggleCorrectOption(qIndex, opt.id)} className={`flex-1 py-4 rounded-xl font-bold transition-all border-2 ${q.correctOptions.includes(opt.id) ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-black/50 border-white/10 text-zinc-500 hover:border-white/30 hover:text-zinc-300'}`}>{opt.text}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {q.questionType === 'numerical' && (
                                        <div>
                                            <label className={labelClass}>Correct Answer (Exact Value)</label>
                                            <input type="number" value={q.correctOptions[0] || ''} onChange={(e) => updateQuizQ(qIndex, 'correctOptions', [e.target.value])} className={`${inputClass} max-w-xs`} placeholder="e.g. 42" />
                                            <p className="text-[10px] text-zinc-500 mt-2">Students must enter this exact number to receive credit.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={handleDeployQuiz} disabled={isDeployingQuiz} className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-lg rounded-2xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex justify-center gap-3 disabled:opacity-50">
                    {isDeployingQuiz ? <Loader2 className="animate-spin" size={24}/> : <CloudLightning size={24} />} 
                    {isDeployingQuiz ? "Deploying..." : "Save & Deploy Assessment"}
                </button>
            </motion.div>
        )}
      </main>
    </div>
  );
}