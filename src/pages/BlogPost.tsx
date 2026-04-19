import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, ChevronRight, Share2, Twitter, Linkedin, Link as LinkIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import AppFooter from '../components/AppFooter';
import { staticBlogPosts } from '../lib/blogPosts';

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  const post = staticBlogPosts.find(p => p.id === id);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    if (post) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center text-white">
        <h1 className="text-4xl font-bold mb-4">404 - Post Not Found</h1>
        <p className="text-zinc-500 mb-8">The engineering dispatch you are looking for does not exist.</p>
        <button onClick={() => navigate('/blog')} className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors">
          Return to Hub
        </button>
      </div>
    );
  }

  const headings = post.content.split('\n')
    .filter(line => line.startsWith('## ') || line.startsWith('### '))
    .map(line => {
      const level = line.startsWith('###') ? 3 : 2;
      const text = line.replace(/^#+\s/, '').replace(/[*_~`]/g, '');
      const slug = text.toLowerCase().replace(/[^\w]+/g, '-');
      return { level, text, slug };
    });

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const MarkdownComponents: any = {
    h2: ({node, children, ...props}: any) => {
      const idText = children[0]?.toString().toLowerCase().replace(/[^\w]+/g, '-') || '';
      return <h2 id={idText} className="scroll-mt-32 border-b border-white/[0.05] pb-4 mt-16 mb-8 text-3xl font-bold" {...props}>{children}</h2>;
    },
    h3: ({node, children, ...props}: any) => {
      const idText = children[0]?.toString().toLowerCase().replace(/[^\w]+/g, '-') || '';
      return <h3 id={idText} className="scroll-mt-32 mt-12 mb-6 text-2xl font-semibold text-zinc-200" {...props}>{children}</h3>;
    },
    p: ({node, children, ...props}: any) => <p className="leading-relaxed mb-6 text-lg text-zinc-300" {...props}>{children}</p>,
    ul: ({node, children, ...props}: any) => <ul className="list-disc list-outside ml-6 mb-8 text-lg text-zinc-300 marker:text-sky-500" {...props}>{children}</ul>,
    ol: ({node, children, ...props}: any) => <ol className="list-decimal list-outside ml-6 mb-8 text-lg text-zinc-300 marker:text-zinc-500 font-medium" {...props}>{children}</ol>,
    li: ({node, children, ...props}: any) => <li className="mb-2 pl-2" {...props}>{children}</li>,
    blockquote: ({node, children, ...props}: any) => (
      <blockquote className="border-l-4 border-sky-500 bg-sky-500/5 py-4 px-6 rounded-r-xl my-8 italic text-zinc-300" {...props}>
        {children}
      </blockquote>
    ),
    code: ({node, inline, children, ...props}: any) => (
      inline 
        ? <code className="bg-white/[0.08] text-sky-300 px-1.5 py-0.5 rounded-md font-mono text-sm border border-white/[0.05]" {...props}>{children}</code>
        : <code {...props}>{children}</code>
    ),
    pre: ({node, children, ...props}: any) => (
      <pre className="bg-[#0A0A0A] border border-white/[0.05] p-6 rounded-2xl overflow-x-auto my-8 shadow-xl" {...props}>
        {children}
      </pre>
    ),
    a: ({node, children, ...props}: any) => <a className="text-sky-400 hover:text-sky-300 hover:underline underline-offset-4 transition-colors" {...props}>{children}</a>,
  };

  return (
    <div className="min-h-screen bg-[#060606] text-zinc-300 font-sans flex flex-col selection:bg-sky-500/30 selection:text-white pb-0">
      <Helmet>
        <title>{post.title} | AlgoLib Blog</title>
        <meta name="description" content={post.excerpt} />
        {post.seoKeywords && <meta name="keywords" content={post.seoKeywords.join(', ')} />}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.coverImage} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={post.coverImage} />
      </Helmet>
      
      <div className="fixed top-0 left-0 w-full z-[100] bg-[#060606]/80 backdrop-blur-md">
        <Navbar />
        {/* READING PROGRESS BAR */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-500 origin-left"
          style={{ scaleX }}
        />
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-32 md:py-40 flex flex-col text-left">
        
        {/* POST HEADER FULL WIDTH */}
        <div className="max-w-4xl mx-auto w-full mb-12 text-center md:text-left">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-medium text-zinc-500 mb-8">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            <ChevronRight size={14} />
            <span className="text-sky-400 capitalize">{post.category}</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold text-white leading-tight mb-8 tracking-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pb-8 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <img src={post.author.avatar} alt={post.author.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10" />
              <div className="text-left">
                <div className="text-sm font-semibold text-zinc-100">{post.author.name}</div>
                <div className="text-xs text-zinc-500">{post.author.role}</div>
              </div>
            </div>
            
            <div className="h-10 w-px bg-white/[0.1] hidden md:block" />
            
            <div className="flex items-center gap-5 text-sm font-medium text-zinc-400">
              <span className="flex items-center gap-2"><Calendar size={16} className="text-zinc-500" /> {post.date}</span>
              <span className="flex items-center gap-2 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.05]"><Clock size={14} className="text-sky-400" /> {post.readTime}</span>
            </div>
          </div>
        </div>

        {/* COVER IMAGE */}
        <div className="w-full max-w-5xl mx-auto aspect-[21/9] md:aspect-[2.5/1] bg-zinc-900 rounded-[32px] overflow-hidden mb-16 border border-white/[0.05] shadow-2xl relative">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060606] to-transparent opacity-60" />
        </div>

        {/* CONTENT AREA WITH SIDEBAR */}
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 relative">
          
          {/* LEFT SIDEBAR: AUTHOR & SHARE */}
          <div className="hidden lg:flex flex-col w-64 shrink-0 gap-8 sticky top-32 max-h-[calc(100vh-8rem)]">
            {/* Table of Contents */}
            {headings.length > 0 && (
              <div className="bg-[#0A0A0A] border border-white/[0.05] rounded-3xl p-6">
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">In this article</h4>
                <ul className="space-y-3">
                   {headings.map((h, i) => (
                     <li key={i} className={`${h.level === 3 ? 'ml-4' : ''}`}>
                       <a href={`#${h.slug}`} className="text-sm text-zinc-500 hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
                         {h.text}
                       </a>
                     </li>
                   ))}
                </ul>
              </div>
            )}
            
            {/* Share / Actions */}
            <div className="flex flex-col gap-3">
               <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider pl-2">Share this</span>
               <div className="flex gap-2">
                 <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')} className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-sky-400 hover:bg-sky-400/10 transition-colors">
                   <Twitter size={18} />
                 </button>
                 <button onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')} className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-sky-600 hover:bg-sky-600/10 transition-colors">
                   <Linkedin size={18} />
                 </button>
                 <button onClick={copyLink} className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors relative">
                   <LinkIcon size={18} />
                   {copied && <span className="absolute -top-8 bg-white text-black text-[10px] px-2 py-0.5 rounded font-bold">Copied</span>}
                 </button>
               </div>
            </div>
          </div>

          {/* MAIN ARTICLE BODY */}
          <article className="flex-1 w-full max-w-3xl">
            <div className="prose prose-invert prose-sky max-w-none text-left">
              <ReactMarkdown components={MarkdownComponents}>
                {post.content}
              </ReactMarkdown>
            </div>

            {/* TAGS & FOOTER IN-ARTICLE */}
            <div className="mt-20 pt-10 border-t border-white/[0.05]">
              <div className="flex flex-wrap gap-2 mb-12">
                {post.tags.map(tag => (
                  <span key={tag} className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.05] text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* ARTICLE CTA */}
              <div className="bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-[32px] p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Build faster with AlgoLib</h3>
                  <p className="text-zinc-400 text-sm max-w-md">Join thousands of developers using our 60FPS visualizer and real-time execution arena to master complex algorithms.</p>
                </div>
                <Link to="/compiler" className="bg-white text-black px-8 py-4 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)] whitespace-nowrap">
                  Open Engine Studio
                </Link>
              </div>

              <div className="mt-16 text-center lg:text-left">
                <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors group bg-white/[0.02] border border-white/[0.05] px-6 py-3 rounded-full hover:bg-white/[0.05]">
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  Return to Journal Hub
                </Link>
              </div>
            </div>
          </article>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default BlogPost;
