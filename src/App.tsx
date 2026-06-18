import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Link, Navigate, useNavigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/contexts/AuthContext";
import { CookieProvider } from "./contexts/CookieContext";
// ─── PWA Updater ─────────────────────────────────────────────────────────────
// PWAUpdater is in its own file so that `virtual:pwa-register/react` is a
// static import ONLY inside that module.  We then lazy-load the whole module
// only in production.  In dev mode the dynamic import() is never called, so
// the virtual module stub is never parsed and never corrupts React's internal
// dispatcher — which was the root cause of:
//   TypeError: Cannot read properties of null (reading 'useContext')
const PWAUpdater = import.meta.env.DEV
  ? () => null                                              // dev: no-op, no import
  : lazy(() => import("@/components/PWAUpdater"));          // prod: real SW updater
import { auth, firestoreDB } from "./lib/firebase";
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
import {
  Loader2, Zap, Lock, ChevronRight, Terminal, Network, Cpu, Sparkles,
  Code2, Code, Users, ArrowRight, LayoutDashboard, Globe, Workflow, Braces,
  Cookie, X, Settings2, BookOpen, MessageSquare, Activity, HelpCircle,
  ChevronDown, ListFilter, Trophy, Github
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { incrementVisitCount } from "@/lib/algorithms";
import InstallPrompt from "@/components/InstallPrompt";
import { useActivityTracker, setTrackedActivity } from "@/hooks/useActivityTracker";

import AppFooter from "@/components/AppFooter";
import OrbitalLoader from "@/components/OrbitalLoader";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth, executeGoogleSignIn, executeGithubSignIn } from "@/contexts/AuthContext";
import { useCookieConsent } from "./contexts/CookieContext";
import Navbar from "./components/Navbar";
import Vectoris from "./pages/vectoris/Vectoris";
import Quiz from "./pages/quiz/Quiz";
import QuizPanel from "./pages/quiz/QuizPanel";
import QuizForge from "./pages/quiz/QuizForge";
import Maintenance from "./pages/Maintenance";

// --- LAZY LOADED ROUTES ---
import Index from "./pages/Index";
import LandingPage from "./pages/landing/LandingPage";
const SnippetView = lazy(() => import("./pages/SnippetView"));
const Visualizer = lazy(() => import("./pages/visualizer/Visualizer"));
const SnippetVisualizer = lazy(() => import("./pages/visualizer/SnippetVisualizer"));
const DynamicVisualizerEngine = lazy(() => import("./pages/visualizer-dynamic/DynamicVisualizerEngine"));
const Developer = lazy(() => import("./pages/Developer"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Status = lazy(() => import("./pages/Status/status"));
const Docs = lazy(() => import("./pages/Docs"));
const Notes = lazy(() => import("./pages/notes/Notes"));
const Support = lazy(() => import("./pages/legals/Support"));
const Community = lazy(() => import("./components/Community"));
const EditProfile = lazy(() => import("./pages/userprofile/EditProfile"));
const Profile = lazy(() => import("./pages/userprofile/Profile"));
const ContestPanel = lazy(() => import("./pages/compilerContest/ContestPanel"));
const Contests = lazy(() => import("./pages/compilerContest/Contests"));
const Compiler = lazy(() => import("./pages/compilerContest/Compiler"));
const Terms = lazy(() => import("./pages/legals/Terms"));
const Privacy = lazy(() => import("./pages/legals/Privacy"));
const Cookies = lazy(() => import("./pages/legals/Cookies"));
const Sheets = lazy(() => import("./pages/sheets/Sheets"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const DSASheet = lazy(() => import("./pages/sheets/DSASheet"));
const CPSheet = lazy(() => import("./pages/sheets/CPSheet"));
const TopicDetail = lazy(() => import("./pages/sheets/TopicDetail"));
const queryClient = new QueryClient();

// Removed sign in handlers to AuthContext to fix Fast Refresh issues

const ModuleLoader = () => <OrbitalLoader />;


// --- GLOBAL MAINTENANCE GUARD ---
const SYSTEM_MODULES = [
  { id: '/', name: 'Home' }, { id: '/compiler', name: 'Compiler' }, { id: '/visualizer', name: 'Visualizer Dashboard' },
  { id: '/vectoris', name: 'Vectoris' }, { id: '/view-profile', name: 'View Profile' }, { id: '/edit-profile', name: 'Edit Profile' },
  { id: '/contests', name: 'Contest' }, { id: '/quiz-panel', name: 'Quiz' }, { id: '/discussion', name: 'Community' },
  { id: '/docs', name: 'Documentation' }, { id: '/notes', name: 'AlgoLib Notes' }, { id: '/sheets', name: 'Practice Sheets' }
];

const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [maintainedRoutes, setMaintainedRoutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(firestoreDB, "system_settings", "maintenance"), (docSnap) => {
      if (docSnap.exists()) {
        setMaintainedRoutes(docSnap.data().activeRoutes || []);
      } else {
        setMaintainedRoutes([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <ModuleLoader />;

  // Absolute safety override: Never lock out the admin panel.
  if (location.pathname.startsWith('/hq')) {
    return <>{children}</>;
  }

  const isLocked = maintainedRoutes.some(route => {
    if (route === '/') return location.pathname === '/'; // Exact match for home
    return location.pathname.startsWith(route); // Sub-path match for other tools
  });

  if (isLocked) {
    const availableModules = SYSTEM_MODULES.filter(m => !maintainedRoutes.includes(m.id));
    return <Maintenance availableModules={availableModules} />;
  }

  return <>{children}</>;
};


const CookieConsent = () => {
  const { isCookieConsentOpen, setIsCookieConsentOpen, showCustomize, setShowCustomize } = useCookieConsent();

  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("algolib_cookie_consent");
    if (saved) {
      if (saved === "all") return { necessary: true, analytics: true, personalization: true };
      if (saved === "necessary_only") return { necessary: true, analytics: false, personalization: false };
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse cookie preferences");
      }
    }
    return { necessary: true, analytics: true, personalization: false };
  });

  useEffect(() => {
    const consent = localStorage.getItem("algolib_cookie_consent");
    if (!consent && !isCookieConsentOpen) {
      const timer = setTimeout(() => setIsCookieConsentOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCookieConsentOpen, setIsCookieConsentOpen]);

  const handleAcceptAll = () => {
    const allPrefs = { necessary: true, analytics: true, personalization: true };
    localStorage.setItem("algolib_cookie_consent", JSON.stringify(allPrefs));
    setPreferences(allPrefs);
    setIsCookieConsentOpen(false);
  };

  const handleDecline = () => {
    const minPrefs = { necessary: true, analytics: false, personalization: false };
    localStorage.setItem("algolib_cookie_consent", JSON.stringify(minPrefs));
    setPreferences(minPrefs);
    setIsCookieConsentOpen(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("algolib_cookie_consent", JSON.stringify(preferences));
    setIsCookieConsentOpen(false);
  };

  const togglePreference = (key: keyof typeof preferences) => {
    if (key === 'necessary') return;
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AnimatePresence>
      {isCookieConsentOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-14 left-6 md:left-10 z-[999] w-[380px] max-w-[calc(100vw-48px)] bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {showCustomize ? (
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Settings2 size={16} className="text-zinc-400" /> Customize Preferences
                </h3>
                <button onClick={() => setShowCustomize(false)} className="text-zinc-500 hover:text-white transition-colors p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">Strictly Necessary</span>
                    <span className="text-xs text-zinc-500 mt-1">Required for the website to function.</span>
                  </div>
                  <div className="w-8 h-4 rounded-full bg-sky-500/50 flex items-center p-0.5 opacity-50 cursor-not-allowed">
                    <div className="w-3 h-3 rounded-full bg-white transform translate-x-4 shadow-sm" />
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">Analytics</span>
                    <span className="text-xs text-zinc-500 mt-1">Helps us understand how visitors interact with the matrix.</span>
                  </div>
                  <button onClick={() => togglePreference('analytics')} className={`w-8 h-4 rounded-full transition-colors duration-300 flex items-center p-0.5 ${preferences.analytics ? 'bg-sky-500' : 'bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${preferences.analytics ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">Personalization</span>
                    <span className="text-xs text-zinc-500 mt-1">Used to tailor your visualizer experience.</span>
                  </div>
                  <button onClick={() => togglePreference('personalization')} className={`w-8 h-4 rounded-full transition-colors duration-300 flex items-center p-0.5 ${preferences.personalization ? 'bg-sky-500' : 'bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${preferences.personalization ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <button onClick={handleSavePreferences} className="w-full py-2.5 mt-2 bg-white text-black text-sm font-medium rounded-xl hover:bg-zinc-200 transition-colors">
                Save Preferences
              </button>
            </div>
          ) : (
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
                  <Cookie className="w-4 h-4 text-zinc-300" />
                </div>
                <h3 className="text-white font-medium">Telemetry & Cookies</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                We use strictly necessary cookies to keep the AlgoLib engine running, and optional analytics to monitor system telemetry.
                <Link to="/cookies" className="text-white ml-1 hover:underline underline-offset-2">Read policy.</Link>
              </p>

              <div className="flex flex-col gap-2 mt-2">
                <button onClick={handleAcceptAll} className="w-full py-2.5 bg-white text-black text-sm font-medium rounded-xl hover:bg-zinc-200 transition-colors">
                  Accept All
                </button>
                <div className="flex gap-2">
                  <button onClick={handleDecline} className="flex-1 py-2.5 bg-transparent border border-white/[0.1] text-white text-sm font-medium rounded-xl hover:bg-white/[0.05] transition-colors">
                    Decline Optional
                  </button>
                  <button onClick={() => setShowCustomize(true)} className="px-4 py-2.5 bg-transparent border border-white/[0.1] text-zinc-400 hover:text-white text-sm font-medium rounded-xl hover:bg-white/[0.05] transition-colors flex items-center justify-center">
                    <Settings2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const UnauthenticatedLanding = LandingPage;

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  const publicRoutes = ['/terms', '/privacy', '/cookies', '/developer', '/support', '/docs', '/compiler', '/visualizer', '/discover', '/testimonials'];
  const isPublicRoute = publicRoutes.includes(location.pathname.replace(/\/$/, '')) || location.pathname.startsWith('/blog/');

  const getCleanPath = (path: string) => {
    if (path.startsWith('/view/')) return 'snippet_library';
    if (path.startsWith('/visualizer')) return 'visualizer_ll';
    return path;
  };

  const activePath = getCleanPath(location.pathname);

  useActivityTracker(activePath, user ? {
    uid: user.uid,
    email: user.email || "Unknown",
    displayName: user.displayName || "Anonymous"
  } : null);

  useEffect(() => {
    if (!location.pathname.includes('/visualizer')) {
      setTrackedActivity(activePath);
    }
  }, [location.pathname, activePath]);

  if (loading) return <ModuleLoader />;

  if (!user && !isPublicRoute) {
    if (location.pathname !== "/") {
      return <Navigate to="/" replace />;
    }
    return <UnauthenticatedLanding />;
  }

  if (user && profile && profile.is_profile_complete === false) {
    if (location.pathname !== '/edit-profile') {
      return <Navigate to="/edit-profile" replace state={{ isFirstTime: true }} />;
    }
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  const handleLoginRequest = () => {
    executeGoogleSignIn();
  };

  return (
    <Suspense fallback={<ModuleLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/support" element={<Support />} />
        <Route path="/view/:id" element={<SnippetView />} />
        <Route path="/visualizer" element={<Visualizer />} />
        <Route path="/snippet-visualizer" element={<SnippetVisualizer />} />
        <Route path="/ai-visualizer" element={<DynamicVisualizerEngine />} />
        <Route path="/developer" element={<Developer />} />
        <Route path="/discussion" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/contests" element={<Contests />} />
        <Route path="/contest/:contestId" element={<ContestPanel user={user} onLoginRequest={handleLoginRequest} />} />
        <Route path="/compiler" element={<Compiler />} />
        <Route path="/vectoris" element={<Vectoris />} />
        <Route path="/quiz/:id" element={<Quiz />} />
        <Route path="/quiz-forge" element={<QuizForge />} />
        <Route path="/quiz-panel" element={<QuizPanel />} />
        <Route path="/dsa-sheet" element={<DSASheet />} />
        <Route path="/cp-sheet" element={<CPSheet />} />
        <Route path="/sheets" element={<Sheets />} />
        <Route path="/topic/:slug" element={<TopicDetail />} />

        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/status" element={<Status />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};


const App = () => {
  useEffect(() => {
    const initializeVisit = async () => {
      try {
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const sessionKey = "algolib_session_active";
        const hasVisitedSession = sessionStorage.getItem(sessionKey);

        if (!isLocalhost && !hasVisitedSession) {
          await incrementVisitCount();
          sessionStorage.setItem(sessionKey, "true");
        }
      } catch (error) {
        console.error("Failed to increment visit count", error);
      }
    };
    initializeVisit();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {/*
              AuthProvider and CookieProvider live here — inside the same module
              boundary as BrowserRouter — so all hooks share the same deduped
              React instance.  They were previously in main.tsx, which caused
              the React dispatcher to be null in lazy-loaded chunks.
            */}
            <AuthProvider>
              <CookieProvider>
                <BrowserRouter>
                  <PWAUpdater />
                  <CookieConsent />
                  <AuthGuard>
                    <MaintenanceGuard>
                      <AppRoutes />
                    </MaintenanceGuard>
                  </AuthGuard>
                  <InstallPrompt />
                </BrowserRouter>
              </CookieProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;