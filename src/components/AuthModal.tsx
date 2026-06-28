import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Github, Zap, Mail, Lock, Loader2 } from "lucide-react";
import { executeGoogleSignIn, executeGithubSignIn } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Playful Left Panel Animation ──
const AnimatedScribblePanel = () => {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-indigo-100 via-purple-50 to-emerald-50 dark:from-[#13111C] dark:via-[#161224] dark:to-[#0F172A] overflow-hidden flex flex-col items-center justify-center p-10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-full max-w-[280px] aspect-square flex items-center justify-center"
      >
        <svg width="100%" height="100%" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Subtle background glow */}
          <circle cx="60" cy="100" r="14" fill="url(#glowGradient)" opacity="0.4" className="dark:opacity-20" />
          
          {/* Edges */}
          <motion.path 
            initial={{ pathLength: 0, opacity: 0.2 }}
            animate={{ pathLength: 1, opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
            d="M120 40 L60 100 M120 40 L180 100 M60 100 L30 160 M60 100 L90 160 M180 100 L150 160 M180 100 L210 160" 
            stroke="#818CF8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
          />

          {/* Nodes */}
          <motion.circle cx="120" cy="40" r="16" fill="#FBBF24" stroke="#fff" strokeWidth="3"
            animate={{ scale: [1, 1.15, 1], fill: ["#FBBF24", "#10B981", "#FBBF24"] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }} />
            
          <motion.circle cx="60" cy="100" r="14" fill="#34D399" stroke="#fff" strokeWidth="3"
            animate={{ scale: [1, 1.15, 1], fill: ["#34D399", "#6366F1", "#34D399"] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }} />
            
          <motion.circle cx="180" cy="100" r="14" fill="#6366F1" stroke="#fff" strokeWidth="3"
            animate={{ scale: [1, 1.15, 1], fill: ["#6366F1", "#F472B6", "#6366F1"] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.8 }} />

          <motion.circle cx="30" cy="160" r="12" fill="#F472B6" stroke="#fff" strokeWidth="2"
            animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 1.2 }} />
          <motion.circle cx="90" cy="160" r="12" fill="#A78BFA" stroke="#fff" strokeWidth="2"
            animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 1.4 }} />
          <motion.circle cx="150" cy="160" r="12" fill="#38BDF8" stroke="#fff" strokeWidth="2"
            animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 1.6 }} />
          <motion.circle cx="210" cy="160" r="12" fill="#FB923C" stroke="#fff" strokeWidth="2"
            animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 1.8 }} />

          {/* Orbiting data packet */}
          <motion.circle r="5" fill="#EF4444"
            animate={{ 
              cx: [120, 180, 210, 180, 120, 60, 30, 60, 120], 
              cy: [40, 100, 160, 100, 40, 100, 160, 100, 40] 
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          <defs>
            <radialGradient id="glowGradient" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>

      <div className="relative z-10 mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-indigo-200 dark:border-indigo-500/20 bg-white/50 dark:bg-indigo-500/10 mb-4 backdrop-blur-sm">
          <Zap className="w-3.5 h-3.5 text-indigo-500" fill="currentColor" />
          <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-nunito">AlgoLib</span>
        </div>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white font-nunito tracking-tight mb-2">
          Code. <span className="font-comic text-emerald-500">Visualize.</span> Learn.
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold max-w-[240px] mx-auto">
          Join thousands of developers mastering algorithms every day.
        </p>
      </div>
    </div>
  );
};

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Rate Limiting & CAPTCHA State
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaExpected, setCaptchaExpected] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Load rate limit state
  useEffect(() => {
    if (isOpen) {
      const savedAttempts = parseInt(localStorage.getItem('auth_attempts') || '0', 10);
      const savedLockout = parseInt(localStorage.getItem('auth_lockout') || '0', 10);
      
      if (savedLockout && Date.now() < savedLockout) {
        setLockoutUntil(savedLockout);
      } else if (savedLockout) {
        localStorage.removeItem('auth_attempts');
        localStorage.removeItem('auth_lockout');
        setAttempts(0);
        setLockoutUntil(null);
      } else {
        setAttempts(savedAttempts);
      }
    }
  }, [isOpen]);

  const generateCaptcha = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let text = "";
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaExpected(text);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background noise
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.15)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Lines noise
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.25)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
    
    // Draw text with rotation and distortion
    ctx.font = 'bold 22px monospace';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      const x = 15 + i * 20;
      const y = canvas.height / 2 + (Math.random() * 8 - 4);
      const angle = (Math.random() * 0.4 - 0.2); // slight rotation
      
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 40%)`;
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
  }, []);

  const handleGoogle = () => {
    onClose();
    executeGoogleSignIn();
  };

  const handleGithub = () => {
    onClose();
    executeGithubSignIn();
  };
  
  const recordFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    localStorage.setItem('auth_attempts', newAttempts.toString());
    
    if (newAttempts >= 5) {
      const lockTime = Date.now() + 15 * 60 * 1000; // 15 mins
      setLockoutUntil(lockTime);
      localStorage.setItem('auth_lockout', lockTime.toString());
      toast.error("Too many failed attempts. Locked out for 15 minutes.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const mins = Math.ceil((lockoutUntil - Date.now()) / 60000);
      return toast.error(`Too many attempts. Please try again in ${mins} minutes.`);
    }
    
    if (!email || !password || !captchaInput) return toast.error("Please fill in all fields");
    
    if (captchaInput.toLowerCase() !== captchaExpected.toLowerCase()) {
      toast.error("Invalid CAPTCHA.");
      recordFailedAttempt();
      generateCaptcha();
      setCaptchaInput("");
      return;
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Successfully logged in!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created successfully!");
      }
      onClose();
      // Reset rate limit on success
      localStorage.removeItem('auth_attempts');
      setAttempts(0);
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
      recordFailedAttempt();
      generateCaptcha();
      setCaptchaInput("");
    } finally {
      setLoading(false);
    }
  };

  // Reset state when closed or opened
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure canvas is mounted before drawing
      setTimeout(generateCaptcha, 100);
    } else {
      setTimeout(() => {
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setCaptchaInput("");
      }, 300);
    }
  }, [isOpen, generateCaptcha, isLogin]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[840px] flex flex-col md:flex-row overflow-hidden rounded-[2rem] bg-white dark:bg-[#111622] shadow-[0_32px_80px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_80px_-12px_rgba(0,0,0,0.8)] border-4 border-slate-100 dark:border-white/10"
            style={{ maxHeight: "calc(100vh - 32px)" }}
          >
            {/* ── LEFT PANEL ── */}
            <div className="hidden md:block w-[40%] flex-shrink-0 border-r-4 border-slate-100 dark:border-white/10 relative">
              <AnimatedScribblePanel />
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="flex-1 flex flex-col p-8 sm:p-10 relative overflow-hidden overflow-y-auto">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-white dark:hover:bg-white/10 transition-all z-10"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              <div className="relative z-10 max-w-[340px] mx-auto w-full my-auto">
                {/* Headline */}
                <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2 font-nunito">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
                  {isLogin 
                    ? "Log in to save your code, track progress, and compete." 
                    : "Sign up to start saving code and tracking your progress."}
                </p>

                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 mb-6">
                  {lockoutUntil && Date.now() < lockoutUntil && (
                     <div className="p-3 mb-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
                        Too many attempts. Try again later.
                     </div>
                  )}
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!!(lockoutUntil && Date.now() < lockoutUntil)}
                      className="w-full h-12 pl-10 pr-4 rounded-2xl bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/10 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 font-nunito disabled:opacity-50"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={!!(lockoutUntil && Date.now() < lockoutUntil)}
                      className="w-full h-12 pl-10 pr-4 rounded-2xl bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/10 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 font-nunito disabled:opacity-50"
                      required
                    />
                  </div>
                  
                  {/* Canvas CAPTCHA */}
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex gap-2">
                       <canvas 
                          ref={canvasRef} 
                          width={140} 
                          height={44} 
                          className="rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 flex-shrink-0 cursor-pointer"
                          title="Click to refresh CAPTCHA"
                          onClick={generateCaptcha}
                       />
                       <input
                         type="text"
                         placeholder="Enter CAPTCHA"
                         value={captchaInput}
                         onChange={(e) => setCaptchaInput(e.target.value)}
                         disabled={!!(lockoutUntil && Date.now() < lockoutUntil)}
                         className="flex-1 h-11 px-4 rounded-xl bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/10 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 font-nunito disabled:opacity-50"
                         required
                       />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex items-center justify-center gap-2 w-full h-12 mt-1 bg-indigo-500 text-white rounded-2xl font-bold text-[15px] hover:bg-indigo-600 active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(99,102,241,0.25)] disabled:opacity-70 disabled:active:scale-100 overflow-hidden font-nunito"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Log In" : "Sign Up")}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-[2px] bg-slate-100 dark:bg-white/[0.06] rounded-full" />
                  <span className="text-[11px] text-slate-400 font-bold font-nunito tracking-wider uppercase">Or continue with</span>
                  <div className="flex-1 h-[2px] bg-slate-100 dark:bg-white/[0.06] rounded-full" />
                </div>

                {/* Social Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogle}
                    className="flex-1 flex items-center justify-center gap-2 h-12 bg-white dark:bg-white/5 text-slate-700 dark:text-white border-2 border-slate-100 dark:border-white/10 rounded-2xl font-bold text-[14px] hover:bg-slate-50 dark:hover:bg-white/10 transition-all font-nunito shadow-sm"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGithub}
                    className="flex-1 flex items-center justify-center gap-2 h-12 bg-slate-900 text-white dark:bg-white/5 dark:text-white border-2 border-transparent dark:border-white/10 rounded-2xl font-bold text-[14px] hover:bg-slate-800 dark:hover:bg-white/10 transition-all font-nunito shadow-sm"
                  >
                    <Github className="w-5 h-5 flex-shrink-0" />
                    GitHub
                  </motion.button>
                </div>

                {/* Toggle Login/Signup */}
                <div className="mt-8 text-center font-nunito font-semibold text-sm text-slate-500 dark:text-slate-400">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button 
                    onClick={() => setIsLogin(!isLogin)} 
                    className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                  >
                    {isLogin ? "Sign up here" : "Log in here"}
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
