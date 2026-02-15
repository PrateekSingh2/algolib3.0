import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, Play, RotateCcw, Plus, MousePointer2 } from 'lucide-react';

// --- TYPES ---
type Node = { id: string; x: number; y: number };
type Edge = { source: string; target: string; weight: number };
type Algorithm = 'bfs' | 'dijkstra';

const GraphVisualizer = () => {
  // --- STATE ---
  const [nodes, setNodes] = useState<Node[]>([
      { id: 'A', x: 200, y: 150 }, { id: 'B', x: 400, y: 100 },
      { id: 'C', x: 400, y: 300 }, { id: 'D', x: 600, y: 200 }
  ]);
  const [edges, setEdges] = useState<Edge[]>([
      { source: 'A', target: 'B', weight: 4 },
      { source: 'A', target: 'C', weight: 2 },
      { source: 'B', target: 'D', weight: 5 },
      { source: 'C', target: 'D', weight: 1 }
  ]);
  
  const [mode, setMode] = useState<'move' | 'addNode' | 'addEdge'>('move');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [startNodeId, setStartNodeId] = useState('A');
  const [algo, setAlgo] = useState<Algorithm>('dijkstra');
  
  // Animation State
  const [visited, setVisited] = useState<string[]>([]);
  const [path, setPath] = useState<string[]>([]); // For final path
  const [isAnimating, setIsAnimating] = useState(false);
  const [log, setLog] = useState<string>('Ready');

  const canvasRef = useRef<HTMLDivElement>(null);

  // --- ACTIONS (Logic Identical) ---
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (mode === 'addNode' && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = String.fromCharCode(65 + nodes.length); // A, B, C...
        setNodes([...nodes, { id, x, y }]);
    }
    if (mode === 'move') {
        setSelectedNode(null);
    }
  };

  const handleNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (mode === 'addEdge') {
        if (!selectedNode) {
            setSelectedNode(id);
        } else if (selectedNode !== id) {
            if (!edges.find(edge => (edge.source === selectedNode && edge.target === id) || (edge.source === id && edge.target === selectedNode))) {
                setEdges([...edges, { source: selectedNode, target: id, weight: Math.floor(Math.random()*9)+1 }]);
            }
            setSelectedNode(null);
        }
    } else if (mode === 'move') {
        // Drag logic omitted for brevity
    }
  };

  const runBFS = async () => {
    setIsAnimating(true);
    setVisited([]); setPath([]);
    const queue = [startNodeId];
    const localVisited = new Set([startNodeId]);
    const history: string[] = [];
    setLog(`BFS Started from ${startNodeId}`);
    while(queue.length > 0) {
        const curr = queue.shift()!;
        history.push(curr);
        setVisited([...history]);
        setLog(`Visiting ${curr}`);
        await sleep(800);
        const neighbors = edges
            .filter(e => e.source === curr || e.target === curr)
            .map(e => e.source === curr ? e.target : e.source);
        for(let n of neighbors) {
            if(!localVisited.has(n)) {
                localVisited.add(n);
                queue.push(n);
            }
        }
    }
    setLog('BFS Complete');
    setIsAnimating(false);
  };

  const runDijkstra = async () => {
    setIsAnimating(true);
    setVisited([]); setPath([]);
    setLog(`Dijkstra from ${startNodeId}`);
    const dist: Record<string, number> = {};
    const unvisited = new Set(nodes.map(n => n.id));
    nodes.forEach(n => dist[n.id] = Infinity);
    dist[startNodeId] = 0;
    while(unvisited.size > 0) {
        let curr: string | null = null;
        let minDist = Infinity;
        unvisited.forEach(nodeId => {
            if(dist[nodeId] < minDist) {
                minDist = dist[nodeId];
                curr = nodeId;
            }
        });
        if (curr === null || minDist === Infinity) break;
        unvisited.delete(curr);
        setVisited(prevV => [...prevV, curr!]);
        setLog(`Processing ${curr} (Dist: ${minDist})`);
        await sleep(800);
        const neighbors = edges.filter(e => e.source === curr || e.target === curr);
        for(let edge of neighbors) {
            const neighbor = edge.source === curr ? edge.target : edge.source;
            if(unvisited.has(neighbor)) {
                const alt = dist[curr!] + edge.weight;
                if(alt < dist[neighbor]) {
                    dist[neighbor] = alt;
                }
            }
        }
    }
    setIsAnimating(false);
    setLog('Shortest Paths Calculated');
  };

  const reset = () => {
    setVisited([]);
    setPath([]);
    setLog('Graph Reset');
    setNodes([
        { id: 'A', x: 200, y: 150 }, { id: 'B', x: 400, y: 100 },
        { id: 'C', x: 400, y: 300 }, { id: 'D', x: 600, y: 200 }
    ]);
    setEdges([
        { source: 'A', target: 'B', weight: 4 },
        { source: 'A', target: 'C', weight: 2 },
        { source: 'B', target: 'D', weight: 5 },
        { source: 'C', target: 'D', weight: 1 }
    ]);
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-neutral-950 overflow-hidden font-sans">
        
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
                <Network size={18} className="text-[#9d00ff]" />
                <span className="font-mono text-xs tracking-widest">GRAPH_ENGINE</span>
            </div>

            {/* Mode Select */}
            <div className="flex bg-black/30 p-1 rounded-lg border border-white/5">
                {[
                    { id: 'move', icon: MousePointer2 }, 
                    { id: 'addNode', icon: Plus }, 
                ].map((m: any) => (
                     <button
                        key={m.id}
                        onClick={() => setMode(m.id as any)}
                        className={`flex-1 py-2 rounded flex justify-center transition-colors ${
                            mode === m.id ? 'bg-[#9d00ff] text-white' : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                     >
                        <m.icon size={16} />
                     </button>
                ))}
            </div>

            <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                <div>
                     <label className="text-[10px] font-mono text-neutral-500 uppercase">Start Node</label>
                     <select 
                        value={startNodeId}
                        onChange={(e) => setStartNodeId(e.target.value)}
                        className="w-full mt-1 bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white"
                     >
                        {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                     </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setAlgo('bfs')}
                        className={`py-2 text-[10px] font-bold border rounded ${algo === 'bfs' ? 'border-[#9d00ff] text-[#9d00ff]' : 'border-neutral-700 text-neutral-500'}`}
                    >BFS</button>
                    <button 
                        onClick={() => setAlgo('dijkstra')}
                        className={`py-2 text-[10px] font-bold border rounded ${algo === 'dijkstra' ? 'border-[#9d00ff] text-[#9d00ff]' : 'border-neutral-700 text-neutral-500'}`}
                    >DIJKSTRA</button>
                </div>
            </div>

            <button onClick={algo === 'bfs' ? runBFS : runDijkstra} disabled={isAnimating} className="w-full py-3 bg-[#9d00ff]/10 border border-[#9d00ff]/50 hover:bg-[#9d00ff]/20 text-[#9d00ff] rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all">
                <Play size={16} /> RUN ALGORITHM
            </button>
            <button onClick={reset} className="w-full py-3 bg-neutral-800 text-neutral-400 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-neutral-700">
                <RotateCcw size={16} /> RESET GRAPH
            </button>

            <div className="mt-auto p-4 bg-black/40 rounded border border-white/5 font-mono text-xs text-center text-[#9d00ff]">
                {log}
            </div>
        </div>

        {/* CANVAS */}
        <div 
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="flex-1 relative bg-neutral-950 overflow-hidden cursor-crosshair min-h-0"
        >
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
             
             {/* SVG Edges */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none">
                 {edges.map((edge, i) => {
                     const start = nodes.find(n => n.id === edge.source)!;
                     const end = nodes.find(n => n.id === edge.target)!;
                     const isTraversed = visited.includes(edge.source) && visited.includes(edge.target);
                     
                     return (
                         <g key={i}>
                             <line 
                                x1={start.x} y1={start.y} x2={end.x} y2={end.y} 
                                stroke={isTraversed ? '#9d00ff' : '#444'} 
                                strokeWidth={isTraversed ? 3 : 2}
                                className="transition-all duration-500"
                             />
                             <text 
                                x={(start.x + end.x)/2} y={(start.y + end.y)/2 - 5} 
                                fill="#666" fontSize="10" className="font-mono"
                             >{edge.weight}</text>
                         </g>
                     );
                 })}
             </svg>

             {/* Nodes */}
             {nodes.map(node => {
                 const isVisited = visited.includes(node.id);
                 return (
                    <motion.div
                        key={node.id}
                        layout
                        onClick={(e) => handleNodeClick(e, node.id)}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, backgroundColor: isVisited ? '#9d00ff' : '#1a1a1a' }}
                        className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center border-2 z-10 cursor-pointer transition-colors duration-300 ${
                            isVisited ? 'border-white text-white shadow-[0_0_20px_#9d00ff]' : 
                            selectedNode === node.id ? 'border-[#9d00ff] text-[#9d00ff]' : 'border-neutral-600 text-neutral-400'
                        }`}
                        style={{ left: node.x, top: node.y }}
                    >
                        <span className="font-bold font-mono">{node.id}</span>
                    </motion.div>
                 );
             })}

             {mode === 'addNode' && (
                 <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full border border-white/10 text-xs text-neutral-400 font-mono">
                    Click anywhere to add Node
                 </div>
             )}
        </div>

    </div>
  );
};

export default GraphVisualizer;