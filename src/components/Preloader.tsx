import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Cpu, Network, Sparkles, Check } from "lucide-react";

// --- RETRO GRID BACKGROUND ---
const RetroGrid = () => {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10 bg-[#020205] perspective-1000">
      <div className="absolute inset-0 [transform:rotateX(60deg)] overflow-hidden h-[200%] -top-[50%]">
        <motion.div
          animate={{ backgroundPosition: ["0px 0px", "0px 100px"] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#3b82f620_1px,transparent_1px),linear-gradient(to_bottom,#3b82f620_1px,transparent_1px)] bg-[size:50px_100px]"
          style={{
            boxShadow: "inset 0 0 100px #020205",
            maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
          }}
        />
      </div>
      <div className="absolute top-[20%] left-0 w-full h-[400px] bg-gradient-to-b from-[#3b82f6]/10 to-transparent blur-[80px]" />
    </div>
  );
};

// --- CYBER CORE SPINNER ---
const CyberCore = () => {
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      {/* Outer Rotating Ring (Dashed) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-dashed border-[#3b82f6]/30"
      />
      
      {/* Middle Ring (Reverse Spin) */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-4 rounded-full border-2 border-t-[#3b82f6] border-r-transparent border-b-[#8b5cf6] border-l-transparent opacity-80"
      />
      
      {/* Inner Pulsing Core */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-gradient-to-br from-[#3b82f6]/20 to-[#8b5cf6]/20 blur-md flex items-center justify-center border border-[#3b82f6]/50 shadow-[0_0_30px_rgba(59,130,246,0.4)]"
      >
        <Cpu className="w-10 h-10 text-white animate-pulse" />
      </motion.div>

      {/* Orbiting Particles */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-full h-full"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#00ff88] rounded-full shadow-[0_0_10px_#00ff88]" />
      </motion.div>
    </div>
  );
};

// --- BOOT SEQUENCE TEXT ---
const bootLines = [
  { text: "INITIALIZING KERNEL...", icon: <Terminal size={14} /> },
  { text: "LOADING ALGORITHMS...", icon: <Network size={14} /> },
  { text: "OPTIMIZING VISUALIZER...", icon: <Sparkles size={14} /> },
  { text: "ACCESS GRANTED.", icon: <Check size={14} />, highlight: true }
];

const BootSequence = () => {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (lineIndex < bootLines.length - 1) {
      const timeout = setTimeout(() => {
        setLineIndex((prev) => prev + 1);
      }, 800); // Speed of each line appearing
      return () => clearTimeout(timeout);
    }
  }, [lineIndex]);

  return (
    <div className="mt-8 font-mono text-xs w-64">
      {bootLines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: i <= lineIndex ? 1 : 0, x: i <= lineIndex ? 0 : -10 }}
          className={`flex items-center gap-3 mb-2 ${
            line.highlight ? "text-[#00ff88] font-bold" : "text-[#3b82f6]"
          } ${i === lineIndex && !line.highlight ? "animate-pulse" : ""}`}
        >
          <span>{line.icon}</span>
          <span>{line.text}</span>
          {i === lineIndex && i !== bootLines.length - 1 && (
            <span className="inline-block w-1.5 h-3 bg-[#3b82f6] ml-1 animate-pulse" />
          )}
        </motion.div>
      ))}
      
      {/* Progress Bar */}
      <div className="w-full h-1 bg-[#3b82f6]/20 mt-4 rounded-full overflow-hidden">
        <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 3.5, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-[#3b82f6] to-[#00ff88]"
        />
      </div>
    </div>
  );
};

// --- MAIN PRELOADER COMPONENT ---
export const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    // Total wait time matches the boot sequence (~3.5s)
    const timer = setTimeout(() => {
        setExit(true);
        setTimeout(onComplete, 800); // Allow exit animation to finish
    }, 3800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.1, 
            filter: "blur(20px)",
            transition: { duration: 0.8, ease: "easeInOut" } 
          }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#020205] text-white overflow-hidden"
        >
          {/* CRT Flicker Overlay */}
          <motion.div 
             animate={{ opacity: [0.03, 0.05, 0.03] }}
             transition={{ duration: 0.2, repeat: Infinity, repeatType: "reverse" }}
             className="absolute inset-0 bg-white pointer-events-none z-50 mix-blend-overlay"
          />

          <RetroGrid />

          <div className="relative z-10 flex flex-col items-center">
            <CyberCore />
            <BootSequence />
          </div>
          
          {/* Bottom Version Tag */}
          <div className="absolute bottom-10 font-mono text-[10px] text-gray-600 tracking-[0.2em]">
             ALGOLIB SYSTEM V2.0.4
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};