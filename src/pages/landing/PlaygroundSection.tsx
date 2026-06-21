import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, Anchor, Layout, Play, Zap, SkipForward, SkipBack } from "lucide-react";

// ─── AUTO-ANIMATED LINKED LIST PREVIEW ───────────────────────────────────────
const LinkedListPreview: React.FC = () => {
  const [nodes, setNodes] = useState([
    { id: "a", val: 42, addr: "0x1A" },
    { id: "b", val: 88, addr: "0x2B" },
    { id: "c", val: 15, addr: "0x3C" },
  ]);
  const [status, setStatus] = useState("SYSTEM_IDLE: Ready for input");
  const [listType, setListType] = useState("SINGLY");
  const stepRef = useRef(0);

  const addr = () => `0x${Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0")}`;

  useEffect(() => {
    const steps = [
      () => {
        const v = Math.floor(Math.random() * 90) + 10;
        setNodes(p => [{ id: `n${Date.now()}`, val: v, addr: addr() }, ...p]);
        setStatus(`INSERTED ${v} AT BEGINNING`);
      },
      () => {
        const v = Math.floor(Math.random() * 90) + 10;
        setNodes(p => [...p, { id: `n${Date.now()}`, val: v, addr: addr() }]);
        setStatus(`INSERTED ${v} AT END`);
      },
      () => {
        setNodes(p => p.length > 1 ? p.slice(1) : p);
        setStatus("DELETED NODE AT BEGINNING");
      },
      () => {
        setNodes(p => p.length > 1 ? p.slice(0, -1) : p);
        setStatus("DELETED NODE AT END");
      },
      () => {
        setListType(t => t === "SINGLY" ? "DOUBLY" : "SINGLY");
        setStatus("SWITCHED LIST TYPE");
      },
    ];

    const interval = setInterval(() => {
      steps[stepRef.current % steps.length]();
      stepRef.current++;
      setTimeout(() => setStatus("SYSTEM_IDLE: Ready for input"), 2000);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="relative w-full rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#050507]/60 shadow-lg dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]">
        {/* Pointer-events blocker overlay */}
        <div className="absolute inset-0 z-20 cursor-not-allowed" />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.01] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

        {/* Top bar */}
        <div className="px-5 py-4 border-b-2 border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-[#050507]/80 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 mr-4">
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10 hover:bg-[#ff5f56] transition-colors" />
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10 hover:bg-[#ffbd2e] transition-colors" />
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10 hover:bg-[#27c93f] transition-colors" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] shadow-sm dark:shadow-none">
              <Layout className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
              <span className="text-[11px] font-bold text-slate-600 dark:text-white/70 font-nunito">Linked List Visualizer</span>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-[#00e676]/10 border border-emerald-200 dark:border-[#00e676]/30 text-emerald-600 dark:text-[#00e676] shadow-sm dark:shadow-[0_0_10px_rgba(0,230,118,0.2)]">READ ONLY</span>
        </div>

        {/* Split layout */}
        <div className="flex flex-col md:flex-row h-auto md:h-[360px]">
          {/* Left controls */}
          <div className="w-full md:w-[200px] flex-shrink-0 border-b-2 md:border-b-0 md:border-r-2 border-slate-100 dark:border-white/[0.06] p-5 flex flex-col gap-4 bg-slate-50/50 dark:bg-transparent">
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2 font-nunito">Type</p>
              <div className="grid grid-cols-1 gap-1.5">
                {["SINGLY", "DOUBLY", "CIRCULAR", "DOUBLY CIRCULAR"].map(t => (
                  <div key={t} className={`py-2 px-2 rounded-lg text-[10px] font-black text-center font-nunito ${listType === t ? "bg-emerald-500 text-white dark:bg-[#00e676] dark:text-black" : "bg-white text-slate-500 border border-slate-200 dark:bg-white/5 dark:text-white/50 dark:border-transparent shadow-sm dark:shadow-none"}`}>
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3.5 rounded-xl border-2 border-slate-200 dark:border-white/5 bg-white dark:bg-black/40 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest font-nunito">Step Engine</span>
                <span className="text-[9px] font-mono font-bold text-amber-500 dark:text-[#ffbd2e] border border-amber-200 dark:border-[#ffbd2e]/30 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-transparent">MANUAL</span>
              </div>
              <div className="flex gap-1.5">
                <div className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 dark:bg-white/5 rounded-lg text-[10px] font-black text-slate-700 dark:text-white font-nunito">
                  <Play className="w-3 h-3" /> AUTO
                </div>
                <div className="w-8 flex items-center justify-center py-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-400 dark:text-white/40">
                  <SkipBack className="w-3 h-3" />
                </div>
                <div className="w-8 flex items-center justify-center py-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-400 dark:text-white/40">
                  <SkipForward className="w-3 h-3" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-auto">
              {[
                { l: "INSERT BEG", c: "emerald" }, { l: "INSERT END", c: "emerald" },
                { l: "DELETE BEG", c: "red" }, { l: "DELETE END", c: "red" }
              ].map(b => (
                <div key={b.l} className={`py-2 rounded-lg text-[9px] font-black text-center font-nunito ${b.c === "emerald" ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-[#00e676]/10 dark:text-[#00e676] dark:border-[#00e676]/15" : "bg-red-50 text-red-500 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/15"}`}>
                  {b.l}
                </div>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative bg-white dark:bg-[#050507] overflow-hidden flex flex-col h-[300px] md:h-auto">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="flex-1 flex items-center px-6 overflow-x-hidden relative z-10">
              <div className="flex items-center gap-3">
                {/* HEAD */}
                <div className="flex flex-col items-center gap-1.5 mr-2">
                  <div className="w-10 h-10 rounded-full border-[3px] border-amber-400 dark:border-[#ff9100] flex items-center justify-center relative shadow-sm dark:shadow-[0_0_12px_rgba(255,145,0,0.3)] bg-amber-50 dark:bg-transparent">
                    <Anchor className="w-4 h-4 text-amber-500 dark:text-[#ff9100]" />
                    <div className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-4 h-[2px] bg-amber-400 dark:bg-[#ff9100]" />
                  </div>
                  <span className="text-[10px] font-black text-amber-500 dark:text-[#ff9100] uppercase font-nunito">HEAD</span>
                </div>

                <AnimatePresence mode="popLayout">
                  {nodes.map((n, i) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, scale: 0.5, y: -30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: 30 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-[80px] bg-white dark:bg-black/60 border-2 border-slate-200 dark:border-white/[0.1] rounded-2xl overflow-hidden shadow-sm dark:shadow-none dark:backdrop-blur-sm">
                        <div className="px-2 py-1.5 border-b-2 border-slate-100 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03]">
                          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-white/40">{n.addr}</span>
                        </div>
                        <div className="flex items-center justify-center py-5">
                          <span className="text-3xl font-black text-slate-800 dark:text-white font-nunito">{n.val}</span>
                        </div>
                        <div className="px-2 py-1.5 border-t-2 border-slate-100 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] text-center">
                          <span className="text-[9px] text-slate-500 dark:text-white/35 font-black uppercase font-nunito">IDX {i}</span>
                        </div>
                      </div>
                      <span className="text-slate-300 dark:text-white/25 text-lg font-bold">→</span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="px-3 py-1.5 border-2 border-slate-200 dark:border-white/15 rounded-lg bg-slate-50 dark:bg-white/[0.04]">
                  <span className="text-[11px] font-black text-slate-400 dark:text-white/40 font-nunito">NULL</span>
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="h-10 border-t-2 border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0c0c0e] flex items-center justify-between px-5 z-10 relative">
              <div className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${status.includes("IDLE") ? "text-slate-400 dark:text-white/30" : "text-emerald-500 dark:text-[#00e676]"}`} />
                <span className="font-mono font-bold text-[10px] text-slate-600 dark:text-white/50">{status}</span>
              </div>
              <span className="font-nunito font-black text-[11px] text-slate-500 dark:text-white/40">Nodes: <span className="text-slate-800 dark:text-white">{nodes.length}</span></span>
            </div>
          </div>
        </div>
      </div>
      <div className="h-4 md:h-0" />
    </>
  );
};

// ─── AUTO-ANIMATED COMPILER PREVIEW ──────────────────────────────────────────
const SNIPPETS = [
  {
    lang: "C++", color: "#3b82f6", darkColor: "#60a5fa",
    lines: [
      { t: 0, s: '#include <bits/stdc++.h>' },
      { t: 400, s: 'using namespace std;' },
      { t: 700, s: '' },
      { t: 800, s: 'int main() {' },
      { t: 1100, s: '    // AlgoLib C++ Compiler Demo' },
      { t: 1400, s: '    vector<int> v = {3,1,4,1,5,9};' },
      { t: 1900, s: '    sort(v.begin(), v.end());' },
      { t: 2400, s: '    for(auto x : v)' },
      { t: 2700, s: '        cout << x << " ";' },
      { t: 3100, s: '    return 0;' },
      { t: 3400, s: '}' },
    ],
    output: "1 1 3 4 5 9",
  },
  {
    lang: "Python", color: "#8b5cf6", darkColor: "#a78bfa",
    lines: [
      { t: 0, s: '# AlgoLib Python Compiler Demo' },
      { t: 300, s: 'def fibonacci(n):' },
      { t: 600, s: '    if n <= 1: return n' },
      { t: 900, s: '    return fibonacci(n-1) + fibonacci(n-2)' },
      { t: 1300, s: '' },
      { t: 1400, s: 'for i in range(10):' },
      { t: 1700, s: '    print(fibonacci(i), end=" ")' },
    ],
    output: "0 1 1 2 3 5 8 13 21 34",
  },
];

const CompilerPreview: React.FC = () => {
  const [snippetIdx, setSnippetIdx] = useState(0);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const run = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setVisibleLines([]);
      setOutput(null);
      setRunning(false);
      const snip = SNIPPETS[snippetIdx];

      snip.lines.forEach(({ t, s }) => {
        const id = setTimeout(() => setVisibleLines(p => [...p, s]), t);
        timers.current.push(id);
      });

      const lastT = snip.lines[snip.lines.length - 1].t;
      const runId = setTimeout(() => setRunning(true), lastT + 600);
      timers.current.push(runId);
      const outId = setTimeout(() => { setOutput(snip.output); setRunning(false); }, lastT + 1400);
      timers.current.push(outId);

      // Cycle to next snippet after output shown
      const cycleId = setTimeout(() => {
        setSnippetIdx(i => (i + 1) % SNIPPETS.length);
      }, lastT + 3600);
      timers.current.push(cycleId);
    };

    run();
    return () => timers.current.forEach(clearTimeout);
  }, [snippetIdx]);

  const snip = SNIPPETS[snippetIdx];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#050507]/60 shadow-lg dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]">
      {/* Pointer blocker */}
      <div className="absolute inset-0 z-20 cursor-not-allowed" />
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.01] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Top bar */}
      <div className="px-5 py-4 border-b-2 border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#050507]/80 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-4">
            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10 hover:bg-[#ff5f56] transition-colors" />
            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10 hover:bg-[#ffbd2e] transition-colors" />
            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10 hover:bg-[#27c93f] transition-colors" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] shadow-sm dark:shadow-none">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: snip.darkColor }} />
            <span className="text-[11px] font-bold text-slate-600 dark:text-white/70 font-nunito">main.{snip.lang === "C++" ? "cpp" : "py"}</span>
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-[#a78bfa]/10 border border-indigo-200 dark:border-[#a78bfa]/30 text-indigo-600 dark:text-[#a78bfa] shadow-sm dark:shadow-[0_0_10px_rgba(167,139,250,0.2)]">READ ONLY</span>
      </div>

      {/* Code + Terminal split */}
      <div className="flex flex-col md:flex-row h-auto md:h-[360px]">
        {/* Editor */}
        <div className="flex-1 overflow-hidden relative bg-white dark:bg-[#050507] h-[250px] md:h-auto">
          <div className="flex h-full">
            {/* Line numbers */}
            <div className="w-10 border-r-2 border-slate-100 dark:border-white/[0.04] flex flex-col pt-4 pb-4 flex-shrink-0 bg-slate-50 dark:bg-transparent">
              {Array.from({ length: Math.max(visibleLines.length, 8) }, (_, i) => (
                <div key={i} className="h-6 flex items-center justify-end pr-3">
                  <span className="text-[10px] font-mono font-bold text-slate-300 dark:text-white/20">{i + 1}</span>
                </div>
              ))}
            </div>
            {/* Code */}
            <div className="flex-1 overflow-hidden pt-4 pb-4 px-5 font-mono text-[12px] font-semibold leading-6">
              {visibleLines.map((line, i) => (
                <div key={i} className="h-6 flex items-center whitespace-pre">
                  <span className={
                    line.includes('#include') || line.includes('import') ? "text-pink-500 dark:text-[#f472b6]" :
                      line.includes('int main') || line.includes('def ') || line.includes('for') || line.includes('if') ? "text-purple-500 dark:text-[#c084fc]" :
                        line.includes('//') || line.includes('#') && !line.includes('#include') ? "text-slate-400 dark:text-white/35" :
                          line.includes('"') ? "text-emerald-500 dark:text-[#86efac]" :
                            line.includes('cout') || line.includes('print') || line.includes('sort') || line.includes('vector') ? `text-[${snip.color}] dark:text-[${snip.darkColor}]` :
                              "text-slate-700 dark:text-white/70"
                  }>{line || "\u00A0"}</span>
                </div>
              ))}
              {visibleLines.length < SNIPPETS[snippetIdx].lines.length && (
                <div className="h-6 flex items-center">
                  <span className="w-2.5 h-4 bg-slate-400 dark:bg-white/60 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Terminal */}
        <div className="w-full md:w-[220px] flex-shrink-0 border-t-2 md:border-t-0 md:border-l-2 border-slate-200 dark:border-white/[0.06] bg-slate-800 dark:bg-[#030305] flex flex-col h-[200px] md:h-auto">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest font-nunito">Terminal</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-5 text-center">
            {!running && !output && (
              <div className="text-white/30 font-mono text-xs">
                <div className="text-3xl mb-2">▶_</div>
                <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting<br />Execution</p>
              </div>
            )}
            {running && (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-8 h-8 border-4 border-[#22c55e] border-t-transparent rounded-full" />
            )}
            <AnimatePresence>
              {output && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                  <div className="text-[10px] font-mono font-bold text-white/40 mb-2 text-left">OUTPUT:</div>
                  <div className="text-[13px] font-mono font-bold text-[#22c55e] text-left break-all">{output}</div>
                  <div className="mt-4 text-[10px] font-mono font-bold text-white/30 text-left">
                    Process finished with exit code 0
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Stdin bar */}
          <div className="border-t border-white/10 px-4 py-3 bg-black/20">
            <p className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest mb-1.5">● STDIN</p>
            <div className="text-[10px] font-mono font-bold text-white/30">~/algolib $</div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PlaygroundSectionProps {
  onRequireAuth?: () => void;
}

const PlaygroundSection: React.FC<PlaygroundSectionProps> = ({ onRequireAuth }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="playground" ref={ref} className="py-10 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 relative"
      >
        {/* Scribble Star Decor */}
        <svg className="absolute -top-10 left-[20%] w-8 h-8 text-indigo-300 dark:text-indigo-500/30 rotate-12 opacity-50 pointer-events-none" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M25 5 L28 20 L45 22 L32 30 L35 45 L25 35 L15 45 L18 30 L5 22 L22 20 Z" />
        </svg>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-white/[0.04] border-2 border-indigo-100 dark:border-white/[0.08] text-[12px] font-bold text-indigo-600 dark:text-white/50 uppercase tracking-widest mb-5 font-nunito">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 dark:bg-[#00e676] opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500 dark:bg-[#00e676]" />
          </span>
          Live Playground
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-800 dark:text-white tracking-tight mb-5 font-comic">
          Experience it.<br />
          <span className="text-indigo-500 dark:text-[#00bcd4] relative inline-block mt-2">
            No account needed.
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-300 dark:text-indigo-500/50 opacity-60" viewBox="0 0 200 20" preserveAspectRatio="none">
              <path d="M0,10 Q50,20 100,5 T150,15 T200,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="text-slate-500 dark:text-white/40 text-lg font-medium max-w-2xl mx-auto">
          Watch the platform in action — auto-animated demos of the Visualizer and Compiler running live.
        </p>
      </motion.div>

      {/* Two preview panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Visualizer */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black text-emerald-500 dark:text-[#00e676] uppercase tracking-widest mb-1 font-nunito">① Visualizer Engine</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white font-nunito">Linked List — Visualizer</h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-[#00e676]/10 border border-emerald-200 dark:border-[#00e676]/20 text-emerald-600 dark:text-[#00e676]">READ ONLY</span>
          </div>
          <LinkedListPreview />
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-[15px] font-bold text-slate-500 dark:text-white/40 font-nunito">Supports BST, Graph, Heap, Stack, Queue & more</p>
            <a
              href="/visualizer"
              className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 dark:bg-[#00e676] text-white dark:text-black font-black text-[15px] hover:bg-emerald-600 dark:hover:bg-[#69f0ae] transition-colors shadow-lg dark:shadow-[0_0_20px_rgba(0,230,118,0.2)] w-full sm:w-auto justify-center font-nunito"
            >
              Explore Visualizer <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </motion.div>

        {/* Compiler */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black text-indigo-500 dark:text-[#a78bfa] uppercase tracking-widest mb-1 font-nunito">② Online Compiler</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white font-nunito">Online Code Execution</h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-[#a78bfa]/10 border border-indigo-200 dark:border-[#a78bfa]/20 text-indigo-600 dark:text-[#a78bfa]">READ ONLY</span>
          </div>
          <CompilerPreview />
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-[15px] font-bold text-slate-500 dark:text-white/40 font-nunito">C, C++, Java, Python, JS</p>
            <a
              href="/compiler"
              className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 dark:bg-[#a78bfa] text-white dark:text-black font-black text-[15px] hover:bg-indigo-600 dark:hover:bg-[#c4b5fd] transition-colors shadow-lg dark:shadow-[0_0_20px_rgba(167,139,250,0.2)] w-full sm:w-auto justify-center font-nunito"
            >
              Open Compiler <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PlaygroundSection;
