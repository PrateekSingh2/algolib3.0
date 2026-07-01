import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, RotateCcw, ArrowRight, Trash2,
  CornerDownRight, X, Play, Pause, StepForward, StepBack,
  Minimize2, Maximize2,
  ArrowDownToLine,
  Target,
  Anchor,
  Activity,
  Terminal,
  Box,
  Zap,
  Info,
  Settings2
} from 'lucide-react';
import { useCollaboration } from '@/contexts/CollaborationContext';

// --- TYPES & GAME STATE ---
type ListType = 'singly' | 'doubly' | 'circular' | 'doubly-circular';
type NodeData = {
  id: string;
  value: number;
  isNew?: boolean;
  isDeleting?: boolean;
};

type CodeLine = { id: string; text: string; explanation: string; active: boolean };
type VariableState = { name: string; value: string; color: string };

type VisualFrame = {
  nodes: NodeData[];
  phantom: NodeData | null;
  seekerIndex: number | null;
  codeLines: CodeLine[];
  variables: VariableState[];
  message: string;
};

// --- ADVANCED HINGLISH EXECUTION MATRIX ---
const SNIPPETS = {
  singly: {
    insertIndex: [
      { id: '1', text: 'Node temp = new Node(val);', explanation: 'Heap memory mein naya node spawn kiya.', active: false },
      { id: '2', text: 'Node ptr = head;', explanation: 'Scanner (ptr) ko pahli node par rakha jaha head point kar raha hai.', active: false },
      { id: '3', text: 'while(i < index - 1) ptr = ptr.next;', explanation: 'Target position se ek pehle tak scan karte hue jao... (O(N) Time)', active: false },
      { id: '4', text: 'temp.next = ptr.next;', explanation: 'Naye node ko aage wale chain se joda.', active: false },
      { id: '5', text: 'ptr.next = temp;', explanation: 'Peeche wale node ko naye node se connect kar diya!', active: false }
    ],
    deleteIndex: [
      { id: '1', text: 'Node ptr = head;', explanation: 'Scanner deploy kiya.', active: false },
      { id: '2', text: 'while(i < index - 1) ptr = ptr.next;', explanation: 'Target se ek kadam pehle tak navigate karo... (O(N) Time)', active: false },
      { id: '3', text: 'Node temp = ptr.next;', explanation: 'Delete hone wale node pe target lock kiya.', active: false },
      { id: '4', text: 'ptr.next = temp.next;', explanation: 'Bypass link bana diya (Target ko chain se kaat diya).', active: false },
      { id: '5', text: 'delete temp;', explanation: 'Target destroyed!', active: false }
    ]
  },
  doublyCircular: {
    insertEnd: [
      { id: '1', text: 'Node temp = new Node(val);', explanation: 'Ek nayi node banayi aur use heap memory mein allocate kiya.', active: false },
      { id: '2', text: 'Node tail = head.prev;', explanation: 'WARP ZONE! Head ke peeche hi Tail hai. Direct jump in O(1) time!', active: false },
      { id: '3', text: 'temp.next = head; temp.prev = tail;', explanation: 'Naye node ko Head (aage) aur Tail (peeche) se joda.', active: false },
      { id: '4', text: 'tail.next = temp; head.prev = temp;', explanation: 'List ko wapas circular lock kar diya!', active: false }
    ],
    deleteEnd: [
      { id: '1', text: 'Node tail = head.prev;', explanation: 'WARP ZONE! Direct aakhri node pe target lock kiya (O(1) time).', active: false },
      { id: '2', text: 'Node newTail = tail.prev;', explanation: 'Second-last node ko naya Tail banne ke liye chuna.', active: false },
      { id: '3', text: 'newTail.next = head; head.prev = newTail;', explanation: 'Naye tail aur head ko aapas mein link kar diya.', active: false },
      { id: '4', text: 'delete tail;', explanation: 'Purana aakhri node memory se uda diya!', active: false }
    ]
  }
};

const headSnippets = {
  insertHead: [
    { id: '1', text: 'Node temp = new Node(val);', explanation: 'Heap memory mein naya node spawn kiya.', active: false },
    { id: '2', text: 'temp.next = head;', explanation: 'Naye node ka pointer purane head pe aim kar raha hai.', active: false },
    { id: '3', text: 'head = temp;', explanation: 'Ab system ko bata diya ki ye naya dabba hi hamara naya Head hai!', active: false },
  ],
  deleteHead: [
    { id: '1', text: 'if(head == null) return;', explanation: 'Agar list khali hai, toh delete kya karoge?', active: false },
    { id: '2', text: 'Node temp = head;', explanation: 'Pehle node pe target lock kiya (temp).', active: false },
    { id: '3', text: 'head = head.next;', explanation: 'Head ka taj (crown) agle node ko pehna diya.', active: false },
    { id: '4', text: 'delete temp;', explanation: 'Target eliminated. Memory se uda diya!', active: false }
  ]
};

const CyberGrid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-br from-[#c4c3ff] via-[#e6e6ff] to-[#fce4ff] dark:bg-none dark:bg-[#09090b]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.07),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.05),transparent_70%)]" />
  </div>
);

const LinkedListVisualizer = () => {
  const [listType, setListType] = useState<ListType>('singly');
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: '1A', value: 42 }, { id: '2B', value: 88 }, { id: '3C', value: 15 }
  ]);

  const [inputValue, setInputValue] = useState<number>(0);
  const [inputIndex, setInputIndex] = useState<number>(1);
  const [showHUD, setShowHUD] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // FRAME-BASED ANIMATION ENGINE
  const [frames, setFrames] = useState<VisualFrame[]>([]);
  const [frameIdx, setFrameIdx] = useState<number>(0);

  // Visual states synced to current frame
  const [message, setMessage] = useState('SYSTEM_IDLE: Ready for input');
  const [codeLines, setCodeLines] = useState<CodeLine[]>([]);
  const [variables, setVariables] = useState<VariableState[]>([]);
  const [phantom, setPhantom] = useState<NodeData | null>(null);
  const [seekerIndex, setSeekerIndex] = useState<number | null>(null);

  // DYNAMIC SVG TRACKING
  const [svgDim, setSvgDim] = useState({ height: 0, isSm: false });
  const containerRef = useRef<HTMLDivElement>(null);

  // --- COLLABORATION HOOK ---
  const { role, roomState, broadcastState } = useCollaboration();

  // Host Broadcasts State
  useEffect(() => {
    if (role === 'host') {
      broadcastState({
        listType,
        nodes,
        frames,
        frameIdx,
        isPaused,
        isAnimating,
        inputValue,
        inputIndex,
      });
    }
  }, [listType, nodes, frames, frameIdx, isPaused, isAnimating, inputValue, inputIndex, role, broadcastState]);

  // Viewer Receives State
  useEffect(() => {
    if (role === 'viewer' && roomState) {
      if (roomState.listType !== undefined) setListType(roomState.listType);
      if (roomState.nodes !== undefined) setNodes(roomState.nodes);
      if (roomState.frames !== undefined) setFrames(roomState.frames);
      if (roomState.frameIdx !== undefined) setFrameIdx(roomState.frameIdx);
      if (roomState.isPaused !== undefined) setIsPaused(roomState.isPaused);
      if (roomState.isAnimating !== undefined) setIsAnimating(roomState.isAnimating);
      if (roomState.inputValue !== undefined) setInputValue(roomState.inputValue);
      if (roomState.inputIndex !== undefined) setInputIndex(roomState.inputIndex);
    }
  }, [role, roomState]);

  useEffect(() => {
    generateRandom();
  }, []);

  // ResizeObserver guarantees perfectly connected lines on any screen size/orientation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      setSvgDim({
        height: container.clientHeight,
        isSm: window.innerWidth >= 640
      });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const generateRandom = () => setInputValue(Math.floor(Math.random() * 99) + 1);

  // Sync visual components to the active frame
  useEffect(() => {
    if (frames.length > 0 && frameIdx >= 0 && frameIdx < frames.length) {
      const f = frames[frameIdx];
      setNodes(f.nodes);
      setPhantom(f.phantom);
      setSeekerIndex(f.seekerIndex);
      setCodeLines(f.codeLines);
      setVariables(f.variables);
      setMessage(f.message);

      // Final frame cleanup timeout
      if (frameIdx === frames.length - 1) {
        const tm = setTimeout(() => {
          setNodes(prev => prev.map(n => ({ ...n, isNew: false, isDeleting: false })));
          setIsAnimating(false);
          setFrames([]);
          setCodeLines([]);
          setVariables([]);
          generateRandom();
        }, 1000);
        return () => clearTimeout(tm);
      }
    }
  }, [frameIdx, frames]);

  // Autoplay engine
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (role !== 'viewer' && !isPaused && isAnimating && frames.length > 0 && frameIdx < frames.length - 1) {
      timer = setTimeout(() => {
        setFrameIdx(prev => prev + 1);
      }, 1200);
    }
    return () => clearTimeout(timer);
  }, [isPaused, isAnimating, frameIdx, frames, role]);

  const handleInsert = (position: 'head' | 'index' | 'end') => {
    if (isAnimating || role === 'viewer') return;
    setIsAnimating(true);

    let targetIdx = position === 'head' ? 0 : position === 'end' ? nodes.length : Math.max(0, Math.min(inputIndex, nodes.length));
    const newNode = { id: Math.floor(Math.random() * 90 + 10).toString(), value: inputValue, isNew: true };

    let currentNodes = [...nodes];
    let newFrames: VisualFrame[] = [];

    const addFrame = (snippet: CodeLine[], lineId: string, vars: VariableState[], seeker: number | null, phan: NodeData | null, n: NodeData[] = currentNodes) => {
      const currentLine = snippet.find(l => l.id === lineId);
      newFrames.push({
        nodes: n.map(x => ({ ...x })),
        phantom: phan ? { ...phan } : null,
        seekerIndex: seeker,
        codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })),
        variables: vars.map(v => ({ ...v })),
        message: currentLine ? currentLine.explanation : 'Processing...'
      });
    };

    if (position === 'end' && listType === 'doubly-circular') {
      const snippet = SNIPPETS.doublyCircular.insertEnd;
      let v = [{ name: 'temp', value: `${newNode.value}`, color: '#00ff88' }];
      addFrame(snippet, '1', v, null, newNode);

      v = [...v, { name: 'tail', value: currentNodes[currentNodes.length - 1]?.id || 'NULL', color: '#00f5ff' }];
      addFrame(snippet, '2', v, currentNodes.length - 1, newNode);
      addFrame(snippet, '3', v, currentNodes.length - 1, newNode);
      addFrame(snippet, '4', v, currentNodes.length - 1, newNode);
    }
    else {
      const snippet = position === 'head' ? headSnippets.insertHead : SNIPPETS.singly.insertIndex;
      let v = [{ name: 'temp', value: `${newNode.value}`, color: '#00ff88' }];
      addFrame(snippet, '1', v, null, newNode);

      if (position === 'head') {
        addFrame(snippet, '2', v, null, newNode);
        v = [...v, { name: 'head', value: newNode.id, color: '#fbbf24' }];
        addFrame(snippet, '3', v, null, newNode);
      } else {
        v = [...v, { name: 'ptr', value: 'HEAD', color: '#00f5ff' }];
        addFrame(snippet, '2', v, null, newNode);

        for (let i = 0; i < targetIdx - 1; i++) {
          let loopV = [{ name: 'temp', value: `${newNode.value}`, color: '#00ff88' }, { name: 'ptr', value: currentNodes[i]?.id || 'NULL', color: '#00f5ff' }];
          addFrame(snippet, '3', loopV, i, newNode);
        }

        let finalSeeker = Math.max(0, targetIdx - 1);
        let finalV = [{ name: 'temp', value: `${newNode.value}`, color: '#00ff88' }, { name: 'ptr', value: currentNodes[finalSeeker]?.id || 'NULL', color: '#00f5ff' }];
        addFrame(snippet, '4', finalV, finalSeeker, newNode);
        addFrame(snippet, '5', finalV, finalSeeker, newNode);
      }
    }

    currentNodes.splice(targetIdx, 0, newNode);
    newFrames.push({
      nodes: currentNodes.map(x => ({ ...x })),
      phantom: null,
      seekerIndex: null,
      codeLines: [],
      variables: [],
      message: "MISSION_PASSED: Node Inserted"
    });

    setFrames(newFrames);
    setFrameIdx(0);
  };

  const handleDelete = (position: 'head' | 'index' | 'end') => {
    if (isAnimating || nodes.length === 0 || role === 'viewer') return;
    setIsAnimating(true);

    let targetIdx = position === 'head' ? 0 : position === 'end' ? nodes.length - 1 : Math.max(0, Math.min(inputIndex, nodes.length - 1));

    let currentNodes = [...nodes];
    let newFrames: VisualFrame[] = [];

    const addFrame = (snippet: CodeLine[], lineId: string, vars: VariableState[], seeker: number | null, n: NodeData[] = currentNodes) => {
      const currentLine = snippet.find(l => l.id === lineId);
      newFrames.push({
        nodes: n.map(x => ({ ...x })),
        phantom: null,
        seekerIndex: seeker,
        codeLines: snippet.map(line => ({ ...line, active: line.id === lineId })),
        variables: vars.map(v => ({ ...v })),
        message: currentLine ? currentLine.explanation : 'Processing...'
      });
    };

    if (position === 'end' && listType === 'doubly-circular') {
      const snippet = SNIPPETS.doublyCircular.deleteEnd;
      let v = [{ name: 'tail', value: currentNodes[currentNodes.length - 1].id, color: '#ef4444' }];
      addFrame(snippet, '1', v, currentNodes.length - 1);

      v = [...v, { name: 'newTail', value: currentNodes[currentNodes.length - 2]?.id || 'NULL', color: '#00f5ff' }];
      addFrame(snippet, '2', v, currentNodes.length - 2);
      addFrame(snippet, '3', v, currentNodes.length - 2);

      let markedNodes = currentNodes.map((n, i) => i === currentNodes.length - 1 ? { ...n, isDeleting: true } : n);
      addFrame(snippet, '4', v, currentNodes.length - 2, markedNodes);
    }
    else {
      const snippet = position === 'head' ? headSnippets.deleteHead : SNIPPETS.singly.deleteIndex;

      if (position === 'head') {
        addFrame(snippet, '1', [], null);
        let v = [{ name: 'temp', value: currentNodes[0].id, color: '#ef4444' }];
        addFrame(snippet, '2', v, null);
        let markedNodes = currentNodes.map((n, i) => i === 0 ? { ...n, isDeleting: true } : n);
        let v2 = [...v, { name: 'head', value: currentNodes[1]?.id || 'NULL', color: '#fbbf24' }];
        addFrame(snippet, '3', v2, null, markedNodes);
        addFrame(snippet, '4', v2, null, markedNodes);
      } else {
        if (targetIdx === 0) targetIdx = 1;
        let v = [{ name: 'ptr', value: 'HEAD', color: '#00f5ff' }];
        addFrame(snippet, '1', v, null);

        for (let i = 0; i < targetIdx - 1; i++) {
          let loopV = [{ name: 'ptr', value: currentNodes[i].id, color: '#00f5ff' }];
          addFrame(snippet, '2', loopV, i);
        }

        let finalSeeker = targetIdx - 1;
        let v2 = [{ name: 'ptr', value: currentNodes[finalSeeker]?.id || 'NULL', color: '#00f5ff' }, { name: 'temp', value: currentNodes[targetIdx]?.id || 'NULL', color: '#ef4444' }];
        addFrame(snippet, '3', v2, finalSeeker);

        let markedNodes = currentNodes.map((n, i) => i === targetIdx ? { ...n, isDeleting: true } : n);
        addFrame(snippet, '4', v2, finalSeeker, markedNodes);
        addFrame(snippet, '5', v2, finalSeeker, markedNodes);
      }
    }

    currentNodes.splice(targetIdx, 1);
    newFrames.push({
      nodes: currentNodes.map(x => ({ ...x })),
      phantom: null,
      seekerIndex: null,
      codeLines: [],
      variables: [],
      message: "TARGET_ELIMINATED: Memory Freed"
    });

    setFrames(newFrames);
    setFrameIdx(0);
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row-reverse gap-4 lg:gap-6 h-full w-full relative font-sans text-slate-900 dark:text-white lg:p-3">

      {/* LEFT: COMMAND CENTER */}
      <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 flex-1 min-h-0 lg:flex-none overflow-y-auto custom-scrollbar lg:pr-2 pb-4 lg:pb-0">
        {/* Controls Block 1 */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-5 shadow-sm shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <Settings2 size={18} /> Controls
            </div>
            <button
              onClick={() => setShowInfo(true)}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
            >
              <Info size={16} />
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-700 dark:text-gray-500 uppercase">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['singly', 'doubly', 'circular', 'doubly-circular'] as ListType[]).map(type => (
                <button key={type} onClick={() => setListType(type)} disabled={isAnimating || role === 'viewer'}
                  className={`py-2 rounded text-[10px] font-bold uppercase transition-all ${listType === type ? 'bg-emerald-500 text-white dark:text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                >
                  {type.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Controls Block 2 */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-5 shadow-sm shrink-0">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-700 dark:text-gray-400 uppercase">Step Engine</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${isPaused ? 'border-amber-500 text-amber-600 dark:text-amber-500' : 'border-emerald-500 text-emerald-600 dark:text-emerald-500'}`}>
                {isPaused ? 'MANUAL' : 'AUTO'}
              </span>
            </div>
            <div className="flex gap-2">
              <button disabled={role === 'viewer'} onClick={() => setIsPaused(!isPaused)} className="flex-1 py-2 bg-blue-400 dark:bg-blue-500/20 backdrop-blur-xl border border-blue-500 dark:border-blue-500/50 rounded flex items-center justify-center gap-2 text-xs font-bold hover:bg-blue-500 dark:hover:bg-blue-500/30 transition-all text-black dark:text-blue-400 disabled:opacity-50">
                {isPaused ? <Play size={14} /> : <Pause size={14} />} {isPaused ? 'Switch to Auto' : 'Switch to Manual'}
              </button>
              <div className="flex flex-1 gap-1">
                <button
                  disabled={!isPaused || !isAnimating || frameIdx <= 0 || role === 'viewer'}
                  onClick={() => setFrameIdx(f => Math.max(0, f - 1))}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black hover:bg-emerald-500 disabled:opacity-30 disabled:grayscale transition-all"
                >
                  <StepBack size={14} /> PREV
                </button>
                <button
                  disabled={!isPaused || !isAnimating || frameIdx >= frames.length - 1 || role === 'viewer'}
                  onClick={() => setFrameIdx(f => Math.min(frames.length - 1, f + 1))}
                  className="flex-1 py-2 bg-emerald-500 text-black rounded flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black hover:bg-emerald-400 disabled:opacity-30 disabled:grayscale transition-all"
                >
                  NEXT <StepForward size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Block 3 */}
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-5 shadow-sm shrink-0 mt-auto">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[9px] text-slate-700 dark:text-gray-500 uppercase font-bold">Node Value</label>
                <div className="flex gap-1 mt-1">
                  <input type="number" disabled={role === 'viewer'} value={inputValue} onChange={(e) => setInputValue(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-[#21262d] border border-slate-200 dark:border-white/10 rounded px-3 py-2 text-emerald-600 dark:text-emerald-400 outline-none font-mono text-sm dark:text-white disabled:opacity-50" />
                  <button disabled={role === 'viewer'} onClick={generateRandom} className="px-3 bg-indigo-50 dark:bg-indigo-500/10 rounded border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold transition-all disabled:opacity-50"><RotateCcw size={14} /></button>
                </div>
              </div>
              <div className="w-20">
                <label className="text-[9px] text-slate-700 dark:text-gray-500 uppercase font-bold">Target Idx</label>
                <input type="number" disabled={role === 'viewer'} value={inputIndex} onChange={(e) => setInputIndex(Number(e.target.value))} className="w-full mt-1 bg-slate-100 dark:bg-[#21262d] border border-slate-200 dark:border-white/10 rounded px-3 py-2 text-cyan-600 dark:text-cyan-400 outline-none font-mono text-sm dark:text-white disabled:opacity-50" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => handleInsert('head')} disabled={isAnimating || role === 'viewer'} className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50 transition-all">
                <CornerDownRight size={16} /> Insert Beg
              </button>
              <button onClick={() => handleInsert('end')} disabled={isAnimating || role === 'viewer'} className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50 transition-all">
                <ArrowDownToLine size={16} /> Insert End
              </button>
              <button onClick={() => handleInsert('index')} disabled={isAnimating || role === 'viewer'} className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50 col-span-2 transition-all">
                <Target size={16} /> Insert at specific Index
              </button>

              <button onClick={() => handleDelete('head')} disabled={isAnimating || role === 'viewer'} className="p-3 bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50 transition-all">
                <Trash2 size={16} /> Delete Beg
              </button>
              <button onClick={() => handleDelete('end')} disabled={isAnimating || role === 'viewer'} className="p-3 bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50 transition-all">
                <X size={16} /> Delete End
              </button>
              <button onClick={() => handleDelete('index')} disabled={isAnimating || role === 'viewer'} className="p-3 bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-1 disabled:opacity-50 col-span-2 transition-all">
                <Target size={16} /> Delete at specific Index
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[48vh] shrink-0 lg:h-auto lg:flex-1 bg-white/60 backdrop-blur-xl dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden flex flex-col">

        {/* SMALL HUD TOGGLE */}
        <div className="flex justify-start lg:justify-start items-center mb-2 lg:mb-3 shrink-0 gap-2">
          <button
            onClick={() => setShowHUD(!showHUD)}
            className="h-7 lg:h-8 px-3 bg-white dark:bg-[#050505] border border-emerald-400 dark:border-emerald-500/80 rounded-lg lg:rounded-full text-emerald-600 dark:text-emerald-400 font-black text-[10px] flex items-center gap-1.5 tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:shadow-sm dark:hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all shadow-sm dark:shadow-[0_0_10px_rgba(16,185,129,0.2)] uppercase z-40"
          >
            {showHUD ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            {showHUD ? 'HIDE HUD' : 'SHOW HUD'}
          </button>
        </div>

        {/* Central Arena: The Linked List Canvas */}
        <div className="flex-1 min-h-0 border border-slate-200 dark:border-[#30363d] bg-white/60 backdrop-blur-xl/50 dark:bg-[#0a0c10] rounded-2xl relative flex flex-col shadow-inner overflow-hidden mb-2 lg:mb-4 w-full">

          <div className="flex-1 w-full overflow-x-auto overflow-y-hidden custom-scrollbar relative flex items-center touch-pan-x">
            <div className="min-w-max flex items-center px-8 sm:px-16 relative h-full py-8 pr-16 sm:pr-24 w-max" ref={containerRef}>

              {/* DYNAMIC, RESPONSIVE CIRCULAR LINK SVG */}
              {(listType === 'circular' || listType === 'doubly-circular') && nodes.length > 1 && svgDim.height > 0 && (
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
                  {(() => {
                    const H = svgDim.height;
                    const isSm = svgDim.isSm;

                    // Precise tracking based on the actual Tailwind CSS values used below
                    const nodeW = isSm ? 96 : 80;
                    const nodeH = isSm ? 96 : 80;
                    const blockW = isSm ? 112 : 108; // Wrapper (96px) + margin-right (16px or 12px)
                    const startOffset = isSm ? 160 : 104; // Padding + Head width + Head Margin

                    const centerY = H / 2;
                    const firstNodeLeft = startOffset;
                    const lastNodeLeft = startOffset + (nodes.length - 1) * blockW;

                    // Coordinates mapping to exact edges of the node boxes
                    const startX = lastNodeLeft + nodeW;
                    const startY = centerY;
                    const endX = firstNodeLeft + (nodeW / 2);
                    const endY = centerY - (nodeH / 2);

                    // Dynamic curve routing to clear hovering scanner elements
                    const controlY = Math.max(10, centerY - (nodeH / 2) - 35);
                    const r = 16;

                    const pathD = `
                                  M ${startX} ${startY}
                                  L ${startX + r} ${startY}
                                  Q ${startX + 2 * r} ${startY} ${startX + 2 * r} ${startY - r}
                                  L ${startX + 2 * r} ${controlY + r}
                                  Q ${startX + 2 * r} ${controlY} ${startX + r} ${controlY}
                                  L ${endX + r} ${controlY}
                                  Q ${endX} ${controlY} ${endX} ${controlY + r}
                                  L ${endX} ${endY - 4}
                                `;

                    return (
                      <>
                        <motion.path
                          d={pathD}
                          fill="transparent" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,5"
                          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}
                        />
                        {/* Perfect arrowhead positioning */}
                        <polygon points={`${endX - 5},${endY - 8} ${endX + 5},${endY - 8} ${endX},${endY + 2}`} fill="#f59e0b" />
                      </>
                    );
                  })()}
                </svg>
              )}

              <div className="relative mr-4 sm:mr-8 flex flex-col items-center shrink-0 w-14 sm:w-16">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-white dark:bg-black z-10"><Anchor size={18} /></div>
                <span className="text-[10px] font-black text-amber-500 mt-2">HEAD</span>
                {nodes.length > 0 && <div className="absolute top-6 left-12 w-8 h-0.5 bg-amber-500" />}
              </div>

              <AnimatePresence mode="popLayout">
                {nodes.map((node, i) => {
                  const isSeeker = seekerIndex === i;
                  return (
                    <motion.div layout key={node.id}
                      initial={{ scale: 0, opacity: 0, y: -50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0, opacity: 0, y: 50 }}
                      className="flex items-center shrink-0 mr-3 sm:mr-4 relative"
                      style={{ width: '96px' }}
                    >
                      <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 flex flex-col items-center justify-center relative bg-white dark:bg-[#09090b] z-10 transition-colors shrink-0
                                    ${node.isDeleting ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : isSeeker ? 'border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)]' : 'border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/50 shadow-sm'}`}>

                        <span className="text-[10px] sm:text-xs text-slate-400 dark:text-gray-500 font-mono absolute top-1.5 left-1.5 sm:top-2 sm:left-2">0x{node.id}</span>
                        <span className={`text-2xl sm:text-3xl font-black ${isSeeker ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-900 dark:text-white'}`}>{node.value}</span>
                        <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-gray-600 font-bold absolute bottom-1.5 sm:bottom-2">IDX {i}</span>

                        {isSeeker && (
                          <div className="absolute -top-10 bg-cyan-500 text-black px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap z-50 shadow-lg shadow-cyan-500/20">
                            Scanner yahan hai
                          </div>
                        )}
                      </div>

                      {i < nodes.length - 1 && (
                        <div className="w-8 sm:w-10 h-0.5 bg-slate-300 dark:bg-white/20 relative ml-[-6px] sm:ml-[-8px]">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate-400 dark:border-white/40 rotate-45" />
                          {node.isNew && <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="absolute inset-0 bg-emerald-400 shadow-[0_0_10px_#34d399]" />}
                        </div>
                      )}

                      {(listType === 'doubly' || listType === 'doubly-circular') && i < nodes.length - 1 && (
                        <div className="absolute left-[72px] sm:left-[88px] bottom-7 sm:bottom-8 w-8 sm:w-10 h-0.5 bg-purple-400 dark:bg-purple-500/40 translate-y-3">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 border-b-2 border-l-2 border-purple-500 dark:border-purple-500/60 rotate-45" />
                        </div>
                      )}

                      {i === nodes.length - 1 && listType !== 'circular' && listType !== 'doubly-circular' && (
                        <div className="absolute left-[86px] sm:left-[104px] flex items-center opacity-30 dark:opacity-30 w-14 sm:w-16">
                          <div className="w-6 h-0.5 bg-slate-400 dark:bg-white" />
                          <div className="px-1.5 py-0.5 border border-slate-400 dark:border-white text-slate-700 dark:text-white text-[9px] rounded ml-1">NULL</div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Message Status Bar */}
        <div className="shrink-0 flex justify-between items-center text-[10px] lg:text-xs font-mono text-slate-700 dark:text-gray-500 px-2 lg:mb-2">
          <div className="flex items-center gap-2"><Activity size={14} className={isAnimating ? "text-amber-500 animate-spin" : ""} /> {message}</div>
          <div>Total Nodes: {nodes.length}</div>
        </div>

        {/* HUD TRACE & HEAP */}
        <AnimatePresence initial={false}>
          {showHUD && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: typeof window !== 'undefined' && window.innerWidth < 1024 ? 120 : 160, opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex gap-2 lg:gap-4 w-full shrink-0 overflow-hidden"
            >
              {/* 1. HINGLISH INTERPRETER */}
              <div className="flex-1 shrink-0 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-xl flex flex-col shadow-inner overflow-hidden h-full">
                <div className="px-3 lg:px-4 py-2 lg:py-3 border-b border-slate-200 dark:border-[#30363d] flex justify-between items-center bg-white/60 dark:bg-[#0d1117] shrink-0">
                  <div className="flex items-center gap-1.5 lg:gap-2 text-emerald-600 dark:text-emerald-400">
                    <Terminal size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    <span className="text-[9px] lg:text-[10px] font-black tracking-widest uppercase">Hinglish_Trace</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
                    {variables.map((v, i) => <span key={i} className="text-[9px] lg:text-[10px] font-mono whitespace-nowrap"><span className="text-slate-700 dark:text-gray-500">{v.name}:</span> <span style={{ color: v.color }}>{v.value}</span></span>)}
                  </div>
                </div>
                <div className="p-3 lg:p-4 space-y-2 lg:space-y-3 overflow-y-auto custom-scrollbar flex-1">
                  {codeLines.length ? codeLines.map(line => (
                    <div key={line.id} className={`flex flex-col text-[10px] lg:text-sm transition-all ${line.active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
                      <div className={`font-mono ${line.active ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-gray-400'}`}>{line.text}</div>
                      {line.active && <div className="text-[9px] lg:text-xs text-amber-600 dark:text-amber-400 mt-0.5 lg:mt-1 flex items-start gap-1.5 lg:gap-2 leading-relaxed"><ArrowRight size={12} className="w-3 h-3 shrink-0 mt-0.5" /> {line.explanation}</div>}
                    </div>
                  )) : <div className="text-slate-400 dark:text-gray-600 text-[10px] lg:text-xs italic flex items-center justify-center h-full gap-2"><Activity size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> Waiting for player action...</div>}
                </div>
              </div>

              {/* 2. THE SPAWN ZONE */}
              <div className="w-[130px] lg:w-[350px] shrink-0 border border-emerald-200 dark:border-[#30363d] bg-emerald-50 dark:bg-[#161b22] rounded-xl relative flex items-center justify-center shadow-inner h-full overflow-hidden">
                <div className="absolute top-2 right-2 lg:top-3 lg:right-4 flex items-center gap-1.5 lg:gap-2 text-[8px] lg:text-[10px] font-mono text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                  <Box size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Spawn_Zone (Heap)</span><span className="lg:hidden">Heap</span>
                </div>

                <AnimatePresence>
                  {phantom && (
                    <motion.div
                      initial={{ scale: 0, y: -20, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.8, y: 40 }}
                      className="w-14 h-14 lg:w-24 lg:h-24 rounded-lg lg:rounded-xl border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center bg-white dark:bg-emerald-500/10 shadow-lg dark:shadow-[0_0_30px_rgba(16,185,129,0.3)] z-50 relative mt-4 lg:mt-6"
                    >
                      <span className="text-[8px] lg:text-xs text-emerald-500 dark:text-emerald-400 font-mono absolute top-1 left-1 lg:top-2 lg:left-2">0x{phantom.id}</span>
                      <span className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white">{phantom.value}</span>
                      <div className="hidden lg:block absolute -bottom-6 bg-emerald-500 text-white dark:text-black px-2 py-1 rounded text-[10px] font-bold shadow-lg whitespace-nowrap">WAITING TO LINK...</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!phantom && (
                  <div className="text-emerald-600/50 dark:text-emerald-500/30 font-mono text-[9px] lg:text-xs flex items-center gap-1.5 lg:gap-2 mt-4">
                    <Zap size={14} className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span className="hidden lg:inline">Memory Pool Empty</span><span className="lg:hidden">Empty</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowInfo(false)}
                className="absolute top-4 right-4 h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Activity className="text-emerald-500" /> Linked List Visualizer
              </h3>

              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 mt-4 h-max overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
                <p>
                  A <strong>Linked List</strong> is a linear data structure where elements are not stored at contiguous memory locations. Instead, elements are linked using pointers.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Singly Linked List:</strong> Each node points to the next node.</li>
                  <li><strong>Doubly Linked List:</strong> Each node points to both the next and previous nodes, allowing bidirectional traversal.</li>
                  <li><strong>Circular Linked List:</strong> The last node points back to the first node, forming a circle.</li>
                </ul>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-4">Key Operations</h4>
                <p>
                  You can <strong>Insert</strong> or <strong>Delete</strong> nodes at the beginning, end, or at a specific index. The time complexity varies depending on the operation and the type of linked list.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LinkedListVisualizer;