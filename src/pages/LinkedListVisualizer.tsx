import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, RotateCcw, ArrowRight, Trash2, 
  CornerDownRight, X, Play, Pause, StepForward, 
  Terminal, Activity, Anchor, Zap, Target, ArrowDownToLine, Box,
  Minimize2, Maximize2
} from 'lucide-react';

// --- TYPES & GAME STATE ---
type ListType = 'singly' | 'doubly' | 'circular' | 'doubly-circular';
type NodeData = { 
  id: string; 
  value: number; 
  isNew?: boolean; 
  isDeleting?: boolean; 
};

type CodeLine = { id: string; text: string; explanation: string; active: boolean };
type VariableState = { name: string; value: string; color: string };

// --- ADVANCED HINGLISH EXECUTION MATRIX ---
const SNIPPETS = {
  singly: {
    insertIndex: [
      { id: '1', text: 'Node temp = new Node(val);', explanation: 'Heap memory mein naya node spawn kiya.', active: false },
      { id: '2', text: 'Node ptr = head;', explanation: 'Scanner (ptr) ko start pe rakha.', active: false },
      { id: '3', text: 'while(i < index - 1) ptr = ptr.next;', explanation: 'Target position se ek pehle tak scan karte hue jao... (O(N) Time)', active: false },
      { id: '4', text: 'temp.next = ptr.next;', explanation: 'Naye node ko aage wale chain se joda.', active: false },
      { id: '5', text: 'ptr.next = temp;', explanation: 'Peeche wale node ko naye node se connect kar diya!', active: false }
    ],
    deleteIndex: [
      { id: '1', text: 'Node ptr = head;', explanation: 'Scanner deploy kiya.', active: false },
      { id: '2', text: 'while(i < index - 1) ptr = ptr.next;', explanation: 'Target se ek kadam pehle tak navigate karo... (O(N) Time)', active: false },
      { id: '3', text: 'Node temp = ptr.next;', explanation: 'Delete hone wale node pe target lock kiya.', active: false },
      { id: '4', text: 'ptr.next = temp.next;', explanation: 'Bypass link bana diya (Target ko chain se kaat diya).', active: false },
      { id: '5', text: 'delete temp;', explanation: 'Target destroyed!', active: false }
    ]
  },
  doublyCircular: {
    insertEnd: [
      { id: '1', text: 'Node temp = new Node(val);', explanation: 'Heap memory mein naya node spawn kiya.', active: false },
      { id: '2', text: 'Node tail = head.prev;', explanation: 'WARP ZONE! Head ke peeche hi Tail hai. Direct jump in O(1) time!', active: false },
      { id: '3', text: 'temp.next = head; temp.prev = tail;', explanation: 'Naye node ko Head (aage) aur Tail (peeche) se joda.', active: false },
      { id: '4', text: 'tail.next = temp; head.prev = temp;', explanation: 'List ko wapas circular lock kar diya!', active: false }
    ],
    deleteEnd: [
      { id: '1', text: 'Node tail = head.prev;', explanation: 'WARP ZONE! Direct aakhri node pe target lock kiya (O(1) time).', active: false },
      { id: '2', text: 'Node newTail = tail.prev;', explanation: 'Second-last node ko naya Tail banne ke liye chuna.', active: false },
      { id: '3', text: 'newTail.next = head; head.prev = newTail;', explanation: 'Naye tail aur head ko aapas mein link kar diya.', active: false },
      { id: '4', text: 'delete tail;', explanation: 'Purana aakhri node memory se uda diya!', active: false }
    ]
  }
};

const headSnippets = {
    insertHead: [
      { id: '1', text: 'Node temp = new Node(val);', explanation: 'Heap memory mein naya node spawn kiya.', active: false },
      { id: '2', text: 'temp.next = head;', explanation: 'Naye node ka pointer purane head pe aim kar raha hai.', active: false },
      { id: '3', text: 'head = temp;', explanation: 'Ab system ko bata diya ki ye naya dabbu hi hamara naya Head hai!', active: false },
    ],
    deleteHead: [
      { id: '1', text: 'if(head == null) return;', explanation: 'Agar list khali hai, toh delete kya karoge?', active: false },
      { id: '2', text: 'Node temp = head;', explanation: 'Pehle node pe target lock kiya (temp).', active: false },
      { id: '3', text: 'head = head.next;', explanation: 'Head ka taj (crown) agle node ko pehna diya.', active: false },
      { id: '4', text: 'delete temp;', explanation: 'Target eliminated. Memory se uda diya!', active: false }
    ]
};

const CyberGrid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-[#09090b]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.05),transparent_70%)]" />
  </div>
);

const LinkedListVisualizer = () => {
  const [listType, setListType] = useState<ListType>('singly');
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: '1A', value: 42 }, { id: '2B', value: 88 }, { id: '3C', value: 15 }
  ]);
  
  const [inputValue, setInputValue] = useState<number>(0);
  const [inputIndex, setInputIndex] = useState<number>(1);
  
  const [showHUD, setShowHUD] = useState<boolean>(false);
  
  const [isPaused, setIsPaused] = useState(true); 
  const [isAnimating, setIsAnimating] = useState(false);
  const [message, setMessage] = useState('SYSTEM_IDLE: Ready for input');
  const [codeLines, setCodeLines] = useState<CodeLine[]>([]);
  const [variables, setVariables] = useState<VariableState[]>([]);
  
  const [phantom, setPhantom] = useState<NodeData | null>(null);
  const [seekerIndex, setSeekerIndex] = useState<number | null>(null);
  const stepTrigger = useRef<() => void>(() => {});

  useEffect(() => { generateRandom(); }, []);

  const generateRandom = () => setInputValue(Math.floor(Math.random() * 99) + 1);

  const resolveStep = () => { if (stepTrigger.current) stepTrigger.current(); };
  
  const waitStep = async (lineId: string, snippet: CodeLine[], vars: VariableState[] = []) => {
    const currentLine = snippet.find(l => l.id === lineId);
    setMessage(currentLine ? currentLine.explanation : 'Processing...');
    setCodeLines(snippet.map(line => ({ ...line, active: line.id === lineId })));
    if (vars.length > 0) setVariables(vars);
    
    if (isPaused) {
      await new Promise<void>((resolve) => { stepTrigger.current = resolve; });
    } else {
      await new Promise(r => setTimeout(r, 1200));
    }
  };

  const handleInsert = async (position: 'head' | 'index' | 'end') => {
    if (isAnimating) return;
    setIsAnimating(true);
    if (!showHUD) setShowHUD(true);
    
    let targetIdx = position === 'head' ? 0 : position === 'end' ? nodes.length : Math.max(0, Math.min(inputIndex, nodes.length));
    const newNode = { id: Math.floor(Math.random()*90 + 10).toString(), value: inputValue, isNew: true };

    setPhantom(newNode);

    if (position === 'end' && listType === 'doubly-circular') {
        const snippet = SNIPPETS.doublyCircular.insertEnd;
        await waitStep('1', snippet, [{ name: 'temp', value: `${newNode.value}`, color: '#00ff88' }]);
        setSeekerIndex(nodes.length - 1);
        await waitStep('2', snippet, [{ name: 'tail', value: nodes[nodes.length-1].id, color: '#00f5ff' }]);
        await waitStep('3', snippet);
        await waitStep('4', snippet);
    } 
    else {
        const snippet = position === 'head' ? headSnippets.insertHead : SNIPPETS.singly.insertIndex;
        await waitStep('1', snippet, [{ name: 'temp', value: `${newNode.value}`, color: '#00ff88' }]);

        if (position === 'head') {
            await waitStep('2', snippet);
            await waitStep('3', snippet, [{ name: 'head', value: newNode.id, color: '#fbbf24' }]);
        } else {
            await waitStep('2', snippet, [{ name: 'ptr', value: 'HEAD', color: '#00f5ff' }]);
            for (let i = 0; i < targetIdx - 1; i++) {
                setSeekerIndex(i);
                await waitStep('3', snippet, [{ name: 'ptr', value: nodes[i]?.id || 'NULL', color: '#00f5ff' }]);
            }
            setSeekerIndex(Math.max(0, targetIdx - 1));
            await waitStep('4', snippet);
            await waitStep('5', snippet);
        }
    }

    setPhantom(null);
    const newArr = [...nodes];
    newArr.splice(targetIdx, 0, newNode);
    setNodes(newArr);
    setSeekerIndex(null);
    
    setTimeout(() => setNodes(prev => prev.map(n => ({ ...n, isNew: false }))), 1000);
    setIsAnimating(false);
    setMessage("MISSION_PASSED: Node Inserted");
    setCodeLines([]); setVariables([]); generateRandom();
  };

  const handleDelete = async (position: 'head' | 'index' | 'end') => {
    if (isAnimating || nodes.length === 0) return;
    setIsAnimating(true);
    if (!showHUD) setShowHUD(true);
    
    let targetIdx = position === 'head' ? 0 : position === 'end' ? nodes.length - 1 : Math.max(0, Math.min(inputIndex, nodes.length - 1));

    if (position === 'end' && listType === 'doubly-circular') {
        const snippet = SNIPPETS.doublyCircular.deleteEnd;
        setSeekerIndex(nodes.length - 1);
        await waitStep('1', snippet, [{ name: 'tail', value: nodes[nodes.length-1].id, color: '#ef4444' }]);
        setSeekerIndex(nodes.length - 2);
        await waitStep('2', snippet, [{ name: 'newTail', value: nodes[nodes.length-2]?.id || 'NULL', color: '#00f5ff' }]);
        await waitStep('3', snippet);
        setNodes(prev => prev.map((n, i) => i === nodes.length - 1 ? { ...n, isDeleting: true } : n));
        await waitStep('4', snippet);
    } 
    else {
        const snippet = position === 'head' ? headSnippets.deleteHead : SNIPPETS.singly.deleteIndex;

        if (position === 'head') {
            await waitStep('1', snippet);
            await waitStep('2', snippet, [{ name: 'temp', value: nodes[0].id, color: '#ef4444' }]);
            setNodes(prev => prev.map((n, i) => i === 0 ? { ...n, isDeleting: true } : n));
            await waitStep('3', snippet, [{ name: 'head', value: nodes[1]?.id || 'NULL', color: '#fbbf24' }]);
            await waitStep('4', snippet);
        } else {
            if (targetIdx === 0) targetIdx = 1; 
            await waitStep('1', snippet, [{ name: 'ptr', value: 'HEAD', color: '#00f5ff' }]);
            for (let i = 0; i < targetIdx - 1; i++) {
                setSeekerIndex(i);
                await waitStep('2', snippet, [{ name: 'ptr', value: nodes[i].id, color: '#00f5ff' }]);
            }
            setSeekerIndex(targetIdx - 1);
            await waitStep('3', snippet, [{ name: 'temp', value: nodes[targetIdx].id, color: '#ef4444' }]);
            setNodes(prev => prev.map((n, i) => i === targetIdx ? { ...n, isDeleting: true } : n));
            await waitStep('4', snippet);
            await waitStep('5', snippet);
        }
    }

    setNodes(prev => prev.filter((_, i) => i !== targetIdx));
    setSeekerIndex(null);
    setIsAnimating(false);
    setMessage("TARGET_ELIMINATED: Memory Freed");
    setCodeLines([]); setVariables([]);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#09090b] font-sans text-white overflow-hidden">
      <CyberGrid />
      
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden min-h-0">
        
        {/* LEFT: COMMAND CENTER */}
        <div className="w-full lg:w-[340px] bg-black/95 lg:bg-black/80 backdrop-blur-md border-white/10 flex flex-col h-[38%] lg:h-full shadow-2xl shrink-0 z-20 overflow-hidden order-1 lg:border-r">
            <div className="overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar pb-6 flex-1 lg:max-h-none pt-4 lg:pt-6">
                <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Type</label>
                <div className="grid grid-cols-2 gap-2">
                    {(['singly', 'doubly', 'circular', 'doubly-circular'] as ListType[]).map(type => (
                    <button key={type} onClick={() => setListType(type)} disabled={isAnimating}
                        className={`py-2 rounded text-[10px] font-bold uppercase transition-all ${
                        listType === type ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                        {type.replace('-', ' ')}
                    </button>
                    ))}
                </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Step Engine</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${isPaused ? 'border-amber-500 text-amber-500' : 'border-emerald-500 text-emerald-500'}`}>
                        {isPaused ? 'MANUAL' : 'AUTO'}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsPaused(!isPaused)} className="flex-1 py-2 bg-black/50 border border-white/10 rounded flex items-center justify-center gap-2 text-xs font-bold hover:bg-white/5 transition-all">
                    {isPaused ? <Play size={14}/> : <Pause size={14}/>} {isPaused ? 'AUTOPLAY' : 'MANUAL'}
                    </button>
                    <button disabled={!isPaused || !isAnimating} onClick={resolveStep} className="flex-1 py-2 bg-emerald-500 text-black rounded flex items-center justify-center gap-2 text-xs font-black hover:bg-emerald-400 disabled:opacity-30 disabled:grayscale transition-all">
                    <StepForward size={14} /> NEXT STEP
                    </button>
                </div>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-[9px] text-gray-500 uppercase font-bold">Node Value</label>
                        <div className="flex gap-1 mt-1">
                            <input type="number" value={inputValue} onChange={(e) => setInputValue(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-emerald-400 outline-none font-mono text-sm" />
                            <button onClick={generateRandom} className="px-3 bg-white/5 rounded border border-white/10 hover:bg-white/10"><RotateCcw size={14}/></button>
                        </div>
                    </div>
                    <div className="w-20">
                        <label className="text-[9px] text-gray-500 uppercase font-bold">Target Idx</label>
                        <input type="number" value={inputIndex} onChange={(e) => setInputIndex(Number(e.target.value))} className="w-full mt-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-cyan-400 outline-none font-mono text-sm" />
                    </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => handleInsert('head')} disabled={isAnimating} className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded hover:bg-emerald-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                        <CornerDownRight size={16}/> Insert Beg
                    </button>
                    <button onClick={() => handleInsert('end')} disabled={isAnimating} className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded hover:bg-emerald-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                        <ArrowDownToLine size={16}/> Insert End
                    </button>
                    <button onClick={() => handleInsert('index')} disabled={isAnimating} className="p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded hover:bg-cyan-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50 col-span-2">
                        <Target size={16}/> Insert at specific Index
                    </button>
                    
                    <button onClick={() => handleDelete('head')} disabled={isAnimating} className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                        <Trash2 size={16}/> Delete Beg
                    </button>
                    <button onClick={() => handleDelete('end')} disabled={isAnimating} className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                        <X size={16}/> Delete End
                    </button>
                    <button onClick={() => handleDelete('index')} disabled={isAnimating} className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded hover:bg-rose-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50 col-span-2">
                        <Target size={16}/> Delete at specific Index
                    </button>
                    </div>
                </div>
            </div>
        </div>

        {/* VISIBLE GLOWING SEPARATOR LINE (Mobile Only) */}
        <div className="lg:hidden h-[2px] w-full bg-gradient-to-r from-emerald-500/10 via-emerald-500/60 to-emerald-500/10 shrink-0 z-30 order-2" />

        {/* RIGHT: THE ARENA */}
        <div className="order-3 lg:order-2 flex-1 relative flex flex-col p-3 sm:p-4 lg:p-6 min-w-0 overflow-hidden lg:h-full w-full">
          
          {/* SMALL HUD TOGGLE */}
          <div className="flex justify-start lg:justify-start items-center mb-2 lg:mb-3 shrink-0 gap-2">
             <button 
                onClick={() => setShowHUD(!showHUD)}
                className="h-7 lg:h-8 px-3 bg-[#050505] border border-emerald-500/80 rounded-lg lg:rounded-full text-emerald-400 font-black text-[10px] flex items-center gap-1.5 tracking-widest hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] uppercase z-40"
             >
                {showHUD ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                {showHUD ? 'HIDE HUD' : 'SHOW HUD'}
             </button>
          </div>

          {/* Central Arena: The Linked List Canvas */}
          <div className="flex-1 min-h-0 border border-white/5 bg-black/30 rounded-2xl relative flex flex-col shadow-inner overflow-hidden mb-2 lg:mb-4 w-full">
             
             {/* ADDED: w-full and touch-pan-x for proper horizontal scrolling */}
             <div className="flex-1 w-full overflow-x-auto overflow-y-hidden custom-scrollbar relative flex items-center touch-pan-x">
                 <div className="min-w-max flex items-center px-8 sm:px-16 relative h-full py-8 pr-16 sm:pr-24 w-max">
                     
                     {(listType === 'circular' || listType === 'doubly-circular') && nodes.length > 1 && (
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
                            {(() => {
                                const startX = 160 + (nodes.length - 1) * 112 + 96;
                                const startY = 88; 
                                const endX = 96;   
                                const endY = 40;   
                                const controlY = 5; 

                                const pathD = `M ${startX} ${startY} 
                                               L ${startX + 10} ${startY}
                                               Q ${startX + 30} ${startY} ${startX + 30} ${startY - 20} 
                                               L ${startX + 30} ${controlY + 20} 
                                               Q ${startX + 30} ${controlY} ${startX + 10} ${controlY} 
                                               L ${endX + 20} ${controlY} 
                                               Q ${endX} ${controlY} ${endX} ${controlY + 20} 
                                               L ${endX} ${endY - 6}`;

                                return (
                                    <>
                                        <motion.path 
                                            d={pathD}
                                            fill="transparent" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,5"
                                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}
                                        />
                                        <polygon points={`${endX - 6},${endY - 6} ${endX + 6},${endY - 6} ${endX},${endY + 2}`} fill="#f59e0b" />
                                    </>
                                );
                            })()}
                        </svg>
                     )}

                     <div className="relative mr-4 sm:mr-8 flex flex-col items-center shrink-0 w-14 sm:w-16">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-black z-10"><Anchor size={18}/></div>
                        <span className="text-[10px] font-black text-amber-500 mt-2">HEAD</span>
                        {nodes.length > 0 && <div className="absolute top-6 left-12 w-8 h-0.5 bg-amber-500" />}
                     </div>

                     <AnimatePresence mode="popLayout">
                        {nodes.map((node, i) => {
                           const isSeeker = seekerIndex === i;
                           return (
                              <motion.div layout key={node.id}
                                 initial={{ scale: 0, opacity: 0, y: -50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0, opacity: 0, y: 50 }}
                                 className="flex items-center shrink-0 mr-3 sm:mr-4 relative"
                                 style={{ width: '96px' }}
                              >
                                 <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 flex flex-col items-center justify-center relative bg-[#09090b] z-10 transition-colors shrink-0
                                    ${node.isDeleting ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : isSeeker ? 'border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)]' : 'border-white/20 hover:border-white/50'}`}>
                                    
                                    <span className="text-[10px] sm:text-xs text-gray-500 font-mono absolute top-1.5 left-1.5 sm:top-2 sm:left-2">0x{node.id}</span>
                                    <span className={`text-2xl sm:text-3xl font-black ${isSeeker ? 'text-cyan-400' : 'text-white'}`}>{node.value}</span>
                                    <span className="text-[8px] sm:text-[9px] text-gray-600 font-bold absolute bottom-1.5 sm:bottom-2">IDX {i}</span>
                                    
                                    {isSeeker && (
                                       <div className="absolute -top-10 bg-cyan-500 text-black px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap z-50 shadow-lg shadow-cyan-500/20">
                                          Scanner yahan hai
                                       </div>
                                    )}
                                 </div>

                                 {i < nodes.length - 1 && (
                                    <div className="w-8 sm:w-10 h-0.5 bg-white/20 relative ml-[-6px] sm:ml-[-8px]">
                                       <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-white/40 rotate-45" />
                                       {node.isNew && <motion.div initial={{width:0}} animate={{width:"100%"}} className="absolute inset-0 bg-emerald-400 shadow-[0_0_10px_#34d399]" />}
                                    </div>
                                 )}

                                 {(listType === 'doubly' || listType === 'doubly-circular') && i < nodes.length - 1 && (
                                    <div className="absolute left-[72px] sm:left-[88px] bottom-7 sm:bottom-8 w-8 sm:w-10 h-0.5 bg-purple-500/40 translate-y-3">
                                       <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 border-b-2 border-l-2 border-purple-500/60 rotate-45" />
                                    </div>
                                 )}

                                 {i === nodes.length - 1 && listType !== 'circular' && listType !== 'doubly-circular' && (
                                    <div className="absolute left-[86px] sm:left-[104px] flex items-center opacity-30 w-14 sm:w-16">
                                       <div className="w-6 h-0.5 bg-white" />
                                       <div className="px-1.5 py-0.5 border border-white text-[9px] rounded ml-1">NULL</div>
                                    </div>
                                 )}
                              </motion.div>
                           )
                        })}
                     </AnimatePresence>
                 </div>
             </div>
          </div>

          {/* Message Status Bar */}
          <div className="shrink-0 flex justify-between items-center text-[10px] lg:text-xs font-mono text-gray-500 px-2 lg:mb-2">
             <div className="flex items-center gap-2"><Activity size={14} className={isAnimating ? "text-amber-500 animate-spin" : ""}/> {message}</div>
             <div>Total Nodes: {nodes.length}</div>
          </div>

          {/* HUD TRACE & HEAP */}
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
                   <div className="flex-1 shrink-0 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col shadow-2xl overflow-hidden h-full">
                       <div className="px-3 lg:px-4 py-2 lg:py-3 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                          <div className="flex items-center gap-1.5 lg:gap-2 text-emerald-400">
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
                                <div className={`font-mono ${line.active ? 'text-emerald-400' : 'text-gray-400'}`}>{line.text}</div>
                                {line.active && <div className="text-[9px] lg:text-xs text-amber-400 mt-0.5 lg:mt-1 flex items-start gap-1.5 lg:gap-2 leading-relaxed"><ArrowRight size={12} className="w-3 h-3 shrink-0 mt-0.5"/> {line.explanation}</div>}
                             </div>
                          )) : <div className="text-gray-600 text-[10px] lg:text-xs italic flex items-center justify-center h-full gap-2"><Activity size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4"/> Waiting for player action...</div>}
                       </div>
                   </div>

                   {/* 2. THE SPAWN ZONE */}
                   <div className="w-[130px] lg:w-[350px] shrink-0 border border-emerald-500/30 bg-emerald-900/20 rounded-xl relative flex items-center justify-center shadow-inner h-full overflow-hidden">
                      <div className="absolute top-2 right-2 lg:top-3 lg:right-4 flex items-center gap-1.5 lg:gap-2 text-[8px] lg:text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
                          <Box size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Spawn_Zone (Heap)</span><span className="lg:hidden">Heap</span>
                      </div>
                      
                      <AnimatePresence>
                         {phantom && (
                            <motion.div
                              initial={{ scale: 0, y: -20, opacity: 0 }}
                              animate={{ scale: 1, y: 0, opacity: 1 }}
                              exit={{ opacity: 0, scale: 0.8, y: 40 }}
                              className="w-14 h-14 lg:w-24 lg:h-24 rounded-lg lg:rounded-xl border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.3)] z-50 relative mt-4 lg:mt-6"
                            >
                               <span className="text-[8px] lg:text-xs text-emerald-400 font-mono absolute top-1 left-1 lg:top-2 lg:left-2">0x{phantom.id}</span>
                               <span className="text-xl lg:text-3xl font-black text-white">{phantom.value}</span>
                               <div className="hidden lg:block absolute -bottom-6 bg-emerald-500 text-black px-2 py-1 rounded text-[10px] font-bold shadow-lg whitespace-nowrap">WAITING TO LINK...</div>
                            </motion.div>
                         )}
                      </AnimatePresence>

                      {!phantom && (
                          <div className="text-emerald-500/30 font-mono text-[9px] lg:text-xs flex items-center gap-1.5 lg:gap-2 mt-4">
                              <Zap size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Memory Pool Empty</span><span className="lg:hidden">Empty</span>
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

export default LinkedListVisualizer;