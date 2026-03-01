'use client'
import React, { useEffect, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Github, Linkedin, Sparkles, Terminal, Zap } from "lucide-react"; 
import Navbar from "@/components/Navbar";
import GlobalRibbon from "@/components/GlobalRibbon";

// --- ADVANCED CYBERSPACE BACKGROUND (Slightly Optimized) ---
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

    const PARTICLE_COUNT = width < 768 ? 40 : 80; // Slightly fewer for cleaner look
    const CONNECT_DISTANCE = 150;

    class Particle {
      x: number; y: number; vx: number; vy: number; size: number; type: "square" | "plus" | "cross";

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 1.5 + 0.5; // Slightly smaller particles
        const r = Math.random();
        if (r > 0.92) this.type = "plus";
        else if (r > 0.84) this.type = "cross";
        else this.type = "square";
      }

      update() {
        this.x += this.vx; this.y += this.vy;
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
          ctx.beginPath(); ctx.moveTo(this.x - 3, this.y); ctx.lineTo(this.x + 3, this.y);
          ctx.moveTo(this.x, this.y - 3); ctx.lineTo(this.x, this.y + 3); ctx.stroke();
        } else if (this.type === "cross") {
          ctx.beginPath(); ctx.moveTo(this.x - 2, this.y - 2); ctx.lineTo(this.x + 2, this.y + 2);
          ctx.moveTo(this.x + 2, this.y - 2); ctx.lineTo(this.x - 2, this.y + 2); ctx.stroke();
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

        if (distMouse < 100) {
           p.vx -= dxMouse * 0.001;
           p.vy -= dyMouse * 0.001;
        }

        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.sqrt((p.x - p2.x)**2 + (p.y - p2.y)**2);
          if (dist < CONNECT_DISTANCE) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 150, 255, ${0.1 * (1 - dist / CONNECT_DISTANCE)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    };

    animate();
    const handleResize = () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0b0b1e] via-[#020205] to-black" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};

// --- FLASHLIGHT SPOTLIGHT ---
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
  const background = useMotionTemplate`radial-gradient(500px circle at ${mouseX}px ${mouseY}px, rgba(0, 245, 255, 0.05), transparent 40%)`;
  return <motion.div className="pointer-events-none fixed inset-0 z-20 transition-opacity duration-300" style={{ background }} />;
};

// --- SLIM & ELEGANT GLASSMORPHISM CARD ---
const TeamMemberCard = ({ member, index }: { member: any; index: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30, scale: 0.95 }} 
    animate={{ opacity: 1, y: 0, scale: 1 }} 
    transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="relative w-full max-w-[260px] sm:max-w-[280px] rounded-[1.5rem] group z-30" // Reduced max-widths
  >
    {/* Subtle Floating Shadow */}
    <div className="absolute inset-0 bg-[#00f5ff]/10 blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-3xl" />
    
    {/* Very thin, clean border core */}
    <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-[1.5rem] opacity-50 group-hover:opacity-100 transition-opacity duration-500 z-0" />
    
    {/* Spinning Neon Highlight Line (Toned Down) */}
    <div className="absolute -inset-[1px] rounded-[1.5rem] overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[conic-gradient(from_0deg,transparent_80%,#00f5ff_100%)] opacity-0 group-hover:opacity-60 group-hover:animate-[spin_4s_linear_infinite] transition-opacity duration-500 origin-center" style={{ width: '200%', height: '200%', top: '-50%', left: '-50%' }} />
    </div>

    {/* MAIN FROSTED GLASS LAYER (Less opaque, cleaner blur) */}
    <div className="relative flex flex-col items-center text-center p-6 h-full w-full rounded-[calc(1.5rem-1px)] bg-white/[0.02] backdrop-blur-md border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_20px_rgba(0,0,0,0.5)] z-10 overflow-hidden transition-all duration-500 group-hover:bg-white/[0.04]">
      
      {/* Avatar Plate (Smaller, cleaner) */}
      <div className="relative w-24 h-24 md:w-28 md:h-28 mb-4 z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00f5ff] to-[#9d00ff] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
        
        <div className="absolute inset-0 rounded-full overflow-hidden bg-black/40 p-[2px] backdrop-blur-sm border border-white/10 shadow-inner">
          <motion.img
            className="w-full h-full rounded-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
            src={member.imageUrl}
            alt={member.name}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = `https://placehold.co/200x200/0a0a1a/00f5ff?text=${member.name.split(' ').map((n: string) => n[0]).join('')}`;
            }}
          />
        </div>
      </div>
      
      {/* Typography (Scaled down slightly) */}
      <h3 className="text-lg font-bold text-white mb-1.5 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#00f5ff] transition-all duration-300">
        {member.name}
      </h3>
      
      <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 bg-black/30 border border-white/5 rounded-full group-hover:border-[#00f5ff]/20 transition-colors">
        <Sparkles size={10} className="text-[#00f5ff] opacity-60 group-hover:opacity-100" />
        <span className="text-[9px] font-semibold text-gray-300 tracking-wider uppercase">
          {member.role}
        </span>
      </div>
      
      {/* Social Glass Pills (Slimmer) */}
      <div className="flex space-x-3 mt-auto z-20">
        <a href={member.github} target="_blank" rel="noreferrer" className="p-2.5 text-gray-400 hover:text-white bg-white/5 border border-white/5 hover:border-[#00f5ff]/40 hover:bg-[#00f5ff]/10 rounded-full transition-all duration-300 hover:-translate-y-1 shadow-sm" aria-label="Github profile">
          <Github size={16} />
        </a>
        <a href={member.linkedin} target="_blank" rel="noreferrer" className="p-2.5 text-gray-400 hover:text-white bg-white/5 border border-white/5 hover:border-[#9d00ff]/40 hover:bg-[#9d00ff]/10 rounded-full transition-all duration-300 hover:-translate-y-1 shadow-sm" aria-label="LinkedIn profile">
          <Linkedin size={16} />
        </a>
      </div>
    </div>
  </motion.div>
);

const Developer = () => {
  const teamMembers = [
    { 
      name: 'Prateek Singh', 
      role: 'Lead Developer', 
      imageUrl: 'https://ik.imagekit.io/g7e4hyclo/photo.jpg',
      github: 'https://github.com/prateeksingh2',
      linkedin: 'https://www.linkedin.com/in/rajawatprateeksingh'
    },
    { 
      name: 'Shivansh Sahu', 
      role: 'Co-Developer Lead', 
      imageUrl: 'https://ik.imagekit.io/g7e4hyclo/co-photo.jpg',
      github: 'https://github.com/shivanshmax-Monster',
      linkedin: 'https://www.linkedin.com/in/shivansh-sahu-523a5a391'
    },
    { 
      name: 'Shiva Agrawal', 
      role: 'UI & Testing Lead', 
      imageUrl: 'https://ik.imagekit.io/g7e4hyclo/WhatsApp%20Image%202026-02-13%20at%204.09.05%20PM.jpeg',
      github: 'https://github.com/shivaaggrawal',
      linkedin: 'https://www.linkedin.com/in/shiva-agrawal-048ba2361?utm_source=share_via&utm_content=profile&utm_medium=member_android'
    },
    { 
      name: 'Raushan Gupta', 
      role: 'Promotional Lead', 
      imageUrl: 'https://ik.imagekit.io/g7e4hyclo/WhatsApp%20Image%202026-02-26%20at%2010.28.02%20PM.jpeg',
      github: 'https://github.com/raushanrewa786-rgb',
      linkedin: 'https://www.linkedin.com/in/raushan-gupta-b154b0387?utm_source=share_via&utm_content=profile&utm_medium=member_android'
    },
    { 
      name: 'Sarvagya Singhai', 
      role: 'Social Media Lead', 
      imageUrl: 'https://ik.imagekit.io/g7e4hyclo/WhatsApp%20Image%202026-02-26%20at%2010.20.03%20PM.jpeg',
      github: 'https://github.com/singhaisarvagya8-hue',
      linkedin: 'https://www.linkedin.com/in/sarvagya-singhai-5058a5381?utm_source=share_via&utm_content=profile&utm_medium=member_android'
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden text-white selection:bg-[#00f5ff]/30">
      
      {/* AMBIENCE */}
      <CyberSpaceBackground />
      <Spotlight />
      
      <Navbar />
      <GlobalRibbon />

      <div className="pt-28 pb-24 px-4 relative z-40">
        <div className="container mx-auto max-w-7xl">
          
          {/* Header (Refined, smaller, with beautiful gradient) */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-2 mb-4 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
               <Zap className="w-3 h-3 text-[#00f5ff]"/>
               <span className="text-[10px] font-mono font-medium tracking-[0.15em] text-gray-300 uppercase">Architecture Crew</span>
            </div>
            
            {/* Elegant Gradient Heading */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-yellow-500 tracking-tight mb-4 drop-shadow-md">
              Meet the Visionaries
            </h1>
            
            <p className="text-gray-400 font-normal text-sm md:text-base max-w-xl mx-auto leading-relaxed">
               The elite synergy of engineering, testing, and creative talent powering the ultimate visualization matrix.
            </p>
          </motion.div>

          {/* Grid Container (Tighter Gaps) */}
          <div className="flex flex-col items-center gap-8 md:gap-10 max-w-5xl mx-auto">
            
            {/* Top Row - First 2 Cards */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 w-full">
              {teamMembers.slice(0, 2).map((member, i) => (
                <TeamMemberCard key={member.name} member={member} index={i} />
              ))}
            </div>

            {/* Bottom Row - Remaining 3 Cards */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 w-full">
              {teamMembers.slice(2).map((member, i) => (
                <TeamMemberCard key={member.name} member={member} index={i + 2} />
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Developer;