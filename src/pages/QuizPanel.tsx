import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  KeyRound, Loader2, ShieldAlert, Fingerprint, ChevronRight,
  Play, Database, Braces, Code2, Sparkles, LayoutGrid, TerminalSquare, AlertTriangle, Hexagon, Component
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// A dynamic icon selector based on the theme string you set in the Dashboard
const themeToIcon = (theme: string) => {
    switch(theme) {
        case 'sky': return Database;
        case 'emerald': return Braces;
        case 'amber': return Code2;
        case 'rose': return AlertTriangle;
        case 'indigo': return Component;
        default: return Hexagon;
    }
}

const themeMap = {
  sky: { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', hoverBorder: 'hover:border-sky-500/40', glow: 'from-sky-500/10 to-transparent' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-500/40', glow: 'from-emerald-500/10 to-transparent' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hoverBorder: 'hover:border-amber-500/40', glow: 'from-amber-500/10 to-transparent' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', hoverBorder: 'hover:border-rose-500/40', glow: 'from-rose-500/10 to-transparent' },
  indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', hoverBorder: 'hover:border-indigo-500/40', glow: 'from-indigo-500/10 to-transparent' }
};

interface TourQuiz { id: string; title: string; description: string; theme: string; duration_seconds: number; }

export default function QuizPanel() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  
  // NEW: Dynamic State
  const [publicTours, setPublicTours] = useState<TourQuiz[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);

  // Fetch Public Tours on load
  useEffect(() => {
    const fetchTours = async () => {
        try {
            const res = await fetch('/.netlify/functions/get-public-tours');
            if (res.ok) {
                const data = await res.json();
                setPublicTours(data);
            }
        } catch (e) { console.error("Failed to load tours", e); }
        finally { setLoadingTours(false); }
    };
    fetchTours();
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length !== 6) { setError('Code must be exactly 6 characters.'); return; }

    setIsJoining(true); setError('');

    try {
      const response = await fetch('/.netlify/functions/verify-quiz-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.toUpperCase() })
      });

      if (!response.ok) {
        if (response.status === 404) setError('Assessment not found. Verify the code.');
        else throw new Error('Server error');
        setIsJoining(false); return;
      }

      const data = await response.json();
      navigate(`/quiz/${data.id}`);
    } catch (err) { setError('Connection matrix failed. Please try again.'); setIsJoining(false); } 
  };

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans flex flex-col relative overflow-x-hidden selection:bg-indigo-500/30">
      <Navbar />
      
      {/* Premium Tech Background */}
      <div className="absolute inset-0 z-0 opacity-[0.15] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-full max-w-4xl h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-0 w-full max-w-2xl h-[400px] bg-sky-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <main className="flex-1 px-4 sm:px-6 relative z-10 w-full max-w-7xl mx-auto pt-24 lg:pt-32 pb-24">
        
        {/* HERO SECTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center sm:text-left w-full mb-12 lg:mb-16">
          <div className="inline-flex items-center justify-center p-1 px-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
            <Sparkles size={14} className="mr-2" /> Assessment Ground
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-600">
            Proctored Evaluation Hub
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl leading-relaxed font-medium">
            Explore live environments, enter a secure assessment code, or orchestrate your own strict-proctored evaluations.
          </p>
        </motion.div>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* ========================================== */}
          {/* LEFT COLUMN: PLATFORM TOURS (FRONT & CENTER) */}
          {/* ========================================== */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, type: "spring", stiffness: 80 }}
            className="lg:col-span-8 flex flex-col gap-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Play size={18} className="text-sky-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Practice Open Quiz</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {loadingTours ? (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center bg-[#050505]/60 border border-white/5 rounded-[2rem]">
                      <Loader2 className="animate-spin text-indigo-500 mb-3" size={32} />
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Querying Matrix...</p>
                  </div>
              ) : publicTours.length === 0 ? (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center bg-[#050505]/60 border border-white/5 rounded-[2rem]">
                      <ShieldAlert className="text-zinc-600 mb-3 opacity-50" size={40} />
                      <p className="text-zinc-400 font-bold mb-1 text-sm">No Active Tours Available</p>
                      <p className="text-zinc-500 text-xs">Administrators have not flagged any assessments for public display.</p>
                  </div>
              ) : (
                  publicTours.map((tour, idx) => {
                    const colors = themeMap[(tour.theme as keyof typeof themeMap) || 'sky'];
                    const Icon = themeToIcon(tour.theme);
                    // Make the first item span 2 columns on small screens if you want a featured look
                    const isFeatured = idx === 0;
                    
                    return (
                      <div 
                        key={tour.id} 
                        onClick={() => navigate(`/quiz/${tour.id}`)}
                        className={`relative bg-[#050505]/80 backdrop-blur-2xl border border-white/[0.08] rounded-[2rem] p-6 sm:p-8 cursor-pointer overflow-hidden transition-all duration-300 group ${colors.hoverBorder} ${isFeatured ? 'sm:col-span-2' : 'col-span-1'} hover:-translate-y-1 shadow-[0_10px_40px_rgba(0,0,0,0.4)]`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${colors.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
                        
                        <div className="relative z-10 flex flex-col h-full justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center border ${colors.border} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                    <Icon size={22} className={colors.text} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text} ${colors.bg} px-3 py-1 rounded-full border ${colors.border}`}>
                                    {tour.duration_seconds ? tour.duration_seconds / 60 : 45} Min
                                </span>
                            </div>
                            <h3 className={`${isFeatured ? 'text-2xl sm:text-3xl' : 'text-xl'} font-bold text-white mb-3 tracking-tight`}>{tour.title}</h3>
                            <p className={`text-zinc-400 font-medium leading-relaxed ${isFeatured ? 'text-sm sm:text-base max-w-lg mb-8' : 'text-xs mb-6'}`}>
                                {tour.description || "A highly secure, proctored environment."}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-auto">
                            <span className="text-xs font-bold text-white">Attempt Now</span>
                            <ChevronRight size={16} className="text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </motion.div>

          {/* ========================================== */}
          {/* RIGHT COLUMN: COMPACT OPERATIONS           */}
          {/* ========================================== */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 80 }}
            className="lg:col-span-4 flex flex-col gap-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <TerminalSquare size={18} className="text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Control Panel</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
            </div>

            {/* 1. COMPACT JOIN CARD */}
            <div className="bg-[#050505]/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden group/join">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none transition-colors group-hover/join:bg-indigo-500/20"></div>
                
                <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-inner">
                        <Fingerprint size={18} />
                    </div>
                    <h3 className="font-bold text-white tracking-tight text-lg">Candidate Access</h3>
                </div>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed relative z-10 font-medium">Input your 6-digit secure code to authenticate your identity.</p>
                
                <form onSubmit={handleJoin} className="relative z-10 space-y-4">
                    <div className="relative group/input">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300"></div>
                        <input 
                            type="text" 
                            maxLength={6}
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="CODE" 
                            className="relative w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 sm:py-4 text-2xl sm:text-3xl tracking-[0.4em] text-center font-mono focus:border-indigo-500/50 outline-none text-white transition-all uppercase placeholder:text-zinc-800 placeholder:tracking-widest shadow-inner"
                        />
                    </div>
                    
                    <AnimatePresence>
                        {error && (
                            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-rose-400 text-xs font-bold text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <button type="submit" disabled={isJoining || joinCode.length !== 6} className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                        {isJoining ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
                        {isJoining ? "Validating..." : "Enter Arena"}
                    </button>
                </form>
            </div>

            {/* 2. COMPACT CREATE CARD */}
            <div className="bg-[#050505]/60 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-6 shadow-xl flex flex-col relative overflow-hidden group/create hover:bg-[#0a0a0a] transition-all">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none transition-colors group-hover/create:bg-emerald-500/10"></div>
                
                <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="p-2 bg-zinc-900 text-emerald-400 rounded-xl border border-white/10 shadow-inner group-hover/create:scale-110 transition-transform">
                        <ShieldAlert size={18} />
                    </div>
                    <h3 className="font-bold text-white tracking-tight text-lg">Quiz Forge</h3>
                </div>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed relative z-10 font-medium">Design, schedule, and orchestrate your own strict-proctored assessments.</p>
                
                <button onClick={() => navigate('/quiz-forge')} className="w-full py-3.5 bg-zinc-900/80 border border-white/10 hover:border-white/30 text-white font-bold text-sm rounded-xl transition-all flex justify-between px-5 items-center shadow-inner hover:bg-zinc-800 relative z-10 mt-auto">
                    <div className="flex items-center gap-2">
                        <LayoutGrid size={16} className="text-zinc-500 group-hover/create:text-emerald-400 transition-colors" />
                        <span>Open Dashboard</span>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600 group-hover/create:text-white group-hover/create:translate-x-1 transition-all" />
                </button>
            </div>

          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}