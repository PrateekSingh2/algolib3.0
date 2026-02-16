import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, Plus, ShieldCheck, Lock, Terminal, 
  Clock, HardDrive, Copy, Check, Info, Cpu, Hash
} from "lucide-react";
import Navbar from "@/components/Navbar";

// --- 1. INTERACTIVE NEURAL BACKGROUND ---
const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    let particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
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
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 bg-[#020205]" />;
};

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    title: "",
    category: "",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    description: "",
    tags: "",
    codeJava: "",
    codeCpp: ""
  });

  const [jsonOutput, setJsonOutput] = useState("");
  const [copied, setCopied] = useState(false);

  // PREDEFINED CREDENTIALS
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "algolib" && password === "dQk028<7@") {
      setIsAuthenticated(true);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const generateJSON = () => {
    const formatted = {
      ...formData,
      tags: formData.tags.split(",").map(t => t.trim()).filter(t => t !== "")
    };
    setJsonOutput(JSON.stringify(formatted, null, 2));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <NeuralBackground />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#0a0a1a]/80 backdrop-blur-2xl border border-[#00f5ff]/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,245,255,0.2)]"
        >
          <div className="flex flex-col items-center mb-8">
             <div className="w-16 h-16 bg-[#00f5ff]/10 rounded-full flex items-center justify-center mb-4 border border-[#00f5ff]/50">
                <Lock className="text-[#00f5ff] animate-pulse" />
             </div>
             <h2 className="text-2xl font-black tracking-tighter text-white uppercase">Access_Restricted</h2>
             <p className="text-[10px] font-mono text-gray-500 tracking-[0.3em]">Enter Administrator Key</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
             <input 
                type="text" placeholder="IDENTITY" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#00f5ff] text-white font-mono transition-all"
             />
             <input 
                type="password" placeholder="PASSCODE" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#00f5ff] text-white font-mono transition-all"
             />
             <button className="w-full py-4 bg-[#00f5ff] text-black font-black uppercase rounded-xl hover:shadow-[0_0_20px_#00f5ff] transition-all duration-300">
                INITIALIZE_SESSION
             </button>
             {loginError && <p className="text-red-500 text-center font-mono text-[10px] animate-bounce">AUTH_FAILURE: ACCESS_DENIED</p>}
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden">
      <NeuralBackground />
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 container mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-10">
           <div className="flex items-center gap-4 mb-2">
              <ShieldCheck className="text-[#00ff88]" />
              <h1 className="text-4xl font-black tracking-tighter">DATA_FORGE</h1>
           </div>
           <p className="text-gray-500 font-mono text-xs uppercase tracking-widest ml-10">Algorithm Construction Environment v2.4</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
           {/* FORM SECTION */}
           <div className="space-y-6 bg-[#0a0a1a]/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl relative">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Cpu size={100}/></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest">Protocol ID</label>
                    <input value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} placeholder="binarysearch" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-[#00f5ff] font-mono" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest">Category</label>
                    <input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="Searching" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-[#00f5ff]" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest">Algorithm Title</label>
                 <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Binary Search" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-[#00f5ff]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Time Complexity</label>
                    <input value={formData.timeComplexity} onChange={(e) => setFormData({...formData, timeComplexity: e.target.value})} className="w-full bg-black/40 border border-purple-900/30 rounded-lg px-4 py-2 outline-none focus:border-purple-500 font-mono" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2"><HardDrive size={12}/> Space Complexity</label>
                    <input value={formData.spaceComplexity} onChange={(e) => setFormData({...formData, spaceComplexity: e.target.value})} className="w-full bg-black/40 border border-purple-900/30 rounded-lg px-4 py-2 outline-none focus:border-purple-500 font-mono" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest flex items-center gap-2"><Hash size={12}/> Tags (Comma Separated)</label>
                 <input value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="search, divide and conquer" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-[#00f5ff] text-xs font-mono" />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Description</label>
                 <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-[#00f5ff] text-sm leading-relaxed" />
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest flex items-center gap-2">Sequence_Java</label>
                    <textarea value={formData.codeJava} onChange={(e) => setFormData({...formData, codeJava: e.target.value})} rows={6} className="w-full bg-black/60 border border-green-900/30 rounded-lg px-4 py-2 outline-none focus:border-[#00ff88] text-[11px] font-mono text-green-100" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[#8b5cf6] uppercase tracking-widest flex items-center gap-2">Sequence_C++</label>
                    <textarea value={formData.codeCpp} onChange={(e) => setFormData({...formData, codeCpp: e.target.value})} rows={6} className="w-full bg-black/60 border border-purple-900/30 rounded-lg px-4 py-2 outline-none focus:border-[#8b5cf6] text-[11px] font-mono text-purple-100" />
                 </div>
              </div>

              <button onClick={generateJSON} className="w-full py-4 bg-gradient-to-r from-[#00f5ff] to-[#8b5cf6] text-black font-black uppercase rounded-2xl hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(0,245,255,0.2)]">
                 GENERATE_DATA_PACKET
              </button>
           </div>

           {/* OUTPUT SECTION */}
           <div className="flex flex-col gap-6">
              <div className="bg-[#050510]/90 border border-white/10 rounded-3xl p-6 flex-1 flex flex-col min-h-[500px] shadow-2xl relative overflow-hidden group">
                 <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                       <Terminal size={14} className="text-gray-500" />
                       <span className="text-[10px] font-mono text-gray-500 tracking-widest">JSON_STREAM</span>
                    </div>
                    {jsonOutput && (
                      <button 
                        onClick={() => { navigator.clipboard.writeText(jsonOutput); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="px-3 py-1 rounded bg-[#00f5ff]/10 text-[#00f5ff] text-[10px] font-mono border border-[#00f5ff]/30 hover:bg-[#00f5ff] hover:text-black transition-all"
                      >
                         {copied ? <Check size={10}/> : <Copy size={10}/>} {copied ? "COPIED" : "COPY_PACKET"}
                      </button>
                    )}
                 </div>

                 <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 p-6 overflow-auto custom-scrollbar relative z-10">
                    {jsonOutput ? (
                      <pre className="text-[11px] font-mono text-blue-300 leading-relaxed">{jsonOutput},</pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 italic font-mono text-sm">
                         [AWAITING_FORGE_INITIALIZATION]
                      </div>
                    )}
                 </div>
                 
                 <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-[#00f5ff]/5 pointer-events-none group-hover:opacity-20" />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-start">
                 <Info size={18} className="text-[#00f5ff] mt-1" />
                 <p className="text-[10px] font-mono text-gray-500 leading-relaxed uppercase">
                    Deployment Note: Copy the generated packet and append it into the <span className="text-white">algorithms.json</span> array in the source root. Ensure trailing commas are maintained for valid JSON structure.
                 </p>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;