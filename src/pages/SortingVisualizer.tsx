import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, RefreshCcw, Search } from 'lucide-react';

const SortingVisualizer = () => {
  const [array, setArray] = useState<number[]>([]);
  const [activeIndices, setActiveIndices] = useState<number[]>([]); // For comparison
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  const [isSorting, setIsSorting] = useState(false);

  useEffect(() => { resetArray(); }, []);

  const resetArray = () => {
    setArray(Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 10));
    setSortedIndices([]);
    setActiveIndices([]);
  };

  const bubbleSort = async () => {
    setIsSorting(true);
    let arr = [...array];
    let n = arr.length;
    
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            setActiveIndices([j, j + 1]);
            await new Promise(r => setTimeout(r, 100)); // Delay
            
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                setArray([...arr]);
            }
        }
        setSortedIndices(prev => [...prev, n - i - 1]);
    }
    setSortedIndices(Array.from({length: n}, (_, i) => i)); // All sorted
    setActiveIndices([]);
    setIsSorting(false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
        
      {/* VISUALIZER STAGE */}
      <div className="flex items-end justify-center gap-2 h-64 w-full mb-12">
        {array.map((val, idx) => (
            <motion.div
                layout
                key={idx} // Using Index key here for Bubble Sort visual stability
                className={`w-8 md:w-12 rounded-t-lg flex items-end justify-center pb-2 text-xs font-bold transition-colors duration-100 ${
                    activeIndices.includes(idx) ? 'bg-yellow-400 text-black shadow-[0_0_15px_#facc15]' :
                    sortedIndices.includes(idx) ? 'bg-green-500 text-black shadow-[0_0_15px_#22c55e]' :
                    'bg-cyan-900/50 text-white'
                }`}
                style={{ height: `${val * 3}px` }}
            >
                {val}
            </motion.div>
        ))}
      </div>

      {/* CONTROLS */}
      <div className="flex gap-4 p-4 bg-neutral-900 rounded-xl border border-white/10">
         <button onClick={resetArray} disabled={isSorting} className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white">
            <RefreshCcw size={20} />
         </button>
         <button onClick={bubbleSort} disabled={isSorting} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-white shadow-lg flex items-center gap-2">
            <Play size={20} fill="currentColor" /> BUBBLE SORT
         </button>
      </div>
    </div>
  );
};

export default SortingVisualizer;