import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Github, Linkedin, Zap, TerminalSquare, Layers, Fingerprint, Code2, Cpu, ArrowLeft } from "lucide-react"; 
import GlobalRibbon from "@/components/GlobalRibbon";
import AppFooter from "@/components/AppFooter";
import Navbar from "@/components/Navbar";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Helmet } from 'react-helmet-async'; // <-- Added Helmet Import

// --- THE APEX BACKGROUND (Consistent with App/Index/Profile) ---
const ApexBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-[#000000] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_40%,transparent_100%)]" />
    <div className="absolute top-[0%] right-[10%] w-[50vw] h-[50vh] bg-[#00d2ff] rounded-[100%] blur-[160px] mix-blend-screen opacity-[0.1]" />
    <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vh] bg-[#7000ff] rounded-[100%] blur-[160px] mix-blend-screen opacity-[0.08]" />
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

// --- ELITE SPOTLIGHT USER CARD ---
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      className="group relative flex flex-col h-full w-full max-w-[340px] rounded-[2rem] bg-[#050505] border border-white/[0.06] overflow-hidden hover:border-white/[0.15] transition-colors duration-500 shadow-2xl"
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-500 group-hover:opacity-100 z-20"
        style={{
          background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.06), transparent 80%)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

      <div className="relative z-30 flex-1 flex flex-col p-8">
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-5">
            <div className="absolute -inset-1 bg-gradient-to-tr from-white/20 to-white/5 rounded-full blur opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="absolute inset-0 rounded-full border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] z-20 pointer-events-none"></div>
            <img
              src={member.imageUrl}
              alt={member.name}
              className="relative w-24 h-24 rounded-full object-cover bg-[#0a0a0a] z-10 opacity-80 group-hover:opacity-100 transition-all duration-500"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://placehold.co/200x200/0a0a0a/ffffff?text=${member.name.charAt(0)}`;
              }}
            />
            <div className="absolute bottom-0 right-0 bg-[#050505] p-1.5 rounded-full border border-white/[0.1] z-30 shadow-lg">
              <member.icon size={12} className="text-zinc-400" />
            </div>
          </div>
          
          <h3 className="text-xl font-medium text-white tracking-tight leading-none mb-2">{member.name}</h3>
          <span className="text-[10px] font-mono tracking-widest text-zinc-400 bg-white/[0.03] border border-white/[0.05] px-2.5 py-1 rounded-md uppercase shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.05)]">
            {member.role}
          </span>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed font-light text-center mb-6 flex-1">
          {member.bio}
        </p>

        <div className="flex items-center justify-center gap-3 pt-6 border-t border-white/[0.05] mt-auto">
          <a href={member.github} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.02] border border-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.1] transition-all shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.05)]">
            <Github size={16} />
          </a>
          <a href={member.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.02] border border-white/[0.05] text-zinc-400 hover:text-[#00d2ff] hover:bg-white/[0.05] hover:border-[#00d2ff]/30 transition-all shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.05)]">
            <Linkedin size={16} />
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
      role: 'CEO, Founder & Lead Developer', 
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
      role: 'CPO & Head of Design', 
      imageUrl: 'https://ik.imagekit.io/g7e4hyclo/shiva.png',
      github: 'https://github.com/shivaaggrawal',
      linkedin: 'https://www.linkedin.com/in/shiva-agrawal-048ba2361',
      bio: 'Guardian of user experience and interface design, ensuring every pixel and interaction is polished to perfection.',
      icon: Layers
    },
    { 
      name: 'Raushan Gupta', 
      role: 'CMO & Head of Community', 
      imageUrl: 'https://ik.imagekit.io/g7e4hyclo/WhatsApp%20Image%202026-03-14%20at%2010.27.45%20PM.jpeg',
      github: 'https://github.com/raushanrewa786-rgb',
      linkedin: 'https://www.linkedin.com/in/raushan-gupta-b154b0387',
      bio: 'Driving the narrative and community engagement around our technology to grow our audience.',
      icon: Fingerprint
    },
    { 
      name: 'Sarvagya Singhai', 
      role: 'CMO & Head of Community', 
      imageUrl: 'https://ik.imagekit.io/g7e4hyclo/sarv.jpeg',
      github: 'https://github.com/singhaisarvagya8-hue',
      linkedin: 'https://www.linkedin.com/in/sarvagya-singhai-5058a5381',
      bio: 'Strategic communicator and community builder, amplifying our message across digital channels.',
      icon: Cpu
    },
  ];

return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 flex flex-col relative overflow-hidden">
      
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

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": "Meet the Developers | AlgoLib",
            "url": "https://algolib.netlify.app/developer/",
            "description": "Meet the visionaries and elite engineering crew behind AlgoLib's interactive visualization matrix.",
            "mainEntity": {
              "@type": "Organization",
              "name": "AlgoLib",
              "url": "https://algolib.netlify.app/",
              "founder": [
                {
                  "@type": "Person",
                  "name": "Prateek Singh",
                  "jobTitle": "CEO, Founder & Lead Developer"
                }
              ]
            }
          })}
        </script>
      </Helmet>

      <ApexBackground />
      
      {/* INJECTED NAVBAR & GLOBAL RIBBON */}
      <div className="fixed top-0 left-0 w-full z-[100]">
        <GlobalRibbon />
        <Navbar />
      </div>

      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-6 pt-36 pb-32">
        
        <div className="mb-12">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#050505] border border-white/[0.08] text-zinc-400 hover:text-sky-400 hover:bg-white/[0.04] hover:border-white/[0.15] transition-all duration-300 text-sm font-medium group shadow-sm"
          >
            <ArrowLeft size={16} className="text-zinc-500 group-hover:text-sky-400 group-hover:-translate-x-0.5 transition-all duration-300" />
            <span>Back to App</span>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: "easeOut" }} 
          className="text-center mb-20 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] mb-8 backdrop-blur-md shadow-2xl">
             <Zap className="w-3.5 h-3.5 text-zinc-300"/>
             <span className="text-[11px] font-mono font-medium tracking-widest text-zinc-300 uppercase">
               Architecture Crew
             </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6 leading-[0.9]">
            Meet the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Visionaries.</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed">
            The elite synergy of engineering, testing, and creative talent powering the ultimate visualization matrix.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-6xl mx-auto">
          {teamMembers.map((member, i) => (
            <TeamMemberCard key={member.name} member={member} index={i} />
          ))}
        </div>

      </main>

      <div className="relative z-10">
        <AppFooter />
      </div>
    </div>
  );
};

export default Developer;