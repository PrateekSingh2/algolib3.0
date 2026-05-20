import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  messageIndex: number;
}

export default function MarkdownRenderer({ content, copiedId, onCopy, messageIndex }: MarkdownRendererProps) {
  return (
    <div className="chat-prose w-full">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-[15px] text-zinc-200" {...props} />,
          
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            // Default to 'text' if the AI forgets to specify the language
            const language = match ? match[1] : 'text'; 
            const codeString = String(children).replace(/\n$/, '');
            // Generate a truly unique ID for the copy state
            const uniqueCodeId = `code-${messageIndex}-${language}-${codeString.substring(0, 5)}`;

            // --- BLOCK CODE (Gemini/Mac Style) ---
            // We now ONLY check !inline. It doesn't matter if 'match' exists.
            if (!inline) {
              return (
                <div className="rounded-2xl overflow-hidden my-6 border border-white/10 bg-[#1e1e20] shadow-lg w-full">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#252528] border-b border-white/5">
                    <span className="text-[11px] text-zinc-400 font-mono tracking-wider uppercase">
                      {language}
                    </span>
                    <button 
                      onClick={() => onCopy(codeString, uniqueCodeId)} 
                      className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-100 transition-colors uppercase tracking-wider"
                    >
                      {copiedId === uniqueCodeId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} 
                      {copiedId === uniqueCodeId ? 'Copied' : 'Copy code'}
                    </button>
                  </div>
                  {/* overflow-x-auto ensures horizontal scrolling, white-space: pre prevents ugly line wrapping */}
                  <div className="p-4 overflow-x-auto bg-[#131314]">
                    <pre className="text-[13px] md:text-sm text-zinc-200 font-mono custom-scrollbar m-0" style={{ whiteSpace: 'pre' }}>
                      <code {...props}>{codeString}</code>
                    </pre>
                  </div>
                </div>
              );
            }
            
            // --- INLINE CODE (e.g., `let x = 5`) ---
            return (
              <code className="bg-white/10 border border-white/10 px-1.5 py-0.5 rounded-md text-[13px] font-mono text-blue-200 shadow-sm" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}