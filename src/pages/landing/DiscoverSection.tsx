import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Newspaper, ArrowRight, Zap, ExternalLink } from "lucide-react";

interface DiscoverItem {
  id: string;
  type: "article" | "research" | "news";
  title: string;
  slug: string;
  image_url?: string;
}

const DiscoverSection: React.FC = () => {
  const [content, setContent] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    const fetchDiscover = async () => {
      try {
        const res = await fetch("/.netlify/functions/getDiscoverContent");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setContent(data);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch discover content", err);
      } finally {
        setLoading(false);
      }

      // Fallback content if fetch fails (e.g., local dev without netlify proxy) or returns empty
      setContent([
        { id: "fallback-1", type: "article", title: "Mastering Dynamic Programming in 2026", slug: "", image_url: "" },
        { id: "fallback-2", type: "research", title: "The Future of AI in Competitive Programming", slug: "", image_url: "" },
        { id: "fallback-3", type: "news", title: "AlgoLib v3.2 Release Notes: New Visualizers", slug: "", image_url: "" },
        { id: "fallback-4", type: "article", title: "Graph Algorithms: From BFS to Dijkstra", slug: "", image_url: "" },
      ]);
    };
    fetchDiscover();
  }, []);

  return (
    <section ref={ref} className="py-14 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-12 flex flex-row items-center justify-between gap-2 sm:gap-6"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 dark:bg-white/[0.04] border-2 border-cyan-100 dark:border-white/[0.08] text-[12px] font-bold text-cyan-600 dark:text-[#00bcd4] uppercase tracking-widest mb-4 font-nunito">
            <Newspaper className="w-4 h-4 text-cyan-500 dark:text-[#00bcd4]" />
            AlgoLib Discover
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-800 dark:text-white tracking-tight font-comic relative">
            Stay at the<br />
            <span className="text-cyan-500 dark:text-[#00bcd4] relative inline-block mt-2">
              cutting edge.
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-cyan-300 dark:text-cyan-500/50 opacity-60" viewBox="0 0 200 20" preserveAspectRatio="none">
                <path d="M0,10 Q50,20 100,5 T150,15 T200,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
            {/* Scribble Star Decor */}
            <svg className="absolute -top-6 -left-6 w-8 h-8 text-cyan-400/50 dark:text-cyan-500/30 -rotate-12 pointer-events-none" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M25 5 L28 20 L45 22 L32 30 L35 45 L25 35 L15 45 L18 30 L5 22 L22 20 Z" />
            </svg>
          </h2>
        </div>

        <Link
          to="https://discover-algolib.netlify.app/discover"
          className="group flex flex-shrink-0 items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl bg-white dark:bg-white/[0.04] border-2 border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-white font-black text-xs sm:text-sm hover:border-cyan-200 dark:hover:bg-white/[0.08] hover:text-cyan-600 dark:hover:text-white transition-all font-nunito shadow-sm dark:shadow-none whitespace-nowrap"
        >
          View all <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {content.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to={`https://discover-algolib.netlify.app/discover/${item.slug}`}
              className="group block h-full overflow-hidden rounded-3xl bg-white dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/[0.08] hover:border-cyan-200 dark:hover:border-cyan-500/50 hover:shadow-lg dark:hover:shadow-[0_16px_40px_rgba(0,188,212,0.15)] dark:hover:bg-white/[0.06] transition-all duration-500 relative"
            >
              <div className="aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-black relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-10 transition-opacity duration-500" />
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                    <Newspaper className="w-8 h-8 text-indigo-300 dark:text-white/20" />
                  </div>
                )}
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-black/50 backdrop-blur-md border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-wider shadow-sm font-nunito">
                  {item.type}
                </div>
              </div>
              <div className="p-3 sm:p-6 relative z-20">
                <h3 className="text-[12px] sm:text-[18px] font-black text-slate-800 dark:text-white/90 group-hover:text-cyan-600 dark:group-hover:text-white transition-colors leading-[1.3] sm:leading-[1.4] line-clamp-2 tracking-tight font-nunito">
                  {item.title}
                </h3>
                <div className="mt-3 sm:mt-5 flex items-center text-[10px] sm:text-[13px] font-black text-cyan-500 dark:text-[#00bcd4] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 font-nunito">
                  Read article <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-1.5" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default DiscoverSection;
