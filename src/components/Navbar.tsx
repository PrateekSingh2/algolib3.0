import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { auth, logout, firestoreDB } from "../lib/firebase";
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
  X,
  Bell,
  Check
} from "lucide-react";

// --- Helper to format time like LeetCode (e.g., "19 hours ago") ---
const timeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
};

// --- Types ---
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
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Notification State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotifPost[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTime, setLastReadTime] = useState<number>(
    parseInt(localStorage.getItem("algoLib_lastRead") || Date.now().toString())
  );

  // FIX: Separate refs for Desktop and Mobile to prevent premature unmounting
  const desktopNotifRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);

  // Close mobile menu and notif panel on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotifOpen(false);
  }, [location.pathname]);

  // Click outside to close notifications (checks BOTH refs)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      const isOutsideDesktop = desktopNotifRef.current && !desktopNotifRef.current.contains(target);
      const isOutsideMobile = mobileNotifRef.current && !mobileNotifRef.current.contains(target);

      // Only close if the click was outside BOTH notification wrappers
      if (isOutsideDesktop && isOutsideMobile) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Listen for recent posts for notifications
  useEffect(() => {
    const q = query(collection(firestoreDB, "community_posts"), orderBy("createdAt", "desc"), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      const fetchedNotifs: NotifPost[] = [];

      snapshot.forEach((doc) => {
        const post = doc.data();
        if (post.createdAt) {
          const time = post.createdAt.toMillis();
          const isUnread = time > lastReadTime && post.authorId !== user?.uid;
          
          if (isUnread) count++;
          
          fetchedNotifs.push({
            id: doc.id,
            title: post.title,
            authorName: post.authorName,
            createdAt: time,
            isUnread: isUnread
          });
        }
      });
      
      setNotifications(fetchedNotifs);
      setUnreadCount(count);
    });
    return () => unsubscribe();
  }, [lastReadTime, user]);

  const handleToggleNotif = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && unreadCount > 0) {
      const now = Date.now();
      setLastReadTime(now);
      localStorage.setItem("algoLib_lastRead", now.toString());
      setUnreadCount(0);
    }
  };

  // Robust click handler for notifications
  const handleNotifItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    setIsNotifOpen(false);
    setIsMobileMenuOpen(false); 

    if (location.pathname === '/discussion') {
      window.history.replaceState(null, '', `/discussion#${id}`);
      const element = document.getElementById(id);
      
      if (element) {
        const yOffset = -100;
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        
        element.classList.add('ring-2', 'ring-[#00d2ff]', 'ring-offset-4', 'ring-offset-[#030308]', 'transition-all', 'duration-500', 'shadow-[0_0_30px_rgba(0,210,255,0.4)]');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-[#00d2ff]', 'ring-offset-4', 'ring-offset-[#030308]', 'shadow-[0_0_30px_rgba(0,210,255,0.4)]');
        }, 2500);
      }
    } else {
      navigate(`/discussion#${id}`);
    }
  };

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Visualizer", path: "/visualizer", icon: Cpu },
    { name: "Team", path: "/developer", icon: Terminal },
    { name: "Discussion", path: "/discussion", icon: MessageCircle },
  ];

  const NotificationPanel = ({ isMobile = false }: { isMobile?: boolean }) => (
    <AnimatePresence>
      {isNotifOpen && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`${
            isMobile 
              ? "fixed top-[75px] left-4 right-4 w-auto" 
              : "absolute right-0 top-full mt-4 w-[420px]"
          } bg-[#11121C] border border-[#2A2B3D] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-[100] flex flex-col cursor-default`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#0B0C15] p-3.5 border-b border-[#2A2B3D] flex justify-between items-center">
            <h3 className="text-white font-bold text-[15px] flex items-center gap-2">
              <Bell size={16} className="text-[#00d2ff]" /> Notifications
            </h3>
            <span className="text-xs text-slate-500 font-mono bg-[#1F2032] px-2 py-1 rounded-md">
              {notifications.length} recent
            </span>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto overflow-x-hidden flex flex-col scrollbar-thin scrollbar-thumb-[#2A2B3D] scrollbar-track-transparent">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <Check size={32} className="text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm font-medium">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <a 
                  key={notif.id} 
                  href={`/discussion#${notif.id}`} 
                  onClick={(e) => handleNotifItemClick(e, notif.id)}
                  className={`group flex items-center gap-4 px-4 py-3.5 border-b border-[#1F2032] hover:bg-[#18192A] transition-colors relative cursor-pointer ${notif.isUnread ? 'bg-[#00d2ff]/[0.03]' : ''}`}
                >
                  {notif.isUnread && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]" />
                  )}

                  <div className={`shrink-0 ${notif.isUnread ? 'text-[#00d2ff]' : 'text-slate-500 group-hover:text-slate-400'} transition-colors`}>
                    <MessageCircle size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-slate-100">{notif.authorName}</span> started a new discussion.
                    </p>
                    <p className={`text-sm mt-0.5 truncate ${notif.isUnread ? 'text-[#00d2ff]' : 'text-slate-400 group-hover:text-slate-300'} transition-colors`}>
                      {notif.title}
                    </p>
                  </div>

                  <div className="shrink-0 text-xs text-slate-500 font-mono text-right w-[75px]">
                    {timeAgo(notif.createdAt)}
                  </div>
                </a>
              ))
            )}
          </div>
          
          {/* Footer */}
          <div className="bg-[#0B0C15] p-3 text-center border-t border-[#2A2B3D]">
            <Link to="/discussion" onClick={() => setIsNotifOpen(false)} className="text-xs text-slate-400 hover:text-white transition-colors font-medium">
              View All Discussions
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <nav className="fixed top-4 md:top-6 inset-x-4 md:inset-x-0 z-50 md:mx-auto md:w-max md:max-w-[95%]">
      
      {/* ========================================= */}
      {/* DESKTOP VIEW */}
      {/* ========================================= */}
      <motion.div
        initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex items-center gap-2 p-1.5 rounded-full bg-[#03030c]/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/5"
      >
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

        <div className="flex items-center gap-1 pr-1">
          <Link to="/docs" className="p-2.5 rounded-full text-gray-400 hover:text-[#00d2ff] hover:bg-[#00d2ff]/10 transition-all relative group" title="Documentation">
            <BookOpen className="w-[18px] h-[18px]" />
          </Link>
          
          {/* USES desktopNotifRef */}
          <div className="relative" ref={desktopNotifRef}>
            <button 
              onClick={handleToggleNotif} 
              className={`p-2.5 rounded-full transition-all relative group ${isNotifOpen ? 'text-[#00d2ff] bg-[#00d2ff]/10' : 'text-gray-400 hover:text-[#00d2ff] hover:bg-[#00d2ff]/10'}`} 
              title="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff0080] text-[9px] text-white font-bold border-2 border-[#03030c] shadow-[0_0_8px_rgba(255,0,128,0.5)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationPanel />
          </div>

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
      {/* MOBILE VIEW */}
      {/* ========================================= */}
      <div className="md:hidden relative w-full">
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between p-3 rounded-2xl bg-[#03030c]/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <Link to="/" className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5] rounded-full flex items-center justify-center shadow-lg shadow-[#00d2ff]/20">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-white tracking-tight text-base">ALGO<span className="text-[#00d2ff]">LIB</span></span>
          </Link>
          
          <div className="flex items-center gap-3">
             {/* USES mobileNotifRef */}
             <div className="relative" ref={mobileNotifRef}>
              <button 
                onClick={handleToggleNotif} 
                className={`p-2 rounded-lg transition-colors relative ${isNotifOpen ? 'text-[#00d2ff] bg-[#00d2ff]/10' : 'text-gray-400 hover:text-white'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff0080] text-[10px] text-white font-bold border-2 border-[#03030c]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <NotificationPanel isMobile={true} />
            </div>

            {user && <img src={user.photoURL || ""} alt="avatar" className="w-8 h-8 rounded-full border border-white/20 object-cover" />}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors">
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[#03030c]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 origin-top z-40"
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