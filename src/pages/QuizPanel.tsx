import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  KeyRound, Plus, Loader2, ShieldAlert, Fingerprint, TerminalSquare, ChevronRight
} from 'lucide-react';
import Navbar from '@/components/Navbar';



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
      const response = await fetch(`/.netlify/functions/get-quizzes?join_code=${joinCode.toUpperCase()}`);
      if (!response.ok) {
        setError('Assessment not found. Verify the code and try again.');
      } else {
        const data = await response.json();
        if (!data || !data.id) {
           setError('Assessment not found. Verify the code and try again.');
        } else {
           navigate(`/quiz/${data.id}`);
        }
      }
    } catch (err) {
      setError('Connection matrix failed. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans flex flex-col relative overflow-hidden">
      <Navbar />
      
      {/* Immersive Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-full max-w-3xl h-[400px] bg-sky-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 w-full max-w-5xl mx-auto pt-20 pb-20">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] relative group">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <TerminalSquare size={32} className="text-indigo-400 relative z-10" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Assessment Hub</h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed font-medium">
            Enter a secure code to join an active evaluation, or initialize the Forge to deploy your own.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-4xl">
          
          {/* JOIN QUIZ CARD */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-indigo-500/20 p-8 md:p-10 rounded-[2.5rem] shadow-[0_0_40px_rgba(99,102,241,0.05)] relative group overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-sky-400 opacity-80"></div>
            
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <Fingerprint className="text-indigo-400" size={24} /> Candidate Access
            </h2>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">Input your 6-digit quiz code to authenticate and begin.</p>

            <form onSubmit={handleJoin} className="space-y-5">
              <div className="relative">
                <input 
                  type="text" 
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. X7B9K2" 
                  className="w-full bg-[#050505] border border-white/[0.1] rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 text-center text-4xl font-mono tracking-[0.25em] text-white transition-all placeholder:text-zinc-800 placeholder:tracking-normal placeholder:font-sans placeholder:text-base shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] uppercase"
                />
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0, x: [-5, 5, -5, 5, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    className="text-rose-400 text-sm font-bold text-center bg-rose-500/10 py-3 rounded-xl border border-rose-500/20"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={isJoining || joinCode.length !== 6}
                className="w-full py-5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-lg rounded-2xl transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:hover:bg-indigo-500 flex justify-center items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isJoining ? <Loader2 className="animate-spin" size={24} /> : <KeyRound size={24} />}
                {isJoining ? "Validating..." : "Enter Quiz"}
              </button>
            </form>
          </motion.div>

          {/* CREATE QUIZ CARD (OPEN TO ALL) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="bg-[#0a0a0a]/60 backdrop-blur-3xl border border-white/[0.08] p-8 md:p-10 rounded-[2.5rem] shadow-xl flex flex-col justify-between hover:bg-[#0a0a0a]/90 hover:border-white/[0.15] transition-all group"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                <ShieldAlert className="text-emerald-400" size={24} /> Quiz Dashboard
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                Create and deploy your own proctored quizzes easily and share it with the direct link or with the quiz code. View live results along with number of time cheat prevention warnings. <span className="text-emerald-400/80"></span>
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full">
              <button 
                onClick={() => navigate('/quiz-forge')}
                className="w-full py-5 bg-white/[0.03] border border-white/[0.1] hover:bg-white hover:text-black text-white font-bold text-base rounded-2xl transition-all flex justify-center items-center gap-3 group/dash hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              >
                <Plus size={20} className="text-zinc-400 group-hover/dash:text-black transition-colors" />
                <span>Open Dashboard</span>
                <ChevronRight size={18} className="opacity-0 group-hover/dash:opacity-100 -ml-4 group-hover/dash:ml-0 transition-all" />
              </button>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}