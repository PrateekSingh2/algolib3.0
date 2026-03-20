import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Trophy, Clock, Calendar, ChevronRight, Activity, Code2, Sparkles, ArrowRight, Loader2, BarChart2, X, Medal, HeartHandshake } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AppFooter from '@/components/AppFooter';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const VIDEO_URL = "https://ik.imagekit.io/g7e4hyclo/contest-bg.mp4";
const CACHE_NAME = "algolib-media-cache-v1";

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

export default function Contests() {
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  // Leaderboard State
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<any | null>(null);
  const [lbData, setLbData] = useState<any[]>([]);
  const [loadingLb, setLoadingLb] = useState(false);

  // Video Caching Logic
  useEffect(() => {
    const loadAndCacheVideo = async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(VIDEO_URL);

        if (cachedResponse) {
          // Video is found in local cache, create a local blob URL
          const blob = await cachedResponse.blob();
          setVideoSrc(URL.createObjectURL(blob));
        } else {
          // Fetch from network, cache it, then display
          const fetchResponse = await fetch(VIDEO_URL);
          if (fetchResponse.ok) {
            cache.put(VIDEO_URL, fetchResponse.clone());
            const blob = await fetchResponse.blob();
            setVideoSrc(URL.createObjectURL(blob));
          }
        }
      } catch (error) {
        console.error("Video caching failed, falling back to network URL:", error);
        // Fallback directly to the URL if the Cache API fails or is unsupported
        setVideoSrc(VIDEO_URL);
      }
    };

    loadAndCacheVideo();

    // Cleanup blob URL on unmount to prevent memory leaks
    return () => {
      if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, []); // Empty dependency array ensures this runs once

  useEffect(() => {
    const fetchContests = async () => {
      const { data, error } = await supabase.from('contests').select('*').order('start_time', { ascending: true });
      if (!error && data) setContests(data);
      setLoading(false);
    };
    fetchContests();

    const channel = supabase
      .channel('realtime_contests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contests' }, () => { fetchContests(); })
      .subscribe();

    const timer = setInterval(() => { setCurrentTime(new Date().getTime()); }, 10000);
    return () => { supabase.removeChannel(channel); clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!selectedLeaderboard) return;
    const fetchLeaderboard = async () => {
      setLoadingLb(true);
      const { data: pData } = await supabase.from('problems').select('id').eq('contest_id', selectedLeaderboard.id);
      
      if (!pData || pData.length === 0) {
        setLbData([]); setLoadingLb(false); return;
      }
      
      const pIds = pData.map(p => p.id);
      // Order by created_at ascending ensures we process the FIRST successful submission
      const { data: lData } = await supabase.from('leaderboard').select('*').in('problem_id', pIds).order('created_at', { ascending: true });

      if (lData) {
        const userMap: Record<string, any> = {};
        
        lData.forEach(entry => {
          if (!userMap[entry.user_uid]) {
            userMap[entry.user_uid] = { uid: entry.user_uid, name: entry.display_name, score: 0, time: 0, langs: new Set(), solvedProblems: new Set() };
          }
          const u = userMap[entry.user_uid];
          
          if (!u.solvedProblems.has(entry.problem_id)) {
            if (entry.score > 0) {
                u.solvedProblems.add(entry.problem_id);
                u.score += entry.score;
                u.time += entry.time_taken_seconds;
                u.langs.add(entry.language_used);
            }
          }
        });

        // Sort by Score (Desc), then by Time Taken (Asc)
        const sorted = Object.values(userMap).sort((a, b) => {
           if (b.score !== a.score) return b.score - a.score;
           return a.time - b.time; 
        });
        
        setLbData(sorted);
      }
      setLoadingLb(false);
    };

    fetchLeaderboard();
  }, [selectedLeaderboard]);

  const liveContests = contests.filter(c => new Date(c.start_time).getTime() <= currentTime && new Date(c.end_time).getTime() > currentTime);
  const upcomingContests = contests.filter(c => new Date(c.start_time).getTime() > currentTime);
  const pastContests = contests.filter(c => new Date(c.end_time).getTime() <= currentTime).reverse();

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  };

  const formatLbTime = (seconds: number) => {
    const safeSecs = Math.max(0, Math.floor(seconds));
    const h = Math.floor(safeSecs / 3600);
    const m = Math.floor((safeSecs % 3600) / 60);
    const s = Math.floor(safeSecs % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 font-sans selection:bg-sky-500/30 overflow-hidden relative">
      {/* Cool background video with dynamic cached source */}
      {videoSrc && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover z-0 opacity-30"
          src={videoSrc}
        />
      )}
      {/* Gradient overlay: dark at top (for readability), fades to solid at bottom so cards are clean */}
      <div className="fixed inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/70 via-black/50 to-[#050505]" />
      {/* Subtle scanlines */}
      <div className="fixed inset-0 z-[1] pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.08)_3px,rgba(0,0,0,0.08)_4px)]" />

      <Navbar />

      <AnimatePresence>
        {selectedLeaderboard && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-4xl max-h-[80vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20"><Trophy size={20} className="text-sky-400" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedLeaderboard.title}</h2>
                    <p className="text-xs text-zinc-400">Global Leaderboard</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLeaderboard(null)} title="Close leaderboard" aria-label="Close leaderboard" className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-zinc-500 hover:text-white" /></button>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar p-6">
                {loadingLb ? (
                  <div className="h-40 flex flex-col items-center justify-center gap-3 text-sky-400"><Loader2 className="animate-spin" size={32} /><span className="text-sm font-medium text-zinc-400">Calculating Rankings...</span></div>
                ) : lbData.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center gap-3 text-zinc-500"><BarChart2 size={32} className="opacity-20" /><span className="text-sm font-medium">No successful submissions yet.</span></div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                        <th className="pb-4 pl-4 w-16 text-center">Rank</th>
                        <th className="pb-4">Developer</th>
                        <th className="pb-4 text-center">Score</th>
                        <th className="pb-4 text-center">Time Taken (HH:MM:SS)</th>
                        <th className="pb-4 pr-4 text-right">Language</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {lbData.map((user, idx) => (
                        <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-4 pl-4 text-center">
                            {idx === 0 ? <Medal size={20} className="text-yellow-400 mx-auto drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" /> : 
                             idx === 1 ? <Medal size={20} className="text-zinc-300 mx-auto drop-shadow-[0_0_8px_rgba(212,212,216,0.5)]" /> : 
                             idx === 2 ? <Medal size={20} className="text-amber-600 mx-auto drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" /> : 
                             <span className="font-bold text-zinc-500 group-hover:text-zinc-300">{idx + 1}</span>}
                          </td>
                          <td className="py-4">
                            <div className="font-bold text-white flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-purple-500 flex items-center justify-center text-[10px] text-white shadow-sm">{user.name.charAt(0).toUpperCase()}</div>
                              {user.name}
                            </div>
                          </td>
                          <td className="py-4 text-center font-mono font-bold text-emerald-400">{user.score}</td>
                          <td className="py-4 text-center font-mono text-sm text-zinc-400">{formatLbTime(user.time)}</td>
                          <td className="py-4 pr-4 text-right">
                            <div className="flex justify-end gap-1">
                              {Array.from(user.langs).map((l: any) => (
                                <span key={l} className="px-2 py-0.5 bg-zinc-800 border border-white/10 rounded text-[10px] font-bold uppercase text-zinc-300">{l}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="relative z-[2] pt-32 pb-24 px-6 container mx-auto max-w-6xl">
        
        <div className="mb-20 text-center flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-500/20 bg-sky-500/10 backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(14,165,233,0.15)]"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-sky-400 font-bold tracking-widest uppercase">AlgoLib Arena</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-6 tracking-tight leading-[1.1] pb-2"
          >
            Competitive <br className="hidden md:block"/> Programming.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8"
          >
            Compete globally, climb the leaderboard, and master complex data structures in real-time, low-latency execution environments.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link 
              to="/support" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:-translate-y-0.5 group"
            >
              <HeartHandshake className="w-5 h-5 text-sky-400 group-hover:text-sky-300 transition-colors" />
              <span>Partner & Sponsor a Contest</span>
            </Link>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
            <p className="text-sm font-medium text-zinc-500 tracking-wide animate-pulse">Initializing Arena...</p>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-20">
            
            {/* --- LIVE NOW SECTION --- */}
            {liveContests.length > 0 && (
              <motion.section variants={itemVariants}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Live Contests</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {liveContests.map(c => (
                    <div key={c.id} className="relative group rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.03] overflow-hidden hover:bg-emerald-500/[0.05] transition-all duration-500 flex flex-col">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[80px] -mr-20 -mt-20 rounded-full transition-opacity group-hover:opacity-100 opacity-50"></div>
                      
                      <div className="relative z-10 p-8 flex flex-col flex-1">
                        <div className="flex-1">
                          <h3 className="text-3xl font-bold text-white mb-3">{c.title}</h3>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
                            <Clock size={14}/> Ends: {formatDate(c.end_time)}
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Link to={`/contest/${c.id}`} className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5">
                            Enter Arena <ArrowRight size={18} />
                          </Link>
                          <button onClick={() => setSelectedLeaderboard(c)} className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3.5 px-6 rounded-xl transition-all hover:-translate-y-0.5">
                            <BarChart2 size={18} className="text-sky-400" /> Leaderboard
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* --- UPCOMING SECTION --- */}
            <motion.section variants={itemVariants}>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400"><Calendar size={18} /></div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Upcoming Contests</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingContests.length === 0 && (
                  <div className="col-span-full py-12 px-6 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col items-center text-center">
                    <Calendar className="w-12 h-12 text-zinc-600 mb-4" />
                    <p className="text-zinc-400 font-medium">No upcoming contests scheduled.</p>
                    <p className="text-sm text-zinc-500 mt-1">Check back later for new arena events.</p>
                  </div>
                )}
                {upcomingContests.map(c => (
                  <div key={c.id} className="group flex flex-col rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl p-6 hover:bg-zinc-900/60 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 shadow-lg">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-4 line-clamp-2">{c.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
                        <Clock size={14} className="text-sky-400"/> {formatDate(c.start_time)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to={`/contest/${c.id}`} className="flex-1 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors border border-white/5 group-hover:border-white/10">
                          View Details
                        </Link>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* --- PAST SECTION --- */}
            <motion.section variants={itemVariants}>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-zinc-800 border border-white/10 text-zinc-400"><Code2 size={18} /></div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Past Contests</h2>
              </div>
              
              <div className="flex flex-col gap-3">
                {pastContests.length === 0 && (
                   <div className="py-8 px-6 rounded-2xl border border-white/5 bg-white/[0.01] text-center text-zinc-500 text-sm">
                     History is empty.
                   </div>
                )}
                {pastContests.map(c => (
                  <div key={c.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 gap-4">
                    <div className="flex items-start md:items-center gap-4">
                      <div className="hidden md:flex w-10 h-10 rounded-full bg-zinc-900 border border-white/10 items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                        <Trophy size={16} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-200 group-hover:text-white transition-colors mb-1">{c.title}</h3>
                        <p className="text-xs text-zinc-500 font-medium">Ended: {formatDate(c.end_time)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                      <button onClick={() => setSelectedLeaderboard(c)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-medium text-zinc-300 bg-white/5 border border-white/5 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                        <BarChart2 size={16} className="text-sky-400" /> Leaderboard
                      </button>
                      <Link to={`/contest/${c.id}`} className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-medium text-sky-400 bg-sky-400/10 px-4 py-2 rounded-lg hover:bg-sky-400 hover:text-black transition-colors">
                        Practice Mode <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

          </motion.div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}