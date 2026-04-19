import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";

import Fuse from "fuse.js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlobalRibbon from "@/components/GlobalRibbon";
import { Search, ListFilter, Code, BookOpen, Users, CornerDownRight, Zap, TerminalSquare, Plus, Minus, Layers } from "lucide-react";
import { fetchAlgorithms, type Algorithm } from "@/lib/algorithms";

// --- INTERACTIVE ANTIGRAVITY PARTICLE CANVAS ---
const InteractiveParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particlesArray: Particle[] = [];
    
    // Virtual mouse to track coordinates globally
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
        this.size = Math.random() * 2 + 0.5; // Tiny dots
        this.speedX = (Math.random() - 0.5) * 0.5; // Slow natural drift
        this.speedY = (Math.random() - 0.5) * 0.5;
        
        // Deep blue/cyan aesthetic
        const colors = ['#1d4ed8', '#2563eb', '#3b82f6', '#00d2ff', '#00ff87'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        if (!canvas) return;
        
        // Apply natural drift
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off edges to keep them on screen
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

        // --- ANTIGRAVITY (MOUSE REPEL) MATH ---
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          const repelStrength = 4; // Adjust for harder/softer push
          
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
      // Dynamic density based on screen size
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

    // Track mouse on the entire window since canvas is pointer-events-none
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    handleResize(); // Init sizes
    animate();      // Start loop

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

const AlgorithmTiltCard = ({ algo, onClick, index }: { algo: Algorithm, onClick: () => void, index: number }) => {
  const boundingRef = useRef<HTMLDivElement>(null);
  
  // Mouse coordinates (0 to 1 mapping)
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Smooth springs for heavy, physical feeling
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Map mouse position to rotation (-12deg to +12deg for dramatic effect)
  const rotateX = useTransform(smoothY, [0, 1], [12, -12]);
  const rotateY = useTransform(smoothX, [0, 1], [-12, 12]);

  // Dynamic glare mapped to mouse position
  const glareX = useTransform(smoothX, [0, 1], [0, 100]);
  const glareY = useTransform(smoothY, [0, 1], [0, 100]);
  const backgroundGlare = useMotionTemplate`radial-gradient(circle 250px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.1), transparent 80%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!boundingRef.current) return;
    const rect = boundingRef.current.getBoundingClientRect();
    
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    // Reset to center on leave
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      layout // Handles grid reflow
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: "easeOut" }}
      style={{ perspective: "1200px" }} // The critical perspective wrapper
      className="w-full h-full"
    >
      <motion.div
        ref={boundingRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{ 
          rotateX, 
          rotateY, 
          transformStyle: "preserve-3d" // Allows children to pop out
        }}
        className="group relative flex flex-col justify-between h-full min-h-[240px] rounded-[1.25rem] border border-white/[0.05] bg-[#0c0e14]/80 backdrop-blur-md p-6 cursor-pointer shadow-[0_10px_30px_-15px_rgba(0,0,0,0.8)] transition-colors duration-300 hover:border-blue-500/30"
      >
        {/* Dynamic Glare Overlay */}
        <motion.div 
          className="absolute inset-0 rounded-[1.25rem] pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: backgroundGlare }}
        />

        {/* 3D Popping Content Wrapper */}
        <div 
          className="relative z-10 flex flex-col h-full gap-5 transition-transform duration-300 group-hover:translate-z-10"
          style={{ transform: "translateZ(40px)" }} // The magic parallax pop
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/50 border border-white/[0.08] shadow-inner transition-transform duration-300 group-hover:scale-110">
              <Layers className="w-5 h-5 text-blue-400 group-hover:text-cyan-300 transition-colors" strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase bg-blue-900/10 border border-blue-500/20 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              {algo.category}
            </span>
          </div>
          
          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-xl font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors">{algo.title}</h3>
            <p className="text-sm text-zinc-400 font-light leading-relaxed line-clamp-2">{algo.description}</p>
          </div>

          {algo.tags && algo.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {algo.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="text-[10px] px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.05] text-zinc-300 font-medium tracking-wide">
                  {tag}
                </span>
              ))}
              {algo.tags.length > 3 && (
                <span className="text-[10px] px-2 py-1 rounded-md bg-transparent border border-dashed border-white/[0.1] text-zinc-500 font-medium">
                  +{algo.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // Pagination limit to prevent browser freezing
  const [visibleCount, setVisibleCount] = useState(8);

  // State for expanding/collapsing the filter pills
  const [showAllFilters, setShowAllFilters] = useState(false);

  useEffect(() => {
    const loadAlgos = async () => {
      const data = await fetchAlgorithms();
      setAlgorithms(data);
    };
    loadAlgos();

    const savedQuery = sessionStorage.getItem("algoSearchQuery");
    if (savedQuery) {
      setSearchQuery(savedQuery);
      setDebouncedSearch(savedQuery);
    }
    const savedFilter = sessionStorage.getItem("algoFilter");
    if (savedFilter) setActiveFilter(savedFilter);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset visible card count when user searches or filters
  useEffect(() => {
    setVisibleCount(8);
  }, [debouncedSearch, activeFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    sessionStorage.setItem("algoSearchQuery", query);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    sessionStorage.setItem("algoFilter", filter);
  };

  // Expanded list of all tags/categories
  const filter_pills = [
    "All Systems", "SEARCHING", "SORTING", "ARRAYS", "GRAPH", "MATH", "STACK", "DEQUE", "LINKED LIST", "DP", "GREEDY", "STRING", "QUEUE", "BINARY TREE"
  ];

  // Logic to determine which pills to show
  const INITIAL_PILLS_COUNT = 6;
  const visible_pills = showAllFilters ? filter_pills : filter_pills.slice(0, INITIAL_PILLS_COUNT);

  const filteredAlgorithms = useMemo(() => {
    let results = algorithms;

    if (activeFilter !== "All" && activeFilter !== "All Systems") {
      const normalizedFilter = activeFilter.toLowerCase().replace(/\s+/g, "");
      results = results.filter((algo) => {
        const category = algo.category?.toLowerCase().replace(/\s+/g, "") || "";
        const tags = (algo.tags || []).map((t) => t.toLowerCase().replace(/\s+/g, ""));

        if (category === normalizedFilter) return true;
        if (category.includes(normalizedFilter)) return true;
        if (tags.some((tag) => tag === normalizedFilter || tag.includes(normalizedFilter))) return true;

        // Accept common synonyms
        if (normalizedFilter === "graph" && ["graph", "graphs", "graph theory"].includes(category)) return true;
        if (normalizedFilter === "dp" && category.includes("dynamic")) return true;
        if (normalizedFilter === "linkedlist" && category.includes("linked")) return true;
        if (normalizedFilter === "binarytree" && category.includes("tree")) return true;

        return false;
      });
    }

    if (debouncedSearch.trim()) {
      const fuse = new Fuse(results, {
        keys: ["title", "description", "category", "tags"],
        threshold: 0.35,
        distance: 100,
        minMatchCharLength: 2,
      });
      results = fuse.search(debouncedSearch).map((r) => r.item);
    }

    return results;
  }, [algorithms, debouncedSearch, activeFilter]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">

      {/* THE APEX BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-black overflow-hidden flex items-center justify-center">
        {/* Antigravity canvas added here */}
        <InteractiveParticleBackground />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_40%,transparent_100%)]" />
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vh] bg-[#00d2ff] rounded-[100%] blur-[150px] mix-blend-screen opacity-[0.12]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vh] bg-[#7000ff] rounded-[100%] blur-[150px] mix-blend-screen opacity-[0.12]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        <div className="fixed top-0 left-0 w-full z-[100]">
          <Navbar />
          <GlobalRibbon />
        </div>

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 pt-40 pb-24 md:px-10 lg:px-16">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-20 max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] mb-8 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-zinc-300" />
              <span className="text-[11px] font-mono font-medium tracking-widest text-zinc-300 uppercase">
                AlgoLib Ecosystem
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-[6.25rem] font-bold tracking-tighter mb-8 leading-[0.95]">
              Visualize. Execute. <span className="text-transparent bg-clip-text bg-gradient-to-b from-white/60 to-white/10">Collaborate.</span>
            </h1>

            <p className="text-zinc-400 font-light text-lg md:text-xl leading-relaxed">
              AlgoLib is your centralized workspace to discover, simulate, document, and discuss the world's algorithmic complexity. Master computer science fundamentals through the complete developmental matrix.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-16 flex justify-center"
          >
            <button 
              onClick={() => document.getElementById('registry')?.scrollIntoView({ behavior: 'smooth' })}
              className="group flex flex-col items-center gap-3 outline-none"
            >
              <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                View Algorithms
              </span>
              <div className="w-6 h-10 rounded-full border border-white/[0.3] flex justify-center p-1.5 bg-[#050505] group-hover:border-white/[0.25] transition-colors shadow-sm">
                <motion.div 
                  animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-1 h-2 rounded-full bg-zinc-300 group-hover:bg-white transition-colors" 
                />
              </div>
            </button>
          </motion.div>

          <motion.section 
            id="registry" 
            layout
            className="mt-10 pt-20 pb-24 relative px-6 md:px-12 overflow-hidden rounded-[3rem] border border-white/[0.05] bg-[#05070e]/80 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col"
          >
            {/* Inner Section Glare */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.12),transparent_70%)] -z-10 pointer-events-none mix-blend-screen" />

            <motion.div layout className="text-center mb-16 relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-5">Explore the Library</h2>
              <p className="text-zinc-400 font-light max-w-xl mx-auto text-sm md:text-base">100+ implementations with Complexity Telemetry and real-time visualization.</p>
            </motion.div>

            {/* SEARCH & FILTER */}
            <motion.div layout className="mb-16 relative z-20 space-y-8">
              <div className="relative max-w-xl mx-auto flex items-center bg-[#0a0c12] border border-white/[0.08] rounded-full px-6 py-4 shadow-2xl transition-all hover:border-white/[0.2] focus-within:border-blue-500/60 focus-within:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <Search className="text-blue-400 mr-4" size={20} />
                <input
                  type="text"
                  placeholder="Query by algorithm name (e.g. Quick Sort)..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full bg-transparent text-base focus:outline-none text-white placeholder:text-zinc-600 font-mono"
                />
              </div>

              {/* Collapsible Filter Pills */}
              <motion.div layout className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
                <AnimatePresence>
                  {visible_pills.map(pill => (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key={pill}
                      onClick={() => handleFilterChange(pill)}
                      className={`px-5 py-2 rounded-full border text-xs font-semibold tracking-wide transition-all duration-300 ${
                        activeFilter === pill 
                        ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                        : 'border-white/[0.06] text-zinc-400 hover:border-white/[0.2] hover:text-white bg-[#0a0c12]'
                      }`}
                    >
                      {pill}
                    </motion.button>
                  ))}
                </AnimatePresence>

                {filter_pills.length > INITIAL_PILLS_COUNT && (
                  <motion.button
                    layout
                    onClick={() => setShowAllFilters(!showAllFilters)}
                    className="px-5 py-2 rounded-full border border-dashed border-white/[0.15] text-xs font-semibold tracking-wide text-zinc-400 hover:text-white hover:border-white/[0.4] hover:bg-white/[0.05] transition-all flex items-center gap-2"
                  >
                    {showAllFilters ? (
                      <>Collapse <Minus size={14} /></>
                    ) : (
                      <>+{filter_pills.length - INITIAL_PILLS_COUNT} More <Plus size={14} /></>
                    )}
                  </motion.button>
                )}
              </motion.div>
            </motion.div>

            {/* 3D ALGO GRID */}
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full relative z-20">
              <AnimatePresence>
                {filteredAlgorithms.length > 0 ? (
                  filteredAlgorithms.slice(0, visibleCount).map((algo, index) => (
                    <AlgorithmTiltCard 
                      key={algo.id} 
                      algo={algo} 
                      index={index}
                      onClick={() => navigate(`/view/${algo.id}`)} 
                    />
                  ))
                ) : (
                  <motion.div
                    layout
                    key="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-20 text-center"
                  >
                    <h3 className="text-xl text-zinc-300 mb-2 font-medium">No algorithms found</h3>
                    <p className="text-zinc-500">Try adjusting your filters or search query.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            {/* Load More Button */}
            <AnimatePresence>
              {filteredAlgorithms.length > visibleCount && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-20 flex justify-center w-full relative z-20"
                >
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 8)}
                    className="group relative px-8 py-4 rounded-full border border-white/[0.1] bg-[#0a0c12] text-zinc-200 text-sm font-semibold tracking-wide transition-all duration-300 hover:bg-white hover:text-black shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Load More Matrix <Zap className="w-4 h-4 text-blue-500 group-hover:text-black transition-colors" />
                    </span>
                    {/* Hover light sweep effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.section>

        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Index;