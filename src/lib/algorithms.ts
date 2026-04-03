import { db, ref, get, set, runTransaction } from "./firebase";

// ============================================================================
// 2. ALGORITHM INTERFACES & FETCHING (GIST)
// ============================================================================

export interface Algorithm {
  id: string;
  title: string;
  category: string;
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  tags: string[];
  codeJava: string;
  codeCpp: string;
  codePython: string;
}

const GIST_URL =
  "https://gist.githubusercontent.com/PrateekSingh2/c1016b41398f598bb21891f2b53dabd0/raw/algorithms.json";

// Fallback sample algorithms
const FALLBACK_ALGORITHMS: Algorithm[] = [
  {
    id: "merge-sort",
    title: "Merge Sort",
    category: "Sorting",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    description: "Divide-and-conquer sorting algorithm that divides array into halves recursively.",
    tags: ["Sorting", "Divide & Conquer", "Stable"],
    codePython: "def merge_sort(arr):\n  if len(arr) <= 1:\n    return arr\n  mid = len(arr) // 2\n  left = merge_sort(arr[:mid])\n  right = merge_sort(arr[mid:])\n  return merge(left, right)",
    codeJava: "public static void mergeSort(int[] arr, int l, int r) {\n  if (l < r) {\n    int m = l + (r - l) / 2;\n    mergeSort(arr, l, m);\n    mergeSort(arr, m + 1, r);\n    merge(arr, l, m, r);\n  }\n}",
    codeCpp: "void mergeSort(vector<int>& arr, int l, int r) {\n  if (l < r) {\n    int m = l + (r - l) / 2;\n    mergeSort(arr, l, m);\n    mergeSort(arr, m + 1, r);\n    merge(arr, l, m, r);\n  }\n}"
  },
  {
    id: "binary-search",
    title: "Binary Search",
    category: "Searching",
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    description: "Search algorithm that works on sorted arrays by repeatedly dividing search interval.",
    tags: ["Searching", "Logarithmic", "Two Pointers"],
    codePython: "def binary_search(arr, target):\n  left, right = 0, len(arr) - 1\n  while left <= right:\n    mid = (left + right) // 2\n    if arr[mid] == target:\n      return mid\n    elif arr[mid] < target:\n      left = mid + 1\n    else:\n      right = mid - 1\n  return -1",
    codeJava: "public static int binarySearch(int[] arr, int target) {\n  int left = 0, right = arr.length - 1;\n  while (left <= right) {\n    int mid = left + (right - left) / 2;\n    if (arr[mid] == target) return mid;\n    else if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}",
    codeCpp: "int binarySearch(vector<int>& arr, int target) {\n  int left = 0, right = arr.size() - 1;\n  while (left <= right) {\n    int mid = left + (right - left) / 2;\n    if (arr[mid] == target) return mid;\n    else if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}"
  },
  {
    id: "dfs-graph",
    title: "Depth First Search",
    category: "Graphs",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    description: "Traversal algorithm that explores as far as possible along each branch.",
    tags: ["Graphs", "Traversal", "Recursion"],
    codePython: "def dfs(graph, node, visited=None):\n  if visited is None:\n    visited = set()\n  visited.add(node)\n  for neighbor in graph[node]:\n    if neighbor not in visited:\n      dfs(graph, neighbor, visited)\n  return visited",
    codeJava: "public void dfs(Map<Integer, List<Integer>> graph, int node, Set<Integer> visited) {\n  visited.add(node);\n  for (int neighbor : graph.getOrDefault(node, new ArrayList<>())) {\n    if (!visited.contains(neighbor)) {\n      dfs(graph, neighbor, visited);\n    }\n  }\n}",
    codeCpp: "void dfs(vector<vector<int>>& graph, int node, vector<bool>& visited) {\n  visited[node] = true;\n  for (int neighbor : graph[node]) {\n    if (!visited[neighbor]) {\n      dfs(graph, neighbor, visited);\n    }\n  }\n}"
  },
  {
    id: "bfs-graph",
    title: "Breadth First Search",
    category: "Graphs",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    description: "Traversal algorithm that explores all vertices at the present depth level.",
    tags: ["Graphs", "Traversal", "Queue"],
    codePython: "from collections import deque\ndef bfs(graph, start):\n  visited = set()\n  queue = deque([start])\n  visited.add(start)\n  while queue:\n    node = queue.popleft()\n    for neighbor in graph[node]:\n      if neighbor not in visited:\n        visited.add(neighbor)\n        queue.append(neighbor)",
    codeJava: "public void bfs(Map<Integer, List<Integer>> graph, int start) {\n  Set<Integer> visited = new HashSet<>();\n  Queue<Integer> queue = new LinkedList<>();\n  queue.add(start);\n  visited.add(start);\n  while (!queue.isEmpty()) {\n    int node = queue.poll();\n    for (int neighbor : graph.getOrDefault(node, new ArrayList<>())) {\n      if (!visited.contains(neighbor)) {\n        visited.add(neighbor);\n        queue.add(neighbor);\n      }\n    }\n  }\n}",
    codeCpp: "void bfs(vector<vector<int>>& graph, int start) {\n  vector<bool> visited(graph.size(), false);\n  queue<int> q;\n  q.push(start);\n  visited[start] = true;\n  while (!q.empty()) {\n    int node = q.front();\n    q.pop();\n    for (int neighbor : graph[node]) {\n      if (!visited[neighbor]) {\n        visited[neighbor] = true;\n        q.push(neighbor);\n      }\n    }\n  }\n}"
  },
  {
    id: "fibonacci",
    title: "Fibonacci Sequence",
    category: "Dynamic Programming",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    description: "Classic DP problem computing fibonacci numbers with memoization.",
    tags: ["Dynamic Programming", "Recursion", "Memoization"],
    codePython: "def fib(n, memo=None):\n  if memo is None:\n    memo = {}\n  if n in memo:\n    return memo[n]\n  if n <= 1:\n    return n\n  memo[n] = fib(n-1, memo) + fib(n-2, memo)\n  return memo[n]",
    codeJava: "public static int fib(int n, Map<Integer, Integer> memo) {\n  if (memo.containsKey(n)) return memo.get(n);\n  if (n <= 1) return n;\n  int result = fib(n - 1, memo) + fib(n - 2, memo);\n  memo.put(n, result);\n  return result;\n}",
    codeCpp: "int fib(int n, unordered_map<int, int>& memo) {\n  if (memo.count(n)) return memo[n];\n  if (n <= 1) return n;\n  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);\n  return memo[n];\n}"
  },
  {
    id: "inorder-traversal",
    title: "Binary Tree Inorder Traversal",
    category: "Trees",
    timeComplexity: "O(n)",
    spaceComplexity: "O(h)",
    description: "Traverse binary tree in left-root-right order.",
    tags: ["Trees", "Traversal", "DFS"],
    codePython: "def inorder(node):\n  if node is None:\n    return []\n  return inorder(node.left) + [node.val] + inorder(node.right)",
    codeJava: "public List<Integer> inorder(TreeNode node) {\n  List<Integer> result = new ArrayList<>();\n  if (node == null) return result;\n  result.addAll(inorder(node.left));\n  result.add(node.val);\n  result.addAll(inorder(node.right));\n  return result;\n}",
    codeCpp: "vector<int> inorder(TreeNode* node) {\n  vector<int> result;\n  if (!node) return result;\n  auto left = inorder(node->left);\n  result.insert(result.end(), left.begin(), left.end());\n  result.push_back(node->val);\n  auto right = inorder(node->right);\n  result.insert(result.end(), right.begin(), right.end());\n  return result;\n}"
  },
  {
    id: "longest-palindrome",
    title: "Longest Palindromic Substring",
    category: "Strings",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    description: "Find the longest contiguous palindromic substring in a string.",
    tags: ["Strings", "Dynamic Programming", "Palindrome"],
    codePython: "def longest_palindrome(s):\n  if not s:\n    return ''\n  start = 0\n  max_len = 0\n  for i in range(len(s)):\n    len1 = expand_around_center(s, i, i)\n    len2 = expand_around_center(s, i, i+1)\n    length = max(len1, len2)\n    if length > max_len:\n      max_len = length\n      start = i - (length - 1) // 2\n  return s[start:start + max_len]",
    codeJava: "public String longestPalindrome(String s) {\n  if (s.length() < 2) return s;\n  int start = 0, maxLen = 0;\n  for (int i = 0; i < s.length(); i++) {\n    int len1 = expandAroundCenter(s, i, i);\n    int len2 = expandAroundCenter(s, i, i + 1);\n    int len = Math.max(len1, len2);\n    if (len > maxLen) {\n      maxLen = len;\n      start = i - (len - 1) / 2;\n    }\n  }\n  return s.substring(start, start + maxLen);\n}",
    codeCpp: "string longestPalindrome(string s) {\n  if (s.length() < 2) return s;\n  int start = 0, maxLen = 0;\n  for (int i = 0; i < s.length(); i++) {\n    int len1 = expandAroundCenter(s, i, i);\n    int len2 = expandAroundCenter(s, i, i + 1);\n    int len = max(len1, len2);\n    if (len > maxLen) {\n      maxLen = len;\n      start = i - (len - 1) / 2;\n    }\n  }\n  return s.substr(start, maxLen);\n}"
  },
  {
    id: "n-queens",
    title: "N-Queens Problem",
    category: "Backtracking",
    timeComplexity: "O(N!)",
    spaceComplexity: "O(N)",
    description: "Place N queens on an NxN chessboard such that no two queens attack each other.",
    tags: ["Backtracking", "Recursion", "Constraint Satisfaction"],
    codePython: "def solve_nqueens(n):\n  def backtrack(row, cols, diag1, diag2):\n    if row == n:\n      return 1\n    count = 0\n    for col in range(n):\n      if col not in cols and row-col not in diag1 and row+col not in diag2:\n        count += backtrack(row+1, cols|{col}, diag1|{row-col}, diag2|{row+col})\n    return count\n  return backtrack(0, set(), set(), set())",
    codeJava: "public int solveNQueens(int n) {\n  return backtrack(0, new HashSet<>(), new HashSet<>(), new HashSet<>(), n);\n}\nprivate int backtrack(int row, Set<Integer> cols, Set<Integer> diag1, Set<Integer> diag2, int n) {\n  if (row == n) return 1;\n  int count = 0;\n  for (int col = 0; col < n; col++) {\n    if (!cols.contains(col) && !diag1.contains(row-col) && !diag2.contains(row+col)) {\n      cols.add(col);\n      diag1.add(row-col);\n      diag2.add(row+col);\n      count += backtrack(row + 1, cols, diag1, diag2, n);\n      cols.remove(col);\n      diag1.remove(row-col);\n      diag2.remove(row+col);\n    }\n  }\n  return count;\n}",
    codeCpp: "int solveNQueens(int n) {\n  unordered_set<int> cols, diag1, diag2;\n  return backtrack(0, cols, diag1, diag2, n);\n}\nint backtrack(int row, unordered_set<int>& cols, unordered_set<int>& diag1, unordered_set<int>& diag2, int n) {\n  if (row == n) return 1;\n  int count = 0;\n  for (int col = 0; col < n; col++) {\n    if (!cols.count(col) && !diag1.count(row-col) && !diag2.count(row+col)) {\n      cols.insert(col); diag1.insert(row-col); diag2.insert(row+col);\n      count += backtrack(row + 1, cols, diag1, diag2, n);\n      cols.erase(col); diag1.erase(row-col); diag2.erase(row+col);\n    }\n  }\n  return count;\n}"
  },
  {
    id: "linked-list-cycle",
    title: "Linked List Cycle Detection",
    category: "Linked Lists",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    description: "Detect if a linked list has a cycle using Floyd's cycle-finding algorithm.",
    tags: ["Linked Lists", "Two Pointers", "Floyd Algorithm"],
    codePython: "def has_cycle(head):\n  fast = slow = head\n  while fast and fast.next:\n    slow = slow.next\n    fast = fast.next.next\n    if slow == fast:\n      return True\n  return False",
    codeJava: "public boolean hasCycle(ListNode head) {\n  ListNode fast = head, slow = head;\n  while (fast != null && fast.next != null) {\n    slow = slow.next;\n    fast = fast.next.next;\n    if (slow == fast) return true;\n  }\n  return false;\n}",
    codeCpp: "bool hasCycle(ListNode* head) {\n  ListNode* fast = head, slow = head;\n  while (fast && fast->next) {\n    slow = slow->next;\n    fast = fast->next->next;\n    if (slow == fast) return true;\n  }\n  return false;\n}"
  },
  {
    id: "hamming-distance",
    title: "Hamming Distance",
    category: "Bit Manipulation",
    timeComplexity: "O(1)",
    spaceComplexity: "O(1)",
    description: "Count number of bit positions where two numbers differ.",
    tags: ["Bit Manipulation", "XOR", "Brian Kernighan"],
    codePython: "def hamming_distance(x, y):\n  xor = x ^ y\n  count = 0\n  while xor:\n    count += xor & 1\n    xor >>= 1\n  return count",
    codeJava: "public int hammingDistance(int x, int y) {\n  int xor = x ^ y;\n  int count = 0;\n  while (xor > 0) {\n    count += xor & 1;\n    xor >>= 1;\n  }\n  return count;\n}",
    codeCpp: "int hammingDistance(int x, int y) {\n  int xor = x ^ y, count = 0;\n  while (xor) {\n    count += xor & 1;\n    xor >>= 1;\n  }\n  return count;\n}"
  },
  {
    id: "two-sum",
    title: "Two Sum",
    category: "Two Pointers",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    description: "Find two numbers in array that add up to a target sum.",
    tags: ["Two Pointers", "Hash Map", "Array"],
    codePython: "def two_sum(nums, target):\n  seen = {}\n  for i, num in enumerate(nums):\n    complement = target - num\n    if complement in seen:\n      return [seen[complement], i]\n    seen[num] = i\n  return []",
    codeJava: "public int[] twoSum(int[] nums, int target) {\n  Map<Integer, Integer> map = new HashMap<>();\n  for (int i = 0; i < nums.length; i++) {\n    int complement = target - nums[i];\n    if (map.containsKey(complement)) {\n      return new int[]{map.get(complement), i};\n    }\n    map.put(nums[i], i);\n  }\n  return new int[]{};\n}",
    codeCpp: "vector<int> twoSum(vector<int>& nums, int target) {\n  unordered_map<int, int> map;\n  for (int i = 0; i < nums.size(); i++) {\n    int complement = target - nums[i];\n    if (map.count(complement)) {\n      return {map[complement], i};\n    }\n    map[nums[i]] = i;\n  }\n  return {};\n}"
  },
  {
    id: "max-subarray",
    title: "Maximum Subarray (Kadane's Algorithm)",
    category: "Sliding Window",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    description: "Find contiguous subarray with the largest sum.",
    tags: ["Sliding Window", "Dynamic Programming", "Array"],
    codePython: "def max_subarray(nums):\n  max_current = max_global = nums[0]\n  for i in range(1, len(nums)):\n    max_current = max(nums[i], max_current + nums[i])\n    max_global = max(max_global, max_current)\n  return max_global",
    codeJava: "public int maxSubArray(int[] nums) {\n  int maxCurrent = maxGlobal = nums[0];\n  for (int i = 1; i < nums.length; i++) {\n    maxCurrent = Math.max(nums[i], maxCurrent + nums[i]);\n    maxGlobal = Math.max(maxGlobal, maxCurrent);\n  }\n  return maxGlobal;\n}",
    codeCpp: "int maxSubArray(vector<int>& nums) {\n  int maxCurrent = maxGlobal = nums[0];\n  for (int i = 1; i < nums.size(); i++) {\n    maxCurrent = max(nums[i], maxCurrent + nums[i]);\n    maxGlobal = max(maxGlobal, maxCurrent);\n  }\n  return maxGlobal;\n}"
  },
  {
    id: "quick-sort",
    title: "Quick Sort",
    category: "Sorting",
    timeComplexity: "O(n log n) avg",
    spaceComplexity: "O(log n)",
    description: "Divide-and-conquer sorting using pivot partitioning.",
    tags: ["Sorting", "Divide & Conquer", "In-place"],
    codePython: "def quick_sort(arr):\n  if len(arr) <= 1:\n    return arr\n  pivot = arr[len(arr)//2]\n  left = [x for x in arr if x < pivot]\n  middle = [x for x in arr if x == pivot]\n  right = [x for x in arr if x > pivot]\n  return quick_sort(left) + middle + quick_sort(right)",
    codeJava: "public static void quickSort(int[] arr, int low, int high) {\n  if (low < high) {\n    int pi = partition(arr, low, high);\n    quickSort(arr, low, pi - 1);\n    quickSort(arr, pi + 1, high);\n  }\n}",
    codeCpp: "void quickSort(vector<int>& arr, int low, int high) {\n  if (low < high) {\n    int pi = partition(arr, low, high);\n    quickSort(arr, low, pi - 1);\n    quickSort(arr, pi + 1, high);\n  }\n}"
  }
];

let cachedAlgorithms: Algorithm[] | null = null;

export async function fetchAlgorithms(): Promise<Algorithm[]> {
  if (cachedAlgorithms) {
    console.log("Returning cached algorithms:", cachedAlgorithms.length);
    return cachedAlgorithms;
  }
  try {
    const res = await fetch(GIST_URL);
    const data = await res.json();

    // Handle both single object and array responses
    let algorithms = Array.isArray(data) ? data : [data];

    // Normalize category names to title case for consistent filtering
    algorithms = algorithms.map((algo: any) => ({
      ...algo,
      category: algo.category ? algo.category.charAt(0).toUpperCase() + algo.category.slice(1).toLowerCase() : algo.category
    }));

    // Filter to only valid algorithms with required fields
    algorithms = algorithms.filter((algo: any) =>
      algo.id && algo.title && algo.category && algo.description
    );


    // If no valid algorithms from Gist, use fallback
    if (algorithms.length === 0) {
      console.log("Using FALLBACK_ALGORITHMS:", FALLBACK_ALGORITHMS.length);
      cachedAlgorithms = FALLBACK_ALGORITHMS;
    } else {
      cachedAlgorithms = algorithms as Algorithm[];
    }

    return cachedAlgorithms;
  } catch (error) {
    console.error("Failed to fetch algorithms from Gist, using fallback:", error);
    cachedAlgorithms = FALLBACK_ALGORITHMS;
    console.log("Fallback algorithms loaded:", FALLBACK_ALGORITHMS.length);
    return FALLBACK_ALGORITHMS;
  }
}

// ============================================================================
// 3. GLOBAL VIEW COUNT LOGIC (FIREBASE REALTIME DATABASE)
// ============================================================================

const DB_PATH = 'site_stats/visits';

/**
 * READ: Fetches the current global visit count from Firebase.
 */
export const getVisitCount = async (): Promise<number> => {
  try {
    const countRef = ref(db, DB_PATH);
    const snapshot = await get(countRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return 0; // Default if DB is empty
    }
  } catch (error) {
    console.error("Error reading views from Firebase:", error);
    return 0; // Fallback to 0 on error
  }
};

/**
 * INCREMENT: Atomically increments the view count by 1.
 * Safe for concurrent users.
 */
export const incrementVisitCount = async (): Promise<number> => {
  const countRef = ref(db, DB_PATH);
  try {
    const result = await runTransaction(countRef, (currentValue) => {
      return (currentValue || 0) + 1;
    });
    return result.snapshot.val();
  } catch (error) {
    console.error("Error incrementing views:", error);
    return 0;
  }
};

/**
 * REDUCE: Safely reduces the view count by a specific amount.
 * Ensures the count never drops below zero.
 */
export const reduceVisitCount = async (amount: number): Promise<number> => {
  const countRef = ref(db, DB_PATH);
  try {
    const result = await runTransaction(countRef, (currentValue) => {
      const current = currentValue || 0;
      return Math.max(0, current - amount);
    });
    return result.snapshot.val();
  } catch (error) {
    console.error("Error reducing views:", error);
    return 0;
  }
};

/**
 * SET ABSOLUTE: Force sets the view count to a specific number.
 * Useful for Admin "Database Calibration".
 */
export const setGlobalVisitCount = async (newValue: number): Promise<void> => {
  const countRef = ref(db, DB_PATH);
  await set(countRef, newValue);
};

// Alias for backward compatibility
export const fetchVisitCount = getVisitCount;

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================

export function getCategories(algorithms: Algorithm[]): string[] {
  const cats = new Set<string>();
  algorithms.forEach((a) => {
    if (a.category) cats.add(a.category);
  });
  return Array.from(cats);
}

export function getAllTags(algorithms: Algorithm[]): string[] {
  const tags = new Set<string>();
  algorithms.forEach((a) => a.tags?.forEach((t) => tags.add(t)));
  return Array.from(tags);
}