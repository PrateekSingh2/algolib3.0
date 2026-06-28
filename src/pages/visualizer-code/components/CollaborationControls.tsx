import React, { useState, useRef, useEffect } from 'react';
import { Users, Copy, Check, LogOut, Loader2, LogIn, X, Plus, Share2, Lock, Unlock, ChevronDown, ChevronUp, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { RoomState, Participant } from '../hooks/useCollaborationRoom';

interface CollaborationControlsProps {
  roomId: string | null;
  role: 'host' | 'viewer' | null;
  onCreateRoom: () => Promise<void | string | null>;
  onJoinRoom: (code: string) => Promise<RoomState | false>;
  onLeaveRoom: () => void;
  roomState?: RoomState | null;
  onToggleEdit?: (allow: boolean) => void;
  allowUnauthJoin?: boolean;
  viewerCount?: number;
  participants?: Participant[];
  onKickParticipant?: (connId: string) => void;
}

export default function CollaborationControls({
  roomId,
  role,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  roomState,
  onToggleEdit,
  allowUnauthJoin = false,
  viewerCount = 0,
  participants = [],
  onKickParticipant
}: CollaborationControlsProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = async () => {
    if (!user) {
      toast.error("Please sign in to create a room.");
      return;
    }
    setIsCreating(true);
    await onCreateRoom();
    setIsCreating(false);
  };

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user && !allowUnauthJoin) {
      toast.error("Please sign in to join a room.");
      return;
    }
    if (!joinCode.trim()) return;
    
    setIsJoining(true);
    await onJoinRoom(joinCode);
    setIsJoining(false);
    setJoinCode('');
  };

  const handleCopy = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Team code copied to clipboard!");
    }
  };

  const colors = ['bg-pink-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];

  // Deduplicate participants from the same user (multiple tabs)
  const uniqueParticipants = participants.reduce((acc, current) => {
    const isCurrentHost = (current.userId && current.userId === roomState?.hostId) || current.connId === roomState?.hostId;
    
    const duplicateIndex = current.userId 
      ? acc.findIndex(p => p.userId === current.userId)
      : acc.findIndex(p => !p.userId && p.name === current.name);

    if (duplicateIndex === -1) {
      acc.push(current);
    } else if (isCurrentHost) {
      // If this duplicate is actually the host connection, prioritize keeping it
      acc[duplicateIndex] = current;
    }
    return acc;
  }, [] as Participant[]);

  const displayParticipants = showAllParticipants ? uniqueParticipants : uniqueParticipants.slice(0, 5);
  const hiddenCount = uniqueParticipants.length - 5;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-[13px] font-bold uppercase tracking-wider transition-all duration-300 border ${
          roomId 
            ? 'bg-blue-50/80 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-300/50 dark:border-blue-500/40 hover:bg-blue-100 dark:hover:bg-blue-500/30 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
            : 'bg-white/80 dark:bg-[#131b2c]/80 text-slate-600 dark:text-blue-100/80 border-slate-200 dark:border-blue-500/30 hover:bg-slate-50 dark:hover:bg-[#1a243a] backdrop-blur-sm'
        }`}
      >
        <Users size={16} className={roomId ? "animate-pulse" : ""} />
        <span className="hidden sm:inline">
          {roomId ? `Room: ${roomId}` : 'Multiplayer'}
        </span>
        {roomId && viewerCount > 0 && (
          <span className="ml-1 flex items-center justify-center bg-blue-500 text-white text-[10px] h-4.5 min-w-[18px] px-1.5 rounded-full font-bold shadow-sm">
            {viewerCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-0 mx-auto top-24 w-[calc(100vw-2rem)] sm:w-[360px] max-w-[360px] sm:absolute sm:top-full sm:inset-x-auto sm:right-0 sm:mx-0 sm:mt-3 bg-white/95 dark:bg-[#0f1523]/95 backdrop-blur-xl border border-slate-200/80 dark:border-blue-500/30 rounded-3xl shadow-2xl dark:shadow-[0_10px_60px_-12px_rgba(59,130,246,0.4)] z-[200] overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/80 dark:border-blue-500/10 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-blue-100/90">
                 <div className="p-1.5 bg-blue-100/80 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
                    <Users size={16} />
                 </div>
                 <span className="text-[14px] font-semibold tracking-wide">Multiplayer Room</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:text-blue-200/50 dark:hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {!user && !allowUnauthJoin ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-200 dark:border-blue-500/30 shadow-sm dark:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                   <LogIn size={28} className="text-slate-400 dark:text-blue-400" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2.5">Sign in Required</h4>
                <p className="text-[14px] text-slate-500 dark:text-blue-200/60 leading-relaxed mb-4">You need an account to join or host a collaborative session.</p>
              </div>
            ) : (
              <div className="p-6 flex flex-col gap-6">
                
                {/* Titles */}
                <div>
                  <h3 className="text-[22px] font-extrabold text-slate-800 dark:text-white tracking-tight mb-1.5">
                    {roomId ? 'Live Session Active' : 'Start Live Session'}
                  </h3>
                  <p className="text-[14px] text-slate-500 dark:text-blue-200/60 leading-relaxed">
                    {roomId 
                      ? 'Collaborators are syncing code in real-time.' 
                      : 'Invite teammates to code and debug together.'}
                  </p>
                </div>

                {/* Join a Room Input */}
                {!roomId && (
                  <div className="flex flex-col gap-2.5">
                     <label className="text-xs font-semibold text-slate-600 dark:text-blue-300 uppercase tracking-wider">
                        Join a Room
                     </label>
                     <form onSubmit={handleJoin} className="relative group">
                        <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 blur-md rounded-2xl transition-all group-focus-within:bg-blue-500/10 dark:group-focus-within:bg-blue-500/20"></div>
                        <div className="relative flex items-center bg-white dark:bg-[#0b101e]/80 border border-slate-200 dark:border-blue-500/30 rounded-2xl overflow-hidden focus-within:border-blue-400 dark:focus-within:border-blue-400 transition-colors shadow-sm">
                           <input 
                             type="text" 
                             value={joinCode}
                             onChange={e => setJoinCode(e.target.value.toUpperCase())}
                             placeholder="Enter 5-Letter Code..."
                             className="flex-1 w-full bg-transparent px-4 py-3.5 outline-none text-slate-800 dark:text-blue-50 font-mono tracking-widest placeholder:text-slate-300 dark:placeholder:text-blue-200/20 uppercase text-[15px]"
                             maxLength={5}
                           />
                           <button 
                             type="submit" 
                             disabled={isJoining || joinCode.length < 5}
                             className="px-5 py-3.5 text-sm font-bold bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-500/20 dark:hover:text-blue-300 disabled:opacity-50 transition-colors h-full border-l border-slate-100 dark:border-blue-500/20"
                           >
                              {isJoining ? <Loader2 size={18} className="animate-spin" /> : 'Join'}
                           </button>
                        </div>
                     </form>
                  </div>
                )}

                {/* Collaborators List */}
                {roomId && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center mb-1">
                       <label className="text-xs font-semibold text-slate-600 dark:text-blue-300 uppercase tracking-wider">Collaborators</label>
                       <span className="text-[10px] font-bold text-slate-500 dark:text-blue-200/60 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                         {participants.length} Active
                       </span>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto pr-1">
                       {displayParticipants.map((p, idx) => {
                          const isUnauth = p.userId === 'anonymous' || !p.userId;
                          const displayName = isUnauth ? 'Anonymous' : p.name;
                          const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';
                          const isHost = (p.userId && p.userId === roomState?.hostId) || p.connId === roomState?.hostId;
                          const isMe = p.userId === user?.uid || (!user && p.name === 'Anonymous');
                          const colorClass = colors[idx % colors.length];

                          return (
                            <div key={p.connId} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group relative border border-transparent hover:border-slate-100 dark:hover:border-white/10">
                               <div className="flex items-center gap-3">
                                 <div className="relative">
                                   <div className={`w-10 h-10 rounded-full border-2 ${isHost ? 'border-blue-400' : 'border-slate-200 dark:border-blue-200/20'} flex items-center justify-center shadow-sm overflow-hidden ${colorClass}`}>
                                      {p.avatar_url ? (
                                        <img src={p.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-white font-bold text-[15px]">{initial}</span>
                                      )}
                                   </div>
                                   <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-[#131b2c] rounded-full"></div>
                                 </div>
                                 <div className="flex flex-col">
                                   <span className="text-[13px] font-bold text-slate-800 dark:text-blue-50 flex items-center gap-1">
                                     {p.username && !isUnauth ? (
                                       <Link to={`/user/${p.username}`} target="_blank" className="hover:underline hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
                                         {displayName}
                                         {p.is_verified && <BadgeCheck size={14} className="text-blue-500 shrink-0" />}
                                       </Link>
                                     ) : (
                                       <span className="flex items-center gap-1">
                                         {displayName}
                                         {p.is_verified && <BadgeCheck size={14} className="text-blue-500 shrink-0" />}
                                       </span>
                                     )}
                                     {isMe && <span className="font-normal text-slate-400 dark:text-blue-200/50 ml-0.5">(You)</span>}
                                   </span>
                                   <span className={`text-[11px] font-medium ${isHost ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-blue-200/50'}`}>
                                      {isHost ? 'Session Host' : 'Viewer'}
                                   </span>
                                 </div>
                               </div>

                               {/* Action Buttons for Host */}
                               {role === 'host' && onKickParticipant && (
                                  <button 
                                    disabled={isHost}
                                    onClick={() => {
                                      if (!isHost && window.confirm(`Remove ${p.name || 'this viewer'}?`)) {
                                        onKickParticipant(p.connId);
                                      }
                                    }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                                      isHost 
                                        ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-40' 
                                        : 'bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100'
                                    }`}
                                    title={isHost ? "Host cannot be removed" : "Remove User"}
                                  >
                                     {isHost ? <Lock size={14} /> : <X size={16} />}
                                  </button>
                               )}
                            </div>
                          )
                       })}

                       {hiddenCount > 0 && (
                          <button
                            onClick={() => setShowAllParticipants(!showAllParticipants)}
                            className="flex items-center justify-center gap-1.5 p-2 mt-1 w-full text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-500/5 dark:hover:bg-blue-500/10 rounded-xl transition-colors border border-transparent dark:border-blue-500/10"
                          >
                            {showAllParticipants ? (
                              <>
                                Show Less <ChevronUp size={14} />
                              </>
                            ) : (
                              <>
                                View All {participants.length} Collaborators <ChevronDown size={14} />
                              </>
                            )}
                          </button>
                        )}
                    </div>
                  </div>
                )}

                {/* Toggles (Enable Viewer Edits) */}
                {role === 'host' && onToggleEdit && (
                  <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50/80 dark:bg-blue-900/10 border border-slate-100 dark:border-blue-500/10 mt-1">
                     <div className="flex flex-col">
                       <span className="text-[14px] font-semibold text-slate-700 dark:text-blue-50">Viewer Edits</span>
                       <span className="text-[11px] text-slate-500 dark:text-blue-200/50 mt-0.5">Allow others to modify code</span>
                     </div>
                     <button 
                        onClick={() => onToggleEdit(!roomState?.allowViewerEdits)}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${roomState?.allowViewerEdits ? 'bg-[#1b8cce] border border-[#23b1ff]' : 'bg-slate-300 dark:bg-[#1a253a] border border-slate-300 dark:border-blue-500/20'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1/2 -translate-y-1/2 transition-all duration-300 shadow-sm ${roomState?.allowViewerEdits ? 'left-7 bg-white' : 'left-1 dark:bg-blue-300/50'}`} />
                      </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mt-1">
                   {!roomId ? (
                     <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-[15px] font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-70 active:scale-[0.98]"
                     >
                        {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                        Create & Share Session
                     </button>
                   ) : (
                     <>
                        <button
                          onClick={handleCopy}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-[15px] font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                        >
                           {copied ? <Check size={18} /> : <Copy size={18} />}
                           {copied ? 'Copied!' : 'Copy Team Code'}
                        </button>
                     </>
                   )}
                   
                   <button
                      onClick={() => {
                        if (roomId) onLeaveRoom();
                        setIsOpen(false);
                      }}
                      className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-blue-100/90 text-[15px] font-bold transition-all active:scale-[0.98] border border-transparent dark:border-blue-500/10"
                   >
                      {roomId ? 'Leave Session' : 'Cancel'}
                   </button>
                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
