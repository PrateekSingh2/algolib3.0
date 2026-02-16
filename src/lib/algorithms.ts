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
  const res = await fetch(GIST_URL);
  const data = await res.json();
  cachedAlgorithms = data as Algorithm[];
  return cachedAlgorithms;
}

const STORAGE_KEY = "algolib_global_visits";

export const getVisitCount = async (): Promise<number> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored, 10) : 285; // Default starting count
};

export const incrementVisitCount = async (): Promise<number> => {
  const current = await getVisitCount();
  const newVal = current + 1;
  localStorage.setItem(STORAGE_KEY, newVal.toString());
  return newVal;
};

export const reduceVisitCount = async (amount: number): Promise<number> => {
  const current = await getVisitCount();
  // Ensure count doesn't go below 0
  const newVal = Math.max(0, current - amount);
  localStorage.setItem(STORAGE_KEY, newVal.toString());
  return newVal;
};
export const fetchVisitCount = getVisitCount;

export function getCategories(algorithms: Algorithm[]): string[] {
  const cats = new Set<string>();
  algorithms.forEach((a) => cats.add(a.category));
  return Array.from(cats);
}

export function getAllTags(algorithms: Algorithm[]): string[] {
  const tags = new Set<string>();
  algorithms.forEach((a) => a.tags?.forEach((t) => tags.add(t)));
  return Array.from(tags);
}
