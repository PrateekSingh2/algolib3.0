import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
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
      <div className="relative w-full rounded-[24px] overflow-hidden border border-white/[0.08] bg-[#050507]/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]">
        {/* Pointer-events blocker overlay */}
        <div className="absolute inset-0 z-20 cursor-not-allowed" />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

        {/* Top bar */}
        <div className="px-5 py-4 border-b border-white/[0.06] bg-[#050507]/80 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 mr-4">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-[#ff5f56] transition-colors" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-[#ffbd2e] transition-colors" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-[#27c93f] transition-colors" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.03] border border-white/[0.05]">
              <Layout className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs font-medium text-white/70">Linked List Visualizer</span>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2.5 py-1 rounded-md bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.2)]">READ ONLY</span>
        </div>

        {/* Split layout */}
        <div className="flex flex-col md:flex-row h-auto md:h-[360px]">
          {/* Left controls */}
          <div className="w-full md:w-[200px] flex-shrink-0 border-b md:border-b-0 md:border-r border-white/[0.06] p-4 flex flex-col gap-4">
            <div>
              <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-2">Type</p>
              <div className="grid grid-cols-1 gap-1.5">
                {["SINGLY", "DOUBLY", "CIRCULAR", "DOUBLY CIRCULAR"].map(t => (
                  <div key={t} className={`py-1.5 px-2 rounded text-[9px] font-bold text-center ${listType === t ? "bg-[#00e676] text-black" : "bg-white/5 text-white/50"}`}>
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-black/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Step Engine</span>
                <span className="text-[9px] font-mono text-[#ffbd2e] border border-[#ffbd2e]/30 px-1.5 py-0.5 rounded">MANUAL</span>
              </div>
              <div className="flex gap-1">
                <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/5 rounded text-[9px] font-bold text-white">
                  <Play className="w-2.5 h-2.5" /> AUTO
                </div>
                <div className="w-7 flex items-center justify-center py-1.5 bg-white/5 rounded text-white/40">
                  <SkipBack className="w-2.5 h-2.5" />
                </div>
                <div className="w-7 flex items-center justify-center py-1.5 bg-white/5 rounded text-white/40">
                  <SkipForward className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-auto">
              {[
                { l: "INSERT BEG", c: "emerald" }, { l: "INSERT END", c: "emerald" },
                { l: "DELETE BEG", c: "red" }, { l: "DELETE END", c: "red" }
              ].map(b => (
                <div key={b.l} className={`py-2 rounded text-[8px] font-bold text-center ${b.c === "emerald" ? "bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/15" : "bg-red-500/10 text-red-400 border border-red-500/15"}`}>
                  {b.l}
                </div>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative bg-[#050507] overflow-hidden flex flex-col h-[300px] md:h-auto">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="flex-1 flex items-center px-6 overflow-x-hidden relative z-10">
              <div className="flex items-center gap-3">
                {/* HEAD */}
                <div className="flex flex-col items-center gap-1 mr-2">
                  <div className="w-9 h-9 rounded-full border-2 border-[#ff9100] flex items-center justify-center relative shadow-[0_0_12px_rgba(255,145,0,0.3)]">
                    <Anchor className="w-4 h-4 text-[#ff9100]" />
                    <div className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-4 h-[1.5px] bg-[#ff9100]" />
                  </div>
                  <span className="text-[8px] font-mono font-bold text-[#ff9100] uppercase">HEAD</span>
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
                      <div className="w-[72px] bg-black/60 border border-white/[0.1] rounded-xl overflow-hidden backdrop-blur-sm">
                        <div className="px-2 py-1 border-b border-white/[0.07] bg-white/[0.03]">
                          <span className="text-[9px] font-mono text-white/40">{n.addr}</span>
                        </div>
                        <div className="flex items-center justify-center py-4">
                          <span className="text-2xl font-bold text-white font-mono">{n.val}</span>
                        </div>
                        <div className="px-2 py-1 border-t border-white/[0.07] bg-white/[0.03] text-center">
                          <span className="text-[8px] text-white/35 font-bold uppercase">IDX {i}</span>
                        </div>
                      </div>
                      <span className="text-white/25 text-sm">→</span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="px-2 py-1 border border-white/15 rounded bg-white/[0.04]">
                  <span className="text-[9px] font-mono text-white/40 font-bold">NULL</span>
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="h-8 border-t border-white/[0.06] bg-[#0c0c0e] flex items-center justify-between px-4 z-10 relative">
              <div className="flex items-center gap-2">
                <Zap className={`w-3 h-3 ${status.includes("IDLE") ? "text-white/30" : "text-[#00e676]"}`} />
                <span className="font-mono text-[9px] text-white/50">{status}</span>
              </div>
              <span className="font-mono text-[9px] text-white/40">Nodes: <span className="text-white font-bold">{nodes.length}</span></span>
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
    lang: "C++", color: "#60a5fa",
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
    lang: "Python", color: "#a78bfa",
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
    <div className="relative w-full rounded-[24px] overflow-hidden border border-white/[0.08] bg-[#050507]/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]">
      {/* Pointer blocker */}
      <div className="absolute inset-0 z-20 cursor-not-allowed" />
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Top bar */}
      <div className="px-5 py-4 border-b border-white/[0.06] bg-[#050507]/80 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-4">
            <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-[#ff5f56] transition-colors" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-[#ffbd2e] transition-colors" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-[#27c93f] transition-colors" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.03] border border-white/[0.05]">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: snip.color }} />
            <span className="text-xs font-medium text-white/70">main.{snip.lang === "C++" ? "cpp" : "py"}</span>
          </div>
        </div>
        <span className="text-[9px] font-mono px-2.5 py-1 rounded-md bg-[#a78bfa]/10 border border-[#a78bfa]/30 text-[#a78bfa] shadow-[0_0_10px_rgba(167,139,250,0.2)]">READ ONLY</span>
      </div>

      {/* Code + Terminal split */}
      <div className="flex flex-col md:flex-row h-auto md:h-[360px]">
        {/* Editor */}
        <div className="flex-1 overflow-hidden relative bg-[#050507] h-[250px] md:h-auto">
          <div className="flex h-full">
            {/* Line numbers */}
            <div className="w-10 border-r border-white/[0.04] flex flex-col pt-4 pb-4 flex-shrink-0">
              {Array.from({ length: Math.max(visibleLines.length, 8) }, (_, i) => (
                <div key={i} className="h-5 flex items-center justify-end pr-2">
                  <span className="text-[10px] font-mono text-white/20">{i + 1}</span>
                </div>
              ))}
            </div>
            {/* Code */}
            <div className="flex-1 overflow-hidden pt-4 pb-4 px-4 font-mono text-[11px] leading-5">
              {visibleLines.map((line, i) => (
                <div key={i} className="h-5 flex items-center whitespace-pre">
                  <span className={
                    line.includes('#include') || line.includes('import') ? "text-[#f472b6]" :
                      line.includes('int main') || line.includes('def ') || line.includes('for') || line.includes('if') ? "text-[#c084fc]" :
                        line.includes('//') || line.includes('#') && !line.includes('#include') ? "text-white/35" :
                          line.includes('"') ? "text-[#86efac]" :
                            line.includes('cout') || line.includes('print') || line.includes('sort') || line.includes('vector') ? `text-[${snip.color}]` :
                              "text-white/70"
                  }>{line || "\u00A0"}</span>
                </div>
              ))}
              {visibleLines.length < SNIPPETS[snippetIdx].lines.length && (
                <div className="h-5 flex items-center">
                  <span className="w-2 h-4 bg-white/60 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Terminal */}
        <div className="w-full md:w-[200px] flex-shrink-0 border-t md:border-t-0 md:border-l border-white/[0.06] bg-[#030305] flex flex-col h-[200px] md:h-auto">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-[#ff5f56]" />
              <div className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
              <div className="w-2 h-2 rounded-full bg-[#27c93f]" />
            </div>
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Terminal</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            {!running && !output && (
              <div className="text-white/20 font-mono text-xs">
                <div className="text-2xl mb-2">▶_</div>
                <p className="text-[9px] uppercase tracking-widest">Awaiting<br />Execution</p>
              </div>
            )}
            {running && (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-6 h-6 border-2 border-[#22c55e] border-t-transparent rounded-full" />
            )}
            <AnimatePresence>
              {output && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                  <div className="text-[9px] font-mono text-white/40 mb-2 text-left">OUTPUT:</div>
                  <div className="text-[11px] font-mono text-[#22c55e] text-left break-all">{output}</div>
                  <div className="mt-3 text-[9px] font-mono text-white/25 text-left">
                    Process finished with exit code 0
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Stdin bar */}
          <div className="border-t border-white/[0.06] px-3 py-2">
            <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">● STDIN</p>
            <div className="text-[9px] font-mono text-white/20">~/algolib $</div>
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
    <section id="playground" ref={ref} className="py-14 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-white/50 uppercase tracking-widest mb-4">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e676]" />
          </span>
          Live Playground
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
          Experience it.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e676] to-[#00bcd4]">No account needed.</span>
        </h2>
        <p className="text-white/40 text-lg max-w-2xl mx-auto">
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
              <p className="text-[10px] font-mono text-[#00e676] uppercase tracking-widest mb-1">① Visualizer Engine</p>
              <h3 className="text-xl font-bold text-white">Linked List — Visualizer</h3>
            </div>
            <span className="text-[9px] font-mono px-2 py-1 rounded bg-[#00e676]/10 border border-[#00e676]/20 text-[#00e676]">READ ONLY</span>
          </div>
          <LinkedListPreview />
          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-white/40">Supports BST, Graph, Heap, Stack, Queue & more</p>
            <a
              href="/visualizer"
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00e676] text-black font-bold text-sm hover:bg-[#69f0ae] transition-colors shadow-[0_0_20px_rgba(0,230,118,0.2)] w-full sm:w-auto justify-center"
            >
              Explore Visualizer <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
              <p className="text-[10px] font-mono text-[#a78bfa] uppercase tracking-widest mb-1">② Online Compiler</p>
              <h3 className="text-xl font-bold text-white">Online Code Execution</h3>
            </div>
            <span className="text-[9px] font-mono px-2 py-1 rounded bg-[#a78bfa]/10 border border-[#a78bfa]/20 text-[#a78bfa]">READ ONLY</span>
          </div>
          <CompilerPreview />
          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-white/40">C, C++, Java, Python, JS</p>
            <a
              href="/compiler"
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#a78bfa] text-black font-bold text-sm hover:bg-[#c4b5fd] transition-colors shadow-[0_0_20px_rgba(167,139,250,0.2)] w-full sm:w-auto justify-center"
            >
              Open Compiler <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PlaygroundSection;
