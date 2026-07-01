import React, { useState, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings2, PlusCircle, Pointer, Info, X, LineChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Point { x: number; y: number; }

const LinearRegressionVisualizer = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [m, setM] = useState(0);
  const [b, setB] = useState(0);
  const [learningRate, setLearningRate] = useState(0.01);
  const [isRunning, setIsRunning] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [cost, setCost] = useState(0);
  const [targetLoss, setTargetLoss] = useState(0.01);
  const [mode, setMode] = useState<'add' | 'view'>('add');
  const [showInfo, setShowInfo] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const requestRef = useRef<number>();
  const stateRef = useRef({ points, m, b, learningRate, epoch, cost, targetLoss });
  stateRef.current = { points, m, b, learningRate, epoch, cost, targetLoss };

  const reset = () => {
    setM(0); setB(0); setEpoch(0); setCost(0); setIsRunning(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const clearPoints = () => {
    setPoints([]); setM(0); setB(0); setEpoch(0); setCost(0); setIsRunning(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const generateRandomPoints = () => {
    const newPts: Point[] = [];
    const tm = Math.random() * 2 - 1; const tb = Math.random() * 0.5 + 0.25;
    for (let i = 0; i < 20; i++) {
      const x = Math.random();
      const y = tm * x + tb + (Math.random() - 0.5) * 0.2;
      newPts.push({ x: Math.max(0.05, Math.min(0.95, x)), y: Math.max(0.05, Math.min(0.95, y)) });
    }
    setPoints(newPts); setM(0); setB(0); setEpoch(0); setCost(0); setIsRunning(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const step = useCallback(() => {
    const { points: pts, m: cm, b: cb, learningRate: lr, epoch: ep, targetLoss: tl } = stateRef.current;
    if (pts.length === 0) return;
    let mg = 0, bg = 0, cc = 0;
    const N = pts.length;
    for (const p of pts) {
      const err = cm * p.x + cb - p.y;
      mg += (2 / N) * p.x * err; bg += (2 / N) * err; cc += err * err;
    }
    cc /= N;
    const nm = cm - lr * mg, nb = cb - lr * bg, ne = ep + 1;
    setM(nm); setB(nb); setCost(cc); setEpoch(ne);
    if (cc <= tl && ep > 0) {
      setIsRunning(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, []);

  const animate = useCallback(() => {
    step();
    requestRef.current = requestAnimationFrame(animate);
  }, [step]);

  const toggleRun = () => {
    if (isRunning) {
      setIsRunning(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    } else {
      setIsRunning(true);
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'add' || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    setPoints(prev => [...prev, { x, y }]);
  };

  const lineY = (x: number) => 100 - (m * x + b) * 100;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden lg:flex-row lg:gap-4 lg:p-3">
      {/* Canvas */}
      <div className="h-[48vh] shrink-0 lg:h-auto lg:flex-1 bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-2 shadow-sm relative overflow-hidden flex flex-col">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className={`w-full h-full bg-slate-50 dark:bg-[#050505] rounded-xl border border-slate-200 dark:border-[#21262d] ${mode === 'add' ? 'cursor-crosshair' : 'cursor-default'}`}
          onClick={handleSvgClick}
        >
          {Array.from({ length: 11 }).map((_, i) => (
            <React.Fragment key={i}>
              <line x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="currentColor" strokeWidth="0.2" className="text-slate-200 dark:text-white/5" />
              <line x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="currentColor" strokeWidth="0.2" className="text-slate-200 dark:text-white/5" />
            </React.Fragment>
          ))}
          <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" strokeWidth="1" className="text-slate-400 dark:text-slate-600" />
          <line x1="0" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="1" className="text-slate-400 dark:text-slate-600" />
          {points.length > 0 && <line x1={0} y1={lineY(0)} x2={100} y2={lineY(1)} stroke="#10b981" strokeWidth="0.8" className="transition-all duration-75" />}
          {points.map((p, i) => {
            const py = 100 - (m * p.x + b) * 100;
            return <line key={`e${i}`} x1={p.x * 100} y1={100 - p.y * 100} x2={p.x * 100} y2={py} stroke="#ef4444" strokeWidth="0.2" strokeDasharray="1,1" className="opacity-50" />;
          })}
          {points.map((p, i) => <circle key={i} cx={p.x * 100} cy={100 - p.y * 100} r="1.5" className="fill-indigo-500 dark:fill-indigo-400 stroke-white dark:stroke-black stroke-[0.3]" />)}
        </svg>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pointer-events-none">Feature (X)</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap pointer-events-none origin-left -translate-x-3">Target (Y)</div>
        {mode === 'add' && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/80 dark:bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium border border-slate-200 dark:border-white/10 animate-pulse">Click to add data points</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar lg:w-72 lg:flex-none lg:shrink-0 flex flex-col gap-3 p-2 lg:p-0">
        {/* Main Controls */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm"><Settings2 size={16} /> Controls</div>
            <button onClick={() => setShowInfo(true)} className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400"><Info size={14} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex justify-between">Learning Rate <span className="text-slate-800 dark:text-slate-200">{learningRate}</span></label>
              <input type="range" min="0.001" max="0.5" step="0.001" value={learningRate} onChange={e => setLearningRate(parseFloat(e.target.value))} className="w-full accent-emerald-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex justify-between">
                Target Loss
                <input type="number" min="0.001" max="1" step="0.001" value={targetLoss} onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setTargetLoss(v); }} className="bg-transparent text-right w-16 text-slate-800 dark:text-slate-200 focus:outline-none border-b border-slate-200 dark:border-white/10 text-xs" />
              </label>
              <input type="range" min="0.001" max="0.5" step="0.001" value={targetLoss} onChange={e => setTargetLoss(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={toggleRun} disabled={points.length === 0} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all ${points.length === 0 ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-[#21262d]' : isRunning ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'}`}>
                {isRunning ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Train</>}
              </button>
              <button onClick={reset} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-[#21262d] dark:hover:bg-[#30363d] dark:text-slate-300 transition-all"><RotateCcw size={14} /> Reset</button>
            </div>
          </div>
        </div>

        {/* Dataset */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">Dataset ({points.length} pts)</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={() => setMode('add')} className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'add' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}><PlusCircle size={13} /> Add</button>
            <button onClick={() => setMode('view')} className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'view' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}><Pointer size={13} /> View</button>
          </div>
          <div className="flex flex-col gap-1.5">
            <button onClick={generateRandomPoints} className="w-full py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] rounded-lg transition-colors">Generate Random Dataset</button>
            <button onClick={clearPoints} className="w-full py-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors">Clear All</button>
          </div>
        </div>

        {/* Metrics */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Model State</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">EPOCH</div><div className="font-mono text-lg font-black text-slate-800 dark:text-slate-200">{epoch}</div></div>
            <div><div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">MSE COST</div><div className="font-mono text-lg font-black text-red-500 dark:text-red-400">{cost.toFixed(4)}</div></div>
            <div><div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">WEIGHT (m)</div><div className="font-mono text-sm font-bold text-indigo-500 dark:text-indigo-400">{m.toFixed(4)}</div></div>
            <div><div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">BIAS (b)</div><div className="font-mono text-sm font-bold text-sky-500 dark:text-sky-400">{b.toFixed(4)}</div></div>
          </div>
          <div className="font-mono text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-black/50 p-2 rounded-lg border border-slate-100 dark:border-white/5 flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : (cost > 0 && cost <= targetLoss) ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
            {isRunning ? 'Updating Weights...' : (cost > 0 && cost <= targetLoss) ? 'Converged!' : 'Ready'}
          </div>
          <div className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-black/50 p-2 rounded-lg border border-slate-100 dark:border-white/5 text-center">
            y = <span className="text-indigo-500">{m.toFixed(2)}</span>x + <span className="text-sky-500">{b.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-2xl">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full flex items-center justify-center text-slate-500 transition-colors"><X size={16} /></button>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><LineChart className="text-emerald-500" /> Linear Regression</h3>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 overflow-y-auto max-h-[55vh] custom-scrollbar pr-2">
                <p><strong>Linear Regression</strong> is a fundamental ML algorithm used for predicting a continuous outcome variable based on predictor variables.</p>
                <div className="bg-slate-50 dark:bg-black/50 p-3 rounded-xl border border-slate-100 dark:border-white/5"><p className="font-mono text-xs text-center text-indigo-500">y = mx + b</p></div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Gradient Descent</h4>
                <p>We use <strong>Gradient Descent</strong> to iteratively update weight (m) and bias (b) in the direction that minimizes the Mean Squared Error (MSE) cost function.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LinearRegressionVisualizer;
