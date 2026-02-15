import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, HardDrive, Copy, Check, Activity, Dna } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import { fetchAlgorithms, type Algorithm } from "@/lib/algorithms";
import Navbar from "@/components/Navbar";

// --- 1. THE BIO-COSMIC BACKGROUND ---
const AlienBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050510] perspective-1000">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a0b2e] via-[#050510] to-[#000000]" />
      <motion.div animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-[20%] left-[20%] w-[60vw] h-[60vw] bg-[#9d00ff]/10 rounded-full blur-[120px]" />
      <motion.div animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.3, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[10%] right-[10%] w-[70vw] h-[70vw] bg-[#00f5ff]/10 rounded-full blur-[140px]" />
      <div className="absolute inset-0 pointer-events-none">
         {[...Array(15)].map((_, i) => (
            <motion.div key={i} className="absolute rounded-full bg-[#00ff88]/40 blur-[1px]" style={{ width: Math.random() * 3 + 1, height: Math.random() * 3 + 1, left: `${Math.random() * 100}%`, bottom: "-10%" }} animate={{ y: [0, -1000], opacity: [0, 0.8, 0] }} transition={{ duration: Math.random() * 15 + 15, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }} />
         ))}
      </div>
    </div>
  );
};

const GlitchText = ({ text }: { text: string }) => (
    <div className="relative inline-block group">
      <span className="relative z-10 font-black tracking-tight">{text}</span>
      <span className="absolute top-0 left-0 -ml-[2px] text-[#9d00ff] opacity-0 group-hover:opacity-100 animate-pulse select-none z-0 mix-blend-screen">{text}</span>
      <span className="absolute top-0 left-0 ml-[2px] text-[#00f5ff] opacity-0 group-hover:opacity-100 animate-pulse select-none z-0 mix-blend-screen" style={{ animationDelay: '0.1s' }}>{text}</span>
    </div>
);

const FloatingElement = ({ children, delay = 0, intensity = 15 }: { children: React.ReactNode, delay?: number, intensity?: number }) => (
  <motion.div animate={{ y: [0, -intensity, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay }}>
    {children}
  </motion.div>
);

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

const SnippetView = () => {
  const { id } = useParams<{ id: string }>();
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [activeTab, setActiveTab] = useState<"java" | "cpp">("java");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // SCROLL TO TOP ON LOAD
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const customPrismStyles = `
    code[class*="language-"],
    pre[class*="language-"] {
      color: #e0e7ff; 
      text-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
      font-family: 'Fira Code', monospace;
      font-size: 14px;
      line-height: 1.7;
    }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #9d00ff, #00f5ff); border-radius: 10px; }
    .token.comment { color: #6b7280; font-style: italic; }
    .token.punctuation { color: #a5b4fc; opacity: 0.7; }
    .token.function { color: #00f5ff; text-shadow: 0 0 12px rgba(0, 245, 255, 0.5); }
    .token.keyword { color: #9d00ff; text-shadow: 0 0 12px rgba(157, 0, 255, 0.5); }
    .token.string { color: #00ff88; text-shadow: 0 0 8px rgba(0, 255, 136, 0.4); }
    .token.number { color: #f472b6; }
    .token.class-name { color: #00f5ff; font-weight: bold; }
  `;

  useEffect(() => {
    let mounted = true;
    fetchAlgorithms().then((algos) => {
      if (mounted) {
        const found = algos.find((a) => String(a.id) === id);
        setAlgorithm(found || null);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (algorithm) {
       const timer = setTimeout(() => Prism.highlightAll(), 0);
       return () => clearTimeout(timer);
    }
  }, [algorithm, activeTab]);

  const handleCopy = async () => {
    const code = activeTab === "java" ? algorithm?.codeJava : algorithm?.codeCpp;
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050510]">
        <AlienBackground />
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-24 h-24">
             <div className="absolute inset-0 border-4 border-[#9d00ff]/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
             <div className="absolute inset-2 border-t-4 border-[#00f5ff] rounded-full animate-spin" />
          </div>
          <span className="text-[#00f5ff] font-mono tracking-[0.3em] text-sm animate-pulse">ESTABLISHING LINK...</span>
        </div>
      </div>
    );
  }

  if (!algorithm) return <div />;

  const currentCode = activeTab === "java" ? algorithm.codeJava : algorithm.codeCpp;

  return (
    <div className="min-h-screen text-white font-sans relative selection:bg-[#9d00ff]/40 overflow-x-hidden">
      <style>{customPrismStyles}</style>
      <AlienBackground />
      <Navbar />

      <main className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          
          {/* --- TOP NAV BAR --- */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-16"
          >
            <Link to="/" className="group flex items-center gap-3">
               <div className="p-2 rounded-full bg-[#00f5ff]/10 border border-[#00f5ff]/30 group-hover:bg-[#00f5ff]/20 transition-all">
                 <ArrowLeft className="w-5 h-5 text-[#00f5ff]" />
               </div>
               <span className="text-sm font-mono text-[#00f5ff]/70 group-hover:text-[#00f5ff] tracking-widest uppercase">Terminate View</span>
            </Link>
            
            <FloatingElement delay={1}>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5">
                   <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_10px_#00ff88]" />
                   <span className="text-xs font-mono font-bold tracking-widest text-[#00ff88] uppercase">Link Active</span>
                </div>
            </FloatingElement>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 items-start">
            
            {/* --- LEFT: HOLOGRAPHIC MEMBRANE (CODE) --- */}
            <FloatingElement intensity={10} delay={0}>
               <motion.div
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.8 }}
                 className="relative w-full group"
               >
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#9d00ff]/20 to-[#00f5ff]/20 rounded-[30px] blur-2xl opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                  
                  <div className="relative rounded-tl-[30px] rounded-br-[30px] rounded-tr-lg rounded-bl-lg bg-[#0a0a1a]/60 backdrop-blur-xl border border-white/10 overflow-hidden">
                     
                     <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden opacity-30 mix-blend-overlay">
                        <motion.div animate={{ top: ["-10%", "110%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent shadow-[0_0_20px_#00f5ff]" />
                     </div>

                     <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-3">
                           <Dna className="w-5 h-5 text-[#9d00ff] animate-pulse" />
                           <span className="text-xs font-mono text-[#00f5ff]/80 tracking-[0.2em]">
                              {activeTab === 'java' ? 'SEQ_JAVA' : 'SEQ_CPP'}
                           </span>
                        </div>

                        <div className="flex items-center gap-6">
                           <div className="flex bg-[#000]/40 rounded-full p-1 border border-white/5">
                              {(['java', 'cpp'] as const).map((lang) => (
                                 <button
                                    key={lang}
                                    onClick={() => setActiveTab(lang)}
                                    className={cn(
                                       "px-6 py-1.5 text-[10px] font-mono font-bold uppercase transition-all duration-500 rounded-full",
                                       activeTab === lang 
                                          ? "text-[#050510] bg-[#00f5ff] shadow-[0_0_15px_rgba(0,245,255,0.4)]" 
                                          : "text-gray-500 hover:text-gray-300"
                                    )}
                                 >
                                    {lang}
                                 </button>
                              ))}
                           </div>
                           
                           <button onClick={handleCopy} className="group relative p-2">
                              <div className="absolute inset-0 bg-[#00ff88]/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
                              {copied ? <Check className="w-5 h-5 text-[#00ff88] relative z-10" /> : <Copy className="w-5 h-5 text-gray-400 group-hover:text-white relative z-10" />}
                           </button>
                        </div>
                     </div>

                     {/* CODE STREAM - NO LINE NUMBERS */}
                     <div className="relative min-h-[600px] bg-gradient-to-b from-black/20 to-transparent">
                        <div className="absolute inset-0 overflow-auto custom-scrollbar p-8">
                           <AnimatePresence mode="wait">
                              <motion.div
                                 key={activeTab}
                                 initial={{ opacity: 0, filter: "blur(8px)" }}
                                 animate={{ opacity: 1, filter: "blur(0px)" }}
                                 transition={{ duration: 0.5 }}
                              >
                                 <pre className="!bg-transparent !m-0 !p-0">
                                    <code className={`language-${activeTab}`}>
                                       {currentCode}
                                    </code>
                                 </pre>
                              </motion.div>
                           </AnimatePresence>
                        </div>
                     </div>

                  </div>
               </motion.div>
            </FloatingElement>

            {/* --- RIGHT: INTELLIGENCE MODULES --- */}
            <div className="space-y-10 lg:sticky lg:top-32">
               
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  <div className="flex gap-3 mb-4">
                     <span className="px-3 py-1 rounded-full text-[10px] font-mono border border-[#9d00ff]/40 text-[#9d00ff] bg-[#9d00ff]/5 shadow-[0_0_10px_rgba(157,0,255,0.1)]">
                        V.AL.2.0
                     </span>
                     <span className="px-3 py-1 rounded-full text-[10px] font-mono border border-[#00f5ff]/40 text-[#00f5ff] bg-[#00f5ff]/5 uppercase shadow-[0_0_10px_rgba(0,245,255,0.1)]">
                        {algorithm.category}
                     </span>
                  </div>
                  <h1 className="text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-[#00f5ff] to-[#9d00ff] tracking-tight mb-4 drop-shadow-[0_0_15px_rgba(0,245,255,0.3)]">
                     <GlitchText text={algorithm.title} />
                  </h1>
               </motion.div>

               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm text-gray-300 font-light leading-relaxed text-sm shadow-inner"
               >
                  {algorithm.description}
               </motion.div>

               <div className="grid grid-cols-1 gap-6">
                  <FloatingElement delay={0.2} intensity={6}>
                     <div className="group relative overflow-hidden rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md bg-[#000]/40 border border-[#9d00ff]/30 p-6 hover:bg-[#9d00ff]/10 transition-colors duration-500">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#9d00ff]/20 blur-2xl rounded-full group-hover:bg-[#9d00ff]/40 transition-all" />
                        <div className="flex justify-between items-start relative z-10">
                           <div>
                              <div className="text-[10px] font-mono text-[#9d00ff] mb-2 uppercase tracking-widest">Time Complexity</div>
                              <div className="text-3xl font-mono text-white font-bold shadow-[#9d00ff]/50 drop-shadow-lg">
                                 {algorithm.timeComplexity}
                              </div>
                           </div>
                           <Clock className="w-8 h-8 text-[#9d00ff] opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                     </div>
                  </FloatingElement>

                  <FloatingElement delay={0.8} intensity={8}>
                     <div className="group relative overflow-hidden rounded-tr-3xl rounded-bl-3xl rounded-tl-md rounded-br-md bg-[#000]/40 border border-[#00f5ff]/30 p-6 hover:bg-[#00f5ff]/10 transition-colors duration-500">
                        <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-[#00f5ff]/20 blur-2xl rounded-full group-hover:bg-[#00f5ff]/40 transition-all" />
                        <div className="flex justify-between items-start relative z-10">
                           <div>
                              <div className="text-[10px] font-mono text-[#00f5ff] mb-2 uppercase tracking-widest">Space Complexity</div>
                              <div className="text-3xl font-mono text-white font-bold shadow-[#00f5ff]/50 drop-shadow-lg">
                                 {algorithm.spaceComplexity}
                              </div>
                           </div>
                           <HardDrive className="w-8 h-8 text-[#00f5ff] opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                     </div>
                  </FloatingElement>
               </div>

               <div className="pt-4 flex flex-wrap gap-3">
                  {algorithm.tags?.map((tag) => (
                     <Link 
                        key={tag} 
                        to={`/?search=${tag}`}
                        className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#00ff88]/50 hover:bg-[#00ff88]/10 hover:text-[#00ff88] transition-all text-xs font-mono text-gray-400 uppercase tracking-wider"
                     >
                        #{tag}
                     </Link>
                  ))}
               </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SnippetView;