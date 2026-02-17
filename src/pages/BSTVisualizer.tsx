import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Binary, Plus, Search, Trash2, RotateCcw, 
  GitBranch, Zap, Layers, ArrowRight
} from 'lucide-react';

// --- TYPES ---
class TreeNode {
    value: number;
    left: TreeNode | null;
    right: TreeNode | null;
    x: number;
    y: number;
    id: string;

    constructor(val: number) {
        this.value = val;
        this.left = null;
        this.right = null;
        this.x = 0;
        this.y = 0;
        this.id = Math.random().toString(36).substr(2, 9);
    }
}

const BSTVisualizer = () => {
    // --- STATE ---
    const [root, setRoot] = useState<TreeNode | null>(null);
    const [inputValue, setInputValue] = useState<number | ''>('');
    const [log, setLog] = useState('System Ready');
    
    // Animation State
    const [highlightNode, setHighlightNode] = useState<string | null>(null);
    const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
    const [foundNode, setFoundNode] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Initialize with a random number
    useEffect(() => {
        generateRandom();
    }, []);

    // --- HELPERS ---
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const generateRandom = () => {
        setInputValue(Math.floor(Math.random() * 99) + 1);
    };

    // Re-calculate X/Y coordinates for the entire tree
    const updatePositions = (node: TreeNode | null, x: number, y: number, offset: number) => {
        if (!node) return;
        node.x = x;
        node.y = y;
        // Reduce offset as we go deeper to prevent overlap
        updatePositions(node.left, x - offset, y + 80, offset * 0.55);
        updatePositions(node.right, x + offset, y + 80, offset * 0.55);
    };

    // --- ALGORITHMS ---

    const insert = async () => {
        if (inputValue === '' || isAnimating) return;
        const val = Number(inputValue);
        
        // Check for duplicate at root level for quick feedback
        if (root && root.value === val) {
            setLog(`Error: Duplicate value ${val}`);
            generateRandom();
            return;
        }

        setIsAnimating(true);
        setLog(`Inserting Value: ${val}...`);
        setVisitedNodes(new Set());

        if (!root) {
            const newNode = new TreeNode(val);
            newNode.x = 50;
            newNode.y = 50;
            setRoot(newNode);
            setLog(`Root Node ${val} Created`);
            setIsAnimating(false);
            generateRandom();
            return;
        }

        let current: TreeNode | null = root;
        const newVisited = new Set<string>();

        while (true) {
            setHighlightNode(current.id);
            newVisited.add(current.id);
            setVisitedNodes(new Set(newVisited));
            await sleep(400);

            if (val === current.value) {
                setLog(`Error: Value ${val} already exists.`);
                setIsAnimating(false);
                setHighlightNode(null);
                generateRandom();
                return;
            }

            if (val < current.value) {
                if (!current.left) {
                    current.left = new TreeNode(val);
                    setLog(`Inserted ${val} to Left of ${current.value}`);
                    break;
                }
                current = current.left;
            } else {
                if (!current.right) {
                    current.right = new TreeNode(val);
                    setLog(`Inserted ${val} to Right of ${current.value}`);
                    break;
                }
                current = current.right;
            }
        }

        // Recalculate layout
        updatePositions(root, 50, 50, 25);
        setRoot({ ...root }); // Trigger re-render
        
        setHighlightNode(null);
        setVisitedNodes(new Set());
        setIsAnimating(false);
        generateRandom(); // Auto-generate next value
    };

    const search = async () => {
        if (inputValue === '' || !root || isAnimating) return;
        const val = Number(inputValue);
        setIsAnimating(true);
        setLog(`Searching for Data: ${val}...`);
        setVisitedNodes(new Set());
        setFoundNode(null);

        let current: TreeNode | null = root;
        const newVisited = new Set<string>();
        let found = false;

        while (current) {
            setHighlightNode(current.id);
            newVisited.add(current.id);
            setVisitedNodes(new Set(newVisited));
            await sleep(500);

            if (current.value === val) {
                found = true;
                setFoundNode(current.id);
                setLog(`Target ${val} Found!`);
                break;
            }

            if (val < current.value) current = current.left;
            else current = current.right;
        }

        if (!found) setLog(`Target ${val} not found in tree.`);
        
        await sleep(1000);
        setHighlightNode(null);
        // Keep visited nodes highlighted for a moment
        setTimeout(() => {
            setVisitedNodes(new Set());
            setFoundNode(null);
            setIsAnimating(false);
        }, 1000);
    };

    // Helper for deletion
    const deleteNode = (node: TreeNode | null, val: number): TreeNode | null => {
        if (!node) return null;

        if (val < node.value) {
            node.left = deleteNode(node.left, val);
            return node;
        } else if (val > node.value) {
            node.right = deleteNode(node.right, val);
            return node;
        } else {
            // Case 1: No child
            if (!node.left && !node.right) return null;
            
            // Case 2: One child
            if (!node.left) return node.right;
            if (!node.right) return node.left;

            // Case 3: Two children (Find Min in Right Subtree)
            let temp = node.right;
            while (temp.left) temp = temp.left;
            
            node.value = temp.value;
            node.right = deleteNode(node.right, temp.value);
            return node;
        }
    };

    const remove = () => {
        if (inputValue === '' || !root || isAnimating) return;
        const val = Number(inputValue);
        setLog(`Removing Node: ${val}`);
        
        const newRoot = deleteNode(root, val);
        updatePositions(newRoot, 50, 50, 25);
        setRoot(newRoot ? { ...newRoot } : null);
        setLog(`Node ${val} removed (if existed).`);
        generateRandom();
    };

    const reset = () => {
        setRoot(null);
        setLog('Tree Structure Cleared');
        setVisitedNodes(new Set());
        setFoundNode(null);
        generateRandom();
    };

    // Traversal Animation Helper
    const traverse = async (type: 'in' | 'pre' | 'post') => {
        if (!root || isAnimating) return;
        setIsAnimating(true);
        setLog(`Starting ${type.toUpperCase()}-ORDER Traversal...`);
        setVisitedNodes(new Set());
        const sequence: string[] = [];

        const inOrder = (n: TreeNode | null) => {
            if(!n) return;
            inOrder(n.left);
            sequence.push(n.id);
            inOrder(n.right);
        };
        const preOrder = (n: TreeNode | null) => {
            if(!n) return;
            sequence.push(n.id);
            preOrder(n.left);
            preOrder(n.right);
        };
        const postOrder = (n: TreeNode | null) => {
            if(!n) return;
            postOrder(n.left);
            postOrder(n.right);
            sequence.push(n.id);
        };

        if (type === 'in') inOrder(root);
        else if (type === 'pre') preOrder(root);
        else postOrder(root);

        const displayedVisited = new Set<string>();
        for (const id of sequence) {
            setHighlightNode(id);
            displayedVisited.add(id);
            setVisitedNodes(new Set(displayedVisited));
            await sleep(600);
        }

        setLog('Traversal Complete');
        setHighlightNode(null);
        setTimeout(() => {
            setVisitedNodes(new Set());
            setIsAnimating(false);
        }, 1000);
    };

    // --- RENDERERS ---

    // Recursive Lines
    const renderEdges = (node: TreeNode | null): JSX.Element[] => {
        if (!node) return [];
        const edges = [];
        if (node.left) {
            edges.push(
                <motion.line 
                    key={`${node.id}-left`}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    x1={`${node.x}%`} y1={node.y} 
                    x2={`${node.left.x}%`} y2={node.left.y} 
                    stroke="#333" strokeWidth="2"
                />
            );
            edges.push(...renderEdges(node.left));
        }
        if (node.right) {
            edges.push(
                <motion.line 
                    key={`${node.id}-right`}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    x1={`${node.x}%`} y1={node.y} 
                    x2={`${node.right.x}%`} y2={node.right.y} 
                    stroke="#333" strokeWidth="2"
                />
            );
            edges.push(...renderEdges(node.right));
        }
        return edges;
    };

    // Recursive Nodes
    const renderNodes = (node: TreeNode | null): JSX.Element[] => {
        if (!node) return [];
        
        const isVisited = visitedNodes.has(node.id);
        const isActive = highlightNode === node.id;
        const isFound = foundNode === node.id;

        const nodes = [
            <motion.div
                key={node.id}
                initial={{ scale: 0 }}
                animate={{ 
                    scale: isActive ? 1.2 : 1,
                    backgroundColor: isFound ? '#00ff88' : isActive ? '#00f5ff' : isVisited ? '#00f5ff' : '#0a0a1a',
                    borderColor: isFound ? '#00ff88' : isActive ? '#00f5ff' : isVisited ? '#00f5ff' : '#444'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center border-2 text-xs font-bold font-mono z-20 shadow-lg`}
                style={{ 
                    left: `${node.x}%`, 
                    top: node.y,
                    boxShadow: isActive ? '0 0 30px rgba(0,245,255,0.6)' : isFound ? '0 0 30px rgba(0,255,136,0.8)' : 'none',
                    color: (isActive || isVisited || isFound) ? '#000' : '#888'
                }}
            >
                {node.value}
            </motion.div>
        ];
        nodes.push(...renderNodes(node.left));
        nodes.push(...renderNodes(node.right));
        return nodes;
    };

    return (
        <div className="w-full h-full flex flex-col lg:flex-row bg-[#050510] overflow-hidden text-white font-sans">
            
            {/* --- SIDEBAR --- */}
            <div className="w-full lg:w-80 h-auto flex-shrink-0 bg-[#0a0a1a] border-r border-[#00f5ff]/20 flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-black/20">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-[#00f5ff]/10 rounded-lg border border-[#00f5ff]/30 text-[#00f5ff]">
                            <Binary size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold font-mono tracking-wider text-white">BST_ENGINE</h2>
                            <div className="text-[10px] text-gray-500 font-mono">BINARY SEARCH PROTOCOL</div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                    
                    {/* Input Area */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest flex items-center gap-2">
                            <Zap size={12}/> Node Value
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                value={inputValue} 
                                onChange={(e) => setInputValue(e.target.value === '' ? '' : Number(e.target.value))}
                                onKeyDown={(e) => e.key === 'Enter' && insert()}
                                className="w-full bg-[#050510] border border-white/10 rounded-lg p-3 text-sm font-mono text-[#00f5ff] focus:border-[#00f5ff] outline-none shadow-inner"
                                placeholder="Value..."
                            />
                            <button 
                                onClick={generateRandom}
                                className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-gray-400"
                                title="Randomize"
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Primary Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={insert} 
                            disabled={isAnimating}
                            className="col-span-2 py-3 bg-[#00f5ff]/10 border border-[#00f5ff]/50 hover:bg-[#00f5ff]/20 text-[#00f5ff] rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(0,245,255,0.1)]"
                        >
                            <Plus size={16} /> INSERT NODE
                        </button>
                        <button 
                            onClick={search} 
                            disabled={isAnimating}
                            className="py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            <Search size={14} /> SEARCH
                        </button>
                        <button 
                            onClick={remove} 
                            disabled={isAnimating}
                            className="py-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            <Trash2 size={14} /> DELETE
                        </button>
                    </div>

                    {/* Traversals */}
                    <div className="pt-4 border-t border-white/5 space-y-3">
                         <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <GitBranch size={12}/> Traversal Sequence
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['in', 'pre', 'post'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => traverse(t as any)}
                                    disabled={isAnimating}
                                    className="py-2 rounded bg-black/40 border border-white/10 text-[10px] font-mono uppercase hover:border-[#00f5ff] hover:text-[#00f5ff] transition-colors disabled:opacity-30"
                                >
                                    {t}-Order
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reset */}
                    <button onClick={reset} className="w-full py-3 bg-red-900/5 border border-red-900/20 text-red-700 hover:bg-red-900/10 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all mt-4">
                        <Layers size={14} /> FLUSH MEMORY
                    </button>
                </div>

                {/* Console Log */}
                <div className="p-4 bg-black/60 border-t border-white/10 font-mono text-[10px]">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
                        SYSTEM_LOG
                    </div>
                    <div className="text-[#00ff88] truncate">{log}</div>
                </div>
            </div>

            {/* --- CANVAS WORKSPACE --- */}
            <div className="flex-1 relative bg-[#050510] overflow-hidden">
                {/* Grid Background */}
                <div className="absolute inset-0 pointer-events-none opacity-20" 
                    style={{ 
                        backgroundImage: 'linear-gradient(#1a1a2e 1px, transparent 1px), linear-gradient(90deg, #1a1a2e 1px, transparent 1px)', 
                        backgroundSize: '40px 40px' 
                    }} 
                />

                <div className="relative w-full h-full overflow-auto custom-scrollbar">
                    {/* SVG Connections Layer */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 min-h-[800px] min-w-[800px]">
                        {renderEdges(root)}
                    </svg>

                    {/* Node Layer */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none z-10 min-h-[800px] min-w-[800px]">
                        <AnimatePresence>
                            {renderNodes(root)}
                        </AnimatePresence>
                    </div>

                    {root === null && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 font-mono opacity-50">
                            <Binary size={48} className="mb-4 text-gray-700" />
                            <p className="text-sm">[ MEMORY_EMPTY :: INITIALIZE_ROOT ]</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BSTVisualizer;