import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  motion, 
  AnimatePresence, 
  useMotionTemplate, 
  useMotionValue
} from "framer-motion";
import { 
  ArrowRight, Eye, ChevronDown, Hash, 
  Command, Plus, Minus, Cpu, Sparkles 
} from "lucide-react";
import { 
  fetchAlgorithms, 
  getVisitCount, 
  incrementVisitCount, 
  getCategories, 
  type Algorithm 
} from "@/lib/algorithms";
import Navbar from "@/components/Navbar";
import { Preloader } from "@/components/Preloader";

// --- 1. CLEAN CYBER-NETWORK BACKGROUND ---
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

        const dxMouse = mouseX - p.x;
        const dyMouse = mouseY - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distMouse < 80) {
           p.vx -= dxMouse * 0.0005;
           p.vy -= dyMouse * 0.0005;
        }

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

// --- 2. MAIN TITLE ---
const MainTitle = () => {
  return (
    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1] select-none cursor-default flex flex-col items-center justify-center gap-1 sm:gap-3 text-center px-4">
      <span className="inline-block relative">
        <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
          Visualize Logic.
        </span>
      </span>

      <span className="relative inline-block">
        <span className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-600/20 via-orange-500/20 to-purple-600/20 blur-2xl" />
        <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-orange-400 drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">
          Execute Code.
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

// --- TRUE 3D "TRICKY LIONFISH" CARD ---
const HologramCard = ({ algo, index }: { algo: Algorithm; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      // PERSPECTIVE ROOT: Crucial for 3D depth mapping
      className="w-full max-w-[340px] mx-auto p-5 [perspective:1000px] group h-full"
    >
      {/* CRITICAL 3D PRESERVATION: 
        Link MUST have [transform-style:preserve-3d], otherwise it flattens the child space 
      */}
      <Link to={`/view/${algo.id}`} className="block h-full cursor-pointer [transform-style:preserve-3d]">
        
        {/* The Main Rotating Card Body */}
        <div className="algo-3d-card pt-[50px] border-[3px] border-[#04c1fa]/30 [transform-style:preserve-3d] shadow-[0_30px_30px_-10px_rgba(0,0,0,0.5)] rounded-[10px] w-full h-full relative flex flex-col">
          
          {/* Inner Content Box (Safe background color overlay, NO BACKDROP BLUR) */}
          <div className="bg-[#020617]/80 transition-all duration-500 pt-[60px] pb-[25px] px-[25px] [transform-style:preserve-3d] flex-grow flex flex-col rounded-b-[7px] border-t border-[#04c1fa]/20">
            
            {/* 3D TITLE */}
            <span className="inline-block text-white text-2xl font-black transition-transform duration-500 [transform:translateZ(50px)] hover:[transform:translateZ(60px)]">
              {algo.title}
            </span>
            
            {/* 3D DESCRIPTION */}
            <p className="mt-3 text-[12px] text-gray-200 transition-transform duration-500 [transform:translateZ(30px)] hover:[transform:translateZ(60px)] line-clamp-3">
              {algo.description}
            </p>
            
            {/* 3D TAGS ARRAY */}
            <div className="mt-4 pt-2 border-t border-white/10 flex gap-2 flex-wrap transition-transform duration-500 [transform:translateZ(30px)] hover:[transform:translateZ(60px)]">
                {algo.tags?.slice(0, 2).map(tag => (
                   <span key={tag} className="text-[10px] border border-white/20 bg-[#020617]/50 text-white px-2 py-1 rounded-sm">#{tag}</span>
                ))}
            </div>

          </div>

          {/* 3D FLOATING BADGE (Top Right) */}
          <div className="absolute top-[30px] right-[30px] h-[60px] w-[60px] bg-cyan-900 border border-[#04c1fa] p-[10px] flex flex-col items-center justify-center shadow-[0_17px_10px_-10px_rgba(0,0,0,0.5)] rounded-[10px] z-20 transition-transform duration-500 [transform:translateZ(80px)] hover:[transform:translateZ(100px)]">
            <span className="text-[#04c1fa] text-[9px] font-bold text-center block w-full truncate uppercase tracking-widest">
              {algo.category?.slice(0,4) || "SYS"}
            </span>
            <span className="text-[#04c1fa] text-[20px] font-black block leading-none">
              {algo.id.slice(0, 2).toUpperCase()}
            </span>
          </div>

        </div>
      </Link>
    </motion.div>
  );
};

const Index = () => {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visitCount, setVisitCount] = useState(0);
  
  // --- SESSION PRELOADER LOGIC ---
  const [isLoading, setIsLoading] = useState(() => {
    return !sessionStorage.getItem("algolib_preloader_shown");
  });
  
  const [isGridExpanded, setIsGridExpanded] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  const INITIAL_GRID_COUNT = 9;
  const INITIAL_CATEGORY_COUNT = 6;

  const handlePreloaderComplete = () => {
    setIsLoading(false);
    sessionStorage.setItem("algolib_preloader_shown", "true");
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        const algos = await fetchAlgorithms();
        setAlgorithms(algos);

        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const sessionKey = "algolib_session_active";
        const hasVisitedSession = sessionStorage.getItem(sessionKey);

        if (!isLocalhost && !hasVisitedSession) {
           await incrementVisitCount();
           sessionStorage.setItem(sessionKey, "true");
        }

        const count = await getVisitCount();
        setVisitCount(count);

      } catch (error) {
        console.error("Initialization failed", error);
      }
    };

    initializeData();
  }, []);

  useEffect(() => { setIsGridExpanded(false); }, [selectedCategory, search]);

  const scrollToGrid = () => {
    const gridSection = document.getElementById("algorithm-grid");
    if (gridSection) {
      gridSection.scrollIntoView({ behavior: "smooth" });
    }
  };

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
    <>
      {/* GLOBAL STYLES FOR THE 3D CYBERPUNK BACKGROUND 
         We manage background animation and rotation directly in CSS to ensure flawless 3D performance
      */}
      <style>{`
        .algo-3d-card {
          background: linear-gradient(135deg, #0000 18.75%, #0f172a 0 31.25%, #0000 0),
                      repeating-linear-gradient(45deg, #0f172a -6.25% 6.25%, #020617 0 18.75%);
          background-size: 60px 60px;
          background-position: 0 0, 0 0;
          background-color: #000000;
          transition: all 0.5s ease-in-out;
        }
        .group:hover .algo-3d-card {
          background-position: -100px 100px, -100px 100px;
          transform: rotate3d(0.5, 1, 0, 30deg);
        }
      `}</style>

      <AnimatePresence mode="wait">
        {isLoading ? (
            <Preloader key="loader" onComplete={handlePreloaderComplete} />
        ) : (
            <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen overflow-x-hidden text-white font-sans relative selection:bg-[#3b82f6]/30 flex flex-col"
            >
                <CyberSpaceBackground />
                <Spotlight />
                
                <div className="fixed top-0 left-0 w-full z-[200]">
                    <Navbar />
                </div>

                {/* --- HERO SECTION --- */}
                <section className="relative min-h-screen flex flex-col items-center justify-center px-4 z-50">
                    <div className="container mx-auto text-center max-w-5xl">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                        
                        <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-[#3b82f6]/50 bg-[#3b82f6]/5 mb-10 backdrop-blur-sm group"
                        >
                        <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ffa500]"></span>
                        </div>
                        <span className="text-[12px] font-regular tracking-[0.2em] text-[#ffafff] group-hover:text-yellow-300 transition-colors">
                            For & By Developers
                        </span>
                        </motion.div>

                        <MainTitle />
                        
                        <div className="h-12 mb-10 flex justify-center items-center">
                        <p className="text-sm sm:text-base text-yellow-700 font-mono tracking-wide max-w-2xl mx-auto">
                            <span className="text-[#3b82f6] mr-2">{'>'}</span>
                            <TypewriterText 
                                text="Loading algorithmic archives... visualization engine ready." 
                                delay={0.5} 
                            />
                        </p>
                        </div>
                        
                        {/* SEARCH BAR */}
                        <div className="relative max-w-2xl mx-auto mt-6 group z-[100]">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-2xl blur opacity-25 group-focus-within:opacity-75 transition duration-500 group-hover:opacity-50" />
                        <div className="relative flex items-center bg-[#050510]/80 backdrop-blur-xl rounded-2xl border border-white/10 px-6 py-5 shadow-2xl transition-all duration-300 group-focus-within:border-[#3b82f6]/50 group-focus-within:shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)]">
                            <Command className="h-6 w-6 text-green-700 group-focus-within:text-[#3b82f6] mr-5 transition-colors" />
                            <input
                            type="text"
                            placeholder="SEARCH DATABASE..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent text-white placeholder:text-green-700 focus:outline-none font-mono text-base tracking-wider"
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
                                {suggestions.length > 0 ? suggestions.map((algo) => (
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

                    {/* --- SCROLL INDICATOR --- */}
                    <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, y: [0, 10, 0] }}
                    transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
                    onClick={scrollToGrid}
                    className="absolute bottom-10 left-0 right-0 mx-auto w-max flex flex-col items-center gap-2 cursor-pointer group z-50"
                    >
                    <span className="text-[10px] font-mono text-gray-500 tracking-[0.3em] group-hover:text-[#3b82f6] transition-colors">SCROLL TO EXPLORE</span>
                    <div className="w-6 h-10 border border-white/20 rounded-full flex justify-center pt-2 group-hover:border-[#3b82f6]/50 transition-colors">
                        <motion.div 
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1 h-1 bg-white rounded-full group-hover:bg-[#3b82f6]" 
                        />
                    </div>
                    </motion.div>
                </section>

                {/* --- CONTENT SECTION --- */}
                <div id="algorithm-grid" className="relative z-10 bg-[#020205] pt-20">
                    <section className="px-4 pb-12 relative z-20">
                        <div className="container mx-auto max-w-6xl">
                            <div className="flex flex-wrap justify-center gap-3">
                                <button 
                                    onClick={() => setSelectedCategory(null)} 
                                    className={`relative px-5 py-2 rounded-lg text-[10px] font-mono tracking-widest transition-all overflow-hidden group cursor-none ${!selectedCategory ? "text-[#3b82f6] border border-[#3b82f6]" : "text-gray-400 border border-white/20 hover:border-white/20"}`}
                                >
                                    <div className={`absolute inset-0 bg-[#3b82f6]/10 transition-transform duration-300 ${!selectedCategory ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"}`} />
                                    <span className="relative z-10">[ ALL_SYSTEMS ]</span>
                                </button>
                                
                                {visibleCategories.map((cat) => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)} className={`relative px-5 py-2 rounded-lg text-[10px] font-mono tracking-widest transition-all overflow-hidden group cursor-none ${selectedCategory === cat ? "text-[#8b5cf6] border border-[#8b5cf6]" : "text-gray-400 border border-white/30 hover:border-white/40"}`}>
                                        <div className={`absolute inset-0 bg-[#8b5cf6]/10 transition-transform duration-300 ${selectedCategory === cat ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"}`} />
                                        <span className="relative z-10">{cat.toUpperCase()}</span>
                                    </button>
                                ))}

                                {categories.length > INITIAL_CATEGORY_COUNT && (
                                    <button 
                                        onClick={() => setShowAllCategories(!showAllCategories)} 
                                        className="px-4 py-2 rounded-lg text-[10px] font-mono border border-dashed border-[#3b82f6]/80 text-[#3b82f6]/100 hover:bg-[#3b82f6]/5 hover:text-[#ffa500] flex items-center gap-2 transition-all cursor-none"
                                    >
                                        {showAllCategories ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="px-4 pb-32 relative z-10 flex-grow">
                        <div className="container mx-auto max-w-7xl">
                        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
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
                        </div>
                    </section>

                    <footer className="relative border-t border-white/10 bg-[#020205] pt-16 pb-8 overflow-hidden z-20">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent" />
                        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="h-7 w-7 text-[#3b82f6]" />
                                <span className="text-lg font-bold tracking-tight text-white text-[24px]">
                                    Algo<span className="text-[#3b82f6]">Lib</span>
                                </span>
                            </div>

                            <p className="text-slate-300 text-[12px] font-mono mb-10 text-center max-w-xs leading-relaxed">
                                System Version 2.0.4 // Stable Build <br/>
                                Optimized for the next generation of engineers.
                            </p>

                            <div className="w-full border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-green-400 text-[12px] font-sans tracking-wide order-2 md:order-1">
                                &copy; {new Date().getFullYear()} AlgoLib | ALL RIGHTS RESERVED.
                                </div>
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
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Index;