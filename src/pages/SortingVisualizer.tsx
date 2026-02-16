import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, StepForward, RotateCcw, 
  BarChart3, Settings2, Code2, Layers, 
  Cpu, Activity, Zap, Terminal, Gauge
} from 'lucide-react';

// --- TYPES ---
type AlgorithmType = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick' | 'heap' | 'shell';
type SortState = 'idle' | 'compare' | 'swap' | 'overwrite' | 'sorted';

// --- ALGORITHM DATA ---
const ALGO_INFO = {
  bubble: { name: 'Bubble Sort', complexity: 'O(n²)', desc: 'Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.' },
  selection: { name: 'Selection Sort', complexity: 'O(n²)', desc: 'Divides the input list into two parts: a sorted sublist of items which is built up from left to right.' },
  insertion: { name: 'Insertion Sort', complexity: 'O(n²)', desc: 'Builds the final sorted array one item at a time.' },
  merge: { name: 'Merge Sort', complexity: 'O(n log n)', desc: 'Divides the input array into two halves, calls itself for the two halves, and then merges the two sorted halves.' },
  quick: { name: 'Quick Sort', complexity: 'O(n log n)', desc: 'Picks an element as pivot and partitions the given array around the picked pivot.' },
  heap: { name: 'Heap Sort', complexity: 'O(n log n)', desc: 'Converts the array into a heap data structure, then repeatedly extracts the max element.' },
  shell: { name: 'Shell Sort', complexity: 'O(n log n)', desc: 'Generalized version of insertion sort. Sorts elements far apart from each other and progressively reduces the gap.' },
};

const CODE_SNIPPETS = {
  bubble: [
    { id: '1', text: 'for i from 0 to n-1:' },
    { id: '2', text: '  for j from 0 to n-i-1:' },
    { id: '3', text: '    if arr[j] > arr[j+1]:' },
    { id: '4', text: '      swap(arr[j], arr[j+1])' },
  ],
  selection: [
    { id: '1', text: 'for i from 0 to n-1:' },
    { id: '2', text: '  min_idx = i' },
    { id: '3', text: '  for j from i+1 to n:' },
    { id: '4', text: '    if arr[j] < arr[min]: min = j' },
    { id: '5', text: '  swap(arr[min], arr[i])' },
  ],
  insertion: [
    { id: '1', text: 'for i from 1 to n:' },
    { id: '2', text: '  key = arr[i]; j = i - 1' },
    { id: '3', text: '  while j >= 0 and arr[j] > key:' },
    { id: '4', text: '    arr[j + 1] = arr[j]; j--' },
    { id: '5', text: '  arr[j + 1] = key' },
  ],
  merge: [
    { id: '1', text: 'if left < right:' },
    { id: '2', text: '  mid = (left + right) / 2' },
    { id: '3', text: '  mergeSort(arr, left, mid)' },
    { id: '4', text: '  mergeSort(arr, mid + 1, right)' },
    { id: '5', text: '  merge(arr, left, mid, right)' },
  ],
  quick: [
    { id: '1', text: 'if low < high:' },
    { id: '2', text: '  pi = partition(arr, low, high)' },
    { id: '3', text: '  quickSort(arr, low, pi - 1)' },
    { id: '4', text: '  quickSort(arr, pi + 1, high)' },
  ],
  heap: [
    { id: '1', text: 'buildMaxHeap(arr)' },
    { id: '2', text: 'for i from n-1 down to 1:' },
    { id: '3', text: '  swap(arr[0], arr[i])' },
    { id: '4', text: '  heapify(arr, i, 0)' },
  ],
  shell: [
    { id: '1', text: 'gap = n/2; while gap > 0:' },
    { id: '2', text: '  for i from gap to n:' },
    { id: '3', text: '    temp = arr[i]; j = i' },
    { id: '4', text: '    while j >= gap & arr[j-g] > temp:' },
    { id: '5', text: '      arr[j] = arr[j-gap]; j -= gap' },
    { id: '6', text: '    arr[j] = temp; gap /= 2' },
  ],
};

const SortingVisualizer = () => {
  // --- STATE ---
  const [array, setArray] = useState<number[]>([]);
  const [algo, setAlgo] = useState<AlgorithmType>('bubble');
  const [isSorting, setIsSorting] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  
  // Controls
  const [speed, setSpeed] = useState(60);
  const [arraySize, setArraySize] = useState(30);
  
  // Visuals
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  const [pivotIndex, setPivotIndex] = useState<number | null>(null);
  const [opType, setOpType] = useState<SortState>('idle');
  const [message, setMessage] = useState('SYSTEM_READY');
  const [activeLine, setActiveLine] = useState<string | null>(null);

  // Refs for async control
  const sortingRef = useRef(false);
  const stepTrigger = useRef<() => void>(() => {});
  
  // --- INITIALIZATION ---
  useEffect(() => {
    resetArray();
    return () => { sortingRef.current = false; };
  }, []);

  // Handle Array Size Change
  useEffect(() => {
    if (!isSorting) resetArray();
  }, [arraySize]);

  const resetArray = () => {
    sortingRef.current = false;
    setIsSorting(false);
    setIsPaused(true);
    const newArr = Array.from({ length: arraySize }, () => Math.floor(Math.random() * 95) + 5);
    setArray(newArr);
    setSortedIndices([]);
    setActiveIndices([]);
    setPivotIndex(null);
    setOpType('idle');
    setMessage('ARRAY_INITIALIZED');
    setActiveLine(null);
  };

  // --- ENGINE CORE ---
  const resolveStep = () => { if (stepTrigger.current) stepTrigger.current(); };

  const waitStep = async (indices: number[], type: SortState, msg: string, lineId?: string) => {
    if (!sortingRef.current) return;

    setActiveIndices(indices);
    setOpType(type);
    setMessage(msg);
    if (lineId) setActiveLine(lineId);

    if (isPaused) {
      await new Promise<void>((resolve) => { stepTrigger.current = resolve; });
    } else {
      // Dynamic speed calculation: 100 speed = 5ms delay, 1 speed = 500ms delay
      const delay = Math.max(5, 500 - (speed * 4.9)); 
      await new Promise(r => setTimeout(r, delay));
    }
  };

  // --- ALGORITHMS ---

  const bubbleSort = async () => {
    let arr = [...array];
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        await waitStep([], 'idle', `PASS ${i+1}`, '1');
        for (let j = 0; j < n - i - 1; j++) {
            if (!sortingRef.current) return;
            
            await waitStep([j, j + 1], 'compare', `COMPARING ${arr[j]} vs ${arr[j+1]}`, '3');
            
            if (arr[j] > arr[j + 1]) {
                await waitStep([j, j + 1], 'swap', `SWAPPING ${arr[j]} > ${arr[j+1]}`, '4');
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                setArray([...arr]);
            }
        }
        setSortedIndices(prev => [...prev, n - i - 1]);
    }
    setSortedIndices(arr.map((_, i) => i));
  };

  const selectionSort = async () => {
    let arr = [...array];
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        let minIdx = i;
        await waitStep([i], 'compare', `CURRENT_MIN: ${arr[minIdx]}`, '2');
        
        for (let j = i + 1; j < n; j++) {
            if (!sortingRef.current) return;
            await waitStep([minIdx, j], 'compare', `CHECKING ${arr[j]} < ${arr[minIdx]}?`, '4');
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
                await waitStep([minIdx], 'compare', `NEW_MIN_FOUND: ${arr[minIdx]}`, '4');
            }
        }
        if (minIdx !== i) {
            await waitStep([i, minIdx], 'swap', `SWAPPING ${arr[i]} with ${arr[minIdx]}`, '5');
            [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
            setArray([...arr]);
        }
        setSortedIndices(prev => [...prev, i]);
    }
  };

  const insertionSort = async () => {
    let arr = [...array];
    for (let i = 1; i < arr.length; i++) {
        if (!sortingRef.current) return;
        let key = arr[i];
        let j = i - 1;
        await waitStep([i], 'compare', `INSERTING ${key}`, '2');
        
        while (j >= 0 && arr[j] > key) {
            if (!sortingRef.current) return;
            await waitStep([j, j+1], 'overwrite', `SHIFTING ${arr[j]} RIGHT`, '4');
            arr[j + 1] = arr[j];
            setArray([...arr]);
            j--;
        }
        arr[j + 1] = key;
        setArray([...arr]);
        await waitStep([j+1], 'overwrite', `PLACED ${key} AT INDEX ${j+1}`, '5');
    }
    setSortedIndices(arr.map((_, i) => i));
  };

  const mergeSort = async (arr: number[], l: number, r: number) => {
    if (l >= r || !sortingRef.current) return;
    const m = l + Math.floor((r - l) / 2);
    await waitStep([l, r], 'idle', `DIVIDING [${l}..${r}]`, '2');
    await mergeSort(arr, l, m);
    await mergeSort(arr, m + 1, r);
    await merge(arr, l, m, r);
  };

  const merge = async (arr: number[], l: number, m: number, r: number) => {
    const n1 = m - l + 1;
    const n2 = r - m;
    let L = arr.slice(l, m + 1);
    let R = arr.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;

    await waitStep([], 'idle', `MERGING [${l}..${m}] & [${m+1}..${r}]`, '5');

    while (i < n1 && j < n2) {
        if (!sortingRef.current) return;
        await waitStep([k], 'overwrite', `COMPARING L:${L[i]} R:${R[j]}`, '5');
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        setArray([...arr]);
        k++;
    }
    while (i < n1) {
        if (!sortingRef.current) return;
        arr[k] = L[i];
        await waitStep([k], 'overwrite', `FLUSHING LEFT: ${L[i]}`, '5');
        setArray([...arr]);
        i++; k++;
    }
    while (j < n2) {
        if (!sortingRef.current) return;
        arr[k] = R[j];
        await waitStep([k], 'overwrite', `FLUSHING RIGHT: ${R[j]}`, '5');
        setArray([...arr]);
        j++; k++;
    }
    // Visualize sorted range
    const range = [];
    for(let x=l; x<=r; x++) range.push(x);
    // Note: We don't mark as permanently sorted yet for visuals, but we could highlight the range
  };

  const quickSort = async (arr: number[], low: number, high: number) => {
    if (low < high && sortingRef.current) {
        let pi = await partition(arr, low, high);
        await waitStep([pi], 'sorted', `PIVOT PLACED AT ${pi}`, '2');
        setSortedIndices(prev => [...prev, pi]);
        await quickSort(arr, low, pi - 1);
        await quickSort(arr, pi + 1, high);
    }
  };

  const partition = async (arr: number[], low: number, high: number) => {
    let pivot = arr[high];
    setPivotIndex(high);
    let i = (low - 1);
    
    for (let j = low; j <= high - 1; j++) {
        if (!sortingRef.current) return -1;
        await waitStep([j, high], 'compare', `COMPARING ${arr[j]} vs PIVOT ${pivot}`, '2');
        if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
            await waitStep([i, j], 'swap', `SWAPPING ${arr[i]} <-> ${arr[j]}`, '2');
            setArray([...arr]);
        }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    await waitStep([i + 1, high], 'swap', `PLACING PIVOT`, '2');
    setArray([...arr]);
    setPivotIndex(null);
    return (i + 1);
  };

  const heapSort = async () => {
    let arr = [...array];
    let n = arr.length;

    // Build Heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        await heapify(arr, n, i);
    }

    // Extract
    for (let i = n - 1; i > 0; i--) {
        if (!sortingRef.current) return;
        await waitStep([0, i], 'swap', `MOVING MAX ${arr[0]} TO END`, '3');
        [arr[0], arr[i]] = [arr[i], arr[0]];
        setArray([...arr]);
        setSortedIndices(prev => [...prev, i]);
        await heapify(arr, i, 0);
    }
    setSortedIndices(arr.map((_, i) => i));
  };

  const heapify = async (arr: number[], n: number, i: number) => {
    if (!sortingRef.current) return;
    let largest = i;
    let l = 2 * i + 1;
    let r = 2 * i + 2;

    if (l < n && arr[l] > arr[largest]) largest = l;
    if (r < n && arr[r] > arr[largest]) largest = r;

    if (largest !== i) {
        await waitStep([i, largest], 'swap', `HEAPIFY: SWAP ${arr[i]} <-> ${arr[largest]}`, '4');
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        setArray([...arr]);
        await heapify(arr, n, largest);
    }
  };

  const shellSort = async () => {
    let arr = [...array];
    let n = arr.length;
    for (let gap = Math.floor(n/2); gap > 0; gap = Math.floor(gap/2)) {
        for (let i = gap; i < n; i += 1) {
            if (!sortingRef.current) return;
            let temp = arr[i];
            let j;
            await waitStep([i], 'compare', `CHECKING GAP ${gap}, VAL ${temp}`, '4');
            for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
                await waitStep([j, j-gap], 'overwrite', `SHIFTING ${arr[j-gap]} BY GAP`, '5');
                arr[j] = arr[j - gap];
                setArray([...arr]);
            }
            arr[j] = temp;
            setArray([...arr]);
            await waitStep([j], 'overwrite', `PLACED ${temp}`, '6');
        }
    }
    setSortedIndices(arr.map((_, i) => i));
  };

  // --- RUNNER ---
  const startSort = async () => {
    if (isSorting && isPaused) {
        setIsPaused(false);
        return;
    }
    setIsSorting(true);
    setIsPaused(false); // Auto-start
    sortingRef.current = true;
    setSortedIndices([]);
    const arrCopy = [...array];

    switch (algo) {
        case 'bubble': await bubbleSort(); break;
        case 'selection': await selectionSort(); break;
        case 'insertion': await insertionSort(); break;
        case 'merge': await mergeSort(arrCopy, 0, arrCopy.length - 1); setSortedIndices(arrCopy.map((_, i) => i)); break;
        case 'quick': await quickSort(arrCopy, 0, arrCopy.length - 1); setSortedIndices(arrCopy.map((_, i) => i)); break;
        case 'heap': await heapSort(); break;
        case 'shell': await shellSort(); break;
    }
    
    if (sortingRef.current) {
        setMessage('SORTING_COMPLETE');
        setActiveIndices([]);
        setOpType('idle');
        setIsSorting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-[#020205] overflow-hidden font-sans text-white">
      
      {/* --- SIDEBAR: CONTROL DECK --- */}
      <div className="w-full lg:w-80 bg-[#0a0a14] border-r border-white/10 flex flex-col z-30 shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#00f5ff]/5 to-transparent">
           <div className="flex items-center gap-2 text-[#00f5ff] mb-1">
              <BarChart3 size={20} />
              <span className="font-black tracking-widest text-sm">SORT_ENGINE_V9</span>
           </div>
           <p className="text-[10px] text-gray-500 font-mono">NEUROMORPHIC VISUALIZER</p>
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
           
           {/* Algorithm Selector */}
           <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                 <Layers size={10} /> Algorithm
              </label>
              <div className="grid grid-cols-2 gap-2">
                 {(Object.keys(ALGO_INFO) as AlgorithmType[]).map(key => (
                    <button
                        key={key}
                        onClick={() => { setAlgo(key); resetArray(); }}
                        disabled={isSorting}
                        className={`py-2 px-1 rounded text-[10px] font-bold uppercase border transition-all ${
                            algo === key 
                            ? 'bg-[#00f5ff] text-black border-[#00f5ff] shadow-[0_0_10px_rgba(0,245,255,0.4)]' 
                            : 'bg-black/40 text-gray-500 border-white/10 hover:border-white/30'
                        }`}
                    >
                        {ALGO_INFO[key].name}
                    </button>
                 ))}
              </div>
              <div className="bg-[#00f5ff]/5 border border-[#00f5ff]/20 p-3 rounded-lg mt-2">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[#00f5ff]">{ALGO_INFO[algo].name}</span>
                    <span className="text-[9px] font-mono text-gray-400 bg-black/50 px-2 py-0.5 rounded">{ALGO_INFO[algo].complexity}</span>
                 </div>
                 <p className="text-[9px] text-gray-400 leading-relaxed">{ALGO_INFO[algo].desc}</p>
              </div>
           </div>

           {/* Sliders */}
           <div className="space-y-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span className="flex items-center gap-1"><DatabaseIcon size={10} /> ARRAY_SIZE</span>
                    <span className="text-[#00f5ff]">{arraySize}</span>
                 </div>
                 <input 
                    type="range" min="5" max="100" value={arraySize}
                    onChange={(e) => setArraySize(Number(e.target.value))}
                    disabled={isSorting}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#00f5ff]"
                 />
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span className="flex items-center gap-1"><Gauge size={10} /> EXEC_SPEED</span>
                    <span className="text-[#00f5ff]">{speed}%</span>
                 </div>
                 <input 
                    type="range" min="1" max="100" value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#00f5ff]"
                 />
              </div>
           </div>

           {/* Execution Controls */}
           <div className="grid grid-cols-2 gap-2">
              <button 
                 onClick={startSort}
                 className={`py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
                    isSorting && !isPaused
                    ? 'bg-yellow-500 text-black shadow-[0_0_15px_#eab308]' 
                    : 'bg-[#00f5ff] text-black shadow-[0_0_15px_#00f5ff] hover:scale-[1.02]'
                 }`}
              >
                 {isSorting && !isPaused ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor"/>}
                 {isSorting && !isPaused ? 'PAUSE' : isSorting ? 'RESUME' : 'START'}
              </button>
              
              <button 
                 onClick={resolveStep}
                 disabled={!isPaused || !isSorting}
                 className="py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                 <StepForward size={16} /> STEP
              </button>
           </div>
           
           <button onClick={resetArray} className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500 hover:text-white transition-colors">
              <RotateCcw size={12}/> REGENERATE ARRAY
           </button>

           {/* Code Stream */}
           <div className="bg-[#050508] rounded-xl border border-white/10 overflow-hidden min-h-[120px]">
              <div className="px-3 py-2 bg-white/5 border-b border-white/5 flex items-center gap-2">
                 <Terminal size={12} className="text-[#00f5ff]" />
                 <span className="text-[9px] font-mono text-gray-400 uppercase">Logic_Trace</span>
              </div>
              <div className="p-3 space-y-1">
                 {CODE_SNIPPETS[algo].map(line => (
                    <div key={line.id} className={`text-[9px] font-mono transition-colors ${activeLine === line.id ? 'text-[#00f5ff] font-bold bg-[#00f5ff]/10 pl-1 border-l-2 border-[#00f5ff]' : 'text-gray-600'}`}>
                       {line.text}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* --- CANVAS --- */}
      <div className="flex-1 relative flex flex-col bg-[#020205] overflow-hidden">
         {/* Status Bar */}
         <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-6 py-2 bg-[#0a0a14]/90 backdrop-blur-md border border-[#00f5ff]/20 rounded-full shadow-2xl">
            <div className={`w-2 h-2 rounded-full ${isSorting ? 'bg-[#00f5ff] animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">{message}</span>
            {isPaused && isSorting && <span className="text-[9px] text-yellow-500 font-bold border border-yellow-500/50 px-1.5 rounded">PAUSED</span>}
         </div>

         {/* Background Grid */}
         <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

         {/* SORTING BARS */}
         <div className="flex-1 flex items-end justify-center px-10 pb-10 gap-[2px]">
            <AnimatePresence>
                {array.map((val, i) => {
                    const isCompare = activeIndices.includes(i) && opType === 'compare';
                    const isSwap = activeIndices.includes(i) && opType === 'swap';
                    const isOverwrite = activeIndices.includes(i) && opType === 'overwrite';
                    const isSorted = sortedIndices.includes(i);
                    const isPivot = pivotIndex === i;

                    let barColor = 'bg-[#1f2937]'; // Default gray
                    let glow = '';
                    
                    if (isSorted) { barColor = 'bg-[#00ff88]'; glow = 'shadow-[0_0_15px_#00ff88]'; }
                    else if (isSwap) { barColor = 'bg-[#ef4444]'; glow = 'shadow-[0_0_20px_#ef4444]'; }
                    else if (isOverwrite) { barColor = 'bg-[#f97316]'; glow = 'shadow-[0_0_20px_#f97316]'; }
                    else if (isCompare) { barColor = 'bg-[#00f5ff]'; glow = 'shadow-[0_0_20px_#00f5ff]'; }
                    else if (isPivot) { barColor = 'bg-[#d946ef]'; glow = 'shadow-[0_0_15px_#d946ef]'; }

                    return (
                        <motion.div
                            layout
                            key={i}
                            className={`relative rounded-t-sm flex-1 max-w-[40px] transition-colors duration-100 ${barColor} ${glow}`}
                            style={{ height: `${val}%` }}
                        >
                            {/* Value Label (Visible on hover or low count) */}
                            {(arraySize <= 20 || isCompare || isSwap) && (
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-gray-400 font-bold">
                                    {val}
                                </span>
                            )}
                            
                            {/* Scanning Laser Effect for Active Bars */}
                            {(isCompare || isSwap) && (
                                <motion.div 
                                    className="absolute inset-0 bg-white/20"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 0.2 }}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
};

// Helper Icon
const DatabaseIcon = ({size}: {size: number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
);

export default SortingVisualizer;