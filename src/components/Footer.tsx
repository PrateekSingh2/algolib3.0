import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Eye, Activity } from "lucide-react";
import { getVisitCount } from "@/lib/algorithms";

const Footer = () => {
  const [visitCount, setVisitCount] = useState(0);

  // Fetch the live visit count
  useEffect(() => {
    getVisitCount().then(setVisitCount).catch(console.error);
  }, []);

  return (
    <footer className="border-t border-white/10 bg-[#030308] pt-16 pb-8 mt-auto z-20 relative w-full">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Main Footer Content: Grid Layout for strict organization */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-16">
          
          {/* Brand Column (Takes up half the space on desktop) */}
          <div className="md:col-span-6 flex flex-col items-start">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <Sparkles className="h-6 w-6 text-[#00d2ff] group-hover:animate-pulse" />
              <span className="text-xl font-bold tracking-tight text-white">
                Algo<span className="text-[#00d2ff]">Lib</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
              The definitive ecosystem for algorithm visualization, code optimization, and architectural discussions.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
              <Activity className="w-3 h-3 text-green-400" />
              System Version 2.0.4
            </div>
          </div>

          {/* Links Column 1: Platform */}
          <div className="md:col-span-3 flex flex-col">
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-5">Platform</h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-400">
              <li><Link to="/" className="hover:text-[#00d2ff] transition-colors duration-200">Home</Link></li>
              <li><Link to="/visualizer" className="hover:text-[#00d2ff] transition-colors duration-200">Visualizer</Link></li>
              <li><Link to="/docs" className="hover:text-[#00d2ff] transition-colors duration-200">Documentation</Link></li>
            </ul>
          </div>

          {/* Links Column 2: Ecosystem */}
          <div className="md:col-span-3 flex flex-col">
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-5">Ecosystem</h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-400">
              <li><Link to="/developer" className="hover:text-[#00d2ff] transition-colors duration-200">Developer Profile</Link></li>
              <li><Link to="/discussion" className="hover:text-[#00d2ff] transition-colors duration-200">Community Forum</Link></li>
              <li><Link to="/contributors" className="hover:text-[#00d2ff] transition-colors duration-200">Contributors</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & System Status */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} AlgoLib. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6 text-sm font-mono">
            {/* Online Status Indicator */}
            <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]" />
              <span className="text-xs tracking-wider">SYSTEM ONLINE</span>
            </div>
            
            {/* Visit Counter */}
            <div className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-default">
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