import { db, ref, get, set, runTransaction } from "./firebase";

// ============================================================================
// 2. ALGORITHM INTERFACES & FETCHING (GIST)
// ============================================================================

export interface Algorithm {
  id: string;
  title: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  tags: string[];
  category: string;
  codeJava: string;
  codeCpp: string;
}

const GIST_URL =
  "https://gist.githubusercontent.com/PrateekSingh2/c1016b41398f598bb21891f2b53dabd0/raw/algorithms.json";

let cachedAlgorithms: Algorithm[] | null = null;

export async function fetchAlgorithms(): Promise<Algorithm[]> {
  if (cachedAlgorithms) return cachedAlgorithms;
  try {
    const res = await fetch(GIST_URL);
    const data = await res.json();
    cachedAlgorithms = data as Algorithm[];
    return cachedAlgorithms;
  } catch (error) {
    console.error("Failed to fetch algorithms from Gist:", error);
    return [];
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