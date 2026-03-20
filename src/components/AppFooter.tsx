import React from 'react';
import { Link } from 'react-router-dom';

const AppFooter = () => {
  return (
    <footer className="relative w-full z-20 bg-[#07090E] border-t border-white/[0.05] py-6 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500 font-sans">
      <div className="text-zinc-400 font-medium">
        © 2026 AlgoLib | All rights reserved.
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
        <Link to="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
        <Link to="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
        
        {/* Dispatches event to open the cookie consent panel */}
        <button onClick={() => window.dispatchEvent(new Event('openCookieConsent'))} className="hover:text-zinc-300 transition-colors cursor-pointer">
          Manage cookies
        </button>
        
        <Link to="/docs" className="hover:text-zinc-300 transition-colors">Docs</Link>
        <Link to="/support" className="hover:text-zinc-300 transition-colors cursor-pointer">Support</Link>
        <Link to="https://mail.google.com/mail/?view=cm&fs=1&to=prateeksinghrajawat2006@gmail.com&subject=Connect%20with%20AlgoLib" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors cursor-pointer">Contact</Link>
      </div>
    </footer>
  );
};

export default AppFooter;