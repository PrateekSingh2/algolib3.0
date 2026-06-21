import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Star, ArrowRight, Shield, Cpu, Globe } from "lucide-react";

interface FooterCTAProps {
  onGetStarted: () => void;
}

// ── Testimonial type ────────────────────────────────────────────────────────
interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  image_url?: string | null;
  show_on_landing: boolean;
  approved: boolean;
  created_at: string;
}

// Fallback static data (used while loading or if fetch fails)
const FALLBACK: Testimonial[] = [
  { id: "1", name: "Arjun Mehta",  role: "SDE @ Razorpay",          text: "AlgoLib's visualizer is insane. I finally understood how quicksort pivots work after watching it animate.", rating: 5, show_on_landing: true, approved: true, created_at: "" },
  { id: "2", name: "Priya Sharma", role: "CS Student, IIT Delhi",    text: "The linked list visualizer helped me crack my DS mid-semester. Zero to hero in one session.", rating: 5, show_on_landing: true, approved: true, created_at: "" },
  { id: "3", name: "Karan Verma",  role: "Competitive Programmer",   text: "The compiler is blazing fast. No more switching tabs — everything I need is on one platform.", rating: 5, show_on_landing: true, approved: true, created_at: "" },
  { id: "4", name: "Sneha Joshi",  role: "Full Stack Developer",     text: "Live contests with a leaderboard? AlgoLib is literally a mini-Codeforces. Love it.", rating: 5, show_on_landing: true, approved: true, created_at: "" },
  { id: "5", name: "Rohan Das",    role: "Backend Engineer",         text: "The BST visualizer with BFS/DFS animation is 10/10. Makes interview prep so much clearer.", rating: 5, show_on_landing: true, approved: true, created_at: "" },
  { id: "6", name: "Ananya Patel", role: "CS Student, BITS Pilani",  text: "DSA notes are top-tier. Concise, well-structured, and paired with practice problems.", rating: 5, show_on_landing: true, approved: true, created_at: "" },
  { id: "7", name: "Vivek Kumar",  role: "Frontend Engineer",        text: "This platform changed how I study for interviews. Visually tracing recursion trees is a game-changer.", rating: 5, show_on_landing: true, approved: true, created_at: "" },
  { id: "8", name: "Neha Singh",   role: "Google SWE Intern",        text: "I used AlgoLib to visualize complex graph problems before writing the code. Helped me clear Google!", rating: 5, show_on_landing: true, approved: true, created_at: "" },
  { id: "9", name: "Rahul Jain",   role: "Open Source Contributor",  text: "Simply beautiful UI and extremely robust backend. The fact that it compiles Rust code so fast is wild.", rating: 5, show_on_landing: true, approved: true, created_at: "" },
];

// Avatar gradient palette
const AVATAR_COLORS = [
  { from: "#34d399", to: "#10b981" },
  { from: "#a78bfa", to: "#8b5cf6" },
  { from: "#fbbf24", to: "#f59e0b" },
  { from: "#60a5fa", to: "#3b82f6" },
  { from: "#f472b6", to: "#ec4899" },
  { from: "#818cf8", to: "#6366f1" },
];

// ── Avatar component — image if present, else letter gradient ─────────────
const Avatar: React.FC<{ name: string; image_url?: string | null; i: number }> = ({ name, image_url, i }) => {
  const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
  const [imgErr, setImgErr] = useState(false);

  if (image_url && !imgErr) {
    return (
      <img
        src={image_url}
        alt={name}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100 dark:ring-[#1E2028]"
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 font-nunito"
      style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
};

// ── Single card ─────────────────────────────────────────────────────────────
const TestimonialCard: React.FC<{ item: Testimonial; i: number }> = ({ item, i }) => {
  return (
    <div className="w-full flex-shrink-0 p-6 rounded-[24px] bg-white dark:bg-[#20232b] border border-slate-200 dark:border-white/5 flex flex-col gap-4 relative overflow-hidden group select-none shadow-sm dark:shadow-none transition-transform hover:-translate-y-1 hover:shadow-md mb-4 md:mb-6">
      <div className="flex gap-1 text-amber-400 mt-1 mb-1">
        {Array.from({ length: item.rating || 5 }).map((_, idx) => (
          <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      
      <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium relative z-10 font-nunito flex-1">
        {item.text}
      </p>

      <div className="flex items-center gap-3 relative z-10 pt-4 mt-2 border-t border-slate-100 dark:border-white/[0.05]">
        <Avatar name={item.name} image_url={item.image_url} i={i} />
        <div>
          <p className="text-[14px] font-black text-slate-800 dark:text-white leading-tight font-nunito tracking-tight">{item.name}</p>
          <p className="text-[12px] text-slate-500 dark:text-white/40 mt-0.5 font-semibold font-nunito">{item.role}</p>
        </div>
      </div>
    </div>
  );
};

// ── Skeleton card while loading ─────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="w-full h-[200px] flex-shrink-0 p-6 rounded-[24px] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] animate-pulse mb-6">
    <div className="flex gap-1 mb-4">
      {Array.from({ length: 5 }).map((_, idx) => <div key={idx} className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/10" />)}
    </div>
    <div className="space-y-3 mb-5"><div className="h-3 bg-slate-200 dark:bg-white/10 rounded-full w-full" /><div className="h-3 bg-slate-200 dark:bg-white/10 rounded-full w-5/6" /><div className="h-3 bg-slate-200 dark:bg-white/10 rounded-full w-4/6" /></div>
    <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.04]">
      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex-shrink-0" />
      <div className="space-y-2"><div className="h-3 bg-slate-200 dark:bg-white/10 rounded-full w-24" /><div className="h-2.5 bg-slate-200 dark:bg-white/10 rounded-full w-16" /></div>
    </div>
  </div>
);

// ── Main component ──────────────────────────────────────────────────────────
const FooterCTA: React.FC<FooterCTAProps> = ({ onGetStarted }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/.netlify/functions/get-testimonials?landing=true")
      .then(r => { if (!r.ok) throw new Error("non-ok"); return r.json(); })
      .then((data: Testimonial[]) => {
        setTestimonials(data.length > 0 ? data : FALLBACK);
      })
      .catch(() => {
        setTestimonials(FALLBACK);
      })
      .finally(() => setLoading(false));
  }, []);

  // Split into 3 columns for masonry
  const col1: Testimonial[] = [];
  const col2: Testimonial[] = [];
  const col3: Testimonial[] = [];
  
  // Don't double the testimonials, so the grid actually has an end that the user can reach seamlessly
  testimonials.forEach((t, i) => {
    if (i % 3 === 0) col1.push(t);
    else if (i % 3 === 1) col2.push(t);
    else col3.push(t);
  });

  return (
    <div ref={ref} className="relative z-10 w-full bg-inherit">
      {/* ── Testimonials Section ──────────────────────────── */}
      <section className="relative w-full h-[90vh] min-h-[600px] max-h-[1000px] flex flex-col items-center pt-8 sm:pt-12 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-10 flex-shrink-0"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-white/[0.04] border-2 border-amber-100 dark:border-white/[0.08] text-[12px] font-bold text-amber-500 dark:text-white/50 tracking-widest mb-4 font-nunito shadow-sm dark:shadow-none">
            <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
            Wall of Love
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-800 dark:text-white tracking-tight mb-4 font-comic relative">
            Loved by <span className="text-amber-500 dark:text-amber-400 relative inline-block mt-2">
              developers
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-amber-300 dark:text-amber-500/50 opacity-60" viewBox="0 0 200 20" preserveAspectRatio="none">
                <path d="M0,10 Q50,20 100,5 T150,15 T200,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative flex-1 w-full max-w-6xl mx-auto overflow-y-auto scrollbar-hide pb-10"
          style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 5%, black 90%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 5%, black 90%, transparent 100%)" }}
        >
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
              <div className="flex flex-col gap-4 md:gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
              <div className="hidden md:flex flex-col gap-4 md:gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
              <div className="hidden lg:flex flex-col gap-4 md:gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start w-full px-2">
              {/* Col 1 */}
              <div className="flex flex-col gap-4 md:gap-6">
                {col1.map((item, i) => <TestimonialCard key={`col1-${i}`} item={item} i={i} />)}
              </div>
              {/* Col 2 */}
              <div className="hidden md:flex flex-col gap-4 md:gap-6 mt-10">
                {col2.map((item, i) => <TestimonialCard key={`col2-${i}`} item={item} i={i + col1.length} />)}
              </div>
              {/* Col 3 */}
              <div className="hidden lg:flex flex-col gap-4 md:gap-6 mt-5">
                {col3.map((item, i) => <TestimonialCard key={`col3-${i}`} item={item} i={i + col1.length + col2.length} />)}
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* ── CTA Section ──────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto text-center relative"
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(99,102,241,0.05), transparent)", filter: "blur(40px)" }} />

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-[#00e676]/10 border-2 border-emerald-100 dark:border-[#00e676]/20 text-[12px] font-bold text-emerald-600 dark:text-[#00e676] uppercase tracking-widest mb-6 font-nunito shadow-sm dark:shadow-none">
            <Zap className="w-4 h-4" fill="currentColor" />
            Free Forever — No Credit Card
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-800 dark:text-white tracking-tight leading-[1.1] mb-5 font-comic relative">
            Ready to level up<br />
            <span className="text-indigo-500 dark:text-indigo-400 relative inline-block mt-2">
              your skills?
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-300 dark:text-indigo-500/50 opacity-60" viewBox="0 0 200 20" preserveAspectRatio="none">
                <path d="M0,10 Q50,20 100,5 T150,15 T200,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
            {/* Scribble Star Decor */}
            <svg className="absolute -top-6 right-0 w-10 h-10 text-indigo-400/50 dark:text-indigo-500/30 rotate-12 pointer-events-none" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M25 5 L28 20 L45 22 L32 30 L35 45 L25 35 L15 45 L18 30 L5 22 L22 20 Z" />
            </svg>
          </h2>
          <p className="text-slate-500 dark:text-white/40 text-base sm:text-lg mb-10 max-w-lg mx-auto leading-relaxed font-semibold">
            Start visualizing, compiling, and competing today. No setup required — jump in from any device.
          </p>

          <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 w-full">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="group relative flex-1 sm:flex-none px-2 py-3 sm:px-10 sm:py-5 rounded-full font-black text-sm sm:text-lg text-white bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 flex items-center justify-center gap-1.5 sm:gap-3 overflow-hidden shadow-[0_8px_20px_rgba(99,102,241,0.3)] transition-colors font-nunito"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" />
              <span className="whitespace-nowrap">Start Free</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <a href="/testimonials"
              className="flex-1 sm:flex-none px-2 py-3 sm:px-10 sm:py-5 rounded-full bg-white dark:bg-white/[0.04] border-2 border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-white/80 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-200 dark:hover:bg-white/[0.08] font-black text-sm sm:text-lg transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-3 font-nunito shadow-sm dark:shadow-none">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="currentColor" />
              <span className="whitespace-nowrap text-center">Read Reviews</span>
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-8 sm:mt-12 flex flex-row flex-wrap sm:flex-nowrap items-center justify-center gap-4 sm:gap-6 w-full">
            {[
              [Shield, "Secure Auth · OAuth 2.0"],
              [Cpu, "Edge Compiled · <200ms"],
              [Globe, "Always On · 99.9% Uptime"],
            ].map(([Icon, text]) => (
              <div key={text as string} className="flex flex-row items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[12px] font-bold text-slate-400 dark:text-white/30 font-nunito whitespace-nowrap">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 dark:text-white/20 flex-shrink-0" />
                <span>{text as string}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default FooterCTA;
