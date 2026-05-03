import { auth } from './firebase';

export interface CPProblem {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
  platform: string;
  order_index: number;
  is_completed: boolean;
  needs_revision: boolean;
}

export type ProgressField = 'is_completed' | 'needs_revision';

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.getIdToken();
}

export async function getCPProgress(): Promise<CPProblem[]> {
  const token = await getToken();
  const res = await fetch('/.netlify/functions/get-cp-progress', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.problems as CPProblem[];
}

export async function toggleCPStatus(problemId: string, field: ProgressField, value: boolean): Promise<void> {
  const token = await getToken();
  const res = await fetch('/.netlify/functions/toggle-cp-status', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem_id: problemId, field, value }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}
