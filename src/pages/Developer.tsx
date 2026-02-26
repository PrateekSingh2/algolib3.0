'use client'
import React, { useEffect, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Github, Linkedin } from "lucide-react"; 
import Navbar from "@/components/Navbar";
import GlobalRibbon from "@/components/GlobalRibbon";

// --- CYBERSPACE BACKGROUND ---
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
           p.vx -= dxMouse * 0.0008;
           p.vy -= dyMouse * 0.0008;
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
  // Data for exactly 5 team members with specific links included
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
      role: 'Testing & UI Review Lead', 
      imageUrl: 'https://i.postimg.cc/W1rCvYnT/nazmul-hossain.jpg',
      github: '#',
      linkedin: 'https://www.linkedin.com/in/shiva-agrawal-048ba2361?utm_source=share_via&utm_content=profile&utm_medium=member_android'
    },
    { 
      name: 'Raushan Gupta', 
      role: 'Promotional Lead', 
      imageUrl: 'https://i.pinimg.com/736x/8c/6d/db/8c6ddb5fe6600fcc4b183cb2ee228eb7.jpg',
      github: '#',
      linkedin: '#'
    },
    { 
      name: 'Sarvagya Singhai', 
      role: 'Social Media Lead', 
      imageUrl: 'https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg',
      github: 'https://github.com/singhaisarvagya8-hue',
      linkedin: 'https://www.linkedin.com/in/sarvagya-singhai-5058a5381?utm_source=share_via&utm_content=profile&utm_medium=member_android'
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden text-white selection:bg-[#9d00ff]/30">
      
      {/* ANIMATED BACKGROUNDS */}
      <CyberSpaceBackground />
      <Spotlight />
      
      <Navbar />
      <GlobalRibbon />

      <div className="pt-28 md:pt-31 pb-24 px-4 relative z-40">
        <div className="container mx-auto max-w-7xl">
          
          {/* Header */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <div className="inline-block mb-4 px-3 py-1 rounded-full border border-[#00f5ff]/30 bg-[#00f5ff]/5 text-[#00f5ff] text-xs font-mono tracking-widest backdrop-blur-md">
               CREW_MANIFEST
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4 drop-shadow-[0_0_15px_rgba(0,245,255,0.3)]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">Our Exceptional Team</span>
            </h1>
            <p className="text-gray-400 font-light tracking-wide text-sm md:text-base max-w-xl mx-auto">
               Meet our outstanding team - a synergy of talent, creativity, and dedication, crafting success together with passion and innovation.
            </p>
          </motion.div>

          {/* Grid Container */}
          <div className="flex flex-col items-center gap-8 md:gap-10 max-w-6xl mx-auto">
            
            {/* Top Row - First 2 Cards */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-10 w-full">
              {teamMembers.slice(0, 2).map((member, i) => (
                <motion.div 
                  key={member.name}
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="relative w-full max-w-[280px] sm:max-w-[300px] overflow-hidden rounded-2xl p-[2px] group shadow-2xl hover:-translate-y-2 transition-transform duration-300"
                >
                    {/* --- SPINNING EDGE EFFECT --- */}
                    <div className="absolute -top-[50%] -bottom-[50%] -left-[50%] -right-[50%] m-auto h-[200%] w-[160px] animate-spin [animation-duration:5s] [animation-play-state:paused] group-hover:[animation-play-state:running] bg-[linear-gradient(90deg,transparent,#00f5ff,#00f5ff,#00f5ff,#00f5ff,transparent)] group-hover:bg-[linear-gradient(90deg,transparent,#9d00ff,#9d00ff,#9d00ff,#9d00ff,transparent)] transition-colors duration-500 z-0" />

                    {/* --- INNER CARD CONTENT --- */}
                    <div className="relative flex flex-col items-center text-center p-8 bg-[#0a0a1a] h-full w-full rounded-[calc(1rem-2px)] z-10">
                      
                      <div className="relative w-32 h-32 md:w-36 md:h-36 mb-5">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00f5ff] via-purple-500 to-[#9d00ff] rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-md"></div>
                        <img
                          className="relative w-full h-full rounded-full object-cover ring-2 ring-gray-800 group-hover:ring-[#00f5ff] transition-all duration-300"
                          src={member.imageUrl}
                          alt={`Portrait of ${member.name}`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://placehold.co/200x200/0a0a1a/00f5ff?text=${member.name.split(' ').map(n => n[0]).join('')}`;
                          }}
                        />
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00f5ff] transition-colors duration-300">
                        {member.name}
                      </h3>
                      <p className="text-xs font-medium text-gray-300 mb-6 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full tracking-wider uppercase">
                        {member.role}
                      </p>
                      
                      <div className="flex space-x-4 mt-auto">
                        <a href={member.github} target="_blank" rel="noreferrer" className="p-2.5 text-gray-400 hover:text-white bg-white/5 hover:bg-[#00f5ff]/20 hover:border-[#00f5ff]/50 border border-transparent rounded-full transition-all duration-300 hover:scale-110" aria-label={`${member.name}'s Github profile`}>
                          <Github size={20} />
                        </a>
                        <a href={member.linkedin} target="_blank" rel="noreferrer" className="p-2.5 text-gray-400 hover:text-white bg-white/5 hover:bg-blue-600/30 hover:border-blue-500/50 border border-transparent rounded-full transition-all duration-300 hover:scale-110" aria-label={`${member.name}'s LinkedIn profile`}>
                          <Linkedin size={20} />
                        </a>
                      </div>
                    </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom Row - Remaining 3 Cards */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-10 w-full">
              {teamMembers.slice(2).map((member, i) => (
                <motion.div 
                  key={member.name}
                  // We add 2 to the index 'i' so the animation delay continues sequentially after the first two
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: (i + 2) * 0.15, duration: 0.6 }}
                  className="relative w-full max-w-[280px] sm:max-w-[300px] overflow-hidden rounded-2xl p-[2px] group shadow-2xl hover:-translate-y-2 transition-transform duration-300"
                >
                    {/* --- SPINNING EDGE EFFECT --- */}
                    <div className="absolute -top-[50%] -bottom-[50%] -left-[50%] -right-[50%] m-auto h-[200%] w-[160px] animate-spin [animation-duration:5s] [animation-play-state:paused] group-hover:[animation-play-state:running] bg-[linear-gradient(90deg,transparent,#00f5ff,#00f5ff,#00f5ff,#00f5ff,transparent)] group-hover:bg-[linear-gradient(90deg,transparent,#9d00ff,#9d00ff,#9d00ff,#9d00ff,transparent)] transition-colors duration-500 z-0" />

                    {/* --- INNER CARD CONTENT --- */}
                    <div className="relative flex flex-col items-center text-center p-8 bg-[#0a0a1a] h-full w-full rounded-[calc(1rem-2px)] z-10">
                      
                      <div className="relative w-32 h-32 md:w-36 md:h-36 mb-5">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00f5ff] via-purple-500 to-[#9d00ff] rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-md"></div>
                        <img
                          className="relative w-full h-full rounded-full object-cover ring-2 ring-gray-800 group-hover:ring-[#00f5ff] transition-all duration-300"
                          src={member.imageUrl}
                          alt={`Portrait of ${member.name}`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://placehold.co/200x200/0a0a1a/00f5ff?text=${member.name.split(' ').map(n => n[0]).join('')}`;
                          }}
                        />
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00f5ff] transition-colors duration-300">
                        {member.name}
                      </h3>
                      <p className="text-xs font-medium text-gray-300 mb-6 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full tracking-wider uppercase">
                        {member.role}
                      </p>
                      
                      <div className="flex space-x-4 mt-auto">
                        <a href={member.github} target="_blank" rel="noreferrer" className="p-2.5 text-gray-400 hover:text-white bg-white/5 hover:bg-[#00f5ff]/20 hover:border-[#00f5ff]/50 border border-transparent rounded-full transition-all duration-300 hover:scale-110" aria-label={`${member.name}'s Github profile`}>
                          <Github size={20} />
                        </a>
                        <a href={member.linkedin} target="_blank" rel="noreferrer" className="p-2.5 text-gray-400 hover:text-white bg-white/5 hover:bg-blue-600/30 hover:border-blue-500/50 border border-transparent rounded-full transition-all duration-300 hover:scale-110" aria-label={`${member.name}'s LinkedIn profile`}>
                          <Linkedin size={20} />
                        </a>
                      </div>
                    </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Developer;