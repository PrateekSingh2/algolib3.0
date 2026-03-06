import React, { useState, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, loginWithGoogle } from "./lib/firebase"; 
import { Loader2, Zap, Lock, ChevronRight, Terminal, Network, Cpu, LockKeyhole, Sparkles, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from './components/Footer';

// --- IMPORTS ---
import { incrementVisitCount } from "@/lib/algorithms";
import InstallPrompt from "@/components/InstallPrompt";

// Pages
import Index from "./pages/Index";
import SnippetView from "./pages/SnippetView";
import Visualizer from "./pages/Visualizer";
import Developer from "./pages/Developer";
import NotFound from "./pages/NotFound";
import CustomCursor from "@/components/CustomCursor";
import Docs from "./pages/Docs";
import Admin from "./pages/Admin";
import Community from "./components/Community";

const queryClient = new QueryClient();

// --- NEURAL BACKGROUND ---
const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    let particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 0.5
    }));

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(0, 210, 255, 0.4)";
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 210, 255, ${0.15 - dist / 866})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    };
    animate();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-0 bg-[#030308] pointer-events-none" />;
};

// --- STUNNING UNAUTHENTICATED LANDING PAGE ---
const UnauthenticatedLanding = () => {
  const [loginAlert, setLoginAlert] = useState(false);

  const handlePreviewClick = () => {
    setLoginAlert(true);
    setTimeout(() => setLoginAlert(false), 3000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const previewCards = [
    { 
      title: "Interactive Visualizer", 
      description: "Watch complex data structures and algorithms execute step-by-step in a real-time visual environment.",
      category: "Core Engine", 
      icon: Cpu, 
      color: "text-[#00d2ff]", 
      bg: "bg-[#00d2ff]/10", 
      border: "border-[#00d2ff]/30", 
      badge: "Live UI" 
    },
    { 
      title: "Snippet Library", 
      description: "Access a vast, searchable repository algorithm snippet in C++, Java and Python.",
      category: "Developer Hub", 
      icon: Terminal, 
      color: "text-[#ff9900]", 
      bg: "bg-[#ff9900]/10", 
      border: "border-[#ff9900]/30", 
      badge: "C++ / Java / Python" 
    },
    { 
      title: "Global Community", 
      description: "Collaborate with peers, ask complex architecture questions, and share algorithmic optimizations.",
      category: "Network", 
      icon: Network, 
      color: "text-[#00ff87]", 
      bg: "bg-[#00ff87]/10", 
      border: "border-[#00ff87]/30", 
      badge: "Forum" 
    }
  ];

  return (
    <div className="min-h-screen bg-[#030308] text-white font-sans relative overflow-x-hidden flex flex-col">
      <NeuralBackground />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

      {/* Top Simple Nav */}
      <div className="relative z-20 flex justify-between items-center px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,210,255,0.4)] relative">
            <Zap className="text-white w-4 h-4 relative z-10" fill="white" />
            <div className="absolute inset-0 bg-white rounded-lg animate-ping opacity-20" />
          </div>
          <span className="font-bold text-lg tracking-tight">ALGO<span className="text-[#00d2ff]">LIB</span></span>
        </div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-32 flex-1">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-4xl mx-auto mb-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 mb-8">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
            <span className="text-xs text-indigo-300 font-mono tracking-widest uppercase">For & By Developers</span>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-[1.1]">
            <span className="bg-gradient-to-r from-[#00d2ff] via-[#3a7bd5] to-[#ff0080] text-transparent bg-clip-text">
              Visualize Logic.
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#3a7bd5] to-[#ff9900] text-transparent bg-clip-text">
              Execute Code.
            </span>
          </motion.h1>
          
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            The definitive ecosystem for algorithm visualization, code optimization, and architectural discussions. Access secure modules by identifying your developer profile.
          </motion.p>

          {/* Login Container */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="relative max-w-md mx-auto">
            
            <AnimatePresence>
              {loginAlert && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: -40 }} exit={{ opacity: 0 }}
                  className="absolute left-0 right-0 -top-4 flex justify-center z-20"
                >
                  <div className="bg-[#00d2ff]/10 border border-[#00d2ff]/50 text-[#00d2ff] text-sm px-4 py-2 rounded-full shadow-[0_0_20px_rgba(0,210,255,0.3)] flex items-center gap-2 font-mono backdrop-blur-md">
                    <Lock size={14} /> Authentication Required
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={loginWithGoogle} 
              className={`group relative w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] z-10 ${loginAlert ? 'ring-4 ring-[#00d2ff]/50 ring-offset-2 ring-offset-[#030308]' : ''}`}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-base tracking-wide">Continue with Google</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform ml-2 opacity-50" />
            </button>
            <p className="mt-4 text-slate-500 text-xs font-mono tracking-widest flex items-center justify-center gap-2">
              <Terminal size={12} /> SECURE GATEWAY PROTOCOL
            </p>
          </motion.div>
        </div>

        {/* ALGORITHM PREVIEW CARDS */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="border-t border-[#1F2032] pt-16">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-white mb-2">Explore the Ecosystem</h3>
            <p className="text-slate-400">Unlock these tools instantly by authenticating your developer profile.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {previewCards.map((card, i) => (
              <div 
                key={i}
                onClick={handlePreviewClick}
                className="bg-[#0B0C15]/60 backdrop-blur-md border border-[#1F2032] p-6 rounded-2xl cursor-pointer hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] group relative overflow-hidden flex flex-col h-full"
              >
                <div className={`absolute top-0 left-0 w-full h-1 ${card.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-xl ${card.bg} ${card.border} border ${card.color}`}>
                    <card.icon size={24} />
                  </div>
                  <span className="bg-[#11121C] border border-[#1F2032] px-3 py-1 rounded-full text-xs font-mono text-slate-400 group-hover:text-white transition-colors">
                    {card.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mb-2">{card.category}</p>
                <h4 className="text-xl font-bold text-white mb-3">{card.title}</h4>
                <p className="text-sm text-slate-400 mb-8 flex-1 leading-relaxed">{card.description}</p>
                
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 group-hover:text-white transition-colors mt-auto">
                  <LockKeyhole size={14} fill="currentColor" className="opacity-70" /> Authenticate to Access
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <div 
        onClickCapture={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('a') || target.closest('button')) {
            e.preventDefault();
            e.stopPropagation();
            handlePreviewClick();
          }
        }}
      >
        <Footer />
      </div>
      
    </div>
  );
};

// --- GLOBAL AUTH GUARD ---
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030308] flex flex-col items-center justify-center relative overflow-hidden">
        <NeuralBackground />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-[#00d2ff]/20 border-t-[#00d2ff] rounded-full animate-spin shadow-[0_0_15px_#00d2ff]" />
          <p className="text-[#00d2ff] font-mono tracking-[0.3em] text-sm animate-pulse">ESTABLISHING_LINK...</p>
        </div>
      </div>
    );
  }

  if (!user) return <UnauthenticatedLanding />;

  return <>{children}</>;
};

// --- THE MAIN APP COMPONENT ---
const App = () => {
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
      <TooltipProvider>
        <CustomCursor />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          
          <AuthGuard>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/hq" element={<Admin />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/view/:id" element={<SnippetView />} />
              <Route path="/visualizer" element={<Visualizer />} />
              <Route path="/developer" element={<Developer />} />
              <Route path="/discussion" element={<Community />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthGuard>

          {/* The only instance of InstallPrompt, rendering at the app root */}
          <InstallPrompt />

        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;