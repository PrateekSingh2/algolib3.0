import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Instagram, Linkedin, Mail, Zap, Bug } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FooterProps {
  onRestrictedClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onRestrictedClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string, isRestricted: boolean) => {
    if (isRestricted && !user) {
      e.preventDefault();
      if (onRestrictedClick) {
        onRestrictedClick();
      }
    } else if (path.startsWith('/')) {
      e.preventDefault();
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-[#030308] border-t border-white/[0.05] pt-16 md:pt-20 pb-8 md:pb-10 relative z-20 overflow-hidden font-sans">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      
      {/* Main Container - Reduced mb-16 to mb-8 to fix the extra gap */}
      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-12 lg:gap-8 mb-4">
        
        {/* Brand Column (Centered on mobile, Left on Desktop) */}
        <div className="w-full lg:w-2/5 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <Zap className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">ALGO<span className="text-zinc-500">LIB</span></span>
          </div>
          <p className="text-sm text-zinc-500 mb-8 max-w-xs leading-relaxed">
            The elite ecosystem for algorithm visualization, code optimization, and architectural systems design.
          </p>
          <div className="flex justify-center lg:justify-start gap-4">
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=prateeksinghrajawat2006@gmail.com&subject=Connect%20with%20AlgoLib" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors p-2 border border-white/20 hover:bg-white/5 rounded-md">
              <Mail size={18} />
            </a>
            <a href="https://www.linkedin.com/company/algolib-official/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-zinc-500 hover:text-white transition-colors p-2 border border-white/20 hover:bg-white/5 rounded-md">
              <Linkedin size={18} />
            </a>
            <a href="https://www.instagram.com/algolib.official/" target="_blank" rel="noreferrer" aria-label="Instagram" className="text-zinc-500 hover:text-white transition-colors p-2 border border-white/20 hover:bg-white/5 rounded-md">
              <Instagram size={18} />
            </a>
          </div>
        </div>

        {/* Links Grid (1 Column centered on mobile, 3 Columns left-aligned on sm/tablet/desktop) */}
        <div className="w-full lg:w-3/5 grid grid-cols-1 sm:grid-cols-3 gap-12 md:gap-12">
          
          {/* Column 1: Platform */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h4 className="text-white text-sm font-semibold mb-6 tracking-wide">Platform</h4>
            <ul className="space-y-4 text-sm text-zinc-500 flex flex-col items-center sm:items-start">
              <li><a href="/visualizer" onClick={(e) => handleLinkClick(e, '/visualizer', true)} className="hover:text-white transition-colors cursor-pointer block">Visualizer</a></li>
              <li><a href="/discussion" onClick={(e) => handleLinkClick(e, '/discussion', true)} className="hover:text-white transition-colors cursor-pointer block">Community</a></li>
              <li><a href="/notes" onClick={(e) => handleLinkClick(e, '/notes', true)} className="hover:text-white transition-colors cursor-pointer block">Notes</a></li>
            </ul>
          </div>

          {/* Column 2: Services */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h4 className="text-white text-sm font-semibold mb-6 tracking-wide">Service</h4>
            <ul className="space-y-4 text-sm text-zinc-500 flex flex-col items-center sm:items-start">
              <li><a href="/support" onClick={(e) => handleLinkClick(e, '/support', false)} className="hover:text-white transition-colors cursor-pointer block">Support</a></li>
              <li><a href="/docs" onClick={(e) => handleLinkClick(e, '/docs', false)} className="hover:text-white transition-colors cursor-pointer block">Documentation</a></li>
              <button onClick={() => window.dispatchEvent(new Event('openCookieConsent'))} className="hover:text-white transition-colors cursor-pointer block">
                Manage cookies
              </button>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h4 className="text-white text-sm font-semibold mb-6 tracking-wide">Legals</h4>
            <ul className="space-y-4 text-sm text-zinc-500 flex flex-col items-center sm:items-start w-full">
              <li><a href="/terms" onClick={(e) => handleLinkClick(e, '/terms', false)} className="hover:text-white transition-colors cursor-pointer block">Terms of Service</a></li>
              <li><a href="/privacy" onClick={(e) => handleLinkClick(e, '/privacy', false)} className="hover:text-white transition-colors cursor-pointer block">Privacy Policy</a></li>
              <li><a href="/cookies" onClick={(e) => handleLinkClick(e, '/cookies', false)} className="hover:text-white transition-colors cursor-pointer block">Cookie Policy</a></li>
            </ul>
          </div>

        </div>
      </div>
      
      {/* Bottom Bar: Stacked and Centered on mobile, Flex row on desktop */}
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/[0.05] flex flex-col-reverse md:flex-row items-center justify-between gap-6 md:gap-4">
        <p className="text-zinc-600 text-xs text-center md:text-left">
          &copy; {new Date().getFullYear()} AlgoLib | All rights reserved.
        </p>
        
        {/* Elite SaaS Status Indicator */}
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05]">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-xs text-zinc-400 font-mono">All systems operational</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;