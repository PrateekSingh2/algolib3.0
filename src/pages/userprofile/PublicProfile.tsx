import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import { useAuth } from "@/contexts/AuthContext";

import {
  MapPin, Link as LinkIcon, Github, Linkedin,
  Target, Trophy, Code2, Calendar, Lock, EyeOff, Hash,
  GraduationCap, User, Activity, BadgeCheck, Pencil, History, Mail, AlertCircle, ChevronRight
} from "lucide-react";

// --- PREMIUM 2026 SAAS CARD COMPONENT ---
const PremiumCard = ({ children, className = "", noPadding = false }: { children: React.ReactNode; className?: string; noPadding?: boolean }) => (
  <div className={`bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl rounded-[24px] shadow-sm dark:shadow-none border border-slate-200/50 dark:border-white/[0.05] transition-all duration-300 hover:shadow-md dark:hover:border-white/[0.1] ${noPadding ? "" : "p-6 md:p-8"} ${className}`}>
    {children}
  </div>
);

// --- IDENTITY DETAILS ROW ---
const DetailRow = ({ icon: Icon, label, value, isPublicFlag }: any) => {
  const isPrivateAndLocked = !isPublicFlag && (value === null || value === undefined);
  const isPrivateButVisible = !isPublicFlag && (value !== null && value !== undefined);

  if (isPrivateAndLocked) return null;

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50 transition-all duration-300 group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-white/[0.05] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
          <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 break-words">
            {value || <span className="text-slate-400 italic font-normal">Not set</span>}
          </span>
        </div>
      </div>
      {isPrivateButVisible && (
        <div title="Visible only to you" className="p-2 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
        </div>
      )}
    </div>
  );
};

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [arenaStats, setArenaStats] = useState({ totalScore: 0, problemsSolved: 0, languages: [] as string[] });
  const [attendedContests, setAttendedContests] = useState<any[]>([]);

  const isOwner = user?.uid === profileData?.firebase_uid;

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        let headers: any = {};
        if (user) {
          try {
            const token = await user.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
          } catch (e) { }
        }
        const response = await fetch(`/.netlify/functions/get-public-profile?username=${encodeURIComponent(username || '')}`, { headers });
        if (!response.ok) {
          if (response.status === 404) throw new Error("Profile not found.");
          throw new Error("Error fetching profile.");
        }
        const data = await response.json();
        setProfileData(data);

        if (data && data.firebase_uid) {
          const statsRes = await fetch(`/.netlify/functions/get-profile-stats?uid=${data.firebase_uid}`);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            const lbData = statsData.leaderboard || [];
            const pData = statsData.problems || [];
            const cData = statsData.contests || [];

            if (lbData.length > 0) {
              let score = 0;
              const uniqueProblems = new Set();
              const langs = new Set<string>();

              const successfulSolves = lbData.filter((e: any) => e.score > 0).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

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
                          id: cId, title: cMap[cId].title, date: cMap[cId].start_time, score: 0
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
          }
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchPublicProfile();
  }, [username, user]);

  // --- SKELETON LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-[#020617] dark:via-[#071120] dark:to-[#0b1220] flex flex-col relative overflow-hidden">
        <div className="fixed top-0 left-0 w-full z-50 bg-white/70 dark:bg-[#020617]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.05]">
          <Navbar />
        </div>
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 pt-32 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-3 flex flex-col gap-8 animate-pulse">
            <div className="h-[450px] bg-slate-200/50 dark:bg-slate-800/50 rounded-[24px]"></div>
          </div>
          <div className="lg:col-span-6 flex flex-col gap-8 animate-pulse">
            <div className="h-[120px] bg-slate-200/50 dark:bg-slate-800/50 rounded-[24px]"></div>
            <div className="h-[400px] bg-slate-200/50 dark:bg-slate-800/50 rounded-[24px]"></div>
          </div>
          <div className="lg:col-span-3 flex flex-col gap-8 animate-pulse">
            <div className="h-[200px] bg-slate-200/50 dark:bg-slate-800/50 rounded-[24px]"></div>
            <div className="h-[300px] bg-slate-200/50 dark:bg-slate-800/50 rounded-[24px]"></div>
          </div>
        </main>
      </div>
    );
  }

  // --- PREMIUM ERROR STATE ---
  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-[#020617] dark:via-[#071120] dark:to-[#0b1220] flex flex-col relative overflow-hidden">
        <div className="fixed top-0 left-0 w-full z-50 bg-white/70 dark:bg-[#020617]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.05]">
          <Navbar />
        </div>
        <main className="flex-1 w-full flex items-center justify-center px-4">
          <PremiumCard className="max-w-md w-full text-center flex flex-col items-center gap-6 p-10">
            <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center border border-rose-100 dark:border-rose-500/20">
              <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Profile Not Found</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">The user @{username} does not exist or has been removed.</p>
            </div>
            <Link to="/" className="mt-2 w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-300 shadow-md">
              Return Home
            </Link>
          </PremiumCard>
        </main>
      </div>
    );
  }

  const displayName = profileData.display_name || profileData.full_name || `@${profileData.username}`;
  const avatar = profileData.avatar_url || "https://placehold.co/140x140/111/fff?text=U";

  const isLocationPrivateAndLocked = !profileData.location_public && (!profileData.location || (!profileData.location.city && !profileData.location.state && !profileData.location.country));
  const isLocationPrivateButVisible = !profileData.location_public && profileData.location && (profileData.location.city || profileData.location.state || profileData.location.country);

  let locationString = null;
  if (!isLocationPrivateAndLocked && profileData.location) {
    locationString = [profileData.location.city, profileData.location.state, profileData.location.country].filter(Boolean).join(", ");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-[#020617] dark:via-[#071120] dark:to-[#0b1220] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col relative overflow-hidden">

      {/* --- AMBIENT BLUR ORBS --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-500/20 dark:bg-sky-500/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 dark:bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-purple-500/20 dark:bg-purple-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* --- PREMIUM NAVBAR --- */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white/70 dark:bg-[#020617]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.05] shadow-sm">
        <Navbar />
      </div>

      <main className="flex-1 w-full max-w-[1440px] mx-auto pt-24 md:pt-32 pb-24 px-4 md:px-8 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 relative">

          {/* =========================================
              LEFT WIDE BLOCK: HERO & FEED (9/12)
          ========================================= */}
          <div className="lg:col-span-9 flex flex-col gap-6 md:gap-8">

            {/* Cover Banner (Spans Col 1 + Col 2) */}
            <div className="w-full aspect-[3/1] md:aspect-[4/1] rounded-[24px] md:rounded-[32px] relative overflow-hidden shadow-sm border border-slate-200/50 dark:border-white/[0.05]">
              {profileData.banner_url ? (
                <img src={profileData.banner_url} alt="Cover Banner" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500">
                  <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-9 gap-8 lg:gap-10">

              {/* =========================================
                  COLUMN 1: HERO PROFILE (3/9)
              ========================================= */}
              <div className="lg:col-span-3 flex flex-col gap-8">
                <PremiumCard noPadding className="flex flex-col group/hero relative hover:-translate-y-1">
                  {/* Avatar & Info */}
                  <div className="px-6 pb-8 relative flex flex-col">
                    <div className="relative w-fit -mt-20 md:-mt-28 mb-4 ml-1 md:ml-2">
                      <img
                        src={avatar}
                        alt={displayName}
                        className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded-full object-cover border-[6px] border-white dark:border-[#071120] shadow-xl bg-white dark:bg-[#071120] relative z-10"
                      />
                      {profileData.is_verified && (
                        <div className="absolute bottom-2 right-2 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md rounded-full p-1 shadow-lg border border-white/20 z-20">
                          <BadgeCheck className="w-6 h-6 md:w-7 md:h-7 text-sky-500 drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-full ring-2 ring-indigo-500/20 scale-110 opacity-0 group-hover/hero:opacity-100 group-hover/hero:scale-125 transition-all duration-700" />
                    </div>

                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                      {displayName}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-base mb-4">
                      @{profileData.username}
                    </p>

                    {locationString && (
                      <div className="flex items-center gap-2 mb-6 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/50 w-fit backdrop-blur-md">
                        <MapPin size={14} className="text-indigo-500" />
                        <span className="truncate max-w-[200px]">{locationString}</span>
                        {isLocationPrivateButVisible && (
                          <div title="Visible only to you" className="ml-1"><Lock size={12} className="text-amber-500" /></div>
                        )}
                      </div>
                    )}

                    {profileData.bio && (
                      <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-8 max-w-full text-left">
                        {profileData.bio}
                      </p>
                    )}

                    {/* Analytics Strip Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 mb-8 w-full">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/[0.05] hover:-translate-y-0.5 transition-transform flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-black text-slate-900 dark:text-white">{arenaStats.totalScore}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Score</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/[0.05] hover:-translate-y-0.5 transition-transform flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-black text-slate-900 dark:text-white">{arenaStats.problemsSolved}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Problems</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/[0.05] hover:-translate-y-0.5 transition-transform flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-black text-slate-900 dark:text-white">{attendedContests.length}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Contests</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/[0.05] hover:-translate-y-0.5 transition-transform flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-black text-slate-900 dark:text-white">{arenaStats.languages.length}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Languages</span>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-3 w-full mb-6">
                      {profileData.linkedin_url && (
                        <a href={profileData.linkedin_url} target="_blank" rel="noreferrer" title="LinkedIn" className="flex-1 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-[#0a66c2]/10 dark:hover:bg-[#0a66c2]/20 text-[#0a66c2] dark:text-[#70b5f9] border border-slate-200 dark:border-slate-700/50 transition-all duration-300 flex justify-center items-center group/social hover:scale-105">
                          <Linkedin className="w-5 h-5 group-hover/social:scale-110 transition-transform" />
                        </a>
                      )}
                      {profileData.github_url && (
                        <a href={profileData.github_url} target="_blank" rel="noreferrer" title="GitHub" className="flex-1 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/50 transition-all duration-300 flex justify-center items-center group/social hover:scale-105">
                          <Github className="w-5 h-5 group-hover/social:scale-110 transition-transform" />
                        </a>
                      )}
                      {profileData.email && (
                        <a href={`mailto:${profileData.email}`} title="Email" className="flex-1 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-slate-200 dark:border-slate-700/50 transition-all duration-300 flex justify-center items-center group/social hover:scale-105">
                          <Mail className="w-5 h-5 group-hover/social:scale-110 transition-transform" />
                        </a>
                      )}
                    </div>

                    {/* Edit Profile */}
                    {isOwner && (
                      <Link to="/edit-profile" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-indigo-500/20 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all duration-300 group">
                        <Pencil className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                        <span>Edit Profile</span>
                      </Link>
                    )}
                  </div>
                </PremiumCard>
              </div>

              {/* =========================================
            COLUMN 2: ACTIVITY FEED (6/12)
        ========================================= */}
              <div className="lg:col-span-6 flex flex-col gap-8">

                {/* Arena History Timeline Centerpiece */}
                <PremiumCard noPadding className="flex flex-col">
                  <div className="p-6 md:p-8 border-b border-slate-200/50 dark:border-white/[0.05] flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100/50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200/50 dark:border-emerald-500/20">
                        <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Arena History</h2>
                    </div>
                    <span className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-full border border-slate-200/80 dark:border-white/[0.05] shadow-sm uppercase tracking-wider">
                      {attendedContests.length} Matches
                    </span>
                  </div>

                  <div className="p-6 md:p-8 relative">
                    {attendedContests.length === 0 ? (
                      <div className="py-16 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-200/50 dark:border-white/[0.05]">
                          <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Arena Activity Yet</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">This user has not participated in any competitive programming contests.</p>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 lg:ml-6 space-y-8 py-4">
                        {attendedContests.map((contest, idx) => (
                          <div key={contest.id} className="relative pl-8 md:pl-10 group">
                            {/* Timeline Dot */}
                            <div className="absolute w-4 h-4 bg-white dark:bg-slate-900 border-4 border-indigo-500 rounded-full -left-[9px] top-4 group-hover:scale-125 group-hover:bg-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.4)]" />

                            {/* Timeline Card */}
                            <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.05] shadow-sm group-hover:shadow-md group-hover:-translate-y-1 group-hover:border-indigo-500/30 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex flex-col gap-2">
                                <h4 className="font-extrabold text-slate-900 dark:text-white text-base md:text-lg tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {contest.title}
                                </h4>
                                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(contest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex items-center self-start sm:self-auto">
                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-200/50 dark:border-emerald-500/20 backdrop-blur-md group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all duration-300 flex items-center gap-1.5">
                                  <ArrowUpRight className="w-4 h-4" />
                                  +{contest.score} PTS
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </PremiumCard>

                {/* Tech Stack Horizontal Pills */}
                <PremiumCard>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100/50 dark:bg-purple-500/10 rounded-xl border border-purple-200/50 dark:border-purple-500/20">
                        <Code2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Tech Stack</h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {arenaStats.languages.length > 0 ? arenaStats.languages.map(lang => (
                      <span key={lang} className="px-5 py-2.5 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-bold rounded-full border border-slate-200 dark:border-slate-700/50 uppercase tracking-widest hover:border-indigo-500/50 hover:shadow-md hover:-translate-y-0.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 cursor-default">
                        {lang}
                      </span>
                    )) : (
                      <div className="w-full py-4 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                        <span className="text-sm text-slate-500 dark:text-slate-500 font-medium">No languages recorded yet.</span>
                      </div>
                    )}
                  </div>
                </PremiumCard>
              </div>
            </div>
          </div>

          {/* =========================================
            COLUMN 3: METRICS & DETAILS (3/12)
        ========================================= */}
          <div className="lg:col-span-3 flex flex-col gap-8">

            {/* Main Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-8">
              <PremiumCard noPadding className="flex flex-col items-center justify-center text-center group p-4 sm:p-6 md:p-8 h-full">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 mb-3 md:mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                  <Target className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                </div>
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{arenaStats.totalScore}</span>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest text-balance">Total Score</span>
              </PremiumCard>

              <PremiumCard noPadding className="flex flex-col items-center justify-center text-center group p-4 sm:p-6 md:p-8 h-full">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center border border-sky-100 dark:border-sky-500/20 mb-3 md:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Activity className="w-5 h-5 md:w-6 md:h-6 text-sky-500" />
                </div>
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{arenaStats.problemsSolved}</span>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest text-balance">Problems Solved</span>
              </PremiumCard>
            </div>

            {/* Identity Details List */}
            <PremiumCard noPadding className="flex flex-col overflow-hidden">
              <div className="p-5 md:p-6 border-b border-slate-200/50 dark:border-white/[0.05] flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/30">
                <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h2 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Identity Details</h2>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <DetailRow icon={User} label="Legal Name" value={profileData.full_name} isPublicFlag={true} />
                <DetailRow icon={GraduationCap} label="Organization" value={profileData.college} isPublicFlag={true} />
                <DetailRow icon={Calendar} label="Age" value={profileData.age} isPublicFlag={profileData.age_public} />
                <DetailRow icon={Hash} label="Gender" value={profileData.gender} isPublicFlag={profileData.gender_public} />
              </div>
            </PremiumCard>

          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

// Quick helper for timeline score badge
const ArrowUpRight = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7h10v10" /><path d="M7 17 17 7" />
  </svg>
)

export default PublicProfile;
