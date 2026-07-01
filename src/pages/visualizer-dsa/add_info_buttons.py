import os
import re

visualizers = [
    ("QueueVisualizer.tsx", "Queue", "A Queue is a linear data structure that follows the First-In-First-Out (FIFO) principle. Elements are added at the rear and removed from the front.", "You can **Enqueue** (insert) elements at the rear or **Dequeue** (remove) elements from the front."),
    ("StackVisualizer.tsx", "Stack", "A Stack is a linear data structure that follows the Last-In-First-Out (LIFO) principle. Elements are added and removed from the top.", "You can **Push** (insert) elements onto the top or **Pop** (remove) elements from the top."),
    ("SortingVisualizer.tsx", "Sorting", "Sorting algorithms arrange elements in a specific order (ascending or descending).", "You can visualize algorithms like Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, and Quick Sort to understand their behavior and time complexities."),
    ("BSTVisualizer.tsx", "Binary Search Tree", "A Binary Search Tree (BST) is a tree data structure where each node has at most two children. The left child's value is less than the parent's, and the right child's value is greater.", "You can **Insert** nodes, **Delete** nodes, or **Search** for specific values. In-order traversal of a BST yields sorted elements."),
    ("GraphVisualizer.tsx", "Graph", "A Graph is a non-linear data structure consisting of vertices (nodes) and edges (connections). They can be directed or undirected, weighted or unweighted.", "You can visualize traversal algorithms like **BFS** and **DFS**, or shortest path algorithms like **Dijkstra**."),
    ("HeapVisualizer.tsx", "Heap", "A Heap is a specialized tree-based data structure that satisfies the heap property. In a Max-Heap, for any given node I, the value of I is greater than or equal to the values of its children.", "You can **Insert** elements, **Extract Max/Min**, or **Heapify** an array to understand priority queue operations.")
]

for file, name, desc1, desc2 in visualizers:
    if not os.path.exists(file):
        print(f"Skipping {file}, does not exist")
        continue

    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add imports (Info, Settings2, X, Activity)
    imports_to_add = []
    for imp in ['Info', 'Settings2', 'X', 'Activity']:
        if not re.search(rf'\b{imp}\b', content[:1500]):
            imports_to_add.append(imp)
            
    if imports_to_add:
        # Find lucide-react import
        lucide_match = re.search(r'import\s+\{([^}]+)\}\s+from\s+[\'"]lucide-react[\'"];', content)
        if lucide_match:
            existing_imports = lucide_match.group(1).strip()
            new_imports = existing_imports + ', ' + ', '.join(imports_to_add)
            content = content.replace(lucide_match.group(0), f"import {{ {new_imports} }} from 'lucide-react';")

    # 2. Add state
    if "const [showInfo, setShowInfo]" not in content:
        # Find where to insert state (after a useState or similar)
        state_match = re.search(r'const\s+\[[^\]]+\]\s*=\s*useState[^;]+;', content)
        if state_match:
            content = content[:state_match.end()] + "\n  const [showInfo, setShowInfo] = useState<boolean>(false);" + content[state_match.end():]

    # 3. Add header to Controls Block 1
    # Search for Controls Block 1 and the div following it
    block1_pattern = r'(\{\/\*\s*Controls Block 1\s*\*\/\}\s*<div[^>]*>)'
    if "Settings2" not in content and "Controls" not in content:
        # Avoid adding it twice if it exists
        def replacer(m):
            header = '''
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <Settings2 size={18} /> Controls
            </div>
            <button 
              onClick={() => setShowInfo(true)}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
            >
              <Info size={16} />
            </button>
          </div>
          <div className="space-y-4">'''
            # If the next element is not space-y-4, we just add the header and let the rest be
            return m.group(1) + header

        # First, ensure we wrap the existing content if needed, but actually since we are just adding to the top of the padding container, it's fine
        # We need to be careful with space-y-4. Let's just insert it right after the opening div.
        content = re.sub(r'(\{\/\*\s*Controls Block 1\s*\*\/\}\s*<div[^>]*>)(\s*<div[^>]*>)', 
                         lambda m: m.group(1) + '''
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <Settings2 size={18} /> Controls
            </div>
            <button 
              onClick={() => setShowInfo(true)}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
            >
              <Info size={16} />
            </button>
          </div>''' + m.group(2), content, count=1)

    # 4. Add modal at the end (before last </div>)
    if "Info Modal" not in content:
        modal_content = f'''
      {{/* Info Modal */}}
      <AnimatePresence>
        {{showInfo && (
          <motion.div 
            initial={{{{ opacity: 0 }}}} 
            animate={{{{ opacity: 1 }}}} 
            exit={{{{ opacity: 0 }}}}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-2xl"
          >
            <motion.div 
              initial={{{{ scale: 0.95, y: 10 }}}} 
              animate={{{{ scale: 1, y: 0 }}}} 
              exit={{{{ scale: 0.95, y: 10 }}}}
              className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative"
            >
              <button 
                onClick={{() => setShowInfo(false)}}
                className="absolute top-4 right-4 h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={{16}} />
              </button>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Activity className="text-emerald-500" /> {name} Visualizer
              </h3>
              
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 mt-4 h-max overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
                <p>
                  {desc1}
                </p>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-4">Key Operations</h4>
                <p>
                  {desc2}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}}
      </AnimatePresence>
'''
        # Insert before the last </div>
        # Find the last </div> before ); or just use r'</div>\s*</div>\s*\);\s*\};\s*export default'
        # Since files vary, we can find the last "</div>" before "  );\n};"
        # We'll use a regex to replace `</div>\s*\);\s*\};` with `</div>` + modal_content + `</div>\n  );\n};`
        # Wait, the structure is:
        #     </AnimatePresence>
        #   </div>
        # );
        content = re.sub(r'(</div>\s*\);\s*\};)', lambda m: modal_content + "\n" + m.group(1), content)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file}")
