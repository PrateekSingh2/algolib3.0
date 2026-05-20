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
          p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
          
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'text'; 
            const codeString = String(children).replace(/\n$/, '');
            const uniqueCodeId = `code-${messageIndex}-${language}-${codeString.substring(0, 5)}`;

            // --- BLOCK CODE (MacOS Style Restored) ---
            // We check if it's NOT inline, OR if the string contains line breaks (fallback for AI formatting errors)
            if (!inline || codeString.includes('\n')) {
              return (
                <div className="mac-code-block shadow-2xl w-full">
                  <div className="mac-code-header">
                    <div className="mac-traffic-lights">
                      <div className="dot red"></div>
                      <div className="dot yellow"></div>
                      <div className="dot green"></div>
                    </div>
                    <span className="lang-label">{language === 'text' ? 'code' : language}</span>
                    <button 
                      onClick={() => onCopy(codeString, uniqueCodeId)} 
                      className="mac-action-btn"
                    >
                      {copiedId === uniqueCodeId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />} 
                      <span className="hidden sm:inline">
                        {copiedId === uniqueCodeId ? 'Copied' : 'Copy'}
                      </span>
                    </button>
                  </div>
                  {/* custom-scrollbar class ensures horizontal scrolling works flawlessly */}
                  <pre className="custom-scrollbar" style={{ margin: 0 }}>
                    <code {...props}>{codeString}</code>
                  </pre>
                </div>
              );
            }
            
            // --- INLINE CODE (e.g., `let x = 5`) ---
            return (
              <code className="chat-inline-code" {...props}>
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