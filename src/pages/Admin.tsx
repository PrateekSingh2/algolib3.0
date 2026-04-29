import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, setDoc, updateDoc, getDocs } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { auth, firestoreDB, loginWithGoogle, logout, rtdb } from "../lib/firebase";

import {
    Lock, Terminal, Clock, Copy, Check, Hash, ShieldCheck, Save, RefreshCw, X, Code, FileJson, CloudLightning,
    Settings, Loader2, Edit3, ShieldAlert, Search, Users, Activity, Database, ChevronUp, MessageSquare, AlertTriangle, Trash2,
    Megaphone, Radio, ExternalLink, Eye, BarChart3, PieChart as PieChartIcon, Download, User as UserIcon, AlignLeft, Send, Github, Trophy, Plus, Calendar, List, UserPlus, UserMinus, FileText, CheckCircle2, XCircle, Code2, Construction,
    Coins, Zap, Mail, Paperclip
} from "lucide-react";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Navbar from '@/components/Navbar';

const CHART_COLORS = ['#38bdf8', '#34d399', '#818cf8', '#fb923c', '#f87171', '#facc15', '#f472b6', '#60a5fa'];

// --- Types ---
interface ReplyType { id: string; authorId: string; authorName: string; authorAvatar: string; content: string; createdAt: number; isAccepted?: boolean; }
interface Post { id: string; title: string; body: string; authorName: string; authorId: string; upvotes: string[]; downvotes?: string[]; replies: ReplyType[]; createdAt: any; }
interface UserActivityData { id: string; email?: string; displayName?: string; lifetimeActiveTimeMins?: number; lastActiveDate?: any; activityUsage?: Record<string, number>; aiCredits?: number; }
interface AdminUser { email: string; added_by: string; created_at: string; }
interface TestCaseData { displayInput: string; rawInput: string; expected: string; explanation: string; isPublic: boolean; hasMultipleAnswers: boolean; imageUrl?: string; }
interface ProblemData { dbId?: string; title: string; description: string; inputFormat: string; outputFormat: string; constraints: string; difficulty: string; testCases: TestCaseData[]; }
interface SubmissionData { id: string; created_at: string; user_uid: string; problem_id: string; contest_id: string; language: string; code: string; passed: boolean; score_awarded: number; time_taken_seconds: number; problemTitle?: string; }

const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");
    const res = await fetch("https://api.cloudinary.com/v1_1/dmmv8phgq/image/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const data = await res.json();
    return data.secure_url;
};

// Ultra-Premium Studio Lighting Background
const StudioBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        let width = window.innerWidth; let height = window.innerHeight;
        const handleResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
        window.addEventListener('resize', handleResize); handleResize();

        let particles = Array.from({ length: 40 }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.1, vy: (Math.random() - 0.5) * 0.1 }));
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "rgba(125, 211, 252, 0.05)";
            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > width) p.vx *= -1; if (p.y < 0 || p.y > height) p.vy *= -1;
                ctx.beginPath(); ctx.arc(p.x, p.y, 1, 0, Math.PI * 2); ctx.fill();
            });
            requestAnimationFrame(animate);
        };
        animate(); return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            <div className="fixed inset-0 -z-30 bg-[#000000]" />
            <div className="fixed inset-0 -z-20 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] -z-10 rounded-full bg-sky-900/20 blur-[120px]" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[50%] -z-10 rounded-full bg-indigo-900/10 blur-[120px]" />
            <canvas ref={canvasRef} className="fixed inset-0 -z-10 opacity-50" />
        </>
    );
};

const COMPLEXITY_PRESETS = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"];

const toLocalDatetime = (isoString: string) => {
    if (!isoString) return ""; const d = new Date(isoString); const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDuration = (seconds: number) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m}m ${s}s`; };

const SYSTEM_MODULES = [
    { id: '/', name: 'Home' }, { id: '/compiler', name: 'Compiler' }, { id: '/visualizer', name: 'Visualizer Dashboard' },
    { id: '/analyzer', name: 'AI Analyzer' }, { id: '/view-profile', name: 'View Profile' }, { id: '/edit-profile', name: 'Edit Profile' },
    { id: '/contests', name: 'Contest' }, { id: '/quiz-panel', name: 'Quiz' }, { id: '/discussion', name: 'Community' },
    { id: '/docs', name: 'Documentation' }, { id: '/notes', name: 'AlgoLib Notes' }
];

const Admin = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"forge" | "contests" | "submissions" | "moderation" | "broadcast" | "insights" | "admins" | "maintenance" | "credits" | "mailroom">("forge");
    const [customAlert, setCustomAlert] = useState<{ isOpen: boolean, message: string, title?: string, type: "info" | "error" | "warning" }>({ isOpen: false, message: "", type: "info" });
    const showAlert = (message: string, type: "info" | "error" | "warning" = "error", title?: string) => setCustomAlert({ isOpen: true, message, type, title });

    const [customConfirm, setCustomConfirm] = useState<{ isOpen: boolean, message: string, title: string, onConfirm: () => void }>({ isOpen: false, message: "", title: "", onConfirm: () => { } });
    const showConfirm = (message: string, title: string, onConfirm: () => void) => setCustomConfirm({ isOpen: true, message, title, onConfirm });
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const [mode, setMode] = useState<"create" | "edit">("create");
    const [activeCodeTab, setActiveCodeTab] = useState<"java" | "cpp" | "python">("java");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [formData, setFormData] = useState({ id: "", title: "", category: "", timeComplexity: "O(n)", spaceComplexity: "O(1)", description: "", details: "", codeJava: "", codeCpp: "", codePython: "" });

    const [adminPasscode, setAdminPasscode] = useState("");
    const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);

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
    const [problems, setProblems] = useState<ProblemData[]>([{ title: "", description: "", inputFormat: "", outputFormat: "", constraints: "", difficulty: "Easy", testCases: [{ displayInput: "", rawInput: "", expected: "", explanation: "", isPublic: true, hasMultipleAnswers: false, imageUrl: "" }] }]);
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

    const [maintainedRoutes, setMaintainedRoutes] = useState<string[]>([]);
    const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);

    const [mailTo, setMailTo] = useState("");
    const [mailCc, setMailCc] = useState("");
    const [mailBcc, setMailBcc] = useState("");
    const [mailSub, setMailSub] = useState("");
    const [mailBody, setMailBody] = useState("");
    const [mailAttachments, setMailAttachments] = useState<{filename: string, content: string, contentType: string, size: number}[]>([]);
    const [isSendingMail, setIsSendingMail] = useState(false);

    useEffect(() => { const savedConfig = localStorage.getItem("algolib_gist_config"); if (savedConfig) setGistConfig(JSON.parse(savedConfig)); }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser && currentUser.email) {
                try {
                    const token = await currentUser.getIdToken();
                    const response = await fetch('/.netlify/functions/get-admins', { headers: { 'Authorization': `Bearer ${token}` } });
                    let validEmails: string[] = [];
                    if (response.ok) { const data = await response.json(); validEmails = data.map((d: any) => d.email); }
                    const fallbackAdmins = ["prateeksinghrajawat2006@gmail.com", "shivanshmax@gmail.com"];
                    setIsAdmin(validEmails.includes(currentUser.email) || fallbackAdmins.includes(currentUser.email));
                } catch (e) { setIsAdmin(false); }
            } else { setIsAdmin(false); }
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

    useEffect(() => { if (activeTab === "submissions" && selectedSubContest) { fetchSubmissions(); } else if (activeTab === "submissions" && !selectedSubContest) { setSubmissionsData([]); } }, [activeTab, selectedSubContest]);

    const loadContestsListSilent = async () => { try { const response = await fetch('/.netlify/functions/get-contests'); if (response.ok) { const data = await response.json(); setExistingContests(data); } } catch (e) { } };

    const fetchSubmissions = async () => {
        setIsSubsLoading(true);
        try {
            const token = await user?.getIdToken();
            const response = await fetch(`/.netlify/functions/get-contest-submissions?contest_id=${selectedSubContest}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) { const mappedSubs = await response.json(); setSubmissionsData(mappedSubs); }
        } catch (err) { console.error(err); } finally { setIsSubsLoading(false); }
    };

    const loadAdminsList = async () => {
        try {
            const token = await user?.getIdToken();
            const response = await fetch('/.netlify/functions/get-admins', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) { const data = await response.json(); setAdminsList(data); }
        } catch (e) { }
    };

    useEffect(() => {
        if (!isAdmin) return;
        const qPosts = query(collection(firestoreDB, "community_posts"), orderBy("createdAt", "desc"));
        const unsubPosts = onSnapshot(qPosts, (snapshot) => setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post))));

        const unsubBroadcast = onSnapshot(doc(firestoreDB, "system_settings", "announcement"), (docSnap) => {
            if (docSnap.exists()) { const data = docSnap.data(); setBroadcastMsg(data.message || ""); setBroadcastType(data.type || "info"); setBroadcastActive(data.active || false); setBroadcastLink(data.link || ""); }
        });

        const unsubMaintenance = onSnapshot(doc(firestoreDB, "system_settings", "maintenance"), (docSnap) => { if (docSnap.exists()) { setMaintainedRoutes(docSnap.data().activeRoutes || []); } });

        const statsRef = ref(rtdb, 'site_stats/visits');
        const unsubStats = onValue(statsRef, (snapshot) => { const visits = snapshot.val(); setSiteVisits(visits !== null ? visits : 0); });

        return () => { unsubPosts(); unsubBroadcast(); unsubStats(); unsubMaintenance(); };
    }, [isAdmin]);

    useEffect(() => {
        const fetchInsights = async () => {
            if (!isAdmin) return;
            setIsInsightsLoading(true);
            try {
                const token = await user?.getIdToken();

                const userSnap = await getDocs(collection(firestoreDB, "users"));
                
                const creditResponse = await fetch('/.netlify/functions/get-all-credits', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const creditMap: Record<string, number> = {};
                if (creditResponse.ok) {
                    const creditData = await creditResponse.json();
                    creditData.forEach((doc: any) => {
                        creditMap[doc.id] = doc.credits || 0;
                    });
                }

                const users = userSnap.docs.map(doc => {
                    const data = doc.data();
                    
                    const parsedActivityUsage: Record<string, number> = {};
                    
                    Object.keys(data).forEach(key => { 
                        if (key.startsWith('activityUsage.')) { 
                            parsedActivityUsage[key.replace('activityUsage.', '')] = data[key]; 
                        } 
                    });
                    
                    if (data.activityUsage && typeof data.activityUsage === 'object') {
                        Object.assign(parsedActivityUsage, data.activityUsage);
                    }

                    return {
                        id: doc.id,
                        email: data.email || "",
                        displayName: data.displayName || "Anonymous",
                        lifetimeActiveTimeMins: data.lifetimeActiveTimeMins || 0,
                        lastActiveDate: data.lastActiveDate,
                        activityUsage: parsedActivityUsage,
                        aiCredits: creditMap[doc.id] || 0
                    } as UserActivityData;
                });
                setInsightsData(users);
            } catch (error) {
                console.error("Fetch Insights Error:", error);
                showAlert("Failed to load user records.");
            } finally {
                setIsInsightsLoading(false);
            }
        };

        if ((activeTab === "insights" || activeTab === "credits") && isAdmin && insightsData.length === 0) {
            fetchInsights();
        }
    }, [activeTab, isAdmin, insightsData.length]);

    const aggregatedActivityData = useMemo(() => {
        const totals: Record<string, number> = {}; 
        let totalPlatformMinutes = 0;
        
        insightsData.forEach(user => { 
            if (user.activityUsage) { 
                Object.entries(user.activityUsage).forEach(([activity, minutes]) => { 
                    if(typeof minutes === 'number') { 
                        totals[activity] = (totals[activity] || 0) + minutes; 
                        totalPlatformMinutes += minutes; 
                    } 
                }); 
            } 
        });
        
        const sorted = Object.entries(totals)
            .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
            .sort((a, b) => b.value - a.value);
            
        return { 
            chartData: sorted.slice(0, 10), 
            totalPlatformMinutes: Number(totalPlatformMinutes.toFixed(2)), 
            totalUsersWithData: insightsData.filter(u => u.lifetimeActiveTimeMins && u.lifetimeActiveTimeMins > 0).length 
        };
    }, [insightsData]);

    const searchedUserStats = useMemo(() => { if (!insightSearchEmail.trim()) return null; return insightsData.find(u => u.email?.toLowerCase().includes(insightSearchEmail.toLowerCase())); }, [insightSearchEmail, insightsData]);

    const exportInsightsToCSV = () => {
        if (insightsData.length === 0) return;
        let csvContent = "UserID,Email,DisplayName,TotalActiveTimeMins,LastActive,ActivityBreakdown\n";
        insightsData.forEach(user => {
            const date = user.lastActiveDate?.toDate ? user.lastActiveDate.toDate().toISOString() : "N/A";
            const activities = user.activityUsage && Object.keys(user.activityUsage).length > 0 ? Object.entries(user.activityUsage).map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(2) : v}m`).join(' | ') : "No specific route data";
            csvContent += [`"${user.id}"`, `"${user.email || 'N/A'}"`, `"${user.displayName || 'N/A'}"`, `"${user.lifetimeActiveTimeMins?.toFixed(2) || 0}"`, `"${date}"`, `"${activities}"`].join(",") + "\n";
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", `algolib_insights_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    };

    const handleSaveBroadcast = async () => {
        setIsSavingBroadcast(true);
        try { await setDoc(doc(firestoreDB, "system_settings", "announcement"), { message: broadcastMsg, type: broadcastType, active: broadcastActive, link: broadcastLink, updatedAt: new Date() }); setStatusMsg("Status Updated"); setTimeout(() => setStatusMsg(""), 3000); }
        catch (error) { showAlert("Failed to update broadcast settings."); } finally { setIsSavingBroadcast(false); }
    };

    // Helper to convert files to Base64
    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Strip the 'data:image/png;base64,' prefix for Nodemailer
                resolve(result.split(',')[1]); 
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        
        // Check size limit (e.g., max 4MB total for serverless payload)
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        if (totalSize > 4 * 1024 * 1024) return showAlert("Total attachment size must be under 4MB.");

        const newAttachments = await Promise.all(files.map(async (file) => ({
            filename: file.name,
            content: await convertFileToBase64(file),
            contentType: file.type,
            size: file.size
        })));

        setMailAttachments(prev => [...prev, ...newAttachments]);
    };

    const removeAttachment = (index: number) => {
        setMailAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendDirectMail = async () => {
        if (!mailTo || !mailSub || !mailBody) return showAlert("To, Subject, and Payload are required.");
        setIsSendingMail(true);
        setStatusMsg("Establishing SMTP connection...");
        
        try {
            const token = await user?.getIdToken();
            const response = await fetch('/.netlify/functions/send-mail', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ 
                    to: mailTo, cc: mailCc, bcc: mailBcc, 
                    subject: mailSub, message: mailBody, attachments: mailAttachments 
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to dispatch email.");
            }
            
            setStatusMsg("Transmission Delivered!");
            // Purge form after sending
            setMailTo(""); setMailCc(""); setMailBcc(""); setMailSub(""); setMailBody(""); setMailAttachments([]);
            setTimeout(() => setStatusMsg(""), 3000);
        } catch (err: any) {
            showAlert(err.message);
            setStatusMsg("");
        } finally {
            setIsSendingMail(false);
        }
    };

    const handleUpdateCredits = async (userId: string, newBalance: number) => {
        if (newBalance < 0) return showAlert("Credits cannot be negative.");

        setStatusMsg("Updating Ledger via Secure Backend...");
        try {
            const token = await user?.getIdToken();
            
            // Target your Netlify backend instead of direct Firestore
            const response = await fetch('/.netlify/functions/manage-credits', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, newBalance })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Backend failed to update credits");
            }

            // Update local state so the UI reflects the change immediately without refreshing
            setInsightsData(prev => prev.map(u =>
                u.id === userId ? { ...u, aiCredits: newBalance } : u
            ));

            setStatusMsg("Credits Synced");
            setTimeout(() => setStatusMsg(""), 3000);
        } catch (err: any) {
            showAlert("Sync Failed: " + err.message);
        }
    };

    const toggleMaintenanceRoute = (routeId: string) => { if (maintainedRoutes.includes(routeId)) { setMaintainedRoutes(prev => prev.filter(r => r !== routeId)); } else { setMaintainedRoutes(prev => [...prev, routeId]); } };

    const handleSaveMaintenance = async () => {
        setIsSavingMaintenance(true);
        try { await setDoc(doc(firestoreDB, "system_settings", "maintenance"), { activeRoutes: maintainedRoutes, updatedAt: new Date() }); setStatusMsg("Config Updated"); setTimeout(() => setStatusMsg(""), 3000); }
        catch (err) { showAlert("Failed to update lockdown settings."); } finally { setIsSavingMaintenance(false); }
    };

    const handleAddAdminClick = () => { if (!newAdminEmail || !newAdminEmail.includes('@')) return showAlert("Valid email required."); setAdminPasscode(""); setShowAddAdminPasscodeModal(true); };

    const executeAddAdmin = async () => {
        if (!adminPasscode) return; setShowAddAdminPasscodeModal(false); setIsAddingAdmin(true);
        try {
            const token = await user?.getIdToken();
            const response = await fetch('/.netlify/functions/manage-admins', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', passcode: adminPasscode, email_to_add: newAdminEmail.toLowerCase() }) });
            const data = await response.json();
            if (!response.ok) {
                if (data.error && data.error.includes("already an admin")) throw new Error("User is already an admin!");
                if (data.error && data.error.includes("Unauthorized Passcode")) throw new Error("Unauthorized Passcode");
                throw new Error(data.error || "Failed to add admin");
            }
            setStatusMsg("Access Granted!"); setNewAdminEmail(""); setTimeout(() => setStatusMsg(""), 3000); loadAdminsList();
        } catch (err: any) { if (err.message === "Unauthorized Passcode") { setShowUnauthorizedModal(true); } else { showAlert(err.message); } } finally { setIsAddingAdmin(false); setAdminPasscode(""); }
    };

    const handleRemoveAdminClick = (email: string) => { setAdminToRemove(email); setAdminPasscode(""); setShowRemoveAdminPasscodeModal(true); };

    const executeRemoveAdmin = async () => {
        if (!adminPasscode || !adminToRemove) return; setShowRemoveAdminPasscodeModal(false); setIsRemovingAdmin(true);
        try {
            const token = await user?.getIdToken();
            const response = await fetch('/.netlify/functions/manage-admins', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', passcode: adminPasscode, email_to_remove: adminToRemove }) });
            const data = await response.json();
            if (!response.ok) { if (data.error && data.error.includes("Unauthorized Passcode")) throw new Error("Unauthorized Passcode"); throw new Error(data.error || "Operation failed"); }
            setStatusMsg("Privileges Revoked!"); setTimeout(() => setStatusMsg(""), 3000); loadAdminsList();
        } catch (err: any) { if (err.message.includes("Unauthorized Passcode")) { setShowUnauthorizedModal(true); } else { showAlert(err.message || "Operation failed."); } } finally { setIsRemovingAdmin(false); setAdminPasscode(""); setAdminToRemove(null); }
    };

    const fetchFromGist = async () => {
        if (!gistConfig.id) return showAlert("Configure Gist ID"); setIsLoading(true);
        try { const response = await fetch(`https://api.github.com/gists/${gistConfig.id}`); const data = await response.json(); if (data.files["algorithms.json"]?.content) { const parsed = JSON.parse(data.files["algorithms.json"].content); setExistingAlgos(parsed); return parsed; } }
        catch (error) { showAlert("Failed to fetch Gist."); } finally { setIsLoading(false); }
    };

    const loadAlgorithm = (algo: any) => {
        setFormData({ id: algo.id || "", title: algo.title || "", category: algo.category || "", timeComplexity: algo.timeComplexity || "O(n)", spaceComplexity: algo.spaceComplexity || "O(1)", description: algo.description || "", details: algo.details || "", codeJava: algo.codeJava || "", codeCpp: algo.codeCpp || "", codePython: algo.codePython || "" });
        setTags(algo.tags || []); setMode("edit"); setShowLoadModal(false); setStatusMsg(`Loaded: ${algo.title}`); setTimeout(() => setStatusMsg(""), 3000);
    };

    const saveToGist = async () => {
        if (!gistConfig.token) return showAlert("Configure Token."); if (!formData.id || !formData.title) return showAlert("ID and Title required."); setIsLoading(true);
        try {
            const currentData = await fetchFromGist(); if (!currentData) return;
            let newData = [...currentData]; const newEntry = { ...formData, tags };
            if (mode === "edit") { const index = newData.findIndex((a: any) => a.id === formData.id); if (index !== -1) newData[index] = newEntry; else newData.push(newEntry); }
            else { if (newData.find((a: any) => a.id === formData.id)) { showAlert("ID exists!"); setIsLoading(false); return; } newData.push(newEntry); }
            const res = await fetch(`https://api.github.com/gists/${gistConfig.id}`, { method: "PATCH", headers: { "Authorization": `Bearer ${gistConfig.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ files: { "algorithms.json": { content: JSON.stringify(newData, null, 2) } } }) });
            if (res.ok) { setStatusMsg("Database Synced"); setTimeout(() => setStatusMsg(""), 5000); }
        } catch (error) { showAlert("Save failed."); } finally { setIsLoading(false); }
    };

    const handlePurge = () => { setFormData({ id: "", title: "", category: "", timeComplexity: "O(n)", spaceComplexity: "O(1)", description: "", details: "", codeJava: "", codeCpp: "", codePython: "" }); setTags([]); setJsonOutput(""); setMode("create"); setShowPurgeModal(false); setStatusMsg("Workspace Purged"); setTimeout(() => setStatusMsg(""), 2000); };
    const addTag = (e: React.KeyboardEvent) => { if (e.key === "Enter" && tagInput.trim() !== "") { e.preventDefault(); if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]); setTagInput(""); } };
    const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t));
    const generateJSON = () => { setJsonOutput(JSON.stringify({ ...formData, tags }, null, 2)); };

    const loadContestsManager = async () => { setContestView("manager"); try { const response = await fetch('/.netlify/functions/get-contests'); if (response.ok) { const data = await response.json(); setExistingContests(data); } } catch (e) { } };
    const resetContestEditor = () => { setCId(""); setCTitle(""); setCStart(""); setCEnd(""); setProblems([{ title: "", description: "", inputFormat: "", outputFormat: "", constraints: "", difficulty: "Easy", testCases: [{ displayInput: "", rawInput: "", expected: "", explanation: "", isPublic: true, hasMultipleAnswers: false, imageUrl: "" }] }]); setContestView("editor"); };

    const handleEditContest = async (contest: any) => {
        setStatusMsg("Loading Data..."); setCId(contest.id); setCTitle(contest.title); setCStart(toLocalDatetime(contest.start_time)); setCEnd(toLocalDatetime(contest.end_time));
        const response = await fetch(`/.netlify/functions/get-contest-details?id=${contest.id}`);
        if (response.ok) {
            const { problems: pData, testCases: tcData } = await response.json();
            if (pData && pData.length > 0) {
                const loadedProblems: ProblemData[] = [];
                for (const p of pData) {
                    const pTcs = tcData.filter((tc: any) => tc.problem_id === p.id);
                    const formattedTcs = (pTcs || []).map((tc: any) => ({ displayInput: tc.display_input || "", rawInput: tc.raw_input || "", expected: tc.expected_output || "", explanation: tc.explanation || "", isPublic: tc.is_public, hasMultipleAnswers: tc.has_multiple_answers || false, imageUrl: tc.image_url || "" }));
                    let descObj = { description: p.description, inputFormat: "", outputFormat: "", constraints: "" };
                    try { const parsed = JSON.parse(p.description); if (parsed.description !== undefined) { descObj = parsed; } } catch (e) { }
                    loadedProblems.push({ dbId: p.id, title: p.title, difficulty: p.difficulty, description: descObj.description, inputFormat: descObj.inputFormat, outputFormat: descObj.outputFormat, constraints: descObj.constraints, testCases: formattedTcs.length > 0 ? formattedTcs : [{ displayInput: "", rawInput: "", expected: "", explanation: "", isPublic: true, hasMultipleAnswers: false, imageUrl: "" }] });
                }
                setProblems(loadedProblems);
            } else { setProblems([{ title: "", description: "", inputFormat: "", outputFormat: "", constraints: "", difficulty: "Easy", testCases: [{ displayInput: "", rawInput: "", expected: "", explanation: "", isPublic: true, hasMultipleAnswers: false, imageUrl: "" }] }]); }
        }
        setContestView("editor"); setStatusMsg("");
    };

    const handleDeleteContest = (id: string) => {
        showConfirm("Delete this contest? All related records will be destroyed.", "Confirm Deletion", async () => {
            try {
                setStatusMsg("Erasing records..."); const token = await user?.getIdToken();
                const response = await fetch(`/.netlify/functions/manage-contest?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) throw new Error("Delete failed");
                setExistingContests(prev => prev.filter(c => c.id !== id)); setStatusMsg("Deleted Successfully"); setTimeout(() => setStatusMsg(""), 3000);
            } catch (err: any) { showAlert("Delete Failed: " + err.message); setStatusMsg(""); }
        });
    };

    const handleDeployContest = async () => {
        if (!cTitle || !cStart || !cEnd || problems.length === 0) return showAlert("Please fill out Contest Title and Time bounds.");
        for (let p of problems) if (!p.title || !p.description) return showAlert("Every problem must have a Title and Description.");
        setIsDeployingContest(true); setStatusMsg("Deploying...");
        try {
            const token = await user?.getIdToken();
            const response = await fetch('/.netlify/functions/manage-contest', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ cId, cTitle, cStart: new Date(cStart).toISOString(), cEnd: new Date(cEnd).toISOString(), problems }) });
            if (!response.ok) throw new Error("Deployment failed");
            setStatusMsg("Deployed to Matrix!"); setTimeout(() => setStatusMsg(""), 4000);
        } catch (err: any) { showAlert("Deployment Failed: " + err.message); setStatusMsg(""); } finally { setIsDeployingContest(false); }
    };

    const addProblem = () => setProblems([...problems, { title: "", description: "", inputFormat: "", outputFormat: "", constraints: "", difficulty: "Easy", testCases: [{ displayInput: "", rawInput: "", expected: "", explanation: "", isPublic: true, hasMultipleAnswers: false, imageUrl: "" }] }]);
    const removeProblem = (pIndex: number) => { if (problems.length > 1) setProblems(problems.filter((_, i) => i !== pIndex)); };
    const updateProblem = (pIndex: number, field: string, value: any) => { const newP = [...problems]; newP[pIndex] = { ...newP[pIndex], [field]: value }; setProblems(newP); };
    const addTestCase = (pIndex: number) => { const newP = [...problems]; newP[pIndex].testCases.push({ displayInput: "", rawInput: "", expected: "", explanation: "", isPublic: false, hasMultipleAnswers: false, imageUrl: "" }); setProblems(newP); };
    const removeTestCase = (pIndex: number, tcIndex: number) => { const newP = [...problems]; newP[pIndex].testCases = newP[pIndex].testCases.filter((_, i) => i !== tcIndex); setProblems(newP); };
    const updateTestCase = (pIndex: number, tcIndex: number, field: string, value: any) => { const newP = [...problems]; newP[pIndex].testCases[tcIndex] = { ...newP[pIndex].testCases[tcIndex], [field]: value }; setProblems(newP); };

    const handleDeletePost = (postId: string) => { showConfirm("Delete post?", "Confirm Purge", async () => { setIsDeleting(postId); try { await deleteDoc(doc(firestoreDB, "community_posts", postId)); } catch (e) { showAlert("Failed."); } finally { setIsDeleting(null); } }); };
    const handleDeleteReply = (postId: string, replyId: string) => { showConfirm("Delete reply?", "Confirm Purge", async () => { setIsDeleting(`reply-${replyId}`); try { const post = posts.find(p => p.id === postId); if (!post || !post.replies) return; await updateDoc(doc(firestoreDB, "community_posts", postId), { replies: post.replies.filter(r => r.id !== replyId) }); } catch (e) { showAlert("Failed."); } finally { setIsDeleting(null); } }); };

    const filteredCredits = useMemo(() => {
        return insightsData.filter(u => {
            if (!insightSearchEmail) return true;
            const searchLower = insightSearchEmail.toLowerCase();
            return (
                (u.email && u.email.toLowerCase().includes(searchLower)) ||
                (u.displayName && u.displayName.toLowerCase().includes(searchLower)) ||
                (u.id && u.id.toLowerCase().includes(searchLower))
            );
        });
    }, [insightsData, insightSearchEmail]);

    if (isAuthLoading) return <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center text-zinc-400 gap-4"><Loader2 size={32} className="animate-spin text-sky-400" /><p className="text-xs font-bold tracking-widest uppercase">Authenticating...</p></div>;
    if (!user) return (<div className="min-h-screen flex items-center justify-center p-4 relative bg-[#000000]"><StudioBackground /><div className="bg-white/[0.02] backdrop-blur-[40px] border border-white/[0.08] rounded-2xl shadow-2xl p-10 text-center relative z-10 w-full max-w-sm"><div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-zinc-800 to-zinc-950 shadow-inner"><Lock className="text-sky-400 drop-shadow-md" size={32} /></div><h2 className="text-2xl font-bold text-white mb-2">Admin Portal</h2><p className="text-zinc-500 text-sm mb-8">Authorized personnel only.</p><button onClick={loginWithGoogle} className="w-full bg-white text-black hover:bg-zinc-200 transition-colors py-3 rounded-xl text-sm font-bold shadow-lg flex justify-center items-center gap-2">Continue Session</button></div></div>);
    if (user && !isAdmin) return (<div className="min-h-screen flex items-center justify-center p-4 relative bg-[#000000]"><StudioBackground /><div className="bg-red-950/10 backdrop-blur-[40px] border border-red-500/20 rounded-2xl p-10 text-center w-full max-w-sm relative z-10 shadow-2xl"><ShieldAlert className="text-red-500 mx-auto mb-4 drop-shadow-md" size={40} /><h2 className="text-xl font-bold text-white mb-2">Access Denied</h2><p className="text-zinc-400 text-sm mb-8">Your signature lacks clearance.</p><button onClick={logout} className="w-full bg-[#0a0a0a] hover:bg-zinc-900 transition-colors border border-white/10 text-white py-3 rounded-xl text-sm font-bold">Sign Out</button></div></div>);

    const filteredPosts = posts.filter(post => post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.authorName.toLowerCase().includes(searchQuery.toLowerCase()) || post.body.toLowerCase().includes(searchQuery.toLowerCase()));
    const totalPosts = posts.length;
    const totalReplies = posts.reduce((acc, post) => acc + (post.replies?.length || 0), 0);
    const totalInteractions = posts.reduce((acc, post) => acc + (post.upvotes?.length || 0) + (post.downvotes?.length || 0), 0) + totalReplies;
    const filteredSubmissions = submissionsData.filter(s => s.user_uid.toLowerCase().includes(subSearchQuery.toLowerCase()) || s.problemTitle?.toLowerCase().includes(subSearchQuery.toLowerCase()) || s.language.toLowerCase().includes(subSearchQuery.toLowerCase()));

    // Downscaled Design System Constants
    const pInput = "w-full bg-[#050505]/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-transparent transition-all shadow-inner";
    const pLabel = "text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block ml-1";
    const pCard = "bg-white/[0.015] backdrop-blur-[40px] border border-white/[0.08] rounded-2xl shadow-xl relative overflow-hidden";
    const pBtn = "py-2.5 px-4 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2";

    return (
        <div className="min-h-screen bg-[#000000] text-zinc-200 font-sans selection:bg-sky-500/30 overflow-x-hidden relative">
            <StudioBackground />
            <Navbar />

            <AnimatePresence>
                {viewingCodeInfo && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="w-full max-w-4xl max-h-[85vh] bg-[#050505] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-zinc-900/40 backdrop-blur-xl">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Code2 size={20} className="text-purple-400" /> Source Inspector</h3>
                                    <p className="text-xs text-zinc-500 mt-1 font-mono tracking-wide">{viewingCodeInfo.problemTitle} • UID: {viewingCodeInfo.user_uid.substring(0, 8)}... • {viewingCodeInfo.language.toUpperCase()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { navigator.clipboard.writeText(viewingCodeInfo.code); setStatusMsg("Copied"); setTimeout(() => setStatusMsg(""), 2000); }} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 hover:text-white transition-all font-bold text-xs flex items-center gap-2"><Copy size={14} /> Copy</button>
                                    <button onClick={() => setViewingCodeInfo(null)} className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-400 transition-all"><X size={16} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto bg-[#020202] p-6 custom-scrollbar shadow-inner relative">
                                <div className="absolute top-4 right-4 flex gap-1.5 opacity-50">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                </div>
                                <pre className="font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap mt-2">{viewingCodeInfo.code}</pre>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showPurgeModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-[#050505] border border-white/10 rounded-2xl p-8 shadow-2xl">
                            <div className="flex flex-col items-center text-center mb-6"><div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500 shadow-inner"><AlertTriangle size={28} /></div><h3 className="text-xl font-bold text-white mb-2">Destructive Action</h3><p className="text-sm text-zinc-400 font-medium">This clears all current memory buffers.</p></div>
                            <div className="flex gap-3"><button onClick={() => setShowPurgeModal(false)} className={`${pBtn} flex-1 bg-white/5 text-zinc-300 hover:bg-white/10`}>Abort</button><button onClick={handlePurge} className={`${pBtn} flex-1 bg-red-600 text-white hover:bg-red-500`}>Confirm</button></div>
                        </motion.div>
                    </motion.div>
                )}

                {showLoadModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl h-[70vh] bg-[#050505] border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Database size={20} className="text-sky-400" /> Data Warehouse</h3><button onClick={() => setShowLoadModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors bg-white/5"><X size={18} className="text-zinc-400" /></button></div>
                            {isLoading ? (<div className="flex-1 flex items-center justify-center flex-col gap-4 text-zinc-400"><Loader2 className="animate-spin text-sky-400" size={32} /><span className="text-xs font-bold uppercase tracking-widest">Querying...</span></div>) : (
                                <div className="flex-1 overflow-auto custom-scrollbar space-y-3 pr-2">
                                    {existingAlgos.length === 0 && <div className="text-center text-zinc-500 py-10 text-xs font-bold uppercase tracking-widest">No entries found.</div>}
                                    {existingAlgos.map((algo) => (
                                        <motion.div whileHover={{ scale: 1.01 }} key={algo.id} onClick={() => loadAlgorithm(algo)} className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-sky-500/30 hover:bg-sky-500/10 cursor-pointer transition-all flex items-center justify-between group">
                                            <div><h4 className="font-bold text-zinc-100 group-hover:text-white mb-1.5 text-base tracking-tight">{algo.title}</h4><div className="flex items-center gap-4 text-xs font-semibold font-mono text-zinc-500 tracking-wide"><span className="flex items-center gap-1.5"><Hash size={12} className="text-zinc-600" /> {algo.id}</span><span className="flex items-center gap-1.5"><Clock size={12} className="text-zinc-600" /> {algo.timeComplexity}</span></div></div>
                                            <div className="p-2.5 rounded-lg bg-white/5 text-zinc-400 group-hover:bg-sky-500/20 group-hover:text-sky-400 transition-colors shadow-inner"><Edit3 size={18} /></div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}

                {showConfigModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-[#050505] border border-white/10 rounded-2xl p-8 shadow-2xl">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Github size={20} className="text-zinc-300" /> Git Integration</h3><button onClick={() => setShowConfigModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={18} className="text-zinc-500 hover:text-white" /></button></div>
                            <div className="space-y-5">
                                <div><label className={pLabel}>Gist ID</label><input value={gistConfig.id} onChange={(e) => setGistConfig({ ...gistConfig, id: e.target.value })} className={pInput} /></div>
                                <div><label className={pLabel}>Access Token</label><input type="password" value={gistConfig.token} onChange={(e) => setGistConfig({ ...gistConfig, token: e.target.value })} className={pInput} /></div>
                                <button onClick={() => { localStorage.setItem("algolib_gist_config", JSON.stringify(gistConfig)); setShowConfigModal(false); setStatusMsg("Config Saved"); setTimeout(() => setStatusMsg(""), 2000); }} className={`${pBtn} w-full bg-white text-black hover:bg-zinc-200 mt-2`}>Store Credentials</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showAddAdminPasscodeModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="w-full max-w-sm bg-[#050505] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                            <div className="flex flex-col items-center text-center mb-8 relative z-10"><div className="w-16 h-16 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-4 shadow-inner"><ShieldCheck size={28} className="text-emerald-400" /></div><h3 className="text-xl font-bold text-white mb-2">Authorization</h3><p className="text-xs text-zinc-400">Master passcode required.</p></div>
                            <div className="space-y-5 relative z-10">
                                <div><input type="password" value={adminPasscode} onChange={(e) => setAdminPasscode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeAddAdmin()} placeholder="••••••••" className="w-full bg-[#020202] border border-white/10 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.3em] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner transition-all font-mono" autoFocus /></div>
                                <div className="flex gap-3"><button onClick={() => setShowAddAdminPasscodeModal(false)} className={`${pBtn} flex-1 bg-white/5 text-zinc-300 hover:bg-white/10`}>Abort</button><button onClick={executeAddAdmin} disabled={!adminPasscode || isAddingAdmin} className={`${pBtn} flex-1 bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-50`}>{isAddingAdmin ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Authorize</button></div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Custom Modals */}
                {customAlert.isOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-[#050505] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 shadow-inner ${customAlert.type === 'error' ? 'bg-red-500/10 text-red-500' : customAlert.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-sky-500/10 text-sky-500'}`}>
                                {customAlert.type === 'error' ? <XCircle size={24} /> : customAlert.type === 'warning' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{customAlert.title || (customAlert.type === 'error' ? 'Error' : customAlert.type === 'warning' ? 'Warning' : 'Notice')}</h3>
                            <p className="text-xs text-zinc-400 font-medium mb-6">{customAlert.message}</p>
                            <button onClick={() => setCustomAlert({ ...customAlert, isOpen: false })} className={`${pBtn} w-full ${customAlert.type === 'error' ? 'bg-red-600 hover:bg-red-500 text-white' : customAlert.type === 'warning' ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-white text-black hover:bg-zinc-200'}`}>Acknowledge</button>
                        </motion.div>
                    </motion.div>
                )}

                {customConfirm.isOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-[#050505] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500 shadow-inner"><AlertTriangle size={24} /></div>
                            <h3 className="text-lg font-bold text-white mb-2">{customConfirm.title}</h3>
                            <p className="text-xs text-zinc-400 font-medium mb-6">{customConfirm.message}</p>
                            <div className="flex gap-3 w-full"><button onClick={() => setCustomConfirm({ ...customConfirm, isOpen: false })} className={`${pBtn} flex-1 bg-white/5 text-zinc-300 hover:bg-white/10`}>Abort</button><button onClick={() => { customConfirm.onConfirm(); setCustomConfirm({ ...customConfirm, isOpen: false }); }} className={`${pBtn} flex-1 bg-red-600 text-white hover:bg-red-500`}>Proceed</button></div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Mobile Sidebar */}
                {isMobileNavOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md xl:hidden">
                        <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute left-0 top-0 bottom-0 w-[75vw] max-w-[280px] bg-[#050505] border-r border-white/10 p-5 flex flex-col shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <div><h1 className="text-2xl font-bold tracking-tight text-white">HQ<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">.</span></h1></div>
                                <button onClick={() => setIsMobileNavOpen(false)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"><X size={18} className="text-zinc-400 hover:text-white" /></button>
                            </div>
                            <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar">
                                {[
                                    { id: 'forge', label: 'Data Forge', icon: Code }, { id: 'contests', label: 'Contests', icon: Trophy },
                                    { id: 'submissions', label: 'Telemetry', icon: FileText }, { id: 'moderation', label: 'Comms', icon: ShieldCheck },
                                    { id: 'broadcast', label: 'Broadcast', icon: Radio }, { id: 'insights', label: 'Insights', icon: BarChart3 },
                                    { id: 'admins', label: 'Security', icon: UserPlus }, { id: 'maintenance', label: 'Lockdown', icon: Construction },
                                    { id: 'credits', label: 'AI Credits', icon: Coins }, { id: 'mailroom', label: 'Mailroom', icon: Mail }
                                ].map(tab => (
                                    <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setIsMobileNavOpen(false); }} className={`flex items-center gap-3 px-4 py-3 w-full text-sm font-semibold rounded-xl transition-all ${activeTab === tab.id ? 'bg-white/10 text-white border border-white/10 shadow-inner' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'}`}>
                                        <tab.icon size={18} className={`${activeTab === tab.id ? 'text-sky-400' : ''}`} />
                                        <span className="uppercase tracking-wider text-[10px]">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-auto pt-5 border-t border-white/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center font-bold text-white text-xs">{user?.email?.charAt(0).toUpperCase()}</div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-bold text-white uppercase tracking-wider truncate">{user?.email}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></div>
                                            <span className="text-[9px] text-zinc-500 font-mono">SECURE LINK</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={logout} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold text-zinc-400 uppercase tracking-wider transition-colors">Terminate Session</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="pt-24 pb-16 px-4 md:px-6 max-w-[1400px] mx-auto relative z-10 flex flex-col xl:flex-row gap-6">

                <div className="xl:hidden flex items-center justify-between mb-6 bg-white/[0.02] backdrop-blur-xl p-4 rounded-xl border border-white/[0.08]">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-white">HQ<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">.</span></h1>
                    </div>
                    <button onClick={() => setIsMobileNavOpen(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors shadow-inner">
                        <AlignLeft size={20} className="text-white" />
                    </button>
                </div>

                <aside className="xl:w-64 shrink-0 hidden xl:block">
                    <div className="sticky top-28 flex flex-col gap-5">
                        <div className="mb-2">
                            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">HQ<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">.</span></h1>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Global Matrix Console</p>
                        </div>

                        <div className="bg-white/[0.02] backdrop-blur-xl p-3 rounded-2xl border border-white/[0.08] shadow-lg flex flex-col gap-1.5">
                            {[
                                { id: 'forge', label: 'Data Forge', icon: Code }, { id: 'contests', label: 'Contests', icon: Trophy },
                                { id: 'submissions', label: 'Telemetry', icon: FileText }, { id: 'moderation', label: 'Comms', icon: ShieldCheck },
                                { id: 'broadcast', label: 'Broadcast', icon: Radio }, { id: 'insights', label: 'Insights', icon: BarChart3 },
                                { id: 'admins', label: 'Security', icon: UserPlus }, { id: 'maintenance', label: 'Lockdown', icon: Construction },
                                { id: 'credits', label: 'AI Credits', icon: Coins }, { id: 'mailroom', label: 'Mailroom', icon: Mail }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative flex items-center gap-3 px-4 py-3 w-full text-xs font-semibold rounded-xl transition-all whitespace-nowrap overflow-hidden group ${activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>
                                    {activeTab === tab.id && <motion.div layoutId="sidebarGlow" className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent border-l-2 border-white rounded-xl" />}
                                    <tab.icon size={18} className={`relative z-10 transition-colors ${activeTab === tab.id ? 'text-sky-400' : 'group-hover:text-zinc-300'}`} />
                                    <span className="relative z-10 uppercase tracking-widest text-[10px]">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="bg-white/[0.02] backdrop-blur-xl p-4 rounded-2xl border border-white/[0.08] shadow-lg hidden xl:block">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center font-bold text-white text-xs shadow-inner">{user?.email?.charAt(0).toUpperCase()}</div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-bold text-white uppercase tracking-wider truncate">{user?.email}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></div>
                                        <span className="text-[9px] text-zinc-500 font-mono">SECURE LINK</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={logout} className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold text-zinc-400 uppercase tracking-widest transition-colors">Terminate Session</button>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <section className="flex-1 w-full min-w-0">
                    {activeTab === "forge" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-inner ${mode === 'create' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                        {mode} State
                                    </span>
                                    {statusMsg && <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider"><Check size={14} /> {statusMsg}</span>}
                                </div>
                                <div className="flex gap-2.5">
                                    <button onClick={() => setShowConfigModal(true)} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all" title="Repository Settings"><Settings size={18} /></button>
                                    <button onClick={() => { fetchFromGist().then((data) => { if (data) setShowLoadModal(true); }); }} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl transition-all text-xs font-bold uppercase tracking-widest">
                                        <CloudLightning size={16} className="text-sky-400" /> Fetch Origin
                                    </button>
                                    <button onClick={() => setShowPurgeModal(true)} className="p-2.5 bg-white/5 border border-white/10 text-zinc-400 hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-all" title="Clear Form"><RefreshCw size={18} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 2xl:grid-cols-[1.5fr_1fr] gap-6">
                                <div className={`space-y-8 p-6 md:p-8 ${pCard}`}>

                                    <div>
                                        <h3 className="text-xs font-bold text-white mb-6 flex items-center gap-2 pb-3 border-b border-white/[0.08] uppercase tracking-wider"><Database size={16} className="text-sky-400" /> Core Metadata</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div><label className={pLabel}>Protocol ID</label><div className="relative"><Hash size={16} className="absolute left-4 top-3 text-zinc-600" /><input disabled={mode === 'edit'} value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value })} className={`${pInput} pl-10 font-mono ${mode === 'edit' ? 'opacity-50 cursor-not-allowed bg-black/50' : ''}`} placeholder="algo_unique_id" /></div></div>
                                            <div><label className={pLabel}>Classification</label><input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={pInput} placeholder="e.g. Dynamic Programming" /></div>
                                        </div>
                                        <div><label className={pLabel}>Nomenclature</label><input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={`${pInput} text-base font-bold py-3`} placeholder="e.g. Dijkstra's Shortest Path" /></div>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold text-white mb-6 flex items-center gap-2 pb-3 border-b border-white/[0.08] uppercase tracking-wider"><Activity size={16} className="text-purple-400" /> Performance Bounds</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label className={pLabel}>Time Complexity</label>
                                                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">{COMPLEXITY_PRESETS.map(c => (<button key={c} onClick={() => setFormData({ ...formData, timeComplexity: c })} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-zinc-400 hover:text-white hover:bg-white/10 whitespace-nowrap transition-colors">{c}</button>))}</div>
                                                <input value={formData.timeComplexity} onChange={(e) => setFormData({ ...formData, timeComplexity: e.target.value })} className={`${pInput} font-mono font-semibold`} />
                                            </div>
                                            <div><label className={pLabel}>Space Complexity</label><div className="h-[42px] w-full"></div><input value={formData.spaceComplexity} onChange={(e) => setFormData({ ...formData, spaceComplexity: e.target.value })} className={`${pInput} font-mono font-semibold`} /></div>
                                        </div>
                                        <div>
                                            <label className={pLabel}>Taxonomy Tags</label>
                                            <div className="w-full bg-[#050505]/80 shadow-inner border border-white/10 rounded-xl px-4 py-3 flex flex-wrap gap-2 min-h-[56px] focus-within:border-sky-500/50 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
                                                {tags.map(tag => (<span key={tag} className="flex items-center gap-1.5 bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 shadow-sm">{tag} <X size={12} className="cursor-pointer hover:text-red-400 transition-colors opacity-70 hover:opacity-100" onClick={() => removeTag(tag)} /></span>))}
                                                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder={tags.length === 0 ? "Type and press Enter..." : ""} className="bg-transparent outline-none flex-1 text-sm text-zinc-200 min-w-[150px] placeholder:text-zinc-600 font-medium" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold text-white mb-6 flex items-center gap-2 pb-3 border-b border-white/[0.08] uppercase tracking-wider"><AlignLeft size={16} className="text-emerald-400" /> Literature</h3>
                                        <div className="space-y-6">
                                            <div><label className={pLabel}>Abstract</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className={`${pInput} resize-none leading-relaxed text-xs`} placeholder="Brief summary of the algorithm..." /></div>
                                            <div><label className={pLabel}>Manifest (Markdown)</label><textarea value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} rows={8} className={`${pInput} resize-y custom-scrollbar leading-relaxed font-mono text-xs`} placeholder="In-depth explanation, steps, edge cases..." /></div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold text-white mb-5 flex items-center gap-2 pb-3 border-b border-white/[0.08] uppercase tracking-wider"><Code size={16} className="text-rose-400" /> Source Code</h3>
                                        <div className="rounded-2xl border border-white/10 overflow-hidden shadow-xl bg-[#020202]">
                                            <div className="bg-zinc-900/80 px-4 py-3 flex items-center gap-2 border-b border-white/5 backdrop-blur-md">
                                                <div className="flex gap-1.5 mr-4">
                                                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                                                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                                                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                                                </div>
                                                <div className="flex gap-1.5">
                                                    {['java', 'cpp', 'python'].map(lang => (
                                                        <button key={lang} onClick={() => setActiveCodeTab(lang as any)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-widest ${activeCodeTab === lang ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>{lang}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="relative">
                                                {activeCodeTab === 'java' && <textarea value={formData.codeJava} onChange={(e) => setFormData({ ...formData, codeJava: e.target.value })} rows={12} className="w-full bg-transparent px-6 py-4 outline-none text-xs font-mono text-zinc-300 leading-relaxed custom-scrollbar transition-all" placeholder="// Java Implementation..." />}
                                                {activeCodeTab === 'cpp' && <textarea value={formData.codeCpp} onChange={(e) => setFormData({ ...formData, codeCpp: e.target.value })} rows={12} className="w-full bg-transparent px-6 py-4 outline-none text-xs font-mono text-zinc-300 leading-relaxed custom-scrollbar transition-all" placeholder="// C++ Implementation..." />}
                                                {activeCodeTab === 'python' && <textarea value={formData.codePython} onChange={(e) => setFormData({ ...formData, codePython: e.target.value })} rows={12} className="w-full bg-transparent px-6 py-4 outline-none text-xs font-mono text-zinc-300 leading-relaxed custom-scrollbar transition-all" placeholder="# Python Implementation..." />}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-white/[0.08]">
                                        <button onClick={generateJSON} className={`${pBtn} flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10 uppercase tracking-widest`}><FileJson size={16} className="text-zinc-400" /> Compile JSON</button>
                                        <button onClick={saveToGist} disabled={isLoading} className={`${pBtn} flex-1 uppercase tracking-widest ${mode === 'edit' ? 'bg-white text-black hover:bg-zinc-200' : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md'}`}>
                                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} {mode === 'edit' ? 'Commit Update' : 'Push to Origin'}
                                        </button>
                                    </div>
                                </div>

                                <div className={`${pCard} flex flex-col h-[700px] 2xl:sticky 2xl:top-28 p-0`}>
                                    <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-black/60 backdrop-blur-xl">
                                        <div className="flex items-center gap-2"><Terminal size={16} className="text-emerald-400" /><span className="text-[10px] font-bold text-white uppercase tracking-wider">Output Stream</span></div>
                                        {jsonOutput && <button onClick={() => { navigator.clipboard.writeText(jsonOutput); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-bold hover:bg-white/20 transition-all flex items-center gap-1.5 uppercase tracking-widest">{copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}</button>}
                                    </div>
                                    <div className="flex-1 bg-[#020202]/80 p-6 overflow-auto custom-scrollbar font-mono text-xs leading-relaxed shadow-inner">
                                        {jsonOutput ? <pre className="text-zinc-300 whitespace-pre-wrap">{jsonOutput}</pre> : <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-zinc-600"><Code size={36} className="opacity-20" /><p className="text-[10px] font-bold uppercase tracking-widest max-w-[150px]">Buffer empty.<br />Compile to preview.</p></div>}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "contests" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

                            {/* Top Control Bar */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                                        <Trophy size={24} className="text-purple-400 drop-shadow-[0_0_12px_rgba(192,132,252,0.4)]" /> Contest Forge
                                    </h2>
                                    <p className="text-xs font-medium text-zinc-400 mt-1">Orchestrate and deploy global coding competitions.</p>
                                </div>
                                <div className="flex gap-2 p-1.5 bg-black/60 backdrop-blur-xl rounded-[1rem] border border-white/10 shadow-inner">
                                    <button onClick={resetContestEditor} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold transition-all tracking-[0.2em] uppercase ${contestView === 'editor' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                                        Workshop
                                    </button>
                                    <button onClick={loadContestsManager} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold transition-all tracking-[0.2em] uppercase ${contestView === 'manager' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                                        Database
                                    </button>
                                </div>
                            </div>

                            {/* MANAGER VIEW */}
                            {contestView === "manager" ? (
                                <div className={`${pCard} p-6 md:p-8`}>
                                    <h3 className="text-xs font-bold text-white mb-6 border-b border-white/[0.08] pb-4 flex items-center gap-3 uppercase tracking-widest">
                                        <List size={18} className="text-purple-400" /> Deployed Environments
                                    </h3>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        {existingContests.length === 0 && (
                                            <div className="col-span-full py-16 text-center text-zinc-600 text-[10px] font-bold tracking-widest uppercase bg-[#020202] rounded-2xl border border-white/5">
                                                No deployments found in matrix.
                                            </div>
                                        )}
                                        {existingContests.map(c => (
                                            <div key={c.id} className="p-6 bg-[#050505] shadow-[inset_0_2px_10px_rgba(255,255,255,0.02)] border border-white/10 rounded-[1.5rem] hover:border-purple-500/30 hover:bg-white/[0.02] transition-all group flex flex-col justify-between">
                                                <div className="mb-6">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                                                            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Active</span>
                                                        </div>
                                                        <span className="text-[10px] font-medium font-mono text-zinc-500 uppercase bg-black px-2.5 py-1 rounded border border-white/5 shadow-inner">
                                                            ID: {c.id}
                                                        </span>
                                                    </div>
                                                    <p className="text-white font-bold text-xl tracking-tight leading-snug">{c.title}</p>
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                                                    <div className="text-[10px] font-mono text-zinc-500">
                                                        {new Date(c.start_time).toLocaleDateString()} — {new Date(c.end_time).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleEditContest(c)} className="p-2.5 bg-white/5 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 rounded-lg transition-colors shadow-sm">
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteContest(c.id)} className="p-2.5 bg-white/5 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors shadow-sm">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (

                                /* EDITOR WORKSHOP VIEW */
                                <div className={`space-y-6 p-6 md:p-8 ${pCard}`}>

                                    {/* Meta Configuration */}
                                    <div className="p-6 md:p-8 bg-[#050505] shadow-[inset_0_2px_15px_rgba(255,255,255,0.03)] border border-white/10 rounded-3xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 blur-[80px] pointer-events-none rounded-full"></div>
                                        <h3 className="text-xs font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-white/[0.08] uppercase tracking-widest relative z-10">
                                            <Calendar size={18} className="text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" /> Contest Meta
                                            {cId && <span className="text-[9px] bg-sky-500/10 text-sky-400 px-2.5 py-1 rounded font-bold ml-3 border border-sky-500/20 tracking-widest">EDITING ACTIVE</span>}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                            <div className="md:col-span-3">
                                                <label className={pLabel}>Global Title</label>
                                                <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} className={`${pInput} text-lg font-bold py-4`} placeholder="e.g. AlgoLib Weekly 15" />
                                            </div>
                                            <div>
                                                <label className={pLabel}>Initialization (Local Time)</label>
                                                <input type="datetime-local" value={cStart} onChange={(e) => setCStart(e.target.value)} className={`${pInput} [color-scheme:dark] font-mono text-xs`} />
                                            </div>
                                            <div>
                                                <label className={pLabel}>Termination (Local Time)</label>
                                                <input type="datetime-local" value={cEnd} onChange={(e) => setCEnd(e.target.value)} className={`${pInput} [color-scheme:dark] font-mono text-xs`} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Problems Configuration */}
                                    <div className="pt-4">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                            <h3 className="text-xs font-bold text-white flex items-center gap-3 uppercase tracking-widest">
                                                <Code size={18} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" /> Problem Matrix
                                            </h3>
                                            <button onClick={addProblem} className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm">
                                                <Plus size={14} /> Append Problem Node
                                            </button>
                                        </div>

                                        <div className="space-y-8">
                                            {problems.map((p, pIndex) => (
                                                <div key={pIndex} className="p-6 md:p-8 bg-[#020202] border border-white/10 rounded-3xl relative shadow-[0_10px_40px_rgba(0,0,0,0.6)]">

                                                    {/* Problem Node Header */}
                                                    <div className="flex items-center justify-between mb-8 pb-5 border-b border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white shadow-inner">P{pIndex + 1}</div>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Problem Node</span>
                                                        </div>
                                                        <button onClick={() => removeProblem(pIndex)} className="p-2 text-zinc-500 bg-white/5 border border-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 rounded-lg transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                                        <div className="lg:col-span-2">
                                                            <label className={pLabel}>Problem Title</label>
                                                            <input value={p.title} onChange={(e) => updateProblem(pIndex, 'title', e.target.value)} className={`${pInput} font-semibold`} placeholder="e.g. Reverse Linked List" />
                                                        </div>
                                                        <div>
                                                            <label className={pLabel}>Classification</label>
                                                            <select value={p.difficulty} onChange={(e) => updateProblem(pIndex, 'difficulty', e.target.value)} className={`${pInput} font-semibold uppercase tracking-widest text-[11px]`}>
                                                                <option value="Easy">EASY</option><option value="Medium">MEDIUM</option><option value="Hard">HARD</option>
                                                            </select>
                                                        </div>

                                                        {/* Markdown Inputs */}
                                                        <div className="lg:col-span-3 space-y-6 bg-white/[0.015] shadow-inner p-6 rounded-2xl border border-white/5">
                                                            <div><label className={pLabel}>1. Main Abstract (Markdown)</label><textarea value={p.description} onChange={(e) => updateProblem(pIndex, 'description', e.target.value)} rows={3} className={`${pInput} font-mono text-[11px] leading-relaxed`} placeholder="Main problem statement..." /></div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div><label className={pLabel}>2. Input Parameters</label><textarea value={p.inputFormat} onChange={(e) => updateProblem(pIndex, 'inputFormat', e.target.value)} rows={2} className={`${pInput} font-mono text-[11px] leading-relaxed`} placeholder="e.g. First line contains N..." /></div>
                                                                <div><label className={pLabel}>3. Expected Output</label><textarea value={p.outputFormat} onChange={(e) => updateProblem(pIndex, 'outputFormat', e.target.value)} rows={2} className={`${pInput} font-mono text-[11px] leading-relaxed`} placeholder="e.g. Print a single integer..." /></div>
                                                            </div>
                                                            <div><label className={pLabel}>4. System Constraints</label><textarea value={p.constraints} onChange={(e) => updateProblem(pIndex, 'constraints', e.target.value)} rows={2} className={`${pInput} font-mono text-[11px] leading-relaxed`} placeholder="e.g. 1 <= N <= 10^5" /></div>
                                                        </div>
                                                    </div>

                                                    {/* Test Cases Section */}
                                                    <div className="bg-[#050505] p-6 rounded-2xl border border-white/10 shadow-inner">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/[0.05]">
                                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                                                <Database size={16} className="text-zinc-500" /> Validation Suites (Test Cases)
                                                            </span>
                                                            <button onClick={() => addTestCase(pIndex)} className="text-[9px] font-bold uppercase tracking-widest bg-white/10 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors border border-white/10 shadow-sm">
                                                                + Append Case
                                                            </button>
                                                        </div>

                                                        <div className="space-y-5">
                                                            {p.testCases.map((tc, tcIndex) => (
                                                                // Nested child node styling with left border highlight
                                                                <div key={tcIndex} className="p-6 bg-[#020202] border-l-2 border-l-sky-500 border border-white/5 rounded-xl relative hover:border-white/20 transition-colors shadow-sm">
                                                                    <button onClick={() => removeTestCase(pIndex, tcIndex)} className="absolute top-4 right-4 text-zinc-600 hover:text-red-400 p-1.5 bg-white/5 rounded-md hover:bg-red-500/10 transition-colors">
                                                                        <X size={14} />
                                                                    </button>

                                                                    {/* Premium Toggles */}
                                                                    <div className="flex flex-wrap gap-6 mb-6 mt-1">
                                                                        <label className="flex items-center gap-3 cursor-pointer group">
                                                                            <div className="relative">
                                                                                <input type="checkbox" className="sr-only peer" checked={tc.isPublic} onChange={(e) => updateTestCase(pIndex, tcIndex, 'isPublic', e.target.checked)} />
                                                                                <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-sky-500"></div>
                                                                            </div>
                                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200">Public Visible</span>
                                                                        </label>
                                                                        <label className="flex items-center gap-3 cursor-pointer group">
                                                                            <div className="relative">
                                                                                <input type="checkbox" className="sr-only peer" checked={tc.hasMultipleAnswers} onChange={(e) => updateTestCase(pIndex, tcIndex, 'hasMultipleAnswers', e.target.checked)} />
                                                                                <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-sky-500"></div>
                                                                            </div>
                                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200">Multi-Answer</span>
                                                                        </label>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                                                                        <div><label className={pLabel}>Display Input (For users)</label><textarea value={tc.displayInput} onChange={(e) => updateTestCase(pIndex, tcIndex, 'displayInput', e.target.value)} className={`${pInput} font-mono text-[11px] p-3 leading-relaxed`} rows={2} /></div>
                                                                        <div><label className={pLabel}>Raw Stdin (For compiler)</label><textarea value={tc.rawInput} onChange={(e) => updateTestCase(pIndex, tcIndex, 'rawInput', e.target.value)} className={`${pInput} font-mono text-[11px] p-3 leading-relaxed`} rows={2} /></div>
                                                                        <div><label className={pLabel}>Expected Output</label><textarea value={tc.expected} onChange={(e) => updateTestCase(pIndex, tcIndex, 'expected', e.target.value)} className={`${pInput} font-mono text-[11px] p-3 leading-relaxed border-sky-500/20 focus:border-sky-500/50`} rows={2} placeholder={tc.hasMultipleAnswers ? "Answer1 ||| Answer2" : "Expected Output"} /></div>
                                                                        <div><label className={pLabel}>Context / Explanation</label><textarea value={tc.explanation} onChange={(e) => updateTestCase(pIndex, tcIndex, 'explanation', e.target.value)} className={`${pInput} text-[11px] p-3 custom-scrollbar leading-relaxed`} rows={2} placeholder="Explanation (Markdown supported)" /></div>
                                                                    </div>

                                                                    {/* Premium File Dropzone UI */}
                                                                    <div>
                                                                        <label className={pLabel}>Visual Aid (Optional Image)</label>
                                                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
                                                                            <label className="relative flex-1 flex items-center justify-center px-4 py-4 border-2 border-dashed border-white/10 rounded-xl hover:border-sky-500/40 hover:bg-sky-500/5 transition-all cursor-pointer bg-[#050505] group">
                                                                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { setStatusMsg("Uploading..."); try { const url = await uploadToCloudinary(file); updateTestCase(pIndex, tcIndex, 'imageUrl', url); setStatusMsg("Saved!"); } catch (e) { setCustomAlert({ isOpen: true, message: "Upload Failed.", type: "error" }); setStatusMsg(""); } setTimeout(() => setStatusMsg(""), 3000); } }} />
                                                                                <div className="flex items-center gap-3 text-zinc-500 group-hover:text-sky-400 transition-colors">
                                                                                    <CloudLightning size={18} />
                                                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Click to Upload Image</span>
                                                                                </div>
                                                                            </label>

                                                                            {tc.imageUrl && (
                                                                                <div className="relative group border border-white/10 rounded-xl p-1.5 bg-[#050505] shrink-0 shadow-inner">
                                                                                    <img src={tc.imageUrl} className="h-14 w-14 rounded-lg object-cover" alt="Preview" />
                                                                                    <button onClick={() => updateTestCase(pIndex, tcIndex, 'imageUrl', '')} className="absolute -top-2.5 -right-2.5 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                                                                                        <X size={12} />
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

                                    <div className="pt-8 mt-8 border-t border-white/[0.08]">
                                        <button onClick={handleDeployContest} disabled={isDeployingContest} className="w-full py-4 bg-gradient-to-r from-white to-zinc-300 text-black hover:scale-[1.01] font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] flex justify-center items-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50">
                                            {isDeployingContest ? <Loader2 className="animate-spin" size={18} /> : <CloudLightning size={18} />}
                                            {cId ? "Patch Global Matrix" : "Deploy to Global Matrix"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "submissions" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div className={`p-6 md:p-8 ${pCard}`}>
                                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight"><FileText size={24} className="text-sky-400" /> Execution Logs</h2>
                                        <p className="text-xs text-zinc-400 mt-1 font-medium">Monitor sandbox executions and algorithm integrity.</p>
                                    </div>
                                    <select value={selectedSubContest} onChange={(e) => setSelectedSubContest(e.target.value)} className={`${pInput} w-full xl:w-80 font-semibold uppercase tracking-wider text-[11px]`}>
                                        <option value="" disabled>Select Target Deployment...</option>
                                        {existingContests.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
                                    </select>
                                </div>

                                {selectedSubContest && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                                        <div className="bg-[#050505]/80 shadow-inner border border-white/10 rounded-xl p-6 flex items-center justify-between"><div className="space-y-1"><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Transmissions</p><h4 className="text-2xl font-bold text-white">{submissionsData.length}</h4></div><Terminal size={28} className="text-zinc-800" /></div>
                                        <div className="bg-emerald-950/20 shadow-inner border border-emerald-500/20 rounded-xl p-6 flex items-center justify-between"><div className="space-y-1"><p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-wider">Valid Outputs</p><h4 className="text-2xl font-bold text-emerald-400">{submissionsData.filter(s => s.passed).length}</h4></div><CheckCircle2 size={28} className="text-emerald-500/20" /></div>
                                        <div className="bg-rose-950/20 shadow-inner border border-rose-500/20 rounded-xl p-6 flex items-center justify-between"><div className="space-y-1"><p className="text-[10px] text-rose-500/70 font-bold uppercase tracking-wider">Failed Outputs</p><h4 className="text-2xl font-bold text-rose-400">{submissionsData.filter(s => !s.passed).length}</h4></div><XCircle size={28} className="text-rose-500/20" /></div>
                                    </div>
                                )}
                                <div className="relative w-full group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} /><input type="text" placeholder="Search by signature, problem, or environment..." className={`${pInput} pl-12`} value={subSearchQuery} onChange={(e) => setSubSearchQuery(e.target.value)} disabled={!selectedSubContest} /></div>
                            </div>

                            <div className={`${pCard} p-0 overflow-hidden`}>
                                <div className="overflow-x-auto min-h-[400px]">
                                    <table className="w-full text-left border-collapse min-w-[900px]">
                                        <thead>
                                            <tr className="bg-black/80 border-b border-white/[0.08] text-zinc-500 text-[10px] uppercase tracking-wider font-bold">
                                                <th className="p-4 pl-6">Timestamp</th><th className="p-4">Origin Signature</th><th className="p-4">Target Module</th><th className="p-4 text-center">Env</th><th className="p-4 text-center">Result</th><th className="p-4 text-center">Rating</th><th className="p-4 text-center">Latency</th><th className="p-4 pr-6 text-right">Inspect</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 bg-transparent text-sm">
                                            {!selectedSubContest ? (<tr><td colSpan={8} className="p-16 text-center text-zinc-600"><Terminal size={36} className="mx-auto mb-4 opacity-20" /><p className="font-semibold tracking-wide text-xs">Awaiting deployment selection.</p></td></tr>)
                                                : isSubsLoading ? (<tr><td colSpan={8} className="p-16 text-center text-zinc-500"><Loader2 size={36} className="mx-auto mb-4 animate-spin text-sky-400" /><p className="font-semibold tracking-wide text-xs">Retrieving logs...</p></td></tr>)
                                                    : filteredSubmissions.length > 0 ? (
                                                        filteredSubmissions.map((sub) => (
                                                            <tr key={sub.id} className="hover:bg-white/[0.03] transition-colors group">
                                                                <td className="p-4 pl-6 text-zinc-400 text-[11px] font-semibold">{new Date(sub.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                                                <td className="p-4"><span className="font-mono text-zinc-300 text-[11px] bg-black/50 px-2 py-1 rounded border border-white/5">{sub.user_uid.substring(0, 12)}...</span></td>
                                                                <td className="p-4"><span className="font-bold text-white text-sm">{sub.problemTitle}</span></td>
                                                                <td className="p-4 text-center"><span className="px-2 py-1 bg-white/10 border border-white/10 rounded text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{sub.language}</span></td>
                                                                <td className="p-4 text-center">{sub.passed ? (<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-wider"><CheckCircle2 size={12} /> ACCEPTED</span>) : (<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 uppercase tracking-wider"><XCircle size={12} /> REJECTED</span>)}</td>
                                                                <td className="p-4 text-center font-mono font-bold text-zinc-200 text-sm">{sub.score_awarded}</td>
                                                                <td className="p-4 text-center font-mono font-medium text-zinc-500 text-[11px]">{formatDuration(sub.time_taken_seconds)}</td>
                                                                <td className="p-4 pr-6 text-right"><button onClick={() => setViewingCodeInfo(sub)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors"><Code2 size={14} /> View</button></td>
                                                            </tr>
                                                        ))
                                                    ) : (<tr><td colSpan={8} className="p-16 text-center text-zinc-600"><Search size={36} className="mx-auto mb-4 opacity-20" /><p className="font-semibold tracking-wide text-xs">No matching signatures.</p></td></tr>)}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "moderation" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[{ title: "Active Threads", val: totalPosts, icon: MessageSquare }, { title: "Total Responses", val: totalReplies, icon: Users }, { title: "Network Events", val: totalInteractions, icon: Activity }].map((stat, i) => (
                                    <div key={i} className={`${pCard} p-6 flex items-center gap-5`}>
                                        <div className="p-4 bg-white/5 text-white rounded-xl border border-white/10 shadow-inner"><stat.icon size={24} /></div>
                                        <div><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">{stat.title}</p><h3 className="text-2xl font-bold text-white tracking-tight">{stat.val}</h3></div>
                                    </div>
                                ))}
                            </div>

                            <div className={`${pCard} p-0 overflow-hidden flex flex-col`}>
                                <div className="p-6 border-b border-white/[0.08] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 bg-black/60 backdrop-blur-xl">
                                    <h2 className="font-bold text-white flex items-center gap-2 text-lg tracking-tight uppercase"><ShieldCheck size={20} className="text-emerald-400" /> Comms Queue</h2>
                                    <div className="relative w-full sm:w-[350px] group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} /><input type="text" placeholder="Scan network chatter..." className={`${pInput} pl-10 text-xs`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                                </div>

                                <div className="overflow-x-auto min-h-[400px]">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead><tr className="bg-black/80 border-b border-white/[0.08] text-zinc-500 text-[10px] uppercase tracking-wider font-bold"><th className="p-5 pl-6 w-2/5">Transmission Body</th><th className="p-5">Origin</th><th className="p-5 text-center">Engagement</th><th className="p-5">Timestamp</th><th className="p-5 pr-6 text-right">Execute</th></tr></thead>
                                        <tbody className="divide-y divide-white/5 bg-transparent">
                                            {filteredPosts.length > 0 ? filteredPosts.map((post) => (
                                                <React.Fragment key={post.id}>
                                                    <tr className="hover:bg-white/[0.03] transition-colors group">
                                                        <td className="p-5 pl-6"><p className="font-bold text-white mb-1.5 text-sm line-clamp-1">{post.title}</p><p className="text-[12px] text-zinc-400 font-medium line-clamp-1">{post.body}</p></td>
                                                        <td className="p-5"><div className="flex flex-col"><span className="font-semibold text-sm text-zinc-200 mb-1">{post.authorName}</span><span className="text-[10px] text-zinc-500 font-mono bg-black shadow-inner px-2 py-0.5 rounded border border-white/5 w-fit">ID: {post.authorId.substring(0, 8)}</span></div></td>
                                                        <td className="p-5"><div className="flex items-center justify-center gap-3 text-xs font-bold text-zinc-400"><span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md" title="Upvotes"><ChevronUp size={14} /> {post.upvotes?.length || 0}</span><button onClick={() => post.replies?.length > 0 && setExpandedPostId(expandedPostId === post.id ? null : post.id)} className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all border ${post.replies?.length > 0 ? 'hover:bg-white/10 cursor-pointer text-zinc-200 bg-white/5 border-white/10' : 'opacity-40 cursor-default bg-transparent border-transparent'} ${expandedPostId === post.id ? 'bg-white/20 text-white border-white/30' : ''}`}><MessageSquare size={14} /> {post.replies?.length || 0}</button></div></td>
                                                        <td className="p-5 text-zinc-500 text-[11px] font-medium">{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Just now"}</td>
                                                        <td className="p-5 pr-6 text-right"><button onClick={() => handleDeletePost(post.id)} disabled={isDeleting === post.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50 border border-transparent hover:border-red-500/30">{isDeleting === post.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Purge</button></td>
                                                    </tr>
                                                    {expandedPostId === post.id && post.replies && post.replies.length > 0 && (
                                                        <tr className="bg-black/60 border-b border-white/[0.08] relative shadow-inner">
                                                            <td colSpan={5} className="p-0"><div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-white/20 to-transparent rounded-full" /><div className="p-8 pl-14 space-y-4">
                                                                {post.replies.map(reply => (
                                                                    <div key={reply.id} className="flex items-start justify-between bg-[#050505] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
                                                                        <div className="flex items-start gap-4 flex-1"><img src={reply.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${reply.authorName}`} alt="avatar" className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 shadow-inner" /><div className="flex-1 pr-6"><div className="flex items-center gap-3 mb-2"><span className="text-sm font-bold text-white">{reply.authorName}</span><span className="text-[10px] text-zinc-500 font-mono bg-black px-1.5 py-0.5 border border-white/5 rounded">ID: {reply.authorId.substring(0, 6)}</span></div><p className="text-xs text-zinc-400 font-medium leading-relaxed">{reply.content}</p></div></div>
                                                                        <button onClick={() => handleDeleteReply(post.id, reply.id)} disabled={isDeleting === `reply-${reply.id}`} className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors bg-white/5">{isDeleting === `reply-${reply.id}` ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</button>
                                                                    </div>
                                                                ))}
                                                            </div></td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            )) : (<tr><td colSpan={5} className="p-16 text-center"><div className="flex flex-col items-center justify-center text-zinc-600"><ShieldCheck size={36} className="mb-4 opacity-20" /><p className="text-xs font-bold tracking-widest uppercase">All clear.</p></div></td></tr>)}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "broadcast" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-5xl mx-auto">

                            {/* Header Area */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                                        <Radio size={24} className="text-sky-400" /> Global Transmission
                                    </h2>
                                    <p className="text-sm font-medium text-zinc-400 mt-1">Force-push real-time alerts to all connected client interfaces.</p>
                                </div>
                                <button
                                    onClick={handleSaveBroadcast}
                                    disabled={isSavingBroadcast}
                                    className="py-2.5 px-6 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg"
                                >
                                    {isSavingBroadcast ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                    Commit Changes
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                {/* Left Column: Controls (Takes up 2/3 space) */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className={`${pCard} p-0 divide-y divide-white/5`}>

                                        {/* Status Toggle */}
                                        <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-sm font-bold text-white mb-1">Transmission Status</h4>
                                                <p className="text-xs text-zinc-500">Toggle whether the banner is visible to the public.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={broadcastActive}
                                                    onChange={(e) => setBroadcastActive(e.target.checked)}
                                                />
                                                <div className="w-14 h-8 bg-[#050505] rounded-full peer border border-white/10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]
                                                                peer-checked:bg-gradient-to-r peer-checked:from-sky-400 peer-checked:to-indigo-500 
                                                                after:content-[''] after:absolute after:top-1 after:left-1 
                                                                after:bg-zinc-600 peer-checked:after:bg-white after:rounded-full 
                                                                after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-6 
                                                                after:shadow-md"></div>
                                                <span className="ml-4 mr-2 text-[11px] font-black text-white uppercase tracking-widest drop-shadow-md">
                                                    {broadcastActive ? 'Online' : 'Offline'}
                                                </span>
                                            </label>
                                        </div>

                                        {/* Threat Level */}
                                        <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                            <div className="sm:w-1/2">
                                                <h4 className="text-sm font-bold text-white mb-1">Severity Level</h4>
                                                <p className="text-xs text-zinc-500">Determines the color and icon of the banner.</p>
                                            </div>
                                            <div className="flex gap-2 bg-[#020202] shadow-inner p-1.5 rounded-xl border border-white/10 sm:w-1/2 w-full">
                                                <button onClick={() => setBroadcastType("info")} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider ${broadcastType === 'info' ? 'bg-sky-500/20 text-sky-400 shadow-sm border border-sky-500/30' : 'text-zinc-600 hover:text-white hover:bg-white/5'}`}>Info</button>
                                                <button onClick={() => setBroadcastType("warning")} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider ${broadcastType === 'warning' ? 'bg-amber-500/20 text-amber-400 shadow-sm border border-amber-500/30' : 'text-zinc-600 hover:text-white hover:bg-white/5'}`}>Warn</button>
                                                <button onClick={() => setBroadcastType("critical")} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider ${broadcastType === 'critical' ? 'bg-red-500/20 text-red-400 shadow-sm border border-red-500/30' : 'text-zinc-600 hover:text-white hover:bg-white/5'}`}>Critical</button>
                                            </div>
                                        </div>

                                        {/* Payload Message */}
                                        <div className="p-6 md:p-8">
                                            <div className="flex justify-between items-end mb-3">
                                                <div>
                                                    <h4 className="text-sm font-bold text-white mb-1">Payload Message</h4>
                                                    <p className="text-xs text-zinc-500">Keep it concise and clear.</p>
                                                </div>
                                                <span className="text-[10px] font-bold text-zinc-600 tracking-widest">{broadcastMsg.length}/120</span>
                                            </div>
                                            <textarea
                                                value={broadcastMsg}
                                                onChange={(e) => setBroadcastMsg(e.target.value)}
                                                className={`${pInput} font-medium resize-none text-sm leading-relaxed`}
                                                placeholder="e.g. Scheduled maintenance at 00:00 UTC."
                                                maxLength={120}
                                                rows={2}
                                            />
                                        </div>

                                        {/* Hyperlink */}
                                        <div className="p-6 md:p-8">
                                            <h4 className="text-sm font-bold text-white mb-1">Action URL (Optional)</h4>
                                            <p className="text-xs text-zinc-500 mb-3">Where should the user go when they click the banner?</p>
                                            <input
                                                value={broadcastLink}
                                                onChange={(e) => setBroadcastLink(e.target.value)}
                                                className={`${pInput} font-mono text-xs`}
                                                placeholder="https://algolib.com/changelog"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Live Preview (Takes up 1/3 space) */}
                                <div className="lg:col-span-1">
                                    <div className={`${pCard} p-0 sticky top-28`}>
                                        <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-black/40">
                                            <Eye size={14} className="text-zinc-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Client Preview</span>
                                        </div>

                                        {/* Mock Browser UI */}
                                        <div className="bg-[#0a0a0a] min-h-[300px] flex flex-col relative">
                                            {/* Browser Top Bar */}
                                            <div className="flex items-center gap-1.5 p-3 border-b border-white/5 bg-[#050505]">
                                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                                                <div className="ml-4 flex-1 h-4 bg-white/5 rounded-full" />
                                            </div>

                                            {/* Banner Preview */}
                                            <div className="flex-1 bg-[linear-gradient(45deg,#050505_25%,transparent_25%,transparent_75%,#050505_75%,#050505),linear-gradient(45deg,#050505_25%,transparent_25%,transparent_75%,#050505_75%,#050505)] bg-[size:16px_16px] bg-[position:0_0,8px_8px]">
                                                {broadcastActive ? (
                                                    <div className={`w-full py-3 px-4 text-center flex flex-col items-center justify-center gap-2 transition-colors border-b ${broadcastType === 'info' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : broadcastType === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                        <div className="flex items-center gap-2 font-bold text-xs">
                                                            {broadcastType === 'warning' || broadcastType === 'critical' ? <AlertTriangle size={14} /> : <Megaphone size={14} />}
                                                            <span className="truncate max-w-[200px]">{broadcastMsg || "Preview text..."}</span>
                                                        </div>
                                                        {broadcastLink && (
                                                            <span className="flex items-center gap-1 underline underline-offset-2 opacity-80 text-[10px] font-bold">
                                                                Learn More <ExternalLink size={10} />
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                                        <Radio size={24} className="text-zinc-700 mb-2" />
                                                        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-600">Transmission Offline</p>
                                                        <p className="text-[10px] text-zinc-700 mt-1">Banner is hidden from users.</p>
                                                    </div>
                                                )}

                                                {/* Fake Website Content Below Banner */}
                                                <div className="p-4 opacity-20">
                                                    <div className="w-1/3 h-3 bg-white/20 rounded mb-4" />
                                                    <div className="w-3/4 h-2 bg-white/10 rounded mb-2" />
                                                    <div className="w-2/3 h-2 bg-white/10 rounded mb-2" />
                                                    <div className="w-4/5 h-2 bg-white/10 rounded" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    )}

                    {activeTab === "insights" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            {isInsightsLoading ? (
                                <div className={`${pCard} h-[400px] flex flex-col items-center justify-center gap-4 text-zinc-500`}>
                                    <Loader2 size={40} className="animate-spin text-sky-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Processing Telemetry...</span>
                                </div>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/[0.02] backdrop-blur-xl p-5 md:p-6 rounded-2xl border border-white/[0.08] shadow-sm gap-4">
                                        <h2 className="text-xl font-bold text-white flex items-center gap-3 tracking-tight uppercase">
                                            <Database size={24} className="text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]" /> Analytics Engine
                                        </h2>
                                        <button onClick={exportInsightsToCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] uppercase font-bold transition-all border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] tracking-wider w-full sm:w-auto justify-center">
                                            <Download size={14} /> Export Telemetry
                                        </button>
                                    </div>

                                    {/* KPI Metrics Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                        {[
                                            { title: "Total Site Hits", val: siteVisits, icon: Eye, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", desc: "Cumulative requests" },
                                            { title: "Network Nodes", val: aggregatedActivityData.totalUsersWithData, icon: Users, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", desc: "Registered signatures" },
                                            { title: "Compute Mins", val: aggregatedActivityData.totalPlatformMinutes, icon: Activity, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", desc: "Total session duration" },
                                            { title: "Engagement Ratio", val: aggregatedActivityData.totalUsersWithData > 0 ? (aggregatedActivityData.totalPlatformMinutes / aggregatedActivityData.totalUsersWithData).toFixed(1) : 0, icon: Clock, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", desc: "Avg mins per node" }
                                        ].map((stat, i) => (
                                            <div key={i} className={`${pCard} p-5 group hover:bg-white/[0.03] transition-colors cursor-default`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{stat.title}</p>
                                                    <div className={`p-2 rounded-lg border ${stat.bg} ${stat.border} ${stat.color} group-hover:scale-110 transition-transform`}>
                                                        <stat.icon size={16} />
                                                    </div>
                                                </div>
                                                <h3 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">{stat.val}</h3>
                                                <p className="text-[10px] font-medium text-zinc-500 mt-1 uppercase tracking-wider">{stat.desc}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Charts Grid */}
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        {/* Gradient Bar Chart */}
                                        <div className={`${pCard} p-6`}>
                                            <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 tracking-wider uppercase">
                                                <BarChart3 size={18} className="text-sky-400" /> Traffic Distribution
                                            </h3>
                                            <div className="h-72 w-full text-[10px] font-mono">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={aggregatedActivityData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                                                        <defs>
                                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                                                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.2} />
                                                            </linearGradient>
                                                        </defs>
                                                        <XAxis dataKey="name" stroke="#3f3f46" tick={{ fill: '#71717a', fontWeight: 600 }} angle={-45} textAnchor="end" interval={0} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#3f3f46" tick={{ fill: '#71717a', fontWeight: 600 }} tickLine={false} axisLine={false} />
                                                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                                                        <Bar dataKey="value" radius={[6, 6, 0, 0]} name="MINUTES" fill="url(#colorValue)" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Sleek Donut Chart */}
                                        <div className={`${pCard} p-6`}>
                                            <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 tracking-wider uppercase">
                                                <PieChartIcon size={18} className="text-indigo-400" /> Time Allocation
                                            </h3>
                                            <div className="h-72 w-full text-[10px] font-mono flex items-center justify-center relative">
                                                {/* Inner ambient glow */}
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_60%)] pointer-events-none" />
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={aggregatedActivityData.chartData} cx="50%" cy="50%" innerRadius={85} outerRadius={110} paddingAngle={3} dataKey="value" stroke="rgba(0,0,0,0)">
                                                            {aggregatedActivityData.chartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                {/* Centered Donut Label */}
                                                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                                                    <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Total</span>
                                                    <span className="text-2xl font-black text-white">{aggregatedActivityData.totalPlatformMinutes}m</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Node Inspector with Visual Progress Bars */}
                                    <div className={`${pCard} p-0 overflow-hidden`}>
                                        <div className="p-6 border-b border-white/[0.08] bg-black/40 backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-wider uppercase">
                                                <UserIcon size={18} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]" /> Node Inspector
                                            </h3>
                                            <div className="relative w-full sm:w-[350px] group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                                <input type="text" placeholder="Scan node signature (email)..." className={`${pInput} pl-10 text-xs`} value={insightSearchEmail} onChange={(e) => setInsightSearchEmail(e.target.value)} />
                                            </div>
                                        </div>

                                        {insightSearchEmail.trim() === "" ? (
                                            <div className="py-20 text-center text-zinc-600 text-[10px] font-bold tracking-widest uppercase bg-[#020202]">
                                                Awaiting target parameter.
                                            </div>
                                        ) : searchedUserStats ? (
                                            <div className="p-6 md:p-8 space-y-6 bg-[#020202]">
                                                {/* User Profile Header */}
                                                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-[#050505] shadow-inner border border-white/5 rounded-2xl p-6">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-black rounded-xl flex items-center justify-center border border-white/10 shadow-md shrink-0">
                                                        <span className="text-white font-bold text-xl">{searchedUserStats.displayName?.charAt(0) || 'U'}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-white font-bold text-lg tracking-tight mb-1">{searchedUserStats.displayName || 'Anonymous'}</h4>
                                                        <p className="text-xs font-medium font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded w-fit border border-white/5">{searchedUserStats.email}</p>
                                                    </div>
                                                    <div className="w-full md:w-px h-px md:h-12 bg-white/[0.08] my-2 md:my-0" />
                                                    <div className="flex flex-col sm:flex-row gap-6 text-xs">
                                                        <div>
                                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Uptime</span>
                                                            <span className="text-white font-bold text-lg">{searchedUserStats.lifetimeActiveTimeMins?.toFixed(2) || 0} <span className="text-[10px] text-zinc-500">MIN</span></span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Last Ping</span>
                                                            <span className="text-white font-bold text-base">{searchedUserStats.lastActiveDate?.toDate ? searchedUserStats.lastActiveDate.toDate().toLocaleDateString() : 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Visual Activity Breakdown (Progress Bars instead of Table) */}
                                                <div className="bg-[#050505] border border-white/[0.08] rounded-2xl p-6 shadow-inner">
                                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Activity Vector Distribution</h4>
                                                    <div className="space-y-5">
                                                        {(() => {
                                                            const usage = searchedUserStats.activityUsage || {};
                                                            const hasBreakdown = Object.keys(usage).length > 0;
                                                            const totalMins = Number(searchedUserStats.lifetimeActiveTimeMins) || 0;

                                                            if (!hasBreakdown && totalMins <= 0) {
                                                                return <p className="text-center text-zinc-600 text-[10px] font-bold tracking-wider uppercase py-6">No processes logged.</p>;
                                                            }

                                                            // Create a display object: Use breakdown if it exists, otherwise use fallback
                                                            const displayData = hasBreakdown ? usage : { 'General Sandbox': totalMins };
                                                            const values = Object.values(displayData).map(v => Number(v) || 0);
                                                            const maxTime = Math.max(...values, 1);

                                                            return Object.entries(displayData)
                                                                .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
                                                                .map(([activity, time], idx) => {
                                                                    const timeNum = Number(time) || 0;
                                                                    const widthPercent = Math.max((timeNum / maxTime) * 100, 2); // Min 2% width

                                                                    return (
                                                                        <div key={idx} className="group">
                                                                            <div className="flex justify-between items-end mb-1.5">
                                                                                <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">{activity}</span>
                                                                                <span className="text-[11px] font-mono font-bold text-zinc-400">{timeNum.toFixed(2)}m</span>
                                                                            </div>
                                                                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                                                                                <motion.div
                                                                                    initial={{ width: 0 }}
                                                                                    animate={{ width: `${widthPercent}%` }}
                                                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                                                    className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full relative"
                                                                                >
                                                                                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 rounded-full blur-[2px]"></div>
                                                                                </motion.div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                });
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-20 text-center text-zinc-600 text-[10px] font-bold tracking-widest uppercase bg-[#020202]">
                                                Signature "{insightSearchEmail}" not found in matrix.
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "maintenance" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-4xl mx-auto">
                            <div className={`${pCard} border-rose-500/20 shadow-xl space-y-8 p-6 md:p-8 relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-600/10 blur-[100px] pointer-events-none rounded-full"></div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/[0.08] relative z-10 gap-5">
                                    <div><h2 className="text-2xl font-bold text-rose-400 flex items-center gap-3 tracking-tight"><Construction size={24} /> Firewall & Lockdown</h2><p className="text-xs font-medium text-zinc-400 mt-1">Selectively restrict public access to modules during active deployments.</p></div>
                                    {statusMsg && <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20"><Check size={14} /> {statusMsg}</span>}
                                </div>

                                <div className="relative z-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {SYSTEM_MODULES.map(module => {
                                            const isLocked = maintainedRoutes.includes(module.id);
                                            return (
                                                <div key={module.id} onClick={() => toggleMaintenanceRoute(module.id)} className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${isLocked ? 'bg-rose-950/40 border-rose-500/50 shadow-[inset_0_0_20px_rgba(244,63,94,0.1)] backdrop-blur-md' : 'bg-[#050505] shadow-inner border-white/10 hover:border-white/30 hover:bg-white/[0.04]'}`}>
                                                    <div className="flex flex-col"><span className={`font-bold text-sm tracking-tight ${isLocked ? 'text-rose-400' : 'text-zinc-200'}`}>{module.name}</span><span className="text-[10px] font-mono font-medium text-zinc-500 mt-1.5 bg-black px-1.5 py-0.5 rounded w-fit border border-white/5">{module.id}</span></div>
                                                    <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors shadow-inner ${isLocked ? 'bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.5)]' : 'bg-zinc-800 border border-white/5'}`}><div className={`w-4 h-4 rounded-full bg-white transition-transform ${isLocked ? 'translate-x-6 shadow-sm' : 'translate-x-0 opacity-50'}`} /></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-rose-950/20 border border-rose-500/20 p-6 rounded-xl flex flex-col md:flex-row items-start gap-4 relative z-10 shadow-inner backdrop-blur-md">
                                    <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20 shrink-0"><AlertTriangle className="text-rose-400" size={24} /></div>
                                    <div><h4 className="text-base font-bold text-rose-400 mb-2 tracking-tight">Critical Impact Warning</h4><p className="text-xs text-zinc-300 font-medium leading-relaxed">Modules toggled to active lockdown will instantly intercept standard traffic and route to the Maintenance Vault. Security clearances (Admins via <span className="font-mono text-[10px] bg-black px-2 py-1 rounded text-white border border-white/10 shadow-inner font-bold">/hq</span>) automatically bypass this firewall.</p></div>
                                </div>

                                <button onClick={handleSaveMaintenance} disabled={isSavingMaintenance} className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:scale-[1.01] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 relative z-10 tracking-widest uppercase">{isSavingMaintenance ? <Loader2 size={20} className="animate-spin" /> : <ShieldAlert size={20} />} Enforce Security Policies</button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "admins" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-4xl mx-auto">
                            <div className={`${pCard} p-6 md:p-8 space-y-8`}>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/[0.08] gap-5">
                                    <div><h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight"><ShieldCheck size={24} className="text-emerald-400" /> Security Matrix</h2><p className="text-xs font-medium text-zinc-400 mt-1">Manage global access rights and review authorization audit trails.</p></div>
                                    {statusMsg && <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20"><Check size={14} /> {statusMsg}</span>}
                                </div>

                                <div className="p-6 bg-[#050505] shadow-inner border border-white/10 rounded-2xl flex flex-col lg:flex-row items-end gap-5">
                                    <div className="flex-1 w-full"><label className={pLabel}>Grant Access via Signature (Email)</label><input value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className={`${pInput} text-sm py-3 font-semibold`} placeholder="operative@algolib.com" /></div>
                                    <button onClick={handleAddAdminClick} className="w-full lg:w-auto py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-[1.02] text-black font-bold rounded-xl transition-all shadow-md flex justify-center items-center gap-2 text-xs uppercase tracking-widest"><UserPlus size={16} /> Authorize</button>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-bold text-white mb-5 flex items-center gap-2 tracking-widest uppercase"><Users size={16} className="text-zinc-500" /> Active Clearances</h3>
                                    <div className="overflow-x-auto border border-white/[0.08] rounded-2xl shadow-lg">
                                        <table className="w-full text-left text-sm bg-[#050505]">
                                            <thead className="bg-black text-[10px] text-zinc-500 font-bold uppercase tracking-wider border-b border-white/[0.08]">
                                                <tr><th className="p-4 pl-6 w-1/2">Operative Signature</th><th className="p-4">Authorized By</th><th className="p-4 pr-6 text-right">Timestamp / Revoke</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {adminsList.map((admin) => (
                                                    <tr key={admin.email} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="p-4 pl-6"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-lg font-bold text-white shadow-inner">{admin.email.charAt(0).toUpperCase()}</div><div><p className="text-white font-bold text-sm tracking-tight mb-0.5">{admin.email}</p>{user?.email === admin.email && <span className="text-[9px] font-bold tracking-widest uppercase bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/30">Current Client</span>}</div></div></td>
                                                        <td className="p-4"><span className="text-zinc-400 text-[10px] font-medium font-mono bg-[#020202] shadow-inner border border-white/5 px-3 py-1.5 rounded-lg">{admin.added_by}</span></td>
                                                        <td className="p-4 pr-6 text-right"><div className="flex items-center justify-end gap-5 text-zinc-500 font-bold text-[10px] tracking-widest uppercase"><span>{new Date(admin.created_at).toLocaleDateString()}</span>{admin.added_by !== 'system_init' ? (<button onClick={() => handleRemoveAdminClick(admin.email)} className="p-2 text-zinc-500 bg-white/5 border border-white/5 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 rounded-lg transition-colors shadow-sm" title="Revoke Clearance"><Trash2 size={16} /></button>) : (<span className="p-2 bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 rounded-lg cursor-not-allowed shadow-inner" title="System Founder (Immutable)"><ShieldCheck size={16} /></span>)}</div></td>
                                                    </tr>
                                                ))}
                                                {adminsList.length === 0 && (<tr><td colSpan={3} className="p-12 text-center text-zinc-600 text-[10px] font-bold tracking-widest uppercase">Loading security matrix...</td></tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    )}
                    {activeTab === "credits" && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div className={`${pCard} p-6 md:p-8`}>
                                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                                            <Coins size={28} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]" /> Credit Forge
                                        </h2>
                                        <p className="text-xs text-zinc-400 mt-1 font-medium">Provision and manage AI Analyzer compute credits for system nodes.</p>
                                    </div>

                                    {/* Search Bar matching your premium UI style */}
                                    <div className="relative w-full xl:w-96 group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search by signature or email..."
                                            className={pInput}
                                            value={insightSearchEmail}
                                            onChange={(e) => setInsightSearchEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto border border-white/[0.08] rounded-2xl shadow-xl">
                                    <table className="w-full text-left text-sm bg-[#050505]">
                                        <thead className="bg-black text-[10px] uppercase tracking-wider text-zinc-500 font-bold border-b border-white/[0.08]">
                                            <tr>
                                                <th className="p-4 pl-6">User Node</th>
                                                <th className="p-4 text-center">Compute Credits</th>
                                                <th className="p-4 pr-6 text-right">Quick Provisioning</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.05]">
                                            {insightsData
                                                .filter(u => {
                                                    if (!insightSearchEmail) return true;
                                                    const searchLower = insightSearchEmail.toLowerCase();
                                                    return (
                                                        (u.email && u.email.toLowerCase().includes(searchLower)) ||
                                                        (u.displayName && u.displayName.toLowerCase().includes(searchLower)) ||
                                                        (u.id && u.id.toLowerCase().includes(searchLower))
                                                    );
                                                })
                                                .map((u) => (
                                                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                                        <td className="p-4 pl-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                                                                    {u.displayName?.charAt(0) || 'U'}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-zinc-200 font-semibold">{u.displayName || "Anonymous"}</span>
                                                                    <span className="text-[10px] text-zinc-500 font-mono">{u.email || "No Email Linked"}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                                <Zap size={12} /> {u.aiCredits || 0}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 pr-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleUpdateCredits(u.id, (u.aiCredits || 0) + 10)}
                                                                    className="px-3 py-1 bg-white/5 hover:bg-emerald-500/20 text-[10px] font-bold text-zinc-400 hover:text-emerald-400 rounded-lg border border-white/5 transition-all"
                                                                >
                                                                    +10
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateCredits(u.id, (u.aiCredits || 0) + 50)}
                                                                    className="px-3 py-1 bg-white/5 hover:bg-sky-500/20 text-[10px] font-bold text-zinc-400 hover:text-sky-400 rounded-lg border border-white/5 transition-all"
                                                                >
                                                                    +50
                                                                </button>
                                                                <div className="w-px h-4 bg-white/10 mx-1" />
                                                                <button
                                                                    onClick={() => {
                                                                        const newAmt = prompt("Enter precise credit balance:", (u.aiCredits || 0).toString());
                                                                        if (newAmt !== null) handleUpdateCredits(u.id, parseInt(newAmt));
                                                                    }}
                                                                    className="p-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-all"
                                                                >
                                                                    <Edit3 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}

                                            {/* Visual Feedback when no results are found */}
                                            {insightsData.length > 0 && insightsData.filter(u => {
                                                const searchLower = insightSearchEmail.toLowerCase();
                                                return (u.email?.toLowerCase().includes(searchLower) || u.displayName?.toLowerCase().includes(searchLower) || u.id.toLowerCase().includes(searchLower));
                                            }).length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="py-20 text-center text-zinc-600 text-[10px] font-bold tracking-widest uppercase bg-black/20">
                                                            No user nodes found for "{insightSearchEmail}"
                                                        </td>
                                                    </tr>
                                                )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "mailroom" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-4xl mx-auto">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                                        <Mail size={24} className="text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]" /> Operations Mailroom
                                    </h2>
                                    <p className="text-xs font-medium text-zinc-400 mt-1">Dispatch official communications locked to teamalgolib@gmail.com.</p>
                                </div>
                            </div>

                            <div className={`${pCard} p-6 md:p-8 space-y-6`}>
                                {/* Address Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className={pLabel}>Recipient (To) *</label>
                                        <input value={mailTo} onChange={(e) => setMailTo(e.target.value)} className={pInput} placeholder="operative@domain.com" />
                                    </div>
                                    <div>
                                        <label className={pLabel}>Carbon Copy (CC)</label>
                                        <input value={mailCc} onChange={(e) => setMailCc(e.target.value)} className={pInput} placeholder="admin@domain.com" />
                                    </div>
                                    <div>
                                        <label className={pLabel}>Blind Carbon Copy (BCC)</label>
                                        <input value={mailBcc} onChange={(e) => setMailBcc(e.target.value)} className={pInput} placeholder="stealth@domain.com" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={pLabel}>Subject Line *</label>
                                        <input value={mailSub} onChange={(e) => setMailSub(e.target.value)} className={`${pInput} font-bold`} placeholder="Urgent: System Architecture Update" />
                                    </div>
                                </div>

                                {/* Payload Body */}
                                <div>
                                    <label className={pLabel}>Transmission Payload *</label>
                                    <textarea 
                                        value={mailBody} 
                                        onChange={(e) => setMailBody(e.target.value)} 
                                        className={`${pInput} resize-y min-h-[200px] text-xs font-mono leading-relaxed`} 
                                        placeholder="Type your official transmission here..." 
                                    />
                                </div>

                                {/* Attachments UI */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className={pLabel}>Encrypted Attachments (Max 4MB total)</label>
                                        <label className="cursor-pointer text-[10px] font-bold text-sky-400 uppercase tracking-widest hover:text-sky-300 transition-colors flex items-center gap-1.5">
                                            <Paperclip size={12} /> Append Files
                                            <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                                        </label>
                                    </div>
                                    
                                    {mailAttachments.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mt-3 bg-[#020202] p-4 rounded-xl border border-white/5 shadow-inner">
                                            {mailAttachments.map((att, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs">
                                                    <span className="font-bold text-zinc-300 truncate max-w-[150px]">{att.filename}</span>
                                                    <span className="text-[9px] text-zinc-500 font-mono">({(att.size / 1024).toFixed(1)}kb)</span>
                                                    <button onClick={() => removeAttachment(idx)} className="ml-1 text-zinc-500 hover:text-red-400 transition-colors">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Dispatch Button */}
                                <div className="pt-4 border-t border-white/5">
                                    <button 
                                        onClick={handleSendDirectMail} 
                                        disabled={isSendingMail} 
                                        className="w-full py-4 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:opacity-50"
                                    >
                                        {isSendingMail ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                        {isSendingMail ? "Establishing SMTP..." : "Dispatch Official Transmission"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </section>
            </main>
        </div>
    );
};

export default Admin;