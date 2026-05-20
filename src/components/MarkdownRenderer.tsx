import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight'; // Plugin for syntax colors
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css'; // Dark mode theme for colors

interface MarkdownRendererProps {
  content: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  messageIndex: number;
}

export default function MarkdownRenderer({ content, copiedId, onCopy, messageIndex }: MarkdownRendererProps) {
  
  // Helper to extract clean text for the copy button, even from highlighted nodes
  const extractText = (nodes: React.ReactNode): string => {
    if (typeof nodes === 'string' || typeof nodes === 'number') return String(nodes);
    if (Array.isArray(nodes)) return nodes.map(extractText).join('');
    if (React.isValidElement(nodes)) return extractText(nodes.props.children);
    return '';
  };

  return (
    <div className="chat-prose w-full">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          pre({ node, children, ...props }: any) {
            const childArray = React.Children.toArray(children);
            const codeElement = childArray.find(
              (child) => React.isValidElement(child) && child.type === 'code'
            ) as React.ReactElement | undefined;

            const isCode = !!codeElement;
            const content = isCode ? codeElement.props.children : children;
            const codeString = extractText(content);
            const className = isCode ? (codeElement?.props.className || '') : '';
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'text';
            const uniqueCodeId = `code-${messageIndex}-${language}-${codeString.substring(0, 10)}`;

            return (
              <div className="mac-code-block shadow-2xl w-full my-4 overflow-hidden border border-white/10 rounded-xl">
                <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {language === 'text' ? 'code' : language}
                  </span>
                  <button 
                    onClick={() => onCopy(codeString, uniqueCodeId)} 
                    className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    {copiedId === uniqueCodeId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedId === uniqueCodeId ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="custom-scrollbar m-0 p-4 overflow-x-auto bg-[#1e1e1e]">
                  <code className={className} style={{ fontFamily: 'monospace', fontSize: '13.5px' }}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          code({ node, inline, className, children, ...props }: any) {
            if (inline) {
              return <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
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