import React, { useState, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings2, PlusCircle, MinusCircle, Info, X, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NeuralNetworkVisualizer = () => {
  const [layers, setLayers] = useState<number[]>([2, 4, 3, 1]);
  const [learningRate, setLearningRate] = useState(0.01);
  const [isRunning, setIsRunning] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState(0.854);
  const [targetLoss, setTargetLoss] = useState(0.010);
  const [showInfo, setShowInfo] = useState(false);
  const [activeLayer, setActiveLayer] = useState(-1);
  const [isForward, setIsForward] = useState(true);

  const requestRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  // Stable refs so callbacks don't go stale
  const stateRef = useRef({ activeLayer, isForward, epoch, loss, targetLoss, layers });
  stateRef.current = { activeLayer, isForward, epoch, loss, targetLoss, layers };

  const reset = () => {
    setEpoch(0);
    setLoss(0.854);
    setIsRunning(false);
    setActiveLayer(-1);
    setIsForward(true);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const addLayer = () => {
    if (layers.length >= 6) return;
    const newLayers = [...layers];
    newLayers.splice(newLayers.length - 1, 0, 4);
    setLayers(newLayers);
  };

  const removeLayer = () => {
    if (layers.length <= 3) return;
    const newLayers = [...layers];
    newLayers.splice(newLayers.length - 2, 1);
    setLayers(newLayers);
  };

  const step = useCallback(() => {
    const now = performance.now();
    if (now - lastUpdateRef.current < 200) return true;
    lastUpdateRef.current = now;

    const { activeLayer: al, isForward: fwd, epoch: ep, loss: ls, targetLoss: tl, layers: lrs } = stateRef.current;

    let nextLayer = al;
    let nextFwd = fwd;

    if (fwd) {
      nextLayer++;
      if (nextLayer >= lrs.length) { nextFwd = false; nextLayer = lrs.length - 1; }
    } else {
      nextLayer--;
      if (nextLayer < 0) {
        nextFwd = true;
        nextLayer = 0;
        const newEpoch = ep + 1;
        const newLoss = Math.max(0.0001, ls * 0.98);
        setEpoch(newEpoch);
        setLoss(newLoss);
        if (newLoss <= tl) {
          setIsRunning(false);
          setActiveLayer(-1);
          setIsForward(true);
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
          return false;
        }
      }
    }
    setActiveLayer(nextLayer);
    setIsForward(nextFwd);
    return true;
  }, []);

  const animate = useCallback(() => {
    const shouldContinue = step();
    if (shouldContinue !== false) {
      requestRef.current = requestAnimationFrame(animate);
    }
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

  const viewBoxWidth = 800;
  const viewBoxHeight = 500;
  const layerSpacing = viewBoxWidth / (layers.length + 1);

  const renderNodes = () => {
    const elements: React.ReactNode[] = [];

    for (let l = 0; l < layers.length - 1; l++) {
      const cSize = layers[l]; const nSize = layers[l + 1];
      const cX = (l + 1) * layerSpacing; const nX = (l + 2) * layerSpacing;
      const cStartY = (viewBoxHeight - (cSize - 1) * 60) / 2;
      const nStartY = (viewBoxHeight - (nSize - 1) * 60) / 2;
      for (let i = 0; i < cSize; i++) for (let j = 0; j < nSize; j++) {
        const isActiveEdge = isRunning && ((isForward && l === activeLayer) || (!isForward && l === activeLayer - 1));
        elements.push(
          <line key={`e-${l}-${i}-${j}`} x1={cX} y1={cStartY + i * 60} x2={nX} y2={nStartY + j * 60}
            stroke={isActiveEdge ? (isForward ? '#10b981' : '#ef4444') : 'currentColor'}
            strokeWidth={isActiveEdge ? '2' : '0.5'}
            className={`transition-all duration-300 ${isActiveEdge ? 'opacity-80' : 'text-slate-300 dark:text-slate-700 opacity-30'}`}
          />
        );
      }
    }

    for (let l = 0; l < layers.length; l++) {
      const lSize = layers[l];
      const x = (l + 1) * layerSpacing;
      const startY = (viewBoxHeight - (lSize - 1) * 60) / 2;
      const isInput = l === 0; const isOutput = l === layers.length - 1;
      const isActive = isRunning && l === activeLayer;
      let strokeColor = 'stroke-slate-300 dark:stroke-slate-700';
      if (isInput) strokeColor = 'stroke-indigo-500';
      else if (!isOutput) strokeColor = 'stroke-sky-500';
      else strokeColor = 'stroke-emerald-500';

      for (let i = 0; i < lSize; i++) {
        const y = startY + i * 60;
        const fillColor = isActive ? (isForward ? 'fill-emerald-400' : 'fill-rose-400') : 'fill-white dark:fill-[#0d1117]';
        const sc = isActive ? 'stroke-white dark:stroke-black' : strokeColor;
        elements.push(
          <g key={`n-${l}-${i}`} className="transition-all duration-300">
            {isActive && <circle cx={x} cy={y} r="22" className={`opacity-30 ${isForward ? 'fill-emerald-500' : 'fill-rose-500'}`} />}
            <circle cx={x} cy={y} r="14" className={`${fillColor} ${sc} stroke-2 transition-colors duration-300`} />
          </g>
        );
      }
      elements.push(
        <text key={`lbl-${l}`} x={x} y={viewBoxHeight - 20} textAnchor="middle"
          className="text-xs font-bold fill-slate-400 dark:fill-slate-500 uppercase tracking-widest pointer-events-none font-mono">
          {isInput ? 'Input' : isOutput ? 'Output' : `Hidden ${l}`}
        </text>
      );
    }
    return elements;
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden lg:flex-row lg:gap-4 lg:p-3">
      {/* ── Canvas (top on mobile, right on desktop) ── */}
      <div className="h-[48vh] shrink-0 lg:h-auto lg:flex-1 bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-2 shadow-sm relative overflow-hidden flex flex-col">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full bg-slate-50 dark:bg-[#050505] rounded-xl border border-slate-200 dark:border-[#21262d]"
        >
          {renderNodes()}
        </svg>
        {/* Legend */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {[['border-indigo-500', 'Input'], ['border-sky-500', 'Hidden'], ['border-emerald-500', 'Output']].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              <div className={`w-2.5 h-2.5 rounded-full border-2 ${c}`} />{l}
            </div>
          ))}
        </div>
      </div>

      {/* ── Controls (bottom on mobile, left on desktop, scrollable) ── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar lg:w-72 lg:flex-none lg:shrink-0 flex flex-col gap-3 p-2 lg:p-0">
        {/* Architecture */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm"><Settings2 size={16} /> Architecture</div>
            <button onClick={() => setShowInfo(true)} className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"><Info size={14} /></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                Hidden Layers <span className="text-slate-800 dark:text-slate-200">{layers.length - 2}</span>
              </label>
              <div className="flex gap-2">
                <button onClick={removeLayer} disabled={layers.length <= 3} className="flex-1 py-2 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 text-slate-600 dark:text-slate-300 transition-colors"><MinusCircle size={15} /></button>
                <button onClick={addLayer} disabled={layers.length >= 6} className="flex-1 py-2 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 text-slate-600 dark:text-slate-300 transition-colors"><PlusCircle size={15} /></button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                Learning Rate <span className="text-slate-800 dark:text-slate-200">{learningRate}</span>
              </label>
              <input type="range" min="0.001" max="0.1" step="0.001" value={learningRate} onChange={e => setLearningRate(parseFloat(e.target.value))} className="w-full accent-emerald-500" />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                Target Loss
                <input type="number" min="0.001" max="0.8" step="0.001" value={targetLoss}
                  onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setTargetLoss(v); }}
                  className="bg-transparent text-right w-16 text-slate-800 dark:text-slate-200 focus:outline-none border-b border-slate-200 dark:border-white/10 text-xs" />
              </label>
              <input type="range" min="0.001" max="0.5" step="0.001" value={targetLoss} onChange={e => setTargetLoss(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={toggleRun} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${isRunning ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'}`}>
                {isRunning ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Train</>}
              </button>
              <button onClick={reset} className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-[#21262d] dark:hover:bg-[#30363d] dark:text-slate-300 transition-all">
                <RotateCcw size={15} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            Training Metrics
            <span className={`text-[9px] px-2 py-0.5 rounded-full border ${isForward ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'}`}>
              {isRunning ? (isForward ? 'FWD PROP' : 'BACK PROP') : 'IDLE'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">EPOCH</div><div className="font-mono text-xl font-black text-slate-800 dark:text-slate-200">{epoch}</div></div>
            <div><div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">BCE LOSS</div><div className="font-mono text-xl font-black text-red-500 dark:text-red-400">{loss.toFixed(4)}</div></div>
          </div>
          <div className="font-mono text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-black/50 p-2 rounded-lg border border-slate-100 dark:border-white/5 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : loss <= targetLoss && epoch > 0 ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
            {isRunning ? 'Updating Weights...' : loss <= targetLoss && epoch > 0 ? 'Converged!' : 'Ready'}
          </div>
        </div>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-2xl">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full flex items-center justify-center text-slate-500 transition-colors"><X size={16} /></button>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Network className="text-emerald-500" /> Deep Neural Network</h3>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 overflow-y-auto max-h-[55vh] custom-scrollbar pr-2">
                <p>A <strong>Neural Network</strong> is a series of algorithms that endeavors to recognize underlying relationships in a set of data through a process that mimics the way the human brain operates.</p>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Forward Propagation</h4>
                <p>Data is fed through the input layer, passing through hidden layers to the output. At each node, the input is multiplied by a weight, a bias is added, and it passes through an activation function.</p>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Backpropagation</h4>
                <p>After calculating the error (Loss) at the output, the network works backwards, calculating gradients to adjust the weights and biases using the <strong>Chain Rule</strong>.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Green Pulse:</strong> Forward Propagation (computing predictions).</li>
                  <li><strong>Red Pulse:</strong> Backpropagation (updating weights based on loss).</li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NeuralNetworkVisualizer;
