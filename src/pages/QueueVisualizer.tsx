import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ArrowLeft, RotateCcw, ArrowRightLeft, Play, Pause, StepForward, 
  Terminal, Activity, Zap, Box, LogIn, LogOut
} from 'lucide-react';

const SNIPPETS = {
  enqueue: [
    { id: '1', text: 'if (rear == MAX) return error;', explanation: 'Checking for Queue Overflow.', active: false },
    { id: '2', text: 'queue[rear++] = value;', explanation: 'Inserting at REAR and incrementing pointer.', active: false },
  ],
  dequeue: [
    { id: '1', text: 'if (front == rear) return error;', explanation: 'Checking for Queue Underflow.', active: false },
    { id: '2', text: 'value = queue[front++];', explanation: 'Removing from FRONT and incrementing pointer.', active: false },
  ]
};

// Cyberpunk Color Palette
const COLORS = [
    '#00f5ff', // Cyan
    '#ff00ff', // Magenta
    '#00ff88', // Neon Green
    '#facc15', // Yellow
    '#9d00ff', // Purple
    '#ff5500', // Orange
];

const QueueVisualizer = () => {
  // State includes color now
  const [queue, setQueue] = useState<{id: string, val: number, color: string}[]>([
      {id: 'q1', val: 10, color: '#00ff88'}, 
      {id: 'q2', val: 20, color: '#00f5ff'}
  ]);
  
  // Controlled Input
  const [inputValue, setInputValue] = useState<number>(55);

  const [isPaused, setIsPaused] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [message, setMessage] = useState('SYSTEM_IDLE');
  const [codeLines, setCodeLines] = useState<any[]>([]);
  
  // Visual Actors
  const [phantom, setPhantom] = useState<{id: string, val: number, color: string} | null>(null);
  
  const stepTrigger = useRef<() => void>(() => {});

  // Initialize Random Value
  useEffect(() => {
    generateRandom();
  }, []);

  const generateRandom = () => {
    setInputValue(Math.floor(Math.random() * 90) + 10);
  };

  const resolveStep = () => { if(stepTrigger.current) stepTrigger.current(); };

  const waitStep = async (lineId: string, snippet: any[]) => {
    const line = snippet.find(l => l.id === lineId);
    setMessage(line ? line.explanation : 'Processing...');
    setCodeLines(snippet.map(l => ({ ...l, active: l.id === lineId })));
    if (isPaused) await new Promise<void>(r => stepTrigger.current = r);
    else await new Promise(r => setTimeout(r, 1000));
  };

  const handleEnqueue = async () => {
    if(isAnimating || queue.length >= 7) return;
    setIsAnimating(true);
    
    // Assign random color
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newVal = { id: Math.random().toString(), val: inputValue, color: randomColor };
    const snippet = SNIPPETS.enqueue;

    setPhantom(newVal);
    await waitStep('1', snippet);
    
    await waitStep('2', snippet);
    setQueue(prev => [...prev, newVal]);
    setPhantom(null);
    
    setMessage('ENQUEUE_SUCCESS');
    setIsAnimating(false);
    setCodeLines([]);
    generateRandom(); // Auto-generate next value
  };

  const handleDequeue = async () => {
    if(isAnimating || queue.length === 0) return;
    setIsAnimating(true);
    const snippet = SNIPPETS.dequeue;

    await waitStep('1', snippet);
    await waitStep('2', snippet);
    setQueue(prev => prev.slice(1));
    
    setMessage('DEQUEUE_SUCCESS');
    setIsAnimating(false);
    setCodeLines([]);
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-[#020205] overflow-hidden font-sans text-white">
      {/* SIDEBAR */}
      <div className="w-full lg:w-80 bg-[#0a0a14] border-r border-white/10 flex flex-col z-30 shadow-2xl">
         <div className="p-6 border-b border-white/5 bg-gradient-to-r from-green-500/5 to-transparent">
            <div className="flex items-center gap-2 text-green-500">
               <ArrowRightLeft size={20} />
               <span className="font-black tracking-widest text-sm">QUEUE_OS</span>
            </div>
         </div>
         
         <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            {/* CONTROLS */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
               <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                  <span>Control</span><span>{isPaused ? 'MANUAL' : 'AUTO'}</span>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setIsPaused(!isPaused)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded flex justify-center items-center gap-2 text-xs font-bold transition-all">
                     {isPaused ? <Play size={14} /> : <Pause size={14} />} {isPaused ? 'RESUME' : 'PAUSE'}
                  </button>
                  <button onClick={resolveStep} disabled={!isPaused || !isAnimating} className="flex-1 py-2 bg-green-500 text-black rounded flex justify-center items-center gap-2 text-xs font-bold disabled:opacity-50">
                     <StepForward size={14} /> STEP
                  </button>
               </div>
            </div>

            {/* INPUTS */}
            <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-500 uppercase">Value</label>
                   <div className="flex gap-2">
                       <input 
                           type="number" 
                           value={inputValue}
                           onChange={(e) => setInputValue(Number(e.target.value))}
                           className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-green-500 focus:border-green-500 outline-none font-mono" 
                       />
                       <button onClick={generateRandom} className="p-2 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-gray-400 transition-colors">
                           <RotateCcw size={16} />
                       </button>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={handleEnqueue} disabled={isAnimating || queue.length >= 7} className="py-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 rounded font-bold text-xs flex flex-col items-center gap-1 disabled:opacity-30 transition-all">
                      <LogIn size={16} /> ENQUEUE
                   </button>
                   <button onClick={handleDequeue} disabled={isAnimating || queue.length === 0} className="py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded font-bold text-xs flex flex-col items-center gap-1 disabled:opacity-30 transition-all">
                      <LogOut size={16} /> DEQUEUE
                   </button>
                </div>
                <button onClick={() => setQueue([])} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-gray-400 transition-all">RESET MEMORY</button>
            </div>
            
            {/* CODE */}
            <div className="bg-black/50 rounded-xl p-3 border border-white/10 min-h-[100px] font-mono text-[10px]">
               {codeLines.map(l => (
                  <div key={l.id} className={`${l.active ? 'text-green-500' : 'text-gray-600'} transition-colors`}>
                     {l.text}
                  </div>
               ))}
               {codeLines.length === 0 && <span className="text-gray-700 italic">IDLE...</span>}
            </div>
         </div>
      </div>

      {/* CANVAS */}
      <div className="flex-1 relative flex flex-col items-center justify-center bg-[#020205] overflow-hidden">
         <div className="absolute top-10 z-20 px-6 py-2 bg-[#0a0a14] border border-green-500/30 rounded-full shadow-2xl flex items-center gap-3">
            <Activity size={14} className={isAnimating ? "text-green-500 animate-pulse" : "text-gray-600"} />
            <span className="text-xs font-mono font-bold text-white">{message}</span>
         </div>

         {/* INCOMING PHANTOM */}
         <AnimatePresence>
            {phantom && (
                <motion.div 
                    initial={{ x: 300, opacity: 0 }} animate={{ x: 200, opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute right-20 z-50 flex flex-col items-center"
                >
                    <span className="text-[9px] font-mono text-green-500 mb-2">INCOMING</span>
                    <div 
                        className="w-16 h-16 border-2 rounded flex items-center justify-center font-bold shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                        style={{ 
                            borderColor: phantom.color, 
                            color: phantom.color, 
                            backgroundColor: `${phantom.color}20`,
                            boxShadow: `0 0 20px ${phantom.color}40`
                        }}
                    >
                        {phantom.val}
                    </div>
                </motion.div>
            )}
         </AnimatePresence>

         {/* PIPE CONTAINER */}
         <div className="relative w-3/4 h-40 border-y-2 border-white/10 bg-white/[0.02] flex items-center px-10 overflow-hidden backdrop-blur-sm">
            {/* Dynamic Glows */}
            <div className="absolute top-0 left-0 h-full w-2 bg-red-500/50 blur-lg" />
            <div className="absolute top-0 right-0 h-full w-2 bg-green-500/50 blur-lg" />
            
            <div className="absolute -top-8 left-0 text-red-500 text-[10px] font-mono font-bold flex flex-col items-start">
                <span>FRONT (EXIT)</span>
                <div className="w-px h-8 bg-gradient-to-b from-red-500 to-transparent absolute top-full left-4" />
            </div>
            <div className="absolute -top-8 right-0 text-green-500 text-[10px] font-mono font-bold flex flex-col items-end">
                <span>REAR (ENTRY)</span>
                <div className="w-px h-8 bg-gradient-to-b from-green-500 to-transparent absolute top-full right-4" />
            </div>

            <div className="flex gap-4 w-full justify-start items-center">
               <AnimatePresence mode="popLayout">
                  {queue.map((item, i) => (
                     <motion.div
                        key={item.id}
                        layout
                        initial={{ x: 200, opacity: 0, scale: 0.5 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: -200, opacity: 0, scale: 0.5, backgroundColor: '#ef4444' }}
                        className="min-w-[80px] h-20 bg-[#1a1a2e] border rounded flex flex-col items-center justify-center relative shadow-lg group"
                        style={{ 
                            borderColor: item.color, 
                            boxShadow: `0 0 15px ${item.color}20` 
                        }}
                     >
                        <span className="text-xl font-bold" style={{ color: item.color }}>{item.val}</span>
                        <span className="text-[8px] text-gray-500 absolute bottom-1 font-mono">idx:{i}</span>
                        
                        {/* Pointers Overlay */}
                        {i === 0 && (
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                <div className="w-px h-4 bg-red-500" />
                                <span className="text-[8px] font-black text-red-500 bg-red-500/10 px-1 rounded">HEAD</span>
                            </div>
                        )}
                        {i === queue.length - 1 && (
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                <div className="w-px h-4 bg-green-500" />
                                <span className="text-[8px] font-black text-green-500 bg-green-500/10 px-1 rounded">TAIL</span>
                            </div>
                        )}
                     </motion.div>
                  ))}
               </AnimatePresence>
            </div>
         </div>
      </div>
    </div>
  );
};

export default QueueVisualizer;