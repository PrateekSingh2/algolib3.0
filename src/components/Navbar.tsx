import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { firestoreDB, logout } from "../lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Home,
  Terminal,
  Cpu,
  BookOpen,
  MessageCircle,
  LogOut,
  Menu,
  X,
  Bell,
  CheckCircle2,
  UserCircle2,
  UserPen,
  ChevronDown,
  Zap,
  Activity,
  Sparkles,
  Sun,
  Moon,
  Code2,
  BarChart3
} from "lucide-react";

const timeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

interface NotifPost {
  id: string;
  title: string;
  authorName: string;
  createdAt: number;
  isUnread: boolean;
}

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotifPost[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTime, setLastReadTime] = useState<number>(
    parseInt(localStorage.getItem("algoLib_lastRead") || Date.now().toString()),
  );

  const desktopNotifRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileProfileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotifOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const outsideDesktopNotif = desktopNotifRef.current && !desktopNotifRef.current.contains(target);
      const outsideMobileNotif = mobileNotifRef.current && !mobileNotifRef.current.contains(target);
      const outsideProfile = profileMenuRef.current && !profileMenuRef.current.contains(target);
      const outsideMobileProfile = mobileProfileMenuRef.current && !mobileProfileMenuRef.current.contains(target);

      if (outsideDesktopNotif && outsideMobileNotif) setIsNotifOpen(false);
      if (outsideProfile && outsideMobileProfile) setIsProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // --- DATA PROTECTION ---
    // Do not fetch notifications if the user is not fully onboarded or not logged in
    if (!user || profile?.is_profile_complete === false) return;

    const q = query(collection(firestoreDB, "community_posts"), orderBy("createdAt", "desc"), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      const fetched: NotifPost[] = [];

      snapshot.forEach((item) => {
        const post = item.data();
        if (post.createdAt) {
          const time = post.createdAt.toMillis();
          const isUnread = time > lastReadTime && post.authorId !== user?.uid;
          if (isUnread) count += 1;
          fetched.push({
            id: item.id,
            title: post.title,
            authorName: post.authorName,
            createdAt: time,
            isUnread,
          });
        }
      });

      setNotifications(fetched);
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [lastReadTime, user, profile?.is_profile_complete]); // Added dependency

  const handleToggleNotif = () => {
    setIsNotifOpen((prev) => !prev);
    setIsProfileMenuOpen(false); 
    if (!isNotifOpen && unreadCount > 0) {
      const now = Date.now();
      setLastReadTime(now);
      localStorage.setItem("algoLib_lastRead", now.toString());
      setUnreadCount(0);
    }
  };

  const handleToggleProfile = () => {
    setIsProfileMenuOpen((prev) => !prev);
    setIsNotifOpen(false); 
  };

  const handleNotifItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setIsNotifOpen(false);
    setIsMobileMenuOpen(false);

    if (location.pathname === "/discussion") {
      window.history.replaceState(null, "", `/discussion#${id}`);
      const element = document.getElementById(id);
      if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
      return;
    }
    navigate(`/discussion#${id}`);
  };

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Visualizer", path: "/visualizer", icon: Cpu },
    { name: "Contests", path: "/contests", icon: Terminal },
    { name: "Compiler", path: "/compiler", icon: Code2 },
    { name: "Analyse TC", path: "/analyzer", icon: BarChart3 },
    { name: "Community", path: "/discussion", icon: MessageCircle },
    { name: "Notes", path: "/notes", icon: BookOpen },
  ];

  const avatarSrc = user?.photoURL || "https://placehold.co/96x96/111/fff?text=U";
  const avatarName = profile?.display_name || user?.displayName || "Engineer";

  const ProfileMenu = ({ mobile = false }: { mobile?: boolean }) => (
    <AnimatePresence>
      {isProfileMenuOpen && user && (
        <motion.div
          initial={{ opacity: 1, y: 10, scale: 0.98, filter: "blur(90px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 1, y: 10, scale: 0.98, filter: "blur(90px)" }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute ${mobile ? "right-0 top-14" : "right-0 top-[calc(100%+16px)]"} w-64 rounded-2xl border border-white/[0.2] bg-[#09090b]/95 backdrop-blur-xl p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)] z-[420]`}
        >
          <div className="px-3 pt-3 pb-4 mb-1.5 border-b border-white/[0.06] flex items-center gap-3">
             <div className="relative shrink-0">
               <img src={avatarSrc} alt="avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" />
               <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#09090b] rounded-full"></div>
             </div>
             <div className="flex flex-col min-w-0">
               <div className="flex items-center gap-1.5">
                  <p className="text-sm text-zinc-100 font-semibold truncate tracking-tight">{avatarName}</p>
               </div>
               <p className="text-xs text-zinc-500 truncate mt-0.5 font-medium">{user.email}</p>
             </div>
          </div>
          
          <div className="flex flex-col gap-0.5">
            <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all group">
              <UserCircle2 size={16} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" /> View Profile
            </Link>
            
            <Link to="/edit-profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all group">
              <UserPen size={16} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" /> Edit Profile
            </Link>
            
            <button 
              onClick={(e) => { e.preventDefault(); toggleTheme(); }} 
              className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all group"
            >
              <span className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Sun size={16} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                ) : (
                  <Moon size={16} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                )}
                Theme
              </span>
              <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-widest">{theme}</span>
            </button>
            
            <div className="h-[1px] bg-white/[0.06] my-1.5 mx-2" />
            
            <button onClick={logout} className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all group">
              <span className="flex items-center gap-3"><LogOut size={16} className="text-zinc-500 group-hover:text-red-400/70 transition-colors" /> Log Out </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const NotificationPanel = ({ isMobile = false }: { isMobile?: boolean }) => (
    <AnimatePresence>
      {isNotifOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(4px)" }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute ${isMobile ? "-right-16 sm:right-0 top-14 w-[92vw] max-w-[380px]" : "right-0 top-[calc(100%+16px)] w-[400px]"} bg-[#09090b]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)] overflow-hidden z-[120] flex flex-col cursor-default`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-4 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.01]">
            <h3 className="text-zinc-100 font-semibold text-[15px] flex items-center gap-2 tracking-tight">
              <Activity size={16} className="text-blue-400" /> Activity Feed
            </h3>
            <button className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors tracking-wide">
              MARK ALL READ
            </button>
          </div>
          
          <div className="max-h-[420px] overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl border border-white/[0.05] flex items-center justify-center mb-4 bg-white/[0.02] shadow-inner">
                  <CheckCircle2 size={24} className="text-zinc-600" />
                </div>
                <p className="text-zinc-300 text-[15px] font-semibold tracking-tight">You're all caught up.</p>
                <p className="text-zinc-500 text-sm mt-1">No new activity in the system.</p>
              </div>
            ) : notifications.map((notif) => (
              <a key={notif.id} href={`/discussion#${notif.id}`} onClick={(e) => handleNotifItemClick(e, notif.id)} className={`group relative flex items-start gap-4 p-5 border-b border-white/[0.03] hover:bg-white/[0.04] transition-all ${notif.isUnread ? 'bg-blue-500/[0.02]' : ''}`}>
                {notif.isUnread && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                
                <div className={`mt-0.5 p-2 rounded-full border ${notif.isUnread ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-white/[0.03] border-white/[0.05] text-zinc-500 group-hover:text-zinc-300"} transition-colors`}>
                  <MessageCircle size={16} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-medium truncate leading-tight mb-1.5 ${notif.isUnread ? 'text-zinc-100' : 'text-zinc-300'}`}>
                    {notif.title}
                  </p>
                  <p className="text-[13px] text-zinc-500 truncate">
                    <span className="text-zinc-400 font-medium">{notif.authorName}</span> started a discussion
                  </p>
                </div>

                <div className="shrink-0 text-[11px] text-zinc-500 font-medium mt-1">{timeAgo(notif.createdAt)}</div>
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* DESKTOP NAVBAR */}
      <nav className="fixed top-6 inset-x-0 z-50 pointer-events-none hidden md:flex justify-center">
        <motion.div 
          initial={{ y: -50, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto flex items-center p-1.5 rounded-full bg-[#09090b]/80 backdrop-blur-xl border border-white/[0.2] shadow-[0_8px_32px_rgba(0,0,0,0.4)] bg-[#09090b]/95"
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
                      layoutId="desktop-active-nav" 
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
            <Link to="/developer" title="Developer" className="p-2.5 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors">&lt;/&gt;</Link>

            {/* --- VISUAL PROTECTION (DESKTOP) --- */}
            {user && profile?.is_profile_complete && (
              <div className="relative" ref={desktopNotifRef}>
                <button onClick={handleToggleNotif} title="Notifications" className={`p-2.5 rounded-full transition-colors relative ${isNotifOpen ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]'}`}>
                  <Bell className="w-[16px] h-[16px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 border border-[#09090b]"></span>
                    </span>
                  )}
                </button>
                <NotificationPanel />
              </div>
            )}

            {user ? (
              <div className="relative ml-1.5" ref={profileMenuRef}>
                <button onClick={handleToggleProfile} className={`flex items-center gap-1.5 rounded-full pl-1.5 pr-2.5 py-1.5 transition-all border ${isProfileMenuOpen ? 'bg-white/[0.08] border-white/[0.08]' : 'bg-transparent border-transparent hover:bg-white/[0.06]'}`}>
                  <img src={avatarSrc} alt="avatar" className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10" />
                  <ChevronDown size={14} className={isProfileMenuOpen ? 'text-zinc-300' : 'text-zinc-500'} />
                </button>
                <ProfileMenu />
              </div>
            ) : (
              <Link to="/auth" className="ml-2 px-4 py-1.5 rounded-full bg-white text-black text-[13px] font-bold tracking-wide hover:bg-zinc-200 transition-colors shadow-md">
                Sign In
              </Link>
            )}
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
            
            {/* --- VISUAL PROTECTION (MOBILE) --- */}
            {user && profile?.is_profile_complete && (
              <div className="relative" ref={mobileNotifRef}>
                <button onClick={handleToggleNotif} className={`p-2 rounded-xl transition-colors relative ${isNotifOpen ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'}`}>
                  <Bell size={18} />
                  {unreadCount > 0 && (
                     <span className="absolute top-2 right-2.5 flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 border border-[#09090b]"></span>
                     </span>
                  )}
                </button>
                <NotificationPanel isMobile={true} />
              </div>
            )}

            {user && (
              <div className="relative" ref={mobileProfileMenuRef}>
                <button onClick={handleToggleProfile} className={`flex items-center p-1 rounded-full border ml-1 transition-colors ${isProfileMenuOpen ? 'border-white/[0.2] bg-white/[0.05]' : 'border-white/[0.08] hover:border-white/[0.15]'}`}>
                  <img src={avatarSrc} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                </button>
                <ProfileMenu mobile />
              </div>
            )}

            <button onClick={() => setIsMobileMenuOpen((prev) => !prev)} className={`p-2 ml-1.5 rounded-xl transition-colors ${isMobileMenuOpen ? 'bg-white text-black' : 'text-zinc-300 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'}`}>
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
                <Link to="/developer" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3.5 rounded-[16px] flex items-center gap-4 group">
                  <div className="p-1.5 rounded-lg border border-transparent group-hover:bg-white/[0.04] group-hover:border-white/[0.05] text-zinc-500 group-hover:text-zinc-300 transition-all">
                    &lt;/&gt;
                  </div>
                  <span className="text-[15px] font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">Developer</span>
                </Link>
                {!user && (
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="mt-2 mx-2 mb-1 px-4 py-3.5 rounded-[14px] bg-white text-black flex justify-center items-center gap-2 text-[15px] font-bold active:scale-95 transition-transform">
                    <Sparkles size={18} /> Get Started
                  </Link>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Navbar;