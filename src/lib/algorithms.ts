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

export async function fetchVisitCount(): Promise<number> {
  try {
    const res = await fetch("https://api.counterapi.dev/v1/algolib.netlify.app/visits/up");
    const data = await res.json();
    return data.count ?? 0;
  } catch {
    return 0;
  }
}

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
