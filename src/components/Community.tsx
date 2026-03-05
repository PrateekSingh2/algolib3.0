import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  serverTimestamp, doc, updateDoc, deleteDoc, arrayUnion
} from "firebase/firestore";
import { auth, firestoreDB } from "../lib/firebase"; 
import { 
  MessageSquare, Image as ImageIcon, Reply, Loader2, 
  CheckCircle2, Trophy, Search, Edit2, Trash2, X, Save,
  MoreVertical, ChevronUp, ChevronDown, AlertTriangle, ChevronRight, Hash,
  Heading, Bold, Italic, ListOrdered, List, Minus, Quote, Code, Terminal, Link, SquarePen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar"; 
import GlobalRibbon from "./GlobalRibbon";

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

// --- Tech Grid Background ---
const TechGridBackground = () => (
  <div className="fixed inset-0 z-0 bg-[#0A0A0A] pointer-events-none">
     <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
     <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.15),transparent)]" />
  </div>
);

// --- Simple Markdown/Code Renderer ---
const renderText = (text: string) => {
  if (!text) return null;
  
  // 1. Handle code blocks first (using unicode hex to avoid markdown parsing issues in the file itself)
  const blockParts = text.split(/(\u0060\u0060\u0060[\s\S]*?\u0060\u0060\u0060)/g);
  return blockParts.map((blockPart, index) => {
    if (blockPart.startsWith('\u0060\u0060\u0060') && blockPart.endsWith('\u0060\u0060\u0060')) {
      const codeContent = blockPart.slice(3, -3);
      return (
        <pre key={`block-${index}`} className="bg-[#0A0A0A] border border-zinc-800 p-3 rounded-lg my-2 overflow-x-auto font-mono text-sm text-blue-300">
          {codeContent}
        </pre>
      );
    }
    
    // 2. Handle bold
    const boldParts = blockPart.split(/(\*\*[\s\S]*?\*\*)/g);
    return boldParts.map((boldPart, bIdx) => {
      if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
          return <strong key={`bold-${index}-${bIdx}`} className="text-white font-bold">{boldPart.slice(2, -2)}</strong>;
      }

      // 3. Handle italic
      const italicParts = boldPart.split(/(_[\s\S]*?_)/g);
      return italicParts.map((italicPart, iIdx) => {
        if (italicPart.startsWith('_') && italicPart.endsWith('_')) {
            return <em key={`italic-${index}-${bIdx}-${iIdx}`} className="italic text-zinc-300">{italicPart.slice(1, -1)}</em>;
        }

        // 4. Handle links
        const linkParts = italicPart.split(/(\[[^\]]+\]\([^)]+\))/g);
        return linkParts.map((linkPart, lIdx) => {
            const linkMatch = linkPart.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                let url = linkMatch[2];
                // Check if it's not an absolute URL and fix it
                if (!url.match(/^https?:\/\//i) && !url.startsWith('mailto:')) {
                    url = `https://${url}`;
                }
                return (
                    <a key={`link-${index}-${bIdx}-${iIdx}-${lIdx}`} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium">
                        {linkMatch[1]}
                    </a>
                );
            }

            // 5. Handle LeetCode style inline code
            const inlineParts = linkPart.split(/(`[^`]+`)/g);
            return inlineParts.map((part, pIdx) => {
                if (part.startsWith('`') && part.endsWith('`')) {
                    return (
                        <code key={`inline-${index}-${bIdx}-${iIdx}-${lIdx}-${pIdx}`} className="bg-zinc-800/80 text-[#5eead4] px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-zinc-700/50">
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

// --- Custom Delete Confirmation Modal ---
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, type }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, type: 'post' | 'reply' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#18181B] border border-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-md relative z-10"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-full shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Delete {type === 'post' ? 'Discussion' : 'Reply'}</h3>
            <p className="text-sm text-zinc-400">Are you sure you want to permanently delete this {type}? This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]">Delete</button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Format Toolbar ---
const MarkdownToolbar = ({ onInsert }: { onInsert: (prefix: string, suffix: string) => void }) => {
  const tools = [
      { icon: <Heading size={15}/>, prefix: '### ', suffix: '', label: 'Heading' },
      { icon: <Bold size={15}/>, prefix: '**', suffix: '**', label: 'Bold' },
      { icon: <Italic size={15}/>, prefix: '_', suffix: '_', label: 'Italic' },
      { icon: <span className="text-zinc-600 font-light mx-0.5">|</span>, action: 'separator' },
      { icon: <ListOrdered size={15}/>, prefix: '1. ', suffix: '', label: 'Ordered List' },
      { icon: <List size={15}/>, prefix: '- ', suffix: '', label: 'Unordered List' },
      { icon: <Minus size={15}/>, prefix: '\n---\n', suffix: '', label: 'Horizontal Rule' },
      { icon: <span className="text-zinc-600 font-light mx-0.5">|</span>, action: 'separator' },
      { icon: <Quote size={15}/>, prefix: '> ', suffix: '', label: 'Blockquote' },
      { icon: <Code size={15}/>, prefix: '\n\u0060\u0060\u0060\n', suffix: '\n\u0060\u0060\u0060\n', label: 'Code Block' },
      { icon: <Terminal size={15}/>, prefix: '`', suffix: '`', label: 'Inline Code' },
      { icon: <Link size={15}/>, prefix: '[', suffix: '](url)', label: 'Link' },
  ];

  return (
      <div className="flex items-center gap-0.5 bg-[#18181B] border border-zinc-800 border-b-0 rounded-t-lg px-2 py-1.5 overflow-x-auto">
          {tools.map((tool, idx) => 
              tool.action === 'separator' ? (
                  <React.Fragment key={idx}>{tool.icon}</React.Fragment>
              ) : (
                  <button
                      key={idx} type="button" title={tool.label}
                      onClick={() => onInsert(tool.prefix!, tool.suffix!)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                  >
                      {tool.icon}
                  </button>
              )
          )}
      </div>
  );
};


// --- Sub-component: Individual Reply Item ---
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
    const scrollTop = textarea.scrollTop;
    const before = editContent.substring(0, start);
    const selected = editContent.substring(start, end);
    const after = editContent.substring(end);
    
    setEditContent(before + prefix + selected + suffix + after);
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        textarea.scrollTop = scrollTop;
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
    <motion.div layout className={`relative text-sm p-4 rounded-xl transition-all duration-300 ${reply.isAccepted ? "bg-[#10B981]/5 border border-[#10B981]/20" : "bg-[#18181B] border border-zinc-800"}`}>
      {reply.isAccepted && <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#10B981] rounded-r-full" />}

      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex items-center gap-2">
          <img src={reply.authorAvatar} alt="" className="w-6 h-6 rounded-md object-cover border border-zinc-700" />
          <div className="flex flex-col">
             <span className="font-semibold text-zinc-200 text-xs">{reply.authorName}</span>
             <span className="text-zinc-500 text-[10px]">
               {new Date(reply.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
               {reply.isEdited && <span className="ml-1 italic text-zinc-600">(edited)</span>}
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {(isPostAuthor || reply.isAccepted) && (
            <button onClick={handleToggleAcceptReply} disabled={!isPostAuthor} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold transition-all ${reply.isAccepted ? "text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20" : "text-zinc-400 hover:bg-zinc-800 border border-transparent"} ${!isPostAuthor && "cursor-default"}`}>
              <CheckCircle2 size={14} className={reply.isAccepted ? "text-[#10B981]" : ""} />
              {reply.isAccepted ? "Solution" : "Mark as Solution"}
            </button>
          )}

          {isReplyAuthor && !isEditing && (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors">
                 <MoreVertical size={16} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-1 w-32 bg-[#18181B] border border-zinc-700 rounded-lg shadow-xl z-40 py-1 overflow-hidden">
                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"><Edit2 size={14}/> Edit</button>
                    <button onClick={() => { setShowDeleteModal(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 flex items-center gap-2"><Trash2 size={14}/> Delete</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-2 flex flex-col">
          <MarkdownToolbar onInsert={insertFormatEditReply} />
          <textarea 
            ref={editReplyRef}
            value={editContent} onChange={e => setEditContent(e.target.value)} 
            className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-b-lg p-3 text-zinc-200 text-sm focus:outline-none focus:border-blue-500 resize-y cursor-text" rows={4}
          />
          <div className="flex gap-2 justify-end pt-3">
            <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors font-medium">Cancel</button>
            <button onClick={handleUpdateReply} className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition-colors">Save</button>
          </div>
        </div>
      ) : (
        <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-sm">{renderText(reply.content)}</div>
      )}

      {/* Techy Voting Bar */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-zinc-800/50">
        <button onClick={() => handleReplyVote('up')} className={`transition-colors flex items-center gap-1.5 ${reply.likes?.includes(user?.uid || "") ? 'text-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <ChevronUp size={18} />
          <span className="text-xs font-semibold">{replyScore > 0 ? replyScore : 0}</span>
        </button>
        <button onClick={() => handleReplyVote('down')} className={`transition-colors flex items-center gap-1.5 ${reply.dislikes?.includes(user?.uid || "") ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <ChevronDown size={18} />
        </button>
      </div>
    </motion.div>

    <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteReply} type="reply" />
    </>
  );
};


// --- Sub-component: Individual Post Item ---
const PostItem = ({ post, user }: { post: Post, user: User | null }) => {
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
  const isLongPost = post.body.length > 250 || post.body.split('\n').length > 5 || !!post.imageUrl;

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
    const scrollTop = textarea.scrollTop;
    const before = editForm.body.substring(0, start);
    const selected = editForm.body.substring(start, end);
    const after = editForm.body.substring(end);
    
    setEditForm({ ...editForm, body: before + prefix + selected + suffix + after });
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        textarea.scrollTop = scrollTop;
    }, 0);
  };

  const insertFormatReply = (prefix: string, suffix: string) => {
    const textarea = replyBodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const scrollTop = textarea.scrollTop;
    const before = replyContent.substring(0, start);
    const selected = replyContent.substring(start, end);
    const after = replyContent.substring(end);
    
    setReplyContent(before + prefix + selected + suffix + after);
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        textarea.scrollTop = scrollTop;
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
        id: crypto.randomUUID(), authorId: user.uid, authorName: user.displayName || "Developer",
        authorAvatar: user.photoURL || "", content: replyContent.trim(), createdAt: Date.now(),
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
    <div id={post.id} className="bg-[#121214] border border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row gap-5 transition-colors hover:border-blue-500/30 scroll-mt-[120px]">
      
      {/* LEFT COLUMN: StackOverflow Style Voting */}
      <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start min-w-[50px] shrink-0 border-b sm:border-b-0 border-zinc-800 pb-3 sm:pb-0">
        <div className="flex flex-row sm:flex-col items-center gap-1">
          <button onClick={() => handleVote('up')} className={`p-1.5 rounded-full transition-colors ${post.likes?.includes(user?.uid || "") ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}>
            <ChevronUp size={28} strokeWidth={2.5} />
          </button>
          <span className={`text-lg font-bold mx-2 sm:mx-0 ${score > 0 ? 'text-blue-500' : score < 0 ? 'text-red-500' : 'text-zinc-300'}`}>
            {score}
          </span>
          <button onClick={() => handleVote('down')} className={`p-1.5 rounded-full transition-colors ${post.dislikes?.includes(user?.uid || "") ? 'text-red-500 bg-red-500/10' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}>
            <ChevronDown size={28} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Content */}
      <div className="flex-1 min-w-0">
        
        {/* Author Header & Three Dots */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <img src={post.authorAvatar} alt="author" className="w-6 h-6 rounded-md object-cover border border-zinc-700" />
            <span className="font-medium text-sm text-zinc-200">{post.authorName}</span>
            <span className="text-zinc-600 text-xs hidden sm:inline">•</span>
            <span className="text-zinc-500 text-xs flex items-center gap-1">
              {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Just now"}
              {post.isEdited && <span className="italic text-zinc-600">(edited)</span>}
            </span>
          </div>

          {isAuthor && !isEditing && (
            <div className="relative z-20">
              <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-800 transition-colors">
                <MoreVertical size={18} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-1 w-32 bg-[#18181B] border border-zinc-700 rounded-lg shadow-xl z-40 py-1 overflow-hidden">
                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"><Edit2 size={14}/> Edit</button>
                    <button onClick={() => { setShowDeleteModal(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 flex items-center gap-2"><Trash2 size={14}/> Delete</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Post Body / Edit Mode */}
        {isEditing ? (
          <div className="space-y-4 mb-5 bg-[#0A0A0A] p-4 rounded-xl border border-zinc-800">
            <input 
              type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} 
              className="w-full bg-transparent text-white font-bold text-lg border-b border-zinc-800 pb-2 focus:outline-none focus:border-blue-500 cursor-text" placeholder="Title"
            />
            <div className="flex flex-col">
              <MarkdownToolbar onInsert={insertFormatEditPost} />
              <textarea 
                ref={editBodyRef}
                value={editForm.body} onChange={e => setEditForm({...editForm, body: e.target.value})} rows={6}
                className="w-full bg-[#121214] text-zinc-300 text-sm border border-zinc-800 border-t-0 rounded-b-lg p-3 focus:outline-none focus:border-blue-500 resize-y cursor-text" placeholder="Description..."
              />
            </div>
            <input 
              type="text" value={editForm.tags} onChange={e => setEditForm({...editForm, tags: e.target.value})} 
              className="w-full bg-[#121214] text-blue-400 text-xs border border-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-text" placeholder="Tags (comma separated)"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleUpdatePost} disabled={isUpdating} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50">
                {isUpdating ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Update
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white mb-3 leading-tight pr-8">{post.title}</h3>
            
            {/* Uniform Expanded/Collapsed Wrapper */}
            <div className={`relative transition-all duration-300 ${!isExpanded && isLongPost ? 'max-h-[160px] overflow-hidden' : ''}`}>
              <div className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed pb-4">
                {renderText(post.body)}
              </div>
              
              {/* Optional Image inside the wrapper to keep uniform height */}
              {post.imageUrl && (
                <div 
                  className={`mb-5 bg-[#0A0A0A] border border-zinc-800 p-1.5 rounded-lg relative inline-block w-full max-w-lg ${isMagnified ? 'cursor-zoom-out z-10' : 'cursor-zoom-in'}`}
                  onClick={() => setIsMagnified(!isMagnified)} onMouseMove={handleImageMouseMove} onMouseLeave={() => setIsMagnified(false)}
                >
                  <img src={post.imageUrl} alt="Context" style={{ transform: isMagnified ? 'scale(2)' : 'scale(1)', transformOrigin: `${magPos.x} ${magPos.y}` }} className="max-h-[300px] w-full object-contain rounded transition-transform duration-200 ease-out" />
                </div>
              )}

              {/* Fade Out Effect */}
              {!isExpanded && isLongPost && <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[#121214] to-transparent pointer-events-none" />}
            </div>

            {/* Expand / Collapse Button */}
            {isLongPost && (
              <button onClick={() => setIsExpanded(!isExpanded)} className="text-blue-500 hover:text-blue-400 text-xs font-medium mb-4 mt-2 transition-colors">
                {isExpanded ? "Show less" : "Expand / See more"}
              </button>
            )}
          </>
        )}

        {/* Footer: Tags & Reply Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-zinc-800/50">
          <div className="flex flex-wrap gap-2">
            {post.tags?.map((tag, idx) => (
              <span key={idx} className="flex items-center text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md transition-colors hover:bg-blue-500/20">
                 {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-zinc-500 text-sm font-medium">
               <MessageSquare size={16} /> {post.replies?.length || 0}
            </div>
            <button onClick={() => setShowReplyBox(!showReplyBox)} className="flex-1 sm:flex-none text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 flex justify-center items-center gap-2 transition-colors px-4 py-1.5 rounded-lg">
              <Reply size={14} /> {showReplyBox ? "Cancel" : "Reply"}
            </button>
          </div>
        </div>

        {/* Reply Input Box */}
        <AnimatePresence>
        {showReplyBox && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 bg-[#0A0A0A] p-2 rounded-xl border border-zinc-800 focus-within:border-blue-500/50 transition-colors overflow-hidden">
            <MarkdownToolbar onInsert={insertFormatReply} />
            <textarea 
              ref={replyBodyRef}
              rows={4} placeholder="Add your response..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
              className="w-full bg-transparent text-zinc-200 border-none px-4 py-3 text-sm focus:outline-none resize-y cursor-text"
            />
            <div className="flex justify-end px-3 py-2 border-t border-zinc-800/50 bg-[#121214]">
              <button onClick={handleReplySubmit} disabled={isSubmittingReply || !replyContent.trim()} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2">
                {isSubmittingReply ? <Loader2 size={14} className="animate-spin" /> : "Post"}
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* REPLIES SECTION (Top 1 or All) */}
        {sortedReplies.length > 0 && (
          <div className="mt-5 space-y-3 pl-2 sm:pl-4 border-l-2 border-zinc-800">
            {sortedReplies.slice(0, showAllReplies ? sortedReplies.length : 1).map((reply) => (
               <ReplyItem key={reply.id} reply={reply} postId={post.id} postReplies={post.replies} isPostAuthor={isAuthor} user={user} />
            ))}
            
            {sortedReplies.length > 1 && (
              <button onClick={() => setShowAllReplies(!showAllReplies)} className="text-blue-500 hover:text-blue-400 text-xs font-medium mt-2 flex items-center gap-1 transition-colors ml-2">
                {showAllReplies ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                {showAllReplies ? "Collapse replies" : `View all ${sortedReplies.length} replies`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    
    {/* Global Post Delete Modal */}
    <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeletePost} type="post" />
    </>
  );
};


// --- MAIN COMMUNITY PAGE ---
export default function Community() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newPost, setNewPost] = useState({ title: "", body: "", tags: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const createBodyRef = useRef<HTMLTextAreaElement>(null);
  
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(firestoreDB, "community_posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });
    return () => unsubscribe();
  }, []);

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
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const insertFormatCreatePost = (prefix: string, suffix: string) => {
    const textarea = createBodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const scrollTop = textarea.scrollTop;
    const before = newPost.body.substring(0, start);
    const selected = newPost.body.substring(start, end);
    const after = newPost.body.substring(end);
    
    setNewPost({ ...newPost, body: before + prefix + selected + suffix + after });
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        textarea.scrollTop = scrollTop;
    }, 0);
  };

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
        authorId: user.uid, authorName: user.displayName || "Developer", authorAvatar: user.photoURL || "",
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
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans relative flex flex-col selection:bg-blue-500/30">
      <TechGridBackground />

      <div className="relative z-50">
        <Navbar />
        <GlobalRibbon />
      </div>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-32 pb-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 flex-1">
        
        {/* LEFT COLUMN: Main Feed */}
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
          
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
             <div>
               <h1 className="text-2xl font-bold text-white tracking-tight">Discussions</h1>
               <p className="text-sm text-zinc-500 mt-1">Ask questions, share code, and collaborate.</p>
             </div>
             <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400">
                {posts.length} Threads
             </div>
          </div>

          {filteredPosts.map((post) => (
            <PostItem key={post.id} post={post} user={user} />
          ))}
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-20 border border-zinc-800 rounded-2xl bg-[#121214]">
              <MessageSquare className="mx-auto text-zinc-600 mb-4" size={40} strokeWidth={1.5} />
              <p className="text-white font-semibold mb-1 text-lg">No discussions found</p>
              <p className="text-sm text-zinc-500">Try adjusting your search or start a new thread.</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-32 h-fit order-1 lg:order-2">
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl transition-colors font-medium text-sm shadow-lg flex items-center justify-center gap-2"
          >
            <SquarePen size={18} /> Ask a Question
          </button>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" placeholder="Search by keyword or tag..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121214] border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white placeholder:text-zinc-600 cursor-text"
            />
          </div>

          {/* Top Contributors */}
          <div className="bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden hidden sm:block">
            <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
              <Trophy size={16} className="text-blue-500" />
              <h3 className="font-semibold text-white text-sm">Top Contributors</h3>
            </div>
            
            <div className="p-2">
              {topContributors.length > 0 ? (
                topContributors.map((contributor, index) => (
                  <div key={contributor.name} className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                    <span className="text-zinc-600 text-xs font-bold w-3 text-center">{index + 1}</span>
                    <img src={contributor.avatar} alt={contributor.name} className="w-8 h-8 rounded-md object-cover border border-zinc-700" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-zinc-200 truncate">{contributor.name}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                         {contributor.score} Solutions
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-zinc-600">No data available.</div>
              )}
            </div>
          </div>
        </aside>

      </main>

      {/* --- CREATE POST MODAL --- */}
      <AnimatePresence>
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <motion.div 
            initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 10, opacity: 0 }}
            className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 sm:p-8 w-full max-w-5xl relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Create a Discussion</h2>
                    <p className="text-sm text-zinc-400 mt-1">Get help, share knowledge, or start a conversation.</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white transition-colors p-1 bg-zinc-800 rounded-md"><X size={20}/></button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Form Side */}
                <form onSubmit={handleCreatePost} className="space-y-4 flex flex-col h-full">
                <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">Title</label>
                    <input 
                    type="text" required placeholder="e.g. How to optimize a React useEffect?" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600 cursor-text"
                    />
                </div>
                
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">Body</label>
                  <div className="flex flex-col flex-1">
                  <MarkdownToolbar onInsert={insertFormatCreatePost} />
                  <textarea 
                      ref={createBodyRef}
                      required 
                      rows={14} /* Increased from 8 to 14 */
                      placeholder="Describe your problem or share your thoughts here..." 
                      value={newPost.body} 
                      onChange={e => setNewPost({...newPost, body: e.target.value})}
                      /* Added min-h-[300px] and changed resize-none to resize-y */
                      className="w-full h-full min-h-[300px] bg-[#0A0A0A] border border-zinc-800 border-t-0 text-zinc-200 rounded-b-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-y placeholder:text-zinc-600 cursor-text"
                  ></textarea>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">Tags</label>
                        <input 
                        type="text" required placeholder="e.g. react, performance" value={newPost.tags} onChange={e => setNewPost({...newPost, tags: e.target.value})}
                        className="w-full bg-[#0A0A0A] border border-zinc-800 text-blue-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600 cursor-text"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">Attachment</label>
                        <div className="bg-[#0A0A0A] border border-zinc-800 rounded-lg px-4 py-2.5 flex items-center justify-between">
                            <label className="cursor-pointer text-sm text-zinc-300 hover:text-white transition-colors flex items-center gap-2 w-full">
                            <ImageIcon size={16} className="text-blue-500 shrink-0" /> 
                            <span className="truncate">{imageFile ? "Change Image" : "Upload Image"}</span>
                            <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageChange} />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-zinc-800">
                    <button type="button" onClick={() => setShowCreateModal(false)} disabled={isPublishing} className="px-5 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    Cancel
                    </button>
                    <button type="submit" disabled={isPublishing} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg">
                    {isPublishing ? <><Loader2 size={16} className="animate-spin" /> Posting...</> : "Post Discussion"}
                    </button>
                </div>
                </form>

                {/* Preview Side */}
                <div className="hidden lg:flex flex-col border-l border-zinc-800 pl-8 h-full">
                    <h3 className="text-sm font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">Live Preview</h3>
                    <div className="flex-1 bg-[#121214] rounded-xl border border-zinc-800 p-6 overflow-y-auto min-h-[400px]">
                        {newPost.title || newPost.body || imageFile ? (
                            <div className="break-words">
                                <h3 className="text-xl font-bold text-white mb-4 leading-tight">{newPost.title || "Post Title Preview"}</h3>
                                <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed pb-4">
                                    {renderText(newPost.body)}
                                </div>
                                {imageFile && (
                                    <div className="mt-2 bg-[#0A0A0A] border border-zinc-800 p-1.5 rounded-lg inline-block w-full">
                                        <img src={URL.createObjectURL(imageFile)} alt="Preview" className="max-h-[250px] w-full object-contain rounded" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                                <div className="p-4 bg-zinc-800/30 rounded-full">
                                    <MessageSquare size={32} />
                                </div>
                                <p className="text-sm font-medium">Start typing to see a live preview</p>
                            </div>
                        )}
                    </div>
                </div>
                
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}