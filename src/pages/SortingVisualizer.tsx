import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, BarChart3, Settings2, Code2 } from 'lucide-react';

// --- TYPES ---
type AlgorithmType = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick';

// --- CODE SNIPPETS (Snippet array omitted for brevity, logic remains same) ---
const SNIPPETS = {
  bubble: [
    { text: 'for i = 0 to n-1:', active: false },
    { text: '  for j = 0 to n-i-1:', active: false },
    { text: '    if arr[j] > arr[j+1]:', active: false },
    { text: '      swap(arr[j], arr[j+1])', active: false },
  ],
  selection: [
    { text: 'for i = 0 to n-1:', active: false },
    { text: '  min_idx = i', active: false },
    { text: '  for j = i+1 to n:', active: false },
    { text: '    if arr[j] < arr[min]: min = j', active: false },
    { text: '  swap(arr[min], arr[i])', active: false },
  ],
  insertion: [
    { text: 'for i = 1 to n:', active: false },
    { text: '  key = arr[i]; j = i - 1', active: false },
    { text: '  while j >= 0 && arr[j] > key:', active: false },
    { text: '    arr[j + 1] = arr[j]; j--', active: false },
    { text: '  arr[j + 1] = key', active: false },
  ],
  quick: [
    { text: 'pivot = arr[high]', active: false },
    { text: 'i = low - 1', active: false },
    { text: 'for j = low to high - 1:', active: false },
    { text: '  if arr[j] < pivot: i++; swap(i, j)', active: false },
    { text: 'swap(i + 1, high); return i + 1', active: false },
  ],
  merge: [
    { text: 'mid = (left + right) / 2', active: false },
    { text: 'mergeSort(left, mid)', active: false },
    { text: 'mergeSort(mid + 1, right)', active: false },
    { text: 'merge(left, mid, right)', active: false },
  ]
};

const SortingVisualizer = () => {
  // --- STATE ---
  const [array, setArray] = useState<number[]>([]);
  const [algo, setAlgo] = useState<AlgorithmType>('bubble');
  const [isSorting, setIsSorting] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [arraySize, setArraySize] = useState(20);
  
  // Highlighting State
  const [compareIndices, setCompareIndices] = useState<number[]>([]);
  const [swapIndices, setSwapIndices] = useState<number[]>([]);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  
  // --- UTILS ---
  const generateArray = (size = arraySize) => {
    const newArr = Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 10);
    setArray(newArr);
    setSortedIndices([]);
    setCompareIndices([]);
    setSwapIndices([]);
    setIsSorting(false);
  };

  useEffect(() => { generateArray(); }, [arraySize]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const getDelay = () => Math.max(5, 500 - speed * 4.5); // Speed mapping

  // --- ALGORITHMS (Logic identical to previous) ---
  const bubbleSort = async () => {
    let arr = [...array];
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            setCompareIndices([j, j + 1]);
            await sleep(getDelay());
            if (arr[j] > arr[j + 1]) {
                setSwapIndices([j, j + 1]);
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                setArray([...arr]);
                await sleep(getDelay());
            }
        }
        setSwapIndices([]);
        setCompareIndices([]);
        setSortedIndices(prev => [...prev, n - i - 1]);
    }
    setSortedIndices(arr.map((_, i) => i));
  };

  const selectionSort = async () => {
      let arr = [...array];
      let n = arr.length;
      for (let i = 0; i < n; i++) {
          let minIdx = i;
          for (let j = i + 1; j < n; j++) {
              setCompareIndices([minIdx, j]);
              await sleep(getDelay());
              if (arr[j] < arr[minIdx]) minIdx = j;
          }
          if (minIdx !== i) {
              setSwapIndices([i, minIdx]);
              let temp = arr[i];
              arr[i] = arr[minIdx];
              arr[minIdx] = temp;
              setArray([...arr]);
              await sleep(getDelay());
          }
          setSortedIndices(prev => [...prev, i]);
      }
      setCompareIndices([]);
      setSwapIndices([]);
  };

  const insertionSort = async () => {
    let arr = [...array];
    for (let i = 1; i < arr.length; i++) {
        let key = arr[i];
        let j = i - 1;
        setCompareIndices([i]);
        while (j >= 0 && arr[j] > key) {
            setCompareIndices([j, j + 1]);
            setSwapIndices([j + 1]);
            await sleep(getDelay());
            arr[j + 1] = arr[j];
            setArray([...arr]);
            j = j - 1;
        }
        arr[j + 1] = key;
        setArray([...arr]);
        setSortedIndices(Array.from({length: i + 1}, (_, k) => k));
    }
    setCompareIndices([]);
    setSwapIndices([]);
  };

  const mergeSortHelper = async (arr: number[], l: number, r: number) => {
    if (l >= r) return;
    const m = l + Math.floor((r - l) / 2);
    await mergeSortHelper(arr, l, m);
    await mergeSortHelper(arr, m + 1, r);
    await merge(arr, l, m, r);
  };

  const merge = async (arr: number[], l: number, m: number, r: number) => {
    const n1 = m - l + 1;
    const n2 = r - m;
    let L = arr.slice(l, m + 1);
    let R = arr.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;

    while (i < n1 && j < n2) {
        setCompareIndices([l + i, m + 1 + j]);
        await sleep(getDelay());
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        setSwapIndices([k]);
        setArray([...arr]);
        k++;
    }
    while (i < n1) {
        arr[k] = L[i];
        setSwapIndices([k]);
        setArray([...arr]);
        await sleep(getDelay());
        i++; k++;
    }
    while (j < n2) {
        arr[k] = R[j];
        setSwapIndices([k]);
        setArray([...arr]);
        await sleep(getDelay());
        j++; k++;
    }
    let newSorted = [];
    for(let x=l; x<=r; x++) newSorted.push(x);
    setSortedIndices(prev => [...prev, ...newSorted]);
  };

  const quickSortHelper = async (arr: number[], low: number, high: number) => {
    if (low < high) {
        let pi = await partition(arr, low, high);
        setSortedIndices(prev => [...prev, pi]);
        await quickSortHelper(arr, low, pi - 1);
        await quickSortHelper(arr, pi + 1, high);
    } else if (low === high) {
        setSortedIndices(prev => [...prev, low]);
    }
  };

  const partition = async (arr: number[], low: number, high: number) => {
    let pivot = arr[high];
    let i = (low - 1);
    setSwapIndices([high]);
    
    for (let j = low; j <= high - 1; j++) {
        setCompareIndices([j, high]);
        await sleep(getDelay());
        if (arr[j] < pivot) {
            i++;
            let temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
            setArray([...arr]);
            await sleep(getDelay());
        }
    }
    let temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    setArray([...arr]);
    await sleep(getDelay());
    return (i + 1);
  };

  const runSort = async () => {
      setIsSorting(true);
      setSortedIndices([]);
      const arrCopy = [...array];
      
      switch (algo) {
          case 'bubble': await bubbleSort(); break;
          case 'selection': await selectionSort(); break;
          case 'insertion': await insertionSort(); break;
          case 'merge': await mergeSortHelper(arrCopy, 0, arrCopy.length - 1); setSortedIndices(arrCopy.map((_, i) => i)); break;
          case 'quick': await quickSortHelper(arrCopy, 0, arrCopy.length - 1); setSortedIndices(arrCopy.map((_, i) => i)); break;
      }
      setIsSorting(false);
      setCompareIndices([]);
      setSwapIndices([]);
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-neutral-950 overflow-hidden font-sans">
      
      {/* --- SIDEBAR --- */}
      <div className="
        w-full lg:w-80 
        h-auto max-h-[40%] lg:max-h-full lg:h-full
        flex-shrink-0
        bg-neutral-900 border-b lg:border-b-0 lg:border-r border-white/10 
        flex flex-col p-4 gap-4 
        z-20 shadow-2xl relative
        overflow-y-auto custom-scrollbar
      ">
        <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <BarChart3 size={18} className="text-[#00f5ff]" />
            <span className="font-mono text-xs tracking-widest">SORTING_CONTROLLER</span>
        </div>

        {/* Algorithm Select */}
        <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
            {(['bubble', 'selection', 'insertion', 'merge', 'quick'] as AlgorithmType[]).map(t => (
                <button
                    key={t}
                    onClick={() => { setAlgo(t); generateArray(); }}
                    disabled={isSorting}
                    className={`px-2 py-2 rounded text-[10px] font-bold uppercase transition-all border ${
                        algo === t 
                        ? 'bg-[#00f5ff]/20 border-[#00f5ff] text-[#00f5ff]' 
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500'
                    }`}
                >
                    {t}
                </button>
            ))}
        </div>

        {/* Sliders */}
        <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
            <div>
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono mb-2">
                    <span>ARRAY_SIZE</span>
                    <span>{arraySize}</span>
                </div>
                <input 
                    type="range" min="5" max="100" value={arraySize} 
                    onChange={(e) => setArraySize(Number(e.target.value))}
                    disabled={isSorting}
                    className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#00f5ff]"
                />
            </div>
            <div>
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono mb-2">
                    <span>SIM_SPEED</span>
                    <span>{speed}%</span>
                </div>
                <input 
                    type="range" min="1" max="100" value={speed} 
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#00f5ff]"
                />
            </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
            <button 
                onClick={runSort} 
                disabled={isSorting}
                className="w-full py-3 bg-[#00f5ff]/10 border border-[#00f5ff]/50 hover:bg-[#00f5ff]/20 text-[#00f5ff] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,245,255,0.1)]"
            >
                <Play size={16} /> START SORTING
            </button>
            <button 
                onClick={() => generateArray()} 
                disabled={isSorting}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
                <RotateCcw size={16} /> RESET ARRAY
            </button>
        </div>

        {/* Code Snippet */}
        <div className="flex-1 bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-[10px] overflow-auto min-h-[100px] lg:min-h-[150px] relative">
            <div className="absolute top-2 right-2 text-neutral-600"><Code2 size={14} /></div>
            <div className="space-y-1 mt-2 text-neutral-500">
                {SNIPPETS[algo].map((line, i) => (
                    <div key={i}>{line.text}</div>
                ))}
            </div>
        </div>
      </div>

      {/* --- CANVAS --- */}
      <div className="flex-1 relative bg-neutral-950 flex flex-col items-center justify-end pb-10 px-10 overflow-hidden min-h-0">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px)', backgroundSize: '100% 40px' }} />
        
        <div className="flex items-end justify-center gap-[1px] w-full h-[80%]">
            {array.map((val, idx) => {
                const isCompare = compareIndices.includes(idx);
                const isSwap = swapIndices.includes(idx);
                const isSorted = sortedIndices.includes(idx);
                
                let bgColor = 'bg-neutral-700';
                if (isSorted) bgColor = 'bg-[#00ff88] shadow-[0_0_10px_#00ff88]';
                else if (isSwap) bgColor = 'bg-[#ff0055] shadow-[0_0_15px_#ff0055]';
                else if (isCompare) bgColor = 'bg-[#00f5ff] shadow-[0_0_15px_#00f5ff]';

                return (
                    <motion.div
                        layout
                        key={idx}
                        style={{ height: `${val}%`, width: `${100 / arraySize}%` }}
                        className={`rounded-t-sm transition-colors duration-100 ${bgColor}`}
                    />
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default SortingVisualizer;