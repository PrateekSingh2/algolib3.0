import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { firestoreDB, logout } from "../lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { executeGoogleSignIn, executeGithubSignIn } from "@/contexts/AuthContext";
import {
  Home, Terminal, Cpu, BookOpen, MessageCircle, LogOut, Menu, X,
  Bell, CheckCircle2, UserCircle2, UserPen, ChevronDown, Zap, Activity,
  Sparkles, Sun, Moon, Code2, BarChart3, BrainCircuit, Network,
  TerminalSquare, BookText, Trophy, GraduationCap, Layers, Github, Globe, Newspaper,
  ClipboardList
} from "lucide-react";

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
      { name: "AlgoLib AI",      path: "/analyzer",   icon: BarChart3,       description: "AlgoLib AI assistant" },
    ],
  },
  {
    label: "Learn",
    icon: GraduationCap,
    items: [
      { name: "Notes",      path: "/notes",      icon: BookText,      description: "Programming, OOPs & DSA notes" },
      { name: "DSA Sheet",  path: "/dsa-sheet",  icon: ClipboardList,  description: "Track your DSA practice progress" },
      { name: "Contests",   path: "/contests",   icon: Trophy,         description: "Live coding contests" },
      { name: "Quiz Panel", path: "/quiz-panel", icon: BrainCircuit,   description: "Create or Join quizzes" },
    ],
  },
];

const NAV_LINKS = [
  { name: "Home",       path: "/",           icon: Home },
  { name: "Community",  path: "/discussion", icon: MessageCircle },
  { name: "Blog",       path: "/blog",       icon: Newspaper },
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
      // Already on the page — scroll directly
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("notif-highlight");
        setTimeout(() => el.classList.remove("notif-highlight"), 2000);
      }
      return;
    }
    // Navigate with state so Community page can scroll after mount
    navigate("/discussion", { state: { scrollToPost: id } });
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
          {/* Avatar header */}
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

  // ── Desktop Dropdown ─────────────────────────────────────────────────────────
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

  const isNotesActive = location.pathname === "/notes";
  const isDevActive   = location.pathname === "/developer";

  return (
    <>
      {/* ── DESKTOP ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-5 inset-x-0 z-50 pointer-events-none hidden md:flex justify-center">
        <motion.div
          ref={navRef}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto flex items-center p-1.5 rounded-full bg-[#09090b]/85 backdrop-blur-xl border border-white/[0.12] shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 pl-4 pr-3 py-1.5 mr-2 rounded-full hover:bg-white/[0.06] transition-colors group">
            <Zap className="w-[17px] h-[17px] text-zinc-100 group-hover:text-blue-400 transition-colors" fill="currentColor" />
            <span className="font-extrabold text-white text-[14px] tracking-tight">ALGO<span className="text-zinc-500 font-semibold">LIB</span></span>
          </Link>

          {/* Simple nav links */}
          <div className="flex items-center gap-0.5">
            {NAV_LINKS.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <div key={tab.name} className="relative">
                  <Link to={tab.path}
                    className={`relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold tracking-wide transition-colors ${isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
                    <tab.icon className="w-[14px] h-[14px]" />
                    {tab.name}
                  </Link>
                  {isActive && (
                    <motion.div layoutId="desk-active-nav"
                      className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/[0.04] z-0"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />
                  )}
                </div>
              );
            })}

            {/* Group dropdowns */}
            {NAV_GROUPS.map((group) => {
              const isGroupActive = group.items.some(i => i.path === location.pathname);
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

          {/* Right actions */}
          <div className="flex items-center gap-1 pr-1.5">

            {/* Dev */}
            <Link to="/developer" title="Developer"
              className={`p-2 rounded-full font-mono font-bold text-[13px] leading-none flex items-center justify-center transition-colors ${isDevActive ? "text-white bg-white/[0.08]" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"}`}>
              {"</>"}
            </Link>

            {/* Notifications */}
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

            {/* Profile or sign-in */}
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
          className="relative flex items-center justify-between p-2.5 rounded-[20px] bg-[#09090b]/85 backdrop-blur-xl border border-white/[0.10] shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50"
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
                {/* Simple links */}
                {NAV_LINKS.map((tab) => {
                  const isActive = location.pathname === tab.path;
                  return (
                    <Link key={tab.name} to={tab.path} onClick={() => setIsMobileOpen(false)}
                      className="relative px-4 py-3.5 rounded-[16px] flex items-center gap-4 group overflow-hidden">
                      {isActive && <div className="absolute inset-0 bg-white/[0.06] border border-white/[0.04] rounded-[16px] z-0" />}
                      <div className={`relative z-10 p-1.5 rounded-lg border ${isActive ? "bg-white/[0.08] border-white/[0.05] text-white" : "border-transparent text-zinc-500 group-hover:text-zinc-300 group-hover:bg-white/[0.04] group-hover:border-white/[0.05]"} transition-all`}>
                        <tab.icon size={18} />
                      </div>
                      <span className={`relative z-10 text-[15px] font-semibold transition-colors ${isActive ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"}`}>{tab.name}</span>
                    </Link>
                  );
                })}

                {/* Groups */}
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="px-4 py-2 text-[11px] font-semibold tracking-widest text-zinc-600 uppercase">{group.label}</div>
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path;
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

                {/* Notes & Dev */}
                {[{ name: "Developer", path: "/developer", icon: Code2 }].map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.name} to={item.path} onClick={() => setIsMobileOpen(false)}
                      className="relative px-4 py-3.5 rounded-[16px] flex items-center gap-4 group overflow-hidden">
                      {isActive && <div className="absolute inset-0 bg-white/[0.06] border border-white/[0.04] rounded-[16px] z-0" />}
                      <div className={`relative z-10 p-1.5 rounded-lg border ${isActive ? "bg-white/[0.08] border-white/[0.05] text-white" : "border-transparent text-zinc-500 group-hover:text-zinc-300 group-hover:bg-white/[0.04] group-hover:border-white/[0.05]"} transition-all`}>
                        <item.icon size={18} />
                      </div>
                      <span className={`relative z-10 text-[15px] font-semibold transition-colors ${isActive ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"}`}>{item.name}</span>
                    </Link>
                  );
                })}

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

      {/* ── AUTH MODAL ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setIsAuthModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden"
            >
              {/* Top glow accent */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />

              <div className="p-8 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-cyan-400" fill="currentColor" />
                      <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">AlgoLib</span>
                    </div>
                    <h2 className="text-xl font-semibold text-white tracking-tight">Initialize Profile</h2>
                  </div>
                  <button
                    onClick={() => setIsAuthModalOpen(false)}
                    className="text-zinc-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.06]"
                  >
                    <X size={18} />
                  </button>
                </div>

                <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                  Select an auth protocol to securely sync your algorithmic environment.
                </p>

                {/* Auth buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { setIsAuthModalOpen(false); executeGoogleSignIn(); }}
                    className="flex items-center justify-center gap-3 w-full h-12 bg-white text-black rounded-xl font-semibold text-[14px] hover:bg-zinc-100 transition-all active:scale-[0.98] shadow-md"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>

                  <button
                    onClick={() => { setIsAuthModalOpen(false); executeGithubSignIn(); }}
                    className="flex items-center justify-center gap-3 w-full h-12 bg-[#24292e] text-white border border-white/5 rounded-xl font-semibold text-[14px] hover:bg-[#2f363d] transition-all active:scale-[0.98]"
                  >
                    <Github className="w-5 h-5" />
                    Continue with GitHub
                  </button>
                </div>

                <p className="text-[11px] text-zinc-600 text-center mt-6 leading-relaxed">
                  By continuing, you agree to our{" "}
                  <Link to="/terms" onClick={() => setIsAuthModalOpen(false)} className="text-zinc-400 hover:text-white underline underline-offset-2">Terms</Link>{" "}
                  and{" "}
                  <Link to="/privacy" onClick={() => setIsAuthModalOpen(false)} className="text-zinc-400 hover:text-white underline underline-offset-2">Privacy Policy</Link>.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared CSS */}
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
      `}</style>
    </>
  );
};

export default Navbar;