import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Clock, HardDrive, Copy, Check } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import { fetchAlgorithms, type Algorithm } from "@/lib/algorithms";
import GlassCard from "@/components/GlassCard";
import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";

const SnippetView = () => {
  const { id } = useParams<{ id: string }>();
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [activeTab, setActiveTab] = useState<"java" | "cpp">("java");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlgorithms().then((algos) => {
      const found = algos.find((a) => String(a.id) === id);
      setAlgorithm(found || null);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (algorithm) Prism.highlightAll();
  }, [algorithm, activeTab]);

  const handleCopy = () => {
    const code = activeTab === "java" ? algorithm?.codeJava : algorithm?.codeCpp;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <Navbar />
        <div className="scanning-line" />
      </div>
    );
  }

  if (!algorithm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <Navbar />
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Algorithm not found</p>
          <Link to="/" className="text-primary hover:underline">Go back</Link>
        </div>
      </div>
    );
  }

  const currentCode = activeTab === "java" ? algorithm.codeJava : algorithm.codeCpp;

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Navbar />

      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
              
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">{algorithm.title}</h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">{algorithm.description}</p>

            {/* Complexity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <GlassCard glow="blue">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Time Complexity</p>
                    <p className="text-lg font-mono font-semibold text-foreground">{algorithm.timeComplexity}</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard glow="purple">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <HardDrive className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Space Complexity</p>
                    <p className="text-lg font-mono font-semibold text-foreground">{algorithm.spaceComplexity}</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Code Viewer */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {(["java", "cpp"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveTab(lang)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === lang
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {lang === "java" ? "Java" : "C++"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="rounded-lg overflow-hidden">
                <pre className={`language-${activeTab === "java" ? "java" : "cpp"}`}>
                  <code className={`language-${activeTab === "java" ? "java" : "cpp"}`}>
                    {currentCode || "// No code available"}
                  </code>
                </pre>
              </div>
            </GlassCard>

            {/* Tags */}
            {algorithm.tags && algorithm.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {algorithm.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-lg glass text-xs font-medium text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SnippetView;
