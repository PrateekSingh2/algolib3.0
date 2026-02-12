import { motion } from "framer-motion";
import { Github, Linkedin, Code2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";

const teamMembers = [
  {
    name: "Prateek Singh",
    role: "Lead Developer",
    bio: "Core architecture, Visualizer Engine, and Backend logic.",
    avatar: "https://ik.imagekit.io/g7e4hyclo/photo.jpg",
    github: "https://github.com/prateeksingh2",
    linkedin: "https://www.linkedin.com/in/rajawatprateeksingh",
  },
  {
    name: "Shivansh Sahu",
    role: "Co-Developer",
    bio: "UI/UX Design, Animations, and Mobile Responsiveness.",
    avatar: "https://ik.imagekit.io/g7e4hyclo/co-photo.jpg",
    github: "https://github.com/shivanshmax-Monster",
    linkedin: "https://www.linkedin.com/in/shivansh-sahu-523a5a391",
  },
];

const Developer = () => {
  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Navbar />

      <div className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-3">Developer team</h1>
            <p className="text-muted-foreground">The efforts, ideas, minds behind AlgoLib</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {teamMembers.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <GlassCard hover className="text-center">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-primary/20"
                  />
                  <h3 className="text-lg font-semibold text-foreground mb-1">{member.name}</h3>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                    {member.role}
                  </span>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{member.bio}</p>
                  <div className="flex justify-center gap-2">
                    <a href={member.github} className="p-2 rounded-lg glass text-muted-foreground hover:text-foreground transition-colors">
                      <Github className="h-4 w-4" />
                    </a>
                    <a href={member.linkedin} className="p-2 rounded-lg glass text-muted-foreground hover:text-foreground transition-colors">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developer;
