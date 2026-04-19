import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ChevronRight, Search, Menu, X, 
  FileText, Cpu, Network, MessageSquare, 
  ShieldCheck, Zap, Database, Code2, Users, CheckCircle2,
  Lock, Activity, BookOpen, Layers, Trophy
} from "lucide-react";
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AppFooter from '@/components/AppFooter';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Helmet } from 'react-helmet-async'; // <-- Added Helmet Import

// --- MASSIVE KNOWLEDGE BASE ARCHITECTURE ---
const docData = [
  // CATEGORY: OVERVIEW
  {
    id: "introduction",
    category: "Overview",
    icon: <Zap size={18} />,
    title: "Introduction to AlgoLib",
    textContent: "Welcome to AlgoLib Documentation Visualize. Execute. Collaborate. AlgoLib is your centralized workspace to discover, simulate, document, and discuss the world's algorithmic complexity. Master computer science fundamentals through the complete developmental matrix. The Ecosystem Our platform bridges the gap between theoretical computer science and practical software engineering. By combining visual execution with production-ready code, we provide a holistic learning and development environment. Visualize Interact with 60FPS visualizations of Linked Lists, Trees, Graphs, and Sorting arrays. Execute Access 100+ implementations in Python, Java, and C++ with complexity telemetry. Collaborate Join the discussion boards to share architecture, debug logic, and rank up. Initialize the Algorithm Matrix The matrix currently supports a massive library of standard algorithms, including Merge Sort, Binary Search, Depth First Search, Fibonacci Sequence, N-Queens Problem",
    sections: [
      { id: "the-ecosystem", title: "The Ecosystem" },
      { id: "algorithm-matrix", title: "The Algorithm Matrix" }
    ],
    content: (
      <>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20"><Zap className="text-blue-400" size={24} /></div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Visualize. Execute. Collaborate.</h1>
        </div>
        <p className="text-lg text-zinc-400 leading-relaxed mb-10">
          AlgoLib is your centralized workspace to discover, simulate, document, and discuss the world's algorithmic complexity. Master computer science fundamentals through the complete developmental matrix.
        </p>
        
        <h2 id="the-ecosystem" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">The Ecosystem</h2>
        <p className="text-zinc-400 mb-6">Our platform bridges the gap between theoretical computer science and practical software engineering. By combining visual execution with production-ready code, we provide a holistic learning and development environment.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6">
            <Network className="text-sky-400 mb-4" size={24} />
            <h3 className="text-lg font-medium text-white mb-2">Visualize</h3>
            <p className="text-sm text-zinc-400">Interact with 60FPS visualizations of Linked Lists, Trees, Graphs, and Sorting arrays.</p>
          </div>
          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6">
            <Code2 className="text-purple-400 mb-4" size={24} />
            <h3 className="text-lg font-medium text-white mb-2">Execute</h3>
            <p className="text-sm text-zinc-400">Access 100+ implementations in Python, Java, and C++ with complexity telemetry.</p>
          </div>
          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6">
            <MessageSquare className="text-green-400 mb-4" size={24} />
            <h3 className="text-lg font-medium text-white mb-2">Collaborate</h3>
            <p className="text-sm text-zinc-400">Join the discussion boards to share architecture, debug logic, and rank up.</p>
          </div>
        </div>

        <h2 id="algorithm-matrix" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">Initialize the Algorithm Matrix</h2>
        <p className="text-zinc-400 mb-6">The matrix currently supports a massive library of standard algorithms, including but not limited to:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { name: "Merge Sort", desc: "Divide and conquer sorting algorithm", tags: ["Sorting", "Stable"] },
            { name: "Binary Search", desc: "Search algorithm for sorted arrays", tags: ["Searching", "Logarithmic"] },
            { name: "Depth First Search", desc: "Graph traversal exploring branch depth", tags: ["Graphs", "Recursion"] },
            { name: "Fibonacci Sequence", desc: "Classic DP with memoization", tags: ["Dynamic Programming"] },
            { name: "N-Queens Problem", desc: "Place N queens safely on an NxN board", tags: ["Backtracking"] }
          ].map(alg => (
            <div key={alg.name} className="bg-[#080808] border border-white/[0.05] p-5 rounded-xl">
              <h4 className="text-white font-medium mb-1">{alg.name}</h4>
              <p className="text-xs text-zinc-500 mb-3">{alg.desc}</p>
              <div className="flex gap-2">
                {alg.tags.map(tag => <span key={tag} className="text-[10px] bg-white/[0.03] border border-white/[0.05] text-zinc-400 px-2 py-0.5 rounded-full">{tag}</span>)}
              </div>
            </div>
          ))}
        </div>
      </>
    )
  },

  // CATEGORY: COMPETITIVE ARENA
  {
    id: "competitive-arena",
    category: "Competitive Arena",
    icon: <Trophy size={18} />,
    title: "Contests & Leaderboards",
    textContent: "The Competitive Arena AlgoLib provides a fully-featured competitive programming environment modeled after industry standards like Codeforces and CodeChef. Compete in real-time, solve multi-tier algorithmic challenges, and climb the global leaderboard. Arena Overview Contests are time-bound events containing multiple algorithmic problems. When an event goes Live, the arena unlocks, and your execution timer begins. Multi-Tier Problems Contests feature multiple problems (e.g., Problem A, Problem B, Problem C) categorized by difficulty. Easy, Medium, and Hard. Seamlessly switch between problems using the tabbed navigation. Your code is safely cached locally per-user, per-problem and per-language so you never lose progress if you switch tabs or accidentally close the browser. Evaluation Engine The engine supports standard input/output execution. Markdown Explanations: Test cases feature rich markdown explanations to clearly articulate outputs. Multiple Correct Answers: If a problem has multiple valid solutions, the engine dynamically checks your output against all acceptable answers. Hidden Test Cases: Certain edge cases are hidden to verify your logic's absolute correctness without hardcoding. Scoring & Penalty System Our rating system rewards speed and accuracy. Points: Easy (100 pts), Medium (200 pts), Hard (300 pts). Penalties: Incorrect submissions log a penalty and deduct points from the problem's potential score (-5 for Easy, -10 for Medium, -20 for Hard). Time Tracking: Your execution time is tracked precisely from the exact start of the contest and formatted into HH:MM:SS. Leaderboard Mechanics The global leaderboard updates in real-time. Rankings are determined first by Total Score (descending) and then by Cumulative Time Taken (ascending). Only your first successful submission per problem locks in your score and time, preventing leaderboard manipulation. Practice Mode Once the contest deadline hits, the arena is sealed automatically. Submissions no longer affect the leaderboard. However, you can enter Practice Mode to freely run code against public test cases, view expected outputs, and learn at your own pace without pressure.",
    sections: [
      { id: "arena-overview", title: "Arena Overview" },
      { id: "evaluation-engine", title: "Evaluation Engine" },
      { id: "scoring-penalties", title: "Scoring & Penalties" },
      { id: "leaderboard-mechanics", title: "Leaderboard Mechanics" },
      { id: "practice-mode", title: "Practice Mode" }
    ],
    content: (
      <>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20"><Trophy className="text-amber-400" size={24} /></div>
          <h1 className="text-4xl font-bold tracking-tight text-white">The Competitive Arena</h1>
        </div>
        <p className="text-lg text-zinc-400 leading-relaxed mb-10">
          AlgoLib provides a fully-featured competitive programming environment modeled after industry standards. Compete in real-time, solve multi-tier algorithmic challenges, and climb the global leaderboard.
        </p>

        <h2 id="arena-overview" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">Arena Overview & Multi-Tier Problems</h2>
        <p className="text-zinc-400 mb-6">Contests are time-bound events containing multiple algorithmic problems. When an event goes Live, the arena unlocks, and your execution timer begins.</p>
        <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6 mb-10">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2"><Layers size={18} className="text-sky-400"/> Problem Navigation & Caching</h3>
          <p className="text-sm text-zinc-400 mb-4">Contests feature multiple problems (e.g., Problem A, Problem B, Problem C) categorized by difficulty. Seamlessly switch between problems using the top-bar tab navigation.</p>
          <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl flex items-start gap-3">
             <Database size={18} className="text-sky-400 mt-0.5 shrink-0" />
             <p className="text-xs text-sky-200"><strong>Secure Local Persistence:</strong> Your code is securely cached in your local browser storage per-user, per-problem, and per-language. If you accidentally close the tab, switch questions, or refresh the page, your exact code state will be restored automatically.</p>
          </div>
        </div>

        <h2 id="evaluation-engine" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">The Evaluation Engine</h2>
        <p className="text-zinc-400 mb-6">Our execution engine evaluates code against rigid test cases, supporting standard input/output formats.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
           <div className="bg-[#050505] border border-white/[0.05] p-5 rounded-xl">
            <h4 className="text-white font-bold mb-1">Markdown Parsing</h4>
            <p className="text-xs text-zinc-400">Problem descriptions and test case explanations natively render Markdown. Expected outputs format cleanly with proper line breaks to prevent confusion on matrix/array problems.</p>
          </div>
          <div className="bg-[#050505] border border-white/[0.05] p-5 rounded-xl">
            <h4 className="text-white font-bold mb-1">Multiple Valid Answers</h4>
            <p className="text-xs text-zinc-400">If an algorithmic problem permits multiple correct configurations, the engine dynamically cross-references your output against all acceptable solutions.</p>
          </div>
          <div className="bg-[#050505] border border-white/[0.05] p-5 rounded-xl">
            <h4 className="text-white font-bold mb-1">Hidden Edge Cases</h4>
            <p className="text-xs text-zinc-400">Certain test cases run silently during submission to verify the absolute correctness of your underlying logic and prevent hardcoded answers.</p>
          </div>
        </div>

        <h2 id="scoring-penalties" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">Scoring & Penalty System</h2>
        <p className="text-zinc-400 mb-6">Our evaluation matrix calculates your performance based on accuracy, difficulty, and speed. Submitting failing code results in permanent score reductions for that specific problem.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-[#050505] border border-white/[0.05] p-5 rounded-xl border-t-2 border-t-emerald-500">
            <h4 className="text-white font-bold mb-1">Easy Problems</h4>
            <p className="text-2xl font-mono text-emerald-400 mb-2">100 <span className="text-xs text-zinc-500 uppercase tracking-widest">PTS</span></p>
            <p className="text-xs text-zinc-400"><strong className="text-red-400">-5 pts</strong> per wrong submission.</p>
          </div>
          <div className="bg-[#050505] border border-white/[0.05] p-5 rounded-xl border-t-2 border-t-amber-500">
            <h4 className="text-white font-bold mb-1">Medium Problems</h4>
            <p className="text-2xl font-mono text-amber-400 mb-2">200 <span className="text-xs text-zinc-500 uppercase tracking-widest">PTS</span></p>
            <p className="text-xs text-zinc-400"><strong className="text-red-400">-10 pts</strong> per wrong submission.</p>
          </div>
          <div className="bg-[#050505] border border-white/[0.05] p-5 rounded-xl border-t-2 border-t-red-500">
            <h4 className="text-white font-bold mb-1">Hard Problems</h4>
            <p className="text-2xl font-mono text-red-500 mb-2">300 <span className="text-xs text-zinc-500 uppercase tracking-widest">PTS</span></p>
            <p className="text-xs text-zinc-400"><strong className="text-red-400">-20 pts</strong> per wrong submission.</p>
          </div>
        </div>

        <h2 id="leaderboard-mechanics" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">Leaderboard Mechanics</h2>
        <ul className="space-y-4 mb-10">
          <li className="flex items-start gap-4 bg-[#0A0A0A] border border-white/[0.05] p-5 rounded-xl">
            <Activity className="text-sky-500 mt-0.5 shrink-0" size={20} />
            <div>
              <strong className="text-white block mb-1">Real-Time Sync & Sorting</strong>
              <span className="text-sm text-zinc-400">The global leaderboard updates instantly. Rankings are determined first by <strong>Total Score</strong> (descending), and tie-breakers are decided by <strong>Cumulative Time Taken</strong> (ascending). Your elapsed time is accurately converted into a strict `HH:MM:SS` format.</span>
            </div>
          </li>
          <li className="flex items-start gap-4 bg-[#0A0A0A] border border-white/[0.05] p-5 rounded-xl">
            <Lock className="text-purple-500 mt-0.5 shrink-0" size={20} />
            <div>
              <strong className="text-white block mb-1">Score & Time Locking (Deduplication)</strong>
              <span className="text-sm text-zinc-400">The exact millisecond you successfully solve a problem, your score and precise execution time are permanently locked. Subsequent successful submissions for the same problem will not artificially inflate your score or overwrite your true solve time.</span>
            </div>
          </li>
        </ul>

        <h2 id="practice-mode" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">Practice Mode & Arena Sealing</h2>
        <p className="text-zinc-400 mb-6">The instant the contest deadline hits <code className="text-red-400 bg-red-400/10 px-1 rounded">00:00:00</code>, the arena is automatically sealed.</p>
        <div className="bg-zinc-900/50 border border-white/[0.05] p-6 rounded-2xl flex flex-col gap-3">
             <h4 className="text-white font-medium flex items-center gap-2"><Lock size={16} className="text-zinc-500"/> Post-Contest Practice</h4>
             <p className="text-sm text-zinc-400 leading-relaxed">You can still enter ended contests in Practice Mode. While any attempt to <strong>Submit</strong> code will be intercepted and rejected from the global leaderboard, you can freely use the <strong>Run Code</strong> execution suite to test logic, view expected outputs, and learn at your own pace without pressure.</p>
        </div>
      </>
    )
  },

  // CATEGORY: ENGINE & PLATFORM
  {
    id: "algoviz-engine",
    category: "Engine & Platform",
    icon: <Cpu size={18} />,
    title: "AlgoViz Simulator Engine",
    textContent: "AlgoViz Simulator Engine Simulator Engine Overview The AlgoViz Simulator is a proprietary 60FPS rendering engine designed to map complex data structures in real-time. It exposes pointer mathematics, memory addresses, and indexing directly in the HUD. Supported Topologies LINKED_LIST Supports Singly, Doubly, Circular, and Doubly Circular variations. Features visual insertion/deletion at specific targets with live pointer rerouting (e.g., Node 0x1A linking to 0x2B). STACK_LIFO & QUEUE_FIFO Linear memory constraints. Visualize push/pop and enqueue/dequeue operations with strict boundary and overflow detection. BINARY_TREE Root, leaf, and edge rendering with DFS/BFS traversal highlighting. GRAPH_NET Node-to-node mapping with weighted/unweighted edge rendering for pathfinding. Execution Controls The system maintains state deterministically. You control the flow of time within the simulator: Step Engine (Manual) Granular control. Use PREV and NEXT to increment the algorithm's state machine frame by frame. Ideal for debugging edge cases. Autoplay Uninterrupted execution. The engine calculates the entire state matrix and plays back the animation at a hardware-accelerated framerate.",
    sections: [
      { id: "engine-overview", title: "Engine Overview" },
      { id: "supported-structures", title: "Supported Structures" },
      { id: "execution-controls", title: "Execution Controls" }
    ],
    content: (
      <>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20"><Cpu className="text-teal-400" size={24} /></div>
          <h1 className="text-4xl font-bold tracking-tight text-white">AlgoViz Simulator</h1>
        </div>
        <p className="text-lg text-zinc-400 leading-relaxed mb-10">
          The AlgoViz Simulator is a proprietary 60FPS rendering engine designed to map complex data structures in real-time. It exposes pointer mathematics, memory addresses, and indexing directly in the HUD.
        </p>

        <h2 id="supported-structures" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">Supported Topologies</h2>
        <div className="space-y-4 mb-10">
          <div className="bg-[#050505] border border-white/[0.05] p-5 rounded-xl flex items-start gap-4">
            <Network className="text-teal-400 mt-1 shrink-0" size={20} />
            <div>
              <h4 className="text-white font-medium mb-1">LINKED_LIST</h4>
              <p className="text-sm text-zinc-400">Supports Singly, Doubly, Circular, and Doubly Circular variations. Features visual insertion/deletion at specific targets with live pointer rerouting (e.g., Node 0x1A linking to 0x2B).</p>
            </div>
          </div>
          <div className="bg-[#050505] border border-white/[0.05] p-5 rounded-xl flex items-start gap-4">
            <Database className="text-orange-400 mt-1 shrink-0" size={20} />
            <div>
              <h4 className="text-white font-medium mb-1">STACK_LIFO & QUEUE_FIFO</h4>
              <p className="text-sm text-zinc-400">Linear memory constraints. Visualize push/pop and enqueue/dequeue operations with strict boundary and overflow detection.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#050505] border border-white/[0.05] p-5 rounded-xl">
              <h4 className="text-white font-medium mb-1">BINARY_TREE</h4>
              <p className="text-sm text-zinc-500">Root, leaf, and edge rendering with DFS/BFS traversal highlighting.</p>
            </div>
            <div className="bg-[#050505] border border-white/[0.05] p-5 rounded-xl">
              <h4 className="text-white font-medium mb-1">GRAPH_NET</h4>
              <p className="text-sm text-zinc-500">Node-to-node mapping with weighted/unweighted edge rendering for pathfinding.</p>
            </div>
          </div>
        </div>

        <h2 id="execution-controls" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">Execution Controls</h2>
        <p className="text-zinc-400 mb-6">The system maintains state deterministically. You control the flow of time within the simulator:</p>
        <div className="bg-[#0A0A0A] border border-white/[0.1] rounded-2xl p-6">
          <div className="mb-6">
            <h4 className="text-sky-400 font-medium mb-2 flex items-center gap-2"><CheckCircle2 size={16} /> Step Engine (Manual)</h4>
            <p className="text-sm text-zinc-400">Granular control. Use <kbd className="bg-white/[0.05] px-2 py-0.5 rounded text-white">PREV</kbd> and <kbd className="bg-white/[0.05] px-2 py-0.5 rounded text-white">NEXT</kbd> to increment the algorithm's state machine frame by frame. Ideal for debugging edge cases.</p>
          </div>
          <div>
            <h4 className="text-green-400 font-medium mb-2 flex items-center gap-2"><CheckCircle2 size={16} /> Autoplay</h4>
            <p className="text-sm text-zinc-400">Uninterrupted execution. The engine calculates the entire state matrix and plays back the animation at a hardware-accelerated framerate.</p>
          </div>
        </div>
      </>
    )
  },

  // CATEGORY: LEARNING RESOURCES
  {
    id: "tech-notes",
    category: "Learning Resources",
    icon: <BookOpen size={18} />,
    title: "Tech Notes Hub",
    textContent: "Tech Notes Hub Learning Resources The AlgoLib Tech Notes Hub is a carefully curated, production-grade library of computer science documentation. We provide comprehensive notes designed to bridge the gap between academic theory and practical software engineering. Note Categories Core Data Structures & Algorithms: In-depth breakdowns of algorithmic complexity (Big O), sorting mechanisms, and memory allocation. System Design & Architecture: Primers on scalability, database indexing, caching strategies, and load balancing. Language-Specific Syntaxes: Nuanced differences, modern features, and memory management in C++, Java, and Python. Quality Standards Peer-Reviewed Accuracy: Every note in our hub undergoes rigorous review by our lead developers to ensure technical precision. Visual Integration: Wherever possible, theoretical concepts are directly linked to the AlgoViz simulator for interactive demonstration. Distraction-Free Layout: Clean, dark-mode optimized typography designed strictly for reading comprehension.",
    sections: [
      { id: "hub-overview", title: "Hub Overview" },
      { id: "note-categories", title: "Note Categories" },
      { id: "quality-standards", title: "Quality Standards" }
    ],
    content: (
      <>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20"><BookOpen className="text-indigo-400" size={24} /></div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Tech Notes Hub</h1>
        </div>
        <p className="text-lg text-zinc-400 leading-relaxed mb-10">
          The AlgoLib Tech Notes Hub is a carefully curated, production-grade library of computer science documentation. We provide comprehensive notes designed to bridge the gap between academic theory and practical software engineering.
        </p>

        <h2 id="note-categories" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">Note Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6">
            <Layers className="text-sky-400 mb-4" size={24} />
            <h3 className="text-white font-medium mb-2">Core DSA</h3>
            <p className="text-sm text-zinc-400">In-depth breakdowns of algorithmic complexity (Big O), sorting mechanisms, and memory allocation.</p>
          </div>
          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6">
            <Network className="text-purple-400 mb-4" size={24} />
            <h3 className="text-white font-medium mb-2">System Design</h3>
            <p className="text-sm text-zinc-400">Primers on scalability, database indexing, caching strategies, and load balancing.</p>
          </div>
          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6">
            <Code2 className="text-green-400 mb-4" size={24} />
            <h3 className="text-white font-medium mb-2">Language Syntaxes</h3>
            <p className="text-sm text-zinc-400">Nuanced differences, modern features, and memory management in C++, Java, and Python.</p>
          </div>
        </div>

        <h2 id="quality-standards" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">Quality Standards</h2>
        <ul className="space-y-4">
          <li className="flex items-start gap-4 bg-[#0A0A0A] border border-white/[0.05] p-5 rounded-xl">
            <ShieldCheck className="text-green-500 mt-0.5 shrink-0" size={20} />
            <div>
              <strong className="text-white block mb-1">Peer-Reviewed Accuracy</strong>
              <span className="text-sm text-zinc-400">Every note in our hub undergoes rigorous review by our lead developers to ensure technical precision and relevance.</span>
            </div>
          </li>
          <li className="flex items-start gap-4 bg-[#0A0A0A] border border-white/[0.05] p-5 rounded-xl">
            <Zap className="text-yellow-500 mt-0.5 shrink-0" size={20} />
            <div>
              <strong className="text-white block mb-1">Visual Integration</strong>
              <span className="text-sm text-zinc-400">Wherever possible, theoretical concepts are directly linked to the AlgoViz simulator for interactive demonstration rather than abstract explanation.</span>
            </div>
          </li>
        </ul>
      </>
    )
  },

  // CATEGORY: COMMUNITY & TEAM
  {
    id: "community-discussions",
    category: "Community & Team",
    icon: <MessageSquare size={18} />,
    title: "Community Discussions",
    textContent: "Community Matrix Discussions Ask questions, share architecture, and collaborate with the community. Our discussion board is the central hub for algorithmic discourse and platform updates. The Discussion Hub The Community page allows verified users to start threads, upvote solutions, and track release notes. All code snippets shared in discussions feature built-in syntax highlighting. Top Contributors (MVP System) We actively monitor system engagement. Users who consistently provide high-quality architectural solutions, debug logic, or share optimized algorithms are ranked in the Top Contributors board.",
    sections: [
      { id: "discussion-hub", title: "Discussion Hub" },
      { id: "top-contributors", title: "Top Contributors (MVP)" }
    ],
    content: (
      <>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20"><MessageSquare className="text-orange-400" size={24} /></div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Community Matrix</h1>
        </div>
        <p className="text-lg text-zinc-400 leading-relaxed mb-10">
          Ask questions, share architecture, and collaborate with the community. Our discussion board is the central hub for algorithmic discourse and platform updates.
        </p>

        <h2 id="discussion-hub" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">The Discussion Hub</h2>
        <p className="text-zinc-400 mb-6">The Community page allows verified users to start threads, upvote solutions, and track release notes. All code snippets shared in discussions feature built-in syntax highlighting.</p>

        <h2 id="top-contributors" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">Top Contributors (MVP System)</h2>
        <p className="text-zinc-400 mb-6">We actively monitor system engagement. Users who consistently provide high-quality architectural solutions, debug logic, or share optimized algorithms are ranked in the <strong className="text-yellow-400">Top Contributors</strong> board.</p>
      </>
    )
  },
  {
    id: "visionaries",
    category: "Community & Team",
    icon: <Users size={18} />,
    title: "The Architecture Crew",
    textContent: "Meet the Visionaries The Architecture Crew The elite synergy of engineering, testing, and creative talent powering the ultimate visualization matrix. Prateek Singh LEAD DEVELOPER Architect of the visualization engine and core system design, blending algorithmic precision with seamless user experience. Shivansh Sahu CO-DEVELOPER LEAD Co-architect of the visualization engine, specializing in performance optimization and cross-platform compatibility. Shiva Agrawal UI & TESTING LEAD Guardian of user experience and interface design, ensuring every pixel and interaction is polished to perfection. Raushan Gupta PR & SOCIAL LEAD Driving the narrative and community engagement around our technology to grow our audience. Sarvagya Singhai PR & SOCIAL LEAD Strategic communicator and community builder, amplifying our message across digital channels.",
    sections: [{ id: "the-team", title: "Meet the Visionaries" }],
    content: (
      <>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10"><Users className="text-white" size={24} /></div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Meet the Visionaries</h1>
        </div>
        <p className="text-lg text-zinc-400 leading-relaxed mb-10 text-center">
          The elite synergy of engineering, testing, and creative talent powering the ultimate visualization matrix.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" id="the-team">
          {[
            { name: "Prateek Singh", role: "LEAD DEVELOPER", desc: "Architect of the visualization engine and core system design, blending algorithmic precision with seamless user experience.", imgUrl: "https://ik.imagekit.io/g7e4hyclo/photo.jpg" },
            { name: "Shivansh Sahu", role: "CO-DEVELOPER LEAD", desc: "Co-architect of the visualization engine, specializing in performance optimization and cross-platform compatibility.", imgUrl: "https://ik.imagekit.io/g7e4hyclo/co-photo.jpg" },
            { name: "Shiva Agrawal", role: "UI & TESTING LEAD", desc: "Guardian of user experience and interface design, ensuring every pixel and interaction is polished to perfection.", imgUrl: "https://ik.imagekit.io/g7e4hyclo/WhatsApp%20Image%202026-02-13%20at%204.09.05%20PM.jpeg" }
          ].map(member => (
            <div key={member.name} className="bg-[#050505] border border-white/[0.05] rounded-3xl p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-white/10 mb-4 overflow-hidden">
                <img src={member.imgUrl} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 border border-white/[0.05] bg-white/[0.02] px-2 py-1 rounded-md mb-4 uppercase">{member.role}</span>
              <p className="text-xs text-zinc-400 leading-relaxed">{member.desc}</p>
            </div>
          ))}
          <div className="lg:col-span-3 flex flex-col md:flex-row justify-center gap-6">
             {[
               { name: "Raushan Gupta", role: "PR & SOCIAL LEAD", desc: "Driving the narrative and community engagement around our technology to grow our audience.", imgUrl: "https://ik.imagekit.io/g7e4hyclo/WhatsApp%20Image%202026-03-14%20at%2010.27.45%20PM.jpeg" },
               { name: "Sarvagya Singhai", role: "PR & SOCIAL LEAD", desc: "Strategic communicator and community builder, amplifying our message across digital channels.", imgUrl: "https://ik.imagekit.io/g7e4hyclo/sarv.jpeg" }
             ].map(member => (
              <div key={member.name} className="bg-[#050505] border border-white/[0.05] rounded-3xl p-8 flex flex-col items-center text-center w-full md:w-[350px]">
                <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-white/10 mb-4 overflow-hidden">
                  <img src={member.imgUrl} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 border border-white/[0.05] bg-white/[0.02] px-2 py-1 rounded-md mb-4 uppercase">{member.role}</span>
                <p className="text-xs text-zinc-400 leading-relaxed">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  },

  // CATEGORY: LEGAL & POLICIES
  {
    id: "terms",
    category: "Legal Framework",
    icon: <BookOpen size={18} />,
    title: "Terms of Service",
    textContent: "Terms of Service Effective Date: March 2026 01 Acceptance of Terms By accessing and using AlgoLib (the Platform), you explicitly agree to be bound by these Terms of Service. If you do not agree to these terms, you must immediately cease use of our services. 02 User Accounts & Authentication To access the core engine (Visualizer) and developer hub, you must authenticate using a verified Google account. As a user, you are solely responsible for: Maintaining the strict confidentiality of your login credentials. All activities, code submissions, and posts that occur under your account. Ensuring your profile information complies with our community architecture guidelines. 03 Acceptable Use Policy You agree not to misuse the Platform infrastructure. Strictly prohibited activities include, but are not limited to: Security Bypassing Attempting to bypass our authentication guards or Row Level Security (RLS). Data Scraping Mining or extracting data from the algorithm library without explicit API permission. Malicious Content Posting spam, malicious code, or abusive content in the Community hub.",
    sections: [
      { id: "acceptance", title: "01. Acceptance of Terms" },
      { id: "accounts", title: "02. User Accounts" },
      { id: "acceptable-use", title: "03. Acceptable Use" }
    ],
    content: (
      <>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-white">Terms of Service</h1>
        </div>
        <div className="mb-10 text-xs font-mono text-zinc-500 uppercase tracking-widest">Effective Date: March 2026</div>

        <div className="space-y-12">
          <div>
            <h2 id="acceptance" className="text-xl font-semibold text-white mb-4 flex items-center gap-3"><span className="text-zinc-600 font-mono text-sm">01</span> Acceptance of Terms</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">By accessing and using AlgoLib ("the Platform"), you explicitly agree to be bound by these Terms of Service. If you do not agree to these terms, you must immediately cease use of our services.</p>
          </div>
          
          <div>
            <h2 id="accounts" className="text-xl font-semibold text-white mb-4 flex items-center gap-3"><span className="text-zinc-600 font-mono text-sm">02</span> User Accounts & Authentication</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">To access the core engine (Visualizer) and developer hub, you must authenticate using a verified Google account. As a user, you are solely responsible for:</p>
            <ul className="list-none space-y-2 text-sm text-zinc-400 pl-4 border-l border-white/[0.05]">
              <li className="flex items-start gap-2"><ChevronRight size={14} className="text-sky-500 mt-1 shrink-0" /> Maintaining the strict confidentiality of your login credentials.</li>
              <li className="flex items-start gap-2"><ChevronRight size={14} className="text-sky-500 mt-1 shrink-0" /> All activities, code submissions, and posts that occur under your account.</li>
              <li className="flex items-start gap-2"><ChevronRight size={14} className="text-sky-500 mt-1 shrink-0" /> Ensuring your profile information complies with our community architecture guidelines.</li>
            </ul>
          </div>

          <div>
            <h2 id="acceptable-use" className="text-xl font-semibold text-white mb-4 flex items-center gap-3"><span className="text-zinc-600 font-mono text-sm">03</span> Acceptable Use Policy</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">You agree not to misuse the Platform infrastructure. Strictly prohibited activities include, but are not limited to:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#050505] border border-white/[0.05] p-5 rounded-xl">
                <h4 className="text-red-400 font-medium mb-2">Security Bypassing</h4>
                <p className="text-xs text-zinc-500">Attempting to bypass our authentication guards or Row Level Security (RLS).</p>
              </div>
              <div className="bg-[#050505] border border-white/[0.05] p-5 rounded-xl">
                <h4 className="text-red-400 font-medium mb-2">Data Scraping</h4>
                <p className="text-xs text-zinc-500">Mining or extracting data from the algorithm library without explicit API permission.</p>
              </div>
              <div className="bg-[#050505] border border-white/[0.05] p-5 rounded-xl md:col-span-2">
                <h4 className="text-red-400 font-medium mb-2">Malicious Content</h4>
                <p className="text-xs text-zinc-500">Posting spam, malicious code, or abusive content in the Community hub.</p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  },
  {
    id: "privacy",
    category: "Legal Framework",
    icon: <Lock size={18} />,
    title: "Privacy Policy",
    textContent: "Privacy Policy At AlgoLib, we believe in minimal data collection. When you interact with our engine, we only store what is absolutely necessary to render your developer profile and maintain system security. 1. Data Extraction & Collection When you authenticate via Google Auth, we securely ingest the following data points to construct your identity: Identity: Name, Email, and Avatar URI. Telemetry: Interactions with visualizers to monitor engine performance. 2. Infrastructure & Security Your data is vaulted using enterprise-grade infrastructure. We utilize Firebase Authentication for identity resolution and Supabase (PostgreSQL) for state management. Rigorous Row Level Security (RLS) policies guarantee that your private parameters remain entirely inaccessible to unauthorized queries. 3. Profile Visibility Your workspace is private by default. However, explicit public fields configured in your settings (such as your display name, GitHub alias, and bio) will be rendered publicly when you participate in the Community architecture hub. Zero Third-Party Sales We do not sell, distribute, or monetize your personal telemetry. Data is shared exclusively with necessary infrastructure providers. Right to Erasure You retain full root access to your existence on our platform. Request complete deletion of your records via your settings panel.",
    sections: [
      { id: "data-extraction", title: "1. Data Extraction" },
      { id: "infrastructure", title: "2. Infrastructure" },
      { id: "visibility", title: "3. Profile Visibility" }
    ],
    content: (
      <>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-white">Privacy Policy</h1>
        </div>
        <p className="text-lg text-zinc-400 leading-relaxed mb-10">
          At AlgoLib, we believe in minimal data collection. When you interact with our engine, we only store what is absolutely necessary to render your developer profile and maintain system security.
        </p>

        <div className="space-y-6">
          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6 md:p-8">
            <h3 id="data-extraction" className="text-xl font-semibold text-white mb-4 flex items-center gap-3"><Database size={20} className="text-zinc-500" /> 1. Data Extraction & Collection</h3>
            <p className="text-sm text-zinc-400 mb-4">When you authenticate via Google Auth, we securely ingest the following data points to construct your identity:</p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> <strong className="text-white">Identity:</strong> Name, Email, and Avatar URI.</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> <strong className="text-white">Telemetry:</strong> Interactions with visualizers to monitor engine performance.</li>
            </ul>
          </div>

          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6 md:p-8">
            <h3 id="infrastructure" className="text-xl font-semibold text-white mb-4 flex items-center gap-3"><ShieldCheck size={20} className="text-zinc-500" /> 2. Infrastructure & Security</h3>
            <p className="text-sm text-zinc-400 mb-4">Your data is vaulted using enterprise-grade infrastructure. We utilize <strong className="text-white">Firebase Authentication</strong> for identity resolution and <strong className="text-white">Supabase (PostgreSQL)</strong> for state management.</p>
            <p className="text-sm text-zinc-400">Rigorous Row Level Security (RLS) policies guarantee that your private parameters remain entirely inaccessible to unauthorized queries.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6 md:p-8 md:col-span-2">
              <h3 id="visibility" className="text-xl font-semibold text-white mb-4 flex items-center gap-3"><Activity size={20} className="text-zinc-500" /> 3. Profile Visibility</h3>
              <p className="text-sm text-zinc-400">Your workspace is private by default. However, explicit public fields configured in your settings (such as your display name, GitHub alias, and bio) will be rendered publicly when you participate in the Community architecture hub.</p>
            </div>
            
            <div className="border border-white/[0.05] rounded-xl p-5">
              <Lock size={18} className="text-zinc-500 mb-3" />
              <h4 className="text-white font-medium mb-1 text-sm">Zero Third-Party Sales</h4>
              <p className="text-xs text-zinc-500">We do not sell, distribute, or monetize your personal telemetry. Data is shared exclusively with necessary infrastructure providers.</p>
            </div>
            
            <div className="border border-white/[0.05] rounded-xl p-5">
              <X size={18} className="text-zinc-500 mb-3" />
              <h4 className="text-white font-medium mb-1 text-sm">Right to Erasure</h4>
              <p className="text-xs text-zinc-500">You retain full root access to your existence on our platform. Request complete deletion of your records via your settings panel.</p>
            </div>
          </div>
        </div>
      </>
    )
  },
  {
    id: "cookies",
    category: "Legal Framework",
    icon: <Database size={18} />,
    title: "Cookie Policy",
    textContent: "Cookie Policy To maintain state across the AlgoLib engine and ensure seamless authentication, we utilize small local payloads (cookies and localStorage). Here is exactly what we store and why. Strictly Necessary REQUIRED These are cryptographic tokens generated by Firebase Authentication. They are non-negotiable for the platform to function, ensuring that your connection to the developer hub remains secure and authenticated. Functional State LOCALSTORAGE We leverage browser localStorage to cache your interface preferences. For example, this remembers if you have already dismissed the Visualizer Welcome Modal, bypassing redundant prompts on subsequent boots. Performance Telemetry ANALYTICS Anonymous, aggregated tracking payloads used to measure engine frame drops, route interactions, and general traffic, allowing us to continuously optimize the platform's architecture. Managing Your Preferences You maintain full control over your local data via your browser's dev tools or settings. However, executing a strict block on essential cookies will instantly break the authentication handshake, locking you out of the Visualizer and Community networks.",
    sections: [
      { id: "payloads", title: "Local Payloads" },
      { id: "management", title: "Management" }
    ],
    content: (
      <>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-white">Cookie Policy</h1>
        </div>
        <p className="text-lg text-zinc-400 leading-relaxed mb-10">
          To maintain state across the AlgoLib engine and ensure seamless authentication, we utilize small local payloads (cookies and localStorage). Here is exactly what we store and why.
        </p>

        <div className="space-y-4" id="payloads">
          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6 flex items-start gap-4">
            <div className="p-2 bg-white/[0.02] border border-white/[0.05] rounded-lg shrink-0"><Lock size={20} className="text-zinc-400" /></div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-white font-semibold">Strictly Necessary</h3>
                <span className="text-[10px] font-mono text-red-400 border border-red-500/20 bg-red-500/10 px-2 py-0.5 rounded">REQUIRED</span>
              </div>
              <p className="text-sm text-zinc-400">These are cryptographic tokens generated by Firebase Authentication. They are non-negotiable for the platform to function, ensuring that your connection to the developer hub remains secure and authenticated.</p>
            </div>
          </div>

          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6 flex items-start gap-4">
            <div className="p-2 bg-white/[0.02] border border-white/[0.05] rounded-lg shrink-0"><Database size={20} className="text-zinc-400" /></div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-white font-semibold">Functional State</h3>
                <span className="text-[10px] font-mono text-zinc-400 border border-white/[0.1] bg-white/[0.02] px-2 py-0.5 rounded">LOCALSTORAGE</span>
              </div>
              <p className="text-sm text-zinc-400">We leverage browser <code className="text-sky-400 bg-sky-400/10 px-1 py-0.5 rounded text-xs font-mono">localStorage</code> to cache your interface preferences. For example, this remembers if you have already dismissed the Visualizer Welcome Modal, bypassing redundant prompts on subsequent boots.</p>
            </div>
          </div>

          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6 flex items-start gap-4">
            <div className="p-2 bg-white/[0.02] border border-white/[0.05] rounded-lg shrink-0"><Activity size={20} className="text-zinc-400" /></div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-white font-semibold">Performance Telemetry</h3>
                <span className="text-[10px] font-mono text-sky-400 border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 rounded">ANALYTICS</span>
              </div>
              <p className="text-sm text-zinc-400">Anonymous, aggregated tracking payloads used to measure engine frame drops, route interactions, and general traffic, allowing us to continuously optimize the platform's architecture.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border border-white/[0.05] rounded-2xl p-6" id="management">
          <h3 className="text-white font-semibold mb-2">Managing Your Preferences</h3>
          <p className="text-sm text-zinc-400">You maintain full control over your local data via your browser's dev tools or settings. However, executing a strict block on essential cookies will instantly break the authentication handshake, locking you out of the Visualizer and Community networks.</p>
        </div>
      </>
    )
  },
  // CATEGORY: QUICK START
  {
    id: "quick-start",
    category: "Getting Started",
    icon: <Zap size={18} />,
    title: "Quick Start Guide",
    textContent: "Getting Started Quick Start Guide Ready to dive into the matrix? Here is exactly how to initialize your workspace, run your first algorithmic visualization, and compete. Step 1: Authentication Before accessing the Visualizer Engine, you must sync your profile. Click Get Started in the top right. Authenticate securely via Google. Wait for the engine to initialize your personal workspace cache. Step 2: Running a Visualization Navigate to the Visualizer Hub. Select a topology, for example, Singly Linked List. Use the HUD Controls to inject nodes, delete pointers, or step through algorithms. Watch the live memory mapping react in real-time. Step 3: Executing Code Want to run Python, Java or C++? Head over to the Multi-Language Compiler. Write or paste your logic. Hit Compile & Execute to stream the standard output directly back into the browser. No local setup required.",
    sections: [
      { id: "authentication", title: "Step 1: Authentication" },
      { id: "visualization", title: "Step 2: Visualization" },
      { id: "execution", title: "Step 3: Code Execution" }
    ],
    content: (
      <>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20"><Zap className="text-purple-400" size={24} /></div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Quick Start Guide</h1>
        </div>
        <p className="text-lg text-zinc-400 leading-relaxed mb-10">
          Ready to dive into the matrix? Here is exactly how to initialize your workspace, run your first algorithmic visualization, and begin executing production-grade code.
        </p>

        <div className="space-y-12">
          <div>
            <h2 id="authentication" className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-mono text-zinc-400">1</span>
              Authentication
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">Before accessing the 60FPS Visualizer Engine or creating Community threads, you must securely authenticate your session.</p>
            <div className="bg-[#050505] p-5 rounded-xl border border-white/[0.05]">
              <ul className="space-y-3 text-sm text-zinc-300">
                <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-sky-500 mt-0.5 shrink-0" /> Click <strong className="text-white">Get Started</strong> or <strong className="text-white">Sign In</strong> in the top right navigation.</li>
                <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-sky-500 mt-0.5 shrink-0" /> Authenticate via your preferred provider (Google or GitHub).</li>
                <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-sky-500 mt-0.5 shrink-0" /> Complete your developer profile setup to unlock the Community Matrix.</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 id="visualization" className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-mono text-zinc-400">2</span>
              Running a Visualization
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">The core of AlgoLib is its deterministic visualization HUD.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-[#050505] p-5 border border-white/[0.05] rounded-xl">
                 <Network className="text-teal-400 mb-2" size={20} />
                 <h4 className="text-white font-medium mb-1">Select Topology</h4>
                 <p className="text-xs text-zinc-400">Open the Visualizer hub and select data structures like BST, Graphs, or Linked Lists.</p>
               </div>
               <div className="bg-[#050505] p-5 border border-white/[0.05] rounded-xl">
                 <Activity className="text-pink-400 mb-2" size={20} />
                 <h4 className="text-white font-medium mb-1">Inject State</h4>
                 <p className="text-xs text-zinc-400">Use the control panel to insert values, delete nodes, or run standard traversal algorithms.</p>
               </div>
            </div>
          </div>

          <div>
            <h2 id="execution" className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-mono text-zinc-400">3</span>
              Code Execution
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">Test your logic against our secure remote execution environments.</p>
            <div className="bg-sky-500/10 border border-sky-500/20 p-5 rounded-xl">
              <p className="text-sm text-sky-200">
                 Navigate to the <strong>Multi-Language Compiler</strong>. You can write Python, Java, or C++ directly in the browser. Hit <code>Compile & Execute</code> to stream standard output back in seconds.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  },
  // CATEGORY: SUPPORT & FAQ
  {
    id: "support-faq",
    category: "Help & Resources",
    icon: <MessageSquare size={18} />,
    title: "Support & FAQ",
    textContent: "Support & FAQ Encountering an error or have deep architecture doubts? Our direct channels are always open. Frequently Asked Questions Q: Is my code execution environment secure? A: Yes. All code executed in the arena or compiler is securely sandboxed in isolated remote containers, or alternatively, runs safely in local browser memory. Q: Can I run this offline? A: AlgoLib is built as a Progressive Web App (PWA). You can install it on your device and use the core Visualizer Engine entirely offline without ever losing framerate. Developer Support For bug reports, system failures, or business inquiries, contact the core engineering team directly. Email: prateeksinghrajawat2006@gmail.com Response Time: We monitor telemetry and support queues rigorously. Expect an initial technical evaluation within 12-24 hours.",
    sections: [
      { id: "faq", title: "Frequently Asked Questions" },
      { id: "direct-support", title: "Developer Support" }
    ],
    content: (
      <>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-white">Support & FAQ</h1>
        </div>
        <p className="text-lg text-zinc-400 leading-relaxed mb-10">
          Encountering an error or have deep architecture doubts? Our direct channels are always open. Here are the most common questions, along with our direct support matrix.
        </p>

        <h2 id="faq" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">Frequently Asked Questions</h2>
        
        <div className="space-y-4 mb-12">
          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6">
            <h4 className="text-white font-medium mb-2 flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> Is my code execution isolated?</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">Yes. All code executed in the arena or compiler is securely sandboxed in isolated remote containers (for contest evaluation) or natively via advanced WebAssembly protocols ensuring complete safety.</p>
          </div>
          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6">
            <h4 className="text-white font-medium mb-2 flex items-center gap-2"><Zap size={16} className="text-yellow-500"/> Can I run the Visualizer offline?</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">Absolutely. AlgoLib is built as a Progressive Web App (PWA). You can install it on your device and use the core Visualizer Engine entirely offline without any performance degradation.</p>
          </div>
          <div className="bg-[#050505] border border-white/[0.05] rounded-2xl p-6">
            <h4 className="text-white font-medium mb-2 flex items-center gap-2"><Lock size={16} className="text-purple-500"/> Are my Saved Snippets public?</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">By default, anything you save to your personal snippet vault is entirely private. Only posts you explicitly share on the "Community" hub are visible to the network.</p>
          </div>
        </div>

        <h2 id="direct-support" className="text-2xl font-semibold text-white mt-12 mb-6 border-b border-white/[0.05] pb-2">Developer Support</h2>
        <div className="bg-sky-500/10 border border-sky-500/20 p-8 rounded-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/20 blur-[50px]" />
           <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
             <div>
               <h3 className="text-xl font-bold text-white mb-2">Direct Contact Array</h3>
               <p className="text-sm text-sky-200/70 mb-4 max-w-md">For bug reports, arena failures, or enterprise business inquiries, contact the core engineering team directly through our encrypted pipeline.</p>
               
               <div className="flex items-center gap-3 text-sm">
                 <span className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded-md font-mono text-white">prateeksinghrajawat2006@gmail.com</span>
               </div>
             </div>
             
             <a href="mailto:prateeksinghrajawat2006@gmail.com" className="shrink-0 bg-white text-black font-semibold text-sm px-6 py-3 rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10">
               Ping Network
             </a>
           </div>
        </div>
      </>
    )
  }
];

const categories = Array.from(new Set(docData.map(doc => doc.category)));

const Docs = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const [activePageId, setActivePageId] = useState("introduction");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    categories.reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
  );

  const activeDoc = useMemo(() => docData.find(d => d.id === activePageId) || docData[0], [activePageId]);

  // Derive a dynamic description snippet for the active document SEO
  const activeDocDescription = activeDoc.textContent.substring(0, 160).trim() + "...";

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return docData.filter(doc => 
      doc.title.toLowerCase().includes(query) || 
      doc.textContent.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleSelectPage = (id: string) => {
    setActivePageId(id);
    setSearchQuery("");
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    // Modified root layout to strictly flex-col and added padding-top to clear the fixed global Navbar
    <div className="min-h-screen bg-[#060606] text-zinc-300 font-sans flex flex-col pt-16 md:pt-20 selection:bg-sky-500/30 selection:text-white">
      
      {/* --- DYNAMIC SEO METADATA --- */}
      <Helmet>
        <title>{`${activeDoc.title} | AlgoLib Documentation`}</title>
        <meta name="title" content={`${activeDoc.title} | AlgoLib Documentation`} />
        <meta name="description" content={activeDocDescription} />
        <meta name="keywords" content={`AlgoLib docs, ${activeDoc.category.toLowerCase()}, ${activeDoc.title.toLowerCase()}, DSA visualizer documentation, competitive programming guide`} />
        
        <link rel="canonical" href="https://algolib.netlify.app/docs/" />

        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://algolib.netlify.app/docs/" />
        <meta property="og:title" content={`${activeDoc.title} | AlgoLib Documentation`} />
        <meta property="og:description" content={activeDocDescription} />
        <meta property="og:image" content="https://ik.imagekit.io/g7e4hyclo/Screenshot%202026-04-11%20235856.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${activeDoc.title} | AlgoLib Documentation`} />
        <meta name="twitter:description" content={activeDocDescription} />
        <meta name="twitter:image" content="https://ik.imagekit.io/g7e4hyclo/Screenshot%202026-04-11%20235856.png" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "headline": activeDoc.title,
            "description": activeDocDescription,
            "publisher": {
              "@type": "Organization",
              "name": "AlgoLib"
            }
          })}
        </script>
      </Helmet>

      {/* INJECTED NAVBAR COMPONENT */}
      <div className="fixed top-0 left-0 w-full z-[100]">
        <Navbar />
      </div>

      {/* Main Container */}
      <div className="flex flex-col md:flex-row flex-1 relative w-full">
        
        {/* MOBILE HEADER (Adjusted top offset to account for global Navbar) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/[0.05] bg-[#0A0A0A] sticky top-[64px] md:top-[80px] z-50">
          <Link to="/" className="flex items-center gap-2 font-bold text-white tracking-tight">
             ALGO<span className="text-zinc-500">LIB</span> <span className="text-xs font-normal text-sky-400 border border-sky-400/30 px-1.5 py-0.5 rounded-md ml-1 bg-sky-400/10">Docs</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-400">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* LEFT SIDEBAR (Adjusted offsets so it sticks beneath the global Navbar) */}
        <aside className={`
          ${isMobileMenuOpen ? 'flex' : 'hidden'} 
          md:flex fixed md:sticky top-[136px] md:top-[80px] h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] w-full md:w-[300px] lg:w-[320px] 
          bg-[#09090b] border-r border-white/[0.05] z-40 flex-col shadow-[20px_0_40px_rgba(0,0,0,0.5)] md:shadow-none
        `}>
          <div className="p-6 shrink-0 border-b border-white/[0.02]">
            <Link to="/" className="hidden md:flex items-center gap-2 font-bold text-white tracking-tight mb-8">
              ALGO<span className="text-zinc-500">LIB</span> <span className="text-xs font-normal text-sky-400 border border-sky-400/30 px-1.5 py-0.5 rounded-md ml-1 bg-sky-400/10">Docs</span>
            </Link>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation..." 
                className="w-full bg-[#111] border border-white/[0.05] rounded-xl pl-10 pr-12 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 focus:bg-[#151515] transition-all placeholder:text-zinc-600 shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 pointer-events-none opacity-60">
                <kbd className="font-mono text-[10px] bg-white/[0.05] border border-white/[0.1] rounded px-1.5 py-0.5 text-zinc-400">⌘</kbd>
                <kbd className="font-mono text-[10px] bg-white/[0.05] border border-white/[0.1] rounded px-1.5 py-0.5 text-zinc-400">K</kbd>
              </div>
              
              <AnimatePresence>
                {searchQuery && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0A0A0A] border border-white/[0.1] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 max-h-[350px] overflow-y-auto custom-scrollbar"
                  >
                    {searchResults.length > 0 ? (
                      <div className="flex flex-col">
                        {searchResults.map(res => (
                          <button 
                            key={res.id} 
                            onClick={() => handleSelectPage(res.id)}
                            className="text-left px-4 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.04] transition-colors flex flex-col gap-1"
                          >
                            <div className="text-[13px] font-semibold text-white">{res.title}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">{res.icon} {res.category}</div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-zinc-500 flex flex-col items-center gap-2">
                        <Search size={20} className="text-zinc-700" />
                        No deep results found.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 pt-6 pb-20 md:pb-6">
            <nav className="flex flex-col gap-2">
              {categories.map((category) => {
                const categoryDocs = docData.filter(d => d.category === category);
                return (
                  <div key={category} className="mb-4 last:mb-0">
                    <button 
                      onClick={() => toggleCategory(category)}
                      className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition-colors group"
                    >
                      {category}
                      <ChevronRight size={14} className={`text-zinc-600 transition-transform duration-200 ${expandedCategories[category] ? "rotate-90 text-zinc-400" : ""}`} />
                    </button>
                    
                    <AnimatePresence>
                      {expandedCategories[category] && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-1 mt-2">
                            {categoryDocs.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleSelectPage(item.id)}
                                className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-xl text-[14px] transition-all ${
                                  activePageId === item.id 
                                    ? "text-white bg-white/[0.05] font-medium shadow-sm" 
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                                }`}
                              >
                                <span className={activePageId === item.id ? "text-sky-400" : "text-zinc-600"}>{item.icon}</span>
                                {item.title}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 px-6 py-12 md:px-16 md:py-20 overflow-x-hidden relative">
           <motion.div 
             key={activePageId} 
             initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}
             className="max-w-3xl"
           >
             <Link to="/" className="inline-flex md:hidden items-center text-sm font-medium text-zinc-500 hover:text-white transition-colors mb-10 bg-white/[0.02] border border-white/[0.05] px-3 py-1.5 rounded-lg">
               <ArrowLeft size={16} className="mr-2" /> Back to App
             </Link>

             {activeDoc.content}

           </motion.div>
          <AppFooter />
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden xl:block w-[280px] shrink-0 pt-20 pr-10">
          <div className="sticky top-20">
            {activeDoc.sections.length > 0 && (
              <>
                <h4 className="text-[11px] font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} className="text-sky-400" /> On This Page
                </h4>
                <nav className="flex flex-col gap-4 border-l-2 border-white/[0.05] pl-4 relative">
                  {activeDoc.sections.map((section) => (
                    <a 
                      key={section.id} 
                      href={`#${section.id}`}
                      className="text-[13px] text-zinc-400 hover:text-white transition-colors leading-tight relative group"
                    >
                      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-white/[0.1] group-hover:bg-sky-400 transition-colors" />
                      {section.title}
                    </a>
                  ))}
                </nav>
              </>
            )}

            <div className="mt-16 pt-8 border-t border-white/[0.05] flex flex-col gap-4 bg-[#080808]">
               <Link to="/support" className="text-[13px] text-zinc-400 hover:text-white flex items-center justify-between group p-3 rounded-xl border border-transparent hover:border-white/[0.05] hover:bg-white/[0.02] transition-all">
                 <span>Need support?</span>
                 <ArrowLeft size={14} className="rotate-135 text-zinc-600 group-hover:text-white transition-colors" />
               </Link>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default Docs;