import { ChevronLeft, ChevronRight, RotateCcw, FastForward, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

interface TraceControlsProps {
  currentStep: number;
  totalSteps: number;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onJumpToStep: (step: number) => void;
  disabled?: boolean;
}

export default function TraceControls({
  currentStep,
  totalSteps,
  onStepForward,
  onStepBackward,
  onReset,
  onJumpToStep,
  disabled
}: TraceControlsProps) {
  
  if (totalSteps <= 0) return null;
  
  const progress = (currentStep / (totalSteps - 1)) * 100 || 0;

  return (
    <div className="shrink-0 flex flex-col gap-3 bg-white/70 dark:bg-[#111116]/80 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 p-4 rounded-2xl shadow-xl dark:shadow-black/50">
      
      {/* Slider */}
      <div className={`relative w-full h-2 bg-slate-200 dark:bg-black/50 rounded-full group overflow-hidden shadow-inner ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
           onClick={(e) => {
             if (disabled) return;
             const bounds = e.currentTarget.getBoundingClientRect();
             const percent = (e.clientX - bounds.left) / bounds.width;
             const step = Math.round(percent * (totalSteps - 1));
             onJumpToStep(Math.max(0, Math.min(step, totalSteps - 1)));
           }}>
        <motion.div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          style={{ width: `${progress}%` }}
          layout
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[3px] border-indigo-500 rounded-full shadow-md cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
          style={{ left: `calc(${progress}% - 8px)` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono font-bold text-indigo-500 tracking-widest uppercase mb-0.5">Execution Step</span>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-200">
            {currentStep + 1} <span className="text-slate-400 dark:text-zinc-600 font-normal">/ {totalSteps}</span>
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-black/40 rounded-xl p-1.5 border border-slate-200/50 dark:border-white/5 shadow-inner">
          <button 
            onClick={onReset}
            disabled={currentStep === 0 || disabled}
            className="p-2 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            title="Restart Trace"
          >
            <RotateCcw size={16} strokeWidth={2.5} />
          </button>
          
          <div className="w-px h-5 bg-slate-300 dark:bg-zinc-800 mx-1" />
          
          <button 
            onClick={onStepBackward}
            disabled={currentStep === 0 || disabled}
            className="p-2 text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            title="Step Backward"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          
          <button 
            onClick={onStepForward}
            disabled={currentStep >= totalSteps - 1 || disabled}
            className="p-2 text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            title="Step Forward"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
          
          <div className="w-px h-5 bg-slate-300 dark:bg-zinc-800 mx-1" />
          
          <button 
            onClick={() => onJumpToStep(totalSteps - 1)}
            disabled={currentStep >= totalSteps - 1 || disabled}
            className="p-2 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            title="Jump to End"
          >
            <FastForward size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
