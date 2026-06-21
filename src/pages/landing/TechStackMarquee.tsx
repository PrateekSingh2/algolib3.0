import React, { useRef } from "react";
import { useAnimationFrame } from "framer-motion";
import { Columns, GitCommit, Layers, AlignLeft, Network, Share2, Mountain } from "lucide-react";

const LANGUAGES = [
  { name: "C", icon: "https://cdn.simpleicons.org/c/A8B9CC" },
  { name: "C++", icon: "https://cdn.simpleicons.org/cplusplus/00599C" },
  { name: "Python", icon: "https://cdn.simpleicons.org/python/3776AB" },
  { name: "Java", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" },
  { name: "JavaScript", icon: "https://cdn.simpleicons.org/javascript/F7DF1E" },
];

const DATA_STRUCTURES = [
  { name: "Arrays", icon: <Columns className="w-4 h-4 text-indigo-500" /> },
  { name: "Linked List", icon: <GitCommit className="w-4 h-4 text-emerald-500" /> },
  { name: "Stacks", icon: <Layers className="w-4 h-4 text-amber-500" /> },
  { name: "Queues", icon: <AlignLeft className="w-4 h-4 text-blue-500" /> },
  { name: "Trees", icon: <Network className="w-4 h-4 text-green-500" /> },
  { name: "Graphs", icon: <Share2 className="w-4 h-4 text-rose-500" /> },
  { name: "Heaps", icon: <Mountain className="w-4 h-4 text-orange-500" /> },
];

const MarqueeStrip = ({ items, speed, direction = 1, className, innerClassName }: any) => {
  const duplicated = [...items, ...items, ...items, ...items, ...items, ...items];
  const x = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useAnimationFrame(() => {
    if (!containerRef.current) return;
    x.current -= speed * direction;
    const w = containerRef.current.scrollWidth / 2;
    if (direction === 1 && x.current <= -w) x.current = 0;
    if (direction === -1 && x.current >= 0) x.current = -w;
    containerRef.current.style.transform = `translateX(${x.current}px)`;
  });

  return (
    <div className={`overflow-hidden flex w-full relative ${className}`}>
      <div ref={containerRef} className={`flex w-max space-x-12 px-6 ${innerClassName}`}>
        {duplicated.map((item, i) => (
          <div key={`${item.name}-${i}`} className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity cursor-default whitespace-nowrap">
            {typeof item.icon === "string" ? (
              <img src={item.icon} alt={item.name} className="w-6 h-6 object-contain" />
            ) : item.icon ? (
              <div className="flex items-center justify-center w-7 h-7 rounded bg-white dark:bg-black shadow-sm border border-slate-200 dark:border-white/10">
                {item.icon}
              </div>
            ) : null}
            <span className="font-black text-xl font-comic tracking-wide">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TechStackMarquee = () => {
  return (
    <div className="w-full overflow-hidden bg-transparent relative flex flex-col justify-center items-center h-[160px]">

      {/* Top Strip - Straight */}
      <div className="absolute w-[110%] -left-[5%] z-20 -translate-y-4">
        <div className="bg-slate-900 dark:bg-black text-white py-3.5 shadow-xl border-y border-white/10">
          <MarqueeStrip
            items={LANGUAGES}
            speed={1.2}
            direction={1}
          />
        </div>
      </div>

      {/* Bottom Strip - Diagonal */}
      <div className="absolute w-[110%] -left-[5%] z-10 translate-y-6 -rotate-[3deg]">
        <div className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white py-3.5 shadow-xl border-y border-slate-300 dark:border-slate-700">
          <MarqueeStrip
            items={DATA_STRUCTURES}
            speed={0.8}
            direction={-1}
          />
        </div>
      </div>

    </div>
  );
};

export default TechStackMarquee;
