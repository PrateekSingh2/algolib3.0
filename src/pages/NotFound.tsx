import { useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";

// --- MATRIX RAIN COMPONENT ---
const MatrixRain = () => {
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

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = [];

    // Initialize drops
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // Start at random heights above screen
    }

    const draw = () => {
      // Semi-transparent black background to create trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random Matrix Green characters
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        
        // Color logic: Primary Matrix Green with occasional white glint
        const isWhite = Math.random() > 0.975;
        ctx.fillStyle = isWhite ? "#FFF" : "#0F0"; 
        
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drop to top randomly after it clears screen
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" 
    />
  );
};

const NotFound = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#000] text-white px-4">
      
      {/* 0. Navbar (Fixed at top) */}
      <div className="absolute top-0 left-0 w-full z-50">
        <Navbar />
      </div>

      {/* 1. Matrix Rain Background */}
      <MatrixRain />
      
      {/* 2. Red Vignette (Keeps focus on center) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] opacity-80 pointer-events-none" />
      
      {/* 3. Glitch Noise Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ff0000_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 text-center max-w-lg mx-auto">
        
        <div className="relative inline-block mb-6">
           <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#ff0055] to-transparent tracking-tighter opacity-80">
            404
          </h1>
          <motion.div 
            animate={{ x: [-2, 2, -2], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 0.2, repeat: Infinity }}
            className="absolute top-0 left-0 text-9xl font-black text-[#00f5ff] opacity-30 mix-blend-screen overflow-hidden h-full"
            style={{ clipPath: 'inset(50% 0 0 0)' }}
          >
             404
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
           <div className="flex items-center gap-2 text-[#ff0055] font-mono font-bold tracking-widest uppercase text-sm border border-[#ff0055]/30 px-4 py-2 bg-[#ff0055]/5 backdrop-blur-md">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              CRITICAL_PATH_FAILURE
           </div>
           
          <p className="text-gray-300 font-mono text-xs max-w-sm leading-relaxed">
            Anomaly detected in sector {useLocation().pathname}. The requested coordinates do not exist in the known system map.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-10">
          <Link to="/" className="group relative inline-flex items-center gap-3 px-8 py-3 bg-transparent overflow-hidden">
            <div className="absolute inset-0 border border-white/20 group-hover:border-[#00f5ff] transition-colors" />
            <div className="absolute inset-0 bg-[#00f5ff]/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
            
            <Home className="w-4 h-4 text-gray-400 group-hover:text-[#00f5ff] relative z-10" />
            <span className="text-sm font-mono font-bold text-gray-400 group-hover:text-white relative z-10 tracking-wider">
               INITIATE_RETURN_SEQUENCE
            </span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;