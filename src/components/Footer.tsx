import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronRight, MapPin, Linkedin, Instagram, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCookieConsent } from '@/contexts/CookieContext';

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
    <footer className="w-full bg-[#030303] border-t border-white/[0.05] pt-16 md:pt-20 pb-8 relative z-20 overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* ─── Ambient Glow ─── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 mb-10 md:mb-12">
          
          {/* ─── Brand Column ─── */}
          <div className="w-full lg:w-[28%] flex flex-col items-center lg:items-start text-center lg:text-left relative z-10 pr-0 lg:pr-6">
            <div className="flex items-center gap-2 mb-5 md:mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <Zap className="text-cyan-400 w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">ALGO<span className="text-zinc-500 font-semibold">LIB</span></span>
            </div>
            
            <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
              The elite ecosystem for algorithm visualization, code optimization, and architectural systems design. Build your technical intuition.
            </p>

            {/* Address Block (Centered) */} 
            <div className="w-full flex items-center justify-center lg:justify-start gap-1.5 order-2 text-zinc-500 mt-4">
              <MapPin size={13} className="text-cyan-500 shrink-0" />
              <span className="text-[12px] font-medium tracking-wide text-center lg:text-left">
                DD Nagar, Gwalior, Madhya Pradesh, India 474004
              </span>
            </div>
          </div>

          {/* ─── Links Grid (5 Columns - Centered on Mobile, Left on Desktop) ─── */}
          <div className="w-full lg:w-[72%] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-10 relative z-10 mt-2 lg:mt-0">
            
            {/* 1. Ecosystem */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="text-white text-[13px] font-bold tracking-wider uppercase mb-4 md:mb-5 opacity-90">Ecosystem</h4>
              <ul className="space-y-3.5 flex flex-col items-center md:items-start">
                <FooterLink name="Visualizer" path="/visualizer" isRestricted={true} onClick={handleLinkClick} />
                <FooterLink name="Online Compiler" path="/compiler" isRestricted={true} onClick={handleLinkClick} />
                <FooterLink name="Vectoris AI" path="/vectoris" isRestricted={true} onClick={handleLinkClick} />
                <FooterLink name="Developer API" path="/developer" isRestricted={false} onClick={handleLinkClick} />
              </ul>
            </div>

            {/* 2. Platform */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="text-white text-[13px] font-bold tracking-wider uppercase mb-4 md:mb-5 opacity-90">Platform</h4>
              <ul className="space-y-3.5 flex flex-col items-center md:items-start">
                <FooterLink name="Community" path="/discussion" isRestricted={true} onClick={handleLinkClick} />
                {/* Updated URL for News & Research */}
                <FooterLink name="News & Research" path="https://discover-algolib.netlify.app/" isRestricted={false} onClick={handleLinkClick} />
                <FooterLink name="Documentation" path="/docs" isRestricted={false} onClick={handleLinkClick} />
                <FooterLink name="Support" path="/support" isRestricted={false} onClick={handleLinkClick} />
              </ul>
            </div>

            {/* 3. Curriculum */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="text-white text-[13px] font-bold tracking-wider uppercase mb-4 md:mb-5 opacity-90">Curriculum</h4>
              <ul className="space-y-3.5 flex flex-col items-center md:items-start">
                <FooterLink name="Master Notes" path="/notes" isRestricted={true} onClick={handleLinkClick} />
                <FooterLink name="DSA Sheet" path="/dsa-sheet" isRestricted={true} onClick={handleLinkClick} />
                <FooterLink name="Live Contests" path="/contests" isRestricted={true} onClick={handleLinkClick} />
                <FooterLink name="Quiz Panel" path="/quiz-panel" isRestricted={true} onClick={handleLinkClick} />
              </ul>
            </div>

            {/* 4. Legal */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="text-white text-[13px] font-bold tracking-wider uppercase mb-4 md:mb-5 opacity-90">Legal</h4>
              <ul className="space-y-3.5 flex flex-col items-center md:items-start">
                <FooterLink name="Terms of Service" path="/terms" isRestricted={false} onClick={handleLinkClick} />
                <FooterLink name="Privacy Policy" path="/privacy" isRestricted={false} onClick={handleLinkClick} />
                <FooterLink name="Cookie Policy" path="/cookies" isRestricted={false} onClick={handleLinkClick} />
                <li>
                  <button onClick={openCookieConsent} className="group flex items-center justify-center md:justify-start text-[13.5px] text-zinc-500 hover:text-zinc-200 transition-colors w-fit">
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 text-cyan-500 transition-all duration-300 ease-out hidden md:block" />
                    <span className="transform transition-transform duration-300 ease-out md:group-hover:translate-x-1.5">Manage Cookies</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* 5. Socials */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left col-span-2 sm:col-span-1 md:col-span-1">
              <h4 className="text-white text-[13px] font-bold tracking-wider uppercase mb-4 md:mb-5 opacity-90">Socials</h4>
              <ul className="space-y-3.5 flex flex-col items-center md:items-start">
                <SocialTextLink href="https://www.linkedin.com/company/algolib-official/" icon={<Linkedin size={15} />} label="LinkedIn" />
                <SocialTextLink href="https://www.instagram.com/algolib.official/" icon={<Instagram size={15} />} label="Instagram" />
                <SocialTextLink href="https://mail.google.com/mail/?view=cm&fs=1&to=teamalgolib@gmail.com&subject=Connect%20with%20AlgoLib" icon={<Mail size={15} />} label="Email" />
              </ul>
            </div>

          </div>
        </div>
        
        {/* ─── Bottom Bar ─── */}
        <div className="pt-6 md:pt-8 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
          
          {/* Copyright */}
          <div className="w-full md:w-1/3 flex justify-center md:justify-start order-3 md:order-1">
            <p className="text-zinc-600 text-[11px] md:text-xs font-medium">
              &copy; {new Date().getFullYear()} AlgoLib. All rights reserved.
            </p>
          </div>
          
          {/* Elite SaaS Status Indicator */}
          <div className="w-full md:w-1/3 flex justify-center md:justify-end order-1 md:order-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05] shadow-inner backdrop-blur-md hover:bg-white/[0.04] transition-colors cursor-default w-fit">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono tracking-wide">All systems operational</span>
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
      className="group flex items-center justify-center md:justify-start text-[13.5px] text-zinc-500 hover:text-zinc-200 transition-colors w-fit"
    >
      <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 text-cyan-500 transition-all duration-300 ease-out hidden md:block" />
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
      className="group flex items-center justify-center md:justify-start gap-2 text-[13.5px] text-zinc-500 hover:text-zinc-200 transition-colors w-fit"
    >
      <span className="text-zinc-400 group-hover:text-cyan-400 transition-colors duration-300">
        {icon}
      </span>
      <span className="transform transition-transform duration-300 ease-out md:group-hover:translate-x-1">
        {label}
      </span>
    </a>
  </li>
);

export default Footer;