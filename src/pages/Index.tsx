import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  motion, 
  AnimatePresence, 
  useMotionTemplate, 
  useMotionValue, 
  useSpring, 
  useTransform
} from "framer-motion";
import { 
  ArrowRight, Eye, ChevronDown, Hash, 
  Command, Terminal, Plus, Minus, Cpu, Sparkles 
} from "lucide-react";
// Ensure incrementVisitCount and getVisitCount are exported from your lib file
import { 
  fetchAlgorithms, 
  getVisitCount, 
  incrementVisitCount, 
  getCategories, 
  type Algorithm 
} from "@/lib/algorithms";
import Navbar from "@/components/Navbar";

// --- 1. INTERACTIVE CYBER-NETWORK BACKGROUND ---
const CyberSpaceBackground = () => {
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

    const PARTICLE_COUNT = width < 768 ? 40 : 100;
    const CONNECT_DISTANCE = 140;
    const MOUSE_DISTANCE = 250;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      type: "square" | "plus" | "cross"; 

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2 + 1;
        const r = Math.random();
        if (r > 0.9) this.type = "plus";
        else if (r > 0.8) this.type = "cross";
        else this.type = "square";
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = "rgba(0, 245, 255, 0.3)";
        ctx.strokeStyle = "rgba(0, 245, 255, 0.3)";
        ctx.lineWidth = 1;

        if (this.type === "square") {
          ctx.fillRect(this.x, this.y, this.size, this.size);
        } else if (this.type === "plus") {
          ctx.beginPath();
          ctx.moveTo(this.x - 3, this.y);
          ctx.lineTo(this.x + 3, this.y);
          ctx.moveTo(this.x, this.y - 3);
          ctx.lineTo(this.x, this.y + 3);
          ctx.stroke();
        } else if (this.type === "cross") {
          ctx.beginPath();
          ctx.moveTo(this.x - 2, this.y - 2);
          ctx.lineTo(this.x + 2, this.y + 2);
          ctx.moveTo(this.x + 2, this.y - 2);
          ctx.lineTo(this.x - 2, this.y + 2);
          ctx.stroke();
        }
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p, index) => {
        p.update();
        p.draw();

        // Mouse Interaction
        const dxMouse = mouseX - p.x;
        const dyMouse = mouseY - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distMouse < MOUSE_DISTANCE) {
           ctx.beginPath();
           ctx.strokeStyle = `rgba(59, 130, 246, ${1 - distMouse / MOUSE_DISTANCE})`;
           ctx.lineWidth = 1;
           ctx.moveTo(p.x, p.y);
           ctx.lineTo(mouseX, mouseY);
           ctx.stroke();
           
           if (distMouse < 60) {
              p.vx -= dxMouse * 0.0008;
              p.vy -= dyMouse * 0.0008;
           }
        }

        // Particle Connections
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DISTANCE) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 100, 255, ${0.1 * (1 - dist / CONNECT_DISTANCE)})`;
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
    <div className="fixed inset-0 -z-10 bg-[#020205]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#050514_0%,_#020205_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 transform perspective-500 rotate-x-12 scale-110 pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};

// --- 2. STATIC BRANDING TITLE (NO ANIMATION) ---
const MainTitle = () => {
  return (
    <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-8 leading-none select-none cursor-default flex flex-col sm:block items-center justify-center gap-2 sm:gap-4">
      {/* "Master" - Solid White */}
      <span className="inline-block relative sm:mr-4">
        <span className="relative z-10 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
          Master
        </span>
      </span>
      
      {/* "Algorithms" - Blue/Purple Gradient */}
      <span className="relative inline-block">
        <span className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur-xl" />
        <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          Algorithms
        </span>
      </span>
    </h1>
  );
};

const Spotlight = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  useEffect(() => {
    const handleMouseMove = ({ clientX, clientY }: MouseEvent) => {
      mouseX.set(clientX);
      mouseY.set(clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);
  const background = useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(59, 130, 246, 0.05), transparent 40%)`;
  return <motion.div className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300" style={{ background }} />;
};

const TypewriterText = ({ text, delay = 0 }: { text: string, delay?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 30); 
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [text, delay]);
  return (
    <span className="font-mono">
      {displayedText}
      <span className="animate-pulse text-[#00f5ff]">_</span>
    </span>
  );
};

const HologramCard = ({ algo, index }: { algo: Algorithm; index: number }) => {
  const floatDuration = useMemo(() => 4 + Math.random() * 4, []);
  const floatDelay = useMemo(() => Math.random() * 2, []);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 400, damping: 90 });
  const mouseY = useSpring(y, { stiffness: 400, damping: 90 });

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set((clientX - left) / width - 0.5);
    y.set((clientY - top) / height - 0.5);
  }
  function handleMouseLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="perspective-1000 will-change-transform"
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX: useTransform(mouseY, [-0.5, 0.5], [6, -6]), rotateY: useTransform(mouseX, [-0.5, 0.5], [-6, 6]), transformStyle: "preserve-3d" }}
        animate={{ y: [0, -8, 0] }}
        transition={{ y: { duration: floatDuration, repeat: Infinity, ease: "easeInOut", delay: floatDelay } }}
        className="h-full relative group"
      >
        <Link to={`/view/${algo.id}`} className="block h-full cursor-none">
          <div className="h-full relative bg-[#0a0a1a]/80 border border-white/5 backdrop-blur-[2px] rounded-xl overflow-hidden transition-all duration-300 group-hover:border-[#3b82f6]/40 group-hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/10 via-transparent to-[#8b5cf6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-[#3b82f6] shadow-[0_0_15px_#3b82f6] -translate-y-full group-hover:animate-scan-line z-20 opacity-60" />
            <div className="p-6 flex flex-col h-full relative z-10 transform-style-3d">
              <div className="flex justify-between items-start mb-4 translate-z-10">
                 <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#3b82f6]/10 border border-[#3b82f6]/20">
                    <Terminal className="h-3 w-3 text-[#3b82f6]" />
                    <span className="text-[10px] font-mono text-[#3b82f6] tracking-widest font-bold">{algo.id.slice(0,4).toUpperCase()}</span>
                 </div>
                 <ArrowRight className="h-4 w-4 text-[#3b82f6] -translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-100 group-hover:text-[#3b82f6] transition-colors font-mono tracking-tight mb-2 translate-z-20">{algo.title}</h3>
              <p className="text-xs text-gray-400 mb-6 line-clamp-2 leading-relaxed font-sans group-hover:text-gray-300 transition-colors translate-z-10">{algo.description}</p>
              <div className="mt-auto flex flex-wrap gap-2 translate-z-10">
                 <span className="px-2 py-1 text-[10px] font-mono border border-[#3b82f6]/20 text-[#3b82f6] bg-[#3b82f6]/5 rounded-sm">{algo.category}</span>
                 {algo.tags?.slice(0, 2).map((tag) => (<span key={tag} className="px-2 py-1 text-[10px] font-mono border border-white/10 text-gray-500 rounded-sm">#{tag}</span>))}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
};

const Index = () => {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visitCount, setVisitCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isGridExpanded, setIsGridExpanded] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  const INITIAL_GRID_COUNT = 9;
  const INITIAL_CATEGORY_COUNT = 8;

  useEffect(() => {
    const initializeData = async () => {
      try {
        // 1. Fetch Algorithms First
        const algos = await fetchAlgorithms();
        setAlgorithms(algos);

        // 2. VIEW COUNT LOGIC
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const sessionKey = "algolib_session_active";
        const hasVisitedSession = sessionStorage.getItem(sessionKey);

        // LOGIC: Only increment if NOT localhost AND NOT visited in this session
        if (!isLocalhost && !hasVisitedSession) {
           await incrementVisitCount();
           // Mark session as visited so subsequent navigations/refreshes don't count
           sessionStorage.setItem(sessionKey, "true");
        }

        // 3. Always fetch the latest count to display
        const count = await getVisitCount();
        setVisitCount(count);

      } catch (error) {
        console.error("Initialization failed", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  useEffect(() => { setIsGridExpanded(false); }, [selectedCategory, search]);

  const categories = useMemo(() => getCategories(algorithms), [algorithms]);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, INITIAL_CATEGORY_COUNT);
  const filtered = useMemo(() => {
    let result = algorithms;
    if (selectedCategory) result = result.filter((a) => a.category?.toLowerCase().trim() === selectedCategory.toLowerCase().trim());
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q) || a.tags?.some((t) => t.toLowerCase().includes(q)));
    }
    return result;
  }, [algorithms, search, selectedCategory]);

  const displayedAlgorithms = isGridExpanded ? filtered : filtered.slice(0, INITIAL_GRID_COUNT);
  const suggestions = filtered.slice(0, 5);

  return (
    <div className="min-h-screen overflow-x-hidden text-white font-sans relative selection:bg-[#3b82f6]/30 flex flex-col">
      <CyberSpaceBackground />
      <Spotlight />
      
      <div className="relative z-[200]">
        <Navbar />
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-36 pb-12 px-4 z-50">
        <div className="container mx-auto text-center max-w-5xl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: "easeOut" }}>
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-[#3b82f6]/20 bg-[#3b82f6]/5 mb-10 backdrop-blur-sm group"
            >
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3b82f6]"></span>
              </div>
              <span className="text-[11px] font-mono font-bold tracking-[0.3em] text-[#3b82f6] group-hover:text-white transition-colors">
                For & By Developers
              </span>
            </motion.div>

            <MainTitle />
            
            <div className="h-12 mb-12 flex justify-center items-center">
              <p className="text-sm sm:text-base text-gray-400 font-mono tracking-wide max-w-2xl mx-auto">
                 <span className="text-[#3b82f6] mr-2">{'>'}</span>
                 <TypewriterText 
                    text="Initiating neural handshake... accessing algorithmic archives... visualization engine ready." 
                    delay={0.5} 
                 />
              </p>
            </div>
            
            <div className="relative max-w-lg mx-auto mt-8 group z-[100]">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-xl blur opacity-20 group-focus-within:opacity-50 transition duration-500 group-hover:opacity-40" />
              <div className="relative flex items-center bg-[#050510] rounded-xl border border-white/10 group-focus-within:border-[#3b82f6]/50 px-5 py-4 shadow-2xl">
                 <Command className="h-5 w-5 text-gray-500 group-focus-within:text-[#3b82f6] mr-4" />
                 <input
                  type="text"
                  placeholder="SEARCH DATABASE..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-white placeholder:text-gray-600 focus:outline-none font-mono text-sm tracking-wider cursor-none"
                />
              </div>
              
              <AnimatePresence>
                {search.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }} 
                    className="absolute top-full left-0 right-0 mt-3 bg-[#0a0a1a]/95 backdrop-blur-xl border border-[#3b82f6]/20 rounded-xl overflow-hidden shadow-2xl z-[101]"
                  >
                    {suggestions.length > 0 ? suggestions.map((algo, i) => (
                      <Link key={algo.id} to={`/view/${algo.id}`}>
                         <div className="flex items-center justify-between px-5 py-3 hover:bg-[#3b82f6]/10 border-b border-white/5 last:border-0 group/item">
                            <div className="flex items-center gap-3">
                                <Cpu className="h-4 w-4 text-gray-500 group-hover/item:text-[#3b82f6]" />
                                <span className="text-sm font-mono text-gray-300 group-hover/item:text-white transition-colors">{algo.title}</span>
                            </div>
                            <ArrowRight className="h-3 w-3 text-[#3b82f6] opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all" />
                         </div>
                      </Link>
                    )) : (
                      <div className="px-5 py-4 text-xs font-mono text-gray-500">NO MATCHING PROTOCOLS FOUND</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FILTERS --- */}
      <section className="px-4 pb-8 relative z-20">
         <div className="container mx-auto max-w-6xl">
            <div className="flex flex-wrap justify-center gap-3">
                <button 
                  onClick={() => setSelectedCategory(null)} 
                  className={`relative px-5 py-2 rounded-lg text-[10px] font-mono tracking-widest transition-all overflow-hidden group cursor-none ${!selectedCategory ? "text-[#3b82f6] border border-[#3b82f6]" : "text-gray-500 border border-white/5 hover:border-white/20"}`}
                >
                  <div className={`absolute inset-0 bg-[#3b82f6]/10 transition-transform duration-300 ${!selectedCategory ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"}`} />
                  <span className="relative z-10">[ ALL_SYSTEMS ]</span>
                </button>
                
                {visibleCategories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)} className={`relative px-5 py-2 rounded-lg text-[10px] font-mono tracking-widest transition-all overflow-hidden group cursor-none ${selectedCategory === cat ? "text-[#8b5cf6] border border-[#8b5cf6]" : "text-gray-500 border border-white/5 hover:border-white/20"}`}>
                        <div className={`absolute inset-0 bg-[#8b5cf6]/10 transition-transform duration-300 ${selectedCategory === cat ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"}`} />
                        <span className="relative z-10">{cat.toUpperCase()}</span>
                    </button>
                ))}

                {categories.length > INITIAL_CATEGORY_COUNT && (
                    <button 
                        onClick={() => setShowAllCategories(!showAllCategories)} 
                        className="px-4 py-2 rounded-lg text-[10px] font-mono border border-dashed border-[#3b82f6]/30 text-[#3b82f6]/70 hover:bg-[#3b82f6]/5 hover:text-[#3b82f6] flex items-center gap-2 transition-all cursor-none"
                    >
                        {showAllCategories ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    </button>
                )}
            </div>
         </div>
      </section>

      {/* --- MAIN GRID --- */}
      <section className="px-4 pb-32 relative z-10 flex-grow">
        <div className="container mx-auto max-w-7xl">
          {loading ? (
             <div className="flex flex-col items-center justify-center pt-20">
                <div className="w-12 h-12 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_20px_#3b82f6]" />
                <div className="text-[#3b82f6] font-mono text-sm tracking-[0.2em] animate-pulse">DECRYPTING...</div>
             </div>
          ) : (
            <>
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {displayedAlgorithms.map((algo, index) => (
                     <HologramCard key={algo.id} algo={algo} index={index} />
                  ))}
                </AnimatePresence>
              </motion.div>

              {filtered.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                  <Hash className="h-10 w-10 text-gray-600 mx-auto mb-4" />
                  <div className="text-gray-400 font-mono text-sm">VOID DETECTED: NO DATA</div>
                </div>
              )}

              {filtered.length > displayedAlgorithms.length && (
                <div className="flex justify-center mt-24">
                  <button 
                    onClick={() => setIsGridExpanded(true)} 
                    className="group relative px-10 py-4 bg-[#3b82f6]/5 border border-[#3b82f6]/30 hover:border-[#3b82f6] transition-all duration-300 rounded-sm overflow-hidden cursor-none"
                  >
                    <div className="absolute inset-0 bg-[#3b82f6]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative flex items-center gap-3 text-xs font-mono font-bold text-[#3b82f6] tracking-[0.25em]">
                       INITIALIZE FULL DUMP <ChevronDown className="h-4 w-4 animate-bounce" />
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* --- REFINED CLASSY FOOTER --- */}
      <footer className="relative border-t border-white/10 bg-[#020205] pt-16 pb-8 overflow-hidden z-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent" />
        
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">
           {/* TOP SECTION: Logo & Text */}
           <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-[#3b82f6]" />
              <span className="text-lg font-bold tracking-tight text-white text-[24px]">
                  Algo<span className="text-[#3b82f6]">Lib</span>
              </span>
           </div>

           <p className="text-slate-400 text-[12px] font-mono mb-10 text-center max-w-xs leading-relaxed">
              System Version 2.0.4 // Stable Build <br/>
              Optimized for the next generation of engineers.
           </p>

           {/* BOTTOM SECTION: Split Left/Right with Divider Line */}
           <div className="w-full border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              
              {/* Left Side: Copyright */}
              <div className="text-green-400 text-[12px] font-sans tracking-wide order-2 md:order-1">
                 &copy; {new Date().getFullYear()} AlgoLib. ALL RIGHTS RESERVED.
              </div>

              {/* Right Side: Status */}
              <div className="flex items-center gap-6 text-[12px] font-mono order-1 md:order-2">
                 <div className="flex items-center gap-2 text-green-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#4ade80]" />
                    <span>SYSTEM ONLINE</span>
                 </div>
                 
                 <div className="w-px h-3 bg-white/20 hidden md:block" />
                 
                 <div className="flex items-center gap-2 text-[#FFEF00]/80">
                    <Eye className="h-4 w-4" />
                    <span>{visitCount.toLocaleString()} HITS</span>
                 </div>
              </div>
           </div>

        </div>
      </footer>
    </div>
  );
};

export default Index;