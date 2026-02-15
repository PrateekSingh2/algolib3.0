import { motion } from "framer-motion";
import { Linkedin, Heart, Network } from "lucide-react";
import Navbar from "@/components/Navbar";

const contributors = [
  {
    name: "Shiva Agarwal",
    role: "Tech stack migration, and UI feedback.",
    avatar: "https://ik.imagekit.io/g7e4hyclo/WhatsApp%20Image%202026-02-13%20at%204.09.05%20PM.jpeg",
    linkedin: "https://www.linkedin.com/in/shiva-agrawal-048ba2361?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  },
  {
    name: "Signal_Detected...",
    role: "Awaiting_Input",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
    linkedin: "#",
  },
];

const Contributors = () => {
  return (
    <div className="min-h-screen bg-[#050510] text-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-[#1a0b2e] via-[#050510] to-[#000000]" />
      <Navbar />

      <div className="pt-32 pb-16 px-4 relative z-10">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter flex items-center justify-center gap-3">
               <Network className="w-8 h-8 text-[#00ff88]" />
               Contributors Network
            </h1>
            <p className="text-gray-500 font-mono text-xs">
              Powered by <span className="text-[#00ff88]">AlgoLib</span> & Community Input
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contributors.map((person, i) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="group flex items-center gap-4 p-4 rounded-lg bg-[#0a0a1a]/50 border border-white/5 hover:border-[#00ff88]/40 hover:bg-[#00ff88]/5 transition-all duration-300">
                  <div className="relative shrink-0">
                     <div className="absolute inset-0 bg-[#00ff88] rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity" />
                     <img
                       src={person.avatar}
                       alt={person.name}
                       className="w-12 h-12 rounded-full border border-white/10 relative z-10 bg-black"
                     />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate font-mono">{person.name}</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide group-hover:text-[#00ff88] transition-colors">{person.role}</p>
                  </div>
                  <a href={person.linkedin} className="p-2 text-gray-600 hover:text-white transition-colors shrink-0">
                    <Linkedin className="h-4 w-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
             <div className="inline-block p-6 rounded-2xl bg-white/5 border border-dashed border-white/10">
                <p className="text-sm text-gray-400 font-mono mb-2">Initialize connection?</p>
                <a href="mailto:contribute@algoverse" className="text-[#00ff88] hover:text-[#00f5ff] transition-colors border-b border-[#00ff88]/30 hover:border-[#00f5ff] pb-1">
                   TRANSMIT_PACKET: contribute@algoverse
                </a>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contributors;