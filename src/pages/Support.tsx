import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, LifeBuoy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firestoreDB } from "../lib/firebase";
import { toast } from "sonner";
import AppFooter from '@/components/AppFooter';
import Navbar from '@/components/Navbar';
import GuestNavbar from '@/components/GuestNavbar';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Helmet } from 'react-helmet-async'; // <-- Added Helmet Import

const Support = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'Bug Report',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      toast.success("Message sent successfully!", {
        description: "Our support matrix has received your request. We'll be in touch soon.",
      });

      setFormData({ name: '', email: '', type: 'Bug Report', message: '' });
    } catch (error) {
      console.error("Error submitting support request:", error);
      toast.error("Transmission failed.", {
        description: "There was an error connecting to the support matrix. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
      
      {/* --- SEO METADATA --- */}
      <Helmet>
        <title>Support & Contact | AlgoLib</title>
        <meta name="title" content="Support & Contact | AlgoLib" />
        <meta name="description" content="Need help with AlgoLib? Report bugs, request features, or inquire about sponsoring competitive programming contests. Our support matrix is online." />
        <meta name="keywords" content="AlgoLib support, contact AlgoLib, report bug, sponsor contest, help center, developer support" />
        <link rel="canonical" href="https://algolib.netlify.app/support/" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://algolib.netlify.app/support/" />
        <meta property="og:title" content="Support & Contact | AlgoLib" />
        <meta property="og:description" content="Need help with AlgoLib? Report bugs, request features, or inquire about sponsoring competitive programming contests." />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Support & Contact | AlgoLib" />
        <meta name="twitter:description" content="Need help with AlgoLib? Report bugs, request features, or contact our support matrix." />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "AlgoLib Support",
            "url": "https://algolib.netlify.app/support/",
            "description": "Support and contact page for AlgoLib users.",
            "mainEntity": {
              "@type": "Organization",
              "name": "AlgoLib",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "url": "https://algolib.netlify.app/support/"
              }
            }
          })}
        </script>
      </Helmet>

      {/* INJECTED NAVBAR */}
      <div className="fixed top-0 left-0 w-full z-[100]">
        {isAuthenticated ? <Navbar /> : <GuestNavbar />}
      </div>

      <div className="pt-36 pb-24 max-w-4xl mx-auto px-6 relative z-10">
        <div className="mb-12">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#050505] border border-white/[0.08] text-zinc-400 hover:text-sky-400 hover:bg-white/[0.04] hover:border-white/[0.15] transition-all duration-300 text-sm font-medium group shadow-sm"
          >
            <ArrowLeft size={16} className="text-zinc-500 group-hover:text-sky-400 group-hover:-translate-x-0.5 transition-all duration-300" />
            <span>Back to App</span>
          </Link>
        </div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] mb-6 shadow-inner ring-1 ring-white/[0.02]">
             <LifeBuoy className="text-sky-400 w-7 h-7" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 leading-tight">
            How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">help you?</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl font-light max-w-2xl mx-auto">
            Whether you need technical assistance, want to report a bug, are looking for documentation, or have questions about sponsoring contests on our platform, our support matrix is online.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0A0C14] border border-white/[0.05] rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-zinc-400 font-medium">Name</label>
                <input 
                  required 
                  type="text" 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-[#050505] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500/50 transition-colors" 
                  placeholder="Engineer Name" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-zinc-400 font-medium">Email</label>
                <input 
                  required 
                  type="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-[#050505] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500/50 transition-colors" 
                  placeholder="name@matrix.com" 
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400 font-medium">Issue Type</label>
              <select 
                name="type" 
                value={formData.type}
                onChange={handleChange}
                className="bg-[#050505] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500/50 transition-colors appearance-none"
              >
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Account Issue">Account Issue</option>
                <option value="Data Deletion">Account & Data Deletion</option>
                <option value="Sponsor Contest">Sponsor Contest Inquiry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400 font-medium">Message</label>
              <textarea 
                required 
                name="message" 
                value={formData.message}
                onChange={handleChange}
                rows={5} 
                className="bg-[#050505] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500/50 transition-colors resize-none" 
                placeholder="Please describe the anomaly in detail..."
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="mt-4 group w-full bg-white text-black font-medium py-3.5 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Transmitting...
                </>
              ) : (
                <>
                  Send Message <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
      <AppFooter />
    </div>
  );
};

export default Support;