import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRightLeft, RotateCcw, Play, Pause, StepForward, 
  Terminal, Activity, Zap, Box, Trash2, Cpu, 
  LogIn, LogOut, Maximize2, Minimize2, CheckCircle2, ArrowRight
} from 'lucide-react';

// --- TYPES & GAME STATE ---
type QueueNode = { id: string; val: number; color: string; isTargeted?: boolean };
type CodeLine = { id: string; text: string; explanation: string; active: boolean };
type VariableState = { name: string; value: string; color: string };

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
    <div className="absolute inset-0 bg-[#09090b]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.05),transparent_70%)]" />
  </div>
);

const QueueVisualizer = () => {
  const [queue, setQueue] = useState<QueueNode[]>([
      { id: 'init1', val: 42, color: '#00ff88' }, 
      { id: 'init2', val: 88, color: '#00f5ff' }
  ]);
  const [inputValue, setInputValue] = useState<number>(0);
  
  // Game HUD
  const [showHUD, setShowHUD] = useState(true);

  // Engine State
  const [isPaused, setIsPaused] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [message, setMessage] = useState('SYSTEM_IDLE: Ready for input');
  const [codeLines, setCodeLines] = useState<CodeLine[]>([]);
  const [variables, setVariables] = useState<VariableState[]>([]);
  
  // Terminal Logic
  const [outputLog, setOutputLog] = useState<string[]>([]);
  const [outputTitle, setOutputTitle] = useState<string>("OUTPUT_CONSOLE");

  // HUD Actors
  const [phantom, setPhantom] = useState<QueueNode | null>(null);
  const [dequeuedNode, setDequeuedNode] = useState<QueueNode | null>(null);

  const stepTrigger = useRef<() => void>(() => {});
  const interpreterEndRef = useRef<HTMLDivElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { generateRandom(); }, []);
  useEffect(() => { interpreterEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [codeLines]);
  useEffect(() => { outputEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [outputLog]);

  const generateRandom = () => setInputValue(Math.floor(Math.random() * 99) + 1);
  const resolveStep = () => { if(stepTrigger.current) stepTrigger.current(); };

  const waitStep = async (lineId: string, snippet: CodeLine[], vars: VariableState[] = []) => {
    const line = snippet.find(l => l.id === lineId);
    setMessage(line ? line.explanation : 'Processing...');
    setCodeLines(snippet.map(l => ({ ...l, active: l.id === lineId })));
    
    let currentVars = [...vars];
    if (!currentVars.some(v => v.name === 'REAR')) {
        currentVars.push({ name: 'REAR', value: `${queue.length}`, color: '#00ff88' });
    }
    if (!currentVars.some(v => v.name === 'FRONT')) {
        currentVars.push({ name: 'FRONT', value: `0`, color: '#ef4444' });
    }
    setVariables(currentVars);

    if (isPaused) await new Promise<void>(r => stepTrigger.current = r);
    else await new Promise(r => setTimeout(r, 1200));
  };

  const handleEnqueue = async () => {
    if (isAnimating || queue.length >= MAX_CAPACITY) return;
    setIsAnimating(true);
    setShowHUD(true);
    setOutputTitle("ENQUEUE_LOG");
    
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newNode = { id: Math.random().toString(), val: inputValue, color: randomColor };
    const snippet = SNIPPETS.enqueue;

    await waitStep('1', snippet, [{ name: 'REAR', value: `${queue.length}`, color: '#00ff88' }]);
    
    setPhantom(newNode);
    await waitStep('2', snippet, [
        { name: 'REAR', value: `${queue.length}`, color: '#00ff88' },
        { name: 'temp', value: `${newNode.val}`, color: newNode.color }
    ]);
    
    await waitStep('3', snippet, [
        { name: 'REAR', value: `${queue.length}`, color: '#00ff88' },
        { name: 'temp', value: `${newNode.val}`, color: newNode.color }
    ]);
    
    // Enter the queue
    setPhantom(null);
    setQueue(prev => [...prev, newNode]);
    setOutputLog(prev => [...prev, `> [${newNode.val}] Joined the queue at REAR.`]);
    
    await waitStep('4', snippet, [{ name: 'REAR', value: `${queue.length + 1}`, color: '#00ff88' }]);
    
    setMessage('MISSION_PASSED: Block Enqueued');
    setIsAnimating(false);
    setCodeLines([]); setVariables([]); generateRandom();
  };

  const handleDequeue = async () => {
    if (isAnimating || queue.length === 0) return;
    setIsAnimating(true);
    setShowHUD(true);
    setOutputTitle("DEQUEUE_LOG");
    const snippet = SNIPPETS.dequeue;

    await waitStep('1', snippet, [{ name: 'FRONT', value: `0`, color: '#ef4444' }]);
    
    // Target Front Node
    setQueue(prev => prev.map((n, i) => i === 0 ? { ...n, isTargeted: true } : n));
    const targetNode = queue[0];
    await waitStep('2', snippet, [
        { name: 'FRONT', value: `0`, color: '#ef4444' },
        { name: 'target', value: `${targetNode.val}`, color: '#ef4444' }
    ]);
    
    await waitStep('3', snippet, [
        { name: 'FRONT', value: `1`, color: '#ef4444' }, // Conceptually front moves forward
        { name: 'target', value: `${targetNode.val}`, color: '#ef4444' }
    ]);
    
    // Exit the queue
    setQueue(prev => prev.slice(1));
    setDequeuedNode(targetNode);
    setOutputLog(prev => [...prev, `> SUCCESS: [${targetNode.val}] Processed & Removed.`]);
    
    await waitStep('4', snippet, [{ name: 'FRONT', value: `0`, color: '#ef4444' }]); // Reset conceptually for shifted array
    
    setTimeout(() => {
        setDequeuedNode(null);
        setMessage('TARGET_PROCESSED: Block Dequeued');
        setIsAnimating(false);
        setCodeLines([]); setVariables([]);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#09090b] font-sans text-white overflow-hidden">
      <CyberGrid />
      
      <div className="flex-1 flex relative z-10 overflow-hidden h-full">
        
        {/* LEFT: COMMAND CENTER */}
        <div className="w-[340px] bg-black/80 backdrop-blur-md border-r border-white/10 flex flex-col h-full shadow-2xl shrink-0 z-20">
          
          <div className="p-5 border-b border-white/10 bg-gradient-to-r from-green-500/10 to-transparent shrink-0">
             <h2 className="text-xl font-black tracking-tight flex items-center gap-2 text-green-400">
                <ArrowRightLeft size={24} /> Queue Engine
             </h2>
             <p className="text-xs text-gray-400 mt-1">Hinglish FIFO Visualizer v2.0</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar pb-12 flex flex-col">
            
            {/* Playback Controls */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Step Engine</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${isPaused ? 'border-amber-500 text-amber-500' : 'border-green-500 text-green-500'}`}>
                    {isPaused ? 'MANUAL' : 'AUTO'}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsPaused(!isPaused)} className="flex-1 py-2 bg-black/50 border border-white/10 rounded flex items-center justify-center gap-2 text-xs font-bold hover:bg-white/5 transition-all">
                  {isPaused ? <Play size={14}/> : <Pause size={14}/>} {isPaused ? 'PLAY' : 'PAUSE'}
                </button>
                <button disabled={!isPaused || !isAnimating} onClick={resolveStep} className="flex-1 py-2 bg-green-500 text-black rounded flex items-center justify-center gap-2 text-xs font-black hover:bg-green-400 disabled:opacity-30 disabled:grayscale transition-all">
                  <StepForward size={14} /> NEXT STEP
                </button>
              </div>
            </div>

            {/* Inputs & Actions */}
            <div className="space-y-4 shrink-0">
               <div className="flex gap-2">
                  <div className="flex-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Payload (Value)</label>
                      <div className="flex gap-1 mt-1">
                          <input type="number" value={inputValue} onChange={(e) => setInputValue(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-green-400 outline-none font-mono text-sm" />
                          <button onClick={generateRandom} className="px-3 bg-white/5 rounded border border-white/10 hover:bg-white/10"><RotateCcw size={14}/></button>
                      </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={handleEnqueue} disabled={isAnimating || queue.length >= MAX_CAPACITY} className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded hover:bg-green-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                     <LogIn size={16}/> ENQUEUE (In)
                  </button>
                  <button onClick={handleDequeue} disabled={isAnimating || queue.length === 0} className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                     <LogOut size={16}/> DEQUEUE (Out)
                  </button>
               </div>
               
               <button onClick={() => { setQueue([]); setOutputLog([]); }} disabled={isAnimating} className="w-full py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/5 hover:border-red-500/30 rounded text-[10px] font-bold text-gray-500 transition-all flex items-center justify-center gap-2 mt-4">
                  <Trash2 size={14}/> FORMAT QUEUE
               </button>
            </div>

            {/* DEDICATED OUTPUT SCREEN */}
            <div className="mt-4 flex-1 min-h-[150px] bg-black/90 border border-green-500/30 rounded-xl flex flex-col overflow-hidden shadow-inner shrink-0">
                <div className="px-3 py-2 border-b border-green-500/30 bg-green-900/20 flex items-center gap-2 shrink-0">
                    <Terminal size={12} className="text-green-400" />
                    <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">{outputTitle}</span>
                </div>
                <div className="p-3 overflow-y-auto custom-scrollbar flex-1 font-mono text-[11px] text-gray-300 flex flex-col gap-1">
                    {outputLog.length === 0 ? (
                        <span className="text-gray-600 italic mt-1">Awaiting operations...</span>
                    ) : (
                        outputLog.map((log, i) => (
                           <div key={i} className={`flex items-start ${log.includes('SUCCESS') ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
                               <span className="opacity-50 mr-2 shrink-0">{String(i).padStart(2, '0')}</span>
                               {log}
                           </div>
                        ))
                    )}
                    <div ref={outputEndRef} />
                </div>
            </div>

          </div>
        </div>

        {/* RIGHT: THE ARENA */}
        <div className="flex-1 relative flex flex-col p-6 min-w-0 overflow-hidden h-full">
          
          {/* HUD TOGGLE */}
          <button 
             onClick={() => setShowHUD(!showHUD)}
             className="absolute top-6 left-6 z-50 p-2 bg-black/90 border border-green-500/50 rounded-lg text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center gap-2"
             title={showHUD ? "Hide HUD to maximize workspace" : "Show HUD"}
          >
             {showHUD ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
             <span className="text-[10px] font-black uppercase tracking-widest">{showHUD ? "HIDE HUD" : "SHOW HUD"}</span>
          </button>

          {/* Top HUD: Interpreter & Spawn Zone */}
          <AnimatePresence>
              {showHUD && (
                  <motion.div 
                     initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                     animate={{ height: 180, opacity: 1, marginBottom: 24 }}
                     exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                     transition={{ duration: 0.4, ease: "easeInOut" }}
                     className="flex gap-6 w-full shrink-0 ml-32 pr-6 pt-6" 
                  >
                     <div className="flex-1 shrink-0 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col shadow-2xl overflow-hidden relative">
                         <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                            <div className="flex items-center gap-2 text-green-400">
                                <Terminal size={14}/>
                                <span className="text-[10px] font-black tracking-widest uppercase">Hinglish_Trace</span>
                            </div>
                            {variables.map((v, i) => <span key={i} className="text-[10px] font-mono"><span className="text-gray-500">{v.name}:</span> <span style={{color: v.color}}>{v.value}</span></span>)}
                         </div>
                         <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                            {codeLines.length ? codeLines.map(line => (
                               <div key={line.id} className={`flex flex-col text-sm transition-all ${line.active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
                                  <div className={`font-mono ${line.active ? 'text-green-400' : 'text-gray-400'}`}>{line.text}</div>
                                  {line.active && <div className="text-xs text-amber-400 mt-1 flex items-center gap-2 leading-relaxed"><ArrowRight size={12} className="shrink-0"/> {line.explanation}</div>}
                               </div>
                            )) : <div className="text-gray-600 text-xs italic flex items-center justify-center h-full gap-2"><Activity size={14}/> Awaiting Queue operation...</div>}
                            <div ref={interpreterEndRef} />
                         </div>
                     </div>

                     <div className="w-[300px] shrink-0 border border-green-500/30 bg-green-900/10 rounded-xl relative flex flex-col items-center justify-center shadow-inner overflow-hidden">
                        <div className="absolute top-3 right-4 flex items-center gap-2 text-[10px] font-mono text-green-500 uppercase tracking-widest">
                            <Box size={14} /> Spawn_Zone
                        </div>
                        <AnimatePresence>
                           {phantom && (
                              <motion.div
                                initial={{ scale: 0, y: -20, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.5, y: 50 }}
                                className="w-16 h-16 rounded-xl border-2 flex items-center justify-center shadow-2xl z-50 relative mt-4"
                                style={{ borderColor: phantom.color, backgroundColor: `${phantom.color}20`, boxShadow: `0 0 30px ${phantom.color}40` }}
                              >
                                 <span className="text-2xl font-black text-white">{phantom.val}</span>
                                 <div className="absolute -bottom-6 bg-green-500 text-black px-2 py-0.5 rounded text-[9px] font-bold shadow-lg whitespace-nowrap">READY TO ENTER</div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                        {!phantom && (
                            <div className="text-green-500/30 font-mono text-xs flex items-center gap-2 mt-4">
                                <Zap size={14} /> Memory Ready
                            </div>
                        )}
                     </div>
                  </motion.div>
              )}
          </AnimatePresence>

          {/* Central Arena: The Pipe / Conveyor Belt */}
          <div className="flex-1 border border-white/5 bg-black/30 rounded-2xl relative flex flex-col shadow-inner overflow-hidden mt-2 items-center justify-center p-10">
             
             {/* THE CONVEYOR BELT */}
             <div className="relative w-full max-w-4xl h-48 border-y-4 border-gray-700 bg-white/[0.01] flex items-center px-16 overflow-hidden backdrop-blur-sm shadow-inner rounded-[40px]">
                 
                 {/* Sci-Fi Pipe Accents */}
                 <div className="absolute top-0 left-0 h-full w-4 bg-gradient-to-r from-red-500/40 to-transparent" />
                 <div className="absolute top-0 right-0 h-full w-4 bg-gradient-to-l from-green-500/40 to-transparent" />
                 <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-px bg-white/5 pointer-events-none" />

                 {/* Indicators */}
                 <div className="absolute top-2 left-8 text-red-500 text-[10px] font-mono font-bold flex flex-col items-center">
                     <span>FRONT (EXIT)</span>
                     <div className="w-px h-6 bg-red-500/50 mt-1" />
                 </div>
                 <div className="absolute top-2 right-8 text-green-500 text-[10px] font-mono font-bold flex flex-col items-center">
                     <span>REAR (ENTRY)</span>
                     <div className="w-px h-6 bg-green-500/50 mt-1" />
                 </div>

                 {/* Queue Elements */}
                 <div className="flex gap-4 w-full justify-start items-center ml-4">
                    <AnimatePresence mode="popLayout">
                       {queue.map((item, i) => (
                          <motion.div
                             key={item.id}
                             layout
                             initial={{ x: 200, opacity: 0, scale: 0.8 }}
                             animate={{ x: 0, opacity: 1, scale: item.isTargeted ? 1.1 : 1 }}
                             exit={{ x: -200, opacity: 0, scale: 0.5, rotate: -15 }}
                             transition={{ type: "spring", stiffness: 300, damping: 25 }}
                             className={`min-w-[80px] h-24 bg-[#1a1a2e] border-2 rounded-xl flex flex-col items-center justify-center relative shadow-lg group ${item.isTargeted ? 'border-red-500 z-20' : ''}`}
                             style={{ 
                                 borderColor: item.isTargeted ? '#ef4444' : item.color, 
                                 boxShadow: item.isTargeted ? `0 0 30px rgba(239,68,68,0.6)` : `0 0 15px ${item.color}20` 
                             }}
                          >
                             <span className="text-2xl font-black" style={{ color: item.isTargeted ? '#ef4444' : item.color }}>{item.val}</span>
                             <span className="text-[10px] text-gray-500 absolute bottom-2 font-mono">IDX: {i}</span>
                             
                             {/* Pointer Tags */}
                             {i === 0 && !item.isTargeted && (
                                 <div className="absolute -bottom-8 flex flex-col items-center">
                                     <div className="w-0.5 h-4 bg-red-500" />
                                     <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.5)]">FRONT</span>
                                 </div>
                             )}
                             {i === queue.length - 1 && (
                                 <div className="absolute -bottom-8 flex flex-col items-center">
                                     <div className="w-0.5 h-4 bg-green-500" />
                                     <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.5)]">REAR</span>
                                 </div>
                             )}
                          </motion.div>
                       ))}
                    </AnimatePresence>
                 </div>
             </div>

             {/* DEQUEUED NOTIFICATION OVERLAY */}
             <AnimatePresence>
                {dequeuedNode && (
                     <motion.div
                        initial={{ scale: 0.5, x: -100, opacity: 0 }}
                        animate={{ scale: 1, x: 0, opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="absolute inset-0 flex items-center justify-center bg-red-900/20 backdrop-blur-sm z-40 border-2 border-red-500 rounded-2xl"
                      >
                         <div className="flex flex-col items-center gap-3 text-red-500">
                             <CheckCircle2 size={48} />
                             <span className="text-xl font-black tracking-widest bg-black px-4 py-2 rounded-lg border border-red-500/50">[{dequeuedNode.val}] SUCCESSFULLY PROCESSED</span>
                         </div>
                     </motion.div>
                )}
             </AnimatePresence>

          </div>

          <div className="mt-4 shrink-0 flex justify-between items-center text-xs font-mono text-gray-500">
             <div className="flex items-center gap-2"><Activity size={14} className={isAnimating ? "text-green-500 animate-spin" : ""}/> {message}</div>
             <div className="text-[10px] uppercase tracking-widest text-gray-600 hidden md:block">FIFO_Data_Structure</div>
             <div className="flex items-center gap-2">
                 <span>Capacity:</span>
                 <span className={`font-black ${queue.length === MAX_CAPACITY ? 'text-red-500' : 'text-green-500'}`}>
                     {queue.length} / {MAX_CAPACITY}
                 </span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QueueVisualizer;