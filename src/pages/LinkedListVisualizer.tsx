import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, RotateCcw, ArrowRight, Trash2, 
  CornerDownRight, X, Play, Pause, StepForward, 
  Search, Anchor, Zap, Box, MousePointer2, 
  GitCommit, ChevronsRight, Cpu, Layers, Terminal, Activity
} from 'lucide-react';

// --- TYPES ---
type ListType = 'singly' | 'doubly';
type NodeData = { 
  id: string; 
  value: number; 
  isNew?: boolean; 
  isDeleting?: boolean; 
  highlight?: boolean; 
};

type CodeLine = { id: string; text: string; explanation: string; active: boolean };
type VariableState = { name: string; value: string; color: string };

// --- ADVANCED ALGORITHM MATRIX ---
const SNIPPETS = {
  singly: {
    insertHead: [
      { id: '1', text: 'Node temp = new Node(val);', explanation: 'Allocating memory for a new node in the Heap.', active: false },
      { id: '2', text: 'temp.next = head;', explanation: 'Pointing the new node to the current Head of the list.', active: false },
      { id: '3', text: 'head = temp;', explanation: 'Updating the Head pointer to reference our new node.', active: false },
    ],
    insertIndex: [
      { id: '1', text: 'Node temp = new Node(val);', explanation: 'Creating the new node to be inserted.', active: false },
      { id: '2', text: 'Node ptr = head;', explanation: 'Initializing a traversal pointer (ptr) at the start.', active: false },
      { id: '3', text: 'while(i < index-1) ptr = ptr.next;', explanation: 'Advancing ptr to the node BEFORE the insertion point.', active: false },
      { id: '4', text: 'temp.next = ptr.next;', explanation: 'Connecting new node to the rest of the chain.', active: false },
      { id: '5', text: 'ptr.next = temp;', explanation: 'Linking the previous node to our new node.', active: false },
    ],
    deleteHead: [
      { id: '1', text: 'if (head == null) return;', explanation: 'Checking if the list is empty (Underflow protection).', active: false },
      { id: '2', text: 'Node junk = head;', explanation: 'Storing the current head to free its memory later.', active: false },
      { id: '3', text: 'head = head.next;', explanation: 'Moving the Head pointer to the second node.', active: false },
      { id: '4', text: 'delete junk;', explanation: 'Deallocating the memory of the removed node.', active: false },
    ],
    deleteIndex: [
      { id: '1', text: 'Node ptr = head;', explanation: 'Starting traversal from Head.', active: false },
      { id: '2', text: 'while(i < index-1) ptr = ptr.next;', explanation: 'Navigating to the predecessor of the target node.', active: false },
      { id: '3', text: 'Node junk = ptr.next;', explanation: 'Identifying the node to be deleted.', active: false },
      { id: '4', text: 'ptr.next = junk.next;', explanation: 'Bypassing the junk node (changing the link).', active: false },
      { id: '5', text: 'delete junk;', explanation: 'Freeing the memory of the deleted node.', active: false },
    ]
  },
  doubly: {
    insertHead: [
      { id: '1', text: 'Node temp = new Node(val);', explanation: 'Allocating memory for new Doubly Node.', active: false },
      { id: '2', text: 'temp.next = head;', explanation: 'Setting forward pointer to current Head.', active: false },
      { id: '3', text: 'if(head != null) head.prev = temp;', explanation: 'Updating back-pointer of old Head.', active: false },
      { id: '4', text: 'head = temp;', explanation: 'Moving Head pointer to the new node.', active: false },
    ],
    insertIndex: [
      { id: '1', text: 'Node temp = new Node(val);', explanation: 'Creating new Doubly Node.', active: false },
      { id: '2', text: 'Node ptr = head;', explanation: 'Initializing traversal.', active: false },
      { id: '3', text: 'while(i < index-1) ptr = ptr.next;', explanation: 'Moving to the insertion point.', active: false },
      { id: '4', text: 'temp.next = ptr.next;', explanation: 'Linking forward to the next node.', active: false },
      { id: '5', text: 'if(ptr.next) ptr.next.prev = temp;', explanation: 'Linking backward from the next node.', active: false },
      { id: '6', text: 'ptr.next = temp; temp.prev = ptr;', explanation: 'Linking previous node to new node (both ways).', active: false },
    ],
    deleteHead: [
      { id: '1', text: 'Node junk = head;', explanation: 'Marking Head for deletion.', active: false },
      { id: '2', text: 'head = head.next;', explanation: 'Shifting Head forward.', active: false },
      { id: '3', text: 'if(head) head.prev = null;', explanation: 'Severing the backward link of the new Head.', active: false },
      { id: '4', text: 'delete junk;', explanation: 'Deallocating memory.', active: false },
    ],
    deleteIndex: [
      { id: '1', text: 'Node ptr = head;', explanation: 'Starting traversal.', active: false },
      { id: '2', text: 'while(i < index-1) ptr = ptr.next;', explanation: 'Finding predecessor node.', active: false },
      { id: '3', text: 'Node junk = ptr.next;', explanation: 'Targeting node for deletion.', active: false },
      { id: '4', text: 'ptr.next = junk.next;', explanation: 'Linking forward around junk.', active: false },
      { id: '5', text: 'if(junk.next) junk.next.prev = ptr;', explanation: 'Linking backward around junk.', active: false },
      { id: '6', text: 'delete junk;', explanation: 'Freeing memory.', active: false },
    ]
  }
};

// --- BACKGROUND COMPONENT ---
const CyberGrid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-[#020205]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,245,255,0.05),transparent_70%)]" />
  </div>
);

const LinkedListVisualizer = () => {
  const [listType, setListType] = useState<ListType>('singly');
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: 'A1', value: 10 }, { id: 'B2', value: 20 }, { id: 'C3', value: 30 }
  ]);
  
  // Input State (Controlled for auto-update)
  const [inputValue, setInputValue] = useState<number>(45);
  const [inputIndex, setInputIndex] = useState<number>(1);
  
  // Animation & Control
  const [isPaused, setIsPaused] = useState(true); 
  const [isAnimating, setIsAnimating] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [message, setMessage] = useState('SYSTEM_IDLE');
  const [codeLines, setCodeLines] = useState<CodeLine[]>([]);
  const [variables, setVariables] = useState<VariableState[]>([]);
  
  // Visual Actors
  const [phantom, setPhantom] = useState<NodeData | null>(null);
  const [seekerIndex, setSeekerIndex] = useState<number | null>(null);
  
  const stepTrigger = useRef<() => void>(() => {});

  // Initialize with random value
  useEffect(() => {
    generateRandom();
  }, []);

  const generateRandom = () => {
    setInputValue(Math.floor(Math.random() * 90) + 10);
  };

  // --- ENGINE LOGIC ---
  const resolveStep = () => { if (stepTrigger.current) stepTrigger.current(); };

  const waitStep = async (lineId: string, snippet: CodeLine[], vars: VariableState[] = []) => {
    const currentLine = snippet.find(l => l.id === lineId);
    setMessage(currentLine ? currentLine.explanation : 'Processing...');
    setCodeLines(snippet.map(line => ({ ...line, active: line.id === lineId })));
    if (vars.length > 0) setVariables(vars);
    
    if (isPaused) {
      await new Promise<void>((resolve) => { stepTrigger.current = resolve; });
    } else {
      await new Promise(r => setTimeout(r, 1500 / speed));
    }
  };

  // --- OPERATIONS ---
  const handleInsert = async (atHead: boolean) => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    const idx = atHead ? 0 : Math.max(0, Math.min(inputIndex, nodes.length));
    const currentSnippets = listType === 'singly' ? SNIPPETS.singly : SNIPPETS.doubly;
    const snippet = idx === 0 ? currentSnippets.insertHead : currentSnippets.insertIndex;
    
    const newNodeId = Math.floor(Math.random()*9000 + 1000).toString();
    const newNode = { id: newNodeId, value: inputValue, isNew: true };

    // 1. ALLOCATE
    setPhantom(newNode);
    await waitStep('1', snippet, [{ name: 'temp', value: `${newNode.value}`, color: '#00f5ff' }]);

    if (idx === 0) {
        // 2. LINK HEAD
        await waitStep('2', snippet);
        if (listType === 'doubly') await waitStep('3', snippet);
        await waitStep(listType === 'doubly' ? '4' : '3', snippet, [{ name: 'head', value: newNode.id, color: '#fbbf24' }]);
    } else {
        // 2. TRAVERSE
        await waitStep('2', snippet, [{ name: 'ptr', value: 'HEAD', color: '#00ff88' }]);
        setSeekerIndex(0);
        
        for (let i = 0; i < idx - 1; i++) {
            await waitStep('3', snippet, [
                { name: 'ptr', value: nodes[i+1]?.id || 'NULL', color: '#00ff88' },
                { name: 'i', value: `${i}`, color: '#94a3b8' }
            ]);
            setSeekerIndex(i + 1);
        }
        
        // 3. RE-LINK
        await waitStep('4', snippet);
        await waitStep('5', snippet);
        if (listType === 'doubly') await waitStep('6', snippet);
    }

    // FINALIZE
    const newArr = [...nodes];
    newArr.splice(idx, 0, newNode);
    setNodes(newArr);
    setPhantom(null);
    setSeekerIndex(null);
    
    await new Promise(r => setTimeout(r, 800 / speed));
    setNodes(prev => prev.map(n => ({ ...n, isNew: false })));
    
    setIsAnimating(false);
    setMessage("MEMORY_UPDATED_SUCCESSFULLY");
    setCodeLines([]);
    setVariables([]);
    generateRandom(); // Auto-generate next value
  };

  const handleDelete = async (atHead: boolean) => {
    if (isAnimating || nodes.length === 0) return;
    setIsAnimating(true);
    
    const idx = atHead ? 0 : Math.max(0, Math.min(inputIndex, nodes.length - 1));
    const currentSnippets = listType === 'singly' ? SNIPPETS.singly : SNIPPETS.doubly;
    const snippet = idx === 0 ? currentSnippets.deleteHead : currentSnippets.deleteIndex;

    if (idx === 0) {
        await waitStep('1', snippet);
        setNodes(prev => prev.map((n, i) => i === 0 ? { ...n, isDeleting: true } : n));
        await waitStep('2', snippet, [{ name: 'junk', value: nodes[0].id, color: '#ef4444' }]);
        await waitStep('3', snippet, [{ name: 'head', value: nodes[1]?.id || 'NULL', color: '#fbbf24' }]);
        if (listType === 'doubly') await waitStep('3', snippet); 
        await waitStep(listType === 'doubly' ? '4' : '4', snippet);
    } else {
        await waitStep('1', snippet, [{ name: 'ptr', value: 'HEAD', color: '#00ff88' }]);
        setSeekerIndex(0);
        for (let i = 0; i < idx - 1; i++) {
            await waitStep('2', snippet, [
                { name: 'ptr', value: nodes[i+1]?.id || 'NULL', color: '#00ff88' },
                { name: 'i', value: `${i}`, color: '#94a3b8' }
            ]);
            setSeekerIndex(i + 1);
        }
        setNodes(prev => prev.map((n, i) => i === idx ? { ...n, isDeleting: true } : n));
        await waitStep('3', snippet, [{ name: 'junk', value: nodes[idx].id, color: '#ef4444' }]);
        await waitStep('4', snippet);
        await waitStep('5', snippet);
        if (listType === 'doubly') await waitStep('6', snippet);
    }

    const newArr = [...nodes];
    newArr.splice(idx, 1);
    setNodes(newArr);
    setSeekerIndex(null);
    setIsAnimating(false);
    setMessage("MEMORY_FREED");
    setCodeLines([]);
    setVariables([]);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#020205] overflow-hidden font-sans text-white">
      <CyberGrid />
      
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* --- LEFT: COMMAND CENTER --- */}
        <div className="w-96 bg-[#0a0a14]/90 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl h-full">
            
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#00f5ff]/5 to-transparent">
               <h2 className="text-xl font-black italic tracking-tighter text-white flex items-center gap-2">
                  <Cpu className="text-[#00f5ff]" /> LINKED_LIST_OS
               </h2>
               <p className="text-[10px] text-[#00f5ff]/60 font-mono mt-1">MEMORY VISUALIZATION KERNEL v4.1</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* 1. Mode Selection */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Architecture</label>
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                        {(['singly', 'doubly'] as ListType[]).map(type => (
                            <button
                                key={type}
                                onClick={() => { setListType(type); setNodes([{id:'A1', value:10}, {id:'B2', value:20}]); }}
                                disabled={isAnimating}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${
                                    listType === type ? 'bg-[#00f5ff] text-black shadow-lg shadow-[#00f5ff]/20' : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Playback Controls */}
                <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Process Control</span>
                        <div className={`px-2 py-0.5 rounded text-[9px] font-black border ${isPaused ? 'border-yellow-500 text-yellow-500' : 'border-green-500 text-green-500'}`}>
                            {isPaused ? 'MANUAL' : 'AUTO'}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsPaused(!isPaused)} 
                            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs border ${
                                !isPaused 
                                ? 'bg-[#00f5ff]/10 border-[#00f5ff]/50 text-[#00f5ff]' 
                                : 'bg-black/50 border-white/10 text-gray-400 hover:text-white'
                            }`}
                        >
                            {isPaused ? <Play size={16} fill="currentColor"/> : <Pause size={16} fill="currentColor"/>}
                            {isPaused ? 'RESUME' : 'PAUSE'}
                        </button>
                        <button 
                            disabled={!isPaused || !isAnimating} 
                            onClick={resolveStep}
                            className="flex-1 py-3 bg-[#00f5ff] text-black rounded-xl disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-black text-xs hover:shadow-[0_0_15px_#00f5ff] hover:scale-[1.02]"
                        >
                            <StepForward size={16} /> STEP
                        </button>
                    </div>
                </div>

                {/* 3. Operations Deck */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Payload (Val)</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    value={inputValue}
                                    onChange={(e) => setInputValue(parseInt(e.target.value) || 0)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#00f5ff] focus:border-[#00f5ff] outline-none font-mono"
                                />
                                <button onClick={generateRandom} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-400">
                                    <RotateCcw size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Address (Idx)</label>
                            <input 
                                type="number" 
                                value={inputIndex}
                                onChange={(e) => setInputIndex(parseInt(e.target.value) || 0)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#00f5ff] focus:border-[#00f5ff] outline-none font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleInsert(true)} disabled={isAnimating} className="p-4 bg-[#00f5ff]/5 border border-[#00f5ff]/20 hover:border-[#00f5ff]/50 hover:bg-[#00f5ff]/10 rounded-xl text-[#00f5ff] transition-all flex flex-col items-center gap-2 disabled:opacity-30 group">
                            <CornerDownRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                            <span className="text-[10px] font-black uppercase">Push Head</span>
                        </button>
                        <button onClick={() => handleInsert(false)} disabled={isAnimating} className="p-4 bg-[#00f5ff]/5 border border-[#00f5ff]/20 hover:border-[#00f5ff]/50 hover:bg-[#00f5ff]/10 rounded-xl text-[#00f5ff] transition-all flex flex-col items-center gap-2 disabled:opacity-30 group">
                            <Plus size={20} className="group-hover:scale-110 transition-transform"/>
                            <span className="text-[10px] font-black uppercase">Insert At</span>
                        </button>
                        <button onClick={() => handleDelete(true)} disabled={isAnimating} className="p-4 bg-red-500/5 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 rounded-xl text-red-500 transition-all flex flex-col items-center gap-2 disabled:opacity-30 group">
                            <X size={20} className="group-hover:rotate-90 transition-transform"/>
                            <span className="text-[10px] font-black uppercase">Pop Head</span>
                        </button>
                        <button onClick={() => handleDelete(false)} disabled={isAnimating} className="p-4 bg-red-500/5 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 rounded-xl text-red-500 transition-all flex flex-col items-center gap-2 disabled:opacity-30 group">
                            <Trash2 size={20} className="group-hover:scale-110 transition-transform"/>
                            <span className="text-[10px] font-black uppercase">Delete At</span>
                        </button>
                    </div>
                    
                    <button onClick={() => setNodes([])} className="w-full py-3 border border-white/5 hover:border-white/20 rounded-xl text-[10px] font-bold text-gray-500 hover:text-white transition-all flex items-center justify-center gap-2">
                        <RotateCcw size={14}/> FORMAT_MEMORY
                    </button>
                </div>
            </div>
        </div>

        {/* --- RIGHT: HOLOGRAPHIC CANVAS --- */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
            
            {/* 1. Code & Variables Panel (Floating) */}
            <div className="absolute top-6 right-6 z-40 w-80 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[50vh]">
                <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <Terminal size={14} className="text-[#00f5ff]"/>
                        <span className="text-[10px] font-black uppercase tracking-widest">Execution_Trace</span>
                    </div>
                </div>
                
                {/* Variable Scope */}
                {variables.length > 0 && (
                    <div className="px-4 py-2 border-b border-white/5 bg-[#00f5ff]/5 flex flex-wrap gap-3">
                        {variables.map((v, i) => (
                            <div key={i} className="text-[10px] font-mono">
                                <span className="text-gray-400">{v.name}:</span> <span style={{ color: v.color }} className="font-bold">{v.value}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Code Lines */}
                <div className="p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {codeLines.length > 0 ? codeLines.map((line) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            key={line.id} 
                            className={`text-[10px] font-mono flex gap-3 transition-colors duration-300 ${line.active ? 'text-white' : 'text-gray-600 opacity-50'}`}
                        >
                            <span className="shrink-0 w-4 text-right opacity-30">{line.id}</span>
                            <div className="flex flex-col">
                                <span className={line.active ? 'font-bold text-[#00f5ff]' : ''}>{line.text}</span>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-20 text-gray-700 gap-2">
                            <Zap size={20} className="opacity-20"/>
                            <span className="text-[10px] font-mono italic">AWAITING_OPCODE...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Message Toast (Bottom Fixed) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-auto">
               <motion.div 
                 key={message}
                 initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                 className="px-8 py-4 bg-[#0a0a14] border border-[#00f5ff]/30 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center gap-4 min-w-[300px]"
               >
                  <div className={`p-2 rounded-full ${isAnimating ? 'bg-[#00f5ff]/10 text-[#00f5ff] animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
                     <Activity size={18} />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">System Status</span>
                      <span className="text-sm font-medium text-white">{message}</span>
                  </div>
               </motion.div>
            </div>

            {/* 3. The Main Stage */}
            <div className="flex-1 relative flex flex-col">
                
                {/* Memory Pool (Creation Zone) */}
                <div className="h-1/3 w-full border-b border-white/5 bg-white/[0.01] relative flex items-center justify-center">
                    <div className="absolute top-4 left-6 flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                        <Box size={14} className="text-[#00f5ff]"/> 
                        <span>Heap_Allocator (0x0000)</span>
                    </div>
                    
                    <AnimatePresence>
                        {phantom && (
                            <motion.div 
                                initial={{ scale: 0, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                exit={{ y: 200, opacity: 0, scale: 0.5, transition: { duration: 0.5 } }}
                                className="relative flex flex-col items-center"
                            >
                                <div className="px-3 py-1 bg-[#00f5ff] text-black text-[9px] font-black rounded-full mb-3 shadow-[0_0_20px_#00f5ff]">NEW_NODE</div>
                                <div className="w-24 h-24 rounded-2xl bg-[#0a0a14] border-2 border-[#00f5ff] flex items-center justify-center shadow-[0_0_50px_rgba(0,245,255,0.2)]">
                                    <span className="text-3xl font-black text-white">{phantom.value}</span>
                                    <div className="absolute top-2 left-3 text-[9px] font-mono text-gray-500">0x{phantom.id}</div>
                                </div>
                                <motion.div 
                                    animate={{ y: [0, 10, 0] }} 
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="absolute -bottom-10 text-[#00f5ff]"
                                >
                                    <ArrowRight size={24} className="rotate-90" />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Linked List Chain */}
                <div className="flex-1 flex items-center overflow-x-auto px-20 custom-scrollbar relative">
                    
                    {/* HEAD Anchor */}
                    <div className="relative mr-16 flex flex-col items-center gap-3 group">
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 border-2 border-yellow-500 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] relative z-10">
                            <Anchor className="text-yellow-500 w-8 h-8" />
                        </div>
                        <span className="text-[10px] font-black text-yellow-500 tracking-widest">HEAD</span>
                        
                        {/* Connecting Cable */}
                        {nodes.length > 0 && (
                            <svg className="absolute top-8 left-16 w-16 h-2 z-0 overflow-visible">
                                <motion.line 
                                    x1="0" y1="0" x2="100%" y2="0" 
                                    stroke="#eab308" strokeWidth="2" 
                                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }}
                                />
                                <circle cx="100%" cy="0" r="3" fill="#eab308" />
                            </svg>
                        )}
                    </div>

                    <AnimatePresence mode="popLayout">
                        {nodes.map((node, i) => {
                            const isSeeker = seekerIndex === i;
                            
                            return (
                                <motion.div 
                                    layout
                                    key={node.id}
                                    initial={{ opacity: 0, scale: 0.8, x: -50 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0, y: 100 }}
                                    className="relative flex items-center mr-6 shrink-0"
                                >
                                    {/* NODE CONTAINER */}
                                    <div className={`
                                        w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center relative z-10 transition-all duration-500 bg-[#0a0a14]
                                        ${node.isDeleting ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]' : 
                                          isSeeker ? 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]' : 
                                          'border-white/10'}
                                    `}>
                                        <div className="absolute top-3 left-3 text-[9px] font-mono text-gray-600">0x{node.id}</div>
                                        <span className={`text-3xl font-black ${isSeeker ? 'text-green-400' : 'text-white'}`}>{node.value}</span>
                                        <div className="absolute -bottom-8 flex flex-col items-center">
                                            <div className="h-4 w-px bg-white/10" />
                                            <span className="text-[10px] font-mono text-gray-500">INDEX {i}</span>
                                        </div>

                                        {/* THE SEEKER DRONE */}
                                        {isSeeker && (
                                            <motion.div layoutId="seeker" className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-50">
                                                <div className="bg-green-500 text-black px-3 py-1 rounded text-[9px] font-black uppercase shadow-lg shadow-green-500/20">
                                                    PTR (Scanner)
                                                </div>
                                                <div className="w-0.5 h-8 bg-green-500" />
                                                <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-black" />
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* POINTER CONNECTIONS */}
                                    {i < nodes.length - 1 && (
                                        <div className="w-20 h-12 flex flex-col justify-center relative mx-2">
                                            {/* Next Pointer (Top) */}
                                            <div className="w-full h-px bg-white/20 relative group">
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-white/20 rotate-45" />
                                                {node.isNew && <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="absolute inset-0 bg-[#00f5ff] h-0.5 shadow-[0_0_10px_#00f5ff]" />}
                                            </div>
                                            
                                            {/* Prev Pointer (Bottom - Doubly) */}
                                            {listType === 'doubly' && (
                                                <div className="w-full h-px bg-purple-500/30 relative mt-3">
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 border-b-2 border-l-2 border-purple-500/50 rotate-45" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* NULL TERMINATOR */}
                                    {i === nodes.length - 1 && (
                                        <div className="ml-8 flex items-center gap-3 opacity-30">
                                            <div className="w-12 h-px bg-white" />
                                            <div className="w-10 h-10 rounded-lg border border-white/50 flex items-center justify-center">
                                                <X size={16} />
                                            </div>
                                            <span className="text-[10px] font-mono">NULL</span>
                                        </div>
                                    )}

                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedListVisualizer;