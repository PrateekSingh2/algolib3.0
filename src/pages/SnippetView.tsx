import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from "framer-motion";
import { ArrowLeft, Clock, HardDrive, Copy, Check, Terminal, Zap, ScanLine, Cpu } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import { fetchAlgorithms, type Algorithm } from "@/lib/algorithms";
import Navbar from "@/components/Navbar";

// --- 1. ALIEN UNIVERSE BACKGROUND ---
const AlienUniverseBackground = () => {
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

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const PARTICLE_COUNT = width < 768 ? 50 : 120;
    const CONNECT_DISTANCE = 120;
    const MOUSE_DISTANCE = 200;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.size = Math.random() * 2 + 0.5;
        const colors = ["rgba(0, 245, 255,", "rgba(157, 0, 255,", "rgba(0, 255, 136,"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `${this.color} 0.5)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p, index) => {
        p.update();
        p.draw();
        const dxMouse = mouseX - p.x;
        const dyMouse = mouseY - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < MOUSE_DISTANCE) {
           ctx.beginPath();
           ctx.strokeStyle = `${p.color} ${1 - distMouse / MOUSE_DISTANCE})`;
           ctx.lineWidth = 0.5;
           ctx.moveTo(p.x, p.y);
           ctx.lineTo(mouseX, mouseY);
           ctx.stroke();
        }
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DISTANCE) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 100, 255, ${0.05 * (1 - dist / CONNECT_DISTANCE)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    };
    animate();
    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-[#020205] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0b0b1e] via-[#020205] to-[#000000]" />
      <motion.div animate={{ x: [0, 30, 0], y: [0, -30, 0], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full blur-[120px]" />
      <motion.div animate={{ x: [0, -30, 0], y: [0, 30, 0], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-900/20 rounded-full blur-[140px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 transform perspective-500 rotate-x-12 scale-110 pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};

const FloatingElement = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}>
    {children}
  </motion.div>
);

const FlickeringTitle = ({ text }: { text: string }) => {
  return (
    <div className="relative inline-block">
        <motion.h1 
            animate={{ opacity: [1, 0.8, 1, 0.9, 1, 0.7, 1] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2, 0.4, 0.6, 0.8, 1] }}
            className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-gray-400 tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] break-words leading-tight"
        >
            {text}
        </motion.h1>
        <motion.span 
            animate={{ opacity: [0, 0.5, 0], x: [-2, 2, -2] }}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2 }}
            className="absolute top-0 left-0 text-4xl lg:text-6xl font-black text-[#00f5ff] opacity-0 mix-blend-overlay pointer-events-none tracking-tighter break-words leading-tight"
        >
            {text}
        </motion.span>
    </div>
  );
};

const SnippetView = () => {
  const { id } = useParams<{ id: string }>();
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [activeTab, setActiveTab] = useState<"java" | "cpp">("java");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  const customPrismStyles = `
    code[class*="language-"], pre[class*="language-"] {
      color: #e0e7ff; 
      text-shadow: 0 0 5px rgba(0, 245, 255, 0.2);
      font-family: 'Fira Code', monospace;
      font-size: 14px;
      line-height: 1.7;
    }
    .token.comment { color: #6b7280; font-style: italic; }
    .token.punctuation { color: #a5b4fc; }
    .token.function { color: #60a5fa; }
    .token.keyword { color: #c084fc; text-shadow: 0 0 10px rgba(192, 132, 252, 0.4); }
    .token.string { color: #34d399; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
  `;

  useEffect(() => {
    let mounted = true;
    fetchAlgorithms().then((algos) => {
      if (mounted) {
        setAlgorithm(algos.find((a) => String(a.id) === id) || null);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (algorithm) setTimeout(() => Prism.highlightAll(), 0);
  }, [algorithm, activeTab]);

  const handleCopy = async () => {
    const code = activeTab === "java" ? algorithm?.codeJava : algorithm?.codeCpp;
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050510]">
        <AlienUniverseBackground />
        <div className="relative">
           <div className="w-24 h-24 border-t-4 border-b-4 border-[#00f5ff] rounded-full animate-spin" />
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-[#00f5ff]/20 rounded-full animate-pulse" />
           </div>
        </div>
      </div>
    );
  }

  if (!algorithm) return null;

  const currentCode = activeTab === "java" ? algorithm.codeJava : algorithm.codeCpp;

  return (
    <div className="min-h-screen text-white font-sans relative selection:bg-[#00f5ff]/30 overflow-x-hidden">
      <style>{customPrismStyles}</style>
      <AlienUniverseBackground />
      <Navbar />

      <main className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          
          {/* --- TOP NAV --- */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-12"
          >
            <Link to="/" className="group flex items-center gap-3">
               <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:border-[#00f5ff]/50 group-hover:text-[#00f5ff] transition-all">
                 <ArrowLeft className="w-5 h-5" />
               </div>
               <span className="text-sm font-mono text-gray-400 group-hover:text-[#00f5ff] tracking-widest uppercase transition-colors">Abort Sequence</span>
            </Link>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#00f5ff]/20 bg-[#00f5ff]/5 backdrop-blur-md shadow-[0_0_15px_rgba(0,245,255,0.15)]">
               <div className="w-2 h-2 rounded-full bg-[#00f5ff] animate-[pulse_2s_infinite]" />
               <span className="text-[10px] font-mono font-bold tracking-widest text-[#00f5ff] uppercase">Secure Connection</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-12 items-start">
            
            {/* --- LEFT: HOLOGRAPHIC CODE TERMINAL --- */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative w-full group"
            >
               {/* Holographic Glow Border */}
               <div className="absolute -inset-[1px] bg-gradient-to-b from-[#00f5ff]/40 to-[#9d00ff]/40 rounded-2xl blur-sm opacity-50 group-hover:opacity-80 transition duration-1000" />
               
               {/* Changed: Removed min-h-[500px], added h-auto. This allows the box to shrink. */}
               <div className="relative h-auto rounded-2xl bg-[#0a0a1a]/90 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl flex flex-col">
                  
                  {/* --- SCANNING LINE EFFECT --- */}
                  <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-overlay opacity-30">
                     <motion.div 
                        animate={{ top: ["-10%", "110%"] }} 
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }} 
                        className="absolute left-0 right-0 h-10 bg-gradient-to-b from-transparent via-[#00f5ff] to-transparent shadow-[0_0_30px_#00f5ff]" 
                     />
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 shrink-0 relative z-20">
                     <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-[#00f5ff]/10">
                            <Terminal className="w-4 h-4 text-[#00f5ff]" />
                        </div>
                        <span className="text-xs font-mono text-gray-400 tracking-wider">
                           COM_LINK :: <span className="text-[#00f5ff] font-bold">{activeTab.toUpperCase()}</span>
                        </span>
                     </div>

                     <div className="flex items-center gap-4">
                        <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                           {(['java', 'cpp'] as const).map((lang) => (
                              <button
                                 key={lang}
                                 onClick={() => setActiveTab(lang)}
                                 className={`px-4 py-1.5 text-[10px] font-mono font-bold uppercase transition-all duration-300 rounded-md ${
                                    activeTab === lang 
                                       ? "text-black bg-[#00f5ff] shadow-[0_0_10px_#00f5ff]" 
                                       : "text-gray-500 hover:text-white"
                                 }`}
                              >
                                 {lang}
                              </button>
                           ))}
                        </div>
                        
                        <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white" title="Copy to Clipboard">
                           {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                     </div>
                  </div>

                  {/* Code Area: Removed min-h, added max-h for auto-resize */}
                  <div className="relative bg-gradient-to-b from-black/50 to-transparent flex-1 w-full">
                     <div className="overflow-auto custom-scrollbar p-6 max-h-[70vh]">
                        <AnimatePresence mode="wait">
                           <motion.div
                              key={activeTab}
                              initial={{ opacity: 0, filter: "blur(4px)" }}
                              animate={{ opacity: 1, filter: "blur(0px)" }}
                              transition={{ duration: 0.3 }}
                           >
                              <pre className="!bg-transparent !m-0 !p-0">
                                 <code className={`language-${activeTab}`}>
                                    {currentCode}
                                 </code>
                              </pre>
                           </motion.div>
                        </AnimatePresence>
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* --- RIGHT: DATA PANELS (FLOATING) --- */}
            <div className="space-y-8 lg:sticky lg:top-32">
               
               <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <div className="flex flex-wrap gap-2 mb-4">
                     <div className="px-2 py-1 rounded text-[10px] font-mono border border-[#00f5ff]/30 text-[#00f5ff] bg-[#00f5ff]/5 flex items-center gap-2">
                        <ScanLine size={10} /> ID: {algorithm.id.slice(0,4).toUpperCase()}
                     </div>
                     <span className="px-2 py-1 rounded text-[10px] font-mono border border-purple-500/30 text-purple-400 bg-purple-500/5 uppercase">
                        {algorithm.category}
                     </span>
                  </div>
                  
                  <FlickeringTitle text={algorithm.title} />
               </motion.div>

               <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="p-6 rounded-xl bg-[#0a0a1a]/60 border border-white/10 backdrop-blur-md text-gray-300 font-light leading-relaxed text-sm shadow-xl relative overflow-hidden group"
               >
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#00f5ff] group-hover:shadow-[0_0_15px_#00f5ff] transition-shadow duration-300" />
                  <div className="absolute -right-10 -top-10 w-20 h-20 bg-[#00f5ff]/10 blur-xl rounded-full" />
                  {algorithm.description}
               </motion.div>

               <div className="grid grid-cols-1 gap-5">
                  <FloatingElement delay={0}>
                     <div className="group relative overflow-hidden rounded-xl bg-[#0a0a1a]/60 border border-white/10 p-5 hover:border-[#00f5ff]/50 hover:bg-[#00f5ff]/5 transition-all duration-300 shadow-lg">
                        <div className="flex justify-between items-center relative z-10">
                           <div>
                              <div className="text-[10px] font-mono text-[#00f5ff] mb-1 uppercase tracking-widest flex items-center gap-2">
                                 <Clock size={12} /> Time Complexity
                              </div>
                              <div className="text-3xl font-mono text-white font-bold tracking-tight shadow-[#00f5ff] drop-shadow-md">
                                 {algorithm.timeComplexity}
                              </div>
                           </div>
                           <div className="w-10 h-10 rounded-full bg-[#00f5ff]/10 flex items-center justify-center border border-[#00f5ff]/20 group-hover:scale-110 transition-transform">
                              <Zap className="w-5 h-5 text-[#00f5ff]" />
                           </div>
                        </div>
                     </div>
                  </FloatingElement>

                  <FloatingElement delay={1.5}>
                     <div className="group relative overflow-hidden rounded-xl bg-[#0a0a1a]/60 border border-white/10 p-5 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300 shadow-lg">
                        <div className="flex justify-between items-center relative z-10">
                           <div>
                              <div className="text-[10px] font-mono text-purple-400 mb-1 uppercase tracking-widest flex items-center gap-2">
                                 <HardDrive size={12} /> Space Complexity
                              </div>
                              <div className="text-3xl font-mono text-white font-bold tracking-tight shadow-purple-500 drop-shadow-md">
                                 {algorithm.spaceComplexity}
                              </div>
                           </div>
                           <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                              <Cpu className="w-5 h-5 text-purple-400" />
                           </div>
                        </div>
                     </div>
                  </FloatingElement>
               </div>

               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                 className="flex flex-wrap gap-2 pt-2"
               >
                  {algorithm.tags?.map((tag) => (
                     <Link 
                        key={tag} 
                        to={`/?search=${tag}`}
                        className="px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:border-[#00f5ff]/50 hover:text-[#00f5ff] hover:shadow-[0_0_10px_rgba(0,245,255,0.2)] transition-all text-[10px] font-mono text-gray-500 uppercase tracking-wider"
                     >
                        #{tag}
                     </Link>
                  ))}
               </motion.div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SnippetView;