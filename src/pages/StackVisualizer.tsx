import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowDown, ArrowUp, RotateCcw, Layers, Play, Pause, StepForward, 
  Terminal, Activity, Zap, Box, Trash2, AlertCircle
} from 'lucide-react';

// --- SNIPPETS ---
const SNIPPETS = {
  push: [
    { id: '1', text: 'if (top >= MAX) return error;', explanation: 'Checking for Stack Overflow.', active: false },
    { id: '2', text: 'stack[++top] = value;', explanation: 'Incrementing TOP pointer and inserting value.', active: false },
  ],
  pop: [
    { id: '1', text: 'if (top < 0) return error;', explanation: 'Checking for Stack Underflow.', active: false },
    { id: '2', text: 'value = stack[top--];', explanation: 'Accessing value and decrementing TOP pointer.', active: false },
    { id: '3', text: 'return value;', explanation: 'Returning the popped value.', active: false },
  ],
  peek: [
    { id: '1', text: 'if (top < 0) return null;', explanation: 'Ensuring stack is not empty.', active: false },
    { id: '2', text: 'return stack[top];', explanation: 'Reading value at TOP without removing it.', active: false },
  ]
};

const StackVisualizer = () => {
  const [stack, setStack] = useState<{id: string, val: number}[]>([{id: 'init', val: 10}, {id: 'init2', val: 20}]);
  const [isPaused, setIsPaused] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [message, setMessage] = useState('SYSTEM_IDLE');
  const [codeLines, setCodeLines] = useState<any[]>([]);
  const [phantom, setPhantom] = useState<{id: string, val: number} | null>(null);
  const [poppedNode, setPoppedNode] = useState<{id: string, val: number} | null>(null);

  const stepTrigger = useRef<() => void>(() => {});
  const inputValRef = useRef(45);

  const resolveStep = () => { if(stepTrigger.current) stepTrigger.current(); };

  const waitStep = async (lineId: string, snippet: any[]) => {
    const line = snippet.find(l => l.id === lineId);
    setMessage(line ? line.explanation : 'Processing...');
    setCodeLines(snippet.map(l => ({ ...l, active: l.id === lineId })));
    if (isPaused) await new Promise<void>(r => stepTrigger.current = r);
    else await new Promise(r => setTimeout(r, 1000));
  };

  const handlePush = async () => {
    if (isAnimating || stack.length >= 7) return;
    setIsAnimating(true);
    const newVal = { id: Math.random().toString(), val: inputValRef.current };
    const snippet = SNIPPETS.push;

    setPhantom(newVal);
    await waitStep('1', snippet);
    
    await waitStep('2', snippet);
    setStack(prev => [...prev, newVal]);
    setPhantom(null);
    
    setMessage('PUSH_COMPLETE');
    setIsAnimating(false);
    setCodeLines([]);
  };

  const handlePop = async () => {
    if (isAnimating || stack.length === 0) return;
    setIsAnimating(true);
    const snippet = SNIPPETS.pop;

    await waitStep('1', snippet);
    
    const nodeToPop = stack[stack.length - 1];
    setPoppedNode(nodeToPop);
    setStack(prev => prev.slice(0, -1)); // Remove from main state immediately for visual pop
    
    await waitStep('2', snippet);
    
    await waitStep('3', snippet);
    setPoppedNode(null); // Disappear
    
    setMessage('POP_COMPLETE');
    setIsAnimating(false);
    setCodeLines([]);
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-[#020205] overflow-hidden font-sans text-white">
      {/* SIDEBAR */}
      <div className="w-full lg:w-80 bg-[#0a0a14] border-r border-white/10 flex flex-col z-30 shadow-2xl">
         <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#00f5ff]/5 to-transparent">
            <div className="flex items-center gap-2 text-[#00f5ff]">
               <Layers size={20} />
               <span className="font-black tracking-widest text-sm">STACK_OS</span>
            </div>
         </div>
         
         <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* CONTROLS */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
               <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                  <span>Control</span>
                  <span>{isPaused ? 'MANUAL' : 'AUTO'}</span>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setIsPaused(!isPaused)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded flex justify-center items-center gap-2 text-xs font-bold transition-all">
                     {isPaused ? <Play size={14} /> : <Pause size={14} />} {isPaused ? 'RESUME' : 'PAUSE'}
                  </button>
                  <button onClick={resolveStep} disabled={!isPaused || !isAnimating} className="flex-1 py-2 bg-[#00f5ff] text-black rounded flex justify-center items-center gap-2 text-xs font-bold disabled:opacity-50">
                     <StepForward size={14} /> STEP
                  </button>
               </div>
            </div>

            {/* INPUTS */}
            <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-500 uppercase">Value</label>
                   <input type="number" defaultValue={45} onChange={(e) => inputValRef.current = Number(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-[#00f5ff] focus:border-[#00f5ff] outline-none font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={handlePush} disabled={isAnimating || stack.length >= 7} className="py-3 bg-[#00f5ff]/10 hover:bg-[#00f5ff]/20 text-[#00f5ff] border border-[#00f5ff]/30 rounded font-bold text-xs flex flex-col items-center gap-1 disabled:opacity-30">
                      <ArrowDown size={16} /> PUSH
                   </button>
                   <button onClick={handlePop} disabled={isAnimating || stack.length === 0} className="py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded font-bold text-xs flex flex-col items-center gap-1 disabled:opacity-30">
                      <ArrowUp size={16} /> POP
                   </button>
                </div>
                <button onClick={() => setStack([])} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-gray-400">RESET MEMORY</button>
            </div>

            {/* CODE */}
            <div className="bg-black/50 rounded-xl p-3 border border-white/10 min-h-[100px] font-mono text-[10px]">
               {codeLines.map(l => (
                  <div key={l.id} className={`${l.active ? 'text-[#00f5ff]' : 'text-gray-600'} transition-colors`}>
                     {l.text}
                  </div>
               ))}
               {codeLines.length === 0 && <span className="text-gray-700 italic">IDLE...</span>}
            </div>
         </div>
      </div>

      {/* CANVAS */}
      <div className="flex-1 relative flex flex-col items-center justify-center bg-[#020205] overflow-hidden">
         {/* STATUS TOAST */}
         <div className="absolute top-10 z-20 px-6 py-2 bg-[#0a0a14] border border-[#00f5ff]/30 rounded-full shadow-2xl flex items-center gap-3">
            <Activity size={14} className={isAnimating ? "text-[#00f5ff] animate-pulse" : "text-gray-600"} />
            <span className="text-xs font-mono font-bold text-white">{message}</span>
         </div>

         {/* MEMORY FORGE (SPAWN POINT) */}
         <div className="absolute top-24 right-20 flex flex-col items-center gap-2">
            <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">FORGE</span>
            <div className="w-16 h-16 border border-dashed border-gray-700 rounded-lg flex items-center justify-center">
               <AnimatePresence>
                  {phantom && (
                     <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ y: 200, opacity: 0 }}
                        className="w-12 h-12 bg-[#00f5ff] rounded flex items-center justify-center text-black font-black text-lg shadow-[0_0_20px_#00f5ff]"
                     >
                        {phantom.val}
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>

         {/* STACK CONTAINER */}
         <div className="relative w-64 min-h-[400px] border-b-4 border-l-4 border-r-4 border-white/20 rounded-b-2xl bg-white/[0.02] flex flex-col-reverse justify-start items-center p-4 gap-2 backdrop-blur-sm">
            <div className="absolute -left-12 bottom-10 text-[10px] font-mono text-gray-600 -rotate-90 tracking-[0.3em]">LIFO_MEMORY</div>
            
            <AnimatePresence mode="popLayout">
               {stack.map((item, i) => (
                  <motion.div
                     key={item.id}
                     layout
                     initial={{ y: -300, opacity: 0, scale: 0.5 }}
                     animate={{ y: 0, opacity: 1, scale: 1 }}
                     exit={{ x: 100, opacity: 0, scale: 0.5 }}
                     className="w-full h-12 bg-[#1a1a2e] border border-[#00f5ff]/30 rounded flex items-center justify-between px-4 relative group"
                  >
                     <span className="font-mono text-white font-bold">{item.val}</span>
                     <span className="text-[8px] font-mono text-gray-600">0x{i}</span>
                     
                     {/* TOP POINTER */}
                     {i === stack.length - 1 && (
                        <motion.div layoutId="top-ptr" className="absolute -right-24 flex items-center gap-2">
                           <div className="text-[10px] font-black text-[#00f5ff] bg-[#00f5ff]/10 px-2 py-1 rounded border border-[#00f5ff]/30">TOP</div>
                           <div className="w-8 h-px bg-[#00f5ff]" />
                        </motion.div>
                     )}
                  </motion.div>
               ))}
            </AnimatePresence>

            {/* POPPED ANIMATION */}
            <AnimatePresence>
               {poppedNode && (
                  <motion.div
                     initial={{ x: 0, y: 0, opacity: 1 }}
                     animate={{ x: 200, y: -50, opacity: 0, rotate: 45 }}
                     className="absolute top-0 w-48 h-12 bg-red-500/20 border border-red-500 rounded flex items-center justify-center text-red-500 font-bold shadow-[0_0_30px_rgba(239,68,68,0.4)] z-50"
                  >
                     {poppedNode.val} (FREED)
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
};

export default StackVisualizer;