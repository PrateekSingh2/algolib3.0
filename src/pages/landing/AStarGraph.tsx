import React, { useEffect, useRef } from "react";

// ── Graph definition ─────────────────────────────────────────────────────────
// Canvas: 460 × 300  (wide, short — matches the panel)
const CW = 460, CH = 300;

const NODES = [
  { id: 0, label: "A", x: 0.13, y: 0.52 }, // START
  { id: 1, label: "B", x: 0.38, y: 0.16 },
  { id: 2, label: "C", x: 0.50, y: 0.62 },
  { id: 3, label: "D", x: 0.72, y: 0.26 },
  { id: 4, label: "E", x: 0.28, y: 0.84 },
  { id: 5, label: "F", x: 0.74, y: 0.80 },
  { id: 6, label: "G", x: 0.92, y: 0.48 }, // GOAL
];

const EDGES: { a: number; b: number; w: number }[] = [
  { a: 0, b: 1, w: 4  },
  { a: 0, b: 4, w: 2  },
  { a: 1, b: 2, w: 5  },
  { a: 1, b: 3, w: 10 },
  { a: 2, b: 3, w: 4  },
  { a: 2, b: 4, w: 3  },
  { a: 2, b: 5, w: 8  },
  { a: 3, b: 5, w: 1  },
  { a: 3, b: 6, w: 3  },
  { a: 5, b: 6, w: 6  },
];

// A* pre-computed sequences (A→G shortest: A→B→C→D→G, cost=16 or A→B→C→D→G)
// Explore order: A(0), B(1), C(2), D(3), E(4), F(5), G(6)
const EXPLORE_SEQ  = [0, 1, 4, 2, 3, 5, 6];
const PATH_NODES   = [0, 1, 2, 3, 6]; // A→B→C→D→G

// ── Colours (matching the reference image) ──────────────────────────────────
const C_BG       = "#0c0c10";
const C_NODE_DEF = "rgba(255,255,255,0.12)";
const C_STROKE   = "rgba(255,255,255,0.30)";
const C_EDGE     = "rgba(255,255,255,0.18)";
const C_ACTIVE   = "#f59e0b";  // yellow — currently exploring
const C_VISITED  = "#a855f7";  // purple — closed set
const C_PATH     = "#06b6d4";  // cyan — final path
const C_START    = "#22c55e";  // green — start node ring
const C_GOAL     = "#a855f7";  // violet — goal node ring

const AStarGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CW; canvas.height = CH;
    const ctx = canvas.getContext("2d", { alpha: true })!;

    // Pixel coordinates
    const pts = NODES.map(n => ({ ...n, px: n.x * CW, py: n.y * CH }));

    // Path edges
    const pathEdges = PATH_NODES.slice(0, -1).map((a, i) => ({ a, b: PATH_NODES[i + 1] }));
    const isPathEdge = (a: number, b: number) =>
      pathEdges.some(pe => (pe.a === a && pe.b === b) || (pe.a === b && pe.b === a));

    // State
    let globalA = 0;
    let phase = 0; // 0=fadeIn 1=idle 2=explore 3=path 4=hold 5=fadeOut
    let phaseT = 0;
    const PHASE_DUR = [0.9, 0.3, EXPLORE_SEQ.length * 0.32, pathEdges.length * 0.55, 2.8, 0.8];

    const nodeState  = NODES.map(() => ({ visited: false, active: false, onPath: false, fadeIn: 0 }));
    const edgePathP  = EDGES.map(() => 0);
    let t = 0, lastTs = 0, raf = 0;

    const reset = () => {
      globalA = 0; phase = 0; phaseT = 0; t = 0;
      nodeState.forEach(n => { n.visited = false; n.active = false; n.onPath = false; n.fadeIn = 0; });
      edgePathP.fill(0);
    };

    // ── Helpers ──────────────────────────────────────────────────────────────
    const glow  = (c: string, b: number) => { ctx.shadowColor = c; ctx.shadowBlur = b; };
    const noglow = () => { ctx.shadowBlur = 0; };

    const drawLine = (x1: number, y1: number, x2: number, y2: number,
                      col: string, w: number, prog = 1, gl = 0) => {
      ctx.save();
      if (gl) glow(col, gl);
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (x2 - x1) * prog, y1 + (y2 - y1) * prog);
      ctx.stroke(); noglow(); ctx.restore();
    };

    const drawCircle = (x: number, y: number, r: number, fill: string,
                        stroke?: string, sw = 2, gl = 0) => {
      ctx.save(); if (gl) glow(stroke ?? fill, gl);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.stroke(); }
      noglow(); ctx.restore();
    };

    // ── Weight label mid-point ────────────────────────────────────────────────
    const edgeMid = (e: typeof EDGES[0]) => ({
      x: (pts[e.a].px + pts[e.b].px) / 2,
      y: (pts[e.a].py + pts[e.b].py) / 2,
    });

    // ── Draw ─────────────────────────────────────────────────────────────────
    const draw = (ts: number) => {
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts; t += dt; phaseT += dt;

      // Phase advance
      if (phaseT >= PHASE_DUR[phase]) {
        phaseT -= PHASE_DUR[phase]; phase++;
        if (phase > 5) reset();
      }

      // Update state
      if (phase === 0) {
        globalA = Math.min(phaseT / 0.7, 1);
        NODES.forEach((_, i) => {
          nodeState[i].fadeIn = Math.min(Math.max((phaseT - i * 0.08) / 0.35, 0), 1);
        });
      } else if (phase === 2) {
        const idx = Math.min(Math.floor(phaseT / 0.32), EXPLORE_SEQ.length - 1);
        EXPLORE_SEQ.forEach((n, i) => {
          if (i < idx) { nodeState[n].visited = true; nodeState[n].active = false; }
          else if (i === idx) { nodeState[n].active = true; nodeState[n].visited = false; }
        });
      } else if (phase === 3) {
        // Freeze explore state
        EXPLORE_SEQ.forEach(n => { nodeState[n].visited = true; nodeState[n].active = false; });
        const eDur = 0.55;
        const eIdx = Math.min(Math.floor(phaseT / eDur), pathEdges.length - 1);
        pathEdges.forEach((pe, i) => {
          const eI = EDGES.findIndex(e => (e.a===pe.a&&e.b===pe.b)||(e.a===pe.b&&e.b===pe.a));
          if (i < eIdx) { edgePathP[eI] = 1; nodeState[pe.a].onPath = true; nodeState[pe.b].onPath = true; }
          else if (i === eIdx) {
            const prog = Math.min((phaseT - eIdx * eDur) / eDur, 1);
            edgePathP[eI] = prog;
            nodeState[pe.a].onPath = true;
            if (prog > 0.85) nodeState[pe.b].onPath = true;
          }
        });
      } else if (phase === 4) {
        PATH_NODES.forEach(n => { nodeState[n].onPath = true; nodeState[n].visited = false; });
        edgePathP.forEach((_, i) => {
          if (pathEdges.some(pe => (EDGES[i].a===pe.a&&EDGES[i].b===pe.b)||(EDGES[i].a===pe.b&&EDGES[i].b===pe.a)))
            edgePathP[i] = 1;
        });
      } else if (phase === 5) {
        globalA = Math.max(1 - phaseT / 0.8, 0);
      }

      ctx.clearRect(0, 0, CW, CH);
      ctx.save(); ctx.globalAlpha = globalA;

      const pulse = Math.sin(t * 2.5) * 0.3 + 0.7;

      // ── Edges ──────────────────────────────────────────────────────────────
      EDGES.forEach((e, i) => {
        const na = pts[e.a], nb = pts[e.b];
        const onP = edgePathP[i] > 0;
        const bothVisited = nodeState[e.a].visited && nodeState[e.b].visited;

        // Base edge
        ctx.save(); ctx.globalAlpha = globalA * 0.9;
        drawLine(na.px, na.py, nb.px, nb.py,
          bothVisited ? C_VISITED + "50" : C_EDGE, 1.2);
        ctx.restore();

        // Path sweep
        if (onP) {
          ctx.save(); ctx.globalAlpha = globalA;
          drawLine(na.px, na.py, nb.px, nb.py, C_PATH, 2.5, edgePathP[i], 14);
          ctx.restore();
        }

        // Weight label
        const m = edgeMid(e);
        ctx.save(); ctx.globalAlpha = globalA * 0.55;
        ctx.fillStyle = onP ? C_PATH : "rgba(255,255,255,0.5)";
        ctx.font = "bold 9px Inter, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(e.w), m.x, m.y - 7);
        ctx.restore();
      });

      // Traveling dot along path edge
      if (phase === 3) {
        pathEdges.forEach(pe => {
          const eI = EDGES.findIndex(e => (e.a===pe.a&&e.b===pe.b)||(e.a===pe.b&&e.b===pe.a));
          const prog = edgePathP[eI];
          if (prog > 0 && prog < 1) {
            const na = pts[pe.a], nb = pts[pe.b];
            const dx = na.px + (nb.px - na.px) * prog;
            const dy = na.py + (nb.py - na.py) * prog;
            ctx.save(); ctx.globalAlpha = globalA;
            glow(C_PATH, 28); glow("#fff", 10);
            drawCircle(dx, dy, 5, "#fff"); noglow();
            ctx.restore();
          }
        });
      }

      // Exploring dot along visited edges
      if (phase === 2) {
        EDGES.forEach(e => {
          if (nodeState[e.a].active || nodeState[e.b].active) {
            const na = pts[e.a], nb = pts[e.b];
            const prog = (Math.sin(t * 3.5 + e.a * 0.6) + 1) / 2;
            const dx = na.px + (nb.px - na.px) * prog;
            const dy = na.py + (nb.py - na.py) * prog;
            ctx.save(); ctx.globalAlpha = globalA * 0.7;
            glow(C_ACTIVE, 16);
            drawCircle(dx, dy, 3, C_ACTIVE); noglow();
            ctx.restore();
          }
        });
      }

      // ── Nodes ──────────────────────────────────────────────────────────────
      pts.forEach((node, i) => {
        const s = nodeState[i];
        const fI = s.fadeIn * globalA;
        if (fI <= 0) return;
        ctx.save(); ctx.globalAlpha = fI;

        const isStart = i === 0, isGoal = i === 6;
        const R = 20;

        let fillC = C_NODE_DEF, strokeC = C_STROKE, strokeW = 1.5, glowC = "", glowB = 0;

        if (s.onPath) {
          fillC = C_PATH + "25"; strokeC = C_PATH; strokeW = 2.5;
          glowC = C_PATH; glowB = 20;
        } else if (s.active) {
          fillC = C_ACTIVE + "25"; strokeC = C_ACTIVE; strokeW = 2.5;
          glowC = C_ACTIVE; glowB = 18;
        } else if (s.visited) {
          fillC = C_VISITED + "20"; strokeC = C_VISITED; strokeW = 1.8;
          glowC = C_VISITED; glowB = 10;
        }

        // Outer ring for start/goal
        if (isStart && !s.onPath) {
          ctx.save(); ctx.globalAlpha = fI * pulse * 0.5;
          ctx.strokeStyle = C_START; ctx.lineWidth = 2;
          glow(C_START, 20);
          ctx.beginPath(); ctx.arc(node.px, node.py, R + 8 + pulse * 3, 0, Math.PI * 2);
          ctx.stroke(); noglow(); ctx.restore();
          fillC = C_NODE_DEF; strokeC = C_START; strokeW = 2.5; glowC = C_START; glowB = 15;
        }
        if (isGoal && !s.onPath) {
          ctx.save(); ctx.globalAlpha = fI * pulse * 0.5;
          ctx.strokeStyle = C_GOAL; ctx.lineWidth = 2;
          glow(C_GOAL, 20);
          ctx.beginPath(); ctx.arc(node.px, node.py, R + 8 + pulse * 3, 0, Math.PI * 2);
          ctx.stroke(); noglow(); ctx.restore();
          if (!s.visited && !s.active) { strokeC = C_GOAL; strokeW = 2; glowC = C_GOAL; glowB = 14; }
        }

        // Pulsing outer glow halo for active
        if (s.active || s.onPath) {
          ctx.save(); ctx.globalAlpha = fI * 0.25 * pulse;
          glow(glowC, 30);
          drawCircle(node.px, node.py, R + 12, glowC + "15"); noglow();
          ctx.restore();
        }

        // Main node circle
        if (glowC) glow(glowC, glowB);
        drawCircle(node.px, node.py, R, fillC, strokeC, strokeW);
        noglow();

        // Label
        const textCol = s.onPath ? C_PATH : s.active ? C_ACTIVE : s.visited ? C_VISITED : "rgba(255,255,255,0.8)";
        ctx.fillStyle = textCol;
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        if (glowC) { ctx.shadowColor = glowC; ctx.shadowBlur = 8; }
        ctx.fillText(node.label, node.px, node.py);
        noglow();

        // START / GOAL sub-label
        if (isStart) {
          ctx.fillStyle = C_START; ctx.font = "bold 8px Inter, sans-serif";
          ctx.shadowColor = C_START; ctx.shadowBlur = 8;
          ctx.fillText("START", node.px, node.py - R - 8); noglow();
        }
        if (isGoal) {
          ctx.fillStyle = s.onPath ? C_PATH : C_GOAL; ctx.font = "bold 8px Inter, sans-serif";
          ctx.shadowColor = s.onPath ? C_PATH : C_GOAL; ctx.shadowBlur = 8;
          ctx.fillText("GOAL", node.px, node.py - R - 8); noglow();
        }

        ctx.restore();
      });

      // ── Status text top-right ───────────────────────────────────────────────
      const statusMap: Record<number, [string, string]> = {
        0: ["SYSTEM_IDLE: MAP LOADED", "rgba(255,255,255,0.35)"],
        1: ["SYSTEM_IDLE: MAP LOADED", "rgba(255,255,255,0.35)"],
        2: ["A*_SEARCH: EXPLORING NODES...", C_ACTIVE],
        3: ["A*_SEARCH: PATH FOUND → TRACING", C_PATH],
        4: ["A*_COMPLETE: OPTIMAL ROUTE SHOWN", C_PATH],
        5: ["SYSTEM_IDLE: RESETTING...", "rgba(255,255,255,0.35)"],
      };
      if (statusMap[phase]) {
        const [txt, col] = statusMap[phase];
        ctx.save(); ctx.globalAlpha = globalA * 0.75;
        ctx.fillStyle = col; ctx.font = "bold 9px 'Courier New', monospace";
        ctx.textAlign = "right"; ctx.shadowColor = col; ctx.shadowBlur = 8;
        ctx.fillText(`⚡ ${txt}`, CW - 12, 16); noglow(); ctx.restore();
      }

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "auto", maxWidth: "100%", display: "block", aspectRatio: `${CW} / ${CH}` }}
      className="w-full h-auto"
    />
  );
};

export default AStarGraph;
