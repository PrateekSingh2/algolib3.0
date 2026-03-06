import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowDown, ArrowUp, ArrowRight, RotateCcw, Layers, Play, Pause, StepForward, StepBack,
  Terminal, Activity, Zap, Box, Trash2, Cpu, Crosshair, Minimize2, Maximize2
} from 'lucide-react';

// --- TYPES & GAME STATE ---
type StackNode = { id: string; val: number; color: string; isTargeted?: boolean };
type CodeLine = { id: string; text: string; explanation: string; active: boolean };
type VariableState = { name: string; value: string; color: string };

type VisualFrame = {
  stack: StackNode[];
  phantom: StackNode | null;
  poppedNode: StackNode | null;
  codeLines: CodeLine[];
  variables: VariableState[];
  message: string;
};

// --- HINGLISH EXECUTION MATRIX ---
const SNIPPETS = {
  push: [
    { id: '1', text: 'if (top >= MAX - 1) return OVERFLOW;', explanation: 'Check kiya: Container full toh nahi hai? (Capacity limit)', active: false },
    { id: '2', text: 'Node temp = new Node(val);', explanation: 'Heap memory (Spawn Zone) mein naya block ready kiya.', active: false },
    { id: '3', text: 'top++;', explanation: 'TOP pointer ko ek step upar (next empty slot pe) shift kiya.', active: false },
    { id: '4', text: 'stack[top] = temp;', explanation: 'Naye block ko container mein TOP position par drop kar diya!', active: false }
  ],
  pop: [
    { id: '1', text: 'if (top == -1) return UNDERFLOW;', explanation: 'Check kiya: Container pehle se khali toh nahi hai?', active: false },
    { id: '2', text: 'Node target = stack[top];', explanation: 'Sabse upar wale block pe target lock kiya.', active: false },
    { id: '3', text: 'top--;', explanation: 'TOP pointer ko ek step neeche shift kar diya.', active: false },
    { id: '4', text: 'return target;', explanation: 'Target block ko bahar nikaal ke memory free kar di!', active: false }
  ]
};

// Cyberpunk Ammo Colors
const COLORS = ['#00f5ff', '#ff00ff', '#00ff88', '#facc15', '#9d00ff', '#ff5500'];
const MAX_CAPACITY = 6;

const CyberGrid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-[#09090b]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,245,255,0.05),transparent_70%)]" />
  </div>
);

const StackVisualizer = () => {
  const [stack, setStack] = useState<StackNode[]>([
      { id: 'init1', val: 42, color: '#00f5ff' }, 
      { id: 'init2', val: 88, color: '#ff00ff' }
  ]);
  const [inputValue, setInputValue] = useState<number>(0);
  
  // Engine State - HUD Hidden by Default
  const [showHUD, setShowHUD] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // FRAME-BASED ANIMATION ENGINE
  const [frames, setFrames] = useState<VisualFrame[]>([]);
  const [frameIdx, setFrameIdx] = useState<number>(0);

  // Visual states synced to current frame
  const [message, setMessage] = useState('SYSTEM_IDLE: Ready for input');
  const [codeLines, setCodeLines] = useState<CodeLine[]>([]);
  const [variables, setVariables] = useState<VariableState[]>([]);
  const [phantom, setPhantom] = useState<StackNode | null>(null);
  const [poppedNode, setPoppedNode] = useState<StackNode | null>(null);

  const interpreterEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { generateRandom(); }, []);

  useEffect(() => {
    interpreterEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [codeLines]);

  const generateRandom = () => setInputValue(Math.floor(Math.random() * 99) + 1);

  // Sync visual components to the active frame
  useEffect(() => {
    if (frames.length > 0 && frameIdx >= 0 && frameIdx < frames.length) {
        const f = frames[frameIdx];
        setStack(f.stack);
        setPhantom(f.phantom);
        setPoppedNode(f.poppedNode);
        setCodeLines(f.codeLines);
        setVariables(f.variables);
        setMessage(f.message);
        
        // Final frame cleanup timeout
        if (frameIdx === frames.length - 1) {
            const tm = setTimeout(() => {
                setStack(prev => prev.map(n => ({ ...n, isTargeted: false })));
                setIsAnimating(false);
                setFrames([]);
                setCodeLines([]);
                setVariables([]);
                setPoppedNode(null);
                generateRandom();
            }, 1200);
            return () => clearTimeout(tm);
        }
    }
  }, [frameIdx, frames]);

  // Autoplay engine
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused && isAnimating && frames.length > 0 && frameIdx < frames.length - 1) {
        timer = setTimeout(() => {
            setFrameIdx(prev => prev + 1);
        }, 1200);
    }
    return () => clearTimeout(timer);
  }, [isPaused, isAnimating, frameIdx, frames]);

  const handlePush = () => {
    if (isAnimating || stack.length >= MAX_CAPACITY) return;
    setIsAnimating(true);
    if (!showHUD) setShowHUD(true);
    
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newNode = { id: Math.random().toString(), val: inputValue, color: randomColor };

    let currentStack = [...stack];
    let newFrames: VisualFrame[] = [];

    const addFrame = (snippet: CodeLine[], lineId: string, vars: VariableState[], phan: StackNode | null, currentStk: StackNode[] = currentStack) => {
        const currentLine = snippet.find(l => l.id === lineId);
        newFrames.push({
            stack: currentStk.map(x => ({...x})),
            phantom: phan ? {...phan} : null,
            poppedNode: null,
            codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })),
            variables: vars.map(v => ({...v})),
            message: currentLine ? currentLine.explanation : 'Processing...'
        });
    };

    const snippet = SNIPPETS.push;
    
    // Step 1: Check Overflow
    let v = [{ name: 'TOP', value: `${currentStack.length - 1}`, color: '#facc15' }];
    addFrame(snippet, '1', v, null);
    
    // Step 2: Create Temp Node
    v = [...v, { name: 'temp', value: `${newNode.val}`, color: newNode.color }];
    addFrame(snippet, '2', v, newNode);
    
    // Step 3: Increment Top
    let vUpdatedTop = [{ name: 'TOP', value: `${currentStack.length}`, color: '#facc15' }, { name: 'temp', value: `${newNode.val}`, color: newNode.color }];
    addFrame(snippet, '3', vUpdatedTop, newNode);
    
    // Step 4: Add to Stack
    currentStack.push(newNode);
    addFrame(snippet, '4', [{ name: 'TOP', value: `${currentStack.length - 1}`, color: '#facc15' }], null, currentStack);
    
    // Final Result Frame
    newFrames.push({
        stack: currentStack.map(x => ({...x})),
        phantom: null,
        poppedNode: null,
        codeLines: [],
        variables: [],
        message: "MISSION_PASSED: Block Pushed"
    });

    setFrames(newFrames);
    setFrameIdx(0);
  };

  const handlePop = () => {
    if (isAnimating || stack.length === 0) return;
    setIsAnimating(true);
    if (!showHUD) setShowHUD(true);

    let currentStack = [...stack];
    let newFrames: VisualFrame[] = [];

    const addFrame = (snippet: CodeLine[], lineId: string, vars: VariableState[], popNode: StackNode | null, currentStk: StackNode[] = currentStack) => {
        const currentLine = snippet.find(l => l.id === lineId);
        newFrames.push({
            stack: currentStk.map(x => ({...x})),
            phantom: null,
            poppedNode: popNode ? {...popNode} : null,
            codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })),
            variables: vars.map(v => ({...v})),
            message: currentLine ? currentLine.explanation : 'Processing...'
        });
    };

    const snippet = SNIPPETS.pop;
    
    // Step 1: Check Underflow
    let v = [{ name: 'TOP', value: `${currentStack.length - 1}`, color: '#facc15' }];
    addFrame(snippet, '1', v, null);
    
    // Step 2: Target Top Node
    let markedStack = currentStack.map((n, i) => i === currentStack.length - 1 ? { ...n, isTargeted: true } : n);
    const targetNode = currentStack[currentStack.length - 1];
    v = [...v, { name: 'target', value: `${targetNode.val}`, color: '#ef4444' }];
    addFrame(snippet, '2', v, null, markedStack);
    
    // Step 3: Decrement Top
    let vDecTop = [{ name: 'TOP', value: `${currentStack.length - 2}`, color: '#facc15' }, { name: 'target', value: `${targetNode.val}`, color: '#ef4444' }];
    addFrame(snippet, '3', vDecTop, null, markedStack);
    
    // Step 4: Pop out
    currentStack.pop();
    addFrame(snippet, '4', [{ name: 'TOP', value: `${currentStack.length - 1}`, color: '#facc15' }], targetNode, currentStack);

    // Final Result Frame
    newFrames.push({
        stack: currentStack.map(x => ({...x})),
        phantom: null,
        poppedNode: null, // Clear popped node animation
        codeLines: [],
        variables: [],
        message: "TARGET_ELIMINATED: Block Popped"
    });

    setFrames(newFrames);
    setFrameIdx(0);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#09090b] font-sans text-white overflow-hidden">
      <CyberGrid />
      
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden min-h-0">
        
        {/* LEFT: COMMAND CENTER */}
        <div className="w-full lg:w-[340px] bg-black/95 lg:bg-black/80 backdrop-blur-md border-white/10 flex flex-col h-[38%] lg:h-full shadow-2xl shrink-0 z-20 overflow-hidden order-1 lg:border-r">

          <div className="overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar pb-6 flex-1 lg:max-h-none pt-4 lg:pt-6">
            
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Step Engine</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${isPaused ? 'border-amber-500 text-amber-500' : 'border-cyan-500 text-cyan-500'}`}>
                    {isPaused ? 'MANUAL' : 'AUTO'}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsPaused(!isPaused)} className="flex-1 py-2 bg-black/50 border border-white/10 rounded flex items-center justify-center gap-2 text-xs font-bold hover:bg-white/5 transition-all">
                  {isPaused ? <Play size={14}/> : <Pause size={14}/>} {isPaused ? 'AUTOPLAY' : 'MANUAL'}
                </button>
                <div className="flex flex-1 gap-1">
                    <button 
                      disabled={!isPaused || !isAnimating || frameIdx <= 0} 
                      onClick={() => setFrameIdx(f => Math.max(0, f - 1))} 
                      className="flex-1 py-2 bg-cyan-600 text-white rounded flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black hover:bg-cyan-500 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      <StepBack size={14} /> PREV
                    </button>
                    <button 
                      disabled={!isPaused || !isAnimating || frameIdx >= frames.length - 1} 
                      onClick={() => setFrameIdx(f => Math.min(frames.length - 1, f + 1))} 
                      className="flex-1 py-2 bg-cyan-500 text-black rounded flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black hover:bg-cyan-400 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      NEXT <StepForward size={14} />
                    </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex gap-2">
                  <div className="flex-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Payload (Value)</label>
                      <div className="flex gap-1 mt-1">
                          <input type="number" value={inputValue} onChange={(e) => setInputValue(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-cyan-400 outline-none font-mono text-sm" />
                          <button onClick={generateRandom} className="px-3 bg-white/5 rounded border border-white/10 hover:bg-white/10"><RotateCcw size={14}/></button>
                      </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={handlePush} disabled={isAnimating || stack.length >= MAX_CAPACITY} className="p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded hover:bg-cyan-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                     <ArrowDown size={16}/> PUSH (Insert)
                  </button>
                  <button onClick={handlePop} disabled={isAnimating || stack.length === 0} className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                     <ArrowUp size={16}/> POP (Remove)
                  </button>
               </div>
               
               <button onClick={() => setStack([])} disabled={isAnimating} className="w-full py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/5 hover:border-red-500/30 rounded text-[10px] font-bold text-gray-500 transition-all flex items-center justify-center gap-2 mt-4">
                  <Trash2 size={14}/> FORMAT MEMORY
               </button>
            </div>
          </div>
        </div>

        {/* VISIBLE GLOWING SEPARATOR LINE (Mobile Only) */}
        <div className="lg:hidden h-[2px] w-full bg-gradient-to-r from-cyan-500/10 via-cyan-500/60 to-cyan-500/10 shrink-0 z-30 order-2" />

        {/* RIGHT: THE ARENA */}
        <div className="order-3 lg:order-2 flex-1 relative flex flex-col p-3 sm:p-4 lg:p-6 min-w-0 overflow-hidden lg:h-full w-full">
          
          {/* SMALL HUD TOGGLE */}
          <div className="flex justify-start lg:justify-start items-center mb-2 lg:mb-3 shrink-0 gap-2">
             <button 
                onClick={() => setShowHUD(!showHUD)}
                className="h-7 lg:h-8 px-3 bg-[#050505] border border-cyan-500/80 rounded-lg lg:rounded-full text-cyan-400 font-black text-[10px] flex items-center gap-1.5 tracking-widest hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] uppercase z-40"
             >
                {showHUD ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                {showHUD ? 'HIDE HUD' : 'SHOW HUD'}
             </button>
          </div>

          {/* Central Arena Layout */}
          <div className="flex-1 min-h-0 border border-white/5 bg-black/30 rounded-2xl relative flex flex-col shadow-inner mb-2 lg:mb-4 w-full overflow-hidden">
             
             {/* Horizontal Scroll support */}
             <div className="flex-1 w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar touch-pan-x flex items-end justify-center pb-4">
                 <div className="min-w-max flex flex-col items-center justify-end px-8 lg:px-16 pt-10 h-full">
                     {/* The Container Pipe */}
                     <div className="relative w-64 lg:w-72 h-[280px] lg:h-[380px] border-b-4 border-l-4 border-r-4 border-gray-700/50 rounded-b-xl flex flex-col-reverse p-2 bg-gradient-to-t from-cyan-900/10 to-transparent shrink-0">
                         
                         {/* Capacity Line */}
                         <div className="absolute top-0 left-[-20px] right-[-20px] h-px border-t border-dashed border-red-500/50 flex items-center justify-end">
                             <span className="text-[7px] lg:text-[9px] text-red-500/80 font-mono bg-black px-1 -translate-y-2">MAX_CAP ({MAX_CAPACITY})</span>
                         </div>

                         <AnimatePresence>
                            {stack.map((item, index) => {
                               const isTop = index === stack.length - 1;
                               
                               return (
                                  <motion.div
                                     key={item.id}
                                     layout
                                     initial={{ y: -150, opacity: 0, scale: 0.8 }}
                                     animate={{ y: 0, opacity: 1, scale: 1 }}
                                     exit={{ y: -50, x: 150, opacity: 0, rotate: 15 }} // Ejected Bullet Effect
                                     transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                     className={`w-full h-10 lg:h-12 mb-1 rounded flex items-center justify-between px-3 lg:px-4 border-2 relative shrink-0 transition-all ${
                                         item.isTargeted ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] z-20 scale-[1.02]' 
                                         : 'border-white/10 z-10'
                                     }`}
                                     style={{ backgroundColor: `${item.color}15`, borderLeftColor: item.color }}
                                  >
                                     <span className="text-[8px] lg:text-[10px] font-mono text-gray-500 w-8">0x{index}</span>
                                     <span className="text-xl lg:text-2xl font-black text-white">{item.val}</span>
                                     <div className="w-8" />

                                     {/* THE TOP POINTER */}
                                     {isTop && !item.isTargeted && (
                                        <motion.div layoutId="top-indicator" className="absolute -right-[60px] lg:-right-24 flex items-center gap-1 lg:gap-2 drop-shadow-lg z-50">
                                            <div className="w-4 lg:w-8 h-0.5 bg-amber-500" />
                                            <div className="bg-amber-500 text-black text-[8px] lg:text-[10px] font-black px-1.5 lg:px-2 py-0.5 lg:py-1 rounded shadow-[0_0_10px_rgba(245,158,11,0.5)] flex items-center gap-1">
                                               <Crosshair size={10} className="lg:w-3 lg:h-3" /> TOP
                                            </div>
                                        </motion.div>
                                     )}
                                  </motion.div>
                               )
                            })}
                         </AnimatePresence>
                     </div>
                 </div>
             </div>
          </div>

          <div className="shrink-0 flex justify-between items-center text-[10px] lg:text-xs font-mono text-gray-500 px-2 lg:mb-2">
             <div className="flex items-center gap-2"><Activity size={14} className={isAnimating ? "text-cyan-500 animate-spin lg:w-3.5 lg:h-3.5" : "lg:w-3.5 lg:h-3.5"}/> <span className="truncate max-w-[150px] lg:max-w-none">{message}</span></div>
             <div className="flex items-center gap-2">
                 <span className="hidden sm:inline">Elements in Stack:</span>
                 <span className={`font-black ${stack.length === MAX_CAPACITY ? 'text-red-500' : 'text-cyan-500'}`}>
                     {stack.length} / {MAX_CAPACITY}
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
                   transition={{ duration: 0.3, ease: 'easeInOut' }}
                   className="flex gap-2 lg:gap-4 w-full shrink-0 overflow-hidden"
                >
                   {/* 1. HINGLISH INTERPRETER */}
                   <div className="flex-1 shrink-0 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col shadow-2xl overflow-hidden h-full relative">
                       <div className="px-3 lg:px-4 py-2 lg:py-3 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                          <div className="flex items-center gap-1.5 lg:gap-2 text-cyan-400">
                              <Terminal size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4"/>
                              <span className="text-[9px] lg:text-[10px] font-black tracking-widest uppercase">Hinglish_Trace</span>
                          </div>
                          <div className="flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
                             {variables.map((v, i) => <span key={i} className="text-[9px] lg:text-[10px] font-mono whitespace-nowrap"><span className="text-gray-500">{v.name}:</span> <span style={{color: v.color}}>{v.value}</span></span>)}
                          </div>
                       </div>
                       
                       <div className="p-3 lg:p-4 space-y-2 lg:space-y-3 overflow-y-auto custom-scrollbar flex-1">
                          {codeLines.length ? codeLines.map(line => (
                             <div key={line.id} className={`flex flex-col text-[10px] lg:text-sm transition-all ${line.active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
                                <div className={`font-mono ${line.active ? 'text-cyan-400' : 'text-gray-400'}`}>{line.text}</div>
                                {line.active && <div className="text-[9px] lg:text-xs text-amber-400 mt-0.5 lg:mt-1 flex items-center gap-1.5 lg:gap-2 leading-relaxed"><ArrowRight size={12} className="w-3 h-3 shrink-0"/> {line.explanation}</div>}
                             </div>
                          )) : <div className="text-gray-600 text-[10px] lg:text-xs italic flex items-center justify-center h-full gap-2"><Activity size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4"/> Awaiting Push/Pop sequence...</div>}
                          <div ref={interpreterEndRef} />
                       </div>
                   </div>

                   {/* 2. THE SPAWN ZONE (HEAP) */}
                   <div className="w-[130px] lg:w-[350px] shrink-0 border border-cyan-500/30 bg-cyan-900/10 rounded-xl relative flex flex-col items-center justify-center shadow-inner h-full overflow-hidden">
                      <div className="absolute top-2 right-2 lg:top-3 lg:right-4 flex items-center gap-1.5 lg:gap-2 text-[8px] lg:text-[10px] font-mono text-cyan-500 uppercase tracking-widest">
                          <Box size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Spawn_Zone</span><span className="lg:hidden">Heap</span>
                      </div>
                      
                      <AnimatePresence>
                         {phantom && (
                            <motion.div
                              initial={{ scale: 0, y: -20, opacity: 0 }}
                              animate={{ scale: 1, y: 0, opacity: 1 }}
                              exit={{ opacity: 0, scale: 0.8, y: 40 }}
                              className="w-14 h-14 lg:w-20 lg:h-20 rounded-xl border-2 flex flex-col items-center justify-center shadow-2xl z-50 relative mt-4 lg:mt-6"
                              style={{ borderColor: phantom.color, backgroundColor: `${phantom.color}15`, boxShadow: `0 0 30px ${phantom.color}40` }}
                            >
                               <span className="text-[6px] lg:text-[8px] text-white/50 font-mono absolute top-1 left-1">NEW</span>
                               <span className="text-xl lg:text-3xl font-black text-white">{phantom.val}</span>
                            </motion.div>
                         )}
                      </AnimatePresence>

                      {poppedNode && (
                           <motion.div
                              initial={{ scale: 0.5, y: 50, opacity: 0, rotate: -15 }}
                              animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
                              exit={{ opacity: 0, scale: 1.5 }}
                              className="w-full h-full absolute inset-0 flex items-center justify-center bg-red-900/20 backdrop-blur-sm z-40 border-2 border-red-500"
                            >
                               <div className="flex flex-col items-center gap-1 lg:gap-2 text-red-500">
                                   <Trash2 size={24} className="lg:w-8 lg:h-8" />
                                   <span className="text-[9px] lg:text-sm font-black tracking-widest">[{poppedNode.val}] DESTROYED</span>
                               </div>
                           </motion.div>
                      )}

                      {!phantom && !poppedNode && (
                          <div className="text-cyan-500/30 font-mono text-[9px] lg:text-xs flex items-center gap-1.5 lg:gap-2 mt-4">
                              <Zap size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Ready to allocate...</span><span className="lg:hidden">Ready</span>
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

export default StackVisualizer;