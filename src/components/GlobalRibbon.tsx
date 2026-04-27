import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestoreDB } from '../lib/firebase'; // Adjust path if needed
import { Megaphone, ExternalLink, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalRibbon() {
  const [announcement, setAnnouncement] = useState<any>(null);

  useEffect(() => {
    // Listen to the document in Firestore
    const unsub = onSnapshot(doc(firestoreDB, "system_settings", "announcement"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().active) {
        setAnnouncement(docSnap.data());
      } else {
        setAnnouncement(null);
      }
    });
    return () => unsub();
  }, []);

  if (!announcement) return null;

  // Ultra-Premium Gradients
  const styles = {
    info: "bg-gradient-to-r from-sky-500/90 to-indigo-500/90 text-white border-sky-400/30",
    warning: "bg-gradient-to-r from-amber-400/90 to-orange-500/90 text-black border-amber-400/40",
    critical: "bg-gradient-to-r from-red-600/90 to-rose-600/90 text-white border-red-500/40",
  }[announcement.type as 'info' | 'warning' | 'critical'] || "bg-gradient-to-r from-sky-500/90 to-indigo-500/90 text-white border-sky-400/30";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        // CHANGED: Removed 'sticky top-0 left-0' and replaced with 'relative'
        // This ensures it stays in normal flow and PUSHES the navbar down instead of covering it.
        className={`relative w-full z-[100] border-b overflow-hidden shadow-md ${styles}`}
      >
        {/* Slimmed down mobile padding (py-2) to prevent it from getting too tall */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center py-2 px-4 gap-2.5 sm:gap-4 max-w-7xl mx-auto w-full">

          <div className="relative flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-white/40 rounded-full blur-[6px] animate-pulse"></div>
            {announcement.type === 'warning' || announcement.type === 'critical' ? (
              <AlertTriangle size={14} strokeWidth={2.5} className="relative z-10 drop-shadow-md sm:w-4 sm:h-4" />
            ) : (
              <Megaphone size={14} strokeWidth={2.5} className="relative z-10 drop-shadow-md sm:w-4 sm:h-4" />
            )}
          </div>

          {/* Reduced text size for mobile wrapping */}
          <span className="text-[11px] sm:text-xs font-bold tracking-wide text-center drop-shadow-sm line-clamp-2 sm:line-clamp-1 leading-snug">
            {announcement.message}
          </span>

          {announcement.link && (
            <a
              href={announcement.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 shrink-0 bg-black/10 hover:bg-black/20 text-current px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all border border-black/10 hover:border-black/20 hover:scale-105"
            >
              Access <ExternalLink size={10} strokeWidth={2.5} />
            </a>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}