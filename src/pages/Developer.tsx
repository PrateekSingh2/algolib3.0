import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { Github, Linkedin } from "lucide-react";
import Navbar from "@/components/Navbar";

// --- CYBERSPACE BACKGROUND (Reused from Index) ---
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

    const PARTICLE_COUNT = width < 768 ? 40 : 80;
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

// --- SPOTLIGHT ---
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

const Developer = () => {
  const teamMembers = [
    {
      name: "Prateek Singh",
      role: "ARCHITECT",
      bio: "Core system architecture, Visualizer Engine, and Backend logic circuits.",
      avatar: "https://ik.imagekit.io/g7e4hyclo/photo.jpg",
      github: "https://github.com/prateeksingh2",
      linkedin: "https://www.linkedin.com/in/rajawatprateeksingh",
    },
    {
      name: "Shivansh Sahu",
      role: "INTERFACE_DESIGN",
      bio: "Holographic UI/UX, Motion Physics, and Mobile Responsiveness.",
      avatar: "https://ik.imagekit.io/g7e4hyclo/co-photo.jpg",
      github: "https://github.com/shivanshmax-Monster",
      linkedin: "https://www.linkedin.com/in/shivansh-sahu-523a5a391",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden text-white selection:bg-[#9d00ff]/30">
      
      {/* 1. ANIMATED BACKGROUNDS */}
      <CyberSpaceBackground />
      <Spotlight />
      
      <Navbar />

      <div className="pt-28 md:pt-36 pb-16 px-4 relative z-40">
        <div className="container mx-auto max-w-5xl">
          
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <div className="inline-block mb-4 px-3 py-1 rounded-full border border-[#00f5ff]/30 bg-[#00f5ff]/5 text-[#00f5ff] text-xs font-mono tracking-widest backdrop-blur-md">
               CREW_MANIFEST
            </div>
            
            <h1 className="text-3xl md:text-6xl font-black text-white tracking-tighter mb-4 drop-shadow-[0_0_15px_rgba(0,245,255,0.3)]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f5ff] to-[#9d00ff]">SYSTEM ARCHITECTS</span>
            </h1>
            <p className="text-gray-400 font-light tracking-wide text-xs md:text-sm uppercase max-w-md mx-auto">
               The minds currently operating the AlgoLib Core
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
            {teamMembers.map((member, i) => (
               <motion.div 
                 key={member.name}
                 initial={{ opacity: 0, y: 30 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 transition={{ delay: i * 0.2, duration: 0.6 }}
               >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                    className="relative group bg-[#0a0a1a]/40 border border-white/10 hover:border-[#9d00ff]/50 transition-all duration-500 rounded-2xl p-6 md:p-8 overflow-hidden backdrop-blur-md hover:shadow-[0_0_30px_-5px_rgba(157,0,255,0.3)]"
                  >
                     {/* Scanning Light Effect */}
                     <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#9d00ff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                     <div className="absolute inset-0 bg-gradient-to-br from-[#00f5ff]/5 via-transparent to-[#9d00ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                     <div className="flex flex-col items-center text-center relative z-10">
                        <div className="relative w-24 h-24 mb-6">
                           <div className="absolute inset-0 border border-dashed border-[#00f5ff]/30 rounded-full animate-[spin_10s_linear_infinite]" />
                           <div className="absolute inset-[-4px] border border-dotted border-[#9d00ff]/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                           <img 
                              src={member.avatar} 
                              alt={member.name} 
                              className="w-full h-full rounded-full object-cover border-2 border-white/10 relative z-10 grayscale group-hover:grayscale-0 transition-all duration-500" 
                           />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-[#00f5ff] transition-colors">{member.name}</h3>
                        <span className="text-[10px] font-mono text-[#00f5ff] mb-4 bg-[#00f5ff]/10 px-3 py-1 rounded border border-[#00f5ff]/20">
                           {member.role}
                        </span>
                        
                        <p className="text-sm text-gray-400 mb-6 font-light leading-relaxed">
                           {member.bio}
                        </p>

                        <div className="flex gap-4">
                           <a href={member.github} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#00f5ff] transition-colors border border-white/5 hover:border-[#00f5ff]/30">
                              <Github className="h-5 w-5" />
                           </a>
                           <a href={member.linkedin} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#00f5ff] transition-colors border border-white/5 hover:border-[#00f5ff]/30">
                              <Linkedin className="h-5 w-5" />
                           </a>
                        </div>
                     </div>
                  </motion.div>
               </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developer;