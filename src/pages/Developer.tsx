import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Github, Linkedin, Zap, TerminalSquare, Layers, Fingerprint, Code2, Cpu, ArrowLeft } from "lucide-react"; 
import GlobalRibbon from "@/components/GlobalRibbon";
import AppFooter from "@/components/AppFooter";
import Navbar from "@/components/Navbar";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Helmet } from 'react-helmet-async';

// --- THE APEX BACKGROUND (Smooth, Static, High-Depth) ---
const ApexBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_20%,transparent_100%)]" />
    
    {/* PREMIUM LIGHT MODE MESH GRADIENT */}
    <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-500/15 rounded-full blur-[120px] dark:hidden mix-blend-multiply" />
    <div className="absolute top-[10%] right-[-5%] w-[40vw] h-[40vw] bg-orange-400/15 rounded-full blur-[120px] dark:hidden mix-blend-multiply" />
    <div className="absolute bottom-[-10%] left-[10%] w-[45vw] h-[45vw] bg-emerald-400/15 rounded-full blur-[120px] dark:hidden mix-blend-multiply" />
    <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] bg-sky-400/20 rounded-full blur-[100px] dark:hidden mix-blend-multiply" />
    
    {/* DARK MODE GLOWING ORBS */}
    <div className="hidden dark:block absolute top-[-10%] right-[5%] w-[60vw] h-[60vh] bg-[#00d2ff] rounded-full blur-[200px] mix-blend-screen opacity-[0.12]" />
    <div className="hidden dark:block absolute bottom-[-20%] left-[-10%] w-[70vw] h-[70vh] bg-[#7000ff] rounded-full blur-[200px] mix-blend-screen opacity-[0.12]" />
  </div>
);

interface TeamMember {
  name: string;
  role: string;
  imageUrl: string;
  github: string;
  linkedin: string;
  bio: string;
  icon: any;
}

// --- ULTRA GLOSSY GLASSMORPHISM CARD ---
const TeamMemberCard = ({ member, index }: { member: TeamMember; index: number }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.7, type: "spring", stiffness: 90, damping: 20 }}
      onMouseMove={handleMouseMove}
      className="group relative flex flex-col h-full w-full max-w-[360px] rounded-[2.5rem] bg-white/60 dark:bg-white/[0.02] backdrop-blur-3xl border border-slate-200/80 dark:border-white/[0.08] dark:border-t-white/[0.2] dark:border-l-white/[0.15] overflow-hidden hover:border-slate-300 dark:hover:border-white/[0.25] transition-all duration-500 hover:-translate-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,210,255,0.25)]"
    >
      {/* Glossy Diagonal Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 dark:via-white/[0.05] to-white/80 dark:to-white/[0.12] opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" />

      {/* Interactive Mouse Spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 transition duration-500 group-hover:opacity-100 z-20"
        style={{
          background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(120,120,120,0.1), transparent 80%)`,
        }}
      />

      <div className="relative z-30 flex-1 flex flex-col p-8 md:p-10">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-7 group-hover:scale-110 transition-transform duration-500 ease-out">
            {/* Vibrant Outer Aura */}
            <div className="absolute -inset-3 bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 rounded-full blur-xl opacity-20 group-hover:opacity-60 transition-opacity duration-500" />
            
            {/* Glossy Inner Rim */}
            <div className="absolute inset-0 rounded-full border-2 border-white/30 shadow-[inset_0_4px_15px_rgba(255,255,255,0.5)] z-30 pointer-events-none transition-all duration-500 group-hover:border-sky-300" />
            
            {/* Glossy Top Lens Flare Reflection */}
            <div className="absolute top-0 left-1/4 right-1/4 h-1/3 bg-gradient-to-b from-white/50 to-transparent rounded-t-full z-30 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
            
            <img
              src={member.imageUrl}
              alt={member.name}
              className="relative w-28 h-28 rounded-full object-cover bg-[#0a0a0a] z-20 opacity-90 group-hover:opacity-100 transition-all duration-500 shadow-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://placehold.co/200x200/0a0a0a/ffffff?text=${member.name.charAt(0)}`;
              }}
            />
            
            {/* Floating Icon Badge - Glassmorphism style */}
            <div className="absolute -bottom-2 -right-2 bg-white/80 dark:bg-white/[0.05] p-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.2] border-t-white dark:border-t-white/[0.4] border-l-white dark:border-l-white/[0.3] z-40 shadow-[0_8px_16px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.5)] backdrop-blur-xl group-hover:border-sky-300 dark:group-hover:border-sky-400/50 group-hover:bg-sky-50 dark:group-hover:bg-sky-500/10 transition-all duration-300 group-hover:scale-110">
              <member.icon size={16} className="text-slate-600 dark:text-zinc-300 group-hover:text-sky-500 dark:group-hover:text-sky-300 transition-colors" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-none mb-3 drop-shadow-md">{member.name}</h3>
          
          {/* Glossy Role Pill */}
          <span className="text-[11px] font-bold tracking-widest text-sky-700 dark:text-sky-100 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 dark:from-sky-500/20 dark:to-indigo-500/20 border border-white/40 dark:border-white/20 border-t-white/60 dark:border-t-white/40 px-4 py-1.5 rounded-full uppercase shadow-[inset_0px_1px_4px_rgba(255,255,255,0.4)] backdrop-blur-md group-hover:border-sky-400/60 transition-colors">
            {member.role}
          </span>
        </div>

        {/* Bio Text */}
        <p className="text-[15px] text-slate-600 dark:text-zinc-300 leading-relaxed font-light text-center mb-6 flex-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-500 drop-shadow-sm">
          {member.bio}
        </p>

        {/* Glossy Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 dark:via-white/[0.2] to-transparent my-6 shadow-sm dark:shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />

        {/* Social Links */}
        <div className="flex items-center justify-center gap-4 mt-auto relative z-40">
          <a href={member.github} target="_blank" rel="noreferrer" className="flex items-center justify-center w-11 h-11 rounded-full bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] border-t-white dark:border-t-white/[0.3] text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.15] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-95 backdrop-blur-md">
            <Github size={18} />
          </a>
          <a href={member.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-center w-11 h-11 rounded-full bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] border-t-white dark:border-t-white/[0.3] text-slate-600 dark:text-zinc-300 hover:text-[#0a66c2] hover:bg-sky-50 dark:hover:bg-white/[0.15] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(10,102,194,0.2)] dark:hover:shadow-[0_0_20px_rgba(10,102,194,0.4)] hover:scale-110 active:scale-95 backdrop-blur-md">
            <Linkedin size={18} />
          </a>
        </div>

      </div>
    </motion.div>
  );
};

const Developer = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const teamMembers: TeamMember[] = [
    { 
      name: 'Prateek Singh', 
      role: 'CEO, Founder & Lead', 
      imageUrl: 'https://ik.imagekit.io/g7e4hyclo/photo.jpg',
      github: 'https://github.com/prateeksingh2',
      linkedin: 'https://www.linkedin.com/in/rajawatprateeksingh',
      bio: 'Developer of the visualization engine and core system design, blending algorithmic precision with seamless user experience.',
      icon: Code2
    },
    { 
      name: 'Shivansh Sahu', 
      role: 'CTO & Co-Developer', 
      imageUrl: 'https://ik.imagekit.io/g7e4hyclo/co-photo.jpg',
      github: 'https://github.com/shivanshmax-Monster',
      linkedin: 'https://www.linkedin.com/in/shivansh-sahu-523a5a391',
      bio: 'Co-Developer of the visualization engine, specializing in performance optimization and cross-platform compatibility.',
      icon: TerminalSquare
    },
    { 
      name: 'Shiva Agrawal', 
      role: 'CPO & Lead Engineer', 
      imageUrl: 'https://ik.imagekit.io/g7e4hyclo/shiva.png',
      github: 'https://github.com/shivaaggrawal',
      linkedin: 'https://www.linkedin.com/in/shiva-agrawal-048ba2361',
      bio: 'Guardian of user experience and interface design, ensuring every pixel and interaction is polished to perfection.',
      icon: Layers
    },
    { 
      name: 'Raushan Gupta', 
      role: 'CMO & Community Head', 
      imageUrl: 'https://ik.imagekit.io/g7e4hyclo/WhatsApp%20Image%202026-03-14%20at%2010.27.45%20PM.jpeg',
      github: 'https://github.com/raushanrewa786-rgb',
      linkedin: 'https://www.linkedin.com/in/raushan-gupta-b154b0387',
      bio: 'Driving the narrative and community engagement around our technology to grow our audience.',
      icon: Fingerprint
    },
    { 
      name: 'Sarvagya Singhai', 
      role: 'Content & Articles Lead', 
      imageUrl: 'https://ik.imagekit.io/g7e4hyclo/sarv.jpeg',
      github: 'https://github.com/singhaisarvagya8-hue',
      linkedin: 'https://www.linkedin.com/in/sarvagya-singhai-5058a5381',
      bio: 'Reviewer of all content and articles, ensuring technical accuracy and clarity in our educational materials.',
      icon: Cpu
    },
  ];

return (
    <div className="min-h-screen bg-[#FAFCFF] dark:bg-none dark:bg-[#030303] text-slate-800 dark:text-white font-sans selection:bg-sky-500/30 flex flex-col relative overflow-hidden">
      
      {/* --- SEO METADATA --- */}
      <Helmet>
        <title>Meet the Developers | AlgoLib Architecture Crew</title>
        <meta name="title" content="Meet the Developers | AlgoLib Architecture Crew" />
        <meta name="description" content="Meet the visionaries and elite engineering crew behind AlgoLib. Discover the team building the ultimate interactive DSA visualization matrix." />
        <meta name="keywords" content="AlgoLib Team, Prateek Singh, Shivansh Sahu, developers, founders, engineering team, DSA visualizer creators" />
        <link rel="canonical" href="https://algolib.netlify.app/developer/" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://algolib.netlify.app/developer/" />
        <meta property="og:title" content="Meet the Developers | AlgoLib Architecture Crew" />
        <meta property="og:description" content="Meet the visionaries and elite engineering crew behind AlgoLib's interactive visualization matrix." />
        <meta property="og:image" content="https://ik.imagekit.io/g7e4hyclo/Screenshot%202026-04-12%20000252.png" /> 

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Meet the Developers | AlgoLib" />
        <meta name="twitter:description" content="Meet the visionaries behind AlgoLib's interactive visualization matrix." />
        <meta name="twitter:image" content="https://ik.imagekit.io/g7e4hyclo/Screenshot%202026-04-12%20000252.png" />
      </Helmet>

      <ApexBackground />
      
      {/* INJECTED NAVBAR & GLOBAL RIBBON (Glassmorphism Header) */}
      <div className="fixed top-0 left-0 w-full z-[100] bg-white/60 dark:bg-black/20 backdrop-blur-2xl border-b border-slate-200 dark:border-white/[0.1] shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <GlobalRibbon />
        <Navbar />
      </div>

      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-6 pt-40 pb-32">
        
        <div className="mb-14">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.1] border-t-white/80 dark:border-t-white/[0.25] text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/[0.08] transition-all duration-300 text-sm font-medium group shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-xl hover:shadow-md dark:hover:shadow-[0_8px_24px_rgba(255,255,255,0.05)]"
          >
            <ArrowLeft size={16} className="text-slate-400 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-white group-hover:-translate-x-1 transition-all duration-300" />
            <span>Back to Application</span>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: "easeOut" }} 
          className="text-center mb-24 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-sky-400/30 border-t-sky-300/50 bg-gradient-to-b from-sky-500/10 to-transparent mb-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(14,165,233,0.15)]">
             <Zap className="w-4 h-4 text-sky-500 dark:text-sky-400"/>
             <span className="text-xs font-bold tracking-widest text-sky-600 dark:text-sky-300 uppercase drop-shadow-md">
               Architecture Crew
             </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-8 leading-[1.05]">
            Meet the <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-900 dark:from-white via-sky-500 dark:via-sky-200 to-indigo-600 dark:to-indigo-400 drop-shadow-md dark:drop-shadow-[0_0_50px_rgba(56,189,248,0.3)]">
              Visionaries.
            </span>
          </h1>

          <p className="text-slate-600 dark:text-zinc-300 text-lg md:text-2xl font-light leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
            The elite synergy of engineering, design, and creative talent powering the ultimate visualization matrix.
          </p>
        </motion.div>

        {/* Flex layout optimized for perfectly centering 5 cards */}
        <div className="flex flex-wrap justify-center gap-8 lg:gap-12 max-w-[1250px] mx-auto">
          {teamMembers.map((member, i) => (
            <div key={member.name} className="w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-2rem)] flex justify-center">
              <TeamMemberCard member={member} index={i} />
            </div>
          ))}
        </div>

      </main>

      <div className="relative z-10 border-t border-slate-200/80 dark:border-white/[0.08] bg-white/40 dark:bg-black/40 backdrop-blur-xl">
        <AppFooter />
      </div>
    </div>
  );
};

export default Developer;