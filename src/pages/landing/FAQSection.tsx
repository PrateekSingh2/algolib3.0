import React, { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Plus, MessageCircle } from "lucide-react";

const faqs = [
  { q: "Is AlgoLib free to use?", a: "Yes. The core Visualizer, Compiler, Notes, and Sheets are completely free for everyone — no account required for public tools." },
  { q: "What languages does the compiler support?", a: "Our engine currently supports C++, Java, Python, JavaScript, Go, Rust, Ruby, and PHP — with more languages planned." },
  { q: "Do I need to create an account?", a: "An account unlocks Contests, Community, Quizzes, Profile, and progress tracking. The playground section works without signing in." },
  { q: "What data structures can I visualize?", a: "Linked Lists (Singly, Doubly, Circular), Binary Search Trees, Graphs, Heaps, Stacks, Queues, and Sorting Algorithms with step-by-step animations." },
  { q: "Are the contests rated?", a: "Yes! AlgoLib Contests have a live leaderboard. Consistent performance earns you a rank badge visible on your public profile." },
  { q: "Is there a mobile app?", a: "AlgoLib is a PWA — install it from your browser on Android or iOS for a native-like app experience with offline support." },
];

const FAQSection: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section ref={ref} className="py-14 sm:py-20 px-5 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/[0.08] text-[11px] font-mono text-white/50 uppercase tracking-widest mb-5">
          <MessageCircle className="w-3 h-3 text-[#a78bfa]" />
          FAQ
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em" }}>
          Got questions?
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] to-[#818cf8]">We've got answers.</span>
        </h2>
        <p className="text-white/35 text-base max-w-md mx-auto">
          Everything you need to know about AlgoLib.
        </p>
      </motion.div>

      <div className="flex flex-col gap-2">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Glass card wrapper — activates when open */}
            <div
              className={`rounded-2xl transition-all duration-300 ${
                open === i
                  ? "bg-white/[0.04] backdrop-blur-xl border border-white/[0.1] shadow-[inset_0_1px_1px_rgba(255,255,255,0.07)]"
                  : "border border-white/[0.05] hover:border-white/[0.08] hover:bg-white/[0.02]"
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full py-5 px-5 flex items-center justify-between text-left focus:outline-none group relative"
              >
                {/* Accent left bar */}
                <motion.div
                  className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                  animate={{
                    scaleY: open === i ? 1 : 0,
                    background: "linear-gradient(to bottom, #a78bfa, #6366f1)",
                    opacity: open === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.25 }}
                />

                <span
                  className="text-[15px] sm:text-[16px] font-semibold tracking-tight pr-8 transition-colors duration-200"
                  style={{ color: open === i ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.70)" }}
                >
                  {faq.q}
                </span>

                <motion.span
                  animate={{
                    rotate: open === i ? 45 : 0,
                    color: open === i ? "#a78bfa" : "rgba(255,255,255,0.3)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="flex-shrink-0 ml-4"
                >
                  <Plus className="w-4 h-4" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 px-5 text-white/50 text-[14.5px] leading-[1.75]">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FAQSection;
