import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Star, ArrowRight, Shield, Cpu, Globe } from "lucide-react";

interface FooterCTAProps {
  onGetStarted: () => void;
}

const testimonials = [
  { name: "Arjun Mehta", role: "SDE @ Razorpay", text: "AlgoLib's visualizer is insane. I finally understood how quicksort pivots work after watching it animate.", rating: 5 },
  { name: "Priya Sharma", role: "CS Student, IIT Delhi", text: "The linked list visualizer helped me crack my DS mid-semester. Zero to hero in one session.", rating: 5 },
  { name: "Karan Verma", role: "Competitive Programmer", text: "The compiler is blazing fast. No more switching tabs — everything I need is on one platform.", rating: 5 },
  { name: "Sneha Joshi", role: "Full Stack Developer", text: "Live contests with a leaderboard? AlgoLib is literally a mini-Codeforces. Love it.", rating: 5 },
  { name: "Rohan Das", role: "Backend Engineer", text: "The BST visualizer with BFS/DFS animation is 10/10. Makes interview prep so much clearer.", rating: 5 },
  { name: "Ananya Patel", role: "CS Student, BITS Pilani", text: "DSA notes are top-tier. Concise, well-structured, and paired with practice problems.", rating: 5 },
];

const row1 = testimonials.slice(0, 3);
const row2 = testimonials.slice(3, 6);

const avatarColors = [
  { from: "#00e676", to: "#00bcd4" },
  { from: "#a78bfa", to: "#818cf8" },
  { from: "#f59e0b", to: "#f97316" },
  { from: "#60a5fa", to: "#3b82f6" },
  { from: "#f472b6", to: "#ec4899" },
  { from: "#34d399", to: "#10b981" },
];

const TestimonialCard = ({ item, i }: { item: typeof testimonials[0]; i: number }) => {
  const color = avatarColors[i % avatarColors.length];
  return (
    <div className="mx-3 w-[340px] flex-shrink-0 p-6 rounded-[20px] bg-[#0c0c0f] border border-white/[0.07] flex flex-col gap-4 relative overflow-hidden group select-none">
      {/* Subtle gradient bg on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 20% 20%, ${color.from}10, transparent 60%)` }}
      />
      {/* Top glare line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* Stars */}
      <div className="flex gap-1">
        {[...Array(item.rating)].map((_, idx) => (
          <Star key={idx} className="w-3.5 h-3.5 text-[#fbbf24]" fill="currentColor" />
        ))}
      </div>

      <p className="text-[13.5px] leading-[1.65] text-white/65 font-medium flex-1 relative z-10">
        "{item.text}"
      </p>

      <div className="flex items-center gap-3 relative z-10 pt-2 border-t border-white/[0.05]">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
        >
          {item.name[0]}
        </div>
        <div>
          <p className="text-sm font-bold text-white/90 leading-tight">{item.name}</p>
          <p className="text-[11px] font-mono mt-0.5" style={{ color: color.from }}>{item.role}</p>
        </div>
      </div>
    </div>
  );
};

const MarqueeRow = ({ items, direction }: { items: typeof testimonials; direction: 1 | -1 }) => {
  const duplicated = [...items, ...items, ...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden w-full py-3">
      <motion.div
        className="flex w-max"
        animate={{ x: direction === 1 ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {duplicated.map((item, i) => (
          <TestimonialCard key={`${item.name}-${i}`} item={item} i={i} />
        ))}
      </motion.div>
    </div>
  );
};

const trustBadges = [
  { icon: Shield, label: "Secure Auth", desc: "OAuth 2.0" },
  { icon: Cpu, label: "Edge Compiled", desc: "< 200ms" },
  { icon: Globe, label: "Always On", desc: "99.9% Uptime" },
];

const FooterCTA: React.FC<FooterCTAProps> = ({ onGetStarted }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div>
      {/* ── Testimonials Section ─────────────────────────────── */}
      <section className="pt-24 pb-16 overflow-hidden bg-[#050507] relative">
        {/* Ambient top border glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 px-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[11px] font-mono text-[#fbbf24] uppercase tracking-widest mb-5">
            <Star className="w-3 h-3" fill="currentColor" />
            Wall of Love
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
            Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#f59e0b]">developers</span>
          </h2>
          <p className="mt-3 text-white/40 text-sm max-w-md mx-auto">
            Join 1,200+ engineers using AlgoLib to learn, compete, and grow.
          </p>
        </motion.div>

        <div className="relative">
          <MarqueeRow items={row1} direction={1} />
          <MarqueeRow items={row2} direction={-1} />
          {/* Edge fades */}
          <div className="absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-[#050507] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-[#050507] to-transparent z-10 pointer-events-none" />
        </div>
      </section>

      {/* ── Final CTA Section ────────────────────────────────── */}
      <section
        ref={ref}
        className="relative py-32 px-6 flex flex-col items-center justify-center overflow-hidden bg-[#050507]"
      >
        {/* Background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(0,230,118,0.07),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(167,139,250,0.05),transparent)] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at bottom, rgba(0,230,118,0.12), transparent 70%)", filter: "blur(60px)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center text-center w-full max-w-3xl mx-auto"
        >
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-[11px] font-mono text-white/50 uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />
            Start for free · No card needed
          </div>

          <h2
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Ready to level up
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e676] via-[#69f0ae] to-[#00bcd4]">
              your skills?
            </span>
          </h2>
          <p className="text-white/40 text-lg mb-10 max-w-xl leading-relaxed">
            Everything you need to master algorithms — visualizer, compiler, contests, notes, and AI — in one platform.
          </p>

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGetStarted}
            className="group relative px-10 py-5 rounded-2xl font-bold text-lg overflow-hidden flex items-center gap-3"
            style={{
              background: "linear-gradient(135deg, #00e676 0%, #00bcd4 100%)",
              boxShadow: "0 0 40px rgba(0,230,118,0.35), 0 0 80px rgba(0,230,118,0.15), inset 0 1px 1px rgba(255,255,255,0.3)",
              color: "#000",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Zap className="w-5 h-5 relative z-10 flex-shrink-0" fill="currentColor" />
            <span className="relative z-10">Start your journey</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
          </motion.button>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            {trustBadges.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-2.5 text-white/40">
                <Icon className="w-4 h-4 text-white/60" />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs font-mono text-white/40 bg-white/[0.05] px-2 py-0.5 rounded">{desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default FooterCTA;
