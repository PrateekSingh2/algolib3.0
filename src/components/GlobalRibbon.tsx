import React, { useEffect, useState, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestoreDB } from '../lib/firebase';
import { Megaphone, ExternalLink, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface Announcement {
  active: boolean;
  type: 'info' | 'warning' | 'critical';
  message: string;
  link?: string;
}

export default function GlobalRibbon() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(firestoreDB, "system_settings", "announcement"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().active) {
        setAnnouncement(docSnap.data() as Announcement);
        setIsVisible(true);
      } else {
        setAnnouncement(null);
        setIsVisible(false);
      }
    });
    return () => unsub();
  }, []);

  const theme = useMemo(() => {
    if (!announcement) return null;
    
    const config = {
      info: {
        glass: "bg-blue-500/10 border-blue-500/20 sm:bg-[#050505]/50",
        glow: "shadow-[0_0_40px_rgba(59,130,246,0.15)] sm:shadow-[0_4px_30px_rgba(59,130,246,0.15)]",
        icon: <Info size={18} className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />,
        badge: "bg-blue-500/20 border-blue-500/30 text-blue-300",
        button: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30",
        link: "text-blue-400 hover:text-blue-300 decoration-blue-500/40"
      },
      warning: {
        glass: "bg-amber-500/10 border-amber-500/20 sm:bg-[#050505]/50",
        glow: "shadow-[0_0_40px_rgba(245,158,11,0.15)] sm:shadow-[0_4px_30px_rgba(245,158,11,0.15)]",
        icon: <AlertTriangle size={18} className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />,
        badge: "bg-amber-500/20 border-amber-500/30 text-amber-300",
        button: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30",
        link: "text-amber-400 hover:text-amber-300 decoration-amber-500/40"
      },
      critical: {
        glass: "bg-red-500/10 border-red-500/20 sm:bg-[#050505]/50",
        glow: "shadow-[0_0_40px_rgba(239,68,68,0.15)] sm:shadow-[0_4px_30px_rgba(239,68,68,0.15)]",
        icon: <Megaphone size={18} className="text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />,
        badge: "bg-red-500/20 border-red-500/30 text-red-300",
        button: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30",
        link: "text-red-400 hover:text-red-300 decoration-red-500/40"
      }
    };
    return config[announcement.type] || config.info;
  }, [announcement]);

  if (!announcement || !isVisible || !theme) return null;

  return (
    <AnimatePresence>
      {/* THE MORPHING WRAPPER 
        Mobile: Fixed full-screen overlay with dark blur to trap focus.
        Desktop (sm): Sticky top, transparent, clicks pass through to app below.
      */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`
          z-[100] transition-colors duration-500
          fixed inset-0 flex items-center justify-center p-5 bg-[#020202]/80 backdrop-blur-md pointer-events-auto
          sm:sticky sm:top-0 sm:inset-auto sm:p-4 sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-none
        `}
        role="alertdialog"
        aria-modal="true"
      >
        <motion.div 
          layout
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`
            pointer-events-auto relative w-full sm:w-auto
            flex flex-col sm:flex-row items-stretch sm:items-center justify-between
            
            /* Mobile Modal Geometry */
            max-w-[340px] rounded-[28px] p-6 bg-[#0A0A0A] border
            
            /* Desktop Pill Geometry */
            sm:max-w-4xl sm:rounded-full sm:p-2.5 sm:px-12 sm:min-h-[44px]
            
            backdrop-blur-3xl backdrop-saturate-[150%] 
            shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]
            ${theme.glass} ${theme.glow}
          `}
        >
          
          {/* --- MOBILE SPECIFIC HEADER --- */}
          <div className="flex sm:hidden items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl border ${theme.badge}`}>
              {theme.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none mb-1">
                System Update
              </span>
              <span className="text-sm font-semibold text-white capitalize leading-none">
                {announcement.type} Alert
              </span>
            </div>
          </div>

          {/* --- CORE CONTENT (Shared) --- */}
          <div className="flex items-start sm:items-center justify-start sm:justify-center gap-3 w-full">
            
            {/* Desktop Icon (Hidden on mobile modal) */}
            <div className="hidden sm:flex shrink-0 items-center justify-center">
              {theme.icon}
            </div>
            
            {/* Markdown Text Body */}
            <div className="text-[14px] sm:text-sm text-neutral-300 sm:text-neutral-200/90 leading-relaxed sm:leading-snug tracking-wide">
              <ReactMarkdown 
                allowedElements={['p', 'strong', 'em', 'code']}
                components={{
                  p: ({node, ...props}) => <span className="inline" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-white drop-shadow-sm" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-neutral-400" {...props} />,
                  code: ({node, ...props}) => (
                    <code className="bg-white/10 border border-white/10 px-1.5 py-0.5 rounded-[6px] text-[12px] sm:text-[13px] font-mono text-neutral-100 mx-1 shadow-sm" {...props} />
                  )
                }}
              >
                {announcement.message}
              </ReactMarkdown>
            </div>
          </div>

          {/* --- ACTIONS / FOOTER --- */}
          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row items-center gap-3 sm:gap-0 shrink-0 w-full sm:w-auto">
            
            {/* External Link */}
            {announcement.link && (
              <div className="flex items-center justify-center w-full sm:w-auto">
                <span className="text-neutral-700 hidden sm:inline-block mx-3">•</span>
                <a 
                  href={announcement.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center gap-1.5 text-sm font-semibold transition-all hover:-translate-y-[1px] underline underline-offset-[3px] hover:underline-offset-[4px] w-full sm:w-auto py-2.5 sm:py-0 rounded-xl sm:rounded-none bg-white/5 sm:bg-transparent ${theme.link}`}
                >
                  <span>View Details</span>
                  <ExternalLink size={14} strokeWidth={2.5} />
                </a>
              </div>
            )}

            {/* Mobile Acknowledge Button */}
            <button 
              onClick={() => setIsVisible(false)}
              className={`flex sm:hidden items-center justify-center w-full py-3 rounded-xl border text-sm font-bold transition-all active:scale-[0.98] ${theme.button}`}
            >
              Acknowledge
            </button>
          </div>

          {/* Desktop Absolute Dismiss Button (Hidden on Mobile) */}
          <button 
            onClick={() => setIsVisible(false)}
            className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-neutral-500 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-200"
            aria-label="Dismiss announcement"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}