import React, { useEffect } from 'react';
import AppFooter from '@/components/AppFooter';
import Navbar from '@/components/Navbar';
import { useLocation, Link } from 'react-router-dom';
import { Scale, ShieldCheck, Cookie, ArrowLeft } from 'lucide-react';

const LegalLayout = ({ children, title, lastUpdated }: { children: React.ReactNode, title: string, lastUpdated: string }) => {
  const location = useLocation();

  // Scroll to top instantly when navigating to or switching between legal pages
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const links = [
    { path: '/terms', label: 'Terms of Service', icon: Scale },
    { path: '/privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { path: '/cookies', label: 'Cookie Policy', icon: Cookie },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#000000] text-slate-900 dark:text-white flex flex-col font-sans selection:bg-sky-500/20 dark:selection:bg-white/20">

      {/* INJECTED NAVBAR */}
      <Navbar />

      {/* Sleek Minimal Header (Adjusted pt from 24 to 32/40 to clear navbar) */}
      <div className="w-full bg-white dark:bg-[#050505] border-b border-slate-200 dark:border-white/[0.05] pt-32 md:pt-40 pb-12 md:pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-slate-300 dark:via-white/20 to-transparent"></div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-start gap-6">
          <div className="mb-4 md:mb-12">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.15] transition-all duration-300 text-sm font-medium group shadow-sm"
            >
              <ArrowLeft size={16} className="text-slate-400 dark:text-zinc-500 group-hover:text-sky-600 dark:group-hover:text-sky-400 group-hover:-translate-x-0.5 transition-all duration-300" />
              <span>Back to App</span>
            </Link>
          </div>
          
          <div>
            <h1 className="text-3xl md:text-5xl font-medium text-slate-900 dark:text-white mb-4 tracking-tight">{title}</h1>
            <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-[#00d2ff] animate-pulse"></span>
              <p className="text-slate-500 dark:text-white/50 font-mono text-[10px] tracking-widest uppercase">Effective Date: {lastUpdated}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 md:py-16 flex flex-col md:flex-row gap-8 md:gap-16">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          {/* Horizontally scrollable on mobile, Sticky vertical on desktop */}
          <nav className="sticky top-24 md:top-32 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 custom-scrollbar">
            <p className="hidden md:block text-[10px] font-mono text-slate-400 dark:text-white/40 uppercase tracking-[0.2em] mb-4 px-4">Legal Hub</p>
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-slate-100 dark:bg-white/[0.05] text-slate-900 dark:text-white font-medium border border-slate-200 dark:border-white/[0.05] shadow-sm dark:shadow-[0_0_15px_rgba(255,255,255,0.02)]' 
                      : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  <link.icon size={16} className={isActive ? 'text-slate-900 dark:text-white' : 'opacity-60'} />
                  <span className="text-sm whitespace-nowrap">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Legal Content Container */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default LegalLayout;