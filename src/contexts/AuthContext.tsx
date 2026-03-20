import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { supabaseClient } from "@/lib/supabase";

export interface AppUserProfile {
  id: string;
  firebase_uid?: string | null;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  has_seen_welcome?: boolean;
  college?: string | null;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  github_url?: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: AppUserProfile | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const asFilter = (column: string, value: string) => `${column}=eq.${encodeURIComponent(value)}`;
const benignSupabaseCodes = ["22P02", "42703", "PGRST100"];

const isBenignSupabaseColumnOrCastError = (error: unknown) => {
  const text = error instanceof Error ? error.message : String(error);
  return benignSupabaseCodes.some((code) => text.includes(`"${code}"`) || text.includes(code));
};

const trySelectOne = async (query: string) => {
  try {
    const rows = await supabaseClient.select<AppUserProfile[]>("users", query);
    return rows[0] || null;
  } catch (error) {
    if (isBenignSupabaseColumnOrCastError(error)) return null;
    throw error;
  }
};

const findProfile = async (firebaseUser: User): Promise<AppUserProfile | null> => {
  const email = firebaseUser.email?.trim();

  if (email) {
    const byEmail = await trySelectOne(`select=*&${asFilter("email", email)}&limit=1`);
    if (byEmail) return byEmail;
  }

  const byFirebaseUid = await trySelectOne(`select=*&${asFilter("firebase_uid", firebaseUser.uid)}&limit=1`);
  if (byFirebaseUid) return byFirebaseUid;

  return null;
};

const tryInsertProfile = async (payload: Record<string, unknown>) => {
  const rows = await supabaseClient.insert<AppUserProfile[]>("users", payload);
  return rows[0] || null;
};

const ensureProfile = async (firebaseUser: User): Promise<AppUserProfile | null> => {
  const existing = await findProfile(firebaseUser);
  if (existing) {
    if (!existing.firebase_uid) {
      try {
        await supabaseClient.update<AppUserProfile[]>("users", asFilter("id", existing.id), {
          firebase_uid: firebaseUser.uid,
        });
      } catch {
        // If firebase_uid column is typed incompatibly/missing, keep running with id/email based mapping.
      }
    }
    return existing;
  }

  const fullPayload: Record<string, unknown> = {
    firebase_uid: firebaseUser.uid,
    email: firebaseUser.email,
    full_name: firebaseUser.displayName,
    display_name: firebaseUser.displayName,
    avatar_url: firebaseUser.photoURL,
    has_seen_welcome: false,
  };

  try {
    return await tryInsertProfile(fullPayload);
  } catch (error) {
    if (!isBenignSupabaseColumnOrCastError(error)) throw error;

    // Fallback for legacy/mismatched schemas; insert the smallest payload likely to pass.
    return tryInsertProfile({
      full_name: firebaseUser.displayName,
      display_name: firebaseUser.displayName,
      avatar_url: firebaseUser.photoURL,
      has_seen_welcome: false,
    });
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const refreshed = await findProfile(user);
    setProfile(refreshed);
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const syncedProfile = await ensureProfile(firebaseUser);
        setProfile(syncedProfile);
      } catch (error) {
        console.error("Failed to sync Firebase user with Supabase users table", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({ user, loading, profile, refreshProfile }), [user, loading, profile, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
