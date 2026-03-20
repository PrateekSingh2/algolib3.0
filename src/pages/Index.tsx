import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlobalRibbon from "@/components/GlobalRibbon";
import { Search, ListFilter, Code, BookOpen, Users, CornerDownRight, Zap, TerminalSquare, Plus, Minus } from "lucide-react";
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

          {/* ALGORITHM REGISTRY SECTION */}
          <section id="registry" className="pt-32 pb-24 relative px-4 overflow-hidden rounded-[2.5rem] mt-24 border border-white/[0.03]">

            <div className="absolute inset-0 bg-[#030712] -z-10" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10 [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_60%,transparent_100%)]" />
            <div
              className="absolute inset-0 opacity-[0.02] pointer-events-none -z-10 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_40%,transparent_100%)]"
              style={{ backgroundImage: "repeating-linear-gradient(-45deg, #ffffff 0px, #ffffff 120px, transparent 120px, transparent 240px)" }}
            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.15),transparent_70%)] -z-10 pointer-events-none mix-blend-screen" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[700px] bg-[radial-gradient(ellipse_at_top,rgba(29,78,216,0.1),transparent_70%)] -z-10 pointer-events-none mix-blend-screen" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_100%_at_50%_0%,transparent_40%,#030712_100%)] -z-10 pointer-events-none" />

            <div className="text-center mb-16 relative z-10">
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4">Explore the Algorithm Library</h2>
              <p className="text-zinc-500 font-light max-w-xl mx-auto">Access 100+ implementations in Python, Java, and C++ with Text Explanations, Complexity Telemetry, and real-time visualization.</p>
            </div>
            {/* SEARCH & FILTER */}
            <div className="mb-16 relative z-20 space-y-6">
              <div className="relative max-w-xl mx-auto flex items-center bg-[#070707] border border-white/[0.06] rounded-full px-5 py-3.5 shadow-2xl transition-all hover:border-white/[0.12]">
                <Search className="text-zinc-600 mr-4" size={20} />
                <input
                  type="text"
                  placeholder="Query by algorithm name (e.g. Quick Sort)..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full bg-transparent text-sm focus:outline-none text-white placeholder:text-zinc-700 font-mono"
                />
              </div>

              {/* Collapsible Filter Pills */}
              <motion.div layout className="flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto">
                <AnimatePresence>
                  {visible_pills.map(pill => (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={pill}
                      onClick={() => handleFilterChange(pill)}
                      className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-all ${activeFilter === pill ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]' : 'border-white/[0.04] text-zinc-400 hover:border-white/[0.15] hover:text-white bg-white/[0.01]'}`}
                    >
                      {pill}
                    </motion.button>
                  ))}
                </AnimatePresence>

                {/* Show More / Hide Button */}
                {filter_pills.length > INITIAL_PILLS_COUNT && (
                  <motion.button
                    layout
                    onClick={() => setShowAllFilters(!showAllFilters)}
                    className="px-4 py-1.5 rounded-full border border-dashed border-white/[0.1] text-xs font-medium text-zinc-500 hover:text-white hover:border-white/[0.3] hover:bg-white/[0.02] transition-all flex items-center gap-1.5"
                  >
                    {showAllFilters ? (
                      <>Collapse <Minus size={12} /></>
                    ) : (
                      <>+{filter_pills.length - INITIAL_PILLS_COUNT} More <Plus size={12} /></>
                    )}
                  </motion.button>
                )}
              </motion.div>
            </div>

            {/* ALGO GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
              <AnimatePresence>
                {filteredAlgorithms.length > 0 ? (
                  filteredAlgorithms.slice(0, visibleCount).map((algo, index) => (
                    <motion.div
                      key={algo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="group relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-white/[0.03] bg-grey-400/10 p-7 transition-all hover:border-white/[0.1] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.02)] cursor-pointer"
                      onClick={() => navigate(`/view/${algo.id}`)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                      <div className="relative z-10 flex flex-col h-full gap-5">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <TerminalSquare className="w-5 h-5 text-zinc-400 group-hover:text-white" strokeWidth={1.5} />
                          </div>
                          <span className="text-[10px] font-mono font-medium tracking-widest text-zinc-500 uppercase bg-white/[0.02] border border-white/[0.04] px-2 py-1 rounded">{algo.category}</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <h3 className="text-xl font-medium tracking-tight text-zinc-200 group-hover:text-white transition-colors">{algo.title}</h3>
                          <p className="text-sm text-zinc-400 font-light leading-relaxed flex-1 line-clamp-2">{algo.description}</p>
                        </div>

                        {/* Tags */}
                        {algo.tags && algo.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {algo.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300/80 font-medium">
                                {tag}
                              </span>
                            ))}
                            {algo.tags.length > 3 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/10 border border-zinc-500/30 text-zinc-400/80 font-medium">
                                +{algo.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 py-20 text-center"
                  >
                    <h3 className="text-xl text-zinc-400 mb-2">No algorithms found.</h3>
                    <p className="text-zinc-600">Try another search query or category filter.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Load More Button */}
            {filteredAlgorithms.length > visibleCount && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-16 text-center"
              >
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="group relative px-8 py-3 rounded-full border border-white/[0.06] bg-[#121318] text-zinc-300 text-sm font-medium transition-all hover:bg-white hover:text-black hover:border-white shadow-xl"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Load More Algorithms <Zap className="w-4 h-4 text-zinc-500 group-hover:text-black transition-colors" />
                  </span>
                  <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                </button>
              </motion.div>
            )}

          </section>

        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Index;