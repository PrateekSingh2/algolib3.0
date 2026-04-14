import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { 
  KeyRound, Plus, Loader2, ArrowRight, ShieldAlert, Fingerprint, TerminalSquare,
  HelpCircle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function QuizPanel() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length !== 6) {
      setError('Team code must be exactly 6 characters.');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      // Query Supabase for the quiz with this exact 6-digit code
      const { data, error: fetchError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('join_code', joinCode.toUpperCase())
        .maybeSingle();

      if (fetchError || !data) {
        setError('Assessment not found. Verify the code and try again.');
      } else {
        // Redirect directly to the Quiz Arena
        navigate(`/quiz/${data.id}`);
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
      
      {/* Background Ambient Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 w-full max-w-5xl mx-auto pt-20">
        
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <TerminalSquare size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-white">Assessment Hub</h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            Enter a quiz code to join an active assessment, or initialize the Dashboard to deploy your own.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-4xl">
          
          {/* JOIN QUIZ CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-indigo-500/20 p-8 md:p-10 rounded-[2.5rem] shadow-[0_0_40px_rgba(99,102,241,0.05)] relative group overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-sky-400"></div>
            
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <Fingerprint className="text-indigo-400" size={24} /> Join Assessment
            </h2>
            <p className="text-zinc-500 text-sm mb-8">Input your 6-digit secure team code to begin.</p>

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. X7B9K2" 
                  className="w-full bg-[#050505] border border-white/[0.1] rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-center text-3xl font-mono tracking-[0.2em] text-white transition-all placeholder:text-zinc-700 placeholder:tracking-normal placeholder:font-sans placeholder:text-base shadow-inner"
                />
              </div>
              
              {error && (
                <p className="text-rose-400 text-sm font-medium text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
                  {error}
                </p>
              )}

              <button 
                type="submit" 
                disabled={isJoining || joinCode.length !== 6}
                className="w-full py-5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-lg rounded-2xl transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:hover:bg-indigo-500 flex justify-center items-center gap-3 group-hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]"
              >
                {isJoining ? <Loader2 className="animate-spin" size={24} /> : <KeyRound size={24} />}
                {isJoining ? "Searching..." : "Join Assessment"}
              </button>
            </form>
          </motion.div>

          {/* CREATE QUIZ CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/[0.08] p-8 md:p-10 rounded-[2.5rem] shadow-xl flex flex-col justify-between hover:bg-[#0a0a0a]/80 transition-all group"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <ShieldAlert className="text-emerald-400" size={24} /> Create a Quiz
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Create, schedule, and deploy a proctored assessment with live monitoring and analytics.
              </p>
            </div>

            <div className="flex gap-4 w-full">
              <button 
                onClick={() => navigate('/quiz-forge')}
                className="flex-1 py-4 bg-white/[0.03] border border-white/[0.1] hover:bg-white hover:text-black text-white font-bold text-sm md:text-base rounded-2xl transition-all flex justify-center items-center gap-2 group/dash"
              >
                <Plus size={18} className="group-hover/dash:text-black transition-colors" />
                <span>Dashboard</span>
              </button>

              <button 
                onClick={() => navigate('/support')}
                className="flex-1 py-4 bg-transparent border border-white/[0.1] hover:bg-white/[0.08] text-zinc-300 font-bold text-sm md:text-base rounded-2xl transition-all flex justify-center items-center gap-2 group/req"
              >
                <HelpCircle size={18} className="text-zinc-400 group-hover/req:text-white transition-colors" />
                <span>Request Access</span>
              </button>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}