-- ═══════════════════════════════════════════════════════════
--  AlgoLib — DSA Practice Sheet Schema + Seed
--  Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Master Problems Table
CREATE TABLE IF NOT EXISTS public.dsa_problems (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  topic        TEXT NOT NULL,
  difficulty   TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  url          TEXT NOT NULL,
  platform     TEXT NOT NULL DEFAULT 'LeetCode',
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User Progress Table
CREATE TABLE IF NOT EXISTS public.dsa_user_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uid        TEXT NOT NULL,
  problem_id      UUID NOT NULL REFERENCES public.dsa_problems(id) ON DELETE CASCADE,
  is_completed    BOOLEAN NOT NULL DEFAULT false,
  needs_revision  BOOLEAN NOT NULL DEFAULT false,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_problem UNIQUE (user_uid, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_dsa_progress_uid ON public.dsa_user_progress(user_uid);

-- 3. Row Level Security
ALTER TABLE public.dsa_problems      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dsa_user_progress ENABLE ROW LEVEL SECURITY;

-- Public read on problems; no client writes
CREATE POLICY "Public read dsa_problems"
  ON public.dsa_problems FOR SELECT USING (true);

-- Users manage only their own progress rows
-- (Netlify functions use service role key and bypass RLS)
CREATE POLICY "Users read own progress"
  ON public.dsa_user_progress FOR SELECT
  USING (user_uid = auth.uid()::text);

CREATE POLICY "Users insert own progress"
  ON public.dsa_user_progress FOR INSERT
  WITH CHECK (user_uid = auth.uid()::text);

CREATE POLICY "Users update own progress"
  ON public.dsa_user_progress FOR UPDATE
  USING (user_uid = auth.uid()::text)
  WITH CHECK (user_uid = auth.uid()::text);

-- 4. Seed — 65 curated problems
INSERT INTO public.dsa_problems (title, topic, difficulty, url, platform, order_index) VALUES
-- Arrays
('Two Sum','Arrays','Easy','https://leetcode.com/problems/two-sum/','LeetCode',1),
('Best Time to Buy and Sell Stock','Arrays','Easy','https://leetcode.com/problems/best-time-to-buy-and-sell-stock/','LeetCode',2),
('Contains Duplicate','Arrays','Easy','https://leetcode.com/problems/contains-duplicate/','LeetCode',3),
('Product of Array Except Self','Arrays','Medium','https://leetcode.com/problems/product-of-array-except-self/','LeetCode',4),
('Maximum Subarray','Arrays','Medium','https://leetcode.com/problems/maximum-subarray/','LeetCode',5),
('Maximum Product Subarray','Arrays','Medium','https://leetcode.com/problems/maximum-product-subarray/','LeetCode',6),
('Find Minimum in Rotated Sorted Array','Arrays','Medium','https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/','LeetCode',7),
('Search in Rotated Sorted Array','Arrays','Medium','https://leetcode.com/problems/search-in-rotated-sorted-array/','LeetCode',8),
('3Sum','Arrays','Medium','https://leetcode.com/problems/3sum/','LeetCode',9),
('Container With Most Water','Arrays','Medium','https://leetcode.com/problems/container-with-most-water/','LeetCode',10),
('Trapping Rain Water','Arrays','Hard','https://leetcode.com/problems/trapping-rain-water/','LeetCode',11),
('Merge Intervals','Arrays','Medium','https://leetcode.com/problems/merge-intervals/','LeetCode',12),
-- Strings
('Valid Anagram','Strings','Easy','https://leetcode.com/problems/valid-anagram/','LeetCode',13),
('Valid Parentheses','Strings','Easy','https://leetcode.com/problems/valid-parentheses/','LeetCode',14),
('Longest Substring Without Repeating Characters','Strings','Medium','https://leetcode.com/problems/longest-substring-without-repeating-characters/','LeetCode',15),
('Longest Palindromic Substring','Strings','Medium','https://leetcode.com/problems/longest-palindromic-substring/','LeetCode',16),
('Group Anagrams','Strings','Medium','https://leetcode.com/problems/group-anagrams/','LeetCode',17),
('Minimum Window Substring','Strings','Hard','https://leetcode.com/problems/minimum-window-substring/','LeetCode',18),
('Valid Palindrome','Strings','Easy','https://leetcode.com/problems/valid-palindrome/','LeetCode',19),
-- Linked List
('Reverse Linked List','Linked List','Easy','https://leetcode.com/problems/reverse-linked-list/','LeetCode',20),
('Merge Two Sorted Lists','Linked List','Easy','https://leetcode.com/problems/merge-two-sorted-lists/','LeetCode',21),
('Reorder List','Linked List','Medium','https://leetcode.com/problems/reorder-list/','LeetCode',22),
('Remove Nth Node From End','Linked List','Medium','https://leetcode.com/problems/remove-nth-node-from-end-of-list/','LeetCode',23),
('Linked List Cycle','Linked List','Easy','https://leetcode.com/problems/linked-list-cycle/','LeetCode',24),
('Merge K Sorted Lists','Linked List','Hard','https://leetcode.com/problems/merge-k-sorted-lists/','LeetCode',25),
('LRU Cache','Linked List','Medium','https://leetcode.com/problems/lru-cache/','LeetCode',26),
-- Trees
('Invert Binary Tree','Trees','Easy','https://leetcode.com/problems/invert-binary-tree/','LeetCode',27),
('Maximum Depth of Binary Tree','Trees','Easy','https://leetcode.com/problems/maximum-depth-of-binary-tree/','LeetCode',28),
('Same Tree','Trees','Easy','https://leetcode.com/problems/same-tree/','LeetCode',29),
('Subtree of Another Tree','Trees','Easy','https://leetcode.com/problems/subtree-of-another-tree/','LeetCode',30),
('Lowest Common Ancestor of BST','Trees','Medium','https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/','LeetCode',31),
('Binary Tree Level Order Traversal','Trees','Medium','https://leetcode.com/problems/binary-tree-level-order-traversal/','LeetCode',32),
('Validate Binary Search Tree','Trees','Medium','https://leetcode.com/problems/validate-binary-search-tree/','LeetCode',33),
('Kth Smallest Element in a BST','Trees','Medium','https://leetcode.com/problems/kth-smallest-element-in-a-bst/','LeetCode',34),
('Binary Tree Maximum Path Sum','Trees','Hard','https://leetcode.com/problems/binary-tree-maximum-path-sum/','LeetCode',35),
-- Graphs
('Number of Islands','Graphs','Medium','https://leetcode.com/problems/number-of-islands/','LeetCode',36),
('Clone Graph','Graphs','Medium','https://leetcode.com/problems/clone-graph/','LeetCode',37),
('Pacific Atlantic Water Flow','Graphs','Medium','https://leetcode.com/problems/pacific-atlantic-water-flow/','LeetCode',38),
('Course Schedule','Graphs','Medium','https://leetcode.com/problems/course-schedule/','LeetCode',39),
('Course Schedule II','Graphs','Medium','https://leetcode.com/problems/course-schedule-ii/','LeetCode',40),
('Graph Valid Tree','Graphs','Medium','https://leetcode.com/problems/graph-valid-tree/','LeetCode',41),
('Number of Connected Components','Graphs','Medium','https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/','LeetCode',42),
('Alien Dictionary','Graphs','Hard','https://leetcode.com/problems/alien-dictionary/','LeetCode',43),
-- Dynamic Programming
('Climbing Stairs','Dynamic Programming','Easy','https://leetcode.com/problems/climbing-stairs/','LeetCode',44),
('House Robber','Dynamic Programming','Medium','https://leetcode.com/problems/house-robber/','LeetCode',45),
('House Robber II','Dynamic Programming','Medium','https://leetcode.com/problems/house-robber-ii/','LeetCode',46),
('Coin Change','Dynamic Programming','Medium','https://leetcode.com/problems/coin-change/','LeetCode',47),
('Longest Common Subsequence','Dynamic Programming','Medium','https://leetcode.com/problems/longest-common-subsequence/','LeetCode',48),
('Word Break','Dynamic Programming','Medium','https://leetcode.com/problems/word-break/','LeetCode',49),
('Combination Sum IV','Dynamic Programming','Medium','https://leetcode.com/problems/combination-sum-iv/','LeetCode',50),
('0/1 Knapsack','Dynamic Programming','Medium','https://www.geeksforgeeks.org/0-1-knapsack-problem-dp-10/','GFG',51),
('Edit Distance','Dynamic Programming','Hard','https://leetcode.com/problems/edit-distance/','LeetCode',52),
('Longest Increasing Subsequence','Dynamic Programming','Medium','https://leetcode.com/problems/longest-increasing-subsequence/','LeetCode',53),
-- Binary Search
('Binary Search','Binary Search','Easy','https://leetcode.com/problems/binary-search/','LeetCode',54),
('Koko Eating Bananas','Binary Search','Medium','https://leetcode.com/problems/koko-eating-bananas/','LeetCode',55),
('Search a 2D Matrix','Binary Search','Medium','https://leetcode.com/problems/search-a-2d-matrix/','LeetCode',56),
('Median of Two Sorted Arrays','Binary Search','Hard','https://leetcode.com/problems/median-of-two-sorted-arrays/','LeetCode',57),
-- Heap
('Kth Largest Element in Array','Heap','Medium','https://leetcode.com/problems/kth-largest-element-in-an-array/','LeetCode',58),
('Top K Frequent Elements','Heap','Medium','https://leetcode.com/problems/top-k-frequent-elements/','LeetCode',59),
('Find Median from Data Stream','Heap','Hard','https://leetcode.com/problems/find-median-from-data-stream/','LeetCode',60),
-- Backtracking
('Combination Sum','Backtracking','Medium','https://leetcode.com/problems/combination-sum/','LeetCode',61),
('Subsets','Backtracking','Medium','https://leetcode.com/problems/subsets/','LeetCode',62),
('Permutations','Backtracking','Medium','https://leetcode.com/problems/permutations/','LeetCode',63),
('Word Search','Backtracking','Medium','https://leetcode.com/problems/word-search/','LeetCode',64),
('N-Queens','Backtracking','Hard','https://leetcode.com/problems/n-queens/','LeetCode',65);
