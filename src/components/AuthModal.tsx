import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Github, Zap, ArrowRight, Shield } from "lucide-react";
import { executeGoogleSignIn, executeGithubSignIn } from "@/contexts/AuthContext";

// ─── ANIMATED LEFT PANEL — AVL Tree Rotations ───────────────────────────────
const AlgoLibPanel = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number, t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    // Pre-defined AVL tree states demonstrating all 4 rotation types
    type TreeState = {
      label: string; color: string;
      nodes: { v: number; x: number; y: number }[];
      edges: [number, number][];
      arrow?: { fromIdx: number; toIdx: number; label: string };
    };

    const STATES: TreeState[] = [
      // LL Rotation — before
      {
        label: "LL ROTATION", color: "#f59e0b",
        nodes: [{v:30,x:.5,y:.18},{v:20,x:.3,y:.42},{v:10,x:.15,y:.66}],
        edges:[[0,1],[1,2]],
      },
      // LL Rotation — after
      {
        label: "LL ROTATION ✓", color: "#00e676",
        nodes: [{v:20,x:.5,y:.18},{v:10,x:.3,y:.42},{v:30,x:.7,y:.42}],
        edges:[[0,1],[0,2]],
        arrow: { fromIdx: 0, toIdx: 0, label: "Right Rotate" },
      },
      // RR Rotation — before
      {
        label: "RR ROTATION", color: "#f59e0b",
        nodes: [{v:10,x:.5,y:.18},{v:20,x:.7,y:.42},{v:30,x:.85,y:.66}],
        edges:[[0,1],[1,2]],
      },
      // RR Rotation — after
      {
        label: "RR ROTATION ✓", color: "#00e676",
        nodes: [{v:20,x:.5,y:.18},{v:10,x:.3,y:.42},{v:30,x:.7,y:.42}],
        edges:[[0,1],[0,2]],
        arrow: { fromIdx: 0, toIdx: 0, label: "Left Rotate" },
      },
      // LR Rotation — before
      {
        label: "LR ROTATION", color: "#a855f7",
        nodes: [{v:30,x:.5,y:.18},{v:10,x:.28,y:.42},{v:20,x:.42,y:.66}],
        edges:[[0,1],[1,2]],
      },
      // LR Rotation — after
      {
        label: "LR ROTATION ✓", color: "#00e676",
        nodes: [{v:20,x:.5,y:.18},{v:10,x:.3,y:.42},{v:30,x:.7,y:.42}],
        edges:[[0,1],[0,2]],
        arrow: { fromIdx: 0, toIdx: 0, label: "Left→Right Rotate" },
      },
      // RL Rotation — before
      {
        label: "RL ROTATION", color: "#a855f7",
        nodes: [{v:10,x:.5,y:.18},{v:30,x:.72,y:.42},{v:20,x:.58,y:.66}],
        edges:[[0,1],[1,2]],
      },
      // RL Rotation — after
      {
        label: "RL ROTATION ✓", color: "#00e676",
        nodes: [{v:20,x:.5,y:.18},{v:10,x:.3,y:.42},{v:30,x:.7,y:.42}],
        edges:[[0,1],[0,2]],
        arrow: { fromIdx: 0, toIdx: 0, label: "Right→Left Rotate" },
      },
    ];

    let stateIdx = 0;
    let stateT = 0;
    const STATE_DUR = 2.2;

    const glow = (c: string, b: number) => { ctx.shadowColor = c; ctx.shadowBlur = b; };
    const ng = () => { ctx.shadowBlur = 0; };

    const draw = () => {
      t += 0.016; stateT += 0.016;
      if (stateT > STATE_DUR) { stateT = 0; stateIdx = (stateIdx + 1) % STATES.length; }
      const fade = Math.min(stateT / 0.4, 1) * Math.min((STATE_DUR - stateT) / 0.3, 1);

      ctx.clearRect(0, 0, W(), H());

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.02)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W(); x += 36) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H()); ctx.stroke(); }
      for (let y = 0; y < H(); y += 36) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W(),y); ctx.stroke(); }

      const state = STATES[stateIdx];
      const col = state.color;
      const nds = state.nodes.map(n => ({ ...n, px: n.x * W(), py: n.y * H() + 40 }));

      ctx.save(); ctx.globalAlpha = fade;

      // Draw edges
      state.edges.forEach(([a, b]) => {
        const na = nds[a], nb = nds[b];
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(na.px, na.py); ctx.lineTo(nb.px, nb.py); ctx.stroke();
      });

      // Draw nodes
      nds.forEach((n, i) => {
        const pulse = Math.sin(t * 2 + i * 1.2) * 0.3 + 0.7;
        const isRoot = i === 0;
        const c = isRoot ? col : "rgba(255,255,255,0.15)";
        const sc = isRoot ? col : "rgba(255,255,255,0.3)";

        if (isRoot) {
          ctx.save(); ctx.globalAlpha = fade * 0.25 * pulse;
          glow(col, 30);
          ctx.beginPath(); ctx.arc(n.px, n.py, 30, 0, Math.PI * 2);
          ctx.fillStyle = `${col}22`; ctx.fill(); ng(); ctx.restore();
          ctx.save(); ctx.globalAlpha = fade;
        }

        if (isRoot) glow(col, 18);
        ctx.fillStyle = isRoot ? `${col}22` : "rgba(255,255,255,0.07)";
        ctx.strokeStyle = sc; ctx.lineWidth = isRoot ? 2.5 : 1.5;
        ctx.beginPath(); ctx.arc(n.px, n.py, 22, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke(); ng();

        ctx.fillStyle = isRoot ? col : "rgba(255,255,255,0.7)";
        ctx.font = `bold 18px Inter, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(n.v), n.px, n.py);
        if (isRoot) ctx.restore();
      });

      // Rotation label at top
      const lc = col;
      ctx.font = "bold 10px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = lc; ctx.shadowColor = lc; ctx.shadowBlur = 10;
      ctx.fillText(state.label, W() / 2, 28); ng();

      // Rotation type sub-label
      if (state.arrow) {
        ctx.font = "9px 'Courier New', monospace";
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillText(`↻ ${state.arrow.label}`, W() / 2, 44);
      }

      // Balance indicator
      const isBalanced = state.label.includes("✓");
      ctx.save();
      ctx.globalAlpha = fade * 0.8;
      ctx.fillStyle = isBalanced ? "#00e67622" : "#f59e0b22";
      ctx.beginPath(); ctx.roundRect(12, H() - 34, W() - 24, 24, 4); ctx.fill();
      ctx.fillStyle = isBalanced ? "#00e676" : "#f59e0b";
      ctx.font = "bold 14px 'Courier New', monospace"; ctx.textAlign = "left";
      ctx.fillText(isBalanced ? "▶ BALANCED: AVL property restored" : "▶ IMBALANCED: Rotation required", 20, H() - 18);
      ctx.restore();

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#050507]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: "block" }} />
      {/* Overlay labels */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
        {/* Top badge */}
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
            <Zap className="w-3 h-3 text-[#00e676]" fill="currentColor" />
            <span className="text-[10px] font-bold text-white/70 tracking-widest uppercase font-mono">AlgoLib</span>
          </div>
          <div className="ml-auto px-2.5 py-1 rounded-full bg-[#00e676]/10 border border-[#00e676]/20">
            <span className="text-[10px] font-bold text-[#00e676] tracking-wider uppercase font-mono">AVL Tree</span>
          </div>
        </div>
      </div>
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0a0a0c] to-transparent pointer-events-none" />
    </div>
  );
};


// ─── MAIN AUTH MODAL ──────────────────────────────────────────────────────────
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const handleGoogle = () => {
    onClose();
    executeGoogleSignIn();
  };

  const handleGithub = () => {
    onClose();
    executeGithubSignIn();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[820px] overflow-hidden rounded-[28px] flex flex-col md:flex-row shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_200px_rgba(0,230,118,0.04)]"
            style={{ border: "1px solid rgba(255,255,255,0.08)", maxHeight: "calc(100vh - 32px)" }}
          >
            {/* ── LEFT PANEL — Animated AlgoLib Canvas ── */}
            <div className="hidden md:block relative w-[340px] flex-shrink-0 min-h-[480px]">
              <AlgoLibPanel />
            </div>

            {/* ── RIGHT PANEL — Auth Form ── */}
            <div className="flex-1 bg-[#0a0a0c] flex flex-col justify-center p-8 md:p-10 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00e676]/6 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-violet-500/5 blur-[50px] rounded-full pointer-events-none" />
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#00e676]/40 to-transparent" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <X size={16} />
              </button>

              <div className="relative z-10 max-w-[320px] mx-auto w-full">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] mb-6">
                  <Shield className="w-3 h-3 text-[#00e676]" />
                  <span className="text-[10px] font-mono text-white/50 uppercase tracking-[0.15em]">Member Portal</span>
                </div>

                {/* Headline */}
                <h2 className="text-3xl font-bold text-white tracking-tight mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Welcome Back
                </h2>
                <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                  Authenticate your environment to enter AlgoLib and unlock the full experience.
                </p>

                {/* Auth Buttons */}
                <div className="flex flex-col gap-3">
                  {/* Google */}
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={handleGoogle}
                    className="group relative flex items-center justify-center gap-3 w-full h-12 bg-white text-black rounded-2xl font-semibold text-[14px] hover:bg-zinc-100 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.3)] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={handleGithub}
                    className="group relative flex items-center justify-center gap-3 w-full h-12 bg-[#161b22] text-white border border-white/[0.08] rounded-2xl font-semibold text-[14px] hover:bg-[#1c2128] hover:border-white/[0.14] transition-all overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <Github className="w-5 h-5 flex-shrink-0" />
                    Continue with GitHub
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </motion.button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[11px] text-zinc-500 font-mono">SECURED BY FIREBASE</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Footer */}
                <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
                  By continuing, you agree to our{" "}
                  <Link to="/terms" onClick={onClose} className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" onClick={onClose} className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
