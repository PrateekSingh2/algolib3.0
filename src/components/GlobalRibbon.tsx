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

  // Solid bright backgrounds with black text for maximum visibility
  const styles = {
    info: "bg-[#00ff88] text-black", // Solid Neon Green
    warning: "bg-[#ffcc00] text-black", // Solid Bright Yellow
    critical: "bg-[#ff3333] text-black", // Solid Bright Red
  }[announcement.type as 'info' | 'warning' | 'critical'] || "bg-[#00ff88] text-black";

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        // sticky top-0 keeps it at the very top and pushes the layout down
        // z-[100] ensures nothing overlaps it
        className={`sticky top-0 left-0 w-full z-[100] flex items-center justify-center py-1.75 px-4 gap-3 text-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden ${styles}`}
      >
        {announcement.type === 'warning' || announcement.type === 'critical' ? (
          <AlertTriangle size={18} strokeWidth={2.5} className="shrink-0" /> 
        ) : (
          <Megaphone size={18} strokeWidth={2.5} className="shrink-0" />
        )}
        
        <span className="font-bold tracking-wide text-center">
          {announcement.message}
        </span>

        {announcement.link && (
          <a 
            href={announcement.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 underline underline-offset-4 opacity-80 hover:opacity-100 transition-opacity ml-2 font-black shrink-0"
          >
            Details <ExternalLink size={14} strokeWidth={2.5} />
          </a>
        )}
      </motion.div>
    </AnimatePresence>
  );
}