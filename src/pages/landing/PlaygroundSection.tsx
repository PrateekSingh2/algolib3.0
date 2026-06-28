import React, { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const collabImg = "https://ik.imagekit.io/g7e4hyclo/Gemini_Generated_Image_vr2lo6vr2lo6vr2l%20(1).png"
const visualizerImg = "https://ik.imagekit.io/g7e4hyclo/Screenshot%202026-06-28%20173402.png";
const compilerImg = "https://ik.imagekit.io/g7e4hyclo/Screenshot%202026-06-28%20172505.png"
const codeImg = "https://ik.imagekit.io/g7e4hyclo/Screenshot%202026-06-28%20173145.png";

interface PlaygroundSectionProps {
  onRequireAuth?: () => void;
}

const slides = [
  {
    id: 1,
    title: "Multiplayer setup",
    description: "Create a room and get a room id to collaborate with others.",
    image: collabImg,
  },
  {
    id: 2,
    title: "Visualizer Multiplayer",
    description: "Collaborate in real-time while visualizing Data Structures together.",
    image: visualizerImg,
  },
  {
    id: 3,
    title: "Code Visualizer Multiplayer",
    description: "Watch your code come alive with real-time visualization with peers.",
    image: codeImg,
  },
  {
    id: 4,
    title: "Online Compiler Multiplayer",
    description: "Code with peers in real-time.",
    image: compilerImg,
  }
];

const PlaygroundSection: React.FC<PlaygroundSectionProps> = ({ onRequireAuth }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlide = slides[currentIndex];

  return (
    <section id="playground" ref={ref} className="py-10 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto relative z-10 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 sm:mb-16 relative"
      >
        <svg className="absolute -top-10 left-[20%] w-8 h-8 text-indigo-300 dark:text-indigo-500/30 rotate-12 opacity-50 pointer-events-none" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M25 5 L28 20 L45 22 L32 30 L35 45 L25 35 L15 45 L18 30 L5 22 L22 20 Z" />
        </svg>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-white/[0.04] border-2 border-indigo-100 dark:border-white/[0.08] text-[12px] font-bold text-indigo-600 dark:text-white/50 uppercase tracking-widest mb-5 font-nunito">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 dark:bg-[#00e676] opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500 dark:bg-[#00e676]" />
          </span>
          Multiplayer Collaboration
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-800 dark:text-white tracking-tight mb-5 font-comic">
          Code and Learn.<br />
          <span className="text-indigo-500 dark:text-[#00bcd4] relative inline-block mt-2">
            Together in Real-Time.
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-300 dark:text-indigo-500/50 opacity-60" viewBox="0 0 200 20" preserveAspectRatio="none">
              <path d="M0,10 Q50,20 100,5 T150,15 T200,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="text-slate-500 dark:text-white/40 text-lg font-medium max-w-2xl mx-auto">
          Experience seamless collaborative algorithms visualization and code execution natively embedded into AlgoLib.
        </p>
      </motion.div>

      {/* Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="w-full max-w-5xl mx-auto flex flex-col items-center"
      >
        <div className="relative w-full rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_0_60px_-15px_rgba(99,102,241,0.2)] border border-slate-200/50 dark:border-indigo-500/20 bg-slate-50 dark:bg-[#050507] aspect-[16/10] sm:aspect-video flex flex-col group p-1 sm:p-2">
          <div className="relative flex-1 w-full bg-slate-100 dark:bg-black rounded-[1.5rem] sm:rounded-[1.75rem] overflow-hidden border border-slate-200/50 dark:border-white/5">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="absolute inset-0 w-full h-full"
              >
                <img
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  className="w-full h-full object-cover object-top"
                />
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <button
                onClick={handlePrev}
                className="pointer-events-auto p-2 sm:p-3 rounded-full bg-white/60 dark:bg-black/60 backdrop-blur-md text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 shadow-lg hover:bg-white/90 dark:hover:bg-black/80 transition-colors z-40"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={handleNext}
                className="pointer-events-auto p-2 sm:p-3 rounded-full bg-white/60 dark:bg-black/60 backdrop-blur-md text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 shadow-lg hover:bg-white/90 dark:hover:bg-black/80 transition-colors z-40"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Slide Info & Pagination */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center h-20 sm:h-16 flex flex-col justify-center"
            >
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white font-nunito mb-1.5">
                {currentSlide.title}
              </h3>
              <p className="text-sm font-bold text-slate-500 dark:text-white/40 font-nunito max-w-lg mx-auto">
                {currentSlide.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-3">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`transition-all duration-300 rounded-full h-2.5 ${idx === currentIndex
                  ? "w-8 bg-indigo-500 dark:bg-[#00e676]"
                  : "w-2.5 bg-slate-300 dark:bg-white/20 hover:bg-slate-400 dark:hover:bg-white/40"
                  }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default PlaygroundSection;
