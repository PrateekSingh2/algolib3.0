import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Terminal, Code2, Loader2 } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Navbar from "@/components/Navbar";

const userTemplates: Record<string, string> = {
  'c++': `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello AlgoLib!\\n";\n    return 0;\n}`,
  'python': `print("Hello AlgoLib!")`,
  'java': `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello AlgoLib!");\n    }\n}`
};

export default function Compiler() {
  const [language, setLanguage] = useState('c++');
  const [code, setCode] = useState(userTemplates['c++']);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLanguageChange = (e: any) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(userTemplates[newLang]);
    setOutput('');
  };

  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput('⚙️ Compiling and running...\n');

    const ENGINE_API_URL = "https://rajawatprateek-algolib-engine.hf.space/execute";

    try {
      const res = await fetch(ENGINE_API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: language,
          code: code,
          input: input
        })
      });

      if (!res.ok) {
        throw new Error(`Execution Engine Error: HTTP ${res.status}`);
      }

      const data = await res.json();
      
      let cleanOutput = (data.output || '').trim();
      if (language === 'java') {
        cleanOutput = cleanOutput.replace(/Main_[a-fA-F0-9]+/g, 'Main');
      }

      if (data.statusCode === 200) {
        setOutput(`✅ Execution Successful\n\n${cleanOutput}`);
      } else {
        setOutput(`❌ Execution Failed\n\n${cleanOutput}`);
      }
    } catch (e: any) {
      setOutput(`❌ System Error: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#050505] text-zinc-300 font-sans flex flex-col overflow-hidden relative">
      <Navbar />

      {/* Spacing for Navbar */}
      <div className="h-20 shrink-0"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 bg-[#09090b] shrink-0 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
            <Code2 size={20} className="text-sky-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Cloud Compiler</h2>
            <p className="text-xs text-zinc-500">Run C++, Java, and Python directly in your browser.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
           <select 
              value={language} 
              onChange={handleLanguageChange} 
              className="bg-[#111] border border-white/10 text-emerald-400 text-sm font-bold outline-none cursor-pointer hover:bg-white/5 px-4 py-2 rounded-lg transition-colors uppercase tracking-widest"
           >
              <option value="c++">C++ 17</option>
              <option value="python">Python 3</option>
              <option value="java">Java 21</option>
           </select>
           
           <button 
             onClick={handleRunCode} 
             disabled={isRunning} 
             className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all"
           >
             {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
             Run Code
           </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <PanelGroup direction={isMobile ? "vertical" : "horizontal"}>
          
          {/* EDITOR PANEL */}
          <Panel defaultSize={60} minSize={30} className="flex flex-col bg-[#050505] border-r border-white/5">
             <div className="flex-1 relative">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={language === 'c++' ? 'cpp' : language}
                  value={code}
                  onChange={(v) => setCode(v || '')}
                  options={{ 
                    minimap: { enabled: false }, 
                    fontSize: isMobile ? 14 : 15, 
                    fontFamily: "'Fira Code', monospace", 
                    padding: { top: 20, bottom: 20 }, 
                    automaticLayout: true 
                  }}
                />
             </div>
          </Panel>

          <PanelResizeHandle className="w-full h-3 md:w-1.5 md:h-full bg-[#0a0a0a] border-y md:border-y-0 md:border-r border-white/5 hover:bg-sky-500/30 transition-colors cursor-row-resize md:cursor-col-resize flex items-center justify-center shrink-0 relative z-10">
             <div className="w-12 h-1 md:h-10 md:w-0.5 bg-zinc-600 rounded-full"></div>
          </PanelResizeHandle>

          {/* I/O PANEL */}
          <Panel minSize={20} className="flex flex-col bg-[#050505]">
             <PanelGroup direction="vertical">
               
               {/* STDIN */}
               <Panel defaultSize={40} minSize={20} className="flex flex-col">
                  <div className="h-10 bg-[#09090b] border-b border-white/5 flex items-center px-4 shrink-0">
                     <span className="text-[11px] font-bold text-zinc-500 tracking-widest uppercase flex gap-2 items-center">
                       <Terminal size={14}/> Custom Input (stdin)
                     </span>
                  </div>
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter input parameters here..."
                    className="flex-1 bg-[#050505] text-zinc-300 font-mono text-[13px] p-4 outline-none resize-none placeholder:text-zinc-700 custom-scrollbar"
                  />
               </Panel>
               
               <PanelResizeHandle className="h-1.5 bg-black hover:bg-sky-500/30 transition-colors cursor-row-resize flex items-center justify-center shrink-0 relative z-10">
                  <div className="w-10 h-0.5 bg-zinc-700 rounded-full"></div>
               </PanelResizeHandle>
               
               {/* STDOUT */}
               <Panel className="flex flex-col" minSize={20}>
                  <div className="h-10 bg-[#09090b] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
                     <span className="text-[11px] font-bold text-zinc-500 tracking-widest uppercase flex gap-2 items-center">
                       <Terminal size={14}/> Output Log
                     </span>
                     {output && (
                       <button onClick={() => setOutput('')} className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-wider">
                         Clear
                       </button>
                     )}
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar p-4 font-mono text-[13px] text-zinc-300 whitespace-pre-wrap bg-[#0a0a0a] shadow-inner">
                     {output || <span className="text-zinc-700 italic">$ Output will appear here...</span>}
                  </div>
               </Panel>

             </PanelGroup>
          </Panel>

        </PanelGroup>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}