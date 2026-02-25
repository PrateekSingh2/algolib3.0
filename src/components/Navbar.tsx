import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, logout } from "../lib/firebase";
import { 
  Home, 
  Terminal, 
  Cpu, 
  Users, 
  Zap,
  BookOpen, 
  MessageCircle,
  LogOut,
  Menu,
  X
} from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Visualizer", path: "/visualizer", icon: Cpu },
    { name: "Developer", path: "/developer", icon: Terminal },
    { name: "Contributors", path: "/contributors", icon: Users },
    { name: "Discussion", path: "/discussion", icon: MessageCircle },
  ];

  return (
    <nav className="fixed top-4 md:top-6 inset-x-4 md:inset-x-0 z-50 md:mx-auto md:w-max md:max-w-[95%]">
      
      {/* ========================================= */}
      {/* DESKTOP VIEW (Floating Pill)              */}
      {/* ========================================= */}
      <motion.div
        initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex items-center gap-2 p-1.5 rounded-full bg-[#03030c]/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/5"
      >
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 px-4 py-2 mr-2 rounded-full hover:bg-white/5 transition-colors group">
          <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5] rounded-full shadow-lg shadow-[#00d2ff]/20 group-hover:scale-110 transition-transform duration-300">
            <Zap className="w-5 h-5 text-white fill-white" />
            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-white tracking-tight text-sm">
              ALGO<span className="text-[#00d2ff]">LIB</span>
            </span>
            <span className="text-[9px] text-gray-500 font-mono tracking-widest mt-0.5">v2.0.4</span>
          </div>
        </Link>

        {/* NAVIGATION PILLS */}
        <ul className="flex items-center gap-1">
          {navLinks.map((tab) => {
            const isActive = location.pathname === tab.path;
            const isHovered = hoveredTab === tab.name;

            return (
              <li key={tab.name} onMouseEnter={() => setHoveredTab(tab.name)} onMouseLeave={() => setHoveredTab(null)} className="relative">
                <Link to={tab.path} className={`relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-full transition-colors duration-200 ${isActive ? "text-white" : "text-gray-400 hover:text-gray-200"}`}>
                  <tab.icon className={`w-[18px] h-[18px] transition-transform duration-300 ${isActive || isHovered ? 'scale-110' : ''} ${isActive ? 'text-[#00d2ff]' : ''}`} />
                  <span className={`text-xs font-medium ${isActive ? 'text-white' : ''}`}>{tab.name}</span>

                  {isActive && <motion.div layoutId="desktop-active" className="absolute inset-0 rounded-full bg-white/10 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-md z-[-1]" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                  {isHovered && !isActive && <motion.div layoutId="desktop-hover" className="absolute inset-0 rounded-full bg-white/5 z-[-1]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="w-[1px] h-6 bg-white/10 mx-1" />

        {/* ACTIONS & PROFILE */}
        <div className="flex items-center gap-1 pr-1">
          <Link to="/docs" className="p-2.5 rounded-full text-gray-400 hover:text-[#00d2ff] hover:bg-[#00d2ff]/10 transition-all relative group" title="Documentation">
            <BookOpen className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d2ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00d2ff]"></span>
            </span>
          </Link>
          {user && (
            <>
              <div className="w-[1px] h-6 bg-white/10 mx-1" />
              <div className="flex items-center gap-2 pl-1 pr-2">
                <img src={user.photoURL || ""} alt="avatar" className="w-8 h-8 rounded-full border border-white/20 object-cover" title={user.displayName || "User"} />
                <button onClick={logout} className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Secure Logout">
                  <LogOut className="w-[18px] h-[18px]" />
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* ========================================= */}
      {/* MOBILE VIEW (Hamburger Overlay)           */}
      {/* ========================================= */}
      <div className="md:hidden relative w-full">
        {/* Mobile Header Bar */}
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between p-3 rounded-2xl bg-[#03030c]/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <Link to="/" className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5] rounded-full flex items-center justify-center shadow-lg shadow-[#00d2ff]/20">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-white tracking-tight text-base">ALGO<span className="text-[#00d2ff]">LIB</span></span>
          </Link>
          <div className="flex items-center gap-3">
            {user && <img src={user.photoURL || ""} alt="avatar" className="w-8 h-8 rounded-full border border-white/20 object-cover" />}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors">
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </motion.div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[#03030c]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 origin-top"
            >
              {navLinks.map((tab) => {
                const isActive = location.pathname === tab.path;
                return (
                  <Link key={tab.name} to={tab.path} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors ${isActive ? 'bg-[#00d2ff]/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                    <tab.icon size={20} className={isActive ? 'text-[#00d2ff]' : ''} />
                    <span className="font-medium text-sm">{tab.name}</span>
                  </Link>
                );
              })}
              
              <div className="h-px bg-white/10 my-2 w-full" />
              
              <Link to="/docs" className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                <BookOpen size={20} /> <span className="font-medium text-sm">Documentation</span>
              </Link>
              
              {user && (
                <button onClick={logout} className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors w-full text-left">
                  <LogOut size={20} /> <span className="font-medium text-sm">Secure Logout</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </nav>
  );
};

export default Navbar;