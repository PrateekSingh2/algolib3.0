import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, Layers } from 'lucide-react';

const StackVisualizer = () => {
  const [stack, setStack] = useState<number[]>([30, 20, 10]);
  const [inputValue, setInputValue] = useState(40);

  const push = () => {
    if (stack.length > 7) return; // Cap height
    setStack([inputValue, ...stack]);
    setInputValue(Math.floor(Math.random() * 99));
  };

  const pop = () => {
    if (stack.length === 0) return;
    setStack(stack.slice(1));
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      
      {/* CONTAINER (The Bucket) */}
      <div className="relative w-64 min-h-[400px] border-b-4 border-l-4 border-r-4 border-neutral-700 rounded-b-xl bg-neutral-900/20 backdrop-blur-sm flex flex-col-reverse items-center justify-start p-4 gap-2 overflow-hidden">
        
        {/* Label */}
        <div className="absolute -left-20 bottom-10 text-neutral-600 font-mono text-xs rotate-[-90deg]">
          LIFO STRUCTURE
        </div>

        <AnimatePresence>
          {stack.map((val, index) => (
            <motion.div
              key={`${val}-${index}`} // Unique key for every item instance
              layout
              initial={{ opacity: 0, y: -100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.5, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full h-16 rounded bg-gradient-to-r from-purple-900 to-blue-900 border border-blue-500/30 flex items-center justify-center text-xl font-bold text-white shadow-lg relative"
            >
               {val}
               {index === 0 && (
                 <div className="absolute -right-16 text-xs text-yellow-500 font-mono font-bold flex items-center">
                    ← TOP
                 </div>
               )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {stack.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-600 font-mono">
                [ EMPTY STACK ]
            </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="mt-8 flex gap-4 p-4 bg-neutral-900 border border-white/10 rounded-xl">
        <div className="flex flex-col gap-1">
            <label className="text-[10px] text-neutral-500 font-mono">VALUE</label>
            <input 
                type="number" 
                value={inputValue}
                onChange={(e) => setInputValue(Number(e.target.value))}
                className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 w-20 text-center text-sm"
            />
        </div>
        <button onClick={push} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold flex items-center gap-2">
            <ArrowDown size={16} /> Push
        </button>
        <button onClick={pop} className="px-6 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded-lg font-bold flex items-center gap-2">
            <ArrowUp size={16} /> Pop
        </button>
      </div>

    </div>
  );
};

export default StackVisualizer;