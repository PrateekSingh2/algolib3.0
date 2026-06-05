import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { firestoreDB, logout } from "../lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { executeGoogleSignIn, executeGithubSignIn } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import {
  Home, Terminal, Cpu, BookOpen, MessageCircle, LogOut, Menu, X,
  Bell, CheckCircle2, UserCircle2, UserPen, ChevronDown, Zap, Activity,
  Sparkles, Sun, Moon, Code2, BarChart3, BrainCircuit, Network,
  TerminalSquare, BookText, Trophy, GraduationCap, Layers, Github, Globe, Newspaper,
  ClipboardList
} from "lucide-react";

// ─── Configuration ────────────────────────────────────────────────────────────
const DEVELOPER_EXTERNAL_URL = "/developer";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface NotifPost { id: string; title: string; authorName: string; createdAt: number; isUnread: boolean; }
interface NavSubItem { name: string; path: string; icon: React.ElementType; description?: string; }
interface NavGroup  { label: string; icon: React.ElementType; items: NavSubItem[]; }

// ─── Navigation Data ──────────────────────────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Tools",
    icon: Cpu,
    items: [
      { name: "Visualizer",      path: "/visualizer", icon: Network,         description: "Steps execution engine" },
      { name: "Compiler",        path: "/compiler",   icon: TerminalSquare,  description: "Multi-language code runner" },
      { name: "Vectoris",      path: "/vectoris",   icon: BarChart3,       description: "AlgoLib AI assistant" },
    ],
  },
  {
    label: "Learn",
    icon: GraduationCap,
    items: [
      { name: "Notes",       path: "/notes",      icon: BookText,        description: "Programming, OOPs & DSA notes" },
      { name: "DSA Sheets",  path: "/sheets",     icon: ClipboardList,  description: "Proper roadmap for DSA practice with questions" },
      { name: "Contests",    path: "/contests",   icon: Trophy,         description: "Live coding contests" },
      { name: "Quiz Panel",  path: "/quiz-panel", icon: BrainCircuit,   description: "Create or Join quizzes" },
    ],
  },
];

const NAV_LINKS = [
  { name: "Home", path: "/", icon: Home, isExternal: false },
  { name: "Community", path: "/discussion", icon: MessageCircle, isExternal: false },
  { name: "News/Research", path: "https://discover-algolib.netlify.app/discover", icon: Newspaper, isExternal: true },
];

// ─── Component ────────────────────────────────────────────────────────────────
const Navbar = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [openGroup,        setOpenGroup]        = useState<string | null>(null);
  const [isMobileOpen,     setIsMobileOpen]     = useState(false);
  const [isProfileOpen,    setIsProfileOpen]    = useState(false);
  const [isNotifOpen,      setIsNotifOpen]      = useState(false);
  const [isAuthModalOpen,  setIsAuthModalOpen]  = useState(false);
  const [notifications,    setNotifications]    = useState<NotifPost[]>([]);
  const [unreadCount,      setUnreadCount]      = useState(0);
  const [lastReadTime,     setLastReadTime]     = useState<number>(
    parseInt(localStorage.getItem("algoLib_lastRead") || Date.now().toString())
  );

  const navRef         = useRef<HTMLDivElement>(null);
  const profileRef     = useRef<HTMLDivElement>(null);
  const mProfileRef    = useRef<HTMLDivElement>(null);
  const notifDeskRef   = useRef<HTMLDivElement>(null);
  const notifMobRef    = useRef<HTMLDivElement>(null);

  // Close everything on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setOpenGroup(null);
    setIsNotifOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Click-outside handler
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (navRef.current && !navRef.current.contains(t)) setOpenGroup(null);
      if (profileRef.current  && !profileRef.current.contains(t)  &&
          mProfileRef.current  && !mProfileRef.current.contains(t))  setIsProfileOpen(false);
      if (notifDeskRef.current && !notifDeskRef.current.contains(t) &&
          notifMobRef.current  && !notifMobRef.current.contains(t))  setIsNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Notification feed
  useEffect(() => {
    if (!user || !profile?.is_profile_complete) return;
    const q = query(collection(firestoreDB, "community_posts"), orderBy("createdAt", "desc"), limit(15));
    return onSnapshot(q, (snap) => {
      let count = 0;
      const list: NotifPost[] = [];
      snap.forEach((d) => {
        const p = d.data();
        if (!p.createdAt) return;
        const t = p.createdAt.toMillis();
        const isUnread = t > lastReadTime && p.authorId !== user?.uid;
        if (isUnread) count++;
        list.push({ id: d.id, title: p.title, authorName: p.authorName, createdAt: t, isUnread });
      });
      setNotifications(list);
      setUnreadCount(count);
    });
  }, [lastReadTime, user, profile?.is_profile_complete]);

  const handleNotifOpen = () => {
    setIsNotifOpen(p => !p);
    setIsProfileOpen(false);
    if (!isNotifOpen && unreadCount > 0) {
      const now = Date.now();
      setLastReadTime(now);
      localStorage.setItem("algoLib_lastRead", now.toString());
      setUnreadCount(0);
    }
  };

  const handleNotifClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setIsNotifOpen(false);
    setIsMobileOpen(false);
    
    if (location.pathname === "/discussion") {
      const el = document.getElementById(id);
      if (el) {
        const yOffset = -100; 
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        
        el.classList.add("notif-highlight");
        setTimeout(() => el.classList.remove("notif-highlight"), 2500);
      }
      return;
    }
    navigate("/discussion", { state: { scrollToPost: id, highlight: true } });
  };

  // ─── Secure Session Handoff Interceptor ──────────────────────────────────────
  const handleExternalNavigation = async (e: React.MouseEvent, targetUrl: string) => {
    e.preventDefault();
    if (user) {
      try {
        const token = await user.getIdToken(true);
        const encodedName = encodeURIComponent(profile?.display_name || user.displayName || "");
        const encodedPhoto = encodeURIComponent(user.photoURL || "");
        const separator = targetUrl.includes("?") ? "&" : "?";
        
        window.location.href = `${targetUrl}${separator}authToken=${token}&displayName=${encodedName}&photoURL=${encodedPhoto}`;
      } catch (error) {
        window.location.href = targetUrl;
      }
    } else {
      window.location.href = targetUrl;
    }
  };

  const avatarSrc  = user?.photoURL  || "https://placehold.co/96x96/111/fff?text=U";
  const avatarName = profile?.display_name || user?.displayName || "Engineer";

  // ── Reusable Pieces ─────────────────────────────────────────────────────────
  const ProfileDropdown = ({ mobile = false }: { mobile?: boolean }) => (
    <AnimatePresence>
      {isProfileOpen && user && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute ${mobile ? "right-0 top-14" : "right-0 top-[calc(100%+14px)]"} w-64 bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[420]`}
        >
          <div className="px-3 pt-3 pb-3.5 mb-1 border-b border-white/[0.05] flex items-center gap-3">
            <div className="relative shrink-0">
              <img src={avatarSrc} alt="avatar" className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0c0c0e] rounded-full" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-zinc-100 font-semibold truncate tracking-tight">{avatarName}</p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <Link to="/profile"      className="menu-item"><UserCircle2 size={15} className="menu-icon" /> View Profile</Link>
            <Link to="/edit-profile" className="menu-item"><UserPen     size={15} className="menu-icon" /> Edit Profile</Link>
            <button onClick={toggleTheme} className="menu-item w-full justify-between">
              <span className="flex items-center gap-2.5">
                {theme === "dark"
                  ? <Sun  size={15} className="menu-icon" />
                  : <Moon size={15} className="menu-icon" />}
                Theme
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">{theme}</span>
            </button>
            <div className="h-px bg-white/[0.05] my-1 mx-2" />
            <button onClick={logout} className="menu-item w-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10">
              <LogOut size={15} className="text-zinc-500 group-hover:text-red-400" /> Log Out
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const NotifPanel = ({ mobile = false }: { mobile?: boolean }) => (
    <AnimatePresence>
      {isNotifOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute ${mobile ? "-right-16 sm:right-0 top-14 w-[90vw] max-w-[380px]" : "right-0 top-[calc(100%+14px)] w-[390px]"} bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[120]`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-3.5 border-b border-white/[0.05] flex justify-between items-center">
            <h3 className="text-zinc-100 font-semibold text-[14px] flex items-center gap-2"><Activity size={15} className="text-blue-400" /> Activity Feed</h3>
          </div>
          <div className="max-h-[420px] overflow-y-auto flex flex-col">
            {notifications.length === 0 ? (
              <div className="py-14 text-center flex flex-col items-center">
                <div className="w-11 h-11 rounded-2xl border border-white/[0.05] flex items-center justify-center mb-3 bg-white/[0.02]">
                  <CheckCircle2 size={22} className="text-zinc-600" />
                </div>
                <p className="text-zinc-300 text-[14px] font-semibold">All caught up.</p>
                <p className="text-zinc-600 text-xs mt-1">No new activity.</p>
              </div>
            ) : notifications.map((n) => (
              <a key={n.id} href={`/discussion#${n.id}`} onClick={(e) => handleNotifClick(e, n.id)}
                className={`group relative flex items-start gap-4 p-4 border-b border-white/[0.03] hover:bg-white/[0.03] transition-all ${n.isUnread ? "bg-blue-500/[0.02]" : ""}`}>
                {n.isUnread && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500" />}
                <div className={`mt-0.5 p-2 rounded-full border ${n.isUnread ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-white/[0.03] border-white/[0.05] text-zinc-500 group-hover:text-zinc-300"} transition-colors`}>
                  <MessageCircle size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium truncate mb-1 ${n.isUnread ? "text-zinc-100" : "text-zinc-300"}`}>{n.title}</p>
                  <p className="text-[12px] text-zinc-500 truncate"><span className="text-zinc-400 font-medium">{n.authorName}</span> started a discussion</p>
                </div>
                <div className="shrink-0 text-[11px] text-zinc-600 font-medium mt-0.5">{timeAgo(n.createdAt)}</div>
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const GroupDropdown = ({ group }: { group: NavGroup }) => (
    <AnimatePresence>
      {openGroup === group.label && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#0d0d0f]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden z-50"
        >
          <div className="p-2">
            {group.items.map((item) => (
              <Link key={item.name} to={item.path}
                onClick={() => setOpenGroup(null)}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.07] transition-colors">
                  <item.icon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-zinc-200 group-hover:text-white transition-colors">{item.name}</div>
                  {item.description && <div className="text-[11px] text-zinc-600 mt-0.5 group-hover:text-zinc-500 transition-colors">{item.description}</div>}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const isDevActive = location.pathname === "/developer";

  return (
    <>
      {/* ── DESKTOP ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-5 inset-x-0 z-50 pointer-events-none hidden md:flex justify-center">
        <motion.div
          ref={navRef}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto flex items-center p-1.5 rounded-full bg-[#050505]/40 backdrop-blur-3xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        >
          <Link to="/" className="flex items-center gap-2 pl-4 pr-3 py-1.5 mr-2 rounded-full hover:bg-white/[0.06] transition-colors group">
            <Zap className="w-[17px] h-[17px] text-zinc-100 group-hover:text-blue-400 transition-colors" fill="currentColor" />
            <span className="font-extrabold text-white text-[14px] tracking-tight">ALGO<span className="text-zinc-500 font-semibold">LIB</span></span>
          </Link>

          <div className="flex items-center gap-0.5">
            {NAV_LINKS.map((tab) => {
              const isActive = tab.path === "/" 
                ? location.pathname === "/" 
                : location.pathname.startsWith(tab.path);
              
              const baseClasses = `relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold tracking-wide transition-colors ${isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"}`;

              return (
                <div key={tab.name} className="relative">
                  {tab.isExternal ? (
                    <a 
                      href={tab.path} 
                      onClick={(e) => handleExternalNavigation(e, tab.path)}
                      className={baseClasses}
                    >
                      <tab.icon className="w-[14px] h-[14px]" />
                      {tab.name}
                    </a>
                  ) : (
                    <Link to={tab.path} className={baseClasses}>
                      <tab.icon className="w-[14px] h-[14px]" />
                      {tab.name}
                    </Link>
                  )}
                  {isActive && (
                    <motion.div layoutId="desk-active-nav"
                      className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/[0.04] z-0"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />
                  )}
                </div>
              );
            })}

            {NAV_GROUPS.map((group) => {
              const isGroupActive = group.items.some(i => location.pathname.startsWith(i.path));
              const isOpen = openGroup === group.label;
              return (
                <div key={group.label} className="relative">
                  <button
                    onClick={() => setOpenGroup(p => p === group.label ? null : group.label)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold tracking-wide transition-colors ${isOpen || isGroupActive ? "text-white bg-white/[0.07]" : "text-zinc-400 hover:text-zinc-200"}`}
                  >
                    <group.icon className="w-[14px] h-[14px]" />
                    {group.label}
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <GroupDropdown group={group} />
                </div>
              );
            })}
          </div>

          <div className="w-px h-5 bg-white/[0.08] mx-3" />

          <div className="flex items-center gap-1 pr-1.5">
            <a 
              href={DEVELOPER_EXTERNAL_URL} 
              rel="noopener noreferrer"
              title="Developer"
              className={`p-2 rounded-full font-mono font-bold text-[13px] leading-none flex items-center justify-center transition-colors ${isDevActive ? "text-white bg-white/[0.08]" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"}`}
            >
              {"</>"}
            </a>

            {user && profile?.is_profile_complete && (
              <div className="relative" ref={notifDeskRef}>
                <button onClick={handleNotifOpen}
                  className={`p-2 rounded-full relative transition-colors ${isNotifOpen ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"}`}>
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 border border-[#09090b]" />
                    </span>
                  )}
                </button>
                <NotifPanel />
              </div>
            )}

            {user ? (
              <div className="relative ml-1" ref={profileRef}>
                <button onClick={() => { setIsProfileOpen(p => !p); setIsNotifOpen(false); }}
                  className={`flex items-center gap-1.5 rounded-full pl-1.5 pr-2.5 py-1.5 border transition-all ${isProfileOpen ? "bg-white/[0.08] border-white/[0.08]" : "border-transparent hover:bg-white/[0.06]"}`}>
                  <img src={avatarSrc} alt="avatar" className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10" />
                  <ChevronDown size={13} className={isProfileOpen ? "text-zinc-300" : "text-zinc-500"} />
                </button>
                <ProfileDropdown />
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="ml-1 px-5 py-2 rounded-full bg-white text-black text-[13px] font-bold hover:bg-zinc-200 transition-colors shadow-md flex items-center gap-1.5"
              >
                <Sparkles size={13} /> Sign In
              </button>
            )}
          </div>
        </motion.div>
      </nav>

      {/* ── MOBILE ──────────────────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-4 inset-x-4 z-50">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center justify-between p-2.5 rounded-[20px] bg-[#050505]/50 backdrop-blur-3xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-50"
        >
          <Link to="/" className="flex items-center gap-2 px-2 group">
            <Zap className="w-4 h-4 text-zinc-100 group-hover:text-blue-400 transition-colors" fill="currentColor" />
            <span className="font-extrabold text-white text-[16px] tracking-tight">ALGO<span className="text-zinc-500 font-semibold">LIB</span></span>
          </Link>

          <div className="flex items-center gap-1">
            {user && profile?.is_profile_complete && (
              <div className="relative" ref={notifMobRef}>
                <button onClick={handleNotifOpen} className={`p-2 rounded-xl relative transition-colors ${isNotifOpen ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"}`}>
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 border border-[#09090b]" />
                    </span>
                  )}
                </button>
                <NotifPanel mobile />
              </div>
            )}
            
            {user && (
              <div className="relative" ref={mProfileRef}>
                <button onClick={() => { setIsProfileOpen(p => !p); setIsNotifOpen(false); }}
                  className={`flex items-center p-1 rounded-full border ml-1 transition-colors ${isProfileOpen ? "border-white/[0.2] bg-white/[0.05]" : "border-white/[0.08]"}`}>
                  <img src={avatarSrc} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                </button>
                <ProfileDropdown mobile />
              </div>
            )}
            <button onClick={() => setIsMobileOpen(p => !p)}
              className={`p-2 ml-1 rounded-xl transition-colors ${isMobileOpen ? "bg-white text-black" : "text-zinc-300 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]"}`}>
              {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#030303]/60 backdrop-blur-sm z-40"
                onClick={() => setIsMobileOpen(false)} />

              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-full left-0 right-0 mt-3 bg-[#09090b]/95 backdrop-blur-2xl border border-white/[0.10] rounded-[24px] p-2.5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col gap-0.5 z-50 max-h-[80vh] overflow-y-auto"
              >
                {NAV_LINKS.map((tab) => {
                  const isActive = tab.path === "/" 
                    ? location.pathname === "/" 
                    : location.pathname.startsWith(tab.path);

                  const contentJSX = (
                    <>
                      {isActive && <div className="absolute inset-0 bg-white/[0.06] border border-white/[0.04] rounded-[16px] z-0" />}
                      <div className={`relative z-10 p-1.5 rounded-lg border ${isActive ? "bg-white/[0.08] border-white/[0.05] text-white" : "border-transparent text-zinc-500 group-hover:text-zinc-300 group-hover:bg-white/[0.04] group-hover:border-white/[0.05]"} transition-all`}>
                        <tab.icon size={18} />
                      </div>
                      <span className={`relative z-10 text-[15px] font-semibold transition-colors ${isActive ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"}`}>{tab.name}</span>
                    </>
                  );

                  return tab.isExternal ? (
                    <a 
                      key={tab.name} 
                      href={tab.path} 
                      onClick={(e) => {
                        setIsMobileOpen(false);
                        handleExternalNavigation(e, tab.path);
                      }}
                      className="relative px-4 py-3.5 rounded-[16px] flex items-center gap-4 group overflow-hidden"
                    >
                      {contentJSX}
                    </a>
                  ) : (
                    <Link key={tab.name} to={tab.path} onClick={() => setIsMobileOpen(false)} className="relative px-4 py-3.5 rounded-[16px] flex items-center gap-4 group overflow-hidden">
                      {contentJSX}
                    </Link>
                  );
                })}

                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="px-4 py-2 text-[11px] font-semibold tracking-widest text-zinc-600 uppercase">{group.label}</div>
                    {group.items.map((item) => {
                      const isActive = location.pathname.startsWith(item.path);
                      return (
                        <Link key={item.name} to={item.path} onClick={() => setIsMobileOpen(false)}
                          className="relative px-4 py-3 rounded-[16px] flex items-center gap-4 group overflow-hidden">
                          {isActive && <div className="absolute inset-0 bg-white/[0.06] border border-white/[0.04] rounded-[16px] z-0" />}
                          <div className={`relative z-10 p-1.5 rounded-lg border ${isActive ? "bg-white/[0.08] border-white/[0.05] text-white" : "border-transparent text-zinc-500 group-hover:text-zinc-300 group-hover:bg-white/[0.04] group-hover:border-white/[0.05]"} transition-all`}>
                            <item.icon size={17} />
                          </div>
                          <div className="relative z-10">
                            <div className={`text-[14px] font-semibold transition-colors ${isActive ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"}`}>{item.name}</div>
                            {item.description && <div className="text-[11px] text-zinc-600">{item.description}</div>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))}

                <div className="h-px bg-white/[0.06] my-2 mx-4" />

                <a 
                  href={DEVELOPER_EXTERNAL_URL} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => setIsMobileOpen(false)}
                  className="relative px-4 py-3.5 rounded-[16px] flex items-center gap-4 group overflow-hidden"
                >
                  <div className="relative z-10 p-1.5 rounded-lg border border-transparent text-zinc-500 group-hover:text-zinc-300 group-hover:bg-white/[0.04] group-hover:border-white/[0.05] transition-all">
                    <Code2 size={18} />
                  </div>
                  <span className="relative z-10 text-[15px] font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">Developer</span>
                </a>

                {!user && (
                  <button
                    onClick={() => { setIsMobileOpen(false); setIsAuthModalOpen(true); }}
                    className="mt-2 mx-2 mb-1 px-4 py-3.5 rounded-[14px] bg-white text-black flex justify-center items-center gap-2 text-[15px] font-bold active:scale-95 transition-transform"
                  >
                    <Sparkles size={18} /> Get Started
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>


      {/* ── AUTH MODAL (shared premium component) ─────────────────────────── */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <style>{`
        .menu-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 12px;
          font-size: 13px; font-weight: 500;
          color: rgb(212 212 216); text-decoration: none;
          transition: all 0.15s;
          cursor: pointer; background: transparent; border: none; text-align: left;
        }
        .menu-item:hover { color: white; background: rgba(255,255,255,0.06); }
        .menu-icon { color: rgb(113 113 122); flex-shrink: 0; }
        .menu-item:hover .menu-icon { color: rgb(212 212 216); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }

        @keyframes highlight-flash {
          0%   { background-color: rgba(59, 130, 246, 0.25); box-shadow: 0 0 30px rgba(59, 130, 246, 0.4); transform: scale(1.01); }
          50%  { background-color: rgba(59, 130, 246, 0.1);  box-shadow: 0 0 15px rgba(59, 130, 246, 0.2); }
          100% { background-color: transparent;              box-shadow: none;                              transform: scale(1); }
        }
        .notif-highlight {
          animation: highlight-flash 2.5s ease-out;
          border-radius: 16px;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
};

export default Navbar;