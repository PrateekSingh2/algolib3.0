import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Play, Pause, StepForward, StepBack, RotateCcw, Plus, 
  MousePointer2, Move, Share2, Zap, Trash2, Terminal, 
  Activity, Maximize2, Minimize2, Map, Navigation, Square, ShieldAlert, Crosshair, ArrowRight
} from 'lucide-react';

// --- TYPES & GAME STATE ---
type GraphNode = { id: string; x: number; y: number };
type GraphEdge = { source: string; target: string; weight: number; id: string };
type Mode = 'move' | 'addNode' | 'addEdge';
type CodeLine = { id: string; text: string; explanation: string; active: boolean };

type VisualFrame = {
  visited: Set<string>;
  path: string[];
  activeEdge: string | null;
  activeNode: string | null;
  nodeDistances: Record<string, number | null>;
  codeLines: CodeLine[];
  outputLog: string[];
  message: string;
};

// --- HINGLISH EXECUTION MATRIX ---
const SNIPPETS = {
  bfs: [
    { id: '1', text: 'queue.push(start);', explanation: 'Start node ko active scanning Queue mein daal diya.', active: false },
    { id: '2', text: 'current = queue.shift();', explanation: 'Queue se agla target nikala aur uspar Scanner bheja.', active: false },
    { id: '3', text: 'if (current == target) return PATH;', explanation: 'TARGET MIL GAYA! Shortest path lock kar liya.', active: false },
    { id: '4', text: 'for neighbor in current.edges:', explanation: 'Current node ke aaspas ke sabhi connected padosiyon ko dekho...', active: false },
    { id: '5', text: 'if (!visited) queue.push(neighbor);', explanation: 'Naye padosi mile! Inhe bhi aage scan karne ke liye Queue mein daalo.', active: false },
  ],
  dfs: [
    { id: '1', text: 'stack.push(start);', explanation: 'Start node ko active scanning Stack (LIFO) mein daala.', active: false },
    { id: '2', text: 'current = stack.pop();', explanation: 'Stack se sabse latest target (Deepest path) nikala.', active: false },
    { id: '3', text: 'if (current == target) return PATH;', explanation: 'TARGET REACHED! DFS path mil gaya.', active: false },
    { id: '4', text: 'for neighbor in current.edges:', explanation: 'Current node ke padosiyon ko scan karo...', active: false },
    { id: '5', text: 'if (!visited) stack.push(neighbor);', explanation: 'Naye padosi mile! Inhe Stack mein push karke depth mein jao.', active: false },
  ],
  dijkstra: [
    { id: '1', text: 'dist[start] = 0, others = ∞;', explanation: 'Start node ka distance 0, baaki sabka Infinity set kiya.', active: false },
    { id: '2', text: 'current = node with min dist;', explanation: 'Unvisited nodes mein se sabse saste (min distance) wale ko chuno.', active: false },
    { id: '3', text: 'if (current == target) return PATH;', explanation: 'TARGET REACHED! Sabse sasta rasta mil gaya.', active: false },
    { id: '4', text: 'alt = dist[current] + edge.wt;', explanation: 'Padosi tak pahunchne ka naya (Alternative) cost calculate karo.', active: false },
    { id: '5', text: 'if (alt < dist[neighbor]) update();', explanation: 'RELAXATION: Naya rasta sasta hai! Cost update karo.', active: false },
  ],
  astar: [
    { id: '1', text: 'g_score[start] = 0, f_score = h(start);', explanation: 'Start node ka actual distance(G) aur anumaan(H) set kiya.', active: false },
    { id: '2', text: 'current = node with min f_score;', explanation: 'Sabse promising node (lowest F-score) ko pehle explore karo.', active: false },
    { id: '3', text: 'if (current == target) return PATH;', explanation: 'TARGET REACHED! A* algorithm ne optimal path dhoond liya.', active: false },
    { id: '4', text: 'alt_g = g_score[current] + edge.wt;', explanation: 'Padosi tak jane ka naya G-score calculate karo.', active: false },
    { id: '5', text: 'if (alt_g < g_score[neighbor]) update();', explanation: 'Better rasta mil gaya! G-score aur Heuristic F-score dono update karo.', active: false },
  ]
};

const CyberGrid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-[#09090b]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(157,0,255,0.08),transparent_70%)]" />
  </div>
);

const GraphVisualizer = () => {
  // --- STATE ---
  const [nodes, setNodes] = useState<GraphNode[]>([
      { id: 'A', x: 150, y: 150 }, { id: 'B', x: 400, y: 80 },
      { id: 'C', x: 350, y: 300 }, { id: 'D', x: 650, y: 200 },
      { id: 'E', x: 150, y: 400 }, { id: 'F', x: 600, y: 400 },
      { id: 'G', x: 800, y: 320 }
  ]);
  const [edges, setEdges] = useState<GraphEdge[]>([
      { source: 'A', target: 'B', weight: 4, id: 'A-B' },
      { source: 'A', target: 'E', weight: 2, id: 'A-E' },
      { source: 'B', target: 'C', weight: 5, id: 'B-C' },
      { source: 'B', target: 'D', weight: 10, id: 'B-D' },
      { source: 'E', target: 'C', weight: 3, id: 'E-C' },
      { source: 'C', target: 'D', weight: 4, id: 'C-D' },
      { source: 'C', target: 'F', weight: 8, id: 'C-F' },
      { source: 'D', target: 'F', weight: 1, id: 'D-F' },
      { source: 'F', target: 'G', weight: 6, id: 'F-G' },
      { source: 'D', target: 'G', weight: 3, id: 'D-G' },
  ]);

  // UI & Interaction
  const [mode, setMode] = useState<Mode>('move');
  const [showHUD, setShowHUD] = useState(false); 
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragStartNode, setDragStartNode] = useState<string | null>(null); 
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); 
  const [startNodeId, setStartNodeId] = useState('A');
  const [targetNodeId, setTargetNodeId] = useState('G');

  // Engine Animation State
  const [engineMode, setEngineMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // FRAME-BASED ANIMATION ENGINE
  const [frames, setFrames] = useState<VisualFrame[]>([]);
  const [frameIdx, setFrameIdx] = useState<number>(0);

  // Visual Pathfinding Actors synced to frames
  const [codeLines, setCodeLines] = useState<CodeLine[]>(SNIPPETS.bfs);
  const [outputLog, setOutputLog] = useState<string[]>([]);
  const [message, setMessage] = useState('SYSTEM_IDLE: Map Loaded');
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [path, setPath] = useState<string[]>([]); 
  const [activeEdge, setActiveEdge] = useState<string | null>(null); 
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [nodeDistances, setNodeDistances] = useState<Record<string, number | null>>({});

  const canvasRef = useRef<HTMLDivElement>(null);
  const interpreterScrollRef = useRef<HTMLDivElement>(null);
  const outputScrollRef = useRef<HTMLDivElement>(null);

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
        setVisited(f.visited);
        setPath(f.path);
        setActiveEdge(f.activeEdge);
        setActiveNode(f.activeNode);
        setNodeDistances(f.nodeDistances);
        setCodeLines(f.codeLines);
        setOutputLog(f.outputLog);
        setMessage(f.message);
        
        if (frameIdx === frames.length - 1) {
            setIsAnimating(false);
        } else {
            setIsAnimating(true);
        }
    }
  }, [frameIdx, frames]);

  // Autoplay engine
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused && engineMode === 'AUTO' && isAnimating && frames.length > 0 && frameIdx < frames.length - 1) {
        timer = setTimeout(() => {
            setFrameIdx(prev => prev + 1);
        }, 1200);
    }
    return () => clearTimeout(timer);
  }, [isPaused, engineMode, isAnimating, frameIdx, frames]);

  const generateNodeId = (): string => {
      let index = 0;
      while (true) {
          let id = String.fromCharCode(65 + (index % 26));
          if (index >= 26) id += Math.floor(index / 26);
          if (!nodes.some(n => n.id === id)) return id;
          index++;
      }
  };

  // --- INTERACTION HANDLERS ---
  const handleCanvasClick = (e: React.MouseEvent) => {
      if (mode === 'addNode' && canvasRef.current && !isAnimating) {
          const rect = canvasRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          if (nodes.some(n => Math.hypot(n.x - x, n.y - y) < 60)) return; 
          const id = generateNodeId();
          setNodes([...nodes, { id, x, y }]);
          setOutputLog(prev => [...prev, `> Deployed new node [${id}]`]);
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });

      if (mode === 'move' && draggingNode && !isAnimating) {
          setNodes(prev => prev.map(n => n.id === draggingNode ? { ...n, x, y } : n));
      }
  };

  const handleGlobalMouseUp = () => {
      setDraggingNode(null);
      setDragStartNode(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault(); 
      if (isAnimating) return;
      if (mode === 'move') setDraggingNode(id);
      else if (mode === 'addEdge') setDragStartNode(id);
  };

  const handleNodeMouseUp = (e: React.MouseEvent, targetId: string) => {
      e.stopPropagation();
      e.preventDefault();
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
              setEdges([...edges, { source: dragStartNode, target: targetId, weight, id: `${dragStartNode}-${targetId}` }]);
              setOutputLog(prev => [...prev, `> Link Established: [${dragStartNode}] <-> [${targetId}] (Cost: ${weight})`]);
          }
      }
      setDragStartNode(null);
  };

  // --- ENGINE HELPERS ---
  const handleStop = () => {
      setIsAnimating(false);
      setIsPaused(false);
      setFrames([]);
      setCodeLines(codeLines.map(l => ({...l, active: false})));
      resetVisuals();
      setMessage('SYSTEM_HALTED');
      setOutputLog(prev => [...prev, '> ! OPERATION ABORTED BY USER !']);
  };

  const resetVisuals = () => {
      setVisited(new Set());
      setPath([]);
      setActiveEdge(null);
      setActiveNode(null);
      setNodeDistances({});
  };

  // --- ALGORITHMS ---
  const runBFS = () => {
      if (isAnimating || !nodes.find(n => n.id === startNodeId)) return;
      resetVisuals();
      setIsAnimating(true);
    //   if (!showHUD) setShowHUD(true);

      let newFrames: VisualFrame[] = [];
      let currentLog = [`> Initiating BFS Radar: [${startNodeId}] -> [${targetNodeId}]`];
      const snippet = SNIPPETS.bfs;

      const queue = [startNodeId];
      const visitedSet = new Set<string>([startNodeId]);
      const parent: Record<string, string | null> = { [startNodeId]: null };

      let currentVisited = new Set<string>([startNodeId]);
      let currentActiveNode: string | null = null;
      let currentActiveEdge: string | null = null;
      let currentPath: string[] = [];

      const pushFrame = (lineId: string, msg?: string) => {
         const line = snippet.find(l => l.id === lineId);
         newFrames.push({
             visited: new Set(currentVisited),
             path: [...currentPath],
             activeEdge: currentActiveEdge,
             activeNode: currentActiveNode,
             nodeDistances: {},
             codeLines: snippet.map(l => ({ ...l, active: l.id === lineId })),
             outputLog: [...currentLog],
             message: msg || (line ? line.explanation : 'Processing...')
         });
      };

      pushFrame('1');

      let found = false;
      while (queue.length > 0) {
          const current = queue.shift()!;
          currentActiveNode = current;
          currentLog.push(`> Scanning Sector [${current}]`);
          pushFrame('2');

          if (current === targetNodeId) {
              found = true;
              pushFrame('3');
              break;
          }

          pushFrame('4');
          const neighbors = edges
              .filter(e => e.source === current || e.target === current)
              .map(e => ({ id: e.source === current ? e.target : e.source, edgeId: e.id }));

          for (const { id, edgeId } of neighbors) {
              currentActiveEdge = edgeId;
              pushFrame('4', `Checking edge ${edgeId}`);

              if (!visitedSet.has(id)) {
                  visitedSet.add(id);
                  parent[id] = current;
                  currentVisited = new Set(visitedSet);
                  queue.push(id);
                  currentLog.push(`  - Discovered [${id}]`);
                  pushFrame('5');
              }
          }
      }

      currentActiveEdge = null;
      currentActiveNode = null;
      if (found) {
          const pathStack = [];
          let curr: string | null = targetNodeId;
          while (curr !== null) {
              pathStack.unshift(curr);
              curr = parent[curr] || null;
          }
          currentPath = pathStack;
          currentLog.push(`> BFS SUCCESS. Path: ${pathStack.join(' ➔ ')}`);
          pushFrame('', "TARGET_REACHED");
      } else {
          currentLog.push(`> Abort: Target Unreachable via BFS.`);
          pushFrame('', "404_NOT_FOUND");
      }

      setFrames(newFrames);
      setFrameIdx(0);
  };

  const runDFS = () => {
      if (isAnimating || !nodes.find(n => n.id === startNodeId)) return;
      resetVisuals();
      setIsAnimating(true);
    //   if (!showHUD) setShowHUD(true);

      let newFrames: VisualFrame[] = [];
      let currentLog = [`> Initiating DFS Dive: [${startNodeId}] -> [${targetNodeId}]`];
      const snippet = SNIPPETS.dfs;

      const stack = [startNodeId];
      const visitedSet = new Set<string>();
      const parent: Record<string, string | null> = { [startNodeId]: null };
      
      let currentVisited = new Set<string>();
      let currentActiveNode: string | null = null;
      let currentActiveEdge: string | null = null;
      let currentPath: string[] = [];

      const pushFrame = (lineId: string, msg?: string) => {
         const line = snippet.find(l => l.id === lineId);
         newFrames.push({
             visited: new Set(currentVisited),
             path: [...currentPath],
             activeEdge: currentActiveEdge,
             activeNode: currentActiveNode,
             nodeDistances: {},
             codeLines: snippet.map(l => ({ ...l, active: l.id === lineId })),
             outputLog: [...currentLog],
             message: msg || (line ? line.explanation : 'Processing...')
         });
      };

      pushFrame('1');
      let found = false;

      while (stack.length > 0) {
          const current = stack.pop()!;
          
          if (!visitedSet.has(current)) {
              visitedSet.add(current);
              currentVisited = new Set(visitedSet);
              currentActiveNode = current;
              currentLog.push(`> Deep Dive into Sector [${current}]`);
              pushFrame('2');

              if (current === targetNodeId) {
                  found = true;
                  pushFrame('3');
                  break;
              }

              pushFrame('4');
              const neighbors = edges
                  .filter(e => e.source === current || e.target === current)
                  .map(e => ({ id: e.source === current ? e.target : e.source, edgeId: e.id }));

              for (const { id, edgeId } of neighbors) {
                  currentActiveEdge = edgeId;
                  pushFrame('4', `Checking edge ${edgeId}`);
                  
                  if (!visitedSet.has(id)) {
                      parent[id] = current;
                      stack.push(id);
                      currentLog.push(`  - Stacked [${id}] for exploration`);
                      pushFrame('5');
                  }
              }
          }
      }

      currentActiveEdge = null;
      currentActiveNode = null;
      if (found) {
          const pathStack = [];
          let curr: string | null = targetNodeId;
          while (curr !== null) {
              pathStack.unshift(curr);
              curr = parent[curr] || null;
          }
          currentPath = pathStack;
          currentLog.push(`> DFS SUCCESS. Path: ${pathStack.join(' ➔ ')}`);
          pushFrame('', "TARGET_REACHED");
      } else {
          currentLog.push(`> Abort: Target Unreachable via DFS.`);
          pushFrame('', "404_NOT_FOUND");
      }

      setFrames(newFrames);
      setFrameIdx(0);
  };

  const runDijkstra = () => {
      if (isAnimating || !nodes.find(n => n.id === startNodeId)) return;
      resetVisuals();
      setIsAnimating(true);
    //   if (!showHUD) setShowHUD(true);

      let newFrames: VisualFrame[] = [];
      let currentLog = [`> Initiating Dijkstra Protocol: [${startNodeId}] -> [${targetNodeId}]`];
      const snippet = SNIPPETS.dijkstra;

      const distances: Record<string, number> = {};
      const previous: Record<string, string | null> = {};
      const unvisited = new Set(nodes.map(n => n.id));

      nodes.forEach(n => distances[n.id] = Infinity);
      distances[startNodeId] = 0;

      let currentVisited = new Set<string>();
      let currentActiveNode: string | null = null;
      let currentActiveEdge: string | null = null;
      let currentPath: string[] = [];
      let currentDistances = { ...distances };

      const pushFrame = (lineId: string, msg?: string) => {
         const line = snippet.find(l => l.id === lineId);
         newFrames.push({
             visited: new Set(currentVisited),
             path: [...currentPath],
             activeEdge: currentActiveEdge,
             activeNode: currentActiveNode,
             nodeDistances: { ...currentDistances },
             codeLines: snippet.map(l => ({ ...l, active: l.id === lineId })),
             outputLog: [...currentLog],
             message: msg || (line ? line.explanation : 'Processing...')
         });
      };

      pushFrame('1');

      while (unvisited.size > 0) {
          let current: string | null = null;
          let minInfo = Infinity;
          unvisited.forEach(id => {
              if (distances[id] < minInfo) { minInfo = distances[id]; current = id; }
          });
          
          if (current === null || distances[current] === Infinity) break;
          
          currentActiveNode = current;
          unvisited.delete(current);
          currentVisited.add(current);
          currentLog.push(`> Active Target [${current}] (Cost: ${distances[current]})`);
          pushFrame('2');

          if (current === targetNodeId) {
              pushFrame('3');
              break;
          }

          const neighbors = edges.filter(e => e.source === current || e.target === current);
          for (let edge of neighbors) {
              const neighbor = edge.source === current ? edge.target : edge.source;
              
              if (unvisited.has(neighbor)) {
                  currentActiveEdge = edge.id;
                  pushFrame('4');
                  
                  const alt = distances[current] + edge.weight;
                  if (alt < distances[neighbor]) {
                      distances[neighbor] = alt;
                      previous[neighbor] = current;
                      currentDistances = { ...distances };
                      currentLog.push(`  - Relaxed Edge to [${neighbor}]. New Cost: ${alt}`);
                      pushFrame('5');
                  }
              }
          }
      }

      currentActiveEdge = null;
      currentActiveNode = null;
      if (distances[targetNodeId] !== Infinity) {
          const pathStack = [];
          let u: string | null = targetNodeId;
          while (u) {
              pathStack.unshift(u);
              u = previous[u] || null;
          }
          currentPath = pathStack;
          currentLog.push(`> DIJKSTRA SUCCESS. Optimal Path: ${pathStack.join(' ➔ ')} (Total Cost: ${distances[targetNodeId].toFixed(1)})`);
          pushFrame('', "OPTIMAL_ROUTE_FOUND");
      } else {
          currentLog.push(`> Abort: Target Unreachable.`);
          pushFrame('', "404_NOT_FOUND");
      }

      setFrames(newFrames);
      setFrameIdx(0);
  };

  const runAStar = () => {
      if (isAnimating || !nodes.find(n => n.id === startNodeId)) return;
      resetVisuals();
      setIsAnimating(true);
    //   if (!showHUD) setShowHUD(true);

      let newFrames: VisualFrame[] = [];
      let currentLog = [`> Initiating A* Heuristic Protocol: [${startNodeId}] -> [${targetNodeId}]`];
      const snippet = SNIPPETS.astar;

      const gScore: Record<string, number> = {};
      const fScore: Record<string, number> = {};
      const previous: Record<string, string | null> = {};
      const openSet = new Set<string>([startNodeId]);
      
      const heuristic = (id1: string, id2: string) => {
          const n1 = nodes.find(n => n.id === id1)!;
          const n2 = nodes.find(n => n.id === id2)!;
          return Math.hypot(n1.x - n2.x, n1.y - n2.y) / 50; 
      };

      nodes.forEach(n => { gScore[n.id] = Infinity; fScore[n.id] = Infinity; });
      gScore[startNodeId] = 0;
      fScore[startNodeId] = heuristic(startNodeId, targetNodeId);

      let currentVisited = new Set<string>();
      let currentActiveNode: string | null = null;
      let currentActiveEdge: string | null = null;
      let currentPath: string[] = [];
      let currentDistances = { ...gScore };

      const pushFrame = (lineId: string, msg?: string) => {
         const line = snippet.find(l => l.id === lineId);
         newFrames.push({
             visited: new Set(currentVisited),
             path: [...currentPath],
             activeEdge: currentActiveEdge,
             activeNode: currentActiveNode,
             nodeDistances: { ...currentDistances },
             codeLines: snippet.map(l => ({ ...l, active: l.id === lineId })),
             outputLog: [...currentLog],
             message: msg || (line ? line.explanation : 'Processing...')
         });
      };
      
      pushFrame('1');

      while (openSet.size > 0) {
          let current: string | null = null;
          let minF = Infinity;
          
          openSet.forEach(id => {
              if (fScore[id] < minF) { minF = fScore[id]; current = id; }
          });

          if (current === null) break;
          
          currentActiveNode = current;
          openSet.delete(current);
          currentVisited.add(current);
          currentLog.push(`> Exploring [${current}] (G:${gScore[current].toFixed(1)}, F:${minF.toFixed(1)})`);
          pushFrame('2');

          if (current === targetNodeId) {
              pushFrame('3');
              break;
          }

          const neighbors = edges.filter(e => e.source === current || e.target === current);
          for (let edge of neighbors) {
              const neighbor = edge.source === current ? edge.target : edge.source;
              
              currentActiveEdge = edge.id;
              pushFrame('4');
              
              const tentativeG = gScore[current] + edge.weight;
              if (tentativeG < gScore[neighbor]) {
                  previous[neighbor] = current;
                  gScore[neighbor] = tentativeG;
                  fScore[neighbor] = tentativeG + heuristic(neighbor, targetNodeId);
                  if (!openSet.has(neighbor)) openSet.add(neighbor);
                  
                  currentDistances = { ...gScore };
                  currentLog.push(`  - Optimal neighbor [${neighbor}] found. G-cost: ${tentativeG}`);
                  pushFrame('5');
              }
          }
      }

      currentActiveEdge = null;
      currentActiveNode = null;
      if (gScore[targetNodeId] !== Infinity) {
          const pathStack = [];
          let u: string | null = targetNodeId;
          while (u) {
              pathStack.unshift(u);
              u = previous[u] || null;
          }
          currentPath = pathStack;
          currentLog.push(`> A* SUCCESS. Optimal Path: ${pathStack.join(' ➔ ')} (Total Cost: ${gScore[targetNodeId].toFixed(1)})`);
          pushFrame('', "OPTIMAL_ROUTE_FOUND");
      } else {
          currentLog.push(`> Abort: Target Unreachable.`);
          pushFrame('', "404_NOT_FOUND");
      }

      setFrames(newFrames);
      setFrameIdx(0);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#09090b] font-sans text-white overflow-hidden select-none">
      <CyberGrid />
      
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden min-h-0">
        
        {/* --- LEFT PANEL: COMMAND CENTER (Constrained to strictly 38% on mobile) --- */}
        <div className="w-full lg:w-[360px] bg-black/95 lg:bg-black/80 backdrop-blur-md border-white/10 flex flex-col h-[38%] lg:h-full shadow-2xl shrink-0 z-20 overflow-hidden order-1 lg:border-r">
          
          <div className="overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar pb-6 flex-1 lg:max-h-none pt-4 lg:pt-6 flex flex-col">
            
            {/* Interaction Modes */}
            <div className="space-y-2 shrink-0">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <MousePointer2 size={12}/> Interaction Toolkit
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
                    {[
                        { id: 'move', icon: Move, label: 'Move' }, 
                        { id: 'addNode', icon: Plus, label: 'Node' },
                        { id: 'addEdge', icon: Share2, label: 'Link' }
                    ].map((m) => (
                        <button key={m.id} onClick={() => setMode(m.id as Mode)} disabled={isAnimating || frames.length > 0}
                            className={`flex flex-col items-center justify-center gap-1 py-2 sm:py-3 rounded-lg transition-all duration-300 disabled:opacity-30 ${
                                mode === m.id 
                                ? 'bg-purple-500 text-black shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <m.icon size={14} className="sm:w-4 sm:h-4" />
                            <span className="text-[8px] sm:text-[9px] font-bold font-mono uppercase">{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Playback Controls (WITH MODE TOGGLE & STOP) */}
            <div className="bg-white/5 p-3 sm:p-4 rounded-xl border border-white/10 space-y-3 sm:space-y-4 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase">Engine State</span>
                <div className="flex bg-black/50 rounded-lg p-0.5 border border-white/10">
                    <button onClick={() => setEngineMode('AUTO')} className={`px-2 py-1 text-[8px] sm:text-[9px] font-black rounded ${engineMode === 'AUTO' ? 'bg-purple-500 text-black' : 'text-gray-500'}`}>AUTO</button>
                    <button onClick={() => setEngineMode('MANUAL')} className={`px-2 py-1 text-[8px] sm:text-[9px] font-black rounded ${engineMode === 'MANUAL' ? 'bg-amber-500 text-black' : 'text-gray-500'}`}>MANUAL</button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                   onClick={() => setIsPaused(!isPaused)} 
                   disabled={engineMode === 'MANUAL'} 
                   className="flex-1 py-1.5 sm:py-2 bg-black/50 border border-white/10 rounded flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold hover:bg-white/5 transition-all disabled:opacity-30"
                >
                  {isPaused ? <Play size={12} className="sm:w-3.5 sm:h-3.5"/> : <Pause size={12} className="sm:w-3.5 sm:h-3.5"/>} {isPaused ? 'RESUME' : 'PAUSE'}
                </button>
                <div className="flex flex-1 gap-1">
                    <button 
                      disabled={(engineMode === 'AUTO' && !isPaused) || frames.length === 0 || frameIdx <= 0} 
                      onClick={() => setFrameIdx(f => Math.max(0, f - 1))} 
                      className="flex-1 py-1.5 sm:py-2 bg-purple-600 text-white rounded flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black hover:bg-purple-500 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      <StepBack size={12} className="sm:w-3.5 sm:h-3.5" /> PREV
                    </button>
                    <button 
                       onClick={() => setFrameIdx(f => Math.min(frames.length - 1, f + 1))} 
                       disabled={(engineMode === 'AUTO' && !isPaused) || frames.length === 0 || frameIdx >= frames.length - 1} 
                       className="flex-1 py-1.5 sm:py-2 bg-purple-500 text-black rounded flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black hover:bg-purple-400 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      NEXT <StepForward size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                </div>
              </div>

              {/* THE KILL SWITCH */}
              <button 
                  onClick={handleStop} 
                  disabled={frames.length === 0}
                  className="w-full py-1.5 sm:py-2 mt-2 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-black uppercase transition-all disabled:opacity-30"
              >
                  <Square size={12} fill="currentColor" /> ABORT OPERATION
              </button>
            </div>

            {/* Pathfinding Config */}
            <div className="space-y-3 sm:space-y-4 shrink-0 border-t border-white/5 pt-3 sm:pt-4">
               <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                   <Navigation size={12}/> Route Planner
               </label>
               
               <div className="grid grid-cols-2 gap-2 sm:gap-3">
                   <div className="space-y-1">
                        <span className="text-[8px] sm:text-[9px] text-gray-500 font-mono uppercase">Start Sector</span>
                        <select value={startNodeId} onChange={(e) => setStartNodeId(e.target.value)} disabled={isAnimating || frames.length > 0}
                           className="w-full bg-[#050510] border border-white/10 rounded-lg p-1.5 sm:p-2 text-[10px] sm:text-xs font-mono text-purple-400 outline-none focus:border-purple-500"
                        >
                           {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                        </select>
                   </div>
                   <div className="space-y-1">
                        <span className="text-[8px] sm:text-[9px] text-gray-500 font-mono uppercase">Target Sector</span>
                        <select value={targetNodeId} onChange={(e) => setTargetNodeId(e.target.value)} disabled={isAnimating || frames.length > 0}
                           className="w-full bg-[#050510] border border-white/10 rounded-lg p-1.5 sm:p-2 text-[10px] sm:text-xs font-mono text-cyan-400 outline-none focus:border-cyan-500"
                        >
                           {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                        </select>
                   </div>
               </div>
               
               {/* Algorithm Grid */}
               <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2">
                  <button onClick={runBFS} disabled={isAnimating || frames.length > 0} className="p-2 sm:p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded hover:bg-cyan-500/20 text-[9px] sm:text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                     <Map size={14} className="sm:w-4 sm:h-4"/> BFS
                  </button>
                  <button onClick={runDFS} disabled={isAnimating || frames.length > 0} className="p-2 sm:p-3 bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 rounded hover:bg-fuchsia-500/20 text-[9px] sm:text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                     <ShieldAlert size={14} className="sm:w-4 sm:h-4"/> DFS
                  </button>
                  <button onClick={runDijkstra} disabled={isAnimating || frames.length > 0} className="p-2 sm:p-3 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded hover:bg-purple-500/20 text-[9px] sm:text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                     <Zap size={14} className="sm:w-4 sm:h-4"/> Dijkstra
                  </button>
                  <button onClick={runAStar} disabled={isAnimating || frames.length > 0} className="p-2 sm:p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded hover:bg-emerald-500/20 text-[9px] sm:text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50">
                     <Crosshair size={14} className="sm:w-4 sm:h-4"/> A* (A-Star)
                  </button>
               </div>
            </div>

            {/* Outputs */}
            <button onClick={() => { setNodes([]); setEdges([]); resetVisuals(); setOutputLog(['> Memory Wiped.']); }} disabled={isAnimating} className="w-full py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/5 hover:border-red-500/30 rounded text-[9px] sm:text-[10px] font-bold text-gray-500 transition-all flex items-center justify-center gap-2 mt-4 shrink-0">
               <Trash2 size={12} className="sm:w-3.5 sm:h-3.5"/> FORMAT GRAPH
            </button>

            {/* DEDICATED OUTPUT SCREEN */}
            <div className="mt-4 flex-1 min-h-[100px] lg:min-h-[150px] bg-black/90 border border-purple-500/30 rounded-xl flex flex-col overflow-hidden shadow-inner shrink-0">
                <div className="px-3 py-2 border-b border-purple-500/30 bg-purple-900/20 flex items-center gap-2 shrink-0">
                    <Terminal size={12} className="text-purple-400" />
                    <span className="text-[8px] sm:text-[9px] font-black text-purple-400 uppercase tracking-widest">Operation_Log</span>
                </div>
                <div ref={outputScrollRef} className="p-2 sm:p-3 overflow-y-auto custom-scrollbar flex-1 font-mono text-[9px] sm:text-[10px] text-gray-300 flex flex-col gap-1">
                    {outputLog.length === 0 ? (
                        <span className="text-gray-600 italic mt-1">Awaiting map operations...</span>
                    ) : (
                        outputLog.map((log, i) => (
                           <div key={i} className={`flex items-start ${log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : log.includes('Abort') || log.includes('ABORTED') ? 'text-red-400' : 'text-gray-400'}`}>
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
        <div className="lg:hidden h-[2px] w-full bg-gradient-to-r from-purple-500/10 via-purple-500/60 to-purple-500/10 shrink-0 z-30 order-2" />

        {/* --- RIGHT PANEL: THE ARENA --- */}
        <div className="order-3 lg:order-2 flex-1 relative flex flex-col p-3 sm:p-4 lg:p-6 min-w-0 overflow-hidden lg:h-full w-full">
          
          {/* SMALL HUD TOGGLE BUTTON */}
          <div className="flex justify-start lg:justify-start items-center mb-2 lg:mb-3 shrink-0 gap-2">
             <button 
                onClick={() => setShowHUD(!showHUD)}
                className="h-7 lg:h-8 px-3 bg-[#050505] border border-purple-500/80 rounded-lg lg:rounded-full text-purple-400 font-black text-[10px] flex items-center gap-1.5 tracking-widest hover:bg-purple-500/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)] uppercase z-40"
             >
                {showHUD ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                {showHUD ? 'HIDE HUD' : 'SHOW HUD'}
             </button>
          </div>

          {/* Central Arena: Map Canvas (Scrollable + Draggable) */}
          <div className="flex-1 min-h-0 border border-white/5 bg-black/30 rounded-2xl relative flex flex-col shadow-inner overflow-hidden mb-2 lg:mb-4 w-full">
             
             <div className="absolute top-3 right-3 lg:top-4 lg:right-4 z-30 flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-1 lg:py-1.5 bg-[#0a0a14]/90 backdrop-blur-md border border-white/10 rounded-full shadow-lg pointer-events-none">
                <Activity size={12} className={isAnimating ? 'text-purple-500 animate-pulse' : 'text-gray-600'} />
                <span className="text-[8px] lg:text-[10px] font-mono font-bold text-white uppercase tracking-widest">{message}</span>
             </div>

             {/* Infinite Canvas Wrapper */}
             <div className="flex-1 w-full h-full overflow-auto custom-scrollbar touch-pan-x touch-pan-y relative">
                 <div 
                     className={`absolute min-w-[1200px] min-h-[800px] w-full h-full ${mode === 'move' && !isAnimating ? 'cursor-grab active:cursor-grabbing' : mode === 'addNode' && !isAnimating ? 'cursor-crosshair' : 'cursor-default'}`}
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleGlobalMouseUp}
                     onMouseLeave={handleGlobalMouseUp}
                 >
                     <div ref={canvasRef} className="absolute inset-0 z-0" onClick={handleCanvasClick} />

                     <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                         <AnimatePresence>
                         {edges.map((edge) => {
                             const start = nodes.find(n => n.id === edge.source);
                             const end = nodes.find(n => n.id === edge.target);
                             if(!start || !end) return null;

                             const isPath = path.includes(edge.source) && path.includes(edge.target) && 
                                            (path.indexOf(edge.source) === path.indexOf(edge.target) - 1 || path.indexOf(edge.target) === path.indexOf(edge.source) - 1);
                             const isActive = activeEdge === edge.id;

                             return (
                                 <g key={edge.id}>
                                     <motion.line 
                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                        x1={start.x} y1={start.y} x2={end.x} y2={end.y} 
                                        stroke={isPath ? '#00f5ff' : isActive ? '#facc15' : '#3f3f46'} 
                                        strokeWidth={isPath || isActive ? 4 : 2}
                                        strokeOpacity={isPath || isActive ? 1 : 0.5}
                                        className="transition-colors duration-300"
                                     />
                                     <g transform={`translate(${(start.x + end.x)/2}, ${(start.y + end.y)/2})`}>
                                         <rect x="-12" y="-9" width="24" height="18" fill={isPath ? '#00f5ff' : isActive ? '#facc15' : '#18181b'} rx="8" stroke={isPath ? '#00f5ff' : '#3f3f46'} strokeWidth="1"/>
                                         <text x="0" y="3" textAnchor="middle" fill={isPath || isActive ? '#000' : '#a1a1aa'} fontSize="10" className="font-mono font-bold">{edge.weight}</text>
                                     </g>
                                 </g>
                             );
                         })}
                         </AnimatePresence>
                         
                         {mode === 'addEdge' && dragStartNode && (
                             <line 
                                x1={nodes.find(n => n.id === dragStartNode)?.x} 
                                y1={nodes.find(n => n.id === dragStartNode)?.y} 
                                x2={mousePos.x} y2={mousePos.y} 
                                stroke="#a855f7" strokeWidth="3" strokeDasharray="6,6" className="opacity-70"
                             />
                         )}
                     </svg>

                     <AnimatePresence>
                     {nodes.map(node => {
                         const isVisited = visited.has(node.id);
                         const isPathNode = path.includes(node.id);
                         const isCurrent = activeNode === node.id;
                         const isStart = node.id === startNodeId;
                         const isTarget = node.id === targetNodeId;
                         
                         const dist = nodeDistances[node.id];
                         const displayDist = dist === undefined ? '' : dist === Infinity ? '∞' : dist;

                         let borderColor = '#52525b';
                         let bgColor = '#09090b';
                         let glow = 'none';

                         if (isCurrent) { borderColor = '#facc15'; bgColor = '#facc1520'; glow = '0 0 30px rgba(250,204,21,0.6)'; }
                         else if (isPathNode) { borderColor = '#00f5ff'; bgColor = '#00f5ff20'; glow = '0 0 20px rgba(0,245,255,0.4)'; }
                         else if (isVisited) { borderColor = '#a855f7'; bgColor = '#a855f720'; glow = '0 0 15px rgba(168,85,247,0.3)'; }
                         else if (isStart) { borderColor = '#22c55e'; }
                         else if (isTarget) { borderColor = '#ef4444'; }

                         return (
                            <motion.div
                                key={node.id}
                                initial={{ scale: 0 }} animate={{ scale: isCurrent ? 1.2 : 1 }}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                                className={`absolute w-12 h-12 lg:w-14 lg:h-14 -ml-6 -mt-6 lg:-ml-7 lg:-mt-7 rounded-full flex flex-col items-center justify-center border-4 z-20 shadow-xl pointer-events-auto transition-colors duration-300 ${mode === 'addEdge' && !isAnimating ? 'cursor-crosshair' : ''}`}
                                style={{ 
                                    left: node.x, top: node.y, borderColor: borderColor, backgroundColor: bgColor, boxShadow: glow
                                }}
                                draggable={false}
                            >
                                <span className={`font-black text-sm lg:text-lg pointer-events-none ${isPathNode || isCurrent ? 'text-white' : 'text-gray-300'}`}>
                                    {node.id}
                                </span>
                                
                                {displayDist !== '' && (
                                    <div className="absolute -bottom-5 lg:-bottom-6 bg-black border border-white/20 px-1.5 py-0.5 rounded text-[8px] lg:text-[10px] font-mono font-bold text-gray-300 pointer-events-none">
                                        {Number.isInteger(displayDist as number) ? displayDist : Number(displayDist).toFixed(1)}
                                    </div>
                                )}

                                {isStart && <div className="absolute -top-5 lg:-top-6 text-[7px] lg:text-[9px] font-black text-green-400 pointer-events-none">START</div>}
                                {isTarget && <div className="absolute -top-5 lg:-top-6 text-[7px] lg:text-[9px] font-black text-red-400 pointer-events-none">TARGET</div>}
                                
                                {isCurrent && (
                                    <>
                                      <div className="absolute -left-10 lg:-left-12 top-4 bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[7px] lg:text-[8px] font-black shadow-lg pointer-events-none">SCAN</div>
                                      <motion.div animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 rounded-full border-2 border-yellow-500 pointer-events-none" />
                                    </>
                                )}
                            </motion.div>
                         );
                     })}
                     </AnimatePresence>

                     {/* Fixed Key/Legend floating inside canvas */}
                     <div className="fixed bottom-10 lg:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 lg:gap-6 bg-black/80 backdrop-blur-md px-4 lg:px-6 py-2 lg:py-3 rounded-xl border border-white/10 text-[8px] lg:text-[10px] font-mono font-bold text-gray-400 pointer-events-none z-30 shadow-2xl">
                        <span className="flex items-center gap-1.5 lg:gap-2"><div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded bg-[#facc15] border border-black"/> ACTIVE</span>
                        <span className="flex items-center gap-1.5 lg:gap-2"><div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded bg-[#a855f7] border border-black"/> VISITED</span>
                        <span className="flex items-center gap-1.5 lg:gap-2"><div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded bg-[#00f5ff] border border-black"/> PATH</span>
                     </div>
                 </div>
             </div>
          </div>

          {/* BOTTOM HUD TRACE */}
          <AnimatePresence initial={false}>
              {showHUD && (
                  <motion.div 
                     initial={{ height: 0, opacity: 0, marginTop: 0 }}
                     animate={{ height: typeof window !== 'undefined' && window.innerWidth < 1024 ? 120 : 160, opacity: 1, marginTop: 12 }}
                     exit={{ height: 0, opacity: 0, marginTop: 0 }}
                     transition={{ duration: 0.3, ease: 'easeInOut' }}
                     className="w-full shrink-0 overflow-hidden" 
                  >
                     <div className="w-full h-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col shadow-2xl overflow-hidden relative">
                         <div className="px-3 lg:px-4 py-2 lg:py-3 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                            <div className="flex items-center gap-1.5 lg:gap-2 text-purple-400">
                                <Terminal size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4"/>
                                <span className="text-[9px] lg:text-[10px] font-black tracking-widest uppercase">Hinglish_Logic_Trace</span>
                            </div>
                         </div>
                         <div ref={interpreterScrollRef} className="p-3 lg:p-4 space-y-2 lg:space-y-3 overflow-y-auto custom-scrollbar flex-1">
                            {codeLines.map(line => (
                               <div key={line.id} className={`flex flex-col text-[10px] lg:text-sm transition-all ${line.active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
                                  <div className={`font-mono ${line.active ? 'text-purple-400' : 'text-gray-400'}`}>{line.text}</div>
                                  {line.active && <div className="text-[9px] lg:text-xs text-amber-400 mt-0.5 lg:mt-1 flex items-center gap-1.5 lg:gap-2 leading-relaxed"><ArrowRight size={12} className="w-3 h-3 shrink-0"/> {line.explanation}</div>}
                               </div>
                            ))}
                         </div>
                     </div>
                  </motion.div>
              )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default GraphVisualizer;