import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, AlertTriangle, Radio } from "lucide-react";

const NotFound = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#000] text-white px-4">
      {/* Red/Crimson Anomaly Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#2a0a0a] via-[#000] to-[#000]" />
      
      {/* Glitch Noise Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ff0000_1px,transparent_1px)] bg-[size:4px_4px]" />

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
           <div className="flex items-center gap-2 text-[#ff0055] font-mono font-bold tracking-widest uppercase text-sm border border-[#ff0055]/30 px-4 py-2 bg-[#ff0055]/5">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              CRITICAL_PATH_FAILURE
           </div>
           
          <p className="text-gray-500 font-mono text-xs max-w-sm leading-relaxed">
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