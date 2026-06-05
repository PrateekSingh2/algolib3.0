import React, { useRef, useEffect, useState } from "react";
import { motion, useInView, useAnimationFrame } from "framer-motion";
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
];

// Avatar gradient palette
const AVATAR_COLORS = [
  { from: "#00e676", to: "#00bcd4" },
  { from: "#a78bfa", to: "#818cf8" },
  { from: "#f59e0b", to: "#f97316" },
  { from: "#60a5fa", to: "#3b82f6" },
  { from: "#f472b6", to: "#ec4899" },
  { from: "#34d399", to: "#10b981" },
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
        className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black flex-shrink-0"
      style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
};

// ── Single card ─────────────────────────────────────────────────────────────
const TestimonialCard: React.FC<{ item: Testimonial; i: number }> = ({ item, i }) => {
  const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
  return (
    <div className="mx-3 w-[320px] flex-shrink-0 p-5 rounded-[20px] bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] flex flex-col gap-3 relative overflow-hidden group select-none"
      style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)" }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 20% 20%, ${color.from}12, transparent 60%)` }} />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="flex gap-0.5">
        {[...Array(item.rating)].map((_, idx) => (
          <Star key={idx} className="w-3 h-3 text-[#fbbf24]" fill="currentColor" />
        ))}
      </div>

      <p className="text-[13px] leading-[1.7] text-white/60 font-medium flex-1 relative z-10">
        "{item.text}"
      </p>

      <div className="flex items-center gap-3 relative z-10 pt-2 border-t border-white/[0.05]">
        <Avatar name={item.name} image_url={item.image_url} i={i} />
        <div>
          <p className="text-[13px] font-semibold text-white/90 leading-tight">{item.name}</p>
          <p className="text-[11px] text-white/40 mt-0.5">{item.role}</p>
        </div>
      </div>
    </div>
  );
};

// ── Infinite marquee row ────────────────────────────────────────────────────
const MarqueeRow: React.FC<{ items: Testimonial[]; reverse?: boolean; startIdx: number }> = ({ items, reverse, startIdx }) => {
  const doubled = [...items, ...items];
  const x = useRef(0);
  const dirRef = useRef(reverse ? 1 : -1);
  const SPEED = 0.4;

  useAnimationFrame(() => {
    const el = document.getElementById(`marquee-${reverse ? "b" : "a"}`);
    if (!el) return;
    x.current += dirRef.current * SPEED;
    const halfW = el.scrollWidth / 2;
    if (!reverse && x.current <= -halfW) x.current = 0;
    if (reverse && x.current >= 0) x.current = -halfW;
    el.style.transform = `translateX(${x.current}px)`;
  });

  return (
    <div className="overflow-hidden w-full" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)" }}>
      <div id={`marquee-${reverse ? "b" : "a"}`} className="flex w-max">
        {doubled.map((item, i) => (
          <TestimonialCard key={`${item.id}-${i}`} item={item} i={(startIdx + (i % items.length)) % AVATAR_COLORS.length} />
        ))}
      </div>
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────
const FooterCTA: React.FC<FooterCTAProps> = ({ onGetStarted }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/.netlify/functions/get-testimonials?landing=true")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Testimonial[]) => {
        if (data.length >= 2) setTestimonials(data);
      })
      .catch(() => { /* keep fallback */ })
      .finally(() => setLoading(false));
  }, []);

  const half = Math.ceil(testimonials.length / 2);
  const row1 = testimonials.slice(0, half);
  const row2 = testimonials.slice(half);

  return (
    <div ref={ref}>
      {/* ── Testimonials Section ──────────────────────────── */}
      <section className="py-14 sm:py-20 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 px-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/[0.08] text-[11px] font-mono text-white/50 uppercase tracking-widest mb-5">
            <Star className="w-3 h-3 text-[#fbbf24]" fill="currentColor" />
            Wall of Love
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3" style={{ letterSpacing: "-0.02em" }}>
            Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#f97316]">developers</span>
          </h2>
          <p className="text-white/35 text-base max-w-md mx-auto">
            Join thousands of students and engineers who level up with AlgoLib.{" "}
            <a href="/testimonials" className="text-white/65 hover:text-white underline underline-offset-2 transition-colors">
              See all / Add your testimonial →
            </a>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col gap-4"
        >
          {row1.length > 0 && <MarqueeRow items={row1} startIdx={0} />}
          {row2.length > 0 && <MarqueeRow items={row2} reverse startIdx={half} />}
        </motion.div>
      </section>

      {/* ── CTA Section ──────────────────────────────────── */}
      <section className="py-14 sm:py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto text-center relative"
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,230,118,0.08), transparent)", filter: "blur(40px)" }} />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00e676]/10 border border-[#00e676]/20 text-[11px] font-mono text-[#00e676] uppercase tracking-widest mb-6">
            <Zap className="w-3 h-3" fill="currentColor" />
            Free Forever — No Credit Card
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight" style={{ letterSpacing: "-0.025em" }}>
            Ready to level up <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e676] to-[#00bcd4]">your skills?</span>
          </h2>
          <p className="text-white/40 text-base mb-8 max-w-md mx-auto leading-relaxed">
            Start visualizing, compiling, and competing today. No setup required — jump in from any device.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 50px rgba(0,230,118,0.45)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="group relative px-9 py-4 rounded-2xl font-bold text-base text-black flex items-center gap-2.5 overflow-hidden"
              style={{ background: "linear-gradient(135deg,#00e676 0%,#00bcd4 100%)", boxShadow: "0 0 32px rgba(0,230,118,0.3),inset 0 1px 1px rgba(255,255,255,0.3)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Zap className="w-4 h-4" fill="currentColor" />
              <span>Start Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>

            <a href="/testimonials"
              className="px-7 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.08] font-semibold text-sm transition-all duration-300 backdrop-blur-md flex items-center gap-2">
              <Star className="w-4 h-4 text-[#fbbf24]" fill="currentColor" />
              Read All Reviews
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {[
              [Shield, "Secure Auth · OAuth 2.0"],
              [Cpu, "Edge Compiled · <200ms"],
              [Globe, "Always On · 99.9% Uptime"],
            ].map(([Icon, text]) => (
              <div key={text as string} className="flex items-center gap-1.5 text-[11px] text-white/30">
                <Icon className="w-3 h-3 text-white/20" />
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
