import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";

// --- PREMIUM SAAS BACKGROUND ---
const Background = () => (
  <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#000000]">
    {/* Fine Grid */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
    
    {/* Deep Ambient Glows */}
    <div className="absolute top-[10%] right-[15%] w-[50vw] h-[50vh] bg-blue-500/10 dark:bg-blue-900/10 rounded-full blur-[150px] mix-blend-screen" />
    <div className="absolute bottom-[10%] left-[15%] w-[50vw] h-[50vh] bg-indigo-500/10 dark:bg-indigo-900/10 rounded-full blur-[150px] mix-blend-screen" />
    
    {/* Center Spotlight */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.5] dark:bg-white/[0.015] rounded-full blur-[100px] pointer-events-none" />
  </div>
);

// --- "NULL" THE DISCONNECTED BOT ---
const DisconnectedBot = () => {
  return (
    <div className="relative flex flex-col items-center justify-center mb-8 h-48 w-48">
      {/* Background Glow */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl" 
      />

      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Holographic 404 Status */}
        <motion.div 
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute -top-10 text-red-400 font-mono text-xs font-bold tracking-widest bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20"
        >
          ERR_404
        </motion.div>

        {/* Bot Body (Glassmorphic) */}
        <div className="w-28 h-24 rounded-[32px] bg-gradient-to-b from-white/80 dark:from-white/[0.08] to-white/40 dark:to-white/[0.02] border border-slate-200 dark:border-white/[0.12] shadow-xl dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-center backdrop-blur-2xl relative overflow-hidden">
          
          {/* Inner Face/Visor */}
          <div className="w-20 h-12 bg-slate-900 dark:bg-black/60 rounded-[16px] border border-slate-700 dark:border-white/[0.05] shadow-inner flex items-center justify-center overflow-hidden relative">
            
            {/* Animated Eyes */}
            <motion.div 
              animate={{ 
                x: [0, -8, -8, 8, 8, 0], // Looking left and right
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
              className="flex gap-3 relative z-10"
            >
              {/* Left Eye */}
              <motion.div 
                animate={{ scaleY: [1, 0.1, 1, 1, 1] }} // Blinking
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1, 0.15, 1] }}
                className="w-3 h-4 bg-blue-400 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.8)]" 
              />
              {/* Right Eye */}
              <motion.div 
                animate={{ scaleY: [1, 0.1, 1, 1, 1] }} // Blinking
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1, 0.15, 1] }}
                className="w-3 h-4 bg-blue-400 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.8)]" 
              />
            </motion.div>

            {/* Scanning line effect */}
            <motion.div 
              animate={{ y: [-30, 30] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-x-0 h-4 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent pointer-events-none"
            />
          </div>
        </div>

        {/* Severed Data Tether */}
        <div className="relative mt-2">
          <svg width="40" height="60" viewBox="0 0 40 60" fill="none" className="overflow-visible">
            <motion.path 
              d="M20 0 C20 20, 10 30, 15 50" 
              stroke="url(#wireGradient)" 
              strokeWidth="4" 
              strokeLinecap="round" 
              animate={{ d: ["M20 0 C20 20, 10 30, 15 50", "M20 0 C20 20, 30 30, 25 50", "M20 0 C20 20, 10 30, 15 50"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Spark at the end of the wire */}
            <motion.circle 
              cx="15" cy="50" r="2.5" 
              fill="#ef4444" 
              animate={{ cx: [15, 25, 15], opacity: [1, 0.2, 1], scale: [1, 1.5, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="shadow-[0_0_10px_rgba(239,68,68,1)]"
            />
            <defs>
              <linearGradient id="wireGradient" x1="20" y1="0" x2="20" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="rgba(255,255,255,0.4)" />
                <stop offset="1" stopColor="rgba(255,255,255,0.05)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>
    </div>
  );
};

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#000000] text-slate-800 dark:text-white font-sans relative flex flex-col selection:bg-slate-300 dark:selection:bg-white/20">
      <Background />
      
      <div className="relative z-50">
        <Navbar />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 pt-24 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98, filter: "blur(10px)" }} 
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} 
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-xl mx-auto w-full flex flex-col items-center"
        >
          {/* Custom Animated 404 Mascot */}
          <DisconnectedBot />

          {/* Typography */}
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-slate-900 dark:from-white via-slate-500 dark:via-zinc-400 to-slate-300 dark:to-[#111] drop-shadow-sm">
            Lost Node.
          </h1>
          
          <h2 className="text-lg sm:text-xl font-bold text-slate-700 dark:text-zinc-100 mb-4 tracking-tight">
            Dangling pointer detected
          </h2>
          
          <p className="text-slate-500 dark:text-zinc-400 text-[14px] sm:text-[15px] leading-relaxed mb-10 max-w-md mx-auto font-medium">
            We couldn't resolve the algorithmic path you requested. The endpoint at
            <span className="block mt-3">
              <code className="bg-black/50 border border-red-500/20 px-3 py-2 rounded-xl text-red-400 font-mono text-[13px] break-all shadow-inner inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {location.pathname}
              </code>
            </span>
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => navigate(-1)} 
              className="w-full sm:w-auto px-7 py-3.5 rounded-[16px] bg-white dark:bg-[#09090b] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-300 text-[15px] font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.15] hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95 group shadow-sm dark:shadow-lg"
            >
              <ArrowLeft size={16} className="text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors group-hover:-translate-x-0.5" /> 
              Go Back
            </button>
            <Link 
              to="/" 
              className="w-full sm:w-auto px-7 py-3.5 rounded-[16px] bg-slate-900 dark:bg-white text-white dark:text-black text-[15px] font-bold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md dark:shadow-[0_0_40px_rgba(255,255,255,0.2)] group"
            >
              <Home size={16} className="text-slate-400 dark:text-zinc-600 group-hover:text-white dark:group-hover:text-black transition-colors" /> 
              Return Home
            </Link>
          </div>

        </motion.div>
      </main>
    </div>
  );
};

export default NotFound;