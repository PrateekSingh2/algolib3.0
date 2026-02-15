import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Binary, RotateCcw } from 'lucide-react';

// --- TYPES (Same as before) ---
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
    const [root, setRoot] = useState<TreeNode | null>(null);
    const [inputValue, setInputValue] = useState<number | ''>('');
    const [message, setMessage] = useState('Ready');
    const [highlightId, setHighlightId] = useState<string | null>(null);
    const [path, setPath] = useState<string[]>([]); 
    const [isAnimating, setIsAnimating] = useState(false);

    // Tree Layout Calculation
    const updatePositions = (node: TreeNode | null, x: number, y: number, offset: number) => {
        if (!node) return;
        node.x = x;
        node.y = y;
        updatePositions(node.left, x - offset, y + 60, offset / 2);
        updatePositions(node.right, x + offset, y + 60, offset / 2);
    };

    const refreshTree = (r: TreeNode | null) => {
        if (r) updatePositions(r, 50, 10, 25); 
        setRoot(r ? { ...r } : null); 
    };

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    // --- OPERATIONS (Logic Identical) ---
    const insert = async () => {
        if (inputValue === '' || isAnimating) return;
        setIsAnimating(true);
        const val = Number(inputValue);
        setMessage(`Inserting ${val}...`);
        
        if (!root) {
            const newNode = new TreeNode(val);
            refreshTree(newNode);
            setIsAnimating(false);
            setMessage(`Inserted Root ${val}`);
            setInputValue('');
            return;
        }

        let curr: TreeNode | null = root;
        const newPath: string[] = [];
        
        while (curr) {
            newPath.push(curr.id);
            setPath([...newPath]);
            setHighlightId(curr.id);
            await sleep(500);

            if (val === curr.value) {
                setMessage('Duplicate value found');
                setIsAnimating(false);
                setPath([]);
                return;
            }
            if (val < curr.value) {
                if (!curr.left) {
                    curr.left = new TreeNode(val);
                    break;
                }
                curr = curr.left;
            } else {
                if (!curr.right) {
                    curr.right = new TreeNode(val);
                    break;
                }
                curr = curr.right;
            }
        }
        refreshTree(root);
        setHighlightId(null);
        setPath([]);
        setIsAnimating(false);
        setMessage(`Inserted ${val}`);
        setInputValue('');
    };

    const search = async () => {
        if (inputValue === '' || isAnimating || !root) return;
        setIsAnimating(true);
        const val = Number(inputValue);
        setMessage(`Searching for ${val}...`);

        let curr: TreeNode | null = root;
        const newPath: string[] = [];

        while (curr) {
            newPath.push(curr.id);
            setPath([...newPath]);
            setHighlightId(curr.id);
            await sleep(600);

            if (curr.value === val) {
                setMessage(`Found ${val}!`);
                await sleep(1000);
                setPath([]);
                setHighlightId(null);
                setIsAnimating(false);
                return;
            }
            if (val < curr.value) curr = curr.left;
            else curr = curr.right;
        }
        setMessage(`${val} not found.`);
        setPath([]);
        setHighlightId(null);
        setIsAnimating(false);
    };

    const reset = () => {
        setRoot(null);
        setPath([]);
        setHighlightId(null);
        setMessage('Tree Reset');
    };

    // --- RENDER HELPERS ---
    const renderLinks = (node: TreeNode | null): JSX.Element[] => {
        if (!node) return [];
        const links = [];
        if (node.left) {
            links.push(
                <line key={`${node.id}-left`} x1={`${node.x}%`} y1={node.y + 20} x2={`${node.left.x}%`} y2={node.left.y + 20} stroke="#444" strokeWidth="2" />
            );
            links.push(...renderLinks(node.left));
        }
        if (node.right) {
            links.push(
                <line key={`${node.id}-right`} x1={`${node.x}%`} y1={node.y + 20} x2={`${node.right.x}%`} y2={node.right.y + 20} stroke="#444" strokeWidth="2" />
            );
            links.push(...renderLinks(node.right));
        }
        return links;
    };

    const renderNodes = (node: TreeNode | null): JSX.Element[] => {
        if (!node) return [];
        const isActive = node.id === highlightId;
        const isPath = path.includes(node.id);
        
        const nodes = [
            <motion.div
                key={node.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1, backgroundColor: isActive ? '#00f5ff' : isPath ? '#00f5ff40' : '#1e1e1e' }}
                className={`absolute w-10 h-10 rounded-full flex items-center justify-center border-2 text-xs font-bold font-mono z-10 transition-colors duration-300 ${
                    isActive ? 'border-white text-black shadow-[0_0_20px_#00f5ff]' : 
                    isPath ? 'border-[#00f5ff] text-white' : 'border-neutral-600 text-neutral-300 bg-neutral-900'
                }`}
                style={{ left: `calc(${node.x}% - 20px)`, top: node.y }}
            >
                {node.value}
            </motion.div>
        ];
        nodes.push(...renderNodes(node.left));
        nodes.push(...renderNodes(node.right));
        return nodes;
    };

    return (
        <div className="w-full h-full flex flex-col lg:flex-row bg-neutral-950 overflow-hidden">
            {/* SIDEBAR */}
            <div className="
                w-full lg:w-72 
                h-auto max-h-[40%] lg:max-h-full lg:h-full
                flex-shrink-0
                bg-neutral-900 border-b lg:border-b-0 lg:border-r border-white/10 
                flex flex-col p-4 gap-4 
                z-20 shadow-2xl relative
                overflow-y-auto custom-scrollbar
            ">
                <div className="flex items-center gap-2 text-neutral-400 mb-2">
                    <Binary size={18} className="text-[#00f5ff]" />
                    <span className="font-mono text-xs tracking-widest">BST_CONTROLLER</span>
                </div>

                <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase">Input Value</label>
                    <input 
                        type="number" 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm focus:border-[#00f5ff] outline-none text-white font-mono"
                        placeholder="Enter Integer"
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <button onClick={insert} disabled={isAnimating} className="w-full py-3 bg-[#00f5ff]/10 border border-[#00f5ff]/50 hover:bg-[#00f5ff]/20 text-[#00f5ff] rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                        <Plus size={16} /> INSERT NODE
                    </button>
                    <button onClick={search} disabled={isAnimating} className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all">
                        <Search size={16} /> SEARCH
                    </button>
                    <button onClick={reset} disabled={isAnimating} className="w-full py-3 bg-red-900/10 border border-red-500/30 text-red-400 hover:bg-red-900/20 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all mt-auto">
                        <RotateCcw size={16} /> RESET TREE
                    </button>
                </div>
                
                <div className="mt-auto p-4 bg-black/40 rounded border border-white/5 font-mono text-xs text-center text-[#00f5ff]">
                    {message}
                </div>
            </div>

            {/* CANVAS */}
            <div className="flex-1 relative bg-neutral-950 overflow-hidden min-h-0">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                
                <div className="relative w-full h-full overflow-auto">
                    {/* SVG Layer for Links */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {renderLinks(root)}
                    </svg>
                    {/* Div Layer for Nodes */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none">
                        {renderNodes(root)}
                    </div>
                </div>

                {root === null && (
                     <div className="absolute inset-0 flex items-center justify-center text-neutral-700 font-mono text-sm">
                        [ TREE_EMPTY :: ADD_NODES ]
                     </div>
                )}
            </div>
        </div>
    );
};

export default BSTVisualizer;