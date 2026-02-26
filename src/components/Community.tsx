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
  ThumbsUp, ThumbsDown
} from "lucide-react";
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

// --- Subtle Moving Dots Background ---
const BackgroundParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particlesArray: any[] = [];
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    class Particle {
      x: number; y: number; size: number; speedX: number; speedY: number;
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 1.5 + 0.5; 
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > w) this.speedX *= -1;
        if (this.y < 0 || this.y > h) this.speedY *= -1;
      }
      draw() {
        if (!ctx) return;
        ctx.fillStyle = 'rgba(0, 208, 255, 0.34)'; 
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      particlesArray = [];
      for (let i = 0; i < 70; i++) particlesArray.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
        for (let j = i; j < particlesArray.length; j++) {
          const dx = particlesArray[i].x - particlesArray[j].x;
          const dy = particlesArray[i].y - particlesArray[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 210, 255, ${0.1 - distance/1200})`; 
            ctx.lineWidth = 0.5;
            ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
            ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    }

    init();
    animate();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};


// --- Sub-component: Individual Reply Item ---
const ReplyItem = ({ reply, postId, postReplies, isPostAuthor, user }: { reply: ReplyType, postId: string, postReplies: ReplyType[], isPostAuthor: boolean, user: User | null }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const isReplyAuthor = user?.uid === reply.authorId;

  const handleUpdateReply = async () => {
    if (!editContent.trim()) return;
    const updatedReplies = postReplies.map(r => r.id === reply.id ? { ...r, content: editContent } : r);
    await updateDoc(doc(firestoreDB, "community_posts", postId), { replies: updatedReplies });
    setIsEditing(false);
  };

  const handleDeleteReply = async () => {
    if (window.confirm("Delete this reply?")) {
      const updatedReplies = postReplies.filter(r => r.id !== reply.id);
      await updateDoc(doc(firestoreDB, "community_posts", postId), { replies: updatedReplies });
    }
  };

  const handleReplyVote = async (type: 'up' | 'down') => {
    if (!user) return;
    const hasLiked = reply.likes?.includes(user.uid);
    const hasDisliked = reply.dislikes?.includes(user.uid);
    
    let newLikes = reply.likes || [];
    let newDislikes = reply.dislikes || [];

    if (type === 'up') {
      if (hasLiked) newLikes = newLikes.filter(id => id !== user.uid);
      else { 
        newLikes = [...newLikes, user.uid]; 
        newDislikes = newDislikes.filter(id => id !== user.uid); 
      }
    } else {
      if (hasDisliked) newDislikes = newDislikes.filter(id => id !== user.uid);
      else { 
        newDislikes = [...newDislikes, user.uid]; 
        newLikes = newLikes.filter(id => id !== user.uid); 
      }
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
    <div className={`text-sm p-4 rounded-xl transition-colors ${reply.isAccepted ? "bg-[#00ff87]/5 border border-[#00ff87]/20 shadow-sm" : "bg-[#11121C] border border-[#1F2032]"}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 sm:mb-2">
        <div className="flex items-center gap-2">
          <img src={reply.authorAvatar} alt="" className="w-5 h-5 rounded-full border border-[#2A2B3D]" />
          <span className="font-semibold text-slate-200">{reply.authorName}</span>
          <span className="text-slate-500 text-xs hidden sm:inline">•</span>
          <span className="text-slate-500 text-xs">{new Date(reply.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Edit/Delete for reply author */}
          {isReplyAuthor && !isEditing && (
            <div className="flex items-center gap-2 border-r border-[#1F2032] pr-3">
              <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-[#00d2ff]" title="Edit Reply"><Edit2 size={14} /></button>
              <button onClick={handleDeleteReply} className="text-slate-400 hover:text-red-400" title="Delete Reply"><Trash2 size={14} /></button>
            </div>
          )}

          {/* Accept button for post author */}
          {(isPostAuthor || reply.isAccepted) && (
            <button 
              onClick={handleToggleAcceptReply} disabled={!isPostAuthor}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${reply.isAccepted ? "text-[#00ff87] bg-[#00ff87]/10" : "text-slate-500 hover:bg-[#1F2032] hover:text-slate-300"} ${!isPostAuthor && "cursor-default"}`}
            >
              <CheckCircle2 size={14} className={reply.isAccepted ? "text-[#00ff87]" : ""} />
              {reply.isAccepted ? "Accepted" : "Accept"}
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-2 space-y-2">
          <textarea 
            value={editContent} onChange={e => setEditContent(e.target.value)} 
            className="w-full bg-[#07080C] text-slate-200 border border-[#3a7bd5]/40 rounded-lg p-2 text-sm focus:outline-none resize-y" rows={3}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button onClick={handleUpdateReply} className="px-3 py-1 text-xs bg-[#3a7bd5] hover:bg-[#00d2ff] text-white rounded-md transition-colors">Save</button>
          </div>
        </div>
      ) : (
        <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{reply.content}</p>
      )}

      {/* Reply Voting Bar */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#1F2032]">
        <button onClick={() => handleReplyVote('up')} className={`hover:text-[#00d2ff] transition-colors flex items-center gap-1.5 ${reply.likes?.includes(user?.uid || "") ? 'text-[#00d2ff]' : 'text-slate-500'}`}>
          <ThumbsUp size={14} className={reply.likes?.includes(user?.uid || "") ? "fill-[#00d2ff]/20" : ""} />
          <span className="text-xs">{reply.likes?.length || 0}</span>
        </button>
        <span className="text-slate-600 text-xs">|</span>
        <button onClick={() => handleReplyVote('down')} className={`hover:text-[#ff0080] transition-colors flex items-center gap-1.5 ${reply.dislikes?.includes(user?.uid || "") ? 'text-[#ff0080]' : 'text-slate-500'}`}>
          <ThumbsDown size={14} className={reply.dislikes?.includes(user?.uid || "") ? "fill-[#ff0080]/20" : ""} />
        </button>
      </div>
    </div>
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

  const isLongPost = post.body.length > 300 || post.body.split('\n').length > 5;
  const isAuthor = user?.uid === post.authorId;

  const handleVote = async (type: 'up' | 'down') => {
    if (!user) return;
    
    const hasLiked = post.likes?.includes(user.uid);
    const hasDisliked = post.dislikes?.includes(user.uid);

    let newLikes = post.likes || [];
    let newDislikes = post.dislikes || [];

    if (type === 'up') {
      if (hasLiked) newLikes = newLikes.filter(id => id !== user.uid);
      else { 
        newLikes = [...newLikes, user.uid]; 
        newDislikes = newDislikes.filter(id => id !== user.uid); 
      }
    } else {
      if (hasDisliked) newDislikes = newDislikes.filter(id => id !== user.uid);
      else { 
        newDislikes = [...newDislikes, user.uid]; 
        newLikes = newLikes.filter(id => id !== user.uid); 
      }
    }

    await updateDoc(doc(firestoreDB, "community_posts", post.id), { likes: newLikes, dislikes: newDislikes });
  };

  const handleDeletePost = async () => {
    if (!isAuthor) return;
    if (window.confirm("Are you sure you want to delete this discussion? This action cannot be undone.")) {
      try { await deleteDoc(doc(firestoreDB, "community_posts", post.id)); } 
      catch (error) { console.error("Error deleting post:", error); }
    }
  };

  const handleUpdatePost = async () => {
    if (!isAuthor || !editForm.title.trim() || !editForm.body.trim()) return;
    setIsUpdating(true);
    try {
      const tagsArray = editForm.tags.split(",").map(tag => tag.trim().toLowerCase()).filter(tag => tag !== "");
      await updateDoc(doc(firestoreDB, "community_posts", post.id), {
        title: editForm.title,
        body: editForm.body,
        tags: tagsArray
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!user || !replyContent.trim()) return;
    setIsSubmittingReply(true);
    try {
      const postDocRef = doc(firestoreDB, "community_posts", post.id);
      const newReply: ReplyType = {
        id: crypto.randomUUID(),
        authorId: user.uid,
        authorName: user.displayName || "Developer",
        authorAvatar: user.photoURL || "",
        content: replyContent.trim(),
        createdAt: Date.now(),
        isAccepted: false,
        likes: [],
        dislikes: []
      };
      await updateDoc(postDocRef, { replies: arrayUnion(newReply) });
      setReplyContent("");
      setShowReplyBox(false);
      setShowAllReplies(true); // Expand to show new reply
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMagnified) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMagPos({ x: `${x}%`, y: `${y}%` });
  };

  const score = (post.likes?.length || 0) - (post.dislikes?.length || 0);

  return (
    <div 
      id={post.id} 
      className="bg-[#0B0C15]/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-[#1F2032] shadow-xl flex flex-col sm:flex-row gap-5 transition-all hover:border-[#3a7bd5]/40 hover:shadow-[0_0_20px_rgba(58,123,213,0.05)] relative z-10 group scroll-mt-[120px]"
    >
      
      {/* LEFT COLUMN: Voting */}
      <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start min-w-[50px] pt-1 mb-4 sm:mb-0 border-b sm:border-b-0 border-[#1F2032] pb-4 sm:pb-0">
        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2">
          <button onClick={() => handleVote('up')} className={`p-2 rounded-xl transition-colors ${post.likes?.includes(user?.uid || "") ? 'text-[#00d2ff] bg-[#00d2ff]/10' : 'text-slate-500 hover:text-white hover:bg-[#1F2032]'}`}>
            <ThumbsUp size={20} className={post.likes?.includes(user?.uid || "") ? "fill-[#00d2ff]/20" : ""} />
          </button>
          <span className={`font-mono text-lg font-bold ${score > 0 ? 'text-[#00d2ff]' : score < 0 ? 'text-[#ff0080]' : 'text-slate-300'}`}>
            {score}
          </span>
          <button onClick={() => handleVote('down')} className={`p-2 rounded-xl transition-colors ${post.dislikes?.includes(user?.uid || "") ? 'text-[#ff0080] bg-[#ff0080]/10' : 'text-slate-500 hover:text-white hover:bg-[#1F2032]'}`}>
            <ThumbsDown size={20} className={post.dislikes?.includes(user?.uid || "") ? "fill-[#ff0080]/20" : ""} />
          </button>
        </div>
        <div className="flex flex-row sm:flex-col items-center gap-1.5 sm:mt-6 text-slate-500" title={`${post.replies?.length || 0} Replies`}>
          <MessageSquare size={18} className="opacity-70" />
          <span className="font-mono text-sm sm:text-xs">{post.replies?.length || 0}</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <img src={post.authorAvatar} alt="author" className="w-6 h-6 rounded-full object-cover border border-[#2A2B3D]" />
            <span className="font-semibold text-sm text-slate-200">{post.authorName}</span>
            <span className="text-slate-500 text-xs hidden sm:inline">•</span>
            <span className="text-slate-500 text-xs">{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}</span>
          </div>

          {isAuthor && !isEditing && (
            <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
              <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-[#00d2ff] p-1.5 rounded-lg hover:bg-[#1F2032] transition-colors" title="Edit Post"><Edit2 size={16} /></button>
              <button onClick={handleDeletePost} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-[#1F2032] transition-colors" title="Delete Post"><Trash2 size={16} /></button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3 mb-5 bg-[#07080C] p-4 rounded-xl border border-[#3a7bd5]/40 shadow-inner">
            <input 
              type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} 
              className="w-full bg-transparent text-white font-bold text-xl border-b border-[#1F2032] pb-2 px-1 focus:outline-none focus:border-[#3a7bd5]" placeholder="Post Title"
            />
            <textarea 
              value={editForm.body} onChange={e => setEditForm({...editForm, body: e.target.value})} rows={5}
              className="w-full bg-transparent text-slate-300 text-sm font-mono border border-[#1F2032] rounded-lg p-3 focus:outline-none focus:border-[#3a7bd5] resize-y" placeholder="Post Details"
            />
            <input 
              type="text" value={editForm.tags} onChange={e => setEditForm({...editForm, tags: e.target.value})} 
              className="w-full bg-[#11121C] text-[#00d2ff] text-sm font-mono border border-[#1F2032] rounded-lg px-3 py-2 focus:outline-none focus:border-[#3a7bd5]" placeholder="Tags (comma separated)"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors"><X size={14} /> Cancel</button>
              <button onClick={handleUpdatePost} disabled={isUpdating} className="px-4 py-1.5 bg-[#3a7bd5] hover:bg-[#00d2ff] text-white text-sm font-bold rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50">
                {isUpdating ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save Changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 pr-4 leading-snug">{post.title}</h3>
            <div className="relative mb-5">
              <div className={`text-slate-300 text-sm sm:text-base whitespace-pre-wrap leading-relaxed font-sans ${!isExpanded && isLongPost ? 'max-h-[140px] overflow-hidden' : ''}`}>{post.body}</div>
              {!isExpanded && isLongPost && <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[#0B0C15]/90 to-transparent pointer-events-none"></div>}
              {isLongPost && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-[#00d2ff] font-medium hover:text-white text-sm mt-2 flex items-center gap-1 transition-colors relative z-10">
                  {isExpanded ? "Show Less" : "See More..."}
                </button>
              )}
            </div>
          </>
        )}

        {post.imageUrl && !isEditing && (
          <div 
            className={`mb-6 bg-[#07080C] border border-[#1F2032] rounded-xl overflow-hidden relative inline-block w-full max-w-lg ${isMagnified ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            onClick={() => setIsMagnified(!isMagnified)} onMouseMove={handleImageMouseMove} onMouseLeave={() => setIsMagnified(false)}
          >
            <img src={post.imageUrl} alt="Context" style={{ transform: isMagnified ? 'scale(2.5)' : 'scale(1)', transformOrigin: `${magPos.x} ${magPos.y}` }} className="max-h-[300px] sm:max-h-[400px] w-full object-contain rounded-lg transition-transform duration-200 ease-out" />
            {!isMagnified && <div className="absolute top-3 right-3 bg-black/80 text-white text-xs px-2.5 py-1.5 rounded-md backdrop-blur-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">Click to Magnify</div>}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-[#1F2032]">
          <div className="flex flex-wrap gap-2">
            {post.tags?.map((tag, idx) => <span key={idx} className="bg-[#18192A] text-slate-400 hover:text-[#00d2ff] transition-colors cursor-pointer border border-[#1F2032] text-xs px-3 py-1.5 rounded-md font-mono">#{tag}</span>)}
          </div>
          <button onClick={() => setShowReplyBox(!showReplyBox)} className="w-full sm:w-auto text-sm font-semibold text-[#00d2ff] hover:text-white bg-[#00d2ff]/10 hover:bg-[#00d2ff]/20 flex justify-center items-center gap-2 transition-colors px-4 py-2 rounded-lg">
            <Reply size={16} /> {showReplyBox ? "Cancel" : "Reply"}
          </button>
        </div>

        {showReplyBox && (
          <div className="mt-5 bg-[#07080C] p-2 rounded-xl border border-[#3a7bd5]/40 focus-within:border-[#00d2ff] transition-colors shadow-inner">
            <textarea 
              rows={3} placeholder="Write your answer..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
              className="w-full bg-transparent text-slate-200 border-none px-3 py-2 text-sm font-mono focus:outline-none focus:ring-0 resize-y"
            />
            <div className="flex justify-end pt-2">
              <button onClick={handleReplySubmit} disabled={isSubmittingReply || !replyContent.trim()} className="bg-[#3a7bd5] hover:bg-[#00d2ff] text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition-colors flex items-center gap-2">
                {isSubmittingReply ? <><Loader2 size={16} className="animate-spin" /> Posting...</> : "Post Answer"}
              </button>
            </div>
          </div>
        )}

        {/* REPLIES SECTION WITH EXPAND/COLLAPSE */}
        {post.replies && post.replies.length > 0 && (
          <div className="mt-6 space-y-3 pl-3 sm:pl-6 border-l-2 border-[#1F2032]">
            {[...post.replies]
              .sort((a, b) => (b.isAccepted ? 1 : 0) - (a.isAccepted ? 1 : 0))
              .slice(0, showAllReplies ? post.replies.length : 2)
              .map((reply) => (
                <ReplyItem 
                  key={reply.id} 
                  reply={reply} 
                  postId={post.id} 
                  postReplies={post.replies} 
                  isPostAuthor={isAuthor} 
                  user={user} 
                />
            ))}
            
            {post.replies.length > 2 && (
              <button 
                onClick={() => setShowAllReplies(!showAllReplies)} 
                className="text-[#00d2ff] hover:text-white text-sm font-medium mt-3 inline-block transition-colors"
              >
                {showAllReplies ? "Show fewer replies ↑" : `View all ${post.replies.length} replies ↓`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


// --- Main Community Component ---
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

  // Handle auto-scrolling to a post when clicking a notification
  useEffect(() => {
    if (location.hash && posts.length > 0) {
      const targetId = location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      
      if (element) {
        setTimeout(() => {
          // Calculate position minus 100px so it isn't hidden under the floating navbar
          const yOffset = -100; 
          const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
          
          window.scrollTo({ top: y, behavior: 'smooth' });
          
          // Temporary highlight glow
          element.classList.add('ring-2', 'ring-[#00d2ff]', 'ring-offset-4', 'ring-offset-[#030308]', 'transition-all', 'duration-500', 'shadow-[0_0_30px_rgba(0,210,255,0.4)]');
          
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-[#00d2ff]', 'ring-offset-4', 'ring-offset-[#030308]', 'shadow-[0_0_30px_rgba(0,210,255,0.4)]');
          }, 2500);
        }, 100);
      }
    }
  }, [location.hash, posts]);

  const topContributors = useMemo(() => {
    const scores: Record<string, { name: string, avatar: string, score: number }> = {};
    posts.forEach(post => {
      post.replies?.forEach(reply => {
        if (reply.isAccepted) {
          if (!scores[reply.authorId]) {
            scores[reply.authorId] = { name: reply.authorName, avatar: reply.authorAvatar, score: 0 };
          }
          scores[reply.authorId].score += 1;
        }
      });
    });
    return Object.values(scores).sort((a, b) => b.score - a.score).slice(0, 5); 
  }, [posts]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (!e.target.files[0].type.startsWith("image/")) return alert("Valid image required.");
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

        const cloudinaryRes = await fetch(
          `https://api.cloudinary.com/v1_1/dmmv8phgq/image/upload`, 
          { method: "POST", body: formData }
        );
        const cloudinaryData = await cloudinaryRes.json();
        if (cloudinaryData.secure_url) imageUrl = cloudinaryData.secure_url; 
      }

      const tagsArray = newPost.tags.split(",").map(tag => tag.trim().toLowerCase()).filter(tag => tag !== "");
      
      await addDoc(collection(firestoreDB, "community_posts"), {
        title: newPost.title,
        body: newPost.body,
        tags: tagsArray,
        imageUrl: imageUrl,
        authorId: user.uid,
        authorName: user.displayName || "Developer",
        authorAvatar: user.photoURL || "",
        likes: [], dislikes: [], replies: [], 
        createdAt: serverTimestamp()
      });
      
      setShowCreateModal(false);
      setNewPost({ title: "", body: "", tags: "" });
      setImageFile(null);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.tags?.some(tag => tag.includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#030308] text-white font-sans relative flex flex-col">
      <BackgroundParticles />

      <div className="relative z-50">
        <Navbar />
        <GlobalRibbon />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 relative z-10 flex-1">
        
        {/* LEFT COLUMN: Main Feed */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8 order-2 lg:order-1">
          {filteredPosts.map((post) => (
            <PostItem key={post.id} post={post} user={user} />
          ))}
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-16 sm:py-20 border border-[#1F2032] rounded-2xl bg-[#0B0C15]/60 backdrop-blur-sm shadow-xl">
              <MessageSquare className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-white font-bold mb-2 text-xl">No discussions found.</p>
              <p className="text-sm text-slate-400">Adjust your search or be the first to start a thread.</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-32 h-fit order-1 lg:order-2">
          
          {/* A. Make Post Button */}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] text-white px-6 py-4 rounded-2xl hover:opacity-90 transition shadow-[0_0_15px_rgba(0,210,255,0.2)] font-bold text-sm"
          >
            <PlusCircle size={18} /> Create Post
          </button>

          {/* B. Search Box */}
          <div className="relative shadow-lg rounded-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" placeholder="Search discussions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#11121C] border border-[#2A2B3D] rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#3a7bd5] focus:ring-1 focus:ring-[#3a7bd5] transition-all text-white placeholder:text-slate-500 shadow-inner"
            />
          </div>

          {/* C. Leaderboard */}
          <div className="bg-[#0B0C15]/90 backdrop-blur-md border border-[#1F2032] rounded-2xl overflow-hidden shadow-xl hidden sm:block">
            <div className="bg-[#11121C] p-3.5 border-b border-[#1F2032] flex items-center gap-2">
              <Trophy size={16} className="text-[#ff9900]" />
              <h3 className="font-bold text-white text-xs uppercase tracking-widest font-mono">Top Solvers</h3>
            </div>
            
            <div className="p-2">
              {topContributors.length > 0 ? (
                topContributors.map((contributor, index) => (
                  <div key={contributor.name} className="flex items-center gap-3 p-2.5 hover:bg-[#18192A] rounded-xl transition-colors">
                    <div className="font-mono font-bold text-slate-500 w-4 text-center text-xs">{index + 1}</div>
                    <img src={contributor.avatar} alt={contributor.name} className="w-8 h-8 rounded-full border border-slate-600 object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-slate-200 truncate">{contributor.name}</p>
                      <p className="text-[10px] text-[#00ff87] flex items-center gap-1 font-mono mt-1">
                        <CheckCircle2 size={10} /> {contributor.score} XP
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 font-mono">No solvers yet.</div>
              )}
            </div>
          </div>
        </aside>

      </main>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-[#0B0C15] border border-[#1F2032] rounded-3xl p-6 sm:p-8 w-full max-w-2xl my-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h2 className="text-2xl font-bold text-white mb-2">Create Discussion</h2>
            <p className="text-sm text-slate-400 mb-6">Ask for help, share a snippet, or discuss logic.</p>
            
            <form onSubmit={handleCreatePost} className="space-y-5">
              <div>
                <input 
                  type="text" required placeholder="Title: e.g., Optimizing Graph Traversal" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})}
                  className="w-full bg-[#11121C] border border-[#2A2B3D] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3a7bd5] focus:ring-1 focus:ring-[#3a7bd5] transition-all placeholder:text-slate-600 font-medium"
                />
              </div>
              
              <div>
                <textarea 
                  required rows={6} placeholder="Details: paste your code or describe the issue..." value={newPost.body} onChange={e => setNewPost({...newPost, body: e.target.value})}
                  className="w-full bg-[#11121C] border border-[#2A2B3D] text-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#3a7bd5] focus:ring-1 focus:ring-[#3a7bd5] transition-all resize-y placeholder:text-slate-600"
                ></textarea>
              </div>

              <div className="bg-[#11121C] p-3 rounded-xl border border-[#2A2B3D]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <label className="cursor-pointer bg-[#1F2032] hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                    <ImageIcon size={18} className="text-[#00d2ff]" /> Attach Image
                    <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageChange} />
                  </label>
                  {imageFile ? (
                    <span className="text-sm text-[#00ff87] font-mono truncate max-w-[200px] text-center sm:text-left">{imageFile.name}</span>
                  ) : (
                    <span className="text-sm text-slate-500 italic text-center sm:text-left">Optional screenshot</span>
                  )}
                </div>
              </div>

              <div>
                <input 
                  type="text" required placeholder="Tags: python, dp, arrays (comma separated)" value={newPost.tags} onChange={e => setNewPost({...newPost, tags: e.target.value})}
                  className="w-full bg-[#11121C] border border-[#2A2B3D] text-[#00d2ff] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3a7bd5] focus:ring-1 focus:ring-[#3a7bd5] transition-all font-mono placeholder:text-slate-600"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-[#1F2032] mt-8">
                <button type="button" onClick={() => setShowCreateModal(false)} disabled={isPublishing} className="px-6 py-3 sm:py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors w-full sm:w-auto">
                  Cancel
                </button>
                <button type="submit" disabled={isPublishing} className="px-6 py-3 sm:py-2.5 text-sm font-bold bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] hover:opacity-90 text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.3)] w-full sm:w-auto">
                  {isPublishing ? <><Loader2 size={18} className="animate-spin" /> Publishing...</> : "Publish Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}