import React, { useState } from 'react';
import { Layout, GitCommit, Layers, ArrowRightLeft, List, BarChart3, Database } from 'lucide-react';
import LinkedListVisualizer from './LinkedListVisualizer';
import StackVisualizer from './StackVisualizer';
import QueueVisualizer from './QueueVisualizer';
import SortingVisualizer from './SortingVisualizer';
import Navbar from '@/components/Navbar'; // Import the Navbar

const Visualizer = () => {
  const [activeTab, setActiveTab] = useState('ll');

  const MENU = [
    { id: 'll', label: 'Linked Lists', icon: <GitCommit size={18} />, component: <LinkedListVisualizer /> },
    { id: 'stack', label: 'Stack (LIFO)', icon: <Layers size={18} />, component: <StackVisualizer /> },
    { id: 'queue', label: 'Queue (FIFO)', icon: <ArrowRightLeft size={18} />, component: <QueueVisualizer /> },
    { id: 'sorting', label: 'Sorting / Array', icon: <BarChart3 size={18} />, component: <SortingVisualizer /> },
  ];

  return (
    // Changed: flex-col to stack Navbar on top, h-screen for full viewport
    <div className="flex flex-col h-screen w-full bg-neutral-950 text-white font-sans overflow-hidden">
      
      {/* 1. Global Navbar Added Here */}
      <Navbar />

      {/* 2. Main Workspace Container 
          - flex-1: Fills remaining height after Navbar 
          - pt-20: Adds top padding to clear the fixed Navbar (adjust if Navbar height differs)
          - overflow-hidden: Ensures scrollbars appear inside panels, not on the window
      */}
      <div className="flex flex-1 overflow-hidden pt-20">
        
        {/* SIDEBAR */}
        <div className="w-64 border-r border-white/10 bg-neutral-900/50 flex flex-col z-20 shrink-0">
          <div className="p-6 border-b border-white/10">
            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2">
              <Database className="text-blue-400" />
              AlgoLib.VIZ
            </h1>
          </div>
          
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            {MENU.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-white/10 text-[10px] text-neutral-600 font-mono text-center">
            Interactive DS Visualization Engine
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 relative flex flex-col min-w-0">
          {/* Top Bar */}
          <div className="h-16 border-b border-white/5 bg-neutral-900/30 flex items-center px-8 justify-between backdrop-blur-sm shrink-0">
             <span className="text-neutral-500 font-mono text-xs">
               MODE: <span className="text-blue-400 font-bold">{MENU.find(m => m.id === activeTab)?.label.toUpperCase()}</span>
             </span>
          </div>

          {/* Dynamic Component Render */}
          <div className="flex-1 relative overflow-hidden bg-neutral-950">
            {MENU.find(m => m.id === activeTab)?.component}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Visualizer;