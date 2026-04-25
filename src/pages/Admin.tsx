import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, query, orderBy, onSnapshot, deleteDoc, doc, setDoc, updateDoc, getDocs 
} from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { auth, firestoreDB, loginWithGoogle, logout, rtdb } from "../lib/firebase"; 

import { 
  Lock, Terminal, Clock, Copy, Check, 
  Hash, ShieldCheck, Save, RefreshCw, 
  X, Code, FileJson, CloudLightning, 
  Settings, Loader2, Edit3, ShieldAlert, 
  Search, Users, Activity,
  Database, ChevronUp, MessageSquare, AlertTriangle, Trash2,
  Megaphone, Radio, ExternalLink, Eye, BarChart3, PieChart as PieChartIcon, 
  Download, User as UserIcon, AlignLeft, Send, Github, Trophy, Plus, Calendar, List, UserPlus, UserMinus,
  FileText, CheckCircle2, XCircle, Code2, Construction
} from "lucide-react";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Navbar from '@/components/Navbar';


const CHART_COLORS = ['#38bdf8', '#34d399', '#818cf8', '#fb923c', '#f87171', '#facc15', '#f472b6', '#60a5fa'];

// --- Types ---
interface ReplyType { id: string; authorId: string; authorName: string; authorAvatar: string; content: string; createdAt: number; isAccepted?: boolean; }
interface Post { id: string; title: string; body: string; authorName: string; authorId: string; upvotes: string[]; downvotes?: string[]; replies: ReplyType[]; createdAt: any; }
interface UserActivityData { id: string; email?: string; displayName?: string; lifetimeActiveTimeMins?: number; lastActiveDate?: any; activityUsage?: Record<string, number>; }
interface AdminUser { email: string; added_by: string; created_at: string; }
interface TestCaseData { displayInput: string; rawInput: string; expected: string; explanation: string; isPublic: boolean; hasMultipleAnswers: boolean; imageUrl?: string; }
interface ProblemData { dbId?: string; title: string; description: string; inputFormat: string; outputFormat: string; constraints: string; difficulty: string; testCases: TestCaseData[]; }

interface SubmissionData {
    id: string;
    created_at: string;
    user_uid: string;
    problem_id: string;
    contest_id: string;
    language: string;
    code: string;
    passed: boolean;
    score_awarded: number;
    time_taken_seconds: number;
    problemTitle?: string;
}

const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default"); 
  
  const res = await fetch("https://api.cloudinary.com/v1_1/dmmv8phgq/image/upload", {
    method: "POST",
    body: formData
  });
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url;
};

const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = window.innerWidth; let height = window.innerHeight;
    const handleResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
    window.addEventListener('resize', handleResize); handleResize();

    let particles = Array.from({ length: 60 }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2 }));
    const animate = () => {
      ctx.clearRect(0, 0, width, height); ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1; if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.fillRect(p.x, p.y, 1.5, 1.5);
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x; const dy = p.y - particles[j].y; const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.strokeStyle = `rgba(56, 189, 248, ${0.1 * (1 - dist / 120)})`; ctx.lineWidth = 1; ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    };
    animate(); return () => window.removeEventListener('resize', handleResize);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 bg-[#050505]" />;
};

const COMPLEXITY_PRESETS = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"];

const toLocalDatetime = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
};

// Available modules for Maintenance Lockdown
const SYSTEM_MODULES = [
    { id: '/', name: 'Home' },
    { id: '/compiler', name: 'Compiler' },
    { id: '/visualizer', name: 'Visualizer Dashboard' },
    { id: '/contests', name: 'Contest' },
    { id: '/quiz-panel', name: 'Quiz' },
    { id: '/discussion', name: 'Community' },
    { id: '/docs', name: 'Documentation' },
    { id: '/notes', name: 'AlgoLib Notes' }
];

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"forge" | "contests" | "submissions" | "moderation" | "broadcast" | "insights" | "admins" | "maintenance">("forge");

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [activeCodeTab, setActiveCodeTab] = useState<"java" | "cpp" | "python">("java");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [formData, setFormData] = useState({ id: "", title: "", category: "", timeComplexity: "O(n)", spaceComplexity: "O(1)", description: "", details: "", codeJava: "", codeCpp: "", codePython: "" });

  const [adminPasscode, setAdminPasscode] = useState("");
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);

  // Admin Control States
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [showAddAdminPasscodeModal, setShowAddAdminPasscodeModal] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<string | null>(null);
  const [showRemoveAdminPasscodeModal, setShowRemoveAdminPasscodeModal] = useState(false);
  const [isRemovingAdmin, setIsRemovingAdmin] = useState(false);

  const [contestView, setContestView] = useState<"editor" | "manager">("editor");
  const [cId, setCId] = useState("");
  const [cTitle, setCTitle] = useState("");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const [problems, setProblems] = useState<ProblemData[]>([
      { title: "", description: "", inputFormat: "", outputFormat: "", constraints: "", difficulty: "Easy", testCases: [{ displayInput: "", rawInput: "", expected: "", explanation: "", isPublic: true, hasMultipleAnswers: false, imageUrl: "" }] }
  ]);
  const [existingContests, setExistingContests] = useState<any[]>([]);
  const [isDeployingContest, setIsDeployingContest] = useState(false);

  const [submissionsData, setSubmissionsData] = useState<SubmissionData[]>([]);
  const [selectedSubContest, setSelectedSubContest] = useState<string>("");
  const [subSearchQuery, setSubSearchQuery] = useState("");
  const [isSubsLoading, setIsSubsLoading] = useState(false);
  const [viewingCodeInfo, setViewingCodeInfo] = useState<SubmissionData | null>(null);

  const [jsonOutput, setJsonOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  const [gistConfig, setGistConfig] = useState({ id: "", token: "" });
  const [existingAlgos, setExistingAlgos] = useState<any[]>([]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastType, setBroadcastType] = useState<"info" | "warning" | "critical">("info");
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [broadcastLink, setBroadcastLink] = useState("");
  const [isSavingBroadcast, setIsSavingBroadcast] = useState(false);

  const [siteVisits, setSiteVisits] = useState<number>(0);
  const [insightsData, setInsightsData] = useState<UserActivityData[]>([]);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insightSearchEmail, setInsightSearchEmail] = useState("");

  // Maintenance Control
  const [maintainedRoutes, setMaintainedRoutes] = useState<string[]>([]);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem("algolib_gist_config");
    if(savedConfig) setGistConfig(JSON.parse(savedConfig));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch('/.netlify/functions/get-admins', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let validEmails: string[] = [];
            if (response.ok) {
                const data = await response.json();
                validEmails = data.map((d: any) => d.email);
            }
            const fallbackAdmins = ["prateeksinghrajawat2006@gmail.com", "shivanshmax@gmail.com"];
            setIsAdmin(validEmails.includes(currentUser.email) || fallbackAdmins.includes(currentUser.email));
        } catch (e) {
            console.error("Failed to authenticate admin status:", e);
            setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin && (activeTab === "admins" || activeTab === "submissions" || activeTab === "contests")) {
      if (activeTab === "admins") loadAdminsList();
      if (existingContests.length === 0) loadContestsListSilent();
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (activeTab === "submissions" && selectedSubContest) {
        fetchSubmissions();
    } else if (activeTab === "submissions" && !selectedSubContest) {
        setSubmissionsData([]);
    }
  }, [activeTab, selectedSubContest]);

  const loadContestsListSilent = async () => {
    try {
        const response = await fetch('/.netlify/functions/get-contests');
        if (response.ok) {
            const data = await response.json();
            setExistingContests(data);
        }
    } catch(e) {}
  };

  const fetchSubmissions = async () => {
      setIsSubsLoading(true);
      try {
          const token = await user?.getIdToken();
          const response = await fetch(`/.netlify/functions/get-contest-submissions?contest_id=${selectedSubContest}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
             const mappedSubs = await response.json();
             setSubmissionsData(mappedSubs);
          }
      } catch (err) {
          console.error("Error fetching submissions:", err);
      } finally {
          setIsSubsLoading(false);
      }
  };

  const loadAdminsList = async () => {
      try {
          const token = await user?.getIdToken();
          const response = await fetch('/.netlify/functions/get-admins', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
              const data = await response.json();
              setAdminsList(data);
          }
      } catch(e) {}
  };

  useEffect(() => {
    if (!isAdmin) return;
    const qPosts = query(collection(firestoreDB, "community_posts"), orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post))));
    
    const unsubBroadcast = onSnapshot(doc(firestoreDB, "system_settings", "announcement"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setBroadcastMsg(data.message || ""); setBroadcastType(data.type || "info");
            setBroadcastActive(data.active || false); setBroadcastLink(data.link || "");
        }
    });

    const unsubMaintenance = onSnapshot(doc(firestoreDB, "system_settings", "maintenance"), (docSnap) => {
        if (docSnap.exists()) {
            setMaintainedRoutes(docSnap.data().activeRoutes || []);
        }
    });

    const statsRef = ref(rtdb, 'site_stats/visits');
    const unsubStats = onValue(statsRef, (snapshot) => {
        const visits = snapshot.val();
        setSiteVisits(visits !== null ? visits : 0);
    });

    return () => { unsubPosts(); unsubBroadcast(); unsubStats(); unsubMaintenance(); };
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === "insights" && isAdmin && insightsData.length === 0) {
      const fetchInsights = async () => {
        setIsInsightsLoading(true);
        try {
          const querySnapshot = await getDocs(collection(firestoreDB, "users"));
          const users = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const parsedActivityUsage: Record<string, number> = {};
            Object.keys(data).forEach(key => { if (key.startsWith('activityUsage.')) { parsedActivityUsage[key.replace('activityUsage.', '')] = data[key]; } });
            if (data.activityUsage && typeof data.activityUsage === 'object') Object.assign(parsedActivityUsage, data.activityUsage);
            return { id: doc.id, email: data.email, displayName: data.displayName, lifetimeActiveTimeMins: data.lifetimeActiveTimeMins || 0, lastActiveDate: data.lastActiveDate, activityUsage: parsedActivityUsage } as UserActivityData;
          });
          setInsightsData(users);
        } catch (error) { console.error(error); } finally { setIsInsightsLoading(false); }
      };
      fetchInsights();
    }
  }, [activeTab, isAdmin, insightsData.length]);

  const aggregatedActivityData = useMemo(() => {
      const totals: Record<string, number> = {}; let totalPlatformMinutes = 0;
      insightsData.forEach(user => { if (user.activityUsage) { Object.entries(user.activityUsage).forEach(([activity, minutes]) => { if(typeof minutes === 'number') { totals[activity] = (totals[activity] || 0) + minutes; totalPlatformMinutes += minutes; } }); } });
      const sorted = Object.entries(totals).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) })).sort((a, b) => b.value - a.value);
      return { chartData: sorted.slice(0, 10), totalPlatformMinutes: Number(totalPlatformMinutes.toFixed(2)), totalUsersWithData: insightsData.filter(u => u.lifetimeActiveTimeMins && u.lifetimeActiveTimeMins > 0).length };
  }, [insightsData]);

  const searchedUserStats = useMemo(() => {
      if (!insightSearchEmail.trim()) return null;
      return insightsData.find(u => u.email?.toLowerCase().includes(insightSearchEmail.toLowerCase()));
  }, [insightSearchEmail, insightsData]);

  const exportInsightsToCSV = () => {
      if (insightsData.length === 0) return;
      let csvContent = "UserID,Email,DisplayName,TotalActiveTimeMins,LastActive,ActivityBreakdown\n";
      insightsData.forEach(user => {
          const date = user.lastActiveDate?.toDate ? user.lastActiveDate.toDate().toISOString() : "N/A";
          const activities = user.activityUsage && Object.keys(user.activityUsage).length > 0 ? Object.entries(user.activityUsage).map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(2) : v}m`).join(' | ') : "No specific route data";
          csvContent += [`"${user.id}"`, `"${user.email || 'N/A'}"`, `"${user.displayName || 'N/A'}"`, `"${user.lifetimeActiveTimeMins?.toFixed(2) || 0}"`, `"${date}"`, `"${activities}"`].join(",") + "\n";
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", `algolib_insights_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  const handleSaveBroadcast = async () => {
    setIsSavingBroadcast(true);
    try {
        await setDoc(doc(firestoreDB, "system_settings", "announcement"), { message: broadcastMsg, type: broadcastType, active: broadcastActive, link: broadcastLink, updatedAt: new Date() });
        setStatusMsg("Broadcast Status Updated"); setTimeout(() => setStatusMsg(""), 3000);
    } catch (error) { alert("Failed to update broadcast settings."); } finally { setIsSavingBroadcast(false); }
  };

  const toggleMaintenanceRoute = (routeId: string) => {
      if (maintainedRoutes.includes(routeId)) {
          setMaintainedRoutes(prev => prev.filter(r => r !== routeId));
      } else {
          setMaintainedRoutes(prev => [...prev, routeId]);
      }
  };

  const handleSaveMaintenance = async () => {
      setIsSavingMaintenance(true);
      try {
          await setDoc(doc(firestoreDB, "system_settings", "maintenance"), { activeRoutes: maintainedRoutes, updatedAt: new Date() });
          setStatusMsg("Lockdown Config Updated"); 
          setTimeout(() => setStatusMsg(""), 3000);
      } catch (err) { alert("Failed to update lockdown settings."); } 
      finally { setIsSavingMaintenance(false); }
  };

  const handleAddAdminClick = () => {
      if (!newAdminEmail || !newAdminEmail.includes('@')) return alert("Valid email required.");
      setAdminPasscode("");
      setShowAddAdminPasscodeModal(true);
  };

  const executeAddAdmin = async () => {
      if (!adminPasscode) return;
      setShowAddAdminPasscodeModal(false);
      setIsAddingAdmin(true);

      try {
          const token = await user?.getIdToken();
          const response = await fetch('/.netlify/functions/manage-admins', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'add', passcode: adminPasscode, email_to_add: newAdminEmail.toLowerCase() })
          });
          const data = await response.json();
          
          if (!response.ok) {
              if (data.error && data.error.includes("already an admin")) throw new Error("User is already an admin!");
              if (data.error && data.error.includes("Unauthorized Passcode")) throw new Error("Unauthorized Passcode");
              throw new Error(data.error || "Failed to add admin");
          }

          setStatusMsg("New Admin Granted Access!");
          setNewAdminEmail("");
          setTimeout(() => setStatusMsg(""), 3000);
          
          loadAdminsList(); 
      } catch (err: any) {
          if (err.message === "Unauthorized Passcode") {
              setShowUnauthorizedModal(true);
          } else {
              alert(err.message);
          }
      } finally {
          setIsAddingAdmin(false);
          setAdminPasscode("");
      }
  };

  const handleRemoveAdminClick = (email: string) => {
      setAdminToRemove(email);
      setAdminPasscode("");
      setShowRemoveAdminPasscodeModal(true);
  };

  const executeRemoveAdmin = async () => {
      if (!adminPasscode || !adminToRemove) return;
      setShowRemoveAdminPasscodeModal(false);
      setIsRemovingAdmin(true);

      try {
          const token = await user?.getIdToken();
          const response = await fetch('/.netlify/functions/manage-admins', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'remove', passcode: adminPasscode, email_to_remove: adminToRemove })
          });
          const data = await response.json();
          
          if (!response.ok) {
              if (data.error && data.error.includes("Unauthorized Passcode")) throw new Error("Unauthorized Passcode");
              throw new Error(data.error || "Operation failed");
          }

          setStatusMsg("Admin Privileges Revoked!");
          setTimeout(() => setStatusMsg(""), 3000);
          
          loadAdminsList(); 
      } catch (err: any) {
          if (err.message.includes("Unauthorized Passcode")) {
              setShowUnauthorizedModal(true);
          } else {
              alert(err.message || "Operation failed.");
          }
      } finally {
          setIsRemovingAdmin(false);
          setAdminPasscode("");
          setAdminToRemove(null);
      }
  };

  const fetchFromGist = async () => {
    if(!gistConfig.id) return alert("Configure Gist ID"); setIsLoading(true);
    try {
        const response = await fetch(`https://api.github.com/gists/${gistConfig.id}`);
        const data = await response.json();
        if(data.files["algorithms.json"]?.content) { const parsed = JSON.parse(data.files["algorithms.json"].content); setExistingAlgos(parsed); return parsed; }
    } catch (error) { alert("Failed to fetch Gist."); } finally { setIsLoading(false); }
  };

  const loadAlgorithm = (algo: any) => {
      setFormData({ id: algo.id||"", title: algo.title||"", category: algo.category||"", timeComplexity: algo.timeComplexity||"O(n)", spaceComplexity: algo.spaceComplexity||"O(1)", description: algo.description||"", details: algo.details||"", codeJava: algo.codeJava||"", codeCpp: algo.codeCpp||"", codePython: algo.codePython||"" });
      setTags(algo.tags || []); setMode("edit"); setShowLoadModal(false); setStatusMsg(`Loaded: ${algo.title}`); setTimeout(() => setStatusMsg(""), 3000);
  };

  const saveToGist = async () => {
      if(!gistConfig.token) return alert("Configure Token."); if(!formData.id || !formData.title) return alert("ID and Title required."); setIsLoading(true);
      try {
          const currentData = await fetchFromGist(); if(!currentData) return;
          let newData = [...currentData]; const newEntry = { ...formData, tags };
          if (mode === "edit") { const index = newData.findIndex((a: any) => a.id === formData.id); if(index !== -1) newData[index] = newEntry; else newData.push(newEntry); } 
          else { if(newData.find((a: any) => a.id === formData.id)) { alert("ID exists!"); setIsLoading(false); return; } newData.push(newEntry); }
          const res = await fetch(`https://api.github.com/gists/${gistConfig.id}`, { method: "PATCH", headers: { "Authorization": `Bearer ${gistConfig.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ files: { "algorithms.json": { content: JSON.stringify(newData, null, 2) } } }) });
          if(res.ok) { setStatusMsg("Database Synced"); setTimeout(() => setStatusMsg(""), 5000); }
      } catch (error) { alert("Save failed."); } finally { setIsLoading(false); }
  };

  const handlePurge = () => { setFormData({ id: "", title: "", category: "", timeComplexity: "O(n)", spaceComplexity: "O(1)", description: "", details: "", codeJava: "", codeCpp: "", codePython: "" }); setTags([]); setJsonOutput(""); setMode("create"); setShowPurgeModal(false); setStatusMsg("Workspace Purged"); setTimeout(() => setStatusMsg(""), 2000); };
  const addTag = (e: React.KeyboardEvent) => { if (e.key === "Enter" && tagInput.trim() !== "") { e.preventDefault(); if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]); setTagInput(""); } };
  const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t));
  const generateJSON = () => { setJsonOutput(JSON.stringify({ ...formData, tags }, null, 2)); };

  const loadContestsManager = async () => {
    setContestView("manager");
    try {
        const response = await fetch('/.netlify/functions/get-contests');
        if (response.ok) {
            const data = await response.json();
            setExistingContests(data);
        }
    } catch(e) {}
  };

  const resetContestEditor = () => {
    setCId(""); setCTitle(""); setCStart(""); setCEnd("");
    setProblems([{ title: "", description: "", inputFormat: "", outputFormat: "", constraints: "", difficulty: "Easy", testCases: [{ displayInput: "", rawInput: "", expected: "", explanation: "", isPublic: true, hasMultipleAnswers: false, imageUrl: "" }] }]);
    setContestView("editor");
  };

  const handleEditContest = async (contest: any) => {
      setStatusMsg("Loading Contest Data...");
      setCId(contest.id);
      setCTitle(contest.title);
      setCStart(toLocalDatetime(contest.start_time));
      setCEnd(toLocalDatetime(contest.end_time));
      
      const response = await fetch(`/.netlify/functions/get-contest-details?id=${contest.id}`);
      if (response.ok) {
          const { problems: pData, testCases: tcData } = await response.json();
          if (pData && pData.length > 0) {
              const loadedProblems: ProblemData[] = [];
              for (const p of pData) {
                  const pTcs = tcData.filter((tc: any) => tc.problem_id === p.id);
                  const formattedTcs = (pTcs || []).map((tc: any) => ({
                      displayInput: tc.display_input || "", 
                      rawInput: tc.raw_input || "", 
                      expected: tc.expected_output || "",
                      explanation: tc.explanation || "", 
                      isPublic: tc.is_public,
                      hasMultipleAnswers: tc.has_multiple_answers || false,
                      imageUrl: tc.image_url || ""
                  }));

                  let descObj = { description: p.description, inputFormat: "", outputFormat: "", constraints: "" };
                  try {
                      const parsed = JSON.parse(p.description);
                      if (parsed.description !== undefined) {
                          descObj = parsed;
                      }
                  } catch (e) { }

                  loadedProblems.push({
                      dbId: p.id, title: p.title, difficulty: p.difficulty,
                      description: descObj.description,
                      inputFormat: descObj.inputFormat,
                      outputFormat: descObj.outputFormat,
                      constraints: descObj.constraints,
                      testCases: formattedTcs.length > 0 ? formattedTcs : [{ displayInput: "", rawInput: "", expected: "", explanation: "", isPublic: true, hasMultipleAnswers: false, imageUrl: "" }]
                  });
              }
              setProblems(loadedProblems);
          } else {
              setProblems([{ title: "", description: "", inputFormat: "", outputFormat: "", constraints: "", difficulty: "Easy", testCases: [{ displayInput: "", rawInput: "", expected: "", explanation: "", isPublic: true, hasMultipleAnswers: false, imageUrl: "" }] }]);
          }
      }
      setContestView("editor");
      setStatusMsg("");
  };

  const handleDeleteContest = async (id: string) => {
      if(!window.confirm("CRITICAL: Delete this contest? All related problems and test cases will be permanently destroyed.")) return;
      try {
        setStatusMsg("Erasing dependent records...");
        const token = await user?.getIdToken();
        const response = await fetch(`/.netlify/functions/manage-contest?id=${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Delete failed");
        
        setExistingContests(prev => prev.filter(c => c.id !== id));
        setStatusMsg("Contest Eradicated Successfully");
        setTimeout(() => setStatusMsg(""), 3000);
      } catch (err: any) {
        alert("Delete Failed: " + err.message);
        setStatusMsg("");
      }
  };

  const handleDeployContest = async () => {
    if (!cTitle || !cStart || !cEnd || problems.length === 0) return alert("Please fill out Contest Title and Time bounds.");
    for (let p of problems) if (!p.title || !p.description) return alert("Every problem must have a Title and Description.");
    
    setIsDeployingContest(true);
    setStatusMsg("Deploying Multi-Tier Contest...");
    
    try {
        const token = await user?.getIdToken();
        const response = await fetch('/.netlify/functions/manage-contest', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cId, cTitle, cStart: new Date(cStart).toISOString(), cEnd: new Date(cEnd).toISOString(), problems
            })
        });
        if (!response.ok) throw new Error("Deployment failed");
      
        setStatusMsg("Contest Deployed to Matrix!");
        setTimeout(() => setStatusMsg(""), 4000);
    } catch (err: any) {
      alert("Deployment Failed: " + err.message);
      setStatusMsg("");
    } finally {
      setIsDeployingContest(false);
    }
  };

  const addProblem = () => setProblems([...problems, { title: "", description: "", inputFormat: "", outputFormat: "", constraints: "", difficulty: "Easy", testCases: [{ displayInput: "", rawInput: "", expected: "", explanation: "", isPublic: true, hasMultipleAnswers: false, imageUrl: "" }] }]);
  const removeProblem = (pIndex: number) => { if (problems.length > 1) setProblems(problems.filter((_, i) => i !== pIndex)); };
  const updateProblem = (pIndex: number, field: string, value: any) => { const newP = [...problems]; newP[pIndex] = { ...newP[pIndex], [field]: value }; setProblems(newP); };
  const addTestCase = (pIndex: number) => { const newP = [...problems]; newP[pIndex].testCases.push({ displayInput: "", rawInput: "", expected: "", explanation: "", isPublic: false, hasMultipleAnswers: false, imageUrl: "" }); setProblems(newP); };
  const removeTestCase = (pIndex: number, tcIndex: number) => { const newP = [...problems]; newP[pIndex].testCases = newP[pIndex].testCases.filter((_, i) => i !== tcIndex); setProblems(newP); };
  const updateTestCase = (pIndex: number, tcIndex: number, field: string, value: any) => { const newP = [...problems]; newP[pIndex].testCases[tcIndex] = { ...newP[pIndex].testCases[tcIndex], [field]: value }; setProblems(newP); };

  const handleDeletePost = async (postId: string) => { if (!window.confirm("Delete post?")) return; setIsDeleting(postId); try { await deleteDoc(doc(firestoreDB, "community_posts", postId)); } catch (e) { alert("Failed."); } finally { setIsDeleting(null); } };
  const handleDeleteReply = async (postId: string, replyId: string) => { if (!window.confirm("Delete reply?")) return; setIsDeleting(`reply-${replyId}`); try { const post = posts.find(p => p.id === postId); if (!post || !post.replies) return; await updateDoc(doc(firestoreDB, "community_posts", postId), { replies: post.replies.filter(r => r.id !== replyId) }); } catch (e) { alert("Failed."); } finally { setIsDeleting(null); } };

  if (isAuthLoading) return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-zinc-400 gap-4"><Loader2 size={32} className="animate-spin text-sky-400" /><p className="text-sm font-medium tracking-wide">Authenticating Session...</p></div>;
  if (!user) return (<div className="min-h-screen flex items-center justify-center p-4 relative bg-[#050505]"><NeuralBackground /><div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 text-center relative z-10 w-full max-w-sm"><div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5"><Lock className="text-sky-400" size={28} /></div><h2 className="text-2xl font-bold text-white mb-2">Admin Portal</h2><button onClick={loginWithGoogle} className="w-full bg-white text-black py-3 rounded-xl text-sm font-medium mt-6">Continue with Google</button></div></div>);
  if (user && !isAdmin) return (<div className="min-h-screen flex items-center justify-center p-4 relative bg-[#050505]"><NeuralBackground /><div className="bg-black/40 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center w-full max-w-sm relative z-10"><ShieldAlert className="text-red-400 mx-auto mb-4" size={32} /><h2 className="text-xl font-bold text-white mb-2">Access Denied</h2><button onClick={logout} className="w-full bg-zinc-900 border border-white/10 text-white py-3 rounded-xl text-sm font-medium mt-4">Sign Out</button></div></div>);

  const filteredPosts = posts.filter(post => post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.authorName.toLowerCase().includes(searchQuery.toLowerCase()) || post.body.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPosts = posts.length;
  const totalReplies = posts.reduce((acc, post) => acc + (post.replies?.length || 0), 0);
  const totalInteractions = posts.reduce((acc, post) => acc + (post.upvotes?.length || 0) + (post.downvotes?.length || 0), 0) + totalReplies;

  const filteredSubmissions = submissionsData.filter(s => 
      s.user_uid.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
      s.problemTitle?.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
      s.language.toLowerCase().includes(subSearchQuery.toLowerCase())
  );

  const inputClass = "w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 text-sm text-zinc-200 transition-all placeholder:text-zinc-600";
  const labelClass = "text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 block";

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 font-sans selection:bg-sky-500/30 overflow-x-hidden">
      <NeuralBackground />
      <Navbar />
      
      <AnimatePresence>
        
        {/* Modals omitted for brevity - Keep all your original modals here: Code Viewer, Purge, Config, Load, Passcodes, etc */}
        {viewingCodeInfo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="w-full max-w-4xl max-h-[85vh] bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-zinc-900/50">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Code2 size={20} className="text-purple-400"/> Submission Source</h3>
                            <p className="text-xs text-zinc-400 mt-1">{viewingCodeInfo.problemTitle} • User: {viewingCodeInfo.user_uid.substring(0, 8)}... • Lang: {viewingCodeInfo.language}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { navigator.clipboard.writeText(viewingCodeInfo.code); setStatusMsg("Code Copied!"); setTimeout(()=>setStatusMsg(""), 2000); }} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Copy Source"><Copy size={18}/></button>
                            <button onClick={() => setViewingCodeInfo(null)} className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"><X size={18}/></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto bg-[#0a0a0a] p-6 custom-scrollbar">
                        <pre className="font-mono text-xs md:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{viewingCodeInfo.code}</pre>
                    </div>
                </motion.div>
            </motion.div>
        )}
        
        {/* Purge Modal */}
        {showPurgeModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl">
                    <div className="flex flex-col items-center text-center mb-6"><div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500"><AlertTriangle size={24} /></div><h3 className="text-lg font-bold text-white mb-2">Reset Workspace?</h3><p className="text-sm text-zinc-400">This will clear all current inputs. Cannot be undone.</p></div>
                    <div className="flex gap-3"><button onClick={() => setShowPurgeModal(false)} className="flex-1 py-2.5 bg-zinc-900 border border-white/5 rounded-xl text-sm font-medium text-white">Cancel</button><button onClick={handlePurge} className="flex-1 py-2.5 bg-red-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-red-500/20">Confirm Reset</button></div>
                </motion.div>
            </motion.div>
        )}

        {/* Config Modal */}
        {showConfigModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5"><h3 className="text-lg font-semibold text-white flex items-center gap-2"><Github size={18} className="text-zinc-400"/> Repository Settings</h3><button onClick={() => setShowConfigModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={16} className="text-zinc-500"/></button></div>
                    <div className="space-y-5">
                        <div><label className={labelClass}>Gist ID Reference</label><input value={gistConfig.id} onChange={(e) => setGistConfig({...gistConfig, id: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Personal Access Token</label><input type="password" value={gistConfig.token} onChange={(e) => setGistConfig({...gistConfig, token: e.target.value})} className={inputClass} /></div>
                        <button onClick={() => { localStorage.setItem("algolib_gist_config", JSON.stringify(gistConfig)); setShowConfigModal(false); setStatusMsg("Credentials Saved"); setTimeout(() => setStatusMsg(""), 2000); }} className="w-full py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 mt-4">Save Configuration</button>
                    </div>
                </motion.div>
            </motion.div>
        )}

        {/* Load Modal */}
        {showLoadModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl h-[70vh] bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5"><h3 className="text-lg font-semibold text-white flex items-center gap-2"><CloudLightning size={18} className="text-sky-400"/> Database Query</h3><button onClick={() => setShowLoadModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={16} className="text-zinc-500"/></button></div>
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center flex-col gap-4 text-zinc-400"><Loader2 className="animate-spin text-sky-400" size={32} /><span className="text-sm">Fetching records...</span></div>
                    ) : (
                        <div className="flex-1 overflow-auto custom-scrollbar space-y-2 pr-2">
                             {existingAlgos.length === 0 && <div className="text-center text-zinc-500 py-10 text-sm">No records found.</div>}
                             {existingAlgos.map((algo) => (
                                 <div key={algo.id} onClick={() => loadAlgorithm(algo)} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-sky-500/30 hover:bg-sky-500/5 cursor-pointer transition-all flex items-center justify-between group">
                                     <div><h4 className="font-medium text-zinc-200 group-hover:text-white mb-1">{algo.title}</h4><div className="flex items-center gap-3 text-[11px] text-zinc-500"><span className="flex items-center gap-1"><Hash size={10} /> {algo.id}</span><span className="flex items-center gap-1"><Clock size={10}/> {algo.timeComplexity}</span></div></div>
                                     <div className="p-2 rounded-full bg-white/5 text-zinc-400 group-hover:bg-sky-500/10 group-hover:text-sky-400 transition-colors"><Edit3 size={16} /></div>
                                 </div>
                             ))}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        )}

        {/* Add New Admin Passcode Modal */}
        {showAddAdminPasscodeModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                    <div className="flex flex-col items-center text-center mb-6 relative z-10"><div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-4 shadow-inner"><ShieldCheck size={24} className="text-emerald-400" /></div><h3 className="text-xl font-bold text-white mb-1">Verify Identity</h3><p className="text-xs text-zinc-400">Enter master passcode to grant system access.</p></div>
                    <div className="space-y-5 relative z-10">
                        <div><input type="password" value={adminPasscode} onChange={(e) => setAdminPasscode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeAddAdmin()} placeholder="••••••••" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3.5 text-center text-xl tracking-[0.3em] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" autoFocus /></div>
                        <div className="flex gap-3"><button onClick={() => setShowAddAdminPasscodeModal(false)} className="flex-1 py-3 bg-zinc-900 border border-white/5 rounded-xl text-sm font-medium text-zinc-300">Cancel</button><button onClick={executeAddAdmin} disabled={!adminPasscode || isAddingAdmin} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2">{isAddingAdmin ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Grant</button></div>
                    </div>
                </motion.div>
            </motion.div>
        )}

        {/* Remove Admin Passcode Modal */}
        {showRemoveAdminPasscodeModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                    <div className="flex flex-col items-center text-center mb-6 relative z-10"><div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-4 shadow-inner"><UserMinus size={24} className="text-red-400" /></div><h3 className="text-xl font-bold text-white mb-1">Revoke Access</h3><p className="text-xs text-zinc-400">Enter master passcode to remove <strong>{adminToRemove}</strong>.</p></div>
                    <div className="space-y-5 relative z-10">
                        <div><input type="password" value={adminPasscode} onChange={(e) => setAdminPasscode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeRemoveAdmin()} placeholder="••••••••" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3.5 text-center text-xl tracking-[0.3em] text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all" autoFocus /></div>
                        <div className="flex gap-3"><button onClick={() => setShowRemoveAdminPasscodeModal(false)} className="flex-1 py-3 bg-zinc-900 border border-white/5 rounded-xl text-sm font-medium text-zinc-300">Cancel</button><button onClick={executeRemoveAdmin} disabled={!adminPasscode || isRemovingAdmin} className="flex-1 py-3 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-black rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-center justify-center gap-2">{isRemovingAdmin ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Revoke</button></div>
                    </div>
                </motion.div>
            </motion.div>
        )}

        {/* Security Breach / Unauthorized Modal */}
        {showUnauthorizedModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-950 border border-red-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
                    <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Unauthorized Access</h2>
                    <p className="text-zinc-400 mb-6 text-sm">Invalid admin passcode detected. For security reasons, your session will now be terminated.</p>
                    <button onClick={async () => { setShowUnauthorizedModal(false); await logout(); }} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)] tracking-wide">Retry</button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-28 pb-20 px-6 container mx-auto max-w-7xl relative z-10">
        
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div>
               <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Admin Console</h1>
               <p className="text-sm text-zinc-400">Manage data structures, contests, moderation, and telemetry.</p>
           </div>
           
           <div className="flex items-center gap-4 bg-zinc-900/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-sm">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                 <span className="text-xs font-medium text-zinc-300 hidden sm:block">{user?.email}</span>
               </div>
               <div className="w-px h-4 bg-white/10 hidden sm:block"></div>
               <button onClick={logout} className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">Sign out</button>
           </div>
        </div>

        <div className="flex overflow-x-auto custom-scrollbar mb-8 bg-zinc-900/30 p-1.5 rounded-2xl border border-white/5 w-fit">
            {[ 
                { id: 'forge', label: 'Data Forge', icon: Code }, 
                { id: 'contests', label: 'Contest Forge', icon: Trophy }, 
                { id: 'submissions', label: 'Submissions', icon: FileText }, 
                { id: 'moderation', label: 'Moderation', icon: ShieldCheck }, 
                { id: 'broadcast', label: 'Broadcast', icon: Radio }, 
                { id: 'insights', label: 'Insights', icon: BarChart3 }, 
                { id: 'admins', label: 'Access Control', icon: UserPlus },
                { id: 'maintenance', label: 'Lockdown', icon: Construction }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <tab.icon size={16} />{tab.label}
              </button>
            ))}
        </div>

        {/* ========================================== */}
        {/* TABS 1 TO 7 REMAIN IDENTICAL TO BEFORE     */}
        {/* ========================================== */}

        {/* ... All existing tabs remain here. I am keeping the code exact ... */}
        {activeTab === "forge" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/50 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${mode === 'create' ? 'bg-sky-500/10 text-sky-400' : 'bg-orange-500/10 text-orange-400'}`}>
                            {mode} Mode
                        </span>
                        {statusMsg && <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium"><Check size={14}/> {statusMsg}</span>}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowConfigModal(true)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Repository Settings"><Settings size={16} /></button>
                        <button onClick={() => { fetchFromGist().then((data) => { if(data) setShowLoadModal(true); }); }} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 text-zinc-200 hover:bg-white/10 rounded-xl transition-all text-xs font-semibold">
                            <CloudLightning size={14} className="text-sky-400" /> Fetch DB
                        </button>
                        <button onClick={() => setShowPurgeModal(true)} className="p-2 bg-white/5 border border-white/5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all" title="Clear Form"><RefreshCw size={16} /></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
                    <div className="space-y-8 bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-lg">
                        
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/5"><Database size={16} className="text-sky-400"/> Metadata</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div><label className={labelClass}>Protocol ID</label><div className="relative"><Hash size={16} className="absolute left-4 top-3.5 text-zinc-500" /><input disabled={mode === 'edit'} value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} className={`${inputClass} pl-11 ${mode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="algo_unique_id" /></div></div>
                              <div><label className={labelClass}>Category</label><input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className={inputClass} placeholder="e.g. Dynamic Programming" /></div>
                          </div>
                          <div><label className={labelClass}>Algorithm Title</label><input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className={`${inputClass} text-base font-medium`} placeholder="e.g. Dijkstra's Shortest Path" /></div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/5"><Activity size={16} className="text-purple-400"/> Complexity & Categorization</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div>
                                  <label className={labelClass}>Time Complexity</label>
                                  <div className="flex gap-2 mb-2 overflow-x-auto pb-1 custom-scrollbar">{COMPLEXITY_PRESETS.map(c => (<button key={c} onClick={() => setFormData({...formData, timeComplexity: c})} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-medium text-zinc-400 hover:text-white hover:bg-white/10 whitespace-nowrap">{c}</button>))}</div>
                                  <input value={formData.timeComplexity} onChange={(e) => setFormData({...formData, timeComplexity: e.target.value})} className={inputClass} />
                              </div>
                              <div><label className={labelClass}>Space Complexity</label><div className="h-[30px] w-full"></div><input value={formData.spaceComplexity} onChange={(e) => setFormData({...formData, spaceComplexity: e.target.value})} className={inputClass} /></div>
                          </div>
                          <div>
                              <label className={labelClass}>Tags</label>
                              <div className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 flex flex-wrap gap-2 transition-all min-h-[52px] focus-within:border-sky-500/50 focus-within:ring-2 focus-within:ring-sky-500/20">
                                  {tags.map(tag => (<span key={tag} className="flex items-center gap-1.5 bg-zinc-800 text-zinc-200 px-2.5 py-1 rounded-md text-xs font-medium border border-white/5">{tag} <X size={12} className="cursor-pointer hover:text-red-400 transition-colors" onClick={() => removeTag(tag)} /></span>))}
                                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder={tags.length === 0 ? "Type and press Enter..." : ""} className="bg-transparent outline-none flex-1 text-sm text-zinc-200 min-w-[120px] placeholder:text-zinc-600" />
                              </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/5"><AlignLeft size={16} className="text-emerald-400"/> Documentation</h3>
                          <div className="space-y-6">
                              <div><label className={labelClass}>Description Summary</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} className={`${inputClass} resize-none leading-relaxed`} placeholder="Brief summary of the algorithm..." /></div>
                              <div><label className={labelClass}>Detailed Content (Markdown Supported)</label><textarea value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})} rows={6} className={`${inputClass} resize-y custom-scrollbar leading-relaxed font-mono text-xs`} placeholder="In-depth explanation, steps, edge cases..." /></div>
                          </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between border-b border-white/5 pb-0 mb-4">
                                <h3 className="text-sm font-semibold text-white pb-4 flex items-center gap-2"><Code size={16} className="text-rose-400"/> Implementation</h3>
                                <div className="flex gap-1 px-1 pt-1">
                                    <button onClick={() => setActiveCodeTab("java")} className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${activeCodeTab === 'java' ? 'bg-zinc-950 text-white border-t border-l border-r border-white/10' : 'text-zinc-500 hover:text-zinc-300 border-t border-l border-r border-transparent'}`}>Java</button>
                                    <button onClick={() => setActiveCodeTab("cpp")} className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${activeCodeTab === 'cpp' ? 'bg-zinc-950 text-white border-t border-l border-r border-white/10' : 'text-zinc-500 hover:text-zinc-300 border-t border-l border-r border-transparent'}`}>C++</button>
                                    <button onClick={() => setActiveCodeTab("python")} className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${activeCodeTab === 'python' ? 'bg-zinc-950 text-white border-t border-l border-r border-white/10' : 'text-zinc-500 hover:text-zinc-300 border-t border-l border-r border-transparent'}`}>Python</button>
                                </div>
                            </div>
                            <div className="relative">
                                {activeCodeTab === 'java' && <textarea value={formData.codeJava} onChange={(e) => setFormData({...formData, codeJava: e.target.value})} rows={12} className="w-full bg-zinc-950 border border-white/10 rounded-b-xl rounded-tl-xl px-4 py-4 outline-none focus:ring-2 focus:ring-white/10 text-xs font-mono text-zinc-300 leading-relaxed custom-scrollbar transition-all" placeholder="// Java Implementation..." />}
                                {activeCodeTab === 'cpp' && <textarea value={formData.codeCpp} onChange={(e) => setFormData({...formData, codeCpp: e.target.value})} rows={12} className="w-full bg-zinc-950 border border-white/10 rounded-b-xl rounded-tl-xl px-4 py-4 outline-none focus:ring-2 focus:ring-white/10 text-xs font-mono text-zinc-300 leading-relaxed custom-scrollbar transition-all" placeholder="// C++ Implementation..." />}
                                {activeCodeTab === 'python' && <textarea value={formData.codePython} onChange={(e) => setFormData({...formData, codePython: e.target.value})} rows={12} className="w-full bg-zinc-950 border border-white/10 rounded-b-xl rounded-tl-xl px-4 py-4 outline-none focus:ring-2 focus:ring-white/10 text-xs font-mono text-zinc-300 leading-relaxed custom-scrollbar transition-all" placeholder="# Python Implementation..." />}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 mt-6">
                            <button onClick={generateJSON} className="flex-1 py-3.5 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"><FileJson size={16} className="text-zinc-400" /> Compile JSON</button>
                            <button onClick={saveToGist} disabled={isLoading} className={`flex-1 py-3.5 font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-sm ${mode === 'edit' ? 'bg-white text-black hover:bg-zinc-200' : 'bg-sky-500 hover:bg-sky-400 text-black'}`}>
                                {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />} {mode === 'edit' ? 'Update Entry' : 'Publish Entry'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col h-[800px] shadow-lg relative lg:sticky lg:top-32">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                            <div className="flex items-center gap-2"><Terminal size={16} className="text-zinc-400" /><span className="text-xs font-semibold text-white uppercase tracking-wider">Output Stream</span></div>
                            {jsonOutput && <button onClick={() => { navigator.clipboard.writeText(jsonOutput); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-3 py-1.5 rounded-lg bg-white/5 text-zinc-300 text-xs font-medium border border-white/5 hover:bg-white/10 transition-all flex items-center gap-2">{copied ? <Check size={12} className="text-emerald-400"/> : <Copy size={12}/>} {copied ? "Copied" : "Copy"}</button>}
                        </div>
                        <div className="flex-1 bg-[#0a0a0a] rounded-xl border border-white/5 p-6 overflow-auto custom-scrollbar font-mono text-[11px] leading-relaxed shadow-inner">
                            {jsonOutput ? <pre className="text-zinc-300 whitespace-pre-wrap">{jsonOutput}</pre> : <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-zinc-600"><Code size={32} className="opacity-20" /><p className="text-xs font-medium max-w-[200px]">Compiled JSON preview will appear here.</p></div>}
                        </div>
                    </div>
                </div>
            </motion.div>
        )}

        {activeTab === "contests" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
            
            <div className="flex items-center justify-between bg-zinc-900/50 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
                <div className="flex gap-2">
                    <button onClick={resetContestEditor} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${contestView === 'editor' ? 'bg-purple-500 text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>Create / Edit</button>
                    <button onClick={loadContestsManager} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${contestView === 'manager' ? 'bg-purple-500 text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>Manage Database</button>
                </div>
                {statusMsg && <span className="text-emerald-400 text-xs font-medium flex items-center gap-1"><Check size={14}/> {statusMsg}</span>}
            </div>

            {contestView === "manager" ? (
                // --- CONTEST MANAGER LIST ---
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2"><List size={18} className="text-purple-400"/> Existing Contests</h3>
                    <div className="space-y-3">
                        {existingContests.length === 0 && <p className="text-zinc-500 text-sm">No contests found.</p>}
                        {existingContests.map(c => (
                            <div key={c.id} className="flex justify-between items-center p-4 bg-zinc-950/50 border border-white/5 rounded-xl hover:border-white/10">
                                <div>
                                    <p className="text-white font-medium">{c.title}</p>
                                    <p className="text-xs text-zinc-500">ID: {c.id}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditContest(c)} className="p-2 text-sky-400 hover:bg-sky-500/10 rounded-lg"><Edit3 size={16}/></button>
                                    <button onClick={() => handleDeleteContest(c.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // --- CONTEST EDITOR (MULTI-PROBLEM) ---
                <div className="space-y-8 bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-lg">
                    
                    {/* Contest Meta */}
                    <div className="p-5 bg-black/20 border border-white/5 rounded-2xl">
                      <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/5"><Calendar size={16} className="text-sky-400"/> Contest Meta {cId && <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded">EDITING</span>}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-3">
                              <label className={labelClass}>Contest Title</label>
                              <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} className={inputClass} placeholder="e.g. AlgoLib Weekly 15" />
                          </div>
                          <div>
                              <label className={labelClass}>Start Time (Local)</label>
                              <input type="datetime-local" value={cStart} onChange={(e) => setCStart(e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
                          </div>
                          <div>
                              <label className={labelClass}>End Time (Local)</label>
                              <input type="datetime-local" value={cEnd} onChange={(e) => setCEnd(e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
                          </div>
                      </div>
                    </div>

                    {/* Problems Array */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Code size={16} className="text-emerald-400"/> Problem Set</h3>
                            <button onClick={addProblem} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-bold flex items-center gap-1"><Plus size={14}/> Add Problem</button>
                        </div>

                        <div className="space-y-6">
                            {problems.map((p, pIndex) => (
                                <div key={pIndex} className="p-6 bg-zinc-950 border border-white/10 rounded-2xl relative">
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <span className="text-xs font-bold text-zinc-600">P{pIndex + 1}</span>
                                        <button onClick={() => removeProblem(pIndex)} className="text-zinc-600 hover:text-red-400"><Trash2 size={16}/></button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-4">
                                        <div className="md:col-span-2">
                                            <label className={labelClass}>Problem Title</label>
                                            <input value={p.title} onChange={(e) => updateProblem(pIndex, 'title', e.target.value)} className={inputClass} placeholder="e.g. Reverse Linked List" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Difficulty</label>
                                            <select value={p.difficulty} onChange={(e) => updateProblem(pIndex, 'difficulty', e.target.value)} className={inputClass}>
                                                <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                                            </select>
                                        </div>
                                        
                                        {/* SECTIONED DESCRIPTION */}
                                        <div className="md:col-span-3 space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                            <div>
                                                <label className={labelClass}>1. Problem Description</label>
                                                <textarea value={p.description} onChange={(e) => updateProblem(pIndex, 'description', e.target.value)} rows={3} className={`${inputClass} font-mono text-xs`} placeholder="Main problem statement..." />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClass}>2. Input Format</label>
                                                    <textarea value={p.inputFormat} onChange={(e) => updateProblem(pIndex, 'inputFormat', e.target.value)} rows={2} className={`${inputClass} font-mono text-xs`} placeholder="e.g. First line contains N..." />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>3. Output Format</label>
                                                    <textarea value={p.outputFormat} onChange={(e) => updateProblem(pIndex, 'outputFormat', e.target.value)} rows={2} className={`${inputClass} font-mono text-xs`} placeholder="e.g. Print a single integer..." />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>4. Constraints</label>
                                                <textarea value={p.constraints} onChange={(e) => updateProblem(pIndex, 'constraints', e.target.value)} rows={2} className={`${inputClass} font-mono text-xs`} placeholder="e.g. 1 <= N <= 10^5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Test Cases for this Problem */}
                                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                                            <span className="text-xs font-bold text-zinc-400">Test Cases</span>
                                            <button onClick={() => addTestCase(pIndex)} className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20">+ Case</button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {p.testCases.map((tc, tcIndex) => (
                                                <div key={tcIndex} className="p-4 bg-black/40 border border-white/5 rounded-lg relative">
                                                    <button onClick={() => removeTestCase(pIndex, tcIndex)} className="absolute top-2 right-2 text-zinc-600 hover:text-red-400"><X size={14}/></button>
                                                    
                                                    <div className="flex flex-wrap gap-4 mb-3">
                                                        <label className="flex items-center gap-2 text-[10px] text-zinc-300 cursor-pointer w-fit">
                                                            <input type="checkbox" checked={tc.isPublic} onChange={(e) => updateTestCase(pIndex, tcIndex, 'isPublic', e.target.checked)} className="rounded bg-zinc-900" /> Public (Visible)
                                                        </label>
                                                        <label className="flex items-center gap-2 text-[10px] text-zinc-300 cursor-pointer w-fit">
                                                            <input type="checkbox" checked={tc.hasMultipleAnswers} onChange={(e) => updateTestCase(pIndex, tcIndex, 'hasMultipleAnswers', e.target.checked)} className="rounded bg-zinc-900" /> Allow Multiple Answers
                                                        </label>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                        <div><label className={labelClass}>Display Input</label><textarea value={tc.displayInput} onChange={(e) => updateTestCase(pIndex, tcIndex, 'displayInput', e.target.value)} className={`${inputClass} font-mono text-[10px] p-2`} rows={2} /></div>
                                                        <div><label className={labelClass}>Raw Stdin</label><textarea value={tc.rawInput} onChange={(e) => updateTestCase(pIndex, tcIndex, 'rawInput', e.target.value)} className={`${inputClass} font-mono text-[10px] p-2`} rows={2} /></div>
                                                        <div><label className={labelClass}>Expected Output</label><textarea value={tc.expected} onChange={(e) => updateTestCase(pIndex, tcIndex, 'expected', e.target.value)} className={`${inputClass} font-mono text-[10px] p-2`} rows={3} placeholder={tc.hasMultipleAnswers ? "Answer1 ||| Answer2" : "Expected Output"} /></div>
                                                        <div><label className={labelClass}>Explanation</label><textarea value={tc.explanation} onChange={(e) => updateTestCase(pIndex, tcIndex, 'explanation', e.target.value)} className={`${inputClass} text-[10px] p-2 custom-scrollbar`} rows={3} placeholder="Explanation (Markdown supported)" /></div>
                                                    </div>

                                                    {/* CLOUDINARY UPLOAD SECTION */}
                                                    <div>
                                                        <label className={labelClass}>Visual Reference (Optional Image)</label>
                                                        <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-xl border border-white/5">
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if(file) {
                                                                        setStatusMsg("Uploading Image...");
                                                                        try {
                                                                            const url = await uploadToCloudinary(file);
                                                                            updateTestCase(pIndex, tcIndex, 'imageUrl', url);
                                                                            setStatusMsg("Image Saved!");
                                                                        } catch (e) {
                                                                            alert("Upload Failed. Check Cloudinary settings.");
                                                                            setStatusMsg("");
                                                                        }
                                                                        setTimeout(() => setStatusMsg(""), 3000);
                                                                    }
                                                                }}
                                                                className="text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20 cursor-pointer w-full md:w-auto"
                                                            />
                                                            {tc.imageUrl && (
                                                                <div className="relative group">
                                                                    <img src={tc.imageUrl} className="h-10 w-10 rounded border border-white/10 object-cover" alt="Preview" />
                                                                    <button 
                                                                        onClick={() => updateTestCase(pIndex, tcIndex, 'imageUrl', '')}
                                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <X size={10}/>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/5">
                        <button onClick={handleDeployContest} disabled={isDeployingContest} className="w-full py-4 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all shadow-lg flex justify-center gap-2">
                            {isDeployingContest ? <Loader2 className="animate-spin" size={18}/> : <CloudLightning size={18} />}
                            {cId ? "Update Global Matrix" : "Deploy to Global Matrix"}
                        </button>
                    </div>
                </div>
            )}
          </motion.div>
        )}

        {activeTab === "submissions" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* Header & Filters */}
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText size={20} className="text-sky-400" /> Submissions Database
                            </h2>
                            <p className="text-xs text-zinc-400 mt-1">Monitor code executions and algorithm integrity.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <select 
                                value={selectedSubContest} 
                                onChange={(e) => setSelectedSubContest(e.target.value)}
                                className={`${inputClass} w-full sm:w-64`}
                            >
                                <option value="" disabled>Select Target Contest...</option>
                                {existingContests.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedSubContest && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Total Submissions</p>
                                    <h4 className="text-2xl font-bold text-white">{submissionsData.length}</h4>
                                </div>
                                <Terminal size={24} className="text-zinc-600" />
                            </div>
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] text-emerald-500/70 font-bold uppercase tracking-wider mb-1">Accepted</p>
                                    <h4 className="text-2xl font-bold text-emerald-400">{submissionsData.filter(s => s.passed).length}</h4>
                                </div>
                                <CheckCircle2 size={24} className="text-emerald-500/30" />
                            </div>
                            <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] text-rose-500/70 font-bold uppercase tracking-wider mb-1">Rejected</p>
                                    <h4 className="text-2xl font-bold text-rose-400">{submissionsData.filter(s => !s.passed).length}</h4>
                                </div>
                                <XCircle size={24} className="text-rose-500/30" />
                            </div>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by user signature, problem title, or language..." 
                            className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all text-white placeholder:text-zinc-600" 
                            value={subSearchQuery} 
                            onChange={(e) => setSubSearchQuery(e.target.value)} 
                            disabled={!selectedSubContest}
                        />
                    </div>
                </div>

                {/* Submissions Table */}
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-lg overflow-hidden flex flex-col">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-zinc-950/50 border-b border-white/5 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                                    <th className="p-4 pl-6">Timestamp</th>
                                    <th className="p-4">User Signature</th>
                                    <th className="p-4">Problem</th>
                                    <th className="p-4 text-center">Lang</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-center">Score</th>
                                    <th className="p-4 text-center">Runtime</th>
                                    <th className="p-4 pr-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-transparent text-sm">
                                {!selectedSubContest ? (
                                    <tr><td colSpan={8} className="p-16 text-center text-zinc-500"><Terminal size={32} className="mx-auto mb-3 opacity-20" />Select a contest above to view telemetry.</td></tr>
                                ) : isSubsLoading ? (
                                    <tr><td colSpan={8} className="p-16 text-center text-zinc-500"><Loader2 size={32} className="mx-auto mb-3 animate-spin text-sky-400" />Fetching records...</td></tr>
                                ) : filteredSubmissions.length > 0 ? (
                                    filteredSubmissions.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-4 pl-6 text-zinc-400 text-xs">
                                                {new Date(sub.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-zinc-300 text-[13px]">{sub.user_uid.substring(0, 12)}...</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-medium text-zinc-200">{sub.problemTitle}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="px-2 py-1 bg-white/5 rounded text-xs font-medium text-zinc-300 capitalize">{sub.language}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {sub.passed ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-400 bg-emerald-400/10">
                                                        <CheckCircle2 size={12}/> Accepted
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-rose-400 bg-rose-400/10">
                                                        <XCircle size={12}/> Rejected
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center font-mono text-zinc-300">{sub.score_awarded}</td>
                                            <td className="p-4 text-center font-mono text-zinc-500 text-[13px]">{formatDuration(sub.time_taken_seconds)}</td>
                                            <td className="p-4 pr-6 text-right">
                                                <button 
                                                    onClick={() => setViewingCodeInfo(sub)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-400 hover:bg-sky-500/10 transition-colors"
                                                >
                                                    <Code2 size={14} /> View Code
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={8} className="p-16 text-center text-zinc-500"><Search size={32} className="mx-auto mb-3 opacity-20" />No submissions found matching criteria.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        )}

        {activeTab === "moderation" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                        <div className="p-3.5 bg-white/5 text-zinc-300 rounded-xl border border-white/5"><MessageSquare size={20} /></div>
                        <div><p className="text-xs text-zinc-500 font-medium mb-1">Total Threads</p><h3 className="text-2xl font-bold text-white">{totalPosts}</h3></div>
                    </div>
                    <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                        <div className="p-3.5 bg-white/5 text-zinc-300 rounded-xl border border-white/5"><Users size={20} /></div>
                        <div><p className="text-xs text-zinc-500 font-medium mb-1">Total Replies</p><h3 className="text-2xl font-bold text-white">{totalReplies}</h3></div>
                    </div>
                    <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                        <div className="p-3.5 bg-white/5 text-zinc-300 rounded-xl border border-white/5"><Activity size={20} /></div>
                        <div><p className="text-xs text-zinc-500 font-medium mb-1">Interactions</p><h3 className="text-2xl font-bold text-white">{totalInteractions}</h3></div>
                    </div>
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-lg overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/[0.02]">
                        <h2 className="font-semibold text-white flex items-center gap-2 text-sm"><ShieldCheck size={18} className="text-emerald-400" /> Content Queue</h2>
                        <div className="relative w-full sm:w-80 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input type="text" placeholder="Search queries, authors..." className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-white placeholder:text-zinc-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-zinc-950/50 border-b border-white/5 text-zinc-500 text-xs font-medium">
                                    <th className="p-4 pl-6 w-2/5">Discussion Thread</th><th className="p-4">Author</th><th className="p-4 text-center">Metrics</th><th className="p-4">Timestamp</th><th className="p-4 pr-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-transparent">
                                {filteredPosts.length > 0 ? (
                                    filteredPosts.map((post) => (
                                        <React.Fragment key={post.id}>
                                            <tr className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-4 pl-6"><p className="font-medium text-zinc-200 mb-1 line-clamp-1">{post.title}</p><p className="text-xs text-zinc-500 line-clamp-1">{post.body}</p></td>
                                                <td className="p-4"><div className="flex flex-col"><span className="font-medium text-sm text-zinc-300">{post.authorName}</span><span className="text-[10px] text-zinc-600 font-mono mt-0.5">ID: {post.authorId.substring(0, 8)}</span></div></td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-3 text-xs text-zinc-400">
                                                        <span className="flex items-center gap-1.5" title="Upvotes"><ChevronUp size={14} className="text-emerald-400" /> {post.upvotes?.length || 0}</span>
                                                        <button onClick={() => post.replies?.length > 0 && setExpandedPostId(expandedPostId === post.id ? null : post.id)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${post.replies?.length > 0 ? 'hover:bg-white/5 cursor-pointer text-zinc-300' : 'opacity-40 cursor-default'} ${expandedPostId === post.id ? 'bg-white/5 text-white' : ''}`}><MessageSquare size={12} /> {post.replies?.length || 0}</button>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-zinc-500 text-xs">{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Just now"}</td>
                                                <td className="p-4 pr-6 text-right">
                                                    <button onClick={() => handleDeletePost(post.id)} disabled={isDeleting === post.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                                                        {isDeleting === post.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedPostId === post.id && post.replies && post.replies.length > 0 && (
                                                <tr className="bg-zinc-950/30 border-b border-white/5 relative">
                                                    <td colSpan={5} className="p-0">
                                                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />
                                                        <div className="p-6 pl-12 space-y-3">
                                                            {post.replies.map(reply => (
                                                                <div key={reply.id} className="flex items-start justify-between bg-zinc-900/50 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                                                                    <div className="flex items-start gap-4 flex-1">
                                                                        <img src={reply.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${reply.authorName}`} alt="avatar" className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10" />
                                                                        <div className="flex-1 pr-6">
                                                                            <div className="flex items-center gap-2 mb-1"><span className="text-xs font-semibold text-zinc-200">{reply.authorName}</span><span className="text-[10px] text-zinc-600 font-mono">ID: {reply.authorId.substring(0,6)}</span></div>
                                                                            <p className="text-sm text-zinc-400 leading-relaxed">{reply.content}</p>
                                                                        </div>
                                                                    </div>
                                                                    <button onClick={() => handleDeleteReply(post.id, reply.id)} disabled={isDeleting === `reply-${reply.id}`} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                                        {isDeleting === `reply-${reply.id}` ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="p-16 text-center"><div className="flex flex-col items-center justify-center text-zinc-500"><ShieldCheck size={32} className="mb-3 opacity-50" /><p className="text-sm font-medium">All clear.</p><p className="text-xs mt-1">No community discussions found.</p></div></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        )}

        {activeTab === "broadcast" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-4xl mx-auto">
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-lg space-y-8">
                    <div className="flex items-center justify-between pb-6 border-b border-white/5">
                        <div><h2 className="text-lg font-semibold text-white flex items-center gap-2"><Radio size={18} className="text-sky-400" /> Global Broadcast</h2><p className="text-xs text-zinc-400 mt-1">Push notifications to all connected clients.</p></div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={broadcastActive} onChange={(e) => setBroadcastActive(e.target.checked)} />
                            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                            <span className="ml-3 text-sm font-medium text-zinc-300">{broadcastActive ? 'Active' : 'Hidden'}</span>
                        </label>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className={labelClass}>Transmission Message</label>
                            <input value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} className={inputClass} placeholder="e.g. Scheduled maintenance at 00:00 UTC." maxLength={120} />
                            <div className="text-right text-[10px] text-zinc-500 mt-1">{broadcastMsg.length}/120 chars</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Severity Level</label>
                                <div className="flex gap-2 bg-zinc-950/50 p-1.5 rounded-xl border border-white/5">
                                    <button onClick={() => setBroadcastType("info")} className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${broadcastType === 'info' ? 'bg-sky-500/10 text-sky-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Info</button>
                                    <button onClick={() => setBroadcastType("warning")} className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${broadcastType === 'warning' ? 'bg-amber-500/10 text-amber-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Warning</button>
                                    <button onClick={() => setBroadcastType("critical")} className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${broadcastType === 'critical' ? 'bg-red-500/10 text-red-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Critical</button>
                                </div>
                            </div>
                            <div><label className={labelClass}>Redirect URL (Optional)</label><input value={broadcastLink} onChange={(e) => setBroadcastLink(e.target.value)} className={inputClass} placeholder="https://..." /></div>
                        </div>
                    </div>

                    <button onClick={handleSaveBroadcast} disabled={isSavingBroadcast} className="w-full py-3.5 bg-white text-black hover:bg-zinc-200 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md">
                        {isSavingBroadcast ? <Loader2 className="animate-spin" size={16}/> : <Send size={16} />} Update Configuration
                    </button>
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-lg">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between text-zinc-400"><span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"><Eye size={14} /> Client Preview</span></div>
                    <div className="bg-zinc-950 h-32 relative flex flex-col justify-center">
                        {broadcastActive ? (
                            <div className={`w-full py-3 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 transition-colors ${broadcastType === 'info' ? 'bg-sky-500 text-black' : broadcastType === 'warning' ? 'bg-amber-400 text-black' : 'bg-red-500 text-white'}`}>
                                {broadcastType === 'warning' || broadcastType === 'critical' ? <AlertTriangle size={16} /> : <Megaphone size={16} />}
                                <span>{broadcastMsg || "Your announcement message will appear here..."}</span>
                                {broadcastLink && <span className="flex items-center gap-1 underline underline-offset-2 opacity-80 hover:opacity-100 cursor-pointer font-bold ml-2">Details <ExternalLink size={12} /></span>}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center text-zinc-600 text-xs font-medium border border-dashed border-white/10 m-4 py-8 rounded-xl">Broadcast is currently hidden.</div>
                        )}
                    </div>
                </div>
            </motion.div>
        )}

        {activeTab === "insights" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                {isInsightsLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-zinc-400 bg-zinc-900/30 backdrop-blur-xl rounded-3xl border border-white/5"><Loader2 size={32} className="animate-spin text-sky-400" /><span className="text-sm font-medium">Aggregating telemetry...</span></div>
                ) : (
                    <>
                        <div className="flex justify-between items-center bg-zinc-900/40 backdrop-blur-xl p-4 px-6 rounded-2xl border border-white/5 shadow-sm">
                            <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Database size={16} className="text-emerald-400" /> Telemetry Overview</h2>
                            <button onClick={exportInsightsToCSV} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium transition-colors border border-white/5"><Download size={14} /> Export CSV</button>
                        </div>

                        

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-zinc-500 font-medium">Total Site Hits</p>
                                    <Eye size={16} className="text-rose-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-white">{siteVisits}</h3>
                                <p className="text-[11px] text-zinc-500 mt-2">Cumulative visits globally</p>
                            </div>
                            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-sm"><div className="flex items-center justify-between mb-4"><p className="text-xs text-zinc-500 font-medium">Total Active Users</p><Users size={16} className="text-sky-400" /></div><h3 className="text-3xl font-bold text-white">{aggregatedActivityData.totalUsersWithData}</h3><p className="text-[11px] text-zinc-500 mt-2">Registered telemetry signatures</p></div>
                            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-sm"><div className="flex items-center justify-between mb-4"><p className="text-xs text-zinc-500 font-medium">Platform Usage ScreenTime</p><Activity size={16} className="text-indigo-400" /></div><h3 className="text-3xl font-bold text-white">{aggregatedActivityData.totalPlatformMinutes} <span className="text-sm text-zinc-500 font-medium">min</span></h3><p className="text-[11px] text-zinc-500 mt-2">Cumulative session time</p></div>
                            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-sm"><div className="flex items-center justify-between mb-4"><p className="text-xs text-zinc-500 font-medium">Avg Time / User</p><Clock size={16} className="text-emerald-400" /></div><h3 className="text-3xl font-bold text-white">{aggregatedActivityData.totalUsersWithData > 0 ? (aggregatedActivityData.totalPlatformMinutes / aggregatedActivityData.totalUsersWithData).toFixed(1) : 0} <span className="text-sm text-zinc-500 font-medium"> min</span></h3><p className="text-[11px] text-zinc-500 mt-2">Engagement metric</p></div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-medium text-white mb-6 flex items-center gap-2"><BarChart3 size={16} className="text-sky-400"/> Route Popularity</h3>
                                <div className="h-72 w-full text-xs font-mono">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={aggregatedActivityData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                                            <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} angle={-45} textAnchor="end" interval={0} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Minutes">
                                                {aggregatedActivityData.chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-medium text-white mb-6 flex items-center gap-2"><PieChartIcon size={16} className="text-indigo-400"/> Attention Matrix</h3>
                                <div className="h-72 w-full text-xs font-mono flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={aggregatedActivityData.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" stroke="rgba(0,0,0,0)">
                                                {aggregatedActivityData.chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-lg overflow-hidden">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5 pb-6 mb-6">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><UserIcon size={16} className="text-emerald-400"/> Individual Tracking</h3>
                                <div className="relative w-full md:w-80 group">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                    <input type="text" placeholder="Search user email..." className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-colors text-white placeholder:text-zinc-600" value={insightSearchEmail} onChange={(e) => setInsightSearchEmail(e.target.value)} />
                                </div>
                            </div>

                            {insightSearchEmail.trim() === "" ? (
                                <div className="py-16 text-center text-zinc-500 text-sm font-medium">Awaiting target input.</div>
                            ) : searchedUserStats ? (
                                <div className="space-y-6">
                                    <div className="flex flex-wrap items-center gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10"><span className="text-zinc-300 font-semibold text-lg">{searchedUserStats.displayName?.charAt(0) || 'U'}</span></div>
                                        <div><h4 className="text-white font-semibold text-base">{searchedUserStats.displayName || 'Anonymous'}</h4><p className="text-xs text-zinc-500">{searchedUserStats.email}</p></div>
                                        <div className="w-px h-8 bg-white/10 hidden md:block mx-2" />
                                        <div className="flex gap-8 text-sm">
                                            <div><span className="block text-[11px] text-zinc-500 mb-0.5">Total Runtime</span><span className="text-white font-medium">{searchedUserStats.lifetimeActiveTimeMins?.toFixed(2) || 0} min</span></div>
                                            <div><span className="block text-[11px] text-zinc-500 mb-0.5">Last Sync</span><span className="text-white font-medium">{searchedUserStats.lastActiveDate?.toDate ? searchedUserStats.lastActiveDate.toDate().toLocaleDateString() : 'N/A'}</span></div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto border border-white/5 rounded-2xl">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-zinc-950/50 text-xs text-zinc-500 font-medium border-b border-white/5">
                                                <tr><th className="p-4 pl-6 w-2/3">Route / Activity</th><th className="p-4 pr-6 text-right">Time (Mins)</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 bg-transparent">
                                                {searchedUserStats.activityUsage && Object.keys(searchedUserStats.activityUsage).length > 0 ? (
                                                    Object.entries(searchedUserStats.activityUsage).sort((a, b) => b[1] - a[1]).map(([activity, time], idx) => (
                                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                                                <td className="p-4 pl-6 text-zinc-300 flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-sky-400/50" />{activity}</td>
                                                                <td className="p-4 pr-6 text-right text-zinc-300 font-medium">{typeof time === 'number' ? time.toFixed(2) : time}</td>
                                                            </tr>
                                                        ))
                                                ) : (
                                                    <tr><td colSpan={2} className="p-8 text-center text-zinc-500 text-sm">No activity recorded.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-16 text-center text-zinc-500 text-sm font-medium">Target signature "{insightSearchEmail}" not found.</div>
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        )}

        {/* ========================================== */}
        {/* NEW TAB: DYNAMIC MAINTENANCE LOCKDOWN      */}
        {/* ========================================== */}
        {activeTab === "maintenance" && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-4xl mx-auto">
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-rose-500/10 p-8 rounded-3xl shadow-lg space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[80px] pointer-events-none rounded-full"></div>
                    
                    <div className="flex items-center justify-between pb-6 border-b border-white/5 relative z-10">
                        <div>
                            <h2 className="text-lg font-semibold text-rose-400 flex items-center gap-2">
                                <Construction size={18} /> System Lockdown Controller
                            </h2>
                            <p className="text-xs text-zinc-400 mt-1">Selectively restrict public access to modules for deployment or patching.</p>
                        </div>
                        {statusMsg && <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium"><Check size={14}/> {statusMsg}</span>}
                    </div>

                    <div className="relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SYSTEM_MODULES.map(module => {
                                const isLocked = maintainedRoutes.includes(module.id);
                                return (
                                    <div 
                                        key={module.id}
                                        onClick={() => toggleMaintenanceRoute(module.id)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                                            isLocked 
                                                ? 'bg-rose-500/10 border-rose-500/30 shadow-[inset_0_0_20px_rgba(244,63,94,0.05)]' 
                                                : 'bg-zinc-950/50 border-white/5 hover:border-white/20 hover:bg-white/[0.02]'
                                        }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className={`font-semibold text-sm ${isLocked ? 'text-rose-400' : 'text-zinc-300'}`}>{module.name}</span>
                                            <span className="text-[10px] font-mono text-zinc-500 mt-1">{module.id}</span>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${isLocked ? 'bg-rose-500' : 'bg-zinc-800'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isLocked ? 'translate-x-4 shadow-sm' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-2xl flex items-start gap-4 relative z-10">
                        <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="text-sm font-bold text-rose-400 mb-1">Critical Impact Warning</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Any module toggled to active lockdown will instantly redirect all standard traffic to the Maintenance Vault. Administrator accounts (via <span className="font-mono text-[10px] bg-white/10 px-1 rounded text-white">/hq</span>) bypass this restriction automatically.
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveMaintenance} 
                        disabled={isSavingMaintenance} 
                        className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] flex items-center justify-center gap-2 relative z-10"
                    >
                        {isSavingMaintenance ? <Loader2 size={18} className="animate-spin" /> : <ShieldAlert size={18} />}
                        Save Lockdown Configuration
                    </button>
                </div>
            </motion.div>
        )}

        {activeTab === "admins" && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-4xl mx-auto">
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-lg space-y-8">
                    
                    <div className="flex items-center justify-between pb-6 border-b border-white/5">
                        <div>
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <ShieldCheck size={18} className="text-emerald-400" /> Platform Administrators
                            </h2>
                            <p className="text-xs text-zinc-400 mt-1">Manage global access and view audit trails of assigned admins.</p>
                        </div>
                        {statusMsg && <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium"><Check size={14}/> {statusMsg}</span>}
                    </div>

                    {/* Add New Admin Section */}
                    <div className="p-5 bg-black/20 border border-white/5 rounded-2xl flex flex-col md:flex-row items-end gap-4">
                        <div className="flex-1 w-full">
                            <label className={labelClass}>Grant Access via Email</label>
                            <input 
                                value={newAdminEmail} 
                                onChange={(e) => setNewAdminEmail(e.target.value)} 
                                className={inputClass} 
                                placeholder="new.admin@gmail.com" 
                            />
                        </div>
                        <button 
                            onClick={handleAddAdminClick}
                            className="w-full md:w-auto py-3.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 text-sm"
                        >
                            <UserPlus size={16} /> Assign Role
                        </button>
                    </div>

                    {/* List of Admins */}
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <Users size={16} className="text-zinc-400"/> Current Administrators
                        </h3>
                        
                        <div className="overflow-x-auto border border-white/5 rounded-2xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-950/50 text-xs text-zinc-500 font-medium border-b border-white/5">
                                    <tr>
                                        <th className="p-4 pl-6 w-1/2">Administrator Signature</th>
                                        <th className="p-4">Added By (Audit)</th>
                                        <th className="p-4 pr-6 text-right">Timestamp / Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-transparent">
                                    {adminsList.map((admin) => (
                                        <tr key={admin.email} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-300">
                                                        {admin.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-zinc-200 font-medium">{admin.email}</p>
                                                        {user?.email === admin.email && <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full mt-1 inline-block">Current Session</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-zinc-400 text-xs font-mono bg-white/5 px-2 py-1 rounded">
                                                    {admin.added_by}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex items-center justify-end gap-3 text-zinc-500 text-xs">
                                                    <span>{new Date(admin.created_at).toLocaleDateString()}</span>
                                                    
                                                    {/* ONLY show remove button if NOT a founder */}
                                                    {admin.added_by !== 'system_init' ? (
                                                        <button 
                                                            onClick={() => handleRemoveAdminClick(admin.email)}
                                                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Revoke Access"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    ) : (
                                                        <span className="p-1.5 text-emerald-500/50 cursor-not-allowed" title="System Founder (Protected)">
                                                            <ShieldCheck size={14} />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {adminsList.length === 0 && (
                                         <tr><td colSpan={3} className="p-8 text-center text-zinc-500 text-sm">Loading security matrix...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </motion.div>
        )}

      </main>
    </div>
  );
};

export default Admin;