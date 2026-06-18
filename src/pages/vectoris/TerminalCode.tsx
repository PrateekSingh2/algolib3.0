import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface TerminalCodeProps {
  code: string;
  language?: string;
}

export default function TerminalCode({ code, language = 'CODE' }: TerminalCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-xl overflow-hidden bg-[#0c0c0e] border border-white/10 shadow-2xl w-full">
      {/* Mac-style Traffic Lights Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
          {language}
        </div>
        <button 
          onClick={handleCopy} 
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      
      {/* Code Content */}
      <div className="p-4 overflow-x-auto custom-scrollbar bg-[#121216]">
        <pre className="text-[14px] font-mono leading-relaxed text-zinc-300 min-w-full inline-block whitespace-pre-wrap break-words">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}