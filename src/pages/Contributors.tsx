import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Linkedin, Network } from "lucide-react";
import Navbar from "@/components/Navbar";

// --- CYBERSPACE BACKGROUND (No Mouse Lines) ---
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
        ctx.fillStyle = "rgba(0, 255, 136, 0.2)"; // Green tint for contributors
        ctx.strokeStyle = "rgba(0, 255, 136, 0.2)";
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

        // Mouse Repel Physics (Optional - keeps particles moving but no lines)
        const dxMouse = mouseX - p.x;
        const dyMouse = mouseY - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distMouse < 80) {
           p.vx -= dxMouse * 0.0008;
           p.vy -= dyMouse * 0.0008;
        }

        // Particle Connections
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DISTANCE) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 255, 136, ${0.1 * (1 - dist / CONNECT_DISTANCE)})`;
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#0a1a0f_0%,_#020205_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 transform perspective-500 rotate-x-12 scale-110 pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
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
  const background = useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(0, 255, 136, 0.05), transparent 40%)`;
  return <motion.div className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300" style={{ background }} />;
};

const contributors = [
  {
    name: "Shiva Agarwal",
    role: "Tech stack suggestion, and UI feedback.",
    avatar: "https://ik.imagekit.io/g7e4hyclo/WhatsApp%20Image%202026-02-13%20at%204.09.05%20PM.jpeg",
    linkedin: "https://www.linkedin.com/in/shiva-agrawal-048ba2361?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  },
  {
    name: "Signal_Detected...",
    role: "Awaiting_Input",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
    linkedin: "#",
  },
];

const Contributors = () => {
  return (
    <div className="min-h-screen relative overflow-hidden text-white selection:bg-[#00ff88]/30">
      <CyberSpaceBackground />
      <Spotlight />
      <Navbar />

      <div className="pt-32 pb-16 px-4 relative z-40">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="text-4xl font-black mb-2 tracking-tighter flex items-center justify-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-[#0808CC] to-[#08CC3C] drop-shadow-[0_0_15px_rgba(0,255,136,0.3)]">
               <Network className="w-8 h-8 text-[#00ff88]" />
               Contributors Network
            </h1>
            <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
              Powered by <span className="text-[#00ff88]">AlgoLib</span> & Community Input
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contributors.map((person, i) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="group flex items-center gap-4 p-4 rounded-xl bg-[#0a0a1a]/40 border border-white/5 hover:border-[#00ff88]/40 hover:bg-[#00ff88]/5 transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_20px_-5px_rgba(0,255,136,0.2)]">
                  <div className="relative shrink-0">
                     <div className="absolute inset-0 bg-[#00ff88] rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity" />
                     <img
                       src={person.avatar}
                       alt={person.name}
                       className="w-12 h-12 rounded-full border border-white/10 relative z-10 bg-black object-cover"
                     />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate font-mono group-hover:text-[#00ff88] transition-colors">{person.name}</h3>
                    <p className="text-[10px] text-gray-500 tracking-wide">{person.role}</p>
                  </div>
                  <a href={person.linkedin} className="p-2 text-gray-600 hover:text-[#00ff88] transition-colors shrink-0">
                    <Linkedin className="h-4 w-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
             <motion.div 
               whileHover={{ scale: 1.02 }}
               className="inline-block p-8 rounded-2xl bg-[#0a0a1a]/40 border border-dashed border-[#00ff88]/20 backdrop-blur-sm"
             >
                <p className="text-sm text-gray-400 font-mono mb-2">Initialize connection?</p>
                <a href="https://mail.google.com/mail/u/0/?view=cm&fs=1&to=v.rajawatprateeksingh@gmail.com&su=Contribution%20into%20AlgoLib&body=Hello%20there,%20I%20saw%20your%20site..." target="_blank" className="text-[#00ff88] font-bold tracking-wide hover:text-[#00f5ff] transition-colors border-b border-[#00ff88]/30 hover:border-[#00f5ff] pb-1">
                   TRANSMIT_PACKET: contribute@algoverse
                </a>
             </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contributors;