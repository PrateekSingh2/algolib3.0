import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Link, Navigate, useNavigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/contexts/AuthContext";
import { CookieProvider } from "./contexts/CookieContext";

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

import { incrementVisitCount } from "@/lib/algorithms";
import InstallPrompt from "@/components/InstallPrompt";
import { useActivityTracker, setTrackedActivity } from "@/hooks/useActivityTracker";

import AppFooter from "@/components/AppFooter";
import OrbitalLoader from "@/components/OrbitalLoader";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth, executeGoogleSignIn, executeGithubSignIn } from "@/contexts/AuthContext";
import { useCookieConsent } from "./contexts/CookieContext";
import Navbar from "./components/Navbar";

// ─── ALL PAGE COMPONENTS ARE LAZY-LOADED ──────────────────────────────────────
// Nothing below ships in the initial JS bundle — each chunk is downloaded
// only when the user navigates to the corresponding route.
const Index = lazy(() => import("./pages/Index"));
const LandingPage = lazy(() => import("./pages/landing/LandingPage"));
const Vectoris = lazy(() => import("./pages/vectoris/Vectoris"));
const VectorisWidget = lazy(() => import("./components/VectorisWidget"));
const Quiz = lazy(() => import("./pages/quiz/Quiz"));
const QuizPanel = lazy(() => import("./pages/quiz/QuizPanel"));
const QuizForge = lazy(() => import("./pages/quiz/QuizForge"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const SnippetView = lazy(() => import("./pages/SnippetView"));
const VisualizerHub = lazy(() => import("./pages/visualizer-dsa/VisualizerHub"));
const Visualizer = lazy(() => import("./pages/visualizer-dsa/Visualizer"));
const SnippetVisualizer = lazy(() => import("./pages/visualizer-code/SnippetVisualizer"));
const DynamicVisualizerEngine = lazy(() => import("./pages/visualizer-ai/DynamicVisualizerEngine"));
const Developer = lazy(() => import("./pages/Developer"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Status = lazy(() => import("./pages/Status/status"));
const Docs = lazy(() => import("./pages/Docs"));
const Notes = lazy(() => import("./pages/notes/Notes"));
const Support = lazy(() => import("./pages/legals/Support"));
const Community = lazy(() => import("./components/Community"));
const EditProfile = lazy(() => import("./pages/userprofile/EditProfile"));
const PublicProfile = lazy(() => import("./pages/userprofile/PublicProfile"));
const Settings = lazy(() => import("./pages/Settings"));
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
  { id: '/docs', name: 'Documentation' }, { id: '/notes', name: 'AlgoLib Notes' }, { id: '/sheets', name: 'Practice Sheets' },
  { id: '/settings', name: 'Settings' }
];

const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [maintainedRoutes, setMaintainedRoutes] = useState<string[] | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(firestoreDB, "system_settings", "maintenance"), (docSnap) => {
      if (docSnap.exists()) {
        setMaintainedRoutes(docSnap.data().activeRoutes || []);
      } else {
        setMaintainedRoutes([]);
      }
    });
    return () => unsub();
  }, []);

  // Absolute safety override: Never lock out the admin panel.
  if (location.pathname.startsWith('/hq')) {
    return <>{children}</>;
  }

  // Do not block the initial render while fetching from Firestore.
  // This drastically improves FCP/LCP metrics for Lighthouse.
  const isLocked = maintainedRoutes?.some(route => {
    if (route === '/') return location.pathname === '/'; // Exact match for home
    return location.pathname.startsWith(route); // Sub-path match for other tools
  });

  if (isLocked) {
    const availableModules = SYSTEM_MODULES.filter(m => !maintainedRoutes!.includes(m.id));
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
    <>
      {isCookieConsentOpen && (
        <div
          role="dialog"
          aria-label="Cookie consent preferences"
          aria-modal="true"
          className="fixed bottom-14 left-6 md:left-10 z-[999] w-[380px] max-w-[calc(100vw-48px)] bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300"
        >
          {showCustomize ? (
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                  <Settings2 size={16} className="text-slate-500 dark:text-zinc-400" /> Customize Preferences
                </h3>
                <button onClick={() => setShowCustomize(false)} aria-label="Close cookie preferences" className="text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-colors p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Strictly Necessary</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-500 mt-1">Required for the website to function.</span>
                  </div>
                  <div className="w-8 h-4 rounded-full bg-sky-500/50 flex items-center p-0.5 opacity-50 cursor-not-allowed">
                    <div className="w-3 h-3 rounded-full bg-white transform translate-x-4 shadow-sm" />
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Analytics</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-500 mt-1">Helps us understand how visitors interact with the matrix.</span>
                  </div>
                  <button onClick={() => togglePreference('analytics')} aria-label="Toggle analytics cookies" className={`w-8 h-4 rounded-full transition-colors duration-300 flex items-center p-0.5 ${preferences.analytics ? 'bg-sky-500' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${preferences.analytics ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Personalization</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-500 mt-1">Used to tailor your visualizer experience.</span>
                  </div>
                  <button onClick={() => togglePreference('personalization')} aria-label="Toggle personalization cookies" className={`w-8 h-4 rounded-full transition-colors duration-300 flex items-center p-0.5 ${preferences.personalization ? 'bg-sky-500' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${preferences.personalization ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <button onClick={handleSavePreferences} className="w-full py-2.5 mt-2 bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors">
                Save Preferences
              </button>
            </div>
          ) : (
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center">
                  <Cookie className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
                </div>
                <h3 className="text-slate-900 dark:text-white font-medium">Telemetry & Cookies</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                We use strictly necessary cookies to keep the AlgoLib engine running, and optional analytics to monitor system telemetry.
                <Link to="/cookies" className="text-slate-900 dark:text-white ml-1 hover:underline underline-offset-2">Read policy.</Link>
              </p>

              <div className="flex flex-col gap-2 mt-2">
                <button onClick={handleAcceptAll} className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors">
                  Accept All
                </button>
                <div className="flex gap-2">
                  <button onClick={handleDecline} className="flex-1 py-2.5 bg-transparent border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors">
                    Decline Optional
                  </button>
                  <button onClick={() => setShowCustomize(true)} aria-label="Customize cookie preferences" className="px-4 py-2.5 bg-transparent border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors flex items-center justify-center">
                    <Settings2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Global React Error Caught:", error, errorInfo);
    // If it's a chunk load error from Vite/React.lazy, auto-reload once to fix the broken module graph
    if (error.message && (error.message.includes('Failed to fetch dynamically imported module') || error.message.includes('Load failed') || error.message.includes('loading chunk'))) {
      if (!sessionStorage.getItem('algolib_chunk_reloaded')) {
        sessionStorage.setItem('algolib_chunk_reloaded', 'true');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mb-6">
            <X size={32} className="text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3 tracking-tight">Render Error Intercepted</h1>
          <p className="text-zinc-400 text-sm mb-8 max-w-md">
            The application encountered an unexpected runtime failure. This typically happens when background updates invalidate cached modules.
          </p>
          <button
            onClick={() => {
              sessionStorage.removeItem('algolib_chunk_reloaded');
              window.location.reload();
            }}
            className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Hard Refresh Matrix
          </button>
          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl text-left max-w-2xl overflow-auto text-xs font-mono text-rose-300">
            {this.state.error?.toString()}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const UnauthenticatedLanding = LandingPage;


const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  const publicRoutes = ['/terms', '/privacy', '/cookies', '/developer', '/support', '/docs', '/compiler', '/visualizer', '/visualizer/code', '/discover', '/testimonials'];
  const isPublicRoute = publicRoutes.includes(location.pathname.replace(/\/$/, '')) ||
    location.pathname.startsWith('/blog/') ||
    location.pathname.startsWith('/user/') ||
    location.pathname.startsWith('/visualizer/dsa/');

  const getCleanPath = (path: string) => {
    if (path.startsWith('/view/')) return 'snippet_library';
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
        <Route path="/visualizer" element={<VisualizerHub />} />
        <Route path="/visualizer/dsa" element={<Navigate to="/visualizer/dsa/ll" replace />} />
        <Route path="/visualizer/dsa/:dsType" element={<Visualizer />} />
        <Route path="/visualizer/code" element={<SnippetVisualizer />} />
        <Route path="/visualizer/ai" element={<DynamicVisualizerEngine />} />

        {/* Legacy backwards compatibility */}
        <Route path="/snippet-visualizer" element={<Navigate to="/visualizer/code" replace />} />
        <Route path="/ai-visualizer" element={<Navigate to="/visualizer/ai" replace />} />
        <Route path="/developer" element={<Developer />} />
        <Route path="/discussion" element={<Community />} />
        <Route path="/user/:username" element={<PublicProfile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/:tab" element={<Settings />} />
        <Route path="/contests" element={<Contests />} />
        <Route path="/contest/:contestId" element={<ContestPanel user={user} onLoginRequest={handleLoginRequest} />} />
        <Route path="/compiler" element={<Compiler />} />
        <Route path="/vectoris" element={<Vectoris />} />
        <Route path="/vectoris/:id" element={<Vectoris />} />
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
                <GlobalErrorBoundary>
                  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <PWAUpdater />
                    <CookieConsent />
                    {/* VectorisWidget: isolated Suspense so it never blocks route rendering */}
                    <Suspense fallback={null}>
                      <VectorisWidget />
                    </Suspense>
                    {/*
                      TOP-LEVEL Suspense: must wrap AuthGuard AND MaintenanceGuard because
                      both can render lazy components (LandingPage, Maintenance) directly
                      outside of AppRoutes. Without this boundary, lazy throws propagate
                      to the root and pages never mount.
                    */}
                    <Suspense fallback={<ModuleLoader />}>
                      <AuthGuard>
                        <MaintenanceGuard>
                          <AppRoutes />
                        </MaintenanceGuard>
                      </AuthGuard>
                    </Suspense>
                    <InstallPrompt />
                  </BrowserRouter>
                </GlobalErrorBoundary>
              </CookieProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;