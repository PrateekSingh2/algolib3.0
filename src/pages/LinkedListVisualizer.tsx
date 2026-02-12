import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw, ArrowRight, Code2, ChevronRight } from 'lucide-react';

// --- TYPES ---
type ListType = 'singly' | 'doubly' | 'circular-singly' | 'circular-doubly';
type NodeData = { id: string; value: number; isNew?: boolean; highlight?: boolean };
type CodeLine = { id: string; text: string; active: boolean };

// --- CODE SNIPPETS ---
const SNIPPETS = {
  head: [
    { id: '1', text: 'Node newNode = new Node(val);', active: false },
    { id: '2', text: 'newNode.next = head;', active: false },
    { id: '3', text: 'head = newNode;', active: false },
  ],
  index: [
    { id: '1', text: 'Node newNode = new Node(val);', active: false },
    { id: '2', text: 'for(int i=0; i<index-1; i++) ptr=ptr.next;', active: false },
    { id: '3', text: 'newNode.next = ptr.next;', active: false },
    { id: '4', text: 'ptr.next = newNode;', active: false },
  ]
};

const LinkedListVisualizer = () => {
  // --- STATE ---
  const [listType, setListType] = useState<ListType>('singly');
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: '1', value: 10 }, 
    { id: '2', value: 20 }, 
    { id: '3', value: 30 }
  ]);
  
  // Animation State
  const [phantom, setPhantom] = useState<NodeData | null>(null);
  const [phantomPos, setPhantomPos] = useState({ x: 0, idx: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [codeLines, setCodeLines] = useState<CodeLine[]>(SNIPPETS.head);

  // Inputs
  const [inputValue, setInputValue] = useState(45);
  const [inputIndex, setInputIndex] = useState(1);

  const isDoubly = listType.includes('doubly');
  const isCircular = listType.includes('circular');

  // --- ACTIONS ---
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const highlightCode = (lineId: string, snippet: CodeLine[]) => {
    setCodeLines(snippet.map(line => ({ ...line, active: line.id === lineId })));
  };

  const insertHead = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const currentSnippet = SNIPPETS.head;
    setCodeLines(currentSnippet);

    const newNode = { id: Math.random().toString(), value: inputValue, isNew: true };
    
    // Step 1: Create (Floating)
    highlightCode('1', currentSnippet);
    setPhantom(newNode);
    setPhantomPos({ x: 0, idx: 0 });
    await sleep(800);

    // Step 2: Point (Visual only)
    highlightCode('2', currentSnippet);
    await sleep(800);

    // Step 3: Insert
    highlightCode('3', currentSnippet);
    setPhantom(null);
    setNodes([newNode, ...nodes]);
    
    // Cleanup
    await sleep(800);
    setNodes(prev => prev.map(n => ({ ...n, isNew: false })));
    highlightCode('', currentSnippet);
    setIsAnimating(false);
  };

  const insertAtIndex = async () => {
    if (isAnimating) return;
    // Validation
    const safeIndex = Math.max(0, Math.min(inputIndex, nodes.length));
    if (safeIndex === 0) return insertHead();

    setIsAnimating(true);
    const currentSnippet = SNIPPETS.index;
    setCodeLines(currentSnippet);

    const newNode = { id: Math.random().toString(), value: inputValue, isNew: true };

    // Step 1: Create (Floating at approx position)
    // 100px is roughly node width (80px) + gap (20px)
    highlightCode('1', currentSnippet);
    setPhantom(newNode);
    setPhantomPos({ x: safeIndex * 100, idx: safeIndex }); 
    await sleep(800);

    // Step 2: Traverse
    highlightCode('2', currentSnippet);
    for (let i = 0; i < safeIndex; i++) {
        setNodes(prev => prev.map((n, idx) => ({ ...n, highlight: idx === i })));
        await sleep(500);
    }
    
    // Step 3: Link
    highlightCode('3', currentSnippet);
    await sleep(800);

    // Step 4: Insert
    highlightCode('4', currentSnippet);
    setPhantom(null);
    const newArr = [...nodes];
    newArr.splice(safeIndex, 0, newNode);
    setNodes(newArr);

    // Cleanup
    await sleep(800);
    setNodes(prev => prev.map(n => ({ ...n, highlight: false, isNew: false })));
    highlightCode('', currentSnippet);
    setIsAnimating(false);
  };

  const reset = () => {
    setNodes([{ id: '1', value: 10 }, { id: '2', value: 20 }]);
    setPhantom(null);
    setIsAnimating(false);
    highlightCode('', SNIPPETS.head);
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-neutral-950 overflow-hidden">
      
      {/* --- SIDEBAR CONTROLS --- */}
      <div className="w-full lg:w-80 bg-neutral-900 border-r border-white/10 flex flex-col p-6 gap-6 z-20 shadow-2xl overflow-y-auto">
        
        {/* Type Selector */}
        <div>
            <label className="text-[10px] font-mono text-neutral-500 uppercase mb-2 block">Data Structure Type</label>
            <div className="flex flex-wrap gap-2">
            {(['singly', 'doubly', 'circular-singly', 'circular-doubly'] as ListType[]).map(type => (
                <button
                key={type}
                onClick={() => { setListType(type); reset(); }}
                className={`flex-1 min-w-[45%] px-2 py-2 rounded text-[10px] font-bold uppercase transition-all border ${
                    listType === type 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500'
                }`}
                >
                {type.replace('-', ' ')}
                </button>
            ))}
            </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4 p-4 rounded-xl bg-black/20 border border-white/5">
            <div>
                <label className="text-xs font-mono text-neutral-400">Value</label>
                <input 
                    type="number" 
                    value={inputValue}
                    onChange={(e) => setInputValue(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 bg-neutral-800 border border-neutral-700 rounded p-2 text-sm focus:border-cyan-500 outline-none transition-colors"
                />
            </div>
            <div>
                <label className="text-xs font-mono text-neutral-400">Index (0-{nodes.length})</label>
                <div className="flex items-center mt-1">
                    <input 
                        type="number" 
                        value={inputIndex}
                        onChange={(e) => setInputIndex(parseInt(e.target.value) || 0)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-l p-2 text-sm focus:border-cyan-500 outline-none transition-colors"
                    />
                    <div className="flex flex-col">
                        <button onClick={() => setInputIndex(p => Math.min(p + 1, nodes.length))} className="px-2 bg-neutral-700 hover:bg-neutral-600 rounded-tr border-b border-neutral-600 text-[8px] h-1/2">▲</button>
                        <button onClick={() => setInputIndex(p => Math.max(0, p - 1))} className="px-2 bg-neutral-700 hover:bg-neutral-600 rounded-br text-[8px] h-1/2">▼</button>
                    </div>
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
            <button 
                onClick={insertHead} 
                disabled={isAnimating}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-sm shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all"
            >
                <Plus size={16} /> Insert at Head
            </button>
            <button 
                onClick={insertAtIndex} 
                disabled={isAnimating}
                className="w-full py-3 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
                <ArrowRight size={16} /> Insert at Index
            </button>
            <button 
                onClick={reset} 
                disabled={isAnimating}
                className="w-full py-3 bg-red-900/20 text-red-400 border border-red-900/30 hover:bg-red-900/30 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
                <RotateCcw size={16} /> Reset
            </button>
        </div>

        {/* Code Snippet */}
        <div className="flex-1 bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-[10px] overflow-hidden relative min-h-[150px]">
            <div className="absolute top-2 right-2 text-neutral-600">
                <Code2 size={14} />
            </div>
            <div className="space-y-1 mt-1">
                {codeLines.map((line) => (
                    <div 
                        key={line.id} 
                        className={`p-1 rounded transition-all duration-300 ${
                            line.active 
                                ? 'bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400 pl-2' 
                                : 'text-neutral-500 pl-2'
                        }`}
                    >
                        {line.text}
                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* --- CANVAS --- */}
      <div className="flex-1 relative bg-neutral-950 flex flex-col items-center justify-center p-8 overflow-hidden">
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>

        {/* PHANTOM NODE (The "Inserting" Node) */}
        <AnimatePresence>
          {phantom && (
            <motion.div
              initial={{ opacity: 0, y: -80, x: -50 }}
              animate={{ opacity: 1, y: -80, x: phantomPos.x - (nodes.length * 40) + 40 }} // Rough centering math
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="absolute z-30 flex flex-col items-center"
            >
              <div className="w-16 h-12 border-2 border-green-500 bg-green-500/20 rounded-lg flex items-center justify-center font-bold text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                {phantom.value}
              </div>
              <div className="text-[10px] text-green-500 mt-1 font-mono">New Node</div>
              {/* Pointer Arrow */}
              <div className="absolute top-full left-1/2 w-[2px] h-8 bg-green-500/50 -translate-x-1/2">
                <div className="absolute bottom-0 -left-[3px] w-2 h-2 border-b-2 border-r-2 border-green-500 rotate-45" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* THE MAIN LIST */}
        <div className="flex items-center gap-1 z-10 px-4 max-w-full overflow-x-auto">
          <AnimatePresence mode="popLayout">
            {nodes.map((node, i) => (
              <motion.div
                layout
                key={node.id}
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    x: 0,
                    filter: node.highlight ? 'brightness(1.2)' : 'none'
                }}
                className="relative group flex items-center"
              >
                {/* Node Body */}
                <div className={`
                   w-20 h-14 rounded-lg border-2 flex flex-col items-center justify-center bg-neutral-900 relative z-10 transition-colors duration-300
                   ${node.isNew ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 
                     node.highlight ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 
                     'border-blue-500/30 text-blue-100'}
                `}>
                  <span className="font-bold">{node.value}</span>
                  <span className="text-[9px] text-neutral-500 font-mono mt-1">
                    {i === 0 ? 'HEAD' : i}
                  </span>
                </div>

                {/* Pointers */}
                { (isCircular || i < nodes.length - 1) && (
                    <div className="w-10 h-[2px] bg-neutral-600 relative mx-1 transition-colors duration-300">
                        {/* Highlight Traversal Path */}
                        <div className={`absolute inset-0 bg-yellow-500 transition-all duration-300 ${node.highlight ? 'w-full' : 'w-0'}`} />
                        
                        <div className="absolute right-0 -top-[3px] w-2 h-2 border-t-2 border-r-2 border-neutral-600 rotate-45" />
                        
                        {isDoubly && (
                            <div className="absolute bottom-[-6px] left-0 w-full h-[2px] bg-pink-600/50">
                                <div className="absolute left-0 -top-[3px] w-2 h-2 border-b-2 border-l-2 border-pink-600/50 rotate-45" />
                            </div>
                        )}
                    </div>
                )}
                
                {/* NULL Indicator */}
                {!isCircular && i === nodes.length - 1 && (
                    <div className="ml-2 text-[10px] text-red-500 font-mono opacity-50">NULL</div>
                )}

              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Circular Loop Overlay */}
        {isCircular && nodes.length > 0 && (
           <div className="absolute bottom-10 left-10 right-10 h-16 border-b-2 border-l-2 border-r-2 border-dashed border-neutral-700 rounded-b-3xl opacity-30 pointer-events-none flex items-end justify-center pb-2">
             <span className="text-[9px] text-neutral-500">Loop to Head</span>
           </div>
        )}

      </div>
    </div>
  );
};

export default LinkedListVisualizer;