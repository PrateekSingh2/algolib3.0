import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  Terminal, 
  Cpu, 
  Users, 
  Zap,
  BookOpen, 
  Sparkles
} from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Visualizer", path: "/visualizer", icon: Cpu },
    { name: "Developer", path: "/developer", icon: Terminal },
    { name: "Network", path: "/contributors", icon: Users },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-6 inset-x-0 z-50 mx-auto w-max max-w-[95%]"
    >
      {/* MAIN CAPSULE 
        - Mobile: tighter padding
        - Desktop: spacious padding
      */}
      <div className="relative flex items-center gap-1 sm:gap-2 p-1.5 rounded-full bg-[#03030c]/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] ring-1 ring-white/5">
        
        {/* --- LOGO SECTION --- */}
        <Link 
          to="/" 
          className="flex items-center gap-2 px-3 sm:px-4 py-2 mr-1 sm:mr-2 rounded-full hover:bg-white/5 transition-colors group"
        >
          <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20 group-hover/logo:scale-110 transition-transform duration-300">
            <Zap className="w-5 h-5 text-white fill-white" />
            {/* Ping Animation */}
            <div className="absolute inset-0 bg-white rounded-lg animate-ping opacity-20" />
          </div>
          
          {/* Text hidden on mobile to save space, visible on tablet/desktop */}
          <div className="flex flex-col leading-none hidden sm:flex">
            <span className="font-bold text-white tracking-tight text-sm">
              ALGO<span className="text-blue-400">LIB</span>
            </span>
            <span className="text-[9px] text-gray-500 font-mono tracking-widest">
              v2.0.4
            </span>
          </div>
        </Link>

        {/* --- NAVIGATION PILLS --- */}
        <ul className="flex items-center gap-0.5 sm:gap-1">
          {navLinks.map((tab) => {
            const isActive = location.pathname === tab.path;
            const isHovered = hoveredTab === tab.name;

            return (
              <li 
                key={tab.name} 
                onMouseEnter={() => setHoveredTab(tab.name)}
                onMouseLeave={() => setHoveredTab(null)}
                className="relative"
              >
                <Link
                  to={tab.path}
                  className={`
                    relative z-10 block px-3 py-2 sm:px-4 sm:py-2.5 rounded-full transition-colors duration-200
                    flex items-center gap-2
                    ${isActive ? "text-white" : "text-gray-400 hover:text-gray-200"}
                  `}
                >
                  {/* Icon */}
                  <tab.icon className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-300 ${isActive || isHovered ? 'scale-110' : ''}`} />
                  
                  {/* Label (Hidden on mobile, visible on sm+) */}
                  <span className="text-xs font-medium hidden sm:block">
                    {tab.name}
                  </span>

                  {/* ACTIVE STATE: The "Lamp" Glow */}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-full bg-white/10 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm z-[-1]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* HOVER STATE: Subtle background hint */}
                  {isHovered && !isActive && (
                    <motion.div
                      layoutId="hover-pill"
                      className="absolute inset-0 rounded-full bg-white/5 z-[-1]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* --- DIVIDER (Hidden on mobile) --- */}
        <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block" />

        {/* --- ACTION BUTTONS --- */}
        <div className="flex items-center gap-1 pr-1 sm:pr-0 pl-1 sm:pl-0">
          <Link
            to="/docs"
            className="p-2 sm:p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all relative group"
            title="Documentation"
          >
            <BookOpen className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
            </span>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;