import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, StepForward, RotateCcw, 
  BarChart3, Layers, Terminal, Activity, 
  Gauge, Maximize2, Minimize2, Database, Zap, ArrowRight
} from 'lucide-react';
import { useCollaboration } from '@/contexts/CollaborationContext';

// --- TYPES & GAME STATE ---
type AlgorithmType = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick' | 'heap';
type SortState = 'idle' | 'compare' | 'swap' | 'overwrite' | 'sorted' | 'pivot';

const ALGO_INFO = {
  bubble: { name: 'Bubble Sort', complexity: 'O(n²)', desc: 'Padosi se compare karta hai aur sabse bade element ko array ke end mein bubble up (dhakel) deta hai.' },
  selection: { name: 'Selection Sort', complexity: 'O(n²)', desc: 'Pure array mein sabse chhota (minimum) dhoondhta hai aur use aage laakar fix karta hai.' },
  insertion: { name: 'Insertion Sort', complexity: 'O(n²)', desc: 'Ek-ek karke element uthata hai aur use pichle sorted array mein sahi jagah insert karta hai.' },
  merge: { name: 'Merge Sort', complexity: 'O(n log n)', desc: 'Array ko beech se tab tak todta hai jab tak 1 element na bache, fir sort karte hue jodta (merge) hai.' },
  quick: { name: 'Quick Sort', complexity: 'O(n log n)', desc: 'Ek Pivot (boss) chun-ta hai, chhote elements left aur bade right mein fek kar array ko divide karta hai.' },
  heap: { name: 'Heap Sort', complexity: 'O(n log n)', desc: 'Array ko Max-Heap (Pyramid) banata hai aur sabse bade element ko end mein nikal kar sort karta hai.' }
};

// --- HINGLISH EXECUTION MATRIX ---
const CODE_SNIPPETS = {
  bubble: [
    { id: '1', text: 'for i from 0 to n-1:', explanation: 'Har round mein sabse bada element end mein set karenge.', active: false },
    { id: '2', text: '  for j from 0 to n-i-1:', explanation: 'Unsorted bache hue elements mein scan shuru...', active: false },
    { id: '3', text: '    if arr[j] > arr[j+1]:', explanation: 'Padosi se compare kar rahe hain. Kya left wala bada hai?', active: false },
    { id: '4', text: '      swap(arr[j], arr[j+1])', explanation: 'Order galat nikla! Dono ko aapas mein SWAP kar do.', active: false },
  ],
  selection: [
    { id: '1', text: 'for i from 0 to n-1:', explanation: 'Nayi sorted position ke liye loop shuru.', active: false },
    { id: '2', text: '  min_idx = i', explanation: 'Abhi ke liye pehle unsorted element ko hi sabse chhota (MIN) maan liya.', active: false },
    { id: '3', text: '  for j from i+1 to n:', explanation: 'Baaki aage ke array mein scan karo...', active: false },
    { id: '4', text: '    if arr[j] < arr[min]: min = j', explanation: 'Naya sabse chhota element mil gaya! Target update karo.', active: false },
    { id: '5', text: '  swap(arr[min], arr[i])', explanation: 'Round khatam. Minimum element ko utha kar aage fix kar diya.', active: false },
  ],
  insertion: [
    { id: '1', text: 'for i from 1 to n:', explanation: 'Dusre element se start karke aage badho.', active: false },
    { id: '2', text: '  key = arr[i]; j = i - 1', explanation: 'Target block ko "KEY" me save kiya. Ab iske liye pichhe jagah banayenge.', active: false },
    { id: '3', text: '  while j >= 0 and arr[j] > key:', explanation: 'Pichhe ke elements check karo. Agar wo Key se bade hain toh...', active: false },
    { id: '4', text: '    arr[j + 1] = arr[j]; j--', explanation: 'Bade element ko ek step aage (Right) khiska (shift) do.', active: false },
    { id: '5', text: '  arr[j + 1] = key', explanation: 'Sahi khali jagah mil gayi. KEY ko yahan insert kar diya!', active: false },
  ],
  merge: [
    { id: '1', text: 'if left < right:', explanation: 'Kya array ko aur toda ja sakta hai?', active: false },
    { id: '2', text: '  mid = (left + right) / 2', explanation: 'Midpoint (beech ka rasta) calculate kiya.', active: false },
    { id: '3', text: '  mergeSort(arr, left, mid)', explanation: 'LEFT half ko sort karne ke liye bheja...', active: false },
    { id: '4', text: '  mergeSort(arr, mid + 1, right)', explanation: 'RIGHT half ko sort karne ke liye bheja...', active: false },
    { id: '5', text: '  merge(arr, left, mid, right)', explanation: 'Dono sorted halves ko wapas jod (MERGE) rahe hain.', active: false },
  ],
  quick: [
    { id: '1', text: 'if low < high:', explanation: 'Agar chunk mein 1 se zyada elements hain toh...', active: false },
    { id: '2', text: '  pi = partition(arr, low, high)', explanation: 'Partition shuru! Pivot (Leader) ko uski exact sahi jagah par place kar rahe hain.', active: false },
    { id: '3', text: '  quickSort(arr, low, pi - 1)', explanation: 'Pivot ke LEFT side wale chhote elements ko sort karo.', active: false },
    { id: '4', text: '  quickSort(arr, pi + 1, high)', explanation: 'Pivot ke RIGHT side wale bade elements ko sort karo.', active: false },
  ],
  heap: [
    { id: '1', text: 'buildMaxHeap(arr)', explanation: 'Pura array ko scan karke ek MAX-HEAP (Parent > Child) structure bana diya.', active: false },
    { id: '2', text: 'for i from n-1 down to 1:', explanation: 'Ab sabse bade element ko array ke end mein bhejte jayenge.', active: false },
    { id: '3', text: '  swap(arr[0], arr[i])', explanation: 'Top (Max) element ko aakhri bache unsorted index se swap kiya.', active: false },
    { id: '4', text: '  heapify(arr, i, 0)', explanation: 'Root kharab ho gaya! Array ko wapas Max-Heap mein restructure karo.', active: false },
  ]
};

const CyberGrid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-br from-[#c4c3ff] via-[#e6e6ff] to-[#fce4ff] dark:bg-none dark:bg-[#09090b]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.07),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.03),transparent_70%)]" />
  </div>
);

const SortingVisualizer = () => {
  // --- STATE ---
  const [array, setArray] = useState<number[]>([]);
  const [algo, setAlgo] = useState<AlgorithmType>('bubble');
  const [isSorting, setIsSorting] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  
  // Game HUD - Hidden by Default
  const [showHUD, setShowHUD] = useState(false);
  const [speed, setSpeed] = useState(60);
  const [arraySize, setArraySize] = useState(30);
  
  // Visual Tracking
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  const [pivotIndex, setPivotIndex] = useState<number | null>(null);
  const [opType, setOpType] = useState<SortState>('idle');
  
  // Terminal Logic
  const [message, setMessage] = useState('SYSTEM_READY');
  const [codeLines, setCodeLines] = useState<any[]>(CODE_SNIPPETS['bubble']);
  const [outputLog, setOutputLog] = useState<string[]>([]);

  // Engine Refs
  const sortingRef = useRef(false);
  const stepTrigger = useRef<() => void>(() => {});
  const interpreterEndRef = useRef<HTMLDivElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  // --- COLLABORATION HOOK ---
  const { role, roomState, broadcastState } = useCollaboration();

  // Host Broadcasts State
  useEffect(() => {
    if (role === 'host') {
      broadcastState({
        array, algo, isSorting, isPaused, speed, arraySize,
        activeIndices, sortedIndices, pivotIndex, opType,
        message, codeLines, outputLog
      });
    }
  }, [array, algo, isSorting, isPaused, speed, arraySize, activeIndices, sortedIndices, pivotIndex, opType, message, codeLines, outputLog, role, broadcastState]);

  // Viewer Receives State
  useEffect(() => {
    if (role === 'viewer' && roomState) {
      if (roomState.array !== undefined) setArray(roomState.array);
      if (roomState.algo !== undefined) setAlgo(roomState.algo);
      if (roomState.isSorting !== undefined) setIsSorting(roomState.isSorting);
      if (roomState.isPaused !== undefined) setIsPaused(roomState.isPaused);
      if (roomState.speed !== undefined) setSpeed(roomState.speed);
      if (roomState.arraySize !== undefined) setArraySize(roomState.arraySize);
      if (roomState.activeIndices !== undefined) setActiveIndices(roomState.activeIndices);
      if (roomState.sortedIndices !== undefined) setSortedIndices(roomState.sortedIndices);
      if (roomState.pivotIndex !== undefined) setPivotIndex(roomState.pivotIndex);
      if (roomState.opType !== undefined) setOpType(roomState.opType);
      if (roomState.message !== undefined) setMessage(roomState.message);
      if (roomState.codeLines !== undefined) setCodeLines(roomState.codeLines);
      if (roomState.outputLog !== undefined) setOutputLog(roomState.outputLog);
    }
  }, [role, roomState]);

  // --- INIT & LIFECYCLE ---
  useEffect(() => { resetArray(); return () => { sortingRef.current = false; }; }, []);
  useEffect(() => { if (!isSorting) resetArray(); }, [arraySize]);
  useEffect(() => { setCodeLines(CODE_SNIPPETS[algo]); }, [algo]);

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
    setOutputLog([`> SYSTEM RESET: Generated array of ${arraySize} elements.`]);
    setCodeLines(CODE_SNIPPETS[algo].map(l => ({ ...l, active: false })));
  };

  // --- ENGINE CORE ---
  const resolveStep = () => { if (stepTrigger.current) stepTrigger.current(); };

  const waitStep = async (indices: number[], type: SortState, msg: string, lineId?: string) => {
    if (!sortingRef.current) return;

    setActiveIndices(indices);
    setOpType(type);
    setMessage(msg);
    
    if (lineId) {
        setCodeLines(CODE_SNIPPETS[algo].map(l => ({ ...l, active: l.id === lineId })));
    }

    if (isPaused) {
      await new Promise<void>((resolve) => { stepTrigger.current = resolve; });
    } else {
      const delay = Math.max(5, 500 - (speed * 4.9)); 
      await new Promise(r => setTimeout(r, delay));
    }
  };

  const addLog = (log: string) => setOutputLog(prev => [...prev, log]);

  // --- ALGORITHMS ---
  const bubbleSort = async () => {
    let arr = [...array];
    let n = arr.length;
    addLog(`> Initiating Bubble Sort Protocol...`);
    
    for (let i = 0; i < n; i++) {
        await waitStep([], 'idle', `PASS ${i+1}`, '1');
        let swapped = false;

        for (let j = 0; j < n - i - 1; j++) {
            if (!sortingRef.current) return;
            await waitStep([j, j + 1], 'compare', `COMPARING ${arr[j]} vs ${arr[j+1]}`, '3');
            
            if (arr[j] > arr[j + 1]) {
                await waitStep([j, j + 1], 'swap', `SWAPPING ${arr[j]} > ${arr[j+1]}`, '4');
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                setArray([...arr]);
                swapped = true;
            }
        }
        setSortedIndices(prev => [...prev, n - i - 1]);
        addLog(`> Pass ${i+1} Complete. Largest element locked at end.`);
        if (!swapped) {
            addLog(`> Array is fully sorted early. Optimizing abort.`);
            break;
        }
    }
    setSortedIndices(arr.map((_, i) => i));
  };

  const selectionSort = async () => {
    let arr = [...array];
    let n = arr.length;
    addLog(`> Initiating Selection Sort Protocol...`);

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
        addLog(`> Pass ${i+1} Complete. Set [${arr[i]}] at index ${i}.`);
    }
  };

  const insertionSort = async () => {
    let arr = [...array];
    addLog(`> Initiating Insertion Sort Protocol...`);

    for (let i = 1; i < arr.length; i++) {
        if (!sortingRef.current) return;
        let key = arr[i];
        let j = i - 1;
        await waitStep([i], 'compare', `TARGET KEY: ${key}`, '2');
        
        while (j >= 0 && arr[j] > key) {
            if (!sortingRef.current) return;
            await waitStep([j, j+1], 'overwrite', `SHIFTING ${arr[j]} RIGHT`, '4');
            arr[j + 1] = arr[j];
            setArray([...arr]);
            j--;
        }
        arr[j + 1] = key;
        setArray([...arr]);
        await waitStep([j+1], 'sorted', `PLACED ${key} AT INDEX ${j+1}`, '5');
        
        const sortedRange = [];
        for(let k=0; k<=i; k++) sortedRange.push(k);
        setSortedIndices(sortedRange);
    }
    addLog(`> Insertion Sequence Complete.`);
  };

  const mergeSort = async (arr: number[], l: number, r: number) => {
    if (l >= r || !sortingRef.current) return;
    const m = l + Math.floor((r - l) / 2);
    await waitStep([l, r], 'idle', `DIVIDING [${l}..${r}]`, '2');
    
    if (l === 0 && r === array.length - 1) addLog(`> Initiating Merge Sort Protocol...`);

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

    addLog(`> Merging Sub-arrays [${l}..${m}] and [${m+1}..${r}]`);
    await waitStep([], 'idle', `MERGING CHUNKS`, '5');

    while (i < n1 && j < n2) {
        if (!sortingRef.current) return;
        await waitStep([k], 'overwrite', `COMPARING L:${L[i]} vs R:${R[j]}`, '5');
        if (L[i] <= R[j]) { arr[k] = L[i]; i++; } 
        else { arr[k] = R[j]; j++; }
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
  };

  const quickSort = async (arr: number[], low: number, high: number) => {
    if (low === 0 && high === array.length - 1) addLog(`> Initiating Quick Sort Protocol...`);
    if (low < high && sortingRef.current) {
        let pi = await partition(arr, low, high);
        await waitStep([pi], 'sorted', `PIVOT PLACED AT ${pi}`, '2');
        setSortedIndices(prev => [...prev, pi]);
        addLog(`> Pivot locked at index ${pi}. Dividing arrays.`);
        await quickSort(arr, low, pi - 1);
        await quickSort(arr, pi + 1, high);
    } else if (low === high) {
        setSortedIndices(prev => [...prev, low]);
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
    addLog(`> Initiating Heap Sort Protocol...`);
    addLog(`> Building Max-Heap structure...`);

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        await heapify(arr, n, i);
    }

    addLog(`> Max-Heap generated. Starting extraction phase.`);
    for (let i = n - 1; i > 0; i--) {
        if (!sortingRef.current) return;
        await waitStep([0, i], 'swap', `MOVING MAX ${arr[0]} TO END`, '3');
        [arr[0], arr[i]] = [arr[i], arr[0]];
        setArray([...arr]);
        setSortedIndices(prev => [...prev, i]);
        addLog(`> Max element extracted. Restructuring heap...`);
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

  // --- RUNNER ---
  const startSort = async () => {
    if (isSorting && isPaused) { setIsPaused(false); return; }
    
    setIsSorting(true);
    setIsPaused(false);
    sortingRef.current = true;
    // if (!showHUD) setShowHUD(true); // Auto-show HUD when sort starts
    setSortedIndices([]);
    const arrCopy = [...array];

    switch (algo) {
        case 'bubble': await bubbleSort(); break;
        case 'selection': await selectionSort(); break;
        case 'insertion': await insertionSort(); break;
        case 'merge': await mergeSort(arrCopy, 0, arrCopy.length - 1); setSortedIndices(arrCopy.map((_, i) => i)); break;
        case 'quick': await quickSort(arrCopy, 0, arrCopy.length - 1); setSortedIndices(arrCopy.map((_, i) => i)); break;
        case 'heap': await heapSort(); break;
    }
    
    if (sortingRef.current) {
        setMessage('SORTING_COMPLETE');
        addLog(`> PROCESS TERMINATED: Array completely sorted.`);
        setActiveIndices([]);
        setOpType('idle');
        setIsSorting(false);
        setCodeLines(CODE_SNIPPETS[algo].map(l => ({ ...l, active: false })));
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-br from-[#c4c3ff] via-[#e6e6ff] to-[#fce4ff] dark:bg-none dark:bg-[#09090b] font-sans text-slate-900 dark:text-white overflow-hidden">
      <CyberGrid />
      
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden min-h-0">
        
        {/* --- LEFT PANEL: COMMAND CENTER (Constrained to 42% on mobile) --- */}
        <div className="w-full lg:w-[340px] bg-[#aebcc8]/95 lg:bg-[#aebcc8]/80 dark:bg-black/95 dark:lg:bg-black/80 backdrop-blur-md border-slate-300 dark:border-white/10 flex flex-col h-[42%] lg:h-full shadow-2xl shrink-0 z-20 overflow-hidden order-1 lg:border-r">

          <div className="overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar pb-6 flex-1 lg:max-h-none pt-4 lg:pt-6 flex flex-col">
            
            {/* Algorithm Selector */}
            <div className="space-y-2 shrink-0">
               <label className="text-[10px] font-bold text-slate-900 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1">
                  <Layers size={10} /> Architecture
               </label>
               <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(ALGO_INFO) as AlgorithmType[]).map(key => (
                     <button key={key} onClick={() => { setAlgo(key); resetArray(); }} disabled={isSorting || role === 'viewer'}
                         className={`py-2 px-1 rounded text-[10px] font-bold uppercase border transition-all disabled:opacity-50 ${
                             algo === key 
                             ? 'bg-blue-400 text-black border-blue-500 shadow-[0_0_15px_rgba(96,165,250,0.4)]' 
                             : 'bg-slate-200 dark:bg-black/40 text-slate-900 dark:text-gray-500 border-slate-300 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-400/50 hover:text-black dark:hover:text-white'
                         }`}
                     >
                         {ALGO_INFO[key].name}
                     </button>
                  ))}
               </div>
               
               <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 p-3 rounded-lg mt-2">
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-[10px] font-bold text-blue-800 dark:text-blue-400">{ALGO_INFO[algo].name}</span>
                     <span className="text-[9px] font-mono text-slate-900 dark:text-gray-400 bg-slate-300 dark:bg-black/50 px-2 py-0.5 rounded">{ALGO_INFO[algo].complexity}</span>
                  </div>
                  <p className="text-[9px] text-slate-900 dark:text-gray-400 leading-relaxed">{ALGO_INFO[algo].desc}</p>
               </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4 bg-[#a1afbb] dark:bg-white/5 p-4 rounded-xl border border-slate-300 dark:border-white/10 shrink-0">
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-900 dark:text-gray-400">
                     <span className="flex items-center gap-1"><Database size={10} /> ARRAY_CAPACITY</span>
                     <span className="text-blue-800 dark:text-blue-400">{arraySize} Blocks</span>
                  </div>
                  <input type="range" min="10" max="150" value={arraySize} onChange={(e) => setArraySize(Number(e.target.value))} disabled={isSorting || role === 'viewer'}
                     className="w-full h-1 bg-slate-400 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-900 dark:text-gray-400">
                     <span className="flex items-center gap-1"><Gauge size={10} /> ENGINE_SPEED</span>
                     <span className="text-blue-800 dark:text-blue-400">{speed}%</span>
                  </div>
                  <input type="range" min="1" max="100" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} disabled={role === 'viewer'}
                     className="w-full h-1 bg-slate-400 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
               </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
               <button onClick={startSort} disabled={role === 'viewer'}
                  className={`py-3 rounded-xl font-black text-[10px] lg:text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                     isSorting && !isPaused
                     ? 'bg-orange-400 text-black border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                     : 'bg-green-400 text-black border border-green-500 shadow-[0_0_15px_rgba(74,222,128,0.4)] hover:scale-[1.02]'
                  }`}
               >
                  {isSorting && !isPaused ? <Pause size={14} fill="currentColor"/> : <Play size={14} fill="currentColor"/>}
                  {isSorting && !isPaused ? 'START' : isSorting ? 'RESUME' : 'INITIATE'}
               </button>
               
               <button onClick={resolveStep} disabled={!isPaused || !isSorting || role === 'viewer'}
                  className="py-3 bg-blue-400 dark:bg-blue-500/20 border border-blue-500 dark:border-blue-500/50 hover:bg-blue-500 dark:hover:bg-blue-500/30 text-black dark:text-blue-400 rounded-xl font-bold text-[10px] lg:text-xs flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
               >
                  <StepForward size={14} /> STEP
               </button>
            </div>
            
            <button onClick={resetArray} disabled={role === 'viewer'} className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-900 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors shrink-0 disabled:opacity-50">
               <RotateCcw size={12}/> REGENERATE ARRAY
            </button>

            {/* DEDICATED OUTPUT CONSOLE */}
            <div className="mt-4 flex-1 min-h-[120px] lg:min-h-[150px] bg-gradient-to-br from-[#c4c3ff] via-[#e6e6ff] to-[#fce4ff] dark:bg-none dark:bg-black/90 border border-blue-300 dark:border-blue-500/30 rounded-xl flex flex-col overflow-hidden shadow-inner shrink-0">
                <div className="px-3 py-2 border-b border-blue-300 dark:border-blue-500/30 bg-blue-100 dark:bg-blue-900/20 flex items-center gap-2 shrink-0">
                    <Terminal size={12} className="text-blue-700 dark:text-blue-400" />
                    <span className="text-[9px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">SYSTEM_LOGS</span>
                </div>
                <div className="p-3 overflow-y-auto custom-scrollbar flex-1 font-mono text-[10px] text-slate-900 dark:text-gray-300 flex flex-col gap-1">
                    {outputLog.map((log, i) => (
                        <div key={i} className={`flex items-start ${log.includes('Complete') || log.includes('SUCCESS') ? 'text-blue-700 dark:text-blue-400 font-bold' : log.includes('Abort') ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-gray-400'}`}>
                            <span className="opacity-50 mr-2 shrink-0">{String(i).padStart(2, '0')}</span>
                            {log}
                        </div>
                    ))}
                    <div ref={outputEndRef} />
                </div>
            </div>

          </div>
        </div>

        {/* VISIBLE GLOWING SEPARATOR LINE (Mobile Only) */}
        <div className="lg:hidden h-[2px] w-full bg-gradient-to-r from-blue-500/10 via-blue-500/60 to-blue-500/10 shrink-0 z-30 order-2" />

        {/* --- RIGHT PANEL: THE ARENA --- */}
        <div className="order-3 lg:order-2 flex-1 relative flex flex-col p-3 sm:p-4 lg:p-6 min-w-0 overflow-hidden lg:h-full w-full">
          
          {/* SMALL HUD TOGGLE BUTTON */}
          <div className="flex justify-start lg:justify-start items-center mb-2 lg:mb-3 shrink-0 gap-2">
             <button 
                onClick={() => setShowHUD(!showHUD)}
                className="h-7 lg:h-8 px-3 bg-white/60 backdrop-blur-xl dark:bg-[#050505] border border-emerald-400 dark:border-emerald-500/80 rounded-lg lg:rounded-full text-emerald-600 dark:text-emerald-400 font-black text-[10px] flex items-center gap-1.5 tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:shadow-sm dark:hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all shadow-sm dark:shadow-[0_0_10px_rgba(16,185,129,0.2)] uppercase z-40"
             >
                {showHUD ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                {showHUD ? 'HIDE HUD' : 'SHOW HUD'}
             </button>
          </div>

          {/* Central Arena: Array Data Pillars */}
          <div className="flex-1 min-h-0 border border-slate-200 dark:border-white/5 bg-white/60 backdrop-blur-xl/50 dark:bg-black/30 rounded-2xl relative flex flex-col shadow-inner overflow-hidden mb-2 lg:mb-4 w-full">
             
             {/* Status Badge inside Canvas */}
             <div className="absolute top-4 right-6 z-20 flex items-center gap-2 lg:gap-3 px-3 py-1.5 bg-white/40 backdrop-blur-2xl/90 dark:bg-[#0a0a14]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-full shadow-lg">
                <Activity size={12} className={isSorting ? 'text-emerald-500 animate-pulse' : 'text-slate-400 dark:text-gray-600'} />
                <span className="text-[8px] lg:text-[10px] font-mono font-bold text-slate-900 dark:text-white uppercase tracking-widest">{message}</span>
             </div>

             {/* HORIZONTAL SCROLLABLE DATA BARS */}
             <div className="flex-1 w-full overflow-x-auto overflow-y-hidden custom-scrollbar touch-pan-x flex items-end">
                <div className="min-w-max w-full flex items-end justify-start lg:justify-center gap-[4px] md:gap-[6px] px-6 lg:px-12 h-full pb-4 pt-16">
                    <AnimatePresence>
                        {array.map((val, i) => {
                            const isCompare = activeIndices.includes(i) && opType === 'compare';
                            const isSwap = activeIndices.includes(i) && opType === 'swap';
                            const isOverwrite = activeIndices.includes(i) && opType === 'overwrite';
                            const isSorted = sortedIndices.includes(i);
                            const isPivot = pivotIndex === i;

                            let barColor = 'bg-slate-500 dark:bg-[#1f2937]'; // Default gray
                            let glow = '';
                            
                            if (isSorted) { barColor = 'bg-emerald-500 dark:bg-[#10b981]'; glow = 'shadow-[0_0_15px_rgba(16,185,129,0.5)]'; } // Emerald
                            else if (isPivot) { barColor = 'bg-fuchsia-500 dark:bg-[#d946ef]'; glow = 'shadow-[0_0_20px_rgba(217,70,239,0.8)] z-10'; } // Fuchsia/Magenta
                            else if (isSwap) { barColor = 'bg-red-500 dark:bg-[#ef4444]'; glow = 'shadow-[0_0_20px_rgba(239,68,68,0.8)] z-10'; } // Red
                            else if (isOverwrite) { barColor = 'bg-amber-500 dark:bg-[#f59e0b]'; glow = 'shadow-[0_0_20px_rgba(245,158,11,0.8)] z-10'; } // Amber/Orange
                            else if (isCompare) { barColor = 'bg-cyan-500 dark:bg-[#06b6d4]'; glow = 'shadow-[0_0_20px_rgba(6,182,212,0.8)] z-10'; } // Cyan

                            return (
                                <motion.div
                                    layout
                                    key={i}
                                    // ADDED min-w-[8px] to force horizontal scrolling on large arrays!
                                    className={`relative rounded-t flex-1 max-w-[48px] min-w-[8px] lg:min-w-[12px] transition-colors duration-100 ${barColor} ${glow}`}
                                    style={{ height: `${Math.max(val, 2)}%` }} // Minimum height so 0 values are still visible
                                >
                                    {/* Value Label (Only show if bars are thick enough) */}
                                    {arraySize <= 40 && (
                                        <span className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] lg:text-[9px] font-mono font-bold ${isSorted ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-700 dark:text-gray-400'}`}>
                                            {val}
                                        </span>
                                    )}
                                    
                                    {/* Flash effect on active blocks */}
                                    {(isCompare || isSwap || isOverwrite) && (
                                        <motion.div 
                                            className="absolute inset-0 bg-white/30 rounded-t"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
             </div>
             
             {/* Floor Line */}
             <div className="w-full h-1 bg-slate-200 dark:bg-white/5 rounded-b-2xl shrink-0" />
          </div>

          {/* BOTTOM HUD TRACE */}
          <AnimatePresence initial={false}>
              {showHUD && (
                  <motion.div 
                     initial={{ height: 0, opacity: 0, marginTop: 0 }}
                     animate={{ height: typeof window !== 'undefined' && window.innerWidth < 1024 ? 120 : 160, opacity: 1, marginTop: 12 }}
                     exit={{ height: 0, opacity: 0, marginTop: 0 }}
                     transition={{ duration: 0.4, ease: "easeInOut" }}
                     className="w-full shrink-0 overflow-hidden" 
                  >
                     <div className="w-full h-full bg-white/40 backdrop-blur-2xl/90 dark:bg-black/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl flex flex-col shadow-2xl overflow-hidden relative">
                         <div className="px-3 lg:px-4 py-2 lg:py-3 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/60 backdrop-blur-xl dark:bg-white/5 shrink-0">
                            <div className="flex items-center gap-1.5 lg:gap-2 text-emerald-600 dark:text-emerald-400">
                                <Terminal size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4"/>
                                <span className="text-[9px] lg:text-[10px] font-black tracking-widest uppercase">Hinglish_Logic_Trace</span>
                            </div>
                         </div>
                         <div className="p-3 lg:p-4 space-y-2 lg:space-y-3 overflow-y-auto custom-scrollbar flex-1">
                            {codeLines.map(line => (
                               <div key={line.id} className={`flex flex-col text-[10px] lg:text-sm transition-all ${line.active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
                                  <div className={`font-mono ${line.active ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-gray-400'}`}>{line.text}</div>
                                  {line.active && <div className="text-[9px] lg:text-xs text-amber-600 dark:text-amber-400 mt-0.5 lg:mt-1 flex items-center gap-1.5 lg:gap-2 leading-relaxed"><ArrowRight size={12} className="w-3 h-3 shrink-0"/> {line.explanation}</div>}
                               </div>
                            ))}
                            <div ref={interpreterEndRef} />
                         </div>
                     </div>
                  </motion.div>
              )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default SortingVisualizer;