import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Link, Navigate } from "react-router-dom";
import { loginWithGoogle } from "./lib/firebase"; 
import { 
  Loader2, Zap, Lock, ChevronRight, Terminal, Network, Cpu, Sparkles, 
  Code2, Code, Users, ArrowRight, LayoutDashboard, Globe, Workflow, Braces, 
  Cookie, X, Settings2, BookOpen, MessageSquare, Activity, HelpCircle, 
  ChevronDown, ListFilter, Trophy,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { incrementVisitCount } from "@/lib/algorithms";
import InstallPrompt from "@/components/InstallPrompt";
import { useActivityTracker, setTrackedActivity } from "@/hooks/useActivityTracker";

import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter"; 
import { useAuth } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

// --- LAZY LOADED ROUTES ---
const Index = lazy(() => import("./pages/Index"));
const SnippetView = lazy(() => import("./pages/SnippetView"));
const Visualizer = lazy(() => import("./pages/Visualizer"));
const Developer = lazy(() => import("./pages/Developer"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Docs = lazy(() => import("./pages/Docs"));
const Notes = lazy(() => import("./pages/Notes"));
const Support = lazy(() => import("./pages/Support"));
const Admin = lazy(() => import("./pages/Admin"));
const Community = lazy(() => import("./components/Community"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Profile = lazy(() => import("./pages/Profile"));
const ContestPanel = lazy(() => import("./pages/ContestPanel"));
const Contests = lazy(() => import("./pages/Contests"));
const Compiler = lazy(() => import("./pages/Compiler")); // <--- NEW COMPILER IMPORT
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cookies = lazy(() => import("./pages/Cookies"));

const queryClient = new QueryClient();

// --- SLEEK SUSPENSE LOADER ---
const ModuleLoader = () => (
  <div className="min-h-screen bg-[#000000] flex items-center justify-center relative">
    <div className="relative z-10 flex flex-col items-center gap-6">
      <div className="relative flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-40"></span>
        <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
      </div>
      <p className="text-cyan-500/60 font-mono text-[10px] tracking-[0.2em] uppercase">Loading Module</p>
    </div>
  </div>
);

const GlobalThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  if (user) return null;

  return (
    <button
      onClick={toggleTheme}
      title="Toggle Theme"
      className="flex items-center justify-center w-9 h-9 rounded-full bg-transparent border border-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.1] transition-all active:scale-95"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};

const InteractiveParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particlesArray: Particle[] = [];
    
    const mouse = { x: -1000, y: -1000, radius: 150 };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 0.5; 
        this.speedX = (Math.random() - 0.5) * 0.5; 
        this.speedY = (Math.random() - 0.5) * 0.5;
        
        const colors = ['#1d4ed8', '#2563eb', '#3b82f6', '#00d2ff', '#00ff87'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        if (!canvas) return;
        
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          const repelStrength = 4; 
          
          this.x -= forceDirectionX * force * repelStrength;
          this.y -= forceDirectionY * force * repelStrength;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      particlesArray = [];
      const numberOfParticles = (canvas.width * canvas.height) / 7000;
      for (let i = 0; i < numberOfParticles; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particlesArray.push(new Particle(x, y));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    handleResize(); 
    animate();      

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />;
};

const EliteBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-[#000000] flex items-center justify-center overflow-hidden">
    <InteractiveParticleBackground />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    <div className="absolute top-0 w-[1000px] h-[500px] bg-[#00d2ff]/[0.03] blur-[120px] rounded-full" />
  </div>
);

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("algolib_cookie_consent");
    if (saved) {
      if (saved === "all") return { necessary: true, analytics: true, personalization: true };
      if (saved === "necessary_only") return { necessary: true, analytics: false, personalization: false };
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse cookie preferences");
      }
    }
    return { necessary: true, analytics: true, personalization: false };
  });

  useEffect(() => {
    const consent = localStorage.getItem("algolib_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }

    const handleOpenCookies = () => {
      setIsVisible(true);
      setShowCustomize(true); 
    };
    window.addEventListener('openCookieConsent', handleOpenCookies);
    return () => window.removeEventListener('openCookieConsent', handleOpenCookies);
  }, []);

  const handleAcceptAll = () => {
    const allPrefs = { necessary: true, analytics: true, personalization: true };
    localStorage.setItem("algolib_cookie_consent", JSON.stringify(allPrefs));
    setPreferences(allPrefs);
    setIsVisible(false);
  };

  const handleDecline = () => {
    const minPrefs = { necessary: true, analytics: false, personalization: false };
    localStorage.setItem("algolib_cookie_consent", JSON.stringify(minPrefs));
    setPreferences(minPrefs);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("algolib_cookie_consent", JSON.stringify(preferences));
    setIsVisible(false);
  };

  const togglePreference = (key: keyof typeof preferences) => {
    if (key === 'necessary') return; 
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-14 left-6 md:left-10 z-[999] w-[380px] max-w-[calc(100vw-48px)] bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {showCustomize ? (
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Settings2 size={16} className="text-zinc-400" /> Customize Preferences
                </h3>
                <button onClick={() => setShowCustomize(false)} className="text-zinc-500 hover:text-white transition-colors p-1">
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">Strictly Necessary</span>
                    <span className="text-xs text-zinc-500 mt-1">Required for the website to function.</span>
                  </div>
                  <div className="w-8 h-4 rounded-full bg-sky-500/50 flex items-center p-0.5 opacity-50 cursor-not-allowed">
                    <div className="w-3 h-3 rounded-full bg-white transform translate-x-4 shadow-sm" />
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">Analytics</span>
                    <span className="text-xs text-zinc-500 mt-1">Helps us understand how visitors interact with the matrix.</span>
                  </div>
                  <button onClick={() => togglePreference('analytics')} className={`w-8 h-4 rounded-full transition-colors duration-300 flex items-center p-0.5 ${preferences.analytics ? 'bg-sky-500' : 'bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${preferences.analytics ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">Personalization</span>
                    <span className="text-xs text-zinc-500 mt-1">Used to tailor your visualizer experience.</span>
                  </div>
                  <button onClick={() => togglePreference('personalization')} className={`w-8 h-4 rounded-full transition-colors duration-300 flex items-center p-0.5 ${preferences.personalization ? 'bg-sky-500' : 'bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${preferences.personalization ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <button onClick={handleSavePreferences} className="w-full py-2.5 mt-2 bg-white text-black text-sm font-medium rounded-xl hover:bg-zinc-200 transition-colors">
                Save Preferences
              </button>
            </div>
          ) : (
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
                  <Cookie className="w-4 h-4 text-zinc-300" />
                </div>
                <h3 className="text-white font-medium">Telemetry & Cookies</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                We use strictly necessary cookies to keep the AlgoLib engine running, and optional analytics to monitor system telemetry. 
                <Link to="/cookies" className="text-white ml-1 hover:underline underline-offset-2">Read policy.</Link>
              </p>
              
              <div className="flex flex-col gap-2 mt-2">
                <button onClick={handleAcceptAll} className="w-full py-2.5 bg-white text-black text-sm font-medium rounded-xl hover:bg-zinc-200 transition-colors">
                  Accept All
                </button>
                <div className="flex gap-2">
                  <button onClick={handleDecline} className="flex-1 py-2.5 bg-transparent border border-white/[0.1] text-white text-sm font-medium rounded-xl hover:bg-white/[0.05] transition-colors">
                    Decline Optional
                  </button>
                  <button onClick={() => setShowCustomize(true)} className="px-4 py-2.5 bg-transparent border border-white/[0.1] text-zinc-400 hover:text-white text-sm font-medium rounded-xl hover:bg-white/[0.05] transition-colors flex items-center justify-center">
                    <Settings2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const bento_matrix_items = [
  { icon: ListFilter, title: "Algorithmic Hub", description: "Search, filter, and master 100+ algorithms across multiple domains.", span: "lg:col-span-2" },
  { icon: Code, title: "Multi-Lang Snippet", description: "Get Python, Java, and C++ implementations seamlessly.", span: "lg:col-span-1" },
  { icon: Zap, title: "Visualizer Engine", description: "Interact with dynamic LinkedList, Tree, Graph, and Sorting visualizers.", span: "lg:col-span-1" },
  { icon: BookOpen, title: "Tech Notes Hub", description: "Study comprehensive Data Structures, OOPs, and core Programming concepts.", span: "lg:col-span-1" },
  { icon: Users, title: "Community Matrix", description: "Discuss solutions, share logic, and collaborate on algorithm design, help others all in real-time.", span: "lg:col-span-2" },
  { icon: Trophy, title: "Competitive Arena", description: "Compete in real-time, solve multi-tier challenges, and climb the global leaderboard.", span: "lg:col-span-1" },
];

const faqs = [
  { q: "Does the visualizer work without an internet connection?", a: "Yes. AlgoLib is engineered as a Progressive Web App (PWA). Once initialized, the core matrix, 60FPS visualizer, and telemetry engine run entirely locally in your browser, allowing for complete offline execution." },
  { q: "Which programming languages are supported by the execution engine?", a: "Currently we focus on logic and pseudocode irresepective of the language. Each algorithm in our registry includes optimized, production-ready implementations for all three core languages." },
  { q: "What is the maximum dataset size the engine can render?", a: "To maintain stable 60FPS hardware acceleration, the visualizer is optimally calibrated for data structures up to 150 nodes (May vary on your hardware capabilities). The engine dynamically throttles render cycles for larger matrices to prevent browser resource exhaustion." },
  { q: "Who can see my execution history and telemetry data?", a: "Your execution telemetry, saved states, and performance metrics are not being stored. All processing happens locally in your browser. We do not collect or store any your states." },
  { q: "Can I run the visualizer on a mobile device?", a: "While the AlgoLib ecosystem is fully responsive for mobile devices also based on your hardware capabilities, although 60FPS Engine requires a desktop-class environment for optimal hardware acceleration and workspace real estate." }
];

const UnauthenticatedLanding = () => {
  const [loginAlert, setLoginAlert] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const triggerLoginAlert = () => {
    setLoginAlert(true);
    setTimeout(() => setLoginAlert(false), 3000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans relative flex flex-col selection:bg-white/20 selection:text-white overflow-x-hidden">
      <EliteBackground />

      <nav className="relative z-20 flex justify-between items-center px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <Zap className="text-white w-5 h-5 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" fill="white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">ALGO<span className="text-white/40">LIB</span></span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <GlobalThemeToggle />
          <Link to="/developer" className="text-sm font-medium text-white/60 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.05] transition-all border border-transparent hover:border-white/[0.05]">
            &lt;/&gt; Team
          </Link>
        </div>
      </nav>

      <main className="relative z-10 w-full flex-1 flex flex-col items-center pb-16">
        
        <div className="text-center max-w-5xl mx-auto mt-16 md:mt-24 px-6 flex flex-col items-center relative z-20">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] mb-10 backdrop-blur-md shadow-2xl transition-all hover:bg-white/[0.04] cursor-default">
            <Sparkles className="w-3.5 h-3.5 text-white/70" />
            <span className="text-[11px] text-white/70 font-mono tracking-widest uppercase">Engine V2 Architecture Live</span>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-6xl md:text-8xl lg:text-[7.5rem] font-bold tracking-tighter mb-8 leading-[0.95]">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50">Visualize Logic.</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white/60 to-white/10">Master Systems.</span>
          </motion.h1>
          
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-white/40 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            The definitive ecosystem for software engineers. Map out complex data structures in real-time, fetch optimal snippets, and build your technical profile.
          </motion.p>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="relative w-full max-w-xs mx-auto mb-16">
            <AnimatePresence>
              {loginAlert && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: -45, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute left-0 right-0 flex justify-center z-20 pointer-events-none">
                  <div className="bg-[#111] border border-white/10 text-white/80 text-xs px-4 py-2 rounded-md shadow-2xl flex items-center gap-2 font-mono">
                    <Lock size={12} className="text-white/40" /> AUTH REQUIRED
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={loginWithGoogle} className={`group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full p-[1px] font-medium text-white transition-all duration-300 ${loginAlert ? 'ring-2 ring-white/20 ring-offset-2 ring-offset-black' : ''}`}>
              <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000_0%,#fff_50%,#000_100%)] opacity-80 group-hover:opacity-40 transition-opacity" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-[#050505] px-8 py-1 text-sm backdrop-blur-3xl transition-all group-hover:bg-[#0a0a0a]">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" /></svg>
                Authenticate with Google
              </span>
            </button>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 1, ease: "easeOut" }} className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10 mb-32">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-[#00d2ff]/10 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="relative rounded-2xl border border-white/[0.1] bg-[#050505] shadow-2xl overflow-hidden ring-1 ring-white/[0.05]">
            <div className="h-10 flex items-center px-4 gap-2 border-b border-white/[0.05] bg-[#0a0a0a]">
              <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
              <div className="ml-4 flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] rounded-md px-3 py-1 font-mono text-[10px] text-white/40">
                <Lock size={10} /> algolib.netlify.app/visualizer
              </div>
            </div>
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[#020202] overflow-hidden">
              <img src="https://ik.imagekit.io/g7e4hyclo/visu.png" alt="AlgoLib Dashboard Environment" className="w-full h-full object-cover opacity-90 scale-105" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full max-w-6xl mx-auto mb-32 px-6 flex flex-col gap-24 md:gap-32">
          
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="w-full md:w-1/2 aspect-video bg-[#0a0a0a] rounded-3xl border border-white/[0.05] overflow-hidden relative group shadow-2xl flex items-end justify-end p-0">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,210,255,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" />
               <img src="https://ik.imagekit.io/g7e4hyclo/graph.png" alt="60FPS Engine" className="w-full h-full object-cover object-right-bottom opacity-90 group-hover:scale-105 transition-transform duration-700 rounded-tl-xl" />
            </div>
            <div className="w-full md:w-1/2 flex flex-col items-start">
               <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6 shadow-inner">
                 <Workflow className="text-white w-6 h-6" />
               </div>
               <h3 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">60FPS Engine</h3>
               <p className="text-white/40 text-lg leading-relaxed mb-8">
                 Watch complex data structures compile and execute step-by-step in a completely distraction-free environment. 
               </p>
               <button onClick={triggerLoginAlert} className="text-white font-medium text-sm flex items-center gap-2 group hover:text-sky-400 transition-colors">
                 Initialize Module <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-16">
            <div className="w-full md:w-1/2 aspect-video bg-[#0a0a0a] rounded-3xl border border-white/[0.05] overflow-hidden relative group shadow-2xl flex items-start justify-center p-0">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,210,255,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" />
               <img src="https://ik.imagekit.io/g7e4hyclo/code.png" alt="Snippet Library" className="w-full h-full object-cover object-top opacity-90 group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="w-full md:w-1/2 flex flex-col items-start">
               <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6 shadow-inner">
                 <Braces className="text-white w-6 h-6" />
               </div>
               <h3 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">Snippet Library</h3>
               <p className="text-white/40 text-lg leading-relaxed mb-8">
                 Fetch optimized code directly from verified GitHub Gists. Ensure your logic and syntax are always up to date with modern programming standards.
               </p>
               <button onClick={triggerLoginAlert} className="text-white font-medium text-sm flex items-center gap-2 group hover:text-sky-400 transition-colors">
                 Access Library <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="w-full md:w-1/2 aspect-video bg-[#0a0a0a] rounded-3xl border border-white/[0.05] overflow-hidden relative group shadow-2xl flex items-start justify-center p-0">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,210,255,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" />
               <img src="https://ik.imagekit.io/g7e4hyclo/commu.png" alt="Global Network" className="w-full h-full object-cover object-top opacity-90 mix-blend-lighten group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="w-full md:w-1/2 flex flex-col items-start">
               <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6 shadow-inner">
                 <Globe className="text-white w-6 h-6" />
               </div>
               <h3 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">Global Network</h3>
               <p className="text-white/40 text-lg leading-relaxed mb-8">
                 Discuss architectures, debug complex trees, and build your elite engineering profile alongside developers globally.
               </p>
               <button onClick={triggerLoginAlert} className="text-white font-medium text-sm flex items-center gap-2 group hover:text-sky-400 transition-colors">
                 Join Matrix <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-16">
            <div className="w-full md:w-1/2 aspect-video bg-[#0a0a0a] rounded-3xl border border-white/[0.05] overflow-hidden relative group shadow-2xl flex items-start justify-center p-0">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,210,255,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" />
               <img src="https://ik.imagekit.io/g7e4hyclo/Screenshot%202026-03-25%20144851.png" alt="Competitive Arena" className="w-full h-full object-cover object-center opacity-70 mix-blend-lighten group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="w-full md:w-1/2 flex flex-col items-start">
               <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6 shadow-inner">
                 <Trophy className="text-white w-6 h-6" />
               </div>
               <h3 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">Competitive Arena</h3>
               <p className="text-white/40 text-lg leading-relaxed mb-8">
                 Compete globally, climb the real-time leaderboard, and master complex data structures in a low-latency, distraction-free environment designed for elite performance.
               </p>
               <button onClick={triggerLoginAlert} className="text-white font-medium text-sm flex items-center gap-2 group hover:text-sky-400 transition-colors">
                 Enter Arena <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>

        </motion.div>

        <div className="w-full max-w-6xl mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {bento_matrix_items.map((item) => (
              <div 
                key={item.title}
                onClick={triggerLoginAlert}
                className={`${item.span} bg-[#080808] border border-white/[0.05] rounded-3xl p-6 md:p-8 flex flex-col h-full hover:bg-white/[0.02] transition-colors group cursor-pointer shadow-lg`}
              >
                <div className="w-11 h-11 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6">
                  <item.icon className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed flex-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto px-6 mb-32 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="text-sky-400 w-6 h-6" />
            <h2 className="text-3xl font-semibold tracking-tight text-white">Frequently Asked</h2>
          </div>
          <div className="flex flex-col gap-3 w-full">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)} 
                className={`bg-[#050505] border ${openFaq === idx ? 'border-sky-500/50' : 'border-white/[0.05] hover:border-white/[0.1]'} rounded-2xl p-5 md:p-6 cursor-pointer transition-all duration-300`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className={`font-medium ${openFaq === idx ? 'text-white' : 'text-zinc-300'}`}>{faq.q}</h3>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 flex-shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </div>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <p className="pt-4 text-sm text-zinc-400 leading-relaxed font-regular">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-2xl mx-auto text-center border-t border-white/[0.05] pt-24 px-6">
          <h2 className="text-3xl font-medium tracking-tight mb-4 text-white">Start exploring.</h2>
          <p className="text-white/50 mb-10 font-regular text-sm">Join the developers standardizing algorithmic visualization.</p>
          <button onClick={loginWithGoogle} className="group inline-flex items-center gap-2 text-sm font-medium text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.1] px-6 py-3 rounded-full transition-all">
            Continue <ArrowRight size={14} className="group-hover:translate-x-1 opacity-50 group-hover:opacity-100 transition-all" />
          </button>
        </div>

      </main>
      
      <AppFooter />
    </div>
  );
};

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // --- ADDED '/compiler' TO PUBLIC ROUTES SO ANYONE CAN USE IT ---
  const publicRoutes = ['/terms', '/privacy', '/cookies', '/developer', '/support', '/docs', '/compiler'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  const getCleanPath = (path: string) => {
    if (path.startsWith('/view/')) return 'snippet_library';
    if (path.startsWith('/visualizer')) return 'visualizer_ll';
    return path;
  };

  const activePath = getCleanPath(location.pathname);

  useActivityTracker(activePath, user ? {
    uid: user.uid,
    email: user.email || "Unknown",
    displayName: user.displayName || "Anonymous"
  } : null);

  useEffect(() => {
    if (!location.pathname.includes('/visualizer')) {
       setTrackedActivity(activePath);
    }
  }, [location.pathname, activePath]);

  if (loading) {
    return <ModuleLoader />;
  }

  if (!user && !isPublicRoute) {
    if (location.pathname !== "/") {
      return <Navigate to="/" replace />;
    }
    return <UnauthenticatedLanding />;
  }

  // Onboarding Interceptor
  if (user && profile && profile.is_profile_complete === false) {
    if (location.pathname !== '/edit-profile') {
      return <Navigate to="/edit-profile" replace state={{ isFirstTime: true }} />;
    }
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  const handleLoginRequest = () => {
    loginWithGoogle();
  };

  return (
    <Suspense fallback={<ModuleLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/hq" element={<Admin />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/support" element={<Support />} />
        <Route path="/view/:id" element={<SnippetView />} />
        <Route path="/visualizer" element={<Visualizer />} />
        <Route path="/developer" element={<Developer />} />
        <Route path="/discussion" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/contests" element={<Contests />} />
        <Route path="/contest/:contestId" element={<ContestPanel user={user} onLoginRequest={handleLoginRequest} />} />
        <Route path="/compiler" element={<Compiler />} /> {/* <-- ADDED COMPILER ROUTE */}
                  
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookies" element={<Cookies />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  useEffect(() => {
    const forceUpdateIfNeeded = async () => {
      const LATEST_VERSION = "2.1.5"; 
      const localVersion = localStorage.getItem("algolib_system_version");

      if (localVersion !== LATEST_VERSION) {
        console.warn("⚠️ System Outdated. Initiating Auto-Update & Cache Purge...");

        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
              console.log("Service Worker Terminated.");
            }
          } catch (e) {
            console.error("Failed to unregister SW:", e);
          }
        }

        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            for (const name of cacheNames) {
              await caches.delete(name);
            }
            console.log("Old Asset Caches Purged.");
          } catch (e) {
            console.error("Failed to clear caches:", e);
          }
        }

        localStorage.setItem("algolib_system_version", LATEST_VERSION);
        window.location.reload(); 
      }
    };

    forceUpdateIfNeeded();
    window.addEventListener("focus", forceUpdateIfNeeded);
    return () => window.removeEventListener("focus", forceUpdateIfNeeded);
  }, []);

  useEffect(() => {
    const initializeVisit = async () => {
      try {
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const sessionKey = "algolib_session_active";
        const hasVisitedSession = sessionStorage.getItem(sessionKey);

        if (!isLocalhost && !hasVisitedSession) {
           await incrementVisitCount();
           sessionStorage.setItem(sessionKey, "true");
        }
      } catch (error) {
        console.error("Failed to increment visit count", error);
      }
    };
    initializeVisit();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CookieConsent />
            <AuthGuard>
              <AppRoutes />
            </AuthGuard>
            <InstallPrompt />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;