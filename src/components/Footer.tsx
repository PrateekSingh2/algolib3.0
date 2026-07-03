import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronRight, MapPin, Linkedin, Instagram, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCookieConsent } from '@/contexts/CookieContext';
import { motion } from 'framer-motion';

interface FooterProps {
  onRestrictedClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onRestrictedClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCookieConsent } = useCookieConsent();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, path: string, isRestricted: boolean) => {
    e.preventDefault();
    if (isRestricted && !user) {
      if (onRestrictedClick) onRestrictedClick();
    } else if (path.startsWith('http')) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else if (path.startsWith('/')) {
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full relative pt-16 md:pt-20 pb-8 z-20 overflow-hidden font-sans selection:bg-cyan-500/30 bg-white/40 backdrop-blur-md dark:bg-[#02040A]">
      
      {/* ─── Premium Cinematic Noise Texture ─── */}
      <div 
        className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-screen z-0" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />

      {/* ─── Premium Animated Top Border ─── */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-slate-200 dark:bg-white/[0.05] z-0" />
      <motion.div 
        animate={{ x: ['-100%', '300%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 w-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 z-0"
      />
      
      {/* ─── Architectural Grid Background ─── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_40%,#000_40%,transparent_100%)] pointer-events-none z-0" />

      {/* ─── Diagonal Sweeping Light Beam ─── */}
      <motion.div 
        animate={{ left: ['-100%', '200%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute top-0 w-[600px] h-full bg-gradient-to-r from-transparent via-cyan-500/[0.04] to-transparent skew-x-[-45deg] pointer-events-none z-0"
      />

      {/* ─── Aurora Mesh Gradients ─── */}
      {/* Top Right: Cyan/Emerald */}
      <motion.div 
        animate={{ y: [0, -30, 0], x: [0, 20, 0], scale: [1, 1.05, 1] }} 
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[30%] -right-[10%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-cyan-500/15 to-emerald-500/5 blur-[120px] pointer-events-none mix-blend-screen z-0" 
      />
      
      {/* Bottom Left: Deep Indigo/Violet */}
      <motion.div 
        animate={{ y: [0, 40, 0], x: [0, -30, 0], scale: [1, 1.1, 1] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-[40%] -left-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-indigo-600/15 to-violet-600/5 blur-[140px] pointer-events-none mix-blend-screen z-0" 
      />

      {/* Center Ambient Glow: Sky Blue */}
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full bg-sky-500/5 blur-[100px] pointer-events-none z-0" 
      />

      {/* ─── Floating Geometric Wireframes ─── */}
      {/* Floating Ring */}
      <motion.div 
        animate={{ rotate: 360, y: [0, 25, 0] }} 
        transition={{ rotate: { duration: 60, repeat: Infinity, ease: "linear" }, y: { duration: 12, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute top-[10%] right-[15%] w-[400px] h-[400px] border border-slate-200 dark:border-white/[0.03] rounded-full pointer-events-none z-0"
      />
      {/* Floating Square */}
      <motion.div 
        animate={{ rotate: -360, y: [0, -30, 0] }} 
        transition={{ rotate: { duration: 80, repeat: Infinity, ease: "linear" }, y: { duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 } }}
        className="absolute bottom-[10%] left-[12%] w-[300px] h-[300px] border border-slate-200 dark:border-white/[0.03] rounded-[40px] pointer-events-none z-0"
      />
      {/* Floating Hexagon (SVG) */}
      <motion.div 
        animate={{ rotate: 360, y: [0, -20, 0], x: [0, 20, 0] }} 
        transition={{ rotate: { duration: 90, repeat: Infinity, ease: "linear" }, y: { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }, x: { duration: 15, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute top-[40%] right-[30%] w-[150px] h-[150px] pointer-events-none opacity-20 z-0"
      >
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full text-cyan-400">
          <polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" />
        </svg>
      </motion.div>

      {/* ─── Drifting Particles ─── */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ 
            y: [0, -150 - Math.random() * 100], 
            x: [0, (Math.random() - 0.5) * 50],
            opacity: [0, 0.4, 0] 
          }}
          transition={{ 
            duration: 8 + Math.random() * 7, 
            repeat: Infinity, 
            ease: "linear", 
            delay: Math.random() * 5 
          }}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full blur-[1px] pointer-events-none z-0"
          style={{ 
            left: `${10 + Math.random() * 80}%`, 
            top: `${80 + Math.random() * 20}%` 
          }}
        />
      ))}

      {/* ─── Main Content ─── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 mb-10 md:mb-12">
          
          {/* ─── Brand Column ─── */}
          <div className="w-full lg:w-[28%] flex flex-col items-center lg:items-start text-center lg:text-left pr-0 lg:pr-6">
            <div className="flex items-center gap-3 mb-5 md:mb-6 group cursor-default">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 dark:from-white/10 to-white dark:to-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.2)] backdrop-blur-md group-hover:shadow-[0_0_35px_rgba(6,182,212,0.4)] transition-all duration-500">
                <Zap className="text-cyan-500 dark:text-cyan-400 w-5 h-5 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <span className="font-extrabold text-2xl text-slate-800 dark:text-white tracking-tight drop-shadow-md">ALGO<span className="text-slate-500 dark:text-zinc-500 font-semibold transition-colors duration-500 group-hover:text-cyan-500/70">LIB</span></span>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-xs leading-relaxed">
              The elite ecosystem for algorithm visualization, code optimization, and architectural systems design. Build your technical intuition.
            </p>

            {/* Address Block */} 
            <div className="w-full flex items-center justify-center lg:justify-start gap-2.5 order-2 mt-7 bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] p-3 rounded-xl backdrop-blur-sm w-fit hover:bg-white/80 dark:hover:bg-white/[0.04] transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
              <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                <MapPin size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
              </div>
              <span className="text-[12px] font-medium tracking-wide text-slate-700 dark:text-zinc-300">
                DD Nagar, Gwalior, Madhya Pradesh, India 474004
              </span>
            </div>
          </div>

          {/* ─── Links Grid ─── */}
          <div className="w-full lg:w-[72%] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-10 mt-2 lg:mt-0">
            
            {/* 1. Ecosystem */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="text-slate-900 dark:text-white text-[13px] font-bold tracking-wider uppercase mb-4 md:mb-5 opacity-90 drop-shadow-sm">Ecosystem</h4>
              <ul className="space-y-3.5 flex flex-col items-center md:items-start">
                <FooterLink name="Visualizer" path="/visualizer" isRestricted={true} onClick={handleLinkClick} />
                <FooterLink name="Online Compiler" path="/compiler" isRestricted={true} onClick={handleLinkClick} />
                <FooterLink name="Vectoris AI" path="/vectoris" isRestricted={true} onClick={handleLinkClick} />
                <FooterLink name="Developer API" path="/developer" isRestricted={false} onClick={handleLinkClick} />
              </ul>
            </div>

            {/* 2. Platform */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="text-slate-900 dark:text-white text-[13px] font-bold tracking-wider uppercase mb-4 md:mb-5 opacity-90 drop-shadow-sm">Platform</h4>
              <ul className="space-y-3.5 flex flex-col items-center md:items-start">
                <FooterLink name="Community" path="/discussion" isRestricted={true} onClick={handleLinkClick} />
                <FooterLink name="News & Research" path="https://discover-algolib.netlify.app/" isRestricted={false} onClick={handleLinkClick} />
                <FooterLink name="Documentation" path="/docs" isRestricted={false} onClick={handleLinkClick} />
                <FooterLink name="Support" path="/support" isRestricted={false} onClick={handleLinkClick} />
              </ul>
            </div>

            {/* 3. Curriculum */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="text-slate-900 dark:text-white text-[13px] font-bold tracking-wider uppercase mb-4 md:mb-5 opacity-90 drop-shadow-sm">Curriculum</h4>
              <ul className="space-y-3.5 flex flex-col items-center md:items-start">
                <FooterLink name="Master Notes" path="/notes" isRestricted={true} onClick={handleLinkClick} />
                <FooterLink name="DSA Sheet" path="/dsa-sheet" isRestricted={true} onClick={handleLinkClick} />
                <FooterLink name="Live Contests" path="/contests" isRestricted={true} onClick={handleLinkClick} />
                <FooterLink name="Quiz Panel" path="/quiz-panel" isRestricted={true} onClick={handleLinkClick} />
              </ul>
            </div>

            {/* 4. Legal */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="text-slate-900 dark:text-white text-[13px] font-bold tracking-wider uppercase mb-4 md:mb-5 opacity-90 drop-shadow-sm">Legal</h4>
              <ul className="space-y-3.5 flex flex-col items-center md:items-start">
                <FooterLink name="Testimonials" path="/testimonials" isRestricted={false} onClick={handleLinkClick} />
                <FooterLink name="Terms of Service" path="/terms" isRestricted={false} onClick={handleLinkClick} />
                <FooterLink name="Privacy Policy" path="/privacy" isRestricted={false} onClick={handleLinkClick} />
                <FooterLink name="Cookie Policy" path="/cookies" isRestricted={false} onClick={handleLinkClick} />
                <li>
                  <button onClick={openCookieConsent} className="group flex items-center justify-center md:justify-start text-[13.5px] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors w-fit">
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 text-cyan-600 dark:text-cyan-400 transition-all duration-300 ease-out hidden md:block" />
                    <span className="transform transition-transform duration-300 ease-out md:group-hover:translate-x-1.5">Manage Cookies</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* 5. Socials */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left col-span-2 sm:col-span-1 md:col-span-1">
              <h4 className="text-slate-900 dark:text-white text-[13px] font-bold tracking-wider uppercase mb-4 md:mb-5 opacity-90 drop-shadow-sm">Socials</h4>
              <ul className="space-y-3.5 flex flex-col items-center md:items-start">
                <SocialTextLink href="https://www.linkedin.com/company/algolib-official/" icon={<Linkedin size={15} />} label="LinkedIn" />
                <SocialTextLink href="https://www.instagram.com/algolib.official/" icon={<Instagram size={15} />} label="Instagram" />
                <SocialTextLink href="https://mail.google.com/mail/?view=cm&fs=1&to=teamalgolib@gmail.com&subject=Connect%20with%20AlgoLib" icon={<Mail size={15} />} label="Email" />
              </ul>
            </div>

          </div>
        </div>
        
        {/* ─── Bottom Bar ─── */}
        <div className="pt-6 md:pt-8 border-t border-slate-200 dark:border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
          
          {/* Copyright */}
          <div className="w-full md:w-1/3 flex justify-center md:justify-start order-3 md:order-1">
            <p className="text-slate-500 dark:text-zinc-500 text-[12px] font-medium tracking-wide">
              &copy; {new Date().getFullYear()} AlgoLib. All rights reserved.
            </p>
          </div>
          
          {/* Elite SaaS Status Indicator */}
          <div className="w-full md:w-1/3 flex justify-center md:justify-end order-1 md:order-3">
            <div className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl hover:bg-white/80 dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all cursor-default w-fit">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
              </div>
              <a href="/status" target="_blank" rel="noreferrer" aria-label="Status" className="text-[11px] text-slate-700 dark:text-zinc-300 font-mono tracking-wide uppercase">All systems operational</a>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

// ─── Subcomponents ───

const FooterLink = ({ name, path, isRestricted, onClick }: { name: string; path: string; isRestricted: boolean; onClick: (e: React.MouseEvent<HTMLAnchorElement>, path: string, isRestricted: boolean) => void }) => (
  <li>
    <a 
      href={path} 
      onClick={(e) => onClick(e, path, isRestricted)} 
      className="group flex items-center justify-center md:justify-start text-[13.5px] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
    >
      <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 text-cyan-600 dark:text-cyan-400 transition-all duration-300 ease-out hidden md:block" />
      <span className="transform transition-transform duration-300 ease-out md:group-hover:translate-x-1.5">{name}</span>
    </a>
  </li>
);

const SocialTextLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => (
  <li>
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer" 
      className="group flex items-center justify-center md:justify-start gap-2.5 text-[13.5px] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
    >
      <span className="text-slate-500 dark:text-zinc-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300">
        {icon}
      </span>
      <span className="transform transition-transform duration-300 ease-out md:group-hover:translate-x-1">
        {label}
      </span>
    </a>
  </li>
);

export default Footer;