import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, query, orderBy, onSnapshot, deleteDoc, doc, setDoc
} from "firebase/firestore";
import { auth, firestoreDB, loginWithGoogle, logout } from "../lib/firebase"; 
import { 
  Lock, Terminal, Clock, HardDrive, Copy, Check, 
  Cpu, Hash, ShieldCheck, Save, RefreshCw, 
  AlertCircle, X, Code, FileJson, CloudLightning, 
  Settings, Loader2, Edit3, ShieldAlert, Fingerprint, 
  ChevronRight, Unlock, Search, Users, Activity,
  LayoutDashboard, Database, ChevronUp, MessageSquare, AlertTriangle, Trash2,
  Megaphone, Radio, ExternalLink, Eye
} from "lucide-react";
import Navbar from '@/components/Navbar';

// ==========================================
// SECURITY: DEFINE YOUR ADMIN EMAILS HERE
// ==========================================
const ADMIN_EMAILS = [
  "prateeksinghrajawat2006@gmail.com", // REPLACE WITH YOUR ACTUAL EMAIL
  "shivanshmax@gmail.com"
];

// --- Types ---
interface ReplyType {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: number; 
  isAccepted?: boolean; 
}

interface Post {
  id: string;
  title: string;
  body: string;
  authorName: string;
  authorId: string;
  upvotes: string[];
  downvotes?: string[];
  replies: ReplyType[];
  createdAt: any; 
}

// --- 1. NEURAL BACKGROUND (Core Aesthetic) ---
const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    let particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
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
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 bg-[#020205]" />;
};

const COMPLEXITY_PRESETS = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"];

const Admin = () => {
  // --- AUTH STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState<"forge" | "moderation" | "broadcast">("forge");

  // --- EDITOR STATE ---
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [activeCodeTab, setActiveCodeTab] = useState<"java" | "cpp">("java");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  const [formData, setFormData] = useState({
    id: "", title: "", category: "", timeComplexity: "O(n)",
    spaceComplexity: "O(1)", description: "", codeJava: "", codeCpp: ""
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

  // --- MODERATION STATE ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // --- BROADCAST STATE ---
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastType, setBroadcastType] = useState<"info" | "warning" | "critical">("info");
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [broadcastLink, setBroadcastLink] = useState("");
  const [isSavingBroadcast, setIsSavingBroadcast] = useState(false);

  // ==========================================
  // INITIALIZATION & EFFECTS
  // ==========================================
  
  // Load Gist Config
  useEffect(() => {
    const savedConfig = localStorage.getItem("algolib_gist_config");
    if(savedConfig) setGistConfig(JSON.parse(savedConfig));
  }, []);

  // Firebase Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email && ADMIN_EMAILS.includes(currentUser.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Community Posts & Broadcast Settings (Only if Admin)
  useEffect(() => {
    if (!isAdmin) return;
    
    // Fetch Posts
    const qPosts = query(collection(firestoreDB, "community_posts"), orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });

    // Fetch Broadcast Settings
    const unsubBroadcast = onSnapshot(doc(firestoreDB, "system_settings", "announcement"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setBroadcastMsg(data.message || "");
            setBroadcastType(data.type || "info");
            setBroadcastActive(data.active || false);
            setBroadcastLink(data.link || "");
        }
    });

    return () => {
        unsubPosts();
        unsubBroadcast();
    };
  }, [isAdmin]);

  // ==========================================
  // BROADCAST LOGIC
  // ==========================================
  const handleSaveBroadcast = async () => {
    setIsSavingBroadcast(true);
    try {
        await setDoc(doc(firestoreDB, "system_settings", "announcement"), {
            message: broadcastMsg,
            type: broadcastType,
            active: broadcastActive,
            link: broadcastLink,
            updatedAt: new Date()
        });
        setStatusMsg("Broadcast Status Updated");
        setTimeout(() => setStatusMsg(""), 3000);
    } catch (error) {
        console.error("Failed to update broadcast", error);
        alert("Failed to update broadcast settings.");
    } finally {
        setIsSavingBroadcast(false);
    }
  };

  // ==========================================
  // GIST DATA FORGE LOGIC
  // ==========================================
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
        } else throw new Error("algorithms.json not found");
    } catch (error) {
        alert("Failed to fetch Gist.");
    } finally {
        setIsLoading(false);
    }
  };

  const loadAlgorithm = (algo: any) => {
      setFormData({
          id: algo.id || "", title: algo.title || "", category: algo.category || "",
          timeComplexity: algo.timeComplexity || "O(n)", spaceComplexity: algo.spaceComplexity || "O(1)",
          description: algo.description || "", codeJava: algo.codeJava || "", codeCpp: algo.codeCpp || ""
      });
      setTags(algo.tags || []);
      setMode("edit");
      setShowLoadModal(false);
      setStatusMsg(`Loaded: ${algo.title}`);
      setTimeout(() => setStatusMsg(""), 3000);
  };

  const saveToGist = async () => {
      if(!gistConfig.token) return alert("Please configure GitHub Token.");
      if(!formData.id || !formData.title) return alert("ID and Title required.");
      setIsLoading(true);
      try {
          const currentData = await fetchFromGist();
          if(!currentData) return;
          let newData = [...currentData];
          const newEntry = { ...formData, tags };
          if (mode === "edit") {
              const index = newData.findIndex((a: any) => a.id === formData.id);
              if(index !== -1) newData[index] = newEntry;
              else newData.push(newEntry); 
          } else {
              if(newData.find((a: any) => a.id === formData.id)) {
                  alert("ID exists!"); setIsLoading(false); return;
              }
              newData.push(newEntry);
          }
          const res = await fetch(`https://api.github.com/gists/${gistConfig.id}`, {
              method: "PATCH",
              headers: { "Authorization": `Bearer ${gistConfig.token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ files: { "algorithms.json": { content: JSON.stringify(newData, null, 2) } } })
          });
          if(res.ok) { setStatusMsg("Database Synced"); setTimeout(() => setStatusMsg(""), 5000); }
      } catch (error) { alert("Save failed."); } finally { setIsLoading(false); }
  };

  const handlePurge = () => {
    setFormData({
        id: "", title: "", category: "", timeComplexity: "O(n)", 
        spaceComplexity: "O(1)", description: "", codeJava: "", codeCpp: ""
    });
    setTags([]); setJsonOutput(""); setMode("create"); setShowPurgeModal(false);
    setStatusMsg("Workspace Purged"); setTimeout(() => setStatusMsg(""), 2000);
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };
  const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t));
  const generateJSON = () => { setJsonOutput(JSON.stringify({ ...formData, tags }, null, 2)); };


  // ==========================================
  // MODERATION LOGIC
  // ==========================================
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("ADMIN ACTION: Are you absolutely sure you want to take down this post? This action is permanent and cannot be undone.")) return;
    setIsDeleting(postId);
    try {
      await deleteDoc(doc(firestoreDB, "community_posts", postId));
    } catch (error) {
      console.error("Error taking down post:", error);
      alert("Failed to delete post.");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPosts = posts.length;
  const totalReplies = posts.reduce((acc, post) => acc + (post.replies?.length || 0), 0);
  const totalInteractions = posts.reduce((acc, post) => acc + (post.upvotes?.length || 0) + (post.downvotes?.length || 0), 0) + totalReplies;


  // ==========================================
  // RENDERING: AUTHENTICATION SCREENS
  // ==========================================
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#030308] flex flex-col items-center justify-center text-[#00f5ff] font-mono gap-4">
        <Loader2 size={40} className="animate-spin" />
        <p className="tracking-widest">VERIFYING SECURE PROTOCOLS...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <NeuralBackground />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
            <div className="bg-[#0a0a1a]/80 backdrop-blur-xl border border-[#00f5ff]/20 p-1 rounded-2xl shadow-[0_0_100px_rgba(0,245,255,0.1)] overflow-hidden">
                <motion.div animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f5ff]/50 to-transparent z-20 shadow-[0_0_10px_#00f5ff]" />
                <div className="bg-[#050510]/90 rounded-xl p-8 border border-white/5 relative text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#00f5ff]/30 bg-[#00f5ff]/5">
                        <Lock className="text-[#00f5ff]" size={32} />
                    </div>
                    <h2 className="text-2xl font-black tracking-widest text-white uppercase font-mono">SECURE_GATE</h2>
                    <p className="text-[10px] font-mono text-gray-500 tracking-[0.3em] mt-2 mb-8">BIOMETRIC_ENCRYPTION_LAYER</p>
                    <button 
                        onClick={loginWithGoogle} 
                        className="w-full bg-[#00f5ff] hover:bg-[#00d0db] text-black font-bold py-3.5 rounded-lg text-sm tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,245,255,0.4)]"
                    >
                        AUTHENTICATE WITH GOOGLE
                    </button>
                </div>
            </div>
        </motion.div>
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <NeuralBackground />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
            <div className="bg-[#0a0a1a]/80 backdrop-blur-xl border border-red-500/30 p-1 rounded-2xl shadow-[0_0_100px_rgba(220,38,38,0.15)] overflow-hidden">
                <div className="bg-[#050510]/90 rounded-xl p-8 border border-white/5 relative text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/50 bg-red-500/10">
                        <ShieldAlert className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-black tracking-widest text-red-500 uppercase font-mono">ACCESS_DENIED</h2>
                    <p className="text-[10px] font-mono text-gray-400 mt-2 mb-8">UNAUTHORIZED SIGNATURE: <span className="text-white">{user.email}</span></p>
                    <button 
                        onClick={logout} 
                        className="w-full bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold py-3.5 rounded-lg text-sm tracking-wider uppercase transition-all"
                    >
                        TERMINATE SESSION
                    </button>
                </div>
            </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // RENDERING: MAIN ADMIN APP
  // ==========================================
  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden">
      <NeuralBackground />
      <Navbar />
      
      {/* --- MODALS --- */}
      <AnimatePresence>
        {showPurgeModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-[#1a0505] border border-red-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/30">
                            <ShieldAlert className="text-red-500 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-wider">System Purge</h3>
                        <p className="text-xs text-gray-400 mt-2 font-mono">WARNING: This action creates an irreversible data loss event. Confirm deletion?</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowPurgeModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-400 transition-colors">ABORT</button>
                        <button onClick={handlePurge} className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold text-white shadow-lg shadow-red-900/40 transition-all">CONFIRM DELETE</button>
                    </div>
                </motion.div>
            </motion.div>
        )}

        {showConfigModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md bg-[#0a0a1a] border border-[#00f5ff]/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,245,255,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent opacity-50" />
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono"><Settings size={18} className="text-[#00f5ff]"/> CONNECTION_SETTINGS</h3>
                        <button onClick={() => setShowConfigModal(false)}><X size={18} className="text-gray-500 hover:text-white"/></button>
                    </div>
                    <div className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-[10px] text-[#00f5ff]/70 uppercase font-mono tracking-widest">Gist ID Reference</label>
                            <input value={gistConfig.id} onChange={(e) => setGistConfig({...gistConfig, id: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-xs font-mono text-white focus:border-[#00f5ff] outline-none transition-colors" placeholder="e.g. abc12345..." />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-[#00f5ff]/70 uppercase font-mono tracking-widest">GitHub Token (Scope: Gist)</label>
                            <input type="password" value={gistConfig.token} onChange={(e) => setGistConfig({...gistConfig, token: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-xs font-mono text-white focus:border-[#00f5ff] outline-none transition-colors" placeholder="ghp_..." />
                        </div>
                        <button 
                            onClick={() => {
                                localStorage.setItem("algolib_gist_config", JSON.stringify(gistConfig));
                                setShowConfigModal(false);
                                setStatusMsg("Credentials Saved");
                                setTimeout(() => setStatusMsg(""), 2000);
                            }}
                            className="w-full py-3 bg-[#00f5ff] text-black rounded font-bold hover:bg-[#00c2cc] transition-all shadow-[0_0_15px_rgba(0,245,255,0.3)] mt-2"
                        >
                            SAVE CONFIGURATION
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}

        {showLoadModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-3xl h-[80vh] bg-[#0a0a1a] border border-[#00f5ff]/30 rounded-2xl p-6 shadow-[0_0_60px_rgba(0,245,255,0.1)] flex flex-col relative">
                     <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none"><CloudLightning size={100} /></div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 font-mono">
                            <span className="p-2 bg-[#00f5ff]/10 rounded border border-[#00f5ff]/30 text-[#00f5ff]"><CloudLightning size={20}/></span> 
                            DATABASE_QUERY
                        </h3>
                        <button onClick={() => setShowLoadModal(false)}><X size={20} className="text-gray-500 hover:text-white"/></button>
                    </div>
                    
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center flex-col gap-4">
                            <Loader2 className="animate-spin text-[#00f5ff]" size={40} />
                            <span className="text-xs font-mono text-[#00f5ff] animate-pulse">ESTABLISHING UPLINK...</span>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto custom-scrollbar space-y-3 pr-2 relative z-10">
                             {existingAlgos.length === 0 && <div className="text-center text-gray-500 py-10 font-mono">NO DATA SIGNATURES FOUND.</div>}
                             {existingAlgos.map((algo) => (
                                 <div key={algo.id} onClick={() => loadAlgorithm(algo)} className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-[#00f5ff] hover:bg-[#00f5ff]/5 cursor-pointer transition-all group flex items-center justify-between">
                                     <div className="flex items-center gap-4">
                                         <div className="w-1 h-10 bg-gray-700 group-hover:bg-[#00f5ff] transition-colors rounded-full" />
                                         <div>
                                             <h4 className="font-bold text-gray-200 group-hover:text-[#00f5ff] tracking-wide">{algo.title}</h4>
                                             <p className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                                                 <Hash size={10} /> {algo.id} <span className="text-gray-700">|</span> {algo.timeComplexity}
                                             </p>
                                         </div>
                                     </div>
                                     <div className="p-2 rounded-full bg-black/50 border border-white/10 group-hover:border-[#00f5ff]/50 transition-colors">
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

      <main className="pt-32 pb-20 px-4 container mx-auto max-w-7xl relative z-10">
        
        {/* --- GLOBAL HEADER & TABS --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-4">
           <div>
               <div className="flex items-center gap-4 mb-3">
                  <div className="p-2 bg-[#00ff88]/10 rounded-lg border border-[#00ff88]/30">
                    <ShieldCheck className="text-[#00ff88] w-6 h-6" />
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter text-white">SYSTEM_CORE</h1>
               </div>
               <div className="flex flex-wrap gap-2">
                   <button 
                     onClick={() => setActiveTab("forge")}
                     className={`px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase transition-all rounded-lg ${activeTab === 'forge' ? 'bg-[#00f5ff]/20 text-[#00f5ff] border border-[#00f5ff]/50' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent hover:border-white/20'}`}
                   >
                     DATA_FORGE
                   </button>
                   <button 
                     onClick={() => setActiveTab("moderation")}
                     className={`px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase transition-all rounded-lg ${activeTab === 'moderation' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent hover:border-white/20'}`}
                   >
                     Community Moderation
                   </button>
                   <button 
                     onClick={() => setActiveTab("broadcast")}
                     className={`px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase transition-all rounded-lg flex items-center gap-2 ${activeTab === 'broadcast' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent hover:border-white/20'}`}
                   >
                     <Megaphone size={14} /> Global_Broadcast
                   </button>
               </div>
           </div>
           
           <div className="flex items-center gap-4 bg-[#0a0a1a] p-2 rounded-xl border border-white/10">
               <span className="text-xs font-mono text-gray-400 hidden sm:block">AUTH: <span className="text-[#00ff88]">{user?.email}</span></span>
               <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
               <button 
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all rounded text-xs font-bold font-mono tracking-wide"
               >
                   <Lock size={14} /> LOGOUT
               </button>
           </div>
        </motion.div>

        {/* ========================================== */}
        {/* TAB 1: DATA FORGE                          */}
        {/* ========================================== */}
        {activeTab === "forge" && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                
                {/* Status Bar */}
                <div className="flex items-center justify-between bg-black/40 border border-white/10 p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${mode === 'create' ? 'bg-[#00f5ff]/10 border-[#00f5ff] text-[#00f5ff]' : 'bg-orange-500/10 border-orange-500 text-orange-500'}`}>
                            MODE: {mode}
                        </span>
                        {statusMsg && (
                            <span className="flex items-center gap-2 text-[#00ff88] text-xs font-mono animate-in slide-in-from-left fade-in">
                                <Check size={12}/> {statusMsg}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowConfigModal(true)} className="p-1.5 bg-white/5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Settings"><Settings size={16} /></button>
                        <button 
                            onClick={() => { fetchFromGist().then((data) => { if(data) setShowLoadModal(true); }); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#00f5ff]/5 border border-[#00f5ff]/20 text-[#00f5ff] rounded hover:bg-[#00f5ff]/10 transition-all text-[10px] font-bold font-mono"
                        >
                            <CloudLightning size={12} /> LOAD
                        </button>
                        <button 
                            onClick={() => setShowPurgeModal(true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/5 border border-red-500/20 text-red-500 text-[10px] font-bold font-mono hover:bg-red-500/10 transition-all rounded"
                        >
                            <RefreshCw size={12} /> Reset
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
                    {/* --- FORM SECTION --- */}
                    <div className={`space-y-6 bg-[#0a0a1a]/80 backdrop-blur-xl border p-8 rounded-3xl relative transition-all shadow-2xl ${mode === 'edit' ? 'border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.1)]' : 'border-[#00f5ff]/20 shadow-[0_0_30px_rgba(0,245,255,0.05)]'}`}>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest flex items-center gap-2 opacity-70 group-focus-within:opacity-100 transition-opacity">Protocol ID <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Hash size={14} className={`absolute left-3 top-3.5 transition-colors ${mode === 'edit' ? 'text-gray-600' : 'text-gray-500 group-focus-within:text-[#00f5ff]'}`} />
                                    <input disabled={mode === 'edit'} value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} className={`w-full bg-black/40 border rounded-lg pl-10 pr-4 py-3 outline-none font-mono text-sm transition-all ${mode === 'edit' ? 'border-orange-500/20 text-gray-500 cursor-not-allowed' : 'border-white/10 focus:border-[#00f5ff] text-white focus:bg-black/60'}`} placeholder="algo_unique_id" />
                                </div>
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest opacity-70 group-focus-within:opacity-100 transition-opacity">Category</label>
                                <input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00f5ff] text-sm text-white focus:bg-black/60 transition-all" placeholder="e.g. Dynamic Programming" />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest flex items-center gap-2 opacity-70 group-focus-within:opacity-100 transition-opacity">Algorithm Title <span className="text-red-500">*</span></label>
                            <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00f5ff] text-sm font-bold text-white focus:bg-black/60 transition-all" placeholder="e.g. Dijkstra's Shortest Path" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Time Complexity</label>
                                <div className="flex gap-2 mb-2 overflow-x-auto pb-1 custom-scrollbar">
                                    {COMPLEXITY_PRESETS.map(c => (
                                        <button key={c} onClick={() => setFormData({...formData, timeComplexity: c})} className="px-2 py-1 rounded bg-purple-900/20 border border-purple-500/30 text-[10px] text-purple-300 hover:bg-purple-500/20 whitespace-nowrap transition-colors">{c}</button>
                                    ))}
                                </div>
                                <input value={formData.timeComplexity} onChange={(e) => setFormData({...formData, timeComplexity: e.target.value})} className="w-full bg-black/40 border border-purple-900/30 rounded-lg px-4 py-2 outline-none focus:border-purple-500 font-mono text-sm text-white transition-colors" />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2"><HardDrive size={12}/> Space Complexity</label>
                                <div className="h-[27px] w-full"></div>
                                <input value={formData.spaceComplexity} onChange={(e) => setFormData({...formData, spaceComplexity: e.target.value})} className="w-full bg-black/40 border border-purple-900/30 rounded-lg px-4 py-2 outline-none focus:border-purple-500 font-mono text-sm text-white transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-[#00f5ff] uppercase tracking-widest flex items-center gap-2 opacity-70"><Hash size={12}/> Tags</label>
                            <div className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus-within:border-[#00f5ff] flex flex-wrap gap-2 transition-all min-h-[50px]">
                                {tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1 bg-[#00f5ff]/20 text-[#00f5ff] px-2 py-1 rounded text-xs font-mono border border-[#00f5ff]/30">
                                        #{tag} <X size={10} className="cursor-pointer hover:text-white" onClick={() => removeTag(tag)} />
                                    </span>
                                ))}
                                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder={tags.length === 0 ? "Press Enter to add tags..." : ""} className="bg-transparent outline-none flex-1 text-sm text-gray-300 min-w-[80px]" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Description</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00f5ff] text-sm leading-relaxed text-gray-300 focus:text-white transition-all resize-none" />
                        </div>

                        <div className="space-y-0">
                            <div className="flex items-center justify-between border-b border-white/10 pb-0">
                                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2 pb-2">Implementation Sequence</label>
                                <div className="flex">
                                    <button onClick={() => setActiveCodeTab("java")} className={`px-4 py-2 text-[10px] font-bold rounded-t-lg transition-all border-t border-l border-r ${activeCodeTab === 'java' ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30' : 'border-transparent text-gray-500 hover:text-white'}`}>JAVA</button>
                                    <button onClick={() => setActiveCodeTab("cpp")} className={`px-4 py-2 text-[10px] font-bold rounded-t-lg transition-all border-t border-l border-r ${activeCodeTab === 'cpp' ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/30' : 'border-transparent text-gray-500 hover:text-white'}`}>C++</button>
                                </div>
                            </div>
                            <div className="relative">
                                {activeCodeTab === 'java' ? (
                                    <textarea value={formData.codeJava} onChange={(e) => setFormData({...formData, codeJava: e.target.value})} rows={12} className="w-full bg-[#050510] border-b border-l border-r border-[#00ff88]/30 rounded-b-lg rounded-tr-lg px-4 py-4 outline-none focus:bg-black/80 text-[11px] font-mono text-green-100 leading-relaxed custom-scrollbar transition-all" placeholder="// Java Implementation..." />
                                ) : (
                                    <textarea value={formData.codeCpp} onChange={(e) => setFormData({...formData, codeCpp: e.target.value})} rows={12} className="w-full bg-[#050510] border-b border-l border-r border-[#8b5cf6]/30 rounded-b-lg rounded-tr-lg px-4 py-4 outline-none focus:bg-black/80 text-[11px] font-mono text-purple-100 leading-relaxed custom-scrollbar transition-all" placeholder="// C++ Implementation..." />
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-white/5">
                            <button onClick={generateJSON} className="flex-1 py-4 bg-[#00f5ff]/5 border border-[#00f5ff]/20 text-[#00f5ff] font-bold uppercase rounded-xl hover:bg-[#00f5ff]/10 hover:border-[#00f5ff]/50 transition-all flex items-center justify-center gap-2 text-xs tracking-widest">
                                <Code size={16} /> Generate JSON Packet
                            </button>
                            
                            <button onClick={saveToGist} disabled={isLoading} className={`flex-1 py-4 font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-xs tracking-widest ${mode === 'edit' ? 'bg-orange-500 hover:bg-orange-600 text-black shadow-orange-500/20' : 'bg-[#00f5ff] hover:bg-[#00c2cc] text-black shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_30px_rgba(0,245,255,0.5)]'}`}>
                                {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />}
                                {mode === 'edit' ? 'Update Repository' : 'Commit to Database'}
                            </button>
                        </div>
                    </div>

                    {/* --- OUTPUT SECTION --- */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-[#0a0a1a]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex-1 flex flex-col min-h-[500px] shadow-xl relative overflow-hidden group lg:sticky lg:top-24">
                            
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00f5ff]/30 to-transparent" />

                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-2">
                                    <FileJson size={14} className="text-[#00f5ff]" />
                                    <span className="text-[10px] font-bold font-mono text-white tracking-widest uppercase">JSON_STREAM_OUTPUT</span>
                                </div>
                                {jsonOutput && (
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(jsonOutput); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                    className="px-3 py-1.5 rounded bg-[#00f5ff]/10 text-[#00f5ff] text-[10px] font-mono border border-[#00f5ff]/30 hover:bg-[#00f5ff] hover:text-black transition-all flex items-center gap-2 font-bold"
                                >
                                    {copied ? <Check size={10}/> : <Copy size={10}/>} {copied ? "COPIED" : "COPY_DATA"}
                                </button>
                                )}
                            </div>

                            <div className="flex-1 bg-black/60 rounded-xl border border-white/5 p-6 overflow-auto custom-scrollbar relative z-10 font-mono text-[11px] leading-relaxed shadow-inner">
                                {jsonOutput ? (
                                <pre className="text-blue-300 whitespace-pre-wrap">{jsonOutput},</pre>
                                ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-4">
                                    <div className="p-4 rounded-full bg-white/5 border border-white/5">
                                        <Terminal size={32} className="text-gray-400" />
                                    </div>
                                    <p className="italic font-mono text-xs max-w-[200px] text-gray-500">
                                        [STATUS: IDLE] <br/> Awaiting data forge inputs to generate stream.
                                    </p>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}

        {/* ========================================== */}
        {/* TAB 2: COMMUNITY MODERATION                */}
        {/* ========================================== */}
        {activeTab === "moderation" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                
                {/* Moderation Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0a0a1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-4 shadow-lg">
                        <div className="p-3 bg-[#00f5ff]/10 text-[#00f5ff] rounded-xl border border-[#00f5ff]/20"><MessageSquare size={24} /></div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-1">Total Discussions</p>
                            <h3 className="text-2xl font-black text-white">{totalPosts}</h3>
                        </div>
                    </div>
                    <div className="bg-[#0a0a1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-4 shadow-lg">
                        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20"><Users size={24} /></div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-1">Total Replies</p>
                            <h3 className="text-2xl font-black text-white">{totalReplies}</h3>
                        </div>
                    </div>
                    <div className="bg-[#0a0a1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-4 shadow-lg">
                        <div className="p-3 bg-[#00ff88]/10 text-[#00ff88] rounded-xl border border-[#00ff88]/20"><Activity size={24} /></div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-1">Global Interactions</p>
                            <h3 className="text-2xl font-black text-white">{totalInteractions}</h3>
                        </div>
                    </div>
                </div>

                {/* Moderation Data Table */}
                <div className="bg-[#0a0a1a]/80 backdrop-blur-xl border border-red-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
                    
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

                    {/* Toolbar */}
                    <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/40">
                        <h2 className="font-bold text-lg flex items-center gap-2 font-mono text-red-400 tracking-widest">
                            <AlertTriangle size={20} /> LIVE_FEED_OVERVIEW
                        </h2>
                        
                        <div className="relative w-full sm:w-80 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search violations, authors..." 
                                className="w-full bg-[#050510] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 transition-colors text-white placeholder:text-gray-600 font-mono"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-black/60 border-b border-white/5 text-gray-500 text-[10px] uppercase tracking-widest font-mono">
                                    <th className="p-5 font-semibold w-1/3">Post Signature</th>
                                    <th className="p-5 font-semibold">Author Matrix</th>
                                    <th className="p-5 font-semibold text-center">Metrics</th>
                                    <th className="p-5 font-semibold">Timestamp</th>
                                    <th className="p-5 font-semibold text-right">Execute Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-[#0a0a1a]/50">
                                {filteredPosts.length > 0 ? (
                                    filteredPosts.map((post) => (
                                        <tr key={post.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-5">
                                                <p className="font-bold text-white mb-1 line-clamp-1 group-hover:text-[#00f5ff] transition-colors">{post.title}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1 font-mono">{post.body}</p>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-gray-300">{post.authorName}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-600 font-mono mt-1 block tracking-wider">ID:{post.authorId.substring(0, 8)}</span>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center justify-center gap-4 text-xs font-mono text-gray-400">
                                                    <span className="flex items-center gap-1"><ChevronUp size={14} className="text-[#00f5ff]" /> {post.upvotes?.length || 0}</span>
                                                    <span className="flex items-center gap-1"><MessageSquare size={12} className="text-purple-400" /> {post.replies?.length || 0}</span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
                                                {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : "SYS_NOW"}
                                            </td>
                                            <td className="p-5 text-right">
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    disabled={isDeleting === post.id}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 hover:border-red-500 transition-all disabled:opacity-50 tracking-widest uppercase font-mono"
                                                >
                                                    {isDeleting === post.id ? <><Loader2 size={14} className="animate-spin" /> EXECUTING...</> : <><Trash2 size={14} /> Take down</>}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-600">
                                                <ShieldCheck size={48} className="mb-4 text-[#00ff88]/20" />
                                                <p className="font-mono text-sm tracking-widest text-gray-400">DATABASE QUERY RETURNED EMPTY.</p>
                                                <p className="text-xs mt-2 font-mono">No community violations detected.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        )}

        {/* ========================================== */}
        {/* TAB 3: GLOBAL BROADCAST NOTIFICATIONS      */}
        {/* ========================================== */}
        {activeTab === "broadcast" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 max-w-4xl mx-auto">
                
                {/* Live Preview Section */}
                <div className="bg-[#0a0a1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                    <div className="p-4 border-b border-white/5 bg-black/40 flex items-center gap-2 text-gray-400">
                        <Eye size={16} /> <span className="text-xs font-mono tracking-widest uppercase">Live Ribbon Preview</span>
                    </div>
                    
                    {/* Simulated Browser View */}
                    <div className="bg-[#050510] h-48 relative border-t border-white/5">
                        {/* Fake Navbar */}
                        <div className="h-14 border-b border-white/10 flex items-center px-6 gap-4">
                            <div className="w-8 h-8 bg-[#00f5ff]/20 rounded-lg border border-[#00f5ff]/50"></div>
                            <div className="w-24 h-4 bg-white/10 rounded"></div>
                            <div className="w-16 h-4 bg-white/10 rounded ml-auto"></div>
                        </div>

                        {/* RIBBON PREVIEW */}
                        {broadcastActive ? (
                            <div className={`w-full py-2.5 px-4 text-center text-sm font-bold flex items-center justify-center gap-3 transition-colors ${
                                broadcastType === 'info' ? 'bg-[#00ff88] text-black' : 
                                broadcastType === 'warning' ? 'bg-[#ffcc00] text-black' : 
                                'bg-[#ff3333] text-black'
                            }`}>
                                {broadcastType === 'warning' || broadcastType === 'critical' ? (
                                    <AlertTriangle size={18} strokeWidth={2.5} />
                                ) : (
                                    <Megaphone size={18} strokeWidth={2.5} />
                                )}
                                <span>{broadcastMsg || "Your announcement message will appear here..."}</span>
                                {broadcastLink && (
                                    <span className="flex items-center gap-1 underline underline-offset-2 opacity-80 hover:opacity-100 cursor-pointer font-black">
                                        Details <ExternalLink size={14} strokeWidth={2.5}/>
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="absolute inset-0 top-14 flex items-center justify-center text-gray-600 font-mono text-xs border-t border-dashed border-gray-800">
                                [BROADCAST INACTIVE - RIBBON HIDDEN]
                            </div>
                        )}
                    </div>
                </div>

                {/* Configuration Form */}
                <div className="bg-[#0a0a1a]/80 backdrop-blur-xl border border-orange-500/20 p-8 rounded-3xl shadow-[0_0_30px_rgba(249,115,22,0.05)] space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                                <Radio className="text-orange-500" /> SIGNAL_TRANSMITTER
                            </h2>
                            <p className="text-xs text-gray-500 font-mono tracking-widest">Broadcast global notifications to all connected clients.</p>
                        </div>
                        
                        {/* Master Toggle */}
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={broadcastActive} onChange={(e) => setBroadcastActive(e.target.checked)} />
                            <div className="w-14 h-7 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                            <span className="ml-3 text-sm font-bold font-mono text-gray-300 uppercase tracking-widest">{broadcastActive ? 'TRANSMITTING' : 'OFFLINE'}</span>
                        </label>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-mono text-orange-400 uppercase tracking-widest opacity-70 group-focus-within:opacity-100 transition-opacity">Transmission Message</label>
                            <input 
                                value={broadcastMsg} 
                                onChange={(e) => setBroadcastMsg(e.target.value)} 
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-orange-500 text-sm text-white focus:bg-black/60 transition-all" 
                                placeholder="e.g. Scheduled maintenance at 00:00 UTC. System may be temporarily unavailable." 
                                maxLength={120}
                            />
                            <div className="text-right text-[10px] text-gray-500 font-mono">{broadcastMsg.length}/120 chars</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-orange-400 uppercase tracking-widest">Severity Level</label>
                                <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-white/10">
                                    <button onClick={() => setBroadcastType("info")} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${broadcastType === 'info' ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'text-gray-500 hover:text-white'}`}>INFO</button>
                                    <button onClick={() => setBroadcastType("warning")} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${broadcastType === 'warning' ? 'bg-[#ffcc00]/20 text-[#ffcc00]' : 'text-gray-500 hover:text-white'}`}>WARNING</button>
                                    <button onClick={() => setBroadcastType("critical")} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${broadcastType === 'critical' ? 'bg-[#ff3333]/20 text-[#ff3333]' : 'text-gray-500 hover:text-white'}`}>CRITICAL</button>
                                </div>
                            </div>
                            
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-mono text-orange-400 uppercase tracking-widest opacity-70 group-focus-within:opacity-100 transition-opacity">Redirect URL (Optional)</label>
                                <input 
                                    value={broadcastLink} 
                                    onChange={(e) => setBroadcastLink(e.target.value)} 
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-orange-500 text-sm text-white focus:bg-black/60 transition-all font-mono" 
                                    placeholder="https://..." 
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveBroadcast} 
                        disabled={isSavingBroadcast} 
                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-black font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] text-xs tracking-widest mt-6"
                    >
                        {isSavingBroadcast ? <Loader2 className="animate-spin" size={16}/> : <Radio size={16} />}
                        UPDATE TRANSMISSION PROTOCOL
                    </button>
                </div>
            </motion.div>
        )}

      </main>
    </div>
  );
};

export default Admin;