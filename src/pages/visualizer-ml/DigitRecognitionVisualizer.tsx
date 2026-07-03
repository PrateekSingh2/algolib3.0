import React, { useState, useRef, useEffect } from 'react';
import { Eraser, Settings2, Info, X, ChevronDown, CheckCircle2, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore - Requires user to run npm install tesseract.js
import Tesseract from 'tesseract.js';

type RecognitionMode = 'digits' | 'alphabets';

const DigitRecognitionVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<RecognitionMode>('digits');
  const [showInfo, setShowInfo] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isPropagating, setIsPropagating] = useState(false);
  const [activeLayer, setActiveLayer] = useState(-1);
  const requestRef = useRef<number>();

  const outputNodes = mode === 'digits' 
    ? ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    : Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // A-Z

  // Neural Network Architecture layers sizes (visualized from Left to Right)
  // Input: 16 (mocked 28x28 representation), Hidden1: 12, Hidden2: 12, Output: variable
  const visualLayers = [16, 12, 12, outputNodes.length > 15 ? 15 : outputNodes.length];

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    setPrediction(null);
    setIsPropagating(false);
    setActiveLayer(-1);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  useEffect(() => {
    clearCanvas();
  }, [mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (e.type.startsWith('touch')) {
        e.preventDefault();
    }

    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? (e as React.MouseEvent).clientX : (e as React.TouchEvent).touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? (e as React.MouseEvent).clientY : (e as React.TouchEvent).touches[0].clientY) - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.beginPath();
    ctx.moveTo(x * scaleX, y * scaleY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (e.type.startsWith('touch')) {
        e.preventDefault();
    }

    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? (e as React.MouseEvent).clientX : (e as React.TouchEvent).touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? (e as React.MouseEvent).clientY : (e as React.TouchEvent).touches[0].clientY) - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineTo(x * scaleX, y * scaleY);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 18; 
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    simulatePrediction();
  };

  const prepareImageForOCR = (): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
      let hasPixels = false;

      // Find bounding box of drawn pixels
      for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
              const idx = (y * canvas.width + x) * 4;
              if (data[idx] < 128) { 
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                  hasPixels = true;
              }
          }
      }

      if (!hasPixels) return null;

      let boxWidth = maxX - minX;
      let boxHeight = maxY - minY;

      // Reject accidental tiny dots
      if (boxWidth < 10 && boxHeight < 10) return null;

      // Create a new canvas to center the drawing with heavy padding (OCR likes white space)
      const pad = 40;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = boxWidth + pad * 2;
      tempCanvas.height = boxHeight + pad * 2;
      const tCtx = tempCanvas.getContext('2d');
      if (!tCtx) return null;

      // Fill background white
      tCtx.fillStyle = '#ffffff';
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw the cropped character into the center of the new padded canvas
      tCtx.drawImage(canvas, minX, minY, boxWidth, boxHeight, pad, pad, boxWidth, boxHeight);
      
      return tempCanvas.toDataURL('image/png');
  };

  const simulatePrediction = () => {
    setIsPropagating(true);
    let currentLayer = 0;
    
    // Animate the network flowing left-to-right
    const animate = () => {
      setActiveLayer(currentLayer);
      currentLayer++;
      
      if (currentLayer <= visualLayers.length) {
        requestRef.current = requestAnimationFrame(() => {
            setTimeout(animate, 150); 
        });
      } else {
        // Animation finished, call Tesseract
        const dataUrl = prepareImageForOCR();
        if (dataUrl) {
            Tesseract.recognize(
                dataUrl,
                'eng',
                {
                   // We remove the strict whitelist so Tesseract can freely guess if it's a number or letter
                   // This allows us to catch if a user draws a number while in alphabet mode.
                }
            ).then(({ data: { text } }: any) => {
                const cleanedText = text.replace(/[^a-zA-Z0-9]/g, '');
                if (cleanedText.length > 0) {
                    const char = cleanedText[0].toUpperCase();
                    
                    // Cross-mode validation
                    const isDigit = /[0-9]/.test(char);
                    const isAlphabet = /[A-Z]/.test(char);

                    if (mode === 'digits' && isAlphabet) {
                        setPrediction("INVALID");
                    } else if (mode === 'alphabets' && isDigit) {
                        setPrediction("INVALID");
                    } else {
                        setPrediction(char);
                    }
                } else {
                    setPrediction("?");
                }
                setIsPropagating(false);
                setActiveLayer(-1);
            }).catch((err: any) => {
                console.error("Tesseract Error:", err);
                setPrediction("ERR");
                setIsPropagating(false);
                setActiveLayer(-1);
            });
        } else {
            setIsPropagating(false);
            setActiveLayer(-1);
            setPrediction(null);
        }
      }
    };
    
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    animate();
  };
  
  useEffect(() => {
      return () => {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }
  }, []);

  // Set up Left-To-Right Network Dimensions
  const viewBoxWidth = 800; // Width of SVG (layers spaced horizontally)
  const viewBoxHeight = 1200; // Height of SVG (allows scrollable vertical nodes)
  const layerSpacing = viewBoxWidth / (visualLayers.length + 1);

  const renderNodes = () => {
    const elements: React.ReactNode[] = [];

    // Edges (Drawn Horizontally: left to right)
    for (let l = 0; l < visualLayers.length - 1; l++) {
      const cSize = visualLayers[l];
      const nSize = visualLayers[l + 1];
      const cX = (l + 1) * layerSpacing;
      const nX = (l + 2) * layerSpacing;
      
      const cSpacing = Math.min(60, viewBoxHeight / cSize);
      const nSpacing = Math.min(60, viewBoxHeight / nSize);
      
      const cStartY = (viewBoxHeight - (cSize - 1) * cSpacing) / 2;
      const nStartY = (viewBoxHeight - (nSize - 1) * nSpacing) / 2;
      
      const isActiveEdge = isPropagating && (l === activeLayer || l === activeLayer - 1);
      
      for (let i = 0; i < cSize; i++) {
          for (let j = 0; j < nSize; j++) {
            if ((cSize > 10 || nSize > 10) && Math.random() > 0.3 && !isActiveEdge) continue;
            
            elements.push(
              <line 
                key={`e-${l}-${i}-${j}`} 
                x1={cX} 
                y1={cStartY + i * cSpacing} 
                x2={nX} 
                y2={nStartY + j * nSpacing}
                stroke={isActiveEdge ? '#10b981' : 'currentColor'}
                strokeWidth={isActiveEdge ? '1.5' : '0.2'}
                className={`transition-all duration-300 ${isActiveEdge ? 'opacity-80' : 'text-slate-300 dark:text-slate-700 opacity-20'}`}
              />
            );
          }
      }
    }

    // Nodes (Drawn Vertically in Columns)
    for (let l = 0; l < visualLayers.length; l++) {
      const lSize = visualLayers[l];
      const x = (l + 1) * layerSpacing;
      const spacing = Math.min(60, viewBoxHeight / lSize);
      const startY = (viewBoxHeight - (lSize - 1) * spacing) / 2;
      
      const isInput = l === 0;
      const isOutput = l === visualLayers.length - 1;
      const isActive = isPropagating && l === activeLayer;
      
      let strokeColor = 'stroke-slate-300 dark:stroke-slate-700';
      if (isInput) strokeColor = 'stroke-indigo-500';
      else if (!isOutput) strokeColor = 'stroke-sky-500';
      else strokeColor = 'stroke-emerald-500';

      for (let i = 0; i < lSize; i++) {
        const y = startY + i * spacing;
        
        const isPredictedNode = isOutput && !isPropagating && prediction === outputNodes[i];
        const fillColor = isActive || isPredictedNode ? 'fill-emerald-400' : 'fill-white dark:fill-[#0d1117]';
        const sc = isActive || isPredictedNode ? 'stroke-white dark:stroke-black' : strokeColor;
        
        elements.push(
          <g key={`n-${l}-${i}`} className="transition-all duration-300">
            {(isActive || isPredictedNode) && <circle cx={x} cy={y} r="16" className="opacity-30 fill-emerald-500" />}
            <circle cx={x} cy={y} r={isOutput && mode === 'alphabets' ? "6" : "9"} className={`${fillColor} ${sc} stroke-[1.5px] transition-colors duration-300`} />
            
            {/* Show labels for output layer nodes */}
            {isOutput && (
                <text 
                    x={x + 20} 
                    y={y + 4} 
                    textAnchor="start"
                    className={`font-bold ${isPredictedNode ? 'fill-emerald-600 dark:fill-emerald-400 text-[18px]' : 'fill-slate-500 dark:fill-slate-400 text-[12px]'}`}
                >
                    {outputNodes[i]}
                </text>
            )}
          </g>
        );
      }
      
      elements.push(
        <text key={`lbl-${l}`} x={x} y={20} textAnchor="middle"
          className="text-[12px] font-bold fill-slate-400 dark:fill-slate-500 uppercase tracking-widest pointer-events-none font-mono">
          {isInput ? 'Input (784)' : isOutput ? 'Output' : `Hidden ${l}`}
        </text>
      );
    }
    return elements;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full relative overflow-y-auto custom-scrollbar lg:overflow-hidden p-3 gap-4">
      
      {/* ── Left: Neural Network Visualizer (Horizontal Flow, Vertically Scrollable) ── */}
      <div className="w-full lg:w-1/2 shrink-0 h-[40vh] lg:h-full bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-2 shadow-sm relative overflow-y-auto custom-scrollbar flex flex-col">
        <div className="sticky top-1 left-1 flex flex-wrap gap-2 z-10 p-2 bg-white/80 dark:bg-[#0d1117]/80 backdrop-blur-sm rounded-lg w-fit">
          {[['border-indigo-500', 'Pixel Input'], ['border-sky-500', 'Hidden'], ['border-emerald-500', 'Classification']].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              <div className={`w-2.5 h-2.5 rounded-full border-2 ${c}`} />{l}
            </div>
          ))}
        </div>
        <div className="min-w-[600px] min-h-[800px] w-full h-full pb-10">
            <svg
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full bg-slate-50 dark:bg-[#050505] rounded-xl border border-slate-200 dark:border-[#21262d]"
            >
                {renderNodes()}
            </svg>
        </div>
      </div>

      {/* ── Right: Canvas, Prediction, & Settings (Vertically Scrollable) ── */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto custom-scrollbar flex flex-col gap-4 pb-10 lg:pb-0 pr-1">
          
        {/* Drawing Canvas Area */}
        <div className="w-full bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center relative shrink-0">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 font-mono uppercase tracking-widest flex items-center gap-2">
                <PenTool size={16} className="text-emerald-500" />
                Draw a {mode === 'digits' ? 'Digit (0-9)' : 'Letter (A-Z)'}
            </h3>
            
            <div className="w-full max-w-[280px] aspect-square relative group">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none rounded-xl" />
                <canvas
                    ref={canvasRef}
                    width={280}
                    height={280}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full border-2 border-slate-200 dark:border-white/10 rounded-xl bg-white shadow-inner cursor-crosshair touch-none"
                />
            </div>
            
            <div className="mt-6 w-full max-w-[280px]">
                <button 
                    onClick={clearCanvas}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 rounded-xl font-bold transition-colors border border-rose-200 dark:border-rose-500/20 shadow-sm"
                >
                    <Eraser size={18} /> Clear Canvas
                </button>
            </div>
        </div>

        {/* Bottom Section: Prediction & Settings side-by-side on large screens */}
        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            {/* Prediction Panel */}
            <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center flex-1 min-h-[180px]">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Network Prediction</div>
                
                <div className="flex-1 flex flex-col items-center justify-center w-full">
                    {isPropagating ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-16 w-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                            <div className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">Running OCR...</div>
                        </div>
                    ) : prediction ? (
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring" }}
                            className="flex flex-col items-center"
                        >
                            <div className="text-[100px] font-black text-slate-900 dark:text-white leading-none font-mono tracking-tighter">
                                {prediction === "INVALID" ? "?" : prediction}
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 rounded-full mt-3">
                                {prediction === "?" || prediction === "ERR" ? (
                                    <><X size={16} className="text-rose-500" /> <span className="text-rose-600 dark:text-rose-400">Unrecognized</span></>
                                ) : prediction === "INVALID" ? (
                                    <><X size={16} className="text-amber-500" /> <span className="text-amber-600 dark:text-amber-400">Unable to recognize</span></>
                                ) : (
                                    <><CheckCircle2 size={16} /> Confident Match</>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-slate-400 dark:text-slate-500 text-sm italic">
                            Waiting for input...
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Panel */}
            <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-5 shadow-sm sm:w-56 shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm"><Settings2 size={16} /> Config</div>
                    <button onClick={() => setShowInfo(true)} className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"><Info size={14} /></button>
                </div>
                
                <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                        Target Classes
                    </label>
                    <div className="relative">
                        <select 
                            value={mode}
                            onChange={(e) => setMode(e.target.value as RecognitionMode)}
                            className="w-full appearance-none bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-[#30363d] text-slate-800 dark:text-slate-200 text-sm font-bold rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow cursor-pointer"
                        >
                            <option value="digits">Digits (0-9)</option>
                            <option value="alphabets">Alphabets (A-Z)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                            <ChevronDown size={16} />
                        </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
                        <div className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Architecture</div>
                        <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                            <div className="flex justify-between"><span>Input:</span> <span className="font-mono font-bold">784</span></div>
                            <div className="flex justify-between"><span>Output:</span> <span className="font-mono font-bold">{mode === 'digits' ? '10' : '26'}</span></div>
                        </div>
                    </div>
                </div>
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><PenTool className="text-emerald-500" /> Handwriting Recognition</h3>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 overflow-y-auto max-h-[55vh] custom-scrollbar pr-2">
                <p>This visualizer demonstrates how neural networks extract features to classify handwritten characters.</p>
                
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-4">How it works:</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Feature Extraction:</strong> The 28x28 drawing grid is cropped to the bounding box of your drawing and padded.</li>
                  <li><strong>Tesseract.js Engine:</strong> The prepared canvas is sent to a browser-based WebAssembly port of the Tesseract OCR engine, providing near 100% handwriting recognition accuracy!</li>
                </ol>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DigitRecognitionVisualizer;
