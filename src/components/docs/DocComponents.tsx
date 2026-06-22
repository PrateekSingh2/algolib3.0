import React, { useState, useRef, useEffect } from "react";
import { Copy, Check, Info, AlertCircle, Hash, Play, Settings, Search, X } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-python";

// --- HIGHLIGHT TEXT ---
export const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-amber-100 dark:bg-cyber-yellow/30 text-amber-700 dark:text-cyber-yellow font-bold px-0.5 rounded">{part}</span>
        ) : (part)
      )}
    </span>
  );
};

// --- SECTION BADGE ---
export const SectionBadge = ({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "purple" | "green" | "red" | "orange" }) => {
  const colors = {
    blue: "bg-blue-100 dark:bg-[hsl(var(--cyber-blue))]/10 text-blue-700 dark:text-cyber-blue border-blue-200 dark:border-[hsl(var(--cyber-blue))]/20",
    purple: "bg-purple-100 dark:bg-[hsl(var(--cyber-purple))]/10 text-purple-700 dark:text-cyber-purple border-purple-200 dark:border-[hsl(var(--cyber-purple))]/20",
    green: "bg-emerald-100 dark:bg-[hsl(var(--cyber-green))]/10 text-emerald-700 dark:text-cyber-green border-emerald-200 dark:border-[hsl(var(--cyber-green))]/20",
    red: "bg-rose-100 dark:bg-[hsl(var(--cyber-red))]/10 text-rose-700 dark:text-cyber-red border-rose-200 dark:border-[hsl(var(--cyber-red))]/20",
    orange: "bg-orange-100 dark:bg-[hsl(var(--cyber-orange))]/10 text-orange-700 dark:text-cyber-orange border-orange-200 dark:border-[hsl(var(--cyber-orange))]/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wide ${colors[color]}`}>
      {children}
    </span>
  );
};

// --- PRO TIP ---
export const ProTip = ({ children }: { children: React.ReactNode }) => (
  <div className="my-6 p-4 rounded-lg bg-sky-50 dark:bg-[hsl(var(--cyber-blue))]/5 border-l-2 border-sky-400 dark:border-cyber-blue flex gap-3 text-sm text-slate-700 dark:text-muted-foreground shadow-sm dark:shadow-lg">
    <Info className="shrink-0 text-sky-600 dark:text-cyber-blue" size={18} />
    <div className="flex-1"><strong className="text-sky-700 dark:text-cyber-blue block text-xs mb-1 uppercase tracking-wider">Professor's Insight</strong>{children}</div>
  </div>
);

// --- WARNING BLOCK ---
export const WarningBlock = ({ children }: { children: React.ReactNode }) => (
  <div className="my-6 p-4 rounded-lg bg-rose-50 dark:bg-[hsl(var(--cyber-red))]/5 border-l-2 border-rose-400 dark:border-cyber-red flex gap-3 text-sm text-slate-700 dark:text-muted-foreground shadow-sm dark:shadow-none">
    <AlertCircle className="shrink-0 text-rose-600 dark:text-cyber-red" size={18} />
    <div><strong className="text-rose-700 dark:text-cyber-red block text-xs mb-1 uppercase tracking-wider">Common Pitfall</strong>{children}</div>
  </div>
);

// --- COMPLEXITY TABLE ---
export const ComplexityTable = ({ title, rows, cols }: { title?: string; rows: any[]; cols: string[] }) => (
  <div className="my-8 border border-slate-200 dark:border-border rounded-xl overflow-hidden bg-white dark:bg-card shadow-lg dark:shadow-xl">
    {title && <div className="bg-slate-100 dark:bg-muted/50 px-4 py-3 border-b border-slate-200 dark:border-border font-bold text-sm text-slate-900 dark:text-foreground flex items-center gap-2"><Hash size={14} className="text-indigo-600 dark:text-cyber-blue" />{title}</div>}
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-600 dark:text-muted-foreground border-collapse font-mono whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-200 dark:border-border text-indigo-700 dark:text-cyber-blue bg-slate-50 dark:bg-background/50">
            {cols.map((col, i) => (
              <th key={i} className="py-3 px-4 uppercase tracking-wider font-semibold">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, idx: number) => (
            <tr key={idx} className="border-b border-slate-100 dark:border-border/50 hover:bg-slate-50 dark:hover:bg-muted/30 transition-colors group">
              {Object.values(row).map((val: any, i) => (
                <td key={i} className={`py-3 px-4 ${i === 0 ? "text-slate-900 dark:text-foreground font-bold group-hover:text-indigo-600 dark:group-hover:text-cyber-blue transition-colors" : ""}`}>
                  <span className={
                    val === "O(1)" || val === "O(log N)" || val === "O(V+E)" ? "text-emerald-600 dark:text-cyber-green" :
                    val === "O(N)" || val === "O(E log V)" ? "text-amber-600 dark:text-cyber-yellow" :
                    typeof val === 'string' && (val.includes("N^2") || val.includes("N²") || val.includes("!")) ? "text-rose-600 dark:text-cyber-red" : ""
                  }>
                    {val}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

  </div>
);

// --- CODE TABS ---
export const CodeTabs = ({ tabs }: { tabs: { language: string; code: string; title?: string }[] }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [activeIdx, tabs]);

  const handleCopy = () => {
    navigator.clipboard.writeText(tabs[activeIdx].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageColorClass = (lang: string, isActive: boolean) => {
    if (!isActive) return "text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground";
    const l = lang.toLowerCase();
    if (l.includes('java')) return 'border-orange-500 dark:border-cyber-orange text-orange-600 dark:text-cyber-orange bg-orange-50 dark:bg-muted/30 border-b-2';
    if (l.includes('cpp') || l.includes('c++')) return 'border-blue-500 dark:border-cyber-blue text-blue-600 dark:text-cyber-blue bg-blue-50 dark:bg-muted/30 border-b-2';
    if (l.includes('python')) return 'border-amber-500 dark:border-cyber-yellow text-amber-600 dark:text-cyber-yellow bg-amber-50 dark:bg-muted/30 border-b-2';
    return 'border-indigo-500 dark:border-cyber-blue text-indigo-600 dark:text-cyber-blue bg-indigo-50 dark:bg-muted/30 border-b-2';
  };

  const getPrismLanguage = (lang: string) => {
    const l = lang.toLowerCase();
    if (l.includes('c++') || l.includes('cpp')) return 'cpp';
    if (l.includes('java')) return 'java';
    if (l.includes('python')) return 'python';
    return 'javascript';
  };

  return (
    <div className="relative group my-8 rounded-xl overflow-hidden border border-slate-200 dark:border-border bg-white dark:bg-card shadow-lg dark:shadow-xl">
      <div className="flex items-center justify-between px-4 bg-slate-100 dark:bg-muted/30 border-b border-slate-200 dark:border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5 py-3 hidden sm:flex">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400/20 dark:bg-[hsl(var(--cyber-red))]/20 border border-rose-500/50 dark:border-[hsl(var(--cyber-red))]/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/20 dark:bg-[hsl(var(--cyber-yellow))]/20 border border-amber-500/50 dark:border-[hsl(var(--cyber-yellow))]/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/20 dark:bg-[hsl(var(--cyber-green))]/20 border border-emerald-500/50 dark:border-[hsl(var(--cyber-green))]/50" />
          </div>
          <div className="flex pt-1">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`px-4 py-2 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-colors ${getLanguageColorClass(tab.language, activeIdx === idx)}`}
              >
                {tab.language}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 py-2">
          {tabs[activeIdx].title && <span className="text-[10px] md:text-xs font-mono text-slate-500 dark:text-muted-foreground hidden lg:block">{tabs[activeIdx].title}</span>}
          <button onClick={handleCopy} className="text-slate-400 hover:text-indigo-600 dark:text-muted-foreground dark:hover:text-cyber-blue transition-colors p-1">
            {copied ? <Check size={14} className="text-emerald-500 dark:text-cyber-green" /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto bg-slate-50 dark:bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 max-h-[600px]">
        <pre className="text-xs md:text-sm font-mono text-slate-700 dark:text-muted-foreground leading-relaxed">
          <code className={`language-${getPrismLanguage(tabs[activeIdx].language)}`}>
            {tabs[activeIdx].code}
          </code>
        </pre>
      </div>
    </div>
  );
};

// --- CYBER BACKGROUND ---
export const CyberSpaceBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    const particles: any[] = [];
    const COUNT = width < 768 ? 30 : 60;
    for (let i = 0; i < COUNT; i++) {
      particles.push({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, size: Math.random() * 2 });
    }
    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(0, 245, 255, 0.1)";
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    const handleResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); cancelAnimationFrame(animId); };
  }, []);
  return (
    <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#e2e8f0_0%,_#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_50%_0%,_hsl(230_30%_10%)_0%,_hsl(230_15%_2%)_100%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block opacity-30 dark:opacity-30" />
    </div>
  );
};

// --- DOC SECTION INTERFACE ---
export interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  searchContent: string;
  render: (highlight: string) => React.ReactNode;
}
