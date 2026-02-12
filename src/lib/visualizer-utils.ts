// Smart wrapper engine for Python Tutor Java visualization

const HELPER_CLASSES = `
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; this.next = null; }
}

class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; this.left = null; this.right = null; }
}
`;

export function wrapForPythonTutor(code: string): string {
  let processed = code.trim();

  // Remove 'public' from class declaration if present
  processed = processed.replace(/public\s+class\s+/g, "class ");

  // Check if main method exists
  const hasMain = /public\s+static\s+void\s+main/.test(processed);

  // Check if it's a standalone class
  const isClass = /^class\s+\w+/.test(processed);

  if (!hasMain && isClass) {
    // Extract class name
    const match = processed.match(/class\s+(\w+)/);
    const className = match ? match[1] : "Solution";
    processed += `\n\nclass Main {\n  public static void main(String[] args) {\n    ${className} sol = new ${className}();\n    System.out.println("Execution complete.");\n  }\n}`;
  } else if (!hasMain && !isClass) {
    processed = `class Main {\n  public static void main(String[] args) {\n    ${processed}\n    System.out.println("Execution complete.");\n  }\n}`;
  }

  // Inject helper classes if code references them
  if (/ListNode|TreeNode/.test(processed)) {
    processed = HELPER_CLASSES + "\n" + processed;
  }

  return processed;
}

export function buildPythonTutorUrl(code: string): string {
  const wrapped = wrapForPythonTutor(code);
  const encoded = encodeURIComponent(wrapped);
  return `https://pythontutor.com/iframe-embed.html#code=${encoded}&codeDivHeight=400&codeDivWidth=350&cumulative=false&curInstr=0&heapPrimitives=nevernest&origin=opt-frontend.js&py=java&rawInputLstJSON=%5B%5D&textReferences=false`;
}

export const CODE_TEMPLATES: Record<string, string> = {
  "Array": `class Main {
  public static void main(String[] args) {
    int[] arr = {5, 3, 8, 1, 2};
    // Sort the array
    for (int i = 0; i < arr.length - 1; i++) {
      for (int j = 0; j < arr.length - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
          int temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
        }
      }
    }
    for (int x : arr) System.out.print(x + " ");
  }
}`,
  "Linked List": `class ListNode {
  int val;
  ListNode next;
  ListNode(int val) { this.val = val; this.next = null; }
}

class Main {
  public static void main(String[] args) {
    ListNode head = new ListNode(1);
    head.next = new ListNode(2);
    head.next.next = new ListNode(3);
    // Traverse
    ListNode curr = head;
    while (curr != null) {
      System.out.print(curr.val + " -> ");
      curr = curr.next;
    }
    System.out.println("null");
  }
}`,
  "Tree": `class TreeNode {
  int val;
  TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

class Main {
  static void inorder(TreeNode root) {
    if (root == null) return;
    inorder(root.left);
    System.out.print(root.val + " ");
    inorder(root.right);
  }

  public static void main(String[] args) {
    TreeNode root = new TreeNode(1);
    root.left = new TreeNode(2);
    root.right = new TreeNode(3);
    root.left.left = new TreeNode(4);
    inorder(root);
  }
}`,
  "Stack": `import java.util.Stack;

class Main {
  public static void main(String[] args) {
    Stack<Integer> stack = new Stack<>();
    stack.push(10);
    stack.push(20);
    stack.push(30);
    System.out.println("Top: " + stack.peek());
    stack.pop();
    System.out.println("After pop: " + stack.peek());
  }
}`,
  "Queue": `import java.util.LinkedList;
import java.util.Queue;

class Main {
  public static void main(String[] args) {
    Queue<Integer> queue = new LinkedList<>();
    queue.add(1);
    queue.add(2);
    queue.add(3);
    System.out.println("Front: " + queue.peek());
    queue.poll();
    System.out.println("After dequeue: " + queue.peek());
  }
}`,
  "Graph": `import java.util.*;

class Main {
  static void bfs(Map<Integer, List<Integer>> graph, int start) {
    Set<Integer> visited = new HashSet<>();
    Queue<Integer> queue = new LinkedList<>();
    queue.add(start);
    visited.add(start);
    while (!queue.isEmpty()) {
      int node = queue.poll();
      System.out.print(node + " ");
      for (int neighbor : graph.getOrDefault(node, new ArrayList<>())) {
        if (!visited.contains(neighbor)) {
          visited.add(neighbor);
          queue.add(neighbor);
        }
      }
    }
  }

  public static void main(String[] args) {
    Map<Integer, List<Integer>> graph = new HashMap<>();
    graph.put(0, Arrays.asList(1, 2));
    graph.put(1, Arrays.asList(0, 3));
    graph.put(2, Arrays.asList(0, 3));
    graph.put(3, Arrays.asList(1, 2));
    bfs(graph, 0);
  }
}`,
};
