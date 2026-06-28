import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Zap, X, Send, Loader2, MessageSquare, Minimize2, Maximize2, AlertCircle,
  ChevronDown, ChevronUp
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import { firestoreDB as db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WidgetMessage {
  role: "user" | "ai";
  content: string;
  isError?: boolean;
  result?: any;
}

// ─── Math & String Sanitizer ────────────────────────────────────────────────
const sanitizeLatex = (text: string) => {
  if (!text) return "";

  // Fix malformed LLM code blocks
  let preClean = text.replace(/``\$\s*(\w+)/g, '```$1');
  preClean = preClean.replace(/(?<!`)``(?!`)/g, '```');

  // Split the text into code blocks (multi-line and inline) and regular text
  const parts = preClean.split(/(```[\s\S]*?```|`[^`]+`)/g);

  const processedParts = parts.map((part, index) => {
    // Odd indices are the captured code blocks, return them untouched
    if (index % 2 !== 0) {
      return part;
    }

    // Even indices are regular text, apply math sanitization
    let clean = part
      .replace(/\x0C/g, '\\f')
      .replace(/\x08/g, '\\b')
      .replace(/\x09/g, '\\t')
      .replace(/\x0D/g, '\\r')
      .replace(/\x0B/g, '\\v');

    clean = clean
      .replace(/\bint\b/g, '\\int')
      .replace(/\bleft\b/g, '\\left')
      .replace(/\bight\b/g, '\\right')
      .replace(/\bcdot\b/g, '\\cdot')
      .replace(/an\^\{-1\}/g, '\\tan^{-1}')
      .replace(/cot\^\{-1\}/g, '\\cot^{-1}');

    const lines = clean.split('\n');
    const processedLines = lines.map(line => {
      let processedLine = line;
      // Prevent markdown from treating indented text as code blocks, but keep small indents
      processedLine = processedLine.replace(/^[ \t]+/, (match) => {
        return match.includes('\t') || match.length >= 4 ? '  ' : match;
      });

      if (processedLine.includes('$') || processedLine.includes('\\[') || processedLine.includes('\\(')) return processedLine;
      const trimmed = processedLine.trim();
      if (trimmed.startsWith('\\int') || trimmed.startsWith('-\\int') || trimmed.startsWith('\\frac') || trimmed.startsWith('-\\frac') || trimmed.startsWith('\\cot') || trimmed.startsWith('-\\cot') || trimmed.startsWith('\\tan')) {
        return `$$${trimmed}$$`;
      }
      return processedLine;
    });

    return processedLines.join('\n');
  });

  return processedParts.join('');
};

// ─── Inline display of AI markdown ──────────
const WidgetMarkdown = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath]}
    rehypePlugins={[[rehypeKatex, { strict: false }]]}
    components={{
      p: ({ ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
      strong: ({ ...props }) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
      pre: ({ children, ...props }) => (
        <pre className="overflow-x-auto max-w-full scrollbar-thin scrollbar-thumb-slate-600 my-3 bg-slate-800 dark:bg-black/60 border border-slate-700 dark:border-white/10 rounded-xl p-3 shadow-inner" {...props}>{children}</pre>
      ),
      code: ({ node, inline, className, children, ...props }: any) => {
        if (!inline) {
          // Block code
          return <code className={`font-mono text-[12px] text-slate-200 dark:text-slate-300 ${className || ""}`} {...props}>{children}</code>
        }
        // Inline code
        return <code className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md text-indigo-600 dark:text-[#4facfe] font-mono text-[11px] break-words" {...props}>{children}</code>
      },
      ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
      li: ({ ...props }) => <li className="text-[13px]" {...props} />,
    }}
  >
    {content}
  </ReactMarkdown>
);

const CollapsibleUserMessage = ({ content }: { content: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLarge = content.length > 200 || content.split('\n').length > 4;
  const displayContent = !isLarge || isExpanded ? content : content.substring(0, 200) + '...';

  return (
    <div className="flex flex-col items-start w-full">
      <p className="whitespace-pre-wrap font-medium break-words w-full">{displayContent}</p>
      {isLarge && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1.5 text-[11px] font-medium text-white/80 hover:text-white flex items-center gap-0.5 transition-colors"
        >
          {isExpanded ? (
            <>Show less <ChevronUp size={14} /></>
          ) : (
            <>Show more <ChevronDown size={14} /></>
          )}
        </button>
      )}
    </div>
  );
};

// ─── Main Widget ──────────────────────────────────────────────────────────────
const VectorisWidget: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  // Hide on specific routes
  const hiddenRoutes = ["/vectoris", "/contest", "/quiz", "/view"];
  const isHidden = hiddenRoutes.some(route => location.pathname.startsWith(route));
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(() => localStorage.getItem("vectoris_widget_chatId"));
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>('auto');
  const [showModeMenu, setShowModeMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("vectoris_widget_chat");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) { }
    }
    setHasLoaded(true);
  }, []);

  // Save chat history whenever messages change
  useEffect(() => {
    if (hasLoaded && profile?.vectoris_save_history !== false) {
      localStorage.setItem("vectoris_widget_chat", JSON.stringify(messages));
      if (chatId) localStorage.setItem("vectoris_widget_chatId", chatId);
      else localStorage.removeItem("vectoris_widget_chatId");
    } else if (hasLoaded) {
      localStorage.removeItem("vectoris_widget_chat");
      localStorage.removeItem("vectoris_widget_chatId");
    }
  }, [messages, chatId, hasLoaded, profile?.vectoris_save_history]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoading]);

  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    // Show after 3 seconds if they haven't seen it, hide after 15
    const hasSeenLabel = localStorage.getItem("vectoris_label_seen");
    if (!hasSeenLabel) {
      const timer1 = setTimeout(() => setShowLabel(true), 3000);
      const timer2 = setTimeout(() => {
        setShowLabel(false);
        localStorage.setItem("vectoris_label_seen", "true");
      }, 15000);
      return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }
  }, []);
  useEffect(() => {
    if (isOpen) {
      setShowLabel(false);
      localStorage.setItem("vectoris_label_seen", "true");
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: WidgetMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      if (!user) throw new Error("Please sign in to use Vectoris.");
      const token = await user.getIdToken();

      const history = updatedMessages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/.netlify/functions/ask-groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          code: text, 
          action: "analyze", 
          history,
          mode: selectedMode === 'auto' ? undefined : selectedMode 
        }),
      });

      if (!res.ok) {
        let errorMsg = "Something went wrong. Please try again.";
        try {
          const errData = await res.json();
          if (errData.error) errorMsg = errData.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const data = await res.json();
      const raw = JSON.parse(data.choices[0].message.content);
      const aiContent = raw.explanation || raw.code || JSON.stringify(raw);

      const aiMsg: WidgetMessage = { role: "ai", content: aiContent, result: raw };
      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);

      if (profile?.vectoris_save_history !== false) {
        try {
           const dbCollection = collection(db, 'users', user.uid, 'analysis_history');
           if (chatId) {
              await updateDoc(doc(dbCollection, chatId), { messages: finalMessages, updatedAt: serverTimestamp() });
           } else {
              const docRef = await addDoc(dbCollection, { title: text.substring(0, 40) + '...', messages: finalMessages, timestamp: serverTimestamp(), updatedAt: serverTimestamp() });
              setChatId(docRef.id);
              localStorage.setItem("vectoris_widget_chatId", docRef.id);
           }
        } catch (err) { console.error("Firebase sync error:", err); }
      }

      // Track usage securely via backend
      try {
        const res = await fetch('/.netlify/functions/vectoris-usage', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
           const errText = await res.text();
           console.error("Vectoris usage update failed:", res.status, errText);
           toast.error(`Usage update failed (Status: ${res.status}): ${errText}`);
        }
        await refreshProfile();
      } catch (err) { console.error("Usage track error:", err); }

      if (!isOpen) setUnread((n) => n + 1);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: err.message || "An error occurred.", isError: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const QUICK_PROMPTS = [
    "What is Big-O notation?",
    "Explain binary search",
    "When to use DP?",
    "Graph vs Tree difference",
  ];

  if (isHidden) return null;

  return (
    <>
      {/* ── Attention Label ── */}
      <AnimatePresence>
        {!isOpen && showLabel && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-10 right-[5.5rem] z-[499] flex items-end"
          >
            <div
              onClick={() => setIsOpen(true)}
              className="bg-white dark:bg-[#1e1e24] px-4 py-2.5 rounded-2xl rounded-br-sm shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/[0.08] text-sm font-medium text-slate-700 dark:text-zinc-300 cursor-pointer hover:scale-105 transition-transform"
            >
              Need code help? <span className="text-[#4facfe] font-bold">Ask Vectoris</span> ✨
            </div>
            {/* Small triangle pointing to the button */}
            <div className="w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-white dark:border-l-[#1e1e24] ml-[-1px] mb-2" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Button ── */}
      <motion.button
        onClick={() => setIsOpen((o) => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[500] w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_8px_32px_rgba(79,172,254,0.45)] bg-gradient-to-br from-[#4facfe] to-[#00f2fe] border border-white/20 transition-all"
        aria-label="Open Vectoris AI"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <X size={22} className="text-white" />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <Zap size={22} className="text-white fill-white" />
            </motion.span>
          )}
        </AnimatePresence>
        {/* Unread badge */}
        {!isOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unread}
          </span>
        )}
      </motion.button>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-24 right-6 z-[500] w-[360px] max-w-[calc(100vw-24px)] rounded-[1.75rem] overflow-hidden flex flex-col
              bg-white/95 dark:bg-[#111115]/95 backdrop-blur-2xl
              border border-slate-200 dark:border-white/[0.08]
              shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            style={{ maxHeight: "min(520px, calc(100dvh - 120px))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] bg-gradient-to-r from-[#4facfe]/10 to-[#00f2fe]/5 dark:from-[#4facfe]/[0.08] dark:to-[#00f2fe]/[0.03] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center shadow-md">
                  <Zap size={15} className="text-white fill-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Vectoris AI</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">Always on · AlgoLib AI</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setMessages([]);
                    setChatId(null);
                    localStorage.removeItem("vectoris_widget_chat");
                    localStorage.removeItem("vectoris_widget_chatId");
                  }}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors text-[10px] font-medium"
                  title="Clear chat"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    if (!user) {
                      setIsAuthModalOpen(true);
                    } else {
                      navigate(chatId ? `/vectoris/${chatId}` : "/vectoris");
                    }
                  }}
                  aria-label="Open Vectoris in full page"
                  className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                  title="Open Vectoris in full page"
                >
                  <Maximize2 size={15} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Vectoris chat"
                  className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0"
              style={{ scrollbarWidth: "none" }}>
              {messages.length === 0 ? (
                <div className="flex flex-col gap-4 h-full">
                  <div className="text-center pt-2">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center shadow-lg mb-3">
                      <MessageSquare size={20} className="text-white" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">Ask Vectoris anything</p>
                    <p className="text-[12px] text-slate-400 dark:text-zinc-500 mt-1"> Code help · Maths · Interview tips </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInput(q);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="text-left text-[12px] font-medium p-3 rounded-xl border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-[#4facfe]/10 hover:border-blue-200 dark:hover:border-[#4facfe]/30 hover:text-blue-600 dark:hover:text-[#4facfe] transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "ai" && (
                      <div className="w-6 h-6 rounded-lg shrink-0 bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center mr-2 mt-1 shadow-sm">
                        <Zap size={11} className="text-white fill-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed overflow-x-auto custom-scrollbar ${msg.role === "user"
                        ? "bg-gradient-to-br from-[#4facfe] to-[#00f2fe] text-white rounded-tr-sm shadow-md"
                        : msg.isError
                          ? "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                          : "bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.07] text-slate-700 dark:text-zinc-300 rounded-tl-sm"
                      }`}>
                      {msg.role === "user" ? (
                        <CollapsibleUserMessage content={msg.content} />
                      ) : msg.isError ? (
                        <><AlertCircle size={14} className="shrink-0" />{msg.content}</>
                      ) : (
                        <WidgetMarkdown content={sanitizeLatex(msg.content)} />
                      )}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-lg shrink-0 bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center mr-2 mt-1">
                    <Loader2 size={11} className="text-white animate-spin" />
                  </div>
                  <div className="bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.07] rounded-2xl rounded-tl-sm px-3.5 py-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4facfe] animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4facfe] animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4facfe] animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div className="h-1" />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 shrink-0 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-end gap-2 bg-slate-50 dark:bg-white/[0.04] rounded-2xl border border-slate-200 dark:border-white/[0.08] px-3 py-2 focus-within:border-[#4facfe]/50 dark:focus-within:border-[#4facfe]/40 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Vectoris..."
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-[13px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none resize-none leading-relaxed py-1 max-h-[100px]"
                  style={{ scrollbarWidth: "none" }}
                />
                <div className="relative mx-1 self-end mb-[1px]">
                  <button
                    onClick={() => setShowModeMenu(!showModeMenu)}
                    className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-300 px-2.5 py-1.5 rounded-xl text-[12px] font-medium transition-colors border border-slate-200 dark:border-white/5 h-[34px]"
                    title="Select AI Mode"
                  >
                    <Zap size={12} className={selectedMode !== 'auto' ? "text-[#4facfe] fill-[#4facfe]" : "text-slate-400 dark:text-zinc-500"} />
                    <span className="capitalize">{selectedMode}</span>
                  </button>
                  <AnimatePresence>
                    {showModeMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowModeMenu(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 5, scale: 0.95 }} 
                          animate={{ opacity: 1, y: 0, scale: 1 }} 
                          exit={{ opacity: 0, y: 5, scale: 0.95 }} 
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[110px] bg-white/95 dark:bg-[#1a1a24]/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden py-1 z-50"
                        >
                          <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                            AI Engine
                          </div>
                          {['auto', 'deterministic', 'balanced', 'creative'].map(mode => (
                            <button 
                              key={mode} 
                              onClick={() => { setSelectedMode(mode); setShowModeMenu(false); }} 
                              className={`w-full text-left px-3 py-2 text-[12px] transition-colors flex items-center justify-between ${selectedMode === mode ? 'text-[#4facfe] bg-blue-50/80 dark:bg-[#4facfe]/10 font-semibold' : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                              <span className="capitalize">{mode}</span>
                              {selectedMode === mode && <span className="w-1.5 h-1.5 rounded-full bg-[#4facfe]"></span>}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  aria-label={isLoading ? "Sending message" : "Send message"}
                  className={`p-2 rounded-xl transition-all shrink-0 ${input.trim() && !isLoading
                      ? "bg-gradient-to-br from-[#4facfe] to-[#00f2fe] text-white shadow-md hover:scale-105 active:scale-95"
                      : "bg-slate-200 dark:bg-white/[0.05] text-slate-400 dark:text-zinc-600 cursor-not-allowed"
                    }`}
                >
                  {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} className="ml-px" />}
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-400 dark:text-zinc-600 mt-2">
                Powered by <span className="font-semibold text-[#4facfe]">Vectoris</span> · AlgoLib AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default VectorisWidget;
