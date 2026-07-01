import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, Settings2, PlusCircle, Target, Info, X, GitGraph } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Point { x: number; y: number; classId: number; isTest?: boolean; }

const CLASS_COLORS = ['#ef4444', '#3b82f6', '#10b981'];

const KNNVisualizer = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [testPoint, setTestPoint] = useState<Point | null>(null);
  const [neighbors, setNeighbors] = useState<Point[]>([]);
  const [predictedClass, setPredictedClass] = useState<number | null>(null);
  const [k, setK] = useState(3);
  const [mode, setMode] = useState<'add-class-0' | 'add-class-1' | 'add-class-2' | 'test'>('add-class-0');
  const [showInfo, setShowInfo] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  const reset = () => {
    setPoints([]); setTestPoint(null); setNeighbors([]); setPredictedClass(null);
  };

  const generateRandomPoints = () => {
    const newPts: Point[] = [];
    for (let c = 0; c < 3; c++) {
      const cx = Math.random() * 0.6 + 0.2, cy = Math.random() * 0.6 + 0.2;
      for (let i = 0; i < 15; i++) {
        const x = Math.max(0.05, Math.min(0.95, cx + (Math.random() - 0.5) * 0.4));
        const y = Math.max(0.05, Math.min(0.95, cy + (Math.random() - 0.5) * 0.4));
        newPts.push({ x, y, classId: c });
      }
    }
    setPoints(newPts); setTestPoint(null); setNeighbors([]); setPredictedClass(null);
  };

  const calculateKNN = useCallback((tp: Point, kk: number, pts: Point[]) => {
    if (pts.length === 0) return;
    const distances = pts.map(p => ({ point: p, dist: Math.sqrt((p.x - tp.x) ** 2 + (p.y - tp.y) ** 2) }));
    distances.sort((a, b) => a.dist - b.dist);
    const kNearest = distances.slice(0, kk).map(d => d.point);
    setNeighbors(kNearest);
    const votes = [0, 0, 0];
    kNearest.forEach(n => votes[n.classId]++);
    let maxV = -1, winner = -1;
    votes.forEach((v, i) => { if (v > maxV) { maxV = v; winner = i; } });
    setPredictedClass(winner);
  }, []);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    if (mode === 'test') {
      const tp = { x, y, classId: -1, isTest: true };
      setTestPoint(tp); calculateKNN(tp, k, points);
    } else {
      const classId = parseInt(mode.split('-')[2]);
      const newPts = [...points, { x, y, classId }];
      setPoints(newPts);
      if (testPoint) calculateKNN(testPoint, k, newPts);
    }
  };

  useEffect(() => {
    if (testPoint) calculateKNN(testPoint, k, points);
  }, [k, testPoint, points, calculateKNN]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden lg:flex-row lg:gap-4 lg:p-3">
      {/* Canvas */}
      <div className="h-[48vh] shrink-0 lg:h-auto lg:flex-1 bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-2 shadow-sm relative overflow-hidden flex flex-col">
        <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="none"
          className={`w-full h-full bg-slate-50 dark:bg-[#050505] rounded-xl border border-slate-200 dark:border-[#21262d] ${mode === 'test' ? 'cursor-crosshair' : 'cursor-pointer'}`}
          onClick={handleSvgClick}>
          {Array.from({ length: 11 }).map((_, i) => (
            <React.Fragment key={i}>
              <line x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="currentColor" strokeWidth="0.2" className="text-slate-200 dark:text-white/5" />
              <line x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="currentColor" strokeWidth="0.2" className="text-slate-200 dark:text-white/5" />
            </React.Fragment>
          ))}
          <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" strokeWidth="1" className="text-slate-400 dark:text-slate-600" />
          <line x1="0" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="1" className="text-slate-400 dark:text-slate-600" />
          {testPoint && neighbors.map((n, i) => <line key={`nb-${i}`} x1={testPoint.x * 100} y1={100 - testPoint.y * 100} x2={n.x * 100} y2={100 - n.y * 100} stroke={CLASS_COLORS[n.classId]} strokeWidth="0.5" strokeDasharray="1,1" className="opacity-60 transition-all duration-300" />)}
          {points.map((p, i) => <circle key={`p-${i}`} cx={p.x * 100} cy={100 - p.y * 100} r="1.5" fill={CLASS_COLORS[p.classId]} className="stroke-white dark:stroke-black stroke-[0.3]" />)}
          {neighbors.map((n, i) => <circle key={`nh-${i}`} cx={n.x * 100} cy={100 - n.y * 100} r="3" fill="none" stroke={CLASS_COLORS[n.classId]} strokeWidth="0.4" className="animate-pulse" />)}
          {testPoint && (
            <g style={{ transform: `translate(${testPoint.x * 100}px, ${100 - testPoint.y * 100}px)` }}>
              <circle r="2" fill={predictedClass !== null ? CLASS_COLORS[predictedClass] : '#fff'} className="stroke-black dark:stroke-white stroke-[0.5]" />
              <circle r="4" fill="none" stroke={predictedClass !== null ? CLASS_COLORS[predictedClass] : '#000'} strokeWidth="0.4" className="opacity-50 animate-ping" />
            </g>
          )}
        </svg>
        {points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/80 dark:bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium border border-slate-200 dark:border-white/10 animate-pulse">Add training data points first</div>
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
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex justify-between">Neighbors (K) <span className="text-slate-800 dark:text-slate-200">{k}</span></label>
              <input type="range" min="1" max="15" step="1" value={k} onChange={e => setK(parseInt(e.target.value))} className="w-full accent-emerald-500" />
            </div>
            <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-[#21262d] dark:hover:bg-[#30363d] dark:text-slate-300 transition-all"><RotateCcw size={14} /> Reset All</button>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">Dataset ({points.length} pts)</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {(['add-class-0', 'add-class-1', 'add-class-2'] as const).map((m, i) => {
              const labels = ['Red Class', 'Blue Class', 'Green Class'];
              const activeStyles = ['bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30', 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30', 'bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-500/30'];
              return <button key={m} onClick={() => setMode(m)} className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === m ? activeStyles[i] : 'bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}><PlusCircle size={13} /> {labels[i]}</button>;
            })}
            <button onClick={() => setMode('test')} className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'test' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30' : 'bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}><Target size={13} /> Classify</button>
          </div>
          <button onClick={generateRandomPoints} className="w-full py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] rounded-lg transition-colors">Generate Clusters</button>
        </div>

        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Classification Result</div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#050505] flex items-center justify-center min-h-[70px]">
            {predictedClass !== null ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Predicted Class</span>
                <div className="px-4 py-1.5 rounded-lg font-bold text-white shadow-sm text-sm" style={{ backgroundColor: CLASS_COLORS[predictedClass] }}>
                  {predictedClass === 0 ? 'RED' : predictedClass === 1 ? 'BLUE' : 'GREEN'}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center">Place a test point to classify</div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-2xl">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full flex items-center justify-center text-slate-500 transition-colors"><X size={16} /></button>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><GitGraph className="text-emerald-500" /> K-Nearest Neighbors</h3>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 overflow-y-auto max-h-[55vh] custom-scrollbar pr-2">
                <p><strong>KNN</strong> classifies a data point based on how its neighbors are classified. It assumes similar things exist in close proximity.</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Choose K (number of neighbors).</li>
                  <li>Calculate Euclidean distance to all training points.</li>
                  <li>Pick the K closest points.</li>
                  <li>Vote — the majority class wins.</li>
                </ol>
                <div className="bg-slate-50 dark:bg-black/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  <p className="text-xs"><strong>Tip:</strong> Odd K values prevent tie votes in binary classification.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KNNVisualizer;
