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
    <section ref={ref} className="py-14 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-16 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-[#00bcd4] uppercase tracking-widest mb-4">
            <Newspaper className="w-3 h-3 text-[#00bcd4]" />
            AlgoLib Discover
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
            Stay at the<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00bcd4] to-[#60a5fa]">cutting edge.</span>
          </h2>
        </div>

        <Link
          to="https://discover-algolib.netlify.app/discover"
          className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white font-semibold text-sm hover:bg-white/[0.08] transition-colors"
        >
          View all articles <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {content.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to={`https://discover-algolib.netlify.app/discover/${item.slug}`}
              className="group block h-full overflow-hidden rounded-[20px] bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.18] hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] hover:bg-white/[0.06] transition-all duration-500 relative"
              style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)" }}
            >
              {/* Card glare */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
              
              <div className="aspect-[16/10] overflow-hidden bg-black relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d10] via-transparent to-transparent z-10 opacity-60 group-hover:opacity-10 transition-opacity duration-500" />
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                    <Newspaper className="w-8 h-8 text-white/20" />
                  </div>
                )}
                <div className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded bg-black/50 backdrop-blur-md border border-white/10 text-[9px] font-mono font-bold text-white uppercase tracking-wider shadow-sm">
                  {item.type}
                </div>
              </div>
              <div className="p-6 relative z-20">
                <h3 className="text-[17px] font-bold text-white/90 group-hover:text-white transition-colors leading-[1.4] line-clamp-2 tracking-tight">
                  {item.title}
                </h3>
                <div className="mt-5 flex items-center text-[12px] font-mono text-[#00bcd4] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  Read article <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
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
