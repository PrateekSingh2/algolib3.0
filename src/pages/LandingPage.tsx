import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Zap, ChevronDown, 
  ListFilter, Code, Users, Trophy, Cpu, Network, Focus, Target, Shield, Activity, Workflow, Terminal, Braces,
  Sparkles, X, Github 
} from "lucide-react";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import { executeGoogleSignIn, executeGithubSignIn } from "@/contexts/AuthContext";

// ─── SPOTLIGHT COMPONENT ─────────────────────────────────────────────────────
const SpotlightCard = ({ children, className = "", onClick, span = "" }: { children: React.ReactNode, className?: string, onClick?: () => void, span?: string }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      whileHover={{ scale: 0.99 }}
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => { setIsFocused(true); setOpacity(1); }}
      onBlur={() => { setIsFocused(false); setOpacity(0); }}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      onClick={onClick}
      className={`relative rounded-[24px] border border-white/[0.05] bg-[#0A0A0A] overflow-hidden group cursor-pointer transition-colors hover:border-white/[0.1] ${span} ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(255,255,255,.06), transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
};

// ─── AMBIENT BACKGROUND ──────────────────────────────────────────────────────
const AmbientBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-[#020202] overflow-hidden flex items-center justify-center">
    <motion.div 
      animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[130px] rounded-full mix-blend-screen" 
    />
    <motion.div 
      animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
      transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[140px] rounded-full mix-blend-screen" 
    />
    <motion.div 
      animate={{ y: [0, -80, 0], x: [0, 40, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[80%] h-[40%] bg-sky-500/5 blur-[150px] rounded-full mix-blend-screen" 
    />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_60%,transparent_100%)]" />
  </div>
);

// ─── DATA ────────────────────────────────────────────────────────────────────
const bento_matrix_items = [
  { icon: Zap, title: "Visualizer Engine", description: "Real-time, interactive 60FPS visualizations for complex data structures and algorithms.", span: "md:col-span-1 md:row-span-1" },
  { icon: Code, title: "Online Compiler", description: "Multi-language execution environment with immediate feedback.", span: "md:col-span-1 md:row-span-1" },
  { icon: Trophy, title: "Competitive Arena", description: "Climb the global ranks in real-time coding battles.", span: "md:col-span-1 md:row-span-1" },
  { icon: Users, title: "Community Matrix", description: "Collaborate, share logic, and discuss architectures.", span: "md:col-span-1 md:row-span-1" },
  { icon: ListFilter, title: "DSA / CP Sheet", description: "Systematically master DSA paradigms with tracking.", span: "md:col-span-1 md:row-span-1" },
  { icon: Focus, title: "Prep Mode", description: "Curated 10+ proctored mode quizzes for interview preparation with anti-cheat measures and time bounds along with leaderboard.", span: "md:col-span-2 md:row-span-1" },
  { icon: Cpu, title: "AlgoLib's AI", description: "Instant automated code review and complexity analysis.", span: "md:col-span-1 md:row-span-1" },
];

const faqs = [
  { 
    q: "Can I use AlgoLib without installing anything?", 
    a: "Yes. AlgoLib runs entirely in your browser. The progressive web app (PWA) architecture ensures a native-like experience without local dependencies." 
  },
  { 
    q: "Is there a premium tier or is it completely free?", 
    a: "AlgoLib's core ecosystem—including the visualizer, compiler, and community forums—is 100% free forever for individual developers." 
  },
  { 
    q: "Is my coding activity stored on your servers?", 
    a: "Your execution telemetry, saved states, and performance metrics are processed locally. Only your public profile, contest scores, and community posts are synced to our secure cloud." 
  },
  { 
    q: "Which programming languages are supported on this platform?", 
    a: "Our contest panel currently supports C++, Java, Python executions only while online compiler supports C and JavaScript too. Visualizer engine focuses on language-agnostic logic. And our algorithmic library provides snippets tailored for 3 supported languages i.e, C++, Java, and Python." 
  },
  { 
    q: "How does the AI Analyzer evaluate my code?", 
    a: "The AI Analyzer utilizes fine-tuned LLMs deployed via secure edge functions. It statically analyzes your abstract syntax tree to estimate Big-O time and space complexity, offering line-by-line optimization suggestions almost instantly." 
  },
  { 
    q: "Can I use AlgoLib to test my preparation for OA rounds?", 
    a: "Yes. AlgoLib includes amounts of quizzes for testing your preparation with curated problems in all the domains (DSA, System Design, OOPs, Computer Networks, DBMS) and timed assessments with leaderboard." 
  }
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [discoverContent, setDiscoverContent] = useState<any[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  // Fetch from Netlify Function
  useEffect(() => {
    const fetchResearch = async () => {
      try {
        const response = await fetch('/.netlify/functions/getDiscoverContent');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setDiscoverContent(data);
      } catch (error) {
        console.error("Error fetching discover content:", error);
      } finally {
        setIsLoadingContent(false);
      }
    };
    fetchResearch();
  }, []);

  const triggerLoginAlert = () => {
    setIsAuthModalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans relative flex flex-col selection:bg-white/20 selection:text-white overflow-x-hidden">
      <AmbientBackground />
      <Navbar />

      {/* ── AUTHENTICATION MODAL ──────────────────── */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
            onClick={() => setIsAuthModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[400px] bg-[#0A0A0A] border border-white/[0.08] rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
              
              <div className="p-8 relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-medium tracking-tight text-white mb-1">Sign in</h2>
                    <p className="text-sm text-zinc-400">Continue to AlgoLib</p>
                  </div>
                  <button onClick={() => setIsAuthModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/[0.06]"><X size={18} /></button>
                </div>

                <div className="flex flex-col gap-3">
                  <button onClick={() => { setIsAuthModalOpen(false); executeGoogleSignIn(); }} className="flex items-center justify-center gap-3 w-full h-12 bg-white text-black rounded-full font-medium text-[14px] hover:bg-zinc-200 transition-colors active:scale-[0.98]">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                    Continue with Google
                  </button>
                  <button onClick={() => { setIsAuthModalOpen(false); executeGithubSignIn(); }} className="flex items-center justify-center gap-3 w-full h-12 bg-transparent text-white border border-white/[0.1] rounded-full font-medium text-[14px] hover:bg-white/[0.05] transition-colors active:scale-[0.98]">
                    <Github className="w-5 h-5" />
                    Continue with GitHub
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 text-center mt-6 leading-relaxed">
                  By continuing, you agree to our{" "}
                  <Link to="/terms" onClick={() => setIsAuthModalOpen(false)} className="text-zinc-300 hover:text-white underline underline-offset-2">Terms</Link>{" "}
                  and{" "}
                  <Link to="/privacy" onClick={() => setIsAuthModalOpen(false)} className="text-zinc-300 hover:text-white underline underline-offset-2">Privacy Policy</Link>.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 w-full flex-1 flex flex-col items-center">
        {/* ── HERO SECTION ────────────────────────────────────────────── */}
        <section className="w-full max-w-[1400px] mx-auto px-6 pt-28 pb-16 md:pt-36 md:pb-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="w-full lg:w-[55%] flex flex-col items-start z-20">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(255,255,255,0.03)]">
              <Sparkles className="w-3.5 h-3.5 text-white/70" />
              <span className="text-[12px] text-zinc-300 font-medium tracking-wide">Best platform ever</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[1.05]">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-700 via-white to-yellow-300 animate-gradient-x">Visualize Logic.</span><br /><span className="text-white/50">Master Systems.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-xl text-zinc-400 mb-10 max-w-xl leading-relaxed font-light">
              The definitive ecosystem for software engineers. Map out complex data structures in real-time, execute compiler snippets, and build your technical profile.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12 md:mb-16">
              <button onClick={() => setIsAuthModalOpen(true)} className="group relative w-full sm:w-auto px-8 h-12 rounded-full bg-white text-black font-medium text-sm flex items-center justify-center gap-2 overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-all">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]" />
                Get Started
              </button>
              <Link to="/visualizer" className="w-full sm:w-auto px-8 h-12 rounded-full bg-transparent border border-white/[0.1] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/[0.05] transition-colors">
                Live Demo <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
          
          {/* Hero Visual Mockup */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 1, ease: "easeOut" }} className="w-full lg:w-[45%] relative z-10 perspective-1000">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/30 via-transparent to-violet-500/30 rounded-[38px] blur-sm animate-pulse" />
            
            <div className="relative w-full aspect-[6/3] lg:aspect-[16/12] bg-[#0A0A0A] rounded-[36px] border border-white/[0.1] p-6 shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
              
              <div className="h-full flex flex-col gap-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/[0.05]">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-xs font-mono text-zinc-500 px-3 py-1 bg-white/[0.03] rounded-full border border-white/[0.05]">Step by Step execution</div>
                </div>
                
                <div className="flex-1 rounded-2xl bg-[#050505] border border-white/[0.05] relative overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-700">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]" />
                  <img src="https://ik.imagekit.io/g7e4hyclo/visu.png" alt="Visualizer Preview" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-lighten" />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── FEATURES BENTO ──────────────────────────────────────── */}
        <section className="w-full max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-10 md:mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-4 text-white">A unified matrix.</h2>
            <p className="text-zinc-400 text-lg font-light max-w-2xl mx-auto">Everything you need to master algorithms, prepare for interviews, and design distributed systems, seamlessly integrated.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 md:auto-rows-[160px]"
          >
            {bento_matrix_items.map((item, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className={item.span}
              >
                <SpotlightCard
                  span="w-full h-full block"
                  onClick={() => {
                    if (item.title === "Online Compiler" || item.title === "Visualizer Engine") window.location.href = `/compiler`;
                    else triggerLoginAlert();
                  }}
                >
                  <div className="p-5 md:p-6 h-full flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:bg-white/[0.06] mb-4 md:mb-0">
                      <item.icon className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" strokeWidth={1.5} />
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-lg font-medium text-white mb-1.5">{item.title}</h3>
                      <p className="text-zinc-400 text-[13px] leading-relaxed line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── PRODUCT SHOWCASE ──────────────────────────────────────── */}
        <section className="w-full max-w-[1200px] mx-auto px-6 py-16 md:py-24 flex flex-col gap-24 md:gap-32">
  
          {/* Showcase 1: Text Left, Image Right */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-200px" }} 
            className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16"
          >
            <div className="w-full lg:w-1/2 flex flex-col items-start">
              <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6">
                <Workflow className="text-zinc-300 w-5 h-5" />
              </div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-4 md:mb-6 tracking-tight">Interactive Data Structure Visualizer.</h3>
              <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8 font-light">Watch complex data structures compile and execute step-by-step in a completely distraction-free environment.</p>
              <Link 
                to="/visualizer" 
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
              >
                Explore now (No login required).
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="w-full lg:w-1/2 aspect-[7/4] bg-[#0A0A0A] rounded-[32px] md:rounded-[48px] border border-white/[0.08] overflow-hidden relative shadow-2xl group">
              <img src="https://ik.imagekit.io/g7e4hyclo/graph.png" alt="60FPS Engine" className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000" />
            </div>
          </motion.div>

          {/* Showcase 2: Text Right, Image Left */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-200px" }} 
            className="flex flex-col lg:flex-row-reverse items-center gap-10 lg:gap-16"
          >
            <div className="w-full lg:w-1/2 flex flex-col items-start">
              <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6">
                <Code className="text-zinc-300 w-5 h-5" />
              </div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-4 md:mb-6 tracking-tight">Online Compiler.</h3>
              <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8 font-light">Compile and run code in real-time with our powerful online compiler with low latency and seamless integration of various integrations.</p>
              <Link 
                to="/compiler" 
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
              >
                Explore now (No login required).
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="w-full lg:w-1/2 aspect-[7/4] bg-[#0A0A0A] rounded-[32px] md:rounded-[48px] border border-white/[0.08] overflow-hidden relative shadow-2xl group">
              <img src="https://ik.imagekit.io/g7e4hyclo/Screenshot%202026-04-11%20230622.png" alt="Online Compiler" className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000" />
            </div>
          </motion.div>

          {/* Showcase 3: Text Left, Image Right */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-200px" }} 
            className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16"
          >
            <div className="w-full lg:w-1/2 flex flex-col items-start">
              <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6">
                <Activity className="text-zinc-300 w-5 h-5" />
              </div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-4 md:mb-6 tracking-tight">Latest News & Research Articles.</h3>
              <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8 font-light">Stay up-to-date with the latest developments in AI/ML or Tech. All you get is simple and intuitive with key takeaways and concise summaries.</p>
              <Link 
                to="https://discover-algolib.netlify.app/discover" 
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
              >
                Explore now (No login required).
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="w-full lg:w-1/2 aspect-[7/4] bg-[#0A0A0A] rounded-[32px] md:rounded-[48px] border border-white/[0.08] overflow-hidden relative shadow-2xl group">
              <img src="https://ik.imagekit.io/g7e4hyclo/Screenshot%202026-05-17%20223728.png" alt="News & Research" className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000" />
            </div>
            
          </motion.div>
        </section>

        {/* ── RESEARCH & NEWS (Dynamically Fetched via Supabase) ────────────── */}
        <section className="w-full max-w-[1200px] mx-auto px-6 py-16 md:py-24 border-t border-white/[0.05]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 md:mb-12 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-2">Research & News</h2>
              <p className="text-zinc-500 font-light text-sm">Latest updates from the Supabase Data matrix.</p>
            </div>
            <a href="https://discover-algolib.netlify.app" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group w-fit">
              View all <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {isLoadingContent ? (
              <>
                <div className="lg:col-span-2 h-[400px] bg-white/[0.02] border border-white/[0.05] rounded-[32px] animate-pulse flex flex-col justify-end p-8">
                  <div className="h-4 w-24 bg-white/[0.05] rounded mb-4" />
                  <div className="h-8 w-3/4 bg-white/[0.1] rounded" />
                </div>
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-[120px] bg-white/[0.02] border border-white/[0.05] rounded-[24px] animate-pulse p-6 flex flex-col justify-center">
                      <div className="h-3 w-16 bg-white/[0.05] rounded mb-3" />
                      <div className="h-5 w-full bg-white/[0.08] rounded" />
                    </div>
                  ))}
                </div>
              </>
            ) : discoverContent.length > 0 ? (
              <>
                <a 
                  href={`https://discover-algolib.netlify.app/discover/${discoverContent[0].slug}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="lg:col-span-2 group relative overflow-hidden rounded-[32px] block"
                >
                  <div className="aspect-[16/9] lg:h-[400px] overflow-hidden bg-[#0A0A0A] border border-white/[0.05] relative rounded-[32px]">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                    <img 
                      src={discoverContent[0].image_url || "https://ik.imagekit.io/g7e4hyclo/graph.png"} 
                      alt="Featured Content" 
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-1000" 
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] font-mono tracking-widest text-sky-400 bg-sky-500/10 px-2 py-1 rounded-md backdrop-blur-md uppercase">
                          {discoverContent[0].type}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-medium text-white group-hover:text-sky-300 transition-colors drop-shadow-lg">
                        {discoverContent[0].title}
                      </h3>
                    </div>
                  </div>
                </a>

                <div className="flex flex-col gap-4">
                  {discoverContent.slice(1, 4).map((item) => (
                    <a 
                      key={item.id} 
                      href={`https://discover-algolib.netlify.app/discover/${item.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block h-full"
                    >
                      <SpotlightCard className="p-6 h-full flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-mono tracking-widest text-sky-400 uppercase">
                            {item.type}
                          </span>
                        </div>
                        <h3 className="text-base md:text-lg font-medium text-zinc-200 group-hover:text-white transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                      </SpotlightCard>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div className="col-span-3 text-center text-zinc-500 py-12">No recent content found.</div>
            )}
          </div>
        </section>

        {/* ── FAQ SECTION ───────────────────────────────────────────── */}
        <section className="w-full max-w-[800px] mx-auto px-6 py-16 md:py-24">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="flex flex-col gap-4">
            {faqs.map((faq, idx) => (
              <SpotlightCard key={idx} onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                <div className="p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className={`font-medium text-sm md:text-base ${openFaq === idx ? 'text-white' : 'text-zinc-300'}`}>{faq.q}</h3>
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.03] transition-colors ${openFaq === idx ? 'bg-sky-500/10 text-sky-400' : 'text-zinc-500'}`}>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="pt-4 text-sm text-zinc-400 leading-relaxed font-light">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}