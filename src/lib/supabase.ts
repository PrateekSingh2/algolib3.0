export type SupabaseRow = Record<string, unknown>;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

const buildUrl = (path: string) => `${SUPABASE_URL}${path}`;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured.");
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${details}`);
  }

  if (response.status === 204) {
    return [] as T;
  }

  return (await response.json()) as T;
}

export const supabaseClient = {
  select: <T = SupabaseRow[]>(table: string, query: string) =>
    request<T>(`/rest/v1/${table}?${query}`, {
      method: "GET",
      headers: { Prefer: "count=exact" },
    }),
  insert: <T = SupabaseRow[]>(table: string, payload: unknown, options?: { onConflict?: string; upsert?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.onConflict) params.set("on_conflict", options.onConflict);

    return request<T>(`/rest/v1/${table}${params.toString() ? `?${params.toString()}` : ""}`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: options?.upsert ? { Prefer: "resolution=merge-duplicates,return=representation" } : undefined,
    });
  },
  update: <T = SupabaseRow[]>(table: string, query: string, payload: unknown) =>
    request<T>(`/rest/v1/${table}?${query}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
