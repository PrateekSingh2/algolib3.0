import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight'; 
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks'; // ✨ ADDED: Forces single line breaks to render
import { Copy, Check } from 'lucide-react';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css'; 

interface MarkdownRendererProps {
  content: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  messageIndex: number;
}

export default function MarkdownRenderer({ content, copiedId, onCopy, messageIndex }: MarkdownRendererProps) {
  
  const extractText = (nodes: React.ReactNode): string => {
    if (typeof nodes === 'string' || typeof nodes === 'number') return String(nodes);
    if (Array.isArray(nodes)) return nodes.map(extractText).join('');
    if (React.isValidElement(nodes)) return extractText(nodes.props.children);
    return '';
  };

  return (
    // ✨ CHANGED: Added prose-p:mb-4 and prose-li:my-1 for better breathing room between text blocks
    <div className="prose prose-invert prose-zinc max-w-none w-full prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-headings:font-semibold prose-a:text-blue-400 prose-p:leading-relaxed prose-p:mb-4 prose-li:my-1">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]} // ✨ ADDED: remarkBreaks
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          pre({ node, children, ...props }: any) {
            const childArray = React.Children.toArray(children);
            const codeElement = childArray.find(
              (child) => React.isValidElement(child) && child.type === 'code'
            ) as React.ReactElement | undefined;

            const isCode = !!codeElement;
            const blockContent = isCode ? codeElement.props.children : children;
            const codeString = extractText(blockContent);
            const className = isCode ? (codeElement?.props.className || '') : '';
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'text';
            const uniqueCodeId = `code-${messageIndex}-${language}-${codeString.substring(0, 10)}`;

            return (
              <div className="not-prose my-6 w-full overflow-hidden rounded-xl border border-white/20 bg-[#1e1e1e] shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
                <div className="flex items-center px-4 py-3 bg-[#2d2d2d]/90 border-b border-black/50 backdrop-blur-md">
                  <div className="flex gap-2 w-16">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-[inset_0_1px_1px_rgba(0,0,0,0.3)]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-[inset_0_1px_1px_rgba(0,0,0,0.3)]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-[inset_0_1px_1px_rgba(0,0,0,0.3)]"></div>
                  </div>
                  
                  <div className="flex-1 text-center">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                      {language === 'text' ? 'CODE' : language}
                    </span>
                  </div>

                  <div className="w-16 flex justify-end">
                    <button 
                      onClick={() => onCopy(codeString, uniqueCodeId)} 
                      className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
                    >
                      {copiedId === uniqueCodeId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {copiedId === uniqueCodeId ? 'COPIED' : 'COPY'}
                    </button>
                  </div>
                </div>
                
                <pre className="custom-scrollbar m-0 p-5 overflow-x-auto text-[13.5px] leading-relaxed">
                  <code className={className} style={{ fontFamily: '"Fira Code", "JetBrains Mono", monospace' }}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          code({ node, inline, className, children, ...props }: any) {
            if (inline) {
              return <code className="bg-white/10 border border-white/5 px-1.5 py-0.5 rounded-md text-[13.5px] font-mono text-blue-200" {...props}>{children}</code>;
            }
            return <code className={className} {...props}>{children}</code>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}