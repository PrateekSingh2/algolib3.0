import React, { useState, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings2, Info, X, ListTree } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Point { x: number; y: number; label: 0 | 1; }
interface TreeNode {
  id: string; isLeaf: boolean; depth: number;
  feature?: 'x' | 'y'; threshold?: number;
  left?: TreeNode; right?: TreeNode;
  prediction?: 0 | 1; samples: number; gini: number;
}

const DecisionTreeVisualizer = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [maxDepth, setMaxDepth] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'add-0' | 'add-1' | 'view'>('add-0');
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [currentDepthBuild, setCurrentDepthBuild] = useState(0);

  const requestRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const stateRef = useRef({ points, maxDepth, currentDepthBuild });
  stateRef.current = { points, maxDepth, currentDepthBuild };

  const reset = useCallback(() => {
    setTree(null); setCurrentDepthBuild(0); setIsRunning(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  }, []);

  const clearPoints = () => { setPoints([]); reset(); };

  const generateRandomPoints = () => {
    const pts: Point[] = Array.from({ length: 40 }, () => {
      const x = Math.random(), y = Math.random();
      const label = ((x - 0.5) ** 2 + (y - 0.5) ** 2 < 0.15) ? 1 : 0;
      return { x: Math.max(0.05, Math.min(0.95, x)), y: Math.max(0.05, Math.min(0.95, y)), label };
    });
    setPoints(pts); reset();
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode === 'view' || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    const newPts: Point[] = [...stateRef.current.points, { x, y, label: mode === 'add-0' ? 0 : 1 }];
    setPoints(newPts);
    if (tree) reset();
  };

  const calculateGini = (pts: Point[]) => {
    if (pts.length === 0) return 0;
    const p1 = pts.filter(p => p.label === 1).length / pts.length;
    return 1 - (p1 * p1 + (1 - p1) * (1 - p1));
  };

  const findBestSplit = (pts: Point[]) => {
    let bestGini = 1, bestFeature: 'x' | 'y' = 'x', bestThreshold = 0;
    let bestLeft: Point[] = [], bestRight: Point[] = [];
    const trySplit = (feature: 'x' | 'y', threshold: number) => {
      const left = pts.filter(p => p[feature] <= threshold);
      const right = pts.filter(p => p[feature] > threshold);
      if (left.length === 0 || right.length === 0) return;
      const wg = (left.length / pts.length) * calculateGini(left) + (right.length / pts.length) * calculateGini(right);
      if (wg < bestGini) { bestGini = wg; bestFeature = feature; bestThreshold = threshold; bestLeft = left; bestRight = right; }
    };
    pts.forEach(p => { trySplit('x', p.x); trySplit('y', p.y); });
    return { feature: bestFeature, threshold: bestThreshold, left: bestLeft, right: bestRight, gini: bestGini };
  };

  const buildStep = useCallback(() => {
    const now = performance.now();
    if (now - lastUpdateRef.current < 800) return;
    lastUpdateRef.current = now;

    const { points: pts, maxDepth: md, currentDepthBuild: cdb } = stateRef.current;

    if (cdb > md) {
      setIsRunning(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const buildToDepth = (p: Point[], depth: number, maxD: number, id: string = 'root'): TreeNode => {
      const p1 = p.filter(pt => pt.label === 1).length;
      const pred = (p1 >= p.length / 2) ? 1 : 0;
      const g = calculateGini(p);
      if (depth >= maxD || g === 0 || p.length < 2) return { id, isLeaf: true, depth, prediction: pred, samples: p.length, gini: g };
      const split = findBestSplit(p);
      if (!split.left.length || !split.right.length) return { id, isLeaf: true, depth, prediction: pred, samples: p.length, gini: g };
      return { id, isLeaf: false, depth, feature: split.feature, threshold: split.threshold, samples: p.length, gini: g, left: buildToDepth(split.left, depth + 1, maxD, id + '-L'), right: buildToDepth(split.right, depth + 1, maxD, id + '-R') };
    };

    const newTree = buildToDepth(pts, 0, cdb);
    setTree(newTree);
    const nextDepth = cdb + 1;
    setCurrentDepthBuild(nextDepth);
    if (nextDepth > md) {
      setIsRunning(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, []);

  const animate = useCallback(() => {
    buildStep();
    requestRef.current = requestAnimationFrame(animate);
  }, [buildStep]);

  const toggleRun = () => {
    if (isRunning) {
      setIsRunning(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    } else {
      if (currentDepthBuild > maxDepth) reset();
      setIsRunning(true);
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const drawBoundaries = (node: TreeNode, xMin = 0, xMax = 100, yMin = 0, yMax = 100): React.ReactNode => {
    if (node.isLeaf) return <rect x={xMin} y={100 - yMax} width={xMax - xMin} height={yMax - yMin} className={`opacity-10 transition-colors duration-500 ${node.prediction === 1 ? 'fill-sky-500' : 'fill-rose-500'}`} />;
    const t = (node.threshold || 0) * 100, isX = node.feature === 'x';
    return (
      <g key={node.id}>
        <line x1={isX ? t : xMin} y1={isX ? 100 - yMax : 100 - t} x2={isX ? t : xMax} y2={isX ? 100 - yMin : 100 - t} stroke="currentColor" strokeWidth="0.5" className="text-slate-400 dark:text-slate-600 opacity-50" />
        {node.left && drawBoundaries(node.left, xMin, isX ? t : xMax, yMin, isX ? yMax : t)}
        {node.right && drawBoundaries(node.right, isX ? t : xMin, xMax, isX ? yMin : t, yMax)}
      </g>
    );
  };

  const renderTreeGraph = (node: TreeNode, x = 50, y = 10, lw = 25): React.ReactNode => {
    if (!node) return null;
    return (
      <g key={`g-${node.id}`}>
        {node.left && <line x1={x} y1={y} x2={x - lw} y2={y + 15} stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700" />}
        {node.right && <line x1={x} y1={y} x2={x + lw} y2={y + 15} stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700" />}
        <circle cx={x} cy={y} r={4} className={node.isLeaf ? (node.prediction === 1 ? 'fill-sky-500' : 'fill-rose-500') : 'fill-white dark:fill-slate-800'} stroke="currentColor" strokeWidth="0.5" />
        {!node.isLeaf && <text x={x} y={y - 5} textAnchor="middle" className="text-[3px] font-mono fill-slate-500 dark:fill-slate-400">{node.feature}{node.threshold ? `<${node.threshold.toFixed(2)}` : ''}</text>}
        {node.left && renderTreeGraph(node.left, x - lw, y + 15, lw / 1.8)}
        {node.right && renderTreeGraph(node.right, x + lw, y + 15, lw / 1.8)}
      </g>
    );
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden lg:flex-row lg:gap-4 lg:p-3">
      {/* Canvas — top half on mobile, fills right side on desktop */}
      <div className="h-[48vh] shrink-0 lg:h-auto lg:flex-1 flex flex-col gap-2">
        {/* Main scatter plot */}
        <div className="flex-1 bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-2 shadow-sm relative overflow-hidden flex flex-col min-h-0">
          <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="none"
            className={`w-full h-full bg-slate-50 dark:bg-[#050505] rounded-xl border border-slate-200 dark:border-[#21262d] ${mode !== 'view' ? 'cursor-crosshair' : 'cursor-default'}`}
            onClick={handleSvgClick}>
            <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-slate-400 dark:text-slate-600" />
            <line x1="0" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-slate-400 dark:text-slate-600" />
            {tree && drawBoundaries(tree)}
            {points.map((p, i) => <circle key={i} cx={p.x * 100} cy={100 - p.y * 100} r="1.5" className={p.label === 1 ? 'fill-sky-500' : 'fill-rose-500'} stroke="currentColor" strokeWidth="0.2" />)}
          </svg>
          {points.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/80 dark:bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium border border-slate-200 dark:border-white/10 animate-pulse text-center">Select class &amp; click to add points</div>
            </div>
          )}
        </div>
        {/* Tree graph — compact strip */}
        <div className="h-24 lg:h-32 shrink-0 bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-2 shadow-sm relative overflow-hidden">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest absolute top-2 left-3">Tree Structure</div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMin meet" className="w-full h-full mt-1">
            {tree && renderTreeGraph(tree)}
            {!tree && <text x="50" y="55" textAnchor="middle" className="text-xs fill-slate-400 dark:fill-slate-600">Build the tree to see its structure</text>}
          </svg>
        </div>
      </div>

      {/* Controls — scrollable bottom on mobile, left sidebar on desktop */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar lg:w-72 lg:flex-none lg:shrink-0 flex flex-col gap-3 p-2 lg:p-0">
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm"><Settings2 size={16} /> Hyperparameters</div>
            <button onClick={() => setShowInfo(true)} className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400"><Info size={14} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex justify-between">Max Depth <span className="text-slate-800 dark:text-slate-200">{maxDepth}</span></label>
              <input type="range" min="1" max="8" step="1" value={maxDepth} onChange={e => { setMaxDepth(parseInt(e.target.value)); if (tree) reset(); }} className="w-full accent-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={toggleRun} disabled={points.length === 0} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all ${points.length === 0 ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-[#21262d]' : isRunning ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'}`}>
                {isRunning ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Build</>}
              </button>
              <button onClick={reset} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-[#21262d] dark:hover:bg-[#30363d] dark:text-slate-300 transition-all"><RotateCcw size={14} /> Reset</button>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">Dataset ({points.length} pts)</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={() => setMode('add-0')} className={`py-2 rounded-lg text-xs font-bold transition-all ${mode === 'add-0' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30' : 'bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>Class 0 (Red)</button>
            <button onClick={() => setMode('add-1')} className={`py-2 rounded-lg text-xs font-bold transition-all ${mode === 'add-1' ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30' : 'bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>Class 1 (Blue)</button>
          </div>
          <div className="flex flex-col gap-1.5">
            <button onClick={generateRandomPoints} className="w-full py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] rounded-lg transition-colors">Generate Concentric Data</button>
            <button onClick={clearPoints} className="w-full py-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors">Clear All</button>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tree Status</div>
          <div className="font-mono text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-black/50 p-2.5 rounded-lg border border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span>Current Depth:</span>
            <span className="font-black text-emerald-500">{currentDepthBuild}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-2xl">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full flex items-center justify-center text-slate-500 transition-colors"><X size={16} /></button>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><ListTree className="text-emerald-500" /> Decision Tree</h3>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 overflow-y-auto max-h-[55vh] custom-scrollbar pr-2">
                <p>A <strong>Decision Tree</strong> is a flowchart-like structure where each internal node tests a feature, branches represent test outcomes, and leaves represent class labels.</p>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">How it splits</h4>
                <p>The algorithm finds the best feature (X or Y) and threshold that minimizes <strong>Gini Impurity</strong> — separating classes as cleanly as possible.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Max Depth:</strong> Limits tree growth. Deeper trees can overfit.</li>
                  <li><strong>Gini Impurity:</strong> Measures how often a randomly chosen element would be incorrectly labeled.</li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DecisionTreeVisualizer;
