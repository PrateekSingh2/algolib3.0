import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Binary, Plus, Search, Trash2, RotateCcw, 
  GitBranch, Zap, Layers, ArrowRight, Play, Pause, StepForward, StepBack,
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

type VisualFrame = {
  root: TreeNode | null;
  phantom: {val: number, id: string} | null;
  highlightNode: string | null;
  visitedNodes: Set<string>;
  foundNode: string | null;
  codeLines: CodeLine[];
  variables: VariableState[];
  message: string;
  outputLog: string[];
  outputTitle: string;
};

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
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.05),transparent_70%)]" />
  </div>
);

// Helper for deep cloning Tree structure to preserve visual state frames
const cloneTree = (node: TreeNode | null): TreeNode | null => {
    if (!node) return null;
    const newNode = new TreeNode(node.value);
    newNode.id = node.id;
    newNode.height = node.height;
    newNode.xOffset = node.xOffset;
    newNode.y = node.y;
    newNode.left = cloneTree(node.left);
    newNode.right = cloneTree(node.right);
    return newNode;
};

const BSTVisualizer = () => {
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [inputValue, setInputValue] = useState<number | ''>('');
  
  // Game HUD State
  const [showHUD, setShowHUD] = useState(false); 
  const [treeMode, setTreeMode] = useState<TreeMode>('bst');

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
  const [phantom, setPhantom] = useState<{val: number, id: string} | null>(null);
  const [highlightNode, setHighlightNode] = useState<string | null>(null);
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const [foundNode, setFoundNode] = useState<string | null>(null);
  const [outputLog, setOutputLog] = useState<string[]>([]);
  const [outputTitle, setOutputTitle] = useState<string>("OUTPUT_CONSOLE");

  const interpreterScrollRef = useRef<HTMLDivElement>(null);
  const outputScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { generateRandom(); }, []);
  
  // Scoped interior scrolling to prevent mobile layout jumps
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

  // Sync visual components to the active frame
  useEffect(() => {
    if (frames.length > 0 && frameIdx >= 0 && frameIdx < frames.length) {
        const f = frames[frameIdx];
        setRoot(f.root);
        setPhantom(f.phantom);
        setHighlightNode(f.highlightNode);
        setVisitedNodes(f.visitedNodes);
        setFoundNode(f.foundNode);
        setCodeLines(f.codeLines);
        setVariables(f.variables);
        setMessage(f.message);
        setOutputLog(f.outputLog);
        setOutputTitle(f.outputTitle);
        
        // Final frame cleanup timeout
        if (frameIdx === frames.length - 1) {
            const tm = setTimeout(() => {
                setHighlightNode(null);
                setVisitedNodes(new Set());
                setFoundNode(null);
                setIsAnimating(false);
                setFrames([]);
                setCodeLines([]);
                setVariables([]);
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

  // Center the workspace horizontally on initial load
  const centerWorkspace = () => {
    if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
        container.scrollTop = 0;
    }
  };

  useEffect(() => {
    centerWorkspace();
    const timeout = setTimeout(centerWorkspace, 150);
    return () => clearTimeout(timeout);
  }, []);

  // Auto-scroll camera to follow the active scanning node
  useEffect(() => {
    if (highlightNode && root && scrollContainerRef.current) {
        const findNode = (n: TreeNode | null, targetId: string): TreeNode | null => {
            if (!n) return null;
            if (n.id === targetId) return n;
            return findNode(n.left, targetId) || findNode(n.right, targetId);
        };
        const active = findNode(root, highlightNode);
        if (active) {
            const container = scrollContainerRef.current;
            const absoluteX = (container.scrollWidth / 2) + active.xOffset;
            const absoluteY = active.y;

            container.scrollTo({
                left: absoluteX - container.clientWidth / 2,
                top: Math.max(0, absoluteY - container.clientHeight / 3),
                behavior: 'smooth'
            });
        }
    }
  }, [highlightNode, root]);

  const generateRandom = () => setInputValue(Math.floor(Math.random() * 99) + 1);

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

      if (balance > 1 && getBalance(node.left) >= 0) return rightRotate(node);
      if (balance > 1 && getBalance(node.left) < 0) {
          node.left = leftRotate(node.left!);
          return rightRotate(node);
      }
      if (balance < -1 && getBalance(node.right) <= 0) return leftRotate(node);
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

  const checkDuplicate = (node: TreeNode | null, val: number): boolean => {
      if (!node) return false;
      if (node.value === val) return true;
      return val < node.value ? checkDuplicate(node.left, val) : checkDuplicate(node.right, val);
  };

  // --- OPERATIONS ---
  const handleInsert = () => {
      if (inputValue === '' || isAnimating) return;
      const val = Number(inputValue);
      
      if (root && checkDuplicate(root, val)) {
          setMessage(`ERROR: Value ${val} pehle se exist karti hai!`);
          generateRandom(); return;
      }

      setIsAnimating(true);
      if (!showHUD) setShowHUD(true); 
      
      if (root && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ left: (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth) / 2, top: 0, behavior: 'smooth' });
      }

      const title = "INSERTION_LOG";
      let currentLog = [...outputLog, `> Init insertion for [${val}]`];
      let newFrames: VisualFrame[] = [];
      const snippet = SNIPPETS.insert;

      let currentRoot = root ? cloneTree(root) : null;
      let currentPhantom: {val: number, id: string} | null = { val, id: 'spawned' };
      let currentVisited = new Set<string>();

      const addFrame = (lineId: string, vars: VariableState[], high: string | null = null) => {
          const currentLine = snippet.find(l => l.id === lineId);
          newFrames.push({
              root: cloneTree(currentRoot),
              phantom: currentPhantom ? { ...currentPhantom } : null,
              highlightNode: high,
              visitedNodes: new Set(currentVisited),
              foundNode: null,
              codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })),
              variables: vars.map(v => ({...v})),
              message: currentLine ? currentLine.explanation : 'Processing...',
              outputLog: [...currentLog],
              outputTitle: title
          });
      };

      addFrame('1', [{ name: 'temp', value: `${val}`, color: '#00ff88' }]);

      if (!currentRoot) {
          addFrame('2', [{ name: 'temp', value: `${val}`, color: '#00ff88' }]);
          const newNode = new TreeNode(val);
          currentRoot = newNode;
          updatePositions(currentRoot, 0, 60, 260);
          currentPhantom = null;
          currentLog.push(`> [${val}] Set as ROOT`);
      } else {
          let current: TreeNode | null = currentRoot;
          addFrame('3', [
              { name: 'ptr', value: `${current!.value}`, color: '#00f5ff' },
              { name: 'val', value: `${val}`, color: '#00ff88' }
          ]);

          while (true) {
              let high = current!.id;
              currentVisited.add(current!.id);

              if (val < current!.value) {
                  addFrame('4', [{ name: 'action', value: `GO LEFT`, color: '#facc15' }], high);
                  if (!current!.left) {
                      addFrame('6', [{ name: 'action', value: `GO LEFT`, color: '#facc15' }], high);
                      current!.left = new TreeNode(val);
                      currentLog.push(`> [${val}] Inserted LEFT of [${current!.value}]`);
                      break;
                  }
                  current = current!.left;
              } else {
                  addFrame('5', [{ name: 'action', value: `GO RIGHT`, color: '#facc15' }], high);
                  if (!current!.right) {
                      addFrame('6', [{ name: 'action', value: `GO RIGHT`, color: '#facc15' }], high);
                      current!.right = new TreeNode(val);
                      currentLog.push(`> [${val}] Inserted RIGHT of [${current!.value}]`);
                      break;
                  }
                  current = current!.right;
              }
          }
          currentPhantom = null;
      }

      // Compute Final Position and Balance Tree
      if (treeMode === 'avl') {
          currentLog.push(`> AVL: Checking Balance Factors...`);
          currentRoot = balanceTree(currentRoot);
      } else {
          const updateH = (n: TreeNode | null) => {
             if(!n) return 0;
             n.height = 1 + Math.max(updateH(n.left), updateH(n.right));
             return n.height;
          };
          updateH(currentRoot);
      }
      updatePositions(currentRoot, 0, 60, 260); 

      // Push final resolution frame
      newFrames.push({
          root: cloneTree(currentRoot),
          phantom: null,
          highlightNode: null,
          visitedNodes: new Set(),
          foundNode: null,
          codeLines: [],
          variables: [],
          message: "MISSION_PASSED: Node Inserted",
          outputLog: [...currentLog],
          outputTitle: title
      });

      setFrames(newFrames);
      setFrameIdx(0);
  };

  const handleDelete = () => {
    if (inputValue === '' || !root || isAnimating) return;
    const val = Number(inputValue);
    setIsAnimating(true);
    if (!showHUD) setShowHUD(true); 
    
    if (root && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth) / 2, top: 0, behavior: 'smooth' });
    }

    const title = "DELETE_PROTOCOL";
    let currentLog = [...outputLog, `> Initiating strike on [${val}]`];
    let newFrames: VisualFrame[] = [];
    const snippet = SNIPPETS.delete;
    let currentRoot = cloneTree(root);

    const addFrame = (lineId: string) => {
        const currentLine = snippet.find(l => l.id === lineId);
        newFrames.push({
            root: cloneTree(currentRoot),
            phantom: null,
            highlightNode: null,
            visitedNodes: new Set(),
            foundNode: null,
            codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })),
            variables: [],
            message: currentLine ? currentLine.explanation : 'Processing...',
            outputLog: [...currentLog],
            outputTitle: title
        });
    };

    addFrame('1');
    
    if (!checkDuplicate(currentRoot, val)) {
        currentLog.push(`> Abort: Target [${val}] missing.`);
        addFrame('2');
        
        newFrames.push({
            root: cloneTree(currentRoot),
            phantom: null,
            highlightNode: null,
            visitedNodes: new Set(),
            foundNode: null,
            codeLines: [],
            variables: [],
            message: "ABORTED: Node not found",
            outputLog: [...currentLog],
            outputTitle: title
        });
        setFrames(newFrames);
        setFrameIdx(0);
        return;
    }

    addFrame('3');

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

    currentRoot = deleteNode(currentRoot, val);
    
    if (treeMode === 'avl') {
        currentRoot = balanceTree(currentRoot);
    } else {
        const updateH = (n: TreeNode | null) => {
             if(!n) return 0;
             n.height = 1 + Math.max(updateH(n.left), updateH(n.right));
             return n.height;
        };
        updateH(currentRoot);
    }

    updatePositions(currentRoot, 0, 60, 260);
    currentLog.push(`> SUCCESS: Target [${val}] eradicated.`);

    newFrames.push({
        root: cloneTree(currentRoot),
        phantom: null,
        highlightNode: null,
        visitedNodes: new Set(),
        foundNode: null,
        codeLines: [],
        variables: [],
        message: "TARGET_ELIMINATED",
        outputLog: [...currentLog],
        outputTitle: title
    });

    setFrames(newFrames);
    setFrameIdx(0);
  };

  const renderEdges = (node: TreeNode | null): JSX.Element[] => {
      if (!node) return [];
      const edges = [];
      if (node.left) {
          edges.push(
              <motion.line key={`${node.id}-left`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  x1={`calc(50% + ${node.xOffset}px)`} y1={node.y} 
                  x2={`calc(50% + ${node.left.xOffset}px)`} y2={node.left.y} 
                  stroke="#52525b" strokeWidth="3" 
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

      let borderColor = '#0ea5e9'; 
      if (isUnbalanced) borderColor = '#ef4444'; 
      if (isFound) borderColor = '#22c55e'; 
      if (isActive) borderColor = '#facc15'; 

      const nodes = [
          <motion.div key={node.id} initial={{ scale: 0 }}
              animate={{ scale: isActive ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`absolute w-12 h-12 lg:w-16 lg:h-16 -ml-6 -mt-6 lg:-ml-8 lg:-mt-8 rounded-full flex flex-col items-center justify-center border-4 shadow-xl z-20 bg-[#09090b]`}
              style={{ 
                  left: `calc(50% + ${node.xOffset}px)`, top: node.y,
                  borderColor: borderColor,
                  boxShadow: isActive ? '0 0 30px rgba(250,204,21,0.4)' : 'none'
              }}
          >
              <span className="text-[7px] lg:text-[9px] text-gray-400 font-mono absolute top-1">h: {node.height}</span>
              <span className="font-black text-lg lg:text-xl text-white mt-1">{node.value}</span>

              <div className="absolute -bottom-5 lg:-bottom-6 flex flex-col items-center whitespace-nowrap">
                  <span className={`text-[8px] lg:text-[10px] font-black font-mono ${isUnbalanced ? 'text-red-500' : 'text-gray-400'}`}>
                      BF: {bf}
                  </span>
                  {isLeaf && <span className="text-[7px] lg:text-[9px] font-black text-emerald-400 mt-0.5">LEAF</span>}
              </div>
              {isRoot && <div className="absolute -top-5 lg:-top-6 text-[9px] lg:text-[11px] font-black text-cyan-500">ROOT</div>}
              {isActive && (
                  <div className="absolute -left-10 lg:-left-12 top-4 bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[7px] lg:text-[8px] font-black shadow-lg">SCAN</div>
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
      
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden min-h-0">
        
        {/* LEFT: COMMAND CENTER */}
        <div className="w-full lg:w-[340px] bg-black/95 lg:bg-black/80 backdrop-blur-md border-white/10 flex flex-col h-[38%] lg:h-full shadow-2xl shrink-0 z-20 overflow-hidden order-1 lg:border-r">
          
          <div className="overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar pb-6 flex-1 lg:max-h-none pt-4 lg:pt-6 flex flex-col">
            
            {/* AVL Auto Balance Toggle */}
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between shrink-0">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Settings2 size={12}/> Mode</span>
                    <span className={`text-xs font-black ${treeMode === 'avl' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {treeMode === 'avl' ? 'AVL (Auto-Balance)' : 'Standard BST'}
                    </span>
                </div>
                <button 
                    onClick={() => { setTreeMode(treeMode === 'bst' ? 'avl' : 'bst'); setRoot(null); setTimeout(centerWorkspace, 100); }}
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
                  <button onClick={handleDelete} disabled={isAnimating} className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                     <Trash2 size={16}/> DELETE
                  </button>
               </div>
            </div>

            <button onClick={() => { setRoot(null); setOutputLog([]); setTimeout(centerWorkspace, 50); }} disabled={isAnimating} className="w-full py-2 shrink-0 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/5 hover:border-red-500/30 rounded text-[10px] font-bold text-gray-500 transition-all flex items-center justify-center gap-2">
                  <Trash2 size={14}/> FORMAT TREE
            </button>

            {/* DEDICATED OUTPUT SCREEN */}
            <div className="mt-4 flex-1 min-h-[120px] lg:min-h-[150px] bg-black/90 border border-cyan-500/30 rounded-xl flex flex-col overflow-hidden shadow-inner shrink-0">
                <div className="px-3 py-2 border-b border-cyan-500/30 bg-cyan-900/20 flex items-center gap-2 shrink-0">
                    <Terminal size={12} className="text-cyan-400" />
                    <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">{outputTitle}</span>
                </div>
                <div ref={outputScrollRef} className="p-3 overflow-y-auto custom-scrollbar flex-1 font-mono text-[11px] text-gray-300 flex flex-col gap-1">
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
                </div>
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

          {/* Central Arena: The Infinite Tree Canvas (Scrollable & Tracked) */}
          <div className="flex-1 min-h-0 border border-white/5 bg-black/30 rounded-2xl relative flex flex-col shadow-inner overflow-hidden mb-2 lg:mb-4 w-full">
             
             {/* Auto-Scrolling Camera Container */}
             <div className="flex-1 overflow-auto custom-scrollbar relative touch-pan-x touch-pan-y" ref={scrollContainerRef}>
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
                            <p className="text-xs lg:text-sm">[ TREE_EMPTY :: AWAITING_ROOT ]</p>
                        </div>
                    )}
                 </div>
             </div>
          </div>

          <div className="shrink-0 flex justify-between items-center text-[10px] lg:text-xs font-mono text-gray-500 px-2 lg:mb-2">
             <div className="flex items-center gap-2"><Activity size={14} className={isAnimating ? "text-cyan-500 animate-spin lg:w-3.5 lg:h-3.5" : "lg:w-3.5 lg:h-3.5"}/> <span className="truncate max-w-[200px] lg:max-w-none">{message}</span></div>
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
                     <div className="flex-1 shrink-0 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col shadow-2xl overflow-hidden relative">
                         <div className="px-3 lg:px-4 py-2 lg:py-3 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                            <div className="flex items-center gap-1.5 lg:gap-2 text-cyan-400">
                                <Terminal size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4"/>
                                <span className="text-[9px] lg:text-[10px] font-black tracking-widest uppercase">Hinglish_Trace</span>
                            </div>
                         </div>
                         <div ref={interpreterScrollRef} className="p-3 lg:p-4 space-y-2 lg:space-y-3 overflow-y-auto custom-scrollbar flex-1">
                            {codeLines.length ? codeLines.map(line => (
                               <div key={line.id} className={`flex flex-col text-[10px] lg:text-sm transition-all ${line.active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
                                  <div className={`font-mono ${line.active ? 'text-cyan-400' : 'text-gray-400'}`}>{line.text}</div>
                                  {line.active && <div className="text-[9px] lg:text-xs text-amber-400 mt-0.5 lg:mt-1 flex items-center gap-1.5 lg:gap-2 leading-relaxed"><ArrowRight size={12} className="w-3 h-3 shrink-0"/> {line.explanation}</div>}
                               </div>
                            )) : <div className="text-gray-600 text-[10px] lg:text-xs italic flex items-center justify-center h-full gap-2"><Activity size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4"/> Awaiting BST operation...</div>}
                         </div>
                     </div>

                     <div className="w-[130px] lg:w-[350px] shrink-0 border border-cyan-500/30 bg-cyan-900/10 rounded-xl relative flex flex-col items-center justify-center shadow-inner h-full overflow-hidden">
                        <div className="absolute top-2 right-2 lg:top-3 lg:right-4 flex items-center gap-1.5 lg:gap-2 text-[8px] lg:text-[10px] font-mono text-cyan-500 uppercase tracking-widest">
                            <Box size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Spawn_Zone</span><span className="lg:hidden">Heap</span>
                        </div>
                        <AnimatePresence>
                           {phantom && (
                              <motion.div
                                initial={{ scale: 0, y: -20, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.5, y: 50 }}
                                className="w-14 h-14 lg:w-20 lg:h-20 rounded-full border-4 border-dashed border-cyan-400 flex items-center justify-center bg-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.4)] z-50 relative mt-4 lg:mt-6"
                              >
                                 <span className="text-xl lg:text-3xl font-black text-white">{phantom.val}</span>
                              </motion.div>
                           )}
                        </AnimatePresence>
                        {!phantom && (
                            <div className="text-cyan-500/30 font-mono text-[9px] lg:text-xs flex items-center gap-1.5 lg:gap-2 mt-4">
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

export default BSTVisualizer;