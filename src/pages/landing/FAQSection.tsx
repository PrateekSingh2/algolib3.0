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
    <section ref={ref} className="py-10 sm:py-20 px-5 max-w-3xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-white/[0.04] backdrop-blur-md border-2 border-violet-100 dark:border-white/[0.08] text-[12px] font-bold text-violet-600 dark:text-[#a78bfa] uppercase tracking-widest mb-5 font-nunito">
          <MessageCircle className="w-4 h-4 text-violet-500 dark:text-[#a78bfa]" />
          FAQ
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-800 dark:text-white tracking-tight mb-5 font-comic relative" style={{ letterSpacing: "-0.02em" }}>
          Got questions?
          <br />
          <span className="text-violet-500 dark:text-[#a78bfa] relative inline-block mt-2">
            We've got answers.
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-violet-300 dark:text-violet-500/50 opacity-60" viewBox="0 0 200 20" preserveAspectRatio="none">
              <path d="M0,10 Q50,20 100,5 T150,15 T200,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
          {/* Scribble Arrow Decor */}
          <svg className="absolute -top-4 right-[10%] w-10 h-10 text-violet-300 dark:text-violet-500/30 opacity-60 pointer-events-none rotate-[100deg]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 90 Q 30 20 80 10 M 60 10 L 80 10 L 80 30" />
          </svg>
        </h2>
        <p className="text-slate-500 dark:text-white/35 text-lg font-medium max-w-md mx-auto">
          Everything you need to know about AlgoLib.
        </p>
      </motion.div>

      <div className="flex flex-col gap-3">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Glass card wrapper — activates when open */}
            <div
              className={`rounded-3xl transition-all duration-300 border-2 ${
                open === i
                  ? "bg-white dark:bg-white/[0.04] backdrop-blur-xl border-violet-200 dark:border-white/[0.1] shadow-lg dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.07)]"
                  : "bg-white/50 dark:bg-transparent border-slate-100 dark:border-white/[0.05] hover:border-violet-100 dark:hover:border-white/[0.08] hover:bg-white dark:hover:bg-white/[0.02] shadow-sm dark:shadow-none"
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none group relative"
              >
                {/* Accent left bar */}
                <motion.div
                  className="absolute left-0 top-3 bottom-3 w-[4px] rounded-r-full"
                  animate={{
                    scaleY: open === i ? 1 : 0,
                    background: "linear-gradient(to bottom, #a78bfa, #8b5cf6)",
                    opacity: open === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.25 }}
                />

                <span
                  className={`text-[16px] sm:text-[17px] font-black tracking-tight pr-8 transition-colors duration-200 font-nunito ${
                    open === i ? "text-slate-800 dark:text-white" : "text-slate-600 dark:text-white/70"
                  }`}
                >
                  {faq.q}
                </span>

                <motion.span
                  animate={{
                    rotate: open === i ? 45 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className={`flex-shrink-0 ml-4 ${
                    open === i ? "text-violet-500 dark:text-[#a78bfa]" : "text-slate-400 dark:text-white/30"
                  }`}
                >
                  <Plus className="w-5 h-5" />
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
                    <p className="pb-6 px-6 text-slate-500 dark:text-white/50 text-[15px] font-semibold leading-[1.75] font-nunito">
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
