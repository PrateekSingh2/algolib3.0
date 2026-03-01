import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  serverTimestamp, doc, updateDoc, deleteDoc, arrayUnion
} from "firebase/firestore";
import { auth, firestoreDB } from "../lib/firebase"; 
import { 
  MessageSquare, PlusCircle, Image as ImageIcon, Reply, Loader2, 
  CheckCircle2, Trophy, Search, Edit2, Trash2, X, Save,
  MoreVertical, ChevronUp, ChevronDown, AlertTriangle, ChevronRight, Hash
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
}

// --- Tech Grid Background ---
const TechGridBackground = () => (
  <div className="fixed inset-0 z-0 bg-[#0A0A0A] pointer-events-none">
     <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
     <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.15),transparent)]" />
  </div>
);

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


// --- Sub-component: Individual Reply Item ---
const ReplyItem = ({ reply, postId, postReplies, isPostAuthor, user }: { reply: ReplyType, postId: string, postReplies: ReplyType[], isPostAuthor: boolean, user: User | null }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const isReplyAuthor = user?.uid === reply.authorId;

  const handleUpdateReply = async () => {
    if (!editContent.trim()) return;
    const updatedReplies = postReplies.map(r => r.id === reply.id ? { ...r, content: editContent } : r);
    await updateDoc(doc(firestoreDB, "community_posts", postId), { replies: updatedReplies });
    setIsEditing(false);
  };

  const handleDeleteReply = async () => {
    const updatedReplies = postReplies.filter(r => r.id !== reply.id);
    await updateDoc(doc(firestoreDB, "community_posts", postId), { replies: updatedReplies });
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
             <span className="text-zinc-500 text-[10px]">{new Date(reply.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
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
        <div className="mt-2 space-y-3 bg-[#0A0A0A] p-3 rounded-lg border border-zinc-800">
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full bg-transparent text-zinc-200 text-sm focus:outline-none resize-y" rows={3}/>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors font-medium">Cancel</button>
            <button onClick={handleUpdateReply} className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition-colors">Save</button>
          </div>
        </div>
      ) : (
        <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-sm">{reply.content}</p>
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

  // Auto-collapse long posts initially
  const isLongPost = post.body.length > 250 || post.body.split('\n').length > 5;
  const isAuthor = user?.uid === post.authorId;
  const score = (post.likes?.length || 0) - (post.dislikes?.length || 0);

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

  const handleUpdatePost = async () => {
    if (!isAuthor || !editForm.title.trim() || !editForm.body.trim()) return;
    setIsUpdating(true);
    try {
      const tagsArray = editForm.tags.split(",").map(tag => tag.trim().toLowerCase()).filter(tag => tag !== "");
      await updateDoc(doc(firestoreDB, "community_posts", post.id), { title: editForm.title, body: editForm.body, tags: tagsArray });
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

  // Logic for Top 1 Reply
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
            <span className="text-zinc-500 text-xs">{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Just now"}</span>
          </div>

          {isAuthor && !isEditing && (
            <div className="relative">
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
          <div className="space-y-3 mb-5 bg-[#0A0A0A] p-4 rounded-xl border border-zinc-800">
            <input 
              type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} 
              className="w-full bg-transparent text-white font-bold text-lg border-b border-zinc-800 pb-2 focus:outline-none focus:border-blue-500" placeholder="Title"
            />
            <textarea 
              value={editForm.body} onChange={e => setEditForm({...editForm, body: e.target.value})} rows={5}
              className="w-full bg-[#121214] text-zinc-300 text-sm border border-zinc-800 rounded-lg p-3 focus:outline-none focus:border-blue-500 resize-y" placeholder="Description..."
            />
            <input 
              type="text" value={editForm.tags} onChange={e => setEditForm({...editForm, tags: e.target.value})} 
              className="w-full bg-[#121214] text-blue-400 text-xs border border-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" placeholder="Tags (comma separated)"
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
            
            {/* Expandable Text Block */}
            <div className="relative mb-4">
              <div className={`text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed ${!isExpanded && isLongPost ? 'max-h-[120px] overflow-hidden' : ''}`}>
                {post.body}
              </div>
              {!isExpanded && isLongPost && <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#121214] to-transparent pointer-events-none" />}
            </div>
            {isLongPost && (
              <button onClick={() => setIsExpanded(!isExpanded)} className="text-blue-500 hover:text-blue-400 text-xs font-medium mb-4 transition-colors">
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </>
        )}

        {/* Optional Image */}
        {post.imageUrl && !isEditing && (
          <div 
            className={`mb-5 bg-[#0A0A0A] border border-zinc-800 p-1.5 rounded-lg relative inline-block w-full max-w-lg ${isMagnified ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            onClick={() => setIsMagnified(!isMagnified)} onMouseMove={handleImageMouseMove} onMouseLeave={() => setIsMagnified(false)}
          >
            <img src={post.imageUrl} alt="Context" style={{ transform: isMagnified ? 'scale(2)' : 'scale(1)', transformOrigin: `${magPos.x} ${magPos.y}` }} className="max-h-[300px] w-full object-contain rounded transition-transform duration-200 ease-out" />
          </div>
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
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 bg-[#0A0A0A] p-1 rounded-xl border border-zinc-800 focus-within:border-blue-500/50 transition-colors overflow-hidden">
            <textarea 
              rows={3} placeholder="Add your response..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
              className="w-full bg-transparent text-zinc-200 border-none px-4 py-3 text-sm focus:outline-none resize-y"
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
        likes: [], dislikes: [], replies: [], createdAt: serverTimestamp()
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
            <PlusCircle size={18} /> Ask a Question
          </button>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" placeholder="Search by keyword or tag..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121214] border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white placeholder:text-zinc-600"
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
            className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 sm:p-8 w-full max-w-2xl relative z-10 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Create a Discussion</h2>
                    <p className="text-sm text-zinc-400 mt-1">Get help, share knowledge, or start a conversation.</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white transition-colors p-1 bg-zinc-800 rounded-md"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">Title</label>
                <input 
                  type="text" required placeholder="e.g. How to optimize a React useEffect?" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">Body</label>
                <textarea 
                  required rows={6} placeholder="Describe your problem or share your thoughts here..." value={newPost.body} onChange={e => setNewPost({...newPost, body: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-zinc-800 text-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-y placeholder:text-zinc-600"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">Tags</label>
                    <input 
                      type="text" required placeholder="e.g. react, performance (comma sep)" value={newPost.tags} onChange={e => setNewPost({...newPost, tags: e.target.value})}
                      className="w-full bg-[#0A0A0A] border border-zinc-800 text-blue-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">Attachment (Optional)</label>
                    <div className="bg-[#0A0A0A] border border-zinc-800 rounded-lg px-4 py-2.5 flex items-center justify-between">
                        <label className="cursor-pointer text-sm text-zinc-300 hover:text-white transition-colors flex items-center gap-2">
                        <ImageIcon size={16} className="text-blue-500" /> {imageFile ? "Change Image" : "Upload Image"}
                        <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageChange} />
                        </label>
                        {imageFile && <span className="text-[10px] text-zinc-500 truncate max-w-[100px]">{imageFile.name}</span>}
                    </div>
                  </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} disabled={isPublishing} className="px-5 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isPublishing} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg">
                  {isPublishing ? <><Loader2 size={16} className="animate-spin" /> Posting...</> : "Post Discussion"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}