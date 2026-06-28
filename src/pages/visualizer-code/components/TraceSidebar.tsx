import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Box, Layers, AlertCircle, ChevronDown, ChevronRight, Maximize2, Minimize2, Anchor } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { TraceStep } from '../hooks/useTraceEngine';

function isNodeLike(childKeys: string[], childValues: any[]) {
  if (childKeys.length !== 2) return { isNode: false };
  let hasPointer = false;
  let primitiveIdx = -1;
  let pointerIdx = -1;

  for (let i = 0; i < 2; i++) {
    const val = childValues[i];
    if (val === null || (Array.isArray(val) && val[0] === 'REF')) {
      hasPointer = true;
      pointerIdx = i;
    } else {
      primitiveIdx = i;
    }
  }
  
  if (hasPointer && primitiveIdx !== -1 && pointerIdx !== -1) {
    return { isNode: true, dataKey: childKeys[primitiveIdx], dataVal: childValues[primitiveIdx], ptrKey: childKeys[pointerIdx], ptrVal: childValues[pointerIdx] };
  }

  return { isNode: false };
}

function isTreeNode(childKeys: string[], childValues: any[]) {
  const lcKey = childKeys.map(k => k.toLowerCase());
  const leftIdx = lcKey.indexOf('left') !== -1 ? lcKey.indexOf('left') : lcKey.findIndex(k => k.includes('left'));
  const rightIdx = lcKey.indexOf('right') !== -1 ? lcKey.indexOf('right') : lcKey.findIndex(k => k.includes('right'));
  
  if (leftIdx !== -1 && rightIdx !== -1) {
     let dataIdx = -1;
     for (let i = 0; i < childKeys.length; i++) {
        if (i !== leftIdx && i !== rightIdx) {
           dataIdx = i;
           break;
        }
     }
     
     return { 
       isTree: true, 
       leftVal: childValues[leftIdx], 
       rightVal: childValues[rightIdx], 
       dataVal: dataIdx !== -1 ? childValues[dataIdx] : '{...}',
       allProps: childKeys.map((k, i) => ({ k, v: childValues[i] })).filter((_, i) => i !== leftIdx && i !== rightIdx)
     };
  }
  return { isTree: false };
}

// Recursive ObjectViewer
function ObjectViewer({ name, data, heap, visited = new Set(), isRoot = false }: { name: string; data: any; heap: Record<string, any>; visited?: Set<string>; isRoot?: boolean }) {
  if (data === null || data === undefined) {
    return (
      <div className="flex items-center gap-2 text-[11px] font-mono py-0.5">
        {name && <span className="text-sky-500 dark:text-sky-400 shrink-0">{name}:</span>}
        <span className="text-slate-400 dark:text-zinc-500 italic">null</span>
      </div>
    );
  }

  // Handle Python Tutor Heap References e.g. ["REF", 1]
  let renderData = data;
  let isRef = false;
  let refId = null;

  if (Array.isArray(data) && data[0] === 'REF' && data.length === 2) {
    refId = String(data[1]);
    isRef = true;
    if (visited.has(refId)) {
      return (
        <div className="flex items-center gap-2 text-[11px] font-mono py-0.5">
          {name && <span className="text-sky-500 dark:text-sky-400 shrink-0">{name}:</span>}
          <span className="text-pink-500 dark:text-pink-400 font-bold bg-pink-100 dark:bg-pink-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
            <Layers size={10} /> ↺ Circular @{refId}
          </span>
        </div>
      );
    }
    renderData = heap[refId];
  }

  if (renderData === null || renderData === undefined) {
    return (
      <div className="flex items-center gap-2 text-[11px] font-mono py-0.5">
        {name && <span className="text-sky-500 dark:text-sky-400 shrink-0">{name}:</span>}
        <span className="text-slate-400 dark:text-zinc-500 italic">undefined</span>
      </div>
    );
  }

  if (typeof renderData !== 'object' || (Array.isArray(renderData) && renderData.length === 0 && !isRef)) {
    let color = 'text-amber-600 dark:text-amber-400 font-bold';
    if (typeof renderData === 'string') color = 'text-emerald-600 dark:text-emerald-400';
    return (
      <div className="flex items-center gap-2 text-[11px] font-mono py-0.5">
        {name && <span className="text-sky-500 dark:text-sky-400 shrink-0">{name}:</span>}
        <span className={`${color} break-all`}>
          {typeof renderData === 'string' ? `"${renderData}"` : renderData.toString()}
        </span>
      </div>
    );
  }

  // Parse Pythontutor Heap Signatures
  let typeLabel = "Object";
  let childKeys: string[] = [];
  let childValues: any[] = [];
  let isCustomFormat = false;

  if (Array.isArray(renderData)) {
    const signature = renderData[0];
    if (signature === 'INSTANCE' || signature === 'CLASS' || signature === 'C_STRUCT') {
      isCustomFormat = true;
      typeLabel = renderData[1];
      for (let i = 2; i < renderData.length; i++) {
        if (Array.isArray(renderData[i]) && renderData[i].length === 2) {
          childKeys.push(renderData[i][0]);
          childValues.push(renderData[i][1]);
        }
      }
    } else if (signature === 'LIST' || signature === 'TUPLE' || signature === 'SET' || signature === 'C_ARRAY') {
      isCustomFormat = true;
      typeLabel = signature;
      for (let i = 1; i < renderData.length; i++) {
        childKeys.push(String(i - 1));
        childValues.push(renderData[i]);
      }
    } else if (signature === 'DICT') {
      isCustomFormat = true;
      typeLabel = "DICT";
      for (let i = 1; i < renderData.length; i++) {
        if (Array.isArray(renderData[i]) && renderData[i].length === 2) {
          let k = renderData[i][0];
          childKeys.push(typeof k === 'object' ? JSON.stringify(k) : String(k));
          childValues.push(renderData[i][1]);
        }
      }
    } else if (signature === 'FUNCTION') {
      return (
        <div className="flex items-center gap-2 text-[11px] font-mono py-0.5">
          {name && <span className="text-sky-500 dark:text-sky-400 shrink-0">{name}:</span>}
          <span className="text-pink-600 dark:text-pink-400 font-bold bg-pink-100 dark:bg-pink-900/30 px-1 rounded">ƒ {renderData[1]}()</span>
        </div>
      );
    }
  }

  if (!isCustomFormat) {
    if (Array.isArray(renderData)) {
      typeLabel = "Array";
      childKeys = Object.keys(renderData);
      childValues = Object.values(renderData);
    } else {
      typeLabel = "Object";
      childKeys = Object.keys(renderData);
      childValues = Object.values(renderData);
    }
  }

  const nextVisited = new Set(visited);
  if (isRef && refId) {
    nextVisited.add(refId);
  }

  const isArrayType = typeLabel === "LIST" || typeLabel === "TUPLE" || typeLabel === "SET" || typeLabel === "C_ARRAY" || typeLabel === "Array";

  // Visual Layout: Array Block (Floating Cards for Stacks/Queues)
  if (isArrayType) {
    return (
      <div className="flex flex-col gap-2 w-full my-1 relative py-2 shrink-0">
        {name && <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold tracking-widest uppercase">{name}:</div>}
        
        {/* Horizontal baseline */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 dark:bg-white/10 z-0" />
        
        <div className="flex flex-wrap gap-3 relative z-10 px-2 items-center">
          {childValues.length === 0 ? (
             <div className="px-3 py-2 text-[10px] text-slate-400 italic bg-white dark:bg-[#16161a] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">empty array</div>
          ) : (
            childValues.map((val, idx) => {
               const borderColors = ['border-emerald-400', 'border-cyan-400', 'border-blue-400', 'border-purple-400', 'border-pink-400'];
               const borderCol = borderColors[idx % borderColors.length];
               
               return (
                 <div key={idx} className={`flex flex-col border-2 ${borderCol} rounded-xl bg-white dark:bg-[#16161a] min-w-[50px] shadow-sm flex-1 max-w-[80px]`}>
                   <div className="p-3 flex items-center justify-center h-full min-h-[44px]">
                     <ObjectViewer name="" data={val} heap={heap} visited={nextVisited} />
                   </div>
                   <div className="text-[9px] text-slate-500 font-mono bg-slate-50 dark:bg-white/5 px-1 py-1.5 text-center border-t border-slate-200 dark:border-white/10 rounded-b-lg">
                     IDX: {childKeys[idx]}
                   </div>
                 </div>
               )
            })
          )}
        </div>
      </div>
    );
  }

  const treeCheck = isCustomFormat ? isTreeNode(childKeys, childValues) : { isTree: false };
  const nodeCheck = isCustomFormat && !treeCheck.isTree ? isNodeLike(childKeys, childValues) : { isNode: false };

  // Dynamic Root Pointer Badges
  let rootBadge = null;
  if (isRoot && name && isRef) {
    const lcName = name.toLowerCase();
    if (lcName === 'front') {
      rootBadge = (
         <div className="flex items-center shrink-0 mr-3">
            <div className="flex flex-col items-center justify-center">
              <div className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-[9px] shadow-[0_0_10px_rgba(239,68,68,0.2)]">FRONT</div>
            </div>
            <div className="w-5 h-0.5 bg-red-400 shrink-0 relative">
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 border-red-400 rotate-45" />
            </div>
         </div>
      );
    } else if (lcName === 'rear' || lcName === 'tail') {
      rootBadge = (
         <div className="flex items-center shrink-0 mr-3">
            <div className="flex flex-col items-center justify-center">
              <div className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] shadow-[0_0_10px_rgba(16,185,129,0.2)]">REAR</div>
            </div>
            <div className="w-5 h-0.5 bg-emerald-400 shrink-0 relative">
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 border-emerald-400 rotate-45" />
            </div>
         </div>
      );
    } else if (lcName === 'top') {
      rootBadge = (
         <div className="flex items-center shrink-0 mr-3">
            <div className="flex flex-col items-center justify-center">
              <div className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold text-[9px] shadow-[0_0_10px_rgba(168,85,247,0.2)]">TOP</div>
            </div>
            <div className="w-5 h-0.5 bg-purple-400 shrink-0 relative">
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 border-purple-400 rotate-45" />
            </div>
         </div>
      );
    } else {
      rootBadge = (
          <div className="flex items-center shrink-0 mr-3">
            <div className="flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-orange-400 flex items-center justify-center shadow-[0_0_15px_rgba(251,146,60,0.15)] bg-white dark:bg-black/20">
                <Anchor size={16} className="text-orange-500" />
              </div>
              <span className="text-[9px] font-black text-orange-500 mt-1 uppercase tracking-widest">{name}</span>
            </div>
            <div className="w-5 h-0.5 bg-orange-400 shrink-0 relative -translate-y-2">
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 border-orange-400 rotate-45" />
            </div>
          </div>
      );
    }
  }

  // Visual Layout: Binary Tree Org-Chart
  if (treeCheck.isTree) {
     let displayValue = "{...}";
     if (treeCheck.dataVal !== null && typeof treeCheck.dataVal !== 'object') displayValue = String(treeCheck.dataVal);
     else if (typeof treeCheck.dataVal === 'string') displayValue = treeCheck.dataVal;
     
     const isLeaf = treeCheck.leftVal === null && treeCheck.rightVal === null;

     return (
       <div className="flex flex-col items-center shrink-0 my-4 mx-2">
          {isRoot && name && isRef && (
            <div className="text-[10px] font-black text-blue-500 mb-2 uppercase tracking-widest">{name}</div>
          )}

          <div className="w-[60px] h-[60px] rounded-full border-[3px] border-blue-500 bg-white dark:bg-[#16161a] flex flex-col items-center justify-center shadow-md relative z-10 shrink-0">
             {treeCheck.allProps.length > 0 && (
                <div className="absolute -top-3 text-[9px] text-slate-500 bg-white dark:bg-[#16161a] px-1 font-mono rounded">
                  {treeCheck.allProps[0].k}:{treeCheck.allProps[0].v}
                </div>
             )}
             <span className="text-xl font-black text-slate-800 dark:text-slate-100">{displayValue}</span>
          </div>

          {isLeaf ? (
             <div className="mt-2 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">LEAF</div>
          ) : (
             <div className="flex flex-col items-center w-full min-w-[140px]">
               {/* Vertical Stem */}
               <div className="w-[3px] bg-slate-300 dark:bg-slate-600 h-5 z-0" />
               {/* Horizontal Fork */}
               <div className="flex w-full justify-center relative">
                  <div className="w-1/2 border-t-[3px] border-slate-300 dark:border-slate-600 h-5 border-r-[3px] rounded-tr-xl" />
                  <div className="w-1/2 border-t-[3px] border-slate-300 dark:border-slate-600 h-5 border-l-[3px] rounded-tl-xl" />
               </div>
               
               {/* Children Row */}
               <div className="flex w-full justify-around gap-6 -mt-0.5">
                  <div className="flex flex-col items-center flex-1">
                     {treeCheck.leftVal === null ? (
                        <div className="mt-2 text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded">NULL</div>
                     ) : (
                        <ObjectViewer name="" data={treeCheck.leftVal} heap={heap} visited={nextVisited} isRoot={false} />
                     )}
                  </div>
                  <div className="flex flex-col items-center flex-1">
                     {treeCheck.rightVal === null ? (
                        <div className="mt-2 text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded">NULL</div>
                     ) : (
                        <ObjectViewer name="" data={treeCheck.rightVal} heap={heap} visited={nextVisited} isRoot={false} />
                     )}
                  </div>
               </div>
             </div>
          )}
       </div>
     );
  }

  // Visual Layout: SaaS-Grade Linked List Flow
  if (nodeCheck.isNode) {
    let displayValue = "{...}";
    if (nodeCheck.dataVal !== null && typeof nodeCheck.dataVal !== 'object') {
       displayValue = String(nodeCheck.dataVal);
    } else if (typeof nodeCheck.dataVal === 'string') {
       displayValue = nodeCheck.dataVal;
    }

    return (
      <div className="flex items-center shrink-0 my-2">
        {rootBadge}

        {/* Node Card */}
        <div className="w-[80px] h-[88px] bg-white dark:bg-[#16161a] rounded-xl shadow-[0_4px_15px_-4px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-white/10 flex flex-col items-center justify-between p-2 relative shrink-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono w-full text-left">{refId ? `id:${refId}` : ''}</span>
          <span className="text-2xl font-black text-slate-800 dark:text-slate-100 truncate w-full text-center">{displayValue}</span>
          <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase truncate w-full text-center">{typeLabel}</span>
        </div>
        
        {/* Pointer Arrow */}
        <div className="flex items-center text-slate-300 dark:text-white/20 px-1 shrink-0">
          <div className="w-3 h-0.5 bg-slate-300 dark:bg-white/20" />
          <ChevronRight size={14} className="-ml-1" />
        </div>
        
        {/* Next Node (Recursive) */}
        <div className="flex items-center shrink-0">
           {nodeCheck.ptrVal === null ? (
              <div className="px-3 py-1 border border-slate-200 dark:border-white/10 rounded-lg text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-white/5 shrink-0 shadow-sm">
                NULL
              </div>
           ) : (
              <ObjectViewer name="" data={nodeCheck.ptrVal} heap={heap} visited={nextVisited} isRoot={false} />
           )}
        </div>
      </div>
    );
  }

  // Visual Layout: Memory Card (Instances, Dicts, Structs)
  return (
    <div className="flex flex-col gap-0.5 w-full my-0.5 shrink-0">
      {name && <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium font-mono">{name}:</div>}
      
      <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#16161a] shadow-sm">
        
        <div className="bg-slate-50 dark:bg-white/5 px-3 py-1.5 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Box size={12} className="text-slate-400" />
            {typeLabel}
          </span>
          {isRef && refId && (
            <span className="text-[9px] font-medium text-slate-500 dark:text-zinc-500 bg-slate-200/50 dark:bg-white/10 px-1.5 py-0.5 rounded">
              id:{refId}
            </span>
          )}
        </div>
        
        <div className="p-2 flex flex-col gap-1">
          {childKeys.length === 0 ? (
             <div className="text-[10px] text-slate-400 italic px-1">empty</div>
          ) : (
             childKeys.map((key, idx) => (
               <div key={key} className="flex gap-2 items-start border-b border-slate-100 dark:border-white/5 last:border-b-0 pb-1.5 last:pb-0">
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono w-16 shrink-0 pt-0.5 truncate">{key}:</div>
                  <div className="flex-1 overflow-hidden min-w-0">
                     <ObjectViewer name="" data={childValues[idx]} heap={heap} visited={nextVisited} />
                  </div>
               </div>
             ))
          )}
        </div>
      </div>
    </div>
  );
}

interface TraceSidebarProps {
  currentTrace?: TraceStep;
  stdout: string;
  exception: string | null;
}

export default function TraceSidebar({ currentTrace, stdout, exception }: TraceSidebarProps) {
  const [terminalExpanded, setTerminalExpanded] = useState(false);

  // Auto-expand terminal if there is output, otherwise collapse
  useEffect(() => {
    if (stdout && stdout.trim() !== "") {
      setTerminalExpanded(true);
    }
  }, [stdout]);

  // Extract Globals
  const globals = currentTrace?.globals || {};
  const globalKeys = currentTrace?.ordered_globals || Object.keys(globals);

  // Extract Locals (from stack frames)
  const stack = currentTrace?.stack_to_render || [];

  return (
    <div className="flex flex-col h-full bg-[#dcd0c0] dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl min-h-0">
      
      {/* Header */}
      <div className="shrink-0 bg-[#cfc3b0] dark:bg-[#f8f9fa] px-4 py-3 border-b border-slate-200 dark:border-zinc-200/80 z-30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
           <Layers size={14} className="text-indigo-600" />
           <span className="text-[11px] font-extrabold text-slate-700 dark:text-zinc-700 tracking-widest uppercase">Engine State</span>
        </div>
        
        {currentTrace && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 bg-white/50 dark:bg-black/10 px-2 py-0.5 rounded">
            Line: {currentTrace.line}
          </div>
        )}
      </div>

      {/* Main Scrollable Variable Viewer */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4 min-h-0 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700">
        
        {/* Exception Banner */}
        {exception && (
          <div className="shrink-0 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div className="text-[11px] text-red-800 dark:text-red-200/90 leading-relaxed font-mono whitespace-pre-wrap break-all">
              {exception}
            </div>
          </div>
        )}

        {/* Local Variables (Call Stack) */}
        {stack.length > 0 && (
          <div className="shrink-0 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm">
            <div className="bg-slate-100/50 dark:bg-white/5 px-3 py-2 border-b border-slate-200 dark:border-white/5 flex items-center gap-2 rounded-t-xl">
              <Box size={14} className="text-emerald-500" />
              <h3 className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">Call Stack & Locals</h3>
            </div>
            <div className="p-3 flex flex-col gap-3">
              {stack.map((frame, idx) => (
                <div key={frame.frame_id} className={`border-l-2 pl-3 ${frame.is_highlighted ? 'border-emerald-500' : 'border-slate-300 dark:border-zinc-700'}`}>
                  <div className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1 font-mono">{frame.func_name}()</div>
                  {frame.ordered_varnames.length > 0 ? (
                    <div className="flex flex-col gap-1 w-full overflow-x-auto overflow-y-hidden scrollbar-thin pb-2">
                      {frame.ordered_varnames.map(v => (
                        <ObjectViewer key={v} name={v} data={frame.encoded_locals[v]} isRoot={true} heap={currentTrace?.heap || {}} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 dark:text-zinc-600 italic">No local variables</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Variables */}
        {globalKeys.length > 0 && (
          <div className="shrink-0 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm">
             <div className="bg-slate-100/50 dark:bg-white/5 px-3 py-2 border-b border-slate-200 dark:border-white/5 flex items-center gap-2 rounded-t-xl">
              <Box size={14} className="text-purple-500" />
              <h3 className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">Global Variables</h3>
            </div>
            <div className="p-3 flex flex-col gap-2 w-full overflow-x-auto overflow-y-hidden scrollbar-thin pb-4">
              {globalKeys.map(k => (
                 <ObjectViewer key={k} name={k} data={globals[k]} isRoot={true} heap={currentTrace?.heap || {}} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stdout Console (Collapsible) */}
      <div className="shrink-0 bg-[#1e1e1e] border-t border-slate-800 flex flex-col transition-all duration-300">
        <div 
          className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-black/50 cursor-pointer hover:bg-[#363636] transition-colors"
          onClick={() => setTerminalExpanded(!terminalExpanded)}
        >
          <div className="flex items-center gap-2">
            <Terminal size={12} className="text-slate-400" />
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Standard Output</span>
            {stdout && (
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
            )}
          </div>
          <button className="text-slate-400 hover:text-white transition-colors">
            {terminalExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
        
        <AnimatePresence>
          {terminalExpanded && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed break-all">
                  {stdout || <span className="text-slate-600 italic">No output...</span>}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
