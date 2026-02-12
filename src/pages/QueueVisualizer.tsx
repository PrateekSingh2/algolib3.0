import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, LogIn, LogOut } from 'lucide-react';

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
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      
      {/* QUEUE PIPE CONTAINER */}
      <div className="relative w-full max-w-4xl h-32 border-y-2 border-neutral-700 bg-neutral-900/30 flex items-center px-4 overflow-hidden">
        
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
                className="min-w-[80px] h-20 rounded-lg bg-gradient-to-b from-neutral-800 to-neutral-900 border-2 border-cyan-500/50 flex flex-col items-center justify-center relative shadow-[0_0_15px_rgba(6,182,212,0.1)]"
              >
                 <span className="text-xl font-bold text-cyan-100">{val}</span>
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

      {/* CONTROLS */}
      <div className="mt-12 flex gap-4 p-4 bg-neutral-900 border border-white/10 rounded-xl">
        <input 
            type="number" 
            value={inputValue}
            onChange={(e) => setInputValue(Number(e.target.value))}
            className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 w-20 text-center text-sm"
        />
        <button onClick={enqueue} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold flex items-center gap-2">
            <LogIn size={16} /> Enqueue
        </button>
        <button onClick={dequeue} className="px-6 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded-lg font-bold flex items-center gap-2">
            <LogOut size={16} /> Dequeue
        </button>
      </div>

    </div>
  );
};

export default QueueVisualizer;