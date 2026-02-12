import { motion } from "framer-motion";
import { Github, Linkedin, Heart } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";

const contributors = [
  {
    name: "Shiva Agarwal",
    role: "Testing, Feedback for shifting teck stack.",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Emma",
    linkedin: "#",
  },
  {
    name: "This may be you",
    role: "What you contribute to us",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Emma",
    linkedin: "#",
  },
];

const Contributors = () => {
  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Navbar />

      <div className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-3">Contributors</h1>
            <p className="text-muted-foreground flex items-center justify-center gap-1.5">
              Made with <Heart className="h-4 w-4 text-destructive fill-destructive" /> by the community
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contributors.map((person, i) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard hover className="flex items-center gap-4">
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-12 h-12 rounded-full border border-primary/20 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{person.name}</h3>
                    <p className="text-xs text-muted-foreground">{person.role}</p>
                  </div>
                  <a href={person.linkedin} className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    <Linkedin className="h-4 w-4" />
                  </a>
                </GlassCard>
              </motion.div>
            ))}
          </div>
          <div className="mt-8">
            <div className="text-center text-sm text-muted-foreground py-6">
              Want to contribute? Email us at <a href="https://mail.google.com/mail/u/0/?view=cm&fs=1&to=prateeksinghrajawat2006@gmail.com&su=Bug/Contribution/Inquiry%20from%20AlgoLib&body=Hello%20there,%20I%20saw%20your%20site..." target="_blank" className="text-primary underline hover:opacity-90">contribute@algoverse</a> and we'll get back to you.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contributors;
