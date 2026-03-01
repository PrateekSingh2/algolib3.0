import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Eye, Activity, Instagram, Mail } from "lucide-react";
import { getVisitCount } from "@/lib/algorithms";

const Footer = () => {
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    getVisitCount().then(setVisitCount).catch(console.error);
  }, []);

  return (
    <footer className="border-t border-white/10 bg-[#030308] pt-16 pb-8 mt-auto z-20 relative w-full">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-16">
          
          {/* Brand Column */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <Sparkles className="h-6 w-6 text-[#00d2ff] group-hover:animate-pulse" />
              <span className="text-xl font-bold tracking-tight text-white">
                Algo<span className="text-[#00d2ff]">Lib</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6 text-center md:text-left">
              The definitive ecosystem for algorithm visualization, code optimization, and architectural discussions.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
              <Activity className="w-3 h-3 text-green-400" />
              System Version 2.0.4
            </div>
          </div>

          {/* Links Column 1: Platform */}
          <div className="md:col-span-2 flex flex-col items-center md:items-start">
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-5">Platform</h3>
            <ul className="flex flex-col items-center md:items-start gap-3 text-sm text-slate-400">
              <li><Link to="/" className="hover:text-[#00d2ff] transition-colors">Home</Link></li>
              <li><Link to="/visualizer" className="hover:text-[#00d2ff] transition-colors">Visualizer</Link></li>
              <li><Link to="/docs" className="hover:text-[#00d2ff] transition-colors">Documentation</Link></li>
            </ul>
          </div>

          {/* Links Column 2: Ecosystem */}
          <div className="md:col-span-2 flex flex-col items-center md:items-start">
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-5">Ecosystem</h3>
            <ul className="flex flex-col items-center md:items-start gap-3 text-sm text-slate-400">
              <li><Link to="/developer" className="hover:text-[#00d2ff] transition-colors">Developer Profile</Link></li>
              <li><Link to="/discussion" className="hover:text-[#00d2ff] transition-colors">Community Forum</Link></li>
              <li>
                <a 
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=prateeksinghrajawat2006@gmail.com&subject=Bug%20Report" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[#00d2ff] transition-colors"
                >
                  Report bug
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column with LARGE ICONS */}
          <div className="md:col-span-3 flex flex-col items-center md:items-start">
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-5">Contact</h3>
            <div className="flex gap-4">
              {/* Large Instagram Icon */}
              <a 
                href="https://www.instagram.com/algolib.official/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00d2ff]/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[#00d2ff]/10"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6 text-slate-400 group-hover:text-[#00d2ff] transition-colors" />
                <div className="absolute inset-0 rounded-2xl bg-[#00d2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              {/* Large Mail Icon */}
              <a 
                href="https://mail.google.com/mail/?view=cm&fs=1&to=prateeksinghrajawat2006@gmail.com&subject=Connect%20with%20AlgoLib"
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00d2ff]/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[#00d2ff]/10"
                aria-label="Email"
              >
                <Mail className="w-6 h-6 text-slate-400 group-hover:text-[#00d2ff] transition-colors" />
                <div className="absolute inset-0 rounded-2xl bg-[#00d2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} AlgoLib. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6 text-sm font-mono">
            <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]" />
              <span className="text-xs tracking-wider">SYSTEM ONLINE</span>
            </div>
            
            <div className="flex items-center gap-2 text-slate-400">
              <Eye className="h-4 w-4" />
              <span>{visitCount.toLocaleString()} HITS</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;