import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

import { 
  User, TerminalSquare, Mail, GraduationCap, Calendar, 
  Activity, MapPin, Map, Globe2, Github, Fingerprint, 
  Pencil, Cpu, ArrowUpRight, Terminal, ShieldCheck, 
  Network, Database, Trophy, Code2, Target, History
} from "lucide-react";

// --- THE APEX BACKGROUND (Static, High-Depth Glass Ambience) ---
const ApexBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-[#020202] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_20%,transparent_100%)]" />
    <div className="absolute top-[-10%] right-[5%] w-[60vw] md:w-[40vw] h-[40vh] bg-sky-500 rounded-full blur-[200px] mix-blend-screen opacity-[0.08]" />
    <div className="absolute bottom-[-10%] left-[-5%] w-[60vw] md:w-[40vw] h-[40vh] bg-indigo-600 rounded-full blur-[200px] mix-blend-screen opacity-[0.08]" />
  </div>
);

// --- PREMIUM HIGH GLASSMORPHISM BENTO CARD ---
const BentoCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`group relative rounded-3xl md:rounded-[2.5rem] bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] border-t-white/[0.2] border-l-white/[0.15] overflow-hidden hover:border-white/[0.25] transition-all duration-500 flex flex-col p-6 md:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_-15px_rgba(0,210,255,0.15)] hover:-translate-y-1 ${className}`}
    >
      {/* Glossy Diagonal Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-700 z-0" />
      
      {/* Interactive Mouse Spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl md:rounded-[2.5rem] opacity-0 transition duration-500 group-hover:opacity-100 z-20 hidden sm:block"
        style={{
          background: useMotionTemplate`radial-gradient(500px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.1), transparent 80%)`,
        }}
      />
      
      <div className="relative z-30 flex-1 flex flex-col h-full">
        {children}
      </div>
    </div>
  );
};

// --- GLOSSY INNER DATA NODE ---
const DataNode = ({ label, value, icon: Icon }: any) => (
  <div className="relative flex flex-col p-4 md:p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.1] border-t-white/[0.2] shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] hover:bg-black/60 transition-colors group/node z-10">
    <div className="flex items-center gap-2 mb-2 md:mb-3 text-zinc-400">
      <Icon size={14} className="text-zinc-500 group-hover/node:text-sky-400 transition-colors" />
      <span className="text-[10px] font-bold uppercase tracking-widest drop-shadow-sm">{label}</span>
    </div>
    {value && value !== "—" ? (
      <span className="text-sm font-medium text-white tracking-tight leading-snug drop-shadow-sm">{value}</span>
    ) : (
      <span className="text-xs text-zinc-600 font-mono italic flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
        Unassigned
      </span>
    )}
  </div>
);

const Profile = () => {
  const { profile, user, refreshProfile } = useAuth();
  
  const [arenaStats, setArenaStats] = useState({
    totalScore: 0,
    problemsSolved: 0,
    languages: [] as string[]
  });
  
  const [attendedContests, setAttendedContests] = useState<any[]>([]);

  // CORE LOGIC UNTOUCHED
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const fetchUserStats = async () => {
      const targetUid = user?.uid || profile?.id;
      if (!targetUid) return;

      try {
        const response = await fetch(`/.netlify/functions/get-profile-stats?uid=${targetUid}`);
        if (!response.ok) return;
        const data = await response.json();
        
        const lbData = data.leaderboard || [];
        const pData = data.problems || [];
        const cData = data.contests || [];

        if (lbData.length > 0) {
          let score = 0;
          const uniqueProblems = new Set();
          const langs = new Set<string>();

          const successfulSolves = lbData.filter((e: any) => e.score > 0).sort((a: any,b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          
          successfulSolves.forEach((entry: any) => {
              if (!uniqueProblems.has(entry.problem_id)) {
                  uniqueProblems.add(entry.problem_id);
                  score += entry.score;
                  langs.add(entry.language_used);
              }
          });

          if (uniqueProblems.size > 0 && pData.length > 0) {
              const problemToContest: Record<string, string> = {};
              pData.forEach((p: any) => problemToContest[p.id] = p.contest_id);
              
              const cMap: Record<string, any> = {};
              cData.forEach((c: any) => cMap[c.id] = c);

              const userContests: Record<string, any> = {};
              
              const scoredProblems = new Set();
              successfulSolves.forEach((entry: any) => {
                  if (!scoredProblems.has(entry.problem_id)) {
                      scoredProblems.add(entry.problem_id);
                      const cId = problemToContest[entry.problem_id];
                      if (cId && cMap[cId]) {
                          if (!userContests[cId]) {
                              userContests[cId] = {
                                  id: cId,
                                  title: cMap[cId].title,
                                  date: cMap[cId].start_time,
                                  score: 0
                              };
                          }
                          userContests[cId].score += entry.score;
                      }
                  }
              });
              
              setAttendedContests(Object.values(userContests).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          }

          setArenaStats({
              totalScore: score,
              problemsSolved: uniqueProblems.size,
              languages: Array.from(langs)
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserStats();
  }, [user, profile]);

  const displayName = profile?.display_name || profile?.full_name || user?.displayName || "Anonymous Engineer";
  const avatar = profile?.avatar_url || user?.photoURL || "https://placehold.co/140x140/111/fff?text=U";

  const completionPercentage = useMemo(() => {
    if (!profile && !user) return 0;
    const fields = [
      profile?.full_name, profile?.display_name, profile?.college, 
      profile?.age, profile?.gender, profile?.city, 
      profile?.country, profile?.github_url, profile?.bio
    ];
    const filled = fields.filter(f => f && f !== "—").length;
    return Math.round(((filled + 2) / (fields.length + 2)) * 100);
  }, [profile, user]);

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-sky-500/30 flex flex-col relative pb-10">
      <ApexBackground />
      
      <div className="fixed top-0 left-0 w-full z-[100] bg-black/20 backdrop-blur-2xl border-b border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <Navbar />
      </div>

      <main className="flex-1 relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6 pt-32 pb-16">
        
        {/* --- PREMIUM HEADER BANNER --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, type: "spring", stiffness: 90, damping: 20 }}
          className="relative w-full rounded-[2rem] md:rounded-[2.5rem] bg-white/[0.03] backdrop-blur-3xl border border-white/[0.1] border-t-white/[0.25] p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center md:items-center justify-between gap-6 md:gap-8 mb-10 overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.5)] text-center md:text-left group"
        >
          {/* Subtle Ambient Sphere Inside Banner */}
          <div className="absolute top-0 right-0 w-full md:w-[600px] h-[600px] bg-gradient-to-bl from-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none transform translate-x-1/4 -translate-y-1/4 group-hover:opacity-100 opacity-60 transition-opacity duration-700" />
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full md:w-auto">
            <div className="relative shrink-0 group/avatar cursor-pointer">
              {/* Glowing Aura */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-full blur-xl opacity-30 group-hover/avatar:opacity-60 transition-opacity duration-500"></div>
              
              {/* Glossy Rim */}
              <div className="absolute inset-0 rounded-full border-2 border-white/40 shadow-[inset_0_4px_15px_rgba(255,255,255,0.5)] z-20 pointer-events-none"></div>
              
              {/* Lens Flare Reflection */}
              <div className="absolute top-0 left-1/4 right-1/4 h-1/3 bg-gradient-to-b from-white/60 to-transparent rounded-t-full z-20 pointer-events-none opacity-40 group-hover/avatar:opacity-70 transition-opacity duration-500"></div>
              
              <img 
                src={avatar} 
                alt={displayName} 
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-full object-cover bg-[#0a0a0a] z-10 shadow-2xl group-hover/avatar:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-0 right-0 md:bottom-1 md:right-1 bg-white/[0.1] backdrop-blur-md p-1.5 rounded-full border border-white/[0.2] border-t-white/[0.4] z-30 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2 md:gap-3 mb-3 flex-wrap justify-center md:justify-start">
                <span className="text-[10px] font-bold tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5 backdrop-blur-md">
                  <ShieldCheck size={14} className="drop-shadow-[0_0_4px_rgba(52,211,153,0.8)]" /> Authenticated
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2 leading-none drop-shadow-md">{displayName}</h1>
              <p className="text-sm md:text-base text-zinc-300 font-mono mt-1 font-medium bg-black/30 px-3 py-1 rounded-lg border border-white/[0.05] shadow-inner">{user?.email}</p>
            </div>
          </div>

          <Link 
            to="/edit-profile" 
            className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-b from-sky-400 to-sky-600 border border-sky-300/50 border-t-sky-200 text-white font-bold px-8 py-3.5 rounded-2xl md:rounded-full transition-all hover:scale-[1.02] active:scale-95 hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] shadow-[0_0_20px_rgba(14,165,233,0.3)] z-10 w-full md:w-auto text-sm"
          >
            <Pencil size={18} className="drop-shadow-sm group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            <span className="drop-shadow-sm">Edit Configuration</span>
          </Link>
        </motion.div>

        {/* --- HUD BENTO GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 90 }}
            className="col-span-1 lg:col-span-8 flex flex-col gap-6 lg:gap-8"
          >
            <BentoCard>
              <div className="flex items-center justify-between mb-6 md:mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/[0.05] border border-white/[0.1] border-t-white/[0.2] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-md">
                    <Fingerprint className="text-sky-300 w-5 h-5 md:w-6 md:h-6 drop-shadow-md" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-md">Identity Matrix</h2>
                </div>
                <Database className="text-zinc-600 w-5 h-5 md:w-6 md:h-6 opacity-60" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <DataNode label="Legal Name" value={profile?.full_name} icon={User} />
                <DataNode label="Alias" value={profile?.display_name} icon={TerminalSquare} />
                <DataNode label="Organization" value={profile?.college} icon={GraduationCap} />
                <DataNode label="Age" value={profile?.age ? String(profile.age) : null} icon={Calendar} />
                <DataNode label="Gender" value={profile?.gender} icon={Activity} />
              </div>
            </BentoCard>

            {/* HIGH-GLASS ARENA PERFORMANCE DASHBOARD */}
            <div className="group relative rounded-[2rem] md:rounded-[2.5rem] bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] border-t-white/[0.2] border-l-white/[0.15] overflow-hidden flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-all duration-500 hover:border-white/[0.25] hover:shadow-[0_20px_40px_-15px_rgba(0,210,255,0.15)]">
              {/* Glossy Terminal Bar */}
              <div className="h-12 md:h-14 bg-black/60 border-b border-white/[0.1] flex items-center px-5 md:px-7 gap-3 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-xl relative z-20">
                <div className="flex gap-2">
                  <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-rose-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" />
                  <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-amber-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" />
                  <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-emerald-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" />
                </div>
                <div className="ml-4 md:ml-6 flex items-center gap-2 bg-black/50 border border-white/[0.1] px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest shadow-inner">
                  <Trophy size={14} className="text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" /> Arena_Metrics.dat
                </div>
              </div>
              
              <div className="p-6 md:p-10 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6 relative z-10 bg-gradient-to-b from-white/[0.02] to-transparent">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-50" />
                
                {/* Stat Modules */}
                <div className="relative z-10 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-md border border-white/[0.1] border-t-white/[0.2] rounded-[1.5rem] hover:bg-black/60 hover:-translate-y-1 transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                    <Target className="w-7 h-7 text-emerald-400 mb-3 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    <span className="text-4xl font-extrabold text-white mb-1 font-mono drop-shadow-md">{arenaStats.totalScore}</span>
                    <span className="text-[10px] text-emerald-200/70 font-bold uppercase tracking-widest text-center mt-1">Total Elo Score</span>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-md border border-white/[0.1] border-t-white/[0.2] rounded-[1.5rem] hover:bg-black/60 hover:-translate-y-1 transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                    <Activity className="w-7 h-7 text-sky-400 mb-3 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                    <span className="text-4xl font-extrabold text-white mb-1 font-mono drop-shadow-md">{arenaStats.problemsSolved}</span>
                    <span className="text-[10px] text-sky-200/70 font-bold uppercase tracking-widest text-center mt-1">Problems Solved</span>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-md border border-white/[0.1] border-t-white/[0.2] rounded-[1.5rem] hover:bg-black/60 hover:-translate-y-1 transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                    <Code2 className="w-7 h-7 text-purple-400 mb-3 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
                    <div className="flex gap-2 mb-2 flex-wrap justify-center">
                        {arenaStats.languages.length > 0 ? arenaStats.languages.map(lang => (
                            <span key={lang} className="text-[10px] md:text-xs font-bold text-purple-100 bg-purple-500/20 border border-purple-500/30 px-2 py-1 rounded-lg uppercase font-mono shadow-sm backdrop-blur-sm">{lang}</span>
                        )) : <span className="text-zinc-500 font-mono text-sm bg-white/5 px-3 py-1 rounded-md shadow-inner border border-white/5">NULL</span>}
                    </div>
                    <span className="text-[10px] text-purple-200/70 font-bold uppercase tracking-widest text-center mt-1">Languages Used</span>
                </div>
              </div>

              {/* CONTEST HISTORY LOG */}
              <div className="border-t border-white/[0.1] p-6 md:p-8 bg-black/60 backdrop-blur-xl relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <History size={18} className="text-sky-400 drop-shadow-md" />
                    <h3 className="text-xs md:text-sm font-bold text-zinc-300 tracking-widest uppercase">Contest History Log</h3>
                  </div>
                  
                  <div className="space-y-4">
                      {attendedContests.length === 0 ? (
                          <div className="text-center py-8 text-sm text-zinc-500 font-mono bg-black/40 rounded-2xl border border-white/[0.05] shadow-inner">No contests attended yet.</div>
                      ) : (
                          attendedContests.map(contest => (
                              <div key={contest.id} className="group/log flex flex-col sm:flex-row sm:items-center justify-between bg-white/[0.02] border border-white/[0.05] border-t-white/[0.1] p-5 rounded-2xl hover:bg-white/[0.06] transition-all gap-4 sm:gap-0 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
                                  <div>
                                      <h4 className="text-white font-bold text-sm md:text-base mb-1.5 drop-shadow-sm">{contest.title}</h4>
                                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                                          <Calendar size={14} className="text-zinc-500" /> {new Date(contest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </div>
                                  </div>
                                  <div className="flex items-center justify-center sm:justify-start gap-2 bg-gradient-to-b from-emerald-400/20 to-emerald-600/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/30 border-t-emerald-400/50 w-full sm:w-auto shadow-[0_2px_8px_rgba(16,185,129,0.2)]">
                                      <span className="font-extrabold font-mono text-sm md:text-base drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]">+{contest.score}</span>
                                      <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-200">PTS</span>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 90 }}
            className="col-span-1 lg:col-span-4 flex flex-col gap-6 lg:gap-8"
          >
            {/* System Integrity Circle */}
            <BentoCard className="!p-6 md:!p-8 flex flex-col items-center justify-center text-center">
              <h2 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-6 md:mb-8 w-full text-left drop-shadow-sm">System Integrity</h2>
              
              <div className="relative w-32 h-32 md:w-40 md:h-40 mb-4 md:mb-6 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100" style={{ filter: "drop-shadow(0px 0px 10px rgba(0, 210, 255, 0.4))" }}>
                  <circle 
                    cx="50" cy="50" r="42" 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeWidth="8" 
                    fill="none" 
                  />
                  <motion.circle 
                    initial={{ strokeDashoffset: 264 }} 
                    animate={{ strokeDashoffset: 264 - (264 * completionPercentage) / 100 }} 
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    cx="50" cy="50" r="42" 
                    stroke="url(#gradient)" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray="264" 
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00d2ff" />
                      <stop offset="100%" stopColor="#7000ff" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tighter drop-shadow-md">
                    {completionPercentage}%
                  </span>
                </div>
              </div>
              <p className="text-[11px] md:text-xs text-sky-200/80 font-bold tracking-wide">Profile Parameters Configured</p>
            </BentoCard>

            {/* Network Nodes */}
            <BentoCard className="!p-6 md:!p-8">
              <h2 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-4 md:mb-5 flex items-center gap-2 drop-shadow-sm">
                <Network size={14} className="text-sky-400" /> Network Nodes
              </h2>
              
              <div className="flex flex-col gap-3 md:gap-4 relative z-10">
                {profile?.github_url ? (
                  <a href={profile.github_url} target="_blank" rel="noreferrer" className="group/link flex items-center justify-between p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.1] border-t-white/[0.2] shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] hover:bg-black/60 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all">
                    <div className="flex items-center gap-3">
                      <Github size={20} className="text-white drop-shadow-md" />
                      <span className="text-sm font-bold text-white drop-shadow-sm">GitHub</span>
                    </div>
                    <ArrowUpRight size={16} className="text-zinc-500 group-hover/link:text-sky-400 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-all" />
                  </a>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/[0.05] shadow-inner">
                     <div className="flex items-center gap-3">
                      <Github size={20} className="text-zinc-600" />
                      <span className="text-sm font-bold text-zinc-500">GitHub</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono bg-white/5 px-2 py-1 rounded">NULL</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.1] border-t-white/[0.2] shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-3 w-full">
                    <Mail size={18} className="text-zinc-400 shrink-0" />
                    <span className="text-sm font-medium text-white truncate drop-shadow-sm">{profile?.email || user?.email}</span>
                  </div>
                </div>
              </div>
            </BentoCard>

            {/* Telemetry Config */}
            <BentoCard className="!p-6 md:!p-8 relative overflow-hidden">
              <Map className="absolute -right-6 -bottom-6 w-32 h-32 md:w-40 md:h-40 text-white/[0.03] rotate-12 pointer-events-none z-0" />
              
              <div className="flex items-center gap-2 mb-4 md:mb-5 relative z-10">
                <MapPin className="text-sky-400 w-4 h-4" />
                <h2 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase drop-shadow-sm">Telemetry Config</h2>
              </div>
              
              <div className="relative z-10 p-5 md:p-6 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.1] border-t-white/[0.2] shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] hover:bg-black/60 transition-colors group/node">
                <div className="flex items-center gap-2 mb-2 text-zinc-400">
                  <Globe2 size={14} className="group-hover/node:text-sky-400 transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-widest drop-shadow-sm">Current Location</span>
                </div>
                
                {profile?.city || profile?.state || profile?.country ? (
                  <span className="text-sm md:text-base font-bold text-white tracking-tight leading-snug drop-shadow-md">
                    {[profile?.city, profile?.state, profile?.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-600 font-mono italic flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
                    Unassigned
                  </span>
                )}
              </div>
            </BentoCard>
          </motion.div>

        </div>
      </main>
      
      <div className="relative z-10 border-t border-white/[0.05] bg-black/40 backdrop-blur-xl">
        <Footer />
      </div>
    </div>
  );
};

export default Profile;