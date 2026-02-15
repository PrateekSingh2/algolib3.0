import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, RotateCcw, Layers } from 'lucide-react';

const StackVisualizer = () => {
  // Stack state: Index 0 is the logical "TOP" (LIFO)
  const [stack, setStack] = useState<number[]>([30, 20, 10]);
  const [inputValue, setInputValue] = useState(40);

  const push = () => {
    if (stack.length > 7) return; 
    setStack([inputValue, ...stack]); // Add to front (Logical Top)
    setInputValue(Math.floor(Math.random() * 99));
  };

  const pop = () => {
    if (stack.length === 0) return;
    setStack(stack.slice(1)); // Remove from front
  };

  const clear = () => setStack([]);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-neutral-950 overflow-hidden font-sans">
      
      {/* --- SIDEBAR CONTROLS --- */}
      <div className="
        w-full lg:w-80 
        h-auto max-h-[40%] lg:max-h-full lg:h-full
        flex-shrink-0
        bg-neutral-900 border-b lg:border-b-0 lg:border-r border-white/10 
        flex flex-col p-4 gap-4 
        z-20 shadow-2xl relative
        overflow-y-auto custom-scrollbar
      ">
        <div className="flex items-center gap-2 mb-2 text-neutral-400">
            <Layers size={16} className="text-[#00f5ff]" />
            <span className="text-[10px] font-mono uppercase tracking-widest">STACK_CONTROLLER</span>
        </div>

        <div className="flex flex-col gap-2 p-4 bg-black/20 rounded-xl border border-white/5">
            <label className="text-[9px] text-gray-500 font-mono tracking-widest">VALUE_INPUT</label>
            <input 
                type="number" 
                value={inputValue}
                onChange={(e) => setInputValue(Number(e.target.value))}
                className="bg-black/50 border border-gray-700 rounded px-3 py-2 w-full text-sm font-mono text-white focus:border-[#00f5ff] outline-none transition-colors"
            />
        </div>

        <div className="grid grid-cols-2 gap-2">
            <button onClick={push} disabled={stack.length > 7} className="px-4 py-3 bg-[#00f5ff]/10 hover:bg-[#00f5ff]/20 text-[#00f5ff] border border-[#00f5ff]/50 rounded-lg font-bold font-mono text-xs flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                <ArrowDown size={14} /> PUSH
            </button>
            <button onClick={pop} disabled={stack.length === 0} className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg font-bold font-mono text-xs flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                <ArrowUp size={14} /> POP
            </button>
        </div>
        
        <button onClick={clear} className="w-full py-2 bg-neutral-800 text-neutral-400 hover:bg-neutral-700 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
            <RotateCcw size={14} /> CLEAR STACK
        </button>

        {/* Info Box */}
        <div className="mt-auto p-3 rounded bg-[#00f5ff]/5 border border-[#00f5ff]/20 text-[#00f5ff] text-[10px] font-mono leading-relaxed">
            STACK follows <strong>LIFO</strong> (Last In First Out). The last element pushed is the first one popped.
        </div>
      </div>

      {/* --- CANVAS --- */}
      <div className="flex-1 relative bg-[#050505] flex flex-col items-center justify-center p-8 overflow-hidden min-h-0">
        
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* CONTAINER (The Bucket) */}
        <div className="relative w-72 min-h-[450px] border-b-[6px] border-l-[6px] border-r-[6px] border-[#333] rounded-b-xl bg-gradient-to-b from-transparent to-[#111]/80 backdrop-blur-sm flex flex-col-reverse items-center justify-start p-4 gap-2 overflow-hidden shadow-2xl z-10">
            
            {/* Label */}
            <div className="absolute -left-24 bottom-20 text-gray-600 font-mono text-[10px] tracking-[0.2em] rotate-[-90deg]">
            LIFO::MEMORY_STACK
            </div>
            
            {/* Grid Background inside bucket */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            <AnimatePresence mode='popLayout'>
            {[...stack].reverse().map((val, i) => {
                const isTop = i === stack.length - 1; 
                
                return (
                <motion.div
                    key={`${val}-${i}`} 
                    layout
                    initial={{ opacity: 0, y: -200, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -200, scale: 0.5, transition: { duration: 0.3 } }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`w-full h-14 rounded-md flex items-center justify-center text-xl font-bold shadow-lg relative z-10 border transition-colors ${
                        isTop 
                        ? "bg-[#00f5ff]/20 border-[#00f5ff] text-white shadow-[0_0_15px_rgba(0,245,255,0.3)]" 
                        : "bg-[#1a1a2e] border-white/10 text-gray-400"
                    }`}
                >
                    <span className="font-mono">{val}</span>
                    
                    {isTop && (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute -right-24 text-[10px] text-[#00f5ff] font-mono font-bold flex items-center bg-[#00f5ff]/10 px-2 py-1 rounded border border-[#00f5ff]/30"
                    >
                        ← TOP_PTR
                    </motion.div>
                    )}
                    <div className="absolute left-2 text-[8px] text-gray-600 font-mono">
                        0x{((stack.length - 1 - i) * 4 + 1000).toString(16).toUpperCase()}
                    </div>
                </motion.div>
                );
            })}
            </AnimatePresence>

            {/* Empty State */}
            {stack.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-700 font-mono text-sm animate-pulse border border-dashed border-gray-800 px-4 py-2 rounded">
                        [ NULL_PTR_EXCEPTION ]
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StackVisualizer;