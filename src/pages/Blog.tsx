import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Calendar, Search, Newspaper, Zap, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import AppFooter from '../components/AppFooter';
import { staticBlogPosts } from '../lib/blogPosts';

const categories = ["All", "Engineering", "Platform Updates", "Tutorials"];

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = staticBlogPosts.filter(post => {
    const matchCat = activeCategory === "All" || post.category === activeCategory;
    const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const isDefaultView = activeCategory === "All" && searchQuery === "";
  const featuredPost = isDefaultView ? staticBlogPosts.find(p => p.featured) || filteredPosts[0] : null;
  
  const gridPosts = isDefaultView && featuredPost 
    ? filteredPosts.filter(p => p.id !== featuredPost.id)
    : filteredPosts;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans flex flex-col selection:bg-sky-500/30 selection:text-white">
      <Helmet>
        <title>Blog | AlgoLib Engineering</title>
        <meta name="description" content="Read the latest engineering updates, system architecture patterns, and algorithm tutorials from the AlgoLib team." />
      </Helmet>
      
      <div className="fixed top-0 left-0 w-full z-[100]">
        <Navbar />
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-32 md:py-40">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 mb-6 backdrop-blur-md"
          >
            <Newspaper className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] text-sky-200/80 font-mono tracking-widest uppercase">AlgoLib Journal</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight"
          >
            Engineering <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Voices.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-zinc-400 leading-relaxed font-light"
          >
            Deep technical dives into our 60FPS visualization engine, rigorous algorithmic tutorials, and the architecture that powers competitive matrices.
          </motion.p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16 relative z-10 border-b border-white/[0.05] pb-8">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scroll">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeCategory === cat 
                  ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                  : 'bg-white/[0.02] text-zinc-400 border border-white/[0.05] hover:text-white hover:bg-white/[0.06] hover:border-white/[0.1]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search articles, topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/[0.05] rounded-full pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all placeholder:text-zinc-600 shadow-inner"
            />
          </div>
        </div>

        {/* FEATURED POST */}
        {featuredPost && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-16 group block"
          >
            <Link to={`/blog/${featuredPost.id}`} className="flex flex-col lg:flex-row gap-8 lg:gap-12 bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.15] p-6 lg:p-8 rounded-[32px] transition-all hover:bg-white/[0.03]">
              <div className="w-full lg:w-3/5 aspect-[16/9] lg:aspect-[4/3] rounded-[24px] overflow-hidden relative shadow-2xl">
                <img src={featuredPost.coverImage} alt={featuredPost.title} className="w-full h-full object-cover origin-center group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                <div className="absolute top-6 left-6 flex gap-2">
                   <div className="bg-sky-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-[0_0_15px_rgba(14,165,233,0.5)]">
                     Featured
                   </div>
                   <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-mono tracking-widest text-white/90 uppercase">
                     {featuredPost.category}
                   </div>
                </div>
              </div>
              <div className="w-full lg:w-2/5 flex flex-col justify-center py-4 pr-4">
                <div className="flex items-center gap-4 text-xs text-zinc-500 mb-6 font-medium tracking-wide">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {featuredPost.date}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="flex items-center gap-1.5"><Clock size={14} /> {featuredPost.readTime}</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-zinc-100 group-hover:text-sky-400 transition-colors mb-6 leading-tight tracking-tight">
                  {featuredPost.title}
                </h2>
                <p className="text-zinc-400 leading-relaxed mb-8 text-lg">
                  {featuredPost.excerpt}
                </p>
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <img src={featuredPost.author.avatar} alt={featuredPost.author.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" />
                    <div>
                      <div className="text-sm font-semibold text-zinc-200">{featuredPost.author.name}</div>
                      <div className="text-xs text-zinc-500">{featuredPost.author.role}</div>
                    </div>
                  </div>
                  <div className="bg-white text-black p-3 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform">
                     <ArrowRight size={18} className="-rotate-45 group-hover:rotate-0 transition-all duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* FEED GRID */}
        {gridPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridPosts.map((post, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 + (featuredPost ? 0.3 : 0) }}
                key={post.id} 
                className="group bg-[#080808] border border-white/[0.05] rounded-[24px] overflow-hidden hover:border-white/[0.12] hover:bg-white/[0.02] transition-all hover:-translate-y-1 flex flex-col shadow-lg"
              >
                <Link to={`/blog/${post.id}`} className="block relative aspect-[16/10] overflow-hidden bg-zinc-900 border-b border-white/[0.05]">
                  <img 
                    src={post.coverImage} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-80" />
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-mono tracking-widest uppercase text-white/90">
                    {post.category}
                  </div>
                </Link>
                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4 font-medium tracking-wide">
                    <span className="flex items-center gap-1.5"><Calendar size={13} /> {post.date}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span>{post.readTime}</span>
                  </div>
                  <Link to={`/blog/${post.id}`}>
                    <h2 className="text-xl md:text-2xl font-bold text-zinc-100 group-hover:text-sky-400 transition-colors mb-3 leading-snug line-clamp-2">
                       {post.title}
                    </h2>
                  </Link>
                  <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 mb-8 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10" />
                      <span className="text-xs font-semibold text-zinc-300">{post.author.name}</span>
                    </div>
                    <Link to={`/blog/${post.id}`} className="text-zinc-500 group-hover:text-white transition-colors p-2 bg-white/[0.02] hover:bg-white/[0.08] rounded-full border border-transparent group-hover:border-white/[0.1]">
                      <ArrowRight size={16} className="-rotate-45 group-hover:rotate-0 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          !featuredPost && (
            <div className="py-32 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6">
                <Search size={32} className="text-zinc-600" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">No articles found</h3>
              <p className="text-zinc-400">Adjust your search parameters or select a different category.</p>
            </div>
          )
        )}

      </main>
      
      {/* NEWSLETTER CTA */}
      <div className="w-full bg-[#030303] border-t border-white/[0.05] py-24 md:py-32 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-1/3 h-full bg-sky-500/10 blur-[150px] pointer-events-none" />
         <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/20 mb-8">
             <Zap size={24} className="text-sky-400" />
           </div>
           <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Stay Synchronized</h2>
           <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
             Subscribe to the AlgoLib Dispatch. Get deep technical architectures, algorithm updates, and platform release notes delivered straight to your inbox.
           </p>
           <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
             <input type="email" placeholder="engineer@domain.com" className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-sky-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-sky-500/30 transition-all" required />
             <button type="submit" className="bg-white text-black px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-[0_0_15px_rgba(255,255,255,0.1)]">
               Subscribe <ArrowRight size={16} />
             </button>
           </form>
         </div>
      </div>

      <AppFooter />
      
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Blog;

