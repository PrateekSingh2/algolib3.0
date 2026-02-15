import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw, ArrowRight, Code2, Trash2, CornerDownRight, X, AlertCircle, CheckCircle2 } from 'lucide-react';

// --- TYPES ---
type ListType = 'singly' | 'doubly';
type NodeData = { id: string; value: number; isNew?: boolean; isDeleting?: boolean; highlight?: boolean };
type CodeLine = { id: string; text: string; active: boolean };

// --- CODE SNIPPETS (Same as before) ---
const SNIPPETS = {
  insertHead: [
    { id: '1', text: 'Node newNode = new Node(val);', active: false },
    { id: '2', text: 'newNode.next = head;', active: false },
    { id: '3', text: 'head = newNode;', active: false },
  ],
  insertIndex: [
    { id: '1', text: 'Node newNode = new Node(val);', active: false },
    { id: '2', text: 'Node ptr = head;', active: false },
    { id: '3', text: 'for(int i=0; i<index-1; i++) ptr=ptr.next;', active: false },
    { id: '4', text: 'newNode.next = ptr.next;', active: false },
    { id: '5', text: 'ptr.next = newNode;', active: false },
  ],
  deleteHead: [
    { id: '1', text: 'if (head == null) return;', active: false },
    { id: '2', text: 'Node temp = head;', active: false },
    { id: '3', text: 'head = head.next;', active: false },
    { id: '4', text: 'delete temp;', active: false },
  ],
  deleteIndex: [
    { id: '1', text: 'Node ptr = head;', active: false },
    { id: '2', text: 'for(int i=0; i<index-1; i++) ptr=ptr.next;', active: false },
    { id: '3', text: 'Node toDelete = ptr.next;', active: false },
    { id: '4', text: 'ptr.next = toDelete.next;', active: false },
    { id: '5', text: 'delete toDelete;', active: false },
  ]
};

const LinkedListVisualizer = () => {
  // --- STATE ---
  const [listType, setListType] = useState<ListType>('singly');
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: '1', value: 10 }, 
    { id: '2', value: 20 }, 
    { id: '3', value: 30 },
    { id: '4', value: 40 }
  ]);
  
  // Animation States
  const [phantom, setPhantom] = useState<NodeData | null>(null);
  const [phantomPos, setPhantomPos] = useState({ x: 0, index: 0 });
  const [scannerIndex, setScannerIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('Ready');
  const [isAnimating, setIsAnimating] = useState(false);
  const [codeLines, setCodeLines] = useState<CodeLine[]>(SNIPPETS.insertHead);

  // Inputs
  const [inputValue, setInputValue] = useState(45);
  const [inputIndex, setInputIndex] = useState(1);

  const isDoubly = listType === 'doubly';

  // --- ACTIONS ---
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const highlightCode = (lineId: string, snippet: CodeLine[]) => {
    setCodeLines(snippet.map(line => ({ ...line, active: line.id === lineId })));
  };

  const generateRandomValue = () => Math.floor(Math.random() * 99) + 1;

  // --- INSERTION LOGIC (Same as before) ---
  const insertHead = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const snippet = SNIPPETS.insertHead;
    setCodeLines(snippet);

    const newNode = { id: Math.random().toString(), value: inputValue, isNew: true };
    setMessage('Allocating memory for new node...');
    highlightCode('1', snippet);
    setPhantom(newNode);
    setPhantomPos({ x: 0, index: -1 }); 
    await sleep(800);

    setMessage('Pointing newNode.next -> HEAD');
    highlightCode('2', snippet);
    await sleep(800);

    setMessage('Updating HEAD to point to newNode');
    highlightCode('3', snippet);
    setPhantom(null);
    setNodes([newNode, ...nodes]);
    await sleep(500);
    setNodes(prev => prev.map(n => ({ ...n, isNew: false })));
    setMessage('Insertion Complete!');
    highlightCode('', snippet);
    setInputValue(generateRandomValue());
    setIsAnimating(false);
  };

  const insertAtIndex = async () => {
    if (isAnimating) return;
    const idx = Math.max(0, Math.min(inputIndex, nodes.length));
    if (idx === 0) return insertHead();
    setIsAnimating(true);
    const snippet = SNIPPETS.insertIndex;
    setCodeLines(snippet);
    const newNode = { id: Math.random().toString(), value: inputValue, isNew: true };
    setMessage('Allocating memory for new node...');
    highlightCode('1', snippet);
    setPhantom(newNode);
    setPhantomPos({ x: idx * 120, index: idx }); 
    await sleep(1000);
    setMessage('Initializing traversal pointer (ptr) at HEAD');
    highlightCode('2', snippet);
    setScannerIndex(0);
    await sleep(600);
    highlightCode('3', snippet);
    for (let i = 0; i < idx - 1; i++) {
        setMessage(`Traversing... Moving ptr to index ${i+1}`);
        setScannerIndex(i + 1);
        await sleep(500);
    }
    setMessage('Linking newNode.next -> ptr.next');
    highlightCode('4', snippet);
    await sleep(800);
    setMessage('Linking ptr.next -> newNode');
    highlightCode('5', snippet);
    setScannerIndex(null);
    setPhantom(null);
    const newArr = [...nodes];
    newArr.splice(idx, 0, newNode);
    setNodes(newArr);
    await sleep(800);
    setNodes(prev => prev.map(n => ({ ...n, isNew: false })));
    setMessage('Insertion Complete!');
    highlightCode('', snippet);
    setInputValue(generateRandomValue());
    setIsAnimating(false);
  };

  // --- DELETION LOGIC (Same as before) ---
  const deleteHead = async () => {
      if (isAnimating || nodes.length === 0) return;
      setIsAnimating(true);
      const snippet = SNIPPETS.deleteHead;
      setCodeLines(snippet);
      setMessage('Checking if HEAD exists...');
      highlightCode('1', snippet);
      await sleep(600);
      setMessage('Marking HEAD for deletion...');
      highlightCode('2', snippet);
      setNodes(prev => prev.map((n, i) => i === 0 ? { ...n, isDeleting: true } : n));
      await sleep(1000);
      setMessage('Moving HEAD pointer to HEAD.next');
      highlightCode('3', snippet);
      await sleep(800);
      setMessage('Deallocating memory...');
      highlightCode('4', snippet);
      setNodes(prev => prev.slice(1)); 
      await sleep(500);
      setMessage('Node Deleted Successfully');
      highlightCode('', snippet);
      setIsAnimating(false);
  };

  const deleteAtIndex = async () => {
      if (isAnimating || nodes.length === 0) return;
      const idx = Math.max(0, Math.min(inputIndex, nodes.length - 1));
      if (idx === 0) return deleteHead();
      setIsAnimating(true);
      const snippet = SNIPPETS.deleteIndex;
      setCodeLines(snippet);
      setMessage('Initializing traversal pointer (ptr)...');
      highlightCode('1', snippet);
      setScannerIndex(0);
      await sleep(600);
      highlightCode('2', snippet);
      for (let i = 0; i < idx - 1; i++) {
          setMessage(`Traversing... Moving ptr to index ${i+1}`);
          setScannerIndex(i + 1);
          await sleep(500);
      }
      setMessage(`Found target node at Index ${idx}`);
      highlightCode('3', snippet);
      setNodes(prev => prev.map((n, i) => i === idx ? { ...n, isDeleting: true } : n));
      await sleep(1000);
      setMessage('Re-linking: ptr.next = toDelete.next');
      highlightCode('4', snippet);
      await sleep(1000);
      setMessage('Deallocating memory (delete toDelete)...');
      highlightCode('5', snippet);
      setScannerIndex(null);
      const newArr = [...nodes];
      newArr.splice(idx, 1);
      setNodes(newArr);
      await sleep(500);
      setMessage('Node Deleted Successfully');
      highlightCode('', snippet);
      setIsAnimating(false);
  };

  const reset = () => {
    setNodes([{ id: '1', value: 10 }, { id: '2', value: 20 }, { id: '3', value: 30 }]);
    setPhantom(null);
    setScannerIndex(null);
    setIsAnimating(false);
    setMessage('Ready');
    highlightCode('', SNIPPETS.insertHead);
  };

  return (
    // --- MAIN WRAPPER ---
    // Tablet (md): flex-col (Stack)
    // Desktop (lg): flex-row (Side-by-Side)
    <div className="w-full h-full flex flex-col lg:flex-row bg-neutral-950 overflow-hidden font-sans">
      
      {/* --- CONTROLS PANEL --- 
          - Tablet: w-full, max-height restricted to 40% (canvas gets 60%), scrollable
          - Desktop: w-80, h-full, border-r
      */}
      <div className="
        w-full lg:w-80 
        h-auto max-h-[40%] lg:max-h-full lg:h-full
        flex-shrink-0
        bg-neutral-900 border-b lg:border-b-0 lg:border-r border-white/10 
        flex flex-col 
        z-20 shadow-2xl relative
        overflow-y-auto custom-scrollbar
      ">
        
        <div className="p-4 space-y-4">
            {/* Type Selector */}
            <div>
                <div className="flex items-center gap-2 mb-2 text-neutral-400">
                    <Code2 size={16} className="text-blue-500" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">Structure Type</span>
                </div>
                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                    {(['singly', 'doubly'] as ListType[]).map(type => (
                        <button
                            key={type}
                            onClick={() => { setListType(type); reset(); }}
                            disabled={isAnimating}
                            className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                                listType === type 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* INPUTS */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/20 border border-white/5">
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase">Value</label>
                    <input 
                        type="number" 
                        value={inputValue}
                        onChange={(e) => setInputValue(parseInt(e.target.value) || 0)}
                        disabled={isAnimating}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded p-1.5 text-sm text-white focus:border-blue-500 outline-none transition-colors font-mono"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase">Index</label>
                    <input 
                        type="number" 
                        value={inputIndex}
                        onChange={(e) => setInputIndex(parseInt(e.target.value) || 0)}
                        disabled={isAnimating}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded p-1.5 text-sm text-white focus:border-blue-500 outline-none transition-colors font-mono"
                    />
                </div>
            </div>

            {/* ACTIONS */}
            <div className="space-y-2">
                {/* Insertion Group */}
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={insertHead} disabled={isAnimating}
                        className="py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg font-bold text-[10px] uppercase flex flex-col items-center justify-center gap-1 transition-all"
                    >
                        <CornerDownRight size={14} /> Insert Head
                    </button>
                    <button 
                        onClick={insertAtIndex} disabled={isAnimating}
                        className="py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg font-bold text-[10px] uppercase flex flex-col items-center justify-center gap-1 transition-all"
                    >
                        <ArrowRight size={14} /> Insert Index
                    </button>
                </div>

                {/* Deletion Group */}
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={deleteHead} disabled={isAnimating || nodes.length === 0}
                        className="py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-bold text-[10px] uppercase flex flex-col items-center justify-center gap-1 transition-all"
                    >
                        <X size={14} /> Delete Head
                    </button>
                    <button 
                        onClick={deleteAtIndex} disabled={isAnimating || nodes.length === 0}
                        className="py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-bold text-[10px] uppercase flex flex-col items-center justify-center gap-1 transition-all"
                    >
                        <Trash2 size={14} /> Delete Index
                    </button>
                </div>
                
                <button 
                    onClick={reset} disabled={isAnimating}
                    className="w-full py-1.5 bg-neutral-800 text-neutral-400 hover:bg-neutral-700 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                    <RotateCcw size={14} /> Reset List
                </button>
            </div>

            {/* Code Panel (Takes remaining height in desktop, or fixed height in tablet stack) */}
            <div className="bg-black/60 rounded-xl p-3 border border-white/10 font-mono text-[9px] overflow-y-auto custom-scrollbar min-h-[120px] max-h-[200px] lg:max-h-[300px]">
                <div className="space-y-1">
                    {codeLines.map((line) => (
                        <div 
                            key={line.id} 
                            className={`px-2 py-1 rounded transition-all duration-300 border-l-2 ${
                                line.active 
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-400' 
                                    : 'text-neutral-500 border-transparent'
                            }`}
                        >
                        <span className="opacity-50 mr-2">{line.id}</span>
                        <span>{line.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* --- CANVAS --- 
          - Tablet: flex-1 (Fills bottom 60%)
          - Desktop: flex-1 (Fills right side)
      */}
      <div className="flex-1 relative bg-[#050505] flex flex-col items-center justify-center p-8 overflow-hidden min-h-0">
        
        {/* EXPLANATORY TOAST */}
        <AnimatePresence>
            {isAnimating && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-4 lg:top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 bg-neutral-900/90 backdrop-blur-md border border-blue-500/30 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                >
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] lg:text-xs font-mono font-bold text-blue-200 tracking-wide whitespace-nowrap">{message}</span>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
                 backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)', 
                 backgroundSize: '40px 40px' 
             }}>
        </div>

        {/* PHANTOM NODE */}
        <AnimatePresence>
          {phantom && (
            <motion.div
              initial={{ opacity: 0, scale: 0, y: -150, x: -50 }}
              animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: -100, 
                  x: phantomPos.index === -1 ? -150 : (phantomPos.index * 120) - (nodes.length * 60)
              }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute z-50 flex flex-col items-center"
            >
                {/* NEW TAG */}
                <div className="mb-1 px-1.5 py-0.5 bg-green-500/20 border border-green-500 rounded text-[9px] font-bold text-green-400 uppercase tracking-widest">
                    NEW
                </div>
              <div className="w-20 h-14 bg-green-900/20 border-2 border-green-500 rounded-lg flex items-center justify-center font-bold text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.4)] backdrop-blur-sm relative">
                {phantom.value}
                <div className="absolute -right-3 w-6 h-6 bg-neutral-900 border border-green-500/50 rounded flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                </div>
              </div>
              <motion.div initial={{ height: 0 }} animate={{ height: 40 }} className="w-[2px] bg-gradient-to-b from-green-500 to-transparent mt-1" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN LIST */}
        <div className="flex items-center gap-10 z-10 px-10 relative max-w-full overflow-x-auto pb-20 pt-20 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {nodes.map((node, i) => {
              const isScannerHere = scannerIndex === i;
              const isHead = i === 0;

              return (
                <motion.div
                  layout
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.5, x: -50 }}
                  animate={{ 
                      opacity: 1, 
                      scale: node.isDeleting ? 0.9 : 1, 
                      x: 0,
                      filter: node.isDeleting ? 'grayscale(100%)' : 'none'
                  }}
                  exit={{ opacity: 0, scale: 0, y: 50, transition: { duration: 0.5 } }}
                  className="relative flex items-center group"
                >
                  {/* TAGS CONTAINER */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                      {isHead && (
                          <div className="px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500 rounded text-[8px] font-bold text-yellow-500 uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                              HEAD
                          </div>
                      )}
                      {node.isDeleting && (
                          <div className="px-1.5 py-0.5 bg-red-500/20 border border-red-500 rounded text-[8px] font-bold text-red-500 uppercase tracking-wider animate-pulse">
                              DELETE
                          </div>
                      )}
                  </div>

                  {/* Node Body */}
                  <div className={`
                     w-20 h-14 rounded-lg border-2 flex flex-col items-center justify-center relative z-20 transition-all duration-300
                     ${node.isNew 
                        ? 'bg-green-900/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                        : node.isDeleting
                            ? 'bg-red-900/20 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-shake'
                            : isScannerHere 
                                ? 'bg-blue-900/20 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110' 
                                : 'bg-neutral-900 border-neutral-700 text-neutral-300'}
                  `}>
                    <span className={`font-bold text-lg ${node.isDeleting ? 'text-red-500' : 'text-white'}`}>
                        {node.value}
                    </span>
                    <div className="absolute -bottom-6 text-[9px] text-neutral-500 font-mono">
                       idx:{i}
                    </div>
                    
                    <div className={`absolute -right-4 w-8 h-8 rounded border flex items-center justify-center z-30 bg-neutral-900
                        ${node.isDeleting ? 'border-red-500' : 'border-neutral-600'}
                    `}>
                        <div className={`w-1.5 h-1.5 rounded-full ${node.isDeleting ? 'bg-red-500' : 'bg-neutral-400'}`} />
                    </div>
                  </div>

                  {/* SCANNER PROBE */}
                  {isScannerHere && (
                      <motion.div layoutId="scanner" className="absolute -inset-4 border-2 border-blue-500 rounded-xl opacity-50 animate-ping pointer-events-none" />
                  )}
                  {isScannerHere && (
                      <motion.div 
                         initial={{ opacity: 0, y: -20 }}
                         animate={{ opacity: 1, y: -45 }}
                         className="absolute top-0 left-1/2 -translate-x-1/2 z-40"
                      >
                         <div className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded shadow-lg border border-blue-400">PTR</div>
                      </motion.div>
                  )}

                  {/* Connection Line */}
                  { i < nodes.length - 1 && (
                      <div className="w-10 h-[2px] bg-neutral-700 relative mx-2">
                          {node.isDeleting && (
                              <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: '100%' }} 
                                className="absolute inset-0 bg-red-500 z-20" 
                              />
                          )}
                          <div className="absolute right-0 -top-[3px] w-2 h-2 border-t-2 border-r-2 border-neutral-700 rotate-45" />
                      </div>
                  )}

                  {/* Doubly Back-Link */}
                  {isDoubly && i > 0 && !node.isDeleting && (
                      <div className="absolute -left-12 bottom-[-10px] w-10 h-[2px] bg-neutral-800">
                          <div className="absolute left-0 -top-[3px] w-2 h-2 border-b-2 border-l-2 border-neutral-800 rotate-45" />
                      </div>
                  )}

                  {/* NULL */}
                  {i === nodes.length - 1 && (
                      <div className="absolute -right-16 flex items-center gap-2 opacity-50">
                          <div className="w-8 h-[2px] bg-neutral-700" />
                          <div className="text-xs font-mono text-red-500">NULL</div>
                      </div>
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

export default LinkedListVisualizer;