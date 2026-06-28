import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRightLeft, RotateCcw, Play, Pause, StepForward, StepBack,
  Terminal, Activity, Zap, Box, Trash2, Cpu, 
  LogIn, LogOut, Maximize2, Minimize2, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useCollaboration } from '@/contexts/CollaborationContext';

// --- TYPES & GAME STATE ---
type QueueNode = { id: string; val: number; color: string; isTargeted?: boolean };
type CodeLine = { id: string; text: string; explanation: string; active: boolean };
type VariableState = { name: string; value: string; color: string };

type VisualFrame = {
  queue: QueueNode[];
  phantom: QueueNode | null;
  dequeuedNode: QueueNode | null;
  codeLines: CodeLine[];
  variables: VariableState[];
  message: string;
  outputLog: string[];
  outputTitle: string;
};

// --- HINGLISH EXECUTION MATRIX ---
const SNIPPETS = {
  enqueue: [
    { id: '1', text: 'if (rear == MAX) return OVERFLOW;', explanation: 'Check kiya: Kya Queue ki line pehle se full toh nahi hai?', active: false },
    { id: '2', text: 'Node temp = new Node(val);', explanation: 'Spawn Zone mein naya block (data) ready kiya.', active: false },
    { id: '3', text: 'queue[rear] = temp;', explanation: 'Naye block ko line ke end (REAR) mein khada kar diya.', active: false },
    { id: '4', text: 'rear++;', explanation: 'REAR pointer ko ek step aage badha diya.', active: false }
  ],
  dequeue: [
    { id: '1', text: 'if (front == rear) return UNDERFLOW;', explanation: 'Check kiya: Kya line puri tarah se khali hai?', active: false },
    { id: '2', text: 'Node target = queue[front];', explanation: 'FRONT (line ke sabse aage) wale block pe target lock kiya.', active: false },
    { id: '3', text: 'front++;', explanation: 'FRONT pointer ko ek step aage shift kar diya.', active: false },
    { id: '4', text: 'return target;', explanation: 'Target block ko line se bahar nikala aur process kar diya!', active: false }
  ]
};

// Cyberpunk Color Palette
const COLORS = ['#00f5ff', '#ff00ff', '#00ff88', '#facc15', '#9d00ff', '#ff5500'];
const MAX_CAPACITY = 7;

const CyberGrid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-br from-[#c4c3ff] via-[#e6e6ff] to-[#fce4ff] dark:bg-none dark:bg-[#09090b]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.07),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.05),transparent_70%)]" />
  </div>
);

const QueueVisualizer = () => {
  const [queue, setQueue] = useState<QueueNode[]>([
      { id: 'init1', val: 42, color: '#00ff88' }, 
      { id: 'init2', val: 88, color: '#00f5ff' }
  ]);
  const [inputValue, setInputValue] = useState<number>(0);
  
  // Game HUD - Hidden by Default
  const [showHUD, setShowHUD] = useState(false);

  // Engine State
  const [isPaused, setIsPaused] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // FRAME-BASED ANIMATION ENGINE
  const [frames, setFrames] = useState<VisualFrame[]>([]);
  const [frameIdx, setFrameIdx] = useState<number>(0);

  // Visual states synced to current frame
  const [message, setMessage] = useState('SYSTEM_IDLE: Ready for input');
  const [codeLines, setCodeLines] = useState<CodeLine[]>([]);
  const [variables, setVariables] = useState<VariableState[]>([]);
  const [phantom, setPhantom] = useState<QueueNode | null>(null);
  const [dequeuedNode, setDequeuedNode] = useState<QueueNode | null>(null);
  const [outputLog, setOutputLog] = useState<string[]>([]);
  const [outputTitle, setOutputTitle] = useState<string>("OUTPUT_CONSOLE");

  const interpreterScrollRef = useRef<HTMLDivElement>(null);
  const outputScrollRef = useRef<HTMLDivElement>(null);

  // --- COLLABORATION HOOK ---
  const { role, roomState, broadcastState } = useCollaboration();

  // Host Broadcasts State
  useEffect(() => {
    if (role === 'host') {
      broadcastState({
        queue,
        frames,
        frameIdx,
        isPaused,
        isAnimating,
        inputValue,
        outputLog,
        outputTitle,
      });
    }
  }, [queue, frames, frameIdx, isPaused, isAnimating, inputValue, outputLog, outputTitle, role, broadcastState]);

  // Viewer Receives State
  useEffect(() => {
    if (role === 'viewer' && roomState) {
      if (roomState.queue !== undefined) setQueue(roomState.queue);
      if (roomState.frames !== undefined) setFrames(roomState.frames);
      if (roomState.frameIdx !== undefined) setFrameIdx(roomState.frameIdx);
      if (roomState.isPaused !== undefined) setIsPaused(roomState.isPaused);
      if (roomState.isAnimating !== undefined) setIsAnimating(roomState.isAnimating);
      if (roomState.inputValue !== undefined) setInputValue(roomState.inputValue);
      if (roomState.outputLog !== undefined) setOutputLog(roomState.outputLog);
      if (roomState.outputTitle !== undefined) setOutputTitle(roomState.outputTitle);
    }
  }, [role, roomState]);

  useEffect(() => { generateRandom(); }, []);
  
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

  const generateRandom = () => setInputValue(Math.floor(Math.random() * 99) + 1);

  // Sync visual components to the active frame
  useEffect(() => {
    if (frames.length > 0 && frameIdx >= 0 && frameIdx < frames.length) {
        const f = frames[frameIdx];
        setQueue(f.queue);
        setPhantom(f.phantom);
        setDequeuedNode(f.dequeuedNode);
        setCodeLines(f.codeLines);
        setVariables(f.variables);
        setMessage(f.message);
        setOutputLog(f.outputLog);
        setOutputTitle(f.outputTitle);
        
        // Final frame cleanup timeout
        if (frameIdx === frames.length - 1) {
            const tm = setTimeout(() => {
                setQueue(prev => prev.map(n => ({ ...n, isTargeted: false })));
                setIsAnimating(false);
                setFrames([]);
                setCodeLines([]);
                setVariables([]);
                setDequeuedNode(null);
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
        }, 1200);
    }
    return () => clearTimeout(timer);
  }, [isPaused, isAnimating, frameIdx, frames, role]);

  const handleEnqueue = () => {
    if (isAnimating || queue.length >= MAX_CAPACITY || role === 'viewer') return;
    setIsAnimating(true);
    // if (!showHUD) setShowHUD(true);
    
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newNode = { id: Math.random().toString(), val: inputValue, color: randomColor };

    let currentQueue = [...queue];
    let currentLog = [...outputLog];
    let newFrames: VisualFrame[] = [];
    const title = "ENQUEUE_LOG";

    const addFrame = (snippet: CodeLine[], lineId: string, vars: VariableState[], phan: QueueNode | null, q: QueueNode[] = currentQueue, log: string[] = currentLog) => {
        const currentLine = snippet.find(l => l.id === lineId);
        newFrames.push({
            queue: q.map(x => ({...x})),
            phantom: phan ? {...phan} : null,
            dequeuedNode: null,
            codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })),
            variables: vars.map(v => ({...v})),
            message: currentLine ? currentLine.explanation : 'Processing...',
            outputLog: [...log],
            outputTitle: title
        });
    };

    const snippet = SNIPPETS.enqueue;
    let baseVars = [
        { name: 'FRONT', value: `0`, color: '#ef4444' }, 
        { name: 'REAR', value: `${currentQueue.length}`, color: '#00ff88' }
    ];

    addFrame(snippet, '1', baseVars, null);
    
    let v2 = [...baseVars, { name: 'temp', value: `${newNode.val}`, color: newNode.color }];
    addFrame(snippet, '2', v2, newNode);
    addFrame(snippet, '3', v2, newNode);
    
    currentQueue.push(newNode);
    currentLog.push(`> [${newNode.val}] Joined the queue at REAR.`);
    let v4 = [
        { name: 'FRONT', value: `0`, color: '#ef4444' }, 
        { name: 'REAR', value: `${currentQueue.length}`, color: '#00ff88' }
    ];
    addFrame(snippet, '4', v4, null, currentQueue, currentLog);
    
    newFrames.push({
        queue: currentQueue.map(x => ({...x})),
        phantom: null,
        dequeuedNode: null,
        codeLines: [],
        variables: [],
        message: "MISSION_PASSED: Block Enqueued",
        outputLog: [...currentLog],
        outputTitle: title
    });

    setFrames(newFrames);
    setFrameIdx(0);
  };

  const handleDequeue = () => {
    if (isAnimating || queue.length === 0 || role === 'viewer') return;
    setIsAnimating(true);
    // if (!showHUD) setShowHUD(true);
    
    let currentQueue = [...queue];
    let currentLog = [...outputLog];
    let newFrames: VisualFrame[] = [];
    const title = "DEQUEUE_LOG";

    const addFrame = (snippet: CodeLine[], lineId: string, vars: VariableState[], deqNode: QueueNode | null, q: QueueNode[] = currentQueue, log: string[] = currentLog) => {
        const currentLine = snippet.find(l => l.id === lineId);
        newFrames.push({
            queue: q.map(x => ({...x})),
            phantom: null,
            dequeuedNode: deqNode ? {...deqNode} : null,
            codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })),
            variables: vars.map(v => ({...v})),
            message: currentLine ? currentLine.explanation : 'Processing...',
            outputLog: [...log],
            outputTitle: title
        });
    };

    const snippet = SNIPPETS.dequeue;
    let baseVars = [
        { name: 'FRONT', value: `0`, color: '#ef4444' }, 
        { name: 'REAR', value: `${currentQueue.length}`, color: '#00ff88' }
    ];

    addFrame(snippet, '1', baseVars, null);
    
    let markedQueue = currentQueue.map((n, i) => i === 0 ? { ...n, isTargeted: true } : n);
    const targetNode = currentQueue[0];
    let v2 = [...baseVars, { name: 'target', value: `${targetNode.val}`, color: '#ef4444' }];
    addFrame(snippet, '2', v2, null, markedQueue);
    
    let v3 = [
        { name: 'FRONT', value: `1`, color: '#ef4444' }, 
        { name: 'REAR', value: `${currentQueue.length}`, color: '#00ff88' },
        { name: 'target', value: `${targetNode.val}`, color: '#ef4444' }
    ];
    addFrame(snippet, '3', v3, null, markedQueue);
    
    currentQueue.shift();
    currentLog.push(`> SUCCESS: [${targetNode.val}] Processed & Removed.`);
    let v4 = [
        { name: 'FRONT', value: `0`, color: '#ef4444' }, 
        { name: 'REAR', value: `${currentQueue.length}`, color: '#00ff88' }
    ];
    addFrame(snippet, '4', v4, targetNode, currentQueue, currentLog);

    newFrames.push({
        queue: currentQueue.map(x => ({...x})),
        phantom: null,
        dequeuedNode: null, 
        codeLines: [],
        variables: [],
        message: "TARGET_PROCESSED: Block Dequeued",
        outputLog: [...currentLog],
        outputTitle: title
    });

    setFrames(newFrames);
    setFrameIdx(0);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-br from-[#c4c3ff] via-[#e6e6ff] to-[#fce4ff] dark:bg-none dark:bg-[#09090b] font-sans text-slate-900 dark:text-white overflow-hidden">
      <CyberGrid />
      
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden min-h-0">
        
        {/* LEFT: COMMAND CENTER */}
        <div className="w-full lg:w-[340px] bg-white/40 backdrop-blur-2xl/95 lg:bg-white/40 backdrop-blur-2xl/80 dark:bg-black/95 dark:lg:bg-black/80 backdrop-blur-md border-slate-200 dark:border-white/10 flex flex-col h-[38%] lg:h-full shadow-2xl shrink-0 z-20 overflow-hidden order-1 lg:border-r">
          
          <div className="overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar pb-6 flex-1 lg:max-h-none pt-4 lg:pt-6 flex flex-col">
            
            <div className="bg-white/60 backdrop-blur-xl dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-700 dark:text-gray-400 uppercase">Step Engine</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${isPaused ? 'border-amber-500 text-amber-600 dark:text-amber-500' : 'border-green-500 text-green-600 dark:text-green-500'}`}>
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
                      className="flex-1 py-2 bg-green-600 text-white rounded flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black hover:bg-green-500 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      <StepBack size={14} /> PREV
                    </button>
                    <button 
                      disabled={!isPaused || !isAnimating || frameIdx >= frames.length - 1 || role === 'viewer'} 
                      onClick={() => setFrameIdx(f => Math.min(frames.length - 1, f + 1))} 
                      className="flex-1 py-2 bg-green-500 text-black rounded flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black hover:bg-green-400 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      NEXT <StepForward size={14} />
                    </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 shrink-0">
               <div className="flex gap-2">
                  <div className="flex-1">
                      <label className="text-[9px] text-slate-700 dark:text-gray-500 uppercase font-bold">Payload (Value)</label>
                      <div className="flex gap-1 mt-1">
                          <input type="number" disabled={role === 'viewer'} value={inputValue} onChange={(e) => setInputValue(Number(e.target.value))} className="w-full bg-gradient-to-br from-[#c4c3ff] via-[#e6e6ff] to-[#fce4ff] dark:bg-none dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded px-3 py-2 text-green-600 dark:text-green-400 outline-none font-mono text-sm dark:text-white disabled:opacity-50" />
                          <button disabled={role === 'viewer'} onClick={generateRandom} className="px-3 bg-blue-400 dark:bg-blue-500/20 rounded border border-blue-500 dark:border-blue-500/50 hover:bg-blue-500 dark:hover:bg-blue-500/30 text-black dark:text-blue-400 font-bold transition-all disabled:opacity-50"><RotateCcw size={14}/></button>
                      </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={handleEnqueue} disabled={isAnimating || queue.length >= MAX_CAPACITY || role === 'viewer'} className="p-3 bg-green-400 dark:bg-green-500/20 border border-green-500 dark:border-green-500/50 text-black dark:text-green-400 rounded hover:bg-green-500 dark:hover:bg-green-500/30 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50 transition-all">
                     <LogIn size={16}/> ENQUEUE (In)
                  </button>
                  <button onClick={handleDequeue} disabled={isAnimating || queue.length === 0 || role === 'viewer'} className="p-3 bg-orange-400 dark:bg-orange-500/20 border border-orange-500 dark:border-orange-500/50 text-black dark:text-orange-400 rounded hover:bg-orange-500 dark:hover:bg-orange-500/30 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50 transition-all">
                     <LogOut size={16}/> DEQUEUE (Out)
                  </button>
               </div>
               
               <button onClick={() => { if (role !== 'viewer') { setQueue([]); setOutputLog([]); } }} disabled={isAnimating || role === 'viewer'} className="w-full py-2 bg-orange-400 dark:bg-orange-500/20 hover:bg-orange-500 dark:hover:bg-orange-500/30 hover:text-black dark:hover:text-orange-400 border border-orange-500 dark:border-orange-500/50 rounded text-[10px] font-bold text-black dark:text-orange-400 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
                  <Trash2 size={14}/> FORMAT QUEUE
               </button>
            </div>

            <div className="mt-4 flex-1 min-h-[120px] lg:min-h-[150px] bg-slate-50 dark:bg-black/90 border border-green-200 dark:border-green-500/30 rounded-xl flex flex-col overflow-hidden shadow-inner shrink-0">
                <div className="px-3 py-2 border-b border-green-200 dark:border-green-500/30 bg-green-100 dark:bg-green-900/20 flex items-center gap-2 shrink-0">
                    <Terminal size={12} className="text-green-600 dark:text-green-400" />
                    <span className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">{outputTitle}</span>
                </div>
                <div ref={outputScrollRef} className="p-3 overflow-y-auto custom-scrollbar flex-1 font-mono text-[11px] text-slate-800 dark:text-gray-300 flex flex-col gap-1">
                    {outputLog.length === 0 ? (
                        <span className="text-slate-400 dark:text-gray-600 italic mt-1">Awaiting operations...</span>
                    ) : (
                        outputLog.map((log, i) => (
                           <div key={i} className={`flex items-start ${log.includes('SUCCESS') ? 'text-green-600 dark:text-green-400 font-bold' : 'text-slate-800 dark:text-gray-400'}`}>
                               <span className="opacity-50 mr-2 shrink-0">{String(i).padStart(2, '0')}</span>
                               {log}
                           </div>
                        ))
                    )}
                </div>
            </div>

          </div>
        </div>

        {/* VISIBLE GLOWING SEPARATOR LINE (Mobile Only) */}
        <div className="lg:hidden h-[2px] w-full bg-gradient-to-r from-green-500/10 via-green-500/60 to-green-500/10 shrink-0 z-30 order-2" />

        {/* RIGHT: THE ARENA */}
        {/* FIXED: overflow-y-auto added so the pipe won't be squished on small mobile layouts */}
        <div className="order-3 lg:order-2 flex-1 relative flex flex-col p-2 sm:p-4 lg:p-6 min-w-0 overflow-y-auto overflow-x-hidden custom-scrollbar lg:h-full w-full">
          
          <div className="flex justify-start lg:justify-start items-center mb-2 lg:mb-3 shrink-0 gap-2">
             <button 
                onClick={() => setShowHUD(!showHUD)}
                className="h-7 lg:h-8 px-3 bg-white dark:bg-[#050505] border border-green-400 dark:border-green-500/80 rounded-lg lg:rounded-full text-green-600 dark:text-green-400 font-black text-[10px] flex items-center gap-1.5 tracking-widest hover:bg-green-50 dark:hover:bg-green-500/10 hover:shadow-sm dark:hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all shadow-sm dark:shadow-[0_0_10px_rgba(34,197,94,0.2)] uppercase z-40"
             >
                {showHUD ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                {showHUD ? 'HIDE HUD' : 'SHOW HUD'}
             </button>
          </div>

          <div className="flex-1 min-h-0 border border-slate-300 dark:border-white/5 bg-white/60 backdrop-blur-xl/50 dark:bg-black/30 rounded-2xl relative flex flex-col shadow-inner overflow-hidden mb-2 lg:mb-4 items-center justify-center p-2 sm:p-4 lg:p-10 w-full shrink-0 min-h-[220px]">
             
             {/* FIXED: Added shrink-0 and min-h-[160px] to strictly prevent flex-squishing on small screens */}
             <div className="relative w-full max-w-4xl min-h-[160px] lg:min-h-[192px] shrink-0 border-y-4 border-slate-300 dark:border-gray-700 bg-white/50 dark:bg-white/[0.01] backdrop-blur-sm shadow-inner rounded-[30px] lg:rounded-[40px] overflow-hidden flex flex-col justify-center py-4">
                 
                 <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-slate-200 dark:from-[#020205] via-slate-100 dark:via-red-500/20 to-transparent z-10 pointer-events-none" />
                 <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-slate-200 dark:from-[#020205] via-slate-100 dark:via-green-500/20 to-transparent z-10 pointer-events-none" />
                 <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-px bg-slate-300 dark:bg-white/5 pointer-events-none z-10" />

                 <div className="absolute top-2 left-6 lg:left-8 text-red-600 dark:text-red-500 text-[8px] lg:text-[10px] font-mono font-bold flex flex-col items-center z-10">
                     <span>FRONT (EXIT)</span>
                     <div className="w-px h-4 lg:h-6 bg-red-500/50 mt-1" />
                 </div>
                 <div className="absolute top-2 right-6 lg:right-8 text-green-500 text-[8px] lg:text-[10px] font-mono font-bold flex flex-col items-center z-10">
                     <span>REAR (ENTRY)</span>
                     <div className="w-px h-4 lg:h-6 bg-green-500/50 mt-1" />
                 </div>

                 {/* FIXED: Added explicit min-h to scroll container with padding to allow visual space for indicators underneath blocks */}
                 <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar touch-pan-x z-0">
                    <div className="flex gap-4 min-w-max justify-start items-center px-12 lg:px-24 min-h-[120px] lg:min-h-[150px] py-6 lg:py-8">
                        <AnimatePresence mode="popLayout">
                           {queue.map((item, i) => (
                              <motion.div
                                 key={item.id}
                                 layout
                                 initial={{ x: 200, opacity: 0, scale: 0.8 }}
                                 animate={{ x: 0, opacity: 1, scale: item.isTargeted ? 1.1 : 1 }}
                                 exit={{ x: -200, opacity: 0, scale: 0.5, rotate: -15 }}
                                 transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                 className={`min-w-[60px] lg:min-w-[80px] h-20 lg:h-24 bg-white/40 backdrop-blur-2xl dark:bg-[#1a1a2e] border-2 rounded-xl flex flex-col items-center justify-center relative shadow-lg group shrink-0 ${item.isTargeted ? 'border-red-500 z-20' : ''}`}
                                 style={{ 
                                     borderColor: item.isTargeted ? '#ef4444' : item.color, 
                                     boxShadow: item.isTargeted ? `0 0 30px rgba(239,68,68,0.6)` : `var(--tw-dark) ? 0 0 15px ${item.color}20 : undefined` 
                                 }}
                              >
                                 <span className={`text-xl lg:text-2xl font-black ${item.isTargeted ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{item.val}</span>
                                 <span className="text-[8px] lg:text-[10px] text-slate-700 dark:text-gray-500 absolute bottom-1 lg:bottom-2 font-mono">IDX: {i}</span>
                                 
                                 {/* Pointer Tags */}
                                 {i === 0 && !item.isTargeted && (
                                     <div className="absolute -bottom-6 lg:-bottom-8 flex flex-col items-center">
                                         <div className="w-0.5 h-3 lg:h-4 bg-red-500" />
                                         <span className="text-[7px] lg:text-[9px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.5)]">FRONT</span>
                                     </div>
                                 )}
                                 {i === queue.length - 1 && (
                                     <div className="absolute -bottom-6 lg:-bottom-8 flex flex-col items-center">
                                         <div className="w-0.5 h-3 lg:h-4 bg-green-500" />
                                         <span className="text-[7px] lg:text-[9px] font-black text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.5)]">REAR</span>
                                     </div>
                                 )}
                              </motion.div>
                           ))}
                        </AnimatePresence>
                    </div>
                 </div>
             </div>

             <AnimatePresence>
                {dequeuedNode && (
                     <motion.div
                        initial={{ scale: 0.5, x: -100, opacity: 0 }}
                        animate={{ scale: 1, x: 0, opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="absolute inset-0 flex items-center justify-center bg-red-100/90 dark:bg-red-900/20 backdrop-blur-sm z-40 border-2 border-red-500 rounded-2xl"
                      >
                         <div className="flex flex-col items-center gap-3 text-red-600 dark:text-red-500">
                             <CheckCircle2 size={48} />
                             <span className="text-sm lg:text-xl font-black tracking-widest bg-white dark:bg-black px-4 py-2 rounded-lg border border-red-200 dark:border-red-500/50">[{dequeuedNode.val}] SUCCESSFULLY PROCESSED</span>
                         </div>
                     </motion.div>
                )}
             </AnimatePresence>

          </div>

          <div className="shrink-0 flex justify-between items-center text-[10px] lg:text-xs font-mono text-slate-700 dark:text-gray-500 px-2 lg:mb-2">
             <div className="flex items-center gap-2"><Activity size={14} className={isAnimating ? "text-green-600 dark:text-green-500 animate-spin lg:w-3.5 lg:h-3.5" : "lg:w-3.5 lg:h-3.5"}/> <span className="truncate max-w-[150px] lg:max-w-none">{message}</span></div>
             <div className="flex items-center gap-2">
                 <span className="hidden sm:inline text-slate-800 dark:text-gray-400">Capacity:</span>
                 <span className={`font-black ${queue.length === MAX_CAPACITY ? 'text-red-500' : 'text-green-600 dark:text-green-500'}`}>
                     {queue.length} / {MAX_CAPACITY}
                 </span>
             </div>
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
                     <div className="flex-1 shrink-0 bg-white/40 backdrop-blur-2xl/90 dark:bg-black/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl flex flex-col shadow-2xl overflow-hidden relative">
                         <div className="px-3 lg:px-4 py-2 lg:py-3 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/60 backdrop-blur-xl dark:bg-white/5 shrink-0">
                            <div className="flex items-center gap-1.5 lg:gap-2 text-green-600 dark:text-green-400">
                                <Terminal size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4"/>
                                <span className="text-[9px] lg:text-[10px] font-black tracking-widest uppercase">Hinglish_Trace</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
                                {variables.map((v, i) => <span key={i} className="text-[9px] lg:text-[10px] font-mono whitespace-nowrap"><span className="text-slate-700 dark:text-gray-500">{v.name}:</span> <span style={{color: v.color}}>{v.value}</span></span>)}
                            </div>
                         </div>
                         <div ref={interpreterScrollRef} className="p-3 lg:p-4 space-y-2 lg:space-y-3 overflow-y-auto custom-scrollbar flex-1">
                            {codeLines.length ? codeLines.map(line => (
                               <div key={line.id} className={`flex flex-col text-[10px] lg:text-sm transition-all ${line.active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
                                  <div className={`font-mono ${line.active ? 'text-green-600 dark:text-green-400 font-bold' : 'text-slate-700 dark:text-gray-400'}`}>{line.text}</div>
                                  {line.active && <div className="text-[9px] lg:text-xs text-amber-600 dark:text-amber-400 mt-0.5 lg:mt-1 flex items-center gap-1.5 lg:gap-2 leading-relaxed"><ArrowRight size={12} className="w-3 h-3 shrink-0"/> {line.explanation}</div>}
                               </div>
                            )) : <div className="text-slate-400 dark:text-gray-600 text-[10px] lg:text-xs italic flex items-center justify-center h-full gap-2"><Activity size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4"/> Awaiting Queue operation...</div>}
                         </div>
                     </div>

                     <div className="w-[130px] lg:w-[350px] shrink-0 border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-900/10 rounded-xl relative flex flex-col items-center justify-center shadow-inner h-full overflow-hidden">
                        <div className="absolute top-2 right-2 lg:top-3 lg:right-4 flex items-center gap-1.5 lg:gap-2 text-[8px] lg:text-[10px] font-mono text-green-600 dark:text-green-500 uppercase tracking-widest">
                            <Box size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Spawn_Zone</span><span className="lg:hidden">Heap</span>
                        </div>
                        <AnimatePresence>
                           {phantom && (
                              <motion.div
                                initial={{ scale: 0, y: -20, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.5, y: 50 }}
                                className="w-14 h-14 lg:w-20 lg:h-20 rounded-xl border-2 flex items-center justify-center shadow-lg dark:shadow-2xl z-50 relative mt-4 lg:mt-6 bg-white dark:bg-transparent"
                                style={{ borderColor: phantom.color, backgroundColor: `var(--tw-dark) ? ${phantom.color}20 : undefined`, boxShadow: `0 0 30px ${phantom.color}40` }}
                              >
                                 <span className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white">{phantom.val}</span>
                                 <div className="hidden lg:block absolute -bottom-6 bg-green-500 text-black px-2 py-0.5 rounded text-[9px] font-bold shadow-lg whitespace-nowrap">READY TO ENTER</div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                        {!phantom && (
                            <div className="text-green-600/50 dark:text-green-500/30 font-mono text-[9px] lg:text-xs flex items-center gap-1.5 lg:gap-2 mt-4">
                                <Zap size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Memory Ready</span><span className="lg:hidden">Empty</span>
                            </div>
                        )}
                     </div>
                  </motion.div>
              )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default QueueVisualizer;