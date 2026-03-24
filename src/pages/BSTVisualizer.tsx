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
    <div className="absolute inset-0 bg-[#09090b]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.05),transparent_70%)]" />
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
  const [showHUD, setShowHUD] = useState(true); 
  const [treeMode, setTreeMode] = useState<TreeMode>('bst');

  // Engine State
  const [isPaused, setIsPaused] = useState(false);
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
    if (!isPaused && isAnimating && frames.length > 0 && frameIdx < frames.length - 1) {
        timer = setTimeout(() => {
            setFrameIdx(prev => prev + 1);
        }, 1300); // 1.3s delay to let the user read the step
    }
    return () => clearTimeout(timer);
  }, [isPaused, isAnimating, frameIdx, frames]);

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
      const isActive = highlightNodes.includes(node.id);
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
              animate={{ scale: isActive ? 1.1 : 1, left: `calc(50% + ${node.xOffset}px)`, top: node.y }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`absolute w-12 h-12 lg:w-16 lg:h-16 -ml-6 -mt-6 lg:-ml-8 lg:-mt-8 rounded-full flex flex-col items-center justify-center border-4 shadow-xl z-20 bg-[#09090b]`}
              style={{ borderColor, boxShadow: isActive ? '0 0 30px rgba(250,204,21,0.4)' : 'none' }}
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
                  <div className="absolute -left-12 lg:-left-14 top-4 bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[7px] lg:text-[8px] font-black shadow-lg">ACTIVE</div>
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
               
               <div className="grid grid-cols-3 gap-2 mt-2">
                  <button onClick={handleInsert} disabled={isAnimating} className="p-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded hover:bg-cyan-500/20 text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                     <Plus size={14}/> INSERT
                  </button>
                  <button onClick={handleSearch} disabled={isAnimating} className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded hover:bg-amber-500/20 text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                     <Search size={14}/> SEARCH
                  </button>
                  <button onClick={handleDelete} disabled={isAnimating} className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                     <Trash2 size={14}/> DELETE
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
                           <div key={i} className={`flex items-start ${log.includes('SUCCESS') || log.includes('COMPLETE') ? 'text-emerald-400 font-bold' : log.includes('FAILED') || log.includes('Abort') ? 'text-red-400' : 'text-gray-400'}`}>
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

          {/* Central Arena: The Infinite Tree Canvas */}
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
                                <span className="text-[9px] lg:text-[10px] font-black tracking-widest uppercase">Execution_Trace</span>
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
                            <Box size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Memory_Allocation</span><span className="lg:hidden">Heap</span>
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
                                <Zap size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Heap Ready</span><span className="lg:hidden">Empty</span>
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