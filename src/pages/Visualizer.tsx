import React, { useState } from 'react';
import { 
  GitCommit, Layers, ArrowRightLeft, BarChart3, 
  Database, Activity, Cpu, Network, Binary, 
  Smartphone, PanelLeftClose, PanelLeftOpen,
  Info, CheckCircle2, Maximize2, X
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

// Reuse the Alien Background
const AlienBackground = () => (
  <div className="fixed inset-0 -z-10 bg-[#050510]">
     <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#1a0b2e] via-[#050510] to-[#000000]" />
  </div>
);

const Visualizer = () => {
  const [activeTab, setActiveTab] = useState('ll');
  const [isNavOpen, setIsNavOpen] = useState(true);
  
  // State for the Welcome Popup
  const [showWelcome, setShowWelcome] = useState(true);

  const MENU = [
    { id: 'll', label: 'LINKED_LIST', icon: <GitCommit size={16} />, component: <LinkedListVisualizer /> },
    { id: 'stack', label: 'STACK_LIFO', icon: <Layers size={16} />, component: <StackVisualizer /> },
    { id: 'queue', label: 'QUEUE_FIFO', icon: <ArrowRightLeft size={16} />, component: <QueueVisualizer /> },
    { id: 'sorting', label: 'SORTING_ALG', icon: <BarChart3 size={16} />, component: <SortingVisualizer /> },
    { id: 'bst', label: 'BINARY_TREE', icon: <Binary size={16} />, component: <BSTVisualizer /> },
    { id: 'graph', label: 'GRAPH_NET', icon: <Network size={16} />, component: <GraphVisualizer /> },
  ];

  return (
    <>
      <AlienBackground />
      
      {/* --- NAVBAR (Fixed Top, High Z-Index) --- */}
      <div className='fixed top-0 left-0 right-0 z-[200]'>
        <Navbar />
      </div>

      {/* --- MOBILE WARNING SCREEN (Visible only on < md) --- */}
      <div className="flex md:hidden h-screen flex-col items-center justify-center p-8 text-center relative z-50 pt-20">
          <div className="p-6 rounded-full bg-[#00f5ff]/5 border border-[#00f5ff]/20 mb-6 relative group">
             <div className="absolute inset-0 bg-[#00f5ff]/20 blur-xl rounded-full opacity-50 animate-pulse" />
             <Smartphone size={48} className="text-[#00f5ff] relative z-10" />
             <XIconOverlay />
          </div>
          
          <h2 className="text-xl font-black text-white font-mono tracking-tighter mb-2">
            MOBILE_VIEW <span className="text-red-500">RESTRICTED</span>
          </h2>
          
          <p className="text-gray-400 text-xs font-mono leading-relaxed max-w-xs mb-8">
            The Algorithm Visualizer engine requires high-performance rendering and a larger viewport canvas.
          </p>
      </div>

      {/* --- DESKTOP/TABLET APP (Visible on md+) --- */}
      <div className="hidden md:flex flex-col h-screen w-full text-white font-sans overflow-hidden relative pt-20">
        
        {/* --- WELCOME POPUP MODAL --- */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-[#0a0a1a] border border-[#00f5ff]/30 rounded-2xl shadow-[0_0_50px_rgba(0,245,255,0.15)] overflow-hidden relative"
              >
                {/* Modal Glow Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#00f5ff] shadow-[0_0_20px_#00f5ff]" />
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#00f5ff]/10 blur-3xl rounded-full" />

                {/* Header */}
                <div className="p-6 pb-2 relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-[#00f5ff]/10 border border-[#00f5ff]/20 text-[#00f5ff]">
                      <Cpu size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white font-mono tracking-tight">SYSTEM INITIALIZED</h2>
                      <p className="text-[10px] text-[#00f5ff] uppercase tracking-widest font-mono opacity-70">
                        AlgoViz Engine v2.0.4
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-white/10 pl-3 mb-6">
                    Welcome to the interactive algorithm simulation deck. Visualize complex data structures including Linked Lists, Trees, and Sorting algorithms in real-time.
                  </p>

                  {/* THE DARK NOTE */}
                  <div className="bg-[#050510] rounded-xl border border-white/5 p-4 mb-2 flex gap-4 items-start group">
                     <div className="shrink-0 p-2 rounded-md bg-[#1a1a2e] text-white group-hover:text-[#00f5ff] transition-colors mt-0.5">
                        <PanelLeftClose size={20} />
                     </div>
                     <div>
                        <h4 className="text-white text-xs font-bold font-mono mb-1 flex items-center gap-2">
                           <Maximize2 size={10} className="text-[#00f5ff]" />
                           VIEWPORT OPTIMIZATION
                        </h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                           <span className="text-gray-300 font-semibold">Pro Tip:</span> Close the side navigation panel using the toggle button to extend the holographic canvas for a clearer view.
                        </p>
                     </div>
                  </div>
                </div>

                {/* Footer / Action */}
                <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end">
                  <button 
                    onClick={() => setShowWelcome(false)}
                    className="flex items-center gap-2 px-6 py-2 bg-[#00f5ff] hover:bg-[#00c2cc] text-black font-bold text-sm rounded-lg transition-all shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_30px_rgba(0,245,255,0.5)] active:scale-95"
                  >
                    <CheckCircle2 size={16} />
                    <span>OK, LAUNCH</span>
                  </button>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        <div className="flex flex-1 overflow-hidden px-4 pb-4">
          
          {/* --- LEFT CONTROL PANEL (SIDEBAR) --- */}
          <motion.div 
            initial={{ width: 256, opacity: 1, marginRight: 16 }}
            animate={{ 
                width: isNavOpen ? 256 : 0, 
                opacity: isNavOpen ? 1 : 0,
                marginRight: isNavOpen ? 16 : 0
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col z-20 shrink-0 overflow-hidden"
          >
            <div className="w-64 flex flex-col h-full">
                
                {/* Panel Header */}
                <div className="p-4 mb-4 rounded-tl-xl rounded-br-xl bg-[#0a0a1a]/80 border border-[#00f5ff]/30 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00f5ff]/10 to-transparent opacity-20" />
                <h1 className="text-lg font-black text-white flex items-center gap-2 font-mono tracking-tighter relative z-10">
                    <Database className="text-[#00f5ff] w-4 h-4" />
                    AlgoVIZ
                </h1>
                <div className="text-[9px] text-[#00f5ff] font-mono mt-1 opacity-70">INTERACTIVE SIMULATION</div>
                </div>
                
                {/* Navigation Keys */}
                <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {MENU.map((item) => (
                    <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full relative group overflow-hidden flex items-center gap-3 px-4 py-3.5 border-l-2 transition-all duration-300 rounded-r-md ${
                        activeTab === item.id
                        ? 'border-[#00f5ff] bg-[#00f5ff]/10'
                        : 'border-transparent hover:border-[#00f5ff]/50 hover:bg-white/5'
                    }`}
                    >
                    {/* Active Glow Background */}
                    {activeTab === item.id && (
                        <motion.div layoutId="activeTab" className="absolute inset-0 bg-gradient-to-r from-[#00f5ff]/10 to-transparent" />
                    )}
                    
                    <div className={`relative z-10 ${activeTab === item.id ? 'text-[#00f5ff]' : 'text-gray-500 group-hover:text-gray-300'}`}>
                        {item.icon}
                    </div>
                    <span className={`relative z-10 text-[11px] font-bold font-mono tracking-wider ${
                        activeTab === item.id ? 'text-white' : 'text-gray-500 group-hover:text-white'
                    }`}>
                        {item.label}
                    </span>
                    </button>
                ))}
                </div>

                {/* Panel Footer */}
                <div className="mt-auto p-4 rounded-bl-xl rounded-tr-xl border border-white/5 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                    <Activity className="w-3 h-3 text-[#00ff88] animate-pulse" />
                    SYSTEM_READY
                </div>
                </div>
            </div>
          </motion.div>

          {/* --- MAIN HOLOGRAPHIC WORKSPACE --- */}
          <div className="flex-1 relative flex flex-col min-w-0 rounded-2xl overflow-hidden border border-white/10 bg-[#050510]/50 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            
            {/* Top HUD Strip */}
            <div className="h-12 border-b border-white/5 bg-black/20 flex items-center px-4 justify-between shrink-0">
               <div className="flex items-center gap-4">
                  
                  {/* SIDEBAR TOGGLE BUTTON */}
                  <button 
                    onClick={() => setIsNavOpen(!isNavOpen)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-[#00f5ff]/20 text-gray-400 hover:text-[#00f5ff] transition-colors border border-white/5 hover:border-[#00f5ff]/30"
                    title={isNavOpen ? "Maximize Workspace" : "Open Navigation"}
                  >
                    {isNavOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                  </button>

                  <div className="h-6 w-px bg-white/10" />

                  <div className="flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-[#9d00ff]" />
                    <span className="text-gray-500 font-mono text-[10px] tracking-widest uppercase">
                        PROTOCOL :: <span className="text-[#00f5ff] font-bold">{MENU.find(m => m.id === activeTab)?.label}</span>
                    </span>
                  </div>
               </div>

               <div className="flex gap-1.5">
                  {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-[#00f5ff] rounded-full opacity-50 animate-pulse" style={{ animationDelay: `${i * 0.2}s`}} />)}
               </div>
            </div>

            {/* Visualization Canvas */}
            <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-transparent to-[#0a0a1a]/80">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50" />
              <div className="relative z-10 h-full w-full">
                 {MENU.find(m => m.id === activeTab)?.component}
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
    <div className="absolute -bottom-1 -right-1 bg-[#050510] rounded-full p-1 border border-red-500/50">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    </div>
);

export default Visualizer;