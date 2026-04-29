import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  KeyRound, Plus, Loader2, ShieldAlert, Fingerprint, TerminalSquare, ChevronRight,
  Play, Database, Braces, Code2 
} from 'lucide-react';
import Navbar from '@/components/Navbar';

// --- HARDCODED PUBLIC TOURS ---
const PUBLIC_TOURS = [
  { 
    id: '2ec00221-dced-4467-919f-1e83ebe3b129', 
    title: 'Data Structures 101', 
    desc: 'Test your knowledge on Arrays, Linked Lists, and Trees in a proctored environment.', 
    icon: Database, 
    theme: 'sky' 
  },
  { 
    id: '2ec00221-dced-4467-919f-1e83ebe3b129', 
    title: 'Algorithms Core', 
    desc: 'A quick tour of Sorting, Searching, and Dynamic Programming mechanics.', 
    icon: Braces, 
    theme: 'emerald' 
  },
  { 
    id: '2ec00221-dced-4467-919f-1e83ebe3b129', 
    title: 'Web Fundamentals', 
    desc: 'Explore basic HTML, CSS, and JS concepts with live cheat-prevention active.', 
    icon: Code2, 
    theme: 'amber' 
  }
];

const themeMap = {
  sky: { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', hover: 'hover:border-sky-500/40 hover:shadow-[0_0_30px_rgba(56,189,248,0.1)]' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hover: 'hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(52,211,153,0.1)]' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hover: 'hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(251,191,36,0.1)]' },
};

export default function QuizPanel() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length !== 6) {
      setError('Access code must be exactly 6 characters.');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      // SECURE BACKEND CALL (Replaces direct Supabase connection)
      const response = await fetch('/.netlify/functions/verify-quiz-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.toUpperCase() })
      });

      if (!response.ok) {
        if (response.status === 404) {
           setError('Assessment not found. Verify the code and try again.');
        } else {
           throw new Error('Server error');
        }
        setIsJoining(false);
        return;
      }

      const data = await response.json();
      // Successfully retrieved the ID from the backend, navigate to the quiz
      navigate(`/quiz/${data.id}`);

    } catch (err) {
      setError('Connection matrix failed. Please try again.');
      setIsJoining(false);
    } 
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans flex flex-col relative overflow-hidden">
      <Navbar />
      
      {/* Immersive Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-full max-w-3xl h-[400px] bg-sky-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 w-full max-w-5xl mx-auto pt-24 pb-20">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="w-14 h-14 bg-white/[0.02] border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] relative group">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <TerminalSquare size={28} className="text-indigo-400 relative z-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Assessment Hub</h1>
          <p className="text-zinc-400 text-base max-w-xl mx-auto leading-relaxed font-medium">
            Enter a secure code to join an active evaluation, initialize the Forge to deploy your own, or take a public tour.
          </p>
        </motion.div>

        {/* TOP SECTION: JOIN & CREATE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-16">
          
          {/* JOIN QUIZ CARD */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-indigo-500/20 p-6 md:p-8 rounded-[2rem] shadow-[0_0_40px_rgba(99,102,241,0.05)] relative group overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-sky-400 opacity-80"></div>
            
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
              <Fingerprint className="text-indigo-400" size={20} /> Candidate Access
            </h2>
            <p className="text-zinc-500 text-xs mb-6 leading-relaxed">Input your 6-digit quiz code to authenticate and begin.</p>

            <form onSubmit={handleJoin} className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. X7B9K2" 
                  className="w-full bg-[#050505] border border-white/[0.1] rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 text-center text-3xl font-mono tracking-[0.25em] text-white transition-all placeholder:text-zinc-800 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] uppercase"
                />
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="text-rose-400 text-xs font-bold text-center bg-rose-500/10 py-2.5 rounded-lg border border-rose-500/20"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={isJoining || joinCode.length !== 6}
                className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:hover:bg-indigo-500 flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isJoining ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
                {isJoining ? "Validating..." : "Enter Quiz"}
              </button>
            </form>
          </motion.div>

          {/* CREATE QUIZ CARD */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="bg-[#0a0a0a]/60 backdrop-blur-3xl border border-white/[0.08] p-6 md:p-8 rounded-[2rem] shadow-xl flex flex-col justify-between hover:bg-[#0a0a0a]/90 hover:border-white/[0.15] transition-all group"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                <ShieldAlert className="text-emerald-400" size={20} /> Quiz Dashboard
              </h2>
              <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                Create and deploy your own proctored quizzes. Share securely via direct link or access code, and monitor live cheat-prevention telemetry in real-time.
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full">
              <button 
                onClick={() => navigate('/quiz-forge')}
                className="w-full py-3.5 bg-white/[0.03] border border-white/[0.1] hover:bg-white hover:text-black text-white font-bold text-sm rounded-xl transition-all flex justify-center items-center gap-2 group/dash hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              >
                <Plus size={18} className="text-zinc-400 group-hover/dash:text-black transition-colors" />
                <span>Open Dashboard</span>
                <ChevronRight size={16} className="opacity-0 group-hover/dash:opacity-100 -ml-4 group-hover/dash:ml-0 transition-all" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* BOTTOM SECTION: PUBLIC TOURS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="w-full max-w-5xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest px-2 flex items-center gap-2">
              <Play size={16} className="text-indigo-400" /> Platform Tours
            </h3>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PUBLIC_TOURS.map((tour, idx) => {
              const colors = themeMap[tour.theme as keyof typeof themeMap];
              const Icon = tour.icon;
              return (
                <div 
                  key={idx} 
                  className={`bg-[#0a0a0a]/60 backdrop-blur-xl border ${colors.border} p-6 rounded-[2rem] transition-all duration-300 ${colors.hover} group flex flex-col justify-between`}
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center mb-5 border ${colors.border}`}>
                      <Icon size={22} className={colors.text} />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{tour.title}</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed mb-6 font-medium">{tour.desc}</p>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/quiz/${tour.id}`)}
                    className="w-full py-2.5 bg-white/[0.03] hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold text-zinc-300 transition-colors flex items-center justify-center gap-2 group-hover:text-white"
                  >
                    Take the Tour <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

      </main>
    </div>
  );
}