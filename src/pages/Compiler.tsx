import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Editor, { useMonaco } from '@monaco-editor/react';
import { 
  Play, X, Trash2, Moon, Sun, Maximize2, Minimize, Copy, Save, Zap, 
  Settings, Terminal, CheckCircle2, Code2, Clock, Activity, ChevronRight, 
  ChevronLeft, ChevronUp, ChevronDown, Square, AlignLeft, Menu,
  Headphones, Library, Pause, Volume2, VolumeX, FileCode2, Search, Lock,
  Plus, BookMarked, Loader2
} from 'lucide-react';
import { Icon } from '@iconify/react';
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAlgorithms, type Algorithm } from '@/lib/algorithms';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, where, serverTimestamp, type Timestamp
} from 'firebase/firestore';
import { firestoreDB } from '@/lib/firebase';

// ─── Formatting Engine (Custom Fallbacks) ────────────────────────────────────

const formatCStyle = (unformattedCode: string) => {
    const lines = unformattedCode.split('\n');
    let indent = 0;
    const formatted = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            formatted.push('');
            continue;
        }
        
        let currentIndent = indent;
        
        if (line.match(/^[}\]]/)) {
            currentIndent = Math.max(0, currentIndent - 1);
            indent = currentIndent; 
        }
        
        formatted.push('    '.repeat(currentIndent) + line);
        
        let cleanLine = line.replace(/"(?:[^"\\]|\\.)*"/g, '')
                            .replace(/'(?:[^'\\]|\\.)*'/g, '')
                            .replace(/\/\/.*/, '')
                            .replace(/\/\*.*?\*\//g, '');
                            
        if (line.match(/^[}\]]/)) {
            cleanLine = cleanLine.replace(/^[}\]]/, '');
        }
        
        const openCount = (cleanLine.match(/[{[]/g) || []).length;
        const closeCount = (cleanLine.match(/[}\]]/g) || []).length;
        
        indent += (openCount - closeCount);
        indent = Math.max(0, indent);
    }
    return formatted.join('\n').replace(/\n{3,}/g, '\n\n');
};

// ─── Language Config ─────────────────────────────────────────────────────────

interface LangConfig {
  id: string;
  label: string;
  monacoLang: string;
  filename: string;
  icon: string;
  color: string;
  template: string;
}

const LANGUAGES: LangConfig[] = [
  {
    id: 'cpp', label: 'C++', monacoLang: 'cpp', filename: 'main.cpp', icon: 'logos:c-plusplus', color: '#00599C',
    template: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write C++ code here\n    cout << "Welcome to AlgoLib Compiler" << endl;\n\n    return 0;\n}`,
  },
  {
    id: 'c', label: 'C', monacoLang: 'c', filename: 'main.c', icon: 'logos:c', color: '#A8B9CC',
    template: `#include <stdio.h>\n\nint main() {\n    // Write C code here\n    printf("Welcome to AlgoLib Compiler\\n");\n\n    return 0;\n}`,
  },
  {
    id: 'python', label: 'Python', monacoLang: 'python', filename: 'main.py', icon: 'logos:python', color: '#3776AB',
    template: `# Write Python code here\nprint("Welcome to AlgoLib Compiler")`,
  },
  {
    id: 'java', label: 'Java', monacoLang: 'java', filename: 'Main.java', icon: 'logos:java', color: '#ED8B00',
    template: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write Java code here\n        System.out.println("Welcome to AlgoLib Compiler");\n    }\n}`,
  },
  {
    id: 'javascript', label: 'JS', monacoLang: 'javascript', filename: 'main.js', icon: 'logos:javascript', color: '#F7DF1E',
    template: `// Write JavaScript code here\nconsole.log("Welcome to AlgoLib Compiler");`,
  }
];

const API_LANG_MAP: Record<string, string> = { cpp: 'c++', c: 'c', python: 'python', java: 'java', javascript: 'javascript' };

// ─── Algo-Vault Snippets Data ────────────────────────────────────────────────
const ALGO_VAULT: Record<string, {name: string, code: string}[]> = {
  cpp: [
    { name: "Fast I/O Template", code: "ios_base::sync_with_stdio(false);\ncin.tie(NULL);\n" },
    { name: "BFS Traversal", code: "void bfs(int start_node) {\n    queue<int> q;\n    q.push(start_node);\n    vis[start_node] = true;\n    while(!q.empty()) {\n        int u = q.front(); q.pop();\n        for(int v : adj[u]) {\n            if(!vis[v]) {\n                vis[v] = true;\n                q.push(v);\n            }\n        }\n    }\n}\n" },
    { name: "DFS Traversal", code: "void dfs(int u) {\n    vis[u] = true;\n    for(int v : adj[u]) {\n        if(!vis[v]) {\n            dfs(v);\n        }\n    }\n}\n" },
    { name: "Binary Search", code: "int l = 0, r = n - 1, ans = -1;\nwhile(l <= r) {\n    int mid = l + (r - l) / 2;\n    if(check(mid)) {\n        ans = mid;\n        l = mid + 1; // or r = mid - 1\n    } else {\n        r = mid - 1; // or l = mid + 1\n    }\n}\n" },
    { name: "Dijkstra's Algorithm", code: "priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;\nvector<int> dist(n + 1, INF);\npq.push({0, source});\ndist[source] = 0;\nwhile(!pq.empty()) {\n    int u = pq.top().second;\n    int d = pq.top().first;\n    pq.pop();\n    if(d > dist[u]) continue;\n    for(auto edge : adj[u]) {\n        int v = edge.first, weight = edge.second;\n        if(dist[u] + weight < dist[v]) {\n            dist[v] = dist[u] + weight;\n            pq.push({dist[v], v});\n        }\n    }\n}\n" },
    { name: "Segment Tree (Point Update)", code: "void update(int node, int start, int end, int idx, int val) {\n    if(start == end) {\n        tree[node] += val;\n        return;\n    }\n    int mid = (start + end) / 2;\n    if(start <= idx && idx <= mid) update(2*node, start, mid, idx, val);\n    else update(2*node+1, mid+1, end, idx, val);\n    tree[node] = tree[2*node] + tree[2*node+1];\n}\n" }
  ],
  python: [
    { name: "Fast I/O Read", code: "import sys\ninput = sys.stdin.read\ndata = input().split()\n" },
    { name: "BFS Traversal", code: "from collections import deque\ndef bfs(start_node):\n    q = deque([start_node])\n    vis[start_node] = True\n    while q:\n        u = q.popleft()\n        for v in adj[u]:\n            if not vis[v]:\n                vis[v] = True\n                q.append(v)\n" },
    { name: "Binary Search", code: "l, r, ans = 0, n - 1, -1\nwhile l <= r:\n    mid = (l + r) // 2\n    if check(mid):\n        ans = mid\n        l = mid + 1\n    else:\n        r = mid - 1\n" },
    { name: "Dijkstra's Algorithm", code: "import heapq\ndef dijkstra(src):\n    dist = [float('inf')] * n\n    dist[src] = 0\n    pq = [(0, src)]\n    while pq:\n        d, u = heapq.heappop(pq)\n        if d > dist[u]: continue\n        for v, weight in adj[u]:\n            if dist[u] + weight < dist[v]:\n                dist[v] = dist[u] + weight\n                heapq.heappush(pq, (dist[v], v))\n" }
  ],
  java: [
    { name: "Fast Scanner", code: "static class FastReader {\n    BufferedReader br;\n    StringTokenizer st;\n    public FastReader() { br = new BufferedReader(new InputStreamReader(System.in)); }\n    String next() {\n        while (st == null || !st.hasMoreElements()) {\n            try { st = new StringTokenizer(br.readLine()); }\n            catch (IOException e) { e.printStackTrace(); }\n        }\n        return st.nextToken();\n    }\n    int nextInt() { return Integer.parseInt(next()); }\n}\n" },
    { name: "Binary Search", code: "int l = 0, r = n - 1, ans = -1;\nwhile(l <= r) {\n    int mid = l + (r - l) / 2;\n    if(check(mid)) {\n        ans = mid;\n        l = mid + 1;\n    } else {\n        r = mid - 1;\n    }\n}\n" }
  ]
};

// ─── Flow-State Music Streams ────────────────────────────────────────────────
const MUSIC_STREAMS = [
  { id: 'phonk1', name: 'Channel: 1', url: 'https://streams.ilovemusic.de/iloveradio37.mp3' },
  { id: 'phonk2', name: 'Channel: 2', url: 'https://streams.ilovemusic.de/iloveradio38.mp3' },
  { id: 'lofi', name: 'Channel: 3', url: 'https://streams.ilovemusic.de/iloveradio17.mp3' },
  { id: 'synth', name: 'Channel: 4', url: 'https://streams.ilovemusic.de/iloveradio26.mp3' },
  { id: 'chill', name: 'Channel: 5', url: 'https://streams.ilovemusic.de/iloveradio10.mp3' }
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Compiler() {
  const { user } = useAuth();
  const [activeLang, setActiveLang] = useState<LangConfig>(LANGUAGES[0]);
  const [openTabs, setOpenTabs] = useState<LangConfig[]>([LANGUAGES[0]]);
  const [terminalFontSize, setTerminalFontSize] = useState<number>(13);
  const [codes, setCodes] = useState<Record<string, string>>(Object.fromEntries(LANGUAGES.map(l => [l.id, l.template])));
  const [output, setOutput] = useState('');
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [executionMetrics, setExecutionMetrics] = useState<{ time?: string | number; memory?: string | number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [input, setInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Vault state
  const [showVault, setShowVault] = useState(false);
  const [vaultSearch, setVaultSearch] = useState('');
  const [vaultTab, setVaultTab] = useState<'snippets' | 'algorithms'>('snippets');
  const [gistAlgos, setGistAlgos] = useState<Algorithm[]>([]);
  const [gistLoading, setGistLoading] = useState(false);

  // My Snippets (Firestore)
  interface MySnippet { id: string; userId: string; name: string; code: string; lang: string; createdAt: Timestamp | null; }
  const [mySnippets, setMySnippets] = useState<MySnippet[]>([]);
  const [snippetsLoading, setSnippetsLoading] = useState(false);
  const [saveSnippetName, setSaveSnippetName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Real-time Firestore listener for user's snippets
  useEffect(() => {
    if (!user || !showVault) return;
    setSnippetsLoading(true);
    const q = query(
      collection(firestoreDB, 'user_snippets'),
      where('userId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs
        .map(d => ({ id: d.id, ...(d.data() as Omit<MySnippet, 'id'>) }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || 0;
          return bTime - aTime;
        });
      setMySnippets(all);
      setSnippetsLoading(false);
    }, (err) => { console.error('Snippets listener error:', err); setSnippetsLoading(false); });
    return () => unsub();
  }, [user, showVault]);

  const handleSaveSnippet = async () => {
    if (!user || !saveSnippetName.trim()) return;
    setIsSaving(true);
    try {
      await addDoc(collection(firestoreDB, 'user_snippets'), {
        userId: user.uid,
        name: saveSnippetName.trim(),
        code: codes[activeLang.id],
        lang: activeLang.id,
        createdAt: serverTimestamp(),
      });
      toast.success('Snippet saved!', { description: saveSnippetName.trim() });
      setSaveSnippetName('');
      setShowSaveForm(false);
    } catch (err) {
      console.error('Save snippet error:', err);
      toast.error('Failed to save snippet', { description: String(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSnippet = async (snippetId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(firestoreDB, 'user_snippets', snippetId));
      toast.success('Snippet deleted');
    } catch (err) {
      console.error('Delete snippet error:', err);
      toast.error('Failed to delete snippet');
    }
  };

  // Music state
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.4);
  const [activeTrack, setActiveTrack] = useState(MUSIC_STREAMS[0]);

  // Load Gist algorithms when vault opens
  useEffect(() => {
    if (!showVault || !user || gistAlgos.length > 0) return;
    setGistLoading(true);
    fetchAlgorithms()
      .then(setGistAlgos)
      .catch(() => {})
      .finally(() => setGistLoading(false));
  }, [showVault, user]);
  
  const editorRef = useRef<any>(null);
  const compilerRef = useRef<HTMLDivElement>(null);
  const terminalPanelRef = useRef<ImperativePanelHandle>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hideTimeoutRef = useRef<any>(null);
  const monaco = useMonaco();

  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const [showEditorSettings, setShowEditorSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const [editorSettings, setEditorSettings] = useState({
    fontFamily: "'Fira Code', monospace",
    fontSize: window.innerWidth < 768 ? 14 : 16,
    wordWrap: true,
    suggestions: true,
    minimap: false
  });

  const abortRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ─── Core Formatter Injection ───
  useEffect(() => {
    if (!monaco) return;
    const formatters: any[] = [];
    ['cpp', 'c', 'java'].forEach(lang => {
        const provider = monaco.languages.registerDocumentFormattingEditProvider(lang, {
            provideDocumentFormattingEdits: (model) => {
                const text = model.getValue();
                const formatted = formatCStyle(text);
                return [{ range: model.getFullModelRange(), text: formatted }];
            }
        });
        formatters.push(provider);
    });

    const pyProvider = monaco.languages.registerDocumentFormattingEditProvider('python', {
         provideDocumentFormattingEdits: (model) => {
             const text = model.getValue();
             const formatted = text.split('\n').map((l: string) => l.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n');
             return [{ range: model.getFullModelRange(), text: formatted }];
         }
    });
    formatters.push(pyProvider);
    return () => formatters.forEach(f => f.dispose());
  }, [monaco]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Audio Player Effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
      if (isMusicPlaying) {
        audioRef.current.play().catch(() => setIsMusicPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMusicPlaying, activeTrack, musicVolume]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontFamily: editorSettings.fontFamily,
        fontSize: editorSettings.fontSize,
        wordWrap: editorSettings.wordWrap ? 'on' : 'off',
        quickSuggestions: editorSettings.suggestions,
        suggestOnTriggerCharacters: editorSettings.suggestions,
        minimap: { enabled: editorSettings.minimap }
      });
      document.fonts.ready.then(() => {
         if (editorRef.current?.remeasureFonts) editorRef.current.remeasureFonts();
      });
    }
  }, [editorSettings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isRunning) document.getElementById('hidden-run-trigger')?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    hideTimeoutRef.current = setTimeout(() => setNavVisible(false), 3000);
    return () => clearTimeout(hideTimeoutRef.current);
  }, []);

  const highlightErrorIfAny = (outText: string) => {
    if (!editorRef.current) return;
    let errorLine: number | null = null;
    const pyMatch = outText.match(/line\s+(\d+)/i); 
    const gccMatch = outText.match(/:(\d+)(?::\d+)?:\s*(?:error|fatal error|warning|note)/i); 
    const nodeMatch = outText.match(/:\s*(\d+):\d+/); 

    if (pyMatch) errorLine = parseInt(pyMatch[1], 10);
    else if (gccMatch) errorLine = parseInt(gccMatch[1], 10);
    else if (nodeMatch) errorLine = parseInt(nodeMatch[1], 10);

    const newDecorations: any[] = [];
    if (errorLine && !isNaN(errorLine)) {
      newDecorations.push({
        range: { startLineNumber: errorLine, startColumn: 1, endLineNumber: errorLine, endColumn: 1 },
        options: { isWholeLine: true, className: 'error-line-highlight', hoverMessage: { value: '🚨 **Runtime/Syntax Error**\nAn issue was detected near this line.' } }
      });
    }

    if (typeof editorRef.current.createDecorationsCollection === 'function') {
      if (!editorRef.current._errCollection) editorRef.current._errCollection = editorRef.current.createDecorationsCollection();
      editorRef.current._errCollection.set(newDecorations);
    } else {
      if (!editorRef.current._errDecorations) editorRef.current._errDecorations = [];
      editorRef.current._errDecorations = editorRef.current.deltaDecorations(editorRef.current._errDecorations, newDecorations);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen().catch(() => toast.error("Fullscreen not supported"));
    else await document.exitFullscreen().catch(() => { });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.formatDocument', null);
      toast.success("Code formatted");
    }
  };

  const handleSaveFile = () => {
    const currentCode = codes[activeLang.id];
    const extension = activeLang.filename.split('.').pop() || 'txt';
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const fileName = `code_${dateStr}_${timeStr}.${extension}`;
    
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Saved as ${fileName}`);
  };

  // ─── Snippet Injector ───
  const injectSnippet = (snippetCode: string) => {
    if (editorRef.current) {
      const position = editorRef.current.getPosition();
      editorRef.current.executeEdits("snippet-insert", [{
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text: snippetCode,
        forceMoveMarkers: true
      }]);
      editorRef.current.focus();
      toast.success("Snippet injected!");
      if (isMobile) setShowVault(false);
    }
  };

  // ─── Snippet Filtering ───
  const currentLangSnippets = ALGO_VAULT[activeLang.id] || [];
  const filteredSnippets = currentLangSnippets.filter(s => 
      s.name.toLowerCase().includes(vaultSearch.toLowerCase()) || 
      s.code.toLowerCase().includes(vaultSearch.toLowerCase())
  );

  const toggleTerminalPanel = () => {
    const panel = terminalPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) panel.expand();
      else panel.collapse();
    }
  };

  const code = codes[activeLang.id] ?? '';
  const setCode = (val: string) => setCodes(prev => ({ ...prev, [activeLang.id]: val }));

  const handleLangSwitch = (lang: LangConfig) => {
    if (!openTabs.find(t => t.id === lang.id)) setOpenTabs(prev => [...prev, lang]);
    setActiveLang(lang);
    setOutput('');
    setExecutionStatus('idle');
    setExecutionMetrics(null);
    highlightErrorIfAny('');
  };

  const handleCloseTab = (e: React.MouseEvent, langId: string) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.id !== langId);
    if (newTabs.length === 0) {
      setOpenTabs([LANGUAGES[0]]);
      setActiveLang(LANGUAGES[0]);
    } else {
      setOpenTabs(newTabs);
      if (activeLang.id === langId) setActiveLang(newTabs[newTabs.length - 1]);
    }
  };

  const handleStopCode = () => {
    if (isRunning) {
      abortRef.current = true;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setIsRunning(false);
      setExecutionStatus('error');
      setOutput('Process killed by user (SIGINT)');
      highlightErrorIfAny('');
      toast.info("Execution stopped");
    }
  };

  const handleRunCode = async () => {
    if (isRunning) return;
    if (terminalPanelRef.current?.isCollapsed()) terminalPanelRef.current.expand();
    
    setIsRunning(true);
    setExecutionStatus('running');
    setOutput('Initiating connection to execution engine...');
    setExecutionMetrics(null);
    highlightErrorIfAny('');

    abortRef.current = false;
    abortControllerRef.current = new AbortController();

    const ENGINE_API_URL = 'https://rajawatprateek-algolib-engine.hf.space/execute';
    const STATUS_API_URL = 'https://rajawatprateek-algolib-engine.hf.space/status';

    try {
      const res = await fetch(ENGINE_API_URL, {
        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: API_LANG_MAP[activeLang.id] || activeLang.id, code, input }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: Execution Engine Offline.`);
      const { jobId } = await res.json();
      
      let isFinished = false;
      while (!isFinished) {
        if (abortRef.current) throw new Error("Process killed by user (SIGINT)");
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        if (abortRef.current) throw new Error("Process killed by user (SIGINT)");

        const statusRes = await fetch(`${STATUS_API_URL}/${jobId}`, { signal: abortControllerRef.current.signal });
        if (!statusRes.ok) throw new Error("Failed to fetch job status.");
        
        const statusData = await statusRes.json();

        if (statusData.status === 'queued') setOutput(`[Queue] Waiting for compute resources... Position: ${statusData.position}`);
        else if (statusData.status === 'running') setOutput(`Executing payload in secure sandbox...`);
        else if (statusData.status === 'success' || statusData.status === 'error') {
            isFinished = true;
            let cleanOutput = (statusData.output || '').trim();
            if (activeLang.id === 'java') cleanOutput = cleanOutput.replace(/Main_[a-fA-F0-9]+/g, 'Main');
            
            if (statusData.status === 'error' || statusData.statusCode === 500) {
                setExecutionStatus('error');
                setOutput(cleanOutput || "Execution Error");
                highlightErrorIfAny(cleanOutput);
            } else {
                setOutput(cleanOutput || '');
                setExecutionStatus('success');
                setExecutionMetrics({ time: statusData.time ?? statusData.executionTime, memory: statusData.memory ?? statusData.memoryUsage });
                highlightErrorIfAny('');
            }
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError' || abortRef.current) setOutput('Process killed by user (SIGINT)');
      else { setOutput(e.message); highlightErrorIfAny(e.message); }
      setExecutionStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const editorTheme = darkMode ? 'vs-dark' : 'light';

  return (
    <div className={`compiler-root ${isFullscreen ? 'is-fullscreen' : ''} ${darkMode ? 'dark' : ''}`} data-theme={darkMode ? 'dark' : 'light'} ref={compilerRef}>
      <Helmet>
        <title>AlgoLib Compiler | Lightning-Fast Online IDE & Code Runner</title>
      </Helmet>

      {/* Hidden Audio Player for Flow-State */}
      <audio ref={audioRef} src={activeTrack.url} loop crossOrigin="anonymous" />

      {/* RESTORED AND FULLY MERGED CSS BLOCK */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Fira+Code:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Source+Code+Pro:wght@400;500;600&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        
        .error-line-highlight { background: rgba(209, 79, 46, 0.4) !important; border-left: 3px solid #e49f5f !important; }
        .terminal-topbar { overflow: hidden; flex-wrap: nowrap; }
        .terminal-topbar-left { flex-shrink: 1; overflow: hidden; white-space: nowrap; }
        .terminal-topbar-right { flex-shrink: 0; }
        
        /* Vault Panel Styling */
        .vault-panel {
            width: 300px; background: #ffffff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; z-index: 5;
            transition: width 0.3s ease, padding 0.3s ease; overflow: hidden; white-space: nowrap;
        }
        .dark .vault-panel { background: #121212; border-right: 1px solid #27272a; }
        .vault-panel.closed { width: 0; border-right: none; }
        
        @media (max-width: 768px) {
            .vault-panel { position: absolute; left: 0; top: 0; bottom: 0; z-index: 50; box-shadow: 10px 0 30px rgba(0,0,0,0.5); }
        }

        /* ─── Root & Typography ─── */
        .compiler-root {
          display: flex; flex-direction: column; height: 100vh; width: 100vw; overflow: hidden;
          background: #f8fafc; font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased;
        }
        .dark.compiler-root { background: #0a0a0a; color: #f1f5f9; }

        /* ─── Shell ─── */
        .compiler-shell { display: flex; flex: 1; overflow: hidden; transition: margin-top 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .compiler-shell.nav-visible { margin-top: 72px; }
        .compiler-shell.nav-hidden { margin-top: 12px; }

        .compiler-navbar-wrapper { position: fixed; top: 0; left: 0; right: 0; height: 72px; z-index: 100; transition: transform 0.4s, opacity 0.3s; }
        .compiler-navbar-wrapper.hidden { opacity: 0; pointer-events: none; transform: translateY(-100%); }

        /* ─── Sidebar ─── */
        .compiler-sidebar { width: 64px; display: flex; flex-direction: column; align-items: center; padding: 16px 0; gap: 20px; z-index: 10; flex-shrink: 0; background: transparent;}
        .sidebar-brand-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: transparent; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .sidebar-brand-btn:hover { background: rgba(0,0,0,0.05); }
        .dark .sidebar-brand-btn:hover { background: rgba(255,255,255,0.05); }

        .sidebar-lang-container { display: flex; flex-direction: column; gap: 12px; width: 100%; align-items: center; }
        .sidebar-lang-btn { position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; color: #64748b; }
        .dark .sidebar-lang-btn { color: #71717a; }
        
        .sidebar-lang-btn:hover { background: #f1f5f9; color: #0f172a; }
        .dark .sidebar-lang-btn:hover { background: rgba(255,255,255,0.05); color: #f8fafc; }
        
        .sidebar-lang-btn.active { background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.05); color: #0f172a; border: 1px solid #e2e8f0; }
        .dark .sidebar-lang-btn.active { background: #1a1a1a; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); color: #ffffff; border: 1px solid #27272a; }
        
        .sidebar-active-indicator { position: absolute; left: -10px; top: 50%; transform: translateY(-50%) scaleY(0); width: 3px; height: 20px; border-radius: 0 4px 4px 0; transition: transform 0.2s ease; }
        .sidebar-lang-btn.active .sidebar-active-indicator { transform: translateY(-50%) scaleY(1); }

        /* ─── Main Area ─── */
        .compiler-main { flex: 1; display: flex; flex-direction: column; margin: 12px 12px 12px 0; border-radius: 16px; background: #ffffff; overflow: hidden; border: 1px solid #e2e8f0; position: relative; }
        .dark .compiler-main { background: #121212; box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.5); border: 1px solid #27272a; }

        /* ─── Topbar ─── */
        .compiler-topbar { display: flex; align-items: center; justify-content: space-between; height: 56px; background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 0 12px 0 0; z-index: 20; }
        .dark .compiler-topbar { background: #121212; border-bottom: 1px solid #27272a; }

        .topbar-brand { display: flex; align-items: center; padding: 0 24px; gap: 8px; color: #0f172a; height: 100%; position: relative; }
        .topbar-brand::after { content: ''; position: absolute; right: 0; top: 30%; height: 40%; width: 1px; background: #e2e8f0; }
        .dark .topbar-brand { color: #ffffff; }
        .dark .topbar-brand::after { background: #27272a; }
        .topbar-brand-text { font-size: 15px; }

        /* Tabs */
        .topbar-tabs { display: flex; align-items: stretch; height: 100%; flex: 1; overflow-x: auto; scrollbar-width: none; }
        .file-tab { display: flex; align-items: center; gap: 8px; padding: 0 20px; background: transparent; font-size: 13px; color: #64748b; cursor: pointer; transition: all 0.2s; position: relative; border-bottom: 2px solid transparent; }
        .dark .file-tab { color: #a1a1aa; }
        .file-tab::after { content: ''; position: absolute; right: 0; top: 35%; height: 30%; width: 1px; background: #e2e8f0; }
        .dark .file-tab::after { background: #27272a; }
        
        .file-tab:hover { background: #f8fafc; color: #0f172a; }
        .dark .file-tab:hover { background: #1a1a1a; color: #f4f4f5; }
        
        .file-tab.active { color: #0f172a; border-bottom: 2px solid #10b981; font-weight: 600; background: linear-gradient(to top, rgba(16,185,129,0.05), transparent); }
        .dark .file-tab.active { color: #ffffff; }
        .file-tab-name { font-family: 'JetBrains Mono', monospace; }
        
        .file-tab-close { display: flex; border: none; background: transparent; color: inherit; cursor: pointer; padding: 2px; border-radius: 4px; opacity: 0; transform: scale(0.8); transition: all 0.2s; }
        .file-tab:hover .file-tab-close { opacity: 0.6; transform: scale(1); }
        .file-tab-close:hover { opacity: 1 !important; background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        /* Actions */
        .topbar-actions { display: flex; align-items: center; padding-left: 8px; }

        .topbar-icon-btn { display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: #475569; cursor: pointer; padding: 8px; border-radius: 8px; transition: all 0.2s ease; }
        .topbar-icon-btn:hover { background: #f1f5f9; color: #0f172a; }
        .dark .topbar-icon-btn { color: #a1a1aa; }
        .dark .topbar-icon-btn:hover { background: #27272a; color: #ffffff; }

        .action-btn { display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; height: 32px; border: none;}
        
        .secondary-btn { background: #ffffff; color: #334155; border: 1px solid #e2e8f0; }
        .secondary-btn:hover { background: #f1f5f9; color: #0f172a; }
        .dark .secondary-btn { background: #1a1a1a; color: #d4d4d8; border: 1px solid #27272a; }
        .dark .secondary-btn:hover { background: #27272a; color: #ffffff; }

        .stop-btn { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
        .stop-btn:hover { background: rgba(239, 68, 68, 0.2); color: #dc2626; }
        .dark .stop-btn { background: rgba(239, 68, 68, 0.15); color: #f87171;}
        .dark .stop-btn:hover { background: rgba(239, 68, 68, 0.25); color: #fca5a5; }
        
        .run-btn { background: #10b981; color: #000; box-shadow: 0 0 15px rgba(16,185,129,0.2); }
        .run-btn:hover:not(:disabled) { background: #059669; box-shadow: 0 0 20px rgba(16,185,129,0.4); transform: translateY(-1px); }

        /* ─── Panels ─── */
        .compiler-panels { flex: 1; display: flex; }
        .editor-panel { display: flex; flex-direction: column; background: transparent; }
        .editor-wrapper { flex: 1; position: relative; height: 100%; min-height: 0; }
        
        .resize-handle { width: 14px; background: #f8fafc; cursor: col-resize; display: flex; align-items: center; justify-content: center; z-index: 10; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
        .dark .resize-handle { background: #121212; border-left: 1px solid #27272a; border-right: 1px solid #27272a; }
        .resize-handle-bar { width: 2px; height: 40px; background: #cbd5e1; border-radius: 4px; transition: all 0.2s; }
        .dark .resize-handle-bar { background: #3f3f46; }
        .resize-handle:hover .resize-handle-bar, .resize-handle:active .resize-handle-bar { background: transparent; }

        /* ─── Terminal Panel ─── */
        .terminal-panel { display: flex; flex-direction: column; background: #f8fafc; }
        .dark .terminal-panel { background: #0a0a0a; }
        
        .terminal-topbar { display: flex; align-items: center; justify-content: space-between; height: 40px; padding: 0 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
        .dark .terminal-topbar { background: #121212; border-bottom: 1px solid #27272a; }
        
        .terminal-topbar-left { display: flex; align-items: center; gap: 12px; }
        .window-controls { display: flex; gap: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .terminal-topbar-right { display: flex; gap: 6px; }
        
        .terminal-clear-btn { display: flex; align-items: center; gap: 6px; background: transparent; border: none; color: #64748b; cursor: pointer; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 6px; transition: 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
        .terminal-clear-btn:hover { background: #e2e8f0; color: #0f172a; }
        .dark .terminal-clear-btn { color: #71717a; }
        .dark .terminal-clear-btn:hover { background: #27272a; color: #fff; }

        .terminal-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #ffffff; }
        .dark .terminal-body { background: #0a0a0a; }
        
        .terminal-output-container { flex: 1; padding: 20px; overflow-y: auto; }
        
        .terminal-stdin-container { flex-shrink: 0; border-top: 1px solid #e2e8f0; padding: 20px; background: #f8fafc; }
        .dark .terminal-stdin-container { background: #121212; border-top: 1px solid #27272a; }
        
        .stdin-header { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-family: 'Inter', sans-serif; }
        .dark .stdin-header { color: #71717a; }
        
        .terminal-input-row { display: flex; align-items: flex-start; gap: 6px; }
        .terminal-prompt { font-family: 'JetBrains Mono', monospace; font-weight: bold; }
        .terminal-input { background: transparent; border: none; outline: none; color: #0f172a; font-family: 'JetBrains Mono', monospace; line-height: 1.6; resize: none; }
        .dark .terminal-input { color: #e2e8f0; }
        .terminal-input::placeholder { color: #94a3b8; font-style: italic; }
        .dark .terminal-input::placeholder { color: #3f3f46; }

        /* ─── Custom Scrollbar ─── */
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #3f3f46; }
        .no-scrollbar::-webkit-scrollbar { display: none; }

        /* ─── Mobile Responsiveness ─── */
        @media (max-width: 768px) {
          .compiler-shell { flex-direction: column; margin-top: 0 !important; }
          .compiler-navbar-wrapper { display: none; }
          
          .compiler-sidebar { width: 100%; height: 60px; flex-direction: row; padding: 8px 16px; overflow-x: auto; order: 3; background: #ffffff; border-top: 1px solid #e2e8f0; gap: 8px; margin-bottom: 0;}
          .dark .compiler-sidebar { background: #121212; border-top-color: #27272a; }
          
          .sidebar-lang-container { flex-direction: row; margin-bottom: 0; }
          .sidebar-active-indicator { left: 50%; top: auto; bottom: -4px; width: 20px; height: 3px; transform: translateX(-50%) scaleX(0); border-radius: 4px 4px 0 0; }
          .sidebar-lang-btn.active .sidebar-active-indicator { transform: translateX(-50%) scaleX(1); }
          
          .compiler-main { margin: 0; border-radius: 0; border: none; order: 2; }
          .topbar-brand { display: none; }
          
          .resize-handle { width: 100%; height: 16px; cursor: row-resize; flex-direction: column; border-left: none; border-right: none; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
          .dark .resize-handle { border-top: 1px solid #27272a; border-bottom: 1px solid #27272a; }
          .resize-handle-bar { width: 40px; height: 2px; }
        }
      `}} />

      <div 
        className={`compiler-navbar-wrapper ${navVisible ? 'visible' : 'hidden'}`}
        onMouseEnter={() => { setNavVisible(true); clearTimeout(hideTimeoutRef.current); }}
        onMouseMove={() => clearTimeout(hideTimeoutRef.current)}
        onMouseLeave={() => { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = setTimeout(() => setNavVisible(false), 2000); }}
      >
        <Navbar />
      </div>

      <div className={`compiler-shell ${navVisible ? 'nav-visible' : 'nav-hidden'}`}>
        
        {/* ── Left Sidebar (Global Tools) ── */}
        <aside className="compiler-sidebar">
          {!navVisible && !isMobile && (
            <button className="sidebar-brand-btn" onClick={() => setNavVisible(true)} title="Show Navigation">
              <Zap size={20} className="brand-zap text-emerald-500" fill="currentColor" />
            </button>
          )}
          <div className="sidebar-lang-container">
            {LANGUAGES.map(lang => (
              <button key={lang.id} className={`sidebar-lang-btn ${activeLang.id === lang.id ? 'active' : ''}`} onClick={() => handleLangSwitch(lang)} title={lang.label}>
                <div className="sidebar-active-indicator" style={{ backgroundColor: activeLang.id === lang.id ? lang.color : 'transparent' }} />
                <span className="sidebar-lang-icon"><Icon icon={lang.icon} width="22" height="22" /></span>
              </button>
            ))}
          </div>

          <div className="flex-1"></div>

          {/* Vault Toggle Button */}
          <div className="sidebar-lang-container mb-4">
              <button 
                className={`sidebar-lang-btn ${showVault ? 'active !text-indigo-500' : ''}`} 
                onClick={() => {
                  if (!user) {
                    toast.error('Sign in to access the Algo-Vault', { description: 'The vault requires authentication.' });
                    return;
                  }
                  setShowVault(!showVault);
                }}
                title="Algo-Vault Snippets"
              >
                <div className="sidebar-active-indicator bg-indigo-500" />
                {user ? <Library size={20} /> : <Lock size={20} />}
              </button>
          </div>
        </aside>

        {/* ── Algo-Vault Slide-Out Panel ── */}
        <aside className={`vault-panel ${showVault ? 'open' : 'closed'}`}>
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 flex-shrink-0">
                <span className="font-bold text-[13px] uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                    <Library size={16} className="text-indigo-500" /> Algo-Vault
                </span>
                {isMobile && <button onClick={() => setShowVault(false)} className="text-zinc-400 hover:text-zinc-100"><X size={16}/></button>}
            </div>

            {/* Tab switcher */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                <button
                    className={`flex-1 py-2.5 text-[12px] font-semibold tracking-wider uppercase transition-colors ${
                        vaultTab === 'snippets'
                            ? 'text-indigo-500 border-b-2 border-indigo-500'
                            : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    onClick={() => setVaultTab('snippets')}
                >My Snippets</button>
                <button
                    className={`flex-1 py-2.5 text-[12px] font-semibold tracking-wider uppercase transition-colors ${
                        vaultTab === 'algorithms'
                            ? 'text-indigo-500 border-b-2 border-indigo-500'
                            : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    onClick={() => setVaultTab('algorithms')}
                >Algorithms</button>
            </div>

            {/* Search Bar + Save Button Row */}
            <div className="px-3 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/50 flex-shrink-0 flex gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        value={vaultSearch}
                        onChange={(e) => setVaultSearch(e.target.value)}
                        placeholder={vaultTab === 'snippets' ? 'Search my snippets...' : 'Search algorithms...'}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-[13px] text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
                {vaultTab === 'snippets' && (
                    <button
                        onClick={() => setShowSaveForm(p => !p)}
                        title="Save current snippet"
                        className={`px-3 py-2 rounded-lg border text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
                            showSaveForm
                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-500'
                        }`}
                    >
                        <Plus size={14} /> Save
                    </button>
                )}
            </div>

            {/* Save Snippet Form (collapsible) */}
            <AnimatePresence>
                {vaultTab === 'snippets' && showSaveForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden flex-shrink-0"
                    >
                        <div className="px-3 py-3 bg-indigo-500/[0.04] border-b border-zinc-200 dark:border-zinc-800 flex gap-2">
                            <input
                                type="text"
                                value={saveSnippetName}
                                onChange={(e) => setSaveSnippetName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveSnippet()}
                                placeholder={`Name for ${activeLang.label} snippet...`}
                                className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-[13px] text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500 transition-colors"
                                autoFocus
                            />
                            <button
                                onClick={handleSaveSnippet}
                                disabled={!saveSnippetName.trim() || isSaving}
                                className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-[12px] font-bold hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                            >
                                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                {isSaving ? '...' : 'OK'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                {/* ── MY SNIPPETS TAB ── */}
                {vaultTab === 'snippets' && (
                    <div className="flex flex-col gap-2">
                        {snippetsLoading ? (
                            // Skeleton loader
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl animate-pulse">
                                    <div className="h-3 bg-zinc-300 dark:bg-zinc-700 rounded w-2/3 mb-2" />
                                    <div className="h-2 bg-zinc-200 dark:bg-zinc-700/60 rounded w-full" />
                                </div>
                            ))
                        ) : mySnippets.filter(s =>
                            s.lang === activeLang.id &&
                            s.name.toLowerCase().includes(vaultSearch.toLowerCase())
                        ).length > 0 ? (
                            mySnippets
                                .filter(s => s.lang === activeLang.id && s.name.toLowerCase().includes(vaultSearch.toLowerCase()))
                                .map((snippet) => (
                                    <div
                                        key={snippet.id}
                                        className="relative bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl hover:border-indigo-500/50 transition-all group"
                                    >
                                        <button
                                            onClick={() => injectSnippet(snippet.code)}
                                            className="text-left w-full"
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="font-semibold text-[13px] text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate pr-6">{snippet.name}</span>
                                                <FileCode2 size={14} className="text-zinc-400 group-hover:text-indigo-500 transition-colors shrink-0 absolute top-3 right-8" />
                                            </div>
                                            <pre className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 overflow-hidden text-ellipsis">{snippet.code.substring(0, 60)}...</pre>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSnippet(snippet.id)}
                                            className="absolute top-3 right-3 text-zinc-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete snippet"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))
                        ) : (
                            <div className="text-center flex flex-col items-center justify-center mt-10 px-3">
                                <BookMarked size={28} className="text-zinc-300 dark:text-zinc-700 mb-3" />
                                <p className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                                    {vaultSearch ? `No snippets matching "${vaultSearch}"` : 'No snippets saved yet'}
                                </p>
                                <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
                                    {!vaultSearch && 'Click Save to store your current code.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── ALGORITHMS TAB (from Gist) ── */}
                {vaultTab === 'algorithms' && (
                    gistLoading ? (
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl animate-pulse">
                                    <div className="h-3 bg-zinc-300 dark:bg-zinc-700 rounded w-3/4 mb-2" />
                                    <div className="h-2 bg-zinc-200 dark:bg-zinc-700/60 rounded w-1/3 mb-2" />
                                    <div className="h-2 bg-zinc-200 dark:bg-zinc-700/60 rounded w-full" />
                                </div>
                            ))}
                        </div>
                    ) : (() => {
                        const langKey = activeLang.id === 'cpp' ? 'codeCpp' : activeLang.id === 'python' ? 'codePython' : 'codeJava';
                        const filteredAlgos = gistAlgos.filter(a =>
                            (a.title.toLowerCase().includes(vaultSearch.toLowerCase()) ||
                             a.category.toLowerCase().includes(vaultSearch.toLowerCase())) &&
                            (a as any)[langKey]
                        );
                        return (
                            <div className="flex flex-col gap-2">
                                {filteredAlgos.length > 0 ? filteredAlgos.map((algo) => {
                                    const code = (algo as any)[langKey] as string;
                                    return (
                                        <button
                                            key={algo.id}
                                            onClick={() => injectSnippet(code)}
                                            className="text-left bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-[13px] text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{algo.title}</span>
                                                <FileCode2 size={14} className="text-zinc-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                                            </div>
                                            <div className="text-[10px] text-zinc-400 mb-1.5 font-mono">{algo.category} · {algo.timeComplexity}</div>
                                            <pre className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 overflow-hidden text-ellipsis">{code.substring(0, 50)}...</pre>
                                        </button>
                                    );
                                }) : (
                                    <div className="text-center flex flex-col items-center justify-center mt-8 px-2">
                                        <Search size={24} className="text-zinc-300 dark:text-zinc-700 mb-2" />
                                        <span className="text-[13px] text-zinc-500 dark:text-zinc-400 whitespace-normal leading-relaxed">
                                            {gistAlgos.length === 0 ? 'No algorithms loaded from Gist.' : `No algorithms matching "${vaultSearch}" for ${activeLang.label}.`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })()
                )}
            </div>
        </aside>

        {/* ── Main Area ── */}
        <main className="compiler-main">
          {/* Top Bar */}
          <div className="compiler-topbar">
            {/* Logo Brand */}
            <div className="topbar-brand">
              <Zap className="brand-zap text-emerald-500" fill="currentColor" size={18} />
              <span className="topbar-brand-text">
                <span className="font-extrabold tracking-tight">ALGO</span>
                <span className="font-semibold text-zinc-500 tracking-tight">LIB</span>
              </span>
            </div>

            {/* File Tabs */}
            <div className="topbar-tabs">
              {openTabs.map(tab => (
                <div key={tab.id} className={`file-tab ${activeLang.id === tab.id ? 'active' : ''}`} onClick={() => handleLangSwitch(tab)}>
                  <Icon icon={tab.icon} width="15" height="15" className="tab-icon" />
                  <span className="file-tab-name">{tab.filename}</span>
                  <button className="file-tab-close" onClick={(e) => handleCloseTab(e, tab.id)} title="Close tab"><X size={14} /></button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="topbar-actions flex items-center gap-1 md:gap-2 relative">
              
              {/* DESKTOP ONLY UTILITIES */}
              <div className="hidden md:flex items-center gap-1">
                {/* Flow-State Music Button */}
                <button 
                  className={`topbar-icon-btn ${isMusicPlaying ? 'text-sky-500 bg-sky-500/10' : ''}`} 
                  onClick={() => { setShowMusicMenu(!showMusicMenu); setShowEditorSettings(false); setShowMobileMenu(false); }} 
                  title="Flow-State Focus Audio"
                >
                  <Headphones size={15} className={isMusicPlaying ? "animate-pulse" : ""} />
                </button>

                <button className="topbar-icon-btn" onClick={handleCopy} title="Copy Code"><Copy size={15} /></button>
                <button className="topbar-icon-btn" onClick={toggleFullscreen} title="Fullscreen">
                  {isFullscreen ? <Minimize size={15} /> : <Maximize2 size={15} />}
                </button>
              </div>

              {/* Settings Button */}
              <button 
                className={`topbar-icon-btn ${showEditorSettings ? 'text-emerald-500 bg-zinc-100 dark:bg-white/5' : ''}`} 
                onClick={() => { setShowEditorSettings(!showEditorSettings); setShowMusicMenu(false); setShowMobileMenu(false); }} 
                title="Editor Settings"
              >
                <Settings size={15} />
              </button>
              
              {/* Save Button */}
              <button 
                className="topbar-icon-btn" 
                onClick={() => { handleSaveFile(); setShowEditorSettings(false); setShowMobileMenu(false); setShowMusicMenu(false); }} 
                title="Save Code"
              >
                <Save size={15} />
              </button>

              <div className="action-divider hidden md:block" />

              {/* Stop / Run Button */}
              {isRunning ? (
                <button className="action-btn stop-btn flex items-center px-3 md:px-4" onClick={handleStopCode} title="Stop Execution">
                  <Square size={13} fill="currentColor" />
                  <span className="hidden md:inline ml-1.5">Stop</span>
                </button>
              ) : (
                <button
                  id="hidden-run-trigger"
                  className="action-btn run-btn flex items-center px-3 md:px-4"
                  onClick={handleRunCode}
                  disabled={isRunning}
                  title="Run Code (Cmd/Ctrl + Enter)"
                >
                  <Play size={14} fill="currentColor" />
                  <span className="hidden md:inline ml-1.5">Run</span>
                </button>
              )}

              {/* Hamburger Menu */}
              <button 
                className={`topbar-icon-btn ml-1 ${showMobileMenu ? 'text-emerald-500 bg-zinc-100 dark:bg-white/5' : ''}`}
                onClick={() => { setShowMobileMenu(!showMobileMenu); setShowEditorSettings(false); setShowMusicMenu(false); }}
                title="Menu"
              >
                <Menu size={18} />
              </button>

              {/* --- DROPDOWN PANELS --- */}
              
              {/* Music Player Dropdown */}
              <AnimatePresence>
                {showMusicMenu && (
                  <motion.div 
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} 
                      className="absolute top-[50px] right-0 z-[100] w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-4 flex flex-col gap-4 origin-top-right"
                  >
                      <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Headphones size={14} className="text-sky-500"/> Focus Streams</span>
                          <button onClick={() => setIsMusicPlaying(!isMusicPlaying)} className="w-8 h-8 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center hover:bg-sky-500/20 transition-colors">
                              {isMusicPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                          </button>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {MUSIC_STREAMS.map(track => (
                          <button 
                            key={track.id}
                            onClick={() => { setActiveTrack(track); setIsMusicPlaying(true); }}
                            className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTrack.id === track.id ? 'bg-sky-500 text-white shadow-md' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                          >
                            {track.name}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          <button onClick={() => setMusicVolume(v => Math.max(0, v - 0.1))} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><VolumeX size={16}/></button>
                          <input 
                            type="range" min="0" max="1" step="0.05" 
                            value={musicVolume} 
                            onChange={(e) => setMusicVolume(parseFloat(e.target.value))} 
                            className="flex-1 accent-sky-500"
                          />
                          <button onClick={() => setMusicVolume(v => Math.min(1, v + 0.1))} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><Volume2 size={16}/></button>
                      </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Editor Settings Dropdown */}
              <AnimatePresence>
                {showEditorSettings && (
                  <motion.div 
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} 
                      className="absolute top-[50px] right-0 z-[100] w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-5 flex flex-col gap-5 origin-top-right"
                  >
                      <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Font Family</label>
                          <select value={editorSettings.fontFamily} onChange={(e) => setEditorSettings({...editorSettings, fontFamily: e.target.value})} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-emerald-500 transition-colors w-full">
                            <option value="'Fira Code', monospace">Fira Code (Ligatures)</option>
                            <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                            <option value="'Source Code Pro', monospace">Source Code Pro</option>
                            <option value="'Space Mono', monospace">Space Mono (Wide)</option>
                            <option value="'Courier Prime', monospace">Courier Prime (Classic)</option>
                            <option value="Consolas, 'Courier New', monospace">System Default</option>
                          </select>
                      </div>
                      <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Font Size</label>
                             <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-1.5 rounded">{editorSettings.fontSize}px</span>
                          </div>
                          <input type="range" min="13" max="28" value={editorSettings.fontSize} onChange={(e) => setEditorSettings({...editorSettings, fontSize: parseInt(e.target.value)})} className="w-full accent-emerald-500 mt-1" />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                          <label className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Word Wrap</label>
                          <button onClick={() => setEditorSettings({...editorSettings, wordWrap: !editorSettings.wordWrap})} className={`w-9 h-5 rounded-full relative transition-colors shadow-inner ${editorSettings.wordWrap ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${editorSettings.wordWrap ? 'left-4.5 right-0.5' : 'left-0.5'}`} style={{ left: editorSettings.wordWrap ? '18px' : '2px' }}></div>
                          </button>
                      </div>
                      <div className="flex items-center justify-between">
                          <label className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Suggestions</label>
                          <button onClick={() => setEditorSettings({...editorSettings, suggestions: !editorSettings.suggestions})} className={`w-9 h-5 rounded-full relative transition-colors shadow-inner ${editorSettings.suggestions ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${editorSettings.suggestions ? 'left-4.5 right-0.5' : 'left-0.5'}`} style={{ left: editorSettings.suggestions ? '18px' : '2px' }}></div>
                          </button>
                      </div>
                      <div className="flex items-center justify-between pb-1">
                          <label className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Minimap</label>
                          <button onClick={() => setEditorSettings({...editorSettings, minimap: !editorSettings.minimap})} className={`w-9 h-5 rounded-full relative transition-colors shadow-inner ${editorSettings.minimap ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${editorSettings.minimap ? 'left-4.5 right-0.5' : 'left-0.5'}`} style={{ left: editorSettings.minimap ? '18px' : '2px' }}></div>
                          </button>
                      </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile Hamburger Dropdown */}
              <AnimatePresence>
                {showMobileMenu && (
                  <motion.div 
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} 
                      className="absolute top-[50px] right-0 z-[100] w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-2 flex flex-col gap-1 origin-top-right"
                  >
                    <div className="md:hidden flex flex-col gap-1">
                      <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" onClick={() => { handleCopy(); setShowMobileMenu(false); }}><Copy size={15} /> Copy Code</button>
                      <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" onClick={() => { handleSaveFile(); setShowMobileMenu(false); }}><Save size={15} /> Save Code</button>
                      <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" onClick={() => { toggleFullscreen(); setShowMobileMenu(false); }}>{isFullscreen ? <Minimize size={15} /> : <Maximize2 size={15} />} {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</button>
                      
                      {/* Music accessible in mobile menu */}
                      <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-colors" onClick={() => { setShowMusicMenu(true); setShowMobileMenu(false); }}><Headphones size={15} /> Focus Audio</button>
                      
                      <div className="h-[1px] bg-zinc-200 dark:bg-zinc-800 my-1 mx-2"></div>
                    </div>
                    
                    <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" onClick={() => { handleFormatCode(); setShowMobileMenu(false); }}><AlignLeft size={15} /> Format Code</button>
                    <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" onClick={() => { setDarkMode(d => !d); setShowMobileMenu(false); }}>{darkMode ? <Sun size={15} /> : <Moon size={15} />} {darkMode ? 'Light Mode' : 'Dark Mode'}</button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          {/* Editor + Output */}
          <PanelGroup direction={isMobile ? "vertical" : "horizontal"} className="compiler-panels">
            <Panel defaultSize={60} minSize={30} className="editor-panel">
              <div className="editor-wrapper relative h-full w-full">
                <div className="absolute top-4 right-6 z-10 opacity-20 pointer-events-none">
                   <Code2 size={60} className="text-zinc-400 dark:text-zinc-500" />
                </div>
                <Editor
                    height="100%" width="100%" theme={editorTheme} language={activeLang.monacoLang} value={code} onChange={v => setCode(v || '')}
                    onMount={e => { editorRef.current = e; }}
                    options={{ minimap: { enabled: editorSettings.minimap }, fontSize: editorSettings.fontSize, fontFamily: editorSettings.fontFamily, fontLigatures: true, wordWrap: editorSettings.wordWrap ? 'on' : 'off', quickSuggestions: editorSettings.suggestions, padding: { top: 24, bottom: 24 }, automaticLayout: true, scrollBeyondLastLine: false, lineNumbersMinChars: 3, cursorBlinking: 'smooth', smoothScrolling: true, renderLineHighlight: 'all', }}
                />
              </div>
            </Panel>

            <PanelResizeHandle className="resize-handle relative group outline-none">
              <div className="resize-handle-bar" />
              <button onClick={toggleTerminalPanel} className={`absolute z-50 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md transition-all shadow-md ${isMobile ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-4" : "top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-8"}`}>
                {isMobile ? (isTerminalCollapsed ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : (isTerminalCollapsed ? <ChevronLeft size={14}/> : <ChevronRight size={14}/>)}
              </button>
            </PanelResizeHandle>

            <Panel ref={terminalPanelRef} minSize={15} defaultSize={40} collapsible={true} collapsedSize={0} onCollapse={() => setIsTerminalCollapsed(true)} className="terminal-panel transition-all duration-300">
              <div className="terminal-topbar">
                <div className="terminal-topbar-left">
                  <div className="window-controls"><span className="dot bg-rose-500" /><span className="dot bg-amber-500" /><span className="dot bg-emerald-500" /></div>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 tracking-widest uppercase ml-2"><Terminal size={14} className="mb-0.5" /> Terminal</span>
                </div>
                
                <div className="terminal-topbar-right">
                  <div className="flex bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-0.5 mr-2">
                    <button className="px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors" onClick={() => setTerminalFontSize(prev => Math.max(10, prev - 2))}>T-</button>
                    <div className="w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-0.5"></div>
                    <button className="px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors" onClick={() => setTerminalFontSize(prev => Math.min(30, prev + 2))}>T+</button>
                  </div>
                  <button className="terminal-clear-btn" onClick={() => { setOutput(''); setInput(''); setExecutionStatus('idle'); setExecutionMetrics(null); highlightErrorIfAny(''); }} title="Clear console">
                    <Trash2 size={13} className="text-zinc-400 dark:text-zinc-500" /><span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="terminal-body" style={{ fontSize: `${terminalFontSize}px` }}>
                <div className="terminal-output-container custom-scrollbar relative">
                  {executionStatus === 'idle' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none">
                         <Terminal size={32} className="mb-3 text-zinc-500" />
                         <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">Awaiting Execution</span>
                      </div>
                  )}

                  <div className="terminal-output">
                    {executionStatus === 'running' && (
                        <span className="term-hint flex items-center gap-2 mb-2"><Activity size={14} className="text-sky-500 animate-pulse" /> <span className="font-mono text-sky-600 dark:text-sky-400">{output}</span></span>
                    )}
                    
                    {executionStatus === 'error' && (
                      <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-5 rounded-xl shadow-sm mt-2">
                          <div className="flex items-center gap-2 mb-3 text-rose-600 dark:text-rose-500 font-bold text-[10px] uppercase tracking-widest"><X size={14}/> Runtime Exception</div>
                          <pre className="font-mono whitespace-pre-wrap">{output}</pre>
                      </div>
                    )}
                    
                    {executionStatus === 'success' && (
                      <div className="flex flex-col gap-6">
                        {output && (
                            <div className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 p-4 md:p-5 rounded-2xl shadow-inner overflow-x-auto">
                               <pre className="font-mono whitespace-pre-wrap text-zinc-800 dark:text-zinc-300 break-all" style={{ fontSize: `${terminalFontSize}px` }}>{output}</pre>
                            </div>
                        )}
                        {!output && (<div className="text-zinc-400 dark:text-zinc-600 font-mono italic mb-2">No standard output generated.</div>)}
                        
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3 md:p-2 rounded-2xl">
                          <div className="flex items-center gap-2 md:gap-3 min-w-fit">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 outline outline-2 outline-emerald-500/30 shrink-0"></div>
                             <span className="font-bold text-emerald-600 dark:text-emerald-500 text-[11px] md:text-[13px] uppercase tracking-wide leading-tight whitespace-nowrap">Program exited</span>
                          </div>
                          
                          {executionMetrics && (executionMetrics.time !== undefined || executionMetrics.memory !== undefined) && (
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 px-3 py-2 md:px-4 md:py-2.5 rounded-xl font-mono text-[11px] md:text-[13px] text-zinc-600 dark:text-zinc-400 shadow-sm dark:shadow-inner shrink-0 max-w-full">
                              {executionMetrics.time !== undefined && <span className="flex items-center gap-1.5 whitespace-nowrap"><Clock size={13} className="text-sky-500 dark:text-sky-400"/> {executionMetrics.time}{typeof executionMetrics.time === 'number' ? 's' : ''}</span>}
                              {executionMetrics.time !== undefined && executionMetrics.memory !== undefined && <div className="w-[1px] h-3 md:h-4 bg-zinc-300 dark:bg-zinc-700 mx-0.5"></div>}
                              {executionMetrics.memory !== undefined && <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap"><div className="w-1.5 h-3 bg-amber-500 dark:bg-amber-400 rounded-sm"></div> {(Number(executionMetrics.memory) / 1024).toFixed(2)}{typeof executionMetrics.memory === 'number' ? ' MB' : ''}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="terminal-stdin-container">
                  <div className="stdin-header flex items-center gap-2 mb-3"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> STANDARD INPUT (STDIN)</div>
                  <div className="terminal-input-row bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 md:p-4 transition-colors focus-within:border-emerald-500/50">
                    <span className="terminal-prompt select-none mt-[1px]" style={{ fontSize: `${terminalFontSize}px` }}>
                        <span className="text-sky-600 dark:text-sky-400 font-bold">~/algolib</span><span className="text-zinc-400 dark:text-zinc-500 ml-1.5 mr-2">$</span>
                    </span>
                    <textarea className="terminal-input custom-scrollbar flex-1" style={{ fontSize: `${terminalFontSize}px` }} value={input} onChange={e => setInput(e.target.value)} placeholder="Enter command line inputs here..." spellCheck={false} rows={1} onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 150) + 'px'; }} />
                  </div>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </main>
      </div>
    </div>
  );
}