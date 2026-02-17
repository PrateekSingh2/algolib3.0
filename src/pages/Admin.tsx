import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Terminal, Clock, HardDrive, Copy, Check, 
  Cpu, Hash, ShieldCheck, Save, RefreshCw, 
  AlertCircle, X, Code, FileJson, CloudLightning, 
  Settings, Loader2, Edit3, ShieldAlert, Fingerprint, 
  ChevronRight, Unlock, RefreshCcw, Eye, EyeOff
} from "lucide-react";
import Navbar from '@/components/Navbar';

// --- 1. NEURAL BACKGROUND (Unchanged - Core Aesthetic) ---
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

    let particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(0, 245, 255, 0.2)";
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.fillRect(p.x, p.y, 2, 2);
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 245, 255, ${1 - dist / 100})`;
            ctx.lineWidth = 0.5;
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
  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 bg-[#020205]" />;
};

// --- 2. CAPTCHA GENERATOR COMPONENT ---
const CaptchaCanvas = ({ onGenerate }: { onGenerate: (code: string) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const generateCaptcha = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789#@%";
        let code = "";
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const drawCaptcha = (code: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background Noise
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add interference lines
        for (let i = 0; i < 7; i++) {
            ctx.strokeStyle = `rgba(0, 245, 255, ${Math.random() * 0.5})`;
            ctx.lineWidth = Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        // Draw Text
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textBaseline = 'middle';
        
        const letterSpace = canvas.width / 7;
        for(let i=0; i<code.length; i++) {
            ctx.save();
            ctx.translate(20 + i * letterSpace, canvas.height/2);
            ctx.rotate((Math.random() - 0.5) * 0.4); // Random rotation
            ctx.fillStyle = '#00f5ff';
            ctx.shadowColor = "#00f5ff";
            ctx.shadowBlur = 5;
            ctx.fillText(code[i], 0, 0);
            ctx.restore();
        }
    };

    const refresh = () => {
        const newCode = generateCaptcha();
        drawCaptcha(newCode);
        onGenerate(newCode);
    };

    useEffect(() => {
        refresh();
    }, []);

    return (
        <div className="flex items-center gap-3">
            <canvas 
                ref={canvasRef} 
                width={200} 
                height={50} 
                className="rounded border border-[#00f5ff]/30 bg-black/40 cursor-pointer hover:border-[#00f5ff] transition-colors"
                onClick={refresh}
                title="Click to refresh captcha"
            />
            <button 
                type="button" 
                onClick={refresh} 
                className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
                <RefreshCcw size={18} />
            </button>
        </div>
    );
};

const COMPLEXITY_PRESETS = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"];

const Admin = () => {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState(""); // The real code
  const [loginState, setLoginState] = useState<'idle' | 'checking' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- EDITOR STATE ---
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [activeTab, setActiveTab] = useState<"java" | "cpp">("java");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  const [formData, setFormData] = useState({
    id: "", title: "", category: "", timeComplexity: "O(n)",
    spaceComplexity: "O(1)", description: "", codeJava: "", codeCpp: ""
  });

  // --- UI STATE ---
  const [jsonOutput, setJsonOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // --- MODAL STATES ---
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  // --- GIST CONFIGURATION ---
  const [gistConfig, setGistConfig] = useState({ id: "", token: "" });
  const [existingAlgos, setExistingAlgos] = useState<any[]>([]);

  useEffect(() => {
    const savedConfig = localStorage.getItem("algolib_gist_config");
    if(savedConfig) setGistConfig(JSON.parse(savedConfig));
  }, []);

  // --- LOGIN HANDLER ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoginState('checking');
    
    // Simulate network/verification delay
    await new Promise(r => setTimeout(r, 1500));

    // 1. Check Captcha
    if (captchaInput.toUpperCase() !== captchaCode) {
        setLoginState('error');
        setErrorMessage("SECURITY_CHECK_FAILED: INVALID_CAPTCHA");
        setTimeout(() => setLoginState('idle'), 2000);
        return;
    }

    // 2. Check Credentials
    if (username === "algolib" && password === "dQk028<7@") {
      setLoginState('success');
      setTimeout(() => setIsAuthenticated(true), 1200);
    } else {
      setLoginState('error');
      setErrorMessage("ACCESS_DENIED: INVALID_CREDENTIALS");
      setTimeout(() => setLoginState('idle'), 2000);
    }
  };

  // --- GIST OPERATIONS ---
  const fetchFromGist = async () => {
    if(!gistConfig.id) return alert("Please configure Gist ID in settings first.");
    setIsLoading(true);
    try {
        const response = await fetch(`https://api.github.com/gists/${gistConfig.id}`);
        const data = await response.json();
        const fileContent = data.files["algorithms.json"]?.content;
        if(fileContent) {
            const parsed = JSON.parse(fileContent);
            setExistingAlgos(parsed);
            return parsed;
        } else throw new Error("algorithms.json not found");
    } catch (error) {
        alert("Failed to fetch Gist.");
    } finally {
        setIsLoading(false);
    }
  };

  const loadAlgorithm = (algo: any) => {
      setFormData({
          id: algo.id || "", title: algo.title || "", category: algo.category || "",
          timeComplexity: algo.timeComplexity || "O(n)", spaceComplexity: algo.spaceComplexity || "O(1)",
          description: algo.description || "", codeJava: algo.codeJava || "", codeCpp: algo.codeCpp || ""
      });
      setTags(algo.tags || []);
      setMode("edit");
      setShowLoadModal(false);
      setStatusMsg(`Loaded: ${algo.title}`);
      setTimeout(() => setStatusMsg(""), 3000);
  };

  const saveToGist = async () => {
      if(!gistConfig.token) return alert("Please configure GitHub Token.");
      if(!formData.id || !formData.title) return alert("ID and Title required.");
      setIsLoading(true);
      try {
          const currentData = await fetchFromGist();
          if(!currentData) return;
          let newData = [...currentData];
          const newEntry = { ...formData, tags };
          if (mode === "edit") {
              const index = newData.findIndex((a: any) => a.id === formData.id);
              if(index !== -1) newData[index] = newEntry;
              else newData.push(newEntry); 
          } else {
              if(newData.find((a: any) => a.id === formData.id)) {
                  alert("ID exists!"); setIsLoading(false); return;
              }
              newData.push(newEntry);
          }
          const res = await fetch(`https://api.github.com/gists/${gistConfig.id}`, {
              method: "PATCH",
              headers: { "Authorization": `Bearer ${gistConfig.token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ files: { "algorithms.json": { content: JSON.stringify(newData, null, 2) } } })
          });
          if(res.ok) { setStatusMsg("Database Synced"); setTimeout(() => setStatusMsg(""), 5000); }
      } catch (error) { alert("Save failed."); } finally { setIsLoading(false); }
  };

  const handlePurge = () => {
    setFormData({
        id: "", title: "", category: "", timeComplexity: "O(n)", 
        spaceComplexity: "O(1)", description: "", codeJava: "", codeCpp: ""
    });
    setTags([]); setJsonOutput(""); setMode("create"); setShowPurgeModal(false);
    setStatusMsg("Workspace Purged"); setTimeout(() => setStatusMsg(""), 2000);
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };
  const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t));
  const generateJSON = () => { setJsonOutput(JSON.stringify({ ...formData, tags }, null, 2)); };


  // --- LOGIN SCREEN COMPONENT ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <NeuralBackground />
        
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
            {/* Holographic Container */}
            <div className="bg-[#0a0a1a]/80 backdrop-blur-xl border border-[#00f5ff]/20 p-1 rounded-2xl shadow-[0_0_100px_rgba(0,245,255,0.1)] overflow-hidden">
                
                {/* Scanning Light Effect */}
                <motion.div 
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f5ff]/50 to-transparent z-20 shadow-[0_0_10px_#00f5ff]"
                />

                <div className="bg-[#050510]/90 rounded-xl p-8 border border-white/5 relative">
                    
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8">
                        <motion.div 
                            animate={loginState === 'success' ? { scale: [1, 1.2, 1], rotate: 360 } : {}}
                            className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 border-2 relative ${
                                loginState === 'error' ? 'border-red-500 bg-red-500/10' : 
                                loginState === 'success' ? 'border-[#00ff88] bg-[#00ff88]/10' : 
                                'border-[#00f5ff]/30 bg-[#00f5ff]/5'
                            }`}
                        >
                            <AnimatePresence mode="wait">
                                {loginState === 'checking' ? (
                                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                                        <Loader2 className="animate-spin text-[#00f5ff]" size={32} />
                                    </motion.div>
                                ) : loginState === 'success' ? (
                                    <motion.div initial={{opacity:0, scale:0.5}} animate={{opacity:1, scale:1}}>
                                        <Unlock className="text-[#00ff88]" size={32} />
                                    </motion.div>
                                ) : loginState === 'error' ? (
                                    <motion.div 
                                        initial={{x:0}} 
                                        animate={{x: [-10, 10, -10, 10, 0]}} 
                                        transition={{duration: 0.4}}
                                    >
                                        <ShieldAlert className="text-red-500" size={32} />
                                    </motion.div>
                                ) : (
                                    <Lock className="text-[#00f5ff]" size={32} />
                                )}
                            </AnimatePresence>
                            
                            {/* Orbit rings */}
                            {loginState === 'checking' && (
                                <div className="absolute inset-0 rounded-full border border-t-[#00f5ff] border-r-transparent border-b-[#00f5ff] border-l-transparent animate-spin" />
                            )}
                        </motion.div>
                        
                        <div className="text-center">
                            <h2 className="text-2xl font-black tracking-widest text-white uppercase font-mono">
                                {loginState === 'success' ? <span className="text-[#00ff88]">ACCESS_GRANTED</span> : "SECURE_GATE"}
                            </h2>
                            <p className="text-[10px] font-mono text-gray-500 tracking-[0.3em] mt-2">
                                BIOMETRIC_ENCRYPTION_LAYER
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-6 relative z-30">
                        <div className="space-y-4">
                            <div className="space-y-1 group">
                                <label className="text-[9px] text-[#00f5ff]/70 font-mono uppercase tracking-widest pl-1">Identity</label>
                                <div className="relative">
                                    <Terminal size={14} className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-[#00f5ff] transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="usr_admin" 
                                        value={username} 
                                        disabled={loginState === 'checking' || loginState === 'success'}
                                        onChange={(e) => setUsername(e.target.value)} 
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 outline-none focus:border-[#00f5ff] text-white font-mono text-sm shadow-inner transition-all hover:bg-black/60 focus:bg-black/80" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 group">
                                <label className="text-[9px] text-[#00f5ff]/70 font-mono uppercase tracking-widest pl-1">Passcode</label>
                                <div className="relative">
                                    <Fingerprint size={14} className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-[#00f5ff] transition-colors" />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="••••••••" 
                                        value={password} 
                                        disabled={loginState === 'checking' || loginState === 'success'}
                                        onChange={(e) => setPassword(e.target.value)} 
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-10 py-3 outline-none focus:border-[#00f5ff] text-white font-mono text-sm shadow-inner transition-all hover:bg-black/60 focus:bg-black/80" 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-gray-500 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                                    </button>
                                </div>
                            </div>

                            {/* CAPTCHA SECTION */}
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <label className="text-[9px] text-[#00f5ff]/70 font-mono uppercase tracking-widest pl-1">Human Verification Protocol</label>
                                <div className="flex flex-col gap-3">
                                    <CaptchaCanvas onGenerate={setCaptchaCode} />
                                    
                                    <div className="relative">
                                        <ShieldCheck size={14} className="absolute left-3 top-3.5 text-gray-500" />
                                        <input 
                                            type="text" 
                                            placeholder="ENTER_PROTOCOL_CODE" 
                                            value={captchaInput} 
                                            disabled={loginState === 'checking' || loginState === 'success'}
                                            onChange={(e) => setCaptchaInput(e.target.value)} 
                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 outline-none focus:border-[#00f5ff] text-white font-mono text-sm uppercase tracking-widest" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {errorMessage && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-red-500 text-[10px] font-mono text-center bg-red-500/10 p-2 rounded border border-red-500/20 flex items-center justify-center gap-2"
                                >
                                    <AlertCircle size={12} /> {errorMessage}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loginState === 'checking' || loginState === 'success'}
                            className={`w-full py-3.5 rounded-lg font-bold text-sm tracking-wider uppercase transition-all duration-300 relative overflow-hidden group ${
                                loginState === 'success' 
                                ? 'bg-[#00ff88] text-black shadow-[0_0_20px_#00ff88]' 
                                : 'bg-[#00f5ff] hover:bg-[#00d0db] text-black shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_30px_rgba(0,245,255,0.6)]'
                            }`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loginState === 'checking' ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> VERIFYING...
                                    </>
                                ) : loginState === 'success' ? (
                                    <>
                                        <Check size={16} /> UNLOCKED
                                    </>
                                ) : (
                                    <>
                                        AUTHENTICATE <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </motion.div>
      </div>
    );
  }

  // --- MAIN ADMIN APP ---
  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden">
      <NeuralBackground />
      <Navbar />
      
      {/* --- PURGE MODAL (Visual Update) --- */}
      <AnimatePresence>
        {showPurgeModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-[#1a0505] border border-red-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/30">
                            <ShieldAlert className="text-red-500 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-wider">System Purge</h3>
                        <p className="text-xs text-gray-400 mt-2 font-mono">WARNING: This action creates an irreversible data loss event. Confirm deletion?</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowPurgeModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-400 transition-colors">ABORT</button>
                        <button onClick={handlePurge} className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold text-white shadow-lg shadow-red-900/40 transition-all">CONFIRM DELETE</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- CONFIG MODAL (Visual Update) --- */}
      <AnimatePresence>
        {showConfigModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md bg-[#0a0a1a] border border-[#00f5ff]/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,245,255,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent opacity-50" />
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono"><Settings size={18} className="text-[#00f5ff]"/> CONNECTION_SETTINGS</h3>
                        <button onClick={() => setShowConfigModal(false)}><X size={18} className="text-gray-500 hover:text-white"/></button>
                    </div>
                    <div className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-[10px] text-[#00f5ff]/70 uppercase font-mono tracking-widest">Gist ID Reference</label>
                            <input value={gistConfig.id} onChange={(e) => setGistConfig({...gistConfig, id: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-xs font-mono text-white focus:border-[#00f5ff] outline-none transition-colors" placeholder="e.g. abc12345..." />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-[#00f5ff]/70 uppercase font-mono tracking-widest">GitHub Token (Scope: Gist)</label>
                            <input type="password" value={gistConfig.token} onChange={(e) => setGistConfig({...gistConfig, token: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-xs font-mono text-white focus:border-[#00f5ff] outline-none transition-colors" placeholder="ghp_..." />
                        </div>
                        <button 
                            onClick={() => {
                                localStorage.setItem("algolib_gist_config", JSON.stringify(gistConfig));
                                setShowConfigModal(false);
                                setStatusMsg("Credentials Saved");
                                setTimeout(() => setStatusMsg(""), 2000);
                            }}
                            className="w-full py-3 bg-[#00f5ff] text-black rounded font-bold hover:bg-[#00c2cc] transition-all shadow-[0_0_15px_rgba(0,245,255,0.3)] mt-2"
                        >
                            SAVE CONFIGURATION
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- LOAD/EDIT MODAL (Visual Update) --- */}
      <AnimatePresence>
        {showLoadModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-3xl h-[80vh] bg-[#0a0a1a] border border-[#00f5ff]/30 rounded-2xl p-6 shadow-[0_0_60px_rgba(0,245,255,0.1)] flex flex-col relative">
                     <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none"><CloudLightning size={100} /></div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 font-mono">
                            <span className="p-2 bg-[#00f5ff]/10 rounded border border-[#00f5ff]/30 text-[#00f5ff]"><CloudLightning size={20}/></span> 
                            DATABASE_QUERY
                        </h3>
                        <button onClick={() => setShowLoadModal(false)}><X size={20} className="text-gray-500 hover:text-white"/></button>
                    </div>
                    
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center flex-col gap-4">
                            <Loader2 className="animate-spin text-[#00f5ff]" size={40} />
                            <span className="text-xs font-mono text-[#00f5ff] animate-pulse">ESTABLISHING UPLINK...</span>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto custom-scrollbar space-y-3 pr-2 relative z-10">
                             {existingAlgos.length === 0 && <div className="text-center text-gray-500 py-10 font-mono">NO DATA SIGNATURES FOUND.</div>}
                             {existingAlgos.map((algo) => (
                                 <div key={algo.id} onClick={() => loadAlgorithm(algo)} className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-[#00f5ff] hover:bg-[#00f5ff]/5 cursor-pointer transition-all group flex items-center justify-between">
                                     <div className="flex items-center gap-4">
                                         <div className="w-1 h-10 bg-gray-700 group-hover:bg-[#00f5ff] transition-colors rounded-full" />
                                         <div>
                                             <h4 className="font-bold text-gray-200 group-hover:text-[#00f5ff] tracking-wide">{algo.title}</h4>
                                             <p className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                                                 <Hash size={10} /> {algo.id} <span className="text-gray-700">|</span> {algo.timeComplexity}
                                             </p>
                                         </div>
                                     </div>
                                     <div className="p-2 rounded-full bg-black/50 border border-white/10 group-hover:border-[#00f5ff]/50 transition-colors">
                                        <Edit3 size={16} className="text-gray-500 group-hover:text-[#00f5ff]" />
                                     </div>
                                 </div>
                             ))}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-32 pb-20 px-4 container mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
           <div>
               <div className="flex items-center gap-4 mb-2">
                  <div className="p-2 bg-[#00ff88]/10 rounded-lg border border-[#00ff88]/30">
                    <ShieldCheck className="text-[#00ff88] w-6 h-6" />
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter text-white">DATA_FORGE</h1>
               </div>
               <div className="flex items-center gap-3 pl-1">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${mode === 'create' ? 'bg-[#00f5ff]/10 border-[#00f5ff] text-[#00f5ff]' : 'bg-orange-500/10 border-orange-500 text-orange-500'}`}>
                       MODE: {mode}
                   </span>
                   {statusMsg && (
                       <span className="flex items-center gap-2 text-[#00ff88] text-xs font-mono animate-in slide-in-from-left fade-in">
                           <Check size={12}/> {statusMsg}
                       </span>
                   )}
               </div>
           </div>
           
           <div className="flex gap-3 bg-[#0a0a1a] p-1.5 rounded-xl border border-white/10">
               <button onClick={() => setShowConfigModal(true)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Settings"><Settings size={18} /></button>
               
               <div className="w-px bg-white/10 mx-1 my-1"></div>

               <button 
                  onClick={() => {
                      fetchFromGist().then((data) => {
                          if(data) setShowLoadModal(true);
                      });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00f5ff]/5 border border-[#00f5ff]/20 text-[#00f5ff] rounded-lg hover:bg-[#00f5ff]/10 transition-all text-xs font-bold font-mono tracking-wide"
               >
                   <CloudLightning size={14} /> LOAD_DATA
               </button>

               <button 
                  onClick={() => setShowPurgeModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/5 border border-red-500/20 text-red-500 text-xs font-bold font-mono tracking-wide hover:bg-red-500/10 transition-all rounded-lg"
               >
                   <RefreshCw size={14} /> PURGE
               </button>
           </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
           {/* --- FORM SECTION --- */}
           <div className={`space-y-6 bg-[#0a0a1a]/80 backdrop-blur-xl border p-8 rounded-3xl relative transition-all shadow-2xl ${mode === 'edit' ? 'border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.1)]' : 'border-[#00f5ff]/20 shadow-[0_0_30px_rgba(0,245,255,0.05)]'}`}>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2 group">
                    <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest flex items-center gap-2 opacity-70 group-focus-within:opacity-100 transition-opacity">Protocol ID <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Hash size={14} className={`absolute left-3 top-3.5 transition-colors ${mode === 'edit' ? 'text-gray-600' : 'text-gray-500 group-focus-within:text-[#00f5ff]'}`} />
                        <input disabled={mode === 'edit'} value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} className={`w-full bg-black/40 border rounded-lg pl-10 pr-4 py-3 outline-none font-mono text-sm transition-all ${mode === 'edit' ? 'border-orange-500/20 text-gray-500 cursor-not-allowed' : 'border-white/10 focus:border-[#00f5ff] text-white focus:bg-black/60'}`} placeholder="algo_unique_id" />
                    </div>
                 </div>
                 <div className="space-y-2 group">
                    <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest opacity-70 group-focus-within:opacity-100 transition-opacity">Category</label>
                    <input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00f5ff] text-sm text-white focus:bg-black/60 transition-all" placeholder="e.g. Dynamic Programming" />
                 </div>
              </div>

              <div className="space-y-2 group">
                 <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest flex items-center gap-2 opacity-70 group-focus-within:opacity-100 transition-opacity">Algorithm Title <span className="text-red-500">*</span></label>
                 <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00f5ff] text-sm font-bold text-white focus:bg-black/60 transition-all" placeholder="e.g. Dijkstra's Shortest Path" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Time Complexity</label>
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-1 custom-scrollbar">
                        {COMPLEXITY_PRESETS.map(c => (
                            <button key={c} onClick={() => setFormData({...formData, timeComplexity: c})} className="px-2 py-1 rounded bg-purple-900/20 border border-purple-500/30 text-[10px] text-purple-300 hover:bg-purple-500/20 whitespace-nowrap transition-colors">{c}</button>
                        ))}
                    </div>
                    <input value={formData.timeComplexity} onChange={(e) => setFormData({...formData, timeComplexity: e.target.value})} className="w-full bg-black/40 border border-purple-900/30 rounded-lg px-4 py-2 outline-none focus:border-purple-500 font-mono text-sm text-white transition-colors" />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2"><HardDrive size={12}/> Space Complexity</label>
                    <div className="h-[27px] w-full"></div> {/* Spacer to align inputs */}
                    <input value={formData.spaceComplexity} onChange={(e) => setFormData({...formData, spaceComplexity: e.target.value})} className="w-full bg-black/40 border border-purple-900/30 rounded-lg px-4 py-2 outline-none focus:border-purple-500 font-mono text-sm text-white transition-colors" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest flex items-center gap-2 opacity-70"><Hash size={12}/> Tags</label>
                 <div className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus-within:border-[#00f5ff] flex flex-wrap gap-2 transition-all min-h-[50px]">
                    {tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 bg-[#00f5ff]/20 text-[#00f5ff] px-2 py-1 rounded text-xs font-mono border border-[#00f5ff]/30">
                            #{tag} <X size={10} className="cursor-pointer hover:text-white" onClick={() => removeTag(tag)} />
                        </span>
                    ))}
                    <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder={tags.length === 0 ? "Press Enter to add tags..." : ""} className="bg-transparent outline-none flex-1 text-sm text-gray-300 min-w-[80px]" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Description</label>
                 <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00f5ff] text-sm leading-relaxed text-gray-300 focus:text-white transition-all resize-none" />
              </div>

              <div className="space-y-0">
                 <div className="flex items-center justify-between border-b border-white/10 pb-0">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2 pb-2">Implementation Sequence</label>
                    <div className="flex">
                        <button onClick={() => setActiveTab("java")} className={`px-4 py-2 text-[10px] font-bold rounded-t-lg transition-all border-t border-l border-r ${activeTab === 'java' ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30' : 'border-transparent text-gray-500 hover:text-white'}`}>JAVA</button>
                        <button onClick={() => setActiveTab("cpp")} className={`px-4 py-2 text-[10px] font-bold rounded-t-lg transition-all border-t border-l border-r ${activeTab === 'cpp' ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/30' : 'border-transparent text-gray-500 hover:text-white'}`}>C++</button>
                    </div>
                 </div>
                 <div className="relative">
                     {activeTab === 'java' ? (
                         <textarea value={formData.codeJava} onChange={(e) => setFormData({...formData, codeJava: e.target.value})} rows={12} className="w-full bg-[#050510] border-b border-l border-r border-[#00ff88]/30 rounded-b-lg rounded-tr-lg px-4 py-4 outline-none focus:bg-black/80 text-[11px] font-mono text-green-100 leading-relaxed custom-scrollbar transition-all" placeholder="// Java Implementation..." />
                     ) : (
                         <textarea value={formData.codeCpp} onChange={(e) => setFormData({...formData, codeCpp: e.target.value})} rows={12} className="w-full bg-[#050510] border-b border-l border-r border-[#8b5cf6]/30 rounded-b-lg rounded-tr-lg px-4 py-4 outline-none focus:bg-black/80 text-[11px] font-mono text-purple-100 leading-relaxed custom-scrollbar transition-all" placeholder="// C++ Implementation..." />
                     )}
                 </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button onClick={generateJSON} className="flex-1 py-4 bg-[#00f5ff]/5 border border-[#00f5ff]/20 text-[#00f5ff] font-bold uppercase rounded-xl hover:bg-[#00f5ff]/10 hover:border-[#00f5ff]/50 transition-all flex items-center justify-center gap-2 text-xs tracking-widest">
                     <Code size={16} /> Generate JSON Packet
                  </button>
                  
                  <button onClick={saveToGist} disabled={isLoading} className={`flex-1 py-4 font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-xs tracking-widest ${mode === 'edit' ? 'bg-orange-500 hover:bg-orange-600 text-black shadow-orange-500/20' : 'bg-[#00f5ff] hover:bg-[#00c2cc] text-black shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_30px_rgba(0,245,255,0.5)]'}`}>
                     {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />}
                     {mode === 'edit' ? 'Update Repository' : 'Commit to Database'}
                  </button>
              </div>
           </div>

           {/* --- OUTPUT SECTION --- */}
           <div className="flex flex-col gap-6">
              <div className="bg-[#0a0a1a]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex-1 flex flex-col min-h-[500px] shadow-xl relative overflow-hidden group sticky top-24">
                 
                 {/* Decorative top bar */}
                 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00f5ff]/30 to-transparent" />

                 <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                       <FileJson size={14} className="text-[#00f5ff]" />
                       <span className="text-[10px] font-bold font-mono text-white tracking-widest uppercase">JSON_STREAM_OUTPUT</span>
                    </div>
                    {jsonOutput && (
                      <button 
                        onClick={() => { navigator.clipboard.writeText(jsonOutput); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="px-3 py-1.5 rounded bg-[#00f5ff]/10 text-[#00f5ff] text-[10px] font-mono border border-[#00f5ff]/30 hover:bg-[#00f5ff] hover:text-black transition-all flex items-center gap-2 font-bold"
                      >
                         {copied ? <Check size={10}/> : <Copy size={10}/>} {copied ? "COPIED" : "COPY_DATA"}
                      </button>
                    )}
                 </div>

                 <div className="flex-1 bg-black/60 rounded-xl border border-white/5 p-6 overflow-auto custom-scrollbar relative z-10 font-mono text-[11px] leading-relaxed shadow-inner">
                    {jsonOutput ? (
                      <pre className="text-blue-300 whitespace-pre-wrap">{jsonOutput},</pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-4">
                         <div className="p-4 rounded-full bg-white/5 border border-white/5">
                            <Terminal size={32} className="text-gray-400" />
                         </div>
                         <p className="italic font-mono text-xs max-w-[200px] text-gray-500">
                            [STATUS: IDLE] <br/> Awaiting data forge inputs to generate stream.
                         </p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;