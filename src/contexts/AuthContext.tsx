import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { User, onAuthStateChanged, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

export interface AppUserProfile {
  id: string;
  firebase_uid?: string | null;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  has_seen_welcome?: boolean;
  is_profile_complete?: boolean; // <-- NEW COLUMN ADDED HERE
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

export const executeGoogleSignIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Google Sign-In failed:", error);
    toast.error("Sign-in cancelled or failed.");
  }
};

export const executeGithubSignIn = async () => {
  try {
    const provider = new GithubAuthProvider();
    await signInWithPopup(auth, provider);
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