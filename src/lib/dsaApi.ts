import { auth } from './firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DSAProblem {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.getIdToken();
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Fetches all DSA problems merged with the current user's progress.
 */
export async function getDSAProgress(): Promise<DSAProblem[]> {
  const token = await getToken();

  const res = await fetch('/.netlify/functions/get-dsa-progress', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.problems as DSAProblem[];
}

/**
 * Optimistically toggles is_completed or needs_revision for a problem.
 * @param problemId - The UUID of the dsa_problem row
 * @param field     - 'is_completed' | 'needs_revision'
 * @param value     - The new boolean value
 */
export async function toggleDSAStatus(
  problemId: string,
  field: ProgressField,
  value: boolean
): Promise<void> {
  const token = await getToken();

  const res = await fetch('/.netlify/functions/toggle-dsa-status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ problem_id: problemId, field, value }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}
