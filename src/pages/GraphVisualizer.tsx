import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Play, RotateCcw, Plus, MousePointer2, 
  Move, Share2, Zap, Trash2, Info
} from 'lucide-react';

// --- TYPES ---
type Node = { id: string; x: number; y: number };
type Edge = { source: string; target: string; weight: number; id: string };
type Mode = 'move' | 'addNode' | 'addEdge';

const GraphVisualizer = () => {
  // --- STATE ---
  const [nodes, setNodes] = useState<Node[]>([
      { id: 'A', x: 250, y: 150 }, { id: 'B', x: 450, y: 100 },
      { id: 'C', x: 450, y: 350 }, { id: 'D', x: 700, y: 250 },
      { id: 'E', x: 250, y: 350 }
  ]);
  const [edges, setEdges] = useState<Edge[]>([
      { source: 'A', target: 'B', weight: 4, id: 'A-B' },
      { source: 'A', target: 'E', weight: 2, id: 'A-E' },
      { source: 'B', target: 'D', weight: 8, id: 'B-D' },
      { source: 'C', target: 'D', weight: 3, id: 'C-D' },
      { source: 'E', target: 'C', weight: 5, id: 'E-C' },
  ]);

  // Interaction State
  const [mode, setMode] = useState<Mode>('move');
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragStartNode, setDragStartNode] = useState<string | null>(null); 
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); 
  const [startNodeId, setStartNodeId] = useState('A');
  const [targetNodeId, setTargetNodeId] = useState('D');

  // Animation State
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [path, setPath] = useState<string[]>([]); // Final shortest path
  const [activeEdge, setActiveEdge] = useState<string | null>(null); // Currently traversing edge
  const [isAnimating, setIsAnimating] = useState(false);
  const [log, setLog] = useState<string>('System Ready');

  const canvasRef = useRef<HTMLDivElement>(null);

  // --- HELPERS ---
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  // Smart ID Generator (A..Z, then AA..ZZ)
  const generateNodeId = (): string => {
    let index = 0;
    while (true) {
        let id = "";
        let temp = index;
        
        do {
            const remainder = temp % 26;
            id = String.fromCharCode(65 + remainder) + id;
            temp = Math.floor(temp / 26) - 1;
        } while (temp >= 0);

        if (!nodes.some(n => n.id === id)) return id;
        index++;
    }
  };

  // --- HANDLERS ---
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (mode === 'addNode' && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (nodes.some(n => Math.hypot(n.x - x, n.y - y) < 50)) return;
        
        const id = generateNodeId();
        setNodes([...nodes, { id, x, y }]);
        setLog(`Node ${id} added.`);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Dragging Logic
    if (mode === 'move' && draggingNode) {
        setNodes(prev => prev.map(n => n.id === draggingNode ? { ...n, x, y } : n));
    }
  };

  const handleGlobalMouseUp = () => {
    setDraggingNode(null);
    setDragStartNode(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent canvas click
    if (mode === 'move') {
        setDraggingNode(id);
    } else if (mode === 'addEdge') {
        setDragStartNode(id);
    }
  };

  const handleNodeMouseUp = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation(); // Prevent triggering canvas events
    
    // FIX: Ensure dragging stops even if mouse is released over a node
    if (mode === 'move') {
        setDraggingNode(null);
    } 
    else if (mode === 'addEdge' && dragStartNode && dragStartNode !== targetId) {
        const exists = edges.some(e => 
            (e.source === dragStartNode && e.target === targetId) || 
            (e.source === targetId && e.target === dragStartNode)
        );
        if (!exists) {
            const weight = Math.floor(Math.random() * 9) + 1;
            setEdges([...edges, { 
                source: dragStartNode, target: targetId, weight, id: `${dragStartNode}-${targetId}`
            }]);
            setLog(`Link: ${dragStartNode} <-> ${targetId}`);
        }
    }
    setDragStartNode(null);
  };

  // --- ALGORITHMS ---

  const runBFS = async () => {
    if (isAnimating) return;
    resetVisuals();
    setIsAnimating(true);
    setLog(`Initializing BFS: ${startNodeId} -> ${targetNodeId}...`);

    const queue = [startNodeId];
    const visitedSet = new Set<string>();
    const parent: Record<string, string | null> = {};

    visitedSet.add(startNodeId);
    setVisited(new Set([startNodeId]));
    parent[startNodeId] = null;

    let found = false;

    while (queue.length > 0) {
        const current = queue.shift()!;
        setLog(`Scanning: ${current}`);
        await sleep(500);

        if (current === targetNodeId) {
            found = true;
            break;
        }

        const neighbors = edges
            .filter(e => e.source === current || e.target === current)
            .map(e => ({ 
                id: e.source === current ? e.target : e.source, 
                edgeId: e.id 
            }));

        for (const { id, edgeId } of neighbors) {
            if (!visitedSet.has(id)) {
                setActiveEdge(edgeId); 
                await sleep(200);
                visitedSet.add(id);
                parent[id] = current;
                setVisited(new Set(visitedSet));
                queue.push(id);
            }
        }
    }

    if (found) {
        const pathStack = [];
        let curr: string | null = targetNodeId;
        while (curr !== null) {
            pathStack.unshift(curr);
            curr = parent[curr] || null;
            if (curr === startNodeId) {
                pathStack.unshift(curr);
                break;
            }
        }
        setPath(pathStack);
        setLog(`BFS Path Found: ${pathStack.join(' -> ')}`);
    } else {
        setLog('Target Unreachable via BFS.');
    }

    setActiveEdge(null);
    setIsAnimating(false);
  };

  const runDijkstra = async () => {
    if (isAnimating) return;
    resetVisuals();
    setIsAnimating(true);
    setLog(`Dijkstra: ${startNodeId} -> ${targetNodeId}`);

    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const unvisited = new Set(nodes.map(n => n.id));

    nodes.forEach(n => distances[n.id] = Infinity);
    distances[startNodeId] = 0;

    while (unvisited.size > 0) {
        let current: string | null = null;
        let minInfo = Infinity;
        
        unvisited.forEach(id => {
            if (distances[id] < minInfo) {
                minInfo = distances[id];
                current = id;
            }
        });

        if (current === null || distances[current] === Infinity) break;
        if (current === targetNodeId) break;

        unvisited.delete(current);
        setVisited(prev => new Set(prev).add(current!));
        setLog(`Analyzing ${current} (Cost: ${distances[current]})`);
        await sleep(500);

        const neighbors = edges.filter(e => e.source === current || e.target === current);
        for (let edge of neighbors) {
            const neighbor = edge.source === current ? edge.target : edge.source;
            if (unvisited.has(neighbor)) {
                setActiveEdge(edge.id);
                await sleep(200);
                
                const alt = distances[current] + edge.weight;
                if (alt < distances[neighbor]) {
                    distances[neighbor] = alt;
                    previous[neighbor] = current;
                }
            }
        }
    }

    if (previous[targetNodeId] || startNodeId === targetNodeId) {
        const pathStack = [];
        let u: string | null = targetNodeId;
        while (u) {
            pathStack.unshift(u);
            u = previous[u] || null;
            if (u === startNodeId) {
                pathStack.unshift(u);
                break;
            }
        }
        setPath(pathStack);
        setLog(`Shortest Path: ${pathStack.join(' -> ')}`);
    } else {
        setLog('Target Unreachable.');
    }

    setActiveEdge(null);
    setIsAnimating(false);
  };

  const resetVisuals = () => {
    setVisited(new Set());
    setPath([]);
    setActiveEdge(null);
  };

  const resetGraph = () => {
    setNodes([
        { id: 'A', x: 250, y: 150 }, { id: 'B', x: 450, y: 100 },
        { id: 'C', x: 450, y: 350 }, { id: 'D', x: 700, y: 250 }
    ]);
    setEdges([
        { source: 'A', target: 'B', weight: 4, id: 'A-B' },
        { source: 'B', target: 'D', weight: 8, id: 'B-D' },
        { source: 'C', target: 'D', weight: 3, id: 'C-D' }
    ]);
    setLog('System Reset');
    resetVisuals();
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-[#050510] overflow-hidden font-sans text-white">
        
        {/* --- SIDEBAR --- */}
        <div className="w-full lg:w-80 h-auto flex-shrink-0 bg-[#0a0a1a] border-r border-[#00f5ff]/20 flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
            
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-[#00f5ff]/10 rounded-lg border border-[#00f5ff]/30 text-[#00f5ff]">
                        <Network size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold font-mono tracking-wider text-white">GRAPH_ENGINE</h2>
                        <div className="text-[10px] text-gray-500 font-mono">NEURAL NET SIMULATION</div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                
                {/* Mode Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest flex items-center gap-2">
                        <MousePointer2 size={12}/> Interaction Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
                        {[
                            { id: 'move', icon: Move, label: 'Move' }, 
                            { id: 'addNode', icon: Plus, label: 'Add Node' },
                            { id: 'addEdge', icon: Share2, label: 'Connect' }
                        ].map((m) => (
                             <button
                                key={m.id}
                                onClick={() => setMode(m.id as Mode)}
                                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg transition-all duration-300 ${
                                    mode === m.id 
                                    ? 'bg-[#00f5ff] text-black shadow-[0_0_15px_rgba(0,245,255,0.4)]' 
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                             >
                                <m.icon size={18} />
                                <span className="text-[9px] font-bold font-mono uppercase">{m.label}</span>
                             </button>
                        ))}
                    </div>
                </div>

                {/* Algorithm Controls */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                     <div className="flex justify-between items-end">
                        <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest flex items-center gap-2">
                            <Zap size={12}/> Run Protocol
                        </label>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                             <span className="text-[9px] text-gray-500 font-mono uppercase">Start Node</span>
                             <select 
                                value={startNodeId}
                                onChange={(e) => setStartNodeId(e.target.value)}
                                className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-xs font-mono outline-none focus:border-[#00f5ff]"
                             >
                                {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                             </select>
                        </div>
                        <div className="space-y-1">
                             <span className="text-[9px] text-gray-500 font-mono uppercase">Target Node</span>
                             <select 
                                value={targetNodeId}
                                onChange={(e) => setTargetNodeId(e.target.value)}
                                className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-xs font-mono outline-none focus:border-[#00f5ff]"
                             >
                                {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                             </select>
                        </div>
                     </div>

                     <div className="flex gap-2">
                        <button 
                            onClick={runBFS} 
                            disabled={isAnimating}
                            className="flex-1 py-3 bg-[#9d00ff]/10 border border-[#9d00ff]/50 hover:bg-[#9d00ff]/20 text-[#9d00ff] rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            BFS SCAN
                        </button>
                        <button 
                            onClick={runDijkstra}
                            disabled={isAnimating} 
                            className="flex-1 py-3 bg-[#00f5ff]/10 border border-[#00f5ff]/50 hover:bg-[#00f5ff]/20 text-[#00f5ff] rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            DIJKSTRA
                        </button>
                     </div>
                </div>

                {/* Reset */}
                <button onClick={resetGraph} className="w-full py-3 bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all">
                    <RotateCcw size={14} /> SYSTEM RESET
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
        <div 
            className="flex-1 relative bg-[#050510] overflow-hidden cursor-crosshair select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleGlobalMouseUp}
            onMouseLeave={handleGlobalMouseUp}
        >
             {/* Grid Background */}
             <div className="absolute inset-0 pointer-events-none opacity-20" 
                  style={{ 
                      backgroundImage: 'linear-gradient(#1a1a2e 1px, transparent 1px), linear-gradient(90deg, #1a1a2e 1px, transparent 1px)', 
                      backgroundSize: '40px 40px' 
                  }} 
             />
             
             {/* Click Area */}
             <div 
                ref={canvasRef}
                className="absolute inset-0 z-0" 
                onClick={handleCanvasClick}
             />

             <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                 {/* EDGES */}
                 {edges.map((edge) => {
                     const start = nodes.find(n => n.id === edge.source)!;
                     const end = nodes.find(n => n.id === edge.target)!;
                     if(!start || !end) return null;

                     const isPath = path.includes(edge.source) && path.includes(edge.target) && 
                                    (path.indexOf(edge.source) === path.indexOf(edge.target) - 1 || path.indexOf(edge.target) === path.indexOf(edge.source) - 1);
                     const isActive = activeEdge === edge.id;

                     return (
                         <g key={edge.id}>
                             <line 
                                x1={start.x} y1={start.y} x2={end.x} y2={end.y} 
                                stroke={isPath ? '#00f5ff' : isActive ? '#9d00ff' : '#333'} 
                                strokeWidth={isPath || isActive ? 3 : 2}
                                className="transition-all duration-300"
                             />
                             <g transform={`translate(${(start.x + end.x)/2}, ${(start.y + end.y)/2})`}>
                                 <rect x="-10" y="-10" width="20" height="20" fill="#050510" rx="4" />
                                 <text x="0" y="4" textAnchor="middle" fill={isPath ? '#00f5ff' : '#666'} fontSize="10" className="font-mono font-bold">{edge.weight}</text>
                             </g>
                         </g>
                     );
                 })}
                 
                 {/* Drag Line */}
                 {mode === 'addEdge' && dragStartNode && (
                     <line 
                        x1={nodes.find(n => n.id === dragStartNode)?.x} 
                        y1={nodes.find(n => n.id === dragStartNode)?.y} 
                        x2={mousePos.x} y2={mousePos.y} 
                        stroke="#00f5ff" strokeWidth="2" strokeDasharray="5,5" className="opacity-50"
                     />
                 )}
             </svg>

             {/* NODES */}
             <AnimatePresence>
             {nodes.map(node => {
                 const isVisited = visited.has(node.id);
                 const isPathNode = path.includes(node.id);

                 return (
                    <motion.div
                        key={node.id}
                        initial={{ scale: 0 }}
                        animate={{ 
                            scale: 1, 
                            backgroundColor: isPathNode ? '#00f5ff' : isVisited ? '#9d00ff' : '#0a0a1a',
                            borderColor: isPathNode ? '#00f5ff' : isVisited ? '#9d00ff' : '#444'
                        }}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                        className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center border-2 z-20 cursor-pointer shadow-lg transition-shadow duration-300 group ${mode === 'move' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
                        style={{ 
                            left: node.x, top: node.y,
                            boxShadow: isPathNode ? '0 0 30px rgba(0,245,255,0.6)' : isVisited ? '0 0 20px rgba(157,0,255,0.4)' : 'none'
                        }}
                    >
                        <span className={`font-bold font-mono text-xs ${isPathNode || isVisited ? 'text-black' : 'text-gray-400 group-hover:text-white'}`}>
                            {node.id}
                        </span>
                    </motion.div>
                 );
             })}
             </AnimatePresence>

             {/* Legend */}
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-xs text-gray-400 font-mono pointer-events-none z-30">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#00f5ff]"/> PATH</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#9d00ff]"/> VISITED</span>
             </div>

        </div>
    </div>
  );
};

export default GraphVisualizer;