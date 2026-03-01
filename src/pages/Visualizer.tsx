import React, { useState, useEffect } from 'react';
import { 
  GitCommit, Layers, ArrowRightLeft, BarChart3, 
  Database, Activity, Cpu, Network, Binary, 
  Smartphone, PanelLeftClose, PanelLeftOpen,
  BookOpen, ArrowRight, CheckCircle2, Maximize2, Zap, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Assumes you have these files.
import LinkedListVisualizer from './LinkedListVisualizer';
import StackVisualizer from './StackVisualizer';
import QueueVisualizer from './QueueVisualizer';
import SortingVisualizer from './SortingVisualizer';
import BSTVisualizer from './BSTVisualizer';
import GraphVisualizer from './GraphVisualizer';
import Navbar from '@/components/Navbar';
import GlobalRibbon from '@/components/GlobalRibbon';

// --- ENHANCED ALIEN BACKGROUND ---
const AlienBackground = () => (
  <div className="fixed inset-0 -z-10 bg-[#020205] overflow-hidden">
     {/* Deep Space Gradients */}
     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00f5ff]/10 via-[#050510] to-[#000000]" />
     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#9d00ff]/10 via-transparent to-transparent opacity-50" />
     
     {/* Tech Grid */}
     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]" />
     
     {/* Animated Radar Scanline */}
     <motion.div 
        animate={{ y: ['-100%', '200%'] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
        className="absolute top-0 left-0 w-full h-[20vh] bg-gradient-to-b from-transparent via-[#00f5ff]/5 to-transparent pointer-events-none"
     />
  </div>
);

const Visualizer = () => {
  const [activeTab, setActiveTab] = useState('ll');
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  // Auto-hide welcome screen after some time (optional, left manual here for UX)
  useEffect(() => {
     // System boot sound/effect could go here
  }, []);

  const MENU = [
    { id: 'll', label: 'LINKED_LIST', icon: <GitCommit size={18} />, component: <LinkedListVisualizer /> },
    { id: 'stack', label: 'STACK_LIFO', icon: <Layers size={18} />, component: <StackVisualizer /> },
    { id: 'queue', label: 'QUEUE_FIFO', icon: <ArrowRightLeft size={18} />, component: <QueueVisualizer /> },
    { id: 'sorting', label: 'SORTING_ALG', icon: <BarChart3 size={18} />, component: <SortingVisualizer /> },
    { id: 'bst', label: 'BINARY_TREE', icon: <Binary size={18} />, component: <BSTVisualizer /> },
    { id: 'graph', label: 'GRAPH_NET', icon: <Network size={18} />, component: <GraphVisualizer /> },
  ];

  return (
    <>
      <AlienBackground />
      
      {/* --- NAVBAR --- */}
      <div className='fixed top-0 left-0 right-0 z-[200]'>
        <Navbar />
        <GlobalRibbon />
      </div>

      {/* --- MOBILE WARNING SCREEN --- */}
      <div className="flex lg:hidden h-screen flex-col items-center justify-center p-8 text-center relative z-50 pt-20">
          <div className="p-6 rounded-full bg-[#00f5ff]/5 border border-[#00f5ff]/20 mb-6 relative group">
             <div className="absolute inset-0 bg-[#00f5ff]/30 blur-2xl rounded-full animate-pulse" />
             <Smartphone size={48} className="text-[#00f5ff] relative z-10" />
             <XIconOverlay />
          </div>
          <h2 className="text-2xl font-black text-white font-mono tracking-tighter mb-2">
            MOBILE_VIEW <span className="text-red-500 animate-pulse">RESTRICTED</span>
          </h2>
          <p className="text-gray-400 text-sm font-mono leading-relaxed max-w-xs mb-8">
            Tactical Algorithm Visualizer requires a massive viewport.<br/><br/>Deploy on a desktop terminal to proceed.
          </p>
      </div>

      {/* --- DESKTOP APP (Visible on lg+) --- */}
      <div className="hidden lg:flex flex-col h-screen w-full text-white font-sans overflow-hidden relative pt-[72px]">
        
        {/* --- SYSTEM BOOT MODAL (Welcome) --- */}
        {/* --- SYSTEM BOOT MODAL (Welcome) --- */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="absolute inset-0 z-[300] flex items-center justify-center bg-[#020205]/80 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 30, rotateX: 15 }}
                animate={{ scale: 1, y: 0, rotateX: 0 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                // CHANGED: max-w-3xl -> max-w-2xl for a sleeker profile
                className="w-full max-w-2xl bg-[#0a0a1a]/90 backdrop-blur-2xl border border-[#00f5ff]/40 rounded-2xl shadow-[0_0_80px_rgba(0,245,255,0.15)] overflow-hidden relative flex flex-col perspective-[1000px]"
              >
                {/* Glowing Core */}
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#00f5ff]/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent opacity-80" />

                {/* MODAL HEADER */}
                {/* CHANGED: p-8 pb-6 -> p-6 pb-4 */}
                <div className="p-6 pb-4 border-b border-[#00f5ff]/10 flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-4">
                      <div className="relative">
                         <div className="absolute inset-0 bg-[#00f5ff] blur-md opacity-40 animate-pulse" />
                         {/* CHANGED: p-4 -> p-3, icon size 32 -> 24 */}
                         <div className="p-3 rounded-xl bg-[#00f5ff]/10 border border-[#00f5ff]/50 text-[#00f5ff] relative z-10">
                           <Cpu size={24} />
                         </div>
                      </div>
                      <div>
                        {/* CHANGED: text-3xl -> text-2xl */}
                        <h2 className="text-2xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">ALGO_CORE ONLINE</h2>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="flex h-2 w-2 relative">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                           </span>
                           <p className="text-[10px] text-[#00f5ff] uppercase tracking-[0.3em] font-mono font-bold">
                             System Initialized
                           </p>
                        </div>
                      </div>
                   </div>
                </div>

                {/* MODAL BODY */}
                {/* CHANGED: p-8 space-y-8 -> p-6 space-y-6 */}
                <div className="p-6 space-y-6 relative z-10 bg-gradient-to-b from-transparent to-[#00f5ff]/5">
                   {/* CHANGED: text-base -> text-sm */}
                   <p className="text-gray-300 text-sm leading-relaxed max-w-2xl font-mono">
                     Welcome to the high-fidelity algorithm simulation deck. Select a data structure from the control panel to initiate physical memory rendering.
                   </p>

                   {/* CHANGED: gap-6 -> gap-4 */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* CHANGED: p-5 -> p-4 */}
                      <div className="bg-black/50 p-4 rounded-xl border border-[#00f5ff]/20 hover:border-[#00f5ff]/50 transition-colors group flex gap-3 items-start shadow-inner">
                         <div className="p-2 bg-[#00f5ff]/10 rounded-lg text-[#00f5ff] group-hover:scale-110 transition-transform">
                             <Maximize2 size={18} />
                         </div>
                         <div>
                            <h4 className="text-[#00f5ff] text-xs font-black mb-1 font-mono uppercase tracking-wider">Expand Horizon</h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                               Collapse the sidebar to deploy the full holographic canvas for massive trees and graphs.
                            </p>
                         </div>
                      </div>

                      {/* CHANGED: p-5 -> p-4 */}
                      <div className="bg-black/50 p-4 rounded-xl border border-[#9d00ff]/20 hover:border-[#9d00ff]/50 transition-colors group flex gap-3 items-start shadow-inner">
                         <div className="p-2 bg-[#9d00ff]/10 rounded-lg text-[#9d00ff] group-hover:scale-110 transition-transform">
                             <Zap size={18} />
                         </div>
                         <div>
                            <h4 className="text-[#9d00ff] text-xs font-black mb-1 font-mono uppercase tracking-wider">Live Execution</h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                               Watch code execute frame-by-frame. Adjust the tachyon speed slider for precision debugging.
                            </p>
                         </div>
                      </div>
                   </div>

                   {/* DOCS ALERT */}
                   {/* CHANGED: p-5 -> p-4 */}
                   <div className="relative overflow-hidden rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex gap-4 items-center group hover:bg-yellow-500/10 transition-colors shadow-[0_0_20px_rgba(234,179,8,0.05)]">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="p-2.5 bg-yellow-500/10 rounded-lg text-yellow-500 shrink-0 relative z-10 border border-yellow-500/20">
                         <BookOpen size={20} />
                      </div>
                      <div className="relative z-10 flex-1">
                         <h4 className="text-yellow-500 font-black text-xs mb-0.5 font-mono uppercase tracking-widest flex items-center gap-2">
                            Manual Override
                         </h4>
                         <p className="text-gray-400 text-[11px] leading-relaxed">
                            Need clearance codes? Access the system documentation to understand visualizer mechanics.
                         </p>
                      </div>
                      <a href="/docs" className="relative z-10 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black text-[10px] font-black uppercase tracking-widest rounded-lg border border-yellow-500/50 transition-all flex items-center gap-2">
                         <span>DOCS</span>
                         <ArrowRight size={14} />
                      </a>
                   </div>
                </div>

                {/* MODAL FOOTER */}
                {/* CHANGED: p-6 -> p-5 */}
                <div className="p-5 border-t border-[#00f5ff]/20 bg-[#00f5ff]/5 flex justify-end relative z-10">
                  <button 
                    onClick={() => setShowWelcome(false)}
                    // CHANGED: px-10 py-4 -> px-8 py-3
                    className="group relative flex items-center gap-2 px-8 py-3 bg-[#00f5ff] text-black font-black text-xs rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(0,245,255,0.4)] overflow-hidden"
                  >
                    {/* Button shine effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                    <span className="relative z-10 tracking-widest uppercase">ENTER MATRIX</span>
                    <Terminal size={16} className="relative z-10" />
                  </button>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* --- MAIN DASHBOARD LAYOUT --- */}
        <div className="flex flex-1 overflow-hidden p-4 gap-4">
          
          {/* --- LEFT NAVIGATION PANEL (The Deck) --- */}
          <motion.div 
            initial={{ width: 280, opacity: 1 }}
            animate={{ 
                width: isNavOpen ? 280 : 0, 
                opacity: isNavOpen ? 1 : 0,
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} // Snappy fluid ease
            className="flex flex-col z-20 shrink-0 overflow-hidden bg-[#0a0a1a]/90 border border-white/10 rounded-2xl backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.6)]"
          >
            <div className="w-[280px] flex flex-col h-full">
                
                {/* Panel Header */}
                <div className="p-6 pb-5 relative overflow-hidden group border-b border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#00f5ff]/10 to-transparent opacity-30" />
                  <h1 className="text-2xl font-black text-white flex items-center gap-3 font-mono tracking-tighter relative z-10 drop-shadow-md">
                      <Database className="text-[#00f5ff] w-6 h-6" />
                      AlgoVIZ
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5 opacity-70 relative z-10">
                      <div className="w-1 h-1 bg-[#00f5ff] rounded-full" />
                      <div className="text-[9px] text-[#00f5ff] font-mono tracking-[0.2em] uppercase">MODULE_SELECTOR</div>
                  </div>
                </div>
                
                {/* Navigation Keys (Tactile Feel) */}
                <div className="flex-1 space-y-2 overflow-y-auto p-4 custom-scrollbar">
                {MENU.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full relative group overflow-hidden flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 transform hover:translate-x-1 ${
                            isActive
                            ? 'bg-gradient-to-r from-[#00f5ff]/20 to-transparent border border-[#00f5ff]/40 shadow-[inset_0_0_20px_rgba(0,245,255,0.1)]'
                            : 'bg-black/40 border border-white/5 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        {/* Active Laser Bar */}
                        {isActive && (
                            <motion.div layoutId="navLaser" className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00f5ff] shadow-[0_0_15px_#00f5ff]" />
                        )}
                        
                        <div className={`relative z-10 p-2.5 rounded-lg transition-colors ${isActive ? 'bg-[#00f5ff] text-black shadow-[0_0_15px_#00f5ff]' : 'bg-[#1a1a2e] text-gray-400 group-hover:text-white border border-white/10'}`}>
                            {item.icon}
                        </div>
                        
                        <span className={`relative z-10 text-xs font-black font-mono tracking-widest transition-colors ${
                            isActive ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-gray-500 group-hover:text-gray-200'
                        }`}>
                            {item.label}
                        </span>

                        {/* Scanner Effect on Active */}
                        {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                        )}
                      </button>
                    )
                })}
                </div>

                {/* Panel Footer */}
                <div className="mt-auto p-5 border-t border-white/10 bg-black/60 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00ff88]/50 to-transparent" />
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 bg-[#050510] px-4 py-3 rounded-lg border border-[#00ff88]/20 shadow-[inset_0_0_10px_rgba(0,255,136,0.05)]">
                      <div className="flex items-center gap-2">
                         <Activity className="w-4 h-4 text-[#00ff88]" />
                         <span className="font-bold text-[#00ff88] tracking-widest">ENGINE_LIVE</span>
                      </div>
                      <span className="text-[8px] opacity-50">60 FPS</span>
                  </div>
                </div>
            </div>
          </motion.div>

          {/* --- MAIN HOLOGRAPHIC WORKSPACE (The Arena) --- */}
          <div className="flex-1 relative flex flex-col min-w-0 rounded-2xl overflow-hidden border border-white/10 bg-[#050510]/80 backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.7)]">
            
            {/* --- TOP HUD STRIP --- */}
            <div className="h-[72px] border-b border-white/10 bg-gradient-to-b from-black/80 to-transparent flex items-center px-6 justify-between shrink-0 relative z-50">
               <div className="flex items-center gap-6 h-full">
                  
                  {/* --- SUPERNOVA TOGGLE BUTTON (Highly Visible) --- */}
                  <motion.button 
                    onClick={() => setIsNavOpen(!isNavOpen)}
                    animate={{
                        boxShadow: isNavOpen ? "0px 0px 10px rgba(0,245,255,0.2)" : ["0px 0px 15px rgba(0,245,255,0.4)", "0px 0px 30px rgba(0,245,255,0.7)", "0px 0px 15px rgba(0,245,255,0.4)"],
                        borderColor: isNavOpen ? "rgba(0,245,255,0.4)" : "rgba(0,245,255,1)"
                    }}
                    transition={{ duration: 2, repeat: isNavOpen ? 0 : Infinity, ease: "easeInOut" }}
                    className={`group relative flex items-center gap-3 px-5 py-2.5 rounded-xl text-[#00f5ff] transition-all overflow-hidden bg-[#00f5ff]/10 border-2`}
                    title={isNavOpen ? "Maximize Workspace" : "Open Navigation"}
                  >
                    {/* Glowing Core for closed state to grab attention */}
                    {!isNavOpen && <div className="absolute inset-0 bg-[#00f5ff]/10 animate-pulse" />}
                    
                    {isNavOpen ? <PanelLeftClose size={20} className="relative z-10 group-hover:-translate-x-1 transition-transform" /> : <PanelLeftOpen size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
                    
                    <span className="relative z-10 font-black font-mono text-[11px] tracking-[0.2em] uppercase mt-0.5 drop-shadow-[0_0_5px_rgba(0,245,255,0.8)]">
                       {isNavOpen ? 'COLLAPSE MENU' : 'EXPAND MENU'}
                    </span>
                  </motion.button>

                  <div className="h-8 w-px bg-white/10" />

                  {/* Active Protocol Indicator */}
                  <div className="flex items-center gap-3 bg-[#0a0a1a] px-5 py-2 rounded-xl border border-white/10 shadow-inner">
                    <Cpu className="w-5 h-5 text-[#9d00ff]" />
                    <span className="text-gray-400 font-mono text-[11px] tracking-[0.2em] uppercase flex items-center gap-3">
                        PROTOCOL_LOADED <ArrowRight size={10} className="opacity-50"/> 
                        <span className="text-white font-black bg-[#9d00ff]/20 border border-[#9d00ff]/30 px-3 py-1 rounded shadow-[0_0_10px_rgba(157,0,255,0.2)]">
                          {MENU.find(m => m.id === activeTab)?.label}
                        </span>
                    </span>
                  </div>
               </div>

               {/* Decorative Tech Data */}
               <div className="hidden md:flex items-center gap-6">
                  <div className="flex flex-col items-end font-mono">
                     <span className="text-[8px] text-gray-500 tracking-widest">MEM_ALLOC</span>
                     <span className="text-[10px] font-bold text-emerald-400">0x00F8</span>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex gap-1.5">
                     {[1,2,3].map(i => (
                        <div key={i} className="w-1.5 h-6 bg-[#00f5ff] rounded-full opacity-50 animate-pulse shadow-[0_0_10px_#00f5ff]" style={{ animationDelay: `${i * 0.15}s`}} />
                     ))}
                  </div>
               </div>
            </div>

            {/* --- VISUALIZATION CANVAS --- */}
            <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-[#020205] to-[#0a0a1a]">
              {/* Complex Render Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
              
              {/* Shadow Overlay for depth */}
              <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none z-20" />

              {/* Render Selected Component */}
              <div className="relative z-10 h-full w-full">
                 <AnimatePresence mode="wait">
                    <motion.div 
                       key={activeTab}
                       initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                       animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                       exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
                       transition={{ duration: 0.4, ease: "easeOut" }}
                       className="w-full h-full"
                    >
                       {MENU.find(m => m.id === activeTab)?.component}
                    </motion.div>
                 </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

// Helper for the "X" overlay on the smartphone icon
const XIconOverlay = () => (
    <div className="absolute -bottom-1 -right-1 bg-[#050510] rounded-full p-1.5 border-2 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    </div>
);

export default Visualizer;