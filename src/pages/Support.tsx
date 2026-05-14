import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Send, 
  LifeBuoy, 
  Loader2, 
  Mail, 
  MessageSquare, 
  User, 
  ChevronDown, 
  Globe, 
  Zap,
  Lock // <-- Added Lock icon
} from "lucide-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion"; // <-- Explicit Variants import
import { Link } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firestoreDB } from "../lib/firebase";
import { toast } from "sonner";
import AppFooter from '@/components/AppFooter';
import Navbar from '@/components/Navbar';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Helmet } from 'react-helmet-async';

const Support = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'Bug Report',
    message: ''
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      
      // Auto-populate the email if the user is logged in
      if (user && user.email) {
        setFormData(prev => ({ ...prev, email: user.email || '' }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addDoc(collection(firestoreDB, "support_requests"), {
        name: formData.name,
        email: formData.email,
        issueType: formData.type,
        message: formData.message,
        createdAt: serverTimestamp(),
        status: "open" 
      });

      toast.success("Request registered successfully", {
        description: "Our support engineers have received your request and will follow up within 24 hours.",
      });

      // Reset form, but keep the email if authenticated
      setFormData(prev => ({ 
        name: '', 
        email: isAuthenticated ? prev.email : '', 
        type: 'Bug Report', 
        message: '' 
      }));
    } catch (error) {
      console.error("Error submitting support request:", error);
      toast.error("Request submission failed", {
        description: "Unable to establish a connection to our support team. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-sky-500/30 overflow-hidden relative">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] bg-sky-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* SEO METADATA */}
      <Helmet>
        <title>Support & Contact | AlgoLib</title>
        <meta name="title" content="Support & Contact | AlgoLib" />
        <meta name="description" content="Need help with AlgoLib? Report bugs, request features, or inquire about sponsoring competitive programming contests. Our support team is online." />
        <meta name="keywords" content="AlgoLib support, contact AlgoLib, report bug, sponsor contest, help center, developer support" />
        <link rel="canonical" href="https://algolib.netlify.app/support/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://algolib.netlify.app/support/" />
        <meta property="og:title" content="Support & Contact | AlgoLib" />
        <meta property="og:description" content="Need help with AlgoLib? Report bugs, request features, or inquire about sponsoring competitive programming contests." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Support & Contact | AlgoLib" />
        <meta name="twitter:description" content="Need help with AlgoLib? Report bugs, request features, or contact our support team." />
      </Helmet>

      {/* NAVBAR */}
      <div className="fixed top-0 left-0 w-full z-[100] bg-transparent backdrop-blur-md border-b border-white/[0.05]">
        <Navbar />
      </div>

      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300 text-sm font-medium group backdrop-blur-sm"
          >
            <ArrowLeft size={16} className="text-zinc-500 group-hover:text-white group-hover:-translate-x-1 transition-all duration-300" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start mt-12">
          
          {/* Left Column: Copy & Alternative Contact */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-5 flex flex-col gap-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-6">
                <LifeBuoy size={14} /> Support Center
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
                How can we <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500">
                  help you?
                </span>
              </h1>
              <p className="text-zinc-400 text-lg font-light leading-relaxed">
                Whether you need technical assistance, want to report an anomaly, or are exploring contest sponsorships, our engineering team is standing by to assist you.
              </p>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-white/[0.1] to-transparent my-2" />

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">Quick Contact</h3>
              
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Direct Email</p>
                  <p className="text-xs text-zinc-500">teamalgolib@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Globe size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Community Forum</p>
                  <p className="text-xs text-zinc-500">Join the discussion</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: The Form */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-7"
          >
            <div className="bg-[#0A0A0B] border border-white/[0.08] rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent opacity-50" />
              
              <motion.form 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                onSubmit={handleSubmit} 
                className="flex flex-col gap-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Input */}
                  <motion.div variants={itemVariants} className="flex flex-col gap-2 relative">
                    <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-sky-400 transition-colors" />
                      <input 
                        required 
                        type="text" 
                        name="name" 
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-black/50 border border-white/[0.1] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all shadow-inner" 
                        placeholder="Your Name" 
                      />
                    </div>
                  </motion.div>

                  {/* Email Input - Now Contextually Locked */}
                  <motion.div variants={itemVariants} className="flex flex-col gap-2 relative">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Email Address</label>
                      {isAuthenticated && (
                        <span className="flex items-center gap-1 text-[10px] text-sky-400 font-medium uppercase tracking-wider">
                          <Lock size={10} /> Verified
                        </span>
                      )}
                    </div>
                    <div className="relative group">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isAuthenticated ? 'text-sky-500/50' : 'text-zinc-500 group-focus-within:text-sky-400'}`} />
                      <input 
                        required 
                        type="email" 
                        name="email" 
                        value={formData.email}
                        onChange={handleChange}
                        readOnly={isAuthenticated}
                        className={`w-full border rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all shadow-inner ${
                          isAuthenticated 
                            ? 'bg-white/[0.02] border-white/[0.05] text-zinc-400 cursor-not-allowed select-none' 
                            : 'bg-black/50 border-white/[0.1]'
                        }`} 
                        placeholder="your.email@example.com" 
                      />
                    </div>
                  </motion.div>
                </div>
                
                {/* Select Input */}
                <motion.div variants={itemVariants} className="flex flex-col gap-2">
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider ml-1">How can we help?</label>
                  <div className="relative group">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-sky-400 transition-colors z-10" />
                    <select 
                      name="type" 
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full bg-black/50 border border-white/[0.1] rounded-xl pl-12 pr-10 py-3.5 text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all appearance-none cursor-pointer shadow-inner"
                    >
                      <option value="Bug Report">Report a Bug / Anomaly</option>
                      <option value="Feedback">Suggest Feedback</option>
                      <option value="Article Issue">Report issues in Article</option>
                      <option value="Feature Request">Request a Feature</option>
                      <option value="Account Issue">Account Troubleshooting</option>
                      <option value="Data Deletion">Data Deletion Request</option>
                      <option value="Sponsor Contest">Sponsor a Contest</option>
                      <option value="Quiz Access">Request Quiz Dashboard Access</option>
                      <option value="Other">Other Inquiry</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                  </div>
                </motion.div>

                {/* Textarea */}
                <motion.div variants={itemVariants} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Message</label>
                    <span className="text-xs text-zinc-600 font-mono">{formData.message.length} chars</span>
                  </div>
                  <div className="relative group">
                    <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-zinc-500 group-focus-within:text-sky-400 transition-colors" />
                    <textarea 
                      required 
                      name="message" 
                      value={formData.message}
                      onChange={handleChange}
                      rows={5} 
                      className="w-full bg-black/50 border border-white/[0.1] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all resize-none shadow-inner" 
                      placeholder="Please provide as much detail as possible..."
                    ></textarea>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={itemVariants} className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="group relative w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                  >
                    {/* Button hover gradient effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Submitting Request...
                      </>
                    ) : (
                      <>
                        Submit Request <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </motion.div>
              </motion.form>
            </div>
          </motion.div>

        </div>
      </div>
      <AppFooter />
    </div>
  );
};

export default Support;