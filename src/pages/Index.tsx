import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowRight, Eye, Github, Linkedin, Twitter, ChevronRight, Zap, BookOpen, Code2 } from "lucide-react";
import { fetchAlgorithms, fetchVisitCount, getCategories, type Algorithm } from "@/lib/algorithms";
import GlassCard from "@/components/GlassCard";
import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";

const Index = () => {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAlgorithms(), fetchVisitCount()]).then(([algos, count]) => {
      setAlgorithms(algos);
      setVisitCount(count);
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => getCategories(algorithms), [algorithms]);
  const displayCategories = showAllCategories ? categories : categories.slice(0, 6);

  const filtered = useMemo(() => {
    let result = algorithms;
    if (selectedCategory) {
      result = result.filter((a) => a.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.tags?.some((t) => t.toLowerCase().includes(q)) ||
          a.category?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [algorithms, search, selectedCategory]);

  const suggestions = useMemo(() => {
    if (!search.trim() || search.length < 2) return [];
    return filtered.slice(0, 5);
  }, [search, filtered]);

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8">
              <Zap className="h-3 w-3 text-primary" />
              Open-source algorithm library
            </div>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6">
              <span className="text-foreground">Master</span>{" "}
              <span className="gradient-text">Algorithms</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Explore, visualize, and understand algorithms with interactive code snippets, complexity analysis, and a built-in Java visualizer.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative max-w-xl mx-auto mb-12"
          >
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search algorithms, tags, categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl glass-strong text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
              />
              <div className="absolute inset-0 -z-10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity animate-pulse-neon" />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-xl overflow-hidden z-50"
              >
                {suggestions.map((algo) => (
                  <Link
                    key={algo.id}
                    to={`/view/${algo.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-primary/10 transition-colors border-b border-border last:border-0"
                  >
                    <div>
                      <span className="text-sm font-medium text-foreground">{algo.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{algo.category}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-8 mb-16"
          >
            {[
              { icon: BookOpen, label: "Algorithms", value: algorithms.length },
              { icon: Code2, label: "Languages", value: "2" },
              { icon: Zap, label: "Visualizer", value: "Live" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 pb-8">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Quick Explore
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !selectedCategory
                  ? "bg-primary text-primary-foreground neon-glow-blue"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {displayCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground neon-glow-blue"
                    : "glass text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
            {categories.length > 6 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="px-4 py-2 rounded-lg text-sm font-medium glass text-primary hover:bg-primary/10 transition-all"
              >
                {showAllCategories ? "Show Less" : `View All (${categories.length})`}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Algorithm Cards */}
      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-5xl">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass rounded-xl p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.04 } },
              }}
            >
              {filtered.map((algo) => (
                <motion.div
                  key={algo.id}
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <Link to={`/view/${algo.id}`}>
                    <GlassCard hover className="h-full">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground leading-tight pr-2">
                          {algo.title}
                        </h3>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                        {algo.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium">
                          {algo.category}
                        </span>
                        {algo.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No algorithms found matching your search.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold gradient-text">AlgoLib</span>
              <span className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} All rights reserved
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
                <Eye className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  {visitCount.toLocaleString()} views
                </span>
              </div>
              {/* <div className="flex items-center gap-2">
                {[Github, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div> */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
