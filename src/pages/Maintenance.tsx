import React, { useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { Terminal, ChevronRight, Lock, Fingerprint, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MaintenanceProps {
  availableModules?: { id: string; name: string }[];
}

export default function Maintenance({ availableModules = [] }: MaintenanceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // High-Performance SaaS Matrix Rain with Perfect Fade
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) drops[i] = Math.random() * -100; // Staggered start

    const draw = () => {
      // PERFECT FADE EFFECT:
      ctx.fillStyle = "rgba(9, 9, 11, 0.08)"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        
        // Randomize the green slightly for depth, keeping it bright for visibility
        ctx.fillStyle = Math.random() > 0.9 ? "#22e232" : "#0fd51f";
        
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drop to the top randomly to keep the rain irregular
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
        opacity: 1, 
        scale: 1, 
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 30, delayChildren: 0.1, staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#09090b] overflow-hidden flex flex-col items-center justify-center font-sans py-20 px-4 sm:px-6 select-none">
      
      {/* Code Rain Background Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-80 pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#09090b_90%)] z-0 pointer-events-none opacity-100"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-4xl bg-[#09090b]/50 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Subtle Edge Highlight */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#10b981]/50 to-transparent"></div>

        <div className="p-10 sm:p-12 flex flex-col items-center text-center flex-1 relative z-10">
          
          <motion.div variants={itemVariants} className="mb-6 relative group">
            <div className="absolute inset-0 bg-[#10b981]/20 blur-2xl rounded-full"></div>
            <div className="w-14 h-14 bg-[#09090b] border border-white/10 shadow-inner rounded-xl flex items-center justify-center relative z-10">
              <ShieldAlert size={24} className="text-[#10b981]" strokeWidth={1.5} />
            </div>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl font-semibold text-zinc-100 mb-3 tracking-tight">
            System Maintenance
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-zinc-400 text-sm leading-relaxed max-w-lg mx-auto mb-8 font-medium">
            This page is on scheduled maintenance to enhance our security and performance. During this time, access below available pages. We appreciate your patience and understanding as we work to improve your experience.
          </motion.p>
          
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2.5 bg-white/5 border border-white/5 px-4 py-2 rounded-full backdrop-blur-md">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
            </div>
            <span className="text-zinc-300 font-mono text-xs font-medium tracking-wide uppercase">
              Environment Locked
            </span>
          </motion.div>
        </div>

        {availableModules.length > 0 && (
            <motion.div variants={itemVariants} className="bg-black/20 border-t border-white/5 p-8 sm:px-12 sm:py-8 relative z-10">
              <div className="flex items-center justify-between mb-5">
                 <div className="flex items-center gap-2 text-zinc-400">
                     <Terminal size={14} />
                     <p className="text-xs font-medium uppercase tracking-wider">Active routes</p>
                 </div>
                 <span className="text-xs font-mono text-[#10b981] tracking-wider">SECURE</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {availableModules.map(mod => (
                    <Link 
                        key={mod.id} 
                        to={mod.id}
                        className="group flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/10 rounded-xl transition-all duration-200"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Fingerprint size={16} className="text-zinc-600 group-hover:text-[#10b981] transition-colors duration-200 flex-shrink-0" />
                            <span className="text-zinc-300 text-sm font-medium group-hover:text-white transition-colors duration-200 truncate">
                                {mod.name}
                            </span>
                        </div>
                        <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-all duration-200 group-hover:translate-x-0.5 flex-shrink-0 ml-2" />
                    </Link>
                ))}
              </div>
            </motion.div>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.8, duration: 1 }}
        className="relative z-10 mt-10 flex items-center gap-2 text-zinc-600 font-mono text-[11px] tracking-widest uppercase"
      >
        <Lock size={12} className="text-[#10b981]/70" />
        <span>End-to-End Encrypted</span>
      </motion.div>
    </div>
  );
}