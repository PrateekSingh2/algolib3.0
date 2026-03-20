import React, { useState, useEffect, useMemo, useRef } from "react";
import { User } from "firebase/auth";
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  serverTimestamp, doc, updateDoc, deleteDoc, arrayUnion
} from "firebase/firestore";
import { firestoreDB } from "../lib/firebase";
import { useAuth } from "@/contexts/AuthContext"; 
import { 
  MessageSquare, Image as ImageIcon, Reply, Loader2, 
  CheckCircle2, Trophy, Search, Edit2, Trash2, X, Save,
  MoreVertical, ChevronUp, ChevronDown, AlertTriangle,
  Heading, Bold, Italic, ListOrdered, List, Quote, Code, Terminal, Link, SquarePen,
  ArrowUp, MessageCircle, Sparkles, Command
} from "lucide-react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import Navbar from "./Navbar"; 
import GlobalRibbon from "./GlobalRibbon";
import Footer from "./Footer";

// --- Types ---
interface ReplyType {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: number; 
  isAccepted?: boolean; 
  likes?: string[];    
  dislikes?: string[];
  isEdited?: boolean;
}

interface Post {
  id: string;
  title: string;
  body: string;
  tags: string[];
  imageUrl?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  likes: string[];     
  dislikes?: string[]; 
  replies: ReplyType[];
  createdAt: any; 
  isEdited?: boolean;
}

// --- SAAS BACKGROUND ---
const SaaSBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-[#030303] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_20%,transparent_100%)]" />
    <div className="absolute top-[-10%] right-[10%] w-[50vw] h-[50vh] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen" />
    <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen" />
  </div>
);

// --- INTERACTIVE BENTO CARD ---
const BentoCard = ({ children, className = "", id }: { children: React.ReactNode, className?: string, id?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <div
      id={id}
      onMouseMove={handleMouseMove}
      className={`group/card relative rounded-[20px] sm:rounded-[24px] bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl overflow-hidden hover:border-white/[0.08] transition-all duration-500 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[20px] sm:rounded-[24px] opacity-0 transition duration-500 group-hover/card:opacity-100 z-20"
        style={{ background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.06), transparent 80%)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative z-30">{children}</div>
    </div>
  );
};

// --- MARKDOWN RENDERER ---
const renderText = (text: string) => {
  if (!text) return null;
  const blockParts = text.split(/(\u0060\u0060\u0060[\s\S]*?\u0060\u0060\u0060)/g);
  return blockParts.map((blockPart, index) => {
    if (blockPart.startsWith('\u0060\u0060\u0060') && blockPart.endsWith('\u0060\u0060\u0060')) {
      const codeContent = blockPart.slice(3, -3);
      return (
        <pre key={`block-${index}`} className="bg-[#09090b] border border-white/[0.06] p-3 sm:p-4 rounded-xl my-3 sm:my-4 overflow-x-auto font-mono text-[13px] text-blue-100/80 shadow-inner custom-scrollbar">
          {codeContent}
        </pre>
      );
    }
    const boldParts = blockPart.split(/(\*\*[\s\S]*?\*\*)/g);
    return boldParts.map((boldPart, bIdx) => {
      if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
          return <strong key={`bold-${index}-${bIdx}`} className="text-zinc-100 font-semibold">{boldPart.slice(2, -2)}</strong>;
      }
      const italicParts = boldPart.split(/(_[\s\S]*?_)/g);
      return italicParts.map((italicPart, iIdx) => {
        if (italicPart.startsWith('_') && italicPart.endsWith('_')) {
            return <em key={`italic-${index}-${bIdx}-${iIdx}`} className="italic text-zinc-300">{italicPart.slice(1, -1)}</em>;
        }
        const linkParts = italicPart.split(/(\[[^\]]+\]\([^)]+\))/g);
        return linkParts.map((linkPart, lIdx) => {
            const linkMatch = linkPart.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                let url = linkMatch[2];
                if (!url.match(/^https?:\/\//i) && !url.startsWith('mailto:')) url = `https://${url}`;
                return (
                    <a key={`link-${index}-${bIdx}-${iIdx}-${lIdx}`} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline transition-colors font-medium decoration-blue-500/30">
                        {linkMatch[1]}
                    </a>
                );
            }
            const inlineParts = linkPart.split(/(`[^`]+`)/g);
            return inlineParts.map((part, pIdx) => {
                if (part.startsWith('`') && part.endsWith('`')) {
                    return (
                        <code key={`inline-${index}-${bIdx}-${iIdx}-${lIdx}-${pIdx}`} className="bg-zinc-800/60 text-indigo-300 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-white/[0.08]">
                        {part.slice(1, -1)}
                        </code>
                    );
                }
                return <React.Fragment key={`text-${index}-${bIdx}-${iIdx}-${lIdx}-${pIdx}`}>{part}</React.Fragment>;
            });
        });
      });
    });
  });
};

// --- CONFIRMATION MODAL ---
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, type }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, type: 'post' | 'reply' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#09090b] border border-white/[0.08] rounded-[24px] shadow-2xl p-6 sm:p-8 w-full max-w-md relative z-10"
      >
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl shrink-0 shadow-[inset_0_0_12px_rgba(239,68,68,0.2)]">
            <AlertTriangle size={24} />
          </div>
          <div className="pt-1">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 tracking-tight">Delete {type === 'post' ? 'Discussion' : 'Reply'}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">Are you sure you want to permanently delete this {type}? This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-white bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] rounded-xl transition-all active:scale-95">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-5 py-2.5 text-sm font-medium text-white bg-red-500/90 hover:bg-red-500 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all active:scale-95">Delete</button>
        </div>
      </motion.div>
    </div>
  );
};

// --- FORMAT TOOLBAR ---
const MarkdownToolbar = ({ onInsert }: { onInsert: (prefix: string, suffix: string) => void }) => {
  const tools = [
      { icon: <Heading size={15}/>, prefix: '### ', suffix: '', label: 'Heading' },
      { icon: <Bold size={15}/>, prefix: '**', suffix: '**', label: 'Bold' },
      { icon: <Italic size={15}/>, prefix: '_', suffix: '_', label: 'Italic' },
      { icon: <div className="w-[1px] h-4 bg-white/10 mx-1.5" />, action: 'separator' },
      { icon: <ListOrdered size={15}/>, prefix: '1. ', suffix: '', label: 'Ordered List' },
      { icon: <List size={15}/>, prefix: '- ', suffix: '', label: 'Unordered List' },
      { icon: <Quote size={15}/>, prefix: '> ', suffix: '', label: 'Blockquote' },
      { icon: <div className="w-[1px] h-4 bg-white/10 mx-1.5" />, action: 'separator' },
      { icon: <Code size={15}/>, prefix: '\n\u0060\u0060\u0060\n', suffix: '\n\u0060\u0060\u0060\n', label: 'Code Block' },
      { icon: <Terminal size={15}/>, prefix: '`', suffix: '`', label: 'Inline Code' },
      { icon: <Link size={15}/>, prefix: '[', suffix: '](url)', label: 'Link' },
  ];

  return (
      <div className="flex items-center gap-1 bg-black/40 border-b border-white/[0.06] px-3 sm:px-4 py-2 overflow-x-auto rounded-t-2xl">
          {tools.map((tool, idx) => 
              tool.action === 'separator' ? (
                  <React.Fragment key={idx}>{tool.icon}</React.Fragment>
              ) : (
                  <button
                      key={idx} type="button" title={tool.label}
                      onClick={() => onInsert(tool.prefix!, tool.suffix!)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors shrink-0"
                  >
                      {tool.icon}
                  </button>
              )
          )}
      </div>
  );
};

// --- REPLY ITEM ---
const ReplyItem = ({ reply, postId, postReplies, isPostAuthor, user }: { reply: ReplyType, postId: string, postReplies: ReplyType[], isPostAuthor: boolean, user: User | null }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const isReplyAuthor = user?.uid === reply.authorId;
  const editReplyRef = useRef<HTMLTextAreaElement>(null);

  const handleUpdateReply = async () => {
    if (!editContent.trim()) return;
    const updatedReplies = postReplies.map(r => r.id === reply.id ? { ...r, content: editContent, isEdited: true } : r);
    await updateDoc(doc(firestoreDB, "community_posts", postId), { replies: updatedReplies });
    setIsEditing(false);
  };

  const handleDeleteReply = async () => {
    const updatedReplies = postReplies.filter(r => r.id !== reply.id);
    await updateDoc(doc(firestoreDB, "community_posts", postId), { replies: updatedReplies });
  };

  const insertFormatEditReply = (prefix: string, suffix: string) => {
    const textarea = editReplyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = editContent.substring(0, start);
    const selected = editContent.substring(start, end);
    const after = editContent.substring(end);
    setEditContent(before + prefix + selected + suffix + after);
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const handleReplyVote = async (type: 'up' | 'down') => {
    if (!user) return;
    const hasLiked = reply.likes?.includes(user.uid);
    const hasDisliked = reply.dislikes?.includes(user.uid);
    let newLikes = reply.likes || [];
    let newDislikes = reply.dislikes || [];

    if (type === 'up') {
      if (hasLiked) newLikes = newLikes.filter(id => id !== user.uid);
      else { newLikes = [...newLikes, user.uid]; newDislikes = newDislikes.filter(id => id !== user.uid); }
    } else {
      if (hasDisliked) newDislikes = newDislikes.filter(id => id !== user.uid);
      else { newDislikes = [...newDislikes, user.uid]; newLikes = newLikes.filter(id => id !== user.uid); }
    }

    const updatedReplies = postReplies.map(r => r.id === reply.id ? { ...r, likes: newLikes, dislikes: newDislikes } : r);
    await updateDoc(doc(firestoreDB, "community_posts", postId), { replies: updatedReplies });
  };

  const handleToggleAcceptReply = async () => {
    if (!isPostAuthor) return; 
    const updatedReplies = postReplies.map(r => r.id === reply.id ? { ...r, isAccepted: !r.isAccepted } : r);
    await updateDoc(doc(firestoreDB, "community_posts", postId), { replies: updatedReplies });
  };

  const replyScore = (reply.likes?.length || 0) - (reply.dislikes?.length || 0);

  return (
    <>
    <motion.div layout className={`relative p-4 sm:p-5 rounded-2xl transition-all duration-300 ${reply.isAccepted ? "bg-blue-900/10 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.05)]" : "bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08]"}`}>
      {reply.isAccepted && <div className="absolute left-0 top-6 bottom-6 w-[3px] bg-gradient-to-b from-blue-400 to-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}

      <div className="flex flex-wrap sm:flex-nowrap justify-between items-start gap-3 mb-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative shrink-0">
            <img src={reply.authorAvatar} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/5 ring-offset-2 ring-offset-[#09090b]" />
            {reply.isAccepted && <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-[#09090b]"><CheckCircle2 size={10} className="text-white"/></div>}
          </div>
          <div className="flex flex-col">
             <span className="font-semibold text-zinc-100 text-sm tracking-tight">{reply.authorName}</span>
             <span className="text-zinc-500 text-xs font-medium">
               {new Date(reply.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
               {reply.isEdited && <span className="ml-1 text-zinc-600">· Edited</span>}
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          {(isPostAuthor || reply.isAccepted) && (
            <button onClick={handleToggleAcceptReply} disabled={!isPostAuthor} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${reply.isAccepted ? "text-blue-400 bg-blue-500/10 border border-blue-500/20" : "text-zinc-400 hover:text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] border border-transparent"} ${!isPostAuthor && "cursor-default"}`}>
              <CheckCircle2 size={14} className={reply.isAccepted ? "text-blue-400" : "text-zinc-500"} />
              <span className="hidden sm:inline">{reply.isAccepted ? "Accepted Solution" : "Mark as Solution"}</span>
              <span className="sm:hidden">{reply.isAccepted ? "Accepted" : "Accept"}</span>
            </button>
          )}

          {isReplyAuthor && !isEditing && (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors">
                 <MoreVertical size={18} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 mt-2 w-36 bg-[#09090b] border border-white/[0.08] rounded-xl shadow-2xl z-40 py-1 overflow-hidden backdrop-blur-xl">
                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.05] hover:text-white flex items-center gap-2"><Edit2 size={14}/> Edit</button>
                    <button onClick={() => { setShowDeleteModal(true); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2"><Trash2 size={14}/> Delete</button>
                  </motion.div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-3 flex flex-col border border-white/[0.08] rounded-2xl overflow-hidden bg-black/20 focus-within:border-white/[0.2] transition-colors shadow-inner">
          <MarkdownToolbar onInsert={insertFormatEditReply} />
          <textarea 
            ref={editReplyRef}
            value={editContent} onChange={e => setEditContent(e.target.value)} 
            className="w-full bg-transparent p-4 sm:p-5 text-zinc-200 text-sm focus:outline-none resize-y cursor-text min-h-[100px] leading-relaxed" 
          />
          <div className="flex gap-2 justify-end p-3 border-t border-white/[0.06] bg-black/40">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors font-medium">Cancel</button>
            <button onClick={handleUpdateReply} className="px-4 py-2 text-sm bg-gradient-to-b from-white to-zinc-200 text-black rounded-xl font-medium transition-all active:scale-95 shadow-md">Save</button>
          </div>
        </div>
      ) : (
        <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-[14px] sm:text-[15px] font-normal pl-1">{renderText(reply.content)}</div>
      )}

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.04]">
        <button onClick={() => handleReplyVote('up')} className={`transition-all flex items-center gap-1.5 px-2 py-1 rounded-md ${reply.likes?.includes(user?.uid || "") ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'}`}>
          <ChevronUp size={16} strokeWidth={2.5} />
          <span className="text-sm font-semibold">{replyScore > 0 ? replyScore : 0}</span>
        </button>
        <button onClick={() => handleReplyVote('down')} className={`transition-all flex items-center gap-1.5 px-2 py-1 rounded-md ${reply.dislikes?.includes(user?.uid || "") ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'}`}>
          <ChevronDown size={16} strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>

    <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteReply} type="reply" />
    </>
  );
};


// --- POST ITEM ---
const PostItem = ({ post, user, currentUserName, currentUserAvatar }: { post: Post, user: User | null, currentUserName: string, currentUserAvatar: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isMagnified, setIsMagnified] = useState(false);
  const [magPos, setMagPos] = useState({ x: '50%', y: '50%' });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: post.title, body: post.body, tags: post.tags?.join(", ") || "" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const editBodyRef = useRef<HTMLTextAreaElement>(null);
  const replyBodyRef = useRef<HTMLTextAreaElement>(null);

  const isAuthor = user?.uid === post.authorId;
  const score = (post.likes?.length || 0) - (post.dislikes?.length || 0);
  const isLongPost = post.body.length > 300 || post.body.split('\n').length > 6 || !!post.imageUrl;
  const hasAcceptedAnswer = post.replies?.some(r => r.isAccepted);

  const handleVote = async (type: 'up' | 'down') => {
    if (!user) return;
    const hasLiked = post.likes?.includes(user.uid);
    const hasDisliked = post.dislikes?.includes(user.uid);

    let newLikes = post.likes || [];
    let newDislikes = post.dislikes || [];

    if (type === 'up') {
      if (hasLiked) newLikes = newLikes.filter(id => id !== user.uid);
      else { newLikes = [...newLikes, user.uid]; newDislikes = newDislikes.filter(id => id !== user.uid); }
    } else {
      if (hasDisliked) newDislikes = newDislikes.filter(id => id !== user.uid);
      else { newDislikes = [...newDislikes, user.uid]; newLikes = newLikes.filter(id => id !== user.uid); }
    }
    await updateDoc(doc(firestoreDB, "community_posts", post.id), { likes: newLikes, dislikes: newDislikes });
  };

  const handleDeletePost = async () => {
    try { await deleteDoc(doc(firestoreDB, "community_posts", post.id)); } 
    catch (error) { console.error("Error deleting post:", error); }
  };

  const insertFormatEditPost = (prefix: string, suffix: string) => {
    const textarea = editBodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = editForm.body.substring(0, start);
    const selected = editForm.body.substring(start, end);
    const after = editForm.body.substring(end);
    setEditForm({ ...editForm, body: before + prefix + selected + suffix + after });
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const insertFormatReply = (prefix: string, suffix: string) => {
    const textarea = replyBodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = replyContent.substring(0, start);
    const selected = replyContent.substring(start, end);
    const after = replyContent.substring(end);
    setReplyContent(before + prefix + selected + suffix + after);
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const handleUpdatePost = async () => {
    if (!isAuthor || !editForm.title.trim() || !editForm.body.trim()) return;
    setIsUpdating(true);
    try {
      const tagsArray = editForm.tags.split(",").map(tag => tag.trim().toLowerCase()).filter(tag => tag !== "");
      await updateDoc(doc(firestoreDB, "community_posts", post.id), { 
        title: editForm.title, body: editForm.body, tags: tagsArray, isEdited: true 
      });
      setIsEditing(false);
    } catch (error) { console.error("Error updating post:", error); } 
    finally { setIsUpdating(false); }
  };

  const handleReplySubmit = async () => {
    if (!user || !replyContent.trim()) return;
    setIsSubmittingReply(true);
    try {
      const postDocRef = doc(firestoreDB, "community_posts", post.id);
      const newReply: ReplyType = {
        id: crypto.randomUUID(), authorId: user.uid, authorName: currentUserName,
        authorAvatar: currentUserAvatar, content: replyContent.trim(), createdAt: Date.now(),
        isAccepted: false, likes: [], dislikes: []
      };
      await updateDoc(postDocRef, { replies: arrayUnion(newReply) });
      setReplyContent(""); setShowReplyBox(false); setShowAllReplies(true); 
    } catch (error) { console.error("Failed to post reply:", error); } 
    finally { setIsSubmittingReply(false); }
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMagnified) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMagPos({ x: `${x}%`, y: `${y}%` });
  };

  const sortedReplies = post.replies ? [...post.replies].sort((a, b) => {
    if (a.isAccepted) return -1; if (b.isAccepted) return 1;
    return b.createdAt - a.createdAt;
  }) : [];

  return (
    <>
    <BentoCard id={post.id} className="flex flex-col gap-0 p-4 sm:p-6 scroll-mt-[120px]">
      
      {/* Main Content */}
      <div className="flex-1 min-w-0 w-full">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-3 w-full">
          <div className="flex items-center gap-3">
            <img src={post.authorAvatar} alt="author" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-white/10 ring-offset-2 ring-offset-[#09090b]" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[14px] sm:text-[15px] text-zinc-100 tracking-tight">{post.authorName}</span>
                {hasAcceptedAnswer && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                    <CheckCircle2 size={10} /> <span className="hidden sm:inline">Answered</span>
                  </span>
                )}
              </div>
              <span className="text-zinc-500 text-[11px] sm:text-xs font-medium mt-0.5">
                {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Just now"}
                {post.isEdited && <span className="ml-1.5 text-zinc-600">· Edited</span>}
              </span>
            </div>
          </div>

          {isAuthor && !isEditing && (
            <div className="relative z-20">
              <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors">
                <MoreVertical size={18} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 mt-2 w-32 sm:w-36 bg-[#09090b] border border-white/[0.08] rounded-xl shadow-2xl z-40 py-1 overflow-hidden backdrop-blur-xl">
                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.05] hover:text-white flex items-center gap-2"><Edit2 size={14}/> Edit</button>
                    <button onClick={() => { setShowDeleteModal(true); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2"><Trash2 size={14}/> Delete</button>
                  </motion.div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Body / Edit */}
        {isEditing ? (
          <div className="space-y-3 mb-4 sm:mb-6 bg-black/20 p-4 sm:p-5 rounded-[20px] border border-white/[0.08] shadow-inner">
            <input 
              type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} 
              className="w-full bg-transparent text-white font-semibold text-lg sm:text-xl border-b border-white/[0.08] pb-3 focus:outline-none focus:border-white/[0.3] cursor-text transition-colors" placeholder="Title"
            />
            <div className="flex flex-col border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-white/[0.2] transition-colors">
              <MarkdownToolbar onInsert={insertFormatEditPost} />
              <textarea 
                ref={editBodyRef}
                value={editForm.body} onChange={e => setEditForm({...editForm, body: e.target.value})} rows={6}
                className="w-full bg-transparent text-zinc-300 text-[14px] sm:text-[15px] p-4 sm:p-5 focus:outline-none resize-y cursor-text leading-relaxed" placeholder="Description..."
              />
            </div>
            <input 
              type="text" value={editForm.tags} onChange={e => setEditForm({...editForm, tags: e.target.value})} 
              className="w-full bg-transparent text-zinc-300 text-sm border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-white/[0.2] cursor-text transition-colors" placeholder="Tags (comma separated)"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsEditing(false)} className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleUpdatePost} disabled={isUpdating} className="px-5 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-b from-white to-zinc-200 hover:from-white hover:to-white text-black text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50">
                {isUpdating ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-lg sm:text-[22px] font-bold text-white mb-3 leading-snug tracking-tight pr-4">{post.title}</h3>
            
            <div className={`relative transition-all duration-500 ease-in-out w-full ${!isExpanded && isLongPost ? 'max-h-[160px] overflow-hidden' : ''}`}>
              <div className="text-zinc-300 text-[14px] sm:text-[15px] whitespace-pre-wrap leading-relaxed font-normal pb-3">
                {renderText(post.body)}
              </div>
              
              {post.imageUrl && (
                <div 
                  className={`mb-4 sm:mb-6 bg-black/40 border border-white/[0.04] p-2 rounded-2xl relative inline-block w-full max-w-2xl ${isMagnified ? 'cursor-zoom-out z-10' : 'cursor-zoom-in'} shadow-inner`}
                  onClick={() => setIsMagnified(!isMagnified)} onMouseMove={handleImageMouseMove} onMouseLeave={() => setIsMagnified(false)}
                >
                  <img src={post.imageUrl} alt="Context" style={{ transform: isMagnified ? 'scale(2)' : 'scale(1)', transformOrigin: `${magPos.x} ${magPos.y}` }} className="max-h-[300px] w-full object-contain rounded-xl transition-transform duration-300 ease-out" />
                </div>
              )}

              {!isExpanded && isLongPost && <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent pointer-events-none" />}
            </div>

            {isLongPost && (
              <button onClick={() => setIsExpanded(!isExpanded)} className="text-blue-400 hover:text-blue-300 text-sm font-semibold mb-4 sm:mb-6 mt-1 transition-colors flex items-center gap-1.5">
                {isExpanded ? <><ChevronUp size={16} strokeWidth={2.5}/> Show less</> : <><ChevronDown size={16} strokeWidth={2.5}/> Read more</>}
              </button>
            )}
          </>
        )}

        {/* Tags & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-5 pt-4 border-t border-white/[0.04]">
          <div className="flex flex-wrap gap-2">
            {post.tags?.map((tag, idx) => (
              <span key={idx} className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[12px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] rounded-full transition-colors hover:border-white/[0.1] hover:bg-white/[0.06] hover:text-white flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span> {tag}
              </span>
            ))}
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-5 w-full sm:w-auto mt-2 sm:mt-0">
            {/* INLINE VOTING BAR */}
            <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-full p-1 shadow-inner shrink-0">
              <button onClick={() => handleVote('up')} className={`p-1.5 rounded-full transition-all active:scale-90 ${post.likes?.includes(user?.uid || "") ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
                <ChevronUp size={16} strokeWidth={2.5} />
              </button>
              <span className={`text-[13px] sm:text-[14px] font-bold min-w-[20px] text-center ${score > 0 ? 'text-blue-400' : score < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                {score}
              </span>
              <button onClick={() => handleVote('down')} className={`p-1.5 rounded-full transition-all active:scale-90 ${post.dislikes?.includes(user?.uid || "") ? 'text-red-400 bg-red-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
                <ChevronDown size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="w-[1px] h-6 bg-white/[0.08] hidden sm:block"></div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400 text-xs sm:text-sm font-semibold shrink-0">
               <MessageSquare size={16} /> {post.replies?.length || 0}
            </div>
            
            <button onClick={() => setShowReplyBox(!showReplyBox)} className="flex-1 sm:flex-none text-xs sm:text-sm font-semibold text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white hover:text-black flex justify-center items-center gap-2 transition-all px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl active:scale-95 shadow-sm shrink-0">
              <Reply size={16} /> {showReplyBox ? "Cancel" : "Reply"}
            </button>
          </div>
        </div>

        {/* Reply Input */}
        <AnimatePresence>
        {showReplyBox && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 sm:mt-6 bg-black/40 rounded-2xl border border-white/[0.08] focus-within:border-white/[0.2] transition-colors overflow-hidden shadow-2xl backdrop-blur-md">
            <MarkdownToolbar onInsert={insertFormatReply} />
            <textarea 
              ref={replyBodyRef}
              rows={4} placeholder="Write your reply... (Markdown supported)" value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
              className="w-full bg-transparent text-zinc-200 border-none px-4 py-3 sm:px-5 sm:py-4 text-[14px] sm:text-[15px] focus:outline-none resize-y cursor-text leading-relaxed"
            />
            <div className="flex justify-end px-3 py-2 sm:px-4 sm:py-3 border-t border-white/[0.06] bg-black/20">
              <button onClick={handleReplySubmit} disabled={isSubmittingReply || !replyContent.trim()} className="bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400/20">
                {isSubmittingReply ? <Loader2 size={16} className="animate-spin" /> : "Post Reply"}
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* REPLIES SECTION */}
        {sortedReplies.length > 0 && (
          <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-5 sm:pl-6 relative">
            {/* Thread Line */}
            <div className="absolute left-0 top-0 bottom-8 w-[2px] bg-gradient-to-b from-white/[0.08] to-transparent rounded-full hidden sm:block"></div>
            
            {sortedReplies.slice(0, showAllReplies ? sortedReplies.length : 1).map((reply) => (
               <ReplyItem key={reply.id} reply={reply} postId={post.id} postReplies={post.replies} isPostAuthor={isAuthor} user={user} />
            ))}
            
            {sortedReplies.length > 1 && (
              <button onClick={() => setShowAllReplies(!showAllReplies)} className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-semibold mt-4 sm:mt-5 flex items-center gap-1.5 transition-colors sm:ml-2">
                {showAllReplies ? <ChevronUp size={16} strokeWidth={2.5}/> : <ChevronDown size={16} strokeWidth={2.5}/>}
                {showAllReplies ? "Collapse replies" : `View all ${sortedReplies.length} replies`}
              </button>
            )}
          </div>
        )}
      </div>
    </BentoCard>
    
    <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeletePost} type="post" />
    </>
  );
};


// --- MAIN COMMUNITY PAGE ---
export default function Community() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [newPost, setNewPost] = useState({ title: "", body: "", tags: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const createBodyRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Search Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const q = query(collection(firestoreDB, "community_posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const topContributors = useMemo(() => {
    const scores: Record<string, { name: string, avatar: string, score: number }> = {};
    posts.forEach(post => {
      post.replies?.forEach(reply => {
        if (reply.isAccepted) {
          if (!scores[reply.authorId]) scores[reply.authorId] = { name: reply.authorName, avatar: reply.authorAvatar, score: 0 };
          scores[reply.authorId].score += 1;
        }
      });
    });
    return Object.values(scores).sort((a, b) => b.score - a.score).slice(0, 5); 
  }, [posts]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const insertFormatCreatePost = (prefix: string, suffix: string) => {
    const textarea = createBodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = newPost.body.substring(0, start);
    const selected = newPost.body.substring(start, end);
    const after = newPost.body.substring(end);
    setNewPost({ ...newPost, body: before + prefix + selected + suffix + after });
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const currentUserName = profile?.display_name || profile?.full_name || user?.displayName || "Developer";
  const currentUserAvatar = profile?.avatar_url || user?.photoURL || "";

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsPublishing(true);
    
    try {
      let imageUrl = "";
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", "ffjmgu1h"); 
        formData.append("cloud_name", "dmmv8phgq"); 
        const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/dmmv8phgq/image/upload`, { method: "POST", body: formData });
        const cloudinaryData = await cloudinaryRes.json();
        if (cloudinaryData.secure_url) imageUrl = cloudinaryData.secure_url; 
      }

      const tagsArray = newPost.tags.split(",").map(tag => tag.trim().toLowerCase()).filter(tag => tag !== "");
      
      await addDoc(collection(firestoreDB, "community_posts"), {
        title: newPost.title, body: newPost.body, tags: tagsArray, imageUrl: imageUrl,
        authorId: user.uid, authorName: currentUserName, authorAvatar: currentUserAvatar,
        likes: [], dislikes: [], replies: [], createdAt: serverTimestamp(), isEdited: false
      });
      
      setShowCreateModal(false); setNewPost({ title: "", body: "", tags: "" }); setImageFile(null);
    } catch (error) { console.error("Error creating post:", error); } 
    finally { setIsPublishing(false); }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.tags?.some(tag => tag.includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans relative flex flex-col selection:bg-blue-500/30">
      <SaaSBackground />

      <div className="relative z-50">
        <Navbar />
        <GlobalRibbon />
      </div>

      {/* Changed pt-24 sm:pt-32 to pt-16 sm:pt-32 to close the gap on mobile */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-8 pt-16 pb-20 sm:pt-32 sm:pb-32 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10 flex-1">
        
        {/* LEFT COLUMN: Main Feed */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8 order-2 lg:order-1">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-2 pb-6 sm:pb-8 border-b border-white/[0.06]">
             <div>
               <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight">Discussions</h1>
               <p className="text-sm sm:text-[15px] text-zinc-400 mt-2 font-medium">Ask questions, share architecture, and collaborate with the community.</p>
             </div>
             <div className="w-fit bg-white/[0.02] border border-white/[0.06] px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-zinc-300 shadow-inner flex items-center gap-2 backdrop-blur-md">
                <Sparkles size={16} className="text-blue-400" /> {posts.length} Active Threads
             </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {filteredPosts.map((post) => (
              <PostItem key={post.id} post={post} user={user} currentUserName={currentUserName} currentUserAvatar={currentUserAvatar} />
            ))}
          </div>
          
          {filteredPosts.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 sm:py-32 border border-dashed border-white/[0.1] rounded-[24px] sm:rounded-[32px] bg-white/[0.01] backdrop-blur-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/[0.03] rounded-2xl border border-white/[0.05] flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner">
                <MessageCircle className="text-zinc-600" size={24} strokeWidth={1.5} />
              </div>
              <p className="text-white font-semibold mb-2 text-lg sm:text-xl tracking-tight">No discussions found</p>
              <p className="text-sm sm:text-[15px] text-zinc-500 font-medium">Adjust your search or start a new thread to get help.</p>
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        {/* Converted to a flex-col container to easily swap elements via order classes on mobile */}
        <aside className="lg:col-span-4 flex flex-col gap-6 sm:gap-8 lg:sticky lg:top-32 h-fit order-1 lg:order-2">
          
          {/* Search Input Box - order-1 on mobile, order-2 on sm+ */}
          <div className="relative group order-1 sm:order-2 w-full">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[16px] sm:rounded-[20px] blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
            <div className="relative flex items-center bg-[#09090b] border border-white/[0.08] rounded-[16px] sm:rounded-[20px] px-4 py-3 sm:px-5 sm:py-4 shadow-2xl transition-all group-focus-within:border-white/[0.2] group-focus-within:bg-black">
              <Search className="text-zinc-500 mr-2 sm:mr-3" size={18} />
              <input 
                ref={searchInputRef}
                type="text" placeholder="Search topics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm sm:text-[15px] font-medium focus:outline-none text-white placeholder:text-zinc-600"
              />
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/[0.05] rounded-md border border-white/[0.05] text-zinc-500 text-xs font-mono ml-2">
                <Command size={12} /> K
              </div>
            </div>
          </div>

          {/* Start New Discussion Button - order-2 on mobile, order-1 on sm+ */}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full order-2 sm:order-1 bg-gradient-to-b from-white to-zinc-200 hover:from-white hover:to-white text-black px-6 py-3.5 sm:py-4 rounded-[20px] transition-all font-bold text-sm sm:text-[15px] shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
          >
            <SquarePen size={18} strokeWidth={2.5}/> Start New Discussion
          </button>

          {/* Top Contributors - order-3 */}
          <div className="order-3 bg-white/[0.02] border border-white/[0.06] rounded-[20px] sm:rounded-[24px] overflow-hidden hidden sm:block shadow-2xl backdrop-blur-xl w-full">
            <div className="p-5 sm:p-6 border-b border-white/[0.04] flex items-center gap-3 bg-white/[0.01]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner">
                <Trophy size={18} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white tracking-tight text-md sm:text-lg">Top Contributors</h3>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-medium">Community MVPs</p>
              </div>
            </div>
            
            <div className="p-3 sm:p-4 space-y-1">
              {topContributors.length > 0 ? (
                topContributors.map((contributor, index) => (
                  <div key={contributor.name} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 hover:bg-white/[0.04] rounded-xl transition-colors group/item">
                    <span className={`text-[11px] sm:text-xs font-bold font-mono tracking-widest w-5 text-center ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-zinc-300' : index === 2 ? 'text-orange-400' : 'text-zinc-600'}`}>
                      0{index + 1}
                    </span>
                    <div className="relative">
                      <img src={contributor.avatar} alt={contributor.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-white/5 group-hover/item:ring-white/20 transition-all" />
                      {index === 0 && <div className="absolute -top-1.5 -right-1.5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]"><Sparkles size={14}/></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-[14px] text-zinc-200 truncate">{contributor.name}</p>
                      <p className="text-[10px] sm:text-xs font-medium text-zinc-500 mt-0.5 flex items-center gap-1.5">
                         <CheckCircle2 size={12} className="text-blue-400/80"/> {contributor.score} Solutions
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 sm:p-8 text-center text-sm sm:text-[15px] text-zinc-600 font-medium">Not enough data to rank.</div>
              )}
            </div>
          </div>
        </aside>

      </main>

      {/* --- CREATE POST MODAL --- */}
      <AnimatePresence>
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#030303]/80 backdrop-blur-xl" onClick={() => setShowCreateModal(false)} />
          <motion.div 
            initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#09090b] border border-white/[0.08] rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 w-full max-w-6xl relative z-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4 sm:mb-8 border-b border-white/[0.06] pb-4 sm:pb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1 sm:mb-2">Create Discussion</h2>
                    <p className="text-xs sm:text-[15px] text-zinc-400 font-medium">Share your thoughts, ask questions, or collaborate on architecture.</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white transition-all p-2 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.1] rounded-xl sm:rounded-2xl active:scale-95"><X size={20} className="sm:hidden"/><X size={24} className="hidden sm:block"/></button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 overflow-y-auto pr-2 custom-scrollbar pb-2 sm:pb-4">
                
                {/* Form Side */}
                <form onSubmit={handleCreatePost} className="space-y-4 sm:space-y-6 flex flex-col h-full">
                <div>
                    <label className="block text-xs sm:text-sm font-semibold text-zinc-300 mb-2">Title <span className="text-red-500">*</span></label>
                    <input 
                    type="text" required placeholder="e.g. How to optimize a large React context?" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/[0.08] text-white rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-[15px] font-medium focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
                    />
                </div>
                
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs sm:text-sm font-semibold text-zinc-300 mb-2">Details <span className="text-red-500">*</span></label>
                  <div className="flex flex-col flex-1 border border-white/[0.08] rounded-xl sm:rounded-2xl overflow-hidden focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all bg-black/40 shadow-inner">
                  <MarkdownToolbar onInsert={insertFormatCreatePost} />
                  <textarea 
                      ref={createBodyRef}
                      required 
                      rows={8}
                      placeholder="Describe the issue or concept here in detail..." 
                      value={newPost.body} 
                      onChange={e => setNewPost({...newPost, body: e.target.value})}
                      className="w-full h-full min-h-[150px] sm:min-h-[250px] bg-transparent text-zinc-200 px-4 py-4 sm:px-5 sm:py-5 text-sm sm:text-[15px] focus:outline-none resize-y placeholder:text-zinc-600 leading-relaxed"
                  ></textarea>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-zinc-300 mb-2">Tags <span className="text-red-500">*</span></label>
                        <input 
                        type="text" required placeholder="e.g. react, architecture" value={newPost.tags} onChange={e => setNewPost({...newPost, tags: e.target.value})}
                        className="w-full bg-black/40 border border-white/[0.08] text-zinc-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-[15px] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-zinc-300 mb-2">Attachment (Optional)</label>
                        <div className="bg-black/40 border border-white/[0.08] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between shadow-inner hover:border-white/[0.15] transition-colors cursor-pointer" onClick={() => document.getElementById('image-upload')?.click()}>
                            <div className="text-sm sm:text-[15px] font-medium text-zinc-400 flex items-center gap-2 sm:gap-3 w-full">
                              <div className="p-1.5 sm:p-2 bg-white/[0.05] rounded-lg text-white"><ImageIcon size={16} className="sm:hidden" /><ImageIcon size={18} className="hidden sm:block" /></div>
                              <span className="truncate text-white">{imageFile ? imageFile.name : "Upload image file"}</span>
                            </div>
                            <input id="image-upload" type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageChange} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 mt-2 sm:mt-4 border-t border-white/[0.06]">
                    <button type="button" onClick={() => setShowCreateModal(false)} disabled={isPublishing} className="px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-[15px] font-semibold text-zinc-400 hover:text-white transition-all bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.08] rounded-xl active:scale-95">
                    Cancel
                    </button>
                    <button type="submit" disabled={isPublishing || !newPost.title || !newPost.body || !newPost.tags} className="px-5 py-2.5 sm:px-8 sm:py-3 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-sm sm:text-[15px] font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400/20 active:scale-95">
                    {isPublishing ? <><Loader2 size={16} className="animate-spin" /> Publishing...</> : "Publish Discussion"}
                    </button>
                </div>
                </form>

                {/* Preview Side */}
                <div className="hidden lg:flex flex-col border-l border-white/[0.06] pl-12 h-full">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Live Preview</h3>
                    <div className="flex-1 bg-white/[0.01] rounded-[24px] border border-white/[0.04] p-8 overflow-y-auto min-h-[400px] shadow-inner backdrop-blur-sm custom-scrollbar">
                        {newPost.title || newPost.body || imageFile ? (
                            <div className="break-words">
                                <h3 className="text-3xl font-bold text-white mb-6 leading-snug tracking-tight">{newPost.title || "Post Title Preview"}</h3>
                                <div className="text-[15px] text-zinc-300 whitespace-pre-wrap leading-relaxed font-normal pb-6">
                                    {renderText(newPost.body)}
                                </div>
                                {imageFile && (
                                    <div className="mt-4 bg-black/50 border border-white/[0.05] p-3 rounded-2xl inline-block w-full">
                                        <img src={URL.createObjectURL(imageFile)} alt="Preview" className="max-h-[350px] w-full object-contain rounded-xl" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-5 opacity-40">
                                <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-[24px]">
                                    <MessageSquare size={40} strokeWidth={1.5} />
                                </div>
                                <p className="text-[15px] font-medium">Your preview will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
                
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* --- SCROLL TO TOP BUTTON --- */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.8 }}
            className="fixed bottom-6 right-6 lg:bottom-12 lg:right-12 z-[100]"
          >
            <button
              onClick={scrollToTop}
              className="p-3 lg:p-4 bg-white/[0.05] backdrop-blur-xl hover:bg-white text-zinc-300 hover:text-black rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all border border-white/[0.1] flex items-center justify-center group active:scale-90"
              aria-label="Scroll to top"
            >
              <ArrowUp size={20} strokeWidth={2.5} className="group-hover:-translate-y-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
}