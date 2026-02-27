import React, { useState, useRef, useEffect } from "react";
import { Copy, Check, Info, AlertCircle, Hash, Play, Settings, Search, X } from "lucide-react";

// --- HIGHLIGHT TEXT ---
export const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-cyber-yellow/30 text-cyber-yellow font-bold px-0.5 rounded">{part}</span>
        ) : (part)
      )}
    </span>
  );
};

// --- SECTION BADGE ---
export const SectionBadge = ({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "purple" | "green" | "red" | "orange" }) => {
  const colors = {
    blue: "bg-[hsl(var(--cyber-blue))]/10 text-cyber-blue border-[hsl(var(--cyber-blue))]/20",
    purple: "bg-[hsl(var(--cyber-purple))]/10 text-cyber-purple border-[hsl(var(--cyber-purple))]/20",
    green: "bg-[hsl(var(--cyber-green))]/10 text-cyber-green border-[hsl(var(--cyber-green))]/20",
    red: "bg-[hsl(var(--cyber-red))]/10 text-cyber-red border-[hsl(var(--cyber-red))]/20",
    orange: "bg-[hsl(var(--cyber-orange))]/10 text-cyber-orange border-[hsl(var(--cyber-orange))]/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wide ${colors[color]}`}>
      {children}
    </span>
  );
};

// --- PRO TIP ---
export const ProTip = ({ children }: { children: React.ReactNode }) => (
  <div className="my-6 p-4 rounded-lg bg-[hsl(var(--cyber-blue))]/5 border-l-2 border-cyber-blue flex gap-3 text-sm text-muted-foreground shadow-lg">
    <Info className="shrink-0 text-cyber-blue" size={18} />
    <div className="flex-1"><strong className="text-cyber-blue block text-xs mb-1 uppercase tracking-wider">Professor's Insight</strong>{children}</div>
  </div>
);

// --- WARNING BLOCK ---
export const WarningBlock = ({ children }: { children: React.ReactNode }) => (
  <div className="my-6 p-4 rounded-lg bg-[hsl(var(--cyber-red))]/5 border-l-2 border-cyber-red flex gap-3 text-sm text-muted-foreground">
    <AlertCircle className="shrink-0 text-cyber-red" size={18} />
    <div><strong className="text-cyber-red block text-xs mb-1 uppercase tracking-wider">Common Pitfall</strong>{children}</div>
  </div>
);

// --- COMPLEXITY TABLE ---
export const ComplexityTable = ({ title, rows, cols }: { title?: string; rows: any[]; cols: string[] }) => (
  <div className="my-8 border border-border rounded-xl overflow-hidden bg-card shadow-xl">
    {title && <div className="bg-muted/50 px-4 py-3 border-b border-border font-bold text-sm text-foreground flex items-center gap-2"><Hash size={14} className="text-cyber-blue" />{title}</div>}
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-muted-foreground border-collapse font-mono whitespace-nowrap">
        <thead>
          <tr className="border-b border-border text-cyber-blue bg-background/50">
            {cols.map((col, i) => (
              <th key={i} className="py-3 px-4 uppercase tracking-wider font-semibold">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, idx: number) => (
            <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
              {Object.values(row).map((val: any, i) => (
                <td key={i} className={`py-3 px-4 ${i === 0 ? "text-foreground font-bold group-hover:text-cyber-blue transition-colors" : ""}`}>
                  <span className={
                    val === "O(1)" || val === "O(log N)" || val === "O(V+E)" ? "text-cyber-green" :
                    val === "O(N)" || val === "O(E log V)" ? "text-cyber-yellow" :
                    typeof val === 'string' && (val.includes("N^2") || val.includes("N²") || val.includes("!")) ? "text-cyber-red" : ""
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

  const handleCopy = () => {
    navigator.clipboard.writeText(tabs[activeIdx].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageColorClass = (lang: string, isActive: boolean) => {
    if (!isActive) return "text-muted-foreground hover:text-foreground";
    const l = lang.toLowerCase();
    if (l.includes('java')) return 'border-cyber-orange text-cyber-orange bg-muted/30 border-b-2';
    if (l.includes('cpp') || l.includes('c++')) return 'border-cyber-blue text-cyber-blue bg-muted/30 border-b-2';
    if (l.includes('python')) return 'border-cyber-yellow text-cyber-yellow bg-muted/30 border-b-2';
    return 'border-cyber-blue text-cyber-blue bg-muted/30 border-b-2';
  };

  return (
    <div className="relative group my-8 rounded-xl overflow-hidden border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between px-4 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5 py-3 hidden sm:flex">
            <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--cyber-red))]/20 border border-[hsl(var(--cyber-red))]/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--cyber-yellow))]/20 border border-[hsl(var(--cyber-yellow))]/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--cyber-green))]/20 border border-[hsl(var(--cyber-green))]/50" />
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
          {tabs[activeIdx].title && <span className="text-[10px] md:text-xs font-mono text-muted-foreground hidden lg:block">{tabs[activeIdx].title}</span>}
          <button onClick={handleCopy} className="text-muted-foreground hover:text-cyber-blue transition-colors p-1">
            {copied ? <Check size={14} className="text-cyber-green" /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 max-h-[600px]">
        <pre className="text-xs md:text-sm font-mono text-muted-foreground leading-relaxed"><code>{tabs[activeIdx].code}</code></pre>
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
    <div className="fixed inset-0 -z-10 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_hsl(230_30%_10%)_0%,_hsl(230_15%_2%)_100%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block opacity-30" />
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
