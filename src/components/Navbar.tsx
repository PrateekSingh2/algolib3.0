import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Users, Code2, Database, BookOpen, Cpu } from "lucide-react";

const Navbar = () => {
  const location = useLocation();

  const navLinks = [
    { name: "CORE", path: "/", icon: Home },
    { name: "VISUALIZER", path: "/visualizer", icon: Database },
    { name: "CREW", path: "/developer", icon: Code2 },
    { name: "NODES", path: "/contributors", icon: Users },
  ];

  return (
    <motion.div
      initial={{ y: -100, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
      className="fixed top-6 left-1/2 z-50 w-[95%] max-w-2xl"
    >
      {/* FLOATING CAPSULE CONTAINER 
        - Rounded-full for organic feel
        - Backdrop blur for glass effect
        - Glowing border 
      */}
      <div className="relative flex items-center justify-between px-2 py-2 rounded-full bg-[#0a0a1a]/80 border border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Scanning Line Animation (Inside Navbar) */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden rounded-full">
           <motion.div 
             animate={{ x: ["-100%", "200%"] }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
             className="absolute top-0 bottom-0 w-10 bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent skew-x-12"
           />
        </div>

        {/* --- LEFT: LOGO MARK --- */}
        <Link to="/" className="pl-4 pr-6 flex items-center gap-2 group relative z-10">
           <div className="relative">
              <Cpu className="w-5 h-5 text-[#00f5ff] group-hover:rotate-90 transition-transform duration-500" />
              <div className="absolute inset-0 bg-[#00f5ff] blur-md opacity-40 group-hover:opacity-80 transition-opacity" />
           </div>
           <span className="font-bold text-white tracking-tighter text-sm hidden sm:block">
              ALGO<span className="text-[#00f5ff]">LIB</span>
           </span>
        </Link>

        {/* --- CENTER: NAVIGATION LINKS --- */}
        <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5 relative z-10">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            
            return (
              <Link
                key={link.name}
                to={link.path}
                className="relative px-4 py-2 rounded-full transition-all duration-300 group"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-[#00f5ff]/20 rounded-full border border-[#00f5ff]/30 shadow-[0_0_10px_rgba(0,245,255,0.2)]"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-2">
                   <Icon className={`w-4 h-4 ${isActive ? 'text-[#00f5ff]' : 'text-gray-400 group-hover:text-white'} transition-colors`} />
                   <span className={`text-[10px] font-mono font-bold tracking-wider hidden sm:block ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`}>
                      {link.name}
                   </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* --- RIGHT: DOCS/REFERENCE BUTTON --- */}
        <Link 
           to="/docs" 
           className="ml-2 p-2 rounded-full hover:bg-white/10 transition-colors relative z-10 group mr-1"
           title="Documentation & Reference"
        >
           <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-[#00f5ff] transition-colors" />
        </Link>

      </div>
      
      {/* Decorative "Hanging" Wires/Lines */}
      <div className="absolute -z-10 top-1/2 -left-10 w-8 h-[1px] bg-gradient-to-r from-transparent to-[#00f5ff]/30 hidden md:block" />
      <div className="absolute -z-10 top-1/2 -right-10 w-8 h-[1px] bg-gradient-to-l from-transparent to-[#00f5ff]/30 hidden md:block" />

    </motion.div>
  );
};

export default Navbar;