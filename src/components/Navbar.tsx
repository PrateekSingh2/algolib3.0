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
  ClipboardList, Settings, BadgeCheck
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
  const [isScrolled,       setIsScrolled]       = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const avatarSrc  = profile?.avatar_url || user?.photoURL  || "https://placehold.co/96x96/111/fff?text=U";
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
          className={`absolute ${mobile ? "right-0 top-14" : "right-0 top-[calc(100%+14px)]"} w-64 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.1] rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[420]`}
        >
          <div className="px-3 pt-3 pb-3.5 mb-1 border-b border-slate-100 dark:border-white/[0.05] flex items-center gap-3">
            <div className="relative shrink-0">
              <img src={avatarSrc} alt="avatar" className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200 dark:ring-white/10" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0c0c0e] rounded-full" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-800 dark:text-zinc-100 font-bold tracking-tight font-nunito flex items-center gap-1.5 truncate">
                <span className="truncate">{avatarName}</span>
                {profile?.is_verified && <BadgeCheck size={14} className="text-sky-500 fill-sky-100 dark:fill-sky-500/20 shrink-0" />}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-500 truncate mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <Link to={profile?.username ? `/user/${profile.username}` : "/profile"} className="menu-item"><UserCircle2 size={15} className="menu-icon" /> View Profile</Link>
            <Link to="/settings" className="menu-item"><Settings size={15} className="menu-icon" /> Settings</Link>
            <div className="h-[2px] bg-slate-100 dark:bg-white/[0.05] my-1 mx-2 rounded-full" />
            <button onClick={logout} className="menu-item w-full text-slate-500 hover:text-red-500 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors">
              <LogOut size={15} className="text-slate-400 group-hover:text-red-500 dark:text-zinc-500 dark:group-hover:text-red-400" /> Log Out
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
          className={`absolute ${mobile ? "-right-16 sm:right-0 top-14 w-[90vw] max-w-[380px]" : "right-0 top-[calc(100%+14px)] w-[390px]"} bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[120]`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.05] flex justify-between items-center">
            <h3 className="text-slate-800 dark:text-zinc-100 font-bold text-[14px] flex items-center gap-2 font-nunito"><Activity size={15} className="text-indigo-500 dark:text-blue-400" /> Activity Feed</h3>
          </div>
          <div className="max-h-[420px] overflow-y-auto flex flex-col custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-14 text-center flex flex-col items-center">
                <div className="w-11 h-11 rounded-2xl border border-slate-200 dark:border-white/[0.05] flex items-center justify-center mb-3 bg-slate-50 dark:bg-white/[0.02]">
                  <CheckCircle2 size={22} className="text-slate-400 dark:text-zinc-600" />
                </div>
                <p className="text-slate-700 dark:text-zinc-300 text-[14px] font-bold font-nunito">All caught up.</p>
                <p className="text-slate-400 dark:text-zinc-600 text-xs mt-1 font-semibold">No new activity.</p>
              </div>
            ) : notifications.map((n) => (
              <a key={n.id} href={`/discussion#${n.id}`} onClick={(e) => handleNotifClick(e, n.id)}
                className={`group relative flex items-start gap-4 p-4 border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all ${n.isUnread ? "bg-indigo-50 dark:bg-blue-500/[0.02]" : ""}`}>
                {n.isUnread && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 dark:bg-blue-500" />}
                <div className={`mt-0.5 p-2 rounded-full border ${n.isUnread ? "bg-indigo-100 border-indigo-200 text-indigo-500 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400" : "bg-slate-100 border-slate-200 text-slate-400 group-hover:text-slate-600 dark:bg-white/[0.03] dark:border-white/[0.05] dark:text-zinc-500 dark:group-hover:text-zinc-300"} transition-colors`}>
                  <MessageCircle size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-bold truncate mb-1 font-nunito ${n.isUnread ? "text-slate-800 dark:text-zinc-100" : "text-slate-600 dark:text-zinc-300"}`}>{n.title}</p>
                  <p className="text-[12px] text-slate-500 dark:text-zinc-500 truncate font-semibold"><span className="text-slate-700 dark:text-zinc-400 font-bold">{n.authorName}</span> started a discussion</p>
                </div>
                <div className="shrink-0 text-[11px] text-slate-400 dark:text-zinc-600 font-bold mt-0.5">{timeAgo(n.createdAt)}</div>
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
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white/95 dark:bg-[#0d0d0f]/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden z-50"
        >
          <div className="p-2">
            {group.items.map((item) => (
              <Link key={item.name} to={item.path}
                onClick={() => setOpenGroup(null)}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-white/[0.07] transition-colors">
                  <item.icon className="w-4 h-4 text-slate-500 dark:text-zinc-400 group-hover:text-indigo-500 dark:group-hover:text-zinc-200 transition-colors" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-slate-700 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors font-nunito">{item.name}</div>
                  {item.description && <div className="text-[11px] font-semibold text-slate-400 dark:text-zinc-600 mt-0.5 group-hover:text-slate-500 dark:group-hover:text-zinc-500 transition-colors">{item.description}</div>}
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
      <nav className={`fixed inset-x-0 z-[100] pointer-events-none hidden md:flex justify-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled ? 'top-4' : 'top-0'}`}>
        <motion.div
          layout
          ref={navRef}
          initial={{ y: -50, opacity: 0, borderRadius: 9999 }}
          animate={{ y: 0, opacity: 1, borderRadius: isScrolled ? 9999 : 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`pointer-events-auto flex items-center justify-between bg-white/80 dark:bg-[#050505]/70 backdrop-blur-2xl border-slate-200/50 dark:border-white/[0.08] ${isScrolled ? 'p-1.5 border shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] gap-2' : 'w-full px-6 lg:px-10 py-2.5 border-b shadow-none gap-4'}`}
        >
          {/* ── LEFT: Logo ── */}
          <div className={`flex items-center flex-shrink-0 transition-transform duration-500 ${isScrolled ? 'pl-2' : ''}`}>
            <Link to="/" className="flex items-center gap-2 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors group">
              <Zap className="w-[17px] h-[17px] text-slate-800 dark:text-zinc-100 group-hover:text-indigo-500 dark:group-hover:text-blue-400 transition-colors" fill="currentColor" />
              <span className="font-extrabold text-slate-800 dark:text-white text-[14px] tracking-tight font-nunito">ALGO<span className="text-indigo-500 dark:text-zinc-500 font-semibold">LIB</span></span>
            </Link>
          </div>

          {/* ── CENTER: Tabs ── */}
          <div className={`flex items-center flex-shrink-0 transition-all duration-500 ${isScrolled ? 'gap-0.5' : 'gap-1 lg:gap-3'}`}>
            {NAV_LINKS.map((tab) => {
              const isActive = tab.path === "/" 
                ? location.pathname === "/" 
                : location.pathname.startsWith(tab.path);
              
              const baseClasses = `relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-bold tracking-wide transition-colors font-nunito ${isActive ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"}`;

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
                      className="absolute inset-0 rounded-full bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.04] z-0"
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
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-bold tracking-wide transition-colors font-nunito ${isOpen || isGroupActive ? "text-slate-800 bg-slate-100 dark:text-white dark:bg-white/[0.07]" : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"}`}
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

          {/* ── RIGHT: Utilities ── */}
          <div className="flex items-center flex-shrink-0 transition-transform duration-500">
            <div className={`w-[2px] bg-slate-200 dark:bg-white/[0.08] rounded-full overflow-hidden transition-all duration-500 ${isScrolled ? 'h-5 opacity-100 mx-2' : 'h-0 opacity-0 mx-0 w-0'}`} />

            <div className={`flex items-center gap-1 transition-transform duration-500 ${isScrolled ? 'pr-1' : ''}`}>
              <a 
                href={DEVELOPER_EXTERNAL_URL} 
                rel="noopener noreferrer"
                title="Developer"
                className={`p-2 rounded-full font-mono font-bold text-[13px] leading-none flex items-center justify-center transition-colors ${isDevActive ? "text-slate-800 bg-slate-100 dark:text-white dark:bg-white/[0.08]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/[0.06]"}`}
              >
                {"</>"}
              </a>

              {/* THEME TOGGLE ADDED TO MAIN NAVBAR ALSO */}
              <button
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                title="Toggle Theme"
                className="p-2 rounded-full flex items-center justify-center transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/[0.06]"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {user && profile?.is_profile_complete && (
                <div className="relative" ref={notifDeskRef}>
                  <button onClick={handleNotifOpen}
                    aria-label="Open notifications"
                    aria-expanded={isNotifOpen}
                    className={`p-2 rounded-full relative transition-colors ${isNotifOpen ? "bg-slate-100 text-slate-800 dark:bg-white/[0.08] dark:text-white" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/[0.06]"}`}>
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 dark:bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 dark:bg-blue-500 border border-white dark:border-[#09090b]" />
                      </span>
                    )}
                  </button>
                  <NotifPanel />
                </div>
              )}

              {user ? (
                <div className="relative ml-1" ref={profileRef}>
                  <button onClick={() => { setIsProfileOpen(p => !p); setIsNotifOpen(false); }}
                    aria-label="Open profile menu"
                    aria-expanded={isProfileOpen}
                    className={`flex items-center gap-1.5 rounded-full pl-1.5 pr-2.5 py-1.5 border transition-all ${isProfileOpen ? "bg-slate-100 border-slate-200 dark:bg-white/[0.08] dark:border-white/[0.08]" : "border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.06]"}`}>
                    <img src={avatarSrc} alt="avatar" className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/10" />
                    <ChevronDown size={13} className={isProfileOpen ? "text-slate-700 dark:text-zinc-300" : "text-slate-400 dark:text-zinc-500"} />
                  </button>
                  <ProfileDropdown />
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="ml-1 px-5 py-2 rounded-full bg-indigo-500 text-white dark:bg-white dark:text-black text-[13px] font-bold hover:bg-indigo-600 dark:hover:bg-zinc-200 transition-colors shadow-[0_4px_12px_rgba(99,102,241,0.2)] dark:shadow-md flex items-center gap-1.5 font-nunito"
                >
                  <Sparkles size={13} /> Sign In
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </nav>

      {/* ── MOBILE ──────────────────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-4 inset-x-4 z-50">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center justify-between p-2.5 rounded-[20px] bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-50"
        >
          <Link to="/" className="flex items-center gap-2 px-2 group">
            <Zap className="w-4 h-4 text-slate-800 dark:text-zinc-100 group-hover:text-indigo-500 dark:group-hover:text-blue-400 transition-colors" fill="currentColor" />
            <span className="font-extrabold text-slate-800 dark:text-white text-[16px] tracking-tight font-nunito">ALGO<span className="text-indigo-500 dark:text-zinc-500 font-semibold">LIB</span></span>
          </Link>

          <div className="flex items-center gap-1">
            {user && profile?.is_profile_complete && (
              <div className="relative" ref={notifMobRef}>
                <button onClick={handleNotifOpen}
                  aria-label="Open notifications"
                  aria-expanded={isNotifOpen}
                  className={`p-2 rounded-xl relative transition-colors ${isNotifOpen ? "bg-slate-100 text-slate-800 dark:bg-white/[0.08] dark:text-white" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.04]"}`}>
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 dark:bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 dark:bg-blue-500 border border-white dark:border-[#09090b]" />
                    </span>
                  )}
                </button>
                <NotifPanel mobile />
              </div>
            )}
            
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              title="Toggle Theme"
              className="p-2 ml-1 rounded-xl transition-colors text-slate-500 dark:text-zinc-300 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.08]"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user && (
              <div className="relative" ref={mProfileRef}>
                <button onClick={() => { setIsProfileOpen(p => !p); setIsNotifOpen(false); }}
                  aria-label="Open profile menu"
                  aria-expanded={isProfileOpen}
                  className={`flex items-center p-1 rounded-full border ml-1 transition-colors ${isProfileOpen ? "border-slate-300 bg-slate-100 dark:border-white/[0.2] dark:bg-white/[0.05]" : "border-slate-200 dark:border-white/[0.08]"}`}>
                  <img src={avatarSrc} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                </button>
                <ProfileDropdown mobile />
              </div>
            )}

            <button onClick={() => setIsMobileOpen(p => !p)}
              aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileOpen}
              className={`p-2 ml-1 rounded-xl transition-colors ${isMobileOpen ? "bg-indigo-50 text-indigo-600 dark:bg-white dark:text-black" : "text-slate-500 dark:text-zinc-300 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.08]"}`}>
              {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/30 dark:bg-[#030303]/60 backdrop-blur-sm z-40"
                onClick={() => setIsMobileOpen(false)} />

              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.10] rounded-[24px] p-2.5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col gap-0.5 z-50 max-h-[80vh] overflow-y-auto custom-scrollbar"
              >
                {NAV_LINKS.map((tab) => {
                  const isActive = tab.path === "/" 
                    ? location.pathname === "/" 
                    : location.pathname.startsWith(tab.path);

                  const contentJSX = (
                    <>
                      {isActive && <div className="absolute inset-0 bg-slate-50 dark:bg-white/[0.06] border border-slate-100 dark:border-white/[0.04] rounded-[16px] z-0" />}
                      <div className={`relative z-10 p-1.5 rounded-lg border ${isActive ? "bg-indigo-50 border-indigo-100 text-indigo-500 dark:bg-white/[0.08] dark:border-white/[0.05] dark:text-white" : "border-transparent text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 dark:group-hover:text-zinc-300 group-hover:bg-slate-50 dark:group-hover:bg-white/[0.04] group-hover:border-slate-100 dark:group-hover:border-white/[0.05]"} transition-all`}>
                        <tab.icon size={18} />
                      </div>
                      <span className={`relative z-10 text-[15px] font-bold font-nunito transition-colors ${isActive ? "text-slate-800 dark:text-zinc-100" : "text-slate-500 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-zinc-200"}`}>{tab.name}</span>
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
                      className="relative px-4 py-3 shrink-0 rounded-[16px] flex items-center gap-4 group overflow-hidden"
                    >
                      {contentJSX}
                    </a>
                  ) : (
                    <Link key={tab.name} to={tab.path} onClick={() => setIsMobileOpen(false)} className="relative px-4 py-3 shrink-0 rounded-[16px] flex items-center gap-4 group overflow-hidden">
                      {contentJSX}
                    </Link>
                  );
                })}

                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="px-4 py-2 text-[11px] font-bold tracking-widest text-slate-400 dark:text-zinc-600 uppercase font-nunito">{group.label}</div>
                    {group.items.map((item) => {
                      const isActive = location.pathname.startsWith(item.path);
                      return (
                        <Link key={item.name} to={item.path} onClick={() => setIsMobileOpen(false)}
                          className="relative px-4 py-3 rounded-[16px] flex items-center gap-4 group overflow-hidden">
                          {isActive && <div className="absolute inset-0 bg-slate-50 dark:bg-white/[0.06] border border-slate-100 dark:border-white/[0.04] rounded-[16px] z-0" />}
                          <div className={`relative z-10 p-1.5 rounded-lg border ${isActive ? "bg-indigo-50 border-indigo-100 text-indigo-500 dark:bg-white/[0.08] dark:border-white/[0.05] dark:text-white" : "border-transparent text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 dark:group-hover:text-zinc-300 group-hover:bg-slate-50 dark:group-hover:bg-white/[0.04] group-hover:border-slate-100 dark:group-hover:border-white/[0.05]"} transition-all`}>
                            <item.icon size={17} />
                          </div>
                          <div className="relative z-10">
                            <div className={`text-[14px] font-bold font-nunito transition-colors ${isActive ? "text-slate-800 dark:text-zinc-100" : "text-slate-500 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-zinc-200"}`}>{item.name}</div>
                            {item.description && <div className="text-[11px] font-semibold text-slate-400 dark:text-zinc-600">{item.description}</div>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))}

                <div className="h-[2px] bg-slate-100 dark:bg-white/[0.06] my-2 mx-4 rounded-full" />

                <a 
                  href={DEVELOPER_EXTERNAL_URL} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => setIsMobileOpen(false)}
                  className="relative px-4 py-3 shrink-0 rounded-[16px] flex items-center gap-4 group overflow-hidden"
                >
                  <div className="relative z-10 p-1.5 rounded-lg border border-transparent text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 dark:group-hover:text-zinc-300 group-hover:bg-slate-50 dark:group-hover:bg-white/[0.04] transition-all">
                    <Code2 size={18} />
                  </div>
                  <span className="relative z-10 text-[15px] font-bold font-nunito text-slate-500 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-zinc-200 transition-colors">Developer</span>
                </a>

                {!user && (
                  <button
                    onClick={() => { setIsMobileOpen(false); setIsAuthModalOpen(true); }}
                    className="mt-2 mx-2 mb-1 px-4 py-3.5 rounded-2xl bg-indigo-500 text-white dark:bg-white dark:text-black hover:bg-indigo-600 dark:hover:bg-zinc-200 flex justify-center items-center gap-2 text-[15px] font-bold active:scale-95 transition-transform font-nunito"
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
          font-size: 13px; font-weight: 700; font-family: 'Nunito', sans-serif;
          color: rgb(71 85 105); text-decoration: none;
          transition: all 0.15s;
          cursor: pointer; background: transparent; border: none; text-align: left;
        }
        .dark .menu-item { color: rgb(212 212 216); }
        
        .menu-item:hover { color: rgb(30 41 59); background: rgb(241 245 249); }
        .dark .menu-item:hover { color: white; background: rgba(255,255,255,0.06); }
        
        .menu-icon { color: rgb(148 163 184); flex-shrink: 0; }
        .dark .menu-icon { color: rgb(113 113 122); }
        
        .menu-item:hover .menu-icon { color: rgb(71 85 105); }
        .dark .menu-item:hover .menu-icon { color: rgb(212 212 216); }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }

        @keyframes highlight-flash {
          0%   { background-color: rgba(99, 102, 241, 0.25); box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); transform: scale(1.01); }
          50%  { background-color: rgba(99, 102, 241, 0.1);  box-shadow: 0 0 15px rgba(99, 102, 241, 0.2); }
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