import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, LogIn, LogOut, ArrowRightLeft } from 'lucide-react';

const QueueVisualizer = () => {
  const [queue, setQueue] = useState<number[]>([10, 20, 30]);
  const [inputValue, setInputValue] = useState(55);

  const enqueue = () => {
    setQueue([...queue, inputValue]);
    setInputValue(Math.floor(Math.random() * 99));
  };

  const dequeue = () => {
    setQueue(queue.slice(1));
  };

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
            <ArrowRightLeft size={16} className="text-green-500" />
            <span className="text-[10px] font-mono uppercase tracking-widest">QUEUE_CONTROLLER</span>
        </div>

        <div className="flex flex-col gap-2 p-4 bg-black/20 rounded-xl border border-white/5">
            <label className="text-[9px] text-gray-500 font-mono tracking-widest">VALUE_INPUT</label>
            <input 
                type="number" 
                value={inputValue}
                onChange={(e) => setInputValue(Number(e.target.value))}
                className="bg-black/50 border border-gray-700 rounded px-3 py-2 w-full text-sm font-mono text-white focus:border-green-500 outline-none transition-colors"
            />
        </div>

        <div className="grid grid-cols-2 gap-2">
            <button onClick={enqueue} className="px-4 py-3 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-500/50 rounded-lg font-bold font-mono text-xs flex flex-col items-center justify-center gap-1 transition-all">
                <LogIn size={14} /> ENQUEUE
            </button>
            <button onClick={dequeue} disabled={queue.length === 0} className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg font-bold font-mono text-xs flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                <LogOut size={14} /> DEQUEUE
            </button>
        </div>

        {/* Info Box */}
        <div className="mt-auto p-3 rounded bg-green-500/5 border border-green-500/20 text-green-500 text-[10px] font-mono leading-relaxed">
            QUEUE follows <strong>FIFO</strong> (First In First Out). Elements are added to the REAR and removed from the FRONT.
        </div>
      </div>

      {/* --- CANVAS --- */}
      <div className="flex-1 relative bg-[#050505] flex flex-col items-center justify-center p-8 overflow-hidden min-h-0">
        
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* QUEUE PIPE CONTAINER */}
        <div className="relative w-full max-w-4xl h-32 border-y-2 border-neutral-700 bg-neutral-900/30 flex items-center px-4 overflow-hidden z-10">
            
            {/* Entrance/Exit Labels */}
            <div className="absolute left-2 -top-6 text-xs font-mono text-red-400">FRONT (Exit)</div>
            <div className="absolute right-2 -top-6 text-xs font-mono text-green-400">REAR (Entry)</div>

            <div className="flex gap-4 w-full justify-start items-center">
            <AnimatePresence mode="popLayout">
                {queue.map((val, index) => (
                <motion.div
                    layout
                    key={`${val}-${index}`}
                    initial={{ opacity: 0, x: 100, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -100, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="min-w-[80px] h-20 rounded-lg bg-gradient-to-b from-neutral-800 to-neutral-900 border-2 border-green-500/50 flex flex-col items-center justify-center relative shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                >
                    <span className="text-xl font-bold text-green-100">{val}</span>
                    <span className="text-[9px] text-neutral-500 absolute bottom-1">idx:{index}</span>
                </motion.div>
                ))}
            </AnimatePresence>
            </div>

            {/* Empty State */}
            {queue.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-600 font-mono">
                    [ QUEUE EMPTY ]
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default QueueVisualizer;