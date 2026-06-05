import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Search, ChevronDown, Quote, Plus, X, Upload, CheckCircle, Loader2, ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";

interface Testimonial {
  id: string; name: string; role: string; text: string;
  rating: number; image_url?: string | null; created_at: string;
}

const COLORS = [
  { from: "#00e676", to: "#00bcd4" }, { from: "#a78bfa", to: "#818cf8" },
  { from: "#f59e0b", to: "#f97316" }, { from: "#60a5fa", to: "#3b82f6" },
  { from: "#f472b6", to: "#ec4899" }, { from: "#34d399", to: "#10b981" },
  { from: "#f87171", to: "#ef4444" }, { from: "#c084fc", to: "#a855f7" },
];

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string; image_url?: string | null; idx: number; size?: string }> = ({ name, image_url, idx, size = "w-10 h-10" }) => {
  const [err, setErr] = useState(false);
  const c = COLORS[idx % COLORS.length];
  if (image_url && !err)
    return <img src={image_url} alt={name} onError={() => setErr(true)} className={`${size} rounded-full object-cover ring-2 ring-white/10 flex-shrink-0`} />;
  return (
    <div className={`${size} rounded-full flex items-center justify-center font-bold text-black flex-shrink-0`}
      style={{ background: `linear-gradient(135deg,${c.from},${c.to})` }}>
      {name[0]?.toUpperCase() || "?"}
    </div>
  );
};

// ── Star picker ───────────────────────────────────────────────────────────────
const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map(s => (
      <button key={s} type="button" onClick={() => onChange(s)}>
        <Star className="w-6 h-6 transition-all hover:scale-110" fill={s <= value ? "currentColor" : "none"}
          style={{ color: s <= value ? "#fbbf24" : "rgba(255,255,255,0.2)" }} />
      </button>
    ))}
  </div>
);

// ── Cloudinary upload ─────────────────────────────────────────────────────────
const CLOUD_NAME = "dmmv8phgq";
const UPLOAD_PRESET = "ml_default";
const uploadToCloudinary = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Image upload failed");
  return (await res.json()).secure_url;
};

// ── Submit Modal ──────────────────────────────────────────────────────────────
const SubmitModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [form, setForm] = useState({ name: "", role: "", text: "", rating: 5 });
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return setError("Please select an image file.");
    if (f.size > 5 * 1024 * 1024) return setError("Image must be under 5MB.");
    setImgFile(f); setImgPreview(URL.createObjectURL(f)); setError("");
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.role.trim() || !form.text.trim())
      return setError("Name, role and review are required.");
    if (form.text.length > 600) return setError("Review max 600 characters.");
    setSubmitting(true); setError("");
    try {
      let image_url: string | null = null;
      if (imgFile) {
        setUploading(true);
        image_url = await uploadToCloudinary(imgFile);
        setUploading(false);
      }
      const res = await fetch("/.netlify/functions/submit-testimonial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image_url }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Submission failed");
      setDone(true);
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); setUploading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)" }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.93, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }} transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }}
        className="relative w-full max-w-lg rounded-[24px] overflow-hidden"
        style={{ background: "linear-gradient(160deg,#0f0f14,#0c0c10)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 80px rgba(0,0,0,0.7),0 0 200px rgba(0,230,118,0.05)" }}
        onClick={e => e.stopPropagation()}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div>
            <h2 className="font-bold text-white text-base">Share Your Experience</h2>
            <p className="text-xs text-white/40 mt-0.5">Reviews go live after admin approval</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/10 text-white/50 hover:text-white transition-all"><X size={15} /></button>
        </div>

        <div className="p-6 space-y-4">
          {done ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#00e676]" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Review Submitted!</h3>
              <p className="text-white/40 text-sm">Thank you! Your review will appear once approved by our team.</p>
              <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-2xl bg-[#00e676]/15 border border-[#00e676]/30 text-[#00e676] text-sm font-semibold hover:bg-[#00e676]/25 transition-all">Close</button>
            </motion.div>
          ) : (
            <>
              {/* Profile photo */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-dashed border-white/20 flex items-center justify-center bg-white/[0.03] cursor-pointer hover:border-white/40 transition-all relative"
                  onClick={() => fileRef.current?.click()}>
                  {imgPreview ? <img src={imgPreview} className="w-full h-full object-cover" alt="preview" />
                    : <ImageIcon className="w-6 h-6 text-white/25" />}
                  {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-5 h-5 text-white animate-spin" /></div>}
                </div>
                <div className="flex-1">
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 text-xs font-semibold transition-all">
                    <Upload size={13} /> {imgPreview ? "Change Photo" : "Upload Photo"}
                  </button>
                  <p className="text-[11px] text-white/25 mt-1.5">Optional · Max 5MB · JPG/PNG</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Your Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Arjun Mehta"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Role / Title *</label>
                  <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="SDE @ Google"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Your Review *</label>
                <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} rows={4}
                  placeholder="Share what you love about AlgoLib..." maxLength={600}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all resize-none" />
                <p className="text-[11px] text-white/25 text-right mt-1">{form.text.length}/600</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Rating *</label>
                <StarPicker value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
              </div>

              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

              <button onClick={handleSubmit} disabled={submitting}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-black transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                style={{ background: "linear-gradient(135deg,#00e676,#00bcd4)", boxShadow: "0 0 30px rgba(0,230,118,0.25)" }}>
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploading ? "Uploading image…" : "Submitting…"}</> : <><Star className="w-4 h-4" fill="currentColor" /> Submit Review</>}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="p-6 rounded-[20px] bg-white/[0.03] border border-white/[0.06] animate-pulse">
    <div className="flex gap-0.5 mb-4">{[...Array(5)].map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-white/10" />)}</div>
    <div className="space-y-2 mb-5"><div className="h-3 bg-white/10 rounded-full w-full" /><div className="h-3 bg-white/10 rounded-full w-4/5" /><div className="h-3 bg-white/10 rounded-full w-3/5" /></div>
    <div className="flex items-center gap-3 pt-3 border-t border-white/[0.04]"><div className="w-10 h-10 rounded-full bg-white/10" /><div className="space-y-1.5"><div className="h-2.5 bg-white/10 rounded-full w-24" /><div className="h-2 bg-white/10 rounded-full w-16" /></div></div>
  </div>
);

const RATINGS = ["All", "5", "4", "3"];
const SORTS   = ["Newest", "Highest Rated", "Oldest"];

// ── Main page ─────────────────────────────────────────────────────────────────
const TestimonialsPage: React.FC = () => {
  const [all, setAll]           = useState<Testimonial[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [rating, setRating]     = useState("All");
  const [sort, setSort]         = useState("Newest");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("/.netlify/functions/get-testimonials")
      .then(r => r.json()).then((d: Testimonial[]) => setAll(d))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = all
    .filter(t => {
      const q = search.toLowerCase();
      return (!q || t.name.toLowerCase().includes(q) || t.role.toLowerCase().includes(q) || t.text.toLowerCase().includes(q))
        && (rating === "All" || t.rating === parseInt(rating));
    })
    .sort((a, b) => sort === "Newest" ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : sort === "Oldest" ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      : b.rating - a.rating);

  const avg       = all.length ? (all.reduce((s, t) => s + t.rating, 0) / all.length).toFixed(1) : "—";
  const fiveStar  = all.filter(t => t.rating === 5).length;

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(160deg,#06070a,#050507 50%,#07060d)", fontFamily: "'Inter',sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 100% 50% at 50% 0%,rgba(0,230,118,0.055),transparent)" }} />
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24">

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-white/50 uppercase tracking-widest mb-5">
            <Quote className="w-3 h-3 text-[#fbbf24]" /> Community Reviews
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4" style={{ letterSpacing: "-0.025em" }}>
            What developers<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] via-[#f97316] to-[#ef4444]">say about us</span>
          </h1>
          <p className="text-white/40 text-lg max-w-lg mx-auto mb-8">Real reviews from real programmers who use AlgoLib to learn, practice and compete.</p>

          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm text-black transition-all"
            style={{ background: "linear-gradient(135deg,#00e676,#00bcd4)", boxShadow: "0 0 32px rgba(0,230,118,0.3)" }}>
            <Plus className="w-4 h-4" /> Write a Review
          </motion.button>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-10">
            {[[`⭐ ${avg}`, "Average Rating"], [`🏆 ${fiveStar}`, "5-Star Reviews"], [`💬 ${all.length}+`, "Total Reviews"]].map(([v, l]) => (
              <div key={l} className="px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.07] text-center">
                <div className="text-xl font-black text-white">{v}</div>
                <div className="text-[11px] text-white/35 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews…"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all" />
          </div>
          <div className="flex gap-2">
            {RATINGS.map(r => (
              <button key={r} onClick={() => setRating(r)}
                className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-all border ${rating === r ? "bg-[#fbbf24]/15 border-[#fbbf24]/40 text-[#fbbf24]" : "bg-white/[0.03] border-white/[0.07] text-white/50 hover:text-white/70"}`}>
                {r === "All" ? "All" : `${r}★`}
              </button>
            ))}
          </div>
          <div className="relative">
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 pr-9 text-sm text-white/70 focus:outline-none cursor-pointer">
              {SORTS.map(s => <option key={s} value={s} className="bg-[#0c0c10]">{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white/70 mb-2">No reviews found</h3>
            <p className="text-white/35 text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filtered.map((t, i) => {
                const c = COLORS[i % COLORS.length];
                return (
                  <motion.div key={t.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03, duration: 0.4 }}
                    className="group p-6 rounded-[20px] bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] flex flex-col gap-4 relative overflow-hidden hover:border-white/[0.15] transition-all duration-300"
                    style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)" }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: `radial-gradient(circle at 15% 15%,${c.from}12,transparent 55%)` }} />
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="flex items-start justify-between">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5" fill={s <= t.rating ? "currentColor" : "none"} style={{ color: s <= t.rating ? "#fbbf24" : "rgba(255,255,255,0.15)" }} />)}
                      </div>
                      <Quote className="w-5 h-5 text-white/10 flex-shrink-0" />
                    </div>
                    <p className="text-[13.5px] leading-[1.72] text-white/60 flex-1 relative z-10">"{t.text}"</p>
                    <div className="flex items-center gap-3 pt-3 border-t border-white/[0.05] relative z-10">
                      <Avatar name={t.name} image_url={t.image_url} idx={i} />
                      <div>
                        <p className="text-[13px] font-semibold text-white/90">{t.name}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">{t.role}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && (
          <p className="text-center text-sm text-white/20 mt-8">{filtered.length} review{filtered.length !== 1 ? "s" : ""}</p>
        )}

        {/* Bottom CTA */}
        {!loading && (
          <div className="text-center mt-14">
            <p className="text-white/35 text-sm mb-4">Had a great experience? We'd love to hear from you.</p>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.10] text-white/70 hover:text-white hover:border-white/20 font-semibold text-sm transition-all">
              <Plus className="w-4 h-4" /> Add Your Review
            </button>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showModal && <SubmitModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>

      <AppFooter />
    </div>
  );
};

export default TestimonialsPage;
