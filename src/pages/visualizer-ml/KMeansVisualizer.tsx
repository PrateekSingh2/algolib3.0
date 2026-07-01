import React, { useState, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings2, PlusCircle, Pointer, SkipForward, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Point { x: number; y: number; clusterIndex: number; }
interface Centroid { x: number; y: number; }

const CLUSTER_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const KMeansVisualizer = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [centroids, setCentroids] = useState<Centroid[]>([]);
  const [k, setK] = useState(3);
  const [stepName, setStepName] = useState<'Init' | 'Assign' | 'Update' | 'Converged'>('Init');
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [mode, setMode] = useState<'add' | 'view'>('add');
  const [showInfo, setShowInfo] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const stateRef = useRef({ points, centroids, k, stepName, iteration });
  stateRef.current = { points, centroids, k, stepName, iteration };

  const reset = useCallback(() => {
    setCentroids([]); setStepName('Init'); setIteration(0); setIsRunning(false);
    setPoints(prev => prev.map(p => ({ ...p, clusterIndex: -1 })));
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const clearPoints = () => {
    setPoints([]); setCentroids([]); setStepName('Init'); setIteration(0); setIsRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const generateRandomPoints = () => {
    const newPts: Point[] = [];
    for (let c = 0; c < k; c++) {
      const cx = Math.random() * 0.8 + 0.1, cy = Math.random() * 0.8 + 0.1;
      for (let i = 0; i < 15; i++) {
        const x = Math.max(0.05, Math.min(0.95, cx + (Math.random() - 0.5) * 0.3));
        const y = Math.max(0.05, Math.min(0.95, cy + (Math.random() - 0.5) * 0.3));
        newPts.push({ x, y, clusterIndex: -1 });
      }
    }
    setPoints(newPts); setCentroids([]); setStepName('Init'); setIteration(0); setIsRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const initCentroids = useCallback((pts: Point[], numK: number) => {
    if (pts.length < numK) return;
    const used = new Set<number>(); const nc: Centroid[] = [];
    while (nc.length < numK) {
      const idx = Math.floor(Math.random() * pts.length);
      if (!used.has(idx)) { used.add(idx); nc.push({ x: pts[idx].x, y: pts[idx].y }); }
    }
    setCentroids(nc); setStepName('Assign'); setIteration(0);
    return nc;
  }, []);

  const assignPoints = useCallback((pts: Point[], cents: Centroid[]) => {
    let changed = false;
    const newPts = pts.map(p => {
      let minD = Infinity, closest = -1;
      cents.forEach((c, idx) => {
        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
        if (d < minD) { minD = d; closest = idx; }
      });
      if (p.clusterIndex !== closest) changed = true;
      return { ...p, clusterIndex: closest };
    });
    setPoints(newPts);
    return { newPts, changed };
  }, []);

  const updateCentroids = useCallback((pts: Point[], cents: Centroid[]) => {
    const nc = cents.map((c, idx) => {
      const cp = pts.filter(p => p.clusterIndex === idx);
      if (cp.length === 0) return c;
      return { x: cp.reduce((s, p) => s + p.x, 0) / cp.length, y: cp.reduce((s, p) => s + p.y, 0) / cp.length };
    });
    setCentroids(nc);
    setIteration(prev => prev + 1);
    return nc;
  }, []);

  const performStep = useCallback(() => {
    const { points: pts, centroids: cents, k: kk, stepName: sn, iteration: it } = stateRef.current;
    if (sn === 'Init') {
      initCentroids(pts, kk);
    } else if (sn === 'Assign') {
      const { newPts, changed } = assignPoints(pts, cents);
      if (!changed) { setStepName('Converged'); setIsRunning(false); }
      else setStepName('Update');
    } else if (sn === 'Update') {
      updateCentroids(pts, cents);
      setStepName('Assign');
    }
  }, [initCentroids, assignPoints, updateCentroids]);

  // Auto-run via setTimeout loop
  const runLoop = useCallback(() => {
    const { stepName: sn } = stateRef.current;
    if (sn === 'Converged') { setIsRunning(false); return; }
    performStep();
    timerRef.current = setTimeout(runLoop, 800);
  }, [performStep]);

  const toggleRun = () => {
    if (isRunning) {
      setIsRunning(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setIsRunning(true);
      timerRef.current = setTimeout(runLoop, 100);
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'add' || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    if (stepName !== 'Init') { reset(); }
    setPoints(prev => [...prev, { x, y, clusterIndex: -1 }]);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden lg:flex-row lg:gap-4 lg:p-3">
      {/* Canvas */}
      <div className="h-[48vh] shrink-0 lg:h-auto lg:flex-1 bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-2 shadow-sm relative overflow-hidden flex flex-col">
        <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="none"
          className={`w-full h-full bg-slate-50 dark:bg-[#050505] rounded-xl border border-slate-200 dark:border-[#21262d] ${mode === 'add' ? 'cursor-crosshair' : 'cursor-default'}`}
          onClick={handleSvgClick}>
          {Array.from({ length: 11 }).map((_, i) => (
            <React.Fragment key={i}>
              <line x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="currentColor" strokeWidth="0.2" className="text-slate-200 dark:text-white/5" />
              <line x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="currentColor" strokeWidth="0.2" className="text-slate-200 dark:text-white/5" />
            </React.Fragment>
          ))}
          <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" strokeWidth="1" className="text-slate-400 dark:text-slate-600" />
          <line x1="0" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="1" className="text-slate-400 dark:text-slate-600" />
          {centroids.length > 0 && points.map((p, i) => {
            if (p.clusterIndex === -1) return null;
            const c = centroids[p.clusterIndex];
            return <line key={`cn-${i}`} x1={p.x * 100} y1={100 - p.y * 100} x2={c.x * 100} y2={100 - c.y * 100} stroke={CLUSTER_COLORS[p.clusterIndex]} strokeWidth="0.2" className="opacity-40 transition-all duration-300" />;
          })}
          {points.map((p, i) => <circle key={i} cx={p.x * 100} cy={100 - p.y * 100} r="1.2" fill={p.clusterIndex !== -1 ? CLUSTER_COLORS[p.clusterIndex] : '#94a3b8'} className="stroke-white dark:stroke-black stroke-[0.3] transition-colors duration-300" />)}
          {centroids.map((c, i) => (
            <g key={`cen-${i}`} style={{ transform: `translate(${c.x * 100}px, ${100 - c.y * 100}px)` }} className="transition-all duration-500 ease-out">
              <polygon points="0,-3 3,3 -3,3" fill={CLUSTER_COLORS[i]} className="stroke-white dark:stroke-black stroke-[0.5]" />
              <circle r="4" fill="none" stroke={CLUSTER_COLORS[i]} strokeWidth="0.4" className="opacity-50 animate-pulse" />
            </g>
          ))}
        </svg>
        {mode === 'add' && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/80 dark:bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium border border-slate-200 dark:border-white/10 animate-pulse">Click to add data points</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar lg:w-72 lg:flex-none lg:shrink-0 flex flex-col gap-3 p-2 lg:p-0">
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm"><Settings2 size={16} /> Controls</div>
            <button onClick={() => setShowInfo(true)} className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400"><Info size={14} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex justify-between">Clusters (K) <span className="text-slate-800 dark:text-slate-200">{k}</span></label>
              <input type="range" min="2" max="7" step="1" value={k} onChange={e => { setK(parseInt(e.target.value)); reset(); }} className="w-full accent-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={toggleRun} disabled={points.length < k || stepName === 'Converged'}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all ${(points.length < k || stepName === 'Converged') ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-[#21262d]' : isRunning ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'}`}>
                {isRunning ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Auto Run</>}
              </button>
              <button onClick={performStep} disabled={points.length < k || stepName === 'Converged' || isRunning}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm bg-indigo-500 hover:bg-indigo-600 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <SkipForward size={14} /> Step
              </button>
            </div>
            <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-[#21262d] dark:hover:bg-[#30363d] dark:text-slate-300 transition-all"><RotateCcw size={14} /> Reset State</button>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">Dataset ({points.length} pts)</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={() => setMode('add')} className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'add' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}><PlusCircle size={13} /> Add</button>
            <button onClick={() => setMode('view')} className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'view' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}><Pointer size={13} /> View</button>
          </div>
          <div className="flex flex-col gap-1.5">
            <button onClick={generateRandomPoints} className="w-full py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] rounded-lg transition-colors">Generate Clusters</button>
            <button onClick={clearPoints} className="w-full py-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors">Clear All</button>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Algorithm State</div>
          <div className="grid grid-cols-2 gap-3">
            <div><div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">ITERATION</div><div className="font-mono text-lg font-black text-slate-800 dark:text-slate-200">{iteration}</div></div>
            <div><div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">STATUS</div>
              <div className={`text-sm font-bold mt-1 ${stepName === 'Converged' ? 'text-emerald-500' : 'text-amber-500'}`}>
                {stepName === 'Init' && 'Awaiting Start'}{stepName === 'Assign' && 'Assigning'}{stepName === 'Update' && 'Updating'}{stepName === 'Converged' && 'Converged!'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-2xl">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full flex items-center justify-center text-slate-500 transition-colors"><X size={16} /></button>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Settings2 className="text-emerald-500" /> K-Means Clustering</h3>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 overflow-y-auto max-h-[55vh] custom-scrollbar pr-2">
                <p><strong>K-Means</strong> partitions unlabeled data into K distinct clusters based on feature similarity (Euclidean distance).</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li><strong>Initialize:</strong> Randomly pick K data points as centroids.</li>
                  <li><strong>Assign:</strong> Each point is assigned to its nearest centroid.</li>
                  <li><strong>Update:</strong> Centroids move to the mean position of their cluster.</li>
                  <li><strong>Converge:</strong> Repeat until centroids stop moving.</li>
                </ol>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KMeansVisualizer;
