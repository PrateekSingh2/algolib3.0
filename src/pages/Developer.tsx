import { motion } from "framer-motion";
import { Github, Linkedin, Code2, Cpu } from "lucide-react";
import Navbar from "@/components/Navbar";

// Floating Animation Helper
const FloatingElement = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}>
    {children}
  </motion.div>
);

const Developer = () => {
  const teamMembers = [
    {
      name: "Prateek Singh",
      role: "ARCHITECT",
      bio: "Core system architecture, Visualizer Engine, and Backend logic circuits.",
      avatar: "https://ik.imagekit.io/g7e4hyclo/photo.jpg",
      github: "https://github.com/prateeksingh2",
      linkedin: "https://www.linkedin.com/in/rajawatprateeksingh",
    },
    {
      name: "Shivansh Sahu",
      role: "INTERFACE_DESIGN",
      bio: "Holographic UI/UX, Motion Physics, and Mobile Responsiveness.",
      avatar: "https://ik.imagekit.io/g7e4hyclo/co-photo.jpg",
      github: "https://github.com/shivanshmax-Monster",
      linkedin: "https://www.linkedin.com/in/shivansh-sahu-523a5a391",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050510] text-white selection:bg-[#9d00ff]/30">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1e1b4b] via-[#050510] to-[#000000]" />
      
      {/* Navbar is Fixed at Z-50 */}
      <Navbar />

      {/* FIX APPLIED HERE:
         - Changed 'pt-4' to 'pt-28' for mobile. 
           This pushes content down ~112px, clearing the floating navbar.
         - kept 'md:pt-32' for desktop to maintain that spacious look.
      */}
      <div className="pt-28 md:pt-32 pb-16 px-4 relative z-10">
        <div className="container mx-auto max-w-5xl">
          
          <motion.div initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 md:mb-12">
            <div className="inline-block mb-4 px-3 py-1 rounded-full border border-[#00f5ff]/30 bg-[#00f5ff]/5 text-[#00f5ff] text-xs font-mono tracking-widest">
               CREW_MANIFEST
            </div>
            
            <h1 className="text-3xl md:text-6xl font-black text-white tracking-tighter mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f5ff] to-[#9d00ff]">SYSTEM ARCHITECTS</span>
            </h1>
            <p className="text-gray-400 font-light tracking-wide text-xs md:text-sm uppercase max-w-md mx-auto">
               The minds currently operating the AlgoLib Core
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {teamMembers.map((member, i) => (
              <FloatingElement key={member.name} delay={i * 0.5}>
                 <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.2 }}>
                    
                    {/* CRYO POD CONTAINER */}
                    <div className="relative group bg-[#0a0a1a]/60 border border-white/10 hover:border-[#9d00ff]/50 transition-all duration-500 rounded-tr-[3rem] rounded-bl-[3rem] p-6 md:p-8 overflow-hidden backdrop-blur-md">
                       
                       {/* Scanning Light */}
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9d00ff] to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />

                       <div className="flex flex-col items-center text-center relative z-10">
                          
                          {/* Avatar Ring */}
                          <div className="relative w-20 h-20 md:w-24 md:h-24 mb-4 md:mb-6">
                             <div className="absolute inset-0 border-2 border-dashed border-[#00f5ff]/30 rounded-full animate-[spin_10s_linear_infinite]" />
                             <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover border-2 border-white/10 relative z-10 grayscale group-hover:grayscale-0 transition-all duration-500" />
                          </div>

                          <h3 className="text-lg md:text-xl font-bold text-white mb-1 tracking-tight">{member.name}</h3>
                          <span className="text-[10px] font-mono text-[#00f5ff] mb-4 bg-[#00f5ff]/10 px-2 py-0.5 rounded border border-[#00f5ff]/20">
                             {member.role}
                          </span>
                          
                          <p className="text-xs md:text-sm text-gray-400 mb-6 font-light leading-relaxed">
                             {member.bio}
                          </p>

                          <div className="flex gap-4">
                             <a href={member.github} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#00f5ff] transition-colors border border-white/5">
                                <Github className="h-5 w-5" />
                             </a>
                             <a href={member.linkedin} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#00f5ff] transition-colors border border-white/5">
                                <Linkedin className="h-5 w-5" />
                             </a>
                          </div>
                       </div>
                    </div>
                 </motion.div>
              </FloatingElement>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developer;