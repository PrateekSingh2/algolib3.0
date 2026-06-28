import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import Prism from 'prismjs';
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-python";

interface TerminalCodeProps {
  code: string;
  language?: string;
}

export default function TerminalCode({ code, language = 'CODE' }: TerminalCodeProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPrismLang = (lang: string) => {
    const l = lang.toLowerCase();
    if (l === 'c++' || l === 'cpp') return 'cpp';
    if (l === 'python' || l === 'py') return 'python';
    if (l === 'java') return 'java';
    if (l === 'c') return 'c';
    if (l === 'javascript' || l === 'js') return 'javascript';
    if (l === 'typescript' || l === 'ts') return 'typescript';
    if (l === 'html') return 'html';
    if (l === 'css') return 'css';
    return 'javascript'; // default fallback for syntax
  };

  return (
    <div className="my-6 rounded-xl overflow-hidden bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-2xl w-full">
      {/* Mac-style Traffic Lights Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="text-xs font-semibold tracking-widest uppercase text-slate-500 dark:text-zinc-400">
          {language}
        </div>
        <button 
          onClick={handleCopy} 
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      
      {/* Code Content */}
      <div className="p-4 overflow-x-auto custom-scrollbar bg-white dark:bg-[#121216]">
        <pre className="text-[14px] font-mono leading-relaxed text-slate-800 dark:text-zinc-300 min-w-full inline-block whitespace-pre-wrap break-words">
          <code ref={codeRef} className={`language-${getPrismLang(language)}`}>{code}</code>
        </pre>
      </div>
    </div>
  );
}