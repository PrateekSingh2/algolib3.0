import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const checkPromptStatus = () => {
      // 1. Check if dismissed THIS SESSION
      if (sessionStorage.getItem("algolib_pwa_dismissed") === "true") {
        return;
      }

      // 2. Check if already installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      if (isStandalone) {
        return;
      }

      // 3. Check for iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const iosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(iosDevice);

      if (iosDevice) {
        setShowPrompt(true);
        return;
      }

      // 4. Handle Android / Chrome Event
      const handlePrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener("beforeinstallprompt", handlePrompt);

      return () => {
        window.removeEventListener("beforeinstallprompt", handlePrompt);
      };
    };

    // Add a 3-second delay "at start" to ensure browser readiness
    const timer = setTimeout(() => {
      checkPromptStatus();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    } else if (isIOS) {
      alert("To install AlgoLib on iOS:\n\n1. Tap the 'Share' icon at the bottom of Safari.\n2. Scroll down and tap 'Add to Home Screen'.");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Uses sessionStorage so it resets when the tab is closed
    sessionStorage.setItem("algolib_pwa_dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[99999]"
      >
        <div className="bg-[#0A0A1A]/95 backdrop-blur-xl border border-[#00d2ff]/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,210,255,0.15)] flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d2ff]/20 shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold tracking-tight">Install AlgoLib</span>
              <span className="text-gray-400 text-xs">Visualise offline & faster access</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-[#00d2ff]/10 hover:bg-[#00d2ff]/20 border border-[#00d2ff]/50 text-[#00d2ff] text-xs font-bold rounded-lg transition-colors"
            >
              INSTALL
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Dismiss installation prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPrompt;