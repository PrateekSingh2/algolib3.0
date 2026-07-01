import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Trash2, RotateCcw, 
  Zap, ArrowRight, Play, Pause, StepForward, StepBack,
  Terminal, Activity, Box, Maximize2, Minimize2, Settings2, Database,
  ArrowDownToLine, Info, X
} from 'lucide-react';
import { useCollaboration } from '@/contexts/CollaborationContext';

// --- TYPES & GAME STATE ---
type HeapNode = {
    id: string;
    value: number;
};

type CodeLine = { id: string; text: string; explanation: string; active: boolean };
type VariableState = { name: string; value: string; color: string };
type HeapMode = 'max' | 'min';

type VisualFrame = {
  heap: HeapNode[];
  phantom: {val: number | string, id: string, label?: string} | null;
  highlightIndices: number[];
  comparingIndices: number[];
  swappingIndices: number[];
  codeLines: CodeLine[];
  variables: VariableState[];
  message: string;
  outputLog: string[];
  outputTitle: string;
};

// --- ALGORITHM EXECUTION MATRIX ---
const SNIPPETS: Record<string, { id: string, text: string, explanation: string, active: boolean }[]> = {
  insert: [
    { id: '1', text: 'heap.push(val);', explanation: 'Appending new value to the end of the heap array (bottom level of tree).', active: false },
    { id: '2', text: 'let curr = heap.length - 1;', explanation: 'Initializing pointer at the newly inserted node.', active: false },
    { id: '3', text: 'while (curr > 0)', explanation: 'Initiating Up-Heap (Bubble Up) procedure to restore heap property.', active: false },
    { id: '4', text: 'if (compare(heap[curr], heap[parent]))', explanation: 'Comparing current node with its parent.', active: false },
    { id: '5', text: 'swap(curr, parent);', explanation: 'Heap property violated. Swapping current node with its parent.', active: false },
    { id: '6', text: 'curr = parent;', explanation: 'Moving pointer up to the parent index.', active: false },
    { id: '7', text: 'break;', explanation: 'Heap property satisfied. Up-Heap complete.', active: false }
  ],
  extract: [
    { id: '1', text: 'if (heap.length === 0) return null;', explanation: 'Heap is empty. Aborting extraction.', active: false },
    { id: '2', text: 'let rootVal = heap[0];', explanation: 'Caching the root value for extraction.', active: false },
    { id: '3', text: 'heap[0] = heap.pop();', explanation: 'Replacing root with the last element in the heap.', active: false },
    { id: '4', text: 'heapifyDown(0);', explanation: 'Initiating Down-Heap (Heapify) procedure from the root.', active: false }
  ],
  heapify: [
    { id: 'h1', text: 'let extreme = index;', explanation: 'Setting current node as the initial extreme (max/min) candidate.', active: false },
    { id: 'h2', text: 'if (compare(heap[left], heap[extreme]))', explanation: 'Checking if left child is more extreme than current candidate.', active: false },
    { id: 'h3', text: 'extreme = left;', explanation: 'Left child is more extreme. Updating candidate index.', active: false },
    { id: 'h4', text: 'if (compare(heap[right], heap[extreme]))', explanation: 'Checking if right child is more extreme than current candidate.', active: false },
    { id: 'h5', text: 'extreme = right;', explanation: 'Right child is more extreme. Updating candidate index.', active: false },
    { id: 'h6', text: 'if (extreme !== index)', explanation: 'Checking if a swap is required to maintain heap property.', active: false },
    { id: 'h7', text: 'swap(index, extreme);', explanation: 'Swapping current node with the most extreme child.', active: false },
    { id: 'h8', text: 'heapifyDown(extreme);', explanation: 'Recursively heapifying down from the new position.', active: false },
    { id: 'h9', text: 'return;', explanation: 'Subtree satisfies heap property. Heapify complete.', active: false }
  ]
};

const CyberGrid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-white/60 backdrop-blur-xl dark:bg-[#09090b]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.05),transparent_70%)]" />
  </div>
);

const HeapVisualizer = () => {
  const [heap, setHeap] = useState<HeapNode[]>([]);
  const [inputValue, setInputValue] = useState<number | ''>('');
  
  // HUD State
  const [showHUD, setShowHUD] = useState(false); 
  const [heapMode, setHeapMode] = useState<HeapMode>('max');

  // Engine State
  const [isPaused, setIsPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // FRAME-BASED ANIMATION ENGINE
  const [frames, setFrames] = useState<VisualFrame[]>([]);
  const [frameIdx, setFrameIdx] = useState<number>(0);

  // Visual states synced to current frame
  const [message, setMessage] = useState('SYSTEM_IDLE: Ready for input');
  const [codeLines, setCodeLines] = useState<CodeLine[]>([]);
  const [variables, setVariables] = useState<VariableState[]>([]);
  const [phantom, setPhantom] = useState<{val: number | string, id: string, label?: string} | null>(null);
  const [highlightIndices, setHighlightIndices] = useState<number[]>([]);
  const [comparingIndices, setComparingIndices] = useState<number[]>([]);
  const [swappingIndices, setSwappingIndices] = useState<number[]>([]);
  const [outputLog, setOutputLog] = useState<string[]>([]);
  const [outputTitle, setOutputTitle] = useState<string>("OUTPUT_CONSOLE");

  const interpreterScrollRef = useRef<HTMLDivElement>(null);
  const outputScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { generateRandom(); }, []);
  
  // Scoped interior scrolling
  useEffect(() => { 
    if (interpreterScrollRef.current) {
        interpreterScrollRef.current.scrollTo({ top: interpreterScrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [codeLines]);
  
  useEffect(() => { 
    if (outputScrollRef.current) {
        outputScrollRef.current.scrollTo({ top: outputScrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [outputLog]);

  // --- COLLABORATION HOOK ---
  const { role, roomState, broadcastState } = useCollaboration();

  // Host Broadcasts State
  useEffect(() => {
    if (role === 'host') {
      broadcastState({
        heap, heapMode, isPaused, isAnimating,
        frames, frameIdx, message, codeLines, variables,
        phantom, highlightIndices, comparingIndices, swappingIndices,
        outputLog, outputTitle, inputValue
      });
    }
  }, [heap, heapMode, isPaused, isAnimating, frames, frameIdx, message, codeLines, variables, phantom, highlightIndices, comparingIndices, swappingIndices, outputLog, outputTitle, inputValue, role, broadcastState]);

  // Viewer Receives State
  useEffect(() => {
    if (role === 'viewer' && roomState) {
        if (roomState.heap !== undefined) setHeap(roomState.heap || []);
        if (roomState.heapMode !== undefined) setHeapMode(roomState.heapMode);
        if (roomState.isPaused !== undefined) setIsPaused(roomState.isPaused);
        if (roomState.isAnimating !== undefined) setIsAnimating(roomState.isAnimating);
        if (roomState.frames !== undefined) setFrames(roomState.frames || []);
        if (roomState.frameIdx !== undefined) setFrameIdx(roomState.frameIdx);
        if (roomState.message !== undefined) setMessage(roomState.message);
        if (roomState.codeLines !== undefined) setCodeLines(roomState.codeLines || []);
        if (roomState.variables !== undefined) setVariables(roomState.variables || []);
        if (roomState.phantom !== undefined) setPhantom(roomState.phantom || null);
        if (roomState.highlightIndices !== undefined) setHighlightIndices(roomState.highlightIndices || []);
        if (roomState.comparingIndices !== undefined) setComparingIndices(roomState.comparingIndices || []);
        if (roomState.swappingIndices !== undefined) setSwappingIndices(roomState.swappingIndices || []);
        if (roomState.outputLog !== undefined) setOutputLog(roomState.outputLog || []);
        if (roomState.outputTitle !== undefined) setOutputTitle(roomState.outputTitle);
        if (roomState.inputValue !== undefined) setInputValue(roomState.inputValue);
    }
  }, [role, roomState]);

  // Sync visual components to the active frame
  useEffect(() => {
    if (frames.length > 0 && frameIdx >= 0 && frameIdx < frames.length) {
        const f = frames[frameIdx];
        setHeap(f.heap);
        setPhantom(f.phantom);
        setHighlightIndices(f.highlightIndices);
        setComparingIndices(f.comparingIndices);
        setSwappingIndices(f.swappingIndices);
        setCodeLines(f.codeLines);
        setVariables(f.variables);
        setMessage(f.message);
        setOutputLog(f.outputLog);
        setOutputTitle(f.outputTitle);
        
        // Final frame cleanup
        if (frameIdx === frames.length - 1) {
            const tm = setTimeout(() => {
                setHighlightIndices([]);
                setComparingIndices([]);
                setSwappingIndices([]);
                setIsAnimating(false);
                setFrames([]);
                setCodeLines([]);
                setVariables([]);
                generateRandom();
            }, 1200);
            return () => clearTimeout(tm);
        }
    }
  }, [frameIdx, frames]);

  // Autoplay engine
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (role !== 'viewer' && !isPaused && isAnimating && frames.length > 0 && frameIdx < frames.length - 1) {
        timer = setTimeout(() => {
            setFrameIdx(prev => prev + 1);
        }, 1300); 
    }
    return () => clearTimeout(timer);
  }, [isPaused, isAnimating, frameIdx, frames, role]);

  const centerWorkspace = () => {
    if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
        container.scrollTop = 0;
    }
  };

  useEffect(() => {
    centerWorkspace();
    const timeout = setTimeout(centerWorkspace, 150);
    return () => clearTimeout(timeout);
  }, []);

  // Math Helpers
  const generateRandom = () => setInputValue(Math.floor(Math.random() * 99) + 1);
  const getParent = (i: number) => Math.floor((i - 1) / 2);
  const getLeft = (i: number) => 2 * i + 1;
  const getRight = (i: number) => 2 * i + 2;

  const compare = (a: number, b: number) => {
      return heapMode === 'max' ? a > b : a < b;
  };

  const getExtremityWord = () => heapMode === 'max' ? 'Larger' : 'Smaller';

  // --- OPERATIONS ---
  const handleInsert = () => {
      if (inputValue === '' || isAnimating) return;
      const val = Number(inputValue);

      setIsAnimating(true);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ left: (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth) / 2, top: 0, behavior: 'smooth' });

      const title = "INSERTION_LOG";
      let currentLog = [...outputLog, `> Initiating insertion for [${val}]...`];
      let newFrames: VisualFrame[] = [];
      let currentHeap = [...heap];
      const newNode: HeapNode = { id: Math.random().toString(36).substr(2, 9), value: val };

      const addFrame = (lineId: string | null, msg: string, high: number[] = [], comp: number[] = [], swap: number[] = [], vars: VariableState[] = [], phantomState = null) => {
          const snippet = SNIPPETS['insert'];
          const currentLine = lineId ? snippet.find(l => l.id === lineId) : null;
          newFrames.push({
              heap: [...currentHeap],
              phantom: phantomState,
              highlightIndices: high,
              comparingIndices: comp,
              swappingIndices: swap,
              codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })),
              variables: vars.map(v => ({...v})),
              message: msg || (currentLine ? currentLine.explanation : 'Processing...'),
              outputLog: [...currentLog],
              outputTitle: title
          });
      };

      currentHeap.push(newNode);
      let curr = currentHeap.length - 1;
      currentLog.push(`> Appended [${val}] at index [${curr}].`);
      
      addFrame('1', `Allocated memory and appended [${val}] to heap array.`, [curr], [], [], [{ name: 'val', value: `${val}`, color: '#00ff88' }]);
      addFrame('2', `Initializing pointer at index [${curr}].`, [curr], [], [], [{ name: 'curr', value: `${curr}`, color: '#00f5ff' }]);
      
      while (curr > 0) {
          let p = getParent(curr);
          addFrame('3', `Checking heap property...`, [curr], [], [], [{ name: 'curr', value: `${curr}`, color: '#00f5ff' }, { name: 'parent', value: `${p}`, color: '#facc15' }]);
          addFrame('4', `Comparing [${currentHeap[curr].value}] with parent [${currentHeap[p].value}].`, [], [curr, p], [], []);

          if (compare(currentHeap[curr].value, currentHeap[p].value)) {
              currentLog.push(`> [${currentHeap[curr].value}] is ${getExtremityWord()} than [${currentHeap[p].value}]. Swapping.`);
              addFrame('5', `Heap violation detected. Executing Swap.`, [], [], [curr, p], []);
              
              // Perform physical swap
              let temp = currentHeap[curr];
              currentHeap[curr] = currentHeap[p];
              currentHeap[p] = temp;
              
              addFrame('5', `Swap complete.`, [p], [], [], []);
              addFrame('6', `Moving pointer to parent index.`, [p], [], [], [{ name: 'curr', value: `${p}`, color: '#00f5ff' }]);
              curr = p;
          } else {
              currentLog.push(`> Heap property verified at index [${curr}].`);
              addFrame('7', `Parent is ${getExtremityWord() === 'Larger' ? 'larger' : 'smaller'}. Heap property maintained. Breaking loop.`, [curr], [], [], []);
              break;
          }
      }

      currentLog.push(`> EXECUTION_COMPLETE: Node inserted.`);
      newFrames.push({
          heap: [...currentHeap], phantom: null, highlightIndices: [], comparingIndices: [], swappingIndices: [], codeLines: [], variables: [],
          message: "EXECUTION_COMPLETE: Node successfully inserted.", outputLog: [...currentLog], outputTitle: title
      });

      setFrames(newFrames);
      setFrameIdx(0);
  };

  const handleExtract = () => {
      if (heap.length === 0 || isAnimating) return;
      
      setIsAnimating(true);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ left: (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth) / 2, top: 0, behavior: 'smooth' });

      const title = "EXTRACTION_LOG";
      let currentLog = [...outputLog, `> Initiating extraction of Root...`];
      let newFrames: VisualFrame[] = [];
      let currentHeap = [...heap];
      let extractedNode = currentHeap[0];

      const addExtFrame = (lineId: string | null, msg: string, high: number[] = [], comp: number[] = [], swap: number[] = [], vars: VariableState[] = [], phantomState: any = null) => {
          const snippet = SNIPPETS['extract'];
          const currentLine = lineId ? snippet.find(l => l.id === lineId) : null;
          newFrames.push({
              heap: [...currentHeap], phantom: phantomState, highlightIndices: high, comparingIndices: comp, swappingIndices: swap,
              codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })), variables: vars.map(v => ({...v})),
              message: msg || (currentLine ? currentLine.explanation : 'Processing...'), outputLog: [...currentLog], outputTitle: title
          });
      };

      let pState = { val: extractedNode.value, id: extractedNode.id, label: 'Extracted' };
      addExtFrame('2', `Caching Root value [${extractedNode.value}].`, [0], [], [], [{ name: 'rootVal', value: `${extractedNode.value}`, color: '#00ff88' }], pState);

      if (currentHeap.length === 1) {
          currentHeap.pop();
          currentLog.push(`> SUCCESS: Extracted [${extractedNode.value}]. Heap is now empty.`);
          newFrames.push({
              heap: [], phantom: pState, highlightIndices: [], comparingIndices: [], swappingIndices: [], codeLines: [], variables: [],
              message: "EXECUTION_COMPLETE: Heap is empty.", outputLog: [...currentLog], outputTitle: title
          });
          setFrames(newFrames);
          setFrameIdx(0);
          return;
      }

      let lastNode = currentHeap.pop()!;
      currentLog.push(`> Replacing Root with last node [${lastNode.value}].`);
      addExtFrame('3', `Targeting last element in heap.`, [currentHeap.length], [], [], [], pState); // length is conceptually the last index before pop visual
      
      currentHeap[0] = lastNode; // Replace
      addExtFrame('3', `Root replaced by last element.`, [0], [], [], [], pState);

      currentLog.push(`> Initiating Heapify-Down from Root...`);
      addExtFrame('4', `Initiating Down-Heap (Heapify) to restore structure.`, [0], [], [], [], pState);

      // HEAPIFY LOGIC
      const addHeapifyFrame = (lineId: string | null, msg: string, high: number[] = [], comp: number[] = [], swap: number[] = [], vars: VariableState[] = []) => {
          const snippet = SNIPPETS['heapify'];
          const currentLine = lineId ? snippet.find(l => l.id === lineId) : null;
          newFrames.push({
              heap: [...currentHeap], phantom: pState, highlightIndices: high, comparingIndices: comp, swappingIndices: swap,
              codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })), variables: vars.map(v => ({...v})),
              message: msg || (currentLine ? currentLine.explanation : 'Processing...'), outputLog: [...currentLog], outputTitle: title
          });
      };

      let curr = 0;
      while (true) {
          let left = getLeft(curr);
          let right = getRight(curr);
          let extreme = curr;

          addHeapifyFrame('h1', `Setting Node [${curr}] as current extreme candidate.`, [curr], [], [], [{ name: 'index', value: `${curr}`, color: '#00f5ff' }, { name: 'extreme', value: `${extreme}`, color: '#facc15' }]);

          if (left < currentHeap.length) {
              addHeapifyFrame('h2', `Evaluating left child [${left}].`, [], [curr, left], [], []);
              if (compare(currentHeap[left].value, currentHeap[extreme].value)) {
                  extreme = left;
                  addHeapifyFrame('h3', `Left child is ${getExtremityWord()}. Updating candidate.`, [left], [], [], [{ name: 'extreme', value: `${extreme}`, color: '#facc15' }]);
              }
          }

          if (right < currentHeap.length) {
              addHeapifyFrame('h4', `Evaluating right child [${right}].`, [], [extreme, right], [], []);
              if (compare(currentHeap[right].value, currentHeap[extreme].value)) {
                  extreme = right;
                  addHeapifyFrame('h5', `Right child is ${getExtremityWord()}. Updating candidate.`, [right], [], [], [{ name: 'extreme', value: `${extreme}`, color: '#facc15' }]);
              }
          }

          if (extreme !== curr) {
              currentLog.push(`> Swapping [${currentHeap[curr].value}] with extreme child [${currentHeap[extreme].value}].`);
              addHeapifyFrame('h6', `Extreme differs from current index. Swap required.`, [curr, extreme], [], [], []);
              addHeapifyFrame('h7', `Executing Swap down the tree.`, [], [], [curr, extreme], []);
              
              let temp = currentHeap[curr];
              currentHeap[curr] = currentHeap[extreme];
              currentHeap[extreme] = temp;

              addHeapifyFrame('h7', `Swap complete.`, [extreme], [], [], []);
              addHeapifyFrame('h8', `Recursively continuing Heapify-Down from index [${extreme}].`, [extreme], [], [], []);
              curr = extreme;
          } else {
              currentLog.push(`> Heap property verified at Subtree [${curr}].`);
              addHeapifyFrame('h9', `No children are ${getExtremityWord().toLowerCase()}. Heap property restored.`, [curr], [], [], []);
              break;
          }
      }

      currentLog.push(`> EXECUTION_COMPLETE: Extraction successful.`);
      newFrames.push({
          heap: [...currentHeap], phantom: pState, highlightIndices: [], comparingIndices: [], swappingIndices: [], codeLines: [], variables: [],
          message: "EXECUTION_COMPLETE: Value extracted.", outputLog: [...currentLog], outputTitle: title
      });

      setFrames(newFrames);
      setFrameIdx(0);
  };

  // Coordinates Calculator for Complete Binary Tree
  const getCoords = (index: number, maxNodes: number) => {
      const maxLevel = Math.max(0, Math.floor(Math.log2(maxNodes || 1)));
      const level = Math.floor(Math.log2(index + 1));
      const y = level * 85 + 70; // Vertical spacing
      
      let x = 0;
      let curr = index;
      let path = [];
      while (curr > 0) {
          let parent = getParent(curr);
          path.push((getLeft(parent)) === curr); // true if left
          curr = parent;
      }
      path.reverse();
      
      // Dynamic horizontal gap based on total depth to prevent overlap
      let gap = Math.pow(2, maxLevel - 1) * 35; 
      if (maxLevel > 4) gap = Math.pow(2, maxLevel - 1) * 20;

      for (let isLeft of path) {
          if (isLeft) x -= gap;
          else x += gap;
          gap = gap / 2;
      }
      return { x, y };
  };

  const renderTreeEdges = () => {
      const edges = [];
      for (let i = 0; i < heap.length; i++) {
          const parentCoords = getCoords(i, heap.length);
          const left = getLeft(i);
          const right = getRight(i);

          if (left < heap.length) {
              const childCoords = getCoords(left, heap.length);
              edges.push(
                  <motion.line key={`edge-${heap[i].id}-${heap[left].id}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      x1={`calc(50% + ${parentCoords.x}px)`} y1={parentCoords.y} 
                      x2={`calc(50% + ${childCoords.x}px)`} y2={childCoords.y} 
                      stroke="#52525b" strokeWidth="3" 
                  />
              );
          }
          if (right < heap.length) {
              const childCoords = getCoords(right, heap.length);
              edges.push(
                  <motion.line key={`edge-${heap[i].id}-${heap[right].id}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      x1={`calc(50% + ${parentCoords.x}px)`} y1={parentCoords.y} 
                      x2={`calc(50% + ${childCoords.x}px)`} y2={childCoords.y} 
                      stroke="#52525b" strokeWidth="3" 
                  />
              );
          }
      }
      return edges;
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row-reverse gap-4 lg:gap-6 h-full w-full relative font-sans text-slate-900 dark:text-white lg:p-3">
      
      {/* LEFT: COMMAND CENTER */}
      <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 flex-1 min-h-0 lg:flex-none overflow-y-auto custom-scrollbar lg:pr-2 pb-4 lg:pb-0">
        
        {/* Controls Block 1 */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-5 shadow-sm shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <Settings2 size={18} /> Controls
            </div>
            <button 
              onClick={() => setShowInfo(true)}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
            >
              <Info size={16} />
            </button>
          </div>
            {/* Heap Mode Toggle */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-gray-400 uppercase flex items-center gap-1"><Settings2 size={12}/> Architecture</span>
                    <span className={`text-xs font-black ${heapMode === 'max' ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}`}>
                        {heapMode === 'max' ? 'MAX HEAP' : 'MIN HEAP'}
                    </span>
                </div>
                <button 
                    onClick={() => { setHeapMode(heapMode === 'max' ? 'min' : 'max'); setHeap([]); setOutputLog([]); setTimeout(centerWorkspace, 100); }}
                    disabled={isAnimating || role === 'viewer'}
                    className="px-3 py-1.5 bg-gradient-to-br from-[#c4c3ff] via-[#e6e6ff] to-[#fce4ff] dark:bg-none dark:bg-black/50 border border-slate-300 dark:border-white/20 rounded hover:border-slate-400 dark:hover:border-white/50 text-[9px] font-black text-slate-900 dark:text-white uppercase transition-all disabled:opacity-30 shadow-sm dark:shadow-none"
                >
                    Switch
                </button>
            </div>

            {/* Playback Controls */}
            <div className="space-y-4 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-700 dark:text-gray-400 uppercase">Step Engine</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${isPaused ? 'border-amber-500 text-amber-600 dark:text-amber-500' : 'border-cyan-500 text-cyan-600 dark:text-cyan-500'}`}>
                    {isPaused ? 'MANUAL' : 'AUTO'}
                </span>
              </div>
              <div className="flex gap-2">
                <button disabled={role === 'viewer'} onClick={() => setIsPaused(!isPaused)} className="flex-1 py-2 bg-blue-400 dark:bg-blue-500/20 backdrop-blur-xl border border-blue-500 dark:border-blue-500/50 rounded flex items-center justify-center gap-2 text-xs font-bold hover:bg-blue-500 dark:hover:bg-blue-500/30 transition-all text-black dark:text-blue-400 disabled:opacity-50">
                  {isPaused ? <Play size={14}/> : <Pause size={14}/>} {isPaused ? 'AUTOPLAY' : 'MANUAL'}
                </button>
                <div className="flex flex-1 gap-1">
                    <button 
                      disabled={!isPaused || !isAnimating || frameIdx <= 0 || role === 'viewer'} 
                      onClick={() => setFrameIdx(f => Math.max(0, f - 1))} 
                      className="flex-1 py-2 bg-cyan-600 text-white rounded flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black hover:bg-cyan-500 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      <StepBack size={14} /> PREV
                    </button>
                    <button 
                      disabled={!isPaused || !isAnimating || frameIdx >= frames.length - 1 || role === 'viewer'} 
                      onClick={() => setFrameIdx(f => Math.min(frames.length - 1, f + 1))} 
                      className="flex-1 py-2 bg-cyan-500 text-black rounded flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black hover:bg-cyan-400 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      NEXT <StepForward size={14} />
                    </button>
                </div>
              </div>
            </div>
        </div>

        {/* Controls Block 2 */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-5 shadow-sm shrink-0">
            {/* Core Controls */}
            <div className="space-y-4">
               <div className="flex gap-2">
                  <div className="flex-1">
                      <label className="text-[9px] text-slate-700 dark:text-gray-500 uppercase font-bold">Node Payload</label>
                      <div className="flex gap-1 mt-1">
                          <input disabled={role === 'viewer'} type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-gradient-to-br from-[#c4c3ff] via-[#e6e6ff] to-[#fce4ff] dark:bg-none dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded px-3 py-2 text-cyan-600 dark:text-cyan-400 outline-none font-mono text-sm dark:text-white disabled:opacity-50" />
                          <button disabled={role === 'viewer'} onClick={generateRandom} className="px-3 bg-blue-400 dark:bg-blue-500/20 rounded border border-blue-500 dark:border-blue-500/50 hover:bg-blue-500 dark:hover:bg-blue-500/30 text-black dark:text-blue-400 font-bold transition-all disabled:opacity-50"><RotateCcw size={14}/></button>
                      </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={handleInsert} disabled={isAnimating || role === 'viewer'} className="p-3 bg-green-400 dark:bg-green-500/20 border border-green-500 dark:border-green-500/50 text-black dark:text-green-400 rounded hover:bg-green-500 dark:hover:bg-green-500/30 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50 transition-all">
                     <Plus size={16}/> INSERT
                  </button>
                  <button onClick={handleExtract} disabled={isAnimating || heap.length === 0 || role === 'viewer'} className="p-3 bg-orange-400 dark:bg-orange-500/20 border border-orange-500 dark:border-orange-500/50 text-black dark:text-orange-400 rounded hover:bg-orange-500 dark:hover:bg-orange-500/30 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50 transition-all">
                     <ArrowDownToLine size={16}/> EXTRACT ROOT
                  </button>
               </div>
            </div>

            <button onClick={() => { if(role !== 'viewer') { setHeap([]); setOutputLog([]); setTimeout(centerWorkspace, 50); } }} disabled={isAnimating || role === 'viewer'} className="w-full py-2 shrink-0 bg-orange-400 dark:bg-orange-500/20 hover:bg-orange-500 dark:hover:bg-orange-500/30 hover:text-black dark:hover:text-orange-400 border border-orange-500 dark:border-orange-500/50 rounded text-[10px] font-bold text-black dark:text-orange-400 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
                  <Trash2 size={14}/> FLUSH HEAP MEMORY
            </button>
        </div>

        {/* Controls Block 3 (Terminal) */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-5 shadow-sm shrink-0 mt-auto">
            {/* DEDICATED OUTPUT SCREEN */}
            <div className="flex-1 min-h-[120px] lg:min-h-[150px] bg-slate-50 dark:bg-[#161b22] border border-cyan-200 dark:border-[#30363d] rounded-xl flex flex-col overflow-hidden shadow-inner">
                 <div className="px-3 py-2 border-b border-cyan-200 dark:border-[#30363d] bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] flex items-center gap-2 shrink-0">
                    <Terminal size={12} className="text-cyan-600 dark:text-cyan-400" />
                    <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">{outputTitle}</span>
                </div>
                <div ref={outputScrollRef} className="p-3 overflow-y-auto custom-scrollbar flex-1 font-mono text-[11px] text-slate-800 dark:text-gray-300 flex flex-col gap-1">
                    {outputLog.length === 0 ? (
                        <span className="text-slate-400 dark:text-gray-600 italic mt-1">Awaiting execution...</span>
                    ) : (
                        outputLog.map((log, i) => (
                           <div key={i} className={`flex items-start ${log.includes('SUCCESS') || log.includes('COMPLETE') ? 'text-emerald-600 dark:text-emerald-400 font-bold' : log.includes('FAILED') || log.includes('Abort') ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-gray-400'}`}>
                               <span className="opacity-50 mr-2 shrink-0">{String(i).padStart(2, '0')}</span>
                               {log}
                           </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT: THE ARENA */}
      <div className="h-[48vh] shrink-0 lg:h-auto lg:flex-1 bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden flex flex-col">
          
          <div className="flex justify-between items-center mb-2 lg:mb-3 shrink-0 gap-2">
             <button 
                onClick={() => setShowHUD(!showHUD)}
                className="h-7 lg:h-8 px-3 bg-white dark:bg-[#050505] border border-cyan-400 dark:border-cyan-500/80 rounded-lg lg:rounded-full text-cyan-600 dark:text-cyan-400 font-black text-[10px] flex items-center gap-1.5 tracking-widest hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:shadow-sm dark:hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all shadow-sm dark:shadow-[0_0_10px_rgba(6,182,212,0.2)] uppercase z-40"
             >
                {showHUD ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                {showHUD ? 'HIDE HUD' : 'SHOW HUD'}
             </button>
             
             <div className="flex items-center gap-2 text-[10px] font-mono text-slate-700 dark:text-gray-500 bg-slate-100 dark:bg-black/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5">
                 <Database size={12}/> Size: {heap.length}
             </div>
          </div>

          {/* Central Arena: Tree & Array Canvas */}
          <div className="flex-1 min-h-0 border border-slate-200 dark:border-[#30363d] bg-white/60 backdrop-blur-xl/50 dark:bg-[#0a0c10] rounded-2xl relative flex flex-col shadow-inner overflow-hidden mb-2 lg:mb-4 w-full">
             
             {/* ARRAY VISUALIZER BAR (TOP) */}
             <div className="h-16 lg:h-20 shrink-0 border-b border-slate-200 dark:border-[#30363d] bg-white/40 dark:bg-black/40 flex items-center px-4 overflow-x-auto custom-scrollbar relative z-20">
                <div className="flex gap-1.5 lg:gap-2 items-center min-w-max">
                    <span className="text-[9px] lg:text-[10px] font-mono font-bold text-slate-700 dark:text-gray-500 mr-2 uppercase tracking-widest">Memory[ ]</span>
                    {heap.length === 0 && <span className="text-xs text-slate-400 dark:text-gray-600 italic">Empty Array</span>}
                    <AnimatePresence>
                        {heap.map((node, i) => {
                            let bg = 'bg-white dark:bg-[#09090b]';
                            let border = 'border-slate-300 dark:border-white/10';
                            let text = 'text-slate-900 dark:text-white';
                            if (highlightIndices.includes(i)) { bg = 'bg-yellow-100 dark:bg-yellow-500/20'; border = 'border-yellow-400 dark:border-yellow-500'; text = 'text-yellow-600 dark:text-yellow-400'; }
                            if (comparingIndices.includes(i)) { bg = 'bg-purple-100 dark:bg-purple-500/20'; border = 'border-purple-400 dark:border-purple-500'; text = 'text-purple-600 dark:text-purple-400'; }
                            if (swappingIndices.includes(i)) { bg = 'bg-rose-100 dark:bg-rose-500/20'; border = 'border-rose-400 dark:border-rose-500'; text = 'text-rose-600 dark:text-rose-400'; }

                            return (
                                <motion.div 
                                    key={node.id} layout
                                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
                                    className={`w-10 h-10 lg:w-12 lg:h-12 border flex flex-col items-center justify-center rounded shadow-sm relative ${bg} ${border}`}
                                >
                                    <span className={`text-sm lg:text-base font-black ${text}`}>{node.value}</span>
                                    <span className="absolute -bottom-4 text-[8px] font-mono text-slate-400 dark:text-gray-500">{i}</span>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
             </div>

             {/* Auto-Scrolling Camera Container (TREE) */}
             <div className="flex-1 overflow-auto custom-scrollbar relative touch-pan-x touch-pan-y" ref={scrollContainerRef}>
                 <div className="absolute min-w-[2400px] min-h-[1200px] w-full h-full p-10 pt-10">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {renderTreeEdges()}
                    </svg>
                    <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        <AnimatePresence>
                            {heap.map((node, i) => {
                                const coords = getCoords(i, heap.length);
                                const isHigh = highlightIndices.includes(i);
                                const isComp = comparingIndices.includes(i);
                                const isSwap = swappingIndices.includes(i);

                                // Use CSS variables or literal string based on theme, simplified here for class logic
                                // But since border is inline, we must adapt it.
                                const baseBorderColor = document.documentElement.classList.contains('dark') ? '#0ea5e9' : '#0284c7'; // cyan-500 or 600
                                let borderColor = baseBorderColor; 
                                let shadow = 'none';
                                let label = '';

                                if (isHigh) { borderColor = '#facc15'; shadow = '0 0 30px rgba(250,204,21,0.4)'; label = 'ACTIVE'; }
                                else if (isSwap) { borderColor = '#f43f5e'; shadow = '0 0 30px rgba(244,63,94,0.4)'; label = 'SWAP'; }
                                else if (isComp) { borderColor = '#a855f7'; shadow = '0 0 30px rgba(168,85,247,0.4)'; label = 'COMPARE'; }

                                return (
                                    <motion.div key={node.id} layout
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: isHigh || isSwap ? 1.1 : 1, left: `calc(50% + ${coords.x}px)`, top: coords.y }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        className={`absolute w-12 h-12 lg:w-16 lg:h-16 -ml-6 -mt-6 lg:-ml-8 lg:-mt-8 rounded-full flex flex-col items-center justify-center border-[3px] dark:border-4 shadow-md dark:shadow-xl z-20 bg-white dark:bg-[#09090b]`}
                                        style={{ borderColor, boxShadow: shadow }}
                                    >
                                        <span className="text-[7px] lg:text-[9px] text-slate-400 dark:text-gray-400 font-mono absolute top-1">i: {i}</span>
                                        <span className={`font-black text-lg lg:text-xl mt-1 ${isHigh || isComp || isSwap ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>{node.value}</span>
                                        {i === 0 && <div className="absolute -top-5 lg:-top-6 text-[9px] lg:text-[11px] font-black text-cyan-600 dark:text-cyan-500">ROOT</div>}
                                        {label && (
                                            <div className="absolute -bottom-5 lg:-bottom-6 bg-white/90 dark:bg-black/80 border border-slate-200 dark:border-white/20 text-slate-900 dark:text-white px-1.5 py-0.5 rounded text-[7px] lg:text-[8px] font-black shadow-lg">
                                                {label}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {heap.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-gray-600 font-mono opacity-50 pointer-events-none">
                            <Database size={48} className="mb-4 text-slate-400 dark:text-gray-700" />
                            <p className="text-xs lg:text-sm">[ HEAP_EMPTY :: AWAITING_INSERTION ]</p>
                        </div>
                    )}
                 </div>
             </div>
          </div>

          <div className="shrink-0 flex justify-between items-center text-[10px] lg:text-xs font-mono text-slate-700 dark:text-gray-500 px-2 lg:mb-2">
             <div className="flex items-center gap-2"><Activity size={14} className={isAnimating ? "text-cyan-600 dark:text-cyan-500 animate-spin lg:w-3.5 lg:h-3.5" : "lg:w-3.5 lg:h-3.5"}/> <span className="truncate max-w-[200px] lg:max-w-none">{message}</span></div>
          </div>

          {/* BOTTOM HUD TRACE & HEAP */}
          <AnimatePresence initial={false}>
              {showHUD && (
                  <motion.div 
                     initial={{ height: 0, opacity: 0, marginTop: 0 }}
                     animate={{ height: typeof window !== 'undefined' && window.innerWidth < 1024 ? 120 : 160, opacity: 1, marginTop: 12 }}
                     exit={{ height: 0, opacity: 0, marginTop: 0 }}
                     transition={{ duration: 0.3, ease: "easeInOut" }}
                     className="flex gap-2 lg:gap-4 w-full shrink-0 overflow-hidden" 
                  >
                     <div className="flex-1 shrink-0 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-xl flex flex-col shadow-inner overflow-hidden relative">
                         <div className="px-3 lg:px-4 py-2 lg:py-3 border-b border-slate-200 dark:border-[#30363d] flex justify-between items-center bg-white/60 dark:bg-[#0d1117] shrink-0">
                            <div className="flex items-center gap-1.5 lg:gap-2 text-cyan-600 dark:text-cyan-400">
                                <Terminal size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4"/>
                                <span className="text-[9px] lg:text-[10px] font-black tracking-widest uppercase">Execution_Trace</span>
                            </div>
                         </div>
                         <div ref={interpreterScrollRef} className="p-3 lg:p-4 space-y-2 lg:space-y-3 overflow-y-auto custom-scrollbar flex-1">
                            {codeLines.length ? codeLines.map(line => (
                               <div key={line.id} className={`flex flex-col text-[10px] lg:text-sm transition-all ${line.active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
                                  <div className={`font-mono ${line.active ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-700 dark:text-gray-400'}`}>{line.text}</div>
                                  {line.active && <div className="text-[9px] lg:text-xs text-amber-600 dark:text-amber-400 mt-0.5 lg:mt-1 flex items-center gap-1.5 lg:gap-2 leading-relaxed"><ArrowRight size={12} className="w-3 h-3 shrink-0"/> {line.explanation}</div>}
                               </div>
                            )) : <div className="text-slate-400 dark:text-gray-600 text-[10px] lg:text-xs italic flex items-center justify-center h-full gap-2"><Activity size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4"/> Awaiting Heap operation...</div>}
                         </div>
                     </div>

                     <div className="w-[130px] lg:w-[350px] shrink-0 border border-cyan-200 dark:border-[#30363d] bg-cyan-50 dark:bg-[#161b22] rounded-xl relative flex flex-col items-center justify-center shadow-inner h-full overflow-hidden">
                        <div className="absolute top-2 right-2 lg:top-3 lg:right-4 flex items-center gap-1.5 lg:gap-2 text-[8px] lg:text-[10px] font-mono text-cyan-600 dark:text-cyan-500 uppercase tracking-widest">
                            <Box size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Memory_Buffer</span><span className="lg:hidden">Buffer</span>
                        </div>
                        <AnimatePresence>
                           {phantom && (
                              <motion.div
                                initial={{ scale: 0, y: -20, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.5, y: 50 }}
                                className={`w-14 h-14 lg:w-20 lg:h-20 rounded-full border-[3px] dark:border-4 border-dashed flex flex-col items-center justify-center shadow-lg dark:shadow-[0_0_30px_rgba(6,182,212,0.4)] z-50 relative mt-4 lg:mt-6 ${phantom.label ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/20' : 'border-cyan-400 bg-white dark:bg-cyan-500/20'}`}
                              >
                                 <span className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white">{phantom.val}</span>
                                 {phantom.label && <span className="absolute -bottom-6 text-[8px] lg:text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">{phantom.label}</span>}
                              </motion.div>
                           )}
                        </AnimatePresence>
                        {!phantom && (
                            <div className="text-cyan-600/50 dark:text-cyan-500/30 font-mono text-[9px] lg:text-xs flex items-center gap-1.5 lg:gap-2 mt-4">
                                <Zap size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Buffer Ready</span><span className="lg:hidden">Empty</span>
                            </div>
                        )}
                     </div>
                  </motion.div>
              )}
          </AnimatePresence>
        </div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-2xl"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-4 right-4 h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Activity className="text-emerald-500" /> Heap Visualizer
              </h3>
              
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 mt-4 h-max overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
                <p>
                  A <strong>Heap</strong> is a specialized tree-based data structure that satisfies the heap property. In a Max-Heap, for any given node I, the value of I is greater than or equal to the values of its children.
                </p>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-4">Key Operations</h4>
                <p>
                  You can <strong>Insert</strong> elements, <strong>Extract Max/Min</strong>, or <strong>Heapify</strong> an array to understand priority queue operations.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeapVisualizer;