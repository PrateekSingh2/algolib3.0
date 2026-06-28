import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { User, onAuthStateChanged, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

// ─── Session Configuration ────────────────────────────────────────────────────
const SESSION_KEY = "algolib_session_login_ts";
const SESSION_MAX_DAYS = 15;
const SESSION_MAX_MS = SESSION_MAX_DAYS * 24 * 60 * 60 * 1000;

const stampSession = () => {
  localStorage.setItem(SESSION_KEY, Date.now().toString());
};

const isSessionExpired = (): boolean => {
  const ts = localStorage.getItem(SESSION_KEY);
  if (!ts) return false; // No stamp means fresh session — don't boot them
  const age = Date.now() - parseInt(ts, 10);
  return age > SESSION_MAX_MS;
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export interface AppUserProfile {
  id: string;
  firebase_uid?: string | null;
  username?: string | null;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  has_seen_welcome?: boolean;
  is_profile_complete?: boolean; // <-- NEW COLUMN ADDED HERE
  is_verified?: boolean;
  college?: string | null;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  bio?: string | null;
  email_public?: boolean;
  age_public?: boolean;
  location_public?: boolean;
  gender_public?: boolean;
  vectoris_save_history?: boolean;
  vectoris_daily_count?: number;
  vectoris_monthly_count?: number;
  vectoris_last_active_day?: string;
  vectoris_last_active_month?: string;
  deletion_scheduled_at?: string | null;
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

export const executeGoogleSignIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
    stampSession(); // Mark session start time after successful login
  } catch (error) {
    console.error("Google Sign-In failed:", error);
    toast.error("Sign-in cancelled or failed.");
  }
};

export const executeGithubSignIn = async () => {
  try {
    const provider = new GithubAuthProvider();
    await signInWithPopup(auth, provider);
    stampSession(); // Mark session start time after successful login
  } catch (error) {
    console.error("GitHub Sign-In failed:", error);
    toast.error("GitHub Sign-in cancelled or failed.");
  }
};

const syncProfileWithBackend = async (firebaseUser: User): Promise<AppUserProfile | null> => {
  try {
    const token = await firebaseUser.getIdToken();
    const response = await fetch('/.netlify/functions/sync-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      })
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Failed to sync profile:", error);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const refreshed = await syncProfileWithBackend(user);
    setProfile(refreshed);
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

      // ─── 15-Day Session Expiry Check ────────────────────────────────────────
      if (firebaseUser && isSessionExpired()) {
        clearSession();
        await signOut(auth);
        setUser(null);
        setProfile(null);
        setLoading(false);
        toast.info("Your session has expired. Please sign in again.", {
          description: "Sessions expire after 15 days of inactivity for security.",
          duration: 6000,
        });
        return;
      }

      // If user is logging in fresh (no stamp yet), stamp now
      if (firebaseUser && !localStorage.getItem(SESSION_KEY)) {
        stampSession();
      }

      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const syncedProfile = await syncProfileWithBackend(firebaseUser);
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