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



const ApexBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-[#000000] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_40%,transparent_100%)]" />
    <div className="absolute top-[-10%] right-[-5%] w-[60vw] md:w-[40vw] h-[40vh] bg-[#00d2ff] rounded-[100%] blur-[100px] md:blur-[150px] mix-blend-screen opacity-[0.15] md:opacity-[0.1]" />
    <div className="absolute bottom-[-10%] left-[-5%] w-[60vw] md:w-[40vw] h-[40vh] bg-[#7000ff] rounded-[100%] blur-[100px] md:blur-[150px] mix-blend-screen opacity-[0.15] md:opacity-[0.1]" />
  </div>
);

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
      className={`group relative rounded-3xl md:rounded-[2rem] bg-[#050505] border border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-colors duration-500 flex flex-col p-6 md:p-8 shadow-2xl ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl md:rounded-[2rem] opacity-0 transition duration-500 group-hover:opacity-100 z-20 hidden sm:block"
        style={{
          background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.06), transparent 80%)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative z-30 flex-1 flex flex-col h-full">
        {children}
      </div>
    </div>
  );
};

const DataNode = ({ label, value, icon: Icon }: any) => (
  <div className="relative flex flex-col p-4 md:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.05)] hover:bg-white/[0.04] transition-colors group/node">
    <div className="flex items-center gap-2 mb-2 md:mb-3 text-zinc-500">
      <Icon size={14} className="text-zinc-500 group-hover/node:text-zinc-300 transition-colors" />
      <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
    </div>
    {value && value !== "—" ? (
      <span className="text-sm font-medium text-zinc-200 tracking-tight leading-snug">{value}</span>
    ) : (
      <span className="text-xs text-zinc-600 font-mono italic flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-zinc-700" />
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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 flex flex-col">
      <ApexBackground />
      
      <div className="fixed top-0 left-0 w-full z-[100]">
        <Navbar />
      </div>

      <main className="flex-1 relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-24">
        
        {/* --- ELITE HEADER BANNER --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full rounded-3xl md:rounded-[2.5rem] bg-[#030303] border border-white/[0.08] p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center md:items-center justify-between gap-6 md:gap-8 mb-6 overflow-hidden shadow-2xl text-center md:text-left"
        >
          <div className="absolute top-0 right-0 w-full md:w-[500px] h-[500px] bg-gradient-to-bl from-white/[0.04] to-transparent rounded-full blur-3xl pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 relative z-10 w-full md:w-auto">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-white/20 to-white/5 rounded-full blur opacity-40"></div>
              <div className="absolute inset-0 rounded-full border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] z-20 pointer-events-none"></div>
              <img 
                src={avatar} 
                alt={displayName} 
                className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full object-cover bg-[#0a0a0a] z-10"
              />
              <div className="absolute bottom-0 right-0 md:bottom-1 md:right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-black flex items-center justify-center z-30">
                <div className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse" />
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap justify-center md:justify-start">
                <span className="text-[9px] md:text-[10px] font-mono tracking-widest text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-md uppercase shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.05)]">
                  Lvl. 1 Developer
                </span>
                <span className="text-[9px] md:text-[10px] font-mono tracking-widest text-emerald-400 uppercase flex items-center gap-1.5">
                  <ShieldCheck size={12} /> Authenticated
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-1 leading-none">{displayName}</h1>
              <p className="text-xs md:text-sm text-zinc-400 font-mono mt-1">{user?.email}</p>
            </div>
          </div>

          <Link 
            to="/edit-profile" 
            className="group relative inline-flex items-center justify-center gap-2 md:gap-3 bg-green-700 text-black font-bold px-6 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-full transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] z-10 w-full md:w-auto text-sm"
          >
            <Pencil size={16} />
            <span>Edit Profile</span>
          </Link>
        </motion.div>

        {/* --- HUD BENTO GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="col-span-1 lg:col-span-8 flex flex-col gap-4 md:gap-6"
          >
            <BentoCard>
              <div className="flex items-center justify-between mb-5 md:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.05)]">
                    <Fingerprint className="text-zinc-400 w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <h2 className="text-lg md:text-xl font-medium text-white tracking-tight">Identity Matrix</h2>
                </div>
                <Database className="text-zinc-700 w-4 h-4 md:w-5 md:h-5 opacity-50" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <DataNode label="Legal Name" value={profile?.full_name} icon={User} />
                <DataNode label="Alias" value={profile?.display_name} icon={TerminalSquare} />
                <DataNode label="Organization" value={profile?.college} icon={GraduationCap} />
                <DataNode label="Age" value={profile?.age ? String(profile.age) : null} icon={Calendar} />
                <DataNode label="Gender" value={profile?.gender} icon={Activity} />
              </div>
            </BentoCard>

            {/* ARENA PERFORMANCE DASHBOARD */}
            <div className="group relative rounded-3xl md:rounded-[2rem] bg-[#0a0a0a] border border-white/[0.06] overflow-hidden flex flex-col shadow-2xl transition-colors hover:border-white/[0.15]">
              <div className="h-10 md:h-12 bg-[#111] border-b border-white/[0.05] flex items-center px-4 md:px-6 gap-3 shrink-0">
                <div className="flex gap-1.5 md:gap-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-zinc-700" />
                </div>
                <div className="ml-2 md:ml-4 flex items-center gap-1.5 md:gap-2 bg-black/50 border border-white/[0.05] px-2 md:px-3 py-1 rounded-md text-[9px] md:text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  <Trophy size={10} className="text-sky-400" /> Arena_Metrics.dat
                </div>
              </div>
              
              <div className="p-6 md:p-8 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 relative">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center justify-center p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] transition-colors">
                    <Target size={20} className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 mb-2 md:mb-3" />
                    <span className="text-2xl md:text-3xl font-bold text-white mb-1 font-mono">{arenaStats.totalScore}</span>
                    <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">Total Elo Score</span>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] transition-colors">
                    <Activity size={20} className="w-5 h-5 md:w-6 md:h-6 text-sky-400 mb-2 md:mb-3" />
                    <span className="text-2xl md:text-3xl font-bold text-white mb-1 font-mono">{arenaStats.problemsSolved}</span>
                    <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">Problems Solved</span>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] transition-colors">
                    <Code2 size={20} className="w-5 h-5 md:w-6 md:h-6 text-purple-400 mb-2 md:mb-3" />
                    <div className="flex gap-1.5 md:gap-2 mb-1 flex-wrap justify-center">
                        {arenaStats.languages.length > 0 ? arenaStats.languages.map(lang => (
                            <span key={lang} className="text-[10px] md:text-xs font-bold text-white bg-white/10 px-1.5 py-0.5 md:px-2 md:py-1 rounded uppercase font-mono">{lang}</span>
                        )) : <span className="text-zinc-500 font-mono text-xs md:text-sm">NULL</span>}
                    </div>
                    <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 text-center">Languages Used</span>
                </div>
              </div>

              {/* CONTEST HISTORY LOG */}
              <div className="border-t border-white/[0.05] p-6 md:p-8 bg-[#080808]">
                  <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <History size={16} className="text-zinc-400" />
                    <h3 className="text-xs md:text-sm font-bold text-white tracking-wider uppercase">Contest History Log</h3>
                  </div>
                  
                  <div className="space-y-3">
                      {attendedContests.length === 0 ? (
                          <div className="text-center py-6 text-xs md:text-sm text-zinc-600 font-mono">No contests attended yet.</div>
                      ) : (
                          attendedContests.map(contest => (
                              <div key={contest.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl hover:bg-white/[0.04] transition-colors gap-3 sm:gap-0">
                                  <div>
                                      <h4 className="text-white font-medium text-xs md:text-sm mb-1">{contest.title}</h4>
                                      <div className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-xs text-zinc-500">
                                          <Calendar size={12} /> {new Date(contest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </div>
                                  </div>
                                  <div className="flex items-center justify-center sm:justify-start gap-1.5 md:gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-full sm:w-auto">
                                      <span className="font-bold font-mono text-xs md:text-sm">+{contest.score}</span>
                                      <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest">PTS</span>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="col-span-1 lg:col-span-4 flex flex-col gap-4 md:gap-6"
          >
            <BentoCard className="!p-5 md:!p-6 flex flex-col items-center justify-center text-center">
              <h2 className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-4 md:mb-6 w-full text-left">System Integrity</h2>
              
              <div className="relative w-24 h-24 md:w-32 md:h-32 mb-3 md:mb-4 flex items-center justify-center">
                {/* Added viewBox="0 0 100 100" to lock the internal coordinate system */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
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
                  <span className="text-2xl md:text-3xl font-bold text-white tracking-tighter">
                    {completionPercentage}%
                  </span>
                </div>
              </div>
              <p className="text-[11px] md:text-xs text-zinc-400 font-medium">Profile Parameters Configured</p>
            </BentoCard>

            <BentoCard className="!p-5 md:!p-6">
              <h2 className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-3 md:mb-4 flex items-center gap-2">
                <Network size={14} /> Network Nodes
              </h2>
              
              <div className="flex flex-col gap-2 md:gap-3">
                {profile?.github_url ? (
                  <a href={profile.github_url} target="_blank" rel="noreferrer" className="group/link flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.05)] hover:bg-white/[0.06] transition-all">
                    <div className="flex items-center gap-3">
                      <Github size={16} className="text-white w-4 h-4 md:w-[18px] md:h-[18px]" />
                      <span className="text-xs md:text-sm font-medium text-zinc-200">GitHub</span>
                    </div>
                    <ArrowUpRight size={14} className="text-zinc-500 group-hover/link:text-white transition-colors w-3.5 h-3.5 md:w-4 md:h-4" />
                  </a>
                ) : (
                  <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/[0.01] border border-white/[0.02]">
                     <div className="flex items-center gap-3">
                      <Github size={16} className="text-zinc-700 w-4 h-4 md:w-[18px] md:h-[18px]" />
                      <span className="text-xs md:text-sm font-medium text-zinc-600">GitHub</span>
                    </div>
                    <span className="text-[9px] md:text-[10px] text-zinc-600 font-mono">NULL</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3 w-full">
                    <Mail size={16} className="text-zinc-400 shrink-0 w-4 h-4 md:w-[18px] md:h-[18px]" />
                    <span className="text-xs md:text-sm font-medium text-zinc-300 truncate">{profile?.email || user?.email}</span>
                  </div>
                </div>
              </div>
            </BentoCard>

            <BentoCard className="!p-5 md:!p-6 relative overflow-hidden">
              <Map className="absolute -right-4 -bottom-4 w-24 h-24 md:w-32 md:h-32 text-white/[0.02] rotate-12 pointer-events-none" />
              <div className="flex items-center gap-2 mb-3 md:mb-4 relative z-10">
                <MapPin className="text-zinc-500 w-3.5 h-3.5 md:w-4 md:h-4" />
                <h2 className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Telemetry Config</h2>
              </div>
              
              <div className="relative z-10 p-4 md:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.05)] hover:bg-white/[0.04] transition-colors group/node">
                <div className="flex items-center gap-2 mb-2 text-zinc-500">
                  <Globe2 size={12} className="group-hover/node:text-zinc-300 transition-colors" />
                  <span className="text-[10px] font-mono uppercase tracking-widest">Current Location</span>
                </div>
                
                {profile?.city || profile?.state || profile?.country ? (
                  <span className="text-xs md:text-sm font-medium text-zinc-200 tracking-tight leading-snug">
                    {[profile?.city, profile?.state, profile?.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                ) : (
                  <span className="text-[10px] md:text-xs text-zinc-600 font-mono italic flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                    Unassigned
                  </span>
                )}
              </div>
            </BentoCard>
          </motion.div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;