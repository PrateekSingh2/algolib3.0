import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Binary, Plus, Search, Trash2, RotateCcw, 
  GitBranch, Zap, Layers, ArrowRight, Play, Pause, StepForward, 
  Terminal, Activity, Box, Target, Maximize2, Minimize2, Settings2
} from 'lucide-react';

// --- TYPES & GAME STATE ---
class TreeNode {
    value: number;
    left: TreeNode | null;
    right: TreeNode | null;
    xOffset: number; 
    y: number;
    height: number;
    id: string;

    constructor(val: number) {
        this.value = val;
        this.left = null;
        this.right = null;
        this.xOffset = 0; 
        this.y = 0;
        this.height = 1;
        this.id = Math.random().toString(36).substr(2, 9);
    }
}

type CodeLine = { id: string; text: string; explanation: string; active: boolean };
type VariableState = { name: string; value: string; color: string };
type TreeMode = 'bst' | 'avl';

// --- ADVANCED HINGLISH EXECUTION MATRIX ---
const SNIPPETS = {
  insert: [
    { id: '1', text: 'Node temp = new Node(val);', explanation: 'Spawn Zone mein naya node ready kiya.', active: false },
    { id: '2', text: 'if (root == null) root = temp;', explanation: 'Tree khali hai! Naya node hi ab hamara Root banega.', active: false },
    { id: '3', text: 'while(ptr != null)', explanation: 'Sahi jagah dhoondhne ke liye scanning shuru...', active: false },
    { id: '4', text: 'if (val < ptr.val) ptr = ptr.left;', explanation: 'Value chhoti hai -> LEFT branch ki taraf mudo!', active: false },
    { id: '5', text: 'else ptr = ptr.right;', explanation: 'Value badi hai -> RIGHT branch ki taraf mudo!', active: false },
    { id: '6', text: 'ptr.child = temp;', explanation: 'Khali jagah mil gayi! Naye node ko branch se attach kar diya.', active: false }
  ],
  search: [
    { id: '1', text: 'Node ptr = root;', explanation: 'Scanner ko Root node par drop kiya.', active: false },
    { id: '2', text: 'if (ptr.val == target) return true;', explanation: 'TARGET MIL GAYA! Mission Successful.', active: false },
    { id: '3', text: 'if (target < ptr.val) ptr = ptr.left;', explanation: 'Target chhota hai -> LEFT branch mein scan karo.', active: false },
    { id: '4', text: 'else ptr = ptr.right;', explanation: 'Target bada hai -> RIGHT branch mein scan karo.', active: false },
    { id: '5', text: 'return false;', explanation: 'Pura path check kar liya, par Target nahi mila (404 Not Found).', active: false }
  ],
  delete: [
    { id: '1', text: 'Node target = search(val);', explanation: 'Delete karne ke liye pehle target ko scan kar rahe hain...', active: false },
    { id: '2', text: 'if (target == null) return;', explanation: 'Target exist hi nahi karta!', active: false },
    { id: '3', text: 'rearrange_pointers(target);', explanation: 'Target mil gaya! Pointers ko bypass karke node ko free kar diya.', active: false }
  ]
};

const CyberGrid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-[#09090b]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,245,255,0.05),transparent_70%)]" />
  </div>
);

const BSTVisualizer = () => {
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [inputValue, setInputValue] = useState<number | ''>('');
  
  // Game HUD State
  const [showHUD, setShowHUD] = useState(true); 
  const [treeMode, setTreeMode] = useState<TreeMode>('bst');

  // Engine State
  const [isPaused, setIsPaused] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [message, setMessage] = useState('SYSTEM_IDLE: Ready for input');
  const [codeLines, setCodeLines] = useState<CodeLine[]>([]);
  const [variables, setVariables] = useState<VariableState[]>([]);
  
  // HUD & Animation Actors
  const [phantom, setPhantom] = useState<{val: number, id: string} | null>(null);
  const [highlightNode, setHighlightNode] = useState<string | null>(null);
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const [foundNode, setFoundNode] = useState<string | null>(null);
  
  // Dedicated Output Panel State
  const [outputLog, setOutputLog] = useState<string[]>([]);
  const [outputTitle, setOutputTitle] = useState<string>("OUTPUT_CONSOLE");

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
    setVariables(vars);

    if (isPaused) await new Promise<void>(r => stepTrigger.current = r);
    else await new Promise(r => setTimeout(r, 1200));
  };

  // --- MATH & AVL LOGIC ---
  const getHeight = (node: TreeNode | null) => node ? node.height : 0;
  const getBalance = (node: TreeNode | null) => node ? getHeight(node.left) - getHeight(node.right) : 0;
  const updateHeight = (node: TreeNode | null) => {
      if (node) node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));
  };

  const rightRotate = (y: TreeNode) => {
      let x = y.left!;
      let T2 = x.right;
      x.right = y;
      y.left = T2;
      updateHeight(y);
      updateHeight(x);
      return x;
  };

  const leftRotate = (x: TreeNode) => {
      let y = x.right!;
      let T2 = y.left;
      y.left = x;
      x.right = T2;
      updateHeight(x);
      updateHeight(y);
      return y;
  };

  const balanceTree = (node: TreeNode | null): TreeNode | null => {
      if (!node) return null;
      node.left = balanceTree(node.left);
      node.right = balanceTree(node.right);
      updateHeight(node);

      let balance = getBalance(node);

      // LL Case
      if (balance > 1 && getBalance(node.left) >= 0) return rightRotate(node);
      // LR Case
      if (balance > 1 && getBalance(node.left) < 0) {
          node.left = leftRotate(node.left!);
          return rightRotate(node);
      }
      // RR Case
      if (balance < -1 && getBalance(node.right) <= 0) return leftRotate(node);
      // RL Case
      if (balance < -1 && getBalance(node.right) > 0) {
          node.right = rightRotate(node.right!);
          return leftRotate(node);
      }
      return node;
  };

  const updatePositions = (node: TreeNode | null, xOffset: number, y: number, gap: number) => {
      if (!node) return;
      node.xOffset = xOffset;
      node.y = y;
      updatePositions(node.left, xOffset - gap, y + 100, gap * 0.55); 
      updatePositions(node.right, xOffset + gap, y + 100, gap * 0.55);
  };

  // --- OPERATIONS ---
  const checkDuplicate = (node: TreeNode | null, val: number): boolean => {
      if (!node) return false;
      if (node.value === val) return true;
      return val < node.value ? checkDuplicate(node.left, val) : checkDuplicate(node.right, val);
  };

  const handleInsert = async () => {
      if (inputValue === '' || isAnimating) return;
      const val = Number(inputValue);
      
      if (root && checkDuplicate(root, val)) {
          setMessage(`ERROR: Value ${val} pehle se exist karti hai!`);
          generateRandom(); return;
      }

      setIsAnimating(true);
      // REMOVED setShowHUD(true) - User controls the HUD entirely
      setOutputTitle("INSERTION_LOG");
      setOutputLog(prev => [...prev, `> Init insertion for [${val}]`]);
      const snippet = SNIPPETS.insert;

      setPhantom({ val, id: 'spawned' });
      await waitStep('1', snippet, [{ name: 'temp', value: `${val}`, color: '#00ff88' }]);

      let currentRoot = root;

      if (!currentRoot) {
          await waitStep('2', snippet);
          const newNode = new TreeNode(val);
          currentRoot = newNode;
          setPhantom(null);
          setOutputLog(prev => [...prev, `> [${val}] Set as ROOT`]);
      } else {
          let current: TreeNode | null = currentRoot;
          const newVisited = new Set<string>();

          await waitStep('3', snippet, [
              { name: 'ptr', value: `${current.value}`, color: '#00f5ff' },
              { name: 'val', value: `${val}`, color: '#00ff88' }
          ]);

          while (true) {
              setHighlightNode(current!.id);
              newVisited.add(current!.id);
              setVisitedNodes(new Set(newVisited));
              
              if (val < current!.value) {
                  await waitStep('4', snippet, [{ name: 'action', value: `GO LEFT`, color: '#facc15' }]);
                  if (!current!.left) {
                      await waitStep('6', snippet);
                      current!.left = new TreeNode(val);
                      setOutputLog(prev => [...prev, `> [${val}] Inserted LEFT of [${current!.value}]`]);
                      break;
                  }
                  current = current!.left;
              } else {
                  await waitStep('5', snippet, [{ name: 'action', value: `GO RIGHT`, color: '#facc15' }]);
                  if (!current!.right) {
                      await waitStep('6', snippet);
                      current!.right = new TreeNode(val);
                      setOutputLog(prev => [...prev, `> [${val}] Inserted RIGHT of [${current!.value}]`]);
                      break;
                  }
                  current = current!.right;
              }
          }
          setPhantom(null);
      }

      // Run Auto-Balance if AVL Mode is ON
      if (treeMode === 'avl') {
          setOutputLog(prev => [...prev, `> AVL: Checking Balance Factors...`]);
          currentRoot = balanceTree(currentRoot);
      } else {
          // Just update heights for standard BST
          const updateH = (n: TreeNode | null) => {
             if(!n) return 0;
             n.height = 1 + Math.max(updateH(n.left), updateH(n.right));
             return n.height;
          };
          updateH(currentRoot);
      }

      updatePositions(currentRoot, 0, 60, 260); // Wider initial gap for clean look
      setRoot(currentRoot ? { ...currentRoot } : null); 

      setHighlightNode(null); setVisitedNodes(new Set());
      setIsAnimating(false); setCodeLines([]); setVariables([]);
      setMessage("MISSION_PASSED: Node Inserted");
      generateRandom();
  };

  const handleDelete = async () => {
    if (inputValue === '' || !root || isAnimating) return;
    const val = Number(inputValue);
    setIsAnimating(true);
    setOutputTitle("DELETE_PROTOCOL");
    setOutputLog([`> Initiating strike on [${val}]`]);
    
    const snippet = SNIPPETS.delete;
    await waitStep('1', snippet);
    
    if (!checkDuplicate(root, val)) {
        await waitStep('2', snippet);
        setOutputLog(prev => [...prev, `> Abort: Target [${val}] missing.`]);
        setIsAnimating(false); setCodeLines([]); return;
    }

    await waitStep('3', snippet);
    const deleteNode = (node: TreeNode | null, v: number): TreeNode | null => {
        if (!node) return null;
        if (v < node.value) { node.left = deleteNode(node.left, v); return node; }
        else if (v > node.value) { node.right = deleteNode(node.right, v); return node; }
        else {
            if (!node.left && !node.right) return null;
            if (!node.left) return node.right;
            if (!node.right) return node.left;
            let temp = node.right;
            while (temp.left) temp = temp.left;
            node.value = temp.value;
            node.right = deleteNode(node.right, temp.value);
            return node;
        }
    };

    let newRoot = deleteNode(root, val);
    
    if (treeMode === 'avl') {
        newRoot = balanceTree(newRoot);
    } else {
        const updateH = (n: TreeNode | null) => {
             if(!n) return 0;
             n.height = 1 + Math.max(updateH(n.left), updateH(n.right));
             return n.height;
        };
        updateH(newRoot);
    }

    updatePositions(newRoot, 0, 60, 260);
    setRoot(newRoot ? { ...newRoot } : null);
    setOutputLog(prev => [...prev, `> SUCCESS: Target [${val}] eradicated.`]);
    setMessage('TARGET_ELIMINATED');
    setIsAnimating(false); setCodeLines([]); generateRandom();
  };

  // --- RENDERERS (CLEAN ACADEMIC DESIGN) ---
  const renderEdges = (node: TreeNode | null): JSX.Element[] => {
      if (!node) return [];
      const edges = [];
      if (node.left) {
          edges.push(
              <motion.line key={`${node.id}-left`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  x1={`calc(50% + ${node.xOffset}px)`} y1={node.y} 
                  x2={`calc(50% + ${node.left.xOffset}px)`} y2={node.left.y} 
                  stroke="#52525b" strokeWidth="3" // Thicker gray edges
              />
          );
          edges.push(...renderEdges(node.left));
      }
      if (node.right) {
          edges.push(
              <motion.line key={`${node.id}-right`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  x1={`calc(50% + ${node.xOffset}px)`} y1={node.y} 
                  x2={`calc(50% + ${node.right.xOffset}px)`} y2={node.right.y} 
                  stroke="#52525b" strokeWidth="3" 
              />
          );
          edges.push(...renderEdges(node.right));
      }
      return edges;
  };

  const renderNodes = (node: TreeNode | null): JSX.Element[] => {
      if (!node) return [];
      const isVisited = visitedNodes.has(node.id);
      const isActive = highlightNode === node.id;
      const isFound = foundNode === node.id;
      
      const bf = getBalance(node);
      const isUnbalanced = bf > 1 || bf < -1;
      const isLeaf = !node.left && !node.right;
      const isRoot = root && root.id === node.id;

      // Color Logic based on Screenshot rules
      let borderColor = '#0ea5e9'; // Default Blue/Cyan
      if (isUnbalanced) borderColor = '#ef4444'; // Red if unbalanced
      if (isFound) borderColor = '#22c55e'; // Green if found
      if (isActive) borderColor = '#facc15'; // Yellow if active scanner

      const nodes = [
          <motion.div key={node.id} initial={{ scale: 0 }}
              animate={{ scale: isActive ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`absolute w-16 h-16 -ml-8 -mt-8 rounded-full flex flex-col items-center justify-center border-4 shadow-xl z-20 bg-[#09090b]`}
              style={{ 
                  left: `calc(50% + ${node.xOffset}px)`, top: node.y,
                  borderColor: borderColor,
                  boxShadow: isActive ? '0 0 30px rgba(250,204,21,0.4)' : 'none'
              }}
          >
              {/* Top Height Indicator */}
              <span className="text-[9px] text-gray-400 font-mono absolute top-1">h: {node.height}</span>
              
              {/* Main Value */}
              <span className="font-black text-xl text-white mt-1">{node.value}</span>

              {/* Bottom Balance Factor Indicator */}
              <div className="absolute -bottom-6 flex flex-col items-center whitespace-nowrap">
                  <span className={`text-[10px] font-black font-mono ${isUnbalanced ? 'text-red-500' : 'text-gray-400'}`}>
                      BF: {bf}
                  </span>
                  {/* Leaf Indicator */}
                  {isLeaf && <span className="text-[9px] font-black text-emerald-400 mt-0.5">LEAF</span>}
              </div>

              {/* Root Indicator */}
              {isRoot && <div className="absolute -top-6 text-[11px] font-black text-cyan-500">ROOT</div>}

              {/* Scanner HUD */}
              {isActive && (
                  <div className="absolute -left-12 top-4 bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[8px] font-black shadow-lg">SCAN</div>
              )}
          </motion.div>
      ];
      nodes.push(...renderNodes(node.left));
      nodes.push(...renderNodes(node.right));
      return nodes;
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#09090b] font-sans text-white overflow-hidden">
      <CyberGrid />
      
      <div className="flex-1 flex relative z-10 overflow-hidden h-full">
        
        {/* LEFT: COMMAND CENTER */}
        <div className="w-[340px] bg-black/80 backdrop-blur-md border-r border-white/10 flex flex-col h-full shadow-2xl shrink-0 z-20">
          
          <div className="p-5 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-transparent shrink-0">
             <h2 className="text-xl font-black tracking-tight flex items-center gap-2 text-cyan-400">
                <Binary size={24} /> BST Engine
             </h2>
             <p className="text-xs text-gray-400 mt-1">v4.0 Academic Visualizer</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar pb-4 flex flex-col">
            
            {/* AVL Auto Balance Toggle */}
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between shrink-0">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Settings2 size={12}/> Mode</span>
                    <span className={`text-xs font-black ${treeMode === 'avl' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {treeMode === 'avl' ? 'AVL (Auto-Balance)' : 'Standard BST'}
                    </span>
                </div>
                <button 
                    onClick={() => { setTreeMode(treeMode === 'bst' ? 'avl' : 'bst'); setRoot(null); }}
                    disabled={isAnimating}
                    className="px-3 py-1.5 bg-black/50 border border-white/20 rounded hover:border-white/50 text-[9px] font-black uppercase transition-all disabled:opacity-30"
                >
                    Switch
                </button>
            </div>

            {/* Playback Controls */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Step Engine</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${isPaused ? 'border-amber-500 text-amber-500' : 'border-cyan-500 text-cyan-500'}`}>
                    {isPaused ? 'MANUAL' : 'AUTO'}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsPaused(!isPaused)} className="flex-1 py-2 bg-black/50 border border-white/10 rounded flex items-center justify-center gap-2 text-xs font-bold hover:bg-white/5 transition-all">
                  {isPaused ? <Play size={14}/> : <Pause size={14}/>} {isPaused ? 'PLAY' : 'PAUSE'}
                </button>
                <button disabled={!isPaused || !isAnimating} onClick={resolveStep} className="flex-1 py-2 bg-cyan-500 text-black rounded flex items-center justify-center gap-2 text-xs font-black hover:bg-cyan-400 disabled:opacity-30 disabled:grayscale transition-all">
                  <StepForward size={14} /> NEXT STEP
                </button>
              </div>
            </div>

            {/* Core Controls */}
            <div className="space-y-4 shrink-0">
               <div className="flex gap-2">
                  <div className="flex-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Node Payload</label>
                      <div className="flex gap-1 mt-1">
                          <input type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-cyan-400 outline-none font-mono text-sm" />
                          <button onClick={generateRandom} className="px-3 bg-white/5 rounded border border-white/10 hover:bg-white/10"><RotateCcw size={14}/></button>
                      </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={handleInsert} disabled={isAnimating} className="p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded hover:bg-cyan-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                     <Plus size={16}/> INSERT
                  </button>
                  <button onClick={() => {}} disabled={isAnimating} className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                     <Trash2 size={16}/> DELETE
                  </button>
               </div>
            </div>

            <button onClick={() => { setRoot(null); setOutputLog([]); }} disabled={isAnimating} className="w-full py-2 shrink-0 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/5 hover:border-red-500/30 rounded text-[10px] font-bold text-gray-500 transition-all flex items-center justify-center gap-2">
                  <Trash2 size={14}/> FORMAT TREE
            </button>

            {/* DEDICATED OUTPUT SCREEN */}
            <div className="mt-4 flex-1 min-h-[150px] bg-black/90 border border-cyan-500/30 rounded-xl flex flex-col overflow-hidden shadow-inner shrink-0">
                <div className="px-3 py-2 border-b border-cyan-500/30 bg-cyan-900/20 flex items-center gap-2 shrink-0">
                    <Terminal size={12} className="text-cyan-400" />
                    <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">{outputTitle}</span>
                </div>
                <div className="p-3 overflow-y-auto custom-scrollbar flex-1 font-mono text-[11px] text-gray-300 flex flex-col gap-1">
                    {outputLog.length === 0 ? (
                        <span className="text-gray-600 italic mt-1">Awaiting execution...</span>
                    ) : (
                        outputLog.map((log, i) => (
                           <div key={i} className={`flex items-start ${log.includes('SUCCESS') || log.includes('AVL') ? 'text-emerald-400 font-bold' : log.includes('FAILED') || log.includes('Abort') ? 'text-red-400' : 'text-gray-400'}`}>
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
          
          {/* THE HUD TOGGLE BUTTON */}
          <button 
             onClick={() => setShowHUD(!showHUD)}
             className="absolute top-6 left-6 z-50 p-2 bg-black/90 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2"
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
                     className="flex gap-6 w-full shrink-0 ml-32" 
                  >
                     <div className="flex-1 shrink-0 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col shadow-2xl overflow-hidden relative">
                         <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                            <div className="flex items-center gap-2 text-cyan-400">
                                <Terminal size={14}/>
                                <span className="text-[10px] font-black tracking-widest uppercase">Hinglish_Trace</span>
                            </div>
                         </div>
                         <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                            {codeLines.length ? codeLines.map(line => (
                               <div key={line.id} className={`flex flex-col text-sm transition-all ${line.active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
                                  <div className={`font-mono ${line.active ? 'text-cyan-400' : 'text-gray-400'}`}>{line.text}</div>
                                  {line.active && <div className="text-xs text-amber-400 mt-1 flex items-center gap-2 leading-relaxed"><ArrowRight size={12} className="shrink-0"/> {line.explanation}</div>}
                               </div>
                            )) : <div className="text-gray-600 text-xs italic flex items-center justify-center h-full gap-2"><Activity size={14}/> Awaiting BST operation...</div>}
                            <div ref={interpreterEndRef} />
                         </div>
                     </div>

                     <div className="w-[300px] shrink-0 border border-cyan-500/30 bg-cyan-900/10 rounded-xl relative flex flex-col items-center justify-center shadow-inner overflow-hidden">
                        <div className="absolute top-3 right-4 flex items-center gap-2 text-[10px] font-mono text-cyan-500 uppercase tracking-widest">
                            <Box size={14} /> Spawn_Zone
                        </div>
                        <AnimatePresence>
                           {phantom && (
                              <motion.div
                                initial={{ scale: 0, y: -20, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.5, y: 50 }}
                                className="w-16 h-16 rounded-full border-4 border-dashed border-cyan-400 flex items-center justify-center bg-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.4)] z-50 relative mt-4"
                              >
                                 <span className="text-2xl font-black text-white">{phantom.val}</span>
                              </motion.div>
                           )}
                        </AnimatePresence>
                        {!phantom && (
                            <div className="text-cyan-500/30 font-mono text-xs flex items-center gap-2 mt-4">
                                <Zap size={14} /> Memory Ready
                            </div>
                        )}
                     </div>
                  </motion.div>
              )}
          </AnimatePresence>

          {/* Central Arena: The Infinite Tree Canvas */}
          <div className="flex-1 border border-white/5 bg-black/30 rounded-2xl relative flex flex-col shadow-inner overflow-hidden mt-2">
             <div className="flex-1 overflow-auto custom-scrollbar relative">
                 <div className="absolute min-w-[2400px] min-h-[1200px] w-full h-full p-10 pt-16">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {renderEdges(root)}
                    </svg>
                    <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        <AnimatePresence>
                            {renderNodes(root)}
                        </AnimatePresence>
                    </div>

                    {!root && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 font-mono opacity-50 pointer-events-none">
                            <Binary size={48} className="mb-4 text-gray-700" />
                            <p className="text-sm">[ TREE_EMPTY :: AWAITING_ROOT ]</p>
                        </div>
                    )}
                 </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BSTVisualizer;