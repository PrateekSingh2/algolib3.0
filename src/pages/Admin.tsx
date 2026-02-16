import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Terminal, Clock, HardDrive, Copy, Check, 
  Info, Cpu, Hash, ShieldCheck, Save, RefreshCw, 
  AlertCircle, X, Code, FileJson, CloudLightning, 
  Search, Settings, Loader2, Edit3, Trash2
} from "lucide-react";
import Navbar from "@/components/Navbar";

// --- 1. NEURAL BACKGROUND ---
const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    let particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(0, 245, 255, 0.2)";
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.fillRect(p.x, p.y, 2, 2);
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 245, 255, ${1 - dist / 100})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    };
    animate();
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 bg-[#020205]" />;
};

const COMPLEXITY_PRESETS = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"];

const Admin = () => {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);

  // --- EDITOR STATE ---
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [activeTab, setActiveTab] = useState<"java" | "cpp">("java");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    category: "",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    description: "",
    codeJava: "",
    codeCpp: ""
  });

  // --- UI STATE ---
  const [jsonOutput, setJsonOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // --- MODAL STATES ---
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  // --- GIST CONFIGURATION ---
  const [gistConfig, setGistConfig] = useState({ id: "", token: "" });
  const [existingAlgos, setExistingAlgos] = useState<any[]>([]);

  // Load config from local storage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("algolib_gist_config");
    if(savedConfig) setGistConfig(JSON.parse(savedConfig));
  }, []);

  // --- LOGIN HANDLER ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "algolib" && password === "dQk028<7@") {
      setIsAuthenticated(true);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  // --- GITHUB GIST OPERATIONS ---

  // 1. Fetch all algorithms from Gist
  const fetchFromGist = async () => {
    if(!gistConfig.id) return alert("Please configure Gist ID in settings first.");
    setIsLoading(true);
    try {
        const response = await fetch(`https://api.github.com/gists/${gistConfig.id}`);
        const data = await response.json();
        const fileContent = data.files["algorithms.json"]?.content;
        
        if(fileContent) {
            const parsed = JSON.parse(fileContent);
            setExistingAlgos(parsed);
            return parsed;
        } else {
            throw new Error("algorithms.json not found in Gist");
        }
    } catch (error) {
        alert("Failed to fetch Gist. Check ID or internet connection.");
        console.error(error);
        return null;
    } finally {
        setIsLoading(false);
    }
  };

  // 2. Load a specific algorithm into the form
  const loadAlgorithm = (algo: any) => {
      setFormData({
          id: algo.id || "",
          title: algo.title || "",
          category: algo.category || "",
          timeComplexity: algo.timeComplexity || "O(n)",
          spaceComplexity: algo.spaceComplexity || "O(1)",
          description: algo.description || "",
          codeJava: algo.codeJava || "",
          codeCpp: algo.codeCpp || ""
      });
      setTags(algo.tags || []);
      setMode("edit");
      setShowLoadModal(false);
      setStatusMsg(`Loaded: ${algo.title}`);
      setTimeout(() => setStatusMsg(""), 3000);
  };

  // 3. Save/Update to Gist
  const saveToGist = async () => {
      if(!gistConfig.token) return alert("Please configure GitHub Token in settings.");
      if(!formData.id || !formData.title) return alert("ID and Title are required.");

      setIsLoading(true);
      
      try {
          // A. Get fresh data first to ensure we don't overwrite others' work
          const currentData = await fetchFromGist();
          if(!currentData) return;

          let newData = [...currentData];
          
          // B. Construct the new algorithm object
          const newEntry = { ...formData, tags };

          if (mode === "edit") {
              // Find index and update
              const index = newData.findIndex((a: any) => a.id === formData.id);
              if(index !== -1) {
                  newData[index] = newEntry;
              } else {
                  // Fallback if ID changed (treat as new or warn)
                  newData.push(newEntry); 
              }
          } else {
              // Create Mode: Check for duplicates
              if(newData.find((a: any) => a.id === formData.id)) {
                  alert("ID already exists! Use Edit mode or change ID.");
                  setIsLoading(false);
                  return;
              }
              newData.push(newEntry);
          }

          // C. Push to GitHub
          const res = await fetch(`https://api.github.com/gists/${gistConfig.id}`, {
              method: "PATCH",
              headers: {
                  "Authorization": `Bearer ${gistConfig.token}`,
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({
                  files: {
                      "algorithms.json": {
                          content: JSON.stringify(newData, null, 2)
                      }
                  }
              })
          });

          if(res.ok) {
              setStatusMsg("Global Database Updated Successfully");
              setTimeout(() => setStatusMsg(""), 5000);
          } else {
              throw new Error("GitHub API Error");
          }

      } catch (error) {
          alert("Failed to save to Gist. Check your Token permissions.");
      } finally {
          setIsLoading(false);
      }
  };

  // --- UI HANDLERS ---
  const handlePurge = () => {
    setFormData({
        id: "", title: "", category: "", timeComplexity: "O(n)", 
        spaceComplexity: "O(1)", description: "", codeJava: "", codeCpp: ""
    });
    setTags([]);
    setJsonOutput("");
    setMode("create");
    setShowPurgeModal(false);
    setStatusMsg("Workspace Purged");
    setTimeout(() => setStatusMsg(""), 2000);
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => setTags(tags.filter(tag => tag !== tagToRemove));

  const generateJSON = () => {
    const formatted = { ...formData, tags };
    setJsonOutput(JSON.stringify(formatted, null, 2));
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <NeuralBackground />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#0a0a1a]/80 backdrop-blur-2xl border border-[#00f5ff]/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,245,255,0.2)]"
        >
          <div className="flex flex-col items-center mb-8">
             <div className="w-16 h-16 bg-[#00f5ff]/10 rounded-full flex items-center justify-center mb-4 border border-[#00f5ff]/50">
                <Lock className="text-[#00f5ff] animate-pulse" />
             </div>
             <h2 className="text-2xl font-black tracking-tighter text-white uppercase">Access_Restricted</h2>
             <p className="text-[10px] font-mono text-gray-500 tracking-[0.3em]">Enter Administrator Key</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
             <input type="text" placeholder="IDENTITY" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#00f5ff] text-white font-mono" />
             <input type="password" placeholder="PASSCODE" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#00f5ff] text-white font-mono" />
             <button className="w-full py-4 bg-[#00f5ff] text-black font-black uppercase rounded-xl hover:shadow-[0_0_20px_#00f5ff] transition-all duration-300">INITIALIZE_SESSION</button>
             {loginError && <p className="text-red-500 text-center font-mono text-[10px] animate-bounce">AUTH_FAILURE: ACCESS_DENIED</p>}
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden">
      <NeuralBackground />
      <Navbar />
      
      {/* --- PURGE MODAL --- */}
      <AnimatePresence>
        {showPurgeModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-sm bg-[#1a0505] border border-red-500/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                    <div className="flex flex-col items-center text-center mb-6">
                        <AlertCircle className="text-red-500 w-12 h-12 mb-3" />
                        <h3 className="text-xl font-bold text-red-500 uppercase">Confirm Purge</h3>
                        <p className="text-xs text-gray-400 mt-2">This will wipe all unsaved data from the current form. This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowPurgeModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-400">CANCEL</button>
                        <button onClick={handlePurge} className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold text-white shadow-lg shadow-red-900/40">PURGE DATA</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- CONFIG MODAL --- */}
      <AnimatePresence>
        {showConfigModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-md bg-[#0a0a1a] border border-[#00f5ff]/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,245,255,0.1)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-[#00f5ff] flex items-center gap-2"><Settings size={18}/> Connection Settings</h3>
                        <button onClick={() => setShowConfigModal(false)}><X size={18} className="text-gray-500 hover:text-white"/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-mono">Gist ID</label>
                            <input value={gistConfig.id} onChange={(e) => setGistConfig({...gistConfig, id: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs font-mono text-[#00f5ff] focus:border-[#00f5ff] outline-none" placeholder="e.g. abc12345..." />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-mono">GitHub Token (Gist Scope)</label>
                            <input type="password" value={gistConfig.token} onChange={(e) => setGistConfig({...gistConfig, token: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs font-mono text-[#00f5ff] focus:border-[#00f5ff] outline-none" placeholder="ghp_..." />
                        </div>
                        <button 
                            onClick={() => {
                                localStorage.setItem("algolib_gist_config", JSON.stringify(gistConfig));
                                setShowConfigModal(false);
                                setStatusMsg("Credentials Saved");
                                setTimeout(() => setStatusMsg(""), 2000);
                            }}
                            className="w-full py-3 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] rounded font-bold hover:bg-[#00f5ff]/20"
                        >
                            SAVE CONFIGURATION
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- LOAD/EDIT MODAL --- */}
      <AnimatePresence>
        {showLoadModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-2xl h-[80vh] bg-[#0a0a1a] border border-[#00f5ff]/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,245,255,0.1)] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><CloudLightning size={18} className="text-[#00f5ff]"/> Select Algorithm to Edit</h3>
                        <button onClick={() => setShowLoadModal(false)}><X size={18} className="text-gray-500 hover:text-white"/></button>
                    </div>
                    
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center flex-col gap-4">
                            <Loader2 className="animate-spin text-[#00f5ff]" size={40} />
                            <span className="text-xs font-mono text-gray-500">FETCHING FROM GIST...</span>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto custom-scrollbar space-y-2">
                             {existingAlgos.length === 0 && <div className="text-center text-gray-500 py-10">No data found or not loaded yet.</div>}
                             {existingAlgos.map((algo) => (
                                 <div key={algo.id} onClick={() => loadAlgorithm(algo)} className="p-4 bg-white/5 border border-white/5 rounded-lg hover:border-[#00f5ff] hover:bg-[#00f5ff]/5 cursor-pointer transition-all group">
                                     <div className="flex justify-between items-center">
                                         <div>
                                             <h4 className="font-bold text-gray-200 group-hover:text-[#00f5ff]">{algo.title}</h4>
                                             <p className="text-[10px] text-gray-500 font-mono">ID: {algo.id}</p>
                                         </div>
                                         <Edit3 size={16} className="text-gray-500 group-hover:text-[#00f5ff]" />
                                     </div>
                                 </div>
                             ))}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-32 pb-20 px-4 container mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
           <div>
               <div className="flex items-center gap-4 mb-2">
                  <ShieldCheck className="text-[#00ff88]" />
                  <h1 className="text-4xl font-black tracking-tighter">DATA_FORGE</h1>
               </div>
               <div className="flex items-center gap-3">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${mode === 'create' ? 'bg-[#00f5ff] text-black' : 'bg-orange-500 text-black'}`}>
                       MODE: {mode}
                   </span>
                   {statusMsg && <span className="text-[#00ff88] text-xs font-mono animate-pulse">{statusMsg}</span>}
               </div>
           </div>
           
           <div className="flex gap-3">
               <button onClick={() => setShowConfigModal(true)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"><Settings size={18} /></button>
               
               <button 
                  onClick={() => {
                      fetchFromGist().then((data) => {
                          if(data) setShowLoadModal(true);
                      });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] rounded-lg hover:bg-[#00f5ff]/20 transition-all text-xs font-bold"
               >
                   <CloudLightning size={14} /> LOAD / EDIT
               </button>

               <button 
                  onClick={() => setShowPurgeModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all rounded-lg"
               >
                   <RefreshCw size={14} /> PURGE
               </button>
           </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
           {/* --- FORM SECTION --- */}
           <div className={`space-y-6 bg-[#0a0a1a]/60 backdrop-blur-xl border p-8 rounded-3xl relative transition-colors ${mode === 'edit' ? 'border-orange-500/30' : 'border-white/5'}`}>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest flex items-center gap-2">Protocol ID <span className="text-red-500">*</span></label>
                    <input disabled={mode === 'edit'} value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} className={`w-full bg-black/40 border rounded-lg px-4 py-3 outline-none focus:border-[#00f5ff] font-mono text-sm ${mode === 'edit' ? 'border-orange-500/30 text-gray-500 cursor-not-allowed' : 'border-white/10'}`} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest">Category</label>
                    <input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00f5ff] text-sm" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest flex items-center gap-2">Algorithm Title <span className="text-red-500">*</span></label>
                 <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00f5ff] text-sm font-bold" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Time Complexity</label>
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-1 custom-scrollbar">
                        {COMPLEXITY_PRESETS.map(c => (
                            <button key={c} onClick={() => setFormData({...formData, timeComplexity: c})} className="px-2 py-1 rounded bg-purple-900/20 border border-purple-500/30 text-[10px] text-purple-300 hover:bg-purple-500/20 whitespace-nowrap">{c}</button>
                        ))}
                    </div>
                    <input value={formData.timeComplexity} onChange={(e) => setFormData({...formData, timeComplexity: e.target.value})} className="w-full bg-black/40 border border-purple-900/30 rounded-lg px-4 py-2 outline-none focus:border-purple-500 font-mono text-sm" />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2"><HardDrive size={12}/> Space Complexity</label>
                    <input value={formData.spaceComplexity} onChange={(e) => setFormData({...formData, spaceComplexity: e.target.value})} className="w-full bg-black/40 border border-purple-900/30 rounded-lg px-4 py-2 outline-none focus:border-purple-500 font-mono text-sm" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest flex items-center gap-2"><Hash size={12}/> Tags</label>
                 <div className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus-within:border-[#00f5ff] flex flex-wrap gap-2 transition-all">
                    {tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 bg-[#00f5ff]/20 text-[#00f5ff] px-2 py-1 rounded text-xs font-mono">
                            #{tag} <X size={10} className="cursor-pointer hover:text-white" onClick={() => removeTag(tag)} />
                        </span>
                    ))}
                    <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder={tags.length === 0 ? "add tags..." : ""} className="bg-transparent outline-none flex-1 text-sm text-gray-300 min-w-[80px]" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Description</label>
                 <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-[#00f5ff] text-sm leading-relaxed" />
              </div>

              <div className="space-y-2">
                 <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">Implementation Sequence</label>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab("java")} className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${activeTab === 'java' ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'text-gray-500 hover:text-white'}`}>JAVA</button>
                        <button onClick={() => setActiveTab("cpp")} className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${activeTab === 'cpp' ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' : 'text-gray-500 hover:text-white'}`}>C++</button>
                    </div>
                 </div>
                 {activeTab === 'java' ? (
                     <textarea value={formData.codeJava} onChange={(e) => setFormData({...formData, codeJava: e.target.value})} rows={10} className="w-full bg-black/60 border border-green-900/30 rounded-lg px-4 py-4 outline-none focus:border-[#00ff88] text-[11px] font-mono text-green-100 leading-relaxed custom-scrollbar" placeholder="// Java Code" />
                 ) : (
                     <textarea value={formData.codeCpp} onChange={(e) => setFormData({...formData, codeCpp: e.target.value})} rows={10} className="w-full bg-black/60 border border-purple-900/30 rounded-lg px-4 py-4 outline-none focus:border-[#8b5cf6] text-[11px] font-mono text-purple-100 leading-relaxed custom-scrollbar" placeholder="// C++ Code" />
                 )}
              </div>

              <div className="flex gap-4">
                  {/* GENERATE BUTTON */}
                  <button onClick={generateJSON} className="flex-1 py-4 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] font-bold uppercase rounded-xl hover:bg-[#00f5ff]/20 transition-all flex items-center justify-center gap-2">
                     <Code size={18} /> GENERATE JSON
                  </button>
                  
                  {/* SAVE TO GIST BUTTON */}
                  <button onClick={saveToGist} disabled={isLoading} className={`flex-1 py-4 font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${mode === 'edit' ? 'bg-orange-500 hover:bg-orange-600 text-black shadow-orange-500/20' : 'bg-gradient-to-r from-[#00f5ff] to-[#8b5cf6] text-black shadow-cyan-500/20 hover:scale-[1.01]'}`}>
                     {isLoading ? <Loader2 className="animate-spin"/> : <Save size={18} />}
                     {mode === 'edit' ? 'UPDATE GIST' : 'SAVE TO GIST'}
                  </button>
              </div>
           </div>

           {/* --- OUTPUT SECTION --- */}
           <div className="flex flex-col gap-6">
              <div className="bg-[#050510]/90 border border-white/10 rounded-3xl p-6 flex-1 flex flex-col min-h-[500px] shadow-2xl relative overflow-hidden group sticky top-8">
                 <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                       <FileJson size={14} className="text-gray-500" />
                       <span className="text-[10px] font-mono text-gray-500 tracking-widest">JSON_STREAM</span>
                    </div>
                    {jsonOutput && (
                      <button 
                        onClick={() => { navigator.clipboard.writeText(jsonOutput); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="px-3 py-1 rounded bg-[#00f5ff]/10 text-[#00f5ff] text-[10px] font-mono border border-[#00f5ff]/30 hover:bg-[#00f5ff] hover:text-black transition-all flex items-center gap-2"
                      >
                         {copied ? <Check size={10}/> : <Copy size={10}/>} {copied ? "COPIED" : "COPY"}
                      </button>
                    )}
                 </div>

                 <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 p-6 overflow-auto custom-scrollbar relative z-10">
                    {jsonOutput ? (
                      <pre className="text-[11px] font-mono text-blue-300 leading-relaxed whitespace-pre-wrap">{jsonOutput},</pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-4">
                         <Terminal size={40} className="text-gray-500" />
                         <p className="italic font-mono text-xs max-w-[200px]">
                            [AWAITING_INPUT] <br/> Fill the forge to generate data packet.
                         </p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;