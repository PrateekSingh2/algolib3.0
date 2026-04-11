import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { auth } from "../lib/firebase"; 
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useTheme } from "../contexts/ThemeContext";
import {
  Menu,
  X,
  Zap,
  Code2,
  Users,
  LifeBuoy,
  BookText,
  Sparkles,
  Sun,
  Moon,
  Cpu
} from "lucide-react";

const GuestNavbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const navLinks = [
    { name: "Visualizer", path: "/visualizer", icon: Cpu },
    { name: "Compiler", path: "/compiler", icon: Code2 },
    { name: "Docs", path: "/docs", icon: BookText },
    { name: "Developer", path: "/developer", icon: Users },
    { name: "Support", path: "/support", icon: LifeBuoy },
  ];

  return (
    <>
      {/* DESKTOP NAVBAR */}
      <nav className="fixed top-6 inset-x-0 z-50 pointer-events-none hidden md:flex justify-center">
        <motion.div 
          initial={{ y: -50, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto flex items-center p-1.5 rounded-full bg-[#09090b]/80 backdrop-blur-xl border border-white/[0.2] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <Link to="/" className="flex items-center gap-2 pl-4 pr-3 py-1.5 mr-2 rounded-full hover:bg-white/[0.06] transition-colors group">
            <Zap className="w-[18px] h-[18px] text-zinc-100 group-hover:text-blue-400 transition-colors" fill="currentColor" />
            <span className="font-extrabold text-white text-[15px] tracking-tight">ALGO<span className="text-zinc-500 font-semibold">LIB</span></span>
          </Link>

          <div className="flex items-center gap-1 relative">
            {navLinks.map((tab) => { 
              const isActive = location.pathname === tab.path; 
              const isHovered = hoveredTab === tab.name; 
              return (
                <div key={tab.name} onMouseEnter={() => setHoveredTab(tab.name)} onMouseLeave={() => setHoveredTab(null)} className="relative">
                  <Link to={tab.path} className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-200 ${isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
                    <tab.icon className={`w-[15px] h-[15px] transition-transform duration-300 ${isActive || isHovered ? 'scale-110' : ''} ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                    <span className="text-[13px] font-semibold tracking-wide">{tab.name}</span>
                  </Link>
                  {isActive && (
                    <motion.div 
                      layoutId="guest-desktop-active-nav" 
                      className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/[0.04] shadow-inner z-0" 
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} 
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-[1px] h-6 bg-white/[0.08] mx-3" />

          <div className="flex items-center gap-1 pr-1.5">
            {/* THEME TOGGLE ADDED HERE */}
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              className="flex items-center justify-center w-9 h-9 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button onClick={handleSignIn} className="ml-1 px-6 py-2 rounded-full bg-white text-black text-[13px] font-bold tracking-wide hover:bg-zinc-200 transition-colors shadow-md flex items-center gap-2">
              Sign In
            </button>
          </div>
        </motion.div>
      </nav>

      {/* MOBILE NAVBAR */}
      <div className="md:hidden fixed top-4 inset-x-4 z-50">
        <motion.div 
          initial={{ y: -50, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center justify-between p-2.5 rounded-[20px] bg-[#09090b]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 supports-[backdrop-filter]:bg-[#09090b]/60"
        >
          <Link to="/" className="flex items-center gap-2 px-2 group">
            <Zap className="w-4 h-4 text-zinc-100 group-hover:text-blue-400 transition-colors" fill="currentColor" />
            <span className="font-extrabold text-white text-[16px] tracking-tight">ALGO<span className="text-zinc-500 font-semibold">LIB</span></span>
          </Link>
          
          <div className="flex items-center gap-1">
            {/* THEME TOGGLE ADDED HERE FOR MOBILE */}
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              className="p-2 rounded-xl transition-colors text-zinc-300 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button onClick={() => setIsMobileMenuOpen((prev) => !prev)} className={`p-2 ml-1 rounded-xl transition-colors ${isMobileMenuOpen ? 'bg-white text-black' : 'text-zinc-300 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'}`}>
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#030303]/60 backdrop-blur-sm z-40"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.96 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -10, scale: 0.98 }} 
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-full left-0 right-0 mt-3 bg-[#09090b]/95 backdrop-blur-2xl border border-white/[0.08] rounded-[24px] p-2.5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col gap-1 z-50 origin-top"
              >
                {navLinks.map((tab) => { 
                  const isActive = location.pathname === tab.path; 
                  return (
                    <Link key={tab.name} to={tab.path} onClick={() => setIsMobileMenuOpen(false)} className="relative px-4 py-3.5 rounded-[16px] flex items-center gap-4 group overflow-hidden">
                      {isActive && <div className="absolute inset-0 bg-white/[0.06] border border-white/[0.04] rounded-[16px] z-0" />}
                      <div className={`relative z-10 p-1.5 rounded-lg border ${isActive ? 'bg-white/[0.08] border-white/[0.05] text-white' : 'bg-transparent border-transparent text-zinc-500 group-hover:text-zinc-300 group-hover:bg-white/[0.04] group-hover:border-white/[0.05]'} transition-all`}>
                        <tab.icon size={18} />
                      </div>
                      <span className={`relative z-10 text-[15px] font-semibold transition-colors ${isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{tab.name}</span>
                    </Link>
                  ); 
                })}
                
                <div className="h-[1px] bg-white/[0.06] my-2 mx-4" />
                
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignIn();
                  }} 
                  className="w-auto mt-2 mx-2 mb-1 px-4 py-3.5 rounded-[14px] bg-white text-black flex justify-center items-center gap-2 text-[15px] font-bold active:scale-95 transition-transform"
                >
                  <Sparkles size={18} /> Sign In
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default GuestNavbar;