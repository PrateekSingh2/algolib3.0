import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Binary, Plus, Search, Trash2, RotateCcw, 
  GitBranch, Zap, Layers, ArrowRight, Play, Pause, StepForward, StepBack,
  Terminal, Activity, Box, Target, Maximize2, Minimize2, Settings2,
  Info, X
} from 'lucide-react';
import { useCollaboration } from '@/contexts/CollaborationContext';

// --- TYPES & GAME STATE ---
class TreeNode {
    value: number;
    left: TreeNode | null;
    right: TreeNode | null;
    parent: TreeNode | null;
    xOffset: number; 
    y: number;
    height: number;
    id: string;

    constructor(val: number) {
        this.value = val;
        this.left = null;
        this.right = null;
        this.parent = null;
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
  highlightNodes: string[];
  visitedNodes: Set<string>;
  foundNode: string | null;
  codeLines: CodeLine[];
  variables: VariableState[];
  message: string;
  outputLog: string[];
  outputTitle: string;
};

// --- ALGORITHM EXECUTION MATRIX ---
const SNIPPETS: Record<string, { id: string, text: string, explanation: string, active: boolean }[]> = {
  insert: [
    { id: '1', text: 'Node temp = new Node(val);', explanation: 'Allocated memory for new node with given value.', active: false },
    { id: '2', text: 'if (root == null) root = temp;', explanation: 'Tree is empty. Assigning new node as the Root.', active: false },
    { id: '3', text: 'while(ptr != null)', explanation: 'Traversing the tree to find the correct insertion point...', active: false },
    { id: '4', text: 'if (val < ptr.val) ptr = ptr.left;', explanation: 'Value is less than current node. Traversing left.', active: false },
    { id: '5', text: 'else ptr = ptr.right;', explanation: 'Value is greater than current node. Traversing right.', active: false },
    { id: '6', text: 'ptr.child = temp;', explanation: 'Found empty leaf position. Linking new node to the tree.', active: false }
  ],
  search: [
    { id: '1', text: 'Node ptr = root;', explanation: 'Initializing search pointer at the Root node.', active: false },
    { id: '2', text: 'if (ptr.val == target) return true;', explanation: 'Target value matched current node. Search successful.', active: false },
    { id: '3', text: 'if (target < ptr.val) ptr = ptr.left;', explanation: 'Target is smaller. Continuing search in left subtree.', active: false },
    { id: '4', text: 'else ptr = ptr.right;', explanation: 'Target is larger. Continuing search in right subtree.', active: false },
    { id: '5', text: 'return false;', explanation: 'Reached leaf node without match. Target not found.', active: false }
  ],
  delete: [
    { id: '1', text: 'Node target = search(val);', explanation: 'Searching for the target node to delete...', active: false },
    { id: '2', text: 'if (target == null) return;', explanation: 'Target node not found in the tree. Aborting operation.', active: false },
    { id: '3', text: 'rearrange_pointers(target);', explanation: 'Target located. Rearranging pointers to bypass and remove node.', active: false }
  ],
  avl: [
    { id: 'avl.check', text: 'while(node) { check_balance(node); }', explanation: 'Scanning up the tree to update heights and check balance factors.', active: false },
    { id: 'avl.ll', text: 'right_rotate(node);', explanation: 'Left-Heavy Imbalance (LL). Performing Right Rotation.', active: false },
    { id: 'avl.rr', text: 'left_rotate(node);', explanation: 'Right-Heavy Imbalance (RR). Performing Left Rotation.', active: false },
    { id: 'avl.lr', text: 'left_rotate(node.left); right_rotate(node);', explanation: 'Left-Right Imbalance. Two-step rotation (LR).', active: false },
    { id: 'avl.rl', text: 'right_rotate(node.right); left_rotate(node);', explanation: 'Right-Left Imbalance. Two-step rotation (RL).', active: false }
  ]
};

const CyberGrid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-[#dce6ec] dark:bg-[#09090b]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.05),transparent_70%)]" />
  </div>
);

// Helper for deep cloning Tree structure
const cloneTreeWithParents = (node: TreeNode | null, parent: TreeNode | null = null): TreeNode | null => {
    if (!node) return null;
    const newNode = new TreeNode(node.value);
    newNode.id = node.id;
    newNode.height = node.height;
    newNode.xOffset = node.xOffset;
    newNode.y = node.y;
    newNode.parent = parent;
    newNode.left = cloneTreeWithParents(node.left, newNode);
    newNode.right = cloneTreeWithParents(node.right, newNode);
    return newNode;
};

const BSTVisualizer = () => {
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [inputValue, setInputValue] = useState<number | ''>('');
  
  // HUD State
  const [showHUD, setShowHUD] = useState(false); 
  const [treeMode, setTreeMode] = useState<TreeMode>('bst');

  // Engine State
  const [isPaused, setIsPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // FRAME-BASED ANIMATION ENGINE
  const [frames, setFrames] = useState<VisualFrame[]>([]);
  const [frameIdx, setFrameIdx] = useState<number>(0);

  // Visual states synced to current frame
  const [message, setMessage] = useState('SYSTEM_IDLE: Ready for input');
  const [codeLines, setCodeLines] = useState<CodeLine[]>([]);
  const [variables, setVariables] = useState<VariableState[]>([]);
  const [phantom, setPhantom] = useState<{val: number, id: string} | null>(null);
  const [highlightNodes, setHighlightNodes] = useState<string[]>([]);
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const [foundNode, setFoundNode] = useState<string | null>(null);
  const [outputLog, setOutputLog] = useState<string[]>([]);
  const [outputTitle, setOutputTitle] = useState<string>("OUTPUT_CONSOLE");

  const interpreterScrollRef = useRef<HTMLDivElement>(null);
  const outputScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- COLLABORATION HOOK ---
  const { role, roomState, broadcastState } = useCollaboration();

  // Host Broadcasts State
  useEffect(() => {
    if (role === 'host') {
      const serializeTree = (node: any): any => {
         if (!node) return null;
         const { parent, ...rest } = node;
         return { ...rest, left: serializeTree(node.left), right: serializeTree(node.right) };
      };
      
      broadcastState({
        root: serializeTree(root),
        phantom,
        highlightNodes,
        visitedNodes: Array.from(visitedNodes),
        foundNode,
        codeLines,
        variables,
        message,
        outputLog,
        outputTitle,
        treeMode,
        isPaused,
        isAnimating,
        inputValue,
        frames: frames.map(f => ({ ...f, root: serializeTree(f.root), visitedNodes: Array.from(f.visitedNodes) })),
        frameIdx
      });
    }
  }, [root, phantom, highlightNodes, visitedNodes, foundNode, codeLines, variables, message, outputLog, outputTitle, treeMode, isPaused, isAnimating, inputValue, frames, frameIdx, role, broadcastState]);

  // Viewer Receives State
  useEffect(() => {
    if (role === 'viewer' && roomState) {
      if (roomState.root !== undefined) setRoot(roomState.root || null);
      if (roomState.phantom !== undefined) setPhantom(roomState.phantom || null);
      if (roomState.highlightNodes !== undefined) setHighlightNodes(roomState.highlightNodes || []);
      if (roomState.visitedNodes !== undefined) setVisitedNodes(new Set(roomState.visitedNodes || []));
      if (roomState.foundNode !== undefined) setFoundNode(roomState.foundNode || null);
      if (roomState.codeLines !== undefined) setCodeLines(roomState.codeLines || []);
      if (roomState.variables !== undefined) setVariables(roomState.variables || []);
      if (roomState.message !== undefined) setMessage(roomState.message);
      if (roomState.outputLog !== undefined) setOutputLog(roomState.outputLog || []);
      if (roomState.outputTitle !== undefined) setOutputTitle(roomState.outputTitle);
      if (roomState.treeMode !== undefined) setTreeMode(roomState.treeMode);
      if (roomState.isPaused !== undefined) setIsPaused(roomState.isPaused);
      if (roomState.isAnimating !== undefined) setIsAnimating(roomState.isAnimating);
      if (roomState.inputValue !== undefined) setInputValue(roomState.inputValue);
      if (roomState.frames !== undefined) setFrames((roomState.frames || []).map((f: any) => ({ ...f, visitedNodes: new Set(f.visitedNodes || []) })));
      if (roomState.frameIdx !== undefined) setFrameIdx(roomState.frameIdx);
    }
  }, [role, roomState]);

  useEffect(() => { generateRandom(); }, []);
  
  // Scoped interior scrolling
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
        setHighlightNodes(f.highlightNodes);
        setVisitedNodes(f.visitedNodes);
        setFoundNode(f.foundNode);
        setCodeLines(f.codeLines);
        setVariables(f.variables);
        setMessage(f.message);
        setOutputLog(f.outputLog);
        setOutputTitle(f.outputTitle);
        
        // Final frame cleanup
        if (frameIdx === frames.length - 1) {
            const tm = setTimeout(() => {
                setHighlightNodes([]);
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
    if (role !== 'viewer' && !isPaused && isAnimating && frames.length > 0 && frameIdx < frames.length - 1) {
        timer = setTimeout(() => {
            setFrameIdx(prev => prev + 1);
        }, 1300); // 1.3s delay to let the user read the step
    }
    return () => clearTimeout(timer);
  }, [isPaused, isAnimating, frameIdx, frames, role]);

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

  // Auto-scroll camera
  useEffect(() => {
    if (highlightNodes.length > 0 && root && scrollContainerRef.current) {
        const findNode = (n: TreeNode | null, targetId: string): TreeNode | null => {
            if (!n) return null;
            if (n.id === targetId) return n;
            return findNode(n.left, targetId) || findNode(n.right, targetId);
        };
        const active = findNode(root, highlightNodes[0]);
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
  }, [highlightNodes, root]);

  const generateRandom = () => setInputValue(Math.floor(Math.random() * 99) + 1);

  // --- MATH & AVL LOGIC ---
  const getHeight = (node: TreeNode | null) => node ? node.height : 0;
  const getBalance = (node: TreeNode | null) => node ? getHeight(node.left) - getHeight(node.right) : 0;
  const updateHeight = (node: TreeNode | null) => {
      if (node) node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));
  };

  const getAbsoluteRoot = (node: TreeNode | null): TreeNode | null => {
      if (!node) return null;
      let curr = node;
      while (curr.parent) curr = curr.parent;
      return curr;
  };

  const rightRotate = (y: TreeNode): TreeNode => {
      let x = y.left!;
      let T2 = x.right;

      x.right = y;
      y.left = T2;

      x.parent = y.parent;
      if (y.parent) {
          if (y === y.parent.right) y.parent.right = x;
          else y.parent.left = x;
      }
      y.parent = x;
      if (T2) T2.parent = y;

      updateHeight(y);
      updateHeight(x);
      return x;
  };

  const leftRotate = (x: TreeNode): TreeNode => {
      let y = x.right!;
      let T2 = y.left;

      y.left = x;
      x.right = T2;

      y.parent = x.parent;
      if (x.parent) {
          if (x === x.parent.left) x.parent.left = y;
          else x.parent.right = y;
      }
      x.parent = y;
      if (T2) T2.parent = x;

      updateHeight(x);
      updateHeight(y);
      return y;
  };

  const checkDuplicate = (node: TreeNode | null, val: number): boolean => {
      if (!node) return false;
      if (node.value === val) return true;
      return val < node.value ? checkDuplicate(node.left, val) : checkDuplicate(node.right, val);
  };

  // --- NEW DYNAMIC SPACING ALGORITHM ---
  const getTreeHeight = (node: TreeNode | null): number => {
      if (!node) return 0;
      return 1 + Math.max(getTreeHeight(node.left), getTreeHeight(node.right));
  };

  const updatePositions = (node: TreeNode | null, xOffset: number, y: number, depth: number, totalHeight: number) => {
      if (!node) return;
      node.xOffset = xOffset;
      node.y = y;
      
      // Gap dynamically scales based on tree height to prevent overlaps
      const power = Math.max(0, totalHeight - depth);
      const gap = Math.pow(2, power - 1) * 45; // 45px base horizontal unit space
      
      updatePositions(node.left, xOffset - gap, y + 90, depth + 1, totalHeight); 
      updatePositions(node.right, xOffset + gap, y + 90, depth + 1, totalHeight);
  };

  // --- OPERATIONS ---
  const handleInsert = () => {
      if (inputValue === '' || isAnimating) return;
      const val = Number(inputValue);
      
      if (root && checkDuplicate(root, val)) {
          setMessage(`ERROR: Value ${val} already exists in the tree.`);
          generateRandom(); return;
      }

      setIsAnimating(true);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ left: (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth) / 2, top: 0, behavior: 'smooth' });

      const title = "INSERTION_LOG";
      let currentLog = [...outputLog, `> Allocating memory for node [${val}]...`];
      let newFrames: VisualFrame[] = [];
      let currentSnippetGroup = 'insert';

      let currentRoot = root ? cloneTreeWithParents(root) : null;
      let insertedNode: TreeNode | null = null;
      let currentPhantom: {val: number, id: string} | null = { val, id: 'spawned' };
      let currentVisited = new Set<string>();

      const addFrame = (currentAbsRoot: TreeNode | null, lineId: string | null, msg: string, highNodes: string[] = [], vars: VariableState[] = []) => {
          if (currentAbsRoot) {
              const th = getTreeHeight(currentAbsRoot);
              updatePositions(currentAbsRoot, 0, 60, 1, th);
          }
          const snippet = SNIPPETS[currentSnippetGroup];
          const currentLine = lineId ? snippet.find(l => l.id === lineId) : null;
          
          newFrames.push({
              root: cloneTreeWithParents(currentAbsRoot),
              phantom: currentPhantom ? { ...currentPhantom } : null,
              highlightNodes: highNodes,
              visitedNodes: new Set([...currentVisited]),
              foundNode: null,
              codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })),
              variables: vars.map(v => ({...v})),
              message: msg || (currentLine ? currentLine.explanation : 'Processing...'),
              outputLog: [...currentLog],
              outputTitle: title
          });
      };

      addFrame(currentRoot, '1', `Allocated memory for new node [${val}].`, [], [{ name: 'temp', value: `${val}`, color: '#00ff88' }]);

      if (!currentRoot) {
          insertedNode = new TreeNode(val);
          currentRoot = insertedNode;
          addFrame(currentRoot, '2', `Tree is empty. Assigning new node as the Root.`, [], [{ name: 'temp', value: `${val}`, color: '#00ff88' }]);
          currentPhantom = null;
          currentLog.push(`> Node [${val}] set as the initial ROOT.`);
      } else {
          let curr = currentRoot;
          addFrame(currentRoot, '3', `Traversing the tree to find the correct insertion point...`, [curr.id], [
              { name: 'ptr', value: `${curr.value}`, color: '#00f5ff' },
              { name: 'val', value: `${val}`, color: '#00ff88' }
          ]);

          while (true) {
              currentVisited.add(curr.id);
              if (val < curr.value) {
                  addFrame(currentRoot, '4', `Value is less than current node. Traversing left.`, [curr.id], [{ name: 'action', value: `GO LEFT`, color: '#facc15' }]);
                  if (!curr.left) {
                      curr.left = new TreeNode(val);
                      curr.left.parent = curr;
                      insertedNode = curr.left;
                      addFrame(currentRoot, '6', `Found empty leaf position. Linking new node to the tree.`, [curr.id, curr.left.id], [{ name: 'action', value: `LINK LEFT`, color: '#facc15' }]);
                      currentLog.push(`> Linked node [${val}] to the LEFT of [${curr.value}].`);
                      break;
                  }
                  curr = curr.left;
              } else {
                  addFrame(currentRoot, '5', `Value is greater than current node. Traversing right.`, [curr.id], [{ name: 'action', value: `GO RIGHT`, color: '#facc15' }]);
                  if (!curr.right) {
                      curr.right = new TreeNode(val);
                      curr.right.parent = curr;
                      insertedNode = curr.right;
                      addFrame(currentRoot, '6', `Found empty leaf position. Linking new node to the tree.`, [curr.id, curr.right.id], [{ name: 'action', value: `LINK RIGHT`, color: '#facc15' }]);
                      currentLog.push(`> Linked node [${val}] to the RIGHT of [${curr.value}].`);
                      break;
                  }
                  curr = curr.right;
              }
          }
          currentPhantom = null;
      }

      // Rebalancing Engine
      if (treeMode === 'avl' && insertedNode) {
          currentSnippetGroup = 'avl';
          currentLog.push(`> Analyzing Balance Factors (BF) across affected path...`);
          
          let curr: TreeNode | null = insertedNode.parent;
          while (curr) {
              updateHeight(curr);
              let bf = getBalance(curr);
              
              if (bf > 1 || bf < -1) {
                  currentLog.push(`> Imbalance at [${curr.value}] (BF: ${bf}).`);
                  addFrame(getAbsoluteRoot(curr), 'avl.check', `Imbalance detected at Node [${curr.value}]. Balance Factor: ${bf}.`, [curr.id]);

                  if (bf > 1 && getBalance(curr.left) >= 0) {
                      currentLog.push(`> Executing Right Rotation (LL Case).`);
                      addFrame(getAbsoluteRoot(curr), 'avl.ll', `LL Case: Executing Right Rotation around [${curr.value}].`, [curr.id, curr.left?.id].filter(Boolean) as string[]);
                      curr = rightRotate(curr);
                      addFrame(getAbsoluteRoot(curr), 'avl.ll', `Right Rotation Complete.`, [curr.id]);
                  } else if (bf > 1 && getBalance(curr.left) < 0) {
                      currentLog.push(`> Executing Left-Right Rotation (LR Case).`);
                      addFrame(getAbsoluteRoot(curr), 'avl.lr', `LR Case (Step 1): Left Rotation on child [${curr.left?.value}].`, [curr.left?.id].filter(Boolean) as string[]);
                      leftRotate(curr.left!);
                      addFrame(getAbsoluteRoot(curr), 'avl.lr', `Left Rotation Complete. Tree temporarily in LL State.`, [curr.left?.id].filter(Boolean) as string[]);
                      
                      addFrame(getAbsoluteRoot(curr), 'avl.lr', `LR Case (Step 2): Right Rotation around [${curr.value}].`, [curr.id, curr.left?.id].filter(Boolean) as string[]);
                      curr = rightRotate(curr);
                      addFrame(getAbsoluteRoot(curr), 'avl.lr', `Left-Right Rotation Complete.`, [curr.id]);
                  } else if (bf < -1 && getBalance(curr.right) <= 0) {
                      currentLog.push(`> Executing Left Rotation (RR Case).`);
                      addFrame(getAbsoluteRoot(curr), 'avl.rr', `RR Case: Executing Left Rotation around [${curr.value}].`, [curr.id, curr.right?.id].filter(Boolean) as string[]);
                      curr = leftRotate(curr);
                      addFrame(getAbsoluteRoot(curr), 'avl.rr', `Left Rotation Complete.`, [curr.id]);
                  } else if (bf < -1 && getBalance(curr.right) > 0) {
                      currentLog.push(`> Executing Right-Left Rotation (RL Case).`);
                      addFrame(getAbsoluteRoot(curr), 'avl.rl', `RL Case (Step 1): Right Rotation on child [${curr.right?.value}].`, [curr.right?.id].filter(Boolean) as string[]);
                      rightRotate(curr.right!);
                      addFrame(getAbsoluteRoot(curr), 'avl.rl', `Right Rotation Complete. Tree temporarily in RR State.`, [curr.right?.id].filter(Boolean) as string[]);
                      
                      addFrame(getAbsoluteRoot(curr), 'avl.rl', `RL Case (Step 2): Left Rotation around [${curr.value}].`, [curr.id, curr.right?.id].filter(Boolean) as string[]);
                      curr = leftRotate(curr);
                      addFrame(getAbsoluteRoot(curr), 'avl.rl', `Right-Left Rotation Complete.`, [curr.id]);
                  }
              }
              curr = curr.parent;
          }
      } else {
          let curr = insertedNode?.parent;
          while(curr) {
              updateHeight(curr);
              curr = curr.parent;
          }
      }

      currentRoot = getAbsoluteRoot(insertedNode || currentRoot);
      currentSnippetGroup = 'insert';
      addFrame(currentRoot, null, "EXECUTION_COMPLETE: Node successfully inserted.", [], []);

      setFrames(newFrames);
      setFrameIdx(0);
  };

  const deleteNodeInPlace = (root: TreeNode | null, val: number): { newRoot: TreeNode | null, rebalanceStart: TreeNode | null } => {
      if (!root) return { newRoot: null, rebalanceStart: null };
      let curr: TreeNode | null = root;
      while (curr && curr.value !== val) {
          if (val < curr.value) curr = curr.left;
          else curr = curr.right;
      }
      if (!curr) return { newRoot: root, rebalanceStart: null };

      let nodeToRebalanceFrom: TreeNode | null = null;
      let newRoot = root;

      if (!curr.left && !curr.right) {
          nodeToRebalanceFrom = curr.parent;
          if (!curr.parent) newRoot = null;
          else if (curr.parent.left === curr) curr.parent.left = null;
          else curr.parent.right = null;
      } else if (!curr.left || !curr.right) {
          let child = curr.left || curr.right;
          child!.parent = curr.parent;
          nodeToRebalanceFrom = curr.parent;
          if (!curr.parent) newRoot = child;
          else if (curr.parent.left === curr) curr.parent.left = child;
          else curr.parent.right = child;
      } else {
          let successor = curr.right;
          while (successor.left) successor = successor.left;
          
          curr.value = successor.value; 
          nodeToRebalanceFrom = successor.parent;
          
          let child = successor.right;
          if (child) child.parent = successor.parent;
          
          if (successor.parent === curr) {
              nodeToRebalanceFrom = curr; 
              curr.right = child; 
          } else {
              successor.parent!.left = child;
          }
      }
      
      return { newRoot, rebalanceStart: nodeToRebalanceFrom };
  };

  const handleDelete = () => {
    if (inputValue === '' || !root || isAnimating) return;
    const val = Number(inputValue);
    setIsAnimating(true);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ left: (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth) / 2, top: 0, behavior: 'smooth' });

    const title = "DELETE_PROTOCOL";
    let currentLog = [...outputLog, `> Initiating deletion sequence for node [${val}]...`];
    let newFrames: VisualFrame[] = [];
    let currentSnippetGroup = 'delete';
    let currentRoot = cloneTreeWithParents(root);

    const addFrame = (currentAbsRoot: TreeNode | null, lineId: string | null, msg: string, highNodes: string[] = []) => {
        if (currentAbsRoot) {
            const th = getTreeHeight(currentAbsRoot);
            updatePositions(currentAbsRoot, 0, 60, 1, th);
        }
        const snippet = SNIPPETS[currentSnippetGroup];
        const currentLine = lineId ? snippet.find(l => l.id === lineId) : null;
        
        newFrames.push({
            root: cloneTreeWithParents(currentAbsRoot),
            phantom: null,
            highlightNodes: highNodes,
            visitedNodes: new Set(),
            foundNode: null,
            codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })),
            variables: [],
            message: msg || (currentLine ? currentLine.explanation : 'Processing...'),
            outputLog: [...currentLog],
            outputTitle: title
        });
    };

    addFrame(currentRoot, '1', `Searching for the target node [${val}] to delete...`, []);
    
    if (!checkDuplicate(currentRoot, val)) {
        currentLog.push(`> Abort: Target node [${val}] does not exist in the tree.`);
        addFrame(currentRoot, '2', `Target node not found in the tree. Aborting operation.`, []);
        addFrame(currentRoot, null, "ABORTED: Node not found.", []);
        setFrames(newFrames);
        setFrameIdx(0);
        return;
    }

    addFrame(currentRoot, '3', `Target located. Rearranging pointers to bypass and remove node.`, []);
    
    let { newRoot: updatedRoot, rebalanceStart: startNode } = deleteNodeInPlace(currentRoot, val);
    currentRoot = getAbsoluteRoot(updatedRoot || startNode); 
    
    addFrame(currentRoot, '3', `Node physically removed. Updating structure.`, []);
    
    // Rebalancing Engine
    if (treeMode === 'avl' && startNode) {
        currentSnippetGroup = 'avl';
        currentLog.push(`> Analyzing Balance Factors (BF) across affected path...`);
        
        let curr: TreeNode | null = startNode;
        while (curr) {
            updateHeight(curr);
            let bf = getBalance(curr);
            
            if (bf > 1 || bf < -1) {
                currentLog.push(`> Imbalance at [${curr.value}] (BF: ${bf}).`);
                addFrame(getAbsoluteRoot(curr), 'avl.check', `Imbalance detected at Node [${curr.value}]. Balance Factor: ${bf}.`, [curr.id]);

                if (bf > 1 && getBalance(curr.left) >= 0) {
                    currentLog.push(`> Executing Right Rotation (LL Case).`);
                    addFrame(getAbsoluteRoot(curr), 'avl.ll', `LL Case: Executing Right Rotation around [${curr.value}].`, [curr.id, curr.left?.id].filter(Boolean) as string[]);
                    curr = rightRotate(curr);
                    addFrame(getAbsoluteRoot(curr), 'avl.ll', `Right Rotation Complete.`, [curr.id]);
                } else if (bf > 1 && getBalance(curr.left) < 0) {
                    currentLog.push(`> Executing Left-Right Rotation (LR Case).`);
                    addFrame(getAbsoluteRoot(curr), 'avl.lr', `LR Case (Step 1): Left Rotation on child [${curr.left?.value}].`, [curr.left?.id].filter(Boolean) as string[]);
                    leftRotate(curr.left!);
                    addFrame(getAbsoluteRoot(curr), 'avl.lr', `Left Rotation Complete. Tree temporarily in LL State.`, [curr.left?.id].filter(Boolean) as string[]);
                    
                    addFrame(getAbsoluteRoot(curr), 'avl.lr', `LR Case (Step 2): Right Rotation around [${curr.value}].`, [curr.id, curr.left?.id].filter(Boolean) as string[]);
                    curr = rightRotate(curr);
                    addFrame(getAbsoluteRoot(curr), 'avl.lr', `Left-Right Rotation Complete.`, [curr.id]);
                } else if (bf < -1 && getBalance(curr.right) <= 0) {
                    currentLog.push(`> Executing Left Rotation (RR Case).`);
                    addFrame(getAbsoluteRoot(curr), 'avl.rr', `RR Case: Executing Left Rotation around [${curr.value}].`, [curr.id, curr.right?.id].filter(Boolean) as string[]);
                    curr = leftRotate(curr);
                    addFrame(getAbsoluteRoot(curr), 'avl.rr', `Left Rotation Complete.`, [curr.id]);
                } else if (bf < -1 && getBalance(curr.right) > 0) {
                    currentLog.push(`> Executing Right-Left Rotation (RL Case).`);
                    addFrame(getAbsoluteRoot(curr), 'avl.rl', `RL Case (Step 1): Right Rotation on child [${curr.right?.value}].`, [curr.right?.id].filter(Boolean) as string[]);
                    rightRotate(curr.right!);
                    addFrame(getAbsoluteRoot(curr), 'avl.rl', `Right Rotation Complete. Tree temporarily in RR State.`, [curr.right?.id].filter(Boolean) as string[]);
                    
                    addFrame(getAbsoluteRoot(curr), 'avl.rl', `RL Case (Step 2): Left Rotation around [${curr.value}].`, [curr.id, curr.right?.id].filter(Boolean) as string[]);
                    curr = leftRotate(curr);
                    addFrame(getAbsoluteRoot(curr), 'avl.rl', `Right-Left Rotation Complete.`, [curr.id]);
                }
            }
            curr = curr.parent;
        }
    } else if (startNode) {
        let curr: TreeNode | null = startNode;
        while(curr) {
            updateHeight(curr);
            curr = curr.parent;
        }
    }

    currentRoot = getAbsoluteRoot(updatedRoot || startNode);
    currentSnippetGroup = 'delete';
    currentLog.push(`> SUCCESS: Node [${val}] successfully deleted.`);
    addFrame(currentRoot, null, "TARGET_ELIMINATED: Node successfully deleted.", []);

    setFrames(newFrames);
    setFrameIdx(0);
  };

  const handleSearch = () => {
    if (inputValue === '' || !root || isAnimating) return;
    const val = Number(inputValue);
    setIsAnimating(true);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ left: (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth) / 2, top: 0, behavior: 'smooth' });

    const title = "SEARCH_PROTOCOL";
    let currentLog = [...outputLog, `> Initiating search for node [${val}]...`];
    let newFrames: VisualFrame[] = [];
    const snippet = SNIPPETS.search;
    let currentRoot = cloneTreeWithParents(root);
    let currentVisited = new Set<string>();

    const addFrame = (lineId: string, msg: string, highNodes: string[] = []) => {
        if (currentRoot) {
            const th = getTreeHeight(currentRoot);
            updatePositions(currentRoot, 0, 60, 1, th);
        }
        const currentLine = snippet.find(l => l.id === lineId);
        newFrames.push({
            root: cloneTreeWithParents(currentRoot),
            phantom: null,
            highlightNodes: highNodes,
            visitedNodes: new Set([...currentVisited]),
            foundNode: null,
            codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })),
            variables: [],
            message: msg || (currentLine ? currentLine.explanation : 'Processing...'),
            outputLog: [...currentLog],
            outputTitle: title
        });
    };

    addFrame('1', `Initializing search pointer at the Root node.`, [currentRoot!.id]);
    
    let curr: TreeNode | null = currentRoot;
    while (curr) {
        currentVisited.add(curr.id);
        if (curr.value === val) {
            currentLog.push(`> SUCCESS: Target node [${val}] found.`);
            addFrame('2', `Target value matched current node. Search successful.`, [curr.id]);
            
            newFrames.push({
                root: cloneTreeWithParents(currentRoot),
                phantom: null,
                highlightNodes: [],
                visitedNodes: new Set([...currentVisited]),
                foundNode: curr.id, 
                codeLines: [],
                variables: [],
                message: "SEARCH_COMPLETE: Target Located.",
                outputLog: [...currentLog],
                outputTitle: title
            });
            break;
        } else if (val < curr.value) {
            addFrame('3', `Target is smaller. Continuing search in left subtree.`, [curr.id]);
            curr = curr.left;
        } else {
            addFrame('4', `Target is larger. Continuing search in right subtree.`, [curr.id]);
            curr = curr.right;
        }
    }
    
    if (!curr) {
        currentLog.push(`> FAILED: Target node [${val}] not found.`);
        addFrame('5', `Reached leaf node without match. Target not found.`, []);
        newFrames.push({
            root: cloneTreeWithParents(currentRoot),
            phantom: null,
            highlightNodes: [],
            visitedNodes: new Set([...currentVisited]),
            foundNode: null,
            codeLines: [],
            variables: [],
            message: "SEARCH_FAILED: Target not found.",
            outputLog: [...currentLog],
            outputTitle: title
        });
    }
    
    setFrames(newFrames);
    setFrameIdx(0);
  };

  const renderEdges = (node: TreeNode | null): JSX.Element[] => {
      if (!node) return [];
      const edges = [];
      const edgeColor = document.documentElement.classList.contains('dark') ? '#52525b' : '#94a3b8'; // zinc-600 / slate-400
      if (node.left) {
          edges.push(
              <motion.line key={`${node.id}-left`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  x1={`calc(50% + ${node.xOffset}px)`} y1={node.y} 
                  x2={`calc(50% + ${node.left.xOffset}px)`} y2={node.left.y} 
                  stroke={edgeColor} strokeWidth="3" 
              />
          );
          edges.push(...renderEdges(node.left));
      }
      if (node.right) {
          edges.push(
              <motion.line key={`${node.id}-right`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  x1={`calc(50% + ${node.xOffset}px)`} y1={node.y} 
                  x2={`calc(50% + ${node.right.xOffset}px)`} y2={node.right.y} 
                  stroke={edgeColor} strokeWidth="3" 
              />
          );
          edges.push(...renderEdges(node.right));
      }
      return edges;
  };

  const renderNodes = (node: TreeNode | null): JSX.Element[] => {
      if (!node) return [];
      const isActive = highlightNodes.includes(node.id);
      const isFound = foundNode === node.id;
      
      const bf = getBalance(node);
      const isUnbalanced = bf > 1 || bf < -1;
      const isLeaf = !node.left && !node.right;
      const isRoot = root && root.id === node.id;

      let borderColor = '#3b82f6'; 
      if (isUnbalanced) borderColor = '#ef4444'; 
      if (isFound) borderColor = '#22c55e'; 
      if (isActive) borderColor = '#facc15'; 

      const bgColor = document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff';
      const textColor = document.documentElement.classList.contains('dark') ? 'text-white' : 'text-slate-950';

      const nodes = [
          <motion.div key={node.id} initial={{ scale: 0 }}
              animate={{ scale: isActive ? 1.1 : 1, left: `calc(50% + ${node.xOffset}px)`, top: node.y }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`absolute w-12 h-12 lg:w-16 lg:h-16 -ml-6 -mt-6 lg:-ml-8 lg:-mt-8 rounded-full flex flex-col items-center justify-center border-[3px] dark:border-4 shadow-sm dark:shadow-xl z-20`}
              style={{ borderColor, backgroundColor: bgColor, boxShadow: isActive ? '0 0 30px rgba(250,204,21,0.4)' : 'none' }}
          >
              <span className="text-[7px] lg:text-[9px] text-slate-500 dark:text-gray-400 font-mono absolute top-1">h: {node.height}</span>
              <span className={`font-black text-lg lg:text-xl mt-1 ${textColor}`}>{node.value}</span>

              <div className="absolute -bottom-5 lg:-bottom-6 flex flex-col items-center whitespace-nowrap">
                  <span className={`text-[8px] lg:text-[10px] font-black font-mono ${isUnbalanced ? 'text-red-500' : 'text-slate-800 dark:text-gray-400'}`}>
                      BF: {bf}
                  </span>
                  {isLeaf && <span className="text-[7px] lg:text-[9px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">LEAF</span>}
              </div>
              {isRoot && <div className="absolute -top-5 lg:-top-6 text-[9px] lg:text-[11px] font-black text-blue-600 dark:text-blue-500">ROOT</div>}
              {isActive && (
                  <div className="absolute -left-12 lg:-left-14 top-4 bg-yellow-400 dark:bg-yellow-500 text-slate-900 dark:text-black px-1.5 py-0.5 rounded text-[7px] lg:text-[8px] font-black shadow-lg">ACTIVE</div>
              )}
          </motion.div>
      ];
      nodes.push(...renderNodes(node.left));
      nodes.push(...renderNodes(node.right));
      return nodes;
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row-reverse gap-4 lg:gap-6 h-full w-full relative font-sans text-slate-900 dark:text-white lg:p-3">
      
      {/* LEFT: COMMAND CENTER */}
      <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 flex-1 min-h-0 lg:flex-none overflow-y-auto custom-scrollbar lg:pr-2 pb-4 lg:pb-0">
        
        {/* Controls Block 1 */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-5 shadow-sm shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <Settings2 size={18} /> Controls
            </div>
            <button 
              onClick={() => setShowInfo(true)}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
            >
              <Info size={16} />
            </button>
          </div>
            {/* AVL Auto Balance Toggle */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-gray-400 uppercase flex items-center gap-1"><Settings2 size={12}/> Mode</span>
                    <span className={`text-xs font-black ${treeMode === 'avl' ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'}`}>
                        {treeMode === 'avl' ? 'AVL (Auto-Balance)' : 'Standard BST'}
                    </span>
                </div>
                <button 
                    onClick={() => { setTreeMode(treeMode === 'bst' ? 'avl' : 'bst'); setRoot(null); setTimeout(centerWorkspace, 100); }}
                    disabled={isAnimating || role === 'viewer'}
                    className="px-3 py-1.5 bg-white dark:bg-black/50 border border-slate-400 dark:border-white/20 rounded hover:border-slate-500 dark:hover:border-white/50 text-[9px] font-black uppercase text-slate-950 dark:text-white transition-all disabled:opacity-30"
                >
                    Switch
                </button>
            </div>

            {/* Playback Controls */}
            <div className="space-y-4 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-800 dark:text-gray-400 uppercase">Step Engine</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${isPaused ? 'border-amber-600 text-amber-700 dark:text-amber-500' : 'border-blue-600 text-blue-700 dark:text-blue-500'}`}>
                    {isPaused ? 'MANUAL' : 'AUTO'}
                </span>
              </div>
              <div className="flex gap-2">
                <button disabled={role === 'viewer'} onClick={() => setIsPaused(!isPaused)} className="flex-1 py-2 bg-blue-400 dark:bg-blue-500/20 backdrop-blur-xl border border-blue-500 dark:border-blue-500/50 rounded flex items-center justify-center gap-2 text-xs font-bold hover:bg-blue-500 dark:hover:bg-blue-500/30 transition-all text-black dark:text-blue-400 disabled:opacity-50">
                  {isPaused ? <Play size={14}/> : <Pause size={14}/>} {isPaused ? 'AUTOPLAY' : 'MANUAL'}
                </button>
                <div className="flex flex-1 gap-1">
                    <button 
                      disabled={!isPaused || !isAnimating || frameIdx <= 0 || role === 'viewer'} 
                      onClick={() => setFrameIdx(f => Math.max(0, f - 1))} 
                      className="flex-1 py-2 bg-blue-700 text-white rounded flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black hover:bg-blue-600 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      <StepBack size={14} /> PREV
                    </button>
                    <button 
                      disabled={!isPaused || !isAnimating || frameIdx >= frames.length - 1 || role === 'viewer'} 
                      onClick={() => setFrameIdx(f => Math.min(frames.length - 1, f + 1))} 
                      className="flex-1 py-2 bg-blue-600 text-white dark:text-black rounded flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black hover:bg-blue-500 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      NEXT <StepForward size={14} />
                    </button>
                </div>
              </div>
            </div>
        </div>

        {/* Controls Block 2 */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-5 shadow-sm shrink-0">
            {/* Core Controls */}
            <div className="space-y-4">
               <div className="flex gap-2">
                  <div className="flex-1">
                       <label className="text-[9px] text-slate-800 dark:text-gray-500 uppercase font-bold">Node Payload</label>
                      <div className="flex gap-1 mt-1">
                          <input type="number" disabled={role === 'viewer'} value={inputValue} onChange={(e) => setInputValue(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded px-3 py-2 text-blue-700 dark:text-blue-400 outline-none font-mono text-sm disabled:opacity-50" />
                          <button disabled={role === 'viewer'} onClick={generateRandom} className="px-3 bg-blue-400 dark:bg-blue-500/20 rounded border border-blue-500 dark:border-blue-500/50 hover:bg-blue-500 dark:hover:bg-blue-500/30 text-black dark:text-blue-400 font-bold transition-all disabled:opacity-50"><RotateCcw size={14}/></button>
                      </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-3 gap-2 mt-2">
                  <button onClick={handleInsert} disabled={isAnimating || role === 'viewer'} className="p-2 bg-green-400 dark:bg-green-500/20 border border-green-500 dark:border-green-500/50 text-black dark:text-green-400 rounded hover:bg-green-500 dark:hover:bg-green-500/30 text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 disabled:opacity-50 transition-all">
                     <Plus size={14}/> INSERT
                  </button>
                  <button onClick={handleSearch} disabled={isAnimating || role === 'viewer'} className="p-2 bg-blue-400 dark:bg-blue-500/20 border border-blue-500 dark:border-blue-500/50 text-black dark:text-blue-400 rounded hover:bg-blue-500 dark:hover:bg-blue-500/30 text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 disabled:opacity-50 transition-all">
                     <Search size={14}/> SEARCH
                  </button>
                  <button onClick={handleDelete} disabled={isAnimating || role === 'viewer'} className="p-2 bg-orange-400 dark:bg-orange-500/20 border border-orange-500 dark:border-orange-500/50 text-black dark:text-orange-400 rounded hover:bg-orange-500 dark:hover:bg-orange-500/30 text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 disabled:opacity-50 transition-all">
                     <Trash2 size={14}/> DELETE
                  </button>
               </div>
            </div>

            <button onClick={() => { if (role !== 'viewer') { setRoot(null); setOutputLog([]); setTimeout(centerWorkspace, 50); } }} disabled={isAnimating || role === 'viewer'} className="w-full py-2 shrink-0 bg-orange-400 dark:bg-orange-500/20 hover:bg-orange-500 dark:hover:bg-orange-500/30 hover:text-black dark:hover:text-orange-400 border border-orange-500 dark:border-orange-500/50 rounded text-[10px] font-bold text-black dark:text-orange-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  <Trash2 size={14}/> FORMAT TREE
            </button>
        </div>

        {/* Controls Block 3 (Terminal) */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-5 shadow-sm shrink-0 mt-auto">
            {/* DEDICATED OUTPUT SCREEN */}
            <div className="flex-1 min-h-[120px] lg:min-h-[150px] bg-slate-50 dark:bg-[#161b22] border border-blue-200 dark:border-[#30363d] rounded-xl flex flex-col overflow-hidden shadow-inner">
                 <div className="px-3 py-2 border-b border-blue-200 dark:border-[#30363d] bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] flex items-center gap-2 shrink-0">
                    <Terminal size={12} className="text-blue-700 dark:text-blue-400" />
                    <span className="text-[9px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">{outputTitle}</span>
                </div>
                <div ref={outputScrollRef} className="p-3 overflow-y-auto custom-scrollbar flex-1 font-mono text-[11px] text-slate-900 dark:text-gray-300 flex flex-col gap-1">
                    {outputLog.length === 0 ? (
                        <span className="text-slate-500 dark:text-gray-600 italic mt-1">Awaiting execution...</span>
                    ) : (
                        outputLog.map((log, i) => (
                           <div key={i} className={`flex items-start ${log.includes('SUCCESS') || log.includes('COMPLETE') ? 'text-emerald-700 dark:text-emerald-400 font-bold' : log.includes('FAILED') || log.includes('Abort') ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-gray-400'}`}>
                               <span className="opacity-50 mr-2 shrink-0">{String(i).padStart(2, '0')}</span>
                               {log}
                           </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT: THE ARENA */}
      <div className="h-[48vh] shrink-0 lg:h-auto lg:flex-1 bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden flex flex-col">
          
          {/* SMALL HUD TOGGLE */}
          <div className="flex justify-start lg:justify-start items-center mb-2 lg:mb-3 shrink-0 gap-2">
             <button 
                onClick={() => setShowHUD(!showHUD)}
                className="h-7 lg:h-8 px-3 bg-white dark:bg-[#050505] border border-cyan-400 dark:border-cyan-500/80 rounded-lg lg:rounded-full text-cyan-600 dark:text-cyan-400 font-black text-[10px] flex items-center gap-1.5 tracking-widest hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:shadow-sm dark:hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all shadow-sm dark:shadow-[0_0_10px_rgba(6,182,212,0.2)] uppercase z-40"
             >
                {showHUD ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                {showHUD ? 'HIDE HUD' : 'SHOW HUD'}
             </button>
          </div>

          {/* Central Arena: The Infinite Tree Canvas */}
          <div className="flex-1 min-h-0 border border-slate-200 dark:border-[#30363d] bg-white/60 backdrop-blur-xl/50 dark:bg-[#0a0c10] rounded-2xl relative flex flex-col shadow-inner overflow-hidden mb-2 lg:mb-4 w-full">
             
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-gray-600 font-mono opacity-50 pointer-events-none">
                            <Binary size={48} className="mb-4 text-slate-700 dark:text-gray-700" />
                            <p className="text-xs lg:text-sm">[ TREE_EMPTY :: AWAITING_ROOT ]</p>
                        </div>
                    )}
                 </div>
             </div>
          </div>

          <div className="shrink-0 flex justify-between items-center text-[10px] lg:text-xs font-mono text-slate-700 dark:text-gray-500 px-2 lg:mb-2">
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
                     <div className="flex-1 shrink-0 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-xl flex flex-col shadow-inner overflow-hidden relative">
                         <div className="px-3 lg:px-4 py-2 lg:py-3 border-b border-slate-200 dark:border-[#30363d] flex justify-between items-center bg-white/60 dark:bg-[#0d1117] shrink-0">
                            <div className="flex items-center gap-1.5 lg:gap-2 text-cyan-600 dark:text-cyan-400">
                                <Terminal size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4"/>
                                <span className="text-[9px] lg:text-[10px] font-black tracking-widest uppercase">Execution_Trace</span>
                            </div>
                         </div>
                         <div ref={interpreterScrollRef} className="p-3 lg:p-4 space-y-2 lg:space-y-3 overflow-y-auto custom-scrollbar flex-1">
                            {codeLines.length ? codeLines.map(line => (
                               <div key={line.id} className={`flex flex-col text-[10px] lg:text-sm transition-all ${line.active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
                                  <div className={`font-mono ${line.active ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-700 dark:text-gray-400'}`}>{line.text}</div>
                                  {line.active && <div className="text-[9px] lg:text-xs text-amber-600 dark:text-amber-400 mt-0.5 lg:mt-1 flex items-center gap-1.5 lg:gap-2 leading-relaxed"><ArrowRight size={12} className="w-3 h-3 shrink-0"/> {line.explanation}</div>}
                               </div>
                            )) : <div className="text-slate-400 dark:text-gray-600 text-[10px] lg:text-xs italic flex items-center justify-center h-full gap-2"><Activity size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4"/> Awaiting BST operation...</div>}
                         </div>
                     </div>

                     <div className="w-[130px] lg:w-[350px] shrink-0 border border-cyan-200 dark:border-[#30363d] bg-cyan-50 dark:bg-[#161b22] rounded-xl relative flex flex-col items-center justify-center shadow-inner h-full overflow-hidden">
                        <div className="absolute top-2 right-2 lg:top-3 lg:right-4 flex items-center gap-1.5 lg:gap-2 text-[8px] lg:text-[10px] font-mono text-cyan-600 dark:text-cyan-500 uppercase tracking-widest">
                            <Box size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Memory_Allocation</span><span className="lg:hidden">Heap</span>
                        </div>
                        <AnimatePresence>
                           {phantom && (
                              <motion.div
                                initial={{ scale: 0, y: -20, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.5, y: 50 }}
                                className="w-14 h-14 lg:w-20 lg:h-20 rounded-full border-[3px] dark:border-4 border-dashed border-cyan-500 dark:border-cyan-400 flex items-center justify-center bg-cyan-100 dark:bg-cyan-500/20 shadow-sm dark:shadow-[0_0_30px_rgba(6,182,212,0.4)] z-50 relative mt-4 lg:mt-6"
                              >
                                 <span className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white">{phantom.val}</span>
                              </motion.div>
                           )}
                        </AnimatePresence>
                        {!phantom && (
                            <div className="text-cyan-600/50 dark:text-cyan-500/30 font-mono text-[9px] lg:text-xs flex items-center gap-1.5 lg:gap-2 mt-4">
                                <Zap size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Heap Ready</span><span className="lg:hidden">Empty</span>
                            </div>
                        )}
                     </div>
                  </motion.div>
              )}
          </AnimatePresence>

        </div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-2xl"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-4 right-4 h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Activity className="text-emerald-500" /> Binary Search Tree Visualizer
              </h3>
              
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 mt-4 h-max overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
                <p>
                  A <strong>Binary Search Tree (BST)</strong> is a tree data structure where each node has at most two children. The left child's value is less than the parent's, and the right child's value is greater.
                </p>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-4">Key Operations</h4>
                <p>
                  You can <strong>Insert</strong> nodes, <strong>Delete</strong> nodes, or <strong>Search</strong> for specific values. In-order traversal of a BST yields sorted elements.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BSTVisualizer;